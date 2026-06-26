import {
  getActionTitle,
  distanceBand,
  distanceLabel,
  getFighterClinchRange,
  getFighterMaxArmor,
  getFighterMaxHp,
  getFighterMaxStamina,
  getFighterDoubleStrikeHits,
  getFighterPoisonTurns,
  getFighterPreciseStrikeHits,
  getFighterWardHits,
  type CombatState,
  type DistanceBand,
} from "./combat";
import { DAMAGE_BLOCK_ICON_ASSET_URL, DAMAGE_HIT_ICON_ASSET_URL } from "./assets";
import { getShopProductIconUrl } from "./shopItemIcons";
import { applyUiLayoutTuning } from "./uiLayoutTuning";
import {
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_ITEM_CATALOG,
  HERO_MAX_LEVEL,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_WARD_SCROLL_ITEM_ID,
  getHeroEquipmentSetBonusSummary,
  getHeroXpToNextLevel,
  type HeroEquipmentSetBonusSummary,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroWeaponClass,
  type ArenaDifficultyId,
  type ArenaLootDrop,
  type BattleReward,
  type HeroState,
} from "./hero";
import {
  getEquippedShopProductStat,
  getShopProductDisplayName,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  type ShopProductStatKind,
} from "./shopPresentation";

export interface DomRefs {
  mainMenu: HTMLElement;
  gameScreen: HTMLElement;
  startButton: HTMLButtonElement;
  log: HTMLElement;
  resultBanner: HTMLElement;
  resultEyebrow: HTMLElement;
  resultTitle: HTMLElement;
  resultGoldReward: HTMLElement;
  resultXpReward: HTMLElement;
  resultLoot: HTMLElement;
  resultXpProgress: HTMLElement;
  resultXpLevel: HTMLElement;
  resultXpProgressText: HTMLElement;
  resultXpProgressFill: HTMLElement;
  restartButton: HTMLButtonElement;
  cityButton: HTMLButtonElement;
  distanceText: HTMLElement;
  classicDistanceBadge: HTMLElement;
  classicDistanceText: HTMLElement;
  classicEncounterBanner: HTMLElement;
  classicPlayerName: HTMLElement;
  classicEnemyName: HTMLElement;
  playerHpFill: HTMLElement;
  playerArmorFill: HTMLElement;
  playerStaFill: HTMLElement;
  playerHpText: HTMLElement;
  playerArmorText: HTMLElement;
  playerStaText: HTMLElement;
  classicPlayerHpFill: HTMLElement;
  classicPlayerArmorFill: HTMLElement;
  classicPlayerStaFill: HTMLElement;
  classicPlayerHpText: HTMLElement;
  classicPlayerArmorText: HTMLElement;
  classicPlayerStaText: HTMLElement;
  classicHelperName: HTMLElement;
  classicHelperAction: HTMLElement;
  classicHelperHpFill: HTMLElement;
  classicHelperArmorFill: HTMLElement;
  classicHelperStaFill: HTMLElement;
  classicHelperHpText: HTMLElement;
  classicHelperArmorText: HTMLElement;
  classicHelperStaText: HTMLElement;
  enemyHpFill: HTMLElement;
  enemyArmorFill: HTMLElement;
  enemyStaFill: HTMLElement;
  enemyHpText: HTMLElement;
  enemyArmorText: HTMLElement;
  enemyStaText: HTMLElement;
  playerWard: HTMLElement;
  playerPreciseStrike: HTMLElement;
  playerDoubleStrike: HTMLElement;
  playerPoison: HTMLElement;
  enemyWard: HTMLElement;
  enemyPreciseStrike: HTMLElement;
  enemyDoubleStrike: HTMLElement;
  enemyPoison: HTMLElement;
  classicEnemyHpFill: HTMLElement;
  classicEnemyArmorFill: HTMLElement;
  classicEnemyStaFill: HTMLElement;
  classicEnemyHpText: HTMLElement;
  classicEnemyArmorText: HTMLElement;
  classicEnemyStaText: HTMLElement;
}

export function getDomRefs(): DomRefs {
  const refs = {
    mainMenu: document.querySelector<HTMLElement>("#mainMenu"),
    gameScreen: document.querySelector<HTMLElement>("#gameScreen"),
    startButton: document.querySelector<HTMLButtonElement>("#startButton"),
    log: document.querySelector<HTMLElement>("#log"),
    resultBanner: document.querySelector<HTMLElement>("#resultBanner"),
    resultEyebrow: document.querySelector<HTMLElement>("#resultEyebrow"),
    resultTitle: document.querySelector<HTMLElement>("#resultTitle"),
    resultGoldReward: document.querySelector<HTMLElement>("#resultGoldReward"),
    resultXpReward: document.querySelector<HTMLElement>("#resultXpReward"),
    resultLoot: document.querySelector<HTMLElement>("#resultLoot"),
    resultXpProgress: document.querySelector<HTMLElement>("#resultXpProgress"),
    resultXpLevel: document.querySelector<HTMLElement>("#resultXpLevel"),
    resultXpProgressText: document.querySelector<HTMLElement>("#resultXpProgressText"),
    resultXpProgressFill: document.querySelector<HTMLElement>("#resultXpProgressFill"),
    restartButton: document.querySelector<HTMLButtonElement>("#restartButton"),
    cityButton: document.querySelector<HTMLButtonElement>("#cityButton"),
    distanceText: document.querySelector<HTMLElement>("#distanceText"),
    classicDistanceBadge: document.querySelector<HTMLElement>(".classic-distance-badge"),
    classicDistanceText: document.querySelector<HTMLElement>("#classicDistanceText"),
    classicEncounterBanner: document.querySelector<HTMLElement>("[data-classic-encounter-banner]"),
    classicPlayerName: document.querySelector<HTMLElement>("#classicPlayerName"),
    classicEnemyName: document.querySelector<HTMLElement>("#classicEnemyName"),
    playerHpFill: document.querySelector<HTMLElement>("#playerHpFill"),
    playerArmorFill: document.querySelector<HTMLElement>("#playerArmorFill"),
    playerStaFill: document.querySelector<HTMLElement>("#playerStaFill"),
    playerHpText: document.querySelector<HTMLElement>("#playerHpText"),
    playerArmorText: document.querySelector<HTMLElement>("#playerArmorText"),
    playerStaText: document.querySelector<HTMLElement>("#playerStaText"),
    classicPlayerHpFill: document.querySelector<HTMLElement>("#classicPlayerHpFill"),
    classicPlayerArmorFill: document.querySelector<HTMLElement>("#classicPlayerArmorFill"),
    classicPlayerStaFill: document.querySelector<HTMLElement>("#classicPlayerStaFill"),
    classicPlayerHpText: document.querySelector<HTMLElement>("#classicPlayerHpText"),
    classicPlayerArmorText: document.querySelector<HTMLElement>("#classicPlayerArmorText"),
    classicPlayerStaText: document.querySelector<HTMLElement>("#classicPlayerStaText"),
    classicHelperName: document.querySelector<HTMLElement>("#classicHelperName"),
    classicHelperAction: document.querySelector<HTMLElement>("#classicHelperAction"),
    classicHelperHpFill: document.querySelector<HTMLElement>("#classicHelperHpFill"),
    classicHelperArmorFill: document.querySelector<HTMLElement>("#classicHelperArmorFill"),
    classicHelperStaFill: document.querySelector<HTMLElement>("#classicHelperStaFill"),
    classicHelperHpText: document.querySelector<HTMLElement>("#classicHelperHpText"),
    classicHelperArmorText: document.querySelector<HTMLElement>("#classicHelperArmorText"),
    classicHelperStaText: document.querySelector<HTMLElement>("#classicHelperStaText"),
    enemyHpFill: document.querySelector<HTMLElement>("#enemyHpFill"),
    enemyArmorFill: document.querySelector<HTMLElement>("#enemyArmorFill"),
    enemyStaFill: document.querySelector<HTMLElement>("#enemyStaFill"),
    enemyHpText: document.querySelector<HTMLElement>("#enemyHpText"),
    enemyArmorText: document.querySelector<HTMLElement>("#enemyArmorText"),
    enemyStaText: document.querySelector<HTMLElement>("#enemyStaText"),
    playerWard: document.querySelector<HTMLElement>("#playerWard"),
    playerPreciseStrike: document.querySelector<HTMLElement>("#playerPreciseStrike"),
    playerDoubleStrike: document.querySelector<HTMLElement>("#playerDoubleStrike"),
    playerPoison: document.querySelector<HTMLElement>("#playerPoison"),
    enemyWard: document.querySelector<HTMLElement>("#enemyWard"),
    enemyPreciseStrike: document.querySelector<HTMLElement>("#enemyPreciseStrike"),
    enemyDoubleStrike: document.querySelector<HTMLElement>("#enemyDoubleStrike"),
    enemyPoison: document.querySelector<HTMLElement>("#enemyPoison"),
    classicEnemyHpFill: document.querySelector<HTMLElement>("#classicEnemyHpFill"),
    classicEnemyArmorFill: document.querySelector<HTMLElement>("#classicEnemyArmorFill"),
    classicEnemyStaFill: document.querySelector<HTMLElement>("#classicEnemyStaFill"),
    classicEnemyHpText: document.querySelector<HTMLElement>("#classicEnemyHpText"),
    classicEnemyArmorText: document.querySelector<HTMLElement>("#classicEnemyArmorText"),
    classicEnemyStaText: document.querySelector<HTMLElement>("#classicEnemyStaText"),
  };

  for (const [key, value] of Object.entries(refs)) {
    if (!value) {
      throw new Error(`Missing DOM element: ${key}`);
    }
  }

  return refs as DomRefs;
}

export interface BattleResultPresentation {
  id: string;
  reward: BattleReward;
  loot?: readonly ArenaLootDrop[];
  heroBeforeReward?: HeroState;
  heroAfterReward?: HeroState;
}

export interface BattleResultReturnState {
  ready: boolean;
  label?: string;
}

export type BattleResultPresentationStage = "loot" | "reward";

export interface DomRenderContext {
  hero?: HeroState;
  reward?: BattleReward;
  statsState?: CombatState;
  resultPresentation?: BattleResultPresentation;
  resultPresentationStage?: BattleResultPresentationStage;
  deferResultPresentation?: boolean;
  resultReturn?: BattleResultReturnState;
}

const WARD_STATUS_ICON_URL = getShopProductIconUrl([HERO_WARD_SCROLL_ITEM_ID]);
const PRECISE_STRIKE_STATUS_ICON_URL = getShopProductIconUrl([HERO_PRECISE_STRIKE_SCROLL_ITEM_ID]);
const DOUBLE_STRIKE_STATUS_ICON_URL = getShopProductIconUrl([HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID]);
const POISON_STATUS_ICON_URL = getShopProductIconUrl([HERO_POISON_SCROLL_ITEM_ID]);
type ClassicEncounterDifficulty = ArenaDifficultyId | "boss";
const CLASSIC_ENCOUNTER_DIFFICULTIES: ClassicEncounterDifficulty[] = ["easy", "medium", "hard", "boss"];
const CLASSIC_ENCOUNTER_DIFFICULTY_LABELS: Record<ClassicEncounterDifficulty, string> = {
  easy: "Easy battle",
  medium: "Medium battle",
  hard: "Hard battle",
  boss: "Boss battle",
};
const EQUIPMENT_SLOT_LABELS: Partial<Record<HeroEquipmentSlotKey, string>> = {
  helmet: "Helmet",
  breastplate: "Chest",
  backShoulderguard: "Shoulders",
  frontShoulderguard: "Shoulders",
  backWrist: "Wrists",
  frontWrist: "Wrists",
  backGlove: "Gloves",
  frontGlove: "Gloves",
  shield: "Shield",
  backGreave: "Greaves",
  frontGreave: "Greaves",
  backShinguard: "Shinguards",
  frontShinguard: "Shinguards",
  backBoot: "Boots",
  frontBoot: "Boots",
};
const WEAPON_CLASS_LABELS: Record<HeroWeaponClass, string> = {
  sword: "SWORD",
  axe: "AXE",
  bow: "BOW",
  mace: "MACE",
  spear: "SPEAR",
  shuriken: "SHURIKEN",
};

export function renderDom(dom: DomRefs, state: CombatState, context: DomRenderContext = {}): void {
  const playerClinchRange = getFighterClinchRange(state.player);
  const distance = distanceLabel(state.distance, playerClinchRange);
  const band = distanceBand(state.distance, playerClinchRange);

  setText(dom.distanceText, distance);
  setText(dom.classicDistanceText, distance);
  syncClassicDistanceBadge(dom.classicDistanceBadge, band);
  syncClassicEncounterBanner(dom.classicEncounterBanner, getClassicEncounterDifficulty(state));
  dom.gameScreen.classList.toggle("battle-screen--duo-boss", state.encounter?.mode === "duoBossAi" && Boolean(state.helper));
  renderStats(dom, context.statsState ?? state);
  renderLog(dom, state);
  renderResult(dom, state, context);
}

const CLASSIC_DISTANCE_BADGE_BANDS: DistanceBand[] = ["clinch", "melee", "near", "far", "very-far"];

function syncClassicDistanceBadge(element: HTMLElement, band: DistanceBand): void {
  if (element.dataset.distanceBand === band) {
    return;
  }

  element.dataset.distanceBand = band;

  CLASSIC_DISTANCE_BADGE_BANDS.forEach((currentBand) => {
    element.classList.toggle(`classic-distance-badge--${currentBand}`, currentBand === band);
  });
}

function getClassicEncounterDifficulty(state: CombatState): ClassicEncounterDifficulty {
  if (state.encounter?.kind === "boss") {
    return "boss";
  }

  return state.encounter?.difficultyId ?? "medium";
}

function syncClassicEncounterBanner(element: HTMLElement, difficulty: ClassicEncounterDifficulty): void {
  if (element.dataset.encounterDifficulty === difficulty) {
    return;
  }

  element.dataset.encounterDifficulty = difficulty;
  element.setAttribute("aria-label", CLASSIC_ENCOUNTER_DIFFICULTY_LABELS[difficulty]);

  CLASSIC_ENCOUNTER_DIFFICULTIES.forEach((currentDifficulty) => {
    element.classList.toggle(`classic-encounter-banner--${currentDifficulty}`, currentDifficulty === difficulty);
  });
}

function renderStats(dom: DomRefs, state: CombatState): void {
  const playerMaxHp = getFighterMaxHp(state.player);
  const playerMaxArmor = getFighterMaxArmor(state.player);
  const playerMaxStamina = getFighterMaxStamina(state.player);
  const helper = state.helper;
  const helperMaxHp = helper ? getFighterMaxHp(helper) : 1;
  const helperMaxArmor = helper ? getFighterMaxArmor(helper) : 0;
  const helperMaxStamina = helper ? getFighterMaxStamina(helper) : 1;
  const enemyMaxHp = getFighterMaxHp(state.enemy);
  const enemyMaxArmor = getFighterMaxArmor(state.enemy);
  const enemyMaxStamina = getFighterMaxStamina(state.enemy);

  const playerHpText = `${state.player.hp}/${playerMaxHp}`;
  const playerArmorText = `${state.player.armor}/${playerMaxArmor}`;
  const playerStaminaText = `${state.player.stamina}/${playerMaxStamina}`;
  const helperHpText = helper ? `${helper.hp}/${helperMaxHp}` : "0/0";
  const helperArmorText = helper ? `${helper.armor}/${helperMaxArmor}` : "0/0";
  const helperStaminaText = helper ? `${helper.stamina}/${helperMaxStamina}` : "0/0";
  const enemyHpText = `${state.enemy.hp}/${enemyMaxHp}`;
  const enemyArmorText = `${state.enemy.armor}/${enemyMaxArmor}`;
  const enemyStaminaText = `${state.enemy.stamina}/${enemyMaxStamina}`;

  setText(dom.classicPlayerName, state.player.name);
  syncHelperStats(dom, state);
  setText(dom.classicEnemyName, state.enemy.name);
  syncWardStatus(dom.playerWard, state.player.name, getFighterWardHits(state.player));
  syncPreciseStrikeStatus(dom.playerPreciseStrike, state.player.name, getFighterPreciseStrikeHits(state.player));
  syncDoubleStrikeStatus(dom.playerDoubleStrike, state.player.name, getFighterDoubleStrikeHits(state.player));
  syncPoisonStatus(dom.playerPoison, state.player.name, getFighterPoisonTurns(state.player));
  syncWardStatus(dom.enemyWard, state.enemy.name, getFighterWardHits(state.enemy));
  syncPreciseStrikeStatus(dom.enemyPreciseStrike, state.enemy.name, getFighterPreciseStrikeHits(state.enemy));
  syncDoubleStrikeStatus(dom.enemyDoubleStrike, state.enemy.name, getFighterDoubleStrikeHits(state.enemy));
  syncPoisonStatus(dom.enemyPoison, state.enemy.name, getFighterPoisonTurns(state.enemy));
  setText(dom.playerHpText, playerHpText);
  setText(dom.playerArmorText, playerArmorText);
  setText(dom.playerStaText, playerStaminaText);
  setText(dom.classicPlayerHpText, playerHpText);
  setText(dom.classicPlayerArmorText, playerArmorText);
  setText(dom.classicPlayerStaText, playerStaminaText);
  setText(dom.classicHelperHpText, helperHpText);
  setText(dom.classicHelperArmorText, helperArmorText);
  setText(dom.classicHelperStaText, helperStaminaText);
  setText(dom.enemyHpText, enemyHpText);
  setText(dom.enemyArmorText, enemyArmorText);
  setText(dom.enemyStaText, enemyStaminaText);
  setText(dom.classicEnemyHpText, enemyHpText);
  setText(dom.classicEnemyArmorText, enemyArmorText);
  setText(dom.classicEnemyStaText, enemyStaminaText);

  setFlaskFill(dom.playerHpFill, state.player.hp / playerMaxHp);
  setFlaskFill(dom.playerArmorFill, playerMaxArmor > 0 ? state.player.armor / playerMaxArmor : 0);
  setFlaskFill(dom.playerStaFill, state.player.stamina / playerMaxStamina);
  setFlaskFill(dom.enemyHpFill, state.enemy.hp / enemyMaxHp);
  setFlaskFill(dom.enemyArmorFill, enemyMaxArmor > 0 ? state.enemy.armor / enemyMaxArmor : 0);
  setFlaskFill(dom.enemyStaFill, state.enemy.stamina / enemyMaxStamina);
  setBarFill(dom.classicPlayerHpFill, state.player.hp / playerMaxHp);
  setBarFill(dom.classicPlayerArmorFill, playerMaxArmor > 0 ? state.player.armor / playerMaxArmor : 0);
  setBarFill(dom.classicPlayerStaFill, state.player.stamina / playerMaxStamina);
  setBarFill(dom.classicHelperHpFill, helper ? helper.hp / helperMaxHp : 0);
  setBarFill(dom.classicHelperArmorFill, helper && helperMaxArmor > 0 ? helper.armor / helperMaxArmor : 0);
  setBarFill(dom.classicHelperStaFill, helper ? helper.stamina / helperMaxStamina : 0);
  setBarFill(dom.classicEnemyHpFill, state.enemy.hp / enemyMaxHp);
  setBarFill(dom.classicEnemyArmorFill, enemyMaxArmor > 0 ? state.enemy.armor / enemyMaxArmor : 0);
  setBarFill(dom.classicEnemyStaFill, state.enemy.stamina / enemyMaxStamina);
}

function syncHelperStats(dom: DomRefs, state: CombatState): void {
  const helperCard = dom.classicHelperName.closest<HTMLElement>(".classic-fighter-card--helper");
  const helper = state.helper;

  if (helperCard) {
    helperCard.hidden = !helper;
    delete helperCard.dataset.helperStatus;
  }

  if (!helper) {
    setText(dom.classicHelperName, "Helper");
    setText(dom.classicHelperAction, "");
    return;
  }

  setText(dom.classicHelperName, helper.name);
  if (helper.hp <= 0) {
    if (helperCard) {
      helperCard.dataset.helperStatus = "down";
    }
    setText(dom.classicHelperAction, "Down");
    return;
  }

  if (state.lastHelperAction) {
    if (helperCard) {
      helperCard.dataset.helperStatus = "action";
    }
    setText(dom.classicHelperAction, getActionTitle(state.lastHelperAction, helper));
    return;
  }

  if (state.activeTurn === "enemy") {
    if (helperCard) {
      helperCard.dataset.helperStatus = "choosing";
    }
    setText(dom.classicHelperAction, "Choosing...");
    return;
  }

  if (helperCard) {
    helperCard.dataset.helperStatus = "ready";
  }
  setText(dom.classicHelperAction, "Ready");
}

function syncWardStatus(element: HTMLElement, fighterName: string, hits: number): void {
  const safeHits = Math.max(0, Math.floor(hits));

  syncIconCountStatus(
    element,
    safeHits,
    WARD_STATUS_ICON_URL,
    `${fighterName} shielded for ${safeHits} ${safeHits === 1 ? "hit" : "hits"}`,
  );
}

function syncPreciseStrikeStatus(element: HTMLElement, fighterName: string, hits: number): void {
  const safeHits = Math.max(0, Math.floor(hits));

  syncIconCountStatus(
    element,
    safeHits,
    PRECISE_STRIKE_STATUS_ICON_URL,
    `${fighterName} has true strike ready for ${safeHits} ${safeHits === 1 ? "hit" : "hits"}`,
  );
}

function syncDoubleStrikeStatus(element: HTMLElement, fighterName: string, hits: number): void {
  const safeHits = Math.max(0, Math.floor(hits));

  syncIconCountStatus(
    element,
    safeHits,
    DOUBLE_STRIKE_STATUS_ICON_URL,
    `${fighterName} has double strike ready for ${safeHits} ${safeHits === 1 ? "hit" : "hits"}`,
  );
}

function syncPoisonStatus(element: HTMLElement, fighterName: string, turns: number): void {
  const safeTurns = Math.max(0, Math.floor(turns));

  syncIconCountStatus(
    element,
    safeTurns,
    POISON_STATUS_ICON_URL,
    `${fighterName} poisoned for ${safeTurns} ${safeTurns === 1 ? "turn" : "turns"}`,
  );
}

function syncIconCountStatus(element: HTMLElement, count: number, iconUrl: string | undefined, ariaLabel: string): void {
  element.hidden = count <= 0;

  if (count <= 0) {
    return;
  }

  const icon = element.querySelector<HTMLImageElement>("img");
  const label = element.querySelector<HTMLElement>("span");

  if (icon && iconUrl && icon.src !== iconUrl) {
    icon.src = iconUrl;
  }

  if (label) {
    setText(label, String(count));
  }

  element.setAttribute("aria-label", ariaLabel);
}

function setFlaskFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  setStyleTransform(element, `scaleY(${safeRatio})`);
}

function setBarFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  setStyleTransform(element, `scaleX(${safeRatio})`);
}

function setText(element: HTMLElement, value: string): void {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function setStyleTransform(element: HTMLElement, value: string): void {
  if (element.style.transform !== value) {
    element.style.transform = value;
  }
}

function renderLog(dom: DomRefs, state: CombatState): void {
  dom.log.innerHTML = "";

  for (const entry of state.log) {
    const item = document.createElement("div");
    item.className = entry.important ? "log-entry important" : "log-entry";
    item.textContent = entry.text;
    dom.log.append(item);
    break;
  }
}

function renderResult(dom: DomRefs, state: CombatState, context: DomRenderContext): void {
  const isResultPresentationDeferred = state.result !== "playing" && context.deferResultPresentation;

  dom.gameScreen.classList.toggle("battle-screen--finished", state.result !== "playing" && !isResultPresentationDeferred);

  if (state.result === "playing" || isResultPresentationDeferred) {
    cancelResultAnimations();
    syncResultReturnButton(dom.cityButton);
    dom.resultBanner.hidden = true;
    dom.cityButton.hidden = true;
    dom.resultBanner.classList.remove("battle-result--animating");
    dom.resultBanner.classList.remove("battle-result--loot", "battle-result--reward-after-loot");
    delete dom.resultBanner.dataset.resultAnimationKey;
    return;
  }

  dom.resultBanner.hidden = false;
  dom.cityButton.hidden = false;
  applyUiLayoutTuning(dom.gameScreen);
  syncResultReturnButton(dom.cityButton, context.resultReturn);
  syncResultVariant(dom.resultBanner, state.result);

  const presentation = context.resultPresentation;
  const reward = presentation?.reward ?? context.reward ?? { gold: 0, xp: 0 };
  const loot = presentation?.loot ?? [];
  const finalHero = presentation?.heroAfterReward ?? context.hero;
  const presentationStage = context.resultPresentationStage ?? "reward";
  const hasPrimaryLootDrop = Boolean(getPrimaryResultLootDrop(loot));
  const shouldRenderLootStage = Boolean(presentation && presentationStage === "loot" && hasPrimaryLootDrop);
  const shouldFastRenderRewardStage = Boolean(presentation && presentationStage === "reward" && hasPrimaryLootDrop);
  const animationKey =
    `${shouldRenderLootStage ? "loot" : "reward"}:${presentation?.id ?? `static:${state.result}:${reward.gold}:${reward.xp}:${loot.map((drop) => `${drop.itemId}:${drop.quantity}`).join("|")}:${finalHero?.level ?? 0}:${finalHero?.xp ?? 0}`}`;

  if (dom.resultBanner.dataset.resultAnimationKey === animationKey) {
    return;
  }

  dom.resultBanner.dataset.resultAnimationKey = animationKey;

  if (presentation && shouldRenderLootStage) {
    renderLootDropPresentation(dom, state, presentation);
    return;
  }

  dom.resultBanner.classList.remove("battle-result--loot");
  dom.resultBanner.classList.toggle("battle-result--reward-after-loot", shouldFastRenderRewardStage);
  dom.resultEyebrow.textContent = resultEyebrowText(state);
  dom.resultTitle.textContent = resultBannerText(state);

  if (presentation) {
    animateResultPresentation(dom, presentation, Boolean(context.resultPresentationStage), shouldFastRenderRewardStage);
    return;
  }

  cancelResultAnimations();
  dom.resultBanner.classList.remove("battle-result--animating", "battle-result--reward-after-loot");
  renderRewardAmount(dom.resultGoldReward, reward.gold);
  renderRewardAmount(dom.resultXpReward, reward.xp);
  renderResultLoot(dom.resultLoot, loot);
  renderResultXpProgress(dom, finalHero);
}

const RESULT_RETURN_READY_LABEL = "Return to City";

function syncResultReturnButton(button: HTMLButtonElement, state?: BattleResultReturnState): void {
  const ready = state?.ready ?? true;

  button.disabled = !ready;
  button.textContent = state?.label ?? RESULT_RETURN_READY_LABEL;
  button.classList.toggle("battle-result__button--waiting", !ready);
  button.setAttribute("aria-busy", ready ? "false" : "true");
}

function resultBannerText(state: CombatState): string {
  if (state.result === "win") {
    return `${state.player.name} wins!`;
  }

  if (state.result === "lose") {
    return `${state.enemy.name} wins!`;
  }

  return "The arena shrugs. Draw!";
}

function resultEyebrowText(state: CombatState): string {
  if (state.result === "win") {
    return "Victory";
  }

  if (state.result === "lose") {
    return "Defeat";
  }

  return "Draw";
}

function syncResultVariant(element: HTMLElement, result: CombatState["result"]): void {
  element.classList.toggle("battle-result--win", result === "win");
  element.classList.toggle("battle-result--lose", result === "lose");
  element.classList.toggle("battle-result--draw", result === "draw");
}

function renderResultXpProgress(dom: DomRefs, hero: HeroState | undefined): void {
  if (!hero) {
    dom.resultXpProgress.hidden = true;
    dom.resultXpProgressFill.style.width = "0%";
    dom.resultXpLevel.textContent = "";
    dom.resultXpLevel.removeAttribute("data-level-digits");
    dom.resultXpProgressText.textContent = "";
    dom.resultXpProgress.removeAttribute("aria-label");
    return;
  }

  dom.resultXpProgress.hidden = false;

  if (hero.level >= HERO_MAX_LEVEL) {
    dom.resultXpProgressFill.style.width = "100%";
    renderResultXpLabel(dom, hero.level, "MAX");
    return;
  }

  const xpToNextLevel = Math.max(1, hero.xpToNextLevel);
  const progressRatio = Math.max(0, Math.min(1, hero.xp / xpToNextLevel));

  dom.resultXpProgressFill.style.width = `${progressRatio * 100}%`;
  renderResultXpLabel(dom, hero.level, `${hero.xp} / ${xpToNextLevel} XP`);
}

function renderResultXpLabel(dom: DomRefs, level: number, progressText: string): void {
  const xpSuffix = " XP";
  const usesXpIcon = progressText.endsWith(xpSuffix);
  const visibleProgressText = usesXpIcon ? progressText.slice(0, -xpSuffix.length) : progressText;
  const levelText = String(level);
  const levelDigitCount = Math.min(3, Math.max(1, levelText.length));

  dom.resultXpLevel.textContent = levelText;
  dom.resultXpLevel.dataset.levelDigits = String(levelDigitCount);
  dom.resultXpProgressText.replaceChildren(document.createTextNode(visibleProgressText));

  if (usesXpIcon) {
    const icon = document.createElement("span");

    icon.className = "battle-result__xp-progress-icon";
    icon.setAttribute("aria-hidden", "true");
    dom.resultXpProgressText.append(" ", icon);
  }

  dom.resultXpProgress.setAttribute("aria-label", `LVL ${level} ${progressText}`);
}

function animateResultPresentation(dom: DomRefs, presentation: BattleResultPresentation, hideLoot = false, fastIntro = false): void {
  const goldDelayMs = fastIntro ? 180 : 1160;
  const xpDelayMs = fastIntro ? 260 : 1300;
  const xpProgressDelayMs = fastIntro ? 440 : 1480;
  const goldDurationMs = fastIntro ? 520 : 720;
  const xpDurationMs = fastIntro ? 560 : 760;

  cancelResultAnimations();

  dom.resultBanner.classList.remove("battle-result--animating");
  void dom.resultBanner.offsetWidth;
  dom.resultBanner.classList.add("battle-result--animating");
  renderRewardAmount(dom.resultGoldReward, 0);
  renderRewardAmount(dom.resultXpReward, 0);
  renderResultLoot(dom.resultLoot, hideLoot ? [] : presentation.loot ?? []);
  renderResultXpProgress(dom, presentation.heroBeforeReward ?? presentation.heroAfterReward);

  animateResultNumber(dom.resultGoldReward, 0, presentation.reward.gold, goldDurationMs, goldDelayMs);
  animateResultNumber(dom.resultXpReward, 0, presentation.reward.xp, xpDurationMs, xpDelayMs);
  scheduleResultAnimation(xpProgressDelayMs, () => animateResultXpProgress(dom, presentation));
}

function renderLootDropPresentation(dom: DomRefs, state: CombatState, presentation: BattleResultPresentation): void {
  const drop = getPrimaryResultLootDrop(presentation.loot ?? []);

  cancelResultAnimations();
  dom.resultBanner.classList.remove("battle-result--animating");
  void dom.resultBanner.offsetWidth;
  dom.resultBanner.classList.remove("battle-result--reward-after-loot");
  dom.resultBanner.classList.add("battle-result--animating", "battle-result--loot");
  dom.resultEyebrow.textContent = state.encounter?.kind === "boss" ? "Boss Trophy" : "Dropped Item";
  dom.resultTitle.textContent = "Dropped Item";
  renderRewardAmount(dom.resultGoldReward, 0);
  renderRewardAmount(dom.resultXpReward, 0);
  renderResultXpProgress(dom, presentation.heroBeforeReward ?? presentation.heroAfterReward);
  renderResultLootDrop(dom.resultLoot, drop, presentation.heroBeforeReward);
}

function getPrimaryResultLootDrop(loot: readonly ArenaLootDrop[]): ArenaLootDrop | undefined {
  return loot.find((drop) => getArenaLootDropItemIds(drop).some((itemId) => Boolean(HERO_ITEM_CATALOG[itemId])));
}

function renderResultLoot(element: HTMLElement, loot: readonly ArenaLootDrop[]): void {
  element.replaceChildren();
  delete element.dataset.lootRarity;

  if (loot.length === 0) {
    element.hidden = true;
    return;
  }

  element.hidden = false;

  loot.forEach((drop) => {
    const itemIds = drop.itemIds && drop.itemIds.length > 0 ? drop.itemIds : [drop.itemId];
    const item = HERO_ITEM_CATALOG[drop.itemId];
    const row = document.createElement("div");
    const icon = document.createElement("span");
    const label = document.createElement("strong");
    const quantity = Math.max(1, drop.quantity);

    row.className = "battle-result__loot-item";
    icon.className = "battle-result__loot-icon";
    label.textContent = item ? `Dropped ${item.name}${quantity > 1 ? ` x${quantity}` : ""}` : `Dropped ${drop.itemId}${quantity > 1 ? ` x${quantity}` : ""}`;

    const iconUrl = getShopProductIconUrl(itemIds);

    if (iconUrl) {
      icon.style.backgroundImage = `url("${iconUrl}")`;
    } else {
      icon.textContent = "?";
    }

    row.append(icon, label);
    element.append(row);
  });
}

function renderResultLootDrop(element: HTMLElement, drop: ArenaLootDrop | undefined, heroBeforeReward: HeroState | undefined): void {
  element.replaceChildren();
  delete element.dataset.lootRarity;

  if (!drop) {
    element.hidden = true;
    return;
  }

  const itemIds = getArenaLootDropItemIds(drop);
  const item = HERO_ITEM_CATALOG[drop.itemId] ?? itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]).find(Boolean);

  if (!item) {
    renderResultLoot(element, [drop]);
    return;
  }

  const iconUrl = getShopProductIconUrl(itemIds);
  const rarity = getShopProductRarity(itemIds);
  const statKind = getLootDropStatKind(itemIds);
  const quantity = Math.max(1, drop.quantity);
  const card = document.createElement("article");
  const icon = document.createElement("span");
  const name = document.createElement("strong");
  const setBonusSummary = getHeroEquipmentSetBonusSummary(item, heroBeforeReward?.equipment);
  const chips = document.createElement("div");
  const status = document.createElement("span");

  element.hidden = false;
  card.className = "battle-result__loot-card";
  icon.className = "battle-result__loot-card-icon";
  name.className = "battle-result__loot-card-name";
  chips.className = "battle-result__loot-card-chips";
  status.className = "battle-result__loot-card-status";
  name.textContent = getShopProductDisplayName(item.name);
  status.textContent = quantity > 1 ? `Added to inventory x${quantity}` : "Added to inventory";
  card.classList.add(`battle-result__loot-card--rarity-${rarity}`);
  element.dataset.lootRarity = rarity;

  if (iconUrl) {
    icon.style.backgroundImage = `url("${iconUrl}")`;
  } else {
    icon.textContent = "?";
  }

  chips.append(createLootDropTextChip(getShopRarityLabel(rarity), "rarity"));

  const slotLabel = getLootDropSlotLabel(itemIds);

  if (slotLabel) {
    chips.append(createLootDropTextChip(slotLabel));
  }

  if (statKind) {
    chips.append(createLootDropStatChip(heroBeforeReward, itemIds, statKind));
  }

  card.append(icon, name);

  if (setBonusSummary) {
    card.append(createLootDropSetBonusBlock(setBonusSummary));
  }

  card.append(chips, status);
  element.append(card);
}

function createLootDropSetBonusBlock(summary: HeroEquipmentSetBonusSummary): HTMLElement {
  const block = document.createElement("div");
  const label = document.createElement("span");

  block.className = "battle-result__loot-card-set";
  label.className = "battle-result__loot-card-set-name";
  label.textContent = summary.label;
  block.append(label);

  summary.bonuses.forEach((bonus) => {
    const row = document.createElement("span");

    row.className = "battle-result__loot-card-set-bonus";
    row.classList.toggle("battle-result__loot-card-set-bonus--active", bonus.active);
    row.classList.toggle("battle-result__loot-card-set-bonus--inactive", !bonus.active);
    row.textContent = `(${bonus.pieces}) ${bonus.label}`;
    block.append(row);
  });

  return block;
}

function createLootDropTextChip(text: string, modifier?: string): HTMLElement {
  const chip = document.createElement("span");

  chip.className = "battle-result__loot-card-chip";
  if (modifier) {
    chip.classList.add(`battle-result__loot-card-chip--${modifier}`);
  }
  chip.textContent = text;

  return chip;
}

function createLootDropStatChip(heroBeforeReward: HeroState | undefined, itemIds: HeroItemId[], statKind: ShopProductStatKind): HTMLElement {
  const chip = document.createElement("span");
  const icon = document.createElement("img");
  const value = document.createElement("strong");
  const stat = getShopProductStat(itemIds, statKind);
  const equippedStat = heroBeforeReward ? getEquippedShopProductStat(heroBeforeReward, itemIds, statKind) : stat;
  const statLabel = statKind === "armor" ? "Armor" : "Damage";
  const statIconUrl = statKind === "armor" ? DAMAGE_BLOCK_ICON_ASSET_URL : DAMAGE_HIT_ICON_ASSET_URL;

  chip.className = "battle-result__loot-card-chip battle-result__loot-card-chip--stat";
  chip.setAttribute("aria-label", `${statLabel} ${stat}`);
  icon.className = "battle-result__loot-card-stat-icon";
  icon.src = statIconUrl;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  value.textContent = String(stat);
  value.className = "battle-result__loot-card-stat-value";
  value.classList.toggle("battle-result__loot-card-stat-value--better", stat > equippedStat);
  value.classList.toggle("battle-result__loot-card-stat-value--worse", stat < equippedStat);
  chip.append(icon, value);

  return chip;
}

function getArenaLootDropItemIds(drop: ArenaLootDrop): HeroItemId[] {
  return drop.itemIds && drop.itemIds.length > 0 ? [...drop.itemIds] : [drop.itemId];
}

function getLootDropStatKind(itemIds: readonly HeroItemId[]): ShopProductStatKind | undefined {
  if (itemIds.some((itemId) => (HERO_ITEM_CATALOG[itemId]?.armorHp ?? 0) > 0)) {
    return "armor";
  }

  if (itemIds.some((itemId) => (HERO_ITEM_CATALOG[itemId]?.damageBonus ?? 0) > 0)) {
    return "damage";
  }

  return undefined;
}

function getLootDropSlotLabel(itemIds: readonly HeroItemId[]): string {
  const item = itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]).find((candidate) => candidate && !candidate.equipmentSlot.startsWith("front"));

  if (item?.kind === "weapon" && item.weaponClass) {
    return WEAPON_CLASS_LABELS[item.weaponClass];
  }

  const slotLabel = item ? EQUIPMENT_SLOT_LABELS[item.equipmentSlot] : undefined;

  return (slotLabel ?? "Item").toUpperCase();
}

function animateResultNumber(element: HTMLElement, fromValue: number, toValue: number, durationMs: number, delayMs: number): void {
  animateValue({
    fromValue,
    toValue,
    durationMs,
    delayMs,
    onUpdate: (value) => renderRewardAmount(element, Math.round(value)),
    onComplete: () => renderRewardAmount(element, toValue),
  });
}

function animateResultXpProgress(dom: DomRefs, presentation: BattleResultPresentation): void {
  const heroAfterReward = presentation.heroAfterReward;

  if (!heroAfterReward) {
    renderResultXpProgress(dom, undefined);
    return;
  }

  const stages = createXpAnimationStages(presentation.heroBeforeReward, heroAfterReward);

  animateXpStage(dom, stages, 0, heroAfterReward);
}

interface XpAnimationStage {
  level: number;
  fromXp: number;
  toXp: number;
  xpToNextLevel: number;
}

function createXpAnimationStages(heroBeforeReward: HeroState | undefined, heroAfterReward: HeroState): XpAnimationStage[] {
  if (!heroBeforeReward) {
    return [
      {
        level: heroAfterReward.level,
        fromXp: 0,
        toXp: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : heroAfterReward.xp,
        xpToNextLevel: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : Math.max(1, heroAfterReward.xpToNextLevel),
      },
    ];
  }

  if (heroBeforeReward.level >= HERO_MAX_LEVEL && heroAfterReward.level >= HERO_MAX_LEVEL) {
    return [{ level: HERO_MAX_LEVEL, fromXp: 1, toXp: 1, xpToNextLevel: 1 }];
  }

  const stages: XpAnimationStage[] = [];
  let level = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(heroBeforeReward.level)));
  let fromXp = Math.max(0, Math.floor(heroBeforeReward.xp));
  let xpToNextLevel = Math.max(1, Math.floor(heroBeforeReward.xpToNextLevel));

  while (level < heroAfterReward.level && level < HERO_MAX_LEVEL) {
    stages.push({
      level,
      fromXp,
      toXp: xpToNextLevel,
      xpToNextLevel,
    });
    level += 1;
    fromXp = 0;
    xpToNextLevel = Math.max(1, getHeroXpToNextLevel(level));
  }

  if (heroAfterReward.level >= HERO_MAX_LEVEL) {
    stages.push({ level: HERO_MAX_LEVEL, fromXp: 1, toXp: 1, xpToNextLevel: 1 });
    return stages;
  }

  stages.push({
    level: heroAfterReward.level,
    fromXp: level === heroBeforeReward.level ? fromXp : 0,
    toXp: Math.max(0, Math.floor(heroAfterReward.xp)),
    xpToNextLevel: Math.max(1, Math.floor(heroAfterReward.xpToNextLevel)),
  });

  return stages;
}

function animateXpStage(dom: DomRefs, stages: readonly XpAnimationStage[], stageIndex: number, finalHero: HeroState): void {
  const stage = stages[stageIndex];

  if (!stage) {
    renderResultXpProgress(dom, finalHero);
    return;
  }

  animateValue({
    fromValue: stage.fromXp,
    toValue: stage.toXp,
    durationMs: 680,
    delayMs: stageIndex === 0 ? 0 : 120,
    onUpdate: (value) => renderXpStage(dom, stage, value),
    onComplete: () => {
      renderXpStage(dom, stage, stage.toXp);
      animateXpStage(dom, stages, stageIndex + 1, finalHero);
    },
  });
}

function renderXpStage(dom: DomRefs, stage: XpAnimationStage, xpValue: number): void {
  if (stage.level >= HERO_MAX_LEVEL) {
    dom.resultXpProgressFill.style.width = "100%";
    renderResultXpLabel(dom, HERO_MAX_LEVEL, "MAX");
    return;
  }

  const xp = Math.max(0, Math.min(stage.xpToNextLevel, Math.round(xpValue)));
  const progressRatio = Math.max(0, Math.min(1, xpValue / stage.xpToNextLevel));

  dom.resultXpProgressFill.style.width = `${progressRatio * 100}%`;
  renderResultXpLabel(dom, stage.level, `${xp} / ${stage.xpToNextLevel} XP`);
}

interface ValueAnimationOptions {
  fromValue: number;
  toValue: number;
  durationMs: number;
  delayMs: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

const activeResultAnimationTimers: number[] = [];
const activeResultAnimationFrames: number[] = [];

function animateValue(options: ValueAnimationOptions): void {
  const start = () => {
    const startedAt = window.performance.now();
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / options.durationMs));
      const easedProgress = easeOutCubic(progress);
      const value = options.fromValue + (options.toValue - options.fromValue) * easedProgress;

      options.onUpdate(value);

      if (progress >= 1) {
        options.onComplete?.();
        return;
      }

      activeResultAnimationFrames.push(window.requestAnimationFrame(tick));
    };

    activeResultAnimationFrames.push(window.requestAnimationFrame(tick));
  };

  scheduleResultAnimation(options.delayMs, start);
}

function scheduleResultAnimation(delayMs: number, callback: () => void): void {
  activeResultAnimationTimers.push(window.setTimeout(callback, delayMs));
}

function cancelResultAnimations(): void {
  while (activeResultAnimationTimers.length > 0) {
    const timer = activeResultAnimationTimers.pop();

    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  }

  while (activeResultAnimationFrames.length > 0) {
    const frame = activeResultAnimationFrames.pop();

    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
    }
  }
}

function renderRewardAmount(element: HTMLElement, value: number): void {
  element.textContent = value > 0 ? `+${value}` : String(value);
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
