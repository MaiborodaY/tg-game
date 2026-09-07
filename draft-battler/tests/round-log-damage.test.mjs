import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";

import { getCardDefinition, getCardStatsForUpgrade } from "../src/game/index.ts";
import { formatMessage, getCombatEventLabel, getLocalizedCard, getTagLabel, getUiCopy, SUPPORTED_LOCALES } from "../src/i18n.ts";
import { createRoundInsights } from "../src/roundInsights.ts";
import * as damagePresentation from "../src/roundDamagePresentation.ts";

// Run the production report/panel renderers without booting the game or mocking its statistics.
const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("main.ts", source, ts.ScriptTarget.ES2022, true);
const names = new Set([
  "createRoundLogReport", "createLogsPanel", "getSelectedRoundLog", "createRoundInsightsSummary",
  "createRoundUnitDamageRows", "createRoundSynergyDamageRows", "createRoundDamageRow", "getRoundDamageUnitName",
  "createBattleSummary", "getBattleSummaryDetail", "createEventPills", "countEvents",
  "createMatchupList", "createMatchupTitle", "createCompactCards", "getBotDifficultyLabel",
]);
const functions = parsed.statements
  .filter((node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text))
  .map((node) => node.getText(parsed));
assert.equal(functions.length, names.size, "All tested renderers must come from main.ts");
const compiled = ts.transpileModule(functions.join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.properties = new Map();
    this.style = { setProperty: (key, value) => this.properties.set(key, value) };
    this.text = "";
  }
  append(...children) { this.children.push(...children); }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map((child) => child.textContent).join(""); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  click() { this.listeners.get("click")?.(); }
}

function elements(root, className) {
  return [root, ...root.children.flatMap((child) => elements(child))]
    .filter((element) => !className || element.className.split(" ").includes(className));
}

function harness(locale = "ru", selectedLogRound = 3) {
  const context = {
    activeLocale: locale,
    document: { createElement: (tagName) => new Element(tagName) },
    getCopy: () => getUiCopy(locale),
    formatMessage, getCombatEventLabel, getLocalizedCard, getTagLabel,
    getCardDefinition, getCardStatsForUpgrade, createRoundInsights,
    ...damagePresentation,
    uiState: { selectedLogRound, playMode: "solo", run: { botDifficulty: "strong", round: 15, playerSlots: [] } },
    render() {},
    requestFocusAfterRender() {},
  };
  vm.runInNewContext(compiled, context, { filename: "round-log-damage.headless.cjs" });
  return context;
}

function slot(cardId, slotIndex) { return { cardId, slotIndex, upgradeLevel: 0 }; }

function damage(sourceId, targetId, hpDamage, armorDamage = 0) {
  return {
    type: "unit_damaged", time: 1, unitId: targetId, amount: hpDamage + armorDamage,
    hpDamage, shieldAbsorbed: armorDamage, remainingHp: 1,
    source: { kind: "unit", unitId: sourceId, hit: "primary" },
  };
}

function record() {
  const grave = "player-0-grave_binder";
  const boar = "player-1-boar_rider";
  const secondBoar = "player-2-boar_rider";
  const skeleton = "player-0-bone_pact_skeleton";
  const mage = "enemy-0-ember_mage";
  const shield = "enemy-1-shieldbearer";
  return {
    round: 3, playerHpBefore: 20, playerHpAfter: 18, enemyHpBefore: 20, enemyHpAfter: 20,
    draftOptions: [], draftRerollCount: 0,
    playerSlots: [slot("grave_binder", 0), slot("boar_rider", 1), slot("boar_rider", 2), slot("field_cleric", 3)],
    enemySlots: [slot("ember_mage", 0), slot("shieldbearer", 1)],
    combatResult: {
      winner: "enemy", hpLoss: 2, actions: 12,
      survivingPlayerUnits: [], survivingEnemyUnits: [],
      events: [
        { type: "unit_spawned", time: 0, unit: {
          instanceId: skeleton, owner: "player", cardId: "bone_soldier", slotIndex: 0,
          upgradeLevel: 0, summonedBy: grave,
        } },
        damage(boar, mage, 6, 2), damage(boar, shield, 2),
        damage(secondBoar, mage, 4, 2), damage(grave, mage, 2, 1),
        damage(skeleton, shield, 3, 2), damage(mage, boar, 8), damage(shield, grave, 3, 1),
        damage("player-3-field_cleric", shield, 0),
        { ...damage(boar, mage, 2), source: { kind: "synergy", owner: "player", tag: "mage", threshold: 4 } },
      ],
    },
  };
}

function renderedRows(root) {
  return elements(root, "round-result-damage__row").map((row) => ({
    owner: row.dataset.owner,
    label: elements(row, "round-result-damage__label")[0].children[1].textContent,
    amount: elements(row, "round-result-damage__value")[0]?.textContent,
    ratio: row.properties.get("--round-damage-ratio"),
    accessible: row.attributes.get("aria-label"),
  }));
}

test("round history renders all damaging units, duplicates and summons before the army roster", () => {
  const ui = harness();
  const log = record();
  const before = globalThis.structuredClone(log);
  const report = ui.createRoundLogReport(log);
  const rows = renderedRows(report);
  const name = (id) => getLocalizedCard("ru", getCardDefinition(id)).name;

  assert.deepEqual(rows.map(({ owner, label, amount }) => [owner, label, amount]), [
    ["player", name("boar_rider"), "10"],
    ["player", name("boar_rider"), "6"],
    ["player", name("bone_soldier"), "5"],
    ["player", name("grave_binder"), "3"],
    ["player", formatMessage(getUiCopy("ru").roundDamageSynergy, { tag: getTagLabel("ru", "mage") }), "2"],
    ["enemy", name("ember_mage"), "8"],
    ["enemy", name("shieldbearer"), "4"],
  ]);
  assert.equal(report.children[2].className, "round-result-insights");
  assert.equal(report.children[3].className, "matchup");
  assert.deepEqual(log, before, "Opening a historical report cannot modify recorded combat");
});

test("historical and immediate round summaries use identical rows and one damage scale", () => {
  const ui = harness();
  const log = record();
  const report = ui.createRoundLogReport(log);
  const rows = renderedRows(report);
  assert.deepEqual(rows, renderedRows(ui.createRoundInsightsSummary(log)));
  assert.deepEqual(rows.map(({ ratio }) => Number(ratio)), [1, 0.6, 0.5, 0.3, 0.2, 0.8, 0.4]);
  for (const row of elements(report, "round-result-damage__row")) {
    assert.match(row.attributes.get("aria-label"), /\S/);
    assert.equal(elements(row, "round-result-damage__track")[0].attributes.get("aria-hidden"), "true");
  }
});

test("empty and older non-attributable combat events show a safe empty state for both sides", () => {
  for (const events of [[], [damage("player-1-boar_rider", "enemy-0-ember_mage", 0)], [
    { type: "unit_damaged", unitId: "enemy-0-ember_mage", amount: 9, remainingHp: 1, shieldAbsorbed: 0 },
  ]]) {
    const ui = harness();
    const log = record();
    log.combatResult.events = events;
    const report = ui.createRoundLogReport(log);
    const rows = renderedRows(report);
    assert.deepEqual(rows.map(({ owner, label }) => [owner, label]), [
      ["player", getUiCopy("ru").roundDamageNone], ["enemy", getUiCopy("ru").roundDamageNone],
    ]);
    assert.ok(rows.every(({ amount, ratio }) => amount === undefined && ratio === undefined));
    assert.equal(elements(report, "round-result-damage__track").length, 0);
    assert.equal(elements(report, "compact-card").length, 6, "The existing roster is retained");
  }
});

test("history tabs render the selected recorded battle, not the latest round or current army", () => {
  const ui = harness("ru", 3);
  const historical = record();
  const latest = record();
  latest.round = 12;
  latest.combatResult.events = [damage("enemy-0-ember_mage", "player-1-boar_rider", 99)];
  const logs = [historical, latest];
  let panel = ui.createLogsPanel(logs);
  ui.render = () => { panel = ui.createLogsPanel(logs); };
  assert.equal(renderedRows(panel).length, 7);
  assert.equal(renderedRows(panel)[0].amount, "10");
  elements(panel, "logs-round-button")[1].click();
  assert.equal(ui.uiState.selectedLogRound, 12);
  assert.deepEqual(renderedRows(panel).map(({ amount }) => amount), [undefined, "99"]);
  elements(panel, "logs-round-button")[0].click();
  assert.equal(ui.uiState.selectedLogRound, 3);
  assert.deepEqual(renderedRows(panel), renderedRows(ui.createRoundInsightsSummary(historical)));
});

test("all supported languages retain exact damage numbers and localized owner/unit labels in history", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const ui = harness(locale);
    const report = ui.createRoundLogReport(record());
    const rows = renderedRows(report);
    assert.deepEqual(rows.map(({ amount }) => amount), ["10", "6", "5", "3", "2", "8", "4"]);
    const copy = getUiCopy(locale);
    assert.equal(rows[0].label, getLocalizedCard(locale, getCardDefinition("boar_rider")).name);
    assert.equal(rows[0].accessible, formatMessage(copy.roundDamageAccessible, {
      owner: copy.you, sources: rows[0].label, amount: 10,
    }));
    assert.equal(rows[5].accessible, formatMessage(copy.roundDamageAccessible, {
      owner: copy.roundDamageEnemy, sources: rows[5].label, amount: 8,
    }));
  }
});

test("long history reports scroll below fixed tabs and retain the same readable damage values", async () => {
  const styles = postcss.parse(await readFile(new URL("../src/styles.css", import.meta.url), "utf8"));
  const theme = postcss.parse(await readFile(new URL("../src/round-damage-theme.css", import.meta.url), "utf8"));
  function declarations(css, selector) {
    const values = new Map();
    css.walkRules((rule) => {
      if (rule.selector === selector) rule.walkDecls((declaration) => values.set(declaration.prop, declaration.value));
    });
    return values;
  }

  const panel = declarations(styles, ".logs-panel");
  assert.equal(panel.get("grid-template-rows"), "auto auto minmax(0, 1fr)");
  assert.equal(panel.get("max-height"), "calc(100% - var(--safe-top) - var(--safe-bottom) - 112px)",
    "The report can use the available viewport instead of an arbitrary short height cap");
  const body = declarations(styles, ".logs-panel__body");
  assert.equal(body.get("min-height"), "0");
  assert.equal(body.get("overflow-y"), "auto");
  assert.equal(declarations(styles, ".logs-panel .report").get("max-height"), "none");
  const ui = harness();
  const renderedBody = elements(ui.createLogsPanel([record()]), "logs-panel__body")[0];
  assert.equal(renderedBody.tabIndex, 0, "Keyboard users can focus the scrollable report");
  assert.equal(renderedBody.attributes.get("aria-label"), getUiCopy("ru").logs);
  const values = declarations(theme,
    ":where(.stage--draft, .stage--battle, .stage--finished) :is(.round-result-summary, .report--log) .round-result-damage__value");
  assert.equal(values.get("font-size"), "14px");
  assert.equal(values.get("grid-row"), "1 / 3");
  assert.equal(values.get("font-variant-numeric"), "tabular-nums");
});
