import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getElfRecruitUnlock, getRecruitChances, getUnitStats, receiveRecruit } from '../recruitment.ts';
import { createBattle, updateBattle, COMBAT_PACE } from '../combat.ts';
import { getConnectResult } from '../unit-merging.ts';
import { canPlaceUnit, getUnitAtCell, getUnitPosition, planFormationMove, reconcileUnitFootprints } from '../unit-footprint.ts';
import { getSceneAssetPlan } from '../scene-assets.ts';
import { UNICORN_ASSETS } from '../unicorn-art.ts';

const options = { pool: 'elves', elvesUnlocked: true, barracksLevel: 4 };
const trained = (rider = 50, archer = 15) => createRecruitment({ version: 2, received: { pantherRider: rider, elfArcher: archer } });
const allCells = Array.from({length: 15}, (_, i) => `${i % 5}:${Math.floor(i / 5)}`);
const fighter = (id, type, col, row = 0, level = 1) => ({id, type, col, row, level});
const dt = 1 / 60;

test('Unicorn requires both recruitment level five and completed Barracks IV, with equal eligible odds', () => {
  for (const [rider, tier, available] of [[49,4,false],[50,3,false],[50,4,true]]) {
    const state = trained(rider);
    assert.equal(getElfRecruitUnlock(state,'unicorn',tier).available,available);
    assert.equal(getRecruitChances(true,'elves',state,tier).some(c=>c.type==='unicorn'),available);
  }
  assert.deepEqual(getRecruitChances(true,'elves',trained(),4),
    ['pantherRider','elfArcher','elfHealer','unicorn'].map(type=>({type,chance:.25})));
  assert.deepEqual(getRecruitChances(true,'elves',trained(50,0),4),
    ['pantherRider','elfArcher','unicorn'].map(type=>({type,chance:1/3})));
  assert.equal(getRecruitChances(true,'elves',trained()).some(c=>c.type==='unicorn'),false,'Legacy callers cannot assume Barracks IV');
  for(const [roll,type] of [[0,'pantherRider'],[.25-1e-10,'pantherRider'],[.25,'elfArcher'],[.5,'elfHealer'],[.75-1e-10,'elfHealer'],[.75,'unicorn'],[1-1e-10,'unicorn']])
    assert.equal(receiveRecruit(trained(),()=>roll,options).type,type);
  const threshold=trained(49);
  assert.equal(receiveRecruit(threshold,()=>0,options).type,'pantherRider');
  assert.equal(receiveRecruit(threshold,()=>.99,options).type,'unicorn');
  for(const tier of [0,1,2,5,NaN,'4']) {
    const state=trained(), before=structuredClone(state);
    assert.throws(()=>receiveRecruit(state,()=>.99,{...options,barracksLevel:tier}),RangeError);
    assert.deepEqual(state,before);
  }
});

test('Unicorn receipts start independently in old saves and Connect preserves levels beyond 100', () => {
  for(const version of [1,2]) {
    const state=createRecruitment({version,received:{swordsman:100,pantherRider:50,elfArcher:15}});
    assert.equal(state.received.unicorn,0); assert.equal(state.legacyTrainingCredit.unicorn,0);
    for(let i=0;i<5;i++) assert.equal(receiveRecruit(state,()=>.99,options).level,i===4?2:1);
    assert.equal(state.received.pantherRider,50); assert.equal(state.received.unicorn,5);
    assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))),state);
  }
  const reserve=[{id:1,type:'unicorn',level:99},{id:2,type:'unicorn',level:3},{id:3,type:'pantherRider',level:500}];
  const merged=getConnectResult([],reserve,{location:'reserve',id:1},[{location:'reserve',id:2}],{minArmyUnits:0});
  assert.equal(merged.ok,true); assert.equal(merged.recipient.level,102); assert.equal(merged.reserve.length,2);
  assert.equal(getConnectResult([],reserve,{location:'reserve',id:1},[{location:'reserve',id:3}],{minArmyUnits:0}).reason,'different-type');
  assert.deepEqual(getUnitStats('unicorn',1),{level:1,hp:120,damage:10,heal:0});
  assert.equal(getUnitStats('unicorn',101).hp,720); assert.equal(getUnitStats('unicorn',101).damage,60);
});

test('both mounts share two-cell selection, safe placement, moves, swaps and restore without losing fighters', () => {
  for(const type of ['unicorn','pantherRider']) {
    const mount=fighter(1,type,1,0,125), guard=fighter(2,'swordsman',3);
    assert.equal(canPlaceUnit(mount,[],['1:0','2:0']),true);
    assert.equal(canPlaceUnit(mount,[],['1:0']),false);
    assert.equal(canPlaceUnit(mount,[fighter(2,'healer',2)],allCells),false);
    assert.equal(canPlaceUnit({...mount,col:4},[],allCells),false);
    assert.strictEqual(getUnitAtCell([mount],2,0),mount);
    const battle=createBattle([mount],1);
    assert.equal(battle.allies[0].x,getUnitPosition(mount).x);
    const swapped=planFormationMove([mount,guard],1,3,0,allCells);
    assert.equal(swapped.ok,true); assert.deepEqual(swapped.units.map(u=>u.col),[3,1]);
    assert.equal(planFormationMove([mount,guard],1,3,0,allCells.filter(c=>c!=='4:0')).ok,false);
    const restored=reconcileUnitFootprints([mount],[],['1:0']);
    assert.deepEqual(restored.reserve,[{id:1,type,level:125}]); assert.deepEqual(restored.units,[]);
    assert.equal(reconcileUnitFootprints(restored.units,restored.reserve,['1:0']).movedCount,0);
  }
});

function encounter() {
  const battle=createBattle([fighter(1,'unicorn',1)],1);
  Object.assign(battle,{wave:{...battle.wave,spawns:[{at:0,type:'goblin',hp:1000,damage:0,x:195,y:240}]},total:1,nextSpawn:0});
  updateBattle(battle,dt);
  for(const unit of [battle.hero,...battle.enemies]) Object.assign(unit,{action:'attack',actionDuration:9999,actionTime:0,didImpact:true,cooldown:9999});
  const unit=battle.allies[0],target=battle.enemies[0];
  Object.assign(unit,{x:195,y:275,action:'idle',cooldown:0,actionTime:0,didImpact:false});
  return {battle,unit,target};
}

test('horn hits one target exactly on pose two, never before impact or again during recovery', () => {
  const {battle,unit,target}=encounter(); updateBattle(battle,dt);
  assert.equal(unit.action,'attack'); assert.equal(unit.actionDuration,.8/COMBAT_PACE);
  assert.equal(unit.cooldown,1.3/COMBAT_PACE); assert.equal(unit.range,42);
  while(unit.actionTime+dt < unit.actionDuration*.5-1e-9) updateBattle(battle,dt);
  assert.equal(target.hp,1000);
  while(!unit.didImpact) updateBattle(battle,dt);
  assert.equal(target.hp,990);
  for(let i=0;i<8;i++) updateBattle(battle,dt);
  assert.equal(target.hp,990); assert.equal(battle.effects.some(e=>e.type==='arrow'),false);
  const distant=encounter(); Object.assign(distant.unit,{y:340});
  for(let i=0;i<300&&!distant.unit.didImpact;i++) updateBattle(distant.battle,dt);
  assert.ok(distant.unit.y<290,'Melee mount advances instead of idling out of range');
  assert.equal(distant.target.hp,990);
  for(const invalid of ['dead-target','dead-caster','out-of-range']) {
    const {battle,unit,target}=encounter(); updateBattle(battle,dt);
    if(invalid==='dead-target') target.hp=0;
    if(invalid==='dead-caster') unit.hp=0;
    if(invalid==='out-of-range') target.y=80;
    const hp=target.hp;
    for(let i=0;i<40;i++) updateBattle(battle,dt);
    assert.equal(target.hp,hp,invalid);
  }
});

test('Unicorn only loads visible rank sheets, with no spells or new effects', () => {
  const baseline=getSceneAssetPlan();
  assert.ok(!baseline.keys.some(key=>key.includes('/unicorn/')));
  const plan=getSceneAssetPlan({units:[{type:'unicorn',level:1},{type:'unicorn',level:50},{type:'unicorn',level:50}]});
  assert.equal(plan.allies.length,2);
  assert.equal(plan.keys.length,baseline.keys.length+2);
  assert.ok(plan.keys.includes(UNICORN_ASSETS[1].sheet)); assert.ok(plan.keys.includes(UNICORN_ASSETS[2].sheet));
  assert.equal(plan.elfHealPulse,null); assert.equal(plan.moonGlaive,null);
});
