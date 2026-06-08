import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountHeroPortraitPreview,
  setPlayerEquipment,
  type ArenaScene,
  type CitySceneApi,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import { getCityHeroWidgetRefs, renderCityHeroInfo, syncCityHeroWidgetPosition } from "./cityHeroUi";
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
import { bootTelegramWebApp } from "./telegram";
import { logTurnProbe, mountTurnProbe, shouldMountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

bootTelegramWebApp();

const dom = getDomRefs();
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
let hero: HeroState = createDefaultHero();
let state: CombatState = createCombatStateFromHero(hero);
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;
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

function commitState(nextState: CombatState, options: { syncArena?: boolean } = {}): void {
  const syncArena = options.syncArena ?? true;
  const committedState = applyBattleRewardIfNeeded(nextState);

  state = committedState;
  renderDom(dom, state);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  actionArc?.sync(state);
  if (syncArena) {
    arenaScene?.sync(state);
  }
  syncTurnProbe();
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function handleAction(actionId: ActionId): void {
  if (!hasStarted || isInCity) {
    return;
  }

  logTurnProbe("player-action", state, enemyTimerStatus, actionId);

  const nextState = resolvePlayerTurn(state, actionId);

  commitState(nextState);
  scheduleEnemyTurn(nextState);
}

function maybeAutoRestPlayerTurn(): void {
  if (!shouldAutoRestPlayer(state)) {
    return;
  }

  lastActionClick = "rest:auto";
  logTurnProbe("auto-rest", state, enemyTimerStatus, "rest");

  const nextState = resolvePlayerTurn(state, "rest");

  commitState(nextState);
  scheduleEnemyTurn(nextState);
}

function scheduleEnemyTurn(enemyState: CombatState): void {
  if (enemyState.result !== "playing" || enemyState.activeTurn !== "enemy") {
    return;
  }

  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
  }

  enemyTimerStatus = "scheduled";
  syncTurnProbe();
  logTurnProbe("enemy-scheduled", enemyState, enemyTimerStatus);

  enemyTurnTimer = window.setTimeout(() => {
    enemyTurnTimer = undefined;
    enemyTimerStatus = "running";
    logTurnProbe("enemy-running", enemyState, enemyTimerStatus);

    const nextState = resolveEnemyTurn(enemyState);

    enemyTimerStatus = "idle";
    commitState(nextState);
    logTurnProbe("enemy-committed", nextState, enemyTimerStatus);
    maybeAutoRestPlayerTurn();
  }, 700);
}

function refreshArenaLayout(): void {
  window.requestAnimationFrame(() => {
    arenaScene?.scale.refresh();

    window.requestAnimationFrame(() => {
      arenaScene?.scale.refresh();
      arenaScene?.sync(state);
      actionArc?.sync(state);
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

function unmountCityPreviews(): void {
  cityScene?.destroy();
  unmountHeroPortraitPreview?.();
  cityScene = undefined;
  unmountHeroPortraitPreview = undefined;
}

function mountArena(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;

  window.requestAnimationFrame(() => {
    unmountArena = launchArena((scene) => {
      arenaScene = scene;
      arenaScene.sync(state);
      refreshArenaLayout();
    }, handleAction, hero.equipment);
  });
}

function unmountArenaScene(): void {
  unmountArena?.();
  unmountArena = undefined;
  arenaScene = undefined;
}

function startGame(): void {
  unmountCityPreviews();
  weaponShop?.close();
  armoryShop?.close();

  if (hasStarted) {
    isInCity = false;
    dom.mainMenu.hidden = true;
    dom.gameScreen.hidden = false;
    document.body.classList.add("arena-active");
    restart({ syncArena: false });
    mountArena();
    return;
  }

  hasStarted = true;
  isInCity = false;
  dom.mainMenu.hidden = true;
  dom.gameScreen.hidden = false;
  document.body.classList.add("arena-active");
  actionArc = mountActionArc(dom.gameScreen, handleAction);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = shouldMountTurnProbe() ? mountTurnProbe(dom.gameScreen) : undefined;
  restart({ syncArena: false });
  mountArena();
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
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  isInCity = true;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  unmountArenaScene();
  dom.gameScreen.hidden = true;
  dom.mainMenu.hidden = false;
  document.body.classList.remove("arena-active");
  mountCityPreviews();
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  syncTurnProbe();
}

function restart(options: { syncArena?: boolean } = {}): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  enemyTimerStatus = "idle";
  lastActionClick = "none";
  commitState(createCombatStateFromHero(hero), options);
}

dom.startButton.addEventListener("click", startGame);
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
if (cityMenu) {
  weaponShop = mountWeaponShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
    onOpen: () => cityScene?.focusWeaponShop(),
    onClose: () => cityScene?.focusDefault(),
  });
  armoryShop = mountArmoryShop(cityMenu, {
    getHero: () => hero,
    onBuy: handleShopBuy,
    onPreview: handleShopPreview,
    onPreviewClear: clearShopPreview,
    onOpen: () => cityScene?.focusArmory(),
    onClose: () => cityScene?.focusDefault(),
  });
}
renderDom(dom, state);
