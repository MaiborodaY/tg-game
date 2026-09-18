import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle } from '../combat.ts';
import { PANTHER_RIDER_ASSETS, PANTHER_RIDER_GEOMETRY } from '../panther-rider-art.ts';
import { FIELD, FORMATION_VIEW } from '../field.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

test('rider scene uses authored strike crops, west flip and dead fade without new texture work', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(), scene = env.keep(await createScene(canvas));
  const units = [{ id: 1, type: 'pantherRider', level: 50, col: 2, row: 1 }];
  const battle = createBattle(units, 1);
  const rider = battle.allies[0];
  assert.equal(await scene.prepare({ battle, units }), true);
  const requests = env.requests.length;
  for (const [facingX, facingY, frame] of [[1, 0, 10], [-1, 0, 10], [0, 1, 14], [0, -1, 10]]) {
    Object.assign(rider, { action: 'attack', facingX, facingY, actionTime: .5, actionDuration: 1, impactFraction: .42 });
    canvas.clear();
    scene.render({ battle, units, time: 7 });
    const index = canvas.commands.findIndex(([method, image]) => method === 'drawImage' && image.includes('panther-rider-purple.webp'));
    assert.ok(index >= 0);
    const { x, y, width, height } = PANTHER_RIDER_GEOMETRY.sourceRects[frame];
    assert.deepEqual(canvas.commands[index].slice(2, 6), [x, y, width, height]);
    const flipped = canvas.commands.slice(index - 4, index).some(([method, x, y]) => method === 'scale' && x === -1 && y === 1);
    assert.equal(flipped, facingX < 0, 'only western direction mirrors the authored east pose');
    assert.equal(canvas.saveDepth, 0);
  }
  Object.assign(rider, { action: 'dead', hp: 0, deathTime: .5 });
  canvas.clear();
  scene.render({ battle, units });
  assert.ok(canvas.commands.some(([method, key, value]) => method === 'set' && key === 'globalAlpha' && value > 0 && value < 1));
  const deadDraw = canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('panther-rider-purple.webp'));
  assert.deepEqual(deadDraw.slice(2, 6), Object.values(PANTHER_RIDER_GEOMETRY.sourceRects[0]));
  assert.equal(env.requests.length, requests, 'changing poses never loads or generates more sprites');
});

test('rider formation stays static and uses personal-rank art in unit details', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  const units = [{ id: 1, type: 'pantherRider', level: 500, col: 2, row: 1 }];
  assert.equal(await scene.prepare({ units }), true);
  const draws = [];
  for (const time of [0, 8]) {
    canvas.clear();
    scene.render({ units, time });
    draws.push(canvas.commands.find(([method, image]) => method === 'drawImage' && image.includes('panther-rider-black.webp')));
    assert.ok(canvas.commands.some(([method, label]) => method === 'fillText' && label === '500'));
    assert.equal(canvas.saveDepth, 0);
  }
  assert.deepEqual(draws[0], draws[1]);
  assert.equal(scene.getPortrait('pantherRider'), PANTHER_RIDER_ASSETS[1].art);
  for (const [level, rank] of [[1, 1], [50, 2], [100, 3], [250, 4], [500, 5], [9999, 5]]) {
    assert.equal(scene.getUnitArt('pantherRider', level), PANTHER_RIDER_ASSETS[rank].art);
  }
});

test('two-cell rider draws once over both cells, with centred labels and all palettes 15% larger', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  for (const [level, color] of [[1, 'green'], [50, 'purple'], [100, 'red'], [250, 'gold'], [500, 'black']]) {
    const unit = { id: 1, type: 'pantherRider', col: 1, row: 0, level };
    await scene.prepare({ units: [unit], selectedId: 1 });
    canvas.clear(); scene.render({ units: [unit], selectedId: 1 });
    const draws = canvas.commands.filter(([method, image]) => method === 'drawImage' && image.includes(`panther-rider-${color}.webp`));
    assert.equal(draws.length, 1, 'the right-hand occupied cell does not duplicate its sprite');
    const source = PANTHER_RIDER_GEOMETRY.sourceRects[0], scale = 54.05 / (PANTHER_RIDER_GEOMETRY.bodyHeight * 192);
    assert.ok(Math.abs(draws[0][8] - source.width * scale) < 1e-9);
    assert.ok(Math.abs(draws[0][9] - source.height * scale) < 1e-9);
    const center = FIELD.gridX + 2 * FIELD.cellWidth;
    assert.ok(canvas.commands.some(([method, x, y]) => method === 'translate' && x === center && y === 320));
    assert.equal(canvas.commands.filter(([method, property, value]) => method === 'set' && property === 'fillStyle' && value === '#ffe6a2a8').length, 2, 'selection covers both cells');
    assert.equal(canvas.commands.filter(([method, , , w, h]) => method === 'fillRect' && w === 12 && h === 2).length, 13, 'neither occupied cell gets an empty plus');
    const labels = canvas.commands.filter(([method, text]) => method === 'fillText' && text === String(level));
    assert.equal(labels.length, 1);
    assert.equal(labels[0][2], center + 2);
    assert.ok(labels[0][3] - 7 >= FORMATION_VIEW.y, 'first-row level is not clipped by the compact canvas');
    const spriteIndex = canvas.commands.indexOf(draws[0]);
    assert.equal(canvas.commands.slice(spriteIndex).some(([method]) => method === 'stroke'), false, 'all cell panels render before the enlarged sprite');
  }
  canvas.clear(); scene.render({ selectedId: null, mergeTargets: [1], mergeLevel: 3, dragTargetId: 1 });
  const highlights = canvas.commands.filter(([method, , , w, h]) => method === 'strokeRect' && w === FIELD.cellWidth - 6 && h === FIELD.cellHeight - 6);
  assert.equal(highlights.length, 2, 'Connect target highlights the complete footprint');
  assert.equal(canvas.commands.filter(([method, text]) => method === 'fillText' && text === '+3 → 503').length, 1);
  assert.equal(canvas.saveDepth, 0);
});

test('rider placement ghost requires both owned cells and validates the same single-unit replacement', async t => {
  const env = createSceneEnvironment();
  t.after(() => env.restore());
  const canvas = env.canvas(306, 184), scene = env.keep(await createScene(canvas, { formationOnly: true }));
  const move = (col, row) => canvas.dispatch('pointermove', {
    clientX: FIELD.gridX + (col + .5) * FIELD.cellWidth - FORMATION_VIEW.x,
    clientY: FIELD.gridY + (row + .5) * FIELD.cellHeight - FORMATION_VIEW.y,
  });
  const ghostDraws = () => canvas.commands.filter(([method, image]) => method === 'drawImage' && image.includes('panther-rider-green.webp')).length;
  const swordsman = { id: 2, type: 'swordsman', level: 1, col: 1, row: 0 };
  for (const [units, unlockedCells, col, replacingFromReserve, expected] of [
    [[], ['1:0'], 1, true, 0],
    [[], ['1:0', '2:0'], 1, true, 1],
    [[], ['4:0'], 4, true, 0],
    [[swordsman], ['1:0', '2:0'], 1, true, 1],
    [[swordsman, { ...swordsman, id: 3, col: 2 }], ['1:0', '2:0'], 1, true, 0],
    [[swordsman], ['1:0', '2:0'], 1, false, 0],
  ]) {
    await scene.prepare({ units, unlockedCells, placementType: 'pantherRider', replacingFromReserve });
    canvas.clear(); move(col, 0);
    assert.equal(ghostDraws(), expected, JSON.stringify({ units, unlockedCells, col, replacingFromReserve }));
  }
  const rider = { id: 1, type: 'pantherRider', level: 1, col: 1, row: 1 };
  const unlockedCells = ['1:0', '2:0', '1:1', '2:1'];
  await scene.prepare({ units: [rider, swordsman], unlockedCells, movingId: 1, placementType: 'pantherRider', replacingFromReserve: false });
  canvas.clear(); move(1, 0);
  assert.equal(ghostDraws(), 2, 'valid swap shows the existing rider and exactly one destination preview');
  await scene.prepare({ units: [rider, swordsman, { ...swordsman, id: 3, col: 2 }], unlockedCells });
  canvas.clear(); move(1, 0);
  assert.equal(ghostDraws(), 1, 'a second occupant blocks the swap preview');
});
