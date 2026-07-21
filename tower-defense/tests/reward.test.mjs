import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import { captureFinalResult, createRewardFinisher, parseLaunchParams } from "../src/reward.ts";

test("real Telegram launch parameters preserve the cross-origin finish contract", () => {
  const payload = Buffer.from(JSON.stringify({ user_id: 42, lang: "ru" }), "utf8").toString("base64url");
  const parsed = parseLaunchParams(
    `https://td.example/game/?p=${payload}&game_id=td&run_id=run-7&token=secret&run_number=2&finish_url=${encodeURIComponent("https://bot.example/api/minigames/finish")}`,
  );
  assert.deepEqual(parsed.payload, { user_id: 42, lang: "ru" });
  assert.equal(parsed.rewardError, null);
  assert.deepEqual(parsed.reward, {
    mode: "server",
    runId: "run-7",
    token: "secret",
    finishUrl: "https://bot.example/api/minigames/finish",
  });
});

test("partial or unsafe reward launches are flagged instead of silently losing rewards", () => {
  const partial = parseLaunchParams("?run_id=run&token=token");
  assert.equal(partial.reward.mode, "local");
  assert.equal(partial.rewardError, "invalid_launch");
  const unsafe = parseLaunchParams(
    "?run_id=run&token=token&finish_url=javascript%3Aalert(1)",
    "https://td.example/",
  );
  assert.equal(unsafe.reward.mode, "local");
  assert.equal(unsafe.rewardError, "invalid_launch");
  assert.equal(parseLaunchParams("?game_id=td").rewardError, null);
});

test("finish retries immutable snake_case data, shares concurrent calls and accepts duplicate", async () => {
  const requests = [];
  let call = 0;
  const fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body));
    call += 1;
    if (call === 1) throw new Error("offline");
    return response({ duplicate: true }, 409);
  };
  const source = { score: 7.9, durationMs: 12_345.9 };
  const finisher = createRewardFinisher(serverReward(), captureFinalResult(source.score, source.durationMs), { fetch });
  source.score = 99;
  assert.equal((await finisher.finish()).ok, false);
  const second = finisher.finish();
  const concurrent = finisher.finish();
  assert.equal((await second).ok, true);
  assert.equal((await concurrent).duplicate, true);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests, [
    { run_id: "run-1", token: "token-1", score: 7, duration_ms: 12_345 },
    { run_id: "run-1", token: "token-1", score: 7, duration_ms: 12_345 },
  ]);
  await finisher.finish();
  assert.equal(requests.length, 2);
});

test("a timed-out finish stays retryable", async () => {
  let calls = 0;
  const fetch = () => {
    calls += 1;
    if (calls === 1) return new Promise(() => {});
    return Promise.resolve(response({ ok: true }));
  };
  const finisher = createRewardFinisher(serverReward(), captureFinalResult(3, 9_000), {
    fetch,
    timeoutMs: 5,
  });

  const timedOut = await finisher.finish();
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.error, "request_timeout");
  assert.equal((await finisher.finish()).ok, true);
  assert.equal(calls, 2);
});

function serverReward() {
  return { mode: "server", runId: "run-1", token: "token-1", finishUrl: "https://bot.example/finish" };
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
