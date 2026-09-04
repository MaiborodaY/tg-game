import assert from "node:assert/strict";
import test from "node:test";

import { PvpRequestError } from "../src/pvpSession.ts";
import { fetchPvpLeaderboard } from "../src/pvpLeaderboard.ts";

test("leaderboard sends Telegram auth and accepts bounded public player data", async () => {
  let captured;
  const snapshot = await fetchPvpLeaderboard("https://pvp.example", {
    telegramInitData: " signed-data ",
    fetcher: async (input, init) => {
      captured = { input: String(input), init };
      return new Response(JSON.stringify({
        ok: true,
        weekKey: "2026-W36",
        weekEndsAt: 1_788_739_200_000,
        totalPlayers: 1,
        entries: [{ rank: 1, displayName: "Alice", wins: 3, losses: 1, draws: 0, games: 4 }],
        viewer: { rank: 1, displayName: "Alice", wins: 3, losses: 1, draws: 0, games: 4 },
        participation: "ranked",
      }), { headers: { "content-type": "application/json" } });
    },
  });

  assert.equal(captured.input, "https://pvp.example/api/pvp/leaderboard");
  assert.equal(captured.init.headers["x-telegram-init-data"], "signed-data");
  assert.equal(snapshot.entries[0].displayName, "Alice");
  assert.equal("userId" in snapshot.entries[0], false);
});

test("leaderboard rejects malformed and failed responses with bounded errors", async () => {
  await assert.rejects(
    fetchPvpLeaderboard("", { fetcher: async () => new Response("{}") }),
    (error) => error instanceof PvpRequestError && error.code === "bad_response",
  );
  await assert.rejects(
    fetchPvpLeaderboard("", { fetcher: async () => new Response(JSON.stringify({ code: "rating_unavailable" }), { status: 503 }) }),
    (error) => error instanceof PvpRequestError && error.code === "rating_unavailable" && error.status === 503,
  );
});
