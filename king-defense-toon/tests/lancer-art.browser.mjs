// Disposable renderer coverage, without loading or modifying player saves or advancing combat.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { LANCER_GEOMETRY } from '../lancer-art.mjs';
import { tinyLancerFrame } from '../tiny-lancer.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../../.tmp/lancer-art/', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  server: { host: '127.0.0.1', port: 5200, strictPort: true } });
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__lancer-check', route => route.fulfill({ contentType: 'text/html',
    body: '<style>body{margin:0;background:#e9e0bd}canvas{display:block;width:390px;height:445px}#formation{height:234px}</style><canvas id="battle"></canvas><canvas id="formation"></canvas>' }));
  await page.goto('http://127.0.0.1:5200/__lancer-check');
  const results = await page.evaluate(async () => {
    const { createScene } = await import('/scene.mjs');
    const { createBattle } = await import('/combat.mjs');
    const battleScene = await createScene(document.querySelector('#battle'), { placementGrid: false });
    const formation = await createScene(document.querySelector('#formation'), { formationOnly: true });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    let draws = [], lineupScales = [];
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      const type = image.src?.includes('/lancer/') ? 'lancer'
        : image.src?.includes('tiny-swords-warrior-blue') ? 'swordsman' : null;
      if (type) lineupScales.push({ canvas: this.canvas.id, type, scale: Math.abs(args[6] / args[2]) });
      if (image.src?.includes('/lancer/')) {
        const transform = this.getTransform();
        draws.push({ url: image.src, args, mirrored: transform.a < 0 });
      }
      return draw.call(this, image, ...args);
    };
    window.renderLancer = (level, action = 'idle', facingX = 1, facingY = 0, compact = false) => {
      draws = [];
      const actor = { id: 'lancer', type: 'lancer', level, side: 'ally', x: 195, y: 260,
        hp: 48, maxHp: 48, action, actionTime: .5, actionDuration: 1, impactFraction: .5,
        walkTime: .3, facingX, facingY, visualScale: 1 };
      if (compact) {
        formation.render({ units: [{ id: 'lancer', type: 'lancer', level, col: 2, row: 0 }], time: 20 });
      } else {
        const battle = createBattle([], 1);
        battle.allies = [actor]; battle.enemies = []; battle.effects = [];
        battleScene.render({ battle, time: 0 });
      }
      return { actor, compact, draws: [...draws], art: formation.getUnitArt('lancer', level),
        portrait: formation.getPortrait('lancer') };
    };
    const rows = [];
    for (const level of [1, 26, 51, 76]) {
      rows.push(window.renderLancer(level), window.renderLancer(level, 'walk'));
      for (const [x, y] of [[1, 0], [1, 1], [0, 1], [1, -1], [0, -1], [-1, 0], [-1, 1], [-1, -1]]) {
        rows.push(window.renderLancer(level, 'attack', x, y));
      }
      rows.push(window.renderLancer(level, 'idle', 1, 0, true));
    }
    window.showLancerLineup = () => {
      lineupScales = [];
      const battle = createBattle([], 1);
      battle.allies = ['swordsman', 'lancer', 'archer'].map((type, i) => ({
        id: type, type, level: 1, side: 'ally', x: 105 + i * 90, y: 260, hp: 48, maxHp: 48,
        action: 'idle', facingX: 1, facingY: 0,
      }));
      battle.enemies = []; battle.effects = [];
      battleScene.render({ battle, time: 0 });
      formation.render({ units: Array.from({ length: 15 }, (_, i) => ({ id: `u${i}`,
        type: i % 3 === 0 ? 'lancer' : i % 3 === 1 ? 'swordsman' : 'archer', level: 1 + Math.floor(i / 4) * 25,
        col: i % 5, row: Math.floor(i / 5) })), time: 20 });
      return lineupScales;
    };
    return rows;
  });
  for (const { actor, compact, draws, art, portrait } of results) {
    assert.equal(draws.length, 1);
    const color = ['blue', 'purple', 'red', 'yellow'][Math.floor((actor.level - 1) / 25)];
    assert.ok(draws[0].url.endsWith(`lancer-${color}.webp`));
    assert.ok(art.endsWith(`lancer-${color}-art.webp`));
    assert.ok(portrait.endsWith('lancer-blue-art.webp'));
    const frame = compact ? 0 : tinyLancerFrame(actor, 0);
    const rect = compact ? LANCER_GEOMETRY.compactSourceRects[0] : LANCER_GEOMETRY.sourceRects[frame];
    assert.deepEqual(draws[0].args.slice(0, 4), [rect.x, rect.y, rect.width, rect.height]);
    assert.equal(draws[0].mirrored, !compact && actor.facingX < -.15);
  }
  const scales = await page.evaluate(() => window.showLancerLineup());
  for (const canvas of ['battle', 'formation']) {
    const sword = scales.find(draw => draw.canvas === canvas && draw.type === 'swordsman');
    const lancers = scales.filter(draw => draw.canvas === canvas && draw.type === 'lancer');
    assert.ok(sword && lancers.length);
    assert.ok(lancers.every(draw => Math.abs(draw.scale / sword.scale - 1) < .01),
      `${canvas}: a lancer must share the infantry's source-pixel scale, including every palette`);
  }
  await page.screenshot({ path: fileURLToPath(new URL('lineup.png', output)) });
  assert.deepEqual(errors, []);
  console.log(`Passed ${results.length} real-canvas Lancer palette, angle, mirror and compact-crop checks. Screenshot: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
