import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getElfRecruitUnlock, getRecruitChances, getUnitStats, receiveRecruit } from '../recruitment.ts';
import { createBattle, updateBattle, COMBAT_PACE } from '../combat.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';
import { getConnectResult } from '../unit-merging.ts';
import { restoreCampaignRoster } from '../campaign-roster.ts';
import { createProgression } from '../progression.ts';
import { getUnitCells, canPlaceUnit } from '../unit-footprint.ts';

const options = { pool: 'elves', elvesUnlocked: true }, dt = 1 / 60;
const trained = () => createRecruitment({ version: 2, received: { pantherRider: 15, elfArcher: 15 } });
const hold = unit => Object.assign(unit, { action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999 });

test('Archer receipt 15 unlocks the healer on the next conversion and divides eligible elves into exact thirds', () => {
  const state = trained(); state.received.elfArcher = 14;
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 3).available, false);
  assert.equal(receiveRecruit(state, () => .99, options).type, 'elfArcher');
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 3).available, true);
  for (const tier of [1, 2]) assert.equal(getElfRecruitUnlock(state, 'elfHealer', tier).available, false);
  assert.deepEqual(getRecruitChances(true, 'elves', state), ['pantherRider', 'elfArcher', 'elfHealer'].map(type => ({type, chance: 1/3})));
  for (const [roll, type] of [[0,'pantherRider'],[1/3-1e-10,'pantherRider'],[1/3,'elfArcher'],[2/3-1e-10,'elfArcher'],[2/3,'elfHealer'],[.999999,'elfHealer']])
    assert.equal(receiveRecruit(trained(), () => roll, options).type, type);
  assert.equal(getElfRecruitUnlock(state, 'unicorn', 4).available, false);
  const archer = getConnectResult([], [{id:1,type:'elfArcher',level:1},{id:2,type:'elfArcher',level:2}],
    {location:'reserve',id:1}, [{location:'reserve',id:2}], {minArmyUnits:0});
  assert.equal(archer.recipient.level, 3);
  assert.equal(getElfRecruitUnlock(createRecruitment(), 'elfHealer', 3).available, false);
});

test('old saves initialize independent healer receipts; only real healer rolls advance them', () => {
  for (const version of [1, 2]) {
    const saved = { version, received: { healer: 100, elfArcher: 15, pantherRider: 15 } };
    const before = structuredClone(saved), state = createRecruitment(saved);
    assert.equal(state.received.elfHealer, 0); assert.equal(state.legacyTrainingCredit.elfHealer, 0);
    for (let i=0;i<5;i++) assert.equal(receiveRecruit(state, () => .9, options).level, i===4?2:1);
    assert.equal(state.received.elfHealer, 5); assert.equal(state.received.healer, 100);
    assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
    assert.deepEqual(saved,before);
  }
});

test('healer keeps one-cell placement, personal levels and strict same-type Connect after restore', () => {
  const progression = createProgression();
  const roster = restoreCampaignRoster([{type:'elfHealer',level:99,col:2,row:0},{type:'swordsman',level:1,col:2,row:1}],
    [{type:'elfHealer',level:3},{type:'healer',level:100}], progression);
  assert.deepEqual(getUnitCells(roster.units[0]), ['2:0']);
  assert.equal(canPlaceUnit(roster.units[0], [], ['2:0']), true);
  assert.equal(getConnectResult(roster.units,roster.reserve,{location:'army',id:1},[{location:'reserve',id:4}]).reason,'different-type');
  for (const location of ['army','reserve']) {
    const result = getConnectResult(roster.units,roster.reserve,{location,id:location==='army'?1:3},
      [{location:location==='army'?'reserve':'army',id:location==='army'?3:1}]);
    assert.equal(result.ok,true); assert.equal(result.recipient.level,102);
    const save=JSON.parse(JSON.stringify(result)), restored=restoreCampaignRoster(save.units,save.reserve,progression);
    assert.deepEqual([...restored.units,...restored.reserve].filter(unit=>unit.type==='elfHealer').map(unit=>unit.level),[102]);
  }
});

function encounter(forge, type = 'elfHealer') {
  const battle=createBattle([{id:1,type,level:1,col:2,row:1},{id:2,type:'swordsman',level:1,col:2,row:0}],1,undefined,forge);
  Object.assign(battle,{wave:{...battle.wave,spawns:[{at:0,type:'goblin',hp:1000,damage:0,x:300,y:180}]},total:1,nextSpawn:0});
  updateBattle(battle,dt);
  for(const unit of [...battle.allies,...battle.enemies,battle.hero]) hold(unit);
  const [healer,patient]=battle.allies;
  Object.assign(healer,{x:195,y:310,action:'idle',actionTime:0,cooldown:0,didImpact:false});
  Object.assign(patient,{x:195,y:260,hp:20});
  return {battle,healer,patient};
}
function impact(battle) {
  const events=[];
  for(let i=0;i<60 && !battle.allies[0].didImpact;i++) events.push(...updateBattle(battle,dt));
  return events;
}

test('elven healer can cast from 65 range while a human monk must move closer', () => {
  for (const type of ['elfHealer', 'healer']) {
    const {battle,healer,patient}=encounter(undefined,type);
    // Both retain the existing 20-unit approach margin: 70 for elves vs 57.5 for humans.
    patient.y=healer.y-65;
    const before={x:healer.x,y:healer.y};
    updateBattle(battle,dt);
    if(type==='elfHealer') {
      assert.equal(healer.range,90); assert.equal(healer.action,'heal');
      assert.deepEqual({x:healer.x,y:healer.y},before);
      impact(battle); assert.equal(patient.hp,26);
      assert.deepEqual({x:healer.x,y:healer.y},before,'Heal lands without advancing');
    } else {
      assert.equal(healer.range,77.5); assert.equal(healer.action,'walk');
      assert.ok(healer.y<before.y); assert.equal(patient.hp,20);
    }
  }
});

test('elven healing lands once on pose 2, caps overhealing and never creates attack effects', () => {
  const {battle,healer,patient}=encounter();
  updateBattle(battle,dt); assert.equal(healer.action,'heal'); assert.equal(patient.hp,20);
  assert.equal(healer.actionDuration,.8/COMBAT_PACE); assert.equal(healer.cooldown,1.45/COMBAT_PACE);
  while(healer.actionTime+dt < healer.actionDuration*.5-1e-9) updateBattle(battle,dt);
  assert.equal(patient.hp,20); const events=impact(battle); assert.equal(patient.hp,26);
  assert.deepEqual(events.filter(event=>event.type==='heal'),[
    {type:'heal',sourceId:healer.id,sourceType:'elfHealer',targetId:patient.id,side:'ally',amount:6,shield:0},
  ]);
  assert.equal(battle.effects.filter(e=>e.type==='heal'&&e.sourceType==='elfHealer').length,1);
  assert.equal(battle.effects.find(e=>e.type==='heal').duration,.7);
  for(let i=0;i<10;i++) updateBattle(battle,dt);
  assert.equal(patient.hp,26,'Recovery frames cannot duplicate the heal');
  assert.equal(battle.projectiles.length,0);
  assert.ok(!battle.effects.some(e=>['slash','hero-impact'].includes(e.type)));
  const capped=encounter(); capped.patient.hp=capped.patient.maxHp-2;
  updateBattle(capped.battle,dt); const cappedEvents=impact(capped.battle);
  assert.equal(capped.patient.hp,capped.patient.maxHp);
  assert.equal(cappedEvents.find(e=>e.type==='heal').amount,2);
});

test('a queued heal cannot resurrect, heal enemies or the castle, exceed range, or survive caster death', () => {
  for(const invalid of ['full','dead','distant','enemy','castle','dead-caster']) {
    const {battle,healer,patient}=encounter(); updateBattle(battle,dt);
    if(invalid==='full') patient.hp=patient.maxHp;
    if(invalid==='dead') patient.hp=0;
    if(invalid==='distant') patient.y=150;
    if(invalid==='dead-caster') healer.hp=0;
    if(invalid==='enemy'||invalid==='castle') {
      const target=invalid==='enemy'?battle.enemies[0]:battle.castle;
      Object.assign(target,{x:195,y:260,hp:10}); healer.targetId=target.id;
    }
    const hp=[patient.hp,battle.enemies[0].hp,battle.castle.hp];
    for(let i=0;i<30;i++) updateBattle(battle,dt);
    assert.deepEqual([patient.hp,battle.enemies[0].hp,battle.castle.hp],hp,invalid);
    assert.equal(battle.effects.some(e=>e.type==='heal'&&e.sourceType==='elfHealer'),false,invalid);
  }
});

test('healer supports a living wounded hero and itself, and remains passive without a wounded ally', () => {
  for(const who of ['hero','self','none']) {
    const {battle,healer,patient}=encounter(); patient.hp=patient.maxHp;
    const target=who==='hero'?battle.hero:healer;
    if(who!=='none') Object.assign(target,{x:195,y:who==='hero'?260:310,hp:10});
    updateBattle(battle,dt);
    if(who==='none') { assert.equal(healer.action,'idle'); assert.equal(healer.damage,0); continue; }
    assert.equal(healer.targetId,target.id); impact(battle); assert.equal(target.hp,16);
  }
});

test('healer uses additive personal growth and all shared Forge upgrades, captured once per battle', () => {
  assert.deepEqual(getUnitStats('elfHealer',1),{level:1,hp:50,damage:0,heal:6});
  for(const level of [1,50,100,500,1000]) {
    const elf=getUnitStats('elfHealer',level),human=getUnitStats('healer',level);
    assert.equal(elf.hp,Math.round(50*(1+(level-1)*.05)));
    assert.equal(elf.heal,Math.round(6*(1+(level-1)*.05)));
    assert.ok(elf.hp>human.hp&&elf.heal>human.heal);
  }
  const forge=createForge({health:20,attack:30,attackSpeed:40});
  const {battle,healer,patient}=encounter(forge), expected=getForgedUnitStats('elfHealer',1,forge);
  assert.equal(healer.maxHp,expected.hp); assert.equal(healer.heal,expected.heal);
  updateBattle(battle,dt); assert.equal(healer.actionDuration,.8/COMBAT_PACE/1.4);
  forge.attack=100; impact(battle); assert.equal(patient.hp,20+expected.heal);
  assert.equal(healer.heal,expected.heal);
});
