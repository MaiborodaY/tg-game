import assert from "node:assert/strict";
import test from "node:test";

import {
  getCampaignSaveKey,
  loadCampaign,
  migrateLegacyCampaign,
  sanitizeCampaign,
  saveCampaign,
} from "../src/game/save.ts";
import { buildTower, createCampaignState } from "../src/game/state.ts";
import { captureFinalResult } from "../src/reward.ts";
import { loadPendingResult, pendingKey, savePendingResult } from "../src/pendingResult.ts";

test("practice and reward runs have isolated checkpoint keys", () => {
  assert.equal(getCampaignSaveKey(null), "td-save-v3:local");
  assert.equal(getCampaignSaveKey("run-a"), "td-save-v3:run:run-a");
  assert.notEqual(getCampaignSaveKey("run-a"), getCampaignSaveKey("run-b"));

  const storage = memoryStorage();
  const campaign = buildTower(createCampaignState(), 2, "frost").state;
  assert.equal(saveCampaign(storage, getCampaignSaveKey("run-a"), campaign), true);
  assert.deepEqual(loadCampaign(storage, getCampaignSaveKey("run-a")), campaign);
  assert.equal(loadCampaign(storage, getCampaignSaveKey("run-b")), null);
});

test("corrupted saves are rejected and tower coordinates are strictly sanitized", () => {
  assert.equal(sanitizeCampaign({ version: 2 }), null);
  const value = sanitizeCampaign({
    version: 3,
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
    ],
  });
  assert.equal(value.lives, 20);
  assert.deepEqual(value.towers, [{ padId: 1, type: "ranger", level: 2 }]);
});

test("saved progress can never exceed the finite campaign score", () => {
  const value = sanitizeCampaign({
    version: 3,
    gold: 190,
    lives: 20,
    completedWave: 999,
    totalKills: 0,
    activeDurationMs: 0,
    towers: [],
  });
  assert.equal(value.completedWave, 12);
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
  const result = captureFinalResult(6, 80_000);
  assert.equal(savePendingResult(storage, "run-a", "gameover", result), true);
  assert.deepEqual(loadPendingResult(storage, "run-a", 12), {
    version: 1,
    outcome: "gameover",
    score: 6,
    durationMs: 80_000,
  });
  assert.equal(loadPendingResult(storage, "run-b", 12), null);
  assert.equal(storage.getItem(pendingKey("run-a")).includes("token"), false);
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}
