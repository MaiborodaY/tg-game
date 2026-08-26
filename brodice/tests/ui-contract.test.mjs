import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, main, styles] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
]);

test("entry loads Telegram before the app and carries product metadata", () => {
  const sdkPosition = html.indexOf("telegram-web-app.js");
  const modulePosition = html.indexOf("/src/main.ts");
  assert.ok(sdkPosition >= 0 && sdkPosition < modulePosition);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /BroDice · D6 Dice Roller/);
  assert.match(html, /og\.png/);
});

test("MVP UI exposes every agreed control and warns on shared rolls", () => {
  assert.match(main, /PRESET_COUNTS = \[3, 10, 20, 50\]/);
  assert.match(main, /TARGETS = \[2, 3, 4, 5, 6\]/);
  assert.match(main, /SHARE RESULT/);
  assert.match(main, /ROLL YOUR OWN/);
  assert.match(main, /Not independently verified/);
  assert.match(main, /Individual dice/);
  assert.match(main, /results-empty/);
  assert.match(main, /scrollIntoView/);
  assert.match(main, /Only 6s count/);
  assert.match(main, /class="dice-mark"/);
  assert.doesNotMatch(main, /class="ork-/);
  assert.doesNotMatch(main, /<span>VI<\/span>/);
  assert.doesNotMatch(main, /TOTAL SCORE|sum of dice/i);
});

test("mobile CSS includes Telegram safe areas, compact layout, reduced motion, and touch-sized controls", () => {
  assert.match(styles, /--tg-safe-bottom/);
  assert.match(styles, /prefers-reduced-motion: no-preference/);
  assert.match(styles, /overflow-x: clip/);
  assert.doesNotMatch(styles, /min-width: 320px/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styles, /min-height: 50px/);
  assert.match(styles, /min-height: 4[468]px/);
  assert.match(styles, /@media \(max-width: 430px\)/);
});
