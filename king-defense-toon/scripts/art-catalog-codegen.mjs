// Pure source generation keeps catalogue checks independent of local art packs and image writes.

export function rankArtSource(entries) {
  const manifest = Object.entries(entries).map(([type, ranks]) => `  ${type}: {\n${Object.entries(ranks)
    .map(([level, urls]) => `    ${level}: { ${Object.entries(urls).map(([key, url]) => `${key}: new URL('${url}', import.meta.url).href`).join(', ')} },`).join('\n')}\n  },`).join('\n');
  return `import type { RankArtAssets } from './art-types.ts';\n\n`
    + `// Tiny Swords rank palettes, prepared by scripts/prepare-rank-assets.mjs.\n`
    + `export const UNIT_RANK_ASSETS = {\n${manifest}\n} satisfies RankArtAssets;\n`;
}

export function lancerArtSource(colors, metadata) {
  return `import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';\n`
    + `import type { PaletteRank } from './unit-ranks.ts';\n\n`
    + `// Native Pixel Frog Lancer frames. Recreate with scripts/prepare-lancer-art.mjs.\n`
    + `export const LANCER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({\n`
    + colors.map((color, index) => `  ${index + 1}: { sheet: new URL('./assets/lancer/lancer-${color.toLowerCase()}.webp', import.meta.url).href, art: new URL('./assets/lancer/lancer-${color.toLowerCase()}-art.webp', import.meta.url).href },`).join('\n')
    + `\n});\nexport const LANCER_GEOMETRY = ${JSON.stringify(metadata, null, 2)} satisfies SpriteGeometry;\n`;
}

export function goblinHealerGeometrySource(geometry, frames) {
  return `import type { SpriteEffectFrame, SpriteGeometry } from '../../art-types.ts';\n\n`
    + `// Derived from the approved healer frame manifests by prepare-goblin-healer-art.mjs.\n`
    + `export const GOBLIN_HEALER_GEOMETRY = Object.freeze(${JSON.stringify(geometry, null, 2)} satisfies SpriteGeometry);\n`
    + `export const GOBLIN_HEAL_PULSE_FRAMES = Object.freeze(${JSON.stringify(frames.map(({ rect, groundAnchor }) => ({ rect, groundAnchor })), null, 2)} satisfies SpriteEffectFrame[]);\n`;
}
