// Run with node; PLAYWRIGHT_MODULE may point to an installed Playwright entry file.
// The server instruments the app only in memory; combat updates are forbidden.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';
import { listenBrowserServer } from './helpers/browser-server.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prependFunctionBody } from './helpers/browser-instrumentation.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../../.tmp/drag-merge/', import.meta.url);
let baseUrl;
const server = await createServer({
  cacheDir: fileURLToPath(new URL('../../.tmp/browser-vite/drag-merge/', import.meta.url)), root, configFile: false, server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'drag-test-hooks', enforce: 'pre', transform(code, id) {
    if (id.endsWith('/combat.ts')) {
      return prependFunctionBody(code, 'updateBattle', 'throw new Error("Combat must not run in UI checks");');
    }
    if (id.endsWith('/main.ts')) return code + `
window.dragCheck = {
      ready: () => !!scene && !!armyScene,
      freeze: () => { stopFrames(); clearInterval(economyTimer); },
      refresh,
      state: () => JSON.parse(JSON.stringify({ units: campaign.units, reserve: campaign.reserve, gold: campaign.gold, slaves: campaign.economy.slaves, recruitment: campaign.recruitment })),
      drag: () => ({ active: unitDrag.active, tracking: unitDrag.tracking, targets: mergeTargetIds, source: draggedMerge?.source }),
      invalidateTarget: id => { campaign.units = campaign.units.map(u => u.id === id ? {...u, type: 'archer'} : u); refresh(); },
    };`;
  } }] });
let browser;
const checks = [];
try {
  await mkdir(output, { recursive: true });
  baseUrl = await listenBrowserServer(server);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 700 }, isMobile: true, hasTouch: true });
    await context.route('https://telegram.org/**', route => route.abort());
    await context.addInitScript(() => {
      if (localStorage.getItem('brotd-infinity:campaign:v2')) return;
      localStorage.setItem('brotd-infinity:campaign:v2', JSON.stringify({ campaignVersion: 3,
        gold: 250, starterSupplyGranted: true, autoWaves: false, autoWavesDefaultVersion: 1,
        units: [{type:'swordsman',level:2,col:2,row:0},{type:'swordsman',level:3,col:2,row:1},
          {type:'archer',level:1,col:2,row:2},{type:'swordsman',level:98,col:3,row:0}],
        reserve: Array.from({length:11}, (_,i) => ({type:i === 9 ? 'healer' : 'swordsman', level:1})),
        progression: { unlockedCells: ['2:0','2:1','2:2','3:0','3:1'] }, economy: { slaves: 7 },
      }));
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.log('pageerror',error.stack); });
    const cdp = await context.newCDPSession(page);
    const ready = async () => {
      await page.waitForFunction(() => window.dragCheck?.ready());
      await page.evaluate(async () => { window.dragCheck.freeze(); await document.fonts.ready; });
    };
    await page.goto(baseUrl); await ready();
    const read = () => page.evaluate(() => window.dragCheck.state());
    const cell = (col, row) => page.evaluate(({col,row}) => {
      const canvas = document.querySelector('#army-map'), r = canvas.getBoundingClientRect();
      const scale = Number(canvas.dataset.worldScale);
      return { x: r.x + Number(canvas.dataset.worldOffsetX) + (50 + (col+.5)*58)*scale,
        y: r.y + (r.height-184*scale)/2 + (270+(row+.5)*55-260)*scale };
    }, {col,row});
    const center = async selector => { const r = await page.locator(selector).boundingBox(); return {x:r.x+r.width/2,y:r.y+r.height/2}; };
    const send = (type, points) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: points.map((p,i) => ({...p,id:i+1,radiusX:2,radiusY:2,force:1})) });
    const down = point => send('touchStart',[point]);
    const move = point => send('touchMove',[point]);
    const up = () => send('touchEnd',[]);
    const hold = async point => { await down(point); await page.waitForTimeout(510); };
    const ghost = () => page.locator('.unit-drag-ghost').count();
    const close = () => page.locator('#barracks-panel [data-close-overlay]').click();
    let before = await read();

    await page.touchscreen.tap(...Object.values(await cell(2,0)));
    assert.equal(await page.locator('#unit-panel').isVisible(),true);
    assert.equal(await page.locator('#selection-panel .connect-inline').isVisible(),true);
    await page.locator('#unit-panel [data-close-overlay]').click();
    await hold(await cell(2,0));
    assert.equal(await ghost(),1);
    assert.deepEqual(await page.evaluate(() => window.dragCheck.drag().targets),[2,4]);
    await up();
    assert.equal(await ghost(),0); assert.deepEqual(await read(),before);
    assert.equal(await page.locator('#unit-panel').isVisible(),false);

    for (const destination of [await cell(2,0),await cell(2,2),await cell(3,1),await cell(0,0),{x:1,y:1}]) {
      await hold(await cell(2,0)); await move(destination); await up();
      assert.deepEqual(await read(),before); assert.equal(await ghost(),0);
    }
    await hold(await cell(2,0)); await move(await cell(2,1));
    assert.equal(await page.locator('.unit-drag-ghost.is-valid').count(),1);
    await page.screenshot({ path: fileURLToPath(new URL(`brotd-drag-merge-${width}.png`, output)) });
    await up();
    let after = await read();
    assert.equal(after.units.length,3); assert.equal(after.units.find(u=>u.id===2).level,5);
    assert.equal(after.gold,before.gold); assert.equal(after.slaves,before.slaves);
    assert.deepEqual(after.recruitment,before.recruitment);
    await page.evaluate(() => document.querySelector('#army-map').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));
    assert.deepEqual(await read(),after); assert.equal(await page.locator('#unit-panel').isVisible(),false);

    await page.locator('#open-barracks').click();
    let icon = '[data-barracks-unit-id="5"]';
    await page.locator(icon).tap();
    assert.equal(await page.locator('#barracks-detail').isVisible(),true);
    for (const attr of ['recruit','sell']) assert.equal(await page.locator(`[data-barracks-${attr}-id="5"]`).isVisible(),true);
    assert.equal(await page.locator('#barracks-detail [data-connect-action="begin"]').isVisible(),true);
    await page.locator('#barracks-back').click();
    before = await read();
    await hold(await center('[data-barracks-unit-id="14"]'));
    await page.evaluate(() => window.dragCheck.refresh());
    assert.equal(await ghost(),0); await up(); // No matching deployed healer.
    assert.deepEqual(await read(),before);
    await page.locator('#barracks-next').click();
    await hold(await center('[data-barracks-unit-id="15"]'));
    await move({x:1,y:1}); await up();
    assert.equal(await page.locator('#barracks-page').textContent(),'2 / 2');
    assert.deepEqual(await read(),before);
    await page.locator('#barracks-prev').click();
    await hold(await center(icon));
    assert.equal(await ghost(),1); assert.equal(await page.locator('#barracks-panel').isVisible(),false);
    await page.evaluate(() => window.dragCheck.refresh()); // Source DOM must survive refresh while held.
    await move({x:1,y:1}); await up();
    assert.deepEqual(await read(),before); assert.equal(await page.locator('#barracks-panel').isVisible(),true);
    await hold(await center(icon)); await page.keyboard.press('Escape'); await up();
    assert.deepEqual(await read(),before); assert.equal(await ghost(),0);
    await hold(await center(icon)); await send('touchCancel',[]);
    assert.deepEqual(await read(),before); assert.equal(await ghost(),0);
    const iconPoint = await center(icon);
    await hold(iconPoint); await send('touchStart',[iconPoint,{x:width-2,y:2}]); await up();
    assert.deepEqual(await read(),before); assert.equal(await ghost(),0);
    await hold(await center(icon)); await move(await cell(2,1)); await up();
    after = await read(); assert.equal(after.reserve.length,10); assert.equal(after.units.find(u=>u.id===2).level,6);
    assert.equal(after.gold,before.gold); assert.equal(after.slaves,before.slaves);

    // Native scroll before hold must cancel pickup and preserve the contact through refresh.
    await page.locator('#open-barracks').click();
    await page.addStyleTag({content:'.barracks-card { max-height: 185px !important; overflow-y:auto !important; }'});
    icon = '[data-barracks-unit-id="6"]';
    const scrollStart = await center(icon);
    await down(scrollStart); await move({x:scrollStart.x,y:scrollStart.y-40});
    await page.evaluate(() => window.dragCheck.refresh());
    await page.waitForTimeout(510);
    assert.equal(await ghost(),0);
    assert.ok(await page.locator('.barracks-card').evaluate(el=>el.scrollTop)>0);
    await up();
    await page.locator('.barracks-card').evaluate(el=>{el.style.setProperty('max-height','500px','important');el.scrollTop=0;});
    await page.waitForTimeout(80);
    before = await read();
    await hold(await center(icon)); assert.equal(await ghost(),1);
    await move({x:1,y:1}); await up(); assert.deepEqual(await read(),before);
    await close();
    await page.reload(); await ready();
    after = await read();
    assert.equal(after.units.find(u=>u.col===2&&u.row===1).level,6);
    assert.equal(after.reserve.length,10);
    assert.equal(after.gold,before.gold); assert.equal(after.slaves,before.slaves);
    assert.deepEqual({ units: after.units, reserve: after.reserve }, { units: before.units, reserve: before.reserve },
      'reload keeps fighter IDs stable after earlier fighters were consumed');

    // Mouse capture survives closing Barracks and Connect continues past level 100.
    for (const reserveId of [6,7,8]) {
      await page.locator('#open-barracks').click();
      const source = await center(`[data-barracks-unit-id="${reserveId}"]`);
      await page.mouse.move(source.x,source.y); await page.mouse.down(); await page.waitForTimeout(510);
      assert.equal(await ghost(),1);
      const target = await cell(3,0);
      await page.mouse.move(target.x,target.y,{steps:5}); await page.mouse.up();
      assert.equal(await ghost(),0);
    }
    after = await read(); assert.equal(after.units.find(u=>u.col===3&&u.row===0).level,101);
    assert.equal(after.reserve.length,7);
    assert.equal(after.gold,before.gold); assert.equal(after.slaves,before.slaves);

    // Existing button route and ordinary controls still respond after captured drags.
    await page.locator('#open-barracks').click();
    await page.locator('[data-barracks-unit-id="9"]').tap();
    assert.match(await page.locator('#barracks-detail [data-connect-action="begin"]').innerText(), /Connect/);
    assert.doesNotMatch(await page.locator('#barracks-panel').innerText(), /\bmerge\b/i);
    await close();
    await page.touchscreen.tap(...Object.values(await cell(2,1)));
    await page.locator('[data-connect-donor-id="9"]:visible').tap();
    await page.locator('[data-connect-action="apply"]:visible').tap();
    after = await read(); assert.equal(after.units.find(u=>u.col===2&&u.row===1).level,7);
    await page.locator('#unit-panel [data-close-overlay]').click();
    before = after;
    // Legality can change after pickup. Reject at release without consuming the source.
    await page.locator('#open-barracks').click();
    await hold(await center('[data-barracks-unit-id="10"]'));
    const changedTarget = before.units.find(u=>u.col===2&&u.row===1).id;
    await page.evaluate(id=>window.dragCheck.invalidateTarget(id),changedTarget);
    const staleState = await read();
    await move(await cell(2,1)); await up();
    assert.deepEqual(await read(),staleState); assert.equal(await ghost(),0);
    assert.equal(await page.locator('#barracks-panel').isVisible(),true);
    assert.deepEqual(errors,[]);
    checks.push({width,touch:true,mouse:true,tap:true,armyMerge:true,reserveMerge:true,cancellation:true,
      nativeScroll:true,reload:true,aboveLevel100:true,staleTarget:true,mergeButton:true,combatUpdates:0});
    await context.close();
  }
  console.log(JSON.stringify({ok:true,checks}));
} finally { await browser?.close(); await server.close(); }
