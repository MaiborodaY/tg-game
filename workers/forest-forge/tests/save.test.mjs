import { freshGame } from '../../../forest-forge/game.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/index.mjs';

const token = '123456:local-test-token';
function initData(userId = 90001, age = 0) {
  const params = new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)-age), user:JSON.stringify({id:userId,first_name:'New player'})});
  const check = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256','WebAppData').update(token).digest();
  params.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
  return params.toString();
}
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_saves.sql', import.meta.url),'utf8'));
  db.exec(readFileSync(new URL('../migrations/0002_active_session.sql', import.meta.url),'utf8'));
  return { db, env:{BOT_TOKEN:token, SAVES:{prepare(sql) { return {bind(...args) { return {
    async first() { return db.prepare(sql).get(...args) || null; },
    async run() { return db.prepare(sql).run(...args); },
  }; }}; }}} };
}
const request = (data, body) => new Request('https://game.example/api/save', {
  method:body === undefined ? 'GET' : 'PUT', headers:{'x-telegram-init-data':data},
  ...(body === undefined ? {} : {body:typeof body === 'string' ? body : JSON.stringify(body)}),
});

test('cloud API requires authentic recent Telegram identity before any database access', async () => {
  const env = {BOT_TOKEN:token};
  for (const data of ['',initData().replace('New+player','Impostor'),initData(90001,7201),initData(90001,-120)]) {
    const response = await worker.fetch(request(data),env);
    assert.equal(response.status,401);
  }
  const valid = initData();
  assert.equal((await worker.fetch(request(valid+'&user=other'),env)).status,401);
  assert.equal((await worker.fetch(request(valid),{})).status,503);
});

test('first Telegram player starts clean and independent of WoL or another player', async () => {
  const {db,env}=fixture();
  try {
    const a=await (await worker.fetch(request(initData()),env)).json();
    assert.equal(a.revision,0); assert.equal(a.state.coins,0); assert.equal(a.state.hammers,15);
    assert.ok(Object.values(a.state.equipment).every(v=>v===null));
    const before=Date.now(); assert.ok(a.state.idleSince <= before && a.state.idleSince > before-3000);
    a.state.coins=75; a.state.hammers=22; a.state.runes=3;
    assert.equal((await worker.fetch(request(initData(),{state:a.state,revision:a.revision}),env)).status,200);
    const other=await (await worker.fetch(request(initData(90002)),env)).json();
    assert.equal(other.state.coins,0); assert.equal(other.state.hammers,15);
    const again=await (await worker.fetch(request(initData()),env)).json();
    assert.equal(again.state.coins,75); assert.equal(again.state.hammers,22); assert.equal(again.revision,1); assert.equal(again.state.runes,3);
  } finally { db.close(); }
});

test('one revision can be written once; stale and malformed saves preserve the current state', async () => {
  const {db,env}=fixture(); const data=initData();
  try {
    const original=await (await worker.fetch(request(data),env)).json();
    const next={state:{...original.state,coins:120},revision:0};
    const results=await Promise.all([worker.fetch(request(data,next),env),worker.fetch(request(data,{...next,state:{...next.state,coins:999}}),env)]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    assert.equal((await worker.fetch(request(data,'{broken'),env)).status,400);
    assert.equal((await worker.fetch(request(data,{revision:1,state:{version:3}}),env)).status,400);
    assert.equal((await worker.fetch(request(data,'x'.repeat(1_000_001)),env)).status,413);
    const saved=await (await worker.fetch(request(data),env)).json();
    assert.equal(saved.revision,1); assert.equal(saved.state.coins,120);
  } finally { db.close(); }
});


test('reset replaces saved progress and stale pre-reset writes cannot restore it',async()=>{
 const {db,env}=fixture(),data=initData();
 try{
  const original=await (await worker.fetch(request(data),env)).json();
  original.state.coins=999;original.state.anvilLevel=11;original.state.mine.level=8;
  await worker.fetch(request(data,{state:original.state,revision:0}),env);
  const reset=freshGame();
  assert.equal((await worker.fetch(request(data,{state:reset,revision:1}),env)).status,200);
  assert.equal((await worker.fetch(request(data,{state:original.state,revision:1}),env)).status,409);
  const saved=await (await worker.fetch(request(data),env)).json();
  assert.equal(saved.revision,2);assert.deepEqual(saved.state,reset);
 }finally{db.close();}
});

test('latest explicit session owns saves; old devices and legacy clients cannot take over by loading', async()=>{
 const {db,env}=fixture(),data=initData();
 const claim=()=>worker.fetch(new Request('https://game.example/api/save',{method:'POST',headers:{'x-telegram-init-data':data}}),env);
 try{
   const desktop=await (await claim()).json();
   desktop.state.coins=500;
   assert.equal((await worker.fetch(request(data,{state:desktop.state,revision:0,session:desktop.session}),env)).status,200);
   const phone=await (await claim()).json();
   assert.equal(phone.state.coins,500);assert.equal(phone.revision,1);
   assert.notEqual(phone.session,desktop.session);
   const stale=await worker.fetch(request(data,{state:{...desktop.state,coins:999},revision:1,session:desktop.session}),env);
   assert.equal(stale.status,409);assert.equal((await stale.json()).error,'session_replaced');
   const readonly=await (await worker.fetch(request(data),env)).json();
   assert.equal(readonly.session,undefined);
   assert.equal((await worker.fetch(request(data,{state:readonly.state,revision:1}),env)).status,409);
   phone.state.coins=700;
   assert.equal((await worker.fetch(request(data,{state:phone.state,revision:1,session:phone.session}),env)).status,200);
   const back=await (await claim()).json();
   assert.equal(back.state.coins,700);assert.equal(back.revision,2);
   assert.equal((await worker.fetch(request(data,{state:phone.state,revision:2,session:phone.session}),env)).status,409);
   assert.equal((await worker.fetch(request(data,{state:back.state,revision:2,session:back.session}),env)).status,200);
 }finally{db.close();}
});

test('session migration preserves existing hero data and revision',()=>{
 const db=new DatabaseSync(':memory:');
 try{
   db.exec(readFileSync(new URL('../migrations/0001_saves.sql',import.meta.url),'utf8'));
   const state=JSON.stringify({...freshGame(),coins:321});
   db.prepare('INSERT INTO player_saves VALUES (?, ?, ?, ?)').run('90001',state,17,123456);
   db.exec(readFileSync(new URL('../migrations/0002_active_session.sql',import.meta.url),'utf8'));
   const row=db.prepare('SELECT * FROM player_saves').get();
   assert.equal(row.state_json,state);assert.equal(row.revision,17);assert.equal(row.updated_at,123456);assert.equal(row.active_session,null);
 }finally{db.close();}
});
