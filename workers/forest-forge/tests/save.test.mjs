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
    assert.equal(a.revision,0); assert.equal(a.state.coins,0); assert.equal(a.state.hammers,5);
    assert.ok(Object.values(a.state.equipment).every(v=>v===null));
    const before=Date.now(); assert.ok(a.state.idleSince <= before && a.state.idleSince > before-3000);
    a.state.coins=75; a.state.hammers=22;
    assert.equal((await worker.fetch(request(initData(),{state:a.state,revision:a.revision}),env)).status,200);
    const other=await (await worker.fetch(request(initData(90002)),env)).json();
    assert.equal(other.state.coins,0); assert.equal(other.state.hammers,5);
    const again=await (await worker.fetch(request(initData()),env)).json();
    assert.equal(again.state.coins,75); assert.equal(again.state.hammers,22); assert.equal(again.revision,1);
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
