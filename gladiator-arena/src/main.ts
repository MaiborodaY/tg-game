import { mountActionArc, type ActionArcApi } from "./actionArc";
import { launchArena, type ArenaScene } from "./ArenaScene";
import { freshState, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { getDomRefs, renderDom } from "./domUi";
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
let hasStarted = false;

function commitState(nextState: CombatState): void {
  state = nextState;
  renderDom(dom, state);
  actionArc?.sync(state);
  arenaScene?.sync(state);
}

function handleAction(actionId: ActionId): void {
  if (!hasStarted) {
    return;
  }

  const nextState = resolvePlayerTurn(state, actionId);

  commitState(nextState);

  if (nextState.result === "playing" && nextState.activeTurn === "enemy") {
    enemyTurnTimer = window.setTimeout(() => {
      enemyTurnTimer = undefined;
      commitState(resolveEnemyTurn(state));
    }, 700);
  }
}

function refreshArenaLayout(): void {
  window.requestAnimationFrame(() => {
    arenaScene?.scale.refresh();
    arenaScene?.sync(state);
  });
}

function startGame(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
  dom.mainMenu.hidden = true;
  dom.gameScreen.hidden = false;
  actionArc = mountActionArc(dom.gameScreen, handleAction);
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

  commitState(freshState());
}

dom.startButton.addEventListener("click", startGame);
dom.restartButton.addEventListener("click", restart);
renderDom(dom, state);
