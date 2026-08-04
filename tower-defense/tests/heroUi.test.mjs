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

test("a dedicated hero screen offers four accessible portraits without adding a tower card", () => {
  const introMarkup = elementMarkupById(html, "intro-overlay");
  const pickerMarkup = elementMarkupById(html, "hero-picker-overlay");

  assert.equal(html.match(/data-hero-choice=/g)?.length, 4);
  assert.match(html, /data-hero-choice="eira"/);
  assert.match(html, /data-hero-choice="toren"/);
  assert.match(html, /data-hero-choice="grak"/);
  assert.match(html, /data-hero-choice="morna"/);
  assert.match(html, /eira-portrait\.webp/);
  assert.match(html, /toren-portrait\.webp/);
  assert.match(html, /grak-portrait\.webp/);
  assert.match(html, /morna-portrait\.webp/);
  assert.equal(html.match(/data-tower=/g)?.length, 4);
  assert.match(html, /id="hero-choice-button"[^>]*aria-controls="hero-picker-overlay"[^>]*aria-expanded="false"/);
  assert.match(pickerMarkup, /role="dialog"/);
  assert.match(pickerMarkup, /aria-modal="true"/);
  assert.match(pickerMarkup, /aria-labelledby="hero-picker-title"/);
  assert.doesNotMatch(introMarkup, /id="hero-picker-overlay"/);
  assert.match(html, /class="hero-options" aria-labelledby="hero-picker-title"/);
  assert.doesNotMatch(pickerMarkup, /role="radio"|aria-checked=/);
  const grakOption = html.match(/<button[^>]*data-hero-choice="grak"[^>]*>/)?.[0] ?? "";
  assert.match(grakOption, /aria-describedby="hero-grak-unlock"/);
  assert.doesNotMatch(grakOption, /\bdisabled\b/);
  const mornaOption = html.match(/<button[^>]*data-hero-choice="morna"[^>]*>/)?.[0] ?? "";
  assert.match(mornaOption, /aria-describedby="hero-morna-unlock"/);
  assert.doesNotMatch(mornaOption, /\bdisabled\b/);
});

test("hero preview stays separate until an available hero is confirmed", () => {
  const previewSource = mainSource.match(/function previewHero[\s\S]*?(?=\nfunction confirmHeroChoice)/)?.[0] ?? "";
  const confirmSource = mainSource.match(/function confirmHeroChoice[\s\S]*?(?=\nfunction setHeroPickerTab)/)?.[0] ?? "";

  assert.match(mainSource, /let previewHeroId: HeroId = selectedHeroId/);
  assert.match(previewSource, /previewHeroId = value/);
  assert.match(previewSource, /syncHeroPickerPreview\(\)/);
  assert.doesNotMatch(previewSource, /selectedHeroId = value|createCampaignState/);
  assert.match(confirmSource, /isHeroAvailable\(previewHeroId, playerProfile\)/);
  assert.match(confirmSource, /chooseHero\(previewHeroId\)/);
  assert.match(confirmSource, /closeHeroPicker\(true\)/);
  assert.match(mainSource, /function chooseHero\(value: string\): void \{[\s\S]*isHeroId\(value\)[\s\S]*heroChoiceIsLocked\(\)[\s\S]*if \(!restartSelectionPending\) \{\s*initialCampaign = createCampaignState\(\{[\s\S]*heroId: selectedHeroId/);
  assert.match(mainSource, /function heroChoiceIsLocked\(\): boolean \{\s*if \(restartSelectionPending\) return false;\s*return gameMounted \|\| runStarted \|\| hasRunProgress\(latestUi\?\.campaign \?\? initialCampaign\);/);
  assert.match(mainSource, /selectedHeroId = initialCampaign\.hero\.id/);
  assert.match(mainSource, /let runStarted = Boolean\(restoredCheckpoint\)/);
  assert.match(mainSource, /saveCampaign\(storage, saveKey, startedCampaign\)/);
  assert.match(mainSource, /elements\.heroChoiceButton\.disabled = disabled/);
  assert.match(mainSource, /elements\.heroChoiceLock\.hidden = !locked/);
  assert.match(mainSource, /isHeroAvailable\(value, playerProfile\)/);
  assert.match(mainSource, /const optionUnavailable = !isHeroAvailable\(optionHeroId, playerProfile\)/);
  assert.match(mainSource, /option\.classList\.toggle\("is-previewed", previewed\)/);
  assert.match(mainSource, /if \(current\) option\.setAttribute\("aria-current", "true"\)/);
  assert.doesNotMatch(mainSource, /option\.setAttribute\("aria-checked"/);
  assert.match(mainSource, /option\.disabled = disabled/);
  assert.match(mainSource, /heroPickerDone\.disabled = disabled \|\| unavailable/);
  assert.match(mainSource, /!grakWasUnlocked && isHeroAvailable\("grak", playerProfile\)[\s\S]*hero_grak_unlocked/);
  assert.match(mainSource, /!mornaWasUnlocked && isHeroAvailable\("morna", playerProfile\)[\s\S]*hero_morna_unlocked/);
  assert.match(mainSource, /import\.meta\.env\.DEV[\s\S]*preview_hero/);
});

test("same-attempt restart keeps the newly chosen hero instead of restoring the paused hero", () => {
  const renderUiSource = mainSource.match(/function renderUi[\s\S]*?(?=\nfunction renderWavePreview)/)?.[0] ?? "";
  assert.match(mainSource, /function syncHeroChoiceControls\(\): void \{\s*if \(!restartSelectionPending\) \{[\s\S]*selectedHeroId = campaign\.hero\.id/);
  assert.match(renderUiSource, /if \(!restartSelectionPending\) selectedHeroId = ui\.hero\.id;/);
  assert.match(mainSource, /if \(restartSelectionPending\) \{\s*const restarted = await applyPendingRestart\(\)/);
  assert.match(mainSource, /restartMiniAppRun\(\s*launchDecision\.initData,\s*miniAppBootstrap,\s*selectedHeroId/);
  assert.match(mainSource, /activateServerBootstrap\(restarted\.bootstrap, selectedHeroId\)/);
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
  assert.equal(html.match(/data-hero-detail="frontline" hidden/g)?.length, 2);
  assert.match(mainSource, /const heroSelected = ui\.selectedHero && !selected/);
  assert.match(mainSource, /elements\.buildPanel\.hidden = Boolean\(selected\) \|\| heroSelected/);
  assert.doesNotMatch(mainSource, /is-combat-compact/);
  assert.match(mainSource, /elements\.heroPanel\.hidden = !heroSelected/);
  assert.match(mainSource, /currentScene\(\)\?\.upgradeHero\(\)/);
  assert.match(mainSource, /currentScene\(\)\?\.useHeroAbility\(\)/);
  assert.match(mainSource, /function syncHeroAuraStatus\(ui: TowerDefenseUiState\)/);
  assert.match(mainSource, /getHeroCombatStats\(ui\.hero\.id, ui\.hero\.level\)/);
  assert.match(mainSource, /hero_frontline_armor_help/);
  assert.match(mainSource, /heroCombatEnabled: HERO_COMBAT_RELEASED/);
  assert.match(mainSource, /const frontlineEnabled = HERO_COMBAT_RELEASED/);
  assert.match(mainSource, /frontlineRow\.hidden = !frontlineEnabled/);
  assert.match(mainSource, /hero_frontline_detail/);
  assert.match(mainSource, /armor: Math\.max\(0, Math\.ceil\(frontline\.heroicArmor\)\)/);
  assert.match(mainSource, /hero_eira_aura_status/);
  assert.match(mainSource, /hero_toren_aura_status/);
  assert.match(mainSource, /hero_grak_aura_status/);
  assert.match(mainSource, /hero_morna_essence_short/);
  assert.match(mainSource, /mornaState\.corpseEssence/);
  assert.match(mainSource, /aura\.globalStrength/);
  assert.match(mainSource, /pulseButton\.disabled = ui\.heroTargeting[\s\S]*!ui\.heroAbilityAvailable/);
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
  assert.match(css, /\.hero-picker-screen \.hero-picker-close \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /\.hero-showcase-visual \{[^}]*aspect-ratio:\s*4\s*\/\s*5;/s);
  assert.match(css, /\.hero-showcase-portrait \{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;[^}]*object-position:\s*center bottom;/s);
  assert.match(css, /\.hero-picker-screen \.hero-options \{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;/s);
  assert.match(css, /\.hero-picker-layer \{[^}]*safe-area-inset-bottom/s);
  assert.doesNotMatch(css.match(/\.hero-picker-footer \{[^}]*\}/s)?.[0] ?? "", /safe-area-inset-bottom/);
  assert.match(css, /\.hero-picker-footer \.modal-primary \{[^}]*min-height:\s*48px;/s);
  assert.match(css, /@media \(min-width: 720px\) \{[\s\S]*?\.hero-picker-layout \{[^}]*grid-template-columns:/);
});

test("hero preview distinguishes inspection from the committed choice", () => {
  const pickerMarkup = elementMarkupById(html, "hero-picker-overlay");
  const statusMarkup = html.match(/<span[^>]*id="hero-picker-selection-status"[^>]*>/)?.[0] ?? "";

  assert.match(pickerMarkup, /class="hero-option is-previewed is-current"[^>]*aria-current="true"/);
  assert.match(css, /\.hero-picker-screen \.hero-option\.is-previewed \{/);
  assert.match(css, /\.hero-picker-screen \.hero-option\.is-current \.hero-option-check \{ display: grid; \}/);
  assert.equal(pickerMarkup.match(/aria-live=/g)?.length, 1);
  assert.match(statusMarkup, /role="status"/);
  assert.match(statusMarkup, /aria-live="polite"/);
  assert.match(statusMarkup, /aria-atomic="true"/);
  assert.match(mainSource, /option\.addEventListener\("keydown"/);
  assert.match(mainSource, /nextOption\.focus\(\)/);
  assert.match(mainSource, /previewHero\(nextOption\.dataset\.heroChoice\)/);
});

test("one accessible game menu replaces the session shortcut and routes shared settings", () => {
  const menuMarkup = elementMarkupById(html, "game-menu-overlay");
  const settingsMarkup = elementMarkupById(html, "settings-overlay");
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
  assert.match(menuMarkup, /id="game-menu-settings-button"[^>]*aria-controls="settings-overlay"/);
  assert.doesNotMatch(menuMarkup, /data-role="language"|data-audio-toggle|id="fullscreen-button"/);
  assert.match(settingsMarkup, /data-role="language"/);
  assert.match(settingsMarkup, /data-audio-toggle="music"/);
  assert.match(settingsMarkup, /id="fullscreen-button"/);
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
    "settings",
    "game_menu_language",
    "game_menu_fullscreen",
    "game_menu_tower_guide",
  ]) {
    assert.match(mainSource, new RegExp(`"${key}"`));
  }
});

test("hero picker exposes semantic rank, attack, passive, and ability details for the selected hero", () => {
  const pickerMarkup = elementMarkupById(html, "hero-picker-overlay");
  const detailsStart = html.indexOf('id="hero-picker-details"');
  const detailsEnd = html.indexOf('id="hero-picker-done"', detailsStart);
  const detailsMarkup = detailsStart >= 0 && detailsEnd > detailsStart
    ? html.slice(detailsStart, detailsEnd)
    : "";

  assert.notEqual(detailsMarkup, "");
  for (const detail of ["attack", "passive", "ability", "awakening"]) {
    assert.match(detailsMarkup, new RegExp(`data-hero-detail="${detail}"`));
  }
  assert.match(html, /id="hero-showcase-rank"/);
  assert.equal(pickerMarkup.match(/role="tab"/g)?.length, 3);
  assert.equal(pickerMarkup.match(/role="tabpanel"/g)?.length, 3);
  assert.match(html, /data-hero-tab="overview"/);
  assert.match(html, /data-hero-tab="skills"/);
  assert.match(html, /data-hero-tab="progression"/);
  assert.match(mainSource, /heroPickerDetails/);
  assert.match(mainSource, /function setHeroPickerTab/);
  assert.match(mainSource, /tab\.setAttribute\("aria-selected", String\(selected\)\)/);
  assert.match(mainSource, /panel\.hidden = panel\.dataset\.heroPanel !== activeHeroPickerTab/);
  assert.match(mainSource, /event\.key === "ArrowRight"/);
  assert.match(mainSource, /hero_detail_(?:rank|attack|passive|ability)/);
});
