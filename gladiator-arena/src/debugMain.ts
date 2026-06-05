import { mountActionArc, type ActionArcApi } from "./actionArc";
import { launchArena, type ArenaScene } from "./ArenaScene";
import { freshState, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { mountDebugPanel } from "./debugPanel";
import { debugTuning, subscribeDebugTuning } from "./debugTuning";
import { getDomRefs, renderDom } from "./domUi";
import "./styles.css";

const dom = getDomRefs();
const debugPanelHost = document.querySelector<HTMLElement>("#debugPanelHost");
let state: CombatState = freshState();
let arenaScene: ArenaScene | undefined;
let actionArc: ActionArcApi | undefined;
let enemyTurnTimer: number | undefined;

function commitState(nextState: CombatState): void {
  state = nextState;
  renderDom(dom, state);
  actionArc?.sync(state);
  arenaScene?.sync(state);
}

function handleAction(actionId: ActionId): void {
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

function restart(): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  commitState(freshState());
}

function startDebugApp(): void {
  document.body.classList.add("arena-active", "debug-active");
  dom.mainMenu.hidden = true;
  dom.gameScreen.hidden = false;
  mountDebugPanel(debugPanelHost ?? dom.gameScreen);
  actionArc = mountActionArc(dom.gameScreen, handleAction, () => debugTuning);
  subscribeDebugTuning(() => actionArc?.sync(state));
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
startDebugApp();