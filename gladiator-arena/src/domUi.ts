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
  classicDistanceText: HTMLElement;
  classicPlayerName: HTMLElement;
  classicEnemyName: HTMLElement;
  playerHpFill: HTMLElement;
  playerArmorFill: HTMLElement;
  playerStaFill: HTMLElement;
  playerHpText: HTMLElement;
  playerArmorText: HTMLElement;
  playerStaText: HTMLElement;
  classicPlayerHpFill: HTMLElement;
  classicPlayerArmorFill: HTMLElement;
  classicPlayerStaFill: HTMLElement;
  classicPlayerHpText: HTMLElement;
  classicPlayerArmorText: HTMLElement;
  classicPlayerStaText: HTMLElement;
  enemyHpFill: HTMLElement;
  enemyArmorFill: HTMLElement;
  enemyStaFill: HTMLElement;
  enemyHpText: HTMLElement;
  enemyArmorText: HTMLElement;
  enemyStaText: HTMLElement;
  classicEnemyHpFill: HTMLElement;
  classicEnemyArmorFill: HTMLElement;
  classicEnemyStaFill: HTMLElement;
  classicEnemyHpText: HTMLElement;
  classicEnemyArmorText: HTMLElement;
  classicEnemyStaText: HTMLElement;
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
    classicDistanceText: document.querySelector<HTMLElement>("#classicDistanceText"),
    classicPlayerName: document.querySelector<HTMLElement>("#classicPlayerName"),
    classicEnemyName: document.querySelector<HTMLElement>("#classicEnemyName"),
    playerHpFill: document.querySelector<HTMLElement>("#playerHpFill"),
    playerArmorFill: document.querySelector<HTMLElement>("#playerArmorFill"),
    playerStaFill: document.querySelector<HTMLElement>("#playerStaFill"),
    playerHpText: document.querySelector<HTMLElement>("#playerHpText"),
    playerArmorText: document.querySelector<HTMLElement>("#playerArmorText"),
    playerStaText: document.querySelector<HTMLElement>("#playerStaText"),
    classicPlayerHpFill: document.querySelector<HTMLElement>("#classicPlayerHpFill"),
    classicPlayerArmorFill: document.querySelector<HTMLElement>("#classicPlayerArmorFill"),
    classicPlayerStaFill: document.querySelector<HTMLElement>("#classicPlayerStaFill"),
    classicPlayerHpText: document.querySelector<HTMLElement>("#classicPlayerHpText"),
    classicPlayerArmorText: document.querySelector<HTMLElement>("#classicPlayerArmorText"),
    classicPlayerStaText: document.querySelector<HTMLElement>("#classicPlayerStaText"),
    enemyHpFill: document.querySelector<HTMLElement>("#enemyHpFill"),
    enemyArmorFill: document.querySelector<HTMLElement>("#enemyArmorFill"),
    enemyStaFill: document.querySelector<HTMLElement>("#enemyStaFill"),
    enemyHpText: document.querySelector<HTMLElement>("#enemyHpText"),
    enemyArmorText: document.querySelector<HTMLElement>("#enemyArmorText"),
    enemyStaText: document.querySelector<HTMLElement>("#enemyStaText"),
    classicEnemyHpFill: document.querySelector<HTMLElement>("#classicEnemyHpFill"),
    classicEnemyArmorFill: document.querySelector<HTMLElement>("#classicEnemyArmorFill"),
    classicEnemyStaFill: document.querySelector<HTMLElement>("#classicEnemyStaFill"),
    classicEnemyHpText: document.querySelector<HTMLElement>("#classicEnemyHpText"),
    classicEnemyArmorText: document.querySelector<HTMLElement>("#classicEnemyArmorText"),
    classicEnemyStaText: document.querySelector<HTMLElement>("#classicEnemyStaText"),
  };

  for (const [key, value] of Object.entries(refs)) {
    if (!value) {
      throw new Error(`Missing DOM element: ${key}`);
    }
  }

  return refs as DomRefs;
}

export function renderDom(dom: DomRefs, state: CombatState): void {
  const distance = distanceLabel(state.distance);

  dom.distanceText.textContent = distance;
  dom.classicDistanceText.textContent = distance;
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

  dom.classicPlayerName.textContent = state.player.name;
  dom.classicEnemyName.textContent = state.enemy.name;
  dom.playerHpText.textContent = `${state.player.hp}/${playerMaxHp}`;
  dom.playerArmorText.textContent = `${state.player.armor}/${playerMaxArmor}`;
  dom.playerStaText.textContent = `${state.player.stamina}/${playerMaxStamina}`;
  dom.classicPlayerHpText.textContent = `${state.player.hp}/${playerMaxHp}`;
  dom.classicPlayerArmorText.textContent = `${state.player.armor}/${playerMaxArmor}`;
  dom.classicPlayerStaText.textContent = `${state.player.stamina}/${playerMaxStamina}`;
  dom.enemyHpText.textContent = `${state.enemy.hp}/${enemyMaxHp}`;
  dom.enemyArmorText.textContent = `${state.enemy.armor}/${enemyMaxArmor}`;
  dom.enemyStaText.textContent = `${state.enemy.stamina}/${enemyMaxStamina}`;
  dom.classicEnemyHpText.textContent = `${state.enemy.hp}/${enemyMaxHp}`;
  dom.classicEnemyArmorText.textContent = `${state.enemy.armor}/${enemyMaxArmor}`;
  dom.classicEnemyStaText.textContent = `${state.enemy.stamina}/${enemyMaxStamina}`;

  setFlaskFill(dom.playerHpFill, state.player.hp / playerMaxHp);
  setFlaskFill(dom.playerArmorFill, playerMaxArmor > 0 ? state.player.armor / playerMaxArmor : 0);
  setFlaskFill(dom.playerStaFill, state.player.stamina / playerMaxStamina);
  setFlaskFill(dom.enemyHpFill, state.enemy.hp / enemyMaxHp);
  setFlaskFill(dom.enemyArmorFill, enemyMaxArmor > 0 ? state.enemy.armor / enemyMaxArmor : 0);
  setFlaskFill(dom.enemyStaFill, state.enemy.stamina / enemyMaxStamina);
  setBarFill(dom.classicPlayerHpFill, state.player.hp / playerMaxHp);
  setBarFill(dom.classicPlayerArmorFill, playerMaxArmor > 0 ? state.player.armor / playerMaxArmor : 0);
  setBarFill(dom.classicPlayerStaFill, state.player.stamina / playerMaxStamina);
  setBarFill(dom.classicEnemyHpFill, state.enemy.hp / enemyMaxHp);
  setBarFill(dom.classicEnemyArmorFill, enemyMaxArmor > 0 ? state.enemy.armor / enemyMaxArmor : 0);
  setBarFill(dom.classicEnemyStaFill, state.enemy.stamina / enemyMaxStamina);
}

function setFlaskFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  element.style.width = "100%";
  element.style.height = `${safeRatio * 100}%`;
}

function setBarFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  element.style.width = `${safeRatio * 100}%`;
  element.style.height = "100%";
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
