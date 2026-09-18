// Disposable mobile saves exercise the actual 2-1 encounter and its authored art.
// Only the frame loop is stopped: combat advances through real fixed simulation steps.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const baseUrl = 'http://127.0.0.1:5210/';
const key = 'brotd-infinity:campaign:v2', now = 1800000000000;
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/plague-alchemist/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5210, strictPort: true },
  plugins: [{ name: 'alchemist-browser-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `
window.alchemistCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
      render: async () => { await scene.prepare({ units: campaign.units, battle }); window.battleDraws = []; renderScene(); },
      until: type => { for (let i = 0; i < 3600 && battle.phase === 'running'; i++) {
        if (battle.effects.some(effect => effect.type === type && !effect.landed)) break;
        updateBattle(battle, 1 / 60);
      } refreshBattleHud(); },
      step: seconds => { for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 1 / 60) updateBattle(battle, 1 / 60); refreshBattleHud(); },
    };`;
  } }],
});

function fixture(clearedWaves) {
  return {
    campaignVersion: 3, gold: 5000, starterSupplyGranted: true, marketHintCompleted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves,
    barracks: { level: 3, firstLancerPending: false },
    units: [{ id: 1, type: 'swordsman', level: 100, col: 1, row: 0 },
      { id: 2, type: 'archer', level: 100, col: 2, row: 1 },
      { id: 3, type: 'healer', level: 100, col: 2, row: 2 }],
    reserve: [{ id: 4, type: 'pantherRider', level: 1 }],
    progression: { unlockedCells: ['1:0', '2:0', '2:1', '2:2'], firstClears: [] },
    economy: { slaves: 5, treasuryUpdatedAt: now },
  };
}
const snapshot = page => page.evaluate(() => window.alchemistCheck.battle());
const render = page => page.evaluate(() => window.alchemistCheck.render());
const screenshot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(name, output)) });
async function fits(page, panel) {
  assert.deepEqual(await page.locator(`${panel} .menu-card`).evaluate(card => {
    const b = card.getBoundingClientRect(), issues = [];
    if (b.left < -1 || b.right > innerWidth + 1 || b.top < -1 || b.bottom > innerHeight + 1) issues.push('outside viewport');
    if (card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1) issues.push('card overflow');
    return issues;
  }), []);
}

let browser;
let count = 0;
try {
  await mkdir(output, { recursive: true }); await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [390, 320]) for (const clearedWaves of [0, 200]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 700 : 640 }, isMobile: true, hasTouch: true });
    const errors = [], requests = [];
    try {
      await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await context.addInitScript(({ saved, key, now }) => {
        Date.now = () => now; localStorage.setItem(key, JSON.stringify(saved));
        window.battleDraws = [];
        const draw = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
          if (this.canvas.id === 'battle' && image.src) window.battleDraws.push({ image: image.src, args });
          return draw.call(this, image, ...args);
        };
      }, { saved: fixture(clearedWaves), key, now });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().includes('/assets/')) requests.push(request.url()); });
      page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
      await page.goto(baseUrl); await page.waitForFunction(() => window.alchemistCheck?.ready());
      await page.evaluate(async () => { window.alchemistCheck.freeze(); await document.fonts.ready; });
      assert.equal(requests.some(url => /plague-alchemist|poison-bottle|poison-impact/.test(url)), false, 'Preparation fetches no alchemist resources');
      await page.locator('#start-wave').click(); await render(page);
      if (clearedWaves === 0) {
        assert.equal(requests.some(url => /plague-alchemist|poison-bottle|poison-impact/.test(url)), false, 'First level spends no alchemist texture resources');
      } else {
        assert.equal((await snapshot(page)).waveNumber, 201);
        assert.equal(new Set(requests.filter(url => url.includes('/assets/plague-alchemist/'))).size, 3);
        await page.evaluate(() => window.alchemistCheck.until('poison-bottle')); await render(page);
        let battle = await snapshot(page);
        const bottle = battle.effects.find(effect => effect.type === 'poison-bottle');
        assert.ok(bottle, 'The real 2-1 wave releases a poison bottle');
        const caster = battle.enemies.find(actor => actor.id === bottle.sourceId);
        assert.equal(caster.action, 'shoot'); assert.ok(caster.actionTime >= caster.actionDuration * caster.impactFraction);
        const images = await page.evaluate(() => window.battleDraws.filter(draw => draw.image.includes('/plague-alchemist/')));
        assert.equal(images.filter(draw => draw.image.includes('plague-alchemist-512')).length, 1);
        assert.equal(images.filter(draw => draw.image.includes('poison-bottle')).length, 1);
        assert.equal(images.filter(draw => draw.image.includes('poison-impact')).length, 0);
        assert.ok(images.find(draw => draw.image.includes('plague-alchemist-512')).args[6] < 75, 'Ordinary enemy scale remains compact');
        await screenshot(page, `plague-alchemist-release-${width}.png`);
        await page.evaluate(() => window.alchemistCheck.until('poison-impact')); await render(page);
        battle = await snapshot(page);
        const impact = battle.effects.find(effect => effect.type === 'poison-impact'); assert.ok(impact);
        const target = [...battle.allies, battle.hero].find(actor => actor.id === impact.targetId);
        assert.ok(target.poison?.remaining > 0);
        const beforeTick = target.hp;
        const impactImages = await page.evaluate(() => window.battleDraws.filter(draw => draw.image.includes('/plague-alchemist/')));
        assert.equal(impactImages.filter(draw => draw.image.includes('poison-bottle')).length, 0);
        assert.equal(impactImages.filter(draw => draw.image.includes('poison-impact')).length, 1);
        assert.ok(impactImages.find(draw => draw.image.includes('poison-impact')).args[6] < 60);
        await screenshot(page, `plague-alchemist-impact-${width}.png`);
        await page.evaluate(() => window.alchemistCheck.step(1.1)); await render(page);
        const tickBattle = await snapshot(page);
        const after = [...tickBattle.allies, tickBattle.hero].find(actor => actor.id === impact.targetId);
        assert.ok(after.hp < beforeTick, 'HP decreases after the poison tick');
        assert.ok(after.poison.remaining < target.poison.remaining, 'Poison advances in simulation time');
        assert.equal((await page.evaluate(() => window.battleDraws)).some(draw => draw.image.includes('poison-impact')), false, 'Impact finishes instead of becoming a permanent cloud');
        await page.locator('#open-market-info').click(); await page.locator('#recruitment-pool').selectOption('elves');
        await page.locator('#elf-recruitment-details img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        assert.equal(await page.locator('[data-elf-recruit="elfHealer"] img').count(), 1);
        assert.equal(await page.locator('[data-elf-recruit="elfHealer"] svg').count(), 0);
        await fits(page, '#market-info-panel'); await screenshot(page, `plague-elf-recruits-${width}.png`);
        await page.locator('#market-info-panel [data-close-overlay]').click(); await page.locator('#open-barracks').click();
        await page.locator('[data-barracks-unit-id="4"]').click(); await page.locator('#barracks-detail img').evaluate(image => image.decode());
        await fits(page, '#barracks-panel'); await screenshot(page, `plague-rider-portrait-${width}.png`);
      }
      assert.deepEqual(errors, []); console.log(`PASS level ${clearedWaves === 0 ? '1-1 lazy' : '2-1 bottle, impact, tick and portraits'} ${width}px`); count++;
    } finally { await context.close(); }
  }
  console.log(`${count} alchemist mobile scenarios passed`);
} finally { await browser?.close(); await server.close(); }
