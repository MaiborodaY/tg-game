import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { observedCombatModule, prependFunctionBody } from './helpers/browser-instrumentation.mjs';

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

test('UI combat guard instruments the implementation in TS and transformed JS without duplicate exports', async () => {
  const source = `export let calls = 0;
    export function updateBattle(value: number): number;
    export function updateBattle(value: number): number { calls++; return value; }
    export const note = 'function updateBattle() { this is not code }';`;
  for (const input of [source, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText]) {
    const guarded = prependFunctionBody(input, 'updateBattle', 'throw new Error("Combat must not run in UI checks");');
    const output = ts.transpileModule(guarded, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const module = await import(moduleUrl(output));
    assert.throws(() => module.updateBattle(5), /Combat must not run/);
    assert.equal(module.calls, 0);
    assert.equal(module.note, 'function updateBattle() { this is not code }');
  }
  assert.throws(() => prependFunctionBody('export const missing = true;', 'updateBattle', ''), /Expected one updateBattle/);
});

test('hero observer preserves other exports, captures real battle state and supports hold and fast modes', async t => {
  const names = ['__heroTestBattle', '__heroTestHold', '__heroTestFast'];
  const descriptors = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const name of names) delete globalThis[name];
  t.after(() => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const original = moduleUrl(`export const marker = 'original';
    export function createBattle(wave) { return { wave, steps: 0 }; }
    export function updateBattle(battle, dt) { battle.steps++; return [{ step: battle.steps, dt }]; }`);
  const module = await import(moduleUrl(observedCombatModule(original)));
  const battle = module.createBattle(7);
  assert.equal(globalThis.__heroTestBattle, battle);
  assert.equal(module.marker, 'original');
  assert.deepEqual(module.updateBattle(battle, .1), [{ step: 1, dt: .1 }]);
  globalThis.__heroTestHold = true;
  assert.deepEqual(module.updateBattle(battle, .1), []);
  assert.equal(battle.steps, 1);
  globalThis.__heroTestHold = false;
  globalThis.__heroTestFast = true;
  const events = module.updateBattle(battle, .1);
  assert.equal(events.length, 40);
  assert.equal(battle.steps, 41);
  assert.deepEqual(events[39], { step: 41, dt: .1 });
});
