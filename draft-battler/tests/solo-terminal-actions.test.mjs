import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { formatMessage, getUiCopy } from "../src/i18n.ts";

const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const sourceFile = ts.createSourceFile("main.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
const terminalFunction = sourceFile.statements.find((statement) =>
  ts.isFunctionDeclaration(statement) && statement.name?.text === "createSoloTerminalResult");
assert.ok(terminalFunction);
// Execute the real renderer without booting Phaser or the app's persistence adapters.
const compiled = ts.transpileModule(`${terminalFunction.getText(sourceFile)}\nthis.render = createSoloTerminalResult;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

test("standard and daily terminal screens have one clear new-game action in every locale", () => {
  const names = { ru: "Новая игра", uk: "Нова гра", en: "New game" };
  for (const source of ["standard", "daily"]) {
    for (const [locale, label] of Object.entries(names)) {
      const fixture = createFixture({ source, locale });
      const actions = fixture.panel.children.find((node) => node.className === "terminal-result__actions");
      assert.deepEqual(actions.children.map((button) => button.textContent), [
        label, fixture.copy.shareResult, fixture.copy.menu,
      ], `${source}/${locale}: no same-layout action remains`);
      assert.match(actions.children[0].className, /\bprimary-button\b/);
      assert.match(actions.children[0].className, /\bterminal-result__new-game\b/);
      assert.equal(actions.children[0].focusKey, "restart-run");
    }
  }
});

test("new game preserves difficulty and uses the fresh-run ranking entry point, never replay", () => {
  for (const source of ["standard", "daily"]) {
    for (const difficulty of ["standard", "strong"]) {
      const fixture = createFixture({ source, difficulty });
      fixture.actions.children[0].click();
      assert.deepEqual(fixture.started, [difficulty]);
      if (difficulty === "strong") {
        assert.ok(fixture.panel.children.some((node) => node.leaderboard === "strong_bot"));
      }
    }
  }
});

test("new game stays disabled while ranking startup is pending; share and menu still work", () => {
  const fixture = createFixture({ starting: true });
  assert.equal(fixture.actions.children[0].disabled, true);
  fixture.actions.children[0].click();
  assert.deepEqual(fixture.started, []);
  fixture.actions.children[1].click();
  fixture.actions.children[2].click();
  assert.equal(fixture.shared.length, 1);
  assert.equal(fixture.shared[0].button, fixture.actions.children[1]);
  assert.equal(fixture.shared[0].status.attributes.get("aria-live"), "polite");
  assert.equal(fixture.menuVisits(), 1);
});

test("only the solo new-game button spans the terminal action grid", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.terminal-result__new-game\s*\{\s*grid-column:\s*1\s*\/\s*-1;/);
});

function createFixture({ source = "standard", locale = "ru", difficulty = "strong", starting = false } = {}) {
  const copy = getUiCopy(locale);
  const started = [];
  const shared = [];
  let menuVisits = 0;
  const context = {
    document: { createElement: (tag) => new ElementStub(tag) },
    getCopy: () => copy,
    formatMessage,
    getBotDifficultyLabel: () => difficulty,
    setFocusKey: (node, key) => { node.focusKey = key; },
    createTerminalMetric: () => new ElementStub("div"),
    MAX_RUN_ROUNDS: 15,
    PVP_UI_ENABLED: true,
    soloRankingStarting: starting,
    soloRankingDelivery: { status: () => "recorded" },
    isRankedSoloRun: () => source === "standard",
    createSoloRankingNotice: () => new ElementStub("p"),
    createPvpLeaderboardButton: (kind) => Object.assign(new ElementStub("button"), { leaderboard: kind }),
    startNewSoloRun: (botDifficulty) => started.push(botDifficulty),
    startSoloRun: () => assert.fail("The completion screen must not start a replay"),
    shareSoloRunResult: (button, status) => shared.push({ button, status }),
    returnToMainMenu: () => { menuVisits += 1; },
    uiState: {
      run: { outcome: "player", roundHistory: [{}], playerHp: 20, enemyHp: 0, botDifficulty: difficulty },
      soloSession: { source, completedAt: "2026-09-07T12:00:00Z", runId: "completed-run" },
    },
  };
  vm.runInNewContext(compiled, context);
  const panel = context.render();
  const actions = panel.children.find((node) => node.className === "terminal-result__actions");
  return { panel, actions, copy, started, shared, menuVisits: () => menuVisits };
}

class ElementStub {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
  }

  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  click() { if (!this.disabled) this.listeners.get("click")?.(); }
}
