import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { translations } from "../src/i18n.ts";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const gameplayIntel = readFileSync(new URL("../src/game/gameplayIntel.ts", import.meta.url), "utf8");

test("the mission intro uses the available mobile width without dropping safe areas", () => {
  assert.match(html, /<header id="mission-preview" class="intro-mission"[\s\S]*id="intro-title"[\s\S]*id="intro-body"/);
  assert.match(html, /id="intro-attempts" class="intro-attempts"[\s\S]*?<span role="status">/);
  assert.match(css, /#intro-overlay \{[\s\S]*max\(6px, env\(safe-area-inset-right\)[\s\S]*max\(6px, env\(safe-area-inset-left\)/);
  assert.match(css, /\.intro-card \{[^}]*width:\s*min\(100%, 448px\);[^}]*padding:\s*16px 14px 14px;/s);
  assert.match(css, /\.intro-mission \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.hero-choice-button \{[^}]*min-height:\s*70px;/s);
});

test("the selected level is presented as a themed mission card instead of a bare dropdown", () => {
  assert.match(html, /id="mission-preview"[^>]*data-mission-preview[^>]*data-level-theme="forest-gate"/);
  assert.match(html, /id="intro-sigil"[^>]*data-mission-sigil/);
  assert.match(html, /id="intro-mission-eyebrow"[^>]*data-mission-eyebrow/);
  assert.match(html, /id="mission-difficulty"[^>]*data-mission-difficulty/);
  assert.match(html, /id="mission-gold"[^>]*data-mission-gold/);
  assert.match(html, /id="mission-lives"[^>]*data-mission-lives/);
  assert.match(html, /id="mission-trait"[^>]*data-mission-trait/);
  assert.match(html, /id="intro-start"[^>]*data-mission-cta/);
  assert.match(css, /\.intro-mission\[data-level-theme="forest-gate"\]/);
  assert.match(css, /\.intro-mission\[data-level-theme="northern-pass"\]/);
  assert.match(css, /\.mission-metrics \{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /@media \(max-width: 360px\) \{[\s\S]*\.mission-trait/);
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

test("Northern Pass teaches signal fires first and frost armour when it becomes relevant", () => {
  assert.match(main, /type NorthernOnboardingStep = "beacon" \| "armor"/);
  assert.match(main, /completedWave >= 2[\s\S]*NORTHERN_ARMOR_ONBOARDING_STORAGE_KEY/);
  assert.match(main, /northern_onboarding_armor_title/);
  assert.match(main, /northern_onboarding_armor_body/);
  assert.match(main, /wave_trait_frost/);
  assert.match(gameplayIntel, /spawn\.frostArmorRatio[\s\S]*add\("ember", 7/);
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
