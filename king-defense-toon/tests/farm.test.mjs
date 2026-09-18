import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS, createFarm, getCropProgress, harvestCrop, plantCrop } from '../farm.ts';

const START = 1_800_000_000_000;
const snapshot = value => JSON.parse(JSON.stringify(value));
const fail = { harvested: false, amount: 0 };

test('a farm starts with three independent fixed beds and an empty vegetable inventory', () => {
  assert.deepEqual(CROPS, [
    { id: 'carrot', name: 'Carrot', growSeconds: 300, yield: 1 },
    { id: 'potato', name: 'Potato', growSeconds: 900, yield: 1 },
    { id: 'pumpkin', name: 'Pumpkin', growSeconds: 1800, yield: 1 },
  ]);
  assert.ok(Object.isFrozen(CROPS) && CROPS.every(Object.isFrozen));
  assert.deepEqual(createFarm(), { plots: { carrot: null, potato: null, pumpkin: null }, stock: { carrot: 0, potato: 0, pumpkin: 0 } });
  const first = createFarm(), second = createFarm();
  plantCrop(first, 'carrot', START);
  assert.equal(second.plots.carrot, null);
});

test('all crops grow on their exact wall-clock schedule and can only be manually harvested once', () => {
  for (const { id, growSeconds } of CROPS) {
    const farm = createFarm();
    assert.deepEqual(getCropProgress(farm, id, START), { status: 'empty', remainingSeconds: 0, progress: 0 });
    assert.equal(plantCrop(farm, id, START), true);
    assert.deepEqual(farm.plots[id], { plantedAt: START, readyAt: START + growSeconds * 1000 });
    assert.equal(farm.stock[id], 0, 'planting grants no inventory');
    assert.deepEqual(getCropProgress(farm, id, START), { status: 'growing', remainingSeconds: growSeconds, progress: 0 });
    assert.deepEqual(getCropProgress(farm, id, START + growSeconds * 500),
      { status: 'growing', remainingSeconds: growSeconds / 2, progress: .5 });
    const before = snapshot(farm), readyAt = farm.plots[id].readyAt;
    assert.deepEqual(harvestCrop(farm, id, readyAt - 1), fail);
    assert.deepEqual(farm, before);
    assert.equal(getCropProgress(farm, id, readyAt - 1).remainingSeconds, 1);
    assert.deepEqual(getCropProgress(farm, id, readyAt), { status: 'ready', remainingSeconds: 0, progress: 1 });
    assert.deepEqual(farm, before, 'displaying readiness does not collect or mutate the crop');
    assert.deepEqual(harvestCrop(farm, id, readyAt), { harvested: true, amount: 1 });
    assert.equal(farm.plots[id], null);
    assert.equal(farm.stock[id], 1);
    assert.deepEqual(harvestCrop(farm, id, readyAt), fail);
    assert.equal(farm.stock[id], 1);
    assert.equal(plantCrop(farm, id, readyAt), true, 'manual collection frees the bed for planting again');
    assert.equal(getCropProgress(farm, id, readyAt).status, 'growing');
    assert.deepEqual(harvestCrop(farm, id, readyAt), fail);
  }
});

test('growing and ripe plants cannot be overwritten, while other crops can be planted independently', () => {
  const farm = createFarm();
  for (const crop of CROPS) assert.equal(plantCrop(farm, crop.id, START), true);
  const before = snapshot(farm);
  for (const crop of CROPS) for (const now of [START, START + 1000, START + 10_000_000]) {
    assert.equal(plantCrop(farm, crop.id, now), false);
    assert.deepEqual(farm, before);
  }
  assert.deepEqual(harvestCrop(farm, 'carrot', START + 300_000), { harvested: true, amount: 1 });
  assert.equal(getCropProgress(farm, 'potato', START + 300_000).status, 'growing');
  assert.equal(getCropProgress(farm, 'pumpkin', START + 300_000).status, 'growing');
});

test('saved timestamps finish offline without automatic collecting, replanting or spoiling', () => {
  const original = createFarm();
  for (const crop of CROPS) plantCrop(original, crop.id, START);
  const saved = snapshot(original), restored = createFarm(saved);
  assert.deepEqual(restored, original);
  assert.notEqual(restored.plots.carrot, saved.plots.carrot);
  const later = START + 30 * 24 * 60 * 60 * 1000;
  for (const crop of CROPS) {
    assert.equal(getCropProgress(restored, crop.id, later).status, 'ready');
    assert.equal(restored.stock[crop.id], 0);
    assert.deepEqual(harvestCrop(restored, crop.id, later), { harvested: true, amount: 1 });
  }
  assert.deepEqual(saved, original, 'restoration owns its timers and inventory');
  const reloaded = createFarm(snapshot(restored));
  for (const crop of CROPS) {
    assert.deepEqual(harvestCrop(reloaded, crop.id, later + 1000), fail);
    assert.equal(reloaded.stock[crop.id], 1);
    assert.equal(getCropProgress(reloaded, crop.id, later + 1000).status, 'empty');
  }
});

test('reading crop progress is independent of read frequency and does not reward clock rollback', () => {
  const farm = createFarm();
  plantCrop(farm, 'carrot', START);
  const before = snapshot(farm);
  for (const reads of [1, 2, 3, 30, 120]) for (let index = 0; index < reads; index++) {
    assert.deepEqual(getCropProgress(farm, 'carrot', START + 150000), { status: 'growing', remainingSeconds: 150, progress: .5 });
  }
  assert.deepEqual(getCropProgress(farm, 'carrot', START - 100000), { status: 'growing', remainingSeconds: 300, progress: 0 });
  assert.deepEqual(harvestCrop(farm, 'carrot', START - 100000), fail);
  assert.deepEqual(farm, before);
});

test('save restoration rejects malformed timestamps, duration changes, ids and inventory counts without coercion', () => {
  const empty = createFarm();
  for (const source of [undefined, null, false, true, 0, 'farm', [], { plots: [], stock: '3' }]) {
    assert.deepEqual(createFarm(source), empty);
  }
  for (const value of [-1, 0, .5, '1800000000000', null, false, {}, [], NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(createFarm({ plots: { carrot: { plantedAt: value, readyAt: START + 300000 } } }).plots.carrot, null);
  }
  for (const plot of [{ plantedAt: START }, { readyAt: START + 300000 },
    { plantedAt: START, readyAt: START + 299999 }, { plantedAt: START, readyAt: String(START + 300000) },
    { plantedAt: Number.MAX_SAFE_INTEGER, readyAt: Number.MAX_SAFE_INTEGER },
    { plantedAt: START, readyAt: START + 900000 }]) {
    assert.equal(createFarm({ plots: { carrot: plot } }).plots.carrot, null);
  }
  for (const value of [-1, .5, '3', null, false, {}, [], NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(createFarm({ stock: { carrot: value } }).stock.carrot, 0);
  }
  const saved = Object.freeze({ plots: Object.freeze({ carrot: Object.freeze({ plantedAt: START, readyAt: START + 300000 }),
    potato: { plantedAt: 0, readyAt: 900000 }, bean: { plantedAt: START, readyAt: START + 300000 } }),
  stock: Object.freeze({ carrot: 2, potato: 3, pumpkin: '4', bean: 100 }) });
  assert.deepEqual(createFarm(saved), { plots: { carrot: { plantedAt: START, readyAt: START + 300000 }, potato: null, pumpkin: null },
    stock: { carrot: 2, potato: 3, pumpkin: 0 } });
  assert.deepEqual(createFarm(Object.create({ plots: saved.plots, stock: saved.stock })), empty);
});

test('failed actions reject invalid clocks, crop identifiers and state without mutating valid data', () => {
  const farm = createFarm(), before = snapshot(farm);
  for (const now of [0, -1, .5, '1800000000000', NaN, Infinity, undefined, null, Number.MAX_SAFE_INTEGER + 1]) {
    // Undefined requests the documented Date.now default, so exercise it separately below.
    if (now === undefined) continue;
    assert.equal(plantCrop(farm, 'carrot', now), false);
    assert.deepEqual(harvestCrop(farm, 'carrot', now), fail);
    assert.throws(() => getCropProgress(farm, 'carrot', now), RangeError);
    assert.deepEqual(farm, before);
  }
  for (const crop of ['bean', 'constructor', '__proto__', null, undefined, 0]) {
    assert.equal(plantCrop(farm, crop, START), false);
    assert.deepEqual(harvestCrop(farm, crop, START), fail);
    assert.throws(() => getCropProgress(farm, crop, START), RangeError);
    assert.deepEqual(farm, before);
  }
  for (const invalid of [null, {}, { plots: {}, stock: {} }, { ...farm, stock: { ...farm.stock, carrot: -1 } }]) {
    const saved = structuredClone(invalid);
    assert.equal(plantCrop(invalid, 'carrot', START), false);
    assert.deepEqual(harvestCrop(invalid, 'carrot', START), fail);
    assert.throws(() => getCropProgress(invalid, 'carrot', START), TypeError);
    assert.deepEqual(invalid, saved);
  }
  const earliest = Date.now();
  assert.equal(plantCrop(farm, 'carrot'), true);
  assert.ok(farm.plots.carrot.plantedAt >= earliest && farm.plots.carrot.plantedAt <= Date.now());
});

test('safe-integer boundaries preserve ripe crops when inventory cannot accept the harvest', () => {
  for (const crop of CROPS) {
    const farm = createFarm({ stock: { [crop.id]: Number.MAX_SAFE_INTEGER - 1 } });
    const latestStart = Number.MAX_SAFE_INTEGER - crop.growSeconds * 1000;
    assert.equal(plantCrop(farm, crop.id, latestStart + 1), false);
    assert.equal(plantCrop(farm, crop.id, latestStart), true);
    assert.equal(farm.plots[crop.id].readyAt, Number.MAX_SAFE_INTEGER);
    assert.deepEqual(harvestCrop(farm, crop.id, Number.MAX_SAFE_INTEGER), { harvested: true, amount: 1 });
    assert.equal(farm.stock[crop.id], Number.MAX_SAFE_INTEGER);
    assert.equal(plantCrop(farm, crop.id, START), true);
    const before = snapshot(farm);
    assert.deepEqual(harvestCrop(farm, crop.id, START + crop.growSeconds * 1000), fail);
    assert.deepEqual(farm, before, 'a full inventory must not consume the ripe plant');
    assert.equal(getCropProgress(farm, crop.id, START + crop.growSeconds * 1000).status, 'ready');
  }
});
