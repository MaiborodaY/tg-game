import { rankArtSource } from './art-catalog-codegen.mjs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const pack = 'C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2';
const troops = `${pack}/Tiny Swords2/Tiny Swords (Update 010)/Factions/Knights/Troops`;
const monks = `${pack}/Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/Units`;
const output = path.join(root, 'assets/ranks');
await mkdir(output, { recursive: true });
const entries = { swordsman: {}, archer: {}, healer: {} };
const provenance = [];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
// Update 010 has no Black variant. Preserve its newer frames and replace only
// the three authored clothing colors with shades from the native Black unit palette.
const blackClothing = new Map([
  ['64,78,117', [67,64,85]],
  ['62,134,152', [94,111,134]],
  ['90,179,172', [140,150,149]],
]);

for (const [offset, color] of ['Purple', 'Red', 'Yellow', 'Black'].entries()) {
  const level = offset + 2;
  const sources = {
    swordsman: { sheet: color === 'Black' ? path.join(root, 'assets/tiny-swords-warrior-blue.png')
      : `${troops}/Warrior/${color}/Warrior_${color}.png` },
    // The author named the Purple archer file "Purlple" in this release.
    archer: { sheet: color === 'Black' ? path.join(root, 'assets/tiny-swords-archer-blue.png')
      : `${troops}/Archer/${color}/Archer_${color === 'Purple' ? 'Purlple' : color}.png` },
    healer: Object.fromEntries([['sheet', 'Idle'], ['walk', 'Run'], ['cast', 'Heal']]
      .map(([key, strip]) => [key, `${monks}/${color} Units/Monk/${strip}.png`])),
  };
  for (const [type, strips] of Object.entries(sources)) {
    const urls = {};
    for (const [action, source] of Object.entries(strips)) {
      const filename = `${type}-${color.toLowerCase()}-${action}.png`;
      const destination = path.join(output, filename);
      const preparedBlack = color === 'Black' && type !== 'healer';
      if (preparedBlack) {
        const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let index = 0; index < data.length; index += 4) {
          if (!data[index + 3]) continue;
          const replacement = blackClothing.get(`${data[index]},${data[index + 1]},${data[index + 2]}`);
          if (replacement) data.set(replacement, index);
        }
        await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
          .png({ compressionLevel: 9 }).toFile(destination);
      } else await copyFile(source, destination);
      const hash = digest(await readFile(source));
      const outputHash = digest(await readFile(destination));
      if (!preparedBlack && hash !== outputHash) throw new Error(`Copy mismatch: ${filename}`);
      urls[action] = `./assets/ranks/${filename}`;
      provenance.push(`| ${filename} | ${hash} | ${outputHash} |`);
    }
    const art = `${type}-${color.toLowerCase()}-art.png`;
    // Menu-only first-frame crop; the animation sheets remain byte-for-byte originals.
    const frame = await sharp(path.join(root, urls.sheet)).extract({ left: 0, top: 0, width: 192, height: 192 }).png().toBuffer();
    await sharp(frame).trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(path.join(output, art));
    urls.art = `./assets/ranks/${art}`;
    entries[type][level] = urls;
  }
}

await writeFile(path.join(root, 'rank-art.ts'), rankArtSource(entries));
await writeFile(path.join(output, 'SOURCES.md'), `# Unit rank colors

Five palettes cover personal levels 1–49 (Blue), 50–99 (Purple), 100–249 (Red),
250–499 (Yellow), and 500+ (Black). Blue uses the existing game sheets.
Purple, Red, Yellow and the Black Monk are unchanged copies from the user's packs:

- Warrior and Archer: \`${troops}/<Unit>/<Color>/\`.
- Monk Idle/Run/Heal: \`${monks}/<Color> Units/Monk/\`.
- Purple archer source filename: \`Archer_Purlple.png\`.

Update 010 has no Black Warrior/Archer. Their Black sheets retain the current Blue
frames, replacing only clothing RGB 64,78,117 / 62,134,152 / 90,179,172 with
67,64,85 / 94,111,134 / 140,150,149 from the native Black unit palette. The older
Black Warrior/Archer frames are deliberately not substituted for the current animations.

All variants retain Blue frame dimensions and alpha maps. Skin, weapons, shadows,
silhouettes, frames and timing are retained. King and enemies are unchanged.
Menu art files are tight first-frame crops. No generated art or runtime recoloring is used.
The source packs are never modified. Run \`node king-defense-toon/scripts/prepare-rank-assets.mjs\`
from the worktree root to recreate copies, menu crops and the URL manifest.

| Runtime animation file | Source SHA-256 | Output SHA-256 |
| --- | --- | --- |
${provenance.join('\n')}
`);
console.log('Prepared 18 native sheets, 2 Black clothing variants and 12 first-frame menu crops.');
