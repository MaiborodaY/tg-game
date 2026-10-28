import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const key = 'brotd-infinity:campaign:v2', now = 1_800_000_000_000;
const fixture = { saveSchemaVersion: 2, nextUnitId: 4, campaignVersion: 3,
  gold: 125, starterSupplyGranted: true, marketHintCompleted: true, clearedWaves: 0,
  autoWaves: false, autoWavesDefaultVersion: 1,
  units: [{ id: 1, type: 'swordsman', level: 20, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 20, col: 2, row: 1 }, { id: 3, type: 'healer', level: 20, col: 2, row: 2 }],
  reserve: [], progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
  economy: { slaves: 3, treasuryUpdatedAt: now },
};
const server = await preview({ root, configFile: `${root}/vite.config.mjs`,
  preview: { host: '127.0.0.1', port: 0, strictPort: false } });
let browser;
try {
  const base = server.resolvedUrls.local[0];
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const outcomes = [];
  for (const enabled of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    try {
      await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await context.addInitScript(({ key, fixture, now }) => {
        Date.now = () => now; Math.random = () => .5;
        localStorage.setItem(key, JSON.stringify(fixture));
      }, { key, fixture, now });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.url()); });
      await page.goto(`${base}${enabled ? '?profile=1' : ''}`);
      await page.waitForFunction(() => !document.getElementById('start-wave').disabled);
      assert.equal(await page.locator('#combat-profiler').count(), enabled ? 1 : 0);
      assert.equal(await page.evaluate(() => typeof window.brotdProfiler), enabled ? 'object' : 'undefined');
      await page.locator('#start-wave').click();
      await page.locator('#battle-speed').click(); await page.locator('#battle-speed').click();
      await page.waitForFunction(() => document.getElementById('battle').dataset.phase === 'victory', null, { timeout: 45000 });
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      // Foreground economy checkpoints follow wall time, so compare durable
      // outcomes/ownership rather than incidental fractional timer progress.
      outcomes.push({ gold: saved.gold, units: saved.units, reserve: saved.reserve,
        nextUnitId: saved.nextUnitId, hero: saved.hero, clearedWaves: saved.clearedWaves,
        progression: saved.progression, slaves: saved.economy.slaves, captures: saved.economy.captures });
      if (enabled) {
        const sample = await page.evaluate(() => window.brotdProfiler.snapshot());
        for (const name of ['work', 'simulation', 'render', 'ui', 'interval']) {
          assert.ok(sample.metrics[name].count > 0, `${name} must be sampled in the real game`);
          assert.ok(Number.isFinite(sample.metrics[name].p95));
        }
        assert.equal(sample.targetFps, 30);
        assert.equal(sample.counters.wave, 1);
        await page.locator('#combat-profiler summary').click();
        const bounds = await page.locator('#combat-profiler').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391);
        // Synchronous reset exposes an empty snapshot before another RAF can record.
        const reset = await page.evaluate(() => { window.brotdProfiler.reset(); return window.brotdProfiler.snapshot(); });
        assert.equal(reset.metrics.work.count, 0);
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(outcomes[1], outcomes[0], 'profiling cannot change combat rewards or durable campaign state');
  console.log('PASS production game: profiler opt-in, metrics, reset, first-wave result and save equality');

  const context = await browser.newContext({ viewport: { width: 320, height: 760 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.url()); });
    const untouched = 'literal saved bytes that the diagnostics page must never decode or replace';
    await context.addInitScript(({ key, untouched }) => localStorage.setItem(key, untouched), { key, untouched });
    await page.goto(`${base}profile.html`);
    await page.waitForFunction(() => !document.getElementById('profile-start').disabled);
    await page.locator('#profile-scenario').selectOption('mixed-skills');
    await page.locator('#profile-speed').selectOption('3');
    await page.locator('#profile-visuals').selectOption('0');
    await page.locator('#profile-seconds').fill('5');
    await page.locator('#profile-start').click();
    await page.waitForFunction(() => document.getElementById('profile-battle').dataset.running === 'true');
    await page.waitForFunction(() => document.getElementById('profile-battle').dataset.running === 'false', null, { timeout: 30000 });
    assert.equal(await page.locator('#profile-battle').getAttribute('data-elapsed'), '5.000', 'speed 3 must stop at the requested simulation duration');
    const sample = await page.evaluate(() => window.brotdProfiler.snapshot());
    assert.ok(sample.metrics.simulation.count > 0 && sample.metrics.render.count > 0);
    assert.ok(sample.counters.enemies > 0);
    assert.equal(sample.counters.effects, 0);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), untouched);
    // Changing the next run's controls must not relabel retained measurements.
    await page.locator('#profile-scenario').selectOption('opening');
    await page.locator('#profile-speed').selectOption('1');
    await page.locator('#profile-visuals').selectOption('256');
    await page.locator('#profile-seconds').fill('10');
    await page.locator('#combat-profiler summary').click();
    const [download] = await Promise.all([
      page.waitForEvent('download'), page.locator('[data-profiler-export]').click(),
    ]);
    const stream = await download.createReadStream(), chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const report = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(report.kind, 'brotd-browser-profile');
    assert.match(report.build, /^\d{6}-\d{6}$/);
    assert.deepEqual(report.context, { mode: 'stress-lab', scenario: 'mixed-skills', speed: 3, duration: 5, visualEffectLimit: 0 });
    assert.deepEqual(report.sample, sample);
    await page.locator('#combat-profiler summary').click();
    await page.locator('#profile-scenario').selectOption('mixed-skills');
    await page.locator('#profile-seconds').fill('5');
    await page.locator('#profile-start').click();
    await page.waitForFunction(() => document.getElementById('profile-battle').dataset.running === 'true');
    await page.waitForFunction(() => document.getElementById('profile-battle').dataset.running === 'false', null, { timeout: 30000 });
    assert.equal(await page.locator('#profile-battle').getAttribute('data-elapsed'), '5.000', 'speed 1 must stop at the same simulation duration');
    await page.locator('#profile-start').click();
    await page.waitForFunction(() => document.getElementById('profile-battle').dataset.running === 'true');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await page.locator('#profile-battle').getAttribute('data-running'), 'false');
    const stopped = await page.evaluate(() => window.brotdProfiler.snapshot().metrics.work.count);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.brotdProfiler.snapshot().metrics.work.count), stopped);
    assert.deepEqual(errors, []);
    console.log('PASS production stress lab: rendering, cosmetics, exact duration, export metadata, save isolation and pagehide stop');
  } finally { await context.close(); }
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
