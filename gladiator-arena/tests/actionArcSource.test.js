import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const actionArcSource = readFileSync(resolve(currentDir, "../src/actionArc.ts"), "utf8");
const classicActionBarSource = readFileSync(resolve(currentDir, "../src/classicActionBar.ts"), "utf8");
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

test("leather token buttons keep icons inside a stable centered layer", () => {
  assert.equal(stylesSource.includes("Leather token action buttons"), true);
  assert.equal(stylesSource.includes("--token-ring"), true);
  assert.equal(stylesSource.includes("--token-ring-width"), true);
  assert.equal(stylesSource.includes("--token-face-inset"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-rotation"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-brightness"), true);
  assert.equal(stylesSource.includes("--token-rim-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-outer-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-face-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-inner-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-stripe-shine-opacity"), true);
  assert.equal(stylesSource.includes("--action-icon-scale"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-scale"), true);
  assert.equal(stylesSource.includes(".action-arc__button::before"), true);
  assert.equal(stylesSource.includes(".action-arc__button::after"), true);
  assert.equal(stylesSource.includes(".action-arc__icon {"), true);
  assert.equal(stylesSource.includes("display: grid;"), true);
  assert.equal(stylesSource.includes("padding: 0;"), true);
  assert.equal(stylesSource.includes("--action-icon-size"), true);
});

test("debug tuning can scale token icons independently from the button", () => {
  assert.equal(actionArcSource.includes("export function syncActionTokenButton"), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-button-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-icon-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-rotation"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-brightness"'), true);
  assert.equal(actionArcSource.includes("getAttackIconStyleTuning"), true);
  assert.equal(stylesSource.includes("scale(var(--action-icon-scale))"), true);
  assert.equal(stylesSource.includes("rotate(var(--action-attack-icon-rotation)) scale(var(--action-attack-icon-scale))"), true);
  assert.equal(stylesSource.includes("brightness(var(--action-attack-icon-brightness))"), true);
});

test("classic action bar reuses leather token rendering", () => {
  assert.equal(classicActionBarSource.includes("mountClassicActionBar"), true);
  assert.equal(classicActionBarSource.includes("syncActionTokenButton"), true);
  assert.equal(classicActionBarSource.includes("data-classic-action-bar"), true);
  assert.equal(classicActionBarSource.includes('wheel.className = "classic-action-bar__wheel"'), true);
  assert.equal(classicActionBarSource.includes("arena-action-click"), true);
  assert.equal(classicActionBarSource.includes("canUseAction"), true);
  assert.equal(stylesSource.includes(".classic-action-bar .action-arc__button"), true);
  assert.equal(stylesSource.includes("body.arena-hud-classic .classic-action-bar"), true);
});

test("classic action bar swaps semicircle wheel layouts by distance", () => {
  assert.equal(classicActionBarSource.includes("MELEE_RANGE"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_DISTANCE_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_CLINCH_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_BOW_DISTANCE_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("classicActionButtonSlots"), true);
  assert.equal(classicActionBarSource.includes("classicWheelModeTuningKey"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--distance"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--clinch"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--bow-distance"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_WHEEL_TURN_MS"), true);
  assert.equal(classicActionBarSource.includes("createClassicButtonLayer"), true);
  assert.equal(classicActionBarSource.includes("projectSlotForWheelAngle"), true);
  assert.equal(classicActionBarSource.includes("const layers = [createClassicButtonLayer(onAction), createClassicButtonLayer(onAction)]"), true);
  assert.equal(classicActionBarSource.includes('button.style.setProperty("--classic-slot-x"'), true);
  assert.equal(classicActionBarSource.includes('button.style.setProperty("--classic-slot-y"'), true);
  assert.equal(stylesSource.includes(".classic-action-bar__wheel::before"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__layer"), true);
  assert.equal(stylesSource.includes("--classic-wheel-diameter: min(420px, calc(100vw - 12px))"), true);
  assert.equal(stylesSource.includes("--classic-wheel-radius: calc(var(--classic-wheel-diameter) / 2)"), true);
  assert.equal(stylesSource.includes("--classic-wheel-top-bleed: clamp(38px, 10vw, 48px)"), true);
  assert.equal(stylesSource.includes("height: calc(var(--classic-wheel-radius) + var(--classic-wheel-top-bleed))"), true);
  assert.equal(stylesSource.includes("top: var(--classic-wheel-top-bleed)"), true);
  assert.equal(stylesSource.includes("border-radius: 50%"), true);
  assert.equal(stylesSource.includes("rotate(var(--classic-wheel-angle))"), true);
  assert.equal(stylesSource.includes(".classic-action-bar--turning .classic-action-bar__button"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__button--visible"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar__button--dimmed"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__button--dimmed"), true);
});

test("classic bow distance layout keeps ranged attacks visible", () => {
  assert.equal(classicActionBarSource.includes("isBowFighter(state.player) && state.distance > MELEE_RANGE"), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "light", x: -78'), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "medium", x: 0'), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "heavy", x: 78'), true);
});

test("debug tuning can tune leather token fine details", () => {
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-ring-width"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-face-inset"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-rim-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-outer-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-face-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-inner-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-stripe-shine-opacity"'), true);
});

test("attack actions render carved tally marks inside the token", () => {
  assert.equal(actionArcSource.includes("ACTION_ATTACK_ICON_URLS"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-light.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-medium.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-heavy.webp"), true);
  assert.equal(actionArcSource.includes('className = "action-arc__attack-icon"'), true);
  assert.equal(actionArcSource.includes("document.createElement(\"img\")"), true);
  assert.equal(actionArcSource.includes('button.classList.toggle("action-arc__button--attack-token"'), true);
  assert.equal(stylesSource.includes(".action-arc__attack-icon"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-light.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-medium.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-heavy.webp")), true);
});
