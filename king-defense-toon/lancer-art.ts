import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';
import type { PaletteRank } from './unit-ranks.ts';

// Native Pixel Frog Lancer frames. Recreate with scripts/prepare-lancer-art.mjs.
export const LANCER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({
  1: { sheet: new URL('./assets/lancer/lancer-blue.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-blue-art.webp', import.meta.url).href },
  2: { sheet: new URL('./assets/lancer/lancer-purple.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-purple-art.webp', import.meta.url).href },
  3: { sheet: new URL('./assets/lancer/lancer-red.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-red-art.webp', import.meta.url).href },
  4: { sheet: new URL('./assets/lancer/lancer-yellow.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-yellow-art.webp', import.meta.url).href },
  5: { sheet: new URL('./assets/lancer/lancer-black.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-black-art.webp', import.meta.url).href },
});
export const LANCER_GEOMETRY = {
  "layout": {
    "columns": 6,
    "rows": 6
  },
  "bodyHeight": 0.425,
  "baselines": [
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.9,
    0.8625,
    0.85,
    0.825,
    0.8375,
    0.825,
    0.8,
    0.41875,
    0.41875,
    0.43125,
    0.4125,
    0.41875,
    0.43125,
    0.38125,
    0.39375,
    0.4125,
    0.625,
    0.625,
    0.50625,
    0.85625,
    0.85625,
    0.6875
  ],
  "centers": [
    0.2619047619047619,
    0.26785714285714285,
    0.2619047619047619,
    0.2619047619047619,
    0.25595238095238093,
    0.25,
    0.23809523809523808,
    0.23809523809523808,
    0.24404761904761904,
    0.25,
    0.25595238095238093,
    0.2619047619047619,
    0.2619047619047619,
    0.22023809523809523,
    0.20535714285714285,
    0.27380952380952384,
    0.2916666666666667,
    0.29464285714285715,
    0.12202380952380952,
    0.12202380952380952,
    0.24702380952380953,
    0.12797619047619047,
    0.1636904761904762,
    0.24702380952380953,
    0.11607142857142858,
    0.11607142857142858,
    0.12797619047619047,
    0.1488095238095238,
    0.1488095238095238,
    0.15178571428571427,
    0.14583333333333334,
    0.15178571428571427,
    0.16964285714285715
  ],
  "sourceRects": {
    "0": {
      "x": 0,
      "y": 0,
      "width": 69,
      "height": 150
    },
    "1": {
      "x": 168,
      "y": 0,
      "width": 70,
      "height": 150
    },
    "2": {
      "x": 336,
      "y": 0,
      "width": 69,
      "height": 150
    },
    "3": {
      "x": 504,
      "y": 0,
      "width": 68,
      "height": 150
    },
    "4": {
      "x": 672,
      "y": 0,
      "width": 66,
      "height": 150
    },
    "5": {
      "x": 840,
      "y": 0,
      "width": 65,
      "height": 150
    },
    "6": {
      "x": 0,
      "y": 160,
      "width": 62,
      "height": 150
    },
    "7": {
      "x": 168,
      "y": 160,
      "width": 61,
      "height": 150
    },
    "8": {
      "x": 336,
      "y": 160,
      "width": 62,
      "height": 150
    },
    "9": {
      "x": 504,
      "y": 160,
      "width": 64,
      "height": 150
    },
    "10": {
      "x": 672,
      "y": 160,
      "width": 66,
      "height": 150
    },
    "11": {
      "x": 840,
      "y": 160,
      "width": 68,
      "height": 150
    },
    "12": {
      "x": 0,
      "y": 320,
      "width": 66,
      "height": 144
    },
    "13": {
      "x": 168,
      "y": 320,
      "width": 60,
      "height": 143
    },
    "14": {
      "x": 336,
      "y": 320,
      "width": 55,
      "height": 143
    },
    "15": {
      "x": 504,
      "y": 320,
      "width": 67,
      "height": 140
    },
    "16": {
      "x": 672,
      "y": 320,
      "width": 70,
      "height": 138
    },
    "17": {
      "x": 840,
      "y": 320,
      "width": 70,
      "height": 138
    },
    "18": {
      "x": 0,
      "y": 480,
      "width": 163,
      "height": 73
    },
    "19": {
      "x": 168,
      "y": 480,
      "width": 163,
      "height": 73
    },
    "20": {
      "x": 336,
      "y": 480,
      "width": 150,
      "height": 75
    },
    "21": {
      "x": 504,
      "y": 480,
      "width": 99,
      "height": 135
    },
    "22": {
      "x": 672,
      "y": 480,
      "width": 105,
      "height": 136
    },
    "23": {
      "x": 840,
      "y": 480,
      "width": 104,
      "height": 119
    },
    "24": {
      "x": 0,
      "y": 640,
      "width": 44,
      "height": 151
    },
    "25": {
      "x": 168,
      "y": 640,
      "width": 44,
      "height": 153
    },
    "26": {
      "x": 336,
      "y": 640,
      "width": 47,
      "height": 137
    },
    "27": {
      "x": 504,
      "y": 640,
      "width": 126,
      "height": 106
    },
    "28": {
      "x": 672,
      "y": 640,
      "width": 126,
      "height": 106
    },
    "29": {
      "x": 840,
      "y": 640,
      "width": 110,
      "height": 88
    },
    "30": {
      "x": 0,
      "y": 800,
      "width": 48,
      "height": 143
    },
    "31": {
      "x": 168,
      "y": 800,
      "width": 49,
      "height": 143
    },
    "32": {
      "x": 336,
      "y": 800,
      "width": 52,
      "height": 122
    }
  },
  "compactSourceRects": {
    "0": {
      "x": 0,
      "y": 76,
      "width": 69,
      "height": 74
    }
  }
} satisfies SpriteGeometry;
