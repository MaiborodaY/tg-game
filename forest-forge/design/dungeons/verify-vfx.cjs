const {chromium,webkit}=require('C:/Users/Waldiris/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.fxDraws=[];window.liveGradients=0;
    const draw=CanvasRenderingContext2D.prototype.drawImage,gradient=CanvasRenderingContext2D.prototype.createRadialGradient;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(this.canvas.id==='scene'&&source.width===768&&source.height===384){window.fxDraws.push({frame:args[0]/128,row:args[1]/128,x:args[4],y:args[5],size:args[6]});if(window.fxDraws.length>300)window.fxDraws.shift();}return draw.call(this,source,...args);};
    CanvasRenderingContext2D.prototype.createRadialGradient=function(...args){if(this.canvas.id==='scene')window.liveGradients++;return gradient.apply(this,args);};
  });
  await page.goto('http://127.0.0.1:4176/?dungeons=1&debug=1');await page.waitForFunction(()=>!!window.__forestForge);
  await page.evaluate(async()=>{const {SAVE_KEY,stats,DAMAGE_SLOTS}=await import('./game.mjs');const s=window.__forestForge.snapshot();s.selectedCompanion=null;s.companion=null;for(const [slot,item] of Object.entries(s.equipment))item.value=DAMAGE_SLOTS.includes(slot)?1:1000000;s.hp=stats(s).hp;localStorage.setItem(SAVE_KEY,JSON.stringify(s));});
  await page.goto('http://127.0.0.1:4176/?debug=1');await page.waitForFunction(()=>!!window.__forestForge);await page.locator('#dungeons-toggle').click();
  for(const [index,id] of ['treasury','forge','mine'].entries()){
   await page.locator('.dungeon-card-action button').nth(index).click();await page.locator('#dungeon-fight').click();
   if(index===0){
     await page.evaluate(()=>{const a=document.getElementById('dungeon-transition').getAnimations().at(-1);a.pause();a.currentTime=100;});
     assert.equal(await page.evaluate(()=>window.__forestForge.snapshot().dungeons.run),null);
     assert.ok(await page.locator('#dungeon-hub').isVisible());
     await page.screenshot({path:`forest-forge/design/dungeons/entry-${engine.name()}-out.png`});
     await page.evaluate(()=>document.getElementById('dungeon-transition').getAnimations().at(-1).finish());
     await page.waitForFunction(()=>!!window.__forestForge.snapshot().dungeons.run);
     await page.evaluate(()=>{const a=document.getElementById('dungeon-transition').getAnimations().at(-1);a.pause();a.currentTime=110;});
     await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>window.__forestForge.snapshot().dungeons.run.battle.dungeonBattle.time),0);
     await page.screenshot({path:`forest-forge/design/dungeons/entry-${engine.name()}-in.png`});
     await page.evaluate(()=>document.getElementById('dungeon-transition').getAnimations().at(-1).finish());
   }
   await page.waitForFunction(()=>!!window.__forestForge.snapshot().dungeons.run&&!document.getElementById('game').inert);
   await page.evaluate(()=>{window.fxDraws.length=0;window.liveGradients=0;});
   const moments=id==='treasury'?[9.25,10.3,12.5]:id==='forge'?[8.35,9.7,10.02]:[19.5,20.1,21.2];
   for(const [i,target] of moments.entries()){
    await page.evaluate(t=>{const now=window.__forestForge.snapshot().dungeons.run.battle.dungeonBattle.time;window.__forestForge.advance(Math.max(0,t-now));},target);
    await page.waitForTimeout(id==='forge'&&i===2?35:70);
    const evidence=await page.evaluate(()=>({time:window.__forestForge.snapshot().dungeons.run.battle.dungeonBattle.time,draws:window.fxDraws.slice(-8),gradients:window.liveGradients}));
    assert.equal(evidence.gradients,0);
    await page.screenshot({path:`forest-forge/design/dungeons/vfx-${engine.name()}-${id}-${i}.png`});
    console.log(engine.name(),id,i,'frames',evidence.draws.map(d=>`${d.row}:${d.frame}`).join(','),'gradients',evidence.gradients);
   }
   const rows=await page.evaluate(()=>[...new Set(window.fxDraws.map(d=>d.row))]);
   assert.ok(rows.includes(0));if(id!=='treasury')assert.ok(rows.includes(id==='forge'?2:1));
   if(id==='mine')assert.ok(rows.includes(2));
   await page.locator('#dungeon-leave').click();await page.waitForFunction(()=>!document.getElementById('game').inert);
   await page.locator('#dungeons-toggle').click();await page.evaluate(()=>window.fxDraws.length=0);await page.waitForTimeout(90);
   assert.equal(await page.evaluate(()=>window.fxDraws.length),0,'Dungeon effects leaked into adventure');
   await page.locator('#dungeons-toggle').click();
  }
  // A charged hit must flash on the turtle when it intercepts, not on the hero.
  const seed=await page.evaluate(async()=>{const {SAVE_KEY}=await import('./game.mjs');const s=window.__forestForge.snapshot();s.selectedCompanion='turtle';s.companion=null;s.turtleLevel=100;return {key:SAVE_KEY,s};});
  await page.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),seed);
  await page.goto('http://127.0.0.1:4176/?debug=1');await page.waitForFunction(()=>!!window.__forestForge);await page.locator('#dungeons-toggle').click();
  await page.locator('.dungeon-card-action button').nth(1).click();await page.locator('#dungeon-fight').click();
  await page.waitForFunction(()=>!!window.__forestForge.snapshot().dungeons.run&&!document.getElementById('game').inert);
  await page.evaluate(()=>{window.__forestForge.advance(9.9);window.fxDraws.length=0;window.__forestForge.advance(.15);});await page.waitForTimeout(45);
  const impact=await page.evaluate(()=>{const b=window.__forestForge.snapshot().dungeons.run.battle,fx=window.fxDraws.filter(d=>d.row===2).at(-1);return {fx,target:(b.companion.x-b.heroX+.24)*390,hero:.24*390};});
  assert.ok(impact.fx);assert.ok(Math.abs(impact.fx.x+impact.fx.size/2-impact.target)<2);assert.ok(impact.target>impact.hero+20);
  await page.screenshot({path:`forest-forge/design/dungeons/vfx-${engine.name()}-turtle.png`});
  await page.locator('#dungeon-leave').click();await page.waitForFunction(()=>!document.getElementById('game').inert);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.dungeon-card-action button').nth(1).click();await page.locator('#dungeon-fight').click();
  await page.waitForFunction(()=>!!window.__forestForge.snapshot().dungeons.run&&!document.getElementById('game').inert);
  await page.evaluate(()=>{window.__forestForge.advance(9.7);window.fxDraws.length=0;});await page.waitForTimeout(40);
  assert.ok(await page.evaluate(()=>window.fxDraws.every(d=>d.row===0)));
  await page.evaluate(()=>{window.__forestForge.advance(.4);window.fxDraws.length=0;});await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>window.fxDraws.length),0);
  await page.locator('#dungeon-leave').click();await page.waitForFunction(()=>!document.getElementById('game').inert);
  await page.route('**/forge-animation.webp',route=>route.abort());
  await page.locator('.dungeon-card-action button').nth(1).click();await page.locator('#dungeon-fight').click();
  await page.waitForFunction(()=>!document.getElementById('game').inert);
  assert.equal(await page.evaluate(()=>window.__forestForge.snapshot().dungeons.run),null);assert.ok(await page.locator('#dungeon-hub').isVisible());assert.ok(await page.locator('#dungeon-transition').isHidden());
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': boss effects, turtle interception, reduced motion, entry fades and failed-load cleanup passed.');
 }finally{await browser.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
