import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

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

test("paper doll draws equipment through ordered anchored layers", () => {
  assert.equal(arenaSceneSource.includes("type PaperDollEquipmentAnchors"), true);
  assert.equal(arenaSceneSource.includes('type PaperDollEquipmentLayerKey = "legs" | "torso" | "head" | "weapon" | "arms" | "weaponTop";'), true);
  assert.equal(arenaSceneSource.includes("const equipmentLayers = createPaperDollEquipmentLayers(target);"), true);
  assert.equal(arenaSceneSource.includes("addPaperDollEquipmentLayersAfterPart(rootContainer, key, equipmentLayers);"), true);
  assert.equal(arenaSceneSource.includes('partKey === "frontForearm"'), true);
  assert.equal(arenaSceneSource.includes("rootContainer.add(layers.weapon);"), true);
  assert.equal(arenaSceneSource.includes('partKey === "frontHand"'), true);
  assert.equal(arenaSceneSource.includes("rootContainer.add(layers.arms);"), true);
  assert.equal(arenaSceneSource.includes("rootContainer.add(layers.weaponTop);"), true);
  assert.equal(arenaSceneSource.includes('slotKey === "weaponMain"'), true);
  assert.equal(arenaSceneSource.includes("return layers.weapon;"), true);
  assert.equal(arenaSceneSource.includes('slotKey === "breastplate"'), true);
  assert.equal(arenaSceneSource.includes("return layers.torso;"), true);
  assert.equal(arenaSceneSource.includes("PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS"), true);
  assert.equal(arenaSceneSource.includes("createPaperDollAnchoredEquipmentContainer"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollEquipmentAnchors(rig);"), true);
  assert.equal(arenaSceneSource.includes("equipmentLayer.add(anchorContainer);"), true);
  assert.equal(arenaSceneSource.includes("partContainer.add(armorContainer);"), false);
});

test("paper doll weapon top overlay keeps long weapon heads above gloves", () => {
  assert.equal(arenaSceneSource.includes("WEAPON_MAIN_TOP_OVERLAY_CROP_RATIO"), true);
  assert.equal(arenaSceneSource.includes("WEAPON_BOW_TOP_OVERLAY_CROP_RATIO"), true);
  assert.equal(arenaSceneSource.includes("WEAPON_BOW_BOTTOM_OVERLAY_CROP_RATIO"), true);
  assert.equal(arenaSceneSource.includes("const paperDollLinkedEquipmentAnchors = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("const paperDollLinkedEquipmentSlots = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("const paperDollWeaponOverlayCrops = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("layer: equipmentLayers.weaponTop"), true);
  assert.equal(arenaSceneSource.includes('"bowBottom"'), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollWeaponTopOverlayCrop(topImage, effectiveCrop);"), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollWeaponTopOverlayCrop(image, getPaperDollWeaponOverlayCrop(linkedSlot, textureKey));"), true);
  assert.equal(arenaSceneSource.includes('assetKey.includes("weapon-bow")'), true);
  assert.equal(arenaSceneSource.includes("visible && isPaperDollWeaponOverlayVisible(linkedSlot)"), true);
  assert.equal(arenaSceneSource.includes("getLinkedPaperDollEquipmentSlots(part).forEach"), true);
  assert.equal(arenaSceneSource.includes("paperDollLinkedEquipmentAnchors.get(anchor)"), true);
});

test("paper doll high shadow hides armor equipment and face overlays", () => {
  assert.equal(arenaSceneSource.includes("function syncPaperDollShadowSilhouette("), true);
  assert.equal(arenaSceneSource.includes("function addPaperDollShadowPartVisual("), false);
  assert.equal(arenaSceneSource.includes("function drawPaperDollShadowPart("), false);
  assert.equal(arenaSceneSource.includes("eyeLeftCover?: FighterPart;"), true);
  assert.equal(arenaSceneSource.includes("faceParts.eyeLeftCover = part(leftCover);"), true);
  assert.equal(arenaSceneSource.includes("faceParts.eyeRightCover = part(rightCover);"), true);
  assert.equal(arenaSceneSource.includes("Object.values(shadow.faceParts).forEach((facePart) => facePart?.setVisible(false));"), true);
  assert.equal(arenaSceneSource.includes('slotKey === "weaponMain" && Boolean(visibility?.[slotKey])'), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollShadowSilhouette(rig.shadow, visibility);"), true);
  assert.doesNotMatch(arenaSceneSource, /rig\.shadow\?\.equipment\[slotKey\]\?\.setVisible\(visibility\[slotKey\]\)/);
});

test("paper doll high shadow can use a cached blur filter", () => {
  assert.equal(arenaSceneSource.includes("const paperDollShadowBlurFilters = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("function applyPaperDollShadowBlur("), true);
  assert.equal(arenaSceneSource.includes("filters.addBlur("), true);
  assert.equal(arenaSceneSource.includes("filters.remove(currentFilter, true);"), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollShadowBlur(fighter.shadow);"), true);
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

test("debug equipment drag uses the equipment anchor local space", () => {
  const equipmentDragSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("private dragEquipment"),
    arenaSceneSource.indexOf("private endRigPartDrag"),
  );

  assert.equal(arenaSceneSource.includes("lastPointerLocalX"), true);
  assert.equal(arenaSceneSource.includes("getEquipmentDragPointerLocalPoint"), true);
  assert.equal(arenaSceneSource.includes("getPaperDollEquipmentDragLocalPoint"), true);
  assert.equal(arenaSceneSource.includes("getPaperDollEquipmentSlotParent"), true);
  assert.equal(arenaSceneSource.includes("parentContainer"), true);
  assert.equal(arenaSceneSource.includes("parent.getWorldTransformMatrix().applyInverse(worldX, worldY)"), true);
  assert.equal(equipmentDragSource.includes("x: deltaX / scaleX"), false);
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

test("bow attacks and damage reactions use dedicated body animations", () => {
  assert.equal(arenaSceneSource.includes('type HeroWeaponClass'), true);
  assert.equal(arenaSceneSource.includes('weaponClass === "bow" ? "bowShot" : actionId'), true);
  assert.equal(arenaSceneSource.includes('weaponClass !== "bow" && areArenaVfxEnabled()'), true);
  assert.equal(arenaSceneSource.includes('getActiveBodyAnimation("hit")'), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerDamage > 0"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyDamage > 0"), true);
});

test("arena starts close between fighters and eases back to the normal camera", () => {
  assert.equal(arenaSceneSource.includes('type ArenaEntryTransitionState = "pending" | "running" | "done"'), true);
  assert.equal(arenaSceneSource.includes("ARENA_ENTRY_START_ZOOM_MULTIPLIER"), true);
  assert.equal(arenaSceneSource.includes("private startArenaEntryTransition(current: CombatState): Promise<void> | undefined"), true);
  assert.equal(arenaSceneSource.includes("getArenaEntryStartCameraTarget(finalTarget)"), true);
  assert.equal(arenaSceneSource.includes("tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS"), true);
  assert.equal(arenaSceneSource.includes('target.arenaEntryTransitionState === "running"'), true);
});

test("arena parallax can be tuned from debug settings", () => {
  assert.equal(arenaSceneSource.includes("function getArenaLayerParallax(tuning?: ArenaDebugTuning)"), true);
  assert.equal(arenaSceneSource.includes("tuning?.arenaBackFollowY"), true);
  assert.equal(arenaSceneSource.includes("tuning?.arenaMidLookUpY"), true);
  assert.equal(arenaSceneSource.includes("tuning?.arenaGroundZoom"), true);
  assert.equal(arenaSceneSource.includes("getArenaLayerTransforms(layers, cameraTarget, debug)"), true);
  assert.equal(arenaSceneSource.includes("tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS, ARENA_ENTRY_TRANSITION_EASE, debug)"), true);
  assert.equal(arenaSceneSource.includes("arenaMidZoomDarken"), true);
  assert.equal(arenaSceneSource.includes("syncArenaMidLayerTint"), true);
  assert.equal(arenaSceneSource.includes("ARENA_MID_LAYER_CLOSE_TINT"), true);
});

test("city shop camera zoom fits the hero inside the current viewport", () => {
  assert.equal(arenaSceneSource.includes("CITY_CAMERA_SHOP_MAX_AVAILABLE_HEIGHT_RATIO"), true);
  assert.equal(arenaSceneSource.includes("CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO"), true);
  assert.equal(arenaSceneSource.includes("setShopMenuTop: (menuTopY?: number) => void"), true);
  assert.equal(arenaSceneSource.includes("private getShopCameraViewport(): CityShopCameraViewport"), true);
  assert.equal(arenaSceneSource.includes("private getShopHeroWorldBounds(layout: CityHeroLayout): Phaser.Geom.Rectangle"), true);
  assert.equal(arenaSceneSource.includes("private getShopCameraZoom(heroBounds: Phaser.Geom.Rectangle, viewport: CityShopCameraViewport): number"), true);
  assert.equal(arenaSceneSource.includes("const shopZoom = this.getShopCameraZoom(heroBounds, viewport);"), true);
  assert.equal(arenaSceneSource.includes("viewport.height * CITY_CAMERA_SHOP_MAX_AVAILABLE_HEIGHT_RATIO"), true);
  assert.equal(arenaSceneSource.includes("camera.zoomTo(shopZoom"), true);
});

test("debug character viewer has a compact shop preview mode", () => {
  assert.equal(arenaSceneSource.includes('mode?: "debug" | "shop"'), true);
  assert.equal(arenaSceneSource.includes('this.viewerMode === "shop"'), true);
  assert.equal(arenaSceneSource.includes("private getShopCharacterLayout(): CityHeroLayout"), true);
  assert.equal(arenaSceneSource.includes("Phaser.Scale.RESIZE"), true);
});

test("shop equipment preview updates gear without resetting the animated pose", () => {
  const rigTuningSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function applyRigPartDebugTuning"),
    arenaSceneSource.indexOf("function syncPaperDollEquipmentState"),
  );
  const equipmentSyncSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function syncPaperDollEquipmentState"),
    arenaSceneSource.indexOf("function applyPaperDollEquipmentTuning"),
  );

  assert.equal(arenaSceneSource.includes("areHeroEquipmentStatesEqual(activePlayerEquipment, equipment)"), true);
  assert.equal((arenaSceneSource.match(/subscribePlayerEquipmentChanges\(\(\) => this\.syncPlayerEquipment\(\)\)/g) ?? []).length, 2);
  assert.equal(arenaSceneSource.includes("subscribePlayerEquipmentChanges(() => this.sync())"), false);
  assert.equal(arenaSceneSource.includes("private syncPlayerEquipment(): void"), true);
  assert.equal(rigTuningSource.includes("applyPaperDollEquipmentStateTuning(rig);"), true);
  assert.equal(rigTuningSource.includes("applyPaperDollEquipmentTuning("), false);
  assert.equal(equipmentSyncSource.includes("applyPaperDollEquipmentStateTuning(rig);"), true);
  assert.equal(equipmentSyncSource.includes("syncPaperDollEquipmentVisibility(rig);"), true);
  assert.match(arenaSceneSource, /this\.viewerMode === "shop"[\s\S]*syncPaperDollEquipmentState\(this\.fighter\?\.paperDollRig\);[\s\S]*return;/);
  assert.match(arenaSceneSource, /syncPaperDollEquipmentState\(this\.fighter\?\.paperDollRig\);[\s\S]*applyCityHeroLighting\(this\.fighter, this\.cityLightingAmount\);/);
});

test("city shop hero is centered without manual drag offset", () => {
  assert.equal(arenaSceneSource.includes("CITY_CAMERA_ARMORY_FOCUS_OFFSET_X = 0"), true);
  assert.equal(arenaSceneSource.includes("getShopHeroOffsetY"), false);
  assert.equal(arenaSceneSource.includes("setShopHeroOffsetY"), false);
  assert.equal(arenaSceneSource.includes("enableCityShopHeroDrag"), false);
  assert.equal(arenaSceneSource.includes("private beginShopHeroDrag"), false);
  assert.equal(arenaSceneSource.includes("private dragShopHero"), false);
  assert.doesNotMatch(arenaSceneSource, /shopOffsetY \/ shopZoom/);
  assert.doesNotMatch(arenaSceneSource, /debugTuning\.cityHeroY\s*=/);
  assert.match(stylesSource, /\.city-menu__hero\s*\{[^}]*pointer-events: none;[^}]*\}/s);
  assert.equal(stylesSource.includes(".city-menu--armory-open .city-menu__hero {"), false);
});

test("armory background can be tuned separately from the hero position", () => {
  assert.equal(arenaSceneSource.includes("function getCityBackgroundTransform(assetKey: string)"), true);
  assert.equal(arenaSceneSource.includes("assetKey === CITY_ARMORY_BACKGROUND_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.armoryBackgroundOffsetX"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.armoryBackgroundOffsetY"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.armoryBackgroundScale"), true);
  assert.equal(arenaSceneSource.includes("this.sceneWidth / 2 + transform.offsetX"), true);
  assert.equal(arenaSceneSource.includes("this.sceneHeight / 2 + transform.offsetY"), true);
});

test("city shop background is subdued without overlaying the live hero", () => {
  assert.equal(arenaSceneSource.includes("CITY_SHOP_BACKGROUND_TINT"), true);
  assert.equal(arenaSceneSource.includes("function getCityBackgroundTint(assetKey: string): number"), true);
  assert.equal(arenaSceneSource.includes("CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY ? CITY_SHOP_BACKGROUND_TINT"), true);
  assert.equal(arenaSceneSource.includes("background.setTint(getCityBackgroundTint(assetKey));"), true);
  assert.equal(arenaSceneSource.includes("shopHeroBackdrop"), false);
  assert.equal(arenaSceneSource.includes("CITY_SHOP_HERO_BACKDROP"), false);
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

test("blocked hits use the shield icon popup instead of block text", () => {
  assert.equal(assetsSource.includes("DAMAGE_BLOCK_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/damage-block.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/damage-block.webp")), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_BLOCK_ICON_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_BLOCK_ICON_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("showBlockPopupFromFighter(this, visuals.enemy)"), true);
  assert.equal(arenaSceneSource.includes("showBlockPopupFromFighter(this, visuals.player)"), true);
  assert.equal(arenaSceneSource.includes('getActiveBodyAnimation("block")'), true);
  assert.equal(arenaSceneSource.includes("getBlockPopupHeadOffsetY"), true);
  assert.equal(arenaSceneSource.includes("BLOCK_POPUP_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("fighter.head.getWorldTransformMatrix()"), true);
  assert.equal(arenaSceneSource.includes("effectsLayer.getWorldTransformMatrix().applyInverse"), true);
  assert.equal(arenaSceneSource.includes("offsetY / layerScale"), true);
  assert.equal(arenaSceneSource.includes('target.add.image(x, y, DAMAGE_BLOCK_ICON_ASSET_KEY)'), true);
  assert.equal(arenaSceneSource.includes('"BLOCK"'), false);
});

test("damage hits use the hit icon popup from the fighter head", () => {
  assert.equal(assetsSource.includes("DAMAGE_HIT_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/damage-hit.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/damage-hit.webp")), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_HIT_ICON_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_HIT_ICON_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_HIT_POPUP_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("getDamagePopupHeadOffsetY"), true);
  assert.equal(
    arenaSceneSource.includes(
      "showDamageResultPopupFromFighter(this, visuals.enemy, nextState.lastPlayerDamage, nextState.lastPlayerArmorAbsorbed, nextState.lastPlayerArmorBroken)",
    ),
    true,
  );
  assert.equal(
    arenaSceneSource.includes(
      "showDamageResultPopupFromFighter(this, visuals.player, nextState.lastEnemyDamage, nextState.lastEnemyArmorAbsorbed, nextState.lastEnemyArmorBroken)",
    ),
    true,
  );
  assert.equal(arenaSceneSource.includes("getHealthPopupDamage(totalDamage, armorAbsorbed)"), true);
  assert.equal(arenaSceneSource.includes("target.add.image(0, 0, DAMAGE_HIT_ICON_ASSET_KEY)"), true);
});

test("armor damage uses absorb and break icon popups", () => {
  assert.equal(assetsSource.includes("DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/damage-armor-absorb.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/damage-armor-absorb.webp")), true);
  assert.equal(assetsSource.includes("DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/damage-armor-break.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/damage-armor-break.webp")), true);
  assert.equal(arenaSceneSource.includes("showDamageResultPopupFromFighter"), true);
  assert.equal(arenaSceneSource.includes("if (armorBroken)"), true);
  assert.equal(arenaSceneSource.includes("showArmorBreakPopupFromFighter(target, fighter, totalDamage);"), true);
  assert.equal(arenaSceneSource.includes("if (armorAbsorbed > 0)"), true);
  assert.equal(arenaSceneSource.includes("showArmorAbsorbPopupFromFighter(target, fighter, armorAbsorbed);"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerArmorAbsorbed"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyArmorBroken"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_ARMOR_ABSORB_POPUP_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_ARMOR_BREAK_POPUP_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("function showArmorBreakPopup(target: Phaser.Scene, x: number, y: number, amount: number): void"), true);
  assert.match(arenaSceneSource, /function showArmorBreakPopup[\s\S]*\.text\(0,\s*-?\d+,\s*`\$\{amount\}`/);
});

test("debug popup tuning can preview each popup type", () => {
  assert.equal(arenaSceneSource.includes("type DebugPopupPreviewKind"), true);
  assert.equal(arenaSceneSource.includes("previewPopup(kind: DebugPopupPreviewKind)"), true);
  assert.equal(arenaSceneSource.includes("showPopupPreviewFromFighter(this, this.visuals.enemy, kind)"), true);
  assert.equal(arenaSceneSource.includes("POPUP_PREVIEW_DAMAGE_AMOUNT"), true);
  assert.equal(arenaSceneSource.includes("POPUP_PREVIEW_ARMOR_ABSORB_AMOUNT"), true);
  assert.equal(arenaSceneSource.includes("POPUP_PREVIEW_SPACING_X"), true);
  assert.equal(arenaSceneSource.includes('kind === "damage"'), true);
  assert.equal(arenaSceneSource.includes('kind === "block"'), true);
  assert.equal(arenaSceneSource.includes('kind === "armorAbsorb"'), true);
  assert.equal(arenaSceneSource.includes("showArmorBreakPopupFromFighter(target, fighter, POPUP_PREVIEW_DAMAGE_AMOUNT"), true);
  assert.equal(arenaSceneSource.includes("getPopupXWithScreenOffset"), true);
});
