import { distanceLabel, MAX_HP, MAX_STAMINA, ROUND_LIMIT, type CombatState, type Result } from "./combat";

export interface DomRefs {
  mainMenu: HTMLElement;
  gameScreen: HTMLElement;
  startButton: HTMLButtonElement;
  score: HTMLElement;
  statusText: HTMLElement;
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

export function getDomRefs(): DomRefs {
  const refs = {
    mainMenu: document.querySelector<HTMLElement>("#mainMenu"),
    gameScreen: document.querySelector<HTMLElement>("#gameScreen"),
    startButton: document.querySelector<HTMLButtonElement>("#startButton"),
    score: document.querySelector<HTMLElement>("#score"),
    statusText: document.querySelector<HTMLElement>("#statusText"),
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

export function renderDom(dom: DomRefs, state: CombatState): void {
  dom.score.textContent = `${state.score}`;
  dom.statusText.textContent =
    state.result === "playing" ? `Round ${state.round} / ${ROUND_LIMIT}` : resultStatusText(state.result, state.round);
  dom.turnBadge.textContent = state.result === "playing" ? (state.activeTurn === "player" ? "Your turn" : "Grumbus turn") : resultStatusText(state.result, state.round);
  dom.distanceText.textContent = distanceLabel(state.distance);
  renderStats(dom, state);
  renderLog(dom, state);
  renderResult(dom, state);
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

function renderLog(dom: DomRefs, state: CombatState): void {
  dom.log.innerHTML = "";

  for (const entry of state.log) {
    const item = document.createElement("div");
    item.className = entry.important ? "log-entry important" : "log-entry";
    item.textContent = entry.text;
    dom.log.append(item);
    break;
  }
}

function renderResult(dom: DomRefs, state: CombatState): void {
  if (state.result === "playing") {
    dom.resultBanner.hidden = true;
    dom.resultBanner.textContent = "";
    return;
  }

  dom.resultBanner.hidden = false;
  dom.resultBanner.textContent = resultBannerText(state.result);
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