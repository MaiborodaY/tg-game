import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle } from '../combat.ts';
import { createHero, heroXpForLevel } from '../hero.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { WALKABLE_AREAS } from '../field.ts';

const DT = 1 / 60;
const hold = unit => Object.assign(unit, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

function encounter({ hammer = true, enemies = [], blockers = [] } = {}) {
  const hero = createHero({ xp: heroXpForLevel(2), talentVersion: 2,
    talents: hammer ? { hammer_unlock: 1 } : {} });
  const formation = blockers.map((type, index) => ({ id: index + 1, type, level: 1, col: index % 5, row: 0 }));
  const battle = createBattle(formation, 1, hero);
  const spawns = [{ type: 'goblinHealer', x: 195, y: 200 }, ...enemies]
    .map(enemy => ({ at: 0, hp: 1000, damage: 0, heal: 0, ...enemy }));
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: spawns.length, nextSpawn: 0 });
  updateBattle(battle, DT);
  // Held targets isolate pursuit: enemy walking must not rescue a stationary hero.
  for (const [index, enemy] of battle.enemies.entries()) {
    hold(enemy);
    Object.assign(enemy, { x: spawns[index].x, y: spawns[index].y });
  }
  for (const [index, ally] of battle.allies.entries()) {
    hold(ally);
    Object.assign(ally, { x: 195 + (index - (blockers.length - 1) / 2) * 27, y: 270 });
  }
  Object.assign(battle.hero, { x: 195, y: 320, action: 'idle', actionTime: 0, cooldown: 0,
    healCooldown: 9999, hammerCooldown: 0, pendingAbility: null, focusId: null });
  return battle;
}

function trace(battle, dt = DT, seconds = 20) {
  const seen = new Set(), meleeTargets = new Set();
  const healer = battle.enemies[0];
  let healerMelee = 0, firstHealerMelee = null, hammerLandings = 0, maxSideways = 0;
  for (let elapsed = 0; elapsed < seconds - 1e-8 && battle.phase === 'running'; elapsed += dt) {
    updateBattle(battle, Math.min(dt, seconds - elapsed));
    maxSideways = Math.max(maxSideways, Math.abs(battle.hero.x - 195));
    assert.ok(WALKABLE_AREAS.some(area => battle.hero.x >= area.left && battle.hero.x <= area.right
      && battle.hero.y >= area.top && battle.hero.y <= area.bottom));
    for (const effect of battle.effects) {
      if (seen.has(effect.id)) continue;
      seen.add(effect.id);
      if (effect.type === 'hero-impact' && effect.sourceId === 'hero') hammerLandings++;
      // Slash is emitted only for a melee impact, unlike the hammer's ranged damage.
      if (effect.type !== 'slash' || effect.sourceId !== 'hero') continue;
      const target = battle.enemies.find(enemy => Math.abs(enemy.x - effect.targetX) < 1e-8
        && Math.abs(enemy.y - 27 - effect.targetY) < 1e-8);
      if (target) meleeTargets.add(target.type);
      if (target !== healer) continue;
      healerMelee++;
      firstHealerMelee ??= battle.elapsed;
    }
  }
  return { battle, healerMelee, firstHealerMelee, hammerLandings, maxSideways, meleeTargets: [...meleeTargets].sort() };
}

test('hammer hero closes on a lone goblin healer and lands melee between hammer casts', () => {
  const result = trace(encounter());
  assert.ok(result.hammerLandings >= 2, 'hammer remains available while approaching and fighting');
  assert.ok(result.healerMelee >= 2, `expected hero melee impacts, got ${result.healerMelee}; hero y=${result.battle.hero.y}`);
  assert.ok(result.firstHealerMelee < 5, 'a nearby healer is pursued before the second hammer cooldown');
  assert.ok(Math.hypot(result.battle.hero.x - 195, result.battle.hero.y - 200) <= result.battle.hero.range + 6);
});

test('support-only and healer-plus-archer remainders cannot put the hero into ranged waiting', () => {
  for (const type of ['goblinHealer', 'goblinArcher']) {
    const result = trace(encounter({ enemies: [{ type, x: 250, y: 140 }] }));
    assert.ok(result.healerMelee >= 2, `${type} remainder must not prevent melee on the nearby healer`);
    assert.ok(result.hammerLandings >= 1);
  }
});

test('a hero without the hammer still pursues the healer without generating hammer effects', () => {
  const result = trace(encounter({ hammer: false }));
  assert.ok(result.healerMelee >= 2);
  assert.equal(result.hammerLandings, 0);
  assert.ok(result.firstHealerMelee < 5);
});

test('killing the last frontline enemy does not stop the hero short of the surviving healer', () => {
  const result = trace(encounter({ enemies: [{ type: 'goblin', hp: 1, x: 195, y: 295 }] }));
  assert.equal(result.battle.enemies[1].hp, 0, 'hero must actually finish the frontline');
  assert.deepEqual(result.meleeTargets, ['goblin', 'goblinHealer']);
  assert.ok(result.healerMelee >= 2, 'after retargeting the hero must close and melee, not wait for hammers');
});

test('hammer hero routes around friendly archers and monks to reach an enemy healer', () => {
  const result = trace(encounter({ blockers: ['archer', 'healer', 'archer', 'healer', 'archer'] }));
  assert.ok(result.healerMelee >= 2);
  assert.ok(result.firstHealerMelee < 12);
  assert.ok(result.maxSideways > 30, 'the hero goes beside the occupied friendly line');
  assert.ok(result.battle.allies.every(unit => unit.hp === unit.maxHp));
});

test('healer pursuit and both kinds of hero attack remain identical across FPS and speed choices', () => {
  const snapshot = ({ battle, healerMelee, hammerLandings, meleeTargets }) => ({
    elapsed: battle.elapsed, kills: battle.kills, reward: battle.reward,
    hero: { x: battle.hero.x, y: battle.hero.y, hp: battle.hero.hp, action: battle.hero.action,
      cooldown: battle.hero.cooldown, hammerCooldown: battle.hero.hammerCooldown, attackCount: battle.hero.attackCount },
    enemies: battle.enemies.map(({ type, hp, x, y }) => ({ type, hp, x, y })), healerMelee, hammerLandings, meleeTargets,
  });
  const options = { blockers: ['archer', 'healer', 'archer'] };
  const expected = snapshot(trace(encounter(options)));
  assert.ok(expected.healerMelee >= 2 && expected.hammerLandings >= 2);
  for (const fps of [20, 30, 60, 120]) for (const speed of BATTLE_SPEEDS) {
    assert.deepEqual(snapshot(trace(encounter(options), battleFrameDelta(1 / fps, speed))), expected, `${fps} FPS x${speed}`);
  }
});
