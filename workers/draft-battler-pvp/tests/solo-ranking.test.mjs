import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { autoplayRun } from "../../../draft-battler/src/game/run.ts";
import { replaySoloRunChoices, SOLO_RUN_RULESET_VERSION } from "../../../draft-battler/src/soloPersistence.ts";
import { readBroBattlerLeaderboard } from "../src/ranking.ts";
import { finishRankedSoloRun, startRankedSoloRun } from "../src/soloRanking.ts";

const monday = Date.UTC(2026, 8, 7);
const viewer = { userId: "42", displayName: "Telegram name" };
const choices = (run) => run.roundHistory.map(({ draftRerollCount, playerSlots }) => ({ draftRerollCount, playerSlots }));

function database(t) {
  const sql = new DatabaseSync(":memory:");
  t.after(() => sql.close());
  // The schema is owned by work-bot/migrations/0266_create_brobattler_solo_runs.sql.
  sql.exec(`CREATE TABLE user_directory (user_id TEXT PRIMARY KEY, name TEXT);
    INSERT INTO user_directory VALUES ('42', 'World name');
    CREATE TABLE brobattler_solo_runs (
      run_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, display_name TEXT NOT NULL,
      seed TEXT NOT NULL, ruleset_version TEXT NOT NULL, started_at INTEGER NOT NULL,
      result TEXT CHECK(result IN ('win','loss','draw')),
      rounds_played INTEGER CHECK(rounds_played BETWEEN 1 AND 15), week_key TEXT, finished_at INTEGER
    );
    CREATE TABLE brobattler_match_results (
      user_id TEXT, display_name TEXT, week_key TEXT, result TEXT, finished_at INTEGER
    );
    INSERT INTO brobattler_match_results VALUES ('42','PvP name','2026-W37','win',1);`);
  const db = {
    prepare(query) {
      let values = [];
      return {
        bind(...bindings) {
          assert.ok(bindings.length <= 100, "D1 bound parameter limit");
          values = bindings;
          return this;
        },
        async first() { return sql.prepare(query).get(...values) ?? null; },
        async run() { return { success: true, meta: sql.prepare(query).run(...values) }; },
        async all() { return { success: true, results: sql.prepare(query).all(...values) }; },
      };
    },
    async batch(statements) { return Promise.all(statements.map((statement) => statement.all())); },
  };
  return { db, sql };
}

test("strong-bot start, verified win, lost-response retry and weekly top stay separate from PvP", async (t) => {
  const { db, sql } = database(t);
  const started = await startRankedSoloRun(db, viewer, SOLO_RUN_RULESET_VERSION, monday);
  assert.equal(started.participation, "ranked");
  assert.match(started.run.runId, /^ranked-strong:/);
  assert.equal(started.run.rulesetVersion, SOLO_RUN_RULESET_VERSION);
  assert.equal((await readBroBattlerLeaderboard(db, viewer, monday, "strong_bot")).totalPlayers, 0);
  // Pin the server-generated seed only in the test database for a reproducible win.
  sql.prepare("UPDATE brobattler_solo_runs SET seed=? WHERE run_id=?").run("ranked-test-6", started.run.runId);
  const run = autoplayRun("ranked-test-6", (state) => [state.draftOptions[0].cardId], "strong");
  assert.equal(run.outcome, "player");
  const settled = await finishRankedSoloRun(db, viewer, started.run.runId, choices(run), monday + 60_000);
  assert.deepEqual(settled, { status: "recorded", result: "win", weekKey: "2026-W37" });
  assert.deepEqual(await finishRankedSoloRun(db, viewer, started.run.runId, choices(run), monday + 7 * 86_400_000), settled);
  const ranking = await readBroBattlerLeaderboard(db, viewer, monday, "strong_bot");
  assert.equal(ranking.entries[0].displayName, "World name");
  assert.equal(ranking.viewer.wins, 1);
  assert.equal(ranking.viewer.games, 1);
  assert.equal("userId" in ranking.viewer, false);
  assert.equal((await readBroBattlerLeaderboard(db, viewer, monday)).viewer.displayName, "PvP name");
  assert.equal((await readBroBattlerLeaderboard(db, viewer, monday + 7 * 86_400_000, "strong_bot")).totalPlayers, 0);
});

test("solo finish uses its owner and strong-bot seed; incomplete and forged drafts are not settled", async (t) => {
  const { db, sql } = database(t);
  const { run } = await startRankedSoloRun(db, viewer, SOLO_RUN_RULESET_VERSION, monday);
  await assert.rejects(finishRankedSoloRun(db, { ...viewer, userId: "43" }, run.runId, [], monday), { code: "solo_run_not_found" });
  await assert.rejects(finishRankedSoloRun(db, undefined, run.runId, [], monday), { code: "invalid_init_data" });
  await assert.rejects(finishRankedSoloRun(db, viewer, run.runId, [], monday), { code: "invalid_solo_result" });
  const completed = autoplayRun(run.seed, (state) => [state.draftOptions[0].cardId], "strong");
  const forged = choices(completed);
  forged[0] = { ...forged[0], draftRerollCount: 100 };
  await assert.rejects(finishRankedSoloRun(db, viewer, run.runId, forged, monday), { code: "invalid_solo_result" });
  assert.equal(sql.prepare("SELECT result FROM brobattler_solo_runs").get().result, null);
  const valid = await finishRankedSoloRun(db, viewer, run.runId, choices(completed), monday);
  assert.equal(valid.result, completed.outcome === "player" ? "win" : completed.outcome === "enemy" ? "loss" : "draw");
});

test("practice has no server entry and incompatible clients cannot start ranked runs", async (t) => {
  const { db, sql } = database(t);
  assert.equal((await startRankedSoloRun(db, undefined, SOLO_RUN_RULESET_VERSION)).participation, "telegram_required");
  assert.equal((await startRankedSoloRun(db, { ...viewer, userId: "43" }, SOLO_RUN_RULESET_VERSION)).participation, "missing_profile");
  await assert.rejects(startRankedSoloRun(db, viewer, "old-version"), { code: "ruleset_mismatch" });
  assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM brobattler_solo_runs").get().count, 0);
});

test("compact replay derives the entire strong-bot run without accepting combat totals", () => {
  const run = autoplayRun("ranked-test-6", (state) => [state.draftOptions[0].cardId], "strong");
  assert.deepEqual(replaySoloRunChoices(run.seed, choices(run)), run);
  assert.equal(replaySoloRunChoices(run.seed, choices(run).slice(0, -1)), undefined);
  const forged = choices(run);
  forged[0] = { ...forged[0], playerSlots: forged[0].playerSlots.map((slot) => slot.cardId ? { ...slot, upgradeLevel: 1 } : slot) };
  assert.equal(replaySoloRunChoices(run.seed, forged), undefined);
});
