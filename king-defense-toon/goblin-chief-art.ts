import type { SpriteGeometry } from './art-types.ts';

export const GOBLIN_CHIEF_IMAGE_URL = new URL('./assets/web/goblin-chief.webp', import.meta.url).href;

const cell = 1254 / 4;
export const GOBLIN_CHIEF_GEOMETRY = Object.freeze({
  bodyHeight: 210 / cell,
  baselines: [299, 299, 299, 299, 295.5, 295.5, 295.5, 295.5, 288, 288, 288, 288, 258.5, 258.5, 258.5, 258.5].map(y => y / cell),
  centers: [160, 159, 159, 156, 161, 169, 167, 166, 160, 160, 162, 148, 165, 162, 156, 165].map(x => x / cell),
  // Measured sprite rectangles isolate raised clubs crossing the generated cell boundaries.
  sourceRects: {
    0: { x: 58, y: 86, width: 251, height: 215 },
    1: { x: 374, y: 87, width: 250, height: 214 },
    2: { x: 690, y: 87, width: 245, height: 214 },
    3: { x: 1001, y: 86, width: 238, height: 215 },
    4: { x: 72, y: 395, width: 244, height: 216 },
    5: { x: 392, y: 394, width: 225, height: 217 },
    6: { x: 708, y: 394, width: 229, height: 217 },
    7: { x: 1006, y: 393, width: 239, height: 218 },
    8: { x: 47, y: 646, width: 233, height: 271 },
    9: { x: 367, y: 629, width: 232, height: 288 },
    10: { x: 673, y: 724, width: 277, height: 205 },
    11: { x: 1010, y: 708, width: 228, height: 209 },
    12: { x: 48, y: 991, width: 236, height: 210 },
    13: { x: 371, y: 925, width: 219, height: 276 },
    14: { x: 692, y: 986, width: 195, height: 242 },
    15: { x: 962, y: 989, width: 250, height: 212 },
  },
} satisfies SpriteGeometry);
