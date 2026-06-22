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
import { resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { pickArenaBackgroundVariantIdForTier, SHOP_GOLD_COIN_ICON_ASSET_URL, SHOP_XP_ICON_ASSET_URL } from "./assets";
import { debugTuning } from "./debugTuning";
import { getDomRefs, renderDom, type BattleResultPresentation } from "./domUi";
import {
  HERO_ITEM_CATALOG,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
  allocateHeroSkillPoints,
  applyCombatReward,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
  createArenaBossEncounter,
  createArenaRandomEnemyEncounter,
  createCombatStateFromHero,
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
  isHeroConsumableItem,
  isHeroEquipmentPreviewItem,
  unlockAllArenaBossTiers,
  unlockAllHeroShopRarities,
  updateHeroAppearance,
  upgradeHeroBowShotCapacity,
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
import { mountMagicShop, type MagicProduct, type MagicShopApi } from "./magicShopUi";
import { mountSettingsMenu } from "./settingsMenu";
import { prewarmShopItemIconsForBrowserCache } from "./shopItemIcons";
import { isShopProductSealed } from "./shopPresentation";
import { bootTelegramWebApp } from "./telegram";
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
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const magicShopButton = document.querySelector<HTMLButtonElement>("#magicShopButton");
const churchButton = document.querySelector<HTMLButtonElement>("#churchButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
type ArenaMenuSelection = { kind: "random"; tierId: number; difficultyId: ArenaDifficultyId } | { kind: "boss"; bossId: ArenaBossId };
type CityShopProduct = ArmoryProduct | WeaponProduct | MagicProduct;
let hero: HeroState = createDefaultHero();
let pendingBossEquipmentHintItemIds: HeroItemId[] = [];
let activeArenaTierId = DEFAULT_ARENA_TIER_ID;
let activeArenaSelection: ArenaMenuSelection = { kind: "random", tierId: DEFAULT_ARENA_TIER_ID, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID };
let state: CombatState = createCombatStateFromHero(hero, createArenaEncounterForSelection(activeArenaSelection));
let displayedStatsState: CombatState = state;
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let classicActionBar: ClassicActionBarApi | undefined;
let turnSequenceToken = 0;
let isTurnAnimationLocked = false;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
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
const CITY_RETURN_READY_LABEL = "Return to City";
const CITY_RETURN_WAITING_LABEL = "Preparing City...";
const ARENA_ENTRY_LOADER_DELAY_MS = 240;
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
mountCityTimeToggle(cityTimeToggle, cityMenu);

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
    reward: getBattleReward(state),
    statsState: displayedStatsState,
    resultPresentation: battleResultPresentation,
    deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation),
    resultReturn: {
      ready: battleResultReturnReady,
      label: battleResultReturnLabel,
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
  let enemy = current.enemy;

  if (current.lastPlayerDamage > 0) {
    enemy = {
      ...current.enemy,
      hp: previous.enemy.hp,
      armor: previous.enemy.armor,
    };
  }

  if (current.lastEnemyDamage > 0) {
    player = {
      ...current.player,
      hp: previous.player.hp,
      armor: previous.player.armor,
    };
  }

  return player === current.player && enemy === current.enemy ? current : { ...current, player, enemy };
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
      pendingBattleResultPresentation = undefined;
      renderCityHero();
      renderCurrentDom();
      syncTurnProbe();
    });
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

  const nextState = resolvePlayerTurn(state, actionId);

  const actionAnimation = commitState(nextState);

  void scheduleEnemyTurn(nextState, actionAnimation);
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
  }

  if (cityHeroWidgetRefs.portrait && !heroPortraitPreview) {
    heroPortraitPreview = mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment, hero.appearance, {
      mirrorParents: cityHeroWidgetRefs.profilePortrait ? [cityHeroWidgetRefs.profilePortrait] : [],
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
    backgroundVariantId: pickArenaBackgroundVariantIdForTier(encounter.tierId),
  };
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
  if (cityArenaEasyName) {
    cityArenaEasyName.textContent = "Easy";
  }
  if (cityArenaRandomName) {
    cityArenaRandomName.textContent = "Medium";
  }
  if (cityArenaHardName) {
    cityArenaHardName.textContent = "Hard";
  }
  syncCityArenaReward(cityArenaEasyReward, easyOpponent?.rewards.win ?? { gold: 4, xp: 4 });
  syncCityArenaReward(cityArenaRandomReward, randomOpponent?.rewards.win ?? { gold: 8, xp: 6 });
  syncCityArenaReward(cityArenaHardReward, hardOpponent?.rewards.win ?? { gold: 15, xp: 10 });
  cityArenaBossList.replaceChildren(...(bosses.length > 0 ? bosses.map(createCityArenaBossButton) : [createCityArenaEmptyBossMessage()]));
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

function createCityArenaBossButton(boss: ArenaBossDefinition): HTMLButtonElement {
  const button = document.createElement("button");
  const name = document.createElement("strong");
  const rewardLine = document.createElement("span");
  const reward = document.createElement("span");
  const uniqueReward = document.createElement("span");

  button.className = "city-arena-menu__boss";
  button.type = "button";
  name.textContent = "Boss";
  rewardLine.className = "city-arena-menu__boss-reward-line";
  reward.className = "city-arena-menu__reward";
  syncCityArenaReward(reward, boss.rewards.win);
  uniqueReward.className = "city-arena-menu__unique-reward";
  uniqueReward.textContent = "+ unique reward";
  rewardLine.append(reward, uniqueReward);
  button.append(name, rewardLine);
  button.addEventListener("click", () => {
    startSelectedArena({ kind: "boss", bossId: boss.id });
  });

  return button;
}

function createCityArenaEmptyBossMessage(): HTMLElement {
  const message = document.createElement("p");

  message.className = "city-arena-menu__empty";
  message.textContent = "No boss in this tier yet.";

  return message;
}

function syncCityArenaReward(container: HTMLElement, reward: { gold: number; xp: number }): void {
  container.setAttribute("aria-label", `${reward.gold} gold, ${reward.xp} XP`);
  container.replaceChildren(
    createCityArenaRewardItem(SHOP_GOLD_COIN_ICON_ASSET_URL, "Gold", reward.gold),
    createCityArenaRewardItem(SHOP_XP_ICON_ASSET_URL, "XP", reward.xp),
  );
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

function openCityArenaMenu(): void {
  if (!cityArenaMenu || isArenaTransitionRunning) {
    return;
  }

  cityHeroProfile?.close();
  weaponShop?.close();
  armoryShop?.close();
  clearShopPreview();
  renderCityArenaMenu();
  cityArenaMenu.hidden = false;
  cityMenu?.classList.add("city-menu--arena-select-open");
}

function closeCityArenaMenu(): void {
  cityArenaMenu?.setAttribute("hidden", "");
  cityMenu?.classList.remove("city-menu--arena-select-open");
}

function startSelectedArena(selection: ArenaMenuSelection): void {
  activeArenaSelection = selection;
  closeCityArenaMenu();
  void startGameWithCityTransition();
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

function unmountCityScenePreview(): void {
  cityScene?.destroy();
  cityScene = undefined;
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
    }, handleAction, hero.equipment, hero.appearance);
  });
}

function unmountArenaScene(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  cancelArenaEntryGate();
}

function startGame(): void {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  unmountCityScenePreview();
  weaponShop?.close();
  armoryShop?.close();
  magicShop?.close();

  if (hasStarted) {
    isInCity = false;
    dom.mainMenu.hidden = true;
    dom.gameScreen.classList.add("battle-screen--arena-entry");
    dom.gameScreen.hidden = false;
    document.body.classList.add("arena-active");
    restart({ syncArena: false });
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
  restart({ syncArena: false });
  mountArena();
}

async function startGameWithCityTransition(): Promise<void> {
  if (isArenaTransitionRunning) {
    return;
  }

  if (!isInCity) {
    startGame();
    return;
  }

  isArenaTransitionRunning = true;
  dom.startButton.disabled = true;
  clearShopPreview();
  void prewarmArenaAssetsForBrowserCache();
  cityMenu?.classList.add("city-menu--arena-transition");

  try {
    await (cityScene?.focusArenaTransition() ?? Promise.resolve());
  } finally {
    startGame();
    dom.startButton.disabled = false;
    isArenaTransitionRunning = false;
  }
}

function applyBattleRewardIfNeeded(nextState: CombatState): CombatState {
  if (state.result !== "playing" || nextState.result === "playing") {
    return nextState;
  }

  const rewardTimestamp = new Date().toISOString();
  const rewardApplication = applyCombatReward(hero, nextState, rewardTimestamp);
  const { reward, loot, heroBeforeReward, heroAfterReward } = rewardApplication;

  hero = heroAfterReward;
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
  const isSealedArmoryPurchase =
    isArmoryShopProduct(product) &&
    !areHeroItemsOwned(hero, product.itemIds) &&
    isShopProductSealed(hero, product.itemIds, product.rarity);

  if (isSealedArmoryPurchase) {
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

function isArmoryShopProduct(product: CityShopProduct): product is ArmoryProduct {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "armor");
}

function isMagicShopProduct(product: CityShopProduct): product is MagicProduct {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "scroll");
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
  const now = new Date().toISOString();

  hero = unlockAllArenaBossTiers(unlockAllHeroShopRarities(grantHeroGold(grantHeroLevels(hero, 20, now), 1000, now), now), now);
  renderCityHero();
  syncCityShopHeroState();
  cityHeroEquipmentMenu.render();
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

async function returnToCity(): Promise<void> {
  if (!battleResultReturnReady || isCityReturnTransitionRunning) {
    return;
  }

  const transitionToken = ++cityReturnTransitionToken;

  isCityReturnTransitionRunning = true;
  dom.cityButton.disabled = true;
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
  battleResultPresentationRevealToken += 1;
  isArenaTransitionRunning = false;
  isInCity = true;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
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
  cityReturnTransitionToken += 1;
  isCityReturnTransitionRunning = false;
  hideCityReturnTransition();
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  resetBattleResultReturnGate();
  battleResultPresentation = undefined;
  pendingBattleResultPresentation = undefined;
  battleResultPresentationRevealToken += 1;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  void commitState(createCombatStateFromHero(hero, createArenaEncounterForSelection(activeArenaSelection)), options);
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
  startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "easy" });
});
cityArenaRandomButton?.addEventListener("click", () => {
  startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: DEFAULT_ARENA_DIFFICULTY_ID });
});
cityArenaHardButton?.addEventListener("click", () => {
  startSelectedArena({ kind: "random", tierId: getSelectedCityArenaTier().id, difficultyId: "hard" });
});
dom.restartButton.addEventListener("click", () => restart());
dom.cityButton.addEventListener("click", returnToCity);
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
renderCityHero();
mountCityHeroAttributeControls(cityHeroWidgetRefs, handleHeroAttributeAllocate);
void finishInitialCityEntry();
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
