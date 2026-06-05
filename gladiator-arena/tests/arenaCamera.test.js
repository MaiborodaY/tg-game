import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const layout = {
  GAME_WIDTH: 430,
  GAME_HEIGHT: 764,
  GROUND_Y: 552,
  FIGHTER_BASE_Y: 420,
  PLAYER_BASE_X: 160,
  ENEMY_BASE_X: 520,
  POSITION_PIXEL_STEP: 96,
  ARENA_WORLD_PADDING_X: 360,
  ARENA_WORLD_LEFT: -360,
  ARENA_WORLD_WIDTH: 1150,
  CAMERA_PLAYER_SCREEN_X: 145,
  START_PLAYER_SCREEN_X: 105,
  START_ENEMY_SCREEN_X: 325,
  FAR_CAMERA_ZOOM: 0.86,
  CLOSE_CAMERA_ZOOM: 1.22,
  CAMERA_CENTER_Y: 390,
  OVERVIEW_DISTANCE: 3,
  OVERVIEW_MIN_ZOOM: 0.48,
  OVERVIEW_MAX_ZOOM: 0.68,
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
          return { MAX_DISTANCE: 4, START_DISTANCE: 3 };
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
  assert.equal(arenaCamera.getPlayerWorldX({ playerPosition: 0 }), layout.PLAYER_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ enemyPosition: 3 }), layout.ENEMY_BASE_X);
  assert.equal(arenaCamera.getEnemyWorldX({ enemyPosition: 0 }) - arenaCamera.getPlayerWorldX({ playerPosition: 0 }), 72);
});

test("overview camera places both fighters on start screen anchors", () => {
  const start = { distance: 3, playerPosition: 0, enemyPosition: 3 };
  const target = arenaCamera.getCameraTarget(start);
  const playerScreenX = screenX(arenaCamera.getPlayerWorldX(start), target);
  const enemyScreenX = screenX(arenaCamera.getEnemyWorldX(start), target);

  assert.ok(Math.abs(playerScreenX - layout.START_PLAYER_SCREEN_X) < 1);
  assert.ok(Math.abs(enemyScreenX - layout.START_ENEMY_SCREEN_X) < 1);
});

test("portrait camera focuses player in thumb-safe zone up close", () => {
  const player = { distance: 1, playerPosition: 0, enemyPosition: 1 };
  const target = arenaCamera.getCameraTarget(player);
  const playerScreenX = screenX(arenaCamera.getPlayerWorldX(player), target);

  assert.ok(Math.abs(playerScreenX - layout.CAMERA_PLAYER_SCREEN_X) < 1);
});

test("portrait camera zooms in as fighters get close", () => {
  const far = arenaCamera.getCameraTarget({ distance: 3, playerPosition: 0, enemyPosition: 3 });
  const close = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 0, enemyPosition: 0 });

  assert.ok(far.zoom < layout.FAR_CAMERA_ZOOM);
  assert.equal(close.zoom, layout.CLOSE_CAMERA_ZOOM);
});
