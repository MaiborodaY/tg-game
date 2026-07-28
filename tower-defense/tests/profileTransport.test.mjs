import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePlayerProfileTransport,
  serializePlayerProfileTransport,
} from "../src/game/profileTransport.ts";

test("server profile transport maps snake_case into the strict immutable domain snapshot", () => {
  const transport = profileTransport();
  const profile = parsePlayerProfileTransport(transport);

  assert.deepEqual(profile, {
    version: 1,
    revision: 7,
    unlockedLevelIds: ["forest-gate", "northern-pass"],
    bestResults: [{
      levelId: "forest-gate",
      outcome: "victory",
      completedWaves: 24,
      score: 72,
      durationMs: 81_234,
    }],
    ownedCosmeticSkins: [{ skinId: "tower.ranger.moss", towerType: "ranger" }],
    equippedTowerSkins: [{ towerType: "ranger", skinId: "tower.ranger.moss" }],
  });
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.bestResults[0]), true);
  assert.deepEqual(parsePlayerProfileTransport(serializePlayerProfileTransport(profile)), profile);
});

test("server profile transport rejects schema drift and invalid cross-field references", () => {
  const valid = profileTransport();
  assert.equal(parsePlayerProfileTransport({ ...valid, gold: 500 }), null);
  assert.equal(parsePlayerProfileTransport({
    ...valid,
    best_results: [{ ...valid.best_results[0], unknown: true }],
  }), null);
  assert.equal(parsePlayerProfileTransport({
    ...valid,
    best_results: [{ ...valid.best_results[0], level_id: "locked-level" }],
  }), null);
  assert.equal(parsePlayerProfileTransport({
    ...valid,
    equipped_tower_skins: [{ tower_type: "storm", skin_id: "tower.ranger.moss" }],
  }), null);
});

function profileTransport() {
  return {
    version: 1,
    revision: 7,
    unlocked_level_ids: ["northern-pass", "forest-gate"],
    best_results: [{
      level_id: "forest-gate",
      outcome: "victory",
      completed_waves: 24,
      score: 72,
      duration_ms: 81_234,
    }],
    owned_cosmetic_skins: [{ skin_id: "tower.ranger.moss", tower_type: "ranger" }],
    equipped_tower_skins: [{ tower_type: "ranger", skin_id: "tower.ranger.moss" }],
  };
}
