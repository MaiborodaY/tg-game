import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateCampaignUnitId, EXHAUSTED_UNIT_ID, restoreCampaignRoster } from '../campaign-roster.ts';
import { createProgression } from '../progression.ts';

test('saved rosters keep personal levels, deployment and first valid IDs while repairing duplicates', () => {
  const army = [{ id: 99, type: 'archer', col: 2, row: 0, level: 12 },
    { id: 99, type: 'healer', col: 2, row: 2, level: 3 }];
  const reserve = [{ id: 99, type: 'lancer', level: 7 }, { type: 'swordsman', level: '5' }];
  const before = structuredClone({ army, reserve });
  const restored = restoreCampaignRoster(army, reserve, createProgression());
  assert.deepEqual(restored, { units: [{ id: 99, type: 'archer', col: 2, row: 0, level: 12 },
    { id: 100, type: 'healer', col: 2, row: 2, level: 3 }],
  reserve: [{ id: 101, type: 'lancer', level: 7 }, { id: 102, type: 'swordsman', level: 5 }], nextUnitId: 103 });
  assert.deepEqual({ army, reserve }, before);
  restored.units[0].level = 13;
  assert.equal(army[0].level, 12, 'restoration owns new objects');
});

test('duplicate, locked, fractional and out-of-grid positions are rejected before assigning IDs', () => {
  const unit = { type: 'swordsman', col: 2, row: 0 };
  const restored = restoreCampaignRoster([unit, { ...unit, level: 9 }, { ...unit, col: 1 },
    { ...unit, row: .5 }, { ...unit, row: 3 }, { ...unit, col: -1 }, { ...unit, col: '2' },
    { ...unit, row: 1 }], [], createProgression());
  assert.deepEqual(restored.units, [{ id: 1, type: 'swordsman', col: 2, row: 0, level: 1 },
    { id: 2, type: 'swordsman', col: 2, row: 1, level: 1 }]);
});

test('unknown saved values and inherited property names never become fighters', () => {
  const malformed = [null, undefined, false, 0, 'archer', [], {}, { type: 'dragon' }, { type: ['archer'], col: 2, row: 0 },
    ...['constructor', '__proto__', 'toString', 'hasOwnProperty'].map(type => ({ type, col: 2, row: 0, level: 1 }))];
  assert.deepEqual(restoreCampaignRoster(malformed, malformed, createProgression()), { units: [], reserve: [], nextUnitId: 1 });
  for (const value of [null, undefined, 7, 'saved', { type: 'archer' }]) {
    assert.deepEqual(restoreCampaignRoster(value, value, createProgression()), { units: [], reserve: [], nextUnitId: 1 });
  }
});

test('repairing missing and duplicate IDs cannot steal later valid IDs in either roster', () => {
  const progression = createProgression();
  const army = [{ type: 'swordsman', col: 2, row: 0 }, { id: 1, type: 'archer', col: 2, row: 1 }];
  const reserve = [{ id: 1, type: 'healer' }, { id: 2, type: 'lancer' }, { id: '3', type: 'archer' }];
  const restored = restoreCampaignRoster(army, reserve, progression);
  assert.deepEqual(restored.units.map(unit => unit.id), [3, 1]);
  assert.deepEqual(restored.reserve.map(unit => unit.id), [4, 2, 5]);
  assert.equal(restored.nextUnitId, 6);
  assert.deepEqual(restoreCampaignRoster(restored.units, restored.reserve, progression, restored.nextUnitId), restored);
});

test('sparse IDs survive reordering and the cursor includes previously consumed and rejected IDs', () => {
  const army = [{ id: 100, type: 'swordsman', col: 2, row: 0 }, { id: 7, type: 'archer', col: 2, row: 1 }];
  const progression = createProgression();
  const restored = restoreCampaignRoster(army, [{ id: 999, type: 'invalid' }], progression, 1200);
  assert.deepEqual(restored.units.map(unit => unit.id), [100, 7]);
  assert.equal(restored.nextUnitId, 1200);
  const reordered = restoreCampaignRoster([...restored.units].reverse(), [], progression, restored.nextUnitId);
  assert.deepEqual(reordered.units.map(unit => unit.id), [7, 100]);
  assert.equal(reordered.nextUnitId, 1200);
  assert.equal(restoreCampaignRoster([], [{ id: 999, type: 'invalid' }], progression).nextUnitId, 1000);
});

test('the final safe fighter ID can be consumed once and exhaustion survives restoration', () => {
  const cursor = { nextUnitId: Number.MAX_SAFE_INTEGER };
  assert.equal(allocateCampaignUnitId(cursor), Number.MAX_SAFE_INTEGER);
  assert.equal(cursor.nextUnitId, EXHAUSTED_UNIT_ID);
  assert.throws(() => allocateCampaignUnitId(cursor), RangeError);
  assert.equal(cursor.nextUnitId, EXHAUSTED_UNIT_ID);
  const restored = restoreCampaignRoster([], [{ id: Number.MAX_SAFE_INTEGER, type: 'archer' }], createProgression());
  assert.equal(restored.reserve[0].id, Number.MAX_SAFE_INTEGER);
  assert.equal(restored.nextUnitId, EXHAUSTED_UNIT_ID);
  assert.throws(() => restoreCampaignRoster([], [...restored.reserve, { type: 'healer' }], createProgression()), RangeError);
  for (const nextUnitId of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '1']) {
    const invalid = { nextUnitId };
    assert.throws(() => allocateCampaignUnitId(invalid), RangeError);
    assert.deepEqual(invalid, { nextUnitId });
  }
});

test('unlocked expansion cells and legacy level normalization survive reload', () => {
  const restored = restoreCampaignRoster([{ type: 'lancer', col: 4, row: 2, level: 500 },
    { type: 'archer', col: 2, row: 0, level: -5 }], [{ type: 'healer', level: null }],
  createProgression({ unlockedCells: ['4:2'] }));
  assert.deepEqual(restored.units.map(unit => unit.level), [500, 1]);
  assert.equal(restored.reserve[0].level, 1);
  assert.deepEqual(restored.units[0], { id: 1, type: 'lancer', col: 4, row: 2, level: 500 });
});

test('a malformed coordinate cannot interrupt restoration of the remaining valid fighters', () => {
  const army = JSON.parse('[{"type":"archer","col":{"toString":null},"row":0},{"type":"healer","col":2,"row":1,"level":8}]');
  assert.deepEqual(restoreCampaignRoster(army, [], createProgression()).units,
    [{ id: 1, type: 'healer', col: 2, row: 1, level: 8 }]);
});
