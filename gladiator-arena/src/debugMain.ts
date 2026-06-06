import { mountActionArc, type ActionArcApi } from "./actionArc";
import { launchArena, mountDebugCharacterViewer, type ArenaScene } from "./ArenaScene";
import { resolveEnemyTurn, resolvePlayerTurn, shouldAutoRestPlayer, type ActionId, type CombatState } from "./combat";
import { mountDebugPanel } from "./debugPanel";
import { debugTuning, subscribeDebugTuning } from "./debugTuning";
import { getDomRefs, renderDom } from "./domUi";
import { createCombatStateFromHero, createDefaultHero, type HeroState } from "./hero";
import { logTurnProbe, mountTurnProbe, type EnemyTimerStatus, type TurnProbeApi } from "./turnProbe";
import "./styles.css";

const dom = getDomRefs();
const debugPanelHost = document.querySelector<HTMLElement>("#debugPanelHost");
const debugCharacterViewer = document.querySelector<HTMLElement>("#debugCharacterViewer");
const hero: HeroState = createDefaultHero();
let state: CombatState = createCombatStateFromHero(hero);
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;
let enemyTimerStatus: EnemyTimerStatus = "idle";
let turnProbe: TurnProbeApi | undefined;
let lastActionClick = "none";

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

function startDebugApp(): void {
  document.body.classList.add("arena-active", "debug-active", "debug-mode-character");
  dom.mainMenu.hidden = true;
  dom.gameScreen.hidden = false;
  if (debugCharacterViewer) {
    mountDebugCharacterViewer(debugCharacterViewer);
  }
  mountDebugPanel(debugPanelHost ?? dom.gameScreen);
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  dom.gameScreen.addEventListener("arena-action-click", handleActionArcClick);
  turnProbe = mountTurnProbe(dom.gameScreen);
  subscribeDebugTuning(() => {
    actionArc?.sync(state);
    arenaScene?.sync(state);
    syncTurnProbe();
  });
  restart();

  window.requestAnimationFrame(() => {
    launchArena((scene) => {
      arenaScene = scene;
      arenaScene.sync(state);
      refreshArenaLayout();
    }, handleAction);
  });
}

dom.restartButton.addEventListener("click", restart);
dom.cityButton.addEventListener("click", restart);
startDebugApp();
