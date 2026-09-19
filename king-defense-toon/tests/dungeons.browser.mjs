import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { createCampaignState, campaignSnapshot } from '../campaign-state.ts';
import { GOBLIN_CAVE_LEVELS } from '../dungeons.ts';

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
      countdown: () => autoNextRemaining,
      run: () => dungeonRun && ({ level: dungeonRun.level.id, stage: dungeonRun.stage, reward: dungeonRun.reward, battle: dungeonRun.battle && {
        elapsed: dungeonRun.battle.elapsed, wave: dungeonRun.battle.waveNumber, phase: dungeonRun.battle.phase, total: dungeonRun.battle.total } }),
      advanceDungeon: seconds => {
        for (let tick = 0; tick < seconds * 60; tick++) updateBattle(dungeonRun.battle, 1/60);
        refresh();
        return dungeonRun.battle.enemies.map(enemy => enemy.type);
      },
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
async function scenario(name, width, height, saved, check, telegram = false, reducedMotion = 'reduce') {
  if (process.env.DUNGEON_SCENARIO && !name.includes(process.env.DUNGEON_SCENARIO)) return;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion });
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
      window.dungeonAudioSources = [];
      const mediaSource = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
      Object.defineProperty(HTMLMediaElement.prototype, 'src', { ...mediaSource, set(value) {
        if (this.tagName === 'AUDIO') window.dungeonAudioSources.push(value);
        mediaSource.set.call(this, value);
      } });
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
    assert.equal(requests.some(url => url.includes('goblin-cave-intro.mp4')), false, 'reduced motion does not download the optional video');
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
  for (const level of GOBLIN_CAVE_LEVELS.slice(0, 2)) {
  const { gold, slaves } = level.completionReward;
  for (const [width, height] of [[320, 568], [390, 844]]) {
    await scenario(`Cave ${level.numeral} run rewards, repeat entry and defeat ${width}x${height}`, width, height, fixture(level.unlockRound * 10), async (page, requests) => {
      await open(page);
      const card = page.locator('.dungeon-level-card').nth(level.tier - 1);
      assert.equal(await card.locator('.dungeon-card-reward-label').textContent(), 'First-clear reward');
      await page.locator(`[data-dungeon-level="${level.id}"]`).click();
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
          if (level.tier === 2 && run === 1 && wave === 3) {
            assert.deepEqual(await page.evaluate(() => window.dungeonCheck.advanceDungeon(1)), ['goblinBombardier']);
            await page.screenshot({ path: fileURLToPath(new URL(`bombardier-${width}.png`, output)) });
          }
          await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
        }
        await page.locator('[data-run-result]').waitFor({ state: 'visible' });
        assert.equal(await page.locator('[data-result-title]').textContent(), 'Cave conquered!');
        assert.ok((await page.locator('[data-result-description]').textContent()).includes(level.boss));
        assert.equal(await page.locator('[data-result-gold]').textContent(), `+${run === 1 ? gold : Math.floor(gold / 3)}`);
        assert.equal(await page.locator('[data-result-slaves]').textContent(), `+${run === 1 ? slaves : Math.floor(slaves / 3)}`);
        assert.equal(await page.locator(`.dungeon-result-art.dungeon-art-${level.tier}`).count(), 1);
        if (level.tier === 2) for (const asset of ['body', 'bomb', 'explosion']) {
          assert.equal(requests.filter(url => url.includes(`/goblin-bombardier/${asset}.webp`)).length, 1,
            `${asset} loads once and is reused across runs`);
        }
        assert.equal(await start.isVisible(), false);
        await page.evaluate(() => window.dungeonCheck.finishDungeonWave());
        const after = await page.evaluate(() => window.dungeonCheck.state());
        assert.equal(after.gold, before.gold + gold + (run - 1) * Math.floor(gold / 3));
        assert.equal(after.economy.slaves, before.economy.slaves + slaves + (run - 1) * Math.floor(slaves / 3));
        assert.deepEqual(after.units, before.units);
        assert.deepEqual(after.hero, before.hero);
        assert.deepEqual(after.progression, before.progression);
        assert.equal(after.clearedWaves, before.clearedWaves);
        const panel = await page.locator('[data-run-result]').boundingBox();
        const buttons = await page.locator('.dungeon-result-actions').boundingBox();
        assert.ok(panel.x >= 0 && panel.x + panel.width <= width);
        assert.ok(buttons.y >= panel.y && buttons.y + buttons.height <= panel.y + panel.height, 'actions fit without scrolling');
        if (run === 1) await page.screenshot({ path: fileURLToPath(new URL(`victory-${level.tier}-${width}.png`, output)) });
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
      assert.equal(restored.gold, before.gold + gold + Math.floor(gold / 3));
      assert.equal(restored.economy.slaves, before.economy.slaves + slaves + Math.floor(slaves / 3));
      assert.equal(await page.evaluate(() => window.dungeonCheck.run()), null);
      assert.deepEqual(restored.dungeonClears, [level.id]);
      await open(page);
      const repeatCard = page.locator('.dungeon-level-card').nth(level.tier - 1);
      assert.match(await repeatCard.locator('.dungeon-card-reward-label').innerText(), /Repeat clear/);
      assert.ok((await repeatCard.innerText()).includes(`${Math.floor(gold / 3)} gold`));
      assert.ok((await repeatCard.innerText()).includes(`${Math.floor(slaves / 3)} slaves`));
    });
  }
  await scenario(`Cave ${level.numeral} boss rewards survive failed storage writes without duplicate grants`, 390, 844, fixture(level.unlockRound * 10), async page => {
    await open(page);
    await page.locator(`[data-dungeon-level="${level.id}"]`).click();
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
    assert.equal(paid.gold, before.gold + gold);
    assert.equal(paid.economy.slaves, before.economy.slaves + slaves);
    await page.reload(); await page.waitForFunction(() => window.dungeonCheck?.ready());
    const restored = await page.evaluate(() => window.dungeonCheck.state());
    assert.deepEqual(restored.dungeonClears, [level.id]);
    assert.equal(restored.gold, paid.gold);
    assert.equal(restored.economy.slaves, paid.economy.slaves);
  });
  }
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
  await scenario('intro video: shared pause gates, retained battle, silent canvases and continuous cave music', 390, 760, fixture(), async (page, requests) => {
    assert.equal(requests.some(url => url.includes('goblin-cave-intro.mp4')), false, 'game startup leaves video unloaded');
    await page.locator('#start-wave').click(); await open(page);
    await page.waitForFunction(() => document.querySelector('#dungeon-intro-screen video').readyState >= 2);
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true, 'catalogue warmup cannot start hidden playback');
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-intro'
      && document.querySelector('#dungeon-intro-screen video').currentTime > .25);
    const initial = await page.evaluate(() => ({ battle: window.dungeonCheck.battle(), draws: { ...window.dungeonDraws },
      audioSources: window.dungeonAudioSources.filter(source => source.includes('goblin-cave-action')).length }));
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.muted && video.playsInline), true);
    assert.equal(await page.locator('.battlefield').evaluate(element => element.inert), true);
    assert.equal(await page.locator('#dungeon-intro-screen').innerText(), 'Skip', 'the film carries no title or captions');
    await page.evaluate(() => { window.dispatchEvent(new Event('resize')); window.Telegram.WebApp.isActive = false; window.telegramEvents.deactivated(); });
    const frozenVideoTime = await page.locator('#dungeon-intro-screen video').evaluate(video => video.currentTime);
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeon-intro');
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true);
    assert.ok(Math.abs(await page.locator('#dungeon-intro-screen video').evaluate(video => video.currentTime) - frozenVideoTime) < .08);
    assert.deepEqual(await page.evaluate(() => window.dungeonCheck.battle()), initial.battle);
    assert.deepEqual(await page.evaluate(() => window.dungeonDraws), initial.draws, 'resize and lifecycle callbacks cannot draw the covered scenes');
    await page.evaluate(() => { window.Telegram.WebApp.isActive = true; window.telegramEvents.activated(); });
    await page.evaluate(() => window.dungeonCheck.absence());
    await page.locator('#offline-rewards-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true, 'offline receipt suspends the video');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeon-intro');
    await page.locator('#collect-offline-rewards').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
    await page.waitForFunction(() => window.dungeonCheck.ready());
    assert.deepEqual(await page.evaluate(() => window.dungeonCheck.battle()), initial.battle, 'campaign combat stayed frozen throughout entry');
    assert.equal((await page.evaluate(() => window.dungeonCheck.run())).battle, null, 'intro never starts dungeon combat');
    assert.equal(await page.evaluate(() => window.dungeonAudioSources.filter(source => source.includes('goblin-cave-action')).length), initial.audioSources);
    assert.equal(initial.audioSources, 1, 'cave music begins at entry and its source is not replaced when the film ends');
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true);
    assert.equal(await page.locator('.battlefield').evaluate(element => element.inert), false);
  }, true, 'no-preference');
  await scenario('intro video: Skip preserves the pending auto-wave and reuses its media element', 320, 740, fixture(50, true), async page => {
    await page.locator('#start-wave').click(); await open(page);
    await page.waitForFunction(() => document.querySelector('#dungeon-intro-screen video').readyState >= 2);
    await page.evaluate(() => window.dungeonCheck.finishWave());
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    const countdown = await page.evaluate(() => window.dungeonCheck.countdown());
    assert.ok(countdown > 0);
    await page.waitForTimeout(200);
    await page.locator('.dungeon-intro-skip').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
    assert.equal(await page.evaluate(() => window.dungeonCheck.countdown()), countdown);
    await page.waitForFunction(() => window.dungeonCheck.ready());
    await page.locator('[data-run-exit]').click();
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.locator('.dungeon-intro-skip').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
    assert.equal(await page.locator('#dungeon-intro-screen video').count(), 1);
  }, false, 'no-preference');
  await scenario('intro video: optional media failure still enters a playable cave', 390, 844, fixture(), async page => {
    await page.route('**/goblin-cave-intro.mp4*', route => route.abort('failed'));
    await open(page);
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
    await page.waitForFunction(() => window.dungeonCheck.ready());
    await page.locator('[data-run-start]').click();
    await page.waitForFunction(() => window.dungeonCheck.run().battle?.phase === 'running');
    assert.equal(await page.locator('#recovery-panel').isVisible(), false);
  }, false, 'no-preference');
  await scenario('intro video: a hanging request cannot turn the clip into a loading gate', 390, 844, fixture(), async page => {
    let pendingVideo;
    await page.route('**/goblin-cave-intro.mp4*', route => { pendingVideo = route; });
    try {
      await open(page);
      await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
      const enteredAt = await page.evaluate(() => performance.now());
      assert.equal(await page.locator('#app').getAttribute('data-screen'), 'dungeon-intro');
      assert.equal(await page.locator('#recovery-panel').isVisible(), false);
      await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
      assert.ok(await page.evaluate(() => performance.now()) - enteredAt < 1800, 'failed startup leaves entry after its one-second deadline');
      assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true);
      await page.waitForFunction(() => window.dungeonCheck.ready());
      await page.locator('[data-run-start]').click();
      await page.waitForFunction(() => window.dungeonCheck.run().battle?.phase === 'running');
    } finally { await pendingVideo?.abort('failed'); }
  }, false, 'no-preference');
  await scenario('intro video: save recovery suspends the movie and restores its input ownership', 390, 844, fixture(), async page => {
    await open(page);
    await page.waitForFunction(() => document.querySelector('#dungeon-intro-screen video').readyState >= 2);
    await page.locator('[data-dungeon-level="goblin-cave-1"]').click();
    await page.waitForFunction(() => document.querySelector('#dungeon-intro-screen video').currentTime > .2);
    await page.evaluate(() => {
      window.originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new DOMException('Fixture quota', 'QuotaExceededError'); };
      window.dungeonCheck.save();
    });
    await page.locator('#recovery-panel').waitFor({ state: 'visible' });
    const frozenTime = await page.locator('#dungeon-intro-screen video').evaluate(video => video.currentTime);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#dungeon-intro-screen video').evaluate(video => video.paused), true);
    assert.ok(Math.abs(await page.locator('#dungeon-intro-screen video').evaluate(video => video.currentTime) - frozenTime) < .08);
    assert.equal(await page.locator('#dungeon-intro-screen').evaluate(element => element.inert), true);
    await page.evaluate(() => window.dungeonCheck.restoreStorage());
    await page.locator('#recovery-retry').click();
    await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#dungeon-intro-screen').evaluate(element => element.inert), false);
    await page.locator('.dungeon-intro-skip').click();
    await page.waitForFunction(() => document.querySelector('#app').dataset.screen === 'dungeon-battle');
    await page.waitForFunction(() => window.dungeonCheck.ready());
    assert.equal(await page.locator('.battlefield').evaluate(element => element.inert), false);
  }, false, 'no-preference');
  console.log(JSON.stringify({ checks, screenshots: fileURLToPath(output) }));
} finally { await browser?.close(); await server.close(); }
