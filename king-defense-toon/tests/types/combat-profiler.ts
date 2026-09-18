import { createCombatProfiler, collectProfilerCounters } from '../../combat-profiler.ts';
import type { CombatProfiler, ProfilerCounters, ProfilerMetricSnapshot, ProfilerSnapshot } from '../../combat-profiler.ts';
import type { Battle } from '../../combat-types.ts';

export function profilerContracts(battle: Readonly<Battle>): void {
  const profiler: CombatProfiler = createCombatProfiler({ enabled: true, capacity: 300, now: () => 0, targetFps: 30 });
  const counts: ProfilerCounters = collectProfilerCounters(battle, 2);
  const snapshot: ProfilerSnapshot = profiler.snapshot();
  const metric: ProfilerMetricSnapshot = snapshot.metrics.simulation;
  profiler.beginFrame(0); profiler.endFrame(counts);
  const value = { result: 1 };
  const returned: typeof value = profiler.measure('simulation', () => value);
  const asynchronous: Promise<number> = profiler.measure('ui', () => Promise.resolve(1));
  // @ts-expect-error A new arbitrary phase is not silently added to the profiler.
  profiler.measure('database', () => 1);
  // @ts-expect-error Enabling telemetry requires a boolean.
  createCombatProfiler({ enabled: 'true' });
  // @ts-expect-error Clock readings remain numeric wall-time durations.
  createCombatProfiler({ now: () => '1' });
  // @ts-expect-error All diagnostic counters must be supplied together.
  profiler.endFrame({ wave: 1, speed: 1 });
  // @ts-expect-error Telemetry callers cannot change activation after initialization.
  profiler.enabled = false;
  // @ts-expect-error Returned telemetry is a read-only snapshot.
  snapshot.metrics.work.mean = 1;
  // @ts-expect-error Returned counter values are read-only snapshots.
  snapshot.counters.enemies = 99;
  // @ts-expect-error A profiler cannot infer actors from arbitrary save JSON.
  collectProfilerCounters({ gold: 100 }, 1);
  void [metric, returned, asynchronous];
}
