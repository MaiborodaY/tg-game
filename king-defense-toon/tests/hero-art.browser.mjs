// Local visual/UI regression only: no battle instrumentation or production URL.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/hero-talent-art/', import.meta.url);
const server = await createServer({ configFile: false, root: fileURLToPath(new URL('../', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/hero-talent-art/', import.meta.url)),
  server: { host: '127.0.0.1', port: 5217, strictPort: true } });
let browser;
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const level of [1, 8]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage(), errors = [], requestedImages = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('request', request => { if (request.resourceType() === 'image') requestedImages.add(request.url()); });
    await page.route('https://telegram.org/js/telegram-web-app.js*', route => route.fulfill({
      status: 200, contentType: 'application/javascript', body: '',
    }));
    await page.addInitScript(level => {
      localStorage.setItem('brotd-infinity:campaign:v2', JSON.stringify({ campaignVersion: 3,
        gold: 125, starterSupplyGranted: true, marketHintCompleted: true, clearedWaves: 0,
        autoWaves: false, autoWavesDefaultVersion: 1,
        hero: { talentVersion: 2, xp: 50 * (level - 1) ** 2, highestWave: 0,
          talents: level === 8 ? { heal_unlock: 1, heal_power: 2, aura_unlock: 1 } : {} },
        units: [{ id: 1, type: 'swordsman', col: 2, row: 0, level: 1 }], reserve: [],
        economy: { slaves: 0, treasuryUpdatedAt: Date.now() },
      }));
    }, level);
    await page.goto('http://127.0.0.1:5217/');
    await page.waitForFunction(() => !document.querySelector('#start-wave').disabled);
    await page.locator('#open-hero').click();
    const savedHero = () => page.evaluate(() => JSON.parse(localStorage.getItem('brotd-infinity:campaign:v2')).hero);
    const before = await savedHero();
    const cells = await page.evaluate(async () => (await import('/talent-art.ts')).HERO_TALENT_ART_CELLS);
    const artworks = await page.locator('[data-hero-talent] .hero-talent-art').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      return { id: element.closest('[data-hero-talent]').dataset.heroTalent, image: style.backgroundImage,
        size: style.backgroundSize, position: style.backgroundPosition };
    }));
    assert.equal(artworks.length, 18);
    assert.equal(new Set(artworks.map(art => art.image)).size, 1, 'all talents reuse one atlas');
    assert.equal(new Set(artworks.map(art => art.position)).size, 18, 'each talent has a distinct crop');
    const atlasUrl = artworks[0].image.match(/^url\("?([^"\)]+)"?\)$/)?.[1];
    assert.ok(atlasUrl, 'talents use an image background');
    assert.ok(requestedImages.has(atlasUrl), 'the browser requested the illustrated atlas');
    const imageSize = await page.evaluate(async src => {
      const image = new Image(); image.src = src; await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, atlasUrl);
    assert.ok(imageSize[0] > 0 && imageSize[0] / 6 === imageSize[1] / 3, 'the 6 by 3 atlas has square cells');

    for (const art of artworks) {
      const [column, row] = cells[art.id];
      assert.equal(art.size, '600% 300%');
      assert.equal(art.position, `${column * 20}% ${row * 50}%`);
      await page.locator(`[data-hero-talent="${art.id}"]`).click();
      const detail = await page.locator('[data-hero-detail-art]').evaluate(element => {
        const style = getComputedStyle(element);
        return { image: style.backgroundImage, size: style.backgroundSize, position: style.backgroundPosition };
      });
      assert.deepEqual(detail, { image: art.image, size: art.size, position: art.position }, `${art.id} detail matches its node`);
      assert.deepEqual(await savedHero(), before, 'browsing illustrations does not allocate or reset talents');
    }

    if (level === 1) {
      assert.equal(await page.locator('[data-hero-talent].is-locked').count(), 18);
      assert.equal(await page.locator('[data-hero-spend]').isDisabled(), true);
    } else {
      const appearances = [];
      for (const [id, state] of [['heal_unlock', 'learned'], ['heal_haste', 'available'], ['miracle', 'locked']]) {
        const node = page.locator(`[data-hero-talent="${id}"]`);
        assert.ok((await node.getAttribute('class')).includes(`is-${state}`));
        appearances.push(await node.locator('.hero-node-icon').evaluate(element => {
          const style = getComputedStyle(element);
          return JSON.stringify([style.borderColor, style.boxShadow, style.filter, style.opacity]);
        }));
      }
      assert.equal(new Set(appearances).size, 3, 'learned, available and locked artwork remain visually distinct');
      await page.locator('[data-hero-talent="hammer_unlock"]').click();
      assert.deepEqual(await savedHero(), before);
      await page.locator('[data-hero-spend]').click();
      const learned = await savedHero();
      assert.equal(learned.talents.hammer_unlock, 1);
      assert.deepEqual(learned, { ...before, talents: { ...before.talents, hammer_unlock: 1 } }, 'only Learn changes one allocation');
    }

    const animations = await page.locator('.hero-card').evaluate(card => [card, ...card.querySelectorAll('*')].flatMap(element =>
      [null, '::before', '::after'].flatMap(pseudo => {
        const style = getComputedStyle(element, pseudo);
        return style.animationName !== 'none' && style.animationIterationCount.split(',').some(count => count.trim() === 'infinite')
          ? [`${element.className}${pseudo ?? ''}: ${style.animationName}`] : [];
      })));
    assert.deepEqual(animations, [], 'talent artwork does not introduce continuous CSS animation');

    for (const [width, height] of [[390, 844], [320, 640], [320, 480]]) {
      await page.setViewportSize({ width, height });
      // A long final-talent description exercises the most constrained detail panel.
      await page.locator('[data-hero-talent="miracle"]').click();
      const layout = await page.locator('.hero-card').evaluate(card => {
        const bounds = selector => {
          const element = selector ? card.querySelector(selector) : card, rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const tree = card.querySelector('.hero-tree');
        return { card: bounds(), tree: bounds('.hero-tree'), detail: bounds('.hero-detail'), footer: bounds('.hero-footer'),
          art: bounds('[data-hero-detail-art]'), title: bounds('[data-hero-detail-name]'),
          description: bounds('[data-hero-detail-description]'), effect: bounds('[data-hero-detail-effect]'),
          action: bounds('.hero-detail-action'), spend: bounds('[data-hero-spend]'),
          cardScroll: card.scrollHeight - card.clientHeight, treeScroll: tree.scrollHeight - tree.clientHeight,
          overflow: document.documentElement.scrollWidth - innerWidth,
          nodes: [...card.querySelectorAll('[data-hero-talent]')].map(element => {
            const rect = element.getBoundingClientRect();
            return { id: element.dataset.heroTalent, left: rect.left, right: rect.right, top: rect.top,
              bottom: rect.bottom, width: rect.width, height: rect.height };
          }) };
      });
      const label = `Lv.${level}, ${width}x${height}`;
      assert.ok(layout.card.left >= 0 && layout.card.right <= width + 1 && layout.card.top >= 0
        && layout.card.bottom <= height + 1, `dialog fits ${label}`);
      assert.ok(layout.overflow <= 0, `no horizontal overflow at ${label}`);
      assert.ok(layout.tree.bottom <= layout.detail.top + 1 && layout.detail.bottom <= layout.footer.top + 1,
        `tree, details and footer do not overlap at ${label}`);
      assert.ok(layout.art.right <= layout.title.left + 1 || layout.art.bottom <= layout.title.top + 1,
        `selected artwork leaves the title readable at ${label}`);
      assert.ok(layout.description.bottom <= layout.effect.top + 1 && layout.effect.bottom <= layout.action.top + 1,
        `effect and learning action stay clear of description at ${label}`);
      assert.ok(layout.spend.bottom <= height && layout.spend.top >= 0, `Learn remains visible at ${label}`);
      assert.ok(layout.nodes.every(node => node.width >= 44 && node.height >= 44), `44px talent targets at ${label}`);
      for (let i = 0; i < layout.nodes.length; i++) for (let j = i + 1; j < layout.nodes.length; j++) {
        const a = layout.nodes[i], b = layout.nodes[j];
        assert.ok(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1,
          `talent targets ${a.id}/${b.id} do not overlap at ${label}`);
      }
      assert.ok(layout.cardScroll <= 1, `the dialog itself needs no scrolling at ${label}`);
      if (height === 480) assert.ok(layout.treeScroll > 0, 'only the talent tree scrolls on short screens');
      else assert.ok(layout.treeScroll <= 1, `the complete tree fits without scrolling at ${label}`);
      await page.screenshot({ path: fileURLToPath(new URL(`level-${level}-${width}x${height}.png`, output)) });
    }
    if (level === 8) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-hero-talent="heal_power"]').click();
      assert.equal(await page.locator('[data-hero-spend]').isEnabled(), true);
      await page.screenshot({ path: fileURLToPath(new URL('level-8-ready-to-learn-390x844.png', output)) });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`Passed illustrated hero talents: one decoded atlas, 18 distinct node/detail crops, allocation isolation, static states, 44px targets and mobile layouts. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server.close();
}
