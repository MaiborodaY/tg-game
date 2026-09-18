import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.ts';
import { createCapitol } from '../capitol.ts';
import { createForge } from '../forge.ts';
import { createHero, heroXpForLevel } from '../hero.ts';
import { CAPITOL_TOWER_POSITION, FIELD } from '../field.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';

const DT = 1 / 60;
const hold = unit => Object.assign(unit, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

function encounter({ capitol = { health: 0, tower: 1 }, targets = [{}], formation = [], hero, forge } = {}) {
  const battle = createBattle(formation, 1, hero, forge, capitol);
  // Spawn beyond tower range, then hold the enemies in known places. Neither enemy
  // walking nor the hero's melee attacks may substitute for a working tower.
  const spawns = targets.map((target, index) => ({ at: 0, type: 'goblin', hp: target.hp ?? 10000,
    damage: 0, reward: target.reward ?? 2, x: 195 + index * 30, y: 50 }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  hold(battle.hero);
  for (const ally of battle.allies) hold(ally);
  updateBattle(battle, DT);
  for (const [index, enemy] of battle.enemies.entries()) {
    hold(enemy);
    Object.assign(enemy, { x: CAPITOL_TOWER_POSITION.x + 50 + index * 30, y: CAPITOL_TOWER_POSITION.y,
      ...targets[index] });
  }
  return battle;
}

function advance(battle, seconds, dt = DT) {
  const events = [];
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += dt) {
    events.push(...updateBattle(battle, Math.min(dt, seconds - elapsed)));
  }
  return events;
}
const shots = events => events.filter(event => event.type === 'bow-shot' && event.sourceId === 'castle');

test('the default Capitol remains an unarmed 100 HP objective at its existing position', () => {
  const fresh = createBattle();
  assert.deepEqual(createBattle([], 1, undefined, undefined, createCapitol()), fresh);
  assert.equal(fresh.castle, fresh.king);
  assert.equal(fresh.castle.hp, 100);
  assert.equal(fresh.castle.range, 0);
  assert.equal(fresh.castle.damage, 0);
  assert.equal(fresh.castle.x, FIELD.kingX);
  assert.equal(fresh.castle.y, FIELD.kingFeet);
  const battle = encounter({ capitol: createCapitol() });
  assert.equal(shots(advance(battle, 5)).length, 0);
  assert.equal(battle.enemies[0].hp, 10000);
});

test('HP and tower purchases affect the next battle, never the current battle snapshot', () => {
  const capitol = createCapitol({ health: 2, tower: 1 });
  const battle = encounter({ capitol });
  const snapshot = structuredClone(battle.castle);
  assert.equal(battle.castle.hp, 140);
  assert.equal(battle.castle.damage, 10);
  assert.ok(Object.isFrozen(battle.castle.stats));
  Object.assign(capitol, { health: 3, tower: 2 });
  assert.deepEqual(battle.castle, snapshot);
  advance(battle, .5);
  assert.equal(battle.enemies[0].hp, 9990, 'queued shots use the battle snapshot');
  const next = createBattle([], 1, undefined, undefined, capitol);
  assert.equal(next.castle.hp, 160);
  assert.equal(next.castle.maxHp, 160);
  assert.equal(next.castle.damage, 12);
  assert.equal(next.castle.stats.interval, 2);
});

test('the tower selects the nearest living enemy and arrows leave the drawn tower', () => {
  const battle = encounter({ targets: [
    { x: CAPITOL_TOWER_POSITION.x + 110 },
    { x: CAPITOL_TOWER_POSITION.x + 50 },
    { x: CAPITOL_TOWER_POSITION.x + 25, hp: 0 },
  ] });
  const start = { x: battle.castle.x, y: battle.castle.y };
  assert.equal(shots(updateBattle(battle, DT)).length, 1);
  const arrow = battle.effects.find(effect => effect.type === 'arrow');
  assert.equal(arrow.targetId, battle.enemies[1].id);
  assert.equal(arrow.sourceType, 'castle');
  assert.equal(arrow.x, CAPITOL_TOWER_POSITION.x);
  assert.equal(arrow.y, CAPITOL_TOWER_POSITION.y - 9);
  assert.equal(battle.enemies[1].hp, 10000, 'launching must not deal instant damage');
  advance(battle, .5);
  assert.equal(battle.enemies[1].hp, 9990);
  assert.equal(battle.enemies[0].hp, 10000);
  assert.deepEqual({ x: battle.castle.x, y: battle.castle.y }, start, 'tower never chases targets');
});

test('range is measured from the tower: 144 is reachable and anything beyond it is not', () => {
  const battle = encounter({ targets: [{ x: CAPITOL_TOWER_POSITION.x + 144.01 }] });
  const start = { x: battle.castle.x, y: battle.castle.y };
  assert.equal(shots(advance(battle, 3)).length, 0);
  assert.equal(battle.enemies[0].hp, 10000);
  battle.enemies[0].x = CAPITOL_TOWER_POSITION.x + 144;
  assert.equal(shots(updateBattle(battle, DT)).length, 1);
  advance(battle, .5);
  assert.equal(battle.enemies[0].hp, 9990);
  assert.deepEqual({ x: battle.castle.x, y: battle.castle.y }, start);
});

test('tower cadence is two simulation seconds and does not inherit Forge or hero bonuses', () => {
  const hero = createHero({ xp: heroXpForLevel(20), talentVersion: 2,
    talents: { aura_unlock: 1, aura_power: 3, hammer_unlock: 1 } });
  const forge = createForge({ health: 100, attack: 100, attackSpeed: 100 });
  const battle = encounter({ hero, forge });
  const plain = encounter();
  assert.deepEqual(battle.castle, plain.castle);
  const firedAt = [];
  for (let i = 0; i < 300; i++) {
    if (shots(updateBattle(battle, DT)).length) firedAt.push(battle.elapsed);
  }
  assert.equal(firedAt.length, 3);
  for (let i = 1; i < firedAt.length; i++) assert.ok(Math.abs(firedAt[i] - firedAt[i - 1] - 2) < 1e-8);
  assert.equal(battle.enemies[0].hp, 9970);
  assert.equal(battle.castle.maxHp, 100);
});

test('tower arrows use the normal death/reward path without awarding a simultaneous kill twice', () => {
  const battle = encounter({ targets: [{ hp: 5, reward: 7 }] });
  updateBattle(battle, DT);
  const arrow = battle.effects.find(effect => effect.type === 'arrow');
  // A second projectile can arrive during the same tick after the tower's lethal hit.
  battle.effects.push({ ...arrow, id: battle.nextEffectId++, sourceId: 'ally-other', sourceType: 'archer' });
  const events = advance(battle, .5);
  assert.equal(battle.enemies[0].hp, 0);
  assert.equal(battle.enemies[0].action, 'dead');
  assert.equal(battle.kills, 1);
  assert.equal(battle.reward, 7);
  assert.deepEqual(events.filter(event => event.type === 'gold').map(event => event.amount), [7]);
  assert.equal(battle.phase, 'victory');
  assert.equal(shots(advance(battle, 5)).length, 0);
  assert.equal(battle.reward, 7);
});

test('a destroyed Capitol cannot launch shots or finish a projectile that was already airborne', () => {
  for (const launchFirst of [false, true]) {
    const battle = encounter({ targets: [{ hp: 5 }] });
    if (launchFirst) assert.equal(shots(updateBattle(battle, DT)).length, 1);
    battle.castle.hp = 0;
    assert.equal(shots(advance(battle, .5)).length, 0);
    assert.equal(battle.phase, 'defeat');
    assert.equal(battle.enemies[0].hp, 5);
    assert.equal(battle.reward, 0);
    assert.equal(battle.kills, 0);
  }
});

test('a finished battle never lands or launches a tower shot', () => {
  for (const phase of ['victory', 'defeat']) {
    const battle = encounter({ targets: [{ hp: 5 }] });
    updateBattle(battle, DT);
    battle.phase = phase;
    assert.equal(shots(advance(battle, 5)).length, 0);
    assert.equal(battle.enemies[0].hp, 5);
    assert.equal(battle.kills, 0);
    assert.equal(battle.reward, 0);
  }
});

test('an upgraded Capitol remains outside allied healing', () => {
  const hero = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { heal_unlock: 1 } });
  const battle = encounter({ capitol: { health: 2, tower: 1 }, hero,
    formation: [{ id: 1, type: 'healer', level: 10, col: 0, row: 2 }] });
  battle.castle.hp = 70;
  Object.assign(battle.hero, { x: FIELD.kingX, y: FIELD.kingFeet - 15, action: 'idle', cooldown: 0 });
  Object.assign(battle.allies[0], { x: FIELD.kingX, y: FIELD.kingFeet - 30, action: 'idle', cooldown: 0 });
  advance(battle, 6);
  assert.equal(battle.castle.hp, 70);
});

test('tower damage and cadence are deterministic at low/high FPS and all speed settings', () => {
  let expected;
  for (const fps of [10, 20, 30, 60, 120]) for (const speed of BATTLE_SPEEDS) {
    const battle = encounter();
    const events = advance(battle, 8, battleFrameDelta(1 / fps, speed));
    const snapshot = { hp: battle.enemies[0].hp, cooldown: battle.castle.cooldown,
      elapsed: battle.elapsed, shots: shots(events).length, kills: battle.kills, reward: battle.reward };
    expected ??= snapshot;
    assert.deepEqual(snapshot, expected, `${fps} FPS, x${speed}`);
  }
  assert.equal(expected.hp, 9960);
  assert.equal(expected.shots, 4);
});
