// Offline raster equipment assembly. No generation API or rig code runs in the game.
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..'),id=process.argv[2];
if(!id||!/^[a-z0-9-]+$/.test(id))throw Error('Usage: node design/build-set.cjs hunter-hides');
const dir=path.join(__dirname,'sets',id),spec=JSON.parse(fs.readFileSync(process.env.SET_FIT_PATH||path.join(dir,'set.json'))),rig=JSON.parse(fs.readFileSync(path.join(__dirname,'hero-base-v2-poses.json')));
const out=process.env.SET_OUTPUT_DIR||path.join(root,'assets','sets',id);fs.mkdirSync(out,{recursive:true});
const baseArt=fs.readFileSync(path.join(__dirname,'hero-base-v2.svg'),'utf8');
const rows=['cape','back-leg','front-leg','leg-back','leg-front','boot-back','boot-front','back-arm','torso','shorts','hip-back','hip-front','chest','front-arm','shoulder-back','shoulder-front','head','helmet','weapon','glove-back','back-hand','glove-front','front-hand','head-helmet','back-leg-booted','front-leg-booted'];
function group(id){const start=baseArt.indexOf(`<g id="${id}">`);if(start<0)throw Error(`Missing body group ${id}`);const re=/<g\b[^>]*>|<\/g>/g;re.lastIndex=start;let depth=0,m;while((m=re.exec(baseArt))){depth+=m[0].startsWith('</')?-1:1;if(!depth)return baseArt.slice(start,re.lastIndex);}throw Error(`Unclosed ${id}`);}
function body(id,p){const booted=id.endsWith('-booted'),baseId=booted?id.replace('-booted',''):id;let s=group(baseId==='head-helmet'?'head':baseId);if(baseId==='head-helmet'&&!spec.showHair){let i=0;s=s.replace(/<path\b[^>]*\/>/g,v=>[1,2,3,4].includes(i++)?'':v);}const t={BODY:p.body,BACK_LEG:p.backLeg,FRONT_LEG:p.frontLeg,BACK_ARM:p.backArm,FRONT_ARM:p.frontArm,BACK_HAND:p.backHand,FRONT_HAND:p.frontHand,SHORTS:p.shorts,SHORTS_SHADE:p.shortsShade,SHORTS_SEAM:p.shortsSeam};s=s.replace(/ id="[^"]+"/g,'').replace(/\{\{(\w+)\}\}/g,(_,k)=>t[k]);if(booted){const a=p.anchors.feet[baseId==='back-leg'?0:1],clip=`skin-${id}-${p.frame}`;s=`<clipPath id="${clip}"><rect x="450" y="50" width="700" height="${a[1]-24-50}"/></clipPath><g clip-path="url(#${clip})">${s}</g>`;}return s;}

function placement(part,p){const back=part.anchor.endsWith('back'),j=back?0:1;let x=part.target[0],y=part.target[1],angle=0,outer=p.body;
 if(part.anchor.startsWith('hand-')){const h=p.anchors.hands[j],turn=p.anchors.handAngles?.[j]||0;return `<g transform="${outer}"><g transform="translate(${h.join(' ')}) rotate(${turn}) translate(${x} ${y}) rotate(${part.rotation||0})"><use href="#part-${part.id}"/></g></g>`;}
 if(part.anchor.startsWith('hip-')){outer='';const h=p.anchors.hips[j],k=p.anchors.knees?.[j];x+=h[0];y+=h[1]-40;angle=k?Math.max(-16,Math.min(16,Math.atan2(k[0]-h[0],k[1]-h[1])*180/Math.PI))*.35:0;}
 if(part.anchor.startsWith('ankle-')){outer='';const a=p.anchors.feet[j];x+=a[0];y+=a[1];const k=p.anchors.knees?.[j];angle=k?Math.max(-25,Math.min(25,Math.atan2(a[1]-k[1],a[0]-k[0])*180/Math.PI-90))*.45:0;}
 return `<g transform="${outer}"><g transform="translate(${x} ${y}) rotate(${angle}) ${part.slot==='cape'?p.cape:''} rotate(${part.rotation||0})"><use href="#part-${part.id}"/></g></g>`;
}
(async()=>{
 const meta=await sharp(path.join(dir,spec.source)).metadata(),tw=meta.width/spec.grid[0],th=meta.height/spec.grid[1];
 if(!spec.parts.every(p=>p.rect)&&(!Number.isInteger(tw)||!Number.isInteger(th)))throw Error('Source dimensions do not divide into the declared grid');
 const reports=[],parts=[];
 for(const part of spec.parts){const crop=part.crop||[0,0,1,1],[left,top,width,height]=part.rect||[Math.round(part.tile%spec.grid[0]*tw+crop[0]*tw),Math.round(Math.floor(part.tile/spec.grid[0])*th+crop[1]*th),Math.round(crop[2]*tw),Math.round(crop[3]*th)];
  const {data}=await sharp(path.join(dir,part.source||spec.source)).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // White-connected background only. Ivory fur and enclosed dark openings are preserved.
  if(spec.background==='white'){const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;function visit(i){if(seen[i])return;const b=i*4,r=data[b],g=data[b+1],bl=data[b+2];if(data[b+3]<8||(Math.min(r,g,bl)>235&&Math.max(r,g,bl)-Math.min(r,g,bl)<12)){seen[i]=1;queue[tail++]=i;}}
   for(const [sx,sy] of part.clearPoints||[])visit(sy*width+sx);
   for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);data[i*4+3]=0;if(x)visit(i-1);if(x<width-1)visit(i+1);if(y)visit(i-width);if(y<height-1)visit(i+width);}
  }
  // Antialias pixels bordering removed white retain coverage, without a white fringe.
  const original=Buffer.from(data);for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const b=(y*width+x)*4;if(!original[b+3])continue;const near=[b-4,b+4,b-width*4,b+width*4].some(n=>original[n+3]===0),v=Math.min(original[b],original[b+1],original[b+2]);if(near&&v>145&&Math.max(original[b],original[b+1],original[b+2])-v<24){const alpha=(255-v)/255;data[b+3]=Math.round(255*alpha);for(let c=0;c<3;c++)data[b+c]=Math.max(0,Math.round((original[b+c]-255*(1-alpha))/Math.max(alpha,.01)));}}
  let minX=width,minY=height,maxX=-1,maxY=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>24){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  if(maxX<0)throw Error(`Empty ${part.id}`);let png=await sharp(data,{raw:{width,height,channels:4}}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1}).png().toBuffer();fs.writeFileSync(path.join(out,`${part.id}.png`),png);
  parts.push(`<image id="part-${part.id}" x="${-part.size[0]*part.pivot[0]}" y="${-part.size[1]*part.pivot[1]}" width="${part.size[0]}" height="${part.size[1]}" preserveAspectRatio="none" href="data:image/png;base64,${png.toString('base64')}"/>`);
  reports.push({id:part.id,source:part.source||spec.source,crop:[left+minX,top+minY,maxX-minX+1,maxY-minY+1],edgeContact:minX===0||minY===0||maxX===width-1||maxY===height-1});
  if(reports.at(-1).edgeContact&&!part.allowCrop)throw Error(`${part.id} touches its crop boundary; adjust rect before building`);
 }
 // Crossbow support and recoil use the existing arm layers and six-frame shot timing.
 const crossbowPoses=rig.rangedPoses.map((p,i)=>{
  const recoil=[0,0,0,12,6,0][i],rear=825-recoil-([0,10,5,0,0,0][i]),front=920-recoil;
  return {...p,frame:28+i,
   backArm:`M656 442Q637 463 677 497Q700 525 728 523L${rear+4} 526L${rear+8} 491L729 492Q690 456 679 441Z`,
   frontArm:`M818 446Q850 449 878 462L${front+6} 463L${front+9} 496L876 496Q847 481 824 474Z`,
   backHand:`translate(${rear} 510)`,frontHand:`translate(${front} 480)`,
   anchors:{...p.anchors,hands:[[rear,510],[front,480]],handAngles:[0,0]}};
 });
 const shotPoses=[...rig.rangedPoses,...crossbowPoses];
 const allPoses=[...rig.poses,...shotPoses],shotRows=['back-arm','front-arm','back-hand','front-hand','glove-back','glove-front'];
 const weaponEpoch={'bone-warrior':'prehistoric','bronze-warrior':'ancient',musketeer:'gunpowder','field-scout':'modern','neon-runner':'futuristic','lunar-scout':'space','rift-nomad':'interdimensional','ash-reaper':'underworld','dawn-herald':'divine'}[id];
 const weapons=id==='hunter-hides'?[{id:'slingshot',size:[154,170],pivot:[.60,.78]},{id:'short-bow',size:[109,350],pivot:[.80,.50]},{id:'gladius',size:[200,255],pivot:[.255,.79]},{id:'bronze-axe',size:[222,267],pivot:[.18,.81]},{id:'battle-spear',size:[205,292],pivot:[.145,.85]},
  {id:'knight-sword',size:[114,350],pivot:[0.5,0.8],rotation:35},
  {id:'falchion',size:[87,340],pivot:[0.49,0.8],rotation:35},
  {id:'bearded-axe',size:[163,320],pivot:[0.18,0.66],rotation:35},
  {id:'double-axe',size:[223,335],pivot:[0.5,0.7],rotation:35},
  {id:'long-spear',size:[69,550],pivot:[0.5,0.7],rotation:35},
  {id:'halberd',size:[153,520],pivot:[0.46,0.69],rotation:35},
  {id:'spiked-mace',size:[151,290],pivot:[0.5,0.76],rotation:35},
  {id:'war-hammer',size:[193,300],pivot:[0.39,0.7],rotation:35},
  {id:'longbow',size:[100,450],pivot:[0.8,0.5],rotation:0},
  {id:'crossbow',size:[350,165],pivot:[0.58,0.55],rotation:0},
  {id:'jaw-club',size:[222,300],pivot:[0.46,0.82],rotation:35},
  {id:'obsidian-pick',size:[265,280],pivot:[0.27,0.78],rotation:35},
  {id:'blowpipe',size:[350,75],pivot:[0.22,0.23],rotation:0},
  {id:'khopesh',size:[133,350],pivot:[0.18,0.8],rotation:35},
  {id:'trident',size:[176,520],pivot:[0.5,0.72],rotation:35},
  {id:'chakram',size:[168,171],pivot:[0.32,0.8],rotation:0},
  {id:'chain-flail',size:[44,220],pivot:[0.5,0.8],rotation:35},
  {id:'warden-key',size:[120,360],pivot:[0.5,0.85],rotation:35},
  {id:'crystal-staff',size:[112,500],pivot:[0.49,0.8],rotation:0}]:weaponEpoch?JSON.parse(fs.readFileSync(path.join(__dirname,'weapons',weaponEpoch,'catalog.json'))):[];
 const weaponDefs=weapons.map(w=>`<image id="part-${w.id}" x="${-w.size[0]*w.pivot[0]}" y="${-w.size[1]*w.pivot[1]}" width="${w.size[0]}" height="${w.size[1]}" href="data:image/png;base64,${fs.readFileSync(path.join(root,'assets','weapons',w.id+'.png')).toString('base64')}"/>`).join('');
 const flailDefs=weapons.some(w=>w.id==='chain-flail')?allPoses.map(p=>{
  const angle=p.frame>=9&&p.frame<=15?[60,135,190,160,185,230,290][p.frame-9]:-70+(p.frame>=1&&p.frame<=8?Math.sin((p.frame-1)*Math.PI/4)*10:0);
  return `<g id="part-chain-flail-${p.frame}"><image x="-22" y="-176" width="44" height="220" href="data:image/png;base64,${fs.readFileSync(path.join(root,'assets/weapons/chain-flail-handle.png')).toString('base64')}"/><g transform="translate(0 -164) rotate(${angle})"><image x="-52" y="-14" width="104" height="220" href="data:image/png;base64,${fs.readFileSync(path.join(root,'assets/weapons/chain-flail-weight.png')).toString('base64')}"/></g></g>`;
 }).join(''):'';
 const weaponPoses=weapons.flatMap(w=>allPoses.map(p=>`<g id="extra-${w.id}-${p.frame}">${placement({...w,id:w.id==='chain-flail'?w.id+'-'+p.frame:w.id,rotation:(w.rotation||0)+(p.frame>=16&&p.frame<22?(w.thrustTurn||(['knight-sword','falchion','long-spear','trident'].includes(w.id)?55:0)):0),anchor:'hand-front',target:[0,0]},p)}</g>`)).join('');
 const defs=weaponDefs+flailDefs+weaponPoses+parts.join('')+rows.flatMap(id=>allPoses.map(p=>{const part=spec.parts.find(v=>v.id===id);return `<g id="${id}-${p.frame}">${part?placement(part,p):id==='weapon'?'':body(id,p)}</g>`;})).join('');
 // Measure all poses before packing. Padding belongs to the atlas, not to the user's fit.
 const probeBox=[rig.viewBox[0]-700,rig.viewBox[1]-700,2100,2100],probeSize=1050;
 const probe=`<svg xmlns="http://www.w3.org/2000/svg" width="${probeSize}" height="${probeSize}" viewBox="${probeBox.join(' ')}"><defs>${defs}</defs>${rows.flatMap(id=>allPoses.map(p=>`<use href="#${id}-${p.frame}"/>`)).join('')}${weapons.flatMap(w=>allPoses.map(p=>`<use href="#extra-${w.id}-${p.frame}"/>`)).join('')}</svg>`;
 const pixels=await sharp(Buffer.from(probe)).ensureAlpha().raw().toBuffer();
 let left=rig.viewBox[0],top=rig.viewBox[1],right=left+rig.viewBox[2],bottom=top+rig.viewBox[3];
 for(let y=0;y<probeSize;y++)for(let x=0;x<probeSize;x++)if(pixels[(y*probeSize+x)*4+3]>0){
  if(!x||!y||x===probeSize-1||y===probeSize-1)throw Error('Equipment is too far from the hero to fit in a sprite.');
  left=Math.min(left,probeBox[0]+x*2-16);top=Math.min(top,probeBox[1]+y*2-16);
  right=Math.max(right,probeBox[0]+(x+1)*2+16);bottom=Math.max(bottom,probeBox[1]+(y+1)*2+16);
 }
 const side=Math.max(right-left,bottom-top),viewBox=[left,top,side,side];
 const cell=Math.ceil(spec.cell*side/rig.viewBox[2]),frames=rig.poses.length;
 const cells=rows.flatMap((id,row)=>rig.poses.map(p=>`<svg x="${p.frame*cell}" y="${row*cell}" width="${cell}" height="${cell}" viewBox="${viewBox.join(' ')}" overflow="hidden"><use href="#${id}-${p.frame}"/></svg>`)).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cell*frames}" height="${cell*rows.length}"><defs>${defs}</defs>${cells}</svg>`;
 await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(path.join(out,'atlas.png'));
 await sharp(Buffer.from(svg),{density:144}).png({compressionLevel:9}).toFile(path.join(out,'preview-atlas.png'));
 const shotSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cell*shotPoses.length}" height="${cell*shotRows.length}"><defs>${defs}</defs>${shotRows.flatMap((id,row)=>shotPoses.map((p,f)=>`<svg x="${f*cell}" y="${row*cell}" width="${cell}" height="${cell}" viewBox="${viewBox.join(' ')}"><use href="#${id}-${p.frame}"/></svg>`)).join('')}</svg>`;
 await sharp(Buffer.from(shotSvg)).png().toFile(path.join(out,'shoot-atlas.png'));

 if(weapons.length){
  const weaponSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cell*allPoses.length}" height="${cell*weapons.length}"><defs>${weaponDefs}${flailDefs}${weaponPoses}</defs>${weapons.flatMap((w,row)=>allPoses.map((p,f)=>`<svg x="${f*cell}" y="${row*cell}" width="${cell}" height="${cell}" viewBox="${viewBox.join(' ')}"><use href="#extra-${w.id}-${p.frame}"/></svg>`)).join('')}</svg>`;
  await sharp(Buffer.from(weaponSvg)).png().toFile(path.join(out,'weapon-atlas.png'));
 }
 // Check every cell boundary; clipping is a placement error, not something to ship silently.
 const raw=await sharp(path.join(out,'atlas.png')).ensureAlpha().raw().toBuffer();let clipped=0;for(let r=0;r<rows.length;r++)for(let f=0;f<frames;f++)for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if((!x||!y||x===cell-1||y===cell-1)&&raw[((r*cell+y)*cell*frames+f*cell+x)*4+3]>20)clipped++;
 let emptyParts=0;
 for(const part of spec.parts){const r=rows.indexOf(part.id);for(let f=0;f<frames;f++){let visible=false;for(let y=0;y<cell&&!visible;y++)for(let x=0;x<cell;x++)if(raw[((r*cell+y)*cell*frames+f*cell+x)*4+3]>20){visible=true;break;}if(!visible)emptyParts++;}}
 const slots=Object.fromEntries(['cape','legs','boots','chest','shoulders','helmet','weapon','gloves'].map(slot=>[slot,spec.parts.filter(p=>p.slot===slot).map(p=>rows.indexOf(p.id))]).filter(([,indices])=>indices.length));
 fs.writeFileSync(path.join(out,'atlas.json'),JSON.stringify({id:spec.id,name:spec.name,sourceSheets:[...new Set([spec.source,...spec.parts.map(p=>p.source||spec.source)])],cell,frames,rows,slots,shootRows:shotRows,weaponRows:weapons.map(w=>w.id),viewBox,anchor:rig.anchor.map((v,i)=>(v-viewBox[i])/side),bodyHeight:rig.bodyHeight/side},null,2)+'\n');
 // head-helmet must stay beneath the hood, not on top of equipment.
 const composeSorted=f=>rows.filter(id=>!['head-helmet','shorts','back-hand','front-hand','back-leg-booted','front-leg-booted'].includes(id)).map(id=>`<use href="#${id==='head'?'head-helmet':['back-leg','front-leg'].includes(id)?id+'-booted':id}-${f}"/>`).join('');
 const preview=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#fffaf0"/><defs>${defs}</defs>${[0,2,4,6,10,12].map((f,i)=>`<svg x="${i%3*400}" y="${Math.floor(i/3)*400}" width="400" height="400" viewBox="${viewBox.join(' ')}">${composeSorted(f)}</svg>`).join('')}</svg>`;
 await sharp(Buffer.from(preview)).png().toFile(process.env.SET_OUTPUT_DIR?path.join(out,'poses.png'):path.join(root,'qa',`${id}-poses.png`));
 // Icons render equipment only, using the same rasters and pose 0.
 for(const [slot,indices] of Object.entries(slots)){
  if(['gloves','shoulders','boots'].includes(slot)){
   const pair=spec.parts.filter(p=>p.slot===slot),layers=[];
   for(let i=0;i<pair.length;i++)layers.push({input:await sharp(path.join(out,`${pair[i].id}.png`)).trim().resize(64,64,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:5+i*22,top:5+i*22});
   await sharp({create:{width:96,height:96,channels:4,background:'#00000000'}}).composite(layers).png().toFile(path.join(out,`${slot}-icon.png`));
  }else{const full=`<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="${viewBox.join(' ')}"><defs>${defs}</defs>${indices.map(i=>`<use href="#${rows[i]}-0"/>`).join('')}</svg>`;const icon=await sharp(Buffer.from(full)).trim().resize(80,80,{fit:'contain',background:'#00000000'}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).png().toBuffer();fs.writeFileSync(path.join(out,`${slot}-icon.png`),icon);}
 }
 const report={source:[meta.width,meta.height],parts:reports,viewBox,cell,clippedPixels:clipped,emptyPartFrames:emptyParts,atlasBytes:fs.statSync(path.join(out,'atlas.png')).size,decodedBytes:cell*frames*cell*rows.length*4};fs.writeFileSync(process.env.SET_OUTPUT_DIR?path.join(out,'build-report.json'):path.join(dir,'build-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(clipped||emptyParts)throw Error(`Could not fit all equipment poses: ${clipped} clipped pixels, ${emptyParts} empty frames.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
