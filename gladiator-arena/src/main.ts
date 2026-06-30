import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  getCityEffectivePhaserDevicePixelRatio,
  launchArena,
  mountCityHeroPreview,
  mountHeroPortraitPreview,
  prewarmArenaAssetsForBrowserCache,
  prewarmCityAssetsForBrowserCache,
  recordWebglActivity,
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
  type CityHeroAttributeSaveStatus,
  type CityEquipmentCategoryId,
  type CityHeroEquipmentMenuApi,
} from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { isDuoBossAiCombat, resolveAutoCombat, resolveAutoPlayerTurn, resolveDuoBossHelperTurn, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatActor, type CombatState, type TurnOwner } from "./combat";
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
  applyGladiatorShopAction,
  buyGladiatorShopProduct,
  canUseGladiatorCloudSave,
  claimGladiatorArenaQuestReward,
  deleteGladiatorCloudSave,
  GladiatorSaveError,
  loadGladiatorCloudSave,
  resetGladiatorHeroAttributes,
  saveGladiatorHeroAttributes,
  saveGladiatorCloudHero,
  settleGladiatorOfflineBattleReward,
  settleGladiatorOnlineDuoBossReward,
  spendGladiatorArenaEnergy,
  syncGladiatorHeroEquipment,
  type GladiatorBattleSettlement,
  type GladiatorArenaQuestRewardPatch,
  type GladiatorHeroAttributesPatch,
  type GladiatorShopAction,
} from "./gladiatorSaveClient";
import {
  HERO_ITEM_CATALOG,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
  DEFAULT_HERO_NAME,
  HERO_EQUIPMENT_SLOT_KEYS,
  HERO_SCROLL_CAPACITY_BASE,
  HERO_SCROLL_CAPACITY_MAX,
  HERO_SCROLL_UPGRADE_RARITIES,
  allocateHeroSkillPoints,
  applyCombatReward,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
  canResetHeroSkillPoints,
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
  getHeroAllocatedSkillPoints,
  getHeroItemWeaponClass,
  getHeroSkillPointResetPrice,
  getHeroScrollCapacityUpgradeUnlockBossTier,
  getHeroScrollUpgradeUnlockBossTier,
  grantHeroArenaEnergy,
  hasHeroArenaBossVictoryForTier,
  hasHeroDefeatedArenaBoss,
  isHeroConsumableItem,
  isHeroEquipmentPreviewItem,
  markHeroArenaWinQuestOpened,
  resetHeroArenaBossVictoryLedger,
  resetHeroSkillPoints,
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
  type HeroBaseStats,
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
import { ackPvpRoomResult, cancelPvpRoom, connectPvpRoom, createDuoBossRoom, createPvpRoom, getCurrentPvpRoom, joinPvpRoom, leavePvpRoomSession, listPvpRooms, reconnectPvpRoomSession, type PvpConnection } from "./pvpClient";
import { getPvpActorForSeat, type PvpRoomKind, type PvpRoomListEntry, type PvpRoomResponse, type PvpRoomSession, type PvpRoomSnapshot, type PvpServerMessage } from "./pvpProtocol";
import { getPlayerSettings, mountSettingsMenu, subscribePlayerSettings } from "./settingsMenu";
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
import { bootTelegramWebApp, getTelegramDisplayName, getTelegramUserId, getTelegramWebAppPlatform } from "./telegram";
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
const cityRenderDebugButton = document.querySelector<HTMLButtonElement>("#cityRenderDebugButton");
const cityRenderDebugPanel = document.querySelector<HTMLElement>("#cityRenderDebugPanel");
const cityRenderDebugOutput = document.querySelector<HTMLElement>("#cityRenderDebugOutput");
const cityAdminButton = document.querySelector<HTMLButtonElement>("#cityAdminButton");
const cityAdminPanel = document.querySelector<HTMLElement>("#cityAdminPanel");
const cityAdminGoldButton = document.querySelector<HTMLButtonElement>("#cityAdminGoldButton");
const cityAdminPlayerViewButton = document.querySelector<HTMLButtonElement>("#cityAdminPlayerViewButton");
const cityAdminArenaProfilerButton = document.querySelector<HTMLButtonElement>("#cityAdminArenaProfilerButton");
const cityAdminLevelButton = document.querySelector<HTMLButtonElement>("[data-admin-action='level-up']");
const cityAdminActionButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-admin-action]")];
const cityAdminGrantAdjustButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-admin-grant-adjust]")];
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
type ArenaMenuSelection = { kind: "random"; tierId: number; difficultyId: ArenaDifficultyId } | { kind: "boss"; bossId: ArenaBossId; duo?: boolean };
type CityShopProduct = ArmoryProduct | WeaponProduct | MagicProduct;
type GameMode = "pve" | "pvp";
type CityAdminAction = "level-up" | "unlock-shop" | "unlock-arena" | "restore-energy" | "reset-daily-arena" | "reset-progress";
type CityAdminGrantAdjustTarget = "gold" | "level";
interface ArenaEntryProfilerMark {
  label: string;
  time: number;
}
interface ArenaEntryProfilerRun {
  id: number;
  selection: string;
  startedAt: number;
  marks: ArenaEntryProfilerMark[];
  frameCount: number;
  frameGapsOver32: number;
  frameGapsOver50: number;
  frameGapsOver100: number;
  maxFrameGap: number;
  lastFrameTime?: number;
  rafId?: number;
  finishing?: boolean;
  finished?: boolean;
}
type ArenaEntryProfilerWindow = Window & { __dustArenaEntryProfileActive?: boolean };
interface StartGameOptions {
  mode?: GameMode;
  initialState?: CombatState;
}
interface StartGameWithCityTransitionOptions extends StartGameOptions {
  cityTransition?: "city" | "arenaPanel";
  prepareArenaEntry?: boolean;
}
interface ArenaEnergySpendOptions {
  renderMenuOnSuccess?: boolean;
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
type PvpReconnectCandidate = Pick<PvpRoomSession, "roomCode" | "token" | "seat" | "roomKind"> & {
  updatedAt: number;
};
const CITY_ARENA_TIER_ONE_DIFFICULTY_LEVEL_REQUIREMENTS: Partial<Record<ArenaDifficultyId, number>> = {
  [DEFAULT_ARENA_DIFFICULTY_ID]: 3,
  hard: 7,
};
const CITY_ARENA_TIER_ONE_BOSS_LEVEL_REQUIREMENT = 9;
const MAGIC_SHOP_LEVEL_REQUIREMENT = 8;
const PVP_RECONNECT_STORAGE_KEY = "dust-arena-pvp-reconnect-room";
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
let pvpReconnectRoom: PvpRoomResponse | undefined;
let locallyLeftPvpRoom: PvpReconnectCandidate | undefined = loadPvpReconnectCandidate();
let pvpActionPending = false;
let pvpSnapshotPlaybackToken = 0;
let onlineDuoAutoOffPending = false;
let onlineDuoAutoOffPendingTimer: number | undefined;
let onlineDuoBossPendingWatchdogTimer: number | undefined;
let onlineDuoBossRefreshPending = false;
const onlineDuoHostSpendPendingRooms = new Set<string>();
const onlineDuoRewardPendingRooms = new Set<string>();
let pvpControlsBusy = false;
let pvpRoomsVisible = false;
let pvpRoomList: PvpRoomListEntry[] = [];
let activeOnlineRoomKind: PvpRoomKind = "duoBoss";
let isCityArenaOnlineViewOpen = false;
let isCityArenaQuestPanelOpen = false;
let cityArenaQuestClaimPending = false;
let pendingManualArenaStartSelection: ArenaMenuSelection | undefined;
let pvpDeadlineLocalTime: number | undefined;
let pvpTimerInterval: number | undefined;
let hasStarted = false;
let isInCity = true;
let armoryShop: ArmoryShopApi | undefined;
let weaponShop: WeaponShopApi | undefined;
let magicShop: MagicShopApi | undefined;
let pendingEquipmentShopBuyProduct: ArmoryProduct | WeaponProduct | undefined;
let magicShopActionPending = false;
let bowCapacityUpgradePending = false;
let attributeDraftAllocations: HeroBaseStats = createEmptyHeroAttributeDraftAllocations();
let attributeSaveStatus: CityHeroAttributeSaveStatus = "idle";
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
const ADMIN_TELEGRAM_USER_IDS = new Set(["297730487", "313719698", "913155684"]);
const RENDER_DEBUG_TELEGRAM_USER_IDS = new Set(["297730487", "313719698"]);
const CITY_ADMIN_GOLD_GRANT_AMOUNT = 100;
const CITY_ADMIN_GOLD_GRANT_STEP = 100;
const CITY_ADMIN_LEVEL_GRANT_AMOUNT = 1;
const CITY_ADMIN_LEVEL_GRANT_STEP = 1;
const TELEGRAM_USER_ID_GATED_ACTION_BYPASS_ORIGINS = new Set(["http://localhost:5173"]);
const LOCAL_DEBUG_RESTART_BUTTON_ORIGIN = "http://localhost:5173";
const MOBILE_RENDER_DEBUG_PLATFORM_PATTERN = /android|ios|iphone|ipad|ipod|mobile/;
const MOBILE_RENDER_DEBUG_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i;
const CITY_RETURN_READY_LABEL = "Return to City";
const CITY_RETURN_WAITING_LABEL = "Preparing City...";
const BATTLE_REWARD_CLAIM_RETRY_LABEL = "Claim Reward";
const AUTO_RESULT_RETURN_LABEL = "Return";
const ARENA_ENTRY_LOADER_DELAY_MS = 240;
const ARENA_ENTRY_FAILSAFE_TIMEOUT_MS = 5000;
const ARENA_ENTRY_PROFILE_MARK_EVENT = "dust-arena-entry-profile-mark";
const CITY_ARENA_PANEL_ENTRY_TRANSITION_MS = 1000;
const ARENA_ENERGY_TIMER_REFRESH_MS = 30000;
const ARENA_RANDOM_ENERGY_COST = 1;
const ARENA_BOSS_ENERGY_COST = 2;
const ARENA_DUO_BOSS_ENERGY_COST = 3;
const ONLINE_DUO_GUEST_ENERGY_REWARD = 5;
const ONLINE_DUO_HOST_SPEND_STORAGE_PREFIX = "dust-arena-online-duo-host-spend:";
const ONLINE_DUO_REWARD_STORAGE_PREFIX = "dust-arena-online-duo-reward:";
const ONLINE_DUO_AUTO_OFF_PENDING_TIMEOUT_MS = 2500;
const ONLINE_DUO_BOSS_PENDING_WATCHDOG_GRACE_MS = 1200;
const PLAYER_TO_ENEMY_TURN_PACING_MS = 100;
const ENEMY_TO_PLAYER_TURN_PACING_MS = 50;
const AUTO_PLAYER_TURN_PACING_MS = 120;
const AUTO_BATTLE_PANEL_TRANSITION_MS = 320;
const AUTO_FIGHT_SUCCESS_RATE_SIMULATIONS = 20;
const AUTO_FIGHT_MAX_TURNS = 300;
const AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER = 0.5;
const SHOP_EQUIPMENT_VISUAL_SYNC_DELAY_MS = 260;
const SHOP_PURCHASE_BURST_WINDOW_MS = 2500;
let cityAdminGoldGrantAmount = CITY_ADMIN_GOLD_GRANT_AMOUNT;
let cityAdminLevelGrantAmount = CITY_ADMIN_LEVEL_GRANT_AMOUNT;
let cityAdminPlayerViewEnabled = false;
let arenaEntryProfilerArmed = false;
let arenaEntryProfilerRunId = 0;
let activeArenaEntryProfilerRun: ArenaEntryProfilerRun | undefined;
let cityCurtainCleanupTimer: number | undefined;
let cityCurtainRevealTimer: number | undefined;
let cityCurtainSwitchTimer: number | undefined;
let isArenaTransitionRunning = false;
let pendingShopEquipmentVisualSync: { equipment: HeroEquipment; updatePortrait: boolean } | undefined;
let shopEquipmentVisualSyncTimer: number | undefined;
let shopPurchaseBurstStartedAt = 0;
let shopPurchaseBurstCount = 0;
let isArenaEntryLoading = false;
let isArenaEntryTransitionPlaying = false;
let arenaEntryToken = 0;
let arenaEntryLoaderTimer: number | undefined;
let arenaEntryFailsafeTimer: number | undefined;
let battleResultPresentation: BattleResultPresentation | undefined;
let pendingBattleResultPresentation: BattleResultPresentation | undefined;
let pendingBattleRewardSettlement: Promise<void> | undefined;
let pendingBattleRewardRetry: { combat: CombatState; battleKind: "manual" | "auto" } | undefined;
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
let heroEquipmentSyncDirty = false;
let heroEquipmentSyncInFlight = false;
let cityReturnTransitionRetryHandler: (() => void) | undefined;

const cityReturnTransition = createCityReturnTransition();
const cityHeroProfile = mountCityHeroProfile(cityHeroWidgetRefs);
const cityHeroEquipmentMenu: CityHeroEquipmentMenuApi = mountCityHeroEquipmentMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onEquip: handleProfileEquipmentEquip,
  onUnequip: handleProfileEquipmentUnequip,
  onCategoryOpen: handleProfileEquipmentCategoryOpen,
  onOpen: (layout) => cityScene?.setProfilePreview(layout),
  onClose: () => {
    cityScene?.setProfilePreview();
    void flushHeroEquipmentSync("equipment-menu-close");
  },
});
const cityHeroAppearanceMenu = mountCityHeroAppearanceMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onChange: handleProfileAppearanceChange,
});
cityHeroWidgetRefs.profile?.addEventListener("city-profile-visibility", (event) => {
  const profileOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);

  if (!profileOpen) {
    cityScene?.setProfilePreview();
    void flushHeroEquipmentSync("profile-close");
    if (attributeSaveStatus === "saved") {
      attributeSaveStatus = "idle";
      renderCityHero();
    }
  }
  if (profileOpen) {
    closeCityArenaMenu();
  }
});

syncHudTuning(dom.gameScreen, debugTuning);
mountSettingsMenu();
mountArenaMenu();
mountCityTimeToggle(cityTimeToggle, cityMenu);
mountCityRenderDebugControls();
mountCityAdminControls();

function canShowLocalDebugRestartButton(): boolean {
  return window.location.origin === LOCAL_DEBUG_RESTART_BUTTON_ORIGIN;
}

function mountCityRenderDebugControls(): void {
  if (!cityRenderDebugButton || !cityRenderDebugPanel || !cityRenderDebugOutput) {
    return;
  }

  const visible = canShowCityRenderDebugControls();

  cityRenderDebugButton.hidden = !visible;
  cityRenderDebugPanel.hidden = true;

  if (!visible) {
    return;
  }

  cityRenderDebugButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCityRenderDebugOpen(cityRenderDebugPanel.hidden !== false);
  });

  cityRenderDebugPanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  window.addEventListener("resize", refreshCityRenderDebugPanel);
  subscribePlayerSettings(refreshCityRenderDebugPanel);
}

function setCityRenderDebugOpen(open: boolean): void {
  if (!cityRenderDebugButton || !cityRenderDebugPanel) {
    return;
  }

  if (open) {
    setCityAdminOpen(false);
  }

  cityRenderDebugPanel.hidden = !open;
  cityRenderDebugButton.setAttribute("aria-expanded", String(open));

  if (open) {
    refreshCityRenderDebugPanel();
  }
}

function refreshCityRenderDebugPanel(): void {
  if (!cityRenderDebugOutput || cityRenderDebugPanel?.hidden !== false) {
    return;
  }

  cityRenderDebugOutput.textContent = createCityRenderDebugReport();
}

function mountCityAdminControls(): void {
  if (!cityAdminButton || !cityAdminPanel || !cityAdminGoldButton || !cityAdminPlayerViewButton || !cityAdminArenaProfilerButton) {
    return;
  }

  const visible = canShowCityAdminControls();

  cityAdminButton.hidden = !visible;
  cityAdminPanel.hidden = true;

  if (!visible) {
    return;
  }

  cityAdminButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCityAdminOpen(cityAdminPanel.hidden !== false);
  });

  cityAdminPanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  refreshCityAdminGrantControls();
  refreshCityAdminPlayerViewControl();
  refreshCityAdminArenaProfilerControl();
  cityAdminPlayerViewButton.addEventListener("click", handleCityAdminPlayerViewToggle);
  cityAdminArenaProfilerButton.addEventListener("click", handleCityAdminArenaProfilerToggle);
  cityAdminGoldButton.addEventListener("click", handleAdminGoldGrant);
  window.addEventListener(ARENA_ENTRY_PROFILE_MARK_EVENT, handleArenaEntryProfileMark);
  cityAdminGrantAdjustButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = parseCityAdminGrantAdjustTarget(button.dataset.adminGrantAdjust);
      const delta = Number(button.dataset.adminGrantDelta);

      if (target && Number.isFinite(delta)) {
        handleCityAdminGrantAdjust(target, delta);
      }
    });
  });
  cityAdminActionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = parseCityAdminAction(button.dataset.adminAction);

      if (action) {
        void handleCityAdminAction(action, button);
      }
    });
  });
}

function setCityAdminOpen(open: boolean): void {
  if (!cityAdminButton || !cityAdminPanel) {
    return;
  }

  if (open) {
    setCityRenderDebugOpen(false);
  }

  cityAdminPanel.hidden = !open;
  cityAdminButton.setAttribute("aria-expanded", String(open));
}

function canShowCityAdminControls(): boolean {
  return canUseTelegramUserIdGatedAction(ADMIN_TELEGRAM_USER_IDS);
}

function canShowAdminOnlyGameFeatures(): boolean {
  return canShowCityAdminControls() && !cityAdminPlayerViewEnabled;
}

function handleCityAdminPlayerViewToggle(): void {
  if (!canShowCityAdminControls()) {
    return;
  }

  cityAdminPlayerViewEnabled = !cityAdminPlayerViewEnabled;
  refreshCityAdminPlayerViewControl();
  refreshAdminOnlyGameFeatureVisibility();
}

function refreshCityAdminPlayerViewControl(): void {
  if (!cityAdminPlayerViewButton) {
    return;
  }

  cityAdminPlayerViewButton.textContent = `Player View: ${cityAdminPlayerViewEnabled ? "On" : "Off"}`;
  cityAdminPlayerViewButton.setAttribute("aria-pressed", String(cityAdminPlayerViewEnabled));
}

function refreshAdminOnlyGameFeatureVisibility(): void {
  magicShop?.render();
  if (cityArenaMenu && !cityArenaMenu.hidden) {
    renderCityArenaMenu();
  }
}

function handleCityAdminArenaProfilerToggle(): void {
  if (!canShowCityAdminControls()) {
    return;
  }

  if (activeArenaEntryProfilerRun) {
    finishArenaEntryProfilerRun("cancelled");
    return;
  }

  arenaEntryProfilerArmed = !arenaEntryProfilerArmed;
  refreshCityAdminArenaProfilerControl();
}

function refreshCityAdminArenaProfilerControl(): void {
  if (!cityAdminArenaProfilerButton) {
    return;
  }

  const label = activeArenaEntryProfilerRun ? "Running" : arenaEntryProfilerArmed ? "Armed" : "Off";

  cityAdminArenaProfilerButton.textContent = `Profile Arena: ${label}`;
  cityAdminArenaProfilerButton.setAttribute("aria-pressed", String(arenaEntryProfilerArmed || Boolean(activeArenaEntryProfilerRun)));
}

function maybeBeginArenaEntryProfilerRun(selection: ArenaMenuSelection): void {
  if (!arenaEntryProfilerArmed || !canShowCityAdminControls()) {
    return;
  }

  if (activeArenaEntryProfilerRun) {
    finishArenaEntryProfilerRun("restarted");
  }

  arenaEntryProfilerArmed = false;
  activeArenaEntryProfilerRun = {
    id: ++arenaEntryProfilerRunId,
    selection: formatArenaEntryProfilerSelection(selection),
    startedAt: performance.now(),
    marks: [],
    frameCount: 0,
    frameGapsOver32: 0,
    frameGapsOver50: 0,
    frameGapsOver100: 0,
    maxFrameGap: 0,
  };
  setArenaEntryProfilerSceneMarksEnabled(true);
  markArenaEntryProfiler("tap accepted");
  startArenaEntryProfilerFrameLoop(activeArenaEntryProfilerRun);
  refreshCityAdminArenaProfilerControl();
}

function handleArenaEntryProfileMark(event: Event): void {
  const detail = event instanceof CustomEvent ? (event.detail as Partial<ArenaEntryProfilerMark> | undefined) : undefined;

  if (!detail?.label) {
    return;
  }

  markArenaEntryProfiler(detail.label, typeof detail.time === "number" ? detail.time : undefined);
}

function markArenaEntryProfiler(label: string, time = performance.now()): void {
  const profile = activeArenaEntryProfilerRun;

  if (!profile || profile.finished) {
    return;
  }

  profile.marks.push({ label, time });
}

function startArenaEntryProfilerFrameLoop(profile: ArenaEntryProfilerRun): void {
  const tick = (time: number): void => {
    if (activeArenaEntryProfilerRun !== profile || profile.finished) {
      return;
    }

    recordArenaEntryProfilerFrame(profile, time);
    profile.rafId = window.requestAnimationFrame(tick);
  };

  profile.rafId = window.requestAnimationFrame(tick);
}

function recordArenaEntryProfilerFrame(profile: ArenaEntryProfilerRun, time: number): void {
  if (profile.lastFrameTime !== undefined) {
    const gap = time - profile.lastFrameTime;

    profile.maxFrameGap = Math.max(profile.maxFrameGap, gap);
    if (gap > 32) {
      profile.frameGapsOver32 += 1;
    }
    if (gap > 50) {
      profile.frameGapsOver50 += 1;
    }
    if (gap > 100) {
      profile.frameGapsOver100 += 1;
    }
  }

  profile.frameCount += 1;
  profile.lastFrameTime = time;
}

function finishArenaEntryProfilerRunAfterNextFrame(status: string): void {
  const profile = activeArenaEntryProfilerRun;

  if (!profile || profile.finishing || profile.finished) {
    return;
  }

  profile.finishing = true;
  markArenaEntryProfiler("finish scheduled");
  window.requestAnimationFrame((time) => {
    if (activeArenaEntryProfilerRun !== profile || profile.finished) {
      return;
    }

    recordArenaEntryProfilerFrame(profile, time);
    markArenaEntryProfiler("first post-ready frame", time);
    finishArenaEntryProfilerRun(status);
  });
}

function finishArenaEntryProfilerRun(status: string): void {
  const profile = activeArenaEntryProfilerRun;

  if (!profile || profile.finished) {
    return;
  }

  markArenaEntryProfiler(`status: ${status}`);
  profile.finished = true;
  if (profile.rafId !== undefined) {
    window.cancelAnimationFrame(profile.rafId);
  }
  activeArenaEntryProfilerRun = undefined;
  setArenaEntryProfilerSceneMarksEnabled(false);
  refreshCityAdminArenaProfilerControl();
  showArenaEntryProfilerReport(profile, status);
}

function setArenaEntryProfilerSceneMarksEnabled(enabled: boolean): void {
  (window as ArenaEntryProfilerWindow).__dustArenaEntryProfileActive = enabled;
}

function formatArenaEntryProfilerSelection(selection: ArenaMenuSelection): string {
  if (selection.kind === "random") {
    return `tier ${selection.tierId} ${selection.difficultyId}`;
  }

  return selection.duo ? `${selection.bossId} duo bot` : `${selection.bossId} solo`;
}

function showArenaEntryProfilerReport(profile: ArenaEntryProfilerRun, status: string): void {
  if (!canShowCityAdminControls()) {
    return;
  }

  const report = createArenaEntryProfilerReport(profile, status);
  const existing = document.querySelector<HTMLElement>(".arena-entry-profiler");
  const root = document.createElement("section");
  const heading = document.createElement("h2");
  const output = document.createElement("pre");
  const actions = document.createElement("div");
  const copyButton = document.createElement("button");
  const closeButton = document.createElement("button");

  existing?.remove();
  console.info(report);

  root.className = "arena-entry-profiler";
  root.setAttribute("aria-label", "Arena entry profiler result");
  heading.textContent = "Arena Entry Profile";
  output.textContent = report;
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", () => {
    const copyPromise = navigator.clipboard?.writeText(report);

    if (!copyPromise) {
      return;
    }

    void copyPromise.then(() => {
      copyButton.textContent = "Copied";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    }).catch(() => undefined);
  });
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => root.remove());
  actions.className = "arena-entry-profiler__actions";
  actions.append(copyButton, closeButton);
  root.append(heading, output, actions);

  document.body.append(root);
}

function createArenaEntryProfilerReport(profile: ArenaEntryProfilerRun, status: string): string {
  const lastMark = profile.marks[profile.marks.length - 1];
  const totalMs = (lastMark?.time ?? performance.now()) - profile.startedAt;
  const lines = profile.marks.map((mark, index) => {
    const previousTime = index > 0 ? profile.marks[index - 1]?.time ?? profile.startedAt : profile.startedAt;
    const total = mark.time - profile.startedAt;
    const delta = mark.time - previousTime;

    return `${formatArenaEntryProfilerDuration(total).padStart(7)} +${formatArenaEntryProfilerDuration(delta).padStart(6)} ${mark.label}`;
  });

  return [
    `status: ${status}`,
    `selection: ${profile.selection}`,
    `total: ${formatArenaEntryProfilerDuration(totalMs)}`,
    `frames: ${profile.frameCount}`,
    `max frame gap: ${formatArenaEntryProfilerDuration(profile.maxFrameGap)}`,
    `frame gaps >32ms: ${profile.frameGapsOver32}`,
    `frame gaps >50ms: ${profile.frameGapsOver50}`,
    `frame gaps >100ms: ${profile.frameGapsOver100}`,
    "",
    "timeline:",
    ...lines,
  ].join("\n");
}

function formatArenaEntryProfilerDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs)) {
    return "0ms";
  }

  return `${Math.max(0, Math.round(durationMs))}ms`;
}

function parseCityAdminGrantAdjustTarget(target: string | undefined): CityAdminGrantAdjustTarget | undefined {
  switch (target) {
    case "gold":
    case "level":
      return target;
    default:
      return undefined;
  }
}

function handleCityAdminGrantAdjust(target: CityAdminGrantAdjustTarget, deltaSteps: number): void {
  if (!canShowCityAdminControls()) {
    return;
  }

  if (target === "gold") {
    cityAdminGoldGrantAmount = Math.max(
      CITY_ADMIN_GOLD_GRANT_AMOUNT,
      cityAdminGoldGrantAmount + CITY_ADMIN_GOLD_GRANT_STEP * deltaSteps,
    );
  } else {
    cityAdminLevelGrantAmount = Math.max(
      CITY_ADMIN_LEVEL_GRANT_AMOUNT,
      cityAdminLevelGrantAmount + CITY_ADMIN_LEVEL_GRANT_STEP * deltaSteps,
    );
  }

  refreshCityAdminGrantControls();
}

function refreshCityAdminGrantControls(): void {
  if (cityAdminGoldButton) {
    cityAdminGoldButton.textContent = `+${cityAdminGoldGrantAmount} Gold`;
  }

  if (cityAdminLevelButton) {
    cityAdminLevelButton.textContent = `+${cityAdminLevelGrantAmount} ${cityAdminLevelGrantAmount === 1 ? "Level" : "Levels"}`;
  }

  cityAdminGrantAdjustButtons.forEach((button) => {
    const target = parseCityAdminGrantAdjustTarget(button.dataset.adminGrantAdjust);
    const delta = Number(button.dataset.adminGrantDelta);

    if (!target || !Number.isFinite(delta) || delta >= 0) {
      return;
    }

    button.disabled =
      target === "gold"
        ? cityAdminGoldGrantAmount <= CITY_ADMIN_GOLD_GRANT_AMOUNT
        : cityAdminLevelGrantAmount <= CITY_ADMIN_LEVEL_GRANT_AMOUNT;
  });
}

function handleAdminGoldGrant(): void {
  if (!canShowCityAdminControls()) {
    return;
  }

  applyCityAdminHeroState(grantHeroGold(hero, cityAdminGoldGrantAmount), "admin-gold-grant");
}

function parseCityAdminAction(action: string | undefined): CityAdminAction | undefined {
  switch (action) {
    case "level-up":
    case "unlock-shop":
    case "unlock-arena":
    case "restore-energy":
    case "reset-daily-arena":
    case "reset-progress":
      return action;
    default:
      return undefined;
  }
}

async function handleCityAdminAction(action: CityAdminAction, sourceButton?: HTMLButtonElement): Promise<void> {
  if (!canShowCityAdminControls()) {
    return;
  }

  if (action === "reset-progress") {
    await handleHeroProgressReset(sourceButton);
    return;
  }

  applyCityAdminHeroState(applyCityAdminActionToHero(hero, action), `admin-${action}`);
}

function applyCityAdminActionToHero(sourceHero: HeroState, action: CityAdminAction): HeroState {
  switch (action) {
    case "level-up":
      return grantHeroLevels(sourceHero, cityAdminLevelGrantAmount);
    case "unlock-shop":
      return unlockAllHeroShopRarities(sourceHero);
    case "unlock-arena":
      return unlockAllArenaBossTiers(sourceHero);
    case "restore-energy":
      return restoreHeroArenaEnergy(sourceHero);
    case "reset-daily-arena":
      return resetHeroArenaBossVictoryLedger(sourceHero);
    case "reset-progress":
      return sourceHero;
  }
}

function applyCityAdminHeroState(nextHero: HeroState, cloudSaveReason: string): void {
  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  saveLocalHeroSave(hero);
  queueHeroCloudSave(cloudSaveReason);
  renderCityHero();
  renderCityArenaMenu();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function createCityRenderDebugReport(): string {
  const settings = getPlayerSettings();
  const canvas = cityHero?.querySelector<HTMLCanvasElement>("canvas") ?? undefined;
  const canvasRect = canvas?.getBoundingClientRect();
  const canvasScaleX = canvas && canvasRect && canvasRect.width > 0 ? canvas.width / canvasRect.width : undefined;
  const canvasScaleY = canvas && canvasRect && canvasRect.height > 0 ? canvas.height / canvasRect.height : undefined;
  const visualViewport = window.visualViewport;

  return [
    `PLATFORM: ${getCityRenderDebugPlatformLabel()}`,
    `DPR: ${formatRenderDebugNumber(window.devicePixelRatio, 2)}`,
    `EFFECTIVE DPR: ${formatRenderDebugNumber(getCityEffectivePhaserDevicePixelRatio(), 2)}`,
    `WINDOW: ${window.innerWidth}x${window.innerHeight}`,
    `VIEWPORT: ${visualViewport ? `${formatRenderDebugNumber(visualViewport.width, 1)}x${formatRenderDebugNumber(visualViewport.height, 1)}` : "-"}`,
    `CITY CANVAS: ${canvas ? `${canvas.width}x${canvas.height}` : "-"}`,
    `CITY CLIENT: ${canvas ? `${formatRenderDebugNumber(canvasRect?.width, 1)}x${formatRenderDebugNumber(canvasRect?.height, 1)}` : "-"}`,
    `CITY SCALE: ${formatRenderDebugNumber(canvasScaleX, 2)}x${formatRenderDebugNumber(canvasScaleY, 2)}`,
    `SMOOTH: ${settings.smoothRendering ? "ON" : "OFF"}`,
    `LOW FX: ${settings.lowEffects ? "ON" : "OFF"}`,
    `FPS: ${settings.renderFps}`,
    `UA: ${navigator.userAgent}`,
  ].join("\n");
}

function getCityRenderDebugPlatformLabel(): string {
  const telegramPlatform = getTelegramWebAppPlatform();

  if (telegramPlatform) {
    return `telegram:${telegramPlatform}`;
  }

  return "browser";
}

function canShowCityRenderDebugControls(): boolean {
  return canUseTelegramUserIdGatedAction(RENDER_DEBUG_TELEGRAM_USER_IDS) && isDesktopRenderDebugEnvironment();
}

function isDesktopRenderDebugEnvironment(): boolean {
  const telegramPlatform = getTelegramWebAppPlatform().toLowerCase();

  if (telegramPlatform) {
    return !MOBILE_RENDER_DEBUG_PLATFORM_PATTERN.test(telegramPlatform);
  }

  if (MOBILE_RENDER_DEBUG_USER_AGENT_PATTERN.test(navigator.userAgent)) {
    return false;
  }

  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  return !coarsePointer || (navigator.maxTouchPoints ?? 0) <= 1;
}

function formatRenderDebugNumber(value: number | undefined, digits: number): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "-";
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

function keepStalledArenaEntryLocked(token: number): void {
  if (arenaEntryToken !== token || !isArenaEntryLoading) {
    return;
  }

  setArenaEntryLoaderVisible(true);
  syncActionArc();
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
    keepStalledArenaEntryLocked(token);
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
  const hasPendingBattleRewardRetry = Boolean(pendingBattleRewardRetry);

  renderDom(dom, state, {
    hero,
    reward: gameMode === "pvp" || hasPendingBattleRewardRetry ? { gold: 0, xp: 0 } : getBattleReward(state),
    statsState: displayedStatsState,
    resultPresentation: battleResultPresentation,
    resultPresentationStage: battleResultPresentationStage,
    deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation || pendingBattleRewardSettlement),
    resultReturn: {
      ready: hasPendingBattleRewardRetry
        ? !pendingBattleRewardSettlement
        : battleResultPresentationStage === "loot"
          ? true
          : battleResultReturnReady && !battleResultSequenceLocked,
      label: hasPendingBattleRewardRetry
        ? BATTLE_REWARD_CLAIM_RETRY_LABEL
        : battleResultPresentationStage === "loot"
          ? "Continue"
          : battleResultReturnLabel,
    },
    onResultSequenceLockChange: setBattleResultSequenceLocked,
  });
  dom.gameScreen.classList.toggle("battle-screen--online-duo-boss", gameMode === "pvp" && pvpSnapshot?.roomKind === "duoBoss");
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
    attributeDraftAllocations,
    attributeSaveStatus,
    attributeControlsDisabled: attributeSaveStatus === "saving",
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

async function handleHeroProgressReset(sourceButton?: HTMLButtonElement): Promise<void> {
  if (!canShowCityAdminControls()) {
    return;
  }

  if (!window.confirm("Reset hero progress? This cannot be undone.")) {
    return;
  }

  sourceButton?.setAttribute("disabled", "");

  try {
    if (canUseGladiatorCloudSave()) {
      await deleteGladiatorCloudSave();
    }

    resetHeroProgressState();
  } catch (error) {
    console.warn("[gladiator-save] Failed to reset hero progress.", error);
    window.alert("Reset failed. Try again.");
  } finally {
    sourceButton?.removeAttribute("disabled");
  }
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
  const rewardSettlement = pendingBattleRewardSettlement;

  void actionAnimation
    .catch(() => undefined)
    .then(nextAnimationFrame)
    .then(() => rewardSettlement?.catch(() => undefined))
    .then(() => {
      if (battleResultPresentationRevealToken !== revealToken || state.result === "playing") {
        return;
      }

      revealPendingBattleResultPresentation();
    });
}

function revealPendingBattleResultPresentation(): boolean {
  if (!pendingBattleResultPresentation || state.result === "playing") {
    return false;
  }

  battleResultPresentation = pendingBattleResultPresentation;
  battleResultPresentationStage = getInitialBattleResultPresentationStage(battleResultPresentation);
  pendingBattleResultPresentation = undefined;
  renderCityHero();
  renderCurrentDom();
  syncTurnProbe();

  return true;
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
  const lockedTurn: TurnOwner = controlledActor === "helper" ? "player" : "enemy";
  const visibleState = isTurnAnimationLocked || isArenaEntryLoading || isArenaEntryTransitionPlaying
    ? { ...state, activeTurn: lockedTurn }
    : state;

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
  const onlineAutoActive = isOnlineDuoSeatAutoEnabled() && !onlineDuoAutoOffPending;
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
  return isOnlineDuoSeatAutoEnabledForSnapshot(pvpSnapshot);
}

function isOnlineDuoSeatAutoEnabledForSnapshot(snapshot?: PvpRoomSnapshot): boolean {
  return gameMode === "pvp"
    && !isInCity
    && !!snapshot
    && snapshot.roomKind === "duoBoss"
    && snapshot.status === "playing"
    && state.result === "playing"
    && Boolean(snapshot.autoSeats?.[snapshot.seat]);
}

function handlePvpAutoOff(): void {
  if (!pvpConnection || !isOnlineDuoSeatAutoEnabled() || onlineDuoAutoOffPending) {
    return;
  }

  setOnlineDuoAutoOffPending(true);
  pvpConnection?.sendAutoOff();
}

function setOnlineDuoAutoOffPending(pending: boolean): void {
  if (onlineDuoAutoOffPendingTimer !== undefined) {
    window.clearTimeout(onlineDuoAutoOffPendingTimer);
    onlineDuoAutoOffPendingTimer = undefined;
  }

  onlineDuoAutoOffPending = pending;

  if (pending) {
    onlineDuoAutoOffPendingTimer = window.setTimeout(() => {
      onlineDuoAutoOffPendingTimer = undefined;
      onlineDuoAutoOffPending = false;
      syncAutoBattleToggle();
    }, ONLINE_DUO_AUTO_OFF_PENDING_TIMEOUT_MS);
  }

  syncAutoBattleToggle();
}

function clearOnlineDuoAutoOffPending(): void {
  setOnlineDuoAutoOffPending(false);
}

function syncOnlineDuoBossPendingWatchdog(snapshot = pvpSnapshot): void {
  clearOnlineDuoBossPendingWatchdog();

  if (
    gameMode !== "pvp" ||
    !snapshot ||
    snapshot.roomKind !== "duoBoss" ||
    snapshot.status !== "playing" ||
    !snapshot.duoBossEnemyTurnPending ||
    !snapshot.deadlineAt
  ) {
    return;
  }

  const delayMs = Math.max(0, snapshot.deadlineAt - snapshot.serverNow) + ONLINE_DUO_BOSS_PENDING_WATCHDOG_GRACE_MS;

  onlineDuoBossPendingWatchdogTimer = window.setTimeout(() => {
    onlineDuoBossPendingWatchdogTimer = undefined;
    void refreshOnlineDuoBossSnapshot();
  }, delayMs);
}

function clearOnlineDuoBossPendingWatchdog(): void {
  if (onlineDuoBossPendingWatchdogTimer !== undefined) {
    window.clearTimeout(onlineDuoBossPendingWatchdogTimer);
    onlineDuoBossPendingWatchdogTimer = undefined;
  }
}

async function refreshOnlineDuoBossSnapshot(): Promise<void> {
  const session = pvpSession;
  const snapshot = pvpSnapshot;

  if (
    onlineDuoBossRefreshPending ||
    !session ||
    !snapshot ||
    snapshot.roomKind !== "duoBoss" ||
    !snapshot.duoBossEnemyTurnPending
  ) {
    return;
  }

  onlineDuoBossRefreshPending = true;

  try {
    const currentRoom = await getCurrentPvpRoom();

    if (!currentRoom || currentRoom.roomCode !== session.roomCode || currentRoom.token !== session.token) {
      return;
    }

    handlePvpSnapshot(currentRoom.snapshot);
  } catch {
    setPvpStatus("Syncing boss turn...");
    syncOnlineDuoBossPendingWatchdog(snapshot);
  } finally {
    onlineDuoBossRefreshPending = false;
  }
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
  if (!hasStarted || isInCity || isTurnAnimationLocked || isArenaEntryLoading || isArenaEntryTransitionPlaying) {
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
  markArenaEntryProfiler("runArenaEntry start");
  isArenaEntryTransitionPlaying = true;
  syncAutoBattleToggle();

  try {
    markArenaEntryProfiler("prepareEntry start");
    await scene.prepareEntry(state);
    markArenaEntryProfiler("prepareEntry end");

    if (!isActiveArenaEntry(scene, entryToken)) {
      finishArenaEntryProfilerRun("cancelled: inactive scene");
      return;
    }

    finishArenaEntryGate(entryToken);
    markArenaEntryProfiler("entry transition start");
    await scene.playEntryTransition(state);
    markArenaEntryProfiler("entry transition end");
  } finally {
    const stillActive = isActiveArenaEntry(scene, entryToken);

    isArenaEntryTransitionPlaying = false;
    syncAutoBattleToggle();

    if (stillActive) {
      finishArenaEntryGate(entryToken);
      refreshArenaLayout();
      scheduleAutoPlayerTurn();
      finishArenaEntryProfilerRunAfterNextFrame("ready");
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

function handleMagicEquipmentHeroViewChange(open: boolean): void {
  if (open) {
    cityScene?.focusMagicShop(true);
  } else {
    cityScene?.focusDefault(true);
  }
}

function focusCityDefaultFromShop(): void {
  flushShopEquipmentVisualSync();
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
    cityArenaQuestClaimButton.disabled = cityArenaQuestClaimPending || !status.ready;
    cityArenaQuestClaimButton.textContent = cityArenaQuestClaimPending
      ? "CLAIMING"
      : status.claimed
        ? "CLAIMED"
        : "CLAIM";
  }
}

function setCityArenaQuestPanelOpen(open: boolean): void {
  if (open) {
    const now = new Date().toISOString();
    const nextHero = markHeroArenaWinQuestOpened(hero, now);

    if (nextHero !== hero) {
      hero = nextHero;
      saveLocalHeroSave(hero);
    }
  }

  isCityArenaQuestPanelOpen = open;
  syncCityArenaQuestControls();
}

function toggleCityArenaQuestPanel(): void {
  setCityArenaQuestPanelOpen(!isCityArenaQuestPanelOpen);
}

async function claimCityArenaQuestReward(): Promise<void> {
  if (cityArenaQuestClaimPending) {
    return;
  }

  const status = getHeroArenaWinQuestStatus(hero);

  if (!status.ready) {
    syncCityArenaQuestControls();
    return;
  }

  if (canUseGladiatorCloudSave()) {
    cityArenaQuestClaimPending = true;
    syncCityArenaQuestControls();

    try {
      const reward = await claimGladiatorArenaQuestReward();

      applyHeroArenaQuestRewardPatch(reward);
      saveLocalHeroSave(hero);
      renderCityHero();
      renderCityArenaMenu();
    } catch (error) {
      console.error("Gladiator arena quest claim failed", error);
      window.alert("Could not claim quest reward. Try again.");
    } finally {
      cityArenaQuestClaimPending = false;
      syncCityArenaQuestControls();
    }

    return;
  }

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

function applyHeroArenaQuestRewardPatch(reward: GladiatorArenaQuestRewardPatch): void {
  hero = {
    ...hero,
    arenaWinQuest: reward.arenaWinQuest,
    gold: reward.gold,
    arenaEnergy: reward.arenaEnergy,
    updatedAt: reward.updatedAt,
  };
}

function isCityArenaAutoFightUnlockedForTier(tierId: number): boolean {
  if (canShowAdminOnlyGameFeatures()) {
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

function getCityArenaBossLevelRequirement(tierId: number): number {
  return tierId === DEFAULT_ARENA_TIER_ID ? CITY_ARENA_TIER_ONE_BOSS_LEVEL_REQUIREMENT : 0;
}

function getLockedCityArenaBossLevelRequirement(tierId: number): number {
  const requirement = getCityArenaBossLevelRequirement(tierId);

  return requirement > 0 && hero.level < requirement ? requirement : 0;
}

function getArenaSelectionLevelRequirement(selection: ArenaMenuSelection): number {
  return selection.kind === "random"
    ? getCityArenaDifficultyLevelRequirement(selection.tierId, selection.difficultyId)
    : getCityArenaBossLevelRequirement(createArenaBossEncounter(selection.bossId).tierId);
}

function getArenaSelectionLevelGateTitle(selection: ArenaMenuSelection): string {
  const requirement = getArenaSelectionLevelRequirement(selection);

  if (requirement <= 0 || hero.level >= requirement) {
    return "";
  }

  return `Requires LVL ${requirement}.`;
}

function getCityArenaBossLevelGateTitle(tierId: number): string {
  const requirement = Number.isFinite(tierId) ? getCityArenaBossLevelRequirement(Math.floor(tierId)) : 0;

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
  const levelRequirement = getLockedCityArenaBossLevelRequirement(boss.tierId);
  const bossDisabledTitle = getCityArenaBossDisabledTitle(boss, ARENA_BOSS_ENERGY_COST);
  const duoDisabledTitle = getCityArenaBossDisabledTitle(boss, ARENA_DUO_BOSS_ENERGY_COST);

  card.className = "city-arena-menu__boss-card";
  button.className = "city-arena-menu__boss";
  button.type = "button";
  button.disabled = Boolean(bossDisabledTitle);
  button.title = bossDisabledTitle;
  button.dataset.cityArenaBotButton = "true";
  button.dataset.cityArenaBossId = boss.id;
  button.dataset.cityArenaBossMode = "solo";
  button.dataset.cityArenaBossTierId = `${boss.tierId}`;
  button.dataset.cityArenaEnergyCost = `${ARENA_BOSS_ENERGY_COST}`;
  syncCityArenaBossTitle(name, "Boss", ARENA_BOSS_ENERGY_COST, levelRequirement);
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
  duoBotButton.dataset.cityArenaBossId = boss.id;
  duoBotButton.dataset.cityArenaBossMode = "duo-bot";
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
  duoOnlineButton.dataset.cityArenaBossId = boss.id;
  duoOnlineButton.dataset.cityArenaBossMode = "duo-online";
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

function syncCityArenaBossTitle(title: HTMLElement, label: string, energyCost: number, levelRequirement = 0): void {
  const button = title.closest<HTMLElement>(".city-arena-menu__boss");
  const text = document.createElement("span");
  const cost = createCityArenaEnergyCostItem(energyCost);
  const existingRibbon = button?.querySelector<HTMLElement>("[data-city-level-ribbon='arena-boss']");

  title.classList.add("city-arena-menu__boss-title");
  text.className = "city-arena-menu__boss-title-text";
  text.textContent = label;
  cost.classList.add("city-arena-menu__boss-cost");
  title.replaceChildren(text, cost);
  existingRibbon?.remove();

  if (levelRequirement > 0) {
    const levelRibbon = createCityLevelRibbon(levelRequirement, "city-arena-menu__fight-level", "arena-boss");

    if (button) {
      button.append(levelRibbon);
    } else {
      title.append(levelRibbon);
    }
  }
}

function createCityArenaDuoLabel(): HTMLElement {
  const label = document.createElement("span");

  label.className = "city-arena-menu__boss-duo-label";
  label.textContent = "Duo";
  return label;
}

function getCityArenaBossDisabledTitle(boss: ArenaBossDefinition, energyCost: number): string {
  const levelGateTitle = getArenaSelectionLevelGateTitle({ kind: "boss", bossId: boss.id });

  if (levelGateTitle) {
    return levelGateTitle;
  }

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
    syncCityArenaNoEnergyPanel(
      button.closest<HTMLElement>(".city-arena-menu__fight-row"),
      currentArenaEnergy < getArenaSelectionEnergyCost(selection) && !isPendingManualArenaStartSelection(selection),
    );
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
    const bossTierId = Number(button.dataset.cityArenaBossTierId);
    const levelGateTitle = getCityArenaBossLevelGateTitle(bossTierId);
    const title = levelGateTitle || getCityArenaBotDisabledTitle(getCityArenaBotButtonEnergyCost(button));
    const bossTierLimitTitle = title ? "" : getCityArenaBossVictoryLimitTitle(bossTierId);
    const buttonTitle = title || bossTierLimitTitle;

    button.disabled = Boolean(buttonTitle);
    button.title = buttonTitle || button.dataset.defaultTitle || "";
  });
  cityArenaBossList?.querySelectorAll<HTMLElement>(".city-arena-menu__boss-card").forEach((card) => {
    const bossButton = card.querySelector<HTMLButtonElement>(".city-arena-menu__boss");
    const energyCost = bossButton ? getCityArenaBotButtonEnergyCost(bossButton) : ARENA_BOSS_ENERGY_COST;
    const isStartingThisBoss =
      pendingManualArenaStartSelection?.kind === "boss" &&
      Boolean(bossButton?.dataset.cityArenaBossId) &&
      pendingManualArenaStartSelection.bossId === bossButton?.dataset.cityArenaBossId;

    syncCityArenaNoEnergyPanel(card, currentArenaEnergy < energyCost && !isStartingThisBoss);
  });
  syncCityArenaManualStartIndicators();
}

function setPendingManualArenaStartSelection(selection?: ArenaMenuSelection): void {
  pendingManualArenaStartSelection = selection;
  cityArenaMenu?.classList.toggle("city-arena-menu--start-pending", Boolean(selection));
  syncCityArenaBotControls();
}

function isPendingManualArenaStartSelection(selection?: ArenaMenuSelection): boolean {
  if (!pendingManualArenaStartSelection || !selection || pendingManualArenaStartSelection.kind !== selection.kind) {
    return false;
  }

  if (selection.kind === "random" && pendingManualArenaStartSelection.kind === "random") {
    return pendingManualArenaStartSelection.tierId === selection.tierId && pendingManualArenaStartSelection.difficultyId === selection.difficultyId;
  }

  if (selection.kind === "boss" && pendingManualArenaStartSelection.kind === "boss") {
    return pendingManualArenaStartSelection.bossId === selection.bossId && Boolean(pendingManualArenaStartSelection.duo) === Boolean(selection.duo);
  }

  return false;
}

function syncCityArenaManualStartIndicators(): void {
  const buttons = [
    cityArenaEasyButton,
    cityArenaRandomButton,
    cityArenaHardButton,
    ...Array.from(cityArenaBossList?.querySelectorAll<HTMLButtonElement>("[data-city-arena-bot-button]") ?? []),
  ].filter((button): button is HTMLButtonElement => Boolean(button));

  buttons.forEach((button) => syncCityArenaManualStartButton(button, isCityArenaManualStartButton(button)));
}

function syncCityArenaManualStartButton(button: HTMLButtonElement, starting: boolean): void {
  button.classList.toggle("city-arena-menu__bot-button--starting", starting);
  button.toggleAttribute("aria-busy", starting);

  const label = Array.from(button.children).find((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains("city-arena-menu__start-label"));

  if (!starting) {
    label?.remove();
    return;
  }

  const nextLabel = label ?? document.createElement("span");

  nextLabel.className = "city-arena-menu__start-label";
  nextLabel.textContent = arenaEnergySpendPending ? "SPENDING ENERGY" : "ENTERING ARENA";
  if (!label) {
    button.append(nextLabel);
  }
}

function isCityArenaManualStartButton(button: HTMLButtonElement): boolean {
  const pendingSelection = pendingManualArenaStartSelection;

  if (!pendingSelection) {
    return false;
  }

  if (pendingSelection.kind === "random") {
    return (
      (pendingSelection.difficultyId === "easy" && button === cityArenaEasyButton) ||
      (pendingSelection.difficultyId === DEFAULT_ARENA_DIFFICULTY_ID && button === cityArenaRandomButton) ||
      (pendingSelection.difficultyId === "hard" && button === cityArenaHardButton)
    );
  }

  const bossMode = pendingSelection.duo ? "duo-bot" : "solo";

  return button.dataset.cityArenaBossId === pendingSelection.bossId && button.dataset.cityArenaBossMode === bossMode;
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

  if (pendingManualArenaStartSelection) {
    return "Entering arena...";
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
    void refreshPvpReconnectRoom({ silent: true });
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
  const reconnectItem = createPvpReconnectRoomListItem();
  const shouldShow = isCityArenaOnlineViewOpen || pvpRoomsVisible || entries.length > 0 || Boolean(reconnectItem);

  cityPvpRoomList.hidden = !shouldShow;
  if (!shouldShow) {
    cityPvpRoomList.replaceChildren();
    return;
  }

  if (pvpControlsBusy && entries.length === 0 && !reconnectItem) {
    cityPvpRoomList.replaceChildren(createPvpRoomListMessage("Refreshing..."));
    return;
  }

  cityPvpRoomList.replaceChildren(
    ...(reconnectItem ? [reconnectItem] : []),
    ...(entries.length > 0 ? entries.map(createPvpRoomListItem) : (reconnectItem ? [] : [createPvpRoomListMessage("No rooms yet.")])),
  );
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

function createPvpReconnectRoomListItem(): HTMLElement | undefined {
  const response = pvpReconnectRoom?.snapshot.status !== "finished" ? pvpReconnectRoom : undefined;
  const candidate = response ? undefined : locallyLeftPvpRoom;

  if (pvpSession || (!response && !candidate)) {
    return undefined;
  }

  const item = document.createElement("div");
  const copy = document.createElement("div");
  const name = document.createElement("strong");
  const meta = document.createElement("span");
  const button = document.createElement("button");
  const roomKind = response?.roomKind ?? response?.snapshot.roomKind ?? candidate?.roomKind ?? "duoBoss";

  item.className = "city-arena-menu__pvp-room city-arena-menu__pvp-room--reconnect";
  copy.className = "city-arena-menu__pvp-room-copy";
  name.className = "city-arena-menu__pvp-room-name";
  name.textContent = roomKind === "duoBoss" ? "DUO FIGHT IN PROGRESS" : "PVP FIGHT IN PROGRESS";
  meta.className = "city-arena-menu__pvp-room-meta";
  meta.textContent = response ? formatPvpReconnectRoomMeta(response) : "Reconnect to your active fight.";
  button.className = "city-arena-menu__pvp-button city-arena-menu__pvp-room-button";
  button.type = "button";
  button.textContent = "RECONNECT";
  button.disabled = pvpControlsBusy;
  button.addEventListener("click", () => {
    void handleReconnectPvpRoom();
  });

  copy.append(name, meta);
  item.append(copy, button);
  return item;
}

function formatPvpReconnectRoomMeta(response: PvpRoomResponse): string {
  const snapshot = response.snapshot;

  if ((response.roomKind ?? snapshot.roomKind) === "duoBoss") {
    const bossName = snapshot.bossName ?? "Boss";
    const tierText = snapshot.bossTierId ? `T${snapshot.bossTierId}` : "PVE";

    return `${tierText} - ${bossName}`;
  }

  return "Reconnect to PvP match.";
}

function createPvpRoomListMessage(message: string): HTMLElement {
  const item = document.createElement("div");

  item.className = "city-arena-menu__pvp-room-empty";
  item.textContent = message;
  return item;
}

async function refreshPvpReconnectRoom(options: { silent?: boolean } = {}): Promise<void> {
  if (pvpSession) {
    return;
  }

  try {
    const currentRoom = await getCurrentPvpRoom();

    if (!currentRoom || isLocallyLeftPvpRoomResponse(currentRoom)) {
      pvpReconnectRoom = undefined;
      renderPvpRoomList();
      return;
    }

    if (currentRoom.snapshot.status === "finished") {
      pvpReconnectRoom = undefined;
      handleFinishedPvpRoomResponse(currentRoom);
      renderPvpRoomList();
      return;
    }

    pvpReconnectRoom = currentRoom;
    renderPvpRoomList();
  } catch {
    if (!options.silent) {
      setPvpStatus("Reconnect check failed.");
    }
  }
}

async function refreshPvpRoomList(options: { silent?: boolean } = {}): Promise<void> {
  pvpRoomsVisible = true;
  setPvpControlsBusy(true);
  if (!options.silent) {
    setPvpStatus("");
  }

  try {
    await refreshPvpReconnectRoom({ silent: true });
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
    await refreshPvpReconnectRoom({ silent: true });
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

async function handleReconnectPvpRoom(): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }

  setPvpControlsBusy(true);
  setPvpStatus("Reconnecting...");

  try {
    const reconnectSession = pvpReconnectRoom?.snapshot.status !== "finished" ? pvpReconnectRoom : locallyLeftPvpRoom;
    let response = reconnectSession ? await reconnectPvpRoomSession(reconnectSession) : undefined;

    if (!response) {
      response = await getCurrentPvpRoom();
    }
    if (!response) {
      pvpReconnectRoom = undefined;
      clearPvpReconnectCandidate();
      setPvpStatus("Fight not found.");
      return;
    }
    if (response.snapshot.status === "finished") {
      handleFinishedPvpRoomResponse(response);
      setPvpStatus("Fight ended.");
      return;
    }

    pvpReconnectRoom = undefined;
    clearPvpReconnectCandidate();
    beginPvpRoom(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reconnect failed.";

    if (message.includes("Room not found")) {
      pvpReconnectRoom = undefined;
      clearPvpReconnectCandidate();
    }
    setPvpStatus(message);
  } finally {
    if (!pvpSession) {
      setPvpControlsBusy(false);
      syncPvpControls();
    }
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
    leavePvpRoom({ keepStatus: true, notifyServer: false });
    pvpRoomsVisible = true;
    renderPvpRoomList();
    setPvpStatus("Room cancelled.");
  } catch (error) {
    setPvpStatus(error instanceof Error ? error.message : "PvP cancel failed.");
    setPvpControlsBusy(false);
  }
}

function beginPvpRoom(response: PvpRoomResponse): void {
  if (isLocallyLeftPvpRoomResponse(response)) {
    setPvpControlsBusy(false);
    syncPvpControls();
    setPvpStatus("Leaving previous room...");
    return;
  }

  pvpReconnectRoom = undefined;
  clearPvpReconnectCandidate();
  leavePvpRoom({ keepStatus: true, notifyServer: false });
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

  const closedSession = pvpSession;
  const closedSnapshot = pvpSnapshot;
  const shouldShowDisconnectResult = gameMode === "pvp" && pvpSnapshot?.roomKind !== "duoBoss" && !isInCity && state.result === "playing";

  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  if (closedSnapshot && closedSnapshot.status !== "finished") {
    pvpReconnectRoom = {
      roomCode: closedSession.roomCode,
      token: closedSession.token,
      seat: closedSession.seat,
      roomKind: closedSession.roomKind ?? closedSnapshot.roomKind,
      snapshot: closedSnapshot,
    };
  }
  pvpActionPending = false;
  clearOnlineDuoAutoOffPending();
  clearOnlineDuoBossPendingWatchdog();
  onlineDuoBossRefreshPending = false;
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
    if (!pvpSession) {
      return;
    }

    pvpActionPending = false;
    pvpSnapshotPlaybackToken += 1;
    setTurnAnimationLocked(false);
    setPvpStatus(message.message);
    return;
  }

  if (!isPvpSnapshotForCurrentSession(message.snapshot)) {
    return;
  }

  handlePvpSnapshot(message.snapshot);
}

function handlePvpSnapshot(snapshot: PvpRoomSnapshot): void {
  if (!isPvpSnapshotForCurrentSession(snapshot)) {
    return;
  }

  pvpSnapshot = snapshot;
  pvpActionPending = false;
  if (!snapshot.autoSeats?.[snapshot.seat]) {
    clearOnlineDuoAutoOffPending();
  }
  syncOnlineDuoBossPendingWatchdog(snapshot);
  setPvpStatus(formatPvpRoomStatus(snapshot));
  syncPvpTurnTimer(snapshot);

  applyOnlineDuoHostStartCostIfNeeded(snapshot);

  if (!snapshot.state) {
    return;
  }

  applyOnlineDuoRewardIfNeeded(snapshot);

  if (snapshot.status === "finished" && isInCity) {
    return;
  }

  if (isInCity) {
    closeCityArenaMenu();
    void startGameWithCityTransition({ mode: "pvp", initialState: snapshot.state });
    return;
  }

  if (gameMode === "pvp") {
    commitPvpSnapshotState(snapshot);
  }
}

function handleFinishedPvpRoomResponse(response: PvpRoomResponse): void {
  const session: PvpRoomSession = {
    roomCode: response.roomCode,
    token: response.token,
    seat: response.seat,
    roomKind: response.roomKind ?? response.snapshot.roomKind ?? "pvp",
  };

  applyOnlineDuoRewardIfNeeded(response.snapshot, session);
  pvpReconnectRoom = undefined;
  if (isSamePvpReconnectSession(session)) {
    clearPvpReconnectCandidate();
  }
}

function isPvpSnapshotForCurrentSession(snapshot: PvpRoomSnapshot): boolean {
  if (!pvpSession) {
    return false;
  }

  return snapshot.roomCode === pvpSession.roomCode
    && snapshot.seat === pvpSession.seat
    && (snapshot.roomKind ?? "pvp") === (pvpSession.roomKind ?? "pvp");
}

function isLocallyLeftPvpRoomResponse(response: PvpRoomResponse): boolean {
  return Boolean(locallyLeftPvpRoom
    && response.roomCode === locallyLeftPvpRoom.roomCode
    && response.token === locallyLeftPvpRoom.token
    && response.seat === locallyLeftPvpRoom.seat);
}

function isSamePvpReconnectSession(session: Pick<PvpRoomSession, "roomCode" | "token" | "seat">): boolean {
  return Boolean(locallyLeftPvpRoom
    && session.roomCode === locallyLeftPvpRoom.roomCode
    && session.token === locallyLeftPvpRoom.token
    && session.seat === locallyLeftPvpRoom.seat);
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

  if (hasLocalMarker(markerKey) || onlineDuoHostSpendPendingRooms.has(markerKey)) {
    return;
  }

  onlineDuoHostSpendPendingRooms.add(markerKey);
  void spendOnlineDuoHostStartCost(markerKey).finally(() => {
    onlineDuoHostSpendPendingRooms.delete(markerKey);
  });
}

async function spendOnlineDuoHostStartCost(markerKey: string): Promise<void> {
  try {
    if (canUseGladiatorCloudSave()) {
      hero = {
        ...hero,
        arenaEnergy: await spendGladiatorArenaEnergy(hero, ARENA_DUO_BOSS_ENERGY_COST),
      };
    } else {
      const spendResult = spendHeroArenaEnergy(hero, ARENA_DUO_BOSS_ENERGY_COST);

      if (!spendResult.ok) {
        hero = spendResult.hero;
        saveLocalHeroSave(hero);
        renderCityHero();
        setPvpStatus(getArenaEnergyShortageMessage(spendResult.arenaEnergy.current, ARENA_DUO_BOSS_ENERGY_COST));
        return;
      }

      hero = spendResult.hero;
    }

    saveLocalHeroSave(hero);
    setLocalMarker(markerKey);
    renderCityHero();
    renderCityArenaMenu();
  } catch (error) {
    if (error instanceof GladiatorSaveError && error.arenaEnergy) {
      hero = {
        ...hero,
        arenaEnergy: error.arenaEnergy,
      };
      saveLocalHeroSave(hero);
      renderCityHero();
      setPvpStatus(getArenaEnergyShortageMessage(error.arenaEnergy.current, ARENA_DUO_BOSS_ENERGY_COST));
      return;
    }

    console.warn("Online duo host energy spend failed", error);
    setPvpStatus("Could not spend duo boss energy. Reconnecting...");
  }
}

function applyOnlineDuoRewardIfNeeded(snapshot: PvpRoomSnapshot, session = pvpSession): void {
  if (!isOnlineDuoSnapshot(snapshot) || snapshot.status !== "finished" || !snapshot.state || snapshot.state.result === "playing") {
    return;
  }

  const markerKey = getOnlineDuoRewardMarkerKey(snapshot);

  if (hasLocalMarker(markerKey)) {
    ackOnlineDuoResultIfNeeded(snapshot, session);
    return;
  }

  if (onlineDuoRewardPendingRooms.has(markerKey)) {
    return;
  }

  if (canUseGladiatorCloudSave()) {
    startOnlineDuoRewardSettlement(snapshot, session, markerKey);
    return;
  }

  applyOnlineDuoRewardSettlement(snapshot, session, markerKey, createLocalOnlineDuoRewardApplication(snapshot), {
    cloudSaveReason: snapshot.seat === "host" ? "online-duo-host-reward" : "online-duo-helper-reward",
  });
}

function startOnlineDuoRewardSettlement(
  snapshot: PvpRoomSnapshot,
  session: PvpRoomSession | undefined,
  markerKey: string,
): void {
  onlineDuoRewardPendingRooms.add(markerKey);

  const settlementPromise = settleOnlineDuoRewardFromServer(snapshot, session, markerKey);

  pendingBattleRewardSettlement = settlementPromise;
  startBattleResultReturnGate();
  markRewardUiRenderDirty();

  void settlementPromise.finally(() => {
    onlineDuoRewardPendingRooms.delete(markerKey);

    if (pendingBattleRewardSettlement !== settlementPromise) {
      return;
    }

    pendingBattleRewardSettlement = undefined;
    renderCurrentDom();
  });
}

async function settleOnlineDuoRewardFromServer(
  snapshot: PvpRoomSnapshot,
  session: PvpRoomSession | undefined,
  markerKey: string,
): Promise<void> {
  try {
    const rewardApplication = await settleGladiatorOnlineDuoBossReward(snapshot);

    applyOnlineDuoRewardSettlement(snapshot, session, markerKey, rewardApplication);
  } catch (error) {
    console.warn("Online duo reward settlement failed", error);
    setPvpStatus("Could not claim duo reward. Try again.");
  }
}

function createLocalOnlineDuoRewardApplication(snapshot: PvpRoomSnapshot): GladiatorBattleSettlement {
  const combat = snapshot.state;

  if (!combat || combat.result === "playing") {
    throw new Error("Online duo reward requires a finished combat state.");
  }

  const rewardTimestamp = new Date().toISOString();
  const combatForReward = createOnlineDuoRewardCombat(snapshot);
  const rewardApplication = applyCombatReward(hero, combatForReward, rewardTimestamp, Math.random, {
    recordBossVictory: snapshot.seat === "host",
  });
  let heroAfterReward = rewardApplication.heroAfterReward;

  if (snapshot.seat === "guest" && combat.result === "win") {
    heroAfterReward = grantHeroArenaEnergy(heroAfterReward, ONLINE_DUO_GUEST_ENERGY_REWARD, rewardTimestamp);
  }

  return heroAfterReward === rewardApplication.heroAfterReward
    ? rewardApplication
    : { ...rewardApplication, heroAfterReward };
}

function applyOnlineDuoRewardSettlement(
  snapshot: PvpRoomSnapshot,
  session: PvpRoomSession | undefined,
  markerKey: string,
  rewardApplication: GladiatorBattleSettlement,
  options: { cloudSaveReason?: string } = {},
): void {
  const combat = snapshot.state;

  if (!combat) {
    return;
  }

  const { reward, loot, heroBeforeReward, heroAfterReward } = rewardApplication;

  hero = heroAfterReward;
  saveLocalHeroSave(hero);
  if (options.cloudSaveReason) {
    queueHeroCloudSave(options.cloudSaveReason);
  }
  rememberDroppedEquipmentHint(combat, loot);
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
  ackOnlineDuoResultIfNeeded(snapshot, session);
}

function ackOnlineDuoResultIfNeeded(snapshot: PvpRoomSnapshot, session?: PvpRoomSession): void {
  if (!session || snapshot.roomCode !== session.roomCode || snapshot.seat !== session.seat || snapshot.status !== "finished") {
    return;
  }

  void ackPvpRoomResult(session).catch(() => {
    // Best-effort cleanup: the finished room still has its TTL fallback.
  });
  if (isSamePvpReconnectSession(session)) {
    clearPvpReconnectCandidate();
  }
  if (pvpReconnectRoom?.roomCode === session.roomCode && pvpReconnectRoom.token === session.token) {
    pvpReconnectRoom = undefined;
  }
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

function rememberPvpReconnectCandidate(session: PvpRoomSession): void {
  const candidate: PvpReconnectCandidate = {
    roomCode: session.roomCode,
    token: session.token,
    seat: session.seat,
    roomKind: session.roomKind,
    updatedAt: Date.now(),
  };

  locallyLeftPvpRoom = candidate;
  try {
    window.localStorage.setItem(PVP_RECONNECT_STORAGE_KEY, JSON.stringify(candidate));
  } catch {
    // A local reconnect hint is helpful, but the server active session is the source of truth.
  }
}

function clearPvpReconnectCandidate(): void {
  locallyLeftPvpRoom = undefined;
  try {
    window.localStorage.removeItem(PVP_RECONNECT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in some embedded browsers.
  }
}

function loadPvpReconnectCandidate(): PvpReconnectCandidate | undefined {
  try {
    const payload = window.localStorage.getItem(PVP_RECONNECT_STORAGE_KEY);
    const candidate = payload ? JSON.parse(payload) : undefined;

    return isPvpReconnectCandidate(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

function isPvpReconnectCandidate(value: unknown): value is PvpReconnectCandidate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PvpReconnectCandidate>;

  return typeof candidate.roomCode === "string"
    && typeof candidate.token === "string"
    && (candidate.seat === "host" || candidate.seat === "guest")
    && (candidate.roomKind === undefined || candidate.roomKind === "pvp" || candidate.roomKind === "duoBoss");
}

function leavePvpRoom(options: { keepStatus?: boolean; notifyServer?: boolean } = {}): void {
  const session = pvpSession;
  const shouldNotifyServer = Boolean(session && options.notifyServer !== false && pvpSnapshot?.status !== "finished");

  if (session && shouldNotifyServer) {
    rememberPvpReconnectCandidate(session);
    void leavePvpRoomSession(session).catch(() => {
      // The local opt-out still prevents an immediate auto-resume if the best-effort leave fails.
    });
  } else if (session && pvpSnapshot?.status === "finished") {
    clearPvpReconnectCandidate();
  }

  pvpConnection?.close();
  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  pvpActionPending = false;
  clearOnlineDuoAutoOffPending();
  clearOnlineDuoBossPendingWatchdog();
  onlineDuoBossRefreshPending = false;
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
  if (locallyLeftPvpRoom || pvpReconnectRoom) {
    pvpRoomsVisible = true;
  }
  setCityArenaOnlineViewOpen(Boolean(pvpSession || locallyLeftPvpRoom || pvpReconnectRoom));
  if (!pvpSession && !locallyLeftPvpRoom && !pvpReconnectRoom) {
    void refreshPvpReconnectRoom({ silent: true }).then(() => {
      if (!pvpSession && pvpReconnectRoom && cityArenaMenu && !cityArenaMenu.hidden) {
        pvpRoomsVisible = true;
        setCityArenaOnlineViewOpen(true);
        syncPvpControls();
      }
    });
  }
  syncPvpControls();
  cityArenaMenu.hidden = false;
  cityMenu?.classList.add("city-menu--arena-select-open");
}

function closeCityArenaMenu(): void {
  setPendingManualArenaStartSelection();
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
  maybeBeginArenaEntryProfilerRun(selection);
  markArenaEntryProfiler("startSelectedArena");

  if (isPvpRoomBlockingArena()) {
    finishArenaEntryProfilerRun("blocked: online room");
    setPvpStatus("Cancel online room before fighting bots.");
    syncPvpControls();
    return;
  }

  const levelGateTitle = getArenaSelectionLevelGateTitle(selection);

  if (levelGateTitle) {
    finishArenaEntryProfilerRun("blocked: level gate");
    renderCityArenaMenu();
    window.alert(levelGateTitle);
    return;
  }

  if (selection.kind === "boss") {
    const limitTitle = getArenaSelectionBossVictoryLimitTitle(selection);

    if (limitTitle) {
      finishArenaEntryProfilerRun("blocked: boss limit");
      renderCityArenaMenu();
      window.alert(limitTitle);
      return;
    }
  }

  setPendingManualArenaStartSelection(selection);
  recordArenaEntryActivity("arena-entry-energy-spend");
  markArenaEntryProfiler("energy spend start");
  const hasEnergy = await spendArenaEnergyForSelectedArena(selection, { renderMenuOnSuccess: false });
  markArenaEntryProfiler("energy spend end");

  if (!hasEnergy) {
    finishArenaEntryProfilerRun("blocked: no energy");
    setPendingManualArenaStartSelection();
    return;
  }

  leavePvpRoom();
  gameMode = "pve";
  syncRestartButtonVisibility();
  activeArenaSelection = selection;
  markArenaEntryProfiler("create combat state start");
  const initialState = createCombatStateForSelection(selection);
  markArenaEntryProfiler("create combat state end");

  recordArenaEntryActivity("arena-entry-transition");
  markArenaEntryProfiler("city transition start");
  void startGameWithCityTransition({ initialState, cityTransition: "arenaPanel", prepareArenaEntry: true }).finally(() => {
    setPendingManualArenaStartSelection();
  });
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
    const rewardResult = await resolveAutoFightRewardApplication(resolvedState, random).catch((error) => {
      handleAutoFightRewardSettlementFailure(resolvedState, error);
      return undefined;
    });

    if (!rewardResult) {
      return;
    }

    const rewardApplication = rewardResult;
    const { loot, heroAfterReward } = rewardApplication;

    hero = heroAfterReward;
    rememberDroppedEquipmentHint(resolvedState, loot);
    saveLocalHeroSave(hero);
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

async function resolveAutoFightRewardApplication(
  resolvedState: CombatState,
  random: () => number,
): Promise<GladiatorBattleSettlement> {
  if (canUseGladiatorCloudSave()) {
    return settleGladiatorOfflineBattleReward(resolvedState, "auto");
  }

  return applyCombatReward(hero, resolvedState, new Date().toISOString(), random, {
    randomEnemyLootChanceMultiplier: AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER,
  });
}

function handleAutoFightRewardSettlementFailure(resolvedState: CombatState, error: unknown): void {
  console.error("Gladiator auto-fight settlement failed", error);
  presentAutoResolvedArenaResult(resolvedState, createUnclaimedBattleRewardPresentation());
  queueOfflineBattleRewardRetry(resolvedState, "auto");
  renderCurrentDom();
  window.alert("Could not claim battle reward. Try again.");
}

function createUnclaimedBattleRewardPresentation(): Omit<BattleResultPresentation, "id"> {
  return {
    reward: { gold: 0, xp: 0 },
    loot: [],
    heroBeforeReward: hero,
    heroAfterReward: hero,
    instant: true,
  };
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
  pendingBattleRewardRetry = undefined;
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
  pendingBattleRewardRetry = undefined;
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

async function spendArenaEnergyForSelectedArena(selection: ArenaMenuSelection, options: ArenaEnergySpendOptions = {}): Promise<boolean> {
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
  markArenaEntryProfiler("energy pending UI sync");
  await nextAnimationFrame();
  markArenaEntryProfiler("energy pending UI painted");

  try {
    if (canUseGladiatorCloudSave()) {
      markArenaEntryProfiler("energy API start");
      hero = {
        ...hero,
        arenaEnergy: await spendGladiatorArenaEnergy(hero, energyCost),
      };
      markArenaEntryProfiler("energy API end");
      saveLocalHeroSave(hero);
    } else {
      markArenaEntryProfiler("local energy spend start");
      const localSpend = spendHeroArenaEnergy(hero, energyCost);

      if (!localSpend.ok) {
        hero = localSpend.hero;
        syncHeroRuntimeState();
        window.alert(getArenaEnergyShortageMessage(localSpend.arenaEnergy.current, energyCost));
        return false;
      }

      hero = localSpend.hero;
      markArenaEntryProfiler("local energy spend end");
      saveLocalHeroSave(hero);
    }

    markArenaEntryProfiler("energy state sync start");
    syncHeroRuntimeState();
    if (options.renderMenuOnSuccess ?? true) {
      renderCityArenaMenu();
    } else {
      syncCityArenaMenuEnergy();
      syncCityArenaBotControls();
    }
    markArenaEntryProfiler("energy state sync end");
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

async function prepareCityScenePreviewForArenaEntry(encounter?: CombatState["encounter"]): Promise<void> {
  recordArenaEntryActivity("arena-entry-sleep-city");
  recordArenaEntryActivity("arena-entry-prewarm");
  markArenaEntryProfiler("prewarm arena assets start");
  await prewarmArenaAssetsForBrowserCache(encounter).catch(() => undefined);
  markArenaEntryProfiler("prewarm arena assets end");
  recordArenaEntryActivity("arena-entry-mount");
}

function recordArenaEntryActivity(action: string): void {
  recordWebglActivity({
    screen: "arena-entry",
    action,
    heroLevel: hero.level,
    heroGold: hero.gold,
  });
}

function mountArena(): void {
  markArenaEntryProfiler("mountArena start");
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  const entryToken = beginArenaEntryGate();

  window.requestAnimationFrame(() => {
    if (arenaEntryToken !== entryToken) {
      return;
    }

    markArenaEntryProfiler("launchArena start");
    unmountArena = launchArena((scene) => {
      if (arenaEntryToken !== entryToken) {
        return;
      }

      markArenaEntryProfiler("launchArena ready");
      arenaScene = scene;
      void runArenaEntry(scene, entryToken);
    }, handleAction, hero.equipment, hero.appearance, state.encounter);
    markArenaEntryProfiler("launchArena requested");
  });
}

function unmountArenaScene(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  cancelArenaEntryGate();
}

function startGame(options: StartGameOptions = {}): void {
  markArenaEntryProfiler("startGame start");
  gameMode = options.mode ?? "pve";
  resetBattleInteractionLocksForArenaStart();
  flushShopEquipmentVisualSync();
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
      markArenaEntryProfiler("commit initial state start");
      void commitState(initialState, { syncArena: false });
      markArenaEntryProfiler("commit initial state requested");
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
  markArenaEntryProfiler("combat controls mount start");
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  classicActionBar = mountClassicActionBar(dom.gameScreen, handleAction, () => debugTuning, {
    getControlledActor: getControlledActionActor,
  });
  autoBattleButton = mountAutoBattleToggle(dom.gameScreen);
  autoBattleOffButton = mountAutoBattleOffButton(dom.gameScreen);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = shouldMountTurnProbe() ? mountTurnProbe(dom.gameScreen) : undefined;
  markArenaEntryProfiler("combat controls mount end");
  if (initialState) {
    markArenaEntryProfiler("commit initial state start");
    void commitState(initialState, { syncArena: false });
    markArenaEntryProfiler("commit initial state requested");
  } else {
    restart({ syncArena: false });
  }
  mountArena();
  syncAutoBattleToggle();
}

async function startGameWithCityTransition(options: StartGameWithCityTransitionOptions = {}): Promise<void> {
  const { cityTransition = "city", prepareArenaEntry = false, ...startOptions } = options;
  const shouldPrepareArenaEntry = prepareArenaEntry && cityTransition === "arenaPanel" && startOptions.mode !== "pvp";

  markArenaEntryProfiler("startGameWithCityTransition");
  if (isArenaTransitionRunning) {
    finishArenaEntryProfilerRun("blocked: transition already running");
    return;
  }

  if (!isInCity) {
    startGame(startOptions);
    return;
  }

  isArenaTransitionRunning = true;
  dom.startButton.disabled = true;
  flushShopEquipmentVisualSync();
  clearShopPreview();
  if (!shouldPrepareArenaEntry) {
    void prewarmArenaAssetsForBrowserCache(startOptions.initialState?.encounter ?? state.encounter);
  }

  if (cityTransition === "city") {
    cityMenu?.classList.add("city-menu--arena-transition");
  }

  try {
    if (cityTransition === "arenaPanel") {
      markArenaEntryProfiler("arena panel transition start");
      await playCityArenaPanelEntryTransition();
      markArenaEntryProfiler("arena panel transition end");
    } else {
      markArenaEntryProfiler("city focus transition start");
      await (cityScene?.focusArenaTransition() ?? Promise.resolve());
      markArenaEntryProfiler("city focus transition end");
    }

    if (shouldPrepareArenaEntry) {
      showCityReturnTransition("Preparing Arena...");
      markArenaEntryProfiler("prepare city preview start");
      await prepareCityScenePreviewForArenaEntry(startOptions.initialState?.encounter ?? state.encounter);
      markArenaEntryProfiler("prepare city preview end");
    }
  } finally {
    if (shouldPrepareArenaEntry) {
      hideCityReturnTransition();
    }
    markArenaEntryProfiler("startGame call");
    startGame(startOptions);
    markArenaEntryProfiler("startGame returned");
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

  if (canUseGladiatorCloudSave()) {
    startOfflineBattleRewardSettlement(nextState, "manual");
    return nextState;
  }

  const rewardTimestamp = new Date().toISOString();
  const rewardApplication = applyCombatReward(hero, nextState, rewardTimestamp);

  applyOfflineBattleRewardPresentation(nextState, rewardApplication, { cloudSaveReason: nextState.result === "win" ? "battle-win" : undefined });

  return nextState;
}

function startOfflineBattleRewardSettlement(
  nextState: CombatState,
  battleKind: "manual" | "auto",
  options: { revealAfterSettlement?: boolean } = {},
): void {
  pendingBattleRewardRetry = undefined;
  const settlementPromise = settleOfflineBattleRewardPresentation(nextState, battleKind);

  pendingBattleRewardSettlement = settlementPromise;
  startBattleResultReturnGate();
  markRewardUiRenderDirty();

  void settlementPromise.finally(() => {
    if (pendingBattleRewardSettlement === settlementPromise) {
      pendingBattleRewardSettlement = undefined;

      if (options.revealAfterSettlement && revealPendingBattleResultPresentation()) {
        return;
      }

      renderCurrentDom();
    }
  });
}

async function settleOfflineBattleRewardPresentation(nextState: CombatState, battleKind: "manual" | "auto"): Promise<void> {
  try {
    const settlement = await settleGladiatorOfflineBattleReward(nextState, battleKind);

    applyOfflineBattleRewardPresentation(nextState, settlement);
  } catch (error) {
    console.error("Gladiator battle settlement failed", error);

    if (canUseGladiatorCloudSave()) {
      queueOfflineBattleRewardRetry(nextState, battleKind);
      window.alert("Could not claim battle reward. Try again.");
      return;
    }

    applyLocalOfflineBattleRewardFallback(nextState, battleKind);
  }
}

function queueOfflineBattleRewardRetry(nextState: CombatState, battleKind: "manual" | "auto"): void {
  pendingBattleRewardRetry = { combat: nextState, battleKind };
  battleResultReturnReady = true;
  battleResultReturnLabel = BATTLE_REWARD_CLAIM_RETRY_LABEL;
}

function retryPendingOfflineBattleRewardSettlement(): void {
  const retry = pendingBattleRewardRetry;

  if (!retry || pendingBattleRewardSettlement) {
    return;
  }

  startOfflineBattleRewardSettlement(retry.combat, retry.battleKind, { revealAfterSettlement: true });
  renderCurrentDom();
}

function applyLocalOfflineBattleRewardFallback(nextState: CombatState, battleKind: "manual" | "auto"): void {
  const rewardTimestamp = new Date().toISOString();
  const rewardApplication = applyCombatReward(hero, nextState, rewardTimestamp, Math.random, {
    randomEnemyLootChanceMultiplier: battleKind === "auto" ? AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER : 1,
  });

  applyOfflineBattleRewardPresentation(nextState, rewardApplication);
}

function applyOfflineBattleRewardPresentation(
  nextState: CombatState,
  rewardApplication: GladiatorBattleSettlement,
  options: { cloudSaveReason?: string } = {},
): void {
  const { reward, loot, heroBeforeReward, heroAfterReward } = rewardApplication;

  hero = heroAfterReward;
  saveLocalHeroSave(hero);

  if (options.cloudSaveReason) {
    queueHeroCloudSave(options.cloudSaveReason);
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

function scheduleShopEquipmentVisualSync(equipment: HeroEquipment, updatePortrait: boolean): void {
  pendingShopEquipmentVisualSync = {
    equipment: { ...equipment },
    updatePortrait: Boolean(pendingShopEquipmentVisualSync?.updatePortrait || updatePortrait),
  };

  if (shopEquipmentVisualSyncTimer !== undefined) {
    window.clearTimeout(shopEquipmentVisualSyncTimer);
  }

  shopEquipmentVisualSyncTimer = window.setTimeout(() => {
    shopEquipmentVisualSyncTimer = undefined;
    flushShopEquipmentVisualSync();
  }, SHOP_EQUIPMENT_VISUAL_SYNC_DELAY_MS);
}

function applyShopEquipmentVisualSync(equipment: HeroEquipment, updatePortrait: boolean): void {
  if (cityScene?.confirmEquipmentPreview(equipment)) {
    clearScheduledShopEquipmentVisualSync();
    if (updatePortrait) {
      heroPortraitPreview?.setEquipment(equipment);
    }
    return;
  }

  scheduleShopEquipmentVisualSync(equipment, updatePortrait);
  flushShopEquipmentVisualSync();
}

function clearScheduledShopEquipmentVisualSync(): void {
  pendingShopEquipmentVisualSync = undefined;
  if (shopEquipmentVisualSyncTimer !== undefined) {
    window.clearTimeout(shopEquipmentVisualSyncTimer);
    shopEquipmentVisualSyncTimer = undefined;
  }
}

function flushShopEquipmentVisualSync(): void {
  const pendingSync = pendingShopEquipmentVisualSync;

  if (!pendingSync) {
    return;
  }

  clearScheduledShopEquipmentVisualSync();

  setPlayerEquipment(pendingSync.equipment);
  if (pendingSync.updatePortrait) {
    heroPortraitPreview?.setEquipment(pendingSync.equipment);
  }
}

function recordCityShopProductActivity(action: string, product: CityShopProduct, purchaseBurstCount?: number): void {
  recordWebglActivity({
    screen: "city-shop",
    action,
    shop: getCityShopProductKind(product),
    itemIds: [...product.itemIds],
    price: product.price,
    heroLevel: hero.level,
    heroGold: hero.gold,
    purchaseBurstCount,
  });
}

function getNextShopPurchaseBurstCount(): number {
  const now = Date.now();

  if (now - shopPurchaseBurstStartedAt > SHOP_PURCHASE_BURST_WINDOW_MS) {
    shopPurchaseBurstStartedAt = now;
    shopPurchaseBurstCount = 0;
  }

  shopPurchaseBurstCount += 1;
  return shopPurchaseBurstCount;
}

function getCityShopProductKind(product: CityShopProduct): "armory" | "weapon" | "magic" {
  if (isMagicShopProduct(product) || isMagicEquipmentShopProduct(product)) {
    return "magic";
  }

  return isArmoryShopProduct(product) ? "armory" : "weapon";
}

function handleShopBuy(product: CityShopProduct): void {
  if (canUseGladiatorCloudSave() && isEquipmentShopProduct(product)) {
    void handleCloudEquipmentShopBuy(product);
    return;
  }

  if (canUseGladiatorCloudSave() && isMagicShopProduct(product)) {
    void handleCloudMagicShopAction("buy", product);
    return;
  }

  handleLocalShopBuy(product);
}

function handleLocalShopBuy(product: CityShopProduct): void {
  const isSealedEquipmentPurchase =
    isEquipmentShopProduct(product) &&
    !areHeroItemsOwned(hero, product.itemIds) &&
    isShopProductSealed(hero, product.itemIds, product.rarity);

  if (isSealedEquipmentPurchase) {
    return;
  }

  cancelShopPreviewPrewarm();
  const previousHero = hero;
  const purchaseBurstCount = getNextShopPurchaseBurstCount();

  recordCityShopProductActivity("shop-buy", product, purchaseBurstCount);

  const nextHero = buyAndEquipHeroItems(previousHero, {
    itemIds: product.itemIds,
    price: product.price,
  });

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  syncPlayerCityBodyScale();
  applyShopEquipmentVisualSync(hero.equipment, !areHeroItemsConsumable(product.itemIds));
  renderCityHero();
  syncShopHeroStateForProduct(product, previousHero);
  cityHeroEquipmentMenu.render();
}

async function handleCloudEquipmentShopBuy(product: ArmoryProduct | WeaponProduct): Promise<void> {
  if (pendingEquipmentShopBuyProduct) {
    return;
  }

  const isSealedEquipmentPurchase =
    !areHeroItemsOwned(hero, product.itemIds) &&
    isShopProductSealed(hero, product.itemIds, product.rarity);

  if (isSealedEquipmentPurchase) {
    return;
  }

  cancelShopPreviewPrewarm();
  const previousHero = hero;
  const purchaseBurstCount = getNextShopPurchaseBurstCount();

  recordCityShopProductActivity("shop-buy", product, purchaseBurstCount);
  setPendingEquipmentShopBuyProduct(product);

  try {
    const serverHero = await buyGladiatorShopProduct(getEquipmentShopProductKind(product), product.id, previousHero.equipment);
    const nextHero = withCurrentArenaEnergy(serverHero, previousHero);

    hero = nextHero;
    clearHeroAttributeDraft();
    saveLocalHeroSave(hero);
    syncPlayerCityBodyScale();
    applyShopEquipmentVisualSync(hero.equipment, !areHeroItemsConsumable(product.itemIds));
    renderCityHero();
    syncShopHeroStateForProduct(product, previousHero);
    cityHeroEquipmentMenu.render();
  } catch (error) {
    console.error("Gladiator shop buy failed", error);
    window.alert("Could not buy item. Try again.");
  } finally {
    setPendingEquipmentShopBuyProduct(undefined);
  }
}

async function handleCloudMagicShopAction(action: GladiatorShopAction, product?: MagicProduct): Promise<void> {
  if (magicShopActionPending) {
    return;
  }

  const previousHero = hero;

  if (product) {
    recordCityShopProductActivity(action === "buy" ? "shop-buy" : "shop-upgrade", product, action === "buy" ? getNextShopPurchaseBurstCount() : undefined);
  }

  magicShopActionPending = true;

  try {
    const serverHero = await applyGladiatorShopAction({
      shopKind: "magic",
      action,
      productId: product?.id,
      equipment: previousHero.equipment,
    });
    const nextHero = withCurrentArenaEnergy(serverHero, previousHero);

    hero = nextHero;
    clearHeroAttributeDraft();
    saveLocalHeroSave(hero);
    syncPlayerCityBodyScale();
    setPlayerEquipment(hero.equipment);
    setPlayerWeaponEnchantments(hero.weaponEnchantments);
    renderCityHero();
    magicShop?.syncHeroState();
    cityHeroEquipmentMenu.render();
  } catch (error) {
    console.error("Gladiator magic shop action failed", error);
    window.alert("Could not apply magic shop action. Try again.");
  } finally {
    magicShopActionPending = false;
  }
}

async function handleCloudBowCapacityUpgrade(): Promise<void> {
  if (bowCapacityUpgradePending) {
    return;
  }

  const previousHero = hero;
  bowCapacityUpgradePending = true;

  try {
    const serverHero = await applyGladiatorShopAction({
      shopKind: "weapon",
      action: "upgrade_bow_capacity",
      equipment: previousHero.equipment,
    });
    const nextHero = withCurrentArenaEnergy(serverHero, previousHero);

    hero = nextHero;
    clearHeroAttributeDraft();
    saveLocalHeroSave(hero);
    syncPlayerCityBodyScale();
    setPlayerEquipment(hero.equipment);
    renderCityHero();
    weaponShop?.syncHeroState();
    cityHeroEquipmentMenu.render();
  } catch (error) {
    console.error("Gladiator bow capacity upgrade failed", error);
    window.alert("Could not upgrade bow capacity. Try again.");
  } finally {
    bowCapacityUpgradePending = false;
    weaponShop?.syncHeroState();
  }
}

function handleBowCapacityUpgrade(): void {
  if (canUseGladiatorCloudSave()) {
    void handleCloudBowCapacityUpgrade();
    return;
  }

  const nextHero = upgradeHeroBowShotCapacity(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  saveLocalHeroSave(hero);
  renderCityHero();
  weaponShop?.syncHeroState();
  cityHeroEquipmentMenu.render();
}

function handleMagicWeaponSharpen(): void {
  if (canUseGladiatorCloudSave()) {
    void handleCloudMagicShopAction("sharpen_weapon");
    return;
  }

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
  if (canUseGladiatorCloudSave()) {
    void handleCloudMagicShopAction("upgrade_scroll", product);
    return;
  }

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
  if (canUseGladiatorCloudSave()) {
    void handleCloudMagicShopAction("upgrade_scroll_capacity");
    return;
  }

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

function isMagicEquipmentShopProduct(product: CityShopProduct): product is ArmoryProduct | WeaponProduct {
  return product.itemIds.some((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    return item?.kind === "weapon" && getHeroItemWeaponClass(item) === "staff";
  }) || (isArmoryShopProduct(product) && product.magicShop === true);
}

function isEquipmentShopProduct(product: CityShopProduct): product is ArmoryProduct | WeaponProduct {
  return !isMagicShopProduct(product);
}

function getEquipmentShopProductKind(product: ArmoryProduct | WeaponProduct): "armory" | "weapon" | "magic" {
  if (isMagicEquipmentShopProduct(product)) {
    return "magic";
  }

  return isWeaponShopProduct(product) ? "weapon" : "armory";
}

function setPendingEquipmentShopBuyProduct(product: ArmoryProduct | WeaponProduct | undefined): void {
  pendingEquipmentShopBuyProduct = product;

  if (!product) {
    armoryShop?.syncHeroState({ pendingProductId: null });
    weaponShop?.syncHeroState({ pendingProductId: null });
    magicShop?.syncHeroState({ pendingEquipmentProductId: null });
    return;
  }

  if (isMagicEquipmentShopProduct(product)) {
    magicShop?.syncHeroState({ pendingEquipmentProductId: product.id });
    return;
  }

  if (isWeaponShopProduct(product)) {
    weaponShop?.syncHeroState({ product, pendingProductId: product.id });
    return;
  }

  armoryShop?.syncHeroState({ product, pendingProductId: product.id });
}

function withCurrentArenaEnergy(nextHero: HeroState, currentHero: HeroState): HeroState {
  return currentHero.arenaEnergy ? { ...nextHero, arenaEnergy: currentHero.arenaEnergy } : nextHero;
}

function applyHeroAttributesPatch(sourceHero: HeroState, attributes: GladiatorHeroAttributesPatch): HeroState {
  return {
    ...sourceHero,
    baseStats: attributes.baseStats,
    skillPoints: attributes.skillPoints,
    ...(attributes.gold !== undefined ? { gold: attributes.gold } : {}),
    ...(attributes.skillPointResetCount !== undefined ? { skillPointResetCount: attributes.skillPointResetCount } : {}),
    updatedAt: attributes.updatedAt,
  };
}

function markHeroEquipmentSyncDirty(): void {
  heroEquipmentSyncDirty = true;
}

async function flushHeroEquipmentSync(reason: string): Promise<void> {
  if (!heroEquipmentSyncDirty) {
    return;
  }

  if (!canUseGladiatorCloudSave()) {
    saveLocalHeroSave(hero);
    heroEquipmentSyncDirty = false;
    return;
  }

  if (heroEquipmentSyncInFlight) {
    return;
  }

  const equipmentSnapshot: HeroEquipment = { ...hero.equipment };

  heroEquipmentSyncDirty = false;
  heroEquipmentSyncInFlight = true;

  try {
    const result = await syncGladiatorHeroEquipment(equipmentSnapshot);

    if (areHeroEquipmentEqual(hero.equipment, equipmentSnapshot)) {
      hero = {
        ...hero,
        equipment: result.equipment,
        updatedAt: result.updatedAt,
      };
      saveLocalHeroSave(hero);
    }
  } catch (error) {
    console.warn(`[gladiator-equipment] Failed to sync equipment after ${reason}.`, error);
    heroEquipmentSyncDirty = true;
  } finally {
    heroEquipmentSyncInFlight = false;
  }
}

function areHeroEquipmentEqual(left: HeroEquipment, right: HeroEquipment): boolean {
  return HERO_EQUIPMENT_SLOT_KEYS.every((slotKey) => left[slotKey] === right[slotKey]);
}

function createEmptyHeroAttributeDraftAllocations(): HeroBaseStats {
  return {
    strength: 0,
    agility: 0,
    vitality: 0,
  };
}

function hasHeroAttributeDraftAllocations(): boolean {
  return Object.values(attributeDraftAllocations).some((value) => value > 0);
}

function clearHeroAttributeDraft(saveStatus: CityHeroAttributeSaveStatus = "idle"): void {
  attributeDraftAllocations = createEmptyHeroAttributeDraftAllocations();
  attributeSaveStatus = saveStatus;
}

function isWeaponShopProduct(product: ArmoryProduct | WeaponProduct): product is WeaponProduct {
  return "categoryId" in product;
}

function handleHeroAttributeAllocate(attribute: HeroAttributeKey, amount: number): void {
  if (attributeSaveStatus === "saving") {
    return;
  }

  const previousSkillPoints = hero.skillPoints;
  const nextHero = allocateHeroSkillPoints(hero, attribute, amount);

  if (nextHero === hero) {
    return;
  }

  const spentPoints = Math.max(0, previousSkillPoints - nextHero.skillPoints);

  hero = nextHero;
  attributeDraftAllocations = {
    ...attributeDraftAllocations,
    [attribute]: attributeDraftAllocations[attribute] + spentPoints,
  };
  attributeSaveStatus = "idle";
  syncPlayerCityBodyScale();
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

function handleHeroAttributeDeallocate(attribute: HeroAttributeKey, amount: number): void {
  if (attributeSaveStatus === "saving") {
    return;
  }

  const requestedPoints = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const returnedPoints = Math.min(attributeDraftAllocations[attribute], Math.max(0, requestedPoints));

  if (returnedPoints <= 0) {
    return;
  }

  hero = {
    ...hero,
    skillPoints: hero.skillPoints + returnedPoints,
    baseStats: {
      ...hero.baseStats,
      [attribute]: Math.max(0, hero.baseStats[attribute] - returnedPoints),
    },
    updatedAt: new Date().toISOString(),
  };
  attributeDraftAllocations = {
    ...attributeDraftAllocations,
    [attribute]: attributeDraftAllocations[attribute] - returnedPoints,
  };
  attributeSaveStatus = "idle";
  syncPlayerCityBodyScale();
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
}

async function handleHeroAttributesSave(): Promise<void> {
  if (attributeSaveStatus === "saving" || !hasHeroAttributeDraftAllocations()) {
    return;
  }

  attributeSaveStatus = "saving";
  renderCityHero();

  try {
    if (canUseGladiatorCloudSave()) {
      const attributes = await saveGladiatorHeroAttributes(hero.baseStats, hero.skillPoints);

      hero = applyHeroAttributesPatch(hero, attributes);
    }

    saveLocalHeroSave(hero);
    clearHeroAttributeDraft("saved");
    syncPlayerCityBodyScale();
    renderCityHero();
    syncCityShopHeroState();
    cityHeroEquipmentMenu.render();
  } catch (error) {
    console.error("Gladiator attribute save failed", error);
    attributeSaveStatus = "idle";
    renderCityHero();
    window.alert("Could not save attributes. Try again.");
  }
}

async function handleHeroAttributeReset(): Promise<void> {
  if (hasHeroAttributeDraftAllocations()) {
    window.alert("Save attribute changes before resetting.");
    return;
  }

  if (!canResetHeroSkillPoints(hero)) {
    return;
  }

  const price = getHeroSkillPointResetPrice(hero);
  const allocatedSkillPoints = getHeroAllocatedSkillPoints(hero);
  const pointLabel = allocatedSkillPoints === 1 ? "point" : "points";

  if (!window.confirm(`Reset ${allocatedSkillPoints} attribute ${pointLabel} for ${price} gold?`)) {
    return;
  }

  if (canUseGladiatorCloudSave()) {
    attributeSaveStatus = "saving";
    renderCityHero();

    try {
      const attributes = await resetGladiatorHeroAttributes();

      hero = applyHeroAttributesPatch(hero, attributes);
      clearHeroAttributeDraft();
      syncPlayerCityBodyScale();
      renderCityHero();
      syncCityShopHeroState();
      cityHeroEquipmentMenu.render();
      saveLocalHeroSave(hero);
    } catch (error) {
      console.error("Gladiator attribute reset failed", error);
      attributeSaveStatus = "idle";
      renderCityHero();
      window.alert("Could not reset attributes. Try again.");
    }

    return;
  }

  const nextHero = resetHeroSkillPoints(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  clearHeroAttributeDraft();
  syncPlayerCityBodyScale();
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
  saveLocalHeroSave(hero);
  queueHeroCloudSave("attribute-reset");
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
  markHeroEquipmentSyncDirty();
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
  markHeroEquipmentSyncDirty();
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

function canUseTelegramUserIdGatedAction(allowedTelegramUserIds: ReadonlySet<string>): boolean {
  if (TELEGRAM_USER_ID_GATED_ACTION_BYPASS_ORIGINS.has(window.location.origin)) {
    return true;
  }

  return allowedTelegramUserIds.has(getTelegramUserId() ?? "");
}

function canUseArenaAdminControls(): boolean {
  return canUseTelegramUserIdGatedAction(ADMIN_TELEGRAM_USER_IDS);
}

function syncShopHeroStateForProduct(product: CityShopProduct, previousHero: HeroState): void {
  if (isMagicShopProduct(product) || isMagicEquipmentShopProduct(product)) {
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

  recordCityShopProductActivity("shop-preview", product);
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

  if (products.length > 0) {
    recordWebglActivity({
      screen: "city-shop",
      action: "shop-prewarm",
      shop: "equipment",
      heroLevel: hero.level,
      heroGold: hero.gold,
      productCount: products.length,
      itemCount: itemIds.length,
    });
  }

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
  pendingBattleRewardRetry = undefined;
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
  pendingBattleRewardRetry = undefined;
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
cityArenaQuestClaimButton?.addEventListener("click", () => {
  void claimCityArenaQuestReward();
});
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
if (canShowLocalDebugRestartButton()) {
  dom.restartButton.addEventListener("click", () => restart());
}
dom.cityButton.addEventListener("click", () => {
  if (pendingBattleRewardRetry) {
    retryPendingOfflineBattleRewardSettlement();
    return;
  }

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
syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
window.setInterval(syncArenaEnergyTimerDisplays, ARENA_ENERGY_TIMER_REFRESH_MS);
mountCityHeroAttributeControls(cityHeroWidgetRefs, {
  onAllocate: handleHeroAttributeAllocate,
  onDeallocate: handleHeroAttributeDeallocate,
  onSave: () => {
    void handleHeroAttributesSave();
  },
  onReset: handleHeroAttributeReset,
});
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
    onBuyEquipment: handleShopBuy,
    onEquipmentPreview: handleShopPreview,
    onEquipmentPreviewClear: clearShopPreview,
    onEquipmentHeroViewChange: handleMagicEquipmentHeroViewChange,
    showEquipment: canShowAdminOnlyGameFeatures,
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
