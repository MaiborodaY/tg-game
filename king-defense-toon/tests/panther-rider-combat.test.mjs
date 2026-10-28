import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, getUnitRange, updateBattle } from '../combat.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';
import { createHero, heroXpForLevel } from '../hero.ts';
import { FIELD, positionForCell } from '../field.ts';

const DT = 1 / 60;
const fighter = (id, type, col = 2, row = 0, level = 1) => ({ id, type, col, row, level });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const hold = unit => Object.assign(unit, { action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999 });

function encounter(formation, enemies, hero, forge) {
  const battle = createBattle(formation, 1, hero, forge);
  const spawns = enemies.map(enemy => ({ at: 0, type: 'goblin', hp: 1000, damage: 0, x: 195, y: 180, ...enemy }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  updateBattle(battle, DT);
  return battle;
}

function advance(battle, until, seconds = 30) {
  while (battle.phase === 'running' && battle.elapsed < seconds && !until()) updateBattle(battle, DT);
  assert.ok(until(), `${battle.phase} at ${battle.elapsed.toFixed(2)}s`);
}

test('mounted glaive rider moves faster than swordsmen and uses its own single-target cadence', () => {
  const movement = type => {
    const battle = encounter([fighter(1, type)], [{ x: positionForCell(2, 0).x, y: 66 }]);
    const unit = battle.allies[0], previousY = unit.y;
    battle.hero.hp = 0;
    updateBattle(battle, DT);
    return previousY - unit.y;
  };
  close(movement('pantherRider') / movement('swordsman'), 68 / 57);
  const battle = encounter([fighter(1, 'pantherRider')], [{ x: 175 }, { x: 215 }]);
  battle.hero.hp = 0;
  for (const unit of battle.enemies) hold(unit);
  Object.assign(battle.allies[0], { x: 175, y: 210, action: 'idle', cooldown: 0, focusId: null });
  updateBattle(battle, DT);
  const rider = battle.allies[0];
  assert.equal(rider.action, 'shoot');
  close(rider.actionDuration, .65 / COMBAT_PACE);
  close(rider.cooldown, 1.05 / COMBAT_PACE);
  assert.equal(getUnitRange('pantherRider'), 75);
  assert.ok(getUnitRange('pantherRider') > getUnitRange('swordsman'));
  assert.ok(getUnitRange('pantherRider') < getUnitRange('archer'));
  advance(battle, () => battle.projectiles.some(effect => effect.type === 'arrow' && effect.sourceType === 'pantherRider'));
  assert.ok(battle.enemies.every(enemy => enemy.hp === 1000), 'Releasing the glaive does not apply instant damage');
  advance(battle, () => battle.enemies.some(enemy => enemy.hp < 1000));
  assert.equal(battle.enemies.filter(enemy => enemy.hp < 1000).length, 1);
  assert.equal(battle.enemies.reduce((sum, enemy) => sum + 1000 - enemy.hp, 0), 9);
  assert.ok(!battle.effects.some(effect => effect.type === 'slash' && effect.sourceType === 'pantherRider'));
});

test('rider starts at the centre of its two-cell footprint without combat-stat changes', () => {
  const units = [fighter(1, 'pantherRider', 1, 0), fighter(2, 'swordsman', 3, 0)];
  const original = structuredClone(units), battle = createBattle(units);
  const [rider, sword] = battle.allies, anchor = positionForCell(1, 0);
  assert.equal(rider.x, anchor.x);
  assert.equal(rider.homeX, rider.x); assert.equal(rider.targetX, rider.x);
  assert.equal(rider.y, anchor.y + FIELD.cellHeight / 2); assert.equal(rider.homeY, rider.y);
  assert.equal(sword.x, positionForCell(3, 0).x);
  assert.equal(rider.maxHp, 90); assert.equal(rider.damage, 9);
  assert.equal(rider.range, 75); assert.equal(rider.visualScale, 1);
  assert.deepEqual(units, original, 'combat never rewrites saved upper anchors');
});

test('glaive rider stops beyond sword reach; a released projectile survives its caster and lands only once', () => {
  const battle = encounter([fighter(1, 'pantherRider')], [{ x: 195, y: 180 }]);
  battle.hero.hp = 0;
  const rider = battle.allies[0], target = battle.enemies[0]; hold(target);
  Object.assign(target, { x: 195, y: 180 });
  Object.assign(rider, { x: 195, y: 310, action: 'idle', cooldown: 0 });
  advance(battle, () => rider.action === 'shoot');
  const distance = Math.hypot(rider.x-target.x, rider.y-target.y);
  assert.ok(distance > 44 && distance <= 55, `short throw starts at ${distance}px`);
  advance(battle, () => battle.projectiles.some(effect => effect.type === 'arrow'));
  assert.equal(target.hp, 1000);
  const projectile = battle.projectiles.find(effect => effect.type === 'arrow');
  assert.ok(projectile.launchFacing.y < 0);
  rider.hp = 0;
  advance(battle, () => target.hp < 1000);
  for (let i=0;i<60;i++) updateBattle(battle, DT);
  assert.equal(target.hp, 991);
  assert.ok(!battle.effects.some(effect => effect.type === 'slash'));
});

test('rider advances to the entrance and retargets the archer after the frontline dies', () => {
  const battle = encounter([fighter(1, 'pantherRider', 2, 1)], [
    { hp: 9, y: 185 }, { type: 'goblinArcher', hp: 18, damage: 0, y: 66 },
  ]);
  battle.hero.hp = 0;
  const rider = battle.allies[0], startY = rider.y, struck = new Set();
  advance(battle, () => {
    for (const enemy of battle.enemies) if (enemy.hp < enemy.maxHp) struck.add(enemy.id);
    return battle.phase === 'victory';
  });
  assert.equal(struck.size, 2);
  assert.ok(rider.y < startY - 150);
  assert.equal(rider.hp, rider.maxHp);
  assert.equal(battle.enraged, false);
});

test('riders take all three shared forge bonuses with a fixed battle snapshot', () => {
  const formation = [fighter(1, 'pantherRider', 2, 0, 11)];
  const forge = createForge({ health: 20, attack: 10, attackSpeed: 50 });
  const battle = encounter(formation, [{}], undefined, forge), unit = battle.allies[0];
  const stats = getForgedUnitStats('pantherRider', 11, forge);
  assert.equal(unit.maxHp, stats.hp);
  assert.equal(unit.damage, stats.damage);
  assert.equal(unit.attackSpeed, 1.5);
  battle.hero.hp = 0;
  hold(battle.enemies[0]);
  Object.assign(unit, { x: 195, y: 210, action: 'idle', cooldown: 0 });
  updateBattle(battle, DT);
  close(unit.cooldown, 1.05 / COMBAT_PACE / 1.5);
  close(unit.actionDuration, .65 / COMBAT_PACE / 1.5);
  forge.attack = 100;
  assert.equal(unit.damage, stats.damage, 'an active battle keeps its forge snapshot');
});

test('a wounded rider can receive monk healing and hero armour aura', () => {
  const hero = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { aura_unlock: 1 } });
  const battle = encounter([fighter(1, 'pantherRider'), fighter(2, 'healer', 2, 1)], [{}], hero);
  for (const unit of [...battle.allies, ...battle.enemies, battle.hero]) hold(unit);
  const rider = battle.allies[0], monk = battle.allies[1];
  Object.assign(rider, { x: 195, y: 240, hp: 50 });
  Object.assign(monk, { x: 195, y: 290, action: 'idle', cooldown: 0 });
  Object.assign(battle.hero, { x: 225, y: 240 });
  battle.projectiles.push({ id: battle.nextProjectileId++, type: 'arrow', targetId: rider.id, sourceId: battle.enemies[0].id,
    side: 'enemy', sourceType: 'goblinArcher', x: 195, y: 180, targetX: rider.x, targetY: rider.y,
    damage: 10, age: 0, duration: 0 });
  updateBattle(battle, DT);
  close(rider.hp, 40.4);
  advance(battle, () => rider.hp > 40.4);
  close(rider.hp, 44.4);
  assert.ok(battle.effects.some(effect => effect.type === 'heal' && effect.sourceId === monk.id));
});

test('a mixed mounted army keeps real combat identical across frame rates and speed choices', () => {
  const formation = [fighter(1, 'pantherRider', 0, 0, 10), fighter(2, 'pantherRider', 2, 0, 10),
    fighter(3, 'swordsman', 4, 0, 10), fighter(4, 'lancer', 1, 1, 10), fighter(5, 'healer', 2, 1, 10),
    fighter(6, 'archer', 1, 2, 10), fighter(7, 'archer', 3, 2, 10)];
  const forge = createForge({ attack: 7, attackSpeed: 13, health: 11 });
  const withoutVisualTimers = ({ hitTime, deathTime, ...actor }) => actor;
  function run(fps, speed) {
    const battle = createBattle(formation, 20, undefined, forge), events = [];
    for (let frame = 0; battle.phase === 'running' && frame < 30000; frame++) events.push(...updateBattle(battle, battleFrameDelta(1 / fps, speed)));
    assert.equal(battle.phase, 'victory');
    assert.ok(battle.kills > 0);
    assert.equal(events.some(event => event.type === 'bow-shot' && ['ally-1','ally-2'].includes(event.sourceId)), false, 'Glaives do not play bow sounds');
    const { stepRemainder, effects, allies, enemies, hero, castle, king, ...state } = battle;
    return { ...state, allies: allies.map(withoutVisualTimers), enemies: enemies.map(withoutVisualTimers),
      hero: withoutVisualTimers(hero), castle: withoutVisualTimers(castle), events };
  }
  const expected = run(60, 1);
  for (const speed of BATTLE_SPEEDS) for (const fps of [20, 30, 60, 120]) assert.deepEqual(run(fps, speed), expected, `${fps} FPS ×${speed}`);
});
