import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountDebugCharacterViewer,
  mountHeroPortraitPreview,
  setPlayerEquipment,
  type ArenaScene,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import { getCityHeroWidgetRefs, renderCityHeroInfo, syncCityHeroWidgetPosition } from "./cityHeroUi";
import { resolveEnemyTurn, resolvePlayerTurn, setCombatMovementTuning, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { mountDebugPanel } from "./debugPanel";
import {
  beginDebugUndoGroup,
  debugTuning,
  endDebugUndoGroup,
  hydrateDebugTuningFromStorage,
  subscribeDebugTuning,
  updateDebugTuning,
  type SlashArcAttackKey,
} from "./debugTuning";
import { getDomRefs, renderDom } from "./domUi";
import {
  HERO_ITEM_CATALOG,
  applyBattleReward,
  buyAndEquipHeroItems,
  createCombatStateFromHero,
  createDefaultHero,
  createStarterHeroEquipment,
  createStarterHeroInventory,
  getBattleReward,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
} from "./hero";
import { logTurnProbe, mountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

hydrateDebugTuningFromStorage();

const dom = getDomRefs();
const debugPanelHost = document.querySelector<HTMLElement>("#debugPanelHost");
const debugCharacterViewer = document.querySelector<HTMLElement>("#debugCharacterViewer");
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
const heroPortraitButton = cityHeroWidgetRefs.portraitButton;
let hero: HeroState = {
  ...createDefaultHero(),
  equipment: createStarterHeroEquipment(),
  inventory: createStarterHeroInventory(),
};
let state: CombatState = createCombatStateFromHero(hero);
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
let weaponShop: WeaponShopApi | undefined;
let armoryShop: ArmoryShopApi | undefined;

interface HeroPortraitButtonDragState {
  pointerId: number;
  lastX: number;
  lastY: number;
}

let heroPortraitButtonDragState: HeroPortraitButtonDragState | undefined;

function commitState(nextState: CombatState): void {
  state = applyBattleRewardIfNeeded(nextState);
  renderDom(dom, state);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  actionArc?.sync(state);
  arenaScene?.sync(state);
  syncTurnProbe();
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function handleAction(actionId: ActionId): void {
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
    arenaScene?.sync(state);
    syncTurnProbe();
  });
}

function restart(): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  enemyTimerStatus = "idle";
  lastActionClick = "none";
  commitState(createCombatStateFromHero(hero));
}

function handleActionArcClick(event: Event): void {
  const { actionId, disabled } = (event as CustomEvent<{ actionId?: ActionId; disabled?: boolean }>).detail ?? {};

  lastActionClick = actionId ? `${actionId}${disabled ? ":disabled" : ""}` : "unknown";
  syncTurnProbe();
  logTurnProbe("button-click", state, enemyTimerStatus, actionId);
}

function applyBattleRewardIfNeeded(nextState: CombatState): CombatState {
  if (state.result !== "playing" || nextState.result === "playing") {
    return nextState;
  }

  hero = applyBattleReward(hero, getBattleReward(nextState));
  weaponShop?.render();
  armoryShop?.render();

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
  weaponShop?.render();
  armoryShop?.render();
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

function previewSlashArc(actionId: SlashArcAttackKey, withBodyAnimation: boolean): void {
  arenaScene?.previewSlashArc(actionId, withBodyAnimation);
}

function syncHeroPortraitButton(): void {
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
}

function mountHeroPortraitButtonDebug(): void {
  if (!heroPortraitButton) {
    return;
  }

  syncHeroPortraitButton();

  heroPortraitButton.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    heroPortraitButton.classList.add("city-menu__portrait-button--selected");
    heroPortraitButton.setPointerCapture(event.pointerId);
    beginDebugUndoGroup();
    heroPortraitButtonDragState = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  });

  heroPortraitButton.addEventListener("pointermove", (event) => {
    if (!heroPortraitButtonDragState || heroPortraitButtonDragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - heroPortraitButtonDragState.lastX;
    const deltaY = event.clientY - heroPortraitButtonDragState.lastY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    updateDebugTuning({
      heroPortraitButtonX: debugTuning.heroPortraitButtonX + deltaX,
      heroPortraitButtonY: debugTuning.heroPortraitButtonY + deltaY,
    });
    heroPortraitButtonDragState.lastX = event.clientX;
    heroPortraitButtonDragState.lastY = event.clientY;
  });

  heroPortraitButton.addEventListener("pointerup", finishHeroPortraitButtonDrag);
  heroPortraitButton.addEventListener("pointercancel", finishHeroPortraitButtonDrag);
  heroPortraitButton.addEventListener("lostpointercapture", () => finishHeroPortraitButtonDrag());
  heroPortraitButton.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      heroPortraitButton.classList.add("city-menu__portrait-button--selected");
      updateDebugTuning({
        heroPortraitButtonScale: debugTuning.heroPortraitButtonScale + (event.deltaY > 0 ? -0.05 : 0.05),
      });
    },
    { passive: false },
  );
}

function finishHeroPortraitButtonDrag(event?: PointerEvent): void {
  if (event && heroPortraitButtonDragState?.pointerId !== event.pointerId) {
    return;
  }

  if (!heroPortraitButtonDragState) {
    return;
  }

  heroPortraitButtonDragState = undefined;
  endDebugUndoGroup();
}

function startDebugApp(): void {
  document.body.classList.add("arena-active", "debug-active", "debug-mode-character");
  setCombatMovementTuning(debugTuning);
  dom.mainMenu.hidden = false;
  dom.gameScreen.hidden = false;
  if (debugCharacterViewer) {
    mountDebugCharacterViewer(debugCharacterViewer, hero.equipment);
  }
  if (cityHero) {
    mountCityHeroPreview(cityHero, hero.equipment);
  }
  if (cityHeroWidgetRefs.portrait) {
    mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment);
  }
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  mountHeroPortraitButtonDebug();
  if (cityMenu) {
    weaponShop = mountWeaponShop(cityMenu, {
      getHero: () => hero,
      mountPreview: (parent) => mountDebugCharacterViewer(parent, hero.equipment),
      onBuy: handleShopBuy,
      onPreview: handleShopPreview,
      onPreviewClear: clearShopPreview,
    });
    armoryShop = mountArmoryShop(cityMenu, {
      getHero: () => hero,
      mountPreview: (parent) => mountDebugCharacterViewer(parent, hero.equipment),
      onBuy: handleShopBuy,
      onPreview: handleShopPreview,
      onPreviewClear: clearShopPreview,
    });
  }
  mountDebugPanel(debugPanelHost ?? dom.gameScreen, {
    heroEquipment: hero.equipment,
    heroInventory: hero.inventory,
    onHeroEquipmentChange: (equipment) => {
      hero.equipment = equipment;
      setPlayerEquipment(hero.equipment);
    },
    onPreviewSlashArc: previewSlashArc,
  });
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = mountTurnProbe(dom.gameScreen);
  subscribeDebugTuning(() => {
    setCombatMovementTuning(debugTuning);
    actionArc?.sync(state);
    arenaScene?.sync(state);
    syncHeroPortraitButton();
    syncTurnProbe();
  });
  restart();

  window.requestAnimationFrame(() => {
    launchArena((scene) => {
      arenaScene = scene;
      arenaScene.sync(state);
      refreshArenaLayout();
    }, handleAction, hero.equipment);
  });
}

dom.restartButton.addEventListener("click", restart);
dom.cityButton.addEventListener("click", restart);
weaponShopButton?.addEventListener("click", () => {
  armoryShop?.close();
  weaponShop?.open();
});
armoryButton?.addEventListener("click", () => {
  weaponShop?.close();
  armoryShop?.open();
});
startDebugApp();
