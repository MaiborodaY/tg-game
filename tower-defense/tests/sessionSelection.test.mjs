import assert from "node:assert/strict";
import test from "node:test";

import {
  readSessionSelection,
  resolveSessionSelection,
  SESSION_SELECTION_KEY,
  writeSessionSelection,
} from "../src/game/sessionSelection.ts";

test("practice selection accepts catalog levels and modes", () => {
  const resolved = resolveSessionSelection("local", { levelId: "northern-pass", modeId: "endless" });
  assert.deepEqual(resolved.selection, { levelId: "northern-pass", modeId: "endless" });
  assert.equal(resolved.level.id, "northern-pass");
  assert.equal(resolved.mode.id, "endless");
  assert.equal(resolved.locked, false);
});

test("reward runs are pinned to the original finite campaign", () => {
  const resolved = resolveSessionSelection("server", { levelId: "northern-pass", modeId: "endless" });
  assert.deepEqual(resolved.selection, { levelId: "forest-gate", modeId: "campaign" });
  assert.equal(resolved.locked, true);
});

test("selection storage fails closed and keeps only valid catalog ids", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  assert.equal(writeSessionSelection(storage, { levelId: "northern-pass", modeId: "campaign" }), true);
  assert.deepEqual(JSON.parse(values.get(SESSION_SELECTION_KEY)), { levelId: "northern-pass", modeId: "campaign" });
  assert.equal(readSessionSelection(storage, "local").level.id, "northern-pass");

  values.set(SESSION_SELECTION_KEY, JSON.stringify({ levelId: "../bad", modeId: "campaign" }));
  assert.deepEqual(readSessionSelection(storage, "local").selection, { levelId: "forest-gate", modeId: "campaign" });
  assert.equal(writeSessionSelection(storage, { levelId: "missing", modeId: "campaign" }), false);
});
