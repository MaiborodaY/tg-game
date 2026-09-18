import assert from 'node:assert/strict';
import test from 'node:test';
import { CASTLE_MAX_HP, COMBAT_PACE, createBattle, updateBattle } from '../combat.ts';
import { createHero, HERO_TALENTS, heroXpForLevel } from '../hero.ts';
import { FIELD, HERO_START, WALKABLE_AREAS, positionForCell } from '../field.ts';

const DT = 1 / 60;
const sword = (id = 1, col = 2) => ({ id, type: 'swordsman', level: 1, col, row: 0 });
const build = (talents, level = 20) => createHero({ xp: heroXpForLevel(level), highestWave: 0, talentVersion: 2, talents });
const branchBuild = branch => build(Object.fromEntries(HERO_TALENTS
  .filter(talent => talent.branch === branch).map(talent => [talent.id, talent.maxRank])));
const light = branchBuild('light');
const protection = branchBuild('protection');
const judgement = branchBuild('judgement');
const healingRoot = build({ heal_unlock: 1 }, 2);
const auraRoot = build({ aura_unlock: 1 }, 2);
const hammerRoot = build({ hammer_unlock: 1 }, 2);

function advance(battle, seconds, dt = DT) {
  for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += dt) updateBattle(battle, Math.min(dt, seconds - elapsed));
}

function hold(unit) {
  Object.assign(unit, { action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999 });
}

function releaseHero(hero) {
  Object.assign(hero, { action: 'idle', actionTime: 0, pendingAbility: null, cooldown: 9999,
    healCooldown: 9999, hammerCooldown: 9999 });
}

function encounter({ formation = [sword(), sword(2, 3)], heroState, enemies = [{}] } = {}) {
  const battle = createBattle(formation, 1, heroState);
  const spawns = enemies.map(enemy => ({ at: 0, type: 'goblin', hp: 1000, damage: 0, x: 195, y: 100, ...enemy }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  updateBattle(battle, DT);
  for (const unit of [...battle.allies, ...battle.enemies, battle.hero]) hold(unit);
  Object.assign(battle.hero, { x: 195, y: 330 });
  return battle;
}

function incoming(battle, target, damage = 10) {
  battle.effects.push({ id: battle.nextEffectId++, type: 'arrow', targetId: target.id,
    sourceId: battle.enemies[0].id, damage, age: 0, duration: 0 });
  updateBattle(battle, DT);
}

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message ?? ''}: ${actual} !== ${expected}`);
}

test('fresh hero is a separate mainland actor with less personal DPS than a swordsman and an inert castle', () => {
  const battle = createBattle([sword()]);
  assert.equal(battle.allies.length, 1);
  assert.equal(battle.hero.type, 'hero');
  assert.equal(battle.hero.hp, 60);
  assert.equal(battle.hero.damage, 4);
  assert.deepEqual([battle.hero.x, battle.hero.y], [HERO_START.x, HERO_START.y]);
  for (let col = 0; col < FIELD.columns; col += 1) {
    for (let row = 0; row < FIELD.rows; row += 1) {
      const cell = positionForCell(col, row);
      assert.ok(Math.hypot(battle.hero.x - cell.x, battle.hero.y - cell.y) > 40, 'hero has a separate starting position');
    }
  }
  assert.equal(battle.castle.type, 'castle');
  assert.equal(battle.castle.hp, CASTLE_MAX_HP);
  assert.equal(battle.castle.damage, 0);
  assert.ok(battle.hero.damage / (1.2 / COMBAT_PACE) < battle.allies[0].damage / (1.1 / COMBAT_PACE));
  assert.ok(Object.isFrozen(battle.hero.stats));
  assert.ok(![...battle.allies, ...battle.enemies, battle.hero, battle.castle].some(unit => unit.type === 'king'));
});

test('unlearned branches never heal, mitigate damage, throw a hammer or create skill effects', () => {
  const battle = encounter({ enemies: [{ type: 'goblinArcher', x: 195, y: 290 }] });
  const hero = battle.hero, patient = battle.allies[0], enemy = battle.enemies[0];
  patient.hp = 20;
  releaseHero(hero);
  hero.healCooldown = hero.hammerCooldown = 0;
  incoming(battle, patient, 10);
  assert.equal(patient.hp, 10, 'a locked aura does not reduce any damage');
  advance(battle, 2);
  assert.equal(patient.hp, 10);
  assert.equal(enemy.hp, 1000);
  assert.equal(hero.pendingAbility, null);
  assert.ok(!battle.effects.some(effect => effect.type.startsWith('hero-')));
  assert.equal(hero.healCooldown, 0);
  assert.equal(hero.hammerCooldown, 0);
});

test('each first talent unlocks only its own skill, including after the first talent point', () => {
  for (const [root, state] of [['heal', healingRoot], ['aura', auraRoot], ['hammer', hammerRoot]]) {
    const battle = encounter({ heroState: state, enemies: [{ type: 'goblinArcher', x: 195, y: 290 }] });
    const hero = battle.hero, patient = battle.allies[0], enemy = battle.enemies[0];
    patient.hp = 20;
    releaseHero(hero);
    hero.healCooldown = hero.hammerCooldown = 0;
    incoming(battle, patient, 10);
    const afterDamage = patient.hp;
    close(afterDamage, root === 'aura' ? 10.4 : 10, root);
    advance(battle, .7);
    close(patient.hp, afterDamage + (root === 'heal' ? 4.2 : 0), root);
    close(enemy.hp, 1000 - (root === 'hammer' ? 6.3 : 0), root);
    assert.deepEqual([hero.stats.healUnlocked, hero.stats.auraUnlocked, hero.stats.hammerUnlocked],
      ['heal', 'aura', 'hammer'].map(skill => skill === root));
    assert.equal(hero.guardianWard, 0);
    assert.equal(hero.holyStrikeTime, 0);
  }
});

test('learning or resetting roots changes only the next wave, never an active combat snapshot', () => {
  const state = build({}, 4);
  const current = encounter({ heroState: state });
  Object.assign(state.talents, { heal_unlock: 1, aura_unlock: 1, hammer_unlock: 1 });
  assert.deepEqual([current.hero.stats.healUnlocked, current.hero.stats.auraUnlocked, current.hero.stats.hammerUnlocked], [false, false, false]);
  const next = createBattle([sword()], 2, state);
  assert.deepEqual([next.hero.stats.healUnlocked, next.hero.stats.auraUnlocked, next.hero.stats.hammerUnlocked], [true, true, true]);
  Object.assign(state.talents, { heal_unlock: 0, aura_unlock: 0, hammer_unlock: 0 });
  assert.equal(next.hero.stats.healUnlocked, true);
  assert.equal(next.hero.stats.auraUnlocked, true);
  assert.equal(next.hero.stats.hammerUnlocked, true);
  assert.equal(createBattle([sword()], 3, state).hero.stats.hammerUnlocked, false);
});

test('a hero without hammer closes into melee when friendly archers remain farther behind', () => {
  for (const heroState of [undefined, healingRoot, auraRoot]) {
    const battle = encounter({ heroState,
      formation: [{ id: 1, type: 'archer', col: 2, row: 2, level: 1 }],
      enemies: [{ type: 'goblinArcher', hp: 4, x: 195, y: 195 }],
    });
    Object.assign(battle.allies[0], { x: 195, y: 375 });
    releaseHero(battle.hero);
    battle.hero.cooldown = 0;
    let attacked = false;
    for (let elapsed = 0; elapsed < 8 && battle.phase === 'running'; elapsed += DT) {
      updateBattle(battle, DT);
      attacked ||= battle.hero.action === 'attack';
      assert.ok(!battle.effects.some(effect => effect.type === 'hero-hammer'));
    }
    assert.equal(battle.phase, 'victory');
    assert.equal(attacked, true);
  }
});

test('hero heals the most wounded reachable ally, including himself, and never overheals', () => {
  for (const self of [false, true]) {
    const battle = encounter({ heroState: healingRoot });
    const hero = battle.hero, patient = self ? hero : battle.allies[0];
    releaseHero(hero);
    hero.healCooldown = 0;
    patient.hp = self ? 20 : 59;
    battle.allies[1].hp = 59.5;
    const before = patient.hp;
    advance(battle, .5);
    close(patient.hp, Math.min(patient.maxHp, before + hero.stats.healAmount));
    assert.ok(hero.healCooldown > 7);
    assert.equal(battle.allies[1].hp, 59.5);
    assert.equal(hero.cooldown < 9999, true, 'basic cooldown keeps ticking during a spell');
    assert.ok(battle.effects.some(effect => effect.type === 'hero-heal' && effect.targetId === patient.id));
  }
});

test('queued hero healing rejects dead, opposing, distant and castle targets and a dead caster', () => {
  for (const invalid of ['dead', 'opposing', 'distant', 'castle', 'dead-caster']) {
    const battle = encounter({ heroState: healingRoot }), hero = battle.hero, patient = battle.allies[0];
    releaseHero(hero); hero.healCooldown = 0; patient.hp = 20;
    updateBattle(battle, DT);
    assert.equal(hero.pendingAbility.kind, 'heal');
    if (invalid === 'dead') patient.hp = 0;
    if (invalid === 'opposing') patient.side = 'enemy';
    if (invalid === 'distant') patient.y = 100;
    if (invalid === 'castle') { battle.castle.hp = 10; hero.pendingAbility.targetIds = [battle.castle.id]; }
    if (invalid === 'dead-caster') hero.hp = 0;
    const before = patient.hp;
    advance(battle, .5);
    assert.equal(patient.hp, before, invalid);
    assert.equal(battle.castle.hp, invalid === 'castle' ? 10 : 100, invalid);
    assert.ok(!battle.effects.some(effect => effect.type === 'hero-heal'), invalid);
  }
});

test('monks can heal the hero but never the castle', () => {
  const battle = encounter({ formation: [{ id: 1, type: 'healer', level: 1, col: 2, row: 0 }] });
  const monk = battle.allies[0];
  battle.hero.hp = 20;
  battle.castle.hp = 1;
  Object.assign(monk, { action: 'idle', cooldown: 0 });
  advance(battle, .55);
  assert.equal(monk.targetId, battle.hero.id);
  assert.ok(battle.hero.hp > 20);
  assert.equal(battle.castle.hp, 1);
});

test('light talents heal a second target and convert only excess healing into a finite shield', () => {
  const battle = encounter({ heroState: light }), hero = battle.hero;
  releaseHero(hero); hero.healCooldown = 0;
  battle.allies[0].hp = 59;
  battle.allies[1].hp = 59.5;
  advance(battle, .5);
  assert.equal(battle.allies[0].hp, 60);
  assert.equal(battle.allies[1].hp, 60);
  close(battle.allies[0].shield, Math.min(hero.stats.healShield, hero.stats.healAmount - 1));
  assert.equal(battle.allies[1].shield, 0);
  const shield = battle.allies[0].shield;
  incoming(battle, battle.allies[0], 2);
  assert.equal(battle.allies[0].hp, 60);
  close(battle.allies[0].shield, shield - 2);
  hold(hero);
  advance(battle, 6.1);
  assert.equal(battle.allies[0].shield, 0);
});

test('aura respects range and death, excludes the castle, and clamps self emergency guard at forty percent', () => {
  for (const state of ['near', 'far', 'dead', 'castle']) {
    const battle = encounter({ heroState: auraRoot }), hero = battle.hero;
    const target = state === 'castle' ? battle.castle : battle.allies[0];
    if (state === 'far') hero.y = 420;
    if (state === 'dead') hero.hp = 0;
    const before = target.hp;
    incoming(battle, target);
    close(before - target.hp, state === 'near' ? 9.6 : 10, state);
  }
  const battle = encounter({ heroState: protection }), hero = battle.hero;
  hero.hp = 30;
  incoming(battle, hero);
  close(hero.hp, 24);
  battle.allies[0].hp = 10;
  incoming(battle, battle.allies[0]);
  close(battle.allies[0].hp, 10 - 10 * (1 - hero.stats.auraReduction - hero.stats.bastionReduction),
    'emergency guard is hero-only; initial bastion protects allies');
});

test('hammer prefers ranged enemies, lands exactly once on arrival and has no initial stun', () => {
  const battle = encounter({ heroState: hammerRoot, enemies: [{ x: 195, y: 260 }, { type: 'goblinArcher', x: 250, y: 230 }] });
  const hero = battle.hero, ranged = battle.enemies[1];
  releaseHero(hero); hero.hammerCooldown = 0;
  updateBattle(battle, DT);
  assert.equal(hero.pendingAbility.targetIds[0], ranged.id);
  advance(battle, .36);
  assert.equal(ranged.hp, 1000, 'cast releases the projectile without immediate damage');
  assert.ok(battle.effects.some(effect => effect.type === 'hero-hammer'));
  advance(battle, .5);
  close(ranged.hp, 1000 - hero.stats.hammerDamage);
  assert.equal(ranged.stunTime, 0);
  advance(battle, 2);
  close(ranged.hp, 1000 - hero.stats.hammerDamage, 'expired projectile cannot deal a second hit');
  assert.equal(battle.enemies[0].hp, 1000);
});

test('queued base attack finishes before casting, while all ability cooldowns continue independently', () => {
  const battle = encounter({ heroState: build({ heal_unlock: 1, hammer_unlock: 1 }, 3), enemies: [{ x: 195, y: 290 }] });
  const hero = battle.hero, target = battle.enemies[0];
  releaseHero(hero); hero.cooldown = 0;
  updateBattle(battle, DT);
  assert.equal(hero.action, 'attack');
  assert.equal(hero.targetId, target.id);
  battle.allies[0].hp = 20;
  hero.healCooldown = 0;
  hero.hammerCooldown = .3;
  advance(battle, .5);
  close(target.hp, 1000 - hero.damage);
  assert.equal(hero.pendingAbility, null, 'a pending melee animation is never overwritten by a heal');
  assert.equal(hero.hammerCooldown, 0, 'hammer cooldown ticks during a basic attack');
  advance(battle, .4);
  assert.equal(hero.pendingAbility.kind, 'heal', 'healing has priority when the shared cast animation is free');
  assert.equal(hero.targetId, target.id, 'healing owns a separate target queue');
  advance(battle, .85);
  assert.equal(hero.pendingAbility.kind, 'hammer');
  close(battle.allies[0].hp, 20 + hero.stats.healAmount);
  assert.ok(hero.healCooldown < 7.5, 'healing cooldown ticks during a hammer cast');
});

test('hammer projectile arrival rejects dead targets, dead casters, allies and escaped targets', () => {
  for (const invalid of ['dead-target', 'dead-caster', 'opposing', 'distant']) {
    const battle = encounter({ heroState: hammerRoot, enemies: [{ type: 'goblinArcher', x: 195, y: 205 }] });
    const hero = battle.hero, target = battle.enemies[0];
    releaseHero(hero); hero.hammerCooldown = 0;
    advance(battle, .4);
    assert.ok(battle.effects.some(effect => effect.type === 'hero-hammer'), invalid);
    if (invalid === 'dead-target') target.hp = 0;
    if (invalid === 'dead-caster') hero.hp = 0;
    if (invalid === 'opposing') target.side = 'ally';
    if (invalid === 'distant') target.y = 40;
    const before = target.hp;
    advance(battle, .5);
    assert.equal(target.hp, before, invalid);
    assert.ok(!battle.effects.some(effect => effect.type === 'hero-hammer'), invalid);
  }
});

test('hammer splash damages and heavenly capstone stuns all enemies hit, within the splash radius', () => {
  const battle = encounter({ heroState: judgement, enemies: [
    { type: 'goblinArcher', x: 195, y: 230 }, { x: 225, y: 230 }, { x: 280, y: 230 },
  ] });
  const hero = battle.hero;
  releaseHero(hero); hero.hammerCooldown = 0;
  advance(battle, .75);
  close(battle.enemies[0].hp, 1000 - hero.stats.hammerDamage);
  close(battle.enemies[1].hp, 1000 - hero.stats.hammerDamage * hero.stats.hammerSplashFraction);
  assert.equal(battle.enemies[2].hp, 1000);
  assert.ok(battle.enemies[0].stunTime > 0 && battle.enemies[1].stunTime > 0);
});

test('miracle heals nearby living allies once per wave and bastion follows its independent timer', () => {
  const battle = encounter({ heroState: light }), hero = battle.hero;
  releaseHero(hero);
  battle.allies[0].hp = 10;
  battle.allies[1].hp = 0;
  hero.hp = 80;
  battle.castle.hp = 10;
  advance(battle, .5);
  assert.equal(hero.miracleUsed, true);
  assert.equal(battle.allies[0].hp, 19);
  close(hero.hp, 80 + hero.maxHp * .15);
  assert.equal(battle.allies[1].hp, 0);
  assert.equal(battle.castle.hp, 10);
  advance(battle, 2);
  assert.equal(battle.allies[0].hp, 19, 'no second emergency mass heal');

  const guarded = encounter({ heroState: protection });
  assert.ok(guarded.hero.bastionTime > 2.9, 'the first three-second bastion window starts with the wave');
  advance(guarded, 18);
  assert.ok(guarded.hero.bastionTime > 2.9);
  const before = guarded.allies[0].hp;
  incoming(guarded, guarded.allies[0]);
  close(before - guarded.allies[0].hp, 10 * (1 - guarded.hero.stats.auraReduction - guarded.hero.stats.bastionReduction));
  advance(guarded, 3.1);
  assert.equal(guarded.hero.bastionTime, 0);
});

test('guardian ward requires a surviving large HP hit, protects only the hero and never stacks', () => {
  const battle = encounter({ heroState: protection }), hero = battle.hero;
  incoming(battle, battle.allies[0], 20);
  assert.equal(hero.guardianWard, 0, 'a hit on an ally cannot trigger the personal ward');
  incoming(battle, hero, 12);
  assert.equal(hero.guardianWard, 0, 'mitigation reduces this below ten percent of maximum HP');
  const before = hero.hp;
  incoming(battle, hero, 20);
  close(before - hero.hp, 20 * (1 - hero.stats.auraReduction - hero.stats.bastionReduction),
    'the triggering hit is not retroactively shielded');
  close(hero.guardianWard, hero.maxHp * .12);
  assert.ok(hero.guardianWardTime > 3.9 && hero.guardianWardTime <= 4);
  assert.ok(hero.guardianWardCooldown > 11.9 && hero.guardianWardCooldown <= 12);
  const protectedHp = hero.hp;
  incoming(battle, hero, 10);
  assert.equal(hero.hp, protectedHp);
  const remaining = hero.guardianWard;
  assert.ok(remaining > 0 && remaining < hero.maxHp * .12);
  incoming(battle, hero, 40);
  assert.equal(hero.guardianWard, 0, 'a new big hit during cooldown consumes rather than refills the ward');
  assert.ok(hero.hp < protectedHp);
});

test('guardian ward has an independent four-second expiry and twelve-second cooldown', () => {
  const battle = encounter({ heroState: protection }), hero = battle.hero;
  incoming(battle, hero, 20);
  // The existing healing barrier has a separate lifetime and cannot extend the ward.
  hero.shield = 3;
  hero.shieldTime = 6;
  advance(battle, 4.1);
  assert.equal(hero.guardianWard, 0);
  assert.equal(hero.guardianWardTime, 0);
  assert.equal(hero.shield, 3);
  incoming(battle, hero, 20);
  assert.equal(hero.guardianWard, 0);
  advance(battle, 8.1);
  assert.equal(hero.shield, 0);
  assert.equal(hero.guardianWardCooldown, 0);
  incoming(battle, hero, 20);
  close(hero.guardianWard, hero.maxHp * .12);
  incoming(battle, hero, 1000);
  assert.equal(hero.hp, 0);
  assert.equal(hero.guardianWard, 0);
  assert.equal(hero.guardianWardTime, 0);
  assert.equal(hero.guardianWardCooldown, 0);
});

function empowerNextMelee(battle) {
  const hero = battle.hero;
  releaseHero(hero);
  hero.hammerCooldown = 0;
  advance(battle, .7);
  assert.ok(hero.holyStrikeTime > 5);
  for (const enemy of battle.enemies) { enemy.stunTime = 0; hold(enemy); }
  hold(hero);
}

test('holy strike empowers one successful melee hit after a hammer, based on personal base damage', () => {
  const battle = encounter({ heroState: judgement, enemies: [{ x: 195, y: 290 }] });
  const hero = battle.hero, target = battle.enemies[0];
  empowerNextMelee(battle);
  const previous = target.hp;
  releaseHero(hero); hero.cooldown = 0;
  advance(battle, .4);
  close(previous - target.hp, hero.baseDamage * 1.5);
  assert.equal(hero.holyStrikeTime, 0);
  advance(battle, 1.45);
  close(previous - target.hp, hero.baseDamage * 2.5, 'the second hit has no stored empowerment');
});

test('holy strike is not spent on a whiff or invalid target and repeated hammers only refresh one charge', () => {
  for (const invalid of ['distant', 'dead', 'ally']) {
    const battle = encounter({ heroState: judgement, enemies: [{ x: 195, y: 290 }, { x: 290, y: 150 }] });
    const hero = battle.hero, target = battle.enemies[0];
    empowerNextMelee(battle);
    releaseHero(hero); hero.cooldown = 0;
    updateBattle(battle, DT);
    assert.equal(hero.action, 'attack');
    if (invalid === 'distant') target.y = 150;
    if (invalid === 'dead') target.hp = 0;
    if (invalid === 'ally') target.side = 'ally';
    const before = target.hp;
    advance(battle, .4);
    assert.equal(target.hp, before, invalid);
    assert.ok(hero.holyStrikeTime > 0, invalid);
  }
  const repeated = encounter({ heroState: judgement, enemies: [{ x: 195, y: 290 }] });
  empowerNextMelee(repeated);
  empowerNextMelee(repeated);
  const before = repeated.enemies[0].hp;
  releaseHero(repeated.hero); repeated.hero.cooldown = 0;
  advance(repeated, .4);
  close(before - repeated.enemies[0].hp, repeated.hero.baseDamage * 1.5);
  assert.equal(repeated.hero.holyStrikeTime, 0);
});

test('holy strike expires after six seconds and is canceled when its owner dies', () => {
  const battle = encounter({ heroState: judgement, enemies: [{ x: 195, y: 290 }] });
  const hero = battle.hero, target = battle.enemies[0];
  empowerNextMelee(battle);
  advance(battle, 6.1);
  assert.equal(hero.holyStrikeTime, 0);
  const before = target.hp;
  releaseHero(hero); hero.cooldown = 0;
  advance(battle, .4);
  close(before - target.hp, hero.baseDamage);
  empowerNextMelee(battle);
  incoming(battle, hero, 1000);
  assert.equal(hero.hp, 0);
  assert.equal(hero.holyStrikeTime, 0);
});

test('missed or canceled hammers never grant holy strike', () => {
  for (const invalid of ['dead', 'ally', 'distant', 'dead-caster']) {
    const battle = encounter({ heroState: judgement, enemies: [{ x: 195, y: 205 }] });
    const hero = battle.hero, target = battle.enemies[0];
    releaseHero(hero); hero.hammerCooldown = 0;
    advance(battle, .4);
    assert.ok(battle.effects.some(effect => effect.type === 'hero-hammer'));
    if (invalid === 'dead') target.hp = 0;
    if (invalid === 'ally') target.side = 'ally';
    if (invalid === 'distant') target.y = 40;
    if (invalid === 'dead-caster') hero.hp = 0;
    advance(battle, .5);
    assert.equal(hero.holyStrikeTime, 0, invalid);
  }
});

test('learned skills and their timers give the same combat result at low, high and accelerated frame rates', () => {
  const heroState = build({
    heal_unlock: 1,
    aura_unlock: 1, aura_power: 3, aura_radius: 1, guardian_ward: 2,
    hammer_unlock: 1, hammer_power: 3, hammer_haste: 1, holy_strike: 2,
  });
  function simulate(frameDt) {
    const battle = encounter({ formation: [], heroState,
      enemies: [{ type: 'goblinArcher', x: 220, y: 290, damage: 20 }],
    });
    releaseHero(battle.hero);
    Object.assign(battle.hero, { cooldown: 0, healCooldown: 0, hammerCooldown: 0 });
    Object.assign(battle.enemies[0], { action: 'idle', actionTime: 0, cooldown: 0 });
    advance(battle, 18, frameDt);
    const hero = battle.hero;
    return {
      phase: battle.phase, kills: battle.kills, hp: hero.hp, enemyHp: battle.enemies[0].hp,
      position: [hero.x, hero.y], healCooldown: hero.healCooldown, hammerCooldown: hero.hammerCooldown,
      ward: hero.guardianWard, wardTime: hero.guardianWardTime, wardCooldown: hero.guardianWardCooldown,
      strikeTime: hero.holyStrikeTime, effects: battle.effects,
    };
  }
  const at60 = simulate(1 / 60);
  for (const frameDt of [1 / 30, 1 / 120, .255]) assert.deepEqual(simulate(frameDt), at60);
});

test('hero fall continues the wave, castle destruction defeats, and a new wave resets every transient', () => {
  const state = build({ hammer_unlock: 1, hammer_power: 2 });
  const battle = encounter({ heroState: state });
  const priorDamage = battle.hero.stats.hammerDamage;
  state.talents.hammer_power = 3;
  close(battle.hero.stats.hammerDamage, priorDamage, 'combat owns an immutable stats snapshot');
  battle.hero.hp = 0;
  updateBattle(battle, DT);
  assert.equal(battle.phase, 'running');
  assert.equal(battle.hero.pendingAbility, null);
  battle.castle.hp = 0;
  updateBattle(battle, DT);
  assert.equal(battle.phase, 'defeat');
  assert.equal(battle.hero.bastionTime, 0);
  assert.ok(!battle.effects.some(effect => ['arrow', 'hero-hammer'].includes(effect.type)));
  const next = createBattle([sword()], 2, state);
  assert.equal(next.hero.hp, next.hero.maxHp);
  assert.equal(next.castle.hp, 100);
  assert.equal(next.hero.shield, 0);
  assert.equal(next.hero.healCooldown, 0);
  assert.equal(next.hero.hammerCooldown, 0);
  assert.equal(next.hero.pendingAbility, null);
  assert.equal(next.hero.miracleUsed, false);
  assert.ok(next.hero.stats.hammerDamage > priorDamage, 'new talents apply to the next battle');
  assert.equal(next.hero.guardianWard, 0);
  assert.equal(next.hero.guardianWardCooldown, 0);
  assert.equal(next.hero.holyStrikeTime, 0);
  assert.deepEqual(next.effects, []);
});

test('hero follows the army, reaches last ranged enemies and remains finite on land at triple-speed frames', () => {
  const battle = createBattle([sword(), sword(2, 3), { id: 3, type: 'archer', col: 2, row: 1, level: 1 }], 1);
  let maxEffects = 0;
  for (let time = 0; time < 180 && battle.phase === 'running'; time += .255) {
    updateBattle(battle, .255);
    maxEffects = Math.max(maxEffects, battle.effects.length);
    for (const unit of [...battle.allies, battle.hero, ...battle.enemies]) {
      assert.ok([unit.hp, unit.x, unit.y, unit.cooldown].every(Number.isFinite));
      assert.ok(WALKABLE_AREAS.some(area => unit.x >= area.left - 1e-8 && unit.x <= area.right + 1e-8
        && unit.y >= area.top - 1e-8 && unit.y <= area.bottom + 1e-8));
    }
    if (battle.elapsed < 3 && battle.allies.some(unit => unit.type === 'swordsman' && unit.hp > 0)) {
      assert.ok(battle.hero.y >= Math.min(...battle.allies.filter(unit => unit.type === 'swordsman').map(unit => unit.y)) - 20);
    }
  }
  assert.notEqual(battle.phase, 'running');
  assert.ok(maxEffects < 100);
  advance(battle, 2);
  assert.deepEqual(battle.effects, []);

  const cleanup = encounter({ formation: [], enemies: [{ type: 'goblinArcher', hp: 4, x: 195, y: 135 }] });
  releaseHero(cleanup.hero); cleanup.hero.cooldown = 0;
  advance(cleanup, 10);
  assert.equal(cleanup.phase, 'victory');
});
