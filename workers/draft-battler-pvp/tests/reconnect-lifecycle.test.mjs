import assert from "node:assert/strict";
import test from "node:test";

import {
  DISCONNECT_GRACE_MS,
  claimSeat,
  createMatch,
  createRoom,
  disconnectSeat,
} from "../src/matchDomain.ts";
import { settleExpiredOpponentAfterReconnect } from "../src/reconnectLifecycle.ts";

test("the returning player immediately wins when the other disconnected seat already exceeded grace", () => {
  const startedAt = 10_000;
  let room = createRoom({ roomId: "racecase", now: startedAt });
  room = claimSeat(room, {
    issuedTokenHash: "host-hash",
    connectionId: "host-1",
    now: startedAt + 1,
  }).room;
  room = claimSeat(room, {
    issuedTokenHash: "guest-hash",
    connectionId: "guest-1",
    now: startedAt + 2,
  }).room;
  room = disconnectSeat(room, "host", "host-hash", "host-1", startedAt + 10);
  room = disconnectSeat(room, "guest", "guest-hash", "guest-1", startedAt + 20);

  const reconnectAt = startedAt + 10 + DISCONNECT_GRACE_MS;
  room = claimSeat(room, {
    presentedTokenHash: "guest-hash",
    issuedTokenHash: "guest-hash",
    connectionId: "guest-2",
    now: reconnectAt,
  }).room;
  const settlement = settleExpiredOpponentAfterReconnect(
    room,
    createMatch({ matchId: "race-match", seed: "server-secret", now: startedAt }),
    reconnectAt,
  );

  assert.equal(room.seats.guest.connected, true);
  assert.equal(room.seats.guest.disconnectDeadline, undefined);
  assert.equal(settlement.forfeitedRole, "host");
  assert.equal(settlement.match.phase, "finished");
  assert.equal(settlement.match.outcome.reason, "disconnect");
  assert.equal(settlement.match.outcome.winner, "guest");
});
