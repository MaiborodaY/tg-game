import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRoomCode,
  parseBridgeLaunch,
  parseTelegramRoomStartParam,
} from "../src/launch.ts";

test("normalizes only six-character unambiguous room codes", () => {
  assert.equal(normalizeRoomCode(" ab-cd2z "), "ABCD2Z");
  assert.equal(normalizeRoomCode("ABC"), null);
  assert.equal(normalizeRoomCode("ABCDO1"), null);
  assert.equal(normalizeRoomCode("TOO-LONG-ROOM"), null);
});

test("parses a room from query before Telegram start_param", () => {
  assert.deepEqual(
    parseBridgeLaunch("https://example.com/?room=QW2E3R", "bridge_AS4D5F"),
    { roomCode: "QW2E3R", source: "query", returnTo: null },
  );
});

test("marks Tower Defense as the return destination without treating it as a room source", () => {
  assert.deepEqual(
    parseBridgeLaunch("https://example.com/?source=td", null),
    { roomCode: null, source: null, returnTo: "tower-defense" },
  );
  assert.deepEqual(
    parseBridgeLaunch("not a url", null),
    { roomCode: null, source: null, returnTo: null },
  );
});

test("accepts bridge-prefixed Telegram deep-link parameters", () => {
  assert.equal(parseTelegramRoomStartParam("bridge_AS4D5F"), "AS4D5F");
  assert.equal(parseTelegramRoomStartParam("bridge-AS4D5F"), "AS4D5F");
  assert.equal(parseTelegramRoomStartParam("AS4D5F"), "AS4D5F");
  assert.equal(parseTelegramRoomStartParam("other_AS4D5F"), null);
});
