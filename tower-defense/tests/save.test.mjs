import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCampaign,
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
  assert.equal(getCampaignSaveKey(null), "td-save-v5:local:forest-gate:campaign");
  assert.equal(getCampaignSaveKey("run-a"), "td-save-v5:run:run-a");
  assert.notEqual(getCampaignSaveKey("run-a"), getCampaignSaveKey("run-b"));
  assert.equal(createLocalCampaignSaveKey("northern-pass", "endless"), "td-save-v5:local:northern-pass:endless");

  const storage = memoryStorage();
  const campaign = buildTower(createCampaignState(), 2, "frost").state;
  assert.equal(saveCampaign(storage, getCampaignSaveKey("run-a"), campaign), true);
  assert.deepEqual(loadCampaign(storage, getCampaignSaveKey("run-a")), campaign);
  assert.equal(loadCampaign(storage, getCampaignSaveKey("run-b")), null);
});

test("an unlocked Grak run remains resumable without rechecking profile transport", () => {
  const storage = memoryStorage();
  const key = getCampaignSaveKey("grak-run");
  const campaign = {
    ...createCampaignState({ heroId: "grak" }),
    completedWave: 8,
    hero: { id: "grak", level: 2, anchorId: 1 },
  };

  assert.equal(saveCampaign(storage, key, campaign), true);
  assert.deepEqual(loadCampaign(storage, key), campaign);
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
  assert.equal(sanitizeCampaign({ ...createCampaignState(), hero: { id: "missing", level: 1, anchorId: 0 } }), null);
  assert.equal(sanitizeCampaign({ ...createCampaignState(), hero: { id: "eira", level: 1, anchorId: 99 } }), null);
});

test("v4 saves migrate through the physical fallback key for every level and mode", () => {
  const storage = memoryStorage();
  const current = {
    ...createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: ENDLESS_RULESET, heroId: "toren" }),
    completedWave: 17,
    gold: 777,
    towers: [{ padId: 4, type: "storm", level: 3 }],
  };
  const { hero: _hero, ...legacy } = current;
  const oldKey = "td-save-v4:local:northern-pass:endless";
  const newKey = createLocalCampaignSaveKey("northern-pass", "endless");
  storage.setItem(oldKey, JSON.stringify({ ...legacy, version: 4 }));

  const migrated = loadCampaign(storage, newKey, { levelId: "northern-pass", modeId: "endless" });
  assert.equal(migrated.version, 5);
  assert.equal(migrated.completedWave, 17);
  assert.equal(migrated.gold, 777);
  assert.deepEqual(migrated.towers, current.towers);
  assert.deepEqual(migrated.hero, { id: "eira", level: 1, anchorId: 0 });
  assert.equal(storage.getItem(oldKey), null);
  assert.deepEqual(JSON.parse(storage.getItem(newKey)), migrated);
});

test("a mismatched v4 reward checkpoint cannot bypass the expected server binding", () => {
  const storage = memoryStorage();
  const runId = "bound-reward";
  const legacyKey = `td-save-v4:run:${runId}`;
  const currentKey = getCampaignSaveKey(runId);
  const northern = createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: ENDLESS_RULESET });
  const { hero: _hero, ...legacy } = northern;
  storage.setItem(legacyKey, JSON.stringify({ ...legacy, version: 4 }));

  assert.equal(loadCampaign(storage, currentKey, {
    levelId: CLASSIC_CAMPAIGN_LEVEL.id,
    modeId: CAMPAIGN_RULESET.id,
  }), null);
  assert.equal(migrateLegacyCampaign(storage, runId), null);
  assert.equal(storage.getItem(currentKey), null);
  assert.notEqual(storage.getItem(legacyKey), null);
});

test("clearing a v5 checkpoint also removes a stale v4 fallback", () => {
  const storage = memoryStorage();
  const key = getCampaignSaveKey("clear-me");
  const legacyKey = "td-save-v4:run:clear-me";
  storage.setItem(key, JSON.stringify(createCampaignState()));
  storage.setItem(legacyKey, JSON.stringify({ ...createCampaignState(), version: 4, hero: undefined }));

  clearCampaign(storage, key);
  assert.equal(storage.getItem(key), null);
  assert.equal(storage.getItem(legacyKey), null);
  assert.equal(loadCampaign(storage, key), null);
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
  assert.equal(migrated.version, 5);
  assert.equal(migrated.levelId, "forest-gate");
  assert.equal(migrated.modeId, "campaign");
  assert.equal(migrated.completedWave, 7);
  assert.deepEqual(migrated.hero, { id: "eira", level: 1, anchorId: 0 });
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
