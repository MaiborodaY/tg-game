import assert from "node:assert/strict";
import test from "node:test";
import {
  loadBestScore,
  loadSnakeBestScore,
  loadTetrisAudioEnabled,
  loadTetrisBestScore,
  saveBestScore,
  saveSnakeBestScore,
  saveTetrisAudioEnabled,
  saveTetrisBestScore
} from "../src/storage.ts";

test("keeps Farm Paws, Snake, and Tetris records in separate storage keys", () => {
  const oldValues = [
    ["farm-paws-best-score-v1", "99"],
    ["farm-paws-snake-best-score-v1", "99"],
    ["farm-paws-snake-best-score-v2", "99"],
    ["farm-paws-tetris-best-score-v1", "99"]
  ];
  const values = new Map(oldValues);
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };

  assert.equal(loadBestScore(), 0);
  assert.equal(loadSnakeBestScore(), 0);
  assert.equal(loadTetrisBestScore(), 0);
  saveBestScore(12);
  saveSnakeBestScore(5);
  saveTetrisBestScore(8);

  assert.equal(loadBestScore(), 12);
  assert.equal(loadSnakeBestScore(), 5);
  assert.equal(loadTetrisBestScore(), 8);
  saveSnakeBestScore(11, "courtyard");
  saveSnakeBestScore(7, "warehouse");
  assert.equal(loadSnakeBestScore("garden"), 5);
  assert.equal(loadSnakeBestScore("courtyard"), 11);
  assert.equal(loadSnakeBestScore("warehouse"), 7);
  assert.equal(values.size, 9);
  for (const [key, value] of oldValues) assert.equal(values.get(key), value);

  delete globalThis.window;
});

test("persists the Tetris sound preference separately and defaults to enabled", () => {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };

  assert.equal(loadTetrisAudioEnabled(), true);
  saveTetrisAudioEnabled(false);
  assert.equal(loadTetrisAudioEnabled(), false);
  saveTetrisAudioEnabled(true);
  assert.equal(loadTetrisAudioEnabled(), true);
  assert.equal(values.size, 1);

  delete globalThis.window;
});

test("keeps Tetris sound enabled when storage is unavailable or malformed", () => {
  globalThis.window = {
    localStorage: {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); }
    }
  };
  assert.equal(loadTetrisAudioEnabled(), true);
  assert.doesNotThrow(() => saveTetrisAudioEnabled(false));

  globalThis.window = {
    localStorage: {
      getItem: () => "broken",
      setItem() {}
    }
  };
  assert.equal(loadTetrisAudioEnabled(), true);

  delete globalThis.window;
});
