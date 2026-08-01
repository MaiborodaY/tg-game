import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  MINIAPP_BOOTSTRAP_SESSION_KEY,
  MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY,
  MINIAPP_REWARD_SESSION_KEY,
  MINIAPP_REWARD_TTL_MS,
  TOWER_DEFENSE_FINISH_URL,
  TOWER_DEFENSE_BOOTSTRAP_URL,
  TOWER_DEFENSE_CHECKPOINT_URL,
  TOWER_DEFENSE_PURCHASE_ATTEMPTS_URL,
  TOWER_DEFENSE_RESET_ATTEMPTS_URL,
  TOWER_DEFENSE_START_URL,
  TOWER_DEFENSE_RESTART_URL,
  captureFinalResult,
  captureFinishSubmission,
  clearAttemptPurchaseRequestId,
  clearMiniAppReward,
  createRewardFinisher,
  decideAttemptPurchaseRequestIdLifecycle,
  decideRewardLaunch,
  executeDailyAttemptLimitPrimaryAction,
  fetchMiniAppProfile,
  getOrCreateAttemptPurchaseRequestId,
  loadMiniAppBootstrap,
  loadMiniAppReward,
  normalizeFinishOutcome,
  parseLaunchParams,
  purchaseMiniAppDailyAttempts,
  recordMiniAppCheckpoint,
  replaceMiniAppBootstrap,
  resetMiniAppDailyAttempts,
  restartMiniAppRun,
  saveMiniAppBootstrap,
  saveMiniAppReward,
  startMiniAppReward,
} from "../src/reward.ts";

const FUTURE_EXPIRES_AT = 4_102_444_800_000;

test("endless operational cap settles through the server-supported retired outcome", () => {
  assert.equal(normalizeFinishOutcome("endless", "victory"), "retired");
  assert.equal(normalizeFinishOutcome("endless", "defeat"), "defeat");
  assert.equal(normalizeFinishOutcome("endless", "gameover"), "defeat");
  assert.equal(normalizeFinishOutcome("campaign", "victory"), "victory");
});

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

test("read-only bootstrap returns profile and active binding without creating a run", async () => {
  const requests = [];
  const profile = miniAppStartBody().profile;
  const result = await fetchMiniAppProfile("query_id=telegram&hash=signed", {
    fetch: async (url, init) => {
      requests.push({ url, body: JSON.parse(init.body) });
      return response({
        ok: true,
        game_id: "td",
        content_version: 2,
        run_contract_version: 3,
        profile,
        active_run: {
          run_id: "active-run",
          expires_at: FUTURE_EXPIRES_AT,
          run_revision: 4,
          run_contract_version: 3,
          hero_id: "toren",
          confirmed_wave: 7,
          binding: { content_version: 2, level_id: "forest-gate", mode_id: "endless" },
        },
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.bootstrap.activeRun.runId, "active-run");
  assert.equal(result.bootstrap.activeRun.confirmedWave, 7);
  assert.equal(result.bootstrap.activeRun.heroId, "toren");
  assert.deepEqual(requests, [{
    url: TOWER_DEFENSE_BOOTSTRAP_URL,
    body: { init_data: "query_id=telegram&hash=signed" },
  }]);
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
      runContractVersion: 3,
      profile: miniAppProfile(),
      runRevision: 1,
      heroId: "eira",
      confirmedWave: 0,
      checkpointUrl: TOWER_DEFENSE_CHECKPOINT_URL,
      restartUrl: TOWER_DEFENSE_RESTART_URL,
    },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_START_URL);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
    game_id: "td",
    client_content_version: 2,
    client_protocol_version: 3,
  });
  assert.deepEqual(requests[0].init.headers, { "content-type": "application/json" });
});

test("v3 start carries the exact level, mode and hero selection", async () => {
  let body = null;
  const started = await startMiniAppReward("signed", {
    selection: { levelId: "forest-gate", modeId: "endless", heroId: "toren" },
    fetch: async (_url, init) => {
      body = JSON.parse(init.body);
      return response(miniAppStartBody({
        hero_id: "toren",
        binding: { content_version: 2, level_id: "forest-gate", mode_id: "endless" },
      }));
    },
  });

  assert.equal(started.ok, true);
  assert.deepEqual(body, {
    init_data: "signed",
    game_id: "td",
    client_content_version: 2,
    client_protocol_version: 3,
    level_id: "forest-gate",
    mode_id: "endless",
    hero_id: "toren",
  });
});

test("a legacy v2 active run remains resumable without ranked checkpoint metadata", async () => {
  const body = miniAppStartBody({ resumed: true });
  const {
    run_revision: _runRevision,
    hero_id: _heroId,
    confirmed_wave: _confirmedWave,
    checkpoint_url: _checkpointUrl,
    restart_url: _restartUrl,
    ...legacyBody
  } = body;
  const result = await startMiniAppReward("signed", {
    resumeRunId: "run-mini",
    selection: { levelId: "forest-gate", modeId: "campaign", heroId: "eira" },
    fetch: async () => response({ ...legacyBody, run_contract_version: 2 }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.bootstrap.runContractVersion, 2);
  assert.equal(result.bootstrap.runRevision, null);
  assert.equal(result.bootstrap.heroId, null);
  assert.equal(result.bootstrap.checkpointUrl, null);
  assert.equal(result.bootstrap.restartUrl, null);
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
  })).error, "unauthorized");

  assert.equal((await startMiniAppReward("signed", {
    fetch: async () => response({ ok: false, code: "daily_attempt_limit" }, 429),
  })).error, "daily_attempt_limit");
  assert.deepEqual(await startMiniAppReward("signed", {
    fetch: async () => response({
      ok: false,
      code: "daily_attempt_limit",
      can_reset_attempts: true,
    }, 429),
  }), { ok: false, error: "daily_attempt_limit", canResetAttempts: true });
  assert.equal((await startMiniAppReward("signed", {
    fetch: async () => response({ ok: false, code: "other_limit" }, 429),
  })).error, "other_limit");
});

test("daily attempt exhaustion accepts only the fixed server purchase offer", async () => {
  assert.deepEqual(await startMiniAppReward("signed", {
    fetch: async () => response({
      ok: false,
      code: "daily_attempt_limit",
      attempt_purchase: { attempts: 5, price_crystals: 5, balance_crystals: 17 },
    }, 429),
  }), {
    ok: false,
    error: "daily_attempt_limit",
    attemptPurchase: { attempts: 5, priceCrystals: 5, balanceCrystals: 17 },
  });

  for (const attempt_purchase of [
    { attempts: 4, price_crystals: 5, balance_crystals: 17 },
    { attempts: 5, price_crystals: 6, balance_crystals: 17 },
    { attempts: 5, price_crystals: 5, balance_crystals: -1 },
    { attempts: 5, price_crystals: 5, balance_crystals: 17, user_id: 42 },
  ]) {
    assert.deepEqual(await startMiniAppReward("signed", {
      fetch: async () => response({ ok: false, code: "daily_attempt_limit", attempt_purchase }, 429),
    }), { ok: false, error: "daily_attempt_limit" });
  }
});

test("admin attempt reset posts only signed initData to the pinned endpoint", async () => {
  const requests = [];
  const result = await resetMiniAppDailyAttempts("query_id=telegram&hash=signed", {
    fetch: async (url, init) => {
      requests.push({ url, init });
      return response({ ok: true, code: "daily_attempts_reset" });
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_RESET_ATTEMPTS_URL);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
  });
  assert.deepEqual(requests[0].init.headers, { "content-type": "application/json" });
  assert.deepEqual(await resetMiniAppDailyAttempts("signed", {
    fetch: async () => response({ ok: false, code: "forbidden" }, 403),
  }), { ok: false, error: "http_403" });
  assert.deepEqual(await resetMiniAppDailyAttempts("signed", {
    fetch: async () => response({ ok: true, code: "unexpected" }),
  }), { ok: false, error: "reset_rejected" });
});

test("attempt purchase sends only auth and one idempotency key to the pinned endpoint", async () => {
  const requestId = "76c56091-70d2-4c01-9954-75cc58c74d38";
  const requests = [];
  const result = await purchaseMiniAppDailyAttempts("query_id=telegram&hash=signed", requestId, {
    fetch: async (url, init) => {
      requests.push({ url, init });
      return response({
        ok: true,
        code: "daily_attempts_purchased",
        purchase_id: "td-attempt-purchase:42:2026-07-31:1",
        attempts_added: 5,
        crystals_spent: 5,
        crystal_balance: 12,
        duplicate: false,
      });
    },
  });

  assert.deepEqual(result, {
    ok: true,
    purchaseId: "td-attempt-purchase:42:2026-07-31:1",
    attemptsAdded: 5,
    crystalsSpent: 5,
    crystalBalance: 12,
    duplicate: false,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_PURCHASE_ATTEMPTS_URL);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    init_data: "query_id=telegram&hash=signed",
    request_id: requestId,
  });
  assert.deepEqual(Object.keys(JSON.parse(requests[0].init.body)).sort(), ["init_data", "request_id"]);
});

test("attempt purchase separates definitive balance errors from retry-safe ambiguous states", async () => {
  const requestId = "76c56091-70d2-4c01-9954-75cc58c74d38";
  assert.deepEqual(await purchaseMiniAppDailyAttempts("signed", requestId, {
    fetch: async () => response({ ok: false, code: "not_enough_crystals", crystal_balance: 3 }, 409),
  }), { ok: false, error: "not_enough_crystals", crystalBalance: 3 });
  for (const code of ["attempts_available", "purchase_in_progress", "profile_sync_pending", "request_conflict"]) {
    assert.deepEqual(await purchaseMiniAppDailyAttempts("signed", requestId, {
      fetch: async () => response({ ok: false, code }, 409),
    }), { ok: false, error: code });
  }
  for (const [code, status] of [["invalid_purchase_request", 400], ["purchase_unavailable", 503]]) {
    assert.deepEqual(await purchaseMiniAppDailyAttempts("signed", requestId, {
      fetch: async () => response({ ok: false, code }, status),
    }), { ok: false, error: code });
  }
  assert.deepEqual(await purchaseMiniAppDailyAttempts("signed", requestId, {
    fetch: async () => response({ ok: false, code: "not_found" }, 404),
  }), { ok: false, error: "http_404" });
  assert.deepEqual(await purchaseMiniAppDailyAttempts("signed", "not-a-uuid", {
    fetch: async () => assert.fail("invalid request must not reach fetch"),
  }), { ok: false, error: "invalid_purchase_request" });
});

test("attempt purchase request-id lifecycle clears only definitive outcomes", () => {
  const cases = [
    [{ ok: true, purchaseId: "purchase-1", attemptsAdded: 5, crystalsSpent: 5, crystalBalance: 12, duplicate: false }, "clear"],
    [{ ok: false, error: "not_enough_crystals", crystalBalance: 3 }, "clear"],
    [{ ok: false, error: "attempts_available" }, "clear"],
    [{ ok: false, error: "request_conflict" }, "clear"],
    [{ ok: false, error: "invalid_purchase_request" }, "clear"],
    [{ ok: false, error: "purchase_in_progress" }, "retain"],
    [{ ok: false, error: "profile_sync_pending" }, "retain"],
    [{ ok: false, error: "purchase_unavailable" }, "retain"],
    [{ ok: false, error: "Failed to fetch" }, "retain"],
    [{ ok: false, error: "http_503" }, "retain"],
  ];

  for (const [result, expected] of cases) {
    assert.equal(decideAttemptPurchaseRequestIdLifecycle(result), expected, JSON.stringify(result));
  }
});

test("admin reset wins over a simultaneous paid offer without creating a purchase request", async () => {
  const requestId = "76c56091-70d2-4c01-9954-75cc58c74d38";
  const storage = memoryStorage();
  const requests = [];
  let paidFlowShown = 0;

  const action = await executeDailyAttemptLimitPrimaryAction({
    canResetAttempts: true,
    hasPurchaseOffer: true,
    onAdminReset: async () => {
      const result = await resetMiniAppDailyAttempts("query_id=telegram&hash=signed", {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return response({ ok: true, code: "daily_attempts_reset" });
        },
      });
      assert.deepEqual(result, { ok: true });
    },
    onPurchaseOffer: async () => {
      paidFlowShown += 1;
      const purchaseRequestId = getOrCreateAttemptPurchaseRequestId(storage, () => requestId);
      await purchaseMiniAppDailyAttempts("query_id=telegram&hash=signed", purchaseRequestId, {
        fetch: async () => assert.fail("paid endpoint must not be called for an administrator"),
      });
    },
  });

  assert.equal(action, "admin_reset");
  assert.equal(paidFlowShown, 0);
  assert.equal(storage.getItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY), null);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, TOWER_DEFENSE_RESET_ATTEMPTS_URL);
});

test("attempt purchase request id survives retries until explicitly cleared", () => {
  const storage = memoryStorage();
  const requestId = "76c56091-70d2-4c01-9954-75cc58c74d38";
  let creates = 0;
  const create = () => {
    creates += 1;
    return requestId;
  };
  assert.equal(getOrCreateAttemptPurchaseRequestId(storage, create), requestId);
  assert.equal(getOrCreateAttemptPurchaseRequestId(storage, create), requestId);
  assert.equal(creates, 1);
  assert.equal(storage.getItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY), requestId);
  clearAttemptPurchaseRequestId(storage);
  assert.equal(storage.getItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY), null);
  assert.equal(getOrCreateAttemptPurchaseRequestId(storage, () => "unsafe"), null);
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

test("bootstrap replacement persists a same-run token rotation without changing the revision", () => {
  const session = memoryStorage();
  const first = miniAppBootstrap();
  const rotated = {
    ...first,
    reward: { ...first.reward, token: "token-from-second-tab" },
  };

  assert.equal(saveMiniAppBootstrap(session, first, 10_000), true);
  assert.equal(replaceMiniAppBootstrap(session, rotated, 11_000), true);
  assert.equal(loadMiniAppBootstrap(session, 12_000)?.reward.token, "token-from-second-tab");
  assert.equal(loadMiniAppBootstrap(session, 12_000)?.runRevision, first.runRevision);
});

test("ranked checkpoints are revision-bound and accept only the confirmed requested wave", async () => {
  const bootstrap = miniAppBootstrap();
  let request = null;
  const result = await recordMiniAppCheckpoint("signed", bootstrap, 8, {
    fetch: async (url, init) => {
      request = { url, body: JSON.parse(init.body) };
      return response({
        ok: true,
        code: "checkpoint_recorded",
        run_revision: 1,
        confirmed_wave: 8,
      });
    },
  });

  assert.deepEqual(result, { ok: true, replayed: false, runRevision: 1, confirmedWave: 8 });
  assert.deepEqual(request, {
    url: TOWER_DEFENSE_CHECKPOINT_URL,
    body: {
      init_data: "signed",
      run_id: bootstrap.reward.runId,
      token: bootstrap.reward.token,
      run_revision: 1,
      completed_wave: 8,
    },
  });
});

test("same-attempt restart rotates token and revision while binding the newly selected hero", async () => {
  const bootstrap = miniAppBootstrap();
  let request = null;
  const result = await restartMiniAppRun("signed", bootstrap, "toren", {
    now: () => 10_000,
    fetch: async (url, init) => {
      request = { url, body: JSON.parse(init.body) };
      return response({
        ok: true,
        code: "run_restarted",
        run_id: bootstrap.reward.runId,
        token: "rotated-token",
        run_contract_version: 3,
        run_revision: 2,
        hero_id: "toren",
        confirmed_wave: 0,
        expires_at: FUTURE_EXPIRES_AT,
        binding: { content_version: 2, level_id: "forest-gate", mode_id: "campaign" },
        profile: miniAppStartBody().profile,
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.bootstrap.reward.runId, bootstrap.reward.runId);
  assert.equal(result.bootstrap.reward.token, "rotated-token");
  assert.equal(result.bootstrap.runRevision, 2);
  assert.equal(result.bootstrap.heroId, "toren");
  assert.deepEqual(request, {
    url: TOWER_DEFENSE_RESTART_URL,
    body: {
      init_data: "signed",
      run_id: bootstrap.reward.runId,
      token: bootstrap.reward.token,
      run_revision: 1,
      hero_id: "toren",
    },
  });
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
  const submission = captureFinishSubmission(72.9, 81_234.9, "victory", 24.9, "toren");
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

  assert.deepEqual(finisher.finishMetadata, { outcome: "victory", completedWaves: 24, heroId: "toren" });
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
    hero_id: "toren",
  }]);
});

test("finish rejects an unknown hero before sending campaign metadata", () => {
  assert.throws(
    () => captureFinishSubmission(72, 81_234, "victory", 24, "unknown"),
    /Invalid finish hero/,
  );
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
    runContractVersion: 3,
    profile: miniAppProfile(),
    runRevision: 1,
    heroId: "eira",
    confirmedWave: 0,
    checkpointUrl: TOWER_DEFENSE_CHECKPOINT_URL,
    restartUrl: TOWER_DEFENSE_RESTART_URL,
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
    run_contract_version: 3,
    run_revision: 1,
    hero_id: "eira",
    confirmed_wave: 0,
    checkpoint_url: TOWER_DEFENSE_CHECKPOINT_URL,
    restart_url: TOWER_DEFENSE_RESTART_URL,
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
