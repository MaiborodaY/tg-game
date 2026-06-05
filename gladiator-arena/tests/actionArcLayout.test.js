import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadActionArcLayoutModule() {
  const filename = fileURLToPath(new URL("../src/actionArcLayout.ts", import.meta.url));
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
          return { GAME_WIDTH: 430, GAME_HEIGHT: 764 };
        }

        if (id === "./combat") {
          return { MELEE_RANGE: 0 };
        }

        if (id === "./stageLayout") {
          return {
            getStageLayout: (state) => ({
              playerX: state.playerX ?? 85,
              playerY: state.playerY ?? 520,
              playerScale: state.playerScale ?? 1,
            }),
          };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
    },
    { filename },
  );

  return module.exports;
}

const actionArcLayout = loadActionArcLayoutModule();

function makeState(distance, overrides = {}) {
  return { distance, ...overrides };
}

test("distance arc shows movement controls plus lunge", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(3));

  assert.deepEqual(
    Array.from(layout.buttons, (button) => button.actionId),
    ["forward", "back", "lunge", "rest"],
  );
});

test("clinch arc swaps approach controls for attacks", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(0));

  assert.deepEqual(
    Array.from(layout.buttons, (button) => button.actionId),
    ["back", "heavy", "light", "taunt", "rest"],
  );
});

test("arc button centers stay inside the mobile game frame", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(3, { playerX: 10, playerY: 520 }));

  for (const button of layout.buttons) {
    assert.ok(button.x >= actionArcLayout.ACTION_ARC_BUTTON_EDGE);
    assert.ok(button.x <= 430 - actionArcLayout.ACTION_ARC_BUTTON_EDGE);
    assert.ok(button.y >= actionArcLayout.ACTION_ARC_MIN_Y);
    assert.ok(button.y <= actionArcLayout.ACTION_ARC_MAX_Y);
  }
});