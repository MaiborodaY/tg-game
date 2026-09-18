import assert from 'node:assert/strict';
import test from 'node:test';
import { CELL_UNLOCK_COSTS, STARTING_CELLS, claimFirstClear, createProgression, getArmyCapacity, getCellAvailability,
  migrateCampaignSave, nextCellCost, unlockCell } from '../progression.ts';

test('legacy campaign migration retains the next biome and one-time reward claims', () => {
  for (const [before, after] of [[0, 0], [9, 9], [10, 200], [11, 201], [20, 210], ['13.9', 203], [100, 210], [-3, 0], ['bad', 0]]) {
    const saved = { campaignVersion: 1, clearedWaves: before,
      progression: { unlockedCells: ['2:0', '0:1'], firstClears: [1, 10, 11, 20, 11, 0, 21, '2', null] },
      hero: { xp: 300 }, barracks: { level: 2 }, extra: { retain: true } };
    const original = structuredClone(saved);
    const migrated = migrateCampaignSave(saved);
    assert.equal(migrated.clearedWaves, after);
    assert.equal(migrated.campaignVersion, 3);
    assert.deepEqual(migrated.progression.firstClears, [1, 10, 201, 210]);
    assert.deepEqual(migrated.progression.unlockedCells, saved.progression.unlockedCells);
    assert.strictEqual(migrated.hero, saved.hero);
    assert.strictEqual(migrated.barracks, saved.barracks);
    assert.strictEqual(migrated.extra, saved.extra);
    assert.deepEqual(saved, original, 'migration must not mutate the recovery source');
    const loaded = createProgression(migrated.progression);
    assert.equal(claimFirstClear(loaded, 201), 0, 'migrated first-clear bonus cannot repeat');
    assert.equal(claimFirstClear(loaded, 202), 20);
  }
});

test('current and future campaign records pass through without claiming full validation', () => {
  for (const campaignVersion of [3, 4, '3']) {
    const saved = { campaignVersion, clearedWaves: 230, gold: 'invalid', hero: { xp: 400 } };
    assert.strictEqual(migrateCampaignSave(saved), saved);
  }
  for (const saved of [undefined, null, false, 3, 'legacy', []]) {
    assert.equal(migrateCampaignSave(saved), null);
  }
});

test('partially malformed legacy saves retain spread fields while normalizing playable progression', () => {
  for (const previous of [null, undefined, 'legacy', [4, 5], { firstClears: 'invalid', custom: 9 }]) {
    const migrated = migrateCampaignSave({ campaignVersion: 1, progression: previous });
    assert.deepEqual(migrated.progression, { ...previous, firstClears: [] });
    assert.deepEqual(createProgression(migrated.progression), { unlockedCells: [...STARTING_CELLS], firstClears: [] });
  }
});

test('loading progression filters invalid entries, deduplicates them and creates independent state', () => {
  const saved = { unlockedCells: ['2:0', '0:1', '0:1', '4:2', '5:0', '2:3', 1, null],
    firstClears: [1, 10, 201, 400, 400, 0, 401, 1.5, '2', null, NaN, Infinity] };
  const loaded = createProgression(saved);
  assert.deepEqual(loaded, { unlockedCells: ['2:0', '2:1', '2:2', '0:1', '4:2'], firstClears: [1, 10, 201, 400] });
  loaded.unlockedCells.push('1:1');
  loaded.firstClears.push(2);
  assert.equal(saved.unlockedCells.includes('1:1'), false);
  assert.equal(saved.firstClears.includes(2), false);
  for (const malformed of [null, undefined, false, 5, 'old', [], { unlockedCells: {}, firstClears: 'all' }]) {
    assert.deepEqual(createProgression(malformed), { unlockedCells: [...STARTING_CELLS], firstClears: [] });
  }
});

test('unlocking rejects invalid purchases without changing progression or gold', () => {
  const progression = createProgression();
  for (const [gold, key] of [[24, '1:0'], [-1, '1:0'], [Infinity, '1:0'], [NaN, '1:0'], ['100', '1:0'], [100, '2:0'], [100, '5:0'], [100, '0:0']]) {
    assert.deepEqual(unlockCell(progression, gold, key), { unlocked: false, gold });
    assert.deepEqual(progression.unlockedCells, [...STARTING_CELLS]);
  }
});

test('barracks capacities include the three starter cells and preserve the existing purchase prices', () => {
  for (const [level, capacity] of [[1, 8], [2, 9], [3, 10], [4, 11]]) {
    const progression = createProgression();
    assert.equal(getArmyCapacity(level), capacity);
    let gold = 20000;
    const purchases = ['1:0', '3:0', '1:1', '3:1', '1:2', '3:2', '0:2', '4:0'].slice(0, capacity - 3);
    for (const [index, key] of purchases.entries()) {
      const cost = CELL_UNLOCK_COSTS[index];
      assert.equal(nextCellCost(progression, level), cost);
      assert.deepEqual(getCellAvailability(progression, key, level), {
        allowed: true, cost, requiredBarracksLevel: null, reason: 'available',
      });
      assert.deepEqual(unlockCell(progression, gold, key, level), { unlocked: true, gold: gold - cost });
      gold -= cost;
      assert.deepEqual(unlockCell(progression, gold, key, level), { unlocked: false, gold });
    }
    assert.equal(progression.unlockedCells.length, capacity);
    assert.equal(nextCellCost(progression, level), null);
    assert.equal(gold, 20000 - CELL_UNLOCK_COSTS.slice(0, capacity - 3).reduce((sum, cost) => sum + cost, 0));
    const blocked = getCellAvailability(progression, '0:0', level);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.requiredBarracksLevel, level < 3 ? 3 : level === 3 ? 4 : null);
    assert.equal(blocked.reason, level < 4 ? 'barracks-required' : 'max-capacity');
    assert.deepEqual(unlockCell(progression, gold, '0:0', level), { unlocked: false, gold });
  }
});

test('side-cell quotas apply before the central formation is full and allow either side', () => {
  for (const firstSide of ['0:0', '4:0']) {
    const progression = createProgression();
    const otherSide = firstSide === '0:0' ? '4:0' : '0:0';
    for (const level of [1, 2]) {
      assert.deepEqual(getCellAvailability(progression, firstSide, level), {
        allowed: false, cost: null, requiredBarracksLevel: 3, reason: 'barracks-required',
      });
      assert.equal(unlockCell(progression, 100, firstSide, level).unlocked, false);
    }
    assert.equal(unlockCell(progression, 100, firstSide, 3).unlocked, true);
    assert.equal(progression.unlockedCells.length, 4);
    assert.deepEqual(getCellAvailability(progression, otherSide, 3), {
      allowed: false, cost: null, requiredBarracksLevel: 4, reason: 'barracks-required',
    });
    assert.equal(unlockCell(progression, 100, otherSide, 3).unlocked, false);
    assert.equal(getCellAvailability(progression, '4:2', 3).requiredBarracksLevel, 4);
    assert.equal(unlockCell(progression, 100, '4:2', 3).unlocked, false);
    assert.equal(getCellAvailability(progression, '1:0', 3).allowed, true);
  }
});

test('any last central cell waits for Barracks II, and the same price ladder continues at III and IV', () => {
  const centralPurchases = ['1:0', '3:0', '1:1', '3:1', '1:2', '3:2'];
  for (const lastCell of centralPurchases) {
    const progression = createProgression();
    for (const cell of centralPurchases.filter(cell => cell !== lastCell)) {
      assert.equal(unlockCell(progression, 20000, cell, 1).unlocked, true);
    }
    assert.equal(progression.unlockedCells.length, 8);
    assert.deepEqual(getCellAvailability(progression, lastCell, 1), {
      allowed: false, cost: null, requiredBarracksLevel: 2, reason: 'barracks-required',
    });
    const before = structuredClone(progression);
    assert.deepEqual(unlockCell(progression, 20000, lastCell, 1), { unlocked: false, gold: 20000 });
    assert.deepEqual(progression, before);
    assert.equal(nextCellCost(progression, 2), 400);
    assert.deepEqual(unlockCell(progression, 400, lastCell, 2), { unlocked: true, gold: 0 });
    assert.equal(progression.unlockedCells.length, 9);
    assert.equal(getCellAvailability(progression, '4:1', 2).requiredBarracksLevel, 3);
    assert.equal(nextCellCost(progression, 3), 550);
    assert.deepEqual(unlockCell(progression, 550, '4:1', 3), { unlocked: true, gold: 0 });
    assert.equal(progression.unlockedCells.length, 10);
    assert.equal(getCellAvailability(progression, '0:1', 3).requiredBarracksLevel, 4);
    assert.equal(nextCellCost(progression, 4), 750);
    const beforeFourth = structuredClone(progression);
    assert.deepEqual(unlockCell(progression, 749, '0:1', 4), { unlocked: false, gold: 749 });
    assert.deepEqual(progression, beforeFourth);
    assert.deepEqual(unlockCell(progression, 750, '0:1', 4), { unlocked: true, gold: 0 });
    assert.equal(progression.unlockedCells.length, 11);
    assert.equal(nextCellCost(progression, 4), null);
    assert.equal(getCellAvailability(progression, '0:0', 4).reason, 'max-capacity');
  }
});

test('tier increases grant purchase permission without granting or charging for cells', () => {
  const progression = createProgression();
  const before = structuredClone(progression);
  assert.equal(getCellAvailability(progression, '4:2', 2).cost, null);
  assert.equal(getCellAvailability(progression, '4:2', 3).cost, 25);
  assert.equal(getCellAvailability(progression, '0:2', 3).cost, 25);
  assert.deepEqual(progression, before);
  assert.equal(unlockCell(progression, 24, '4:2', 3).unlocked, false);
  assert.deepEqual(progression, before);
  assert.equal(getCellAvailability(progression, '2:0').reason, 'unlocked');
  assert.equal(getCellAvailability(progression, '5:0').reason, 'invalid-cell');
});

test('invalid tiers fail closed and malformed runtime cells cannot be purchased', () => {
  for (const level of [0, -1, 5, 1.5, '2', '3', '4', NaN, Infinity, null]) {
    assert.equal(getArmyCapacity(level), 8);
    assert.equal(unlockCell(createProgression(), 100, '0:0', level).unlocked, false);
  }
  for (const progression of [null, {}, { unlockedCells: [] }, { unlockedCells: [...STARTING_CELLS, '5:0'] },
    { unlockedCells: [...STARTING_CELLS, '1:0', '1:0'] }]) {
    const before = structuredClone(progression);
    assert.equal(getCellAvailability(progression, '3:0').reason, 'invalid-state');
    assert.deepEqual(unlockCell(progression, 100, '3:0'), { unlocked: false, gold: 100 });
    assert.equal(nextCellCost(progression), null);
    assert.deepEqual(progression, before);
  }
});

test('Barracks IV permits exactly two chosen side cells even before buying the full central formation', () => {
  for (const sides of [['0:0', '4:0'], ['0:0', '0:2'], ['4:1', '4:2']]) {
    const progression = createProgression({ unlockedCells: [sides[0]] });
    const before = structuredClone(progression);
    assert.equal(getCellAvailability(progression, sides[1], 3).requiredBarracksLevel, 4);
    assert.equal(getCellAvailability(progression, sides[1], 4).cost, 50);
    assert.deepEqual(progression, before, 'tier increases do not grant the cell for free');
    assert.deepEqual(unlockCell(progression, 50, sides[1], 4), { unlocked: true, gold: 0 });
    assert.equal(progression.unlockedCells.length, 5);
    for (const key of ['0:0', '0:1', '0:2', '4:0', '4:1', '4:2'].filter(key => !sides.includes(key))) {
      assert.deepEqual(getCellAvailability(progression, key, 4), {
        allowed: false, cost: null, requiredBarracksLevel: null, reason: 'max-capacity',
      });
      assert.equal(unlockCell(progression, 10000, key, 4).unlocked, false);
    }
    assert.equal(getCellAvailability(progression, '1:0', 4).allowed, true, 'side quota does not block central purchases');
  }
});

test('first-clear rewards reject invalid waves and cannot be repeated after saving and loading', () => {
  const progression = createProgression();
  for (const wave of [0, -1, 401, 1.5, '10', null, NaN, Infinity]) assert.equal(claimFirstClear(progression, wave), 0);
  assert.deepEqual(progression.firstClears, []);
  assert.equal(claimFirstClear(progression, 400), 100);
  const reloaded = createProgression(JSON.parse(JSON.stringify(progression)));
  assert.equal(claimFirstClear(reloaded, 400), 0);
  assert.equal(claimFirstClear(reloaded, 201), 10);
});
