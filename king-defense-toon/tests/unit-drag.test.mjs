import assert from 'node:assert/strict';
import test from 'node:test';
import { setupUnitDrag } from '../unit-drag.ts';
import { createUnitDragGesture } from '../unit-drag-gesture.ts';

function setup(t, options = {}) {
  class Surface extends EventTarget {
    listeners = [];
    addEventListener(type, handler, options) {
      this.listeners.push({ type, handler, options });
      super.addEventListener(type, handler, options);
    }
    removeEventListener(type, handler, options) {
      const index = this.listeners.findIndex(item => item.type === type && item.handler === handler && item.options === options);
      assert.notEqual(index, -1, 'listener removal preserves its identity and options');
      this.listeners.splice(index, 1);
      super.removeEventListener(type, handler, options);
    }
  }
  const window = new Surface(), document = new Surface(), capture = new Surface(), viewport = new Surface();
  window.visualViewport = viewport;
  document.documentElement = capture;
  document.hidden = false;
  const captures = new Set(), captureCalls = [];
  capture.setPointerCapture = id => { captures.add(id); captureCalls.push(['set', id]); };
  capture.hasPointerCapture = id => captures.has(id);
  capture.releasePointerCapture = id => { captures.delete(id); captureCalls.push(['release', id]); };
  const timers = new Map();
  let nextTimer = 0;
  const globals = { window, document,
    setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); } };
  const descriptors = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  const source = { location: 'reserve', id: 42 }, events = [], origins = [];
  const controller = setupUnitDrag({
    getSource(event) { origins.push(event); return source; },
    onStart(unit, point) { events.push(['start', unit, point]); return true; },
    onMove(point) { events.push(['move', point]); },
    onDrop(unit, point) { events.push(['drop', unit, point]); },
    onCancel() { events.push(['cancel']); },
    ...options,
  });
  const emit = (surface, type, properties = {}) => {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value });
    surface.dispatchEvent(event);
    return event;
  };
  const pointer = (type, properties = {}) => emit(window, type, {
    pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, clientX: 10, clientY: 20, ...properties,
  });
  const touch = (type, touches, properties = {}) => emit(document, type, { changedTouches: touches, ...properties });
  function hold() {
    for (const [id, timer] of [...timers]) { assert.equal(timer.delay, 450); timers.delete(id); timer.callback(); }
  }
  return { window, document, capture, viewport, captures, captureCalls, timers, source, events, origins,
    controller, emit, pointer, touch, hold };
}

test('pointer drag captures a stable element, drops once and suppresses only the release click', t => {
  const s = setup(t);
  s.pointer('pointerdown');
  assert.equal(s.controller.tracking, true);
  assert.equal(s.controller.pending, true);
  s.pointer('pointermove', { clientX: 15 });
  assert.equal(s.captures.size, 0);
  s.hold();
  assert.deepEqual(s.captureCalls, [['set', 7]]);
  assert.equal(s.controller.active, true);
  s.pointer('pointermove', { clientX: 30 });
  s.pointer('pointerup', { clientX: 35 });
  s.pointer('pointerup', { clientX: 35 });
  assert.equal(s.controller.tracking, false);
  assert.deepEqual(s.captureCalls, [['set', 7], ['release', 7]]);
  assert.deepEqual(s.events.filter(([name]) => name === 'drop'), [['drop', s.source, { x: 35, y: 20 }]]);
  assert.equal(s.emit(s.document, 'click', { detail: 0 }).defaultPrevented, false, 'keyboard clicks remain usable');
  assert.equal(s.emit(s.document, 'click', { detail: 1 }).defaultPrevented, true);
  assert.equal(s.emit(s.document, 'click', { detail: 1 }).defaultPrevented, false);
  s.controller.destroy();
  for (const surface of [s.window, s.document, s.capture, s.viewport]) assert.equal(surface.listeners.length, 0);
});

test('native touch scrolling stays free before pickup and becomes cancelable only while dragging', t => {
  const s = setup(t);
  const target = new EventTarget();
  const finger = (clientX = 10) => ({ identifier: 3, clientX, clientY: 20, target });
  s.pointer('pointerdown', { pointerType: 'touch' });
  assert.equal(s.controller.tracking, false, 'duplicate pointer touch stream is ignored');
  s.touch('touchstart', [finger()]);
  assert.equal(s.origins[0].target, target);
  assert.deepEqual({ x: s.origins[0].x, clientX: s.origins[0].clientX }, { x: 10, clientX: 10 });
  assert.equal(s.touch('touchmove', [finger(15)]).defaultPrevented, false);
  s.hold();
  assert.equal(s.captures.size, 0, 'native touch stays attached to its original target');
  assert.equal(s.touch('touchmove', [finger(35)]).defaultPrevented, true);
  assert.equal(s.touch('touchend', [finger(40)]).defaultPrevented, true);
  assert.deepEqual(s.events.at(-1), ['drop', s.source, { x: 40, y: 20 }]);
  assert.equal(s.document.listeners.find(item => item.type === 'touchstart').options.passive, true);
  assert.equal(s.document.listeners.find(item => item.type === 'touchmove').options.passive, false);
  s.controller.destroy();
});

test('multitouch and uncancelable pans cancel pickup, and page loss resets all tracking', t => {
  const s = setup(t);
  const finger = id => ({ identifier: id, clientX: 10, clientY: 20, target: s.document });
  s.touch('touchstart', [finger(1)]);
  s.hold();
  s.touch('touchstart', [finger(2)]);
  assert.equal(s.controller.active, false);
  s.touch('touchend', [finger(1)]);
  s.touch('touchstart', [finger(3)]);
  s.hold();
  assert.equal(s.controller.active, false);
  assert.equal(s.origins.length, 1, 'blocked fingers never ask for another source');
  s.emit(s.window, 'pagehide');
  assert.equal(s.controller.tracking, false);
  s.touch('touchstart', [finger(4)]);
  s.hold();
  s.touch('touchmove', [finger(4)], { cancelable: false });
  assert.equal(s.controller.active, false);
  assert.equal(s.events.filter(([name]) => name === 'cancel').length, 2);
  assert.equal(s.events.some(([name]) => name === 'drop'), false);
  s.document.hidden = true;
  s.emit(s.document, 'visibilitychange');
  assert.equal(s.controller.tracking, false);
  s.controller.destroy();
});

test('a thrown or reentrant pickup cannot leave an active gesture or reuse its queued timer', () => {
  for (const mode of ['throw', 'release']) {
    let callback, canceled = 0;
    const drag = createUnitDragGesture({
      schedule(handler) { callback = handler; return 1; }, unschedule() {},
      onStart() {
        if (mode === 'throw') throw new Error('Preview failed');
        assert.equal(drag.up({ pointerId: 1, x: 50, y: 50 }), true);
        return true;
      },
      onCancel() { canceled++; },
      onDrop() { assert.fail('a reentrant pickup release must never drop'); },
    });
    drag.down({ pointerId: 1, x: 0, y: 0, source: { id: 42 } });
    if (mode === 'throw') assert.throws(callback, /Preview failed/); else callback();
    callback();
    assert.equal(drag.active, false);
    assert.equal(drag.pending, false);
    assert.equal(drag.consumeClick(), true);
    assert.equal(canceled, 1);
    drag.destroy();
  }
});
