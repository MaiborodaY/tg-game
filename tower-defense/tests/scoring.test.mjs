import assert from "node:assert/strict";
import test from "node:test";

import { calculateRatingScore, MAX_RATING_SCORE } from "../src/game/scoring.ts";

test("later campaign acts award progressively more rating points", () => {
  assert.equal(calculateRatingScore(0), 0);
  assert.equal(calculateRatingScore(1), 2);
  assert.equal(calculateRatingScore(8), 16);
  assert.equal(calculateRatingScore(13), 31);
  assert.equal(calculateRatingScore(16), 40);
  assert.equal(calculateRatingScore(20), 56);
  assert.equal(calculateRatingScore(24), 72);
  assert.equal(MAX_RATING_SCORE, 72);
});

test("rating score clamps invalid and out-of-campaign wave counts", () => {
  assert.equal(calculateRatingScore(-5), 0);
  assert.equal(calculateRatingScore("9.9"), 19);
  assert.equal(calculateRatingScore(999), MAX_RATING_SCORE);
  assert.equal(calculateRatingScore(Number.NaN), 0);
});
