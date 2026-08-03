import assert from "node:assert/strict";
import test from "node:test";

import {
  FOREST_ENDLESS_SEASON_ID,
  LEADERBOARD_CACHE_TTL_MS,
  NORTHERN_ENDLESS_SEASON_ID,
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
    seasonId: null,
    totalPlayers: 12,
    entries: [
      {
        rank: 1,
        name: "Mr.Maybik",
        outcome: "victory",
        completedWaves: 24,
        durationMs: 519_000,
        heroWins: [
          { heroId: "eira", completions: 2 },
          { heroId: "grak", completions: 1 },
        ],
        heroId: null,
        isMe: true,
      },
      {
        rank: 2,
        name: null,
        outcome: "defeat",
        completedWaves: 22,
        durationMs: null,
        heroWins: [],
        heroId: null,
        isMe: false,
      },
    ],
    me: {
      rank: 1,
      name: "Mr.Maybik",
      outcome: "victory",
      completedWaves: 24,
      durationMs: 519_000,
      heroWins: [
        { heroId: "eira", completions: 2 },
        { heroId: "grak", completions: 1 },
      ],
      heroId: null,
      isMe: true,
    },
  });
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.entries), true);
  assert.equal(Object.isFrozen(parsed.entries[0]), true);
  assert.equal(Object.isFrozen(parsed.entries[0].heroWins), true);
  assert.equal(Object.isFrozen(parsed.entries[0].heroWins[0]), true);
  assert.equal(Object.isFrozen(parsed.me), true);
});

test("leaderboard parser keeps rollout compatibility with legacy entries", () => {
  const v2 = responseBody();
  const entries = v2.entries.map(({ hero_wins: _heroWins, ...entry }) => entry);
  const { hero_wins: _heroWins, ...me } = v2.me;
  const parsed = parseLeaderboardResponse({ ...v2, entries, me }, "forest-gate");

  assert.deepEqual(parsed?.entries.map((entry) => entry.heroWins), [[], []]);
  assert.deepEqual(parsed?.me?.heroWins, []);
  assert.equal(Object.isFrozen(parsed?.entries[0].heroWins), true);
});

test("endless leaderboard is season-bound and identifies each run hero", () => {
  const entry = {
    rank: 1,
    name: "Mr.Maybik",
    outcome: "defeat",
    completed_waves: 68,
    duration_ms: 519_000,
    hero_wins: [],
    hero_id: "eira",
    is_me: true,
  };
  const parsed = parseLeaderboardResponse({
    ok: true,
    game_id: "td",
    level_id: "forest-gate",
    mode_id: "endless",
    max_waves: null,
    season_id: FOREST_ENDLESS_SEASON_ID,
    total_players: 1,
    entries: [entry],
    me: { ...entry },
  }, "forest-gate", "endless");

  assert.equal(parsed?.modeId, "endless");
  assert.equal(parsed?.maxWaves, null);
  assert.equal(parsed?.seasonId, FOREST_ENDLESS_SEASON_ID);
  assert.equal(parsed?.entries[0].heroId, "eira");

  const northernBody = {
    ok: true,
    game_id: "td",
    level_id: "northern-pass-v3",
    mode_id: "endless",
    max_waves: null,
    season_id: NORTHERN_ENDLESS_SEASON_ID,
    total_players: 1,
    entries: [entry],
    me: { ...entry },
  };
  const northern = parseLeaderboardResponse(northernBody, "northern-pass-v3", "endless");
  assert.equal(northern?.seasonId, NORTHERN_ENDLESS_SEASON_ID);
  assert.equal(parseLeaderboardResponse({
    ...northernBody,
    season_id: FOREST_ENDLESS_SEASON_ID,
  }, "northern-pass-v3", "endless"), null);
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
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: null }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "mage", completions: 1 }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "eira", completions: 0 }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "eira", completions: 1.5 }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "eira", completions: 1, extra: true }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "eira", completions: 1 }, { hero_id: "eira", completions: 2 }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "grak", completions: 1 }, { hero_id: "toren", completions: 1 }] }] },
    { ...valid, entries: [valid.entries[0], { ...valid.entries[1], hero_wins: [{ hero_id: "eira", completions: 1 }] }] },
    { ...valid, entries: [{ ...valid.entries[0], outcome: "defeat" }, valid.entries[1]] },
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
    stats_version: 3,
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
    outcome: "victory",
    completed_waves: maxWaves,
    duration_ms: 519_000,
    hero_wins: [
      { hero_id: "eira", completions: 2 },
      { hero_id: "grak", completions: 1 },
    ],
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
        hero_wins: [],
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
