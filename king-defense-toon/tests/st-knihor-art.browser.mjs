// Tests only the independent asset preview; no combat scene or player save is loaded.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/st-knihor-art/', import.meta.url);
const server = await createServer({
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/st-knihor-art/', import.meta.url)), root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  server: { host: '127.0.0.1', port: 5211, strictPort: true } });
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.addInitScript(() => {
    window.__draws = [];
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      const transform = this.getTransform();
      const ratio = this.canvas.width / this.canvas.clientWidth;
      window.__draws.push({ canvas: this.canvas.id, source: image.src, args, mirrored: transform.a < 0,
        anchorX: transform.e / ratio, anchorY: transform.f / ratio });
      if (window.__draws.length > 1000) window.__draws.splice(0, 500);
      return drawImage.call(this, image, ...args);
    };
  });
  await page.goto('http://127.0.0.1:5211/hero-preview/');
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  assert.ok(await page.locator('#portrait').evaluate(image => image.complete && image.naturalWidth === 128));
  const initialStorage = await page.evaluate(() => JSON.stringify({ ...localStorage }));

  for (const [row, action] of ['idle', 'walk', 'attack', 'cast', 'hit', 'death'].entries()) {
    await page.locator(`button[data-action="${action}"]`).click();
    assert.equal(await page.locator('#actual').getAttribute('data-frame'), String(row * 4));
    for (const [direction, atlas, mirrored] of [
      ['down', 'down', false], ['right', 'side', false], ['left', 'side', true], ['up', 'up', false],
    ]) {
      await page.locator(`button[data-direction="${direction}"]`).click();
      const draw = await page.evaluate(() => window.__draws.findLast(item => item.canvas === 'actual' && !item.source.includes('effects')));
      assert.ok(draw.source.endsWith(`st-knihor-${atlas}.webp`));
      assert.equal(draw.mirrored, mirrored);
      assert.deepEqual(draw.args.slice(0, 4), [0, row * 128, 128, 128]);
    }
  }

  for (const speed of [1, 2, 3]) {
    await page.locator(`[data-speed="${speed}"]`).click();
    assert.equal(await page.locator(`[data-speed="${speed}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.locator('button[data-direction="down"]').click();
  await page.locator('[data-speed="1"]').click();
  await page.locator('button[data-action="walk"]').click();
  await page.locator('#pause').click();
  await page.waitForFunction(() => document.querySelector('#actual').dataset.frame !== '4');
  await page.locator('#pause').click();
  const pausedFrame = await page.locator('#actual').getAttribute('data-frame');
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#actual').getAttribute('data-frame'), pausedFrame, 'pause holds the displayed pose');

  for (const [ability, row] of [['heal', 0], ['armor', 1], ['hammer', 2]]) {
    await page.locator(`[data-ability="${ability}"]`).click();
    await page.evaluate(() => { window.__draws = []; });
    await page.locator('#pause').click();
    await page.waitForFunction(expectedRow => window.__draws.some(draw => draw.canvas === 'actual'
      && draw.source.includes('effects') && draw.args[1] === expectedRow * 128), row);
    if (ability === 'hammer') await page.waitForFunction(() => window.__draws.some(draw => draw.canvas === 'actual'
      && draw.source.includes('effects') && draw.args[1] === 3 * 128));
    await page.waitForFunction(expectedRow => window.__draws.some(draw => draw.canvas === 'actual'
      && draw.source.includes('effects') && draw.args[1] === expectedRow * 128 && draw.args[0] >= 256), ability === 'hammer' ? 3 : row);
    await page.locator('#pause').click();
    assert.equal(await page.locator('#actual').getAttribute('data-action'), 'cast');
    const draws = await page.evaluate(() => window.__draws.filter(draw => draw.canvas === 'actual'));
    const actor = draws.findLast(draw => !draw.source.includes('effects'));
    const effects = draws.filter(draw => draw.source.includes('effects'));
    if (ability === 'armor') {
      const aura = effects[0];
      assert.ok(Math.abs(aura.args[5] + aura.args[7] / 2 - actor.anchorY) < .01, 'aura is anchored at the feet');
    }
    if (ability === 'hammer') {
      const impact = effects.find(draw => draw.args[1] === 3 * 128);
      assert.ok(impact.args[4] + impact.args[6] / 2 - actor.anchorX > 20, 'hammer impact lands at a separate target');
      const flight = effects.filter(draw => draw.args[1] === 2 * 128);
      assert.ok(flight.at(-1).args[4] > flight[0].args[4], 'hammer travels from the hero toward the target');
    }
    await page.screenshot({ path: fileURLToPath(new URL(`ability-${ability}.png`, output)), fullPage: true });
  }
  await page.locator('#effects').uncheck();
  await page.evaluate(() => { window.__draws = []; });
  await page.locator('#restart').click();
  assert.equal(await page.evaluate(() => window.__draws.filter(draw => draw.source.includes('effects')).length), 0);
  await page.locator('#effects').check();

  for (const width of [320, 390, 900]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow at ${width}px`);
    assert.ok(await page.locator('#actual').evaluate(canvas => {
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      let visiblePixels = 0;
      for (let index = 3; index < data.length; index += 4) if (data[index] > 200) visiblePixels++;
      return visiblePixels > 100;
    }), 'hero paints opaque pixels');
    if (width !== 390) await page.screenshot({ path: fileURLToPath(new URL(`layout-${width}.png`, output)), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.locator('button[data-action="idle"]').click();
  await page.screenshot({ path: fileURLToPath(new URL('mobile-dark.png', output)), fullPage: true });
  await page.locator('#theme').click();
  assert.equal(await page.locator('body').getAttribute('data-theme'), 'light');
  await page.screenshot({ path: fileURLToPath(new URL('mobile-light.png', output)), fullPage: true });
  assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage })), initialStorage);
  assert.ok(!requests.some(path => /\/(?:scene|combat|save|main)\.(?:mjs|ts)$/.test(path) && !path.includes('hero-preview/')),
    'asset preview does not import the game');
  assert.deepEqual(errors, []);
  console.log(`Passed St. Knihor preview: 24 action/direction combinations, playback, all effects, 320/390/900px layouts, themes, save isolation. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
