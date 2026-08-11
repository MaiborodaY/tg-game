import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("mobile viewport supports safe areas and user zoom", () => {
  assert.match(indexHtml, /name="viewport"[^>]*viewport-fit=cover/);
  assert.doesNotMatch(indexHtml, /maximum-scale|user-scalable/);
});

test("mobile controls preserve safe-area offsets and accessible touch targets", () => {
  for (const variable of ["--safe-top", "--safe-right", "--safe-bottom", "--safe-left"]) {
    assert.match(styles, new RegExp(`${variable}:\\s*env\\(safe-area-inset-`));
  }

  assert.match(styles, /\.draft-hud\s*\{[^}]*var\(--safe-top\)[^}]*var\(--safe-left\)[^}]*var\(--safe-right\)/s);
  assert.match(styles, /\.field-action-bar\s*\{[^}]*var\(--safe-bottom\)/s);
  assert.match(styles, /\.logs-button\s*\{[^}]*var\(--safe-right\)[^}]*var\(--safe-bottom\)/s);

  for (const selector of [
    "reroll-button",
    "card-info-panel__close",
    "logs-panel__close",
    "logs-round-button",
  ]) {
    assert.match(styles, new RegExp(`\\.${selector}\\s*\\{[^}]*?(?:min-)?height:\\s*44px`, "s"));
  }
});

test("compact layouts and reduced motion remain part of the stylesheet contract", () => {
  assert.match(styles, /@media\s*\(max-width:\s*360px\)/);
  assert.match(styles, /@media\s*\(max-height:\s*720px\)/);
  assert.match(styles, /\.draft-panel\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.draft-grid \.unit-card\s*\{[^}]*touch-action:\s*pan-y/s);
  assert.match(styles, /\.unit-card__drag-handle\s*\{[^}]*height:\s*44px[^}]*touch-action:\s*none/s);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /\.terminal-result__metrics\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
});

test("mobile draft intelligence and critical card copy remain readable", () => {
  assert.match(
    styles,
    /\.enemy-army-intel__grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,[^}]*grid-template-rows:\s*repeat\(2,/s,
  );
  assert.match(styles, /\.enemy-army-intel__slot\[data-row-label\]::before\s*\{[^}]*content:\s*attr\(data-row-label\)/s);

  for (const selector of [
    "unit-card__rarity",
    "unit-card__stat-label",
    "unit-card__ability",
    "enemy-army-intel__slot-name",
    "unit-card__tag-row span",
    "unit-card__synergy-forecast",
  ]) {
    assert.match(styles, new RegExp(`\\.${selector.replace(" ", "\\s+")}\\s*\\{[^}]*font-size:\\s*9px`, "s"));
  }
});

test("move mode uses one instruction panel and compact target markers", () => {
  assert.match(styles, /\.keyboard-move-panel__copy span\s*\{[^}]*font-size:\s*10px/s);
  assert.match(styles, /\.field-slot--move-target::before\s*\{[^}]*border-color:[^}]*background:/s);
  assert.match(styles, /\.field-slot--move-swap::before\s*\{[^}]*border-color:[^}]*background:/s);
  assert.match(styles, /\.field-slot__target-label--move\s*\{[^}]*width:\s*24px[^}]*font-size:\s*0/s);
  assert.match(styles, /\.field-slot__target-label--move::before\s*\{[^}]*content:\s*"\\2192"/s);
  assert.match(styles, /\.field-slot__target-label--move-swap::before\s*\{[^}]*content:\s*"\\2194"/s);
});
