import type { AnimationMetadata, RankArtAssets, SpriteGeometry, SpriteRect } from '../../art-types.ts';
import type { PaletteRank } from '../../unit-ranks.ts';
import { UNIT_RANK_ASSETS } from '../../rank-art.ts';
import { LANCER_ASSETS, LANCER_GEOMETRY } from '../../lancer-art.ts';
import { PANTHER_RIDER_ASSETS, PANTHER_RIDER_GEOMETRY } from '../../panther-rider-art.ts';
import { GOBLIN_ARCHER_GEOMETRY } from '../../goblin-archer-art.ts';
import { GOBLIN_CHIEF_GEOMETRY } from '../../goblin-chief-art.ts';
import { GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES } from '../../goblin-healer-art.ts';
import { GOBLIN_ROUND_ASSETS, getGoblinRoundColor, getEnemyRoundArt } from '../../goblin-round-art.ts';
import { OGRE_GEOMETRY } from '../../ogre-art.ts';
import { UNDEAD_ART } from '../../undead-art.ts';
import { GRAVEYARD_BOSS_ART } from '../../graveyard-boss-art.ts';
import { ST_KNIHOR_ASSETS, ST_KNIHOR_EFFECTS, ST_KNIHOR_GEOMETRY } from '../../st-knihor-art.ts';

export function artContracts(rank: PaletteRank): void {
  const geometry: readonly SpriteGeometry[] = [LANCER_GEOMETRY, PANTHER_RIDER_GEOMETRY, GOBLIN_ARCHER_GEOMETRY,
    GOBLIN_CHIEF_GEOMETRY, GOBLIN_HEALER_GEOMETRY, OGRE_GEOMETRY, ST_KNIHOR_GEOMETRY];
  const ranks: RankArtAssets = UNIT_RANK_ASSETS;
  const optionalSheet: string | undefined = ranks.swordsman?.[rank]?.sheet;
  const lancerSheet: string = LANCER_ASSETS[rank].sheet;
  const riderSheet: string = PANTHER_RIDER_ASSETS[rank].sheet;
  const healerCast: string = UNIT_RANK_ASSETS.healer[2].cast;
  const metadata: AnimationMetadata = UNDEAD_ART.ghoul.metadata;
  const bossMetadata: AnimationMetadata = GRAVEYARD_BOSS_ART.cryptKing.metadata;
  const rect: SpriteRect = GOBLIN_HEAL_PULSE_FRAMES[0].rect;
  const colorUrl: string = GOBLIN_ROUND_ASSETS[getGoblinRoundColor('6')];
  const frame: number = metadata.frameFor({ action: 'walk', walkTime: .25 }, .5);
  const plain = { id: 'base' };
  const base: typeof plain = getEnemyRoundArt(plain, null);
  const colored = { id: 'base', roundColors: { Blue: { palette: 'blue' } } };
  const selected: typeof colored | { palette: string } = getEnemyRoundArt(colored, { levelNumber: 1 });

  // @ts-expect-error Base palettes do not live in the extra rank catalogue.
  UNIT_RANK_ASSETS.swordsman[1];
  // @ts-expect-error Only five personal-level palette ranks exist.
  LANCER_ASSETS[6];
  // @ts-expect-error Rider palettes use the same five rank keys as other fighters.
  PANTHER_RIDER_ASSETS[6];
  // @ts-expect-error URL catalogues contain strings, not decoded images.
  const decoded: HTMLImageElement = ST_KNIHOR_ASSETS.down;
  // @ts-expect-error The three authored hero directions have no left atlas.
  ST_KNIHOR_ASSETS.left;
  // @ts-expect-error Effect keys are closed to the four authored rows.
  ST_KNIHOR_EFFECTS.spark;
  // @ts-expect-error Frozen hero frame anchors cannot be edited.
  ST_KNIHOR_EFFECTS.heal.frames[0].groundAnchor.x = 0;
  // @ts-expect-error Hero source rectangles are frozen individually.
  ST_KNIHOR_GEOMETRY.sourceRects[0].width = 0;
  // @ts-expect-error The healer effect frame array is frozen.
  GOBLIN_HEAL_PULSE_FRAMES.push(rect);
  // @ts-expect-error Baselines are numeric source-cell fractions.
  const malformedGeometry: SpriteGeometry = { bodyHeight: 1, baselines: ['1'] };
  // @ts-expect-error Draw metadata always provides a frame callback.
  const missingFrame: AnimationMetadata = { layout: { columns: 4, rows: 4 }, bodyHeight: 1, baselines: [] };
  // @ts-expect-error Runtime enemy art retains its own shape, not the caller's chosen type.
  const invented: { extra: number } = getEnemyRoundArt(plain, { levelNumber: 2 });
  // @ts-expect-error Wave level is an internal numeric field.
  getEnemyRoundArt(plain, { levelNumber: '1' });
  void [geometry, optionalSheet, lancerSheet, riderSheet, healerCast, bossMetadata, rect, colorUrl, frame,
    base, selected, decoded, malformedGeometry, missingFrame, invented];
}
