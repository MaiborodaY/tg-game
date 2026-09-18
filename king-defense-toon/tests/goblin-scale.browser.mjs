// Compare actual Canvas draws at a shared baseline; never load a save or advance combat.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/goblin-scale/', import.meta.url);
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/goblin-scale/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5211, strictPort: true },
});
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 780, height: 600 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__scale-check', route => route.fulfill({ contentType: 'text/html',
    body: '<style>body{margin:0}canvas{display:block;width:780px;height:600px}</style><canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5211/__scale-check');
  const results = await page.evaluate(async () => {
    const { createScene } = await import('/scene.ts');
    const { createBattle } = await import('/combat.ts');
    const { GOBLIN_ARCHER_GEOMETRY: archer } = await import('/goblin-archer-art.ts');
    const { GOBLIN_HEALER_GEOMETRY: healer } = await import('/goblin-healer-art.ts');
    const { tinyTorchFrame } = await import('/tiny-torch.ts');
    const { tinyGoblinArcherFrame } = await import('/tiny-goblin-archer.ts');
    const { tinyGoblinHealerFrame } = await import('/tiny-goblin-healer.ts');
    const scene = await createScene(document.querySelector('canvas'), { placementGrid: false });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    let draws = [];
    const typeForUrl = url => /torch-(blue|purple|yellow)\.webp$|tiny-swords-torch-red\.png$/.test(url) ? 'goblin'
      : url.endsWith('/goblin-archer.webp') ? 'goblinArcher'
      : url.endsWith('/goblin-healer.webp') ? 'goblinHealer' : null;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      const type = image.src && typeForUrl(image.src);
      if (type) draws.push({ type, args, width: image.width, height: image.height, mirrored: this.getTransform().a < 0 });
      return draw.call(this, image, ...args);
    };
    // Measured first idle frames, opaque hood core to ground; excludes weapons and shadows.
    const bodyPixels = { goblin: 65, goblinArcher: 179, goblinHealer: 141 };
    const definitions = [
      { type: 'goblin', columns: 7, rows: 5, frameFor: tinyTorchFrame, baselines: Array(35).fill(128 / 192) },
      { type: 'goblinArcher', columns: 4, rows: 4, frameFor: tinyGoblinArcherFrame, baselines: archer.baselines },
      { type: 'goblinHealer', columns: 4, rows: 4, frameFor: tinyGoblinHealerFrame, baselines: healer.baselines },
    ];
    window.drawGoblinComparison = async (wave, action, phase = 0, facingX = 1, facingY = 0) => {
      const battle = createBattle([], wave);
      const time = phase / 4 + .001;
      battle.enemies = definitions.map(({ type }, index) => ({
        id: type, type, side: 'enemy', x: 120 + index * 85, y: 280,
        hp: 100, maxHp: 100, action: action === 'skill' ? ['attack', 'shoot', 'heal'][index] : action,
        actionTime: phase / 4, actionDuration: 1, impactFraction: .45,
        walkTime: time, facingX, facingY, visualScale: 1,
      }));
      const state = { battle, time };
      if (!await scene.prepare(state)) throw new Error('Could not load comparison sprites');
      draws = [];
      scene.render(state);
      return draws.map(({ type, args, width, height, mirrored }) => {
        const definition = definitions.find(item => item.type === type);
        const actor = battle.enemies.find(item => item.type === type);
        const frame = definition.frameFor(actor, action === 'idle' ? time * .65 : time);
        const cellHeight = height / definition.rows;
        const scale = args[6] / args[2];
        const feetY = args[5] + (Math.floor(frame / definition.columns) * cellHeight
          + definition.baselines[frame] * cellHeight - args[1]) * scale;
        return { type, scale, measuredBodyHeight: bodyPixels[type] * scale, feetY, mirrored };
      });
    };
    const rows = [];
    for (const wave of [1, 51, 101, 151]) {
      for (const action of ['idle', 'walk', 'skill']) {
        for (const [facingX, facingY] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          for (let phase = 0; phase < 4; phase++) rows.push({ wave, action, facingX, facingY, phase,
            draws: await window.drawGoblinComparison(wave, action, phase, facingX, facingY) });
        }
      }
    }
    return rows;
  });
  for (const { draws, facingX, wave, action, phase } of results) {
    assert.equal(draws.length, 3, `${wave}/${action}/${phase}: three ordinary goblins`);
    const melee = draws.find(draw => draw.type === 'goblin');
    assert.ok(Math.abs(melee.measuredBodyHeight - 32.5) < 1e-6, 'melee reference stays unchanged');
    for (const draw of draws) {
      assert.ok(Math.abs(draw.feetY) < 1e-6, `${draw.type} feet stay on the common baseline`);
      assert.equal(draw.mirrored, facingX < -.15);
      assert.ok(draw.measuredBodyHeight / melee.measuredBodyHeight > .95
        && draw.measuredBodyHeight / melee.measuredBodyHeight < 1.05,
      `${draw.type} body must remain within 5% of melee: ${draw.measuredBodyHeight}`);
    }
  }
  await page.evaluate(() => window.drawGoblinComparison(101, 'idle'));
  await page.screenshot({ path: fileURLToPath(new URL('idle-comparison.png', output)) });
  await page.evaluate(() => window.drawGoblinComparison(101, 'skill', 2));
  await page.screenshot({ path: fileURLToPath(new URL('action-comparison.png', output)) });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, cases: results.length, idleBodyHeights: results[0].draws,
    screenshots: fileURLToPath(output) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
