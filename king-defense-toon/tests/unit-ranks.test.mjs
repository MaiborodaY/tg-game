import assert from 'node:assert/strict';
import test from 'node:test';
import { getUnitRank } from '../unit-ranks.ts';
import { normalizeUnitLevel } from '../recruitment.ts';

test('clothing colors advance exactly at personal levels 50, 100, 250 and 500', () => {
  for (const [level, palette, color] of [
    [1, 1, 'Blue'], [49, 1, 'Blue'],
    [50, 2, 'Purple'], [99, 2, 'Purple'],
    [100, 3, 'Red'], [249, 3, 'Red'],
    [250, 4, 'Yellow'], [499, 4, 'Yellow'],
    [500, 5, 'Black'], [1000, 5, 'Black'], [Number.MAX_SAFE_INTEGER, 5, 'Black'],
  ]) {
    const rank = getUnitRank(level);
    assert.equal(rank.level, palette, `palette at level ${level}`);
    assert.equal(rank.color, color, `color at level ${level}`);
  }
});

test('every level uses one frozen rank with Black continuing beyond level 500', () => {
  const counts = [0, 0, 0, 0, 0];
  const colors = ['Blue', 'Purple', 'Red', 'Yellow', 'Black'];
  for (let level = 1; level <= 1000; level += 1) {
    const index = [50, 100, 250, 500].filter(threshold => level >= threshold).length;
    const rank = getUnitRank(level);
    assert.equal(rank.level, index + 1);
    assert.equal(rank.color, colors[index]);
    assert.equal(Object.isFrozen(rank), true);
    counts[rank.level - 1] += 1;
  }
  assert.deepEqual(counts, [49, 50, 150, 250, 501]);
});

test('palette selection normalizes saved levels exactly like combat stats', () => {
  for (const value of [
    undefined, null, false, true, '', '26', '50.9', 'bad',
    0, -5, 25.9, 76.9, 101, Number.MAX_VALUE,
    NaN, Infinity, -Infinity, [], {}, Symbol('invalid'), 76n,
  ]) {
    const normalized = normalizeUnitLevel(value);
    assert.equal(getUnitRank(value), getUnitRank(normalized), String(value));
  }
  assert.equal(getUnitRank().level, 1);
  assert.equal(getUnitRank(101).level, 3);
  assert.equal(getUnitRank(500).level, 5);
  assert.equal(getUnitRank(Infinity).level, 1);
});
