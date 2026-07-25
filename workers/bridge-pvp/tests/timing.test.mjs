import assert from "node:assert/strict";
import test from "node:test";

import {
  HUMAN_ACTION_DURATION_MS,
  resolveHumanTurnDeadline,
} from "../src/timing.ts";

test("a newly reached human turn always gets the full action window", () => {
  const now = 10_000;
  const almostExpiredPreviousTurn = now + 500;

  assert.equal(
    resolveHumanTurnDeadline(now, almostExpiredPreviousTurn, false),
    now + HUMAN_ACTION_DURATION_MS,
  );
  assert.equal(
    resolveHumanTurnDeadline(now, undefined, true),
    now + HUMAN_ACTION_DURATION_MS,
  );
});

test("rerendering the same human turn preserves its original deadline", () => {
  const originalDeadline = 42_000;
  assert.equal(
    resolveHumanTurnDeadline(20_000, originalDeadline, true),
    originalDeadline,
  );
});
