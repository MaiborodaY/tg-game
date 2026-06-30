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
import {
  DAILY_ARENA_ENERGY_ICON_ASSET_URL,
  DAMAGE_BLOCK_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_URL,
  SHOP_CATEGORY_BODY_ICON_ASSET_URL,
  SHOP_CATEGORY_MACE_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { createEquipmentItemCardContent } from "./equipmentCardUi";
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
  isHeroXpBlockedByArenaBossGate,
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
  type ShopItemRarity,
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
  resultLevelNotice: HTMLElement;
  resultXpProgress: HTMLElement;
  resultXpLevel: HTMLElement;
  resultXpProgressText: HTMLElement;
  resultXpProgressFill: HTMLElement;
  resultUnlockPanel: HTMLElement;
  resultUnlockLevel: HTMLElement;
  resultUnlockEnergy: HTMLElement;
  resultUnlockEnergyIcon: HTMLImageElement;
  resultUnlockEnergyValue: HTMLElement;
  resultUnlockEnergyStatus: HTMLElement;
  resultUnlockTitle: HTMLElement;
  resultUnlockContent: HTMLElement;
  resultUnlockContinueButton: HTMLButtonElement;
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
  playerMaceArmorDamage: HTMLElement;
  playerStaffFireballDamage: HTMLElement;
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
    resultLevelNotice: document.querySelector<HTMLElement>("#resultLevelNotice"),
    resultXpProgress: document.querySelector<HTMLElement>("#resultXpProgress"),
    resultXpLevel: document.querySelector<HTMLElement>("#resultXpLevel"),
    resultXpProgressText: document.querySelector<HTMLElement>("#resultXpProgressText"),
    resultXpProgressFill: document.querySelector<HTMLElement>("#resultXpProgressFill"),
    resultUnlockPanel: document.querySelector<HTMLElement>("#resultUnlockPanel"),
    resultUnlockLevel: document.querySelector<HTMLElement>("#resultUnlockLevel"),
    resultUnlockEnergy: document.querySelector<HTMLElement>("#resultUnlockEnergy"),
    resultUnlockEnergyIcon: document.querySelector<HTMLImageElement>("#resultUnlockEnergyIcon"),
    resultUnlockEnergyValue: document.querySelector<HTMLElement>("#resultUnlockEnergyValue"),
    resultUnlockEnergyStatus: document.querySelector<HTMLElement>("#resultUnlockEnergyStatus"),
    resultUnlockTitle: document.querySelector<HTMLElement>("#resultUnlockTitle"),
    resultUnlockContent: document.querySelector<HTMLElement>("#resultUnlockContent"),
    resultUnlockContinueButton: document.querySelector<HTMLButtonElement>("#resultUnlockContinueButton"),
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
    playerMaceArmorDamage: document.querySelector<HTMLElement>("#playerMaceArmorDamage"),
    playerStaffFireballDamage: document.querySelector<HTMLElement>("#playerStaffFireballDamage"),
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
  levelUnlocks?: readonly BattleResultLevelUnlocks[];
  postResultUnlocks?: readonly BattleResultLevelUnlocks[];
  instant?: boolean;
}

export interface BattleResultUnlockProduct {
  id: string;
  name: string;
  itemIds: readonly HeroItemId[];
  rarity?: ShopItemRarity;
  statKind: ShopProductStatKind;
  statValue: number;
  diff: number;
  levelRequirement: number;
  price: number;
}

export interface BattleResultUnlockEnergy {
  from: number;
  to: number;
  max: number;
}

export type BattleResultFeatureUnlockKind = "magic-shop" | "magic-upgrades";

export interface BattleResultFeatureUnlock {
  kind: BattleResultFeatureUnlockKind;
  title: string;
  iconUrl: string;
  ariaLabel?: string;
}

export interface BattleResultLevelUnlocks {
  level: number;
  heading?: string;
  weapons: readonly BattleResultUnlockProduct[];
  armor: readonly BattleResultUnlockProduct[];
  features?: readonly BattleResultFeatureUnlock[];
  energy?: BattleResultUnlockEnergy;
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
  onResultSequenceLockChange?: (locked: boolean) => void;
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
  staff: "STAFF",
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
  syncMaceArmorDamageStatus(dom.playerMaceArmorDamage, state.player.name, state.player.maceArmorDamagePercentBonus ?? 0);
  syncStaffFireballDamageStatus(dom.playerStaffFireballDamage, state.player.name, state.player.staffFireballDamageBonus ?? 0);
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

function syncMaceArmorDamageStatus(element: HTMLElement, fighterName: string, percentBonus: number): void {
  const safePercentBonus = Math.max(0, percentBonus);
  element.hidden = safePercentBonus <= 0;

  if (safePercentBonus <= 0) {
    return;
  }

  const icon = element.querySelector<HTMLImageElement>("img");
  const percentLabel = Math.round(safePercentBonus * 100);

  if (icon && icon.src !== SHOP_CATEGORY_MACE_ICON_ASSET_URL) {
    icon.src = SHOP_CATEGORY_MACE_ICON_ASSET_URL;
  }

  element.setAttribute("aria-label", `${fighterName} mace armor damage +${percentLabel}%`);
  element.title = `Mace armor damage +${percentLabel}%`;
}

function syncStaffFireballDamageStatus(element: HTMLElement, fighterName: string, damageBonus: number): void {
  const safeDamageBonus = Math.max(0, Math.floor(damageBonus));
  element.hidden = safeDamageBonus <= 0;

  if (safeDamageBonus <= 0) {
    return;
  }

  const icon = element.querySelector<HTMLImageElement>("img");

  if (icon && icon.src !== SHOP_CATEGORY_BODY_ICON_ASSET_URL) {
    icon.src = SHOP_CATEGORY_BODY_ICON_ASSET_URL;
  }

  element.setAttribute("aria-label", `${fighterName} staff fireball base damage +${safeDamageBonus}`);
  element.title = `Staff fireball base damage +${safeDamageBonus}`;
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
    resetResultLevelUpUi(dom);
    context.onResultSequenceLockChange?.(false);
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
    animateResultPresentation(dom, presentation, context, Boolean(context.resultPresentationStage), shouldFastRenderRewardStage || presentation.instant === true);
    return;
  }

  cancelResultAnimations();
  resetResultLevelUpUi(dom);
  context.onResultSequenceLockChange?.(false);
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
  renderResultXpLabel(
    dom,
    hero.level,
    isHeroXpBlockedByArenaBossGate(hero) ? "DEFEAT BOSS TO UNLOCK" : `${hero.xp} / ${xpToNextLevel} XP`,
  );
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

function animateResultPresentation(
  dom: DomRefs,
  presentation: BattleResultPresentation,
  context: DomRenderContext,
  hideLoot = false,
  fastIntro = false,
): void {
  const goldDelayMs = fastIntro ? 180 : 1160;
  const xpDelayMs = fastIntro ? 260 : 1300;
  const xpProgressDelayMs = fastIntro ? 440 : 1480;
  const goldDurationMs = fastIntro ? 520 : 720;
  const xpDurationMs = fastIntro ? 560 : 760;

  cancelResultAnimations();
  resetResultLevelUpUi(dom);
  context.onResultSequenceLockChange?.(false);

  dom.resultBanner.classList.remove("battle-result--animating");
  void dom.resultBanner.offsetWidth;
  dom.resultBanner.classList.add("battle-result--animating");
  renderRewardAmount(dom.resultGoldReward, 0);
  renderRewardAmount(dom.resultXpReward, 0);
  renderResultLoot(dom.resultLoot, hideLoot ? [] : presentation.loot ?? []);
  renderResultXpProgress(dom, presentation.heroBeforeReward ?? presentation.heroAfterReward);

  animateResultNumber(dom.resultGoldReward, 0, presentation.reward.gold, goldDurationMs, goldDelayMs);
  animateResultNumber(dom.resultXpReward, 0, presentation.reward.xp, xpDurationMs, xpDelayMs);
  scheduleResultAnimation(xpProgressDelayMs, () => animateResultXpProgress(dom, presentation, context));
}

function renderLootDropPresentation(dom: DomRefs, state: CombatState, presentation: BattleResultPresentation): void {
  const drop = getPrimaryResultLootDrop(presentation.loot ?? []);

  cancelResultAnimations();
  resetResultLevelUpUi(dom);
  dom.resultBanner.classList.remove("battle-result--animating");
  void dom.resultBanner.offsetWidth;
  dom.resultBanner.classList.remove("battle-result--reward-after-loot");
  dom.resultBanner.classList.add("battle-result--animating", "battle-result--loot");
  dom.resultEyebrow.textContent = state.encounter?.kind === "boss" ? "Boss Trophy" : "Dropped Item";
  dom.resultTitle.textContent = "";
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

function animateResultXpProgress(dom: DomRefs, presentation: BattleResultPresentation, context: DomRenderContext): void {
  const heroAfterReward = presentation.heroAfterReward;

  if (!heroAfterReward) {
    renderResultXpProgress(dom, undefined);
    context.onResultSequenceLockChange?.(false);
    return;
  }

  const stages = createXpAnimationStages(presentation.heroBeforeReward, heroAfterReward);

  context.onResultSequenceLockChange?.(hasBattleResultUnlocks(presentation));
  animateXpStage(dom, presentation, context, stages, 0, heroAfterReward);
}

interface XpAnimationStage {
  level: number;
  fromXp: number;
  toXp: number;
  xpToNextLevel: number;
  bossGateLocked?: boolean;
}

function createXpAnimationStages(heroBeforeReward: HeroState | undefined, heroAfterReward: HeroState): XpAnimationStage[] {
  if (!heroBeforeReward) {
    return [
      {
        level: heroAfterReward.level,
        fromXp: 0,
        toXp: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : heroAfterReward.xp,
        xpToNextLevel: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : Math.max(1, heroAfterReward.xpToNextLevel),
        bossGateLocked: isHeroXpBlockedByArenaBossGate(heroAfterReward),
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
    bossGateLocked: isHeroXpBlockedByArenaBossGate(heroAfterReward),
  });

  return stages;
}

function animateXpStage(
  dom: DomRefs,
  presentation: BattleResultPresentation,
  context: DomRenderContext,
  stages: readonly XpAnimationStage[],
  stageIndex: number,
  finalHero: HeroState,
): void {
  const stage = stages[stageIndex];

  if (!stage) {
    renderResultXpProgress(dom, finalHero);
    resetResultLevelUpUi(dom);
    if (hasBattleResultPostUnlocks(presentation)) {
      renderPostResultUnlockPanels(dom, presentation.postResultUnlocks ?? [], 0, () => {
        context.onResultSequenceLockChange?.(false);
      });
      return;
    }

    context.onResultSequenceLockChange?.(false);
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
      const reachedLevel = getReachedLevelAfterXpStage(stages, stageIndex, finalHero);

      if (!reachedLevel) {
        animateXpStage(dom, presentation, context, stages, stageIndex + 1, finalHero);
        return;
      }

      const unlocks = getBattleResultLevelUnlocks(presentation, reachedLevel);

      showResultLevelNotice(dom, reachedLevel);

      if (!unlocks || !hasBattleResultLevelUnlockPayload(unlocks)) {
        scheduleResultAnimation(700, () => {
          if (dom.resultLevelNotice.dataset.level === String(reachedLevel)) {
            hideResultLevelNotice(dom);
          }
        });
        animateXpStage(dom, presentation, context, stages, stageIndex + 1, finalHero);
        return;
      }

      scheduleResultAnimation(560, () => {
        renderResultUnlockPanel(dom, unlocks, () => {
          hideResultUnlockPanel(dom);
          hideResultLevelNotice(dom);
          animateXpStage(dom, presentation, context, stages, stageIndex + 1, finalHero);
        });
      });
    },
  });
}

function getReachedLevelAfterXpStage(stages: readonly XpAnimationStage[], stageIndex: number, finalHero: HeroState): number | undefined {
  const stage = stages[stageIndex];
  const nextStage = stages[stageIndex + 1];

  if (!stage || !nextStage || stage.level >= finalHero.level || stage.level >= HERO_MAX_LEVEL) {
    return undefined;
  }

  return Math.min(HERO_MAX_LEVEL, stage.level + 1);
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
  renderResultXpLabel(
    dom,
    stage.level,
    stage.bossGateLocked && xp >= stage.xpToNextLevel ? "DEFEAT BOSS TO UNLOCK" : `${xp} / ${stage.xpToNextLevel} XP`,
  );
}

function resetResultLevelUpUi(dom: DomRefs): void {
  hideResultUnlockPanel(dom);
  hideResultLevelNotice(dom);
}

function showResultLevelNotice(dom: DomRefs, level: number): void {
  dom.resultLevelNotice.textContent = "NEW LVL!";
  dom.resultLevelNotice.hidden = false;
  dom.resultLevelNotice.dataset.level = String(level);
  dom.resultXpProgress.classList.remove("battle-result__xp--level-up");
  void dom.resultXpProgress.offsetWidth;
  dom.resultXpProgress.classList.add("battle-result__xp--level-up");
}

function hideResultLevelNotice(dom: DomRefs): void {
  dom.resultLevelNotice.hidden = true;
  dom.resultLevelNotice.removeAttribute("data-level");
  dom.resultXpProgress.classList.remove("battle-result__xp--level-up");
}

function getBattleResultLevelUnlocks(presentation: BattleResultPresentation, level: number): BattleResultLevelUnlocks | undefined {
  return presentation.levelUnlocks?.find((unlocks) => unlocks.level === level);
}

function hasBattleResultUnlocks(presentation: BattleResultPresentation): boolean {
  return hasBattleResultLevelUnlocks(presentation) || hasBattleResultPostUnlocks(presentation);
}

function hasBattleResultLevelUnlocks(presentation: BattleResultPresentation): boolean {
  return Boolean(presentation.levelUnlocks?.some(hasBattleResultLevelUnlockPayload));
}

function hasBattleResultPostUnlocks(presentation: BattleResultPresentation): boolean {
  return Boolean(presentation.postResultUnlocks?.some(hasBattleResultLevelUnlockPayload));
}

function hasBattleResultLevelUnlockPayload(unlocks: BattleResultLevelUnlocks): boolean {
  return Boolean(unlocks.features?.length) || unlocks.weapons.length > 0 || unlocks.armor.length > 0;
}

function renderPostResultUnlockPanels(
  dom: DomRefs,
  unlocks: readonly BattleResultLevelUnlocks[],
  unlockIndex: number,
  onComplete: () => void,
): void {
  const unlock = unlocks[unlockIndex];

  if (!unlock) {
    onComplete();
    return;
  }

  if (!hasBattleResultLevelUnlockPayload(unlock)) {
    renderPostResultUnlockPanels(dom, unlocks, unlockIndex + 1, onComplete);
    return;
  }

  renderResultUnlockPanel(dom, unlock, () => {
    hideResultUnlockPanel(dom);
    renderPostResultUnlockPanels(dom, unlocks, unlockIndex + 1, onComplete);
  });
}

type BattleResultUnlockScreen =
  | {
      kind: "feature";
      feature: BattleResultFeatureUnlock;
    }
  | {
      kind: "items";
      weapons: readonly BattleResultUnlockProduct[];
      armor: readonly BattleResultUnlockProduct[];
    };

function renderResultUnlockPanel(dom: DomRefs, unlocks: BattleResultLevelUnlocks, onContinue: () => void): void {
  const screens = createResultUnlockScreens(unlocks);

  if (screens.length <= 0) {
    onContinue();
    return;
  }

  hideResultLevelNotice(dom);
  dom.resultUnlockPanel.hidden = false;
  dom.resultUnlockLevel.textContent = unlocks.heading ?? `LVL ${unlocks.level} REACHED`;
  dom.resultUnlockEnergyIcon.src = DAILY_ARENA_ENERGY_ICON_ASSET_URL;
  renderResultUnlockScreen(dom, unlocks, screens, 0, onContinue, true);
}

function renderResultUnlockScreen(
  dom: DomRefs,
  unlocks: BattleResultLevelUnlocks,
  screens: readonly BattleResultUnlockScreen[],
  screenIndex: number,
  onComplete: () => void,
  animateEnergy: boolean,
): void {
  const screen = screens[screenIndex];

  if (!screen) {
    onComplete();
    return;
  }

  const products = getResultUnlockScreenProducts(screen);
  const isCompact = screen.kind === "feature" || products.length <= 4;

  dom.resultUnlockPanel.dataset.unlockCount = String(screen.kind === "feature" ? 1 : products.length);
  dom.resultUnlockPanel.dataset.unlockDensity = isCompact ? "compact" : "list";
  dom.resultUnlockPanel.dataset.unlockScreen = screen.kind;
  dom.resultUnlockTitle.textContent = getResultUnlockScreenTitle(screen);
  renderResultUnlockEnergyValue(dom, unlocks.energy?.from ?? unlocks.energy?.to ?? 0, unlocks.energy?.max ?? 0);
  dom.resultUnlockEnergy.hidden = true;
  dom.resultUnlockEnergyStatus.hidden = true;
  dom.resultUnlockTitle.hidden = true;
  dom.resultUnlockContent.hidden = true;
  dom.resultUnlockContent.replaceChildren();
  dom.resultUnlockContinueButton.hidden = true;
  dom.resultUnlockContinueButton.onclick = () => {
    if (screenIndex + 1 < screens.length) {
      renderResultUnlockScreen(dom, unlocks, screens, screenIndex + 1, onComplete, false);
      return;
    }

    onComplete();
  };

  const revealPayload = () => {
    scheduleResultAnimation(220, () => {
      dom.resultUnlockContent.replaceChildren(...createResultUnlockScreenElements(screen));
      dom.resultUnlockTitle.hidden = false;
      dom.resultUnlockContent.hidden = false;
      dom.resultUnlockContinueButton.hidden = false;
    });
  };

  if (!unlocks.energy) {
    revealPayload();
    return;
  }

  if (!animateEnergy) {
    renderResultUnlockEnergyValue(dom, unlocks.energy.to, unlocks.energy.max);
    dom.resultUnlockEnergy.hidden = false;
    dom.resultUnlockEnergyStatus.hidden = false;
    revealPayload();
    return;
  }

  scheduleResultAnimation(300, () => {
    dom.resultUnlockEnergy.hidden = false;
    animateResultUnlockEnergy(dom, unlocks.energy, () => {
      dom.resultUnlockEnergyStatus.hidden = false;
      revealPayload();
    });
  });
}

function hideResultUnlockPanel(dom: DomRefs): void {
  dom.resultUnlockPanel.hidden = true;
  dom.resultUnlockPanel.removeAttribute("data-unlock-count");
  dom.resultUnlockPanel.removeAttribute("data-unlock-density");
  dom.resultUnlockPanel.removeAttribute("data-unlock-screen");
  dom.resultUnlockEnergy.hidden = true;
  dom.resultUnlockEnergyStatus.hidden = true;
  dom.resultUnlockTitle.hidden = true;
  dom.resultUnlockContent.hidden = false;
  dom.resultUnlockContent.replaceChildren();
  dom.resultUnlockContinueButton.hidden = false;
  dom.resultUnlockContinueButton.onclick = null;
}

function animateResultUnlockEnergy(
  dom: DomRefs,
  energy: BattleResultUnlockEnergy | undefined,
  onComplete: () => void,
): void {
  if (!energy) {
    onComplete();
    return;
  }

  const from = Math.max(0, Math.min(energy.max, Math.floor(energy.from)));
  const to = Math.max(0, Math.min(energy.max, Math.floor(energy.to)));

  renderResultUnlockEnergyValue(dom, from, energy.max);

  if (from >= to) {
    renderResultUnlockEnergyValue(dom, to, energy.max);
    scheduleResultAnimation(120, onComplete);
    return;
  }

  animateValue({
    fromValue: from,
    toValue: to,
    durationMs: 620,
    delayMs: 0,
    onUpdate: (value) => renderResultUnlockEnergyValue(dom, Math.round(value), energy.max),
    onComplete: () => {
      renderResultUnlockEnergyValue(dom, to, energy.max);
      onComplete();
    },
  });
}

function renderResultUnlockEnergyValue(dom: DomRefs, current: number, max: number): void {
  const safeMax = Math.max(0, Math.floor(max));
  const safeCurrent = Math.max(0, Math.min(safeMax, Math.floor(current)));

  dom.resultUnlockEnergyValue.textContent = `${safeCurrent}/${safeMax}`;
  dom.resultUnlockEnergy.setAttribute("aria-label", `Arena energy ${safeCurrent} of ${safeMax}, energy restored`);
}

const RESULT_UNLOCK_CASCADE_DELAY_MS = 500;

function createResultUnlockScreens(unlocks: BattleResultLevelUnlocks): BattleResultUnlockScreen[] {
  const screens: BattleResultUnlockScreen[] = [];

  for (const feature of unlocks.features ?? []) {
    screens.push({ kind: "feature", feature });
  }

  if (unlocks.weapons.length > 0 || unlocks.armor.length > 0) {
    screens.push({ kind: "items", weapons: unlocks.weapons, armor: unlocks.armor });
  }

  return screens;
}

function getResultUnlockScreenProducts(screen: BattleResultUnlockScreen): readonly BattleResultUnlockProduct[] {
  return screen.kind === "items" ? [...screen.weapons, ...screen.armor] : [];
}

function getResultUnlockScreenTitle(screen: BattleResultUnlockScreen): string {
  return screen.kind === "feature" ? screen.feature.title : "NEW SHOP UNLOCKS";
}

function createResultUnlockScreenElements(screen: BattleResultUnlockScreen): HTMLElement[] {
  if (screen.kind === "feature") {
    return [createResultUnlockFeatureIcon(screen.feature)];
  }

  return createResultUnlockItemElements(screen.weapons, screen.armor);
}

function createResultUnlockFeatureIcon(feature: BattleResultFeatureUnlock): HTMLElement {
  const icon = document.createElement("img");

  icon.className = `battle-result__unlock-feature-icon battle-result__unlock-feature-icon--${feature.kind}`;
  icon.src = feature.iconUrl;
  icon.alt = feature.ariaLabel ?? feature.title;
  icon.decoding = "async";
  icon.draggable = false;
  return icon;
}

function createResultUnlockItemElements(
  weapons: readonly BattleResultUnlockProduct[],
  armor: readonly BattleResultUnlockProduct[],
): HTMLElement[] {
  const elements: HTMLElement[] = [];
  let cascadeIndex = 0;

  if (weapons.length > 0) {
    cascadeIndex = appendResultUnlockGroupElements(elements, "WEAPONS", "weapons", weapons, cascadeIndex);
  }

  if (armor.length > 0) {
    cascadeIndex = appendResultUnlockGroupElements(elements, "ARMOR", "armor", armor, cascadeIndex);
  }

  return elements;
}

function appendResultUnlockGroupElements(
  elements: HTMLElement[],
  title: string,
  kind: "armor" | "weapons",
  products: readonly BattleResultUnlockProduct[],
  cascadeIndex: number,
): number {
  const heading = document.createElement("strong");
  const sortedProducts = getResultUnlockPreviewProducts(products, kind);
  const collapsedCount = Math.min(3, sortedProducts.length);
  let nextCascadeIndex = cascadeIndex;

  heading.className = "battle-result__unlock-section-title";
  setResultUnlockCascadeDelay(heading, nextCascadeIndex);
  heading.textContent = title;
  elements.push(heading);
  nextCascadeIndex += 1;

  const cards = sortedProducts.map((product, index) => {
    const isExtra = index >= collapsedCount;
    const card = createResultUnlockCard(product, isExtra ? 0 : nextCascadeIndex);

    if (isExtra) {
      card.hidden = true;
      return card;
    }

    nextCascadeIndex += 1;
    return card;
  });
  const extraCards = cards.slice(collapsedCount);

  elements.push(...cards);

  if (extraCards.length > 0) {
    const more = document.createElement("button");
    const moreLabel = `and ${extraCards.length} more`;

    more.className = "battle-result__unlock-more";
    more.type = "button";
    more.textContent = moreLabel;
    more.setAttribute("aria-expanded", "false");
    setResultUnlockCascadeDelay(more, nextCascadeIndex);
    more.addEventListener("click", () => {
      const expanded = more.getAttribute("aria-expanded") !== "true";

      extraCards.forEach((card) => {
        card.hidden = !expanded;
      });
      more.textContent = expanded ? "show less" : moreLabel;
      more.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    elements.push(more);
    nextCascadeIndex += 1;
  }

  return nextCascadeIndex;
}

function createResultUnlockCard(product: BattleResultUnlockProduct, cascadeIndex: number): HTMLElement {
  const card = document.createElement("span");
  const rarity = product.rarity ?? getShopProductRarity([...product.itemIds]);
  const iconUrl = getShopProductIconUrl(product.itemIds);
  const displayName = getShopProductDisplayName(product.name);

  card.className = `equipment-item-card battle-result__unlock-card armory-shop__option--rarity-${rarity}`;
  setResultUnlockCascadeDelay(card, cascadeIndex);
  card.setAttribute(
    "aria-label",
    `${displayName}, ${getShopRarityLabel(rarity)}, ${product.statValue} ${product.statKind}, unlocked at level ${product.levelRequirement}`,
  );
  card.append(
    createEquipmentItemCardContent({
      iconUrl,
      iconFallback: "?",
      name: displayName,
      rarityLabel: getShopRarityLabel(rarity),
      statIconUrl: product.statKind === "damage" ? DAMAGE_HIT_ICON_ASSET_URL : DAMAGE_BLOCK_ICON_ASSET_URL,
      statLabel: product.statKind,
      statValue: product.statValue,
      diff: product.diff,
      action: {
        kind: "price",
        iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL,
        value: product.price,
      },
    }),
  );

  return card;
}

function setResultUnlockCascadeDelay(element: HTMLElement, cascadeIndex: number): void {
  element.style.setProperty("--battle-result-unlock-delay", `${Math.max(0, cascadeIndex) * RESULT_UNLOCK_CASCADE_DELAY_MS}ms`);
}

function getResultUnlockPreviewProducts(
  products: readonly BattleResultUnlockProduct[],
  kind: "armor" | "weapons",
): BattleResultUnlockProduct[] {
  return [...products].sort((left, right) => {
    const priorityDiff = getResultUnlockProductPriority(left, kind) - getResultUnlockProductPriority(right, kind);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.name.localeCompare(right.name);
  });
}

function getResultUnlockProductPriority(product: BattleResultUnlockProduct, kind: "armor" | "weapons"): number {
  const key = `${product.id} ${product.name} ${product.itemIds.join(" ")}`.toLowerCase();
  const priorities =
    kind === "armor"
      ? [
          ["helmet", "helm", "head"],
          ["breastplate", "chest", "body"],
          ["shoulder"],
          ["glove", "wrist", "arms"],
          ["greave", "shinguard", "leg"],
          ["shield"],
        ]
      : [
          ["sword"],
          ["axe"],
          ["mace"],
          ["spear"],
          ["bow"],
          ["shuriken"],
        ];

  const index = priorities.findIndex((aliases) => aliases.some((alias) => key.includes(alias)));

  return index >= 0 ? index : priorities.length;
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
