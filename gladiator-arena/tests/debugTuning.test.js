import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadDebugTuningModule() {
  const filename = fileURLToPath(new URL("../src/debugTuning.ts", import.meta.url));
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

const debugTuningModule = loadDebugTuningModule();

test("debug tuning normalizes unsafe values", () => {
  const normalized = debugTuningModule.normalizeDebugTuning({
    showGrid: "yes",
    gridStep: 999,
    gridOpacity: -1,
    playerScale: 99,
    enemyScale: -4,
    playerXOffset: 999,
    playerYOffset: 999,
    enemyXOffset: -999,
    enemyYOffset: -999,
    fighterYOffset: Number.NaN,
    actionWheelScale: 0,
    actionWheelOffsetX: 999,
    actionWheelOffsetY: -999,
  });

  assert.equal(normalized.showGrid, true);
  assert.equal(normalized.gridStep, 100);
  assert.equal(normalized.gridOpacity, 0.1);
  assert.equal(normalized.playerScale, 6);
  assert.equal(normalized.enemyScale, 0.1);
  assert.equal(normalized.playerXOffset, 320);
  assert.equal(normalized.playerYOffset, 240);
  assert.equal(normalized.enemyXOffset, -320);
  assert.equal(normalized.enemyYOffset, -240);
  assert.equal(normalized.fighterYOffset, 0);
  assert.equal(normalized.actionWheelScale, 0.2);
  assert.equal(normalized.actionWheelOffsetX, 260);
  assert.equal(normalized.actionWheelOffsetY, -260);
});

test("debug tuning defaults enable the grid for the tuning app", () => {
  assert.equal(debugTuningModule.defaultDebugTuning.showGrid, true);
  assert.equal(debugTuningModule.defaultDebugTuning.gridStep, 40);
  assert.equal(debugTuningModule.defaultDebugTuning.playerScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionWheelScale, 1);
});