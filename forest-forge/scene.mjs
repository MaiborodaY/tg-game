const compactNumber = new Intl.NumberFormat('en', {notation:'compact', maximumFractionDigits:1});
import { stats, ARMOR_SETS, WEAPONS, attackInterval, BIOMES, LEVELS_PER_BIOME } from './game.mjs';

// Existing atlas poses: body x/y/angle, then each hand's x/y/angle.
// Source coordinates match design/hero-base-v2-poses.json and build-set.cjs.
const combatPoses = {
  0: [0,0,0,611,554,0,918,514,0],
  9: [-3,2,-2,604,546,0,936.84,462.33,-20],
  10: [-6,3,-3,604,546,0,892,366,-45],
  11: [-2,2,-1,604,546,0,930.87,416.72,5],
  12: [4,1,1,604,546,0,884.07,545.05,80],
  13: [5,1,2,604,546,0,899.25,534.44,80],
  14: [2,0,1,604,546,0,913.53,519.92,25],
  16: [-3,2,-2,604,546,0,885,506,0],
  17: [-6,3,-3,604,546,0,875,499,0],
  18: [-2,2,-1,604,546,0,918,493,0],
  19: [8,1,3,604,546,0,970,484,0],
  20: [5,1,2,604,546,0,952,497,0],
  21: [2,0,1,604,546,0,923,511,0],
  22: [0,0,0,825,465,-5,920,460,0],
  23: [0,0,0,792.5,465,-5,920,460,0],
  24: [0,0,0,760,465,-5,920,460,0],
  25: [0,0,0,825,465,-5,920,460,0],
  26: [0,0,0,815.25,465,-5,920,460,0],
  27: [0,0,0,825,465,-5,920,460,0],
  28: [0,0,0,825,510,0,920,480,0],
  29: [0,0,0,815,510,0,920,480,0],
  30: [0,0,0,820,510,0,920,480,0],
  31: [0,0,0,813,510,0,908,480,0],
  32: [0,0,0,819,510,0,914,480,0],
  33: [0,0,0,825,510,0,920,480,0],
};

// Cached landscape, sprites and a small coin burst; no engine or shaders.
export async function createScene(canvas, previewSet = null, previewCompanion = false) {
  const context = canvas.getContext('2d', { alpha: false });
  const art = {}, rigs = {};
  const sets = ARMOR_SETS[0], loadingSets = new Set();
  let artVersion=Date.now();
  const [heroRigs] = await Promise.all([
    Promise.all(sets.map(async id => {
      const meta = await fetch(`assets/sets/${id}/atlas.json?v=${artVersion}`).then(r => { if (!r.ok) throw Error('Hero atlas metadata missing'); return r.json(); });
      const image = new Image(); image.src = `assets/sets/${id}/atlas.png?v=${artVersion}`; await image.decode(); art[id] = image;
      rigs[id]=meta;return meta;
    })),
    document.fonts.load('32px "Lilita UI"'),
    Promise.all(['warrior','archer','boss','healer','tree','hammer','rune'].map(async name => {
      const img = new Image(); img.src = ['hammer','rune'].includes(name) ? `assets/${name}.webp` : name === 'tree' ? 'assets/tree.svg' : `assets/enemy-${name}.png`;
      await img.decode(); art[name] = img;
    }))
  ]);
  window.addEventListener('storage', async event => {
    if(event.key!=='forest-forge-art-update'||!event.newValue)return;
    const {id,revision}=JSON.parse(event.newValue);artVersion=revision;
    if(!art[id]&&!art[id+'-weapon'])return;
    const image=new Image();image.src=`assets/sets/${id}/atlas.png?v=${revision}`;
    try{const meta=await fetch(`assets/sets/${id}/atlas.json?v=${revision}`).then(r=>r.json());await image.decode();rigs[id]=meta;art[id]=image;delete art[id+'-shoot'];loadingSets.delete(id+'-shoot');delete art[id+'-weapon'];loadingSets.delete(id+'-weapon');if(id===previewSet)previewRig=meta;}catch(error){console.error('Could not refresh equipment',error);}
  });
  let previewRig=null;
  if(previewSet){
    const response=await fetch(`assets/sets/${previewSet}/atlas.json?v=${artVersion}`);if(!response.ok)throw Error('Preview set unavailable');previewRig=await response.json();rigs[previewSet]=previewRig;
    if(!art[previewSet]){const image=new Image();image.src=`assets/sets/${previewSet}/atlas.png?v=${artVersion}`;await image.decode();art[previewSet]=image;}
  }
  let companionArtKind=null;
  const heroRig = heroRigs[0];
  const heroSlots = heroRig.rows.map((_,row) => Object.keys(heroRig.slots).find(slot => heroRig.slots[slot].includes(row)));
  let width = 0, height = 0, titleY = 0, ratio = 1, landscape;
  let time = 0, previousEnemies = null, previousBossSize = 128;
  let biomeIndex = 0, wantedBiome = 0, biomeSprites = null, scenery = null, biomeHeights = null, loading = false;
  let reveal = 0, levelTitle = null;
  let chakramFlight = null;
  const numbers = [];
  let numberSequence = 0;
  const coins = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  async function prepare(level) {
    const index = Math.floor((level - 1) / LEVELS_PER_BIOME);
    wantedBiome=index;
    if (index === biomeIndex) { loading=false; return; }
    loading = true;
    let sprites = null, decor = null, heights = null;
    if (index) {
      [sprites, decor, heights] = await Promise.all([...['enemies.png', 'scenery.svg'].map(async file => {
        const image = new Image(); image.src = `assets/biomes/${BIOMES[index].id}/${file}`;
        await image.decode(); return image;
      }), fetch(`assets/biomes/${BIOMES[index].id}/enemies.json`).then(async response=>{
        if(!response.ok)throw Error(`Could not load ${BIOMES[index].name} sprite metadata`);
        return (await response.json()).bodyHeights;
      })]);
    }
    if(index!==wantedBiome)return; // A local reset or cloud reload can change location while images load.
    biomeIndex = index; biomeSprites = sprites; scenery = decor; biomeHeights = heights;
    resize(); reveal = .55; loading = false;
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const hudBottom=canvas.parentElement?.querySelector('.level-hud')?.getBoundingClientRect().bottom ?? bounds.top;
    titleY=Math.min(height-24,Math.max(height*.48,hudBottom-bounds.top+25));
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    landscape = document.createElement('canvas');
    landscape.width = canvas.width; landscape.height = canvas.height;
    const c = landscape.getContext('2d', { alpha: false });
    c.scale(landscape.width / width, landscape.height / height);
    const biome = BIOMES[biomeIndex];
    c.fillStyle = biome.ground; c.fillRect(0, 0, width, height);
    const roadTop = height * .585, roadBottom = height * .795;
    c.fillStyle = biome.road; c.fillRect(0, roadTop, width, roadBottom - roadTop);
    for (let i = 0; i < 42; i++) {
      const x = ((i * 73 + 19) % 401) / 401 * width;
      const y = ((i * 67 + 11) % 353) / 353 * height;
      if (y > roadTop - 6 && y < roadBottom + 6) continue;
      c.strokeStyle = biome.detail; c.fillStyle = biome.detail; c.lineWidth = 1.5; c.lineCap = 'round';
      c.beginPath();
      if (biome.terrain === 'water') {
        c.ellipse(x,y,9+i%9,3+i%3,0,0,Math.PI*2); c.fill();
        c.strokeStyle='#92d7c1'; c.beginPath(); c.ellipse(x+2,y-1,5+i%5,1.5,0,Math.PI,Math.PI*2); c.stroke();
      } else if (biome.terrain === 'snow') {
        c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();
      } else if (biome.terrain === 'paving' || biome.terrain === 'metal') {
        c.roundRect(x-6,y-3,14+i%9,7,2);c.stroke();
        if(biome.terrain==='metal'&&i%4===0){c.fillStyle='#c0e98b';c.fillRect(x-3,y,7,2);}
      } else if (biome.terrain === 'rift') {
        c.moveTo(x,y-5);c.lineTo(x+8,y);c.lineTo(x,y+4);c.lineTo(x-5,y);c.closePath();c.stroke();
      } else if (biome.terrain === 'ash') {
        c.moveTo(x-8,y);c.lineTo(x,y+3);c.lineTo(x+6,y-3);c.lineTo(x+12,y);c.stroke();
        if(i%5===0){c.strokeStyle='#f3a36d';c.beginPath();c.moveTo(x,y+2);c.lineTo(x+5,y-2);c.stroke();}
      } else if (biome.terrain === 'sky') {
        c.fillStyle='#d9edf3';c.ellipse(x,y,10+i%7,3,0,0,Math.PI*2);c.fill();
      } else if (biome.terrain === 'sand') {
        c.moveTo(x-6,y);c.quadraticCurveTo(x,y+3,x+7,y);c.stroke();
      } else if (biome.terrain === 'alien') {
        c.ellipse(x,y,4,2,0,0,Math.PI*2);c.fill();
        c.fillStyle='#c7efd3';c.beginPath();c.arc(x+2,y-2,1.4,0,Math.PI*2);c.fill();
      } else {
        c.moveTo(x,y);c.lineTo(x-2,y-4);c.moveTo(x+3,y);c.lineTo(x+4,y-5);c.stroke();
      }
    }
    for (let i = 0; i < 24; i++) {
      c.fillStyle = i % 2 ? biome.edge : biome.light;
      c.beginPath(); c.ellipse((i * 97 + 9) % width, roadTop + 8 + (i * 13) % Math.max(10, roadBottom - roadTop - 16), 3 + i % 3, 1.4, 0, 0, Math.PI * 2); c.fill();
    }
    // Trees occupy the margins, leaving the HUD and path readable.
    const trees = [[.04,.05,37],[.40,.07,39],[.76,.05,43],[.94,.24,46],[-.02,.30,48],
      [.21,.39,35],[.65,.39,38],[.09,.56,31],[.88,.57,33],[.07,.97,43],[.38,.95,42],[.74,.97,44],[.96,.96,46]];
    for (const [treeIndex, [x, y, size]] of trees.entries()) {
      const s = size * Math.min(width / 390, 1.15);
      for (const offset of [-width, 0, width]) {
        const tx = x * width + offset;
        c.fillStyle = biome.shade+'66'; c.beginPath(); c.ellipse(tx + s * .4, y * height - 2, s * .42, s * .10, 0, 0, Math.PI * 2); c.fill();
        if (scenery) {
          const kind = treeIndex % 6;
          const size = s * (kind < 2 ? 1.75 : 1.38);
          c.drawImage(scenery,kind*128,0,128,128,tx-(size-s)/2,y*height-size,size,size);
        } else c.drawImage(art.tree, tx, y * height - s * 1.4, s, s * 1.4);
      }
    }
    for (let i = 0; i < 26; i++) {
      c.fillStyle = biome.ground;
      const x = i * width / 25;
      c.beginPath(); c.ellipse(x, roadTop, 4 + i % 4, 2 + i % 3, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + 6, roadBottom, 4 + i % 3, 2 + i % 4, 0, 0, Math.PI * 2); c.fill();
    }
  }
  function emit(event) {
    if (['restart','level','complete'].includes(event.type)) {
      chakramFlight = null;
      reveal = .55;
      const index = Math.floor((event.level - 1) / LEVELS_PER_BIOME);
      levelTitle = event.type === 'level' ? {
        text:`Level ${index+1}–${(event.level-1)%LEVELS_PER_BIOME+1}`,
        location:(event.level-1)%LEVELS_PER_BIOME===0?BIOMES[index].name:null, age:0
      } : null;
    }
    if(event.type==='heroHit'&&chakramFlight){
      const target=previousEnemies?.find(enemy=>enemy.id===event.targetId);
      if(target){
        chakramFlight.returning=true;
        chakramFlight.hitX=target.x;
        chakramFlight.hitY=(previousEnemies.length>1&&!target.boss?(target.id%2?7:-5):0)-(target.boss?previousBossSize:50)*.34;
      }
    }
    if (event.type === 'kill' && !reducedMotion.matches) {
      const enemy = previousEnemies?.find(e => e.id === event.targetId);
      if (enemy) {
        const count = enemy.boss ? 8 : 5;
        const lane = previousEnemies.length > 1 && !enemy.boss ? (enemy.id % 2 ? 7 : -5) : 0;
        for (let i = 0; i < count; i++) coins.push({
          x: enemy.x, y: lane - (enemy.boss ? 28 : 12), age: 0,
          vx: (i / (count - 1) - .5) * 96 + Math.random() * 8 - 4,
          vy: -72 - Math.random() * 18, life: .62 + Math.random() * .10, spin: Math.random() * Math.PI,
        });
        if(event.runes) coins.push({rune:true,x:enemy.x,y:lane-18,age:0,vx:16,vy:-105,life:1.15,spin:0});
        if (coins.length > 30) coins.splice(0, coins.length - 30);
      }
    }
    if (['heroHit','companionHit','tankHit','heroRegen','enemyHit','kill','heal'].includes(event.type)) {
      const healing = ['heal','heroRegen'].includes(event.type), critical = !!event.critical;
      const duration = healing ? 1.25 : critical ? 1.05 : .85;
      numbers.push({ healing, critical, drift: (++numberSequence % 2 ? -1 : 1) * (16 + numberSequence % 3 * 5), duration, tank:event.type==='tankHit', targetId: ['enemyHit','tankHit','heroRegen'].includes(event.type) ? null : event.targetId,
        text: event.blocked ? 'Block' : (event.type === 'kill' || event.type === 'heal' || event.type === 'heroRegen' ? '+' : '') + compactNumber.format(event.value),
        color: critical ? '#ff535c' : healing ? '#88ff9c' : event.type === 'kill' ? '#ffeb73' : event.type === 'enemyHit' ? '#ffddd8' : '#fffbed', life: duration, reward: event.type === 'kill', coinIcon: event.type === 'kill' });
      if (event.type === 'kill' && event.hammers) numbers.push({ tank:event.type==='tankHit', targetId:event.targetId,
        text:'+' + event.hammers, color:'#c7efff', life:.8, reward:true, rewardRow:1, hammerIcon:true });
      if(event.type==='kill' && event.runes) numbers.push({targetId:event.targetId,text:'+1',color:'#e3b4ff',life:1.4,duration:1.4,reward:true,rewardRow:2,runeIcon:true});
      if (numbers.length > 12) numbers.splice(0, numbers.length - 12);
    }
  }
  function bar(x, y, fraction, color, size = 35, scale = 1) {
    context.fillStyle = '#142e23'; context.fillRect(x - size / 2 - 2 * scale, y - 2 * scale, size + 4 * scale, 8 * scale);
    context.fillStyle = color; context.fillRect(x - size / 2, y, size * Math.max(0, Math.min(1, fraction)), 4 * scale);
  }
  function render(state, dt) {
    const wantedCompanion=state.companion?.kind??null;
    if(wantedCompanion!==companionArtKind){
      if(companionArtKind)delete art['companion-'+companionArtKind];
      companionArtKind=wantedCompanion;
      if(wantedCompanion){
        const image=new Image();image.src=`assets/companions/${wantedCompanion}.webp`;
        image.decode().then(()=>{
          if(companionArtKind===wantedCompanion)art['companion-'+wantedCompanion]=image;
        }).catch(error=>console.error('Could not load companion',error));
      }
    }
    if (loading) { context.fillStyle='#081312';context.fillRect(0,0,width,height);return; }
    const biome = BIOMES[biomeIndex];
    const bossSize = state.level % LEVELS_PER_BIOME === 0 ? 128 : 88;
    previousBossSize=bossSize;
    time += dt;
    reveal = Math.max(0, reveal - dt);
    if (levelTitle && (levelTitle.age += dt) >= 2) levelTitle = null;
    if (previousEnemies !== state.enemies) { numbers.length = 0; coins.length = 0; chakramFlight = null; previousEnemies = state.enemies; }
    if (reducedMotion.matches) coins.length = 0;
    const camera = state.heroX - .24;
    // Copy two exact pixel slices: fractional tile edges leave a dark seam during fades.
    const pixels=landscape.width, shift=((Math.round(camera*pixels)%pixels)+pixels)%pixels;
    context.save();context.setTransform(1,0,0,1,0,0);
    context.drawImage(landscape,shift,0,pixels-shift,landscape.height,0,0,pixels-shift,canvas.height);
    if(shift)context.drawImage(landscape,0,0,shift,landscape.height,pixels-shift,0,shift,canvas.height);
    context.restore();
    const base = height * .758, unit = Math.min(width / 390, 1.15);
    const heroX = width * .24, hSize = (59 / 1.5) * unit;
    const companion=state.companion;
    if(companion && (companion.kind!=='turtle'||companion.hp>0) && art['companion-'+companion.kind] && state.phase!=='dead' && !state.completed){
      const c=companion, size=(c.kind==='turtle'?61:49)*unit, x=(c.x-camera)*width, floor=base+(c.kind==='turtle'?8:-3)*unit;
      let row=c.moving?1:0, frame=Math.floor(time/(c.moving?.16:.4))%4;
      if(c.kind==='druid' && c.actionAge<.8){row=2;frame=Math.min(3,Math.floor(c.actionAge/.2));}
      else if(c.kind==='archer' && !c.moving && (c.clock>=2.04 || c.actionAge<.36)){
        row=2;frame=c.actionAge<.36?(c.actionAge<.18?2:3):Math.min(1,Math.floor((c.clock-2.04)/.18));
      }
      context.fillStyle='#785b3844';context.beginPath();context.ellipse(x,floor+2,11*unit,2*unit,0,0,Math.PI*2);context.fill();
      context.drawImage(art['companion-'+c.kind],frame*256,row*256,256,256,x-size/2,floor-size*240/256,size,size);
      if(c.kind==='turtle'){
        bar(x,floor-size*.61,c.hp/c.maxHp,'#70d5df',24*unit,.65);
        if(c.actionAge<.2){context.save();context.globalAlpha=(1-c.actionAge/.2)*.65;context.strokeStyle='#b9f5ff';context.lineWidth=2*unit;context.beginPath();context.arc(x+12*unit,floor-16*unit,12*unit,-1.2,1.2);context.stroke();context.restore();}
      }
      if(c.shot){
        const t=Math.max(0,Math.min(1,1-c.shot.remaining/.18));
        const ax=(c.shot.fromX+(c.shot.toX-c.shot.fromX)*t-camera)*width;
        const enemy=state.enemies.find(e=>e.id===c.shot.targetId);
        const targetY=base+((state.enemies.length>1&&!enemy?.boss?(enemy.id%2?7:-5):0)-(enemy?.boss?bossSize:50)*.34)*unit;
        const ay=(floor-27*unit)*(1-t)+targetY*t;
        context.strokeStyle='#543c27';context.lineWidth=1.5*unit;context.beginPath();context.moveTo(ax-9*unit,ay);context.lineTo(ax+3*unit,ay);context.stroke();
        context.fillStyle='#e8f3ef';context.beginPath();context.moveTo(ax+6*unit,ay);context.lineTo(ax+1*unit,ay-2*unit);context.lineTo(ax+1*unit,ay+2*unit);context.fill();
      }
    }

    // The counter advances on contact; recovery belongs to the preceding windup.
    const interval = attackInterval(state);
    const recovery = state.heroActionAge < interval * .2;
    const attackIndex = (state.heroAttackCount || 0) - (recovery ? 1 : 0);
    const weapon = previewRig ? (previewRig.slots.weapon ? {quality:['hunter-hides','bone-warrior','stone-guard'].indexOf(previewSet)} : null) : state.equipment.weapon;
    const ranged=Boolean(WEAPONS[weapon?.weaponId]?.range),customWeapon=Boolean(WEAPONS[weapon?.weaponId]?.sprite&&WEAPONS[weapon.weaponId].epoch===(weapon.epoch??1));
    const weaponSource=WEAPONS[weapon?.weaponId]?.atlas||sets[0],weaponImage=art[weaponSource+'-weapon'];
    const throwing=customWeapon&&weapon.weaponId==='chakram';
    const shooting=ranged&&!throwing&&(state.phase==='fight'||recovery&&state.phase!=='dead');
    const attack=WEAPONS[weapon?.weaponId]?.attack;
    const thrust = throwing || (attack ? attack==='thrust'||(attack==='combo'&&attackIndex%2===1) : !weapon || weapon.quality === 1 || (weapon.quality === 2 && attackIndex % 2 === 1));
    const attackStart = thrust ? 16 : 9;
    const combat = state.phase!=='dead'&&(state.phase==='fight'||recovery);
    let heroFrame=0, shotFrame=0, pose=null, sourcePose=null, weaponTurn=0, guard=0;
    if (combat) {
      // One 2 s loop: .4 s return, .8 s living guard, .65 s preparation, .15 s strike.
      // Contact is at the clock wrap, exactly when the simulation applies damage.
      const cycle=Math.min(1,Math.max(0,state.doubleStrikeDelay > 0 ? .6 + .4 * (1-state.doubleStrikeDelay/(interval*.16)) : (recovery?state.heroActionAge:state.heroClock)/interval));
      const start=shooting?(WEAPONS[weapon?.weaponId]?.pose==='crossbow'||['crossbow','blowpipe'].includes(weapon?.weaponId)?28:22):attackStart;
      const rest=shooting?start:0;
      const keys=[[0,start+3],[.06,start+4],[.14,start+5],[.2,rest],[.6,rest],[.77,start],[.925,start+1],[.965,start+2],[1,start+3]];
      if(shooting){keys[5][1]=start+1;keys[6][1]=start+2;}
      // Reuse the thrust as a one-handed throw; release .3 s before impact.
      if(throwing)keys.splice(5,4,[.72,start],[.78,start+1],[.82,start+2],[.85,start+3],[1,start+3]);
      const next=keys.findIndex((key,i)=>i>0&&cycle<=key[0]);
      const [a,b]=[keys[next-1],keys[next]];
      let blend=(cycle-a[0])/(b[0]-a[0]);
      if(cycle<(throwing ? .78 : .925))blend=blend*blend*(3-2*blend);
      const frame=blend<.5?a[1]:b[1], from=combatPoses[a[1]], to=combatPoses[b[1]];
      sourcePose=combatPoses[frame];pose=from.map((value,i)=>value+(to[i]-value)*blend);
      if(shooting)shotFrame=frame-22;else heroFrame=frame;
      // The extra spear/sword grip rotation is baked only into thrust cells.
      const thrustTurn=WEAPONS[weapon?.weaponId]?.thrustTurn||(['knight-sword','falchion','long-spear','trident'].includes(weapon?.weaponId)?55:0);
      if(thrustTurn){
        const fromTurn=a[1]>=16&&a[1]<=21?thrustTurn:0,toTurn=b[1]>=16&&b[1]<=21?thrustTurn:0;
        weaponTurn=fromTurn+(toTurn-fromTurn)*blend-(frame>=16&&frame<=21?thrustTurn:0);
      }
      if(!reducedMotion.matches&&cycle>.2&&cycle<.6){
        const t=(cycle-.2)/.4;guard=Math.sin(Math.PI*t)**2;
        const sway=Math.sin(Math.PI*2*t)*guard;
        pose[0]+=7*sway;pose[1]+=10*guard;pose[2]+=1.8*sway;
        pose[3]-=7*guard;pose[4]-=8*guard;
        pose[6]+=6*sway;pose[7]-=14*guard;pose[8]-=4*guard;
      }
      if(shooting&&weapon.weaponId==='deck-cannon'&&recovery&&!reducedMotion.matches){
        // Heavy kick peaks 60 ms after contact, then settles over 320 ms.
        const settle=Math.min(1,Math.max(0,(cycle-.03)/.16));
        const kick=cycle<.03?Math.sin(cycle/.03*Math.PI/2):1-settle*settle*(3-2*settle);
        pose[0]-=26*kick;pose[2]-=4*kick;
        pose[3]-=34*kick;pose[4]-=9*kick;pose[5]-=4*kick;
        pose[6]-=42*kick;pose[7]-=12*kick;pose[8]-=13*kick;
      }
    } else if ((state.phase==='walk'||state.phase==='victory')&&!reducedMotion.matches) heroFrame=1+Math.floor(time*10)%8;
    let chakramHand=null;
    if(throwing&&pose){
      // Ring centre relative to the same 168x171 sprite and .32/.8 grip used by build-set.cjs.
      const k=hSize/590,handAngle=pose[8]*Math.PI/180,bodyAngle=pose[2]*Math.PI/180;
      const dx=30.24*Math.cos(handAngle)+51.3*Math.sin(handAngle),dy=30.24*Math.sin(handAngle)-51.3*Math.cos(handAngle);
      const x=pose[6]-750+dx,y=pose[7]-530+dy;
      chakramHand={x:state.heroX+(pose[0]+x*Math.cos(bodyAngle)-y*Math.sin(bodyAngle))*k/width,
        y:(pose[1]-180+x*Math.sin(bodyAngle)+y*Math.cos(bodyAngle))*k/unit,angle:handAngle+bodyAngle};
    }
    if(!throwing||state.phase==='dead'||state.completed||chakramFlight?.returning&&!recovery)chakramFlight=null;
    if(throwing&&weaponImage&&state.phase==='fight'&&(state.heroClock>=interval*.85 || state.doubleStrikeDelay > 0 && state.doubleStrikeDelay < interval*.08)&&!chakramFlight){
      const target=state.enemies.find(enemy=>enemy.id===state.targetId&&enemy.hp);
      if(target)chakramFlight={...chakramHand,targetId:target.id,returning:false};
    }
    context.fillStyle = '#785b3844'; context.beginPath(); context.ellipse(heroX, base + 2, hSize * .3, 3, 0, 0, Math.PI * 2); context.fill();
    const equipped = Object.fromEntries(Object.keys(heroRig.slots).map(slot => {
      const item=state.equipment[slot],id=slot==='weapon'&&customWeapon?undefined:previewRig?(previewRig.slots[slot]?previewSet:undefined):(slot==='weapon'?((item?.epoch??1)===1?['hunter-hides','bone-warrior','stone-guard']:[]):ARMOR_SETS[(item?.epoch??1)-1])?.[item?.quality];
      if(id&&!art[id]&&!loadingSets.has(id)){
        loadingSets.add(id);const image=new Image();image.src=`assets/sets/${id}/atlas.png?v=${artVersion}`;
        Promise.all([image.decode(),fetch(`assets/sets/${id}/atlas.json?v=${artVersion}`).then(r=>{if(!r.ok)throw Error('Equipment metadata missing');return r.json();})]).then(([,meta])=>{rigs[id]=meta;art[id]=image;}).catch(error=>console.error('Could not load equipment',id,error));
      }
      return [slot,art[id]?id:undefined];
    }));
    if(ranged&&!throwing){
      const sources=new Set([sets[0],...Object.values(equipped).filter(Boolean)]);
      for(const id of sources){const key=id+'-shoot';if(!art[key]&&!loadingSets.has(key)){loadingSets.add(key);const img=new Image();img.src=`assets/sets/${id}/shoot-atlas.png?v=${artVersion}`;img.decode().then(()=>art[key]=img).catch(console.error);}}
    }
    if(customWeapon){
      const key=weaponSource+'-weapon';
      if(!art[key]&&!loadingSets.has(key)){
        loadingSets.add(key);const img=new Image();img.src=`assets/sets/${weaponSource}/weapon-atlas.png?v=${artVersion}`;
        Promise.all([img.decode(),rigs[weaponSource]||fetch(`assets/sets/${weaponSource}/atlas.json?v=${artVersion}`).then(r=>{if(!r.ok)throw Error('Weapon metadata missing');return r.json();})]).then(([,meta])=>{rigs[weaponSource]=meta;art[key]=img;}).catch(console.error);
      }
    }
    context.save();
    context.translate(heroX, base);
    for (let row=0;row<heroRig.rows.length;row++) {
      const name=heroRig.rows[row],slot=heroSlots[row];
      const standalone = name === 'weapon' && customWeapon && weaponImage;
      if(name==='weapon'&&chakramFlight)continue;
      if (name==='head-helmet' || name.endsWith('-booted') || slot && !equipped[slot] && !standalone) continue;
      if (equipped.legs && name==='shorts') continue;
      if (equipped.gloves && ['back-hand','front-hand'].includes(name)) continue;
      const sourceName=name==='head' && equipped.helmet ? 'head-helmet' : equipped.boots && ['back-leg','front-leg'].includes(name) ? name+'-booted' : name;
      const source=standalone?weaponSource:slot?equipped[slot]:name==='head'&&equipped.helmet?equipped.helmet:sets[0],rig=rigs[source],cell=rig.cell,padded=hSize/rig.bodyHeight;
      const shotRow=rig.shootRows?.indexOf(sourceName)??-1,useShot=shooting&&shotRow>=0&&art[source+'-shoot'];
      context.save();
      const planted=combat&&/leg|boot|hip/.test(name);
      if(combat&&!planted){
        const k=hSize/590, radians=Math.PI/180;
        // Move the existing body cell into the interpolated pose, keeping feet fixed.
        context.translate(pose[0]*k,pose[1]*k-180*k);
        context.rotate(pose[2]*radians);
        context.translate(0,180*k);
        const arm=name==='back-arm'||name==='front-arm';
        const held=name==='weapon'||/hand|glove/.test(name);
        if(arm||held){
          const hand=name.includes('back')?3:6;
          if(arm){
            const sx=hand===3?666:826,sy=hand===3?447:463;
            const ax=sourcePose[hand]-sx,ay=sourcePose[hand+1]-sy,bx=pose[hand]-sx,by=pose[hand+1]-sy;
            context.translate((sx-750)*k,(sy-710)*k);
            context.rotate(Math.atan2(by,bx));
            context.scale(Math.hypot(bx,by)/Math.hypot(ax,ay),1);
            context.rotate(-Math.atan2(ay,ax));
            context.translate((750-sx)*k,(710-sy)*k);
          }else{
            context.translate((pose[hand]-750)*k,(pose[hand+1]-710)*k);
            context.rotate((pose[hand+2]-sourcePose[hand+2]+(standalone?weaponTurn:0))*radians);
            context.translate((750-sourcePose[hand])*k,(710-sourcePose[hand+1])*k);
          }
        }
        if(name==='cape'&&guard){
          context.translate(0,-hSize*.46);context.rotate(guard*.035);context.translate(0,hSize*.46);
        }
        context.translate(0,-180*k);context.rotate(-sourcePose[2]*radians);
        context.translate(-sourcePose[0]*k,(180-sourcePose[1])*k);
      }
      if (state.phase === 'dead') {
        const t=Math.max(0,1.8-state.phaseTime);
        context.globalAlpha=Math.max(0,1-Math.max(0,t-.55)/.65);
        if (!reducedMotion.matches) {
          // Equipment shares the impulse and pivot of the limb it covers.
          const head=['head','helmet'].includes(name),leg=/leg|boot|hip/.test(name),arm=/arm|hand|glove/.test(name)||name==='weapon';
          const back=name.includes('back');
          const px=(leg?(back?-.14:.14):arm?(back?-.25:.28):0)*hSize,py=(head?-.83:leg?-.18:-.5)*hSize;
          const vx=head?-20:leg?(back?-32:34):arm?(back?-52:55):6,vy=head?-72:leg?-35:arm?-48:-48;
          const spin=head?-2:leg?(back?-2.5:2.5):arm?(back?-3:3):.7;
          context.translate(px+vx*t*unit,py+(vy*t+100*t*t)*unit);context.rotate(spin*t);context.translate(-px,-py);
        }
      }
      const image=standalone?weaponImage:useShot?art[source+'-shoot']:art[source];
      const column=planted?0:standalone?(shooting?22+shotFrame:heroFrame):useShot?shotFrame:heroFrame;
      const sourceRow=standalone?rig.weaponRows.indexOf(weapon.weaponId):useShot?shotRow:rig.rows.indexOf(sourceName);
      context.drawImage(image,column*cell,sourceRow*cell,cell,cell,-padded*rig.anchor[0],-padded*rig.anchor[1],padded,padded);
      context.restore();
    }
    context.restore();
    if (!state.completed && state.phase !== 'dead') bar(heroX, base - hSize - 9, state.hp / stats(state).hp, '#56df51');
    if(companion?.kind==='druid' && companion.healAge<.7 && state.hp>0 && state.phase!=='dead'){
      context.save();
      if(companion.healAge<.3){
        context.globalAlpha=(1-companion.healAge/.3)*.22;
        context.fillStyle='#a3f68a';context.beginPath();context.ellipse(heroX,base-hSize*.45,hSize*.4,hSize*.65,0,0,Math.PI*2);context.fill();
      }
      for(let i=0;i<3;i++){
        const t=reducedMotion.matches?i/3:(time*.6+i/3)%1;
        const x=heroX+Math.sin(i*2.1+t*3)*17*unit,y=base-5*unit-t*(hSize+8);
        context.globalAlpha=reducedMotion.matches?.65:Math.sin(t*Math.PI)*.8;
        context.fillStyle=i%2?'#b8ed77':'#67c658';context.strokeStyle='#30673d';context.lineWidth=.65*unit;
        context.beginPath();context.ellipse(x,y,3*unit,1.5*unit,-.8+i*.7,0,Math.PI*2);context.fill();context.stroke();
      }
      context.restore();
    }
    const groups = state.enemies.length > 1;
    for (const e of state.enemies) {
      if (state.completed || (!e.hp && !e.deadTime)) continue;
      const x = (e.x - camera) * width, size = (e.boss ? bossSize : 50) * unit;
      const floor = base + (groups && !e.boss ? (e.id % 2 ? 7 : -5) * unit : 0);
      let frame = 0;
      if (!e.hp) frame = 15;
      else if (state.phase === 'dead' && !reducedMotion.matches) frame = 1 + Math.floor(time * 6) % 8;
      else if (state.phase !== 'dead' && state.phase !== 'victory') {
        if (e.moving && !reducedMotion.matches) frame = 1 + Math.floor(time * 6) % 8;
        else if (e.kind === 'archer' || e.kind === 'healer') {
          const clock = e.kind === 'healer' ? e.healClock - 2.05 : e.clock;
          if (e.actionAge < .25) frame = 12 + Math.min(2, Math.floor(e.actionAge * 12));
          else if (e.engaged && clock >= .70 && clock < .95) frame = 9 + Math.min(2, Math.floor((clock - .70) * 12));
        } else if (e.engaged) {
          const recovery = e.boss ? .50 : .42, windup = e.boss ? .58 : .68;
          if (e.actionAge < recovery) frame = e.actionAge < 1/12 ? 12 : e.actionAge < (e.boss ? .28 : .24) ? 13 : 14;
          else if (e.clock >= windup) frame = e.clock < (e.boss ? .82 : .88) ? 9 : e.clock < 1.02 ? 10 : 11;
        }
      }
      context.fillStyle = '#785b3844'; context.beginPath(); context.ellipse(x, floor + (e.boss ? 2 : 1), size * .3, e.boss ? 3 : 1.5, 0, 0, Math.PI * 2); context.fill();
      const row = e.boss ? 3 : ['warrior','archer','healer'].indexOf(e.kind);
      if (biomeSprites) {
        const pose = [0,1,2,3,4,1,2,3,4,5,5,5,6,6,0,7][frame];
        context.drawImage(biomeSprites,pose*192,row*192,192,192,x-size/2,floor-size*180/192,size,size);
      } else {
        context.drawImage(art[e.kind],frame*192,0,192,192,x-size/2,floor-size*180/192,size,size);
      }
      if (e.hp) bar(x, floor - size * (biomeHeights?.[row] ?? .63) - (e.boss ? 6 : 3), e.hp/e.maxHp, e.boss ? '#f49c3b' : e.kind === 'healer' ? '#56dfb4' : '#f45152', e.boss ? 49 : 17.5, e.boss ? 1 : .5);
      if (e.kind === 'archer' && e.hp && e.actionAge < .15 && state.phase !== 'dead') {
        const tankX=companion?.kind==='turtle'&&companion.hp>0&&companion.x>state.heroX?(companion.x-camera)*width:heroX;
        const p = e.actionAge / .15, ax = (x - 9*unit)*(1-p) + (tankX + 8*unit)*p;
        const ay = (floor - 14*unit)*(1-p) + (base - 28*unit)*p;
        context.strokeStyle = '#283b3a'; context.fillStyle = biome.shot; context.lineWidth = 1;
        if (biomeIndex===0 || biomeIndex===2 || biomeIndex===3 || biomeIndex===9) {
          context.beginPath();context.moveTo(ax+6.5,ay);context.lineTo(ax,ay);context.stroke();
          context.beginPath();context.moveTo(ax,ay);context.lineTo(ax+2,ay-1.5);context.lineTo(ax+2,ay+1.5);context.closePath();context.fill();
        } else { context.beginPath();context.ellipse(ax,ay,3,2,0,0,Math.PI*2);context.fill();context.stroke(); }
      }
    }
    if(chakramFlight&&chakramHand){
      const flight=chakramFlight,returning=flight.returning;
      const target=state.enemies.find(enemy=>enemy.id===flight.targetId);
      const progress=Math.min(1,Math.max(0,returning?state.heroActionAge/(interval*.2):(state.heroClock/interval-.85)/.15));
      const travel=returning?progress*progress*(3-2*progress):Math.sin(progress*Math.PI/2);
      const fromX=returning?flight.hitX:flight.x,fromY=returning?flight.hitY:flight.y;
      const toX=returning?chakramHand.x:target.x;
      const toY=returning?chakramHand.y:(groups&&!target.boss?(target.id%2?7:-5):0)-(target.boss?bossSize:50)*.34;
      const arc=reducedMotion.matches?0:Math.sin(Math.PI*progress)*(returning?14:-8);
      const x=(fromX+(toX-fromX)*travel-camera)*width,y=base+(fromY+(toY-fromY)*travel+arc)*unit;
      const spin=reducedMotion.matches?0:returning?Math.PI*4+(Math.PI*4+chakramHand.angle)*progress:flight.angle+(Math.PI*4-flight.angle)*progress;
      const cell=heroRig.cell,padded=hSize/heroRig.bodyHeight,k=hSize/590;
      context.save();context.translate(x,y);context.rotate(spin);
      // Reuse the held weapon's atlas cell; no extra image or projectile damage logic.
      context.drawImage(weaponImage,0,heroRig.weaponRows.indexOf('chakram')*cell,cell,cell,
        -padded*heroRig.anchor[0]-198.24*k,-padded*heroRig.anchor[1]+247.3*k,padded,padded);
      context.restore();
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i]; coin.age += dt;
      if (coin.age >= coin.life) { coins.splice(i, 1); continue; }
      const t = coin.age;
      const x = (coin.x - camera) * width + coin.vx * t * unit;
      const y = base + (coin.y + coin.vy * t + 150 * t * t) * unit;
      const radiusX = (1.2 + 2 * Math.abs(Math.cos(t * 15 + coin.spin))) * unit;
      context.globalAlpha = Math.min(1, (coin.life - t) / .18);
      if(coin.rune){context.drawImage(art.rune,x-10*unit,y-10*unit,20*unit,20*unit);context.globalAlpha=1;continue;}
      context.fillStyle = '#ffcb42'; context.strokeStyle = '#92571e'; context.lineWidth = 1.2 * unit;
      context.beginPath(); context.ellipse(x, y, radiusX, 3.5 * unit, -.2, 0, Math.PI * 2); context.fill(); context.stroke();
      context.strokeStyle = '#fff1a8'; context.lineWidth = unit;
      context.beginPath(); context.moveTo(x, y - 1.5 * unit); context.lineTo(x, y + 1.5 * unit); context.stroke();
      context.globalAlpha = 1;
    }
    for (let i = numbers.length - 1; i >= 0; i--) {
      const n = numbers[i]; n.life -= dt;
      if (n.life <= 0) { numbers.splice(i,1); continue; }
      const e = n.targetId === null ? null : state.enemies.find(e => e.id === n.targetId);
      const age = (n.duration || .8) - n.life, anchorX = n.tank && companion ? (companion.x-camera)*width : e ? (e.x-camera)*width : heroX;
      if (!n.reward) {
        // Capture the hit position once so the number separates from a moving character.
        n.originX ??= n.tank && companion ? companion.x : e ? e.x : state.heroX;
        n.originY ??= base - (e ? (e.boss ? bossSize : 50)*unit*(biomeHeights?.[e.boss?3:['warrior','archer','healer'].indexOf(e.kind)] ?? .63) : hSize) - 10;
        const still = reducedMotion.matches, progress = Math.min(1,age/n.duration);
        const travelX = still ? 0 : n.healing ? Math.sin(progress*Math.PI*2)*4 : n.drift*progress;
        const travelY = still ? 0 : n.healing ? -32*progress : -70*progress+46*progress*progress;
        const pop = still ? 1 : n.healing ? 1+.08*Math.sin(Math.min(1,age/.2)*Math.PI) : age<.1 ? .7+age/.1*.6 : age<.25 ? 1.3-(age-.1)/.15*.3 : 1;
        const fontSize = n.critical ? 21 : n.healing ? 16 : 17;
        context.save();
        context.font = `${fontSize}px "Lilita UI", "Trebuchet MS", sans-serif`;
        const margin = context.measureText(n.text).width*1.3/2+4;
        const x = Math.max(margin,Math.min(width-margin,(n.originX-camera)*width+travelX*unit));
        context.translate(x,n.originY+travelY*unit);context.scale(pop,pop);
        if(!still&&!n.healing)context.rotate(Math.sign(n.drift)*.09*progress);
        context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';
        context.globalAlpha=Math.min(1,n.life/.25);context.lineWidth=n.critical?4:3.5;
        context.strokeStyle='#142725';context.fillStyle=n.color;
        context.strokeText(n.text,0,0);context.fillText(n.text,0,0);context.restore();
        continue;
      }
      context.font = n.runeIcon ? 'bold 16px "Trebuchet MS", sans-serif' : n.reward ? 'bold 11px "Trebuchet MS", sans-serif' : 'bold 12px "Trebuchet MS", sans-serif';
      // Damage rises above the target; loot occupies two separate rows below its feet.
      const x = n.reward ? Math.min(width - context.measureText(n.text).width - 6, anchorX + 24 * unit + age * 8) : anchorX;
      const y = n.reward ? base + 12 + (n.rewardRow || 0) * 16 - age * 12
        : base - (e ? (e.boss ? bossSize : 50)*unit*(biomeHeights?.[e.boss?3:['warrior','archer','healer'].indexOf(e.kind)] ?? .63) : hSize) - 10 - age * 22;
      context.globalAlpha = Math.min(1,n.life*4); context.lineWidth = 3;
      if (n.coinIcon) {
        context.beginPath(); context.arc(x - 8, y - 4, 4.5, 0, Math.PI * 2);
        context.fillStyle = '#ffcb42'; context.strokeStyle = '#92571e'; context.lineWidth = 1.5;
        context.fill(); context.stroke();
        context.beginPath(); context.moveTo(x - 8, y - 6); context.lineTo(x - 8, y - 2);
        context.strokeStyle = '#fff1a8'; context.stroke(); context.lineWidth = 3;
      }
      if (n.runeIcon) context.drawImage(art.rune,x-23,y-18,20,20);
      if (n.hammerIcon) context.drawImage(art.hammer, x - 15, y - 13, 13, 14);
      context.strokeStyle = '#142725'; context.fillStyle = n.color;
      context.strokeText(n.text,x,y); context.fillText(n.text,x,y); context.globalAlpha = 1;
    }
    // This is inside the canvas. DOM portrait, currency and level HUD stay bright.
    const leaving=state.phase==='dead'||state.phase==='victory'&&state.encounter===9;
    const shade=leaving?Math.max(0,Math.min(1,1-state.phaseTime/.45)):reveal/.55;
    if(shade>0){context.fillStyle=`rgba(8,19,18,${shade})`;context.fillRect(0,0,width,height);}
    if(levelTitle){
      const t=levelTitle.age;
      context.save();context.globalAlpha=Math.min(1,t/.25,(2-t)/.4);
      context.font=`${Math.round(32*unit)}px "Lilita UI", "Trebuchet MS", sans-serif`;
      context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';context.lineWidth=5*unit;
      context.strokeStyle='#142725';context.fillStyle='#fff5d7';
      context.strokeText(levelTitle.text,width/2,titleY);context.fillText(levelTitle.text,width/2,titleY);
      if(levelTitle.location){context.font=`${Math.round(18*unit)}px "Lilita UI",sans-serif`;context.lineWidth=4*unit;context.strokeText(levelTitle.location,width/2,titleY+28*unit);context.fillText(levelTitle.location,width/2,titleY+28*unit);}
      context.restore();
    }
  }
  resize();
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  return { render, emit, prepare, get loading(){return loading;}, previewName:previewRig?.name };
}
