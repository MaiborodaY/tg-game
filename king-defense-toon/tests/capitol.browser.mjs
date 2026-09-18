// Disposable mobile saves exercise Capitol purchases and their next-battle snapshots.
// Instrumentation stops frames only; real economy/save guards remain active.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
const baseUrl = 'http://127.0.0.1:5208/';
const emptyCapitol = { health: 0, tower: 0 };
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/capitol/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5208, strictPort: true },
  plugins: [{ name: 'capitol-browser-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.capitolCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
      render: () => renderScene(),
      victory: () => { battle.phase = 'victory'; showResult(); },
      setTime: timestamp => { window.capitolNow = timestamp; sessionStorage.setItem('__capitol-now', String(timestamp)); },
    };`;
  } }],
});

function fixture(overrides = {}) {
  return {
    campaignVersion: 3, gold: 500, starterSupplyGranted: true, marketHintCompleted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    barracks: { level: 1, firstLancerPending: false },
    units: ['swordsman', 'archer', 'healer'].map((type, row) => ({ id: row + 1, type, level: 1, col: 2, row })),
    reserve: [{ id: 4, type: 'archer', level: 1 }],
    progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
    economy: { slaves: 0, treasuryUpdatedAt: now }, ...overrides,
  };
}
const state = page => page.evaluate(() => window.capitolCheck.state());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const battle = page => page.evaluate(() => window.capitolCheck.battle());
const button = (page, id) => page.locator(`[data-capitol-upgrade="${id}"]`);
const row = (page, id) => page.locator(`[data-capitol-row="${id}"]`);
const close = page => page.locator('#buildings-panel [data-close-overlay]').click();

async function ready(page) {
  await page.waitForFunction(() => window.capitolCheck?.ready());
  await page.evaluate(async () => { window.capitolCheck.freeze(); await document.fonts.ready; });
}
async function openCapitol(page) {
  await page.locator('#open-buildings').click();
  await page.locator('#tab-capitol').click();
  assert.equal(await page.locator('#capitol-building').isVisible(), true);
}
async function fits(page) {
  const issues = await page.locator('#buildings-panel .menu-card').evaluate(card => {
    const bad = [], bounds = card.getBoundingClientRect();
    if (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1) bad.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1) bad.push('card overflow');
    for (const element of card.querySelectorAll('.capitol-row, .capitol-copy, .capitol-upgrade, .building-tab')) {
      if (!element.getClientRects().length) continue;
      if (element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className}: horizontal overflow`);
      if (element.tagName === 'BUTTON' && element.getBoundingClientRect().height < 44) bad.push(`${element.className}: touch target below 44px`);
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Capitol and all five tabs fit the small screen');
}
async function assertDefaults(page) {
  assert.deepEqual((await state(page)).capitol, emptyCapitol);
  assert.deepEqual(await page.locator('[data-capitol-upgrade]').evaluateAll(nodes => nodes.map(node => node.dataset.capitolUpgrade)), ['tower', 'health']);
  assert.equal(await row(page, 'tower').locator('[data-capitol-action]').innerText(), 'Build');
  assert.equal(await row(page, 'tower').locator('[data-capitol-price]').innerText(), '100');
  assert.equal(await row(page, 'tower').locator('[data-capitol-stats]').innerText(), '10 damage');
  assert.equal(await row(page, 'tower').locator('[data-capitol-detail]').innerText(), 'Every 2s · Not built');
  assert.equal(await row(page, 'health').locator('[data-capitol-price]').innerText(), '50');
  assert.equal(await row(page, 'health').locator('[data-capitol-stats]').innerText(), '100 → 120 HP');
  assert.match(await page.locator('#capitol-building').innerText(), /Fires at nearby enemies/);
  assert.equal(await page.locator('.capitol-art img').evaluate(image => image.complete && image.naturalWidth > 0), true);
}

let browser;
const checks = [];
async function scenario(name, viewport, saved, check) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const errors = [];
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ saved, key, now }) => {
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      window.capitolNow = Number(get.call(sessionStorage, '__capitol-now')) || now;
      Date.now = () => window.capitolNow;
      if (!get.call(sessionStorage, '__capitol-seeded')) {
        if (saved !== null) set.call(localStorage, key, JSON.stringify(saved));
        set.call(sessionStorage, '__capitol-seeded', '1');
      }
      let failWrites = false;
      Storage.prototype.setItem = function (requestedKey, value) {
        if (this === localStorage && requestedKey === key && failWrites) throw new DOMException('Intentional Capitol save failure', 'QuotaExceededError');
        return set.call(this, requestedKey, value);
      };
      window.capitolStorage = { failWrites: value => { failWrites = value; } };
    }, { saved, key, now });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl); await ready(page);
    await check(page);
    assert.deepEqual(errors, [], 'No browser or local asset errors');
    checks.push(`${name} ${viewport.width}x${viewport.height}`);
    console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`capitol-${name}-FAILED-${viewport.width}.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const viewport of [{ width: 390, height: 700 }, { width: 320, height: 568 }]) {
    await scenario('fresh-game-five-tabs', viewport, null, async page => {
      await openCapitol(page); await assertDefaults(page);
      assert.deepEqual(await page.locator('#buildings-tabs [role="tab"]').evaluateAll(nodes => nodes.map(node => node.id)),
        ['tab-treasury', 'tab-market', 'tab-forge', 'tab-farm', 'tab-capitol']);
      await page.locator('#tab-capitol').focus();
      for (const [key, id] of [['ArrowRight', 'tab-treasury'], ['End', 'tab-capitol'], ['Home', 'tab-treasury'],
        ['ArrowRight', 'tab-market'], ['ArrowRight', 'tab-forge'], ['ArrowRight', 'tab-farm'], ['ArrowRight', 'tab-capitol']]) {
        await page.keyboard.press(key);
        assert.equal(await page.locator(`#${id}`).getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator(`#${id}`).evaluate(node => node === document.activeElement), true);
        assert.equal(await page.locator('#buildings-tabs [tabindex="0"]').count(), 1);
      }
      await fits(page);
    });

    await scenario('purchase-next-battle-reload-reset', viewport, fixture(), async page => {
      await page.locator('#start-wave').click();
      const beforeBattle = await battle(page);
      assert.equal(beforeBattle.castle.maxHp, 100);
      assert.equal(beforeBattle.castle.damage, 0);
      assert.equal(beforeBattle.castle.stats.towerLevel, 0);
      await openCapitol(page); await assertDefaults(page);
      for (const [id, cost, rank, nextCost] of [['tower', 100, 1, 50], ['health', 50, 1, 75],
        ['tower', 50, 2, 75], ['health', 75, 2, 100], ['tower', 75, 3, 100]]) {
        const before = await state(page);
        assert.equal(await row(page, id).locator('[data-capitol-price]').innerText(), String(cost));
        await button(page, id).click();
        const current = await state(page);
        assert.equal(current.gold, before.gold - cost);
        assert.equal(current.capitol[id], rank);
        assert.equal(await page.locator('#building-gold').innerText(), String(current.gold));
        assert.equal(await row(page, id).locator('[data-capitol-price]').innerText(), String(nextCost));
        assert.deepEqual((await stored(page)).capitol, current.capitol);
        assert.equal((await stored(page)).gold, current.gold, 'Rank and payment persist together');
        assert.match(await page.locator('#capitol-feedback').innerText(), /next battle/);
        await fits(page);
      }
      assert.equal((await state(page)).gold, 150);
      assert.deepEqual((await state(page)).capitol, { health: 2, tower: 3 });
      assert.equal(await row(page, 'health').locator('[data-capitol-stats]').innerText(), '140 → 160 HP');
      assert.equal(await row(page, 'tower').locator('[data-capitol-stats]').innerText(), '14 → 16 damage');
      assert.deepEqual((await battle(page)).castle, beforeBattle.castle, 'Existing battle retains its original castle snapshot');
      assert.deepEqual((await battle(page)).allies, beforeBattle.allies, 'Capitol upgrades never change the army');
      assert.deepEqual((await battle(page)).hero, beforeBattle.hero, 'Capitol upgrades never change the hero');
      await page.screenshot({ path: fileURLToPath(new URL(`capitol-${viewport.width}.png`, output)) });
      await close(page);
      await page.evaluate(() => window.capitolCheck.victory());
      await page.locator('#return-prep').click(); await page.locator('#start-wave').click();
      const nextBattle = await battle(page);
      assert.equal(nextBattle.waveNumber, 2);
      assert.equal(nextBattle.castle.maxHp, 140); assert.equal(nextBattle.castle.hp, 140);
      assert.equal(nextBattle.castle.damage, 14);
      assert.deepEqual(nextBattle.castle.stats, { hp: 140, damage: 14, interval: 2, range: 144, towerLevel: 3 });
      const saved = await state(page);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).capitol, saved.capitol);
      assert.equal((await state(page)).gold, saved.gold);
      await openCapitol(page); await fits(page); await close(page);
      await page.locator('#open-profile').click(); await page.locator('#reset').click();
      assert.deepEqual((await state(page)).capitol, saved.capitol, 'First reset click only confirms');
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).capitol, emptyCapitol);
      await page.reload(); await ready(page); await openCapitol(page); await assertDefaults(page);
    });

    await scenario('insufficient-gold', viewport, fixture({ gold: 25 }), async page => {
      await openCapitol(page);
      for (const id of ['health', 'tower']) assert.equal(await button(page, id).isDisabled(), true);
      await page.locator('[data-capitol-upgrade]').evaluateAll(nodes => nodes.forEach(node => node.click()));
      assert.equal((await state(page)).gold, 25); assert.deepEqual((await state(page)).capitol, emptyCapitol);
      await fits(page);
    });
  }

  await scenario('tower-loads-without-army-archers', { width: 390, height: 700 }, fixture({
    units: [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }], reserve: [],
  }), async page => {
    const archerRequests = [];
    page.on('request', request => { if (request.url().includes('tiny-swords-archer-blue.png')) archerRequests.push(request.url()); });
    const before = await state(page);
    await page.locator('[data-capitol-upgrade]').evaluateAll(nodes => nodes.forEach(node => node.click()));
    assert.deepEqual((await state(page)).capitol, before.capitol, 'Hidden-panel controls cannot buy upgrades');
    assert.equal((await state(page)).gold, before.gold);
    await openCapitol(page); await button(page, 'tower').click(); await ready(page);
    assert.ok(archerRequests.length > 0, 'Building the turret loads its archer atlas even without army archers');
    assert.deepEqual((await state(page)).units.map(unit => unit.type), ['swordsman']);
    await close(page); await page.locator('#start-wave').click(); await ready(page);
    await page.evaluate(() => window.capitolCheck.render());
    assert.equal((await battle(page)).castle.stats.towerLevel, 1);
    assert.equal((await battle(page)).castle.damage, 10);
    await page.screenshot({ path: fileURLToPath(new URL('capitol-tower-390.png', output)) });
  });

  await scenario('save-recovery-does-not-repeat-purchase', { width: 320, height: 568 }, fixture(), async page => {
    await openCapitol(page);
    const savedBefore = await stored(page);
    await page.evaluate(() => window.capitolStorage.failWrites(true));
    await button(page, 'tower').click(); await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    assert.equal((await state(page)).gold, 400); assert.deepEqual((await state(page)).capitol, { health: 0, tower: 1 });
    assert.equal((await stored(page)).gold, savedBefore.gold);
    assert.deepEqual((await stored(page)).capitol, savedBefore.capitol, 'Failed save preserves durable original');
    await page.locator('[data-capitol-upgrade]').evaluateAll(nodes => nodes.forEach(node => node.click()));
    assert.equal((await state(page)).gold, 400); assert.deepEqual((await state(page)).capitol, { health: 0, tower: 1 });
    await page.evaluate(() => window.capitolStorage.failWrites(false));
    await page.locator('#recovery-retry').click(); await ready(page);
    assert.equal((await stored(page)).gold, 400); assert.deepEqual((await stored(page)).capitol, { health: 0, tower: 1 });
    await page.reload(); await ready(page);
    assert.equal((await state(page)).gold, 400); assert.deepEqual((await state(page)).capitol, { health: 0, tower: 1 });
  });

  await scenario('income-receipt-blocks-purchase', { width: 320, height: 568 }, fixture(), async page => {
    await openCapitol(page);
    await page.evaluate(timestamp => window.capitolCheck.setTime(timestamp), now + 2 * 60 * 60_000);
    await button(page, 'tower').click();
    await page.locator('#offline-rewards-panel').waitFor({ state: 'visible' });
    assert.deepEqual((await state(page)).capitol, emptyCapitol, 'A receipt opened by tickEconomy blocks the same-click upgrade');
    const goldAfterIncome = (await state(page)).gold;
    await page.locator('[data-capitol-upgrade]').evaluateAll(nodes => nodes.forEach(node => node.click()));
    assert.deepEqual((await state(page)).capitol, emptyCapitol);
    assert.equal((await state(page)).gold, goldAfterIncome);
    await page.locator('#collect-offline-rewards').click();
    assert.equal(await button(page, 'tower').isEnabled(), true, 'Collect immediately re-enables the original Capitol control');
    await button(page, 'tower').click();
    assert.deepEqual((await state(page)).capitol, { health: 0, tower: 1 });
    assert.equal((await state(page)).gold, goldAfterIncome - 100);
    await fits(page);
  });
  console.log(JSON.stringify({ ok: true, checks, screenshots: ['capitol-390.png', 'capitol-320.png'].map(file => fileURLToPath(new URL(file, output))) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
