import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS, FARM_LEVELS, createFarm, getCropProgress, getFarmUpgrade, harvestCrop, upgradeFarm } from '../farm.ts';

const START = 1_800_000_000_000;
const fresh = () => createFarm(undefined, START);
const fail = { harvested: false, amount: 0 };
const progress = (farm, crop, elapsed) => getCropProgress(farm, crop, START + elapsed);
function levelThree() {
  const farm = fresh();
  assert.equal(upgradeFarm(farm, 2000, START).gold, 1500);
  assert.equal(upgradeFarm(farm, 1500, START).gold, 0);
  return farm;
}
function unchanged(farm, action) {
  const before = structuredClone(farm);
  action();
  assert.deepEqual(farm, before);
}

test('a new farm grows only carrots automatically, with independent inventory and no planting action', () => {
  const farm = fresh();
  assert.equal(farm.level, 1);
  assert.equal(progress(farm, 'carrot', 0).status, 'growing');
  for (const id of ['potato', 'pumpkin']) {
    assert.equal(progress(farm, id, 1e9).status, 'locked');
    assert.deepEqual(harvestCrop(farm, id, START + 1e9), fail);
  }
  assert.deepEqual(farm.stock, { carrot: 0, potato: 0, pumpkin: 0 });
  harvestCrop(farm, 'carrot', START + 300_000);
  assert.equal(fresh().stock.carrot, 0);
  assert.ok(Object.isFrozen(CROPS) && CROPS.every(Object.isFrozen));
  assert.ok(Object.isFrozen(FARM_LEVELS) && Object.values(FARM_LEVELS).every(Object.isFrozen));
});

test('all crops follow their exact real-time schedule and collection restarts without planting', () => {
  assert.deepEqual(CROPS.map(crop => crop.growSeconds), [300, 900, 1800]);
  for (const { id, growSeconds } of CROPS) {
    const farm = levelThree(), duration = growSeconds * 1000;
    unchanged(farm, () => {
      assert.equal(progress(farm, id, duration - 1).available, 0);
      assert.equal(progress(farm, id, duration - 1).remainingSeconds, 1);
      assert.deepEqual(harvestCrop(farm, id, START + duration - 1), fail);
      assert.equal(progress(farm, id, duration).available, 1);
      assert.equal(progress(farm, id, duration).remainingSeconds, growSeconds);
    });
    assert.deepEqual(harvestCrop(farm, id, START + duration), { harvested: true, amount: 1 });
    assert.equal(farm.stock[id], 1);
    assert.equal(progress(farm, id, duration).status, 'growing');
    unchanged(farm, () => assert.deepEqual(harvestCrop(farm, id, START + duration), fail));
    assert.deepEqual(harvestCrop(farm, id, START + duration * 2), { harvested: true, amount: 1 });
    assert.equal(farm.stock[id], 2);
  }
});

test('collection takes all ripe crops and preserves fractional progress until the cap', () => {
  const farm = fresh();
  const time = START + 3 * 300_000 + 120_000;
  assert.deepEqual(harvestCrop(farm, 'carrot', time), { harvested: true, amount: 3 });
  assert.equal(getCropProgress(farm, 'carrot', time).remainingSeconds, 180);
  assert.equal(farm.stock.carrot, 3);
  assert.deepEqual(harvestCrop(farm, 'carrot', START + 4 * 300_000), { harvested: true, amount: 1 });
  assert.equal(farm.stock.carrot, 4);
});

test('offline growth stops at each level cap; collecting a full bed discards overflow time', () => {
  for (const level of [1, 2, 3]) {
    const farm = fresh();
    while (farm.level < level) upgradeFarm(farm, 2000, START);
    const capacity = level * 10, later = START + 30 * 24 * 3600_000;
    const saved = structuredClone(farm), restored = createFarm(saved, later);
    assert.deepEqual(restored, farm);
    assert.notEqual(restored.plots.carrot, farm.plots.carrot);
    for (const crop of CROPS.filter(crop => crop.unlockLevel <= level)) {
      assert.equal(getCropProgress(restored, crop.id, later).status, 'full');
      assert.equal(getCropProgress(restored, crop.id, later).available, capacity);
      assert.equal(restored.stock[crop.id], 0);
      assert.deepEqual(harvestCrop(restored, crop.id, later), { harvested: true, amount: capacity });
      assert.equal(getCropProgress(restored, crop.id, later).remainingSeconds, crop.growSeconds);
      assert.equal(getCropProgress(restored, crop.id, later + crop.growSeconds * 1000 - 1).available, 0);
      assert.equal(getCropProgress(restored, crop.id, later + crop.growSeconds * 1000).available, 1);
    }
    assert.deepEqual(saved, farm, 'restoration owns its records');
    const reloaded = createFarm(structuredClone(restored), later);
    assert.deepEqual(reloaded, restored);
    unchanged(reloaded, () => assert.deepEqual(harvestCrop(reloaded, 'carrot', later), fail));
  }
});

test('upgrades cost 500 and 1500 gold, unlock only the next crop and grow every bed capacity', () => {
  const farm = fresh();
  farm.stock.carrot = 42;
  assert.deepEqual(getFarmUpgrade(farm), { nextLevel: 2, cost: 500, capacity: 10, nextCapacity: 20, crop: CROPS[1] });
  assert.deepEqual(upgradeFarm(farm, 499, START), { ok: false, reason: 'insufficient-gold' });
  assert.deepEqual(upgradeFarm(farm, 2000, START), { ok: true, gold: 1500, cost: 500, level: 2 });
  assert.equal(progress(farm, 'potato', 0).status, 'growing');
  assert.equal(progress(farm, 'pumpkin', 0).status, 'locked');
  assert.deepEqual(upgradeFarm(farm, 1500, START), { ok: true, gold: 0, cost: 1500, level: 3 });
  assert.equal(progress(farm, 'pumpkin', 0).status, 'growing');
  assert.equal(farm.stock.carrot, 42, 'inventory is not limited by bed capacity');
  assert.equal(getFarmUpgrade(farm), null);
  unchanged(farm, () => assert.deepEqual(upgradeFarm(farm, 10000, START), { ok: false, reason: 'max-level' }));
});

test('upgrading full beds keeps crops but does not retroactively fill new capacity', () => {
  const farm = fresh(), later = START + 10 * 24 * 3600_000;
  upgradeFarm(farm, 500, later);
  assert.equal(getCropProgress(farm, 'carrot', later).available, 10);
  assert.equal(getCropProgress(farm, 'carrot', later).remainingSeconds, 300);
  assert.equal(getCropProgress(farm, 'potato', later).available, 0);
  assert.equal(getCropProgress(farm, 'carrot', later + 300_000).available, 11);
  const muchLater = later + 10 * 24 * 3600_000;
  upgradeFarm(farm, 1500, muchLater);
  for (const id of ['carrot', 'potato']) assert.equal(getCropProgress(farm, id, muchLater).available, 20);
  assert.equal(getCropProgress(farm, 'pumpkin', muchLater).available, 0);
});

test('upgrading a growing bed preserves its fractional progress and starts the new crop now', () => {
  const farm = fresh();
  upgradeFarm(farm, 500, START + 450_000);
  assert.equal(progress(farm, 'carrot', 450_000).available, 1);
  assert.equal(progress(farm, 'carrot', 450_000).remainingSeconds, 150);
  assert.equal(progress(farm, 'potato', 450_000).remainingSeconds, 900);
  const other = structuredClone(farm.plots.potato);
  harvestCrop(farm, 'carrot', START + 450_000);
  assert.deepEqual(farm.plots.potato, other);
});

test('legacy migration retains stocks and one ripe carrot, compensates other planted beds once', () => {
  const old = { plots: {
    carrot: { plantedAt: START - 1e9, readyAt: START - 1e9 + 300_000 },
    potato: { plantedAt: START - 10_000, readyAt: START - 10_000 + 900_000 },
    pumpkin: { plantedAt: START - 1e9, readyAt: START - 1e9 + 1800_000 },
  }, stock: { carrot: 12, potato: 6, pumpkin: 4 } };
  const original = structuredClone(old), farm = createFarm(old, START);
  assert.equal(farm.level, 1);
  assert.equal(progress(farm, 'carrot', 0).available, 1);
  assert.deepEqual(farm.stock, { carrot: 12, potato: 7, pumpkin: 5 });
  assert.equal(farm.plots.potato, null);
  assert.equal(farm.plots.pumpkin, null);
  assert.deepEqual(createFarm(farm, START), farm, 'migration compensation is idempotent');
  assert.deepEqual(old, original);
  old.plots.carrot = { plantedAt: START - 60_000, readyAt: START + 240_000 };
  assert.equal(progress(createFarm(old, START), 'carrot', 0).remainingSeconds, 240);
});

test('display frequency and clock rollback cannot add stock or repeat a collection', () => {
  const farm = fresh();
  unchanged(farm, () => {
    for (let reads = 0; reads < 120; reads++) assert.equal(progress(farm, 'carrot', 150_000).remainingSeconds, 150);
    assert.equal(progress(farm, 'carrot', -100_000).available, 0);
    assert.equal(progress(farm, 'carrot', -100_000).remainingSeconds, 300);
    assert.deepEqual(harvestCrop(farm, 'carrot', START - 100_000), fail);
  });
  harvestCrop(farm, 'carrot', START + 300_000);
  unchanged(farm, () => assert.deepEqual(harvestCrop(farm, 'carrot', START), fail));
  assert.equal(progress(farm, 'carrot', 600_000).available, 1);
});

test('normalization rejects invalid levels, clocks, inherited fields and inventory without coercion', () => {
  for (const source of [undefined, null, false, true, 0, 'farm', [], { plots: [], stock: '3' }]) {
    assert.deepEqual(createFarm(source, START), fresh());
  }
  for (const value of [-1, .5, '3', null, false, {}, [], NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(createFarm({ stock: { carrot: value } }, START).stock.carrot, 0);
    assert.equal(createFarm({ version: 2, level: value }, START).level, 1);
  }
  for (const plot of [{ plantedAt: START }, { readyAt: START + 300_000 },
    { plantedAt: 0, readyAt: 300_000 }, { plantedAt: '1800000000000', readyAt: START + 300_000 },
    { plantedAt: START, readyAt: START + 299_999 }, { plantedAt: START, readyAt: String(START + 300_000) },
    { plantedAt: Number.MAX_SAFE_INTEGER, readyAt: Number.MAX_SAFE_INTEGER }]) {
    assert.deepEqual(createFarm({ plots: { carrot: plot } }, START).plots.carrot, fresh().plots.carrot);
  }
  assert.deepEqual(createFarm(Object.create(fresh()), START), fresh());
});

test('invalid action inputs, locked crops and insufficient funds leave all farm data unchanged', () => {
  const farm = fresh();
  for (const now of [0, -1, .5, '1800000000000', NaN, Infinity, null, Number.MAX_SAFE_INTEGER]) {
    unchanged(farm, () => {
      assert.deepEqual(harvestCrop(farm, 'carrot', now), fail);
      assert.equal(upgradeFarm(farm, 2000, now).ok, false);
      assert.throws(() => getCropProgress(farm, 'carrot', now), RangeError);
      assert.throws(() => createFarm(undefined, now), RangeError);
    });
  }
  for (const id of ['bean', 'constructor', '__proto__', null, undefined, 0]) {
    unchanged(farm, () => {
      assert.deepEqual(harvestCrop(farm, id, START), fail);
      assert.throws(() => getCropProgress(farm, id, START), RangeError);
    });
  }
  for (const gold of [0, 499, -1, .5, '2000', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    unchanged(farm, () => assert.equal(upgradeFarm(farm, gold, START).ok, false));
  }
  for (const invalid of [null, {}, { plots: {}, stock: {} }, { ...farm, stock: { ...farm.stock, carrot: -1 } }]) {
    unchanged(invalid, () => {
      assert.deepEqual(harvestCrop(invalid, 'carrot', START), fail);
      assert.equal(upgradeFarm(invalid, 2000, START).ok, false);
      assert.throws(() => getCropProgress(invalid, 'carrot', START), TypeError);
    });
  }
});

test('integer overflow refuses collection without consuming produce or partially adding inventory', () => {
  for (const crop of CROPS) {
    const farm = levelThree(), time = START + 2 * crop.growSeconds * 1000;
    farm.stock[crop.id] = Number.MAX_SAFE_INTEGER - 1;
    unchanged(farm, () => assert.deepEqual(harvestCrop(farm, crop.id, time), fail));
    farm.stock[crop.id] -= 1;
    assert.deepEqual(harvestCrop(farm, crop.id, time), { harvested: true, amount: 2 });
    assert.equal(farm.stock[crop.id], Number.MAX_SAFE_INTEGER);
  }
});
