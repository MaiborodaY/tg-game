import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle } from '../combat.ts';
import { PANTHER_RIDER_ASSETS, PANTHER_RIDER_GEOMETRY } from '../panther-rider-art.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

test('rider scene uses authored strike crops, west flip and dead fade without new texture work', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const units = [{ id: 1, type: 'pantherRider', level: 50, col: 2, row: 1 }];
  const battle = createBattle(units, 1);
  const rider = battle.allies[0];
  assert.equal(await scene.prepare({ battle, units }), true);
  const requests = env.requests.length;
  for (const [facingX, facingY, frame] of [[1, 0, 10], [-1, 0, 10], [0, 1, 14], [0, -1, 10]]) {
    Object.assign(rider, { action: 'attack', facingX, facingY, actionTime: .5, actionDuration: 1, impactFraction: .42 });
    canvas.clear();
    scene.render({ battle, units, time: 7 });
    const index = canvas.commands.findIndex(([method, image]) => method === 'drawImage' && image.includes('panther-rider-purple.webp'));
    assert.ok(index >= 0);
    const { x, y, width, height } = PANTHER_RIDER_GEOMETRY.sourceRects[frame];
    assert.deepEqual(canvas.commands[index].slice(2, 6), [x, y, width, height]);
    const flipped = canvas.commands.slice(index - 4, index).some(([method, x, y]) => method === 'scale' && x === -1 && y === 1);
    assert.equal(flipped, facingX < 0, 'only western direction mirrors the authored east pose');
    assert.equal(canvas.saveDepth, 0);
  }
  Object.assign(rider, { action: 'dead', hp: 0, deathTime: .5 });
  canvas.clear();
  scene.render({ battle, units });
  assert.ok(canvas.commands.some(([method, key, value]) => method === 'set' && key === 'globalAlpha' && value > 0 && value < 1));
  const deadDraw = canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('panther-rider-purple.webp'));
  assert.deepEqual(deadDraw.slice(2, 6), Object.values(PANTHER_RIDER_GEOMETRY.sourceRects[0]));
  assert.equal(env.requests.length, requests, 'changing poses never loads or generates more sprites');
});

test('rider formation stays static and uses personal-rank art in unit details', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  const units = [{ id: 1, type: 'pantherRider', level: 500, col: 2, row: 1 }];
  assert.equal(await scene.prepare({ units }), true);
  const draws = [];
  for (const time of [0, 8]) {
    canvas.clear();
    scene.render({ units, time });
    draws.push(canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('panther-rider-black.webp')));
    assert.ok(canvas.commands.some(([method, label]) => method === 'fillText' && label === '500'));
    assert.equal(canvas.saveDepth, 0);
  }
  assert.deepEqual(draws[0], draws[1]);
  assert.equal(scene.getPortrait('pantherRider'), PANTHER_RIDER_ASSETS[1].art);
  for (const [level, rank] of [[1, 1], [50, 2], [100, 3], [250, 4], [500, 5], [9999, 5]]) {
    assert.equal(scene.getUnitArt('pantherRider', level), PANTHER_RIDER_ASSETS[rank].art);
  }
});
