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
test("debug preview uses the same flask resource HUD as the game", () => {
  assert.equal(debugHtml.includes('class="fighters-strip arena-fighters-strip flask-hud"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--hp"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--armor"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--stamina"'), true);
});

test("debug panel source contains precision controls and grid", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("Show grid"), true);
  assert.equal(debugPanelSource.includes("debug-panel__number"), true);
  assert.equal(debugPanelSource.includes("debug-grid"), true);
  assert.equal(debugPanelSource.includes("Origin X"), true);
  assert.equal(debugPanelSource.includes("Origin Y"), true);
  assert.equal(debugPanelSource.includes("Player Y"), true);
  assert.equal(debugPanelSource.includes("Enemy Y"), true);
  assert.equal(debugPanelSource.includes("Buttons rel X"), false);
  assert.equal(debugPanelSource.includes("Arc rotation"), true);
  assert.equal(debugPanelSource.includes("Arc radius"), true);
  assert.equal(debugPanelSource.includes("Button scale"), true);
  assert.equal(debugPanelSource.includes("FWD angle"), true);
  assert.equal(debugPanelSource.includes("LUNGE angle"), true);
  assert.equal(debugPanelSource.includes("MED angle"), true);
  assert.equal(debugPanelSource.includes("REST angle"), true);
});

test("debug panel groups controls by tuning category", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes('title: "Grid"'), true);
  assert.equal(debugPanelSource.includes('title: "Origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Fighters from origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Action buttons relative to player"'), false);
  assert.equal(debugPanelSource.includes('title: "Action arc"'), true);
  assert.equal(debugPanelSource.includes('title: "Action button angles"'), true);
  assert.equal(debugPanelSource.includes("debug-panel__control-reset"), true);
  assert.equal(debugPanelSource.includes("resetValue: 0"), true);
});
