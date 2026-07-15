import assert from "node:assert/strict";
import test from "node:test";
import { finishSnakeAttempt, startSnakeAttempt } from "../src/snakeRunFlow.ts";

const serverSession = {
  mode: "server",
  game: "snake",
  runId: "farm_paws_shared_attempt",
  bestScore: 0,
  error: null,
  petName: "Barsik",
  petType: "cat",
  lang: "ru",
  code: null,
  dailyLimit: 5,
  dailyStarts: 3
};

test("starts Snake through the shared run starter and keeps the server attempt", async () => {
  const calls = [];
  const result = await startSnakeAttempt(async (bestScore) => {
    calls.push(bestScore);
    return serverSession;
  }, 7.9);

  assert.deepEqual(calls, [7]);
  assert.equal(result, serverSession);
  assert.equal(result.dailyStarts, 3);
  assert.equal(result.dailyLimit, 5);
});

test("finishes Snake through the shared reward flow with a normalized result", async () => {
  const calls = [];
  const expectedResult = {
    mode: "server",
    ok: true,
    duplicate: false,
    xpReward: 4,
    bestScore: 9,
    petXp: 42,
    error: null
  };

  const result = await finishSnakeAttempt(async (session, payload) => {
    calls.push({ session, payload });
    return expectedResult;
  }, serverSession, {
    score: 4.8,
    startedAt: 1_000,
    finishedAt: 6_250
  });

  assert.equal(result, expectedResult);
  assert.deepEqual(calls, [{
    session: serverSession,
    payload: {
      score: 4,
      round: 0,
      hpLeft: 0,
      durationMs: 5_250
    }
  }]);
});

test("never submits negative Snake scores or durations", async () => {
  let submittedPayload = null;
  await finishSnakeAttempt(async (_session, payload) => {
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
    score: -10,
    startedAt: 5_000,
    finishedAt: 1_000
  });

  assert.deepEqual(submittedPayload, {
    score: 0,
    round: 0,
    hpLeft: 0,
    durationMs: 0
  });
});
