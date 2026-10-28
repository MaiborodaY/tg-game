import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle } from '../combat.ts';
import { UNICORN_ASSETS, UNICORN_GEOMETRY } from '../unicorn-art.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

function environment(t) {
  const env = createSceneEnvironment(); t.after(() => env.restore());
  const OriginalImage = globalThis.Image;
  globalThis.Image = class extends OriginalImage {
    set src(value) {
      if (value.includes('/unicorn/')) this.width = this.height = this.naturalWidth = this.naturalHeight = 512;
      super.src = value;
    }
    get src() { return super.src; }
  };
  return env;
}

test('unicorn renders side/down release crops, western flip and standard death fade at 47px scale', async t => {
  const env = environment(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const units = [{ id: 1, type: 'unicorn', level: 50, col: 2, row: 1 }], battle = createBattle(units, 1);
  const archer = battle.allies[0]; await scene.prepare({ units, battle }); const requests = env.requests.length;
  for (const [facingX, facingY, frame] of [[1, 0, 10], [-1, 0, 10], [0, 1, 14], [0, -1, 10]]) {
    Object.assign(archer, { action: 'attack', facingX, facingY, actionTime: .4, actionDuration: .8, impactFraction: .5 });
    canvas.clear(); scene.render({ battle, units, time: 7 });
    const index = canvas.commands.findIndex(([method, image]) => method === 'drawImage' && image.includes('unicorn-purple.webp'));
    assert.ok(index >= 0); const source = UNICORN_GEOMETRY.sourceRects[frame];
    assert.deepEqual(canvas.commands[index].slice(2, 6), Object.values(source));
    assert.ok(Math.abs(canvas.commands[index][8] - source.width * 47 / 70) < 1e-9);
    assert.equal(canvas.commands.slice(index - 4, index).some(([method, x, y]) => method === 'scale' && x === -1 && y === 1), facingX < 0);
    assert.equal(canvas.saveDepth, 0);
  }
  Object.assign(archer, { action: 'dead', hp: 0, deathTime: .5 }); canvas.clear(); scene.render({ battle, units });
  assert.ok(canvas.commands.some(([method, key, value]) => method === 'set' && key === 'globalAlpha' && value > 0 && value < 1));
  assert.equal(env.requests.length, requests, 'pose/facing/death never creates extra texture work');
});

test('unicorn formation stays stationary, labels remain legible and rank portraits follow the five bands', async t => {
  const env = environment(t), canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  const units = [{ id: 1, type: 'unicorn', level: 500, col: 2, row: 0 }]; await scene.prepare({ units });
  const draws = [];
  for (const time of [0, 8]) {
    canvas.clear(); scene.render({ units, time });
    draws.push(canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('unicorn-black.webp')));
    assert.ok(canvas.commands.some(([method, label]) => method === 'fillText' && label === '500'));
    assert.equal(canvas.saveDepth, 0);
  }
  assert.deepEqual(draws[0], draws[1]); assert.deepEqual(draws[0].slice(2, 6), Object.values(UNICORN_GEOMETRY.sourceRects[0]));
  assert.equal(scene.getPortrait('unicorn'), UNICORN_ASSETS[1].art);
  for (const [level, rank] of [[1, 1], [49, 1], [50, 2], [99, 2], [100, 3], [250, 4], [500, 5], [9999, 5]]) {
    assert.equal(scene.getUnitArt('unicorn', level), UNICORN_ASSETS[rank].art);
  }
});
