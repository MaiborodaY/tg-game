import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.ts';

const DT = 1 / 60;
const hold = actor => Object.assign(actor, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

function encounter(hp, reward = 7, formation = []) {
  const battle = createBattle(formation, 1);
  const spawns = [{ at: 0, type: 'goblinArcher', hp, damage: 0, reward, x: 195, y: 230 }];
  battle.wave = { ...battle.wave, spawns, total: 1, reward };
  Object.assign(battle, { total: 1, nextSpawn: 0 });
  hold(battle.hero);
  battle.allies.forEach(hold);
  updateBattle(battle, DT);
  hold(battle.enemies[0]);
  Object.assign(battle.hero, { x: 195, y: 330 });
  return battle;
}

function projectile(battle, type, source, target, damage) {
  return {
    id: battle.nextProjectileId++, type, x: source.x, y: source.y - 27,
    targetX: target.x, targetY: target.y - 27, age: 0, duration: 0,
    side: source.side, sourceType: source.type, sourceId: source.id,
    targetId: target.id, damage,
    ...(type === 'hero-hammer' ? { landed: false } : {}),
  };
}

test('simultaneous lethal arrows award one kill and one gold event; vanished targets are ignored', () => {
  const battle = encounter(1, 7, [
    { id: 1, type: 'archer', level: 1, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 1, col: 3, row: 0 },
  ]), target = battle.enemies[0];
  battle.projectiles.push(projectile(battle, 'arrow', battle.allies[0], target, 10),
    projectile(battle, 'arrow', battle.allies[1], target, 10),
    { ...projectile(battle, 'arrow', battle.allies[0], target, 10), targetId: 'removed-enemy' });
  const events = updateBattle(battle, DT);
  assert.deepEqual(events, [
    { type: 'damage', targetId: target.id, targetType: target.type, side: target.side, amount: 1 },
    { type: 'gold', amount: 7, x: target.x, y: target.y },
  ]);
  assert.equal(battle.kills, 1);
  assert.equal(battle.reward, 7);
  assert.equal(battle.phase, 'victory');
  assert.equal(target.hp, 0);
  assert.equal(battle.effects.filter(effect => effect.type === 'gold').length, 1);
  assert.equal(battle.effects.filter(effect => effect.type === 'hit').length, 1);
  assert.deepEqual(updateBattle(battle, .3), []);
  assert.equal(battle.reward, 7);
});

test('a hero killed earlier in the projectile snapshot cannot land a queued hammer, while ordinary arrows outlive their caster', () => {
  const battle = encounter(100, 7, [{ id: 1, type: 'archer', level: 1, col: 2, row: 0 }]);
  const enemy = battle.enemies[0], hero = battle.hero, archer = battle.allies[0];
  hero.hp = 1;
  hero.pendingAbility = { kind: 'heal', sourceId: hero.id, targetIds: [hero.id],
    time: 0, duration: .65, didImpact: false };
  hero.bastionTime = 2;
  // Projectile updates iterate a snapshot: cancelling the live projectile array must also
  // revalidate the hammer already present later in that snapshot.
  battle.projectiles.push(projectile(battle, 'arrow', enemy, hero, 1000),
    projectile(battle, 'arrow', enemy, archer, 1000),
    projectile(battle, 'hero-hammer', hero, enemy, 99),
    projectile(battle, 'arrow', archer, enemy, 10));
  const archerHp = archer.hp;
  assert.deepEqual(updateBattle(battle, DT), [
    { type: 'damage', targetId: hero.id, targetType: hero.type, side: hero.side, amount: 1 },
    { type: 'damage', targetId: archer.id, targetType: archer.type, side: archer.side, amount: archerHp },
    { type: 'damage', targetId: enemy.id, targetType: enemy.type, side: enemy.side, amount: 10 },
  ]);
  assert.equal(hero.hp, 0);
  assert.equal(archer.hp, 0);
  assert.equal(hero.pendingAbility, null);
  assert.equal(hero.bastionTime, 0);
  assert.equal(enemy.hp, 90, 'only the ordinary in-flight arrow still deals damage');
  assert.equal(battle.kills, 0);
  assert.equal(battle.reward, 0);
  assert.ok(!battle.projectiles.some(projectile => projectile.type === 'hero-hammer'));
  assert.ok(!battle.effects.some(effect => effect.type === 'hero-impact'));
  assert.deepEqual(updateBattle(battle, DT), []);
  assert.equal(enemy.hp, 90, 'a consumed projectile cannot land twice');
});
