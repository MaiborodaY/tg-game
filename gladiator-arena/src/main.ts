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
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import {
  getCityEquipmentCategoryIdForHeroItemId,
  getCityHeroWidgetRefs,
  mountCityHeroAttributeControls,
  mountCityHeroEquipmentMenu,
  mountCityHeroAppearanceMenu,
  mountCityHeroProfile,
  renderCityHeroInfo,
  syncCityHeroWidgetPosition,
  type CityEquipmentCategoryId,
  type CityHeroEquipmentMenuApi,
} from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { isDuoBossAiCombat, resolveDuoBossHelperTurn, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { DAILY_ARENA_ENERGY_ICON_ASSET_URL, pickArenaBackgroundVariantIdForTier, SHOP_GOLD_COIN_ICON_ASSET_URL, SHOP_XP_ICON_ASSET_URL } from "./assets";
import { debugTuning } from "./debugTuning";
import { getDomRefs, renderDom, type BattleResultPresentation, type BattleResultPresentationStage } from "./domUi";
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
  allocateHeroSkillPoints,
  applyCombatReward,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
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
  hasHeroArenaBossVictoryForTier,
  isHeroConsumableItem,
  isHeroEquipmentPreviewItem,
  restoreHeroArenaEnergy,
  sharpenHeroActiveWeapon,
  spendHeroArenaEnergy,
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
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { clearLocalHeroSave, loadLocalHeroSave, saveLocalHeroSave } from "./localHeroSave";
import { mountMagicShop, type MagicProduct, type MagicShopApi } from "./magicShopUi";
import { cancelPvpRoom, connectPvpRoom, createPvpRoom, getCurrentPvpRoom, joinPvpRoom, listPvpRooms, type PvpConnection } from "./pvpClient";
import type { PvpRoomListEntry, PvpRoomResponse, PvpRoomSession, PvpRoomSnapshot, PvpServerMessage } from "./pvpProtocol";
import { mountSettingsMenu } from "./settingsMenu";
import { prewarmShopItemIconsForBrowserCache } from "./shopItemIcons";
import { isShopProductSealed } from "./shopPresentation";
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
const cityArenaTierName = document.querySelector<HTMLElement>("#cityArenaTierName");
const cityArenaTierSelect = document.querySelector<HTMLSelectElement>("#cityArenaTierSelect");
const cityArenaEasyReward = document.querySelector<HTMLElement>("#cityArenaEasyReward");
const cityArenaEasyButton = document.querySelector<HTMLButtonElement>("#cityArenaEasyButton");
const cityArenaEasyName = cityArenaEasyButton?.querySelector<HTMLElement>("strong");
const cityArenaRandomReward = document.querySelector<HTMLElement>("#cityArenaRandomReward");
const cityArenaRandomButton = document.querySelector<HTMLButtonElement>("#cityArenaRandomButton");
const cityArenaRandomName = cityArenaRandomButton?.querySelector<HTMLElement>("strong");
const cityArenaHardReward = document.querySelector<HTMLElement>("#cityArenaHardReward");
const cityArenaHardButton = document.querySelector<HTMLButtonElement>("#cityArenaHardButton");
const cityArenaHardName = cityArenaHardButton?.querySelector<HTMLElement>("strong");
const cityArenaBossList = document.querySelector<HTMLElement>("#cityArenaBossList");
const cityPvpCreateButton = document.querySelector<HTMLButtonElement>("#cityPvpCreateButton");
const cityPvpJoinButton = document.querySelector<HTMLButtonElement>("#cityPvpJoinButton");
const cityPvpRoomList = document.querySelector<HTMLElement>("#cityPvpRoomList");
const cityPvpStatus = document.querySelector<HTMLOutputElement>("#cityPvpStatus");
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
interface ReturnToCityOptions {
  requireResultGate?: boolean;
}
let hero: HeroState = createInitialHero();
let pendingBossEquipmentHintItemIds: HeroItemId[] = [];
let activeArenaTierId = DEFAULT_ARENA_TIER_ID;
let activeArenaSelection: ArenaMenuSelection = { kind: "random", tierId: DEFAULT_ARENA_TIER_ID, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID };
let state: CombatState = createCombatStateForSelection(activeArenaSelection);
let displayedStatsState: CombatState = state;
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let classicActionBar: ClassicActionBarApi | undefined;
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
let pvpControlsBusy = false;
let pvpRoomsVisible = false;
let pvpRoomList: PvpRoomListEntry[] = [];
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
const HERO_PROGRESS_RESET_TELEGRAM_USER_IDS = new Set(["297730487"]);
const ARENA_ENERGY_RESTORE_TELEGRAM_USER_IDS = new Set(["297730487", "313719698"]);
const TELEGRAM_USER_ID_GATED_ACTION_BYPASS_ORIGINS = new Set(["http://localhost:5173"]);
const LOCAL_DEBUG_RESTART_BUTTON_ORIGIN = "http://localhost:5173";
const CITY_RETURN_READY_LABEL = "Return to City";
const CITY_RETURN_WAITING_LABEL = "Preparing City...";
const ARENA_ENTRY_LOADER_DELAY_MS = 240;
const ARENA_RANDOM_ENERGY_COST = 1;
const ARENA_BOSS_ENERGY_COST = 2;
const ARENA_DUO_BOSS_ENERGY_COST = 3;
const PLAYER_TO_ENEMY_TURN_PACING_MS = 100;
const ENEMY_TO_PLAYER_TURN_PACING_MS = 50;
let cityCurtainCleanupTimer: number | undefined;
let cityCurtainRevealTimer: number | undefined;
let cityCurtainSwitchTimer: number | undefined;
let isArenaTransitionRunning = false;
let isArenaEntryLoading = false;
let arenaEntryToken = 0;
let arenaEntryLoaderTimer: number | undefined;
let battleResultPresentation: BattleResultPresentation | undefined;
let pendingBattleResultPresentation: BattleResultPresentation | undefined;
let battleResultPresentationStage: BattleResultPresentationStage = "reward";
let battleResultPresentationId = 0;
let battleResultPresentationRevealToken = 0;
let statsRevealToken = 0;
let battleResultReturnReady = true;
let battleResultReturnLabel = CITY_RETURN_READY_LABEL;
let battleResultReturnGateToken = 0;
let rewardUiRenderDirty = false;
let isCityReturnTransitionRunning = false;
let cityReturnTransitionToken = 0;
let shopPreviewPrewarmToken = 0;
let shopPreviewPrewarmFrame: number | undefined;
let shopPreviewPrewarmItemIds: HeroItemId[] = [];
let activeShopPreviewPrewarmSignature = "";
let completedShopPreviewPrewarmSignature = "";
let arenaEnergySpendPending = false;

const cityReturnTransition = createCityReturnTransition();
const cityHeroProfile = mountCityHeroProfile(cityHeroWidgetRefs);
const cityHeroEquipmentMenu: CityHeroEquipmentMenuApi = mountCityHeroEquipmentMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onEquip: handleProfileEquipmentEquip,
  onCategoryOpen: handleProfileEquipmentCategoryOpen,
});
const cityHeroAppearanceMenu = mountCityHeroAppearanceMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onChange: handleProfileAppearanceChange,
});
cityHeroWidgetRefs.profile?.addEventListener("city-profile-visibility", (event) => {
  if ((event as CustomEvent<{ open?: boolean }>).detail?.open) {
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
      <strong>Entering City...</strong>
    </div>
  `;

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

function beginArenaEntryGate(): number {
  const token = arenaEntryToken + 1;

  arenaEntryToken = token;
  isArenaEntryLoading = true;
  clearArenaEntryLoaderTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.add("battle-screen--arena-entry");
  arenaEntryLoaderTimer = window.setTimeout(() => {
    arenaEntryLoaderTimer = undefined;
    if (arenaEntryToken === token && isArenaEntryLoading) {
      setArenaEntryLoaderVisible(true);
    }
  }, ARENA_ENTRY_LOADER_DELAY_MS);
  syncActionArc();

  return token;
}

function finishArenaEntryGate(token: number): void {
  if (arenaEntryToken !== token) {
    return;
  }

  isArenaEntryLoading = false;
  clearArenaEntryLoaderTimer();
  setArenaEntryLoaderVisible(false);
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
  syncActionArc();
}

function cancelArenaEntryGate(): void {
  arenaEntryToken += 1;
  isArenaEntryLoading = false;
  clearArenaEntryLoaderTimer();
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
      ready: battleResultPresentationStage === "loot" ? true : battleResultReturnReady,
      label: battleResultPresentationStage === "loot" ? "Continue" : battleResultReturnLabel,
    },
  });
}

function syncPlayerCityBodyScale(): void {
  setPlayerBodyScaleBonus(deriveHeroStats(hero).bodyScaleBonus);
}

function renderCityHero(): void {
  renderCityHeroInfo(cityHeroWidgetRefs, hero, {
    highlightedEquipmentItemIds: pendingBossEquipmentHintItemIds,
  });
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

async function hydrateHeroFromCloudSave(): Promise<void> {
  if (!canUseGladiatorCloudSave()) {
    return;
  }

  try {
    const savedHero = await loadGladiatorCloudSave();

    if (!savedHero) {
      clearLocalHeroSave();
      hero = createInitialHero();
      syncHeroRuntimeState();
      return;
    }

    hero = applyTelegramDisplayNameToHero(savedHero);
    saveLocalHeroSave(hero);
    syncHeroRuntimeState();
  } catch (error) {
    console.warn("[gladiator-save] Failed to load cloud save.", error);
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

  const nextHero = restoreHeroArenaEnergy(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  saveLocalHeroSave(hero);
  queueHeroCloudSave("admin-arena-energy-restore");
  renderCityHero();
  renderCityArenaMenu();
}

function resetHeroProgressState(): void {
  pendingBossEquipmentHintItemIds = [];
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
  const visibleState = isTurnAnimationLocked || isArenaEntryLoading ? { ...state, activeTurn: "enemy" as const } : state;

  actionArc?.sync(visibleState);
  classicActionBar?.sync(visibleState);
}

function setTurnAnimationLocked(locked: boolean): void {
  if (isTurnAnimationLocked === locked) {
    return;
  }

  isTurnAnimationLocked = locked;
  syncActionArc();
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
  try {
    await scene.prepareEntry(state);

    if (!isActiveArenaEntry(scene, entryToken)) {
      return;
    }

    finishArenaEntryGate(entryToken);
    await scene.playEntryTransition(state);
  } finally {
    if (isActiveArenaEntry(scene, entryToken)) {
      finishArenaEntryGate(entryToken);
      refreshArenaLayout();
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
    const portraitMirrorParents = [cityHeroWidgetRefs.profilePortrait, cityHeroEquipmentMenu.getPortraitMirrorHost()].filter(
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

function prewarmShopItemIconsWhenIdle(): void {
  const prewarm = () => {
    void prewarmShopItemIconsForBrowserCache();
  };
  const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number };

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(prewarm, { timeout: 2000 });
    return;
  }

  window.setTimeout(prewarm, 250);
}

function createArenaEncounterForSelection(selection: ArenaMenuSelection): ArenaEncounter {
  const encounter = selection.kind === "boss" ? createArenaBossEncounter(selection.bossId) : createArenaRandomEnemyEncounter(selection.tierId, selection.difficultyId);

  return {
    ...encounter,
    ...(selection.kind === "boss" && selection.duo ? { mode: "duoBossAi" as const } : {}),
    backgroundVariantId: pickArenaBackgroundVariantIdForTier(encounter.tierId),
  };
}

function createCombatStateForSelection(selection: ArenaMenuSelection): CombatState {
  const encounter = createArenaEncounterForSelection(selection);

  return selection.kind === "boss" && selection.duo
    ? createDuoBossCombatStateFromHero(hero, encounter)
    : createCombatStateFromHero(hero, encounter);
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

  syncCityArenaTierSelect(cityArenaTierSelect, visibleTiers, tier.id);
  cityArenaTierName.textContent = tier.name;
  syncCityArenaFightTitle(cityArenaEasyName, "Easy", ARENA_RANDOM_ENERGY_COST);
  syncCityArenaFightTitle(cityArenaRandomName, "Medium", ARENA_RANDOM_ENERGY_COST);
  syncCityArenaFightTitle(cityArenaHardName, "Hard", ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaEasyButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaRandomButton, ARENA_RANDOM_ENERGY_COST);
  setCityArenaBotButtonEnergyCost(cityArenaHardButton, ARENA_RANDOM_ENERGY_COST);
  syncCityArenaReward(cityArenaEasyReward, easyOpponent?.rewards.win ?? { gold: 4, xp: 4 });
  syncCityArenaReward(cityArenaRandomReward, randomOpponent?.rewards.win ?? { gold: 8, xp: 6 });
  syncCityArenaReward(cityArenaHardReward, hardOpponent?.rewards.win ?? { gold: 15, xp: 10 });
  cityArenaBossList.replaceChildren(...(bosses.length > 0 ? bosses.map(createCityArenaBossButton) : [createCityArenaEmptyBossMessage()]));
  syncCityArenaBotControls();
}

function syncCityArenaFightTitle(title: HTMLElement | null | undefined, label: string, energyCost: number): void {
  if (!title) {
    return;
  }

  const text = document.createElement("span");
  const cost = createCityArenaEnergyCostItem(energyCost);

  title.classList.add("city-arena-menu__fight-title");
  text.className = "city-arena-menu__fight-title-text";
  text.textContent = label;
  cost.classList.add("city-arena-menu__fight-cost");
  title.replaceChildren(text, cost);
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
  const duoButton = document.createElement("button");
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
    void startSelectedArena({ kind: "boss", bossId: boss.id, duo: true });
  });
  card.append(button, duoButton);

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

function syncCityArenaBotControls(): void {
  [cityArenaEasyButton, cityArenaRandomButton, cityArenaHardButton].forEach((button) => {
    if (!button) {
      return;
    }
    const title = getCityArenaBotDisabledTitle(getCityArenaBotButtonEnergyCost(button));
    const disabled = Boolean(title);

    button.disabled = disabled;
    button.title = title;
  });
  cityArenaBossList?.querySelectorAll<HTMLButtonElement>("[data-city-arena-bot-button]").forEach((button) => {
    const title = getCityArenaBotDisabledTitle(getCityArenaBotButtonEnergyCost(button));
    const bossTierLimitTitle = title ? "" : getCityArenaBossVictoryLimitTitle(Number(button.dataset.cityArenaBossTierId));
    const buttonTitle = title || bossTierLimitTitle;

    button.disabled = Boolean(buttonTitle);
    button.title = buttonTitle || button.dataset.defaultTitle || "";
  });
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

function getCityArenaBotDisabledTitle(energyCost = ARENA_RANDOM_ENERGY_COST): string {
  if (isPvpRoomBlockingArena()) {
    return "Cancel PvP room before fighting bots.";
  }

  if (arenaEnergySpendPending) {
    return "Spending arena energy...";
  }

  const currentArenaEnergy = getHeroArenaEnergy(hero).current;

  if (currentArenaEnergy < energyCost) {
    return currentArenaEnergy <= 0 ? "No arena energy left today." : `Not enough arena energy (${currentArenaEnergy}/${energyCost}).`;
  }

  return "";
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

function syncPvpControls(): void {
  const disabled = pvpControlsBusy || Boolean(pvpSession);

  if (cityPvpCreateButton) {
    cityPvpCreateButton.disabled = disabled;
  }
  if (cityPvpJoinButton) {
    cityPvpJoinButton.disabled = disabled;
  }
  syncCityArenaBotControls();
  renderPvpRoomList();
}

function renderPvpRoomList(): void {
  if (!cityPvpRoomList) {
    return;
  }

  const entries = getVisiblePvpRoomEntries();
  const shouldShow = pvpRoomsVisible || entries.length > 0;

  cityPvpRoomList.hidden = !shouldShow;
  if (!shouldShow) {
    cityPvpRoomList.replaceChildren();
    return;
  }

  if (pvpControlsBusy && entries.length === 0) {
    cityPvpRoomList.replaceChildren(createPvpRoomListMessage("Loading rooms..."));
    return;
  }

  cityPvpRoomList.replaceChildren(...(entries.length > 0 ? entries.map(createPvpRoomListItem) : [createPvpRoomListMessage("No open rooms.")]));
}

function getVisiblePvpRoomEntries(): PvpRoomListEntry[] {
  const entries = [...pvpRoomList];
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

  const now = Date.now();

  return {
    roomCode: pvpSession.roomCode,
    hostName: hero.name,
    hostLevel: hero.level,
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
  meta.textContent = `LV ${room.hostLevel} - WAITING`;
  button.className = "city-arena-menu__pvp-button city-arena-menu__pvp-room-button";
  button.type = "button";
  button.textContent = isOwnRoom ? "CANCEL" : "JOIN";
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
    setPvpStatus("Loading rooms...");
  }

  try {
    const response = await listPvpRooms();

    pvpRoomList = response.rooms;
    setPvpControlsBusy(false);
    if (!options.silent) {
      setPvpStatus(response.rooms.length > 0 ? "Choose a room." : "No open rooms.");
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

async function handleSearchPvpRooms(): Promise<void> {
  if (pvpControlsBusy || pvpSession) {
    return;
  }

  pvpRoomsVisible = true;
  pvpRoomList = [];
  setPvpControlsBusy(true);
  setPvpStatus("Searching rooms...");

  try {
    const currentRoom = await getCurrentPvpRoom();

    if (currentRoom) {
      beginPvpRoom(currentRoom);
      setPvpStatus(formatPvpRoomStatus(currentRoom.snapshot));
      return;
    }

    const response = await listPvpRooms();

    pvpRoomList = response.rooms;
    setPvpControlsBusy(false);
    setPvpStatus(response.rooms.length > 0 ? "Choose a room." : "No open rooms.");
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
    setPvpStatus("PvP match already started.");
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
  pvpSession = {
    roomCode: response.roomCode,
    token: response.token,
    seat: response.seat,
  };
  pvpSnapshot = response.snapshot;
  pvpRoomsVisible = true;
  setPvpControlsBusy(false);
  syncPvpControls();
  setPvpStatus(formatPvpRoomStatus(response.snapshot));
  pvpConnection = connectPvpRoom(pvpSession, {
    onMessage: handlePvpServerMessage,
    onClose: handlePvpSocketClose,
    onError: () => setPvpStatus("PvP socket error."),
  });
  handlePvpSnapshot(response.snapshot);
}

function handlePvpSocketClose(): void {
  if (!pvpSession) {
    return;
  }

  const shouldShowDisconnectResult = gameMode === "pvp" && !isInCity && state.result === "playing";

  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  pvpActionPending = false;
  clearPvpTurnTimer();
  setTurnAnimationLocked(false);
  setPvpStatus("PvP disconnected.");
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

  if (!snapshot.state) {
    return;
  }

  if (isInCity) {
    closeCityArenaMenu();
    void startGameWithCityTransition({ mode: "pvp", initialState: snapshot.state });
    return;
  }

  if (gameMode === "pvp") {
    setTurnAnimationLocked(false);
    void commitState(snapshot.state);
  }
}

function formatPvpRoomStatus(snapshot: PvpRoomSnapshot): string {
  if (snapshot.status === "waiting") {
    return "Waiting for opponent.";
  }

  if (snapshot.status === "finished") {
    return "PvP match finished.";
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

function leavePvpRoom(options: { keepStatus?: boolean } = {}): void {
  pvpConnection?.close();
  pvpConnection = undefined;
  pvpSession = undefined;
  pvpSnapshot = undefined;
  pvpActionPending = false;
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
  const turnLabel = pvpSnapshot.activeSeat === pvpSession?.seat ? "YOUR TURN" : "OPPONENT";

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
  syncPvpControls();
  cityArenaMenu.hidden = false;
  cityMenu?.classList.add("city-menu--arena-select-open");
}

function closeCityArenaMenu(): void {
  cityArenaMenu?.setAttribute("hidden", "");
  cityMenu?.classList.remove("city-menu--arena-select-open");
}

async function startSelectedArena(selection: ArenaMenuSelection): Promise<void> {
  if (isPvpRoomBlockingArena()) {
    setPvpStatus("Cancel PvP room before fighting bots.");
    syncPvpControls();
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

  closeCityArenaMenu();
  void startGameWithCityTransition({ initialState });
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
  const hasLocalHero = hydrateHeroFromLocalSave();

  if (!hasLocalHero) {
    await hydrateHeroFromCloudSave();
  }

  await finishInitialCityEntry();
  if (hasLocalHero) {
    void hydrateHeroFromCloudSave();
  }
}

function showCityReturnTransition(): void {
  cityReturnTransition.hidden = false;
  cityReturnTransition.classList.remove("city-return-transition--leaving");
  void cityReturnTransition.offsetWidth;
  cityReturnTransition.classList.add("city-return-transition--active");
}

function hideCityReturnTransition(): void {
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
    return;
  }

  hasStarted = true;
  isInCity = false;
  dom.mainMenu.hidden = true;
  dom.gameScreen.classList.add("battle-screen--arena-entry");
  dom.gameScreen.hidden = false;
  document.body.classList.add("arena-active");
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  classicActionBar = mountClassicActionBar(dom.gameScreen, handleAction, () => debugTuning);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = shouldMountTurnProbe() ? mountTurnProbe(dom.gameScreen) : undefined;
  if (initialState) {
    void commitState(initialState, { syncArena: false });
  } else {
    restart({ syncArena: false });
  }
  mountArena();
}

async function startGameWithCityTransition(options: StartGameOptions = {}): Promise<void> {
  if (isArenaTransitionRunning) {
    return;
  }

  if (!isInCity) {
    startGame(options);
    return;
  }

  isArenaTransitionRunning = true;
  dom.startButton.disabled = true;
  clearShopPreview();
  void prewarmArenaAssetsForBrowserCache(options.initialState?.encounter ?? state.encounter);
  cityMenu?.classList.add("city-menu--arena-transition");

  try {
    await (cityScene?.focusArenaTransition() ?? Promise.resolve());
  } finally {
    startGame(options);
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
  rememberBossEquipmentHint(nextState, loot);
  syncPlayerCityBodyScale();
  pendingBattleResultPresentation = {
    id: `battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
  };
  startBattleResultReturnGate();
  markRewardUiRenderDirty();

  return nextState;
}

function rememberBossEquipmentHint(combat: CombatState, loot: readonly { itemId: HeroItemId; itemIds?: readonly HeroItemId[] }[]): void {
  if (combat.result !== "win" || combat.encounter?.kind !== "boss") {
    return;
  }

  const hintItemIds = getBossEquipmentHintItemIds(loot);

  if (hintItemIds.length <= 0) {
    return;
  }

  pendingBossEquipmentHintItemIds = hintItemIds;
}

function getBossEquipmentHintItemIds(loot: readonly { itemId: HeroItemId; itemIds?: readonly HeroItemId[] }[]): HeroItemId[] {
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
  if (clearPendingBossEquipmentHintsForCategory(categoryId)) {
    renderCityHero();
  }
}

function clearPendingBossEquipmentHintsForCategory(categoryId: CityEquipmentCategoryId): boolean {
  return updatePendingBossEquipmentHints((itemId) => getCityEquipmentCategoryIdForHeroItemId(itemId) !== categoryId);
}

function clearPendingBossEquipmentHintsForItems(itemIds: readonly HeroItemId[]): boolean {
  const clearedItemIds = new Set(itemIds);

  return updatePendingBossEquipmentHints((itemId) => !clearedItemIds.has(itemId));
}

function updatePendingBossEquipmentHints(keepItemId: (itemId: HeroItemId) => boolean): boolean {
  if (pendingBossEquipmentHintItemIds.length <= 0) {
    return false;
  }

  const nextItemIds = pendingBossEquipmentHintItemIds.filter(keepItemId);

  if (nextItemIds.length === pendingBossEquipmentHintItemIds.length) {
    return false;
  }

  pendingBossEquipmentHintItemIds = nextItemIds;
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
  clearPendingBossEquipmentHintsForItems(itemIds);
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

  if ((requireResultGate && !battleResultReturnReady) || isCityReturnTransitionRunning) {
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
  void commitState(createCombatStateForSelection(activeArenaSelection), options);
}

dom.startButton.addEventListener("click", () => {
  openCityArenaMenu();
});
cityArenaCloseButton?.addEventListener("click", closeCityArenaMenu);
cityArenaTierSelect?.addEventListener("change", () => {
  activeArenaTierId = Number(cityArenaTierSelect.value) || DEFAULT_ARENA_TIER_ID;
  renderCityArenaMenu();
});
cityArenaEasyButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "easy" });
});
cityArenaRandomButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID });
});
cityArenaHardButton?.addEventListener("click", () => {
  void startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "hard" });
});
cityPvpCreateButton?.addEventListener("click", () => {
  void handleCreatePvpRoom();
});
cityPvpJoinButton?.addEventListener("click", () => {
  void handleSearchPvpRooms();
});
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
  cityHeroProfile?.close();
  closeCityArenaMenu();
  weaponShop?.close();
  armoryShop?.close();
  flushRewardUiRenderIfDirty();
  magicShop?.open();
});
churchButton?.addEventListener("click", handleTemporaryChurchSkillGrant);
syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
syncPlayerCityBodyScale();
setPlayerEquipment(hero.equipment);
setPlayerAppearance(hero.appearance);
setPlayerWeaponEnchantments(hero.weaponEnchantments);
renderCityHero();
mountCityHeroAttributeControls(cityHeroWidgetRefs, handleHeroAttributeAllocate);
void startInitialCityEntry();
prewarmShopItemIconsWhenIdle();
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
renderCurrentDom();
