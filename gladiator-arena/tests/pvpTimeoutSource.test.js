import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(resolve(currentDir, "../../workers/gladiator-pvp/src/index.ts"), "utf8");

test("pvp turn timeouts keep per-seat streaks and shorten future turns", () => {
  assert.match(workerSource, /timeoutStreaks\?: Partial<Record<PvpSeat, number>>/);
  assert.match(workerSource, /const MAX_CONSECUTIVE_TURN_TIMEOUTS = 3/);
  assert.match(workerSource, /function getTurnDurationMs/);
  assert.match(workerSource, /MAX_CONSECUTIVE_TURN_TIMEOUTS - 1/);
  assert.match(workerSource, /TURN_DURATION_MS \/ 2 \*\* timeoutPenalty/);
  assert.match(workerSource, /getSeatTimeoutStreak\(record, seat\) \+ 1/);
});

test("pvp third consecutive timeout kills the timed out seat", () => {
  assert.match(workerSource, /private applyTimedOutTurn\(record: RoomRecord, seat: PvpSeat\): RoomRecord/);
  assert.match(workerSource, /timeoutStreak >= MAX_CONSECUTIVE_TURN_TIMEOUTS/);
  assert.match(workerSource, /state: createTimeoutLossState\(record\.state, seat\)/);
  assert.match(workerSource, /nextState\.player\.hp = 0/);
  assert.match(workerSource, /nextState\.enemy\.hp = 0/);
  assert.match(workerSource, /result: timedOutActor === "player" \? "lose" : "win"/);
});

test("pvp player actions reset timeout streaks but automatic rests do not", () => {
  assert.match(workerSource, /applyAction\(\{ \.\.\.record, timeoutStreaks \}, seat, REST_ACTION_ID, \{ resetTimeoutStreak: false \}\)/);
  assert.match(workerSource, /options\.resetTimeoutStreak === false/);
  assert.match(workerSource, /getNextTimeoutStreaks\(record\.timeoutStreaks, seat, 0\)/);
});
