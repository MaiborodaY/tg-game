import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("debug panel exposes save as prod defaults action", () => {
  const source = readFileSync(join(root, "src", "debugPanel.ts"), "utf8");

  assert.match(source, /Save as prod defaults/);
  assert.match(source, /saveProdDefaults\(debugTuning\)/);
});

test("client saver posts debug tuning to the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/save-prod-defaults/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /JSON\.stringify\(tuning\)/);
});

test("client saver can promote auto equipment through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/promote-equipment-item/);
  assert.match(source, /savePromotedEquipmentItem/);
});

test("client saver can remove generated equipment through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/remove-equipment-item/);
  assert.match(source, /removePromotedEquipmentItem/);
  assert.match(source, /JSON\.stringify\(\{ itemId \}\)/);
});

test("vite dev middleware only writes whitelisted arena layout defaults", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /configureServer/);
  assert.match(source, /DEFAULT_PLAYER_STAGE_X: "playerStageX"/);
  assert.match(source, /DEFAULT_ACTION_REST_ANGLE: "actionRestArcAngle"/);
  assert.doesNotMatch(source, /gridStep/);
  assert.match(source, /applyProdDefaultUpdates/);
});

test("vite dev middleware writes promoted equipment to generated files", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /promote-equipment-item/);
  assert.match(source, /equipmentItems\.generated\.json/);
  assert.match(source, /equipmentItems\.generated\.ts/);
  assert.match(source, /pickPromotedEquipmentItem/);
  assert.match(source, /equipmentTuning/);
});

test("vite dev middleware removes generated equipment records and asset files", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /remove-equipment-item/);
  assert.match(source, /pickGeneratedEquipmentRemovalId/);
  assert.match(source, /removeGeneratedEquipmentItem/);
  assert.match(source, /removeGeneratedEquipmentAssetFiles/);
  assert.match(source, /rm\(getProjectSourceUrl\(sourcePath\), \{ force: true \}\)/);
  assert.match(source, /Only generated equipment items can be removed/);
});

test("save as prod defaults also persists the selected rig editor animation", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const saveDefaultsRoute = source.slice(source.indexOf('"/__dust-arena/save-prod-defaults"'), source.indexOf('"/__dust-arena/save-prod-animation"'));

  assert.match(saveDefaultsRoute, /const bodyAnimationUpdates = pickBodyAnimationUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /applyBodyAnimationDefaultUpdates/);
  assert.match(saveDefaultsRoute, /bodyAnimationUpdates\.key/);
});

test("vite dev middleware converts promoted png equipment to standardized webp assets", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /import sharp from "sharp"/);
  assert.match(source, /await pickPromotedEquipmentItem/);
  assert.match(source, /convertPromotedEquipmentPngAsset/);
  assert.match(source, /sourcePath\.endsWith\("\.png"\)/);
  assert.match(source, /promotedEquipmentRuntimeWebpQuality = 86/);
  assert.match(source, /promotedEquipmentLowWebpQuality = 76/);
  assert.match(source, /promotedEquipmentLowMaxSide = 448/);
  assert.match(source, /readAssetSourcePath\(asset\.sourcePath, getEquipmentAssetSourcePrefix\(kind\), "asset\.sourcePath", \["\.png", "\.webp"\]\)/);
  assert.match(source, /getEquipmentAssetLowSourcePrefix\(kind\)/);
});

test("vite dev middleware can promote weapon equipment into the weapon shop", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const generatedSource = readFileSync(join(root, "src", "generated", "equipmentItems.generated.ts"), "utf8");
  const weaponShopSource = readFileSync(join(root, "src", "weaponShopUi.ts"), "utf8");

  assert.match(source, /damageBonus/);
  assert.match(source, /getEquipmentAssetSourcePrefix\(kind\)/);
  assert.match(source, /assets\/fighters\/weapons\//);
  assert.match(source, /weaponProduct/);
  assert.match(source, /getWeaponCategoryId/);
  assert.match(source, /Promoted weapon item must use weaponMain slot/);
  assert.match(generatedSource, /GeneratedWeaponProduct/);
  assert.match(generatedSource, /GENERATED_WEAPON_PRODUCTS/);
  assert.match(weaponShopSource, /GENERATED_WEAPON_PRODUCTS/);
  assert.match(weaponShopSource, /getGeneratedWeaponProducts/);
});

test("vite dev middleware can persist item-specific equipment defaults", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(debugTuningSource, /DEFAULT_EQUIPMENT_ITEM_TUNING/);
  assert.match(debugTuningSource, /equipmentItems: cloneEquipmentItems/);
  assert.match(source, /pickEquipmentItemDefaultUpdates/);
  assert.match(source, /applyEquipmentItemDefaultUpdates/);
  assert.match(source, /DEFAULT_EQUIPMENT_ITEM_TUNING/);
});

test("vite dev middleware whitelists wrist and glove equipment slots for prod saves and promotion", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(source, /"backWrist"/);
  assert.match(source, /"frontWrist"/);
  assert.match(source, /"backGlove"/);
  assert.match(source, /"frontGlove"/);
  assert.match(source, /slotKey === "backWrist"/);
  assert.match(source, /slotKey === "frontWrist"/);
  assert.match(source, /slotKey === "backGlove"/);
  assert.match(source, /slotKey === "frontGlove"/);
  assert.match(debugTuningSource, /backWrist:/);
  assert.match(debugTuningSource, /frontWrist:/);
  assert.match(debugTuningSource, /backGlove:/);
  assert.match(debugTuningSource, /frontGlove:/);
});
