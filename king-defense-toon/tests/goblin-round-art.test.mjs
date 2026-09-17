import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { GOBLIN_ROUND_ASSETS, GOBLIN_ROUND_COLORS, getGoblinRoundColor, getEnemyRoundArt } from '../goblin-round-art.mjs';
import { WAVE_DEFINITIONS as WAVES } from '../waves.mjs';

test('goblin clothing changes every five rounds in the same color order as allied ranks', () => {
  for (const [round, expected] of [[1, 'Blue'], [5, 'Blue'], [6, 'Purple'], [10, 'Purple'],
    [11, 'Red'], [15, 'Red'], [16, 'Yellow'], [20, 'Yellow']]) {
    assert.equal(getGoblinRoundColor(round), expected);
  }
  for (const value of [undefined, null, 0, -1, NaN, Infinity, {}, Symbol('invalid')]) {
    assert.equal(getGoblinRoundColor(value), 'Blue');
  }
  assert.equal(getGoblinRoundColor('6'), 'Purple');
  assert.equal(getGoblinRoundColor(100), 'Yellow');
});

test('all ten waves of a round share its palette, including bosses, without recoloring Level 2', () => {
  const art = { animations: {}, roundColors: Object.fromEntries(
    GOBLIN_ROUND_COLORS.map(color => [color, { color }])) };
  const counts = Object.fromEntries(GOBLIN_ROUND_COLORS.map(color => [color, 0]));
  for (const wave of WAVES) {
    const selected = getEnemyRoundArt(art, wave);
    if (wave.levelNumber === 2) assert.equal(selected, art);
    else {
      const expected = GOBLIN_ROUND_COLORS[Math.floor((wave.roundNumber - 1) / 5)];
      assert.equal(selected, art.roundColors[expected], `wave ${wave.number}`);
      counts[expected]++;
    }
  }
  assert.deepEqual(Object.values(counts), [50, 50, 50, 50]);
  assert.equal(getEnemyRoundArt(art, undefined), art);
  const base = { animations: {} };
  assert.equal(getEnemyRoundArt(base, WAVES[0]), base);
});

test('every round palette references a shipped native goblin sheet', async () => {
  assert.deepEqual(Object.keys(GOBLIN_ROUND_ASSETS), GOBLIN_ROUND_COLORS);
  await Promise.all(Object.values(GOBLIN_ROUND_ASSETS).map(url => access(new URL(url))));
});
