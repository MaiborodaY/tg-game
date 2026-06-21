import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadDebugTuningModule() {
  const filename = fileURLToPath(new URL("../src/debugTuning.ts", import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  const module = { exports: {} };

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: (id) => {
        if (id === "./arenaLayout") {
          return {
            DEFAULT_STAGE_ORIGIN_X: 215,
            DEFAULT_STAGE_ORIGIN_Y: 520,
            DEFAULT_PLAYER_STAGE_X: -130,
            DEFAULT_PLAYER_STAGE_Y: 0,
            DEFAULT_ENEMY_STAGE_X: 130,
            DEFAULT_ENEMY_STAGE_Y: 0,
            DEFAULT_PLAYER_SCALE: 1,
            DEFAULT_ENEMY_SCALE: 1,
            DEFAULT_FIGHTER_HUD_GAP: 0,
            DEFAULT_CAMERA_FEET_SCREEN_Y: 560,
            DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y: 70,
            DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO: 0.58,
            DEFAULT_ARENA_BACK_FOLLOW_X: 0.06,
            DEFAULT_ARENA_BACK_FOLLOW_Y: 0.04,
            DEFAULT_ARENA_BACK_ZOOM: 0.3,
            DEFAULT_ARENA_BACK_LOOK_UP_Y: 150,
            DEFAULT_ARENA_MID_FOLLOW_X: 0.22,
            DEFAULT_ARENA_MID_FOLLOW_Y: 0.16,
            DEFAULT_ARENA_MID_ZOOM: 0.42,
            DEFAULT_ARENA_MID_LOOK_UP_Y: 132,
            DEFAULT_ARENA_MID_ZOOM_DARKEN: 0.42,
            DEFAULT_ARENA_GROUND_FOLLOW_X: 0.6,
            DEFAULT_ARENA_GROUND_FOLLOW_Y: 0.52,
            DEFAULT_ARENA_GROUND_ZOOM: 0.74,
            DEFAULT_ARENA_GROUND_LOOK_UP_Y: 10,
            DEFAULT_ACTION_ARC_ROTATION: 0,
            DEFAULT_ACTION_ARC_RADIUS: 62,
            DEFAULT_ACTION_BUTTON_SCALE: 1,
            DEFAULT_ACTION_ICON_SCALE: 1,
            DEFAULT_ACTION_ATTACK_ICON_SCALE: 1,
            DEFAULT_ACTION_LIGHT_ICON_SCALE: 1,
            DEFAULT_ACTION_MEDIUM_ICON_SCALE: 1,
            DEFAULT_ACTION_HEAVY_ICON_SCALE: 1,
            DEFAULT_ACTION_LIGHT_ICON_ROTATION: 0,
            DEFAULT_ACTION_MEDIUM_ICON_ROTATION: 0,
            DEFAULT_ACTION_HEAVY_ICON_ROTATION: 0,
            DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS: 1,
            DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS: 1,
            DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS: 1,
            DEFAULT_ACTION_TOKEN_RING_WIDTH: 3,
            DEFAULT_ACTION_TOKEN_FACE_INSET: 2,
            DEFAULT_ACTION_TOKEN_RIM_SHINE: 0.2,
            DEFAULT_ACTION_TOKEN_OUTER_SHINE: 0.12,
            DEFAULT_ACTION_TOKEN_FACE_SHINE: 0.24,
            DEFAULT_ACTION_TOKEN_INNER_SHINE: 0.2,
            DEFAULT_ACTION_TOKEN_STRIPE_SHINE: 0.12,
            DEFAULT_CLASSIC_HUD_OFFSET_X: 0,
            DEFAULT_CLASSIC_HUD_OFFSET_Y: 0,
            DEFAULT_CLASSIC_HUD_SCALE: 1,
            DEFAULT_CLASSIC_HUD_SAFE_OFFSET: 160,
            DEFAULT_HUD_BOTTOM_OFFSET: -16,
            DEFAULT_HUD_SIDE_INSET: 8,
            DEFAULT_HUD_SCALE: 1,
            DEFAULT_HUD_FLASK_GAP: 6,
            DEFAULT_HUD_NAME_GAP: 3,
            DEFAULT_HUD_SAFE_GAP_RATIO: 0.18,
            DEFAULT_HUD_SAFE_MIN_GAP: 24,
            DEFAULT_FORWARD_MOVE_DISTANCE: 0.5,
            DEFAULT_BACK_MOVE_DISTANCE: 0.5,
            DEFAULT_LUNGE_MOVE_DISTANCE: 0.5,
            DEFAULT_ACTION_FORWARD_ANGLE: -108,
            DEFAULT_ACTION_BACK_ANGLE: -166,
            DEFAULT_ACTION_LUNGE_ANGLE: -34,
            DEFAULT_ACTION_LIGHT_ANGLE: -34,
            DEFAULT_ACTION_MEDIUM_ANGLE: -71,
            DEFAULT_ACTION_HEAVY_ANGLE: -108,
            DEFAULT_ACTION_TAUNT_ANGLE: 28,
            DEFAULT_ACTION_REST_ANGLE: 106,
          };
        }

        if (id === "./settingsMenu") {
          return {
            DEFAULT_PLAYER_HUD_MODE: "immersive",
          };
        }

        if (id === "./scrollCastPropAssets") {
          const SCROLL_CAST_PROP_ASSET_KEYS = [
            "scroll-crack-armor-01",
            "scroll-fireball-01",
            "scroll-ward-01",
            "scroll-precise-strike-01",
            "scroll-double-strike-01",
            "scroll-poison-01",
          ];

          return {
            DEFAULT_SCROLL_CAST_PROP_ASSET_KEY: "scroll-crack-armor-01",
            SCROLL_CAST_PROP_ASSET_KEYS,
          };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
    },
    { filename },
  );

  return module.exports;
}

const debugTuningModule = loadDebugTuningModule();

test("debug tuning normalizes unsafe values", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    debugTuningVersion: debugTuningModule.DEBUG_TUNING_STORAGE_VERSION,
    showGrid: "yes",
    gridStep: 999,
    gridOpacity: -1,
    originX: 999,
    originY: -999,
    playerStageX: 999,
    playerStageY: 999,
    enemyStageX: -999,
    enemyStageY: -999,
    playerScale: 99,
    enemyScale: -4,
    shadowBlur: 999,
    cameraFeetScreenY: 999,
    cameraCloseFeetShiftY: -999,
    cameraFeetMinScreenRatio: 99,
    arenaBackFollowX: 99,
    arenaBackFollowY: -99,
    arenaBackZoom: 99,
    arenaBackLookUpY: 999,
    arenaMidFollowX: 99,
    arenaMidFollowY: -99,
    arenaMidZoom: -99,
    arenaMidLookUpY: -999,
    arenaMidZoomDarken: 99,
    arenaGroundFollowX: 99,
    arenaGroundFollowY: -99,
    arenaGroundZoom: 99,
    arenaGroundLookUpY: 999,
    arenaTier2FrontFollowX: 99,
    arenaTier2FrontFollowY: -99,
    arenaTier2FrontZoom: 99,
    arenaTier2FrontLookUpY: 999,
    arenaTier2AmbientFollowX: -99,
    arenaTier2AmbientFollowY: 99,
    arenaTier2AmbientZoom: -99,
    arenaTier2AmbientLookUpY: -999,
    actionArcRotation: 999,
    actionArcRadius: -5,
    actionButtonScale: 99,
    actionIconScale: 99,
    actionAttackIconScale: -99,
    actionLightIconScale: 99,
    actionMediumIconScale: -99,
    actionHeavyIconScale: 99,
    actionLightIconRotation: 999,
    actionMediumIconRotation: -999,
    actionHeavyIconRotation: 999,
    actionLightIconBrightness: 99,
    actionMediumIconBrightness: -99,
    actionHeavyIconBrightness: 99,
    actionTokenRingWidth: 999,
    actionTokenFaceInset: -999,
    actionTokenRimShine: 999,
    actionTokenOuterShine: -999,
    actionTokenFaceShine: 999,
    actionTokenInnerShine: -999,
    actionTokenStripeShine: 999,
    selectedClassicActionWheelMode: "floating",
    selectedClassicActionButton: "jump",
    classicActionButtonSlots: {
      distance: {
        forward: { x: 999, y: -999, rotation: 999 },
      },
    },
    classicHudEditMode: "yes",
    classicHudOffsetX: 999,
    classicHudOffsetY: -999,
    classicHudScale: 99,
    classicHudSafeOffset: 999,
    hudMode: "wide",
    hudEditMode: "true",
    hudBottomOffset: -999,
    hudSideInset: 999,
    hudScale: 99,
    hudFlaskGap: 999,
    hudNameGap: -999,
    hudSafeGapRatio: 99,
    hudSafeMinGap: 999,
    fighterHudGap: 999,
    actionForwardArcAngle: 999,
    actionBackArcAngle: -999,
    actionLungeArcAngle: 999,
    actionLightArcAngle: -999,
    actionHeavyArcAngle: 999,
    actionTauntArcAngle: -999,
    actionRestArcAngle: 999,
    characterPreviewArmorGhosted: "yes",
    facePreviewScale: 99,
    facePreviewFocusX: 999,
    facePreviewFocusY: -999,
    paperDollBodyPreset: "monster",
    selectedFaceAssetLayer: "nose",
    selectedAppearanceLayer: "mustache",
    animationPreviewProgress: 99,
    animationPreviewPlaybackSpeed: 99,
    animationPreviewRandomWeapon: "yes",
    animationPreviewWeaponItemId: "  generated_equipment_weapon_axe_01  ",
    animationWeaponDragEnabled: "yes",
    animationRootTransformMode: "bodyTeleport",
    animationEditorZoom: 99,
    animationEditorOffsetX: -999,
    animationEditorOffsetY: 999,
    faceAssetLayers: {
      pupilLeft: { x: 999, y: -999, angle: 999, scaleX: 99, scaleY: -99 },
    },
    appearanceLayers: {
      hair: { x: 999, y: -999, angle: 999, scaleX: 99, scaleY: -99 },
    },
  });

  assert.equal(normalized.showGrid, true);
  assert.equal(normalized.gridStep, 100);
  assert.equal(normalized.gridOpacity, 0.1);
  assert.equal(normalized.originX, 430);
  assert.equal(normalized.originY, 0);
  assert.equal(normalized.playerStageX, 600);
  assert.equal(normalized.playerStageY, 500);
  assert.equal(normalized.enemyStageX, -600);
  assert.equal(normalized.enemyStageY, -500);
  assert.equal(normalized.playerScale, 6);
  assert.equal(normalized.enemyScale, 0.1);
  assert.equal(normalized.shadowBlur, 6);
  assert.equal(normalized.cameraFeetScreenY, 720);
  assert.equal(normalized.cameraCloseFeetShiftY, -180);
  assert.equal(normalized.cameraFeetMinScreenRatio, 0.75);
  assert.equal(normalized.arenaBackFollowX, 1.5);
  assert.equal(normalized.arenaBackFollowY, -0.5);
  assert.equal(normalized.arenaBackZoom, 1.5);
  assert.equal(normalized.arenaBackLookUpY, 240);
  assert.equal(normalized.arenaMidFollowX, 1.5);
  assert.equal(normalized.arenaMidFollowY, -0.5);
  assert.equal(normalized.arenaMidZoom, 0);
  assert.equal(normalized.arenaMidLookUpY, -240);
  assert.equal(normalized.arenaMidZoomDarken, 1);
  assert.equal(normalized.arenaGroundFollowX, 1.5);
  assert.equal(normalized.arenaGroundFollowY, -0.5);
  assert.equal(normalized.arenaGroundZoom, 1.5);
  assert.equal(normalized.arenaGroundLookUpY, 240);
  assert.equal(normalized.arenaTier2FrontFollowX, 1.5);
  assert.equal(normalized.arenaTier2FrontFollowY, -0.5);
  assert.equal(normalized.arenaTier2FrontZoom, 1.5);
  assert.equal(normalized.arenaTier2FrontLookUpY, 240);
  assert.equal(normalized.arenaTier2AmbientFollowX, -0.5);
  assert.equal(normalized.arenaTier2AmbientFollowY, 1.5);
  assert.equal(normalized.arenaTier2AmbientZoom, 0);
  assert.equal(normalized.arenaTier2AmbientLookUpY, -240);
  assert.equal(normalized.actionArcRotation, 180);
  assert.equal(normalized.actionArcRadius, 24);
  assert.equal(normalized.actionButtonScale, 2);
  assert.equal(normalized.actionIconScale, 2);
  assert.equal(normalized.actionAttackIconScale, 0.5);
  assert.equal(normalized.actionLightIconScale, 2);
  assert.equal(normalized.actionMediumIconScale, 0.5);
  assert.equal(normalized.actionHeavyIconScale, 2);
  assert.equal(normalized.actionLightIconRotation, 180);
  assert.equal(normalized.actionMediumIconRotation, -180);
  assert.equal(normalized.actionHeavyIconRotation, 180);
  assert.equal(normalized.actionLightIconBrightness, 1.8);
  assert.equal(normalized.actionMediumIconBrightness, 0.35);
  assert.equal(normalized.actionHeavyIconBrightness, 1.8);
  assert.equal(normalized.actionTokenRingWidth, 6);
  assert.equal(normalized.actionTokenFaceInset, 0);
  assert.equal(normalized.actionTokenRimShine, 0.6);
  assert.equal(normalized.actionTokenOuterShine, 0);
  assert.equal(normalized.actionTokenFaceShine, 0.6);
  assert.equal(normalized.actionTokenInnerShine, 0);
  assert.equal(normalized.actionTokenStripeShine, 0.6);
  assert.equal(normalized.selectedClassicActionWheelMode, "distance");
  assert.equal(normalized.selectedClassicActionButton, "forward");
  assert.equal(normalized.classicActionButtonSlots.distance.forward.x, 240);
  assert.equal(normalized.classicActionButtonSlots.distance.forward.y, -320);
  assert.equal(normalized.classicActionButtonSlots.distance.forward.rotation, 180);
  assert.equal(normalized.classicActionButtonSlots.clinch.medium.y, -200);
  assert.equal(normalized.classicHudEditMode, false);
  assert.equal(normalized.classicHudOffsetX, 240);
  assert.equal(normalized.classicHudOffsetY, -160);
  assert.equal(normalized.classicHudScale, 1.6);
  assert.equal(normalized.classicHudSafeOffset, 280);
  assert.equal(normalized.hudMode, "immersive");
  assert.equal(normalized.hudEditMode, false);
  assert.equal(normalized.hudBottomOffset, -96);
  assert.equal(normalized.hudSideInset, 64);
  assert.equal(normalized.hudScale, 1.25);
  assert.equal(normalized.hudFlaskGap, 18);
  assert.equal(normalized.hudNameGap, -12);
  assert.equal(normalized.hudSafeGapRatio, 0.5);
  assert.equal(normalized.hudSafeMinGap, 80);
  assert.equal(normalized.fighterHudGap, 120);
  assert.equal(normalized.actionForwardArcAngle, 180);
  assert.equal(normalized.actionBackArcAngle, -180);
  assert.equal(normalized.actionLungeArcAngle, 180);
  assert.equal(normalized.actionLightArcAngle, -180);
  assert.equal(normalized.actionHeavyArcAngle, 180);
  assert.equal(normalized.actionTauntArcAngle, -180);
  assert.equal(normalized.actionRestArcAngle, 180);
  assert.equal(normalized.characterPreviewArmorGhosted, false);
  assert.equal(normalized.facePreviewScale, 7);
  assert.equal(normalized.facePreviewFocusX, 430);
  assert.equal(normalized.facePreviewFocusY, 80);
  assert.equal(normalized.paperDollBodyPreset, "dummy-v2");
  assert.equal(normalized.selectedFaceAssetLayer, "pupilLeft");
  assert.equal(normalized.selectedAppearanceLayer, "hair");
  assert.equal(normalized.animationPreviewProgress, 1);
  assert.equal(normalized.animationPreviewPlaybackSpeed, 2);
  assert.equal(normalized.animationPreviewRandomWeapon, false);
  assert.equal(normalized.animationPreviewWeaponItemId, "generated_equipment_weapon_axe_01");
  assert.equal(normalized.animationWeaponDragEnabled, false);
  assert.equal(normalized.animationRootTransformMode, "rootOffset");
  assert.equal(normalized.animationEditorZoom, 2.4);
  assert.equal(normalized.animationEditorOffsetX, -420);
  assert.equal(normalized.animationEditorOffsetY, 420);
  assert.equal(normalized.faceAssetLayers.pupilLeft.x, 80);
  assert.equal(normalized.faceAssetLayers.pupilLeft.y, -120);
  assert.equal(normalized.faceAssetLayers.pupilLeft.angle, 180);
  assert.equal(normalized.faceAssetLayers.pupilLeft.scaleX, 3);
  assert.equal(normalized.faceAssetLayers.pupilLeft.scaleY, 0.1);
  assert.equal(normalized.appearanceLayers.hair.x, 160);
  assert.equal(normalized.appearanceLayers.hair.y, -160);
  assert.equal(normalized.appearanceLayers.hair.angle, 180);
  assert.equal(normalized.appearanceLayers.hair.scaleX, 3);
  assert.equal(normalized.appearanceLayers.hair.scaleY, 0.1);
  assert.equal(normalized.bodyPresetTuning.classic.faceAssetLayers.pupilLeft.x, -20);
  assert.equal(normalized.bodyPresetTuning.classic.faceAssetLayers.pupilLeft.y, -44);
  assert.equal(normalized.bodyPresetTuning.classic.faceAssetLayers.browLeft.y, -63);
  assert.equal(normalized.bodyPresetTuning.classic.appearanceLayers.hair.x, 0);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].faceAssetLayers.pupilLeft.x, 80);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].faceAssetLayers.pupilLeft.y, -120);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].faceAssetLayers.browLeft.scaleX, 0.32);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].appearanceLayers.hair.x, 160);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].appearanceLayers.hair.y, -160);
});

test("debug tuning defaults use a stage origin coordinate system", () => {
  assert.equal(debugTuningModule.defaultDebugTuning.debugTuningVersion, debugTuningModule.DEBUG_TUNING_STORAGE_VERSION);
  assert.equal(debugTuningModule.defaultDebugTuning.showGrid, true);
  assert.equal(debugTuningModule.defaultDebugTuning.gridStep, 40);
  assert.equal(debugTuningModule.defaultDebugTuning.originX, 215);
  assert.equal(debugTuningModule.defaultDebugTuning.originY, 520);
  assert.equal(debugTuningModule.defaultDebugTuning.playerStageX, -130);
  assert.equal(debugTuningModule.defaultDebugTuning.playerStageY, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyStageX, 130);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyStageY, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.characterPreviewArmorGhosted, false);
  assert.equal(debugTuningModule.defaultDebugTuning.paperDollBodyPreset, "dummy-v2");
  assert.equal(debugTuningModule.defaultDebugTuning.selectedFaceAssetLayer, "pupilLeft");
  assert.equal(debugTuningModule.defaultDebugTuning.selectedAppearanceLayer, "hair");
  assert.equal(debugTuningModule.defaultDebugTuning.animationPreviewProgress, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.animationPreviewPlaybackSpeed, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.animationPreviewRandomWeapon, false);
  assert.equal(debugTuningModule.defaultDebugTuning.animationPreviewWeaponItemId, null);
  assert.equal(debugTuningModule.defaultDebugTuning.animationWeaponDragEnabled, false);
  assert.equal(debugTuningModule.defaultDebugTuning.animationRootTransformMode, "rootOffset");
  assert.equal(debugTuningModule.defaultDebugTuning.animationEditorZoom, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.animationEditorOffsetX, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.animationEditorOffsetY, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.faceAssetLayers.pupilLeft.x, -20);
  assert.equal(debugTuningModule.defaultDebugTuning.faceAssetLayers.pupilRight.y, -44);
  assert.equal(debugTuningModule.defaultDebugTuning.faceAssetLayers.browLeft.angle, -7);
  assert.equal(debugTuningModule.defaultDebugTuning.faceAssetLayers.browRight.angle, 7);
  assert.equal(debugTuningModule.defaultDebugTuning.appearanceLayers.hair.x, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.appearanceLayers.beard.scaleX, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning.classic.rigParts.head.y, -10);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].rigParts.head.y, -10);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning.classic.bodyPartLayers.head.x, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].bodyPartLayers.head.scaleX, 0.9);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].faceAssetLayers.browLeft.scaleX, 0.3);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].appearanceLayers.beard.scaleX, 0.9);
  assert.equal(debugTuningModule.defaultDebugTuning.facePreviewScale, 4.2);
  assert.equal(debugTuningModule.defaultDebugTuning.facePreviewFocusX, 215);
  assert.equal(debugTuningModule.defaultDebugTuning.facePreviewFocusY, 300);
  assert.notEqual(debugTuningModule.defaultDebugTuning.bodyPresetTuning.classic, debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"]);
  assert.notEqual(
    debugTuningModule.defaultDebugTuning.bodyPresetTuning.classic.rigParts,
    debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].rigParts,
  );
  assert.notEqual(
    debugTuningModule.defaultDebugTuning.bodyPresetTuning.classic.bodyPartLayers,
    debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].bodyPartLayers,
  );
  assert.equal(debugTuningModule.defaultDebugTuning.shadowBlur, 1.2);
  assert.equal(debugTuningModule.defaultDebugTuning.cameraFeetScreenY, 560);
  assert.equal(debugTuningModule.defaultDebugTuning.cameraCloseFeetShiftY, 70);
  assert.equal(debugTuningModule.defaultDebugTuning.cameraFeetMinScreenRatio, 0.58);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaBackFollowX, 0.06);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaBackFollowY, 0.04);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaBackZoom, 0.3);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaBackLookUpY, 150);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaMidFollowX, 0.22);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaMidFollowY, 0.16);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaMidZoom, 0.42);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaMidLookUpY, 132);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaMidZoomDarken, 0.42);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaGroundFollowX, 0.6);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaGroundFollowY, 0.52);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaGroundZoom, 0.74);
  assert.equal(debugTuningModule.defaultDebugTuning.arenaGroundLookUpY, 10);
  assert.equal(debugTuningModule.defaultDebugTuning.actionArcRotation, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.actionArcRadius, 62);
  assert.equal(debugTuningModule.defaultDebugTuning.actionButtonScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionIconScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionAttackIconScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLightIconScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionMediumIconScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionHeavyIconScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLightIconRotation, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.actionMediumIconRotation, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.actionHeavyIconRotation, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLightIconBrightness, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionMediumIconBrightness, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionHeavyIconBrightness, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenRingWidth, 3);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenFaceInset, 2);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenRimShine, 0.2);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenOuterShine, 0.12);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenFaceShine, 0.24);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenInnerShine, 0.2);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTokenStripeShine, 0.12);
  assert.equal(debugTuningModule.defaultDebugTuning.selectedClassicActionWheelMode, "distance");
  assert.equal(debugTuningModule.defaultDebugTuning.selectedClassicActionButton, "forward");
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.distance.forward.x, 60);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.distance.switchWeapon.x, -145);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.distance.switchWeapon.y, -200);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.distance.shuriken.y, -148);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.clinch.medium.y, -200);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.clinch.switchWeapon.y, -92);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.bowDistance.rest.x, -30);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.bowDistance.switchWeapon.x, -145);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.bowDistance.switchWeapon.y, -200);
  assert.equal(debugTuningModule.defaultDebugTuning.classicActionButtonSlots.bowDistance.shuriken.y, -118);
  assert.equal(debugTuningModule.defaultDebugTuning.classicHudOffsetX, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.classicHudOffsetY, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.classicHudScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.classicHudSafeOffset, 160);
  assert.equal(debugTuningModule.defaultDebugTuning.hudMode, "immersive");
  assert.equal(debugTuningModule.defaultDebugTuning.hudBottomOffset, -16);
  assert.equal(debugTuningModule.defaultDebugTuning.hudSideInset, 8);
  assert.equal(debugTuningModule.defaultDebugTuning.hudScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.hudFlaskGap, 6);
  assert.equal(debugTuningModule.defaultDebugTuning.hudNameGap, 3);
  assert.equal(debugTuningModule.defaultDebugTuning.hudSafeGapRatio, 0.18);
  assert.equal(debugTuningModule.defaultDebugTuning.hudSafeMinGap, 24);
  assert.equal(debugTuningModule.defaultDebugTuning.fighterHudGap, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.actionForwardArcAngle, -108);
  assert.equal(debugTuningModule.defaultDebugTuning.actionBackArcAngle, -166);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLungeArcAngle, -34);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLightArcAngle, -34);
  assert.equal(debugTuningModule.defaultDebugTuning.actionHeavyArcAngle, -108);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTauntArcAngle, 28);
  assert.equal(debugTuningModule.defaultDebugTuning.actionRestArcAngle, 106);
});

test("debug tuning keeps body preset rig settings isolated", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    debugTuningVersion: debugTuningModule.DEBUG_TUNING_STORAGE_VERSION,
    characterPreviewArmorGhosted: true,
    paperDollBodyPreset: "dummy-v2",
    faceAssetLayers: {
      pupilLeft: { x: 12 },
    },
    appearanceLayers: {
      beard: { x: 42 },
    },
    bodyPartLayers: {
      torso: { x: -13, scaleX: 1.3 },
    },
    bodyPresetTuning: {
      classic: {
        rigParts: {
          head: { x: 7 },
        },
        bodyPartLayers: {
          torso: { x: 11, scaleX: 1.4 },
        },
      },
    },
  });

  assert.equal(normalized.bodyPresetTuning.classic.rigParts.head.x, 7);
  assert.equal(normalized.bodyPresetTuning.classic.bodyPartLayers.torso.x, 11);
  assert.equal(normalized.bodyPresetTuning.classic.bodyPartLayers.torso.scaleX, 1.4);
  assert.equal(normalized.characterPreviewArmorGhosted, true);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].rigParts.head.x, -1);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].bodyPartLayers.torso.x, -13);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].bodyPartLayers.torso.scaleX, 1.3);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].faceAssetLayers.pupilLeft.x, 12);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].appearanceLayers.beard.x, 42);
  assert.equal(normalized.bodyPresetTuning.classic.faceAssetLayers.pupilLeft.x, -20);
  assert.equal(normalized.bodyPresetTuning.classic.appearanceLayers.beard.x, 0);
  assert.notEqual(normalized.bodyPresetTuning.classic.rigParts, normalized.bodyPresetTuning["dummy-v2"].rigParts);
  assert.notEqual(normalized.bodyPresetTuning.classic.bodyPartLayers, normalized.bodyPresetTuning["dummy-v2"].bodyPartLayers);
  assert.notEqual(normalized.bodyPresetTuning.classic.appearanceLayers, normalized.bodyPresetTuning["dummy-v2"].appearanceLayers);
  assert.notEqual(normalized.bodyPresetTuning.classic.bodyAnimations, normalized.bodyPresetTuning["dummy-v2"].bodyAnimations);
});

test("debug tuning resets legacy classic body preset to production defaults", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    paperDollBodyPreset: "dummy-v2",
    bodyPresetTuning: {
      classic: {
        rigParts: {
          head: { x: 99, y: 99, scaleX: 2.5 },
          torso: { y: 99, scaleY: 2.5 },
        },
      },
      "dummy-v2": {
        rigParts: {
          head: { x: 12 },
        },
      },
    },
  });

  assert.equal(normalized.debugTuningVersion, debugTuningModule.DEBUG_TUNING_STORAGE_VERSION);
  assert.deepEqual(normalized.bodyPresetTuning.classic.rigParts, debugTuningModule.DEFAULT_BODY_PRESET_TUNING.classic.rigParts);
  assert.equal(normalized.bodyPresetTuning["dummy-v2"].rigParts.head.x, 12);
});

test("debug tuning lifts saved classic switch buttons out of the hidden wheel area", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    classicActionButtonSlots: {
      distance: {
        switchWeapon: { x: 0, y: 18, rotation: 0 },
      },
      clinch: {
        switchWeapon: { x: 0, y: 18, rotation: 0 },
      },
      bowDistance: {
        switchWeapon: { x: 0, y: 18, rotation: 0 },
      },
    },
  });

  assert.deepEqual(
    normalized.classicActionButtonSlots.distance.switchWeapon,
    debugTuningModule.DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS.distance.switchWeapon,
  );
  assert.deepEqual(
    normalized.classicActionButtonSlots.clinch.switchWeapon,
    debugTuningModule.DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS.clinch.switchWeapon,
  );
  assert.deepEqual(
    normalized.classicActionButtonSlots.bowDistance.switchWeapon,
    debugTuningModule.DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS.bowDistance.switchWeapon,
  );
});

test("debug tuning exposes dedicated bow shot, damage hit, block, and scroll cast body animations", () => {
  assert.equal(debugTuningModule.BODY_ANIMATION_KEYS.includes("bowShot"), true);
  assert.equal(debugTuningModule.BODY_ANIMATION_KEYS.includes("hit"), true);
  assert.equal(debugTuningModule.BODY_ANIMATION_KEYS.includes("block"), true);
  assert.equal(debugTuningModule.BODY_ANIMATION_KEYS.includes("scrollCast"), true);
  assert.equal(Boolean(debugTuningModule.defaultDebugTuning.bodyAnimations.bowShot), true);
  assert.equal(Boolean(debugTuningModule.defaultDebugTuning.bodyAnimations.hit), true);
  assert.equal(Boolean(debugTuningModule.defaultDebugTuning.bodyAnimations.block), true);
  assert.equal(Boolean(debugTuningModule.defaultDebugTuning.bodyAnimations.scrollCast), true);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyAnimations.bowShot.enabled, true);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyAnimations.hit.enabled, true);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyAnimations.block.enabled, true);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyAnimations.scrollCast.enabled, true);
  assert.deepEqual(Array.from(debugTuningModule.SCROLL_CAST_PROP_ASSET_KEYS), [
    "scroll-crack-armor-01",
    "scroll-fireball-01",
    "scroll-ward-01",
    "scroll-precise-strike-01",
    "scroll-double-strike-01",
    "scroll-poison-01",
  ]);
  const scrollCastPropKeyframes = debugTuningModule.defaultDebugTuning.bodyAnimations.scrollCast.keyframes.filter((keyframe) => keyframe.castProp);

  assert.equal(scrollCastPropKeyframes.length > 0, true);
  assert.equal(scrollCastPropKeyframes.some((keyframe) => keyframe.castProp.visible), true);
  assert.equal(scrollCastPropKeyframes.every((keyframe) => keyframe.castProp.assetKey === "scroll-crack-armor-01"), true);
});

test("debug tuning uses spearattack as the only spear-specific attack variant", () => {
  const assertSpearAttackVariants = (animations) => {
    for (const key of ["light", "medium", "heavy"]) {
      const variants = animations[key].variants ?? [];
      const spearVariants = variants.filter(
        (variant) => variant.appliesToAllWeapons === false && variant.weaponClasses?.includes("spear"),
      );

      assert.deepEqual(
        Array.from(spearVariants.map((variant) => variant.variantId)),
        ["spearattack"],
      );
      assert.deepEqual(
        Array.from(spearVariants.map((variant) => variant.variantLabel)),
        ["spearattack"],
      );
    }
  };

  assertSpearAttackVariants(debugTuningModule.DEFAULT_BODY_ANIMATIONS);
  assertSpearAttackVariants(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].bodyAnimations);
  assert.equal(debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].bodyAnimations.light.selectedVariantId, "spearattack");
});

test("debug tuning backfills editable spearattack variants into stored medium and heavy attacks", () => {
  const dummyPreset = debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"];
  const light = dummyPreset.bodyAnimations.light;
  const lightSpearAttack = light.variants.find((variant) => variant.variantId === "spearattack");
  const heavySpearAttack = {
    ...lightSpearAttack,
    duration: 777,
    variantLabel: "heavy spear custom",
  };
  const withoutSpearAttack = (animation) => ({
    ...animation,
    variants: (animation.variants ?? []).filter((variant) => variant.variantId !== "spearattack"),
  });
  const normalized = debugTuningModule.normalizeDebugTuning({
    paperDollBodyPreset: "dummy-v2",
    bodyPresetTuning: {
      "dummy-v2": {
        ...dummyPreset,
        bodyAnimations: {
          ...dummyPreset.bodyAnimations,
          light,
          medium: withoutSpearAttack(dummyPreset.bodyAnimations.medium),
          heavy: {
            ...dummyPreset.bodyAnimations.heavy,
            variants: [heavySpearAttack],
          },
        },
      },
    },
  });
  const normalizedAnimations = normalized.bodyPresetTuning["dummy-v2"].bodyAnimations;
  const mediumSpearAttack = normalizedAnimations.medium.variants.find((variant) => variant.variantId === "spearattack");
  const normalizedHeavySpearAttack = normalizedAnimations.heavy.variants.find((variant) => variant.variantId === "spearattack");

  assert.equal(Boolean(mediumSpearAttack), true);
  assert.equal(mediumSpearAttack.appliesToAllWeapons, false);
  assert.deepEqual(Array.from(mediumSpearAttack.weaponClasses), ["spear"]);
  assert.equal(normalizedHeavySpearAttack.variantLabel, "heavy spear custom");
  assert.equal(normalizedHeavySpearAttack.duration, 777);
});

test("debug tuning starts dummy lunge movement from the selected keyframe", () => {
  const lunge = debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"].bodyAnimations.lunge;
  const startKeyframe = lunge.keyframes.find((keyframe) => keyframe.id === "key-215");

  assert.equal(lunge.movementStartKeyframeId, "key-215");
  assert.equal(startKeyframe?.time, 316);
  assert.equal(startKeyframe?.easing, "easeInOut");
});

test("debug tuning normalizes body animation variants and weapon filters", () => {
  const dummyPreset = debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"];
  const lunge = dummyPreset.bodyAnimations.lunge;
  const spearVariant = {
    ...lunge,
    variantId: "spear-lunge",
    variantLabel: "Spear lunge",
    variantWeight: 2.5,
    appliesToAllWeapons: false,
    weaponClasses: ["spear", "dragon", "spear"],
    keyframes: [
      ...lunge.keyframes,
      {
        ...lunge.keyframes[0],
        id: "spear-impact",
        time: 120,
      },
    ],
  };
  const payload = {
    paperDollBodyPreset: "dummy-v2",
    selectedBodyAnimation: "lunge",
    selectedBodyAnimationVariantId: "spear-lunge",
    selectedAnimationKeyframeId: "spear-impact",
    bodyPresetTuning: {
      "dummy-v2": {
        ...dummyPreset,
        bodyAnimations: {
          ...dummyPreset.bodyAnimations,
          lunge: {
            ...lunge,
            variants: [spearVariant],
          },
        },
      },
    },
  };
  const normalized = debugTuningModule.normalizeDebugTuning(payload);
  const normalizedLunge = normalized.bodyPresetTuning["dummy-v2"].bodyAnimations.lunge;
  const normalizedVariant = normalizedLunge.variants[0];

  assert.equal(normalized.selectedBodyAnimationVariantId, "spear-lunge");
  assert.equal(normalized.selectedAnimationKeyframeId, "spear-impact");
  assert.equal(normalizedVariant.variantId, "spear-lunge");
  assert.equal(normalizedVariant.variantLabel, "Spear lunge");
  assert.equal(normalizedVariant.variantWeight, 2.5);
  assert.equal(normalizedVariant.appliesToAllWeapons, false);
  assert.deepEqual(Array.from(normalizedVariant.weaponClasses), ["spear"]);
  assert.equal(normalizedVariant.keyframes.some((keyframe) => keyframe.id === "spear-impact"), true);

  assert.equal(
    debugTuningModule.normalizeDebugTuning({
      ...payload,
      selectedBodyAnimationVariantId: "missing-variant",
    }).selectedBodyAnimationVariantId,
    debugTuningModule.BODY_ANIMATION_DEFAULT_VARIANT_ID,
  );
});

test("debug tuning repairs stored default animations without dropping variants", () => {
  const dummyPreset = debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"];
  const lunge = dummyPreset.bodyAnimations.lunge;
  const brokenDefault = {
    ...lunge,
    base: {
      ...lunge.base,
      torso: {
        ...lunge.base.torso,
        x: 123,
        angle: 77,
      },
    },
    keyframes: [
      {
        ...lunge.keyframes[0],
        rigParts: {
          ...lunge.keyframes[0].rigParts,
          torso: {
            ...lunge.keyframes[0].rigParts.torso,
            x: 123,
            angle: 77,
          },
        },
      },
      ...lunge.keyframes.slice(1),
    ],
  };
  const lungeVariant = {
    ...lunge,
    variantId: "lunge2",
    variantLabel: "lunge2",
    base: {
      ...lunge.base,
      torso: {
        ...lunge.base.torso,
        x: 55,
      },
    },
  };
  const normalized = debugTuningModule.normalizeDebugTuning({
    debugTuningVersion: 1,
    paperDollBodyPreset: "dummy-v2",
    selectedBodyAnimation: "lunge",
    selectedBodyAnimationVariantId: "lunge2",
    bodyPresetTuning: {
      "dummy-v2": {
        ...dummyPreset,
        bodyAnimations: {
          ...dummyPreset.bodyAnimations,
          lunge: {
            ...brokenDefault,
            variants: [lungeVariant],
          },
        },
      },
    },
  });
  const repairedLunge = normalized.bodyPresetTuning["dummy-v2"].bodyAnimations.lunge;

  assert.equal(normalized.debugTuningVersion, debugTuningModule.DEBUG_TUNING_STORAGE_VERSION);
  assert.equal(normalized.selectedBodyAnimationVariantId, "lunge2");
  assert.equal(repairedLunge.base.torso.x, lunge.base.torso.x);
  assert.equal(repairedLunge.base.torso.angle, lunge.base.torso.angle);
  assert.equal(repairedLunge.keyframes[0].rigParts.torso.x, lunge.keyframes[0].rigParts.torso.x);
  assert.equal(repairedLunge.variants.length, 1);
  assert.equal(repairedLunge.variants[0].variantId, "lunge2");
  assert.equal(repairedLunge.variants[0].base.torso.x, 55);
});

test("debug tuning migrates old tier 1 variant edits away from the default scene", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    debugTuningVersion: 2,
    arenaBackgroundPreviewTier: 1,
    arenaBackgroundPreviewVariant: "variant-2",
    arenaTier1BackLookUpY: -64,
    arenaTier1GroundFollowY: 0.45,
    arenaTier1GroundZoom: 0.6,
    arenaTier1GroundLookUpY: 30,
    arenaTier1BackgroundBackScale: 0.5,
    arenaTier1BackgroundGroundY: 17,
    arenaTier1BackgroundGroundScale: 0.6,
    arenaBackgroundTiers: {},
  });
  const variant = normalized.arenaBackgroundTiers["1"].variants["variant-2"];

  assert.equal(normalized.arenaTier1BackLookUpY, debugTuningModule.defaultDebugTuning.arenaTier1BackLookUpY);
  assert.equal(normalized.arenaTier1GroundFollowY, debugTuningModule.defaultDebugTuning.arenaTier1GroundFollowY);
  assert.equal(normalized.arenaTier1GroundZoom, debugTuningModule.defaultDebugTuning.arenaTier1GroundZoom);
  assert.equal(normalized.arenaTier1GroundLookUpY, debugTuningModule.defaultDebugTuning.arenaTier1GroundLookUpY);
  assert.equal(normalized.arenaTier1BackgroundBackScale, debugTuningModule.defaultDebugTuning.arenaTier1BackgroundBackScale);
  assert.equal(normalized.arenaTier1BackgroundGroundY, debugTuningModule.defaultDebugTuning.arenaTier1BackgroundGroundY);
  assert.equal(normalized.arenaTier1BackgroundGroundScale, debugTuningModule.defaultDebugTuning.arenaTier1BackgroundGroundScale);
  assert.equal(variant.back.layout.scale, 0.5);
  assert.equal(variant.back.parallax.lookUpY, -64);
  assert.equal(variant.ground.layout.y, 17);
  assert.equal(variant.ground.layout.scale, 0.6);
  assert.equal(variant.ground.parallax.followY, 0.45);
  assert.equal(variant.ground.parallax.zoom, 0.6);
  assert.equal(variant.ground.parallax.lookUpY, 30);
});

test("debug tuning keeps default tier 1 variant defaults when storage has no variant map", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    debugTuningVersion: debugTuningModule.DEBUG_TUNING_STORAGE_VERSION,
    arenaBackgroundTiers: {},
  });
  const variant = normalized.arenaBackgroundTiers["1"].variants["variant-2"];
  const defaultVariant = debugTuningModule.defaultDebugTuning.arenaBackgroundTiers["1"].variants["variant-2"];

  assert.deepEqual(variant, defaultVariant);
});

test("debug tuning builds Pose A and Pose B animation keyframes from legacy poses", () => {
  const animation = debugTuningModule.defaultDebugTuning.bodyAnimations.idle;

  assert.equal(debugTuningModule.BODY_ANIMATION_KEYFRAME_EASINGS.includes("easeInOut"), true);
  assert.equal(debugTuningModule.ANIMATION_EDIT_MODES.includes("keyframe"), true);
  assert.equal(debugTuningModule.defaultDebugTuning.selectedAnimationKeyframeId, "pose-a");
  assert.equal(animation.keyframes.length, 2);
  assert.equal(animation.keyframes[0].id, "pose-a");
  assert.equal(animation.keyframes[0].time, 0);
  assert.deepEqual(animation.keyframes[0].rigParts.head, animation.base.head);
  assert.deepEqual(animation.keyframes[0].faceParts.eyeLeft, animation.faceBase.eyeLeft);
  assert.equal(animation.keyframes[0].rootOffset.x, 0);
  assert.equal(animation.keyframes[0].rootOffset.y, 0);
  assert.equal(animation.keyframes[0].weaponMirrorX, undefined);
  assert.equal(animation.keyframes[0].weaponMirrorY, undefined);
  assert.equal(animation.keyframes[1].id, "pose-b");
  assert.equal(animation.keyframes[1].time, animation.duration / 2);
  assert.deepEqual(animation.keyframes[1].rigParts.head, animation.breath.head);
  assert.deepEqual(animation.keyframes[1].faceParts.eyeLeft, animation.faceBreath.eyeLeft);
  assert.equal(animation.keyframes[1].rootOffset.x, 0);
  assert.equal(animation.keyframes[1].rootOffset.y, 0);
  assert.equal(animation.keyframes[1].weaponMirrorX, undefined);
  assert.equal(animation.keyframes[1].weaponMirrorY, undefined);

  const normalized = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        base: {
          ...animation.base,
          head: {
            ...animation.base.head,
            x: 17,
          },
        },
      },
    },
  });

  assert.equal(normalized.bodyAnimations.idle.keyframes[0].rigParts.head.x, 17);
  const rootHopKeyframe = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        movementStartKeyframeId: "root-hop",
        keyframes: [
          ...animation.keyframes,
          {
            ...animation.keyframes[0],
            id: "root-hop",
            time: 100,
            rootOffset: { x: 22, y: -35 },
            weaponMirrorX: true,
            weaponMirrorY: true,
            weaponOffset: { x: 12, y: -8 },
            castProp: {
              visible: true,
              assetKey: "scroll-poison-01",
              x: 999,
              y: -999,
              angle: 9999,
              scaleX: 99,
              scaleY: -99,
              flipX: true,
              flipY: true,
            },
          },
        ],
      },
    },
  }).bodyAnimations.idle.keyframes.find((keyframe) => keyframe.id === "root-hop");

  assert.equal(rootHopKeyframe.rootOffset.x, 22);
  assert.equal(rootHopKeyframe.rootOffset.y, -35);
  assert.equal(rootHopKeyframe.weaponMirrorX, true);
  assert.equal(rootHopKeyframe.weaponMirrorY, true);
  assert.equal(rootHopKeyframe.castProp.visible, true);
  assert.equal(rootHopKeyframe.castProp.assetKey, "scroll-poison-01");
  assert.equal(rootHopKeyframe.castProp.x, 480);
  assert.equal(rootHopKeyframe.castProp.y, -480);
  assert.equal(rootHopKeyframe.castProp.angle, debugTuningModule.RIG_PART_ANGLE_MAX);
  assert.equal(rootHopKeyframe.castProp.scaleX, 3);
  assert.equal(rootHopKeyframe.castProp.scaleY, 0.05);
  assert.equal(rootHopKeyframe.castProp.flipX, true);
  assert.equal(rootHopKeyframe.castProp.flipY, true);
  assert.equal(rootHopKeyframe.weaponOffset, undefined);
  assert.equal(
    debugTuningModule.normalizeDebugTuning({
      bodyAnimations: {
        idle: {
          ...animation,
          movementStartKeyframeId: "missing-start",
        },
      },
    }).bodyAnimations.idle.movementStartKeyframeId,
    undefined,
  );

  const anchorRootOffsetNormalized = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        breath: {
          ...animation.breath,
          torso: {
            ...animation.breath.torso,
            y: 33,
          },
        },
        keyframes: [
          {
            ...animation.keyframes[0],
            time: 44,
            rootOffset: { x: 8, y: -9 },
          },
          {
            ...animation.keyframes[1],
            time: 123,
            rootOffset: { x: 41, y: -27 },
            weaponMirrorX: true,
            weaponMirrorY: true,
            weaponOffset: { x: -3, y: 5 },
          },
        ],
      },
    },
  }).bodyAnimations.idle;

  assert.equal(
    debugTuningModule.normalizeDebugTuning({
      bodyAnimations: {
        idle: {
          ...animation,
          movementStartKeyframeId: "root-hop",
          keyframes: [
            ...animation.keyframes,
            {
              ...animation.keyframes[0],
              id: "root-hop",
              time: 100,
            },
          ],
        },
      },
    }).bodyAnimations.idle.movementStartKeyframeId,
    "root-hop",
  );
  assert.equal(
    debugTuningModule.normalizeDebugTuning({
      bodyAnimations: {
        idle: {
          ...animation,
          startKeyframeId: "root-hop",
          keyframes: [
            ...animation.keyframes,
            {
              ...animation.keyframes[0],
              id: "root-hop",
              time: 100,
            },
          ],
        },
      },
    }).bodyAnimations.idle.movementStartKeyframeId,
    "root-hop",
  );
  assert.equal(anchorRootOffsetNormalized.keyframes[0].id, "pose-a");
  assert.equal(anchorRootOffsetNormalized.keyframes[0].time, 0);
  assert.equal(anchorRootOffsetNormalized.keyframes[0].rootOffset.x, 8);
  assert.equal(anchorRootOffsetNormalized.keyframes[0].rootOffset.y, -9);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].id, "pose-b");
  assert.equal(anchorRootOffsetNormalized.keyframes[1].time, 123);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].rigParts.torso.y, 33);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].rootOffset.x, 41);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].rootOffset.y, -27);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].weaponMirrorX, true);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].weaponMirrorY, true);
  assert.equal(anchorRootOffsetNormalized.keyframes[1].weaponOffset, undefined);

  const impactNormalized = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        impactKeyframeId: "root-hop",
        keyframes: [
          ...animation.keyframes,
          {
            ...animation.keyframes[0],
            id: "root-hop",
            time: 100,
          },
        ],
      },
    },
  }).bodyAnimations.idle;

  assert.equal(impactNormalized.impactKeyframeId, "root-hop");

  const missingImpactNormalized = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        impactKeyframeId: "missing-impact",
      },
    },
  }).bodyAnimations.idle;

  assert.equal(missingImpactNormalized.impactKeyframeId, undefined);
});

test("debug tuning preserves multi-turn rig part animation angles", () => {
  const animation = debugTuningModule.defaultDebugTuning.bodyAnimations.idle;
  const spinKeyframe = {
    ...animation.keyframes[0],
    id: "spin",
    time: 100,
    rigParts: {
      ...animation.keyframes[0].rigParts,
      frontHand: {
        ...animation.keyframes[0].rigParts.frontHand,
        angle: 9999,
      },
    },
  };
  const normalized = debugTuningModule.normalizeDebugTuning({
    bodyAnimations: {
      idle: {
        ...animation,
        base: {
          ...animation.base,
          frontHand: {
            ...animation.base.frontHand,
            angle: 720,
          },
        },
        breath: {
          ...animation.breath,
          frontHand: {
            ...animation.breath.frontHand,
            angle: -720,
          },
        },
        keyframes: [
          {
            ...animation.keyframes[0],
            rigParts: {
              ...animation.keyframes[0].rigParts,
              frontHand: {
                ...animation.keyframes[0].rigParts.frontHand,
                angle: 720,
              },
            },
          },
          {
            ...animation.keyframes[1],
            rigParts: {
              ...animation.keyframes[1].rigParts,
              frontHand: {
                ...animation.keyframes[1].rigParts.frontHand,
                angle: -720,
              },
            },
          },
          spinKeyframe,
        ],
      },
    },
  }).bodyAnimations.idle;

  assert.equal(debugTuningModule.RIG_PART_ANGLE_MAX, 2160);
  assert.equal(normalized.base.frontHand.angle, 720);
  assert.equal(normalized.breath.frontHand.angle, -720);
  assert.equal(normalized.keyframes.find((keyframe) => keyframe.id === "pose-a").rigParts.frontHand.angle, 720);
  assert.equal(normalized.keyframes.find((keyframe) => keyframe.id === "pose-b").rigParts.frontHand.angle, -720);
  assert.equal(normalized.keyframes.find((keyframe) => keyframe.id === "spin").rigParts.frontHand.angle, debugTuningModule.RIG_PART_ANGLE_MAX);
});

test("debug tuning normalizes the selected animation keyframe id", () => {
  const idle = debugTuningModule.defaultDebugTuning.bodyAnimations.idle;
  const normalized = debugTuningModule.normalizeDebugTuning({
    animationEditMode: "keyframe",
    selectedAnimationKeyframeId: "impact",
    bodyAnimations: {
      idle: {
        ...idle,
        keyframes: [
          ...idle.keyframes,
          {
            ...idle.keyframes[0],
            id: "impact",
            time: 100,
          },
        ],
      },
    },
  });

  assert.equal(normalized.animationEditMode, "keyframe");
  assert.equal(normalized.selectedAnimationKeyframeId, "impact");
  assert.equal(debugTuningModule.normalizeDebugTuning({ selectedAnimationKeyframeId: "missing" }).selectedAnimationKeyframeId, "pose-a");

  const dummyPreset = debugTuningModule.defaultDebugTuning.bodyPresetTuning["dummy-v2"];
  const presetIdle = dummyPreset.bodyAnimations.idle;
  const presetNormalized = debugTuningModule.normalizeDebugTuning({
    animationEditMode: "keyframe",
    paperDollBodyPreset: "dummy-v2",
    selectedBodyAnimation: "idle",
    selectedAnimationKeyframeId: "preset-impact",
    bodyPresetTuning: {
      "dummy-v2": {
        ...dummyPreset,
        bodyAnimations: {
          ...dummyPreset.bodyAnimations,
          idle: {
            ...presetIdle,
            keyframes: [
              ...presetIdle.keyframes,
              {
                ...presetIdle.keyframes[0],
                id: "preset-impact",
                time: 100,
              },
            ],
          },
        },
      },
    },
  });

  assert.equal(presetNormalized.selectedAnimationKeyframeId, "preset-impact");
});

test("debug tuning preserves the animation root transform mode", () => {
  assert.deepEqual(Array.from(debugTuningModule.ANIMATION_ROOT_TRANSFORM_MODES), ["rootOffset", "poseOffset"]);
  assert.equal(debugTuningModule.normalizeDebugTuning({ animationRootTransformMode: "poseOffset" }).animationRootTransformMode, "poseOffset");
  assert.equal(debugTuningModule.normalizeDebugTuning({ animationRootTransformMode: "rootOffset" }).animationRootTransformMode, "rootOffset");
  assert.equal(debugTuningModule.normalizeDebugTuning({ animationRootTransformMode: "bad-mode" }).animationRootTransformMode, "rootOffset");
});

test("debug tuning exposes real classic wheel action sets", () => {
  assert.deepEqual(Array.from(debugTuningModule.CLASSIC_ACTION_WHEEL_BUTTONS.distance), [
    "forward",
    "lunge",
    "back",
    "switchWeapon",
    "shuriken",
    "scroll",
    "fireball",
    "ward",
    "preciseStrike",
    "doubleStrike",
    "poison",
    "taunt",
    "rest",
  ]);
  assert.deepEqual(Array.from(debugTuningModule.CLASSIC_ACTION_WHEEL_BUTTONS.clinch), [
    "light",
    "medium",
    "heavy",
    "back",
    "shuriken",
    "scroll",
    "fireball",
    "ward",
    "preciseStrike",
    "doubleStrike",
    "poison",
    "taunt",
    "rest",
  ]);
  assert.deepEqual(Array.from(debugTuningModule.CLASSIC_ACTION_WHEEL_BUTTONS.bowDistance), [
    "light",
    "medium",
    "heavy",
    "switchWeapon",
    "shuriken",
    "scroll",
    "fireball",
    "ward",
    "preciseStrike",
    "doubleStrike",
    "poison",
    "back",
    "taunt",
    "rest",
  ]);
});
