import assert from "node:assert/strict";
import test from "node:test";
import { farmBackDecision } from "../src/farmNavigation.ts";

const baseContext = {
  mode: "server",
  phase: "input",
  isStartingRun: false,
  finishPending: false,
  hasUnsavedServerResult: false
};

test("blocks navigation while an attempt starts or a result is saved", () => {
  assert.equal(farmBackDecision({ ...baseContext, isStartingRun: true }), "blocked");
  assert.equal(farmBackDecision({ ...baseContext, finishPending: true }), "blocked");
});

test("asks before abandoning every active server phase", () => {
  for (const phase of ["showing", "input", "success"]) {
    assert.equal(farmBackDecision({ ...baseContext, phase }), "confirm-run");
    assert.equal(farmBackDecision({
      ...baseContext,
      phase,
      hasUnsavedServerResult: true
    }), "confirm-run");
  }
});

test("asks separately before abandoning every unsaved terminal server result", () => {
  for (const phase of ["won", "failed"]) {
    assert.equal(farmBackDecision({
      ...baseContext,
      phase,
      hasUnsavedServerResult: true
    }), "confirm-unsaved");
  }
});

test("leaves local, idle, blocked and completed games without confirmation", () => {
  assert.equal(farmBackDecision({ ...baseContext, mode: "local" }), "leave");
  assert.equal(farmBackDecision({
    ...baseContext,
    mode: "local",
    phase: "won",
    hasUnsavedServerResult: true
  }), "leave");
  assert.equal(farmBackDecision({ ...baseContext, mode: "blocked", phase: "idle" }), "leave");
  assert.equal(farmBackDecision({
    ...baseContext,
    phase: "idle",
    hasUnsavedServerResult: true
  }), "leave");
  for (const phase of ["won", "failed"]) {
    assert.equal(farmBackDecision({ ...baseContext, phase }), "leave");
  }
});
