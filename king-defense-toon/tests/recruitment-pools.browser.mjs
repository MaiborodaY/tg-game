// Mobile recruitment checks use isolated saves and a frozen frame loop, but keep the
// real economy tick active so income-triggered UI refreshes cannot hide pool changes.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
const baseUrl = 'http://127.0.0.1:5206/';
const previewPortraits = ['elf-archer.webp', 'unicorn.webp'];
const humanTypes = ['swordsman', 'archer', 'healer', 'lancer'];
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/recruitment-pools/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5206, strictPort: true },
  plugins: [{ name: 'recruitment-pool-check-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    code = prependFunctionBody(code, 'tickEconomy', 'window.recruitmentTickCalls = (window.recruitmentTickCalls ?? 0) + 1;');
    return code + `\nwindow.recruitmentCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
      primeIncome: () => { economy.treasuryProgress = .999; economyLastTick = performance.now() - 100; },
      tickCalls: () => window.recruitmentTickCalls ?? 0,
    };`;
  } }],
});

function fixture(overrides = {}) {
  return {
    campaignVersion: 3, gold: 5000, starterSupplyGranted: true, marketHintCompleted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    barracks: { level: 3, firstLancerPending: true },
    recruitment: { version: 2, received: { swordsman: 53, archer: 8, healer: 6, lancer: 51 } },
    units: ['swordsman', 'archer', 'healer'].map((type, row) => ({ id: row + 1, type, level: 2, col: 2, row })),
    reserve: [{ id: 4, type: 'lancer', level: 3 }],
    progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
    economy: { slaves: 5, treasuryUpdatedAt: now }, ...overrides,
  };
}
const state = page => page.evaluate(() => window.recruitmentCheck.state());
const close = (page, panel = 'market-info-panel') => page.locator(`#${panel} [data-close-overlay]`).click();
const open = page => page.locator('#open-market-info').click();
const pool = page => page.locator('#recruitment-pool');
const recruitmentInventory = save => ({ units: save.units, reserve: save.reserve, recruitment: save.recruitment,
  firstLancerPending: save.barracks.firstLancerPending, slaves: save.economy.slaves });
const humanProgress = save => humanTypes.map(type => [type, save.recruitment.received[type], save.recruitment.legacyTrainingCredit[type]]);
const restoredInventory = save => ({ ...recruitmentInventory(save),
  // Campaign restore assigns fresh compact IDs; personal stats and placement are durable.
  units: save.units.map(({ id, ...unit }) => unit), reserve: save.reserve.map(({ id, ...unit }) => unit) });

async function tapCell(page, col, row) {
  const point = await page.locator('#army-map').evaluate((canvas, { col, row, field, view }) => {
    const bounds = canvas.getBoundingClientRect(), scale = Number(canvas.dataset.worldScale);
    return {
      x: bounds.x + Number(canvas.dataset.worldOffsetX) + (field.gridX + (col + .5) * field.cellWidth) * scale,
      y: bounds.y + (bounds.height - view.height * scale) / 2 + (field.gridY + (row + .5) * field.cellHeight - view.y) * scale,
    };
  }, { col, row, field: FIELD, view: FORMATION_VIEW });
  await page.touchscreen.tap(point.x, point.y);
}

async function recruit(page) {
  await page.locator('#transform-slave').click();
  await page.waitForFunction(() => !document.querySelector('#open-barracks').disabled);
  return (await state(page)).reserve.at(-1);
}

async function unitDetails(page, id) {
  await page.locator('#open-barracks').click();
  await page.locator(`[data-barracks-unit-id="${id}"]`).click();
  await page.locator('#barracks-detail img').evaluate(img => img.decode());
}

async function ready(page) {
  await page.waitForFunction(() => window.recruitmentCheck?.ready());
  await page.evaluate(async () => { window.recruitmentCheck.freeze(); await document.fonts.ready; });
}

async function fits(page, panel = '#market-info-panel') {
  const issues = await page.locator(`${panel} .menu-card`).evaluate(card => {
    const bounds = card.getBoundingClientRect(), bad = [];
    if (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1) bad.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1) bad.push(`card overflow: ${card.scrollWidth}x${card.scrollHeight} inside ${card.clientWidth}x${card.clientHeight}`);
    for (const element of card.querySelectorAll('.recruitment-detail-copy, .recruitment-pool-field')) {
      if (element.getClientRects().length && element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className}: horizontal overflow`);
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Recruitment fits the mobile viewport without scrolling');
}

async function assertHumanOdds(page, level) {
  const expected = level >= 2 ? ['25%', '25%', '25%', '25%'] : ['60%', '25%', '15%', 'Locked'];
  for (const [index, type] of ['swordsman', 'archer', 'healer', 'lancer'].entries()) {
    assert.equal(await page.locator(`[data-recruit-type="${type}"] .recruitment-detail-heading > span`).innerText(), expected[index]);
  }
}

let browser;
const checks = [];
async function scenario(name, width, saved, check, height = width === 320 ? 640 : 700) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  const errors = [], requestedPortraits = new Set();
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ saved, key, now }) => {
      Date.now = () => now;
      if (!sessionStorage.getItem('__recruitment-pools-seeded')) {
        localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem('__recruitment-pools-seeded', '1');
      }
    }, { saved, key, now });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('request', request => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.includes('/assets/recruitment/') && pathname.endsWith('.webp')) requestedPortraits.add(pathname.split('/').at(-1));
    });
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl); await ready(page);
    await check(page, requestedPortraits);
    assert.deepEqual(errors, [], 'No browser or local asset errors');
    checks.push(`${name} ${width}x${height}`);
    console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`recruitment-${name}-FAILED-${width}.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [390, 320]) {
    for (const level of [1, 2]) {
      await scenario(`barracks-${level}-locked`, width, fixture({ barracks: { level, firstLancerPending: level === 2 } }), async (page, requested) => {
        assert.equal((await state(page)).recruitmentPool, 'humans', 'Older saves default to Humans');
        await open(page);
        assert.equal(await pool(page).inputValue(), 'humans');
        assert.equal(await page.locator('#recruitment-pool-elves').isDisabled(), true);
        assert.match(await page.locator('#recruitment-pool-status').innerText(), /after Barracks III is built/);
        await assertHumanOdds(page, level);
        const before = recruitmentInventory(await state(page));
        // A stale or scripted selection must obey the same gate as the disabled option.
        await pool(page).evaluate(select => { select.value = 'elves'; select.dispatchEvent(new Event('change', { bubbles: true })); });
        assert.equal((await state(page)).recruitmentPool, 'humans');
        assert.equal(await pool(page).inputValue(), 'humans');
        assert.deepEqual(recruitmentInventory(await state(page)), before);
        assert.equal(previewPortraits.some(file => requested.has(file)), false, 'Locked previews do not load planned elf portraits');
        await fits(page);
      });
    }

    await scenario('pending-third-unlocks-on-completion', width, fixture({ barracks: {
      level: 2, firstLancerPending: false, upgradeStartedAt: now, upgradeReadyAt: now + 3 * 60 * 60 * 1000,
    } }), async page => {
      await open(page);
      assert.equal(await page.locator('#recruitment-pool-elves').isDisabled(), true);
      assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /300 gold/);
      await fits(page);
      await page.locator('#barracks-finish-upgrade').click();
      assert.equal((await state(page)).barracks.level, 3);
      assert.equal((await state(page)).gold, 4700);
      assert.equal(await page.locator('#recruitment-pool-elves').isEnabled(), true);
      await pool(page).selectOption('elves');
      assert.equal((await state(page)).recruitmentPool, 'elves');
      assert.equal(await page.locator('#elf-recruitment-details').isVisible(), true);
      await fits(page);
    });

    await scenario('rider-recruit-deploy-connect-sell-and-humans', width, fixture(), async (page, requested) => {
      const opener = page.locator('#open-market-info');
      assert.equal(await opener.locator('svg').count(), 1);
      assert.equal((await opener.innerText()).trim(), 'Recruits', 'Entry uses a recruit illustration instead of the old letter i');
      assert.match(await opener.getAttribute('aria-label'), /Recruitment/);
      assert.equal(previewPortraits.some(file => requested.has(file)), false);
      if (width === 390) await page.locator('.army-dock').screenshot({ path: fileURLToPath(new URL('recruitment-icon-390.png', output)) });
      await open(page);
      await assertHumanOdds(page, 3);
      assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
      const humanText = await page.locator('#recruitment-details').innerText();
      const original = await state(page);
      assert.equal(previewPortraits.some(file => requested.has(file)), false, 'Human roster does not fetch planned elf portraits');
      assert.equal(await page.locator('#elf-recruitment-details').locator('img').count(), 0);
      assert.equal(original.recruitment.received.pantherRider, 0, 'Old human progress grants no elven training');
      await page.evaluate(() => window.recruitmentCheck.primeIncome());
      const ticks = await page.evaluate(() => window.recruitmentCheck.tickCalls());
      await pool(page).selectOption('elves');
      assert.ok(await page.evaluate(() => window.recruitmentCheck.tickCalls()) > ticks, 'Selection executes the real economy tick');
      assert.equal((await state(page)).gold, original.gold + 1, 'The tick actually triggers an income refresh');
      assert.equal((await state(page)).recruitmentPool, 'elves', 'Income refresh cannot revert the requested pool');
      assert.equal(await pool(page).inputValue(), 'elves');
      assert.equal(await page.locator('#recruitment-details').isVisible(), false);
      assert.equal(await page.locator('#recruitment-guarantee').isVisible(), false);
      assert.deepEqual(await page.locator('[data-elf-recruit]').evaluateAll(cards => cards.map(card => card.dataset.elfRecruit)), ['pantherRider', 'elfArcher', 'elfHealer', 'unicorn']);
      assert.equal(await page.locator('[data-elf-recruit="elfHealer"] svg').count(), 1);
      assert.equal(await page.locator('[data-elf-recruit="elfHealer"] img').count(), 0);
      assert.match(await page.locator('[data-elf-recruit="elfHealer"]').innerText(), /Coming soon.*Not in the Market yet/s);
      assert.match(await page.locator('[data-elf-recruit="elfArcher"]').innerText(), /Coming soon.*Not in the Market yet/s);
      const riderCard = page.locator('[data-elf-recruit="pantherRider"]');
      assert.equal(await riderCard.locator('.recruitment-detail-heading > span').innerText(), '100%');
      assert.match(await riderCard.innerText(), /Recruitment level · Lv\. 1/);
      assert.match(await riderCard.innerText(), /5 more riders → Lv\. 2/);
      assert.match(await page.locator('[data-elf-recruit="unicorn"]').getAttribute('class'), /is-locked/);
      assert.match(await page.locator('[data-elf-recruit="unicorn"]').innerText(), /Locked.*Special.*Unlocks later/s);
      assert.equal(await page.locator('[data-elf-recruit] button').count(), 0, 'Recruitment remains the Market action');
      assert.equal(await page.locator('#elf-recruitment-details img').count(), 3);
      await page.locator('#elf-recruitment-details img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert.equal(previewPortraits.every(file => requested.has(file)), true);
      assert.equal(await page.locator('#elf-recruitment-details img').evaluateAll(images => images.every(image => image.loading === 'lazy' && image.naturalWidth > 0)), true);
      assert.deepEqual(recruitmentInventory(await state(page)), recruitmentInventory(original), 'Changing the pool never consumes resources or alters training');
      await fits(page);
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL('recruitment-elves-390.png', output)) });

      // With Elves selected, close and select are the only controls: focus wraps in both directions.
      await pool(page).focus(); await page.keyboard.press('Tab');
      assert.equal(await page.locator('#market-info-panel [data-close-overlay]').evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await pool(page).evaluate(node => node === document.activeElement), true);
      await close(page);
      assert.equal(await opener.evaluate(node => node === document.activeElement), true);
      assert.equal(await page.locator('#market-convert-label').innerText(), 'Elves');
      const riders = [];
      for (let index = 0; index < 3; index++) {
        const before = await state(page);
        const rider = await recruit(page);
        riders.push(rider);
        assert.equal(rider.type, 'pantherRider');
        assert.equal(rider.level, 1);
        const after = await state(page);
        assert.equal(after.reserve.length, before.reserve.length + 1);
        assert.equal(after.economy.slaves, before.economy.slaves - 1);
        assert.equal(after.gold, before.gold, 'Recruitment costs a slave, never gold');
        assert.equal(after.recruitment.received.pantherRider, index + 1);
        assert.deepEqual(humanProgress(after), humanProgress(original));
        assert.equal(after.barracks.firstLancerPending, true, 'Elven recruitment cannot consume the human Lancer guarantee');
        assert.equal(await page.locator('#market-info-panel').isVisible(), false);
      }
      let current = await state(page);
      await page.reload(); await ready(page);
      assert.deepEqual(await state(page).then(recruitmentInventory), recruitmentInventory(current), 'Recruit cost, saved reserve and training reload together');
      assert.equal((await state(page)).recruitmentPool, 'elves');
      await unitDetails(page, riders[0].id);
      assert.equal(await page.locator('#barracks-title').innerText(), 'Unit details');
      assert.match(await page.locator('#barracks-detail').innerText(), /Panther Rider.*Lv\. 1/s);
      assert.deepEqual(await page.locator('#barracks-detail .barracks-detail-stats strong').allTextContents(), ['90', '9']);
      assert.equal(await page.locator(`[data-barracks-merge-id="${riders[0].id}"]`).isDisabled(), true, 'Other unit types are not Connect targets');
      await fits(page, '#barracks-panel');
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL('rider-details-390.png', output)) });
      await page.locator(`[data-barracks-recruit-id="${riders[0].id}"]`).click();
      await tapCell(page, 2, 2);
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === riders[0].id)?.type, 'pantherRider');
      assert.equal(current.reserve.some(unit => unit.id === riders[0].id), false);
      assert.equal(current.reserve.some(unit => unit.type === 'healer'), true, 'The replaced fighter safely returns to reserve');
      await tapCell(page, 2, 2);
      assert.match(await page.locator('#selection-panel .selected-stats').innerText(), /90 HP · 9 attack/);
      await fits(page, '#unit-panel');
      await close(page, 'unit-panel');

      await unitDetails(page, riders[1].id);
      await page.locator(`[data-barracks-merge-id="${riders[1].id}"]`).click();
      const beforeConnect = await state(page);
      await tapCell(page, 2, 0);
      assert.deepEqual(recruitmentInventory(await state(page)), recruitmentInventory(beforeConnect), 'Wrong-type Connect never consumes either fighter');
      await tapCell(page, 2, 2);
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === riders[0].id).level, 2);
      assert.equal(current.reserve.some(unit => unit.id === riders[1].id), false);
      assert.equal(current.recruitment.received.pantherRider, 3, 'Connect changes personal level only');
      assert.equal(current.gold, beforeConnect.gold);
      await unitDetails(page, riders[2].id);
      const goldBeforeSell = (await state(page)).gold;
      await page.locator(`[data-barracks-sell-id="${riders[2].id}"]`).click();
      assert.equal((await state(page)).gold, goldBeforeSell + 1);
      assert.equal((await state(page)).reserve.some(unit => unit.id === riders[2].id), false);
      await close(page, 'barracks-panel');
      current = await state(page);
      await page.reload(); await ready(page);
      assert.equal((await state(page)).recruitmentPool, 'elves');
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(current));
      assert.equal((await state(page)).gold, current.gold);
      await page.locator('#start-wave').click();
      const fighters = await page.evaluate(() => window.recruitmentCheck.battle().allies);
      assert.deepEqual(fighters.map(unit => unit.type), ['swordsman', 'archer', 'pantherRider']);
      const mounted = fighters.find(unit => unit.type === 'pantherRider');
      assert.equal(mounted.level, 2); assert.equal(mounted.maxHp, 95); assert.equal(mounted.damage, 9);
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL('rider-battle-390.png', output)) });
      await page.reload(); await ready(page);
      await open(page);
      assert.equal(await pool(page).inputValue(), 'elves');
      assert.match(await riderCard.innerText(), /2 more riders → Lv\. 2/);
      await pool(page).selectOption('humans');
      assert.equal((await state(page)).recruitmentPool, 'humans');
      assert.equal(await page.locator('#elf-recruitment-details').isVisible(), false);
      assert.equal(await page.locator('#recruitment-details').innerText(), humanText);
      assert.equal(await page.locator('#recruitment-guarantee').isVisible(), true);
      await assertHumanOdds(page, 3);
      assert.deepEqual(humanProgress(await state(page)), humanProgress(original));
      await fits(page);
      await close(page);
      assert.equal(await page.locator('#market-convert-label').innerText(), 'Lancer next');
      const guaranteed = await recruit(page);
      assert.equal(guaranteed.type, 'lancer', 'Returning to Humans still consumes the original guarantee exactly once');
      assert.equal((await state(page)).barracks.firstLancerPending, false);
      assert.equal((await state(page)).recruitment.received.pantherRider, 3);
      await open(page);
      await pool(page).selectOption('elves');
      await close(page);
      await page.locator('#open-profile').click();
      await page.locator('#reset').click(); await page.locator('#reset').click();
      assert.equal((await state(page)).recruitmentPool, 'humans');
      await page.reload(); await ready(page);
      assert.equal((await state(page)).recruitmentPool, 'humans', 'Reset persists the default pool');
    });
  }

  await scenario('no-slaves-short-phone', 320, fixture({ recruitmentPool: 'elves',
    economy: { slaves: 0, treasuryUpdatedAt: now } }), async page => {
    const before = recruitmentInventory(await state(page));
    assert.equal(await page.locator('#transform-slave').isDisabled(), true);
    await page.locator('#transform-slave').evaluate(button => button.click());
    assert.deepEqual(recruitmentInventory(await state(page)), before, 'An empty Market cannot create or charge a fighter');
    await open(page);
    assert.equal(await pool(page).inputValue(), 'elves');
    assert.equal(await page.locator('[data-elf-recruit="pantherRider"] .recruitment-detail-heading > span').innerText(), '100%');
    assert.equal(await page.locator('#recruitment-info-note').isVisible(), true);
    await fits(page);
    await page.screenshot({ path: fileURLToPath(new URL('rider-roster-320x568.png', output)) });
  }, 568);

  for (const [name, recruitmentPool, level] of [['invalid-string', 'orcs', 3], ['invalid-object', { pool: 'elves' }, 3], ['locked-saved-elves', 'elves', 2]]) {
    await scenario(name, 390, fixture({ recruitmentPool, barracks: { level, firstLancerPending: false } }), async (page, requested) => {
      assert.equal((await state(page)).recruitmentPool, 'humans');
      await open(page);
      assert.equal(await pool(page).inputValue(), 'humans');
      assert.equal(previewPortraits.some(file => requested.has(file)), false);
      await page.reload(); await ready(page);
      assert.equal((await state(page)).recruitmentPool, 'humans');
    });
  }
  console.log(JSON.stringify({ ok: true, checks, screenshots: ['recruitment-elves-390.png', 'recruitment-icon-390.png', 'rider-details-390.png', 'rider-battle-390.png'].map(file => fileURLToPath(new URL(file, output))) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
