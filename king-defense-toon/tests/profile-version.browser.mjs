import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(new URL('../../public/king-defense-toon/index.html', import.meta.url), 'utf8');
const stamp = html.match(/<span>(Version [^<]+)<\/span><time datetime="([^"]+)">([^<]+)<\/time>/);
assert.ok(stamp, 'the production build must contain an embedded version and timestamp');
assert.match(stamp[1], /^Version \d{6}-\d{6}$/);
assert.ok(Number.isFinite(Date.parse(stamp[2])));
const output = new URL('../../.tmp/profile-version/', import.meta.url);
const server = await preview({ root, configFile: `${root}/vite.config.mjs`,
  preview: { host: '127.0.0.1', port: 0, strictPort: false } });
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://telegram.org/js/telegram-web-app.js*', route => route.fulfill({
    status: 200, contentType: 'application/javascript', body: '',
  }));
  for (const [width, height] of [[320, 568], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(server.resolvedUrls.local[0]);
    await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
    await page.locator('#open-profile').click();
    const footer = page.locator('#profile-version');
    assert.equal(await footer.locator('span').textContent(), stamp[1]);
    assert.equal(await footer.locator('time').getAttribute('datetime'), stamp[2]);
    assert.equal(await footer.locator('time').textContent(), stamp[3]);
    const bounds = await footer.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + 1, 'version fits on a small phone');
    assert.ok(bounds.height <= 42, 'version remains a compact footer');
    const overflow = await page.locator('#profile-panel .settings-card').evaluate(card => card.scrollWidth > card.clientWidth + 1);
    assert.equal(overflow, false, 'profile has no horizontal overflow');
    await page.screenshot({ path: fileURLToPath(new URL(`profile-${width}.png`, output)) });
    await page.reload();
    await page.locator('#recovery-panel').waitFor({ state: 'hidden' });
    await page.locator('#open-profile').click();
    assert.equal(await footer.locator('span').textContent(), stamp[1], 'reload cannot invent a newer version');
    assert.equal(await footer.locator('time').getAttribute('datetime'), stamp[2]);
  }
  assert.deepEqual(errors, []);
  console.log(`Passed profile version: ${stamp[1]}, embedded timestamp, 320/390px layouts and stable reload.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
