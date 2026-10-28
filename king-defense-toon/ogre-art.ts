import type { SpriteGeometry } from './art-types.ts';

export const OGRE_IMAGE_URL = new URL('./assets/web/ogre-boss.webp', import.meta.url).href;

const sourceCell = 1254 / 4;
export const OGRE_GEOMETRY = Object.freeze({
  bodyHeight: 190 / sourceCell,
  // Ground anchors follow feet, not the club, which extends below them during a slam.
  baselines: [
    263, 263, 264, 264,
    260.5, 260.5, 261.5, 260.5,
    241, 241, 239, 241,
    227, 227, 221, 226,
  ].map(y => y / sourceCell),
  centers: [
    166, 166.5, 164, 160,
    164, 164, 162, 156,
    177, 177, 143, 163,
    174, 180, 160, 166,
  ].map(x => x / sourceCell),
} satisfies SpriteGeometry);
