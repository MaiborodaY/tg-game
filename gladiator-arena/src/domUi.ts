import {
  actionOrder,
  actions,
  canUseAction,
  distanceLabel,
  MAX_HP,
  MAX_STAMINA,
  ROUND_LIMIT,
  type ActionId,
  type CombatState,
  type Result,
} from "./combat";

export interface DomRefs {
  score: HTMLElement;
  statusText: HTMLElement;
  actions: HTMLElement;
  log: HTMLElement;
  resultBanner: HTMLElement;
  restartButton: HTMLButtonElement;
  turnBadge: HTMLElement;
  distanceText: HTMLElement;
  playerHpFill: HTMLElement;
  playerStaFill: HTMLElement;
  playerHpText: HTMLElement;
  playerStaText: HTMLElement;
  enemyHpFill: HTMLElement;
  enemyStaFill: HTMLElement;
  enemyHpText: HTMLElement;
  enemyStaText: HTMLElement;
}

const actionShortLabels: Record<ActionId, string> = {
  forward: "FWD",
  back: "BACK",
  lunge: "LUNGE",
  light: "SLASH",
  heavy: "BONK",
  block: "BLOCK",
  taunt: "TAUNT",
  rest: "REST",
};

const actionButtons = new Map<ActionId, HTMLButtonElement>();

export function getDomRefs(): DomRefs {
  const refs = {
    score: document.querySelector<HTMLElement>("#score"),
    statusText: document.querySelector<HTMLElement>("#statusText"),
    actions: document.querySelector<HTMLElement>("#actions"),
    log: document.querySelector<HTMLElement>("#log"),
    resultBanner: document.querySelector<HTMLElement>("#resultBanner"),
    restartButton: document.querySelector<HTMLButtonElement>("#restartButton"),
    turnBadge: document.querySelector<HTMLElement>("#turnBadge"),
    distanceText: document.querySelector<HTMLElement>("#distanceText"),
    playerHpFill: document.querySelector<HTMLElement>("#playerHpFill"),
    playerStaFill: document.querySelector<HTMLElement>("#playerStaFill"),
    playerHpText: document.querySelector<HTMLElement>("#playerHpText"),
    playerStaText: document.querySelector<HTMLElement>("#playerStaText"),
    enemyHpFill: document.querySelector<HTMLElement>("#enemyHpFill"),
    enemyStaFill: document.querySelector<HTMLElement>("#enemyStaFill"),
    enemyHpText: document.querySelector<HTMLElement>("#enemyHpText"),
    enemyStaText: document.querySelector<HTMLElement>("#enemyStaText"),
  };

  for (const [key, value] of Object.entries(refs)) {
    if (!value) {
      throw new Error(`Missing DOM element: ${key}`);
    }
  }

  return refs as DomRefs;
}

export function renderDom(dom: DomRefs, state: CombatState, onAction: (actionId: ActionId) => void): void {
  dom.score.textContent = `${state.score}`;
  dom.statusText.textContent =
    state.result === "playing" ? `Round ${state.round} of ${ROUND_LIMIT}` : resultStatusText(state.result, state.round);
  dom.turnBadge.textContent = state.result === "playing" ? (state.activeTurn === "player" ? "Your turn" : "Grumbus turn") : resultStatusText(state.result, state.round);
  dom.distanceText.textContent = distanceLabel(state.distance);
  renderStats(dom, state);

  renderActionButtons(dom, state, onAction);

  dom.log.innerHTML = "";

  for (const entry of state.log) {
    const item = document.createElement("div");
    item.className = entry.important ? "log-entry important" : "log-entry";
    item.textContent = entry.text;
    dom.log.append(item);
    break;
  }

  if (state.result === "playing") {
    dom.resultBanner.hidden = true;
    dom.resultBanner.textContent = "";
  } else {
    dom.resultBanner.hidden = false;
    dom.resultBanner.textContent = resultBannerText(state.result);
  }
}

function renderActionButtons(dom: DomRefs, state: CombatState, onAction: (actionId: ActionId) => void): void {
  if (dom.actions.childElementCount !== actionOrder.length) {
    actionButtons.clear();
    dom.actions.replaceChildren();

    for (const id of actionOrder) {
      const action = actions[id];
      const button = document.createElement("button");
      button.className = "move";
      button.type = "button";
      button.title = `${action.title}: ${action.detail}`;
      button.dataset.action = id;
      button.innerHTML = `<strong>${actionShortLabels[id]}</strong><span>${action.title}</span>`;
      button.addEventListener("click", () => {
        button.blur();
        onAction(id);
      });
      actionButtons.set(id, button);
      dom.actions.append(button);
    }
  }

  for (const id of actionOrder) {
    const button = actionButtons.get(id);

    if (button) {
      button.disabled = !canUseAction(state, id, "player");
    }
  }
}

function renderStats(dom: DomRefs, state: CombatState): void {
  dom.playerHpText.textContent = `HP ${state.player.hp}/${MAX_HP}`;
  dom.playerStaText.textContent = `STA ${state.player.stamina}/${MAX_STAMINA}`;
  dom.enemyHpText.textContent = `HP ${state.enemy.hp}/${MAX_HP}`;
  dom.enemyStaText.textContent = `STA ${state.enemy.stamina}/${MAX_STAMINA}`;

  dom.playerHpFill.style.width = `${(state.player.hp / MAX_HP) * 100}%`;
  dom.playerStaFill.style.width = `${(state.player.stamina / MAX_STAMINA) * 100}%`;
  dom.enemyHpFill.style.width = `${(state.enemy.hp / MAX_HP) * 100}%`;
  dom.enemyStaFill.style.width = `${(state.enemy.stamina / MAX_STAMINA) * 100}%`;
}

function resultStatusText(result: Result, round: number): string {
  if (result === "win") {
    return "Victory";
  }

  if (result === "lose") {
    return "Defeat";
  }

  if (result === "draw") {
    return "Draw";
  }

  return `Round ${round} of ${ROUND_LIMIT}`;
}

function resultBannerText(result: Result): string {
  if (result === "win") {
    return "Borshemir wins!";
  }

  if (result === "lose") {
    return "Grumbus wins!";
  }

  return "The arena shrugs. Draw!";
}
