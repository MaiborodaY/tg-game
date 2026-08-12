import assert from "node:assert/strict";
import test from "node:test";

import {
  createMatch,
  createRoom,
  expireMatch,
} from "../src/matchDomain.ts";
import { getExpiryReconciliation } from "../src/expiryLifecycle.ts";

test("an expired waiting room is deleted before reconnect can issue credentials", () => {
  const room = createRoom({ roomId: "expired1", now: 1_000 });

  assert.equal(getExpiryReconciliation(room, undefined, room.expiresAt).status, "delete");
});

test("an active match expires to a persisted finished snapshot at the hard deadline", () => {
  const room = createRoom({ roomId: "expired2", now: 1_000 });
  const active = createMatch({ matchId: "active-match", seed: "server-secret", now: 2_000 });
  const reconciliation = getExpiryReconciliation(room, active, active.expiresAt);

  assert.equal(reconciliation.status, "match_expired");
  assert.equal(reconciliation.match.phase, "finished");
  assert.equal(reconciliation.match.outcome.reason, "expired");
  assert.equal(reconciliation.match.outcome.winner, "draw");
});

test("a finished match is deleted at expiry so rematch cannot revive it", () => {
  const room = createRoom({ roomId: "expired3", now: 1_000 });
  const active = createMatch({ matchId: "finished-match", seed: "server-secret", now: 2_000 });
  const finished = expireMatch(active, active.expiresAt);

  assert.equal(getExpiryReconciliation(room, finished, finished.expiresAt - 1).status, "current");
  assert.equal(getExpiryReconciliation(room, finished, finished.expiresAt).status, "delete");
});
