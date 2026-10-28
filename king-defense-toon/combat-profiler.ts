import type { Battle } from './combat-types.ts';

export type ProfilerSection = 'simulation' | 'render' | 'ui';
export type ProfilerMetric = 'interval' | 'work' | ProfilerSection;

export interface ProfilerCounters {
  wave: number;
  speed: number;
  allies: number;
  enemies: number;
  projectiles: number;
  effects: number;
  poisoned: number;
}

export interface ProfilerMetricSnapshot {
  readonly count: number;
  readonly mean: number;
  readonly p95: number;
  readonly max: number;
}

export interface ProfilerSnapshot {
  readonly enabled: boolean;
  readonly capacity: number;
  readonly targetFps: number;
  readonly frameBudgetMs: number;
  readonly slowIntervalThresholdMs: number;
  readonly metrics: Readonly<Record<ProfilerMetric, ProfilerMetricSnapshot>>;
  /** Count in the retained work window; section durations are not frame budgets. */
  readonly budgetOverruns: number;
  /** Accepted-frame intervals beyond the threshold, independent of JS work time. */
  readonly slowIntervals: number;
  readonly counters: Readonly<ProfilerCounters>;
}

export interface CombatProfilerOptions {
  enabled?: boolean;
  capacity?: number;
  now?: () => number;
  targetFps?: number;
}

export interface CombatProfiler {
  readonly enabled: boolean;
  beginFrame(timestamp: number): void;
  endFrame(counters: ProfilerCounters): void;
  measure<T>(section: ProfilerSection, fn: () => T): T;
  suspend(): void;
  reset(): void;
  snapshot(): ProfilerSnapshot;
}

export const DEFAULT_PROFILER_CAPACITY = 300;
export const MAX_PROFILER_CAPACITY = 3600;
const METRICS: readonly ProfilerMetric[] = ['interval', 'work', 'simulation', 'render', 'ui'];
const COUNTERS: readonly (keyof ProfilerCounters)[] = ['wave', 'speed', 'allies', 'enemies', 'projectiles', 'effects', 'poisoned'];
const SECTION_INDEX: Readonly<Record<ProfilerSection, number>> = { simulation: 0, render: 1, ui: 2 };
const emptyMetric = (): ProfilerMetricSnapshot => ({ count: 0, mean: 0, p95: 0, max: 0 });
const emptyCounters = (): ProfilerCounters => ({ wave: 0, speed: 0, allies: 0, enemies: 0, projectiles: 0, effects: 0, poisoned: 0 });
const safeCounter = (value: number): number => Number.isFinite(value) && value >= 0 ? value : 0;

/** Retained actors include corpses; hero counts as an ally and castle does not. */
export function collectProfilerCounters(battle: Readonly<Battle> | null, speed: number, formationCount = 0): ProfilerCounters {
  if (!battle) return { wave: 0, speed: safeCounter(speed), allies: safeCounter(formationCount), enemies: 0, projectiles: 0, effects: 0, poisoned: 0 };
  let poisoned = Number(!!battle.hero.poison && battle.hero.poison.remaining > 0)
    + Number(!!battle.castle.poison && battle.castle.poison.remaining > 0);
  for (const actor of battle.allies) if (actor.poison && actor.poison.remaining > 0) poisoned += 1;
  for (const actor of battle.enemies) if (actor.poison && actor.poison.remaining > 0) poisoned += 1;
  return { wave: battle.waveNumber, speed: safeCounter(speed), allies: battle.allies.length + 1, enemies: battle.enemies.length,
    projectiles: battle.projectiles.length, effects: battle.effects.length, poisoned };
}

interface SampleRing {
  readonly samples: Float64Array;
  size: number;
  cursor: number;
}

function append(ring: SampleRing, sample: number): void {
  ring.samples[ring.cursor] = sample;
  ring.cursor = (ring.cursor + 1) % ring.samples.length;
  ring.size = Math.min(ring.size + 1, ring.samples.length);
}

function summarize(ring: SampleRing | undefined): ProfilerMetricSnapshot {
  if (!ring?.size) return emptyMetric();
  // Sorting happens only when a consumer requests a snapshot, not while recording samples.
  const sorted = Array.from(ring.samples.subarray(0, ring.size)).sort((left, right) => left - right);
  // Incremental mean also stays finite for unusually large but valid clock readings.
  const mean = sorted.reduce((average, sample, index) => average + (sample - average) / (index + 1), 0);
  return { count: sorted.length, mean,
    p95: sorted[Math.ceil(sorted.length * .95) - 1]!, max: sorted[sorted.length - 1]! };
}

function countAbove(ring: SampleRing | undefined, threshold: number): number {
  let count = 0;
  if (ring) for (let index = 0; index < ring.size; index += 1) if (ring.samples[index]! > threshold) count += 1;
  return count;
}

/**
 * Opt-in wall-time telemetry. Frame interval/work use completed accepted renders;
 * sections use synchronous calls, including their nested work. Same-section nesting
 * records the outer call once; different sections are inclusive and must not be summed.
 * Timed callbacks may return promises, but only their synchronous invocation is timed.
 */
export function createCombatProfiler(options: CombatProfilerOptions = {}): CombatProfiler {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Invalid profiler options');
  const { enabled = false, capacity = DEFAULT_PROFILER_CAPACITY, targetFps = 30,
    now = () => performance.now() } = options;
  if (typeof enabled !== 'boolean') throw new TypeError('Profiler enabled must be boolean');
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > MAX_PROFILER_CAPACITY) {
    throw new RangeError(`Profiler capacity must be an integer from 1 to ${MAX_PROFILER_CAPACITY}`);
  }
  if (!Number.isFinite(targetFps) || targetFps < 1 || targetFps > 240) throw new RangeError('Profiler target FPS must be from 1 to 240');
  if (typeof now !== 'function') throw new TypeError('Profiler clock must be a function');
  const frameBudgetMs = 1000 / targetFps;
  // Accepted 30-FPS frames can span three 60-Hz refreshes after slight RAF jitter.
  // This is a scheduling warning; exact JS work overruns use the real frame budget.
  const slowIntervalThresholdMs = frameBudgetMs * 1.5 + 1;
  const rings = enabled ? Object.fromEntries(METRICS.map(metric => [metric,
    { samples: new Float64Array(capacity), size: 0, cursor: 0 }])) as Record<ProfilerMetric, SampleRing> : undefined;
  const sectionDepth = enabled ? new Uint32Array(3) : undefined;
  const latestCounters = enabled ? new Float64Array(COUNTERS.length) : undefined;
  const pendingCounters = enabled ? new Float64Array(COUNTERS.length) : undefined;
  let generation = 0;
  let frameActive = false, frameStartedAt: number | null = null, frameTimestamp = 0;
  let previousTimestamp: number | null = null;

  function readClock(): number | null {
    // Instrumentation must not replace a game's return value or exception if its
    // optional clock fails or becomes invalid during suspension.
    try {
      const value = now();
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    } catch { return null; }
  }

  function suspend(): void {
    if (!enabled) return;
    generation += 1;
    frameActive = false;
    frameStartedAt = null;
    previousTimestamp = null;
    sectionDepth!.fill(0);
  }

  function captureCounters(counters: ProfilerCounters): void {
    if (!counters || typeof counters !== 'object' || Array.isArray(counters)) return;
    // Validate the whole sample before publishing it; never keep caller-owned objects.
    try {
      for (let index = 0; index < COUNTERS.length; index += 1) {
        const value = counters[COUNTERS[index]!];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
        pendingCounters![index] = value;
      }
    } catch { return; }
    latestCounters!.set(pendingCounters!);
  }

  return {
    get enabled() { return enabled; },
    beginFrame(timestamp) {
      if (!enabled) return;
      if (!Number.isFinite(timestamp) || timestamp < 0) { suspend(); return; }
      if (frameActive) suspend();
      if (previousTimestamp !== null && timestamp < previousTimestamp) suspend();
      // A duplicated RAF timestamp does not describe another accepted render.
      if (timestamp === previousTimestamp) return;
      frameActive = true;
      frameTimestamp = timestamp;
      frameStartedAt = readClock();
    },
    endFrame(counters) {
      if (!enabled || !frameActive) return;
      const token = generation;
      const endedAt = readClock();
      if (!frameActive || token !== generation) return;
      if (frameStartedAt !== null && endedAt !== null && endedAt >= frameStartedAt) append(rings!.work, endedAt - frameStartedAt);
      if (previousTimestamp !== null) append(rings!.interval, frameTimestamp - previousTimestamp);
      previousTimestamp = frameTimestamp;
      frameActive = false;
      frameStartedAt = null;
      captureCounters(counters);
    },
    measure<T>(section: ProfilerSection, fn: () => T): T {
      if (!enabled || !Object.hasOwn(SECTION_INDEX, section)) return fn();
      const index = SECTION_INDEX[section], token = generation;
      const outermost = sectionDepth![index] === 0;
      sectionDepth![index] += 1;
      const startedAt = outermost ? readClock() : null;
      try { return fn(); }
      finally {
        // Reset/suspend invalidates the whole old stack. An inner call after it
        // starts a new stack; the abandoned outer finally must not decrement it.
        if (token === generation) {
          sectionDepth![index] -= 1;
          if (outermost && startedAt !== null) {
            const endedAt = readClock();
            if (token === generation && endedAt !== null && endedAt >= startedAt) append(rings![section], endedAt - startedAt);
          }
        }
      }
    },
    suspend,
    reset() {
      if (!enabled) return;
      suspend();
      for (const metric of METRICS) { rings![metric].size = 0; rings![metric].cursor = 0; }
      latestCounters!.fill(0);
    },
    snapshot() {
      const counters = emptyCounters();
      if (enabled) for (let index = 0; index < COUNTERS.length; index += 1) counters[COUNTERS[index]!] = latestCounters![index]!;
      return { enabled, capacity, targetFps, frameBudgetMs, slowIntervalThresholdMs,
        metrics: { interval: summarize(rings?.interval), work: summarize(rings?.work), simulation: summarize(rings?.simulation),
          render: summarize(rings?.render), ui: summarize(rings?.ui) },
        budgetOverruns: countAbove(rings?.work, frameBudgetMs), slowIntervals: countAbove(rings?.interval, slowIntervalThresholdMs), counters };
    },
  };
}
