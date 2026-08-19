import assert from "node:assert/strict";
import test from "node:test";

import { isSamePresentedPvpBattle } from "../src/pvpPresentation.ts";

const FINISHED_MATCH = { matchId: "match-finished", round: 15 };

test("a first battle or terminal snapshot still starts its presentation", () => {
  assert.equal(isSamePresentedPvpBattle("draft", FINISHED_MATCH, FINISHED_MATCH), false);
  assert.equal(isSamePresentedPvpBattle("finished", undefined, FINISHED_MATCH), false);
});

test("updates to the same battle never restart an active or completed presentation", () => {
  assert.equal(isSamePresentedPvpBattle("battle", FINISHED_MATCH, FINISHED_MATCH), true);
  assert.equal(isSamePresentedPvpBattle("finished", FINISHED_MATCH, FINISHED_MATCH), true);
});

test("a genuinely new rematch remains a new presentation identity", () => {
  assert.equal(
    isSamePresentedPvpBattle("finished", FINISHED_MATCH, { matchId: "match-rematch", round: 1 }),
    false,
  );
  assert.equal(
    isSamePresentedPvpBattle("battle", FINISHED_MATCH, { matchId: FINISHED_MATCH.matchId, round: 1 }),
    false,
  );
});
