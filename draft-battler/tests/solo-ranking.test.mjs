import assert from "node:assert/strict";
import test from "node:test";
import { autoplayRun } from "../src/game/run.ts";
import { createSoloRunSession, SOLO_RUN_RULESET_VERSION } from "../src/soloPersistence.ts";
import { isRankedSoloRun, requestRankedSoloStart, SoloRankingDelivery, SOLO_RANKING_QUEUE_KEY } from "../src/soloRanking.ts";

const session = createSoloRunSession({ source: "standard", runId: "ranked-strong:12345678-1234-1234-1234-123456789012", now: 1 });
const run = autoplayRun("ranked-test-6", (state) => [state.draftOptions[0].cardId], "strong");
const reply = (body, status = 200) => new Response(JSON.stringify({ ok: true, ...body }), { status });
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("start sends signed identity and current ruleset, never a client seed or outcome", async () => {
  const result = await requestRankedSoloStart("https://game.example", {
    telegramInitData: "signed",
    fetcher: async (url, init) => {
      assert.equal(url, "https://game.example/api/solo/start");
      assert.equal(init.headers["x-telegram-init-data"], "signed");
      assert.deepEqual(JSON.parse(init.body), { rulesetVersion: SOLO_RUN_RULESET_VERSION });
      return reply({ participation: "ranked", run: { runId: session.runId, seed: "server-seed", startedAt: 1, rulesetVersion: SOLO_RUN_RULESET_VERSION } });
    },
  });
  assert.equal(result.run.seed, "server-seed");
});

test("only registered new strong-bot runs qualify, never standard, daily or history replays", () => {
  assert.equal(isRankedSoloRun(session, run), true);
  assert.equal(isRankedSoloRun(session, { ...run, botDifficulty: "standard" }), false);
  assert.equal(isRankedSoloRun({ ...session, source: "daily" }, run), false);
  assert.equal(isRankedSoloRun(createSoloRunSession({ source: "standard" }), run), false);
});

test("pending delivery survives a network failure and reload; retry sends choices once and clears the queue", async () => {
  const saved = storage();
  const delivery = new SoloRankingDelivery(saved);
  assert.equal(delivery.queue(session, run), true);
  await delivery.flush("", { telegramInitData: "signed", fetcher: async () => { throw new Error("offline"); } });
  assert.equal(delivery.status(session.runId), "pending");
  const restored = new SoloRankingDelivery(saved);
  let sent = 0;
  const options = {
    telegramInitData: "signed",
    fetcher: async (url, init) => {
      sent++;
      assert.equal(url, "/api/solo/finish");
      const body = JSON.parse(init.body);
      assert.deepEqual(Object.keys(body).sort(), ["rounds", "runId"]);
      assert.deepEqual(Object.keys(body.rounds[0]).sort(), ["draftRerollCount", "playerSlots"]);
      assert.equal(body.runId, session.runId);
      return reply({ status: "recorded", result: "win", weekKey: "2026-W37" });
    },
  };
  await Promise.all([restored.flush("", options), restored.flush("", options)]);
  assert.equal(sent, 1);
  assert.equal(restored.status(session.runId), "recorded");
  assert.deepEqual(JSON.parse(saved.getItem(SOLO_RANKING_QUEUE_KEY)), []);
  restored.queue(session, run);
  await restored.flush("", options);
  assert.equal(sent, 1);
});

test("storage failure is reported and expired authentication leaves the result retryable", async () => {
  const delivery = new SoloRankingDelivery(undefined);
  assert.equal(delivery.queue(session, run), false);
  await delivery.flush("", { telegramInitData: "expired", fetcher: async () => reply({ ok: false, code: "invalid_init_data" }, 401) });
  assert.equal(delivery.status(session.runId), "pending");
  await delivery.flush("", { telegramInitData: "fresh", fetcher: async () => reply({ ok: false, code: "ruleset_mismatch" }, 409) });
  assert.equal(delivery.status(session.runId), "rejected");
});
