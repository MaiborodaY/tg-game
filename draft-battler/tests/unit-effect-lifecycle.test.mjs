import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import test from "node:test";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("generic scene delays and tweens retain normal timing and settle on completion", async () => {
  const { scene, timers, tweens } = setupScene();
  const scaledDelay = track(scene.delay(45));
  const rawDelay = track(scene.delayRaw(45));
  const animation = track(scene.tween({ targets: {}, duration: 60 }));
  assert.deepEqual(timers.map((timer) => timer.duration), [90, 45]);
  assert.equal(tweens[0].config.duration, 120);
  timers.forEach((timer) => timer.fire());
  tweens[0].complete();
  await assertSettled([scaledDelay, rawDelay, animation]);
  assert.equal(scene.activeDelayTimers.size, 0);
});

test("normal completion and cancellation both detach generic wait abort listeners", async () => {
  const { scene, timers, tweens } = setupScene();
  const signal = scene.presentationAbortController.signal;
  const completed = [track(scene.delayRaw(80)), track(scene.tween({ targets: {}, duration: 80 }))];
  assert.equal(getEventListeners(signal, "abort").length, 2);
  timers[0].fire();
  tweens[0].complete();
  await assertSettled(completed);
  assert.equal(getEventListeners(signal, "abort").length, 0);
  const cancelled = [track(scene.delayRaw(80)), track(scene.tween({ targets: {}, duration: 80 }))];
  assert.equal(getEventListeners(signal, "abort").length, 2);
  scene.clearScene();
  await assertSettled(cancelled);
  assert.equal(signal.aborted, true);
  assert.equal(getEventListeners(signal, "abort").length, 0);
  assert.notEqual(scene.presentationAbortController.signal, signal);
  assert.equal(getEventListeners(scene.presentationAbortController.signal, "abort").length, 0);
});

test("clear and shutdown settle generic waits and cancel every timer and effect tween", async () => {
  for (const cleanup of ["clear", "shutdown"]) {
    const { scene, timers, tweens, shutdown, uiWrites } = setupScene();
    const pending = [track(scene.delay(100)), track(scene.delayRaw(120)), track(scene.tween({ targets: {}, duration: 80 }))];
    const walkTimer = scene.time.delayedCall(30, () => assert.fail("cancelled walk timer fired"));
    scene.activeWalkTimers.add(walkTimer);
    scene.floatText(0, 0, "2", "#ffffff");
    scene.drawStrike(0, 0, 20, 20);
    if (cleanup === "clear") scene.clearScene();
    else shutdown();
    await assertSettled(pending, cleanup);
    assert.ok(timers.every((timer) => timer.removed || timer.fired), cleanup);
    assert.ok(tweens.every((tween) => tween.stopped || tween.completed), cleanup);
    assert.equal(scene.activeDelayTimers.size, 0, cleanup);
    assert.equal(scene.activeWalkTimers.size, 0, cleanup);
    assertEmptyPools(scene);
    if (cleanup === "shutdown") assert.equal(uiWrites.length, 0, "shutdown does not update presentation speed/UI");
  }
});

test("flash and pulse return a live glow exactly once and reuse it normally", async () => {
  const { scene, tweens, target } = setupScene();
  const flash = track(scene.flash(target, 0x79c77a));
  const glow = tweens[0].config.targets;
  tweens[0].complete();
  await assertSettled([flash]);
  assert.equal(scene.glowPool.length, 1);
  assert.equal(scene.glowPool[0], glow);
  const pulse = track(scene.pulse(target, 0x86a8ff));
  assert.equal(tweens[1].config.targets, glow, "the next effect reuses the idle glow");
  assert.equal(scene.glowPool.length, 0);
  tweens[1].complete();
  await assertSettled([pulse]);
  assert.equal(scene.glowPool.length, 1);
  assert.equal(glow.destroyed, false);
});

test("pending and just-completed glows cannot return to a pool after clear or shutdown", async () => {
  for (const method of ["flash", "pulse"]) {
    for (const cleanup of ["clear", "shutdown"]) {
      for (const phase of ["pending", "just-completed"]) {
        const { scene, tweens, target, shutdown } = setupScene();
        const pending = track(scene[method](target, 0x79c77a));
        if (phase === "just-completed") tweens[0].complete();
        if (cleanup === "clear") scene.clearScene();
        else shutdown();
        await assertSettled([pending], `${method}/${cleanup}/${phase}`);
        assertEmptyPools(scene);
        // Simulate a completion callback already queued by Phaser before cancellation.
        tweens[0].deliverLateCompletion();
        await flush();
        assertEmptyPools(scene);
      }
    }
  }
});

test("strike and float-text completion callbacks cannot pollute a replacement scene's pools", async () => {
  for (const cleanup of ["clear", "shutdown"]) {
    const { scene, tweens, shutdown } = setupScene();
    scene.floatText(10, 20, "5", "#ffffff");
    scene.drawStrike(0, 0, 30, 30);
    const staleTweens = [...tweens];
    if (cleanup === "clear") scene.clearScene();
    else shutdown();
    staleTweens.forEach((tween) => tween.deliverLateCompletion());
    await flush();
    assertEmptyPools(scene);
    if (cleanup === "clear") {
      scene.floatText(10, 20, "new", "#ffffff");
      scene.drawStrike(0, 0, 40, 40);
      const replacementTweens = tweens.slice(staleTweens.length);
      replacementTweens.forEach((tween) => tween.complete());
      await flush();
      assert.equal(scene.floatTextPool.length, 1);
      assert.equal(scene.strikePool.length, 1);
      assert.ok(scene.floatTextPool.every((object) => !object.destroyed));
      assert.ok(scene.strikePool.every((effect) => !effect.shadow.destroyed && !effect.strike.destroyed));
      staleTweens.forEach((tween) => tween.deliverLateCompletion());
      await flush();
      assert.equal(scene.floatTextPool.length, 1, "old text cannot be returned alongside new text");
      assert.equal(scene.strikePool.length, 1, "old lines cannot be returned alongside new lines");
    }
  }
});

test("twenty consecutive scene replacements leave no growing timers, live tweens or effect pools", async () => {
  const { scene, timers, tweens, target } = setupScene();
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const firstTween = tweens.length;
    const pending = [track(scene.delayRaw(80)), track(scene.flash(target, 0x79c77a)), track(scene.pulse(target, 0x86a8ff))];
    scene.drawStrike(0, 0, 15, 15);
    scene.floatText(0, 0, String(iteration), "#ffffff");
    if (iteration % 2 === 0) tweens[firstTween].complete();
    scene.clearScene();
    await assertSettled(pending, `replacement ${iteration}`);
    tweens.slice(firstTween).forEach((tween) => tween.deliverLateCompletion());
    await flush();
    assert.equal(scene.activeDelayTimers.size, 0);
    assert.equal(scene.activeWalkTimers.size, 0);
    assert.ok(timers.every((timer) => timer.removed || timer.fired));
    assert.equal(tweens.filter((tween) => !tween.stopped && !tween.completed).length, 0);
    assertEmptyPools(scene);
    assert.equal(scene.children.list.length, 0, "clear destroys all prior effect objects");
  }
  const firstFreshTween = tweens.length;
  const fresh = track(scene.flash(target, 0x79c77a));
  tweens[firstFreshTween].complete();
  await assertSettled([fresh], "fresh effects still work after repeated cancellation");
  assert.equal(scene.glowPool.length, 1);
});

test("effect calls after shutdown settle without allocating objects, timers or tweens", async () => {
  const { scene, timers, tweens, target, shutdown, uiWrites } = setupScene();
  shutdown();
  const pending = [
    track(scene.delay(80)), track(scene.delayRaw(80)), track(scene.tween({ targets: {}, duration: 80 })),
    track(scene.flash(target, 0x79c77a)), track(scene.pulse(target, 0x86a8ff)),
  ];
  scene.floatText(0, 0, "late", "#ffffff");
  scene.drawStrike(0, 0, 20, 20);
  await assertSettled(pending);
  assert.equal(timers.length, 0);
  assert.equal(tweens.length, 0);
  assert.equal(scene.children.list.length, 0);
  assert.equal(uiWrites.length, 0);
  assertEmptyPools(scene);
});

function setupScene() {
  const scene = new HeadlessBattleScene();
  const timers = [], tweens = [], uiWrites = [];
  scene.children = { list: [] };
  scene.time = {
    delayedCall(duration, callback) {
      const timer = {
        duration, removed: false, fired: false,
        remove() { this.removed = true; },
        fire() {
          if (this.removed || this.fired) return;
          this.fired = true;
          callback();
        },
      };
      timers.push(timer);
      return timer;
    },
    removeAllEvents() { timers.forEach((timer) => timer.remove()); },
    set timeScale(value) { uiWrites.push({ target: "time", value }); },
  };
  scene.tweens = {
    add(config) {
      const tween = {
        config, stopped: false, completed: false,
        stop() { this.stopped = true; },
        complete() { this.completed = true; config.onComplete?.(); },
        deliverLateCompletion() { config.onComplete?.(); },
      };
      tweens.push(tween);
      return tween;
    },
    killAll() { tweens.forEach((tween) => tween.stop()); },
    killTweensOf(targets) {
      const objects = Array.isArray(targets) ? targets : [targets];
      tweens.filter((tween) => objects.some((object) => {
        const targets = Array.isArray(tween.config.targets) ? tween.config.targets : [tween.config.targets];
        return targets.includes(object);
      })).forEach((tween) => tween.stop());
    },
    set timeScale(value) { uiWrites.push({ target: "tweens", value }); },
  };
  scene.add = {
    ellipse: () => makeObject(scene),
    line: () => makeObject(scene),
    text: () => makeObject(scene),
  };
  scene.applyCommand = () => {};
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.create();
  return { scene, timers, tweens, uiWrites, target: { x: 20, y: 40, depth: 10 }, shutdown: () => shutdown() };
}

function makeObject(scene) {
  const object = {
    destroyed: false, active: true, visible: true,
    destroy() {
      this.destroyed = true;
      const index = scene.children.list.indexOf(this);
      if (index >= 0) scene.children.list.splice(index, 1);
    },
  };
  for (const method of ["setDepth", "setTo", "setOrigin", "setActive", "setVisible", "setAlpha", "setScale", "setPosition", "setText", "setColor", "setSize", "setFillStyle"]) {
    object[method] = function (...args) {
      assert.equal(this.destroyed, false, `${method} must never mutate an object destroyed by scene cleanup`);
      if (method === "setActive") this.active = args[0];
      if (method === "setVisible") this.visible = args[0];
      return this;
    };
  }
  scene.children.list.push(object);
  return object;
}

function track(promise) {
  const state = { settled: false, error: undefined };
  promise.then(() => { state.settled = true; }, (error) => { state.settled = true; state.error = error; });
  return state;
}

async function assertSettled(states, label = "presentation") {
  await flush();
  for (const state of states) {
    assert.equal(state.settled, true, `${label} must settle instead of retaining a cancelled await`);
    if (state.error) throw state.error;
  }
}

function assertEmptyPools(scene) {
  assert.equal(scene.glowPool.length, 0);
  assert.equal(scene.floatTextPool.length, 0);
  assert.equal(scene.strikePool.length, 0);
}

async function flush() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}
