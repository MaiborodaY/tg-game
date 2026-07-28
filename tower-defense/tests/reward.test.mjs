import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  MINIAPP_BOOTSTRAP_SESSION_KEY,
  MINIAPP_REWARD_SESSION_KEY,
  MINIAPP_REWARD_TTL_MS,
  TOWER_DEFENSE_FINISH_URL,
  TOWER_DEFENSE_START_URL,
  captureFinalResult,
  captureFinishSubmission,
  clearMiniAppReward,
  createRewardFinisher,
  decideRewardLaunch,
  loadMiniAppBootstrap,
  loadMiniAppReward,
  parseLaunchParams,
  replaceMiniAppBootstrap,
  saveMiniAppBootstrap,
  saveMiniAppReward,
  startMiniAppReward,
} from "../src/reward.ts";

const FUTURE_EXPIRES_AT = 4_102_444_800_000;

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
    return response(miniAppStartBody({
      run_id: "run-mini-1",
      token: "token-mini-1",
      run_number: 3,
    }));
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
    bootstrap: {
      reward: {
        mode: "server",
        runId: "run-mini-1",
        token: "token-mini-1",
        runNumber: 3,
        finishUrl: TOWER_DEFENSE_FINISH_URL,
      },
      resumed: false,
      expiresAt: FUTURE_EXPIRES_AT,
      binding: { contentVersion: 2, levelId: "forest-gate", modeId: "campaign" },
      profile: miniAppProfile(),
    },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_START_URL);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
    game_id: "td",
    client_content_version: 2,
  });
  assert.deepEqual(requests[0].init.headers, { "content-type": "application/json" });
});

test("Mini App start rejects mismatched game, finish endpoint, and HTTP failures", async () => {
  const wrongGame = await startMiniAppReward("signed", {
    fetch: async () => response(miniAppStartBody({
      game_id: "runner",
    })),
  });
  assert.equal(wrongGame.ok, false);

  const wrongFinish = await startMiniAppReward("signed", {
    fetch: async () => response(miniAppStartBody({
      finish_url: "https://evil.example/finish",
    })),
  });
  assert.equal(wrongFinish.ok, false);
  assert.equal((await startMiniAppReward("signed", {
    fetch: async () => response({ ok: false, code: "unauthorized" }, 401),
  })).error, "http_401");
});

test("Mini App start forwards only a bounded resume hint and rejects malformed bootstrap metadata", async () => {
  const requests = [];
  const started = await startMiniAppReward("signed", {
    resumeRunId: " run-to-resume ",
    fetch: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return response(miniAppStartBody({ resumed: true }));
    },
  });
  assert.equal(started.ok, true);
  assert.equal(started.bootstrap.resumed, true);
  assert.equal(requests[0].resume_run_id, "run-to-resume");

  const malformed = await startMiniAppReward("signed", {
    fetch: async () => response(miniAppStartBody({
      binding: { content_version: 999, level_id: "forest-gate", mode_id: "campaign" },
    })),
  });
  assert.equal(malformed.ok, false);

  const lockedBinding = await startMiniAppReward("signed", {
    fetch: async () => {
      const body = miniAppStartBody();
      return response({
        ...body,
        profile: { ...body.profile, unlocked_level_ids: ["northern-pass"], best_results: [] },
      });
    },
  });
  assert.equal(lockedBinding.ok, false);

  const expired = await startMiniAppReward("signed", {
    now: () => 20_000,
    fetch: async () => response(miniAppStartBody({ expires_at: 19_999 })),
  });
  assert.equal(expired.ok, false);
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

test("Mini App bootstrap cache preserves binding and profile without persisting initData", () => {
  const session = memoryStorage();
  const bootstrap = { ...miniAppBootstrap(), expiresAt: 60_000 };
  const savedAt = 10_000;
  assert.equal(saveMiniAppBootstrap(session, bootstrap, savedAt), true);
  const raw = session.getItem(MINIAPP_BOOTSTRAP_SESSION_KEY);
  assert.equal(raw.includes("init_data"), false);
  assert.equal(raw.includes("query_id"), false);
  assert.deepEqual(loadMiniAppBootstrap(session, savedAt + 1), bootstrap);
  assert.deepEqual(loadMiniAppReward(session, savedAt + 1), bootstrap.reward);
  assert.equal(session.getItem(MINIAPP_REWARD_SESSION_KEY), null);

  assert.equal(loadMiniAppBootstrap(session, bootstrap.expiresAt), null);
  assert.equal(session.getItem(MINIAPP_BOOTSTRAP_SESSION_KEY), null);

  assert.equal(saveMiniAppBootstrap(session, bootstrap, savedAt), true);
  const legacyReward = { ...bootstrap.reward, runId: "legacy-after-bootstrap" };
  assert.equal(saveMiniAppReward(session, legacyReward, savedAt), true);
  assert.equal(session.getItem(MINIAPP_BOOTSTRAP_SESSION_KEY), null);
  assert.deepEqual(loadMiniAppReward(session, savedAt + 1), legacyReward);
});

test("bootstrap replacement fails closed instead of retaining stale finish credentials", () => {
  const session = memoryStorage();
  const oldBootstrap = { ...miniAppBootstrap(), expiresAt: 60_000 };
  assert.equal(saveMiniAppBootstrap(session, oldBootstrap, 10_000), true);
  const failingStorage = {
    getItem: session.getItem,
    setItem() { throw new Error("quota"); },
    removeItem: session.removeItem,
  };
  const replacement = {
    ...oldBootstrap,
    reward: { ...oldBootstrap.reward, runId: "replacement-run", token: "replacement-token" },
  };

  assert.equal(replaceMiniAppBootstrap(failingStorage, replacement, 11_000), false);
  assert.equal(session.getItem(MINIAPP_BOOTSTRAP_SESSION_KEY), null);
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

test("finish posts immutable campaign metadata and returns an applied strict profile", async () => {
  const requests = [];
  const submission = captureFinishSubmission(72.9, 81_234.9, "victory", 24.9);
  const finisher = createRewardFinisher(serverReward(), submission, {
    fetch: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return response({
        ok: true,
        profile_sync: "applied",
        profile: miniAppStartBody().profile,
      });
    },
  });

  assert.deepEqual(finisher.finishMetadata, { outcome: "victory", completedWaves: 24 });
  const result = await finisher.finish();
  assert.equal(result.ok, true);
  assert.equal(result.profileSync, "applied");
  assert.deepEqual(result.profile, miniAppProfile());
  assert.deepEqual(requests, [{
    run_id: "run-1",
    token: "token-1",
    score: 72,
    duration_ms: 81_234,
    outcome: "victory",
    completed_waves: 24,
  }]);
});

test("pending profile sync is explicit, retryable, and may omit a malformed optional snapshot", async () => {
  let calls = 0;
  const finisher = createRewardFinisher(
    serverReward(),
    captureFinishSubmission(17, 45_000, "defeat", 8),
    {
      fetch: async () => {
        calls += 1;
        return calls === 1
          ? response({ duplicate: true, profile_sync: "pending", profile: { malformed: true } }, 409)
          : response({
            duplicate: true,
            profile_sync: "applied",
            profile: miniAppStartBody().profile,
          }, 409);
      },
    },
  );

  const pending = await finisher.finish();
  assert.equal(pending.ok, true);
  assert.equal(pending.duplicate, true);
  assert.equal(pending.profile, null);
  assert.equal(pending.profileSync, "pending");
  assert.equal(finisher.status, "profile_pending");

  const applied = await finisher.finish();
  assert.equal(applied.ok, true);
  assert.equal(applied.profileSync, "applied");
  assert.deepEqual(applied.profile, miniAppProfile());
  assert.equal(finisher.status, "succeeded");
  assert.equal(calls, 2);
});

test("finish rejects malformed applied profiles while accepting a legacy response without profile fields", async () => {
  const malformed = createRewardFinisher(serverReward(), captureFinalResult(3, 9_000), {
    fetch: async () => response({ ok: true, profile_sync: "applied", profile: { malformed: true } }),
  });
  const rejected = await malformed.finish();
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error, "invalid_profile");
  assert.equal(rejected.profile, null);
  assert.equal(rejected.profileSync, null);

  const missingSync = createRewardFinisher(serverReward(), captureFinalResult(3, 9_000), {
    fetch: async () => response({ ok: true, profile: miniAppStartBody().profile }),
  });
  assert.equal((await missingSync.finish()).error, "invalid_profile_sync");

  const legacy = createRewardFinisher(serverReward(), captureFinalResult(3, 9_000), {
    fetch: async () => response({ ok: true }),
  });
  assert.deepEqual(await legacy.finish(), {
    mode: "server",
    ok: true,
    duplicate: false,
    error: null,
    profile: null,
    profileSync: null,
  });
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

function miniAppBootstrap() {
  return {
    reward: miniAppReward(),
    resumed: true,
    expiresAt: FUTURE_EXPIRES_AT,
    binding: { contentVersion: 2, levelId: "forest-gate", modeId: "campaign" },
    profile: miniAppProfile(),
  };
}

function miniAppProfile() {
  return {
    version: 1,
    revision: 4,
    unlockedLevelIds: ["forest-gate"],
    bestResults: [{
      levelId: "forest-gate",
      outcome: "defeat",
      completedWaves: 8,
      score: 17,
      durationMs: 45_000,
    }],
    ownedCosmeticSkins: [],
    equippedTowerSkins: [],
  };
}

function miniAppStartBody(overrides = {}) {
  return {
    ok: true,
    game_id: "td",
    run_id: "run-mini",
    token: "token-mini",
    run_number: 1,
    finish_url: TOWER_DEFENSE_FINISH_URL,
    resumed: false,
    expires_at: FUTURE_EXPIRES_AT,
    binding: { content_version: 2, level_id: "forest-gate", mode_id: "campaign" },
    profile: {
      version: 1,
      revision: 4,
      unlocked_level_ids: ["forest-gate"],
      best_results: [{
        level_id: "forest-gate",
        outcome: "defeat",
        completed_waves: 8,
        score: 17,
        duration_ms: 45_000,
      }],
      owned_cosmetic_skins: [],
      equipped_tower_skins: [],
    },
    ...overrides,
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
