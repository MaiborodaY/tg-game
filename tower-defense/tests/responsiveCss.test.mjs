import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("short Telegram viewports keep controls and modals vertically reachable", () => {
  const shortViewport = css.match(/@media \(max-height: 519px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(shortViewport, /body \{ overflow-y: auto;/);
  assert.match(shortViewport, /\.app-shell \{ height: auto; min-height: 520px;/);
  assert.match(shortViewport, /\.modal-layer \{ display: block; overflow-y: auto;/);
});
