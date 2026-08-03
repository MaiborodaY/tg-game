import assert from "node:assert/strict";
import test from "node:test";

import {
  hasClearedForestGateCampaign,
  hasClearedLevelCampaign,
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

test("each endless mode requires an authoritative victory in that same campaign", () => {
  const forestOnly = profile(
    [{ levelId: "forest-gate", outcome: "victory", completedWaves: 24, score: 72, durationMs: 1 }],
    ["forest-gate", "northern-pass-v3"],
  );
  const northernShort = profile([
    ...forestOnly.bestResults,
    { levelId: "northern-pass-v3", outcome: "victory", completedWaves: 23, score: 68, durationMs: 1 },
  ], ["forest-gate", "northern-pass-v3"]);
  const bothCleared = profile([
    ...forestOnly.bestResults,
    { levelId: "northern-pass-v3", outcome: "victory", completedWaves: 24, score: 72, durationMs: 1 },
  ], ["forest-gate", "northern-pass-v3"]);

  assert.equal(hasClearedLevelCampaign(forestOnly, "northern-pass-v3"), false);
  assert.equal(isSessionAvailable("forest-gate", "endless", forestOnly), true);
  assert.equal(isSessionAvailable("northern-pass-v3", "endless", forestOnly), false);
  assert.equal(isSessionAvailable("northern-pass-v3", "endless", northernShort), false);
  assert.equal(hasClearedLevelCampaign(bothCleared, "northern-pass-v3"), true);
  assert.equal(isSessionAvailable("northern-pass-v3", "endless", bothCleared), true);
  assert.equal(isSessionAvailable("forest-gate", "campaign", bothCleared), true);
  assert.equal(isSessionAvailable("locked-level", "campaign", bothCleared), false);
  assert.equal(isSessionAvailable("locked-level", "campaign", null), true);
});
