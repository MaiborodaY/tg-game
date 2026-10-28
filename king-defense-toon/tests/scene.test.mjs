import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle, updateBattle } from '../combat.ts';
import { createHero, heroXpForLevel, spendHeroTalent, resetHeroTalents } from '../hero.ts';
import { FIELD, BATTLE_VIEW, FORMATION_VIEW, HERO_START } from '../field.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';
import { getWaveDefinition } from '../waves.ts';

function setup(t) {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  return env;
}

test('covered scenes skip every draw path and resume with current state and cached assets', async t => {
  const env = setup(t);
  let finishFonts;
  document.fonts.ready = new Promise(resolve => { finishFonts = resolve; });
  const canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  scene.setDrawingEnabled(false);
  canvas.clear();
  scene.render({ time: 99, units: [{ id: 1, type: 'archer', level: 7, col: 2, row: 0 }] });
  env.window.dispatch('resize');
  for (const observer of env.observers) observer.callback();
  finishFonts(); await env.flush();
  assert.deepEqual(canvas.commands, [], 'render, resize, fonts and asset completion cannot draw behind a covering screen');
  await scene.prepare();
  const requests = env.requests.length;
  scene.setDrawingEnabled(true);
  assert.ok(canvas.commands.some(([method]) => method === 'drawImage'));
  assert.equal(env.requests.length, requests, 'return does not reload retained images');
  scene.destroy(); canvas.clear(); scene.setDrawingEnabled(true);
  assert.deepEqual(canvas.commands, []);
});

test('returning from battle to ready formation resources never enters loading', async t => {
  const env = setup(t), states = [];
  const scene = env.keep(await createScene(env.canvas(), { onAssetState: s => states.push(s.status) }));
  const units = [{ id: 1, type: 'swordsman', level: 30, col: 2, row: 0 }];
  await scene.prepare({ units, battle: createBattle(units, 59) });
  states.length = 0;
  const requests = env.requests.length;
  scene.render({ units, battle: null });
  assert.equal(scene.getAssetState().status, 'ready', 'ready before returning to the caller');
  assert.equal(await scene.prepare(), true);
  assert.deepEqual(states, ['ready']);
  assert.equal(env.requests.length, requests);
});

test('upcoming waves preload without blocking and stay ready through Prepare and Start', async t => {
  const env = setup(t), states = [], canvas = env.canvas();
  const scene = env.keep(await createScene(canvas, { onAssetState: s => states.push(s.status) }));
  const units = [{ id: 1, type: 'swordsman', level: 90, col: 2, row: 0 }];
  const battle = createBattle(units, 59);
  await scene.prepare({ units, battle });
  states.length = 0;
  canvas.clear();
  const next = { units, wave: getWaveDefinition(60) };
  assert.equal(await scene.preload(next), true);
  assert.deepEqual(states, [], 'prefetch cannot block, notify or replace the visible scene');
  assert.equal(canvas.commands.length, 0);
  const requests = env.requests.length;
  scene.render({ ...next, battle: null });
  assert.equal(scene.getAssetState().status, 'ready');
  scene.render({ ...next, battle: createBattle(units, 60) });
  assert.equal(scene.getAssetState().status, 'ready');
  assert.equal(await scene.prepare(), true);
  assert.ok(!states.includes('loading'));
  assert.equal(env.requests.length, requests, 'both transitions reuse the retained images');
});

test('foreground promotion shares pending preloads, and speculative failures remain retryable', async t => {
  const env = setup(t), states = [];
  const scene = env.keep(await createScene(env.canvas(), { onAssetState: s => states.push(s.status) }));
  const next = { wave: getWaveDefinition(60) };
  env.setImageMode(url => url.includes('goblin-chief') ? 'hold' : 'resolve');
  const warming = scene.preload(next);
  await env.flush();
  assert.equal(scene.getAssetState().status, 'ready');
  const promoting = scene.prepare(next);
  await env.flush();
  assert.equal(env.requests.filter(url => url.includes('goblin-chief')).length, 1);
  assert.equal(scene.getAssetState().status, 'loading');
  env.finishImages();
  assert.deepEqual(await Promise.all([warming, promoting]), [true, true]);

  env.setImageMode(url => url.includes('forgotten-graveyard') ? 'reject' : 'resolve');
  states.length = 0;
  assert.equal(await scene.preload({ levelNumber: 2 }), false);
  assert.deepEqual(states, [], 'failed speculative loads leave the current wave usable');
  assert.equal(await scene.prepare({ levelNumber: 2 }), false);
  assert.equal(scene.getAssetState().status, 'error', 'required resources still report real errors');
  env.setImageMode(() => 'resolve');
  assert.equal(await scene.retryAssets(), true);
});

test('preloads retain only one upcoming plan and release it on destroy, including late loads', async t => {
  const env = setup(t), scene = env.keep(await createScene(env.canvas()));
  const units = [{ type: 'swordsman', level: 50, id: 1, col: 2, row: 0 }];
  await scene.preload({ units });
  const count = () => env.requests.filter(url => url.includes('swordsman-purple')).length;
  assert.equal(count(), 1);
  await scene.preload({ units: [] });
  await scene.preload({ units });
  assert.equal(count(), 2, 'replaced speculative assets are released');
  env.setImageMode(url => url.includes('goblin-chief') ? 'hold' : 'resolve');
  const late = scene.preload({ wave: getWaveDefinition(60) });
  await env.flush();
  scene.destroy(); env.finishImages();
  assert.equal(await late, false);
  assert.equal(await scene.preload({ units }), false);
  env.setImageMode(() => 'resolve');
  const replacement = env.keep(await createScene(env.canvas()));
  await replacement.preload({ wave: getWaveDefinition(60) });
});

test('scene reports loading then ready, shares retained resources and releases them on final destroy', async t => {
  const env = setup(t), states = [], canvas = env.canvas();
  env.setImageMode(() => 'hold');
  const creating = createScene(canvas, { onAssetState: state => states.push(state) }).then(scene => env.keep(scene));
  await env.flush();
  assert.deepEqual(states, [{ status: 'loading', levelNumber: 1 }]);
  assert.equal(canvas.listenerCount, 3);
  assert.ok(canvas.commands.some(([method]) => method === 'fillRect'), 'fallback battlefield is drawn during loading');
  const requests = env.requests.length;
  assert.ok(requests > 0);
  env.finishImages();
  const first = await creating;
  assert.deepEqual(states.map(state => state.status), ['loading', 'ready']);
  assert.equal(canvas.width, 780, 'device pixel ratio is capped at two');
  assert.equal(canvas.saveDepth, 0);
  env.setImageMode(() => 'resolve');
  const second = env.keep(await createScene(env.canvas()));
  assert.equal(env.requests.length, requests, 'live scenes share their map and hero images');
  first.destroy();
  assert.equal(await second.prepare(), true);
  second.destroy();
  assert.equal(canvas.listenerCount, 0);
  assert.equal(env.window.listenerCount, 0);
  const third = env.keep(await createScene(env.canvas()));
  assert.ok(env.requests.length > requests, 'last owner releases settled resources');
  assert.equal(third.getAssetState().status, 'ready');
});

test('battle sprites and hero effects render while formation keeps personal levels and excludes the hero', async t => {
  const env = setup(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const units = ['swordsman', 'archer', 'healer', 'lancer'].map((type, col) => ({ id: col + 1, type, col, row: 0, level: 3 }));
  const battle = createBattle(units, 1);
  for (let step = 0; step < 10; step++) updateBattle(battle, .1);
  assert.ok(battle.enemies.length > 0);
  battle.allies[2].action = 'heal';
  battle.allies[2].actionTime = .45;
  const base = { id: 1, x: 100, y: 250, targetX: 130, targetY: 230, age: .2, duration: .6, side: 'ally', sourceType: 'hero', sourceId: battle.hero.id, targetId: battle.allies[0].id };
  battle.projectiles.push({ ...base, id: 2, type: 'hero-hammer', damage: 10, landed: false });
  battle.effects.push({ ...base, type: 'hero-heal', amount: 10, shield: 5 },
    { ...base, id: 3, type: 'hero-impact' }, { ...base, id: 4, type: 'gold', amount: 7 });
  assert.equal(await scene.prepare({ battle, units }), true);
  canvas.clear();
  scene.render({ battle, units, time: .3 });
  const images = canvas.commands.filter(([method]) => method === 'drawImage').map(([, image]) => image);
  assert.ok(images.some(image => image.includes('st-knihor-effects')));
  assert.ok(images.some(image => /st-knihor-(up|down|side)\.webp/.test(image)));
  assert.ok(canvas.commands.some(([method, text]) => method === 'fillText' && text === '+7'));
  const hammerDraw = canvas.commands.findIndex(([method, image, , sy]) => method === 'drawImage'
    && image.includes('st-knihor-effects') && sy === 256);
  const goldDraw = canvas.commands.findIndex(([method, text]) => method === 'fillText' && text === '+7');
  assert.ok(hammerDraw >= 0 && hammerDraw < goldDraw, 'cosmetic labels overlay projectile sprites');
  assert.equal(canvas.saveDepth, 0);

  const armyCanvas = env.canvas(306, 184), army = env.keep(await createScene(armyCanvas, { formationOnly: true }));
  assert.equal(await army.prepare({ battle, units }), true);
  armyCanvas.clear();
  army.render({ battle, units, time: .3, selectedId: 1, mergeTargets: [2], mergeLevel: 2 });
  assert.equal(armyCanvas.commands.some(([method, image]) => method === 'drawImage' && image.includes('st-knihor')), false);
  assert.equal(armyCanvas.commands.filter(([method, text]) => method === 'fillText' && text === '3').length, 4);
  assert.ok(armyCanvas.commands.some(([method, text]) => method === 'fillText' && text === '+2 → 5'));
  assert.equal(armyCanvas.saveDepth, 0);
});

test('scene draws projectile sprites with no cosmetics and never advances or mutates frozen combat state', async t => {
  const env = setup(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const battle = structuredClone(createBattle([{ id: 1, type: 'swordsman', level: 3, col: 2, row: 0 }], 1));
  battle.projectiles.push({ id: 1, type: 'hero-hammer', sourceType: 'hero', sourceId: battle.hero.id,
    targetId: 'enemy-1', side: 'ally', x: 100, y: 250, targetX: 130, targetY: 230,
    age: .2, duration: .6, damage: 10, landed: false });
  assert.deepEqual(battle.effects, []);
  const before = structuredClone(battle);
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const child of Object.values(value)) freeze(child);
    }
  };
  freeze(battle);
  assert.equal(await scene.prepare({ battle }), true);
  for (const time of [.3, 10]) {
    canvas.clear(); scene.render({ battle, time });
    assert.ok(canvas.commands.some(([method, image, , sy]) => method === 'drawImage'
      && image.includes('st-knihor-effects') && sy === 256), 'hammer flight renders without a retained visual effect');
    assert.deepEqual(battle, before, 'render time cannot advance projectiles, resolve damage or mutate actors');
    assert.equal(canvas.saveDepth, 0);
  }
});

test('the armour visual follows the learned aura and the current battle snapshot', async t => {
  const env = setup(t), canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const heroState = createHero({ xp: heroXpForLevel(2) });
  const rendersAura = state => {
    canvas.clear();
    scene.render({ time: .3, battle: null, ...state });
    return canvas.commands.some(([method, image, , sy]) => method === 'drawImage'
      && image.includes('st-knihor-effects') && sy === 128);
  };
  assert.equal(rendersAura({ heroState }), false, 'unlearned aura stays invisible in preparation');
  assert.equal(rendersAura({ battle: createBattle([], 1, heroState) }), false);
  assert.equal(spendHeroTalent(heroState, 'aura_unlock').spent, true);
  assert.equal(rendersAura({ heroState }), true);
  const battle = createBattle([], 1, heroState);
  resetHeroTalents(heroState);
  assert.equal(rendersAura({ battle, heroState }), true, 'ongoing battle retains its learned aura');
  assert.equal(rendersAura({ battle: createBattle([], 1, heroState), heroState }), false);
  battle.hero.hp = 0;
  assert.equal(rendersAura({ battle, heroState }), false, 'dead hero has no aura visual');
});

test('cell hit testing inverts both viewports and clicks keep hero and army actions separate', async t => {
  const env = setup(t);
  for (const formationOnly of [false, true]) for (const scale of [1, 2]) {
    const view = formationOnly ? FORMATION_VIEW : BATTLE_VIEW;
    const canvas = env.canvas(view.width * scale, view.height * scale, 17, 23), cells = [];
    let heroClicks = 0;
    const scene = env.keep(await createScene(canvas, { formationOnly, onCell: cell => cells.push(cell), onHero: () => { heroClicks += 1; } }));
    const client = (x, y) => ({ clientX: 17 + (x - view.x) * scale, clientY: 23 + (y - view.y) * scale });
    for (let row = 0; row < FIELD.rows; row++) for (let col = 0; col < FIELD.columns; col++) {
      const point = client(FIELD.gridX + (col + .5) * FIELD.cellWidth, FIELD.gridY + (row + .5) * FIELD.cellHeight);
      assert.deepEqual(scene.getCellAt(point.clientX, point.clientY), { col, row });
      canvas.dispatch('click', point);
    }
    assert.equal(cells.length, 15);
    assert.equal(scene.getCellAt(16, 23), null);
    assert.equal(scene.getCellAt(17 + canvas.rect.width, 23), null);
    if (!formationOnly) {
      canvas.dispatch('click', client(HERO_START.x, HERO_START.y - 20));
      assert.equal(heroClicks, 1);
      scene.render({ battle: createBattle() });
      canvas.dispatch('click', client(FIELD.gridX + 20, FIELD.gridY + 20));
      assert.equal(cells.length, 15, 'battlefield grid clicks cannot change the running army');
    }
    canvas.rect.width = 0;
    assert.equal(scene.getCellAt(17, 23), null);
    scene.destroy();
  }
});

test('asset errors preserve a usable scene and explicit retry recovers without reloading successful resources', async t => {
  const env = setup(t), states = [];
  const failing = url => url.includes('st-knihor-up');
  env.setImageMode(url => failing(url) ? 'reject' : 'resolve');
  const scene = env.keep(await createScene(env.canvas(), { onAssetState: state => states.push(state) }));
  const failure = scene.getAssetState();
  assert.equal(failure.status, 'error');
  assert.match(failure.error.message, /Could not load image/);
  assert.equal(env.requests.filter(failing).length, 2);
  const successfulRequests = env.requests.filter(url => !failing(url)).length;
  assert.equal(await scene.prepare(), false, 'same plan retains its failure until explicit retry');
  env.setImageMode(() => 'resolve');
  assert.equal(await scene.retryAssets(), true);
  assert.equal(scene.getAssetState().status, 'ready');
  assert.equal(env.requests.filter(url => !failing(url)).length, successfulRequests);
  assert.deepEqual(states.map(state => state.status), ['loading', 'error', 'loading', 'ready']);
  const snapshot = scene.getAssetState();
  snapshot.status = 'changed';
  assert.equal(scene.getAssetState().status, 'ready');
});

test('obsolete level loads cannot overwrite the latest plan, and destroy ignores late completion', async t => {
  const env = setup(t), states = [], canvas = env.canvas();
  const scene = env.keep(await createScene(canvas, { onAssetState: state => states.push(state) }));
  env.setImageMode(url => url.includes('forgotten-graveyard') ? 'hold' : 'resolve');
  const old = scene.prepare({ levelNumber: 2 });
  assert.equal(scene.prepare(), old, 'concurrent preparation shares its pending promise');
  await env.flush();
  assert.equal(await scene.prepare({ levelNumber: 1 }), true);
  env.finishImages();
  assert.equal(await old, false);
  assert.deepEqual(scene.getAssetState(), { status: 'ready', levelNumber: 1 });

  const late = scene.prepare({ levelNumber: 2 });
  await env.flush();
  scene.destroy();
  const notifications = states.length, commands = canvas.commands.length;
  env.finishImages();
  assert.equal(await late, false);
  assert.equal(states.length, notifications);
  assert.equal(canvas.commands.length, commands);
  assert.equal(canvas.listenerCount, 0);
  assert.equal(env.window.listenerCount, 0);
  assert.equal(env.observers[0].disconnected, true);
  scene.render({ time: 100 });
  assert.equal(canvas.commands.length, commands);
  assert.equal(await scene.prepare(), false);
  assert.equal(await scene.retryAssets(), false);
  assert.equal(scene.getCellAt(200, 300), null);
});
