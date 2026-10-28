import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.ts';
import { DEFAULT_VISUAL_EFFECT_LIMIT, addVisualEffect, setBattleVisualEffectLimit } from '../combat-visuals.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { createHero, HERO_TALENTS, heroXpForLevel } from '../hero.ts';
import { makeFormation } from '../scripts/combat-balance.mjs';

const TICK = 1 / 60;
const MODES = ['normal', 'disabled', 'saturated', 'cleared'];
const sword = (id, col) => ({ id, type: 'swordsman', level: 1, col, row: 0 });
const hold = actor => Object.assign(actor, {
  action: 'attack', actionTime: 0, actionDuration: 9999, didImpact: true, cooldown: 9999,
});
const branchHero = branch => createHero({ xp: heroXpForLevel(20), talentVersion: 2,
  talents: Object.fromEntries(HERO_TALENTS.filter(talent => talent.branch === branch)
    .map(talent => [talent.id, talent.maxRank])),
});

function configureVisuals(battle, mode) {
  if (mode === 'disabled') setBattleVisualEffectLimit(battle, 0);
  if (mode === 'saturated') {
    setBattleVisualEffectLimit(battle, 1);
    // Keep the one slot occupied throughout the encounter, so every later visual is dropped.
    addVisualEffect(battle, 'slash', battle.hero, battle.hero, 1000000);
  }
}

function advance(battle, mode, events, dt = TICK) {
  if (mode === 'cleared') battle.effects.length = 0;
  const emitted = updateBattle(battle, dt);
  events.push(...emitted);
  if (mode === 'cleared') battle.effects.length = 0;
  assert.ok(battle.effects.length <= battle.visualEffectLimit);
  if (mode === 'disabled' || mode === 'cleared') assert.equal(battle.effects.length, 0);
  return emitted;
}

function ticks(battle, mode, events, count) {
  for (let tick = 0; tick < count; tick++) advance(battle, mode, events);
}

function authoritativeState(battle, finished = false) {
  const { effects, nextEffectId, visualEffectLimit, ...state } = structuredClone(battle);
  if (finished) {
    // Different last frame sizes can age only the finished battle's display clocks.
    delete state.stepRemainder;
    for (const actor of [...state.allies, ...state.enemies, state.hero, state.castle]) {
      delete actor.hitTime;
      delete actor.deathTime;
    }
  }
  return state;
}

function encounter({ heroState, formation = [sword(1, 2), sword(2, 3)], enemies } = {}) {
  const battle = createBattle(formation, 1, heroState);
  const spawns = (enemies ?? [{}, {}]).map(enemy => ({
    at: 0, type: 'goblin', hp: 1000, damage: 0, reward: 7, x: 195, y: 270, ...enemy,
  }));
  battle.wave = { ...battle.wave, spawns, total: spawns.length, reward: spawns.length * 7 };
  Object.assign(battle, { total: spawns.length, nextSpawn: 0 });
  hold(battle.hero);
  battle.allies.forEach(hold);
  updateBattle(battle, TICK);
  battle.enemies.forEach(hold);
  Object.assign(battle.hero, { x: 195, y: 330, healCooldown: 9999, hammerCooldown: 9999 });
  battle.allies.forEach((actor, index) => Object.assign(actor, { x: 160 + index * 70, y: 340 }));
  return battle;
}

function launch(battle, type, source, target, damage, duration = .05) {
  const projectile = { id: battle.nextProjectileId++, type, x: source.x, y: source.y - 27,
    targetX: target.x, targetY: target.y - 27, age: 0, duration,
    side: source.side, sourceType: source.type, sourceId: source.id,
    targetId: target.id, damage, ...(type === 'hero-hammer' ? { landed: false } : {}),
  };
  battle.projectiles.push(projectile);
  return projectile;
}

function compareModes(makeBattle, scenario) {
  let expected;
  for (const mode of MODES) {
    const battle = makeBattle(), events = [];
    configureVisuals(battle, mode);
    scenario(battle, mode, events);
    const actual = { state: authoritativeState(battle), events };
    if (mode === 'normal') expected = actual;
    else assert.deepEqual(actual, expected, mode);
  }
}

test('cosmetic drops cannot suppress arrows, poison ticks, damage events or kill rewards', () => {
  compareModes(() => encounter({ enemies: [
    { type: 'plagueAlchemist', x: 140 }, { hp: 9, x: 210 }, { x: 280 },
  ] }), (battle, mode, events) => {
    const [first, poisoned] = battle.allies, [alchemist, victim] = battle.enemies;
    launch(battle, 'arrow', alchemist, first, 5);
    launch(battle, 'poison-bottle', alchemist, poisoned, 40);
    launch(battle, 'arrow', first, victim, 9);
    ticks(battle, mode, events, 3);
    assert.equal(first.hp, first.maxHp - 5);
    assert.equal(poisoned.hp, poisoned.maxHp, 'poison begins with a full tick delay');
    assert.ok(poisoned.poison);
    assert.equal(victim.hp, 0);
    ticks(battle, mode, events, 246);
    assert.equal(poisoned.hp, poisoned.maxHp - 40);
    assert.equal(poisoned.poison, undefined);
    assert.equal(battle.kills, 1);
    assert.equal(battle.reward, 7);
    assert.equal(battle.nextProjectileId, 4);
    assert.equal(events.filter(event => event.type === 'damage' && event.targetId === poisoned.id).length, 4);
    assert.deepEqual(events.filter(event => event.type === 'gold').map(event => event.amount), [7]);
  });
});

test('a naturally released mounted glaive keeps one hit after caster death in every visual mode', () => {
  compareModes(() => encounter({ formation: [{ id: 1, type: 'pantherRider', level: 1, col: 1, row: 0 }] }),
    (battle, mode, events) => {
      const rider = battle.allies[0], target = battle.enemies[0];
      Object.assign(rider, { x: 195, y: 270, action: 'idle', cooldown: 0 });
      Object.assign(target, { x: 195, y: 220 });
      Object.assign(battle.enemies[1], { x: 280, y: 220 });
      ticks(battle, mode, events, 25);
      const glaive = battle.projectiles.find(projectile => projectile.sourceType === 'pantherRider');
      assert.ok(glaive, 'the normal windup must release a gameplay projectile');
      assert.equal(glaive.type, 'arrow');
      assert.ok(glaive.launchFacing.y < 0);
      assert.equal(target.hp, 1000, 'release does not apply instant damage');
      rider.hp = 0;
      ticks(battle, mode, events, 60);
      assert.equal(target.hp, 991);
      assert.equal(battle.enemies[1].hp, 1000, 'the glaive does not bounce or splash');
      assert.equal(battle.projectiles.length, 0);
      assert.equal(events.filter(event => event.type === 'damage').length, 1);
      assert.equal(events.some(event => event.type === 'bow-shot'), false);
    });
});

test('elf healer windup and capped healing remain authoritative with zero or saturated cosmetics', () => {
  compareModes(() => encounter({ formation: [
    { id: 1, type: 'elfHealer', level: 1, col: 2, row: 1 }, sword(2, 2),
  ] }), (battle, mode, events) => {
    const [healer, patient] = battle.allies;
    Object.assign(healer, { x: 195, y: 310, action: 'idle', cooldown: 0 });
    Object.assign(patient, { x: 195, y: 260, hp: patient.maxHp - 2 });
    ticks(battle, mode, events, 60);
    assert.equal(patient.hp, patient.maxHp);
    assert.deepEqual(events.filter(event => event.type === 'heal'), [{
      type: 'heal', sourceId: healer.id, sourceType: 'elfHealer', targetId: patient.id,
      side: 'ally', amount: 2, shield: 0,
    }]);
    assert.equal(events.some(event => event.type === 'damage'), false);
    assert.equal(battle.projectiles.length, 0);
  });
});

test('unicorn melee impact keeps its damage and single-target rules when slash visuals are dropped', () => {
  compareModes(() => encounter({ formation: [{ id: 1, type: 'unicorn', level: 1, col: 1, row: 0 }] }),
    (battle, mode, events) => {
      const unicorn = battle.allies[0], target = battle.enemies[0];
      Object.assign(unicorn, { x: 195, y: 275, action: 'idle', cooldown: 0 });
      Object.assign(target, { x: 195, y: 240 });
      Object.assign(battle.enemies[1], { x: 280, y: 240 });
      ticks(battle, mode, events, 60);
      assert.equal(target.hp, 990);
      assert.equal(battle.enemies[1].hp, 1000);
      assert.deepEqual(events.filter(event => event.type === 'damage'), [{
        type: 'damage', targetId: target.id, targetType: target.type, side: target.side, amount: 10,
      }]);
      assert.equal(battle.projectiles.length, 0);
    });
});

test('bombardier flight tracking and impact survive blocked cosmetics without splash or duplicate damage', () => {
  compareModes(() => encounter({ enemies: [{ type: 'goblinBombardier', damage: 18 }] }),
    (battle, mode, events) => {
      const bombardier = battle.enemies[0], target = battle.allies[0];
      Object.assign(bombardier, { x: 195, y: 200, action: 'idle', cooldown: 0 });
      Object.assign(target, { x: 195, y: 300 });
      Object.assign(battle.allies[1], { x: 280, y: 340 });
      Object.assign(battle.hero, { x: 320, y: 340 });
      ticks(battle, mode, events, 60);
      const bomb = battle.projectiles.find(projectile => projectile.sourceType === 'goblinBombardier');
      assert.ok(bomb, 'the real cannon windup must release a gameplay projectile');
      assert.equal(target.hp, target.maxHp);
      assert.ok(bomb.launchFacing.y > 0);
      target.x += 10;
      bombardier.hp = 0;
      advance(battle, mode, events);
      assert.equal(bomb.targetX, target.x);
      ticks(battle, mode, events, 50);
      assert.equal(target.hp, target.maxHp - 18);
      assert.equal(battle.allies[1].hp, battle.allies[1].maxHp);
      assert.equal(battle.hero.hp, battle.hero.maxHp);
      assert.equal(battle.projectiles.length, 0);
      assert.deepEqual(events.filter(event => event.type === 'damage'), [{
        type: 'damage', targetId: target.id, targetType: target.type, side: target.side, amount: 18,
      }]);
      assert.equal(events.some(event => event.type === 'bow-shot'), false);
    });
});

test('hero healing, overheal shields and shield expiry survive disabled or saturated cosmetics', () => {
  compareModes(() => encounter({ heroState: branchHero('light') }), (battle, mode, events) => {
    const hero = battle.hero, patient = battle.allies[0];
    patient.hp = patient.maxHp - 1;
    hero.pendingAbility = { kind: 'heal', sourceId: hero.id, targetIds: [patient.id],
      time: 0, duration: .4, didImpact: false };
    Object.assign(hero, { action: 'heal', actionTime: 0, actionDuration: .4 });
    ticks(battle, mode, events, 30);
    assert.equal(patient.hp, patient.maxHp);
    assert.ok(patient.shield > 2, 'the fixture must exercise an overheal barrier');
    const shield = patient.shield;
    const healing = events.filter(event => event.type === 'heal');
    assert.equal(healing.length, 1);
    assert.equal(healing[0].amount, 1);
    assert.equal(healing[0].shield, shield);
    launch(battle, 'arrow', battle.enemies[0], patient, 2, 0);
    advance(battle, mode, events);
    assert.equal(patient.hp, patient.maxHp);
    assert.equal(patient.shield, shield - 2);
    assert.ok(!events.some(event => event.type === 'damage' && event.targetId === patient.id),
      'fully absorbed damage cannot become HP damage or a damage event');
    hold(hero);
    ticks(battle, mode, events, 366);
    assert.equal(patient.shield, 0);
  });
});

test('real queued hammer releases, splash damage and stun remain independent of visual capacity', () => {
  compareModes(() => encounter({ heroState: branchHero('judgement'),
    enemies: [{ x: 195, y: 270 }, { x: 220, y: 270 }],
  }), (battle, mode, events) => {
    const hero = battle.hero, [primary, secondary] = battle.enemies;
    hero.pendingAbility = { kind: 'hammer', sourceId: hero.id, targetIds: [primary.id],
      time: 0, duration: .4, didImpact: false };
    Object.assign(hero, { action: 'hammer', actionTime: 0, actionDuration: .4 });
    ticks(battle, mode, events, 15);
    assert.equal(battle.projectiles.length, 1);
    assert.equal(battle.projectiles[0].id, 1);
    assert.equal(primary.hp, 1000, 'the release itself does not deal damage');
    ticks(battle, mode, events, 15);
    assert.equal(primary.hp, 1000 - hero.stats.hammerDamage);
    assert.equal(secondary.hp, 1000 - hero.stats.hammerDamage * hero.stats.hammerSplashFraction);
    assert.ok(primary.stunTime > 0 && secondary.stunTime > 0);
    assert.ok(hero.holyStrikeTime > 0);
    assert.equal(battle.projectiles.length, 0);
    assert.equal(battle.nextProjectileId, 2);
    assert.deepEqual(events.filter(event => event.type === 'damage').map(event => event.targetId),
      [primary.id, secondary.id]);
  });
});

test('caster death cancels the same-tick hammer but not a released arrow or poison bottle', () => {
  compareModes(() => encounter({ heroState: branchHero('judgement') }), (battle, mode, events) => {
    const hero = battle.hero, [archer, patient] = battle.allies, enemy = battle.enemies[0];
    hero.hp = archer.hp = 1;
    // Arrival order intentionally kills the hero before the hammer in the iteration snapshot.
    launch(battle, 'arrow', enemy, hero, 1000, 0);
    launch(battle, 'arrow', enemy, archer, 1000, 0);
    launch(battle, 'hero-hammer', hero, enemy, 99, 0);
    launch(battle, 'arrow', archer, enemy, 10, 0);
    const bottle = launch(battle, 'poison-bottle', enemy, patient, 40, 0);
    bottle.sourceType = 'plagueAlchemist';
    advance(battle, mode, events);
    assert.equal(hero.hp, 0);
    assert.equal(archer.hp, 0);
    assert.equal(enemy.hp, 990);
    assert.ok(patient.poison);
    assert.equal(hero.pendingAbility, null);
    assert.equal(hero.holyStrikeTime, 0);
    assert.equal(battle.projectiles.length, 0);
    const before = enemy.hp;
    ticks(battle, mode, events, 3);
    assert.equal(enemy.hp, before, 'a canceled/consumed projectile cannot land later');
  });
});

test('victory and defeat clear gameplay flights and poison even when cosmetics are absent', () => {
  for (const outcome of ['victory', 'defeat']) {
    compareModes(() => encounter({ enemies: [{ hp: 1 }] }), (battle, mode, events) => {
      const [patient] = battle.allies, [enemy] = battle.enemies;
      patient.poison = { remaining: 4, nextTick: 1, damagePerTick: 10 };
      launch(battle, 'arrow', enemy, patient, 1000, 10);
      if (outcome === 'victory') launch(battle, 'arrow', patient, enemy, 1, 0);
      else battle.castle.hp = 0;
      advance(battle, mode, events);
      assert.equal(battle.phase, outcome);
      assert.equal(battle.projectiles.length, 0);
      assert.equal(patient.poison, undefined);
      const before = { hp: patient.hp, kills: battle.kills, reward: battle.reward, elapsed: battle.elapsed };
      const eventCount = events.length;
      ticks(battle, mode, events, 660);
      assert.deepEqual({ hp: patient.hp, kills: battle.kills, reward: battle.reward, elapsed: battle.elapsed }, before);
      assert.equal(events.length, eventCount, 'no post-result damage or rewards');
      assert.equal(battle.kills, outcome === 'victory' ? 1 : 0);
      assert.equal(battle.reward, outcome === 'victory' ? 7 : 0);
    });
  }
});

test('changing the visual limit trims cosmetics without touching active projectiles or statuses', () => {
  const battle = encounter(), source = battle.hero, target = battle.enemies[0];
  assert.equal(battle.visualEffectLimit, DEFAULT_VISUAL_EFFECT_LIMIT);
  launch(battle, 'arrow', source, target, 7, 1);
  battle.allies[0].poison = { remaining: 4, nextTick: 1, damagePerTick: 2 };
  addVisualEffect(battle, 'slash', source, target, 1);
  addVisualEffect(battle, 'hit', target, target, 1, { amount: 7 });
  const before = authoritativeState(battle);
  setBattleVisualEffectLimit(battle, 1);
  assert.equal(battle.effects.length, 1);
  assert.deepEqual(authoritativeState(battle), before);
  setBattleVisualEffectLimit(battle, 0);
  assert.equal(battle.effects.length, 0);
  assert.deepEqual(authoritativeState(battle), before);
  for (const invalid of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => setBattleVisualEffectLimit(battle, invalid), RangeError);
    assert.deepEqual(authoritativeState(battle), before);
    assert.equal(battle.visualEffectLimit, 0);
  }
});

test('a real wave has identical authoritative state and ordered events across visual modes, FPS and speeds', () => {
  const formation = makeFormation({ swordsman: 4, archer: 1, healer: 2, level: 20 });
  function run(mode, frameDurations, speed) {
    const battle = createBattle(formation, 9, undefined, undefined, { health: 2, tower: 1 });
    const events = [];
    configureVisuals(battle, mode);
    let frame = 0;
    while (battle.phase === 'running' && frame < 30000) {
      advance(battle, mode, events, battleFrameDelta(frameDurations[frame % frameDurations.length], speed));
      frame++;
    }
    assert.equal(battle.phase, 'victory', 'the bounded fixture must actually complete its wave');
    assert.equal(battle.king, battle.castle);
    assert.equal(battle.kills, battle.total);
    assert.equal(battle.reward, battle.wave.reward);
    assert.ok(events.some(event => event.type === 'damage'));
    assert.ok(events.some(event => event.type === 'bow-shot'));
    assert.equal(events.filter(event => event.type === 'gold').length, battle.kills);
    return { state: authoritativeState(battle, true), events };
  }
  const baseline = run('normal', [1 / 60], 1);
  for (const mode of MODES) for (const speed of BATTLE_SPEEDS) {
    for (const frames of [[1 / 10], [1 / 60], [1 / 120], [1 / 60, .041, .024, .1, .012]]) {
      assert.deepEqual(run(mode, frames, speed), baseline, `${mode}, x${speed}, frames ${frames}`);
    }
  }
});
