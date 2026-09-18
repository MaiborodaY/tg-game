import assert from 'node:assert/strict';
import test from 'node:test';
import { createCapitol, capitolUpgradeCost, upgradeCapitol, getCapitolStats } from '../capitol.ts';

test('old profiles keep the 100HP castle and no tower until it is purchased', () => {
  assert.deepEqual(createCapitol(), { health: 0, tower: 0 });
  assert.deepEqual(getCapitolStats(), { hp: 100, damage: 0, interval: 2, range: 144, towerLevel: 0 });
  assert.deepEqual(getCapitolStats(createCapitol()), getCapitolStats());
  assert.equal(capitolUpgradeCost(createCapitol(), 'health'), 50);
  assert.equal(capitolUpgradeCost(createCapitol(), 'tower'), 100);
});

test('Capitol restoration retains valid own ranks and independently normalizes malformed save fields', () => {
  const empty = { health: 0, tower: 0 };
  for (const source of [undefined, null, false, true, 0, '5', [], NaN, Object.create({ health: 5, tower: 3 })]) {
    assert.deepEqual(createCapitol(source), empty);
  }
  for (const invalid of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null, false, {}, []]) {
    assert.deepEqual(createCapitol({ health: invalid, tower: 3 }), { health: 0, tower: 3 });
    assert.deepEqual(createCapitol({ health: 5, tower: invalid }), { health: 5, tower: 0 });
  }
  const source = Object.freeze({ health: 7, tower: 6, removedUpgrade: 99 });
  const restored = createCapitol(source);
  assert.deepEqual(restored, { health: 7, tower: 6 });
  assert.notEqual(restored, source);
  assert.deepEqual(createCapitol(JSON.parse(JSON.stringify(restored))), restored);
  assert.deepEqual(createCapitol(Object.assign(Object.create({ tower: 9 }), { health: 4 })), { health: 4, tower: 0 });
});

test('health buys add 20HP each with a separate 50,75,100 gold ladder', () => {
  const capitol = createCapitol();
  let gold = 5000;
  for (let rank = 0; rank < 10; rank++) {
    const cost = 50 + 25 * rank;
    assert.equal(capitolUpgradeCost(capitol, 'health'), cost);
    assert.deepEqual(upgradeCapitol(capitol, 'health', gold), { upgraded: true, gold: gold - cost });
    gold -= cost;
    assert.deepEqual(capitol, { health: rank + 1, tower: 0 });
    assert.equal(getCapitolStats(capitol).hp, 100 + 20 * (rank + 1));
    assert.equal(capitolUpgradeCost(capitol, 'tower'), 100);
  }
});

test('tower construction costs 100 then damage buys add 2 on an independent 50,75,100 ladder', () => {
  const capitol = createCapitol({ health: 3 });
  assert.deepEqual(upgradeCapitol(capitol, 'tower', 100), { upgraded: true, gold: 0 });
  assert.deepEqual(getCapitolStats(capitol), { hp: 160, damage: 10, interval: 2, range: 144, towerLevel: 1 });
  for (let rank = 1; rank <= 10; rank++) {
    const cost = 50 + 25 * (rank - 1);
    assert.equal(capitolUpgradeCost(capitol, 'tower'), cost);
    assert.deepEqual(upgradeCapitol(capitol, 'tower', cost), { upgraded: true, gold: 0 });
    assert.deepEqual(capitol, { health: 3, tower: rank + 1 });
    assert.deepEqual(getCapitolStats(capitol), { hp: 160, damage: 10 + 2 * rank, interval: 2, range: 144, towerLevel: rank + 1 });
    assert.equal(capitolUpgradeCost(capitol, 'health'), 125);
  }
});

test('invalid or unaffordable purchases leave both currency and Capitol unchanged', () => {
  for (const [id, cost] of [['health', 50], ['tower', 100]]) {
    for (const gold of [-1, 0, cost - 1, cost + .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, String(cost), null]) {
      const capitol = createCapitol();
      assert.deepEqual(upgradeCapitol(capitol, id, gold), { upgraded: false, gold });
      assert.deepEqual(capitol, createCapitol());
    }
  }
  for (const id of ['constructor', '__proto__', 'attack', 'army', undefined, null, 1]) {
    const capitol = createCapitol();
    assert.equal(capitolUpgradeCost(capitol, id), null);
    assert.deepEqual(upgradeCapitol(capitol, id, 100), { upgraded: false, gold: 100 });
    assert.deepEqual(capitol, createCapitol());
  }
  for (const state of [null, undefined, {}, [], { health: 0 }, { health: -1, tower: 1 }, { health: 0, tower: Infinity }]) {
    const before = structuredClone(state);
    assert.equal(capitolUpgradeCost(state, 'health'), null);
    assert.deepEqual(upgradeCapitol(state, 'tower', 1000), { upgraded: false, gold: 1000 });
    assert.deepEqual(state, before);
  }
  const inherited = Object.create({ health: 0, tower: 0 });
  assert.equal(capitolUpgradeCost(inherited, 'tower'), null);
});

test('upgrades continue past common gameplay caps and return detached combat snapshots', () => {
  const capitol = createCapitol({ health: 1000, tower: 1000 });
  const oldStats = getCapitolStats(capitol);
  const snapshot = structuredClone(oldStats);
  for (const id of ['health', 'tower']) {
    const cost = capitolUpgradeCost(capitol, id);
    assert.equal(upgradeCapitol(capitol, id, cost).upgraded, true);
    assert.equal(capitol[id], 1001);
  }
  assert.deepEqual(oldStats, snapshot, 'saved building upgrades cannot alter a running battle snapshot');
  assert.equal(getCapitolStats(capitol).hp, snapshot.hp + 20);
  assert.equal(getCapitolStats(capitol).damage, snapshot.damage + 2);
  oldStats.hp = 0;
  assert.equal(capitol.health, 1001, 'changing returned stats cannot modify progression');
});

test('numeric limits reject unsafe prices without wrapping ranks or generating infinite combat stats', () => {
  const finalPricedHealthRank = Math.floor((Number.MAX_SAFE_INTEGER - 50) / 25);
  for (const [id, rank] of [['health', finalPricedHealthRank], ['tower', finalPricedHealthRank + 1]]) {
    const capitol = createCapitol({ [id]: rank });
    const cost = capitolUpgradeCost(capitol, id);
    assert.ok(Number.isSafeInteger(cost) && cost > 0);
    assert.equal(upgradeCapitol(capitol, id, Number.MAX_SAFE_INTEGER).upgraded, true);
    assert.equal(capitol[id], rank + 1);
    assert.equal(capitolUpgradeCost(capitol, id), null);
    const before = structuredClone(capitol);
    assert.deepEqual(upgradeCapitol(capitol, id, Number.MAX_SAFE_INTEGER), { upgraded: false, gold: Number.MAX_SAFE_INTEGER });
    assert.deepEqual(capitol, before);
  }
  const maximum = createCapitol({ health: Number.MAX_SAFE_INTEGER, tower: Number.MAX_SAFE_INTEGER });
  assert.equal(maximum.health, Number.MAX_SAFE_INTEGER);
  assert.equal(maximum.tower, Number.MAX_SAFE_INTEGER);
  for (const value of Object.values(getCapitolStats(maximum))) assert.ok(Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER);
  assert.equal(capitolUpgradeCost(maximum, 'health'), null);
  assert.equal(capitolUpgradeCost(maximum, 'tower'), null);
  assert.deepEqual(getCapitolStats({ health: Infinity, tower: NaN }), getCapitolStats());
});
