import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.mjs';
import { makeFormation } from '../scripts/combat-balance.mjs';

const DT = 1 / 60;

function traceMovement(wave, formation) {
  const battle = createBattle(formation, wave);
  const fighters = new Map(battle.allies.filter(unit => unit.type === 'swordsman').map(unit => [unit.id, {
    firstMove: null, firstAttack: null, archerHits: 0, moved: 0,
    farStill: 0, maxFarStill: 0, deadFocus: 0, maxDeadFocus: 0, retargets: 0,
  }]));
  let lastEffect = 0;
  while (battle.phase === 'running' && battle.elapsed < 180) {
    const previous = new Map(battle.allies.map(unit => [unit.id, {
      x: unit.x, y: unit.y, focusId: unit.focusId,
    }]));
    updateBattle(battle, DT);
    for (const unit of battle.allies) {
      const trace = fighters.get(unit.id);
      if (!trace || unit.hp <= 0) continue;
      const before = previous.get(unit.id);
      const travelled = Math.hypot(unit.x - before.x, unit.y - before.y);
      trace.moved += travelled;
      if (travelled > .01) trace.firstMove ??= battle.elapsed;
      if (unit.action === 'attack') trace.firstAttack ??= battle.elapsed;
      if (before.focusId && unit.focusId && before.focusId !== unit.focusId) trace.retargets++;
      const target = battle.enemies.find(enemy => enemy.id === unit.focusId);
      // Separate crowding from a normal windup/cooldown or a gap between spawn groups.
      const waitingOutsideReach = target?.hp > 0 && unit.cooldown <= 0
        && unit.action !== 'attack' && Math.hypot(unit.x - target.x, unit.y - target.y) > unit.range + 6;
      trace.farStill = waitingOutsideReach && travelled < .025 ? trace.farStill + DT : 0;
      trace.maxFarStill = Math.max(trace.maxFarStill, trace.farStill);
      trace.deadFocus = target?.hp <= 0 ? trace.deadFocus + DT : 0;
      trace.maxDeadFocus = Math.max(trace.maxDeadFocus, trace.deadFocus);
    }
    for (const effect of battle.effects) {
      if (effect.id <= lastEffect || effect.type !== 'slash') continue;
      const trace = fighters.get(effect.sourceId);
      const source = battle.allies.find(unit => unit.id === effect.sourceId);
      const target = battle.enemies.find(enemy => enemy.id === source?.targetId);
      if (trace && target && ['goblinArcher', 'skeletonArcher'].includes(target.type)) trace.archerHits++;
    }
    lastEffect = battle.nextEffectId - 1;
  }
  return { battle, fighters: [...fighters.values()] };
}

test('all three starting swordsmen advance at the first spawn and reach combat', () => {
  const { battle, fighters } = traceMovement(1, makeFormation({ swordsman: 3, level: 1 }));
  assert.equal(battle.phase, 'victory');
  assert.ok(fighters.every(unit => unit.firstMove >= .8 - DT && unit.firstMove <= .8 + DT));
  assert.ok(fighters.every(unit => unit.firstAttack < 10 && unit.moved > 50));
});

test('swordsmen retarget and damage archers after the melee screen falls', () => {
  const { battle, fighters } = traceMovement(2, makeFormation({ swordsman: 3, level: 1 }));
  assert.equal(battle.phase, 'victory');
  assert.ok(fighters.reduce((sum, unit) => sum + unit.archerHits, 0) > 0);
  assert.ok(fighters.some(unit => unit.retargets >= 2));
  // An already-started swing may finish after its victim dies; its old focus must clear promptly.
  assert.ok(fighters.every(unit => unit.maxDeadFocus < 1));
});

test('several allied columns close in and resume attacks in the crowded seventh and eighth waves', () => {
  for (const wave of [7, 8]) {
    const { battle, fighters } = traceMovement(wave,
      makeFormation({ swordsman: 5, archer: 2, healer: 1, level: 3 }));
    assert.equal(battle.phase, 'victory');
    assert.ok(fighters.every(unit => unit.firstAttack < 10));
    assert.ok(fighters.every(unit => unit.retargets > 0 && unit.maxDeadFocus < 1));
    assert.ok(fighters.every(unit => unit.maxFarStill < 3), 'a normal formation should not remain wedged behind its frontline');
    assert.ok(fighters.reduce((sum, unit) => sum + unit.archerHits, 0) > 0);
  }
});

test('an overcrowded all-melee army keeps retargeting and completes the ninth wave', () => {
  const { battle, fighters } = traceMovement(9, makeFormation({ swordsman: 15, level: 1 }));
  assert.equal(battle.phase, 'victory');
  assert.ok(fighters.every(unit => unit.firstMove < 1 && unit.moved > 100));
  assert.ok(fighters.filter(unit => unit.retargets > 0).length >= 14);
  assert.ok(fighters.every(unit => unit.maxDeadFocus < 1));
  // Rear fighters need not land a hit when allies occupy every approach and kill the targets first.
  assert.ok(battle.elapsed < 90);
});

test('the same melee approach reaches skeleton archers in the second level', () => {
  const { battle, fighters } = traceMovement(202,
    makeFormation({ swordsman: 9, archer: 4, healer: 2, level: 25 }));
  assert.equal(battle.phase, 'victory');
  assert.ok(fighters.every(unit => unit.firstMove < 1));
  assert.ok(fighters.reduce((sum, unit) => sum + unit.archerHits, 0) > 0);
  assert.ok(fighters.every(unit => unit.maxDeadFocus < 1));
});
