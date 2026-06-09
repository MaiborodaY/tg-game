import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");

test("fighter alpha only touches Phaser game objects", () => {
  assert.equal(arenaSceneSource.includes("Object.values(fighter).forEach((part) => part.setAlpha(alpha))"), false);
  assert.equal(arenaSceneSource.includes("getFighterParts(fighter).forEach((part) => {"), true);
});

test("equipment texture swaps reapply slot image sizing", () => {
  assert.equal(arenaSceneSource.includes("function syncPaperDollEquipmentSlot("), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollEquipmentImageConfig(image,"), true);
  assert.equal(arenaSceneSource.includes("image.displayHeight = config.displayHeight;"), true);
  assert.equal(arenaSceneSource.includes("image.scaleX = image.scaleY;"), true);
});

test("paper doll loader includes generated and auto equipment assets", () => {
  assert.equal(arenaSceneSource.includes("GENERATED_EQUIPMENT_ASSETS"), true);
  assert.equal(arenaSceneSource.includes("AUTO_EQUIPMENT_ASSETS"), true);
  assert.equal(arenaSceneSource.includes("getHeroItemEquipmentAssetKeys"), true);
  assert.equal(arenaSceneSource.includes("AUTO_EQUIPMENT_ITEM_ASSET_KEYS"), true);
});

test("generated equipment items can carry item-specific transform tuning", () => {
  assert.equal(arenaSceneSource.includes("GENERATED_EQUIPMENT_ITEM_TUNING"), true);
  assert.equal(arenaSceneSource.includes("DEFAULT_EQUIPMENT_ITEM_TUNING"), true);
  assert.equal(arenaSceneSource.includes("activeDebugTuning?.equipmentItems"), true);
  assert.equal(arenaSceneSource.includes("getEquipmentTransformTuning"), true);
  assert.equal(arenaSceneSource.includes("equipmentItems[itemId] ?? GENERATED_EQUIPMENT_ITEM_TUNING[itemId]"), true);
});
