import test from 'node:test';import assert from 'node:assert/strict';
import {freshGame,restore,stats,step,alchemySkill,potionEffect,brewPotion,drinkPotion,reagentChances,idleLoot,idleReagents,collectIdleRewards,settleMine,rollReagent,enterDungeon,leaveDungeon} from './game.mjs';
function supply(){const s=freshGame(1000);s.coins=1e6;s.alchemy.reagents.fill(10);return s;}
test('alchemy brew spends one ingredient and coins, grants XP once, and preserves failed actions',()=>{
 const s=supply();assert.ok(brewPotion(s,'damage',4));assert.equal(s.coins,995000);assert.equal(s.alchemy.reagents[4],9);assert.equal(s.alchemy.potions[4],1);assert.equal(s.alchemy.xp,100);
 assert.equal(alchemySkill(s).level,6);s.coins=0;const before=structuredClone(s);assert.equal(brewPotion(s,'damage',4),false);assert.deepEqual(s,before);
});
test('skill determines potency and duration at use, with agreed maxima',()=>{
 const s=supply();brewPotion(s,'health',4);s.alchemy.xp=25245;
 assert.deepEqual(potionEffect(s,'health',4),{value:100,seconds:3600});assert.deepEqual(potionEffect(s,'coins',4),{value:150,seconds:10800});
 s.hp=10;assert.ok(drinkPotion(s,'health',4,1000));assert.equal(stats(s).hp,40);assert.equal(s.hp,20);
 const before=structuredClone(s);assert.equal(drinkPotion(s,'health',4,1000),false);assert.deepEqual(s,before);
});
test('battle potion pauses on reload, expires without healing or killing hero',()=>{
 const s=supply();s.alchemy.potions[5]=1;assert.ok(drinkPotion(s,'health',0,1000));s.hp=11;
 const loaded=restore(JSON.stringify(s),1000+86400000);assert.equal(loaded.alchemy.active.health.remaining,600);
 loaded.alchemy.active.health.remaining=.01;loaded.enemies.forEach(e=>{e.damage=0;e.x=2;});step(loaded,1/30,()=>.999,1000);assert.equal(stats(loaded).hp,20);assert.equal(loaded.hp,10);
});
test('passive potion only boosts its real-time overlap, including fractional minutes and full buffers',()=>{
 const s=supply();s.coins=0;s.alchemy.potions[15]=2;assert.ok(drinkPotion(s,'coins',0,31000));
 assert.equal(idleLoot(s,3601000).coins,64);const before=idleLoot(s,3601000);collectIdleRewards(s,3601000);assert.equal(s.coins,before.coins);
 const loaded=restore(JSON.stringify(s),3601000);assert.equal(loaded.idleStore.coins,s.idleStore.coins);assert.ok(drinkPotion(loaded,'coins',0,3601000));
 assert.equal(idleLoot(loaded,3601000+86400000).minutes,240);assert.equal(idleLoot(loaded,3601000+86400000).coins,245);
});
test('ore bonus credits only active minutes, is independent of settlement frequency and combines with dungeon bonus',()=>{
 const s=supply();s.alchemy.potions[10]=1;drinkPotion(s,'ore',0,1000);const b=structuredClone(s);
 settleMine(s,3601000,()=>.999);for(let m=1;m<=60;m++)settleMine(b,1000+m*60000,()=>.999);
 assert.equal(s.mine.pending.reduce((a,b)=>a+b),63);assert.deepEqual(s.mine.pending,b.mine.pending);
});
test('offline reagent previews are stable, collection cannot reroll, and buffer caps attempts',()=>{
 const s=supply();s.alchemy.reagents.fill(0);s.alchemy.seed=42;
 const once=idleReagents(s,86401000);assert.deepEqual(once,idleReagents(s,86401000));assert.deepEqual(once,idleReagents(s,14401000));
 const loaded=restore(JSON.stringify(s),86401000);assert.deepEqual(once,idleReagents(loaded,86401000));collectIdleRewards(loaded,86401000);assert.deepEqual(loaded.alchemy.reagents,once);assert.equal(collectIdleRewards(loaded,86401000),0);
 assert.equal(rollReagent(1,false,()=>0),4);assert.equal(rollReagent(1,false,()=>.999),-1);
});
test('normal mob reagent credited once and old saves acquire empty alchemy',()=>{
 const s=supply();s.alchemy.reagents.fill(0);s.enemies[0].hp=1;s.enemies[0].x=s.heroX+.115;
 step(s,1.3,()=>0,1000);assert.equal(s.alchemy.reagents[4],1);step(s,.01,()=>0,1000);assert.equal(s.alchemy.reagents[4],1);
 delete s.alchemy;const old=restore(JSON.stringify(s),1000);assert.deepEqual(old.alchemy.reagents,[0,0,0,0,0]);assert.equal(old.coins,s.coins);
});
test('dungeon consumes shared combat timer without duplicating it after return',()=>{
 const s=supply();s.highest=2;s.alchemy.potions[0]=1;drinkPotion(s,'damage',0,1000);assert.ok(enterDungeon(s,'treasury',1,1000));
 step(s,1/30,()=>.999,1000);assert.ok(s.alchemy.active.damage.remaining<600);const remaining=s.alchemy.active.damage.remaining;leaveDungeon(s);assert.equal(s.alchemy.active.damage.remaining,remaining);
});

test('renewing passive potions preserves the expired tail of a partial mining and idle minute',()=>{
 for(const type of ['coins','ore']){
  const s=supply();s.alchemy.potions[(type==='coins'?3:2)*5]=2;
  assert.ok(drinkPotion(s,type,0,31000));assert.ok(drinkPotion(s,type,0,1837000));
  const loaded=restore(JSON.stringify(s),1837000);
  if(type==='coins')assert.equal(idleLoot(loaded,3661000).coins,70);
  else{settleMine(loaded,3661000,()=>.999);assert.equal(loaded.mine.pending.reduce((a,b)=>a+b),67);}
 }
});

test('reagent drop is rare in all biomes, with fivefold boss odds',()=>{
 for(const level of [1,21,181]){
  const b=Math.floor((level-1)/20),normal=reagentChances(level),boss=reagentChances(level,true);
  const old=[4,1+.15*b,.2+.05*b,.02+.01*b,.002+.001*b];
  normal.forEach((p,i)=>{assert.ok(Math.abs(p-old[i]/500)<1e-12);assert.ok(Math.abs(boss[i]-p*5)<1e-12);});
 }
 assert.ok(Math.abs(reagentChances(1).reduce((a,b)=>a+b,0)-.010444)<1e-12);
});
