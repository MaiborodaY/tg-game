import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { heroXpForLevel } from '../hero.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url), key = 'brotd-infinity:campaign:v2';
const now = 1800000000000, baseUrl = 'http://127.0.0.1:5217/';
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/hero-xp/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5217, strictPort: true },
  plugins: [{ name: 'hero-xp-result-check', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.heroXpCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      finish: (phase, kills) => { battle.phase = phase; battle.kills = kills ?? battle.total; showResult(); renderScene(); },
      repeatResult: () => showResult(),
      advance: seconds => { for (let i = 0; i < Math.round(seconds * 30); i++) updateBattle(battle, 1 / 30); renderScene(); },
      state: () => ({ hero, gained: battle?.heroXp?.gained, effects: battle?.effects.filter(effect => effect.type === 'xp') }),
    };`;
  } }],
});
let browser;
async function ready(page) {
  await page.waitForFunction(() => window.heroXpCheck?.ready());
  await page.evaluate(async () => { window.heroXpCheck.freeze(); await document.fonts.ready; });
}
async function scenario(width, autoWaves, phase = 'victory', xp = 0, kills = undefined) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 700 }, isMobile: true, hasTouch: true });
  const errors = [], assets = new Set();
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ key, now, autoWaves, xp }) => {
      Date.now = () => now;
      if (!sessionStorage.getItem('__hero-xp-seeded')) {
        localStorage.setItem(key, JSON.stringify({ campaignVersion: 3, gold: 125, clearedWaves: 0,
          starterSupplyGranted: true, autoWaves, autoWavesDefaultVersion: 1, hero: { xp },
          units: [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }],
          reserve: [], economy: { slaves: 0, treasuryUpdatedAt: now } }));
        sessionStorage.setItem('__hero-xp-seeded', '1');
      }
      window.xpDraws = [];
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(label, x, y, ...rest) {
        if (/^\+\d+ XP$/.test(label)) {
          const m = this.getTransform(), dpr = this.canvas.width / this.canvas.getBoundingClientRect().width;
          window.xpDraws.push({ canvas: this.canvas.id, label, x: (m.a * x + m.e) / dpr,
            y: (m.d * y + m.f) / dpr, width: this.measureText(label).width * m.a / dpr,
            fontSize: parseFloat(this.font) * m.a / dpr, alpha: this.globalAlpha });
        }
        return fillText.call(this, label, x, y, ...rest);
      };
    }, { key, now, autoWaves, xp });
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/assets/')) assets.add(request.url()); });
    await page.goto(baseUrl); await ready(page); await page.locator('#start-wave').tap();
    await page.locator('#battle-speed').tap(); await page.locator('#battle-speed').tap();
    const before = assets.size;
    await page.evaluate(({ phase, kills }) => window.heroXpCheck.finish(phase, kills), { phase, kills });
    const result = await page.evaluate(() => window.heroXpCheck.state());
    assert.equal(result.effects.length, result.gained > 0 ? 1 : 0);
    assert.equal(result.hero.xp, xp + result.gained);
    await page.evaluate(() => window.heroXpCheck.repeatResult());
    assert.deepEqual(await page.evaluate(() => window.heroXpCheck.state()), result, 'Repeated presentation cannot award XP or append popups twice');
    assert.equal(await page.locator('#result-panel').isVisible(), !autoWaves);
    await page.evaluate(() => { window.xpDraws = []; window.heroXpCheck.advance(.4); });
    const labels = await page.evaluate(() => window.xpDraws);
    if (result.gained) {
      assert.equal(labels.length, 1);
      assert.equal(labels[0].canvas, 'battle', 'Only the battle canvas shows XP');
      assert.equal(labels[0].label, `+${result.gained} XP`);
      assert.ok(labels[0].x >= 0 && labels[0].x + labels[0].width < width, 'Text stays inside the phone');
      assert.ok(Math.abs(labels[0].fontSize - 12) < .1, 'Readable compact font at both widths');
      await page.screenshot({ path: fileURLToPath(new URL(`hero-xp-${width}-${autoWaves}-${phase}.png`, output)) });
      await page.evaluate(() => { window.xpDraws = []; window.heroXpCheck.advance(1.2); });
      const faded = await page.evaluate(() => window.xpDraws[0]);
      assert.ok(faded.y < labels[0].y && faded.alpha < labels[0].alpha, 'Text floats and fades even with x3 selected');
    } else assert.deepEqual(labels, []);
    await page.evaluate(() => { window.xpDraws = []; window.heroXpCheck.advance(2); });
    assert.deepEqual(await page.evaluate(() => window.xpDraws), [], 'The existing loop removes expired popups');
    assert.equal(assets.size, before, 'No extra image requests for XP');
    const earned = result.hero.xp;
    await page.reload(); await ready(page);
    assert.equal((await page.evaluate(() => window.heroXpCheck.state())).hero.xp, earned);
    assert.deepEqual(await page.evaluate(() => window.xpDraws), [], 'Reload never replays the reward animation');
    assert.deepEqual(errors, []);
    console.log(`PASS XP ${width}px auto=${autoWaves} ${phase} initialXP=${xp} kills=${kills ?? 'all'}`);
  } catch (error) {
    if (page) await page.screenshot({ path: fileURLToPath(new URL('hero-xp-FAILED.png', output)) });
    throw error;
  } finally { await context.close(); }
}
try {
  await mkdir(output, { recursive: true }); await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [320, 390]) for (const auto of [true, false]) await scenario(width, auto);
  await scenario(320, true, 'defeat', 0, 1);
  await scenario(320, true, 'defeat', 0, 0);
  await scenario(320, true, 'victory', heroXpForLevel(20));
} finally { await browser?.close(); await server.close(); }
