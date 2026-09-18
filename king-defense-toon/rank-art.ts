import type { RankArtAssets } from './art-types.ts';

// Native Tiny Swords palettes, prepared by scripts/prepare-rank-assets.mjs.
export const UNIT_RANK_ASSETS = {
  swordsman: {
    2: { sheet: new URL('./assets/ranks/swordsman-purple-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/swordsman-purple-art.png', import.meta.url).href },
    3: { sheet: new URL('./assets/ranks/swordsman-red-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/swordsman-red-art.png', import.meta.url).href },
    4: { sheet: new URL('./assets/ranks/swordsman-yellow-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/swordsman-yellow-art.png', import.meta.url).href },
  },
  archer: {
    2: { sheet: new URL('./assets/ranks/archer-purple-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/archer-purple-art.png', import.meta.url).href },
    3: { sheet: new URL('./assets/ranks/archer-red-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/archer-red-art.png', import.meta.url).href },
    4: { sheet: new URL('./assets/ranks/archer-yellow-sheet.png', import.meta.url).href, art: new URL('./assets/ranks/archer-yellow-art.png', import.meta.url).href },
  },
  healer: {
    2: { sheet: new URL('./assets/ranks/healer-purple-sheet.png', import.meta.url).href, walk: new URL('./assets/ranks/healer-purple-walk.png', import.meta.url).href, cast: new URL('./assets/ranks/healer-purple-cast.png', import.meta.url).href, art: new URL('./assets/ranks/healer-purple-art.png', import.meta.url).href },
    3: { sheet: new URL('./assets/ranks/healer-red-sheet.png', import.meta.url).href, walk: new URL('./assets/ranks/healer-red-walk.png', import.meta.url).href, cast: new URL('./assets/ranks/healer-red-cast.png', import.meta.url).href, art: new URL('./assets/ranks/healer-red-art.png', import.meta.url).href },
    4: { sheet: new URL('./assets/ranks/healer-yellow-sheet.png', import.meta.url).href, walk: new URL('./assets/ranks/healer-yellow-walk.png', import.meta.url).href, cast: new URL('./assets/ranks/healer-yellow-cast.png', import.meta.url).href, art: new URL('./assets/ranks/healer-yellow-art.png', import.meta.url).href },
  },
} satisfies RankArtAssets;
