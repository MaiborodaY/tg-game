// Isolated mobile saves and a controllable wall clock exercise manual farming.
// The frame loop and interval are frozen; actual economy, persistence and UI actions remain intact.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { BATTLE_SPEEDS } from '../battle-speed.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const initialTime = 1800000000000;
const crops = ['carrot', 'potato', 'pumpkin'];
const minutes = { carrot: 5, potato: 15, pumpkin: 30 };
const emptyFarm = { plots: { carrot: null, potato: null, pumpkin: null }, stock: { carrot: 0, potato: 0, pumpkin: 0 } };
let baseUrl;
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/farm/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'farm-browser-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.farmCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      setTime: timestamp => { window.farmNow = timestamp; sessionStorage.setItem('__farm-now', String(timestamp)); refresh(); },
      refresh: () => refresh(),
    };`;
  } }],
});

function fixture(overrides = {}) {
  return {
    campaignVersion: 3, gold: 500, starterSupplyGranted: true, marketHintCompleted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    units: ['swordsman', 'archer', 'healer'].map((type, row) => ({ id: row + 1, type, level: 1, col: 2, row })),
    reserve: [{ id: 4, type: 'archer', level: 1 }],
    progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
    economy: { slaves: 5, treasuryUpdatedAt: initialTime }, ...overrides,
  };
}
const state = page => page.evaluate(() => window.farmCheck.state());
const stored = page => page.evaluate(() => JSON.parse(window.farmStorage.raw()));
const row = (page, crop) => page.locator(`[data-farm-row="${crop}"]`);
const action = (page, crop) => page.locator(`[data-farm-action="${crop}"]`);
const timer = (page, crop) => row(page, crop).locator('[data-farm-timer]');
const stock = (page, crop) => row(page, crop).locator('[data-farm-stock]');
const close = (page, panel = 'buildings-panel') => page.locator(`#${panel} [data-close-overlay]`).click();
const setTime = (page, timestamp) => page.evaluate(time => window.farmCheck.setTime(time), timestamp);
const unrelated = save => ({ gold: save.gold, slaves: save.economy.slaves, units: save.units, reserve: save.reserve,
  hero: save.hero, recruitment: save.recruitment, barracks: save.barracks, forge: save.forge, progression: save.progression });

async function ready(page) {
  await page.waitForFunction(() => window.farmCheck?.ready());
  await page.evaluate(async () => { window.farmCheck.freeze(); await document.fonts.ready; });
}

async function openFarm(page) {
  await page.locator('#open-buildings').click();
  await page.locator('#tab-farm').click();
  assert.equal(await page.locator('#farm-building').isVisible(), true);
}

async function dismissIncome(page) {
  if (await page.locator('#offline-rewards-panel').isVisible()) await page.locator('#collect-offline-rewards').click();
}

async function fits(page) {
  const issues = await page.locator('#buildings-panel .menu-card').evaluate(card => {
    const bad = [], bounds = card.getBoundingClientRect();
    if (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1) bad.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1) bad.push(`card overflow: ${card.scrollWidth}x${card.scrollHeight} inside ${card.clientWidth}x${card.clientHeight}`);
    for (const element of card.querySelectorAll('.farm-row, .farm-copy, .farm-crop-heading, .farm-action, .building-tab')) {
      if (element.getClientRects().length && element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className}: horizontal overflow`);
      if (element.classList.contains('farm-action') && element.getBoundingClientRect().height < 44) bad.push('farm action touch target below 44px');
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Farm and all five building tabs fit the small screen');
}

async function emptyPlots(page) {
  assert.deepEqual(await page.locator('[data-farm-row]').evaluateAll(nodes => nodes.map(node => node.dataset.farmRow)), crops);
  assert.deepEqual((await state(page)).farm, emptyFarm);
  for (const crop of crops) {
    assert.equal(await row(page, crop).getAttribute('data-state'), 'empty');
    assert.equal(await stock(page, crop).innerText(), '0');
    assert.equal(await timer(page, crop).innerText(), `${minutes[crop]} min · +1`);
    assert.equal(await action(page, crop).innerText(), 'Plant');
    assert.equal(await action(page, crop).isEnabled(), true);
  }
}

async function plantAll(page) {
  const before = unrelated(await state(page));
  for (const crop of crops) {
    await action(page, crop).click();
    assert.equal(await row(page, crop).getAttribute('data-state'), 'growing');
    assert.equal(await action(page, crop).isDisabled(), true);
    assert.equal(await timer(page, crop).innerText(), `${minutes[crop]}:00 left`);
    assert.equal(await stock(page, crop).innerText(), '0');
    const planted = (await state(page)).farm;
    assert.deepEqual(planted.plots[crop], { plantedAt: initialTime, readyAt: initialTime + minutes[crop] * 60_000 });
    await action(page, crop).evaluate(button => button.click());
    assert.deepEqual((await state(page)).farm, planted, 'A second planting cannot replace the existing crop');
  }
  assert.deepEqual(unrelated(await state(page)), before, 'Planting is free and never consumes fighters or combat progress');
  assert.deepEqual((await stored(page)).farm, (await state(page)).farm);
}

let browser;
const checks = [];
async function scenario(name, viewport, saved, check) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const errors = [];
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ saved, key, initialTime }) => {
      window.farmNow = Number(sessionStorage.getItem('__farm-now')) || initialTime;
      Date.now = () => window.farmNow;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      if (!get.call(sessionStorage, '__farm-seeded')) {
        if (saved !== null) set.call(localStorage, key, JSON.stringify(saved));
        set.call(sessionStorage, '__farm-seeded', '1');
      }
      let failWrites = false;
      Storage.prototype.setItem = function (requestedKey, value) {
        if (this === localStorage && requestedKey === key && failWrites) throw new DOMException('Intentional farm save failure', 'QuotaExceededError');
        return set.call(this, requestedKey, value);
      };
      window.farmStorage = { raw: () => get.call(localStorage, key), failWrites: value => { failWrites = value; } };
    }, { saved, key, initialTime });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl); await ready(page);
    await check(page);
    assert.deepEqual(errors, [], 'No browser or local asset errors');
    checks.push(`${name} ${viewport.width}x${viewport.height}`);
    console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`farm-${name}-FAILED-${viewport.width}.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true });
  baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const viewport of [{ width: 390, height: 700 }, { width: 320, height: 568 }]) {
    await scenario('fresh-game-five-tabs', viewport, null, async page => {
      await openFarm(page); await emptyPlots(page);
      const tabs = page.locator('#buildings-tabs [role="tab"]');
      assert.deepEqual(await tabs.evaluateAll(nodes => nodes.map(node => node.id)), ['tab-treasury', 'tab-market', 'tab-forge', 'tab-farm', 'tab-capitol']);
      await page.locator('#tab-farm').focus();
      for (const [key, id] of [['ArrowRight', 'tab-capitol'], ['ArrowRight', 'tab-treasury'], ['End', 'tab-capitol'], ['Home', 'tab-treasury'], ['ArrowRight', 'tab-market'], ['ArrowRight', 'tab-forge'], ['ArrowRight', 'tab-farm']]) {
        await page.keyboard.press(key);
        assert.equal(await page.locator(`#${id}`).getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator(`#${id}`).evaluate(node => node === document.activeElement), true);
        assert.equal(await page.locator('#buildings-tabs [tabindex="0"]').count(), 1);
      }
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL(`farm-empty-${viewport.width}.png`, output)) });
    });

    await scenario('plant-boundaries-harvest-replant-reset', viewport, fixture(), async page => {
      await openFarm(page); await emptyPlots(page); await plantAll(page); await fits(page);
      for (const crop of crops) {
        const deadline = initialTime + minutes[crop] * 60_000;
        await setTime(page, deadline - 1);
        assert.equal(await row(page, crop).getAttribute('data-state'), 'growing');
        assert.equal(await timer(page, crop).innerText(), '0:01 left');
        assert.equal(await action(page, crop).isDisabled(), true);
        const beforeEarlyClick = (await state(page)).farm;
        await action(page, crop).evaluate(button => button.click());
        assert.deepEqual((await state(page)).farm, beforeEarlyClick, 'Early harvesting is impossible even at one millisecond remaining');
        await setTime(page, deadline);
        assert.equal(await row(page, crop).getAttribute('data-state'), 'ready');
        assert.equal(await action(page, crop).innerText(), 'Harvest');
        assert.equal(await action(page, crop).isEnabled(), true);
        assert.equal(await timer(page, crop).innerText(), 'Ready · +1');
        assert.equal(await stock(page, crop).innerText(), '0', 'Readiness never automatically credits inventory');
        await fits(page);
        if (crop === 'carrot') await page.screenshot({ path: fileURLToPath(new URL(`farm-ready-${viewport.width}.png`, output)) });
        const beforeReceipt = (await state(page)).farm;
        await action(page, crop).click();
        if (await page.locator('#offline-rewards-panel').isVisible()) {
          assert.deepEqual((await state(page)).farm, beforeReceipt, 'An income receipt opened by the same click blocks the farm mutation');
          await dismissIncome(page);
          assert.equal(await action(page, crop).isEnabled(), true, 'Closing the income receipt immediately re-enables Harvest');
          await action(page, crop).click();
        }
        assert.equal((await state(page)).farm.stock[crop], 1);
        assert.equal((await state(page)).farm.plots[crop], null);
        assert.equal(await row(page, crop).getAttribute('data-state'), 'empty');
        assert.equal(await stock(page, crop).innerText(), '1');
        assert.deepEqual((await stored(page)).farm, (await state(page)).farm, 'Manual harvest credits inventory and clears the plot in one saved state');
        // The next click can replant for free, but a rapid third click cannot collect a second crop.
        await action(page, crop).evaluate(button => { button.click(); button.click(); });
        assert.equal((await state(page)).farm.stock[crop], 1);
        assert.deepEqual((await state(page)).farm.plots[crop], { plantedAt: deadline, readyAt: deadline + minutes[crop] * 60_000 });
      }
      const saved = (await state(page)).farm;
      await page.reload(); await ready(page); await dismissIncome(page);
      assert.deepEqual((await state(page)).farm, saved, 'Stocks and replanted timestamps survive reload without another harvest');
      await openFarm(page); await fits(page);
      await close(page); await page.locator('#open-profile').click();
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).farm, saved, 'The first reset click only asks for confirmation');
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).farm, emptyFarm);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm, emptyFarm);
    });

    await scenario('offline-ready-and-growing', viewport, fixture(), async page => {
      await openFarm(page); await plantAll(page);
      const planted = (await state(page)).farm;
      await setTime(page, initialTime + 12 * 60_000);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm, planted, 'Loading after absence updates no crop inventory or planting timestamps');
      await dismissIncome(page); await openFarm(page);
      assert.equal(await row(page, 'carrot').getAttribute('data-state'), 'ready');
      assert.equal(await timer(page, 'potato').innerText(), '3:00 left');
      assert.equal(await timer(page, 'pumpkin').innerText(), '18:00 left');
      assert.deepEqual((await state(page)).farm.stock, emptyFarm.stock);
      await setTime(page, initialTime + 45 * 60_000);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm.stock, emptyFarm.stock, 'Even a long offline absence never auto-harvests');
      await dismissIncome(page); await openFarm(page);
      for (const crop of crops) {
        assert.equal(await row(page, crop).getAttribute('data-state'), 'ready');
        await action(page, crop).click();
      }
      assert.deepEqual((await state(page)).farm.stock, { carrot: 1, potato: 1, pumpkin: 1 });
      assert.deepEqual((await state(page)).farm.plots, emptyFarm.plots);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm.stock, { carrot: 1, potato: 1, pumpkin: 1 });
    });

    await scenario('battle-speed-independent', viewport, fixture(), async page => {
      await page.locator('#start-wave').click(); await openFarm(page);
      await action(page, 'carrot').click();
      const planted = (await state(page)).farm.plots.carrot;
      await close(page);
      for (let index = 0; index < BATTLE_SPEEDS.length; index++) {
        await page.locator('#battle-speed').click();
        await openFarm(page);
        assert.equal(await timer(page, 'carrot').innerText(), '5:00 left');
        assert.deepEqual((await state(page)).farm.plots.carrot, planted, 'Battle speed cannot rewrite a wall-clock growth deadline');
        await close(page);
      }
      await setTime(page, initialTime + 60_000); await openFarm(page);
      assert.equal(await timer(page, 'carrot').innerText(), '4:00 left');
      assert.deepEqual((await state(page)).farm.stock, emptyFarm.stock);
    });
  }

  await scenario('save-recovery-does-not-duplicate-harvest', { width: 320, height: 568 }, fixture({ farm: {
    plots: { carrot: { plantedAt: initialTime - 300_000, readyAt: initialTime }, potato: null, pumpkin: null },
    stock: { carrot: 0, potato: 0, pumpkin: 0 },
  } }), async page => {
    await openFarm(page);
    const savedBefore = await stored(page);
    await page.evaluate(() => window.farmStorage.failWrites(true));
    await action(page, 'carrot').click();
    await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    assert.equal((await state(page)).farm.stock.carrot, 1);
    assert.deepEqual((await stored(page)).farm, savedBefore.farm, 'Failed writing preserves the durable original crop');
    const inMemory = (await state(page)).farm;
    await page.locator('[data-farm-action]').evaluateAll(buttons => buttons.forEach(button => button.click()));
    assert.deepEqual((await state(page)).farm, inMemory, 'Recovery blocks both planting and harvesting behind its overlay');
    await page.evaluate(() => window.farmStorage.failWrites(false));
    await page.locator('#recovery-retry').click(); await ready(page);
    assert.equal((await state(page)).farm.stock.carrot, 1);
    assert.equal((await stored(page)).farm.stock.carrot, 1);
    assert.equal((await stored(page)).farm.plots.carrot, null);
    await page.reload(); await ready(page);
    assert.equal((await state(page)).farm.stock.carrot, 1);
    assert.equal((await state(page)).farm.plots.carrot, null);
  });
  console.log(JSON.stringify({ ok: true, checks, screenshots: ['farm-empty-390.png', 'farm-empty-320.png', 'farm-ready-390.png', 'farm-ready-320.png'].map(file => fileURLToPath(new URL(file, output))) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
