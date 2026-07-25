import assert from "node:assert/strict";
import test from "node:test";

import {
  BridgeAuthError,
  authenticateBridgeRequest,
  verifyTelegramInitData,
} from "../src/security.ts";

const BOT_TOKEN = "123456:bridge-test-token";
const NOW_MS = 1_760_000_000_000;
const NOW_SECONDS = Math.floor(NOW_MS / 1_000);

test("accepts a correctly signed fresh Telegram identity", async () => {
  const initData = await createSignedInitData({ authDate: NOW_SECONDS - 20 });
  const result = await verifyTelegramInitData(initData, BOT_TOKEN, { nowMs: NOW_MS });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.identity.userId, "424242");
    assert.equal(result.identity.displayName, "Ada Lovelace");
    assert.equal(result.identity.source, "telegram");
  }
});

test("rejects tampered, expired, and future Telegram initData", async () => {
  const fresh = await createSignedInitData({ authDate: NOW_SECONDS - 20 });
  const tampered = fresh.replace("Ada", "Eve");
  const expired = await createSignedInitData({ authDate: NOW_SECONDS - 3_601 });
  const future = await createSignedInitData({ authDate: NOW_SECONDS + 31 });

  assert.deepEqual(await verifyTelegramInitData(tampered, BOT_TOKEN, { nowMs: NOW_MS }), {
    ok: false,
    error: "bad_init_data_signature",
  });
  assert.deepEqual(await verifyTelegramInitData(expired, BOT_TOKEN, { nowMs: NOW_MS }), {
    ok: false,
    error: "expired_init_data",
  });
  assert.deepEqual(await verifyTelegramInitData(future, BOT_TOKEN, { nowMs: NOW_MS }), {
    ok: false,
    error: "future_auth_date",
  });
});

test("rejects duplicate Telegram fields even when the first value is signed", async () => {
  const initData = await createSignedInitData({ authDate: NOW_SECONDS - 20 });
  const duplicate = `${initData}&auth_date=${NOW_SECONDS - 20}`;
  const result = await verifyTelegramInitData(duplicate, BOT_TOKEN, { nowMs: NOW_MS });

  assert.deepEqual(result, { ok: false, error: "duplicate_init_data_key" });
});

test("production auth is fail-closed and development identity is explicitly gated", async () => {
  await assert.rejects(
    authenticateBridgeRequest(new globalThis.Request("https://example.test/api/bridge/rooms"), { ENVIRONMENT: "production" }),
    (error) => error instanceof BridgeAuthError && error.code === "missing_init_data" && error.status === 401,
  );

  const developmentRequest = new globalThis.Request("http://localhost/api/bridge/rooms", {
    headers: {
      "x-bridge-dev-user-id": "local:west",
      "x-bridge-dev-user-name": "Local West",
    },
  });
  assert.deepEqual(
    await authenticateBridgeRequest(developmentRequest, { ENVIRONMENT: "development" }),
    { userId: "local:west", displayName: "Local West", source: "development" },
  );
});

async function createSignedInitData({ authDate }) {
  const fields = new Map([
    ["auth_date", String(authDate)],
    ["query_id", "AAHdF6IQAAAAAN0XohDhrOrc"],
    ["user", JSON.stringify({ id: 424242, first_name: "Ada", last_name: "Lovelace", username: "ada" })],
  ]);
  const dataCheckString = [...fields.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = await hmac(new globalThis.TextEncoder().encode("WebAppData"), BOT_TOKEN);
  const digest = await hmac(secret, dataCheckString);
  const params = new globalThis.URLSearchParams([...fields.entries()]);

  params.set("hash", bytesToHex(digest));
  return params.toString();
}

async function hmac(key, value) {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return globalThis.crypto.subtle.sign("HMAC", cryptoKey, new globalThis.TextEncoder().encode(value));
}

function bytesToHex(value) {
  return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
