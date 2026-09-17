// Isolated mobile contexts exercise real UI/save flows with a controllable wall clock.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../../../.tmp/barracks-upgrade/', import.meta.url);
const server = await createServer({ root, configFile: false, server: { host: '127.0.0.1', port: 5200, strictPort: true },
  plugins: [{ name: 'barracks-check-hooks', transform(code, id) {
    if (id.endsWith('/main.mjs')) return code + `\nwindow.barracksCheck = {
      ready: () => !!scene && !!armyScene,
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify({ gold, units, reserve, recruitment, barracks, slaves: economy.slaves })),
      advance: ms => { window.checkNow += ms; sessionStorage.setItem('checkNow', window.checkNow); tickEconomy(); },
    };`;
  } }] });
let browser;
const failures = [];
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 700 }, isMobile: true, hasTouch: true });
    await context.route('https://telegram.org/**', route => route.abort());
    await context.addInitScript(() => {
      window.checkNow = Number(sessionStorage.getItem('checkNow')) || 1800000000000;
      Date.now = () => window.checkNow;
      Math.random = () => 0;
      if (localStorage.getItem('brotd-infinity:campaign:v2')) return;
      localStorage.setItem('brotd-infinity:campaign:v2', JSON.stringify({ campaignVersion: 3,
        gold: 1000, starterSupplyGranted: true, autoWaves: false, autoWavesDefaultVersion: 1,
        units: [{ id: 1, type: 'swordsman', level: 50, col: 2, row: 0 }], reserve: [],
        recruitment: { version: 2, received: { swordsman: 49, archer: 6, healer: 5 },
          legacyTrainingCredit: { swordsman: 0, archer: 0, healer: 0 } },
        economy: { slaves: 5, treasuryUpdatedAt: window.checkNow },
      }));
    });
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(error.message));
    const ready = async () => {
      await page.waitForFunction(() => window.barracksCheck?.ready());
      await page.evaluate(() => window.barracksCheck.freeze());
    };
    const state = () => page.evaluate(() => window.barracksCheck.state());
    const close = () => page.locator('#barracks-panel [data-close-overlay]').click();
    const upgrade = async () => { await page.locator('#open-barracks').click(); await page.locator('#barracks-upgrade-toggle').click(); };
    const fits = async () => {
      const rect = await page.locator('#barracks-panel .menu-card').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
      });
      assert.ok(rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= 700, 'dialog fits viewport');
      assert.ok(rect.scrollWidth <= rect.clientWidth + 1 && rect.scrollHeight <= rect.clientHeight + 1, 'dialog needs no scrolling');
    };
    await page.goto('http://127.0.0.1:5200/');
    await ready();
    await upgrade();
    assert.equal(await page.locator('#barracks-start-upgrade').isDisabled(), true, 'merged personal level must not unlock');
    assert.match(await page.locator('#barracks-upgrade-state').innerText(), /now Lv\. 4/);
    await fits();
    await page.screenshot({ path: fileURLToPath(new URL(`locked-${width}.png`, output)) });
    await close();
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
    assert.equal((await state()).recruitment.received.swordsman, 50);
    assert.equal((await state()).units[0].level, 50, 'training does not alter an existing fighter');
    await upgrade();
    assert.equal(await page.locator('#barracks-start-upgrade').isEnabled(), true);
    await page.locator('#barracks-start-upgrade').click();
    assert.equal((await state()).gold, 800);
    assert.equal((await state()).barracks.level, 1);
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /100 gold/);
    assert.equal(await page.locator('#barracks-start-upgrade').isVisible(), false);
    await page.evaluate(() => window.barracksCheck.advance(30 * 60 * 1000));
    await page.locator('#collect-offline-rewards').click();
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /50 gold/);
    await fits();
    await page.screenshot({ path: fileURLToPath(new URL(`building-${width}.png`, output)) });
    await page.reload(); await ready();
    await upgrade();
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /50 gold/);
    const beforeFinish = await state();
    await page.locator('#barracks-finish-upgrade').click();
    assert.equal((await state()).gold, beforeFinish.gold - 50);
    assert.equal((await state()).barracks.firstLancerPending, true);
    assert.equal(await page.locator('#barracks-finish-upgrade').isVisible(), false);
    await fits();
    await page.screenshot({ path: fileURLToPath(new URL(`complete-${width}.png`, output)) });
    await page.locator('#barracks-go-market').click();
    assert.equal(await page.locator('#market-convert-label').innerText(), 'Lancer next');
    await page.locator('#open-market-info').click();
    assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
    assert.match(await page.locator('[data-recruit-type="lancer"]').innerText(), /20%/);
    await page.locator('#market-info-panel [data-close-overlay]').click();
    const beforeRecruit = await state();
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
    let current = await state();
    assert.equal(current.slaves, beforeRecruit.slaves - 1);
    assert.equal(current.barracks.firstLancerPending, false);
    assert.equal(current.reserve.at(-1).type, 'lancer', 'guarantee overrides a swordsman roll');
    assert.equal(current.reserve.at(-1).level, 1);
    await page.reload(); await ready();
    assert.equal((await state()).barracks.firstLancerPending, false);
    assert.equal(await page.locator('#market-convert-label').innerText(), 'Market');
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
    assert.equal((await state()).reserve.at(-1).type, 'swordsman', 'guarantee is not repeated');
    await page.locator('#open-barracks').click();
    const lancer = (await state()).reserve.find(unit => unit.type === 'lancer');
    await page.locator(`[data-barracks-unit-id="${lancer.id}"]`).click();
    assert.match(await page.locator('#barracks-detail').innerText(), /48/);
    await fits();
    assert.equal(await page.locator('#barracks-detail img').evaluate(img => img.complete && img.naturalWidth > 0), true);
    await page.screenshot({ path: fileURLToPath(new URL(`lancer-${width}.png`, output)) });
    await page.locator(`[data-barracks-recruit-id="${lancer.id}"]`).click();
    await page.locator('#army-map').press('Enter');
    assert.equal((await state()).units[0].type, 'lancer');
    await page.screenshot({ path: fileURLToPath(new URL(`formation-${width}.png`, output)) });
    await context.close();
  }

  // Expiry while closed unlocks without any further purchase, and only once.
  const context = await browser.newContext({ viewport: { width: 390, height: 700 } });
  await context.route('https://telegram.org/**', route => route.abort());
  await context.addInitScript(() => {
    const now = Date.now();
    if (localStorage.getItem('brotd-infinity:campaign:v2')) return;
    localStorage.setItem('brotd-infinity:campaign:v2', JSON.stringify({ campaignVersion: 3, gold: 17,
      starterSupplyGranted: true, autoWaves: false, autoWavesDefaultVersion: 1,
      economy: { slaves: 1, treasuryUpdatedAt: now },
      barracks: { level: 1, upgradeStartedAt: now - 3601000, upgradeReadyAt: now - 1000, firstLancerPending: false },
    }));
  });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.goto('http://127.0.0.1:5200/');
  await page.waitForFunction(() => window.barracksCheck?.ready());
  await page.evaluate(() => window.barracksCheck.freeze());
  assert.equal((await page.evaluate(() => window.barracksCheck.state())).barracks.level, 2);
  assert.equal((await page.evaluate(() => window.barracksCheck.state())).gold, 17);
  await page.reload();
  await page.waitForFunction(() => window.barracksCheck?.ready());
  assert.equal((await page.evaluate(() => window.barracksCheck.state())).gold, 17);
  await context.close();
  assert.deepEqual(failures, []);
  console.log(`Mobile Barracks checks passed at 320/390px: training gate, timer/reload/offline, proportional finish, guarantee, odds and Lancer placement. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
