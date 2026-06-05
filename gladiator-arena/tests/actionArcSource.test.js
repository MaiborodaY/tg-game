import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const actionArcSource = readFileSync(resolve(currentDir, "../src/actionArc.ts"), "utf8");
const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("action arc listens to debug tuning changes directly", () => {
  assert.equal(debugTuningSource.includes('new CustomEvent("arena-debug-tuning-change")'), true);
  assert.equal(actionArcSource.includes('window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
  assert.equal(actionArcSource.includes('window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
});

test("debug action arc exposes a visible center marker", () => {
  assert.equal(actionArcSource.includes('className = "action-arc__center"'), true);
  assert.equal(stylesSource.includes('body.debug-active .action-arc__center'), true);
});
test("action arc renders emoji icons with action-specific colors", () => {
  assert.equal(actionArcSource.includes("ACTION_ICONS"), true);
  assert.equal(actionArcSource.includes('className = "action-arc__icon"'), true);
  assert.equal(actionArcSource.includes("LUNGE_ICON_LAYERS"), true);
  assert.equal(stylesSource.includes('.action-arc__button[data-action="taunt"]'), true);
  assert.equal(stylesSource.includes('.action-arc__button[data-action="back"] .action-arc__icon'), true);
  assert.equal(stylesSource.includes('linear-gradient(180deg, #4ebfff'), true);
});
test("action arc buttons render icon-only content", () => {
  assert.equal(actionArcSource.includes("button.append(icon);"), true);
  assert.equal(actionArcSource.includes("button.append(icon, title, detail)"), false);
  assert.equal(actionArcSource.includes('button.setAttribute("aria-label"'), true);
  assert.equal(stylesSource.includes(".action-arc__button > span:not(.action-arc__icon)"), true);
});
test("lunge icon is layered and button gradients avoid the old glare spot", () => {
  assert.equal(actionArcSource.includes("renderActionIcon"), true);
  assert.equal(actionArcSource.includes("action-arc__icon-layer--bolt"), true);
  assert.equal(actionArcSource.includes("action-arc__icon-layer--sword"), true);
  assert.equal(stylesSource.includes("Icon-first action buttons: softer volume"), true);
  assert.equal(stylesSource.includes("font-size: 1.82rem"), true);
});

test("emoji action icons reset inherited button text metrics", () => {
  assert.equal(stylesSource.includes("Stabilize native emoji metrics inside the scaled round buttons."), true);
  assert.equal(stylesSource.includes(".action-arc__icon,\n.action-arc__icon-layer"), true);
  assert.equal(stylesSource.includes('font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;'), true);
  assert.equal(stylesSource.includes("padding: 0;"), true);
  assert.equal(stylesSource.includes("margin: 0;"), true);
});

test("emoji action icons draw from button data attributes", () => {
  assert.equal(actionArcSource.includes("button.dataset.icon = ACTION_ICONS[actionId]"), true);
  assert.equal(actionArcSource.includes("button.dataset.iconAlt = LUNGE_ICON_LAYERS[1].text"), true);
  assert.equal(stylesSource.includes("Draw action emoji on the button itself"), true);
  assert.equal(stylesSource.includes("content: attr(data-icon);"), true);
  assert.equal(stylesSource.includes("content: attr(data-icon-alt);"), true);
});
