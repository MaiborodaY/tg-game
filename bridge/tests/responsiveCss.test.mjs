import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");

test("the table reserves a stable action dock so card selection cannot resize it", () => {
  assert.match(css, /--dock-height:\s*176px/);
  assert.match(
    css,
    /\.game-shell\s*\{[\s\S]*grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) var\(--dock-height\)/,
  );
  assert.match(css, /\.control-dock\s*\{[\s\S]*min-height:\s*0/);
});

test("Telegram viewport and safe areas are used by home, game, and modal layouts", () => {
  assert.match(css, /height:\s*var\(--tg-viewport-height\)/);
  assert.match(css, /\.home-screen\s*\{[\s\S]*env\(safe-area-inset-top\)/);
  assert.match(css, /\.game-shell\s*\{[\s\S]*env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.modal-backdrop\s*\{[\s\S]*env\(safe-area-inset-top\)/);
});

test("touch controls and the Tower Defense return stay finger friendly", () => {
  assert.match(css, /\.home-return-button\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(css, /\.primary-button,[\s\S]*\.secondary-button\s*\{[\s\S]*min-height:\s*46px/);
  assert.match(css, /\.icon-button\s*\{[\s\S]*width:\s*42px[\s\S]*height:\s*42px/);
  assert.match(css, /\.language-control\s*\{[\s\S]*min-height:\s*42px/);
});

test("the language control remains compact on narrow Telegram screens", () => {
  assert.match(css, /@media\s*\(max-width:\s*430px\)[\s\S]*\.language-control--game/);
  assert.match(css, /\.language-control--game\s*>\s*span\[aria-hidden="true"\][\s\S]*display:\s*none/);
});

test("compact Telegram heights retain explicit dock reservations", () => {
  assert.match(css, /@media\s*\(max-height:\s*700px\)[\s\S]*--dock-height:\s*154px/);
  assert.match(css, /@media\s*\(max-height:\s*560px\)[\s\S]*--dock-height:\s*136px/);
  assert.match(css, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*520px\)/);
});
