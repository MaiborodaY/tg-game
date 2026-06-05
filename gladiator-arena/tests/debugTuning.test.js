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
            DEFAULT_ACTION_ARC_ROTATION: 0,
            DEFAULT_ACTION_ARC_RADIUS: 62,
            DEFAULT_ACTION_BUTTON_SCALE: 1,
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
  assert.equal(debugTuningModule.defaultDebugTuning.actionForwardArcAngle, -108);
  assert.equal(debugTuningModule.defaultDebugTuning.actionBackArcAngle, -166);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLungeArcAngle, -34);
  assert.equal(debugTuningModule.defaultDebugTuning.actionLightArcAngle, -34);
  assert.equal(debugTuningModule.defaultDebugTuning.actionHeavyArcAngle, -108);
  assert.equal(debugTuningModule.defaultDebugTuning.actionTauntArcAngle, 28);
  assert.equal(debugTuningModule.defaultDebugTuning.actionRestArcAngle, 106);
});
