import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, updateBattle } from '../combat.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';
import { makeFormation } from '../scripts/combat-balance.mjs';

const DT = 1 / 60;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const hold = unit => Object.assign(unit, { action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999 });

function fixture(type, forge) {
  const formation = [{ id: 1, type, level: 1, col: 2, row: 1 }];
  if (type === 'healer') formation.push({ id: 2, type: 'swordsman', level: 1, col: 2, row: 0 });
  const battle = createBattle(formation, 1, undefined, forge);
  const spawns = [{ at: 0, type: 'goblin', hp: 10000, damage: 0, x: 195, y: 180 }];
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: 1, nextSpawn: 0 });
  updateBattle(battle, DT);
  for (const unit of [...battle.allies, ...battle.enemies, battle.hero]) hold(unit);
  const actor = battle.allies[0];
  Object.assign(actor, { x: 195, y: 210, action: 'idle', actionTime: 0, cooldown: 0, targetId: null });
  if (type === 'healer') Object.assign(battle.allies[1], { x: 235, y: 210, hp: 1, maxHp: 10000 });
  return battle;
}

test('forge snapshots affect all regular units but preserve hero, castle and spawned enemies', () => {
  const formation = makeFormation({ swordsman: 1, archer: 1, healer: 1 });
  formation.push({ id: 99, type: 'lancer', level: 3, col: 3, row: 1 });
  const neutral = createBattle(formation, 1);
  assert.deepEqual(createBattle(formation, 1, undefined, createForge()), neutral);
  const forge = createForge({ health: 10, attack: 20, attackSpeed: 30, rangedAttack: 40, rangedAttackSpeed: 50 });
  const improved = createBattle(formation, 1, undefined, forge);
  assert.deepEqual(improved.hero, neutral.hero);
  assert.deepEqual(improved.castle, neutral.castle);
  for (let i = 0; i < formation.length; i++) {
    const stats = getForgedUnitStats(formation[i].type, formation[i].level, forge);
    for (const field of ['hp', 'damage', 'heal', 'attackSpeed']) assert.equal(improved.allies[i][field], stats[field]);
  }
  for (const battle of [neutral, improved]) {
    battle.wave = { ...battle.wave, spawns: battle.wave.spawns.map(spawn => ({ ...spawn, at: 0 })) };
    battle.nextSpawn = 0;
    updateBattle(battle, DT);
  }
  assert.ok(neutral.enemies.length > 0);
  assert.deepEqual(improved.enemies, neutral.enemies);
  const snapshot = structuredClone(improved.allies);
  for (const id of Object.keys(forge)) forge[id] = 100;
  assert.deepEqual(improved.allies, snapshot, 'purchases cannot mutate an already running battle');
  const next = createBattle(formation, 2, undefined, forge);
  assert.ok(next.allies[0].maxHp > snapshot[0].maxHp);
  assert.ok(next.allies[1].attackSpeed > snapshot[1].attackSpeed);
});

test('forged attack and healing rates scale both action windups and cooldowns', () => {
  const durations = { swordsman: .65, lancer: .75, archer: .7, healer: .8 };
  const intervals = { swordsman: 1.1, lancer: 1.3, archer: 1.4, healer: 1.45 };
  const forge = createForge({ attackSpeed: 50, rangedAttackSpeed: 50 });
  for (const type of Object.keys(durations)) {
    const battle = fixture(type, forge), unit = battle.allies[0];
    updateBattle(battle, DT);
    assert.equal(unit.action, type === 'healer' ? 'heal' : type === 'archer' ? 'shoot' : 'attack');
    const speed = type === 'archer' ? 2 : 1.5;
    close(unit.actionDuration, durations[type] / COMBAT_PACE / speed);
    close(unit.cooldown, intervals[type] / COMBAT_PACE / speed);
  }
});

test('a first forge rank causes fractional damage and healing in actual combat', () => {
  for (const type of ['swordsman', 'archer', 'healer']) {
    const battle = fixture(type, createForge({ attack: 1 }));
    const target = type === 'healer' ? battle.allies[1] : battle.enemies[0];
    const startHp = target.hp;
    while (target.hp === startHp && battle.elapsed < 5) updateBattle(battle, DT);
    assert.notEqual(target.hp, startHp);
    close(Math.abs(target.hp - startHp), type === 'healer' ? 4.04 : type === 'archer' ? 8.08 : 6.06);
  }
});

test('attack-speed upgrades increase monk healing cadence without changing per-cast healing', () => {
  function healing(speed) {
    const battle = fixture('healer', createForge({ attackSpeed: speed }));
    const amounts = [], seen = new Set();
    while (battle.elapsed < 10) {
      updateBattle(battle, DT);
      for (const effect of battle.effects) if (effect.type === 'heal' && !seen.has(effect.id)) {
        seen.add(effect.id);
        amounts.push(effect.amount);
      }
    }
    assert.ok(amounts.every(amount => amount === 4));
    return amounts.length;
  }
  const base = healing(0), faster = healing(100);
  assert.ok(base >= 5);
  assert.ok(faster >= base * 1.8, `${base} heals versus ${faster}`);
});

test('upgraded combat stays deterministic across every speed and 30/60/120 FPS', () => {
  const formation = makeFormation({ swordsman: 4, archer: 1, healer: 2, level: 20 });
  const forge = Object.freeze(createForge({ health: 17, attack: 13, attackSpeed: 21, rangedAttack: 9, rangedAttackSpeed: 19 }));
  const withoutVisualTimers = ({ hitTime, deathTime, ...actor }) => actor;
  function run(fps, speed) {
    const battle = createBattle(formation, 9, undefined, forge), events = [];
    for (let frame = 0; battle.phase === 'running' && frame < 30000; frame++) events.push(...updateBattle(battle, battleFrameDelta(1 / fps, speed)));
    assert.equal(battle.phase, 'victory');
    const { stepRemainder, effects, allies, enemies, hero, castle, king, ...state } = battle;
    return { ...state, allies: allies.map(withoutVisualTimers), enemies: enemies.map(withoutVisualTimers),
      hero: withoutVisualTimers(hero), castle: withoutVisualTimers(castle), events };
  }
  const expected = run(60, 1.5);
  for (const speed of BATTLE_SPEEDS) for (const fps of [30, 60, 120]) assert.deepEqual(run(fps, speed), expected, `${fps} FPS ×${speed}`);
});
