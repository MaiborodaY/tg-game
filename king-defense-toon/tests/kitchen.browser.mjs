// Disposable saves only. Real UI, campaign commands, persistence and battle wiring;
// controlled time makes long food durations and save retries deterministic.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { createCampaignState, campaignSnapshot } from '../campaign-state.ts';
import { createFarm } from '../farm.ts';
import { cookCampaignMeals } from '../campaign-commands.ts';
import { getForgedUnitStats } from '../forge.ts';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const now = 1800000000000, key = 'brotd-infinity:campaign:v2';
const output = new URL('../../.tmp/kitchen/', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/kitchen/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'kitchen-check', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.kitchenCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => visibleBattle() && JSON.parse(JSON.stringify(visibleBattle())),
      time: timestamp => { window.kitchenNow = timestamp; sessionStorage.setItem('__kitchen-time', String(timestamp)); refresh(); },
      tick: timestamp => { window.kitchenNow = timestamp; tickEconomy(); },
      frame: timestamp => { window.kitchenNow = timestamp; framePacer.reset(); const clock = performance.now(); frame(clock); frame(clock + 100); frame(clock + 200); },
    };`;
  } }] });

function fixture({ carrot = 20, potato = 0, farmLevel = 1, food = false, legacy = false } = {}) {
  const state = createCampaignState(now);
  state.onboardingCompleted = true; state.autoWaves = false; state.clearedWaves = 50;
  state.progression.firstClears = Array.from({ length: 50 }, (_, i) => i + 1);
  state.units = ['swordsman', 'archer', 'healer'].map((type, row) => ({ id: row + 1, type, level: 100, col: 2, row }));
  state.nextUnitId = 4;
  state.farm = createFarm({ ...state.farm, level: farmLevel, stock: { carrot, potato, pumpkin: 0 } }, now);
  if (food) for (const stat of ['health', 'attack', 'attackSpeed']) assert.equal(cookCampaignMeals(state, `carrot-${stat}`, 1, now).ok, true);
  const saved = campaignSnapshot(state);
  if (legacy) { delete saved.kitchen; saved.saveSchemaVersion = 3; }
  return saved;
}
const state = page => page.evaluate(() => window.kitchenCheck.state());
const row = (page, stat = 'health') => page.locator(`[data-recipe-stat="${stat}"]`);
const close = page => page.locator('#buildings-panel [data-close-overlay]').click();
const setTime = (page, time) => page.evaluate(value => window.kitchenCheck.time(value), time);
const open = async page => { await page.locator('#open-buildings').click(); await page.locator('#tab-kitchen').click(); };
async function ready(page) {
  await page.waitForFunction(() => window.kitchenCheck?.ready());
  await page.evaluate(async () => { window.kitchenCheck.freeze(); await document.fonts.ready; });
}
async function fits(page) {
  const issues = await page.locator('#buildings-panel .menu-card').evaluate(card => {
    const bad = [], rect = card.getBoundingClientRect();
    if (card.scrollHeight > card.clientHeight + 1) bad.push(`kitchen needs vertical scrolling: ${card.scrollHeight}/${card.clientHeight}; ${[...card.querySelectorAll('.menu-heading, .building-tabs, #kitchen-content, .kitchen-level, .kitchen-ingredients, .kitchen-recipes, .kitchen-batch, .kitchen-cook-controls, .kitchen-status')].map(e => `${e.className || e.id}=${e.getBoundingClientRect().height}`).join(', ')}`);
    if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) bad.push('card outside screen');
    for (const element of card.querySelectorAll('#kitchen-content, .kitchen-recipe, .kitchen-cook-controls, .kitchen-active, .kitchen-level')) {
      if (element.scrollWidth > element.clientWidth + 1) bad.push(`${element.className || element.id}: horizontal overflow`);
    }
    for (const button of card.querySelectorAll('button, input')) {
      if (button.getClientRects().length && button.getBoundingClientRect().height < 44) bad.push('touch target below 44px');
    }
    return bad;
  });
  assert.deepEqual(issues, []);
}

let browser, baseUrl;
const checks = [];
async function scenario(name, width, height, saved, check) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  const errors = [];
  let page;
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ saved, key, now }) => {
      window.kitchenNow = Number(sessionStorage.getItem('__kitchen-time')) || now;
      Date.now = () => window.kitchenNow;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      if (!get.call(sessionStorage, '__kitchen-seeded')) {
        set.call(localStorage, key, JSON.stringify(saved)); set.call(sessionStorage, '__kitchen-seeded', '1');
      }
      let fail = false;
      Storage.prototype.setItem = function(k, value) {
        if (this === localStorage && k === key && fail) throw new DOMException('Test storage failure', 'QuotaExceededError');
        return set.call(this, k, value);
      };
      window.kitchenStorage = { fail: value => { fail = value; }, raw: () => get.call(localStorage, key) };
    }, { saved, key, now });
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(baseUrl); await ready(page);
    await check(page);
    assert.deepEqual(errors, []);
    checks.push(`${name} ${width}x${height}`); console.log('PASS', checks.at(-1));
  } catch (error) {
    if (page) await page.screenshot({ path: fileURLToPath(new URL(`${name}-${width}-FAILED.png`, output)) });
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true });
  baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true });
  for (const [width, height] of [[320, 568], [390, 700]]) {
    await scenario('bulk-cooking-navigation', width, height, fixture({ carrot: 10, legacy: true }), async page => {
      const dishRequests = () => page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/assets/kitchen/dishes.webp')).length);
      assert.equal(await dishRequests(), 0, 'food atlas stays unloaded until Kitchen is opened');
      await open(page); await fits(page);
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('/assets/kitchen/dishes.webp')));
      assert.equal(await dishRequests(), 1, 'all dishes share one image request');
      assert.equal(await page.locator('[data-cook]').count(), 1);
      assert.equal(await page.locator('#tab-kitchen').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#buildings-panel .menu-heading button').count(), 1);
      assert.equal(await page.locator('.building-wallet').first().isHidden(), true);
      await page.screenshot({ path: fileURLToPath(new URL(`kitchen-before-${width}.png`, output)) });
      await page.locator('[data-kitchen-help]').click();
      assert.equal(await page.locator('[data-kitchen-main]').evaluate(node => node.inert), true);
      assert.match(await page.locator('#kitchen-help').innerText(), /time, not %/);
      assert.match(await page.locator('#kitchen-help').innerText(), /10, 40, 90/);
      assert.match(await page.locator('#kitchen-help').innerText(), /30 seconds/);
      await page.screenshot({ path: fileURLToPath(new URL(`kitchen-help-${width}.png`, output)) });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#buildings-panel').isVisible(), true);
      assert.equal(await page.locator('#kitchen-help').isHidden(), true);
      assert.equal(await page.locator('[data-kitchen-help]').evaluate(node => node === document.activeElement), true);
      assert.equal(await page.locator('[data-recipe-stat="attackSpeed"] [data-stat-icon] circle').count(), 0);
      assert.equal(await page.locator('[data-batch] .kitchen-clock circle').count(), 1);
      assert.equal(await page.locator('button[data-ingredient="potato"]').isDisabled(), true);
      assert.equal(await page.locator('[data-quantity]').inputValue(), '1');
      await page.locator('[data-max]').click();
      assert.equal(await page.locator('[data-quantity]').inputValue(), '10');
      assert.match(await page.locator('[data-batch]').getAttribute('aria-label'), /10 carrot.*1h 40m.*10 cooking XP/);
      await page.locator('[data-cook]').click();
      const cooked = await state(page);
      assert.equal(cooked.farm.stock.carrot, 0); assert.equal(cooked.kitchen.mealsCooked, 10);
      assert.equal(cooked.kitchen.buffs.health[0].endsAt, now + 6000000);
      assert.equal(await page.locator('[data-quantity]').inputValue(), '1');
      assert.equal(await page.locator('[data-cook]').isDisabled(), true);
      assert.match(await page.locator('[data-kitchen-level]').innerText(), /Lv.2/);
      await fits(page);
      await setTime(page, now + 3000);
      assert.equal(await page.locator('[data-kitchen-farm]').isVisible(), true);
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL(`kitchen-${width}.png`, output)) });
      await page.locator('#tab-farm').click();
      assert.equal(await page.locator('#buildings-panel').isVisible(), true);
      assert.equal(await page.locator('#tab-farm').evaluate(node => node === document.activeElement), true);
      await page.locator('#tab-kitchen').click(); await close(page);
      assert.equal(await dishRequests(), 1, 'reopening reuses the cached atlas');
      assert.equal(await page.locator('#open-buildings').evaluate(node => node === document.activeElement), true);
      await page.reload(); await ready(page); await open(page);
      assert.deepEqual((await state(page)).kitchen, cooked.kitchen);
      assert.equal((await state(page)).farm.stock.carrot, 0);
    });
    await scenario('selection-empty-and-help', width, height, fixture({ carrot: 5 }), async page => {
      await open(page);
      await row(page, 'attackSpeed').click();
      assert.equal(await row(page, 'attackSpeed').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-max]').click(); await page.locator('[data-cook]').click();
      const cooked = await state(page);
      assert.equal(cooked.kitchen.buffs.attackSpeed[0].endsAt, now + 3000000);
      assert.equal(cooked.kitchen.buffs.health.length, 0);
      assert.equal(cooked.kitchen.buffs.attack.length, 0);
      assert.match(await page.locator('[data-kitchen-feedback]').innerText(), /5 portions ready/);
      await setTime(page, now + 3000);
      await fits(page);
      await page.locator('[data-kitchen-farm]').click();
      assert.equal(await page.locator('#farm-building').isVisible(), true);
      await page.locator('#tab-kitchen').click();
      await page.locator('[data-kitchen-help]').click();
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('[data-help-close]').evaluate(node => node === document.activeElement), true);
      await page.locator('[data-help-close]').click();
      await close(page);
      assert.equal(await page.locator('#open-buildings').evaluate(node => node === document.activeElement), true);
    });
    await scenario('typed-count-potato-queue', width, height, fixture({ potato: 20, farmLevel: 2 }), async page => {
      await open(page);

      await page.locator('[data-quantity]').fill('21');
      assert.equal(await page.locator('[data-cook]').isDisabled(), true);
      await page.locator('[data-quantity]').fill('3');
      await page.locator('[data-more]').click(); await page.locator('[data-less]').click();
      assert.equal(await page.locator('[data-quantity]').inputValue(), '3');
      await row(page).click(); await page.locator('button[data-ingredient="carrot"]').click();
      assert.equal(await page.locator('[data-quantity]').inputValue(), '3', 'reselecting the same dish keeps the entered quantity');
      await page.locator('[data-cook]').click();
      await page.locator('button[data-ingredient="potato"]').click();
      assert.equal(await page.locator('[data-quantity]').inputValue(), '1');
      await page.locator('[data-quantity]').fill('2'); await page.locator('[data-cook]').click();
      assert.match(await page.locator('[data-food-active="health"] [data-food-timer]').innerText(), /20:00/);
      assert.match(await page.locator('[data-recipe-stat="health"] [data-food-queue]').innerText(), /Then \+1%.*30:00/);
      await row(page, 'attack').click(); await page.locator('[data-cook]').click();
      await row(page, 'attackSpeed').click(); await page.locator('[data-cook]').click();
      assert.equal((await state(page)).kitchen.mealsCooked, 7);
      await fits(page);
      await page.screenshot({ path: fileURLToPath(new URL(`kitchen-potato-${width}.png`, output)) });
      const activeInput = page.locator('[data-quantity]');
      await activeInput.focus();
      await setTime(page, now + 1000);
      assert.equal(await activeInput.evaluate(node => node === document.activeElement), true);
      await setTime(page, now + 1200000);
      assert.match(await page.locator('[data-food-active="health"] [data-food-timer]').innerText(), /\+1%.*30:00/);
      await setTime(page, now + 3000000);
      assert.equal(await page.locator('[data-food-active="health"]').isHidden(), true);
    });
  }
  await scenario('all-stat-queues', 320, 568, fixture({ food: true, potato: 20, farmLevel: 2 }), async page => {
    await open(page); await page.locator('button[data-ingredient="potato"]').click();
    for (const stat of ['health', 'attack', 'attackSpeed']) {
      await row(page, stat).click(); await page.locator('[data-cook]').click();
      assert.match(await row(page, stat).locator('[data-food-queue]').innerText(), /Then \+1%.*10:00/);
    }
    await page.locator('button[data-ingredient="carrot"]').click();
    for (const stat of ['health', 'attack', 'attackSpeed']) {
      assert.equal(await row(page, stat).locator('[data-recipe-bonus]').innerText(), '+1%');
      assert.match(await row(page, stat).locator('[data-food-timer]').innerText(), /\+2%.*10:00/);
    }
    await fits(page);
    await page.screenshot({ path: fileURLToPath(new URL('kitchen-all-queues-320.png', output)) });
  });
  await scenario('large-stock-preview', 320, 568, fixture({ carrot: 1000000000 }), async page => {
    await open(page); await page.locator('[data-max]').click();
    assert.equal(await page.locator('[data-quantity]').inputValue(), '1000000000');
    await fits(page);
    assert.equal((await state(page)).kitchen.mealsCooked, 0);
  });
  await scenario('quota-retry-exactly-once', 390, 700, fixture({ carrot: 10 }), async page => {
    await open(page); await page.locator('[data-max]').click();
    await page.evaluate(() => window.kitchenStorage.fail(true));
    await page.locator('[data-cook]').click();
    await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    const pending = await state(page);
    assert.equal(pending.kitchen.mealsCooked, 10); assert.equal(pending.farm.stock.carrot, 0);
    assert.equal(await page.evaluate(() => JSON.parse(window.kitchenStorage.raw()).farm.stock.carrot), 10);
    await page.locator('[data-cook]').evaluate(node => node.click());
    assert.deepEqual((await state(page)).kitchen, pending.kitchen);
    await page.evaluate(() => window.kitchenStorage.fail(false));
    await page.locator('#recovery-retry').click(); await ready(page);
    await page.reload(); await ready(page);
    assert.deepEqual((await state(page)).kitchen, pending.kitchen);
    assert.equal((await state(page)).farm.stock.carrot, 0);
  });
  for (const mode of ['campaign', 'dungeon']) await scenario(`battle-expiry-${mode}`, 390, 700, fixture({ food: true }), async page => {
    if (mode === 'campaign') await page.locator('#start-wave').click();
    else {
      await page.locator('#open-dungeons').click();
      await page.locator('[data-dungeon-level="goblin-cave-1"]').click(); await page.waitForFunction(() => window.kitchenCheck.ready());
      // The held RAF normally refreshes cave readiness at its next HUD tick.
      await page.evaluate(time => window.kitchenCheck.frame(time), now);
      await page.locator('[data-run-start]').click();
    }
    const active = await page.evaluate(() => window.kitchenCheck.battle());
    assert.ok(active);
    const unit = active.allies[0], base = getForgedUnitStats(unit.type, unit.level);
    assert.ok(Math.abs(unit.maxHp - base.hp * 1.01) < 1e-8);
    assert.ok(Math.abs(unit.damage - base.damage * 1.01) < 1e-8);
    // Actual shared frame path expires food, even while the economy interval is held.
    await page.evaluate(time => window.kitchenCheck.frame(time), now + 600000);
    const expired = await page.evaluate(() => window.kitchenCheck.battle());
    assert.equal(expired.allies[0].maxHp, base.hp);
    assert.equal(expired.allies[0].damage, base.damage);
    assert.equal(expired.allies[0].attackSpeed, base.attackSpeed);
  });
  await scenario('cook-during-running-battle', 390, 700, fixture(), async page => {
    await page.locator('#start-wave').click();
    const before = await page.evaluate(() => window.kitchenCheck.battle());
    await open(page);
    for (const stat of ['health', 'attack', 'attackSpeed']) { await row(page, stat).click(); await page.locator('[data-cook]').click(); }
    const after = await page.evaluate(() => window.kitchenCheck.battle());
    assert.equal(after.phase, 'running');
    assert.equal(after.allies[0].maxHp, before.allies[0].maxHp * 1.01);
    assert.equal(after.allies[0].damage, before.allies[0].damage * 1.01);
    assert.equal(after.allies[0].attackSpeed, before.allies[0].attackSpeed * 1.01);
    assert.deepEqual(after.hero, before.hero); assert.deepEqual(after.castle, before.castle);
  });
  await scenario('offline-expiry', 390, 700, fixture({ food: true }), async page => {
    await setTime(page, now + 3600000);
    await page.reload(); await ready(page);
    if (await page.locator('#offline-rewards-panel').isVisible()) await page.locator('#collect-offline-rewards').click();
    await open(page);
    assert.deepEqual((await state(page)).kitchen.buffs, { health: [], attack: [], attackSpeed: [] });
    assert.equal((await state(page)).kitchen.mealsCooked, 3);
    assert.equal((await state(page)).farm.stock.carrot, 17);
  });
  console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally { await browser?.close(); await server.close(); }
