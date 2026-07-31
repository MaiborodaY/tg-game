import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { translations } from "../src/i18n.ts";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const gameplayIntel = readFileSync(new URL("../src/game/gameplayIntel.ts", import.meta.url), "utf8");

test("the mission intro uses the available mobile width without dropping safe areas", () => {
  assert.match(html, /<header class="intro-mission">[\s\S]*id="intro-title"[\s\S]*id="intro-body"/);
  assert.match(html, /id="intro-attempts" class="intro-attempts"[\s\S]*?<span role="status">/);
  assert.match(css, /#intro-overlay \{[\s\S]*max\(6px, env\(safe-area-inset-right\)[\s\S]*max\(6px, env\(safe-area-inset-left\)/);
  assert.match(css, /\.intro-card \{[^}]*width:\s*min\(100%, 448px\);[^}]*padding:\s*16px 14px 14px;/s);
  assert.match(css, /\.intro-mission \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.hero-choice-button \{[^}]*min-height:\s*70px;/s);
});

test("intro attempt status stays truthful across rewarded, practice, error, and exhausted launches", () => {
  for (const locale of Object.keys(translations)) {
    assert.match(translations[locale].intro_attempts_rewarded, /5/);
    assert.ok(translations[locale].intro_attempts_practice.length >= 10);
    assert.match(translations[locale].intro_attempts_exhausted, /0.*5/);
    assert.ok(translations[locale].intro_attempts_unavailable.length >= 10);
  }
  assert.match(main, /const exhausted = launchError === "daily_attempt_limit"/);
  assert.match(main, /const practice = !launchError && reward\.mode !== "server"/);
  assert.doesNotMatch(main, /reward\.runNumber\s*[%+-]/);
});

test("exhausted attempts expose an accessible inline crystal purchase without crowding 320px screens", () => {
  assert.match(html, /id="attempt-purchase"[\s\S]*id="attempt-purchase-balance"/);
  assert.match(html, /id="attempt-purchase-confirmation"[\s\S]*id="attempt-purchase-status"[\s\S]*aria-live="polite"/);
  assert.match(html, /id="attempt-purchase-cancel"[\s\S]*id="attempt-purchase-confirm"/);
  assert.match(css, /\.attempt-purchase-actions \{[^}]*grid-template-columns:/s);
  assert.match(css, /@media \(max-width: 340px\) \{[\s\S]*\.attempt-purchase-actions \{ grid-template-columns: 1fr; \}/);
  assert.match(main, /attemptPurchaseOffer && !canResetDailyAttempts[\s\S]*daily_attempt_purchase_body/);
  assert.match(main, /attemptPurchaseState === "loading"[\s\S]*attemptPurchaseConfirm\.disabled/);
  assert.match(main, /daily_attempt_purchase_insufficient[\s\S]*attemptPurchaseStatus\.className/);
});

test("every build card exposes a short visible role and keeps the full role for accessibility", () => {
  for (const tower of ["ranger", "frost", "ember", "storm"]) {
    assert.match(html, new RegExp(`data-tower="${tower}"[\\s\\S]*?id="${tower}-role"`));
    for (const locale of Object.keys(translations)) {
      assert.ok(translations[locale][`tower_card_role_${tower}`].length >= 7);
      assert.ok(translations[locale][`tower_role_${tower}`].length >= 18);
    }
  }
  assert.match(main, /compactRole\.textContent = text\(`tower_card_role_\$\{type\}`/);
  assert.match(main, /card\.setAttribute\("aria-label", `\$\{towerName\(type\)\}\. \$\{role\}/);
});

test("wave preview derives traits and tower recommendations from the existing plan", () => {
  assert.match(html, /id="wave-preview-summary" class="wave-preview-summary"/);
  assert.match(main, /const plan = ui\.nextWavePlan/);
  assert.match(main, /const recommended = recommendWaveTowers\(plan\)/);
  assert.match(gameplayIntel, /spawn\.type === "boss" \|\| spawn\.type === "titan"[\s\S]*add\("ranger", 8/);
  assert.match(gameplayIntel, /spawn\.speed >= 70[\s\S]*spawn\.controlResistance < 0\.55\) add\("frost", 4/);
  assert.match(gameplayIntel, /spawn\.physicalResistance >= 0\.18[\s\S]*add\("ember", 2/);
  assert.match(gameplayIntel, /spawn\.controlResistance >= 0\.6[\s\S]*add\("frost", -1/);
  assert.match(main, /wave_preview_summary/);
});

test("combat keeps the command geometry stable and tower upgrades preview their next stats", () => {
  assert.match(main, /buildPanel\.hidden = Boolean\(selected\) \|\| heroSelected/);
  assert.doesNotMatch(main, /combatCompact|is-combat-compact/);
  assert.doesNotMatch(css, /is-combat-compact/);
  assert.match(css, /\.command-panel \{[^}]*grid-template-rows:\s*var\(--tower-controls-height\) 44px;/s);
  assert.match(main, /getTowerStats\(selected\.tower\.type, \(selected\.tower\.level \+ 1\) as TowerLevel\)/);
  assert.match(main, /selected\.stats\.damage\}→\$\{nextStats\.damage/);
});

test("primary intro and leaderboard visuals do not rely on platform emoji rendering", () => {
  assert.doesNotMatch(html, /🏆/u);
  assert.equal(html.match(/class="ui-icon ui-icon--trophy"/g)?.length, 2);
  assert.match(css, /\.ui-icon--trophy::before/);
  assert.match(css, /\.feature-icon--towers::before/);
});
