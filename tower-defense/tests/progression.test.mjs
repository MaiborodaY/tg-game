import assert from "node:assert/strict";
import test from "node:test";

import {
  hasClearedForestGateCampaign,
  isSessionAvailable,
} from "../src/game/progression.ts";

function profile(bestResults = [], unlockedLevelIds = ["forest-gate"]) {
  return Object.freeze({
    version: 1,
    revision: 1,
    unlockedLevelIds: Object.freeze(unlockedLevelIds),
    bestResults: Object.freeze(bestResults),
    ownedCosmeticSkins: Object.freeze([]),
    equippedTowerSkins: Object.freeze([]),
  });
}

test("Forest Gate endless unlock requires an authoritative campaign victory through wave 24", () => {
  const defeat = profile([{ levelId: "forest-gate", outcome: "defeat", completedWaves: 24, score: 24, durationMs: 1 }]);
  const shortVictory = profile([{ levelId: "forest-gate", outcome: "victory", completedWaves: 23, score: 23, durationMs: 1 }]);
  const victory = profile([{ levelId: "forest-gate", outcome: "victory", completedWaves: 24, score: 24, durationMs: 1 }]);

  assert.equal(hasClearedForestGateCampaign(null), false);
  assert.equal(hasClearedForestGateCampaign(defeat), false);
  assert.equal(hasClearedForestGateCampaign(shortVictory), false);
  assert.equal(hasClearedForestGateCampaign(victory), true);
  assert.equal(isSessionAvailable("forest-gate", "endless", victory), true);
});

test("v1 endless stays limited to Forest Gate and campaign follows profile level unlocks", () => {
  const victory = profile(
    [{ levelId: "forest-gate", outcome: "victory", completedWaves: 24, score: 24, durationMs: 1 }],
    ["forest-gate", "northern-pass"],
  );

  assert.equal(isSessionAvailable("northern-pass", "endless", victory), false);
  assert.equal(isSessionAvailable("forest-gate", "campaign", victory), true);
  assert.equal(isSessionAvailable("locked-level", "campaign", victory), false);
  assert.equal(isSessionAvailable("locked-level", "campaign", null), true);
});
