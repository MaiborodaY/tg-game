import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileArmyCapacity } from '../army-capacity-migration.ts';
import { restoreCampaignRoster } from '../campaign-roster.ts';
import { CELL_UNLOCK_COSTS, STARTING_CELLS, createProgression, getArmyCapacity, unlockCell } from '../progression.ts';

const allCells = [...STARTING_CELLS, '4:2', '1:0', '0:0', '1:1', '4:0', '1:2', '0:1', '3:0', '4:1', '3:1', '0:2', '3:2'];
const typeCycle = ['swordsman', 'lancer', 'archer', 'healer'];
const fighterInventory = roster => [...roster.units, ...roster.reserve].map(({ type, level }) => `${type}:${level}`).sort();

function legacySave() {
  return {
    gold: 100,
    progression: { unlockedCells: [...allCells], firstClears: [1, 10, 201, 400] },
    units: allCells.map((key, index) => {
      const [col, row] = key.split(':').map(Number);
      return { id: 100, type: typeCycle[index % typeCycle.length], col, row, level: index === 3 ? 500 : index + 1 };
    }),
    reserve: [{ id: 100, type: 'lancer', level: 101 }, { id: 100, type: 'healer', level: Number.MAX_SAFE_INTEGER }],
  };
}

test('full legacy armies migrate to 9, 10 and 11 slots without losing fighters or personal levels', () => {
  for (const level of [1, 2, 3]) {
    const saved = legacySave();
    const original = structuredClone(saved);
    const progression = createProgression(saved.progression);
    const roster = restoreCampaignRoster(saved.units, saved.reserve, progression);
    const beforeRoster = structuredClone(roster);
    const migration = reconcileArmyCapacity(progression, roster, level);
    const capacity = getArmyCapacity(level);
    assert.equal(progression.unlockedCells.length, capacity);
    assert.equal(migration.units.length, capacity);
    assert.equal(migration.reserve.length, 2 + 15 - capacity);
    assert.equal(migration.movedCount, 15 - capacity);
    assert.equal(migration.removedCells.length, 15 - capacity);
    assert.deepEqual(progression.firstClears, [1, 10, 201, 400]);
    assert.deepEqual(progression.unlockedCells.filter(key => key[0] === '0' || key[0] === '4'),
      ['4:2', '0:0'].slice(0, level - 1), 'retain the earliest purchased side cells');
    assert.deepEqual(fighterInventory(migration), fighterInventory({ units: saved.units, reserve: saved.reserve }));
    assert.equal(new Set([...migration.units, ...migration.reserve].map(unit => unit.id)).size, 17);
    for (const fighter of [...roster.units, ...roster.reserve]) {
      const retained = [...migration.units, ...migration.reserve].find(unit => unit.id === fighter.id);
      assert.equal(retained.type, fighter.type);
      assert.equal(retained.level, fighter.level);
    }
    assert.equal(migration.reserve.every(unit => !Object.hasOwn(unit, 'col') && !Object.hasOwn(unit, 'row')), true);
    assert.deepEqual(roster, beforeRoster, 'migration does not edit the restored source roster');
    assert.deepEqual(saved, original, 'migration leaves the saved recovery source unchanged');
    assert.equal(migration.refund, CELL_UNLOCK_COSTS.slice(capacity - 3).reduce((sum, cost) => sum + cost, 0));
  }
});

test('migration refunds exactly once through repeated calls and a persisted reload', () => {
  for (const level of [1, 2, 3]) {
    const saved = legacySave();
    const progression = createProgression(saved.progression);
    const roster = restoreCampaignRoster(saved.units, saved.reserve, progression);
    const first = reconcileArmyCapacity(progression, roster, level);
    const gold = saved.gold + first.refund;
    const second = reconcileArmyCapacity(progression, first, level);
    assert.deepEqual(second.removedCells, []);
    assert.equal(second.movedCount, 0);
    assert.equal(second.refund, 0);
    assert.deepEqual(fighterInventory(second), fighterInventory(first));
    const checkpoint = JSON.parse(JSON.stringify({ gold, progression, units: first.units, reserve: first.reserve }));
    const restoredProgression = createProgression(checkpoint.progression);
    const restoredRoster = restoreCampaignRoster(checkpoint.units, checkpoint.reserve, restoredProgression);
    const afterReload = reconcileArmyCapacity(restoredProgression, restoredRoster, level);
    assert.equal(checkpoint.gold + afterReload.refund, gold);
    assert.equal(afterReload.refund, 0);
    assert.equal(afterReload.movedCount, 0);
    assert.deepEqual(fighterInventory(afterReload), fighterInventory(first));
    assert.equal(new Set([...afterReload.units, ...afterReload.reserve].map(unit => unit.id)).size, 17);
  }
});

test('migration retains purchased central cells and prices a later repurchase from the remaining count', () => {
  const progression = createProgression({ unlockedCells: ['0:0', '1:0', '4:0'], firstClears: [10] });
  const roster = restoreCampaignRoster([
    { type: 'lancer', level: 120, col: 0, row: 0 },
    { type: 'archer', level: 80, col: 1, row: 0 },
  ], [], progression);
  const migration = reconcileArmyCapacity(progression, roster, 1);
  assert.deepEqual(progression.unlockedCells, [...STARTING_CELLS, '1:0']);
  assert.deepEqual(progression.firstClears, [10]);
  assert.deepEqual(migration.removedCells, ['0:0', '4:0']);
  assert.equal(migration.movedCount, 1, 'empty closed cells still refund their purchase');
  assert.equal(migration.refund, 150);
  assert.equal(CELL_UNLOCK_COSTS.slice(0, 3).reduce((sum, cost) => sum + cost, 0) - migration.refund, 25);
  assert.deepEqual(unlockCell(progression, migration.refund, '4:2', 2), { unlocked: true, gold: 100 });
  assert.equal(reconcileArmyCapacity(progression, migration, 2).refund, 0);
});

test('starter cells and already compliant armies do not trigger migration or refunds', () => {
  for (const level of [1, 2, 3]) {
    const progression = createProgression();
    const migration = reconcileArmyCapacity(progression, { units: [], reserve: [] }, level);
    assert.deepEqual(progression.unlockedCells, [...STARTING_CELLS]);
    assert.deepEqual(migration, { units: [], reserve: [], removedCells: [], refund: 0, movedCount: 0 });
  }
});

test('unsafe runtime rosters are rejected before any slot, fighter or refund changes', () => {
  const invalidRosters = [null, {}, { units: {}, reserve: [] },
    { units: [], reserve: [{ id: 1, type: 'lancer', level: Number.MAX_SAFE_INTEGER + 1 }] },
    { units: [], reserve: [{ id: 1, type: 'constructor', level: 1 }] },
    { units: [], reserve: [{ id: 1, type: 'lancer', level: 1 }, { id: 1, type: 'archer', level: 1 }] },
    { units: [{ id: 1, type: 'lancer', level: 1, col: 3, row: 2 }], reserve: [] },
    { units: [{ id: 1, type: 'lancer', level: 1, col: '0', row: 0 }], reserve: [] }];
  for (const roster of invalidRosters) {
    const progression = createProgression({ unlockedCells: ['0:0'] });
    const before = structuredClone({ progression, roster });
    assert.throws(() => reconcileArmyCapacity(progression, roster), TypeError);
    assert.deepEqual({ progression, roster }, before);
  }
  for (const progression of [null, {}, { unlockedCells: [] }, { unlockedCells: [...STARTING_CELLS, '0:0', '0:0'] }]) {
    const before = structuredClone(progression);
    assert.throws(() => reconcileArmyCapacity(progression, { units: [], reserve: [] }), TypeError);
    assert.deepEqual(progression, before);
  }
});
