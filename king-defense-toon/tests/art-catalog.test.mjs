import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { UNIT_RANK_ASSETS } from '../rank-art.ts';
import { LANCER_ASSETS, LANCER_GEOMETRY } from '../lancer-art.ts';
import { GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES } from '../goblin-healer-art.ts';
import { UNDEAD_ART } from '../undead-art.ts';
import { GRAVEYARD_BOSS_ART } from '../graveyard-boss-art.ts';
import { ST_KNIHOR_EFFECTS, ST_KNIHOR_GEOMETRY } from '../st-knihor-art.ts';
import { getEnemyRoundArt } from '../goblin-round-art.ts';
import { rankArtSource, lancerArtSource, goblinHealerGeometrySource } from '../scripts/art-catalog-codegen.mjs';

test('catalogue generators recreate checked TypeScript catalogues without image writes', async () => {
  const root = new URL('../', import.meta.url).href;
  const relative = url => `./${url.slice(root.length)}`;
  const ranks = Object.fromEntries(Object.entries(UNIT_RANK_ASSETS).map(([type, palettes]) =>
    [type, Object.fromEntries(Object.entries(palettes).map(([rank, urls]) =>
      [rank, Object.fromEntries(Object.entries(urls).map(([kind, url]) => [kind, relative(url)]))]))]));
  for (const [name, source] of [
    ['rank-art', rankArtSource(ranks)],
    ['lancer-art', lancerArtSource(['Blue', 'Purple', 'Red', 'Yellow', 'Black'], LANCER_GEOMETRY)],
    ['assets/goblin-healer/geometry', goblinHealerGeometrySource(GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES)],
  ]) {
    assert.equal(source, (await readFile(new URL(`../${name}.ts`, import.meta.url), 'utf8')).replaceAll('\r\n', '\n'));
  }
});

test('graveyard metadata preserves all authored crops, foot anchors and the distinct ghoul walk clock', () => {
  for (const { metadata } of Object.values({ ...UNDEAD_ART, ...GRAVEYARD_BOSS_ART })) {
    assert.equal(metadata.baselines.length, 16);
    assert.equal(metadata.centers.length, 16);
    assert.equal(Object.keys(metadata.sourceRects).length, 16);
    assert.deepEqual(metadata.layout, { columns: 4, rows: 4 });
    for (let index = 0; index < 16; index++) {
      const { x, y, width, height } = metadata.sourceRects[index];
      assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 768 && y + height <= 768);
      assert.ok(metadata.baselines[index] > 0 && metadata.baselines[index] < 1);
      assert.ok(metadata.centers[index] > 0 && metadata.centers[index] < 1);
    }
  }
  assert.equal(UNDEAD_ART.ghoul.metadata.frameFor({ action: 'walk', walkTime: .4 }), 7);
  assert.equal(UNDEAD_ART.skeleton.metadata.frameFor({ action: 'walk', walkTime: .4 }), 6);
  for (const walkTime of [undefined, null, NaN, Infinity, -1, '0.4']) {
    assert.equal(UNDEAD_ART.ghoul.metadata.frameFor({ action: 'walk', walkTime }), 4);
  }
});

test('catalogues retain the original shallow and nested freeze boundaries', () => {
  assert.equal(Object.isFrozen(UNIT_RANK_ASSETS), false);
  assert.equal(Object.isFrozen(LANCER_ASSETS), true);
  assert.equal(Object.isFrozen(LANCER_ASSETS[1]), false);
  assert.equal(Object.isFrozen(LANCER_GEOMETRY), false);
  assert.equal(Object.isFrozen(UNDEAD_ART), true);
  assert.equal(Object.isFrozen(UNDEAD_ART.ghoul), false);
  assert.equal(Object.isFrozen(UNDEAD_ART.ghoul.metadata), true);
  assert.equal(Object.isFrozen(UNDEAD_ART.ghoul.metadata.baselines), false);
  assert.equal(Object.isFrozen(GOBLIN_HEAL_PULSE_FRAMES), true);
  assert.equal(Object.isFrozen(GOBLIN_HEAL_PULSE_FRAMES[0]), false);
  assert.equal(Object.isFrozen(ST_KNIHOR_GEOMETRY.sourceRects[0]), true);
  assert.equal(Object.isFrozen(ST_KNIHOR_EFFECTS.heal.frames[0].groundAnchor), true);
});

test('round art uses nullish fallback, preserving present falsy palette values and exact level gating', () => {
  const art = { roundColors: { Blue: false, Purple: 0, Red: '', Yellow: null } };
  for (const [roundNumber, expected] of [[1, false], ['6.9', 0], [11, ''], [16, art]]) {
    assert.equal(getEnemyRoundArt(art, { levelNumber: 1, roundNumber }), expected);
  }
  for (const levelNumber of [undefined, null, '1', 2]) {
    assert.equal(getEnemyRoundArt(art, { levelNumber, roundNumber: 1 }), art);
  }
  const missing = { roundColors: null };
  assert.equal(getEnemyRoundArt(missing, { levelNumber: 1 }), missing);
});
