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

test('dungeons unlock after 1–1, progress sequentially and count two wins independently',()=>{
  const locked=freshGame(now);assert.equal(enterDungeon(locked,'treasury',1,now),false);
  const s=hero();for(const floor of [0,2,201,NaN])assert.equal(enterDungeon(s,'treasury',floor,now),false);
  win(s);win(s,'treasury',2);
  assert.equal(enterDungeon(s,'treasury',3,now),false);
  assert.deepEqual(s.dungeons.wins,[2,0,0]);assert.deepEqual(s.dungeons.cleared,[2,0,0]);
  win(s,'forge');win(s,'mine');assert.deepEqual(s.dungeons.wins,[2,1,1]);
  const saved=restore(JSON.stringify(s),now);assert.deepEqual(saved.dungeons,s.dungeons);
  dungeonDay(saved,now-day);assert.deepEqual(saved.dungeons.wins,[2,1,1]);
  dungeonDay(saved,now+day);assert.deepEqual(saved.dungeons.wins,[0,0,0]);assert.deepEqual(saved.dungeons.cleared,[2,1,1]);
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

test('ore rewards never bypass the current mine stratum unlock',()=>{
  const s=hero();s.mine.level=16;
  const ore=dungeonRewards(s,'mine',10);
  assert.equal(ore.coins,0);assert.equal(ore.hammers,0);
  assert.ok(ore.ore[3]>0&&ore.ore[4]>0);assert.ok(ore.ore.slice(5).every(n=>!n));
});

test('loss, timeout, leaving and reload never consume a win or move the campaign',()=>{
  for(const outcome of ['lost','timeout','left','interrupted']){
    let s=hero();s.level=s.highest=20;s.encounter=7;s.dungeons.cleared=[9,9,9];
    assert.ok(enterDungeon(s,'treasury',10,now));
    if(outcome==='lost'){s.dungeons.run.battle.hp=.1;finish(s);}
    if(outcome==='timeout'){s.dungeons.run.battle.equipment.weapon.value=0;s.dungeons.run.battle.equipment.gloves=null;s.dungeons.run.battle.equipment.necklace=null;s.dungeons.run.battle.equipment.ring1=null;s.dungeons.run.battle.equipment.ring2=null;s.dungeons.run.battle.equipment.chest.value=1e20;s.dungeons.run.battle.hp=1e20;finish(s);}
    if(outcome==='left')leaveDungeon(s);
    if(outcome==='interrupted')s=restore(JSON.stringify(s),now);
    assert.equal(s.dungeons.last.outcome,outcome);assert.deepEqual(s.dungeons.wins,[0,0,0]);
    assert.equal(s.level,20);assert.equal(s.encounter,7);assert.equal(s.coins,0);assert.equal(s.deaths,0);
  }
});

test('first mount requires all three tens, adds stats once and preserves injured health proportion',()=>{
  const s=hero();s.dungeons.cleared=[10,10,9];assert.equal(claimMount(s),false);
  s.dungeons.cleared[2]=10;const before=stats(s);s.hp=before.hp/2;
  assert.equal(claimMount(s),true);assert.equal(claimMount(s),false);
  assert.equal(stats(s).damage,Math.round(before.damage*1.2));assert.equal(s.hp,stats(s).hp/2);
  const saved=restore(JSON.stringify(s),now);assert.deepEqual(saved.mount,{owned:true,equipped:true});
  assert.ok(toggleMount(saved));assert.deepEqual(stats(saved),before);assert.equal(saved.hp,before.hp/2);
});

test('treasury shields reduce hits, forge telegraphs one smash, and crystal fury ramps',()=>{
  const s=hero();s.dungeons.cleared=[199,199,199];enterDungeon(s,'treasury',10,now);
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

test('all 200 floors grow; early gear clears entrance, upgraded green clears ten, late upgrades clear 200',()=>{
  for(const id of ['treasury','forge','mine']){
    let previous=0;
    for(let floor=1;floor<=200;floor++){const b=dungeonBoss(id,floor);assert.ok(b.maxHp>previous);previous=b.maxHp;}
    const early=hero(1);early.equipment.weapon.weaponId='slingshot';assert.ok(enterDungeon(early,id,1,now));assert.ok(finish(early)<90);assert.equal(early.dungeons.last.outcome,'won');
    for(const [epoch,itemLevel] of [[2,1],[3,1],[3,5]]){
      const s=hero(epoch,itemLevel);s.dungeons.cleared=[9,9,9];enterDungeon(s,id,10,now);finish(s);
      assert.equal(s.dungeons.last.outcome,itemLevel===5?'won':'lost');
    }
    const end=hero(10,100);end.dungeons.cleared=[199,199,199];claimMount(end);
    for(const slot of SLOTS)end.workshop.slots[slot]=100;
    enterDungeon(end,id,200,now);assert.ok(finish(end)<90);assert.equal(end.dungeons.last.outcome,'won');
  }
});

test('the first stage threatens a 9-damage, 65-HP hero and cannot be healed away by a level-one druid',()=>{
  for(const companion of [null,'druid'])for(const id of ['treasury','forge','mine']){
    const s=hero(1);s.equipment.weapon.weaponId='slingshot';s.equipment.chest.value+=4;s.selectedCompanion=companion;
    assert.deepEqual(stats(s),{damage:9,hp:65});enterDungeon(s,id,1,now);
    let lowest=65,hit=0;
    while(s.dungeons.run){
      const b=s.dungeons.run.battle;
      const events=step(s,1/30,()=>.999,now);lowest=Math.min(lowest,b.hp);
      for(const e of events)if(e.type==='enemyHit')hit=Math.max(hit,e.value);
    }
    assert.equal(s.dungeons.last.outcome,'won');assert.ok(hit>=3);
    assert.ok(lowest<(companion?33:12),`${id}: ${lowest} HP remains`);
  }
});
