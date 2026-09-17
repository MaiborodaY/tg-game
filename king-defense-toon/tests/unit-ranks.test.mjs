import assert from 'node:assert/strict';
import test from 'node:test';
import { getUnitRank } from '../unit-ranks.mjs';
import { normalizeUnitLevel } from '../recruitment.mjs';

test('native clothing colors advance at levels 26, 51 and 76', () => {
  for (const [level, palette, color] of [
    [1, 1, 'Blue'], [25, 1, 'Blue'],
    [26, 2, 'Purple'], [50, 2, 'Purple'],
    [51, 3, 'Red'], [75, 3, 'Red'],
    [76, 4, 'Yellow'], [100, 4, 'Yellow'],
  ]) {
    const rank = getUnitRank(level);
    assert.equal(rank.level, palette, `palette at level ${level}`);
    assert.equal(rank.color, color, `color at level ${level}`);
  }
});

test('all 100 personal levels use the existing four palette keys in equal bands', () => {
  const counts = [0, 0, 0, 0];
  const colors = ['Blue', 'Purple', 'Red', 'Yellow'];
  for (let level = 1; level <= 100; level += 1) {
    const index = Math.floor((level - 1) / 25);
    const rank = getUnitRank(level);
    assert.equal(rank.level, index + 1);
    assert.equal(rank.color, colors[index]);
    assert.equal(Object.isFrozen(rank), true);
    counts[rank.level - 1] += 1;
  }
  assert.deepEqual(counts, [25, 25, 25, 25]);
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
  assert.equal(getUnitRank(101).level, 4);
  assert.equal(getUnitRank(Infinity).level, 1);
});
