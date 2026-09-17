import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
  cacheDir: fileURLToPath(new URL('../../.tmp/asset-loading-vite/', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__asset-check', route => route.fulfill({ contentType: 'text/html',
    body: '<style>canvas{width:350px;height:300px}</style><canvas id="battle"></canvas><canvas id="army"></canvas>' }));
  let blockGraveyard = true;
  await page.route('**/forgotten-graveyard.webp', route => blockGraveyard ? route.abort('failed') : route.continue());
  await page.goto(new URL('__asset-check', server.resolvedUrls.local[0]).href);
  const initial = await page.evaluate(async () => {
    window.imageLoads = [];
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...descriptor, set(value) {
      if (value) window.imageLoads.push(new URL(value, location.href).pathname);
      descriptor.set.call(this, value);
    } });
    const { createScene } = await import('/scene.mjs');
    window.states = { battle: [], army: [] };
    [window.battleScene, window.armyScene] = await Promise.all([
      createScene(document.querySelector('#battle'), { onAssetState: state => states.battle.push(state.status) }),
      createScene(document.querySelector('#army'), { formationOnly: true, onAssetState: state => states.army.push(state.status) }),
    ]);
    return { loads: [...imageLoads], states };
  });
  assert.deepEqual(initial.states, { battle: ['loading', 'ready'], army: ['loading', 'ready'] });
  assert.equal(initial.loads.filter(url => url.endsWith('/ground.png')).length, 1, 'shared map constructed once');
  assert.equal(initial.loads.filter(url => url.endsWith('/king.webp')).length, 1);
  assert.ok(!initial.loads.some(url => /graveyard|skeleton|torch-|ranks/.test(url)), 'forest startup is independent of later assets');

  const armyLoad = await page.evaluate(async () => {
    const units = [{ id: 'one', type: 'swordsman', level: 26, col: 0, row: 0 }];
    battleScene.render({ units });
    const synchronous = battleScene.getAssetState().status;
    const ready = await Promise.all([battleScene.prepare({ units }), armyScene.prepare({ units })]);
    return { synchronous, ready, loads: [...imageLoads] };
  });
  assert.equal(armyLoad.synchronous, 'loading', 'render notifies synchronously before assets finish');
  assert.deepEqual(armyLoad.ready, [true, true]);
  assert.equal(armyLoad.loads.filter(url => url.endsWith('/swordsman-purple-sheet.png')).length, 1);
  assert.ok(!armyLoad.loads.some(url => /swordsman-(red|yellow)|warrior-blue/.test(url)), 'only the requested rank is loaded');

  const failed = await page.evaluate(async () => ({
    ready: await Promise.all([battleScene.prepare({ levelNumber: 2 }), armyScene.prepare({ levelNumber: 2 })]),
    statuses: [battleScene, armyScene].map(scene => scene.getAssetState().status),
    requests: imageLoads.filter(url => url.endsWith('/forgotten-graveyard.webp')).length,
  }));
  assert.deepEqual(failed.ready, [false, false]);
  assert.deepEqual(failed.statuses, ['error', 'error']);
  assert.equal(failed.requests, 2, 'both scenes share the same bounded retry sequence');
  blockGraveyard = false;
  const recovered = await page.evaluate(async () => ({
    ready: await Promise.all([battleScene.retryAssets(), armyScene.retryAssets()]),
    statuses: [battleScene, armyScene].map(scene => scene.getAssetState().status),
    requests: imageLoads.filter(url => url.endsWith('/forgotten-graveyard.webp')).length,
  }));
  assert.deepEqual(recovered.ready, [true, true]);
  assert.deepEqual(recovered.statuses, ['ready', 'ready']);
  assert.equal(recovered.requests, 3, 'failed request is not permanently cached');

  const switched = await page.evaluate(async () => {
    await Promise.all([battleScene.prepare({ levelNumber: 1 }), armyScene.prepare({ levelNumber: 1 })]);
    return imageLoads.filter(url => url.endsWith('/ground.png')).length;
  });
  assert.equal(switched, 2, 'the previous map was released after both scenes left its level');
  const destroyed = await page.evaluate(async () => {
    battleScene.destroy(); armyScene.destroy();
    const { createScene } = await import('/scene.mjs');
    window.replacement = await createScene(document.querySelector('#battle'));
    return imageLoads.filter(url => url.endsWith('/ground.png')).length;
  });
  assert.equal(destroyed, 3, 'destroying all scenes releases their shared resources');
  await page.evaluate(() => replacement.destroy());

  await page.route('**/ground.png', route => route.abort('failed'));
  // A fresh document also clears the browser's own decoded-image reuse for this failure case.
  await page.reload();
  const startupFailure = await page.evaluate(async () => {
    const { createScene } = await import('/scene.mjs');
    window.retryable = await createScene(document.querySelector('#battle'));
    return retryable.getAssetState().status;
  });
  assert.equal(startupFailure, 'error', 'initial asset failure returns a recoverable scene');
  await page.unroute('**/ground.png');
  assert.equal(await page.evaluate(() => retryable.retryAssets()), true);
  await page.evaluate(() => retryable.destroy());
  assert.deepEqual(errors, []);
  console.log('Passed browser asset loading checks: demand selection, two-scene sharing, map isolation, bounded retry, recovery and release.');
} finally {
  await browser?.close();
  await server.close();
}
