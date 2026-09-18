// Disposable browser integration checks. Only this Vite server exposes test hooks.
// PLAYWRIGHT_MODULE may point to an installed Playwright entry file.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const key = 'brotd-infinity:campaign:v2';
const fixture = {
  campaignVersion: 3, gold: 250, starterSupplyGranted: true,
  autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
  units: [{ type: 'swordsman', level: 10, col: 2, row: 0 },
    { type: 'archer', level: 10, col: 2, row: 1 }, { type: 'healer', level: 10, col: 2, row: 2 }],
  reserve: [{ type: 'swordsman', level: 3 }, { type: 'archer', level: 7 }],
  progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
  economy: { slaves: 7, treasuryLevel: 1, treasuryProgress: 0, captures: 4, captureCooldown: 30 },
  barracks: { level: 2, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending: true },
  hero: { xp: 300, highestWave: 8, talents: { heal_power: 1 } },
};

const server = await createServer({
  root, configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/storage-recovery-vite', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'storage-recovery-checks', transform(code, id) {
    if (!id.endsWith('/main.mjs')) return;
    return code + `\nwindow.storageCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      loaded: () => !!scene && !!armyScene,
      snapshot: () => JSON.parse(JSON.stringify(saveSnapshot())),
      status: () => ({ storage: saveStorage.status, recovering: isRecovering(),
        battle: battle && { phase: battle.phase, elapsed: battle.elapsed,
          kills: battle.kills, reward: battle.reward, total: battle.total } }),
      save,
      income: seconds => { economyLastTick = performance.now() - seconds * 1000; tickEconomy(); },
      stopEconomyTimer: () => clearInterval(economyTimer),
      stopFrames,
    };`;
  } }],
});

let browser, baseUrl;
const checks = [];
const ready = page => page.waitForFunction(() => window.storageCheck?.ready(), null, { timeout: 30000 });
const loaded = page => page.waitForFunction(() => window.storageCheck?.loaded(), null, { timeout: 30000 });
const raw = page => page.evaluate(() => window.storageFaults.raw());
const snapshot = page => page.evaluate(() => window.storageCheck.snapshot());
const status = page => page.evaluate(() => window.storageCheck.status());

async function fitAt320(page) {
  const metrics = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const ids = ['app', 'recovery-panel'];
    const boxes = ids.map(id => {
      const element = document.getElementById(id), rect = element.getBoundingClientRect();
      return { id, hidden: element.hidden, left: rect.left, right: rect.right };
    });
    const panel = document.getElementById('recovery-panel');
    const card = panel.querySelector('.recovery-card');
    return { width, documentWidth: document.documentElement.scrollWidth, boxes,
      card: panel.hidden ? null : { clientWidth: card.clientWidth, scrollWidth: card.scrollWidth } };
  });
  assert.equal(metrics.width, 320);
  assert.ok(metrics.documentWidth <= 321, JSON.stringify(metrics));
  for (const box of metrics.boxes.filter(box => !box.hidden)) {
    assert.ok(box.left >= -1 && box.right <= 321, JSON.stringify(metrics));
  }
  if (metrics.card) assert.ok(metrics.card.scrollWidth <= metrics.card.clientWidth + 1, JSON.stringify(metrics));
}

async function inPage(name, options, check) {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
  const errors = [];
  try {
    await context.route('https://telegram.org/**', route => route.abort());
    let blockHero = options.blockHero === true;
    if (blockHero) await context.route('**/assets/st-knihor/st-knihor-down.webp*', route => blockHero ? route.abort() : route.continue());
    await context.addInitScript(({ key, fixture, options }) => {
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      const seeded = '__storage-recovery-seeded';
      const readFailureKey = '__storage-recovery-read-failure';
      const writeFailureKey = '__storage-recovery-write-failure';
      if (!originalGet.call(sessionStorage, seeded)) {
        const initial = options.raw ?? JSON.stringify({ ...fixture, offlineRewards: options.offlineRewards,
          economy: { ...fixture.economy, treasuryUpdatedAt: Date.now() } });
        originalSet.call(localStorage, key, initial);
        originalSet.call(sessionStorage, seeded, '1');
        originalSet.call(sessionStorage, readFailureKey, options.readError ? '1' : '0');
        originalSet.call(sessionStorage, writeFailureKey, '0');
      }
      let writes = 0, writeAttempts = 0;
      const writtenValues = [];
      Storage.prototype.getItem = function (requestedKey) {
        if (this === localStorage && requestedKey === key
          && originalGet.call(sessionStorage, readFailureKey) === '1') {
          throw new DOMException('Test storage read unavailable', 'SecurityError');
        }
        return originalGet.call(this, requestedKey);
      };
      Storage.prototype.setItem = function (requestedKey, value) {
        if (this === localStorage && requestedKey === key) {
          writeAttempts += 1;
          if (originalGet.call(sessionStorage, writeFailureKey) === '1') {
            throw new DOMException('Test storage write unavailable', 'QuotaExceededError');
          }
          writes += 1;
          writtenValues.push(value);
        }
        return originalSet.call(this, requestedKey, value);
      };
      window.storageFaults = {
        raw: () => originalGet.call(localStorage, key),
        counters: () => ({ writes, writeAttempts }),
        writtenValues: () => writtenValues.slice(),
        readError: value => originalSet.call(sessionStorage, readFailureKey, value ? '1' : '0'),
        writeError: value => originalSet.call(sessionStorage, writeFailureKey, value ? '1' : '0'),
      };
    }, { key, fixture, options });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    await page.goto(baseUrl);
    await check(page, { allowHero: () => { blockHero = false; } });
    await fitAt320(page);
    assert.deepEqual(errors, [], `${name}: uncaught browser errors`);
    checks.push(name);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}

try {
  // Vite's listen(0) normalizes zero to 5173; the exposed HTTP server preserves
  // port zero and still runs Vite's initialization before it starts listening.
  const listening = once(server.httpServer, 'listening');
  server.httpServer.listen(0, '127.0.0.1');
  await listening;
  baseUrl = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });

  await inPage('unread existing progress stays intact; retry restores it through reload', { readError: true }, async page => {
    await loaded(page);
    const before = await raw(page);
    assert.equal((await status(page)).storage, 'read-error');
    assert.equal(await page.locator('#recovery-panel').isVisible(), true);
    assert.match(await page.locator('#recovery-description').textContent(), /could not be loaded/i);
    assert.equal(await page.locator('#start-wave').evaluate(element => !!element.closest('[inert]')), true);
    await fitAt320(page);
    await page.evaluate(() => { window.storageCheck.income(59); window.storageCheck.save(); });
    await page.waitForTimeout(1100); // Includes the real economy interval while the recovery panel is open.
    assert.equal(await raw(page), before);
    assert.deepEqual(await page.evaluate(() => window.storageFaults.counters()), { writes: 0, writeAttempts: 0 });
    await page.evaluate(() => window.storageFaults.readError(false));
    await Promise.all([page.waitForEvent('load'), page.locator('#recovery-retry').click()]);
    await ready(page);
    assert.equal(await page.locator('#recovery-panel').isVisible(), false);
    const restored = await snapshot(page);
    assert.equal(restored.gold, fixture.gold);
    assert.deepEqual(restored.units.map(({ id, ...unit }) => unit), fixture.units);
    assert.deepEqual(restored.reserve.map(({ id, ...unit }) => unit), fixture.reserve);
    assert.equal(restored.economy.slaves, fixture.economy.slaves);
    assert.deepEqual(restored.barracks, fixture.barracks);
    assert.equal(restored.hero.xp, fixture.hero.xp);
    assert.equal(restored.hero.talents.heal_power, 1);
  });

  await inPage('corrupt save survives timers and retry; only the second reset click replaces it', { raw: '{damaged-json' }, async page => {
    await loaded(page);
    assert.equal((await status(page)).storage, 'corrupt');
    assert.match(await page.locator('#recovery-description').textContent(), /damaged/i);
    await fitAt320(page);
    await page.evaluate(() => { window.storageCheck.income(59); window.storageCheck.save(); });
    await page.waitForTimeout(1100);
    await page.locator('#recovery-retry').click();
    assert.equal(await raw(page), '{damaged-json');
    assert.equal(await page.locator('#recovery-panel').isVisible(), true);
    assert.deepEqual(await page.evaluate(() => window.storageFaults.counters()), { writes: 0, writeAttempts: 0 });
    await page.locator('#recovery-reset').click();
    assert.equal(await raw(page), '{damaged-json');
    assert.equal(await page.locator('#recovery-reset-confirmation').isVisible(), true);
    assert.equal(await page.locator('#recovery-reset').textContent(), 'Confirm reset');
    await fitAt320(page);
    await page.locator('#recovery-reset').click();
    await ready(page);
    const reset = JSON.parse(await raw(page));
    assert.equal(reset.gold, 125);
    assert.equal(reset.economy.slaves, 3);
    assert.deepEqual(reset.units, []);
    assert.deepEqual(reset.reserve, []);
    assert.equal(reset.barracks.level, 1);
    assert.equal(reset.hero.xp, 0);
    assert.equal(await page.locator('#recovery-panel').isVisible(), false);
  });

  await inPage('failed combat reward save pauses, retries once without loss, then resumes', {}, async page => {
    await ready(page);
    // Isolate the combat reward from passive-income/autosave writes; battle updates stay real.
    await page.evaluate(() => window.storageCheck.stopEconomyTimer());
    const before = await snapshot(page);
    const savedBefore = await raw(page);
    await page.locator('#start-wave').click();
    await page.waitForFunction(() => window.storageCheck.status().battle?.elapsed > 0);
    await page.evaluate(() => window.storageFaults.writeError(true));
    await page.waitForFunction(() => window.storageCheck.status().storage === 'write-error', null, { timeout: 30000 });
    const failed = await status(page);
    const pending = await snapshot(page);
    assert.equal(failed.battle.phase, 'running');
    assert.ok(failed.battle.kills > 0 && failed.battle.kills < failed.battle.total);
    assert.equal(pending.gold, before.gold + failed.battle.reward);
    assert.equal(await raw(page), savedBefore);
    assert.match(await page.locator('#recovery-description').textContent(), /Keep this game open and retry/i);
    assert.equal(await page.locator('#recovery-panel').isVisible(), true);
    assert.equal(await page.locator('#recovery-reset').isVisible(), false);
    await fitAt320(page);
    await page.waitForTimeout(1200);
    assert.deepEqual((await status(page)).battle, failed.battle, 'battle must remain frozen during recovery');
    assert.deepEqual(await snapshot(page), pending, 'pending reward must not drift while saving is blocked');
    await page.locator('#recovery-retry').click();
    assert.equal(await page.locator('#recovery-panel').isVisible(), true, 'a failed retry stays visible');
    assert.equal(await raw(page), savedBefore);
    const writesBeforeRecovery = await page.evaluate(() => window.storageFaults.counters().writes);
    await page.evaluate(() => window.storageFaults.writeError(false));
    await page.locator('#recovery-retry').click();
    await ready(page);
    const restoredSave = JSON.parse(await page.evaluate(index => window.storageFaults.writtenValues()[index], writesBeforeRecovery));
    assert.deepEqual(restoredSave, pending, 'retry must persist the current pending snapshot exactly');
    assert.equal(await page.locator('#recovery-panel').isVisible(), false);
    await page.waitForFunction(elapsed => window.storageCheck.status().battle.elapsed > elapsed + 0.2, failed.battle.elapsed);
    // Freeze only after proving real resumption, so a new kill cannot race the reload assertions.
    await page.evaluate(() => window.storageCheck.stopFrames());
    const resumed = await status(page);
    assert.equal((await snapshot(page)).gold, before.gold + resumed.battle.reward, 'resume cannot pay the already recorded kill twice');
    const beforeReload = await snapshot(page);
    await page.reload();
    await ready(page);
    const reloaded = await snapshot(page);
    assert.equal(reloaded.gold, beforeReload.gold);
    assert.deepEqual(reloaded.units, beforeReload.units);
    assert.deepEqual(reloaded.reserve, beforeReload.reserve);
    assert.deepEqual(reloaded.hero, beforeReload.hero);
    assert.deepEqual(reloaded.barracks, beforeReload.barracks);
    assert.equal((await status(page)).battle, null, 'reload returns to preparation with earned resources intact');
  });

  await inPage('normal reload preserves the roster, personal levels and wallet', {}, async page => {
    await ready(page);
    const before = await snapshot(page);
    await page.reload();
    await ready(page);
    const after = await snapshot(page);
    assert.deepEqual(after.units, before.units);
    assert.deepEqual(after.reserve, before.reserve);
    assert.equal(after.gold, before.gold);
    assert.equal(after.economy.slaves, before.economy.slaves);
    assert.equal(before.hero.xp, fixture.hero.xp);
    assert.equal(before.hero.highestWave, fixture.hero.highestWave);
    assert.equal(before.hero.talents.heal_power, 1);
    assert.deepEqual(before.barracks, fixture.barracks);
    assert.deepEqual(after.hero, before.hero);
    assert.deepEqual(after.barracks, before.barracks);
    assert.equal((await status(page)).storage, 'ready');
  });

  await inPage('offline receipt waits for assets; failed acknowledgement recovers without an inert deadlock',
    { blockHero: true, offlineRewards: { gold: 7, slaves: 2 } }, async (page, controls) => {
      await loaded(page);
      await page.waitForFunction(() => /could not be loaded/i.test(document.getElementById('recovery-description').textContent));
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      assert.equal(await page.locator('#recovery-retry').evaluate(element => !!element.closest('[inert]')), false);
      await fitAt320(page);
      controls.allowHero();
      await page.locator('#recovery-retry').click();
      await ready(page);
      await page.locator('#offline-rewards-panel').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#collect-offline-rewards').evaluate(element => !!element.closest('[inert]')), false);
      const before = await snapshot(page);
      assert.deepEqual(before.offlineRewards, { gold: 7, slaves: 2 });
      await page.evaluate(() => window.storageFaults.writeError(true));
      await page.locator('#collect-offline-rewards').click();
      await page.locator('#recovery-panel').waitFor({ state: 'visible' });
      assert.equal((await status(page)).storage, 'write-error');
      assert.equal(await page.locator('#recovery-retry').evaluate(element => !!element.closest('[inert]')), false);
      await page.evaluate(() => window.storageFaults.writeError(false));
      await page.locator('#recovery-retry').click();
      await ready(page);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      const after = await snapshot(page);
      assert.deepEqual(after.offlineRewards, { gold: 0, slaves: 0 });
      assert.equal(after.gold, before.gold, 'acknowledging an already-paid receipt cannot pay it again');
      assert.equal(after.economy.slaves, before.economy.slaves);
      assert.deepEqual(JSON.parse(await raw(page)).offlineRewards, { gold: 0, slaves: 0 });
      assert.equal(await page.locator('#open-buildings').evaluate(element => !!element.closest('[inert]')), false);
      await page.locator('#open-buildings').click();
      await page.locator('#buildings-panel').waitFor({ state: 'visible' });
      await page.locator('#buildings-panel [data-close-overlay]').click();
      assert.equal(await page.locator('#army-map').evaluate(element => !!element.closest('[inert]')), false);
    });

  console.log(JSON.stringify({ passed: checks.length, viewport: '320x700', checks }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
