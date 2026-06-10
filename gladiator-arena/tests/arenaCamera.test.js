import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const layout = {
  GAME_WIDTH: 430,
  GAME_HEIGHT: 764,
  ARENA_WORLD_LEFT: -220,
  ARENA_WORLD_TOP: -240,
  ARENA_WORLD_WIDTH: 870,
  ARENA_WORLD_HEIGHT: 1244,
  DEFAULT_STAGE_ORIGIN_X: 215,
  DEFAULT_STAGE_ORIGIN_Y: 520,
  DEFAULT_PLAYER_STAGE_X: -130,
  DEFAULT_PLAYER_STAGE_Y: 159,
  DEFAULT_ENEMY_STAGE_X: 130,
  DEFAULT_ENEMY_STAGE_Y: 223,
  DEFAULT_PLAYER_SCALE: 0.78,
  DEFAULT_ENEMY_SCALE: 1,
  DEFAULT_FIGHTER_HUD_GAP: 0,
  DEFAULT_CAMERA_FEET_SCREEN_Y: 560,
  DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y: 70,
  DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO: 0.58,
  PLAYER_BASE_X: 85,
  ENEMY_BASE_X: 345,
};

function loadArenaCameraModule() {
  const filename = fileURLToPath(new URL("../src/arenaCamera.ts", import.meta.url));
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
          return layout;
        }

        if (id === "./combat") {
          return { START_DISTANCE: 3 };
        }

        if (id === "./stageLayout") {
          return {
            getStageLayout: (state) => {
              const positionStep = (layout.ENEMY_BASE_X - layout.PLAYER_BASE_X - 44) / 3;

              return {
                playerX: layout.PLAYER_BASE_X + state.playerPosition * positionStep,
                playerY: layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y,
                enemyX: layout.ENEMY_BASE_X + (state.enemyPosition - 3) * positionStep,
                enemyY: layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y,
                playerScale: layout.DEFAULT_PLAYER_SCALE,
                enemyScale: layout.DEFAULT_ENEMY_SCALE,
              };
            },
          };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
    },
    { filename },
  );

  return module.exports;
}

const arenaCamera = loadArenaCameraModule();

test("layout contract leaves small fighters separated at clinch", () => {
  assert.equal(arenaCamera.getPlayerWorldX({ playerPosition: 0, enemyPosition: 3 }), layout.PLAYER_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ playerPosition: 0, enemyPosition: 3 }), layout.ENEMY_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ playerPosition: 3, enemyPosition: 3 }) - arenaCamera.getPlayerWorldX({ playerPosition: 3, enemyPosition: 3 }), 44);
});

test("arena camera keeps fighter feet above the bottom controls at the opening distance", () => {
  const start = { distance: 3, playerPosition: 0, enemyPosition: 3 };
  const target = arenaCamera.getCameraTarget(start);
  const fighterCenterX = (arenaCamera.getPlayerWorldX(start) + arenaCamera.getEnemyWorldX(start)) / 2;
  const fighterFeetY = (layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y + layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y) / 2;

  assert.equal(target.centerX, fighterCenterX);
  assert.equal(target.scrollX, fighterCenterX - layout.GAME_WIDTH / 2);
  assert.equal((fighterFeetY - target.scrollY) * target.zoom, 560);
  assert.equal(target.zoom, 1);
});

test("arena camera zooms when fighters get close", () => {
  const far = arenaCamera.getCameraTarget({ distance: 3, playerPosition: 0, enemyPosition: 3 });
  const closeState = { distance: 0, playerPosition: 3, enemyPosition: 3 };
  const close = arenaCamera.getCameraTarget(closeState);

  assert.equal(far.zoom, 1);
  assert.equal(close.zoom, 2.75);
  assert.equal(close.centerX, (arenaCamera.getPlayerWorldX(closeState) + arenaCamera.getEnemyWorldX(closeState)) / 2);
  assert.equal(close.scrollX, close.centerX - layout.GAME_WIDTH / (2 * close.zoom));
  assert.ok(close.scrollY > far.scrollY);
});

test("arena camera respects a dynamic bottom safe line", () => {
  const closeState = { distance: 0, playerPosition: 3, enemyPosition: 3 };
  const target = arenaCamera.getCameraTarget(closeState, undefined, { width: 430, height: 764, safeBottom: 500 });
  const fighterFeetY = (layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y + layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y) / 2;

  assert.ok((fighterFeetY - target.scrollY) * target.zoom <= 500);
});

test("arena camera applies a zoom-aware fighter HUD gap", () => {
  const closeState = { distance: 0, playerPosition: 3, enemyPosition: 3 };
  const tuning = { fighterHudGap: 20 };
  const target = arenaCamera.getCameraTarget(closeState, tuning, { width: 430, height: 764, safeBottom: 500 });
  const fighterFeetY = (layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y + layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y) / 2;

  assert.ok((fighterFeetY - target.scrollY) * target.zoom <= 500 - 20 * target.zoom);
});

test("arena camera lets debug tuning reframe fighter feet on screen", () => {
  const start = { distance: 3, playerPosition: 0, enemyPosition: 3 };
  const tuning = { cameraFeetScreenY: 500, cameraFeetMinScreenRatio: 0.45 };
  const target = arenaCamera.getCameraTarget(start, tuning);
  const fighterFeetY = (layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y + layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y) / 2;

  assert.equal((fighterFeetY - target.scrollY) * target.zoom, 500);
});

test("arena camera applies close distance feet shift after the base framing", () => {
  const closeState = { distance: 0, playerPosition: 3, enemyPosition: 3 };
  const tuning = { cameraFeetScreenY: 500, cameraCloseFeetShiftY: -90, cameraFeetMinScreenRatio: 0.45 };
  const target = arenaCamera.getCameraTarget(closeState, tuning, { width: 430, height: 764 });
  const fighterFeetY = (layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_PLAYER_STAGE_Y + layout.DEFAULT_STAGE_ORIGIN_Y + layout.DEFAULT_ENEMY_STAGE_Y) / 2;

  assert.equal(Math.round((fighterFeetY - target.scrollY) * target.zoom), 410);
});

test("arena camera centers the virtual viewport on the fighters while zooming", () => {
  const close = { distance: 0, playerPosition: 3, enemyPosition: 3 };
  const target = arenaCamera.getCameraTarget(close);
  const center = (arenaCamera.getPlayerWorldX(close) + arenaCamera.getEnemyWorldX(close)) / 2;

  assert.equal(target.centerX, center);
  assert.equal((center - target.scrollX) * target.zoom, layout.GAME_WIDTH / 2);
});

test("arena camera follows the honest midpoint when either fighter moves", () => {
  const start = { distance: 3, playerPosition: 0, enemyPosition: 3 };
  const playerForward = { distance: 2, playerPosition: 1, enemyPosition: 3 };
  const enemyForward = { distance: 2, playerPosition: 0, enemyPosition: 2 };

  assert.ok(arenaCamera.getCameraTarget(playerForward).centerX > arenaCamera.getCameraTarget(start).centerX);
  assert.ok(arenaCamera.getCameraTarget(enemyForward).centerX < arenaCamera.getCameraTarget(start).centerX);
});

test("world projection uses the camera target for DOM overlays", () => {
  const target = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 3, enemyPosition: 3 });
  const worldX = 193;
  const worldY = layout.DEFAULT_STAGE_ORIGIN_Y;
  const projected = arenaCamera.projectWorldToScreen(worldX, worldY, target);

  assert.equal(projected.x, (worldX - target.scrollX) * target.zoom);
  assert.equal(projected.y, (worldY - target.scrollY) * target.zoom);
});
