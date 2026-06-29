import { mountActionArc, type ActionArcApi } from "./actionArc";
import {
  launchArena,
  mountCityHeroPreview,
  mountDebugCharacterViewer,
  mountHeroPortraitPreview,
  previewDebugAnimationWardShield,
  setPlayerBodyScaleBonus,
  setPlayerAppearance,
  setPlayerEquipment,
  setPlayerWeaponEnchantments,
  type ArenaScene,
} from "./ArenaScene";
import { mountArmoryShop, type ArmoryProduct, type ArmoryShopApi } from "./armoryShopUi";
import { getCityHeroWidgetRefs, mountCityHeroAttributeControls, renderCityHeroInfo, syncCityHeroWidgetPosition } from "./cityHeroUi";
import { mountCityTimeToggle } from "./cityTimeToggle";
import { mountClassicActionBar, type ClassicActionBarApi } from "./classicActionBar";
import {
  BOW_SHOTS_PER_BATTLE,
  MELEE_RANGE,
  START_DISTANCE,
  resolveEnemyTurn,
  resolvePlayerTurn,
  setCombatMovementTuning,
  type ActionId,
  type CombatState,
} from "./combat";
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
  allocateHeroSkillPoints,
  applyCombatReward,
  buyAndEquipHeroItems,
  createArenaRandomEnemyEncounter,
  createCombatStateFromHero,
  createDefaultHero,
  createHeroPreviewEquipment,
  deriveHeroStats,
  getBattleReward,
  sharpenHeroActiveWeapon,
  upgradeHeroScroll,
  upgradeHeroScrollCapacity,
  type HeroEquipment,
  type HeroItemId,
  type HeroState,
  type HeroAttributeKey,
} from "./hero";
import { syncHudTuning } from "./hudTuning";
import { mountMagicShop, type MagicProduct, type MagicShopApi } from "./magicShopUi";
import { logTurnProbe, mountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import { mountWeaponShop, type WeaponProduct, type WeaponShopApi } from "./weaponShopUi";
import "./styles.css";

hydrateDebugTuningFromStorage();

const dom = getDomRefs();
const debugPanelHost = document.querySelector<HTMLElement>("#debugPanelHost");
const debugCharacterViewer = document.querySelector<HTMLElement>("#debugCharacterViewer");
const debugAnimationViewer = document.querySelector<HTMLElement>("#debugAnimationViewer");
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const cityMenu = document.querySelector<HTMLElement>(".city-menu");
const cityTimeToggle = document.querySelector<HTMLButtonElement>("#cityTimeToggle");
const weaponShopButton = document.querySelector<HTMLButtonElement>("#weaponShopButton");
const armoryButton = document.querySelector<HTMLButtonElement>("#armoryButton");
const magicShopButton = document.querySelector<HTMLButtonElement>("#magicShopButton");
const cityHeroWidgetRefs = getCityHeroWidgetRefs();
const heroPortraitButton = cityHeroWidgetRefs.portraitButton;
let hero: HeroState = createDefaultHero();
let state: CombatState = createCombatStateFromHero(hero);
let displayedStatsState: CombatState = state;
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
let magicShop: MagicShopApi | undefined;
type DebugShopProduct = ArmoryProduct | WeaponProduct | MagicProduct;
const PLAYER_TO_ENEMY_TURN_PACING_MS = 100;
const ENEMY_TO_PLAYER_TURN_PACING_MS = 50;

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
let pendingBattleResultPresentation: BattleResultPresentation | undefined;
let battleResultPresentationId = 0;
let battleResultPresentationRevealToken = 0;
let statsRevealToken = 0;
let rewardUiRenderDirty = false;
let debugCharacterViewerUnmount: (() => void) | undefined;
let debugCharacterViewerMode: "debug" | "enchantGlow" | undefined;

function commitState(nextState: CombatState): Promise<void> {
  const previousState = state;
  const isBattleFinishing = state.result === "playing" && nextState.result !== "playing";
  const statsToken = ++statsRevealToken;
  const committedState = applyBattleRewardIfNeeded(nextState);

  state = committedState;
  displayedStatsState = arenaScene ? getPreImpactStatsState(previousState, committedState) : committedState;
  renderDom(dom, state, {
    hero,
    reward: getBattleReward(state),
    statsState: displayedStatsState,
    resultPresentation: battleResultPresentation,
    deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation),
  });
  if (!isBattleFinishing) {
    renderCityHeroInfo(cityHeroWidgetRefs, hero);
  }
  const actionAnimation = arenaScene?.sync(state, {
    hudState: displayedStatsState,
    onImpact: () => revealStatsAfterImpact(statsToken, committedState),
  }) ?? Promise.resolve();

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
  renderDom(dom, state, {
    hero,
    reward: getBattleReward(state),
    statsState: displayedStatsState,
    resultPresentation: battleResultPresentation,
    deferResultPresentation: state.result !== "playing" && Boolean(pendingBattleResultPresentation),
  });
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
      renderDom(dom, state, {
        hero,
        reward: getBattleReward(state),
        statsState: displayedStatsState,
        resultPresentation: battleResultPresentation,
      });
      renderCityHeroInfo(cityHeroWidgetRefs, hero);
      syncTurnProbe();
    });
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
  classicActionBar?.sync(createClassicActionBarPreviewState(visibleState));
}

function createClassicActionBarPreviewState(source: CombatState): CombatState {
  const previewMode = debugTuning.selectedClassicActionWheelMode;
  const mainWeaponClass = source.player.mainWeaponClass && source.player.mainWeaponClass !== "bow" ? source.player.mainWeaponClass : "sword";
  const bowShots = Math.max(1, source.player.bowShotsRemaining ?? source.player.bowMaxShots ?? BOW_SHOTS_PER_BATTLE);
  const bowMaxShots = Math.max(bowShots, source.player.bowMaxShots ?? BOW_SHOTS_PER_BATTLE);
  const playerWithBow = {
    ...source.player,
    mainWeaponClass,
    bowWeaponClass: "bow" as const,
    bowShotsRemaining: bowShots,
    bowMaxShots,
  };

  if (previewMode === "bowDistance") {
    return {
      ...source,
      distance: START_DISTANCE,
      playerPosition: 0,
      enemyPosition: START_DISTANCE,
      player: {
        ...playerWithBow,
        weaponClass: "bow",
      },
    };
  }

  if (previewMode === "distance") {
    return {
      ...source,
      distance: START_DISTANCE,
      playerPosition: 0,
      enemyPosition: START_DISTANCE,
      player: {
        ...playerWithBow,
        weaponClass: mainWeaponClass,
      },
    };
  }

  if (previewMode === "clinch") {
    return {
      ...source,
      distance: MELEE_RANGE,
      playerPosition: START_DISTANCE,
      enemyPosition: START_DISTANCE + MELEE_RANGE,
      player: {
        ...playerWithBow,
        weaponClass: mainWeaponClass,
      },
    };
  }

  return source;
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
    void arenaScene?.renderState(state);
    syncActionArc();
    syncTurnProbe();
  });
}

function restart(): void {
  restartCombat();
}

function restartArenaTierPreview(tierId: number, backgroundVariantId?: string): void {
  restartCombat(tierId, backgroundVariantId);
}

function restartCombat(tierId?: number, backgroundVariantId?: string): void {
  turnSequenceToken += 1;
  setTurnAnimationLocked(false);
  battleResultPresentation = undefined;
  pendingBattleResultPresentation = undefined;
  battleResultPresentationRevealToken += 1;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  const encounter = tierId === undefined
    ? undefined
    : {
        ...createArenaRandomEnemyEncounter(tierId),
        backgroundVariantId,
      };

  void commitState(encounter ? createCombatStateFromHero(hero, encounter) : createCombatStateFromHero(hero));
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
  weaponShop?.render();
  armoryShop?.render();
  magicShop?.render();
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
  pendingBattleResultPresentation = {
    id: `debug-battle-result-${++battleResultPresentationId}`,
    reward,
    loot,
    heroBeforeReward,
    heroAfterReward,
  };
  markRewardUiRenderDirty();

  return nextState;
}

function handleShopBuy(product: DebugShopProduct): void {
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
  magicShop?.render();
}

function handleMagicWeaponSharpen(): void {
  const nextHero = sharpenHeroActiveWeapon(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  setPlayerWeaponEnchantments(hero.weaponEnchantments);
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  magicShop?.render();
}

function handleMagicScrollUpgrade(product: MagicProduct): void {
  const nextHero = upgradeHeroScroll(hero, product.itemIds[0]);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  magicShop?.render();
}

function handleMagicScrollCapacityUpgrade(): void {
  const nextHero = upgradeHeroScrollCapacity(hero);

  if (nextHero === hero) {
    return;
  }

  hero = nextHero;
  renderCityHeroInfo(cityHeroWidgetRefs, hero);
  magicShop?.render();
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
  magicShop?.render();
  restart();
}

function createShopPreviewEquipment(itemIds: HeroItemId[]): HeroEquipment {
  return createHeroPreviewEquipment(hero.equipment, itemIds);
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

function previewWardShield(): void {
  previewDebugAnimationWardShield();
}

function previewPopup(kind: DebugPopupPreviewKind): void {
  arenaScene?.previewPopup(kind);
}

function syncHeroPortraitButton(): void {
  syncCityHeroWidgetPosition(cityHeroWidgetRefs, debugTuning);
}

function syncDebugCharacterViewer(): void {
  if (!debugCharacterViewer) {
    return;
  }

  const nextMode = document.body.classList.contains("debug-mode-effects") ? "enchantGlow" : "debug";

  if (debugCharacterViewerMode === nextMode) {
    return;
  }

  debugCharacterViewerUnmount?.();
  debugCharacterViewer.replaceChildren();
  debugCharacterViewerMode = nextMode;
  debugCharacterViewerUnmount = mountDebugCharacterViewer(
    debugCharacterViewer,
    hero.equipment,
    nextMode === "enchantGlow" ? { mode: "enchantGlow" } : undefined,
  );
}

function mountDebugCharacterViewerModeSync(): void {
  syncDebugCharacterViewer();
  window.addEventListener("dust-arena-debug-mode-change", syncDebugCharacterViewer);
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
  setPlayerAppearance(hero.appearance);
  mountDebugCharacterViewerModeSync();
  if (debugAnimationViewer) {
    mountDebugCharacterViewer(debugAnimationViewer, hero.equipment, { mode: "animation" });
  }
  if (cityHero) {
    mountCityHeroPreview(cityHero, hero.equipment, hero.appearance);
  }
  if (cityHeroWidgetRefs.portrait) {
    mountHeroPortraitPreview(cityHeroWidgetRefs.portrait, hero.equipment, hero.appearance);
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
    magicShop = mountMagicShop(cityMenu, {
      getHero: () => hero,
      onBuy: handleShopBuy,
      onUpgradeScroll: handleMagicScrollUpgrade,
      onScrollCapacityUpgrade: handleMagicScrollCapacityUpgrade,
      onSharpenWeapon: handleMagicWeaponSharpen,
    });
  }
  mountDebugPanel(debugPanelHost ?? dom.gameScreen, {
    heroEquipment: hero.equipment,
    onHeroEquipmentChange: (equipment) => {
      hero.equipment = equipment;
      setPlayerEquipment(hero.equipment);
    },
    onRestartArenaTierPreview: restartArenaTierPreview,
    onPreviewSlashArc: previewSlashArc,
    onPreviewWardShield: previewWardShield,
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
  });
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = mountTurnProbe(dom.gameScreen);
  subscribeDebugTuning(() => {
    setCombatMovementTuning(debugTuning);
    syncHud();
    void arenaScene?.renderState(state);
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
    }, handleAction, hero.equipment, hero.appearance);
  });
}

dom.restartButton.addEventListener("click", restart);
dom.cityButton.addEventListener("click", restart);
weaponShopButton?.addEventListener("click", () => {
  armoryShop?.close();
  magicShop?.close();
  flushRewardUiRenderIfDirty();
  weaponShop?.open();
});
armoryButton?.addEventListener("click", () => {
  weaponShop?.close();
  magicShop?.close();
  flushRewardUiRenderIfDirty();
  armoryShop?.open();
});
magicShopButton?.addEventListener("click", () => {
  weaponShop?.close();
  armoryShop?.close();
  flushRewardUiRenderIfDirty();
  magicShop?.open();
});
startDebugApp();
