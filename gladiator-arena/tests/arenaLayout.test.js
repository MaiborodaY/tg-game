import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadArenaLayoutModule() {
  const filename = fileURLToPath(new URL("../src/arenaLayout.ts", import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  const module = { exports: {} };

  vm.runInNewContext(outputText, { exports: module.exports, module }, { filename });

  return module.exports;
}

const arenaLayout = loadArenaLayoutModule();

test("arena canvas uses a vertical 9:16 mobile layout", () => {
  assert.equal(arenaLayout.GAME_WIDTH, 430);
  assert.equal(arenaLayout.GAME_HEIGHT, 764);
  assert.ok(Math.abs(arenaLayout.GAME_WIDTH / arenaLayout.GAME_HEIGHT - 9 / 16) < 0.01);
});

test("stage origin is the shared gameplay and debug coordinate base", () => {
  assert.equal(arenaLayout.DEFAULT_STAGE_ORIGIN_X, 215);
  assert.equal(arenaLayout.DEFAULT_STAGE_ORIGIN_Y, 520);
  assert.equal(arenaLayout.DEFAULT_PLAYER_STAGE_X, -130);
  assert.equal(arenaLayout.DEFAULT_PLAYER_STAGE_Y, 0);
  assert.equal(arenaLayout.DEFAULT_ENEMY_STAGE_X, 130);
  assert.equal(arenaLayout.DEFAULT_ENEMY_STAGE_Y, 0);
});

test("fighter ground line is derived from the stage origin", () => {
  assert.equal(arenaLayout.GROUND_Y, arenaLayout.DEFAULT_STAGE_ORIGIN_Y);
  assert.equal(arenaLayout.FIGHTER_BASE_Y, arenaLayout.DEFAULT_STAGE_ORIGIN_Y - 132);
});