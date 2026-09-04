import assert from "node:assert/strict";
import test from "node:test";

import { getNextRoomAlarmAt } from "../src/roomAlarm.ts";

test("active rooms schedule the earliest disconnect grace deadline", () => {
  const room = {
    expiresAt: 20_000,
    seats: {
      host: { disconnectDeadline: 3_000 },
      guest: { disconnectDeadline: 4_000 },
    },
  };

  assert.equal(getNextRoomAlarmAt(room, { phase: "draft", expiresAt: 10_000 }), 3_000);
});

test("finished matches ignore stale disconnect deadlines and schedule their expiry", () => {
  const room = {
    expiresAt: 20_000,
    seats: {
      host: { disconnectDeadline: 3_000 },
      guest: { disconnectDeadline: 4_000 },
    },
  };

  assert.equal(getNextRoomAlarmAt(room, { phase: "finished", expiresAt: 10_000, rankingStatus: "recorded" }), 10_000);
  assert.equal(getNextRoomAlarmAt(room, { phase: "finished", expiresAt: 10_000 }, 1_000), 10_000);
  assert.equal(getNextRoomAlarmAt(room, { phase: "finished", expiresAt: 30_000 }, 1_000, true), 11_000);
});

test("active matches with both grace deadlines elapsed never reschedule an alarm in the past", () => {
  const room = {
    expiresAt: 20_000,
    seats: {
      host: { disconnectDeadline: 3_000 },
      guest: { disconnectDeadline: 4_000 },
    },
  };

  assert.equal(getNextRoomAlarmAt(room, { phase: "draft", expiresAt: 10_000 }, 5_000), 10_000);
  assert.equal(getNextRoomAlarmAt({ expiresAt: 4_000, seats: room.seats }, { phase: "draft", expiresAt: 4_500 }, 5_000), Infinity);
});
