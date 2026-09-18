import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.mjs';
import { battleFrameDelta } from '../battle-speed.mjs';
import { makeFormation } from '../scripts/combat-balance.mjs';

const TICK = 1 / 60;
const withoutVisualTimers = ({ hitTime, deathTime, ...actor }) => actor;

function runBattle(formation, frameDurations, speed, wave = 9) {
  const battle = createBattle(formation, wave);
  const events = [];
  let frames = 0;
  while (battle.phase === 'running' && frames < 30000) {
    const dt = frameDurations[frames % frameDurations.length];
    events.push(...updateBattle(battle, battleFrameDelta(dt, speed)));
    frames += 1;
  }
  assert.notEqual(battle.phase, 'running', 'the battle must finish within the frame budget');
  // A larger last frame may age the finished battle's cosmetics for more ticks.
  // Gameplay state and the full ordered event stream must still match exactly.
  assert.equal(battle.king, battle.castle, 'the historical king reference remains the castle alias');
  const { stepRemainder, effects, allies, enemies, king, hero, castle, ...state } = battle;
  return { ...state, allies: allies.map(withoutVisualTimers),
    enemies: enemies.map(withoutVisualTimers), king: withoutVisualTimers(king),
    hero: withoutVisualTimers(hero), castle: withoutVisualTimers(castle), events };
}

function assertFrameIndependentBattle(level, outcome) {
  const formation = makeFormation({ swordsman: 4, archer: 1, healer: 2, level });
  const saved = structuredClone(formation);
  formation.forEach(Object.freeze);
  Object.freeze(formation);
  const expected = runBattle(formation, [1 / 60], 1);
  assert.equal(expected.phase, outcome);
  assert.equal(expected.total, 9);
  assert.equal(expected.hero.type, 'hero');
  assert.equal(expected.castle.type, 'castle');
  assert.ok(expected.events.some(event => event.type === 'bow-shot'));
  const rewards = expected.events.filter(event => event.type === 'gold');
  assert.ok(rewards.length > 0, 'both scenarios must exercise kill rewards');
  assert.equal(rewards.length, expected.kills);
  assert.equal(rewards.reduce((total, event) => total + event.amount, 0), expected.reward);
  if (outcome === 'victory') {
    assert.equal(expected.kills, expected.total);
    assert.equal(expected.reward, expected.wave.reward);
    assert.ok(expected.castle.hp > 0);
  } else {
    assert.equal(expected.castle.hp, 0);
    assert.ok(expected.kills < expected.total);
  }
  for (const speed of [1, 2, 3]) {
    for (const durations of [[1 / 20], [1 / 30], [1 / 60], [1 / 60, .041, .024, .1, .012]]) {
      assert.deepEqual(runBattle(formation, durations, speed), expected,
        `speed ${speed}, frames ${durations}`);
    }
  }
  assert.deepEqual(formation, saved, 'combat must not modify the saved army');
}

test('a ninth-wave victory preserves state and events at 20/30/60 FPS, all speeds and jitter', () => {
  // The hero/castle update changed this encounter. A stronger army supplies the
  // victory fixture without treating this timing regression as a balance threshold.
  assertFrameIndependentBattle(20, 'victory');
});

test('the original ninth-wave army now loses identically at every FPS and speed', () => {
  assertFrameIndependentBattle(4, 'defeat');
});

test('partial ticks survive idle updates and cannot leak into a different battle', () => {
  const battle = createBattle([], 1);
  const untouched = createBattle([], 1);
  assert.deepEqual(updateBattle(battle, TICK * .4), []);
  assert.equal(battle.elapsed, 0);
  assert.ok(Math.abs(battle.stepRemainder - TICK * .4) < 1e-12);
  const paused = structuredClone(battle);
  for (const dt of [0, -1, NaN, Infinity, -Infinity, undefined, null, '0.1']) {
    assert.deepEqual(updateBattle(battle, dt), []);
    assert.deepEqual(battle, paused, `ignored delta ${dt} must preserve the complete state`);
  }
  updateBattle(battle, TICK * .6);
  assert.equal(battle.elapsed, TICK);
  assert.ok(battle.stepRemainder < 1e-12);
  assert.equal(untouched.elapsed, 0);
  assert.equal(untouched.stepRemainder, 0);
});

test('a long foreground frame is capped without discarding the prior fractional tick', () => {
  const battle = createBattle([], 1);
  updateBattle(battle, TICK / 2);
  updateBattle(battle, 600);
  assert.ok(Math.abs(battle.elapsed - .3) < 1e-12, 'catch-up is limited to 18 ticks');
  assert.ok(Math.abs(battle.stepRemainder - TICK / 2) < 1e-12);
  updateBattle(battle, TICK / 2);
  assert.ok(Math.abs(battle.elapsed - 19 * TICK) < 1e-12);
  assert.ok(battle.stepRemainder < 1e-12, 'discarded stall time cannot return on the next frame');
});

test('after the result, effects finish without more damage, spawns, rewards or elapsed battle time', () => {
  const battle = createBattle(makeFormation({ swordsman: 1 }), 1);
  battle.phase = 'defeat';
  battle.elapsed = .75;
  battle.king.hp = 0;
  battle.king.action = 'dead';
  battle.king.hitTime = .1;
  battle.effects.push({ id: 1, type: 'arrow', age: 0, duration: .1,
    targetId: battle.allies[0].id, damage: 100 });
  const elapsed = battle.elapsed;
  assert.deepEqual(updateBattle(battle, .3), []);
  assert.equal(battle.king.hp, 0);
  assert.equal(battle.allies[0].hp, battle.allies[0].maxHp, 'an already flying arrow cannot damage survivors');
  assert.equal(battle.king.hitTime, 0);
  assert.ok(Math.abs(battle.king.deathTime - .3) < 1e-12);
  assert.deepEqual(battle.effects, []);
  assert.equal(battle.elapsed, elapsed);
  assert.equal(battle.spawned, 0);
  assert.equal(battle.kills, 0);
  assert.equal(battle.reward, 0);
});
