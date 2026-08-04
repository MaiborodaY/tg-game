import assert from "node:assert/strict";
import test from "node:test";

import {
  MORNA_AWAKENING_ESSENCE,
  MORNA_COLOSSUS_MAJOR_HOLD_MS,
  MORNA_RANK_RULES,
  getMornaCorpseEssence,
  getMornaCorpseKind,
  getMornaRankRules,
  getMornaSummonKind,
  getMornaSummonStats,
} from "../src/game/morna.ts";

test("Morna keeps a bounded corpse economy and short-lived summon curve", () => {
  assert.equal(MORNA_AWAKENING_ESSENCE, 6);
  assert.equal(MORNA_COLOSSUS_MAJOR_HOLD_MS, 3_000);
  assert.deepEqual(
    [1, 2, 3].map((level) => getMornaRankRules(level).harvestRadius),
    [140, 155, 170],
  );
  assert.deepEqual(
    [1, 2, 3].map((level) => getMornaRankRules(level).maxSummons),
    [1, 2, 3],
  );
  assert.deepEqual(
    [1, 2, 3].map((level) => getMornaRankRules(level).corpseLifetimeMs),
    [8_000, 9_000, 10_000],
  );
  assert.deepEqual(
    [1, 2, 3].map((level) => getMornaRankRules(level).summonLifetimeMs),
    [9_000, 10_000, 11_000],
  );
  assert.ok(Object.isFrozen(MORNA_RANK_RULES));
  assert.ok(Object.values(MORNA_RANK_RULES).every(Object.isFrozen));
});

test("corpse classification never resurrects a boss body directly", () => {
  assert.equal(getMornaCorpseKind("raider"), "light");
  assert.equal(getMornaCorpseKind("brute"), "heavy");
  assert.equal(getMornaCorpseKind("swift", true), "heavy");
  assert.equal(getMornaCorpseKind("boss"), "essence");
  assert.equal(getMornaCorpseKind("titan"), "essence");
  assert.equal(getMornaCorpseEssence("light"), 1);
  assert.equal(getMornaCorpseEssence("heavy"), 1);
  assert.equal(getMornaCorpseEssence("essence"), 2);
  assert.equal(getMornaSummonKind("light"), "warrior");
  assert.equal(getMornaSummonKind("heavy"), "guard");
  assert.equal(getMornaSummonKind("essence"), "guard");
});

test("Morna summons stay weaker and shorter than permanent heroes", () => {
  const warrior = getMornaSummonStats("warrior", 3);
  const guard = getMornaSummonStats("guard", 3);
  const colossus = getMornaSummonStats("colossus", 3);
  assert.ok(warrior.maxHp < guard.maxHp);
  assert.ok(guard.maxHp < colossus.maxHp);
  assert.equal(warrior.blockCapacity, 1);
  assert.equal(guard.blockCapacity, 2);
  assert.equal(colossus.blockCapacity, 3);
  assert.equal(warrior.splashRadius, 0);
  assert.ok(colossus.splashRadius > 0);
  assert.ok(Object.isFrozen(warrior));
});
