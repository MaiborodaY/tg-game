import type { AnimationMetadata, SpriteEffectFrame } from './art-types.ts';
import { TINY_GOBLIN_BOMBARDIER_LAYOUT, tinyGoblinBombardierFrame } from './tiny-goblin-bombardier.ts';

export const GOBLIN_BOMBARDIER_ASSETS = Object.freeze({
  body: new URL('./assets/goblin-bombardier/body.webp', import.meta.url).href,
  bomb: new URL('./assets/goblin-bombardier/bomb.webp', import.meta.url).href,
  explosion: new URL('./assets/goblin-bombardier/explosion.webp', import.meta.url).href,
});

function frames(rows: readonly (readonly [number, number, number, number, number, number])[]) {
  return Object.freeze(rows.map(([x, y, width, height, ax, ay]) => Object.freeze({
    rect: Object.freeze({ x, y, width, height }), groundAnchor: Object.freeze({ x: ax, y: ay }),
  } satisfies SpriteEffectFrame)));
}

// Exact rectangles and frame-local wheel anchors from the approved 512px atlas manifest.
export const GOBLIN_BOMBARDIER_FRAMES = frames([
  [0,0,134,136,73,118], [134,0,126,136,63,118], [260,0,126,136,62,118], [386,0,126,136,62,118],
  [0,136,136,120,73,102], [136,136,126,120,62,102], [262,136,124,120,60,102], [386,136,126,120,62,102],
  [0,256,135,116,74,98], [135,256,123,116,63,98], [258,256,127,116,60,98], [385,256,127,116,61,98],
  [0,372,133,140,76,104], [133,372,121,140,65,104], [254,372,133,140,66,104], [387,372,125,140,59,104],
]);

export const GOBLIN_BOMBARDIER_MUZZLES = Object.freeze({
  10: Object.freeze({ x: 95, y: 58 }),
  14: Object.freeze({ x: 99, y: 70 }),
});

export const GOBLIN_BOMBARDIER_BODY_HEIGHT = 88;
export const GOBLIN_BOMBARDIER_RENDER_HEIGHT = 52 * 1.15;
const cell = 128;

export const GOBLIN_BOMBARDIER_METADATA = Object.freeze({
  layout: TINY_GOBLIN_BOMBARDIER_LAYOUT,
  frameFor: tinyGoblinBombardierFrame,
  pixelArt: true, fullCells: true, bakedShadow: false, horizontalFacing: true,
  portraitFrame: 0, bodyHeight: GOBLIN_BOMBARDIER_BODY_HEIGHT / cell,
  renderHeight: GOBLIN_BOMBARDIER_RENDER_HEIGHT,
  sourceRects: Object.freeze(Object.fromEntries(GOBLIN_BOMBARDIER_FRAMES.map((frame, index) => [index, frame.rect]))),
  // The scene renderer expects anchors relative to a nominal grid cell, not the cropped rectangle.
  baselines: Object.freeze(GOBLIN_BOMBARDIER_FRAMES.map(({ rect, groundAnchor }, i) =>
    (rect.y + groundAnchor.y - Math.floor(i / 4) * cell) / cell)),
  centers: Object.freeze(GOBLIN_BOMBARDIER_FRAMES.map(({ rect, groundAnchor }, i) =>
    (rect.x + groundAnchor.x - (i % 4) * cell) / cell)),
} satisfies AnimationMetadata);

// The bomb's anchor follows its sphere, not its moving fuse. Blast anchors share one impact point.
export const CANNON_BOMB_FRAMES = frames([
  [0,0,64,64,36,41], [64,0,64,64,27,41], [0,64,64,64,36,25], [64,64,64,64,33,26],
]);
export const CANNON_EXPLOSION_FRAMES = frames([
  [0,0,64,64,34,38], [64,0,64,64,33,38], [0,64,64,64,35,32], [64,64,64,64,33,32],
]);
