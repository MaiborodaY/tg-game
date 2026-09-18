import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_PACE, createBattle, updateBattle } from '../combat.ts';
import { WALKABLE_AREAS } from '../field.ts';
import { createHero, heroXpForLevel } from '../hero.ts';

const DT = 1 / 60;
const hold = unit => Object.assign(unit, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

function crowdedEncounter({ type = 'swordsman', count = 5, centerX = 195, heroState } = {}) {
  const formation = Array.from({ length: count }, (_, index) => ({
    id: index + 1, type, col: index % 5, row: Math.floor(index / 5), level: 1,
  }));
  const battle = createBattle(formation, 1, heroState);
  const spawns = [{ at: 0, type: 'goblin', hp: 1000, damage: 0, x: centerX, y: 200 }];
  Object.assign(battle, { wave: { ...battle.wave, spawns }, total: 1, nextSpawn: 0 });
  updateBattle(battle, DT);
  hold(battle.enemies[0]);
  const columns = Math.min(5, count), frontY = type === 'lancer' ? 270 : 235;
  for (const [index, ally] of battle.allies.entries()) {
    hold(ally);
    Object.assign(ally, { x: centerX + (index % columns - (columns - 1) / 2) * 27,
      y: frontY + Math.floor(index / columns) * 27 });
  }
  Object.assign(battle.hero, { x: centerX, y: Math.max(320, frontY + Math.floor((count - 1) / columns) * 27 + 40),
    action: 'idle', cooldown: 0,
    healCooldown: 9999, hammerCooldown: 9999, pendingAbility: null });
  return battle;
}

function traceApproach(battle, dt = DT) {
  let firstHit = null;
  let maxSideways = 0;
  const startX = battle.hero.x;
  for (let elapsed = 0; elapsed < 12 - 1e-8; elapsed += dt) {
    const before = { x: battle.hero.x, y: battle.hero.y, elapsed: battle.elapsed };
    updateBattle(battle, dt);
    const hero = battle.hero;
    maxSideways = Math.max(maxSideways, Math.abs(hero.x - startX));
    if (battle.enemies[0].hp < 1000) firstHit ??= battle.elapsed;
    assert.ok(WALKABLE_AREAS.some(area => hero.x >= area.left && hero.x <= area.right
      && hero.y >= area.top && hero.y <= area.bottom), 'hero stays on walkable land');
    // Ordinary movement plus the existing collision correction; no teleport around the line.
    const stepped = battle.elapsed - before.elapsed;
    assert.ok(Math.hypot(hero.x - before.x, hero.y - before.y) <= (53 * COMBAT_PACE + 80) * stepped + 1e-6);
  }
  return { firstHit, maxSideways, x: battle.hero.x, y: battle.hero.y, hp: battle.enemies[0].hp };
}

test('hero goes around an occupied frontline and lands melee hits, with or without hammer', () => {
  for (const type of ['swordsman', 'lancer']) {
    for (const count of [1, 5]) {
      for (const hammer of [false, true]) {
        const heroState = createHero({ xp: heroXpForLevel(2), talentVersion: 2,
          talents: hammer ? { hammer_unlock: 1 } : {} });
        const trace = traceApproach(crowdedEncounter({ type, count, heroState }));
        assert.ok(trace.firstHit !== null && trace.firstHit < 10,
          `${type} x${count}, hammer ${hammer}: hero must reach melee instead of running behind allies`);
        assert.ok(trace.maxSideways >= 20, 'hero passes beside the allied line');
      }
    }
  }
});

test('crowded hero pursuit is identical at 30/60/120 FPS and x1/x2/x3', () => {
  const expected = traceApproach(crowdedEncounter());
  for (const fps of [30, 60, 120]) {
    for (const speed of [1, 2, 3]) {
      const actual = traceApproach(crowdedEncounter(), speed / fps);
      assert.equal(actual.hp, expected.hp);
      assert.ok(Math.abs(actual.x - expected.x) < 1e-6);
      assert.ok(Math.abs(actual.y - expected.y) < 1e-6);
    }
  }
});

test('hero passes a packed three-row army and chooses the open side beside either shore', () => {
  for (const count of [5, 15]) {
    for (const centerX of [86, 195, 304]) {
      const trace = traceApproach(crowdedEncounter({ count, centerX }));
      assert.ok(trace.firstHit !== null && trace.firstHit < 10,
        `${count} allies at x${centerX}: hero reaches an attack position`);
    }
  }
});

test('a completely sealed frontage makes the hero wait, then resume when a gap opens', () => {
  const battle = crowdedEncounter({ count: 13 });
  battle.allies.forEach((ally, index) => Object.assign(ally, { x: 32 + index * 27, y: 235 }));
  for (let time = 0; time < 4; time += DT) updateBattle(battle, DT);
  assert.equal(battle.hero.action, 'idle', 'no run-in-place animation when no route exists');
  assert.equal(battle.enemies[0].hp, 1000);
  battle.allies[6].hp = battle.allies[7].hp = 0;
  const trace = traceApproach(battle);
  assert.ok(trace.firstHit !== null && trace.firstHit < 8, 'fallen allies reopen the path');
});

test('a healing cast preserves the chosen crowd route', () => {
  const heroState = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { heal_unlock: 1 } });
  const battle = crowdedEncounter({ heroState });
  for (let time = 0; time < 4 && !battle.hero.approach?.detourRoute; time += DT) updateBattle(battle, DT);
  const corner = battle.hero.approach.detour;
  assert.ok(corner);
  battle.hero.hp = 30;
  battle.hero.healCooldown = 0;
  updateBattle(battle, DT);
  assert.equal(battle.hero.pendingAbility?.kind, 'heal');
  for (let time = 0; time < .9; time += DT) updateBattle(battle, DT);
  assert.ok(battle.hero.hp > 30);
  assert.equal(battle.hero.approach.detour, corner, 'casting does not choose the opposite side');
  assert.ok(traceApproach(battle).firstHit !== null);
});

test('a moving target immediately invalidates a crowd route on its old side', () => {
  const battle = crowdedEncounter();
  for (let time = 0; time < 4 && !battle.hero.approach?.detourRoute; time += DT) updateBattle(battle, DT);
  assert.ok(battle.hero.approach.detour);
  const before = { x: battle.hero.x, y: battle.hero.y };
  Object.assign(battle.enemies[0], { x: 350, y: 320 });
  for (let time = 0; time < 1; time += DT) updateBattle(battle, DT);
  assert.ok(battle.hero.x > before.x + 20, 'hero turns toward the relocated enemy immediately');
  assert.ok(battle.hero.y > before.y, 'the obsolete route cannot lead back north');
});

test('a hero pressed against a side shore can escape sideways around an ally', () => {
  for (const mirrored of [false, true]) {
    const battle = crowdedEncounter({ count: 1 });
    const x = value => mirrored ? 390 - value : value;
    Object.assign(battle.hero, { x: x(358), y: 260 });
    Object.assign(battle.allies[0], { x: x(331), y: 260 });
    Object.assign(battle.enemies[0], { x: x(280), y: 260 });
    const trace = traceApproach(battle);
    assert.ok(trace.firstHit !== null && trace.firstHit < 8, 'shore contact leaves a vertical escape');
  }
});

test('hammer hero settles within casting range instead of pacing behind friendly archers', () => {
  const heroState = createHero({ xp: heroXpForLevel(2), talentVersion: 2, talents: { hammer_unlock: 1 } });
  const battle = crowdedEncounter({ type: 'archer', heroState });
  battle.enemies[0].type = 'goblinArcher';
  battle.allies.forEach(ally => { ally.y = 325; });
  Object.assign(battle.hero, { y: 405, hammerCooldown: 0 });
  for (let time = 0; time < 8; time += DT) updateBattle(battle, DT);
  const settled = { x: battle.hero.x, y: battle.hero.y };
  for (let time = 0; time < 10; time += DT) {
    updateBattle(battle, DT);
    assert.ok(Math.hypot(battle.hero.x - settled.x, battle.hero.y - settled.y) < .01,
      'waiting for a hammer cooldown does not keep the walk animation running');
    assert.notEqual(battle.hero.action, 'walk');
  }
  assert.ok(battle.enemies[0].hp <= 1000 - battle.hero.stats.hammerDamage * 2 + 1e-8,
    `two hammers must land while holding position: ${battle.enemies[0].hp} HP remains`);
});
