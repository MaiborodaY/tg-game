// Mobile recruitment checks use isolated saves and a frozen frame loop, but keep the
// real economy tick active so income-triggered UI refreshes cannot hide pool changes.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
let baseUrl;
const previewPortraits = ['elf-archer.webp', 'elf-healer.webp', 'unicorn.webp'];
const humanTypes = ['swordsman', 'archer', 'healer', 'lancer'];
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/recruitment-pools/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'recruitment-pool-check-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    code = prependFunctionBody(code, 'tickEconomy', 'window.recruitmentTickCalls = (window.recruitmentTickCalls ?? 0) + 1;');
    return code + `
window.recruitmentCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
      render: async () => { await scene.prepare({ units: campaign.units, battle }); renderScene(); },
      step: seconds => { for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 1 / 60) updateBattle(battle, 1 / 60); refreshBattleHud(); },
      untilProjectile: type => { for (let step = 0; step < 1800 && battle.phase === 'running'; step++) {
        if (battle.projectiles.some(projectile => projectile.type === 'arrow' && projectile.sourceType === type)) break;
        updateBattle(battle, 1 / 60);
      } refreshBattleHud(); },
      untilElfHeal: () => {
        // A controlled wound exercises real targeting, movement, cast timing and HP resolution.
        const patient = battle.allies.find(unit => unit.type === 'swordsman'); patient.hp = patient.maxHp - 10;
        for (let step = 0; step < 1800 && battle.phase === 'running'; step++) {
          if (battle.effects.some(effect => effect.type === 'heal' && effect.sourceType === 'elfHealer')) break;
          updateBattle(battle, 1 / 60);
        } refreshBattleHud();
      },
      primeIncome: () => { campaign.economy.treasuryProgress = .999; economyLastTick = performance.now() - 100; },
      tickCalls: () => window.recruitmentTickCalls ?? 0,
      refresh: () => refresh(),
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
const restoredInventory = save => ({ ...recruitmentInventory(save), nextUnitId: save.nextUnitId });

async function cellPoint(page, col, row) {
  return page.locator('#army-map').evaluate((canvas, { col, row, field, view }) => {
    const bounds = canvas.getBoundingClientRect(), scale = Number(canvas.dataset.worldScale);
    return {
      x: bounds.x + Number(canvas.dataset.worldOffsetX) + (field.gridX + (col + .5) * field.cellWidth) * scale,
      y: bounds.y + (bounds.height - view.height * scale) / 2 + (field.gridY + (row + .5) * field.cellHeight - view.y) * scale,
    };
  }, { col, row, field: FIELD, view: FORMATION_VIEW });
}
async function tapCell(page, col, row) {
  const point = await cellPoint(page, col, row);
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
  if (process.env.BROTD_BROWSER_FILTER && !new RegExp(process.env.BROTD_BROWSER_FILTER).test(name)) return;
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
  baseUrl = await listenBrowserServer(server);
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

    await scenario('rider-recruit-deploy-connect-sell-and-humans', width, fixture({
      progression: { unlockedCells: ['2:0', '2:1', '2:2', '3:2'], firstClears: [] },
    }), async (page, requested) => {
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
      assert.equal(await page.locator('[data-elf-recruit="elfHealer"] svg').count(), 0);
      assert.equal(await page.locator('[data-elf-recruit="elfHealer"] img').count(), 1);
      assert.match(await page.locator('[data-elf-recruit="elfHealer"] img').getAttribute('src'), /elf-healer\.webp/);
      assert.match(await page.locator('[data-elf-recruit="elfHealer"]').innerText(), /Locked.*Elven Archer recruitment Lv\. 3/s);
      assert.match(await page.locator('[data-elf-recruit="elfArcher"]').innerText(), /Locked.*Panther Rider recruitment Lv\. 3/s);
      const riderCard = page.locator('[data-elf-recruit="pantherRider"]');
      assert.equal(await riderCard.locator('.recruitment-detail-heading > span').innerText(), '100%');
      assert.match(await riderCard.innerText(), /Recruitment level · Lv\. 1/);
      assert.match(await riderCard.innerText(), /5 more riders → Lv\. 2/);
      assert.match(await page.locator('[data-elf-recruit="unicorn"]').getAttribute('class'), /is-locked/);
      assert.match(await page.locator('[data-elf-recruit="unicorn"]').innerText(), /Locked.*Panther Rider recruitment Lv\. 5.*Barracks IV · 2 tiles/s);
      assert.equal(await page.locator('[data-elf-recruit] button:visible').count(), 0, 'Recruitment remains the Market action; IV construction stays locked');
      assert.equal(await page.locator('#elf-recruitment-details img').count(), 4);
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
      await page.evaluate(() => { Math.random = () => .1; });
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
      assert.equal(await page.locator('#barracks-detail [data-connect-action="begin"]').isEnabled(), true, 'Matching reserve fighters can donate to this reserve recipient');
      await fits(page, '#barracks-panel');
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL('rider-details-390.png', output)) });
      await page.locator(`[data-barracks-recruit-id="${riders[0].id}"]`).click();
      await tapCell(page, 2, 2);
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === riders[0].id)?.type, 'pantherRider');
      assert.equal(current.reserve.some(unit => unit.id === riders[0].id), false);
      assert.equal(current.reserve.some(unit => unit.type === 'healer'), true, 'The replaced fighter safely returns to reserve');
      await tapCell(page, 3, 2);
      assert.match(await page.locator('#selection-panel .selected-stats').innerText(), /90 HP · 9 attack/);
      await fits(page, '#unit-panel');
      await close(page, 'unit-panel');

      await tapCell(page, 3, 2);
      const beforeConnect = await state(page);
      assert.deepEqual(await page.locator('[data-connect-donor-id]:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.connectDonorId))), [riders[1].id, riders[2].id], 'Other types are excluded from donors');
      await page.locator(`[data-connect-donor-id="${riders[1].id}"]:visible`).click();
      await page.locator('[data-connect-action="apply"]:visible').click();
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === riders[0].id).level, 2);
      assert.equal(current.reserve.some(unit => unit.id === riders[1].id), false);
      assert.equal(current.recruitment.received.pantherRider, 3, 'Connect changes personal level only');
      assert.equal(current.gold, beforeConnect.gold);
      await close(page, 'unit-panel');
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
      assert.equal(mounted.range,75);
      await page.evaluate(() => window.recruitmentCheck.untilProjectile('pantherRider'));
      const fighting=await page.evaluate(() => window.recruitmentCheck.battle());
      assert.ok(fighting.projectiles.some(projectile=>projectile.type==='arrow'&&projectile.sourceType==='pantherRider'));
      assert.equal(fighting.allies.find(unit=>unit.type==='pantherRider').action,'shoot');
      await page.evaluate(() => window.recruitmentCheck.render());
      await page.screenshot({ path: fileURLToPath(new URL(`rider-battle-${width}.png`, output)) });
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

  for (const width of [390, 320]) {
    await scenario('elf-archer-recruit-connect-deploy-shoot-save', width, fixture({
      recruitmentPool: 'elves',
      recruitment: { version: 2, received: { swordsman: 53, archer: 8, healer: 6, lancer: 51, pantherRider: 15, elfArcher: 4 } },
      reserve: [{ id: 4, type: 'elfArcher', level: 50 }, { id: 5, type: 'elfArcher', level: 2 },
        { id: 6, type: 'archer', level: 3 }, { id: 7, type: 'pantherRider', level: 2 }],
    }), async page => {
      const original = await state(page);
      await open(page);
      const archerCard = page.locator('[data-elf-recruit="elfArcher"]');
      assert.match(await archerCard.innerText(), /50%.*1 more elven archer → Lv\. 2/s);
      await close(page);
      await page.evaluate(() => { Math.random = () => .75; });
      const recruited = await recruit(page);
      assert.equal(recruited.type, 'elfArcher');
      assert.equal(recruited.level, 2, 'Fifth receipt grants the new recruitment level');
      assert.equal((await state(page)).economy.slaves, original.economy.slaves - 1);
      assert.equal((await state(page)).gold, original.gold);
      assert.deepEqual(humanProgress(await state(page)), humanProgress(original));
      assert.equal((await state(page)).barracks.firstLancerPending, true);
      assert.equal((await state(page)).reserve.find(unit => unit.id === 4).level, 50, 'Older units retain personal levels');
      await open(page);
      assert.match(await archerCard.innerText(), /Recruitment level · Lv\. 2.*10 more elven archers/s);
      await fits(page); await close(page);
      await unitDetails(page, 4);
      assert.match(await page.locator('#barracks-detail').innerText(), /Elven Archer.*Lv\. 50/s);
      await fits(page, '#barracks-panel');
      await page.locator('#barracks-detail [data-connect-action="begin"]').click();
      assert.deepEqual(await page.locator('[data-connect-donor-id]:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.connectDonorId))),
        [5, recruited.id], 'Only elven archers can connect; human archers and Riders are excluded');
      for (const id of [5, recruited.id]) await page.locator(`[data-connect-donor-id="${id}"]:visible`).click();
      await page.locator('[data-connect-action="apply"]:visible').click();
      assert.equal((await state(page)).reserve.find(unit => unit.id === 4).level, 54);
      assert.equal((await state(page)).recruitment.received.elfArcher, 5);
      await page.locator('[data-connect-action="cancel"]:visible').click();
      await page.locator('[data-barracks-recruit-id="4"]').click();
      await tapCell(page, 2, 1);
      const deployed = await state(page);
      assert.equal(deployed.units.find(unit => unit.id === 4).type, 'elfArcher');
      assert.equal(deployed.units.length, original.units.length, 'Archer needs one cell, including isolated purchased cells');
      assert.equal(deployed.reserve.some(unit => unit.id === 2 && unit.type === 'archer'), true);
      await tapCell(page, 2, 1);
      assert.match(await page.locator('#selection-panel .selected-stats').innerText(), /164 HP · 40 attack/);
      await fits(page, '#unit-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`elf-archer-details-${width}.png`, output)) });
      await close(page, 'unit-panel');
      const beforeReload = await state(page);
      await page.reload(); await ready(page);
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(beforeReload));
      await page.locator('#start-wave').click();
      await page.evaluate(() => window.recruitmentCheck.untilProjectile('elfArcher'));
      const battle = await page.evaluate(() => window.recruitmentCheck.battle());
      const elf = battle.allies.find(unit => unit.type === 'elfArcher');
      assert.equal(elf.level, 54); assert.equal(elf.maxHp, 164); assert.equal(elf.damage, 40);
      assert.equal(elf.action, 'shoot');
      assert.equal(battle.projectiles.filter(effect => effect.type === 'arrow' && effect.sourceType === 'elfArcher').length, 1);
      await page.evaluate(() => window.recruitmentCheck.render());
      await page.screenshot({ path: fileURLToPath(new URL(`elf-archer-battle-${width}.png`, output)) });
      const enemyHp = battle.enemies.reduce((sum, unit) => sum + unit.hp, 0);
      await page.evaluate(() => window.recruitmentCheck.step(.5));
      const afterHit = await page.evaluate(() => window.recruitmentCheck.battle());
      assert.ok(afterHit.enemies.reduce((sum, unit) => sum + unit.hp, 0) < enemyHp || afterHit.kills > battle.kills);
    });
    await scenario('elf-healer-recruit-connect-deploy-heal-save', width, fixture({
      recruitmentPool: 'elves',
      recruitment: { version: 2, received: { swordsman: 53, archer: 8, healer: 6, lancer: 51, pantherRider: 15, elfArcher: 15, elfHealer: 4 } },
      reserve: [{ id: 4, type: 'elfHealer', level: 50 }, { id: 5, type: 'elfHealer', level: 2 },
        { id: 6, type: 'healer', level: 3 }, { id: 7, type: 'pantherRider', level: 2 }],
    }), async page => {
      const original = await state(page);
      await open(page);
      const archerCard = page.locator('[data-elf-recruit="elfHealer"]');
      assert.match(await archerCard.innerText(), /33\.3%.*1 more elven healer → Lv\. 2/s);
      await close(page);
      await page.evaluate(() => { Math.random = () => .75; });
      const recruited = await recruit(page);
      assert.equal(recruited.type, 'elfHealer');
      assert.equal(recruited.level, 2, 'Fifth receipt grants the new recruitment level');
      assert.equal((await state(page)).economy.slaves, original.economy.slaves - 1);
      assert.equal((await state(page)).gold, original.gold);
      assert.deepEqual(humanProgress(await state(page)), humanProgress(original));
      assert.equal((await state(page)).barracks.firstLancerPending, true);
      assert.equal((await state(page)).reserve.find(unit => unit.id === 4).level, 50, 'Older units retain personal levels');
      await open(page);
      assert.match(await archerCard.innerText(), /Recruitment level · Lv\. 2.*10 more elven healers/s);
      await fits(page); await close(page);
      await unitDetails(page, 4);
      assert.match(await page.locator('#barracks-detail').innerText(), /Elven Healer.*Lv\. 50/s);
      await fits(page, '#barracks-panel');
      await page.locator('#barracks-detail [data-connect-action="begin"]').click();
      assert.deepEqual(await page.locator('[data-connect-donor-id]:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.connectDonorId))),
        [5, recruited.id], 'Only elven healers can connect; human monks and Riders are excluded');
      for (const id of [5, recruited.id]) await page.locator(`[data-connect-donor-id="${id}"]:visible`).click();
      await page.locator('[data-connect-action="apply"]:visible').click();
      assert.equal((await state(page)).reserve.find(unit => unit.id === 4).level, 54);
      assert.equal((await state(page)).recruitment.received.elfHealer, 5);
      await page.locator('[data-connect-action="cancel"]:visible').click();
      await page.locator('[data-barracks-recruit-id="4"]').click();
      await tapCell(page, 2, 1);
      const deployed = await state(page);
      assert.equal(deployed.units.find(unit => unit.id === 4).type, 'elfHealer');
      assert.equal(deployed.units.length, original.units.length, 'Archer needs one cell, including isolated purchased cells');
      assert.equal(deployed.reserve.some(unit => unit.id === 2 && unit.type === 'archer'), true);
      await tapCell(page, 2, 1);
      assert.match(await page.locator('#selection-panel .selected-stats').innerText(), /183 HP · 22 heal/);
      await fits(page, '#unit-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`elf-healer-details-${width}.png`, output)) });
      await close(page, 'unit-panel');
      const beforeReload = await state(page);
      await page.reload(); await ready(page);
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(beforeReload));
      await page.locator('#start-wave').click();
      await page.evaluate(() => window.recruitmentCheck.untilElfHeal());
      const battle = await page.evaluate(() => window.recruitmentCheck.battle());
      const elf = battle.allies.find(unit => unit.type === 'elfHealer');
      assert.equal(elf.level, 54); assert.equal(elf.maxHp, 183); assert.equal(elf.heal, 22);
      assert.equal(elf.action, 'heal');
      const effect = battle.effects.find(effect => effect.type === 'heal' && effect.sourceType === 'elfHealer');
      assert.ok(effect && effect.amount > 0);
      assert.equal(battle.allies.find(unit => unit.type === 'swordsman').hp, battle.allies.find(unit => unit.type === 'swordsman').maxHp);
      await page.evaluate(() => window.recruitmentCheck.render());
      await page.screenshot({ path: fileURLToPath(new URL(`elf-healer-battle-${width}.png`, output)) });
    });
  }

  for (const width of [390, 320]) await scenario('unicorn-recruit-connect-two-cells-fight', width, fixture({
    recruitmentPool: 'elves', barracks: {level:4, firstLancerPending:false},
    recruitment: {version:2,received:{pantherRider:50,elfArcher:15,unicorn:4}},
    progression: {unlockedCells:['1:0','2:0','3:0','1:1','2:1','3:1','1:2','2:2','3:2','0:2','4:2'],firstClears:[]},
    units: [{id:1,type:'swordsman',level:2,col:3,row:0},{id:2,type:'archer',level:2,col:2,row:1},{id:3,type:'healer',level:2,col:2,row:2}],
    reserve: [{id:4,type:'unicorn',level:99},{id:5,type:'unicorn',level:3},{id:6,type:'pantherRider',level:2}],
  }), async page => {
    await open(page);
    for(const type of ['pantherRider','elfArcher','elfHealer','unicorn'])
      assert.equal(await page.locator(`[data-elf-recruit="${type}"] .recruitment-detail-heading > span`).innerText(),'25%');
    await fits(page); await page.screenshot({path:fileURLToPath(new URL(`unicorn-recruitment-${width}.png`,output))});
    await close(page); await page.evaluate(()=>{Math.random=()=>.99;});
    const before=await state(page), recruited=await recruit(page);
    assert.equal(recruited.type,'unicorn'); assert.equal(recruited.level,2);
    assert.equal((await state(page)).economy.slaves,before.economy.slaves-1);
    assert.equal((await state(page)).gold,before.gold);
    await unitDetails(page,4);
    assert.match(await page.locator('#barracks-detail').innerText(),/Unicorn.*Lv\. 99/s);
    await page.locator('#barracks-detail [data-connect-action="begin"]').click();
    assert.deepEqual(await page.locator('[data-connect-donor-id]:visible').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.connectDonorId))),[5,recruited.id]);
    for(const id of [5,recruited.id]) await page.locator(`[data-connect-donor-id="${id}"]:visible`).click();
    await page.locator('[data-connect-action="apply"]:visible').click();
    assert.equal((await state(page)).reserve.find(u=>u.id===4).level,104);
    assert.equal((await state(page)).recruitment.received.unicorn,5);
    await page.locator('[data-connect-action="cancel"]:visible').click();
    await page.locator('[data-barracks-recruit-id="4"]').click();
    await tapCell(page,1,0);
    assert.deepEqual((await state(page)).units.find(u=>u.id===4),{id:4,type:'unicorn',level:104,col:1,row:0});
    assert.equal((await state(page)).units.some(u=>u.id===1),true,'Nearby infantry remains in its own cell');
    await tapCell(page,2,0);
    assert.match(await page.locator('#selection-panel .selected-stats').innerText(),/738 HP · 62 attack/);
    await fits(page,'#unit-panel'); await close(page,'unit-panel');
    const deployed=await state(page); await page.reload(); await ready(page);
    assert.deepEqual(restoredInventory(await state(page)),restoredInventory(deployed));
    await page.locator('#start-wave').click();
    const hit=await page.evaluate(()=>{
      for(let i=0;i<1800;i++) {
        window.recruitmentCheck.step(1/60);
        const b=window.recruitmentCheck.battle();
        if(b.effects.some(e=>e.type==='slash'&&e.sourceType==='unicorn')) return b;
      }
      return null;
    });
    assert.ok(hit,'Real horn impact occurs');
    assert.equal(hit.allies.find(u=>u.type==='unicorn').maxHp,738);
    await page.evaluate(()=>window.recruitmentCheck.render());
    await page.screenshot({path:fileURLToPath(new URL(`unicorn-battle-${width}.png`,output))});
  },568);

  await scenario('bombardier-wave-eleven-shot-impact',390,fixture({clearedWaves:109,
    barracks:{level:4,firstLancerPending:false},
    progression:{unlockedCells:['1:0','2:0','3:0','1:1','2:1','3:1','1:2','2:2','3:2'],firstClears:[]},
    units:[{id:1,type:'unicorn',level:60,col:1,row:0},{id:2,type:'swordsman',level:60,col:3,row:0},
      {id:3,type:'elfArcher',level:60,col:1,row:2},{id:4,type:'elfHealer',level:60,col:2,row:2}],
  }),async page=>{
    await page.locator('#start-wave').click();
    await page.evaluate(()=>window.recruitmentCheck.untilProjectile('goblinBombardier'));
    let battle=await page.evaluate(()=>window.recruitmentCheck.battle());
    assert.equal(battle.waveNumber,110);
    assert.ok(battle.enemies.some(e=>e.type==='goblinBombardier'));
    assert.ok(battle.projectiles.some(projectile=>projectile.type==='arrow'&&projectile.sourceType==='goblinBombardier'));
    await page.evaluate(async()=>{window.recruitmentCheck.step(.1);await window.recruitmentCheck.render();});
    await page.screenshot({path:fileURLToPath(new URL('bombardier-shot-390.png',output))});
    const impact=await page.evaluate(()=>{
      for(let i=0;i<180;i++) {
        const b=window.recruitmentCheck.battle();
        if(b.effects.some(e=>e.type==='cannon-impact'))return b;
        window.recruitmentCheck.step(1/60);
      }
      return null;
    });
    assert.ok(impact);assert.ok(impact.allies.some(u=>u.hp<u.maxHp));
    await page.evaluate(()=>window.recruitmentCheck.render());
    await page.screenshot({path:fileURLToPath(new URL('bombardier-impact-390.png',output))});
  });

  await scenario('archer-unlocks-on-rider-training-three', 320, fixture({ recruitmentPool: 'elves',
    recruitment: { version: 2, received: { pantherRider: 14 } },
  }), async page => {
    await open(page);
    const rider = page.locator('[data-elf-recruit="pantherRider"]'), archer = page.locator('[data-elf-recruit="elfArcher"]');
    assert.match(await rider.innerText(), /100%.*1 more panther rider → Lv\. 3/s);
    assert.match(await archer.innerText(), /Locked.*Panther Rider recruitment Lv\. 3 · now 2/s);
    await close(page);
    await page.evaluate(() => { Math.random = () => .75; });
    assert.deepEqual(await recruit(page).then(({ type, level }) => ({ type, level })), { type: 'pantherRider', level: 3 });
    await open(page);
    assert.match(await rider.innerText(), /50%/);
    assert.match(await archer.innerText(), /50%.*Recruitment level · Lv\. 1/s);
    assert.equal((await archer.getAttribute('class')).includes('is-locked'), false);
    await close(page);
    assert.equal((await recruit(page)).type, 'elfArcher');
    await page.reload(); await ready(page); await open(page);
    assert.match(await archer.innerText(), /50%.*4 more elven archers/s);
    await fits(page);
  });

  await scenario('healer-unlocks-on-archer-training-three',320,fixture({recruitmentPool:'elves',
    recruitment:{version:2,received:{pantherRider:15,elfArcher:14}},
  }),async page=>{
    await open(page);
    const healer=page.locator('[data-elf-recruit="elfHealer"]');
    assert.match(await healer.innerText(),/Locked.*Elven Archer recruitment Lv\. 3 · now 2/s);
    await close(page);await page.evaluate(()=>{Math.random=()=>.9;});
    assert.equal((await recruit(page)).type,'elfArcher');
    await open(page);
    for(const type of ['pantherRider','elfArcher','elfHealer']) assert.equal(await page.locator(`[data-elf-recruit="${type}"] .recruitment-detail-heading > span`).innerText(),'33.3%');
    assert.match(await healer.innerText(),/Recruitment level · Lv\. 1/);
    await fits(page);await page.screenshot({path:fileURLToPath(new URL('elf-healer-recruitment-320.png',output))});
    await close(page);assert.equal((await recruit(page)).type,'elfHealer');
    await page.reload();await ready(page);await open(page);
    assert.match(await healer.innerText(),/4 more elven healers/);await fits(page);
  },568);

  const centralCells = Array.from({ length: 9 }, (_, index) => `${index % 3 + 1}:${Math.floor(index / 3)}`);
  await scenario('barracks-four-upgrade-unlocks-one-paid-cell', 320, fixture({
    gold: 10000, recruitmentPool: 'elves', barracks: { level: 3, firstLancerPending: false },
    recruitment: { version: 2, received: { pantherRider: 50 } },
    progression: { unlockedCells: [...centralCells, '4:2'], firstClears: [] },
  }), async page => {
    await tapCell(page, 0, 2);
    assert.match(await page.locator('#selection-panel').innerText(), /Requires Barracks IV/);
    await close(page, 'unit-panel'); await open(page);
    const unicorn = page.locator('[data-elf-recruit="unicorn"]');
    assert.match(await unicorn.innerText(), /Barracks IV · 2 tiles/);
    assert.equal(await unicorn.locator('#barracks-start-upgrade').isVisible(), true);
    assert.match(await unicorn.innerText(), /5000 gold/);
    await fits(page);
    await page.screenshot({ path: fileURLToPath(new URL('barracks-four-ready-320.png', output)) });
    await page.locator('#barracks-start-upgrade').click();
    assert.equal((await state(page)).gold, 5000);
    assert.equal((await state(page)).barracks.level, 3);
    assert.equal((await state(page)).barracks.upgradeReadyAt - (await state(page)).barracks.upgradeStartedAt, 6 * 60 * 60 * 1000);
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /600 gold/);
    await fits(page);
    await page.evaluate(now => { Date.now = () => now + 3 * 60 * 60 * 1000; window.recruitmentCheck.refresh(); }, now);
    assert.match(await page.locator('#barracks-finish-upgrade').innerText(), /300 gold/);
    // Opening a menu after three hours settles ordinary offline income first;
    // verify the upgrade's payment separately from that earned gold.
    await close(page); await open(page);
    await page.locator('#collect-offline-rewards').click();
    const beforeFinish = await state(page);
    assert.equal(beforeFinish.gold, 5180);
    await page.locator('#barracks-finish-upgrade').click();
    assert.equal((await state(page)).barracks.level, 4);
    assert.equal((await state(page)).gold, beforeFinish.gold - 300);
    assert.equal((await state(page)).progression.unlockedCells.length, 10, 'Upgrade grants permission, not a free cell');
    assert.match(await unicorn.innerText(), /33\.3%.*Recruitment level.*Barracks IV.*11 army tiles/s);
    assert.equal(await page.locator('#barracks-building-level').innerText(), 'IV');
    await fits(page); await close(page);
    await tapCell(page, 0, 2);
    // Advancing three real hours also earns ordinary offline income. Acknowledge
    // that real receipt before interacting with the paid cell behind it.
    if (await page.locator('#offline-rewards-panel').isVisible()) await page.locator('#collect-offline-rewards').click();
    assert.equal(await page.locator('[data-action="unlock-cell"]').isEnabled(), true);
    const before = await state(page);
    await page.locator('[data-action="unlock-cell"]').click();
    const after = await state(page);
    assert.equal(after.progression.unlockedCells.length, 11);
    assert.equal(after.gold, before.gold - 750, 'The newly available slot still costs gold');
    await close(page, 'unit-panel');
    await tapCell(page, 0, 1);
    assert.match(await page.locator('#selection-panel').innerText(), /Future Barracks upgrade/);
    await close(page, 'unit-panel');
    await page.reload(); await ready(page);
    assert.equal((await state(page)).barracks.level, 4);
    assert.equal((await state(page)).recruitmentPool, 'elves');
    assert.equal((await state(page)).progression.unlockedCells.length, 11);
    assert.equal((await state(page)).gold, after.gold);
  }, 568);

  for (const width of [390, 320]) {
    await scenario('two-cell-placement-move-swap-drag', width, fixture({
      units: [{ id: 1, type: 'swordsman', level: 2, col: 1, row: 1 }, { id: 2, type: 'archer', level: 2, col: 2, row: 1 }],
      reserve: [50, 100, 1].map((level, index) => ({ id: index + 3, type: 'pantherRider', level })),
      progression: { unlockedCells: [...centralCells, '4:2'], firstClears: [] },
    }), async page => {
      await unitDetails(page, 3); await page.locator('[data-barracks-recruit-id="3"]').click();
      const before = recruitmentInventory(await state(page));
      for (const [col, row] of [[3, 1], [4, 2], [1, 1]]) {
        await tapCell(page, col, row);
        assert.deepEqual(recruitmentInventory(await state(page)), before, 'Locked right neighbour, edge and two occupied cells reject without consuming a fighter');
      }
      await tapCell(page, 1, 0);
      assert.equal((await state(page)).units.find(unit => unit.id === 3).col, 1);
      await tapCell(page, 2, 0);
      assert.match(await page.locator('#selection-panel').innerText(), /Panther Rider.*Lv\. 50/s);
      assert.match(await page.locator('#selection-panel').innerText(), /2.*tiles/i);
      await close(page, 'unit-panel');
      await unitDetails(page, 4); await page.locator('[data-barracks-recruit-id="4"]').click();
      await tapCell(page, 1, 2);
      await ready(page); await page.evaluate(() => window.recruitmentCheck.render());
      await page.screenshot({ path: fileURLToPath(new URL(`rider-two-cells-${width}.png`, output)) });

      await tapCell(page, 2, 0); await page.locator('[data-action="move"]').click();
      const beforeMove = recruitmentInventory(await state(page));
      await tapCell(page, 1, 1);
      assert.deepEqual(recruitmentInventory(await state(page)), beforeMove, 'Moving cannot push two existing fighters into reserve');
      await tapCell(page, 2, 0);
      assert.equal((await state(page)).units.find(unit => unit.id === 3).col, 2, 'A move can overlap its own old footprint');
      await tapCell(page, 3, 0); await page.locator('[data-action="move"]').click();
      await tapCell(page, 2, 1);
      let current = await state(page);
      assert.deepEqual([current.units.find(unit => unit.id === 3).col, current.units.find(unit => unit.id === 3).row], [2, 1]);
      assert.deepEqual([current.units.find(unit => unit.id === 2).col, current.units.find(unit => unit.id === 2).row], [2, 0]);

      const cdp = await page.context().newCDPSession(page);
      const sendTouch = (type, point) => cdp.send('Input.dispatchTouchEvent', { type,
        touchPoints: point ? [{ ...point, id: 1, radiusX: 2, radiusY: 2, force: 1 }] : [] });
      await sendTouch('touchStart', await cellPoint(page, 2, 2));
      await page.waitForTimeout(510);
      assert.equal(await page.locator('.unit-drag-ghost').count(), 1, 'The occupied second cell starts the correct fighter drag');
      await sendTouch('touchMove', await cellPoint(page, 3, 1));
      assert.equal(await page.locator('.unit-drag-ghost.is-valid').count(), 1, 'The target second cell is a valid Connect destination');
      await sendTouch('touchEnd'); await cdp.detach();
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 3).level, 150);
      assert.equal(current.units.some(unit => unit.id === 4), false);
      await tapCell(page, 3, 1);
      await page.locator('[data-connect-donor-id="5"]:visible').click();
      await page.locator('[data-connect-action="apply"]:visible').click();
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 3).level, 151);
      assert.equal(current.reserve.length, 0);
      assert.equal(current.gold, 5000);
      assert.equal(current.economy.slaves, 5);
      await close(page, 'unit-panel');
      await page.reload(); await ready(page);
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(current));
      await tapCell(page, 3, 1);
      assert.match(await page.locator('#selection-panel').innerText(), /Panther Rider.*Lv\. 151/s);
      await close(page, 'unit-panel'); await page.locator('#start-wave').click();
      const mounted = (await page.evaluate(() => window.recruitmentCheck.battle())).allies.find(unit => unit.type === 'pantherRider');
      assert.equal(mounted.x, FIELD.gridX + 3 * FIELD.cellWidth);
      assert.equal(mounted.homeX, mounted.x);
    });

    await scenario('two-cell-legacy-migration-once', width, fixture({
      units: [
        { id: 1, type: 'swordsman', level: 2, col: 2, row: 0 },
        { id: 2, type: 'pantherRider', level: 50, col: 1, row: 0 },
        { id: 3, type: 'pantherRider', level: 100, col: 3, row: 0 },
        { id: 4, type: 'pantherRider', level: 250, col: 1, row: 1 },
        { id: 5, type: 'pantherRider', level: 500, col: 4, row: 2 },
      ],
      reserve: [{ id: 6, type: 'archer', level: 3 }],
      progression: { unlockedCells: [...centralCells, '4:2'], firstClears: [] },
    }), async page => {
      let current = await state(page);
      assert.deepEqual(current.units.map(unit => [unit.type, unit.level, unit.col, unit.row]),
        [['swordsman', 2, 2, 0], ['pantherRider', 250, 1, 1]]);
      assert.deepEqual(current.reserve.map(unit => [unit.type, unit.level]),
        [['archer', 3], ['pantherRider', 50], ['pantherRider', 100], ['pantherRider', 500]]);
      assert.equal(current.gold, 5000);
      assert.equal(current.offlineRewards.returnedFighters, 3);
      assert.equal(current.offlineRewards.closedCells, 0);
      assert.equal(current.offlineRewards.slotRefund, 0);
      assert.equal(await page.locator('#offline-rewards-title').innerText(), 'Army space updated');
      assert.equal(await page.locator('#collect-offline-rewards').innerText(), 'Continue');
      await page.reload(); await ready(page);
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(current), 'Pending migration receipt never duplicates fighters');
      await page.locator('#collect-offline-rewards').click();
      current = await state(page);
      assert.equal(current.offlineRewards.returnedFighters, 0);
      await page.reload(); await ready(page);
      assert.deepEqual(restoredInventory(await state(page)), restoredInventory(current));
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
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
    assert.equal(await page.locator('#recruitment-info-note').isVisible(), false, 'Compact phones keep requirements in the cards and omit the repeated footer');
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
