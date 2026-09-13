// Keep editable PNG art; encode lossless WebP only in the shareable build.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');

(async () => {
  const {WEAPONS} = await import(require('node:url').pathToFileURL(path.join(root, 'game.mjs')).href);
  const packedWeapons = new Set();
  const sources = new Set(JSON.parse(await fs.readFile(path.join(__dirname, 'build-inputs.json'), 'utf8')));
  await fs.mkdir(path.join(root, 'qa'), {recursive:true});
  // dist is a generated directory inside this package.
  await fs.rm(path.join(root, 'dist'), {recursive:true, force:true});
  // Trim only transparent margins; all sixteen poses keep their original pixels.
  const enemyFrames = {};
  for (const kind of ['warrior', 'archer', 'boss', 'healer']) {
    const {data, info} = await sharp(path.join(root, `assets/enemy-${kind}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const cell = 192, frames = 16, columns = 4;
    if (info.width !== cell * frames || info.height !== cell) throw Error(`Invalid enemy atlas: ${kind}`);
    let left = cell, top = cell, right = -1, bottom = -1;
    for (let y = 0; y < cell; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3]) {
      left = Math.min(left, x % cell); top = Math.min(top, y);
      right = Math.max(right, x % cell); bottom = Math.max(bottom, y);
    }
    if (right < left) throw Error(`Empty enemy atlas: ${kind}`);
    // Preserve the source sampling grid when browsers minify the sprites.
    left = Math.max(0, Math.floor((left - 2) / 4) * 4); top = Math.max(0, Math.floor((top - 2) / 4) * 4);
    const width = Math.min(cell, Math.ceil((right + 3) / 4) * 4) - left, height = Math.min(cell, Math.ceil((bottom + 3) / 4) * 4) - top;
    const pixels = Buffer.alloc(width * columns * height * (frames / columns) * 4);
    for (let frame = 0; frame < frames; frame++) for (let y = 0; y < height; y++) {
      const from = ((top + y) * info.width + frame * cell + left) * 4;
      const to = ((Math.floor(frame / columns) * height + y) * width * columns + frame % columns * width) * 4;
      data.copy(pixels, to, from, from + width * 4);
    }
    const source = `assets/enemy-${kind}-sheet.png`;
    await sharp(pixels, {raw:{width:width * columns, height:height * (frames / columns), channels:4}}).png().toFile(path.join(root, source));
    sources.add(source);
    enemyFrames[kind] = {x:left, y:top, width, height, columns};
  }
  await fs.writeFile(path.join(root, 'assets/enemy-atlas.json'), JSON.stringify(enemyFrames, null, 2) + '\n');
  for (const set of await fs.readdir(path.join(root, 'assets/sets'))) {
    const folder = path.join(root, 'assets/sets', set);
    for (const name of await fs.readdir(folder)) {
      if (/^atlas\.json$|-icon\.png$/.test(name)) sources.add(`assets/sets/${set}/${name}`);
    }
    const meta = JSON.parse(await fs.readFile(path.join(folder, 'atlas.json'), 'utf8'));
    const normal = await sharp(path.join(folder, 'atlas.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const shot = await sharp(path.join(folder, 'shoot-atlas.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const cell = meta.cell;
    meta.shootFrames = shot.info.width / cell;
    if (normal.info.width !== meta.frames * cell || normal.info.height !== meta.rows.length * cell ||
        !Number.isInteger(meta.shootFrames) || shot.info.height !== meta.shootRows.length * cell) throw Error(`Invalid armor atlas: ${set}`);
    const groups = Object.fromEntries(Object.entries(meta.slots).map(([slot, rows]) => [slot, [...rows.map(r => meta.rows[r]), ...(slot === 'helmet' ? ['head-helmet'] : [])]]));
    if (set === 'hunter-hides') groups.body = meta.rows.filter((name, row) => name !== 'head-helmet' && !Object.values(meta.slots).some(rows => rows.includes(row)));
    meta.packed = {};
    for (const [slot, rows] of Object.entries(groups)) {
      const columns = slot === 'body' ? 16 : 8, width = columns * cell;
      const shootRows = meta.shootRows.filter(name => rows.includes(name));
      const height = Math.ceil((rows.length * meta.frames + shootRows.length * meta.shootFrames) / columns) * cell;
      const pixels = Buffer.alloc(width * height * 4);
      let index = 0;
      for (const [names, allRows, atlas, frames] of [[rows, meta.rows, normal, meta.frames], [shootRows, meta.shootRows, shot, meta.shootFrames]]) {
        for (const name of names) for (let f = 0; f < frames; f++, index++) for (let y = 0; y < cell; y++) {
          const from = ((allRows.indexOf(name) * cell + y) * atlas.info.width + f * cell) * 4;
          const to = ((Math.floor(index / columns) * cell + y) * width + index % columns * cell) * 4;
          atlas.data.copy(pixels, to, from, from + cell * 4);
        }
      }
      const source = `assets/sets/${set}/${slot}-sheet.png`;
      await sharp(pixels, {raw:{width,height,channels:4}}).png().toFile(path.join(root, source));
      sources.add(source); meta.packed[slot] = {columns, rows, shootRows};
    }
    await fs.writeFile(path.join(folder, 'atlas.json'), JSON.stringify(meta, null, 2) + '\n');
  }
  // Split source weapon rows before shipping; retain every original RGBA pixel.
  for (const set of new Set(Object.values(WEAPONS).filter(w => w.sprite).map(w => w.atlas || 'hunter-hides'))) {
    const folder = path.join(root, 'assets/sets', set);
    const meta = JSON.parse(await fs.readFile(path.join(folder, 'atlas.json'), 'utf8'));
    const {data, info} = await sharp(path.join(folder, 'weapon-atlas.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const cell = meta.cell, frames = info.width / cell, width = 8 * cell, height = Math.ceil(frames / 8) * cell;
    if (!Number.isInteger(frames) || info.height !== meta.weaponRows.length * cell) throw Error(`Invalid weapon atlas: ${set}`);
    for (const [row, id] of meta.weaponRows.entries()) {
      if (!WEAPONS[id]?.sprite || (WEAPONS[id].atlas || 'hunter-hides') !== set) continue;
      const pixels = Buffer.alloc(width * height * 4);
      for (let frame = 0; frame < frames; frame++) for (let y = 0; y < cell; y++) {
        const from = ((row * cell + y) * info.width + frame * cell) * 4;
        const to = ((Math.floor(frame / 8) * cell + y) * width + frame % 8 * cell) * 4;
        data.copy(pixels, to, from, from + cell * 4);
      }
      const source = `assets/weapons/${id}-atlas.png`;
      await sharp(pixels, {raw:{width,height,channels:4}}).png().toFile(path.join(root, source));
      sources.add(source); packedWeapons.add(id);
    }
  }
  for (const [id, weapon] of Object.entries(WEAPONS)) if (weapon.sprite && !packedWeapons.has(id)) throw Error(`Missing weapon frames: ${id}`);
  for (const name of await fs.readdir(path.join(root, 'assets/weapons'))) {
    if (name.endsWith('-icon.png')) sources.add(`assets/weapons/${name}`);
  }
  for (const biome of await fs.readdir(path.join(root, 'assets/biomes'))) {
    sources.add(`assets/biomes/${biome}/enemies.png`);
    sources.add(`assets/biomes/${biome}/enemies.json`);
    sources.add(`assets/biomes/${biome}/scenery.svg`);
  }
  const files = [], images = [];
  let before = 0, after = 0;
  for (const source of [...sources].sort()) {
    let output = await fs.readFile(path.join(root, source));
    const originalBytes = output.length;
    const target = source.replace(/\.png$/, '.webp');
    if (source.endsWith('.png')) {
      const original = await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      output = await sharp(output).webp({lossless:true, effort:6}).toBuffer();
      const decoded = await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      if (original.info.width !== decoded.info.width || original.info.height !== decoded.info.height) throw Error(`Dimensions changed: ${source}`);
      // RGB under fully transparent pixels is invisible and may be discarded by WebP.
      for (let i = 0; i < original.data.length; i += 4) {
        if (original.data[i+3] !== decoded.data[i+3] || (original.data[i+3] &&
          (original.data[i] !== decoded.data[i] || original.data[i+1] !== decoded.data[i+1] || original.data[i+2] !== decoded.data[i+2]))) throw Error(`Visible pixel changed: ${source}`);
      }
      images.push({source, target, before:originalBytes, after:output.length, width:original.info.width, height:original.info.height, identicalVisiblePixels:true});
    } else if (source === 'app.mjs' || source === 'scene.mjs') {
      output = Buffer.from(output.toString('utf8').replaceAll('.png', '.webp'));
    }
    const destination = path.join(root, 'dist', target);
    await fs.mkdir(path.dirname(destination), {recursive:true});
    await fs.writeFile(destination, output);
    // Remove only the old published PNG counterpart, never source art.
    if (target !== source) await fs.rm(path.join(root, 'dist', source), {force:true});
    const sha256 = crypto.createHash('sha256').update(output).digest('hex');
    const type = {'.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mjs':'application/javascript','.css':'text/css','.html':'text/html','.ttf':'font/ttf'}[path.extname(target)] || 'application/octet-stream';
    files.push({path:'/'+target, hash:sha256.slice(0,32), sha256, size:output.length, type});
    before += originalBytes; after += output.length;
  }
  await fs.writeFile(path.join(root, 'qa/cloudflare-files.json'), JSON.stringify(files, null, 2));
  await fs.writeFile(path.join(root, 'qa/cloudflare-manifest.json'), JSON.stringify(Object.fromEntries(files.map(f => [f.path,{hash:f.hash,size:f.size}])), null, 2));
  await fs.writeFile(path.join(root, 'qa/webp-build.json'), JSON.stringify({before, after, savedPercent:100*(1-after/before), files:files.length, images}, null, 2));
  console.log(JSON.stringify({before, after, images:images.length, files:files.length, savedPercent:Math.round(100*(1-after/before))}));
})().catch(error => {console.error(error); process.exitCode = 1;});
