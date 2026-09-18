import assert from 'node:assert/strict';
import test from 'node:test';
import { CELL_UNLOCK_COSTS, STARTING_CELLS, claimFirstClear, createProgression, migrateCampaignSave, nextCellCost, unlockCell } from '../progression.ts';

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

test('unlocking rejects invalid purchases and spends each price exactly once until the grid is full', () => {
  const progression = createProgression();
  for (const [gold, key] of [[24, '0:0'], [-1, '0:0'], [Infinity, '0:0'], [NaN, '0:0'], ['100', '0:0'], [100, '2:0'], [100, '5:0']]) {
    assert.deepEqual(unlockCell(progression, gold, key), { unlocked: false, gold });
    assert.deepEqual(progression.unlockedCells, [...STARTING_CELLS]);
  }
  let gold = 20000, purchase = 0;
  for (let col = 0; col < 5; col++) for (let row = 0; row < 3; row++) {
    const key = `${col}:${row}`;
    if (progression.unlockedCells.includes(key)) continue;
    assert.equal(nextCellCost(progression), CELL_UNLOCK_COSTS[purchase]);
    const result = unlockCell(progression, gold, key);
    assert.deepEqual(result, { unlocked: true, gold: gold - CELL_UNLOCK_COSTS[purchase++] });
    gold = result.gold;
    assert.deepEqual(unlockCell(progression, gold, key), { unlocked: false, gold });
  }
  assert.equal(progression.unlockedCells.length, 15);
  assert.equal(nextCellCost(progression), null);
  assert.equal(gold, 20000 - CELL_UNLOCK_COSTS.reduce((sum, cost) => sum + cost, 0));
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
