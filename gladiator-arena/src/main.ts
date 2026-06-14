import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountHeroPortraitPreview,
  prewarmArenaAssetsForBrowserCache,
  prewarmCityAssetsForBrowserCache,
  setPlayerBodyScaleBonus,
  setPlayerEquipment,
  type ArenaScene,
  type CitySceneApi,
  type HeroPortraitPreviewApi,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import {
  getCityHeroWidgetRefs,
  mountCityHeroAttributeControls,
  mountCityHeroEquipmentMenu,
  mountCityHeroProfile,
  renderCityHeroInfo,
  syncCityHeroWidgetPosition,
  type CityHeroEquipmentMenuApi,
} from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { resolveEnemyTurn, resolvePlayerTurn, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { debugTuning } from "./debugTuning";
import { getDomRefs, renderDom, type BattleResultPresentation } from "./domUi";
import {
  HERO_ITEM_CATALOG,
  DEFAULT_ARENA_TIER_ID,
  allocateHeroSkillPoints,
  applyCombatReward,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
  createArenaBossEncounter,
  createArenaRandomEnemyEncounter,
  createCombatStateFromHero,
  createDefaultHero,
  deriveHeroStats,
  grantHeroSkillPoints,
  getArenaBossesForTier,
  getArenaRandomOpponentsForTier,
  getArenaTierDefinition,
  getBattleReward,
  type ArenaBossDefinition,
  type ArenaBossId,
  type ArenaEncounter,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
  type HeroAttributeKey,
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { mountSettingsMenu } from "./settingsMenu";
import { prewarmShopItemIconsForBrowserCache } from "./shopItemIcons";
import {
  ensureArmoryPreviewProfile,
  finishArmoryPreviewProfile,
  profileArmoryPreviewSpan,
} from "./shopPreviewProfiler";
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
const cityArenaRandomReward = document.querySelector<HTMLElement>("#cityArenaRandomReward");
const cityArenaRandomButton = document.querySelector<HTMLButtonElement>("#cityArenaRandomButton");
const cityArenaBossList = document.querySelector<HTMLElement>("#cityArenaBossList");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const churchButton = document.querySelector<HTMLButtonElement>("#churchButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
type ArenaMenuSelection = { kind: "random"; tierId: number } | { kind: "boss"; bossId: ArenaBossId };
let hero: HeroState = createDefaultHero();
let activeArenaSelection: ArenaMenuSelection = { kind: "random", tierId: DEFAULT_ARENA_TIER_ID };
let state: CombatState = createCombatStateFromHero(hero, createArenaEncounterForSelection(activeArenaSelection));
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
let unmountArena: (() => void) | undefined;
let cityScene: CitySceneApi | undefined;
let heroPortraitPreview: HeroPortraitPreviewApi | undefined;
const CITY_CURTAIN_TRANSITION_MS = 620;
const CITY_CURTAIN_SWITCH_MS = 210;
const CITY_RETURN_MIN_READY_MS = 1800;
const CITY_RETURN_PREWARM_TIMEOUT_MS = 3000;
const CITY_RETURN_TRANSITION_IN_MS = 260;
const CITY_RETURN_TRANSITION_TIMEOUT_MS = 4200;
const CITY_RETURN_READY_LABEL = "Return to City";
const CITY_RETURN_WAITING_LABEL = "Preparing City...";
const HERO_PORTRAIT_REFRESH_SLOTS = new Set(["helmet", "breastplate", "backShoulderguard", "frontShoulderguard"]);
let cityCurtainCleanupTimer: number | undefined;
let cityCurtainSwitchTimer: number | undefined;
let isArenaTransitionRunning = false;
let battleResultPresentation: BattleResultPresentation | undefined;
let battleResultPresentationId = 0;
let battleResultReturnReady = true;
let battleResultReturnLabel = CITY_RETURN_READY_LABEL;
let battleResultReturnGateToken = 0;
let isCityReturnTransitionRunning = false;
let cityReturnTransitionToken = 0;
let activeShopPreviewEquipment: HeroEquipment | undefined;
let armoryPreviewPrewarmToken = 0;
let armoryPreviewPrewarmFrame: number | undefined;
let armoryPreviewPrewarmItemIds: HeroItemId[] = [];
let activeArmoryPreviewPrewarmSignature = "";
let completedArmoryPreviewPrewarmSignature = "";

const cityReturnTransition = createCityReturnTransition();
const cityHeroProfile = mountCityHeroProfile(cityHeroWidgetRefs);
const cityHeroEquipmentMenu: CityHeroEquipmentMenuApi = mountCityHeroEquipmentMenu(cityHeroWidgetRefs, {
  getHero: () => hero,
  onEquip: handleProfileEquipmentEquip,
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

function playCityCurtainTransition(onCovered?: () => void): void {
  if (!cityMenu) {
    onCovered?.();
    return;
  }

  if (cityCurtainCleanupTimer) {
    window.clearTimeout(cityCurtainCleanupTimer);
    cityCurtainCleanupTimer = undefined;
  }
  if (cityCurtainSwitchTimer) {
    window.clearTimeout(cityCurtainSwitchTimer);
    cityCurtainSwitchTimer = undefined;
  }

  cityMenu.classList.remove("city-menu--curtain-play");
  void cityMenu.offsetWidth;
  cityMenu.classList.add("city-menu--curtain-play");
  cityCurtainSwitchTimer = window.setTimeout(() => {
    cityCurtainSwitchTimer = undefined;
    onCovered?.();
  }, CITY_CURTAIN_SWITCH_MS);
  cityCurtainCleanupTimer = window.setTimeout(() => {
    cityCurtainCleanupTimer = undefined;
    cityMenu.classList.remove("city-menu--curtain-play");
  }, CITY_CURTAIN_TRANSITION_MS);
}

function renderCurrentDom(): void {
  renderDom(dom, state, {
    hero,
    reward: getBattleReward(state),
    resultPresentation: battleResultPresentation,
    resultReturn: {
      ready: battleResultReturnReady,
      label: battleResultReturnLabel,
    },
  });
}

function syncPlayerCityBodyScale(): void {
  setPlayerBodyScaleBonus(deriveHeroStats(hero).bodyScaleBonus);
}

function commitState(nextState: CombatState, options: { syncArena?: boolean } = {}): Promise<void> {
  const syncArena = options.syncArena ?? true;
  const committedState = applyBattleRewardIfNeeded(nextState);

  state = committedState;
  renderCurrentDom();
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  const actionAnimation = syncArena ? (arenaScene?.sync(state) ?? Promise.resolve()) : Promise.resolve();
  syncActionArc();
  syncTurnProbe();

  return actionAnimation;
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function syncActionArc(): void {
  const visibleState = isTurnAnimationLocked ? { ...state, activeTurn: "enemy" as const } : state;

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
  if (!hasStarted || isInCity || isTurnAnimationLocked) {
    return;
  }

  logTurnProbe("player-action", state, enemyTimerStatus, actionId);

  const nextState = resolvePlayerTurn(state, actionId);

  const actionAnimation = commitState(nextState);

  void scheduleEnemyTurn(nextState, actionAnimation);
}

async function maybeAutoRestPlayerTurn(): Promise<void> {
  if (!shouldAutoRestPlayer(state)) {
    return;
  }

  lastActionClick = "rest:auto";
  logTurnProbe("auto-rest", state, enemyTimerStatus, "rest");

  const nextState = resolvePlayerTurn(state, "rest");

  const actionAnimation = commitState(nextState);

  await scheduleEnemyTurn(nextState, actionAnimation);
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

  if (shouldAutoRestPlayer(state)) {
    await maybeAutoRestPlayerTurn();
    return;
  }

  setTurnAnimationLocked(false);
}

function refreshArenaLayout(): void {
  window.requestAnimationFrame(() => {
    arenaScene?.scale.refresh();

    window.requestAnimationFrame(() => {
      arenaScene?.scale.refresh();
      arenaScene?.sync(state);
      syncActionArc();
      syncTurnProbe();
    });
  });
}

function handleActionArcClick(event: Event): void {
  const { actionId, disabled } = (event as CustomEvent<{ actionId?: ActionId; disabled?: boolean }>).detail ?? {};

  lastActionClick = actionId ? `${actionId}${disabled ? ":disabled" : ""}` : "unknown";
  syncTurnProbe();
  logTurnProbe("button-click", state, enemyTimerStatus, actionId);
}

function mountCityPreviews(): Promise<void> {
  if (cityHero && !cityScene) {
    cityScene = mountCityHeroPreview(cityHero, hero.equipment);
  }

  if (cityHeroWidgetRefs.portrait && !heroPortraitPreview) {
    heroPortraitPreview = mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment, {
      mirrorParents: cityHeroWidgetRefs.profilePortrait ? [cityHeroWidgetRefs.profilePortrait] : [],
    });
  }

  return cityScene?.ready ?? Promise.resolve();
}

function focusCityShop(mode: "armory" | "weaponShop"): void {
  if (mode === "armory") {
    cityScene?.focusArmory(true);
  } else {
    cityScene?.focusWeaponShop(true);
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
  return selection.kind === "boss" ? createArenaBossEncounter(selection.bossId) : createArenaRandomEnemyEncounter(selection.tierId);
}

function renderCityArenaMenu(): void {
  if (!cityArenaTierName || !cityArenaRandomReward || !cityArenaBossList) {
    return;
  }

  const tier = getArenaTierDefinition(DEFAULT_ARENA_TIER_ID);
  const randomOpponent = getArenaRandomOpponentsForTier(tier.id)[0];
  const bosses = getArenaBossesForTier(tier.id);

  cityArenaTierName.textContent = tier.name;
  cityArenaRandomReward.textContent = `Win ${formatCityArenaReward(randomOpponent?.rewards.win ?? { gold: 5, xp: 5 })}`;
  cityArenaBossList.replaceChildren(...(bosses.length > 0 ? bosses.map(createCityArenaBossButton) : [createCityArenaEmptyBossMessage()]));
}

function createCityArenaBossButton(boss: ArenaBossDefinition): HTMLButtonElement {
  const button = document.createElement("button");
  const eyebrow = document.createElement("span");
  const name = document.createElement("strong");
  const stats = document.createElement("span");
  const reward = document.createElement("span");

  button.className = "city-arena-menu__boss";
  button.type = "button";
  eyebrow.className = "city-arena-menu__eyebrow";
  eyebrow.textContent = `Tier ${boss.tierId} Boss`;
  name.textContent = boss.name;
  stats.className = "city-arena-menu__boss-stats";
  stats.textContent = `STR ${boss.baseStats.strength} / AGI ${boss.baseStats.agility} / VIT ${boss.baseStats.vitality}`;
  reward.className = "city-arena-menu__reward";
  reward.textContent = `Win ${formatCityArenaReward(boss.rewards.win)}`;
  button.append(eyebrow, name, stats, reward);
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

function formatCityArenaReward(reward: { gold: number; xp: number }): string {
  return `${reward.gold} Gold / ${reward.xp} XP`;
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
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
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

function unmountCityPreviews(): void {
  cityScene?.destroy();
  heroPortraitPreview?.destroy();
  cityScene = undefined;
  heroPortraitPreview = undefined;
}

function mountArena(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  dom.gameScreen.classList.add("battle-screen--arena-entry");

  window.requestAnimationFrame(() => {
    unmountArena = launchArena((scene) => {
      arenaScene = scene;
      const arenaEntryAnimation = arenaScene.sync(state);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          dom.gameScreen.classList.remove("battle-screen--arena-entry");
        });
      });

      void arenaEntryAnimation.finally(() => {
        dom.gameScreen.classList.remove("battle-screen--arena-entry");
      });
      refreshArenaLayout();
    }, handleAction, hero.equipment);
  });
}

function unmountArenaScene(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
  dom.gameScreen.classList.remove("battle-screen--arena-entry");
}

function startGame(): void {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  unmountCityPreviews();
  weaponShop?.close();
  armoryShop?.close();

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
  syncPlayerCityBodyScale();
  battleResultPresentation = {
    id: `battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
  };
  startBattleResultReturnGate();
  armoryShop?.render();
  weaponShop?.render();
  cityHeroEquipmentMenu.render();

  return nextState;
}

function handleShopBuy(product: ArmoryProduct | WeaponProduct): void {
  const isSealedArmoryPurchase =
    isArmoryShopProduct(product) &&
    !areHeroItemsOwned(hero, product.itemIds) &&
    isShopProductSealed(hero, product.itemIds, product.rarity);

  if (isSealedArmoryPurchase) {
    return;
  }

  cancelArmoryPreviewPrewarm();
  const nextHero = buyAndEquipHeroItems(hero, {
    itemIds: product.itemIds,
    price: product.price,
  });

  if (nextHero === hero) {
    return;
  }

  activeShopPreviewEquipment = undefined;
  hero = nextHero;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  if (shouldRefreshHeroPortrait(product)) {
    heroPortraitPreview?.setEquipment(hero.equipment);
  }
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  armoryShop?.render();
  weaponShop?.render();
  cityHeroEquipmentMenu.render();
}

function isArmoryShopProduct(product: ArmoryProduct | WeaponProduct): product is ArmoryProduct {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "armor");
}

function handleHeroAttributeAllocate(attribute: HeroAttributeKey, amount: number): void {
  const nextHero = allocateHeroSkillPoints(hero, attribute, amount);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  syncPlayerCityBodyScale();
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  armoryShop?.render();
  weaponShop?.render();
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

  cancelArmoryPreviewPrewarm();
  activeShopPreviewEquipment = undefined;
  hero = nextHero;
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  heroPortraitPreview?.setEquipment(hero.equipment);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  armoryShop?.render();
  weaponShop?.render();
  cityHeroEquipmentMenu.render();
}

function handleTemporaryChurchSkillGrant(): void {
  hero = grantHeroSkillPoints(hero, 10);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
}

function shouldRefreshHeroPortrait(product: ArmoryProduct | WeaponProduct): boolean {
  return product.itemIds.some((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    return Boolean(item && HERO_PORTRAIT_REFRESH_SLOTS.has(item.equipmentSlot));
  });
}

function createShopPreviewEquipment(itemIds: readonly HeroItemId[], baseEquipment: HeroEquipment = hero.equipment): HeroEquipment {
  const equipment: HeroEquipment = { ...baseEquipment };

  itemIds.forEach((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    equipment[item.equipmentSlot] = itemId;
  });

  return equipment;
}

function handleShopPreview(product: ArmoryProduct | WeaponProduct): void {
  ensureArmoryPreviewProfile(product, "main.handleShopPreview");
  profileArmoryPreviewSpan("main.cancelArmoryPreviewPrewarm", cancelArmoryPreviewPrewarm);
  const phase = isArmoryShopProduct(product) && product.itemIds.length > 1 ? "paired" : "single";
  const equipment = profileArmoryPreviewSpan(
    `main.createPreviewEquipment.${phase}`,
    () => createShopPreviewEquipment(product.itemIds),
    { itemIds: product.itemIds },
  );

  previewShopEquipment(equipment, phase);
  finishArmoryPreviewProfile(`${phase} preview complete`);
}

function clearShopPreview(): void {
  cancelArmoryPreviewPrewarm();
  activeShopPreviewEquipment = undefined;
  cityScene?.clearEquipmentPreview();
  finishArmoryPreviewProfile("preview cleared");
}

function handleArmoryProductPrewarm(products: readonly ArmoryProduct[]): void {
  const itemIds = products
    .filter((product) => product.itemIds.length > 1 && !isShopProductSealed(hero, product.itemIds, product.rarity))
    .flatMap((product) => product.itemIds);

  scheduleArmoryPreviewPrewarm(itemIds);
}

function scheduleArmoryPreviewPrewarm(itemIds: readonly HeroItemId[]): void {
  const uniqueItemIds = [...new Set(itemIds)]
    .filter((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "armor");
  const signature = uniqueItemIds.join("|");

  if (!signature) {
    cancelArmoryPreviewPrewarm();
    return;
  }

  if (signature === activeArmoryPreviewPrewarmSignature || signature === completedArmoryPreviewPrewarmSignature) {
    return;
  }

  cancelArmoryPreviewPrewarm();
  activeArmoryPreviewPrewarmSignature = signature;
  armoryPreviewPrewarmItemIds = uniqueItemIds;
  requestArmoryPreviewPrewarmStep();
}

function requestArmoryPreviewPrewarmStep(): void {
  if (armoryPreviewPrewarmFrame !== undefined) {
    return;
  }

  const token = armoryPreviewPrewarmToken;

  armoryPreviewPrewarmFrame = window.requestAnimationFrame(() => {
    armoryPreviewPrewarmFrame = undefined;

    if (token !== armoryPreviewPrewarmToken) {
      return;
    }

    const itemId = armoryPreviewPrewarmItemIds.shift();

    if (itemId) {
      cityScene?.prewarmEquipmentItem(itemId);
    }

    if (armoryPreviewPrewarmItemIds.length > 0) {
      requestArmoryPreviewPrewarmStep();
      return;
    }

    completedArmoryPreviewPrewarmSignature = activeArmoryPreviewPrewarmSignature;
    activeArmoryPreviewPrewarmSignature = "";
  });
}

function cancelArmoryPreviewPrewarm(): void {
  armoryPreviewPrewarmToken += 1;
  activeArmoryPreviewPrewarmSignature = "";
  armoryPreviewPrewarmItemIds = [];
  if (armoryPreviewPrewarmFrame !== undefined) {
    window.cancelAnimationFrame(armoryPreviewPrewarmFrame);
    armoryPreviewPrewarmFrame = undefined;
  }
}

function previewShopEquipment(equipment: HeroEquipment, phase = "preview"): void {
  activeShopPreviewEquipment = equipment;
  profileArmoryPreviewSpan(`main.previewShopEquipment.${phase}`, () => {
    cityScene?.previewEquipment(equipment);
  });
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
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
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
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  void commitState(createCombatStateFromHero(hero, createArenaEncounterForSelection(activeArenaSelection)), options);
}

dom.startButton.addEventListener("click", () => {
  openCityArenaMenu();
});
cityArenaCloseButton?.addEventListener("click", closeCityArenaMenu);
cityArenaRandomButton?.addEventListener("click", () => {
  startSelectedArena({ kind: "random", tierId: DEFAULT_ARENA_TIER_ID });
});
dom.restartButton.addEventListener("click", () => restart());
dom.cityButton.addEventListener("click", returnToCity);
weaponShopButton?.addEventListener("click", () => {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  armoryShop?.close();
  weaponShop?.open();
});
armoryButton?.addEventListener("click", () => {
  cityHeroProfile?.close();
  closeCityArenaMenu();
  weaponShop?.close();
  armoryShop?.open();
});
churchButton?.addEventListener("click", handleTemporaryChurchSkillGrant);
syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
syncPlayerCityBodyScale();
renderCityHeroInfo(cityHeroWidgetRefs, hero);
mountCityHeroAttributeControls(cityHeroWidgetRefs, handleHeroAttributeAllocate);
void finishInitialCityEntry();
prewarmShopItemIconsWhenIdle();
if (cityMenu) {
  weaponShop = mountWeaponShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
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
    onPrewarmProducts: handleArmoryProductPrewarm,
    transitionDelayMs: CITY_CURTAIN_SWITCH_MS,
    onOpen: () => {
      playCityCurtainTransition(() => focusCityShop("armory"));
    },
    onClose: () => {
      playCityCurtainTransition(focusCityDefaultFromShop);
    },
    onLayoutChange: syncCityShopLayout,
  });
}
renderCurrentDom();
