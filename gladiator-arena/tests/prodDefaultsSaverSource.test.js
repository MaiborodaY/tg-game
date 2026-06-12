import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

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

test("client saver can update generated shop items through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/update-generated-shop-item/);
  assert.match(source, /UpdateGeneratedShopItemPayload/);
  assert.match(source, /saveGeneratedShopItem/);
  assert.match(source, /JSON\.stringify\(payload\)/);
});

test("vite dev middleware only writes whitelisted arena layout defaults", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /configureServer/);
  assert.match(source, /DEFAULT_PLAYER_STAGE_X: "playerStageX"/);
  assert.match(source, /DEFAULT_ACTION_REST_ANGLE: "actionRestArcAngle"/);
  assert.match(source, /DEFAULT_ACTION_ICON_SCALE: "actionIconScale"/);
  assert.match(source, /DEFAULT_ACTION_ATTACK_ICON_SCALE: "actionAttackIconScale"/);
  assert.match(source, /DEFAULT_ACTION_LIGHT_ICON_ROTATION: "actionLightIconRotation"/);
  assert.match(source, /DEFAULT_ACTION_MEDIUM_ICON_SCALE: "actionMediumIconScale"/);
  assert.match(source, /DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS: "actionHeavyIconBrightness"/);
  assert.match(source, /DEFAULT_ACTION_TOKEN_RING_WIDTH: "actionTokenRingWidth"/);
  assert.match(source, /DEFAULT_ACTION_TOKEN_INNER_SHINE: "actionTokenInnerShine"/);
  assert.match(source, /DEFAULT_CLASSIC_HUD_OFFSET_X: "classicHudOffsetX"/);
  assert.match(source, /DEFAULT_CLASSIC_HUD_OFFSET_Y: "classicHudOffsetY"/);
  assert.match(source, /DEFAULT_CLASSIC_HUD_SCALE: "classicHudScale"/);
  assert.match(source, /DEFAULT_CLASSIC_HUD_SAFE_OFFSET: "classicHudSafeOffset"/);
  assert.match(source, /DEFAULT_HUD_BOTTOM_OFFSET: "hudBottomOffset"/);
  assert.match(source, /DEFAULT_FIGHTER_HUD_GAP: "fighterHudGap"/);
  assert.match(source, /DEFAULT_CAMERA_FEET_SCREEN_Y: "cameraFeetScreenY"/);
  assert.match(source, /DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y: "cameraCloseFeetShiftY"/);
  assert.match(source, /DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO: "cameraFeetMinScreenRatio"/);
  assert.match(source, /DEFAULT_ARENA_BACK_FOLLOW_X: "arenaBackFollowX"/);
  assert.match(source, /DEFAULT_ARENA_BACK_FOLLOW_Y: "arenaBackFollowY"/);
  assert.match(source, /DEFAULT_ARENA_BACK_ZOOM: "arenaBackZoom"/);
  assert.match(source, /DEFAULT_ARENA_BACK_LOOK_UP_Y: "arenaBackLookUpY"/);
  assert.match(source, /DEFAULT_ARENA_MID_FOLLOW_X: "arenaMidFollowX"/);
  assert.match(source, /DEFAULT_ARENA_MID_FOLLOW_Y: "arenaMidFollowY"/);
  assert.match(source, /DEFAULT_ARENA_MID_ZOOM: "arenaMidZoom"/);
  assert.match(source, /DEFAULT_ARENA_MID_LOOK_UP_Y: "arenaMidLookUpY"/);
  assert.match(source, /DEFAULT_ARENA_MID_ZOOM_DARKEN: "arenaMidZoomDarken"/);
  assert.match(source, /DEFAULT_ARENA_GROUND_FOLLOW_X: "arenaGroundFollowX"/);
  assert.match(source, /DEFAULT_ARENA_GROUND_FOLLOW_Y: "arenaGroundFollowY"/);
  assert.match(source, /DEFAULT_ARENA_GROUND_ZOOM: "arenaGroundZoom"/);
  assert.match(source, /DEFAULT_ARENA_GROUND_LOOK_UP_Y: "arenaGroundLookUpY"/);
  assert.doesNotMatch(source, /gridStep/);
  assert.match(source, /applyProdDefaultUpdates/);
});

test("vite dev middleware persists the default player HUD mode", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const settingsSource = readFileSync(join(root, "src", "settingsMenu.ts"), "utf8");

  assert.match(settingsSource, /DEFAULT_PLAYER_HUD_MODE: PlayerHudMode = "(?:immersive|classic)"/);
  assert.match(source, /settingsMenuUrl/);
  assert.match(source, /DEFAULT_PLAYER_HUD_MODE: "hudMode"/);
  assert.match(source, /pickPlayerSettingDefaultUpdates/);
  assert.match(source, /applyPlayerSettingDefaultUpdates/);
  assert.match(source, /readPlayerHudMode/);
  assert.match(source, /player setting defaults/);
});

test("save as prod defaults can persist armory background tuning", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(source, /armoryBackgroundOffsetX: "armoryBackgroundOffsetX"/);
  assert.match(source, /armoryBackgroundOffsetY: "armoryBackgroundOffsetY"/);
  assert.match(source, /armoryBackgroundScale: "armoryBackgroundScale"/);
  assert.match(debugTuningSource, /armoryBackgroundOffsetX: 0/);
  assert.match(debugTuningSource, /armoryBackgroundOffsetY: 0/);
  assert.match(debugTuningSource, /armoryBackgroundScale: 1/);
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

test("vite dev middleware updates generated shop item rarity stats and price", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /update-generated-shop-item/);
  assert.match(source, /pickGeneratedShopItemUpdate/);
  assert.match(source, /updateGeneratedShopItems/);
  assert.match(source, /updateGeneratedShopItemRecord/);
  assert.match(source, /formatUpdatedGeneratedShopItemMessage/);
  assert.match(source, /readNonEmptyStringArray/);
  assert.match(source, /targetIndex > 0 \? 0 : clampedStat/);
  assert.match(source, /armoryProduct: \{ \.\.\.record\.armoryProduct, price: update\.price \}/);
  assert.match(source, /weaponProduct: \{ \.\.\.record\.weaponProduct, price: update\.price \}/);
});

test("save as prod defaults also persists the selected rig editor animation", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const saveDefaultsRoute = source.slice(source.indexOf('"/__dust-arena/save-prod-defaults"'), source.indexOf('"/__dust-arena/save-prod-animation"'));

  assert.match(saveDefaultsRoute, /const bodyAnimationUpdates = pickBodyAnimationUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /applyBodyAnimationDefaultUpdates/);
  assert.match(saveDefaultsRoute, /bodyAnimationUpdates\.key/);
  assert.match(source, /"bowShot"/);
  assert.match(source, /"hit"/);
  assert.match(source, /"block"/);
  assert.match(source, /DEFAULT_BOW_SHOT_ANIMATION/);
  assert.match(source, /DEFAULT_HIT_ANIMATION/);
  assert.match(source, /DEFAULT_BLOCK_ANIMATION/);
});

test("save as prod defaults persists classic action button slots", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(debugTuningSource, /DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS/);
  assert.match(debugTuningSource, /classicActionButtonSlots: cloneClassicActionButtonSlots/);
  assert.match(source, /pickClassicActionButtonSlotDefaultUpdates/);
  assert.match(source, /applyClassicActionButtonSlotDefaultUpdates/);
  assert.match(source, /formatClassicActionButtonSlotDefaults/);
  assert.match(source, /classic action wheels/);
});

test("vite dev middleware converts promoted png equipment to standardized webp assets", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /import sharp from "sharp"/);
  assert.match(source, /await pickPromotedEquipmentItem/);
  assert.match(source, /ensureGeneratedEquipmentShopIcons\(promotedRecords\)/);
  assert.match(source, /preparePromotedEquipmentAsset\(sourcePath, lowSourcePath, \{ bakeFlipX: sourceEquipmentTuning\.flipX \}\)/);
  assert.match(source, /bakePromotedEquipmentTuning\(sourceEquipmentTuning\)/);
  assert.match(source, /bakePromotedEquipmentWebpAssetFlipX/);
  assert.match(source, /convertPromotedEquipmentPngAsset/);
  assert.match(source, /sourcePath\.endsWith\("\.png"\)/);
  assert.match(source, /options\.bakeFlipX \? await sharp\(source\)\.flop\(\)\.png\(\)\.toBuffer\(\) : source/);
  assert.match(source, /promotedEquipmentRuntimeWebpQuality = 86/);
  assert.match(source, /promotedEquipmentLowWebpQuality = 76/);
  assert.match(source, /promotedEquipmentLowMaxSide = 448/);
  assert.match(source, /promotedEquipmentShopIconSize = 160/);
  assert.match(source, /promotedEquipmentShopIconContentSize = 136/);
  assert.match(source, /createEquipmentShopIconWebp/);
  assert.match(source, /getVisibleAlphaBounds/);
  assert.match(source, /assets\/shop-icons\/\$\{assetKey\}\.webp/);
  assert.match(source, /readAssetSourcePath\(asset\.sourcePath, getEquipmentAssetSourcePrefix\(kind\), "asset\.sourcePath", \["\.png", "\.webp"\]\)/);
  assert.match(source, /getEquipmentAssetLowSourcePrefix\(kind\)/);
});

test("generated equipment shop icons exist as standardized square assets", async () => {
  const generatedRecords = JSON.parse(readFileSync(join(root, "src", "generated", "equipmentItems.generated.json"), "utf8"));

  for (const record of generatedRecords) {
    const iconPath = join(root, "src", "assets", "shop-icons", `${record.asset.key}.webp`);

    assert.equal(existsSync(iconPath), true, `Missing shop icon for ${record.asset.key}`);
    const metadata = await sharp(iconPath).metadata();

    assert.equal(metadata.width, 160, `Unexpected shop icon width for ${record.asset.key}`);
    assert.equal(metadata.height, 160, `Unexpected shop icon height for ${record.asset.key}`);
  }
});

test("vite dev middleware auto-generates mirrored armor pairs during promotion", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /promotedEquipmentMirrorPairs/);
  assert.match(source, /createPromotedEquipmentRecords/);
  assert.match(source, /createMirroredPromotedEquipmentRecord/);
  assert.match(source, /ensureMirroredPromotedEquipmentAssets/);
  assert.match(source, /mirrorPromotedEquipmentTuning/);
  assert.match(source, /x: -tuning\.x/);
  assert.match(source, /angle: -tuning\.angle/);
  assert.match(source, /flipX: false/);
  assert.match(source, /\.flop\(\)/);
  assert.match(source, /upsertGeneratedEquipmentRecords\(records, promotedRecords\)/);
  assert.match(source, /updated: promotedRecords\.length/);
  assert.match(source, /backShoulderguardAssetKey/);
  assert.match(source, /frontShoulderguardAssetKey/);
  assert.match(source, /backBootAssetKey/);
  assert.match(source, /frontBootAssetKey/);
});

test("vite dev middleware can promote weapon equipment into the weapon shop", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const generatedSource = readFileSync(join(root, "src", "generated", "equipmentItems.generated.ts"), "utf8");
  const weaponShopSource = readFileSync(join(root, "src", "weaponShopUi.ts"), "utf8");

  assert.match(source, /damageBonus/);
  assert.match(source, /weaponClass/);
  assert.match(source, /readWeaponClass/);
  assert.match(source, /getWeaponClassFromText/);
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
