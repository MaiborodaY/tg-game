import type { FrameFunction } from './animation-types.ts';
import type { PaletteRank } from './unit-ranks.ts';
import type { UnitType } from './units.ts';
import type { EnemyCombatType } from './wave-types.ts';

export interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteLayout {
  columns: number;
  rows: number;
}

export interface SpriteGeometry {
  bodyHeight: number;
  baselines: readonly number[];
  centers?: readonly number[];
  layout?: SpriteLayout;
  sourceRects?: Readonly<Partial<Record<number, SpriteRect>>>;
  compactSourceRects?: Readonly<Partial<Record<number, SpriteRect>>>;
}

export interface AnimationMetadata extends SpriteGeometry {
  layout: SpriteLayout;
  frameFor: FrameFunction;
  renderHeight?: number;
  pixelArt?: boolean;
  fullCells?: boolean;
  bakedShadow?: boolean;
  horizontalFacing?: boolean;
  mirrorFrames?: readonly number[];
  portraitFrame?: number;
}

export interface SheetArtUrls {
  sheet: string;
  art: string;
  walk?: string;
  cast?: string;
}

// Blue infantry and lancer palettes live in their original/separate catalogues.
export type RankArtAssets = Partial<Record<UnitType, Partial<Record<PaletteRank, SheetArtUrls>>>>;

export interface SpriteEffectFrame {
  rect: SpriteRect;
  groundAnchor: { x: number; y: number };
}

export interface SpriteEffectMetadata {
  row: number;
  duration: number;
  frames: readonly SpriteEffectFrame[];
}

export interface EnemyArt {
  url: string;
  fallback: EnemyCombatType;
  metadata: AnimationMetadata;
}

export type SpriteRectTuple = [x: number, y: number, width: number, height: number];
