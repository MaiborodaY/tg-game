// Isolated canvas rendering only: does not load a player save or advance a battle.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES } from '../goblin-healer-art.mjs';
import { tinyGoblinHealerFrame, goblinHealPulseFrame } from '../tiny-goblin-healer.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../../.tmp/goblin-healer-art/', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  server: { host: '127.0.0.1', port: 5210, strictPort: true } });
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 445 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__healer-check', route => route.fulfill({ contentType: 'text/html',
    body: '<style>body{margin:0}canvas{display:block;width:390px;height:445px}</style><canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5210/__healer-check');
  const results = await page.evaluate(async () => {
    const { createScene } = await import('/scene.mjs');
    const { createBattle } = await import('/combat.mjs');
    const scene = await createScene(document.querySelector('canvas'), { placementGrid: false });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    let draws = [];
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image.src?.includes('/goblin-healer/')) draws.push({ url: image.src, args, mirrored: this.getTransform().a < 0 });
      return draw.call(this, image, ...args);
    };
    window.renderHealer = async (action, actionTime = 0, facingX = 1, facingY = 0, pulse = null, wave = 101) => {
      const actor = { id: 'herbalist', type: 'goblinHealer', side: 'enemy', x: 145, y: 270,
        hp: 80, maxHp: 80, action, actionTime, actionDuration: 1, impactFraction: .45,
        walkTime: actionTime, facingX, facingY, visualScale: 1, deathTime: .1 };
      const target = { ...actor, id: 'patient', type: 'goblin', x: 245, y: 270, hp: 35, action: 'idle' };
      const battle = createBattle([], wave);
      battle.enemies = [actor, target]; battle.effects = pulse === null ? [] : [{ type: 'heal', sourceType: 'goblinHealer',
        side: 'enemy', x: actor.x, y: actor.y - 27, targetX: target.x, targetY: target.y - 27,
        age: pulse, duration: 1, amount: 12 }];
      const state = { battle, time: actionTime / .65 };
      if (!await scene.prepare(state)) throw new Error('Healer assets failed to prepare');
      draws = [];
      scene.render(state);
      return { actor, pulse, renderTime: actionTime / .65, draws: [...draws] };
    };
    const rows = [];
    for (const wave of [101, 151]) {
      for (const action of ['idle', 'walk']) for (const frame of [0, 1, 2, 3]) {
        rows.push(await window.renderHealer(action, frame / (action === 'idle' ? 4 : 6) + .001, 1, 0, null, wave));
      }
      for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (const time of [0, .225, .45, .725]) rows.push(await window.renderHealer('heal', time, x, y, null, wave));
      }
      for (const pulse of [0, .25, .5, .75]) rows.push(await window.renderHealer('heal', .45, 1, 0, pulse, wave));
      rows.push(await window.renderHealer('attack', .5, 1, 0, null, wave));
      rows.push(await window.renderHealer('dead', 0, 1, 0, null, wave));
    }
    return rows;
  });
  for (const { actor, pulse, renderTime, draws } of results) {
    const body = draws.filter(draw => draw.url.endsWith('goblin-healer.webp'));
    assert.equal(body.length, 1);
    const frame = tinyGoblinHealerFrame(actor, actor.action === 'idle' ? renderTime * .65 : renderTime);
    const rect = GOBLIN_HEALER_GEOMETRY.sourceRects[frame];
    assert.deepEqual(body[0].args.slice(0, 4), [rect.x, rect.y, rect.width, rect.height]);
    assert.equal(body[0].mirrored, actor.facingX < -.15);
    const fx = draws.filter(draw => draw.url.endsWith('heal-pulse.webp'));
    assert.equal(fx.length, pulse === null ? 0 : 1);
    if (pulse !== null) {
      const { rect: r, groundAnchor } = GOBLIN_HEAL_PULSE_FRAMES[goblinHealPulseFrame(pulse)];
      assert.deepEqual(fx[0].args.slice(0, 4), [r.x, r.y, r.width, r.height]);
      const scale = fx[0].args[6] / r.width;
      assert.ok(Math.abs(fx[0].args[4] + groundAnchor.x * scale - 245) < 1e-8, 'ring stays at recipient X');
      assert.ok(Math.abs(fx[0].args[5] + groundAnchor.y * scale - 270) < 1e-8, 'ring stays at recipient feet');
    }
  }
  await page.evaluate(() => window.renderHealer('heal', .45, 1, 0, .5));
  await page.screenshot({ path: fileURLToPath(new URL('heal-peak.png', output)) });
  assert.deepEqual(errors, []);
  console.log(`Passed ${results.length} healer canvas cases: body frames, mirrored casts, anchored pulse, later round palette retention. No combat advanced. Screenshot: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
