// Disposable mobile contexts exercise migration, slot purchases and Connect through real UI actions.
// Vite hooks freeze clocks/render loops only in memory; deployed application code stays untouched.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../../.tmp/army-progression/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
const types = ['swordsman', 'archer', 'healer', 'lancer'];
const central = ['2:0', '2:1', '2:2', '1:0', '1:1', '1:2', '3:0', '3:1', '3:2'];
const allCells = [...central, '4:2', '0:0', '4:0', '0:1', '4:1', '0:2'];
const server = await createServer({
  root, configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/army-progression/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5204, strictPort: true },
  plugins: [{ name: 'army-progression-check-hooks', enforce: 'pre', transform(code, id) {
    if (id.endsWith('/combat.ts')) return prependFunctionBody(code, 'updateBattle', 'throw new Error("Combat must not run in army UI checks");');
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    code = prependFunctionBody(code, 'tickEconomy', 'return;');
    return code + `\nwindow.armyProgressionCheck = {
      loaded: () => !!scene && !!armyScene,
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
    };`;
  } }],
});

function fixture(overrides = {}) {
  return {
    campaignVersion: 3, gold: 5000, starterSupplyGranted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    barracks: { level: 1, firstLancerPending: false },
    recruitment: { version: 2, received: { swordsman: 50, lancer: 50, archer: 0, healer: 0 } },
    units: [{ type: 'swordsman', level: 100, col: 2, row: 0 }], reserve: [],
    progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [1, 10, 201] },
    economy: { slaves: 7, treasuryUpdatedAt: now }, ...overrides,
  };
}

const legacy = fixture({
  gold: 1_000_000,
  progression: { unlockedCells: allCells, firstClears: [1, 10, 201] },
  units: allCells.map((cell, index) => {
    const [col, row] = cell.split(':').map(Number);
    return { type: types[index % types.length], level: 501 + index, col, row };
  }),
  reserve: types.map((type, index) => ({ type, level: 600 + index })),
});
const inventory = state => [...state.units, ...state.reserve].map(({ type, level }) => `${type}:${level}`).sort();
const state = page => page.evaluate(() => window.armyProgressionCheck.state());
const stored = page => page.evaluate(() => JSON.parse(window.armyCapacityStorage.raw()));

async function waitForApp(page, requireReady = true) {
  await page.waitForFunction(requireReady ? () => window.armyProgressionCheck?.ready() : () => window.armyProgressionCheck?.loaded());
  await page.evaluate(async () => { window.armyProgressionCheck.freeze(); await document.fonts.ready; });
}

async function tapCell(page, col, row) {
  const point = await page.locator('#army-map').evaluate((canvas, { col, row, field, view }) => {
    const bounds = canvas.getBoundingClientRect();
    const scale = Number(canvas.dataset.worldScale);
    return {
      x: bounds.x + Number(canvas.dataset.worldOffsetX) + (field.gridX + (col + .5) * field.cellWidth) * scale,
      y: bounds.y + (bounds.height - view.height * scale) / 2 + (field.gridY + (row + .5) * field.cellHeight - view.y) * scale,
    };
  }, { col, row, field: FIELD, view: FORMATION_VIEW });
  assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), 'canvas exposes a valid rendered transform');
  await page.touchscreen.tap(point.x, point.y);
}

async function closePanel(page, id) {
  await page.locator(`#${id} [data-close-overlay]`).click();
}

async function fits(page, selector) {
  const viewport = page.viewportSize();
  const bounds = await page.locator(selector).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
  });
  assert.ok(bounds.left >= -1 && bounds.right <= viewport.width + 1 && bounds.top >= -1 && bounds.bottom <= viewport.height + 1,
    `${selector} fits viewport: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.scrollWidth <= bounds.clientWidth + 1 && bounds.scrollHeight <= bounds.clientHeight + 1,
    `${selector} needs no scrolling: ${JSON.stringify(bounds)}`);
}

let browser;
const checks = [];
async function scenario(name, viewport, saved, check, options = {}) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const failures = [];
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.abort());
    await context.addInitScript(({ saved, key, now, options }) => {
      Date.now = () => now;
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      const seeded = '__army-progression-seeded';
      const blocked = '__army-progression-block-writes';
      if (!originalGet.call(sessionStorage, seeded)) {
        originalSet.call(localStorage, key, JSON.stringify(saved));
        originalSet.call(sessionStorage, seeded, '1');
        originalSet.call(sessionStorage, blocked, options.writeError ? '1' : '0');
      }
      Storage.prototype.setItem = function (requestedKey, value) {
        if (this === localStorage && requestedKey === key && originalGet.call(sessionStorage, blocked) === '1') {
          throw new DOMException('Intentional migration write failure', 'QuotaExceededError');
        }
        return originalSet.call(this, requestedKey, value);
      };
      window.armyCapacityStorage = {
        raw: () => originalGet.call(localStorage, key),
        failWrites: fail => originalSet.call(sessionStorage, blocked, fail ? '1' : '0'),
      };
    }, { saved, key, now, options });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => failures.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith('http://127.0.0.1:5204/') && response.status() >= 400) {
        failures.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      if (request.url().startsWith('http://127.0.0.1:5204/') && request.failure()?.errorText !== 'net::ERR_ABORTED') {
        failures.push(`${request.failure()?.errorText}: ${request.url()}`);
      }
    });
    await page.goto('http://127.0.0.1:5204/');
    await waitForApp(page, !options.writeError);
    const screenshot = suffix => page.screenshot({ path: fileURLToPath(new URL(`${name}-${suffix}-${viewport.width}x${viewport.height}.png`, output)) });
    await check(page, screenshot);
    assert.deepEqual(failures, [], `${name}: browser or local asset errors`);
    checks.push(`${name} ${viewport.width}x${viewport.height}`);
    console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`${name}-FAILED-${viewport.width}x${viewport.height}.png`, output)) });
    throw error;
  } finally {
    await context.close();
  }
}

try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const viewport of [{ width: 320, height: 640 }, { width: 390, height: 700 }]) {
    await scenario('legacy-migration', viewport, legacy, async (page, screenshot) => {
      const current = await state(page);
      assert.equal(current.gold, 1_007_750, 'all excess tile investment is refunded above the old wallet restore cap');
      assert.equal(current.units.length, 8);
      assert.equal(current.reserve.length, 11);
      assert.deepEqual(current.progression.unlockedCells, central.slice(0, 8));
      assert.deepEqual(current.progression.firstClears, legacy.progression.firstClears);
      assert.deepEqual(inventory(current), inventory(legacy));
      assert.equal(new Set([...current.units, ...current.reserve].map(unit => unit.id)).size, 19);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
      assert.equal(await page.locator('#slot-refund-amount').innerText(), '+7750');
      assert.match(await page.locator('#returned-fighters-note').innerText(), /7 fighters returned/);
      await fits(page, '#offline-rewards-panel .offline-rewards-card');
      await screenshot('receipt');
      assert.deepEqual(await stored(page), current, 'migration and receipt are saved as one snapshot');

      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 1_007_750, 'reload before acknowledging preserves money without a second credit');
      assert.deepEqual(inventory(await state(page)), inventory(legacy));
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
      assert.equal(await page.locator('#slot-refund-amount').innerText(), '+7750');
      await page.locator('#collect-offline-rewards').click();
      assert.equal((await state(page)).gold, 1_007_750, 'Continue only acknowledges the receipt');
      assert.deepEqual((await state(page)).offlineRewards, { gold: 0, slaves: 0, slotRefund: 0, returnedFighters: 0, closedCells: 0, forgeRefund: 0 });
      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 1_007_750);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      assert.deepEqual(inventory(await state(page)), inventory(legacy));

      await page.locator('#open-barracks').click();
      for (const type of types) {
        const unit = (await state(page)).reserve.find(fighter => fighter.type === type && fighter.level >= 600);
        const image = page.locator(`[data-barracks-unit-id="${unit.id}"] img`);
        await image.evaluate(img => img.decode());
        assert.match(await image.getAttribute('src'), new RegExp(`${type}-black-art\\.(?:png|webp)`));
        assert.equal(await image.evaluate(img => img.complete && img.naturalWidth > 0), true);
      }
      await fits(page, '#barracks-panel .menu-card');
      await screenshot('black-reserve');
      await closePanel(page, 'barracks-panel');
      await screenshot('eight-cell-formation');
    });

    await scenario('barracks-side-capacity', viewport, fixture({
      barracks: { level: 2, firstLancerPending: false },
      recruitment: { version: 2, received: { swordsman: 225, archer: 15 } },
      progression: { unlockedCells: central, firstClears: [1] },
    }), async (page, screenshot) => {
      await tapCell(page, 4, 2);
      assert.match(await page.locator('#selection-panel').innerText(), /Requires Mercenaries III/);
      assert.equal(await page.locator('[data-action="unlock-cell"]').count(), 0);
      assert.equal((await state(page)).gold, 5000);
      assert.equal((await state(page)).progression.unlockedCells.length, 9);
      await closePanel(page, 'unit-panel');
      await tapCell(page, 0, 0);
      assert.match(await page.locator('#selection-panel').innerText(), /Requires Mercenaries III/);
      assert.equal(await page.locator('[data-action="unlock-cell"]').count(), 0);
      await fits(page, '#unit-panel .menu-card');
      await screenshot('third-tier-gate');
      await page.locator('[data-action="barracks-info"]').click();
      assert.equal(await page.locator('#market-info-panel').isVisible(), true, 'tile gate links directly to the Mercenaries III upgrade');
      assert.equal(await page.locator('#mercenaries-upgrade-detail').isVisible(), true);
      assert.equal(await page.locator('#mercenaries-upgrade-tier').innerText(), 'Mercenaries II → III');
      assert.equal(await page.locator('#mercenaries-required-gold').innerText(), '5,000 / 2,000');
      await page.locator('#barracks-start-upgrade').click();
      assert.equal((await state(page)).barracks.level, 2);
      assert.equal((await state(page)).gold, 3000);
      await page.locator('#barracks-finish-upgrade').click();
      assert.equal((await state(page)).barracks.level, 3);
      assert.equal((await state(page)).gold, 2700);
      assert.equal((await state(page)).progression.unlockedCells.length, 9, 'upgrade gives permission; it does not give a free tile');
      await closePanel(page, 'market-info-panel');
      await tapCell(page, 0, 0);
      assert.match(await page.locator('[data-action="unlock-cell"]').innerText(), /550 gold/);
      await page.locator('[data-action="unlock-cell"]').click();
      assert.equal((await state(page)).gold, 2150);
      assert.equal((await state(page)).progression.unlockedCells.length, 10);
      await closePanel(page, 'unit-panel');
      await tapCell(page, 0, 1);
      assert.match(await page.locator('#selection-panel').innerText(), /Requires Mercenaries IV/);
      assert.equal(await page.locator('[data-action="unlock-cell"]').count(), 0);
      assert.equal(await page.locator('[data-action="barracks-info"]').count(), 1);
      await screenshot('maximum-side-quota');
      await closePanel(page, 'unit-panel');
      await page.locator('#open-buildings').click();
      assert.equal(await page.locator('#tab-army-space, #choose-cell').count(), 0);
      assert.equal(await page.locator('#tab-forge').isVisible(), true);
      await closePanel(page, 'buildings-panel');
      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 2150);
      assert.equal((await state(page)).progression.unlockedCells.length, 10);
      assert.equal((await state(page)).progression.unlockedCells.filter(cell => cell[0] === '0' || cell[0] === '4').length, 1);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
    });

    await scenario('ninth-central-cell', viewport, fixture({
      progression: { unlockedCells: central, firstClears: [1] },
      units: [{ type: 'swordsman', level: 100, col: 2, row: 0 },
        { type: 'archer', level: 53, col: 3, row: 2 }],
    }), async (page, screenshot) => {
      assert.equal((await state(page)).gold, 5400);
      assert.deepEqual((await state(page)).progression.unlockedCells, central.slice(0, 8));
      assert.equal((await state(page)).units.length, 1);
      const returned = (await state(page)).reserve[0];
      assert.equal(returned.type, 'archer');
      assert.equal(returned.level, 53);
      assert.equal(await page.locator('#slot-refund-amount').innerText(), '+400');
      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 5400, 'a saved ninth-cell refund cannot be credited again');
      assert.deepEqual((await state(page)).reserve, [returned]);
      await page.locator('#collect-offline-rewards').click();
      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 5400);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      await tapCell(page, 3, 2);
      assert.match(await page.locator('#selection-panel').innerText(), /Requires Mercenaries II/);
      assert.equal(await page.locator('[data-action="unlock-cell"]').count(), 0);
      await screenshot('second-tier-gate');
      await page.locator('[data-action="barracks-info"]').click();
      await page.locator('#barracks-start-upgrade').click();
      await page.locator('#barracks-finish-upgrade').click();
      assert.equal((await state(page)).barracks.level, 2);
      assert.equal((await state(page)).gold, 5100);
      assert.equal((await state(page)).progression.unlockedCells.length, 8, 'upgrade only permits the ninth purchase');
      await closePanel(page, 'market-info-panel');
      await tapCell(page, 3, 2);
      assert.match(await page.locator('[data-action="unlock-cell"]').innerText(), /400 gold/);
      await page.locator('[data-action="unlock-cell"]').click();
      assert.equal((await state(page)).gold, 4700);
      assert.equal((await state(page)).progression.unlockedCells.length, 9);
      assert.deepEqual((await state(page)).reserve, [returned], 'repurchasing a tile does not duplicate or redeploy its former fighter');
      await closePanel(page, 'unit-panel');
      await tapCell(page, 4, 2);
      assert.match(await page.locator('#selection-panel').innerText(), /Requires Mercenaries III/);
      assert.equal(await page.locator('[data-action="unlock-cell"]').count(), 0);
      await page.reload(); await waitForApp(page);
      assert.equal((await state(page)).gold, 4700);
      assert.equal((await state(page)).progression.unlockedCells.length, 9);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
    });

    await scenario('personal-connect', viewport, fixture({
      reserve: [{ type: 'swordsman', level: 150 }, { type: 'swordsman', level: 250 }],
    }), async (page, screenshot) => {
      const before = await state(page);
      for (const [sourceId, expectedLevel, palette] of [[2, 250, 'yellow'], [3, 500, 'black']]) {
        await page.locator('#open-barracks').click();
        const connect = page.locator(`[data-barracks-connect-id="${sourceId}"]`);
        assert.match(await connect.innerText(), /Connect/);
        assert.equal(await connect.isEnabled(), true);
        await connect.click();
        await tapCell(page, 2, 0);
        await waitForApp(page);
        const after = await state(page);
        assert.equal(after.units[0].level, expectedLevel);
        assert.equal(after.units.length, 1);
        assert.equal(after.reserve.length, sourceId === 2 ? 1 : 0);
        assert.equal(after.gold, before.gold);
        assert.equal(after.economy.slaves, before.economy.slaves);
        assert.deepEqual(after.recruitment, before.recruitment, 'personal Connect does not grant recruitment experience');
        await tapCell(page, 2, 0);
        const image = page.locator('#selection-panel .selected-portrait');
        await image.evaluate(img => img.decode());
        assert.match(await image.getAttribute('src'), new RegExp(`swordsman-${palette}-art\\.png`));
        assert.match(await page.locator('#selection-panel').innerText(), new RegExp(`Lv\\. ${expectedLevel}`));
        await fits(page, '#unit-panel .menu-card');
        await screenshot(`level-${expectedLevel}`);
        await closePanel(page, 'unit-panel');
      }
      await page.reload(); await waitForApp(page);
      const reloaded = await state(page);
      assert.equal(reloaded.units[0].level, 500);
      assert.equal(reloaded.reserve.length, 0);
      assert.equal(reloaded.gold, before.gold);
      assert.deepEqual(reloaded.recruitment, before.recruitment);
      await tapCell(page, 2, 0);
      assert.match(await page.locator('#selection-panel .selected-portrait').getAttribute('src'), /swordsman-black-art\.png/);
    });
  }

  await scenario('migration-save-retry', { width: 320, height: 640 }, legacy, async (page, screenshot) => {
    assert.equal(await page.locator('#recovery-panel').isVisible(), true);
    assert.match(await page.locator('#recovery-description').innerText(), /not saved/);
    assert.deepEqual(await stored(page), legacy, 'failed migration write keeps the original saved army and wallet');
    assert.equal((await state(page)).gold, 1_007_750);
    assert.equal((await state(page)).units.length, 8);
    assert.deepEqual(inventory(await state(page)), inventory(legacy));
    assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false, 'the receipt waits until the migration is saved');
    await screenshot('blocked');
    await page.evaluate(() => window.armyCapacityStorage.failWrites(false));
    await page.locator('#recovery-retry').click();
    await waitForApp(page);
    assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
    assert.equal((await stored(page)).gold, 1_007_750);
    assert.equal((await stored(page)).progression.unlockedCells.length, 8);
    await page.reload(); await waitForApp(page);
    assert.equal((await state(page)).gold, 1_007_750);
    assert.deepEqual(inventory(await state(page)), inventory(legacy));
    assert.equal(await page.locator('#slot-refund-amount').innerText(), '+7750');
    await page.locator('#collect-offline-rewards').click();
    assert.equal((await state(page)).gold, 1_007_750);
  }, { writeError: true });
  console.log(JSON.stringify({ ok: true, checks, screenshots: fileURLToPath(output) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
