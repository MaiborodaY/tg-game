import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const debugMainSource = readFileSync(resolve(currentDir, "../src/debugMain.ts"), "utf8");
const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
const domUiSource = readFileSync(resolve(currentDir, "../src/domUi.ts"), "utf8");
const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");
const viteConfigSource = readFileSync(resolve(currentDir, "../vite.config.ts"), "utf8");
const optimizeAssetsSource = readFileSync(resolve(currentDir, "../scripts/optimize-assets.mjs"), "utf8");

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

test("enemy visual recreation key ignores equipment changes", () => {
  const loadoutKeySource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function getFighterLoadoutKey"),
    arenaSceneSource.indexOf("function destroyFighterVisual"),
  );

  assert.equal(loadoutKeySource.includes("equipment:"), false);
  assert.equal(loadoutKeySource.includes("name: fighter.name"), true);
  assert.equal(loadoutKeySource.includes("visualPreset: fighter.visualPreset"), true);
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
  const equipmentAnchorSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function syncPaperDollEquipmentAnchor"),
    arenaSceneSource.indexOf("function getPaperDollEquipmentAnchorParts"),
  );

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
  assert.match(arenaSceneSource, /backGlove:\s*30,[\s\S]*frontGlove:\s*30,[\s\S]*shield:\s*40/);
  assert.equal(arenaSceneSource.includes("sortPaperDollEquipmentLayer(equipmentLayer, anchorContainer, slotKey);"), true);
  assert.equal(arenaSceneSource.includes('equipmentLayer.sort("paperDollEquipmentLayerOrder"'), true);
  assert.equal(arenaSceneSource.includes("createPaperDollAnchoredEquipmentContainer"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollEquipmentAnchors(rig);"), true);
  assert.equal(arenaSceneSource.includes("function applyPaperDollBodyPartImageConfig"), true);
  assert.equal(arenaSceneSource.includes("getBodyPresetTuning(bodyPresetKey).bodyPartLayers[partKey]"), true);
  assert.equal(arenaSceneSource.includes("image.x += tuning.x;"), true);
  assert.equal(arenaSceneSource.includes("equipmentLayer.add(anchorContainer);"), true);
  assert.equal(arenaSceneSource.includes("partContainer.add(armorContainer);"), false);
  assert.equal(equipmentAnchorSource.includes("anchor.x = sourcePart.x;"), true);
  assert.equal(equipmentAnchorSource.includes("anchor.y = sourcePart.y;"), true);
  assert.equal(equipmentAnchorSource.includes("anchor.angle = sourcePart.angle;"), true);
  assert.equal(equipmentAnchorSource.includes("anchor.scaleX = sourcePart.scaleX;"), true);
  assert.equal(equipmentAnchorSource.includes("anchor.scaleY = sourcePart.scaleY;"), true);
  assert.equal(equipmentAnchorSource.includes("getPaperDollEquipmentAnchorScale"), false);
  assert.equal(equipmentAnchorSource.includes("getScaleDirection"), false);
});

test("debug body art mode drags artwork without moving rig anchors", () => {
  const beginDragSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("private beginRigPartDrag"),
    arenaSceneSource.indexOf("private beginEquipmentDrag"),
  );
  const dragSource = arenaSceneSource.slice(arenaSceneSource.indexOf("private dragRigPart"), arenaSceneSource.indexOf("private dragEquipment"));
  const rotateSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("private rotateSelectedWithWheel"),
    arenaSceneSource.indexOf("private rotateSelectedRigPartsWithWheel"),
  );

  assert.equal(beginDragSource.includes('debugTuning.characterCanvasEditMode !== "parts" && debugTuning.characterCanvasEditMode !== "bodyArt"'), true);
  assert.equal(beginDragSource.includes("isRigPartGroupSelectPointer(pointer)"), true);
  assert.equal(beginDragSource.includes("getDebugRigPartSelectionGroup(partKey)"), true);
  assert.equal(beginDragSource.includes('debugTuning.characterCanvasEditMode === "bodyArt" || !selectedRigParts.includes(partKey)'), false);
  assert.equal(dragSource.includes('debugTuning.characterCanvasEditMode === "bodyArt"'), true);
  assert.equal(dragSource.includes("updateBodyPartLayersWithInteractivePointerDelta("), true);
  assert.equal(rotateSource.includes("this.rotateSelectedBodyArtWithWheel(deltaY);"), true);
  assert.equal(arenaSceneSource.includes("function updateBodyPartLayersWithInteractivePointerDelta"), true);
  assert.equal(arenaSceneSource.includes("function updateBodyPartLayersWithInteractiveDelta"), true);
  assert.equal(arenaSceneSource.includes("function getPaperDollBodyPartDragLocalPoint"), true);
  assert.equal(arenaSceneSource.includes("part.getWorldTransformMatrix().applyInverse(worldX, worldY)"), true);
  assert.equal(arenaSceneSource.includes("bodyPartLayers: nextBodyPartLayers"), true);
  assert.equal(arenaSceneSource.includes('["backUpperArm", "backForearm", "backHand"]'), true);
  assert.equal(arenaSceneSource.includes('["frontUpperArm", "frontForearm", "frontHand"]'), true);
  assert.equal(arenaSceneSource.includes('["backThigh", "backShin", "backFoot"]'), true);
  assert.equal(arenaSceneSource.includes('["frontThigh", "frontShin", "frontFoot"]'), true);
  assert.equal(arenaSceneSource.includes("function isRigPartGroupSelectPointer"), true);
  assert.equal(arenaSceneSource.includes("event?.altKey"), true);
  assert.equal(arenaSceneSource.includes("function getPivotRotatedDebugRigParts"), true);
  assert.equal(arenaSceneSource.includes("function getMatchingDebugRigPartSelectionGroup"), true);
  assert.equal(arenaSceneSource.includes("function rotateDebugRigPartGroupAroundAnchor"), true);
  assert.equal(arenaSceneSource.includes("const rotatedPose = getPivotRotatedDebugRigParts(animation[poseKey], partKeys, delta);"), true);
  assert.equal(arenaSceneSource.includes("const rotatedRigParts = getPivotRotatedDebugRigParts(target.keyframe.rigParts, partKeys, delta);"), true);
  assert.equal(arenaSceneSource.includes("const anchorPivot = PAPER_DOLL_PART_PIVOTS[anchorKey];"), true);
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
  assert.match(partVisualSource, /if \(key === "backHand"\) \{[\s\S]*addPaperDollWeaponVisual\(target, partContainer, equipmentLayers, equipmentAnchors, "weaponMain", options\.weaponMainAssetKey, equipment\);[\s\S]*addPaperDollWeaponVisual\(target, partContainer, equipmentLayers, equipmentAnchors, "weaponBow", options\.weaponBowAssetKey, equipment\);[\s\S]*\}/);
  assert.match(weaponVisualSource, /assetKey: string \| undefined/);
  assert.match(weaponVisualSource, /if \(assetKey && target\.textures\.exists\(assetKey\)\) \{[\s\S]*weaponContainer\.add\(image\);[\s\S]*\}/);
  assert.match(weaponVisualSource, /addPaperDollWeaponTopOverlay/);
  assert.match(weaponVisualSource, /registerPaperDollEquipmentSlot\(weaponContainer, equipment, slotKey, config\);/);
  assert.match(weaponOverlaySource, /if \(assetKey && target\.textures\.exists\(assetKey\)\) \{[\s\S]*topContainer\.add\(topImage\);[\s\S]*\}/);
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
  assert.equal(arenaSceneSource.includes("syncPaperDollShadowSilhouette(shadow, visibility, visibilitySlotKeys)"), true);
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

test("paper doll low shadow uses one tunable contact ellipse", () => {
  assert.equal(arenaSceneSource.includes("function createPaperDollLowShadow("), true);
  assert.equal(arenaSceneSource.includes("target.add.ellipse(x, y, 94, 25, PAPER_DOLL_SHADOW_COLOR, 1)"), true);
  assert.equal(arenaSceneSource.includes("softOuter"), false);
  assert.equal(arenaSceneSource.includes("bodyContact"), false);
  assert.equal(arenaSceneSource.includes("footContact"), false);
  assert.equal(arenaSceneSource.includes("debugTuning.lowShadowOffsetY"), true);
  assert.equal(arenaSceneSource.includes("fighter.lowShadow.x = centerX + debugTuning.lowShadowOffsetX * scale;"), true);
  assert.equal(arenaSceneSource.includes("fighter.lowShadow.scaleX = lowShadowScale * debugTuning.lowShadowScaleX;"), true);
  assert.equal(arenaSceneSource.includes("fighter.lowShadow.scaleY = lowShadowScale * debugTuning.lowShadowScaleY;"), true);
  assert.equal(arenaSceneSource.includes("fighter.lowShadow.setAlpha(lowShadowVisible ? debugTuning.lowShadowAlpha : 0);"), true);
  assert.equal(arenaSceneSource.includes("alpha * debugTuning.lowShadowAlpha"), true);
  assert.equal(arenaSceneSource.includes("function getEffectiveArenaShadowMode("), true);
  assert.equal(arenaSceneSource.includes("debugTuning.shadowPreviewMode"), true);
  assert.equal(arenaSceneSource.includes(".ellipse(options.x, initialFeetY + 8, 68, 18, 0x35180d, 0.22)"), false);
  assert.equal(arenaSceneSource.includes("alpha * 0.26"), false);
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
  assert.equal(arenaSceneSource.includes("sync(nextState: CombatState, options: ArenaSyncOptions = {}): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("const prepared = await this.prepareStateVisuals(nextState, { animateActions: true, hudState: options.hudState });"), true);
  assert.equal(arenaSceneSource.includes("const actionAnimations: Promise<void>[] = []"), true);
  assert.equal(arenaSceneSource.includes("playerActionAnimation = animateActionSequence("), true);
  assert.equal(arenaSceneSource.includes("enemyActionAnimation = animateActionSequence("), true);
  assert.equal(arenaSceneSource.includes("playerActionAnimation.done"), true);
  assert.equal(arenaSceneSource.includes("const playerResultDelay = playerActionAnimation?.impact;"), true);
  assert.equal(arenaSceneSource.includes("const enemyResultDelay = enemyActionAnimation?.impact;"), true);
  assert.equal(arenaSceneSource.includes("return Promise.all(actionAnimations).then(() => {"), true);
  assert.equal(arenaSceneSource.includes("resetActiveTurnBodyIdleAnimation(visuals, previousState, nextState, this.time.now);"), true);
  assert.equal(arenaSceneSource.includes("function playBodyAnimationOnce"), true);
  assert.equal(arenaSceneSource.includes("function applyBodyAnimationKeyframesAtProgress"), true);
  assert.equal(arenaSceneSource.includes("function sampleBodyAnimationKeyframePose"), true);
  assert.equal(arenaSceneSource.includes("function applyBodyAnimationWeaponMirrors"), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollWeaponMirror(rig.equipment.weaponMain"), true);
  assert.equal(arenaSceneSource.includes("function applyPaperDollWeaponImageMirror"), true);
  assert.equal(arenaSceneSource.includes("const image = getPaperDollEquipmentSlotImage(slot);"), true);
  assert.equal(arenaSceneSource.includes("image.x = config.localX;"), true);
  assert.equal(arenaSceneSource.includes("image.y = config.localY;"), true);
  assert.equal(arenaSceneSource.includes("image.scaleX = Math.abs(image.scaleX) * (mirrorX ? -1 : 1);"), true);
  assert.equal(arenaSceneSource.includes("part.scaleX = baseScaleX * (mirrorX ? -1 : 1);"), false);
  assert.equal(arenaSceneSource.includes("weaponOffset"), false);
  assert.equal(arenaSceneSource.includes("emitDebugCharacterEquipmentDelta(this.animationWeaponDragState"), true);
  assert.equal(arenaSceneSource.includes("enableDebugPaperDollAnimationWeaponPicking"), true);
  assert.equal(arenaSceneSource.includes("syncDebugPaperDollAnimationWeaponPicking"), true);
  assert.equal(arenaSceneSource.includes("function getPaperDollAnimationWeaponPickTargets"), true);
  assert.equal(arenaSceneSource.includes("[slot, ...getLinkedPaperDollEquipmentSlots(slot)]"), true);
  assert.equal(arenaSceneSource.includes("function syncDebugPaperDollAnimationWeaponPickTarget"), true);
  assert.equal(arenaSceneSource.includes("? this.getPreviewEquipment()"), true);
  assert.equal(arenaSceneSource.includes("image.scaleX < 0"), true);
  assert.equal(arenaSceneSource.includes("image.scaleY < 0"), true);
  assert.equal(arenaSceneSource.includes("function applyBodyAnimationRootOffset"), true);
  assert.equal(arenaSceneSource.includes("function updateAnimationRootOffsetWithInteractiveDelta"), true);
  assert.equal(arenaSceneSource.includes("private dragAnimationRoot(pointer: Phaser.Input.Pointer): void"), true);
  assert.equal(arenaSceneSource.includes("paperDollAnimationRootBases"), true);
  assert.equal(arenaSceneSource.includes("worldOffsetX: number;"), true);
  assert.equal(arenaSceneSource.includes("base.rootX = fighter.body.x - base.worldOffsetX;"), true);
  assert.equal(arenaSceneSource.includes("fighter.lowShadow.x = base.lowShadowX + worldOffsetX;"), true);
  assert.equal(arenaSceneSource.includes("interface DebugAnimationFloorGuide"), true);
  assert.equal(arenaSceneSource.includes('floorLabelText = floorY < 0 ? "game floor above"'), true);
  assert.equal(arenaSceneSource.includes("private syncAnimationFloorGuide"), true);
  assert.equal(arenaSceneSource.includes("function getSelectedDebugAnimationKeyframe"), true);
  assert.equal(arenaSceneSource.includes("updateSelectedDebugAnimationKeyframeRigPartsWithInteractiveDelta"), true);
  assert.equal(arenaSceneSource.includes("getDebugAnimationKeyframeUpdateTarget"), true);
  assert.equal(arenaSceneSource.includes("sampleDebugAnimationPreviewPose"), true);
  assert.equal(
    arenaSceneSource.includes(
      "applyBodyAnimationAtProgress(fighter, animation, tween.getValue() ?? 0, animationAmount);",
    ),
    true,
  );
  assert.equal(arenaSceneSource.includes("speedUp?: (multiplier: number) => void;"), true);
  assert.match(
    arenaSceneSource,
    /if \(fighter\.bodyAnimationLockedUntil === lockedUntil\) \{\s*applyBodyAnimationBlend\(fighter, animation, 0\);\s*fighter\.bodyAnimationLockedUntil = 0;/,
  );
  assert.equal(arenaSceneSource.includes("interface ActionAnimationHandle"), true);
  assert.equal(arenaSceneSource.includes("function animateAction("), true);
  assert.equal(arenaSceneSource.includes("function queueCombatResultAnimation("), true);
});

test("arena resource bars reveal combat damage on impact", () => {
  assert.equal(domUiSource.includes("statsState?: CombatState;"), true);
  assert.equal(domUiSource.includes("renderStats(dom, context.statsState ?? state);"), true);
  assert.equal(mainSource.includes("let displayedStatsState: CombatState = state;"), true);
  assert.equal(mainSource.includes("let statsRevealToken = 0;"), true);
  assert.equal(mainSource.includes("statsState: displayedStatsState"), true);
  assert.equal(mainSource.includes("displayedStatsState = shouldSyncArena ? getPreImpactStatsState(previousState, committedState) : committedState;"), true);
  assert.equal(mainSource.includes("hudState: displayedStatsState"), true);
  assert.equal(mainSource.includes("onImpact: () => revealStatsAfterImpact(statsToken, committedState)"), true);
  assert.equal(mainSource.includes("void actionAnimation.finally(() => revealStatsAfterImpact(statsToken, committedState));"), true);
  assert.equal(mainSource.includes("function revealStatsAfterImpact(token: number, targetState: CombatState): void"), true);
  assert.equal(mainSource.includes("function getPreImpactStatsState(previous: CombatState, current: CombatState): CombatState"), true);
  assert.equal(mainSource.includes("hp: previous.enemy.hp"), true);
  assert.equal(mainSource.includes("armor: previous.enemy.armor"), true);
  assert.equal(mainSource.includes("hp: previous.player.hp"), true);
  assert.equal(mainSource.includes("armor: previous.player.armor"), true);
  assert.equal(debugMainSource.includes("statsState: displayedStatsState"), true);
  assert.equal(debugMainSource.includes("hudState: displayedStatsState"), true);
  assert.equal(debugMainSource.includes("onImpact: () => revealStatsAfterImpact(statsToken, committedState)"), true);
  assert.equal(debugMainSource.includes("void actionAnimation.finally(() => revealStatsAfterImpact(statsToken, committedState));"), true);
  assert.equal(arenaSceneSource.includes("interface ArenaSyncOptions"), true);
  assert.equal(arenaSceneSource.includes("hudState?: CombatState;"), true);
  assert.equal(arenaSceneSource.includes("onImpact?: () => void;"), true);
  assert.equal(arenaSceneSource.includes("const hudImpactDelay = getStateHudImpactDelay(nextState, playerResultDelay, enemyResultDelay);"), true);
  assert.equal(arenaSceneSource.includes("setArenaHudForState(this, nextState);"), true);
  assert.equal(arenaSceneSource.includes("options.onImpact?.();"), true);
  assert.equal(arenaSceneSource.includes("function setArenaHudForState(target: ArenaScene, current: CombatState): void"), true);
  assert.equal(arenaSceneSource.includes("function getStateHudImpactDelay("), true);
  assert.equal(arenaSceneSource.includes("if (current.lastPlayerDamage > 0)"), true);
  assert.equal(arenaSceneSource.includes("if (current.lastEnemyDamage > 0)"), true);
});

test("battle result presentation waits for arena visuals while rewards apply immediately", () => {
  const mainRewardSource = mainSource.slice(
    mainSource.indexOf("function applyBattleRewardIfNeeded"),
    mainSource.indexOf("function rememberBossEquipmentHint"),
  );
  const debugRewardSource = debugMainSource.slice(
    debugMainSource.indexOf("function applyBattleRewardIfNeeded"),
    debugMainSource.indexOf("function handleShopBuy"),
  );

  assert.equal(domUiSource.includes("deferResultPresentation?: boolean;"), true);
  assert.equal(domUiSource.includes('const isResultPresentationDeferred = state.result !== "playing" && context.deferResultPresentation;'), true);
  assert.equal(mainSource.includes("let pendingBattleResultPresentation"), true);
  assert.equal(mainSource.includes('deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation),'), true);
  assert.equal(mainSource.includes("scheduleBattleResultPresentation(actionAnimation);"), true);
  assert.equal(mainSource.includes("battleResultPresentation = pendingBattleResultPresentation;"), true);
  assert.equal(mainSource.includes("markRewardUiRenderDirty();"), true);
  assert.equal(mainSource.includes("flushRewardUiRenderIfDirty();"), true);
  assert.equal(mainRewardSource.includes("pendingBattleResultPresentation = {"), true);
  assert.equal(mainRewardSource.includes("armoryShop?.render();"), false);
  assert.equal(mainRewardSource.includes("weaponShop?.render();"), false);
  assert.equal(debugRewardSource.includes("pendingBattleResultPresentation = {"), true);
  assert.equal(debugRewardSource.includes("weaponShop?.render();"), false);
  assert.equal(debugRewardSource.includes("armoryShop?.render();"), false);
});

test("death effects are queued from combat impact timing", () => {
  assert.equal(arenaSceneSource.includes("const DEATH_SHATTER_AFTER_IMPACT_DELAY = 200;"), true);
  assert.equal(arenaSceneSource.includes("const DEATH_SHATTER_RESULT_SETTLE_DELAY"), true);
  assert.equal(arenaSceneSource.includes("queueDeathEffects(this, actionAnimations, nextState, playerResultDelay, enemyResultDelay);"), true);
  assert.equal(arenaSceneSource.includes("function queueDeathEffects("), true);
  assert.equal(arenaSceneSource.includes("function queueFighterDeathEffect("), true);
  assert.equal(arenaSceneSource.includes("impactDelay.then(() => createSceneDelay(target, DEATH_SHATTER_AFTER_IMPACT_DELAY))"), true);
  assert.equal(arenaSceneSource.includes("scheduleFighterShatter(target, fighter, worldDirection, 0);"), true);
  assert.equal(arenaSceneSource.includes("return createSceneDelay(target, DEATH_SHATTER_RESULT_SETTLE_DELAY);"), true);
});

test("arena render-only refresh does not replay action animations", () => {
  assert.equal(arenaSceneSource.includes("private renderOnlyToken = 0;"), true);
  assert.equal(arenaSceneSource.includes("async renderState(nextState: CombatState): Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("await this.prepareStateVisuals(nextState, { animateActions: false });"), true);
  assert.equal(arenaSceneSource.includes("options: { animateActions: boolean; hudState?: CombatState }"), true);
  assert.equal(arenaSceneSource.includes("const syncToken = options.animateActions ? this.syncToken + 1 : this.syncToken;"), true);
  assert.equal(arenaSceneSource.includes("if (options.animateActions) {"), true);
  assert.equal(arenaSceneSource.includes("this.syncToken = syncToken;"), true);
  assert.equal(arenaSceneSource.includes("options.animateActions ? syncToken !== this.syncToken : renderOnlyToken !== this.renderOnlyToken"), true);
  assert.equal(mainSource.includes("void arenaScene?.renderState(state);"), true);
  assert.equal(debugMainSource.includes("void arenaScene?.renderState(state);"), true);
});

test("melee attacks expose an impact timing before action completion", () => {
  assert.equal(arenaSceneSource.includes("interface MeleeActionTiming"), true);
  assert.equal(arenaSceneSource.includes("const MELEE_ACTION_TIMINGS"), true);
  assert.equal(arenaSceneSource.includes("function getMeleeActionTimeline("), true);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationImpactDelayMs("), true);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationImpactKeyframe("), true);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationStartKeyframe("), false);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationPlaybackWindow("), false);
  assert.equal(arenaSceneSource.includes("const impactKeyframe = getBodyAnimationImpactKeyframe(animation);"), true);
  assert.equal(arenaSceneSource.includes("return Math.max(1, Math.round(clampNumber(impactKeyframe.time, 0, duration)));"), true);
  assert.equal(arenaSceneSource.includes("impact = createSceneDelay(target, timeline.impactDelayMs);"), true);
  assert.equal(arenaSceneSource.includes("actionAnimations.push(impact);"), true);
  assert.equal(arenaSceneSource.includes("playWeaponSwing(target, actor, sign, animationAmount, timeline)"), true);
  assert.equal(arenaSceneSource.includes("void impact.then(() => showSlashArc(target, actor, actionId, direction, playerSettings));"), true);
});

test("lunge exposes an impact timing before action completion", () => {
  assert.equal(arenaSceneSource.includes("const LUNGE_ACTION_IMPACT_PROGRESS"), true);
  assert.match(
    arenaSceneSource,
    /if \(actionId === "lunge"\) \{[\s\S]*const bodyAnimation = playBodyAnimationOnceHandle\(target, actor, animation\);[\s\S]*done: bodyAnimation\.done,[\s\S]*impact: createSceneDelay\(target, getBodyAnimationImpactDelayMs\(animation, LUNGE_ACTION_IMPACT_PROGRESS\)\),[\s\S]*speedUp: bodyAnimation\.speedUp,[\s\S]*\}/,
  );
});

test("damaging lunge speeds up its remaining body animation after impact", () => {
  assert.equal(arenaSceneSource.includes("const DAMAGING_LUNGE_AFTER_IMPACT_TIME_SCALE = 1.6;"), true);
  assert.equal(arenaSceneSource.includes("function speedUpDamagingLungeAfterImpact("), true);
  assert.equal(arenaSceneSource.includes("speedUpDamagingLungeAfterImpact(playerActionAnimation, lastPlayerAction, nextState.lastPlayerDamage);"), true);
  assert.equal(arenaSceneSource.includes("speedUpDamagingLungeAfterImpact(enemyActionAnimation, lastEnemyAction, nextState.lastEnemyDamage);"), true);
  assert.equal(arenaSceneSource.includes('if (actionId !== "lunge" || damage <= 0 || !actionAnimation?.speedUp)'), true);
  assert.equal(arenaSceneSource.includes("void impact.then(() => actionAnimation.speedUp?.(DAMAGING_LUNGE_AFTER_IMPACT_TIME_SCALE));"), true);
  assert.equal(arenaSceneSource.includes("function playBodyAnimationOnceHandle("), true);
  assert.equal(arenaSceneSource.includes("tween.setTimeScale(Math.max(1, multiplier));"), true);
});

test("fighter movement can start from a selected animation keyframe", () => {
  assert.equal(arenaSceneSource.includes("function getBodyAnimationMovementStartDelayMs("), true);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationMovementStartKeyframe("), true);
  assert.equal(arenaSceneSource.includes("animation.movementStartKeyframeId"), true);
  assert.match(
    arenaSceneSource,
    /getBodyAnimationMovementStartDelayMs\(\s*current\.lastPlayerAction,\s*visuals\.player,\s*getFighterBodyAnimationWeaponClass\(current\.player\),/,
  );
  assert.match(
    arenaSceneSource,
    /getBodyAnimationMovementStartDelayMs\(\s*current\.lastEnemyAction,\s*visuals\.enemy,\s*getFighterBodyAnimationWeaponClass\(current\.enemy\),/,
  );
  assert.equal(arenaSceneSource.includes("pickActiveBodyAnimationVariant(animationKey, fighter.paperDollRig?.bodyPresetKey, weaponClass, variantSeed)"), true);
  assert.equal(arenaSceneSource.includes('if (actionId === "lunge")'), true);
  assert.equal(arenaSceneSource.includes("setFighterX(target, fighter, x, movementDelayMs);"), true);
  assert.equal(arenaSceneSource.includes("isAxeLungeMovementStartDustAction(current.lastPlayerAction, current.player.weaponClass)"), true);
  assert.equal(arenaSceneSource.includes("isAxeLungeMovementStartDustAction(current.lastEnemyAction, current.enemy.weaponClass)"), true);
  assert.equal(arenaSceneSource.includes('return actionId === "lunge" && weaponClass === "axe";'), true);
  assert.equal(arenaSceneSource.includes("if (shouldShowMovementStartDust)"), true);
  assert.equal(arenaSceneSource.includes("scheduleMovementStartDustBurst(target, startX, feetY, movementDeltaX, movementDelayMs, playerSettings);"), true);
  assert.equal(arenaSceneSource.includes("function createMovementStartDustBurst("), true);
  assert.equal(arenaSceneSource.includes("delay,"), true);
  assert.equal(arenaSceneSource.includes("const duration = Math.max(1, animation.duration / speedMultiplier);"), true);
  assert.equal(arenaSceneSource.includes("applyBodyAnimationAtProgress(fighter, animation, 0, animationAmount);"), true);
  assert.equal(arenaSceneSource.includes("getBodyAnimationPlaybackProgress"), false);
});

test("arena action body animations can pick weighted weapon-specific variants", () => {
  const variantPickerSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function pickActiveBodyAnimationVariant"),
    arenaSceneSource.indexOf("function getActiveSlashArc"),
  );

  assert.equal(variantPickerSource.includes("function pickActiveBodyAnimationVariant("), true);
  assert.equal(variantPickerSource.includes("getBodyAnimationRuntimeVariants(slot)"), true);
  assert.equal(variantPickerSource.includes("doesBodyAnimationVariantMatchWeapon"), true);
  assert.equal(variantPickerSource.includes("isBodyAnimationVariantSpecificToWeapon"), true);
  assert.equal(variantPickerSource.includes("weaponSpecificCandidates.length > 0 ? weaponSpecificCandidates"), true);
  assert.equal(variantPickerSource.includes("animation.variantWeight ?? 1"), true);
  assert.equal(variantPickerSource.includes("hashStringToUnit(seed)"), true);
  assert.equal(variantPickerSource.includes("BODY_ANIMATION_DEFAULT_VARIANT_ID"), true);
  assert.equal(variantPickerSource.includes("BODY_ANIMATION_WEAPON_CLASSES"), true);
  assert.equal(arenaSceneSource.includes("function getBodyAnimationVariantSeed("), true);
  assert.equal(arenaSceneSource.includes("function getFighterBodyAnimationWeaponClass(fighter: FighterState): HeroWeaponClass | undefined"), true);
  assert.equal(arenaSceneSource.includes('if (activeWeaponClass === "bow")'), true);
  assert.equal(arenaSceneSource.includes("return fighter.equipment?.weaponMain ? activeWeaponClass : undefined;"), true);
  assert.equal(arenaSceneSource.includes("getFighterBodyAnimationWeaponClass(nextState.player)"), true);
  assert.equal(arenaSceneSource.includes("getFighterBodyAnimationWeaponClass(nextState.enemy)"), true);
  assert.equal(arenaSceneSource.includes("variantSeed?: string;"), true);
  assert.equal(arenaSceneSource.includes("const variantSeed = options.variantSeed ??"), true);
  assert.equal(arenaSceneSource.includes('pickActiveBodyAnimationVariant("lunge", actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed)'), true);
  assert.equal(arenaSceneSource.includes("pickActiveBodyAnimationVariant(bodyAnimationKey, actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed)"), true);
  assert.equal(arenaSceneSource.includes('pickActiveBodyAnimationVariant("bowShot", actor.paperDollRig?.bodyPresetKey, "shuriken", variantSeed)'), true);
  assert.equal(arenaSceneSource.includes('pickActiveBodyAnimationVariant("scrollCast", actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed)'), true);
});

test("debug animation canvas edits write to the selected animation variant", () => {
  const interactiveEditSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function updateAnimationRootOffsetWithInteractiveDelta"),
    arenaSceneSource.indexOf("function getPivotRotatedDebugRigParts"),
  );
  const selectedVariantWriterSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function getSelectedDebugBodyAnimationTarget"),
    arenaSceneSource.indexOf("function setFighterXImmediate"),
  );

  assert.equal(arenaSceneSource.includes("function getSelectedDebugBodyAnimationTarget"), true);
  assert.equal(arenaSceneSource.includes("function updateSelectedDebugBodyAnimation"), true);
  assert.equal(interactiveEditSource.includes("getSelectedDebugBodyAnimationTarget()"), true);
  assert.equal(interactiveEditSource.includes("updateSelectedDebugBodyAnimation(nextAnimation"), true);
  assert.equal(interactiveEditSource.includes("[animationKey]: nextAnimation"), false);
  assert.equal(selectedVariantWriterSource.includes("debugTuning.selectedBodyAnimationVariantId"), true);
  assert.equal(selectedVariantWriterSource.includes("variant.variantId === selectedAnimation.variantId"), true);
  assert.equal(selectedVariantWriterSource.includes("variants: (selectedAnimation.slot.variants ?? []).map"), true);
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
  assert.equal(arenaSceneSource.includes("const playerResultDelay = playerActionAnimation?.impact;"), true);
  assert.equal(arenaSceneSource.includes("void impact.then(() => showSlashArc(target, actor, actionId, direction, playerSettings));"), true);
  assert.equal(arenaSceneSource.includes('getActiveBodyAnimation("hit",'), true);
  assert.equal(arenaSceneSource.includes("nextState.lastPlayerDamage > 0"), true);
  assert.equal(arenaSceneSource.includes("nextState.lastEnemyDamage > 0"), true);
});

test("scroll actions use the editable scroll cast body animation", () => {
  assert.equal(arenaSceneSource.includes("SCROLL_CAST_ACTION_TIMINGS"), true);
  assert.equal(arenaSceneSource.includes("function animateScrollCastAction"), true);
  assert.equal(arenaSceneSource.includes('scroll: { propAssetKey: "scroll-crack-armor-01"'), true);
  assert.equal(arenaSceneSource.includes('fireball: { propAssetKey: "scroll-fireball-01"'), true);
  assert.equal(arenaSceneSource.includes('label: "SCROLL"'), false);
  assert.equal(arenaSceneSource.includes('label: "FIRE"'), false);
  assert.equal(arenaSceneSource.includes("timing.label"), false);
  assert.equal(arenaSceneSource.includes("timing.color"), false);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-crack-armor-01"'), true);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-fireball-01"'), true);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-ward-01"'), true);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-precise-strike-01"'), true);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-double-strike-01"'), true);
  assert.equal(arenaSceneSource.includes('propAssetKey: "scroll-poison-01"'), true);
  assert.equal(arenaSceneSource.includes('pickActiveBodyAnimationVariant("scrollCast"'), true);
  assert.equal(arenaSceneSource.includes("actor.scrollCastPropAssetKey = timing.propAssetKey;"), true);
  assert.equal(arenaSceneSource.includes("actor.scrollCastPropAssetKey = previousScrollCastPropAssetKey;"), true);
  assert.equal(arenaSceneSource.includes('actionId === "fireball"'), true);
  assert.equal(arenaSceneSource.includes("playFireballProjectileFromScroll(target, actor, defender, direction, impactDelayMs)"), true);
  assert.equal(arenaSceneSource.includes("getBodyAnimationImpactKeyframe(animation)"), true);
  assert.equal(arenaSceneSource.includes("getBodyAnimationImpactDelayMs(animation, timing.impactProgress)"), true);
  assert.equal(arenaSceneSource.includes("function applyBodyAnimationCastProp"), true);
  assert.equal(arenaSceneSource.includes("fighter.scrollCastPropAssetKey ?? tuning.assetKey ?? DEFAULT_SCROLL_CAST_PROP_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("castProp?: FighterPart"), true);
  assert.equal(arenaSceneSource.includes("rootContainer.add(castProp);"), true);
  assert.equal(arenaSceneSource.includes("SCROLL_CAST_PROP_ASSETS.forEach((asset) => target.load.image(asset.key, asset.url));"), true);
  assert.equal(assetsSource.includes("SCROLL_CAST_PROP_ASSETS"), true);
  [
    "scroll-crack-armor-01.webp",
    "scroll-fireball-01.webp",
    "scroll-ward-01.webp",
    "scroll-precise-strike-01.webp",
    "scroll-double-strike-01.webp",
    "scroll-poison-01.webp",
  ].forEach((assetName) => {
    assert.equal(existsSync(resolve(currentDir, `../src/assets/shop-icons/${assetName}`)), true);
  });
});

test("prod body animations use the active body preset tuning", () => {
  const activeAnimationSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function getActiveBodyAnimation"),
    arenaSceneSource.indexOf("function getActiveSlashArc"),
  );

  assert.match(activeAnimationSource, /return getBodyPresetTuning\(presetKey\)\.bodyAnimations\[key\] \?\? DEFAULT_BODY_ANIMATIONS\[key\];/);
  assert.equal(activeAnimationSource.includes("return DEFAULT_BODY_ANIMATIONS[key];"), false);
});

test("ward shield VFX plays in gameplay and animation debug preview", () => {
  assert.equal(assetsSource.includes("WARD_SHIELD_EFFECT_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/effects/ward.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/effects/ward.webp")), true);
  assert.ok(statSync(resolve(currentDir, "../src/assets/ui/effects/ward.webp")).size < 20 * 1024);
  assert.equal(arenaSceneSource.includes("target.load.image(WARD_SHIELD_EFFECT_ASSET_KEY, WARD_SHIELD_EFFECT_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("WARD_SHIELD_EFFECT_ASSET_URL,"), true);
  assert.equal(arenaSceneSource.includes('void impact.then(() => playWardShieldEffect(target, actor, "cast"));'), true);
  assert.equal(arenaSceneSource.includes('void playWardShieldEffect(target, fighter, "absorb");'), true);
  assert.equal(arenaSceneSource.includes("this.load.image(WARD_SHIELD_EFFECT_ASSET_KEY, WARD_SHIELD_EFFECT_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("previewDebugAnimationWardShield"), true);
  assert.equal(arenaSceneSource.includes("debugAnimationScene?.previewWardShield();"), true);
  assert.equal(arenaSceneSource.includes('void playWardShieldEffect(this, this.fighter, "cast", { force: true });'), true);
  assert.equal(arenaSceneSource.includes("DEFAULT_WARD_SHIELD_TUNING"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.wardShield ?? DEFAULT_WARD_SHIELD_TUNING"), true);
  assert.equal(arenaSceneSource.includes("previewWardShield()"), true);
  assert.equal(arenaSceneSource.includes("function playWardShieldEffect("), true);
  assert.equal(arenaSceneSource.includes("function getFighterWardShieldEffectPoint("), true);
  assert.equal(arenaSceneSource.includes("WARD_SHIELD_BASE_SCREEN_HEIGHT"), true);
  assert.equal(arenaSceneSource.includes("WARD_SHIELD_CENTER_Y_RATIO"), true);
  assert.equal(optimizeAssetsSource.includes("ui\\/effects\\/ward\\.png"), true);
});

test("arena uses pooled projectiles for arrows shurikens and fireballs", () => {
  assert.equal(assetsSource.includes("SHURIKEN_PROJECTILE_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/projectiles/shuriken.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/projectiles/shuriken.webp")), true);
  assert.equal(assetsSource.includes("FIREBALL_PROJECTILE_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/projectiles/fireball.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/projectiles/fireball.webp")), true);
  assert.ok(statSync(resolve(currentDir, "../src/assets/ui/projectiles/fireball.webp")).size < 8 * 1024);
  assert.equal(arenaSceneSource.includes("target.load.image(SHURIKEN_PROJECTILE_ASSET_KEY, SHURIKEN_PROJECTILE_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("target.load.image(FIREBALL_PROJECTILE_ASSET_KEY, FIREBALL_PROJECTILE_ASSET_URL);"), true);
  assert.equal(arenaSceneSource.includes("SHURIKEN_PROJECTILE_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("FIREBALL_PROJECTILE_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("projectiles: Phaser.GameObjects.Image[];"), true);
  assert.equal(arenaSceneSource.includes("projectiles: []"), true);
  assert.equal(arenaSceneSource.includes("function playProjectile("), true);
  assert.equal(arenaSceneSource.includes("function playFireballProjectileFromScroll("), true);
  assert.equal(arenaSceneSource.includes("function getFighterScrollCastProjectilePoint("), true);
  assert.equal(arenaSceneSource.includes("interface ProjectileAnimationHandle"), true);
  assert.equal(arenaSceneSource.includes("PROJECTILE_IMPACT_LEAD_MS"), true);
  assert.equal(arenaSceneSource.includes("FIREBALL_PROJECTILE_START_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("FIREBALL_PROJECTILE_END_SCREEN_SIZE"), true);
  assert.equal(arenaSceneSource.includes("FIREBALL_PROJECTILE_FLIGHT_DURATION_MS"), true);
  assert.equal(arenaSceneSource.includes("FIREBALL_PROJECTILE_LAUNCH_PROGRESS"), false);
  assert.equal(arenaSceneSource.includes("const launchDelayMs = Math.max(0, castImpactDelayMs);"), true);
  assert.equal(arenaSceneSource.includes("const hitDelayMs = launchDelayMs + FIREBALL_PROJECTILE_FLIGHT_DURATION_MS;"), true);
  assert.equal(arenaSceneSource.includes("impactDelayMs"), true);
  assert.equal(arenaSceneSource.includes("resolveImpactOnce"), true);
  assert.equal(arenaSceneSource.includes("impact: projectileAnimation.impact"), true);
  assert.equal(arenaSceneSource.includes("playFireballProjectileFromScroll(target, actor, defender, direction, impactDelayMs)"), true);
  assert.equal(arenaSceneSource.includes("scaleX: endScale"), true);
  assert.equal(arenaSceneSource.includes("scaleY: endScale"), true);
  assert.equal(arenaSceneSource.includes("duration: FIREBALL_PROJECTILE_FLIGHT_DURATION_MS"), true);
  assert.equal(optimizeAssetsSource.includes("ui\\/projectiles\\/fireball\\.png"), true);
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
  assert.equal(combatEquipmentSource.includes("slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS"), true);
  assert.equal(combatEquipmentSource.includes("syncPaperDollEquipmentState(rig, slotKeys, equipment);"), true);
  assert.match(combatEquipmentSource, /syncPaperDollEquipmentState\(rig, slotKeys, equipment\);[\s\S]*syncFighterCombatWeaponVisibility\(rig, state\);/);
  assert.equal(combatEquipmentSource.includes("syncFighterCombatWeaponVisibility(rig.shadow, state);"), true);
  assert.equal(combatEquipmentSource.includes("const hasBowVisual = Boolean(rig.equipment.weaponBow && getPaperDollEquipmentSlotImage(rig.equipment.weaponBow));"), true);
  assert.equal(combatEquipmentSource.includes("setPaperDollEquipmentSlotVisible(rig.equipment.weaponMain, hasMainWeapon && (!bowActive || !hasBowVisual));"), true);
  assert.equal(combatEquipmentSource.includes("setPaperDollEquipmentSlotVisible(rig.equipment.weaponBow, bowActive && (hasBowWeapon || hasBowVisual));"), true);
});

test("arena reuses player settings snapshots during frame work", () => {
  assert.equal(arenaSceneSource.includes("const playerSettings = getPlayerSettings();"), true);
  assert.equal(arenaSceneSource.includes("getArenaAnimationAmount()"), true);
  assert.equal(arenaSceneSource.includes("renderScene(this, nextState, playerSettings, options.hudState);"), true);
  assert.equal(arenaSceneSource.includes("playerSettings.shadowMode"), true);
  assert.equal(arenaSceneSource.includes("function getArenaAnimationAmount(): number"), true);
  assert.equal(arenaSceneSource.includes("return 1;"), true);
});

test("phaser games request a low power webgl context", () => {
  assert.equal(arenaSceneSource.includes("const PHASER_SMOOTH_RENDER_CONFIG: Phaser.Types.Core.RenderConfig"), true);
  assert.equal(arenaSceneSource.includes("const PHASER_SHARP_RENDER_CONFIG: Phaser.Types.Core.RenderConfig"), true);
  assert.equal(arenaSceneSource.includes('powerPreference: "low-power"'), true);
  assert.equal(arenaSceneSource.includes("function getPlayerPhaserRenderConfig(): Phaser.Types.Core.RenderConfig"), true);
  assert.equal(arenaSceneSource.includes("getPlayerSettings().smoothRendering ? PHASER_SMOOTH_RENDER_CONFIG : PHASER_SHARP_RENDER_CONFIG"), true);
  assert.match(arenaSceneSource, /PHASER_SMOOTH_RENDER_CONFIG[\s\S]*antialias:\s*true,[\s\S]*antialiasGL:\s*true,/);
  assert.match(arenaSceneSource, /PHASER_SHARP_RENDER_CONFIG[\s\S]*antialias:\s*false,[\s\S]*antialiasGL:\s*false,/);
  assert.equal((arenaSceneSource.match(/render: getPlayerPhaserRenderConfig\(\)/g) ?? []).length, 4);
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
  assert.match(arenaSceneSource, /PHASER_THIRTY_FPS_CONFIG[\s\S]*target:\s*30,/);
  assert.match(arenaSceneSource, /PHASER_SIXTY_FPS_CONFIG[\s\S]*target:\s*60,/);
  assert.equal(arenaSceneSource.includes("limit: 30"), false);
  assert.equal(arenaSceneSource.includes("limit: 60"), false);
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
  assert.equal(arenaSceneSource.includes("private async prepareStateVisuals("), true);
  assert.equal(arenaSceneSource.includes("options: { animateActions: boolean; hudState?: CombatState }"), true);
  assert.equal(arenaSceneSource.includes("private startArenaEntryTransition(current: CombatState): Promise<void> | undefined"), true);
  assert.equal(arenaSceneSource.includes("getArenaEntryStartCameraTarget(finalTarget)"), true);
  assert.equal(arenaSceneSource.includes("tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS"), true);
  assert.equal(arenaSceneSource.includes('target.arenaEntryTransitionState === "running"'), true);
});

test("arena parallax can be tuned from debug settings", () => {
  const updateCameraSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function updateCamera("),
    arenaSceneSource.indexOf("function getArenaEntryStartCameraTarget("),
  );

  assert.equal(arenaSceneSource.includes("function getArenaBackgroundLayerTuningForTier("), true);
  assert.equal(arenaSceneSource.includes("variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID"), true);
  assert.equal(arenaSceneSource.includes("function getArenaBackgroundLayerParallaxForTier("), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundTuningTierId(layers.backgroundTierId)"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundVariantId ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier1BackFollowY"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2BackFollowY"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier1MidLookUpY"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2MidLookUpY"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier1GroundZoom"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2GroundZoom"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2FrontFollowX"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2AmbientFollowX"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2AmbientFarAlpha"), true);
  assert.equal(arenaSceneSource.includes("source.arenaTier2AmbientNearAlpha"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundLayerIds.forEach((layerKey)"), true);
  assert.equal(arenaSceneSource.includes("getArenaLayerTransform(layer, cameraTarget, tuningLayer.parallax)"), true);
  assert.equal(arenaSceneSource.includes("clampArenaBackgroundLayerTransformToViewport("), true);
  assert.equal(arenaSceneSource.includes("image.displayWidth * transform.scale"), true);
  assert.equal(arenaSceneSource.includes("right < cameraTarget.viewportWidth"), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundLayerCameraAlpha(layerKey, tuningLayer, cameraTarget)"), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundLayerImmediateAlpha(target, layerKey, tierId, variantId, current)"), true);
  assert.equal(arenaSceneSource.includes("isArenaBackgroundLayerCameraAlphaManaged(layerKey)"), true);
  assert.equal(arenaSceneSource.includes("!isDebugTuningActive() && layers.backgroundTierId === assetSet.tierId"), true);
  assert.equal(arenaSceneSource.includes("const isNewImage = !image;"), true);
  assert.equal(arenaSceneSource.includes("const isTextureChange = !!image && image.texture.key !== config.key;"), true);
  assert.equal(arenaSceneSource.includes("isNewImage || isTextureChange || isTierChange"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundViewportKey === viewportKey"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundViewportKey = getArenaBackgroundViewportKey(target);"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_ROLE_COVER_ANCHOR_Y"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_VIEWPORT_COVER_START_SCALE"), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundViewportCoverScale(getArenaViewport(target))"), true);
  assert.equal(arenaSceneSource.includes("viewportAspect >= designAspect"), true);
  assert.equal(arenaSceneSource.includes("rawCoverScale * ARENA_BACKGROUND_VIEWPORT_COVER_OVERSCAN"), true);
  assert.equal(arenaSceneSource.includes('applyArenaBackgroundLayerLayout(target, image, layout, config.role, { applyAlpha: !isArenaBackgroundLayerCameraAlphaManaged(layerKey) })'), true);
  assert.equal(arenaSceneSource.includes("getArenaLayerTransforms(layers, cameraTarget, debug)"), true);
  assert.equal(arenaSceneSource.includes("tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS, ARENA_ENTRY_TRANSITION_EASE, debug)"), true);
  assert.equal(arenaSceneSource.includes("arenaTier1MidZoomDarken"), true);
  assert.equal(arenaSceneSource.includes("arenaTier2MidZoomDarken"), true);
  assert.equal(arenaSceneSource.includes('variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID || scopedTierId > 2'), true);
  assert.equal(arenaSceneSource.includes("tuning.parallax.farAlpha"), true);
  assert.equal(arenaSceneSource.includes("tuning.parallax.nearAlpha"), true);
  assert.equal(arenaSceneSource.includes("isArenaBackgroundLayerCameraAlphaManaged(layerKey) ? { ...layout, alpha: 1 } : layout"), true);
  assert.equal(arenaSceneSource.includes("return clamp01(cameraAlpha);"), true);
  assert.equal(arenaSceneSource.includes("tuning.layout.alpha * cameraAlpha"), false);
  assert.equal(updateCameraSource.includes("targets: transform.alphaImage"), true);
  assert.equal(updateCameraSource.includes("alpha: transform.alpha"), true);
  assert.equal(arenaSceneSource.includes("syncArenaMidLayerTint"), true);
  assert.equal(arenaSceneSource.includes("ARENA_MID_LAYER_CLOSE_TINT"), true);
});

test("arena tier two uses the forest background layer set", () => {
  [
    "arena-tier-2-back.webp",
    "arena-tier-2-ground.webp",
    "arena-tier-2-front-trees.webp",
    "arena-tier-2-ambient-particles.webp",
    "arena-tier-2-ambient-2.webp",
    "arena-tier-3-ambient.webp",
    "arena-tier-3-back.webp",
    "arena-tier-3-ground.webp",
    "arena-tier-3-front.webp",
    "arena-tier-4-ambient.webp",
    "arena-tier-4-back.webp",
    "arena-tier-4-back-2.webp",
    "arena-tier-4-ground.webp",
    "arena-tier-5-back.webp",
    "arena-tier-5-ground.webp",
    "arena-tier-8-back.webp",
    "arena-tier-8-ground.webp",
    "arena-tier-8-mid.webp",
  ].forEach((assetName) => {
    assert.equal(existsSync(resolve(currentDir, `../src/assets/arena/layers/${assetName}`)), true);
  });

  [
    "arena-tier-2-front-trees.png",
    "arena-tier-2-ambient-particles.png",
    "arena-tier-2-ambient-2.png",
    "arena-tier-3-ambient.png",
    "arena-tier-3-back.png",
    "arena-tier-3-ground.png",
    "arena-tier-3-front.png",
    "arena-tier-4-ambient.png",
    "arena-tier-4-back.png",
    "arena-tier-4-back-2.png",
    "arena-tier-4-ground.png",
    "arena-tier-5-back.png",
    "arena-tier-5-ground.png",
    "arena-tier-8-back.png",
    "arena-tier-8-ground.png",
    "arena-tier-8-mid.png",
  ].forEach((assetName) => {
    assert.equal(existsSync(resolve(currentDir, `../art-source/png/assets/arena/layers/${assetName}`)), true);
  });

  assert.equal(assetsSource.includes("ARENA_BACKGROUND_LAYER_ASSETS"), true);
  assert.equal(assetsSource.includes('import.meta.glob("./assets/arena/layers/arena*.{png,webp}"'), true);
  assert.equal(assetsSource.includes('DEFAULT_ARENA_BACKGROUND_VARIANT_ID = "default"'), true);
  assert.equal(assetsSource.includes("getArenaBackgroundVariantIdsForTier"), true);
  assert.equal(assetsSource.includes("pickArenaBackgroundVariantIdForTier"), true);
  assert.equal(assetsSource.includes("variantId: ArenaBackgroundVariantId"), true);
  assert.equal(assetsSource.includes("arena-tier-(\\d+)-((?:variant|scene)-\\d+)-([a-z0-9-]+)"), true);
  assert.equal(assetsSource.includes("arena-((?:variant|scene)-\\d+)-([a-z0-9-]+)"), true);
  assert.equal(assetsSource.includes("./assets/arena/layers/arena-tier-2-back.webp"), true);
  assert.equal(assetsSource.includes("./assets/arena/layers/arena-tier-2-ground.webp"), true);
  assert.equal(assetsSource.includes("./assets/arena/layers/arena-tier-2-front-trees.webp"), true);
  assert.equal(assetsSource.includes("./assets/arena/layers/arena-tier-2-ambient-particles.webp"), true);
  assert.equal(assetsSource.includes('baseToken === "front-trees"'), true);
  assert.equal(assetsSource.includes('baseToken === "ambient-particles"'), true);
  assert.equal(assetsSource.includes('id: normalized.instance <= 1 ? normalized.role : `${normalized.role}-${normalized.instance}`'), true);
  assert.equal(assetsSource.includes("ARENA_BACKGROUND_LAYER_ORDER.indexOf(normalized.role) * 100 + normalized.instance"), true);
  assert.equal(assetsSource.includes("const instanceMatch = /^(.*?)-([2-9]\\d*)$/u.exec(token);"), true);
  assert.equal(optimizeAssetsSource.includes("smallerAssetRules"), true);
  assert.equal(optimizeAssetsSource.includes("maximumQuality: 46"), true);
  assert.equal(optimizeAssetsSource.includes("maximumAlphaQuality: 70"), true);
  assert.equal(optimizeAssetsSource.includes("2-(?:front-trees|ambient-particles)"), true);
  assert.equal(optimizeAssetsSource.includes("3-(?:back|ground|front)"), true);
  assert.equal(optimizeAssetsSource.includes("4-(?:ambient|back(?:-2)?|ground)"), true);
  assert.equal(optimizeAssetsSource.includes("5-(?:back|ground)"), true);
  assert.equal(optimizeAssetsSource.includes("8-(?:back|ground|mid)"), true);
  assert.equal(optimizeAssetsSource.includes("alphaQuality: targetAlphaQuality"), true);
  assert.equal(assetsSource.includes("./assets/arena/layers/arena-tier-2-mid.webp"), false);
  assert.equal(arenaSceneSource.includes("function createArenaBackgroundAssetSets()"), true);
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_LAYER_ASSETS.forEach"), true);
  assert.equal(arenaSceneSource.includes("variantId: asset.variantId"), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundAssetSetForEncounter(current.encounter)"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundVariantId === assetSet.variantId"), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundLayerIds = assetSet.layers.map((layer) => layer.layer);"), true);
  assert.equal(arenaSceneSource.includes('const backgroundLayerContainers: ArenaLayers["backgroundLayerContainers"] = {};'), true);
  assert.equal(arenaSceneSource.includes("layers.backgroundVariantId = assetSet.variantId;"), true);
  assert.equal(arenaSceneSource.includes("ARENA_TIER_2_BACKGROUND_MID_LAYER_ASSET_KEY"), false);
  assert.equal(arenaSceneSource.includes("ARENA_TIER_2_BACKGROUND_FRONT_LAYER_ASSET_KEY"), false);
  assert.equal(arenaSceneSource.includes("ARENA_TIER_2_BACKGROUND_AMBIENT_LAYER_ASSET_KEY"), false);
  assert.equal(arenaSceneSource.includes("encounter?.backgroundVariantId"), true);
  assert.equal(arenaSceneSource.includes("syncArenaBackgroundForState(target, target.arenaLayers, current)"), true);
});

test("debug arena background editor can tune tier two layer layout", () => {
  assert.equal(debugMainSource.includes("launchArena((scene) => {"), true);
  assert.equal(debugMainSource.includes("arenaScene = scene;"), true);
  assert.equal(debugMainSource.includes("refreshArenaLayout();"), true);
  assert.equal(debugMainSource.includes("beginEdit: beginDebugUndoGroup"), true);
  assert.equal(debugMainSource.includes("endEdit: endDebugUndoGroup"), true);
  assert.equal(debugTuningSource.includes("arenaBackgroundPreviewTier"), true);
  assert.equal(debugTuningSource.includes("arenaBackgroundPreviewVariant"), true);
  assert.equal(debugTuningSource.includes("arenaBackgroundEditMode"), true);
  assert.equal(debugTuningSource.includes("arenaBackgroundTiers: ArenaBackgroundTierTuningMap"), true);
  assert.equal(debugTuningSource.includes("getDynamicArenaBackgroundLayerTuning"), true);
  assert.equal(debugTuningSource.includes("arenaTier1BackgroundBackX"), true);
  assert.equal(debugTuningSource.includes("arenaTier2BackgroundBackX"), true);
  assert.equal(debugPanelSource.includes("getArenaBackgroundVariantIdsForTier"), true);
  assert.equal(debugPanelSource.includes("data-arena-bg-preview-variant"), true);
  assert.equal(debugPanelSource.includes("syncArenaBackgroundVariantSelectOptions"), true);
  assert.equal(debugPanelSource.includes("resolveArenaBackgroundPreviewVariantForTier"), true);
  assert.equal(debugPanelSource.includes("getArenaBackgroundLayerAssetKeysForTier"), true);
  assert.equal(debugPanelSource.includes("return getArenaBackgroundLayerAssetKeysForTier(tierId, variantId);"), true);
  assert.equal(debugPanelSource.includes("syncArenaParallaxLayerSelectOptions"), true);
  assert.equal(debugPanelSource.includes("syncArenaBackgroundParallaxValues(details);"), true);
  assert.equal(debugPanelSource.includes("function syncArenaBackgroundParallaxValues(editor: HTMLElement): void"), true);
  assert.equal(debugPanelSource.includes("formatDebugNumberInputValue(getArenaParallaxValue(getArenaBackgroundEditTierId(), layer, field))"), true);
  assert.equal(debugPanelSource.includes("arenaTier2Front"), true);
  assert.equal(debugPanelSource.includes("arenaTier2Ambient"), true);
  assert.equal(debugPanelSource.includes('"Far alpha"'), true);
  assert.equal(debugPanelSource.includes('"Near alpha"'), true);
  assert.equal(debugPanelSource.includes('field === "farAlpha" || field === "nearAlpha"'), true);
  assert.equal(debugPanelSource.includes('data-arena-bg-layout-row="${field}"'), true);
  assert.equal(debugPanelSource.includes("isArenaBackgroundLayoutFieldSupported"), true);
  assert.equal(debugPanelSource.includes('field !== "alpha" || getArenaBackgroundLayerRole(layer) !== "ambient"'), true);
  assert.equal(debugPanelSource.includes("getDynamicArenaBackgroundLayerPatch"), true);
  assert.equal(debugPanelSource.includes("updateArenaParallaxValue(getArenaBackgroundEditTierId()"), true);
  assert.equal(debugPanelSource.includes("Arena background"), true);
  assert.equal(debugPanelSource.includes("Save tier BG as prod"), true);
  assert.equal(debugPanelSource.includes("createArenaTierBackgroundPayload"), true);
  assert.equal(debugPanelSource.includes("saveArenaTierBackground(createArenaTierBackgroundPayload(tierId))"), true);
  assert.equal(debugPanelSource.includes("onRestartArenaTierPreview"), true);
  assert.equal(debugPanelSource.includes("data-arena-bg-preview-tier"), true);
  assert.equal(debugPanelSource.includes("onRestartArenaTierPreview?.(tierId, variantId)"), true);
  assert.equal(debugPanelSource.includes('layerSelect?.addEventListener("change"'), true);
  assert.equal(debugPanelSource.includes("arenaBackgroundEditLayer: layerSelect.value as ArenaBackgroundEditLayer"), true);
  assert.equal(debugPanelSource.includes("createArenaBackgroundEditor(options.onRestartArenaTierPreview)"), true);
  assert.equal(debugMainSource.includes("function restartArenaTierPreview(tierId: number, backgroundVariantId?: string): void"), true);
  assert.equal(debugMainSource.includes("createArenaRandomEnemyEncounter(tierId)"), true);
  assert.equal(debugMainSource.includes("backgroundVariantId,"), true);
  assert.equal(debugPanelSource.includes('createArenaBackgroundNumberRow("x", "X"'), true);
  assert.equal(debugPanelSource.includes("Reset current tier BG"), true);
  assert.equal(arenaSceneSource.includes("beginArenaBackgroundLayerDrag(pointer"), true);
  assert.equal(arenaSceneSource.includes("dragArenaBackgroundLayer(pointer"), true);
  assert.equal(arenaSceneSource.includes("getArenaBackgroundLayerLayoutForTier"), true);
  assert.equal(arenaSceneSource.includes("applyArenaBackgroundLayerLayout(target, image"), true);
  assert.equal(arenaSceneSource.includes("const baseWidth = ARENA_WORLD_WIDTH * layout.scale;"), true);
  assert.equal(arenaSceneSource.includes("const coverExtraHeight = height - baseHeight;"), true);
  assert.equal(arenaSceneSource.includes("ARENA_WORLD_LEFT + layout.x - layoutExtraWidth / 2 - coverExtraWidth / 2"), true);
  assert.equal(arenaSceneSource.includes("ARENA_WORLD_TOP + layout.y - layoutExtraHeight / 2 - coverExtraHeight * coverAnchorY"), true);
  assert.equal(viteConfigSource.includes("arenaTier2BackgroundBackX"), true);
  assert.equal(viteConfigSource.includes("arenaBackgroundTiers"), true);
  assert.equal(viteConfigSource.includes('"farAlpha", "nearAlpha"'), true);
  assert.equal(viteConfigSource.includes("parallax.farAlpha"), true);
  assert.equal(viteConfigSource.includes('getArenaBackgroundLayerRole(layerKey) === "ambient" ? 1'), true);
  assert.equal(viteConfigSource.includes("function readBoolean(payload"), true);
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

test("debug character viewer can ghost armor without touching weapons", () => {
  const debugCharacterSceneSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("class DebugCharacterScene"),
    arenaSceneSource.indexOf("function drawDebugCharacterBackdrop"),
  );
  const armorAlphaSource = arenaSceneSource.slice(
    arenaSceneSource.indexOf("function syncPaperDollArmorAlpha"),
    arenaSceneSource.indexOf("function setFighterPartVisible"),
  );

  assert.equal(arenaSceneSource.includes("DEBUG_CHARACTER_GHOST_ARMOR_ALPHA = 0.32"), true);
  assert.equal(debugCharacterSceneSource.includes("this.syncPreviewArmorAlpha();"), true);
  assert.match(debugCharacterSceneSource, /private syncPreviewArmorAlpha\(\): void \{[\s\S]*this\.viewerMode !== "debug"[\s\S]*debugTuning\.characterPreviewArmorGhosted \? DEBUG_CHARACTER_GHOST_ARMOR_ALPHA : 1/);
  assert.equal(armorAlphaSource.includes("PAPER_DOLL_DRAGGABLE_ARMOR_SLOT_KEYS.forEach"), true);
  assert.equal(armorAlphaSource.includes("setPaperDollEquipmentSlotAlpha(rig.equipment[slotKey], alpha)"), true);
  assert.equal(armorAlphaSource.includes("weaponMain"), false);
  assert.equal(armorAlphaSource.includes("weaponBow"), false);
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
  assert.match(arenaSceneSource, /this\.viewerMode === "shop"[\s\S]*syncPaperDollEquipmentState\(this\.fighter\?\.paperDollRig, changedSlots, equipment\);[\s\S]*return;/);
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

test("main city background assets use the optimized city art pipeline", () => {
  assert.equal(assetsSource.includes("./assets/menu/main-city.webp"), true);
  assert.equal(assetsSource.includes("./assets/menu/main-city-day.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../art-source/png/assets/menu/main-city.png")), true);
  assert.equal(existsSync(resolve(currentDir, "../art-source/png/assets/menu/main-city-day.png")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/menu/main-city.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/menu/main-city-day.webp")), true);
  assert.equal(optimizeAssetsSource.includes("maxSide: 1672"), true);
  assert.equal(optimizeAssetsSource.includes("menu\\/main-city(?:-day)?\\.png"), true);
  assert.equal(optimizeAssetsSource.includes("maximumQuality: 74"), true);
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
  assert.equal(arenaSceneSource.includes("ARENA_BACKGROUND_LAYER_ASSETS"), true);
  assert.equal(assetsSource.includes("ARENA_BACKGROUND_LAYER_ASSETS"), true);
  assert.equal(assetsSource.includes("arena*.{png,webp}"), true);
  assert.equal(arenaSceneSource.includes("function getArenaBackgroundLayerConfigs(): ArenaBackgroundLayerConfig[]"), true);
  assert.equal(arenaSceneSource.includes("...getArenaBackgroundLayerConfigs().map((asset) => asset.url)"), true);
  assert.equal(arenaSceneSource.includes("ARENA_TIER_2_BACKGROUND_GROUND_LAYER_ASSET_URL"), false);
  assert.equal(arenaSceneSource.includes("ARENA_TIER_2_BACKGROUND_AMBIENT_LAYER_ASSET_URL"), false);
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
  assert.equal(
    arenaSceneSource.includes(
      "const paperDollUrls = await getPaperDollAssetLoadEntriesForEquipmentStates(getPlayerSettings().lowEffects, [activePlayerEquipment], [activePlayerAppearance])",
    ),
    true,
  );
});

test("city hero preview exposes a ready promise for return transitions", () => {
  assert.equal(arenaSceneSource.includes("ready: Promise<void>;"), true);
  assert.equal(arenaSceneSource.includes("const ready = new Promise<void>"), true);
  assert.equal(arenaSceneSource.includes("resolveReadyOnce();"), true);
  assert.match(arenaSceneSource, /return \{\s*ready,/);
});

test("hero portrait skips unchanged snapshot equipment", () => {
  assert.equal(arenaSceneSource.includes("HERO_PORTRAIT_SNAPSHOT_EQUIPMENT_SLOT_KEYS"), true);
  assert.equal(arenaSceneSource.includes("function getHeroPortraitSnapshotKey(equipment: HeroEquipment | undefined, appearance: HeroAppearance | undefined): string"), true);
  assert.equal(arenaSceneSource.includes('const appearanceKey = `hair:${appearance?.hairId ?? ""}|beard:${appearance?.beardId ?? ""}`;'), true);
  assert.equal(arenaSceneSource.includes("let lastSnapshotKey: string | undefined;"), true);
  assert.match(arenaSceneSource, /if \(snapshotKey === lastSnapshotKey\) \{\s*return;\s*\}/);
  assert.match(arenaSceneSource, /if \(nextSnapshotKey === lastSnapshotKey\) \{\s*return;\s*\}/);
  assert.match(arenaSceneSource, /scene\.captureFrame\(\(src\) => \{[\s\S]*lastSnapshotKey = snapshotKey;[\s\S]*target\.image\.src = src;/);
  assert.equal(arenaSceneSource.includes("window.requestAnimationFrame(() => window.requestAnimationFrame(captureSnapshot));"), true);
  assert.match(arenaSceneSource, /void scene\.setEquipment\(nextEquipment\)\.then\(\(\) => refreshSnapshot\(nextEquipment, pendingAppearance\)\);/);
});

test("blocked hits use the shield icon popup instead of block text", () => {
  assert.equal(assetsSource.includes("DAMAGE_BLOCK_ICON_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("./assets/ui/damage-icons/damage-block.webp"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/damage-icons/damage-block.webp")), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_BLOCK_ICON_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("DAMAGE_BLOCK_ICON_ASSET_URL"), true);
  assert.equal(arenaSceneSource.includes("showBlockPopupFromFighter(this, visuals.enemy)"), true);
  assert.equal(arenaSceneSource.includes("showBlockPopupFromFighter(this, visuals.player)"), true);
  assert.equal(arenaSceneSource.includes('getActiveBodyAnimation("block",'), true);
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

test("double strike queues separate combat result popups per impact", () => {
  assert.equal(arenaSceneSource.includes("lastPlayerHitResults"), true);
  assert.equal(arenaSceneSource.includes("lastEnemyHitResults"), true);
  assert.equal(arenaSceneSource.includes("playerActionAnimation?.impacts"), true);
  assert.equal(arenaSceneSource.includes("queueCombatHitResultAnimations"), true);
  assert.equal(arenaSceneSource.includes("playCombatHitResultAnimation"), true);
});

test("poison ticks show a combat result popup without consuming ward visuals", () => {
  assert.equal(arenaSceneSource.includes("lastPlayerPoisonDamage"), true);
  assert.equal(arenaSceneSource.includes("lastEnemyPoisonDamage"), true);
  assert.equal(arenaSceneSource.includes('poison: { propAssetKey: "scroll-poison-01"'), true);
  assert.equal(arenaSceneSource.includes("playPoisonDamageAnimation"), true);
  assert.equal(arenaSceneSource.includes("POISON_DAMAGE_POPUP_ICON_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes('const POISON_DAMAGE_POPUP_ICON_ASSET_KEY = "scroll-poison-01";'), true);
  assert.equal(arenaSceneSource.includes("showPoisonDamagePopup(target, point.x, point.y, damage);"), true);
  assert.equal(arenaSceneSource.includes("poisonDamagePopups: ArenaIconTextPopupVisual[];"), true);
  assert.equal(arenaSceneSource.includes("poisonDamagePopups: []"), true);
  assert.equal(arenaSceneSource.includes("acquirePoisonDamagePopup"), true);
  assert.equal(arenaSceneSource.includes("releasePoisonDamagePopup"), true);
  assert.equal(arenaSceneSource.includes("`POISON -${damage}`"), false);
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
  assert.equal(/REST_BODY_ANIMATION_SPEED_MULTIPLIER = \d+/.test(arenaSceneSource), true);
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
  assert.equal(arenaSceneSource.includes("loopRestAfterComplete?: boolean"), true);
  assert.equal(arenaSceneSource.includes("loopRestAfterComplete: false"), true);
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
  assert.equal(arenaSceneSource.includes("updateRestZzzEffects(this, this.visuals.player, time);"), false);
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
  assert.equal(arenaSceneSource.includes("wardShields: Phaser.GameObjects.Image[]"), true);
  assert.equal(arenaSceneSource.includes("acquireFloatingTextLabel(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseFloatingTextLabel(target, label)"), true);
  assert.equal(arenaSceneSource.includes("acquireRestZzzIcon(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseRestZzzIcon(target, icon)"), true);
  assert.equal(arenaSceneSource.includes("acquireWardShield(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseWardShield(target, shield)"), true);
  assert.equal(arenaSceneSource.includes("acquireSlashArc(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseSlashArc(target, slash)"), true);
  assert.equal(arenaSceneSource.includes("acquireDustDot(target)"), true);
  assert.equal(arenaSceneSource.includes("releaseDustDot(target, dot)"), true);
  assert.equal(arenaSceneSource.includes("MOVEMENT_START_DUST_COUNT"), true);
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
