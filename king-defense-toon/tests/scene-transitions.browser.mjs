// Test the real entry point and media lifecycle without advancing combat or
// accessing a player's save. RAF is inert; results are supplied by a test hook.
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const key = 'brotd-infinity:campaign:v2';
const fixture = {
  campaignVersion: 3, clearedWaves: 58, gold: 1867, starterSupplyGranted: true,
  autoWaves: false, autoWavesDefaultVersion: 1, onboardingCompleted: true,
  units: [{ type: 'swordsman', level: 112, col: 2, row: 0 },
    { type: 'archer', level: 19, col: 2, row: 1 }, { type: 'healer', level: 8, col: 2, row: 2 }],
  progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
  barracks: { level: 2, firstLancerPending: false },
};
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/scene-transitions-vite/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'transition-check-hooks', enforce: 'pre', transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/main.ts')) return;
    return code + `
      window.transitionCheck = {
        ready: async () => {
          await Promise.all([scene.prepare(), armyScene.prepare()]);
          const wave = getWaveDefinition(battle?.phase === 'running'
            ? Math.min(TOTAL_WAVES, battle.waveNumber + 1) : nextWaveNumber());
          await scene.preload({ units: campaign.units, wave, capitolState: campaign.capitol });
        },
        finish: () => {
          battle.phase = 'victory'; battle.kills = battle.total; battle.reward = battle.wave.reward;
          const credited = applyBattleKillRewards(campaign, battle.campaignRewards,
            { kills: battle.kills, totalGold: battle.reward }, () => .9);
          if (!credited.ok) throw new Error(credited.reason);
          showResult();
        },
        requireOtherMap: () => scene.prepare({ battle: null, wave: getWaveDefinition(201), levelNumber: 2 }),
        reset: () => { resetSaveToken = saveStorage.prepareReset(); resetRun(); },
        state: () => ({ recovering: isRecovering(), blocked: recoveryBlocked,
          wave: battle?.waveNumber ?? nextWaveNumber(), phase: battle?.phase,
          assets: assetStates, storage: saveStorage.status }),
      };
    `;
  } }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(({ key, fixture }) => {
    localStorage.setItem(key, JSON.stringify(fixture));
    window.requestAnimationFrame = () => 1;
    window.cancelAnimationFrame = () => {};
    window.mediaCalls = [];
    window.trackedMedia = [];
    for (const method of ['play', 'pause']) {
      const original = HTMLMediaElement.prototype[method];
      HTMLMediaElement.prototype[method] = function (...args) {
        if (!window.trackedMedia.includes(this)) window.trackedMedia.push(this);
        window.mediaCalls.push({ method, source: this.src });
        return original.apply(this, args);
      };
    }
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (window.failSave && name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return write.call(this, name, value);
    };
  }, { key, fixture });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.transitionCheck, null, { polling: 50 });
  await page.evaluate(() => transitionCheck.ready());
  await page.waitForFunction(() => !transitionCheck.state().recovering, null, { polling: 50 });
  await page.locator('#battle').click({ position: { x: 150, y: 150 } });
  await page.waitForFunction(() => trackedMedia.some(media => /ambient-level/.test(media.src) && !media.paused), null, { polling: 50 });
  await page.evaluate(() => {
    window.mediaCalls.length = 0;
    window.loadingFlashes = [];
    const panel = document.querySelector('#recovery-panel');
    new MutationObserver(() => {
      if (!panel.hidden) loadingFlashes.push(panel.textContent);
    }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  });

  await page.locator('#start-wave').click();
  await page.evaluate(() => transitionCheck.ready());
  assert.equal((await page.evaluate(() => transitionCheck.state())).wave, 59);
  await page.evaluate(() => transitionCheck.finish());
  await page.locator('#return-prep').click();
  assert.equal(await page.locator('#start-wave').isEnabled(), true);
  await page.locator('#start-wave').click();
  await page.evaluate(() => transitionCheck.ready());
  assert.equal((await page.evaluate(() => transitionCheck.state())).wave, 60);
  assert.deepEqual(await page.evaluate(() => loadingFlashes), []);
  assert.deepEqual(await page.evaluate(() => mediaCalls), [], 'Start and Prepare must not pause/restart music');
  assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), false);

  // A held network response proves that grace-period blocking is immediate,
  // long waits are visible, and even the visible loader leaves music playing.
  let release, entered;
  const held = new Promise(resolve => { release = resolve; });
  const requested = new Promise(resolve => { entered = resolve; });
  await page.route('**/forgotten-graveyard.webp', async route => { entered(); await held; await route.continue(); });
  await page.evaluate(() => { window.pendingMap = transitionCheck.requireOtherMap(); });
  await requested;
  assert.equal((await page.evaluate(() => transitionCheck.state())).blocked, true);
  assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), true);
  await page.locator('#recovery-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#recovery-title').textContent(), 'Loading battlefield');
  assert.deepEqual(await page.evaluate(() => mediaCalls), []);
  release();
  assert.equal(await page.evaluate(() => pendingMap), true);
  await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), false);
  await page.unroute('**/forgotten-graveyard.webp');

  // Reload owns a new cache/context, then exhaust an actual image load and retry.
  await page.reload();
  await page.waitForFunction(() => window.transitionCheck, null, { polling: 50 });
  await page.evaluate(() => transitionCheck.ready());
  await page.route('**/forgotten-graveyard.webp', route => route.abort('failed'));
  assert.equal(await page.evaluate(() => transitionCheck.requireOtherMap()), false);
  await page.locator('#recovery-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#recovery-title').textContent(), 'Battlefield unavailable');
  assert.equal(await page.locator('#recovery-retry').isVisible(), true);
  await page.unroute('**/forgotten-graveyard.webp');
  await page.locator('#recovery-retry').click();
  await page.locator('#recovery-panel').waitFor({ state: 'hidden' });

  // A failed reset must recapture inert state even after restoring the old one.
  await page.evaluate(() => { window.failSave = true; transitionCheck.reset(); });
  await page.locator('#recovery-panel').waitFor({ state: 'visible' });
  assert.equal((await page.evaluate(() => transitionCheck.state())).storage, 'write-error');
  assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), true);
  await page.evaluate(() => { window.failSave = false; });
  await page.locator('#recovery-retry').click();
  await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), false);
  assert.deepEqual(errors, []);
  console.log('Passed transition integration checks: warm Start/Prepare, uninterrupted media, slow loads, errors/retry, reset recovery and input restoration. No combat advanced.');
} finally {
  await browser?.close();
  await server.close();
}
