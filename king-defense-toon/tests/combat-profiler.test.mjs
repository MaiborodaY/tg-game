import assert from 'node:assert/strict';
import test from 'node:test';
import { createCombatProfiler, collectProfilerCounters, DEFAULT_PROFILER_CAPACITY, MAX_PROFILER_CAPACITY } from '../combat-profiler.ts';
import { createBattle } from '../combat.ts';

const counters = (changes = {}) => ({ wave: 1, speed: 1, allies: 4, enemies: 7, projectiles: 2, effects: 9, poisoned: 1, ...changes });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
function fixture(options = {}) {
  let time = 0, reads = 0;
  const profiler = createCombatProfiler({ enabled: true, now: () => { reads += 1; return time; }, ...options });
  return { profiler, get reads() { return reads; }, advance(amount) { time += amount; }, setTime(value) { time = value; },
    frame(timestamp, work, value = counters()) { profiler.beginFrame(timestamp); time += work; profiler.endFrame(value); } };
}

test('default-disabled profiler reads no clock, allocates no sample arrays and never inspects counters', () => {
  const OriginalFloat = globalThis.Float64Array, OriginalUint = globalThis.Uint32Array;
  let invoked = 0, reads = 0;
  globalThis.Float64Array = class { constructor() { throw new Error('disabled history allocation'); } };
  globalThis.Uint32Array = class { constructor() { throw new Error('disabled depth allocation'); } };
  try {
    const profiler = createCombatProfiler({ now: () => { reads += 1; throw new Error('disabled clock'); } });
    assert.equal(profiler.enabled, false);
    const forbiddenCounters = new Proxy({}, { get() { throw new Error('disabled counter copy'); } });
    const value = {};
    for (let index = 0; index < 20; index += 1) {
      profiler.beginFrame(index * 34);
      assert.equal(profiler.measure('simulation', () => { invoked += 1; return value; }), value);
      profiler.endFrame(forbiddenCounters);
    }
    const error = new Error('game error');
    assert.throws(() => profiler.measure('render', () => { throw error; }), candidate => candidate === error);
    profiler.suspend(); profiler.reset();
    assert.equal(reads, 0); assert.equal(invoked, 20);
    const snapshot = profiler.snapshot();
    assert.equal(snapshot.capacity, DEFAULT_PROFILER_CAPACITY);
    assert.ok(Object.values(snapshot.metrics).every(metric => metric.count === 0 && metric.mean === 0 && metric.p95 === 0 && metric.max === 0));
    assert.equal(snapshot.budgetOverruns, 0); assert.equal(snapshot.slowIntervals, 0);
  } finally { globalThis.Float64Array = OriginalFloat; globalThis.Uint32Array = OriginalUint; }
});

test('frame work budgets are separate from accepted-render interval warnings', () => {
  const clock = fixture();
  clock.frame(0, 10); clock.frame(100 / 3, 40); clock.frame(100 / 3 + 50, 20); clock.frame(150, 2);
  const snapshot = clock.profiler.snapshot();
  assert.equal(snapshot.metrics.work.count, 4); assert.equal(snapshot.metrics.interval.count, 3);
  close(snapshot.metrics.work.mean, 18); close(snapshot.metrics.interval.mean, 50);
  assert.equal(snapshot.metrics.work.p95, 40); assert.equal(snapshot.metrics.work.max, 40);
  assert.equal(snapshot.budgetOverruns, 1);
  assert.equal(snapshot.slowIntervalThresholdMs, 51);
  assert.equal(snapshot.slowIntervals, 1, 'one 50-ms accepted interval is tolerated at 30 FPS');
  assert.equal(snapshot.metrics.simulation.count, 0, 'sections do not invent missing samples');
});

test('all metric rings retain only the latest bounded samples and counts use that same window', () => {
  const clock = fixture({ capacity: 3, targetFps: 100 });
  for (const [index, duration] of [20, 5, 8, 11].entries()) {
    clock.frame(index * 10, duration);
    clock.profiler.measure('simulation', () => clock.advance(index + 1));
    clock.profiler.measure('render', () => clock.advance(index + 2));
    clock.profiler.measure('ui', () => clock.advance(index + 3));
  }
  const snapshot = clock.profiler.snapshot();
  assert.deepEqual(snapshot.metrics.work, { count: 3, mean: 8, p95: 11, max: 11 });
  assert.equal(snapshot.budgetOverruns, 1, 'evicted 20-ms frame no longer counts');
  assert.deepEqual(snapshot.metrics.interval, { count: 3, mean: 10, p95: 10, max: 10 });
  assert.deepEqual(snapshot.metrics.simulation, { count: 3, mean: 3, p95: 4, max: 4 });
  assert.deepEqual(snapshot.metrics.render, { count: 3, mean: 4, p95: 5, max: 5 });
  assert.deepEqual(snapshot.metrics.ui, { count: 3, mean: 5, p95: 6, max: 6 });
});

test('p95 uses nearest rank and sections measure individual calls rather than frame totals', () => {
  const clock = fixture({ capacity: 20 });
  clock.profiler.beginFrame(0);
  for (let duration = 1; duration <= 20; duration += 1) clock.profiler.measure('ui', () => clock.advance(duration));
  clock.profiler.endFrame(counters());
  const snapshot = clock.profiler.snapshot();
  assert.deepEqual(snapshot.metrics.ui, { count: 20, mean: 10.5, p95: 19, max: 20 });
  assert.deepEqual(snapshot.metrics.work, { count: 1, mean: 210, p95: 210, max: 210 });
  assert.equal(snapshot.budgetOverruns, 1);
});

test('same-section recursion records only the outer duration; different sections remain inclusive', () => {
  const clock = fixture();
  const value = clock.profiler.measure('simulation', () => {
    clock.advance(1);
    clock.profiler.measure('simulation', () => clock.advance(3));
    clock.profiler.measure('render', () => clock.advance(2));
    clock.advance(4);
    return 'result';
  });
  assert.equal(value, 'result');
  assert.equal(clock.reads, 4, 'nested same-section calls read no clock');
  const snapshot = clock.profiler.snapshot();
  assert.deepEqual(snapshot.metrics.simulation, { count: 1, mean: 10, p95: 10, max: 10 });
  assert.deepEqual(snapshot.metrics.render, { count: 1, mean: 2, p95: 2, max: 2 });
  assert.equal(snapshot.metrics.work.count, 0, 'timing a standalone UI call does not manufacture a frame');
});

test('timed callbacks preserve return identity, thrown identity and stack recovery', () => {
  const clock = fixture(), error = new Error('combat failed');
  assert.throws(() => clock.profiler.measure('simulation', () => {
    clock.advance(2);
    return clock.profiler.measure('simulation', () => { clock.advance(3); throw error; });
  }), candidate => candidate === error);
  const result = {};
  assert.equal(clock.profiler.measure('simulation', () => { clock.advance(4); return result; }), result);
  assert.deepEqual(clock.profiler.snapshot().metrics.simulation, { count: 2, mean: 4.5, p95: 5, max: 5 });
  const promise = Promise.resolve(result);
  assert.equal(clock.profiler.measure('ui', () => promise), promise, 'promise callbacks retain their return value; only synchronous invocation is timed');
});

test('counter capture and snapshots never retain caller-owned mutable objects', () => {
  const clock = fixture(), current = counters();
  clock.frame(0, 2, current);
  current.wave = 99; current.effects = 999;
  const snapshot = clock.profiler.snapshot();
  assert.equal(snapshot.counters.wave, 1); assert.equal(snapshot.counters.effects, 9);
  snapshot.counters.wave = 100; snapshot.metrics.work.mean = 900;
  assert.equal(clock.profiler.snapshot().counters.wave, 1);
  assert.equal(clock.profiler.snapshot().metrics.work.mean, 2);
  clock.frame(34, 3, counters({ wave: 2, enemies: 8 }));
  assert.equal(snapshot.counters.wave, 100);
  assert.equal(clock.profiler.snapshot().counters.wave, 2);
  assert.equal(clock.profiler.snapshot().counters.enemies, 8);
});

test('invalid counter records are discarded as a whole without affecting frame timing', () => {
  const clock = fixture(); clock.frame(0, 1);
  let timestamp = 34;
  for (const value of [counters({ effects: -1 }), counters({ speed: Infinity }), counters({ wave: NaN }), {}, null,
    new Proxy({}, { get() { throw new Error('counter failed'); } })]) {
    clock.frame(timestamp, 2, value); timestamp += 34;
    assert.deepEqual(clock.profiler.snapshot().counters, counters());
  }
  assert.equal(clock.profiler.snapshot().metrics.work.count, 7);
});

test('suspend abandons active work and section calls without sampling a background gap', () => {
  const clock = fixture(); clock.frame(0, 2); clock.frame(34, 3);
  clock.profiler.beginFrame(68);
  clock.profiler.measure('render', () => { clock.advance(5); clock.profiler.suspend(); clock.advance(100_000); });
  clock.profiler.endFrame(counters({ wave: 9 }));
  const held = clock.profiler.snapshot();
  assert.equal(held.metrics.work.count, 2); assert.equal(held.metrics.render.count, 0);
  assert.equal(held.metrics.interval.count, 1); assert.equal(held.counters.wave, 1);
  clock.frame(200_000, 4); clock.frame(200_034, 1);
  const resumed = clock.profiler.snapshot();
  assert.deepEqual(resumed.metrics.interval, { count: 2, mean: 34, p95: 34, max: 34 });
  assert.equal(resumed.metrics.work.count, 4);
  clock.profiler.measure('render', () => clock.advance(2));
  assert.equal(clock.profiler.snapshot().metrics.render.count, 1, 'suspension cannot leave a poisoned recursion depth');
});

test('reset inside nested timing invalidates old finalizers and clears all retained samples and counters', () => {
  const clock = fixture(); clock.frame(0, 10); clock.frame(40, 10);
  clock.profiler.beginFrame(80);
  clock.profiler.measure('simulation', () => {
    clock.advance(2);
    clock.profiler.measure('simulation', () => { clock.advance(3); clock.profiler.reset(); });
    clock.profiler.measure('simulation', () => clock.advance(4));
    clock.advance(500);
  });
  clock.profiler.endFrame(counters({ wave: 8 }));
  const snapshot = clock.profiler.snapshot();
  assert.deepEqual(snapshot.metrics.simulation, { count: 1, mean: 4, p95: 4, max: 4 });
  assert.equal(snapshot.metrics.work.count, 0); assert.equal(snapshot.metrics.interval.count, 0);
  assert.ok(Object.values(snapshot.counters).every(value => value === 0));
  clock.frame(1000, 2);
  assert.equal(clock.profiler.snapshot().metrics.interval.count, 0);
});

test('invalid, duplicate and backward timestamps never generate negative intervals or count unfinished frames', () => {
  const clock = fixture();
  clock.profiler.endFrame(counters());
  assert.equal(clock.reads, 0);
  clock.frame(100, 1); clock.frame(100, 2);
  assert.equal(clock.profiler.snapshot().metrics.work.count, 1);
  clock.frame(90, 3); clock.frame(124, 4);
  assert.deepEqual(clock.profiler.snapshot().metrics.interval, { count: 1, mean: 34, p95: 34, max: 34 });
  for (const timestamp of [NaN, Infinity, -1, '158']) clock.frame(timestamp, 2);
  assert.equal(clock.profiler.snapshot().metrics.work.count, 3);
  clock.profiler.beginFrame(200); clock.advance(30);
  clock.profiler.beginFrame(234); clock.advance(5); clock.profiler.endFrame(counters());
  assert.equal(clock.profiler.snapshot().metrics.work.count, 4);
  assert.equal(clock.profiler.snapshot().metrics.work.max, 5);
  assert.equal(clock.profiler.snapshot().metrics.interval.count, 1, 'abandoned frame discards its baseline');
});

test('invalid or failing clocks cannot replace gameplay values and do not record invalid work samples', () => {
  for (const now of [() => NaN, () => Infinity, () => -1, () => { throw new Error('clock failed'); }]) {
    const profiler = createCombatProfiler({ enabled: true, now }), error = new Error('game failed');
    profiler.beginFrame(0);
    assert.equal(profiler.measure('simulation', () => 7), 7);
    assert.throws(() => profiler.measure('render', () => { throw error; }), candidate => candidate === error);
    profiler.endFrame(counters());
    assert.equal(profiler.snapshot().metrics.work.count, 0);
    assert.equal(profiler.snapshot().metrics.simulation.count, 0);
    assert.equal(profiler.snapshot().metrics.render.count, 0);
  }
  const clock = fixture(); clock.setTime(10);
  clock.profiler.measure('simulation', () => clock.setTime(5));
  assert.equal(clock.profiler.snapshot().metrics.simulation.count, 0);
});

test('profiler options have bounded capacity and reject invalid representations', () => {
  for (const capacity of [0, -1, 1.5, Infinity, NaN, '300', MAX_PROFILER_CAPACITY + 1]) {
    assert.throws(() => createCombatProfiler({ capacity }), RangeError);
  }
  for (const targetFps of [0, -1, Infinity, NaN, '30', 241]) assert.throws(() => createCombatProfiler({ targetFps }), RangeError);
  for (const enabled of [1, 'true', null]) assert.throws(() => createCombatProfiler({ enabled }), TypeError);
  for (const now of [null, 1, 'clock']) assert.throws(() => createCombatProfiler({ now }), TypeError);
  for (const options of [null, [], 'enabled']) assert.throws(() => createCombatProfiler(options), TypeError);
  assert.equal(createCombatProfiler({ enabled: true, capacity: 1 }).snapshot().capacity, 1);
  assert.equal(createCombatProfiler({ enabled: true, capacity: MAX_PROFILER_CAPACITY }).snapshot().capacity, MAX_PROFILER_CAPACITY);
});

test('counter collection observes retained actors and poison without mutating or retaining battle state', () => {
  const battle = createBattle([{ id: 1, type: 'swordsman', col: 2, row: 0, level: 1 }], 8);
  const poison = () => ({ remaining: 2, nextTick: 1, damagePerTick: 3 });
  battle.allies[0].hp = 0; battle.allies[0].poison = poison();
  battle.hero.poison = poison(); battle.castle.poison = poison();
  battle.enemies.push({ ...battle.allies[0], id: 'enemy-1', type: 'goblin', side: 'enemy', poison: poison() });
  battle.enemies.push({ ...battle.enemies[0], id: 'enemy-2', poison: { ...poison(), remaining: 0 } });
  battle.projectiles.push({ id: 1, type: 'arrow' }); battle.effects.push({ id: 1, type: 'hit' });
  const before = structuredClone(battle), result = collectProfilerCounters(battle, 3);
  assert.deepEqual(result, { wave: 8, speed: 3, allies: 2, enemies: 2, projectiles: 1, effects: 1, poisoned: 4 });
  assert.deepEqual(battle, before);
  battle.enemies.length = 0;
  assert.equal(result.enemies, 2);
  assert.deepEqual(collectProfilerCounters(null, 1, 7), { wave: 0, speed: 1, allies: 7, enemies: 0, projectiles: 0, effects: 0, poisoned: 0 });
  assert.equal(collectProfilerCounters(null, NaN, -1).allies, 0);
  assert.equal(collectProfilerCounters(null, NaN, -1).speed, 0);
});
