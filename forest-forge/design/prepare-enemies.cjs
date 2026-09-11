// Asset preparation only; never loaded by the game. User authorized background removal.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');

(async () => {
  const report = [];
  if (process.argv[2] === '--biomes') {
    const base = path.join(__dirname, 'biomes');
    const ids = process.argv.slice(3).length ? process.argv.slice(3) : fs.readdirSync(base).filter(id => fs.existsSync(path.join(base,id,'enemies-source.png')));
    for (const id of ids) {
      const {data,info} = await sharp(path.join(base,id,'enemies-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      if (!data.some((value,i) => i%4===3 && value===0)) throw Error(`${id}: expected transparent source`);
      // Extract whole silhouettes, including attacks crossing the nominal grid.
      const count=info.width*info.height,labels=new Int32Array(count),queue=new Int32Array(count),poses=new Array(32);
      let label=0;
      for(let p=0;p<count;p++){
        if(labels[p]||data[p*4+3]<24)continue;
        label++;let read=0,write=1,left=info.width,top=info.height,right=0,bottom=0,sumX=0,sumY=0;
        queue[0]=p;labels[p]=label;
        while(read<write){
          const n=queue[read++],x=n%info.width,y=Math.floor(n/info.width);
          left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);sumX+=x;sumY+=y;
          for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
            const nx=x+dx,ny=y+dy;
            if(nx<0||nx>=info.width||ny<0||ny>=info.height)continue;
            const v=ny*info.width+nx;
            if(!labels[v]&&data[v*4+3]>=24){labels[v]=label;queue[write++]=v;}
          }
        }
        if(write<500)continue;
        const row=Math.min(3,Math.floor(sumY/write/(info.height/4))),col=Math.min(7,Math.floor(sumX/write/(info.width/8))),slot=row*8+col;
        if(!poses[slot]||poses[slot].area<write)poses[slot]={label,left,top,right,bottom,area:write};
      }
      if(poses.filter(Boolean).length!==32)throw Error(`${id}: expected 32 separate complete creatures, got ${poses.filter(Boolean).length}`);
      if(poses.some(f=>f.left<2||f.top<2||f.right>info.width-3||f.bottom>info.height-3))throw Error(`${id}: creature touches source edge; regenerate with more padding`);
      const layers = [], rows = [];
      for (let row=0;row<4;row++) {
        const frames = poses.slice(row*8,row*8+8);
        for(const [col,f] of frames.entries()){
          let sum=0,pixels=0;
          // Grounded body centre stays stable when a weapon extends outwards.
          for(let y=Math.floor(f.bottom-(f.bottom-f.top)*.22);y<=f.bottom;y++)for(let x=f.left;x<=f.right;x++){
            if(labels[y*info.width+x]===f.label){sum+=x;pixels++;}
          }
          f.anchor=col===7?(f.left+f.right)/2:sum/pixels;
        }
        // One scale per creature across idle, walking, attacking and defeat.
        const scale=Math.min(168/Math.max(...frames.map(f=>f.bottom-f.top+1)),84/Math.max(...frames.map(f=>f.anchor-f.left)),84/Math.max(...frames.map(f=>f.right-f.anchor)));
        for(const [col,f] of frames.entries()){
          const width=f.right-f.left+1,height=f.bottom-f.top+1,rgba=Buffer.alloc(width*height*4);
          for(let y=0;y<height;y++)for(let x=0;x<width;x++){
            const p=(f.top+y)*info.width+f.left+x,src=p*4,dst=(y*width+x)*4;
            if(labels[p]===f.label)data.copy(rgba,dst,src,src+4);
          }
          const rw=Math.max(1,Math.round(width*scale)),rh=Math.max(1,Math.round(height*scale));
          const image=await sharp(rgba,{raw:{width,height,channels:4}}).resize(rw,rh).png().toBuffer();
          const left=Math.round(96-(f.anchor-f.left)*scale),top=180-rh;
          if(left<5||top<5||left+rw>187||top+rh>187)throw Error(`${id}: atlas frame clipped`);
          layers.push({input:image,left:col*192+left,top:row*192+top});
        }
        rows.push({row,scale,frames:frames.map(({left,top,right,bottom,area})=>({left,top,right,bottom,area}))});
      }
      const target=path.join(root,'assets','biomes',id);fs.mkdirSync(target,{recursive:true});
      const saved=await sharp({create:{width:1536,height:768,channels:4,background:'#00000000'}}).composite(layers).png({palette:true,quality:100,compressionLevel:9,effort:10}).toFile(path.join(target,'enemies.png'));
      fs.writeFileSync(path.join(target,'enemies.json'),JSON.stringify({bodyHeights:rows.map(r=>Math.round((r.frames[0].bottom-r.frames[0].top+1)*r.scale)/192)})+'\n');
      report.push({id,frames:32,bytes:saved.size,rows});
    }
    fs.mkdirSync(path.join(root,'qa'),{recursive:true});
    fs.writeFileSync(path.join(root,'qa','biome-enemies-preparation.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report.map(({rows,...entry})=>entry)));return;
  }
  for (const kind of (process.argv.slice(2).length ? process.argv.slice(2) : ['warrior', 'archer', 'boss', 'healer'])) {
    const { data, info } = await sharp(path.join(__dirname, 'enemy-sources', `${kind}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info, count = w * h;
    for (let p = 0; p < count; p++) {
      const i = p * 4, spill = Math.min(data[i], data[i + 2]) - data[i + 1];
      if (spill > 40 && data[i] > 60 && data[i + 2] > 60) data[i + 3] = 0;
      else if (spill > 8) { data[i] -= spill; data[i + 2] -= spill; }
      if (kind === 'warrior' && Math.min(data[i], data[i + 1], data[i + 2]) > 190) data[i + 3] = 0;
    }
    // Find complete connected silhouettes, including weapons crossing a nominal cell.
    const labels = new Int32Array(count), queue = new Int32Array(count), components = [];
    let label = 0;
    for (let p = 0; p < count; p++) {
      if (labels[p] || !data[p * 4 + 3]) continue;
      label++; let read = 0, write = 1, left = w, top = h, right = 0, bottom = 0, sumX = 0, sumY = 0;
      queue[0] = p; labels[p] = label;
      while (read < write) {
        const n = queue[read++], x = n % w, y = Math.floor(n / w);
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); sumX += x; sumY += y;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const v = ny * w + nx;
          if (!labels[v] && data[v * 4 + 3]) { labels[v] = label; queue[write++] = v; }
        }
      }
      if (write > 800) components.push({ label, area: write, left, top, right, bottom, x: sumX / write, y: sumY / write });
    }
    const poses = new Array(16);
    for (const c of components) {
      const slot = Math.min(3, Math.floor(c.y / (h / 4))) * 4 + Math.min(3, Math.floor(c.x / (w / 4)));
      if (!poses[slot] || poses[slot].area < c.area) poses[slot] = c;
    }
    if (poses.filter(Boolean).length !== 16) throw Error(`${kind}: fewer than 16 complete silhouettes`);
    for (let f = 0; f < 16; f++) {
      const c = poses[f], skin = [];
      for (let y = c.top; y <= c.bottom; y++) for (let x = c.left; x <= c.right; x++) {
        const p = y * w + x, i = p * 4;
        if (labels[p] === c.label && data[i + 1] > data[i] * 1.15 && data[i + 1] > data[i + 2] * 1.15 && data[i + 1] > 65) skin.push([x, y]);
      }
      const minY = Math.min(...skin.map(p => p[1])), maxY = Math.max(...skin.map(p => p[1]));
      const head = skin.filter(p => p[1] < minY + (maxY - minY) * .44).map(p => p[0]).sort((a, b) => a - b);
      c.anchor = f === 15 || !head.length ? (c.left + c.right) / 2 : head[Math.floor(head.length / 2)];
    }
    const leftExtent = Math.max(...poses.slice(0, 15).map(c => c.anchor - c.left));
    const rightExtent = Math.max(...poses.slice(0, 15).map(c => c.right - c.anchor));
    const height = Math.max(...poses.map(c => c.bottom - c.top + 1));
    const scale = Math.min(84 / leftExtent, 84 / rightExtent, 168 / height, 168 / (poses[15].right - poses[15].left + 1));
    const layers = [];
    for (let f = 0; f < 16; f++) {
      const c = poses[f], cw = c.right - c.left + 1, ch = c.bottom - c.top + 1, rgba = Buffer.alloc(cw * ch * 4);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const p = (c.top + y) * w + c.left + x;
        if (labels[p] === c.label) data.copy(rgba, (y * cw + x) * 4, p * 4, p * 4 + 4);
      }
      const rw = Math.max(1, Math.round(cw * scale)), rh = Math.max(1, Math.round(ch * scale));
      const resized = await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } }).resize(rw, rh).png().toBuffer();
      const left = f === 15 ? Math.round((192 - rw) / 2) : Math.round(96 - (c.anchor - c.left) * scale), top = 180 - rh;
      if (left < 4 || top < 4 || left + rw > 188 || top + rh > 188) throw Error(`${kind} ${f}: frame margins violated`);
      layers.push({ input: resized, left: f * 192 + left, top });
    }
    const output = path.join(root, 'assets', `enemy-${kind}.png`);
    const saved = await sharp({ create: { width: 3072, height: 192, channels: 4, background: '#00000000' } }).composite(layers).png({ palette: true, quality: 100, compressionLevel: 9, effort: 10 }).toFile(output);
    report.push({ kind, frames: poses.length, scale, bytes: saved.size, alpha: saved.hasAlpha, sourceBounds: poses.map(c => [c.left, c.top, c.right, c.bottom]) });
  }
  fs.writeFileSync(path.join(root, 'qa', 'enemies-preparation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.map(({ sourceBounds, ...r }) => r), null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
