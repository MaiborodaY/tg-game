import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SHEDDING_DECK,
  getSheddingCard,
  getSheddingCardPoints,
  scoreSheddingHand,
} from "../src/shedding/index.ts";
import { translateBridge } from "../src/i18n.ts";
import {
  createBridgeCommandId,
  normalizeBridgeRoomCode,
  parseBridgeServerMessage,
} from "../src/network/protocol.ts";
import {
  BridgeNetworkError,
  createBridgeNetworkClient,
  getBridgeNetworkErrorMessage,
} from "../src/network/client.ts";

const mainSource = await readFile(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");
const indexSource = await readFile(new globalThis.URL("../index.html", import.meta.url), "utf8");

test("the client renders the requested shedding-Bridge rules instead of contract bidding", () => {
  assert.match(translateBridge("ru", "penaltyRuleNote"), /Ровно 125 сбрасывается до 0/);
  assert.match(translateBridge("ru", "penaltyRuleNote"), /больше 125 означает поражение/);
  assert.match(translateBridge("ru", "scoreJacks"), /20 только в руке из одних валетов, иначе 10/);
  assert.match(indexSource, /со штрафным счётом/);
  assert.doesNotMatch(indexSource, /до 125 очков/);
  assert.match(mainSource, /data-action="draw-card"/);
  assert.match(mainSource, /data-action="play-selected"/);
  assert.match(mainSource, /data-action="select-suit"/);
  assert.match(mainSource, /data-role="language"/);
  assert.equal(mainSource.includes("view.roundResult?.winner === view.viewerSeat"), true);
  assert.equal(mainSource.includes("view?.matchWinner === view?.viewerSeat"), true);
  assert.match(mainSource, /joinButton\.disabled = busy \|\| !network\.authenticated \|\| roomInput\.length !== 6/);
  assert.match(mainSource, /event\.key === "Enter"[\s\S]*joinPvpRoom/);
  assert.match(mainSource, /setInterval\([\s\S]*refreshDeadlineLabels\(\)/);
  assert.doesNotMatch(mainSource, /setInterval\([\s\S]{0,180}\brender\(\)/);
  assert.doesNotMatch(mainSource, /data-action="select-call"|data-action="open-auction"/);
});

test("card presentation uses the 36-card deck and the agreed point values", () => {
  assert.equal(SHEDDING_DECK.length, 36);
  assert.deepEqual(getSheddingCard("hj"), { id: "HJ", suit: "hearts", rank: 11 });
  assert.equal(getSheddingCardPoints("C7"), 0);
  assert.equal(getSheddingCardPoints("SQ"), 10);
  assert.equal(getSheddingCardPoints("DJ"), 10);
  assert.equal(getSheddingCardPoints("HA"), 15);
  assert.equal(scoreSheddingHand(["DJ", "HJ"]), 40);
  assert.equal(scoreSheddingHand(["DJ", "HT", "C6"]), 20);
});

test("room protocol accepts two-player snapshots and rejects malformed messages", () => {
  assert.equal(normalizeBridgeRoomCode(" ab-cd23 "), "ABCD23");
  assert.equal(normalizeBridgeRoomCode("ABCI23"), null);
  assert.match(createBridgeCommandId(), /^bridge_/);

  const player = { kind: "human", displayName: "Player", connected: true, left: false };
  const message = parseBridgeServerMessage({
    type: "snapshot",
    snapshot: {
      roomCode: "ABCD23",
      seat: "south",
      status: "playing",
      revision: 4,
      players: { south: player, west: player },
      bots: [],
      serverNow: 123,
    },
  });
  assert.equal(message?.type, "snapshot");
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

test("network errors follow the selected Bridge locale", () => {
  const missingRoom = new BridgeNetworkError("Room missing.", "room_not_found", 404);
  const unauthorized = new BridgeNetworkError("Unauthorized.", "unauthorized", 401);
  assert.equal(getBridgeNetworkErrorMessage(missingRoom, "uk"), translateBridge("uk", "roomNotFound"));
  assert.equal(getBridgeNetworkErrorMessage(missingRoom, "en"), translateBridge("en", "roomNotFound"));
  assert.equal(getBridgeNetworkErrorMessage(unauthorized, "ru"), translateBridge("ru", "telegramAuthFailed"));
});
