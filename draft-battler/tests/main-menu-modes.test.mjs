import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { getUiCopy, SUPPORTED_LOCALES } from "../src/i18n.ts";

const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("main.ts", source, ts.ScriptTarget.ES2022, true);
const menu = parsed.statements.find((node) =>
  ts.isFunctionDeclaration(node) && node.name?.text === "createMainMenuOverlay");
const dailyFlag = parsed.statements
  .filter(ts.isVariableStatement)
  .flatMap((node) => [...node.declarationList.declarations])
  .find((node) => ts.isIdentifier(node.name) && node.name.text === "DAILY_CHALLENGE_MENU_ENABLED");
assert.ok(menu);
assert.ok(dailyFlag);
// Read the real flag and menu together: a hard-coded test flag would miss accidentally re-enabling the mode.
const compiled = ts.transpileModule(`const ${dailyFlag.getText(parsed)};\n${menu.getText(parsed)}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
  }
  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
}

function elements(root) {
  return [root, ...root.children.flatMap(elements)];
}

function render(pvpEnabled, locale) {
  const copy = getUiCopy(locale);
  const marker = (action) => Object.assign(new Element("button"), { action });
  const context = {
    document: { createElement: (tag) => new Element(tag) },
    APP_NAME: "BroBattler",
    getCopy: () => copy,
    PVP_UI_ENABLED: pvpEnabled,
    soloRankingStarting: false,
    createMainMenuLanguagePicker: () => marker("language"),
    createBotDifficultyButton: marker,
    createOnlineModeButton: () => marker("online"),
    createDailyChallengeButton: () => assert.fail("Hidden daily challenge must not be constructed"),
    createRunHistoryButton: () => marker("history"),
    createPvpLeaderboardButton: (mode) => marker(`ranking:${mode}`),
    openHowToPlay: () => {},
    openCompendium: () => {},
    setFocusKey: (node, key) => { node.focusKey = key; },
  };
  vm.runInNewContext(compiled, context, { filename: "main-menu-modes.headless.cjs" });
  const nodes = elements(context.createMainMenuOverlay());
  return {
    grid: nodes.find((node) => node.className === "main-menu__mode-grid"),
    utility: nodes.find((node) => node.className === "main-menu__utility-actions"),
    copy,
    context,
  };
}

for (const pvpEnabled of [true, false]) {
  test(`main menu shows only available bot/PvP modes with PvP ${pvpEnabled ? "enabled" : "disabled"}`, () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { grid, utility, copy, context } = render(pvpEnabled, locale);
      assert.deepEqual(grid.children.map((button) => button.action),
        pvpEnabled ? ["standard", "strong", "online"] : ["standard", "strong"]);
      assert.equal(grid.attributes.get("role"), "group");
      assert.equal(grid.attributes.get("aria-label"), copy.startRun);
      assert.equal(utility.children[0].textContent, copy.howToPlay);
      assert.equal(utility.children[0].listeners.get("click"), context.openHowToPlay);
      assert.equal(utility.children[1].textContent, copy.compendium);
      assert.equal(utility.children[1].listeners.get("click"), context.openCompendium);
      assert.deepEqual(utility.children.slice(2).map((button) => button.action),
        pvpEnabled ? ["history", "ranking:strong_bot"] : ["history"]);
    }
  });
}
