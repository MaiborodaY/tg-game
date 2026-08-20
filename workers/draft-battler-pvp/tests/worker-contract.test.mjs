import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../src/index.ts", import.meta.url);

test("worker exposes authenticated room lifecycle and never accepts arbitrary boards or peer messages", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /request\.method === "POST"/);
  assert.match(source, /hashSeatToken/);
  assert.match(source, /presentedTokenHash/);
  assert.match(source, /createPlayerMatchSnapshot/);
  assert.match(source, /error\.code === "stale_match" \|\| error\.code === "stale_round"/);
  assert.match(source, /set_ready/);
  assert.match(source, /case "pick"/);
  assert.match(source, /case "move"/);
  assert.match(source, /case "reroll"/);
  assert.match(source, /case "lock"/);
  assert.match(source, /case "next_ready"/);
  assert.match(source, /case "forfeit"/);
  assert.match(source, /case "rematch"/);
  assert.doesNotMatch(source, /submit_board/);
  assert.doesNotMatch(source, /peer_message/);
  assert.match(source, /rawMessage\.length > MAX_SOCKET_MESSAGE_BYTES/);
});

test("worker schedules persistent TTL and disconnect lifecycle alarms", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /async alarm\(\)/);
  assert.match(source, /setAlarm/);
  assert.match(source, /getNextRoomAlarmAt/);
  assert.match(source, /getDisconnectForfeitRole/);
  assert.match(source, /disconnectDeadline/);
  assert.match(source, /getDisconnectedSeatReleaseRole/);
  assert.match(source, /disconnectSeat/);
  assert.match(source, /deleteAll/);
});

test("worker deletes stale persisted rulesets before exposing room snapshots", async () => {
  const source = await readFile(sourceUrl, "utf8");
  const viewerStart = source.indexOf("private async createViewerSnapshot");
  const broadcastStart = source.indexOf("private async broadcastSnapshots", viewerStart);
  const viewerSource = source.slice(viewerStart, broadcastStart);
  const roomReadStart = source.indexOf("private async readRoom");
  const roomWriteStart = source.indexOf("private async writeRoom", roomReadStart);
  const roomReadSource = source.slice(roomReadStart, roomWriteStart);
  const matchReadStart = source.indexOf("private async readMatch");
  const matchWriteStart = source.indexOf("private async writeMatch", matchReadStart);
  const matchReadSource = source.slice(matchReadStart, matchWriteStart);

  assert.match(roomReadSource, /storage\.get<unknown>/);
  assert.match(roomReadSource, /!isCurrentRoomState\(room\)/);
  assert.match(roomReadSource, /deleteRoom\("Room belongs to an older game version\."\)/);
  assert.match(matchReadSource, /storage\.get<unknown>/);
  assert.match(matchReadSource, /!isCurrentMatchState\(match\)/);
  assert.match(matchReadSource, /deleteRoom\("Match belongs to an older game version\."\)/);
  assert.doesNotMatch(viewerSource, /rulesetVersion: RULESET_VERSION/);
});

test("HTTP reconnect verifies credentials without replacing or disconnecting a live socket", async () => {
  const source = await readFile(sourceUrl, "utf8");
  const reconnectStart = source.indexOf("private async reconnectSession");
  const socketStart = source.indexOf("private async handleSocket", reconnectStart);
  const reconnectSource = source.slice(reconnectStart, socketStart);

  assert.ok(reconnectStart >= 0 && socketStart > reconnectStart);
  assert.ok(reconnectSource.indexOf("reconcileExpiry") < reconnectSource.indexOf("createSessionResponse"));
  assert.match(reconnectSource, /findSeatRoleByTokenHash/);
  assert.match(reconnectSource, /deliberately read-only/);
  assert.doesNotMatch(reconnectSource, /claimSeat\(/);
  assert.doesNotMatch(reconnectSource, /disconnectSeat\(/);
  assert.doesNotMatch(reconnectSource, /writeRoom\(/);
  assert.doesNotMatch(reconnectSource, /scheduleAlarm\(/);
});

test("WebSocket authentication uses bounded one-time tickets instead of the persistent seat token", async () => {
  const source = await readFile(sourceUrl, "utf8");
  const socketStart = source.indexOf("private async handleSocket");
  const messageStart = source.indexOf("private async handleClientMessage", socketStart);
  const socketSource = source.slice(socketStart, messageStart);

  assert.match(source, /searchParams\.get\("ticket"\)/);
  assert.doesNotMatch(source, /searchParams\.get\("token"\)/);
  assert.match(source, /getSocketTicketStorageKey\(role\)/);
  assert.match(source, /consumed before validation/);
  assert.match(source, /reconnectGraceExpired/);
  assert.match(socketSource, /settleExpiredOpponentAfterReconnect\(room, match, now\)/);
  assert.ok(socketSource.indexOf("reconcileExpiry") < socketSource.indexOf("storage.delete(ticketStorageKey)"));
  assert.ok(socketSource.indexOf("acceptWebSocket(server)") < socketSource.indexOf("writeRoom(room)"));
  assert.ok(socketSource.indexOf("writeRoom(room)") < socketSource.indexOf("closePreviousSeatSockets"));
});

test("request paths reconcile hard TTL before touching room or match state", async () => {
  const source = await readFile(sourceUrl, "utf8");
  const messageStart = source.indexOf("private async handleClientMessage");
  const disconnectStart = source.indexOf("private async handleSocketDisconnect", messageStart);
  const messageSource = source.slice(messageStart, disconnectStart);

  assert.match(source, /private async reconcileExpiry\(now: number\)/);
  assert.ok(messageSource.indexOf("reconcileExpiry(now)") < messageSource.indexOf("requireAuthenticatedRoom"));
  assert.ok(messageSource.indexOf('expiry.status === "match_expired"') < messageSource.indexOf("requireAuthenticatedRoom"));
});
