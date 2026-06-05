import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadTurnProbeModule() {
  const filename = fileURLToPath(new URL("../src/turnProbe.ts", import.meta.url));
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
      console: { info() {} },
    },
    { filename },
  );

  return module.exports;
}

const turnProbe = loadTurnProbeModule();

test("turn probe formats the full turn chain state", () => {
  const text = turnProbe.formatTurnProbe(
    {
      activeTurn: "enemy",
      distance: 2,
      playerPosition: 1,
      enemyPosition: 3,
      lastPlayerAction: "forward",
      lastEnemyAction: undefined,
    },
    "scheduled",
    "forward",
  );

  assert.equal(text.includes("turn=enemy"), true);
  assert.equal(text.includes("timer=scheduled"), true);
  assert.equal(text.includes("dist=2"), true);
  assert.equal(text.includes("p=1"), true);
  assert.equal(text.includes("e=3"), true);
  assert.equal(text.includes("click=forward"), true);
  assert.equal(text.includes("lastP=forward"), true);
  assert.equal(text.includes("lastE=none"), true);
});