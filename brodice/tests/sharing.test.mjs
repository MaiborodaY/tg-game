import assert from "node:assert/strict";
import test from "node:test";

import { createRollRecord } from "../src/history.ts";
import {
  createSharedRollUrl,
  formatShareText,
  parseSharedRollUrl,
  sanitizeSharedRollUrl,
  shareRoll,
} from "../src/sharing.ts";

const record = createRollRecord([1, 2, 5, 5, 6], 5, 1_700_000_000_000);

test("shared URLs contain only the controlled roll snapshot", () => {
  const url = createSharedRollUrl("https://example.com/brodice/?initData=secret#private", record, 6);
  const parsedUrl = new URL(url);
  assert.deepEqual([...parsedUrl.searchParams.keys()], ["roll"]);
  assert.equal(parsedUrl.hash, "");

  const shared = parseSharedRollUrl(url);
  assert.deepEqual(shared?.faces, record.faces);
  assert.equal(shared?.target, 6);
  assert.equal(shared?.createdAt, record.createdAt);
});

test("damaged or unsupported shared snapshots are rejected", () => {
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
    { title: "BroDice", text: "Roll", url: createSharedRollUrl("https://example.com/brodice/", record, 5) },
    {
      telegramShare(text, url) { calls.push(["telegram", text, url]); return true; },
      async nativeShare() { calls.push(["native"]); },
      async writeClipboard() { calls.push(["clipboard"]); },
    },
  );
  assert.equal(outcome, "telegram");
  assert.equal(calls.length, 1);
});

test("native failures fall through to clipboard with a sanitized URL", async () => {
  let copied = "";
  const unsafe = `${createSharedRollUrl("https://example.com/brodice/", record, 5)}&initData=secret#fragment`;
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
