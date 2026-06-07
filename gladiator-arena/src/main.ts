import { mountActionArc, type ActionArcApi } from "./actionArc";
import { launchArena, mountCityHeroPreview, type ArenaScene } from "./ArenaScene";
import { resolveEnemyTurn, resolvePlayerTurn, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { getDomRefs, renderDom } from "./domUi";
import { createCombatStateFromHero, createDefaultHero, type HeroState } from "./hero";
import { logTurnProbe, mountTurnProbe, shouldMountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import "./styles.css";

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
}

interface TelegramWindow {
  WebApp?: TelegramWebApp;
}

declare global {
  interface Window {
    Telegram?: TelegramWindow;
  }
}

function bootTelegramWebApp(): void {
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes?.();
  webApp.setBackgroundColor?.("#35180d");
  webApp.setHeaderColor?.("#35180d");
}

bootTelegramWebApp();

const dom = getDomRefs();
const cityHero = document.querySelector<HTMLElement>("#cityHero");
const hero: HeroState = createDefaultHero();
let state: CombatState = createCombatStateFromHero(hero);
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
let hasStarted = false;
let isInCity = true;

function commitState(nextState: CombatState, options: { syncArena?: boolean } = {}): void {
  const syncArena = options.syncArena ?? true;

  state = nextState;
  renderDom(dom, state);
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

function startGame(): void {
  if (hasStarted) {
    isInCity = false;
    dom.mainMenu.hidden = true;
    dom.gameScreen.hidden = false;
    document.body.classList.add("arena-active");
    restart({ syncArena: false });
    refreshArenaLayout();
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
  restart();

  window.requestAnimationFrame(() => {
    launchArena((scene) => {
      arenaScene = scene;
      arenaScene.sync(state);
      refreshArenaLayout();
    }, handleAction, hero.equipment);
  });
}

function returnToCity(): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  isInCity = true;
  enemyTimerStatus = "idle";
  lastActionClick = "none";
  dom.gameScreen.hidden = true;
  dom.mainMenu.hidden = false;
  document.body.classList.remove("arena-active");
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
if (cityHero) {
  mountCityHeroPreview(cityHero, hero.equipment);
}
renderDom(dom, state);
