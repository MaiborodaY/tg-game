import {
  distanceBand,
  distanceLabel,
  getFighterClinchRange,
  getFighterMaxArmor,
  getFighterMaxHp,
  getFighterMaxStamina,
  type CombatState,
  type DistanceBand,
} from "./combat";
import { getShopProductIconUrl } from "./shopItemIcons";
import { HERO_ITEM_CATALOG, HERO_MAX_LEVEL, getHeroXpToNextLevel, type ArenaLootDrop, type BattleReward, type HeroState } from "./hero";

export interface DomRefs {
  mainMenu: HTMLElement;
  gameScreen: HTMLElement;
  startButton: HTMLButtonElement;
  log: HTMLElement;
  resultBanner: HTMLElement;
  resultEyebrow: HTMLElement;
  resultTitle: HTMLElement;
  resultGoldReward: HTMLElement;
  resultXpReward: HTMLElement;
  resultLoot: HTMLElement;
  resultXpProgress: HTMLElement;
  resultXpProgressText: HTMLElement;
  resultXpProgressFill: HTMLElement;
  restartButton: HTMLButtonElement;
  cityButton: HTMLButtonElement;
  distanceText: HTMLElement;
  classicDistanceBadge: HTMLElement;
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
    resultEyebrow: document.querySelector<HTMLElement>("#resultEyebrow"),
    resultTitle: document.querySelector<HTMLElement>("#resultTitle"),
    resultGoldReward: document.querySelector<HTMLElement>("#resultGoldReward"),
    resultXpReward: document.querySelector<HTMLElement>("#resultXpReward"),
    resultLoot: document.querySelector<HTMLElement>("#resultLoot"),
    resultXpProgress: document.querySelector<HTMLElement>("#resultXpProgress"),
    resultXpProgressText: document.querySelector<HTMLElement>("#resultXpProgressText"),
    resultXpProgressFill: document.querySelector<HTMLElement>("#resultXpProgressFill"),
    restartButton: document.querySelector<HTMLButtonElement>("#restartButton"),
    cityButton: document.querySelector<HTMLButtonElement>("#cityButton"),
    distanceText: document.querySelector<HTMLElement>("#distanceText"),
    classicDistanceBadge: document.querySelector<HTMLElement>(".classic-distance-badge"),
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

export interface BattleResultPresentation {
  id: string;
  reward: BattleReward;
  loot?: readonly ArenaLootDrop[];
  heroBeforeReward?: HeroState;
  heroAfterReward?: HeroState;
}

export interface BattleResultReturnState {
  ready: boolean;
  label?: string;
}

export interface DomRenderContext {
  hero?: HeroState;
  reward?: BattleReward;
  resultPresentation?: BattleResultPresentation;
  resultReturn?: BattleResultReturnState;
}

export function renderDom(dom: DomRefs, state: CombatState, context: DomRenderContext = {}): void {
  const playerClinchRange = getFighterClinchRange(state.player);
  const distance = distanceLabel(state.distance, playerClinchRange);
  const band = distanceBand(state.distance, playerClinchRange);

  setText(dom.distanceText, distance);
  setText(dom.classicDistanceText, distance);
  syncClassicDistanceBadge(dom.classicDistanceBadge, band);
  renderStats(dom, state);
  renderLog(dom, state);
  renderResult(dom, state, context);
}

const CLASSIC_DISTANCE_BADGE_BANDS: DistanceBand[] = ["clinch", "melee", "near", "far", "very-far"];

function syncClassicDistanceBadge(element: HTMLElement, band: DistanceBand): void {
  if (element.dataset.distanceBand === band) {
    return;
  }

  element.dataset.distanceBand = band;

  CLASSIC_DISTANCE_BADGE_BANDS.forEach((currentBand) => {
    element.classList.toggle(`classic-distance-badge--${currentBand}`, currentBand === band);
  });
}

function renderStats(dom: DomRefs, state: CombatState): void {
  const playerMaxHp = getFighterMaxHp(state.player);
  const playerMaxArmor = getFighterMaxArmor(state.player);
  const playerMaxStamina = getFighterMaxStamina(state.player);
  const enemyMaxHp = getFighterMaxHp(state.enemy);
  const enemyMaxArmor = getFighterMaxArmor(state.enemy);
  const enemyMaxStamina = getFighterMaxStamina(state.enemy);

  const playerHpText = `${state.player.hp}/${playerMaxHp}`;
  const playerArmorText = `${state.player.armor}/${playerMaxArmor}`;
  const playerStaminaText = `${state.player.stamina}/${playerMaxStamina}`;
  const enemyHpText = `${state.enemy.hp}/${enemyMaxHp}`;
  const enemyArmorText = `${state.enemy.armor}/${enemyMaxArmor}`;
  const enemyStaminaText = `${state.enemy.stamina}/${enemyMaxStamina}`;

  setText(dom.classicPlayerName, state.player.name);
  setText(dom.classicEnemyName, state.enemy.name);
  setText(dom.playerHpText, playerHpText);
  setText(dom.playerArmorText, playerArmorText);
  setText(dom.playerStaText, playerStaminaText);
  setText(dom.classicPlayerHpText, playerHpText);
  setText(dom.classicPlayerArmorText, playerArmorText);
  setText(dom.classicPlayerStaText, playerStaminaText);
  setText(dom.enemyHpText, enemyHpText);
  setText(dom.enemyArmorText, enemyArmorText);
  setText(dom.enemyStaText, enemyStaminaText);
  setText(dom.classicEnemyHpText, enemyHpText);
  setText(dom.classicEnemyArmorText, enemyArmorText);
  setText(dom.classicEnemyStaText, enemyStaminaText);

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
  setStyleTransform(element, `scaleY(${safeRatio})`);
}

function setBarFill(element: HTMLElement, ratio: number): void {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  setStyleTransform(element, `scaleX(${safeRatio})`);
}

function setText(element: HTMLElement, value: string): void {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function setStyleTransform(element: HTMLElement, value: string): void {
  if (element.style.transform !== value) {
    element.style.transform = value;
  }
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

function renderResult(dom: DomRefs, state: CombatState, context: DomRenderContext): void {
  dom.gameScreen.classList.toggle("battle-screen--finished", state.result !== "playing");

  if (state.result === "playing") {
    cancelResultAnimations();
    syncResultReturnButton(dom.cityButton);
    dom.resultBanner.hidden = true;
    dom.cityButton.hidden = true;
    dom.resultBanner.classList.remove("battle-result--animating");
    delete dom.resultBanner.dataset.resultAnimationKey;
    return;
  }

  dom.resultBanner.hidden = false;
  dom.cityButton.hidden = false;
  syncResultReturnButton(dom.cityButton, context.resultReturn);
  syncResultVariant(dom.resultBanner, state.result);
  dom.resultEyebrow.textContent = resultEyebrowText(state);
  dom.resultTitle.textContent = resultBannerText(state);

  const presentation = context.resultPresentation;
  const reward = presentation?.reward ?? context.reward ?? { gold: 0, xp: 0 };
  const loot = presentation?.loot ?? [];
  const finalHero = presentation?.heroAfterReward ?? context.hero;
  const animationKey =
    presentation?.id ?? `static:${state.result}:${reward.gold}:${reward.xp}:${loot.map((drop) => `${drop.itemId}:${drop.quantity}`).join("|")}:${finalHero?.level ?? 0}:${finalHero?.xp ?? 0}`;

  if (dom.resultBanner.dataset.resultAnimationKey === animationKey) {
    return;
  }

  dom.resultBanner.dataset.resultAnimationKey = animationKey;

  if (presentation) {
    animateResultPresentation(dom, presentation);
    return;
  }

  cancelResultAnimations();
  dom.resultBanner.classList.remove("battle-result--animating");
  renderRewardAmount(dom.resultGoldReward, reward.gold);
  renderRewardAmount(dom.resultXpReward, reward.xp);
  renderResultLoot(dom.resultLoot, loot);
  renderResultXpProgress(dom, finalHero);
}

const RESULT_RETURN_READY_LABEL = "Return to City";

function syncResultReturnButton(button: HTMLButtonElement, state?: BattleResultReturnState): void {
  const ready = state?.ready ?? true;

  button.disabled = !ready;
  button.textContent = state?.label ?? RESULT_RETURN_READY_LABEL;
  button.classList.toggle("battle-result__button--waiting", !ready);
  button.setAttribute("aria-busy", ready ? "false" : "true");
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

function resultEyebrowText(state: CombatState): string {
  if (state.result === "win") {
    return "Victory";
  }

  if (state.result === "lose") {
    return "Defeat";
  }

  return "Draw";
}

function syncResultVariant(element: HTMLElement, result: CombatState["result"]): void {
  element.classList.toggle("battle-result--win", result === "win");
  element.classList.toggle("battle-result--lose", result === "lose");
  element.classList.toggle("battle-result--draw", result === "draw");
}

function renderResultXpProgress(dom: DomRefs, hero: HeroState | undefined): void {
  if (!hero) {
    dom.resultXpProgress.hidden = true;
    dom.resultXpProgressFill.style.width = "0%";
    dom.resultXpProgressText.textContent = "";
    return;
  }

  dom.resultXpProgress.hidden = false;

  if (hero.level >= HERO_MAX_LEVEL) {
    dom.resultXpProgressFill.style.width = "100%";
    dom.resultXpProgressText.textContent = `LVL ${hero.level} MAX`;
    return;
  }

  const xpToNextLevel = Math.max(1, hero.xpToNextLevel);
  const progressRatio = Math.max(0, Math.min(1, hero.xp / xpToNextLevel));

  dom.resultXpProgressFill.style.width = `${progressRatio * 100}%`;
  dom.resultXpProgressText.textContent = `LVL ${hero.level} ${hero.xp} / ${xpToNextLevel} XP`;
}

function animateResultPresentation(dom: DomRefs, presentation: BattleResultPresentation): void {
  cancelResultAnimations();

  dom.resultBanner.classList.remove("battle-result--animating");
  void dom.resultBanner.offsetWidth;
  dom.resultBanner.classList.add("battle-result--animating");
  renderRewardAmount(dom.resultGoldReward, 0);
  renderRewardAmount(dom.resultXpReward, 0);
  renderResultLoot(dom.resultLoot, presentation.loot ?? []);
  renderResultXpProgress(dom, presentation.heroBeforeReward ?? presentation.heroAfterReward);

  animateResultNumber(dom.resultGoldReward, 0, presentation.reward.gold, 720, 1160);
  animateResultNumber(dom.resultXpReward, 0, presentation.reward.xp, 760, 1300);
  scheduleResultAnimation(1480, () => animateResultXpProgress(dom, presentation));
}

function renderResultLoot(element: HTMLElement, loot: readonly ArenaLootDrop[]): void {
  element.replaceChildren();

  if (loot.length === 0) {
    element.hidden = true;
    return;
  }

  element.hidden = false;

  loot.forEach((drop) => {
    const itemIds = drop.itemIds && drop.itemIds.length > 0 ? drop.itemIds : [drop.itemId];
    const item = HERO_ITEM_CATALOG[drop.itemId];
    const row = document.createElement("div");
    const icon = document.createElement("span");
    const label = document.createElement("strong");
    const quantity = Math.max(1, drop.quantity);

    row.className = "battle-result__loot-item";
    icon.className = "battle-result__loot-icon";
    label.textContent = item ? `Dropped ${item.name}${quantity > 1 ? ` x${quantity}` : ""}` : `Dropped ${drop.itemId}${quantity > 1 ? ` x${quantity}` : ""}`;

    const iconUrl = getShopProductIconUrl(itemIds);

    if (iconUrl) {
      icon.style.backgroundImage = `url("${iconUrl}")`;
    } else {
      icon.textContent = "?";
    }

    row.append(icon, label);
    element.append(row);
  });
}

function animateResultNumber(element: HTMLElement, fromValue: number, toValue: number, durationMs: number, delayMs: number): void {
  animateValue({
    fromValue,
    toValue,
    durationMs,
    delayMs,
    onUpdate: (value) => renderRewardAmount(element, Math.round(value)),
    onComplete: () => renderRewardAmount(element, toValue),
  });
}

function animateResultXpProgress(dom: DomRefs, presentation: BattleResultPresentation): void {
  const heroAfterReward = presentation.heroAfterReward;

  if (!heroAfterReward) {
    renderResultXpProgress(dom, undefined);
    return;
  }

  const stages = createXpAnimationStages(presentation.heroBeforeReward, heroAfterReward);

  animateXpStage(dom, stages, 0, heroAfterReward);
}

interface XpAnimationStage {
  level: number;
  fromXp: number;
  toXp: number;
  xpToNextLevel: number;
}

function createXpAnimationStages(heroBeforeReward: HeroState | undefined, heroAfterReward: HeroState): XpAnimationStage[] {
  if (!heroBeforeReward) {
    return [
      {
        level: heroAfterReward.level,
        fromXp: 0,
        toXp: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : heroAfterReward.xp,
        xpToNextLevel: heroAfterReward.level >= HERO_MAX_LEVEL ? 1 : Math.max(1, heroAfterReward.xpToNextLevel),
      },
    ];
  }

  if (heroBeforeReward.level >= HERO_MAX_LEVEL && heroAfterReward.level >= HERO_MAX_LEVEL) {
    return [{ level: HERO_MAX_LEVEL, fromXp: 1, toXp: 1, xpToNextLevel: 1 }];
  }

  const stages: XpAnimationStage[] = [];
  let level = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(heroBeforeReward.level)));
  let fromXp = Math.max(0, Math.floor(heroBeforeReward.xp));
  let xpToNextLevel = Math.max(1, Math.floor(heroBeforeReward.xpToNextLevel));

  while (level < heroAfterReward.level && level < HERO_MAX_LEVEL) {
    stages.push({
      level,
      fromXp,
      toXp: xpToNextLevel,
      xpToNextLevel,
    });
    level += 1;
    fromXp = 0;
    xpToNextLevel = Math.max(1, getHeroXpToNextLevel(level));
  }

  if (heroAfterReward.level >= HERO_MAX_LEVEL) {
    stages.push({ level: HERO_MAX_LEVEL, fromXp: 1, toXp: 1, xpToNextLevel: 1 });
    return stages;
  }

  stages.push({
    level: heroAfterReward.level,
    fromXp: level === heroBeforeReward.level ? fromXp : 0,
    toXp: Math.max(0, Math.floor(heroAfterReward.xp)),
    xpToNextLevel: Math.max(1, Math.floor(heroAfterReward.xpToNextLevel)),
  });

  return stages;
}

function animateXpStage(dom: DomRefs, stages: readonly XpAnimationStage[], stageIndex: number, finalHero: HeroState): void {
  const stage = stages[stageIndex];

  if (!stage) {
    renderResultXpProgress(dom, finalHero);
    return;
  }

  animateValue({
    fromValue: stage.fromXp,
    toValue: stage.toXp,
    durationMs: 680,
    delayMs: stageIndex === 0 ? 0 : 120,
    onUpdate: (value) => renderXpStage(dom, stage, value),
    onComplete: () => {
      renderXpStage(dom, stage, stage.toXp);
      animateXpStage(dom, stages, stageIndex + 1, finalHero);
    },
  });
}

function renderXpStage(dom: DomRefs, stage: XpAnimationStage, xpValue: number): void {
  if (stage.level >= HERO_MAX_LEVEL) {
    dom.resultXpProgressFill.style.width = "100%";
    dom.resultXpProgressText.textContent = `LVL ${HERO_MAX_LEVEL} MAX`;
    return;
  }

  const xp = Math.max(0, Math.min(stage.xpToNextLevel, Math.round(xpValue)));
  const progressRatio = Math.max(0, Math.min(1, xpValue / stage.xpToNextLevel));

  dom.resultXpProgressFill.style.width = `${progressRatio * 100}%`;
  dom.resultXpProgressText.textContent = `LVL ${stage.level} ${xp} / ${stage.xpToNextLevel} XP`;
}

interface ValueAnimationOptions {
  fromValue: number;
  toValue: number;
  durationMs: number;
  delayMs: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

const activeResultAnimationTimers: number[] = [];
const activeResultAnimationFrames: number[] = [];

function animateValue(options: ValueAnimationOptions): void {
  const start = () => {
    const startedAt = window.performance.now();
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / options.durationMs));
      const easedProgress = easeOutCubic(progress);
      const value = options.fromValue + (options.toValue - options.fromValue) * easedProgress;

      options.onUpdate(value);

      if (progress >= 1) {
        options.onComplete?.();
        return;
      }

      activeResultAnimationFrames.push(window.requestAnimationFrame(tick));
    };

    activeResultAnimationFrames.push(window.requestAnimationFrame(tick));
  };

  scheduleResultAnimation(options.delayMs, start);
}

function scheduleResultAnimation(delayMs: number, callback: () => void): void {
  activeResultAnimationTimers.push(window.setTimeout(callback, delayMs));
}

function cancelResultAnimations(): void {
  while (activeResultAnimationTimers.length > 0) {
    const timer = activeResultAnimationTimers.pop();

    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  }

  while (activeResultAnimationFrames.length > 0) {
    const frame = activeResultAnimationFrames.pop();

    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
    }
  }
}

function renderRewardAmount(element: HTMLElement, value: number): void {
  element.textContent = value > 0 ? `+${value}` : String(value);
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
