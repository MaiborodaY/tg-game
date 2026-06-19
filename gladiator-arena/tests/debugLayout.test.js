import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(resolve(currentDir, "../index.html"), "utf8");
const debugHtml = readFileSync(resolve(currentDir, "../debug.html"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const debugMainSource = readFileSync(resolve(currentDir, "../src/debugMain.ts"), "utf8");
const settingsMenuSource = readFileSync(resolve(currentDir, "../src/settingsMenu.ts"), "utf8");
const hudTuningSource = readFileSync(resolve(currentDir, "../src/hudTuning.ts"), "utf8");
const arenaLayoutSource = readFileSync(resolve(currentDir, "../src/arenaLayout.ts"), "utf8");
const viteConfigSource = readFileSync(resolve(currentDir, "../vite.config.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("regular game does not mount debug controls", () => {
  assert.equal(indexHtml.includes("debugPanelHost"), false);
  assert.equal(indexHtml.includes("/src/debugMain.ts"), false);
  assert.equal(mainSource.includes("mountDebugPanel"), false);
  assert.equal(mainSource.includes("createClassicActionBarPreviewState"), false);
});

test("debug app mounts the same arena with a separate tuning host", () => {
  assert.equal(debugHtml.includes('class="debug-app"'), true);
  assert.equal(debugHtml.includes('id="debugPanelHost"'), true);
  assert.equal(debugHtml.includes('id="debugSetImportPreview"'), true);
  assert.equal(debugHtml.includes('class="debug-set-import-preview__image"'), true);
  assert.equal(debugHtml.includes('/src/debugMain.ts'), true);
  assert.equal(debugHtml.includes('id="gameScreen" class="game-screen battle-screen"'), true);
  assert.equal(debugHtml.includes('id="resultLoot"'), true);
  assert.equal(debugMainSource.includes("mountDebugPanel"), true);
});

test("debug app exposes a dedicated animation editor workbench", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
  const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");

  assert.equal(debugHtml.includes('id="debugAnimationEditor"'), true);
  assert.equal(debugHtml.includes('id="debugAnimationViewer"'), true);
  assert.equal(debugHtml.includes("data-animation-workbench-progress"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-keyframes"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-selected-key"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-select"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-new"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-duplicate"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-delete"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-all-weapons"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-variant-weapons"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-add-keyframe"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-duplicate-keyframe"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-set-start"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-set-impact"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-set-keyframe-time"), false);
  assert.equal(debugHtml.includes("data-animation-workbench-reset-pose"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-apply-to-pose"), true);
  assert.equal(debugHtml.includes('data-animation-edit-mode="keyframe"'), true);
  assert.equal(debugHtml.includes("data-animation-workbench-view-controls"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-rig-controls"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-limbs"), true);
  assert.equal(debugHtml.includes("data-animation-workbench-root-transform-mode"), true);
  assert.equal(debugHtml.includes('data-animation-workbench-root-transform-mode-option="rootOffset"'), true);
  assert.equal(debugHtml.includes('data-animation-workbench-root-transform-mode-option="poseOffset"'), true);
  assert.equal(debugMainSource.includes('document.querySelector<HTMLElement>("#debugAnimationViewer")'), true);
  assert.equal(debugMainSource.includes('{ mode: "animation" }'), true);
  assert.equal(debugPanelSource.includes('data-debug-mode="animation"'), true);
  assert.equal(debugPanelSource.includes("mountAnimationWorkbench"), true);
  assert.equal(debugPanelSource.includes("setAnimationWorkbenchProgress"), true);
  assert.equal(debugPanelSource.includes("createBodyAnimationVariant"), true);
  assert.equal(debugPanelSource.includes("deleteSelectedBodyAnimationVariant"), true);
  assert.equal(debugPanelSource.includes("updateSelectedBodyAnimationVariantMeta"), true);
  assert.equal(debugPanelSource.includes("scaleBodyAnimationKeyframeTimes"), true);
  assert.equal(debugPanelSource.includes("createAnimationVariantWeaponToggle"), true);
  assert.equal(debugPanelSource.includes("addAnimationKeyframeAtProgress"), true);
  assert.equal(debugPanelSource.includes("duplicateSelectedAnimationKeyframeAtProgress"), true);
  assert.equal(debugPanelSource.includes("setSelectedAnimationStartKeyframe"), true);
  assert.equal(debugPanelSource.includes("getAnimationStartKeyframe"), true);
  assert.equal(debugPanelSource.includes("setSelectedAnimationImpactKeyframe"), true);
  assert.equal(debugPanelSource.includes("getAnimationImpactKeyframe"), true);
  assert.equal(debugPanelSource.includes("moveAnimationKeyframeToRailPointer"), true);
  assert.equal(debugPanelSource.includes("moveAnimationKeyframeToProgress"), true);
  assert.equal(debugPanelSource.includes("setSelectedAnimationKeyframeTime"), false);
  assert.equal(debugPanelSource.includes("resetSelectedAnimationPoseToDefault"), true);
  assert.equal(debugPanelSource.includes("applySelectedAnimationKeyframeToPose"), true);
  assert.equal(debugPanelSource.includes("getResettableAnimationPoseId"), true);
  assert.equal(debugPanelSource.includes("selectAnimationKeyframe"), true);
  assert.equal(debugPanelSource.includes("updateSelectedAnimationKeyframe"), true);
  assert.equal(debugPanelSource.includes("formatAnimationKeyframeLabel"), true);
  assert.equal(debugPanelSource.includes("animationWorkbenchPlaybackReturnMode"), true);
  assert.equal(debugPanelSource.includes("restoreAnimationWorkbenchEditMode"), true);
  assert.equal(debugPanelSource.includes("beginAnimationWorkbenchScrub"), true);
  assert.equal(debugPanelSource.includes("updateAnimationPreviewKeyframe"), true);
  assert.equal(debugPanelSource.includes("getAnimationPreviewPose"), true);
  assert.equal(debugPanelSource.includes("getAnimationKeyframeIdAtRailPointer"), true);
  assert.equal(debugPanelSource.includes("findEditableAnimationKeyframeAtProgress"), true);
  assert.equal(debugPanelSource.includes("updateAnimationWorkbenchEasing"), true);
  assert.equal(debugPanelSource.includes("getAnimationWorkbenchEasingKeyframe"), true);
  assert.equal(debugPanelSource.includes("debug-animation-editor__keyframe--custom"), true);
  assert.equal(debugPanelSource.includes("stopAnimationWorkbenchPlayback({ restoreEditMode: false })"), true);
  assert.equal(debugPanelSource.includes("animationEditorViewControls"), true);
  assert.equal(debugPanelSource.includes("rotatePaperDoll(Number(button.dataset.animationWorkbenchRotateDoll)"), true);
  assert.equal(debugPanelSource.includes("rigLimbRotateConfigs.forEach((config) => limbGrid.append(createLimbRotateControl(config)))"), true);
  assert.equal(debugPanelSource.includes("animationRootTransformMode"), true);
  assert.equal(debugPanelSource.includes("updateSelectedPoseOffset"), true);
  assert.equal(debugPanelSource.includes("shiftEditableAnimationPose"), true);
  assert.equal(debugPanelSource.includes("persist: false"), true);
  assert.equal(debugTuningSource.includes("animationPreviewProgress: number;"), true);
  assert.equal(debugTuningSource.includes("BODY_ANIMATION_WEAPON_CLASSES"), true);
  assert.equal(debugTuningSource.includes("selectedBodyAnimationVariantId: string;"), true);
  assert.equal(debugTuningSource.includes("variants?: BodyAnimationTuning[];"), true);
  assert.equal(debugTuningSource.includes("weaponClasses?: BodyAnimationWeaponClass[];"), true);
  assert.equal(debugTuningSource.includes("selectedAnimationKeyframeId: string;"), true);
  assert.equal(debugTuningSource.includes("animationEditorZoom: number;"), true);
  assert.equal(debugTuningSource.includes("animationRootTransformMode: AnimationRootTransformMode;"), true);
  assert.equal(debugTuningSource.includes("movementStartKeyframeId?: string;"), true);
  assert.equal(debugTuningSource.includes("impactKeyframeId?: string;"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__keyframe-rail"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__keyframe--custom"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__impact-marker"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__start-marker"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__keyframe--start"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__keyframe--impact"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__timeline-row--tools"), true);
  assert.equal(stylesSource.includes("grid-template-columns: repeat(5, minmax(0, 1fr));"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__timeline-actions--jumps"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__pose-actions"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__reset-pose"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__selected-key"), true);
  assert.equal(stylesSource.includes("body.debug-mode-animation .debug-app"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__timeline"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__rig-controls"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__root-transform-mode"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__variant-actions"), true);
  assert.equal(stylesSource.includes(".debug-animation-editor__weapon-grid"), true);
  assert.equal(arenaSceneSource.includes('mode?: "debug" | "shop" | "animation"'), true);
  assert.equal(arenaSceneSource.includes("private getAnimationCharacterLayout(): CityHeroLayout"), true);
  assert.equal(arenaSceneSource.includes("applyBodyAnimationAtProgress(this.fighter, animation, debugTuning.animationPreviewProgress);"), true);
  assert.equal(arenaSceneSource.includes('debugTuning.animationRootTransformMode === "poseOffset"'), true);
  assert.equal(arenaSceneSource.includes("updateAnimationPoseOffsetWithInteractiveDelta"), true);
  assert.equal(arenaSceneSource.includes("getBodyAnimationMovementStartKeyframe"), true);
  assert.equal(arenaSceneSource.includes("getBodyAnimationPlaybackWindow"), false);
  assert.equal(debugTuningSource.includes("export interface BodyAnimationKeyframe"), true);
  assert.equal(debugTuningSource.includes("keyframes?: BodyAnimationKeyframe[];"), true);
  assert.equal(arenaSceneSource.includes("function sampleBodyAnimationKeyframePose"), true);
  assert.equal(arenaSceneSource.includes("function pickActiveBodyAnimationVariant"), true);
  assert.equal(arenaSceneSource.includes("debugTuning.selectedBodyAnimationVariantId"), true);
  assert.equal(arenaSceneSource.includes("animationEditorZoom"), true);
  assert.equal(arenaSceneSource.includes("isAnimationCanvasZoomWheel"), true);
  assert.equal(arenaSceneSource.includes("isAnimationCanvasPanPointer"), true);
  assert.equal(arenaSceneSource.includes("DebugCanvasPanState"), true);
});

test("debug app starts the hero without starter equipment overrides", () => {
  assert.equal(debugMainSource.includes("let hero: HeroState = createDefaultHero()"), true);
  assert.equal(debugMainSource.includes("createDebugHeroEquipment()"), false);
  assert.equal(debugMainSource.includes("TRAINING_WEAPON_ID"), false);
  assert.equal(debugMainSource.includes("createStarterHeroEquipment()"), false);
  assert.equal(debugMainSource.includes("createStarterHeroInventory()"), false);
  assert.equal(debugMainSource.includes("weaponMain:"), false);
});

test("debug preview uses the same flask resource HUD as the game", () => {
  assert.equal(debugHtml.includes('class="fighters-strip arena-fighters-strip flask-hud"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--hp"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--armor"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--stamina"'), true);
});

test("debug preview can mount and tune the classic action wheel", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes('data-debug-mode="hud"'), true);
  assert.equal(debugPanelSource.includes("debug-hud-panel"), true);
  assert.equal(debugPanelSource.includes("debug-panel__hud-body"), true);
  assert.equal(debugPanelSource.includes('title: "Immersive flask HUD"'), true);
  assert.equal(debugPanelSource.includes('key: "hudMode"'), true);
  assert.equal(debugPanelSource.includes('value: "classic"'), true);
  assert.equal(debugHtml.includes('class="classic-combat-hud"'), true);
  assert.equal(debugHtml.includes('data-classic-action-bar'), true);
  assert.equal(debugMainSource.includes("mountClassicActionBar"), true);
  assert.equal(debugMainSource.includes("mountClassicHudDebug"), true);
  assert.equal(debugMainSource.includes("classicHudEditMode"), true);
  assert.equal(debugPanelSource.includes('title: "Classic action wheel"'), true);
  assert.equal(debugPanelSource.includes("Wheel X"), true);
  assert.equal(debugPanelSource.includes("Wheel Y"), true);
  assert.equal(debugPanelSource.includes("Wheel scale"), true);
  assert.equal(debugPanelSource.includes("Safe offset"), true);
  assert.equal(debugPanelSource.includes("Classic button slots"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-mode"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-action"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-field"), true);
  assert.equal(debugPanelSource.includes("CLASSIC_ACTION_WHEEL_BUTTONS"), true);
  assert.equal(debugPanelSource.includes("syncClassicActionSelectOptions"), true);
  assert.equal(debugPanelSource.includes("Quick shot"), true);
  assert.equal(debugMainSource.includes("getPreviewWheelMode: () => debugTuning.selectedClassicActionWheelMode"), true);
  assert.equal(debugMainSource.includes("classicActionBar?.sync(createClassicActionBarPreviewState(visibleState));"), true);
  assert.equal(debugMainSource.includes('previewMode === "bowDistance"'), true);
  assert.equal(debugMainSource.includes('weaponClass: "bow"'), true);
  assert.equal(debugMainSource.includes('bowWeaponClass: "bow"'), true);
  assert.equal(hudTuningSource.includes("--classic-hud-offset-x"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-offset-y"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-scale"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-safe-offset"), true);
  assert.equal(hudTuningSource.includes("classic-hud-editing"), true);
  assert.equal(arenaLayoutSource.includes("DEFAULT_CLASSIC_HUD_OFFSET_X"), true);
  assert.equal(arenaLayoutSource.includes("DEFAULT_CLASSIC_HUD_SAFE_OFFSET"), true);
  assert.equal(viteConfigSource.includes('DEFAULT_CLASSIC_HUD_OFFSET_X: "classicHudOffsetX"'), true);
  assert.equal(viteConfigSource.includes('DEFAULT_CLASSIC_HUD_SAFE_OFFSET: "classicHudSafeOffset"'), true);
  assert.equal(stylesSource.includes("body.debug-mode-hud .action-arc"), true);
  assert.equal(stylesSource.includes(".debug-panel__hud-body"), true);
});

test("regular arena exposes switchable classic HUD markup", () => {
  assert.equal(indexHtml.includes('data-setting-hud-mode'), true);
  assert.equal(indexHtml.includes('value="immersive"'), true);
  assert.equal(indexHtml.includes('value="classic"'), true);
  assert.equal(indexHtml.includes('class="classic-combat-hud"'), true);
  assert.equal(indexHtml.includes('data-classic-action-bar'), true);
  assert.equal(indexHtml.includes('id="classicPlayerHpFill"'), true);
  assert.equal(indexHtml.includes('id="classicEnemyStaText"'), true);
  assert.equal(indexHtml.includes('class="classic-stat__icon classic-stat__icon--hp"'), true);
  assert.equal(indexHtml.includes('class="classic-stat__value"'), true);
  assert.equal(debugHtml.includes('class="classic-stat__icon classic-stat__icon--armor"'), true);
  assert.equal(debugHtml.includes('class="classic-stat__value"'), true);
  assert.equal(mainSource.includes("mountClassicActionBar"), true);
});

test("settings can persist the arena HUD mode", () => {
  assert.equal(settingsMenuSource.includes('export type PlayerHudMode = "immersive" | "classic"'), true);
  assert.equal(settingsMenuSource.includes('DEFAULT_PLAYER_HUD_MODE: PlayerHudMode = "classic"'), true);
  assert.equal(settingsMenuSource.includes("hudModeDefaultVersion"), true);
  assert.equal(settingsMenuSource.includes("hudMode: DEFAULT_PLAYER_HUD_MODE"), true);
  assert.equal(settingsMenuSource.includes("data-setting-hud-mode"), true);
  assert.equal(settingsMenuSource.includes("arena-hud-classic"), true);
  assert.equal(settingsMenuSource.includes("isPlayerHudMode"), true);
});

test("settings replace animation mode with a reload-gated render fps choice", () => {
  assert.equal(indexHtml.includes("<legend>FPS</legend>"), true);
  assert.equal(indexHtml.includes('data-setting-render-fps'), true);
  assert.equal(indexHtml.includes('value="30"'), true);
  assert.equal(indexHtml.includes('value="60"'), true);
  assert.equal(indexHtml.includes('data-setting-animation'), false);
  assert.equal(settingsMenuSource.includes("export type PlayerRenderFps = 30 | 60"), true);
  assert.equal(settingsMenuSource.includes("renderFps: 30"), true);
  assert.equal(settingsMenuSource.includes("confirmRenderFpsReload"), true);
  assert.equal(settingsMenuSource.includes("window.location.reload();"), true);
  assert.equal(settingsMenuSource.includes("animationMode"), false);
});

test("arena turn flow waits for action animations and adds readable turn pacing", () => {
  assert.equal(mainSource.includes("const actionAnimation = commitState(nextState);"), true);
  assert.equal(mainSource.includes("void scheduleEnemyTurn(nextState, actionAnimation);"), true);
  assert.equal(mainSource.includes("await previousActionAnimation;"), true);
  assert.match(mainSource, /PLAYER_TO_ENEMY_TURN_PACING_MS = \d+/);
  assert.match(mainSource, /ENEMY_TO_PLAYER_TURN_PACING_MS = \d+/);
  assert.equal(mainSource.includes("await delay(PLAYER_TO_ENEMY_TURN_PACING_MS);"), true);
  assert.equal(mainSource.includes("await delay(ENEMY_TO_PLAYER_TURN_PACING_MS);"), true);
  assert.equal(mainSource.includes("setTurnAnimationLocked(true);"), true);
  assert.equal(mainSource.includes("rest:auto"), false);
  assert.equal(mainSource.includes("maybeAutoRestPlayerTurn"), false);
  assert.equal(mainSource.includes("}, 700);"), false);
  assert.equal(debugMainSource.includes("const actionAnimation = commitState(nextState);"), true);
  assert.equal(debugMainSource.includes("void scheduleEnemyTurn(nextState, actionAnimation);"), true);
  assert.equal(debugMainSource.includes("await previousActionAnimation;"), true);
  assert.match(debugMainSource, /PLAYER_TO_ENEMY_TURN_PACING_MS = \d+/);
  assert.match(debugMainSource, /ENEMY_TO_PLAYER_TURN_PACING_MS = \d+/);
  assert.equal(debugMainSource.includes("await delay(PLAYER_TO_ENEMY_TURN_PACING_MS);"), true);
  assert.equal(debugMainSource.includes("await delay(ENEMY_TO_PLAYER_TURN_PACING_MS);"), true);
  assert.equal(debugMainSource.includes("setTurnAnimationLocked(true);"), true);
  assert.equal(debugMainSource.includes("rest:auto"), false);
  assert.equal(debugMainSource.includes("maybeAutoRestPlayerTurn"), false);
  assert.equal(debugMainSource.includes("}, 700);"), false);
});

test("battle result transition moves combat UI away from the final panel", () => {
  assert.equal(stylesSource.includes(".battle-screen.battle-screen--finished .stage-panel::before"), true);
  assert.equal(stylesSource.includes(".battle-screen--finished .classic-combat-hud"), true);
  assert.equal(stylesSource.includes(".battle-screen--finished .classic-action-bar"), true);
  assert.equal(stylesSource.includes(".battle-screen--finished .action-arc"), true);
  assert.equal(stylesSource.includes("translateY(calc(100% + 130px))"), true);
  assert.equal(stylesSource.includes(".battle-result--animating .battle-result__frame"), true);
  assert.equal(stylesSource.includes("@keyframes battle-result-xp-glow"), true);
  assert.equal(mainSource.includes("heroBeforeReward"), true);
  assert.equal(mainSource.includes("heroAfterReward"), true);
});

test("debug panel source contains precision controls and grid", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("Show grid"), true);
  assert.equal(debugPanelSource.includes("debug-panel__number"), true);
  assert.equal(debugPanelSource.includes("debug-grid"), true);
  assert.equal(debugPanelSource.includes("Origin X"), true);
  assert.equal(debugPanelSource.includes("Origin Y"), true);
  assert.equal(debugPanelSource.includes("Player Y"), true);
  assert.equal(debugPanelSource.includes("Enemy Y"), true);
  assert.equal(debugPanelSource.includes("Shadow blur"), true);
  assert.equal(debugPanelSource.includes("Buttons rel X"), false);
  assert.equal(debugPanelSource.includes("Arc rotation"), true);
  assert.equal(debugPanelSource.includes("Arc radius"), true);
  assert.equal(debugPanelSource.includes("Button scale"), true);
  assert.equal(debugPanelSource.includes("Icon scale"), true);
  assert.equal(debugPanelSource.includes("Attack icon"), true);
  assert.equal(debugPanelSource.includes("Ring width"), true);
  assert.equal(debugPanelSource.includes("Face inset"), true);
  assert.equal(debugPanelSource.includes("Rim shine"), true);
  assert.equal(debugPanelSource.includes("Outer shine"), true);
  assert.equal(debugPanelSource.includes('title: "Attack icons"'), true);
  assert.equal(debugPanelSource.includes("Light rotate"), true);
  assert.equal(debugPanelSource.includes("Medium scale"), true);
  assert.equal(debugPanelSource.includes("Heavy bright"), true);
  assert.equal(debugPanelSource.includes("FWD angle"), true);
  assert.equal(debugPanelSource.includes("LUNGE angle"), true);
  assert.equal(debugPanelSource.includes("MED angle"), true);
  assert.equal(debugPanelSource.includes("REST angle"), true);
});

test("debug panel groups controls by tuning category", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes('title: "Grid"'), true);
  assert.equal(debugPanelSource.includes('title: "Origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Fighters from origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Immersive flask HUD"'), true);
  assert.equal(debugPanelSource.includes('title: "Classic action wheel"'), true);
  assert.equal(debugPanelSource.includes('title: "Armory background"'), true);
  assert.equal(debugPanelSource.includes('title: "Action buttons relative to player"'), false);
  assert.equal(debugPanelSource.includes('title: "Action arc"'), true);
  assert.equal(debugPanelSource.includes('title: "Action button angles"'), true);
  assert.equal(debugPanelSource.includes("debug-panel__control-reset"), true);
  assert.equal(debugPanelSource.includes("data-debug-reset-value"), true);
});

test("character debug sections are collapsed by default", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const characterSectionClasses = [
    "debug-rig-panel",
    "debug-face-panel",
    "debug-hero-equipment-panel",
    "debug-item-equipment-panel",
    "debug-auto-equipment-panel",
    "debug-shop-items-panel",
    "debug-boss-items-panel",
  ];

  characterSectionClasses.forEach((className) => {
    assert.match(debugPanelSource, new RegExp(`<details class="${className}">`));
    assert.doesNotMatch(debugPanelSource, new RegExp(`<details class="${className}" open>`));
  });
});

test("debug rig editor can switch paper doll body presets", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
  const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
  const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");

  assert.equal(assetsSource.includes("FIGHTER_HEAD_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("head-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_TORSO_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("torso-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("back-upper-arm-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("front-hand-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("back-thigh-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("front-foot-dummy-01.png"), true);
  assert.equal(debugTuningSource.includes('export const PAPER_DOLL_BODY_PRESETS = ["classic", "dummy-v2"] as const;'), true);
  assert.equal(debugTuningSource.includes('CHARACTER_CANVAS_EDIT_MODES = ["parts", "bodyArt", "equipment", "face", "root"] as const'), true);
  assert.equal(debugTuningSource.includes("export interface BodyAnimationRootOffset"), true);
  assert.equal(debugTuningSource.includes("rootOffset: BodyAnimationRootOffset;"), true);
  assert.equal(debugTuningSource.includes("facePreviewScale: number;"), true);
  assert.equal(debugTuningSource.includes("paperDollBodyPreset: PaperDollBodyPreset;"), true);
  assert.equal(debugTuningSource.includes("bodyPresetTuning: Record<PaperDollBodyPreset, BodyPresetTuning>;"), true);
  assert.equal(debugTuningSource.includes("bodyPartLayers: Record<RigPartKey, BodyPartLayerTuning>;"), true);
  assert.equal(debugTuningSource.includes("const bodyPresetTuning = normalizeBodyPresetTunings"), true);
  assert.equal(debugTuningSource.includes("selectedBodyPresetAnimation"), true);
  assert.equal(debugPanelSource.includes("debug-rig-editor__body-preset"), true);
  assert.equal(debugPanelSource.includes("debug-rig-editor__copy-classic-to-dummy"), true);
  assert.equal(debugPanelSource.includes("copyClassicRigToDummyV2"), true);
  assert.equal(debugPanelSource.includes('rootOption.textContent = "Doll / Root"'), true);
  assert.equal(debugPanelSource.includes('characterCanvasEditMode: "root"'), true);
  assert.equal(debugPanelSource.includes("rigParts: cloneRigParts(classicTuning.rigParts)"), true);
  assert.equal(debugPanelSource.includes("bodyAnimations: cloneBodyAnimations(classicTuning.bodyAnimations)"), true);
  assert.equal(debugPanelSource.includes('data-character-canvas-edit-mode="face"'), true);
  assert.equal(debugPanelSource.includes('data-character-canvas-edit-mode="bodyArt"'), true);
  assert.equal(debugPanelSource.includes("data-character-preview-mode"), true);
  assert.equal(debugPanelSource.includes("syncPreviewToolbar"), true);
  assert.equal(debugPanelSource.includes("getActiveBodyPresetTuning"), true);
  assert.equal(debugPanelSource.includes('data-debug-select-key="paperDollBodyPreset"'), true);
  assert.equal(arenaSceneSource.includes("const PAPER_DOLL_BODY_PRESETS: Record<PaperDollBodyPreset, PaperDollBodyPresetDefinition>"), true);
  assert.equal(arenaSceneSource.includes("const DUMMY_PAPER_DOLL_ARM_ASSET_KEYS"), true);
  assert.equal(arenaSceneSource.includes("const DUMMY_PAPER_DOLL_LEG_ASSET_KEYS"), true);
  assert.match(
    arenaSceneSource,
    /classic:\s*\{[\s\S]*?headAssetKey:\s*FIGHTER_HEAD_LIGHT_ASSET_KEY,[\s\S]*?torsoAssetKey:\s*FIGHTER_TORSO_LIGHT_ASSET_KEY,[\s\S]*?bodyPartAssetKeys:\s*DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS,[\s\S]*?faceOverlayMode:\s*"classic"/,
  );
  assert.equal(arenaSceneSource.includes('"dummy-v2": {'), true);
  assert.equal(arenaSceneSource.includes("headAssetKey: FIGHTER_HEAD_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("torsoAssetKey: FIGHTER_TORSO_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("backUpperArm: FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("frontHand: FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("backThigh: FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("frontFoot: FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes('faceOverlayMode: "none"'), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollFaceOverlayVisibility"), true);
  assert.equal(arenaSceneSource.includes("applyPaperDollBodyPartImageConfig"), true);
  assert.equal(arenaSceneSource.includes("getBodyPresetTuning(bodyPresetKey).bodyPartLayers"), true);
  assert.equal(arenaSceneSource.includes("getFaceCharacterLayout"), true);
  assert.equal(arenaSceneSource.includes("facePreviewFocusY"), true);
  assert.equal(arenaSceneSource.includes("getDebugBodyPresetTuning(rig.bodyPresetKey)"), true);
  assert.equal(arenaSceneSource.includes("syncFighterBodyPreset(this.visuals?.player);"), true);
});

test("debug face editor can tune asset face layers", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
  const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
  const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");

  assert.equal(assetsSource.includes("FIGHTER_FACE_DUMMY_EYE_WHITE_LEFT_ASSET_KEY"), false);
  assert.equal(assetsSource.includes("body-parts/face/eye-left.png"), false);
  assert.equal(assetsSource.includes("FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("brow-left-dummy-01.png"), true);
  assert.equal(assetsSource.includes("FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY"), true);
  assert.equal(assetsSource.includes("brow-right-dummy-01.png"), true);
  assert.equal(debugTuningSource.includes('FACE_ASSET_LAYER_KEYS = ["pupilLeft", "pupilRight", "browLeft", "browRight"] as const'), true);
  assert.equal(debugTuningSource.includes('APPEARANCE_LAYER_KEYS = ["hair", "beard"] as const'), true);
  assert.equal(debugTuningSource.includes("faceAssetLayers: Record<FaceAssetLayerKey, FaceAssetLayerTuning>;"), true);
  assert.equal(debugTuningSource.includes("appearanceLayers: Record<AppearanceLayerKey, AppearanceLayerTuning>;"), true);
  assert.equal(debugPanelSource.includes("debug-face-panel"), true);
  assert.equal(debugPanelSource.includes("debug-face-editor__select"), true);
  assert.equal(debugPanelSource.includes("data-face-asset-layer-key"), true);
  assert.equal(debugPanelSource.includes("debug-face-appearance-editor__select"), true);
  assert.equal(debugPanelSource.includes("data-appearance-layer-key"), true);
  assert.equal(arenaSceneSource.includes("faceAssetKeys: {"), true);
  assert.equal(arenaSceneSource.includes("browLeft: FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("browRight: FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollFaceAssetLayers"), true);
  assert.equal(arenaSceneSource.includes("syncPaperDollAppearanceLayers"), true);
  assert.equal(arenaSceneSource.includes("applyAppearanceLayerTransform"), true);
});

test("debug character preview can ghost armor from an in-scene toggle", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");

  assert.equal(debugHtml.includes('id="debugCharacterShell"'), true);
  assert.equal(debugPanelSource.includes("createCharacterPreviewArmorToggle"), true);
  assert.equal(debugPanelSource.includes('document.querySelector<HTMLElement>("#debugCharacterShell")'), true);
  assert.equal(debugPanelSource.includes('data-debug-key="characterPreviewArmorGhosted"'), true);
  assert.equal(debugPanelSource.includes("updateDebugTuning({ characterPreviewArmorGhosted: input.checked })"), true);
  assert.equal(debugTuningSource.includes("characterPreviewArmorGhosted: boolean;"), true);
  assert.equal(debugTuningSource.includes("characterPreviewArmorGhosted: false,"), true);
  assert.equal(stylesSource.includes(".debug-character-viewer__armor-toggle"), true);
  assert.match(stylesSource, /\.debug-character-shell\s*\{[^}]*position: relative;/s);
  assert.match(stylesSource, /\.debug-character-viewer__armor-toggle\s*\{[^}]*position: absolute;[^}]*top: 10px;[^}]*right: 10px;/s);
});

test("popup tuning controls request live popup previews", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("onPreviewPopup"), true);
  assert.equal(debugPanelSource.includes("popupPreviewKindByKey"), true);
  assert.equal(debugPanelSource.includes('popupOffsetY: "all"'), true);
  assert.equal(debugPanelSource.includes('damagePopupOffsetY: "damage"'), true);
  assert.equal(debugPanelSource.includes('blockPopupScale: "block"'), true);
  assert.equal(debugPanelSource.includes('armorAbsorbPopupScale: "armorAbsorb"'), true);
  assert.equal(debugPanelSource.includes('armorBreakPopupScale: "armorBreak"'), true);
  assert.equal(debugPanelSource.includes("mountPopupPreviewTriggers(popupGroup)"), true);
  assert.equal(debugPanelSource.includes('input.addEventListener("input"'), true);
  assert.equal(debugPanelSource.includes('button.addEventListener("click"'), true);
});

test("debug panel keeps long tuning sections scrollable", () => {
  assert.match(stylesSource, /\.debug-app-panel\s*{[^}]*overflow-y: auto/s);
  assert.match(stylesSource, /\.debug-app-panel \.debug-panel\s*{[^}]*overflow: visible/s);
  assert.equal(stylesSource.includes("body.debug-mode-arena .debug-item-equipment-panel"), true);
  assert.equal(stylesSource.includes("body.debug-mode-arena .debug-auto-equipment-panel"), true);
  assert.equal(stylesSource.includes("overscroll-behavior: contain"), true);
});

test("debug panel exposes item equipment tuning separately", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-item-equipment-panel"), true);
  assert.equal(debugPanelSource.includes("Item equipment"), true);
  assert.equal(debugPanelSource.includes("mountItemEquipmentEditor"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__select"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__type-filter"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__rarity-filter"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__picker"), true);
  assert.equal(debugPanelSource.includes("createDebugItemEquipmentOption"), true);
  assert.equal(debugPanelSource.includes("getDebugItemEquipmentWarnings"), true);
  assert.equal(debugPanelSource.includes("getDebugItemEquipmentAvailabilityBadges"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__controls"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__copy"), true);
  assert.equal(debugPanelSource.includes("data-equipment-copy-key"), true);
  assert.equal(debugPanelSource.includes("copyPairedEquipmentTuningToActiveItem"), true);
  assert.equal(debugPanelSource.includes("getActiveEquipmentPairItem"), true);
  assert.equal(debugPanelSource.includes("updateHeroEquipmentItemWithPair"), true);
  assert.equal(debugPanelSource.includes("getGeneratedEquipmentPairItem"), true);
  assert.equal(debugPanelSource.includes("compareDebugItemEquipmentOptions"), true);
  assert.equal(debugPanelSource.includes("getHeroItemDefinitionRarity"), true);
  assert.equal(debugPanelSource.includes("getCurrentEquipmentItemTuning"), true);
  assert.equal(stylesSource.includes(".debug-item-equipment__picker"), true);
  assert.equal(stylesSource.includes(".debug-item-equipment__badge--warning"), true);
});

test("debug hero equipment picker can list catalog-only items", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("ALL_HERO_ITEM_IDS"), true);
  assert.equal(debugPanelSource.includes("new Set(ALL_HERO_ITEM_IDS)"), true);
  assert.equal(debugPanelSource.includes("debugHeroInventory.flatMap"), true);
});

test("debug panel exposes armory background tuning controls", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("armoryBackgroundOffsetX"), true);
  assert.equal(debugPanelSource.includes("armoryBackgroundOffsetY"), true);
  assert.equal(debugPanelSource.includes("armoryBackgroundScale"), true);
  assert.equal(debugPanelSource.includes("Offset X"), true);
  assert.equal(debugPanelSource.includes("Offset Y"), true);
  assert.equal(debugPanelSource.includes('label: "Scale"'), true);
});

test("debug panel exposes auto equipment promotion controls", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-auto-equipment-panel"), true);
  assert.equal(debugPanelSource.includes("Auto equipment"), true);
  assert.equal(debugPanelSource.includes("savePromotedEquipmentItem"), true);
  assert.equal(debugPanelSource.includes("removePromotedEquipmentItem"), true);
  assert.equal(debugPanelSource.includes("savePromotedWeaponImports"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_ITEM_RECORDS"), true);
  assert.equal(debugPanelSource.includes("GENERATED_EQUIPMENT_ITEM_RECORDS"), true);
  assert.equal(debugPanelSource.includes("return [...GENERATED_EQUIPMENT_ITEM_RECORDS];"), true);
  assert.equal(debugPanelSource.includes('record.item.id.startsWith("generated_equipment_")'), false);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__transform-controls"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__rarity"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_RARITIES"), true);
  assert.equal(debugPanelSource.includes('"mythical"'), true);
  assert.equal(debugPanelSource.includes('"unique"'), true);
  assert.equal(debugPanelSource.includes('mythical: "Mythical"'), true);
  assert.equal(debugPanelSource.includes('unique: "Unique"'), true);
  assert.equal(debugPanelSource.includes("Enemy pool"), true);
  assert.equal(debugPanelSource.includes("Boss unique"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__enemy-pool"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__boss-unique"), true);
  assert.equal(debugPanelSource.includes("syncAutoEquipmentAvailabilityControls"), true);
  assert.equal(debugPanelSource.includes("getSelectedAutoEquipmentRarity"), true);
  assert.equal(debugPanelSource.includes('rarity: bossUnique.checked ? "unique" : getSelectedAutoEquipmentRarity'), true);
  assert.equal(debugPanelSource.includes("availability: {"), true);
  assert.equal(debugPanelSource.includes("enemyPool: enemyPool.checked && !bossUnique.checked"), true);
  assert.equal(debugPanelSource.includes("bossUnique: bossUnique.checked"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__generated-select"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__remove"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-importer"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_SET_IMPORT_ASSETS"), true);
  assert.equal(debugPanelSource.includes("DEBUG_EQUIPMENT_SET_IMPORT_SLOT_CONFIGS"), true);
  assert.equal(debugPanelSource.includes("renderEquipmentSetImportAssets"), true);
  assert.equal(debugPanelSource.includes("showEquipmentSetImportAssetPreview"), true);
  assert.equal(debugPanelSource.includes('document.querySelector<HTMLElement>("#debugSetImportPreview")'), true);
  assert.equal(debugPanelSource.includes('preview.setAttribute("aria-pressed", "false")'), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-preview--selected"), true);
  assert.equal(debugPanelSource.includes("getSelectedEquipmentSetImportEntries"), true);
  assert.equal(debugPanelSource.includes("renameEquipmentSetAssets"), true);
  assert.equal(debugPanelSource.includes("savePromotedEquipmentSet"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-rarity"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-shop"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-enemy-pool"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-boss-unique"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__set-promote"), true);
  assert.equal(debugPanelSource.includes("syncEquipmentSetImportAvailabilityControls"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-importer"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-assets"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-promote"), true);
  assert.equal(debugPanelSource.includes("DEBUG_WEAPON_IMPORT_CLASSES"), true);
  assert.equal(debugPanelSource.includes("renderWeaponImportAssets"), true);
  assert.equal(debugPanelSource.includes("renderShieldImportAssets"), true);
  assert.equal(debugPanelSource.includes("getSelectedWeaponImportEntries"), true);
  assert.equal(debugPanelSource.includes("getSelectedShieldImportEntries"), true);
  assert.equal(debugPanelSource.includes("data-weapon-import-source-path"), true);
  assert.equal(debugPanelSource.includes("data-shield-import-source-path"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-rarity"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-class"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-damage"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__weapon-price"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__shield-rarity"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__shield-armor"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__shield-price"), true);
  assert.equal(debugPanelSource.includes("getRemovableGeneratedEquipmentItems"), true);
  assert.equal(debugPanelSource.includes("createDebugRemovableGeneratedEquipmentPairItem"), true);
  assert.equal(debugPanelSource.includes("compareDebugRemovableGeneratedEquipmentItems"), true);
  assert.equal(debugPanelSource.includes("createRemovableGeneratedEquipmentOption"), true);
  assert.equal(debugPanelSource.includes("setDebugRarityDataset(generatedSelect"), true);
  assert.equal(debugPanelSource.includes("removePromotedEquipmentItem(item.itemIds[0]!"), true);
  assert.equal(debugPanelSource.includes("window.confirm"), true);
  assert.equal(debugPanelSource.includes("equipmentTuning: getCurrentEquipmentItemTuning"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_ARMOR_MAX = 200"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_DAMAGE_MAX = 100"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_PRICE_MAX = 2000"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__generated-select"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__set-rarity"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__set-assets"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__weapon-assets"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__shield-assets"), true);
  assert.equal(stylesSource.includes(".debug-auto-equipment__weapon-fields"), true);
  assert.equal(stylesSource.includes(".debug-set-import-preview"), true);
  assert.equal(stylesSource.includes(".debug-set-import-preview__image"), true);
});

test("set importer exposes only back-side paired armor targets while shields use a separate importer", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const setImporterConfigSource = debugPanelSource.slice(
    debugPanelSource.indexOf("const DEBUG_EQUIPMENT_SET_IMPORT_SLOT_CONFIGS"),
    debugPanelSource.indexOf("const DEBUG_SHOP_ITEM_PAIR_CONFIGS"),
  );

  assert.match(setImporterConfigSource, /targetPrefix: "back-shoulderguard"/);
  assert.match(setImporterConfigSource, /targetPrefix: "back-wrist"/);
  assert.match(setImporterConfigSource, /targetPrefix: "back-glove"/);
  assert.match(setImporterConfigSource, /targetPrefix: "back-greave"/);
  assert.match(setImporterConfigSource, /targetPrefix: "back-shinguard"/);
  assert.match(setImporterConfigSource, /targetPrefix: "back-boot"/);
  assert.doesNotMatch(setImporterConfigSource, /targetPrefix: "shield"/);
  assert.doesNotMatch(setImporterConfigSource, /targetPrefix: "front-/);
  assert.match(debugPanelSource, /debug-auto-equipment__shield-importer/);
  assert.match(debugPanelSource, /getShieldImportAssets/);
  assert.match(debugPanelSource, /getEquipmentSetImportAssets/);
});

test("auto equipment preview starts from fallback and isolates the selected asset", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const autoMountSource = debugPanelSource.slice(
    debugPanelSource.indexOf("function mountAutoEquipmentEditor"),
    debugPanelSource.indexOf("function mountGeneratedShopItemsEditor"),
  );
  const autoPreviewSource = debugPanelSource.slice(
    debugPanelSource.indexOf("function previewSelectedAutoEquipment"),
    debugPanelSource.indexOf("function getSelectedAutoEquipmentRecord"),
  );
  const shopItemsMountSource = debugPanelSource.slice(
    debugPanelSource.indexOf("function mountGeneratedShopItemsEditor"),
    debugPanelSource.indexOf("function mountRigEditor"),
  );
  const shopItemsInitialMountSource = shopItemsMountSource.slice(0, shopItemsMountSource.indexOf('select.addEventListener("change"'));

  assert.equal(debugPanelSource.includes("createDefaultHeroEquipment"), true);
  assert.equal(autoMountSource.includes('select.append(createHeroEquipmentOption("", "fallback"));'), true);
  assert.equal(autoMountSource.includes("previewAutoEquipmentFallback();"), true);
  assert.equal(autoPreviewSource.includes("const previewEquipment = createDefaultHeroEquipment();"), true);
  assert.equal(autoPreviewSource.includes("previewEquipment[record.item.equipmentSlot] = record.item.id;"), true);
  assert.equal(autoPreviewSource.includes("updateHeroEquipment(previewEquipment);"), true);
  assert.equal(autoPreviewSource.includes("updateHeroEquipmentSlot(record.item.equipmentSlot"), false);
  assert.equal(autoPreviewSource.includes("updateHeroEquipment(createDefaultHeroEquipment());"), true);
  assert.equal(shopItemsInitialMountSource.includes("previewGeneratedShopProduct"), false);
  assert.match(shopItemsMountSource, /select\.addEventListener\("change"[\s\S]*previewGeneratedShopProduct\(getSelectedGeneratedShopProduct\(products, select\.value\)\);/);
});

test("debug panel exposes generated shop item editor", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-shop-items-panel"), true);
  assert.equal(debugPanelSource.includes("Shop items"), true);
  assert.equal(debugPanelSource.includes("saveGeneratedShopItem"), true);
  assert.equal(debugPanelSource.includes("mountGeneratedShopItemsEditor"), true);
  assert.equal(debugPanelSource.includes("previewGeneratedShopProduct"), true);
  assert.equal(debugPanelSource.includes("updateHeroEquipmentSlot(definition.equipmentSlot, definition.id)"), true);
  assert.equal(debugPanelSource.includes("formatGeneratedShopProductOption"), true);
  assert.equal(debugPanelSource.includes("setDebugRarityDataset"), true);
  assert.equal(debugPanelSource.includes("getGeneratedShopProducts"), true);
  assert.equal(debugPanelSource.includes("DEBUG_SHOP_ITEM_PAIR_CONFIGS"), true);
  assert.equal(debugPanelSource.includes("createDebugGeneratedShopPairProduct"), true);
  assert.equal(debugPanelSource.includes("Math.max(getGeneratedShopRecordStat(backRecord), getGeneratedShopRecordStat(frontRecord))"), true);
  assert.equal(debugPanelSource.includes("data-shop-item-stat"), true);
  assert.equal(debugPanelSource.includes("data-shop-item-price"), true);
  assert.equal(debugPanelSource.includes("debug-shop-items__rarity"), true);
  assert.equal(debugPanelSource.includes("itemIds: product.itemIds"), true);
  assert.equal(debugPanelSource.includes("debug-rarity-option--"), true);
  assert.equal(stylesSource.includes('.debug-rarity-select[data-rarity="rare"]'), true);
  assert.equal(stylesSource.includes('.debug-rarity-select[data-rarity="mythical"]'), true);
  assert.equal(stylesSource.includes(".armory-shop__option--rarity-mythical"), true);
  assert.equal(stylesSource.includes(".debug-shop-items__select"), true);
});

test("debug panel exposes generated boss item editor", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-boss-items-panel"), true);
  assert.equal(debugPanelSource.includes("Boss items"), true);
  assert.equal(debugPanelSource.includes("saveGeneratedBossItem"), true);
  assert.equal(debugPanelSource.includes("mountGeneratedBossItemsEditor"), true);
  assert.equal(debugPanelSource.includes("getGeneratedBossItems"), true);
  assert.equal(debugPanelSource.includes("previewGeneratedBossItem"), true);
  assert.equal(debugPanelSource.includes("data-boss-item-stat"), true);
  assert.equal(debugPanelSource.includes("getGeneratedBossItemStatMax"), true);
  assert.equal(debugPanelSource.includes("isBossUniqueItem(record.item.id)"), true);
  assert.equal(debugPanelSource.includes("itemIds: item.itemIds"), true);
  assert.equal(debugPanelSource.includes("createDebugGeneratedBossPairItem"), true);
  assert.equal(debugPanelSource.includes("Merged boss pair."), true);
  assert.equal(stylesSource.includes(".debug-boss-items__select"), true);
  assert.equal(stylesSource.includes(".debug-boss-items-panel"), true);
});

test("debug panel exposes arena boss editor", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");
  const bossEditorSource = debugPanelSource.slice(
    debugPanelSource.indexOf("function mountBossEditor"),
    debugPanelSource.indexOf("function mountRigEditor"),
  );

  assert.equal(debugPanelSource.includes("debug-boss-editor-panel"), true);
  assert.equal(debugPanelSource.includes("Boss editor"), true);
  assert.equal(debugPanelSource.includes("debug-boss-editor__boss-row"), true);
  assert.equal(debugPanelSource.includes("debug-boss-editor__actions"), true);
  assert.equal(debugPanelSource.includes("DEBUG_BOSS_EQUIPMENT_SLOT_LABELS"), true);
  assert.equal(stylesSource.includes(".debug-boss-editor__boss-row"), true);
  assert.equal(stylesSource.includes(".debug-boss-editor__equipment-row"), true);
  assert.equal(debugPanelSource.includes("saveArenaBoss"), true);
  assert.equal(debugPanelSource.includes("ARENA_BOSSES"), true);
  assert.equal(debugPanelSource.includes("DEBUG_BOSS_STAT_MAX"), true);
  assert.equal(debugPanelSource.includes("DEBUG_BOSS_LOOT_CHANCE_STEP"), true);
  assert.equal(debugPanelSource.includes("getBossEquipmentControlConfigs"), true);
  assert.equal(debugPanelSource.includes("select.dataset.bossEquipmentSlots"), true);
  assert.equal(debugPanelSource.includes("getSelectedBossEquipmentProductForSlots"), true);
  assert.equal(debugPanelSource.includes("getBossEquipmentProductsForEquipment"), true);
  assert.equal(bossEditorSource.includes("previewBossFromEditor"), true);
  assert.equal(debugPanelSource.includes("createBossEditorLootTable"), true);
  assert.equal(debugPanelSource.includes('record.availability?.bossUnique || record.item.rarity === "unique"'), true);
});

test("debug panel exposes arena tier editor", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-tier-editor-panel"), true);
  assert.equal(debugPanelSource.includes("Arena tiers"), true);
  assert.equal(debugPanelSource.includes("saveArenaTier"), true);
  assert.equal(debugPanelSource.includes("mountArenaTierEditor"), true);
  assert.equal(debugPanelSource.includes("ARENA_TIER_CONFIGS"), true);
  assert.equal(debugPanelSource.includes("ARENA_DIFFICULTY_IDS"), true);
  assert.equal(debugPanelSource.includes("Per-slot rarity roll chance"), true);
  assert.equal(debugPanelSource.includes("data-tier-rarity"), true);
  assert.equal(debugPanelSource.includes("createDefaultArenaTierDraft"), true);
  assert.equal(stylesSource.includes(".debug-tier-editor"), true);
});
