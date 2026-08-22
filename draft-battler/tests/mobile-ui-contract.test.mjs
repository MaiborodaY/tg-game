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
  assert.match(styles, /\.placement-context-dock\s*\{[^}]*bottom:\s*max\(8px,[^}]*var\(--safe-bottom\)[^}]*var\(--safe-right\)[^}]*var\(--safe-left\)/s);
  assert.match(styles, /\.draft-hud__utility-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.logs-button\s*\{[^}]*position:\s*static[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.logs-panel\s*\{[^}]*top:[^}]*var\(--safe-top\)/s);

  for (const selector of [
    "reroll-button",
    "card-info-panel__close",
    "logs-button",
    "logs-panel__close",
    "logs-round-button",
  ]) {
    assert.match(styles, new RegExp(`\\.${selector}\\s*\\{[^}]*?(?:min-)?height:\\s*44px`, "s"));
  }
});

test("PvP lobby remains usable on narrow safe-area viewports", () => {
  assert.match(
    styles,
    /\.pvp-panel\s*\{[^}]*var\(--safe-right\)[^}]*var\(--safe-left\)[^}]*max-height:[^}]*var\(--safe-top\)[^}]*var\(--safe-bottom\)[^}]*overflow-y:\s*auto/s,
  );
  assert.match(styles, /\.pvp-panel__close\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(styles, /\.pvp-room-input\s*\{[^}]*height:\s*44px/s);
  assert.match(styles, /\.pvp-panel__button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.pvp-copy-button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.pvp-panel__actions\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(
    styles,
    /@media\s*\(max-width:\s*360px\)[\s\S]*?\.pvp-room-controls \.pvp-room-input\s*\{[^}]*flex-basis:\s*100%/s,
  );
});

test("retention controls and history modal remain accessible on 320 by 568 screens", () => {
  assert.match(styles, /\.daily-challenge-card\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(
    styles,
    /\.daily-challenge-card__button,\s*\.main-menu__history-button\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(
    styles,
    /\.run-history-overlay\s*\{[^}]*var\(--safe-top\)[^}]*var\(--safe-right\)[^}]*var\(--safe-bottom\)[^}]*var\(--safe-left\)/s,
  );
  assert.match(
    styles,
    /\.run-history-panel\s*\{[^}]*height:\s*100%[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s,
  );
  assert.match(styles, /\.run-history-panel__content\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.run-history-panel__close\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(styles, /\.run-history-entry__replay\s*\{[^}]*min-height:\s*44px/s);
  assert.match(
    styles,
    /\.terminal-result__actions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
  );
  assert.match(styles, /\.terminal-result__actions > button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(
    styles,
    /@media\s*\(max-width:\s*360px\)\s*and\s*\(max-height:\s*600px\)[\s\S]*?\.run-history-overlay\s*\{/s,
  );
  assert.match(
    styles,
    /\.run-history-panel__close:focus-visible,[\s\S]*?\.run-history-entry__replay:focus-visible,[\s\S]*?outline:\s*3px/s,
  );
});

test("compact layouts and reduced motion remain part of the stylesheet contract", () => {
  assert.match(styles, /@media\s*\(max-width:\s*360px\)/);
  assert.match(styles, /@media\s*\(max-height:\s*720px\)/);
  assert.match(styles, /\.draft-panel\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.draft-grid \.unit-card\s*\{[^}]*touch-action:\s*pan-y/s);
  assert.match(styles, /\.unit-card__drag-handle\s*\{[^}]*height:\s*44px[^}]*touch-action:\s*none/s);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /\.terminal-result__metrics\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(styles, /\.synergy-strip\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(styles, /\.synergy-chip__tiers\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(styles, /\.unit-card__synergy-forecast--dock\s*\{[^}]*max-height:\s*56px[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.unit-card__synergy-forecast--dock \.unit-card__synergy-forecast-line\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
});

test("critical card copy remains readable", () => {
  for (const selector of [
    "unit-card__rarity",
    "unit-card__stat-label",
    "unit-card__ability",
    "unit-card__tag-row span",
    "unit-card__synergy-forecast",
  ]) {
    assert.match(styles, new RegExp(`\\.${selector.replace(" ", "\\s+")}\\s*\\{[^}]*font-size:\\s*9px`, "s"));
  }
});

test("draft choices keep all three vertical cards visible with readable copy", () => {
  assert.match(
    styles,
    /\.draft-grid--triple\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[^}]*overflow:\s*visible/s,
  );
  assert.match(
    styles,
    /\.draft-grid--triple \.unit-card\s*\{[^}]*height:\s*var\(--draft-triple-card-height\)[^}]*aspect-ratio:\s*auto[^}]*touch-action:\s*pan-y/s,
  );
  assert.match(
    styles,
    /\.draft-grid--triple \.unit-card__name\s*\{[^}]*font-size:\s*clamp\([^}]*text-transform:\s*none[^}]*-webkit-line-clamp:\s*3/s,
  );
  assert.match(styles, /\.draft-grid--triple \.unit-card__footer\s*\{[^}]*height:\s*74px[^}]*grid-template-rows:\s*24px 48px/s);
  assert.match(styles, /\.draft-grid--triple \.unit-card__ability\s*\{[^}]*font-size:\s*clamp\(/s);
  assert.match(styles, /\.draft-grid--triple \.unit-card__ability-text\s*\{[^}]*-webkit-line-clamp:\s*4/s);
  assert.match(
    styles,
    /\.draft-grid--triple \.unit-card__drag-handle\s*\{[^}]*width:\s*44px[^}]*height:\s*44px[^}]*touch-action:\s*none/s,
  );
  assert.match(styles, /\.panel-header--draft\s*\{[^}]*min-height:\s*34px[^}]*border-bottom:[^}]*box-shadow:\s*none/s);
  assert.match(
    styles,
    /\.panel-header--draft \.reroll-button\s*\{[^}]*width:\s*auto[^}]*min-width:\s*88px[^}]*height:\s*32px[^}]*white-space:\s*nowrap/s,
  );
  assert.match(styles, /\.draft-choices-toggle\s*\{[^}]*width:\s*44px[^}]*height:\s*32px/s);
  assert.match(styles, /\.draft-choices-toggle::after\s*\{[^}]*inset:\s*-6px 0/s);
  assert.match(styles, /\.reroll-button\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(
    styles,
    /\.draft-grid--triple\s*\{[^}]*--draft-triple-card-height:\s*clamp\(370px, 92cqw, 400px\)/s,
  );
  assert.match(
    styles,
    /@media\s*\(max-height:\s*720px\)[\s\S]*?\.draft-grid--triple\s*\{[^}]*--draft-triple-card-height:\s*clamp\(300px, calc\(100dvh - var\(--draft-short-top\) - var\(--draft-short-bottom\) - 42px\), 330px\)/s,
  );
  assert.match(
    styles,
    /@media\s*\(max-width:\s*360px\)[\s\S]*?\.panel-header--draft \.panel-caption\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    styles,
    /@media\s*\(max-height:\s*600px\)[\s\S]*?\.draft-onboarding\s*\{[^}]*display:\s*none/s,
  );
  assert.match(styles, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.draft-grid--triple \.unit-card__ability-icon\s*\{[^}]*display:\s*none/s);
});

test("placement and move modes use one bottom context dock with compact target markers", () => {
  assert.match(styles, /\.placement-context-dock__copy span\s*\{[^}]*font-size:\s*9px/s);
  assert.match(styles, /\.placement-context-dock__info,\s*\.placement-context-dock__cancel\s*\{[^}]*height:\s*44px/s);
  assert.match(styles, /\.placement-context-dock__info\s*\{[^}]*width:\s*44px/s);
  assert.match(styles, /\.placement-context-dock__cancel\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.placement-context-dock--move \.placement-context-dock__cancel\s*\{[^}]*grid-column:\s*1 \/ -1/s);
  assert.doesNotMatch(styles, /--draft-top-stack|tap-placement-panel|keyboard-move-panel/);
  assert.match(styles, /\.field-slot--move-target::before\s*\{[^}]*border-color:[^}]*background:/s);
  assert.match(styles, /\.field-slot--move-swap::before\s*\{[^}]*border-color:[^}]*background:/s);
  assert.match(styles, /\.field-slot__target-label--move\s*\{[^}]*width:\s*24px[^}]*font-size:\s*0/s);
  assert.match(styles, /\.field-slot__target-label--move::before\s*\{[^}]*content:\s*"\\2192"/s);
  assert.match(styles, /\.field-slot__target-label--move-swap::before\s*\{[^}]*content:\s*"\\2194"/s);
});

test("short draft layouts reserve the HUD utility row when logs are available", () => {
  assert.match(
    styles,
    /@media\s*\(max-height:\s*720px\)[\s\S]*?\.draft-overlay\s*\{[^}]*--draft-short-top:\s*max\(96px, calc\(var\(--safe-top\) \+ 90px\)\)/s,
  );
  assert.match(styles, /\.draft-overlay--has-logs\s*\{[^}]*padding-top:/s);
  assert.match(
    styles,
    /@media\s*\(max-height:\s*720px\)[\s\S]*?\.draft-overlay--has-logs\s*\{[^}]*--draft-short-top:/s,
  );
});
