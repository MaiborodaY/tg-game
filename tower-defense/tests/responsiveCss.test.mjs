import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BUILD_PAD_HIT_SIZE } from "../src/game/config.ts";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("short Telegram viewports keep controls and modals vertically reachable", () => {
  const shortViewport = css.match(/@media \(max-height: 519px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(shortViewport, /html \{ height: auto; min-height: 100%; overflow-y: auto;/);
  assert.match(shortViewport, /body \{ height: auto; min-height: 100%; overflow: visible;/);
  assert.match(shortViewport, /\.game-root canvas \{ touch-action: pan-y !important;/);
  assert.match(shortViewport, /\.app-shell \{ height: auto; min-height: 760px;/);
  assert.match(shortViewport, /\.modal-layer \{ display: block; overflow-y: auto;/);
});

test("canvas build pads retain generous touch hit slop after scaling", () => {
  assert.ok(BUILD_PAD_HIT_SIZE >= 84);
});

test("the Phaser canvas preserves aspect ratio and late-wave previews can scroll", () => {
  assert.doesNotMatch(css, /\.game-root canvas \{[^}]*width:\s*100%\s*!important[^}]*height:\s*100%\s*!important/s);
  assert.match(css, /\.game-root canvas \{[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;/s);
  assert.match(css, /\.enemy-list \{[^}]*overflow-x:\s*auto;/s);
});

test("tower selection keeps the battlefield grid row stable", () => {
  assert.match(css, /\.command-panel \{[^}]*--tower-controls-height:\s*139px;/s);
  assert.match(css, /\.command-panel \{[^}]*grid-template-rows:\s*minmax\(var\(--tower-controls-height\), auto\) auto;/s);

  const compactViewport = css.match(/@media \(max-height: 700px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(compactViewport, /\.command-panel \{ --tower-controls-height:\s*129px;/);
});
