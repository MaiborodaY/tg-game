import assert from "node:assert/strict";
import test from "node:test";

import {
  createLocalCampaignSaveKey,
  getCampaignSaveKey,
  loadCampaign,
  migrateLegacyCampaign,
  sanitizeCampaign,
  saveCampaign,
} from "../src/game/save.ts";
import {
  CAMPAIGN_RULESET,
  CLASSIC_CAMPAIGN_LEVEL,
  ENDLESS_RULESET,
  MAX_ENDLESS_WAVE,
  NORTHERN_PASS_LEVEL,
} from "../src/game/content.ts";
import { buildTower, createCampaignState } from "../src/game/state.ts";
import { captureFinalResult } from "../src/reward.ts";
import { loadPendingResult, pendingKey, savePendingResult } from "../src/pendingResult.ts";

test("practice and reward runs have isolated checkpoint keys", () => {
  assert.equal(getCampaignSaveKey(null), "td-save-v4:local:forest-gate:campaign");
  assert.equal(getCampaignSaveKey("run-a"), "td-save-v4:run:run-a");
  assert.notEqual(getCampaignSaveKey("run-a"), getCampaignSaveKey("run-b"));
  assert.equal(createLocalCampaignSaveKey("northern-pass", "endless"), "td-save-v4:local:northern-pass:endless");

  const storage = memoryStorage();
  const campaign = buildTower(createCampaignState(), 2, "frost").state;
  assert.equal(saveCampaign(storage, getCampaignSaveKey("run-a"), campaign), true);
  assert.deepEqual(loadCampaign(storage, getCampaignSaveKey("run-a")), campaign);
  assert.equal(loadCampaign(storage, getCampaignSaveKey("run-b")), null);
});

test("callers can pin a checkpoint to the expected level and mode", () => {
  const storage = memoryStorage();
  const key = getCampaignSaveKey("reward-run");
  const endless = createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: ENDLESS_RULESET });
  assert.equal(saveCampaign(storage, key, endless), true);

  assert.deepEqual(loadCampaign(storage, key, {
    levelId: NORTHERN_PASS_LEVEL.id,
    modeId: ENDLESS_RULESET.id,
  }), endless);
  assert.equal(loadCampaign(storage, key, {
    levelId: CLASSIC_CAMPAIGN_LEVEL.id,
    modeId: CAMPAIGN_RULESET.id,
  }), null);
});

test("corrupted saves are rejected and tower coordinates are strictly sanitized", () => {
  assert.equal(sanitizeCampaign({ version: 2 }), null);
  const value = sanitizeCampaign({
    ...createCampaignState(),
    gold: 500,
    lives: 999,
    completedWave: 2,
    totalKills: 3,
    activeDurationMs: 50,
    towers: [
      { padId: 1, type: "ranger", level: 2 },
      { padId: 1, type: "ember", level: 3 },
      { padId: 999, type: "frost", level: 1 },
      { padId: 2, type: "invalid", level: 1 },
      { padId: 3, type: "storm", level: 4 },
    ],
  });
  assert.equal(value.lives, 20);
  assert.deepEqual(value.towers, [
    { padId: 1, type: "ranger", level: 2 },
    { padId: 3, type: "storm", level: 4 },
  ]);
});

test("saved progress can never exceed the finite campaign score", () => {
  const value = sanitizeCampaign({
    ...createCampaignState(),
    completedWave: 999,
  });
  assert.equal(value.completedWave, 24);
});

test("run saves respect the selected level and endless completion boundaries", () => {
  const northern = createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: CAMPAIGN_RULESET });
  assert.equal(sanitizeCampaign({ ...northern, completedWave: 999 }).completedWave, 18);
  assert.equal(sanitizeCampaign({ ...northern, lives: 999 }).lives, 15);

  const endless = createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: ENDLESS_RULESET });
  assert.equal(sanitizeCampaign({ ...endless, completedWave: 127 }).completedWave, 127);
  assert.equal(sanitizeCampaign({ ...endless, completedWave: MAX_ENDLESS_WAVE + 1 }).completedWave, MAX_ENDLESS_WAVE);
  assert.equal(sanitizeCampaign({ ...endless, levelId: "missing" }), null);
});

test("v3 checkpoints migrate into the versioned classic run contract", () => {
  const storage = memoryStorage();
  storage.setItem("td-save-v3:local", JSON.stringify({
    version: 3,
    gold: 321,
    lives: 14,
    completedWave: 7,
    totalKills: 88,
    activeDurationMs: 12_345,
    towers: [{ padId: 1, type: "frost", level: 2 }],
  }));

  const migrated = migrateLegacyCampaign(storage);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.levelId, "forest-gate");
  assert.equal(migrated.modeId, "campaign");
  assert.equal(migrated.completedWave, 7);
  assert.equal(storage.getItem("td-save-v3:local"), null);
  assert.deepEqual(loadCampaign(storage, getCampaignSaveKey(null)), migrated);
});

test("legacy practice progress migrates but reward callers choose whether to use it", () => {
  const storage = memoryStorage();
  storage.setItem("td_save_v2", JSON.stringify({
    gold: 77,
    hp: 12,
    resumeWave: 4,
    towers: [{ type: "ARCHER", r: 3, c: 2 }, { type: "MAGE", r: 5, c: 6 }],
  }));
  const migrated = migrateLegacyCampaign(storage);
  assert.equal(migrated.completedWave, 3);
  assert.equal(migrated.towers.length, 2);
  assert.deepEqual(migrated.towers.map((tower) => tower.type), ["ranger", "ember"]);
  assert.equal(storage.getItem("td_save_v2"), null);
  assert.deepEqual(loadCampaign(storage, getCampaignSaveKey(null)), migrated);
});

test("a pending finish is scoped by run and survives a reload without storing a token", () => {
  const storage = memoryStorage();
  const result = captureFinalResult(31, 80_000);
  assert.equal(savePendingResult(storage, "run-a", "gameover", result, 13), true);
  assert.deepEqual(loadPendingResult(storage, "run-a", 72, 24), {
    version: 2,
    outcome: "gameover",
    score: 31,
    waves: 13,
    durationMs: 80_000,
  });
  assert.equal(loadPendingResult(storage, "run-b", 72, 24), null);
  assert.equal(storage.getItem(pendingKey("run-a")).includes("token"), false);
});

test("legacy pending wave scores remain retryable after the rating change", () => {
  const storage = memoryStorage();
  storage.setItem(pendingKey("legacy-run"), JSON.stringify({
    version: 1,
    outcome: "victory",
    score: 24,
    durationMs: 90_000,
  }));

  assert.deepEqual(loadPendingResult(storage, "legacy-run", 72, 24), {
    version: 2,
    outcome: "victory",
    score: 24,
    waves: 24,
    durationMs: 90_000,
  });
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}
