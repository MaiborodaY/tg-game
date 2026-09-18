import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle } from '../combat.ts';
import { ELF_HEALER_ASSETS, ELF_HEALER_GEOMETRY } from '../elf-healer-art.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

function environment(t) {
  const env = createSceneEnvironment(); t.after(() => env.restore());
  const OriginalImage = globalThis.Image;
  globalThis.Image = class extends OriginalImage {
    set src(value) {
      if (value.includes('/elf-healer/')) this.width = this.height = this.naturalWidth = this.naturalHeight = 512;
      super.src = value;
    }
    get src() { return super.src; }
  };
  return env;
}

test('elf healer renders side/down release crops, western flip and standard death fade at 35px scale', async t => {
  const env = environment(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const units = [{ id: 1, type: 'elfHealer', level: 50, col: 2, row: 1 }], battle = createBattle(units, 1);
  const archer = battle.allies[0]; await scene.prepare({ units, battle }); const requests = env.requests.length;
  for (const [facingX, facingY, frame] of [[1, 0, 10], [-1, 0, 10], [0, 1, 14], [0, -1, 10]]) {
    Object.assign(archer, { action: 'heal', facingX, facingY, actionTime: .4, actionDuration: .8, impactFraction: .5 });
    canvas.clear(); scene.render({ battle, units, time: 7 });
    const index = canvas.commands.findIndex(([method, image]) => method === 'drawImage' && image.includes('elf-healer-purple.webp'));
    assert.ok(index >= 0); const source = ELF_HEALER_GEOMETRY.sourceRects[frame];
    assert.deepEqual(canvas.commands[index].slice(2, 6), Object.values(source));
    assert.ok(Math.abs(canvas.commands[index][8] - source.width * 35 / 96) < 1e-9);
    assert.equal(canvas.commands.slice(index - 4, index).some(([method, x, y]) => method === 'scale' && x === -1 && y === 1), facingX < 0);
    assert.equal(canvas.saveDepth, 0);
  }
  Object.assign(archer, { action: 'dead', hp: 0, deathTime: .5 }); canvas.clear(); scene.render({ battle, units });
  assert.ok(canvas.commands.some(([method, key, value]) => method === 'set' && key === 'globalAlpha' && value > 0 && value < 1));
  assert.equal(env.requests.length, requests, 'pose/facing/death never creates extra texture work');
});

test('elf formation stays stationary, labels remain legible and rank portraits follow the five bands', async t => {
  const env = environment(t), canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  const units = [{ id: 1, type: 'elfHealer', level: 500, col: 2, row: 0 }]; await scene.prepare({ units });
  const draws = [];
  for (const time of [0, 8]) {
    canvas.clear(); scene.render({ units, time });
    draws.push(canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('elf-healer-black.webp')));
    assert.ok(canvas.commands.some(([method, label]) => method === 'fillText' && label === '500'));
    assert.equal(canvas.saveDepth, 0);
  }
  assert.deepEqual(draws[0], draws[1]); assert.deepEqual(draws[0].slice(2, 6), Object.values(ELF_HEALER_GEOMETRY.sourceRects[0]));
  assert.equal(scene.getPortrait('elfHealer'), ELF_HEALER_ASSETS[1].art);
  for (const [level, rank] of [[1, 1], [49, 1], [50, 2], [99, 2], [100, 3], [250, 4], [500, 5], [9999, 5]]) {
    assert.equal(scene.getUnitArt('elfHealer', level), ELF_HEALER_ASSETS[rank].art);
  }
});



test('elf heal ring draws only once per real healing effect, without loading more assets per cast',async t=>{
 const env=environment(t),canvas=env.canvas(),scene=env.keep(await createScene(canvas));
 const units=[{id:1,type:'elfHealer',level:1,col:2,row:1}],battle=createBattle(units,1);
 await scene.prepare({units,battle});const requests=env.requests.length;
 for(const amount of [6,0,2]) {
  battle.effects=[{id:1,type:'heal',sourceType:'elfHealer',sourceId:'ally-1',side:'ally',x:195,y:283,targetX:195,targetY:233,age:.35,duration:.7,amount}];
  canvas.clear();scene.render({units,battle});
  const rings=canvas.commands.filter(([method,image])=>method==='drawImage'&&image.includes('elf-healer-pulse.webp'));
  assert.equal(rings.length,amount>0?1:0);
  if(amount>0){assert.deepEqual(rings[0].slice(2,6),[0,64,64,64]);assert.ok(canvas.commands.some(([method,label])=>method==='fillText'&&label==='+'+amount));}
  assert.equal(env.requests.length,requests);assert.equal(canvas.saveDepth,0);
 }
});
