import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(currentDir, "../index.html"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const domUiSource = readFileSync(resolve(currentDir, "../src/domUi.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");
const cityHeroUiSource = readFileSync(resolve(currentDir, "../src/cityHeroUi.ts"), "utf8");
const arenaTiersSource = readFileSync(resolve(currentDir, "../src/generated/arenaTiers.generated.ts"), "utf8");
const battleResultFrameAssetPath = resolve(currentDir, "../src/assets/ui/battle-result/battle-result-card-frame.webp");
const battleResultLevelBadgeAssetPath = resolve(currentDir, "../src/assets/ui/battle-result/battle-result-level-badge.webp");

test("fighter stats are mounted inside the battle overlay", () => {
  const statusStripIndex = html.indexOf('<section class="status-strip"');
  const battleOverlayIndex = html.indexOf('<div class="battle-ui"');
  const statsIndex = html.indexOf('class="fighters-strip arena-fighters-strip flask-hud"');
  const resultBannerIndex = html.indexOf('<div id="resultBanner"');

  assert.ok(statusStripIndex > 0, "status strip should exist");
  assert.ok(battleOverlayIndex > 0, "battle overlay should exist");
  assert.ok(statsIndex > battleOverlayIndex, "fighter stats should be inside the battle overlay area");
  assert.ok(statsIndex < resultBannerIndex, "fighter stats should stay inside the stage panel before the result banner");
  assert.equal(html.slice(0, statusStripIndex).includes("fighters-strip"), false, "fighter stats should not take a top-level row above status");
});

test("bottom action panel is removed", () => {
  assert.equal(html.includes('class="action-cluster"'), false);
  assert.equal(html.includes('id="actions"'), false);
});

test("city screen does not reserve space for a global border frame", () => {
  assert.equal(stylesSource.includes("border: 4px solid #35180d"), false);
  assert.equal(stylesSource.includes("box-shadow: 0 6px 0 rgba(0, 0, 0, 0.36)"), false);
});

test("battle result panel exposes rewards and xp progress", () => {
  assert.equal(html.includes('id="resultEyebrow"'), true);
  assert.equal(html.includes('id="resultTitle"'), true);
  assert.equal(html.includes('id="resultGoldReward"'), true);
  assert.equal(html.includes('id="resultXpReward"'), true);
  assert.equal(html.includes('aria-label="Gold reward"'), true);
  assert.equal(html.includes('aria-label="XP reward"'), true);
  assert.equal(html.includes("<span>Gold</span>"), false);
  assert.equal(html.includes("<span>XP</span>"), false);
  assert.equal(html.includes('id="resultLoot"'), true);
  assert.equal(html.includes('id="resultXpLevel"'), true);
  assert.equal(html.includes('data-level-digits="1"'), true);
  assert.equal(html.includes('id="resultXpProgressFill"'), true);
  assert.equal(html.includes('class="battle-result__level-badge"'), true);
  assert.equal(html.includes('class="battle-result__level-label"'), false);
  assert.equal(html.includes('class="battle-result__xp-progress-icon"'), true);
  assert.equal(html.includes('id="cityButton"'), true);
  assert.equal(existsSync(battleResultFrameAssetPath), true);
  assert.equal(existsSync(battleResultLevelBadgeAssetPath), true);
  assert.equal(stylesSource.includes("battle-result-card-frame.webp"), true);
  assert.equal(stylesSource.includes("battle-result-level-badge.webp"), true);
  assert.match(stylesSource, /\.battle-result__reward\s*\{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*justify-content: center;/);
  assert.equal(stylesSource.includes(".battle-result__reward span:last-child"), false);
  assert.equal(stylesSource.includes('.battle-result__level-value[data-level-digits="1"]'), true);
  assert.equal(stylesSource.includes('.battle-result__level-value[data-level-digits="2"]'), true);
  assert.equal(stylesSource.includes('.battle-result__level-value[data-level-digits="3"]'), true);
  assert.equal(stylesSource.includes("--battle-result-level-value-scale"), true);
  assert.equal(stylesSource.includes(".battle-result__xp-progress-icon"), true);
  assert.equal(stylesSource.includes("./assets/ui/shop/xp-icon.webp"), true);
  assert.equal(domUiSource.includes("loot?: readonly ArenaLootDrop[]"), true);
  assert.equal(domUiSource.includes("renderResultLoot"), true);
  assert.equal(domUiSource.includes("renderResultXpLabel"), true);
  assert.equal(domUiSource.includes("battle-result__xp-progress-icon"), true);
  assert.equal(domUiSource.includes('dom.resultXpLevel.dataset.levelDigits = String(levelDigitCount)'), true);
  assert.equal(domUiSource.includes('dom.resultXpLevel.removeAttribute("data-level-digits")'), true);
  assert.equal(domUiSource.includes("progressText.slice(0, -xpSuffix.length)"), true);
  assert.equal(mainSource.includes("applyCombatReward(hero, nextState, rewardTimestamp)"), true);
  assert.equal(mainSource.includes("loot,"), true);
});

test("battle hud exposes combat buff and debuff status trays with scroll icons", () => {
  assert.equal(html.includes('class="combat-status-line"'), true);
  assert.equal(html.includes('class="combat-buff-tray"'), true);
  assert.equal(html.includes('class="combat-debuff-tray"'), true);
  assert.equal(html.includes('id="classicPlayerPoison"'), false);
  assert.equal(html.includes('id="classicEnemyPoison"'), false);
  assert.equal(html.includes('id="playerWard"'), true);
  assert.equal(html.includes('id="playerPreciseStrike"'), true);
  assert.equal(html.includes('id="playerDoubleStrike"'), true);
  assert.equal(html.includes('id="playerPoison"'), true);
  assert.equal(html.includes('id="enemyWard"'), true);
  assert.equal(html.includes('id="enemyPreciseStrike"'), true);
  assert.equal(html.includes('id="enemyDoubleStrike"'), true);
  assert.equal(html.includes('id="enemyPoison"'), true);
  assert.equal(domUiSource.includes("HERO_WARD_SCROLL_ITEM_ID"), true);
  assert.equal(domUiSource.includes("HERO_PRECISE_STRIKE_SCROLL_ITEM_ID"), true);
  assert.equal(domUiSource.includes("HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID"), true);
  assert.equal(domUiSource.includes("HERO_POISON_SCROLL_ITEM_ID"), true);
  assert.equal(domUiSource.includes("getShopProductIconUrl([HERO_WARD_SCROLL_ITEM_ID])"), true);
  assert.equal(domUiSource.includes("getShopProductIconUrl([HERO_PRECISE_STRIKE_SCROLL_ITEM_ID])"), true);
  assert.equal(domUiSource.includes("getShopProductIconUrl([HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID])"), true);
  assert.equal(domUiSource.includes("getShopProductIconUrl([HERO_POISON_SCROLL_ITEM_ID])"), true);
  assert.equal(domUiSource.includes("getFighterWardHits"), true);
  assert.equal(domUiSource.includes("getFighterPreciseStrikeHits"), true);
  assert.equal(domUiSource.includes("getFighterDoubleStrikeHits"), true);
  assert.equal(domUiSource.includes("getFighterPoisonTurns"), true);
  assert.equal(stylesSource.includes(".combat-status-line"), true);
  assert.equal(stylesSource.includes(".combat-buff-tray"), true);
  assert.equal(stylesSource.includes(".ward-status"), true);
  assert.equal(stylesSource.includes(".precise-strike-status"), true);
  assert.equal(stylesSource.includes(".double-strike-status"), true);
  assert.equal(stylesSource.includes(".poison-status"), true);
  assert.equal(stylesSource.includes(".combat-debuff-tray"), true);
  assert.equal(stylesSource.includes("justify-content: flex-start;"), true);
  assert.equal(stylesSource.includes("justify-content: flex-end;"), true);
});

test("city hero widget lives in the bottom dock with a thumb-friendly portrait", () => {
  const heroWidgetStart = html.indexOf('id="heroWidget"');
  const heroWidgetEnd = html.indexOf('id="cityTimeToggle"');
  const heroWidgetHtml = html.slice(heroWidgetStart, heroWidgetEnd);

  assert.equal(html.includes('id="heroWidget"'), true);
  assert.equal(html.includes('id="heroPortraitButton"'), true);
  assert.equal(html.includes('id="heroInfoName"'), true);
  assert.equal(html.includes('id="heroInfoGold"'), true);
  assert.equal(html.includes('id="heroInfoLevel"'), true);
  assert.equal(html.includes('id="heroInfoRank"'), true);
  assert.equal(html.includes('id="heroInfoXpText"'), true);
  assert.equal(heroWidgetHtml.includes('class="city-menu__hero-xp-icon"'), true);
  assert.equal(heroWidgetHtml.includes('<div class="city-menu__hero-xp-track">'), true);
  assert.equal(heroWidgetHtml.indexOf('id="heroInfoXpFill"') < heroWidgetHtml.indexOf('id="heroInfoXpText"'), true);
  assert.equal(html.includes('id="heroInfoSkillPoints"'), false);
  assert.equal(cityHeroUiSource.includes("getHeroRankTitle"), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 90, title: "Immortal" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 70, title: "Legend" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 50, title: "Warlord" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 35, title: "Champion" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 25, title: "Veteran" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 15, title: "Gladiator" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 10, title: "Arena Blood" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 5, title: "Pit Fighter" }'), true);
  assert.equal(cityHeroUiSource.includes('{ minLevel: 1, title: "Novice" }'), true);
  assert.equal(stylesSource.includes(".city-menu__hero-rank"), true);
  assert.equal(stylesSource.includes(".city-menu__hero-xp-icon"), true);
  assert.equal(stylesSource.includes("./assets/ui/shop/xp-icon.webp"), true);
  assert.equal(stylesSource.includes("--city-hud-bronze"), true);
  assert.equal(stylesSource.includes("--city-hud-wood-shadow"), true);
  assert.equal(stylesSource.includes("--city-top-hud-height"), false);
  assert.equal(stylesSource.includes("--city-bottom-safe"), true);
  assert.equal(stylesSource.includes("bottom: calc(var(--city-bottom-safe) + var(--city-nav-height) + var(--city-bottom-dock-gap))"), true);
  assert.equal(stylesSource.includes("grid-template-columns: minmax(0, 1fr) 74px"), true);
  assert.equal(stylesSource.includes("grid-column: 2"), true);
  assert.equal(stylesSource.includes("bottom: var(--city-bottom-safe)"), true);
  assert.equal(stylesSource.includes("--ui-hud-portrait-frame"), false);
  assert.equal(stylesSource.includes("--ui-hud-wide-panel-frame"), false);
  assert.equal(stylesSource.includes("--ui-hud-xp-bar-frame"), false);
  assert.equal(stylesSource.includes("./assets/ui/panels/hud-portrait-frame.webp"), false);
  assert.equal(stylesSource.includes("./assets/ui/panels/hud-wide-panel-frame.webp"), false);
  assert.equal(stylesSource.includes("./assets/ui/panels/hud-xp-bar-frame.webp"), false);
  assert.equal(stylesSource.includes("grid-template-columns: 22px minmax(96px, 1fr)"), true);
  assert.equal(stylesSource.includes("place-items: center"), true);

  for (const attribute of ["strength", "agility", "vitality"]) {
    assert.equal(heroWidgetHtml.includes(`data-hero-attribute-value="${attribute}"`), false);
    assert.equal(heroWidgetHtml.includes(`data-hero-attribute-button="${attribute}"`), false);
  }
});

test("city hero portrait hints when skill points are unspent", () => {
  assert.equal(cityHeroUiSource.includes("hero.skillPoints > 0 || highlightedEquipmentItems.length > 0"), true);
  assert.equal(stylesSource.includes(".city-menu__portrait-button--has-points"), true);
  assert.equal(stylesSource.includes("@keyframes city-portrait-points-pulse"), true);
});

test("boss equipment drops hint the city profile equipment slot", () => {
  assert.equal(mainSource.includes("pendingBossEquipmentHintItemIds"), true);
  assert.equal(mainSource.includes("rememberBossEquipmentHint(nextState, loot)"), true);
  assert.equal(mainSource.includes("onCategoryOpen: handleProfileEquipmentCategoryOpen"), true);
  assert.equal(cityHeroUiSource.includes("highlightedEquipmentItemIds"), true);
  assert.equal(cityHeroUiSource.includes("city-profile__equipment-card--hint"), true);
  assert.equal(cityHeroUiSource.includes("getCityEquipmentCategoryIdForHeroItemId"), true);
  assert.equal(stylesSource.includes(".city-profile__equipment-card--hint"), true);
  assert.equal(stylesSource.includes("animation: city-profile-points-ready-pulse 1.25s ease-in-out infinite;"), true);
});

test("city hero profile skips unchanged equipment card renders", () => {
  assert.equal(cityHeroUiSource.includes("getCityHeroProfileEquipmentRenderKey"), true);
  assert.match(cityHeroUiSource, /if \(equipmentHost\.dataset\.heroProfileEquipmentRenderKey === renderKey\) \{\s*return;\s*\}/);
  assert.equal(cityHeroUiSource.includes("equipmentHost.dataset.heroProfileEquipmentRenderKey = renderKey"), true);
});

test("city hero profile pulses unspent points and available attribute buttons", () => {
  assert.equal(stylesSource.includes("@keyframes city-profile-points-ready-pulse"), true);
  assert.equal(stylesSource.includes("@keyframes city-profile-attribute-plus-pulse"), true);
  assert.equal(stylesSource.includes("animation: city-profile-points-ready-pulse 1.25s ease-in-out infinite;"), true);
  assert.equal(stylesSource.includes(".city-profile__attribute-button:not(:disabled)"), true);
  assert.equal(stylesSource.includes("animation: city-profile-attribute-plus-pulse 1.25s ease-in-out infinite;"), true);
});

test("city hero profile exposes attributes combat stats and equipment", () => {
  assert.equal(html.includes('id="heroProfile"'), true);
  assert.equal(html.includes('role="dialog"'), true);
  assert.equal(html.includes('id="heroProfilePortrait"'), true);
  assert.equal(html.includes('id="heroProfileSkillPoints"'), true);
  assert.equal(html.includes('data-hero-profile-stat="damage"'), true);
  assert.equal(html.includes('data-hero-profile-stat="armor"'), false);
  assert.equal(html.includes("DERIVED STATS"), false);
  assert.equal(html.includes(">STATS<"), true);
  assert.equal(html.includes("HEALTH (HP)"), true);
  assert.equal(html.includes("MOVEMENT SPEED"), true);
  assert.equal(html.includes("data-hero-profile-equipment"), true);
  assert.equal(cityHeroUiSource.includes("mountCityHeroProfile"), true);
  assert.equal(cityHeroUiSource.includes("mountCityHeroEquipmentMenu"), true);
  assert.equal(cityHeroUiSource.includes("getOwnedCityEquipmentProducts"), true);
  assert.equal(cityHeroUiSource.includes("getInventoryCityEquipmentProducts"), true);
  assert.equal(cityHeroUiSource.includes("pairGeneratedArmoryProducts("), true);
  assert.equal(cityHeroUiSource.includes("hero.inventory.flatMap"), true);
  assert.equal(mainSource.includes("mountCityHeroEquipmentMenu(cityHeroWidgetRefs"), true);
  assert.equal(mainSource.includes("const cityHeroEquipmentMenu: CityHeroEquipmentMenuApi = mountCityHeroEquipmentMenu(cityHeroWidgetRefs"), true);
  assert.equal((mainSource.match(/cityHeroEquipmentMenu\.render\(\);/g) ?? []).length >= 4, true);
  assert.equal(mainSource.includes("mirrorParents: cityHeroWidgetRefs.profilePortrait ? [cityHeroWidgetRefs.profilePortrait] : []"), true);
  assert.equal(mainSource.includes("heroProfilePortraitPreview"), false);
  assert.equal(stylesSource.includes(".city-profile__panel"), true);
  assert.equal(stylesSource.includes(".city-equipment-menu__tray"), true);
  assert.equal(stylesSource.includes("@keyframes city-profile-panel-in"), true);
  assert.equal(stylesSource.includes("grid-template-rows: auto auto;"), true);
  assert.equal(stylesSource.includes("grid-row: 1 / span 2;"), true);
});

test("city hero profile uses generated medallion icons for attributes and derived stats", () => {
  ["attribute-strength", "attribute-agility", "attribute-vitality"].forEach((iconName) => {
    assert.equal(stylesSource.includes(`./assets/ui/profile/${iconName}.webp`), true);
  });

  ["stat-damage", "stat-health", "stat-movement", "stat-stamina", "stat-recovery"].forEach((iconName) => {
    assert.equal(stylesSource.includes(`./assets/ui/profile/${iconName}.webp`), true);
  });

  assert.equal(stylesSource.includes("stat-armor.webp"), false);
  assert.equal(cityHeroUiSource.includes("formatMeleeDamageProfileStat(stats.meleeDamagePercentBonus)"), true);
  assert.equal(cityHeroUiSource.includes("formatMovementSpeedPercent(stats.movementDistanceBonus)"), true);
  assert.equal(cityHeroUiSource.includes("setText(refs.profileStats.hp, String(stats.maxHp))"), true);
  assert.equal(cityHeroUiSource.includes("setText(refs.profileStats.stamina, String(stats.maxStamina))"), true);
  assert.equal(cityHeroUiSource.includes("HERO_PROFILE_BASE_REST_HP + stats.restHpRestoreBonus"), true);
  assert.equal(cityHeroUiSource.includes("HERO_PROFILE_BASE_REST_STAMINA + stats.restStaminaRestoreBonus"), true);
  assert.equal(cityHeroUiSource.includes("renderProfileRecoveryStat("), true);
  assert.equal(cityHeroUiSource.includes("refs.profileStats.recovery"), true);
  assert.equal(stylesSource.includes(".city-profile__resource-bonus"), false);
  assert.equal(stylesSource.includes(".city-profile__recovery-value--hp::before"), true);
  assert.equal(stylesSource.includes(".city-profile__recovery-value--stamina::before"), true);
  assert.equal(stylesSource.includes("grid-template-columns: 38px minmax(0, 1fr);"), true);
  assert.equal(stylesSource.includes("min-height: 50px;"), true);
  assert.equal(stylesSource.includes(".city-profile__derived .city-profile__recovery-value"), true);
  assert.equal(stylesSource.includes("width: 22px;"), true);
});

test("city hero attribute buttons support bulk and hold allocation", () => {
  assert.equal(cityHeroUiSource.includes("ATTRIBUTE_CTRL_ALLOCATE_AMOUNT = 10"), true);
  assert.equal(cityHeroUiSource.includes("ATTRIBUTE_HOLD_REPEAT_DELAY_MS"), true);
  assert.equal(cityHeroUiSource.includes("event.ctrlKey ? ATTRIBUTE_CTRL_ALLOCATE_AMOUNT : 1"), true);
  assert.equal(cityHeroUiSource.includes("window.setInterval(() => allocate(amount), ATTRIBUTE_HOLD_REPEAT_INTERVAL_MS)"), true);
  assert.equal(cityHeroUiSource.includes('button.addEventListener("pointerdown", handlePointerDown)'), true);
  assert.equal(mainSource.includes("allocateHeroSkillPoints(hero, attribute, amount)"), true);
});

test("city equipment inventory cards share the textured rarity standard", () => {
  const inventoryItemRule = stylesSource.match(/\.city-equipment-menu__item\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const selectedOrbRule = stylesSource.match(/\.city-equipment-menu__selected-orb\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(inventoryItemRule, /var\(--ui-profile-backdrop-texture\) center \/ var\(--ui-profile-backdrop-size\) repeat/);
  assert.match(inventoryItemRule, /background-blend-mode: screen, multiply, screen, multiply, screen, screen, multiply, soft-light, normal;/);
  assert.match(inventoryItemRule, /var\(--shop-rarity-light, #d4c49c\) 0%, var\(--shop-rarity, #9d8d74\) 48%/);
  assert.match(inventoryItemRule, /inset 0 -6px 10px rgba\(8, 2, 1, 0\.26\)/);
  assert.match(selectedOrbRule, /var\(--ui-profile-backdrop-texture\) center \/ var\(--ui-profile-backdrop-size\) repeat/);
  assert.match(selectedOrbRule, /background-blend-mode: screen, screen, multiply, multiply, soft-light, normal;/);
  assert.match(selectedOrbRule, /var\(--shop-rarity-light, #75401d\) 0%, var\(--shop-rarity, #3a1508\) 52%/);
});

test("city equipment inventory keeps long item lists scrollable", () => {
  const panelRule = stylesSource.match(/\.city-equipment-menu__panel\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const trayRule = stylesSource.match(/\.city-equipment-menu__tray\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const productsRule = stylesSource.match(/\.city-equipment-menu__products\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(panelRule, /min-height: 0;/);
  assert.match(panelRule, /overflow: hidden;/);
  assert.match(trayRule, /overflow: hidden;/);
  assert.match(productsRule, /grid-auto-rows: 76px;/);
  assert.match(productsRule, /overflow-y: auto;/);
  assert.match(productsRule, /overscroll-behavior: contain;/);
  assert.equal(stylesSource.includes("@media (max-width: 460px), (max-height: 760px)"), true);
  assert.equal(stylesSource.includes("width: min(178px, 48vw, 28vh);"), true);
});

test("city equipment inventory uses display names instead of raw item names", () => {
  assert.equal(cityHeroUiSource.includes("getShopProductDisplayName"), true);
  assert.equal(cityHeroUiSource.includes("getShopProductDisplayStat(hero, product.itemIds, statKind)"), true);
  assert.equal(cityHeroUiSource.includes("items.map((item) => getShopProductDisplayName(item.name))"), true);
  assert.equal(cityHeroUiSource.includes("product ? getShopProductDisplayName(product.name).toUpperCase()"), true);
  assert.equal(cityHeroUiSource.includes('button.setAttribute("aria-label", getShopProductDisplayName(product.name));'), true);
});

test("city equipment inventory exposes generated weapon categories", () => {
  assert.equal(cityHeroUiSource.includes('id: "shurikens", label: "Shurikens", side: "weapon", iconUrl: SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL'), true);
  assert.equal(cityHeroUiSource.includes('id: "maces", label: "Maces", side: "weapon", iconUrl: SHOP_CATEGORY_MACE_ICON_ASSET_URL'), true);
  assert.equal(cityHeroUiSource.includes('id: "spears", label: "Spears", side: "weapon", iconUrl: SHOP_CATEGORY_SPEAR_ICON_ASSET_URL'), true);
  assert.equal(cityHeroUiSource.includes('weaponClass === "shuriken"'), true);
  assert.equal(cityHeroUiSource.includes('return "shurikens";'), true);
  assert.equal(cityHeroUiSource.includes('weaponClass === "mace"'), true);
  assert.equal(cityHeroUiSource.includes('return "maces";'), true);
  assert.equal(cityHeroUiSource.includes('weaponClass === "spear"'), true);
  assert.equal(cityHeroUiSource.includes('return "spears";'), true);
});

test("church button can be wired while keeping the locked visual state", () => {
  assert.equal(html.includes('id="churchButton"'), true);
  assert.equal(html.includes('city-menu__button city-menu__button--locked" type="button" aria-disabled="true"'), true);
  assert.equal(mainSource.includes("grantHeroLevels(hero, 20, now)"), true);
  assert.equal(mainSource.includes("unlockAllArenaBossTiers("), true);
});

test("city arena menu exposes random fights and boss entries", () => {
  assert.equal(html.includes('id="cityArenaMenu"'), true);
  assert.equal(html.includes('id="cityArenaEasyButton"'), true);
  assert.equal(html.includes('id="cityArenaRandomButton"'), true);
  assert.equal(html.includes('id="cityArenaHardButton"'), true);
  assert.equal(html.includes('id="cityArenaTierSelect"'), true);
  assert.equal(html.includes('id="cityArenaBossList"'), true);
  assert.equal(html.includes('aria-label="Arena choices"'), true);
  assert.equal(html.includes("Arena contracts"), false);
  assert.equal(html.includes("Easy contract"), false);
  assert.equal(html.includes("Medium contract"), false);
  assert.equal(html.includes("Hard contract"), false);
  assert.equal(html.includes("<span>Tier</span>"), false);
  assert.equal(html.includes('aria-label="Arena tier"'), false);
  assert.equal(html.includes(">FIGHTS</div>"), false);
  assert.equal(html.includes(">BOSS</div>"), false);
  assert.equal(html.includes(">COMMON</div>"), false);
  assert.equal(html.includes('<span class="city-arena-menu__eyebrow">Easy</span>'), false);
  assert.equal(html.includes('<span class="city-arena-menu__eyebrow">Medium</span>'), false);
  assert.equal(html.includes('<span class="city-arena-menu__eyebrow">Hard</span>'), false);
  assert.equal(html.includes("Medium"), true);
  assert.equal(html.includes("Easy Fight"), false);
  assert.equal(html.includes("Medium Fight"), false);
  assert.equal(html.includes("Hard Fight"), false);
  assert.equal(html.includes("Random Fight"), false);
  assert.equal(html.includes("city-arena-menu__fight--medium"), true);
  assert.equal(mainSource.includes("type ArenaMenuSelection"), true);
  assert.equal(mainSource.includes("createArenaEncounterForSelection"), true);
  assert.equal(mainSource.includes("createArenaBossEncounter(selection.bossId)"), true);
  assert.equal(mainSource.includes("createArenaRandomEnemyEncounter(selection.tierId, selection.difficultyId)"), true);
  assert.equal(mainSource.includes("pickArenaBackgroundVariantIdForTier(encounter.tierId)"), true);
  assert.equal(mainSource.includes("backgroundVariantId:"), true);
  assert.equal(mainSource.includes("getArenaTierDefinitions"), true);
  assert.equal(mainSource.includes("getVisibleCityArenaTiers"), true);
  assert.equal(mainSource.includes("getAvailableCityArenaTiers"), true);
  assert.equal(mainSource.includes("getArenaBossesForTier"), true);
  assert.equal(mainSource.includes("option.disabled = !isUnlocked"), true);
  assert.equal(mainSource.includes(" - Locked"), true);
  assert.equal(mainSource.includes("Defeat previous boss to unlock"), true);
  assert.equal(mainSource.includes("select.disabled = visibleTiers.length <= 1"), true);
  assert.equal(mainSource.includes('name.textContent = "Boss"'), true);
  assert.equal(mainSource.includes('cityArenaEasyName.textContent = "Easy"'), true);
  assert.equal(mainSource.includes('cityArenaRandomName.textContent = "Medium"'), true);
  assert.equal(mainSource.includes('cityArenaHardName.textContent = "Hard"'), true);
  assert.equal(mainSource.includes("+ unique reward"), true);
  assert.equal(arenaTiersSource.includes('name: "Dust Arena"'), true);
  assert.equal(arenaTiersSource.includes('name: "Dust Arena I"'), false);
  assert.equal(mainSource.includes("boss.baseStats"), false);
  assert.equal(mainSource.includes("city-arena-menu__boss-stats"), false);
  assert.equal(mainSource.includes("Tier ${boss.tierId} Boss"), false);
  assert.equal(mainSource.includes("syncCityArenaReward"), true);
  assert.equal(mainSource.includes("SHOP_GOLD_COIN_ICON_ASSET_URL"), true);
  assert.equal(mainSource.includes("SHOP_XP_ICON_ASSET_URL"), true);
  assert.equal(mainSource.includes("formatCityArenaReward"), false);
  assert.equal(mainSource.includes("city-menu--arena-select-open"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__tier-select"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__boss"), true);
  assert.equal(stylesSource.includes("assets/ui/arena-difficulty/difficulty-easy.webp"), true);
  assert.equal(stylesSource.includes("assets/ui/arena-difficulty/difficulty-medium.webp"), true);
  assert.equal(stylesSource.includes("assets/ui/arena-difficulty/difficulty-hard.webp"), true);
  assert.equal(stylesSource.includes("assets/ui/arena-difficulty/difficulty-boss.webp"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__reward-icon"), true);
  assert.equal(stylesSource.includes("width: 17px"), true);
  assert.equal(stylesSource.includes("font-size: 0.72rem"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__unique-reward"), true);
  assert.equal(stylesSource.includes('content: "\\203A"'), true);
  assert.equal(stylesSource.includes("display: flex"), true);
  assert.equal(stylesSource.includes("--arena-banner-width: 44px"), true);
  assert.equal(stylesSource.includes("--arena-banner-width: 54px"), true);
  assert.equal(stylesSource.includes("--arena-banner-width: 64px"), true);
  assert.equal(stylesSource.includes("--arena-banner-width: 76px"), true);
  assert.equal(stylesSource.includes("--arena-banner-height: 78px"), true);
  assert.equal(stylesSource.includes("--arena-banner-height: 90px"), true);
  assert.equal(stylesSource.includes("--arena-banner-height: 102px"), true);
  assert.equal(stylesSource.includes("--arena-banner-height: 112px"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__fight--hard"), true);
  assert.equal(stylesSource.includes(".city-arena-menu__section-title"), false);
  assert.equal(stylesSource.includes(".city-menu--arena-select-open .city-menu__nav"), true);
  assert.equal(stylesSource.includes("--ui-hud-button-frame"), false);
  assert.equal(stylesSource.includes("./assets/ui/panels/hud-button-frame.webp"), false);
  assert.equal(stylesSource.includes("var(--ui-hud-button-frame) center / 100% 100% no-repeat"), false);
  assert.equal(stylesSource.includes("var(--ui-hud-wide-panel-frame) center / 100% 100% no-repeat"), false);
  assert.equal(stylesSource.includes("var(--ui-panel-wood-texture) center / 180px 180px repeat"), true);
});

test("fighter resources use flask HUD while preserving stat ids", () => {
  assert.equal(html.includes('class="fighters-strip arena-fighters-strip flask-hud"'), true);
  assert.equal(html.includes('class="resource-flask flask--hp"'), true);
  assert.equal(html.includes('class="resource-flask flask--armor"'), true);
  assert.equal(html.includes('class="resource-flask flask--stamina"'), true);
  assert.equal(html.includes('class="classic-stat__icon classic-stat__icon--hp"'), true);
  assert.equal(html.includes('class="classic-stat__icon classic-stat__icon--armor"'), true);
  assert.equal(html.includes('class="classic-stat__icon classic-stat__icon--stamina"'), true);
  assert.equal(html.includes('id="classicPlayerHpText" class="classic-stat__value"'), true);
  assert.equal(stylesSource.includes(".classic-stat__icon--hp"), true);
  assert.equal(stylesSource.includes('background-image: url("./assets/ui/profile/stat-health.webp")'), true);
  assert.equal(stylesSource.includes('background-image: url("./assets/ui/damage-icons/damage-armor-absorb.webp")'), true);
  assert.equal(stylesSource.includes('background-image: url("./assets/ui/profile/stat-stamina.webp")'), true);
  assert.equal(stylesSource.includes(".classic-stat__value"), true);
  assert.equal(stylesSource.includes("place-items: center;"), true);
  assert.equal(stylesSource.includes("grid-template-columns: 20px minmax(64px, 1fr);"), true);
  assert.equal(stylesSource.includes("min-height: 21px;"), true);
  assert.equal(stylesSource.includes("font-size: 0.72rem;"), true);

  for (const id of [
    "playerHpText",
    "playerArmorText",
    "playerStaText",
    "playerHpFill",
    "playerArmorFill",
    "playerStaFill",
    "enemyHpText",
    "enemyArmorText",
    "enemyStaText",
    "enemyHpFill",
    "enemyArmorFill",
    "enemyStaFill",
  ]) {
    assert.equal(html.includes(`id="${id}"`), true, `${id} should remain available for combat rendering`);
  }
});

test("battle resource fills animate through transforms instead of layout sizes", () => {
  assert.equal(domUiSource.includes("setStyleTransform(element, `scaleY(${safeRatio})`);"), true);
  assert.equal(domUiSource.includes("setStyleTransform(element, `scaleX(${safeRatio})`);"), true);
  assert.equal(domUiSource.includes("element.style.width = `${safeRatio * 100}%`;"), false);
  assert.equal(domUiSource.includes("element.style.height = `${safeRatio * 100}%`;"), false);
  assert.equal(stylesSource.includes("transform-origin: left center;"), true);
  assert.equal(stylesSource.includes("transition: transform 180ms ease;"), true);
  assert.equal(stylesSource.includes("transform-origin: center bottom;"), true);
  assert.equal(stylesSource.includes("transition: transform 220ms ease;"), true);
});

test("battle HUD DOM updates skip unchanged values", () => {
  assert.equal(domUiSource.includes("function setText(element: HTMLElement, value: string): void"), true);
  assert.equal(domUiSource.includes("if (element.textContent !== value)"), true);
  assert.equal(domUiSource.includes("function setStyleTransform(element: HTMLElement, value: string): void"), true);
  assert.equal(domUiSource.includes("if (element.style.transform !== value)"), true);
  assert.equal(domUiSource.includes("if (element.dataset.distanceBand === band)"), true);
  assert.equal(domUiSource.includes("setText(dom.playerHpText, playerHpText);"), true);
});

test("arena background is rendered inside the Phaser battle scene", () => {
  const gameScreenIndex = html.indexOf('id="gameScreen" class="game-screen battle-screen"');
  const gameFrameIndex = html.indexOf('id="game" class="game-frame"');

  assert.ok(gameScreenIndex > 0, "battle screen should exist");
  assert.ok(gameFrameIndex > gameScreenIndex, "Phaser frame should be inside the battle screen");
  assert.equal(html.includes('class="stage-bg"'), false);
  assert.equal(html.includes('src="./assets/arena/arena-bg-01.webp"'), false);
});
