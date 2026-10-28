import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { updateBattle } from '../combat.ts';
import { setBattleVisualEffectLimit } from '../combat-visuals.ts';
import { COMBAT_STRESS_SCENARIOS, COMBAT_STRESS_STEP_SECONDS, COMBAT_STRESS_DEFAULT_SECONDS,
  COMBAT_STRESS_MAX_SECONDS, getCombatStressScenario, createCombatStressBattle,
  combatStressSnapshot, combatStressFingerprint } from '../combat-stress.ts';

function validateSeconds(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > COMBAT_STRESS_MAX_SECONDS) {
    throw new RangeError(`--seconds must be an integer from 1 to ${COMBAT_STRESS_MAX_SECONDS}`);
  }
  return seconds;
}

export function parseProfileCombatArgs(args) {
  const options = { scenario: 'all', seconds: COMBAT_STRESS_DEFAULT_SECONDS };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (!['--scenario', '--seconds'].includes(option) || seen.has(option)) {
      throw new RangeError(`Unknown or repeated option: ${option}`);
    }
    seen.add(option);
    const value = args[++index];
    if (typeof value !== 'string' || value.startsWith('--') || value.trim() === '') {
      throw new RangeError(`Missing value for ${option}`);
    }
    if (option === '--scenario') {
      if (value !== 'all' && !getCombatStressScenario(value)) throw new RangeError(`Unknown scenario: ${value}`);
      options.scenario = value;
    } else options.seconds = validateSeconds(Number(value));
  }
  return options;
}

function timings(samples) {
  const sorted = [...samples].sort((first, second) => first - second);
  return { samples: samples.length, meanMs: samples.reduce((sum, sample) => sum + sample, 0) / samples.length,
    p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], maxMs: sorted.at(-1) };
}

function run(id, seconds, visualsEnabled, now) {
  const battle = createCombatStressBattle(id), samples = [], events = [];
  if (!visualsEnabled) setBattleVisualEffectLimit(battle, 0);
  const peaks = { actors: battle.allies.length + 2, livingActors: battle.allies.length + 2,
    projectiles: 0, effects: 0 };
  const observed = { projectileTypes: new Set(), poisonedActors: 0, stunnedActors: 0,
    heroHeals: 0, allyHeals: 0, enemyHeals: 0 };
  const maxSteps = seconds * 60;
  let steps = 0;
  while (battle.phase === 'running' && steps < maxSteps) {
    // Only updateBattle is timed: counters, JSON, checksums and scene drawing are excluded.
    const started = now();
    const emitted = updateBattle(battle, COMBAT_STRESS_STEP_SECONDS);
    const duration = now() - started;
    if (!Number.isFinite(duration) || duration < 0) throw new RangeError('Profiler clock must be monotonic');
    samples.push(duration);
    events.push(...emitted);
    steps++;
    const actors = [...battle.allies, ...battle.enemies, battle.hero, battle.castle];
    peaks.actors = Math.max(peaks.actors, actors.length);
    peaks.livingActors = Math.max(peaks.livingActors, actors.filter(actor => actor.hp > 0).length);
    peaks.projectiles = Math.max(peaks.projectiles, battle.projectiles.length);
    peaks.effects = Math.max(peaks.effects, battle.effects.length);
    for (const projectile of battle.projectiles) observed.projectileTypes.add(projectile.type);
    observed.poisonedActors = Math.max(observed.poisonedActors, actors.filter(actor => actor.poison).length);
    observed.stunnedActors = Math.max(observed.stunnedActors, actors.filter(actor => actor.stunTime > 0).length);
    for (const event of emitted) if (event.type === 'heal') {
      if (event.sourceType === 'hero') observed.heroHeals++;
      else if (event.side === 'ally') observed.allyHeals++;
      else observed.enemyHeals++;
    }
  }
  return { snapshot: combatStressSnapshot(battle), events,
    report: { visualsEnabled, steps, requestedSeconds: seconds, simulatedSeconds: battle.elapsed,
      stopReason: battle.phase === 'running' ? 'duration-limit' : 'battle-result', cpu: timings(samples), peaks,
      observed: { ...observed, projectileTypes: [...observed.projectileTypes].sort() },
      summary: { phase: battle.phase, spawned: battle.spawned, enemies: battle.total,
        kills: battle.kills, reward: battle.reward, castleHp: battle.castle.hp, heroHp: battle.hero.hp,
        livingAllies: battle.allies.filter(actor => actor.hp > 0).length,
        livingEnemies: battle.enemies.filter(actor => actor.hp > 0).length,
        nextProjectileId: battle.nextProjectileId, events: events.length,
        fingerprint: combatStressFingerprint(battle) },
    },
  };
}

export function profileCombatScenario(id, seconds = COMBAT_STRESS_DEFAULT_SECONDS, { now = () => performance.now() } = {}) {
  const scenario = getCombatStressScenario(id);
  if (!scenario) throw new RangeError(`Unknown scenario: ${id}`);
  validateSeconds(seconds);
  const enabled = run(id, seconds, true, now), disabled = run(id, seconds, false, now);
  return { id, label: scenario.label, kind: scenario.kind, description: scenario.description,
    stateMatchesWithoutVisuals: JSON.stringify(enabled.snapshot) === JSON.stringify(disabled.snapshot),
    eventsMatchWithoutVisuals: JSON.stringify(enabled.events) === JSON.stringify(disabled.events),
    runs: [enabled.report, disabled.report] };
}

export function profileCombat(options = parseProfileCombatArgs([])) {
  const { scenario, seconds } = options;
  if (scenario !== 'all' && !getCombatStressScenario(scenario)) throw new RangeError(`Unknown scenario: ${scenario}`);
  validateSeconds(seconds);
  const selected = scenario === 'all' ? COMBAT_STRESS_SCENARIOS : [getCombatStressScenario(scenario)];
  return { schemaVersion: 1, runtime: process.version, stepSeconds: COMBAT_STRESS_STEP_SECONDS,
    measurement: 'CPU time inside updateBattle only; not FPS, rendering time or physical-device acceptance.',
    comparison: 'Single sequential runs include JIT/GC variation. Timing differences are diagnostic, not proof of a speedup.',
    peakSampling: 'Counters sampled after each fixed simulation step; within-step transients are not counted.',
    scenarios: selected.map(item => profileCombatScenario(item.id, seconds)) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = profileCombat(parseProfileCombatArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.scenarios.some(scenario => !scenario.stateMatchesWithoutVisuals || !scenario.eventsMatchWithoutVisuals)) {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
