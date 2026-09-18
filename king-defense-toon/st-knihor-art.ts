import type { SpriteGeometry } from './art-types.ts';
import type { HeroEffectKind } from './tiny-st-knihor.ts';

import { TINY_ST_KNIHOR_LAYOUT, ST_KNIHOR_EFFECT_LAYOUT, ST_KNIHOR_EFFECT_TIMINGS } from './tiny-st-knihor.ts';

export const ST_KNIHOR_ASSETS = Object.freeze({
  down: new URL('./assets/st-knihor/st-knihor-down.webp', import.meta.url).href,
  side: new URL('./assets/st-knihor/st-knihor-side.webp', import.meta.url).href,
  up: new URL('./assets/st-knihor/st-knihor-up.webp', import.meta.url).href,
});
export const ST_KNIHOR_EFFECTS_IMAGE_URL = new URL('./assets/st-knihor/st-knihor-effects.webp', import.meta.url).href;
export const ST_KNIHOR_PORTRAIT_IMAGE_URL = new URL('./assets/st-knihor/st-knihor-portrait.webp', import.meta.url).href;

const FRAME_SIZE = 128;
const sourceRect = (index: number) => Object.freeze({
  x: index % 4 * FRAME_SIZE, y: Math.floor(index / 4) * FRAME_SIZE,
  width: FRAME_SIZE, height: FRAME_SIZE,
});

export const ST_KNIHOR_GEOMETRY = Object.freeze({
  layout: TINY_ST_KNIHOR_LAYOUT,
  frameWidth: FRAME_SIZE,
  frameHeight: FRAME_SIZE,
  anchor: Object.freeze({ x: 64, y: 110 }),
  bodyHeight: 82.5 / FRAME_SIZE,
  centers: Object.freeze(Array<number>(24).fill(64 / FRAME_SIZE)),
  baselines: Object.freeze(Array<number>(24).fill(110 / FRAME_SIZE)),
  sourceRects: Object.freeze(Array.from({ length: 24 }, (_, index) => sourceRect(index))),
} satisfies SpriteGeometry & { frameWidth: number; frameHeight: number; anchor: { x: number; y: number } });

export const ST_KNIHOR_EFFECTS_GEOMETRY = Object.freeze({
  layout: ST_KNIHOR_EFFECT_LAYOUT, frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE,
});
const effects = Object.fromEntries(
  Object.entries(ST_KNIHOR_EFFECT_TIMINGS).map(([kind, timing]) => [kind, Object.freeze({
    ...timing,
    frames: Object.freeze(Array.from({ length: 4 }, (_, pose) => Object.freeze({
      rect: sourceRect(timing.row * 4 + pose), groundAnchor: Object.freeze({ x: 64, y: 64 }),
    }))),
  })] as const),
);
// Every timing key is mapped once; retain those keys and the nested frozen frame types.
export const ST_KNIHOR_EFFECTS = Object.freeze(effects as Record<HeroEffectKind, typeof effects[string]>);
