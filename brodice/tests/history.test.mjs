import assert from "node:assert/strict";
import test from "node:test";

import {
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  clearHistory,
  createRollRecord,
  loadHistory,
  prependHistory,
} from "../src/history.ts";
import { loadPreferences, persistPreferences } from "../src/preferences.ts";

function createStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

test("history is newest-first and capped at twenty records", () => {
  const storage = createStorage();
  let history = [];
  for (let index = 1; index <= HISTORY_LIMIT + 5; index += 1) {
    history = prependHistory(storage, createRollRecord([1, 6], 5, 1_700_000_000_000 + index), history);
  }
  assert.equal(history.length, HISTORY_LIMIT);
  assert.equal(history[0].createdAt, 1_700_000_000_025);
  assert.equal(history.at(-1).createdAt, 1_700_000_000_006);
  assert.deepEqual(loadHistory(storage), history);
});

test("history drops malformed entries and survives damaged storage", () => {
  const storage = createStorage();
  storage.values.set(HISTORY_STORAGE_KEY, JSON.stringify([
    createRollRecord([1, 2, 6], 5, 1_700_000_000_000),
    { version: 1, createdAt: 1, target: 9, faces: [12] },
  ]));
  assert.equal(loadHistory(storage).length, 1);
  storage.values.set(HISTORY_STORAGE_KEY, "{not-json");
  assert.deepEqual(loadHistory(storage), []);
});

test("history storage failures fail safely", () => {
  const brokenStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const record = createRollRecord([4], 4, 1_700_000_000_000);
  assert.deepEqual(loadHistory(brokenStorage), []);
  assert.equal(prependHistory(brokenStorage, record).length, 1);
  assert.equal(clearHistory(brokenStorage), false);
});

test("clearing history removes only the BroDice history key", () => {
  const storage = createStorage();
  storage.values.set(HISTORY_STORAGE_KEY, "[]");
  storage.values.set("unrelated", "keep");
  assert.equal(clearHistory(storage), true);
  assert.equal(storage.values.has(HISTORY_STORAGE_KEY), false);
  assert.equal(storage.values.get("unrelated"), "keep");
});

test("preferences validate values and persist sound, count, and target", () => {
  const storage = createStorage();
  assert.equal(persistPreferences(storage, { diceCount: 20, target: 6, soundEnabled: false }), true);
  assert.deepEqual(loadPreferences(storage), { diceCount: 20, target: 6, soundEnabled: false });

  storage.values.set("brodice.preferences.v1", JSON.stringify({ diceCount: 900, target: 12, soundEnabled: "yes" }));
  assert.deepEqual(loadPreferences(storage), { diceCount: 100, target: 5, soundEnabled: true });
});
