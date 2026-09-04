import assert from "node:assert/strict";
import test from "node:test";
import { shareResult } from "../src/resultSharing.ts";
import { sanitizeSharedPageUrl } from "../src/telegram.ts";

const RESULT = Object.freeze({
  title: "BroBattler",
  text: "Victory · Strong",
  url: "https://user:password@example.com/game?tgWebAppData=secret#private",
});

test("shared page URL keeps only a bounded public HTTP(S) location", () => {
  assert.equal(
    sanitizeSharedPageUrl(RESULT.url),
    "https://example.com/game",
  );
  assert.equal(sanitizeSharedPageUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeSharedPageUrl("not a url"), "");

  const oversized = sanitizeSharedPageUrl(`https://example.com/${"a".repeat(3000)}?secret=1#private`);
  assert.equal(oversized, "https://example.com/");
  assert.ok(oversized.length <= 2048);
});

test("Telegram is attempted synchronously before standalone adapters", async () => {
  const calls = [];
  const outcome = await shareResult(RESULT, {
    telegramShare(text, url) {
      calls.push(["telegram", text, url]);
      return true;
    },
    async nativeShare() {
      calls.push(["native"]);
    },
    async writeClipboard() {
      calls.push(["clipboard"]);
    },
  });

  assert.deepEqual(outcome, { kind: "telegram" });
  assert.deepEqual(calls, [["telegram", RESULT.text, "https://example.com/game"]]);
});

test("a declined Telegram share falls through to native sharing with sanitized data", async () => {
  const calls = [];
  const outcome = await shareResult(RESULT, {
    telegramShare(_text, url) {
      calls.push(["telegram", url]);
      return false;
    },
    async nativeShare(data) {
      calls.push(["native", data]);
    },
    async writeClipboard() {
      calls.push(["clipboard"]);
    },
  });

  assert.deepEqual(outcome, { kind: "native" });
  assert.deepEqual(calls, [
    ["telegram", "https://example.com/game"],
    ["native", {
      title: RESULT.title,
      text: RESULT.text,
      url: "https://example.com/game",
    }],
  ]);
});

test("native failures fall through to the clipboard without leaking URL credentials", async () => {
  const calls = [];
  const outcome = await shareResult(RESULT, {
    telegramShare() {
      throw new Error("Telegram unavailable");
    },
    async nativeShare(data) {
      calls.push(["native", data.url]);
      throw new Error("share unavailable");
    },
    async writeClipboard(value) {
      calls.push(["clipboard", value]);
    },
  });

  assert.deepEqual(outcome, { kind: "clipboard" });
  assert.deepEqual(calls, [
    ["native", "https://example.com/game"],
    ["clipboard", `${RESULT.text}\nhttps://example.com/game`],
  ]);
});

test("native cancellation is final and does not show an error or copy implicitly", async () => {
  let clipboardCalls = 0;
  const outcome = await shareResult(RESULT, {
    async nativeShare() {
      const error = new Error("cancelled by player");
      error.name = "AbortError";
      throw error;
    },
    async writeClipboard() {
      clipboardCalls += 1;
    },
  });

  assert.deepEqual(outcome, { kind: "cancelled" });
  assert.equal(clipboardCalls, 0);
});

test("malformed URLs are never passed raw to any adapter", async () => {
  const seen = [];
  const unsafeResult = { ...RESULT, url: "javascript:alert(document.cookie)" };
  const outcome = await shareResult(unsafeResult, {
    telegramShare(_text, url) {
      seen.push(["telegram", url]);
      return false;
    },
    async nativeShare(data) {
      seen.push(["native", data.url]);
      throw new Error("native failure");
    },
    async writeClipboard(value) {
      seen.push(["clipboard", value]);
    },
  });

  assert.deepEqual(outcome, { kind: "clipboard" });
  assert.deepEqual(seen, [
    ["telegram", ""],
    ["native", ""],
    ["clipboard", `${RESULT.text}\n`],
  ]);
  assert.equal(JSON.stringify(seen).includes(unsafeResult.url), false);
});

test("clipboard failure and missing adapters return a stable failed outcome", async () => {
  assert.deepEqual(await shareResult(RESULT, {}), { kind: "failed" });
  assert.deepEqual(await shareResult(RESULT, {
    async writeClipboard() {
      throw new Error("permission denied");
    },
  }), { kind: "failed" });
});
