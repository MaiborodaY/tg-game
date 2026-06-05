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
          return { GAME_WIDTH: 430, GAME_HEIGHT: 764, DEFAULT_ACTION_ARC_ROTATION: 0, DEFAULT_ACTION_ARC_RADIUS: 62, DEFAULT_ACTION_BUTTON_SCALE: 1, DEFAULT_ACTION_FORWARD_ANGLE: -108, DEFAULT_ACTION_BACK_ANGLE: -166, DEFAULT_ACTION_LUNGE_ANGLE: -34, DEFAULT_ACTION_LIGHT_ANGLE: -34, DEFAULT_ACTION_MEDIUM_ANGLE: -70, DEFAULT_ACTION_HEAVY_ANGLE: -108, DEFAULT_ACTION_TAUNT_ANGLE: 28, DEFAULT_ACTION_REST_ANGLE: 106 };
        }

        if (id === "./arenaCamera") {
          return {
            getCameraTarget: () => ({ scrollX: 0, scrollY: 0, zoom: 1, centerX: 215, centerY: 382 }),
            projectWorldToScreen: (x, y) => ({ x, y }),
          };
        }

        if (id === "./combat") {
          return { MAX_STAMINA: 10, MELEE_RANGE: 0 };
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
  return { activeTurn: "player", result: "playing", distance, player: { stamina: 10 }, ...overrides };
}

test("distance arc shows movement controls plus lunge", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(3));

  assert.deepEqual(
    Array.from(layout.buttons, (button) => button.actionId),
    ["forward", "back", "lunge", "taunt"],
  );
});

test("clinch arc swaps approach controls for attacks", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(0));

  assert.deepEqual(
    Array.from(layout.buttons, (button) => button.actionId),
    ["back", "heavy", "medium", "light", "taunt"],
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
test("debug tuning can rotate and scale the action arc", () => {
  const base = actionArcLayout.getActionArcLayout(makeState(3));
  const tuned = actionArcLayout.getActionArcLayout(makeState(3), {
    actionArcRotation: 90,
    actionArcRadius: 100,
    actionButtonScale: 1.5,
  });

  assert.notEqual(Math.round(tuned.buttons[0].x), Math.round(base.buttons[0].x));
  assert.notEqual(Math.round(tuned.buttons[0].y), Math.round(base.buttons[0].y));
  assert.equal(tuned.buttons[0].scale, 1.5);
});

test("debug tuning can set a single absolute action button angle", () => {
  const base = actionArcLayout.getActionArcLayout(makeState(3));
  const tuned = actionArcLayout.getActionArcLayout(makeState(3), {
    actionForwardArcAngle: 90,
  });
  const baseForward = base.buttons.find((button) => button.actionId === "forward");
  const tunedForward = tuned.buttons.find((button) => button.actionId === "forward");
  const baseBack = base.buttons.find((button) => button.actionId === "back");
  const tunedBack = tuned.buttons.find((button) => button.actionId === "back");

  assert.notEqual(Math.round(tunedForward.x), Math.round(baseForward.x));
  assert.notEqual(Math.round(tunedForward.y), Math.round(baseForward.y));
  assert.equal(Math.round(tunedBack.x), Math.round(baseBack.x));
  assert.equal(Math.round(tunedBack.y), Math.round(baseBack.y));
});

test("action buttons hide while the enemy is taking a turn", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(3, { activeTurn: "enemy" }));

  assert.equal(layout.buttons.length, 0);
});

test("action buttons hide after the fight is over", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(0, { result: "win" }));

  assert.equal(layout.buttons.length, 0);
});
test("utility action becomes rest only below half stamina", () => {
  const highStamina = actionArcLayout.getActionArcLayout(makeState(3, { player: { stamina: 5 } }));
  const lowStamina = actionArcLayout.getActionArcLayout(makeState(3, { player: { stamina: 4 } }));

  assert.equal(highStamina.buttons.at(-1).actionId, "taunt");
  assert.equal(lowStamina.buttons.at(-1).actionId, "rest");
});

test("clinch arc uses one merged utility action", () => {
  const lowStamina = actionArcLayout.getActionArcLayout(makeState(0, { player: { stamina: 4 } }));

  assert.deepEqual(
    Array.from(lowStamina.buttons, (button) => button.actionId),
    ["back", "heavy", "medium", "light", "rest"],
  );
});
test("clinch attack labels show low medium and strong tiers", () => {
  const layout = actionArcLayout.getActionArcLayout(makeState(0));
  const labels = Object.fromEntries(layout.buttons.map((button) => [button.actionId, button.label]));

  assert.equal(labels.light, "LOW");
  assert.equal(labels.medium, "MED");
  assert.equal(labels.heavy, "STRONG");
});