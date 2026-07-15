import assert from "node:assert/strict";
import test from "node:test";
import { finishTetrisAttempt, startTetrisAttempt } from "../src/tetrisRunFlow.ts";

const serverSession = {
  mode: "server",
  game: "tetris",
  runId: "tetris-shared-attempt",
  bestScore: 0,
  error: null,
  petName: "Barsik",
  petType: "cat",
  lang: "ru",
  code: null,
  dailyLimit: 5,
  dailyStarts: 4
};

test("starts Tetris through the shared run starter with a normalized local record", async () => {
  const calls = [];
  const result = await startTetrisAttempt(async (bestScore) => {
    calls.push(bestScore);
    return serverSession;
  }, 11.9);

  assert.deepEqual(calls, [11]);
  assert.equal(result, serverSession);
  assert.equal(result.dailyStarts, 4);
  assert.equal(result.dailyLimit, 5);
});

test("maps Tetris lines, level, and duration to the shared finish payload", async () => {
  const calls = [];
  const expectedResult = {
    mode: "server",
    ok: true,
    duplicate: false,
    xpReward: 6,
    bestScore: 14,
    petXp: 48,
    error: null
  };

  const result = await finishTetrisAttempt(async (session, payload) => {
    calls.push({ session, payload });
    return expectedResult;
  }, serverSession, {
    lines: 12.8,
    level: 3.9,
    startedAt: 1_000.8,
    finishedAt: 8_250.4
  });

  assert.equal(result, expectedResult);
  assert.deepEqual(calls, [{
    session: serverSession,
    payload: {
      score: 12,
      round: 3,
      hpLeft: 0,
      durationMs: 7_250
    }
  }]);
});

test("never submits negative or non-finite Tetris values", async () => {
  let submittedPayload = null;
  await finishTetrisAttempt(async (_session, payload) => {
    submittedPayload = payload;
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
    lines: Number.NaN,
    level: -2,
    startedAt: 5_000,
    finishedAt: Number.POSITIVE_INFINITY
  });

  assert.deepEqual(submittedPayload, {
    score: 0,
    round: 0,
    hpLeft: 0,
    durationMs: 0
  });
});
