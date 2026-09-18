import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { observedCombatModule } from './helpers/browser-instrumentation.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = new URL('../../.tmp/st-knihor-hero/', import.meta.url);
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:5213/';
const server = process.env.BASE_URL ? null : await createServer({
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/hero/', import.meta.url)),
  configFile: false, root: fileURLToPath(new URL('../', import.meta.url)),
  server: { host: '127.0.0.1', port: 5213, strictPort: true },
});
let browser;

try {
  await mkdir(output, { recursive: true });
  await server?.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const requests = new Set();
  page.on('request', request => requests.add(new URL(request.url()).pathname));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  // Exercise standalone browser mode without depending on Telegram's external CDN.
  await page.route('https://telegram.org/js/telegram-web-app.js*', route => route.fulfill({
    status: 200, contentType: 'application/javascript', body: '',
  }));

  // Observe real battle snapshots only in this isolated browser. Extra update steps finish
  // real waves quickly; the application still records their outcomes through its normal frame.
  // BASE_URL must point to a Vite development server. Import the untouched module
  // through a separate URL so instrumentation does not depend on transpiler output.
  await page.route('**/combat.ts*', async route => {
    const original = new URL(route.request().url());
    if (original.searchParams.has('__heroTestOriginal')) { await route.continue(); return; }
    original.searchParams.set('__heroTestOriginal', '1');
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: observedCombatModule(original.href) });
  });
  await page.addInitScript(() => {
    globalThis.__heroDraws = [];
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (this.canvas.id === 'battle' && image.src?.includes('/st-knihor/')) {
        const matrix = this.getTransform(), dpr = this.canvas.width / this.canvas.clientWidth;
        globalThis.__heroDraws.push({ source: image.src, args, naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight, displayWidth: args[6] * Math.hypot(matrix.a, matrix.b) / dpr,
          displayHeight: args[7] * Math.hypot(matrix.c, matrix.d) / dpr });
        if (globalThis.__heroDraws.length > 2000) globalThis.__heroDraws.splice(0, 500);
        // Hold only a requested, already rendered effect frame so screenshots cannot miss a
        // short projectile at x3. Normal-speed progress is asserted again after releasing it.
        if (image.src.includes('st-knihor-effects') && globalThis.__heroTestHoldRow === args[1] / 128 && args[0] >= 128) {
          globalThis.__heroTestHold = true;
        }
      }
      return originalDrawImage.call(this, image, ...args);
    };
    const key = 'brotd-infinity:campaign:v2';
    const visualSave = sessionStorage.getItem('hero-visual-save');
    if (visualSave) {
      localStorage.setItem(key, visualSave);
      sessionStorage.removeItem('hero-visual-save');
    }
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({ campaignVersion: 3, gold: 125, starterSupplyGranted: true,
      marketHintCompleted: true, clearedWaves: 0, autoWaves: false, autoWavesDefaultVersion: 1,
      hero: { xp: 4050, highestWave: 0, talents: { heal_power: 3, heal_shield: 2 } },
      units: [{ id: 1, type: 'swordsman', col: 2, row: 0, level: 30 },
        { id: 2, type: 'archer', col: 2, row: 1, level: 30 },
        { id: 3, type: 'healer', col: 2, row: 2, level: 30 }],
      reserve: [], economy: { slaves: 0, treasuryUpdatedAt: Date.now() },
    }));
  });
  const savedHero = () => page.evaluate(() => JSON.parse(localStorage.getItem('brotd-infinity:campaign:v2')).hero);
  const closeHero = () => page.locator('#hero-panel [data-close-overlay]').click();

  await page.goto(baseUrl);
  await page.waitForFunction(() => !document.querySelector('#start-wave').disabled);
  const migratedHero = await savedHero();
  assert.equal(migratedHero.talentVersion, 2);
  assert.equal(migratedHero.xp, 4050, 'talent redesign preserves hero experience');
  assert.ok(Object.values(migratedHero.talents).every(rank => rank === 0), 'legacy allocations are refunded');
  await page.locator('#open-hero').click();
  assert.equal(await page.locator('[data-hero-points]').textContent(), '9 points');
  assert.equal(await page.locator('[data-hero-talent]').count(), 18);
  await page.locator('[data-hero-talent="heal_unlock"]').click();
  assert.equal((await savedHero()).talents.heal_unlock, 0, 'selecting an icon does not spend a point');
  await page.locator('[data-hero-spend]').click();
  await page.locator('[data-hero-talent="heal_power"]').click();
  await page.locator('[data-hero-spend]').click();
  assert.equal((await savedHero()).talents.heal_power, 1);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#start-wave').disabled);
  await page.locator('#open-hero').click();
  assert.equal((await savedHero()).talents.heal_unlock, 1, 'new skill unlock survives reload');
  assert.equal(await page.locator('[data-hero-talent="heal_power"] .hero-node-rank').textContent(), '1/3');

  for (const [width, height] of [[390, 844], [320, 640], [320, 480]]) {
    await page.setViewportSize({ width, height });
    await page.locator('[data-hero-talent="miracle"]').click();
    const bounds = await page.locator('.hero-card').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 0
      && bounds.y + bounds.height <= height + 1, `dialog fits ${width}×${height}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    const nodes = await page.locator('[data-hero-talent]').evaluateAll(elements => elements.map(element => {
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }));
    assert.ok(nodes.every(node => node.width >= 40 && node.height >= 40), 'compact talent nodes retain mobile touch targets');
    const spend = await page.locator('[data-hero-spend]').boundingBox();
    assert.ok(spend.y + spend.height <= height, 'talent action stays visible');
    if (height === 480) {
      assert.ok(await page.locator('.hero-tree').evaluate(tree => tree.scrollHeight > tree.clientHeight), 'short screens scroll the tree');
      assert.ok(await page.locator('.hero-card').evaluate(card => card.scrollHeight <= card.clientHeight + 1), 'the dialog itself does not need scrolling');
    }
    await page.screenshot({ path: fileURLToPath(new URL(`talents-${width}x${height}.png`, output)) });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await closeHero();
  const heroButton = await page.locator('#open-hero').boundingBox();
  const buildingsButton = await page.locator('#open-buildings').boundingBox();
  assert.ok(heroButton.width >= 40 && heroButton.height >= 40, 'portrait remains a usable target');
  assert.ok(heroButton.y + heroButton.height <= buildingsButton.y, 'hero sits above Buildings without overlapping');
  await page.screenshot({ path: fileURLToPath(new URL('preparation.png', output)) });

  await page.locator('#start-wave').click();
  await page.waitForFunction(() => globalThis.__heroTestBattle?.phase === 'running');
  const before = await page.evaluate(() => globalThis.__heroTestBattle.hero.stats.healAmount);
  await page.locator('#open-hero').click();
  assert.equal(await page.locator('[data-hero-reset]').isDisabled(), true);
  assert.match(await page.locator('[data-hero-timing]').textContent(), /next wave/);
  await page.locator('[data-hero-talent="heal_power"]').click();
  await page.locator('[data-hero-spend]').click();
  assert.equal(await page.evaluate(() => globalThis.__heroTestBattle.hero.stats.healAmount), before, 'current battle keeps its snapshot');
  assert.equal((await savedHero()).talents.heal_power, 2);
  await closeHero();
  await page.evaluate(() => { globalThis.__heroTestFast = true; });
  await page.waitForFunction(() => globalThis.__heroTestBattle.resultRecorded, null, { timeout: 20000 });
  assert.equal((await savedHero()).xp, 4066, 'wave one grants its first-clear XP');
  await page.waitForTimeout(300);
  assert.equal((await savedHero()).xp, 4066, 'later result frames do not duplicate XP');

  await page.locator('#return-prep').click();
  await page.evaluate(() => { globalThis.__heroTestFast = false; });
  await page.locator('#start-wave').click();
  assert.ok(await page.evaluate(previous => globalThis.__heroTestBattle.hero.stats.healAmount > previous, before), 'next wave uses the upgraded snapshot');
  await page.evaluate(() => { globalThis.__heroTestFast = true; });
  await page.waitForFunction(() => globalThis.__heroTestBattle.resultRecorded, null, { timeout: 20000 });
  await page.locator('#return-prep').click();
  await page.locator('#open-hero').click();
  assert.equal(await page.locator('[data-hero-reset]').isDisabled(), false);
  const beforeReset = await savedHero();
  await page.locator('[data-hero-reset]').click();
  const afterReset = await savedHero();
  assert.equal(afterReset.talents.heal_power, 0);
  assert.equal(afterReset.xp, beforeReset.xp);
  assert.equal(afterReset.highestWave, beforeReset.highestWave);

  for (const level of [4, 20]) {
    await page.evaluate(level => {
      const key = 'brotd-infinity:campaign:v2', saved = JSON.parse(localStorage.getItem(key));
      saved.hero = { talentVersion: 2, xp: 50 * (level - 1) ** 2, highestWave: 0,
        talents: { heal_unlock: 1, aura_unlock: 1, hammer_unlock: 1,
          ...(level === 20 ? { hammer_power: 3, hammer_haste: 3, hammer_splash: 2, holy_strike: 1, heavenly_hammer: 1 } : {}) } };
      saved.clearedWaves = 0;
      saved.units = saved.units.map(unit => ({ ...unit, level: 1 }));
      saved.economy.treasuryUpdatedAt = Date.now();
      sessionStorage.setItem('hero-visual-save', JSON.stringify(saved));
    }, level);
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#start-wave').disabled);
    await page.screenshot({ path: fileURLToPath(new URL(`hero-level-${level}-start.png`, output)) });
    await page.locator('#start-wave').click();
    await page.locator('#battle-speed').click();
    await page.locator('#battle-speed').click();
    assert.equal(await page.locator('#battle-speed').textContent(), '×3');
    assert.equal(await page.evaluate(() => globalThis.__heroTestBattle.hero.level), level);
    await page.waitForFunction(() => globalThis.__heroTestBattle.enemies.length > 0);

    // A deterministic wounded ally and durable enemy exercise the actual ability queues,
    // damage/heal resolution and scene drawing instead of drawing synthetic effects.
    const woundedHp = await page.evaluate(() => {
      const battle = globalThis.__heroTestBattle, hero = battle.hero, target = battle.allies[0];
      Object.assign(hero, { x: 40, y: 408, action: 'idle', pendingAbility: null, healCooldown: 0, hammerCooldown: 999 });
      for (const ally of battle.allies) Object.assign(ally, { x: 240, y: 415, cooldown: 999, action: 'idle', hp: ally.maxHp });
      for (const enemy of battle.enemies) Object.assign(enemy, { x: 340, y: 80, cooldown: 999, damage: 0 });
      Object.assign(target, { x: 80, y: 408, hp: target.maxHp - 10 });
      globalThis.__heroTestTarget = target.id;
      globalThis.__heroTestHoldRow = 0;
      globalThis.__heroTestHold = false;
      return target.hp;
    });
    await page.waitForFunction(() => globalThis.__heroTestHold, null, { timeout: 5000 });
    assert.ok(await page.evaluate(before => globalThis.__heroTestBattle.allies.find(ally => ally.id === globalThis.__heroTestTarget).hp > before, woundedHp), `Lv.${level} actually heals`);
    assert.ok(await page.evaluate(() => globalThis.__heroTestBattle.effects.some(effect => effect.type === 'hero-heal')));
    await page.screenshot({ path: fileURLToPath(new URL(`hero-level-${level}-heal-x3.png`, output)) });

    const enemyHp = await page.evaluate(() => {
      const battle = globalThis.__heroTestBattle, hero = battle.hero, target = battle.enemies[0];
      Object.assign(hero, { x: 40, y: 408, action: 'idle', pendingAbility: null, healCooldown: 999, hammerCooldown: 0 });
      for (const ally of battle.allies) Object.assign(ally, { x: 250, y: 425, cooldown: 999, action: 'idle' });
      Object.assign(target, { x: 145, y: 368, hp: 500, maxHp: 500, cooldown: 999, action: 'idle', damage: 0 });
      globalThis.__heroTestTarget = target.id;
      globalThis.__heroTestHoldRow = 2;
      globalThis.__heroTestHold = false;
      return target.hp;
    });
    await page.waitForFunction(() => globalThis.__heroTestHold, null, { timeout: 5000 });
    assert.ok(await page.evaluate(() => globalThis.__heroTestBattle.effects.some(effect => effect.type === 'hero-hammer')));
    await page.screenshot({ path: fileURLToPath(new URL(`hero-level-${level}-hammer-x3.png`, output)) });
    await page.evaluate(() => { globalThis.__heroTestHoldRow = 3; globalThis.__heroTestHold = false; });
    await page.waitForFunction(() => globalThis.__heroTestHold, null, { timeout: 5000 });
    assert.ok(await page.evaluate(before => globalThis.__heroTestBattle.enemies.find(enemy => enemy.id === globalThis.__heroTestTarget).hp < before, enemyHp), `Lv.${level} hammer deals real damage`);
    assert.equal(await page.evaluate(() => globalThis.__heroTestBattle.enemies.find(enemy => enemy.id === globalThis.__heroTestTarget).stunTime > 0), level === 20, 'only the learned capstone stuns the target');
    await page.screenshot({ path: fileURLToPath(new URL(`hero-level-${level}-impact-x3.png`, output)) });
    const elapsed = await page.evaluate(() => {
      globalThis.__heroTestHoldRow = null;
      globalThis.__heroTestHold = false;
      return globalThis.__heroTestBattle.elapsed;
    });
    await page.waitForFunction(before => globalThis.__heroTestBattle.elapsed > before + 1, elapsed, { timeout: 3000 });
    assert.equal(await page.locator('#battle-speed').textContent(), '×3');
    const draws = await page.evaluate(() => globalThis.__heroDraws);
    const bodies = draws.filter(draw => !draw.source.includes('effects'));
    assert.ok(bodies.length > 5);
    assert.ok(new Set(bodies.map(draw => `${draw.args[0]}:${draw.args[1]}`)).size > 2, 'hero animation advances across atlas poses');
    for (const draw of draws) {
      const [sx, sy, sw, sh] = draw.args;
      assert.deepEqual([sw, sh], [128, 128], 'only one authored cell is drawn');
      assert.equal(sx % 128, 0);
      assert.equal(sy % 128, 0);
      assert.ok(sx >= 0 && sy >= 0 && sx + sw <= draw.naturalWidth && sy + sh <= draw.naturalHeight, 'no atlas overflow');
      assert.ok(draw.displayWidth > 0 && draw.displayWidth < 90, 'sprite/effect footprint stays compact');
      if (!draw.source.includes('effects')) {
        const bodyHeight = draw.displayHeight * 82.5 / 128;
        assert.ok(bodyHeight >= 30 && bodyHeight <= 60, `hero body is ${bodyHeight}px`);
      }
    }
  }
  for (const part of ['up', 'down', 'side', 'effects', 'portrait']) {
    assert.ok([...requests].some(path => path.endsWith(`/st-knihor-${part}.webp`)), `loaded ${part} hero WebP`);
  }
  assert.ok(![...requests].some(path => /\/(?:king(?:-art|-portrait)?\.(?:png|webp)|tiny-swords-king[^/]*\.png)$/.test(path)), 'old king artwork is never requested');
  assert.deepEqual(errors, []);
  console.log(`Passed hero integration: 18-node trees at 320/390px, legacy talent refund, new allocation save/reload, battle snapshot, XP once, reset gate, Lv.4/20 learned heal+hammer at x3, animation sizes and atlas bounds, five WebPs without old king art. Screenshots: ${fileURLToPath(output)}`);
} finally {
  await browser?.close();
  await server?.close();
}
