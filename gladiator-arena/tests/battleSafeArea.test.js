import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadBattleSafeAreaModule(cssVars = {}, options = {}) {
  const filename = fileURLToPath(new URL("../src/battleSafeArea.ts", import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });
  const module = { exports: {} };
  const standardHud = {
    getBoundingClientRect: () => ({ top: 800, height: 100 }),
  };
  const classicHud = {
    getBoundingClientRect: () => ({ top: 700, height: 220 }),
  };
  const battleScreen = {
    getBoundingClientRect: () => ({ top: 0, height: 1000 }),
    querySelector: (selector) => {
      if (selector === ".classic-action-bar") {
        return classicHud;
      }

      if (selector === ".arena-fighters-strip") {
        return standardHud;
      }

      return undefined;
    },
  };
  const root = {
    closest: () => battleScreen,
  };

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: (id) => {
        if (id === "./arenaLayout") {
          return {
            GAME_HEIGHT: 764,
            DEFAULT_HUD_SAFE_GAP_RATIO: 0.18,
            DEFAULT_HUD_SAFE_MIN_GAP: 24,
          };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
      document: {
        body: {
          classList: {
            contains: (className) => Boolean(options.classicHudActive && className === "arena-hud-classic"),
          },
        },
        querySelector: () => battleScreen,
      },
      window: {
        getComputedStyle: () => ({
          getPropertyValue: (key) => cssVars[key] ?? "",
        }),
      },
    },
    { filename },
  );

  return { battleSafeArea: module.exports, root };
}

test("battle safe bottom uses HUD CSS tuning variables", () => {
  const { battleSafeArea, root } = loadBattleSafeAreaModule({
    "--hud-safe-gap-ratio": "0.25",
    "--hud-safe-min-gap": "40px",
  });

  assert.equal(battleSafeArea.getBattleSafeBottom(root, 1000), 760);
});

test("battle safe bottom falls back to default HUD clearance", () => {
  const { battleSafeArea, root } = loadBattleSafeAreaModule();

  assert.equal(battleSafeArea.getBattleSafeBottom(root, 1000), 776);
});

test("battle safe bottom uses the classic action wheel in classic HUD mode", () => {
  const { battleSafeArea, root } = loadBattleSafeAreaModule(
    {
      "--hud-safe-gap-ratio": "0.1",
      "--hud-safe-min-gap": "30px",
    },
    { classicHudActive: true },
  );

  assert.equal(battleSafeArea.getBattleSafeBottom(root, 1000), 670);
});
