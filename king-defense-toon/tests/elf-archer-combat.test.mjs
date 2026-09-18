import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, getUnitRange, updateBattle } from '../combat.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';
import { createHero, heroXpForLevel } from '../hero.ts';

const DT = 1 / 60;
const fighter = (id, type = 'elfArcher', col = 2, row = 2, level = 1) => ({ id, type, col, row, level });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const hold = unit => Object.assign(unit, { action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999 });

function encounter({ formation = [fighter(1)], enemies = [{}], hero, forge } = {}) {
  const battle = createBattle(formation, 1, hero, forge);
  const spawns = enemies.map(enemy => ({ at: 0, type: 'goblin', hp: 1000, damage: 0, x: 195, y: 180, ...enemy }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  updateBattle(battle, DT);
  // Held targets isolate the ally's approach and damage; enemy movement cannot rescue it.
  for (const [index, enemy] of battle.enemies.entries()) {
    hold(enemy);
    Object.assign(enemy, { x: spawns[index].x, y: spawns[index].y });
  }
  for (const unit of battle.allies) Object.assign(unit, { action: 'idle', actionTime: 0, cooldown: 0, didImpact: false });
  battle.hero.hp = 0;
  return battle;
}

function advance(battle, until, seconds = 20) {
  const events = [];
  while (battle.phase === 'running' && battle.elapsed < seconds && !until()) events.push(...updateBattle(battle, DT));
  assert.ok(until(), `Condition did not resolve: ${battle.phase}, ${battle.elapsed.toFixed(2)}s`);
  return events;
}

test('elf archer approaches into bow range, then stops and shoots at its own cadence', () => {
  function movement(type) {
    const battle = encounter({ formation: [fighter(1, type)], enemies: [{ y: 66 }] });
    const archer = battle.allies[0];
    Object.assign(archer, { x: 195, y: 360 });
    updateBattle(battle, DT);
    assert.equal(archer.action, 'walk');
    return 360 - archer.y;
  }
  close(movement('elfArcher') / movement('archer'), 52 / 49);
  const battle = encounter({ enemies: [{ y: 100 }] }), archer = battle.allies[0];
  Object.assign(archer, { x: 195, y: 360 });
  const startY = archer.y;
  advance(battle, () => archer.action === 'shoot');
  assert.ok(archer.y < startY - 90, 'Archer actually moves into range instead of idling');
  assert.ok(archer.y - battle.enemies[0].y <= archer.range - 20);
  assert.equal(getUnitRange('elfArcher'), 185);
  close(archer.actionDuration, .7 / COMBAT_PACE);
  close(archer.cooldown, 1.3 / COMBAT_PACE);
  assert.equal(archer.impactFraction, .5);
  const stationary = { x: archer.x, y: archer.y };
  for (let tick = 0; tick < 300; tick++) updateBattle(battle, DT);
  assert.deepEqual({ x: archer.x, y: archer.y }, stationary, 'A target in range does not cause repeated forward/back movement');
});

test('release pose creates one arrow, with single-target damage only when it lands', () => {
  const battle = encounter({ enemies: [{ x: 195 }, { x: 225 }] }), archer = battle.allies[0];
  Object.assign(archer, { x: 195, y: 310 });
  updateBattle(battle, DT);
  assert.equal(archer.action, 'shoot');
  while (archer.actionTime + DT < archer.actionDuration * .5 - 1e-9) updateBattle(battle, DT);
  assert.equal(battle.projectiles.some(effect => effect.type === 'arrow'), false, 'No projectile before the authored release pose');
  const events = advance(battle, () => battle.projectiles.some(effect => effect.type === 'arrow'));
  assert.equal(events.filter(event => event.type === 'bow-shot' && event.sourceId === archer.id).length, 1);
  const arrow = battle.projectiles.find(effect => effect.type === 'arrow');
  assert.equal(arrow.sourceType, 'elfArcher');
  assert.equal(arrow.targetId, battle.enemies[0].id);
  assert.equal(arrow.damage, 11);
  assert.ok(archer.actionTime >= archer.actionDuration * .5);
  assert.ok(battle.enemies.every(enemy => enemy.hp === 1000), 'Releasing the bow does not apply instant damage');
  advance(battle, () => battle.enemies.some(enemy => enemy.hp < 1000));
  assert.deepEqual(battle.enemies.map(enemy => enemy.hp), [989, 1000]);
  assert.equal(battle.effects.some(effect => ['slash', 'hero-impact', 'poison-impact'].includes(effect.type)), false);
  assert.equal(battle.projectiles.some(projectile => projectile.type === 'poison-bottle'), false);
});

test('an elf turns toward the current target at release and cancels a dead target before firing', () => {
  const battle = encounter(), archer = battle.allies[0], target = battle.enemies[0];
  Object.assign(archer, { x: 195, y: 300 });
  updateBattle(battle, DT);
  assert.equal(archer.facingY, -1);
  Object.assign(target, { x: 220, y: 350 });
  advance(battle, () => battle.projectiles.some(effect => effect.type === 'arrow'));
  assert.ok(archer.facingY > 0);
  const arrow = battle.projectiles.find(effect => effect.type === 'arrow');
  assert.equal(arrow.targetX, target.x);
  assert.equal(arrow.targetY, target.y - 27);

  const canceled = encounter({ enemies: [{}, { x: 300 }] });
  Object.assign(canceled.allies[0], { x: 195, y: 300 });
  updateBattle(canceled, DT);
  const deadId = canceled.allies[0].targetId;
  canceled.enemies.find(enemy => enemy.id === deadId).hp = 0;
  for (let tick = 0; tick < 50; tick++) updateBattle(canceled, DT);
  assert.equal(canceled.projectiles.some(effect => effect.type === 'arrow' && effect.targetId === deadId), false);
});

test('an elf retargets surviving healers and alchemists after the front dies and awards each kill once', () => {
  const battle = encounter({ enemies: [
    { hp: 11, y: 220 },
    { type: 'goblinHealer', hp: 22, heal: 0, y: 100 },
    { type: 'plagueAlchemist', hp: 33, y: 66 },
  ] });
  Object.assign(battle.allies[0], { x: 195, y: 340 });
  const events = advance(battle, () => battle.phase === 'victory');
  assert.equal(battle.kills, 3);
  assert.equal(battle.enemies.every(enemy => enemy.hp === 0), true);
  const rewards = events.filter(event => event.type === 'gold');
  assert.equal(rewards.length, 3);
  assert.equal(rewards.reduce((total, event) => total + event.amount, 0), battle.reward);
  assert.ok(battle.allies[0].y < 245, 'A distant support target is pursued into bow range');
  assert.equal(battle.enraged, false);
});

test('a hero advances past elf archers instead of treating them as a stationary melee frontline', () => {
  for (const type of ['archer', 'elfArcher']) {
    // Keep the target below the ally advance limit; a held melee enemy at y=100 is unreachable.
    const battle = encounter({ formation: [fighter(1, type)], enemies: [{ y: 180 }] });
    const archer = battle.allies[0], hero = battle.hero;
    hold(archer);
    Object.assign(archer, { x: 195, y: 420 });
    Object.assign(hero, { hp: hero.maxHp, x: 240, y: 430, action: 'idle', actionTime: 0,
      cooldown: 0, targetId: null, focusId: null });
    advance(battle, () => battle.effects.some(effect => effect.type === 'slash' && effect.sourceId === hero.id), 12);
    assert.ok(Math.hypot(hero.x - 195, hero.y - 180) <= hero.range + 6, `${type} must not keep the hero behind the ranged line`);
    assert.deepEqual({ x: archer.x, y: archer.y }, { x: 195, y: 420 });
  }
});

test('elf archers keep personal-level and Forge snapshots for health, arrow damage and attack speed', () => {
  const forge = createForge({ health: 20, attack: 30, attackSpeed: 50 });
  const battle = encounter({ formation: [fighter(1, 'elfArcher', 2, 2, 11)], forge });
  const unit = battle.allies[0], expected = getForgedUnitStats('elfArcher', 11, forge);
  assert.equal(unit.hp, expected.hp);
  assert.equal(unit.damage, expected.damage);
  assert.equal(unit.attackSpeed, 1.5);
  Object.assign(unit, { x: 195, y: 310 });
  updateBattle(battle, DT);
  close(unit.actionDuration, .7 / COMBAT_PACE / 1.5);
  close(unit.cooldown, 1.3 / COMBAT_PACE / 1.5);
  forge.attack = 100;
  advance(battle, () => battle.projectiles.some(effect => effect.type === 'arrow'));
  assert.equal(battle.projectiles.find(effect => effect.type === 'arrow').damage, expected.damage);
  assert.equal(unit.damage, expected.damage, 'New Forge purchases cannot modify an active encounter');
  assert.ok(createBattle([fighter(1, 'elfArcher', 2, 2, 11)], 1, undefined, forge).allies[0].damage > expected.damage);
});

test('a wounded elf archer receives ordinary monk healing and the hero armour aura', () => {
  const hero = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { aura_unlock: 1 } });
  const battle = encounter({ formation: [fighter(1), fighter(2, 'healer', 2, 1)], hero });
  for (const unit of [...battle.allies, battle.hero]) hold(unit);
  const elf = battle.allies[0], monk = battle.allies[1];
  Object.assign(elf, { x: 195, y: 240, hp: 30 });
  Object.assign(monk, { x: 195, y: 290, action: 'idle', cooldown: 0 });
  Object.assign(battle.hero, { hp: battle.hero.maxHp, x: 225, y: 240 });
  battle.projectiles.push({ id: battle.nextProjectileId++, type: 'arrow', targetId: elf.id, sourceId: battle.enemies[0].id,
    side: 'enemy', sourceType: 'goblinArcher', x: 195, y: 180, targetX: elf.x, targetY: elf.y,
    damage: 10, age: 0, duration: 0 });
  updateBattle(battle, DT);
  close(elf.hp, 20.4);
  advance(battle, () => elf.hp > 20.4);
  close(elf.hp, 24.4);
  assert.ok(battle.effects.some(effect => effect.type === 'heal' && effect.sourceId === monk.id));
});

test('a mixed elf and human army preserves real battle state and events at all speeds and 20/30/60/120 FPS', () => {
  const formation = [fighter(1, 'pantherRider', 0, 0, 10), fighter(2, 'pantherRider', 2, 0, 10),
    fighter(3, 'swordsman', 4, 0, 10), fighter(4, 'lancer', 1, 1, 10), fighter(5, 'healer', 2, 1, 10),
    fighter(6, 'archer', 1, 2, 10), fighter(7, 'elfArcher', 3, 2, 10)];
  const forge = createForge({ attack: 7, attackSpeed: 13, health: 11 });
  const withoutVisualTimers = ({ hitTime, deathTime, ...actor }) => actor;
  function run(fps, speed) {
    const battle = createBattle(formation, 20, undefined, forge), events = [];
    for (let frame = 0; battle.phase === 'running' && frame < 30000; frame++) events.push(...updateBattle(battle, battleFrameDelta(1 / fps, speed)));
    assert.equal(battle.phase, 'victory');
    assert.ok(events.some(event => event.type === 'bow-shot' && event.sourceId === 'ally-7'));
    const { stepRemainder, effects, allies, enemies, hero, castle, king, ...state } = battle;
    return { ...state, allies: allies.map(withoutVisualTimers), enemies: enemies.map(withoutVisualTimers),
      hero: withoutVisualTimers(hero), castle: withoutVisualTimers(castle), events };
  }
  const saved = structuredClone(formation), expected = run(60, 1);
  for (const speed of BATTLE_SPEEDS) for (const fps of [20, 30, 60, 120]) assert.deepEqual(run(fps, speed), expected, `${fps} FPS ×${speed}`);
  assert.deepEqual(formation, saved);
});
