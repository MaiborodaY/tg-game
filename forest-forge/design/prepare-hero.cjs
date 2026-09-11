// Offline atlas authoring. No rig, parsing, or vector rasterization in the game.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const prehistoric = process.argv.includes('--prehistoric');
const baseV2 = prehistoric || process.argv.includes('--base-v2');
const rig = JSON.parse(fs.readFileSync(path.join(__dirname, baseV2 ? 'hero-base-v2-poses.json' : 'hero-poses.json'), 'utf8'));
const art = fs.readFileSync(path.join(__dirname, baseV2 ? 'hero-base-v2.svg' : 'hero-equipment.svg'), 'utf8') + (prehistoric ? fs.readFileSync(path.join(__dirname, 'prehistoric-equipment.svg'), 'utf8') : '');
function group(id) {
  const start = art.indexOf(`<g id="${id}">`);
  if (start < 0) throw Error(`Missing art: ${id}`);
  const tags = /<g\b[^>]*>|<\/g>/g; tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(art))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return art.slice(start, tags.lastIndex);
  }
  throw Error(`Unclosed art: ${id}`);
}
function posed(id, pose) {
  const tokens = { GRIP: `translate(${pose.anchors?.grip?.join(' ')}) scale(.82)`, SHORTS: pose.shorts, SHORTS_SHADE: pose.shortsShade, SHORTS_SEAM: pose.shortsSeam, BODY: pose.body, CAPE: pose.cape, BACK_ARM: pose.backArm, FRONT_ARM: pose.frontArm, BACK_LEG: pose.backLeg, FRONT_LEG: pose.frontLeg, BACK_HAND:pose.backHand, FRONT_HAND:pose.frontHand };
  return group(id).replace(`id="${id}"`, `id="${id}-${pose.frame}"`).replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key]);
}
function legs(quality, pose) {
  const pieces = [];
  for (const [index, d] of [pose.backLeg, pose.frontLeg].entries()) {
    const points = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const [, , kx, ky, fx, fy] = points;
    const angle = Math.atan2(fy - ky, fx - kx) * 180 / Math.PI - 90;
    const length = Math.hypot(fx - kx, fy - ky);
    const cloth = quality === 0 ? '#604532' : quality === 1 ? '#496463' : '#56506c';
    pieces.push(`<path d="${d}" fill="none" stroke="#142927" stroke-width="16"/><path d="${d}" fill="none" stroke="${cloth}" stroke-width="10"/>`);
    pieces.push(`<g transform="translate(${kx} ${ky}) rotate(${angle}) scale(1 ${length / 20})">${group(`greave-${quality}`).replace(`id="greave-${quality}"`, `id="boot-${quality}-${pose.frame}-${index}"`)}</g>`);
  }
  return `<g id="legs-${quality}-${pose.frame}" transform="${pose.body}" stroke="#142927" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${pieces.join('')}</g>`;
}
(async () => {
  const frames = rig.poses.length;
  if (!baseV2 && frames !== 16) throw Error('Expected sixteen legacy poses');
  if (prehistoric) {
    const slots = ['cape','legs','chest','shoulders','helmet','weapon','gloves'];
    const rows = [...rig.drawOrder, ...slots.flatMap(slot => [0,1,2].map(q => `${slot}-${q}`)), 'head-helmet'];
    const defs = rows.flatMap(id => rig.poses.map(p => {
      const q = Number(id.at(-1));
      if (id === 'head-helmet') {
        let pathIndex=0;
        return posed('head',p).replace(`id="head-${p.frame}"`,`id="head-helmet-${p.frame}"`).replace(/<path\b[^>]*\/>/g,path=>[2,3,4].includes(pathIndex++)?'':path);
      }
      if (id.startsWith('gloves-')) return `<g id="${id}-${p.frame}" transform="${p.body}">${[p.backHand,p.frontHand].map(t => `<g transform="${t}">${group(`glove-${q}`).replace(/ id="[^"]+"/g,'')}</g>`).join('')}</g>`;
      if (id.startsWith('legs-')) {
        const leather = ['#885632','#60412e','#60412e'][q];
        const knees = p.anchors.knees || [[p.anchors.feet[0][0]+15,p.anchors.feet[0][1]-52],[p.anchors.feet[1][0]-15,p.anchors.feet[1][1]-52]];
        const shin = knees.map((k,j) => { const a=p.anchors.feet[j],angle=Math.atan2(a[1]-k[1],a[0]-k[0])*180/Math.PI-90;return `<g transform="translate(${k.join(' ')}) rotate(${angle})">${group(`shin-${q}`).replace(/ id="[^"]+"/g,'')}</g>`; }).join('');
        return `<g id="${id}-${p.frame}"><g fill="${leather}" stroke="#0b151c" stroke-width="12" stroke-linejoin="round"><path d="${p.backLeg}"/><path d="${p.frontLeg}"/></g>${shin}<g transform="${p.body}" stroke="#0b151c" stroke-width="12" stroke-linejoin="round"><path d="${p.shorts}" fill="${q===0?'#dfc296':'#775032'}"/><path d="${p.shortsShade}" fill="${leather}" stroke="none"/></g></g>`;
      }
      return posed(id,p);
    })).join('\n');
    const cells=rows.flatMap((id,row)=>rig.poses.map(p=>`<svg x="${p.frame*320}" y="${row*320}" width="320" height="320" viewBox="${rig.viewBox.join(' ')}" overflow="hidden"><use href="#${id}-${p.frame}"/></svg>`)).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="5120" height="${rows.length*320}"><defs>${defs}</defs>${cells}</svg>`;
    fs.writeFileSync(path.join(root,'assets','hero-prehistoric.svg'),svg);
    // 96px cells keep decoded texture memory below the old hero atlas.
    await sharp(Buffer.from(svg)).resize(16*96,rows.length*96).png({compressionLevel:9}).toFile(path.join(root,'assets','hero-prehistoric.png'));
    const order=q=>[9+q,0,1,2,3,4,12+q,15+q,6,18+q,30,21+q,24+q,5,7,27+q];
    const previews=[0,1,2].map(q=>`<svg x="${q*400}" width="400" height="400" viewBox="${rig.viewBox.join(' ')}">${order(q).map(row=>`<use href="#${rows[row]}-0"/>`).join('')}</svg>`).join('');
    await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="#fffaf0"/><defs>${defs}</defs>${previews}</svg>`)).png().toFile(path.join(root,'qa','prehistoric-sets.png'));
    // Inventory art uses the very same worn pieces, framed to fit a square icon.
    const views={helmet:[575,125,390,390],chest:[650,405,220,165],shoulders:[605,405,290,100],cape:[515,410,200,230],weapon:[880,280,205,300],gloves:[560,480,120,120],legs:[570,560,370,160]};
    for(const slot of slots) for(let q=0;q<3;q++) {
      const [x,y,w,h]=views[slot],size=Math.max(w,h)*1.12,cx=x+w/2,cy=y+h/2;
      const icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx-size/2} ${cy-size/2} ${size} ${size}"><defs>${defs}</defs><use href="#${slot}-${q}-0"/></svg>`;
      // Retain only the referenced piece rather than embedding the full animation definitions.
      const start=defs.indexOf(`<g id="${slot}-${q}-0"`),tags=/<g\b[^>]*>|<\/g>/g;tags.lastIndex=start;let depth=0,end=start,m;
      while((m=tags.exec(defs))){depth+=m[0].startsWith('</')?-1:1;if(!depth){end=tags.lastIndex;break;}}
      fs.writeFileSync(path.join(root,'assets',`${slot}-${q}.svg`),icon.replace(defs,defs.slice(start,end)));
    }
    console.log(JSON.stringify({frames:16,rows:rows.length,cell:96,bytes:fs.statSync(path.join(root,'assets','hero-prehistoric.png')).size}));
    return;
  }
  const rows = baseV2 ? rig.drawOrder : ['body', 'chest-0', 'chest-1', 'chest-2', 'helmet-0', 'helmet-1', 'helmet-2', 'weapon-0', 'weapon-1', 'weapon-2', 'legs-0', 'legs-1', 'legs-2', 'back-forearm', 'gloves-0', 'gloves-1', 'gloves-2', 'cape-0', 'cape-1', 'cape-2', 'shoulders-0', 'shoulders-1', 'shoulders-2'];
  const defs = rows.flatMap(id => rig.poses.map(p => id.startsWith('legs-') ? legs(Number(id.slice(-1)), p) : posed(id, p))).join('\n');
  const cells = rows.flatMap((id, row) => rig.poses.map(p => `<svg x="${p.frame * rig.sourceCell}" y="${row * rig.sourceCell}" width="${rig.sourceCell}" height="${rig.sourceCell}" viewBox="${rig.viewBox.join(' ')}" overflow="hidden"><use href="#${id}-${p.frame}"/></svg>`)).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frames * rig.sourceCell}" height="${rows.length * rig.sourceCell}" viewBox="0 0 ${frames * rig.sourceCell} ${rows.length * rig.sourceCell}"><defs>${defs}</defs>${cells}</svg>`;
  const output = path.join(root, 'assets', baseV2 ? 'hero-base-v2-layers' : 'hero-gear');
  fs.writeFileSync(output + '.svg', svg);
  await sharp(Buffer.from(svg)).resize(frames * rig.pngCell, rows.length * rig.pngCell).png({ compressionLevel: 9 }).toFile(output + '.png');
  if (baseV2) {
    // Flatten the same posed layers once for the lightweight animation preview.
    const flatCells = rig.poses.map(p => `<svg x="${p.frame * rig.sourceCell}" width="${rig.sourceCell}" height="${rig.sourceCell}" viewBox="${rig.viewBox.join(' ')}">${rows.map(id => `<use href="#${id}-${p.frame}"/>`).join('')}</svg>`).join('');
    const flat = `<svg xmlns="http://www.w3.org/2000/svg" width="${frames * rig.sourceCell}" height="${rig.sourceCell}"><defs>${defs}</defs>${flatCells}</svg>`;
    await sharp(Buffer.from(flat)).resize(frames * rig.pngCell, rig.pngCell).png({compressionLevel:9}).toFile(path.join(root,'assets','hero-base-v2.png'));
    console.log(JSON.stringify({frames, layers:rows, png:output+'.png', bytes:fs.statSync(path.join(root,'assets','hero-base-v2.png')).size}));
    return;
  }
  // Inventory icons use the same three set palettes as the worn pieces.
  const palettes = [
    { metal: '#b9c8d5', light: '#eef4f6', dark: '#718697', cloth: '#e33f49', fold: '#a62837', trim: '#d2a36a' },
    { metal: '#7f9b9d', light: '#dceaea', dark: '#4d7174', cloth: '#338a78', fold: '#20574f', trim: '#c6d8d9' },
    { metal: '#8d87b5', light: '#dfdcf2', dark: '#555078', cloth: '#ad668d', fold: '#653f65', trim: '#e5c569' },
  ];
  for (const slot of ['weapon', 'helmet', 'shoulders', 'chest', 'gloves', 'legs', 'cape', 'boots', 'belt', 'necklace', 'ring1', 'ring2']) {
    const source = fs.readFileSync(path.join(root, 'assets', `${slot}.svg`), 'utf8');
    for (const [quality, c] of palettes.entries()) {
      const leather = quality === 0 && ['legs', 'gloves'].includes(slot);
      const colors = {};
      for (const hex of ['#aeb9cb','#cdd6e4','#bcc9d9','#7f9b9d','#885335']) colors[hex] = leather ? '#885335' : c.metal;
      for (const hex of ['#e1e8ef','#e6edf2','#dbe4ed','#e1e8f0','#dceaea']) colors[hex] = leather ? '#d2a36a' : c.light;
      for (const hex of ['#8593a9','#7e8ba3','#8f9aae','#4d7174','#432d26']) colors[hex] = leather ? '#432d26' : c.dark;
      for (const hex of ['#ee3543','#e33f49']) colors[hex] = c.cloth;
      for (const hex of ['#bd2938','#a62837']) colors[hex] = c.fold;
      colors['#d2a36a'] = slot === 'gloves' ? (leather ? '#d2a36a' : c.light) : c.trim;
      const icon = source.replace(/#[\da-f]{6}/gi, hex => colors[hex.toLowerCase()] || hex);
      fs.writeFileSync(path.join(root, 'assets', `${slot}-${quality}.svg`), icon);
    }
  }
  console.log(JSON.stringify({ frames: 16, rows: rows.length, png: output + '.png', bytes: fs.statSync(output + '.png').size }));
})().catch(error => { console.error(error); process.exitCode = 1; });
