import assert from 'node:assert/strict';
import test from 'node:test';
import { updateBattle } from '../combat.ts';
import { setBattleVisualEffectLimit } from '../combat-visuals.ts';
import { COMBAT_STRESS_SCENARIOS, COMBAT_STRESS_STEP_SECONDS, COMBAT_STRESS_MAX_SECONDS,
  getCombatStressScenario, createCombatStressBattle, combatStressSnapshot,
  combatStressFingerprint } from '../combat-stress.ts';
import { getWaveDefinition, ENEMY_TYPES } from '../waves.ts';
import { parseProfileCombatArgs, profileCombatScenario } from '../scripts/profile-combat.mjs';

function simulate(id, visualsEnabled, seconds = 6) {
  const battle = createCombatStressBattle(id), events = [];
  if (!visualsEnabled) setBattleVisualEffectLimit(battle, 0);
  for (let step = 0; step < seconds * 60 && battle.phase === 'running'; step++) {
    events.push(...updateBattle(battle, COMBAT_STRESS_STEP_SECONDS));
  }
  return { battle, snapshot: combatStressSnapshot(battle), events, fingerprint: combatStressFingerprint(battle) };
}

test('scenario definitions are frozen and every run owns its mutable combat state', () => {
  const definitions = JSON.stringify(COMBAT_STRESS_SCENARIOS);
  assert.ok(Object.isFrozen(COMBAT_STRESS_SCENARIOS));
  for (const scenario of COMBAT_STRESS_SCENARIOS) {
    assert.ok(Object.isFrozen(scenario));
    assert.ok(Object.isFrozen(scenario.formation));
    assert.ok(scenario.formation.every(Object.isFrozen));
    const first = createCombatStressBattle(scenario.id), second = createCombatStressBattle(scenario.id);
    assert.notEqual(first, second);
    for (const key of ['allies', 'enemies', 'hero', 'castle', 'effects', 'projectiles', 'wave']) {
      assert.notEqual(first[key], second[key], `${scenario.id}: ${key}`);
    }
    assert.notEqual(first.wave.spawns, second.wave.spawns);
    assert.equal(first.king, first.castle);
    const secondBefore = combatStressSnapshot(second);
    first.allies[0].hp = 1;
    updateBattle(first, COMBAT_STRESS_STEP_SECONDS);
    assert.deepEqual(combatStressSnapshot(second), secondBefore);
  }
  assert.equal(JSON.stringify(COMBAT_STRESS_SCENARIOS), definitions, 'battle work cannot mutate formation definitions');
});

test('synthetic workload is explicitly labelled and does not modify campaign catalogue data', () => {
  const before = JSON.stringify(getWaveDefinition(39)), enemiesBefore = JSON.stringify(ENEMY_TYPES);
  const scenario = getCombatStressScenario('mixed-skills'), battle = createCombatStressBattle('mixed-skills');
  assert.equal(scenario.kind, 'synthetic-stress');
  assert.match(scenario.description, /synthetic|not a normal campaign/i);
  assert.equal(battle.wave.spawns.length, 36);
  assert.ok(battle.wave.spawns.some(spawn => spawn.type === 'plagueAlchemist'));
  assert.ok(battle.wave.spawns.some(spawn => spawn.type === 'goblinHealer'));
  assert.ok(battle.wave.spawns.every(spawn => Object.isFrozen(spawn)));
  for (let step = 0; step < 60; step++) updateBattle(battle, COMBAT_STRESS_STEP_SECONDS);
  assert.equal(JSON.stringify(getWaveDefinition(39)), before);
  assert.equal(JSON.stringify(ENEMY_TYPES), enemiesBefore);
  assert.throws(() => createCombatStressBattle('missing'), RangeError);
});

test('fresh scenario runs and zero-cosmetic runs converge on exact gameplay state and ordered events', () => {
  for (const scenario of COMBAT_STRESS_SCENARIOS) {
    const first = simulate(scenario.id, true), repeat = simulate(scenario.id, true), disabled = simulate(scenario.id, false);
    assert.deepEqual(repeat.snapshot, first.snapshot, `${scenario.id}: repeat state`);
    assert.deepEqual(repeat.events, first.events, `${scenario.id}: repeat events`);
    assert.equal(repeat.fingerprint, first.fingerprint);
    assert.deepEqual(disabled.snapshot, first.snapshot, `${scenario.id}: no-cosmetics state`);
    assert.deepEqual(disabled.events, first.events, `${scenario.id}: no-cosmetics events`);
    assert.equal(disabled.fingerprint, first.fingerprint);
    assert.equal(disabled.battle.effects.length, 0);
  }
});

test('snapshots are detached and fingerprints reflect gameplay rather than cosmetic limits', () => {
  const battle = createCombatStressBattle('opening'), snapshot = combatStressSnapshot(battle);
  const original = combatStressFingerprint(battle);
  snapshot.allies[0].hp = 0;
  assert.notEqual(battle.allies[0].hp, 0);
  setBattleVisualEffectLimit(battle, 0);
  assert.equal(combatStressFingerprint(battle), original);
  battle.allies[0].hp--;
  assert.notEqual(combatStressFingerprint(battle), original);
});

test('CLI options reject unbounded durations, unknown scenarios and ambiguous arguments', () => {
  assert.deepEqual(parseProfileCombatArgs([]), { scenario: 'all', seconds: 30 });
  assert.deepEqual(parseProfileCombatArgs(['--seconds', '60', '--scenario', 'mixed-skills']),
    { scenario: 'mixed-skills', seconds: COMBAT_STRESS_MAX_SECONDS });
  for (const args of [['--seconds', '0'], ['--seconds', '61'], ['--seconds', '1.5'],
    ['--seconds', 'NaN'], ['--seconds', 'Infinity'], ['--seconds', ''], ['--seconds'],
    ['--scenario', 'unknown'], ['--scenario'], ['--unknown', 'x'],
    ['--seconds', '1', '--seconds', '2'], ['--scenario', 'opening', '--scenario', 'all']]) {
    assert.throws(() => parseProfileCombatArgs(args), RangeError, args.join(' '));
  }
});

test('CPU report measures fixed updates only, enforces the duration bound and compares visual modes', () => {
  let clock = 0;
  const report = profileCombatScenario('opening', 1, { now: () => ++clock });
  assert.equal(report.stateMatchesWithoutVisuals, true);
  assert.equal(report.eventsMatchWithoutVisuals, true);
  assert.equal(report.runs.length, 2);
  for (const run of report.runs) {
    assert.equal(run.steps, 60);
    assert.equal(run.stopReason, 'duration-limit');
    assert.ok(Math.abs(run.simulatedSeconds - 1) < 1e-8);
    assert.deepEqual(run.cpu, { samples: 60, meanMs: 1, p95Ms: 1, maxMs: 1 });
    assert.ok(run.peaks.actors >= 5);
    assert.match(run.summary.fingerprint, /^[a-f0-9]{8}$/);
  }
  assert.equal(report.runs[1].peaks.effects, 0);
  assert.throws(() => profileCombatScenario('opening', 61), RangeError);
  assert.throws(() => profileCombatScenario('missing', 1), RangeError);
});

test('the mixed stress fixture actually exercises poison, hammer, stun and both sides of healing', () => {
  const battle = createCombatStressBattle('mixed-skills'), seenFlights = new Set(), healSources = new Set();
  let sawPoison = false, sawStun = false;
  for (let step = 0; step < 30 * 60 && battle.phase === 'running'; step++) {
    const events = updateBattle(battle, COMBAT_STRESS_STEP_SECONDS);
    battle.projectiles.forEach(projectile => seenFlights.add(projectile.type));
    for (const event of events) if (event.type === 'heal') healSources.add(event.sourceType);
    sawPoison ||= [...battle.allies, battle.hero].some(actor => actor.poison);
    sawStun ||= battle.enemies.some(actor => actor.stunTime > 0);
  }
  assert.ok(seenFlights.has('arrow'));
  assert.ok(seenFlights.has('poison-bottle'));
  assert.ok(seenFlights.has('hero-hammer'));
  assert.ok(sawPoison);
  assert.ok(sawStun);
  assert.ok(healSources.has('hero'));
  assert.ok(healSources.has('healer'));
  assert.ok(healSources.has('goblinHealer'));
});
