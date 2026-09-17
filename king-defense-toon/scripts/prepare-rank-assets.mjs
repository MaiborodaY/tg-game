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

for (const [offset, color] of ['Purple', 'Red', 'Yellow'].entries()) {
  const level = offset + 2;
  const sources = {
    swordsman: { sheet: `${troops}/Warrior/${color}/Warrior_${color}.png` },
    // The author named the Purple archer file "Purlple" in this release.
    archer: { sheet: `${troops}/Archer/${color}/Archer_${color === 'Purple' ? 'Purlple' : color}.png` },
    healer: Object.fromEntries([['sheet', 'Idle'], ['walk', 'Run'], ['cast', 'Heal']]
      .map(([key, strip]) => [key, `${monks}/${color} Units/Monk/${strip}.png`])),
  };
  for (const [type, strips] of Object.entries(sources)) {
    const urls = {};
    for (const [action, source] of Object.entries(strips)) {
      const filename = `${type}-${color.toLowerCase()}-${action}.png`;
      const destination = path.join(output, filename);
      await copyFile(source, destination);
      const hash = digest(await readFile(source));
      if (hash !== digest(await readFile(destination))) throw new Error(`Copy mismatch: ${filename}`);
      urls[action] = `./assets/ranks/${filename}`;
      provenance.push(`| ${filename} | ${hash} |`);
    }
    const art = `${type}-${color.toLowerCase()}-art.png`;
    // Menu-only first-frame crop; the animation sheets remain byte-for-byte originals.
    const frame = await sharp(strips.sheet).extract({ left: 0, top: 0, width: 192, height: 192 }).png().toBuffer();
    await sharp(frame).trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(path.join(output, art));
    urls.art = `./assets/ranks/${art}`;
    entries[type][level] = urls;
  }
}

const manifest = Object.entries(entries).map(([type, ranks]) => `  ${type}: {\n${Object.entries(ranks)
  .map(([level, urls]) => `    ${level}: { ${Object.entries(urls).map(([key, url]) => `${key}: new URL('${url}', import.meta.url).href`).join(', ')} },`).join('\n')}\n  },`).join('\n');
await writeFile(path.join(root, 'rank-art.mjs'), `// Native Tiny Swords palettes, prepared by scripts/prepare-rank-assets.mjs.\nexport const UNIT_RANK_ASSETS = {\n${manifest}\n};\n`);
await writeFile(path.join(output, 'SOURCES.md'), `# Native unit rank colors

Pixel Frog's existing Blue, Purple, Red and Yellow palettes represent levels 1–4.
Blue uses the existing game sheets. Levels 2–4 are unchanged copies from the user's packs:

- Warrior and Archer: \`${troops}/<Unit>/<Color>/\`.
- Monk Idle/Run/Heal: \`${monks}/<Color> Units/Monk/\`.
- Purple archer source filename: \`Archer_Purlple.png\`.

All variants have the same frame dimensions and alpha maps as Blue. Only the author's
clothing palette differs (three RGB values for Warrior/Archer, two for Monk). Skin,
weapons, shadows, silhouettes, frames and timing are retained. King and enemies are unchanged.
The menu art files are tight first-frame crops. No generated art or runtime recoloring is used.
The source packs are never modified. Run \`node king-defense-toon/scripts/prepare-rank-assets.mjs\`
from the worktree root to recreate copies, menu crops and the URL manifest.

| Runtime animation file | Source and copy SHA-256 |
| --- | --- |
${provenance.join('\n')}
`);
console.log('Prepared 15 unchanged native animation sheets and 9 first-frame menu crops.');
