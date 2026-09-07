import assert from "node:assert/strict";
import test from "node:test";
import { UnitMotionState } from "../src/rendering/unitMotionState.ts";

test("death cancels each owned motion, settles its promise, and blocks a late return motion", async () => {
  const state = new UnitMotionState();
  const completions = [];
  let stops = 0;
  const motions = [0, 1].map(() => state.run((complete) => {
    completions.push(complete);
    return () => { stops += 1; complete(); };
  }));
  state.die();
  state.die();
  assert.deepEqual(await Promise.all(motions), ["dead", "dead"]);
  assert.equal(stops, 2);
  completions.forEach((complete) => complete());
  assert.equal(await state.run(() => { throw new Error("must not start after death"); }), "dead");
});

test("completed motion releases its cancellation handle and a fresh view still moves", async () => {
  const state = new UnitMotionState();
  let complete;
  let stops = 0;
  const motion = state.run((done) => { complete = done; return () => { stops += 1; }; });
  complete();
  assert.equal(await motion, "completed");
  state.die();
  assert.equal(stops, 0);
  assert.equal(await new UnitMotionState().run((done) => { done(); return () => {}; }), "completed");
});

test("teardown settles live motion without reviving a dead or disposed view", async () => {
  const state = new UnitMotionState();
  let stops = 0;
  const motion = state.run(() => () => { stops += 1; });
  state.dispose();
  state.die();
  state.dispose();
  assert.equal(await motion, "disposed");
  assert.equal(state.isDisposed(), true);
  assert.equal(stops, 1);
  assert.equal(await state.run(() => { throw new Error("disposed motion started"); }), "disposed");
});

test("synchronous completion or cancellation during tween creation is safe", async () => {
  const state = new UnitMotionState();
  let stops = 0;
  const motion = state.run(() => {
    state.die();
    return () => { stops += 1; };
  });
  assert.equal(await motion, "dead");
  assert.equal(stops, 1);
  const failed = new UnitMotionState();
  await assert.rejects(failed.run(() => { throw new Error("creation failed"); }), /creation failed/);
  failed.dispose();
});
