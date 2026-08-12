import assert from "node:assert/strict";
import test from "node:test";

const RequestCtor = globalThis.Request;

import {
  MAX_SOCKET_MESSAGE_BYTES,
  MAX_HTTP_BODY_BYTES,
  MAX_SOCKET_MESSAGES_PER_WINDOW,
  ROOM_CODE_LENGTH,
  SEAT_TOKEN_BYTES,
  SOCKET_TICKET_TTL_MS,
  consumeRateLimit,
  createRoomCode,
  createSeatToken,
  createSocketTicket,
  hashSeatToken,
  isAllowedOrigin,
  isSocketTicketValid,
  normalizeRoomId,
  parseClientMessage,
  readJsonBody,
  readSeatToken,
  tokensMatch,
} from "../src/protocol.ts";

test("seat tokens carry 256 bits and room codes avoid ambiguous characters", () => {
  const token = createSeatToken(Uint8Array.from({ length: SEAT_TOKEN_BYTES }, (_, index) => index));
  const roomCode = createRoomCode(Uint8Array.from({ length: ROOM_CODE_LENGTH }, (_, index) => index));

  assert.equal(token.length, 43);
  assert.equal(readSeatToken(token), token);
  assert.equal(roomCode.length, ROOM_CODE_LENGTH);
  assert.equal(normalizeRoomId(` ${roomCode.toUpperCase()} `), roomCode);
  assert.equal(normalizeRoomId("bad-room"), undefined);
  assert.equal(readSeatToken("guessable"), undefined);
});

test("HTTP bodies and browser origins are narrowly bounded", async () => {
  assert.deepEqual(await readJsonBody(new RequestCtor("https://game.example/api", {
    method: "POST",
    body: JSON.stringify({ seatToken: "token" }),
  })), { seatToken: "token" });
  assert.equal(await readJsonBody(new RequestCtor("https://game.example/api", {
    method: "POST",
    body: "x".repeat(MAX_HTTP_BODY_BYTES + 1),
  })), undefined);

  assert.equal(isAllowedOrigin(new RequestCtor("https://game.example/api", { headers: { origin: "https://game.example" } }), undefined), true);
  assert.equal(isAllowedOrigin(new RequestCtor("https://game.example/api"), undefined), false);
  assert.equal(isAllowedOrigin(new RequestCtor("https://worker.example/api", { headers: { origin: "https://game.example" } }), "https://game.example"), true);
  assert.equal(isAllowedOrigin(new RequestCtor("https://worker.example/api", { headers: { origin: "https://evil.example" } }), "https://game.example"), false);
  assert.equal(isAllowedOrigin(new RequestCtor("https://worker.example/api", { headers: { origin: "http://127.0.0.1:5173" } }), undefined, true), true);
});

test("chunked HTTP bodies without Content-Length stop at the byte limit", async () => {
  let cancelled = false;
  const encoder = new globalThis.TextEncoder();
  const body = new globalThis.ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("x".repeat(700)));
      controller.enqueue(encoder.encode("y".repeat(700)));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new RequestCtor("https://game.example/api", {
    method: "POST",
    body,
    duplex: "half",
  });

  assert.equal(request.headers.get("content-length"), null);
  assert.equal(await readJsonBody(request), undefined);
  assert.equal(cancelled, true);
});

test("seat token authentication stores a one-way digest", async () => {
  const token = createSeatToken(Uint8Array.from({ length: SEAT_TOKEN_BYTES }, (_, index) => 255 - index));
  const digest = await hashSeatToken(token);

  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(digest.includes(token), false);
  assert.equal(tokensMatch(digest, await hashSeatToken(token)), true);
  assert.equal(tokensMatch(digest, await hashSeatToken(createSeatToken(new Uint8Array(SEAT_TOKEN_BYTES)))), false);
});

test("WebSocket tickets are hashed, short-lived credentials", async () => {
  const ticket = createSeatToken(Uint8Array.from({ length: SEAT_TOKEN_BYTES }, (_, index) => index + 1));
  const issued = await createSocketTicket("host", "seat-token-hash", 1_000, ticket);

  assert.equal(issued.ticket, ticket);
  assert.equal(issued.record.role, "host");
  assert.equal(issued.record.tokenHash, "seat-token-hash");
  assert.equal(issued.record.ticketHash.includes(ticket), false);
  assert.equal(issued.record.expiresAt, 1_000 + SOCKET_TICKET_TTL_MS);
  assert.equal(await isSocketTicketValid(issued.record, ticket, issued.record.expiresAt - 1), true);
  assert.equal(await isSocketTicketValid(issued.record, ticket, issued.record.expiresAt), false);
  assert.equal(await isSocketTicketValid(issued.record, createSeatToken(new Uint8Array(SEAT_TOKEN_BYTES)), 1_001), false);
});

test("client protocol accepts only bounded exact intent schemas", () => {
  assert.deepEqual(parseClientMessage(JSON.stringify({ type: "ping" })), { type: "ping" });
  assert.deepEqual(parseClientMessage(JSON.stringify({ type: "set_ready", ready: true })), {
    type: "set_ready",
    ready: true,
  });
  assert.deepEqual(parseClientMessage(JSON.stringify({
    type: "pick",
    matchId: "match-123",
    round: 2,
    cardId: "boar_rider",
    targetSlotIndex: 4,
    allowReplacement: false,
  })), {
    type: "pick",
    matchId: "match-123",
    round: 2,
    cardId: "boar_rider",
    targetSlotIndex: 4,
    allowReplacement: false,
  });
  assert.deepEqual(parseClientMessage(JSON.stringify({
    type: "move",
    matchId: "match-123",
    round: 2,
    sourceSlotIndex: 1,
    targetSlotIndex: 4,
  })), {
    type: "move",
    matchId: "match-123",
    round: 2,
    sourceSlotIndex: 1,
    targetSlotIndex: 4,
  });

  for (const message of [
    { type: "peer_message", payload: { boardSlots: [] } },
    { type: "pick", matchId: "match-123", round: 2, cardId: "not_a_card", targetSlotIndex: 0, allowReplacement: false },
    { type: "pick", matchId: "match-123", round: 2, cardId: "boar_rider", targetSlotIndex: 6, allowReplacement: false },
    { type: "reroll", matchId: "match-123", round: 16 },
    { type: "forfeit", matchId: "match-123" },
    { type: "rematch", matchId: "match-123" },
    { type: "move", matchId: "match-123", round: 1, sourceSlotIndex: 2, targetSlotIndex: 2 },
    { type: "lock", matchId: "match-123", round: 1, boardSlots: [] },
    { type: "ping", payload: "surprise" },
  ]) {
    assert.equal(parseClientMessage(JSON.stringify(message)), undefined);
  }

  assert.equal(parseClientMessage("{"), undefined);
  assert.equal(parseClientMessage(new ArrayBuffer(2)), undefined);
  assert.equal(parseClientMessage(`{"type":"ping","padding":"${"x".repeat(MAX_SOCKET_MESSAGE_BYTES)}"}`), undefined);
});

test("socket rate limiting uses a fixed bounded window", () => {
  let state = { windowStartedAt: 1_000, messageCount: 0 };
  for (let index = 0; index < MAX_SOCKET_MESSAGES_PER_WINDOW; index += 1) {
    state = consumeRateLimit(state, 1_500);
    assert.equal(state.allowed, true);
  }

  state = consumeRateLimit(state, 1_500);
  assert.equal(state.allowed, false);
  assert.deepEqual(consumeRateLimit(state, 11_000), {
    allowed: true,
    windowStartedAt: 11_000,
    messageCount: 1,
  });
});
