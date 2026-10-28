import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from '../scene.ts';
import { createBattle, updateBattle } from '../combat.ts';
import { getSceneAssetPlan } from '../scene-assets.ts';
import { getWaveDefinition } from '../waves.ts';
import { GOBLIN_BOMBARDIER_ASSETS, GOBLIN_BOMBARDIER_FRAMES } from '../goblin-bombardier-art.ts';
import { createSceneEnvironment } from './helpers/scene-environment.mjs';

test('only bombardier waves load the compact body, bomb and explosion, never the Army canvas',()=>{
  assert.match(GOBLIN_BOMBARDIER_ASSETS.bomb,/\?no-inline$/);
  assert.match(GOBLIN_BOMBARDIER_ASSETS.explosion,/\?no-inline$/);
  for(const number of [1,100,110,190,200,310]) {
    const state={wave:getWaveDefinition(number)}, plan=getSceneAssetPlan(state);
    for(const url of Object.values(GOBLIN_BOMBARDIER_ASSETS)) {
      assert.equal(plan.keys.includes(url),[110,190].includes(number),`${number}: ${url}`);
      assert.equal(getSceneAssetPlan(state,{formationOnly:true}).keys.includes(url),false);
    }
  }
});

test('live scene renders the new boss and its side/down shots, bomb and single blast without extra loads',async t=>{
  const env=createSceneEnvironment();t.after(()=>env.restore());const OriginalImage=globalThis.Image;
  globalThis.Image=class extends OriginalImage {
    set src(value) {
      if(value.includes('/goblin-bombardier/'))this.width=this.height=this.naturalWidth=this.naturalHeight=value.endsWith('/body.webp')?512:128;
      super.src=value;
    }
    get src(){return super.src;}
  };
  const canvas=env.canvas(),scene=env.keep(await createScene(canvas)),battle=createBattle([],110);
  for(let i=0;i<54;i++) updateBattle(battle,1/60);
  await scene.prepare({battle});const loaded=env.requests.length;
  const boss=battle.enemies.find(e=>e.type==='goblinBombardier');
  for(const [x,y,frame] of [[1,0,10],[-1,0,10],[0,1,14],[0,-1,10]]) {
    Object.assign(boss,{action:'shoot',actionDuration:1.4,actionTime:.77,impactFraction:.55,facingX:x,facingY:y});
    canvas.clear();scene.render({battle});
    const draw=canvas.commands.find(([method,image])=>method==='drawImage'&&image.includes('/goblin-bombardier/body.webp'));
    assert.ok(draw);assert.deepEqual(draw.slice(2,6),Object.values(GOBLIN_BOMBARDIER_FRAMES[frame].rect));
    assert.equal(canvas.saveDepth,0);
  }
  const base={id:999,x:195,y:150-27,targetX:195,targetY:260-27,age:.1,duration:.5,side:'enemy',sourceType:'goblinBombardier',sourceId:boss.id,targetId:'hero'};
  for(const kind of ['arrow','cannon-impact']) {
    battle.projectiles=kind==='arrow'?[{...base,type:kind,damage:18,launchFacing:{x:0,y:1}}]:[];
    battle.effects=kind==='cannon-impact'?[{...base,type:kind,duration:.4}]:[];
    const before=structuredClone({projectiles:battle.projectiles,effects:battle.effects});
    canvas.clear();scene.render({battle});
    const expected=kind==='arrow'?'bomb.webp':'explosion.webp';
    assert.equal(canvas.commands.filter(([method,image])=>method==='drawImage'&&image.includes('/'+expected)).length,1);
    assert.deepEqual({projectiles:battle.projectiles,effects:battle.effects},before,'drawing cannot advance the bomb or resolve damage');
    if(kind==='arrow') assert.deepEqual(battle.effects,[],'bomb flight is independent of cosmetic retention');
    assert.equal(env.requests.length,loaded);assert.equal(canvas.saveDepth,0);
  }
  battle.effects[0].age=.4;canvas.clear();scene.render({battle});
  assert.equal(canvas.commands.some(([method,image])=>method==='drawImage'&&image.includes('/explosion.webp')),false);
});
