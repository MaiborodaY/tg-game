import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountHeroPortraitPreview,
  prewarmArenaAssetsForBrowserCache,
  setPlayerEquipment,
  type ArenaScene,
  type CitySceneApi,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import { getCityHeroWidgetRefs, renderCityHeroInfo, syncCityHeroWidgetPosition } from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { resolveEnemyTurn, resolvePlayerTurn, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { debugTuning } from "./debugTuning";
import { getDomRefs, renderDom } from "./domUi";
import {
  HERO_ITEM_CATALOG,
  applyBattleReward,
  buyAndEquipHeroItems,
  createCombatStateFromHero,
  createDefaultHero,
  getBattleReward,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { mountSettingsMenu } from "./settingsMenu";
import { prewarmShopItemIconsForBrowserCache } from "./shopItemIcons";
import { bootTelegramWebApp } from "./telegram";
import { logTurnProbe, mountTurnProbe, shouldMountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

bootTelegramWebApp();

const dom = getDomRefs();
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const cityTimeToggle = document.querySelector<HTMLButtonElement>("#cityTimeToggle");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
let hero: HeroState = createDefaultHero();
let state: CombatState = createCombatStateFromHero(hero);
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
let unmountHeroPortraitPreview: (() => void) | undefined;
const CITY_CURTAIN_TRANSITION_MS = 620;
const CITY_CURTAIN_SWITCH_MS = 210;
let cityCurtainCleanupTimer: number | undefined;
let cityCurtainSwitchTimer: number | undefined;
let isArenaTransitionRunning = false;
let cityShopFreezeImage: HTMLImageElement | undefined;
let cityShopFreezeToken = 0;
let isCityShopFrozen = false;

syncHudTuning(dom.gameScreen, debugTuning);
mountSettingsMenu();
mountCityTimeToggle(cityTimeToggle, cityMenu);

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

function commitState(nextState: CombatState, options: { syncArena?: boolean } = {}): Promise<void> {
  const syncArena = options.syncArena ?? true;
  const committedState = applyBattleRewardIfNeeded(nextState);

  state = committedState;
  renderDom(dom, state);
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

function mountCityPreviews(): void {
  if (cityHero && !cityScene) {
    cityScene = mountCityHeroPreview(cityHero, hero.equipment);
  }

  if (cityHeroWidgetRefs.portrait && !unmountHeroPortraitPreview) {
    unmountHeroPortraitPreview = mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment);
  }
}

function ensureCityShopFreezeImage(): HTMLImageElement | undefined {
  if (!cityHero) {
    return undefined;
  }

  if (!cityShopFreezeImage) {
    cityShopFreezeImage = document.createElement("img");
    cityShopFreezeImage.className = "city-menu__hero-freeze";
    cityShopFreezeImage.alt = "";
    cityShopFreezeImage.draggable = false;
    cityShopFreezeImage.hidden = true;
    cityShopFreezeImage.setAttribute("aria-hidden", "true");
    cityHero.append(cityShopFreezeImage);
  }

  return cityShopFreezeImage;
}

function resumeCityHeroRenderingForShop(): void {
  cityShopFreezeToken += 1;
  isCityShopFrozen = false;
  cityScene?.setRenderingPaused(false);
  cityHero?.classList.remove("city-menu__hero--frozen");

  if (cityShopFreezeImage) {
    cityShopFreezeImage.hidden = true;
    cityShopFreezeImage.removeAttribute("src");
  }
}

function freezeCityHeroRenderingForShop(): void {
  const image = ensureCityShopFreezeImage();
  const token = cityShopFreezeToken + 1;

  cityShopFreezeToken = token;

  if (!image) {
    cityScene?.setRenderingPaused(true);
    isCityShopFrozen = true;
    return;
  }

  cityScene?.captureFrame((src) => {
    if (token !== cityShopFreezeToken || !cityHero) {
      return;
    }

    image.src = src;
    image.hidden = false;
    cityHero.classList.add("city-menu__hero--frozen");
    cityScene?.setRenderingPaused(true);
    isCityShopFrozen = true;
  });
}

function focusCityShop(mode: "armory" | "weaponShop"): void {
  if (isCityShopFrozen) {
    resumeCityHeroRenderingForShop();
  }

  if (mode === "armory") {
    cityScene?.focusArmory(true);
  } else {
    cityScene?.focusWeaponShop(true);
  }

  freezeCityHeroRenderingForShop();
}

function focusCityDefaultFromShop(): void {
  if (isCityShopFrozen) {
    resumeCityHeroRenderingForShop();
  }

  cityScene?.focusDefault(true);
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

function unmountCityPreviews(): void {
  resumeCityHeroRenderingForShop();
  cityScene?.destroy();
  unmountHeroPortraitPreview?.();
  cityScene = undefined;
  unmountHeroPortraitPreview = undefined;
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

  hero = applyBattleReward(hero, getBattleReward(nextState));
  armoryShop?.render();
  weaponShop?.render();

  return nextState;
}

function handleShopBuy(product: ArmoryProduct | WeaponProduct): void {
  const nextHero = buyAndEquipHeroItems(hero, {
    itemIds: product.itemIds,
    price: product.price,
  });

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  setPlayerEquipment(hero.equipment);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  armoryShop?.render();
  weaponShop?.render();
}

function createShopPreviewEquipment(itemIds: HeroItemId[]): HeroEquipment {
  const equipment: HeroEquipment = { ...hero.equipment };

  itemIds.forEach((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    equipment[item.equipmentSlot] = itemId;
  });

  return equipment;
}

function handleShopPreview(product: ArmoryProduct | WeaponProduct): void {
  setPlayerEquipment(createShopPreviewEquipment(product.itemIds));
}

function clearShopPreview(): void {
  setPlayerEquipment(hero.equipment);
}

function returnToCity(): void {
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
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
  mountCityPreviews();
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  syncTurnProbe();
}

function restart(options: { syncArena?: boolean } = {}): void {
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  void commitState(createCombatStateFromHero(hero), options);
}

dom.startButton.addEventListener("click", () => {
  void startGameWithCityTransition();
});
dom.restartButton.addEventListener("click", () => restart());
dom.cityButton.addEventListener("click", returnToCity);
weaponShopButton?.addEventListener("click", () => {
  armoryShop?.close();
  weaponShop?.open();
});
armoryButton?.addEventListener("click", () => {
  weaponShop?.close();
  armoryShop?.open();
});
syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
renderCityHeroInfo(cityHeroWidgetRefs, hero);
mountCityPreviews();
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
  });
  armoryShop = mountArmoryShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
    transitionDelayMs: CITY_CURTAIN_SWITCH_MS,
    onOpen: () => {
      playCityCurtainTransition(() => focusCityShop("armory"));
    },
    onClose: () => {
      playCityCurtainTransition(focusCityDefaultFromShop);
    },
  });
}
renderDom(dom, state);
