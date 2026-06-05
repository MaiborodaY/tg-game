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
            POSITION_PIXEL_STEP: 96,
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

function makeCombatState(playerPosition, enemyPosition) {
  return { playerPosition, enemyPosition };
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

test("stage layout applies combat movement from the shared origin", () => {
  const layout = stageLayout.getStageLayout(makeCombatState(1, 2));

  assert.equal(layout.playerX, 181);
  assert.equal(layout.enemyX, 249);
});

test("stage layout uses debug tuning as an override, not a separate coordinate system", () => {
  const layout = stageLayout.getStageLayout(makeCombatState(2, 1), {
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

  assert.equal(layout.playerX, 332);
  assert.equal(layout.playerY, 520);
  assert.equal(layout.enemyX, 88);
  assert.equal(layout.enemyY, 490);
  assert.equal(layout.playerScale, 1.4);
  assert.equal(layout.enemyScale, 0.8);
});
