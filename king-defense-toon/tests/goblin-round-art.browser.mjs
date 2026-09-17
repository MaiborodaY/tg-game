// Disposable renderer check: no saved player state or combat updates are used.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../../../.tmp/goblin-colors/', import.meta.url);
const server = await createServer({ root, configFile: false,
  server: { host: '127.0.0.1', port: 5199, strictPort: true } });
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 445 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__goblin-check', route => route.fulfill({ contentType: 'text/html',
    body: '<style>body{margin:0}canvas{display:block;width:390px;height:445px}</style><canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5199/__goblin-check');
  const results = await page.evaluate(async () => {
    const { createScene } = await import('/scene.mjs');
    const { createBattle } = await import('/combat.mjs');
    const canvas = document.querySelector('canvas');
    const scene = await createScene(canvas, { placementGrid: false });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    let sources = [];
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image.src) sources.push(image.src);
      return draw.call(this, image, ...args);
    };
    window.renderGoblins = async (wave, action = 'idle') => {
      const battle = createBattle([], wave);
      const types = wave <= 200 ? ['goblin', 'goblinArcher', 'goblinChief', 'boar', 'ogre']
        : ['skeleton', 'skeletonArcher', 'cryptSpider', 'ghoul', 'cryptKing'];
      battle.enemies = types.map((type, index) => ({
        id: type, type, side: 'enemy', x: 130 + index % 3 * 65, y: 255 + Math.floor(index / 3) * 100,
        hp: 60, maxHp: 60, action, actionTime: .4, actionDuration: 1, impactFraction: .5,
        walkTime: .3, facingX: 1, facingY: 0, visualScale: 1,
      }));
      if (!await scene.prepare({ battle, time: 0 })) throw new Error('Renderer assets did not load');
      sources = [];
      scene.render({ battle, time: 0 });
      return sources.map(url => new URL(url).pathname);
    };
    const rows = [];
    for (const wave of [1, 50, 51, 100, 101, 150, 151, 200, 201, 400]) {
      for (const action of ['idle', 'walk', 'attack']) rows.push({ wave, action, sources: await window.renderGoblins(wave, action) });
    }
    return rows;
  });
  for (const { wave, action, sources } of results) {
    const goblinSheets = sources.filter(url => /torch-/.test(url));
    const color = wave <= 50 ? 'blue' : wave <= 100 ? 'purple' : wave <= 150 ? 'red' : 'yellow';
    assert.equal(goblinSheets.length, wave <= 200 ? 1 : 0, `${wave}/${action}: Torch rendering`);
    if (wave <= 200) {
      assert.ok(goblinSheets[0].includes(`torch-${color}.`), `${wave}/${action}: ${color}`);
      for (const asset of ['goblin-archer.webp', 'goblin-chief.webp', 'boar.webp', 'ogre-boss.webp']) {
        assert.ok(sources.some(url => url.endsWith(asset)), `${wave}/${action}: unchanged ${asset}`);
      }
    }
  }
  for (const [wave, color] of [[1, 'blue'], [51, 'purple'], [101, 'red'], [151, 'yellow']]) {
    await page.evaluate(wave => window.renderGoblins(wave), wave);
    await page.screenshot({ path: fileURLToPath(new URL(`${color}.png`, output)) });
  }
  assert.deepEqual(errors, []);
  console.log(`Passed ${results.length} renderer checks across palette boundaries and both worlds. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
