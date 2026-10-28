import type { SheetArtUrls, SpriteGeometry, SpriteRect } from './art-types.ts';
import type { PaletteRank } from './unit-ranks.ts';
import type { Point } from './field.ts';

// Generated from approved glaive-v2 rectangles and anchors. Body height excludes the raised weapon.
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
  "bodyHeight": 0.859375,
  "baselines": [
    0.9765625,
    0.9765625,
    0.9765625,
    0.9765625,
    0.953125,
    0.953125,
    0.953125,
    0.953125,
    0.9453125,
    0.9453125,
    0.9453125,
    0.9453125,
    0.8828125,
    0.8828125,
    0.8828125,
    0.8828125
  ],
  "centers": [
    0.515625,
    0.5078125,
    0.515625,
    0.515625,
    0.515625,
    0.515625,
    0.5,
    0.515625,
    0.515625,
    0.515625,
    0.515625,
    0.53125,
    0.5859375,
    0.5703125,
    0.546875,
    0.53125
  ],
  "sourceRects": {
    "0": {
      "x": 0,
      "y": 0,
      "width": 129,
      "height": 130
    },
    "1": {
      "x": 129,
      "y": 0,
      "width": 126,
      "height": 130
    },
    "2": {
      "x": 255,
      "y": 0,
      "width": 127,
      "height": 130
    },
    "3": {
      "x": 382,
      "y": 0,
      "width": 130,
      "height": 130
    },
    "4": {
      "x": 0,
      "y": 130,
      "width": 126,
      "height": 126
    },
    "5": {
      "x": 126,
      "y": 130,
      "width": 128,
      "height": 126
    },
    "6": {
      "x": 254,
      "y": 130,
      "width": 130,
      "height": 126
    },
    "7": {
      "x": 384,
      "y": 130,
      "width": 128,
      "height": 126
    },
    "8": {
      "x": 0,
      "y": 256,
      "width": 131,
      "height": 126
    },
    "9": {
      "x": 131,
      "y": 256,
      "width": 127,
      "height": 126
    },
    "10": {
      "x": 258,
      "y": 256,
      "width": 126,
      "height": 126
    },
    "11": {
      "x": 384,
      "y": 256,
      "width": 128,
      "height": 126
    },
    "12": {
      "x": 0,
      "y": 382,
      "width": 128,
      "height": 130
    },
    "13": {
      "x": 128,
      "y": 382,
      "width": 124,
      "height": 130
    },
    "14": {
      "x": 252,
      "y": 382,
      "width": 126,
      "height": 130
    },
    "15": {
      "x": 378,
      "y": 382,
      "width": 134,
      "height": 130
    }
  }
} satisfies SpriteGeometry;

export const PANTHER_RIDER_RENDER_HEIGHT = 47 * 1.15;
export const PANTHER_RIDER_RELEASE_OFFSETS = {
  "10": {
    "x": 15.723636363636363,
    "y": -33.904090909090904
  },
  "14": {
    "x": -14.74090909090909,
    "y": -36.85227272727273
  }
} satisfies Record<number, Point>;
export const MOON_GLAIVE_IMAGE_URL = new URL('./assets/panther-rider/moon-glaive.webp?no-inline', import.meta.url).href;
export const MOON_GLAIVE_FRAMES = [
  {
    "rect": {
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64
    },
    "centerAnchor": {
      "x": 37,
      "y": 36
    }
  },
  {
    "rect": {
      "x": 64,
      "y": 0,
      "width": 64,
      "height": 64
    },
    "centerAnchor": {
      "x": 28,
      "y": 36
    }
  },
  {
    "rect": {
      "x": 0,
      "y": 64,
      "width": 64,
      "height": 64
    },
    "centerAnchor": {
      "x": 36,
      "y": 29
    }
  },
  {
    "rect": {
      "x": 64,
      "y": 64,
      "width": 64,
      "height": 64
    },
    "centerAnchor": {
      "x": 28,
      "y": 30
    }
  }
] satisfies readonly { rect: SpriteRect; centerAnchor: Point }[];
