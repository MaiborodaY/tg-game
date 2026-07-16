import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  RUNNER_BEST_SCORE_KEY,
  captureRunnerFinalResult,
  createRunnerRewardFinisher,
  decodeRunnerPayload,
  loadRunnerBestScore,
  parseRunnerLaunchParams,
  saveRunnerBestScore,
  submitRunnerTelegramScore
} from "../src/runnerReward.ts";
import { onRequestPost as submitScore } from "../../functions/api/score.ts";

test("parses standard base64, base64url and complete reward launch parameters", () => {
  const payload = { user_id: 42, chat_id: -1001, message_id: 7, label: "Привіт" };
  const standard = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  const base64url = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  assert.deepEqual(decodeRunnerPayload(standard), payload);
  assert.deepEqual(decodeRunnerPayload(base64url), payload);

  const parsed = parseRunnerLaunchParams(
    `?p=${encodeURIComponent(base64url)}&run_id=run-1&token=secret&finish_url=${encodeURIComponent("/reward/finish#ignored")}`,
    "https://game.example/runner"
  );
  assert.deepEqual(parsed.payload, payload);
  assert.deepEqual(parsed.reward, {
    mode: "server",
    runId: "run-1",
    token: "secret",
    finishUrl: "https://game.example/reward/finish"
  });
});

test("malformed payloads and partial or unsafe reward credentials stay local", () => {
  assert.equal(decodeRunnerPayload("%%%"), null);
  assert.equal(decodeRunnerPayload(Buffer.from("[]").toString("base64url")), null);

  const partial = parseRunnerLaunchParams("?run_id=run-1&token=secret");
  assert.equal(partial.reward.mode, "local");

  const unsafe = parseRunnerLaunchParams(
    "?run_id=run-1&token=secret&finish_url=javascript%3Aalert(1)",
    "https://game.example/runner"
  );
  assert.equal(unsafe.reward.mode, "local");
});

test("best score storage is namespaced, monotonic, normalized and exception-safe", () => {
  const values = new Map([[RUNNER_BEST_SCORE_KEY, "17"]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };

  assert.equal(loadRunnerBestScore(storage), 17);
  assert.equal(saveRunnerBestScore(storage, 9), 17);
  assert.equal(saveRunnerBestScore(storage, 22.9), 22);
  assert.equal(values.get(RUNNER_BEST_SCORE_KEY), "22");

  values.set(RUNNER_BEST_SCORE_KEY, "not-a-number");
  assert.equal(loadRunnerBestScore(storage), 0);
  assert.equal(loadRunnerBestScore({ getItem: () => { throw new Error("blocked"); }, setItem() {} }), 0);
  assert.equal(saveRunnerBestScore({ getItem: () => null, setItem: () => { throw new Error("blocked"); } }, 5), 5);
});

test("reward finish retries after failure and always uses the immutable captured result", async () => {
  const source = { score: 81.9, durationMs: 1_234.9 };
  const finalResult = captureRunnerFinalResult(source.score, source.durationMs);
  source.score = 1;
  source.durationMs = 9_999;
  const requests = [];
  let call = 0;
  const fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body));
    call += 1;
    if (call === 1) throw new Error("offline");
    return response({ ok: true });
  };
  const finisher = createRunnerRewardFinisher({
    mode: "server",
    runId: "run-7",
    token: "token-7",
    finishUrl: "https://reward.example/finish"
  }, finalResult, { fetch, timeoutMs: 100 });

  assert.equal(Object.isFrozen(finalResult), true);
  assert.equal((await finisher.finish()).ok, false);
  assert.equal(finisher.status, "idle");
  assert.equal((await finisher.finish()).ok, true);
  assert.equal(finisher.status, "succeeded");
  assert.equal(finisher.attempts, 2);
  assert.deepEqual(requests, [
    { run_id: "run-7", token: "token-7", score: 81, duration_ms: 1_234 },
    { run_id: "run-7", token: "token-7", score: 81, duration_ms: 1_234 }
  ]);

  await finisher.finish();
  assert.equal(requests.length, 2, "a confirmed finish is cached instead of submitted twice");
});

test("concurrent finish calls share one request and a timeout remains retryable", async () => {
  let resolveRequest;
  let calls = 0;
  const fetch = () => {
    calls += 1;
    return new Promise((resolve) => { resolveRequest = resolve; });
  };
  const finisher = createRunnerRewardFinisher(serverReward(), captureRunnerFinalResult(12, 300), {
    fetch,
    timeoutMs: 100
  });
  const first = finisher.finish();
  const second = finisher.finish();
  assert.equal(calls, 1);
  resolveRequest(response({ ok: true }));
  assert.equal((await first).ok, true);
  assert.equal((await second).ok, true);

  let timeoutCalls = 0;
  const timed = createRunnerRewardFinisher(serverReward(), captureRunnerFinalResult(3, 20), {
    fetch: async (_url, init) => {
      timeoutCalls += 1;
      if (timeoutCalls === 1) return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
      return response({ ok: true });
    },
    timeoutMs: 5
  });
  assert.equal((await timed.finish()).ok, false);
  assert.equal(timed.status, "idle");
  assert.equal((await timed.finish()).ok, true);
  assert.equal(timeoutCalls, 2);
});

test("an already-finished reward is accepted even when the backend reports duplicate with 409", async () => {
  const finisher = createRunnerRewardFinisher(
    serverReward(),
    captureRunnerFinalResult(18, 900),
    { fetch: async () => response({ duplicate: true }, 409) },
  );

  assert.deepEqual(await finisher.finish(), {
    mode: "server",
    ok: true,
    duplicate: true,
    error: null,
  });
  assert.equal(finisher.status, "succeeded");
});

test("missing reward credentials are local and do not call fetch", async () => {
  let calls = 0;
  const finisher = createRunnerRewardFinisher({
    mode: "local",
    runId: null,
    token: null,
    finishUrl: null
  }, captureRunnerFinalResult(5, 100), {
    fetch: async () => {
      calls += 1;
      return response({ ok: true });
    }
  });

  assert.deepEqual(await finisher.finish(), {
    mode: "local",
    ok: true,
    duplicate: false,
    error: null
  });
  assert.equal(finisher.status, "local");
  assert.equal(calls, 0);
});

test("Telegram score submission is separate and uses the captured final score", async () => {
  const mutable = { score: 44, durationMs: 500 };
  const finalResult = captureRunnerFinalResult(mutable.score, mutable.durationMs);
  mutable.score = 999;
  let requestBody;
  const result = await submitRunnerTelegramScore(
    { user_id: 8, inline_message_id: "inline-1" },
    finalResult,
    {
      fetch: async (_url, init) => {
        requestBody = JSON.parse(init.body);
        return response({ ok: true });
      }
    }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(requestBody, {
    score: 44,
    payload: { user_id: 8, inline_message_id: "inline-1" }
  });
});

test("score endpoint validates payload and never forces a lower Telegram score", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  let telegramBody;
  globalThis.fetch = async (_url, init) => {
    telegramBody = JSON.parse(init.body);
    return new globalThis.Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const response = await submitScore({
    request: new globalThis.Request("https://game.example/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        score: 19.8,
        payload: { user_id: "42", chat_id: "-1001", message_id: "7", ignored: "value" }
      })
    }),
    env: { BOT_TOKEN: "bot-token" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(telegramBody, {
    user_id: 42,
    score: 19,
    disable_edit_message: false,
    chat_id: -1001,
    message_id: 7
  });
  assert.equal("force" in telegramBody, false);

  const invalid = await submitScore({
    request: new globalThis.Request("https://game.example/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ score: null, payload: { user_id: 42, inline_message_id: "inline" } })
    }),
    env: { BOT_TOKEN: "bot-token" }
  });
  assert.equal(invalid.status, 400);
});

function serverReward() {
  return {
    mode: "server",
    runId: "run-1",
    token: "token-1",
    finishUrl: "https://reward.example/finish"
  };
}

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}
