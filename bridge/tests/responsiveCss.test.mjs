import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");

test("the table reserves a stable command dock instead of resizing per phase", () => {
  assert.match(css, /--dock-height:\s*222px/);
  assert.match(
    css,
    /\.game-shell\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) var\(--dock-height\)/,
  );
  assert.match(css, /\.control-dock\s*\{[\s\S]*min-height:\s*0/);
});

test("the local player badge stays above the fanned hand", () => {
  assert.match(
    css,
    /\.seat--bottom\s*\{[\s\S]*bottom:\s*calc\(var\(--card-height\) \+ 13px\)/,
  );
});

test("Telegram viewport and safe areas are used by both home and game layouts", () => {
  assert.match(css, /height:\s*var\(--tg-viewport-height\)/);
  assert.match(css, /\.home-screen\s*\{[\s\S]*env\(safe-area-inset-top\)/);
  assert.match(css, /\.game-shell\s*\{[\s\S]*env\(safe-area-inset-bottom\)/);
});

test("the Tower Defense return control remains touch friendly", () => {
  assert.match(css, /\.home-return-button\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(css, /\.home-return-button\s*\{[\s\S]*margin-right:\s*auto/);
});

test("compact Telegram heights keep an explicit dock reservation", () => {
  assert.match(css, /@media\s*\(max-height:\s*700px\)[\s\S]*--dock-height:\s*190px/);
  assert.match(css, /@media\s*\(max-height:\s*560px\)[\s\S]*--dock-height:\s*166px/);
  assert.match(
    css,
    /@media\s*\(max-height:\s*560px\)[\s\S]*\.dummy-layout\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  );
});
