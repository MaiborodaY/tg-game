import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
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
  assert.equal(arenaSceneSource.includes("const paperDollEquipmentSlotImageStates = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("createPaperDollEquipmentSlotImageState(textureKey, config)"), true);
  assert.equal(arenaSceneSource.includes("arePaperDollEquipmentSlotImageStatesEqual(previousState, nextState)"), true);
  assert.match(arenaSceneSource, /if \(image && previousState && image\.texture\.key === textureKey && arePaperDollEquipmentSlotImageStatesEqual\(previousState, nextState\)\) \{[\s\S]*return image;[\s\S]*\}/);
});

test("paper doll parents wrist equipment to forearms glove equipment to hands and shield to front forearm", () => {
  const armArmorSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollArmArmorVisual"),
    arenaSceneSource.indexOf("function addPaperDollLegArmorVisual"),
  );

  assert.equal(arenaSceneSource.includes('backWrist: "backWristAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('frontWrist: "frontWristAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('backGlove: "backGloveAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('frontGlove: "frontGloveAssetKey"'), true);
  assert.equal(arenaSceneSource.includes('shield: "shieldAssetKey"'), true);
  assert.match(armArmorSource, /key === "backForearm"[\s\S]*options\.backWristAssetKey, "backWrist"/);
  assert.match(armArmorSource, /key === "frontForearm"[\s\S]*options\.frontWristAssetKey, "frontWrist"/);
  assert.match(armArmorSource, /key === "frontForearm"[\s\S]*options\.shieldAssetKey, "shield"/);
  assert.match(armArmorSource, /key === "backHand"[\s\S]*options\.backGloveAssetKey, "backGlove"/);
  assert.match(armArmorSource, /key === "frontHand"[\s\S]*options\.frontGloveAssetKey, "frontGlove"/);
  assert.match(arenaSceneSource, /shield:\s*"frontForearm"/);
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
  assert.equal(arenaSceneSource.includes('return slotKey === "weaponMain" || slotKey === "weaponBow";'), true);
  assert.equal(arenaSceneSource.includes("return layers.weapon;"), true);
  assert.equal(arenaSceneSource.includes('slotKey === "breastplate"'), true);
  assert.equal(arenaSceneSource.includes("return layers.torso;"), true);
  assert.equal(arenaSceneSource.includes("PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS"), true);
  assert.equal(arenaSceneSource.includes("PAPER_DOLL_EQUIPMENT_LAYER_ORDER"), true);
  assert.match(arenaSceneSource, /backBoot:\s*10,[\s\S]*frontBoot:\s*10,[\s\S]*backShinguard:\s*20,[\s\S]*frontShinguard:\s*20/);
  assert.equal(arenaSceneSource.includes("sortPaperDollEquipmentLayer(equipmentLayer, anchorContainer, slotKey);"), true);
  assert.equal(arenaSceneSource.includes('equipmentLayer.sort("paperDollEquipmentLayerOrder"'), true);
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

test("paper doll registers weapon slots before lazy weapon textures load", () => {
  const partVisualSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollPartVisual"),
    arenaSceneSource.indexOf("function addPaperDollWeaponVisual"),
  );
  const weaponVisualSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollWeaponVisual"),
    arenaSceneSource.indexOf("function addPaperDollWeaponTopOverlay"),
  );
  const weaponOverlaySource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollWeaponTopOverlay"),
    arenaSceneSource.indexOf("function addPaperDollHelmetVisual"),
  );

  assert.equal(partVisualSource.includes("options.weaponMainAssetKey && target.textures.exists"), false);
  assert.equal(partVisualSource.includes("options.weaponBowAssetKey && target.textures.exists"), false);
  assert.match(partVisualSource, /if \(options\.weaponMainAssetKey\) \{[\s\S]*addPaperDollWeaponVisual/);
  assert.match(partVisualSource, /if \(options\.weaponBowAssetKey\) \{[\s\S]*addPaperDollWeaponVisual/);
  assert.match(weaponVisualSource, /if \(target\.textures\.exists\(assetKey\)\) \{[\s\S]*weaponContainer\.add\(image\);[\s\S]*\}/);
  assert.match(weaponVisualSource, /addPaperDollWeaponTopOverlay/);
  assert.match(weaponVisualSource, /registerPaperDollEquipmentSlot\(weaponContainer, equipment, slotKey, config\);/);
  assert.match(weaponOverlaySource, /if \(target\.textures\.exists\(assetKey\)\) \{[\s\S]*topContainer\.add\(topImage\);[\s\S]*\}/);
  assert.match(weaponOverlaySource, /paperDollEquipmentSlotConfigs\.set\(topSlot, config\);/);
});

test("paper doll high shadow hides armor equipment and face overlays", () => {
  assert.equal(arenaSceneSource.includes("function syncPaperDollShadowSilhouette("), true);
  assert.equal(arenaSceneSource.includes("function addPaperDollShadowPartVisual("), false);
  assert.equal(arenaSceneSource.includes("function drawPaperDollShadowPart("), false);
  assert.equal(arenaSceneSource.includes("eyeLeftCover?: FighterPart;"), true);
  assert.equal(arenaSceneSource.includes("faceParts.eyeLeftCover = part(leftCover);"), true);
  assert.equal(arenaSceneSource.includes("faceParts.eyeRightCover = part(rightCover);"), true);
  assert.equal(arenaSceneSource.includes("Object.values(shadow.faceParts).forEach((facePart) => setFighterPartVisible(facePart, false));"), true);
  assert.equal(arenaSceneSource.includes("isPaperDollWeaponSlot(slotKey) && Boolean(visibility?.[slotKey])"), true);
  assert.equal(arenaSceneSource.includes("function shouldSyncPaperDollShadowEquipment("), true);
  assert.equal(arenaSceneSource.includes("return Boolean(rig.shadow?.root.visible);"), true);
  assert.match(arenaSceneSource, /if \(shouldSyncShadowEquipment && shadow\) \{[\s\S]*tintPaperDollShadowObject\(shadow\.root\)[\s\S]*\}/);
  assert.equal(arenaSceneSource.includes("syncPaperDollShadowSilhouette(shadow, visibility, slotKeys)"), true);
  assert.match(arenaSceneSource, /if \(shouldSyncShadowEquipment\) \{[\s\S]*syncPaperDollEquipmentSlot\(rig\.shadow\?\.equipment\[slotKey\], slotKey, textureKey\);[\s\S]*\}/);
  assert.match(arenaSceneSource, /!wasHighShadowVisible && this\.fighter\.shadow\.visible[\s\S]*syncPaperDollEquipmentState\(this\.fighter\.paperDollRig\);/);
  assert.doesNotMatch(arenaSceneSource, /rig\.shadow\?\.equipment\[slotKey\]\?\.setVisible\(visibility\[slotKey\]\)/);
});

test("paper doll high shadow can use a cached blur filter", () => {
  assert.equal(arenaSceneSource.includes("const paperDollShadowBlurFilters = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("function applyPaperDollShadowBlur("), true);
  assert.equal(arenaSceneSource.includes("filters.addBlur("), true);
  assert.equal(arenaSceneSource.includes("filters.remove(currentFilter, true);"), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollShadowBlur(fighter.shadow);"), true);
});

test("paper doll loader lazily resolves generated and auto equipment assets", () => {
  assert.equal(arenaSceneSource.includes("GENERATED_EQUIPMENT_ASSETS"), true);
  assert.equal(arenaSceneSource.includes("AUTO_EQUIPMENT_ASSETS"), true);
  assert.equal(arenaSceneSource.includes("resolveEquipmentAssetUrl"), true);
  assert.equal(arenaSceneSource.includes("const PAPER_DOLL_ASSETS_BY_KEY = createPaperDollAssetsByKey();"), true);
  assert.equal(arenaSceneSource.includes("async function getPaperDollAssetLoadEntriesForKeys"), true);
  assert.equal(arenaSceneSource.includes("function getSyncPaperDollAssetLoadEntriesForEquipmentStates"), true);
  assert.equal(arenaSceneSource.includes("async function resolvePaperDollAssetUrl"), true);
  assert.equal(arenaSceneSource.includes("function ensurePaperDollEquipmentAssetsLoaded"), true);
  assert.equal(arenaSceneSource.includes("function ensurePaperDollItemAssetsLoaded"), true);
  assert.equal(arenaSceneSource.includes("getHeroItemEquipmentAssetKeys"), true);
  assert.equal(arenaSceneSource.includes("AUTO_EQUIPMENT_ITEM_ASSET_KEYS"), true);
  assert.equal(arenaSceneSource.includes("[...FIGHTER_PAPER_DOLL_ASSETS, ...GENERATED_EQUIPMENT_ASSETS, ...AUTO_EQUIPMENT_ASSETS].forEach((asset) =>"), false);
});

test("paper doll skips fallback armor placeholders while lazy equipment textures load", () => {
  const helmetSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollHelmetVisual"),
    arenaSceneSource.indexOf("function addPaperDollBreastplateVisual"),
  );
  const breastplateSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function addPaperDollBreastplateVisual"),
    arenaSceneSource.indexOf("function addPaperDollArmArmorVisual"),
  );

  assert.equal(helmetSource.includes("} else if (!assetKey) {"), true);
  assert.equal(breastplateSource.includes("} else if (!assetKey) {"), true);
  assert.equal(helmetSource.includes("drawArmorHelmetPlaceholder(graphics);"), true);
  assert.equal(breastplateSource.includes("drawArmorBreastplatePlaceholder(graphics);"), true);
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
  assert.equal(arenaSceneSource.includes("playerActionAnimation = animateAction("), true);
  assert.equal(arenaSceneSource.includes("enemyActionAnimation = animateAction("), true);
  assert.equal(arenaSceneSource.includes("playerActionAnimation.done"), true);
  assert.equal(arenaSceneSource.includes("playerActionAnimation?.impact ?? playerActionAnimation?.done"), true);
  assert.equal(arenaSceneSource.includes("return Promise.all(actionAnimations).then(() => {"), true);
  assert.equal(arenaSceneSource.includes("resetActiveTurnBodyIdleAnimation(visuals, previousState, nextState, this.time.now);"), true);
  assert.equal(arenaSceneSource.includes("function playBodyAnimationOnce"), true);
  assert.equal(arenaSceneSource.includes("interface ActionAnimationHandle"), true);
  assert.equal(arenaSceneSource.includes("function animateAction("), true);
  assert.equal(arenaSceneSource.includes("function queueCombatResultAnimation("), true);
});

test("movement steps do not spawn floating step text", () => {
  assert.equal(arenaSceneSource.includes('actionId === "forward" || actionId === "back"'), true);
  assert.equal(arenaSceneSource.includes('actionId === "forward" ? "STEP" : "BACK"'), false);
  assert.equal(arenaSceneSource.includes('showFloatingText(target, actor.body.x, actor.body.y - 120, "MELEE"'), true);
  assert.equal(arenaSceneSource.includes('showFloatingText(target, actor.body.x, actor.body.y - 120, "SHURIKEN"'), false);
});

test("bow attacks and damage reactions use dedicated body animations", () => {
  assert.equal(arenaSceneSource.includes('type HeroWeaponClass'), true);
  assert.equal(arenaSceneSource.includes('isRangedWeaponClass(weaponClass)'), true);
  assert.equal(arenaSceneSource.includes('isRangedWeapon ? "bowShot" : actionId'), true);
  assert.equal(arenaSceneSource.includes("playProjectile(target, actor, defender, actionId, direction)"), true);
  assert.equal(arenaSceneSource.includes("shouldDelayCombatResultForProjectile(lastPlayerAction, nextState.player.weaponClass)"), true);
  assert.equal(arenaSceneSource.includes("!isRangedWeapon && areArenaVfxEnabled(playerSettings)"), true);
  assert.equal(arenaSceneSource.includes('getActiveBodyAnimation("hit")'), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerDamage > 0"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyDamage > 0"), true);
});

test("arena uses pooled projectiles for arrows and shurikens", () => {
  assert.equal(assetsSource.includes("SHURIKEN_PROJECTILE_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/projectiles/shuriken.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/projectiles/shuriken.webp")), true);
  assert.equal(arenaSceneSource.includes("target.load.image(SHURIKEN_PROJECTILE_ASSET_KEY, SHURIKEN_PROJECTILE_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("SHURIKEN_PROJECTILE_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("projectiles: Phaser.GameObjects.Image[];"), true);
  assert.equal(arenaSceneSource.includes("projectiles: []"), true);
  assert.equal(arenaSceneSource.includes("function playProjectile("), true);
  assert.equal(arenaSceneSource.includes("interface ProjectileAnimationHandle"), true);
  assert.equal(arenaSceneSource.includes("PROJECTILE_IMPACT_LEAD_MS"), true);
  assert.equal(arenaSceneSource.includes("impactDelayMs"), true);
  assert.equal(arenaSceneSource.includes("resolveImpactOnce"), true);
  assert.equal(arenaSceneSource.includes("impact: projectileAnimation.impact"), true);
  assert.equal(arenaSceneSource.includes("function acquireProjectile("), true);
  assert.equal(arenaSceneSource.includes("function releaseProjectile("), true);
  assert.equal(arenaSceneSource.includes('actionId === "shuriken"'), true);
  assert.equal(arenaSceneSource.includes("ARROW_PROJECTILE_ANGLE_OFFSET"), true);
});

test("arena shows bow arrow counts above bow fighters", () => {
  assert.equal(assetsSource.includes("ARROW_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/action-icons/arrow.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/arrow.webp")), true);
  assert.equal(arenaSceneSource.includes("target.load.image(ARROW_ICON_ASSET_KEY, ARROW_ICON_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("attachFighterArrowCounter(target, player);"), true);
  assert.equal(arenaSceneSource.includes("attachFighterArrowCounter(target, enemy);"), true);
  assert.equal(arenaSceneSource.includes("function setFighterArrowCounter"), true);
  assert.equal(arenaSceneSource.includes("const FIGHTER_ARROW_COUNTER_LOCAL_Y = -366;"), true);
  assert.equal(arenaSceneSource.includes("isBowFighter(state)"), true);
  assert.equal(arenaSceneSource.includes("getBowShotsRemaining(state)"), true);
  assert.equal(arenaSceneSource.includes("container.add([icon, text]);"), true);
  assert.equal(arenaSceneSource.includes("setPhaserTextIfChanged(counter.text, `${getBowShotsRemaining(state)}`);"), true);
  assert.equal(arenaSceneSource.includes("FIGHTER_ARROW_COUNTER_SCALE_MULTIPLIER = 1.2"), true);
  assert.equal(arenaSceneSource.includes("Math.max(FIGHTER_ARROW_COUNTER_SCALE_MIN, scale / DEFAULT_PLAYER_SCALE) * FIGHTER_ARROW_COUNTER_SCALE_MULTIPLIER"), true);
  assert.equal(arenaSceneSource.includes("applyFighterArrowCountersSceneScale(this);"), true);
  assert.equal(arenaSceneSource.includes("setGameObjectScaleIfChanged(counter.container, counter.baseScale / sceneScale);"), true);
  assert.equal(arenaSceneSource.includes("function setGameObjectScaleIfChanged"), true);
});

test("arena applies active combat weapon visibility after paper doll tuning", () => {
  const renderSceneSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function renderScene("),
    arenaSceneSource.indexOf("function syncFighterCombatEquipment("),
  );
  const combatEquipmentSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function syncFighterCombatEquipment("),
    arenaSceneSource.indexOf("function resetDeathEffectsForLiveFighters("),
  );

  assert.ok(renderSceneSource.indexOf("positionFightersForState(target, target.visuals, current, playerSettings);") >= 0);
  assert.ok(renderSceneSource.indexOf("syncFighterCombatEquipment(target.visuals.player, current.player);") >= 0);
  assert.ok(
    renderSceneSource.indexOf("positionFightersForState(target, target.visuals, current, playerSettings);") <
      renderSceneSource.indexOf("syncFighterCombatEquipment(target.visuals.player, current.player);"),
  );
  assert.equal(combatEquipmentSource.includes('syncPaperDollEquipmentState(rig, ["weaponMain", "weaponBow"], equipment);'), false);
  assert.equal(combatEquipmentSource.includes("syncPaperDollEquipmentState(rig, PAPER_DOLL_EQUIPMENT_SLOT_KEYS, equipment);"), true);
  assert.match(combatEquipmentSource, /syncPaperDollEquipmentState\(rig, PAPER_DOLL_EQUIPMENT_SLOT_KEYS, equipment\);[\s\S]*syncFighterCombatWeaponVisibility\(rig, state\);/);
  assert.equal(combatEquipmentSource.includes("syncFighterCombatWeaponVisibility(rig.shadow, state);"), true);
  assert.equal(combatEquipmentSource.includes("const hasBowVisual = Boolean(rig.equipment.weaponBow && getPaperDollEquipmentSlotImage(rig.equipment.weaponBow));"), true);
  assert.equal(combatEquipmentSource.includes("setPaperDollEquipmentSlotVisible(rig.equipment.weaponMain, hasMainWeapon && (!bowActive || !hasBowVisual));"), true);
  assert.equal(combatEquipmentSource.includes("setPaperDollEquipmentSlotVisible(rig.equipment.weaponBow, bowActive && (hasBowWeapon || hasBowVisual));"), true);
});

test("arena reuses player settings snapshots during frame work", () => {
  assert.equal(arenaSceneSource.includes("const playerSettings = getPlayerSettings();"), true);
  assert.equal(arenaSceneSource.includes("getArenaAnimationAmount()"), true);
  assert.equal(arenaSceneSource.includes("renderScene(this, nextState, playerSettings);"), true);
  assert.equal(arenaSceneSource.includes("playerSettings.shadowMode"), true);
  assert.equal(arenaSceneSource.includes("function getArenaAnimationAmount(): number"), true);
  assert.equal(arenaSceneSource.includes("return 1;"), true);
});

test("phaser games request a low power webgl context", () => {
  assert.equal(arenaSceneSource.includes("const PHASER_LOW_POWER_RENDER_CONFIG: Phaser.Types.Core.RenderConfig"), true);
  assert.equal(arenaSceneSource.includes('powerPreference: "low-power"'), true);
  assert.equal((arenaSceneSource.match(/render: PHASER_LOW_POWER_RENDER_CONFIG/g) ?? []).length, 4);
});

test("phaser games use the selected render fps setting", () => {
  const launchArenaSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("export function launchArena("),
    arenaSceneSource.indexOf("type CityCameraMode"),
  );
  const cityPreviewSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("export function mountCityHeroPreview("),
    arenaSceneSource.indexOf("export function mountHeroPortraitPreview("),
  );

  assert.equal(arenaSceneSource.includes("const PHASER_THIRTY_FPS_CONFIG: Phaser.Types.Core.FPSConfig"), true);
  assert.equal(arenaSceneSource.includes("const PHASER_SIXTY_FPS_CONFIG: Phaser.Types.Core.FPSConfig"), true);
  assert.match(arenaSceneSource, /PHASER_THIRTY_FPS_CONFIG[\s\S]*target:\s*30,[\s\S]*limit:\s*30,/);
  assert.match(arenaSceneSource, /PHASER_SIXTY_FPS_CONFIG[\s\S]*target:\s*60,[\s\S]*limit:\s*60,/);
  assert.equal(arenaSceneSource.includes("function getPlayerPhaserFpsConfig(): Phaser.Types.Core.FPSConfig"), true);
  assert.equal(arenaSceneSource.includes("getPlayerSettings().renderFps === 60 ? PHASER_SIXTY_FPS_CONFIG : PHASER_THIRTY_FPS_CONFIG"), true);
  assert.equal((arenaSceneSource.match(/fps: getPlayerPhaserFpsConfig\(\)/g) ?? []).length, 4);
  assert.equal(launchArenaSource.includes("fps: getPlayerPhaserFpsConfig()"), true);
  assert.equal(cityPreviewSource.includes("fps: getPlayerPhaserFpsConfig()"), true);
});

test("arena starts close between fighters and eases back to the normal camera", () => {
  assert.equal(arenaSceneSource.includes('type ArenaEntryTransitionState = "pending" | "running" | "done"'), true);
  assert.equal(arenaSceneSource.includes("ARENA_ENTRY_START_ZOOM_MULTIPLIER"), true);
  assert.equal(arenaSceneSource.includes("async prepareEntry(nextState: CombatState): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("async playEntryTransition(current = this.currentState): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("private async prepareStateVisuals(nextState: CombatState): Promise<ArenaPreparedVisualState | undefined>"), true);
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

test("paper doll equipment sync skips unchanged transforms and hidden shadow tuning", () => {
  assert.equal(arenaSceneSource.includes("const paperDollEquipmentTransformStates = new WeakMap"), true);
  assert.equal(arenaSceneSource.includes("createPaperDollEquipmentTransformState(tuning)"), true);
  assert.equal(arenaSceneSource.includes("arePaperDollEquipmentTransformStatesEqual(previousState, nextState)"), true);
  assert.match(arenaSceneSource, /if \(previousState && arePaperDollEquipmentTransformStatesEqual\(previousState, nextState\)\) \{[\s\S]*return;[\s\S]*\}/);
  assert.match(arenaSceneSource, /const shadow = rig\.shadow;[\s\S]*if \(shadow && shouldSyncPaperDollShadowEquipment\(rig\)\) \{[\s\S]*applyPaperDollEquipmentTuning\(shadow\.equipment/);
  assert.equal(arenaSceneSource.includes("function setFighterPartVisible("), true);
  assert.match(arenaSceneSource, /if \(part && part\.visible !== visible\) \{[\s\S]*part\.setVisible\(visible\);[\s\S]*\}/);
});

test("city body scale normalizes as the hero moves into shop mode", () => {
  const portraitSceneSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("class HeroPortraitScene"),
    arenaSceneSource.indexOf("function syncHeroPortraitCrop"),
  );
  const debugCharacterSceneSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("class DebugCharacterScene"),
    arenaSceneSource.indexOf("function drawDebugCharacterBackdrop"),
  );

  assert.equal(arenaSceneSource.includes("export function setPlayerBodyScaleBonus(bodyScaleBonus: number): void"), true);
  assert.equal(arenaSceneSource.includes("function getCityPlayerBodyScaleMultiplier(liftProgress: number): number"), true);
  assert.equal(arenaSceneSource.includes("activePlayerBodyScaleBonus * clampNumber(1 - liftProgress, 0, 1)"), true);
  assert.equal(arenaSceneSource.includes("subscribePlayerBodyScaleChanges(() => this.syncFighterLayout())"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.cityHeroScale * slotScale * getCityPlayerBodyScaleMultiplier(liftProgress)"), true);
  assert.equal(portraitSceneSource.includes("subscribePlayerBodyScaleChanges"), false);
  assert.equal(portraitSceneSource.includes("getCityPlayerBodyScaleMultiplier"), false);
  assert.equal(debugCharacterSceneSource.includes("subscribePlayerBodyScaleChanges"), false);
  assert.equal(debugCharacterSceneSource.includes("getCityPlayerBodyScaleMultiplier"), false);
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
  assert.equal(arenaSceneSource.includes("getChangedHeroEquipmentSlots(activePlayerEquipment, equipment)"), true);
  assert.equal(arenaSceneSource.includes("notifyPlayerEquipmentChanged(changedSlots)"), true);
  assert.equal(arenaSceneSource.includes("previewEquipment: (equipment: HeroEquipment) => void"), true);
  assert.equal(arenaSceneSource.includes("clearEquipmentPreview: () => void"), true);
  assert.equal(arenaSceneSource.includes("previewPlayerEquipment(equipment: HeroEquipment): void"), true);
  assert.equal(arenaSceneSource.includes("clearPlayerEquipmentPreview(): void"), true);
  assert.equal(arenaSceneSource.includes("this.previewEquipment = undefined;"), true);
  assert.equal((arenaSceneSource.match(/syncPlayerEquipment\(changedSlots\)/g) ?? []).length >= 2, true);
  assert.equal(arenaSceneSource.includes("subscribePlayerEquipmentChanges(() => this.sync())"), false);
  assert.equal(arenaSceneSource.includes("private syncPlayerEquipment(changedSlots?: readonly PaperDollEquipmentSlotKey[]): void"), true);
  assert.equal(rigTuningSource.includes("applyPaperDollEquipmentStateTuning(rig);"), true);
  assert.equal(rigTuningSource.includes("applyPaperDollEquipmentTuning("), false);
  assert.equal(equipmentSyncSource.includes("applyPaperDollEquipmentStateTuning(rig, slotKeys, equipmentOverride)"), true);
  assert.equal(equipmentSyncSource.includes("syncPaperDollEquipmentVisibility(rig, slotKeys, equipmentOverride)"), true);
  assert.equal(arenaSceneSource.includes("getPlayerEquipmentSlotAssetKey(equipmentState, slotKey)"), true);
  assert.match(arenaSceneSource, /this\.viewerMode === "shop"[\s\S]*syncPaperDollEquipmentState\(this\.fighter\?\.paperDollRig, changedSlots\);[\s\S]*return;/);
  assert.match(arenaSceneSource, /private syncPlayerEquipment\(changedSlots\?: readonly PaperDollEquipmentSlotKey\[\]\): void \{[\s\S]*syncPaperDollEquipmentState\(this\.fighter\?\.paperDollRig, changedSlots, this\.previewEquipment\);[\s\S]*applyCityHeroLighting\(this\.fighter, this\.cityLightingAmount, changedSlots\);/);
  assert.match(arenaSceneSource, /function applyCityHeroLighting\([\s\S]*equipmentSlotKeys\?: readonly PaperDollEquipmentSlotKey\[\],[\s\S]*if \(equipmentSlotKeys\) \{[\s\S]*tintPaperDollImages\(rig\.equipment\[slotKey\], CITY_HERO_EQUIPMENT_TINT, amount\);[\s\S]*return;/);
  assert.equal(mainSource.includes("function getShopPreviewItemIds(product: ArmoryProduct | WeaponProduct): HeroItemId[]"), false);
  assert.equal(mainSource.includes('equipmentSlot.startsWith("front")'), false);
  assert.equal(mainSource.includes("shouldStaggerArmoryPreview(product)"), false);
  assert.equal(mainSource.includes("PAIRED_ARMORY_PREVIEW_STEP_DELAY_MS"), false);
  assert.equal(mainSource.includes("shopPreviewAnimationTimer"), false);
  assert.equal(mainSource.includes("shopPreviewAnimationToken"), false);
  assert.equal(mainSource.includes("profileArmoryPreviewSpan"), false);
  assert.equal(arenaSceneSource.includes("profileArmoryPreviewSpan"), false);
  assert.equal(mainSource.includes('const phase = isArmoryShopProduct(product) && product.itemIds.length > 1 ? "paired" : "single";'), false);
  assert.equal(mainSource.includes("previewShopEquipment(createShopPreviewEquipment(product.itemIds));"), true);
  assert.equal(mainSource.includes("previewShopEquipment(equipment, phase);"), false);
  assert.equal(mainSource.includes("cityScene?.previewEquipment(equipment);"), true);
  assert.equal(mainSource.includes("cityScene?.clearEquipmentPreview();"), true);
  assert.equal(mainSource.includes("setPlayerEquipment(createShopPreviewEquipment(product.itemIds));"), false);
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

test("arena entry leaves the city hero camera stationary", () => {
  assert.equal(arenaSceneSource.includes("this.tweens.killTweensOf(camera);"), true);
  assert.equal(arenaSceneSource.includes("private freezeHeroCameraForArenaTransition(): void"), true);
  assert.equal(arenaSceneSource.includes("const heroCamera = this.getHeroCamera();"), true);
  assert.equal(arenaSceneSource.includes("this.tweens.killTweensOf(heroCamera);"), true);
  assert.equal(arenaSceneSource.includes("heroCamera.setZoom(CITY_CAMERA_DEFAULT_ZOOM);"), true);
  assert.equal(arenaSceneSource.includes("heroCamera.centerOn(this.sceneWidth / 2, this.sceneHeight / 2);"), true);
  assert.equal(arenaSceneSource.includes("targets: this.getHeroCamera()"), false);
  assert.equal(arenaSceneSource.includes("alpha: 0.18"), false);
});

test("city background camera ignores the full hero display tree", () => {
  assert.equal(arenaSceneSource.includes("function getFighterCameraIgnoreTargets(fighter: FighterVisual): Phaser.GameObjects.GameObject[]"), true);
  assert.equal(arenaSceneSource.includes("this.cameras.main.ignore(getFighterCameraIgnoreTargets(this.fighter));"), true);
  assert.match(arenaSceneSource, /target instanceof Phaser\.GameObjects\.Container[\s\S]*target\.list\.forEach/);
  assert.equal(arenaSceneSource.includes("addPaperDollRig(fighter.paperDollRig);"), true);
  assert.equal(arenaSceneSource.includes("addPaperDollRig(fighter.paperDollRig?.shadow);"), true);
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

test("city return can prewarm city and hero preview assets through the browser cache", () => {
  assert.equal(arenaSceneSource.includes("export function prewarmCityAssetsForBrowserCache(): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("cityAssetPrewarmPromise ??="), true);
  assert.equal(arenaSceneSource.includes("async function getCityAssetPrewarmUrls(): Promise<string[]>"), true);
  assert.equal(arenaSceneSource.includes("CITY_BACKGROUND_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("CITY_DAY_BACKGROUND_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("CITY_SHOP_BACKGROUND_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("CITY_CLOUD_ASSETS.map((asset) => asset.url)"), true);
  assert.equal(arenaSceneSource.includes("cityAssetPrewarmPromise ??= getCityAssetPrewarmUrls()"), true);
  assert.equal(arenaSceneSource.includes("async function getCityAssetPrewarmUrls(): Promise<string[]>"), true);
  assert.equal(arenaSceneSource.includes("const paperDollUrls = await getPaperDollAssetLoadEntriesForEquipmentStates(getPlayerSettings().lowEffects, [activePlayerEquipment])"), true);
});

test("city hero preview exposes a ready promise for return transitions", () => {
  assert.equal(arenaSceneSource.includes("ready: Promise<void>;"), true);
  assert.equal(arenaSceneSource.includes("const ready = new Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("resolveReadyOnce();"), true);
  assert.match(arenaSceneSource, /return \{\s*ready,/);
});

test("hero portrait skips unchanged snapshot equipment", () => {
  assert.equal(arenaSceneSource.includes("HERO_PORTRAIT_SNAPSHOT_EQUIPMENT_SLOT_KEYS"), true);
  assert.equal(arenaSceneSource.includes("function getHeroPortraitSnapshotKey(equipment: HeroEquipment | undefined): string"), true);
  assert.equal(arenaSceneSource.includes("let lastSnapshotKey: string | undefined;"), true);
  assert.match(arenaSceneSource, /if \(snapshotKey === lastSnapshotKey\) \{\s*return;\s*\}/);
  assert.match(arenaSceneSource, /if \(nextSnapshotKey === lastSnapshotKey\) \{\s*return;\s*\}/);
  assert.match(arenaSceneSource, /scene\.captureFrame\(\(src\) => \{[\s\S]*lastSnapshotKey = snapshotKey;[\s\S]*target\.image\.src = src;/);
  assert.equal(arenaSceneSource.includes("window.requestAnimationFrame(() => window.requestAnimationFrame(captureSnapshot));"), true);
  assert.match(arenaSceneSource, /void scene\.setEquipment\(nextEquipment\)\.then\(\(\) => refreshSnapshot\(nextEquipment\)\);/);
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
  assert.equal(arenaSceneSource.includes("acquireBlockPopupIcon(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseBlockPopupIcon(target, icon)"), true);
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
  assert.equal(arenaSceneSource.includes("showDamageResultPopupFromFighter("), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerDamage,"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyDamage,"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerArmorAbsorbed,"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyArmorAbsorbed,"), true);
  assert.equal(arenaSceneSource.includes("playerSettings,"), true);
  assert.equal(arenaSceneSource.includes("getHealthPopupDamage(totalDamage, armorAbsorbed)"), true);
  assert.equal(arenaSceneSource.includes("acquireDamageIconPopup(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseDamageIconPopup(target, popup)"), true);
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
  assert.equal(arenaSceneSource.includes("acquireArmorAbsorbPopup(target)"), true);
  assert.equal(arenaSceneSource.includes("acquireArmorBreakPopup(target)"), true);
  assert.equal(arenaSceneSource.includes("setPhaserTextIfChanged(popup.label, `${amount}`);"), true);
});

test("rest actions show pooled health and stamina recovery popups", () => {
  assert.equal(assetsSource.includes("REST_HEALTH_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/profile/stat-health.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/profile/stat-health.webp")), true);
  assert.equal(assetsSource.includes("REST_STAMINA_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/profile/stat-stamina.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/profile/stat-stamina.webp")), true);
  assert.equal(assetsSource.includes("REST_ZZZ_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/rest.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/rest.webp")), true);
  assert.equal(arenaSceneSource.includes("target.load.image(REST_HEALTH_ICON_ASSET_KEY, REST_HEALTH_ICON_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("target.load.image(REST_STAMINA_ICON_ASSET_KEY, REST_STAMINA_ICON_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("target.load.image(REST_ZZZ_ICON_ASSET_KEY, REST_ZZZ_ICON_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("REST_HEALTH_ICON_ASSET_URL,"), true);
  assert.equal(arenaSceneSource.includes("REST_STAMINA_ICON_ASSET_URL,"), true);
  assert.equal(arenaSceneSource.includes("REST_ZZZ_ICON_ASSET_URL,"), true);
  assert.equal(arenaSceneSource.includes("restRecoveryPopups: ArenaRestRecoveryPopupVisual[]"), true);
  assert.equal(arenaSceneSource.includes("restZzzIcons: Phaser.GameObjects.Image[]"), true);
  assert.equal(arenaSceneSource.includes("restRecoveryPopups: []"), true);
  assert.equal(arenaSceneSource.includes("restZzzIcons: []"), true);
  assert.equal(arenaSceneSource.includes('lastPlayerAction === "rest"'), true);
  assert.equal(arenaSceneSource.includes('lastEnemyAction === "rest"'), true);
  assert.equal(arenaSceneSource.includes("showRestRecoveryPopupFromFighter(this, visuals.player, previousState?.player, nextState.player);"), true);
  assert.equal(arenaSceneSource.includes("showRestRecoveryPopupFromFighter(this, visuals.enemy, previousState?.enemy, nextState.enemy);"), true);
  assert.equal(arenaSceneSource.includes("REST_BODY_ANIMATION_SPEED_MULTIPLIER = 2"), true);
  assert.equal(/REST_ZZZ_ICON_SCREEN_SIZE = \d+/.test(arenaSceneSource), true);
  assert.equal(/REST_ZZZ_SPAWN_INTERVAL_MS = \d+/.test(arenaSceneSource), true);
  assert.equal(/REST_ZZZ_LIFETIME_MS = \d+/.test(arenaSceneSource), true);
  assert.equal(arenaSceneSource.includes("REST_ZZZ_SIDE_OFFSETS"), true);
  assert.equal(arenaSceneSource.includes("REST_ZZZ_DRIFT_X"), true);
  assert.equal(arenaSceneSource.includes("bodyIdleAnimationKey?: BodyAnimationKey"), true);
  assert.equal(arenaSceneSource.includes("bodyIdleAnimationStartedAt?: number"), true);
  assert.equal(arenaSceneSource.includes("restZzzNextSpawnAt?: number"), true);
  assert.equal(arenaSceneSource.includes("restZzzSpawnIndex?: number"), true);
  assert.equal(arenaSceneSource.includes("loopAfterComplete?: BodyAnimationKey"), true);
  assert.equal(arenaSceneSource.includes('loopAfterComplete: "rest"'), true);
  assert.equal(arenaSceneSource.includes("speedMultiplier?: number"), true);
  assert.equal(arenaSceneSource.includes("speedMultiplier: REST_BODY_ANIMATION_SPEED_MULTIPLIER"), true);
  assert.equal(arenaSceneSource.includes("getFighterBodyIdleAnimation(this.visuals.player)"), true);
  assert.equal(arenaSceneSource.includes("getFighterBodyIdleAnimation(this.visuals.enemy)"), true);
  assert.equal(arenaSceneSource.includes("function getFighterBodyIdleAnimation(fighter: FighterVisual): BodyAnimationTuning"), true);
  assert.equal(arenaSceneSource.includes("function resetActiveTurnBodyIdleAnimation("), true);
  assert.equal(arenaSceneSource.includes('setFighterBodyIdleAnimation(fighter, "idle", startedAt);'), true);
  assert.equal(arenaSceneSource.includes("previousState?.activeTurn === currentState.activeTurn"), true);
  assert.equal(arenaSceneSource.includes('const fighter = currentState.activeTurn === "player" ? visuals.player : visuals.enemy;'), true);
  assert.equal(arenaSceneSource.includes('if (fighter.bodyIdleAnimationKey === "rest")'), true);
  assert.equal(arenaSceneSource.includes("setFighterBodyIdleAnimation(fighter, options.loopAfterComplete, target.time.now);"), true);
  assert.equal(arenaSceneSource.includes("resetFighterBodyIdleAnimation(fighter, target.time.now);"), true);
  assert.equal(arenaSceneSource.includes("resetFighterBodyIdleAnimation(actor, target.time.now);"), true);
  assert.equal(arenaSceneSource.includes("resetActiveTurnBodyIdleAnimation(visuals, previousState, nextState, this.time.now);"), true);
  assert.equal(arenaSceneSource.includes("updateRestZzzEffects(this, this.visuals.player, time);"), true);
  assert.equal(arenaSceneSource.includes("updateRestZzzEffects(this, this.visuals.enemy, time);"), true);
  assert.equal(arenaSceneSource.includes('fighter.bodyIdleAnimationKey !== "rest"'), true);
  assert.equal(arenaSceneSource.includes("showRestZzzIconFromFighter(target, fighter, fighter.restZzzSpawnIndex ?? 0);"), true);
  assert.equal(arenaSceneSource.includes("fighter.restZzzNextSpawnAt = time + REST_ZZZ_SPAWN_INTERVAL_MS;"), true);
  assert.equal(arenaSceneSource.includes("function acquireRestZzzIcon(target: Phaser.Scene): Phaser.GameObjects.Image"), true);
  assert.equal(arenaSceneSource.includes("function releaseRestZzzIcon(target: Phaser.Scene, icon: Phaser.GameObjects.Image): void"), true);
  assert.equal(arenaSceneSource.includes("duration: REST_ZZZ_LIFETIME_MS"), true);
  assert.equal(arenaSceneSource.includes("onComplete: () => releaseRestZzzIcon(target, icon)"), true);
  assert.equal(arenaSceneSource.includes("bodyIdleAnimationKey: \"idle\""), true);
  assert.equal(arenaSceneSource.includes("const speedMultiplier = options.speedMultiplier && options.speedMultiplier > 0 ? options.speedMultiplier : 1;"), true);
  assert.equal(arenaSceneSource.includes("const duration = Math.max(1, animation.duration / speedMultiplier);"), true);
  assert.equal(arenaSceneSource.includes("const fallbackDelay = duration + 60;"), true);
  assert.equal(arenaSceneSource.includes("const lockedUntil = target.time.now + fallbackDelay;"), true);
  assert.equal(arenaSceneSource.includes("fighter.bodyAnimationLockedUntil = 0;"), true);
  assert.equal(arenaSceneSource.includes("yoyo: true"), true);
  assert.equal(arenaSceneSource.includes("applyBodyAnimation(fighter, time - (fighter.bodyIdleAnimationStartedAt ?? 0), animation, amount);"), true);
  assert.equal(arenaSceneSource.includes("const healthGain = Math.max(0, current.hp - previous.hp);"), true);
  assert.equal(arenaSceneSource.includes("const staminaGain = Math.max(0, current.stamina - previous.stamina);"), true);
  assert.equal(arenaSceneSource.includes("acquireRestRecoveryPopup(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseRestRecoveryPopup(target, popup)"), true);
  assert.equal(arenaSceneSource.includes("setRestRecoveryPopupRow("), true);
  assert.equal(arenaSceneSource.includes("row.setVisible(amount > 0);"), true);
  assert.equal(arenaSceneSource.includes("setPhaserTextIfChanged(label, `+${amount}`);"), true);
});

test("arena pools transient popup and effect objects", () => {
  assert.equal(arenaSceneSource.includes("const arenaEffectPoolsByScene = new WeakMap<Phaser.Scene, ArenaEffectPools>();"), true);
  assert.equal(arenaSceneSource.includes("function getArenaEffectPools(target: Phaser.Scene): ArenaEffectPools"), true);
  assert.equal(arenaSceneSource.includes("floatingLabels: Phaser.GameObjects.Text[]"), true);
  assert.equal(arenaSceneSource.includes("damageTextPopups: ArenaTextPopupVisual[]"), true);
  assert.equal(arenaSceneSource.includes("restRecoveryPopups: ArenaRestRecoveryPopupVisual[]"), true);
  assert.equal(arenaSceneSource.includes("restZzzIcons: Phaser.GameObjects.Image[]"), true);
  assert.equal(arenaSceneSource.includes("acquireFloatingTextLabel(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseFloatingTextLabel(target, label)"), true);
  assert.equal(arenaSceneSource.includes("acquireRestZzzIcon(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseRestZzzIcon(target, icon)"), true);
  assert.equal(arenaSceneSource.includes("acquireSlashArc(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseSlashArc(target, slash)"), true);
  assert.equal(arenaSceneSource.includes("acquireDustDot(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseDustDot(target, dot)"), true);
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
