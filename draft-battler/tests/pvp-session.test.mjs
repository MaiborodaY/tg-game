import assert from "node:assert/strict";
import test from "node:test";

import {
  PVP_SESSION_STORAGE_KEY,
  PvpRequestError,
  clearPvpSession,
  createPvpRoom,
  createPvpSocketUrl,
  joinPvpRoom,
  loadPvpSession,
  normalizePvpApiOrigin,
  normalizePvpRoomId,
  reconnectPvpRoom,
  savePvpSession,
} from "../src/pvpSession.ts";

const ROOM_ID = "abcd2345";
const SEAT_TOKEN = "A".repeat(43);
const SOCKET_TICKET = "B".repeat(43);
const SESSION = { version: 1, roomId: ROOM_ID, seat: "host", seatToken: SEAT_TOKEN };

function createStorage() {
  const values = new Map();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("PvP room and origin normalization fail closed", () => {
  assert.equal(normalizePvpRoomId(" ABCD2345 "), ROOM_ID);
  assert.equal(normalizePvpRoomId("bad-room"), undefined);
  assert.equal(normalizePvpRoomId("abcd2341"), undefined);
  assert.equal(normalizePvpApiOrigin(undefined), "");
  assert.equal(normalizePvpApiOrigin(" https://pvp.example/path "), "https://pvp.example");
  assert.throws(() => normalizePvpApiOrigin("ws://pvp.example"), /HTTP\(S\) origin/);
  assert.throws(() => normalizePvpApiOrigin("https://user:pass@pvp.example"), /HTTP\(S\) origin/);
});

test("PvP socket URL uses an ephemeral ticket and never exposes the durable seat token", () => {
  assert.equal(
    createPvpSocketUrl(ROOM_ID, SOCKET_TICKET, "", "http://127.0.0.1:5173"),
    `ws://127.0.0.1:5173/api/pvp/rooms/${ROOM_ID}/socket?ticket=${SOCKET_TICKET}`,
  );
  assert.equal(
    createPvpSocketUrl(ROOM_ID, SOCKET_TICKET, "https://pvp.example", "http://127.0.0.1:5173"),
    `wss://pvp.example/api/pvp/rooms/${ROOM_ID}/socket?ticket=${SOCKET_TICKET}`,
  );
  assert.doesNotMatch(createPvpSocketUrl(ROOM_ID, SOCKET_TICKET, "", "http://localhost"), new RegExp(SEAT_TOKEN));
  assert.throws(() => createPvpSocketUrl("bad", SOCKET_TICKET, "", "http://localhost"), /valid socket ticket/);
  assert.throws(() => createPvpSocketUrl(ROOM_ID, "short", "", "http://localhost"), /valid socket ticket/);
});

test("PvP seat credentials round-trip locally and tolerate unavailable storage", () => {
  const storage = createStorage();
  assert.equal(loadPvpSession(storage), undefined);
  assert.equal(savePvpSession(storage, { ...SESSION, socketTicket: SOCKET_TICKET }), true);
  assert.deepEqual(loadPvpSession(storage), SESSION);
  assert.doesNotMatch(storage.values.get(PVP_SESSION_STORAGE_KEY), /socketTicket/);
  assert.doesNotMatch(storage.values.get(PVP_SESSION_STORAGE_KEY), /undefined/);
  assert.equal(clearPvpSession(storage), true);
  assert.equal(loadPvpSession(storage), undefined);

  storage.values.set(PVP_SESSION_STORAGE_KEY, JSON.stringify({ ...SESSION, seatToken: "guessable" }));
  assert.equal(loadPvpSession(storage), undefined);
  assert.equal(loadPvpSession({ getItem: () => { throw new Error("blocked"); } }), undefined);
  assert.equal(savePvpSession(undefined, SESSION), false);
  assert.equal(clearPvpSession(undefined), false);
});

test("create, join, and reconnect use the authenticated bootstrap API", async () => {
  const requests = [];
  const fetcher = async (input, init) => {
    requests.push({ input: String(input), init });
    const seat = String(input).endsWith("/join") ? "guest" : "host";
    return createJsonResponse({
      ok: true,
      roomId: ROOM_ID,
      seat,
      seatToken: SEAT_TOKEN,
      socketTicket: SOCKET_TICKET,
      snapshot: { phase: "lobby" },
    });
  };

  const options = { fetcher, telegramInitData: " signed-init-data " };
  assert.equal((await createPvpRoom("", options)).seat, "host");
  assert.equal((await joinPvpRoom("https://pvp.example", " ABCD2345 ", options)).seat, "guest");
  const reconnect = await reconnectPvpRoom("", SESSION, options);
  assert.equal(reconnect.roomId, ROOM_ID);
  assert.equal(reconnect.socketTicket, SOCKET_TICKET);

  assert.deepEqual(requests.map(({ input }) => input), [
    "/api/pvp/rooms",
    `https://pvp.example/api/pvp/rooms/${ROOM_ID}/join`,
    `/api/pvp/rooms/${ROOM_ID}/reconnect`,
  ]);
  requests.forEach(({ init }) => {
    assert.equal(init.method, "POST");
    assert.equal(init.headers["content-type"], "application/json");
    assert.equal(init.headers["x-telegram-init-data"], "signed-init-data");
  });
  assert.deepEqual(JSON.parse(requests[0].init.body), {});
  assert.deepEqual(JSON.parse(requests[1].init.body), {});
  assert.deepEqual(JSON.parse(requests[2].init.body), { seatToken: SEAT_TOKEN });
});

test("PvP bootstrap errors expose bounded codes without leaking credentials", async () => {
  await assert.rejects(
    joinPvpRoom("", "bad", { fetcher: async () => createJsonResponse({}) }),
    (error) => error instanceof PvpRequestError && error.code === "invalid_room_code" && !error.message.includes(SEAT_TOKEN),
  );
  await assert.rejects(
    createPvpRoom("", { fetcher: async () => createJsonResponse({ ok: false, error: "room_full" }, 409) }),
    (error) => error instanceof PvpRequestError && error.code === "room_full" && error.status === 409,
  );
  await assert.rejects(
    createPvpRoom("", { fetcher: async () => createJsonResponse({ ok: true }, 200) }),
    (error) => error instanceof PvpRequestError && error.code === "bad_response",
  );
  await assert.rejects(
    createPvpRoom("", { fetcher: async () => createJsonResponse({
      ok: true,
      roomId: ROOM_ID,
      seat: "host",
      seatToken: SEAT_TOKEN,
      snapshot: {},
    }, 200) }),
    (error) => error instanceof PvpRequestError && error.code === "bad_response",
  );
  await assert.rejects(
    createPvpRoom("", { fetcher: async () => { throw new Error(`secret ${SEAT_TOKEN}`); } }),
    (error) => error instanceof PvpRequestError && error.code === "connection_failed" && !error.message.includes(SEAT_TOKEN),
  );
});
