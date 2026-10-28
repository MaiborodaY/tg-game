import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';
import type { PaletteRank } from './unit-ranks.ts';

// Generated from the approved 512px crops and foot anchors; source artwork is untouched.
export const ELF_ARCHER_RENDER_HEIGHT = 38;
export const ELF_ARCHER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({
  1: { sheet: new URL('./assets/elf-archer/elf-archer-green.webp', import.meta.url).href, art: new URL('./assets/recruitment/elf-archer.webp', import.meta.url).href },
  2: { sheet: new URL('./assets/elf-archer/elf-archer-purple.webp', import.meta.url).href, art: new URL('./assets/elf-archer/elf-archer-purple-art.webp', import.meta.url).href },
  3: { sheet: new URL('./assets/elf-archer/elf-archer-red.webp', import.meta.url).href, art: new URL('./assets/elf-archer/elf-archer-red-art.webp', import.meta.url).href },
  4: { sheet: new URL('./assets/elf-archer/elf-archer-gold.webp', import.meta.url).href, art: new URL('./assets/elf-archer/elf-archer-gold-art.webp', import.meta.url).href },
  5: { sheet: new URL('./assets/elf-archer/elf-archer-black.webp', import.meta.url).href, art: new URL('./assets/elf-archer/elf-archer-black-art.webp', import.meta.url).href },
});

export const ELF_ARCHER_GEOMETRY = {
  "layout": {
    "columns": 4,
    "rows": 4
  },
  "bodyHeight": 0.796875,
  "baselines": [
    1.015625,
    1.015625,
    1.015625,
    1.015625,
    0.9375,
    0.9453125,
    0.9375,
    0.9453125,
    0.875,
    0.875,
    0.890625,
    0.8828125,
    0.75,
    0.7578125,
    0.75,
    0.765625
  ],
  "centers": [
    0.546875,
    0.5234375,
    0.5,
    0.484375,
    0.546875,
    0.5234375,
    0.5,
    0.484375,
    0.5546875,
    0.515625,
    0.5078125,
    0.4921875,
    0.5078125,
    0.5234375,
    0.5,
    0.4921875
  ],
  "sourceRects": {
    "0": {
      "x": 0,
      "y": 0,
      "width": 136,
      "height": 138
    },
    "1": {
      "x": 136,
      "y": 0,
      "width": 126,
      "height": 138
    },
    "2": {
      "x": 262,
      "y": 0,
      "width": 124,
      "height": 138
    },
    "3": {
      "x": 386,
      "y": 0,
      "width": 126,
      "height": 138
    },
    "4": {
      "x": 0,
      "y": 138,
      "width": 135,
      "height": 119
    },
    "5": {
      "x": 135,
      "y": 138,
      "width": 127,
      "height": 119
    },
    "6": {
      "x": 262,
      "y": 138,
      "width": 125,
      "height": 119
    },
    "7": {
      "x": 387,
      "y": 138,
      "width": 125,
      "height": 119
    },
    "8": {
      "x": 0,
      "y": 257,
      "width": 136,
      "height": 118
    },
    "9": {
      "x": 136,
      "y": 257,
      "width": 126,
      "height": 118
    },
    "10": {
      "x": 262,
      "y": 257,
      "width": 126,
      "height": 118
    },
    "11": {
      "x": 388,
      "y": 257,
      "width": 124,
      "height": 118
    },
    "12": {
      "x": 0,
      "y": 375,
      "width": 132,
      "height": 137
    },
    "13": {
      "x": 132,
      "y": 375,
      "width": 127,
      "height": 137
    },
    "14": {
      "x": 259,
      "y": 375,
      "width": 125,
      "height": 137
    },
    "15": {
      "x": 384,
      "y": 375,
      "width": 128,
      "height": 137
    }
  }
} satisfies SpriteGeometry;
