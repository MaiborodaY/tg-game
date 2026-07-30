import assert from "node:assert/strict";
import test from "node:test";

import {
  LEADERBOARD_CACHE_TTL_MS,
  TOWER_DEFENSE_LEADERBOARD_URL,
  createLeaderboardClient,
  parseLeaderboardResponse,
} from "../src/leaderboard.ts";

test("leaderboard response is strict, immutable and maps transport fields", () => {
  const parsed = parseLeaderboardResponse(responseBody(), "forest-gate");

  assert.deepEqual(parsed, {
    gameId: "td",
    levelId: "forest-gate",
    modeId: "campaign",
    maxWaves: 24,
    totalPlayers: 12,
    entries: [
      {
        rank: 1,
        name: "Mr.Maybik",
        outcome: "defeat",
        completedWaves: 23,
        durationMs: 519_000,
        isMe: true,
      },
      {
        rank: 2,
        name: null,
        outcome: "defeat",
        completedWaves: 22,
        durationMs: null,
        isMe: false,
      },
    ],
    me: {
      rank: 1,
      name: "Mr.Maybik",
      outcome: "defeat",
      completedWaves: 23,
      durationMs: 519_000,
      isMe: true,
    },
  });
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.entries), true);
  assert.equal(Object.isFrozen(parsed.entries[0]), true);
  assert.equal(Object.isFrozen(parsed.me), true);
});

test("leaderboard parser rejects schema drift and inconsistent identity data", () => {
  const valid = responseBody();
  const invalid = [
    { ...valid, extra: true },
    { ...valid, ok: false },
    { ...valid, game_id: "runner" },
    { ...valid, mode_id: "endless" },
    { ...valid, level_id: "northern-pass" },
    { ...valid, max_waves: 23.5 },
    { ...valid, total_players: 1 },
    { ...valid, entries: [{ ...valid.entries[0], nickname: "duplicate" }] },
    { ...valid, entries: [{ ...valid.entries[0], completed_waves: 25 }] },
    { ...valid, entries: [{ ...valid.entries[0], name: " Mr.Maybik" }] },
    { ...valid, entries: [{ ...valid.entries[0], rank: 2 }, valid.entries[1]], me: null },
    { ...valid, me: { ...valid.me, is_me: false } },
    { ...valid, me: { ...valid.me, duration_ms: 1 } },
    { ...valid, me: null },
  ];

  for (const candidate of invalid) {
    assert.equal(parseLeaderboardResponse(candidate, "forest-gate"), null);
  }
});

test("client posts pinned campaign request and deduplicates concurrent loads", async () => {
  const calls = [];
  let resolveFetch;
  const client = createLeaderboardClient("query_id=telegram&hash=signed", {
    fetch: (input, init) => {
      calls.push({ input, init });
      return new Promise((resolve) => { resolveFetch = resolve; });
    },
  });

  const first = client.load("forest-gate");
  const second = client.load("forest-gate");
  assert.equal(first, second);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, TOWER_DEFENSE_LEADERBOARD_URL);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.credentials, "omit");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
    level_id: "forest-gate",
    mode_id: "campaign",
  });

  resolveFetch(jsonResponse(responseBody()));
  assert.equal(await first, await second);
});

test("client caches for 30 seconds and invalidates one level or all levels", async () => {
  let now = 1_000;
  let calls = 0;
  const client = createLeaderboardClient("signed", {
    now: () => now,
    fetch: async (_input, init) => {
      calls += 1;
      const { level_id: levelId } = JSON.parse(init.body);
      return jsonResponse(responseBody({ levelId, maxWaves: levelId === "northern-pass" ? 18 : 24 }));
    },
  });

  const forest = await client.load("forest-gate");
  assert.equal(await client.load("forest-gate"), forest);
  assert.equal(calls, 1);

  now += LEADERBOARD_CACHE_TTL_MS - 1;
  assert.equal(await client.load("forest-gate"), forest);
  assert.equal(calls, 1);

  now += 1;
  assert.notEqual(await client.load("forest-gate"), forest);
  assert.equal(calls, 2);

  await client.load("northern-pass");
  assert.equal(calls, 3);
  client.invalidate("forest-gate");
  await client.load("forest-gate");
  assert.equal(calls, 4);
  await client.load("northern-pass");
  assert.equal(calls, 4);

  client.invalidate();
  await client.load("northern-pass");
  assert.equal(calls, 5);
});

test("invalidation during an in-flight request prevents stale cache repopulation", async () => {
  const resolvers = [];
  let calls = 0;
  const client = createLeaderboardClient("signed", {
    fetch: () => {
      calls += 1;
      return new Promise((resolve) => resolvers.push(resolve));
    },
  });

  const stale = client.load("forest-gate");
  client.invalidate("forest-gate");
  const fresh = client.load("forest-gate");
  assert.equal(calls, 2);

  resolvers[0](jsonResponse(responseBody()));
  await stale;
  resolvers[1](jsonResponse(responseBody()));
  const freshValue = await fresh;
  assert.equal(await client.load("forest-gate"), freshValue);
  assert.equal(calls, 2);
});

test("client rejects invalid inputs, HTTP failures, malformed responses and timeouts", async () => {
  assert.throws(() => createLeaderboardClient(""), /invalid_init_data/);
  assert.throws(() => createLeaderboardClient("x".repeat(32_769)), /invalid_init_data/);

  const never = createLeaderboardClient("signed", {
    timeoutMs: 5,
    fetch: async () => new Promise(() => undefined),
  });
  await assert.rejects(never.load("forest-gate"), /request_timeout/);
  await assert.rejects(never.load("../forest"), /invalid_level_id/);

  const failed = createLeaderboardClient("signed", {
    fetch: async () => jsonResponse({}, 503),
  });
  await assert.rejects(failed.load("forest-gate"), /http_503/);

  const malformed = createLeaderboardClient("signed", {
    fetch: async () => jsonResponse({ ...responseBody(), score: 68 }),
  });
  await assert.rejects(malformed.load("forest-gate"), /invalid_response/);
});

function responseBody({ levelId = "forest-gate", maxWaves = 24 } = {}) {
  const me = {
    rank: 1,
    name: "Mr.Maybik",
    outcome: "defeat",
    completed_waves: Math.min(23, maxWaves),
    duration_ms: 519_000,
    is_me: true,
  };
  return {
    ok: true,
    game_id: "td",
    level_id: levelId,
    mode_id: "campaign",
    max_waves: maxWaves,
    total_players: 12,
    entries: [
      me,
      {
        rank: 2,
        name: null,
        outcome: "defeat",
        completed_waves: Math.min(22, maxWaves),
        duration_ms: null,
        is_me: false,
      },
    ],
    me: { ...me },
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; },
  };
}
