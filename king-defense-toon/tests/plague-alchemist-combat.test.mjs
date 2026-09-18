import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, getUnitRange, updateBattle } from '../combat.ts';
import { battleFrameDelta } from '../battle-speed.ts';
import { createHero, heroXpForLevel } from '../hero.ts';

const DT = 1 / 60;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const hold = actor => Object.assign(actor, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});
const awaken = actor => Object.assign(actor, { action: 'idle', actionTime: 0, didImpact: false, cooldown: 0 });

function advance(battle, seconds) {
  for (let step = 0; step < Math.round(seconds / DT); step++) updateBattle(battle, DT);
}

function encounter({ heroState, formation = [{ id: 1, type: 'swordsman', level: 100, col: 2, row: 0 }] } = {}) {
  const battle = createBattle(formation, 1, heroState);
  const spawns = [
    { at: 0, type: 'plagueAlchemist', hp: 1000, damage: 40, reward: 2, x: 195, y: 180 },
    { at: 0, type: 'skeleton', hp: 1000, damage: 0, reward: 2, x: 300, y: 180 },
  ];
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  for (const unit of [...battle.allies, battle.hero]) hold(unit);
  updateBattle(battle, DT);
  for (const unit of battle.enemies) hold(unit);
  if (!heroState) Object.assign(battle.hero, { hp: 0, action: 'dead' });
  const target = battle.allies[0];
  if (target) Object.assign(target, { x: 195, y: 270 });
  battle.effects = [];
  return { battle, caster: battle.enemies[0], target };
}

function bottle(battle, source, target, damage = 40, extra = {}) {
  return {
    id: battle.nextEffectId++, type: 'poison-bottle',
    x: source.x, y: source.y - 27, targetX: target.x, targetY: target.y - 27,
    age: 0, duration: 0, side: source.side, sourceType: source.type, sourceId: source.id,
    targetId: target.id, damage, ...extra,
  };
}

function applyPoison(battle, caster, target, damage = 40) {
  battle.effects.push(bottle(battle, caster, target, damage));
  updateBattle(battle, DT);
}

test('alchemist releases one bottle at the throw impact pose, then poison starts on arrival without instant damage', () => {
  const { battle, caster, target } = encounter();
  awaken(caster);
  updateBattle(battle, DT);
  assert.equal(getUnitRange('plagueAlchemist'), 120);
  assert.equal(caster.action, 'shoot');
  assert.equal(caster.actionDuration, .8 / COMBAT_PACE);
  assert.equal(caster.impactFraction, .5);
  close(caster.cooldown, 2.6 / COMBAT_PACE);
  const hp = target.hp;
  const releaseStep = Math.ceil(caster.actionDuration * caster.impactFraction / DT);
  advance(battle, (releaseStep - 1) * DT);
  assert.ok(!battle.effects.some(effect => effect.type === 'poison-bottle'));
  const events = updateBattle(battle, DT);
  const shot = battle.effects.find(effect => effect.type === 'poison-bottle');
  assert.ok(shot);
  assert.equal(shot.targetId, target.id);
  assert.equal(shot.damage, 40);
  assert.equal(shot.age, 0);
  assert.ok(!events.some(event => event.type === 'bow-shot'));
  assert.equal(target.hp, hp);
  assert.equal(target.poison, undefined);
  hold(caster);
  while (!target.poison) updateBattle(battle, DT);
  assert.equal(target.hp, hp);
  assert.deepEqual(target.poison, { remaining: 4, nextTick: 1, damagePerTick: 10 });
  const impact = battle.effects.find(effect => effect.type === 'poison-impact');
  assert.equal(impact.targetId, target.id);
  assert.equal(impact.duration, .45);
  assert.equal(impact.x, target.x);
  assert.equal(impact.y, target.y - 27);
});

test('one bottle deals exactly four one-second ticks to only its target and then expires', () => {
  const { battle, caster, target } = encounter({ formation: [
    { id: 1, type: 'swordsman', level: 100, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 100, col: 3, row: 0 },
  ] });
  const neighbour = battle.allies[1];
  Object.assign(neighbour, { x: target.x + 10, y: target.y });
  const hp = target.hp, neighbourHp = neighbour.hp;
  applyPoison(battle, caster, target);
  advance(battle, 1 - DT);
  assert.equal(target.hp, hp);
  for (let tick = 1; tick <= 4; tick++) {
    updateBattle(battle, DT);
    close(target.hp, hp - tick * 10);
    if (tick < 4) advance(battle, 1 - DT);
  }
  assert.equal(target.poison, undefined);
  assert.equal(neighbour.hp, neighbourHp);
  advance(battle, 2);
  assert.equal(target.hp, hp - 40);
});

test('repeat hits keep the next tick, refresh the duration and retain only the strongest poison', () => {
  const { battle, caster, target } = encounter();
  const hp = target.hp;
  applyPoison(battle, caster, target);
  advance(battle, .5);
  const nextTick = target.poison.nextTick;
  applyPoison(battle, caster, target, 20);
  close(target.poison.nextTick, nextTick - DT);
  assert.equal(target.poison.remaining, 4);
  assert.equal(target.poison.damagePerTick, 10);
  advance(battle, .5 - DT);
  assert.equal(target.hp, hp - 10, 'a weaker refresh cannot postpone or weaken the due tick');
  applyPoison(battle, caster, target, 80);
  assert.equal(target.poison.damagePerTick, 20);
  const secondCaster = { ...caster, id: 'other-alchemist' };
  battle.effects.push(bottle(battle, secondCaster, target, 60), bottle(battle, caster, target, 20));
  updateBattle(battle, DT);
  assert.equal(target.poison.damagePerTick, 20, 'simultaneous casters do not add their budgets');
  advance(battle, 1 - 2 * DT);
  assert.equal(target.hp, hp - 30);
  advance(battle, 4);
  assert.equal(target.poison, undefined);
});

test('poison ticks use the normal armour aura and shield rules', () => {
  const heroState = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { aura_unlock: 1 } });
  const { battle, caster, target } = encounter({ heroState });
  Object.assign(battle.hero, { x: 230, y: 270 });
  target.shield = 15;
  target.shieldTime = 10;
  const hp = target.hp;
  const tick = 10 * (1 - battle.hero.stats.auraReduction);
  applyPoison(battle, caster, target);
  advance(battle, 1);
  close(target.shield, 15 - tick);
  close(target.hp, hp);
  advance(battle, 1);
  close(target.shield, 0);
  close(target.hp, hp - (2 * tick - 15));
});

test('poison can trigger and consume the hero guardian ward through the same damage path', () => {
  const heroState = createHero({ xp: heroXpForLevel(20), talentVersion: 2,
    talents: { aura_unlock: 1, aura_power: 3, aura_radius: 1, guardian_ward: 2 } });
  const { battle, caster } = encounter({ heroState });
  const hero = battle.hero;
  Object.assign(hero, { x: 195, y: 270 });
  assert.equal(hero.stats.guardianWardFraction, .12);
  const hp = hero.hp;
  const tick = hero.maxHp * .12;
  applyPoison(battle, caster, hero, tick * 4 / (1 - hero.stats.auraReduction));
  advance(battle, 1);
  close(hero.hp, hp - tick);
  close(hero.guardianWard, hero.maxHp * .12);
  advance(battle, 1);
  close(hero.hp, hp - tick);
  close(hero.guardianWard, 0);
  assert.ok(hero.poison);
});

test('a monk can heal a poisoned ally without cleansing or duplicating the status', () => {
  const { battle, caster, target } = encounter({ formation: [
    { id: 1, type: 'swordsman', level: 100, col: 2, row: 0 },
    { id: 2, type: 'healer', level: 1, col: 2, row: 1 },
  ] });
  const monk = battle.allies[1];
  Object.assign(monk, { x: target.x, y: target.y + 40 });
  applyPoison(battle, caster, target, 8);
  advance(battle, 1);
  const hp = target.hp;
  awaken(monk);
  advance(battle, .6);
  assert.ok(target.hp > hp);
  assert.ok(target.poison && target.poison.remaining < 3);
  assert.ok(battle.effects.some(effect => effect.type === 'heal' && effect.sourceId === monk.id));
});

test('bottle arrival rejects dead, missing, opposing and invalid targets or damage', () => {
  for (const invalid of ['dead', 'missing', 'enemy', 'source-side', 'source-type', 'nan', 'infinity', 'negative', 'zero']) {
    const { battle, caster, target } = encounter();
    const effect = bottle(battle, caster, target);
    if (invalid === 'dead') target.hp = 0;
    if (invalid === 'missing') effect.targetId = 'missing';
    if (invalid === 'enemy') effect.targetId = battle.enemies[1].id;
    if (invalid === 'source-side') effect.side = 'ally';
    if (invalid === 'source-type') effect.sourceType = 'goblin';
    if (invalid === 'nan') effect.damage = NaN;
    if (invalid === 'infinity') effect.damage = Infinity;
    if (invalid === 'negative') effect.damage = -1;
    if (invalid === 'zero') effect.damage = 0;
    const hp = target.hp;
    battle.effects.push(effect);
    updateBattle(battle, DT);
    assert.equal(target.hp, hp, invalid);
    assert.equal(target.poison, undefined, invalid);
    assert.ok(!battle.effects.some(effect => effect.type === 'poison-impact'), invalid);
  }
});

test('a killed caster cannot release a bottle, but a released bottle and poison outlive their caster', () => {
  const first = encounter();
  awaken(first.caster);
  updateBattle(first.battle, DT);
  first.caster.hp = 0;
  advance(first.battle, 1);
  assert.ok(!first.battle.effects.some(effect => effect.type === 'poison-bottle'));
  assert.equal(first.target.poison, undefined);

  const { battle, caster, target } = encounter();
  const hp = target.hp;
  battle.effects.push(bottle(battle, caster, target, 40, { duration: .25 }));
  caster.hp = 0;
  advance(battle, .25 + DT);
  assert.ok(target.poison);
  advance(battle, 4);
  assert.equal(target.hp, hp - 40);
  assert.equal(target.poison, undefined);
});

test('death and both battle outcomes discard poison and unresolved bottles without post-battle damage', () => {
  const dead = encounter();
  dead.target.hp = 1;
  applyPoison(dead.battle, dead.caster, dead.target);
  advance(dead.battle, 1);
  assert.equal(dead.target.hp, 0);
  assert.equal(dead.target.action, 'dead');
  assert.equal(dead.target.poison, undefined);
  assert.equal(dead.battle.reward, 0);
  for (const outcome of ['victory', 'defeat']) {
    const { battle, caster, target } = encounter();
    applyPoison(battle, caster, target);
    const hp = target.hp;
    battle.effects.push(bottle(battle, caster, target, 40, { duration: 10 }));
    if (outcome === 'victory') {
      for (const enemy of battle.enemies) enemy.hp = 0;
      battle.kills = battle.total;
    } else battle.castle.hp = 0;
    updateBattle(battle, DT);
    assert.equal(battle.phase, outcome);
    assert.equal(target.poison, undefined);
    assert.ok(!battle.effects.some(effect => effect.type === 'poison-bottle'));
    advance(battle, 5);
    assert.equal(target.hp, hp);
  }
});

test('castle fallback takes one complete hit without poison and a lone alchemist can finish it', () => {
  const { battle, caster } = encounter({ formation: [] });
  applyPoison(battle, caster, battle.castle, 40);
  assert.equal(battle.castle.hp, 60);
  assert.equal(battle.castle.poison, undefined);
  advance(battle, 4);
  assert.equal(battle.castle.hp, 60, 'the same bottle cannot deal damage twice');
  awaken(caster);
  while (battle.phase === 'running' && battle.elapsed < 30) updateBattle(battle, DT);
  assert.equal(battle.phase, 'defeat');
  assert.equal(battle.castle.poison, undefined);
  assert.ok(caster.y >= 125);
});

test('incoming alchemists enter the arena before throwing and revalidate the target at release', () => {
  const incoming = encounter();
  Object.assign(incoming.caster, { x: 195, y: 100 });
  Object.assign(incoming.target, { x: 195, y: 190 });
  awaken(incoming.caster);
  updateBattle(incoming.battle, DT);
  assert.equal(incoming.caster.action, 'walk');
  assert.ok(incoming.caster.y > 100);
  assert.equal(incoming.caster.targetId, null);
  for (const invalid of ['dead', 'opposing', 'distant']) {
    const { battle, caster, target } = encounter();
    awaken(caster);
    updateBattle(battle, DT);
    if (invalid === 'dead') target.hp = 0;
    if (invalid === 'opposing') target.side = 'enemy';
    if (invalid === 'distant') target.y = 400;
    advance(battle, .5);
    assert.ok(!battle.effects.some(effect => effect.type === 'poison-bottle'), invalid);
  }
});

test('alchemist throws and poison ticks stay identical across supported frame rates and speed settings', () => {
  let baseline;
  for (const fps of [10, 20, 30, 60, 120]) for (const speed of [1, 2, 3]) {
    const { battle, caster, target } = encounter();
    awaken(caster);
    for (let elapsed = 0; elapsed < 15 - 1e-8;) {
      const dt = Math.min(battleFrameDelta(1 / fps, speed), 15 - elapsed);
      updateBattle(battle, dt);
      elapsed += dt;
    }
    const snapshot = { hp: target.hp, poison: target.poison, phase: battle.phase,
      elapsed: battle.elapsed, caster: { action: caster.action, time: caster.actionTime, cooldown: caster.cooldown },
      effects: battle.effects, effectId: battle.nextEffectId };
    if (!baseline) baseline = snapshot;
    else assert.deepEqual(snapshot, baseline, `${fps} FPS / x${speed}`);
  }
});

test('a hero with Hammer on cooldown closes into melee against a remaining alchemist', () => {
  const heroState = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { hammer_unlock: 1 } });
  const { battle, caster } = encounter({ heroState, formation: [] });
  battle.enemies[1].hp = 0;
  battle.kills = 1;
  Object.assign(battle.hero, { x: 195, y: 290, hammerCooldown: 999 });
  awaken(battle.hero);
  const startY = battle.hero.y, hp = caster.hp;
  advance(battle, 3);
  assert.ok(battle.hero.y < startY - 40, 'hero leaves ranged holding distance');
  assert.ok(caster.hp < hp, 'hero actually lands a melee hit while Hammer remains on cooldown');
  assert.ok(battle.hero.hammerCooldown > 990);
});
