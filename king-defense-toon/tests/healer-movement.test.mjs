import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, updateBattle } from '../combat.ts';
import { WALKABLE_AREAS } from '../field.ts';
import { BATTLE_SPEEDS } from '../battle-speed.ts';

const DT = 1 / 60;
const formation = ['swordsman', 'lancer', 'swordsman', 'healer', 'healer', 'healer', 'archer', 'archer', 'archer']
  .map((type, index) => ({ id: index + 1, type, level: 10, col: index % 3 + 1, row: Math.floor(index / 3) }));

function runOpening(dt = DT) {
  const battle = createBattle(formation, 20);
  const seen = new Set(), casts = new Map(), stalled = new Map();
  let longestStall = 0;
  for (let step = 0; step < Math.round(30 / dt); step += 1) {
    const before = battle.allies.map(unit => ({ x: unit.x, y: unit.y }));
    updateBattle(battle, dt);
    for (const effect of battle.effects) {
      if (effect.type !== 'heal' || effect.side !== 'ally' || seen.has(effect.id)) continue;
      seen.add(effect.id);
      casts.set(effect.sourceId, (casts.get(effect.sourceId) ?? 0) + 1);
    }
    for (const [index, unit] of battle.allies.entries()) {
      if (unit.type !== 'healer') continue;
      const target = [...battle.allies, battle.hero].find(ally => ally.id === unit.focusId);
      const stationary = unit.hp > 0 && unit.action === 'walk' && unit.cooldown <= 0
        && target?.hp > 0 && target.hp < target.maxHp
        && Math.hypot(unit.x - before[index].x, unit.y - before[index].y) < 2.4 * dt;
      const duration = stationary ? (stalled.get(unit.id) ?? 0) + dt : 0;
      stalled.set(unit.id, duration);
      longestStall = Math.max(longestStall, duration);
    }
  }
  return { battle, casts: [...casts].sort(), longestStall };
}

test('three monks behind a full central army do not run in place instead of healing a wounded frontliner', () => {
  // This unmodified wave reproduced a 4.1-second stall at 60px from a wounded ally.
  const { battle, casts, longestStall } = runOpening();
  assert.ok(longestStall < 1, `a healer was blocked without casting for ${longestStall.toFixed(2)}s`);
  for (const id of ['ally-4', 'ally-5', 'ally-6']) {
    assert.ok(casts.some(([sourceId, count]) => sourceId === id && count > 1), `${id} must contribute healing`);
  }
  assert.equal(battle.elapsed.toFixed(3), '30.000');
});

const hold = unit => Object.assign(unit, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

function supportEncounter({ distance = 75 } = {}) {
  const battle = createBattle(formation, 20);
  for (let step = 0; step < 51; step += 1) updateBattle(battle, DT);
  battle.allies.forEach((ally, index) => {
    hold(ally);
    Object.assign(ally, { x: 40 + index * 27, y: 400 });
  });
  battle.enemies.forEach(hold);
  hold(battle.hero);
  Object.assign(battle.hero, { x: 340, y: 400 });
  const patient = battle.allies[0], healer = battle.allies[5];
  Object.assign(patient, { x: 195, y: 320 - distance, hp: Math.floor(patient.maxHp / 2) });
  Object.assign(healer, { x: 195, y: 320, action: 'idle', cooldown: 0, focusId: null });
  return { battle, patient, healer };
}

test('crowd navigation preserves the existing healing initiation distance', () => {
  for (const [distance, action] of [[57.5, 'heal'], [58, 'walk'], [75, 'walk']]) {
    const { battle, patient, healer } = supportEncounter({ distance });
    updateBattle(battle, DT);
    assert.equal(healer.action, action, `patient at ${distance}px must use the existing cast threshold`);
    if (action === 'heal') assert.equal(healer.targetId, patient.id);
  }
});

test('a monk outside heal range goes around blocking support without teleporting or leaving land', () => {
  const { battle, patient, healer } = supportEncounter({ distance: 105 });
  Object.assign(battle.allies[3], { x: 181.5, y: 285 });
  Object.assign(battle.allies[4], { x: 208.5, y: 285 });
  const hp = patient.hp;
  let firstHeal = null;
  let greatestSideStep = 0;
  for (let step = 0; step < 8 * 60; step += 1) {
    const before = { x: healer.x, y: healer.y };
    updateBattle(battle, DT);
    greatestSideStep = Math.max(greatestSideStep, Math.abs(healer.x - 195));
    if (healer.action === 'heal') assert.ok(Math.hypot(healer.x - patient.x, healer.y - patient.y) <= 57.5);
    if (patient.hp > hp) { firstHeal = battle.elapsed; break; }
    assert.ok(WALKABLE_AREAS.some(area => healer.x >= area.left && healer.x <= area.right
      && healer.y >= area.top && healer.y <= area.bottom));
    assert.ok(Math.hypot(healer.x - before.x, healer.y - before.y) <= (47 * COMBAT_PACE + 80) * DT + 1e-6);
  }
  assert.ok(firstHeal !== null, 'rear monk must reach casting range around the two support allies');
  assert.ok(greatestSideStep > 25, 'monk goes around the allied support instead of through it');
});

test('monk healing and crowd navigation remain identical at 30/60/120 FPS and x1.5/x2/x3', () => {
  const expected = runOpening();
  const snapshot = ({ battle, casts }) => ({
    phase: battle.phase, kills: battle.kills, castles: battle.castle.hp,
    allies: [...battle.allies, battle.hero].map(({ hp, x, y, action, cooldown }) => ({ hp, x, y, action, cooldown })),
    enemies: battle.enemies.map(({ hp, x, y }) => ({ hp, x, y })), casts,
  });
  for (const fps of [30, 60, 120]) {
    for (const speed of BATTLE_SPEEDS) assert.deepEqual(snapshot(runOpening(speed / fps)), snapshot(expected));
  }
});
