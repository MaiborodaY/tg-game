import test from 'node:test';
import assert from 'node:assert/strict';
import { anvilSkipCost, skipAnvilUpgrade, BIOMES, LEVELS_PER_BIOME, MAX_LEVEL } from './game.mjs';
import { idleRewards, collectIdleRewards } from './game.mjs';
import { freshGame, stats, itemLevel, forge, forgeCost, equip, equipStronger, sell, sellWeaker, step, restore, replay, enemyFor, WAVES, SLOTS, batchSize, browseResults, upgradeAnvil, finishUpgrade, ANVILS, FORGE_CHANCES, WEAPONS } from './game.mjs';
function advance(s, seconds) { const events=[]; for(let i=0;i<seconds*30;i++)events.push(...step(s,1/30)); return events; }
function wave(level,index) {
 const s=freshGame();s.level=s.highest=level;s.encounter=index?index-1:0;s.phase=index?'victory':'dead';s.phaseTime=0;step(s,1/30);return s;
}
function durable(s) { s.equipment.helmet=candidate('helmet',10000);s.equipment.weapon=candidate('weapon',2);s.hp=stats(s).hp;return s; }

test('paid anvil skip scales with remaining time, preserves poor balances, and charges once',()=>{
 const s=freshGame();s.coins=1000;
 assert.equal(anvilSkipCost(s,1000),0);assert.equal(skipAnvilUpgrade(s,1000),false);
 upgradeAnvil(s,1000);assert.equal(anvilSkipCost(s,1000),450);assert.equal(anvilSkipCost(s,151000),225);
 const loaded=restore(JSON.stringify(s),151000);assert.equal(anvilSkipCost(loaded,151000),225);
 loaded.coins=224;const before=structuredClone(loaded);assert.equal(skipAnvilUpgrade(loaded,151000),false);assert.deepEqual(loaded,before);
 loaded.coins=225;assert.equal(skipAnvilUpgrade(loaded,151000),true);assert.equal(loaded.coins,0);assert.equal(loaded.anvilLevel,2);assert.equal(loaded.upgradeEndsAt,0);
 assert.equal(skipAnvilUpgrade(loaded,151000),false);assert.equal(loaded.anvilLevel,2);
 assert.equal(skipAnvilUpgrade(s,301000),true);assert.equal(s.coins,850);assert.equal(s.anvilLevel,2);
 assert.equal(skipAnvilUpgrade(s,301000),false);
 const last=freshGame();last.anvilLevel=80;last.coins=1e9;assert.equal(anvilSkipCost(last),0);assert.equal(skipAnvilUpgrade(last),false);
});

test('chosen batch controls manual and auto forging, persists, and spends partial remainder',()=>{
 const s=freshGame();s.hammers=7;s.selectedBatch=1;
 forge(s);assert.equal(s.forgingItems.length,1);assert.equal(s.hammers,6);
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.selectedBatch,1);
 loaded.autoForge=true;advance(loaded,1.6);
 assert.equal(loaded.forgingItems.length,1);assert.equal(loaded.hammers,5);
 loaded.forging=0;loaded.forgingItems=[];loaded.selectedBatch=2;loaded.hammers=1;
 forge(loaded);assert.equal(loaded.forgingItems.length,1);assert.equal(loaded.hammers,0);
 assert.equal(loaded.autoForge,false);
 const old=freshGame();old.coins=713;delete old.selectedBatch;
 assert.equal(restore(JSON.stringify(old)).coins,713);
 assert.equal(restore(JSON.stringify(old)).selectedBatch,null);
 old.selectedBatch=40;assert.equal(restore(JSON.stringify(old)).selectedBatch,null);
});

test('forge drops only connected sets across every slot and preserves old owned items',()=>{
 for(let bucket=0;bucket<12;bucket++)for(const roll of [0,.499,.5,.999]){
  const s=freshGame();s.hammers=1;
  const rolls=[(bucket+.1)/12,0,0,roll];
  forge(s,()=>rolls.shift());
  const item=s.forgingItems[0];
  if(bucket===0){assert.equal(WEAPONS[item.weaponId].epoch,1);assert.equal(item.quality,WEAPONS[item.weaponId].quality);assert.equal(item.name,WEAPONS[item.weaponId].name);}
  else{assert.equal(item.quality,roll<.5?0:1);assert.match(item.name,/^(Hunter|Bone)/);}
 }
 const s=freshGame();s.equipment.weapon={slot:'weapon',name:'Forest Guardian Sword',quality:2,value:17,sale:1};
 const loaded=restore(JSON.stringify(s));
 assert.equal(loaded.equipment.weapon.quality,2);
 assert.equal(loaded.equipment.weapon.value,17);
});

test('agreed first ten levels and 100 wave compositions',()=>{
 assert.deepEqual(stats(freshGame()),{hp:20,damage:2});
 for(let level=1;level<=10;level++){
  assert.equal(WAVES[level-1].length,10);
  for(let n=0;n<10;n++){
   const s=wave(level,n);assert.equal(s.enemies.some(e=>e.boss),n===9);
   assert.ok(s.enemies.length<=5);
   if(level<6)assert.ok(s.enemies.every(e=>e.kind!=='healer'));
  }
  assert.equal(enemyFor(level).maxHp,10+2*(level-1));
  assert.equal(enemyFor(level).damage,level<6?2:3);
  assert.equal(enemyFor(level,'archer').maxHp,level+4);
  assert.equal(enemyFor(level,'archer').damage,level<10?1:2);
  assert.equal(enemyFor(level,'boss').maxHp,6*(10+2*(level-1)));
  assert.equal(enemyFor(level,'boss').damage,level<6?5:level<10?6:7);
  assert.equal(enemyFor(level,'healer').healing,level<10?1:2);
 }
 assert.ok(enemyFor(200).maxHp>enemyFor(100).maxHp);
});

test('group attacks: two melee attackers maximum, ranged damage before hero reaches archers',()=>{
 const s=durable(wave(10,6));for(const e of s.enemies)if(e.kind==='warrior')e.hp=e.maxHp=1000;
 let arrow=false,hit=false,heroHit=false;
 for(let i=0;i<30*15;i++){
  const events=step(s,1/30);
  assert.ok(s.enemies.filter(e=>e.hp>0&&e.engaged&&(e.kind==='warrior'||e.boss)).length<=2);
  for(const e of events){
   if(e.type==='enemyShot')arrow=true;
   if(e.type==='enemyHit'&&e.ranged)hit=true;
   if(e.type==='heroHit'){heroHit=true;assert.equal(s.enemies[e.targetId].kind,'warrior');}
  }
 }
 assert.ok(arrow&&hit&&heroHit);
 const ranged=durable(wave(4,3));let sawRangedHit=false;
 for(let i=0;i<30*8;i++){
  for(const e of step(ranged,1/30))if(e.type==='enemyHit'&&e.ranged&&ranged.phase==='walk')sawRangedHit=true;
 }
 assert.ok(sawRangedHit);
});

test('healer keeps healing every three seconds, never itself or a dead ally',()=>{
 const s=durable(wave(10,6));
 const tank=s.enemies.find(e=>e.kind==='warrior');tank.hp=300;tank.maxHp=1000;
 const healer=s.enemies.find(e=>e.kind==='healer');healer.hp=3;const ownHp=healer.hp;
 const dead=s.enemies.find(e=>e.kind==='archer');dead.hp=0;
 const events=advance(s,30),heals=events.filter(e=>e.type==='heal');
 assert.ok(heals.length>=7);assert.ok(heals.every(e=>e.sourceId===healer.id&&e.targetId===tank.id&&e.value===2));
 assert.equal(healer.hp,ownHp);assert.equal(dead.hp,0);
});

test('killing one member keeps the wave active, pays once, and retargets the next living enemy',()=>{
 const s=durable(wave(3,1));s.equipment.weapon.value=100;
 const initial=s.coins;let killed;
 for(let i=0;i<500&&!killed;i++)killed=step(s,1/30).find(e=>e.type==='kill');
 assert.ok(killed);assert.notEqual(s.phase,'victory');assert.equal(s.encounter,1);assert.equal(s.coins,initial+s.enemies[killed.targetId].reward);
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded,s);
 const events=advance(loaded,3);assert.equal(events.filter(e=>e.type==='kill').length,1);assert.equal(loaded.kills,2);
});

function finishForge(s) { s.phase='dead'; s.phaseTime=100; advance(s,1.6); }
function candidate(slot='chest', value=20) { return {slot,name:slot==='weapon'?'Hunter Club':slot==='helmet'?'Hunter Fur Hood':'Hunter Leather Vest',quality:0,value,sale:1}; }

test('ordinary enemies drop hammers at 20 percent, inclusive ranges, one payout per kill',()=>{
 for (const [roll,qty] of [[.2,0],[.199,3],[.1,3],[0,1]]) {
  const s=freshGame();s.hammers=0;s.enemies[0].hp=1;s.enemies[0].x=s.heroX+.115;
  let calls=0;const rng=()=>calls++===0?roll:roll===0?0:.999;
  const events=step(s,1.3,rng);assert.equal(events.find(e=>e.type==='kill').hammers,qty);
  assert.equal(s.hammers,qty);assert.equal(s.coins,5);
  step(s,.01,()=>0);assert.equal(s.hammers,qty);assert.equal(s.coins,5);
 }
 const last=wave(200,9);last.hammers=0;last.equipment.weapon=candidate('weapon',1e15);
 const boss=last.enemies.find(e=>e.boss);boss.x=last.heroX+.165;
 step(last,1.3,()=>.499);assert.equal(last.hammers,335);assert.equal(last.coins,7632);
});

test('bosses always give five times their biome hammer roll, including high rolls, and only once',()=>{
 for (const [roll,quantity] of [[0,5],[.5,10],[.999,15]]) {
  const s=wave(1,9),boss=s.enemies[0];s.hammers=0;boss.hp=1;boss.x=s.heroX+.165;
  const events=step(s,1.3,()=>roll);
  assert.equal(events.find(e=>e.type==='kill').hammers,quantity);
  assert.equal(s.hammers,quantity);assert.equal(s.coins,25);
  step(s,.01,()=>0);assert.equal(s.hammers,quantity);assert.equal(s.coins,25);
 }
});

test('idle rewards count whole minutes online and offline, cap at four hours, and wait for collection',()=>{
 const start=1000000,s=freshGame(start);s.coins=75;s.hammers=9;
 assert.equal(idleRewards(s,start-1),0);assert.equal(idleRewards(s,start+59999),0);
 assert.equal(idleRewards(s,start+60000),1);assert.equal(idleRewards(s,start+239*60000+59999),239);
 assert.equal(idleRewards(s,start+240*60000),240);
 const later=start+24*3600000,loaded=restore(JSON.stringify(s),later);
 assert.equal(idleRewards(loaded,later),240);assert.equal(loaded.coins,75);assert.equal(loaded.hammers,9);
 assert.equal(loaded.kills,0);assert.deepEqual(loaded.equipment,s.equipment);
 assert.equal(collectIdleRewards(loaded,later),240);assert.equal(loaded.coins,315);assert.equal(loaded.hammers,249);
 assert.equal(collectIdleRewards(loaded,later),0);assert.equal(loaded.coins,315);
 const reloaded=restore(JSON.stringify(loaded),later+59999);
 assert.equal(idleRewards(reloaded,later+59999),0);assert.equal(idleRewards(reloaded,later+60000),1);
});

test('early collection preserves partial minutes and old saves start an empty buffer without losing progress',()=>{
 const start=1000000,s=freshGame(start),before=structuredClone(s);
 assert.equal(collectIdleRewards(s,start+59999),0);assert.deepEqual(s,before);
 assert.equal(collectIdleRewards(s,start+95000),1);assert.equal(s.coins,1);assert.equal(s.hammers,6);
 const loaded=restore(JSON.stringify(s),start+119999);
 assert.equal(idleRewards(loaded,start+119999),0);assert.equal(collectIdleRewards(loaded,start+120000),1);
 assert.equal(loaded.coins,2);assert.equal(loaded.hammers,7);assert.equal(loaded.autoForge,false);
 const old=wave(4,3);old.coins=713;old.hammers=18;delete old.idleSince;
 const migrated=restore(JSON.stringify(old),start);
 assert.equal(migrated.idleSince,start);assert.equal(idleRewards(migrated,start),0);
 assert.equal(migrated.coins,713);assert.equal(migrated.hammers,18);
 assert.equal(migrated.level,4);assert.equal(migrated.encounter,3);assert.deepEqual(migrated.equipment,old.equipment);
 assert.equal(idleRewards(restore(JSON.stringify(migrated),start+60000),start+60000),1);
});

test('batch spends one hammer per item, keeps coins, rolls once, and resumes animation after reload',()=>{
 const s=freshGame();s.hammers=5;s.coins=80;
 assert.equal(forge(s,()=>0),true);assert.equal(s.hammers,3);assert.equal(s.coins,80);
 assert.equal(s.forgingItems.length,2);assert.equal(s.pending,null);assert.equal(forge(s),false);
 const restored=restore(JSON.stringify(s));assert.deepEqual(restored,s);finishForge(restored);
 assert.equal(restored.hammers,3);assert.equal(restored.pending.value,2);assert.equal(restored.results.length,1);
 assert.equal(restored.mastery[0].xp,2);
 forge(restored,()=>0);finishForge(restored);assert.equal(restored.results.length,3);
 forge(restored,()=>0);assert.equal(restored.forgingItems.length,1);assert.equal(restored.hammers,0);
 assert.equal(batchSize({...s,highest:200}),40);assert.equal(batchSize({...s,level:1,highest:21}),6);
});

test('mastery levels are epoch-specific; level roll precedes XP and reaches cap 100',()=>{
 const s=freshGame();s.hammers=2;s.mastery[0]={level:1,xp:4};
 let calls=0;forge(s,()=>[0,0,.999,0][calls++%4]);
 assert.deepEqual(s.forgingItems.map(i=>i.itemLevel),[1,2]);assert.deepEqual(s.mastery[0],{level:2,xp:1});
 finishForge(s);s.anvilLevel=2;s.hammers=1;calls=0;
 forge(s,()=>[0,.999,.999,.3][calls++%4]);assert.equal(s.forgingItems[0].epoch,2);assert.equal(s.forgingItems[0].value,20);
 assert.equal(s.mastery[1].xp,1);assert.equal(s.mastery[0].xp,1);
 finishForge(s);s.anvilLevel=1;s.hammers=2;s.mastery[0]={level:99,xp:102};calls=0;
 forge(s,()=>[0,0,.999,.999][calls++%4]);assert.deepEqual(s.forgingItems.map(i=>i.itemLevel),[99,100]);
 assert.deepEqual(s.mastery[0],{level:100,xp:0});
 finishForge(s);s.hammers=1;forge(s,()=>0);assert.equal(s.forgingItems[0].itemLevel,1);assert.equal(s.forgingItems[0].value,2);
});

test('melee damage and ranged discount use the supported epoch even at maximum anvil level',()=>{
 const values=[];
 const pool=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===10);
 for(const id of ['seraph-glaive','sun-maul','oath-bell','halo-bow']){const set=(pool.indexOf(id)+.5)/pool.length;const s=freshGame();s.hammers=1;s.anvilLevel=80;s.mastery[9].level=100;let calls=0;
 forge(s,()=>[0,.999,.999,set][calls++%4]);const i=s.forgingItems[0];values.push(i.value);assert.equal(i.sale,7);assert.equal(i.epoch,10);assert.equal(i.itemLevel,100);}
 assert.deepEqual(values,[11900000000,11900000000,11900000000,9520000000]);
});

test('auto continues with unresolved results, stops on zero/manual toggle, does not restart on loot',()=>{
 const s=freshGame();s.hammers=5;s.autoForge=true;s.phase='dead';s.phaseTime=100;
 advance(s,5);assert.equal(s.hammers,0);assert.equal(s.autoForge,false);assert.equal(s.results.length+1,5);
 s.hammers=7;advance(s,2);assert.equal(s.hammers,7);
 s.autoForge=true;step(s,1/30,()=>0);s.autoForge=false;finishForge(s);assert.equal(s.hammers,5);
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded,s);
 const idle=restore(JSON.stringify({...s,autoForge:true}),Date.now()+86400000);assert.equal(idle.hammers,s.hammers);assert.equal(idle.kills,s.kills);
});

test('auto epoch filter sells only matching new rolls, keeps queued cards, and filters the last paid batch after reload',()=>{
 const s=freshGame();s.anvilLevel=2;s.coins=70;s.hammers=2;s.autoForge=true;s.autoSellEpochs=[1];
 s.pending={...candidate('weapon',7),epoch:1,itemLevel:1};s.results=[{...candidate('helmet',5),epoch:1,itemLevel:1}];
 const oldPending=structuredClone(s.pending),oldQueued=structuredClone(s.results[0]);
 const rolls=[0,0,0,0,0,.999,0,0];assert.equal(forge(s,()=>rolls.shift()),true);
 assert.equal(s.autoForge,false);assert.equal(s.forgingAuto,true);assert.equal(s.hammers,0);assert.equal(s.coins,70);
 assert.equal(s.mastery[0].xp,1);assert.equal(s.mastery[1].xp,1);
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.forgingAuto,true);assert.deepEqual(loaded.autoSellEpochs,[1]);
 loaded.phase='dead';loaded.phaseTime=100;
 const event=step(loaded,1.5).find(e=>e.type==='forged');
 assert.equal(event.count,2);assert.equal(event.soldCount,1);assert.equal(event.soldCoins,1);assert.equal(event.item.epoch,2);
 assert.equal(loaded.coins,71);assert.equal(loaded.hammers,0);assert.equal(loaded.forgingAuto,false);
 assert.deepEqual(loaded.pending,oldPending);assert.deepEqual(loaded.results[0],oldQueued);
 assert.equal(loaded.results.length,2);assert.equal(loaded.results[1].epoch,2);
 const again=restore(JSON.stringify(loaded));step(again,1.5);assert.equal(again.coins,71);assert.equal(again.results.length,2);
});

test('manual forging keeps excluded epochs; stopping auto finishes the paid batch and can sell every new item',()=>{
 const manual=freshGame();manual.autoSellEpochs=[1];manual.hammers=2;forge(manual,()=>0);finishForge(manual);
 assert.equal(manual.coins,0);assert.ok(manual.pending);assert.equal(manual.results.length,1);
 const s=freshGame();s.autoSellEpochs=[1];s.hammers=4;s.autoForge=true;forge(s,()=>0);s.autoForge=false;
 s.phase='dead';s.phaseTime=100;const events=step(s,1.5);
 assert.equal(events.find(e=>e.type==='forged').soldCoins,2);assert.equal(s.coins,2);assert.equal(s.hammers,2);
 assert.equal(s.pending,null);assert.deepEqual(s.results,[]);assert.equal(s.mastery[0].xp,2);
 step(s,1.5);assert.equal(s.coins,2);assert.equal(s.hammers,2);
});

test('older saves keep all epochs by default and retain paid items and progress',()=>{
 const s=freshGame();s.coins=713;s.hammers=5;forge(s,()=>0);delete s.autoSellEpochs;delete s.forgingAuto;
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.autoSellEpochs,[]);assert.equal(loaded.forgingAuto,false);
 assert.equal(loaded.coins,713);assert.equal(loaded.hammers,3);assert.equal(loaded.forgingItems.length,2);
 finishForge(loaded);assert.ok(loaded.pending);assert.equal(loaded.results.length,1);assert.equal(loaded.coins,713);
});

test('all twelve slots enter the pool; selected result stays stable during new batches',()=>{
 for(const [index,slot] of SLOTS.entries()){
  const s=freshGame();s.hammers=1;let calls=0;forge(s,()=>calls++===0?(index+.5)/12:0);
  assert.equal(s.forgingItems[0].slot,slot.startsWith('ring')?'ring':slot);
 }
 const s=freshGame();s.pending=candidate();s.results=[candidate('legs',5)];s.hammers=2;
 forge(s,()=>0);finishForge(s);assert.equal(s.pending.slot,'chest');assert.equal(s.results.length,3);
 browseResults(s);assert.equal(s.pending.slot,'legs');browseResults(s,-1);assert.equal(s.pending.slot,'chest');
 s.hp=13.25;const ratio=s.hp/stats(s).hp;assert.equal(equip(s),true);assert.equal(s.hp/stats(s).hp,ratio);
 const gold=s.coins;assert.equal(sell(s),true);assert.equal(s.coins,gold+1);assert.equal(s.pending.slot,'weapon');
});

test('rings replace only the chosen slot, including while another batch is being forged',()=>{
 const s=freshGame();s.pending=candidate('ring',3);s.hammers=2;forge(s,()=>0);
 assert.equal(equip(s),false);assert.equal(equip(s,'weapon'),false);assert.equal(equip(s,'ring2'),true);
 assert.equal(s.equipment.ring1,null);assert.equal(s.equipment.ring2.value,3);assert.equal(s.forgingItems.length,2);
 s.pending=candidate('ring',1);equip(s,'ring1');assert.equal(s.equipment.ring2.value,3);assert.equal(s.equipment.ring1.value,1);
});

test('anvil charges at start once, uses old probabilities until deadline and completes offline once',()=>{
 const s=freshGame();s.coins=149;assert.equal(upgradeAnvil(s,1000),false);s.coins=1000;
 assert.equal(upgradeAnvil(s,1000),true);assert.equal(s.coins,850);assert.equal(s.upgradeEndsAt,301000);
 assert.equal(upgradeAnvil(s,2000),false);assert.equal(s.coins,850);assert.equal(s.anvilLevel,1);
 s.hammers=1;forge(s,()=>.999);assert.equal(s.forgingItems[0].epoch,1);
 assert.equal(finishUpgrade(s,300999),false);
 const loaded=restore(JSON.stringify(s),301000);assert.equal(loaded.anvilLevel,2);assert.equal(loaded.upgradeEndsAt,0);assert.equal(loaded.coins,850);
 assert.equal(finishUpgrade(loaded,9999999),false);assert.equal(loaded.anvilLevel,2);
 loaded.anvilLevel=80;assert.equal(upgradeAnvil(loaded),false);
 assert.equal(ANVILS.reduce((sum,row)=>sum+row.minutes,0),330*1440);
 assert.equal(ANVILS[79].coins,2500000);
 for(const row of ANVILS)assert.ok(Math.abs(row.chances.reduce((a,b)=>a+b,0)-100)<.001);
});

test('legacy save preserves money, HP, gear, and already-paid pending forge; completed level 10 continues',()=>{
 for(const forging of [0,.7]) {
  const old={...freshGame(),version:2,coins:777,hp:13,pending:candidate('ring2',33),forging};
  old.equipment.weapon=candidate('weapon',2);old.equipment.helmet=candidate('helmet',5);old.equipment.chest=candidate('chest',15);
  const loaded=restore(JSON.stringify(old));assert.equal(loaded.version,3);assert.equal(loaded.coins,777);assert.equal(loaded.hp,13);
  assert.deepEqual(loaded.equipment,old.equipment);assert.equal(loaded.hammers,0);
  if(forging){assert.equal(loaded.pending,null);assert.equal(loaded.forgingItems[0].slot,'ring');finishForge(loaded);}
  assert.equal(loaded.pending.value,33);assert.equal(loaded.pending.slot,'ring');assert.deepEqual(restore(JSON.stringify(loaded)),loaded);
 }
 const done=wave(10,9);done.version=2;done.completed=true;done.phase='complete';done.enemies.forEach(e=>e.hp=0);
 const loaded=restore(JSON.stringify(done));assert.equal(loaded.completed,false);advance(loaded,.9);assert.equal(loaded.level,11);
 const old={...freshGame(),version:1,level:4,highest:5,encounter:2,hp:60,coins:555};
 const v3=restore(JSON.stringify(old));assert.equal(v3.version,3);assert.equal(v3.encounter,6);assert.equal(v3.coins,555);
 assert.deepEqual(restore(JSON.stringify(v3)),v3);assert.deepEqual(restore('{bad',1000),freshGame(1000));
});

test('200 levels use ten waves each; death retains loot and no between-wave healing',()=>{
 for(let level=11;level<=200;level++)for(let n=0;n<10;n++){const s=wave(level,n);assert.equal(s.enemies.some(e=>e.boss),n===9);assert.ok(s.enemies.length<=5);assert.deepEqual(restore(JSON.stringify(s)),s);}
 const s=wave(6,6);s.hp=1;s.hammers=7;s.coins=100;forge(s,()=>0);
 s.enemies[0].x=s.heroX+.115;s.enemies[0].engaged=true;s.enemies[0].clock=1.09;
 assert.ok(step(s,1/30).some(e=>e.type==='death'));advance(s,1.9);assert.equal(s.encounter,0);assert.equal(s.hp,stats(s).hp);assert.equal(s.coins,100);assert.equal(s.hammers,5);assert.ok(s.pending);
 s.hp=17;s.phase='victory';s.phaseTime=0;step(s,1/30);assert.equal(s.hp,17);
 const last=wave(200,9);last.phase='victory';last.phaseTime=0;
 assert.ok(step(last,1/30).some(e=>e.type==='complete'));assert.ok(restore(JSON.stringify(last)).completed);replay(last);assert.equal(last.level,1);assert.equal(last.highest,200);
});

test('biomes change only after their twentieth boss, and death retries the same biome',()=>{
 assert.equal(BIOMES.length*LEVELS_PER_BIOME,MAX_LEVEL);
 assert.equal(new Set(BIOMES.flatMap(b=>Object.values(b.names))).size,50);
 for(let i=0;i<BIOMES.length;i++){
  const first=i*20+1,last=(i+1)*20;
  assert.equal(enemyFor(first).name,BIOMES[i].names.warrior);
  assert.equal(enemyFor(last-1,'boss').name,BIOMES[i].names.commander);
  assert.equal(enemyFor(last,'boss').name,BIOMES[i].names.boss);
  const s=wave(last,9);s.coins=731;s.hammers=97;s.enemies.forEach(e=>e.hp=0);s.phase='victory';s.phaseTime=0;
  const events=step(s,1/30);
  if(i<9){
   assert.equal(s.level,last+1);assert.equal(s.encounter,0);assert.equal(s.enemies[0].name,BIOMES[i+1].names.warrior);
   assert.ok(events.some(e=>e.type==='level'&&e.level===last+1));
   assert.equal((s.level-1)%LEVELS_PER_BIOME+1,1);
   s.hp=0;s.phase='dead';s.phaseTime=0;step(s,1/30);
   assert.equal(s.level,last+1);assert.equal(s.encounter,0);assert.equal(s.enemies[0].name,BIOMES[i+1].names.warrior);
  }else assert.ok(s.completed);
  assert.equal(s.coins,731);assert.equal(s.hammers,97);
 }
});

test('pre-biome saves retain an in-progress legacy formation and owned progress',()=>{
 const s=wave(10,6);s.level=147;s.highest=153;s.coins=913;s.hammers=64;s.hp=13;
 s.equipment.weapon=candidate('weapon',71);
 for(const e of s.enemies){Object.assign(e,enemyFor(s.level,e.kind));e.hp=e.maxHp-1;e.name='Old goblin';}
 const loaded=restore(JSON.stringify(s));
 assert.equal(loaded.level,147);assert.equal(loaded.highest,153);assert.equal(loaded.encounter,6);
 assert.equal(loaded.coins,913);assert.equal(loaded.hammers,64);assert.equal(loaded.hp,13);
 assert.deepEqual(loaded.equipment,s.equipment);
 assert.deepEqual(loaded.enemies.map(e=>[e.id,e.kind,e.hp,e.x]),s.enemies.map(e=>[e.id,e.kind,e.hp,e.x]));
 assert.equal(loaded.enemies[0].name,BIOMES[7].names.warrior);
 loaded.enemies.forEach(e=>e.hp=0);loaded.phase='victory';loaded.phaseTime=0;step(loaded,1/30);
 assert.equal(loaded.encounter,7);assert.deepEqual(restore(JSON.stringify(loaded)),loaded);
});

test('completed version-one saves continue at level 11 without losing equipment or gold',()=>{
 const s={...freshGame(),version:1,level:10,highest:10,encounter:3,completed:true,phase:'complete',coins:999,hp:120};
 s.equipment.weapon=candidate('weapon',200);
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.coins,999);assert.equal(loaded.equipment.weapon.value,200);assert.equal(loaded.version,3);
 advance(loaded,.9);assert.equal(loaded.level,11);assert.equal(loaded.encounter,0);
});

test('runtime balance matches every approved CSV row',async()=>{
 const {readFileSync}=await import('node:fs');const {COMBAT}=await import('./balance.mjs');
 const csv=path=>{const [head,...rows]=readFileSync(new URL(path,import.meta.url),'utf8').trim().split(/\r?\n/);const keys=head.split(',');return rows.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],Number(v)])));};
 assert.deepEqual(COMBAT,csv('design/combat-progression-200.csv'));
 const anvil=csv('design/year-one-anvil.csv');
 anvil.forEach((row,i)=>{assert.equal(ANVILS[i].coins,row.upgrade_coins);assert.equal(ANVILS[i].minutes,row.upgrade_minutes);assert.deepEqual(ANVILS[i].chances,Object.entries(row).filter(([k])=>k.endsWith('_pct')).map(([,v])=>v));});
});


test('bare hero survives first enemy, earns hammers, forges and equips first weapon; empty saves resume',()=>{
 const s=freshGame();assert.ok(SLOTS.every(slot=>s.equipment[slot]===null));
 assert.equal(s.hammers,5);
 const existing=structuredClone(s);existing.hammers=0;assert.equal(restore(JSON.stringify(existing)).hammers,0);
 assert.equal(s.hp,20);assert.deepEqual(stats(s),{hp:20,damage:2});
 assert.deepEqual(restore(JSON.stringify(s)),s);
 for(let n=0;n<450 && !s.kills;n++)step(s,1/30,()=>0);
 assert.equal(s.kills,1);assert.equal(s.hp,4);assert.equal(s.deaths,0);assert.equal(s.hammers,6);
 assert.deepEqual(restore(JSON.stringify(s)),s);
 assert.equal(forge(s,()=>0),true);assert.equal(s.forgingItems.length,2);assert.equal(s.hammers,4);for(let n=0;n<46;n++)step(s,1/30,()=>0);
 const hp=s.hp;assert.equal(equip(s),true);assert.equal(stats(s).damage,4);assert.equal(stats(s).hp,20);assert.equal(s.hp,hp);
 assert.equal(s.equipment.helmet,null);assert.equal(s.equipment.chest,null);assert.deepEqual(restore(JSON.stringify(s)),s);
});


test('hero keeps walking between waves, including after reload, without early spawns or healing',()=>{
 const s=freshGame();s.hp=13;s.enemies[0].hp=1;s.enemies[0].x=s.heroX+.115;
 assert.ok(step(s,1.3,()=>0).some(e=>e.type==='kill'));assert.equal(s.phase,'victory');
 const startX=s.heroX, oldEnemies=s.enemies, coins=s.coins, hammers=s.hammers;
 const loaded=restore(JSON.stringify(s));
 step(s,.1);step(loaded,.1);assert.deepEqual(loaded,s);assert.ok(s.heroX>startX);
 assert.equal(s.enemies,oldEnemies);assert.ok(s.enemies.every(e=>e.hp===0));assert.equal(s.encounter,0);assert.equal(s.hp,13);
 let previousX=s.heroX;
 for(let i=0;i<25;i++){step(s,1/30);assert.ok(s.heroX>previousX);previousX=s.heroX;}
 assert.equal(s.encounter,1);assert.equal(s.phase,'walk');assert.ok(s.enemies[0].x-s.heroX>.76);
 assert.equal(s.hp,13);assert.equal(s.coins,coins);assert.equal(s.hammers,hammers);
 const dead=freshGame();dead.hp=0;dead.phase='dead';dead.phaseTime=1.8;const deadX=dead.heroX;step(dead,.5);assert.equal(dead.heroX,deadX);
});


test('bulk sale compares equipped slots, keeps upgrades and empty-slot items, pays once',()=>{
 const s=freshGame();s.coins=10;s.hp=13;s.equipment.weapon=candidate('weapon',6);
 s.equipment.chest=candidate('chest',12);s.equipment.ring1=candidate('ring1',2);s.equipment.ring2=candidate('ring2',5);
 s.pending=candidate('weapon',7);
 s.results=[candidate('weapon',6),candidate('weapon',5),candidate('chest',12),candidate('chest',13),candidate('helmet',1),candidate('ring',2),candidate('ring',3)];
 s.hammers=2;forge(s,()=>0);const before=structuredClone(s),selected=s.pending;
 assert.deepEqual(sellWeaker(s,true),{count:4,coins:4});assert.deepEqual(s,before);
 assert.deepEqual(sellWeaker(s),{count:4,coins:4});assert.equal(s.pending,selected);assert.equal(s.coins,14);
 assert.deepEqual(s.results.map(i=>[i.slot,i.value]),[['chest',13],['helmet',1],['ring',3]]);
 assert.deepEqual(s.equipment,before.equipment);assert.equal(s.hp,13);assert.deepEqual(s.forgingItems,before.forgingItems);assert.equal(s.forging,before.forging);
 assert.deepEqual(sellWeaker(s),{count:0,coins:0});assert.equal(s.coins,14);
});

test('bulk sale keeps all rings when either slot is empty and handles a removed selected item',()=>{
 const s=freshGame();s.equipment.weapon=candidate('weapon',5);s.equipment.ring1=candidate('ring1',20);
 s.pending=candidate('weapon',5);s.results=[candidate('ring',1),candidate('weapon',4)];
 assert.deepEqual(sellWeaker(s),{count:2,coins:2});assert.equal(s.pending.slot,'ring');assert.equal(s.pending.value,1);assert.equal(s.results.length,0);
 s.equipment.ring2=candidate('ring2',1);assert.deepEqual(sellWeaker(s),{count:1,coins:1});assert.equal(s.pending,null);assert.equal(s.results.length,0);
 assert.deepEqual(sellWeaker(s),{count:0,coins:0});
});


test('bulk confirmation sells only the shown cards while later forge results remain',()=>{
 const s=freshGame();s.equipment.weapon=candidate('weapon',5);s.pending=candidate('weapon',2);
 const selection=new Set([s.pending,...s.results]);assert.deepEqual(sellWeaker(s,true,selection),{count:1,coins:1});
 s.results.push(candidate('weapon',1));assert.deepEqual(sellWeaker(s,true,selection),{count:1,coins:1});
 assert.deepEqual(sellWeaker(s,false,selection),{count:1,coins:1});assert.equal(s.pending.value,1);assert.equal(s.coins,1);
});


test('ranged hero stops at range, hits before contact, and does not retreat when approached',()=>{
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'slingshot',name:'Hunter Slingshot',quality:0,epoch:1,itemLevel:1,value:2,sale:1};
 const e=s.enemies[0];e.x=s.heroX+.39;e.hp=e.maxHp=1000;e.damage=0;const x=s.heroX;
 const events=advance(s,1.35);assert.equal(s.heroX,x);assert.ok(events.some(e=>e.type==='heroHit'));assert.ok(e.x-s.heroX>.115);assert.ok(e.moving);
 advance(s,4);assert.equal(s.heroX,x);assert.ok(Math.abs(e.x-s.heroX-.115)<.001);assert.ok(e.engaged);assert.ok(s.heroAttackCount>=3);
});
test('all weapons have identical attack cadence at contact and ranged damage survives saving',()=>{
 const counts=[];
 for(const id of Object.keys(WEAPONS)){
  const s=freshGame(),ranged=['slingshot','short-bow'].includes(id);s.equipment.weapon={slot:'weapon',weaponId:id,name:id,quality:WEAPONS[id].quality,value:2,sale:1,epoch:WEAPONS[id].epoch,itemLevel:1};
  const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=1000;e.damage=0;
  const events=[],hits=[];for(let frame=0;frame<150;frame++){const batch=step(s,1/30);events.push(...batch);if(batch.some(e=>e.type==='heroHit'))hits.push((frame+1)/30);}counts.push(hits.length);assert.equal(events.find(e=>e.type==='heroHit').value,4);assert.ok(Math.abs(hits[0]-1.25)<=1/30);for(let i=1;i<hits.length;i++)assert.ok(Math.abs(hits[i]-hits[i-1]-2)<1e-9);
  const serial=freshGame();serial.equipment.weapon=s.equipment.weapon;const saved=restore(JSON.stringify(serial));assert.equal(saved.equipment.weapon.weaponId,id);assert.equal(saved.equipment.weapon.value,s.equipment.weapon.value);assert.equal(saved.kills,s.kills);
 }
 assert.equal(counts[0],2);assert.ok(counts.every(n=>n===counts[0]));
});
test('forge makes slingshots in epoch one and short bows from epoch two; discount is applied once',()=>{
 for(const [anvil,roll,id] of [[1,(Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===1).indexOf('slingshot')+.5)/Object.values(WEAPONS).filter(w=>w.epoch===1).length,'slingshot'],[2,0,'short-bow']]){
  const s=freshGame();s.hammers=1;s.anvilLevel=anvil;const rolls=[0,anvil===1?0:.999,0,roll];forge(s,()=>rolls.shift());const i=s.forgingItems[0];assert.equal(i.weaponId,id);assert.equal(i.value,Math.round(1.6*10**(i.epoch-1)));
  finishForge(s);equip(s);assert.equal(restore(JSON.stringify(s)).equipment.weapon.value,i.value);
 }
});


test('old fractional weapon rolls become integers without losing the save or current wave',()=>{
 const s=freshGame();s.coins=713;s.hammers=9;const item={slot:'weapon',weaponId:'slingshot',name:'Hunter Slingshot',quality:0,epoch:1,itemLevel:1,value:1.6,sale:1};
 s.equipment.weapon={...item};s.pending={...item};s.results=[{...item,value:2.4}];s.forgingItems=[{...item,value:3.2}];s.forging=1;s.enemies[0].hp=.4;
 const restored=restore(JSON.stringify(s));assert.equal(restored.coins,713);assert.equal(restored.hammers,9);assert.equal(restored.equipment.weapon.value,2);assert.equal(restored.pending.value,2);assert.equal(restored.results[0].value,2);assert.equal(restored.forgingItems[0].value,3);assert.equal(restored.enemies[0].hp,1);assert.equal(stats(restored).damage,4);
});


test('three Ancient melee weapons forge from epoch two, equip and survive reload',()=>{
 const ids=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===2),anvil=ANVILS.findIndex(a=>a.chances[1]>0)+1,chances=ANVILS[anvil-1].chances;
 for(const id of ['gladius','bronze-axe','battle-spear']){
  const s=freshGame();s.coins=713;s.hammers=1;s.anvilLevel=anvil;const rolls=[0,(chances[0]+chances[1]/2)/100,0,(ids.indexOf(id)+.1)/ids.length];forge(s,()=>rolls.shift());const item=s.forgingItems[0];
  assert.equal(item.weaponId,id);assert.equal(item.epoch,2);assert.equal(item.value,20);finishForge(s);assert.equal(equip(s),true);const loaded=restore(JSON.stringify(s));assert.equal(loaded.equipment.weapon.weaponId,id);assert.equal(loaded.equipment.weapon.name,WEAPONS[id].name);assert.equal(loaded.equipment.weapon.value,20);assert.equal(loaded.coins,713);
 }
});


test('epoch identity stays fixed across all forged slots in the two completed epochs',()=>{
 for(const epoch of [1,2])for(let slot=0;slot<12;slot++)for(const appearance of [0,.34,.67,.999]){
  const s=freshGame();s.hammers=1;s.anvilLevel=2;const rolls=[(slot+.1)/12,epoch===1?0:.999,0,appearance];forge(s,()=>rolls.shift());const i=s.forgingItems[0];assert.equal(i.epoch,epoch);
  if(i.slot==='weapon'){assert.equal(WEAPONS[i.weaponId].epoch,epoch);assert.equal(i.name,WEAPONS[i.weaponId].name);}else if(epoch===2){assert.match(i.name,/^(Bronze Warrior|Temple Guard|Legionary) /);assert.ok(i.quality<=2);}else assert.match(i.name,/^(Hunter|Bone) /);
 }
});
test('existing incorrectly labelled Ancient gear keeps stats and gets Ancient identity',()=>{
 const s=freshGame();s.coins=713;s.equipment.weapon={slot:'weapon',weaponId:'spear',name:'Bone Spear',quality:1,epoch:2,itemLevel:5,value:24,sale:1};s.equipment.chest={slot:'chest',name:'Hunter Leather Vest',quality:0,epoch:2,itemLevel:5,value:180,sale:1};s.pending={slot:'weapon',weaponId:'slingshot',name:'Hunter Slingshot',quality:0,epoch:2,itemLevel:5,value:19,sale:1};
 const old=stats(s),loaded=restore(JSON.stringify(s));assert.equal(loaded.coins,713);assert.deepEqual(stats(loaded),old);assert.equal(loaded.equipment.weapon.weaponId,'battle-spear');assert.equal(loaded.equipment.chest.name,'Bronze Warrior Chestplate');assert.equal(loaded.pending.weaponId,'short-bow');assert.equal(loaded.pending.value,19);assert.equal(loaded.pending.epoch,2);assert.deepEqual(restore(JSON.stringify(loaded)),loaded);
});


test('all ten completed epochs use their own weapons and displayed forge chances match the roll',()=>{
 for(let anvil=1;anvil<=80;anvil++){
  const chances=FORGE_CHANCES[anvil-1];assert.ok(Math.abs(chances.reduce((a,b)=>a+b,0)-100)<1e-8);chances.forEach((chance,i)=>assert.ok(Math.abs(chance-ANVILS[anvil-1].chances[i])<1e-8));
  let before=0;
  for(let epoch=1;epoch<=10;epoch++){const chance=chances[epoch-1];if(chance){const s=freshGame();s.anvilLevel=anvil;s.hammers=1;const rolls=[0,(before+chance/2)/100,0,.999];forge(s,()=>rolls.shift());const item=s.forgingItems[0];assert.equal(item.epoch,epoch);assert.equal(WEAPONS[item.weaponId].epoch,epoch);}before+=chance;}
 }
});


test('equip stronger selects best ready gear and two rings, keeps ties and leftovers, preserves health fraction',()=>{
 const s=freshGame();s.equipment.helmet=candidate('helmet',10);s.equipment.ring1=candidate('ring1',4);s.hp=15;
 const helmet=candidate('helmet',30), lesser=candidate('helmet',20), equal=candidate('helmet',10);
 const rings=[candidate('ring',6),candidate('ring',9),candidate('ring',7)];rings.forEach(item=>item.name='Hunter Ring');
 s.pending=lesser;s.results=[helmet,equal,...rings];
 const before=JSON.stringify(s);assert.equal(equipStronger(s,true),3);assert.equal(JSON.stringify(s),before);
 assert.equal(equipStronger(s),3);assert.equal(s.equipment.helmet.value,30);
 assert.deepEqual([s.equipment.ring1.value,s.equipment.ring2.value].sort((a,b)=>a-b),[7,9]);
 assert.equal(s.hp,25);assert.deepEqual([s.pending,...s.results],[lesser,equal,rings[0]]);
 assert.equal(equipStronger(s),0);
 assert.deepEqual(restore(JSON.stringify(s)).equipment,s.equipment);
});


test('overall item level averages all twelve slots with epoch offsets and rounds down',()=>{
 const s=freshGame();assert.equal(itemLevel(s),0);
 s.equipment.weapon={...candidate('weapon',2),epoch:1,itemLevel:100};assert.equal(itemLevel(s),8);
 s.equipment.weapon.epoch=2;s.equipment.weapon.itemLevel=1;assert.equal(itemLevel(s),8);
 for(const slot of SLOTS)s.equipment[slot]={...candidate(slot,10),epoch:2,itemLevel:50};
 assert.equal(itemLevel(s),150);
 s.equipment.ring2=null;assert.equal(itemLevel(s),137);
 s.equipment.ring2={...candidate('ring2',10),epoch:2,itemLevel:50};
 s.equipment.helmet.itemLevel=51;assert.equal(itemLevel(s),150);
 s.equipment.helmet.itemLevel=62;assert.equal(itemLevel(s),151);
 assert.equal(itemLevel(restore(JSON.stringify(s))),151);
});


test('all thirteen Medieval weapons forge, equip and retain identity and integer damage after reload',()=>{
 const ids=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===3);assert.equal(ids.length,13);
 const anvil=FORGE_CHANCES.findIndex(row=>row[2]>0)+1,c=FORGE_CHANCES[anvil-1];
 for(const [index,id] of ids.entries())for(const level of [1,100]){
  const s=freshGame();s.hammers=1;s.anvilLevel=anvil;s.mastery[2].level=level;
  const rolls=[0,(c[0]+c[1]+c[2]/2)/100,.999,(index+.5)/ids.length];assert.equal(forge(s,()=>rolls.shift()),true);
  const item=s.forgingItems[0];assert.equal(item.weaponId,id);assert.equal(item.epoch,3);assert.equal(item.itemLevel,level);
  assert.equal(item.value,Math.round(200*(1+.05*(level-1))*WEAPONS[id].multiplier));finishForge(s);equip(s);
  assert.deepEqual(restore(JSON.stringify(s)).equipment.weapon,s.equipment.weapon);
 }
 for(const id of ['longbow','crossbow']){
  const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:id,epoch:3,quality:0,value:160};
  s.enemies[0].x=s.heroX+.45;s.enemies[0].hp=10000;s.enemies[0].damage=0;const x=s.heroX;
  assert.ok(advance(s,1.35).some(e=>e.type==='heroHit'));assert.equal(s.heroX,x);assert.ok(s.enemies[0].x-x>.115);
 }
});


test('later epochs have ten melee and three ranged each; all forge, equip and reload',()=>{
 for(let epoch=4;epoch<=10;epoch++){
  const ids=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===epoch),anvil=FORGE_CHANCES.findIndex(c=>c[epoch-1]>0)+1,c=FORGE_CHANCES[anvil-1];
  assert.equal(ids.filter(id=>!WEAPONS[id].range).length,10);assert.equal(ids.filter(id=>WEAPONS[id].range).length,3);
  for(const [index,id] of ids.entries())for(const level of [1,100]){
   const s=freshGame();s.hammers=1;s.anvilLevel=anvil;s.mastery[epoch-1].level=level;
   const rolls=[0,(c.slice(0,epoch-1).reduce((a,b)=>a+b,0)+c[epoch-1]/2)/100,.999,(index+.5)/ids.length];
   assert.equal(forge(s,()=>rolls.shift()),true);const item=s.forgingItems[0];assert.equal(item.weaponId,id);assert.equal(item.epoch,epoch);assert.equal(item.itemLevel,level);
   assert.equal(item.value,Math.round(Math.round(2*10**(epoch-1)*(1+.05*(level-1)))*WEAPONS[id].multiplier));
   finishForge(s);assert.equal(equip(s),true);assert.deepEqual(restore(JSON.stringify(s)).equipment.weapon,s.equipment.weapon);
  }
  for(const id of ids.filter(id=>WEAPONS[id].range)){
   const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:id,epoch,quality:0,value:2};const enemy=s.enemies[0];enemy.x=s.heroX+.45;enemy.hp=enemy.maxHp=10000;enemy.damage=0;const x=s.heroX;
   assert.ok(advance(s,1.35).some(e=>e.type==='heroHit'));assert.equal(s.heroX,x);assert.ok(enemy.x-x>.115);
  }
 }
});

test('expansion adds two melee and one ranged per epoch; all nine forge and preserve their own level and epoch',()=>{
 const groups=[['jaw-club','obsidian-pick','blowpipe'],['khopesh','trident','chakram'],['chain-flail','warden-key','crystal-staff']];
 for(const [e,ids] of groups.entries()){
  const epoch=e+1,pool=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===epoch),anvil=FORGE_CHANCES.findIndex(c=>c[e]>0)+1,c=FORGE_CHANCES[anvil-1];
  assert.equal(ids.filter(id=>WEAPONS[id].range>0).length,1);
  for(const id of ids)for(const level of [1,100]){
   const s=freshGame();s.hammers=1;s.anvilLevel=anvil;s.mastery[e].level=level;
   const rolls=[0,(c.slice(0,e).reduce((a,b)=>a+b,0)+c[e]/2)/100,.999,(pool.indexOf(id)+.5)/pool.length];
   assert.equal(forge(s,()=>rolls.shift()),true);const item=s.forgingItems[0];
   assert.equal(item.weaponId,id);assert.equal(item.epoch,epoch);assert.equal(item.itemLevel,level);
   assert.equal(item.value,Math.round(Math.round(2*10**e*(1+.05*(level-1)))*WEAPONS[id].multiplier));
   finishForge(s);assert.equal(equip(s),true);assert.deepEqual(restore(JSON.stringify(s)).equipment.weapon,s.equipment.weapon);
  }
 }
});


test('death lets survivors march past without attacking; restart and boss completion retain progress and forge results',()=>{
 const s=wave(4,3);s.hp=1;s.coins=77;s.hammers=3;s.phase='fight';s.targetId=s.enemies[0].id;s.heroClock=0;
 for(const e of s.enemies){e.x=s.heroX+.115;e.engaged=true;e.clock=1.09;}
 assert.ok(step(s,1/30).some(e=>e.type==='death'));const old=s.enemies,x=old.map(e=>e.x),heroX=s.heroX;
 assert.equal(forge(s,()=>0),true);const events=advance(s,.7);
 assert.equal(s.heroX,heroX);assert.ok(old.every((e,i)=>e.x<x[i]&&e.moving&&!e.engaged));assert.ok(!events.some(e=>e.type==='enemyHit'));
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded,s);
 assert.ok(advance(s,1.2).some(e=>e.type==='restart'));assert.equal(s.level,4);assert.equal(s.encounter,0);assert.equal(s.hp,stats(s).hp);assert.notEqual(s.enemies,old);assert.equal(s.coins,77);assert.ok(s.pending);
 const boss=wave(1,9);boss.enemies[0].hp=1;boss.enemies[0].x=boss.heroX+.165;boss.enemies[0].damage=0;
 assert.ok(advance(boss,1.3).some(e=>e.type==='kill'));assert.equal(boss.phase,'victory');const start=boss.heroX;
 step(boss,.4);assert.ok(boss.heroX>start);assert.equal(boss.level,1);
 assert.ok(advance(boss,.5).some(e=>e.type==='level'&&e.level===2));assert.equal(boss.encounter,0);assert.equal(boss.highest,2);
});
