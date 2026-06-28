import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountHeroPortraitPreview,
  prewarmArenaAssetsForBrowserCache,
  prewarmCityAssetsForBrowserCache,
  setPlayerBodyScaleBonus,
  setPlayerAppearance,
  setPlayerEquipment,
  setPlayerWeaponEnchantments,
  type ArenaScene,
  type CitySceneApi,
  type HeroPortraitPreviewApi,
} from "./ArenaScene";
import { mountArmoryShop, pairGeneratedArmoryProducts, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import {
  getCityEquipmentCategoryIdForHeroItemId,
  getCityHeroWidgetRefs,
  mountCityHeroAttributeControls,
  mountCityHeroEquipmentMenu,
  mountCityHeroAppearanceMenu,
  mountCityHeroProfile,
  renderCityArenaEnergyBadge,
  renderCityHeroInfo,
  syncCityHeroWidgetPosition,
  type CityEquipmentCategoryId,
  type CityHeroEquipmentMenuApi,
} from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { isDuoBossAiCombat, resolveAutoCombat, resolveAutoPlayerTurn, resolveDuoBossHelperTurn, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatActor, type CombatState } from "./combat";
import {
  getArenaBackgroundVariantIdsForTier,
  getArenaMenuBackgroundAssetUrlForTier,
  DAILY_ARENA_ENERGY_ICON_ASSET_URL,
  pickArenaBackgroundVariantIdForTier,
  SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
  SHOP_UPGRADE_ARROW_ICON_ASSET_URL,
  SHOP_XP_ICON_ASSET_URL,
} from "./assets";
import { debugTuning } from "./debugTuning";
import {
  getDomRefs,
  renderDom,
  type BattleResultFeatureUnlock,
  type BattleResultLevelUnlocks,
  type BattleResultPresentation,
  type BattleResultPresentationStage,
  type BattleResultUnlockProduct,
} from "./domUi";
import {
  canUseGladiatorCloudSave,
  deleteGladiatorCloudSave,
  GladiatorSaveError,
  loadGladiatorCloudSave,
  saveGladiatorCloudHero,
  spendGladiatorArenaEnergy,
} from "./gladiatorSaveClient";
import {
  HERO_ITEM_CATALOG,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
  DEFAULT_HERO_NAME,
  HERO_SCROLL_CAPACITY_BASE,
  HERO_SCROLL_CAPACITY_MAX,
  HERO_SCROLL_UPGRADE_RARITIES,
  allocateHeroSkillPoints,
  applyCombatReward,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
  claimHeroArenaWinQuestReward,
  createArenaBossEncounter,
  createArenaRandomEnemyEncounter,
  createCombatStateFromHero,
  createDuoBossCombatStateFromHero,
  createDefaultHero,
  createHeroPreviewEquipment,
  deriveHeroStats,
  grantHeroGold,
  grantHeroLevels,
  getArenaBossesForTier,
  getArenaRandomOpponentsForTier,
  getArenaTierDefinition,
  getArenaTierDefinitions,
  getBattleReward,
  getHeroArenaEnergy,
  getHeroArenaWinQuestStatus,
  getHeroScrollCapacityUpgradeUnlockBossTier,
  getHeroScrollUpgradeUnlockBossTier,
  grantHeroArenaEnergy,
  hasHeroArenaBossVictoryForTier,
  hasHeroDefeatedArenaBoss,
  isHeroConsumableItem,
  isHeroEquipmentPreviewItem,
  markHeroArenaWinQuestOpened,
  resetHeroArenaBossVictoryLedger,
  restoreHeroArenaEnergy,
  sharpenHeroActiveWeapon,
  spendHeroArenaEnergy,
  unequipHeroItems,
  unlockAllArenaBossTiers,
  unlockAllHeroShopRarities,
  updateHeroAppearance,
  upgradeHeroBowShotCapacity,
  upgradeHeroScroll,
  upgradeHeroScrollCapacity,
  type ArenaBossDefinition,
  type ArenaBossId,
  type ArenaDifficultyId,
  type ArenaEncounter,
  type ArenaTierDefinition,
  type HeroAppearance,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
  type HeroAttributeKey,
  type HeroArenaWinQuestStatus,
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { GENERATED_ARMORY_PRODUCTS, GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { clearLocalHeroSave, loadLocalHeroSave, saveLocalHeroSave } from "./localHeroSave";
import { mountMagicShop, type MagicProduct, type MagicShopApi } from "./magicShopUi";
import { cancelPvpRoom, connectPvpRoom, createDuoBossRoom, createPvpRoom, getCurrentPvpRoom, joinPvpRoom, listPvpRooms, type PvpConnection } from "./pvpClient";
import { getPvpActorForSeat, type PvpRoomKind, type PvpRoomListEntry, type PvpRoomResponse, type PvpRoomSession, type PvpRoomSnapshot, type PvpServerMessage } from "./pvpProtocol";
import { mountSettingsMenu } from "./settingsMenu";
import { prewarmShopProductIcons } from "./shopItemIcons";
import {
  getEquippedShopProductDisplayStat,
  getEquippedShopProductStat,
  getShopProductDisplayName,
  getShopProductDisplayStat,
  getShopProductLevelRequirement,
  getShopProductRarity,
  getShopProductStat,
  isShopProductSealed,
  type ShopProductStatKind,
} from "./shopPresentation";
import { bootTelegramWebApp, getTelegramDisplayName, getTelegramUserId } from "./telegram";
import { logTurnProbe, mountTurnProbe, shouldMountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

bootTelegramWebApp();

const dom = getDomRefs();
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const cityTimeToggle = document.querySelector<HTMLButtonElement>("#cityTimeToggle");
const cityArenaMenu = document.querySelector<HTMLElement>("#cityArenaMenu");
const cityArenaCloseButton = document.querySelector<HTMLButtonElement>("#cityArenaCloseButton");
const cityArenaMainView = document.querySelector<HTMLElement>("#cityArenaMainView");
const cityArenaOnlinePanel = document.querySelector<HTMLElement>("#cityArenaOnlinePanel");
const cityArenaOnlineButton = document.querySelector<HTMLButtonElement>("#cityArenaOnlineButton");
const cityArenaOnlineBackButton = document.querySelector<HTMLButtonElement>("#cityArenaOnlineBackButton");
const cityArenaTierName = document.querySelector<HTMLElement>("#cityArenaTierName");
const cityArenaTierSelect = document.querySelector<HTMLSelectElement>("#cityArenaTierSelect");
const cityArenaEnergy = document.querySelector<HTMLElement>("#cityArenaEnergy");
const cityArenaMetaRow = cityArenaEnergy?.closest<HTMLElement>(".city-arena-menu__meta-row") ?? null;
const cityArenaQuestButton = document.querySelector<HTMLButtonElement>("#cityArenaQuestButton");
const cityArenaQuestLabel = document.querySelector<HTMLElement>("#cityArenaQuestLabel");
const cityArenaQuestProgress = document.querySelector<HTMLElement>("#cityArenaQuestProgress");
const cityArenaQuestBackdrop = document.querySelector<HTMLButtonElement>("#cityArenaQuestBackdrop");
const cityArenaQuestPanel = document.querySelector<HTMLElement>("#cityArenaQuestPanel");
const cityArenaQuestCloseButton = document.querySelector<HTMLButtonElement>("#cityArenaQuestCloseButton");
const cityArenaQuestStatus = document.querySelector<HTMLElement>("#cityArenaQuestStatus");
const cityArenaQuestText = document.querySelector<HTMLElement>("#cityArenaQuestText");
const cityArenaQuestRewards = document.querySelector<HTMLElement>("#cityArenaQuestRewards");
const cityArenaQuestClaimButton = document.querySelector<HTMLButtonElement>("#cityArenaQuestClaimButton");
const cityArenaEasyReward = document.querySelector<HTMLElement>("#cityArenaEasyReward");
const cityArenaEasyButton = document.querySelector<HTMLButtonElement>("#cityArenaEasyButton");
const cityArenaEasyName = cityArenaEasyButton?.querySelector<HTMLElement>("strong");
const cityArenaEasyAutoButton = document.querySelector<HTMLButtonElement>("#cityArenaEasyAutoButton");
const cityArenaEasyAutoRate = document.querySelector<HTMLElement>("#cityArenaEasyAutoRate");
const cityArenaRandomReward = document.querySelector<HTMLElement>("#cityArenaRandomReward");
const cityArenaRandomButton = document.querySelector<HTMLButtonElement>("#cityArenaRandomButton");
const cityArenaRandomName = cityArenaRandomButton?.querySelector<HTMLElement>("strong");
const cityArenaRandomAutoButton = document.querySelector<HTMLButtonElement>("#cityArenaRandomAutoButton");
const cityArenaRandomAutoRate = document.querySelector<HTMLElement>("#cityArenaRandomAutoRate");
const cityArenaHardReward = document.querySelector<HTMLElement>("#cityArenaHardReward");
const cityArenaHardButton = document.querySelector<HTMLButtonElement>("#cityArenaHardButton");
const cityArenaHardName = cityArenaHardButton?.querySelector<HTMLElement>("strong");
const cityArenaHardAutoButton = document.querySelector<HTMLButtonElement>("#cityArenaHardAutoButton");
const cityArenaHardAutoRate = document.querySelector<HTMLElement>("#cityArenaHardAutoRate");
const cityArenaBossList = document.querySelector<HTMLElement>("#cityArenaBossList");
const cityPvpCreateButton = document.querySelector<HTMLButtonElement>("#cityPvpCreateButton");
const cityPvpJoinButton = document.querySelector<HTMLButtonElement>("#cityPvpJoinButton");
const cityPvpRoomList = document.querySelector<HTMLElement>("#cityPvpRoomList");
const cityPvpStatus = document.querySelector<HTMLOutputElement>("#cityPvpStatus");
const cityOnlinePveTab = document.querySelector<HTMLButtonElement>("#cityOnlinePveTab");
const cityOnlinePvpTab = document.querySelector<HTMLButtonElement>("#cityOnlinePvpTab");
const pvpTurnTimer = document.querySelector<HTMLOutputElement>("#pvpTurnTimer");
const arenaMenu = document.querySelector<HTMLElement>("[data-arena-menu]");
const arenaMenuButton = document.querySelector<HTMLButtonElement>("[data-arena-menu-button]");
const arenaMenuPanel = document.querySelector<HTMLElement>("[data-arena-menu-panel]");
const arenaLeaveButton = document.querySelector<HTMLButtonElement>("[data-arena-leave-button]");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const magicShopButton = document.querySelector<HTMLButtonElement>("#magicShopButton");
const churchButton = document.querySelector<HTMLButtonElement>("#churchButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
type ArenaMenuSelection = { kind: "random"; tierId: number; difficultyId: ArenaDifficultyId } | { kind: "boss"; bossId: ArenaBossId; duo?: boolean };
type CityShopProduct = ArmoryProduct | WeaponProduct | MagicProduct;
type GameMode = "pve" | "pvp";
interface StartGameOptions {
  mode?: GameMode;
  initialState?: CombatState;
}
interface StartGameWithCityTransitionOptions extends StartGameOptions {
  cityTransition?: "city" | "arenaPanel";
}
interface ReturnToCityOptions {
  requireResultGate?: boolean;
}
interface CityArenaAutoRateTarget {
  button: HTMLButtonElement | null;
  output: HTMLElement | null;
  selection: ArenaMenuSelection;
}
interface PendingCityArenaAutoRateTarget extends CityArenaAutoRateTarget {
  cacheKey: string;
  sourceHero: HeroState;
}
const CITY_ARENA_TIER_ONE_DIFFICULTY_LEVEL_REQUIREMENTS: Partial<Record<ArenaDifficultyId, number>> = {
  [DEFAULT_ARENA_DIFFICULTY_ID]: 3,
  hard: 7,
};
const MAGIC_SHOP_LEVEL_REQUIREMENT = 8;
let hero: HeroState = createInitialHero();
let pendingEquipmentHintItemIds: HeroItemId[] = [];
let activeArenaTierId = DEFAULT_ARENA_TIER_ID;
let activeArenaSelection: ArenaMenuSelection = { kind: "random", tierId: DEFAULT_ARENA_TIER_ID, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID };
let state: CombatState = createCombatStateForSelection(activeArenaSelection);
let displayedStatsState: CombatState = state;
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let classicActionBar: ClassicActionBarApi | undefined;
let autoBattleButton: HTMLButtonElement | undefined;
let autoBattleOffButton: HTMLButtonElement | undefined;
let autoBattleEnabled = false;
let autoBattleActivationPending = false;
let autoBattleScheduleToken = 0;
let autoBattleActivationTimer: number | undefined;
let turnSequenceToken = 0;
let isTurnAnimationLocked = false;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
let gameMode: GameMode = "pve";
let pvpSession: PvpRoomSession | undefined;
let pvpConnection: PvpConnection | undefined;
let pvpSnapshot: PvpRoomSnapshot | undefined;
let pvpActionPending = false;
let pvpSnapshotPlaybackToken = 0;
let pvpControlsBusy = false;
let pvpRoomsVisible = false;
let pvpRoomList: PvpRoomListEntry[] = [];
let activeOnlineRoomKind: PvpRoomKind = "duoBoss";
let isCityArenaOnlineViewOpen = false;
let isCityArenaQuestPanelOpen = false;
let pvpDeadlineLocalTime: number | undefined;
let pvpTimerInterval: number | undefined;
let hasStarted = false;
let isInCity = true;
let armoryShop: ArmoryShopApi | undefined;
let weaponShop: WeaponShopApi | undefined;
let magicShop: MagicShopApi | undefined;
let unmountArena: (() => void) | undefined;
let cityScene: CitySceneApi | undefined;
let heroPortraitPreview: HeroPortraitPreviewApi | undefined;
const CITY_CURTAIN_CLOSE_MS = 100;
const CITY_CURTAIN_HOLD_MS = 250;
const CITY_CURTAIN_REVEAL_MS = 300;
const CITY_CURTAIN_TRANSITION_MS = CITY_CURTAIN_CLOSE_MS + CITY_CURTAIN_HOLD_MS + CITY_CURTAIN_REVEAL_MS;
const CITY_CURTAIN_SWITCH_MS = CITY_CURTAIN_CLOSE_MS;
const CITY_RETURN_MIN_READY_MS = 1800;
const CITY_RETURN_PREWARM_TIMEOUT_MS = 3000;
const CITY_RETURN_TRANSITION_IN_MS = 260;
const CITY_RETURN_TRANSITION_TIMEOUT_MS = 4200;
const TEMPORARY_CHURCH_SKILL_GRANT_TELEGRAM_USER_IDS = new Set(["297730487", "313719698"]);
const HERO_PROGRESS_RESET_TELEGRAM_USER_IDS = new Set(["297730487", "313719698"]);
const ARENA_ENERGY_RESTORE_TELEGRAM_USER_IDS = new Set(["297730487", "313719698", "913155684"]);
const TELEGRAM_USER_ID_GATED_ACTION_BYPASS_ORIGINS = new Set(["http://localhost:5173"]);
const LOCAL_DEBUG_RESTART_BUTTON_ORIGIN = "http://localhost:5173";
const CITY_RETURN_READY_LABEL = "Return to City";
const CITY_RETURN_WAITING_LABEL = "Preparing City...";
const AUTO_RESULT_RETURN_LABEL = "Return";
const ARENA_ENTRY_LOADER_DELAY_MS = 240;
const ARENA_ENTRY_FAILSAFE_TIMEOUT_MS = 5000;
const CITY_ARENA_PANEL_ENTRY_TRANSITION_MS = 1000;
const ARENA_ENERGY_TIMER_REFRESH_MS = 30000;
const ARENA_RANDOM_ENERGY_COST = 1;
const ARENA_BOSS_ENERGY_COST = 2;
const ARENA_DUO_BOSS_ENERGY_COST = 3;
const ONLINE_DUO_GUEST_ENERGY_REWARD = 5;
const ONLINE_DUO_HOST_SPEND_STORAGE_PREFIX = "dust-arena-online-duo-host-spend:";
const ONLINE_DUO_REWARD_STORAGE_PREFIX = "dust-arena-online-duo-reward:";
const PLAYER_TO_ENEMY_TURN_PACING_MS = 100;
const ENEMY_TO_PLAYER_TURN_PACING_MS = 50;
const AUTO_PLAYER_TURN_PACING_MS = 120;
const AUTO_BATTLE_PANEL_TRANSITION_MS = 320;
const AUTO_FIGHT_SUCCESS_RATE_SIMULATIONS = 20;
const AUTO_FIGHT_MAX_TURNS = 300;
const AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER = 0.5;
let cityCurtainCleanupTimer: number | undefined;
let cityCurtainRevealTimer: number | undefined;
let cityCurtainSwitchTimer: number | undefined;
let isArenaTransitionRunning = false;
let isArenaEntryLoading = false;
let isArenaEntryTransitionPlaying = false;
let arenaEntryToken = 0;
let arenaEntryLoaderTimer: number | undefined;
let arenaEntryFailsafeTimer: number | undefined;
let battleResultPresentation: BattleResultPresentation | undefined;
let pendingBattleResultPresentation: BattleResultPresentation | undefined;
let battleResultPresentationStage: BattleResultPresentationStage = "reward";
let battleResultPresentationId = 0;
let battleResultPresentationRevealToken = 0;
let statsRevealToken = 0;
let battleResultReturnReady = true;
let battleResultReturnLabel = CITY_RETURN_READY_LABEL;
let battleResultReturnGateToken = 0;
let battleResultSequenceLocked = false;
let rewardUiRenderDirty = false;
let cityArenaAutoRateToken = 0;
let cityArenaAutoFightPending = false;
let isAutoResultOverlayActive = false;
const cityArenaAutoRateCache = new Map<string, number>();
let isCityReturnTransitionRunning = false;
let cityReturnTransitionToken = 0;
let shopPreviewPrewarmToken = 0;
let shopPreviewPrewarmFrame: number | undefined;
let shopPreviewPrewarmItemIds: HeroItemId[] = [];
let activeShopPreviewPrewarmSignature = "";
let completedShopPreviewPrewarmSignature = "";
let arenaEnergySpendPending = false;
let cityReturnTransitionRetryHandler: (() => void) | undefined;

const cityReturnTransition = createCityReturnTransition();
const cityHeroProfile = mountCityHeroProfile(cityHeroWidgetRefs);
const cityHeroEquipmentMenu: CityHeroEquipmentMenuApi = mountCityHeroEquipmentMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onEquip: handleProfileEquipmentEquip,
  onUnequip: handleProfileEquipmentUnequip,
  onCategoryOpen: handleProfileEquipmentCategoryOpen,
  onOpen: (layout) => cityScene?.setProfilePreview(layout),
  onClose: () => cityScene?.setProfilePreview(),
});
const cityHeroAppearanceMenu = mountCityHeroAppearanceMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onChange: handleProfileAppearanceChange,
});
cityHeroWidgetRefs.profile?.addEventListener("city-profile-visibility", (event) => {
  const profileOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);

  if (!profileOpen) {
    cityScene?.setProfilePreview();
  }
  if (profileOpen) {
    closeCityArenaMenu();
  }
});

syncHudTuning(dom.gameScreen, debugTuning);
mountSettingsMenu();
mountArenaMenu();
mountCityTimeToggle(cityTimeToggle, cityMenu);

function canShowLocalDebugRestartButton(): boolean {
  return window.location.origin === LOCAL_DEBUG_RESTART_BUTTON_ORIGIN;
}

function syncRestartButtonVisibility(visible = true): void {
  dom.restartButton.hidden = !canShowLocalDebugRestartButton() || !visible;
}

function mountArenaMenu(): void {
  if (!arenaMenu || !arenaMenuButton || !arenaMenuPanel) {
    return;
  }

  arenaMenu.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  arenaMenuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setArenaMenuOpen(arenaMenuPanel.hidden !== false);
  });

  arenaLeaveButton?.addEventListener("click", () => {
    setArenaMenuOpen(false);
    void returnToCity({ requireResultGate: false });
  });

  document.addEventListener("pointerdown", (event) => {
    if (arenaMenuPanel.hidden || !(event.target instanceof Node) || arenaMenu.contains(event.target)) {
      return;
    }

    setArenaMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setArenaMenuOpen(false);
    }
  });
}

function setArenaMenuOpen(open: boolean): void {
  if (!arenaMenuButton || !arenaMenuPanel) {
    return;
  }

  arenaMenuPanel.hidden = !open;
  arenaMenuButton.setAttribute("aria-expanded", String(open));

  if (!open) {
    closeArenaSettingsPanel();
  }
}

function closeArenaSettingsPanel(): void {
  const settingsPanel = arenaMenu?.querySelector<HTMLElement>("[data-settings-panel]");
  const settingsButton = arenaMenu?.querySelector<HTMLButtonElement>("[data-settings-button]");

  if (settingsPanel) {
    settingsPanel.hidden = true;
  }

  settingsButton?.setAttribute("aria-expanded", "false");
}

function createCityReturnTransition(): HTMLElement {
  const element = document.createElement("div");

  element.className = "city-return-transition city-return-transition--active";
  element.hidden = false;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.innerHTML = `
    <div class="city-return-transition__panel">
      <span class="city-return-transition__coin" aria-hidden="true"></span>
      <strong data-city-return-transition-label>Entering City...</strong>
      <button class="city-return city-return-transition__retry" type="button" hidden data-city-return-transition-retry>Retry</button>
    </div>
  `;
  element.querySelector<HTMLButtonElement>("[data-city-return-transition-retry]")?.addEventListener("click", () => {
    cityReturnTransitionRetryHandler?.();
  });

  document.body.append(element);

  return element;
}

function ensureArenaEntryLoader(): HTMLElement {
  const existing = dom.gameScreen.querySelector<HTMLElement>(".arena-entry-loader");

  if (existing) {
    return existing;
  }

  const element = document.createElement("div");

  element.className = "arena-entry-loader";
  element.hidden = true;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.innerHTML = `
    <span class="city-return-transition__coin" aria-hidden="true"></span>
    <strong>Entering Arena...</strong>
  `;
  dom.gameScreen.append(element);

  return element;
}

function setArenaEntryLoaderVisible(visible: boolean): void {
  const loader = visible ? ensureArenaEntryLoader() : dom.gameScreen.querySelector<HTMLElement>(".arena-entry-loader");

  if (loader) {
    loader.hidden = !visible;
  }
  dom.gameScreen.classList.toggle("battle-screen--arena-entry-loading", visible);
}

function clearArenaEntryLoaderTimer(): void {
  if (arenaEntryLoaderTimer) {
    window.clearTimeout(arenaEntryLoaderTimer);
    arenaEntryLoaderTimer = undefined;
  }
}

function clearArenaEntryFailsafeTimer(): void {
  if (arenaEntryFailsafeTimer) {
    window.clearTimeout(arenaEntryFailsafeTimer);
    arenaEntryFailsafeTimer = undefined;
  }
}

function releaseStalledArenaEntryGate(token: number): void {
  if (arenaEntryToken !== token || !isArenaEntryLoading) {
    return;
  }

  arenaEntryToken += 1;
  isArenaEntryLoading = false;
  isArenaEntryTransitionPlaying = false;
  enemyTimerStatus = "idle";
  clearArenaEntryLoaderTimer();
  clearArenaEntryFailsafeTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
  setTurnAnimationLocked(false);
  syncAutoBattleToggle();
  syncActionArc();
  refreshArenaLayout();
}

function beginArenaEntryGate(): number {
  const token = arenaEntryToken + 1;

  arenaEntryToken = token;
  isArenaEntryLoading = true;
  clearArenaEntryLoaderTimer();
  clearArenaEntryFailsafeTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.add("battle-screen--arena-entry");
  arenaEntryLoaderTimer = window.setTimeout(() => {
    arenaEntryLoaderTimer = undefined;
    if (arenaEntryToken === token && isArenaEntryLoading) {
      setArenaEntryLoaderVisible(true);
    }
  }, ARENA_ENTRY_LOADER_DELAY_MS);
  arenaEntryFailsafeTimer = window.setTimeout(() => {
    arenaEntryFailsafeTimer = undefined;
    releaseStalledArenaEntryGate(token);
  }, ARENA_ENTRY_FAILSAFE_TIMEOUT_MS);
  syncActionArc();

  return token;
}

function finishArenaEntryGate(token: number): void {
  if (arenaEntryToken !== token) {
    return;
  }

  isArenaEntryLoading = false;
  clearArenaEntryLoaderTimer();
  clearArenaEntryFailsafeTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
  syncActionArc();
}

function cancelArenaEntryGate(): void {
  arenaEntryToken += 1;
  isArenaEntryLoading = false;
  isArenaEntryTransitionPlaying = false;
  clearArenaEntryLoaderTimer();
  clearArenaEntryFailsafeTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
  syncActionArc();
}

function playCityCurtainTransition(onCovered?: () => void): void {
  if (!cityMenu) {
    onCovered?.();
    return;
  }

  if (cityCurtainCleanupTimer) {
    window.clearTimeout(cityCurtainCleanupTimer);
    cityCurtainCleanupTimer = undefined;
  }
  if (cityCurtainRevealTimer) {
    window.clearTimeout(cityCurtainRevealTimer);
    cityCurtainRevealTimer = undefined;
  }
  if (cityCurtainSwitchTimer) {
    window.clearTimeout(cityCurtainSwitchTimer);
    cityCurtainSwitchTimer = undefined;
  }

  cityMenu.classList.remove("city-menu--curtain-cover", "city-menu--curtain-hold", "city-menu--curtain-reveal");
  void cityMenu.offsetWidth;
  cityMenu.classList.add("city-menu--curtain-cover");
  cityCurtainSwitchTimer = window.setTimeout(() => {
    cityCurtainSwitchTimer = undefined;
    cityMenu.classList.remove("city-menu--curtain-cover");
    cityMenu.classList.add("city-menu--curtain-hold");
    onCovered?.();
    cityCurtainRevealTimer = window.setTimeout(() => {
      cityCurtainRevealTimer = undefined;
      cityMenu.classList.remove("city-menu--curtain-hold");
      cityMenu.classList.add("city-menu--curtain-reveal");
    }, CITY_CURTAIN_HOLD_MS);
  }, CITY_CURTAIN_CLOSE_MS);
  cityCurtainCleanupTimer = window.setTimeout(() => {
    cityCurtainCleanupTimer = undefined;
    cityMenu.classList.remove("city-menu--curtain-cover", "city-menu--curtain-hold", "city-menu--curtain-reveal");
  }, CITY_CURTAIN_TRANSITION_MS);
}

function renderCurrentDom(): void {
  renderDom(dom, state, {
    hero,
    reward: gameMode === "pvp" ? { gold: 0, xp: 0 } : getBattleReward(state),
    statsState: displayedStatsState,
    resultPresentation: battleResultPresentation,
    resultPresentationStage: battleResultPresentationStage,
    deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation),
    resultReturn: {
      ready: battleResultPresentationStage === "loot" ? true : battleResultReturnReady && !battleResultSequenceLocked,
      label: battleResultPresentationStage === "loot" ? "Continue" : battleResultReturnLabel,
    },
    onResultSequenceLockChange: setBattleResultSequenceLocked,
  });
}

function setBattleResultSequenceLocked(locked: boolean): void {
  if (battleResultSequenceLocked === locked) {
    return;
  }

  battleResultSequenceLocked = locked;
  renderCurrentDom();
}

function syncPlayerCityBodyScale(): void {
  setPlayerBodyScaleBonus(deriveHeroStats(hero).bodyScaleBonus);
}

function renderCityHero(): void {
  renderCityHeroInfo(cityHeroWidgetRefs, hero, {
    highlightedEquipmentItemIds: pendingEquipmentHintItemIds,
  });
  syncMagicShopButtonLock();
}

function syncArenaEnergyTimerDisplays(): void {
  const arenaEnergy = getHeroArenaEnergy(hero);

  if (cityHeroWidgetRefs.arenaEnergy) {
    renderCityArenaEnergyBadge(cityHeroWidgetRefs.arenaEnergy, arenaEnergy, "city-menu__hero-energy--empty");
  }
  if (cityHeroWidgetRefs.profileArenaEnergy) {
    renderCityArenaEnergyBadge(cityHeroWidgetRefs.profileArenaEnergy, arenaEnergy, "city-profile__arena-energy--empty");
  }
  if (cityArenaEnergy && cityArenaMenu && !cityArenaMenu.hidden) {
    renderCityArenaEnergyBadge(cityArenaEnergy, arenaEnergy, "city-arena-menu__energy--empty");
    syncCityArenaBotControls();
  }
}

function createBattleResultLevelUnlocks(heroBeforeReward: HeroState, heroAfterReward: HeroState): BattleResultLevelUnlocks[] {
  const fromLevel = Math.max(1, Math.floor(heroBeforeReward.level));
  const toLevel = Math.max(1, Math.floor(heroAfterReward.level));

  if (toLevel <= fromLevel) {
    return [];
  }

  const weaponProducts = getBattleResultUnlockWeaponProducts(heroAfterReward);
  const armorProducts = getBattleResultUnlockArmorProducts(heroAfterReward);
  const energyBeforeReward = getHeroArenaEnergy(heroBeforeReward);
  const energyAfterReward = getHeroArenaEnergy(heroAfterReward);
  const levelUnlocks: BattleResultLevelUnlocks[] = [];
  let energyFrom = energyBeforeReward.current;

  for (let level = fromLevel + 1; level <= toLevel; level += 1) {
    const features = getBattleResultFeatureUnlocksForLevel(level);
    const weapons = getBattleResultUnlockProductsForLevel(weaponProducts, heroAfterReward, level);
    const armor = getBattleResultUnlockProductsForLevel(armorProducts, heroAfterReward, level);

    if (features.length > 0 || weapons.length > 0 || armor.length > 0) {
      levelUnlocks.push({
        level,
        features,
        weapons,
        armor,
        energy: {
          from: energyFrom,
          to: energyAfterReward.current,
          max: energyAfterReward.max,
        },
      });
      energyFrom = energyAfterReward.current;
    }
  }

  return levelUnlocks;
}

function getBattleResultFeatureUnlocksForLevel(level: number): BattleResultFeatureUnlock[] {
  if (level !== MAGIC_SHOP_LEVEL_REQUIREMENT) {
    return [];
  }

  return [
    {
      kind: "magic-shop",
      title: "MAGICAL SHOP UNLOCKED",
      iconUrl: SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
      ariaLabel: "Magical shop unlocked",
    },
  ];
}

function createBattleResultPostUnlocks(heroBeforeReward: HeroState, heroAfterReward: HeroState): BattleResultLevelUnlocks[] {
  return getNewlyUnlockedMagicShopUpgradeTierIds(heroBeforeReward, heroAfterReward).map((tierId) => ({
    level: heroAfterReward.level,
    heading: `TIER ${tierId} CLEARED`,
    features: [
      {
        kind: "magic-upgrades",
        title: "UPGRADES UNLOCKED",
        iconUrl: SHOP_UPGRADE_ARROW_ICON_ASSET_URL,
        ariaLabel: "Magic shop upgrades unlocked",
      },
    ],
    weapons: [],
    armor: [],
  }));
}

function getNewlyUnlockedMagicShopUpgradeTierIds(heroBeforeReward: HeroState, heroAfterReward: HeroState): number[] {
  const upgradeTierIds = getMagicShopUpgradeUnlockTierIds();

  return getNewlyDefeatedArenaBossTierIds(heroBeforeReward, heroAfterReward).filter((tierId) => upgradeTierIds.has(tierId));
}

function getMagicShopUpgradeUnlockTierIds(): Set<number> {
  const tierIds = new Set<number>();

  HERO_SCROLL_UPGRADE_RARITIES.forEach((rarity) => {
    const tierId = getHeroScrollUpgradeUnlockBossTier(rarity);

    if (tierId) {
      tierIds.add(tierId);
    }
  });

  for (let capacity = HERO_SCROLL_CAPACITY_BASE + 1; capacity <= HERO_SCROLL_CAPACITY_MAX; capacity += 1) {
    const tierId = getHeroScrollCapacityUpgradeUnlockBossTier(capacity);

    if (tierId) {
      tierIds.add(tierId);
    }
  }

  return tierIds;
}

function getNewlyDefeatedArenaBossTierIds(heroBeforeReward: HeroState, heroAfterReward: HeroState): number[] {
  const defeatedBefore = new Set(heroBeforeReward.defeatedArenaBossIds ?? []);
  const newBossIds = new Set((heroAfterReward.defeatedArenaBossIds ?? []).filter((bossId) => !defeatedBefore.has(bossId)));
  const tierIds = new Set<number>();

  if (newBossIds.size <= 0) {
    return [];
  }

  getArenaTierDefinitions().forEach((tier) => {
    getArenaBossesForTier(tier.id).forEach((boss) => {
      if (newBossIds.has(boss.id)) {
        tierIds.add(boss.tierId);
      }
    });
  });

  return [...tierIds].sort((left, right) => left - right);
}

function getBattleResultUnlockWeaponProducts(heroAfterReward: HeroState): WeaponProduct[] {
  return GENERATED_WEAPON_PRODUCTS.map((product) => ({
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    price: product.price,
    itemIds: [...product.itemIds],
  })).filter((product) => isBattleResultUnlockProductVisible(heroAfterReward, product));
}

function getBattleResultUnlockArmorProducts(heroAfterReward: HeroState): ArmoryProduct[] {
  const products = GENERATED_ARMORY_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    itemIds: [...product.itemIds],
  }));

  return pairGeneratedArmoryProducts(products).filter((product) => isBattleResultUnlockProductVisible(heroAfterReward, product));
}

function getBattleResultUnlockProductsForLevel(
  products: readonly (ArmoryProduct | WeaponProduct)[],
  heroAfterReward: HeroState,
  level: number,
): BattleResultUnlockProduct[] {
  return products
    .filter((product) => getShopProductLevelRequirement(product.itemIds) === level)
    .filter((product) => !isShopProductSealed(heroAfterReward, product.itemIds, product.rarity))
    .map((product) => createBattleResultUnlockProduct(heroAfterReward, product))
    .sort(compareBattleResultUnlockProducts);
}

function createBattleResultUnlockProduct(heroAfterReward: HeroState, product: ArmoryProduct | WeaponProduct): BattleResultUnlockProduct {
  const itemIds = [...product.itemIds];
  const statKind: ShopProductStatKind = "categoryId" in product ? "damage" : "armor";
  const statValue =
    statKind === "damage" ? getShopProductDisplayStat(heroAfterReward, itemIds, statKind) : getShopProductStat(itemIds, statKind);
  const currentStat =
    statKind === "damage"
      ? getEquippedShopProductDisplayStat(heroAfterReward, itemIds, statKind)
      : getEquippedShopProductStat(heroAfterReward, itemIds, statKind);

  return {
    id: product.id,
    name: getShopProductDisplayName(product.name),
    itemIds,
    rarity: getShopProductRarity(itemIds, product.rarity),
    statKind,
    statValue,
    diff: statValue - currentStat,
    levelRequirement: getShopProductLevelRequirement(itemIds),
    price: product.price,
  };
}

function isBattleResultUnlockProductVisible(heroAfterReward: HeroState, product: ArmoryProduct | WeaponProduct): boolean {
  return product.itemIds.length > 0 && !areHeroItemsOwned(heroAfterReward, product.itemIds);
}

function compareBattleResultUnlockProducts(left: BattleResultUnlockProduct, right: BattleResultUnlockProduct): number {
  const leftLevel = getShopProductLevelRequirement(left.itemIds);
  const rightLevel = getShopProductLevelRequirement(right.itemIds);

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  return left.name.localeCompare(right.name);
}

function createInitialHero(): HeroState {
  return applyTelegramDisplayNameToHero(createDefaultHero());
}

function applyTelegramDisplayNameToHero(sourceHero: HeroState): HeroState {
  const displayName = getTelegramDisplayName();

  if (!displayName || sourceHero.name !== DEFAULT_HERO_NAME) {
    return sourceHero;
  }

  const now = new Date().toISOString();

  return {
    ...sourceHero,
    name: displayName,
    updatedAt: now,
  };
}

function syncHeroRuntimeState(): void {
  state = createCombatStateForSelection(activeArenaSelection);
  displayedStatsState = state;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  setPlayerAppearance(hero.appearance);
  setPlayerWeaponEnchantments(hero.weaponEnchantments);
  renderCityHero();
  renderCurrentDom();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
  heroPortraitPreview?.setEquipment(hero.equipment);
  heroPortraitPreview?.setAppearance(hero.appearance);
}

function hydrateHeroFromLocalSave(): boolean {
  const savedHero = loadLocalHeroSave();

  if (!savedHero) {
    return false;
  }

  hero = applyTelegramDisplayNameToHero(savedHero);
  syncHeroRuntimeState();

  return true;
}

async function hydrateHeroFromCloudSave(): Promise<boolean> {
  if (!canUseGladiatorCloudSave()) {
    return false;
  }

  try {
    const savedHero = await loadGladiatorCloudSave();

    if (!savedHero) {
      clearLocalHeroSave();
      hero = createInitialHero();
      syncHeroRuntimeState();
      return true;
    }

    hero = applyTelegramDisplayNameToHero(savedHero);
    saveLocalHeroSave(hero);
    syncHeroRuntimeState();
    return true;
  } catch (error) {
    console.warn("[gladiator-save] Failed to load cloud save.", error);
    return false;
  }
}

function queueHeroCloudSave(reason: string): void {
  if (!canUseGladiatorCloudSave()) {
    return;
  }

  const heroToSave = hero;

  saveLocalHeroSave(heroToSave);

  void saveGladiatorCloudHero(heroToSave).catch((error) => {
    console.warn(`[gladiator-save] Failed to save cloud hero after ${reason}.`, error);
  });
}

async function handleHeroProgressReset(): Promise<void> {
  if (!canUseTelegramUserIdGatedAction(HERO_PROGRESS_RESET_TELEGRAM_USER_IDS)) {
    return;
  }

  if (!window.confirm("Reset hero progress? This cannot be undone.")) {
    return;
  }

  cityHeroWidgetRefs.profileResetButton?.setAttribute("disabled", "");

  try {
    if (canUseGladiatorCloudSave()) {
      await deleteGladiatorCloudSave();
    }

    resetHeroProgressState();
  } catch (error) {
    console.warn("[gladiator-save] Failed to reset hero progress.", error);
    window.alert("Reset failed. Try again.");
  } finally {
    cityHeroWidgetRefs.profileResetButton?.removeAttribute("disabled");
  }
}

function handleAdminArenaEnergyRestore(): void {
  if (!canUseTelegramUserIdGatedAction(ARENA_ENERGY_RESTORE_TELEGRAM_USER_IDS)) {
    return;
  }

  const now = new Date().toISOString();
  const nextHero = resetHeroArenaBossVictoryLedger(restoreHeroArenaEnergy(hero, now), now);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  saveLocalHeroSave(hero);
  queueHeroCloudSave("admin-arena-daily-reset");
  renderCityHero();
  renderCityArenaMenu();
}

function resetHeroProgressState(): void {
  pendingEquipmentHintItemIds = [];
  activeArenaTierId = DEFAULT_ARENA_TIER_ID;
  activeArenaSelection = { kind: "random", tierId: DEFAULT_ARENA_TIER_ID, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID };
  clearShopPreview();
  cancelShopPreviewPrewarm();
  cityHeroEquipmentMenu.close();
  cityHeroAppearanceMenu.close();
  armoryShop?.close();
  weaponShop?.close();
  magicShop?.close();
  clearLocalHeroSave();
  hero = createInitialHero();
  syncHeroRuntimeState();
  renderCityArenaMenu();
  renderPvpRoomList();
}

function commitState(nextState: CombatState, options: { syncArena?: boolean } = {}): Promise<void> {
  const syncArena = options.syncArena ?? true;
  const previousState = state;
  const isBattleFinishing = state.result === "playing" && nextState.result !== "playing";
  const committedState = applyBattleRewardIfNeeded(nextState);
  const statsToken = ++statsRevealToken;
  const shouldSyncArena = syncArena && Boolean(arenaScene);

  state = committedState;
  displayedStatsState = shouldSyncArena ? getPreImpactStatsState(previousState, committedState) : committedState;
  renderCurrentDom();
  if (!isBattleFinishing) {
    renderCityHero();
  }
  const actionAnimation = shouldSyncArena
    ? (arenaScene?.sync(state, {
      hudState: displayedStatsState,
      onImpact: () => revealStatsAfterImpact(statsToken, committedState),
    }) ?? Promise.resolve())
    : Promise.resolve();

  if (displayedStatsState === committedState) {
    revealStatsAfterImpact(statsToken, committedState);
  }

  void actionAnimation.finally(() => revealStatsAfterImpact(statsToken, committedState));

  if (isBattleFinishing) {
    scheduleBattleResultPresentation(actionAnimation);
  }
  syncActionArc();
  syncTurnProbe();

  return actionAnimation;
}

function revealStatsAfterImpact(token: number, targetState: CombatState): void {
  if (statsRevealToken !== token || state !== targetState) {
    return;
  }

  if (displayedStatsState === targetState) {
    return;
  }

  displayedStatsState = targetState;
  renderCurrentDom();
}

function getPreImpactStatsState(previous: CombatState, current: CombatState): CombatState {
  let player = current.player;
  let helper = current.helper;
  let enemy = current.enemy;

  if (current.lastPlayerDamage > 0) {
    enemy = {
      ...current.enemy,
      hp: previous.enemy.hp,
      armor: previous.enemy.armor,
    };
  }

  if (current.lastHelperDamage > 0) {
    enemy = {
      ...current.enemy,
      hp: previous.enemy.hp,
      armor: previous.enemy.armor,
    };
  }

  if (current.lastEnemyDamage > 0) {
    if (current.lastEnemyTarget === "helper" && current.helper && previous.helper) {
      helper = {
        ...current.helper,
        hp: previous.helper.hp,
        armor: previous.helper.armor,
      };
    } else {
      player = {
        ...current.player,
        hp: previous.player.hp,
        armor: previous.player.armor,
      };
    }
  }

  return player === current.player && helper === current.helper && enemy === current.enemy ? current : { ...current, player, helper, enemy };
}

function scheduleBattleResultPresentation(actionAnimation: Promise<void>): void {
  const revealToken = ++battleResultPresentationRevealToken;

  void actionAnimation
    .catch(() => undefined)
    .then(nextAnimationFrame)
    .then(() => {
      if (battleResultPresentationRevealToken !== revealToken || state.result === "playing") {
        return;
      }

      if (!pendingBattleResultPresentation) {
        return;
      }

      battleResultPresentation = pendingBattleResultPresentation;
      battleResultPresentationStage = getInitialBattleResultPresentationStage(battleResultPresentation);
      pendingBattleResultPresentation = undefined;
      renderCityHero();
      renderCurrentDom();
      syncTurnProbe();
    });
}

function getInitialBattleResultPresentationStage(presentation: BattleResultPresentation): BattleResultPresentationStage {
  return presentation.loot && presentation.loot.length > 0 ? "loot" : "reward";
}

function continueBattleResultLootPresentation(): boolean {
  if (!battleResultPresentation || battleResultPresentationStage !== "loot") {
    return false;
  }

  battleResultPresentationStage = "reward";
  renderCurrentDom();
  syncTurnProbe();

  return true;
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function syncActionArc(): void {
  const controlledActor = getControlledActionActor();
  const lockedTurn = controlledActor === "helper" ? "player" : "enemy";
  const visibleState = isTurnAnimationLocked || isArenaEntryLoading ? { ...state, activeTurn: lockedTurn } : state;

  actionArc?.sync(visibleState);
  classicActionBar?.sync(visibleState);
  syncAutoBattleToggle();
}

function getControlledActionActor(): CombatActor {
  if (gameMode !== "pvp" || !pvpSession) {
    return "player";
  }

  const roomKind = pvpSession.roomKind ?? pvpSnapshot?.roomKind ?? "pvp";

  if (roomKind !== "duoBoss") {
    return "player";
  }

  return pvpSnapshot?.controlledActor ?? getPvpActorForSeat(pvpSession.seat, roomKind);
}

function setTurnAnimationLocked(locked: boolean): void {
  if (isTurnAnimationLocked === locked) {
    return;
  }

  isTurnAnimationLocked = locked;
  syncActionArc();
  if (!locked) {
    scheduleAutoPlayerTurn();
  }
}

function resetBattleInteractionLocksForArenaStart(): void {
  turnSequenceToken += 1;
  pvpSnapshotPlaybackToken += 1;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  setAutoBattleEnabled(false);
  setTurnAnimationLocked(false);
  cancelArenaEntryGate();
}

function mountAutoBattleToggle(host: HTMLElement): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "auto-battle-toggle";
  button.type = "button";
  button.textContent = "AUTO";
  button.setAttribute("aria-label", "Auto battle");
  button.setAttribute("aria-pressed", "false");
  button.title = "Auto battle";
  button.addEventListener("click", () => setAutoBattleEnabled(!autoBattleEnabled));
  host.append(button);

  return button;
}

function mountAutoBattleOffButton(host: HTMLElement): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "auto-battle-off-button";
  button.type = "button";
  button.textContent = "OFF";
  button.setAttribute("aria-label", "Turn off auto battle");
  button.setAttribute("aria-hidden", "true");
  button.title = "Turn off auto battle";
  button.addEventListener("click", () => {
    if (isOnlineDuoSeatAutoEnabled()) {
      handlePvpAutoOff();
      return;
    }

    setAutoBattleEnabled(false);
  });
  host.append(button);

  return button;
}

function clearAutoBattleActivationTimer(): void {
  if (autoBattleActivationTimer === undefined) {
    return;
  }

  window.clearTimeout(autoBattleActivationTimer);
  autoBattleActivationTimer = undefined;
}

function setAutoBattleEnabled(enabled: boolean): void {
  const shouldEnable = enabled && gameMode !== "pvp";

  clearAutoBattleActivationTimer();
  autoBattleEnabled = shouldEnable;
  autoBattleActivationPending = shouldEnable;
  autoBattleScheduleToken += 1;
  syncAutoBattleToggle();

  if (!shouldEnable) {
    syncActionArc();
    return;
  }

  autoBattleActivationTimer = window.setTimeout(() => {
    autoBattleActivationTimer = undefined;

    if (!autoBattleEnabled) {
      return;
    }

    autoBattleActivationPending = false;
    syncAutoBattleToggle();
    scheduleAutoPlayerTurn();
  }, AUTO_BATTLE_PANEL_TRANSITION_MS);
}

function syncAutoBattleToggle(): void {
  if (!autoBattleButton || !autoBattleOffButton) {
    return;
  }

  const canAutoBattle = gameMode === "pve" && !isInCity;
  const onlineAutoActive = isOnlineDuoSeatAutoEnabled();
  const battleActive = canAutoBattle && hasStarted && state.result === "playing" && !isArenaEntryLoading;
  const autoBattleUiActive = autoBattleEnabled && battleActive;
  const offButtonActive = autoBattleUiActive || onlineAutoActive;

  autoBattleButton.hidden = !canAutoBattle;
  autoBattleButton.disabled = !battleActive || autoBattleUiActive || isArenaEntryTransitionPlaying;
  autoBattleButton.classList.toggle("auto-battle-toggle--active", autoBattleUiActive);
  autoBattleButton.setAttribute("aria-pressed", autoBattleUiActive ? "true" : "false");
  autoBattleOffButton.hidden = !canAutoBattle && !onlineAutoActive;
  autoBattleOffButton.disabled = !offButtonActive;
  autoBattleOffButton.setAttribute("aria-hidden", offButtonActive ? "false" : "true");
  dom.gameScreen.classList.toggle("battle-screen--auto-battle-active", offButtonActive);
  dom.gameScreen.classList.toggle("battle-screen--auto-battle-transitioning", autoBattleUiActive && autoBattleActivationPending);
}

function isOnlineDuoSeatAutoEnabled(): boolean {
  return gameMode === "pvp"
    && !isInCity
    && pvpSnapshot?.roomKind === "duoBoss"
    && pvpSnapshot.status === "playing"
    && state.result === "playing"
    && Boolean(pvpSession && pvpSnapshot.autoSeats?.[pvpSession.seat]);
}

function handlePvpAutoOff(): void {
  pvpConnection?.sendAutoOff();
}

function scheduleAutoPlayerTurn(): void {
  const token = ++autoBattleScheduleToken;

  if (!canRunAutoPlayerTurn()) {
    return;
  }

  window.setTimeout(() => {
    if (token !== autoBattleScheduleToken || !canRunAutoPlayerTurn()) {
      return;
    }

    handleAutoBattleAction();
  }, AUTO_PLAYER_TURN_PACING_MS);
}

function canRunAutoPlayerTurn(): boolean {
  return autoBattleEnabled
    && gameMode === "pve"
    && hasStarted
    && !isInCity
    && !autoBattleActivationPending
    && !isTurnAnimationLocked
    && !isArenaEntryLoading
    && !isArenaEntryTransitionPlaying
    && state.result === "playing"
    && state.activeTurn === "player";
}

function handleAutoBattleAction(): void {
  if (!canRunAutoPlayerTurn()) {
    return;
  }

  const nextState = resolveAutoPlayerTurn(state);

  if (nextState === state) {
    setAutoBattleEnabled(false);
    return;
  }

  logTurnProbe("auto-player-action", state, enemyTimerStatus, nextState.lastPlayerAction);

  const actionAnimation = commitState(nextState);

  if (isDuoBossAiCombat(nextState)) {
    void scheduleDuoBossTurns(nextState, actionAnimation);
    return;
  }

  if (nextState.result === "playing" && nextState.activeTurn === "enemy") {
    void scheduleEnemyTurn(nextState, actionAnimation);
    return;
  }

  if (nextState.result === "playing" && nextState.activeTurn === "player") {
    void actionAnimation.finally(() => scheduleAutoPlayerTurn());
  }
}

function handleAction(actionId: ActionId): void {
  if (!hasStarted || isInCity || isTurnAnimationLocked || isArenaEntryLoading) {
    return;
  }

  logTurnProbe("player-action", state, enemyTimerStatus, actionId);

  if (gameMode === "pvp") {
    handlePvpAction(actionId);
    return;
  }

  const nextState = resolvePlayerTurn(state, actionId);

  const actionAnimation = commitState(nextState);

  if (isDuoBossAiCombat(nextState)) {
    void scheduleDuoBossTurns(nextState, actionAnimation);
    return;
  }

  void scheduleEnemyTurn(nextState, actionAnimation);
}

async function scheduleDuoBossTurns(enemyState: CombatState, previousActionAnimation: Promise<void> = Promise.resolve()): Promise<void> {
  if (enemyState.result !== "playing" || enemyState.activeTurn !== "enemy") {
    return;
  }

  const token = ++turnSequenceToken;

  setTurnAnimationLocked(true);
  enemyTimerStatus = "scheduled";
  syncTurnProbe();
  logTurnProbe("duo-helper-scheduled", enemyState, enemyTimerStatus);

  await previousActionAnimation;

  if (turnSequenceToken !== token || state !== enemyState) {
    return;
  }

  await delay(PLAYER_TO_ENEMY_TURN_PACING_MS);

  if (turnSequenceToken !== token || state !== enemyState) {
    return;
  }

  enemyTimerStatus = "running";
  logTurnProbe("duo-helper-running", enemyState, enemyTimerStatus);

  const helperState = resolveDuoBossHelperTurn(enemyState);
  const helperActionAnimation = helperState === enemyState ? Promise.resolve() : commitState(helperState);

  await helperActionAnimation;

  if (turnSequenceToken !== token || state !== helperState || helperState.result !== "playing") {
    enemyTimerStatus = "idle";
    setTurnAnimationLocked(false);
    return;
  }

  await delay(PLAYER_TO_ENEMY_TURN_PACING_MS);

  if (turnSequenceToken !== token || state !== helperState) {
    return;
  }

  const nextState = resolveEnemyTurn(helperState);

  enemyTimerStatus = "idle";
  const enemyActionAnimation = commitState(nextState);
  logTurnProbe("duo-enemy-committed", nextState, enemyTimerStatus);

  await enemyActionAnimation;

  if (turnSequenceToken !== token || state !== nextState) {
    return;
  }

  await delay(ENEMY_TO_PLAYER_TURN_PACING_MS);

  if (turnSequenceToken !== token || state !== nextState) {
    return;
  }

  if (nextState.result === "playing" && nextState.activeTurn === "enemy") {
    void scheduleDuoBossTurns(nextState);
    return;
  }

  setTurnAnimationLocked(false);
}

async function scheduleEnemyTurn(enemyState: CombatState, previousActionAnimation: Promise<void> = Promise.resolve()): Promise<void> {
  if (enemyState.result !== "playing" || enemyState.activeTurn !== "enemy") {
    return;
  }

  const token = ++turnSequenceToken;

  setTurnAnimationLocked(true);
  enemyTimerStatus = "scheduled";
  syncTurnProbe();
  logTurnProbe("enemy-scheduled", enemyState, enemyTimerStatus);

  await previousActionAnimation;

  if (turnSequenceToken !== token || state !== enemyState) {
    return;
  }

  await delay(PLAYER_TO_ENEMY_TURN_PACING_MS);

  if (turnSequenceToken !== token || state !== enemyState) {
    return;
  }

  enemyTimerStatus = "running";
  logTurnProbe("enemy-running", enemyState, enemyTimerStatus);

  const nextState = resolveEnemyTurn(enemyState);

  enemyTimerStatus = "idle";
  const enemyActionAnimation = commitState(nextState);
  logTurnProbe("enemy-committed", nextState, enemyTimerStatus);

  await enemyActionAnimation;

  if (turnSequenceToken !== token || state !== nextState) {
    return;
  }

  await delay(ENEMY_TO_PLAYER_TURN_PACING_MS);

  if (turnSequenceToken !== token || state !== nextState) {
    return;
  }

  setTurnAnimationLocked(false);
}

function refreshArenaLayout(): void {
  window.requestAnimationFrame(() => {
    arenaScene?.scale.refresh();

    window.requestAnimationFrame(() => {
      arenaScene?.scale.refresh();
      void arenaScene?.renderState(state);
      syncActionArc();
      syncTurnProbe();
    });
  });
}

function isActiveArenaEntry(scene: ArenaScene, token: number): boolean {
  return arenaEntryToken === token && arenaScene === scene;
}

async function runArenaEntry(scene: ArenaScene, entryToken: number): Promise<void> {
  isArenaEntryTransitionPlaying = true;
  syncAutoBattleToggle();

  try {
    await scene.prepareEntry(state);

    if (!isActiveArenaEntry(scene, entryToken)) {
      return;
    }

    finishArenaEntryGate(entryToken);
    await scene.playEntryTransition(state);
  } finally {
    const stillActive = isActiveArenaEntry(scene, entryToken);

    isArenaEntryTransitionPlaying = false;
    syncAutoBattleToggle();

    if (stillActive) {
      finishArenaEntryGate(entryToken);
      refreshArenaLayout();
      scheduleAutoPlayerTurn();
    }
  }
}

function handleActionArcClick(event: Event): void {
  const { actionId, disabled } = (event as CustomEvent<{ actionId?: ActionId; disabled?: boolean }>).detail ?? {};

  lastActionClick = actionId ? `${actionId}${disabled ? ":disabled" : ""}` : "unknown";
  syncTurnProbe();
  logTurnProbe("button-click", state, enemyTimerStatus, actionId);
}

function mountCityPreviews(): Promise<void> {
  if (cityHero && !cityScene) {
    cityScene = mountCityHeroPreview(cityHero, hero.equipment, hero.appearance);
  } else {
    cityScene?.resume();
  }

  if (cityHeroWidgetRefs.portrait && !heroPortraitPreview) {
    const portraitMirrorParents = [cityHeroWidgetRefs.profilePortrait].filter(
      (parent): parent is HTMLElement => Boolean(parent),
    );

    heroPortraitPreview = mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment, hero.appearance, {
      mirrorParents: portraitMirrorParents,
    });
  } else {
    heroPortraitPreview?.setEquipment(hero.equipment);
    heroPortraitPreview?.setAppearance(hero.appearance);
  }

  return cityScene?.ready ?? Promise.resolve();
}

function focusCityShop(mode: "armory" | "weaponShop" | "magicShop"): void {
  if (mode === "armory") {
    cityScene?.focusArmory(true);
  } else if (mode === "weaponShop") {
    cityScene?.focusWeaponShop(true);
  } else {
    cityScene?.focusDefault(true);
  }
}

function focusCityDefaultFromShop(): void {
  cityScene?.focusDefault(true);
}

function syncCityShopLayout(menuTopY?: number): void {
  cityScene?.setShopMenuTop(menuTopY);
}

function createArenaEncounterForSelection(selection: ArenaMenuSelection, random = Math.random): ArenaEncounter {
  const encounter = selection.kind === "boss" ? createArenaBossEncounter(selection.bossId) : createArenaRandomEnemyEncounter(selection.tierId, selection.difficultyId, random);

  return {
    ...encounter,
    ...(selection.kind === "boss" && selection.duo ? { mode: "duoBossAi" as const } : {}),
    backgroundVariantId: pickArenaBackgroundVariantIdForTier(encounter.tierId),
  };
}

function createCombatStateForSelection(selection: ArenaMenuSelection, sourceHero: HeroState = hero, random = Math.random): CombatState {
  const encounter = createArenaEncounterForSelection(selection, random);

  return selection.kind === "boss" && selection.duo
    ? createDuoBossCombatStateFromHero(sourceHero, encounter, random)
    : createCombatStateFromHero(sourceHero, encounter);
}

function renderCityArenaMenu(): void {
  if (!cityArenaTierName || !cityArenaTierSelect || !cityArenaEasyReward || !cityArenaRandomReward || !cityArenaHardReward || !cityArenaBossList) {
    return;
  }

  const visibleTiers = getVisibleCityArenaTiers();
  const availableTiers = getAvailableCityArenaTiers(visibleTiers);
  const tier = getSelectedCityArenaTier(availableTiers);
  const randomOpponents = getArenaRandomOpponentsForTier(tier.id);
  const easyOpponent = randomOpponents.find((opponent) => opponent.difficultyId === "easy");
  const randomOpponent = randomOpponents.find((opponent) => opponent.difficultyId === DEFAULT_ARENA_DIFFICULTY_ID);
  const hardOpponent = randomOpponents.find((opponent) => opponent.difficultyId === "hard");
  const bosses = getArenaBossesForTier(tier.id);
  const autoFightUnlocked = isCityArenaAutoFightUnlockedForTier(tier.id);

  syncCityArenaMenuBackground(tier.id);
  syncCityArenaTierSelect(cityArenaTierSelect, visibleTiers, tier.id);
  cityArenaTierName.textContent = tier.name;
  syncCityArenaMenuEnergy();
  syncCityArenaQuestControls();
  syncCityArenaFightTitle(cityArenaEasyName, "Easy", ARENA_RANDOM_ENERGY_COST, getLockedCityArenaDifficultyLevelRequirement(tier.id, "easy"));
  syncCityArenaFightTitle(cityArenaRandomName, "Medium", ARENA_RANDOM_ENERGY_COST, getLockedCityArenaDifficultyLevelRequirement(tier.id, DEFAULT_ARENA_DIFFICULTY_ID));
  syncCityArenaFightTitle(cityArenaHardName, "Hard", ARENA_RANDOM_ENERGY_COST, getLockedCityArenaDifficultyLevelRequirement(tier.id, "hard"));
  setCityArenaBotButtonEnergyCost(cityArenaEasyButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaRandomButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaHardButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaEasyAutoButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaRandomAutoButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaHardAutoButton, ARENA_RANDOM_ENERGY_COST);
  syncCityArenaReward(cityArenaEasyReward, easyOpponent?.rewards.win ?? { gold: 4, xp: 4 });
  syncCityArenaReward(cityArenaRandomReward, randomOpponent?.rewards.win ?? { gold: 8, xp: 6 });
  syncCityArenaReward(cityArenaHardReward, hardOpponent?.rewards.win ?? { gold: 15, xp: 10 });
  syncCityArenaAutoFightVisibility(autoFightUnlocked);
  if (autoFightUnlocked) {
    scheduleCityArenaAutoRates(getCityArenaRandomAutoRateTargets(tier.id));
  }
  cityArenaBossList.replaceChildren(...(bosses.length > 0 ? bosses.map(createCityArenaBossButton) : [createCityArenaEmptyBossMessage()]));
  syncCityArenaBotControls();
}

function syncCityArenaMenuBackground(tierId: number): void {
  if (!cityArenaMenu) {
    return;
  }

  const variantId = getArenaBackgroundVariantIdsForTier(tierId)[0];
  const backgroundUrl = getArenaMenuBackgroundAssetUrlForTier(tierId, variantId);

  if (backgroundUrl) {
    cityArenaMenu.style.setProperty("--city-arena-menu-bg", toCssUrl(backgroundUrl));
  } else {
    cityArenaMenu.style.removeProperty("--city-arena-menu-bg");
  }

  cityArenaMenu.classList.toggle("city-arena-menu--tier-bg", Boolean(backgroundUrl));
}

function toCssUrl(url: string): string {
  return `url("${url.replace(/["\\]/g, "\\$&")}")`;
}

function getCityArenaRandomAutoRateTargets(tierId: number): CityArenaAutoRateTarget[] {
  return [
    { button: cityArenaEasyAutoButton, output: cityArenaEasyAutoRate, selection: { kind: "random", tierId, difficultyId: "easy" } },
    { button: cityArenaRandomAutoButton, output: cityArenaRandomAutoRate, selection: { kind: "random", tierId, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID } },
    { button: cityArenaHardAutoButton, output: cityArenaHardAutoRate, selection: { kind: "random", tierId, difficultyId: "hard" } },
  ];
}

function syncCityArenaMenuEnergy(): void {
  if (!cityArenaEnergy) {
    return;
  }

  renderCityArenaEnergyBadge(cityArenaEnergy, getHeroArenaEnergy(hero), "city-arena-menu__energy--empty");
}

function syncCityArenaQuestControls(): void {
  const status = getHeroArenaWinQuestStatus(hero);
  const isNewQuest = !status.claimed && !status.openedToday;
  const isQuestDone = status.claimed;
  const questButtonTitle = isNewQuest
    ? "New daily quest."
    : status.claimed
      ? "Quest reward claimed."
      : status.ready
        ? "Quest reward ready."
        : `Win ${status.goal - status.wins} more arena fights.`;

  if (isQuestDone) {
    isCityArenaQuestPanelOpen = false;
  }
  cityArenaMetaRow?.classList.toggle("city-arena-menu__meta-row--quest-hidden", isQuestDone);
  if (cityArenaQuestButton) {
    cityArenaQuestButton.hidden = isQuestDone;
    cityArenaQuestButton.classList.toggle("city-arena-menu__quest-button--ready", status.ready);
    cityArenaQuestButton.classList.toggle("city-arena-menu__quest-button--claimed", status.claimed);
    cityArenaQuestButton.classList.toggle("city-arena-menu__quest-button--new", isNewQuest);
    cityArenaQuestButton.setAttribute("aria-expanded", String(isCityArenaQuestPanelOpen));
    cityArenaQuestButton.title = questButtonTitle;
  }
  if (cityArenaQuestLabel) {
    cityArenaQuestLabel.textContent = isNewQuest ? "NEW QUEST!" : "QUEST";
  }
  if (cityArenaQuestProgress) {
    cityArenaQuestProgress.textContent = status.claimed ? "DONE" : `${status.wins}/${status.goal}`;
  }

  syncCityArenaQuestPanel(status);
}

function syncCityArenaQuestPanel(status: HeroArenaWinQuestStatus = getHeroArenaWinQuestStatus(hero)): void {
  if (cityArenaQuestBackdrop) {
    cityArenaQuestBackdrop.hidden = !isCityArenaQuestPanelOpen;
  }
  if (cityArenaQuestPanel) {
    cityArenaQuestPanel.hidden = !isCityArenaQuestPanelOpen;
  }
  if (cityArenaQuestStatus) {
    cityArenaQuestStatus.textContent = status.claimed ? "DONE" : `${status.wins}/${status.goal}`;
  }
  if (cityArenaQuestText) {
    cityArenaQuestText.textContent = status.claimed
      ? "Reward claimed."
      : status.ready
        ? "Quest complete. Claim your reward."
        : "Win 5 arena fights today.";
  }
  if (cityArenaQuestRewards) {
    const energyReward = createCityArenaRewardItem(DAILY_ARENA_ENERGY_ICON_ASSET_URL, "Arena energy", status.rewards.arenaEnergy);
    const goldReward = createCityArenaRewardItem(SHOP_GOLD_COIN_ICON_ASSET_URL, "Gold", status.rewards.gold);

    cityArenaQuestRewards.replaceChildren(energyReward, goldReward);
  }
  if (cityArenaQuestClaimButton) {
    cityArenaQuestClaimButton.disabled = !status.ready;
    cityArenaQuestClaimButton.textContent = status.claimed ? "CLAIMED" : "CLAIM";
  }
}

function setCityArenaQuestPanelOpen(open: boolean): void {
  if (open) {
    const now = new Date().toISOString();
    const nextHero = markHeroArenaWinQuestOpened(hero, now);

    if (nextHero !== hero) {
      hero = nextHero;
      saveLocalHeroSave(hero);
      queueHeroCloudSave("arena-win-quest-opened");
    }
  }

  isCityArenaQuestPanelOpen = open;
  syncCityArenaQuestControls();
}

function toggleCityArenaQuestPanel(): void {
  setCityArenaQuestPanelOpen(!isCityArenaQuestPanelOpen);
}

function claimCityArenaQuestReward(): void {
  const claimed = claimHeroArenaWinQuestReward(hero, new Date().toISOString());

  if (!claimed.ok) {
    syncCityArenaQuestControls();
    return;
  }

  hero = claimed.hero;
  saveLocalHeroSave(hero);
  queueHeroCloudSave("arena-win-quest");
  renderCityHero();
  renderCityArenaMenu();
}

function isCityArenaAutoFightUnlockedForTier(tierId: number): boolean {
  if (canUseArenaAdminControls()) {
    return true;
  }

  const bosses = getArenaBossesForTier(tierId);

  return bosses.length > 0 && bosses.some((boss) => hasHeroDefeatedArenaBoss(hero, boss.id));
}

function getCityArenaDifficultyLevelRequirement(tierId: number, difficultyId: ArenaDifficultyId): number {
  if (tierId !== DEFAULT_ARENA_TIER_ID) {
    return 0;
  }

  return CITY_ARENA_TIER_ONE_DIFFICULTY_LEVEL_REQUIREMENTS[difficultyId] ?? 0;
}

function getLockedCityArenaDifficultyLevelRequirement(tierId: number, difficultyId: ArenaDifficultyId): number {
  const requirement = getCityArenaDifficultyLevelRequirement(tierId, difficultyId);

  return requirement > 0 && hero.level < requirement ? requirement : 0;
}

function getArenaSelectionLevelRequirement(selection: ArenaMenuSelection): number {
  return selection.kind === "random" ? getCityArenaDifficultyLevelRequirement(selection.tierId, selection.difficultyId) : 0;
}

function getArenaSelectionLevelGateTitle(selection: ArenaMenuSelection): string {
  const requirement = getArenaSelectionLevelRequirement(selection);

  if (requirement <= 0 || hero.level >= requirement) {
    return "";
  }

  return `Requires LVL ${requirement}.`;
}

function syncCityArenaAutoFightVisibility(unlocked: boolean): void {
  if (!unlocked) {
    cityArenaAutoRateToken += 1;
  }

  getCityArenaRandomAutoRateTargets(activeArenaTierId).forEach(({ button, output }) => {
    if (!button) {
      return;
    }

    button.hidden = !unlocked;
    button.closest(".city-arena-menu__fight-row")?.classList.toggle("city-arena-menu__fight-row--auto-hidden", !unlocked);

    if (unlocked) {
      return;
    }

    delete button.dataset.autoFightRate;
    delete button.dataset.autoFightRateKey;
    button.removeAttribute("aria-label");
    button.classList.remove("city-arena-menu__auto-fight--safe", "city-arena-menu__auto-fight--risky", "city-arena-menu__auto-fight--danger");
    if (output) {
      output.textContent = "";
    }
  });
}

function syncCityArenaFightTitle(title: HTMLElement | null | undefined, label: string, energyCost: number, levelRequirement = 0): void {
  if (!title) {
    return;
  }

  const button = title.closest<HTMLElement>(".city-arena-menu__fight");
  const text = document.createElement("span");
  const cost = createCityArenaEnergyCostItem(energyCost);
  const existingRibbon = button?.querySelector<HTMLElement>("[data-city-level-ribbon='arena']");

  title.classList.add("city-arena-menu__fight-title");
  text.className = "city-arena-menu__fight-title-text";
  text.textContent = label;
  cost.classList.add("city-arena-menu__fight-cost");
  title.replaceChildren(text, cost);
  existingRibbon?.remove();

  if (levelRequirement > 0) {
    const levelRibbon = createCityLevelRibbon(levelRequirement, "city-arena-menu__fight-level", "arena");

    if (button) {
      button.append(levelRibbon);
    } else {
      title.append(levelRibbon);
    }
  }
}

function createCityLevelRibbon(levelRequirement: number, className: string, key: string): HTMLElement {
  const ribbon = document.createElement("span");
  const label = document.createElement("span");
  const amount = document.createElement("span");

  ribbon.className = `city-level-ribbon ${className}`;
  ribbon.dataset.cityLevelRibbon = key;
  ribbon.setAttribute("aria-label", `Requires level ${levelRequirement}`);
  label.className = "city-level-ribbon__label";
  label.textContent = "LVL";
  amount.className = "city-level-ribbon__amount";
  amount.textContent = String(levelRequirement);
  ribbon.append(label, amount);

  return ribbon;
}

function scheduleCityArenaAutoRates(targets: readonly CityArenaAutoRateTarget[]): void {
  const token = ++cityArenaAutoRateToken;
  const sourceHero = hero;
  const pendingTargets: PendingCityArenaAutoRateTarget[] = [];

  targets.forEach((target) => {
    if (!target.button || !target.output) {
      return;
    }

    if (getArenaSelectionLevelGateTitle(target.selection)) {
      delete target.button.dataset.autoFightRateKey;
      delete target.button.dataset.autoFightRate;
      syncCityArenaAutoRate(target, undefined);
      return;
    }

    const cacheKey = getCityArenaAutoRateCacheKey(target.selection, sourceHero);
    const cachedRate = cityArenaAutoRateCache.get(cacheKey);

    target.button.dataset.autoFightRateKey = cacheKey;

    if (cachedRate === undefined) {
      syncCityArenaAutoRate(target, undefined);
      pendingTargets.push({ ...target, cacheKey, sourceHero });
      return;
    }

    syncCityArenaAutoRate(target, cachedRate);
  });

  if (pendingTargets.length <= 0) {
    return;
  }

  window.requestAnimationFrame(() => computeNextCityArenaAutoRate(token, pendingTargets, 0));
}

function computeNextCityArenaAutoRate(token: number, targets: readonly PendingCityArenaAutoRateTarget[], index: number): void {
  if (token !== cityArenaAutoRateToken || index >= targets.length) {
    return;
  }

  const target = targets[index];
  const rate = estimateCityArenaAutoSuccessRate(target.selection, target.cacheKey, target.sourceHero);

  cityArenaAutoRateCache.set(target.cacheKey, rate);

  if (target.button?.dataset.autoFightRateKey === target.cacheKey) {
    syncCityArenaAutoRate(target, rate);
  }

  window.requestAnimationFrame(() => computeNextCityArenaAutoRate(token, targets, index + 1));
}

function syncCityArenaAutoRate(target: CityArenaAutoRateTarget, rate: number | undefined): void {
  if (!target.output || !target.button) {
    return;
  }

  const displayRate = rate === undefined ? undefined : getCityArenaAutoRateDisplayValue(rate);
  const label = displayRate === undefined ? "..." : `${displayRate}%`;

  target.output.textContent = label;
  target.button.dataset.autoFightRate = rate === undefined ? "" : `${rate}`;
  target.button.setAttribute(
    "aria-label",
    displayRate === undefined ? "Auto fight. Estimating success chance." : `Auto fight. Estimated success chance ${displayRate} percent.`,
  );
  target.button.title = getCityArenaAutoFightTitle(target.button, rate);
  target.button.classList.toggle("city-arena-menu__auto-fight--safe", typeof rate === "number" && rate >= 75);
  target.button.classList.toggle("city-arena-menu__auto-fight--risky", typeof rate === "number" && rate >= 40 && rate < 75);
  target.button.classList.toggle("city-arena-menu__auto-fight--danger", typeof rate === "number" && rate < 40);
}

function getCityArenaAutoRateDisplayValue(rate: number): number {
  const clampedRate = Math.max(0, Math.min(100, rate));

  if (clampedRate <= 0) {
    return 0;
  }

  return Math.min(95, Math.max(5, Math.round(clampedRate / 5) * 5));
}

function getCityArenaAutoFightTitle(button: HTMLButtonElement, rate?: number): string {
  const disabledTitle = getCityArenaBotDisabledTitle(getCityArenaBotButtonEnergyCost(button));

  if (disabledTitle) {
    return disabledTitle;
  }

  const displayRate = rate === undefined ? undefined : getCityArenaAutoRateDisplayValue(rate);

  return rate === undefined
    ? "Instantly resolve this fight with auto battle."
    : `Instantly resolve this fight. Estimated auto success: ${displayRate}%.`;
}

function estimateCityArenaAutoSuccessRate(selection: ArenaMenuSelection, cacheKey: string, sourceHero: HeroState): number {
  let wins = 0;

  for (let attempt = 0; attempt < AUTO_FIGHT_SUCCESS_RATE_SIMULATIONS; attempt += 1) {
    const random = createSeededRandom(`${cacheKey}:${attempt}`);
    const initialState = createCombatStateForSelection(selection, sourceHero, random);
    const result = resolveAutoCombat(initialState, {
      maxTurns: AUTO_FIGHT_MAX_TURNS,
      random,
    });

    if (result.result === "win") {
      wins += 1;
    }
  }

  return Math.round((wins / AUTO_FIGHT_SUCCESS_RATE_SIMULATIONS) * 100);
}

function getCityArenaAutoRateCacheKey(selection: ArenaMenuSelection, sourceHero: HeroState = hero): string {
  return JSON.stringify({
    hero: getCityArenaAutoRateHeroSignature(sourceHero),
    selection,
    simulations: AUTO_FIGHT_SUCCESS_RATE_SIMULATIONS,
    maxTurns: AUTO_FIGHT_MAX_TURNS,
  });
}

function getCityArenaAutoRateHeroSignature(sourceHero: HeroState): unknown {
  return {
    level: sourceHero.level,
    baseStats: sourceHero.baseStats,
    equipment: sourceHero.equipment,
    weaponEnchantments: sourceHero.weaponEnchantments,
    bowShotCapacity: sourceHero.bowShotCapacity,
    stats: deriveHeroStats(sourceHero),
  };
}

function createSeededRandom(seedText: string): () => number {
  let seed = 0x811c9dc5;

  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }

  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getVisibleCityArenaTiers(): ArenaTierDefinition[] {
  const tiers = getArenaTierDefinitions().filter((tier) => tier.randomOpponentIds.length > 0);

  return tiers.length > 0 ? tiers : [getArenaTierDefinition(DEFAULT_ARENA_TIER_ID)];
}

function getAvailableCityArenaTiers(visibleTiers = getVisibleCityArenaTiers()): ArenaTierDefinition[] {
  const tiers = visibleTiers.filter(isCityArenaTierUnlocked);

  return tiers.length > 0 ? tiers : [getArenaTierDefinition(DEFAULT_ARENA_TIER_ID)];
}

function isCityArenaTierUnlocked(tier: ArenaTierDefinition): boolean {
  return !tier.unlockBossId || hero.defeatedArenaBossIds.includes(tier.unlockBossId);
}

function getSelectedCityArenaTier(availableTiers = getAvailableCityArenaTiers()): ArenaTierDefinition {
  const selectedTier = availableTiers.find((tier) => tier.id === activeArenaTierId) ?? availableTiers[0] ?? getArenaTierDefinition(DEFAULT_ARENA_TIER_ID);

  activeArenaTierId = selectedTier.id;
  return selectedTier;
}

function syncCityArenaTierSelect(select: HTMLSelectElement, visibleTiers: readonly ArenaTierDefinition[], selectedTierId: number): void {
  select.replaceChildren(...visibleTiers.map((tier) => createCityArenaTierOption(tier)));
  select.value = `${selectedTierId}`;
  select.disabled = visibleTiers.length <= 1;
}

function createCityArenaTierOption(tier: ArenaTierDefinition): HTMLOptionElement {
  const option = document.createElement("option");
  const isUnlocked = isCityArenaTierUnlocked(tier);

  option.value = `${tier.id}`;
  option.disabled = !isUnlocked;
  option.textContent = isUnlocked ? tier.name : `${tier.name} - Locked`;
  if (!isUnlocked) {
    option.title = "Defeat previous boss to unlock";
  }
  return option;
}

function createCityArenaBossButton(boss: ArenaBossDefinition): HTMLElement {
  const card = document.createElement("div");
  const button = document.createElement("button");
  const duoWrap = document.createElement("div");
  const duoButton = document.createElement("button");
  const duoChoices = document.createElement("div");
  const duoBotButton = document.createElement("button");
  const duoOnlineButton = document.createElement("button");
  const name = document.createElement("strong");
  const rewardLine = document.createElement("span");
  const reward = document.createElement("span");
  const uniqueReward = document.createElement("span");
  const bossDisabledTitle = getCityArenaBossDisabledTitle(boss, ARENA_BOSS_ENERGY_COST);
  const duoDisabledTitle = getCityArenaBossDisabledTitle(boss, ARENA_DUO_BOSS_ENERGY_COST);

  card.className = "city-arena-menu__boss-card";
  button.className = "city-arena-menu__boss";
  button.type = "button";
  button.disabled = Boolean(bossDisabledTitle);
  button.title = bossDisabledTitle;
  button.dataset.cityArenaBotButton = "true";
  button.dataset.cityArenaBossTierId = `${boss.tierId}`;
  button.dataset.cityArenaEnergyCost = `${ARENA_BOSS_ENERGY_COST}`;
  syncCityArenaBossTitle(name, "Boss", ARENA_BOSS_ENERGY_COST);
  name.title = boss.name;
  rewardLine.className = "city-arena-menu__boss-reward-line";
  reward.className = "city-arena-menu__reward";
  syncCityArenaReward(reward, boss.rewards.win);
  uniqueReward.className = "city-arena-menu__unique-reward";
  uniqueReward.textContent = "+ unique reward";
  rewardLine.append(reward, uniqueReward);
  button.append(name, rewardLine);
  button.addEventListener("click", () => {
    void startSelectedArena({ kind: "boss", bossId: boss.id });
  });
  duoButton.className = "city-arena-menu__boss-duo";
  duoButton.type = "button";
  duoButton.replaceChildren(createCityArenaDuoLabel(), createCityArenaEnergyCostItem(ARENA_DUO_BOSS_ENERGY_COST));
  duoButton.disabled = Boolean(duoDisabledTitle);
  duoButton.title = duoDisabledTitle || "Fight this boss with an AI helper.";
  duoButton.dataset.cityArenaBotButton = "true";
  duoButton.dataset.cityArenaBossTierId = `${boss.tierId}`;
  duoButton.dataset.cityArenaEnergyCost = `${ARENA_DUO_BOSS_ENERGY_COST}`;
  duoButton.dataset.defaultTitle = "Fight this boss with an AI helper.";
  duoButton.addEventListener("click", () => {
    if (duoButton.disabled) {
      return;
    }

    duoChoices.hidden = !duoChoices.hidden;
  });
  duoChoices.className = "city-arena-menu__boss-duo-choices";
  duoChoices.hidden = true;
  duoBotButton.className = "city-arena-menu__boss-duo-choice";
  duoBotButton.type = "button";
  duoBotButton.textContent = "BOT";
  duoBotButton.title = "Fight this boss with an AI helper.";
  duoBotButton.dataset.cityArenaBotButton = "true";
  duoBotButton.dataset.cityArenaBossTierId = `${boss.tierId}`;
  duoBotButton.dataset.cityArenaEnergyCost = `${ARENA_DUO_BOSS_ENERGY_COST}`;
  duoBotButton.dataset.defaultTitle = "Fight this boss with an AI helper.";
  duoBotButton.addEventListener("click", () => {
    void startSelectedArena({ kind: "boss", bossId: boss.id, duo: true });
  });
  duoOnlineButton.className = "city-arena-menu__boss-duo-choice";
  duoOnlineButton.type = "button";
  duoOnlineButton.textContent = "ONLINE";
  duoOnlineButton.title = "Create an online help request.";
  duoOnlineButton.dataset.cityArenaBotButton = "true";
  duoOnlineButton.dataset.cityArenaBossTierId = `${boss.tierId}`;
  duoOnlineButton.dataset.cityArenaEnergyCost = `${ARENA_DUO_BOSS_ENERGY_COST}`;
  duoOnlineButton.dataset.defaultTitle = "Create an online help request.";
  duoOnlineButton.addEventListener("click", () => {
    void handleCreateOnlineDuoBossRoom(boss);
  });
  duoChoices.append(duoBotButton, duoOnlineButton);
  duoWrap.className = "city-arena-menu__boss-duo-wrap";
  duoWrap.append(duoButton, duoChoices);
  card.append(button, duoWrap);

  return card;
}

function syncCityArenaBossTitle(title: HTMLElement, label: string, energyCost: number): void {
  const text = document.createElement("span");
  const cost = createCityArenaEnergyCostItem(energyCost);

  title.classList.add("city-arena-menu__boss-title");
  text.className = "city-arena-menu__boss-title-text";
  text.textContent = label;
  cost.classList.add("city-arena-menu__boss-cost");
  title.replaceChildren(text, cost);
}

function createCityArenaDuoLabel(): HTMLElement {
  const label = document.createElement("span");

  label.className = "city-arena-menu__boss-duo-label";
  label.textContent = "Duo";
  return label;
}

function getCityArenaBossDisabledTitle(boss: ArenaBossDefinition, energyCost: number): string {
  const botDisabledTitle = getCityArenaBotDisabledTitle(energyCost);

  if (botDisabledTitle) {
    return botDisabledTitle;
  }

  return getCityArenaBossVictoryLimitTitle(boss.tierId);
}

function getCityArenaBossVictoryLimitTitle(tierId: number): string {
  return hasHeroArenaBossVictoryForTier(hero, tierId) ? "Boss victory limit reached for this tier today." : "";
}

function createCityArenaEmptyBossMessage(): HTMLElement {
  const message = document.createElement("p");

  message.className = "city-arena-menu__empty";
  message.textContent = "No boss in this tier yet.";

  return message;
}

function syncCityArenaReward(container: HTMLElement, reward: { gold: number; xp: number }, energyCost?: number): void {
  const rewardItems = [
    createCityArenaRewardItem(SHOP_GOLD_COIN_ICON_ASSET_URL, "Gold", reward.gold),
    createCityArenaRewardItem(SHOP_XP_ICON_ASSET_URL, "XP", reward.xp),
  ];

  container.setAttribute(
    "aria-label",
    energyCost === undefined
      ? `${reward.gold} gold, ${reward.xp} XP`
      : `${energyCost} arena energy cost, ${reward.gold} gold, ${reward.xp} XP`,
  );
  container.replaceChildren(...(energyCost === undefined ? rewardItems : [createCityArenaEnergyCostItem(energyCost), ...rewardItems]));
}

function createCityArenaEnergyCostItem(value: number): HTMLElement {
  const item = createCityArenaRewardItem(DAILY_ARENA_ENERGY_ICON_ASSET_URL, "Arena energy", value);

  item.classList.add("city-arena-menu__reward-item--energy");
  item.setAttribute("aria-label", `${value} arena energy cost`);
  return item;
}

function createCityArenaRewardItem(iconUrl: string, label: string, value: number): HTMLElement {
  const item = document.createElement("span");
  const icon = document.createElement("img");
  const amount = document.createElement("span");

  item.className = "city-arena-menu__reward-item";
  item.setAttribute("aria-label", `${value} ${label}`);
  icon.className = "city-arena-menu__reward-icon";
  icon.src = iconUrl;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  amount.className = "city-arena-menu__reward-amount";
  amount.textContent = String(value);
  item.append(icon, amount);
  return item;
}

function isPvpRoomBlockingArena(): boolean {
  return Boolean(pvpSession);
}

function canCancelPvpRoom(): boolean {
  return Boolean(pvpSession && pvpSession.seat === "host" && pvpSnapshot?.status === "waiting");
}

function syncCityArenaNoEnergyPanel(panel: HTMLElement | null | undefined, noEnergy: boolean): void {
  if (!panel) {
    return;
  }

  let ribbon = panel.querySelector<HTMLElement>(":scope > .city-arena-menu__no-energy");

  panel.classList.toggle("city-arena-menu__choice--no-energy", noEnergy);
  if (!noEnergy) {
    ribbon?.remove();
    return;
  }

  if (!ribbon) {
    ribbon = createCityArenaNoEnergyRibbon();
    panel.append(ribbon);
  }
}

function createCityArenaNoEnergyRibbon(): HTMLElement {
  const ribbon = document.createElement("span");
  const icon = document.createElement("img");
  const label = document.createElement("span");

  ribbon.className = "city-arena-menu__no-energy";
  ribbon.setAttribute("aria-hidden", "true");
  icon.className = "city-arena-menu__no-energy-icon";
  icon.src = DAILY_ARENA_ENERGY_ICON_ASSET_URL;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  label.textContent = "NO ENERGY";
  ribbon.append(icon, label);
  return ribbon;
}

function syncCityArenaBotControls(): void {
  const tierId = getSelectedCityArenaTier().id;
  const currentArenaEnergy = getHeroArenaEnergy(hero).current;

  getCityArenaRandomFightTargets(tierId).forEach(({ button, selection }) => {
    if (!button || selection.kind !== "random") {
      return;
    }
    const title = getCityArenaSelectionDisabledTitle(selection);
    const disabled = Boolean(title);

    button.disabled = disabled;
    button.title = title;
    syncCityArenaNoEnergyPanel(button.closest<HTMLElement>(".city-arena-menu__fight-row"), currentArenaEnergy < getArenaSelectionEnergyCost(selection));
  });
  getCityArenaRandomAutoRateTargets(tierId).forEach(({ button, selection }) => {
    if (!button) {
      return;
    }
    const title = getCityArenaSelectionDisabledTitle(selection);
    const disabled = Boolean(title);
    const rateText = button.dataset.autoFightRate;
    const rate = rateText ? Number(rateText) : undefined;

    button.disabled = disabled;
    button.title = title || getCityArenaAutoFightTitle(button, typeof rate === "number" && Number.isFinite(rate) ? rate : undefined);
  });
  cityArenaBossList?.querySelectorAll<HTMLButtonElement>("[data-city-arena-bot-button]").forEach((button) => {
    const title = getCityArenaBotDisabledTitle(getCityArenaBotButtonEnergyCost(button));
    const bossTierLimitTitle = title ? "" : getCityArenaBossVictoryLimitTitle(Number(button.dataset.cityArenaBossTierId));
    const buttonTitle = title || bossTierLimitTitle;

    button.disabled = Boolean(buttonTitle);
    button.title = buttonTitle || button.dataset.defaultTitle || "";
  });
  cityArenaBossList?.querySelectorAll<HTMLElement>(".city-arena-menu__boss-card").forEach((card) => {
    const bossButton = card.querySelector<HTMLButtonElement>(".city-arena-menu__boss");
    const energyCost = bossButton ? getCityArenaBotButtonEnergyCost(bossButton) : ARENA_BOSS_ENERGY_COST;

    syncCityArenaNoEnergyPanel(card, currentArenaEnergy < energyCost);
  });
}

function getCityArenaRandomFightTargets(tierId: number): CityArenaAutoRateTarget[] {
  return [
    { button: cityArenaEasyButton, output: null, selection: { kind: "random", tierId, difficultyId: "easy" } },
    { button: cityArenaRandomButton, output: null, selection: { kind: "random", tierId, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID } },
    { button: cityArenaHardButton, output: null, selection: { kind: "random", tierId, difficultyId: "hard" } },
  ];
}

function setCityArenaBotButtonEnergyCost(button: HTMLButtonElement | null, energyCost: number): void {
  if (button) {
    button.dataset.cityArenaEnergyCost = `${energyCost}`;
  }
}

function getCityArenaBotButtonEnergyCost(button: HTMLButtonElement): number {
  return normalizeArenaEnergyCost(Number(button.dataset.cityArenaEnergyCost));
}

function normalizeArenaEnergyCost(value: number): number {
  if (!Number.isFinite(value)) {
    return ARENA_RANDOM_ENERGY_COST;
  }

  return Math.max(ARENA_RANDOM_ENERGY_COST, Math.floor(value));
}

function getCityArenaBotBlockingTitle(): string {
  if (isPvpRoomBlockingArena()) {
    return "Cancel online room before fighting bots.";
  }

  if (arenaEnergySpendPending) {
    return "Spending arena energy...";
  }

  if (cityArenaAutoFightPending) {
    return "Resolving auto fight...";
  }

  return "";
}

function getCityArenaBotDisabledTitle(energyCost = ARENA_RANDOM_ENERGY_COST): string {
  const blockingTitle = getCityArenaBotBlockingTitle();

  if (blockingTitle) {
    return blockingTitle;
  }

  const currentArenaEnergy = getHeroArenaEnergy(hero).current;

  if (currentArenaEnergy < energyCost) {
    return currentArenaEnergy <= 0 ? "No arena energy left today." : `Not enough arena energy (${currentArenaEnergy}/${energyCost}).`;
  }

  return "";
}

function getCityArenaSelectionDisabledTitle(selection: ArenaMenuSelection): string {
  const blockingTitle = getCityArenaBotBlockingTitle();

  if (blockingTitle) {
    return blockingTitle;
  }

  return getArenaSelectionLevelGateTitle(selection) || getCityArenaBotDisabledTitle(getArenaSelectionEnergyCost(selection));
}

function getMagicShopLevelGateTitle(): string {
  return hero.level >= MAGIC_SHOP_LEVEL_REQUIREMENT ? "" : `Requires LVL ${MAGIC_SHOP_LEVEL_REQUIREMENT}.`;
}

function syncMagicShopButtonLock(): void {
  if (!magicShopButton) {
    return;
  }

  const title = getMagicShopLevelGateTitle();
  const locked = Boolean(title);
  let levelRibbon = magicShopButton.querySelector<HTMLElement>("[data-city-level-ribbon='magic-shop']");

  magicShopButton.classList.toggle("city-menu__button--locked", locked);
  magicShopButton.toggleAttribute("aria-disabled", locked);
  magicShopButton.title = title;

  if (!locked) {
    levelRibbon?.remove();
    return;
  }

  if (!levelRibbon) {
    levelRibbon = createCityLevelRibbon(MAGIC_SHOP_LEVEL_REQUIREMENT, "city-menu__button-level", "magic-shop");
    magicShopButton.insertBefore(levelRibbon, magicShopButton.lastElementChild);
  }
}

function setPvpStatus(message: string): void {
  if (cityPvpStatus) {
    cityPvpStatus.textContent = message;
  }
}

function setPvpControlsBusy(busy: boolean): void {
  pvpControlsBusy = busy;
  syncPvpControls();
}

function setActiveOnlineRoomKind(roomKind: PvpRoomKind): void {
  if (activeOnlineRoomKind === roomKind) {
    return;
  }

  activeOnlineRoomKind = roomKind;
  pvpRoomsVisible = false;
  pvpRoomList = [];
  syncPvpControls();
  setPvpStatus("");
}

function setCityArenaOnlineViewOpen(open: boolean): void {
  if (isCityArenaOnlineViewOpen === open) {
    return;
  }

  isCityArenaOnlineViewOpen = open;
  if (cityArenaMainView) {
    cityArenaMainView.hidden = open;
  }
  if (cityArenaOnlinePanel) {
    cityArenaOnlinePanel.hidden = !open;
  }
  cityArenaMenu?.classList.toggle("city-arena-menu--online-open", open);
  if (open) {
    setCityArenaQuestPanelOpen(false);
    syncPvpControls();
  }
}

function syncPvpControls(): void {
  const disabled = pvpControlsBusy || Boolean(pvpSession);
  const isPveTab = activeOnlineRoomKind === "duoBoss";

  syncOnlineTabs();

  if (cityPvpCreateButton) {
    cityPvpCreateButton.hidden = isPveTab;
    cityPvpCreateButton.textContent = "CREATE";
    cityPvpCreateButton.disabled = disabled || isPveTab;
    cityPvpCreateButton.title = "Create PvP room.";
  }
  if (cityPvpJoinButton) {
    cityPvpJoinButton.textContent = "REFRESH";
    cityPvpJoinButton.disabled = disabled;
    cityPvpJoinButton.title = isPveTab ? "Refresh PVE help requests." : "Refresh PvP rooms.";
  }
  syncCityArenaBotControls();
  renderPvpRoomList();
}

function syncOnlineTabs(): void {
  syncOnlineTab(cityOnlinePveTab, activeOnlineRoomKind === "duoBoss");
  syncOnlineTab(cityOnlinePvpTab, activeOnlineRoomKind === "pvp");
}

function syncOnlineTab(button: HTMLButtonElement | null, isActive: boolean): void {
  if (!button) {
    return;
  }

  button.classList.toggle("city-arena-menu__online-tab--active", isActive);
  button.setAttribute("aria-selected", isActive ? "true" : "false");
}

function renderPvpRoomList(): void {
  if (!cityPvpRoomList) {
    return;
  }

  const entries = getVisiblePvpRoomEntries();
  const shouldShow = isCityArenaOnlineViewOpen || pvpRoomsVisible || entries.length > 0;

  cityPvpRoomList.hidden = !shouldShow;
  if (!shouldShow) {
    cityPvpRoomList.replaceChildren();
    return;
  }

  if (pvpControlsBusy && entries.length === 0) {
    cityPvpRoomList.replaceChildren(createPvpRoomListMessage("Refreshing..."));
    return;
  }

  cityPvpRoomList.replaceChildren(...(entries.length > 0 ? entries.map(createPvpRoomListItem) : [createPvpRoomListMessage("No rooms yet.")]));
}

function getVisiblePvpRoomEntries(): PvpRoomListEntry[] {
  const entries = pvpRoomList.filter((entry) => (entry.roomKind ?? "pvp") === activeOnlineRoomKind);
  const currentEntry = getCurrentPvpRoomListEntry();

  if (currentEntry && !entries.some((entry) => entry.roomCode === currentEntry.roomCode)) {
    entries.unshift(currentEntry);
  }

  return entries;
}

function getCurrentPvpRoomListEntry(): PvpRoomListEntry | undefined {
  if (!pvpSession || pvpSession.seat !== "host" || pvpSnapshot?.status !== "waiting") {
    return undefined;
  }
  const roomKind = pvpSession.roomKind ?? pvpSnapshot.roomKind ?? "pvp";

  if (roomKind !== activeOnlineRoomKind) {
    return undefined;
  }

  const now = Date.now();

  return {
    roomCode: pvpSession.roomCode,
    roomKind,
    hostName: hero.name,
    hostLevel: hero.level,
    bossId: pvpSnapshot.bossId,
    bossName: pvpSnapshot.bossName,
    bossTierId: pvpSnapshot.bossTierId,
    createdAt: pvpSnapshot.serverNow || now,
    updatedAt: pvpSnapshot.serverNow || now,
  };
}

function createPvpRoomListItem(room: PvpRoomListEntry): HTMLElement {
  const item = document.createElement("div");
  const copy = document.createElement("div");
  const name = document.createElement("strong");
  const meta = document.createElement("span");
  const button = document.createElement("button");
  const isOwnRoom = pvpSession?.roomCode === room.roomCode && pvpSession.seat === "host" && pvpSnapshot?.status === "waiting";

  item.className = "city-arena-menu__pvp-room";
  copy.className = "city-arena-menu__pvp-room-copy";
  name.className = "city-arena-menu__pvp-room-name";
  name.textContent = isOwnRoom ? `${room.hostName} (YOU)` : room.hostName;
  meta.className = "city-arena-menu__pvp-room-meta";
  meta.textContent = formatPvpRoomListMeta(room);
  button.className = "city-arena-menu__pvp-button city-arena-menu__pvp-room-button";
  button.type = "button";
  button.textContent = isOwnRoom ? "CANCEL" : (room.roomKind === "duoBoss" ? "HELP" : "JOIN");
  button.disabled = pvpControlsBusy || (!isOwnRoom && Boolean(pvpSession));
  button.addEventListener("click", () => {
    if (isOwnRoom) {
      void handleCancelPvpRoom();
      return;
    }

    void handleJoinListedPvpRoom(room.roomCode);
  });

  copy.append(name, meta);
  item.append(copy, button);
  return item;
}

function formatPvpRoomListMeta(room: PvpRoomListEntry): string {
  if (room.roomKind === "duoBoss") {
    const bossName = room.bossName ?? "Boss";
    const tierText = room.bossTierId ? `T${room.bossTierId}` : "PVE";

    return `LV ${room.hostLevel} - ${tierText} - ${bossName}`;
  }

  return `LV ${room.hostLevel} - WAITING`;
}

function createPvpRoomListMessage(message: string): HTMLElement {
  const item = document.createElement("div");

  item.className = "city-arena-menu__pvp-room-empty";
  item.textContent = message;
  return item;
}

async function refreshPvpRoomList(options: { silent?: boolean } = {}): Promise<void> {
  pvpRoomsVisible = true;
  setPvpControlsBusy(true);
  if (!options.silent) {
    setPvpStatus("");
  }

  try {
    const response = await listPvpRooms(activeOnlineRoomKind);

    pvpRoomList = response.rooms;
    setPvpControlsBusy(false);
    if (!options.silent) {
      setPvpStatus(response.rooms.length > 0 ? "Choose a room." : "");
    }
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP rooms failed.");
    setPvpControlsBusy(false);
  }
}

async function handleCreatePvpRoom(): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }
  if (activeOnlineRoomKind === "duoBoss") {
    setPvpStatus("Use boss DUO Online to create a help request.");
    return;
  }

  setPvpControlsBusy(true);
  setPvpStatus("Creating room...");

  try {
    beginPvpRoom(await createPvpRoom(hero));
    await refreshPvpRoomList({ silent: true });
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP room failed.");
    setPvpControlsBusy(false);
  }
}

async function handleCreateOnlineDuoBossRoom(boss: ArenaBossDefinition): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }

  const disabledTitle = getCityArenaBossDisabledTitle(boss, ARENA_DUO_BOSS_ENERGY_COST);

  if (disabledTitle) {
    renderCityArenaMenu();
    window.alert(disabledTitle);
    return;
  }

  activeOnlineRoomKind = "duoBoss";
  pvpRoomsVisible = true;
  setCityArenaOnlineViewOpen(true);
  setPvpControlsBusy(true);
  setPvpStatus("Creating help request...");

  try {
    beginPvpRoom(await createDuoBossRoom(hero, boss.id));
    await refreshPvpRoomList({ silent: true });
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "Online duo room failed.");
    setPvpControlsBusy(false);
  }
}

async function handleSearchPvpRooms(): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }

  pvpRoomsVisible = true;
  pvpRoomList = [];
  setPvpControlsBusy(true);
  setPvpStatus("");

  try {
    const currentRoom = await getCurrentPvpRoom();

    if (currentRoom) {
      beginPvpRoom(currentRoom);
      setPvpStatus(formatPvpRoomStatus(currentRoom.snapshot));
      return;
    }

    const response = await listPvpRooms(activeOnlineRoomKind);

    pvpRoomList = response.rooms;
    setPvpControlsBusy(false);
    setPvpStatus(response.rooms.length > 0 ? "Choose a room." : "");
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP search failed.");
    setPvpControlsBusy(false);
  }
}

async function handleJoinListedPvpRoom(roomCode: string): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }

  setPvpControlsBusy(true);
  setPvpStatus("Joining room...");

  try {
    beginPvpRoom(await joinPvpRoom(roomCode, hero));
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP join failed.");
    setPvpControlsBusy(false);
  }
}

async function handleCancelPvpRoom(): Promise<void> {
  if (pvpControlsBusy || !pvpSession) {
    return;
  }
  if (!canCancelPvpRoom()) {
    setPvpStatus("Online match already started.");
    return;
  }

  const session = pvpSession;

  setPvpControlsBusy(true);
  setPvpStatus("Cancelling room...");

  try {
    await cancelPvpRoom(session);
    pvpRoomList = pvpRoomList.filter((room) => room.roomCode !== session.roomCode);
    pvpControlsBusy = false;
    leavePvpRoom({ keepStatus: true });
    pvpRoomsVisible = true;
    renderPvpRoomList();
    setPvpStatus("Room cancelled.");
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP cancel failed.");
    setPvpControlsBusy(false);
  }
}

function beginPvpRoom(response: PvpRoomResponse): void {
  leavePvpRoom({ keepStatus: true });
  activeOnlineRoomKind = response.roomKind ?? response.snapshot.roomKind ?? "pvp";
  pvpSession = {
    roomCode: response.roomCode,
    token: response.token,
    seat: response.seat,
    roomKind: response.roomKind ?? response.snapshot.roomKind ?? "pvp",
  };
  pvpSnapshot = response.snapshot;
  pvpRoomsVisible = true;
  setPvpControlsBusy(false);
  syncPvpControls();
  setPvpStatus(formatPvpRoomStatus(response.snapshot));
  pvpConnection = connectPvpRoom(pvpSession, {
    onMessage: handlePvpServerMessage,
    onClose: handlePvpSocketClose,
    onError: () => setPvpStatus("Online socket error."),
  });
  handlePvpSnapshot(response.snapshot);
}

function handlePvpSocketClose(): void {
  if (!pvpSession) {
    return;
  }

  const shouldShowDisconnectResult = gameMode === "pvp" && pvpSnapshot?.roomKind !== "duoBoss" && !isInCity && state.result === "playing";

  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  pvpActionPending = false;
  pvpSnapshotPlaybackToken += 1;
  clearPvpTurnTimer();
  setTurnAnimationLocked(false);
  setPvpStatus("Online disconnected.");
  syncPvpControls();

  if (shouldShowDisconnectResult) {
    void commitState({
      ...state,
      result: "draw",
      log: [{ text: "PvP connection lost.", important: true }, ...state.log].slice(0, 7),
    });
  }
}

function handlePvpServerMessage(message: PvpServerMessage): void {
  if (message.type === "error") {
    pvpActionPending = false;
    pvpSnapshotPlaybackToken += 1;
    setTurnAnimationLocked(false);
    setPvpStatus(message.message);
    return;
  }

  handlePvpSnapshot(message.snapshot);
}

function handlePvpSnapshot(snapshot: PvpRoomSnapshot): void {
  pvpSnapshot = snapshot;
  pvpActionPending = false;
  setPvpStatus(formatPvpRoomStatus(snapshot));
  syncPvpTurnTimer(snapshot);

  applyOnlineDuoHostStartCostIfNeeded(snapshot);

  if (!snapshot.state) {
    return;
  }

  applyOnlineDuoRewardIfNeeded(snapshot);

  if (isInCity) {
    closeCityArenaMenu();
    void startGameWithCityTransition({ mode: "pvp", initialState: snapshot.state });
    return;
  }

  if (gameMode === "pvp") {
    commitPvpSnapshotState(snapshot);
  }
}

function commitPvpSnapshotState(snapshot: PvpRoomSnapshot): void {
  if (!snapshot.state || gameMode !== "pvp") {
    return;
  }

  const playbackToken = ++pvpSnapshotPlaybackToken;

  setTurnAnimationLocked(true);
  const actionAnimation = commitState(snapshot.state);
  const releasePlaybackLock = () => {
    if (pvpSnapshotPlaybackToken !== playbackToken || pvpSnapshot !== snapshot || gameMode !== "pvp" || isInCity) {
      return;
    }

    if (snapshot.duoBossEnemyTurnPending) {
      return;
    }

    setTurnAnimationLocked(false);
  };

  void actionAnimation.then(releasePlaybackLock, releasePlaybackLock);
}

function formatPvpRoomStatus(snapshot: PvpRoomSnapshot): string {
  if (snapshot.status === "waiting") {
    return snapshot.roomKind === "duoBoss" ? "Waiting for helper." : "Waiting for opponent.";
  }

  if (snapshot.status === "finished") {
    return snapshot.roomKind === "duoBoss" ? "Duo fight finished." : "PvP match finished.";
  }

  if (snapshot.duoBossEnemyTurnPending) {
    return "Boss turn.";
  }

  if (snapshot.roomKind === "duoBoss") {
    return snapshot.activeSeat === snapshot.seat ? "Your turn." : "Ally turn.";
  }

  return snapshot.activeSeat === snapshot.seat ? "Your turn." : "Opponent turn.";
}

function handlePvpAction(actionId: ActionId): void {
  if (!pvpConnection || !pvpSnapshot || !pvpSession || pvpActionPending) {
    return;
  }

  if (pvpSnapshot.activeSeat !== pvpSession.seat || pvpSnapshot.status !== "playing") {
    return;
  }

  pvpActionPending = true;
  setTurnAnimationLocked(true);
  pvpConnection.sendAction(actionId, pvpSnapshot.turnVersion);
}

function applyOnlineDuoHostStartCostIfNeeded(snapshot: PvpRoomSnapshot): void {
  if (!isOnlineDuoSnapshot(snapshot) || snapshot.seat !== "host" || snapshot.status === "waiting") {
    return;
  }

  const markerKey = getOnlineDuoHostSpendMarkerKey(snapshot);

  if (hasLocalMarker(markerKey)) {
    return;
  }

  const now = new Date().toISOString();
  const spendResult = spendHeroArenaEnergy(hero, ARENA_DUO_BOSS_ENERGY_COST, now);

  if (!spendResult.ok) {
    hero = spendResult.hero;
    saveLocalHeroSave(hero);
    renderCityHero();
    setPvpStatus(getArenaEnergyShortageMessage(spendResult.arenaEnergy.current, ARENA_DUO_BOSS_ENERGY_COST));
    return;
  }

  hero = spendResult.hero;
  saveLocalHeroSave(hero);
  queueHeroCloudSave("online-duo-host-energy");
  setLocalMarker(markerKey);
  renderCityHero();
  renderCityArenaMenu();
}

function applyOnlineDuoRewardIfNeeded(snapshot: PvpRoomSnapshot): void {
  if (!isOnlineDuoSnapshot(snapshot) || snapshot.status !== "finished" || !snapshot.state || snapshot.state.result === "playing") {
    return;
  }

  const markerKey = getOnlineDuoRewardMarkerKey(snapshot);

  if (hasLocalMarker(markerKey)) {
    return;
  }

  const rewardTimestamp = new Date().toISOString();
  const combatForReward = createOnlineDuoRewardCombat(snapshot);
  const rewardApplication = applyCombatReward(hero, combatForReward, rewardTimestamp, Math.random, {
    recordBossVictory: snapshot.seat === "host",
  });
  const { reward, loot, heroBeforeReward } = rewardApplication;
  let heroAfterReward = rewardApplication.heroAfterReward;

  if (snapshot.seat === "guest" && snapshot.state.result === "win") {
    heroAfterReward = grantHeroArenaEnergy(heroAfterReward, ONLINE_DUO_GUEST_ENERGY_REWARD, rewardTimestamp);
  }

  hero = heroAfterReward;
  saveLocalHeroSave(hero);
  queueHeroCloudSave(snapshot.seat === "host" ? "online-duo-host-reward" : "online-duo-helper-reward");
  rememberDroppedEquipmentHint(snapshot.state, loot);
  syncPlayerCityBodyScale();
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
  pendingBattleResultPresentation = {
    id: `battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
    levelUnlocks: createBattleResultLevelUnlocks(heroBeforeReward, heroAfterReward),
    postResultUnlocks: createBattleResultPostUnlocks(heroBeforeReward, heroAfterReward),
  };
  startBattleResultReturnGate();
  markRewardUiRenderDirty();
  setLocalMarker(markerKey);
}

function createOnlineDuoRewardCombat(snapshot: PvpRoomSnapshot): CombatState {
  if (snapshot.seat !== "guest" || !snapshot.state?.helper) {
    return snapshot.state as CombatState;
  }

  return {
    ...snapshot.state,
    player: snapshot.state.helper,
  };
}

function isOnlineDuoSnapshot(snapshot: PvpRoomSnapshot): boolean {
  return snapshot.roomKind === "duoBoss";
}

function getOnlineDuoHostSpendMarkerKey(snapshot: PvpRoomSnapshot): string {
  return `${ONLINE_DUO_HOST_SPEND_STORAGE_PREFIX}${snapshot.roomCode}:host`;
}

function getOnlineDuoRewardMarkerKey(snapshot: PvpRoomSnapshot): string {
  return `${ONLINE_DUO_REWARD_STORAGE_PREFIX}${snapshot.roomCode}:${snapshot.seat}`;
}

function hasLocalMarker(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setLocalMarker(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage can be unavailable in embedded browsers; the reward path still completes.
  }
}

function leavePvpRoom(options: { keepStatus?: boolean } = {}): void {
  pvpConnection?.close();
  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  pvpActionPending = false;
  pvpSnapshotPlaybackToken += 1;
  clearPvpTurnTimer();
  setTurnAnimationLocked(false);
  syncPvpControls();
  if (!options.keepStatus) {
    setPvpStatus("");
  }
}

function syncPvpTurnTimer(snapshot = pvpSnapshot): void {
  if (gameMode !== "pvp" || !snapshot?.deadlineAt || snapshot.status !== "playing") {
    clearPvpTurnTimer();
    return;
  }

  pvpDeadlineLocalTime = Date.now() + Math.max(0, snapshot.deadlineAt - snapshot.serverNow);
  if (pvpTurnTimer) {
    pvpTurnTimer.hidden = false;
  }
  if (pvpTimerInterval === undefined) {
    pvpTimerInterval = window.setInterval(updatePvpTurnTimer, 200);
  }
  updatePvpTurnTimer();
}

function updatePvpTurnTimer(): void {
  if (!pvpTurnTimer || !pvpSnapshot || pvpDeadlineLocalTime === undefined) {
    return;
  }

  const remainingSeconds = Math.max(0, Math.ceil((pvpDeadlineLocalTime - Date.now()) / 1000));
  let turnLabel = "OPPONENT";

  if (pvpSnapshot.duoBossEnemyTurnPending) {
    turnLabel = "BOSS";
  } else if (pvpSnapshot.activeSeat === pvpSession?.seat) {
    turnLabel = "YOUR TURN";
  } else if (pvpSnapshot.roomKind === "duoBoss") {
    turnLabel = "ALLY";
  }

  pvpTurnTimer.textContent = `${turnLabel} ${remainingSeconds}s`;
}

function clearPvpTurnTimer(): void {
  if (pvpTimerInterval !== undefined) {
    window.clearInterval(pvpTimerInterval);
    pvpTimerInterval = undefined;
  }
  pvpDeadlineLocalTime = undefined;
  if (pvpTurnTimer) {
    pvpTurnTimer.hidden = true;
    pvpTurnTimer.textContent = "";
  }
}

function openCityArenaMenu(): void {
  if (!cityArenaMenu || isArenaTransitionRunning) {
    return;
  }

  cityHeroProfile?.close();
  weaponShop?.close();
  armoryShop?.close();
  clearShopPreview();
  renderCityArenaMenu();
  if (pvpSession) {
    pvpRoomsVisible = true;
  }
  setCityArenaOnlineViewOpen(Boolean(pvpSession));
  syncPvpControls();
  cityArenaMenu.hidden = false;
  cityMenu?.classList.add("city-menu--arena-select-open");
}

function closeCityArenaMenu(): void {
  cityArenaMenu?.setAttribute("hidden", "");
  cityArenaMenu?.classList.remove("city-arena-menu--battle-transition");
  setCityArenaQuestPanelOpen(false);
  setCityArenaOnlineViewOpen(false);
  cityMenu?.classList.remove("city-menu--arena-select-open");
}

async function playCityArenaPanelEntryTransition(): Promise<void> {
  if (!cityArenaMenu || cityArenaMenu.hidden) {
    return;
  }

  setCityArenaQuestPanelOpen(false);
  cityArenaMenu.classList.remove("city-arena-menu--battle-transition");
  void cityArenaMenu.offsetWidth;
  cityArenaMenu.classList.add("city-arena-menu--battle-transition");
  await delay(CITY_ARENA_PANEL_ENTRY_TRANSITION_MS);
}

async function startSelectedArena(selection: ArenaMenuSelection): Promise<void> {
  if (isPvpRoomBlockingArena()) {
    setPvpStatus("Cancel online room before fighting bots.");
    syncPvpControls();
    return;
  }

  const levelGateTitle = getArenaSelectionLevelGateTitle(selection);

  if (levelGateTitle) {
    renderCityArenaMenu();
    window.alert(levelGateTitle);
    return;
  }

  if (selection.kind === "boss") {
    const limitTitle = getArenaSelectionBossVictoryLimitTitle(selection);

    if (limitTitle) {
      renderCityArenaMenu();
      window.alert(limitTitle);
      return;
    }
  }

  const hasEnergy = await spendArenaEnergyForSelectedArena(selection);

  if (!hasEnergy) {
    return;
  }

  leavePvpRoom();
  gameMode = "pve";
  syncRestartButtonVisibility();
  activeArenaSelection = selection;
  const initialState = createCombatStateForSelection(selection);

  void startGameWithCityTransition({ initialState, cityTransition: "arenaPanel" });
}

async function autoResolveSelectedArena(selection: ArenaMenuSelection): Promise<void> {
  if (cityArenaAutoFightPending) {
    return;
  }

  if (isPvpRoomBlockingArena()) {
    setPvpStatus("Cancel online room before fighting bots.");
    syncPvpControls();
    return;
  }

  const levelGateTitle = getArenaSelectionLevelGateTitle(selection);

  if (levelGateTitle) {
    renderCityArenaMenu();
    window.alert(levelGateTitle);
    return;
  }

  if (selection.kind === "random" && !isCityArenaAutoFightUnlockedForTier(selection.tierId)) {
    renderCityArenaMenu();
    return;
  }

  if (selection.kind === "boss") {
    const limitTitle = getArenaSelectionBossVictoryLimitTitle(selection);

    if (limitTitle) {
      renderCityArenaMenu();
      window.alert(limitTitle);
      return;
    }
  }

  cityArenaAutoFightPending = true;
  syncCityArenaBotControls();

  try {
    const hasEnergy = await spendArenaEnergyForSelectedArena(selection);

    if (!hasEnergy) {
      return;
    }

    leavePvpRoom();
    gameMode = "pve";
    syncRestartButtonVisibility();
    activeArenaSelection = selection;

    const random = Math.random;
    const initialState = createCombatStateForSelection(selection, hero, random);
    const resolvedState = resolveAutoCombat(initialState, {
      maxTurns: AUTO_FIGHT_MAX_TURNS,
      random,
    });
    const rewardTimestamp = new Date().toISOString();
    const rewardApplication = applyCombatReward(hero, resolvedState, rewardTimestamp, random, {
      randomEnemyLootChanceMultiplier: AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER,
    });
    const { loot, heroAfterReward } = rewardApplication;

    hero = heroAfterReward;
    rememberDroppedEquipmentHint(resolvedState, loot);
    saveLocalHeroSave(hero);
    queueHeroCloudSave("auto-fight-result");
    renderCityArenaMenu();
    presentAutoResolvedArenaResult(resolvedState, {
      ...rewardApplication,
      levelUnlocks: createBattleResultLevelUnlocks(rewardApplication.heroBeforeReward, rewardApplication.heroAfterReward),
      postResultUnlocks: createBattleResultPostUnlocks(rewardApplication.heroBeforeReward, rewardApplication.heroAfterReward),
    });
  } finally {
    cityArenaAutoFightPending = false;
    if (isInCity && !isAutoResultOverlayActive) {
      renderCityArenaMenu();
    }
    syncCityArenaBotControls();
  }
}

function presentAutoResolvedArenaResult(combat: CombatState, presentation: Omit<BattleResultPresentation, "id">): void {
  cancelArenaEntryGate();
  cityHeroProfile?.close();
  clearShopPreview();
  setArenaMenuOpen(false);
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  resetBattleResultReturnGate();
  battleResultReturnReady = true;
  battleResultReturnLabel = AUTO_RESULT_RETURN_LABEL;
  battleResultPresentation = {
    id: `battle-result-${++battleResultPresentationId}`,
    instant: true,
    ...presentation,
  };
  pendingBattleResultPresentation = undefined;
  battleResultPresentationStage = getInitialBattleResultPresentationStage(battleResultPresentation);
  battleResultPresentationRevealToken += 1;
  state = combat;
  displayedStatsState = combat;
  gameMode = "pve";
  isArenaTransitionRunning = false;
  isInCity = true;
  isAutoResultOverlayActive = true;
  enemyTimerStatus = "idle";
  lastActionClick = "auto-fight";
  syncRestartButtonVisibility(false);
  dom.mainMenu.hidden = false;
  dom.gameScreen.hidden = false;
  dom.startButton.disabled = false;
  dom.gameScreen.classList.remove("battle-screen--arena-entry", "battle-screen--arena-entry-loading");
  dom.gameScreen.classList.add("battle-screen--auto-result-overlay");
  cityMenu?.classList.remove("city-menu--arena-transition");
  cityMenu?.classList.add("city-menu--arena-select-open");
  document.body.classList.remove("arena-active");
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  setPlayerAppearance(hero.appearance);
  setPlayerWeaponEnchantments(hero.weaponEnchantments);
  renderCityHero();
  renderCurrentDom();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
  heroPortraitPreview?.setEquipment(hero.equipment);
  heroPortraitPreview?.setAppearance(hero.appearance);
  syncTurnProbe();
}

function closeAutoResolvedArenaResult(): void {
  if (!isAutoResultOverlayActive) {
    return;
  }

  isAutoResultOverlayActive = false;
  resetBattleResultReturnGate();
  battleResultPresentation = undefined;
  pendingBattleResultPresentation = undefined;
  battleResultPresentationStage = "reward";
  battleResultPresentationRevealToken += 1;
  state = createCombatStateForSelection(activeArenaSelection);
  displayedStatsState = state;
  gameMode = "pve";
  isInCity = true;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  syncRestartButtonVisibility();
  dom.gameScreen.hidden = true;
  dom.gameScreen.classList.remove("battle-screen--auto-result-overlay", "battle-screen--finished", "battle-screen--arena-entry", "battle-screen--arena-entry-loading");
  dom.mainMenu.hidden = false;
  dom.startButton.disabled = false;
  cityMenu?.classList.add("city-menu--arena-select-open");
  document.body.classList.remove("arena-active");
  renderCityHero();
  renderCurrentDom();
  renderCityArenaMenu();
  syncTurnProbe();
}

function getArenaSelectionBossVictoryLimitTitle(selection: ArenaMenuSelection): string {
  return selection.kind === "boss" ? getCityArenaBossVictoryLimitTitle(createArenaBossEncounter(selection.bossId).tierId) : "";
}

function getArenaSelectionEnergyCost(selection: ArenaMenuSelection): number {
  if (selection.kind !== "boss") {
    return ARENA_RANDOM_ENERGY_COST;
  }

  return selection.duo ? ARENA_DUO_BOSS_ENERGY_COST : ARENA_BOSS_ENERGY_COST;
}

async function spendArenaEnergyForSelectedArena(selection: ArenaMenuSelection): Promise<boolean> {
  if (arenaEnergySpendPending) {
    return false;
  }

  const energyCost = getArenaSelectionEnergyCost(selection);
  const currentArenaEnergy = getHeroArenaEnergy(hero);

  if (currentArenaEnergy.current < energyCost) {
    syncCityArenaBotControls();
    window.alert(getArenaEnergyShortageMessage(currentArenaEnergy.current, energyCost));
    return false;
  }

  arenaEnergySpendPending = true;
  syncCityArenaBotControls();

  try {
    if (canUseGladiatorCloudSave()) {
      hero = {
        ...hero,
        arenaEnergy: await spendGladiatorArenaEnergy(hero, energyCost),
      };
      saveLocalHeroSave(hero);
    } else {
      const localSpend = spendHeroArenaEnergy(hero, energyCost);

      if (!localSpend.ok) {
        hero = localSpend.hero;
        syncHeroRuntimeState();
        window.alert(getArenaEnergyShortageMessage(localSpend.arenaEnergy.current, energyCost));
        return false;
      }

      hero = localSpend.hero;
      saveLocalHeroSave(hero);
    }

    syncHeroRuntimeState();
    renderCityArenaMenu();
    return true;
  } catch (error) {
    if (error instanceof GladiatorSaveError && error.arenaEnergy) {
      hero = {
        ...hero,
        arenaEnergy: error.arenaEnergy,
      };
      saveLocalHeroSave(hero);
      syncHeroRuntimeState();
    }

    if (error instanceof GladiatorSaveError && error.code === "not_enough_arena_energy") {
      window.alert(getArenaEnergyShortageMessage(error.arenaEnergy?.current ?? getHeroArenaEnergy(hero).current, energyCost));
    } else {
      console.warn("[arena-energy] Failed to spend arena energy.", error);
      window.alert("Could not start arena. Try again.");
    }

    renderCityArenaMenu();
    return false;
  } finally {
    arenaEnergySpendPending = false;
    syncCityArenaBotControls();
  }
}

function getArenaEnergyShortageMessage(current: number, energyCost: number): string {
  return current <= 0 ? "No arena energy left today." : `Not enough arena energy (${current}/${energyCost}).`;
}

async function finishInitialCityEntry(): Promise<void> {
  showCityReturnTransition();
  await mountCityPreviews();
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
  renderCityHero();
  cityHeroEquipmentMenu.render();
  await waitForCityReady();
  hideCityReturnTransition();
}

async function startInitialCityEntry(): Promise<void> {
  showCityReturnTransition(canUseGladiatorCloudSave() ? "Syncing Hero..." : "Entering City...");

  if (canUseGladiatorCloudSave()) {
    await hydrateInitialHeroFromCloudSave();
  } else if (!hydrateHeroFromLocalSave()) {
    syncHeroRuntimeState();
  }

  await finishInitialCityEntry();
}

async function hydrateInitialHeroFromCloudSave(): Promise<void> {
  while (!(await hydrateHeroFromCloudSave())) {
    await waitForCityReturnTransitionRetry("Sync failed.");
    setCityReturnTransitionState("Syncing Hero...");
  }
}

function waitForCityReturnTransitionRetry(message: string): Promise<void> {
  return new Promise((resolve) => {
    setCityReturnTransitionState(message, () => {
      setCityReturnTransitionState("Syncing Hero...");
      resolve();
    });
  });
}

function showCityReturnTransition(message = "Entering City..."): void {
  setCityReturnTransitionState(message);
  cityReturnTransition.hidden = false;
  cityReturnTransition.classList.remove("city-return-transition--leaving");
  void cityReturnTransition.offsetWidth;
  cityReturnTransition.classList.add("city-return-transition--active");
}

function hideCityReturnTransition(): void {
  setCityReturnTransitionRetryHandler();
  cityReturnTransition.classList.add("city-return-transition--leaving");
  cityReturnTransition.classList.remove("city-return-transition--active");
  window.setTimeout(() => {
    if (cityReturnTransition.classList.contains("city-return-transition--active")) {
      return;
    }

    cityReturnTransition.hidden = true;
    cityReturnTransition.classList.remove("city-return-transition--leaving");
  }, CITY_RETURN_TRANSITION_IN_MS);
}

function setCityReturnTransitionState(message: string, retryHandler?: () => void): void {
  const label = cityReturnTransition.querySelector<HTMLElement>("[data-city-return-transition-label]");

  if (label) {
    label.textContent = message;
  }

  setCityReturnTransitionRetryHandler(retryHandler);
}

function setCityReturnTransitionRetryHandler(handler?: () => void): void {
  const retryButton = cityReturnTransition.querySelector<HTMLButtonElement>("[data-city-return-transition-retry]");

  cityReturnTransitionRetryHandler = handler;

  if (retryButton) {
    retryButton.hidden = !handler;
  }
}

function startBattleResultReturnGate(): void {
  const gateToken = ++battleResultReturnGateToken;

  battleResultReturnReady = false;
  battleResultReturnLabel = CITY_RETURN_WAITING_LABEL;

  void Promise.all([
    delay(CITY_RETURN_MIN_READY_MS),
    waitForCityPrewarmWithTimeout(),
  ]).then(() => {
    if (battleResultReturnGateToken !== gateToken || isInCity || state.result === "playing") {
      return;
    }

    battleResultReturnReady = true;
    battleResultReturnLabel = CITY_RETURN_READY_LABEL;
    renderCurrentDom();
  });
}

function resetBattleResultReturnGate(): void {
  battleResultReturnGateToken += 1;
  battleResultReturnReady = true;
  battleResultReturnLabel = CITY_RETURN_READY_LABEL;
  battleResultSequenceLocked = false;
}

function waitForCityPrewarmWithTimeout(): Promise<void> {
  return Promise.race([
    prewarmCityAssetsForBrowserCache().catch(() => undefined),
    delay(CITY_RETURN_PREWARM_TIMEOUT_MS),
  ]).then(() => undefined);
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function markRewardUiRenderDirty(): void {
  rewardUiRenderDirty = true;
}

function flushRewardUiRenderIfDirty(): void {
  if (!rewardUiRenderDirty) {
    return;
  }

  rewardUiRenderDirty = false;
  cityHeroEquipmentMenu.render();
  magicShop?.syncHeroState();
}

async function waitForCityFirstPaint(): Promise<void> {
  await nextAnimationFrame();
  await nextAnimationFrame();
}

async function waitForCityReady(): Promise<void> {
  await Promise.race([
    cityScene?.ready ?? Promise.resolve(),
    delay(CITY_RETURN_TRANSITION_TIMEOUT_MS),
  ]);
  await waitForCityFirstPaint();
}

function suspendCityScenePreview(): void {
  cityScene?.suspend();
}

function mountArena(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  const entryToken = beginArenaEntryGate();

  window.requestAnimationFrame(() => {
    if (arenaEntryToken !== entryToken) {
      return;
    }

    unmountArena = launchArena((scene) => {
      if (arenaEntryToken !== entryToken) {
        return;
      }

      arenaScene = scene;
      void runArenaEntry(scene, entryToken);
    }, handleAction, hero.equipment, hero.appearance, state.encounter);
  });
}

function unmountArenaScene(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  cancelArenaEntryGate();
}

function startGame(options: StartGameOptions = {}): void {
  gameMode = options.mode ?? "pve";
  resetBattleInteractionLocksForArenaStart();
  const initialState = gameMode === "pvp" ? pvpSnapshot?.state ?? options.initialState : options.initialState;
  syncRestartButtonVisibility(gameMode !== "pvp");
  syncPvpTurnTimer();
  cityHeroProfile?.close();
  closeCityArenaMenu();
  suspendCityScenePreview();
  weaponShop?.close();
  armoryShop?.close();
  magicShop?.close();

  if (hasStarted) {
    isInCity = false;
    dom.mainMenu.hidden = true;
    dom.gameScreen.classList.add("battle-screen--arena-entry");
    dom.gameScreen.hidden = false;
    document.body.classList.add("arena-active");
    if (initialState) {
      void commitState(initialState, { syncArena: false });
    } else {
      restart({ syncArena: false });
    }
    mountArena();
    syncAutoBattleToggle();
    return;
  }

  hasStarted = true;
  isInCity = false;
  dom.mainMenu.hidden = true;
  dom.gameScreen.classList.add("battle-screen--arena-entry");
  dom.gameScreen.hidden = false;
  document.body.classList.add("arena-active");
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  classicActionBar = mountClassicActionBar(dom.gameScreen, handleAction, () => debugTuning, {
    getControlledActor: getControlledActionActor,
  });
  autoBattleButton = mountAutoBattleToggle(dom.gameScreen);
  autoBattleOffButton = mountAutoBattleOffButton(dom.gameScreen);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = shouldMountTurnProbe() ? mountTurnProbe(dom.gameScreen) : undefined;
  if (initialState) {
    void commitState(initialState, { syncArena: false });
  } else {
    restart({ syncArena: false });
  }
  mountArena();
  syncAutoBattleToggle();
}

async function startGameWithCityTransition(options: StartGameWithCityTransitionOptions = {}): Promise<void> {
  const { cityTransition = "city", ...startOptions } = options;

  if (isArenaTransitionRunning) {
    return;
  }

  if (!isInCity) {
    startGame(startOptions);
    return;
  }

  isArenaTransitionRunning = true;
  dom.startButton.disabled = true;
  clearShopPreview();
  void prewarmArenaAssetsForBrowserCache(startOptions.initialState?.encounter ?? state.encounter);

  if (cityTransition === "city") {
    cityMenu?.classList.add("city-menu--arena-transition");
  }

  try {
    if (cityTransition === "arenaPanel") {
      await playCityArenaPanelEntryTransition();
    } else {
      await (cityScene?.focusArenaTransition() ?? Promise.resolve());
    }
  } finally {
    startGame(startOptions);
    dom.startButton.disabled = false;
    isArenaTransitionRunning = false;
  }
}

function applyBattleRewardIfNeeded(nextState: CombatState): CombatState {
  if (gameMode === "pvp") {
    return nextState;
  }

  if (state.result !== "playing" || nextState.result === "playing") {
    return nextState;
  }

  const rewardTimestamp = new Date().toISOString();
  const rewardApplication = applyCombatReward(hero, nextState, rewardTimestamp);
  const { reward, loot, heroBeforeReward, heroAfterReward } = rewardApplication;

  hero = heroAfterReward;
  if (nextState.result === "win") {
    queueHeroCloudSave("battle-win");
  }
  rememberDroppedEquipmentHint(nextState, loot);
  syncPlayerCityBodyScale();
  pendingBattleResultPresentation = {
    id: `battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
    levelUnlocks: createBattleResultLevelUnlocks(heroBeforeReward, heroAfterReward),
    postResultUnlocks: createBattleResultPostUnlocks(heroBeforeReward, heroAfterReward),
  };
  startBattleResultReturnGate();
  markRewardUiRenderDirty();

  return nextState;
}

function rememberDroppedEquipmentHint(combat: CombatState, loot: readonly { itemId: HeroItemId; itemIds?: readonly HeroItemId[] }[]): void {
  if (combat.result !== "win") {
    return;
  }

  const hintItemIds = getDroppedEquipmentHintItemIds(loot);

  if (hintItemIds.length <= 0) {
    return;
  }

  pendingEquipmentHintItemIds = [...new Set([...pendingEquipmentHintItemIds, ...hintItemIds])];
}

function getDroppedEquipmentHintItemIds(loot: readonly { itemId: HeroItemId; itemIds?: readonly HeroItemId[] }[]): HeroItemId[] {
  const seenItemIds = new Set<HeroItemId>();
  const hintItemIds: HeroItemId[] = [];

  loot.forEach((drop) => {
    const itemIds = drop.itemIds ?? [drop.itemId];

    itemIds.forEach((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      if (!item || isHeroConsumableItem(item) || seenItemIds.has(itemId)) {
        return;
      }

      seenItemIds.add(itemId);
      hintItemIds.push(itemId);
    });
  });

  return hintItemIds;
}

function handleProfileEquipmentCategoryOpen(categoryId: CityEquipmentCategoryId): void {
  if (clearPendingEquipmentHintsForCategory(categoryId)) {
    renderCityHero();
  }
}

function clearPendingEquipmentHintsForCategory(categoryId: CityEquipmentCategoryId): boolean {
  return updatePendingEquipmentHints((itemId) => getCityEquipmentCategoryIdForHeroItemId(itemId) !== categoryId);
}

function clearPendingEquipmentHintsForItems(itemIds: readonly HeroItemId[]): boolean {
  const clearedItemIds = new Set(itemIds);

  return updatePendingEquipmentHints((itemId) => !clearedItemIds.has(itemId));
}

function updatePendingEquipmentHints(keepItemId: (itemId: HeroItemId) => boolean): boolean {
  if (pendingEquipmentHintItemIds.length <= 0) {
    return false;
  }

  const nextItemIds = pendingEquipmentHintItemIds.filter(keepItemId);

  if (nextItemIds.length === pendingEquipmentHintItemIds.length) {
    return false;
  }

  pendingEquipmentHintItemIds = nextItemIds;
  return true;
}

function handleShopBuy(product: CityShopProduct): void {
  const isSealedEquipmentPurchase =
    isEquipmentShopProduct(product) &&
    !areHeroItemsOwned(hero, product.itemIds) &&
    isShopProductSealed(hero, product.itemIds, product.rarity);

  if (isSealedEquipmentPurchase) {
    return;
  }

  cancelShopPreviewPrewarm();
  const previousHero = hero;
  const nextHero = buyAndEquipHeroItems(previousHero, {
    itemIds: product.itemIds,
    price: product.price,
  });

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  if (!areHeroItemsConsumable(product.itemIds)) {
    heroPortraitPreview?.setEquipment(hero.equipment);
  }
  renderCityHero();
  syncShopHeroStateForProduct(product, previousHero);
  cityHeroEquipmentMenu.render();
}

function handleBowCapacityUpgrade(): void {
  const nextHero = upgradeHeroBowShotCapacity(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  renderCityHero();
  weaponShop?.syncHeroState();
  cityHeroEquipmentMenu.render();
}

function handleMagicWeaponSharpen(): void {
  const nextHero = sharpenHeroActiveWeapon(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  setPlayerWeaponEnchantments(hero.weaponEnchantments);
  renderCityHero();
  magicShop?.syncHeroState();
  cityHeroEquipmentMenu.render();
}

function handleMagicScrollUpgrade(product: MagicProduct): void {
  const nextHero = upgradeHeroScroll(hero, product.itemIds[0]);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  renderCityHero();
  magicShop?.syncHeroState();
  cityHeroEquipmentMenu.render();
}

function handleMagicScrollCapacityUpgrade(): void {
  const nextHero = upgradeHeroScrollCapacity(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  renderCityHero();
  magicShop?.syncHeroState();
  cityHeroEquipmentMenu.render();
}

function isArmoryShopProduct(product: CityShopProduct): product is ArmoryProduct {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "armor");
}

function isMagicShopProduct(product: CityShopProduct): product is MagicProduct {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "scroll");
}

function isEquipmentShopProduct(product: CityShopProduct): product is ArmoryProduct | WeaponProduct {
  return !isMagicShopProduct(product);
}

function handleHeroAttributeAllocate(attribute: HeroAttributeKey, amount: number): void {
  const nextHero = allocateHeroSkillPoints(hero, attribute, amount);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  syncPlayerCityBodyScale();
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function handleProfileEquipmentEquip(itemIds: readonly HeroItemId[]): void {
  const nextHero = buyAndEquipHeroItems(hero, {
    itemIds: [...itemIds],
    price: 0,
  });

  if (nextHero === hero) {
    return;
  }

  cancelShopPreviewPrewarm();
  clearPendingEquipmentHintsForItems(itemIds);
  hero = nextHero;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  heroPortraitPreview?.setEquipment(hero.equipment);
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function handleProfileEquipmentUnequip(itemIds: readonly HeroItemId[]): void {
  const nextHero = unequipHeroItems(hero, itemIds);

  if (nextHero === hero) {
    return;
  }

  cancelShopPreviewPrewarm();
  hero = nextHero;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  heroPortraitPreview?.setEquipment(hero.equipment);
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function handleProfileAppearanceChange(appearance: Partial<HeroAppearance>): void {
  const nextHero = updateHeroAppearance(hero, appearance);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  setPlayerAppearance(hero.appearance);
  heroPortraitPreview?.setAppearance(hero.appearance);
  renderCityHero();
  cityHeroAppearanceMenu.render();
}

function handleTemporaryChurchSkillGrant(): void {
  if (!canUseTelegramUserIdGatedAction(TEMPORARY_CHURCH_SKILL_GRANT_TELEGRAM_USER_IDS)) {
    return;
  }

  const now = new Date().toISOString();

  hero = restoreHeroArenaEnergy(
    unlockAllArenaBossTiers(
      unlockAllHeroShopRarities(grantHeroGold(grantHeroLevels(hero, 20, now), 1000, now), now),
      now,
    ),
    now,
  );
  saveLocalHeroSave(hero);
  queueHeroCloudSave("church-cheat");
  renderCityHero();
  renderCityArenaMenu();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function canUseTelegramUserIdGatedAction(allowedTelegramUserIds: ReadonlySet<string>): boolean {
  if (TELEGRAM_USER_ID_GATED_ACTION_BYPASS_ORIGINS.has(window.location.origin)) {
    return true;
  }

  return allowedTelegramUserIds.has(getTelegramUserId() ?? "");
}

function canUseArenaAdminControls(): boolean {
  return canUseTelegramUserIdGatedAction(ARENA_ENERGY_RESTORE_TELEGRAM_USER_IDS);
}

function syncShopHeroStateForProduct(product: CityShopProduct, previousHero: HeroState): void {
  if (isMagicShopProduct(product)) {
    magicShop?.syncHeroState();
    return;
  }

  if (isArmoryShopProduct(product)) {
    armoryShop?.syncHeroState({ product, previousHero });
    return;
  }

  weaponShop?.syncHeroState({ product, previousHero });
}

function syncCityShopHeroState(): void {
  armoryShop?.syncHeroState();
  weaponShop?.syncHeroState();
  magicShop?.syncHeroState();
}

function createShopPreviewEquipment(itemIds: readonly HeroItemId[], baseEquipment: HeroEquipment = hero.equipment): HeroEquipment {
  return createHeroPreviewEquipment(baseEquipment, itemIds);
}

function handleShopPreview(product: ArmoryProduct | WeaponProduct): void {
  cancelShopPreviewPrewarm();
  if (!hasHeroEquipmentPreviewItems(product.itemIds)) {
    clearShopPreview();
    return;
  }

  previewShopEquipment(createShopPreviewEquipment(product.itemIds));
}

function clearShopPreview(): void {
  cancelShopPreviewPrewarm();
  cityScene?.clearEquipmentPreview();
}

function handleShopProductPrewarm(products: readonly (ArmoryProduct | WeaponProduct)[]): void {
  void prewarmShopProductIcons(products.map((product) => product.itemIds));

  const itemIds = products
    .filter((product) => hasHeroEquipmentPreviewItems(product.itemIds) && !isShopProductSealed(hero, product.itemIds, product.rarity))
    .flatMap((product) => product.itemIds);

  scheduleShopPreviewPrewarm(itemIds);
}

function scheduleShopPreviewPrewarm(itemIds: readonly HeroItemId[]): void {
  const uniqueItemIds = [...new Set(itemIds)]
    .filter((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return isHeroEquipmentPreviewItem(item);
    });
  const signature = uniqueItemIds.join("|");

  if (!signature) {
    cancelShopPreviewPrewarm();
    return;
  }

  if (signature === activeShopPreviewPrewarmSignature || signature === completedShopPreviewPrewarmSignature) {
    return;
  }

  cancelShopPreviewPrewarm();
  activeShopPreviewPrewarmSignature = signature;
  shopPreviewPrewarmItemIds = uniqueItemIds;
  requestShopPreviewPrewarmStep();
}

function requestShopPreviewPrewarmStep(): void {
  if (shopPreviewPrewarmFrame !== undefined) {
    return;
  }

  const token = shopPreviewPrewarmToken;

  shopPreviewPrewarmFrame = window.requestAnimationFrame(() => {
    shopPreviewPrewarmFrame = undefined;

    if (token !== shopPreviewPrewarmToken) {
      return;
    }

    const itemId = shopPreviewPrewarmItemIds.shift();

    if (itemId) {
      cityScene?.prewarmEquipmentItem(itemId);
    }

    if (shopPreviewPrewarmItemIds.length > 0) {
      requestShopPreviewPrewarmStep();
      return;
    }

    completedShopPreviewPrewarmSignature = activeShopPreviewPrewarmSignature;
    activeShopPreviewPrewarmSignature = "";
  });
}

function cancelShopPreviewPrewarm(): void {
  shopPreviewPrewarmToken += 1;
  activeShopPreviewPrewarmSignature = "";
  shopPreviewPrewarmItemIds = [];
  if (shopPreviewPrewarmFrame !== undefined) {
    window.cancelAnimationFrame(shopPreviewPrewarmFrame);
    shopPreviewPrewarmFrame = undefined;
  }
}

function previewShopEquipment(equipment: HeroEquipment): void {
  cityScene?.previewEquipment(equipment);
}

function hasHeroEquipmentPreviewItems(itemIds: readonly HeroItemId[]): boolean {
  return itemIds.some((itemId) => isHeroEquipmentPreviewItem(HERO_ITEM_CATALOG[itemId]));
}

async function returnToCity(options: ReturnToCityOptions = {}): Promise<void> {
  const requireResultGate = options.requireResultGate ?? true;

  if ((requireResultGate && (!battleResultReturnReady || battleResultSequenceLocked)) || isCityReturnTransitionRunning) {
    return;
  }

  setArenaMenuOpen(false);

  const returningFromPvp = gameMode === "pvp";
  const transitionToken = ++cityReturnTransitionToken;

  isCityReturnTransitionRunning = true;
  dom.cityButton.disabled = true;
  if (returningFromPvp) {
    leavePvpRoom();
  }
  setAutoBattleEnabled(false);
  showCityReturnTransition();
  await delay(CITY_RETURN_TRANSITION_IN_MS);

  if (cityReturnTransitionToken !== transitionToken) {
    return;
  }

  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  resetBattleResultReturnGate();
  battleResultPresentation = undefined;
  pendingBattleResultPresentation = undefined;
  battleResultPresentationStage = "reward";
  battleResultPresentationRevealToken += 1;
  isArenaTransitionRunning = false;
  isInCity = true;
  gameMode = "pve";
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  syncRestartButtonVisibility();
  unmountArenaScene();
  dom.gameScreen.hidden = true;
  dom.mainMenu.hidden = false;
  dom.startButton.disabled = false;
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
  cityMenu?.classList.remove("city-menu--arena-transition");
  document.body.classList.remove("arena-active");
  await mountCityPreviews();
  flushRewardUiRenderIfDirty();
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
  renderCityHero();
  await waitForCityReady();

  if (cityReturnTransitionToken !== transitionToken) {
    return;
  }

  hideCityReturnTransition();
  isCityReturnTransitionRunning = false;
  syncTurnProbe();
}

function restart(options: { syncArena?: boolean } = {}): void {
  if (gameMode === "pvp") {
    return;
  }

  cityReturnTransitionToken += 1;
  isCityReturnTransitionRunning = false;
  hideCityReturnTransition();
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  resetBattleResultReturnGate();
  battleResultPresentation = undefined;
  pendingBattleResultPresentation = undefined;
  battleResultPresentationStage = "reward";
  battleResultPresentationRevealToken += 1;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  void commitState(createCombatStateForSelection(activeArenaSelection), options)
    .finally(() => scheduleAutoPlayerTurn());
}

dom.startButton.addEventListener("click", () => {
  openCityArenaMenu();
});
cityArenaCloseButton?.addEventListener("click", closeCityArenaMenu);
cityArenaOnlineButton?.addEventListener("click", () => setCityArenaOnlineViewOpen(true));
cityArenaOnlineBackButton?.addEventListener("click", () => setCityArenaOnlineViewOpen(false));
cityArenaQuestButton?.addEventListener("click", toggleCityArenaQuestPanel);
cityArenaQuestBackdrop?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
});
cityArenaQuestBackdrop?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  setCityArenaQuestPanelOpen(false);
});
cityArenaQuestCloseButton?.addEventListener("click", () => setCityArenaQuestPanelOpen(false));
cityArenaQuestClaimButton?.addEventListener("click", claimCityArenaQuestReward);
cityArenaTierSelect?.addEventListener("change", () => {
  activeArenaTierId = Number(cityArenaTierSelect.value) || DEFAULT_ARENA_TIER_ID;
  setCityArenaQuestPanelOpen(false);
  renderCityArenaMenu();
});
cityArenaEasyButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "easy" });
});
cityArenaEasyAutoButton?.addEventListener("click", () => {
  void autoResolveSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "easy" });
});
cityArenaRandomButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID });
});
cityArenaRandomAutoButton?.addEventListener("click", () => {
  void autoResolveSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID });
});
cityArenaHardButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "hard" });
});
cityArenaHardAutoButton?.addEventListener("click", () => {
  void autoResolveSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "hard" });
});
cityPvpCreateButton?.addEventListener("click", () => {
  void handleCreatePvpRoom();
});
cityPvpJoinButton?.addEventListener("click", () => {
  void handleSearchPvpRooms();
});
cityOnlinePveTab?.addEventListener("click", () => setActiveOnlineRoomKind("duoBoss"));
cityOnlinePvpTab?.addEventListener("click", () => setActiveOnlineRoomKind("pvp"));
cityHeroWidgetRefs.profileResetButton?.addEventListener("click", () => {
  void handleHeroProgressReset();
});
cityHeroWidgetRefs.arenaEnergy?.addEventListener("click", handleAdminArenaEnergyRestore);
if (canShowLocalDebugRestartButton()) {
  dom.restartButton.addEventListener("click", () => restart());
}
dom.cityButton.addEventListener("click", () => {
  if (continueBattleResultLootPresentation()) {
    return;
  }

  if (isAutoResultOverlayActive) {
    closeAutoResolvedArenaResult();
    return;
  }

  void returnToCity();
});
weaponShopButton?.addEventListener("click", () => {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  armoryShop?.close();
  magicShop?.close();
  flushRewardUiRenderIfDirty();
  weaponShop?.open();
});
armoryButton?.addEventListener("click", () => {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  weaponShop?.close();
  magicShop?.close();
  flushRewardUiRenderIfDirty();
  armoryShop?.open();
});
magicShopButton?.addEventListener("click", () => {
  const levelGateTitle = getMagicShopLevelGateTitle();

  if (levelGateTitle) {
    syncMagicShopButtonLock();
    window.alert(levelGateTitle);
    return;
  }

  cityHeroProfile?.close();
  closeCityArenaMenu();
  weaponShop?.close();
  armoryShop?.close();
  flushRewardUiRenderIfDirty();
  magicShop?.open();
});
churchButton?.addEventListener("click", handleTemporaryChurchSkillGrant);
syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
window.setInterval(syncArenaEnergyTimerDisplays, ARENA_ENERGY_TIMER_REFRESH_MS);
mountCityHeroAttributeControls(cityHeroWidgetRefs, handleHeroAttributeAllocate);
if (cityMenu) {
  weaponShop = mountWeaponShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onBowCapacityUpgrade: handleBowCapacityUpgrade,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
    onPrewarmProducts: handleShopProductPrewarm,
    transitionDelayMs: CITY_CURTAIN_SWITCH_MS,
    onOpen: () => {
      playCityCurtainTransition(() => focusCityShop("weaponShop"));
    },
    onClose: () => {
      playCityCurtainTransition(focusCityDefaultFromShop);
    },
    onLayoutChange: syncCityShopLayout,
  });
  armoryShop = mountArmoryShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
    onPrewarmProducts: handleShopProductPrewarm,
    transitionDelayMs: CITY_CURTAIN_SWITCH_MS,
    onOpen: () => {
      playCityCurtainTransition(() => focusCityShop("armory"));
    },
    onClose: () => {
      playCityCurtainTransition(focusCityDefaultFromShop);
    },
    onLayoutChange: syncCityShopLayout,
  });
  magicShop = mountMagicShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onUpgradeScroll: handleMagicScrollUpgrade,
    onScrollCapacityUpgrade: handleMagicScrollCapacityUpgrade,
    onSharpenWeapon: handleMagicWeaponSharpen,
    transitionDelayMs: CITY_CURTAIN_SWITCH_MS,
    onOpen: () => {
      playCityCurtainTransition(() => focusCityShop("magicShop"));
    },
    onClose: () => {
      playCityCurtainTransition(focusCityDefaultFromShop);
    },
    onLayoutChange: syncCityShopLayout,
  });
}
void startInitialCityEntry();
