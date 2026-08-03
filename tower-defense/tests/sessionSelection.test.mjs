import assert from "node:assert/strict";
import test from "node:test";

import {
  readSessionSelection,
  resolveServerSessionSelection,
  resolveSessionSelection,
  SESSION_SELECTION_KEY,
  writeSessionSelection,
} from "../src/game/sessionSelection.ts";

test("practice selection accepts catalog levels and modes", () => {
  const resolved = resolveSessionSelection("local", { levelId: "northern-pass-v3", modeId: "campaign" });
  assert.deepEqual(resolved.selection, { levelId: "northern-pass-v3", modeId: "campaign" });
  assert.equal(resolved.level.id, "northern-pass-v3");
  assert.equal(resolved.mode.id, "campaign");
  assert.equal(resolved.locked, false);
});

test("practice selection rejects legacy Northern Pass and accepts current Northern endless", () => {
  assert.equal(resolveSessionSelection("local", { levelId: "northern-pass", modeId: "campaign" }).level.id, "forest-gate");
  assert.deepEqual(
    resolveSessionSelection("local", { levelId: "northern-pass-v3", modeId: "endless" }).selection,
    { levelId: "northern-pass-v3", modeId: "endless" },
  );
});

test("reward runs are pinned to the original finite campaign", () => {
  const resolved = resolveSessionSelection("server", { levelId: "northern-pass", modeId: "endless" });
  assert.deepEqual(resolved.selection, { levelId: "forest-gate", modeId: "campaign" });
  assert.equal(resolved.locked, true);
});

test("reward runs use their validated server binding and ignore local selection", () => {
  const binding = { contentVersion: 2, levelId: "northern-pass-v3", modeId: "campaign" };
  const resolved = resolveSessionSelection(
    "server",
    { levelId: "forest-gate", modeId: "campaign" },
    binding,
  );
  assert.deepEqual(resolved.selection, { levelId: "northern-pass-v3", modeId: "campaign" });
  assert.equal(resolved.level.id, "northern-pass-v3");
  assert.equal(resolved.mode.id, "campaign");
  assert.equal(resolved.locked, true);

  assert.deepEqual(resolveServerSessionSelection(binding).selection, {
    levelId: "northern-pass-v3",
    modeId: "campaign",
  });

  assert.deepEqual(resolveServerSessionSelection({
    ...binding,
    modeId: "endless",
  }).selection, {
    levelId: "northern-pass-v3",
    modeId: "endless",
  });

  assert.throws(
    () => resolveServerSessionSelection({ ...binding, contentVersion: 999 }),
    /Invalid Tower Defense server content binding/,
  );
  assert.throws(
    () => readSessionSelection(null, "server", { ...binding, levelId: "toString" }),
    /Invalid Tower Defense server content binding/,
  );
  assert.throws(
    () => resolveServerSessionSelection({ ...binding, modeId: "missing-mode" }),
    /Invalid Tower Defense server content binding/,
  );
});

test("selection storage fails closed and keeps only valid catalog ids", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  assert.equal(writeSessionSelection(storage, { levelId: "northern-pass-v3", modeId: "campaign" }), true);
  assert.deepEqual(JSON.parse(values.get(SESSION_SELECTION_KEY)), { levelId: "northern-pass-v3", modeId: "campaign" });
  assert.equal(readSessionSelection(storage, "local").level.id, "northern-pass-v3");
  assert.equal(writeSessionSelection(storage, { levelId: "northern-pass", modeId: "campaign" }), false);

  values.set(SESSION_SELECTION_KEY, JSON.stringify({ levelId: "../bad", modeId: "campaign" }));
  assert.deepEqual(readSessionSelection(storage, "local").selection, { levelId: "forest-gate", modeId: "campaign" });
  assert.equal(writeSessionSelection(storage, { levelId: "missing", modeId: "campaign" }), false);
});
