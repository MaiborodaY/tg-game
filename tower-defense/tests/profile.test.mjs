import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlayerProfileSnapshot,
  equipTowerSkin,
  grantCosmeticSkin,
  recordCampaignBestResult,
  sanitizePlayerProfileSnapshot,
  unequipTowerSkin,
  unlockCampaignLevel,
} from "../src/game/profile.ts";

test("player profile is an immutable cross-run snapshot", () => {
  const profile = createPlayerProfileSnapshot();

  assert.deepEqual(profile, {
    version: 1,
    revision: 0,
    unlockedLevelIds: [],
    bestResults: [],
    ownedCosmeticSkins: [],
    equippedTowerSkins: [],
  });
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.unlockedLevelIds), true);
  for (const runField of ["gold", "lives", "towers", "activeDurationMs", "runId", "token"]) {
    assert.equal(runField in profile, false);
  }
});

test("profile sanitization is strict, canonical and fail-closed", () => {
  const sanitized = sanitizePlayerProfileSnapshot({
    version: 1,
    revision: 7,
    unlockedLevelIds: ["forest-02", "forest-01"],
    bestResults: [{
      levelId: "forest-01",
      outcome: "victory",
      completedWaves: 24,
      score: 72,
      durationMs: 95_000,
    }],
    ownedCosmeticSkins: [
      { skinId: "tower.storm.tempest", towerType: "storm" },
      { skinId: "tower.ranger.moss", towerType: "ranger" },
    ],
    equippedTowerSkins: [
      { towerType: "storm", skinId: "tower.storm.tempest" },
      { towerType: "ranger", skinId: "tower.ranger.moss" },
    ],
  });

  assert.deepEqual(sanitized.unlockedLevelIds, ["forest-01", "forest-02"]);
  assert.deepEqual(sanitized.ownedCosmeticSkins.map((skin) => skin.skinId), [
    "tower.ranger.moss",
    "tower.storm.tempest",
  ]);
  assert.deepEqual(sanitized.equippedTowerSkins.map((skin) => skin.towerType), ["ranger", "storm"]);
  assert.equal(Object.isFrozen(sanitized.bestResults[0]), true);
  assert.equal(Object.isFrozen(sanitized.equippedTowerSkins), true);

  const valid = structuredClone(sanitized);
  assert.equal(sanitizePlayerProfileSnapshot({ ...valid, version: 2 }), null);
  assert.equal(sanitizePlayerProfileSnapshot({ ...valid, gold: 999 }), null, "run state cannot cross the profile boundary");
  assert.equal(sanitizePlayerProfileSnapshot({ ...valid, unlockedLevelIds: ["forest-01", "forest-01"] }), null);
  assert.equal(sanitizePlayerProfileSnapshot({
    ...valid,
    bestResults: [{ ...valid.bestResults[0], levelId: "locked-level" }],
  }), null);
  assert.equal(sanitizePlayerProfileSnapshot({
    ...valid,
    equippedTowerSkins: [{ towerType: "frost", skinId: "tower.ranger.moss" }],
  }), null);
});

test("campaign unlocks are immutable and idempotent", () => {
  const initial = createPlayerProfileSnapshot();
  const unlocked = unlockCampaignLevel(initial, "forest-01");

  assert.equal(unlocked.changed, true);
  assert.equal(unlocked.error, null);
  assert.equal(unlocked.profile.revision, 1);
  assert.deepEqual(unlocked.profile.unlockedLevelIds, ["forest-01"]);
  assert.deepEqual(initial.unlockedLevelIds, []);

  const duplicate = unlockCampaignLevel(unlocked.profile, "forest-01");
  assert.equal(duplicate.changed, false);
  assert.equal(duplicate.error, null);
  assert.equal(duplicate.profile, unlocked.profile);
  assert.equal(duplicate.profile.revision, 1);

  const invalid = unlockCampaignLevel(unlocked.profile, "../forest");
  assert.equal(invalid.changed, false);
  assert.equal(invalid.error, "invalid_level_id");
  assert.equal(invalid.profile, unlocked.profile);
});

test("best campaign result advances monotonically and retries are idempotent", () => {
  const profile = unlockCampaignLevel(createPlayerProfileSnapshot(), "forest-01").profile;
  const defeat = {
    levelId: "forest-01",
    outcome: "defeat",
    completedWaves: 10,
    score: 22,
    durationMs: 80_000,
  };
  const first = recordCampaignBestResult(profile, defeat);
  assert.equal(first.changed, true);

  const duplicate = recordCampaignBestResult(first.profile, defeat);
  assert.equal(duplicate.changed, false);
  assert.equal(duplicate.profile, first.profile);

  const shorterButWorse = recordCampaignBestResult(first.profile, {
    ...defeat,
    completedWaves: 9,
    score: 999,
    durationMs: 1,
  });
  assert.equal(shorterButWorse.changed, false, "campaign progress outranks score and time");

  const victory = recordCampaignBestResult(first.profile, {
    ...defeat,
    outcome: "victory",
    completedWaves: 12,
    score: 30,
    durationMs: 90_000,
  });
  assert.equal(victory.changed, true);
  assert.equal(victory.profile.bestResults[0].outcome, "victory");

  const fasterVictory = recordCampaignBestResult(victory.profile, {
    ...victory.profile.bestResults[0],
    durationMs: 70_000,
  });
  assert.equal(fasterVictory.changed, true);
  assert.equal(fasterVictory.profile.bestResults[0].durationMs, 70_000);

  const locked = recordCampaignBestResult(profile, { ...defeat, levelId: "forest-02" });
  assert.equal(locked.error, "level_locked");
  assert.equal(locked.profile, profile);
});

test("owned cosmetic skins gate an idempotent tower loadout", () => {
  const initial = createPlayerProfileSnapshot();
  const granted = grantCosmeticSkin(initial, { skinId: "tower.ranger.moss", towerType: "ranger" });
  assert.equal(granted.changed, true);
  assert.equal(granted.profile.revision, 1);

  const repeatedGrant = grantCosmeticSkin(granted.profile, { skinId: "tower.ranger.moss", towerType: "ranger" });
  assert.equal(repeatedGrant.changed, false);
  assert.equal(repeatedGrant.profile, granted.profile);

  const conflictingGrant = grantCosmeticSkin(granted.profile, { skinId: "tower.ranger.moss", towerType: "storm" });
  assert.equal(conflictingGrant.error, "skin_id_conflict");

  const missing = equipTowerSkin(granted.profile, "ranger", "tower.ranger.royal");
  assert.equal(missing.error, "skin_not_owned");
  const wrongTower = equipTowerSkin(granted.profile, "storm", "tower.ranger.moss");
  assert.equal(wrongTower.error, "skin_target_mismatch");

  const equipped = equipTowerSkin(granted.profile, "ranger", "tower.ranger.moss");
  assert.equal(equipped.changed, true);
  assert.deepEqual(equipped.profile.equippedTowerSkins, [
    { towerType: "ranger", skinId: "tower.ranger.moss" },
  ]);

  const repeatedEquip = equipTowerSkin(equipped.profile, "ranger", "tower.ranger.moss");
  assert.equal(repeatedEquip.changed, false);
  assert.equal(repeatedEquip.profile, equipped.profile);

  const unequipped = unequipTowerSkin(equipped.profile, "ranger");
  assert.equal(unequipped.changed, true);
  assert.deepEqual(unequipped.profile.equippedTowerSkins, []);
  const repeatedUnequip = unequipTowerSkin(unequipped.profile, "ranger");
  assert.equal(repeatedUnequip.changed, false);
  assert.equal(repeatedUnequip.profile, unequipped.profile);
});
