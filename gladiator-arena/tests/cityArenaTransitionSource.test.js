import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mainSource = readFileSync(join(root, "src", "main.ts"), "utf8");
const stylesSource = readFileSync(join(root, "src", "styles.css"), "utf8");

test("arena button waits for the city zoom transition before starting combat", () => {
  assert.match(mainSource, /async function startGameWithCityTransition/);
  assert.match(mainSource, /isArenaTransitionRunning/);
  assert.match(mainSource, /prewarmArenaAssetsForBrowserCache/);
  assert.match(mainSource, /void prewarmArenaAssetsForBrowserCache\(\)/);
  assert.match(mainSource, /cityMenu\?\.classList\.add\("city-menu--arena-transition"\)/);
  assert.match(mainSource, /await \(cityScene\?\.focusArenaTransition\(\) \?\? Promise\.resolve\(\)\)/);
  assert.match(mainSource, /startGame\(\)/);
  assert.match(mainSource, /cityMenu\?\.classList\.remove\("city-menu--arena-transition"\)/);
});

test("city arena transition darkens the whole city UI", () => {
  assert.match(stylesSource, /\.city-menu--arena-transition::after/);
  assert.match(stylesSource, /z-index: 23/);
  assert.match(stylesSource, /background: rgba\(10, 3, 0, 0\.9\)/);
  assert.match(stylesSource, /760ms cubic-bezier/);
});

test("battle screen starts dark while the arena entry camera pulls back", () => {
  assert.match(mainSource, /dom\.gameScreen\.classList\.add\("battle-screen--arena-entry"\)/);
  assert.match(mainSource, /arenaEntryAnimation\.finally/);
  assert.match(mainSource, /dom\.gameScreen\.classList\.remove\("battle-screen--arena-entry"\)/);
  assert.match(stylesSource, /\.battle-screen::after/);
  assert.match(stylesSource, /\.battle-screen--arena-entry::after/);
  assert.match(stylesSource, /opacity: 1/);
  assert.match(stylesSource, /transition: opacity 760ms cubic-bezier/);
});
