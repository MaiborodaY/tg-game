import assert from "node:assert/strict";
import test from "node:test";

import {
  callKey,
  deterministicBotDelay,
  formatCall,
  formatCard,
  getSeatPosition,
  getSeatsByPosition,
  groupCardsBySuit,
} from "../src/ui/format.ts";
import {
  createBridgeCommandId,
  normalizeBridgeRoomCode,
  parseBridgeServerMessage,
} from "../src/network/protocol.ts";
import { createBridgeNetworkClient } from "../src/network/client.ts";

test("table rotation always places the viewer at the bottom", () => {
  assert.equal(getSeatPosition("south", "south"), "bottom");
  assert.equal(getSeatPosition("south", "west"), "left");
  assert.equal(getSeatPosition("south", "north"), "top");
  assert.equal(getSeatPosition("south", "east"), "right");

  assert.deepEqual(getSeatsByPosition("west"), {
    bottom: "west",
    left: "north",
    top: "east",
    right: "south",
  });
});

test("calls and cards use compact Russian table notation", () => {
  assert.equal(formatCall({ type: "pass" }), "Пас");
  assert.equal(formatCall({ type: "bid", level: 3, strain: "notrump" }), "3БК");
  assert.equal(callKey({ type: "bid", level: 4, strain: "hearts" }), "bid:4:hearts");
  assert.deepEqual(formatCard("HA"), { rank: "A", suit: "♥", red: true, spoken: "A червей" });
  assert.deepEqual(groupCardsBySuit(["SA", "ST", "H2", "C7"]), {
    clubs: ["7"],
    diamonds: [],
    hearts: ["2"],
    spades: ["A", "10"],
  });
});

test("bot delay is deterministic and remains short enough for mobile play", () => {
  assert.equal(deterministicBotDelay(12), deterministicBotDelay(12));
  assert.ok(deterministicBotDelay(0) >= 400);
  assert.ok(deterministicBotDelay(999) < 700);
});

test("room protocol rejects ambiguous or malformed codes and messages", () => {
  assert.equal(normalizeBridgeRoomCode(" ab-cd23 "), "ABCD23");
  assert.equal(normalizeBridgeRoomCode("ABCI23"), null);
  assert.match(createBridgeCommandId(), /^bridge_/);
  assert.equal(parseBridgeServerMessage({ type: "snapshot", snapshot: {} }), null);
  assert.deepEqual(parseBridgeServerMessage({ type: "error", code: "stale", message: "Old", revision: 8 }), {
    type: "error",
    code: "stale",
    message: "Old",
    revision: 8,
  });
});

test("network authentication observes Telegram initData that arrives after startup", () => {
  let initData = "";
  const client = createBridgeNetworkClient({
    baseUrl: "https://bridge.example/api",
    initData: () => initData,
  });

  assert.equal(client.authenticated, false);
  initData = "query_id=late-telegram-session";
  assert.equal(client.authenticated, true);
});
