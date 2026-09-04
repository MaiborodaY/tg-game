import assert from "node:assert/strict";
import test from "node:test";

import {
  createBroBattlerRankingCandidate,
  getCompletedCombatRounds,
  getUtcIsoWeek,
  readBroBattlerLeaderboard,
  settleBroBattlerMatch,
} from "../src/ranking.ts";

test("weekly keys follow UTC ISO weeks across year boundaries", () => {
  assert.deepEqual(getUtcIsoWeek(Date.UTC(2024, 11, 30, 12)), {
    weekKey: "2025-W01",
    weekEndsAt: Date.UTC(2025, 0, 6),
  });
});

test("leaderboard returns top ten plus the authenticated viewer without exposing ids", async () => {
  const prepared = [];
  const db = {
    prepare(sql) {
      return {
        bind(...bindings) {
          const statement = { sql, bindings };
          prepared.push(statement);
          return statement;
        },
      };
    },
    async batch(statements) {
      assert.equal(statements.length, 4);
      return [
        { results: [{ rank: 1, display_name: "Leader", wins: 5, losses: 1, draws: 0, games: 6 }] },
        { results: [{ total: 12 }] },
        { results: [{ rank: 12, display_name: "Viewer", wins: 1, losses: 2, draws: 0, games: 3 }] },
        { results: [{ user_id: "42" }] },
      ];
    },
  };
  const result = await readBroBattlerLeaderboard(
    db,
    { userId: "42", displayName: "Viewer" },
    Date.UTC(2026, 8, 4),
  );

  assert.equal(result.totalPlayers, 12);
  assert.equal(result.participation, "ranked");
  assert.equal(result.entries[0].rank, 1);
  assert.equal(result.viewer.rank, 12);
  assert.equal("userId" in result.entries[0], false);
  assert.match(prepared[0].sql, /ROW_NUMBER\(\) OVER/);
  assert.match(prepared[0].sql, /ORDER BY wins DESC/);
});

test("ranking candidates require two identities and one completed combat", () => {
  const room = {
    seats: {
      host: { identity: { userId: "1", displayName: "One" } },
      guest: { identity: { userId: "2", displayName: "Two" } },
    },
  };
  const outcome = { winner: "host", reason: "forfeit", finishedAt: Date.UTC(2026, 8, 4) };
  assert.equal(getCompletedCombatRounds({ round: 1 }), 0);
  assert.equal(createBroBattlerRankingCandidate(room, { matchId: "m1", round: 1, outcome }), undefined);
  assert.equal(getCompletedCombatRounds({ round: 2 }), 1);
  assert.equal(createBroBattlerRankingCandidate(room, { matchId: "m1", round: 2, outcome }).roundsPlayed, 1);
  assert.equal(createBroBattlerRankingCandidate({ seats: {} }, { matchId: "m1", round: 2, outcome }), undefined);
});

test("settlement writes both player results atomically with idempotent inserts", async () => {
  const statements = [];
  const db = {
    prepare(sql) {
      return {
        sql,
        bind(...bindings) {
          const statement = { sql, bindings };
          statements.push(statement);
          return {
            ...statement,
            async all() {
              return { results: [
                { user_id: "1", name: "World One" },
                { user_id: "2", name: "World Two" },
              ] };
            },
          };
        },
      };
    },
    async batch(batch) {
      assert.equal(batch.length, 2);
      return batch.map(() => ({ success: true, results: [] }));
    },
  };
  const status = await settleBroBattlerMatch(db, {
    seats: {
      host: { identity: { userId: "1", displayName: "Telegram One" } },
      guest: { identity: { userId: "2", displayName: "Telegram Two" } },
    },
  }, {
    matchId: "match-1",
    round: 1,
    combat: {},
    outcome: { winner: "host", reason: "castle", finishedAt: Date.UTC(2026, 8, 4) },
  });

  assert.equal(status, "recorded");
  const inserts = statements.filter(({ sql }) => sql.includes("INSERT OR IGNORE"));
  assert.equal(inserts.length, 2);
  assert.deepEqual(inserts.map(({ bindings }) => bindings[6]), ["win", "loss"]);
  assert.deepEqual(inserts.map(({ bindings }) => bindings[3]), ["World One", "World Two"]);
});
