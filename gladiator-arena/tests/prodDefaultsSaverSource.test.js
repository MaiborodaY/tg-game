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

test("client saver can promote full equipment sets through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/promote-equipment-set/);
  assert.match(source, /PromoteEquipmentSetPayload/);
  assert.match(source, /savePromotedEquipmentSet/);
  assert.match(source, /JSON\.stringify\(payload\)/);
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

test("client saver can update generated boss items through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/update-generated-boss-item/);
  assert.match(source, /UpdateGeneratedBossItemPayload/);
  assert.match(source, /saveGeneratedBossItem/);
  assert.match(source, /JSON\.stringify\(payload\)/);
});

test("client saver can save generated arena bosses through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/save-arena-boss/);
  assert.match(source, /saveArenaBoss/);
  assert.match(source, /ArenaBossDefinition/);
  assert.match(source, /JSON\.stringify\(payload\)/);
});

test("client saver can save generated arena tiers through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/save-arena-tier/);
  assert.match(source, /saveArenaTier/);
  assert.match(source, /ArenaTierConfig/);
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
  assert.match(source, /levelRequirement\?: number/);
  assert.match(source, /generatedEquipmentMaxArmorHp/);
  assert.match(source, /generatedEquipmentMaxPrice/);
  assert.match(source, /validateGeneratedEquipmentLevelRequirement/);
  assert.match(source, /record\.levelRequirement !== undefined/);
  assert.match(source, /levelRequirement !== undefined/);
});

test("vite dev middleware removes generated equipment records and asset files", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /remove-equipment-item/);
  assert.match(source, /pickGeneratedEquipmentRemovalId/);
  assert.match(source, /removeGeneratedEquipmentItems/);
  assert.match(source, /getLinkedGeneratedEquipmentRemovalRecords/);
  assert.match(source, /findGeneratedEquipmentMirrorCounterpart/);
  assert.match(source, /removeGeneratedEquipmentAssetFiles/);
  assert.match(source, /formatRemovedGeneratedEquipmentMessage/);
  assert.match(source, /rm\(getProjectSourceUrl\(sourcePath\), \{ force: true \}\)/);
  assert.doesNotMatch(source, /Only generated equipment items can be removed/);
  assert.doesNotMatch(source, /itemId\.startsWith\("generated_equipment_"\)/);
  assert.match(source, /updated: removedItems\.length/);
});

test("vite dev middleware renames raw equipment set assets", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const prodDefaultsSaverSource = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");
  const registrySource = readFileSync(join(root, "src", "equipmentAssetRegistry.ts"), "utf8");

  assert.match(prodDefaultsSaverSource, /rename-equipment-set-assets/);
  assert.match(prodDefaultsSaverSource, /RenameEquipmentSetAssetsPayload/);
  assert.match(prodDefaultsSaverSource, /renameEquipmentSetAssets/);
  assert.match(registrySource, /AUTO_EQUIPMENT_SET_IMPORT_ASSETS/);
  assert.match(registrySource, /assets\/equipment-import\/armor/);
  assert.match(registrySource, /assets\/equipment-import\/weapons/);
  assert.match(registrySource, /createEquipmentSetImportAssetEntries/);
  assert.match(source, /rename-equipment-set-assets/);
  assert.match(source, /equipmentSetImportTargetConfigs/);
  assert.match(source, /pickEquipmentSetImportEntries/);
  assert.match(source, /renameEquipmentSetImportAssets/);
  assert.match(source, /readEquipmentSetImportSourcePath/);
  assert.match(source, /isEquipmentImportSourcePath/);
  assert.match(source, /assets\/equipment-import\/armor/);
  assert.match(source, /assets\/equipment-import\/weapons/);
  assert.match(source, /assertEquipmentSetImportPathsAvailable/);
  assert.match(source, /renameProjectSourceFile/);
  assert.match(source, /Target asset already exists/);
});

test("vite dev middleware promotes raw equipment sets into generated items", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /promote-equipment-set/);
  assert.match(source, /pickPromotedEquipmentSet/);
  assert.match(source, /createPromotedEquipmentSetRecords/);
  assert.match(source, /createPromotedEquipmentSetInfo/);
  assert.match(source, /createPromotedEquipmentSetRecord/);
  assert.match(source, /renameEquipmentSetImportAssets\(promotion\.entries\)/);
  assert.match(source, /equipmentSet: promotedItem\.equipmentSet/);
  assert.match(source, /createPromotedEquipmentRecords\(record, true\)/);
  assert.match(source, /formatPromotedEquipmentSetMessage/);
  assert.match(source, /getEquipmentSetImportTargetConfig/);
  assert.match(source, /getArmorCategoryFromAssetKey/);
  assert.match(source, /createDefaultPromotedEquipmentTuning/);
  assert.match(source, /price: 0/);
  assert.match(source, /armorHp: 1/);
  assert.match(source, /damageBonus: 1/);
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
  assert.match(source, /value === "mythical"/);
});

test("vite dev middleware updates generated boss item stats", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /update-generated-boss-item/);
  assert.match(source, /pickGeneratedBossItemUpdate/);
  assert.match(source, /updateGeneratedBossItem/);
  assert.match(source, /isGeneratedBossItemRecord/);
  assert.match(source, /updateGeneratedBossItemRecord/);
  assert.match(source, /formatUpdatedGeneratedBossItemMessage/);
  assert.match(source, /readNonEmptyStringArray/);
  assert.match(source, /Only generated boss items can be edited/);
  assert.match(source, /record\.availability\?\.bossUnique === true \|\| record\.rarity === "unique"/);
  assert.match(source, /targetIndex > 0 \? 0 : clampedStat/);
  assert.match(source, /updatedRecords\.length/);
});

test("vite dev middleware writes generated arena bosses", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const generatedBossSource = readFileSync(join(root, "src", "generated", "arenaBosses.generated.ts"), "utf8");
  const generatedBossJson = readFileSync(join(root, "src", "generated", "arenaBosses.generated.json"), "utf8");

  assert.match(source, /save-arena-boss/);
  assert.match(source, /generatedArenaBossesJsonUrl/);
  assert.match(source, /generatedArenaBossesTsUrl/);
  assert.match(source, /validateArenaBossRecord/);
  assert.match(source, /writeGeneratedArenaBossRecords/);
  assert.match(source, /formatGeneratedArenaBossesSource/);
  assert.match(source, /upsertGeneratedArenaBossRecords/);
  assert.match(generatedBossSource, /GENERATED_ARENA_BOSSES/);
  assert.match(generatedBossJson, /dust_arena_champion/);
});

test("vite dev middleware writes generated arena tiers", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const generatedTierSource = readFileSync(join(root, "src", "generated", "arenaTiers.generated.ts"), "utf8");
  const generatedTierJson = readFileSync(join(root, "src", "generated", "arenaTiers.generated.json"), "utf8");

  assert.match(source, /save-arena-tier/);
  assert.match(source, /generatedArenaTiersJsonUrl/);
  assert.match(source, /generatedArenaTiersTsUrl/);
  assert.match(source, /validateArenaTierRecord/);
  assert.match(source, /writeGeneratedArenaTierRecords/);
  assert.match(source, /formatGeneratedArenaTiersSource/);
  assert.match(source, /upsertGeneratedArenaTierRecords/);
  assert.match(generatedTierSource, /GENERATED_ARENA_TIERS/);
  assert.match(generatedTierJson, /dust_arena_brawler/);
});

test("save as prod defaults also persists the selected rig editor animation", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const saveDefaultsRoute = source.slice(source.indexOf('"/__dust-arena/save-prod-defaults"'), source.indexOf('"/__dust-arena/save-prod-animation"'));
  const pickBodyAnimationSource = source.slice(source.indexOf("export function pickBodyAnimationUpdates"), source.indexOf("function readActiveBodyAnimationMap"));

  assert.match(saveDefaultsRoute, /const bodyAnimationUpdates = pickBodyAnimationUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /applyBodyAnimationDefaultUpdates/);
  assert.match(saveDefaultsRoute, /bodyAnimationUpdates\.key/);
  assert.match(pickBodyAnimationSource, /const bodyAnimations = readActiveBodyAnimationMap\(payload\)/);
  assert.doesNotMatch(pickBodyAnimationSource, /\(payload as \{ bodyAnimations\?: unknown \}\)\.bodyAnimations/);
  assert.match(source, /"bowShot"/);
  assert.match(source, /"hit"/);
  assert.match(source, /"block"/);
  assert.match(source, /DEFAULT_BOW_SHOT_ANIMATION/);
  assert.match(source, /DEFAULT_HIT_ANIMATION/);
  assert.match(source, /DEFAULT_BLOCK_ANIMATION/);
});

test("save as prod defaults persists body art layers per body preset", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");
  const saveDefaultsRoute = source.slice(source.indexOf('"/__dust-arena/save-prod-defaults"'), source.indexOf('"/__dust-arena/save-prod-animation"'));
  const bodyPresetFormatter = source.slice(source.indexOf("function formatBodyPresetTuningDefaults"), source.indexOf("function formatBodyPartLayerObject"));
  const pickAppearanceLayerSource = source.slice(
    source.indexOf("export function pickBodyPresetAppearanceLayerDefaultUpdates"),
    source.indexOf("export function applyFacePartDefaultUpdates"),
  );
  const pickFacePartSource = source.slice(source.indexOf("export function pickFacePartDefaultUpdates"), source.indexOf("export function applyEquipmentDefaultUpdates"));

  assert.match(debugTuningSource, /bodyPartLayers: Record<RigPartKey, BodyPartLayerTuning>/);
  assert.match(debugTuningSource, /appearanceLayers: Record<AppearanceLayerKey, AppearanceLayerTuning>/);
  assert.match(source, /const bodyPresetKeys = \["classic", "dummy-v2"\] as const/);
  assert.match(source, /const appearanceLayerKeys = \["hair", "beard"\] as const/);
  assert.match(saveDefaultsRoute, /const bodyPartLayerUpdates = pickBodyPartLayerDefaultUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /const bodyPresetAnimationUpdates = pickBodyPresetAnimationDefaultUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /const bodyPresetFacePartUpdates = pickBodyPresetFacePartDefaultUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /const bodyPresetFaceAssetLayerUpdates = pickBodyPresetFaceAssetLayerDefaultUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /const bodyPresetAppearanceLayerUpdates = pickBodyPresetAppearanceLayerDefaultUpdates\(payload\)/);
  assert.match(saveDefaultsRoute, /applyBodyPartLayerDefaultUpdates\(\s*nextDebugTuningSource,\s*bodyPartLayerUpdates,\s*bodyPresetAnimationUpdates,\s*bodyPresetFacePartUpdates,\s*bodyPresetFaceAssetLayerUpdates,\s*bodyPresetAppearanceLayerUpdates,\s*\)/);
  assert.match(saveDefaultsRoute, /body art presets/);
  assert.match(source, /DEFAULT_BODY_PRESET_TUNING/);
  assert.match(source, /formatBodyPresetTuningDefaults/);
  assert.match(source, /formatBodyPartLayerObject/);
  assert.match(source, /pickBodyPresetAnimationDefaultUpdates/);
  assert.match(source, /pickBodyPresetFacePartDefaultUpdates/);
  assert.match(source, /pickBodyPresetFaceAssetLayerDefaultUpdates/);
  assert.match(source, /pickBodyPresetAppearanceLayerDefaultUpdates/);
  assert.match(pickAppearanceLayerSource, /const appearanceLayers = readBodyPresetAppearanceLayerMap\(bodyPresetTuning, presetKey\)/);
  assert.match(pickAppearanceLayerSource, /appearanceLayerKeys\.map\(\(key\) => \[key, readAppearanceLayerTuning\(appearanceLayers, key\)\]\)/);
  assert.match(pickFacePartSource, /const faceParts = readActiveFacePartMap\(payload\)/);
  assert.doesNotMatch(pickFacePartSource, /\(payload as \{ faceParts\?: unknown \}\)\.faceParts/);
  assert.match(bodyPresetFormatter, /faceParts: \$\{formatFacePartObject\(bodyPresetFacePartUpdates\[presetKey\]/);
  assert.match(bodyPresetFormatter, /faceAssetLayers: \$\{formatFaceAssetLayerObject\(bodyPresetFaceAssetLayerUpdates\[presetKey\]/);
  assert.match(bodyPresetFormatter, /appearanceLayers: \$\{formatAppearanceLayerObject\(bodyPresetAppearanceLayerUpdates\[presetKey\]/);
  assert.doesNotMatch(bodyPresetFormatter, /faceParts: cloneFaceParts\(DEFAULT_FACE_PARTS\)/);
  assert.doesNotMatch(bodyPresetFormatter, /faceAssetLayers: cloneFaceAssetLayers\(DEFAULT_FACE_ASSET_LAYERS\)/);
  assert.doesNotMatch(bodyPresetFormatter, /appearanceLayers: cloneAppearanceLayers\(DEFAULT_APPEARANCE_LAYERS\)/);
  assert.match(bodyPresetFormatter, /bodyAnimations: \$\{formatBodyAnimationMap\(bodyAnimationUpdates\[presetKey\]/);
  assert.doesNotMatch(bodyPresetFormatter, /bodyAnimations: cloneBodyAnimations\(DEFAULT_BODY_ANIMATIONS\)/);
});

test("save as prod defaults persists classic action button slots", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(debugTuningSource, /DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS/);
  assert.match(debugTuningSource, /switchWeapon: \{ x: -145, y: -200, rotation: -14 \}/);
  assert.match(debugTuningSource, /shuriken: \{ x: 100, y: -148, rotation: 12 \}/);
  assert.match(debugTuningSource, /switchWeapon: \{ x: -145, y: -200, rotation: 0 \}/);
  assert.match(debugTuningSource, /shuriken: \{ x: 95, y: -118, rotation: 10 \}/);
  assert.match(debugTuningSource, /classicActionButtonSlots: cloneClassicActionButtonSlots/);
  assert.match(source, /const classicActionButtonSlotKeys = \["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "taunt", "rest"\] as const/);
  assert.match(source, /pickClassicActionButtonSlotDefaultUpdates/);
  assert.match(source, /applyClassicActionButtonSlotDefaultUpdates/);
  assert.match(source, /formatClassicActionButtonSlotDefaults/);
  assert.match(source, /const slots = classicActionButtonSlotKeys/);
  assert.match(source, /classicActionButtonSlotKeys\.map\(\(key\) => \[key, readClassicActionButtonSlotTuning\(modeSlots, mode, key\)\]\)/);
  assert.match(source, /classic action wheels/);
});

test("vite dev middleware converts promoted png equipment to standardized webp assets", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /import sharp from "sharp"/);
  assert.match(source, /await pickPromotedEquipmentItem/);
  assert.match(source, /ensureGeneratedEquipmentShopIcons\(promotedRecords\)/);
  assert.match(source, /const mirrorPairFlipX = sourceEquipmentTuning\.flipX/);
  assert.match(source, /const equipmentTuning = \{ \.\.\.sourceEquipmentTuning, flipX: false \}/);
  assert.match(source, /preparePromotedEquipmentAsset\(sourcePath, lowSourcePath\)/);
  assert.doesNotMatch(source, /bakePromotedEquipmentTuning/);
  assert.doesNotMatch(source, /bakePromotedEquipmentWebpAssetFlipX/);
  assert.match(source, /convertPromotedEquipmentPngAsset/);
  assert.match(source, /sourcePath\.endsWith\("\.png"\)/);
  assert.match(source, /const runtime = await createEquipmentWebp\(source,/);
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
  const mirrorAssetsSource = source.slice(
    source.indexOf("async function ensureMirroredPromotedEquipmentAssets"),
    source.indexOf("async function writeMirroredPromotedEquipmentWebpAsset"),
  );

  assert.match(source, /promotedEquipmentMirrorPairs/);
  assert.match(source, /createPromotedEquipmentRecords/);
  assert.match(source, /createMirroredPromotedEquipmentRecord/);
  assert.match(source, /ensureMirroredPromotedEquipmentAssets/);
  assert.match(source, /mirrorPromotedEquipmentTuning/);
  assert.match(source, /x: -tuning\.x/);
  assert.match(source, /angle: -tuning\.angle/);
  assert.match(source, /flipX: false/);
  assert.match(source, /\.flop\(\)/);
  assert.match(source, /mirrorPairFlipX: boolean/);
  assert.match(source, /if \(!mirrorPairFlipX\) \{/);
  assert.match(source, /copyPromotedEquipmentWebpAsset\(sourcePath, targetPath\)/);
  assert.match(source, /promotedItem\.armorHp !== undefined \? \{ armorHp: 0 \}/);
  assert.doesNotMatch(source, /hasGeneratedEquipmentMirrorCounterpart/);
  assert.doesNotMatch(mirrorAssetsSource, /projectSourceFileExists/);
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
  assert.match(source, /value === "mace"/);
  assert.match(source, /value === "spear"/);
  assert.match(source, /value === "shuriken"/);
  assert.match(source, /return "maces"/);
  assert.match(source, /return "spears"/);
  assert.match(source, /return "shurikens"/);
  assert.match(source, /getEquipmentAssetSourcePrefix\(kind\)/);
  assert.match(source, /assets\/fighters\/weapons\//);
  assert.match(source, /weaponProduct/);
  assert.match(source, /getWeaponCategoryId/);
  assert.match(source, /Promoted weapon item must use weaponMain or weaponBow slot/);
  assert.match(generatedSource, /GeneratedWeaponProduct/);
  assert.match(generatedSource, /GENERATED_WEAPON_PRODUCTS/);
  assert.match(weaponShopSource, /GENERATED_WEAPON_PRODUCTS/);
  assert.match(weaponShopSource, /getGeneratedWeaponProducts/);
});

test("debug weapon importer promotes staged weapons with per-asset values", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const saverSource = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");
  const debugPanelSource = readFileSync(join(root, "src", "debugPanel.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/promote-weapon-imports/);
  assert.match(source, /pickPromotedWeaponImportEntries/);
  assert.match(source, /readWeaponImportSourcePath/);
  assert.match(source, /assets\/equipment-import\/weapons\//);
  assert.match(source, /getWeaponImportAssetKey/);
  assert.match(source, /writePromotedWeaponImportAsset/);
  assert.match(source, /removePromotedWeaponImportSourceFiles/);
  assert.match(source, /weaponClass === "bow" \? "weaponBow" : "weaponMain"/);
  assert.match(source, /weaponClass === "bow" \? "weaponBowAssetKey" : "weaponMainAssetKey"/);
  assert.match(source, /function createDefaultPromotedWeaponTuning\(\)/);
  assert.match(source, /\.\.\.createDefaultPromotedEquipmentTuning\(\),\s*y: 16,\s*angle: 90,/);
  assert.match(source, /damageBonus: entry\.damageBonus/);
  assert.match(source, /price: entry\.price/);
  assert.match(saverSource, /savePromotedWeaponImports/);
  assert.match(saverSource, /promoteWeaponImportsEndpoint = "\/__dust-arena\/promote-weapon-imports"/);
  assert.match(debugPanelSource, /debug-auto-equipment__weapon-importer/);
  assert.match(debugPanelSource, /savePromotedWeaponImports\(\{ entries \}\)/);
});

test("debug shield importer promotes staged shields without equipment sets", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const saverSource = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");
  const debugPanelSource = readFileSync(join(root, "src", "debugPanel.ts"), "utf8");
  const shieldRecordSource = source.slice(
    source.indexOf("function createPromotedShieldImportRecord"),
    source.indexOf("async function assertWeaponImportPathsAvailable"),
  );

  assert.match(source, /\/__dust-arena\/promote-shield-imports/);
  assert.match(source, /pickPromotedShieldImportEntries/);
  assert.match(source, /readShieldImportSourcePath/);
  assert.match(source, /assets\/equipment-import\/armor\//);
  assert.match(source, /assetKey\.startsWith\("shield-"\)/);
  assert.match(source, /assets\/fighters\/armor\/arms\/\$\{assetKey\}\.webp/);
  assert.match(source, /writePromotedShieldImportAssets/);
  assert.match(source, /removePromotedShieldImportSourceFiles/);
  assert.match(shieldRecordSource, /equipmentSlot: "shield"/);
  assert.match(shieldRecordSource, /assetKeys: \{ shieldAssetKey: entry\.assetKey \}/);
  assert.doesNotMatch(shieldRecordSource, /equipmentSet/);
  assert.match(saverSource, /savePromotedShieldImports/);
  assert.match(saverSource, /promoteShieldImportsEndpoint = "\/__dust-arena\/promote-shield-imports"/);
  assert.match(debugPanelSource, /debug-auto-equipment__shield-importer/);
  assert.match(debugPanelSource, /getShieldImportAssets/);
  assert.match(debugPanelSource, /savePromotedShieldImports\(\{ entries \}\)/);
});

test("vite dev middleware can persist item-specific equipment defaults", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(debugTuningSource, /DEFAULT_EQUIPMENT_ITEM_TUNING/);
  assert.match(debugTuningSource, /equipmentItems: cloneEquipmentItems/);
  assert.match(source, /pickEquipmentItemDefaultUpdates/);
  assert.match(source, /pickEquipmentItemDefaultUpdates\(payload, generatedEquipmentItemIds\)/);
  assert.match(source, /excludedItemIds\.has\(itemId\)/);
  assert.match(source, /pickGeneratedEquipmentItemTuningUpdates\(payload, generatedEquipmentItemIds\)/);
  assert.match(source, /applyGeneratedEquipmentItemTuningUpdates/);
  assert.match(source, /writeGeneratedEquipmentRecords\(nextGeneratedEquipmentRecords\)/);
  assert.match(source, /!generatedEquipmentItemIds\.has\(itemId\)/);
  assert.match(source, /generated equipment item defaults/);
  assert.match(source, /applyEquipmentItemDefaultUpdates/);
  assert.match(source, /DEFAULT_EQUIPMENT_ITEM_TUNING/);
  assert.doesNotMatch(debugTuningSource, /"generated_equipment_front_greave_cloth_01":/);
});

test("generated armor pair stats stay absolute instead of doubling front and back", () => {
  const generatedRecords = JSON.parse(readFileSync(join(root, "src", "generated", "equipmentItems.generated.json"), "utf8"));
  const frontPairRecords = generatedRecords.filter((record) => record.kind === "armor" && record.equipmentSlot.startsWith("front"));

  assert.ok(frontPairRecords.length > 0);
  frontPairRecords.forEach((record) => {
    assert.equal(record.armorHp, 0, `${record.id} should not duplicate paired armor`);
  });
});

test("vite dev middleware whitelists wrist glove and shield equipment slots for prod saves and promotion", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");
  const debugTuningSource = readFileSync(join(root, "src", "debugTuning.ts"), "utf8");

  assert.match(source, /"backWrist"/);
  assert.match(source, /"frontWrist"/);
  assert.match(source, /"backGlove"/);
  assert.match(source, /"frontGlove"/);
  assert.match(source, /"shield"/);
  assert.match(source, /slotKey === "backWrist"/);
  assert.match(source, /slotKey === "frontWrist"/);
  assert.match(source, /slotKey === "backGlove"/);
  assert.match(source, /slotKey === "frontGlove"/);
  assert.match(source, /slotKey === "shield"/);
  assert.match(debugTuningSource, /backWrist:/);
  assert.match(debugTuningSource, /frontWrist:/);
  assert.match(debugTuningSource, /backGlove:/);
  assert.match(debugTuningSource, /frontGlove:/);
  assert.match(debugTuningSource, /shield:/);
});
