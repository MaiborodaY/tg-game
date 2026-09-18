import assert from 'node:assert/strict';
import test from 'node:test';
import { addHeroXpEffect, HERO_XP_EFFECT_SECONDS } from '../hero-xp-effect.ts';
import { createBattle, updateBattle } from '../combat.ts';
import { createHero, awardHeroXp, heroXpForLevel } from '../hero.ts';
import { BATTLE_VIEW, ROYAL_PENINSULA } from '../field.ts';
import { createScene } from '../scene.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

test('XP popup reflects the awarded amount and never modifies rewards or hero stats itself', () => {
  const hero = createHero(), battle = createBattle([], 1, hero);
  battle.phase = 'victory';
  const reward = awardHeroXp(hero, { waveNumber: 1, kills: battle.total, total: battle.total, won: true });
  const before = structuredClone({ hero, actor: battle.hero, gold: battle.reward });
  addHeroXpEffect(battle, reward.gained);
  assert.equal(battle.effects.length, 1);
  assert.equal(battle.effects[0].label, `+${reward.gained} XP`);
  assert.equal(battle.effects[0].amount, reward.gained);
  assert.equal(battle.effects[0].duration, HERO_XP_EFFECT_SECONDS);
  assert.ok(battle.effects[0].x > BATTLE_VIEW.x && battle.effects[0].x < ROYAL_PENINSULA.right);
  assert.ok(battle.effects[0].y < ROYAL_PENINSULA.top);
  assert.deepEqual({ hero, actor: battle.hero, gold: battle.reward }, before);
});

test('no XP popup for zero, invalid amounts or a capped hero', () => {
  const battle = createBattle([], 1);
  const hero = createHero({ xp: heroXpForLevel(20) });
  const reward = awardHeroXp(hero, { waveNumber: 1, kills: 3, total: 3, won: true });
  for (const value of [reward.gained, 0, -1, NaN, Infinity, 1.5, '5']) addHeroXpEffect(battle, value);
  assert.deepEqual(battle.effects, []);
});

test('XP effects expire through the existing battle loop after either outcome at different FPS', () => {
  for (const phase of ['victory', 'defeat']) for (const fps of [15, 30, 60]) {
    const battle = createBattle([], 1);
    battle.phase = phase;
    addHeroXpEffect(battle, 13);
    for (let frame = 0; frame < fps; frame++) assert.deepEqual(updateBattle(battle, 1 / fps), []);
    assert.equal(battle.effects.length, 1, 'Readable for at least one second');
    for (let frame = 0; frame < fps; frame++) assert.deepEqual(updateBattle(battle, 1 / fps), []);
    assert.deepEqual(battle.effects, [], 'Expired before the automatic next wave');
    assert.equal(battle.elapsed, 0, 'Visual updates do not resume combat');
  }
});

test('one outlined XP label rises and fades without loading images or adding canvas layers', async t => {
  const env = createSceneEnvironment(); t.after(() => env.restore());
  const canvas = env.canvas(320, 450), scene = env.keep(await createScene(canvas));
  const battle = createBattle([], 1); battle.phase = 'victory';
  await scene.prepare({ battle });
  const requests = env.requests.length, surfaces = env.canvases.length;
  addHeroXpEffect(battle, 13);
  let previousY = Infinity;
  for (const age of [0, .6, 1.6]) {
    battle.effects[0].age = age;
    canvas.clear(); scene.render({ battle });
    const labels = canvas.commands.filter(([method, label]) => method === 'fillText' && label === '+13 XP');
    assert.equal(labels.length, 1);
    assert.equal(canvas.commands.filter(([method, label]) => method === 'strokeText' && label === '+13 XP').length, 1);
    assert.ok(labels[0][3] < previousY); previousY = labels[0][3];
    const labelIndex = canvas.commands.indexOf(labels[0]);
    const preceding = canvas.commands.slice(0, labelIndex);
    const font = preceding.findLast(([method, name]) => method === 'set' && name === 'font')[2];
    assert.ok(Math.abs(parseFloat(font) * Number(canvas.dataset.worldScale) - 12) < .01);
    const alpha = preceding.findLast(([method, name]) => method === 'set' && name === 'globalAlpha')[2];
    assert.equal(age < 1 ? alpha === 1 : alpha < 1, true);
    assert.equal(canvas.saveDepth, 0);
    assert.equal(env.requests.length, requests);
    assert.equal(env.canvases.length, surfaces);
  }
  for (let i = 0; i < 20; i++) updateBattle(battle, 1 / 30);
  canvas.clear(); scene.render({ battle });
  assert.equal(canvas.commands.some(([method, label]) => method === 'fillText' && label === '+13 XP'), false);
});
