import assert from 'node:assert/strict';
import test from 'node:test';
import { createUnitDragGesture } from '../unit-drag-gesture.mjs';

function setup(options = {}) {
  let time = 0;
  let nextId = 0;
  const timers = new Map();
  const callbacks = [];
  const events = [];
  const source = { location: 'reserve', id: 42 };
  const drag = createUnitDragGesture({
    schedule(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, at: time + delay });
      callbacks.push(callback);
      return id;
    },
    unschedule(id) { timers.delete(id); },
    onStart(unit, point) { events.push(['start', unit, point]); return true; },
    onMove(point) { events.push(['move', point]); },
    onDrop(unit, point) { events.push(['drop', unit, point]); },
    onCancel() { events.push(['cancel']); },
    ...options,
  });
  function advance(ms) {
    time += ms;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= time) {
        timers.delete(id);
        timer.callback();
      }
    }
  }
  return {
    drag, events, callbacks, source, advance,
    down: (point = {}) => drag.down({ pointerId: 1, x: 50, y: 50, source, ...point }),
    move: (point = {}) => drag.move({ pointerId: 1, x: 50, y: 50, ...point }),
    up: (point = {}) => drag.up({ pointerId: 1, x: 50, y: 50, ...point }),
  };
}

test('a short tap remains a native click without pickup or drop', () => {
  const s = setup();
  assert.equal(s.down(), true);
  assert.equal(s.drag.pending, true);
  s.advance(449);
  assert.equal(s.drag.active, false);
  assert.equal(s.up(), false);
  s.advance(1);
  assert.equal(s.drag.pending, false);
  assert.equal(s.drag.suppressClick, false);
  assert.deepEqual(s.events, []);
});

test('pickup starts at the hold threshold with stable sub-slop movement', () => {
  const s = setup();
  s.down();
  assert.equal(s.move({ x: 56, y: 58 }), false); // Exactly 10 px is allowed.
  s.advance(450);
  assert.equal(s.drag.pending, false);
  assert.equal(s.drag.active, true);
  assert.deepEqual(s.events, [['start', s.source, { x: 56, y: 58 }]]);
  assert.equal(s.drag.suppressClick, true);
});

test('movement before holding cancels pickup permanently and does not capture scrolling', () => {
  const s = setup();
  s.down();
  s.advance(200);
  assert.equal(s.move({ x: 61 }), false);
  s.move();
  s.advance(1000);
  s.callbacks[0](); // Even an already queued cleared callback is harmless.
  assert.equal(s.drag.active, false);
  assert.equal(s.drag.pending, false);
  assert.equal(s.drag.suppressClick, true);
  assert.equal(s.up(), false);
  assert.deepEqual(s.events, []);
  assert.equal(s.drag.consumeClick(), true);
  assert.equal(s.drag.consumeClick(), false);
});

test('holding and releasing without dragging never drops, even at the movement threshold', () => {
  for (const finalPoint of [{}, { x: 60 }]) {
    const s = setup();
    s.down();
    s.advance(450);
    s.move(finalPoint);
    assert.equal(s.up(finalPoint), true);
    assert.equal(s.drag.active, false);
    assert.deepEqual(s.events.filter(([name]) => name === 'drop'), []);
    assert.deepEqual(s.events.at(-1), ['cancel']);
    assert.equal(s.drag.consumeClick(), true);
  }
});

test('drop requires post-pickup movement, not movement accumulated during the hold', () => {
  const s = setup();
  s.down();
  s.move({ x: 59 });
  s.advance(450);
  s.move({ x: 65 });
  s.up({ x: 65 });
  assert.equal(s.events.some(([name]) => name === 'drop'), false);
  assert.deepEqual(s.events.at(-1), ['cancel']);
});

test('a drag drops once, clears state before the callback and suppresses the click', () => {
  let drops = 0;
  const s = setup({
    onDrop(source, point) {
      drops += 1;
      assert.equal(s.drag.active, false);
      assert.equal(s.drag.pending, false);
      assert.equal(source, s.source);
      assert.deepEqual(point, { x: 80, y: 90 });
      s.up({ x: 80, y: 90 });
    },
  });
  s.down();
  s.advance(450);
  assert.equal(s.move({ x: 80, y: 90 }), true);
  assert.equal(s.up({ x: 80, y: 90 }), true);
  assert.equal(s.up({ x: 80, y: 90 }), false);
  assert.equal(drops, 1);
  assert.equal(s.drag.consumeClick(), true);
});

test('a release can supply the final displacement when the last move event was coalesced', () => {
  const s = setup();
  s.down();
  s.advance(450);
  s.up({ x: 70 });
  assert.deepEqual(s.events.at(-1), ['drop', s.source, { x: 70, y: 50 }]);
});

test('canceling a pending gesture prevents stale pickup; canceling a drag restores its visual once', () => {
  const pending = setup();
  pending.down();
  pending.drag.cancel();
  pending.callbacks[0]();
  pending.advance(1000);
  assert.deepEqual(pending.events, []);
  assert.equal(pending.drag.suppressClick, true);

  const active = setup();
  active.down();
  active.advance(450);
  active.move({ x: 90 });
  active.drag.cancel();
  active.drag.cancel();
  active.up({ x: 90 });
  assert.deepEqual(active.events.filter(([name]) => name === 'cancel'), [['cancel']]);
  assert.equal(active.events.some(([name]) => name === 'drop'), false);
});

test('foreign pointer moves/releases and repeated down events cannot advance or finish a drag', () => {
  const s = setup();
  s.down();
  assert.equal(s.down(), false);
  s.move({ pointerId: 2, x: 100 });
  s.up({ pointerId: 2, x: 100 });
  s.advance(450);
  assert.equal(s.drag.active, true);
  s.move({ pointerId: 2, x: 100 });
  s.up({ pointerId: 2, x: 100 });
  s.up();
  assert.deepEqual(s.events, [['start', s.source, { x: 50, y: 50 }], ['cancel']]);
});

test('a second finger cancels pending/active pickup and blocks another until both fingers lift', () => {
  for (const alreadyActive of [false, true]) {
    const s = setup();
    s.down();
    if (alreadyActive) s.advance(450);
    s.down({ pointerId: 2 });
    assert.equal(s.drag.active, false);
    assert.equal(s.drag.pending, false);
    assert.equal(s.drag.suppressClick, true);
    s.up();
    s.down({ pointerId: 3 });
    s.advance(1000);
    assert.equal(s.drag.active, false);
    s.up({ pointerId: 2 });
    s.up({ pointerId: 3 });
    s.down();
    assert.equal(s.drag.suppressClick, false);
    s.advance(450);
    assert.equal(s.drag.active, true);
    assert.equal(s.events.filter(([name]) => name === 'drop').length, 0);
    assert.equal(s.events.filter(([name]) => name === 'cancel').length, alreadyActive ? 1 : 0);
  }
});

test('unrelated pointers participate in multi-touch detection without scheduling pickup', () => {
  const s = setup();
  assert.equal(s.down({ source: null }), false);
  assert.equal(s.drag.pending, false);
  s.advance(1000);
  assert.deepEqual(s.callbacks, []);
  assert.deepEqual(s.events, []);
  assert.equal(s.down({ pointerId: 2 }), false);
  assert.equal(s.drag.pending, false);
  s.up({ pointerId: 2 });
  s.up();

  s.down();
  s.advance(450);
  s.down({ pointerId: 2, source: null });
  assert.equal(s.drag.active, false);
  assert.deepEqual(s.events.at(-1), ['cancel']);
  s.up();
  s.up({ pointerId: 2 });
  assert.equal(s.drag.suppressClick, true);
  s.down({ source: null });
  assert.equal(s.drag.suppressClick, false);
  assert.equal(s.drag.pending, false);
});

test('pending remains true during onStart so adapters can preserve the native touch target', () => {
  const s = setup({ onStart() {
    assert.equal(s.drag.pending, true);
    assert.equal(s.drag.active, false);
    return true;
  } });
  s.down();
  s.advance(450);
  assert.equal(s.drag.pending, false);
  assert.equal(s.drag.active, true);
});

test('a rejected start cannot drop or turn into a click and cleans up any preview', () => {
  const s = setup({ onStart() { return false; } });
  s.down();
  s.advance(450);
  assert.equal(s.drag.active, false);
  s.move({ x: 100 });
  s.up({ x: 100 });
  assert.deepEqual(s.events, [['cancel']]);
  assert.equal(s.drag.consumeClick(), true);
});

test('callback cancellation and destruction cannot be revived by a timer', () => {
  const s = setup({ onStart() { s.drag.cancel(); return true; } });
  s.down();
  s.advance(450);
  assert.equal(s.drag.active, false);
  assert.deepEqual(s.events, [['cancel']]);

  const destroyed = setup();
  destroyed.down();
  destroyed.drag.destroy();
  destroyed.callbacks[0]();
  assert.equal(destroyed.down(), false);
  assert.equal(destroyed.move({ x: 100 }), false);
  assert.equal(destroyed.up({ x: 100 }), false);
  assert.deepEqual(destroyed.events, []);
});
