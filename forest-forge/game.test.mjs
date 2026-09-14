import { castCompanionSkill } from './game.mjs';
import { expandInventory } from './game.mjs';
import { refreshShop, buyShopItem, SHOP_REFRESH_INTERVAL } from './game.mjs';
import { TURTLE_LEVELS, ARCHER_LEVELS, DRUID_LEVELS, hireCompanion, selectCompanion } from './game.mjs';
import { DRUID_TALENTS, learnDruidTalent, resetDruidTalents, enterDungeon, prepareEncounter } from './game.mjs';
import { ARCHER_TALENTS, learnArcherTalent, resetArcherTalents, leaveDungeon } from './game.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { AFFIXES, rollAffix, reforge, reforgeCost, resolveReforge, attackInterval } from './game.mjs';
import { anvilSkipCost, skipAnvilUpgrade, BIOMES, LEVELS_PER_BIOME, MAX_LEVEL } from './game.mjs';
import { idleRewards, collectIdleRewards } from './game.mjs';
import { drinkPotion } from './game.mjs';
import { freshGame, stats, heroPower, forge, forgeCost, equip, equipStronger, sell, sellWeaker, step, restore, replay, enemyFor, WAVES, SLOTS, batchSize, browseResults, upgradeAnvil, finishUpgrade, ANVILS, FORGE_CHANCES, WEAPONS } from './game.mjs';
function advance(s, seconds) { const events=[]; for(let i=0;i<seconds*30;i++)events.push(...step(s,1/30,()=>.999)); return events; }

test('ability upgrades are optional leaves; core abilities unlock without buying their upgrades',()=>{
 for(const kind of ['archer','druid']){
  const s=freshGame();s.coins=500;hireCompanion(s,kind);s[kind+'Level']=40;
  const learn=kind==='archer'?learnArcherTalent:learnDruidTalent,defs=kind==='archer'?ARCHER_TALENTS:DRUID_TALENTS;
  const root=kind==='archer'?'shot':'touch',ultimate=kind==='archer'?'barrage':'bloom';
  const upgrades=kind==='archer'?['downpour','heavy','composure','quiver']:['spring','sap','thickBark','awakening','evergreen'];
  assert.ok(upgrades.every(id=>!defs.some(t=>t.requires.includes(id))));
  assert.equal(learn(s,root),true);assert.equal(learn(s,ultimate),false);
  assert.equal(learn(s,upgrades[0]),false);
  for(const id of kind==='archer'?['sharp','eye']:['herbs','roots'])for(let i=0;i<10;i++)assert.equal(learn(s,id),true);
  for(let i=0;i<4;i++)assert.equal(learn(s,kind==='archer'?'precision':'lastLeaf'),true);
  for(const id of kind==='archer'?['rain','pierce']:['regrowth','bark'])assert.equal(learn(s,id),true);
  assert.ok(upgrades.every(id=>!s[kind+'Talents'][id]));
  assert.equal(learn(s,ultimate),true);
  assert.equal(learn(s,kind==='archer'?'hunt':'secondWind'),true);
  for(const id of upgrades)assert.equal(learn(s,id),true);
  assert.deepEqual(restore(JSON.stringify(s))[kind+'Talents'],s[kind+'Talents']);
 }
});
test('new branch rules preserve ranks earned before an upgrade gained its skill prerequisite',()=>{
 const s=freshGame();s.coins=1000;hireCompanion(s,'archer');hireCompanion(s,'druid');s.archerLevel=s.druidLevel=40;
 s.archerTalents={shot:1,sharp:10,double:5,rain:1,heavy:2,quiver:3};
 s.druidTalents={touch:1,roots:10,reserve:5,bark:1,awakening:2,evergreen:3};
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.archerTalents,s.archerTalents);assert.deepEqual(loaded.druidTalents,s.druidTalents);
 assert.equal(learnArcherTalent(loaded,'quiver'),false);assert.equal(learnDruidTalent(loaded,'evergreen'),false);
});

test('archer root costs the first point; builds obey prerequisites, survive saves and reset independently',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.heroClock=-100;s.phase='fight';s.targetId=0;
 Object.assign(s.enemies[0],{x:s.heroX+.115,hp:10000,maxHp:10000,damage:0});
 assert.equal(advance(s,3).filter(e=>e.type==='companionHit').length,0);
 assert.equal(learnArcherTalent(s,'sharp'),false);assert.equal(learnArcherTalent(s,'shot'),true);assert.equal(learnArcherTalent(s,'sharp'),false);
 assert.equal(advance(s,1.3).filter(e=>e.type==='companionHit').length,1);
 s.archerLevel=100;for(let pass=0;pass<20;pass++)for(const t of ARCHER_TALENTS)learnArcherTalent(s,t.id);
 assert.equal(Object.values(s.archerTalents).reduce((a,b)=>a+b,0),100);
 prepareEncounter(s);
 assert.deepEqual(restore(JSON.stringify(s)).archerTalents,s.archerTalents);
 s.druidTalents={touch:1};s.archerCombat.rainCooldown=12;s.archerCombat.rain=3;
 assert.equal(resetArcherTalents(s),true);assert.deepEqual(s.druidTalents,{touch:1});assert.equal(s.archerCombat.rain,0);assert.equal(s.archerCombat.rainCooldown,12);
 delete s.archerTalents;delete s.archerCombat;const old=restore(JSON.stringify(s));assert.equal(old.archerLevel,100);assert.deepEqual(old.archerTalents,{});
});
test('archer passives increase own damage and crits; Weak Spot increases only hero damage and expires',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerLevel=20;s.archerTalents={shot:1,sharp:10,eye:10,precision:10,execute:10,mark:10};
 const e=s.enemies[0];Object.assign(e,{x:s.heroX+.115,hp:1e6,maxHp:1e7,damage:0});s.phase='fight';s.targetId=0;s.heroClock=-100;
 s.companion.shot={targetId:0,remaining:.01,fromX:s.companion.x,toX:e.x};
 const hit=step(s,.02,()=>0).find(e=>e.type==='companionHit');assert.equal(hit.value,Math.round(ARCHER_LEVELS[19].damage*1.05*1.1*1.8));assert.equal(hit.critical,true);assert.equal(e.archerMark,2);
 s.equipment.weapon=candidate('weapon',100);s.heroClock=10;s.companion.clock=-100;
 assert.equal(step(s,.02,()=>.999).find(e=>e.type==='heroHit').value,Math.round(stats(s).damage*1.03));
 s.companion.shot=null;s.heroClock=-100;s.enemies[0].x=s.heroX+10;advance(s,2.1);assert.equal(e.archerMark,0);
});
test('Double Shot follows a kill to the next enemy and never recursively procs',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerTalents={shot:1,double:10};
 const e=s.enemies[0];Object.assign(e,{x:s.heroX+.115,hp:1,damage:0});s.enemies.push({...e,id:1,x:e.x+.01,hp:100,maxHp:100});s.phase='fight';s.targetId=0;s.heroClock=-100;
 s.companion.shot={targetId:0,remaining:.01,fromX:s.companion.x,toX:e.x};
 const events=[];for(let i=0;i<18;i++)events.push(...step(s,1/30,()=>0));
 const hits=events.filter(e=>e.type==='companionHit');assert.deepEqual(hits.map(e=>e.targetId),[0,1]);assert.equal(s.kills,1);assert.equal(s.archerCombat.doubleDelay,0);
});
test('Rain hits all living enemies per pulse, pays all kills once and grants kill cooldown reduction',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerTalents={shot:1,rain:1,downpour:10,hunt:1};s.phase='fight';s.targetId=0;s.heroClock=-100;
 const e=s.enemies[0];s.enemies=Array.from({length:4},(_,id)=>({...e,id,x:s.heroX+.115+id*.04,hp:1,maxHp:1,damage:0}));
 s.archerCombat.rain=3;s.archerCombat.rainClock=.99;s.archerCombat.rainCooldown=15;s.archerCombat.pierceCooldown=20;
 const events=step(s,.02,()=>.999);assert.deepEqual(events.filter(e=>e.type==='kill').map(e=>e.targetId),[0,1,2,3]);
 assert.equal(s.kills,4);assert.equal(s.coins,e.reward*4);assert.equal(s.companionXp.archer,e.reward*4);assert.ok(Math.abs(s.archerCombat.rainCooldown-10.98)<1e-8);
 s.archerTalents.shot=0;step(s,.02,()=>.999);assert.equal(s.kills,4);
});
test('Piercing Arrow travels through the whole line including healer and scales on actual pierced enemies',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerLevel=10;s.archerTalents={shot:1,pierce:1,heavy:10};s.phase='fight';s.targetId=0;s.heroClock=-100;
 const e=s.enemies[0];s.enemies=Array.from({length:4},(_,id)=>({...e,id,kind:id===3?'healer':'warrior',x:s.heroX+.115+id*.1,hp:1e6,maxHp:1e6,damage:0}));
 s.enemies[1].hp=0;
 const hits=advance(s,.8).filter(e=>e.type==='companionHit');assert.deepEqual(hits.map(e=>e.targetId),[0,2,3]);
 assert.deepEqual(hits.map(e=>e.value),[1.2,1.45,1.7].map(n=>Math.round(ARCHER_LEVELS[9].damage*n)));
 assert.equal(s.archerCombat.piercing,null);
});
test('Barrage replaces normal shots, duration and cooldown talents work, and cooldowns persist through dungeon entry',()=>{
 for(const quiver of [0,10]){
  const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerLevel=10;s.archerTalents={shot:1,barrage:1,quiver,composure:10,double:10};s.phase='fight';s.targetId=0;s.heroClock=-100;
  Object.assign(s.enemies[0],{x:s.heroX+.115,hp:1e7,maxHp:1e7,damage:0});
  const events=advance(s,5+quiver*.1+.2);const hits=events.filter(e=>e.type==='companionHit');
  assert.equal(hits.length,quiver?24:20);assert.ok(hits.every(e=>e.value===Math.round(ARCHER_LEVELS[9].damage*.75*(1+quiver*.025))));assert.equal(s.archerCombat.barrage,0);
  s.highest=2;const cooldown=s.archerCombat.barrageCooldown;assert.equal(enterDungeon(s,'treasury',1),true);assert.equal(s.dungeons.run.battle.archerCombat.barrageCooldown,cooldown);
  assert.equal(learnArcherTalent(s,'sharp'),false);assert.equal(resetArcherTalents(s),false);
  s.archerCombat.piercing={x:.3,fromX:.1,toX:1,hitIds:[]};s.archerCombat.rain=2;
  assert.equal(leaveDungeon(s),true);assert.equal(s.archerCombat.piercing,null);assert.equal(s.archerCombat.rain,0);assert.equal(s.archerCombat.barrageCooldown,cooldown);
 }
});

test('druid starts with one unspent point; root unlocks healing, and ranks obey level and prerequisites',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.hp=1;s.phase='victory';s.phaseTime=100;
 advance(s,3);assert.equal(s.hp,1);assert.equal(learnDruidTalent(s,'swiftness'),false);
 assert.equal(learnDruidTalent(s,'touch'),true);assert.equal(learnDruidTalent(s,'touch'),false);
 advance(s,3);assert.equal(s.hp,4.5);assert.equal(learnDruidTalent(s,'herbs'),false);
 s.druidLevel=100;for(let pass=0;pass<20;pass++)for(const t of DRUID_TALENTS)learnDruidTalent(s,t.id);
 assert.equal(Object.values(s.druidTalents).reduce((a,b)=>a+b,0),100);
 assert.ok(DRUID_TALENTS.every(t=>(s.druidTalents[t.id]||0)<=t.max));
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.druidTalents,s.druidTalents);
});
test('druid speed reaches 2s and the reduced healing passives add before Second Wind',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidTalents={touch:1,swiftness:10,herbs:10,lastLeaf:10};s.hp=1;s.phase='victory';s.phaseTime=100;
 advance(s,1.9);assert.equal(s.hp,1);advance(s,.1);assert.ok(Math.abs(s.hp-(1+3.5*1.15))<1e-8);
 s.druidCombat.wind=5;s.druidTalents.secondWind=1;const hp=s.hp;advance(s,2);assert.ok(Math.abs(s.hp-hp-3.5*1.15*1.25)<1e-8);
});
test('druid overheal shield absorbs damage, Oak Skin reduces damage, and roots preserve health fraction',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidLevel=20;s.druidTalents={touch:1,reserve:10};s.hp=20;s.phase='victory';s.phaseTime=100;
 const shieldEvents=advance(s,3);assert.equal(s.druidCombat.shield,2);assert.equal(s.companion.healAge,0);assert.equal(s.companion.actionAge,0);assert.equal(s.companion.shieldHeal,true);assert.equal(shieldEvents.find(e=>e.source==='shield')?.value,2);
 const cappedEvents=advance(s,3);assert.ok(!cappedEvents.some(e=>e.source==='shield'));
 s.hp=10;advance(s,3);assert.equal(s.companion.shieldHeal,false);s.hp=20;
 s.phase='fight';s.targetId=0;s.enemies[0].x=s.heroX+.115;s.enemies[0].clock=1.09;s.enemies[0].engaged=true;s.enemies[0].damage=10;
 step(s,.02,()=>.999);assert.equal(s.hp,12);assert.equal(s.druidCombat.shield,0);
 s.druidTalents.bark=1;s.druidTalents.thickBark=10;s.druidCombat.bark=4;s.druidCombat.barkCooldown=25;s.hp=20;s.enemies[0].clock=1.09;
 step(s,.02,()=>.999);assert.equal(s.hp,12);
 s.druidLevel=100;s.hp=10;assert.equal(learnDruidTalent(s,'roots'),true);assert.equal(s.hp/stats(s).hp,.5);
 s.druidTalents.roots=10;s.hp=stats(s).hp*.5;s.hiredCompanions.push('archer');selectCompanion(s,'archer');prepareEncounter(s);assert.equal(s.hp/stats(s).hp,.5);
});
test('druid active healing includes fractional duration ranks and Bloom damages only from real healing',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidTalents={touch:1,regrowth:1,spring:1,sap:10};s.hp=1;s.phase='victory';s.phaseTime=100;
 s.druidCombat.regrowth=5.5;s.druidCombat.regrowthCooldown=20;
 const events=advance(s,5.5);const healed=events.filter(e=>e.type==='heroRegen').reduce((sum,e)=>sum+e.value,0);
 assert.ok(Math.abs(healed-(3.5+3.5*.3*1.2*5.5))<1e-8);
 s.druidTalents={touch:1,bloom:1};s.druidCombat.bloom=2;s.druidCombat.bloomClock=0;s.druidCombat.regrowth=0;s.hp=10;
 s.phase='fight';s.targetId=0;s.heroClock=0;s.enemies[0].x=s.heroX+.115;s.enemies[0].hp=s.enemies[0].maxHp=100;s.enemies[0].damage=0;
 const bloomEvents=advance(s,1);assert.equal(bloomEvents.filter(e=>e.type==='companionHit').length,1);assert.ok(Math.abs(bloomEvents.find(e=>e.type==='companionHit').value-.35)<1e-8);
 s.hp=20;s.druidCombat.bloom=2;s.druidCombat.bloomClock=0;assert.equal(advance(s,1).filter(e=>e.type==='companionHit').length,0);
});
test('Second Wind prevents lethal hits for five seconds, boosts all healing, and keeps the resulting HP',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidTalents={touch:1,secondWind:1};s.hp=5;s.phase='fight';s.targetId=0;
 const e=s.enemies[0];e.x=s.heroX+.115;e.engaged=true;e.clock=1.09;e.damage=100;e.hp=e.maxHp=1000;
 let events=step(s,.02,()=>.999);assert.equal(s.hp,1);assert.equal(s.druidCombat.wind,5);assert.equal(events.filter(e=>e.skill==='secondWind').length,1);
 e.clock=1.09;step(s,.02,()=>.999);assert.equal(s.hp,1);e.damage=0;
 s.companion.regenClock=2.99;step(s,.02,()=>.999);assert.equal(s.hp,1+3.5*1.25);
 advance(s,5);assert.ok(s.hp>0);assert.equal(s.druidCombat.wind,0);assert.ok(s.druidCombat.windCooldown>80);
 e.damage=100;e.clock=1.09;step(s,.02,()=>.999);assert.equal(s.phase,'dead');
});
test('druid abilities autocast at missing-health thresholds and share cooldowns across dungeon entry',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidTalents={touch:1,regrowth:1,bark:1,bloom:1,evergreen:10,awakening:10};s.hp=8;s.phase='fight';s.targetId=0;
 s.enemies[0].x=s.heroX+.115;s.enemies[0].damage=0;
 const events=step(s,.02,()=>.999);assert.deepEqual(events.filter(e=>e.type==='druidSkill').map(e=>e.skill),['regrowth','bark','bloom']);
 assert.equal(s.druidCombat.bloomCooldown,57);assert.ok(s.druidCombat.bloom>9.9);
 assert.equal(step(s,.02,()=>.999).filter(e=>e.type==='druidSkill').length,0);
 s.highest=2;assert.equal(enterDungeon(s,'treasury',1),true);assert.deepEqual(s.dungeons.run.battle.druidTalents,s.druidTalents);
 assert.equal(s.dungeons.run.battle.druidCombat,s.druidCombat);assert.equal(learnDruidTalent(s,'herbs'),false);assert.equal(resetDruidTalents(s),false);
 step(s,.1,()=>.999);assert.ok(s.druidCombat.bloomCooldown<57);
});
test('talent reset refunds points without healing or refreshing cooldowns; old saves keep level and resources',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidLevel=20;
 learnDruidTalent(s,'touch');for(let i=0;i<10;i++)learnDruidTalent(s,'roots');
 s.hp=stats(s).hp*.5;s.druidCombat.windCooldown=80;s.druidCombat.bloomCooldown=50;
 assert.equal(resetDruidTalents(s),true);assert.equal(s.hp,10);assert.deepEqual(s.druidTalents,{});assert.equal(s.druidCombat.windCooldown,80);assert.equal(s.druidCombat.bloomCooldown,50);
 s.coins=123;delete s.druidTalents;delete s.druidCombat;
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.druidLevel,20);assert.equal(loaded.coins,123);assert.deepEqual(loaded.druidTalents,{});
});
function wave(level,index) {
 const s=freshGame();s.level=s.highest=level;s.encounter=index-1;s.phase='victory';s.phaseTime=0;step(s,1/30);return s;
}
function durable(s) { s.equipment.helmet=candidate('helmet',10000);s.equipment.weapon=candidate('weapon',2);s.hp=stats(s).hp;return s; }

test('shop rolls ten items up to 100 independently of mastery and guarantees both weapon ranges',()=>{
 const now=SHOP_REFRESH_INTERVAL*10+1000;
 for(let level=1;level<=ANVILS.length;level++){
   const s=freshGame(now);s.anvilLevel=level;const before=JSON.stringify(s);
   assert.equal(refreshShop(s,now,()=>.999999),true);
   assert.equal(s.shop.offers.length,10);
   assert.equal(WEAPONS[s.shop.offers[0].item.weaponId].range,0);
   assert.ok(WEAPONS[s.shop.offers[1].item.weaponId].range>0);
   assert.ok(s.shop.offers.every(o=>o.item.itemLevel===100));
   assert.equal(JSON.stringify({...s,shop:null}),before);
 }
});

test('shop gives exactly five times the rare-epoch probability and caps the total from later epochs first',()=>{
 const s=freshGame();s.anvilLevel=5;
 refreshShop(s,0,()=>.997499);assert.ok(s.shop.offers.every(o=>o.item.epoch===2));
 refreshShop(s,SHOP_REFRESH_INTERVAL,()=>.997501);assert.ok(s.shop.offers.every(o=>o.item.epoch===3));
 s.anvilLevel=60;
 refreshShop(s,2*SHOP_REFRESH_INTERVAL,()=>.74999);assert.equal(s.shop.offers[0].item.epoch,9);
 refreshShop(s,3*SHOP_REFRESH_INTERVAL,()=>.75001);assert.equal(s.shop.offers[0].item.epoch,10);
 refreshShop(s,4*SHOP_REFRESH_INTERVAL,()=>0);assert.ok(s.shop.offers.every(o=>o.item.epoch===9));
});

test('shop affixes use a fixed half percent on every item type and add fifty percent to price',()=>{
 for(const chance of [.004999,.005]){
   const s=freshGame();s.anvilLevel=5;
   const rolls=Array.from({length:10},(_,i)=>[...(i<2?[]:[(SLOTS.indexOf(i===2?'helmet':i===3?'ring1':'chest')+.1)/12]),.999999,.999999,0,chance,...(chance<.005?[.1,.2]:[])]).flat();
   refreshShop(s,0,()=>rolls.shift()??.5);
   assert.ok(s.shop.offers.every(o=>!!o.item.affix===(chance<.005)));
   assert.ok(s.shop.offers.every(o=>o.price===(chance<.005?3000:2000)));
   assert.equal(s.shop.offers[2].item.slot,'helmet');assert.equal(s.shop.offers[3].item.slot,'ring');
 }
 const s=freshGame();s.anvilLevel=60;
 refreshShop(s,0,()=>.999999);assert.equal(s.shop.offers[0].price,4374000);
});

test('shop stock and purchases survive reload and forge upgrades until the six-hour refresh',()=>{
 const now=SHOP_REFRESH_INTERVAL*10+1000,s=freshGame(now);s.coins=10000;
 refreshShop(s,now,()=>.5);assert.equal(buyShopItem(s,0,s.shop.cycle,now),true);
 const restored=restore(JSON.stringify(s),now+1000);assert.deepEqual(restored.shop,s.shop);assert.deepEqual(restored.inventory,s.inventory);
 restored.anvilLevel=20;
 assert.equal(refreshShop(restored,now+2000,()=>{throw Error('must not reroll');}),false);
 assert.equal(refreshShop(restored,11*SHOP_REFRESH_INTERVAL,()=>.5),true);
 assert.ok(restored.shop.offers.every(o=>!o.bought));assert.equal(restored.inventory.length,1);
});

test('shop purchase rejects insufficient coins, full inventory, duplicate and expired offers without charging',()=>{
 const now=SHOP_REFRESH_INTERVAL*10+1000,s=freshGame(now);refreshShop(s,now,()=>.5);
 const cycle=s.shop.cycle,offer=s.shop.offers[0];
 assert.equal(buyShopItem(s,0,cycle,now),false);assert.equal(s.inventory.length,0);
 s.coins=offer.price*3;s.inventory=Array.from({length:s.inventoryCapacity},()=>structuredClone(offer.item));
 assert.equal(buyShopItem(s,0,cycle,now),false);assert.equal(s.coins,offer.price*3);
 s.inventory=[];assert.equal(buyShopItem(s,0,cycle,now),true);assert.equal(s.coins,offer.price*2);
 assert.equal(buyShopItem(s,0,cycle,now),false);assert.equal(s.inventory.length,1);
 assert.equal(buyShopItem(s,1,cycle,(cycle+1)*SHOP_REFRESH_INTERVAL),false);
 refreshShop(s,(cycle+1)*SHOP_REFRESH_INTERVAL,()=>.5);
 assert.equal(buyShopItem(s,0,cycle,(cycle+1)*SHOP_REFRESH_INTERVAL),false);assert.equal(s.coins,offer.price*2);
});

test('shop prehistoric armor keeps its affix after buying, equipping and restoring',()=>{
 const now=SHOP_REFRESH_INTERVAL*10+1000,s=freshGame(now);s.coins=10000;
 const rolls=Array.from({length:10},(_,i)=>[...(i<2?[]:[.1]),0,0,0,0,0,0]).flat();
 refreshShop(s,now,()=>rolls.shift()??0);
 assert.equal(s.shop.offers[2].item.slot,'helmet');assert.equal(buyShopItem(s,2,s.shop.cycle,now),true);
 assert.equal(equip(s,'helmet',false,0),true);
 const restored=restore(JSON.stringify(s),now);
 assert.deepEqual(restored.equipment.helmet,s.equipment.helmet);assert.ok(restored.equipment.helmet.affix);
 assert.deepEqual(restored.shop,s.shop);
});

test('turtle intercepts only from the front, reduces damage by 25% and never attacks without talents',()=>{
 const s=freshGame(),e=s.enemies[0];e.x=s.heroX+.20;e.hp=1000;e.damage=4;
 s.turtleTalents={shell:1};s.companion={kind:'turtle',x:s.heroX+.10,hp:30,maxHp:30,actionAge:1};
 const events=step(s,.5,()=>.999);
 assert.equal(s.hp,20);assert.equal(s.companion.hp,27);
 assert.equal(events.find(e=>e.type==='tankHit').value,3);
 assert.ok(!events.some(e=>e.type==='companionHit'));assert.equal(e.hp,1000);
 s.companion.hp=1;e.clock=1.09;
 assert.ok(step(s,.02,()=>.999).some(e=>e.type==='tankDown'));
 advance(s,2);assert.ok(s.hp<20);assert.equal(s.companion.hp,0);
 s.phase='victory';s.phaseTime=0;step(s,.01,()=>.999);
 assert.equal(s.companion.hp,30);
});

test('turtle behind the hero cannot absorb hits remotely',()=>{
 const s=freshGame(),e=s.enemies[0];e.x=s.heroX+.115;e.engaged=true;e.clock=1.09;e.damage=4;
 s.turtleTalents={shell:1};s.companion={kind:'turtle',x:s.heroX-.3,hp:30,maxHp:30,actionAge:1};
 step(s,.02,()=>.999);assert.equal(s.hp,16);assert.equal(s.companion.hp,30);
});

test('turtle runs farther ahead and keeps its world position across waves',()=>{
 const s=freshGame();s.enemies[0].x=s.heroX+5;
 s.turtleTalents={shell:1};s.companion={kind:'turtle',x:s.heroX-.13,hp:30,maxHp:30,actionAge:1};
 advance(s,3);assert.ok(s.companion.x-s.heroX>.20);
 s.phase='victory';s.phaseTime=0;
 const previous=s.companion.x;step(s,.01,()=>.999);
 assert.ok(s.companion.x>=previous);assert.ok(s.companion.x>s.heroX);
 s.phase='dead';s.phaseTime=0;s.hp=0;step(s,.01,()=>.999);
 assert.equal(s.companion.x,s.heroX-.13);
});

test('druid heals continuously every three seconds, caps at max health and resets on death',()=>{
 const s=freshGame();s.hp=1;s.phase='victory';s.phaseTime=100;
 s.druidTalents={touch:1};
 s.companion={kind:'druid',x:s.heroX-.13,clock:0,actionAge:1,regenClock:0};
 advance(s,2);assert.equal(s.hp,1);let events=advance(s,1);assert.equal(s.hp,4.5);
 events.push(...advance(s,12));assert.equal(s.hp,18.5);assert.equal(events.filter(e=>e.type==='heroRegen').length,5);
 events=advance(s,3);assert.equal(s.hp,20);assert.equal(events.find(e=>e.type==='heroRegen').value,1.5);
 s.phase='dead';s.phaseTime=10;s.hp=0;advance(s,2);assert.equal(s.hp,0);assert.equal(s.companion.regenClock,0);
});



test('archer companion follows, waits for range, and rewards a projectile kill once',()=>{
 const s=freshGame();s.archerTalents={shot:1};s.companion={kind:'archer',x:s.heroX-.13,clock:0,actionAge:1,moving:false,shot:null};
 step(s,.01,()=>.999);
 assert.equal(s.companion.shot,null);assert.ok(s.companion.x<s.heroX);
 const e=s.enemies[0];e.x=s.heroX+.115;e.hp=1;e.damage=0;
 s.phase='fight';s.targetId=e.id;s.heroClock=0;
 s.companion.x=s.heroX-.13;s.companion.clock=.99;
 let events=step(s,.02,()=>.999);
 assert.ok(s.companion.shot);assert.equal(e.hp,1);
 events.push(...step(s,.19,()=>.999));
 assert.equal(events.filter(e=>e.type==='companionHit').length,1);
 assert.equal(events.filter(e=>e.type==='kill').length,1);
 assert.equal(s.coins,e.reward);assert.equal(s.kills,1);assert.equal(s.phase,'victory');
 step(s,.1,()=>.999);assert.equal(s.coins,e.reward);assert.equal(s.companionXp.archer,e.reward);assert.equal(s.companion.shot,null);
});

test('archer projectile cannot damage another target or carry through a restart',()=>{
 const s=freshGame(),e=s.enemies[0];e.x=s.heroX+.115;e.damage=0;
 s.archerTalents={shot:1};s.companion={kind:'archer',x:s.heroX-.13,clock:0,actionAge:0,moving:false,shot:{targetId:999,remaining:.01,fromX:0,toX:1}};
 s.phase='fight';s.targetId=e.id;s.heroClock=0;
 const hp=e.hp;step(s,.02,()=>.999);assert.equal(e.hp,hp);
 s.phase='dead';s.phaseTime=0;s.hp=0;s.companion.shot={targetId:e.id,remaining:.1};
 step(s,.02,()=>.999);assert.equal(s.companion.shot,null);assert.equal(s.companion.clock,0);
 assert.equal(s.companion.x,s.heroX-.13);
});

test('paid anvil skip scales with remaining time, preserves poor balances, and charges once',()=>{
 const s=freshGame();s.coins=1000;
 assert.equal(anvilSkipCost(s,1000),0);assert.equal(skipAnvilUpgrade(s,1000),false);
 upgradeAnvil(s,1000);assert.equal(anvilSkipCost(s,1000),650);assert.equal(anvilSkipCost(s,91000),325);
 const loaded=restore(JSON.stringify(s),91000);assert.equal(anvilSkipCost(loaded,91000),325);
 loaded.coins=324;const before=structuredClone(loaded);assert.equal(skipAnvilUpgrade(loaded,91000),false);assert.deepEqual(loaded,before);
 loaded.coins=325;assert.equal(skipAnvilUpgrade(loaded,91000),true);assert.equal(loaded.coins,0);assert.equal(loaded.anvilLevel,2);assert.equal(loaded.upgradeEndsAt,0);
 assert.equal(skipAnvilUpgrade(loaded,91000),false);assert.equal(loaded.anvilLevel,2);
 assert.equal(skipAnvilUpgrade(s,181000),true);assert.equal(s.coins,870);assert.equal(s.anvilLevel,2);
 assert.equal(skipAnvilUpgrade(s,181000),false);
 const last=freshGame();last.anvilLevel=ANVILS.length;last.coins=1e9;assert.equal(anvilSkipCost(last),0);assert.equal(skipAnvilUpgrade(last),false);
});

test('chosen batch controls manual and auto forging, persists, and spends partial remainder',()=>{
 const s=freshGame();s.hammers=7;assert.equal(s.selectedBatch,1);assert.equal(forgeCost(s),1);
 forge(s);assert.equal(s.forgingItems.length,1);assert.equal(s.hammers,6);
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.selectedBatch,1);
 loaded.autoForge=true;advance(loaded,1.6);
 assert.equal(loaded.forgingItems.length,1);assert.equal(loaded.hammers,5);
 loaded.forging=0;loaded.forgingItems=[];loaded.selectedBatch=2;loaded.hammers=1;
 forge(loaded);assert.equal(loaded.forgingItems.length,1);assert.equal(loaded.hammers,0);
 assert.equal(loaded.autoForge,false);
 const old=freshGame();old.coins=713;delete old.selectedBatch;
 assert.equal(restore(JSON.stringify(old)).coins,713);
 assert.equal(restore(JSON.stringify(old)).selectedBatch,1);
 old.selectedBatch=40;assert.equal(restore(JSON.stringify(old)).selectedBatch,1);
});

test('forge drops only connected sets across every slot and preserves old owned items',()=>{
 for(let bucket=0;bucket<12;bucket++)for(const roll of [0,.499,.5,.999]){
  const s=freshGame();s.hammers=1;
  const rolls=[(bucket+.1)/12,0,0,roll];
  forge(s,()=>rolls.shift() ?? .999);
  const item=s.forgingItems[0];
  if(bucket===0){assert.equal(WEAPONS[item.weaponId].epoch,1);assert.equal(item.quality,WEAPONS[item.weaponId].quality);assert.equal(item.name,WEAPONS[item.weaponId].name);}
  else{assert.equal(item.quality,roll<.5?0:1);assert.match(item.name,/^(Hunter|Bone)/);}
 }
 const s=freshGame();s.equipment.weapon={slot:'weapon',name:'Forest Guardian Sword',quality:2,value:17,sale:1};
 const loaded=restore(JSON.stringify(s));
 assert.equal(loaded.equipment.weapon.quality,2);
 assert.equal(loaded.equipment.weapon.value,17);
});

test('short opening level, full boss escorts, and stronger first-biome health',()=>{
 assert.deepEqual(stats(freshGame()),{hp:20,damage:2});
 assert.ok(WAVES.every(row=>row.length===10));
 for(let level=1;level<=10;level++){
  for(let n=0;n<10;n++){
   const s=wave(level,n);assert.equal(s.enemies.some(e=>e.boss),n===9);
   assert.ok(s.enemies.length<=5);
   if(level===1&&n<9)assert.equal(s.enemies.length,1);
   if(level<6&&n<9)assert.ok(s.enemies.every(e=>e.kind!=='healer'));
   if(n===9)assert.deepEqual(s.enemies.map(e=>e.kind),level===1?['boss']:['warrior','warrior','boss','archer','healer']);
  }
  assert.equal(enemyFor(level).maxHp,Math.round((10+2*(level-1))*(2+2*(level-1)/19)));
  assert.equal(enemyFor(level).damage,level===1?1:level<6?2:3);
  assert.equal(enemyFor(level,'archer').maxHp,Math.round((level+4)*(2+2*(level-1)/19)));
  assert.equal(enemyFor(level,'archer').damage,level<10?1:2);
  assert.equal(enemyFor(level,'boss').maxHp,Math.round((level===1?30:6*(10+2*(level-1)))*(2+2*(level-1)/19)));
  assert.equal(enemyFor(level,'boss').damage,level===1?2:level<6?5:level<10?6:7);
  assert.equal(enemyFor(level,'healer').healing,level<10?4:8);
 }
 assert.ok(enemyFor(200).maxHp>enemyFor(100).maxHp);
});

test('group attacks: three melee attackers, ranged damage before hero reaches archers',()=>{
 const s=durable(wave(10,6));for(const e of s.enemies)if(e.kind==='warrior')e.hp=e.maxHp=1000;
 let arrow=false,hit=false,heroHit=false;const meleeHits=new Set();
 for(let i=0;i<30*15;i++){
  const events=step(s,1/30);
  assert.ok(s.enemies.filter(e=>e.hp>0&&e.engaged&&(e.kind==='warrior'||e.boss)).length<=3);
  for(const e of events){
   if(e.type==='enemyShot')arrow=true;
   if(e.type==='enemyHit'&&e.ranged)hit=true;
   if(e.type==='enemyHit'&&!e.ranged)meleeHits.add(e.sourceId);
   if(e.type==='heroHit'){heroHit=true;assert.equal(s.enemies[e.targetId].kind,'warrior');}
  }
 }
 assert.ok(arrow&&hit&&heroHit);
 assert.deepEqual([...meleeHits].sort(),s.enemies.filter(e=>e.kind==='warrior').map(e=>e.id));
 const ranged=durable(wave(4,3));let sawRangedHit=false;
 for(let i=0;i<30*8;i++){
  for(const e of step(ranged,1/30))if(e.type==='enemyHit'&&e.ranged&&ranged.phase==='walk')sawRangedHit=true;
 }
 assert.ok(sawRangedHit);
});

test('fourth melee waits, replaces a fallen attacker; boss attacks alongside two guards',()=>{
 const s=durable(wave(10,6));s.enemies=s.enemies.filter(e=>e.kind==='warrior');
 s.enemies.push({...s.enemies[2],id:3,x:s.enemies[2].x+.11});
 for(const e of s.enemies)e.hp=e.maxHp=1000;
 const hits=advance(s,10).filter(e=>e.type==='enemyHit');
 assert.deepEqual([...new Set(hits.map(e=>e.sourceId))].sort(),[0,1,2]);
 assert.equal(s.enemies[3].engaged,false);
 s.enemies[0].hp=0;
 assert.ok(advance(s,3).some(e=>e.type==='enemyHit'&&e.sourceId===3));
 assert.equal(s.enemies.filter(e=>e.hp>0&&e.engaged).length,3);

 const escort=durable(wave(8,9));
 const guards=escort.enemies.filter(e=>e.kind==='warrior'),boss=escort.enemies.find(e=>e.boss);
 for(const e of guards)e.hp=e.maxHp=1000;
 const bossHits=advance(escort,8).filter(e=>e.type==='enemyHit');
 assert.ok(guards.every(e=>e.hp>0));
 for(const e of [...guards,boss])assert.ok(bossHits.some(hit=>hit.sourceId===e.id));
});

test('healer keeps healing every 1.5 seconds, never itself or a dead ally',()=>{
 const s=durable(wave(16,6));
 const tank=s.enemies.find(e=>e.kind==='warrior');tank.hp=300;tank.maxHp=1000;
 const healer=s.enemies.find(e=>e.kind==='healer');healer.hp=3;const ownHp=healer.hp;
 const dead=s.enemies.find(e=>e.kind==='archer');dead.hp=0;
 const heals=[],ticks=[];
 for(let tick=0;tick<900;tick++)for(const event of step(s,1/30,()=>.999))if(event.type==='heal'){heals.push(event);ticks.push(tick);}
 assert.ok(heals.length>=12);
 for(let i=1;i<ticks.length;i++)assert.equal(ticks[i]-ticks[i-1],45);assert.ok(heals.every(e=>e.sourceId===healer.id&&e.targetId===tank.id&&e.value===healer.healing));
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

test('ordinary enemies drop one hammer at 20 percent, one payout per kill',()=>{
 for (const [roll,qty] of [[.2,0],[.199,1],[.1,1],[0,1]]) {
  const s=freshGame();s.hammers=0;s.enemies[0].hp=1;s.enemies[0].x=s.heroX+.115;
  let calls=0;const rng=()=>calls++===0?.999:calls===2?roll:roll===0?0:.999;
  const events=step(s,1.3,rng);assert.equal(events.find(e=>e.type==='kill').hammers,qty);
  assert.equal(s.hammers,qty);assert.equal(s.coins,4);
  step(s,.01,()=>0);assert.equal(s.hammers,qty);assert.equal(s.coins,4);
 }
 const last=wave(200,9);last.hammers=0;last.equipment.weapon=candidate('weapon',1e15);
 const boss=last.enemies.find(e=>e.boss);boss.x=last.heroX+.165;
 step(last,1.3,()=>.499);assert.equal(last.hammers,335);assert.equal(last.coins,7632);
});

test('bosses always give five times their biome hammer roll, including high rolls, and only once',()=>{
 for (const [roll,quantity] of [[0,10],[.5,15],[.999,20]]) {
  const s=wave(1,9),boss=s.enemies.find(e=>e.boss);s.hammers=0;boss.hp=1;boss.x=s.heroX+.165;
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
 assert.equal(collectIdleRewards(s,start+95000),1);assert.equal(s.coins,1);assert.equal(s.hammers,16);
 const loaded=restore(JSON.stringify(s),start+119999);
 assert.equal(idleRewards(loaded,start+119999),0);assert.equal(collectIdleRewards(loaded,start+120000),1);
 assert.equal(loaded.coins,2);assert.equal(loaded.hammers,17);assert.equal(loaded.autoForge,false);
 const old=wave(4,3);old.coins=713;old.hammers=18;delete old.idleSince;
 const migrated=restore(JSON.stringify(old),start);
 assert.equal(migrated.idleSince,start);assert.equal(idleRewards(migrated,start),0);
 assert.equal(migrated.coins,713);assert.equal(migrated.hammers,18);
 assert.equal(migrated.level,4);assert.equal(migrated.encounter,3);assert.deepEqual(migrated.equipment,old.equipment);
 assert.equal(idleRewards(restore(JSON.stringify(migrated),start+60000),start+60000),1);
});

test('batch spends one hammer per item, keeps coins, rolls once, and resumes animation after reload',()=>{
 const s=freshGame();s.selectedBatch=2;s.hammers=5;s.coins=80;
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
 const s=freshGame();s.selectedBatch=2;s.hammers=2;s.mastery[0]={level:1,xp:2};
 let calls=0;forge(s,()=>[0,0,.999,0,.999][calls++%5]);
 assert.deepEqual(s.forgingItems.map(i=>i.itemLevel),[1,2]);assert.deepEqual(s.mastery[0],{level:2,xp:1});
 finishForge(s);s.anvilLevel=2;s.hammers=1;calls=0;
 forge(s,()=>[0,.99999,.999,.3,.999][calls++%5]);assert.equal(s.forgingItems[0].epoch,2);assert.equal(s.forgingItems[0].value,20);
 assert.equal(s.mastery[1].xp,1);assert.equal(s.mastery[0].xp,1);
 finishForge(s);s.anvilLevel=1;s.hammers=2;s.mastery[0]={level:99,xp:51};calls=0;
 forge(s,()=>[0,0,.999,.999,.999][calls++%5]);assert.deepEqual(s.forgingItems.map(i=>i.itemLevel),[99,100]);
 assert.deepEqual(s.mastery[0],{level:100,xp:0});
 finishForge(s);s.hammers=1;forge(s,()=>0);assert.equal(s.forgingItems[0].itemLevel,1);assert.equal(s.forgingItems[0].value,2);
});

test('cheaper mastery reaches level 100 after 2698 items of its epoch',()=>{
 const s=freshGame();s.hammers=2698;
 for(let i=0;i<2697;i++){assert.equal(forge(s,()=>0),true);finishForge(s);}
 assert.deepEqual(s.mastery[0],{level:99,xp:51});
 assert.equal(forge(s,()=>0),true);assert.deepEqual(s.mastery[0],{level:100,xp:0});
 assert.ok(s.mastery.slice(1).every(m=>m.level===1&&m.xp===0));
});

test('old mastery keeps earned levels and carries unspent XP through cheaper thresholds once',()=>{
 const s=freshGame(1000);s.coins=713;s.hammers=91;
 s.mastery[0]={level:1,xp:4};s.mastery[1]={level:30,xp:33};
 s.mastery[2]={level:99,xp:102};s.mastery[3]={level:50,xp:0};
 const loaded=restore(JSON.stringify(s),1000);
 assert.deepEqual(loaded.mastery.slice(0,4),[{level:2,xp:1},{level:31,xp:16},{level:100,xp:0},{level:50,xp:0}]);
 assert.equal(loaded.coins,713);assert.equal(loaded.hammers,91);
 assert.deepEqual(restore(JSON.stringify(loaded),1000),loaded);
});

test('melee damage and ranged discount use the supported epoch even at maximum anvil level',()=>{
 const values=[];
 const pool=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===10);
 for(const id of ['seraph-glaive','sun-maul','oath-bell','halo-bow']){const set=(pool.indexOf(id)+.5)/pool.length;const s=freshGame();s.hammers=1;s.anvilLevel=ANVILS.length;s.mastery[9].level=100;let calls=0;
 forge(s,()=>[0,.999,.999,set][calls++%4]);const i=s.forgingItems[0];values.push(i.value);assert.equal(i.sale,10);assert.equal(i.epoch,10);assert.equal(i.itemLevel,100);}
 assert.deepEqual(values,[11900000000,11900000000,11900000000,9520000000]);
});

test('auto continues with unresolved results, stops on zero/manual toggle, does not restart on loot',()=>{
 const s=freshGame();s.selectedBatch=2;s.hammers=5;s.autoForge=true;s.phase='dead';s.phaseTime=100;
 advance(s,5);assert.equal(s.hammers,0);assert.equal(s.autoForge,false);assert.equal(s.results.length+1,5);
 s.hammers=7;advance(s,2);assert.equal(s.hammers,7);
 s.autoForge=true;step(s,1/30,()=>0);s.autoForge=false;finishForge(s);assert.equal(s.hammers,5);
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded,s);
 const idle=restore(JSON.stringify({...s,autoForge:true}),Date.now()+86400000);assert.equal(idle.hammers,s.hammers);assert.equal(idle.kills,s.kills);
});

test('auto epoch filter sells only matching new rolls, keeps queued cards, and filters the last paid batch after reload',()=>{
 const s=freshGame();s.selectedBatch=2;s.anvilLevel=2;s.coins=70;s.hammers=2;s.autoForge=true;s.autoSellEpochs=[1];s.keepAffixes=[];
 s.pending={...candidate('weapon',7),epoch:1,itemLevel:1};s.results=[{...candidate('helmet',5),epoch:1,itemLevel:1}];
 const oldPending=structuredClone(s.pending),oldQueued=structuredClone(s.results[0]);
 const rolls=[0,0,0,0,0,.99999,0,0];assert.equal(forge(s,()=>rolls.shift() ?? .999),true);
 assert.equal(s.autoForge,false);assert.equal(s.forgingAuto,true);assert.equal(s.hammers,0);assert.equal(s.coins,70);
 assert.equal(s.mastery[0].xp,1);assert.equal(s.mastery[1].xp,1);
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.forgingAuto,true);assert.deepEqual(loaded.autoSellEpochs,[1]);
 loaded.phase='dead';loaded.phaseTime=100;
 const event=step(loaded,1.5).find(e=>e.type==='forged');
 assert.equal(event.count,2);assert.equal(event.soldCount,1);assert.equal(event.soldCoins,1);assert.equal(event.item.epoch,2);
 assert.equal(loaded.autoForgeCoins,1);assert.equal(loaded.coins,71);assert.equal(loaded.hammers,0);assert.equal(loaded.forgingAuto,false);
 assert.deepEqual(loaded.pending,oldPending);assert.deepEqual(loaded.results[0],oldQueued);
 assert.equal(loaded.results.length,2);assert.equal(loaded.results[1].epoch,2);
 const again=restore(JSON.stringify(loaded));step(again,1.5);assert.equal(again.coins,71);assert.equal(again.autoForgeCoins,1);assert.equal(again.results.length,2);
});

test('manual forging keeps excluded epochs; stopping auto finishes the paid batch and can sell every new item',()=>{
 const manual=freshGame();manual.selectedBatch=2;manual.autoSellEpochs=[1];manual.hammers=2;forge(manual,()=>0);finishForge(manual);
 assert.equal(manual.autoForgeCoins,0);assert.equal(manual.coins,0);assert.ok(manual.pending);assert.equal(manual.results.length,1);
 const s=freshGame();s.selectedBatch=2;s.autoSellEpochs=[1];s.keepAffixes=[];s.hammers=4;s.autoForge=true;forge(s,()=>0);s.autoForge=false;
 s.phase='dead';s.phaseTime=100;const events=step(s,1.5);
 assert.equal(s.autoForgeCoins,2);assert.equal(events.find(e=>e.type==='forged').soldCoins,2);assert.equal(s.coins,2);assert.equal(s.hammers,2);
 assert.equal(s.pending,null);assert.deepEqual(s.results,[]);assert.equal(s.mastery[0].xp,2);
 step(s,1.5);assert.equal(s.coins,2);assert.equal(s.hammers,2);
});

test('older saves keep all epochs by default and retain paid items and progress',()=>{
 const s=freshGame();s.selectedBatch=2;s.coins=713;s.hammers=5;forge(s,()=>0);delete s.autoSellEpochs;delete s.forgingAuto;
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.autoSellEpochs,[]);assert.equal(loaded.forgingAuto,false);
 assert.equal(loaded.coins,713);assert.equal(loaded.hammers,3);assert.equal(loaded.forgingItems.length,2);
 finishForge(loaded);assert.ok(loaded.pending);assert.equal(loaded.results.length,1);assert.equal(loaded.coins,713);
});

test('all twelve slots enter the pool; selected result stays stable during new batches',()=>{
 for(const [index,slot] of SLOTS.entries()){
  const s=freshGame();s.selectedBatch=2;s.hammers=1;let calls=0;forge(s,()=>calls++===0?(index+.5)/12:0);
  assert.equal(s.forgingItems[0].slot,slot.startsWith('ring')?'ring':slot);
 }
 const s=freshGame();s.selectedBatch=2;s.pending=candidate();s.results=[candidate('legs',5)];s.hammers=2;
 forge(s,()=>0);finishForge(s);assert.equal(s.pending.slot,'chest');assert.equal(s.results.length,3);
 browseResults(s);assert.equal(s.pending.slot,'legs');browseResults(s,-1);assert.equal(s.pending.slot,'chest');
 s.hp=13.25;const ratio=s.hp/stats(s).hp;assert.equal(equip(s),true);assert.equal(s.hp/stats(s).hp,ratio);
 const gold=s.coins;assert.equal(sell(s),true);assert.equal(s.coins,gold+1);assert.equal(s.pending.slot,'weapon');
});

test('rings replace only the chosen slot, including while another batch is being forged',()=>{
 const s=freshGame();s.selectedBatch=2;s.pending=candidate('ring',3);s.hammers=2;forge(s,()=>0);
 assert.equal(equip(s),false);assert.equal(equip(s,'weapon'),false);assert.equal(equip(s,'ring2'),true);
 assert.equal(s.equipment.ring1,null);assert.equal(s.equipment.ring2.value,3);assert.equal(s.forgingItems.length,2);
 s.pending=candidate('ring',1);equip(s,'ring1');assert.equal(s.equipment.ring2.value,3);assert.equal(s.equipment.ring1.value,1);
});

test('anvil charges at start once, uses old probabilities until deadline and completes offline once',()=>{
 const s=freshGame();s.coins=129;assert.equal(upgradeAnvil(s,1000),false);s.coins=1000;
 assert.equal(upgradeAnvil(s,1000),true);assert.equal(s.coins,870);assert.equal(s.upgradeEndsAt,181000);
 assert.equal(upgradeAnvil(s,2000),false);assert.equal(s.coins,870);assert.equal(s.anvilLevel,1);
 s.hammers=1;forge(s,()=>.999);assert.equal(s.forgingItems[0].epoch,1);
 assert.equal(finishUpgrade(s,180999),false);
 const loaded=restore(JSON.stringify(s),181000);assert.equal(loaded.anvilLevel,2);assert.equal(loaded.upgradeEndsAt,0);assert.equal(loaded.coins,870);
 assert.equal(finishUpgrade(loaded,9999999),false);assert.equal(loaded.anvilLevel,2);
 loaded.anvilLevel=ANVILS.length;assert.equal(upgradeAnvil(loaded),false);
 assert.equal(ANVILS.reduce((sum,row)=>sum+row.minutes,0),97776);
 assert.equal(ANVILS.at(-1).coins,25000000);
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
 for(let level=1;level<=200;level++)for(let n=0;n<10;n++){
  const s=wave(level,n),local=(level-1)%20+1,min=local<=5?2:local<=10?3:local<=15?4:5,max=local<=15?min+1:7;
  assert.equal(s.enemies.some(e=>e.boss),n===9);
  if(n===9)assert.deepEqual(s.enemies.map(e=>e.kind),level===1?['boss']:['warrior','warrior','boss','archer','healer']);
  else if(level>1){
   assert.ok(s.enemies.length>=min&&s.enemies.length<=max);
   if(n<3)assert.equal(s.enemies.length,min);
   if(n===8)assert.equal(s.enemies.length,max);
  }
  for(const [kind,cap]of [['warrior',4],['archer',2],['healer',1]])assert.ok(s.enemies.filter(e=>e.kind===kind).length<=cap);
  assert.deepEqual(restore(JSON.stringify(s)),s);
 }
 const s=wave(6,6);s.selectedBatch=2;s.hp=1;s.hammers=7;s.coins=100;forge(s,()=>0);
 s.enemies[0].x=s.heroX+.115;s.enemies[0].engaged=true;s.enemies[0].clock=1.09;
 assert.ok(step(s,1/30).some(e=>e.type==='death'));advance(s,1.9);assert.equal(s.encounter,0);assert.equal(s.hp,stats(s).hp);assert.equal(s.coins,100);assert.equal(s.hammers,5);assert.ok(s.pending);
 s.hp=17;s.phase='victory';s.phaseTime=0;step(s,1/30);assert.equal(s.hp,17);
 const last=wave(200,9);last.phase='victory';last.phaseTime=0;
 assert.ok(step(last,1/30).some(e=>e.type==='complete'));assert.ok(restore(JSON.stringify(last)).completed);replay(last);assert.equal(last.level,1);assert.equal(last.highest,200);
});

test('biomes change only after their twentieth boss, and death retreats to the previous level',()=>{
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
   assert.equal(s.level,last);assert.equal(s.highest,last+1);assert.equal(s.encounter,0);assert.equal(s.enemies[0].name,BIOMES[i].names.warrior);
  }else assert.ok(s.completed);
  assert.equal(s.coins,731);assert.equal(s.hammers,97);
 }
});

test('loading an outdated pack starts the current formation without resetting level or owned progress',()=>{
 const s=wave(16,6);s.enemies.splice(4,1);s.enemies.forEach((e,i)=>e.id=i);
 s.level=147;s.highest=153;s.coins=913;s.hammers=64;s.hp=13;
 s.equipment.weapon=candidate('weapon',71);
 for(const e of s.enemies){Object.assign(e,enemyFor(s.level,e.kind));e.hp=e.maxHp-1;e.name='Old goblin';}
 const loaded=restore(JSON.stringify(s));
 assert.equal(loaded.level,147);assert.equal(loaded.highest,153);assert.equal(loaded.encounter,6);
 assert.equal(loaded.coins,913);assert.equal(loaded.hammers,64);assert.equal(loaded.hp,13);
 assert.deepEqual(loaded.equipment,s.equipment);
 assert.deepEqual(loaded.enemies.map(e=>e.kind),wave(147,6).enemies.map(e=>e.kind));
 assert.ok(loaded.enemies.every(e=>e.hp===e.maxHp));assert.equal(loaded.phase,'walk');
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
 const s=freshGame();s.selectedBatch=2;assert.ok(SLOTS.every(slot=>s.equipment[slot]===null));
 assert.equal(s.hammers,15);
 const existing=structuredClone(s);existing.hammers=0;assert.equal(restore(JSON.stringify(existing)).hammers,0);
 assert.equal(s.hp,20);assert.deepEqual(stats(s),{hp:20,damage:2});
 assert.deepEqual(restore(JSON.stringify(s)),s);
 for(let n=0;n<900 && !s.kills;n++)step(s,1/30,()=>0);
 assert.equal(s.kills,1);assert.equal(s.hp,2);assert.equal(s.deaths,0);assert.equal(s.hammers,16);
 assert.deepEqual(restore(JSON.stringify(s)),s);
 assert.equal(forge(s,()=>0),true);assert.equal(s.forgingItems.length,2);assert.equal(s.hammers,14);for(let n=0;n<46;n++)step(s,1/30,()=>0);
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


test('equip then sell compares the new equipment and keeps checked affixes without charging twice',()=>{
 const s=freshGame();s.equipment.weapon=candidate('weapon',5);s.pending=candidate('weapon',10);
 s.keepAffixes=['speed'];
 const protectedItem={...candidate('weapon',2),affix:{type:'speed',value:1}};
 s.results=[candidate('weapon',8),protectedItem,{...candidate('weapon',3),affix:{type:'damage',value:3}}];
 assert.equal(equipStronger(s),1);assert.equal(s.equipment.weapon.value,10);
 assert.deepEqual(sellWeaker(s),{count:2,coins:2});assert.equal(s.coins,2);
 assert.equal(s.pending,protectedItem);assert.deepEqual(s.results,[]);
 assert.equal(equipStronger(s),0);assert.deepEqual(sellWeaker(s),{count:0,coins:0});assert.equal(s.coins,2);
});


test('ranged hero stops at range, hits before contact, and does not retreat when approached',()=>{
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'slingshot',name:'Hunter Slingshot',quality:0,epoch:1,itemLevel:1,value:2,sale:1};
 const e=s.enemies[0];e.x=s.heroX+.39;e.hp=e.maxHp=1000;e.damage=0;const x=s.heroX;
 const events=advance(s,1.35);assert.equal(s.heroX,x);assert.ok(events.some(e=>e.type==='heroHit'));assert.ok(e.x-s.heroX>.115);assert.ok(e.moving);
 advance(s,4);assert.equal(s.heroX,x);assert.ok(Math.abs(e.x-s.heroX-.115)<.001);assert.ok(e.engaged);assert.ok(s.heroAttackCount>=3);
});
test('standard weapons share attack cadence and ranged damage survives saving',()=>{
 const counts=[];
 for(const id of Object.keys(WEAPONS).filter(id=>!WEAPONS[id].interval)){
  const s=freshGame(),ranged=['slingshot','short-bow'].includes(id);s.equipment.weapon={slot:'weapon',weaponId:id,name:id,quality:WEAPONS[id].quality,value:2,sale:1,epoch:WEAPONS[id].epoch,itemLevel:1};
  const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=1000;e.damage=0;
  const events=[],hits=[];for(let frame=0;frame<150;frame++){const batch=step(s,1/30,()=>.999);events.push(...batch);if(batch.some(e=>e.type==='heroHit'))hits.push((frame+1)/30);}counts.push(hits.length);assert.equal(events.find(e=>e.type==='heroHit').value,4);assert.ok(Math.abs(hits[0]-1.25)<=1/30);for(let i=1;i<hits.length;i++)assert.ok(Math.abs(hits[i]-hits[i-1]-2)<1e-9);
  const serial=freshGame();serial.equipment.weapon=s.equipment.weapon;const saved=restore(JSON.stringify(serial));assert.equal(saved.equipment.weapon.weaponId,id);assert.equal(saved.equipment.weapon.value,s.equipment.weapon.value);assert.equal(saved.kills,s.kills);
 }
 assert.equal(counts[0],2);assert.ok(counts.every(n=>n===counts[0]));
});
test('forge makes slingshots in epoch one and short bows from epoch two; discount is applied once',()=>{
 for(const [anvil,roll,id] of [[1,(Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===1).indexOf('slingshot')+.5)/Object.values(WEAPONS).filter(w=>w.epoch===1).length,'slingshot'],[2,0,'short-bow']]){
  const s=freshGame();s.hammers=1;s.anvilLevel=anvil;const rolls=[0,anvil===1?0:.99999,0,roll];forge(s,()=>rolls.shift() ?? .999);const i=s.forgingItems[0];assert.equal(i.weaponId,id);assert.equal(i.value,Math.round(1.6*10**(i.epoch-1)));
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
  const s=freshGame();s.coins=713;s.hammers=1;s.anvilLevel=anvil;const rolls=[0,(chances[0]+chances[1]/2)/100,0,(ids.indexOf(id)+.1)/ids.length];forge(s,()=>rolls.shift() ?? .999);const item=s.forgingItems[0];
  assert.equal(item.weaponId,id);assert.equal(item.epoch,2);assert.equal(item.value,20);finishForge(s);assert.equal(equip(s),true);const loaded=restore(JSON.stringify(s));assert.equal(loaded.equipment.weapon.weaponId,id);assert.equal(loaded.equipment.weapon.name,WEAPONS[id].name);assert.equal(loaded.equipment.weapon.value,20);assert.equal(loaded.coins,713);
 }
});


test('epoch identity stays fixed across all forged slots in the two completed epochs',()=>{
 for(const epoch of [1,2])for(let slot=0;slot<12;slot++)for(const appearance of [0,.34,.67,.999]){
  const s=freshGame();s.hammers=1;s.anvilLevel=2;const rolls=[(slot+.1)/12,epoch===1?0:.99999,0,appearance];forge(s,()=>rolls.shift() ?? .999);const i=s.forgingItems[0];assert.equal(i.epoch,epoch);
  if(i.slot==='weapon'){assert.equal(WEAPONS[i.weaponId].epoch,epoch);assert.equal(i.name,WEAPONS[i.weaponId].name);}else if(epoch===2){assert.match(i.name,/^(Bronze Warrior|Temple Guard|Legionary) /);assert.ok(i.quality<=2);}else assert.match(i.name,/^(Hunter|Bone) /);
 }
});
test('existing incorrectly labelled Ancient gear keeps stats and gets Ancient identity',()=>{
 const s=freshGame();s.coins=713;s.equipment.weapon={slot:'weapon',weaponId:'spear',name:'Bone Spear',quality:1,epoch:2,itemLevel:5,value:24,sale:1};s.equipment.chest={slot:'chest',name:'Hunter Leather Vest',quality:0,epoch:2,itemLevel:5,value:180,sale:1};s.pending={slot:'weapon',weaponId:'slingshot',name:'Hunter Slingshot',quality:0,epoch:2,itemLevel:5,value:19,sale:1};
 const old=stats(s),loaded=restore(JSON.stringify(s));assert.equal(loaded.coins,713);assert.deepEqual(stats(loaded),old);assert.equal(loaded.equipment.weapon.weaponId,'battle-spear');assert.equal(loaded.equipment.chest.name,'Bronze Warrior Chestplate');assert.equal(loaded.pending.weaponId,'short-bow');assert.equal(loaded.pending.value,19);assert.equal(loaded.pending.epoch,2);assert.deepEqual(restore(JSON.stringify(loaded)),loaded);
});


test('all ten completed epochs use their own weapons and displayed forge chances match the roll',()=>{
 for(let anvil=1;anvil<=ANVILS.length;anvil++){
  const chances=FORGE_CHANCES[anvil-1];assert.ok(Math.abs(chances.reduce((a,b)=>a+b,0)-100)<1e-8);chances.forEach((chance,i)=>assert.ok(Math.abs(chance-ANVILS[anvil-1].chances[i])<1e-8));
  let before=0;
  for(let epoch=1;epoch<=10;epoch++){const chance=chances[epoch-1];if(chance){const s=freshGame();s.anvilLevel=anvil;s.hammers=1;const rolls=[0,(before+chance/2)/100,0,.999];forge(s,()=>rolls.shift() ?? .999);const item=s.forgingItems[0];assert.equal(item.epoch,epoch);assert.equal(WEAPONS[item.weaponId].epoch,epoch);}before+=chance;}
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


test('hero power follows equipment stats and affixes rather than epoch or item level',()=>{
 const s=freshGame();assert.equal(heroPower(s),4);
 s.equipment.weapon={...candidate('weapon',343),epoch:2,itemLevel:1};
 s.equipment.chest={...candidate('chest',2780),epoch:2,itemLevel:1};
 assert.equal(heroPower(s),625);
 s.equipment.weapon.epoch=3;s.equipment.weapon.itemLevel=100;
 assert.equal(heroPower(s),625);
 for(const [type,value,expected] of [['damage',10,660],['health',10,653],['speed',5,642],['double',5,638],['crit',3,630],['critDamage',15,625],['regen',.5,639],['block',3,633],['lifesteal',3,630]]){
  s.equipment.weapon.affix={type,value};assert.equal(heroPower(s),expected,type);
 }
 delete s.equipment.weapon.affix;
 s.equipment.weapon.reforgeOffer={type:'damage',value:10};assert.equal(heroPower(s),625);
 resolveReforge(s,'weapon',true);assert.equal(heroPower(s),660);
 s.hp=1;assert.equal(heroPower(s),660);
 assert.equal(heroPower(restore(JSON.stringify(s))),660);
 s.equipment.weapon=null;assert.equal(heroPower(s),282);
});

test('hero power keeps permanent bonuses but stays stable when combat potions start and expire',()=>{
 const s=freshGame(1000);
 s.equipment.weapon={...candidate('weapon',100),affix:{type:'damage',value:10}};
 s.equipment.chest={...candidate('chest',1000),affix:{type:'health',value:10}};
 s.workshop.slots.weapon=10;s.workshop.slots.chest=20;s.mount={owned:true,equipped:true};
 const permanent=stats(s);assert.deepEqual(permanent,{hp:1610,damage:148});assert.equal(heroPower(s),309);
 s.hp=permanent.hp;s.alchemy.potions[0]=1;s.alchemy.potions[5]=1;
 assert.ok(drinkPotion(s,'damage',0,1000));assert.equal(heroPower(s),309);
 assert.ok(drinkPotion(s,'health',0,1000));assert.deepEqual(stats(s),{hp:1771,damage:155});
 const active=structuredClone(s);assert.equal(heroPower(s),309);assert.deepEqual(s,active);
 s.alchemy.active.damage.remaining=.01;s.alchemy.active.health.remaining=.01;
 const events=step(s,1/30,()=>.999,1000);
 assert.ok(events.some(e=>e.type==='potionExpired'));
 assert.deepEqual(stats(s),permanent);assert.equal(heroPower(s),309);
});

test('all thirteen Medieval weapons forge, equip and retain identity and integer damage after reload',()=>{
 const ids=Object.keys(WEAPONS).filter(id=>WEAPONS[id].epoch===3);assert.equal(ids.length,13);
 const anvil=FORGE_CHANCES.findIndex(row=>row[2]>0)+1,c=FORGE_CHANCES[anvil-1];
 for(const [index,id] of ids.entries())for(const level of [1,100]){
  const s=freshGame();s.hammers=1;s.anvilLevel=anvil;s.mastery[2].level=level;
  const rolls=[0,(c[0]+c[1]+c[2]/2)/100,.999,(index+.5)/ids.length];assert.equal(forge(s,()=>rolls.shift() ?? .999),true);
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
   assert.equal(forge(s,()=>rolls.shift() ?? .999),true);const item=s.forgingItems[0];assert.equal(item.weaponId,id);assert.equal(item.epoch,epoch);assert.equal(item.itemLevel,level);
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
   assert.equal(forge(s,()=>rolls.shift() ?? .999),true);const item=s.forgingItems[0];
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
 assert.ok(advance(s,1.2).some(e=>e.type==='restart'));assert.equal(s.level,3);assert.equal(s.highest,4);assert.equal(s.encounter,0);assert.equal(s.hp,stats(s).hp);assert.notEqual(s.enemies,old);assert.equal(s.coins,77);assert.ok(s.pending);
 const boss=wave(1,9);boss.enemies.forEach(e=>{e.hp=e.boss?1:0;e.damage=0;if(e.boss)e.x=boss.heroX+.165;});
 assert.ok(advance(boss,1.3).some(e=>e.type==='kill'));assert.equal(boss.phase,'victory');const start=boss.heroX;
 step(boss,.4);assert.ok(boss.heroX>start);assert.equal(boss.level,1);
 assert.ok(advance(boss,.5).some(e=>e.type==='level'&&e.level===2));assert.equal(boss.encounter,0);assert.equal(boss.highest,2);
});


test('affixes share inclusive ranges',()=>{
 for(const [n,a] of AFFIXES.entries())for(const [roll,value] of [[0,a.min],[1.1/(Math.round((a.max-a.min)/.1)+1),Number((a.min+.1).toFixed(1))],[.999,a.max]]){
  const rolls=[(n+.1)/AFFIXES.length,roll];assert.deepEqual(rollAffix(()=>rolls.shift()),{type:a.id,value});
 }
});

test('forged weapon affix chance grows with pre-forge epoch mastery, not rolled item level',()=>{
 for(const [level,chance] of [[1,.0005],[20,.01],[50,.025],[100,.05]])for(const success of [true,false]){
  const s=freshGame();s.hammers=1;s.mastery[0]={level,xp:level===100?0:Math.ceil((level+4)/2)-1};
  const rolls=[0,0,0,0,chance-(success?.000001:0),.999,.999];
  assert.equal(forge(s,()=>rolls.shift()),true);
  assert.equal(s.forgingItems[0].itemLevel,1);
  assert.deepEqual(s.forgingItems[0].affix,success?{type:'double',value:10}:undefined);
 }
 const s=freshGame();s.hammers=1;s.anvilLevel=2;s.mastery[0].level=100;
 const rolls=[0,.99999,0,0,.001];forge(s,()=>rolls.shift());
 assert.equal(s.forgingItems[0].epoch,2);assert.equal(s.forgingItems[0].affix,undefined);
 const armor=freshGame();armor.hammers=1;armor.mastery[0].level=100;let calls=0;
 forge(armor,()=>calls++===0?.1:0);
 assert.equal(armor.forgingItems[0].slot,'helmet');assert.equal(armor.forgingItems[0].affix,undefined);assert.equal(calls,4);
});

test('batch rolls each weapon affix once and preserves a prehistoric affix through forge reload and equip',()=>{
 const s=freshGame(1000);s.hammers=2;s.coins=713;s.selectedBatch=2;s.mastery[0].level=100;
 const rolls=[0,0,.999,0,0,0,.999,0,0,0,0,.999];
 assert.equal(forge(s,()=>rolls.shift()),true);assert.equal(rolls.length,0);
 assert.equal(s.hammers,0);assert.equal(s.coins,713);
 assert.deepEqual(s.forgingItems.map(i=>i.affix),[{type:'damage',value:10},undefined]);
 const loaded=restore(JSON.stringify(s),1000);assert.deepEqual(loaded.forgingItems,s.forgingItems);
 finishForge(loaded);assert.equal(equip(loaded),true);
 assert.deepEqual(loaded.equipment.weapon.affix,{type:'damage',value:10});assert.equal(stats(loaded).damage,15);
 const again=restore(JSON.stringify(loaded),1000);assert.deepEqual(again.equipment,loaded.equipment);assert.equal(again.coins,713);
});

test('reforge pays once, persists the choice, preserves rings and caps the item price',()=>{
 const s=freshGame();s.coins=10000;
 for(const slot of ['ring1','ring2'])s.equipment[slot]={...candidate(slot,10),epoch:2,affix:{type:'speed',value:4}};
 const other=restore(JSON.stringify(s)).equipment.ring2;
 assert.equal(reforgeCost(s.equipment.ring1),400);
 assert.equal(reforge(s,'ring1',()=>0),true);assert.equal(s.coins,9600);
 s.coins=439;const unpaid=structuredClone(s);assert.equal(reforge(s,'ring1'),false);assert.deepEqual(s,unpaid);s.coins=9600;
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.equipment.ring1.reforgeOffer,{type:'damage',value:3});
 assert.equal(resolveReforge(loaded,'ring1',false),true);assert.equal(loaded.equipment.ring1.affix.type,'speed');
 assert.equal(reforgeCost(loaded.equipment.ring1),440);
 assert.equal(reforge(loaded,'ring1',()=>0),true);assert.equal(resolveReforge(loaded,'ring1',true),true);
 assert.equal(loaded.equipment.ring1.affix.type,'damage');assert.deepEqual(loaded.equipment.ring2,other);
 loaded.equipment.ring1.reforges=10;assert.equal(reforgeCost(loaded.equipment.ring1),800);
 loaded.equipment.ring1.epoch=10;assert.equal(reforgeCost(loaded.equipment.ring1),200000);
 const before=structuredClone(loaded);assert.equal(reforge(loaded,'ring1'),false);assert.deepEqual(loaded,before);
 loaded.equipment.ring1.epoch=1;assert.equal(reforge(loaded,'ring1'),false);
});

test('health reforge keeps HP fraction and additive bonuses control damage and cadence',()=>{
 const s=freshGame();s.coins=10000;
 s.equipment.chest={...candidate('chest',80),epoch:2,affix:{type:'health',value:10}};s.hp=55;
 s.equipment.chest.reforgeOffer={type:'speed',value:5};resolveReforge(s,'chest',true);
 assert.equal(stats(s).hp,100);assert.equal(s.hp,50);assert.equal(attackInterval(s),2/1.05);
 s.equipment.weapon={...candidate('weapon',98),epoch:2,affix:{type:'damage',value:10}};
 s.equipment.gloves={...candidate('gloves',100),epoch:2,affix:{type:'damage',value:10}};
 assert.equal(stats(s).damage,240);
});

test('double strike hits once more at faster cadence without delaying the regular hit or chaining',()=>{
 const s=freshGame();s.equipment.gloves={...candidate('gloves',2),epoch:2,affix:{type:'double',value:5}};
 s.enemies[0].hp=s.enemies[0].maxHp=10000;s.enemies[0].damage=0;s.enemies[0].x=s.heroX+.115;
 const hits=[];
 for(let n=0;n<125;n++)for(const e of step(s,1/30,()=>0))if(e.type==='heroHit')hits.push({time:n/30,extra:e.extra});
 assert.equal(hits.length,4);assert.deepEqual(hits.map(e=>e.extra),[false,true,false,true]);
 assert.ok(hits[1].time-hits[0].time<.4);assert.ok(Math.abs(hits[2].time-hits[0].time-2)<.04);
});

test('regen uses max HP per second; block prevents damage; lifesteal uses actual damage',()=>{
 const s=freshGame();s.equipment.chest={...candidate('chest',80),epoch:2,affix:{type:'regen',value:.5}};s.hp=50;
 s.enemies[0].damage=0;s.enemies[0].x=10;step(s,1,()=>.999);assert.equal(s.hp,50.5);
 s.equipment.chest.affix={type:'block',value:3};s.enemies[0].x=s.heroX+.115;s.enemies[0].damage=10;s.enemies[0].engaged=true;s.enemies[0].clock=1.09;
 const events=step(s,.02,()=>0);assert.equal(s.hp,50.5);assert.ok(events.some(e=>e.blocked));
 s.equipment.chest.affix={type:'lifesteal',value:3};s.equipment.weapon=candidate('weapon',1000);s.enemies[0].hp=2;s.heroClock=2;
 const before=s.hp;const heals=step(s,.01,()=>.999);assert.ok(Math.abs(s.hp-before-.06)<1e-8);
 const heal=heals.find(e=>e.type==='heroRegen'&&e.source==='lifesteal');assert.ok(heal);assert.ok(Math.abs(heal.value-.06)<1e-8);
});


test('bulk actions do not discard different or stronger affixes based only on base stats',()=>{
 const s=freshGame();s.equipment.chest={...candidate('chest',100),epoch:2,affix:{type:'health',value:10}};
 s.pending={...candidate('chest',110),epoch:2,affix:{type:'speed',value:5}};
 assert.equal(equipStronger(s),0);s.pending.value=90;assert.equal(sellWeaker(s).count,0);
 s.pending.affix={type:'health',value:10};assert.equal(sellWeaker(s).count,0);
 s.keepAffixes=s.keepAffixes.filter(id=>id!=='health');assert.equal(sellWeaker(s).count,1);
});

test('keep-affix preferences default safely and survive reload without changing reforge stops',()=>{
 const s=freshGame();s.reforgeStop=['crit'];s.coins=713;delete s.keepAffixes;
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.keepAffixes,AFFIXES.map(a=>a.id));
 assert.equal(loaded.coins,713);assert.deepEqual(loaded.reforgeStop,['crit']);
 loaded.keepAffixes=[];assert.deepEqual(restore(JSON.stringify(loaded)).keepAffixes,[]);
 loaded.keepAffixes=['speed','unknown','speed','damage'];
 assert.deepEqual(restore(JSON.stringify(loaded)).keepAffixes,['speed','damage']);
});

test('auto epoch and weapon filters override kept affixes for a paid batch after reload',()=>{
 for(const filter of ['epoch','weapon']) {
  const s=freshGame();s.keepAffixes=['speed'];s.autoSellEpochs=filter==='epoch'?[1]:[];s.autoWeaponFilter=filter==='weapon'?'melee':'any';
  s.phase='dead';s.phaseTime=100;s.forgingAuto=true;s.forging=.01;
  const weapon={...candidate('weapon',2),weaponId:'slingshot',epoch:1,itemLevel:1};
  s.pending=candidate('helmet',1);
  s.forgingItems=[{...weapon,affix:{type:'speed',value:1}},{...weapon,affix:{type:'damage',value:3}},{...weapon}];
  const loaded=restore(JSON.stringify(s));const events=step(loaded,.1);
  assert.equal(events.find(e=>e.type==='forged').soldCount,3);assert.equal(loaded.coins,3);
  assert.equal(loaded.pending.slot,'helmet');assert.equal(loaded.results.length,0);
  step(loaded,.1);assert.equal(loaded.coins,3);
 }
});


test('reroll replaces only the offer, charges the next price, and keeps equipped affix',()=>{
 const s=freshGame();s.coins=1000;s.equipment.ring1={...candidate('ring1',10),epoch:2,affix:{type:'speed',value:4}};
 assert.equal(reforge(s,'ring1',()=>0),true);assert.equal(s.coins,600);
 assert.equal(reforge(s,'ring1',()=>.999),true);assert.equal(s.coins,160);
 assert.deepEqual(s.equipment.ring1.affix,{type:'speed',value:4});
 assert.deepEqual(s.equipment.ring1.reforgeOffer,{type:'double',value:10});
 assert.equal(reforgeCost(s.equipment.ring1),480);
 const before=structuredClone(s);assert.equal(reforge(s,'ring1'),false);assert.deepEqual(s,before);
 assert.equal(resolveReforge(s,'ring1',false),true);assert.deepEqual(s.equipment.ring1.affix,{type:'speed',value:4});assert.equal(s.coins,160);
});


test('stop filter persists, blocks matched offers without spending, and Keep releases the button',()=>{
 const s=freshGame();s.coins=3000;s.equipment.ring1={...candidate('ring1',10),epoch:2,affix:{type:'speed',value:4}};
 s.reforgeStop=['damage','double'];assert.equal(reforge(s,'ring1',()=>0),true);
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.reforgeStop,['damage','double']);
 const before=structuredClone(loaded);assert.equal(reforge(loaded,'ring1',()=>.999),false);assert.deepEqual(loaded,before);
 resolveReforge(loaded,'ring1',false);assert.equal(reforge(loaded,'ring1',()=>.999),true);
 assert.equal(loaded.coins,2160);assert.equal(reforge(loaded,'ring1'),false);
 loaded.reforgeStop=[];assert.equal(reforge(loaded,'ring1',()=>0),true);
 const old=freshGame();delete old.reforgeStop;assert.deepEqual(restore(JSON.stringify(old)).reforgeStop,[]);
});


import {settleMine, collectMine, upgradeMine, sellOre, mineLevel, mineResource} from './game.mjs';
test('mine: preserves minute remainder and caps production time',()=>{
 const s=freshGame(1000);assert.equal(settleMine(s,60000,()=>0),0);
 assert.equal(settleMine(s,91000,()=>0),1);assert.equal(s.mine.lastAt,61000);
 assert.deepEqual(collectMine(s,91000),[1,0,0]);assert.deepEqual(collectMine(s,91000),[0,0,0]);
 settleMine(s,1000+10*3600000,()=>0);assert.equal(s.mine.pending[0],240);
 collectMine(s,1000+10*3600000);assert.equal(settleMine(s,1000+10*3600000+59999,()=>0),0);
});
test('mine: one upgrade payment, rate changes mid-buffer, full buffer still finishes timer',()=>{
 const s=freshGame(0);s.mine.level=10;s.mine.ore=[10000,10000,10000];s.mine.pending=[0,0,0];
 assert.equal(upgradeMine(s,0),true);assert.equal(upgradeMine(s,0),false);
 const minutes=s.mine.upgradeEndsAt/60000;settleMine(s,10*3600000,()=>0);
 assert.equal(s.mine.level,11);assert.equal(s.mine.pending.reduce((a,b)=>a+b),Math.floor(((minutes-1)*19+(240-minutes+1)*20)/10));
 assert.equal(s.mine.bufferMinutes,240);assert.equal(s.mine.upgradeEndsAt,0);
 collectMine(s,10*3600000);assert.equal(settleMine(s,10*3600000+60000,()=>0),2);
});
test('mine: recipes avoid rare ore and progression continues beyond initial catalog',()=>{
 for(let l=1;l<=1000;l++){
  const row=mineLevel(l);assert.ok(Math.abs(row.chances.reduce((a,b)=>a+b)-100)<1e-9);
  row.cost.forEach((n,i)=>{if(n)assert.ok(row.chances[i]>=20);});assert.ok(row.minutes<=240);
 }
 assert.deepEqual(mineLevel(1).cost,[5]);assert.equal(mineResource(20).price,221);
 const s=freshGame(0);s.mine.level=101;s.mine.ore=Array(21).fill(0);s.mine.pending=Array(21).fill(0);
 assert.equal(settleMine(s,60000,()=>.999),11);assert.equal(restore(JSON.stringify(s),60000).mine.level,101);
});
test('mine: sale spends exact stock and adds shared gold',()=>{
 const s=freshGame(0);s.mine.level=11;s.mine.ore=[0,0,3];s.mine.pending=[0,0,0];
 assert.equal(sellOre(s,2,2),true);assert.equal(s.coins,12);assert.equal(s.mine.ore[2],1);
 assert.equal(sellOre(s,2,2),false);assert.equal(sellOre(s,2,-1),false);assert.equal(sellOre(s,2,.5),false);
});
test('mine: reset old mine only once and preserve new inventory and hero',()=>{
 const s=freshGame(1000);s.coins=1234;s.mine.ore=[3,0,0];s.mine.pending=[2,0,0];s.mine.bufferMinutes=2;
 assert.deepEqual(restore(JSON.stringify(s),1000).mine,s.mine);
 delete s.mine.version;const old=restore(JSON.stringify(s),9000);assert.equal(old.coins,1234);assert.equal(old.mine.lastAt,9000);assert.equal(old.mine.level,1);assert.deepEqual(old.mine.ore,[0,0,0]);
 assert.deepEqual(restore(JSON.stringify(old),10000).mine,old.mine);
});

test('paid enchanting migration clears old affixes once across all item locations',()=>{
 const s=freshGame();delete s.affixVersion;s.coins=5000;
 const make=slot=>({...candidate(slot,10),epoch:2,affix:{type:'health',value:10},reforgeOffer:{type:'speed',value:3},reforges:4});
 s.equipment.chest=make('chest');s.pending=make('boots');s.results=[make('helmet')];s.forgingItems=[make('gloves')];s.forging=1;
 s.hp=stats(s).hp/2;
 const loaded=restore(JSON.stringify(s));
 for(const item of [loaded.equipment.chest,loaded.pending,...loaded.results,...loaded.forgingItems]){
  assert.ok(item);assert.equal(item.affix,undefined);assert.equal(item.reforgeOffer,undefined);assert.equal(item.reforges,undefined);
 }
 assert.equal(loaded.coins,5000);assert.equal(loaded.hp,stats(loaded).hp/2);
 assert.equal(reforge(loaded,'chest',()=>0),true);assert.equal(loaded.coins,4600);
 assert.equal(resolveReforge(loaded,'chest',true),true);
 const again=restore(JSON.stringify(loaded));assert.deepEqual(again.equipment.chest.affix,{type:'damage',value:3});assert.equal(again.equipment.chest.reforges,1);
});

test('mine: early coal, continuous rate and common-resource upgrade costs',()=>{
 const chances=[[100],[95,5],[85,15],[70,30],[50,50]];
 for(let l=1;l<=5;l++){const expected=[...chances[l-1]];expected[expected.indexOf(Math.max(...expected))]-=.02;expected.push(.01,.01);assert.deepEqual(mineLevel(l).chances,expected);assert.equal(mineLevel(l).rate,(l+9)/10);}
 assert.equal(mineLevel(6).chances[2],1);
 for(let l=1;l<=3;l++)assert.equal(mineLevel(l).cost[1]||0,0);
 assert.ok(mineLevel(4).cost[1]>0);
});
test('mine: tenths survive collection and reload, offline equals online and overflow is discarded',()=>{
 const s=freshGame(0);s.mine.level=2;s.mine.ore=[0,0];s.mine.pending=[0,0];
 const offline=structuredClone(s);settleMine(offline,20*60000,()=>0);
 let online=s,total=0;
 for(let minute=1;minute<=20;minute++){
  settleMine(online,minute*60000,()=>0);total+=collectMine(online,minute*60000).reduce((a,b)=>a+b);
  online=restore(JSON.stringify(online),minute*60000);
 }
 assert.equal(total,22);assert.equal(offline.mine.pending.reduce((a,b)=>a+b),22);assert.equal(online.mine.remainder,0);
 settleMine(offline,1000*60000,()=>0);assert.equal(offline.mine.pending.reduce((a,b)=>a+b),264);
 collectMine(offline,1000*60000);assert.equal(settleMine(offline,1001*60000,()=>0),1);assert.equal(offline.mine.remainder,1);
 const old=freshGame(0);old.mine.level=6;old.mine.ore=[12,8];old.mine.pending=[2,1];delete old.mine.remainder;
 const loaded=restore(JSON.stringify(old),0);assert.equal(loaded.mine.level,6);assert.deepEqual(loaded.mine.ore,[12,8,0,0,0]);assert.equal(loaded.mine.remainder,0);
});

test('mine: two future resources drop rarely without changing deposit or recipes',()=>{
 const row=mineLevel(1);assert.deepEqual(row.chances,[99.98,.01,.01]);assert.equal(row.newest,0);assert.deepEqual(row.cost,[5]);
 const s=freshGame(0);settleMine(s,60000,()=>.99985);assert.equal(s.mine.pending[1],1);
 settleMine(s,120000,()=>.99995);assert.equal(s.mine.pending[2],1);
 const loaded=restore(JSON.stringify(s),120000);assert.deepEqual(loaded.mine.pending,[0,1,1]);
 assert.equal(mineLevel(2).newest,1);assert.deepEqual(mineLevel(2).chances,[94.98,5,.01,.01]);
});


test('expanded anvil keeps saved progress and running timers, caps old high levels',()=>{
 const s=freshGame(1000);s.anvilLevel=11;s.coins=54321;s.hammers=87;s.upgradeEndsAt=999999;
 const loaded=restore(JSON.stringify(s),1000);
 assert.equal(loaded.anvilLevel,11);assert.equal(loaded.upgradeEndsAt,999999);
 assert.equal(loaded.coins,54321);assert.equal(loaded.hammers,87);
 assert.equal(finishUpgrade(loaded,999998),false);assert.equal(finishUpgrade(loaded,999999),true);assert.equal(loaded.anvilLevel,12);
 s.anvilLevel=79;const capped=restore(JSON.stringify(s),1000);
 assert.equal(capped.anvilLevel,60);assert.equal(capped.upgradeEndsAt,0);assert.equal(capped.coins,54321);
 assert.equal(upgradeAnvil(capped,1000),false);assert.equal(forge(capped,()=>.99999),true);
 s.anvilLevel=59;const last=restore(JSON.stringify(s),1000);finishUpgrade(last,999999);assert.equal(last.anvilLevel,60);assert.equal(upgradeAnvil(last,999999),false);
});

test('sixty-level forge has three-day timers, rising odds and agreed price anchors',()=>{
 assert.equal(ANVILS.length,60);assert.equal(Math.max(...ANVILS.map(r=>r.minutes)),4320);
 assert.deepEqual(ANVILS[59].chances,[0,0,0,0,0,0,0,20,75,5]);
 assert.deepEqual(ANVILS.slice(0,5).map(row=>row.coins),[0,130,190,250,490]);
 assert.deepEqual([9,19,29,39,49,59].map(i=>ANVILS[i].coins),[2730,16220,66990,1000000,5000000,25000000]);
 for(let i=0;i<60;i++){
  assert.ok(Math.abs(ANVILS[i].chances.reduce((a,b)=>a+b)-100)<1e-8);
  if(i)for(let e=1;e<10;e++)assert.ok(ANVILS[i].chances.slice(e).reduce((a,b)=>a+b)>=ANVILS[i-1].chances.slice(e).reduce((a,b)=>a+b)-1e-8);
 }
 for(let epoch=2;epoch<10;epoch++){
  const index=3+6*(epoch-2);assert.equal(ANVILS[index].chances[epoch],.02);assert.equal(ANVILS[index].chances[epoch-1],20);
 }
 const old=freshGame(1000);old.anvilLevel=40;old.coins=1177440;
 const loaded=restore(JSON.stringify(old),1000);assert.equal(loaded.anvilLevel,40);assert.equal(upgradeAnvil(loaded,1000),true);
 assert.equal(loaded.coins,0);assert.equal(loaded.upgradeEndsAt,1000+2232*60000);
 const last=freshGame(1000);last.anvilLevel=59;last.coins=24999999;
 assert.equal(upgradeAnvil(last,1000),false);assert.equal(last.coins,24999999);assert.equal(last.upgradeEndsAt,0);
 last.coins++;assert.equal(upgradeAnvil(last,1000),true);assert.equal(last.coins,0);assert.equal(last.upgradeEndsAt,1000+4320*60000);
});

test('Ancient onboarding chances rise without reducing later rare tiers',()=>{
 const chances=[5,15,20,30,40,50,60,70,79.98,69.95,59.9,49.75];
 chances.forEach((value,i)=>assert.equal(ANVILS[i+1].chances[1],value));
 for(let i=1;i<ANVILS.length;i++)assert.ok(ANVILS[i].chances[0]<=ANVILS[i-1].chances[0]);
 const old=freshGame();old.hammers=5;old.coins=100;assert.equal(restore(JSON.stringify(old)).hammers,5);
});

test('every companion costs 500, duplicate and failed hires do not spend coins',()=>{
 const s=freshGame();s.coins=499;
 assert.equal(hireCompanion(s,'archer'),false);assert.equal(s.coins,499);
 s.coins=1500;
 for(const id of ['archer','druid','turtle']){
   const before=s.coins;
   assert.equal(hireCompanion(s,id),true);assert.equal(s.coins,before-500);
   assert.equal(hireCompanion(s,id),false);assert.equal(s.coins,before-500);
 }
 assert.equal(s.coins,0);assert.equal(hireCompanion(s,'unknown'),false);
});
test('purchase joins immediately; switching owned companions waits for next wave and survives reload',()=>{
 const s=freshGame();s.coins=1500;const enemies=structuredClone(s.enemies),hp=s.hp,phase=s.phase;
 hireCompanion(s,'archer');assert.equal(s.companion.kind,'archer');assert.equal(s.selectedCompanion,'archer');
 assert.equal(s.companion.x,s.heroX-.13);assert.deepEqual(s.enemies,enemies);assert.equal(s.hp,hp);assert.equal(s.phase,phase);
 hireCompanion(s,'druid');assert.equal(s.companion.kind,'druid');assert.equal(s.selectedCompanion,'druid');
 selectCompanion(s,'archer');assert.equal(s.companion.kind,'druid');
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.hiredCompanions,['archer','druid']);
 assert.equal(loaded.selectedCompanion,'archer');assert.equal(loaded.companion.kind,'druid');
 loaded.phase='victory';loaded.phaseTime=0;step(loaded,1/30);
 assert.equal(loaded.companion.kind,'archer');assert.equal(loaded.coins,500);
 hireCompanion(loaded,'turtle');assert.equal(loaded.companion.kind,'turtle');assert.equal(loaded.companion.hp,30);
 loaded.companion.hp=7;const before=structuredClone(loaded);assert.equal(hireCompanion(loaded,'turtle'),false);assert.deepEqual(loaded,before);
});


test('runes drop independently at 0.1 percent from any enemy and survive reload',()=>{
 for(const kind of ['warrior','archer','healer','boss'])for(const [roll,amount] of [[0,1],[.000999,1],[.001,0],[.9,0]]){
  const s=wave(10,9);for(const e of s.enemies)e.x=s.heroX+5+e.id;const target=s.enemies.find(e=>e.kind===kind);target.hp=1;target.x=s.heroX+.115;
  const rolls=[.9,.9,roll];const events=step(s,1.3,()=>rolls.shift()??.9);
  assert.equal(s.runes,amount);assert.equal(events.find(e=>e.type==='kill').runes,amount);
  const kill=events.find(e=>e.type==='kill');
  assert.deepEqual(s.battleStats,{bosses:kind==='boss'?1:0,maxHit:2,maxCrit:0,coins:kill.value,hammers:kill.hammers,runes:amount});
  assert.deepEqual(restore(JSON.stringify(s)).battleStats,s.battleStats);
  step(s,.01,()=>.9);assert.equal(s.runes,amount);assert.equal(restore(JSON.stringify(s)).runes,amount);
 }
 const old=freshGame();delete old.runes;old.coins=123;const loaded=restore(JSON.stringify(old));assert.equal(loaded.runes,0);assert.equal(loaded.coins,123);
});

test('newly forged item sale prices are one through ten by epoch',()=>{
 for(let epoch=1;epoch<=10;epoch++){
  const s=freshGame();s.hammers=1;s.anvilLevel=FORGE_CHANCES.findIndex(row=>row[epoch-1]>0)+1;
  const chances=FORGE_CHANCES[s.anvilLevel-1],roll=(chances.slice(0,epoch-1).reduce((a,b)=>a+b,0)+chances[epoch-1]/2)/100;
  const rng=[0,roll,0,0];forge(s,()=>rng.shift()??.9);assert.equal(s.forgingItems[0].sale,epoch);
 }
});


test('affix transfer charges destination epoch, replaces its affix and preserves HP fraction',()=>{
 for(const epoch of [2,3,10]){
  const s=freshGame();s.runes=100;
  s.equipment.chest={...candidate('chest',80),epoch:2,affix:{type:'health',value:10}};
  s.hp=stats(s).hp/2;
  s.pending={...candidate('chest',180),epoch,affix:{type:'speed',value:3}};
  const old=s.equipment.chest;
  assert.equal(equip(s,'chest',true),true);assert.equal(s.runes,100-epoch*10);
  assert.deepEqual(s.equipment.chest.affix,{type:'health',value:10});assert.notEqual(s.equipment.chest.affix,old.affix);
  assert.equal(s.hp/stats(s).hp,.5);assert.equal(s.pending,null);
  const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.equipment.chest.affix,s.equipment.chest.affix);assert.equal(loaded.runes,s.runes);
  assert.equal(equip(s,'chest',true),false);assert.equal(s.runes,100-epoch*10);
 }
});

test('invalid or unaffordable transfer leaves currency, equipment and queue untouched',()=>{
 for(const reason of ['poor','empty','prehistoric','wrongSlot']){
  const s=freshGame();s.runes=reason==='poor'?19:100;
  s.equipment.helmet={...candidate('helmet',5),epoch:2,...(reason==='empty'?{}:{affix:{type:'regen',value:.5}})};
  s.pending={...candidate('helmet',10),epoch:reason==='prehistoric'?1:2};s.results=[candidate('boots',5)];
  const before=structuredClone(s);assert.equal(equip(s,reason==='wrongSlot'?'boots':'helmet',true),false);assert.deepEqual(s,before);
 }
});

test('ring transfer uses only the chosen ring and normal equip remains free',()=>{
 const s=freshGame();s.runes=80;
 s.equipment.ring1={...candidate('ring1',5),epoch:2,affix:{type:'crit',value:3}};
 s.equipment.ring2={...candidate('ring2',6),epoch:2,affix:{type:'speed',value:5}};
 const first=structuredClone(s.equipment.ring1);
 s.pending={...candidate('ring',7),epoch:4};
 assert.equal(equip(s,'ring2',true),true);assert.equal(s.runes,40);assert.deepEqual(s.equipment.ring1,first);
 assert.deepEqual(s.equipment.ring2.affix,{type:'speed',value:5});
 s.pending={...candidate('ring',8),epoch:4};assert.equal(equip(s,'ring2'),true);assert.equal(s.runes,40);assert.equal(s.equipment.ring2.affix,undefined);
});


test('critical hits require an affix and cap at fifty percent',()=>{
 for(const [chance,roll,expected] of [[0,0,false],[3,.029,true],[3,.03,false],[60,.499,true],[60,.5,false]]){
  const s=freshGame();s.equipment.weapon={...candidate('weapon',10),affix:{type:'crit',value:chance}};
  const target=s.enemies[0];target.hp=target.maxHp=1000;target.x=s.heroX+.115;
  const hit=step(s,1.3,()=>roll).find(e=>e.type==='heroHit');
  assert.equal(hit.critical,expected);assert.equal(hit.value,expected?18:12);
  assert.equal(s.battleStats.maxHit,hit.value);assert.equal(s.battleStats.maxCrit,expected?hit.value:0);
 }
});

test('legacy battle counters survive and new statistics start at zero',()=>{
 const s=freshGame();delete s.battleStats;s.kills=45;s.deaths=3;s.coins=800;
 const loaded=restore(JSON.stringify(s));
 assert.equal(loaded.kills,45);assert.equal(loaded.deaths,3);assert.equal(loaded.coins,800);
 assert.deepEqual(loaded.battleStats,{bosses:0,maxHit:0,maxCrit:0,coins:0,hammers:0,runes:0});
 assert.deepEqual(freshGame().battleStats,loaded.battleStats);
});

test('ordinary coin rewards use the biome table directly and refresh saved enemies',async()=>{
 const {COMBAT}=await import('./balance.mjs');
 assert.deepEqual(COMBAT.slice(0,20).map(row=>row.monster_coins),[4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10]);
 assert.deepEqual(Array.from({length:10},(_,i)=>[enemyFor(i*20+1).reward,enemyFor(i*20+20).reward]),
   [[4,10],[15,18],[27,33],[49,60],[89,108],[162,195],[293,354],[531,642],[963,1163],[1744,2108]]);
 for(let level=1;level<=MAX_LEVEL;level++){
  for(const kind of ['warrior','archer','healer'])assert.equal(enemyFor(level,kind).reward,COMBAT[level-1].monster_coins);
  assert.equal(enemyFor(level,'boss').reward,COMBAT[level-1].boss_coins);
 }
 const s=freshGame();s.enemies[0].reward=2;s.coins=123;
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.enemies[0].reward,4);assert.equal(loaded.coins,123);
 const target=loaded.enemies[0];target.hp=1;target.damage=0;target.x=loaded.heroX+.115;
 const events=step(loaded,1.3,()=>.999);
 assert.equal(events.find(e=>e.type==='kill').value,4);assert.equal(loaded.coins,127);assert.equal(loaded.battleStats.coins,4);
});

test('hard biome curve strengthens the first biome and updates saved enemies without resetting progress',()=>{
 assert.equal(enemyFor(20).maxHp,348);assert.equal(enemyFor(20).damage,9);
 for(const [level,hp,damage] of [[21,8000,400],[40,32000,1200],[41,120000,4000],[60,480000,12000]]){
  assert.equal(enemyFor(level).maxHp,hp);assert.equal(enemyFor(level).damage,damage);
 }
 const s=wave(23,4);s.enemies.forEach(e=>{e.hp=100;e.maxHp=1000;e.damage=1;});s.coins=713;
 const loaded=restore(JSON.stringify(s));assert.equal(loaded.level,23);assert.equal(loaded.encounter,s.encounter);assert.equal(loaded.coins,713);
 for(const e of loaded.enemies){assert.equal(e.hp,100);assert.equal(e.damage,enemyFor(23,e.kind).damage);}
});




test('archer fires each second for fixed level damage independent of hero equipment and affixes',()=>{
 for(const heroDamage of [2,10000]){
  const s=freshGame();s.equipment.weapon=candidate('weapon',heroDamage);s.equipment.weapon.affix={type:'damage',value:10};
  s.archerLevel=2;const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=100000;e.damage=0;
  s.phase='fight';s.targetId=e.id;s.heroClock=-100;
  s.archerTalents={shot:1};s.companion={kind:'archer',x:s.heroX-.13,clock:0,actionAge:1,shot:null};
  const hits=advance(s,3.3).filter(e=>e.type==='companionHit');assert.equal(hits.length,3);assert.ok(hits.every(e=>e.value===7));
 }
});
test('archer banks only one shot while travelling and keeps charge after losing a target',()=>{
 const s=freshGame();s.archerTalents={shot:1};s.companion={kind:'archer',x:s.heroX-.5,clock:.8,actionAge:1,shot:null};s.enemies[0].x=s.heroX+10;
 advance(s,4);assert.equal(s.companion.clock,1);assert.equal(s.companion.shot,null);
 const e=s.enemies[0];e.x=s.heroX+.115;e.hp=100;e.damage=0;s.heroClock=-100;s.phase='fight';s.targetId=e.id;s.companion.x=s.heroX-.13;
 step(s,.01,()=>.999);assert.ok(s.companion.shot);assert.ok(Math.abs(s.companion.clock-.01)<1e-8);
 const events=advance(s,.5);assert.equal(events.filter(e=>e.type==='companionHit').length,1);assert.equal(s.companion.shot,null);
 const charge=s.companion.clock;e.x=s.heroX+10;step(s,.01,()=>.999);assert.ok(s.companion.clock>=charge);
});




test('upgraded turtle joins at its level on next wave and fully blocks final hit',()=>{
 const s=freshGame();s.coins=3000;hireCompanion(s,'turtle');hireCompanion(s,'druid');
 s.turtleTalents={shell:1};s.turtleLevel=2;selectCompanion(s,'turtle');assert.equal(s.companion.kind,'druid');
 s.phase='victory';s.phaseTime=0;step(s,.01,()=>.999);
 assert.equal(s.companion.kind,'turtle');assert.equal(s.companion.hp,50);
 const e=s.enemies[0];e.x=s.heroX+.20;e.hp=1000;e.damage=100;e.clock=1.09;e.engaged=true;
 s.companion.x=s.heroX+.10;s.companion.hp=1;const hp=s.hp;
 const events=step(s,.02,()=>.999);assert.ok(events.some(e=>e.type==='tankDown'));assert.equal(s.companion.hp,0);assert.equal(s.hp,hp);
});
import { upgradeWorkshop, workshopPrice, idleRates, idleCapacity, idleLoot, mineProduction, selectMineStratum } from './game.mjs';

test('workshop slot bonuses persist across equipment replacement, preserve health fraction and do not change item values',()=>{
 const s=freshGame(0);s.equipment.chest=candidate('chest',100);s.hp=60;s.mine.ore[0]=20;
 assert.equal(upgradeWorkshop(s,'chest',0),true);assert.equal(s.mine.ore[0],17);assert.equal(s.equipment.chest.value,100);assert.equal(stats(s).hp,121);assert.equal(s.hp,60.5);
 s.equipment.chest=candidate('chest',200);assert.equal(stats(s).hp,222);
 const saved=restore(JSON.stringify(s),0);assert.equal(saved.workshop.slots.chest,1);assert.equal(stats(saved).hp,222);
 s.workshop.slots.chest=100;const before=structuredClone(s);assert.equal(upgradeWorkshop(s,'chest',0),false);assert.deepEqual(s,before);
});
test('workshop recipes keep prices and triple only the upgraded coin income',()=>{
 const s=freshGame(0);assert.deepEqual(workshopPrice(s,'weapon'),[0,3]);assert.deepEqual(workshopPrice(s,'coins'),[0,15]);assert.deepEqual(workshopPrice(s,'hammers'),[0,30]);assert.equal(workshopPrice(s,'storage'),15000);
 s.workshop.coins=124;assert.deepEqual(workshopPrice(s,'coins'),[19,4944]);s.workshop.coins=125;
 s.workshop.hammers=80;s.workshop.storage=16;assert.deepEqual(idleRates(s),{coins:298,hammers:5});assert.equal(idleCapacity(s),720);
 for(const key of ['coins','hammers','storage'])assert.equal(workshopPrice(s,key),null);
 for(const [level,coins] of [[0,1],[1,1.3],[40,13],[41,14.5],[70,58],[71,61],[100,148],[101,154],[125,298]]){
  s.workshop.coins=level;assert.equal(idleRates(s).coins,coins);
 }
 const initial=freshGame(0),before=structuredClone(initial);assert.equal(upgradeWorkshop(initial,'coins',60000),false);assert.deepEqual(initial,before);
});
test('idle production keeps fractional ore-independent rates through repeated collection and save',()=>{
 let s=freshGame(0);s.workshop.hammers=1;s.workshop.coins=1;
 for(let n=1;n<=20;n++){collectIdleRewards(s,n*60000);s=restore(JSON.stringify(s),n*60000);}
 assert.equal(s.hammers,36);assert.equal(s.coins,26);assert.equal(s.idleStore.hammers,0);assert.equal(s.idleStore.coins,0);
});
test('idle rate purchases preserve old rewards and expanded storage does not grant past overflow',()=>{
 const s=freshGame(0);s.mine.ore[0]=100;s.coins=15000;
 assert.equal(upgradeWorkshop(s,'hammers',120*60000),true);
 assert.deepEqual(idleLoot(s,140*60000),{minutes:140,coins:140,hammers:141});
 assert.equal(upgradeWorkshop(s,'storage',600*60000),true);
 assert.equal(idleLoot(s,600*60000).minutes,240);assert.equal(idleLoot(s,630*60000).minutes,270);assert.equal(idleLoot(s,900*60000).minutes,270);
 const before=idleLoot(s,900*60000);collectIdleRewards(s,900*60000);assert.equal(s.coins,before.coins);assert.equal(s.hammers,15+before.hammers);
});
test('max offline production caps both resources at twelve hours and resets cleanly',()=>{
 const s=freshGame(0);s.workshop.coins=125;s.workshop.hammers=80;s.workshop.storage=16;
 assert.deepEqual(idleLoot(s,24*3600000),{minutes:720,coins:214560,hammers:3600});
 collectIdleRewards(s,24*3600000);assert.equal(s.coins,214560);assert.equal(s.hammers,3615);assert.equal(collectIdleRewards(s,24*3600000),0);
 const fresh=freshGame(0);assert.deepEqual(idleRates(fresh),{coins:1,hammers:1});assert.equal(idleCapacity(fresh),240);
});
test('shared storage expands mining without backfilling full time and survives saving',()=>{
 const s=freshGame(0);s.coins=14999;
 const before=structuredClone(s);
 assert.equal(upgradeWorkshop(s,'storage',600*60000),false);assert.deepEqual(s,before);
 s.coins=15000;assert.equal(upgradeWorkshop(s,'storage',600*60000),true);
 assert.equal(s.coins,0);assert.equal(s.mine.bufferMinutes,240);
 const stored=s.mine.pending.reduce((a,b)=>a+b,0);
 settleMine(s,600*60000);assert.equal(s.mine.pending.reduce((a,b)=>a+b,0),stored);
 settleMine(s,630*60000);assert.equal(s.mine.bufferMinutes,270);
 assert.equal(idleCapacity(s),270);assert.equal(idleLoot(s,630*60000).minutes,270);
 const loaded=restore(JSON.stringify(s),630*60000);
 assert.deepEqual(loaded.mine,s.mine);assert.equal(loaded.workshop.storage,1);
 const loot=collectMine(loaded,630*60000);assert.equal(loaded.mine.bufferMinutes,0);
 assert.deepEqual(loot,s.mine.pending);
 loaded.workshop.storage=16;settleMine(loaded,2000*60000);
 assert.equal(loaded.mine.bufferMinutes,720);
 assert.equal(restore(JSON.stringify(loaded),2000*60000).mine.bufferMinutes,720);
});
test('legacy saves preserve progress and idle time with zero workshop levels',()=>{
 const s=freshGame(0);delete s.workshop;delete s.idleStore;s.coins=123;s.mine.ore[0]=77;
 const loaded=restore(JSON.stringify(s),120000);assert.equal(loaded.coins,123);assert.equal(loaded.mine.ore[0],77);assert.equal(loaded.workshop.slots.weapon,0);assert.equal(idleLoot(loaded,120000).coins,2);
});
test('old strata retain mastered chances and current speed; switching settles previous production first',()=>{
 const s=freshGame(0);s.mine.level=20;
 assert.equal(selectMineStratum(s,0,0),true);assert.equal(mineProduction(s.mine).rate,2.9);assert.deepEqual(mineProduction(s.mine).chances,[100]);
 settleMine(s,60000,()=>.99);assert.equal(s.mine.pending[0],2);
 assert.equal(selectMineStratum(s,1,60000),true);assert.equal(s.mine.pending[0],2);assert.equal(mineProduction(s.mine).chances[1],50);
 settleMine(s,120000,()=>.75);assert.equal(s.mine.pending[1],3);assert.equal(s.mine.pending[0],2);
 assert.equal(restore(JSON.stringify(s),120000).mine.stratum,1);
 const before=structuredClone(s);assert.equal(selectMineStratum(s,99,120000),false);assert.deepEqual(s,before);
 assert.equal(selectMineStratum(s,null,120000),true);assert.equal(mineProduction(s.mine).newest,mineLevel(20).newest);
});

test('auto weapon filter combines with epochs, preserves armor and pays each sale once',()=>{
 for(const filter of ['any','melee','ranged']){
  const s=freshGame(0);s.autoWeaponFilter=filter;s.autoSellEpochs=[2];s.forgingAuto=true;s.forging=.01;
  s.forgingItems=[{...candidate('weapon',2),weaponId:'club',epoch:1,sale:1},{...candidate('weapon',2),weaponId:'slingshot',epoch:1,sale:1},{...candidate('helmet',5),epoch:1,sale:1},{...candidate('weapon',20),weaponId:'battle-spear',epoch:2,sale:2}];
  const loaded=restore(JSON.stringify(s),0);assert.equal(loaded.autoWeaponFilter,filter);
  const events=step(loaded,.02,()=>.999,0),items=[loaded.pending,...loaded.results].filter(Boolean);
  assert.ok(items.some(i=>i.slot==='helmet'));
  assert.equal(items.some(i=>i.weaponId==='club'),filter!=='ranged');assert.equal(items.some(i=>i.weaponId==='slingshot'),filter!=='melee');assert.ok(!items.some(i=>i.epoch===2));
  assert.equal(loaded.coins,filter==='any'?2:3);assert.equal(loaded.autoForgeCoins,loaded.coins);
  assert.equal(events.find(e=>e.type==='forged').soldCount,filter==='any'?1:2);
  step(loaded,.02,()=>.999,0);assert.equal(loaded.coins,filter==='any'?2:3);
 }
});
test('manual forging ignores weapon filter and old saves keep any weapon',()=>{
 const s=freshGame(0);s.autoWeaponFilter='melee';s.forgingAuto=false;s.forging=.01;s.forgingItems=[{...candidate('weapon',2),weaponId:'slingshot',epoch:1,sale:1}];
 step(s,.02,()=>.999,0);assert.equal(s.pending.weaponId,'slingshot');assert.equal(s.coins,0);
 delete s.autoWeaponFilter;assert.equal(restore(JSON.stringify(s),0).autoWeaponFilter,'any');s.autoWeaponFilter='invalid';assert.equal(restore(JSON.stringify(s),0).autoWeaponFilter,'any');
});


test('death retreats across a biome boundary once, survives reload, and never goes below level one',()=>{
 for(const level of [1,21]){
  const s=wave(level,0);s.hp=1;s.phase='fight';s.enemies[0].x=s.heroX+.115;s.enemies[0].clock=1.1;s.enemies[0].engaged=true;s.targetId=s.enemies[0].id;s.heroClock=0;
  assert.ok(step(s,1/30,()=>.999).some(e=>e.type==='death'));
  const loaded=restore(JSON.stringify(s));advance(loaded,2);
  assert.equal(loaded.level,Math.max(1,level-1));assert.equal(loaded.highest,level);assert.equal(loaded.encounter,0);
  const saved=restore(JSON.stringify(loaded));assert.equal(saved.level,loaded.level);assert.equal(saved.highest,level);
 }
});


test('enemy healer buff applies across biomes and refreshes saved healers',()=>{
 for(const [level,amount] of [[20,23],[21,500],[40,2000],[41,7500],[60,30000]]){
  assert.equal(enemyFor(level,'healer').healing,amount);
  const s=wave(level,9),healer=s.enemies.find(e=>e.kind==='healer');healer.healing=1;
  const loaded=restore(JSON.stringify(s));assert.equal(loaded.enemies.find(e=>e.kind==='healer').healing,amount);
 }
 assert.equal(DRUID_LEVELS[0].healing,3.5);
});

// Exercise the real campaign kill path; no separate XP-grant API.
test('kills grant base XP only to the active companion and can cross multiple levels',()=>{
 for(const id of ['archer','druid','turtle']){
  const s=freshGame();s.coins=1500;hireCompanion(s,'archer');hireCompanion(s,'druid');hireCompanion(s,'turtle');
  s.companion={kind:id,x:s.heroX-.13,clock:0,actionAge:1,shot:null,...(id==='turtle'?{hp:7,maxHp:30}:{})};
  selectCompanion(s,id==='archer'?'druid':'archer');
  s.dungeons.cleared[0]=50;s.companionXp[id]=990;
  const e=s.enemies[0];e.hp=1;e.x=s.heroX+.115;e.reward=2130;e.damage=0;
  const events=step(s,1.3,()=>.999);
  assert.ok(events.some(e=>e.type==='kill'));assert.equal(s.coins,2343);
  assert.deepEqual(events.find(e=>e.type==='companionXp'),{type:'companionXp',value:2130,x:s.companion.x,companion:id});
  assert.equal(s[id+'Level'],3);assert.equal(s.companionXp[id],482.5);
  for(const other of ['archer','druid','turtle'].filter(x=>x!==id)){assert.equal(s[other+'Level'],1);assert.equal(s.companionXp[other],0);}
  if(id==='turtle'){assert.equal(s.companion.hp,7);assert.equal(s.companion.maxHp,62);}
  const xp=s.companionXp[id];step(s,.01,()=>.999);assert.equal(s.companionXp[id],xp);
  const loaded=restore(JSON.stringify(s));assert.equal(loaded[id+'Level'],3);assert.equal(loaded.companionXp[id],482.5);
 }
});
test('companion XP preserves old purchased levels and stops at level 100',()=>{
 const old=freshGame();old.druidLevel=50;delete old.companionXp;
 const loaded=restore(JSON.stringify(old));assert.equal(loaded.druidLevel,50);assert.deepEqual(loaded.companionXp,{archer:0,druid:0,turtle:0});
 const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidLevel=99;s.companionXp.druid=DRUID_LEVELS[98].xpRequired-1;
 const e=s.enemies[0];e.hp=1;e.x=s.heroX+.115;step(s,1.3,()=>.999);
 assert.equal(s.druidLevel,100);assert.equal(s.companionXp.druid,0);
 assert.deepEqual([0,1,9,29,49,69,98,99].map(i=>DRUID_LEVELS[i].xpRequired),[1000,1110,2560,20630,166280,1340560,27647250,0].map(x=>x*1.25));
 assert.equal(DRUID_LEVELS[29].healing,3612);assert.equal(ARCHER_LEVELS[29].damage,2890);assert.equal(TURTLE_LEVELS[29].hp,20643);
});

test('keeping replaced equipment stores only displaced items and inventory survives reload',()=>{
 const s=freshGame();s.keepReplaced=true;s.equipment.boots={...candidate('boots',20),epoch:2};s.pending={...candidate('boots',40),epoch:2};const old=structuredClone(s.equipment.boots);
 assert.equal(equip(s,'boots'),true);assert.deepEqual(s.inventory,[old]);
 const pending={...candidate('weapon',10),epoch:2};s.pending=pending;
 assert.equal(equip(s,'boots',false,0),true);assert.equal(s.equipment.boots.value,20);assert.equal(s.inventory[0].value,40);assert.equal(s.pending,pending);
 const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded.inventory,s.inventory.map(i=>({...i,name:'Bronze Warrior Boots'})));assert.equal(loaded.keepReplaced,true);
 const coins=s.coins;assert.equal(sell(s,0),true);assert.equal(s.coins,coins+old.sale);assert.equal(s.inventory.length,0);assert.equal(s.pending,pending);assert.equal(sell(s,0),false);
 const legacy=freshGame();delete legacy.inventory;delete legacy.keepReplaced;assert.deepEqual(restore(JSON.stringify(legacy)).inventory,[]);
});
test('bulk equip keeps displaced gear outside mass sale and disabled keep retains old behavior',()=>{
 for(const keep of [true,false]){const s=freshGame();s.keepReplaced=keep;s.equipment.boots=candidate('boots',10);s.pending=candidate('boots',20);s.results=[candidate('boots',30)];
 assert.equal(equipStronger(s),1);sellWeaker(s);assert.equal(s.equipment.boots.value,30);assert.equal(s.inventory.length,keep?1:0);if(keep)assert.equal(s.inventory[0].value,10);}
});
test('inventory rings replace the chosen slot and reforge operates on saved gear only',()=>{
 const s=freshGame();s.keepReplaced=true;s.coins=5000;s.equipment.ring2={...candidate('ring2',10),epoch:2};s.inventory=[{...candidate('ring',30),epoch:2}];
 assert.equal(equip(s,'boots',false,0),false);assert.equal(equip(s,'ring2',false,0),true);assert.equal(s.equipment.ring2.value,30);assert.equal(s.inventory[0].slot,'ring');
 const equipped=structuredClone(s.equipment),hp=s.hp;assert.equal(reforge(s,0,()=>0),true);assert.equal(s.coins,4600);assert.ok(s.inventory[0].reforgeOffer);assert.equal(resolveReforge(s,0,true),true);assert.equal(s.inventory[0].affix.type,'damage');assert.deepEqual(s.equipment,equipped);assert.equal(s.hp,hp);
 assert.deepEqual(restore(JSON.stringify(s)).inventory,s.inventory.map(i=>({...i,name:'Bronze Warrior Ring'})));
});

test('inventory equip swaps in place even when keeping forged replacements is disabled',()=>{
 const s=freshGame();s.keepReplaced=false;s.equipment.boots=candidate('boots',10);s.inventory=[candidate('helmet',5),candidate('boots',30)];
 assert.equal(equip(s,'boots',false,1),true);assert.equal(s.equipment.boots.value,30);assert.equal(s.inventory.length,2);assert.equal(s.inventory[1].value,10);assert.equal(s.inventory[0].slot,'helmet');assert.equal(s.keepReplaced,false);
 assert.equal(equip(s,'helmet',false,0),true);assert.equal(s.inventory.length,1);assert.equal(s.equipment.helmet.value,5);
});

test('inventory capacity blocks new storage but permits swaps and one expansion',()=>{
 const s=freshGame();const old={slot:'boots',name:'Boots',epoch:3,quality:0,itemLevel:1,value:10,sale:1};
 s.equipment.boots={...old};s.inventory=Array.from({length:32},()=>({...old}));s.keepReplaced=true;s.pending={...old,value:20};
 const before=JSON.stringify(s);assert.equal(equip(s),false);assert.equal(equipStronger(s),0);assert.equal(JSON.stringify(s),before);
 assert.equal(equip(s,'boots',false,0),true);assert.equal(s.inventory.length,32);
 s.runes=19;assert.equal(expandInventory(s),false);assert.equal(s.runes,19);
 s.runes=25;assert.equal(expandInventory(s),true);assert.equal(s.runes,5);assert.equal(s.inventoryCapacity,100);
 assert.equal(expandInventory(s),false);assert.equal(s.runes,5);assert.equal(equip(s),true);assert.equal(s.inventory.length,33);
 assert.equal(restore(JSON.stringify(s)).inventoryCapacity,100);
 s.inventory=Array.from({length:100},()=>({...old}));s.pending={...old,value:30};assert.equal(equip(s),false);
 s.keepReplaced=false;assert.equal(equip(s),true);assert.equal(s.inventory.length,100);
});

test('inventory bulk sale keeps equal, stronger, affixed and unfilled slots; rings compare with weaker equipped',()=>{
 const s=freshGame();s.equipment.weapon={value:10};s.equipment.ring1={value:20};s.equipment.ring2={value:30};
 s.pending=candidate('weapon',1);const pending=s.pending;
 s.inventory=[candidate('weapon',9),candidate('weapon',10),candidate('weapon',11),{...candidate('weapon',2),affix:{type:'speed',value:1}},candidate('helmet',1),candidate('ring',19),candidate('ring',20)];
 const before=JSON.stringify(s);assert.deepEqual(sellWeaker(s,true,true,true),{count:2,coins:2});assert.equal(JSON.stringify(s),before);
 assert.deepEqual(sellWeaker(s,false,true,true),{count:2,coins:2});assert.equal(s.inventory.length,5);assert.equal(s.pending,pending);assert.equal(s.coins,2);
 assert.equal(sellWeaker(s,false,true,false).count,1);assert.equal(s.inventory.length,4);assert.equal(s.coins,3);
 s.equipment.ring2=null;s.inventory.push(candidate('ring',1));assert.equal(sellWeaker(s,false,true,false).count,0);
});

test('rotary gun fires every quarter second for one eighth damage, including saved gear',()=>{
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'rotary-gun',name:'Rotary Gun',quality:0,value:798,sale:5,epoch:5,itemLevel:1};
 const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=100000;e.damage=0;
 const hits=[];for(let frame=0;frame<150;frame++)for(const event of step(s,1/30,()=>.999))if(event.type==='heroHit'){assert.equal(event.value,100);hits.push((frame+1)/30);}
 assert.equal(hits.length,20);
 for(let i=1;i<hits.length;i++)assert.ok(Math.abs(hits[i]-hits[i-1]-.25)<=1/30);
 const serial=freshGame();serial.equipment.weapon=s.equipment.weapon;assert.equal(stats(restore(JSON.stringify(serial))).damage,100);
});

test('drum shotgun halves the attack interval and per-shot damage without changing DPS',()=>{
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'drum-shotgun',name:'Drum Shotgun',quality:0,value:798,sale:5,epoch:5,itemLevel:1};
 const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=100000;e.damage=0;
 const hits=[];for(let frame=0;frame<150;frame++)for(const event of step(s,1/30,()=>.999))if(event.type==='heroHit'){assert.equal(event.value,400);hits.push((frame+1)/30);}
 assert.equal(hits.length,5);
 for(let i=1;i<hits.length;i++)assert.ok(Math.abs(hits[i]-hits[i-1]-1)<1e-9);
 const serial=freshGame();serial.equipment.weapon=s.equipment.weapon;assert.equal(stats(restore(JSON.stringify(serial))).damage,400);
});

test('field rifle fires twice a second and attack speed scales fast weapons proportionally',async()=>{
 const {attackInterval,heroPower}=await import('./game.mjs');
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'crossbow',name:'Test',quality:0,value:798,sale:5,epoch:5,itemLevel:1};
 const power=heroPower(s);s.equipment.weapon.weaponId='assault-rifle';
 assert.equal(attackInterval(s),.5);assert.equal(stats(s).damage,200);assert.equal(heroPower(s),power);
 const e=s.enemies[0];e.x=s.heroX+.115;e.hp=e.maxHp=100000;e.damage=0;
 const hits=[];for(let frame=0;frame<150;frame++)for(const event of step(s,1/30,()=>.999))if(event.type==='heroHit'){assert.equal(event.value,200);hits.push((frame+1)/30);}
 assert.equal(hits.length,10);for(let i=1;i<hits.length;i++)assert.ok(Math.abs(hits[i]-hits[i-1]-.5)<1e-9);
 for(const [id,interval] of [['assault-rifle',.5],['rotary-gun',.25],['drum-shotgun',1]]){
  s.equipment.weapon.weaponId=id;delete s.equipment.weapon.affix;
  const damage=stats(s).damage;s.equipment.weapon.affix={type:'speed',value:5};
  assert.equal(stats(s).damage,damage);assert.equal(attackInterval(s),interval/1.05);
 }
});

test('melee and ranged affixes add to damage only for the equipped weapon type and survive saves',()=>{
 const s=freshGame();s.equipment.weapon={slot:'weapon',weaponId:'club',name:'Club',value:98,epoch:1,quality:0,itemLevel:1,sale:1,affix:{type:'damage',value:10}};
 s.equipment.helmet={...candidate('helmet',5),affix:{type:'meleeDamage',value:40}};
 s.equipment.chest={...candidate('chest',5),affix:{type:'rangedDamage',value:20}};
 assert.equal(stats(s).damage,150);
 s.equipment.weapon.weaponId='slingshot';assert.equal(stats(s).damage,130);
 const loaded=restore(JSON.stringify(s));assert.equal(stats(loaded).damage,130);assert.deepEqual(loaded.equipment.helmet.affix,s.equipment.helmet.affix);
 s.equipment.weapon=null;assert.equal(stats(s).damage,2);
});

test('manual companion abilities keep passive attacks, respect cooldowns and persist auto mode',()=>{
 for(const kind of ['archer','druid']){
  const s=freshGame();s.coins=5000;hireCompanion(s,kind);s[kind+'Level']=40;
  s[kind+'Talents']=kind==='archer'?{shot:1,rain:1,pierce:1,barrage:1}:{touch:1,regrowth:1,bark:1,bloom:1};
  s.companionAuto=false;assert.equal(restore(JSON.stringify(s)).companionAuto,false);s.phase='fight';s.companion.x=.2;s.hp=stats(s).hp*.4;
  for(const enemy of s.enemies){enemy.x=.45;enemy.engaged=true;enemy.hp=enemy.maxHp=1e9;enemy.damage=0;}
  const skills=kind==='archer'?['rain','pierce','barrage']:['regrowth','bark','bloom'];
  const events=advance(s,.1);assert.ok(!events.some(e=>e.type===kind+'Skill'));
  s.phase='fight';s.hp=10;s.companion.x=.2;for(const enemy of s.enemies){enemy.hp=1e9;enemy.x=.45;enemy.engaged=true;}
  for(const skill of skills){assert.equal(castCompanionSkill(s,skill)?.skill,skill);assert.equal(castCompanionSkill(s,skill),null);assert.ok(s[kind+'Combat'][skill+'Cooldown']>0);}
  s.phase='dead';assert.equal(castCompanionSkill(s,skills[0]),null);
 }
 assert.equal(freshGame().companionAuto,true);
});

test('manual companion casting targets the dungeon battle and auto off reaches its simulation',()=>{
 for(const kind of ['archer','druid']){
  const s=freshGame();s.coins=5000;s.highest=2;hireCompanion(s,kind);s.companionAuto=false;
  const skill=kind==='archer'?'rain':'bark';s[kind+'Talents']=kind==='archer'?{shot:1,rain:1}:{touch:1,bark:1};
  assert.equal(enterDungeon(s,'treasury',1),true);const b=s.dungeons.run.battle;
  b.phase='fight';b.hp=10;b.companion.x=.2;b.enemies[0].x=.4;b.enemies[0].engaged=true;
  const events=step(s,1/30,()=>.999);assert.equal(b.companionAuto,false);assert.ok(!events.some(e=>e.type===kind+'Skill'));
  b.phase='fight';b.hp=10;b.companion.x=.2;b.enemies[0].x=.4;
  assert.equal(castCompanionSkill(s,skill)?.skill,skill);assert.ok(b[kind+'Combat'][skill+'Cooldown']>0);
 }
});

test('Downpour extends Rain by half a second per rank and its final partial pulse deals damage',()=>{
 for(const rank of [0,1,10]){
  const s=freshGame();s.coins=500;hireCompanion(s,'archer');s.archerLevel=40;s.archerTalents={shot:1,rain:1,downpour:rank};s.companionAuto=false;s.phase='fight';s.heroClock=-100;s.companion.clock=-100;
  const e=s.enemies[0];Object.assign(e,{x:s.heroX+.115,hp:1e9,maxHp:1e9,damage:0});
  assert.equal(castCompanionSkill(s,'rain')?.skill,'rain');assert.equal(s.archerCombat.rain,3+rank*.5);assert.equal(s.archerCombat.rainCooldown,30);const saved=freshGame();saved.archerCombat.rainCooldown=30;assert.equal(restore(JSON.stringify(saved)).archerCombat.rainCooldown,30);
  const duration=3+rank*.5,events=advance(s,duration+.1).filter(e=>e.type==='companionHit');
  const damage=ARCHER_LEVELS[39].damage*(.4+rank*.01);
  assert.equal(events.reduce((n,e)=>n+e.value,0),Math.floor(duration)*Math.round(damage)+(duration%1?Math.round(damage*.5):0));
  assert.equal(s.archerCombat.rain,0);assert.equal(s.archerCombat.rainClock,0);
 }
});

test('Oak Skin lasts five seconds and Thick Bark adds duration while preserving cooldown',()=>{
 for(const rank of [0,1,10]){
  const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidLevel=40;s.druidTalents={touch:1,bark:1,thickBark:rank};s.companionAuto=false;s.phase='fight';
  assert.equal(castCompanionSkill(s,'bark')?.skill,'bark');assert.equal(s.druidCombat.bark,5+rank*.5);assert.equal(s.druidCombat.barkCooldown,25);
  assert.equal(restore(JSON.stringify(s)).druidCombat.bark,5+rank*.5);
 }
});
import {TURTLE_TALENTS,learnTurtleTalent,resetTurtleTalents} from './game.mjs';

test('turtle starts untrained, spends one point at level one, and optional upgrades never block Fortress',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'turtle');assert.deepEqual(s.turtleTalents,{});assert.equal(castCompanionSkill(s,'respite'),null);
 assert.equal(learnTurtleTalent(s,'shell'),true);assert.equal(learnTurtleTalent(s,'vitality'),false);s.turtleLevel=40;
 for(let i=0;i<10;i++){learnTurtleTalent(s,'vitality');learnTurtleTalent(s,'layers');}for(let i=0;i<5;i++)learnTurtleTalent(s,'spirit');
 assert.equal(learnTurtleTalent(s,'slam'),true);assert.equal(learnTurtleTalent(s,'respite'),true);assert.equal(learnTurtleTalent(s,'fortress'),true);
 assert.equal(TURTLE_TALENTS.length,15);assert.equal(Object.values(s.turtleTalents).reduce((a,b)=>a+b,0),29);
 const ratio=s.companion.hp/s.companion.maxHp;s.companion.hp=0;assert.equal(learnTurtleTalent(s,'mending'),true);assert.equal(s.companion.hp,0);
 s.turtleCombat.fortressCooldown=40;assert.equal(resetTurtleTalents(s),true);assert.equal(s.turtleCombat.fortressCooldown,40);assert.equal(s.companion.hp,0);assert.equal(ratio,1);
});
test('Shell Slam hits and stuns every enemy including bosses and healers for three seconds',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'turtle');s.turtleTalents={shell:1,slam:1,concussion:10,heavy:10};s.companionAuto=false;s.phase='fight';s.companion.x=s.heroX+.08;s.heroClock=-100;
 const e=s.enemies[0];s.enemies=Array.from({length:4},(_,id)=>({...e,id,kind:id===3?'healer':'warrior',boss:id===2,x:s.heroX+.2+id*.04,hp:1000,maxHp:1000,damage:0,healing:100,engaged:true,clock:1,healClock:1.49}));
 assert.equal(castCompanionSkill(s,'slam')?.skill,'slam');const events=step(s,.01,()=>.999);
 assert.equal(events.filter(e=>e.type==='companionHit').length,4);assert.ok(s.enemies.every(e=>e.stun===3));assert.equal(events.filter(e=>e.type==='heal'||e.type==='enemyHit'||e.type==='tankHit').length,0);
 const hp=s.companion.hp;advance(s,2.9);assert.ok(s.enemies.every(e=>e.stun>0));assert.equal(s.companion.hp,hp);advance(s,.2);assert.ok(s.enemies.every(e=>e.stun===0));
});
test('Respite heals a living turtle by 30 percent and cannot revive it; cooldowns and ranks persist',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'turtle');s.turtleLevel=40;s.turtleTalents={shell:1,respite:1,healing:10};s.companionAuto=false;s.phase='fight';s.companion.x=s.heroX+.08;s.companion.hp=5;s.enemies[0].x=s.heroX+.2;s.enemies[0].damage=0;s.heroClock=-100;
 assert.equal(castCompanionSkill(s,'respite')?.skill,'respite');advance(s,4);assert.ok(Math.abs(s.companion.hp-14)<1e-7);
 s.companion.hp=0;s.turtleCombat.respiteCooldown=0;assert.equal(castCompanionSkill(s,'respite'),null);advance(s,.1);assert.equal(s.companion.hp,0);
 const saved=freshGame();saved.turtleLevel=40;saved.turtleTalents={shell:1,healing:10};saved.turtleCombat.fortressCooldown=55;
 const loaded=restore(JSON.stringify(saved));assert.deepEqual(loaded.turtleTalents,saved.turtleTalents);assert.equal(loaded.turtleCombat.fortressCooldown,55);
});
test('Thorns kill rewards are paid once and Fortress uses absorbed damage with a capped wave',()=>{
 const s=freshGame();s.coins=500;hireCompanion(s,'turtle');s.turtleTalents={shell:1,thorns:10};s.companionAuto=false;s.phase='fight';s.companion.x=s.heroX+.1;s.heroClock=-100;
 const e=s.enemies[0];Object.assign(e,{x:s.heroX+.2,hp:.1,damage:4,clock:1.09,engaged:true});const events=step(s,.02,()=>.999);assert.equal(s.kills,1);assert.equal(events.filter(e=>e.type==='kill').length,1);
 const f=freshGame();f.coins=500;hireCompanion(f,'turtle');f.turtleTalents={shell:1,fortress:1,wave:10};f.companionAuto=false;f.phase='fight';f.companion.x=f.heroX+.1;f.companion.hp=10;f.heroClock=-100;
 Object.assign(f.enemies[0],{x:f.heroX+.2,hp:1000,maxHp:1000,damage:4,clock:1.09,engaged:true});
 assert.equal(castCompanionSkill(f,'fortress')?.skill,'fortress');assert.equal(f.companion.hp,19);step(f,.02,()=>.999);assert.equal(f.companion.hp,18);assert.equal(f.turtleCombat.absorbed,3);
 f.turtleCombat.absorbed=10000;f.turtleCombat.fortress=.01;f.enemies[0].damage=0;const wave=step(f,.02,()=>.999).find(e=>e.type==='companionHit');assert.equal(wave.value,13.5);
});
test('turtle abilities and stun work in dungeons, and Fortress cannot be cast when dead',()=>{
 const s=freshGame();s.coins=500;s.highest=2;hireCompanion(s,'turtle');s.turtleTalents={shell:1,slam:1,fortress:1};s.companionAuto=false;enterDungeon(s,'forge',1);
 const b=s.dungeons.run.battle;b.phase='fight';b.companion.x=.4;b.enemies[0].x=.6;b.enemies[0].clock=1.09;b.enemies[0].engaged=true;
 assert.equal(castCompanionSkill(s,'slam')?.skill,'slam');step(s,.01,()=>.999);assert.ok(b.enemies[0].stun>0);const skillTime=b.dungeonBattle.time-(b.dungeonBattle.stunDelay||0);step(s,.2,()=>.999);assert.ok(Math.abs(b.dungeonBattle.time-b.dungeonBattle.stunDelay-skillTime)<1e-8);
 b.companion.hp=0;assert.equal(castCompanionSkill(s,'fortress'),null);assert.ok(s.turtleCombat.slamCooldown>0);leaveDungeon(s);assert.ok(s.turtleCombat.slamCooldown>0);
});

test('Regrowth lasts 5 to 10 seconds with Long Spring and preserves its 20 second cooldown on reload',()=>{
 for(const rank of [0,1,10]){
  const s=freshGame();s.coins=500;hireCompanion(s,'druid');s.druidLevel=100;s.druidTalents={touch:1,regrowth:1,spring:rank};s.phase='fight';s.companionAuto=false;
  assert.ok(castCompanionSkill(s,'regrowth'));assert.equal(s.druidCombat.regrowth,5+rank*.5);assert.equal(s.druidCombat.regrowthCooldown,20);
  const saved=restore(JSON.stringify(s));assert.equal(saved.druidCombat.regrowth,5+rank*.5);assert.equal(saved.druidCombat.regrowthCooldown,20);
 }
});
