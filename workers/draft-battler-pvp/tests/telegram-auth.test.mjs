import assert from "node:assert/strict";
import test from "node:test";

import { authenticateOptionalTelegramRequest, verifyTelegramInitData } from "../src/telegramAuth.ts";

const TOKEN = "123456:test-token";
const NOW = Date.now();

test("signed Telegram initData authenticates a bounded player identity", async () => {
  const initData = await createInitData({ id: 123, first_name: "  Alice ", last_name: " Hero " });
  const result = await verifyTelegramInitData(initData, TOKEN, { nowMs: NOW });
  assert.deepEqual(result, {
    ok: true,
    identity: { userId: "123", displayName: "Alice Hero" },
  });

  const request = new globalThis.Request("https://example.com/api", { headers: { "x-telegram-init-data": initData } });
  assert.deepEqual(await authenticateOptionalTelegramRequest(request, { BOT_TOKEN: TOKEN }), result.identity);
});

test("anonymous requests stay unranked while forged and expired data fail closed", async () => {
  assert.equal(
    await authenticateOptionalTelegramRequest(new globalThis.Request("https://example.com/api"), { BOT_TOKEN: TOKEN }),
    undefined,
  );
  const signed = await createInitData({ id: 123, username: "alice" });
  const forged = signed.replace("alice", "mallory");
  assert.equal((await verifyTelegramInitData(forged, TOKEN, { nowMs: NOW })).ok, false);
  assert.equal((await verifyTelegramInitData(signed, TOKEN, { nowMs: NOW + 3 * 60 * 60 * 1_000 })).ok, false);
});

test("Telegram requests fail with a configuration error when BOT_TOKEN is missing", async () => {
  const initData = await createInitData({ id: 123, username: "alice" });
  const request = new globalThis.Request("https://example.com/api", {
    headers: { "x-telegram-init-data": initData },
  });

  await assert.rejects(
    authenticateOptionalTelegramRequest(request, {}),
    (error) => error?.code === "auth_unavailable" && error?.status === 503,
  );
});

async function createInitData(user) {
  const params = new globalThis.URLSearchParams({
    auth_date: String(Math.floor(NOW / 1_000)),
    query_id: "query-1",
    user: JSON.stringify(user),
  });
  const check = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = await hmac(new globalThis.TextEncoder().encode("WebAppData"), TOKEN);
  const digest = await hmac(secret, check);
  params.set("hash", [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""));
  return params.toString();
}

async function hmac(key, data) {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return globalThis.crypto.subtle.sign("HMAC", cryptoKey, new globalThis.TextEncoder().encode(data));
}
