import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';
import type { PaletteRank } from './unit-ranks.ts';

// Generated from the supplied frame rectangles/foot anchors; original artwork is untouched.
export const PANTHER_RIDER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({
  1: { sheet: new URL('./assets/panther-rider/panther-rider-green.webp', import.meta.url).href, art: new URL('./assets/recruitment/panther-rider.webp', import.meta.url).href },
  2: { sheet: new URL('./assets/panther-rider/panther-rider-purple.webp', import.meta.url).href, art: new URL('./assets/panther-rider/panther-rider-purple-art.webp', import.meta.url).href },
  3: { sheet: new URL('./assets/panther-rider/panther-rider-red.webp', import.meta.url).href, art: new URL('./assets/panther-rider/panther-rider-red-art.webp', import.meta.url).href },
  4: { sheet: new URL('./assets/panther-rider/panther-rider-gold.webp', import.meta.url).href, art: new URL('./assets/panther-rider/panther-rider-gold-art.webp', import.meta.url).href },
  5: { sheet: new URL('./assets/panther-rider/panther-rider-black.webp', import.meta.url).href, art: new URL('./assets/panther-rider/panther-rider-black-art.webp', import.meta.url).href },
});

export const PANTHER_RIDER_GEOMETRY = {
  "layout": {
    "columns": 4,
    "rows": 4
  },
  "bodyHeight": 0.5625,
  "baselines": [
    0.8541666666666666,
    0.8541666666666666,
    0.8541666666666666,
    0.8541666666666666,
    0.828125,
    0.828125,
    0.8385416666666666,
    0.828125,
    0.8229166666666666,
    0.8229166666666666,
    0.828125,
    0.8229166666666666,
    0.7760416666666666,
    0.7760416666666666,
    0.7760416666666666,
    0.7760416666666666
  ],
  "centers": [
    0.5,
    0.5,
    0.5,
    0.5,
    0.5,
    0.5052083333333334,
    0.5104166666666666,
    0.5052083333333334,
    0.5,
    0.5104166666666666,
    0.515625,
    0.5104166666666666,
    0.4895833333333333,
    0.5104166666666666,
    0.4947916666666667,
    0.5104166666666666
  ],
  "sourceRects": {
    "0": {
      "x": 0,
      "y": 0,
      "width": 194,
      "height": 201
    },
    "1": {
      "x": 194,
      "y": 0,
      "width": 191,
      "height": 201
    },
    "2": {
      "x": 385,
      "y": 0,
      "width": 191,
      "height": 201
    },
    "3": {
      "x": 576,
      "y": 0,
      "width": 192,
      "height": 201
    },
    "4": {
      "x": 0,
      "y": 201,
      "width": 193,
      "height": 187
    },
    "5": {
      "x": 193,
      "y": 201,
      "width": 194,
      "height": 187
    },
    "6": {
      "x": 387,
      "y": 201,
      "width": 194,
      "height": 187
    },
    "7": {
      "x": 581,
      "y": 201,
      "width": 187,
      "height": 187
    },
    "8": {
      "x": 0,
      "y": 388,
      "width": 192,
      "height": 185
    },
    "9": {
      "x": 192,
      "y": 388,
      "width": 193,
      "height": 185
    },
    "10": {
      "x": 385,
      "y": 388,
      "width": 200,
      "height": 185
    },
    "11": {
      "x": 585,
      "y": 388,
      "width": 183,
      "height": 185
    },
    "12": {
      "x": 0,
      "y": 573,
      "width": 192,
      "height": 195
    },
    "13": {
      "x": 192,
      "y": 573,
      "width": 190,
      "height": 195
    },
    "14": {
      "x": 382,
      "y": 573,
      "width": 199,
      "height": 195
    },
    "15": {
      "x": 581,
      "y": 573,
      "width": 187,
      "height": 195
    }
  }
} satisfies SpriteGeometry;
