import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadActionWheelLayoutModule() {
  const filename = fileURLToPath(new URL("../src/actionWheelLayout.ts", import.meta.url));
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
        if (id === "./combat") {
          return { MELEE_RANGE: 0 };
        }

        throw new Error(`Unexpected require: ${id}`);
      },
    },
    { filename },
  );

  return module.exports;
}

const actionWheelLayout = loadActionWheelLayoutModule();

test("open distance wheel shows movement, lunge, and rest", () => {
  const ids = actionWheelLayout.getActionWheelSlots(3).map((slot) => slot.actionId);

  assert.equal(JSON.stringify(ids), JSON.stringify(["forward", "back", "lunge", "rest"]));
});

test("clinch wheel swaps forward and lunge for attacks", () => {
  const ids = actionWheelLayout.getActionWheelSlots(0).map((slot) => slot.actionId);

  assert.equal(JSON.stringify(ids), JSON.stringify(["light", "back", "heavy", "taunt", "rest"]));
  assert.equal(ids.includes("forward"), false);
  assert.equal(ids.includes("lunge"), false);
});