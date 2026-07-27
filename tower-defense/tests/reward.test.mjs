import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  MINIAPP_REWARD_SESSION_KEY,
  MINIAPP_REWARD_TTL_MS,
  TOWER_DEFENSE_FINISH_URL,
  TOWER_DEFENSE_START_URL,
  captureFinalResult,
  clearMiniAppReward,
  createRewardFinisher,
  decideRewardLaunch,
  loadMiniAppReward,
  parseLaunchParams,
  saveMiniAppReward,
  startMiniAppReward,
} from "../src/reward.ts";

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
    runNumber: 2,
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

test("launch decision keeps legacy rewards, uses Mini App auth, and leaves plain browsers in practice", () => {
  const practiceLaunch = parseLaunchParams("?game_id=td&start_url=https%3A%2F%2Fevil.example%2Fsteal");
  assert.equal(decideRewardLaunch(practiceLaunch, "").kind, "practice");
  assert.deepEqual(decideRewardLaunch(practiceLaunch, "query_id=telegram"), {
    kind: "miniapp",
    initData: "query_id=telegram",
  });

  const legacyLaunch = parseLaunchParams(
    "?run_id=legacy&token=legacy-token&run_number=4&finish_url=https%3A%2F%2Fbot.example%2Ffinish",
  );
  assert.equal(decideRewardLaunch(legacyLaunch, "query_id=telegram").kind, "legacy");
  assert.equal(decideRewardLaunch(parseLaunchParams("?run_id=broken"), "query_id=telegram").kind, "error");
});

test("Mini App start posts initData only to the pinned API and parses snake_case reward data", async () => {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, init });
    return response({
      ok: true,
      game_id: "td",
      run_id: "run-mini-1",
      token: "token-mini-1",
      run_number: 3,
      finish_url: TOWER_DEFENSE_FINISH_URL,
    });
  };

  const started = await startMiniAppReward("query_id=telegram&hash=signed", { fetch });
  assert.deepEqual(started, {
    ok: true,
    reward: {
      mode: "server",
      runId: "run-mini-1",
      token: "token-mini-1",
      runNumber: 3,
      finishUrl: TOWER_DEFENSE_FINISH_URL,
    },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_START_URL);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
    game_id: "td",
  });
  assert.deepEqual(requests[0].init.headers, { "content-type": "application/json" });
});

test("Mini App start rejects mismatched game, finish endpoint, and HTTP failures", async () => {
  const wrongGame = await startMiniAppReward("signed", {
    fetch: async () => response({
      ok: true,
      game_id: "runner",
      run_id: "run",
      token: "token",
      run_number: 1,
      finish_url: TOWER_DEFENSE_FINISH_URL,
    }),
  });
  assert.equal(wrongGame.ok, false);

  const wrongFinish = await startMiniAppReward("signed", {
    fetch: async () => response({
      ok: true,
      game_id: "td",
      run_id: "run",
      token: "token",
      run_number: 1,
      finish_url: "https://evil.example/finish",
    }),
  });
  assert.equal(wrongFinish.ok, false);
  assert.equal((await startMiniAppReward("signed", {
    fetch: async () => response({ ok: false, code: "unauthorized" }, 401),
  })).error, "http_401");
});

test("Mini App reward survives reload in one tab and expires before the server run", () => {
  const session = memoryStorage();
  const reward = miniAppReward();
  const savedAt = 10_000;
  assert.equal(saveMiniAppReward(session, reward, savedAt), true);
  assert.equal(session.getItem(MINIAPP_REWARD_SESSION_KEY).includes("init_data"), false);
  assert.deepEqual(loadMiniAppReward(session, savedAt + 1), reward);
  assert.deepEqual(loadMiniAppReward(session, savedAt + MINIAPP_REWARD_TTL_MS - 1), reward);

  clearMiniAppReward(session);
  assert.equal(loadMiniAppReward(session, savedAt + 2), null);
  saveMiniAppReward(session, reward, savedAt);
  assert.equal(loadMiniAppReward(session, savedAt + MINIAPP_REWARD_TTL_MS), null);
  assert.equal(session.getItem(MINIAPP_REWARD_SESSION_KEY), null);
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
  return { mode: "server", runId: "run-1", token: "token-1", runNumber: 1, finishUrl: "https://bot.example/finish" };
}

function miniAppReward() {
  return {
    mode: "server",
    runId: "run-mini-cache",
    token: "token-mini-cache",
    runNumber: 5,
    finishUrl: TOWER_DEFENSE_FINISH_URL,
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
