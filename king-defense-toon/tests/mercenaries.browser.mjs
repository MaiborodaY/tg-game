import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { createCampaignState, campaignSnapshot } from '../campaign-state.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const key = 'brotd-infinity:campaign:v2', now = 1800000000000;
const output = new URL('../../.tmp/mercenaries/', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/mercenaries/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'mercenaries-observation', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    return code + `\nwindow.mercenaryCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      refresh: () => refreshRecruitmentDetails(),
      advance: ms => { window.fixtureNow += ms; tickEconomy(); refresh(); },
    };`;
  } }],
});
function fixture(level = 2, received = {}, gold = 2107, pool = 'humans', guaranteed = false) {
  const state = createCampaignState(now);
  state.onboardingCompleted = true; state.gold = gold; state.autoWaves = false;
  state.barracks.level = level; state.barracks.firstLancerPending = guaranteed;
  Object.assign(state.recruitment.received, received); state.recruitmentPool = pool;
  return campaignSnapshot(state);
}
const human = { swordsman: 59, archer: 27, healer: 11, lancer: 5 };
let browser, baseUrl;
const checks = [];
const state = page => page.evaluate(() => window.mercenaryCheck.state());
const open = page => page.locator('#open-market-info').click();
const upgrade = page => page.locator('#mercenaries-view-upgrade').click();
const close = page => page.locator('#market-info-panel [data-close-overlay]').click();
async function fits(page) {
  assert.deepEqual(await page.locator('#market-info-panel').evaluate(panel => {
    const problems = [];
    for (const el of panel.querySelectorAll('.menu-card, .mercenary-recruit, .mercenaries-upgrade-top, .mercenaries-requirement')) {
      if (el.getClientRects().length && el.scrollWidth > el.clientWidth + 1) problems.push(`${el.className}: horizontal overflow`);
    }
    return problems;
  }), []);
}
async function scenario(name, saved, width, run) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, isMobile: true, hasTouch: true });
  const errors = [], images = [];
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ key, saved, now }) => {
      window.fixtureNow = now; Date.now = () => window.fixtureNow;
      // Layout/save checks use a disposable fixture, not the player's browser.
      if (!sessionStorage.getItem('mercenaries-fixture')) {
        localStorage.setItem(key, JSON.stringify(saved)); sessionStorage.setItem('mercenaries-fixture', '1');
      }
    }, { key, saved, now });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.resourceType() === 'image') images.push(request.url()); });
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(baseUrl)) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(baseUrl);
    try { await page.waitForFunction(() => window.mercenaryCheck?.ready()); }
    catch (error) { console.error('Browser startup errors:', errors, await page.locator('#recovery-panel').innerText()); throw error; }
    await page.evaluate(() => document.fonts.ready);
    await run(page, images); assert.deepEqual(errors, []);
    checks.push(name); console.log('PASS', name);
  } finally { await context.close(); }
}
try {
  await mkdir(output, { recursive: true }); baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  for (const width of [320, 390]) {
    await scenario(`human overview/details ${width}`, fixture(2, human), width, async (page, images) => {
      const before = await state(page);
      assert.equal(await page.locator('#market-info-panel img').count(), 0, 'Closed menu is not mounted');
      await open(page); await fits(page);
      assert.equal(await page.locator('#market-info-title').innerText(), 'Mercenaries');
      assert.equal(await page.locator('.mercenary-recruit').count(), 4);
      assert.equal(await page.locator('#recruitment-chance').innerText(), '25% each');
      assert.equal(await page.locator('#recruitment-pool-elves').isEnabled(), false);
      assert.doesNotMatch(await page.locator('.mercenaries-upgrade-summary').innerText(), /gold|3h/);
      await page.locator('[data-merc-action="help"]').click();
      assert.match(await page.locator('#recruitment-info-note').innerText(), /Market.*Connect/);
      await page.locator('[data-merc-action="help"]').click();
      await page.screenshot({ path: fileURLToPath(new URL(`main-${width}.png`, output)) });
      await upgrade(page); await fits(page);
      assert.equal(await page.locator('#mercenaries-required-count').innerText(), '45 more at Market');
      assert.equal(await page.locator('#mercenaries-required-gold').innerText(), '2,107 / 2,000');
      assert.equal(await page.locator('#mercenaries-duration').innerText(), '3h');
      assert.equal(await page.locator('#barracks-start-upgrade').isEnabled(), false);
      await page.screenshot({ path: fileURLToPath(new URL(`upgrade-${width}.png`, output)) });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mercenaries-overview').isVisible(), true);
      assert.equal(await page.locator('#mercenaries-view-upgrade').evaluate(el => el === document.activeElement), true);
      // Income refreshes must not replace images, progress controls or the selected dropdown.
      await page.locator('.mercenary-recruit img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      const imageCount = images.length;
      const stable = await page.evaluate(async () => {
        const cards = [...document.querySelectorAll('.mercenary-recruit')];
        const pool = document.querySelector('#recruitment-pool'); pool.focus();
        let mutations = 0;
        const observer = new MutationObserver(records => mutations += records.length);
        observer.observe(document.querySelector('#recruitment-details'), { subtree: true, childList: true, attributes: true, characterData: true });
        const started = performance.now();
        for (let i = 0; i < 100; i++) window.mercenaryCheck.refresh();
        const elapsed = performance.now() - started;
        await Promise.resolve(); observer.disconnect();
        return { mutations, same: cards.every((card, index) => card === document.querySelectorAll('.mercenary-recruit')[index]), focused: document.activeElement === pool, elapsed };
      });
      assert.equal(stable.mutations, 0); assert.equal(stable.same, true); assert.equal(stable.focused, true);
      assert.equal(images.length, imageCount); console.log('100 unchanged menu refreshes (desktop ms):', stable.elapsed.toFixed(2));
      await close(page); await open(page);
      assert.equal(await page.locator('#mercenaries-overview').isVisible(), true);
      const { economy: afterEconomy, ...after } = await state(page);
      const { economy: beforeEconomy, ...original } = before;
      assert.deepEqual(after, original, 'Menu navigation does not modify campaign');
      assert.equal(afterEconomy.slaves, beforeEconomy.slaves);
      assert.equal(afterEconomy.captures, beforeEconomy.captures);
    });
  }
  await scenario('initial locked roles', fixture(1), 320, async page => {
    await open(page); await fits(page);
    assert.equal(await page.locator('.mercenary-recruit.is-locked').count(), 3);
    assert.equal(await page.locator('#recruitment-chance').innerText(), '100% each');
    assert.match(await page.locator('[data-recruit-type="archer"]').innerText(), /Swordsman Lv. 3/);
    assert.match(await page.locator('[data-recruit-type="lancer"]').innerText(), /Mercenaries II/);
    await upgrade(page); assert.equal(await page.locator('#mercenaries-required-count').innerText(), '50 more at Market');
    assert.equal(await page.locator('#mercenaries-capacity').innerText(), '8 → 9');
  });
  await scenario('elves dropdown, locked roles, pool save', fixture(3, { ...human, pantherRider: 15 }), 320, async page => {
    await open(page); await page.locator('#recruitment-pool').selectOption('elves'); await fits(page);
    assert.equal(await page.locator('[data-elf-recruit]').count(), 4);
    assert.equal(await page.locator('#recruitment-chance').innerText(), '50% each');
    assert.match(await page.locator('[data-elf-recruit="unicorn"]').innerText(), /Mercenaries IV.*Panther Rider Lv. 5/s);
    assert.match(await page.locator('[data-elf-recruit="elfHealer"]').innerText(), /Elven Archer Lv. 3/);
    await upgrade(page); assert.equal(await page.locator('#mercenaries-required-count').innerText(), '35 more at Market');
    await close(page); await page.reload(); await page.waitForFunction(() => window.mercenaryCheck?.ready()); await open(page);
    assert.equal(await page.locator('#recruitment-pool').inputValue(), 'elves');
    await page.screenshot({ path: fileURLToPath(new URL('elves-320.png', output)) });
  });
  await scenario('insufficient gold', fixture(2, { ...human, lancer: 50 }, 1999), 390, async page => {
    await open(page); await upgrade(page);
    assert.equal(await page.locator('#barracks-start-upgrade').isEnabled(), false);
    assert.match(await page.locator('#barracks-start-upgrade').getAttribute('aria-label'), /1 more gold/);
    assert.equal(await page.locator('#mercenaries-required-count').innerText(), 'Ready');
  });
  await scenario('start, countdown, skip and unchanged buttons', fixture(2, { ...human, lancer: 50 }, 5000), 390, async page => {
    await open(page); await upgrade(page); const before = await state(page);
    await page.locator('#barracks-start-upgrade').click();
    let saved = await state(page);
    assert.equal(saved.gold, before.gold - 2000); assert.equal(saved.barracks.upgradeReadyAt, now + 10800000);
    assert.equal(await page.locator('#mercenaries-requirements').isVisible(), false);
    assert.equal(await page.locator('#mercenaries-back').evaluate(el => document.activeElement === el), true);
    await page.locator('#barracks-finish-upgrade').focus();
    await page.evaluate(() => window.mercenaryCheck.refresh());
    assert.equal(await page.locator('#barracks-finish-upgrade').evaluate(el => document.activeElement === el), true);
    await page.evaluate(() => window.mercenaryCheck.advance(5400000));
    if (await page.locator('#offline-rewards-panel').isVisible()) await page.locator('#collect-offline-rewards').click();
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /150 gold/);
    assert.equal(await page.locator('#mercenaries-duration').innerText(), '1:30:00');
    const gold = (await state(page)).gold;
    await page.locator('#barracks-finish-upgrade').click();
    saved = await state(page); assert.equal(saved.gold, gold - 150); assert.equal(saved.barracks.level, 3);
    assert.equal(await page.locator('#mercenaries-upgrade-tier').innerText(), 'Mercenaries III → IV');
    await fits(page);
  });
  await scenario('natural completion preserves Lancer guarantee', fixture(1, { swordsman: 50 }, 5000), 390, async page => {
    await open(page); await upgrade(page); await page.locator('#barracks-start-upgrade').click();
    await page.evaluate(() => window.mercenaryCheck.advance(3600000));
    if (await page.locator('#offline-rewards-panel').isVisible()) await page.locator('#collect-offline-rewards').click();
    assert.equal((await state(page)).barracks.level, 2);
    assert.equal((await state(page)).barracks.firstLancerPending, true);
    await page.locator('#mercenaries-back').click();
    assert.equal(await page.locator('#recruitment-chance').innerText(), 'Lancer next');
    assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
    await page.locator('#recruitment-guarantee [data-merc-action="market"]').click();
    assert.equal(await page.locator('#market-info-panel').isVisible(), false);
  });
  await scenario('maximum tier and capped recruitment', fixture(4, { ...human, pantherRider: 49500, elfArcher: 15, elfHealer: 5, unicorn: 5 }, 9000, 'elves'), 320, async page => {
    await open(page); await fits(page);
    assert.match(await page.locator('[data-elf-recruit="pantherRider"]').innerText(), /Lv. 100.*Max level/s);
    assert.equal(await page.locator('#recruitment-chance').innerText(), '25% each');
    await upgrade(page); await fits(page);
    assert.equal(await page.locator('#mercenaries-complete').isVisible(), true);
    assert.equal(await page.locator('#barracks-start-upgrade').isVisible(), false);
    assert.equal(await page.locator('#mercenaries-time').isVisible(), false);
    assert.equal(await page.locator('#mercenaries-capacity').innerText(), '11');
  });
  console.log(JSON.stringify({ ok: true, checks, output: fileURLToPath(output) }, null, 2));
} finally { await browser?.close(); await server.close(); }
