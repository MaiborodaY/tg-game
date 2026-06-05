import { mountActionArc, type ActionArcApi } from "./actionArc";
import { launchArena, type ArenaScene } from "./ArenaScene";
import { freshState, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { getDomRefs, renderDom } from "./domUi";
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
let state: CombatState = freshState();
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";
let hasStarted = false;

function commitState(nextState: CombatState): void {
  state = nextState;
  renderDom(dom, state);
  actionArc?.sync(state);
  arenaScene?.sync(state);
  syncTurnProbe();
}

function syncTurnProbe(): void {
  turnProbe?.sync(state, enemyTimerStatus, lastActionClick);
}

function handleAction(actionId: ActionId): void {
  if (!hasStarted) {
    return;
  }

  logTurnProbe("player-action", state, enemyTimerStatus, actionId);

  const nextState = resolvePlayerTurn(state, actionId);

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
  }, 700);
}

function refreshArenaLayout(): void {
  window.requestAnimationFrame(() => {
    arenaScene?.scale.refresh();
    arenaScene?.sync(state);
    syncTurnProbe();
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
    return;
  }

  hasStarted = true;
  dom.mainMenu.hidden = true;
  dom.gameScreen.hidden = false;
  actionArc = mountActionArc(dom.gameScreen, handleAction);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = shouldMountTurnProbe() ? mountTurnProbe(dom.gameScreen) : undefined;
  restart();

  window.requestAnimationFrame(() => {
    launchArena((scene) => {
      arenaScene = scene;
      arenaScene.sync(state);
      refreshArenaLayout();
    }, handleAction);
  });
}

function restart(): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  enemyTimerStatus = "idle";
  lastActionClick = "none";
  commitState(freshState());
}

dom.startButton.addEventListener("click", startGame);
dom.restartButton.addEventListener("click", restart);
renderDom(dom, state);