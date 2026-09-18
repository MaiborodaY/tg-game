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
async function assertEqualUnlockedOdds(page) {
  for (const type of ['swordsman', 'archer', 'healer', 'lancer']) {
    const chance = page.locator(`#market-info-panel [data-recruit-type="${type}"] .recruitment-detail-heading > span`);
    assert.equal(await chance.innerText(), '25%', `${type} has an equal 25% chance after Barracks II`);
  }
}
let browser;
const failures = [];
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const { width, height } of [{ width: 320, height: 568 }, { width: 320, height: 700 }, { width: 390, height: 700 }]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
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
    const close = () => page.locator('#market-info-panel [data-close-overlay]').click();
    const upgrade = () => page.locator('#open-market-info').click();
    const lancerInfo = page.locator('#market-info-panel [data-recruit-type="lancer"]');
    const fits = async (panel = '#market-info-panel') => {
      const rect = await page.locator(`${panel} .menu-card`).evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
      });
      if (rect.scrollWidth > rect.clientWidth + 1 || rect.scrollHeight > rect.clientHeight + 1) {
        await page.screenshot({ path: fileURLToPath(new URL(`overflow-${width}x${height}.png`, output)) });
      }
      assert.ok(rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= height, `${panel} fits ${width}×${height} viewport`);
      assert.ok(rect.scrollWidth <= rect.clientWidth + 1 && rect.scrollHeight <= rect.clientHeight + 1, `${panel} needs no scrolling at ${width}×${height}: ${JSON.stringify(rect)}`);
    };
    const screenshot = name => page.screenshot({ path: fileURLToPath(new URL(`${name}-${width}x${height}.png`, output)) });
    await page.goto('http://127.0.0.1:5200/');
    await ready();
    assert.equal(await page.locator('#barracks-upgrade-toggle, #barracks-upgrade-details').count(), 0, 'old Barracks upgrade entry is removed');
    assert.equal(await page.locator('#barracks-panel #barracks-start-upgrade').count(), 0);
    await page.locator('#open-barracks').click();
    assert.equal(await page.locator('#barracks-list').isVisible(), true, 'Barracks still opens its reserve inventory');
    await page.locator('#barracks-panel [data-close-overlay]').click();
    await upgrade();
    assert.equal(await page.locator('#market-info-panel [data-recruit-type]').count(), 4, 'Info always contains all four fighter types');
    assert.equal(await lancerInfo.isVisible(), true, 'locked Lancer is discoverable in Info');
    assert.match(await lancerInfo.innerText(), /Locked/);
    assert.equal(await lancerInfo.locator('#lancer-recruitment-chance').innerText(), 'Locked', 'locked Lancer must not advertise an active recruitment chance');
    assert.equal(await page.locator('#barracks-start-upgrade').isVisible(), false, 'show requirement instead of purchase before unlock');
    assert.equal(await page.locator('#barracks-start-upgrade').isDisabled(), true, 'merged personal level must not unlock');
    assert.match(await page.locator('#barracks-upgrade-state').innerText(), /Swordsman.*Lv\. 5.*now Lv\. 4/);
    await fits();
    await screenshot('locked');
    await close();
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
    assert.equal((await state()).recruitment.received.swordsman, 50);
    assert.equal((await state()).units[0].level, 50, 'training does not alter an existing fighter');
    await upgrade();
    assert.equal(await page.locator('#barracks-start-upgrade').isEnabled(), true);
    assert.match(await page.locator('#barracks-start-upgrade').innerText(), /Barracks II.*200 gold/);
    assert.equal(await lancerInfo.locator('#barracks-start-upgrade').count(), 1, 'upgrade action lives beside Lancer');
    await fits();
    await screenshot('available');
    await page.locator('#barracks-start-upgrade').click();
    assert.equal((await state()).gold, 800);
    assert.equal((await state()).barracks.level, 1);
    const startedAt = (await state()).barracks.upgradeStartedAt;
    await page.locator('#barracks-start-upgrade').evaluate(button => button.click());
    assert.equal((await state()).gold, 800, 'repeat start click cannot charge twice');
    assert.equal((await state()).barracks.upgradeStartedAt, startedAt, 'repeat start cannot reset the timer');
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /100 gold/);
    assert.equal(await page.locator('#barracks-start-upgrade').isVisible(), false);
    const initialCountdown = await page.locator('#barracks-upgrade-state').innerText();
    await page.evaluate(() => window.barracksCheck.advance(37 * 1000));
    assert.equal(await page.locator('#market-info-panel').isVisible(), true, 'Info remains open while time passes');
    assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false, 'foreground tick does not create an offline receipt');
    assert.notEqual(await page.locator('#barracks-upgrade-state').innerText(), initialCountdown, 'countdown refreshes in place');
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /99 gold/);
    assert.equal(await page.locator('#barracks-upgrade-progress').evaluate(progress => progress.value), 37000);
    await page.evaluate(() => window.barracksCheck.advance((30 * 60 - 37) * 1000));
    await page.locator('#collect-offline-rewards').click();
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /50 gold/);
    await fits();
    await screenshot('building');
    await page.reload(); await ready();
    await upgrade();
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /50 gold/);
    const beforeFinish = await state();
    await page.locator('#barracks-finish-upgrade').click();
    assert.equal((await state()).gold, beforeFinish.gold - 50);
    assert.equal((await state()).barracks.firstLancerPending, true);
    assert.equal(await page.locator('#barracks-finish-upgrade').isVisible(), false);
    await page.locator('#barracks-finish-upgrade').evaluate(button => button.click());
    assert.equal((await state()).gold, beforeFinish.gold - 50, 'repeat finish click cannot charge twice');
    assert.equal(await page.locator('#lancer-recruitment-training').isVisible(), true, 'unlocked Lancer shows normal training progress');
    await assertEqualUnlockedOdds(page);
    assert.doesNotMatch(await lancerInfo.innerText(), /Locked/);
    await fits();
    await screenshot('complete');
    await page.locator('#barracks-go-market').click();
    assert.equal(await page.locator('#market-convert-label').innerText(), 'Lancer next');
    await page.locator('#open-market-info').click();
    assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
    await assertEqualUnlockedOdds(page);
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
    await upgrade();
    assert.equal(await page.locator('#recruitment-guarantee').isVisible(), false);
    assert.equal(await page.locator('#barracks-go-market').isVisible(), false, 'consumed guarantee leaves a normal recruitment row');
    assert.equal(await page.locator('#lancer-recruitment-training').isVisible(), true);
    await assertEqualUnlockedOdds(page);
    await fits();
    await screenshot('recruited-info');
    await close();
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
    assert.equal((await state()).reserve.at(-1).type, 'swordsman', 'guarantee is not repeated');
    await page.locator('#open-barracks').click();
    const lancer = (await state()).reserve.find(unit => unit.type === 'lancer');
    await page.locator(`[data-barracks-unit-id="${lancer.id}"]`).click();
    assert.match(await page.locator('#barracks-detail').innerText(), /48/);
    await fits('#barracks-panel');
    assert.equal(await page.locator('#barracks-detail img').evaluate(img => img.complete && img.naturalWidth > 0), true);
    await screenshot('lancer');
    await page.locator(`[data-barracks-recruit-id="${lancer.id}"]`).click();
    await page.locator('#army-map').press('Enter');
    assert.equal((await state()).units[0].type, 'lancer');
    await screenshot('formation');
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
  await page.locator('#open-market-info').click();
  await assertEqualUnlockedOdds(page);
  assert.equal(await page.locator('#lancer-recruitment-training').isVisible(), true);
  assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
  await page.reload();
  await page.waitForFunction(() => window.barracksCheck?.ready());
  assert.equal((await page.evaluate(() => window.barracksCheck.state())).gold, 17);
  await page.locator('#open-market-info').click();
  await assertEqualUnlockedOdds(page);
  await context.close();
  assert.deepEqual(failures, []);
  console.log(`Mobile Market Info checks passed at 320×568, 320×700 and 390×700: visible locked Lancer, training gate, inline upgrade, live timer/reload/offline, proportional finish, no duplicate charges, guarantee, odds and Lancer placement. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
