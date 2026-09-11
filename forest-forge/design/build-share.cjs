// Keep editable PNG art; encode lossless WebP only in the shareable build.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');

(async () => {
  const sources = new Set(JSON.parse(await fs.readFile(path.join(__dirname, 'build-inputs.json'), 'utf8')));
  await fs.mkdir(path.join(root, 'qa'), {recursive:true});
  // dist is a generated directory inside this package.
  await fs.rm(path.join(root, 'dist'), {recursive:true, force:true});
  for (const set of await fs.readdir(path.join(root, 'assets/sets'))) {
    for (const name of await fs.readdir(path.join(root, 'assets/sets', set))) {
      if (/^(atlas\.(png|json)|shoot-atlas\.png|weapon-atlas\.png)$|-icon\.png$/.test(name)) sources.add(`assets/sets/${set}/${name}`);
    }
  }
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
