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

test("MVP UI exposes every agreed control and labels shared rolls clearly", () => {
  assert.match(main, /PRESET_COUNTS = \[3, 10, 20, 50\]/);
  assert.match(main, /TARGETS = \[2, 3, 4, 5, 6\]/);
  assert.match(main, /SHARE RESULT/);
  assert.match(main, /ROLL YOUR OWN/);
  assert.match(main, /SHARED RESULT/);
  assert.doesNotMatch(main, /Not independently verified/);
  assert.match(main, /Individual dice/);
  assert.match(main, /results-empty/);
  assert.match(main, /scrollIntoView/);
  assert.match(main, /Only 6s count/);
  assert.match(main, /class="dice-mark"/);
  assert.match(main, /DIE_PIP_POSITIONS/);
  assert.match(main, /renderDieFace/);
  assert.match(main, /successes === 0 \? "no-successes"/);
  assert.doesNotMatch(main, /[⚀-⚅]/u);
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
  assert.match(styles, /--success-bright/);
  assert.match(styles, /\.face-card\.qualifies strong/);
  assert.match(styles, /\.success-count\.no-successes strong/);
  assert.match(styles, /\.die-pip-9/);
  assert.match(styles, /\.rolling-display > \.die-face:nth-child/);
  assert.doesNotMatch(styles, /\.rolling-display span:nth-child/);
  assert.match(styles, /min-height: 50px/);
  assert.match(styles, /min-height: 4[468]px/);
  assert.match(styles, /@media \(max-width: 430px\)/);
});
