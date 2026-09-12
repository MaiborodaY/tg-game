const {chromium,webkit}=require('C:/Users/Waldiris/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4176/?dungeons=1&debug=1');await page.waitForFunction(()=>!!window.__forestForge);
   // Isolated browser storage; no user save or cloud account is used.
   await page.evaluate(async()=>{const {SAVE_KEY}=await import('./game.mjs');localStorage.setItem(SAVE_KEY,JSON.stringify(window.__forestForge.snapshot()));});
   await page.goto('http://127.0.0.1:4176/?debug=1');await page.waitForFunction(()=>!!window.__forestForge);
   const destinations=await page.evaluate(()=>['.money > .coin','.hammer-balance > .hammer-icon','#mine-toggle img'].map(q=>{const r=document.querySelector(q).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};}));
   await page.locator('#dungeons-toggle').click();
   for(let i=0;i<3;i++){
    await page.locator('.dungeon-card-action button').nth(i).click();
    assert.equal(await page.locator('#dungeon-floor').textContent(),'Stage 1–10');
    assert.equal(await page.locator('#dungeon-keys').textContent(),'2/2');
    assert.equal(await page.locator('#dungeon-info').isVisible(),false);
    assert.equal(await page.locator('#dungeon-fight').textContent(),'Enter');
    await page.waitForFunction(()=>['dungeon-boss-art','dungeon-banner'].every(id=>{const i=document.getElementById(id);return i.complete&&i.naturalWidth>0;}));
    await page.screenshot({path:`forest-forge/design/dungeons/detail-${engine.name()}-${i}.png`});
    await page.locator('#dungeon-info-toggle').click();assert.ok(await page.locator('#dungeon-info').isVisible());
    assert.ok((await page.locator('#dungeon-sweep-info').textContent()).includes('1–9'));
    await page.locator('#dungeon-info-toggle').click();
    // Browsing an older stage must not change Sweep Last's target.
    await page.locator('#dungeon-prev').click();await page.locator('#dungeon-prev').click();
    const before=await page.evaluate(async index=>{const {dungeonRewards,DUNGEONS}=await import('./game.mjs');const s=window.__forestForge.snapshot();return {coins:s.coins,hammers:s.hammers,ore:s.mine.ore,cleared:s.dungeons.cleared,loot:dungeonRewards(s,DUNGEONS[index].id,s.dungeons.cleared[index])};},i);
    await page.locator('#dungeon-sweep').click();
    assert.equal(await page.evaluate(()=>window.__forestForge.snapshot().dungeons.run),null);
    await page.waitForSelector('.dungeon-reward-burst');
    await page.evaluate(()=>document.getElementById('reward-flight').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=500;}));
    const endpoint=await page.locator('.reward-particle').first().evaluate(el=>{const m=new DOMMatrix(el.getAnimations()[0].effect.getKeyframes().at(-1).transform),r=el.parentElement.getBoundingClientRect();return {x:r.x+m.m41+el.offsetWidth/2,y:r.y+m.m42+el.offsetHeight/2};});
    assert.ok(Math.abs(endpoint.x-destinations[i].x)<1);assert.ok(Math.abs(endpoint.y-destinations[i].y)<1);
    assert.ok(await page.locator('#dungeon-hub').isVisible());assert.equal(await page.locator('dialog[open]').count(),0);
    await page.evaluate(()=>document.getElementById('reward-flight').getAnimations({subtree:true}).forEach(a=>a.finish()));
    await page.waitForFunction(()=>!document.getElementById('game').inert);
    const after=await page.evaluate(()=>window.__forestForge.snapshot());
    assert.equal(after.coins,before.coins+before.loot.coins);assert.equal(after.hammers,before.hammers+before.loot.hammers);
    assert.deepEqual(after.mine.ore,before.ore.map((n,j)=>n+(before.loot.ore[j]||0)));assert.deepEqual(after.dungeons.cleared,before.cleared);assert.equal(after.dungeons.wins[i],1);
    await page.locator('.dungeon-card-action button').nth(i).click();assert.equal(await page.locator('#dungeon-keys').textContent(),'1/2');
    await page.locator('#dungeon-sweep').click();await page.waitForFunction(()=>!document.getElementById('game').inert);
    await page.locator('.dungeon-card-action button').nth(i).click();assert.equal(await page.locator('#dungeon-keys').textContent(),'0/2');
    assert.ok(await page.locator('#dungeon-sweep').isDisabled());assert.ok(await page.locator('#dungeon-fight').isDisabled());
    await page.locator('#close-dungeons').click();
   }
   await page.reload();await page.waitForFunction(()=>!!window.__forestForge);await page.locator('#dungeons-toggle').click();
   assert.deepEqual(await page.evaluate(()=>window.__forestForge.snapshot().dungeons.wins),[2,2,2]);
   // Also inspect narrow phones and the untouched no-clear state.
   const seed=await page.evaluate(async()=>{const {SAVE_KEY}=await import('./game.mjs');const s=window.__forestForge.snapshot();s.dungeons.cleared=[0,0,0];s.dungeons.wins=[0,0,0];return {key:SAVE_KEY,s};});
   await page.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),seed);
   await page.goto('http://127.0.0.1:4176/?debug=1');await page.waitForFunction(()=>!!window.__forestForge);await page.locator('#dungeons-toggle').click();
   await page.setViewportSize({width:320,height:568});await page.locator('.dungeon-card-action button').nth(2).click();
   assert.ok(await page.locator('#dungeon-sweep').isDisabled());assert.ok(await page.locator('#dungeon-fight').isEnabled());
   assert.equal(await page.locator('#dungeon-floor').textContent(),'Stage 1–1');
   await page.screenshot({path:`forest-forge/design/dungeons/detail-${engine.name()}-320.png`});
   const box=await page.locator('#dungeons-dialog').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=320&&box.y+box.height<=568);
   await page.locator('#dungeon-info-toggle').click();
   assert.ok(await page.locator('#dungeons-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
   await page.locator('#dungeon-fight').scrollIntoViewIfNeeded();assert.ok(await page.locator('#dungeon-fight').isVisible());
   await page.screenshot({path:`forest-forge/design/dungeons/detail-${engine.name()}-info.png`});
   await page.locator('#close-dungeons').click();await page.locator('.dungeon-card-action button').nth(2).click();assert.ok(await page.locator('#dungeon-info').isHidden());
   assert.deepEqual(errors,[]);
   console.log(`${engine.name()}: three Sweep payouts, exact flight targets, key limits, reload, locked Sweep, 320px layout and details passed.`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
