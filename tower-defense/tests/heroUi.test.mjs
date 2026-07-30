import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");
const css = readFileSync(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");

function elementMarkupById(source, id) {
  const idIndex = source.indexOf(`id="${id}"`);
  if (idIndex < 0) return "";
  const start = source.lastIndexOf("<", idIndex);
  const openingTag = source.slice(start).match(/^<([a-z][a-z0-9-]*)\b[^>]*>/i);
  if (!openingTag) return "";
  const tagName = openingTag[1];
  const tokens = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokens.lastIndex = start;
  let depth = 0;
  for (let token = tokens.exec(source); token; token = tokens.exec(source)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return source.slice(start, tokens.lastIndex);
  }
  return "";
}

test("intro offers three accessible hero portraits without adding a tower card", () => {
  assert.equal(html.match(/data-hero-choice=/g)?.length, 3);
  assert.match(html, /data-hero-choice="eira"/);
  assert.match(html, /data-hero-choice="toren"/);
  assert.match(html, /data-hero-choice="grak"/);
  assert.match(html, /eira-portrait\.webp/);
  assert.match(html, /toren-portrait\.webp/);
  assert.match(html, /grak-portrait\.webp/);
  assert.equal(html.match(/data-tower=/g)?.length, 4);
  assert.match(html, /id="hero-choice-button"[^>]*aria-controls="hero-picker"[^>]*aria-expanded="false"/);
  assert.match(html, /class="hero-options" role="radiogroup"/);
  assert.equal(html.match(/role="radio"/g)?.length, 3);
  const grakOption = html.match(/<button[^>]*data-hero-choice="grak"[^>]*>/)?.[0] ?? "";
  assert.match(grakOption, /aria-disabled="true"/);
  assert.match(grakOption, /aria-describedby="hero-grak-unlock"/);
});

test("hero choice only replaces a fresh campaign before the renderer mounts", () => {
  assert.match(mainSource, /function chooseHero\(value: string\): void \{[\s\S]*isHeroId\(value\)[\s\S]*heroChoiceIsLocked\(\)[\s\S]*createCampaignState\(\{[\s\S]*heroId: selectedHeroId/);
  assert.match(mainSource, /function heroChoiceIsLocked\(\): boolean \{\s*return gameMounted \|\| runStarted \|\| hasRunProgress\(latestUi\?\.campaign \?\? initialCampaign\);/);
  assert.match(mainSource, /selectedHeroId = initialCampaign\.hero\.id/);
  assert.match(mainSource, /let runStarted = Boolean\(restoredCheckpoint\)/);
  assert.match(mainSource, /saveCampaign\(storage, saveKey, startedCampaign\)/);
  assert.match(mainSource, /elements\.heroChoiceButton\.disabled = disabled/);
  assert.match(mainSource, /elements\.heroChoiceLock\.hidden = !locked/);
  assert.match(mainSource, /isHeroAvailable\(value, playerProfile\)/);
  assert.match(mainSource, /const unavailable = !isHeroAvailable\(optionHeroId, playerProfile\)/);
  assert.match(mainSource, /option\.disabled = disabled \|\| unavailable/);
  assert.match(mainSource, /!grakWasUnlocked && isHeroAvailable\("grak", playerProfile\)[\s\S]*hero_grak_unlocked/);
  assert.match(mainSource, /import\.meta\.env\.DEV[\s\S]*preview_hero/);
});

test("fresh sessions always reach hero choice before their renderer mounts", () => {
  const sessionSwitch = mainSource.match(/async function switchPracticeSession[\s\S]*?(?=\nfunction (?:openGameMenu|openSessionMenu))/)?.[0] ?? "";
  const pendingRestore = mainSource.match(/function restorePendingFinish[\s\S]*?(?=\nfunction showRestoredRunStatus)/)?.[0] ?? "";
  assert.doesNotMatch(sessionSwitch, /ensureGameMounted\(/);
  assert.doesNotMatch(pendingRestore, /td-intro-seen-v1/);
  assert.match(pendingRestore, /if \(runStarted \|\| hasRunProgress\(initialCampaign\)\) elements\.introOverlay\.hidden = true/);
  assert.match(mainSource, /campaign\.activeDurationMs > 0[\s\S]*campaign\.hero\.anchorId !== 0/);
});

test("selected map hero reuses the compact command controls and active ability button", () => {
  assert.match(html, /id="hero-panel" class="hero-panel" hidden/);
  assert.match(html, /id="hero-upgrade-button"/);
  assert.match(html, /id="selected-hero-hint" data-aura="locked"/);
  assert.match(mainSource, /const heroSelected = ui\.selectedHero && !selected/);
  assert.match(mainSource, /elements\.buildPanel\.hidden = Boolean\(selected\) \|\| heroSelected/);
  assert.match(mainSource, /elements\.appShell\.classList\.toggle\("is-combat-compact", combatCompact\)/);
  assert.match(mainSource, /elements\.heroPanel\.hidden = !heroSelected/);
  assert.match(mainSource, /currentScene\(\)\?\.upgradeHero\(\)/);
  assert.match(mainSource, /currentScene\(\)\?\.useHeroAbility\(\)/);
  assert.match(mainSource, /function syncHeroAuraStatus\(ui: TowerDefenseUiState\)/);
  assert.match(mainSource, /hero_eira_aura_status/);
  assert.match(mainSource, /hero_toren_aura_status/);
  assert.match(mainSource, /hero_grak_aura_status/);
  assert.match(mainSource, /aura\.globalStrength/);
  assert.match(mainSource, /dx \* dx \+ dy \* dy <= radiusSquared \? total \+ 1 : total/);
  assert.match(css, /p\[data-aura="tower_damage"\][\s\S]*#f1cc69/);
  assert.match(css, /p\[data-aura="slow"\][\s\S]*#75d8ef/);
  assert.doesNotMatch(mainSource, /pulseButton\.addEventListener\("click", \(\) => currentScene\(\)\?\.usePulse\(\)\)/);
});

test("awakening state exposes charges, recharge, gate shield, and Toren road targeting accessibly", () => {
  assert.match(html, /id="gate-shield" class="gate-shield" hidden/);
  assert.match(html, /id="pulse-charges" class="pulse-charges"[^>]*hidden><i><\/i><i><\/i>/);
  assert.match(html, /id="hero-target-prompt"[^>]*role="status"[^>]*hidden/);
  assert.match(html, /id="hero-target-cancel"/);
  assert.equal(html.match(/data-hero-detail="awakening"/g)?.length, 2);
  assert.match(mainSource, /ui\.hero\.abilityCharges/);
  assert.match(mainSource, /ui\.hero\.bonusChargeEarned/);
  assert.match(mainSource, /ui\.hero\.rechargeKills/);
  assert.match(mainSource, /elements\.gateShield\.hidden = ui\.gateShield <= 0/);
  assert.match(mainSource, /cancelHeroAbilityTargeting\(\)/);
  assert.match(mainSource, /code === "hero_awakening_unlocked"/);
  assert.match(css, /\.hero-target-prompt button \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.pulse-charges \{[^}]*position:\s*absolute;/s);
});

test("the selected build type explains its practical role without adding a fifth card", () => {
  assert.equal(html.match(/data-tower=/g)?.length, 4);
  assert.match(mainSource, /elements\.buildHint\.textContent = ui\.selectedBuildType[\s\S]*towerRole\(ui\.selectedBuildType\)/);
  assert.match(mainSource, /function towerRole\(type: TowerType\)/);
  assert.match(mainSource, /card\.title = role/);
  assert.match(css, /\.panel-copy \{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s);
});

test("hero controls preserve compact rows and Telegram-sized touch targets", () => {
  assert.match(css, /\.hero-panel \{[^}]*min-height:\s*var\(--tower-controls-height\);[^}]*height:\s*100%;/s);
  assert.match(css, /\.hero-actions button \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.hero-choice-button \{[^}]*min-height:\s*70px;/s);
  assert.match(css, /\.hero-picker-close \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /\.hero-picker \.modal-primary \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width: 360px\) \{[\s\S]*?\.hero-options \{[^}]*overflow-x:\s*auto;/);
  assert.match(css, /\.hero-option-portrait \{[^}]*object-fit:\s*cover;/s);
  assert.match(css, /\.hero-option\.is-locked \.hero-option-lock \{ display:\s*flex; \}/);
  assert.match(css, /\.hero-option\.is-locked:disabled \{[^}]*filter:\s*none;[^}]*opacity:\s*1;/s);
});

test("one accessible game menu replaces the session shortcut and owns auxiliary actions", () => {
  const menuMarkup = elementMarkupById(html, "game-menu-overlay");
  const menuButton = html.match(/<button[^>]*id="game-menu-button"[^>]*>/)?.[0] ?? "";
  const topActions = html.match(/<div class="top-actions">([\s\S]*?)<\/div>/)?.[1] ?? "";

  assert.notEqual(menuMarkup, "");
  assert.match(menuMarkup, /role="dialog"/);
  assert.match(menuMarkup, /aria-modal="true"/);
  assert.match(menuButton, /aria-controls="game-menu-overlay"/);
  assert.match(menuButton, /aria-expanded="false"/);
  assert.match(menuMarkup, /id="game-menu-continue"/);
  assert.match(menuMarkup, /id="game-menu-restart"/);
  assert.match(menuMarkup, /id="game-menu-hero-details"/);
  assert.doesNotMatch(html, /id="session-menu-button"/);
  if (/data-role="language"/.test(topActions)) {
    assert.match(topActions, /<(?:label|div)[^>]*(?:\bhidden\b|aria-hidden="true"|is-hidden)[^>]*>[\s\S]*data-role="language"/);
  }
  assert.match(menuMarkup, /data-role="language"/);
  assert.match(mainSource, /gameMenuButton\.addEventListener\("click"/);
  assert.match(mainSource, /gameMenuContinue\.addEventListener\("click"/);
  assert.match(mainSource, /gameMenuRestart\.addEventListener\("click"/);
  assert.match(mainSource, /gameMenuButton\.textContent = combatPhase \? \(ui\.paused \? "▶" : "Ⅱ"\) : "☰"/);
  assert.match(mainSource, /combatPhase \? \(ui\.paused \? "game_menu_continue" : "pause"\) : "game_menu"/);
  assert.match(mainSource, /resumeAfterMenu = combatPhase && !latestUi\.paused/);
  for (const key of [
    "game_menu",
    "game_menu_continue",
    "game_menu_restart",
    "game_menu_restart_confirm",
    "game_menu_restart_confirm_copy",
    "game_menu_restart_unavailable",
    "game_menu_hero_details",
    "game_menu_session",
    "game_menu_language",
    "game_menu_fullscreen",
    "game_menu_tower_guide",
  ]) {
    assert.match(mainSource, new RegExp(`"${key}"`));
  }
});

test("hero picker exposes semantic rank, attack, passive, and ability details for the selected hero", () => {
  const detailsStart = html.indexOf('id="hero-picker-details"');
  const detailsEnd = html.indexOf('id="hero-picker-done"', detailsStart);
  const detailsMarkup = detailsStart >= 0 && detailsEnd > detailsStart
    ? html.slice(detailsStart, detailsEnd)
    : "";

  assert.notEqual(detailsMarkup, "");
  for (const detail of ["rank", "attack", "passive", "ability"]) {
    assert.match(detailsMarkup, new RegExp(`data-hero-detail="${detail}"`));
  }
  assert.match(mainSource, /heroPickerDetails/);
  assert.match(mainSource, /hero_detail_(?:rank|attack|passive|ability)/);
});
