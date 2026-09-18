import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, updateBattle, COMBAT_PACE } from '../combat.ts';
import { WAVE_DEFINITIONS, getWaveDefinition } from '../waves.ts';
import { BATTLE_SPEEDS, battleFrameDelta } from '../battle-speed.ts';
import { tinyGoblinBombardierFrame } from '../tiny-goblin-bombardier.ts';

const dt=1/60;
const hold=unit=>Object.assign(unit,{action:'attack',actionDuration:9999,actionTime:0,didImpact:true,cooldown:9999});
function encounter(type='swordsman') {
  const battle=createBattle(type==='hero'?[]:[{id:1,type,level:1,col:1,row:0}],110);
  Object.assign(battle,{wave:{...battle.wave,spawns:[{at:0,type:'goblinBombardier',hp:1000,damage:18,x:195,y:150}]},total:1,nextSpawn:0});
  updateBattle(battle,dt);
  for(const ally of [...battle.allies,battle.hero]) hold(ally);
  const enemy=battle.enemies[0],target=type==='hero'?battle.hero:battle.allies[0];
  Object.assign(target,{x:195,y:260,hp:1000,maxHp:1000});
  if(type!=='hero') Object.assign(battle.hero,{x:320,y:340});
  return {battle,enemy,target};
}
function until(battle,predicate,seconds=15) {
  const events=[];
  for(let i=0;i<seconds/dt&&!predicate();i++) events.push(...updateBattle(battle,dt));
  assert.ok(predicate(),'Expected combat event before timeout'); return events;
}

test('exactly 1-11 through 1-19 use the new mini-boss and retain their opening healer and main bosses',()=>{
  assert.deepEqual(WAVE_DEFINITIONS.filter(w=>w.bossType==='goblinBombardier').map(w=>w.number),[110,120,130,140,150,160,170,180,190]);
  for(const number of [100,200]) assert.equal(getWaveDefinition(number).bossType,'ogre');
  for(const number of [110,120,130,140,150,160,170,180,190]) {
    const wave=getWaveDefinition(number),boss=wave.spawns.find(s=>s.type==='goblinBombardier');
    assert.equal(wave.isFinalBossWave,false); assert.equal(boss.reward,20); assert.equal(boss.at,.8);
    assert.equal(wave.spawns.find(s=>s.type==='goblinHealer').at,boss.at);
    assert.equal(wave.spawns.filter(s=>s.type==='goblinBombardier').length,1);
  }
  assert.equal(WAVE_DEFINITIONS.filter(w=>w.hasBoss).length,40);
  assert.equal(WAVE_DEFINITIONS.filter(w=>w.levelNumber===2).some(w=>w.spawns.some(s=>s.type==='goblinBombardier')),false);
});

test('cannon release follows pose two; bomb applies single-target damage on arrival, once, without a bow sound',()=>{
  const {battle,enemy,target}=encounter(); updateBattle(battle,dt);
  assert.equal(enemy.action,'shoot'); assert.equal(enemy.actionDuration,1.4/COMBAT_PACE);
  assert.equal(enemy.cooldown,2.15/COMBAT_PACE);
  while(enemy.actionTime+dt < enemy.actionDuration*.55-1e-9) updateBattle(battle,dt);
  assert.equal(battle.effects.some(e=>e.type==='arrow'),false); assert.equal(target.hp,1000);
  const events=until(battle,()=>battle.effects.some(e=>e.type==='arrow'));
  assert.equal(tinyGoblinBombardierFrame(enemy),14); assert.equal(target.hp,1000);
  assert.equal(events.some(e=>e.type==='bow-shot'),false);
  const bomb=battle.effects.find(e=>e.type==='arrow');
  assert.deepEqual(bomb.launchFacing,{x:enemy.facingX,y:enemy.facingY});
  until(battle,()=>battle.effects.some(e=>e.type==='cannon-impact'));
  assert.equal(target.hp,982); assert.equal(battle.hero.hp,battle.hero.maxHp,'Blast does not add unrequested splash');
  assert.equal(battle.effects.some(e=>e.id===bomb.id),false);
  for(let i=0;i<15;i++) updateBattle(battle,dt);
  assert.equal(target.hp,982);
  hold(enemy); for(let i=0;i<30;i++) updateBattle(battle,dt);
  assert.equal(battle.effects.some(e=>e.type==='cannon-impact'),false,'Explosion expires once');
});

test('released bombs survive source death, follow a moving target, never retarget a casualty, and stop with battle',()=>{
  for(const mode of ['source-dead','target-dead','moving','finished']) {
    const {battle,enemy,target}=encounter(); until(battle,()=>battle.effects.some(e=>e.type==='arrow'));
    if(mode==='source-dead') enemy.hp=0;
    if(mode==='target-dead') target.hp=0;
    if(mode==='moving') target.x+=20;
    if(mode==='finished') battle.phase='victory';
    for(let i=0;i<45;i++) updateBattle(battle,dt);
    assert.equal(target.hp,mode==='target-dead'?0:mode==='finished'?1000:982,mode);
    assert.equal(battle.hero.hp,battle.hero.maxHp,mode);
  }
  const pending=encounter(); updateBattle(pending.battle,dt);pending.enemy.hp=0;
  for(let i=0;i<90;i++) updateBattle(pending.battle,dt);
  assert.equal(pending.target.hp,1000,'Death before release cancels the shot');
});

test('infantry, both elf mounts, archers and hero pursue and hit a stationary bombardier',()=>{
  for(const type of ['swordsman','lancer','unicorn','pantherRider','archer','elfArcher','hero']) {
    const {battle,enemy,target}=encounter(type);hold(enemy);
    Object.assign(target,{y:335,action:'idle',actionTime:0,cooldown:0,didImpact:false,targetId:null,focusId:null});
    until(battle,()=>enemy.hp<1000,20);
    assert.ok(enemy.hp<1000,type);
  }
});

test('opening goblin healer can heal the new boss',()=>{
  const battle=createBattle([{id:1,type:'unicorn',level:1,col:1,row:0}],110);
  for(let i=0;i<54;i++) updateBattle(battle,dt);
  const boss=battle.enemies.find(e=>e.type==='goblinBombardier'),healer=battle.enemies.find(e=>e.type==='goblinHealer');
  for(const unit of [...battle.allies,...battle.enemies,battle.hero])hold(unit);
  Object.assign(boss,{x:195,y:180,hp:boss.maxHp-100});
  Object.assign(healer,{x:195,y:130,action:'idle',actionTime:0,cooldown:0,didImpact:false});
  const before=boss.hp;until(battle,()=>boss.hp>before);
  assert.equal(boss.hp,before+healer.heal);
});

test('cannon shots and impact damage agree at every speed and 20/30/60/120 FPS',()=>{
  function run(fps,speed) {
    const {battle}=encounter(), events=[];
    for(let time=0;time<8-1e-9;) {
      const delta=Math.min(battleFrameDelta(1/fps,speed),8-time); events.push(...updateBattle(battle,delta)); time+=delta;
    }
    const clean=({hitTime,deathTime,...actor})=>actor;
    return {allies:battle.allies.map(clean),enemies:battle.enemies.map(clean),hero:clean(battle.hero),effects:battle.effects,events};
  }
  const expected=run(60,1);assert.ok(expected.allies[0].hp<1000);
  for(const speed of BATTLE_SPEEDS)for(const fps of [20,30,60,120])assert.deepEqual(run(fps,speed),expected,`${fps} FPS ×${speed}`);
});
