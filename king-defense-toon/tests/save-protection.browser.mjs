// Real shared-origin Web Locks and storage events; hooks exist only in this Vite server.
// Lifecycle events are dispatched synthetically, not proof of native BFCache eligibility.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const key = 'brotd-infinity:campaign:v2';
const backupKey = `${key}:backup:before-schema-2`;
const now = 1_800_000_000_000;
const fixture = {
  saveSchemaVersion: 2, nextUnitId: 6, campaignVersion: 3, gold: 250, starterSupplyGranted: true,
  autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
  units: [{ id: 1, type: 'swordsman', level: 10, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 10, col: 2, row: 1 }, { id: 3, type: 'healer', level: 10, col: 2, row: 2 }],
  reserve: [{ id: 4, type: 'swordsman', level: 3 }, { id: 5, type: 'archer', level: 7 }],
  progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
  economy: { slaves: 7, treasuryLevel: 1, treasuryProgress: 0,
    treasuryUpdatedAt: now, captures: 4, captureCooldown: 30 },
  barracks: { level: 2, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending: true },
  hero: { xp: 300, highestWave: 8, talentVersion: 2, talents: {} },
};
const legacy = { ...fixture };
delete legacy.saveSchemaVersion;
delete legacy.nextUnitId;
const legacyRaw = `  ${JSON.stringify(legacy, null, 2)}\n`;

const server = await createServer({
  root, configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/save-protection-vite', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'save-protection-checks', transform(code, id) {
    if (id.endsWith('/campaign-state.ts')) {
      const restoration = 'const forgeMigration = restoreForge(saved.forge);';
      assert.equal(code.split(restoration).length, 2, 'expected one campaign-state restoration boundary');
      return code.replace(restoration, `${restoration}
        if (saved.triggerRestoreFailure === true) throw new Error('Injected campaign restoration failure');`);
    }
    if (!id.endsWith('/main.ts')) return;
    return code + `\nwindow.saveProtection = {
      loaded: () => !!scene && !!armyScene,
      ready: () => !!scene && !!armyScene && !isRecovering(),
      snapshot: () => JSON.parse(JSON.stringify(saveSnapshot())),
      status: () => ({ storage: saveStorage.status, session: saveSession.status,
        canWrite: saveSession.canWrite, recovering: isRecovering(), economyActive, destroyed,
        battle: battle && { phase: battle.phase, elapsed: battle.elapsed } }),
      save,
      income: seconds => { economyLastTick = performance.now() - seconds * 1000; tickEconomy(); },
      writeGold: value => { campaign.gold = value; save(); },
      resetAttempt: () => saveStorage.reset(saveSnapshot(), { confirmation: saveStorage.prepareReset() }),
      stopEconomyTimer: () => clearInterval(economyTimer),
      pauseForInactivity,
      activateGame,
    };`;
  } }],
});

let browser, baseUrl;
const checks = [];
const loaded = page => page.waitForFunction(() => window.saveProtection?.loaded(), null, { timeout: 30000 });
const ready = page => page.waitForFunction(() => window.saveProtection?.ready(), null, { timeout: 30000 });
const status = page => page.evaluate(() => window.saveProtection.status());
const snapshot = page => page.evaluate(() => window.saveProtection.snapshot());
const raw = page => page.evaluate(() => window.saveFaults.raw());
const backup = page => page.evaluate(() => window.saveFaults.backup());
const stopTimer = page => page.evaluate(() => window.saveProtection.stopEconomyTimer());

async function inContext(name, options, check) {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
  const errors = [];
  try {
    await context.route('https://telegram.org/**', route => route.abort());
    await context.route('**/__save-protection-editor', route => route.fulfill({
      contentType: 'text/html', body: '<!doctype html><title>Save test editor</title>',
    }));
    context.on('page', page => {
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push(error.stack ?? error.message));
    });
    const seed = await context.newPage();
    await seed.goto(`${baseUrl}__save-protection-editor`);
    await seed.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key, value: options.raw ?? JSON.stringify(fixture),
    });
    await seed.close();
    await context.addInitScript(({ key, backupKey, now, options }) => {
      if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
      Date.now = () => now;
      if (options.noLocks) Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      const faultKey = '__save-protection-backup-failure';
      if (get.call(sessionStorage, faultKey) === null) {
        set.call(sessionStorage, faultKey, options.backupFailure ? '1' : '0');
      }
      let campaignWrites = 0, campaignAttempts = 0, backupWrites = 0, backupAttempts = 0;
      let writeFailure = false;
      Storage.prototype.setItem = function (requested, value) {
        if (this === localStorage && requested === backupKey) {
          backupAttempts += 1;
          if (get.call(sessionStorage, faultKey) === '1') {
            throw new DOMException('Injected backup quota failure', 'QuotaExceededError');
          }
          backupWrites += 1;
        }
        if (this === localStorage && requested === key) {
          campaignAttempts += 1;
          if (writeFailure) throw new DOMException('Injected campaign quota failure', 'QuotaExceededError');
          campaignWrites += 1;
        }
        return set.call(this, requested, value);
      };
      window.saveFaults = {
        raw: () => get.call(localStorage, key),
        backup: () => get.call(localStorage, backupKey),
        counters: () => ({ campaignWrites, campaignAttempts, backupWrites, backupAttempts }),
        backupFailure: enabled => set.call(sessionStorage, faultKey, enabled ? '1' : '0'),
        writeFailure: enabled => { writeFailure = enabled; },
      };
    }, { key, backupKey, now, options });

    const openGame = async (keepEconomyTimer = false) => {
      const page = await context.newPage();
      await page.goto(baseUrl);
      await loaded(page);
      if (!keepEconomyTimer) await stopTimer(page);
      return page;
    };
    const openEditor = async () => {
      const page = await context.newPage();
      await page.goto(`${baseUrl}__save-protection-editor`);
      return page;
    };
    await check({ context, openGame, openEditor });
    assert.deepEqual(errors, [], `${name}: uncaught browser errors`);
    checks.push(name);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}

async function assertBlocked(page, expected) {
  const current = await status(page);
  assert.equal(current.recovering, true);
  for (const [field, value] of Object.entries(expected)) assert.equal(current[field], value, field);
  assert.equal(await page.locator('#recovery-panel').isVisible(), true);
  assert.equal(await page.locator('#start-wave').evaluate(element => !!element.closest('[inert]')), true);
  const layout = await page.evaluate(() => {
    const card = document.querySelector('#recovery-panel .recovery-card');
    return { width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
      cardWidth: card.clientWidth, cardScroll: card.scrollWidth };
  });
  assert.ok(layout.scroll <= layout.width + 1 && layout.cardScroll <= layout.cardWidth + 1, JSON.stringify(layout));
}

try {
  const listening = once(server.httpServer, 'listening');
  server.httpServer.listen(0, '127.0.0.1');
  await listening;
  baseUrl = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });

  await inContext('one shared-origin tab owns progress; the blocked tab reloads the latest save after ownership is released', {},
    async ({ openGame }) => {
      const first = await openGame();
      await ready(first);
      await first.evaluate(() => window.saveProtection.pauseForInactivity());
      const original = await raw(first);
      const second = await openGame();
      await assertBlocked(second, { session: 'busy', canWrite: false });
      assert.equal(await second.locator('#recovery-reset').isVisible(), false);
      assert.equal(await raw(second), original);
      await second.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
      assert.equal(await raw(second), original);
      assert.equal((await second.evaluate(() => window.saveFaults.counters())).campaignAttempts, 0);

      await first.evaluate(() => window.saveProtection.writeGold(413));
      assert.equal(JSON.parse(await raw(first)).gold, 413);
      await first.close();
      await second.locator('#recovery-retry').click();
      await ready(second);
      await stopTimer(second);
      assert.equal((await status(second)).session, 'owned');
      assert.equal((await snapshot(second)).gold, 413, 'retry restores the latest owner state, not the blocked tab defaults');
      assert.equal((await snapshot(second)).units.length, 3);
    });

  await inContext('native lock revocation opens recovery without a user action and prevents further saves', {},
    async ({ openGame, openEditor }) => {
      const page = await openGame(true);
      await ready(page);
      const editor = await openEditor();
      const original = await raw(page);
      await editor.evaluate(async key => {
        await new Promise(acquired => {
          window.stolenSaveLock = navigator.locks.request(`brotd-save:${key}`, { mode: 'exclusive', steal: true },
            () => new Promise(release => {
              window.releaseStolenSaveLock = release;
              acquired();
            }));
        });
      }, key);
      await page.waitForFunction(() => window.saveProtection.status().session === 'unavailable');
      // No save, input or visibility event provokes the UI: the real economy
      // interval must surface lost ownership even while the wallet is unchanged.
      await page.locator('#recovery-panel').waitFor({ state: 'visible' });
      await assertBlocked(page, { session: 'unavailable', canWrite: false });
      assert.equal(await raw(page), original);
      await page.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
      assert.equal(await raw(page), original);
      await editor.evaluate(async () => {
        window.releaseStolenSaveLock();
        await window.stolenSaveLock;
      });
      await page.locator('#recovery-retry').click();
      await ready(page);
      await stopTimer(page);
      assert.equal((await status(page)).session, 'owned');
      assert.equal((await snapshot(page)).gold, fixture.gold);
    });

  for (const operation of ['replace', 'clear']) {
    await inContext(`external storage ${operation} freezes the owner and cannot be overwritten by income or reset`, {},
      async ({ openGame, openEditor }) => {
        const page = await openGame();
        await ready(page);
        const before = await snapshot(page);
        const editor = await openEditor();
        const replacement = JSON.stringify({ ...before, gold: 987 });
        await editor.evaluate(({ key, replacement, operation }) => {
          if (operation === 'clear') localStorage.clear();
          else localStorage.setItem(key, replacement);
        }, { key, replacement, operation });
        await page.waitForFunction(() => window.saveProtection.status().storage === 'conflict');
        await assertBlocked(page, { storage: 'conflict' });
        const protectedRaw = operation === 'clear' ? null : replacement;
        assert.equal(await raw(page), protectedRaw);
        await page.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
        assert.equal((await snapshot(page)).gold, before.gold);
        assert.equal((await page.evaluate(() => window.saveProtection.resetAttempt())).ok, false);
        assert.equal(await raw(page), protectedRaw);
        assert.equal(await page.locator('#recovery-reset').isVisible(), false);
      });
  }

  await inContext('future schema remains byte-exact and cannot be reset by an older client', {
    raw: JSON.stringify({ ...fixture, saveSchemaVersion: 3, futureDungeon: { depth: 71, loot: ['unknown-item'] } }, null, 2),
  }, async ({ openGame }) => {
    const page = await openGame();
    await assertBlocked(page, { storage: 'unsupported', session: 'owned' });
    const original = await raw(page);
    assert.equal(await page.locator('#recovery-reset').isVisible(), false);
    await page.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
    assert.equal((await page.evaluate(() => window.saveProtection.resetAttempt())).ok, false);
    await page.locator('#recovery-retry').click();
    await loaded(page);
    await assertBlocked(page, { storage: 'unsupported' });
    assert.equal(await raw(page), original);
    assert.equal(await backup(page), null);
    assert.equal((await page.evaluate(() => window.saveFaults.counters())).campaignAttempts, 0);
  });

  for (const [version, migrationRaw] of [
    ['unversioned', legacyRaw], ['schema one', `  ${JSON.stringify({ ...legacy, saveSchemaVersion: 1 }, null, 2)}\n`],
  ]) await inContext(`${version} migration keeps a byte-exact backup once and preserves progress across repeated reloads`, { raw: migrationRaw },
    async ({ openGame }) => {
      const page = await openGame();
      await ready(page);
      assert.equal(await backup(page), migrationRaw);
      const migrated = await snapshot(page);
      assert.equal(JSON.parse(await raw(page)).saveSchemaVersion, 2);
      assert.equal(JSON.parse(await raw(page)).nextUnitId, fixture.nextUnitId);
      assert.equal(migrated.gold, fixture.gold);
      assert.equal(migrated.units.length, fixture.units.length);
      assert.equal(migrated.reserve.length, fixture.reserve.length);
      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload();
        await ready(page);
        await stopTimer(page);
        const restored = await snapshot(page);
        assert.equal(restored.gold, migrated.gold);
        assert.deepEqual(restored.units, migrated.units);
        assert.deepEqual(restored.reserve, migrated.reserve);
        assert.equal(await backup(page), migrationRaw);
        assert.equal((await page.evaluate(() => window.saveFaults.counters())).backupAttempts, 0);
      }
    });

  await inContext('missing Web Locks fails closed with an actionable recovery panel and no storage writes', { noLocks: true },
    async ({ openGame }) => {
      const page = await openGame();
      await assertBlocked(page, { session: 'unavailable', canWrite: false });
      const original = await raw(page);
      assert.match(await page.locator('#recovery-description').textContent(), /browser|telegram|web locks/i);
      assert.equal(await page.locator('#recovery-reset').isVisible(), false);
      await page.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
      await page.locator('#recovery-retry').click();
      await loaded(page);
      assert.equal(await raw(page), original);
      assert.equal((await page.evaluate(() => window.saveFaults.counters())).campaignAttempts, 0);
      assert.equal((await status(page)).canWrite, false);
    });

  await inContext('backup write failure preserves the legacy source and a successful retry creates the backup before migration', {
    raw: legacyRaw, backupFailure: true,
  }, async ({ openGame }) => {
    const page = await openGame();
    await assertBlocked(page, { storage: 'write-error' });
    assert.equal(await raw(page), legacyRaw);
    assert.equal(await backup(page), null);
    const counts = await page.evaluate(() => window.saveFaults.counters());
    assert.ok(counts.backupAttempts > 0);
    assert.equal(counts.campaignAttempts, 0);
    await page.evaluate(() => window.saveFaults.backupFailure(false));
    await page.locator('#recovery-retry').click();
    await ready(page);
    assert.equal(await backup(page), legacyRaw);
    assert.equal(JSON.parse(await raw(page)).saveSchemaVersion, 2);
    assert.equal((await snapshot(page)).gold, fixture.gold);
  });

  await inContext('an exception halfway through restoration protects the original against subsequent startup saves', {
    raw: JSON.stringify({ ...fixture, triggerRestoreFailure: true }),
  }, async ({ openGame }) => {
    const page = await openGame();
    await assertBlocked(page, { storage: 'corrupt' });
    const original = await raw(page);
    await page.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
    assert.equal(await raw(page), original);
    assert.equal((await page.evaluate(() => window.saveFaults.counters())).campaignAttempts, 0);
  });

  await inContext('retry after a failed save and visibility pause restarts both battle and economy clocks', {},
    async ({ openGame }) => {
      const page = await openGame();
      await ready(page);
      await page.locator('#start-wave').click();
      await page.waitForFunction(() => window.saveProtection.status().battle?.elapsed > 0);
      await page.evaluate(() => {
        window.saveFaults.writeFailure(true);
        window.saveProtection.save();
        window.saveProtection.pauseForInactivity();
        window.saveProtection.activateGame();
      });
      await assertBlocked(page, { storage: 'write-error', economyActive: false });
      const stopped = await status(page);
      assert.equal(stopped.battle.phase, 'running');
      await page.evaluate(() => window.saveFaults.writeFailure(false));
      await page.locator('#recovery-retry').click();
      await ready(page);
      await page.waitForFunction(elapsed => window.saveProtection.status().battle?.elapsed > elapsed,
        stopped.battle.elapsed);
      assert.equal((await status(page)).economyActive, true);
      const before = (await snapshot(page)).gold;
      await page.evaluate(() => window.saveProtection.income(60));
      assert.ok((await snapshot(page)).gold > before, 'the resumed economy timer awards earned income');
    });

  await inContext('ordinary hiding retains ownership; persisted pagehide releases it and pageshow resumes unchanged progress', {},
    async ({ openGame }) => {
      const page = await openGame();
      await ready(page);
      const before = await snapshot(page);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      assert.equal((await status(page)).session, 'owned');
      assert.equal((await status(page)).canWrite, true);
      assert.equal((await status(page)).economyActive, false);
      const held = await page.evaluate(() => navigator.locks.query());
      assert.ok(held.held.some(lock => lock.name === 'brotd-save:brotd-infinity:campaign:v2'));
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      });
      assert.equal((await status(page)).canWrite, false);
      await page.waitForFunction(async () => !(await navigator.locks.query()).held
        .some(lock => lock.name === 'brotd-save:brotd-infinity:campaign:v2'));
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await ready(page);
      await stopTimer(page);
      assert.equal((await status(page)).session, 'owned');
      assert.equal((await status(page)).economyActive, true);
      const restored = await snapshot(page);
      assert.equal(restored.gold, before.gold);
      assert.deepEqual(restored.units, before.units);
      assert.deepEqual(restored.reserve, before.reserve);
    });

  await inContext('persisted-page restoration rejects stale state after another owner has saved and retries through a fresh load', {},
    async ({ openGame }) => {
      const first = await openGame();
      await ready(first);
      await first.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      await first.waitForFunction(async () => !(await navigator.locks.query()).held
        .some(lock => lock.name === 'brotd-save:brotd-infinity:campaign:v2'));
      const second = await openGame();
      await ready(second);
      await second.evaluate(() => window.saveProtection.writeGold(639));
      await second.close();
      await first.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await first.waitForFunction(() => window.saveProtection.status().storage === 'conflict');
      await assertBlocked(first, { storage: 'conflict', economyActive: false });
      assert.equal(JSON.parse(await raw(first)).gold, 639);
      await first.evaluate(() => { window.saveProtection.income(120); window.saveProtection.save(); });
      assert.equal(JSON.parse(await raw(first)).gold, 639);
      await first.locator('#recovery-retry').click();
      await ready(first);
      await stopTimer(first);
      assert.equal((await snapshot(first)).gold, 639);
      assert.equal((await status(first)).session, 'owned');
    });

  console.log(JSON.stringify({ passed: checks.length, viewport: '320x700',
    lifecycleCoverage: 'synthetic persisted events; native BFCache/device support is not asserted', checks }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
