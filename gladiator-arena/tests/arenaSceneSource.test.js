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

test("paper doll parents wrist equipment to forearms and glove equipment to hands", () => {
  const armArmorSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollArmArmorVisual"),
    arenaSceneSource.indexOf("function addPaperDollLegArmorVisual"),
  );

  assert.equal(arenaSceneSource.includes('backWrist: "backWristAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('frontWrist: "frontWristAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('backGlove: "backGloveAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('frontGlove: "frontGloveAssetKey"'), true);
  assert.match(armArmorSource, /key === "backForearm"[\s\S]*options\.backWristAssetKey, "backWrist"/);
  assert.match(armArmorSource, /key === "frontForearm"[\s\S]*options\.frontWristAssetKey, "frontWrist"/);
  assert.match(armArmorSource, /key === "backHand"[\s\S]*options\.backGloveAssetKey, "backGlove"/);
  assert.match(armArmorSource, /key === "frontHand"[\s\S]*options\.frontGloveAssetKey, "frontGlove"/);
  assert.equal(arenaSceneSource.includes("image = createPaperDollEquipmentImage(slotContainer.scene, textureKey, config);"), true);
});

test("paper doll draws equipment through a top overlay anchored to body parts", () => {
  assert.equal(arenaSceneSource.includes("type PaperDollEquipmentAnchors"), true);
  assert.equal(arenaSceneSource.includes("const equipmentLayer = target.add.container(0, 0);"), true);
  assert.equal(arenaSceneSource.includes("rootContainer.add(equipmentLayer);"), true);
  assert.equal(arenaSceneSource.includes("PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS"), true);
  assert.equal(arenaSceneSource.includes("createPaperDollAnchoredEquipmentContainer"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollEquipmentAnchors(rig);"), true);
  assert.equal(arenaSceneSource.includes("equipmentLayer.add(anchorContainer);"), true);
  assert.equal(arenaSceneSource.includes("partContainer.add(armorContainer);"), false);
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

test("low effects can hot swap paper doll textures after preload", () => {
  assert.equal(arenaSceneSource.includes("function ensurePaperDollAssetResolution("), true);
  assert.equal(arenaSceneSource.includes("target.load.start();"), true);
  assert.equal(arenaSceneSource.includes("syncFighterPaperDollTextureResolution"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollBodyPartImage"), true);
  assert.equal(arenaSceneSource.includes("activePaperDollAssetsUseLowRes = lowRes;"), true);
});

test("arena action turns can wait for animation completion", () => {
  assert.equal(arenaSceneSource.includes("sync(nextState: CombatState): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("const actionAnimations: Promise<void>[] = []"), true);
  assert.equal(arenaSceneSource.includes("actionAnimations.push(animateAction"), true);
  assert.equal(arenaSceneSource.includes("return Promise.all(actionAnimations).then(() => undefined);"), true);
  assert.equal(arenaSceneSource.includes("function playBodyAnimationOnce"), true);
  assert.equal(arenaSceneSource.includes("): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("function animateAction("), true);
});

test("arena starts close between fighters and eases back to the normal camera", () => {
  assert.equal(arenaSceneSource.includes('type ArenaEntryTransitionState = "pending" | "running" | "done"'), true);
  assert.equal(arenaSceneSource.includes("ARENA_ENTRY_START_ZOOM_MULTIPLIER"), true);
  assert.equal(arenaSceneSource.includes("private startArenaEntryTransition(current: CombatState): Promise<void> | undefined"), true);
  assert.equal(arenaSceneSource.includes("getArenaEntryStartCameraTarget(finalTarget)"), true);
  assert.equal(arenaSceneSource.includes("tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS"), true);
  assert.equal(arenaSceneSource.includes('target.arenaEntryTransitionState === "running"'), true);
});

test("city shop camera zoom fits the hero inside the current viewport", () => {
  assert.equal(arenaSceneSource.includes("CITY_CAMERA_SHOP_MAX_SCREEN_HEIGHT_RATIO"), true);
  assert.equal(arenaSceneSource.includes("CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO"), true);
  assert.equal(arenaSceneSource.includes("private getShopCameraZoom(layout: CityHeroLayout): number"), true);
  assert.equal(arenaSceneSource.includes("const shopZoom = this.getShopCameraZoom(layout);"), true);
  assert.equal(arenaSceneSource.includes("camera.zoomTo(shopZoom"), true);
});

test("debug character viewer has a compact shop preview mode", () => {
  assert.equal(arenaSceneSource.includes('mode?: "debug" | "shop"'), true);
  assert.equal(arenaSceneSource.includes('this.viewerMode === "shop"'), true);
  assert.equal(arenaSceneSource.includes("private getShopCharacterLayout(): CityHeroLayout"), true);
  assert.equal(arenaSceneSource.includes("Phaser.Scale.RESIZE"), true);
});

test("city shop hero can be dragged vertically without changing city base layout", () => {
  assert.equal(arenaSceneSource.includes("getShopHeroOffsetY"), true);
  assert.equal(arenaSceneSource.includes("setShopHeroOffsetY(getShopHeroOffsetY() + deltaY)"), true);
  assert.equal(arenaSceneSource.includes("enableCityShopHeroDrag"), true);
  assert.equal(arenaSceneSource.includes("private beginShopHeroDrag"), true);
  assert.equal(arenaSceneSource.includes("private dragShopHero"), true);
  assert.match(arenaSceneSource, /shopOffsetY \/ shopZoom/);
  assert.doesNotMatch(arenaSceneSource, /debugTuning\.cityHeroY\s*=/);
});

test("city scene can zoom the background camera into the coliseum for arena entry", () => {
  assert.equal(arenaSceneSource.includes('type CityCameraMode = "default" | "armory" | "weaponShop" | "arena"'), true);
  assert.equal(arenaSceneSource.includes("focusArenaTransition: () => Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("CITY_ARENA_FOCUS_X_RATIO"), true);
  assert.equal(arenaSceneSource.includes("CITY_ARENA_FOCUS_Y_RATIO"), true);
  assert.equal(arenaSceneSource.includes("CITY_ARENA_TRANSITION_ZOOM"), true);
  assert.equal(arenaSceneSource.includes("focusArenaTransition(): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("private tweenArenaCameraToColiseum(): Promise<void>"), true);
  assert.match(arenaSceneSource, /targets: camera[\s\S]*zoom[\s\S]*scrollX[\s\S]*scrollY/);
});

test("arena entry can prewarm arena image assets through the browser cache", () => {
  assert.equal(arenaSceneSource.includes("export function prewarmArenaAssetsForBrowserCache(): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("arenaAssetPrewarmPromise ??="), true);
  assert.equal(arenaSceneSource.includes("function getArenaAssetPrewarmUrls(): string[]"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_BACK_LAYER_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_MID_LAYER_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL"), true);
  assert.match(arenaSceneSource, /const image = new Image\(\)/);
  assert.match(arenaSceneSource, /image\.src = url/);
});
