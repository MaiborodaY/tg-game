import { distanceLabel, getFighterMaxHp, getFighterMaxStamina, type CombatState, type Result } from "./combat";

export interface DomRefs {
  mainMenu: HTMLElement;
  gameScreen: HTMLElement;
  startButton: HTMLButtonElement;
  score: HTMLElement;
  statusText: HTMLElement;
  log: HTMLElement;
  resultBanner: HTMLElement;
  restartButton: HTMLButtonElement;
  cityButton: HTMLButtonElement;
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
    cityButton: document.querySelector<HTMLButtonElement>("#cityButton"),
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
  dom.statusText.textContent = state.result === "playing" ? "Fight to the finish" : resultStatusText(state.result);
  dom.turnBadge.textContent = state.result === "playing" ? (state.activeTurn === "player" ? "Your turn" : `${state.enemy.name} turn`) : resultStatusText(state.result);
  dom.distanceText.textContent = distanceLabel(state.distance);
  renderStats(dom, state);
  renderLog(dom, state);
  renderResult(dom, state);
}

function renderStats(dom: DomRefs, state: CombatState): void {
  const playerMaxHp = getFighterMaxHp(state.player);
  const playerMaxStamina = getFighterMaxStamina(state.player);
  const enemyMaxHp = getFighterMaxHp(state.enemy);
  const enemyMaxStamina = getFighterMaxStamina(state.enemy);

  dom.playerHpText.textContent = `${state.player.hp}/${playerMaxHp}`;
  dom.playerStaText.textContent = `${state.player.stamina}/${playerMaxStamina}`;
  dom.enemyHpText.textContent = `${state.enemy.hp}/${enemyMaxHp}`;
  dom.enemyStaText.textContent = `${state.enemy.stamina}/${enemyMaxStamina}`;

  setFlaskFill(dom.playerHpFill, state.player.hp / playerMaxHp);
  setFlaskFill(dom.playerStaFill, state.player.stamina / playerMaxStamina);
  setFlaskFill(dom.enemyHpFill, state.enemy.hp / enemyMaxHp);
  setFlaskFill(dom.enemyStaFill, state.enemy.stamina / enemyMaxStamina);
}

function setFlaskFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  element.style.width = "100%";
  element.style.height = `${safeRatio * 100}%`;
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
    dom.cityButton.hidden = true;
    return;
  }

  dom.resultBanner.hidden = false;
  dom.resultBanner.textContent = resultBannerText(state);
  dom.cityButton.hidden = false;
}

function resultStatusText(result: Result): string {
  if (result === "win") {
    return "Victory";
  }

  if (result === "lose") {
    return "Defeat";
  }

  if (result === "draw") {
    return "Draw";
  }

  return "Fight to the finish";
}

function resultBannerText(state: CombatState): string {
  if (state.result === "win") {
    return `${state.player.name} wins!`;
  }

  if (state.result === "lose") {
    return `${state.enemy.name} wins!`;
  }

  return "The arena shrugs. Draw!";
}
