import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { tr } from "../src/i18n.ts";
import { parseLeaderboardResponse } from "../src/leaderboard.ts";

const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");
const css = readFileSync(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");
const leaderboardFunctions = mainSource.slice(
  mainSource.indexOf("function openLeaderboard"),
  mainSource.indexOf("function setGameSpeed"),
);

test("leaderboard is reachable from intro, active-run and terminal-result UI", () => {
  const introButton = openingTagById(html, "intro-leaderboard");
  const menuButton = openingTagById(html, "game-menu-leaderboard");
  const resultButton = openingTagById(html, "result-leaderboard");

  assert.match(introButton, /aria-controls="leaderboard-overlay"/);
  assert.match(introButton, /aria-expanded="false"/);
  assert.match(menuButton, /aria-controls="leaderboard-overlay"/);
  assert.match(menuButton, /aria-expanded="false"/);
  assert.match(resultButton, /aria-controls="leaderboard-overlay"/);
  assert.match(resultButton, /aria-expanded="false"/);
  assert.match(mainSource, /introLeaderboard\.addEventListener\("click", \(\) => openLeaderboard\("intro"\)\)/);
  assert.match(mainSource, /gameMenuLeaderboard\.addEventListener\("click", \(\) => openLeaderboard\("menu"\)\)/);
  assert.match(mainSource, /resultLeaderboard\.addEventListener\("click", \(\) => openLeaderboard\("result"\)\)/);
  assert.match(leaderboardFunctions, /origin === "intro"[\s\S]*introOverlay\.hidden = true/);
  assert.match(leaderboardFunctions, /origin === "menu"[\s\S]*gameMenuOverlay\.hidden = true/);
  assert.match(leaderboardFunctions, /origin === "result"[\s\S]*resultOverlay\.hidden = true/);
  assert.match(leaderboardFunctions, /if \(origin === "intro"\)[\s\S]*introOverlay\.hidden = false/);
  assert.match(leaderboardFunctions, /if \(origin === "menu"\)[\s\S]*gameMenuOverlay\.hidden = false/);
  assert.match(leaderboardFunctions, /else if \(origin === "result"\)[\s\S]*resultOverlay\.hidden = false/);
  assert.match(leaderboardFunctions, /returnFocus\?\.isConnected[\s\S]*returnFocus\.focus\(\)/);
  assert.doesNotMatch(leaderboardFunctions, /setPaused\(false\)/);
  assert.match(mainSource, /else if \(!elements\.leaderboardOverlay\.hidden\) closeLeaderboard\(\)/);
});

test("leaderboard dialog, tabs and live states expose accessible semantics", () => {
  const overlay = elementMarkupById(html, "leaderboard-overlay");
  const panel = openingTagById(html, "leaderboard-panel");

  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /aria-modal="true"/);
  assert.match(overlay, /aria-labelledby="leaderboard-title"/);
  assert.match(overlay, /id="leaderboard-tabs"[^>]*role="tablist"/);
  assert.equal(overlay.match(/role="tab"/g)?.length, 2);
  assert.match(overlay, /role="tabpanel"/);
  assert.match(panel, /aria-labelledby="leaderboard-tab-forest-gate"/);
  assert.match(panel, /tabindex="0"/);
  assert.match(panel, /aria-busy="false"/);
  assert.match(overlay, /id="leaderboard-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(overlay, /<ol id="leaderboard-list"/);
  assert.match(overlay, /id="leaderboard-self"[^>]*aria-label=/);

  assert.match(mainSource, /leaderboardTabs\.addEventListener\("keydown"/);
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
    assert.match(mainSource, new RegExp(`"${key}"`));
  }
  assert.match(mainSource, /event\.preventDefault\(\)/);
  assert.match(mainSource, /selectLeaderboardLevel\(next\.dataset\.leaderboardLevel\);[\s\S]*next\.focus\(\)/);
  assert.match(mainSource, /control\.setAttribute\("aria-selected", String\(selected\)\)/);
  assert.match(mainSource, /control\.tabIndex = selected \? 0 : -1/);
  assert.match(mainSource, /leaderboardPanel\.setAttribute\("aria-labelledby", control\.id\)/);
});

test("leaderboard bottom sheet remains scrollable, focus-visible and touch-safe on mobile", () => {
  const overlayTag = openingTagById(html, "leaderboard-overlay");
  const layer = css.match(/\.leaderboard-layer \{([^}]*)\}/s)?.[1] ?? "";
  const card = css.match(/\.leaderboard-card \{([^}]*)\}/s)?.[1] ?? "";
  const tabs = css.match(/\.leaderboard-tabs button \{([^}]*)\}/s)?.[1] ?? "";
  const narrowViewport = css.match(/@media \(max-width: 360px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.match(overlayTag, /class="[^"]*\bmodal-layer\b[^"]*\bleaderboard-layer\b/);
  assert.match(layer, /align-items:\s*end/);
  assert.match(card, /max-height:/);
  assert.match(card, /overflow-y:\s*auto/);
  assert.match(card, /overscroll-behavior:\s*contain/);
  assert.match(tabs, /min-height:\s*44px/);
  assert.match(css, /\.guide-close \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /\.leaderboard-panel > \.secondary-action \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /#result-leaderboard \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.secondary-action\.intro-leaderboard \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.leaderboard-panel:focus-visible \{[^}]*outline:\s*2px solid[^}]*outline-offset:\s*3px;/s);
  assert.match(narrowViewport, /\.leaderboard-card \{[^}]*padding-left:\s*13px;[^}]*padding-right:\s*13px;/s);
  assert.match(narrowViewport, /\.leaderboard-entry \{[^}]*grid-template-columns:\s*27px minmax\(0, 1fr\) auto;/s);
  assert.match(css, /\.leaderboard-copy strong \{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s);
});

test("leaderboard copy is complete in every locale and resolves placeholders", () => {
  const keys = [
    "game_menu_leaderboard",
    "leaderboard_eyebrow",
    "leaderboard_title",
    "leaderboard_level_label",
    "leaderboard_summary",
    "leaderboard_loading",
    "leaderboard_empty",
    "leaderboard_unavailable",
    "leaderboard_auth_expired",
    "leaderboard_error",
    "leaderboard_retry",
    "leaderboard_results_label",
    "leaderboard_self",
    "leaderboard_you",
    "leaderboard_waves",
    "leaderboard_time_unknown",
    "leaderboard_player_unknown",
    "leaderboard_players",
  ];

  for (const locale of ["ru", "uk", "en"]) {
    for (const key of keys) {
      const value = tr(locale, key, { count: 24 });
      assert.ok(value.trim().length >= 2, `${locale}.${key} must not be empty`);
      assert.doesNotMatch(value, /\{[a-zA-Z0-9_]+\}/, `${locale}.${key} has an unresolved placeholder`);
    }
  }

  assert.match(tr("ru", "leaderboard_summary", { count: 24 }), /24/);
  assert.match(tr("uk", "leaderboard_players", { count: 12 }), /12/);
  assert.match(tr("en", "leaderboard_time_unknown"), /time/i);
});

test("nullable player names stay valid and render through localized safe text", () => {
  const response = {
    ok: true,
    game_id: "td",
    level_id: "forest-gate",
    mode_id: "campaign",
    max_waves: 24,
    total_players: 1,
    entries: [{
      rank: 1,
      name: null,
      outcome: "victory",
      completed_waves: 24,
      duration_ms: null,
      is_me: true,
    }],
    me: {
      rank: 1,
      name: null,
      outcome: "victory",
      completed_waves: 24,
      duration_ms: null,
      is_me: true,
    },
  };

  const parsed = parseLeaderboardResponse(response, "forest-gate");
  assert.equal(parsed?.entries[0].name, null);
  assert.equal(parsed?.me?.name, null);
  assert.match(leaderboardFunctions, /entry\.name \?\? text\("leaderboard_player_unknown"\)/);
  assert.match(leaderboardFunctions, /durationMs === null[\s\S]*leaderboard_time_unknown/);
  assert.doesNotMatch(leaderboardFunctions, /\.innerHTML\s*=/);
  assert.match(leaderboardFunctions, /name\.textContent =/);
});

test("successful reward settlement invalidates the current level without accepting stale responses", () => {
  assert.match(mainSource, /if \(result\.ok\) \{[\s\S]*leaderboardClient\?\.invalidate\(selectedSession\.level\.id\)/);
  assert.match(mainSource, /const requestId = \+\+leaderboardRequestId/);
  assert.match(mainSource, /requestId === leaderboardRequestId[\s\S]*levelId === leaderboardLevelId[\s\S]*!elements\.leaderboardOverlay\.hidden/);
});

test("expired Telegram auth does not offer a useless network retry", () => {
  assert.match(leaderboardFunctions, /error\.message === "http_401"/);
  assert.match(leaderboardFunctions, /authExpired \? "leaderboard_auth_expired" : "leaderboard_error"/);
  assert.match(leaderboardFunctions, /!authExpired/);
});

function openingTagById(source, id) {
  const index = source.indexOf(`id="${id}"`);
  if (index < 0) return "";
  const start = source.lastIndexOf("<", index);
  const end = source.indexOf(">", index);
  return start >= 0 && end >= 0 ? source.slice(start, end + 1) : "";
}

function elementMarkupById(source, id) {
  const idIndex = source.indexOf(`id="${id}"`);
  if (idIndex < 0) return "";
  const start = source.lastIndexOf("<", idIndex);
  const openingTag = source.slice(start).match(/^<([a-z][a-z0-9-]*)\b[^>]*>/i);
  if (!openingTag) return "";
  const tokens = new RegExp(`<\\/?${openingTag[1]}\\b[^>]*>`, "gi");
  tokens.lastIndex = start;
  let depth = 0;
  for (let token = tokens.exec(source); token; token = tokens.exec(source)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return source.slice(start, tokens.lastIndex);
  }
  return "";
}
