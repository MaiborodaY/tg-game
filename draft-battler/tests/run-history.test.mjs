import assert from "node:assert/strict";
import test from "node:test";

import {
  SOLO_RUN_HISTORY_LIMIT,
  SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY,
  SOLO_RUN_HISTORY_STORAGE_KEY,
  SOLO_RUN_HISTORY_VERSION,
  clearSoloRunHistory,
  decodeSoloRunHistory,
  encodeSoloRunHistory,
  flushQueuedSoloRunSummaries,
  loadSoloRunHistory,
  queueSoloRunSummary,
  recordSoloRunSummary,
  saveSoloRunHistory,
} from "../src/runHistory.ts";

const COMPLETED_AT = 1_700_000_000_000;

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function createSummary(index = 0, patch = {}) {
  return {
    id: `run-${index}`,
    seed: `seed-${index}`,
    botDifficulty: index % 2 === 0 ? "standard" : "strong",
    outcome: index % 3 === 0 ? "player" : index % 3 === 1 ? "enemy" : "draw",
    round: (index % 15) + 1,
    playerHp: index % 21,
    enemyHp: (index * 2) % 21,
    completedAt: COMPLETED_AT + index,
    source: index % 2 === 0 ? "standard" : "daily",
    dailyDateKey: index % 2 === 0 ? null : "2026-08-20",
    rulesetVersion: "draft-battler-solo-v1",
    ...patch,
  };
}

test("history round-trips through its own versioned key and returns immutable copies", () => {
  const storage = new MemoryStorage();
  const older = createSummary(1);
  const newer = createSummary(2);

  assert.equal(saveSoloRunHistory(storage, [older, newer]), true);
  assert.equal(SOLO_RUN_HISTORY_STORAGE_KEY, `draft-battler:solo-run-history:v${SOLO_RUN_HISTORY_VERSION}`);
  assert.equal(storage.values.has("draft-battler:solo-run:v7"), false);

  const loaded = loadSoloRunHistory(storage);
  assert.deepEqual(loaded, [newer, older]);
  assert.ok(Object.isFrozen(loaded));
  assert.ok(Object.isFrozen(loaded[0]));
  assert.notStrictEqual(loaded[0], newer);

  newer.playerHp = 20;
  assert.notEqual(loadSoloRunHistory(storage)[0].playerHp, 20);
  assert.throws(() => loaded.push(createSummary(3)), TypeError);

  const encoded = encodeSoloRunHistory([older, createSummary(2)]);
  assert.ok(encoded);
  assert.deepEqual(decodeSoloRunHistory(encoded), [createSummary(2), older]);
});

test("save sorts newest-first and caps history at ten valid summaries", () => {
  const storage = new MemoryStorage();
  const summaries = Array.from({ length: 14 }, (_, index) => createSummary(index));
  summaries.reverse();

  assert.equal(saveSoloRunHistory(storage, summaries), true);
  const loaded = loadSoloRunHistory(storage);
  assert.equal(loaded.length, SOLO_RUN_HISTORY_LIMIT);
  assert.deepEqual(loaded.map((summary) => summary.id), [
    "run-13", "run-12", "run-11", "run-10", "run-9",
    "run-8", "run-7", "run-6", "run-5", "run-4",
  ]);
});

test("record is idempotent for one run id, rejects collisions, and keeps repeat attempts", () => {
  const storage = new MemoryStorage();
  const summary = createSummary(4);

  assert.equal(recordSoloRunSummary(storage, summary), true);
  const storedOnce = storage.values.get(SOLO_RUN_HISTORY_STORAGE_KEY);
  assert.equal(recordSoloRunSummary(storage, { ...summary }), true);
  assert.equal(storage.values.get(SOLO_RUN_HISTORY_STORAGE_KEY), storedOnce);
  assert.equal(loadSoloRunHistory(storage).length, 1);

  assert.equal(recordSoloRunSummary(storage, { ...summary, playerHp: summary.playerHp + 1 }), false);
  assert.deepEqual(loadSoloRunHistory(storage), [summary]);

  assert.equal(recordSoloRunSummary(storage, { ...summary, id: "second-id" }), true);
  assert.equal(loadSoloRunHistory(storage).length, 2);
  assert.deepEqual(loadSoloRunHistory(storage).map((item) => item.id), ["run-4", "second-id"]);
});

test("strict decoding fails closed on tampered documents", () => {
  const validSummary = createSummary(1);
  const validDocument = {
    version: SOLO_RUN_HISTORY_VERSION,
    summaries: [validSummary],
  };
  const tamperedDocuments = [
    { ...validDocument, version: SOLO_RUN_HISTORY_VERSION + 1 },
    { ...validDocument, unexpected: true },
    { ...validDocument, summaries: [{ ...validSummary, botDifficulty: "impossible" }] },
    { ...validDocument, summaries: [{ ...validSummary, completedAt: "yesterday" }] },
    { ...validDocument, summaries: [{ ...validSummary, completedAt: 8_640_000_000_000_001 }] },
    { ...validDocument, summaries: [{ ...validSummary, source: "daily", dailyDateKey: null }] },
    { ...validDocument, summaries: [{ ...validSummary, source: "standard", dailyDateKey: "2026-08-20" }] },
    { ...validDocument, summaries: [{ ...validSummary, dailyDateKey: "2026-02-30" }] },
    { ...validDocument, summaries: [{ ...validSummary, rulesetVersion: "" }] },
    { ...validDocument, summaries: [{ ...validSummary, seed: "x".repeat(257) }] },
    { ...validDocument, summaries: [{ ...validSummary, extra: true }] },
    { ...validDocument, summaries: [validSummary, { ...validSummary }] },
    { ...validDocument, summaries: [createSummary(2), createSummary(3)] },
    {
      ...validDocument,
      summaries: Array.from({ length: SOLO_RUN_HISTORY_LIMIT + 1 }, (_, index) => createSummary(index)),
    },
  ];

  for (const document of tamperedDocuments) {
    assert.equal(decodeSoloRunHistory(JSON.stringify(document)), undefined);
  }
  assert.equal(decodeSoloRunHistory("not json"), undefined);
  assert.equal(decodeSoloRunHistory("null"), undefined);
});

test("malformed storage is nonfatal and a valid record replaces it", () => {
  const storage = new MemoryStorage();
  storage.setItem(SOLO_RUN_HISTORY_STORAGE_KEY, "{broken");

  assert.deepEqual(loadSoloRunHistory(storage), []);
  assert.equal(recordSoloRunSummary(storage, createSummary(5)), true);
  assert.deepEqual(loadSoloRunHistory(storage), [createSummary(5)]);
});

test("storage failures stay nonfatal for load, save, record, and clear", () => {
  const readFailure = {
    getItem() { throw new Error("read failed"); },
    setItem() { throw new Error("unexpected write"); },
    removeItem() { throw new Error("unexpected clear"); },
  };
  const writeFailure = {
    getItem() { return null; },
    setItem() { throw new Error("write failed"); },
    removeItem() {},
  };
  const clearFailure = {
    getItem() { return null; },
    setItem() {},
    removeItem() { throw new Error("clear failed"); },
  };

  assert.deepEqual(loadSoloRunHistory(readFailure), []);
  assert.equal(recordSoloRunSummary(readFailure, createSummary()), false);
  assert.equal(saveSoloRunHistory(writeFailure, [createSummary()]), false);
  assert.equal(recordSoloRunSummary(writeFailure, createSummary()), false);
  assert.equal(queueSoloRunSummary(writeFailure, createSummary()), false);
  assert.equal(clearSoloRunHistory(clearFailure), false);
  assert.deepEqual(loadSoloRunHistory(null), []);
  assert.equal(saveSoloRunHistory(undefined, [createSummary()]), false);
  assert.equal(recordSoloRunSummary(null, createSummary()), false);
  assert.equal(clearSoloRunHistory(undefined), false);
});

test("clear removes only the run-history key", () => {
  const storage = new MemoryStorage();
  storage.setItem(SOLO_RUN_HISTORY_STORAGE_KEY, encodeSoloRunHistory([createSummary()]));
  storage.setItem("draft-battler:solo-run:v7", "active-run");

  assert.equal(clearSoloRunHistory(storage), true);
  assert.equal(storage.getItem(SOLO_RUN_HISTORY_STORAGE_KEY), null);
  assert.equal(storage.getItem("draft-battler:solo-run:v7"), "active-run");
});

test("a failed history write can durably queue the receipt and recover it exactly once", () => {
  class OneKeyFailureStorage extends MemoryStorage {
    failHistoryWrites = true;

    setItem(key, value) {
      if (key === SOLO_RUN_HISTORY_STORAGE_KEY && this.failHistoryWrites) {
        throw new Error("temporary history write failure");
      }
      super.setItem(key, value);
    }
  }

  const storage = new OneKeyFailureStorage();
  const summary = createSummary(8);
  assert.equal(recordSoloRunSummary(storage, summary), false);
  assert.equal(queueSoloRunSummary(storage, summary), true);
  assert.ok(storage.getItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY));

  storage.failHistoryWrites = false;
  assert.equal(flushQueuedSoloRunSummaries(storage), true);
  assert.deepEqual(loadSoloRunHistory(storage), [summary]);
  assert.equal(storage.getItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY), null);

  assert.equal(flushQueuedSoloRunSummaries(storage), true);
  assert.deepEqual(loadSoloRunHistory(storage), [summary]);
});
