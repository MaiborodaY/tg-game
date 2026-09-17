import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.mjs';
import { WALKABLE_AREAS } from '../field.mjs';
import { loadCombatEngine, makeFormation, simulateCombat } from '../scripts/combat-balance.mjs';

const engine = await loadCombatEngine();
const onLand = point => WALKABLE_AREAS.some(area => point.x >= area.left - 1e-7
  && point.x <= area.right + 1e-7 && point.y >= area.top - 1e-7 && point.y <= area.bottom + 1e-7);

function assertShoreSafeStep(before, after) {
  assert.ok(onLand(after), `offshore foot position: ${after.x}, ${after.y}`);
  // The only land across the open gap (-12 < x < 32) is the narrow neck.
  // Inspect the whole crossing segment, including a diagonal whose endpoints are on land.
  const dx = after.x - before.x;
  let start = 0;
  let end = 1;
  if (Math.abs(dx) < 1e-8) {
    if (before.x <= -12 || before.x >= 32) return;
  } else {
    const boundaries = [(-12 - before.x) / dx, (32 - before.x) / dx].sort((a, b) => a - b);
    start = Math.max(0, boundaries[0]);
    end = Math.min(1, boundaries[1]);
    if (start >= end) return;
  }
  for (const t of [start, end]) {
    const y = before.y + (after.y - before.y) * t;
    assert.ok(y >= 400 - 1e-7 && y <= 416 + 1e-7, `cut across royal shore at y=${y}`);
  }
}

test('six level-two fighters on wave seven cannot leave enemies permanently outside the royal neck', () => {
  const formation = makeFormation({ swordsman: 3, archer: 2, healer: 1, level: 2 });
  const result = simulateCombat(engine, { wave: 7, formation, maxSeconds: 120 });
  // Before the spacing fix this real battle was still running at 600 seconds,
  // with all guards dead and two goblins circling outside the entrance.
  assert.notEqual(result.outcome, 'timeout');
});

test('opposing entrance approaches cross the neck without walking across water', () => {
  for (const positions of [
    [{ x: 33.14, y: 397.89 }, { x: 34.73, y: 416.66 }],
    [{ x: 33, y: 392 }, { x: 33, y: 424 }],
  ]) {
    for (const reverse of [false, true]) {
      const battle = createBattle([], 2);
      while (battle.spawned < battle.total) updateBattle(battle, 1 / 60);
      const goblins = battle.enemies.filter(enemy => enemy.type === 'goblin');
      for (const enemy of battle.enemies.filter(enemy => enemy.type !== 'goblin')) {
        enemy.hp = 0;
        enemy.action = 'dead';
        battle.kills += 1;
      }
      const orderedPositions = reverse ? [...positions].reverse() : positions;
      goblins.forEach((enemy, index) => Object.assign(enemy, orderedPositions[index], { hp: index ? 82 : 10 }));
      battle.king.hp = 28;
      let reachedNeck = false;
      while (battle.phase === 'running' && battle.elapsed < 30) {
        const previous = goblins.map(({ x, y }) => ({ x, y }));
        updateBattle(battle, 1 / 60);
        goblins.forEach((enemy, index) => {
          assertShoreSafeStep(previous[index], enemy);
          reachedNeck ||= enemy.x < 32;
        });
      }
      assert.ok(reachedNeck, 'at least one attacker crosses the mainland portal');
      assert.ok(battle.king.hp < 28, 'attackers reach the king rather than stalling outside');
      assert.notEqual(battle.phase, 'running', 'combat terminates without relying on enrage');
      assert.equal(battle.enraged, false);
    }
  }
});
