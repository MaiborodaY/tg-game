import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { createCampaignState, campaignSnapshot } from '../campaign-state.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const key = 'brotd-infinity:campaign:v2', now = 1800000000000;
const output = new URL('../../.tmp/dungeons/', import.meta.url);
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/dungeons/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'dungeon-browser-observation', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    return code + `\nwindow.dungeonCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      battle: () => battle && ({ wave: battle.waveNumber, elapsed: battle.elapsed, phase: battle.phase }),
      run: () => dungeonRun && ({ level: dungeonRun.level.id, battle: dungeonRun.battle && {
        elapsed: dungeonRun.battle.elapsed, phase: dungeonRun.battle.phase, total: dungeonRun.battle.total } }),
      finishWave: () => {
        if (!battle || battle.phase !== 'running') throw new Error('No running battle');
        for (let i = 0; i < 30000 && battle.phase === 'running'; i++) updateBattle(battle, 1/60);
        if (battle.phase !== 'victory') throw new Error('Real combat fixture did not win');
        const result = applyBattleKillRewards(campaign, battle.campaignRewards,
          { kills: battle.kills, totalGold: battle.reward }, () => .99);
        if (!result.ok) throw new Error(result.reason);
        showResult();
      },
      absence: () => {
        pauseForInactivity();
        campaign.economy.marketUpdatedAt -= 3600000;
        activateGame();
      },
      save: () => save(),
      restoreStorage: () => { localStorage.setItem = window.originalSetItem; },
    };`;
  } }],
});

function fixture(cleared = 50, autoWaves = false) {
  const state = createCampaignState(now);
  state.onboardingCompleted = true; state.autoWaves = autoWaves;
  state.clearedWaves = cleared;
  state.progression.firstClears = Array.from({ length: cleared }, (_, i) => i + 1);
  state.units = [
    { id: 1, type: 'swordsman', level: 1000, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 1000, col: 2, row: 1 },
    { id: 3, type: 'healer', level: 1000, col: 2, row: 2 },
  ];
  state.nextUnitId = 4;
  return campaignSnapshot(state);
}

let browser, baseUrl;
const checks = [];
async function scenario(name, width, height, saved, check, telegram = false) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  const errors = [];
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ key, saved, now, telegram, height }) => {
      Date.now = () => now;
      if (telegram) {
        window.telegramEvents = {};
        window.Telegram = { WebApp: { platform: 'android', isActive: true,
          viewportHeight: height, viewportStableHeight: height,
          safeAreaInset: { top: 24, bottom: 34 }, contentSafeAreaInset: { top: 68 },
          isVersionAtLeast: () => true,
          onEvent: (name, handler) => { window.telegramEvents[name] = handler; },
          offEvent: name => { delete window.telegramEvents[name]; },
        } };
      }
      if (!sessionStorage.getItem('dungeon-fixture')) {
        localStorage.setItem(key, JSON.stringify(saved)); sessionStorage.setItem('dungeon-fixture', '1');
      }
      window.dungeonDraws = { battle: 0, 'army-map': 0 };
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function(...args) {
        if (this.canvas.id in window.dungeonDraws) window.dungeonDraws[this.canvas.id]++;
        return clear.apply(this, args);
      };
    }, { key, saved, now, telegram, height });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(baseUrl)) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.dungeonCheck?.ready());
    await page.evaluate(() => document.fonts.ready);
    await check(page);
    assert.deepEqual(errors, []);
    checks.push(name); console.log('PASS', name);
  } finally { await context.close(); }
}
const open = page => page.locator('#open-dungeons').click();
const back = page => page.locator('[data-dungeon-action="back"]').click();
const inventory = state => ({ units: state.units, reserve: state.reserve, gold: state.gold, slaves: state.economy.slaves, hero: state.hero });
async function fits(page) {
  const issues = await page.locator('#dungeons-screen').evaluate(screen => {
    const rect = screen.getBoundingClientRect(), issues = [];
    if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) issues.push('screen outside viewport');
    for (const element of screen.querySelectorAll('.dungeon-scroll, .dungeon-level-card, .dungeon-card-copy, .dungeon-rules-card, .dungeon-heading')) {
      if (element.getClientRects().length && element.scrollWidth > element.clientWidth + 1) issues.push(`${element.className} overflows horizontally`);
    }
    return issues;
  });
  assert.deepEqual(issues, []);
}

try {
  await mkdir(output, { recursive: true });
  baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await scenario(`catalogue/rewards/rules ${width}x${height}`, width, height, fixture(), async page => {
      const before = await page.evaluate(() => window.dungeonCheck.state());
      await open(page); await fits(page);
      assert.equal(await page.locator('.dungeon-level-card').count(), 3);
      assert.equal(await page.locator('.dungeon-level-card.is-unlocked').count(), 1);
      assert.equal(await page.locator('.dungeon-level-card.is-locked').count(), 2);
      await page.screenshot({ path: fileURLToPath(new URL(`catalogue-${width}.png`, output)) });
      for (const [tier, gold, slaves] of [[1, 150, 3], [2, 300, 5], [3, 500, 8]]) {
        const card = page.locator('.dungeon-level-card').nth(tier - 1);
        const text = await card.locator('.dungeon-card-rewards').innerText();
        assert.ok(text.includes(`${gold} gold`) && text.includes(`${slaves} slaves`));
        assert.equal(await card.locator('button').isDisabled(), tier !== 1);
      }
      assert.equal(await page.locator('.dungeon-details').count(), 0);
      await page.locator('[data-dungeon-action="rules"]').click(); await fits(page);
      const rules = await page.locator('#dungeon-rules').innerText();
      for (const phrase of ['3 waves per run', 'Final boss on wave 3', 'No recovery between waves', 'Fallen units stay out for the run', 'Healing during combat still works']) assert.ok(rules.includes(phrase));
      assert.equal(await page.locator('.dungeon-page').evaluate(el => el.inert), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Got it');
      await page.screenshot({ path: fileURLToPath(new URL(`rules-${width}.png`, output)) });
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.dungeonAction), 'rules');
      await back(page);
      assert.equal(await page.locator('#dungeons-screen').isHidden(), true);
      assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-dungeons');
      assert.deepEqual(inventory(await page.evaluate(() => window.dungeonCheck.state())), inventory(before));
    });
  }
  await scenario('cave screen shares the renderer but isolates the campaign battle and formation', 390, 844, fixture(), async page => {
    await page.locator('#start-wave').click(); await open(page);
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => window.dungeonCheck.ready());
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeon-battle');
    for (const id of ['open-barracks', 'transform-slave', 'open-buildings', 'open-market-info', 'auto-waves', 'start-wave']) {
      assert.equal(await page.locator(`#${id}`).isVisible(), false);
    }
    assert.equal(await page.locator('#open-hero').isVisible(), true);
    const pausedAt = await page.evaluate(() => window.dungeonCheck.battle().elapsed);
    const before = await page.evaluate(() => window.dungeonCheck.state());
    await page.locator('#army-map').focus(); await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await page.locator('#open-hero').click();
    await page.locator('#hero-panel').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('[data-run-start]').click();
    await page.waitForFunction(() => window.dungeonCheck.run().battle?.elapsed > .4);
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle.total, 4);
    assert.equal(await page.evaluate(() => window.dungeonCheck.battle().elapsed), pausedAt);
    assert.deepEqual(inventory(await page.evaluate(() => window.dungeonCheck.state())), inventory(before));
    await page.screenshot({ path: fileURLToPath(new URL('cave-battle.png', output)) });
    await page.locator('[data-run-exit]').click();
    assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null);
    await page.waitForFunction(elapsed => window.dungeonCheck.battle().elapsed > elapsed, pausedAt);
    await back(page);
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'campaign');
  });
  await scenario('hidden combat, automatic next wave, live unlocks and zero canvas draws', 390, 844, fixture(49, true), async page => {
    await page.locator('#start-wave').click(); await open(page);
    const before = await page.evaluate(() => { window.dungeonDraws = { battle: 0, 'army-map': 0 }; return window.dungeonCheck.battle(); });
    await page.waitForFunction(elapsed => window.dungeonCheck.battle().elapsed > elapsed + .4, before.elapsed);
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    assert.deepEqual(await page.evaluate(() => window.dungeonDraws), { battle: 0, 'army-map': 0 });
    await page.locator('[data-dungeon-action="rules"]').click();
    await page.evaluate(() => window.dungeonCheck.finishWave());
    await page.waitForFunction(() => window.dungeonCheck.battle()?.wave === 51);
    assert.equal(await page.locator('#dungeon-rules').isVisible(), true, 'wave transition retains foreground rules');
    assert.equal(await page.evaluate(() => document.activeElement.closest('#dungeon-rules') !== null), true, 'battle result cannot steal focus');
    assert.deepEqual(await page.evaluate(() => window.dungeonDraws), { battle: 0, 'army-map': 0 });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.dungeon-level-card.is-unlocked').count(), 1);
    await back(page);
    await page.waitForFunction(() => window.dungeonDraws.battle > 0 && window.dungeonDraws['army-map'] > 0);
    assert.equal((await page.evaluate(() => window.dungeonCheck.battle())).wave, 51);
  });
  await scenario('offline receipt and save recovery preserve the covered screen and focus', 390, 844, fixture(), async page => {
    await open(page); await page.locator('[data-dungeon-action="rules"]').click();
    await page.evaluate(() => window.dungeonCheck.absence());
    await page.locator('#collect-offline-rewards').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#dungeons-screen').evaluate(el => el.inert), true);
    await page.locator('#collect-offline-rewards').click();
    assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), true);
    assert.equal(await page.locator('#dungeons-screen').evaluate(el => el.inert), false);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#dungeon-rules')), true);
    await page.evaluate(() => {
      window.originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new DOMException('Fixture quota', 'QuotaExceededError'); };
      window.dungeonCheck.save();
    });
    await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#dungeons-screen').evaluate(el => el.inert), true);
    await page.evaluate(() => window.dungeonCheck.restoreStorage());
    await page.locator('#recovery-retry').click();
    await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), true);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#dungeon-rules')), true);
    await page.keyboard.press('Escape'); await back(page);
    assert.equal(await page.locator('.battlefield').evaluate(el => el.inert), false);
    assert.equal(await page.locator('.wave-track').evaluate(el => el.inert), false, 'offline receipt must not leave the nested navigation inert');
    await open(page); await back(page);
  });
  await scenario('Telegram safe areas and deactivate/reactivate keep dungeon state', 390, 760, fixture(), async page => {
    await page.locator('#start-wave').click(); await open(page); await fits(page);
    const heading = await page.locator('.dungeon-heading').boundingBox();
    const footer = await page.locator('.dungeon-footer').boundingBox();
    assert.ok(heading.y >= 68, 'navigation stays below Telegram native controls');
    assert.ok(footer.y + footer.height <= 760 - 34, 'footer respects bottom safe area');
    await page.locator('[data-dungeon-action="rules"]').click();
    const pausedAt = await page.evaluate(() => {
      window.Telegram.WebApp.isActive = false; window.telegramEvents.deactivated();
      return window.dungeonCheck.battle().elapsed;
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.dungeonCheck.battle().elapsed), pausedAt);
    await page.evaluate(() => { window.Telegram.WebApp.isActive = true; window.telegramEvents.activated(); });
    await page.waitForFunction(elapsed => window.dungeonCheck.battle().elapsed > elapsed + .2, pausedAt);
    assert.equal(await page.locator('#dungeon-rules').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.dungeon-level-card').count(), 3);
    await back(page);
  }, true);
  console.log(JSON.stringify({ checks, screenshots: fileURLToPath(output) }));
} finally { await browser?.close(); await server.close(); }
