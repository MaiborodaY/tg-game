import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(resolve(currentDir, "../index.html"), "utf8");
const debugHtml = readFileSync(resolve(currentDir, "../debug.html"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const debugMainSource = readFileSync(resolve(currentDir, "../src/debugMain.ts"), "utf8");

test("regular game does not mount debug controls", () => {
  assert.equal(indexHtml.includes("debugPanelHost"), false);
  assert.equal(indexHtml.includes("/src/debugMain.ts"), false);
  assert.equal(mainSource.includes("mountDebugPanel"), false);
});

test("debug app mounts the same arena with a separate tuning host", () => {
  assert.equal(debugHtml.includes('class="debug-app"'), true);
  assert.equal(debugHtml.includes('id="debugPanelHost"'), true);
  assert.equal(debugHtml.includes('/src/debugMain.ts'), true);
  assert.equal(debugHtml.includes('id="gameScreen" class="game-screen battle-screen"'), true);
  assert.equal(debugMainSource.includes("mountDebugPanel"), true);
});