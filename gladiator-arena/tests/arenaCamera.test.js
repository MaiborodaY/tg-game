import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const layout = {
  GAME_WIDTH: 430,
  GAME_HEIGHT: 764,
  DEFAULT_STAGE_ORIGIN_X: 215,
  DEFAULT_STAGE_ORIGIN_Y: 520,
  DEFAULT_PLAYER_STAGE_X: -130,
  DEFAULT_PLAYER_STAGE_Y: 159,
  DEFAULT_ENEMY_STAGE_X: 130,
  DEFAULT_ENEMY_STAGE_Y: 223,
  DEFAULT_PLAYER_SCALE: 0.78,
  DEFAULT_ENEMY_SCALE: 1,
  PLAYER_BASE_X: 85,
  ENEMY_BASE_X: 345,
  POSITION_PIXEL_STEP: 72,
  ARENA_WORLD_PADDING_X: 0,
  ARENA_WORLD_LEFT: 0,
  ARENA_WORLD_WIDTH: 430,
  CAMERA_PLAYER_SCREEN_X: 150,
  START_PLAYER_SCREEN_X: 85,
  START_ENEMY_SCREEN_X: 345,
  FAR_CAMERA_ZOOM: 1,
  CLOSE_CAMERA_ZOOM: 1.14,
  CAMERA_CENTER_Y: 430,
  OVERVIEW_DISTANCE: 3,
  OVERVIEW_MIN_ZOOM: 1,
  OVERVIEW_MAX_ZOOM: 1,
  OVERVIEW_SCREEN_PADDING: 28,
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
          return { MAX_DISTANCE: 4 };
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

function screenX(worldX, target) {
  return (worldX - target.scrollX) * target.zoom;
}

const arenaCamera = loadArenaCameraModule();

test("layout contract leaves small fighters separated at clinch", () => {
  assert.equal(arenaCamera.getPlayerWorldX({ playerPosition: 0, enemyPosition: 3 }), layout.PLAYER_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ playerPosition: 0, enemyPosition: 3 }), layout.ENEMY_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ playerPosition: 3, enemyPosition: 3 }) - arenaCamera.getPlayerWorldX({ playerPosition: 3, enemyPosition: 3 }), 44);
});

test("overview camera keeps the arena as a full-screen background", () => {
  const start = { distance: 3, playerPosition: 0, enemyPosition: 3 };
  const target = arenaCamera.getCameraTarget(start);

  assert.equal(target.zoom, layout.FAR_CAMERA_ZOOM);
  assert.equal(target.scrollX, 0);
  assert.equal(target.scrollY, 0);
  assert.ok(Math.abs(screenX(arenaCamera.getPlayerWorldX(start), target) - layout.START_PLAYER_SCREEN_X) < 1);
  assert.ok(Math.abs(screenX(arenaCamera.getEnemyWorldX(start), target) - layout.START_ENEMY_SCREEN_X) < 1);
});

test("smart camera zooms in as fighters get close", () => {
  const far = arenaCamera.getCameraTarget({ distance: 3, playerPosition: 0, enemyPosition: 3 });
  const close = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 3, enemyPosition: 3 });

  assert.equal(far.zoom, layout.FAR_CAMERA_ZOOM);
  assert.ok(close.zoom > far.zoom);
  assert.equal(close.zoom, layout.CLOSE_CAMERA_ZOOM);
});

test("smart camera clamps scroll so the portrait background does not break", () => {
  const target = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 3, enemyPosition: 3 });
  const maxScrollX = layout.ARENA_WORLD_LEFT + layout.ARENA_WORLD_WIDTH - layout.GAME_WIDTH / target.zoom;
  const maxScrollY = layout.GAME_HEIGHT - layout.GAME_HEIGHT / target.zoom;

  assert.ok(target.scrollX >= layout.ARENA_WORLD_LEFT);
  assert.ok(target.scrollX <= maxScrollX);
  assert.ok(target.scrollY >= 0);
  assert.ok(target.scrollY <= maxScrollY);
});

test("world projection uses the camera target for DOM overlays", () => {
  const target = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 3, enemyPosition: 3 });
  const worldX = layout.PLAYER_BASE_X + 3 * layout.POSITION_PIXEL_STEP;
  const worldY = layout.DEFAULT_STAGE_ORIGIN_Y;
  const projected = arenaCamera.projectWorldToScreen(worldX, worldY, target);

  assert.equal(projected.x, screenX(worldX, target));
  assert.equal(projected.y, (worldY - target.scrollY) * target.zoom);
});