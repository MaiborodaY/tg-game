import assert from "node:assert/strict";
import test from "node:test";

import {
  GRAK_UNLOCK_COMPLETED_WAVES,
  GRAK_UNLOCK_LEVEL_ID,
  isHeroUnlocked,
} from "../src/game/heroAvailability.ts";
import { createPlayerProfileSnapshot, recordCampaignBestResult, unlockCampaignLevel } from "../src/game/profile.ts";

function profileWithResult(result) {
  const unlocked = unlockCampaignLevel(createPlayerProfileSnapshot(), result.levelId).profile;
  return recordCampaignBestResult(unlocked, result).profile;
}

test("starter heroes remain available without a server profile", () => {
  assert.equal(isHeroUnlocked("eira", null), true);
  assert.equal(isHeroUnlocked("toren", null), true);
  assert.equal(isHeroUnlocked("grak", null), false);
});

test("Grak unlocks only after a complete Forest Gate victory", () => {
  const victory = profileWithResult({
    levelId: GRAK_UNLOCK_LEVEL_ID,
    outcome: "victory",
    completedWaves: GRAK_UNLOCK_COMPLETED_WAVES,
    score: 100,
    durationMs: 60_000,
  });
  assert.equal(isHeroUnlocked("grak", victory), true);

  const incomplete = profileWithResult({
    levelId: GRAK_UNLOCK_LEVEL_ID,
    outcome: "victory",
    completedWaves: GRAK_UNLOCK_COMPLETED_WAVES - 1,
    score: 100,
    durationMs: 60_000,
  });
  assert.equal(isHeroUnlocked("grak", incomplete), false);

  const defeat = profileWithResult({
    levelId: GRAK_UNLOCK_LEVEL_ID,
    outcome: "defeat",
    completedWaves: GRAK_UNLOCK_COMPLETED_WAVES,
    score: 100,
    durationMs: 60_000,
  });
  assert.equal(isHeroUnlocked("grak", defeat), false);
});

test("a victory on another campaign does not unlock Grak", () => {
  const profile = profileWithResult({
    levelId: "northern-pass",
    outcome: "victory",
    completedWaves: GRAK_UNLOCK_COMPLETED_WAVES,
    score: 100,
    durationMs: 60_000,
  });
  assert.equal(isHeroUnlocked("grak", profile), false);
});
