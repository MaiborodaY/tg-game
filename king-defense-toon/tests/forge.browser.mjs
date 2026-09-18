// Disposable mobile contexts exercise the real Forge UI and saved combat bonuses.
// Test-only Vite hooks freeze clocks; completing a wave still uses the app's result flow.
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
const ids = ['health', 'attack', 'attackSpeed'];
const zeroForge = Object.fromEntries(ids.map(id => [id, 0]));
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/forge/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'forge-check-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    code = prependFunctionBody(code, 'tickEconomy', 'return;');
    return code + `\nwindow.forgeCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => JSON.parse(JSON.stringify(battle)),
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
    campaignVersion: 3, gold: 500, starterSupplyGranted: true,
    autoWaves: false, autoWavesDefaultVersion: 1, clearedWaves: 0,
    barracks: { level: 1, firstLancerPending: false },
    units: ['swordsman', 'archer', 'healer'].map((type, row) => ({ id: row + 1, type, level: 1, col: 2, row })),
    reserve: [{ id: 4, type: 'archer', level: 1 }],
    progression: { unlockedCells: ['2:0', '2:1', '2:2'], firstClears: [] },
    economy: { slaves: 0, treasuryUpdatedAt: now }, ...overrides,
  };
}
const state = page => page.evaluate(() => window.forgeCheck.state());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const battle = page => page.evaluate(() => window.forgeCheck.battle());
const button = (page, id) => page.locator(`[data-forge-upgrade="${id}"]`);
const row = (page, id) => page.locator(`[data-forge-row="${id}"]`);
const close = (page, id) => page.locator(`#${id} [data-close-overlay]`).click();
const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should be ${expected}`);

async function ready(page) {
  await page.waitForFunction(() => window.forgeCheck?.ready());
  await page.evaluate(async () => { window.forgeCheck.freeze(); await document.fonts.ready; });
}

async function openForge(page) {
  await page.locator('#open-buildings').click();
  await page.locator('#tab-forge').click();
  assert.equal(await page.locator('#forge-building').isVisible(), true);
}

async function fits(page, selector = '#buildings-panel .menu-card') {
  const issues = await page.locator(selector).evaluate(card => {
    const bad = [];
    const bounds = card.getBoundingClientRect();
    if (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1) bad.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1) bad.push(`card overflow: ${card.scrollWidth}x${card.scrollHeight} inside ${card.clientWidth}x${card.clientHeight}`);
    for (const element of card.querySelectorAll('.forge-row, .forge-copy, .forge-upgrade')) {
      if (element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className}: horizontal overflow`);
      if (element.classList.contains('forge-upgrade') && element.getBoundingClientRect().height < 44) bad.push('purchase touch target below 44px');
    }
    return bad;
  });
  assert.deepEqual(issues, [], 'Forge fits a compact mobile viewport');
}

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
      if (!sessionStorage.getItem('__forge-seeded')) {
        localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem('__forge-seeded', '1');
      }
    }, { saved, key, now });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await page.goto(baseUrl);
    await ready(page);
    await check(page);
    assert.deepEqual(errors, [], 'No browser or local asset errors');
    checks.push(`${name} ${width}px`);
    console.log(`PASS ${checks.at(-1)}`);
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({ path: fileURLToPath(new URL(`forge-${name}-FAILED-${width}.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true });
  baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [390, 320]) {
    await scenario('purchases-next-wave-reload-reset', width, fixture(), async page => {
      await page.locator('#start-wave').click();
      const initialBattle = await battle(page);
      assert.deepEqual((await state(page)).forge, zeroForge, 'Old saves start without bonuses');
      await openForge(page);
      assert.equal(await page.locator('#tab-army-space, #choose-cell').count(), 0);
      assert.deepEqual(await page.locator('[data-forge-upgrade]').evaluateAll(nodes => nodes.map(node => node.dataset.forgeUpgrade)), ids);
      assert.equal(await page.locator('[data-forge-upgrade="rangedAttack"], [data-forge-upgrade="rangedAttackSpeed"]').count(), 0);
      assert.doesNotMatch(await page.locator('#forge-building').innerText(), /Archers|Ranged attack|Ranged speed|extra bonus/i);
      await fits(page);
      for (const id of ids) {
        const cost = 50, nextCost = 75;
        const before = await state(page);
        assert.equal(await row(page, id).locator('[data-forge-price]').innerText(), String(cost));
        await button(page, id).click();
        assert.equal((await state(page)).gold, before.gold - cost);
        assert.equal((await state(page)).forge[id], 1);
        assert.equal(await page.locator('#building-gold').innerText(), String(before.gold - cost));
        assert.equal(await row(page, id).locator('[data-forge-bonus]').innerText(), '+1% → +2%');
        assert.equal(await row(page, id).locator('[data-forge-price]').innerText(), String(nextCost));
        assert.match(await page.locator('#forge-feedback').innerText(), /Applies next wave/);
        await fits(page);
      }
      assert.equal((await state(page)).gold, 350);
      assert.deepEqual((await battle(page)).allies, initialBattle.allies, 'Buying during combat never changes its existing fighters');
      assert.deepEqual((await battle(page)).hero, initialBattle.hero, 'Hero is excluded from all Forge purchases');
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL(`forge-${width}.png`, output)) });
      await close(page, 'buildings-panel');
      await page.evaluate(() => window.forgeCheck.victory());
      await page.locator('#return-prep').click();
      await page.locator('#start-wave').click();
      const nextBattle = await battle(page);
      assert.equal(nextBattle.waveNumber, 2);
      const sword = nextBattle.allies.find(unit => unit.type === 'swordsman');
      const archer = nextBattle.allies.find(unit => unit.type === 'archer');
      const healer = nextBattle.allies.find(unit => unit.type === 'healer');
      approx(sword.maxHp, 60.6); approx(sword.damage, 6.06); approx(sword.attackSpeed, 1.01);
      approx(archer.maxHp, 32.32); approx(archer.damage, 8.08); approx(archer.attackSpeed, 1.01);
      approx(healer.heal, 4.04); approx(healer.attackSpeed, 1.01);
      const saved = await state(page);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).forge, saved.forge);
      assert.equal((await state(page)).gold, saved.gold);
      await tapCell(page, 2, 0);
      assert.match(await page.locator('#selection-panel .selected-stats').innerText(), /60\.6 HP · 6\.06 attack · \+1% speed/);
      await close(page, 'unit-panel');
      await page.locator('#open-barracks').click();
      const reserve = (await state(page)).reserve[0];
      await page.locator(`[data-barracks-unit-id="${reserve.id}"]`).click();
      assert.match(await page.locator('#barracks-detail').innerText(), /8\.08/);
      assert.match(await page.locator('#barracks-detail').innerText(), /\+1%/);
      await close(page, 'barracks-panel');
      await page.locator('#open-profile').click();
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).forge, saved.forge, 'Reset requires its confirmation click');
      await page.locator('#reset').click();
      assert.deepEqual((await state(page)).forge, zeroForge);
      await page.reload(); await ready(page);
      assert.deepEqual((await state(page)).forge, zeroForge, 'Reset persists without restoring purchased bonuses');
      await openForge(page);
      assert.equal(await row(page, 'health').locator('[data-forge-bonus]').innerText(), '+0% → +1%');
      assert.equal(await row(page, 'health').locator('[data-forge-price]').innerText(), '50');
    });

    await scenario('insufficient-gold', width, fixture({ gold: 25 }), async page => {
      await openForge(page);
      for (const id of ids) assert.equal(await button(page, id).isDisabled(), true);
      await page.locator('[data-forge-upgrade]').evaluateAll(nodes => nodes.forEach(node => node.click()));
      assert.equal((await state(page)).gold, 25, 'Disabled controls cannot spend gold');
      assert.deepEqual((await state(page)).forge, zeroForge);
      await fits(page);
    });

    await scenario('maximum-rank', width, fixture({ forge: Object.fromEntries(ids.map(id => [id, 100])) }), async page => {
      await openForge(page);
      for (const id of ids) {
        assert.equal(await button(page, id).isDisabled(), true);
        assert.equal(await row(page, id).locator('[data-forge-bonus]').innerText(), '+100% · Max');
        assert.equal(await row(page, id).locator('.forge-price').isVisible(), false);
        assert.equal(await button(page, id).innerText(), 'Max');
      }
      await fits(page);
    });

    await scenario('legacy-ranged-refund-once', width, fixture({
      forge: { health: 4, attack: 5, attackSpeed: 6, rangedAttack: 2, rangedAttackSpeed: 3 },
    }), async page => {
      const common = { health: 4, attack: 5, attackSpeed: 6 };
      // The two retired tracks cost (25 + 40) + (25 + 40 + 55), not their next purchase prices.
      const refundedGold = 685;
      let current = await state(page);
      assert.equal(current.gold, refundedGold);
      assert.deepEqual(current.forge, common, 'Common ranks survive while retired bonuses are removed');
      assert.equal(current.offlineRewards.forgeRefund, 185);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
      assert.equal(await page.locator('#offline-rewards-title').innerText(), 'Forge updated');
      assert.equal(await page.locator('#forge-refund-reward').isVisible(), true);
      assert.equal(await page.locator('#forge-refund-amount').innerText(), '+185');
      assert.equal(await page.locator('#collect-offline-rewards').innerText(), 'Continue');
      assert.equal(await page.locator('#offline-gold-reward').isVisible(), false, 'Refund is identified separately from offline income');
      assert.equal(await page.locator('#offline-storage-note').isVisible(), false);
      assert.deepEqual((await stored(page)).forge, common, 'The obsolete fields are stripped in the committed save');
      assert.equal((await stored(page)).gold, refundedGold);
      assert.equal((await stored(page)).offlineRewards.forgeRefund, 185, 'Refund and receipt persist together');
      await fits(page, '#offline-rewards-panel .offline-rewards-card');
      await page.screenshot({ path: fileURLToPath(new URL(`forge-refund-${width}.png`, output)) });

      await page.reload(); await ready(page);
      assert.equal((await state(page)).gold, refundedGold, 'Reload before acknowledging cannot pay twice');
      assert.equal((await state(page)).offlineRewards.forgeRefund, 185);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
      assert.equal(await page.locator('#forge-refund-amount').innerText(), '+185');
      await page.locator('#collect-offline-rewards').click();
      assert.equal((await state(page)).gold, refundedGold, 'Continue acknowledges already credited gold');
      assert.equal((await state(page)).offlineRewards.forgeRefund, 0);
      assert.equal((await stored(page)).offlineRewards.forgeRefund, 0);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      await page.reload(); await ready(page);
      assert.equal((await state(page)).gold, refundedGold, 'Acknowledged migrations also remain one-time');
      assert.deepEqual((await state(page)).forge, common);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
      await openForge(page);
      assert.deepEqual(await page.locator('[data-forge-upgrade]').evaluateAll(nodes => nodes.map(node => node.dataset.forgeUpgrade)), ids);
      for (const id of ids) {
        assert.equal(await row(page, id).locator('[data-forge-bonus]').innerText(), `+${common[id]}% → +${common[id] + 1}%`);
        assert.equal(await row(page, id).locator('[data-forge-price]').innerText(), String(50 + 25 * common[id]));
      }
      await fits(page);
      await close(page, 'buildings-panel');
      await page.locator('#start-wave').click();
      const snapshot = await battle(page);
      const sword = snapshot.allies.find(unit => unit.type === 'swordsman');
      const archer = snapshot.allies.find(unit => unit.type === 'archer');
      const healer = snapshot.allies.find(unit => unit.type === 'healer');
      approx(sword.maxHp, 62.4); approx(sword.damage, 6.3); approx(sword.attackSpeed, 1.06);
      approx(archer.maxHp, 33.28); approx(archer.damage, 8.4); approx(archer.attackSpeed, 1.06);
      approx(healer.heal, 4.2); approx(healer.attackSpeed, 1.06);
      assert.equal(snapshot.hero.maxHp, 60); assert.equal(snapshot.hero.damage, 4);
      await page.reload(); await ready(page);
      await page.locator('#open-profile').click();
      await page.locator('#reset').click(); await page.locator('#reset').click();
      current = await state(page);
      assert.deepEqual(current.forge, zeroForge);
      assert.equal(current.offlineRewards.forgeRefund, 0);
      const resetGold = current.gold;
      await page.reload(); await ready(page);
      assert.equal((await state(page)).gold, resetGold, 'Reset cannot resurrect a legacy refund');
      assert.deepEqual((await state(page)).forge, zeroForge);
      assert.equal((await state(page)).offlineRewards.forgeRefund, 0);
      assert.equal(await page.locator('#offline-rewards-panel').isVisible(), false);
    });
  }
  console.log(JSON.stringify({ ok: true, checks, screenshot: fileURLToPath(new URL('forge-390.png', output)) }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
