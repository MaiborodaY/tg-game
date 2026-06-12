import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadStageLayoutModule() {
  const filename = fileURLToPath(new URL("../src/stageLayout.ts", import.meta.url));
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
          };
        }

        if (id === "./combat") {
          return { START_DISTANCE: 3 };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
    },
    { filename },
  );

  return module.exports;
}

const stageLayout = loadStageLayoutModule();
const DEFAULT_STAGE_ORIGIN_X = 215;
const DEFAULT_PLAYER_STAGE_X = -130;
const DEFAULT_ENEMY_STAGE_X = 130;
const START_DISTANCE = 3;

function makeCombatState(playerPosition, enemyPosition, distance = 3) {
  return { playerPosition, enemyPosition, distance };
}

function getExpectedPositionStep(playerBaseX, enemyBaseX) {
  return (enemyBaseX - playerBaseX - stageLayout.CLINCH_VISUAL_GAP) / START_DISTANCE;
}

test("stage layout uses default origin for the regular game", () => {
  const layout = stageLayout.getStageLayout(makeCombatState(0, 3));

  assert.equal(layout.playerX, 85);
  assert.equal(layout.playerY, 520);
  assert.equal(layout.enemyX, 345);
  assert.equal(layout.enemyY, 520);
  assert.equal(layout.playerScale, 1);
  assert.equal(layout.enemyScale, 1);
});

test("stage layout moves only the enemy when only the enemy approaches", () => {
  const start = stageLayout.getStageLayout(makeCombatState(0, 3));
  const enemyClose = stageLayout.getStageLayout(makeCombatState(0, 0));

  assert.equal(enemyClose.playerX, start.playerX);
  assert.equal(enemyClose.enemyX, start.playerX + stageLayout.CLINCH_VISUAL_GAP);
  assert.equal(enemyClose.enemyX - enemyClose.playerX, stageLayout.CLINCH_VISUAL_GAP);
});

test("stage layout applies combat movement without letting fighters cross", () => {
  const near = stageLayout.getStageLayout(makeCombatState(2, 3));
  const clinch = stageLayout.getStageLayout(makeCombatState(3, 3));
  const playerBaseX = DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X;
  const enemyBaseX = DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X;
  const positionStep = getExpectedPositionStep(playerBaseX, enemyBaseX);

  assert.equal(near.playerX, playerBaseX + 2 * positionStep);
  assert.equal(near.enemyX, enemyBaseX);
  assert.equal(clinch.playerX, playerBaseX + 3 * positionStep);
  assert.equal(clinch.enemyX, enemyBaseX);
  assert.equal(clinch.enemyX - clinch.playerX, stageLayout.CLINCH_VISUAL_GAP);
});

test("stage layout keeps fighter scale independent from distance", () => {
  const far = stageLayout.getStageLayout(makeCombatState(0, 3, 3));
  const close = stageLayout.getStageLayout(makeCombatState(3, 3, 0));

  assert.equal(far.playerScale, 1);
  assert.equal(far.enemyScale, 1);
  assert.equal(close.playerScale, 1);
  assert.equal(close.enemyScale, 1);
});

test("stage layout uses debug tuning as an override, not a separate coordinate system", () => {
  const layout = stageLayout.getStageLayout(makeCombatState(1, 2), {
    showGrid: true,
    gridStep: 40,
    gridOpacity: 0.22,
    originX: 200,
    originY: 500,
    playerStageX: -60,
    playerStageY: 20,
    enemyStageX: 80,
    enemyStageY: -10,
    playerScale: 1.4,
    enemyScale: 0.8,
  });
  const playerBaseX = 200 - 60;
  const enemyBaseX = 200 + 80;
  const positionStep = getExpectedPositionStep(playerBaseX, enemyBaseX);

  assert.equal(layout.playerX, playerBaseX + positionStep);
  assert.equal(layout.playerY, 520);
  assert.equal(layout.enemyX, enemyBaseX - positionStep);
  assert.equal(layout.enemyY, 490);
  assert.equal(layout.playerScale, 1.4);
  assert.equal(layout.enemyScale, 0.8);
});
