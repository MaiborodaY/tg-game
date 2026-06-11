import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(resolve(currentDir, "../index.html"), "utf8");
const debugHtml = readFileSync(resolve(currentDir, "../debug.html"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const debugMainSource = readFileSync(resolve(currentDir, "../src/debugMain.ts"), "utf8");
const settingsMenuSource = readFileSync(resolve(currentDir, "../src/settingsMenu.ts"), "utf8");
const hudTuningSource = readFileSync(resolve(currentDir, "../src/hudTuning.ts"), "utf8");
const arenaLayoutSource = readFileSync(resolve(currentDir, "../src/arenaLayout.ts"), "utf8");
const viteConfigSource = readFileSync(resolve(currentDir, "../vite.config.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("regular game does not mount debug controls", () => {
  assert.equal(indexHtml.includes("debugPanelHost"), false);
  assert.equal(indexHtml.includes("/src/debugMain.ts"), false);
  assert.equal(mainSource.includes("mountDebugPanel"), false);
});

test("debug app mounts the same arena with a separate tuning host", () => {
  assert.equal(debugHtml.includes('class="debug-app"'), true);
  assert.equal(debugHtml.includes('id="debugPanelHost"'), true);
  assert.equal(debugHtml.includes('/src/debugMain.ts'), true);
  assert.equal(debugHtml.includes('id="gameScreen" class="game-screen battle-screen"'), true);
  assert.equal(debugMainSource.includes("mountDebugPanel"), true);
});

test("debug app starts the hero without starter armor", () => {
  assert.equal(debugMainSource.includes("equipment: createDebugHeroEquipment()"), true);
  assert.equal(debugMainSource.includes("createDefaultHeroEquipment()"), true);
  assert.equal(debugMainSource.includes("weaponMain: TRAINING_WEAPON_ID"), true);
  assert.equal(debugMainSource.includes("equipment: createStarterHeroEquipment()"), false);
});

test("debug preview uses the same flask resource HUD as the game", () => {
  assert.equal(debugHtml.includes('class="fighters-strip arena-fighters-strip flask-hud"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--hp"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--armor"'), true);
  assert.equal(debugHtml.includes('class="resource-flask flask--stamina"'), true);
});

test("debug preview can mount and tune the classic action wheel", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes('data-debug-mode="hud"'), true);
  assert.equal(debugPanelSource.includes("debug-hud-panel"), true);
  assert.equal(debugPanelSource.includes("debug-panel__hud-body"), true);
  assert.equal(debugPanelSource.includes('title: "Immersive flask HUD"'), true);
  assert.equal(debugPanelSource.includes('key: "hudMode"'), true);
  assert.equal(debugPanelSource.includes('value: "classic"'), true);
  assert.equal(debugHtml.includes('class="classic-combat-hud"'), true);
  assert.equal(debugHtml.includes('data-classic-action-bar'), true);
  assert.equal(debugMainSource.includes("mountClassicActionBar"), true);
  assert.equal(debugMainSource.includes("mountClassicHudDebug"), true);
  assert.equal(debugMainSource.includes("classicHudEditMode"), true);
  assert.equal(debugPanelSource.includes('title: "Classic action wheel"'), true);
  assert.equal(debugPanelSource.includes("Wheel X"), true);
  assert.equal(debugPanelSource.includes("Wheel Y"), true);
  assert.equal(debugPanelSource.includes("Wheel scale"), true);
  assert.equal(debugPanelSource.includes("Safe offset"), true);
  assert.equal(debugPanelSource.includes("Classic button slots"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-mode"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-action"), true);
  assert.equal(debugPanelSource.includes("data-classic-slot-field"), true);
  assert.equal(debugPanelSource.includes("CLASSIC_ACTION_WHEEL_BUTTONS"), true);
  assert.equal(debugPanelSource.includes("syncClassicActionSelectOptions"), true);
  assert.equal(debugPanelSource.includes("Quick shot"), true);
  assert.equal(debugMainSource.includes("getPreviewWheelMode: () => debugTuning.selectedClassicActionWheelMode"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-offset-x"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-offset-y"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-scale"), true);
  assert.equal(hudTuningSource.includes("--classic-hud-safe-offset"), true);
  assert.equal(hudTuningSource.includes("classic-hud-editing"), true);
  assert.equal(arenaLayoutSource.includes("DEFAULT_CLASSIC_HUD_OFFSET_X"), true);
  assert.equal(arenaLayoutSource.includes("DEFAULT_CLASSIC_HUD_SAFE_OFFSET"), true);
  assert.equal(viteConfigSource.includes('DEFAULT_CLASSIC_HUD_OFFSET_X: "classicHudOffsetX"'), true);
  assert.equal(viteConfigSource.includes('DEFAULT_CLASSIC_HUD_SAFE_OFFSET: "classicHudSafeOffset"'), true);
  assert.equal(stylesSource.includes("body.debug-mode-hud .action-arc"), true);
  assert.equal(stylesSource.includes(".debug-panel__hud-body"), true);
});

test("regular arena exposes switchable classic HUD markup", () => {
  assert.equal(indexHtml.includes('data-setting-hud-mode'), true);
  assert.equal(indexHtml.includes('value="immersive"'), true);
  assert.equal(indexHtml.includes('value="classic"'), true);
  assert.equal(indexHtml.includes('class="classic-combat-hud"'), true);
  assert.equal(indexHtml.includes('data-classic-action-bar'), true);
  assert.equal(indexHtml.includes('id="classicPlayerHpFill"'), true);
  assert.equal(indexHtml.includes('id="classicEnemyStaText"'), true);
  assert.equal(mainSource.includes("mountClassicActionBar"), true);
});

test("settings can persist the arena HUD mode", () => {
  assert.equal(settingsMenuSource.includes('export type PlayerHudMode = "immersive" | "classic"'), true);
  assert.equal(settingsMenuSource.includes('DEFAULT_PLAYER_HUD_MODE: PlayerHudMode = "classic"'), true);
  assert.equal(settingsMenuSource.includes("hudModeDefaultVersion"), true);
  assert.equal(settingsMenuSource.includes("hudMode: DEFAULT_PLAYER_HUD_MODE"), true);
  assert.equal(settingsMenuSource.includes("data-setting-hud-mode"), true);
  assert.equal(settingsMenuSource.includes("arena-hud-classic"), true);
  assert.equal(settingsMenuSource.includes("isPlayerHudMode"), true);
});

test("arena turn flow waits for action animations instead of hardcoded enemy delay", () => {
  assert.equal(mainSource.includes("const actionAnimation = commitState(nextState);"), true);
  assert.equal(mainSource.includes("void scheduleEnemyTurn(nextState, actionAnimation);"), true);
  assert.equal(mainSource.includes("await previousActionAnimation;"), true);
  assert.equal(mainSource.includes("setTurnAnimationLocked(true);"), true);
  assert.equal(mainSource.includes("}, 700);"), false);
  assert.equal(debugMainSource.includes("const actionAnimation = commitState(nextState);"), true);
  assert.equal(debugMainSource.includes("void scheduleEnemyTurn(nextState, actionAnimation);"), true);
  assert.equal(debugMainSource.includes("await previousActionAnimation;"), true);
  assert.equal(debugMainSource.includes("setTurnAnimationLocked(true);"), true);
  assert.equal(debugMainSource.includes("}, 700);"), false);
});

test("debug panel source contains precision controls and grid", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("Show grid"), true);
  assert.equal(debugPanelSource.includes("debug-panel__number"), true);
  assert.equal(debugPanelSource.includes("debug-grid"), true);
  assert.equal(debugPanelSource.includes("Origin X"), true);
  assert.equal(debugPanelSource.includes("Origin Y"), true);
  assert.equal(debugPanelSource.includes("Player Y"), true);
  assert.equal(debugPanelSource.includes("Enemy Y"), true);
  assert.equal(debugPanelSource.includes("Shadow blur"), true);
  assert.equal(debugPanelSource.includes("Buttons rel X"), false);
  assert.equal(debugPanelSource.includes("Arc rotation"), true);
  assert.equal(debugPanelSource.includes("Arc radius"), true);
  assert.equal(debugPanelSource.includes("Button scale"), true);
  assert.equal(debugPanelSource.includes("Icon scale"), true);
  assert.equal(debugPanelSource.includes("Attack icon"), true);
  assert.equal(debugPanelSource.includes("Ring width"), true);
  assert.equal(debugPanelSource.includes("Face inset"), true);
  assert.equal(debugPanelSource.includes("Rim shine"), true);
  assert.equal(debugPanelSource.includes("Outer shine"), true);
  assert.equal(debugPanelSource.includes('title: "Attack icons"'), true);
  assert.equal(debugPanelSource.includes("Light rotate"), true);
  assert.equal(debugPanelSource.includes("Medium scale"), true);
  assert.equal(debugPanelSource.includes("Heavy bright"), true);
  assert.equal(debugPanelSource.includes("FWD angle"), true);
  assert.equal(debugPanelSource.includes("LUNGE angle"), true);
  assert.equal(debugPanelSource.includes("MED angle"), true);
  assert.equal(debugPanelSource.includes("REST angle"), true);
});

test("debug panel groups controls by tuning category", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes('title: "Grid"'), true);
  assert.equal(debugPanelSource.includes('title: "Origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Fighters from origin"'), true);
  assert.equal(debugPanelSource.includes('title: "Immersive flask HUD"'), true);
  assert.equal(debugPanelSource.includes('title: "Classic action wheel"'), true);
  assert.equal(debugPanelSource.includes('title: "Action buttons relative to player"'), false);
  assert.equal(debugPanelSource.includes('title: "Action arc"'), true);
  assert.equal(debugPanelSource.includes('title: "Action button angles"'), true);
  assert.equal(debugPanelSource.includes("debug-panel__control-reset"), true);
  assert.equal(debugPanelSource.includes("data-debug-reset-value"), true);
});

test("popup tuning controls request live popup previews", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("onPreviewPopup"), true);
  assert.equal(debugPanelSource.includes("popupPreviewKindByKey"), true);
  assert.equal(debugPanelSource.includes('popupOffsetY: "all"'), true);
  assert.equal(debugPanelSource.includes('damagePopupOffsetY: "damage"'), true);
  assert.equal(debugPanelSource.includes('blockPopupScale: "block"'), true);
  assert.equal(debugPanelSource.includes('armorAbsorbPopupScale: "armorAbsorb"'), true);
  assert.equal(debugPanelSource.includes('armorBreakPopupScale: "armorBreak"'), true);
  assert.equal(debugPanelSource.includes("mountPopupPreviewTriggers(popupGroup)"), true);
  assert.equal(debugPanelSource.includes('input.addEventListener("input"'), true);
  assert.equal(debugPanelSource.includes('button.addEventListener("click"'), true);
});

test("debug panel keeps long tuning sections scrollable", () => {
  assert.match(stylesSource, /\.debug-app-panel\s*{[^}]*overflow-y: auto/s);
  assert.match(stylesSource, /\.debug-app-panel \.debug-panel\s*{[^}]*overflow: visible/s);
  assert.equal(stylesSource.includes("body.debug-mode-arena .debug-item-equipment-panel"), true);
  assert.equal(stylesSource.includes("body.debug-mode-arena .debug-auto-equipment-panel"), true);
  assert.equal(stylesSource.includes("overscroll-behavior: contain"), true);
});

test("debug panel exposes item equipment tuning separately", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-item-equipment-panel"), true);
  assert.equal(debugPanelSource.includes("Item equipment"), true);
  assert.equal(debugPanelSource.includes("mountItemEquipmentEditor"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__select"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__item-select"), true);
  assert.equal(debugPanelSource.includes("debug-item-equipment__controls"), true);
  assert.equal(debugPanelSource.includes("getCurrentEquipmentItemTuning"), true);
});

test("debug hero equipment picker can list catalog-only items", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("ALL_HERO_ITEM_IDS"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_ITEM_IDS"), true);
  assert.equal(debugPanelSource.includes("debugHeroInventory.flatMap"), true);
});

test("debug panel exposes auto equipment promotion controls", () => {
  const debugPanelSource = readFileSync(resolve(currentDir, "../src/debugPanel.ts"), "utf8");

  assert.equal(debugPanelSource.includes("debug-auto-equipment-panel"), true);
  assert.equal(debugPanelSource.includes("Auto equipment"), true);
  assert.equal(debugPanelSource.includes("savePromotedEquipmentItem"), true);
  assert.equal(debugPanelSource.includes("removePromotedEquipmentItem"), true);
  assert.equal(debugPanelSource.includes("AUTO_EQUIPMENT_ITEM_RECORDS"), true);
  assert.equal(debugPanelSource.includes("GENERATED_EQUIPMENT_ITEM_RECORDS"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__transform-controls"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__generated-select"), true);
  assert.equal(debugPanelSource.includes("debug-auto-equipment__remove"), true);
  assert.equal(debugPanelSource.includes("window.confirm"), true);
  assert.equal(debugPanelSource.includes("equipmentTuning: getCurrentEquipmentItemTuning"), true);
});
