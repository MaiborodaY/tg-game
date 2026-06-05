import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const actionArcSource = readFileSync(resolve(currentDir, "../src/actionArc.ts"), "utf8");
const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("action arc listens to debug tuning changes directly", () => {
  assert.equal(debugTuningSource.includes('new CustomEvent("arena-debug-tuning-change")'), true);
  assert.equal(actionArcSource.includes('window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
  assert.equal(actionArcSource.includes('window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
});

test("debug action arc exposes a visible center marker", () => {
  assert.equal(actionArcSource.includes('className = "action-arc__center"'), true);
  assert.equal(stylesSource.includes('body.debug-active .action-arc__center'), true);
});