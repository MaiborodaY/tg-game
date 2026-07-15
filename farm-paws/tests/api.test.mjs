import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const farmPawsRoot = fileURLToPath(new globalThis.URL("../", import.meta.url));
const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

let viteServer;
let api;

before(async () => {
  viteServer = await createServer({
    root: farmPawsRoot,
    configFile: false,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  api = await viteServer.ssrLoadModule("/src/api.ts");
});

after(async () => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
  await viteServer?.close();
});

test("Snake uses the shared start/finish endpoints with its game discriminator", async () => {
  setTelegramInitData("signed-init-data");
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/api/farm-paws/start")) {
      return jsonResponse({
        ok: true,
        runId: "snake-run-1",
        lang: "uk",
        dailyLimit: 5,
        dailyStarts: 2
      });
    }
    return jsonResponse({
      ok: true,
      duplicate: false,
      xpReward: 4,
      bestScore: 9,
      petXp: 42
    });
  };

  const session = await api.startFarmPawsRun(7, "snake");
  const finish = await api.finishFarmPawsRun(session, {
    score: 4,
    round: 0,
    hpLeft: 0,
    durationMs: 5_250
  });

  assert.equal(session.mode, "server");
  assert.equal(session.game, "snake");
  assert.equal(session.runId, "snake-run-1");
  assert.equal(session.lang, "uk");
  assert.equal(session.dailyStarts, 2);
  assert.equal(session.dailyLimit, 5);
  assert.deepEqual(finish, {
    mode: "server",
    ok: true,
    duplicate: false,
    xpReward: 4,
    bestScore: 9,
    petXp: 42,
    error: null
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "/api/farm-paws/start");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.equal(calls[0].init.headers["X-Telegram-Init-Data"], "signed-init-data");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    initData: "signed-init-data",
    game: "snake"
  });
  assert.equal(calls[1].url, "/api/farm-paws/finish");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    initData: "signed-init-data",
    game: "snake",
    runId: "snake-run-1",
    score: 4,
    round: 0,
    hpLeft: 0,
    durationMs: 5_250
  });
});

test("Tetris uses the shared start/finish endpoints with its game discriminator", async () => {
  setTelegramInitData("signed-tetris-init-data");
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/api/farm-paws/start")) {
      return jsonResponse({
        ok: true,
        runId: "tetris-run-1",
        bestScore: 18,
        dailyLimit: 5,
        dailyStarts: 3
      });
    }
    return jsonResponse({
      ok: true,
      duplicate: false,
      xpReward: 7,
      bestScore: 21,
      petXp: 49
    });
  };

  const session = await api.startFarmPawsRun(16, "tetris");
  const finish = await api.finishFarmPawsRun(session, {
    score: 20,
    round: 3,
    hpLeft: 0,
    durationMs: 42_000
  });

  assert.equal(session.mode, "server");
  assert.equal(session.game, "tetris");
  assert.equal(session.runId, "tetris-run-1");
  assert.equal(session.bestScore, 18);
  assert.equal(session.dailyStarts, 3);
  assert.equal(session.dailyLimit, 5);
  assert.deepEqual(finish, {
    mode: "server",
    ok: true,
    duplicate: false,
    xpReward: 7,
    bestScore: 21,
    petXp: 49,
    error: null
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "/api/farm-paws/start");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    initData: "signed-tetris-init-data",
    game: "tetris"
  });
  assert.equal(calls[1].url, "/api/farm-paws/finish");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    initData: "signed-tetris-init-data",
    game: "tetris",
    runId: "tetris-run-1",
    score: 20,
    round: 3,
    hpLeft: 0,
    durationMs: 42_000
  });
});

test("without Telegram initData Snake stays local and never calls the API", async () => {
  setTelegramInitData("");
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("fetch must not be called");
  };

  const session = await api.startFarmPawsRun(3, "snake");
  const finish = await api.finishFarmPawsRun(session, {
    score: 2,
    round: 3,
    hpLeft: 0,
    durationMs: 1_000
  });

  assert.equal(session.mode, "local");
  assert.equal(session.game, "snake");
  assert.equal(finish.mode, "local");
  assert.equal(fetchCalls, 0);
});

test("the shared daily limit blocks Snake before gameplay", async () => {
  setTelegramInitData("signed-init-data");
  globalThis.fetch = async () => jsonResponse({
    ok: false,
    code: "daily_limit",
    dailyLimit: 5,
    dailyStarts: 5
  }, 429);

  const session = await api.startFarmPawsRun(0, "snake");

  assert.equal(session.mode, "blocked");
  assert.equal(session.game, "snake");
  assert.equal(session.code, "daily_limit");
  assert.equal(session.dailyStarts, 5);
  assert.equal(session.dailyLimit, 5);
});

test("an uncertain server start is blocked instead of becoming a local run", async () => {
  setTelegramInitData("signed-init-data");
  globalThis.fetch = async () => {
    throw new Error("connection lost");
  };

  const session = await api.startFarmPawsRun(0, "snake");

  assert.equal(session.mode, "blocked");
  assert.equal(session.game, "snake");
  assert.equal(session.code, "start_unavailable");
});

test("a failed finish stays a server error so the same run can be retried", async () => {
  setTelegramInitData("signed-init-data");
  globalThis.fetch = async () => jsonResponse({ ok: false, error: "temporary" }, 503);
  const session = {
    mode: "server",
    game: "snake",
    runId: "snake-run-retry",
    bestScore: 0,
    error: null,
    petName: null,
    petType: null,
    lang: "ru"
  };

  const finish = await api.finishFarmPawsRun(session, {
    score: 3,
    round: 4,
    hpLeft: 0,
    durationMs: 2_000
  });

  assert.equal(finish.mode, "server");
  assert.equal(finish.ok, false);
  assert.equal(finish.duplicate, false);
  assert.equal(finish.error, "temporary");
});

function setTelegramInitData(initData) {
  globalThis.window = {
    Telegram: {
      WebApp: { initData }
    },
    location: { search: "?lang=ru" }
  };
}

function jsonResponse(body, status = 200) {
  return new globalThis.Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
