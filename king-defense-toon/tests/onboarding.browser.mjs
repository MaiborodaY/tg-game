// Disposable campaigns exercise actual taps and persistence, with combat time frozen.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const key = 'brotd-infinity:campaign:v2';
const now = 1800000000000;
const output = new URL('../../.tmp/', import.meta.url);
let baseUrl;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/onboarding/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'onboarding-browser-hooks', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    code = prependFunctionBody(code, 'resumeFrames', 'return;');
    return code + `\nwindow.onboardingCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      state: () => JSON.parse(JSON.stringify(saveSnapshot())),
      redraw: () => { fitPortraitPreview(); renderScene(); refreshOnboarding(); },
      victory: () => {
        battle.phase = 'victory'; battle.kills = battle.total;
        const rewards = applyBattleKillRewards(campaign, battle.campaignRewards,
          { kills: battle.kills, totalGold: battle.wave.reward }, () => .99);
        if (!rewards.ok) throw new Error(rewards.reason);
        showResult();
      },
    };`;
  } }],
});
let browser;
const guide = page => page.locator('.onboarding-guide');
async function ready(page) {
  await page.waitForFunction(() => window.onboardingCheck?.ready());
  await page.evaluate(async () => { window.onboardingCheck.freeze(); await document.fonts.ready; });
}
async function expectStep(page, step) {
  await page.waitForFunction(step => {
    const guide = document.querySelector('.onboarding-guide');
    return guide && !guide.hidden && guide.dataset.step === step;
  }, step);
  const bounds = await page.locator('.onboarding-bubble').boundingBox();
  const viewport = page.viewportSize();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1, 'Hint fits horizontally');
  assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1, 'Hint fits vertically');
}
async function tapGuidedTarget(page) {
  const box = await page.locator('.onboarding-ring').boundingBox();
  assert.ok(box?.width > 0);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  if (page.viewportSize().width < 600) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}
async function matchesElement(page, selector) {
  const a = await page.locator('.onboarding-ring').boundingBox();
  const b = await page.locator(selector).first().boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(a[key] - b[key]) < 2, `Guide matches ${selector}: ${key}`);
}
async function matchesCell(page, row) {
  const expected = await page.locator('#army-map').evaluate((canvas, { row, field, view }) => {
    const r = canvas.getBoundingClientRect(), s = Number(canvas.dataset.worldScale);
    return { x: r.x + Number(canvas.dataset.worldOffsetX) + (field.gridX + 2 * field.cellWidth) * s,
      y: r.y + (r.height - view.height * s) / 2 + (field.gridY + row * field.cellHeight - view.y) * s,
      width: field.cellWidth * s, height: field.cellHeight * s };
  }, { row, field: FIELD, view: FORMATION_VIEW });
  const actual = await page.locator('.onboarding-ring').boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(expected[key] - actual[key]) < 2, `Cell ${row} aligned: ${key}`);
}
async function screenshot(page, name) {
  await page.screenshot({ path: fileURLToPath(new URL(`onboarding-${name}.png`, output)) });
}
async function scenario(name, width, saved, fn) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : width === 900 ? 1000 : 844 },
    isMobile: width < 600, hasTouch: width < 600 });
  let page;
  const errors = [];
  try {
    await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.addInitScript(({ key, saved, now }) => {
      Date.now = () => now; Math.random = () => .1;
      if (!sessionStorage.getItem('__onboarding-seeded')) {
        if (saved) localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem('__onboarding-seeded', '1');
      }
    }, { key, saved, now });
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseUrl); await ready(page); await fn(page);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name} ${width}px`);
  } catch (error) {
    if (page) {
      console.log('FAIL STATE', await page.evaluate(() => ({ state: window.onboardingCheck?.state(), guide: document.querySelector('.onboarding-guide')?.outerHTML })));
      await screenshot(page, `${name}-FAILED-${width}`);
    }
    throw error;
  } finally { await context.close(); }
}

try {
  await mkdir(output, { recursive: true }); baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [390, 320, 900]) {
    await scenario('first-army', width, null, async page => {
      await expectStep(page, 'market'); await matchesElement(page, '#transform-slave');
      assert.equal(await page.locator('#start-wave').isDisabled(), true);
      await screenshot(page, `market-${width}`);
      for (let i = 0; i < 3; i++) {
        await expectStep(page, 'market'); await tapGuidedTarget(page);
        await page.waitForFunction(() => !document.querySelector('#transform-slave').classList.contains('is-transforming'));
        if (i === 0) { await page.reload(); await ready(page); }
      }
      await expectStep(page, 'place'); await matchesCell(page, 0);
      await screenshot(page, `place-${width}`);
      for (let row = 0; row < 3; row++) {
        await expectStep(page, 'place'); await matchesCell(page, row);
        await tapGuidedTarget(page); await expectStep(page, 'choose');
        await matchesElement(page, '[data-reserve-id]');
        if (row === 0) await screenshot(page, `choose-${width}`);
        await tapGuidedTarget(page);
        if (row === 0) { await page.reload(); await ready(page); }
      }
      await expectStep(page, 'start'); await matchesElement(page, '#start-wave');
      await screenshot(page, `start-${width}`);
      const field = await page.locator('#battle').boundingBox();
      const start = await page.locator('#start-wave').boundingBox();
      const auto = await page.locator('#auto-waves').boundingBox();
      assert.ok(start.y > field.y + field.height * .75, 'Start sits at bottom of battle');
      assert.ok(auto.y < field.y + field.height / 2, 'Auto sits in former Start position');
      assert.equal(await page.locator('#profile-panel #auto-waves').count(), 0);
      await page.locator('#auto-waves').click();
      assert.equal(await page.locator('#auto-waves').getAttribute('aria-pressed'), 'false');
      await tapGuidedTarget(page);
      assert.equal(await guide(page).isVisible(), false);
      await page.waitForFunction(() => document.querySelector('#battle').dataset.phase === 'running');
      const speed = await page.locator('#battle-speed').boundingBox();
      const fps = await page.locator('#fps-counter').boundingBox();
      assert.ok(auto.y + auto.height <= speed.y + 1 && speed.y + speed.height <= fps.y + 1, 'Auto, speed and FPS do not overlap');
      await page.evaluate(() => window.onboardingCheck.victory());
      assert.equal(await page.locator('#result-panel').isVisible(), true);
      await page.locator('#auto-waves').click();
      assert.equal(await page.locator('#result-panel').isVisible(), false, 'Battlefield Auto still switches the result into automatic mode');
      await page.reload(); await ready(page);
      assert.equal(await guide(page).isVisible(), false, 'First-wave guidance stays completed after reload');
      assert.equal(await page.locator('#auto-waves').getAttribute('aria-pressed'), 'true');
      await page.locator('#auto-waves').click(); await page.reload(); await ready(page);
      assert.equal(await page.locator('#auto-waves').getAttribute('aria-pressed'), 'false', 'Off choice survives reload');
      await page.locator('#open-profile').click();
      await page.locator('#reset').click(); await page.locator('#reset').click();
      await expectStep(page, 'market');
    });
  }
  const saved = { campaignVersion: 3, gold: 125, starterSupplyGranted: true, clearedWaves: 0,
    units: [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }], reserve: [],
    recruitment: { version: 2, received: { swordsman: 1 } }, economy: { slaves: 2, treasuryUpdatedAt: now } };
  await scenario('legacy-no-guide', 390, saved, async page => {
    assert.equal(await guide(page).isVisible(), false);
    await page.reload(); await ready(page);
    assert.equal(await guide(page).isVisible(), false);
  });
  await scenario('barracks-detour', 320, { ...saved, onboardingCompleted: false,
    units: [], reserve: [{ id: 1, type: 'swordsman', level: 1 }],
    offlineRewards: { gold: 4 },
    recruitment: { version: 2, received: { swordsman: 3 } }, economy: { slaves: 0, treasuryUpdatedAt: now } }, async page => {
    assert.equal(await page.locator('#offline-rewards-panel').isVisible(), true);
    assert.equal(await guide(page).isVisible(), false, 'The guide yields to offline rewards');
    await page.locator('#collect-offline-rewards').click();
    await expectStep(page, 'place');
    await page.locator('#open-profile').click(); await expectStep(page, 'close'); await tapGuidedTarget(page);
    await page.locator('#open-barracks').click(); await expectStep(page, 'choose'); await tapGuidedTarget(page);
    await expectStep(page, 'choose'); await matchesElement(page, '[data-barracks-recruit-id]'); await tapGuidedTarget(page);
    await expectStep(page, 'place'); await tapGuidedTarget(page); await expectStep(page, 'start');
  });
  console.log('PASS onboarding browser checks (5 scenarios)');
} finally { await browser?.close(); await server.close(); }
