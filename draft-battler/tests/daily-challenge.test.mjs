import assert from "node:assert/strict";
import test from "node:test";

import {
  createDailyChallenge,
  createTodayDailyChallenge,
  getUtcDateKey,
} from "../src/dailyChallenge.ts";

test("UTC date keys and seeds ignore local calendar representations", () => {
  const earlyUtc = new Date("2026-08-19T23:30:00-02:00");
  const lateUtc = new Date("2026-08-21T01:00:00+03:00");

  assert.equal(getUtcDateKey(earlyUtc), "2026-08-20");
  assert.equal(getUtcDateKey(lateUtc), "2026-08-20");
  assert.deepEqual(createDailyChallenge(earlyUtc), createDailyChallenge(lateUtc));
  assert.deepEqual(createDailyChallenge(earlyUtc.getTime()), createDailyChallenge(earlyUtc));
});

test("the UTC midnight boundary starts a different deterministic challenge", () => {
  const beforeMidnight = createDailyChallenge(new Date("2026-08-20T23:59:59.999Z"));
  const atMidnight = createDailyChallenge(new Date("2026-08-21T00:00:00.000Z"));

  assert.equal(beforeMidnight.dateKey, "2026-08-20");
  assert.equal(atMidnight.dateKey, "2026-08-21");
  assert.notEqual(beforeMidnight.seed, atMidnight.seed);
});

test("the v1 daily identity is opaque, bounded, and protected by a golden vector", () => {
  const challenge = createDailyChallenge(Date.UTC(2026, 7, 20, 12));

  assert.deepEqual(challenge, {
    source: "daily",
    dateKey: "2026-08-20",
    seed: "bro-battler:daily:v1:a4f809bca7f80e75",
  });
  assert.doesNotMatch(challenge.seed, /2026|08-20/u);
  assert.match(challenge.seed, /^bro-battler:daily:v1:[0-9a-f]{16}$/u);
  assert.ok(challenge.seed.length <= 64);
});

test("today helper reads its injected clock exactly once", () => {
  let calls = 0;
  const challenge = createTodayDailyChallenge(() => {
    calls += 1;
    return new Date("2026-12-31T23:45:00Z");
  });

  assert.equal(calls, 1);
  assert.equal(challenge.dateKey, "2026-12-31");
  assert.deepEqual(challenge, createDailyChallenge(Date.parse("2026-12-31T08:00:00Z")));
});

test("invalid and out-of-contract dates throw before producing an identity", () => {
  assert.throws(() => getUtcDateKey(new Date(Number.NaN)), RangeError);
  assert.throws(() => createDailyChallenge(Number.NaN), RangeError);
  assert.throws(() => createDailyChallenge(Number.POSITIVE_INFINITY), RangeError);
  assert.throws(() => createDailyChallenge(Date.UTC(10_000, 0, 1)), RangeError);
  assert.throws(() => createDailyChallenge("2026-08-20"), TypeError);
  assert.throws(() => createTodayDailyChallenge(() => new Date(Number.NaN)), RangeError);
});
