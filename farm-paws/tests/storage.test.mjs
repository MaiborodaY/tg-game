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
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };

  saveBestScore(12);
  saveSnakeBestScore(5);
  saveTetrisBestScore(8);

  assert.equal(loadBestScore(), 12);
  assert.equal(loadSnakeBestScore(), 5);
  assert.equal(loadTetrisBestScore(), 8);
  assert.equal(values.size, 3);

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
