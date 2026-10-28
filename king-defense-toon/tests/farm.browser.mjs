// Isolated mobile saves and a controllable wall clock exercise automatic farming.
// The frame loop and interval are frozen; actual economy, persistence and UI actions remain intact.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { SAVE_SCHEMA_VERSION } from '../campaign-save.ts';
import { BATTLE_SPEEDS } from '../battle-speed.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const initialTime = 1800000000000;
const emptyStock = { carrot: 0, potato: 0, pumpkin: 0 };
const freshFarm = time => ({ version: 2, level: 1, plots: { carrot: { plantedAt: time, readyAt: time + 300_000 }, potato: null, pumpkin: null }, stock: { ...emptyStock } });
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
    campaignVersion: 3, gold: 2000, starterSupplyGranted: true, marketHintCompleted: true,
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
    for (const element of card.querySelectorAll('.farm-row, .farm-copy, .farm-crop-heading, .farm-action, .farm-upgrade-copy, .farm-upgrade-action, .building-tab')) {
      if (!element.getClientRects().length) continue;
      if (element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className}: horizontal overflow`);
      if (element.matches('.farm-action, .farm-upgrade-action') && element.getBoundingClientRect().height < 44) bad.push('farm action touch target below 44px');
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Farm and all six building tabs fit the small screen');
}

async function freshPlots(page, time = initialTime) {
  assert.deepEqual((await state(page)).farm, freshFarm(time));
  assert.equal(await row(page, 'carrot').isVisible(), true);
  for (const crop of ['potato', 'pumpkin']) assert.equal(await row(page, crop).isVisible(), false);
  assert.equal(await action(page, 'carrot').innerText(), 'Collect');
  assert.equal(await action(page, 'carrot').isDisabled(), true);
  assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 5:00');
}
async function farmClick(page, locator) {
  const before = (await state(page)).farm;
  await locator.click();
  if (await page.locator('#offline-rewards-panel').isVisible()) {
    assert.deepEqual((await state(page)).farm, before, 'The income receipt blocks the same click from changing the farm');
    await dismissIncome(page);
    await locator.click();
  }
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
    await scenario('fresh-game-six-tabs', viewport, null, async page => {
      await openFarm(page); await freshPlots(page);
      assert.equal(await page.locator('[data-farm-upgrade]').isDisabled(), true);
      const tabs = page.locator('#buildings-tabs [role="tab"]');
      assert.deepEqual(await tabs.evaluateAll(nodes => nodes.map(node => node.id)), ['tab-treasury', 'tab-market', 'tab-forge', 'tab-farm', 'tab-kitchen', 'tab-capitol']);
      await page.locator('#tab-farm').focus();
      for (const [key, id] of [['ArrowRight', 'tab-kitchen'], ['ArrowRight', 'tab-capitol'], ['ArrowRight', 'tab-treasury'], ['End', 'tab-capitol'], ['Home', 'tab-treasury'], ['ArrowRight', 'tab-market'], ['ArrowRight', 'tab-forge'], ['ArrowRight', 'tab-farm']]) {
        await page.keyboard.press(key);
        assert.equal(await page.locator('#' + id).getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator('#' + id).evaluate(node => node === document.activeElement), true);
        assert.equal(await page.locator('#buildings-tabs [tabindex="0"]').count(), 1);
      }
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL('farm-level1-' + viewport.width + '.png', output)) });
    });
    await scenario('collect-upgrade-reload-reset', viewport, fixture(), async page => {
      await openFarm(page); await freshPlots(page);
      const before = unrelated(await state(page));
      await setTime(page, initialTime + 299_999);
      assert.equal(await action(page, 'carrot').isDisabled(), true);
      assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 0:01');
      await action(page, 'carrot').evaluate(button => button.click());
      assert.deepEqual((await state(page)).farm.stock, emptyStock);
      await setTime(page, initialTime + 300_000);
      assert.equal(await action(page, 'carrot').innerText(), 'Collect 1');
      await farmClick(page, action(page, 'carrot'));
      assert.equal(await stock(page, 'carrot').innerText(), '1');
      assert.equal(await action(page, 'carrot').isDisabled(), true);
      assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 5:00');
      await action(page, 'carrot').evaluate(button => { button.click(); button.click(); });
      assert.equal((await state(page)).farm.stock.carrot, 1);
      assert.deepEqual((await stored(page)).farm, (await state(page)).farm);
      assert.deepEqual((await state(page)).units, before.units);
      assert.deepEqual((await state(page)).reserve, before.reserve);
      const upgrade = page.locator('[data-farm-upgrade]'), gold = (await state(page)).gold;
      await upgrade.click();
      assert.equal((await state(page)).gold, gold - 500);
      assert.equal((await state(page)).farm.level, 2);
      assert.equal(await row(page, 'potato').isVisible(), true);
      assert.equal(await row(page, 'pumpkin').isVisible(), false);
      assert.equal(await row(page, 'carrot').locator('[data-farm-available]').innerText(), '0 / 20 ready');
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL('farm-level2-' + viewport.width + '.png', output)) });
      await upgrade.click();
      assert.equal((await state(page)).gold, gold - 2000);
      assert.equal((await state(page)).farm.level, 3);
      assert.equal(await row(page, 'pumpkin').isVisible(), true);
      assert.equal(await upgrade.isVisible(), false);
      await fits(page);
      const saved = (await state(page)).farm;
      await page.reload(); await ready(page); await dismissIncome(page);
      assert.deepEqual((await state(page)).farm, saved);
      await openFarm(page); await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL('farm-level3-' + viewport.width + '.png', output)) });
      await close(page); await page.locator('#open-profile').click();
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).farm, saved, 'First reset click only asks for confirmation');
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).farm, freshFarm(initialTime + 300_000));
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm, freshFarm(initialTime + 300_000));
    });
    await scenario('offline-caps-and-upgrade-no-backpay', viewport, fixture(), async page => {
      await openFarm(page);
      const later = initialTime + 24 * 3600_000;
      await setTime(page, later);
      await page.reload(); await ready(page); await dismissIncome(page); await openFarm(page);
      assert.equal(await row(page, 'carrot').getAttribute('data-state'), 'full');
      assert.equal(await action(page, 'carrot').innerText(), 'Collect 10');
      assert.deepEqual((await state(page)).farm.stock, emptyStock);
      await page.locator('[data-farm-upgrade]').click();
      assert.equal(await action(page, 'carrot').innerText(), 'Collect 10');
      assert.equal(await row(page, 'carrot').locator('[data-farm-available]').innerText(), '10 / 20 ready');
      assert.equal(await action(page, 'potato').isDisabled(), true);
      assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 5:00');
      await setTime(page, later + 24 * 3600_000);
      await page.reload(); await ready(page); await dismissIncome(page); await openFarm(page);
      for (const crop of ['carrot', 'potato']) {
        assert.equal(await action(page, crop).innerText(), 'Collect 20');
        await farmClick(page, action(page, crop));
        assert.equal((await state(page)).farm.stock[crop], 20);
        assert.equal(await action(page, crop).isDisabled(), true);
      }
      await page.reload(); await ready(page); await dismissIncome(page);
      assert.deepEqual((await state(page)).farm.stock, { carrot: 20, potato: 20, pumpkin: 0 });
    });
    await scenario('battle-speed-independent', viewport, fixture(), async page => {
      const plot = (await state(page)).farm.plots.carrot;
      await page.locator('#start-wave').click();
      for (let index = 0; index < BATTLE_SPEEDS.length; index++) {
        await page.locator('#battle-speed').click(); await openFarm(page);
        assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 5:00');
        assert.deepEqual((await state(page)).farm.plots.carrot, plot);
        await close(page);
      }
      await setTime(page, initialTime + 60_000); await openFarm(page);
      assert.equal(await timer(page, 'carrot').innerText(), 'Next +1 in 4:00');
      assert.deepEqual((await state(page)).farm.stock, emptyStock);
    });
  }
  const legacy = fixture({ saveSchemaVersion: 2, nextUnitId: 5, farm: {
    plots: { carrot: { plantedAt: initialTime - 1e9, readyAt: initialTime - 1e9 + 300_000 },
      potato: { plantedAt: initialTime - 1e9, readyAt: initialTime - 1e9 + 900_000 },
      pumpkin: { plantedAt: initialTime, readyAt: initialTime + 1800_000 } },
    stock: { carrot: 7, potato: 8, pumpkin: 9 },
  } });
  await scenario('legacy-farm-migrates-once-with-backup', { width: 320, height: 568 }, legacy, async page => {
    const farm = (await state(page)).farm;
    assert.equal(farm.level, 1);
    assert.deepEqual(farm.stock, { carrot: 7, potato: 9, pumpkin: 10 });
    const backup = await page.evaluate(({ key, schema }) => localStorage.getItem(key + ':backup:before-schema-' + schema), { key, schema: SAVE_SCHEMA_VERSION });
    assert.equal(backup, JSON.stringify(legacy));
    assert.equal((await stored(page)).saveSchemaVersion, SAVE_SCHEMA_VERSION);
    await openFarm(page);
    assert.equal(await action(page, 'carrot').innerText(), 'Collect 1');
    await page.reload(); await ready(page);
    assert.deepEqual((await state(page)).farm, farm, 'Compensation cannot repeat on reload');
  });
  for (const operation of ['harvest', 'upgrade']) {
    await scenario('save-recovery-' + operation, { width: 320, height: 568 }, fixture({ farm: freshFarm(initialTime - 300_000) }), async page => {
      await openFarm(page);
      const savedBefore = await stored(page);
      await page.evaluate(() => window.farmStorage.failWrites(true));
      await (operation === 'harvest' ? action(page, 'carrot') : page.locator('[data-farm-upgrade]')).click();
      await page.locator('#recovery-panel').waitFor({ state: 'visible' });
      const inMemory = await state(page);
      if (operation === 'harvest') assert.equal(inMemory.farm.stock.carrot, 1);
      else {
        assert.equal(inMemory.farm.level, 2);
        assert.equal(inMemory.gold, savedBefore.gold - 500);
      }
      assert.deepEqual((await stored(page)).farm, savedBefore.farm);
      await page.locator('[data-farm-action], [data-farm-upgrade]').evaluateAll(buttons => buttons.forEach(button => button.click()));
      assert.deepEqual((await state(page)).farm, inMemory.farm);
      await page.evaluate(() => window.farmStorage.failWrites(false));
      await page.locator('#recovery-retry').click(); await ready(page);
      assert.deepEqual((await stored(page)).farm, inMemory.farm, 'Retry persists the result without rerunning the command');
      assert.equal((await stored(page)).gold, inMemory.gold);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).farm, inMemory.farm);
      assert.equal((await state(page)).gold, inMemory.gold);
    });
  }
  console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
