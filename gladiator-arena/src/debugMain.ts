import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountDebugCharacterViewer,
  mountHeroPortraitPreview,
  setPlayerBodyScaleBonus,
  setPlayerEquipment,
  type ArenaScene,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import { getCityHeroWidgetRefs, mountCityHeroAttributeControls, renderCityHeroInfo, syncCityHeroWidgetPosition } from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import { resolveEnemyTurn, resolvePlayerTurn, setCombatMovementTuning, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { mountDebugPanel } from "./debugPanel";
import {
  beginDebugUndoGroup,
  debugTuning,
  endDebugUndoGroup,
  hydrateDebugTuningFromStorage,
  subscribeDebugTuning,
  updateDebugTuning,
  type DebugPopupPreviewKind,
  type SlashArcAttackKey,
} from "./debugTuning";
import { getDomRefs, renderDom, type BattleResultPresentation } from "./domUi";
import {
  HERO_ITEM_CATALOG,
  allocateHeroSkillPoints,
  applyCombatReward,
  buyAndEquipHeroItems,
  createCombatStateFromHero,
  createDefaultHero,
  deriveHeroStats,
  grantHeroGold,
  grantHeroSkillPoints,
  getBattleReward,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
  type HeroAttributeKey,
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { logTurnProbe, mountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

hydrateDebugTuningFromStorage();

const dom = getDomRefs();
const debugPanelHost = document.querySelector<HTMLElement>("#debugPanelHost");
const debugCharacterViewer = document.querySelector<HTMLElement>("#debugCharacterViewer");
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const cityTimeToggle = document.querySelector<HTMLButtonElement>("#cityTimeToggle");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const churchButton = document.querySelector<HTMLButtonElement>("#churchButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
const heroPortraitButton = cityHeroWidgetRefs.portraitButton;
let hero: HeroState = {
  ...createDefaultHero(),
};
let state: CombatState = createCombatStateFromHero(hero);
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let classicActionBar: ClassicActionBarApi | undefined;
let turnSequenceToken = 0;
let isTurnAnimationLocked = false;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
let weaponShop: WeaponShopApi | undefined;
let armoryShop: ArmoryShopApi | undefined;

mountCityTimeToggle(cityTimeToggle, cityMenu);

interface HeroPortraitButtonDragState {
  pointerId: number;
  lastX: number;
  lastY: number;
}

let heroPortraitButtonDragState: HeroPortraitButtonDragState | undefined;

interface HudDragState {
  pointerId: number;
  lastY: number;
}

let hudDragState: HudDragState | undefined;

interface ClassicHudDragState {
  pointerId: number;
  lastX: number;
  lastY: number;
}

let classicHudDragState: ClassicHudDragState | undefined;
let battleResultPresentation: BattleResultPresentation | undefined;
let battleResultPresentationId = 0;

function commitState(nextState: CombatState): Promise<void> {
  state = applyBattleRewardIfNeeded(nextState);
  renderDom(dom, state, { hero, reward: getBattleReward(state), resultPresentation: battleResultPresentation });
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  const actionAnimation = arenaScene?.sync(state) ?? Promise.resolve();

  syncActionArc();
  syncTurnProbe();

  return actionAnimation;
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function syncPlayerCityBodyScale(): void {
  setPlayerBodyScaleBonus(deriveHeroStats(hero).bodyScaleBonus);
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
  if (isTurnAnimationLocked) {
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
    arenaScene?.sync(state);
    syncActionArc();
    syncTurnProbe();
  });
}

function restart(): void {
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  battleResultPresentation = undefined;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  void commitState(createCombatStateFromHero(hero));
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

  const rewardTimestamp = new Date().toISOString();
  const rewardApplication = applyCombatReward(hero, nextState, rewardTimestamp);
  const { reward, loot, heroBeforeReward, heroAfterReward } = rewardApplication;

  hero = heroAfterReward;
  syncPlayerCityBodyScale();
  battleResultPresentation = {
    id: `debug-battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
  };
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
  syncPlayerCityBodyScale();
  setPlayerEquipment(hero.equipment);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  weaponShop?.render();
  armoryShop?.render();
}

function handleHeroAttributeAllocate(attribute: HeroAttributeKey, amount: number): void {
  const nextHero = allocateHeroSkillPoints(hero, attribute, amount);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  syncPlayerCityBodyScale();
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  weaponShop?.render();
  armoryShop?.render();
  restart();
}

function handleTemporaryChurchSkillGrant(): void {
  const now = new Date().toISOString();

  hero = grantHeroGold(grantHeroSkillPoints(hero, 10, now), 1000, now);
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

function previewPopup(kind: DebugPopupPreviewKind): void {
  arenaScene?.previewPopup(kind);
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

function syncHud(): void {
  syncHudTuning(dom.gameScreen, debugTuning);
  document.body.classList.toggle("arena-hud-classic", debugTuning.hudMode === "classic");
  document.body.classList.toggle("arena-hud-immersive", debugTuning.hudMode === "immersive");
}

function mountHudDebug(): void {
  const hud = dom.gameScreen.querySelector<HTMLElement>(".arena-fighters-strip");

  if (!hud) {
    return;
  }

  syncHud();

  hud.addEventListener("pointerdown", (event) => {
    if (!debugTuning.hudEditMode || event.button !== 0) {
      return;
    }

    event.preventDefault();
    hud.setPointerCapture(event.pointerId);
    beginDebugUndoGroup();
    hudDragState = {
      pointerId: event.pointerId,
      lastY: event.clientY,
    };
  });

  hud.addEventListener("pointermove", (event) => {
    if (!hudDragState || hudDragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - hudDragState.lastY;

    if (Math.abs(deltaY) < 0.1) {
      return;
    }

    updateDebugTuning({
      hudBottomOffset: debugTuning.hudBottomOffset - deltaY,
    });
    hudDragState.lastY = event.clientY;
  });

  hud.addEventListener("pointerup", finishHudDrag);
  hud.addEventListener("pointercancel", finishHudDrag);
  hud.addEventListener("lostpointercapture", () => finishHudDrag());
  hud.addEventListener(
    "wheel",
    (event) => {
      if (!debugTuning.hudEditMode) {
        return;
      }

      event.preventDefault();
      updateDebugTuning({
        hudScale: debugTuning.hudScale + (event.deltaY > 0 ? -0.03 : 0.03),
      });
    },
    { passive: false },
  );
}

function mountClassicHudDebug(): void {
  const classicHud = dom.gameScreen.querySelector<HTMLElement>("[data-classic-action-bar]");

  if (!classicHud) {
    return;
  }

  classicHud.addEventListener(
    "click",
    (event) => {
      if (!debugTuning.classicHudEditMode) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  classicHud.addEventListener("pointerdown", (event) => {
    if (!debugTuning.classicHudEditMode || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    classicHud.setPointerCapture(event.pointerId);
    beginDebugUndoGroup();
    classicHudDragState = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  });

  classicHud.addEventListener("pointermove", (event) => {
    if (!classicHudDragState || classicHudDragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - classicHudDragState.lastX;
    const deltaY = event.clientY - classicHudDragState.lastY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    updateDebugTuning({
      classicHudOffsetX: debugTuning.classicHudOffsetX + deltaX,
      classicHudOffsetY: debugTuning.classicHudOffsetY - deltaY,
    });
    classicHudDragState.lastX = event.clientX;
    classicHudDragState.lastY = event.clientY;
  });

  classicHud.addEventListener("pointerup", finishClassicHudDrag);
  classicHud.addEventListener("pointercancel", finishClassicHudDrag);
  classicHud.addEventListener("lostpointercapture", () => finishClassicHudDrag());
  classicHud.addEventListener(
    "wheel",
    (event) => {
      if (!debugTuning.classicHudEditMode) {
        return;
      }

      event.preventDefault();
      updateDebugTuning({
        classicHudScale: debugTuning.classicHudScale + (event.deltaY > 0 ? -0.03 : 0.03),
      });
    },
    { passive: false },
  );
}

function finishClassicHudDrag(event?: PointerEvent): void {
  if (event && classicHudDragState?.pointerId !== event.pointerId) {
    return;
  }

  if (!classicHudDragState) {
    return;
  }

  classicHudDragState = undefined;
  endDebugUndoGroup();
}

function finishHudDrag(event?: PointerEvent): void {
  if (event && hudDragState?.pointerId !== event.pointerId) {
    return;
  }

  if (!hudDragState) {
    return;
  }

  hudDragState = undefined;
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
  syncPlayerCityBodyScale();
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  mountCityHeroAttributeControls(cityHeroWidgetRefs, handleHeroAttributeAllocate);
  mountHeroPortraitButtonDebug();
  mountHudDebug();
  mountClassicHudDebug();
  if (cityMenu) {
    weaponShop = mountWeaponShop(cityMenu, {
      getHero: () => hero,
      mountPreview: (parent) => mountDebugCharacterViewer(parent, hero.equipment, { mode: "shop" }),
      onBuy: handleShopBuy,
      onPreview: handleShopPreview,
      onPreviewClear: clearShopPreview,
    });
    armoryShop = mountArmoryShop(cityMenu, {
      getHero: () => hero,
      mountPreview: (parent) => mountDebugCharacterViewer(parent, hero.equipment, { mode: "shop" }),
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
    onPreviewPopup: previewPopup,
  });
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning, {
    isEnabled: () => debugTuning.actionArcEditMode,
    beginEdit: beginDebugUndoGroup,
    endEdit: endDebugUndoGroup,
    setArcOffset: (offset) => {
      updateDebugTuning({
        actionArcOffsetX: offset.x,
        actionArcOffsetY: offset.y,
      });
    },
    setButtonOffset: (actionId, offset) => {
      updateDebugTuning({
        actionButtonOffsets: {
          ...debugTuning.actionButtonOffsets,
          [actionId]: offset,
        },
      });
    },
  });
  classicActionBar = mountClassicActionBar(dom.gameScreen, handleAction, () => debugTuning, {
    getPreviewWheelMode: () => debugTuning.selectedClassicActionWheelMode,
    showUnavailableSwitchWeaponSlot: true,
  });
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = mountTurnProbe(dom.gameScreen);
  subscribeDebugTuning(() => {
    setCombatMovementTuning(debugTuning);
    syncHud();
    arenaScene?.sync(state);
    syncActionArc();
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
churchButton?.addEventListener("click", handleTemporaryChurchSkillGrant);
startDebugApp();
