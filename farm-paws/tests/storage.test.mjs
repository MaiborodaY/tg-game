import assert from "node:assert/strict";
import test from "node:test";
import {
  loadBestScore,
  loadSnakeBestScore,
  saveBestScore,
  saveSnakeBestScore
} from "../src/storage.ts";

test("keeps Farm Paws and Snake records in separate storage keys", () => {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };

  saveBestScore(12);
  saveSnakeBestScore(5);

  assert.equal(loadBestScore(), 12);
  assert.equal(loadSnakeBestScore(), 5);
  assert.equal(values.size, 2);

  delete globalThis.window;
});
