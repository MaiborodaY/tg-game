import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/notifications/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'notification-layout-check', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('/main.ts')) return;
    return prependFunctionBody(code, 'resumeFrames', 'return;') + `\nwindow.noticeCheck = {
      ready: () => !!scene && !!armyScene && !isRecovering(),
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      tell, finish: () => finishRecruitReveal(),
    };`;
  } }],
});
const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x
  && a.y < b.y + b.height && a.y + a.height > b.y;
let browser;
try {
  await mkdir(output, { recursive: true });
  const baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const [width, height] of [[320, 568], [390, 700], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    try {
      await context.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await context.addInitScript(() => {
        const now = 1800000000000; Date.now = () => now; Math.random = () => 0;
        localStorage.setItem('brotd-infinity:campaign:v2', JSON.stringify({ campaignVersion: 3,
          gold: 125, starterSupplyGranted: true, onboardingCompleted: true,
          recruitment: { version: 2, received: { swordsman: 14 } },
          units: [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }], reserve: [],
          economy: { slaves: 3, treasuryUpdatedAt: now } }));
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(baseUrl);
      await page.waitForFunction(() => window.noticeCheck?.ready());
      await page.evaluate(async () => { window.noticeCheck.freeze(); await document.fonts.ready; });
      await page.locator('#transform-slave').tap();
      const reveal = page.locator('#market-recruit-reveal');
      await reveal.waitFor({ state: 'visible' });
      assert.equal(await page.locator('#market-recruit-level').innerText(), 'Lv.3');
      await reveal.evaluate(element => { for (const animation of element.getAnimations()) { animation.pause(); animation.currentTime = 700; } });
      const hero = await page.locator('#open-hero').boundingBox();
      assert.equal(overlap(await reveal.boundingBox(), hero), false, 'Recruit stays in the left Market lane');
      await page.screenshot({ path: fileURLToPath(new URL(`recruit-notice-${width}x${height}.png`, output)) });
      await page.waitForFunction(() => document.querySelector('#market-recruit-reveal').hidden);
      assert.equal(await page.locator('#toast').innerText(), '', 'No duplicate recruit toast after the reveal');
      for (const message of ['Unit deployed.', 'Both units need free tiles.', 'Free the tile on the right.', 'Pick 2 tiles side by side.']) {
        await page.evaluate(message => window.noticeCheck.tell(message), message);
        const toast = page.locator('#toast'), rect = await toast.boundingBox();
        const battlefield = await page.locator('.battlefield').boundingBox();
        assert.ok(rect.y >= battlefield.y && rect.y + rect.height <= battlefield.y + battlefield.height);
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width);
        for (const selector of ['#open-hero', '#army-map', '#open-market-info', '#start-wave', '#fps-counter']) {
          const button = await page.locator(selector).boundingBox();
          if (button) assert.equal(overlap(rect, button), false, `Message must not cover ${selector}`);
        }
        assert.equal(await toast.evaluate(element => element.scrollHeight > element.clientHeight), false, 'Full message is readable');
        assert.equal(await toast.evaluate(element => getComputedStyle(element).pointerEvents), 'none');
      }
      await page.screenshot({ path: fileURLToPath(new URL(`water-notice-${width}x${height}.png`, output)) });
      assert.deepEqual(errors, []);
      console.log(`PASS notification layout ${width}x${height}`);
    } finally { await context.close(); }
  }
} finally { await browser?.close(); await server.close(); }
