import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, getUnitRange, updateBattle } from '../combat.ts';

const DT = 1 / 60;

function advance(battle, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += DT) updateBattle(battle, DT);
}

function hold(unit) {
  Object.assign(unit, { action: 'attack', actionDuration: 999, actionTime: 0, didImpact: true, cooldown: 999 });
}

function encounter(otherEnemies = [], { heal = 12, withAlly = true } = {}) {
  const battle = createBattle(withAlly ? [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }] : [], 1);
  const spawns = [
    { type: 'goblinHealer', hp: 70, damage: 3, heal, x: 195, y: 160 },
    ...otherEnemies.map(enemy => ({ type: 'goblin', hp: 100, damage: 0, x: 195, y: 225, ...enemy })),
  ].map(spawn => ({ at: 0, ...spawn }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  updateBattle(battle, DT);
  // These cases isolate enemy support; an active paladin would heal, throw hammers and reduce damage.
  Object.assign(battle.hero, { hp: 0, action: 'dead', pendingAbility: null });
  for (const unit of [...battle.allies, ...battle.enemies.slice(1), battle.king]) hold(unit);
  const caster = battle.enemies[0];
  Object.assign(caster, { x: 195, y: 160, action: 'idle', actionTime: 0, cooldown: 0 });
  return { battle, caster, patients: battle.enemies.slice(1) };
}

test('enemy healer picks the most wounded fighter, including a boss, and uses its scaled flat heal', () => {
  const { battle, caster, patients: [fighter, boss] } = encounter([
    { x: 165, y: 210 },
    { type: 'goblinChief', hp: 1000, x: 225, y: 220 },
  ], { heal: 24 });
  fighter.hp = 60;
  boss.hp = 300;
  battle.allies[0].hp = 1;
  advance(battle, .6);
  assert.equal(caster.targetId, boss.id);
  assert.equal(boss.hp, 324, 'boss healing is a flat amount, not a percentage of boss HP');
  assert.equal(fighter.hp, 60);
  assert.equal(battle.allies[0].hp, 1);
  assert.ok(battle.effects.some(effect => effect.type === 'heal' && effect.side === 'enemy'
    && effect.sourceType === 'goblinHealer' && effect.amount === 24));
  assert.equal(caster.actionDuration, .8 / COMBAT_PACE);
});

test('enemy healing is capped by missing HP and obeys the longer cast cooldown', () => {
  const { battle, caster, patients: [patient] } = encounter([{}]);
  patient.hp = 99;
  advance(battle, .6);
  assert.equal(patient.hp, 100);
  assert.ok(battle.effects.some(effect => effect.type === 'heal' && effect.amount === 1));
  patient.hp = 70;
  advance(battle, 1.5);
  assert.equal(patient.hp, 70, 'no second heal before the 2.6 / pace interval');
  assert.ok(caster.cooldown > 0);
  advance(battle, 1.6);
  assert.equal(patient.hp, 82);
});

test('an in-progress enemy cast rejects dead, opposing, distant, self and healer targets', () => {
  for (const invalid of ['dead', 'opposing', 'distant', 'self', 'healer', 'dead-caster', 'king']) {
    const { battle, caster, patients: [patient, otherHealer] } = encounter([
      {}, { type: 'goblinHealer', hp: 70, heal: 12, x: 235, y: 190 },
    ]);
    patient.hp = 60;
    otherHealer.hp = 30;
    caster.hp = 30;
    updateBattle(battle, DT);
    assert.equal(caster.action, 'heal');
    if (invalid === 'dead') Object.assign(patient, { hp: 0, action: 'dead' });
    if (invalid === 'opposing') patient.side = 'ally';
    if (invalid === 'distant') patient.y = 350;
    if (invalid === 'self') caster.targetId = caster.id;
    if (invalid === 'healer') caster.targetId = otherHealer.id;
    if (invalid === 'dead-caster') caster.hp = 0;
    if (invalid === 'king') {
      Object.assign(battle.king, { hp: 10, x: 200, y: 170, side: 'enemy' });
      caster.targetId = battle.king.id;
    }
    const previous = [patient.hp, otherHealer.hp, caster.hp, battle.king.hp];
    advance(battle, .6);
    assert.deepEqual([patient.hp, otherHealer.hp, caster.hp, battle.king.hp], previous, invalid);
    assert.ok(!battle.effects.some(effect => effect.type === 'heal'), invalid);
  }
});

test('healthy enemy support follows behind the front without charging the allied line', () => {
  const { battle, caster, patients: [front] } = encounter([{ y: 290 }]);
  const startY = caster.y;
  advance(battle, 2);
  assert.ok(caster.y > startY + 25, 'support follows an advancing front');
  assert.ok(caster.y < front.y - 40, 'support remains behind the healthy fighter');
  assert.ok(!battle.effects.some(effect => effect.sourceId === caster.id));
  assert.equal(caster.followId, front.id);
});

test('enemy healer closes to a distant patient instead of casting outside heal reach', () => {
  const { battle, caster, patients: [patient] } = encounter([{ y: 300 }]);
  patient.hp = 50;
  advance(battle, 1);
  assert.ok(caster.y > 195);
  assert.equal(patient.hp, 50);
  advance(battle, 1.2);
  assert.equal(patient.hp, 62);
  assert.ok(Math.hypot(caster.x - patient.x, caster.y - patient.y) <= 95);
});

test('a lone enemy healer advances and performs weak melee instead of waiting indefinitely', () => {
  const { battle, caster } = encounter();
  assert.equal(getUnitRange('goblinHealer'), 34);
  caster.hp = 30;
  const ally = battle.allies[0];
  const originalHp = ally.hp;
  const startY = caster.y;
  advance(battle, 3.6);
  assert.ok(caster.y > startY + 80);
  assert.equal(ally.hp, originalHp - 3);
  assert.equal(caster.hp, 30, 'the lone healer cannot heal itself');
  assert.equal(battle.enraged, false);
});

test('two wounded enemy healers cannot heal one another and both advance on the castle', () => {
  const { battle, caster, patients: [other] } = encounter([
    { type: 'goblinHealer', hp: 70, heal: 12, x: 235, y: 160 },
  ], { withAlly: false });
  Object.assign(other, { action: 'idle', actionTime: 0, cooldown: 0 });
  caster.hp = 30;
  other.hp = 30;
  advance(battle, 2);
  assert.ok(caster.y > 180 && other.y > 180);
  assert.equal(caster.hp, 30);
  assert.equal(other.hp, 30);
  assert.ok(!battle.effects.some(effect => effect.type === 'heal'));
});

test('the hero counters a supporting enemy healer while the defended castle stays inert', () => {
  const { battle, caster } = encounter([], { withAlly: false });
  Object.assign(caster, { x: 65, y: 360 });
  hold(caster);
  Object.assign(battle.hero, { hp: battle.hero.maxHp, x: 160, y: 360, action: 'idle',
    actionTime: 0, cooldown: 0, hammerCooldown: 0 });
  Object.assign(battle.castle, { action: 'idle', actionTime: 0, cooldown: 0 });
  const originalHp = caster.hp;
  advance(battle, 1);
  assert.equal(caster.hp, originalHp - 4);
  assert.equal(battle.castle.hp, battle.castle.maxHp);
  assert.equal(battle.castle.action, 'idle');
  assert.ok(!battle.effects.some(effect => effect.sourceId === battle.castle.id));
});
