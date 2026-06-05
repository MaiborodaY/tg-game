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
    playerScale: 99,
    enemyScale: -4,
    playerXOffset: 999,
    enemyXOffset: -999,
    fighterYOffset: Number.NaN,
    actionWheelScale: 0,
    actionWheelOffsetX: 999,
    actionWheelOffsetY: -999,
  });

  assert.equal(normalized.playerScale, 2.2);
  assert.equal(normalized.enemyScale, 0.35);
  assert.equal(normalized.playerXOffset, 180);
  assert.equal(normalized.enemyXOffset, -180);
  assert.equal(normalized.fighterYOffset, 0);
  assert.equal(normalized.actionWheelScale, 0.55);
  assert.equal(normalized.actionWheelOffsetX, 160);
  assert.equal(normalized.actionWheelOffsetY, -160);
});

test("debug tuning defaults are stable", () => {
  assert.equal(debugTuningModule.defaultDebugTuning.playerScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.enemyScale, 1);
  assert.equal(debugTuningModule.defaultDebugTuning.actionWheelScale, 1);
});