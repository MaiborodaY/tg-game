import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const actionArcSource = readFileSync(resolve(currentDir, "../src/actionArc.ts"), "utf8");
const classicActionBarSource = readFileSync(resolve(currentDir, "../src/classicActionBar.ts"), "utf8");
const debugTuningSource = readFileSync(resolve(currentDir, "../src/debugTuning.ts"), "utf8");
const spellbookMenuSource = readFileSync(resolve(currentDir, "../src/spellbookMenu.ts"), "utf8");
const scrollEffectTextSource = readFileSync(resolve(currentDir, "../src/scrollEffectText.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("action arc listens to debug tuning changes directly", () => {
  assert.equal(debugTuningSource.includes('new CustomEvent("arena-debug-tuning-change")'), true);
  assert.equal(actionArcSource.includes('window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
  assert.equal(actionArcSource.includes('window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning)'), true);
});

test("debug action arc exposes a visible center marker", () => {
  assert.equal(actionArcSource.includes('className = "action-arc__center"'), true);
  assert.equal(stylesSource.includes('body.debug-active .action-arc__center'), true);
});
test("action arc renders image icons with action-specific colors", () => {
  assert.equal(actionArcSource.includes("ACTION_ICONS"), true);
  assert.equal(actionArcSource.includes("ACTION_UTILITY_ICON_URLS"), true);
  assert.equal(actionArcSource.includes('className = "action-arc__icon"'), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/move-forward.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/lunge.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/taunt.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/rest.webp"), true);
  assert.equal(actionArcSource.includes('className = attackIconUrl ? "action-arc__attack-icon" : "action-arc__image-icon"'), true);
  assert.equal(stylesSource.includes('.action-arc__button[data-action="taunt"]'), true);
  assert.equal(stylesSource.includes('.action-arc__button[data-action="back"] .action-arc__icon'), true);
  assert.equal(stylesSource.includes('linear-gradient(180deg, #4ebfff'), true);
});

test("action icons skip unchanged DOM rerenders", () => {
  const renderActionIconReferences = actionArcSource.match(/renderActionIcon\(/g) ?? [];

  assert.equal(actionArcSource.includes("const iconSignature"), true);
  assert.equal(actionArcSource.includes("button.dataset.icon === iconSignature"), true);
  assert.equal(actionArcSource.includes("button.dataset.icon = iconSignature"), true);
  assert.equal(renderActionIconReferences.length, 2);
});

test("action arc buttons keep icon-first content with compact badges", () => {
  assert.equal(actionArcSource.includes("button.append(icon);"), true);
  assert.equal(actionArcSource.includes("button.append(icon, title, detail)"), false);
  assert.match(actionArcSource, /button\.setAttribute\(\s*"aria-label"/);
  assert.match(stylesSource, /\.action-arc__button > strong,\s*\.action-arc__button > span:not\(\.action-arc__icon\)/);
  assert.equal(stylesSource.includes(".action-arc__button > span.action-arc__chance:not([hidden])"), true);
  assert.equal(stylesSource.includes(".action-arc__button > span.action-arc__cost:not([hidden])"), true);
});

test("spellbook opens as a centered framed scroll menu with live scroll details", () => {
  assert.equal(spellbookMenuSource.includes("MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL"), false);
  assert.equal(spellbookMenuSource.includes("getShopProductIconUrl([itemId])"), true);
  assert.equal(spellbookMenuSource.includes("getFighterSpellbookScrollEffectText(state.player, actionId, actions[actionId].detail)"), true);
  assert.equal(spellbookMenuSource.includes('iconFrame.className = "spellbook-menu__icon-frame";'), true);
  assert.equal(spellbookMenuSource.includes('icon.className = "spellbook-menu__icon";'), true);
  assert.equal(spellbookMenuSource.includes("hostWidth / 2 - menuWidth / 2"), true);
  assert.equal(spellbookMenuSource.includes("anchorRect"), false);
  assert.equal(scrollEffectTextSource.includes("getHeroScrollEffectText"), true);
  assert.equal(scrollEffectTextSource.includes("getFighterSpellbookScrollEffectText"), true);
  assert.equal(scrollEffectTextSource.includes("getFighterFireballDamage(fighter)"), true);
  assert.equal(scrollEffectTextSource.includes("getFighterPoisonDamage(fighter)"), true);
  assert.equal(stylesSource.includes("--spellbook-menu-frame-image"), false);
  assert.match(stylesSource, /\.spellbook-menu\s*\{[\s\S]*width: min\(286px, calc\(100% - 52px\)\);[\s\S]*max-height: min\(66vh, 430px\);/);
  assert.match(stylesSource, /\.spellbook-menu::before\s*\{[\s\S]*border: 1px solid rgba\(153, 77, 255, 0\.42\);/);
  assert.match(stylesSource, /\.spellbook-menu__item\s*\{[\s\S]*grid-template-columns: 34px minmax\(0, 1fr\) auto;/);
  assert.equal(stylesSource.includes(".spellbook-menu__icon-frame"), true);
  assert.equal(stylesSource.includes(".spellbook-menu__icon"), true);
});

test("lunge icon uses a supplied image and button gradients avoid the old glare spot", () => {
  assert.equal(actionArcSource.includes("renderActionIcon"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/lunge.webp"), true);
  assert.equal(stylesSource.includes(".action-arc__image-icon"), true);
  assert.equal(stylesSource.includes("Icon-first action buttons: softer volume"), true);
  assert.equal(stylesSource.includes("font-size: 1.82rem"), true);
});

test("leather token buttons keep icons inside a stable centered layer", () => {
  assert.equal(stylesSource.includes("Leather token action buttons"), true);
  assert.equal(stylesSource.includes("--token-ring"), true);
  assert.equal(stylesSource.includes("--token-ring-width"), true);
  assert.equal(stylesSource.includes("--token-rim-top: #4a2710"), true);
  assert.equal(stylesSource.includes("border: 4px solid var(--token-edge)"), true);
  assert.equal(stylesSource.includes("--token-face-inset"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-rotation"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-brightness"), true);
  assert.equal(stylesSource.includes("--token-rim-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-outer-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-face-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-inner-shine-opacity"), true);
  assert.equal(stylesSource.includes("--token-stripe-shine-opacity"), true);
  assert.equal(stylesSource.includes("--action-icon-scale"), true);
  assert.equal(stylesSource.includes("--action-attack-icon-scale"), true);
  assert.equal(stylesSource.includes(".action-arc__button::before"), true);
  assert.equal(stylesSource.includes(".action-arc__button::after"), true);
  assert.equal(stylesSource.includes(".action-arc__icon {"), true);
  assert.equal(stylesSource.includes("display: grid;"), true);
  assert.equal(stylesSource.includes("padding: 0;"), true);
  assert.equal(stylesSource.includes("--action-icon-size"), true);
});

test("debug tuning can scale token icons independently from the button", () => {
  assert.equal(actionArcSource.includes("export function syncActionTokenButton"), true);
  assert.equal(actionArcSource.includes("export function syncActionChanceBadge"), true);
  assert.equal(actionArcSource.includes("export function pressActionTokenButton"), true);
  assert.equal(actionArcSource.includes("ACTION_BUTTON_PRESS_MS = 140"), true);
  assert.equal(actionArcSource.includes("action-arc__button--pressed"), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-button-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-icon-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-scale"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-rotation"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--action-attack-icon-brightness"'), true);
  assert.equal(actionArcSource.includes("getAttackIconStyleTuning"), true);
  assert.equal(stylesSource.includes("scale(var(--action-icon-scale))"), true);
  assert.equal(stylesSource.includes("rotate(var(--action-attack-icon-rotation)) scale(var(--action-attack-icon-scale))"), true);
  assert.equal(stylesSource.includes("brightness(var(--action-attack-icon-brightness))"), true);
  assert.equal(stylesSource.includes(".action-arc__button.action-arc__button--pressed"), true);
  assert.equal(stylesSource.includes("scale(calc(var(--action-button-scale, 1) * 0.96))"), true);
});

test("attack buttons show hit chance badges from block chance", () => {
  assert.equal(actionArcSource.includes("getActionBlockChanceForState"), true);
  assert.equal(actionArcSource.includes("isActionTargetRestVulnerable"), true);
  assert.equal(actionArcSource.includes("getActionHitChanceLabel"), true);
  assert.equal(actionArcSource.includes("action.blockChance === undefined"), true);
  assert.equal(actionArcSource.includes("Math.round((1 - blockChance) * 100)"), true);
  assert.equal(actionArcSource.includes('badge.className = "action-arc__chance"'), true);
  assert.equal(actionArcSource.includes('badge.classList.toggle("action-arc__chance--target-vulnerable"'), true);
  assert.equal(classicActionBarSource.includes("getActionHitChanceLabel"), true);
  assert.equal(classicActionBarSource.includes("isActionTargetRestVulnerable"), true);
  assert.equal(classicActionBarSource.includes("syncClassicActionChanceBadge"), true);
  assert.equal(classicActionBarSource.includes('classic-action-bar__chance--target-vulnerable'), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_CHANCE_BADGE_SCREEN_OFFSET_Y"), true);
  assert.equal(classicActionBarSource.includes("projectPointForWheelAngle"), true);
  assert.equal(classicActionBarSource.includes('"--classic-chance-counter-rotation"'), true);
  assert.equal(stylesSource.includes(".action-arc__chance"), true);
  assert.equal(stylesSource.includes(".action-arc__chance--target-vulnerable"), true);
  assert.equal(stylesSource.includes(".action-arc__button > span.action-arc__chance:not([hidden])"), true);
  assert.equal(stylesSource.includes(".classic-action-bar .classic-action-bar__chance"), true);
  assert.equal(stylesSource.includes(".classic-action-bar .classic-action-bar__chance--target-vulnerable"), true);
  assert.equal(stylesSource.includes("rgba(104, 172, 96"), true);
  assert.equal(stylesSource.includes("rgba(42, 82, 39"), true);
});

test("action buttons show stamina cost capsules", () => {
  assert.equal(actionArcSource.includes("getActionStaminaCost"), true);
  assert.equal(actionArcSource.includes("syncActionCostBadge"), true);
  assert.equal(actionArcSource.includes("getActionCostBadge"), true);
  assert.equal(actionArcSource.includes("state.player.stamina - cost <= 0"), true);
  assert.equal(actionArcSource.includes('badge.classList.toggle("action-arc__cost--exhausts", exhausts);'), true);
  assert.equal(classicActionBarSource.includes("syncActionCostBadge"), true);
  assert.equal(stylesSource.includes(".action-arc__cost"), true);
  assert.equal(stylesSource.includes(".action-arc__cost-icon"), true);
  assert.equal(stylesSource.includes('background: url("./assets/ui/profile/stat-stamina.webp")'), true);
  assert.equal(stylesSource.includes(".action-arc__cost--exhausts"), true);
});

test("classic action bar reuses leather token rendering", () => {
  assert.equal(classicActionBarSource.includes("mountClassicActionBar"), true);
  assert.equal(classicActionBarSource.includes("pressActionTokenButton"), true);
  assert.equal(classicActionBarSource.includes("syncActionTokenButton"), true);
  assert.equal(classicActionBarSource.includes("data-classic-action-bar"), true);
  assert.equal(classicActionBarSource.includes('wheel.className = "classic-action-bar__wheel"'), true);
  assert.equal(classicActionBarSource.includes("arena-action-click"), true);
  assert.equal(classicActionBarSource.includes("canUseAction"), true);
  assert.equal(stylesSource.includes(".classic-action-bar .action-arc__button"), true);
  assert.equal(stylesSource.includes("body.arena-hud-classic .classic-action-bar"), true);
});

test("exhausted player highlights rest while other actions use disabled state", () => {
  assert.equal(actionArcSource.includes("isPlayerExhausted"), true);
  assert.equal(classicActionBarSource.includes("isPlayerExhausted"), true);
  assert.equal(actionArcSource.includes('button.classList.toggle("action-arc__button--exhausted-rest", actionId === "rest" && isPlayerExhausted(state));'), true);
  assert.equal(
    classicActionBarSource.includes(
      'button.classList.toggle("action-arc__button--exhausted-rest", isVisible && actionId === "rest" && isPlayerExhausted(state));',
    ),
    true,
  );
  assert.equal(stylesSource.includes(".action-arc__button.action-arc__button--exhausted-rest:not(:disabled)"), true);
  assert.equal(stylesSource.includes("rgba(105, 239, 255, 0.98)"), true);
});

test("classic action bar swaps semicircle wheel layouts by distance", () => {
  assert.equal(classicActionBarSource.includes("isFighterInClinchRange"), true);
  assert.equal(classicActionBarSource.includes("getFighterClinchRange"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_DISTANCE_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_CLINCH_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_BOW_DISTANCE_SLOTS"), true);
  assert.equal(classicActionBarSource.includes("classicActionButtonSlots"), true);
  assert.equal(classicActionBarSource.includes("classicWheelModeTuningKey"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--distance"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--clinch"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar--bow-distance"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_WHEEL_TURN_MS"), true);
  assert.equal(classicActionBarSource.includes("CLASSIC_WHEEL_BASE_DIAMETER = 420"), true);
  assert.equal(classicActionBarSource.includes("syncClassicWheelFitScale"), true);
  assert.equal(classicActionBarSource.includes('"--classic-wheel-fit-scale"'), true);
  assert.equal(classicActionBarSource.includes("createClassicButtonLayer"), true);
  assert.equal(classicActionBarSource.includes("projectSlotForWheelAngle"), true);
  assert.equal(classicActionBarSource.includes("const handleActionButtonClick = (actionId: ActionId, button: HTMLButtonElement): void =>"), true);
  assert.equal(classicActionBarSource.includes("const layers = [createClassicButtonLayer(handleActionButtonClick), createClassicButtonLayer(handleActionButtonClick)]"), true);
  assert.equal(classicActionBarSource.includes('button.style.setProperty("--classic-slot-x"'), true);
  assert.equal(classicActionBarSource.includes('button.style.setProperty("--classic-slot-y"'), true);
  assert.equal(stylesSource.includes(".classic-action-bar__wheel::before"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__layer"), true);
  assert.equal(stylesSource.includes("--classic-wheel-fit-scale: 1"), true);
  assert.equal(stylesSource.includes("--classic-wheel-diameter: 420px"), true);
  assert.equal(stylesSource.includes("--classic-wheel-radius: calc(var(--classic-wheel-diameter) / 2)"), true);
  assert.equal(stylesSource.includes("--classic-wheel-top-bleed: 48px"), true);
  assert.equal(stylesSource.includes("scale(var(--classic-wheel-fit-scale, 1)) scale(var(--classic-hud-scale, 1))"), true);
  assert.equal(stylesSource.includes("height: calc(var(--classic-wheel-radius) + var(--classic-wheel-top-bleed))"), true);
  assert.equal(stylesSource.includes("top: var(--classic-wheel-top-bleed)"), true);
  assert.equal(stylesSource.includes("width: 58px"), true);
  assert.equal(stylesSource.includes("border-radius: 50%"), true);
  assert.equal(stylesSource.includes('url("./assets/ui/classic-wheel/classic-wheel-skin.webp")'), true);
  assert.equal(stylesSource.includes("rotate(var(--classic-wheel-angle))"), true);
  assert.equal(stylesSource.includes(".classic-action-bar--turning .classic-action-bar__button"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__button--visible"), true);
  assert.equal(classicActionBarSource.includes("classic-action-bar__button--dimmed"), true);
  assert.equal(stylesSource.includes(".classic-action-bar__button--dimmed"), true);
});

test("classic bow distance layout keeps ranged attacks visible", () => {
  assert.equal(classicActionBarSource.includes("isRangedFighter(state.player) && !isPlayerInClinch"), true);
  assert.equal(classicActionBarSource.includes("const previewWheelMode = options.getPreviewWheelMode?.();"), true);
  assert.equal(classicActionBarSource.includes("getClassicWheelMode(state, previewWheelMode)"), true);
  assert.equal(classicActionBarSource.includes("function getClassicWheelModeFromTuningMode"), true);
  assert.equal(classicActionBarSource.includes("showUnavailableSwitchWeaponSlot"), false);
  assert.equal(classicActionBarSource.includes("return canFighterSwitchWeapon(state.player);"), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "light", x: -78'), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "medium", x: 0'), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "heavy", x: 78'), true);
  assert.equal(classicActionBarSource.includes('{ actionId: "forward", x: -40, y: -52'), false);
});

test("debug tuning can tune leather token fine details", () => {
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-ring-width"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-face-inset"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-rim-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-outer-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-face-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-inner-shine-opacity"'), true);
  assert.equal(actionArcSource.includes('button.style.setProperty("--token-stripe-shine-opacity"'), true);
});

test("attack actions render carved tally marks inside the token", () => {
  assert.equal(actionArcSource.includes("ACTION_ATTACK_ICON_URLS"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-light.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-medium.webp"), true);
  assert.equal(actionArcSource.includes("./assets/ui/action-icons/attack-heavy.webp"), true);
  assert.equal(actionArcSource.includes('"action-arc__attack-icon"'), true);
  assert.equal(actionArcSource.includes("document.createElement(\"img\")"), true);
  assert.equal(actionArcSource.includes('button.classList.toggle("action-arc__button--attack-token"'), true);
  assert.equal(stylesSource.includes(".action-arc__attack-icon"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-light.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-medium.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/attack-heavy.webp")), true);
});

test("utility actions render supplied image icons", () => {
  assert.equal(actionArcSource.includes("ACTION_UTILITY_ICON_URLS"), true);
  assert.equal(actionArcSource.includes("back: new URL(\"./assets/ui/action-icons/move-forward.webp\""), true);
  assert.equal(stylesSource.includes(".action-arc__image-icon"), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/move-forward.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/lunge.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/taunt.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/ui/action-icons/rest.webp")), true);
});
