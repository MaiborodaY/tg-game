import assert from "node:assert/strict";
import test from "node:test";

import { createRollRecord } from "../src/history.ts";
import {
  BRODICE_TELEGRAM_APP_URL,
  createSharedRollUrl,
  formatShareText,
  parseSharedRollUrl,
  sanitizeSharedRollUrl,
  shareRoll,
} from "../src/sharing.ts";

const record = createRollRecord([1, 2, 5, 5, 6], 5, 1_700_000_000_000);

test("Telegram Mini App links contain only a startapp roll snapshot", () => {
  const url = createSharedRollUrl(`${BRODICE_TELEGRAM_APP_URL}?initData=secret#private`, record, 6);
  const parsedUrl = new URL(url);
  const startParam = parsedUrl.searchParams.get("startapp");
  assert.equal(parsedUrl.origin + parsedUrl.pathname, BRODICE_TELEGRAM_APP_URL);
  assert.deepEqual([...parsedUrl.searchParams.keys()], ["startapp"]);
  assert.match(startParam ?? "", /^r1_[a-z0-9]+_6_[1-6]+$/);
  assert.equal(parsedUrl.hash, "");

  const shared = parseSharedRollUrl(url);
  assert.deepEqual(shared?.faces, record.faces);
  assert.equal(shared?.target, 6);
  assert.equal(shared?.createdAt, record.createdAt);

  const launchedUrl = new URL("https://tg-game-23f.pages.dev/brodice/");
  launchedUrl.searchParams.set("tgWebAppStartParam", startParam ?? "");
  assert.deepEqual(parseSharedRollUrl(launchedUrl.toString())?.faces, record.faces);
  assert.deepEqual(parseSharedRollUrl(launchedUrl.origin, startParam)?.faces, record.faces);
});

test("legacy Pages roll links remain readable", () => {
  const legacyPayload = ["1", record.createdAt.toString(36), "6", record.faces.join("")].join(".");
  const shared = parseSharedRollUrl(`https://example.com/brodice/?roll=${legacyPayload}`);
  assert.deepEqual(shared?.faces, record.faces);
  assert.equal(shared?.target, 6);
});

test("damaged or unsupported shared snapshots are rejected", () => {
  assert.equal(parseSharedRollUrl(`${BRODICE_TELEGRAM_APP_URL}?startapp=r2_abc_5_123`), null);
  assert.equal(parseSharedRollUrl(`${BRODICE_TELEGRAM_APP_URL}?startapp=r1_abc_9_123`), null);
  assert.equal(parseSharedRollUrl(`${BRODICE_TELEGRAM_APP_URL}?startapp=r1_abc_5_129`), null);
  assert.equal(parseSharedRollUrl("https://example.com/brodice/?roll=2.abc.5.123"), null);
  assert.equal(parseSharedRollUrl("https://example.com/brodice/?roll=1.abc.9.123"), null);
  assert.equal(parseSharedRollUrl("https://example.com/brodice/?roll=1.abc.5.129"), null);
  assert.equal(parseSharedRollUrl("not a URL"), null);
});

test("share copy focuses on face counts and target successes", () => {
  assert.equal(
    formatShareText(record, 5),
    "🎲 BroDice · 5d6\n1: 1 · 2: 1 · 3: 0 · 4: 0 · 5: 2 · 6: 1\n5+ successes: 3",
  );
});

test("Telegram sharing wins before native and clipboard adapters", async () => {
  const calls = [];
  const outcome = await shareRoll(
    { title: "BroDice", text: "Roll", url: createSharedRollUrl(BRODICE_TELEGRAM_APP_URL, record, 5) },
    {
      telegramShare(text, url) { calls.push(["telegram", text, url]); return true; },
      async nativeShare() { calls.push(["native"]); },
      async writeClipboard() { calls.push(["clipboard"]); },
    },
  );
  assert.equal(outcome, "telegram");
  assert.equal(calls.length, 1);
  assert.match(calls[0][2], /^https:\/\/t\.me\/reallifesame_bot\/brodice\?startapp=r1_/);
});

test("native failures fall through to clipboard with a sanitized URL", async () => {
  let copied = "";
  const unsafe = `${createSharedRollUrl(BRODICE_TELEGRAM_APP_URL, record, 5)}&initData=secret#fragment`;
  const outcome = await shareRoll(
    { title: "BroDice", text: "Roll", url: unsafe },
    {
      telegramShare() { return false; },
      async nativeShare() { throw new Error("unsupported"); },
      async writeClipboard(value) { copied = value; },
    },
  );
  assert.equal(outcome, "clipboard");
  assert.equal(copied.includes("initData"), false);
  assert.equal(copied.includes("#fragment"), false);
  assert.match(copied, /https:\/\/t\.me\/reallifesame_bot\/brodice\?startapp=r1_/);
  assert.equal(sanitizeSharedRollUrl(unsafe), copied.split("\n")[1]);
});

test("cancelling the native share does not copy unexpectedly", async () => {
  let clipboardCalls = 0;
  const abort = new Error("cancelled");
  abort.name = "AbortError";
  const outcome = await shareRoll(
    { title: "BroDice", text: "Roll", url: "https://example.com/brodice/" },
    {
      async nativeShare() { throw abort; },
      async writeClipboard() { clipboardCalls += 1; },
    },
  );
  assert.equal(outcome, "cancelled");
  assert.equal(clipboardCalls, 0);
});
