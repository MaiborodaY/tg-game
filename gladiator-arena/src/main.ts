import { launchArena, type ArenaScene } from "./ArenaScene";
import { freshState, resolveEnemyTurn, resolvePlayerTurn, type ActionId, type CombatState } from "./combat";
import { getDomRefs, renderDom } from "./domUi";
import "./styles.css";

const dom = getDomRefs();
let state: CombatState = freshState();
let arenaScene: ArenaScene | undefined;
let enemyTurnTimer: number | undefined;

function commitState(nextState: CombatState): void {
  state = nextState;
  renderDom(dom, state, handleAction);
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

function restart(): void {
  if (enemyTurnTimer) {
    window.clearTimeout(enemyTurnTimer);
    enemyTurnTimer = undefined;
  }

  commitState(freshState());
}

dom.restartButton.addEventListener("click", restart);
renderDom(dom, state, handleAction);
launchArena((scene) => {
  arenaScene = scene;
  arenaScene.sync(state);
});
