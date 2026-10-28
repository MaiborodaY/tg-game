import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import { GOBLIN_BOMBARDIER_ASSETS, GOBLIN_BOMBARDIER_METADATA, GOBLIN_BOMBARDIER_FRAMES,
  GOBLIN_BOMBARDIER_MUZZLES, CANNON_BOMB_FRAMES, CANNON_EXPLOSION_FRAMES } from '../goblin-bombardier-art.ts';
import { tinyGoblinBombardierFrame, goblinBombardierReleased, cannonBombFrame,
  cannonExplosionFrame, CANNON_EXPLOSION_DURATION } from '../tiny-goblin-bombardier.ts';
import { loadGoblinBombardierVisual, drawGoblinBombardier, goblinBombardierMuzzle,
  drawCannonBomb, drawCannonExplosion } from '../goblin-bombardier-visual.ts';
import { prepareAnimation, drawPreparedAnimation } from '../sprite-animation.ts';

const sourceRoot = new URL('../../art/brotd-infinity/level-01/mini-bosses/goblin-bombardier/', import.meta.url);
const source = name => readFile(new URL(name, sourceRoot), 'utf8').then(JSON.parse);
const bodyManifest = await source('goblin-bombardier-512.frames.json');
const image = { width: 512, height: 512 };
const art = { body: prepareAnimation(image, GOBLIN_BOMBARDIER_METADATA), bomb: {}, explosion: {} };

function recordingContext() {
  const draws = [];
  const stack = [];
  let tx = 0, ty = 0, sx = 1, sy = 1;
  return {
    draws, globalAlpha: 1, imageSmoothingEnabled: true,
    save() { stack.push([tx, ty, sx, sy, this.globalAlpha, this.imageSmoothingEnabled]); },
    restore() { [tx, ty, sx, sy, this.globalAlpha, this.imageSmoothingEnabled] = stack.pop(); },
    translate(x, y) { tx += x * sx; ty += y * sy; },
    scale(x, y) { sx *= x; sy *= y; },
    drawImage(image, ...args) { draws.push({ image, args, tx, ty, sx, sy, alpha: this.globalAlpha, smooth: this.imageSmoothingEnabled }); },
  };
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('shared scene renderer keeps legacy missing-frame, compact-crop and authored-mirror behavior', () => {
  const crop = { x: 20, y: 30, width: 40, height: 50 };
  const metadata = { layout: { columns: 4, rows: 4 }, bodyHeight: .5, renderHeight: 32,
    baselines: Array(16).fill(.75), frameFor: () => NaN, pixelArt: true,
    compactSourceRects: { 0: crop }, mirrorFrames: [0] };
  const animation = prepareAnimation(image, metadata);
  for (const facingX of [-1, 1]) {
    const context = recordingContext();
    assert.equal(drawPreparedAnimation(context, animation, { facingX }, 100, 150, 0, true, true), true);
    assert.deepEqual(context.draws[0].args.slice(0, 4), [20, 30, 40, 50]);
    assert.equal(context.draws[0].sx, facingX < 0 ? 1 : -1, 'authored mirror cancels a left-facing mirror');
    near(context.draws[0].args[4], (20 - 64) * .5);
    near(context.draws[0].args[5], (30 - 96) * .5);
  }
  const context = recordingContext();
  assert.equal(drawPreparedAnimation(context, null, null, 0, 0, 0), false);
  assert.equal(context.draws.length, 0);
});

test('runtime atlas pixels, dimensions and geometry match the approved compact source pack', async () => {
  const packs = [
    ['body', 'goblin-bombardier-512.frames.json', GOBLIN_BOMBARDIER_FRAMES, 'footAnchor'],
    ['bomb', 'cannon-bomb-128.frames.json', CANNON_BOMB_FRAMES, 'centerAnchor'],
    ['explosion', 'cannon-explosion-128.frames.json', CANNON_EXPLOSION_FRAMES, 'centerAnchor'],
  ];
  let total = 0;
  for (const [key, name, frames, anchorKey] of packs) {
    const manifest = await source(name);
    const path = new URL(GOBLIN_BOMBARDIER_ASSETS[key]);
    assert.deepEqual(await readFile(path), await readFile(new URL(manifest.image, sourceRoot)));
    const metadata = await sharp(await readFile(path)).metadata();
    assert.equal(metadata.width, manifest.size.width);
    assert.equal(metadata.height, manifest.size.height);
    assert.equal(metadata.hasAlpha, true);
    assert.equal(frames.length, manifest.frames.length);
    manifest.frames.forEach((frame, index) => {
      assert.deepEqual(frames[index], { rect: frame.rect, groundAnchor: frame[anchorKey] });
      if (frame.projectileAnchor) assert.deepEqual(GOBLIN_BOMBARDIER_MUZZLES[index], frame.projectileAnchor);
    });
    total += (await stat(path)).size;
  }
  assert.ok(total < 84_000, `runtime images should stay below 84 KB, got ${total}`);
});

test('all authored frames plant wheel anchors in the same world point in the real scene renderer', () => {
  for (const facingX of [1, -1]) for (const visualScale of [.7, 1, 2]) {
    for (const { index, rect, footAnchor } of bodyManifest.frames) {
      const context = recordingContext();
      const animation = prepareAnimation(image, { ...GOBLIN_BOMBARDIER_METADATA, frameFor: () => index });
      assert.equal(drawPreparedAnimation(context, animation, { facingX, visualScale }, 120, 200, 0), true);
      const { args, tx, ty, sx, sy, smooth } = context.draws[0];
      assert.deepEqual(args.slice(0, 4), [rect.x, rect.y, rect.width, rect.height]);
      const scale = args[6] / rect.width;
      near(tx + (args[4] + footAnchor.x * scale) * sx, 120);
      near(ty + (args[5] + footAnchor.y * scale) * sy, 200);
      assert.equal(smooth, false);
      assert.equal(context.imageSmoothingEnabled, true, 'drawing restores caller state');
    }
  }
});

test('each shot uses its authored release pose and the muzzle matches drawn pixels including mirroring', () => {
  for (const [facingX, facingY, frame] of [[1,0,10], [-1,0,10], [0,1,14], [-.3,1,14], [0,-1,10]]) {
    for (const visualScale of [.5, 1, 2]) {
      const actor = { action: 'shoot', actionDuration: 2, impactFraction: .4, actionTime: .8, facingX, facingY, visualScale };
      assert.equal(tinyGoblinBombardierFrame({ ...actor, actionTime: .8 - 1e-6 }), frame - 1);
      assert.equal(tinyGoblinBombardierFrame(actor), frame);
      assert.equal(tinyGoblinBombardierFrame({ ...actor, actionTime: 2 }), frame + 1);
      const context = recordingContext();
      drawGoblinBombardier(context, art, actor, 120, 200);
      const { args, tx, ty, sx, sy } = context.draws[0];
      const scale = args[6] / args[2];
      const anchor = bodyManifest.frames[frame].projectileAnchor;
      const muzzle = goblinBombardierMuzzle(actor, 120, 200);
      near(muzzle.x, tx + (args[4] + anchor.x * scale) * sx);
      near(muzzle.y, ty + (args[5] + anchor.y * scale) * sy);
      assert.deepEqual(goblinBombardierMuzzle({ ...actor, actionTime: 2 }, 120, 200), muzzle);
    }
  }
});

test('one release per shot survives varying update rates and a step skipping the release pose', () => {
  for (const step of [1 / 20, 1 / 30, 1 / 60, 1 / 144, 3]) {
    let count = 0;
    for (let previous = 0; previous < 2; previous += step) {
      if (goblinBombardierReleased({ action: 'shoot', actionDuration: 2, impactFraction: .4, actionTime: previous + step }, previous)) count++;
    }
    assert.equal(count, 1, `step ${step}`);
  }
  assert.equal(goblinBombardierReleased({ action: 'dead', actionTime: 2 }, 0), false);
  assert.equal(goblinBombardierReleased({ action: 'shoot', actionTime: .1 }, 1), false, 'new action clock must not reuse old shot time');
});

test('idle, rolling, death and malformed clocks never select a nonexistent frame', () => {
  assert.equal(tinyGoblinBombardierFrame(null, .25), 1);
  assert.equal(tinyGoblinBombardierFrame({ action: 'walk', walkTime: 1 / 6 }), 5);
  for (const action of ['idle', 'walk', 'shoot', 'dead', 'death']) for (const value of [undefined, -3, 0, 1e6, NaN, Infinity]) {
    const actor = { action, actionTime: value, walkTime: value, actionDuration: value, impactFraction: value, facingX: value, facingY: value };
    const frame = tinyGoblinBombardierFrame(actor, value);
    assert.ok(Number.isInteger(frame) && frame >= 0 && frame < 16);
    if (action === 'dead' || action === 'death') assert.equal(frame, 0);
  }
});

test('bomb center is stable across tumbling poses and the blast finishes instead of looping', () => {
  for (let frame = 0; frame < 4; frame++) {
    const context = recordingContext();
    drawCannonBomb(context, art, (frame + .1) / 12, 150, 175, .5);
    assert.equal(cannonBombFrame((frame + .1) / 12), frame);
    const { args } = context.draws[0];
    const anchor = CANNON_BOMB_FRAMES[frame].groundAnchor;
    near(args[4] + anchor.x * .5, 150);
    near(args[5] + anchor.y * .5, 175);
    const explosionContext = recordingContext();
    assert.equal(drawCannonExplosion(explosionContext, art, (frame + .1) / 10, 150, 175), true);
    const blast = explosionContext.draws[0].args;
    near(blast[4] + CANNON_EXPLOSION_FRAMES[frame].groundAnchor.x, 150);
    near(blast[5] + CANNON_EXPLOSION_FRAMES[frame].groundAnchor.y, 175);
  }
  for (const elapsed of [-1, CANNON_EXPLOSION_DURATION, 3, NaN, Infinity]) {
    const context = recordingContext();
    assert.equal(cannonExplosionFrame(elapsed), -1);
    assert.equal(drawCannonExplosion(context, art, elapsed, 0, 0), false);
    assert.equal(context.draws.length, 0);
  }
});

test('fallback death fades while preserving caller opacity', () => {
  for (const action of ['dead', 'death']) for (const [deathTime, opacity] of [[0, 1], [.57, .5], [1, 0]]) {
    const context = recordingContext();
    context.globalAlpha = .6;
    drawGoblinBombardier(context, art, { action, deathTime }, 0, 0);
    near(context.draws[0].alpha, opacity * .6);
    assert.equal(context.globalAlpha, .6);
  }
});

test('explicit loader requests only three WebPs, reports failure and supports retry', async () => {
  const requested = [];
  const loaded = await loadGoblinBombardierVisual(async url => { requested.push(url); return image; });
  assert.deepEqual(requested.sort(), Object.values(GOBLIN_BOMBARDIER_ASSETS).sort());
  assert.equal(loaded.body.metadata, GOBLIN_BOMBARDIER_METADATA);
  await assert.rejects(loadGoblinBombardierVisual(async () => { throw new Error('offline'); }), /offline/);
  assert.ok(await loadGoblinBombardierVisual(async () => image));
});
