import { distanceLabel, getFighterMaxArmor, getFighterMaxHp, getFighterMaxStamina, type CombatState } from "./combat";

export interface DomRefs {
  mainMenu: HTMLElement;
  gameScreen: HTMLElement;
  startButton: HTMLButtonElement;
  log: HTMLElement;
  resultBanner: HTMLElement;
  restartButton: HTMLButtonElement;
  cityButton: HTMLButtonElement;
  distanceText: HTMLElement;
  playerHpFill: HTMLElement;
  playerArmorFill: HTMLElement;
  playerStaFill: HTMLElement;
  playerHpText: HTMLElement;
  playerArmorText: HTMLElement;
  playerStaText: HTMLElement;
  enemyHpFill: HTMLElement;
  enemyArmorFill: HTMLElement;
  enemyStaFill: HTMLElement;
  enemyHpText: HTMLElement;
  enemyArmorText: HTMLElement;
  enemyStaText: HTMLElement;
}

export function getDomRefs(): DomRefs {
  const refs = {
    mainMenu: document.querySelector<HTMLElement>("#mainMenu"),
    gameScreen: document.querySelector<HTMLElement>("#gameScreen"),
    startButton: document.querySelector<HTMLButtonElement>("#startButton"),
    log: document.querySelector<HTMLElement>("#log"),
    resultBanner: document.querySelector<HTMLElement>("#resultBanner"),
    restartButton: document.querySelector<HTMLButtonElement>("#restartButton"),
    cityButton: document.querySelector<HTMLButtonElement>("#cityButton"),
    distanceText: document.querySelector<HTMLElement>("#distanceText"),
    playerHpFill: document.querySelector<HTMLElement>("#playerHpFill"),
    playerArmorFill: document.querySelector<HTMLElement>("#playerArmorFill"),
    playerStaFill: document.querySelector<HTMLElement>("#playerStaFill"),
    playerHpText: document.querySelector<HTMLElement>("#playerHpText"),
    playerArmorText: document.querySelector<HTMLElement>("#playerArmorText"),
    playerStaText: document.querySelector<HTMLElement>("#playerStaText"),
    enemyHpFill: document.querySelector<HTMLElement>("#enemyHpFill"),
    enemyArmorFill: document.querySelector<HTMLElement>("#enemyArmorFill"),
    enemyStaFill: document.querySelector<HTMLElement>("#enemyStaFill"),
    enemyHpText: document.querySelector<HTMLElement>("#enemyHpText"),
    enemyArmorText: document.querySelector<HTMLElement>("#enemyArmorText"),
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
  dom.distanceText.textContent = distanceLabel(state.distance);
  renderStats(dom, state);
  renderLog(dom, state);
  renderResult(dom, state);
}

function renderStats(dom: DomRefs, state: CombatState): void {
  const playerMaxHp = getFighterMaxHp(state.player);
  const playerMaxArmor = getFighterMaxArmor(state.player);
  const playerMaxStamina = getFighterMaxStamina(state.player);
  const enemyMaxHp = getFighterMaxHp(state.enemy);
  const enemyMaxArmor = getFighterMaxArmor(state.enemy);
  const enemyMaxStamina = getFighterMaxStamina(state.enemy);

  dom.playerHpText.textContent = `${state.player.hp}/${playerMaxHp}`;
  dom.playerArmorText.textContent = `${state.player.armor}/${playerMaxArmor}`;
  dom.playerStaText.textContent = `${state.player.stamina}/${playerMaxStamina}`;
  dom.enemyHpText.textContent = `${state.enemy.hp}/${enemyMaxHp}`;
  dom.enemyArmorText.textContent = `${state.enemy.armor}/${enemyMaxArmor}`;
  dom.enemyStaText.textContent = `${state.enemy.stamina}/${enemyMaxStamina}`;

  setFlaskFill(dom.playerHpFill, state.player.hp / playerMaxHp);
  setFlaskFill(dom.playerArmorFill, playerMaxArmor > 0 ? state.player.armor / playerMaxArmor : 0);
  setFlaskFill(dom.playerStaFill, state.player.stamina / playerMaxStamina);
  setFlaskFill(dom.enemyHpFill, state.enemy.hp / enemyMaxHp);
  setFlaskFill(dom.enemyArmorFill, enemyMaxArmor > 0 ? state.enemy.armor / enemyMaxArmor : 0);
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

function resultBannerText(state: CombatState): string {
  if (state.result === "win") {
    return `${state.player.name} wins!`;
  }

  if (state.result === "lose") {
    return `${state.enemy.name} wins!`;
  }

  return "The arena shrugs. Draw!";
}
