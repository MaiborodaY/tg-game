import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle } from '../combat.ts';
import { PLAGUE_ALCHEMIST_FRAMES, POISON_BOTTLE_FRAMES, POISON_IMPACT_FRAMES, plagueAlchemistReleasePoint } from '../plague-alchemist-art.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

function environment(t) {
  const env = createSceneEnvironment(); t.after(() => env.restore());
  // This pack uses smaller atlases than the helper's older 768px enemy fixture.
  const OriginalImage = globalThis.Image;
  globalThis.Image = class extends OriginalImage {
    set src(value) {
      if (value.includes('/plague-alchemist/')) this.width = this.height = this.naturalWidth = this.naturalHeight = value.includes('512') ? 512 : 128;
      super.src = value;
    }
    get src() { return super.src; }
  };
  return env;
}
function encounter() {
  const units = [{ id: 1, type: 'swordsman', col: 2, row: 0, level: 1 }], battle = createBattle(units, 201);
  const caster = { ...battle.allies[0], id: 'alchemist-1', side: 'enemy', type: 'plagueAlchemist', x: 195, y: 200,
    hp: 40, maxHp: 40, action: 'shoot', actionDuration: .8, impactFraction: .5, actionTime: .4, facingX: 1, facingY: 0 };
  battle.enemies = [caster];
  battle.wave = { ...battle.wave, spawns: [{ type: 'plagueAlchemist' }] };
  return { units, battle, caster };
}
const draws = (canvas, name) => canvas.commands.filter(([method, image]) => method === 'drawImage' && image.includes(name));

test('alchemist draws explicit side/down release poses at 40px body scale without duplicate loading', async t => {
  const env = environment(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const { units, battle, caster } = encounter();
  await scene.prepare({ units, battle }); const requests = env.requests.length;
  for (const [facingX, facingY, index] of [[1, 0, 10], [-1, 0, 10], [0, 1, 14]]) {
    Object.assign(caster, { facingX, facingY }); canvas.clear(); scene.render({ units, battle });
    const images = draws(canvas, 'plague-alchemist-512-lite.webp'); assert.equal(images.length, 1);
    const frame = PLAGUE_ALCHEMIST_FRAMES[index];
    assert.deepEqual(images[0].slice(2, 6), Object.values(frame.rect));
    assert.ok(Math.abs(images[0][8] - frame.rect.width * 40 / 104) < 1e-9);
    const commandIndex = canvas.commands.indexOf(images[0]);
    assert.equal(canvas.commands.slice(commandIndex - 4, commandIndex).some(([method, x, y]) => method === 'scale' && x === -1 && y === 1), facingX < 0);
  }
  assert.equal(env.requests.length, requests);
  assert.equal(canvas.saveDepth, 0);
});

test('bottle starts at the release anchor and becomes one compact impact without clouds or poison labels', async t => {
  const env = environment(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const { units, battle, caster } = encounter(); await scene.prepare({ units, battle });
  const base = { id: 1, sourceId: caster.id, sourceType: 'plagueAlchemist', targetId: 'ally-1', side: 'enemy',
    x: caster.x, y: caster.y - 27, targetX: 260, targetY: 230, age: 0, duration: .5 };
  battle.effects = [{ ...base, type: 'poison-bottle', damage: 8 }];
  canvas.clear(); scene.render({ units, battle });
  const bottle = draws(canvas, 'poison-bottle-128-lite.webp'); assert.equal(bottle.length, 1);
  const renderScale = Number(canvas.dataset.actorScale), spriteScale = .28 * renderScale;
  const origin = plagueAlchemistReleasePoint({ x: base.x, y: base.y + 27 }, { x: base.targetX, y: base.targetY + 27 }, renderScale);
  assert.deepEqual(bottle[0].slice(2, 6), Object.values(POISON_BOTTLE_FRAMES[0].rect));
  assert.equal(bottle[0][6], origin.x - POISON_BOTTLE_FRAMES[0].centerAnchor.x * spriteScale);
  assert.equal(bottle[0][7], origin.y - POISON_BOTTLE_FRAMES[0].centerAnchor.y * spriteScale);
  assert.ok(bottle[0][8] < 26, 'the projectile remains a small bottle');
  battle.effects[0].landed = true;
  canvas.clear(); scene.render({ battle }); assert.equal(draws(canvas, 'poison-bottle-128-lite.webp').length, 0);
  battle.effects = [{ ...base, type: 'poison-impact', x: base.targetX, y: base.targetY, age: .45 / 4, duration: .45 }];
  battle.allies[0].poison = { remaining: 4, nextTick: 1, damagePerTick: 2 };
  canvas.clear(); scene.render({ battle });
  const impact = draws(canvas, 'poison-impact-128-lite.webp'); assert.equal(impact.length, 1);
  assert.deepEqual(impact[0].slice(2, 6), Object.values(POISON_IMPACT_FRAMES[1].rect));
  assert.ok(impact[0][8] < 56, 'impact uses a small local one-shot sprite');
  assert.ok(canvas.commands.some(([method, , , width, height]) => method === 'fillRect' && width === 2 && height === 2));
  assert.equal(canvas.commands.some(([method, text]) => method === 'fillText' && /poison/i.test(String(text))), false);
  battle.effects[0].age = .45;
  canvas.clear(); scene.render({ battle }); assert.equal(draws(canvas, 'poison-impact-128-lite.webp').length, 0);
  assert.equal(canvas.saveDepth, 0);
});
