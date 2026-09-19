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
      run: () => dungeonRun && ({ level: dungeonRun.level.id, stage: dungeonRun.stage, reward: dungeonRun.reward, battle: dungeonRun.battle && {
        elapsed: dungeonRun.battle.elapsed, wave: dungeonRun.battle.waveNumber, phase: dungeonRun.battle.phase, total: dungeonRun.battle.total } }),
      finishDungeonWave: () => {
        dungeonRun.battle.phase = 'victory';
        dungeonRun.battle.kills = dungeonRun.battle.total;
        finishDungeonBattle();
      },
      loseDungeonWave: () => { dungeonRun.battle.phase = 'defeat'; finishDungeonBattle(); },
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
  if (process.env.DUNGEON_SCENARIO && !name.includes(process.env.DUNGEON_SCENARIO)) return;
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
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(baseUrl)) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.dungeonCheck?.ready());
    await page.evaluate(() => document.fonts.ready);
    await check(page, requests);
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
  await scenario('cave controls: stable single-tap Start, guarded exit and next wave', 390, 844, fixture(), async (page, requests) => {
    const caveImages = () => requests.filter(url => /\/goblin-cave-map\.webp(?:\?|$)/.test(url));
    assert.equal(caveImages().length, 0, 'entering the game does not fetch the cave map');
    await open(page);
    assert.equal(caveImages().length, 0, 'browsing covers does not fetch the battle map');
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => window.dungeonCheck.ready());
    assert.equal(caveImages().length, 1, 'both canvases share one on-demand image request');
    const start = page.locator('[data-run-start]');
    await page.waitForFunction(() => !document.querySelector('[data-run-start]').disabled);
    const bounds = await start.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 12);
    await page.mouse.down();
    const pressed = await start.boundingBox();
    assert.ok(Math.abs(pressed.y - bounds.y) <= 2, `Start moved ${pressed.y - bounds.y}px while pressed`);
    await page.mouse.up();
    await page.waitForFunction(() => window.dungeonCheck.run().battle?.phase === 'running');
    assert.equal(await page.locator('[data-run-exit]').isVisible(), false);
    await page.locator('[data-run-exit]').evaluate(button => button.click());
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeon-battle');
    await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
    await page.locator('[data-run-exit]').click();
    assert.equal(await page.locator('[data-run-confirm]').isVisible(), true);
    await page.locator('[data-run-stay]').click();
    assert.equal(await page.locator('[data-run-confirm]').isVisible(), false);
    await page.locator('[data-run-exit]').click();
    await page.evaluate(() => window.dungeonCheck.absence());
    assert.equal(await page.locator('[data-run-confirm]').isVisible(), false, 'confirmation yields to offline rewards');
    await page.locator('#collect-offline-rewards').click();
    await start.tap();
    await page.waitForFunction(() => window.dungeonCheck.run().battle?.wave === 2);
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).stage, 'preparation');
    await page.waitForTimeout(350);
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle.elapsed, 0, 'preparation never starts combat');
    assert.equal(await start.textContent(), 'Start wave 2');
    await start.tap();
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle.phase, 'running');
    await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
    await page.locator('[data-run-exit]').click();
    await page.locator('[data-run-leave]').click();
    assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null);
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => window.dungeonCheck.ready());
    await page.locator('[data-run-exit]').click();
    assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null, 'unstarted run exits without warning');
  });
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
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle.total, 8);
    assert.equal(await page.evaluate(() => window.dungeonCheck.battle().elapsed), pausedAt);
    assert.deepEqual(inventory(await page.evaluate(() => window.dungeonCheck.state())), inventory(before));
    await page.screenshot({ path: fileURLToPath(new URL('cave-battle.png', output)) });
    assert.equal(await page.locator('[data-run-exit]').isVisible(), false);
    await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
    await page.locator('[data-run-exit]').click();
    await page.locator('[data-run-leave]').click();
    assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null);
    await page.waitForFunction(elapsed => window.dungeonCheck.battle().elapsed > elapsed, pausedAt);
    await back(page);
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'campaign');
  });
  for (const [width, height] of [[320, 568], [390, 844]]) {
    await scenario(`run rewards, repeat entry and defeat ${width}x${height}`, width, height, fixture(), async page => {
      await open(page);
      await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
      await page.waitForFunction(() => window.dungeonCheck.ready());
      const before = await page.evaluate(() => window.dungeonCheck.state());
      const start = page.locator('[data-run-start]');
      for (let run = 1; run <= 2; run++) {
        for (let wave = 1; wave <= 3; wave++) {
          if (wave > 1) {
            assert.equal(await start.textContent(), 'Prepare');
            await start.tap();
            await page.waitForFunction(() => window.dungeonCheck.ready());
            assert.equal((await page.evaluate(() => window.dungeonCheck.run())).stage, 'preparation');
          }
          await start.tap();
          await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
        }
        await page.locator('[data-run-result]').waitFor({ state: 'visible' });
        assert.equal(await page.locator('[data-result-gold]').textContent(), '+150');
        assert.equal(await page.locator('[data-result-slaves]').textContent(), '+3');
        assert.equal(await start.isVisible(), false);
        await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
        const after = await page.evaluate(() => window.dungeonCheck.state());
        assert.equal(after.gold, before.gold + 150 * run);
        assert.equal(after.economy.slaves, before.economy.slaves + 3 * run);
        assert.deepEqual(after.units, before.units);
        assert.deepEqual(after.hero, before.hero);
        assert.deepEqual(after.progression, before.progression);
        assert.equal(after.clearedWaves, before.clearedWaves);
        const panel = await page.locator('[data-run-result]').boundingBox();
        const buttons = await page.locator('.dungeon-result-actions').boundingBox();
        assert.ok(panel.x >= 0 && panel.x + panel.width <= width);
        assert.ok(buttons.y >= panel.y && buttons.y + buttons.height <= panel.y + panel.height, 'actions fit without scrolling');
        if (run === 1) await page.screenshot({ path: fileURLToPath(new URL(`victory-${width}.png`, output)) });
        await page.locator('[data-run-retry]').tap();
        assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle, null);
      }
      await start.tap();
      await page.evaluate(() => window.dungeonCheck.loseDungeonWave());
      assert.equal(await page.locator('[data-result-title]').textContent(), 'Run ended');
      assert.equal(await page.locator('[data-result-rewards]').isVisible(), false);
      await page.locator('[data-result-exit]').click();
      assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeons');
      await page.reload();
      await page.waitForFunction(() => window.dungeonCheck?.ready());
      const restored = await page.evaluate(() => window.dungeonCheck.state());
      assert.equal(restored.gold, before.gold + 300);
      assert.equal(restored.economy.slaves, before.economy.slaves + 6);
      assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null);
    });
  }
  await scenario('boss rewards survive failed storage writes without duplicate grants', 390, 844, fixture(), async page => {
    await open(page);
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => window.dungeonCheck.ready());
    const before = await page.evaluate(() => window.dungeonCheck.state());
    for (let wave = 1; wave <= 3; wave++) {
      if (wave > 1) await page.locator('[data-run-start]').tap();
      await page.locator('[data-run-start]').tap();
      if (wave === 3) await page.evaluate(() => {
        window.originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new DOMException('Fixture quota', 'QuotaExceededError'); };
      });
      await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
    }
    await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-run-retry]').isDisabled(), true);
    assert.equal(await page.locator('[data-result-exit]').isDisabled(), true);
    await page.locator('[data-run-retry]').evaluate(button => button.click());
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).stage, 'complete');
    const storedBeforeRetry = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    assert.equal(storedBeforeRetry.gold, before.gold);
    await page.evaluate(() => window.dungeonCheck.restoreStorage());
    await page.locator('#recovery-retry').click();
    await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('[data-run-retry]').isDisabled(), false);
    const paid = await page.evaluate(() => window.dungeonCheck.state());
    assert.equal(paid.gold, before.gold + 150);
    assert.equal(paid.economy.slaves, before.economy.slaves + 3);
    await page.reload(); await page.waitForFunction(() => window.dungeonCheck?.ready());
    const restored = await page.evaluate(() => window.dungeonCheck.state());
    assert.equal(restored.gold, paid.gold);
    assert.equal(restored.economy.slaves, paid.economy.slaves);
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
