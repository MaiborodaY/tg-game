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
            DEFAULT_ACTION_HEAVY_ANGLE: -108,
            DEFAULT_ACTION_TAUNT_ANGLE: 28,
            DEFAULT_ACTION_REST_ANGLE: 106,
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
});

test("debug tuning defaults use a stage origin coordinate system", () => {
  assert.equal(debugTuningModule.defaultDebugTuning.showGrid, true);
  assert.equal(debugTuningModule.defaultDebugTuning.gridStep, 40);
  assert.equal(debugTuningModule.defaultDebugTuning.originX, 215);
  assert.equal(debugTuningModule.defaultDebugTuning.originY, 520);
  assert.equal(debugTuningModule.defaultDebugTuning.playerStageX, -130);
  assert.equal(debugTuningModule.defaultDebugTuning.playerStageY, 0);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyStageX, 130);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyStageY, 0);
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
