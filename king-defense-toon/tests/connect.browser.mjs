// Real recipient-first Connect controls run against disposable local saves only.
// Test-only Vite hooks stop animation, never bypass purchase/roster/save guards.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { getForgedUnitStats } from '../forge.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
let baseUrl;
const centralCells = Array.from({ length: 9 }, (_, index) => `${index % 3 + 1}:${Math.floor(index / 3)}`);
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/connect/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'connect-browser-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.connectCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
      placementConnection: () => ({ source: pendingMerge, targets: mergeTargetIds }),
      render: () => renderScene(),
      refresh: () => refresh(),
      victory: () => {
        if (!battle || battle.phase !== 'running') throw new Error('Expected an active battle');
        for (let step = 0; step < 18000 && battle.phase === 'running'; step++) updateBattle(battle, 1 / 60);
        if (battle.phase !== 'victory') throw new Error('Fixture did not win the real simulated wave: ' + battle.phase);
        const reward = applyBattleKillRewards(campaign, battle.campaignRewards,
          { kills: battle.kills, totalGold: battle.reward }, () => 0.99);
        if (!reward.ok) throw new Error('Battle reward rejected: ' + reward.reason);
        showResult();
        if (!battle.resultRecorded) throw new Error('Battle result was not recorded');
      },
    };`;
  } }],
});

function fixture(overrides = {}) {
  return {
    campaignVersion: 3, gold: 500, starterSupplyGranted: true, marketHintCompleted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    barracks: { level: 3, firstLancerPending: false },
    forge: { health: 2, attack: 3, attackSpeed: 4 },
    recruitment: { version: 2, received: { swordsman: 20, archer: 3, healer: 2, lancer: 0, pantherRider: 0 } },
    units: [
      { id: 1, type: 'swordsman', level: 3, col: 1, row: 0 },
      { id: 2, type: 'swordsman', level: 5, col: 2, row: 0 },
      { id: 3, type: 'archer', level: 2, col: 3, row: 0 },
      { id: 4, type: 'swordsman', level: 7, col: 2, row: 1 },
    ],
    reserve: [
      { id: 5, type: 'swordsman', level: 2 }, { id: 6, type: 'swordsman', level: 4 },
      { id: 7, type: 'archer', level: 9 }, { id: 8, type: 'healer', level: 3 },
      { id: 9, type: 'swordsman', level: 6 },
    ],
    progression: { unlockedCells: centralCells, firstClears: [] },
    economy: { slaves: 5, treasuryUpdatedAt: now }, ...overrides,
  };
}
const state = page => page.evaluate(() => window.connectCheck.state());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const battle = page => page.evaluate(() => window.connectCheck.battle());
const action = (page, name) => page.locator(`[data-connect-action="${name}"]:visible`);
const tab = (page, location) => page.locator(`[data-connect-location="${location}"]:visible`);
const donor = (page, id) => page.locator(`[data-connect-donor-id="${id}"]:visible`);
const donorIds = page => page.locator('[data-connect-donor-id]:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.connectDonorId)));
const close = (page, panel) => page.locator(`#${panel} [data-close-overlay]`).click();
const inventory = save => ({ units: save.units, reserve: save.reserve });
const durableInventory = save => ({ units: save.units.map(({ id, ...unit }) => unit), reserve: save.reserve.map(({ id, ...unit }) => unit) });
const unchanged = save => ({ gold: save.gold, slaves: save.economy.slaves, recruitment: save.recruitment,
  forge: save.forge, barracks: save.barracks, progression: save.progression });

async function ready(page) {
  await page.waitForFunction(() => window.connectCheck?.ready());
  await page.evaluate(async () => { window.connectCheck.freeze(); await document.fonts.ready; });
}
async function cellPoint(page, col, row) {
  return page.locator('#army-map').evaluate((canvas, { col, row, field, view }) => {
    const rect = canvas.getBoundingClientRect(), scale = Number(canvas.dataset.worldScale);
    return { x: rect.x + Number(canvas.dataset.worldOffsetX) + (field.gridX + (col + .5) * field.cellWidth) * scale,
      y: rect.y + (rect.height - view.height * scale) / 2 + (field.gridY + (row + .5) * field.cellHeight - view.y) * scale };
  }, { col, row, field: FIELD, view: FORMATION_VIEW });
}
async function tapCell(page, col, row) {
  const point = await cellPoint(page, col, row); await page.touchscreen.tap(point.x, point.y);
}
async function openReserve(page, id) {
  await page.locator('#open-barracks').click(); await page.locator(`[data-barracks-unit-id="${id}"]`).click();
}
async function fits(page, panel) {
  const issues = await page.locator(`#${panel} .menu-card`).evaluate(card => {
    const bounds = card.getBoundingClientRect(), bad = [];
    if (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1) bad.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1) bad.push('horizontal card overflow');
    for (const element of card.querySelectorAll('[data-connect-action], [data-connect-location], [data-connect-donor-id]')) {
      if (!element.getClientRects().length) continue;
      if (element.scrollWidth > element.clientWidth + 1) bad.push(`${element.outerHTML.slice(0, 90)}: overflow`);
      if (element.getBoundingClientRect().height < 44) bad.push('Connect control below 44px');
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Connect remains compact and readable on mobile');
}
async function selectReservePair(page) {
  await donor(page, 5).click(); await donor(page, 6).click();
  assert.equal(await page.locator('#selection-panel [data-connect-location]').count(), 0);
  for (const id of [5, 6]) assert.equal(await donor(page, id).getAttribute('aria-pressed'), 'true');
}
async function assertPreview(page, level, type, forge) {
  assert.equal(await page.locator('[data-connect-preview-level]:visible').innerText(), String(level));
  const text = await page.locator('.connect-preview-stats:visible').innerText();
  const stats = getForgedUnitStats(type, level, forge);
  for (const value of [stats.hp, type === 'healer' ? stats.heal : stats.damage]) {
    const label = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
    assert.ok(text.includes(label), `${text} should show the resulting forged stat ${label}`);
  }
}

let browser;
const checks = [];
async function scenario(name, width, saved, check) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 640 : 700 }, isMobile: true, hasTouch: true });
  const errors = [];
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ saved, key, now }) => {
      Date.now = () => now;
      if (!sessionStorage.getItem('__connect-seeded')) {
        localStorage.setItem(key, JSON.stringify(saved)); sessionStorage.setItem('__connect-seeded', '1');
      }
    }, { saved, key, now });
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl); await ready(page); await check(page);
    assert.deepEqual(errors, [], 'No browser or local asset errors');
    checks.push(`${name} ${width}px`); console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`connect-${name}-FAILED-${width}.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true }); baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [390, 320]) {
    await scenario('barracks-connect-button-to-deployment', width, fixture(), async page => {
      const connectButton = id => page.locator(`[data-barracks-connect-id="${id}"]`);
      const connection = () => page.evaluate(() => window.connectCheck.placementConnection());
      const before = await state(page);
      await page.locator('#start-wave').click();
      const liveBefore = await battle(page);
      await page.locator('#open-barracks').click();
      assert.equal(await page.locator('[data-barracks-connect-id]').count(), before.reserve.length);
      assert.equal(await connectButton(8).isDisabled(), true, 'No matching healer in Army');
      await connectButton(5).focus(); await page.evaluate(() => window.connectCheck.refresh());
      assert.equal(await connectButton(5).evaluate(element => element === document.activeElement), true);
      const buttonsFit = await page.locator('[data-barracks-connect-id]').evaluateAll(buttons => buttons.every(button => {
        const box = button.getBoundingClientRect();
        return box.width >= 44 && box.height >= 44 && button.scrollWidth <= button.clientWidth
          && box.x >= 0 && box.right <= innerWidth;
      }));
      assert.equal(buttonsFit, true, 'Compact actions keep usable touch targets without overflow');
      await page.screenshot({ path: fileURLToPath(new URL(`connect-barracks-buttons-${width}.png`, output)) });
      await connectButton(5).tap();
      assert.equal(await page.locator('#barracks-panel').isVisible(), false);
      assert.deepEqual(await connection(), { source: { location: 'reserve', id: 5 }, targets: [1, 2, 4] });
      assert.deepEqual(inventory(await state(page)), inventory(before), 'Selecting a donor consumes nothing');
      await tapCell(page, 3, 0); // Archer: wrong type.
      await tapCell(page, 1, 1); // Empty tile.
      assert.deepEqual(inventory(await state(page)), inventory(before), 'Wrong or empty targets cannot consume the donor');
      assert.deepEqual((await connection()).targets, [1, 2, 4]);
      await page.locator('#cancel-army-move').click();
      assert.equal((await connection()).source, null);
      assert.deepEqual(inventory(await stored(page)), inventory(before), 'Cancel preserves the durable roster');
      await page.locator('#open-barracks').click(); await connectButton(5).tap();
      await tapCell(page, 2, 0);
      const current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 2).level, 7, 'The chosen Army fighter receives the donor levels');
      assert.equal(current.units.find(unit => unit.id === 1).level, 3, 'Other compatible targets stay unchanged');
      assert.equal(current.reserve.some(unit => unit.id === 5), false);
      assert.deepEqual(unchanged(current), unchanged(before));
      assert.deepEqual(await battle(page), liveBefore, 'The ongoing battle keeps its original actors');
      assert.deepEqual(inventory(await stored(page)), inventory(current));
      assert.deepEqual(await connection(), { source: null, targets: [] });
      await tapCell(page, 2, 0);
      assert.deepEqual(inventory(await state(page)), inventory(current), 'Repeating the target tap cannot consume twice');
      await page.reload(); await ready(page);
      assert.deepEqual(durableInventory(await state(page)), durableInventory(current));
    });

    await scenario('army-recipient-batch-cancel-repeat-next-wave', width, fixture(), async page => {
      await page.locator('#start-wave').click();
      const initialBattle = await battle(page);
      await tapCell(page, 1, 0); await action(page, 'select-all').focus();
      await page.evaluate(() => window.connectCheck.refresh());
      assert.equal(await action(page, 'select-all').evaluate(element => element === document.activeElement), true, 'Refreshing details preserves Select all focus');
      assert.equal(await action(page, 'begin').count(), 0, 'No intermediate Connect screen');
      assert.equal(await page.locator('#unit-panel-title').innerText(), 'Swordsman');
      assert.equal(await page.locator('#reserve-section').isVisible(), false, 'Replacement reserve list is replaced with inline connections');
      assert.match(await page.locator('#selection-panel').innerText(), /Available connections/);
      assert.equal(await page.locator('#unit-panel').isVisible(), true);
      assert.deepEqual(await donorIds(page), [5, 6, 9], 'Army details show only matching Barracks donors');
      assert.equal(await page.locator('#selection-panel .connect-tabs').count(), 0, 'No space is reserved for source filters');
      assert.equal(await action(page, 'apply').count(), 0, 'Apply appears only with selected donors');
      const beforeCancel = await state(page);
      await page.screenshot({ path: fileURLToPath(new URL(`connect-inline-details-${width}.png`, output)) });
      await selectReservePair(page); await assertPreview(page, 9, 'swordsman', beforeCancel.forge);
      assert.deepEqual(inventory(await state(page)), inventory(beforeCancel), 'Preview consumes nothing');
      await fits(page, 'unit-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`connect-army-${width}.png`, output)) });
      await action(page, 'cancel').click();
      assert.deepEqual(inventory(await state(page)), inventory(beforeCancel));
      assert.equal(await page.locator('#unit-panel-title').innerText(), 'Swordsman', 'Clear stays in the recipient card');
      assert.equal(await donor(page, 5).getAttribute('aria-pressed'), 'false');
      assert.equal(await action(page, 'apply').count(), 0);
      await selectReservePair(page);
      const beforeApply = await state(page);
      await action(page, 'apply').click();
      let current = await state(page);
      assert.deepEqual(current.units.find(unit => unit.id === 1), { id: 1, type: 'swordsman', level: 9, col: 1, row: 0 });
      assert.deepEqual(current.units.filter(unit => unit.id !== 1), beforeApply.units.filter(unit => unit.id !== 1), 'Other deployed fighters are never donors');
      assert.equal(current.reserve.some(unit => [5, 6].includes(unit.id)), false);
      assert.deepEqual(unchanged(current), unchanged(beforeApply), 'Connect spends fighters only');
      assert.deepEqual(inventory(await stored(page)), inventory(current));
      assert.equal(await page.locator('#unit-panel').isVisible(), true);
      assert.equal(await action(page, 'apply').count(), 0, 'Consumed selection is cleared and Apply disappears');
      await page.locator('#selection-panel').evaluate(panel => {
        const staleButton = document.createElement('button'); staleButton.dataset.connectAction = 'apply';
        panel.append(staleButton); staleButton.click(); staleButton.remove();
      });
      assert.deepEqual(inventory(await state(page)), inventory(current), 'An unselected repeat click cannot duplicate levels');
      await donor(page, 9).click();
      await assertPreview(page, 15, 'swordsman', current.forge); await action(page, 'apply').click();
      current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 1).level, 15);
      assert.deepEqual((await battle(page)).allies, initialBattle.allies, 'An ongoing battle retains its pre-Connect army');
      await close(page, 'unit-panel');
      await page.evaluate(() => window.connectCheck.victory());
      await page.locator('#return-prep').click(); await page.locator('#start-wave').click();
      const upgraded = (await battle(page)).allies.find(unit => unit.id === 'ally-1');
      const expected = getForgedUnitStats('swordsman', 15, current.forge);
      assert.equal(upgraded.level, 15); assert.equal(upgraded.maxHp, expected.hp); assert.equal(upgraded.damage, expected.damage);
      current = await state(page); await page.reload(); await ready(page);
      assert.deepEqual(durableInventory(await state(page)), durableInventory(current));
    });

    await scenario('barracks-recipient-mixed-sources', width, fixture(), async page => {
      await openReserve(page, 5); await action(page, 'begin').click();
      assert.equal(await page.locator('#barracks-panel').isVisible(), true);
      assert.deepEqual(await donorIds(page), [6, 9], 'Reserve recipient cannot donate itself');
      await donor(page, 6).click(); await tab(page, 'army').click();
      assert.deepEqual(await donorIds(page), [1, 2, 4]);
      await donor(page, 2).click();
      const before = await state(page);
      await assertPreview(page, 11, 'swordsman', before.forge);
      await fits(page, 'barracks-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`connect-barracks-${width}.png`, output)) });
      await action(page, 'apply').click();
      const current = await state(page);
      assert.deepEqual(current.reserve.find(unit => unit.id === 5), { id: 5, type: 'swordsman', level: 11 });
      assert.equal(current.reserve.some(unit => unit.id === 6), false);
      assert.equal(current.units.some(unit => unit.id === 2), false);
      assert.deepEqual(unchanged(current), unchanged(before));
      assert.equal(await page.locator('#barracks-panel').isVisible(), true);
      assert.equal(await action(page, 'apply').count(), 1);
      assert.equal(await action(page, 'apply').isDisabled(), true);
      await page.reload(); await ready(page);
      assert.deepEqual(durableInventory(await state(page)), durableInventory(current));
    });

    await scenario('inline-select-all-clear-and-close', width, fixture({
      reserve: [...Array.from({ length: 30 }, (_, index) => ({ id: index + 5, type: 'swordsman', level: index + 1 })),
        { id: 35, type: 'archer', level: 10 }],
    }), async page => {
      const before = await state(page);
      await tapCell(page, 1, 0);
      await action(page, 'select-all').tap();
      assert.equal(await page.locator('[data-connect-donor-id][aria-pressed="true"]:visible').count(), 30, 'Select all includes matching offscreen donors');
      await assertPreview(page, 468, 'swordsman', before.forge);
      assert.deepEqual(inventory(await state(page)), inventory(before));
      await donor(page, 5).tap();
      await assertPreview(page, 467, 'swordsman', before.forge);
      assert.equal(await donor(page, 2).count(), 0, 'Deployed donors are not offered');
      assert.match(await page.locator('.connect-summary:visible').innerText(), /29 selected from Barracks/);
      await page.locator('#selection-panel').evaluate(panel => {
        for (const attributes of [{ connectLocation: 'army' }, { connectDonorId: '2' }]) {
          const staleButton = document.createElement('button'); Object.assign(staleButton.dataset, attributes);
          panel.append(staleButton); staleButton.click(); staleButton.remove();
        }
      });
      await action(page, 'select-all').tap();
      await assertPreview(page, 468, 'swordsman', before.forge);
      await page.locator('#unit-panel').press('Escape');
      assert.equal(await page.locator('#unit-panel').isVisible(), true, 'First Escape clears the selection');
      assert.equal(await action(page, 'apply').count(), 0);
      assert.equal(await page.locator('[data-connect-donor-id][aria-pressed="true"]:visible').count(), 0, 'Clear removes the reserve selection');
      await action(page, 'select-all').tap();
      await close(page, 'unit-panel');
      assert.deepEqual(inventory(await stored(page)), inventory(before), 'Closing the card cancels unconfirmed donors');
      await tapCell(page, 1, 0);
      assert.equal(await action(page, 'apply').count(), 0, 'Reopening starts without stale selection');
      await action(page, 'select-all').tap();
      await fits(page, 'unit-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`connect-inline-select-all-${width}.png`, output)) });
      await action(page, 'apply').tap();
      const current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 1).level, 468);
      assert.equal(current.units.length, before.units.length, 'Only the chosen reserve list was consumed');
      assert.deepEqual(current.reserve, [{ id: 35, type: 'archer', level: 10 }]);
      assert.deepEqual(unchanged(current), unchanged(before));
      assert.equal(await action(page, 'select-all').isDisabled(), true);
      assert.equal(await action(page, 'apply').count(), 0);
      await page.locator('#unit-panel').press('Escape');
      assert.equal(await page.locator('#unit-panel').isVisible(), false, 'Escape closes the card when nothing is selected');
      await tapCell(page, 3, 0);
      await donor(page, 35).tap();
      await page.locator('[data-action="remove"]').tap();
      assert.equal(await page.locator('#reserve-section').isVisible(), true, 'Sending a recipient to Barracks returns to normal deployment');
      assert.equal((await state(page)).reserve.find(unit => unit.id === 35).level, 10, 'Moving a recipient cancels its unconfirmed selection');
    });

    await scenario('last-army-guard-is-not-consumed', width, fixture({
      units: [{ id: 1, type: 'swordsman', level: 2, col: 2, row: 0 }],
      reserve: [{ id: 2, type: 'swordsman', level: 3 }, { id: 3, type: 'swordsman', level: 4 }],
    }), async page => {
      await page.locator('#start-wave').click();
      await openReserve(page, 2); await action(page, 'begin').click(); await tab(page, 'army').click();
      const before = await state(page);
      if (await donor(page, 1).count() && await donor(page, 1).isEnabled()) await donor(page, 1).click();
      assert.equal(await action(page, 'apply').isDisabled(), true, 'The last deployed guard cannot be donated into reserve');
      await action(page, 'apply').evaluate(button => button.click());
      assert.deepEqual(inventory(await state(page)), inventory(before));
      await fits(page, 'barracks-panel');
    });

    await scenario('two-cell-rider-recipient-preserves-footprint', width, fixture({
      units: [{ id: 1, type: 'pantherRider', level: 50, col: 1, row: 0 },
        { id: 2, type: 'pantherRider', level: 100, col: 1, row: 2 }, { id: 3, type: 'swordsman', level: 2, col: 3, row: 1 }],
      reserve: [{ id: 4, type: 'pantherRider', level: 2 }, { id: 5, type: 'archer', level: 1 }],
    }), async page => {
      await tapCell(page, 2, 0);
      assert.deepEqual(await donorIds(page), [4]); await donor(page, 4).click();
      assert.equal(await donor(page, 2).count(), 0);
      const before = await state(page);
      await assertPreview(page, 52, 'pantherRider', before.forge); await action(page, 'apply').click();
      const current = await state(page);
      assert.deepEqual(current.units.find(unit => unit.id === 1), { id: 1, type: 'pantherRider', level: 52, col: 1, row: 0 });
      assert.deepEqual(current.units.find(unit => unit.id === 2), before.units.find(unit => unit.id === 2));
      assert.equal(current.reserve.some(unit => unit.id === 4), false);
      assert.deepEqual(current.progression.unlockedCells, before.progression.unlockedCells);
      await close(page, 'unit-panel');
      await tapCell(page, 2, 0);
      assert.match(await page.locator('#selection-panel').innerText(), /Panther Rider.*Lv\. 52/s);
      await close(page, 'unit-panel'); await tapCell(page, 2, 2);
      assert.match(await page.locator('#selection-panel').innerText(), /Panther Rider.*Lv\. 100/s);
      await page.reload(); await ready(page);
      assert.deepEqual(durableInventory(await state(page)), durableInventory(current));
    });

    await scenario('long-donor-list-keeps-scroll-and-focus', width, fixture({
      reserve: Array.from({ length: 30 }, (_, index) => ({ id: index + 5, type: 'swordsman', level: index + 1 })),
    }), async page => {
      await tapCell(page, 1, 0);
      const scroll = page.locator('.connect-donor-scroll:visible');
      assert.equal(await donorIds(page).then(ids => ids.length), 30);
      await donor(page, 34).scrollIntoViewIfNeeded();
      const scrollBefore = await scroll.evaluate(element => element.scrollTop);
      assert.ok(scrollBefore > 0, 'Large inventories scroll inside the donor grid');
      await donor(page, 34).click();
      assert.equal(await donor(page, 34).getAttribute('aria-pressed'), 'true');
      assert.equal(await scroll.evaluate(element => element.scrollTop), scrollBefore, 'Selecting a donor does not jump back to the first row');
      await page.evaluate(() => window.connectCheck.refresh());
      assert.equal(await scroll.evaluate(element => element.scrollTop), scrollBefore);
      assert.equal(await donor(page, 34).evaluate(element => element === document.activeElement), true);
      await scroll.focus(); await page.evaluate(() => window.connectCheck.refresh());
      assert.equal(await scroll.evaluate(element => element === document.activeElement), true, 'Keyboard focus remains on the scroll group across refresh');
      await fits(page, 'unit-panel');
      await page.screenshot({ path: fileURLToPath(new URL(`connect-scroll-${width}.png`, output)) });
      assert.equal(await page.locator('#selection-panel [data-connect-location]').count(), 0);
      assert.equal(await donor(page, 34).getAttribute('aria-pressed'), 'true', 'The selected offscreen donor remains selected');
      await action(page, 'apply').click();
      assert.equal((await state(page)).units.find(unit => unit.id === 1).level, 33);
    });

    await scenario('touch-drag-still-donates-to-army', width, fixture(), async page => {
      const cdp = await page.context().newCDPSession(page);
      const send = (type, point) => cdp.send('Input.dispatchTouchEvent', { type,
        touchPoints: point ? [{ ...point, id: 1, radiusX: 2, radiusY: 2, force: 1 }] : [] });
      const before = await state(page);
      await page.locator('#open-barracks').click();
      const box = await page.locator('[data-barracks-unit-id="5"]').boundingBox();
      await send('touchStart', { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      await page.waitForTimeout(510);
      assert.equal(await page.locator('.unit-drag-ghost').count(), 1);
      await send('touchMove', await cellPoint(page, 1, 0));
      assert.equal(await page.locator('.unit-drag-ghost.is-valid').count(), 1);
      await send('touchEnd'); await cdp.detach();
      const current = await state(page);
      assert.equal(current.units.find(unit => unit.id === 1).level, 5);
      assert.equal(current.reserve.some(unit => unit.id === 5), false);
      assert.deepEqual(unchanged(current), unchanged(before));
      assert.equal(await page.locator('.unit-drag-ghost').count(), 0);
    });
  }
  console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally { await browser?.close(); await server.close(); }
