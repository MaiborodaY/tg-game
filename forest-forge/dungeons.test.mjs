import test from 'node:test';
import assert from 'node:assert/strict';
import {freshGame,restore,stats,step,SLOTS,enterDungeon,leaveDungeon,sweepDungeon,dungeonDay,dungeonBoss,dungeonRewards,claimMount,toggleMount,settleMine} from './game.mjs';

const now=Date.UTC(2026,8,12,12),day=86400000;
function hero(epoch=3,itemLevel=1){
  const s=freshGame(now);s.highest=2;
  const bases=[2,5,5,15,2,5,5,3,3,1,1,1];
  for(const [i,slot] of SLOTS.entries())s.equipment[slot]={slot,name:'Test item',epoch,quality:0,itemLevel,value:Math.round(bases[i]*10**(epoch-1)*(1+.05*(itemLevel-1))),sale:1};
  s.hp=stats(s).hp;return s;
}
function finish(s){
  let seconds=0;
  while(s.dungeons.run&&seconds<91){step(s,1/30,()=>.999,now);seconds+=1/30;}
  return seconds;
}
function win(s,id='treasury',floor=1){
  assert.ok(enterDungeon(s,id,floor,now));s.dungeons.run.battle.equipment.weapon.value=1e20;
  finish(s);assert.equal(s.dungeons.last.outcome,'won');
}

test('dungeons share ten daily keys across victories and sweeps and refill without accumulating',()=>{
 const locked=freshGame(now);assert.equal(enterDungeon(locked,'treasury',1,now),false);
 const s=hero();for(const floor of [0,2,201,NaN])assert.equal(enterDungeon(s,'treasury',floor,now),false);
 win(s);win(s,'treasury',2);win(s,'forge');win(s,'mine');
 assert.deepEqual(s.dungeons.wins,[2,1,1,0]);assert.deepEqual(s.dungeons.cleared,[2,1,1,0]);
 const legacy=restore(JSON.stringify(s),now);assert.deepEqual(legacy.dungeons.wins,[2,1,1,0]);
 for(let i=0;i<6;i++)assert.equal(sweepDungeon(s,'treasury',now,()=>.999),true);
 assert.deepEqual(s.dungeons.wins,[8,1,1,0]);
 for(const id of ['treasury','forge','mine']){assert.equal(sweepDungeon(s,id,now),false);assert.equal(enterDungeon(s,id,1,now),false);}
 const saved=restore(JSON.stringify(s),now);assert.deepEqual(saved.dungeons,s.dungeons);
 dungeonDay(saved,now-day);assert.deepEqual(saved.dungeons.wins,[8,1,1,0]);
 dungeonDay(saved,now+day*3);assert.deepEqual(saved.dungeons.wins,[0,0,0,0]);assert.deepEqual(saved.dungeons.cleared,[2,1,1,0]);
});

test('a victory pays once and leaves the campaign fight and paid forge intact',()=>{
  const s=hero();s.forging=1;s.forgingItems=[{slot:'weapon',value:2}];s.autoForge=true;
  const before=structuredClone(s),loot=dungeonRewards(s,'treasury',1);win(s);
  for(const key of ['level','highest','encounter','heroX','hp','enemies','heroClock','kills','deaths','battleStats','forging','forgingItems','autoForge'])assert.deepEqual(s[key],before[key],key);
  assert.equal(s.coins-before.coins,loot.coins);assert.equal(s.hammers-before.hammers,loot.hammers);
  assert.deepEqual(s.mine.ore,loot.ore);
  const repeat=dungeonRewards(s,'treasury',1);
  assert.deepEqual(loot,repeat);
  const paid=s.coins;assert.equal(leaveDungeon(s),false);assert.equal(s.coins,paid);
});

test('each dungeon pays its own resource equally for a new stage and a repeat clear',()=>{
  for(const [index,id] of ['treasury','forge','mine'].entries()){
    const s=hero(),before={coins:s.coins,hammers:s.hammers,ore:s.mine.ore.reduce((a,b)=>a+b)},loot=dungeonRewards(s,id,1);
    win(s,id);const after=[s.coins-before.coins,s.hammers-before.hammers,s.mine.ore.reduce((a,b)=>a+b)-before.ore];
    after.forEach((n,i)=>assert.equal(n>0,i===index));
    const repeat=dungeonRewards(s,id,1);
    assert.deepEqual(loot,repeat);
    const paid=[s.coins,s.hammers,s.mine.ore.reduce((a,b)=>a+b)];
    win(s,id);assert.deepEqual([s.coins-paid[0],s.hammers-paid[1],s.mine.ore.reduce((a,b)=>a+b)-paid[2]],after);
  }
});

test('dungeon ore mixes evolve through stages and pay the same amounts at every mine level',()=>{
  const s=hero();
  for(const level of [1,6,96]){
    s.mine.level=level;
    for(const [floor,expected] of [
      [1,[[0,54],[1,6]]],
      [10,[[1,131]]],
      [11,[[1,116],[2,12]]],
      [15,[[1,59],[2,59]]],
      [16,[[1,47],[2,69]]],
      [20,[[2,112]]],
      [21,[[2,99],[3,10]]],
      [30,[[3,95]]],
      [200,[[19,271]]],
    ]){
      const loot=dungeonRewards(s,'mine',floor);
      assert.equal(loot.coins,0);assert.equal(loot.hammers,0);
      assert.deepEqual(loot.ore.flatMap((n,i)=>n?[[i,n]]:[]),expected);
    }
  }
});

test('high-tier ore from a battle and Sweep survives reload with a level-one mine',()=>{
  const manual=hero(10,100);manual.dungeons.cleared[2]=191;
  manual.mine.ore=[7,8,9];manual.mine.pending=[1,2,3];manual.mine.bufferMinutes=3;
  const swept=structuredClone(manual);
  win(manual,'mine',191);
  assert.equal(sweepDungeon(swept,'mine',now,()=>.999),true);
  for(const s of [manual,swept]){
    assert.deepEqual(s.mine.ore.slice(0,3),[7,8,9]);assert.ok(s.mine.ore[19]>0);
    const saved=restore(JSON.stringify(s),now);
    assert.deepEqual(saved.mine,s.mine);assert.equal(saved.mine.level,1);
  }
  assert.deepEqual(swept.mine,manual.mine);
});

test('loss, timeout, leaving and reload never consume a win or move the campaign',()=>{
  for(const outcome of ['lost','timeout','left','interrupted']){
    let s=hero();s.level=s.highest=20;s.encounter=7;s.dungeons.cleared=[9,9,9];
    assert.ok(enterDungeon(s,'treasury',10,now));
    if(outcome==='lost'){s.dungeons.run.battle.hp=.1;finish(s);}
    if(outcome==='timeout'){s.dungeons.run.battle.equipment.weapon.value=0;s.dungeons.run.battle.equipment.gloves=null;s.dungeons.run.battle.equipment.necklace=null;s.dungeons.run.battle.equipment.ring1=null;s.dungeons.run.battle.equipment.ring2=null;s.dungeons.run.battle.equipment.chest.value=1e20;s.dungeons.run.battle.hp=1e20;finish(s);}
    if(outcome==='left')leaveDungeon(s);
    if(outcome==='interrupted')s=restore(JSON.stringify(s),now);
    assert.equal(s.dungeons.last.outcome,outcome);assert.deepEqual(s.dungeons.wins,[0,0,0,0]);
    assert.equal(s.level,20);assert.equal(s.encounter,7);assert.equal(s.coins,0);assert.equal(s.deaths,0);
  }
});

test('first mount requires all four tens, adds stats once and preserves injured health proportion',()=>{
  const s=hero();s.dungeons.cleared=[10,10,10,9];assert.equal(claimMount(s),false);
  s.dungeons.cleared[3]=10;const before=stats(s);s.hp=before.hp/2;
  assert.equal(claimMount(s),true);assert.equal(claimMount(s),false);
  assert.equal(stats(s).damage,Math.round(before.damage*1.2));assert.equal(s.hp,stats(s).hp/2);
  const saved=restore(JSON.stringify(s),now);assert.deepEqual(saved.mount,{owned:true,equipped:true});
  assert.ok(toggleMount(saved));assert.deepEqual(stats(saved),before);assert.equal(saved.hp,before.hp/2);
});

test('treasury shields reduce hits, forge telegraphs one smash, and crystal fury ramps',()=>{
  const s=hero();s.dungeons.cleared=[199,199,199,199];enterDungeon(s,'treasury',10,now);
  const b=s.dungeons.run.battle,e=b.enemies[0];e.x=b.heroX+.115;e.engaged=true;b.phase='fight';b.targetId=0;b.heroClock=1.99;
  b.dungeonBattle.time=9;const shieldHit=step(b,.02,()=>.999,now).find(e=>e.type==='heroHit');
  assert.ok(e.shield);assert.equal(shieldHit.value,Math.round(stats(b).damage*.35));
  leaveDungeon(s);enterDungeon(s,'forge',10,now);const f=s.dungeons.run.battle,fe=f.enemies[0];
  fe.x=f.heroX+.115;fe.engaged=true;f.dungeonBattle.time=8;step(f,.02,()=>.999,now);assert.ok(fe.charging);
  f.dungeonBattle.time=9.99;const smash=step(f,.02,()=>.999,now).find(e=>e.type==='enemyHit');
  assert.equal(smash.value,fe.baseDamage*2.6);assert.equal(fe.smash,false);
  leaveDungeon(s);enterDungeon(s,'mine',151,now);const m=s.dungeons.run.battle;
  m.dungeonBattle.time=28;step(m,.02,()=>.999,now);assert.equal(m.enemies[0].strength,1.5);
});

test('mine milestone bonus accumulates whole ore without losing small percentages on each minute',()=>{
  let s=hero();s.dungeons.cleared[2]=5;
  settleMine(s,now+50*60000,()=>0);assert.equal(s.mine.pending[0],50);
  s=restore(JSON.stringify(s),now+50*60000);
  settleMine(s,now+100*60000,()=>0);assert.equal(s.mine.pending[0],101);
});

test('sweep pays the last cleared stage like a fight, spends a win and leaves progress and forging intact',()=>{
  for(const [index,id] of ['treasury','forge','mine'].entries()){
    const manual=hero();manual.dungeons.cleared[index]=9;manual.mine.level=6;
    manual.forging=1;manual.forgingItems=[structuredClone(manual.equipment.weapon)];manual.autoForge=true;
    const swept=structuredClone(manual),before=structuredClone(swept);
    win(manual,id,9);
    assert.equal(sweepDungeon(swept,id,now,()=>.999),true);
    for(const key of ['coins','hammers','mine','alchemy','dungeons'])assert.deepEqual(swept[key],manual[key],key);
    for(const key of ['level','highest','encounter','heroX','hp','enemies','heroClock','kills','deaths','battleStats','forging','forgingItems','autoForge'])assert.deepEqual(swept[key],before[key],key);
    assert.deepEqual(restore(JSON.stringify(swept),now).dungeons,swept.dungeons);
    assert.equal(sweepDungeon(swept,id,now,()=>.999),true);
    for(let i=0;i<8;i++)assert.equal(sweepDungeon(swept,id,now,()=>.999),true);
    const paid=structuredClone(swept);
    assert.equal(sweepDungeon(swept,id,now,()=>.999),false);assert.deepEqual(swept,paid);
    assert.equal(sweepDungeon(swept,id,now+day,()=>.999),true);
    assert.equal(swept.dungeons.wins[index],1);assert.deepEqual(swept.dungeons.cleared,before.dungeons.cleared);
  }
});

test('sweep requires a cleared stage and no active battle, and keeps the ordinary boss reagent roll',()=>{
  const s=hero();
  for(const id of ['treasury','forge','mine','unknown']){const before=structuredClone(s);assert.equal(sweepDungeon(s,id,now),false);assert.deepEqual(s,before);}
  s.dungeons.cleared[0]=1;s.highest=1;
  assert.equal(sweepDungeon(s,'treasury',now),false);
  s.highest=2;assert.ok(enterDungeon(s,'forge',1,now));
  const battle=structuredClone(s);assert.equal(sweepDungeon(s,'treasury',now),false);assert.deepEqual(s,battle);
  leaveDungeon(s);assert.equal(sweepDungeon(s,'treasury',now,()=>0),true);
  assert.equal(s.alchemy.reagents[4],1);assert.equal(s.dungeons.run,null);assert.equal(s.dungeons.cleared[0],1);
});

test('five-floor enemy loot milestones apply to the actual kill and event amounts',()=>{
  for(const cleared of [0,5]){
    const s=hero(),e=s.enemies[0];s.dungeons.cleared=[cleared,cleared,0];
    e.x=s.heroX+.1;e.hp=1;e.reward=100;s.phase='fight';s.targetId=e.id;s.heroClock=2;
    const coins=s.coins,hammers=s.hammers,event=step(s,.01,()=>.201,now).find(e=>e.type==='kill');
    assert.equal(s.coins-coins,cleared?101:100);assert.equal(event.value,cleared?101:100);
    assert.equal(s.hammers-hammers,cleared?1:0);assert.equal(event.hammers,cleared?1:0);
  }
});

test('all 200 floors grow from 300 HP / 20 damage; stronger gear and affixes are needed to progress',()=>{
  for(const id of ['treasury','forge','mine']){
    let previous=0;
    for(let floor=1;floor<=200;floor++){const b=dungeonBoss(id,floor);assert.ok(b.maxHp>previous);previous=b.maxHp;if(floor===1)assert.equal(b.damage,20);if(floor===13)assert.equal(b.damage,550);}
    const early=hero(1);early.equipment.weapon.weaponId='slingshot';assert.ok(enterDungeon(early,id,1,now));assert.ok(finish(early)<90);assert.equal(early.dungeons.last.outcome,'lost');
    for(const [epoch,itemLevel] of [[2,1],[3,5],[4,1]]){
      const s=hero(epoch,itemLevel);s.dungeons.cleared=[9,9,9];enterDungeon(s,id,10,now);finish(s);
      assert.equal(s.dungeons.last.outcome,epoch===4?'won':'lost');
    }
    const end=hero(10,100);end.dungeons.cleared=[199,199,199,199];claimMount(end);
    for(const [i,slot] of SLOTS.entries()){end.workshop.slots[slot]=100;end.equipment[slot].affix=i%2?{type:'speed',value:10}:{type:'meleeDamage',value:40};}end.equipment.weapon.weaponId='club';
    enterDungeon(end,id,200,now);assert.ok(finish(end)<90);assert.equal(end.dungeons.last.outcome,'lost');
  }
});

test('the first stage defeats a 9-damage, 65-HP hero even with a trained level-one druid',()=>{
  for(const companion of [null,'druid'])for(const id of ['treasury','forge','mine']){
    const s=hero(1);s.equipment.weapon.weaponId='slingshot';s.equipment.chest.value+=4;s.selectedCompanion=companion;if(companion)s.druidTalents={touch:1};
    assert.deepEqual(stats(s),{damage:9,hp:65});enterDungeon(s,id,1,now);
    let lowest=65,hit=0;
    while(s.dungeons.run){
      const b=s.dungeons.run.battle;
      const events=step(s,1/30,()=>.999,now);lowest=Math.min(lowest,b.hp);
      for(const e of events)if(e.type==='enemyHit')hit=Math.max(hit,e.value);
    }
    assert.equal(s.dungeons.last.outcome,'lost');assert.ok(hit>=4);
    assert.ok(lowest<(companion?33:12),`${id}: ${lowest} HP remains`);
  }
});

test('a 19-damage, 157-HP melee hero cannot survive the stronger entrance bosses',()=>{
 for(const id of ['treasury','forge','mine'])for(const floor of [1,2]){
  const s=freshGame(now);s.highest=2;s.equipment.weapon={slot:'weapon',value:17};s.equipment.chest={slot:'chest',value:137};s.dungeons.cleared=[floor-1,floor-1,floor-1];s.hp=stats(s).hp;
  enterDungeon(s,id,floor,now);const seconds=finish(s);
  assert.equal(s.dungeons.last.outcome,'lost');assert.ok(seconds<30);
 }
});

 test('ore rewards improve every floor and stay within the allowed 150 percent gold value',async()=>{
  const {mineResource}=await import('./game.mjs');const s=freshGame(now);let previous=0;
  for(let floor=1;floor<=200;floor++){
   const ore=dungeonRewards(s,'mine',floor).ore,total=ore.reduce((a,b)=>a+b,0),sale=ore.reduce((a,b,i)=>a+b*mineResource(i).price,0);
   assert.ok(ore.every(n=>Number.isSafeInteger(n)&&n>=0));assert.ok(sale>previous,`floor ${floor} must improve`);previous=sale;
   assert.ok(sale<=dungeonRewards(s,'treasury',floor).coins*1.5,`floor ${floor}`);assert.ok(sale>=dungeonRewards(s,'treasury',floor).coins,`floor ${floor}`);
  }
  assert.equal(dungeonRewards(s,'mine',1).ore.reduce((a,b)=>a+b,0),60);
  assert.equal(dungeonRewards(s,'mine',200).ore.reduce((a,b)=>a+b,0),271);
 });

test('unlimited local runs advance progress without consuming shared keys',()=>{
 const s=hero();s.dungeons.wins=[10,0,0];assert.ok(enterDungeon(s,'mine',1,now,true));s.dungeons.run.battle.equipment.weapon.value=1e20;finish(s);assert.equal(s.dungeons.last.outcome,'won');assert.equal(s.dungeons.cleared[2],1);assert.deepEqual(s.dungeons.wins,[10,0,0]);
 assert.ok(sweepDungeon(s,'mine',now,()=>.999,true));assert.deepEqual(s.dungeons.wins,[10,0,0]);
});

test('greenhouse rewards improve on all 200 floors and bonus rolls never replace guaranteed reagents',()=>{
 const s=hero();let previous=0,guaranteed=[0,0,0,0,0];
 for(let floor=1;floor<=200;floor++){
  const preview=dungeonRewards(s,'greenhouse',floor),miss=dungeonRewards(s,'greenhouse',floor,()=>.999999),hit=dungeonRewards(s,'greenhouse',floor,()=>0);
  assert.deepEqual(miss.reagents,preview.reagents);assert.equal(miss.bonus,undefined);assert.equal(hit.bonus,undefined);
  const weights=[1,3,10,30,100],value=preview.reagents.reduce((a,n,i)=>a+n*weights[i],0)+(preview.bonus?preview.bonus.chance*weights[preview.bonus.rarity]:0);
  assert.ok(value>previous);previous=value;preview.reagents.forEach((n,i)=>assert.ok(n>=guaranteed[i]));guaranteed=preview.reagents;
  assert.equal(hit.reagents.reduce((a,n)=>a+n,0)-miss.reagents.reduce((a,n)=>a+n,0),preview.bonus?1:0);
 }
 assert.deepEqual(dungeonRewards(s,'greenhouse',1).bonus,{rarity:1,chance:.1});
 assert.deepEqual(dungeonRewards(s,'greenhouse',10).reagents,[2,1,0,0,0]);
 assert.deepEqual(dungeonRewards(s,'greenhouse',200).reagents,[2,1,1,1,1]);
});
test('greenhouse victory and Sweep pay actual reagents once and share keys with other dungeons',()=>{
 for(const roll of [0,.999]){
  const s=hero();s.dungeons.cleared[3]=10;const before=[...s.alchemy.reagents];assert.ok(enterDungeon(s,'greenhouse',11,now));s.dungeons.run.battle.equipment.weapon.value=1e20;
  while(s.dungeons.run)step(s,1/30,()=>roll,now);
  assert.equal(s.dungeons.last.outcome,'won');const reward=s.dungeons.last.rewards;assert.equal(reward.bonus,undefined);
  assert.deepEqual(s.alchemy.reagents,before.map((n,i)=>n+reward.reagents[i]));assert.equal(s.dungeons.wins[3],1);
  assert.ok(sweepDungeon(s,'greenhouse',now,()=>roll));assert.deepEqual(s.alchemy.reagents,before.map((n,i)=>n+2*reward.reagents[i]));assert.equal(s.dungeons.wins[3],2);
  s.dungeons.wins=[8,0,0,2];assert.equal(sweepDungeon(s,'greenhouse',now),false);assert.equal(enterDungeon(s,'treasury',1,now),false);
  assert.deepEqual(restore(JSON.stringify(s),now).alchemy.reagents,s.alchemy.reagents);
 }
});
test('legacy dungeon progress and earned mount survive adding greenhouse, but new mounts need all four',()=>{
 const s=hero();s.dungeons.cleared=[10,11,12];s.dungeons.wins=[2,1,0];s.mount={owned:true,equipped:true};
 const saved=restore(JSON.stringify(s),now);assert.deepEqual(saved.dungeons.cleared,[10,11,12,0]);assert.deepEqual(saved.dungeons.wins,[2,1,0,0]);assert.deepEqual(saved.mount,s.mount);
 saved.mount={owned:false,equipped:false};assert.equal(claimMount(saved),false);saved.dungeons.cleared[3]=10;assert.equal(claimMount(saved),true);
});
test('Sporemane warns before a 1.5x burst and halves hero healing for four seconds',()=>{
 const s=hero();assert.ok(enterDungeon(s,'greenhouse',1,now));const b=s.dungeons.run.battle,e=b.enemies[0];
 b.phase='fight';b.heroClock=0;b.targetId=0;b.companionAuto=false;e.x=b.heroX+.115;e.engaged=true;e.hp=e.maxHp=1e9;
 b.dungeonBattle.time=12;step(b,.01,()=>.999,now);assert.equal(e.charging,true);
 b.dungeonBattle.time=13.99;const burst=step(b,.02,()=>.999,now);assert.ok(burst.some(x=>x.type==='sporeBurst'));assert.equal(burst.find(x=>x.type==='enemyHit').value,e.baseDamage*1.5);assert.equal(b.dungeonBattle.spores,4);
 const affected=structuredClone(b),normal=structuredClone(b);for(const state of [affected,normal]){state.phase='victory';state.phaseTime=100;state.hp=1;state.equipment.chest.affix={type:'regen',value:1};}normal.dungeonBattle.spores=0;
 step(affected,.1,()=>.999,now);step(normal,.1,()=>.999,now);assert.ok(Math.abs((affected.hp-1)*2-(normal.hp-1))<1e-8);
 step(affected,4,()=>.999,now);assert.equal(affected.dungeonBattle.spores,0);
});

test('greenhouse loss and interrupted runs give no reagents and consume no keys',()=>{
 for(const outcome of ['lost','left','reload']){
  let s=hero();const reagents=[...s.alchemy.reagents];enterDungeon(s,'greenhouse',1,now);
  if(outcome==='lost'){s.dungeons.run.battle.hp=.1;s.dungeons.run.battle.equipment.weapon.value=0;finish(s);}
  else if(outcome==='left')leaveDungeon(s);else s=restore(JSON.stringify(s),now);
  assert.equal(s.dungeons.run,null);assert.deepEqual(s.alchemy.reagents,reagents);assert.deepEqual(s.dungeons.wins,[0,0,0,0]);assert.equal(s.dungeons.cleared[3],0);
 }
});
