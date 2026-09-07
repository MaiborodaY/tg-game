import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { formatMessage, getUiCopy, SUPPORTED_LOCALES } from "../src/i18n.ts";

// Exercise the production renderer so removing a notice cannot silently remove the ranking itself.
const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("main.ts", source, ts.ScriptTarget.ES2022, true);
const names = new Set([
  "createPvpLeaderboardContent", "createPvpLeaderboardEntry", "createPvpLeaderboardMessage",
  "formatPvpLeaderboardDate",
]);
const functions = parsed.statements
  .filter((node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text))
  .map((node) => node.getText(parsed));
assert.equal(functions.length, names.size);
const compiled = ts.transpileModule(functions.join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.className = "";
    this.attributes = new Map();
    this.text = "";
  }
  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map((child) => child.textContent).join(""); }
}

function elements(root, className) {
  return [root, ...root.children.flatMap((child) => elements(child))]
    .filter((element) => !className || element.className.split(" ").includes(className));
}

function render(snapshot, mode = "strong_bot", locale = "ru") {
  const context = {
    activeLocale: locale, leaderboardMode: mode, getCopy: () => getUiCopy(locale), formatMessage,
    document: {
      createElement: (tag) => new Element(tag),
      createDocumentFragment: () => new Element("#fragment"),
    },
  };
  vm.runInNewContext(compiled, context, { filename: "leaderboard-participation.headless.cjs" });
  return context.createPvpLeaderboardContent(snapshot);
}

function snapshot(participation = "ranked") {
  return {
    participation, totalPlayers: 12, weekEndsAt: Date.UTC(2026, 8, 14),
    entries: [{ rank: 1, displayName: "Leader", wins: 9, losses: 1, draws: 0, games: 10 }],
    viewer: { rank: 12, displayName: "Viewer", wins: 4, losses: 1, draws: 0, games: 5 },
  };
}

test("ranked strong-bot leaderboard omits the redundant banner while retaining metadata and personal results", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const data = snapshot();
    const before = globalThis.structuredClone(data);
    const root = render(data, "strong_bot", locale);
    assert.equal(elements(root, "pvp-leaderboard-participation").length, 0);
    assert.deepEqual(root.children.map((child) => child.className), ["pvp-leaderboard-meta", "pvp-leaderboard-list"]);
    const meta = elements(root, "pvp-leaderboard-meta")[0];
    assert.equal(meta.children[0].textContent, formatMessage(getUiCopy(locale).pvpLeaderboardPlayers, { count: 12 }));
    const endDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(data.weekEndsAt - 1);
    assert.equal(meta.children[1].textContent, formatMessage(getUiCopy(locale).pvpLeaderboardWeekEnds, { date: endDate }));
    assert.equal(elements(root, "pvp-leaderboard-entry").length, 2);
    assert.equal(elements(root, "pvp-leaderboard-list__divider").length, 1);
    const viewer = elements(root, "pvp-leaderboard-entry--viewer")[0];
    assert.ok(viewer.textContent.includes("Viewer"));
    assert.ok(viewer.textContent.includes(getUiCopy(locale).pvpLeaderboardYou));
    assert.equal(elements(viewer, "pvp-leaderboard-entry__wins")[0].textContent, "🏆 4");
    assert.deepEqual(data, before);
  }
});

test("both leaderboard modes retain Telegram and missing-profile notices in every locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const mode of ["pvp", "strong_bot"]) {
      for (const [state, key] of [
        ["telegram_required", "pvpLeaderboardTelegramRequired"],
        ["missing_profile", "pvpLeaderboardMissingProfile"],
      ]) {
        const root = render(snapshot(state), mode, locale);
        const notices = elements(root, "pvp-leaderboard-participation");
        assert.equal(notices.length, 1);
        assert.equal(notices[0].textContent, getUiCopy(locale)[key]);
        assert.ok(notices[0].className.includes(`pvp-leaderboard-participation--${state}`));
        assert.equal(elements(root, "pvp-leaderboard-entry").length, 2);
      }
    }
  }
});

test("ranked PvP keeps its existing participation notice without duplicating the viewer", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const data = snapshot();
    data.viewer = data.entries[0];
    const root = render(data, "pvp", locale);
    const notices = elements(root, "pvp-leaderboard-participation");
    assert.equal(notices.length, 1);
    assert.equal(notices[0].textContent, getUiCopy(locale).pvpLeaderboardRanked);
    assert.equal(elements(root, "pvp-leaderboard-entry--viewer").length, 1);
    assert.equal(elements(root, "pvp-leaderboard-list__divider").length, 0);
  }
});

test("empty leaderboards still show the localized empty state with only applicable notices", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const mode of ["pvp", "strong_bot"]) {
      for (const participation of ["ranked", "telegram_required", "missing_profile"]) {
        const root = render({ ...snapshot(participation), entries: [], viewer: null, totalPlayers: 0 }, mode, locale);
        assert.equal(elements(root, "run-history-panel__empty")[0].textContent, getUiCopy(locale).pvpLeaderboardEmpty);
        assert.equal(elements(root, "pvp-leaderboard-meta").length, 1);
        assert.equal(elements(root, "pvp-leaderboard-list").length, 0);
        assert.equal(elements(root, "pvp-leaderboard-participation").length,
          mode === "strong_bot" && participation === "ranked" ? 0 : 1);
      }
    }
  }
});
