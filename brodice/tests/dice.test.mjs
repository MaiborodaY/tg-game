import assert from "node:assert/strict";
import test from "node:test";

import {
  countFaces,
  countSuccesses,
  normalizeDiceCount,
  rollDice,
} from "../src/dice.ts";

test("dice count is normalized to the supported 1-100 range", () => {
  assert.equal(normalizeDiceCount(-4), 1);
  assert.equal(normalizeDiceCount("12.9"), 12);
  assert.equal(normalizeDiceCount(500), 100);
  assert.equal(normalizeDiceCount("invalid", 7), 7);
});

test("rollDice maps unbiased bytes to every d6 face", () => {
  const faces = rollDice(6, (bytes) => {
    bytes.fill(0);
    bytes.set([0, 1, 2, 3, 4, 5]);
  });
  assert.deepEqual(faces, [1, 2, 3, 4, 5, 6]);
});

test("rollDice rejects 252-255 before applying modulo", () => {
  let round = 0;
  const faces = rollDice(4, (bytes) => {
    bytes.fill(round === 0 ? 255 : 0);
    if (round > 0) bytes.set([0, 1, 2, 3]);
    round += 1;
  });
  assert.deepEqual(faces, [1, 2, 3, 4]);
  assert.equal(round, 2);
});

test("face buckets always account for the complete roll", () => {
  const faces = [1, 1, 2, 4, 5, 5, 6, 6, 6];
  const counts = countFaces(faces);
  assert.deepEqual(counts, [2, 1, 0, 1, 2, 3]);
  assert.equal(counts.reduce((sum, count) => sum + count, 0), faces.length);
});

test("success targets count the same dice without rerolling", () => {
  const faces = [1, 2, 3, 4, 5, 6];
  assert.equal(countSuccesses(faces, 2), 5);
  assert.equal(countSuccesses(faces, 4), 3);
  assert.equal(countSuccesses(faces, 5), 2);
  assert.equal(countSuccesses(faces, 6), 1);
  assert.deepEqual(faces, [1, 2, 3, 4, 5, 6]);
});
