// Exercise the application command boundary through real controls. Test hooks
// only read state and stop the periodic economy timer; battle frames run normally.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const key = 'brotd-infinity:campaign:v2';
const now = 1_800_000_000_000;
const fixture = {
  saveSchemaVersion: 2, campaignVersion: 3, gold: 5000, nextUnitId: 1000,
  starterSupplyGranted: true, marketHintCompleted: true,
  autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
  units: [{ id: 100, type: 'swordsman', level: 20, col: 2, row: 0 },
    { id: 200, type: 'archer', level: 20, col: 2, row: 1 },
    { id: 300, type: 'healer', level: 20, col: 2, row: 2 }],
  reserve: [{ id: 400, type: 'swordsman', level: 3 },
    { id: 500, type: 'archer', level: 2 }, { id: 900, type: 'healer', level: 1 }],
  progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
  economy: { slaves: 5, treasuryUpdatedAt: now },
  barracks: { level: 2, firstLancerPending: true },
  hero: { talentVersion: 2, xp: 200, highestWave: 0, talents: {} },
};

const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/campaign-commands/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'campaign-command-browser-hooks', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    return code + `\nwindow.campaignCommandCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      snapshot: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => battle && { phase: battle.phase, kills: battle.kills,
        total: battle.total, reward: battle.reward, elapsed: battle.elapsed },
      stopEconomyTimer: () => clearInterval(economyTimer),
    };`;
  } }],
});

const snapshot = page => page.evaluate(() => window.campaignCommandCheck.snapshot());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const close = (page, panel) => page.locator(`#${panel} [data-close-overlay]`).click();
const roster = value => ({ units: value.units, reserve: value.reserve, nextUnitId: value.nextUnitId });
const progress = value => ({ gold: value.gold, ...roster(value), progression: value.progression,
  hero: value.hero, forge: value.forge, capitol: value.capitol,
  clearedWaves: value.clearedWaves, treasuryLevel: value.economy.treasuryLevel });

async function ready(page) {
  await page.waitForFunction(() => window.campaignCommandCheck?.ready(), null, { timeout: 30000 });
  await page.evaluate(() => window.campaignCommandCheck.stopEconomyTimer());
}

async function openReserve(page, id) {
  await page.locator('#open-barracks').click();
  await page.locator(`[data-barracks-unit-id="${id}"]`).click();
}

async function chooseCell(page, keys = []) {
  await page.locator('#army-map').focus();
  for (const key of keys) await page.keyboard.press(key);
  await page.keyboard.press('Enter');
}

let browser, baseUrl;
const checks = [];
async function scenario(name, width, check) {
  const context = await browser.newContext({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true });
  const errors = [];
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ key, fixture, now }) => {
      Date.now = () => now;
      if (!sessionStorage.getItem('__campaign-command-seeded')) {
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('__campaign-command-seeded', '1');
      }
    }, { key, fixture, now });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl); await ready(page); await check(page);
    assert.deepEqual(errors, [], `${name}: no browser or local asset errors`);
    checks.push(name); console.log(`PASS ${name}`);
  } finally { await context.close(); }
}

try {
  const listening = once(server.httpServer, 'listening');
  server.httpServer.listen(0, '127.0.0.1');
  await listening;
  baseUrl = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });

  await scenario('roster commands preserve IDs and never reuse a sold highest ID after reload', 320, async page => {
    const initial = await snapshot(page);
    assert.deepEqual(roster(initial), roster(fixture));
    await page.locator('#transform-slave').click();
    await page.waitForFunction(() => !document.getElementById('open-barracks').disabled);
    const recruited = await snapshot(page);
    assert.equal(recruited.economy.slaves, initial.economy.slaves - 1);
    assert.deepEqual(recruited.reserve.at(-1), { id: 1000, type: 'lancer', level: 1 });
    assert.equal(recruited.nextUnitId, 1001);
    assert.equal(recruited.barracks.firstLancerPending, false);
    assert.deepEqual(roster(await stored(page)), roster(recruited));

    await openReserve(page, 1000);
    await page.locator('[data-barracks-recruit-id="1000"]').click();
    await chooseCell(page, ['ArrowLeft']);
    await page.locator('[data-action="unlock-cell"]').click();
    let current = await snapshot(page);
    assert.equal(current.gold, initial.gold - 25);
    assert.deepEqual(current.units.find(unit => unit.id === 1000), { id: 1000, type: 'lancer', level: 1, col: 1, row: 0 });
    assert.equal(current.reserve.some(unit => unit.id === 1000), false);
    assert.ok(current.progression.unlockedCells.includes('1:0'));

    await chooseCell(page);
    await page.locator('[data-action="remove"]').click();
    await close(page, 'unit-panel');
    current = await snapshot(page);
    assert.deepEqual(current.reserve.find(unit => unit.id === 1000), { id: 1000, type: 'lancer', level: 1 });
    assert.equal(current.units.some(unit => unit.id === 1000), false);

    await chooseCell(page, ['ArrowRight']);
    await page.locator('[data-connect-donor-id="400"]:visible').click();
    await page.locator('[data-connect-action="apply"]:visible').click();
    current = await snapshot(page);
    assert.equal(current.units.find(unit => unit.id === 100).level, 23);
    assert.equal(current.reserve.some(unit => unit.id === 400), false);
    assert.equal(current.gold, initial.gold - 25);
    await close(page, 'unit-panel');

    await openReserve(page, 1000);
    await page.locator('[data-barracks-sell-id="1000"]').click();
    const sold = await snapshot(page);
    assert.equal(sold.gold, initial.gold - 24);
    assert.equal(sold.reserve.some(unit => unit.id === 1000), false);
    assert.equal(sold.nextUnitId, 1001);
    assert.deepEqual(roster(await stored(page)), roster(sold));
    await page.reload(); await ready(page);
    assert.deepEqual(roster(await snapshot(page)), roster(sold), 'reload preserves sparse IDs and deleted-ID high-water mark');
    await page.locator('#transform-slave').click();
    current = await snapshot(page);
    assert.equal(current.reserve.at(-1).id, 1001);
    assert.equal(current.nextUnitId, 1002);
    assert.equal(new Set([...current.units, ...current.reserve].map(unit => unit.id)).size, current.units.length + current.reserve.length);
  });

  await scenario('purchases and hero commands persist together with a real first-wave reward', 390, async page => {
    await page.locator('#open-buildings').click();
    const before = await snapshot(page);
    await page.locator('#treasury-upgrade').click();
    await page.locator('#tab-forge').click();
    await page.locator('[data-forge-upgrade="attack"]').click();
    await page.locator('#tab-capitol').click();
    await page.locator('[data-capitol-upgrade="tower"]').click();
    await page.locator('[data-capitol-upgrade="health"]').click();
    const purchased = await snapshot(page);
    assert.equal(purchased.gold, before.gold - 275);
    assert.equal(purchased.economy.treasuryLevel, 2);
    assert.equal(purchased.forge.attack, 1);
    assert.deepEqual(purchased.capitol, { health: 1, tower: 1 });
    assert.deepEqual(progress(await stored(page)), progress(purchased), 'spending and building ranks share the same durable snapshot');
    await close(page, 'buildings-panel');

    await page.locator('#open-hero').click();
    await page.locator('[data-hero-talent="heal_unlock"]').click();
    await page.locator('[data-hero-spend]').click();
    assert.equal((await snapshot(page)).hero.talents.heal_unlock, 1);
    await page.locator('[data-hero-reset]').click();
    assert.equal((await snapshot(page)).hero.talents.heal_unlock, 0);
    await page.locator('[data-hero-spend]').click();
    assert.equal((await stored(page)).hero.talents.heal_unlock, 1);
    await close(page, 'hero-panel');

    const preparation = await snapshot(page);
    await page.locator('#start-wave').click();
    await page.locator('#battle-speed').click();
    await page.locator('#battle-speed').click();
    await page.locator('#result-panel').waitFor({ state: 'visible', timeout: 30000 });
    const result = await page.evaluate(() => window.campaignCommandCheck.battle());
    const won = await snapshot(page);
    assert.equal(result.phase, 'victory');
    assert.equal(result.kills, 3);
    assert.equal(result.reward, 13);
    assert.equal(won.gold, preparation.gold + 13);
    assert.equal(won.hero.xp, preparation.hero.xp + 13);
    assert.equal(won.clearedWaves, 1);
    assert.deepEqual(won.progression.firstClears, [1]);
    assert.deepEqual(roster(won), roster(preparation), 'combat consumes a snapshot without changing persistent fighters');
    assert.deepEqual(progress(await stored(page)), progress(won));
    await page.reload(); await ready(page);
    assert.deepEqual(progress(await snapshot(page)), progress(won), 'reload cannot apply the battle reward twice');
  });
  console.log(`Campaign command browser checks passed: ${checks.length}.`);
} finally {
  await browser?.close();
  await server.close();
}
