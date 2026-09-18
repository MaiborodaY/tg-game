import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle, updateBattle } from '../combat.ts';
import { FIELD, BATTLE_VIEW, FORMATION_VIEW, HERO_START } from '../field.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

function setup(t) {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  return env;
}

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
  battle.effects.push({ ...base, type: 'hero-heal', amount: 10, shield: 5 },
    { ...base, id: 2, type: 'hero-hammer', damage: 10, landed: false },
    { ...base, id: 3, type: 'hero-impact' }, { ...base, id: 4, type: 'gold', amount: 7 });
  assert.equal(await scene.prepare({ battle, units }), true);
  canvas.clear();
  scene.render({ battle, units, time: .3 });
  const images = canvas.commands.filter(([method]) => method === 'drawImage').map(([, image]) => image);
  assert.ok(images.some(image => image.includes('st-knihor-effects')));
  assert.ok(images.some(image => /st-knihor-(up|down|side)\.webp/.test(image)));
  assert.ok(canvas.commands.some(([method, text]) => method === 'fillText' && text === '+7'));
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
