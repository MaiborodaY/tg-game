import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

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
        if (id === "./assets") {
          return { GAME_HEIGHT: 420, GAME_WIDTH: 1040 };
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

test("distance steps leave small fighters visibly separated", () => {
  assert.equal(arenaCamera.getPlayerWorldX({ playerPosition: 0 }), 274);
  assert.equal(arenaCamera.getEnemyWorldX({ enemyPosition: 3 }), 766);
  assert.equal(arenaCamera.getEnemyWorldX({ enemyPosition: 0 }) - arenaCamera.getPlayerWorldX({ playerPosition: 0 }), 72);
});

test("camera keeps player near the left safe zone", () => {
  const player = { distance: 3, playerPosition: 0 };
  const target = arenaCamera.getCameraTarget(player);
  const playerScreenX = screenX(arenaCamera.getPlayerWorldX(player), target);

  assert.ok(Math.abs(playerScreenX - arenaCamera.CAMERA_PLAYER_SCREEN_X) < 1);
});

test("camera zooms in as fighters get close", () => {
  const far = arenaCamera.getCameraTarget({ distance: 4, playerPosition: 0 });
  const close = arenaCamera.getCameraTarget({ distance: 0, playerPosition: 0 });

  assert.equal(far.zoom, arenaCamera.FAR_CAMERA_ZOOM);
  assert.equal(close.zoom, arenaCamera.CLOSE_CAMERA_ZOOM);
});
