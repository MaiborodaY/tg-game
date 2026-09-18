import assert from 'node:assert/strict';
import test from 'node:test';
import { FIELD, positionForCell } from '../field.ts';
import { UNIT_TYPES } from '../units.ts';
import { canPlaceUnit, getUnitAtCell, getUnitCells, getUnitCellWidth, getUnitPosition,
  planFormationMove, reconcileUnitFootprints } from '../unit-footprint.ts';

const allCells = Array.from({ length: FIELD.rows }, (_, row) =>
  Array.from({ length: FIELD.columns }, (_, col) => `${col}:${row}`)).flat();
const fighter = (id, type, col, row = 0, level = 1) => ({ id, type, col, row, level });
const rider = (id, col, row = 0, level = 1) => fighter(id, 'pantherRider', col, row, level);
const footman = (id, col, row = 0, level = 1) => fighter(id, 'swordsman', col, row, level);

test('mounted fighters take two horizontal cells and edge footprints are never clipped', () => {
  for (const { id: type } of UNIT_TYPES) {
    const width = ['pantherRider', 'unicorn'].includes(type) ? 2 : 1;
    assert.equal(getUnitCellWidth(type), width);
    assert.deepEqual(getUnitCells({ type, col: 2, row: 1 }), width === 2 ? ['2:1', '3:1'] : ['2:1']);
  }
  assert.deepEqual(getUnitCells(rider(1, 4, 2)), ['4:2', '5:2']);
  assert.deepEqual(getUnitCells(rider(1, -1)), ['-1:0', '0:0']);
});

test('either rider cell selects the same unit and the visual position centers its footprint', () => {
  const mounted = rider(1, 1, 1);
  const army = [mounted, footman(2, 3, 1)];
  assert.strictEqual(getUnitAtCell(army, 1, 1), mounted);
  assert.strictEqual(getUnitAtCell(army, 2, 1), mounted);
  assert.strictEqual(getUnitAtCell(army, 3, 1), army[1]);
  for (const [col, row] of [[0, 1], [1, 0], [5, 1], [1.5, 1], [1, 3]]) {
    assert.equal(getUnitAtCell(army, col, row), undefined);
  }
  assert.deepEqual(getUnitPosition(army[1]), positionForCell(3, 1));
  assert.deepEqual(getUnitPosition(mounted), { x: positionForCell(1, 1).x + FIELD.cellWidth / 2,
    y: positionForCell(1, 1).y });
});

test('placement requires both owned cells, integer bounds and a known unit type', () => {
  assert.equal(canPlaceUnit(rider(1, 3, 2), [], allCells), true);
  assert.equal(canPlaceUnit(footman(1, 4, 2), [], allCells), true);
  for (const cell of ['1:1', '2:1']) {
    assert.equal(canPlaceUnit(rider(1, 1, 1), [], allCells.filter(owned => owned !== cell)), false);
  }
  for (const [col, row] of [[4, 0], [-1, 0], [0, -1], [0, 3], [.5, 0], [0, .5], [NaN, 0], [Infinity, 0], ['1', 0]]) {
    assert.equal(canPlaceUnit(rider(1, col, row), [], allCells), false, `${col}:${row}`);
  }
  assert.equal(canPlaceUnit({ type: 'missing', col: 0, row: 0 }, [], allCells), false);
  assert.equal(canPlaceUnit({ type: 'toString', col: 0, row: 0 }, [], allCells), false);
});

test('placement detects either occupied cell and ignores only explicitly identified units', () => {
  const mounted = rider(1, 1);
  assert.equal(canPlaceUnit(footman(2, 2), [mounted], allCells), false);
  assert.equal(canPlaceUnit(rider(2, 0), [mounted], allCells), false);
  assert.equal(canPlaceUnit(rider(2, 2), [mounted], allCells), false);
  assert.equal(canPlaceUnit(rider(2, 3), [mounted], allCells), true);
  assert.equal(canPlaceUnit(rider(1, 2), [mounted], allCells, [1]), true);
  assert.equal(canPlaceUnit(rider(1, 2), [mounted], allCells, ['1']), false);
  const unnamed = { type: 'healer', col: 3, row: 0 };
  assert.equal(canPlaceUnit(rider(1, 2), [mounted, unnamed], allCells, [1]), false);
});

test('moving over the rider own second cell succeeds only when its new full footprint fits', () => {
  const army = [rider(1, 0, 0, 37), footman(2, 4, 2)];
  const before = structuredClone(army);
  const result = planFormationMove(army, 1, 1, 0, allCells);
  assert.equal(result.ok, true);
  assert.deepEqual(result.units, [{ ...army[0], col: 1 }, army[1]]);
  assert.deepEqual(army, before);
  assert.notStrictEqual(result.units[0], army[0]);
  assert.notStrictEqual(result.units[1], army[1]);
  assert.equal(planFormationMove(army, 1, 1, 0, allCells.filter(cell => cell !== '2:0')).ok, false);
  assert.equal(planFormationMove(army, 1, 4, 0, allCells).ok, false);
  assert.equal(planFormationMove(army, 1, 0, 0, allCells).ok, true);
});

test('one-cell, mounted and mixed swaps preserve fighter IDs, levels and other fields', () => {
  const fixtures = [
    { army: [footman(1, 0), footman(2, 3)], target: 3, expected: [3, 0] },
    { army: [rider(1, 0), footman(2, 3)], target: 3, expected: [3, 0] },
    { army: [footman(1, 0), rider(2, 3)], target: 3, expected: [3, 0] },
    { army: [rider(1, 0), rider(2, 3)], target: 3, expected: [3, 0] },
    { army: [rider(1, 0), footman(2, 2)], target: 1, expected: [1, 0] },
    // Clicking the rider's second cell selects it as the single swap participant.
    { army: [footman(1, 0), rider(2, 3)], target: 4, expected: [4, 0] },
  ];
  for (const { army, target, expected } of fixtures) {
    army[0].level = 137;
    army[1].level = 54;
    army[0].tag = 'retained';
    const before = structuredClone(army);
    const result = planFormationMove(army, 1, target, 0, allCells);
    assert.equal(result.ok, true, JSON.stringify(before));
    assert.deepEqual(result.units, army.map((unit, index) => ({ ...unit, col: expected[index] })));
    assert.deepEqual(army, before);
  }
  const stringIds = [{ ...rider(1, 0), id: 'mounted' }, { ...footman(2, 3), id: 'guard' }];
  assert.equal(planFormationMove(stringIds, 'mounted', 3, 0, allCells).ok, true);
});

test('moves reject multiple blockers, incomplete swaps, locked cells, invalid IDs and coordinates', () => {
  const cases = [
    { army: [rider(1, 0), footman(2, 2), footman(3, 3)], target: 2 },
    { army: [footman(1, 4), rider(2, 0)], target: 0 },
    { army: [footman(1, 0), footman(3, 1), rider(2, 3)], target: 3 },
    { army: [rider(1, 2), footman(2, 1)], target: 1 },
    { army: [rider(1, 0), footman(2, 3)], target: 3, owned: allCells.filter(cell => cell !== '4:0') },
    { army: [rider(1, 0)], target: 2.5 },
    { army: [rider(1, 0)], target: NaN },
    { army: [rider(1, 0)], target: 2, id: 99 },
    { army: [footman(1, 0), footman(1, 3)], target: 2 },
  ];
  for (const { army, target, id = 1, owned = allCells } of cases) {
    const before = structuredClone(army);
    const result = planFormationMove(army, id, target, 0, owned);
    assert.equal(result.ok, false, JSON.stringify(before));
    assert.deepEqual(result.units, before);
    assert.deepEqual(army, before);
    assert.notStrictEqual(result.units, army);
  }
});

test('save reconciliation gives ordinary anchors priority and returns blocked riders intact to reserve', () => {
  const army = [rider(7, 1, 0, 135), footman(8, 2, 0, 29), rider(9, 3, 1, 80), footman(10, 0, 1)];
  const reserve = [{ id: 20, type: 'healer', level: 6 }];
  const before = structuredClone({ army, reserve });
  const result = reconcileUnitFootprints(army, reserve, allCells);
  assert.deepEqual(result.units, [army[1], army[2], army[3]], 'survivor order and anchors must stay unchanged');
  assert.deepEqual(result.reserve, [reserve[0], { id: 7, type: 'pantherRider', level: 135 }]);
  assert.equal(result.movedCount, 1);
  assert.deepEqual({ army, reserve }, before);
  assert.notStrictEqual(result.reserve[0], reserve[0]);
  assert.notStrictEqual(result.units[0], army[1]);
  const repeated = reconcileUnitFootprints(result.units, result.reserve, allCells);
  assert.deepEqual(repeated, { ...result, movedCount: 0 });
});

test('rider conflicts, locked second cells and edge anchors move whole fighters without auto-shifting', () => {
  const army = [rider(1, 1, 0, 501), rider(2, 2, 0, 102), rider(3, 4, 1, 100),
    rider(4, 0, 2, 52), rider(5, 2, 2, 5)];
  const owned = allCells.filter(cell => cell !== '1:2');
  const result = reconcileUnitFootprints(army, [], owned);
  assert.deepEqual(result.units, [army[0], army[4]], 'first rider keeps its original two cells');
  assert.deepEqual(result.reserve, [
    { id: 2, type: 'pantherRider', level: 102 },
    { id: 3, type: 'pantherRider', level: 100 },
    { id: 4, type: 'pantherRider', level: 52 },
  ]);
  assert.equal(result.movedCount, 3);
  const after = [...result.units, ...result.reserve];
  assert.equal(after.length, army.length);
  assert.equal(new Set(after.map(unit => unit.id)).size, army.length);
  assert.deepEqual(after.map(({ id, type, level }) => ({ id, type, level })).sort((a, b) => a.id - b.id),
    army.map(({ id, type, level }) => ({ id, type, level })));
  assert.deepEqual(reconcileUnitFootprints(result.units, result.reserve, owned), { ...result, movedCount: 0 });
});
