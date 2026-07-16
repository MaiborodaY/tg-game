import assert from "node:assert/strict";
import test from "node:test";
import { finishFarmAttempt, isTerminalFarmResult } from "../src/farmRunFlow.ts";

const serverSession = {
  mode: "server",
  game: "farm_paws",
  runId: "seven-field-run",
  bestScore: 0,
  error: null,
  petName: "Barsik",
  petType: "cat",
  lang: "ru"
};

test("both victory and defeat finish the Farm Paws attempt", () => {
  assert.equal(isTerminalFarmResult("won"), true);
  assert.equal(isTerminalFarmResult("failed"), true);
  for (const result of ["ignored", "correct", "mistake", "roundComplete"]) {
    assert.equal(isTerminalFarmResult(result), false);
  }
});

test("a seven-field victory keeps the remaining hearts in the shared reward payload", async () => {
  let submitted = null;
  const expectedResult = {
    mode: "server",
    ok: true,
    duplicate: false,
    xpReward: 30,
    bestScore: 31,
    petXp: 130,
    error: null
  };

  const result = await finishFarmAttempt(async (session, payload) => {
    submitted = { session, payload };
    return expectedResult;
  }, serverSession, {
    score: 31,
    round: 7,
    hpLeft: 2,
    startedAt: 1_000,
    finishedAt: 48_500
  });

  assert.equal(result, expectedResult);
  assert.deepEqual(submitted, {
    session: serverSession,
    payload: {
      score: 31,
      round: 7,
      hpLeft: 2,
      durationMs: 47_500
    }
  });
});

test("Farm Paws never submits negative, non-finite, or excessive result values", async () => {
  let submitted = null;
  await finishFarmAttempt(async (_session, payload) => {
    submitted = payload;
    return {
      mode: "local",
      ok: true,
      duplicate: false,
      xpReward: null,
      bestScore: null,
      petXp: null,
      error: null
    };
  }, serverSession, {
    score: Number.NaN,
    round: -7,
    hpLeft: 99,
    startedAt: 8_000,
    finishedAt: Number.POSITIVE_INFINITY
  });

  assert.deepEqual(submitted, {
    score: 0,
    round: 0,
    hpLeft: 3,
    durationMs: 0
  });
});
