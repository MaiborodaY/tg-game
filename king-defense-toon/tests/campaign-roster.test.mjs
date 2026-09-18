import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreCampaignRoster } from '../campaign-roster.ts';
import { createProgression } from '../progression.ts';

test('saved rosters keep personal levels, deployment and order while rebuilding unique IDs', () => {
  const army = [{ id: 99, type: 'archer', col: 2, row: 0, level: 12 },
    { id: 99, type: 'healer', col: 2, row: 2, level: 3 }];
  const reserve = [{ id: 99, type: 'lancer', level: 7 }, { type: 'swordsman', level: '5' }];
  const before = structuredClone({ army, reserve });
  const restored = restoreCampaignRoster(army, reserve, createProgression());
  assert.deepEqual(restored, { units: [{ id: 1, type: 'archer', col: 2, row: 0, level: 12 },
    { id: 2, type: 'healer', col: 2, row: 2, level: 3 }],
  reserve: [{ id: 3, type: 'lancer', level: 7 }, { id: 4, type: 'swordsman', level: 5 }] });
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
  assert.deepEqual(restoreCampaignRoster(malformed, malformed, createProgression()), { units: [], reserve: [] });
  for (const value of [null, undefined, 7, 'saved', { type: 'archer' }]) {
    assert.deepEqual(restoreCampaignRoster(value, value, createProgression()), { units: [], reserve: [] });
  }
});

test('unlocked expansion cells and legacy level normalization survive reload', () => {
  const restored = restoreCampaignRoster([{ type: 'lancer', col: 4, row: 2, level: 500 },
    { type: 'archer', col: 2, row: 0, level: -5 }], [{ type: 'healer', level: null }],
  createProgression({ unlockedCells: ['4:2'] }));
  assert.deepEqual(restored.units.map(unit => unit.level), [100, 1]);
  assert.equal(restored.reserve[0].level, 1);
  assert.deepEqual(restored.units[0], { id: 1, type: 'lancer', col: 4, row: 2, level: 100 });
});

test('a malformed coordinate cannot interrupt restoration of the remaining valid fighters', () => {
  const army = JSON.parse('[{"type":"archer","col":{"toString":null},"row":0},{"type":"healer","col":2,"row":1,"level":8}]');
  assert.deepEqual(restoreCampaignRoster(army, [], createProgression()).units,
    [{ id: 1, type: 'healer', col: 2, row: 1, level: 8 }]);
});
