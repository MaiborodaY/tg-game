import "./styles.css";
import eiraPortraitUrl from "./assets/heroes/eira-portrait.webp";
import grakPortraitUrl from "./assets/heroes/grak-portrait.webp";
import torenPortraitUrl from "./assets/heroes/toren-portrait.webp";
import { ENEMY_DEFINITIONS, ENEMY_PREVIEW_ORDER, FINAL_WAVE, TOWER_DEFINITIONS } from "./game/config.ts";
import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  CONTENT_CATALOG,
} from "./game/content.ts";
import {
  clearCampaign,
  getCampaignSaveKey,
  LEGACY_SAVE_KEY,
  loadCampaign,
  migrateLegacyCampaign,
  saveCampaign,
  type StorageLike,
} from "./game/save.ts";
import {
  readSessionSelection,
  resolveSessionSelection,
  resolveServerSessionSelection,
  writeSessionSelection,
} from "./game/sessionSelection.ts";
import type { PlayerProfileSnapshot } from "./game/profile.ts";
import { isHeroUnlocked } from "./game/heroAvailability.ts";
import { createLazyRuntimeController } from "./game/lazyRuntime.ts";
import { getHeroAura, getHeroUpgradeCost, getHeroUpgradeWaveGate, isHeroId } from "./game/heroes.ts";
import { createCampaignState } from "./game/state.ts";
import { MAX_RATING_SCORE } from "./game/scoring.ts";
import { getSelectedTowerDetails } from "./game/towerDetails.ts";
import type { EnemyType, HeroId, TowerType } from "./game/types.ts";
import {
  detectLocale,
  normalizeLocale,
  readStoredLocale,
  tr,
  writeStoredLocale,
  type Locale,
  type TranslationKey,
} from "./i18n.ts";
import { loadPendingResult, removePendingResult, savePendingResult } from "./pendingResult.ts";
import {
  captureFinalResult,
  captureFinishSubmission,
  clearMiniAppReward,
  createRewardFinisher,
  decideRewardLaunch,
  loadMiniAppBootstrap,
  parseLaunchParams,
  replaceMiniAppBootstrap,
  saveMiniAppBootstrap,
  startMiniAppReward,
  type FinalResult,
  type MiniAppBootstrap,
  type RewardFinisher,
  type RewardLaunch,
} from "./reward.ts";
import type {
  NoticeCode,
  TerminalOutcome,
  TowerDefenseCallbacks,
  TowerDefenseScene,
  TowerDefenseUiState,
} from "./rendering/TowerDefenseScene.ts";
import { setupTelegramBridge } from "./telegram.ts";
import { TOWER_GUIDE_ENTRIES } from "./towerGuide.ts";

void bootstrap();

async function bootstrap(): Promise<void> {
const legacyLaunch = parseLaunchParams(window.location.href);
const storage = safeStorage("localStorage");
const session = safeStorage("sessionStorage");
const developmentGrakPreview = import.meta.env.DEV
  && new URL(window.location.href).searchParams.get("preview_hero") === "grak";
const telegram = setupTelegramBridge();
let locale = readStoredLocale(storage) ?? detectLocale(legacyLaunch.payload?.lang, legacyLaunch.payload?.language);
const pendingStartButton = document.getElementById("intro-start");
if (pendingStartButton instanceof HTMLButtonElement) pendingStartButton.disabled = true;

const launchDecision = decideRewardLaunch(legacyLaunch, telegram.initData);
const isMiniAppLaunch = launchDecision.kind === "miniapp";
let launch = legacyLaunch;
let miniAppBootstrap: MiniAppBootstrap | null = null;
let launchError: "invalid_launch" | "miniapp_start_failed" | null = legacyLaunch.rewardError;
if (launchDecision.kind === "miniapp") {
  const cachedBootstrap = loadMiniAppBootstrap(session);
  if (cachedBootstrap) {
    miniAppBootstrap = cachedBootstrap;
    launch = Object.freeze({ ...legacyLaunch, reward: cachedBootstrap.reward, rewardError: null });
    launchError = null;
  } else {
    const started = await startMiniAppReward(launchDecision.initData);
    if (started.ok) {
      miniAppBootstrap = started.bootstrap;
      saveMiniAppBootstrap(session, started.bootstrap);
      launch = Object.freeze({ ...legacyLaunch, reward: started.reward, rewardError: null });
      launchError = null;
    } else {
      launchError = "miniapp_start_failed";
    }
  }
} else if (launchDecision.kind === "error") {
  launchError = launchDecision.error;
}

const rewardUsedKey = launch.reward.runId ? "td-reward-used-v1:" + launch.reward.runId : null;
const rewardAlreadyUsed = rewardUsedKey ? readFlag(storage, rewardUsedKey) : false;
if (isMiniAppLaunch && rewardAlreadyUsed) clearMiniAppReward(session);
let reward: RewardLaunch = rewardAlreadyUsed
  ? Object.freeze({ mode: "local", runId: null, token: null, runNumber: null, finishUrl: null })
  : launch.reward;
let selectedSession = miniAppBootstrap && reward.mode === "server"
  ? resolveServerSessionSelection(miniAppBootstrap.binding)
  : reward.mode === "server"
    // Legacy signed URL launches predate server content bindings and stay on the classic campaign.
    ? resolveSessionSelection("server", null)
    : readSessionSelection(storage, "local");
let saveKey = getCampaignSaveKey(
  reward.mode === "server" ? reward.runId : null,
  selectedSession.level.id,
  selectedSession.mode.id,
);
const savedCampaign = loadCampaign(storage, saveKey, selectedSession.selection);
const canMigrateLegacy = selectedSession.level.id === CLASSIC_CAMPAIGN_LEVEL_ID
  && selectedSession.mode.id === CAMPAIGN_MODE_ID;
const migrated = !savedCampaign && canMigrateLegacy
  ? migrateLegacyCampaign(storage, reward.mode === "server" ? reward.runId : null)
  : null;
// A profile controls new hero selection, but an already-started run must remain
// resumable if the bootstrap profile is temporarily unavailable during reload.
const restoredCheckpoint = savedCampaign || migrated;
const pendingAtLaunch = reward.mode === "server" && reward.runId
  ? loadPendingResult(storage, reward.runId, MAX_RATING_SCORE, FINAL_WAVE)
  : null;
let initialCampaign = pendingAtLaunch
  ? createCampaignState({ level: selectedSession.level, mode: selectedSession.mode })
  : restoredCheckpoint || createCampaignState({ level: selectedSession.level, mode: selectedSession.mode });

let latestUi: TowerDefenseUiState | null = null;
let rewardFinisher: RewardFinisher | null = null;
let finishSettled = reward.mode === "local";
let terminalResult: FinalResult | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let renderedPreviewWave = -1;
let resumeAfterGuide = false;
let guideReturnFocus: HTMLElement | null = null;
let resumeAfterMenu = false;
let menuReturnFocus: HTMLElement | null = null;
let introReturnsToRun = false;
let sessionSwitching = false;
let localSaveWarningShown = false;
let finishAuthRefreshAttempted = false;
let finishRunReplaced = false;
let replacementBootstrapCached = false;
let gameStarting = false;
let gameMounted = false;
let runtimeLoadFailed = false;
let reloadRequested = false;
let playerProfile: PlayerProfileSnapshot | null = miniAppBootstrap?.profile ?? null;
let selectedHeroId: HeroId = initialCampaign.hero.id;
let runStarted = Boolean(restoredCheckpoint);

const HERO_PORTRAIT_URLS: Readonly<Record<HeroId, string>> = Object.freeze({
  eira: eiraPortraitUrl,
  toren: torenPortraitUrl,
  grak: grakPortraitUrl,
});

const elements = {
  appShell: byId("app"),
  appTitle: byId("app-title"),
  appSubtitle: byId("app-subtitle"),
  hudRegion: byId("hud-region"),
  livesLabel: byId("lives-label"),
  livesValue: byId("lives-value"),
  goldLabel: byId("gold-label"),
  goldValue: byId("gold-value"),
  waveLabel: byId("wave-label"),
  waveValue: byId("wave-value"),
  waveProgress: byId("wave-progress"),
  gameMenuButton: button("game-menu-button"),
  speedButton: button("speed-button"),
  pulseButton: button("pulse-button"),
  pulseLabel: byId("pulse-label"),
  phaseBadge: byId("phase-badge"),
  bossHud: byId("boss-hud"),
  bossIcon: byId("boss-icon"),
  bossName: byId("boss-name"),
  bossState: byId("boss-state"),
  bossHealthFill: byId("boss-health-fill"),
  bossShieldFill: byId("boss-shield-fill"),
  countdown: byId("countdown"),
  buildPanel: byId("build-panel"),
  towerPanel: byId("tower-panel"),
  heroPanel: byId("hero-panel"),
  buildEyebrow: byId("build-eyebrow"),
  buildHint: byId("build-hint"),
  practiceBadge: byId("practice-badge"),
  fullscreenButton: button("fullscreen-button"),
  towerGuideButton: button("tower-guide-button"),
  towerGuideOverlay: byId("tower-guide-overlay"),
  towerGuideClose: button("tower-guide-close"),
  towerGuideEyebrow: byId("tower-guide-eyebrow"),
  towerGuideTitle: byId("tower-guide-title"),
  towerGuideIntro: byId("tower-guide-intro"),
  towerGuideGrid: byId("tower-guide-grid"),
  towerGuideCombo: byId("tower-guide-combo"),
  towerGuideDone: button("tower-guide-done"),
  rangerName: byId("ranger-name"),
  frostName: byId("frost-name"),
  emberName: byId("ember-name"),
  stormName: byId("storm-name"),
  selectedEmblem: byId("selected-emblem"),
  selectedLevel: byId("selected-level"),
  selectedName: byId("selected-name"),
  selectedStats: byId("selected-stats"),
  upgradeButton: button("upgrade-button"),
  sellButton: button("sell-button"),
  closeTowerPanel: button("close-tower-panel"),
  selectedHeroEmblem: byId("selected-hero-emblem"),
  selectedHeroRank: byId("selected-hero-rank"),
  selectedHeroName: byId("selected-hero-name"),
  selectedHeroRole: byId("selected-hero-role"),
  selectedHeroHint: byId("selected-hero-hint"),
  heroUpgradeButton: button("hero-upgrade-button"),
  heroDetailsButton: button("hero-details-button"),
  closeHeroPanel: button("close-hero-panel"),
  nextWaveLabel: byId("next-wave-label"),
  waveEnemies: byId("wave-enemies"),
  threatMeter: byId("threat-meter"),
  startWaveButton: button("start-wave-button"),
  introOverlay: byId("intro-overlay"),
  introCard: document.querySelector<HTMLElement>(".intro-card")!,
  introTitle: byId("intro-title"),
  introBody: byId("intro-body"),
  introStart: button("intro-start"),
  sessionPicker: byId("session-picker"),
  levelChoiceLabel: byId("level-choice-label"),
  levelSelect: select("level-select"),
  modeChoiceLabel: byId("mode-choice-label"),
  modeSelect: select("mode-select"),
  sessionChoiceHint: byId("session-choice-hint"),
  heroChoiceButton: button("hero-choice-button"),
  heroChoiceEmblem: byId("hero-choice-emblem"),
  heroChoiceLabel: byId("hero-choice-label"),
  heroChoiceName: byId("hero-choice-name"),
  heroChoiceRole: byId("hero-choice-role"),
  heroChoiceLock: byId("hero-choice-lock"),
  heroPicker: byId("hero-picker"),
  heroPickerEyebrow: byId("hero-picker-eyebrow"),
  heroPickerTitle: byId("hero-picker-title"),
  heroPickerHint: byId("hero-picker-hint"),
  heroPickerClose: button("hero-picker-close"),
  heroPickerDone: button("hero-picker-done"),
  heroPickerDetails: byId("hero-picker-details"),
  heroEiraName: byId("hero-eira-name"),
  heroEiraRole: byId("hero-eira-role"),
  heroEiraAbility: byId("hero-eira-ability"),
  heroTorenName: byId("hero-toren-name"),
  heroTorenRole: byId("hero-toren-role"),
  heroTorenAbility: byId("hero-toren-ability"),
  heroGrakName: byId("hero-grak-name"),
  heroGrakRole: byId("hero-grak-role"),
  heroGrakAbility: byId("hero-grak-ability"),
  heroGrakUnlock: byId("hero-grak-unlock"),
  introWaves: byId("intro-waves"),
  introTowers: byId("intro-towers"),
  introBosses: byId("intro-bosses"),
  gameMenuOverlay: byId("game-menu-overlay"),
  gameMenuTitle: byId("game-menu-title"),
  gameMenuEyebrow: byId("game-menu-eyebrow"),
  gameMenuClose: button("game-menu-close"),
  gameMenuContinue: button("game-menu-continue"),
  gameMenuHeroDetails: byId("game-menu-hero-details"),
  gameMenuSpeedLabel: byId("game-menu-speed-label"),
  gameMenuSpeedButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-menu-speed]")],
  gameMenuTowerGuideLabel: byId("game-menu-tower-guide-label"),
  gameMenuFullscreenLabel: byId("game-menu-fullscreen-label"),
  gameMenuSession: button("game-menu-session"),
  gameMenuSessionLabel: byId("game-menu-session-label"),
  gameMenuRestart: button("game-menu-restart"),
  gameMenuRestartLabel: byId("game-menu-restart-label"),
  gameMenuExit: button("game-menu-exit"),
  gameMenuExitLabel: byId("game-menu-exit-label"),
  gameMenuRestartConfirm: byId("game-menu-restart-confirm"),
  gameMenuRestartConfirmTitle: byId("game-menu-restart-confirm-title"),
  gameMenuRestartConfirmCopy: byId("game-menu-restart-confirm-copy"),
  gameMenuRestartCancel: button("game-menu-restart-cancel"),
  gameMenuRestartAccept: button("game-menu-restart-accept"),
  resultOverlay: byId("result-overlay"),
  resultCard: document.querySelector<HTMLElement>(".result-card")!,
  resultSigil: byId("result-sigil"),
  resultEyebrow: byId("result-eyebrow"),
  resultTitle: byId("result-title"),
  resultScore: byId("result-score"),
  rewardStatus: byId("reward-status"),
  rewardRetry: button("reward-retry"),
  restartButton: button("restart-button"),
  closeHint: byId("close-hint"),
  toast: byId("toast"),
  gameRoot: byId("game-root"),
  towerCards: [...document.querySelectorAll<HTMLButtonElement>("[data-tower]")],
  heroOptions: [...document.querySelectorAll<HTMLButtonElement>("[data-hero-choice]")],
  languageSelects: [...document.querySelectorAll<HTMLSelectElement>('[data-role="language"]')],
  languageLabels: [...document.querySelectorAll<HTMLElement>("[data-language-label]")],
};

elements.appShell.inert = true;
applyPlayerProfile(playerProfile);
applyStaticTranslations();
applyLaunchErrorTranslations();
telegram.setClosingConfirmation(reward.mode === "server" && !finishSettled);

const gameCallbacks: TowerDefenseCallbacks = {
  onUiChange: (ui) => {
    latestUi = ui;
    renderUi(ui);
  },
  onPersist: (campaign) => {
    if (!saveCampaign(storage, saveKey, campaign) && !localSaveWarningShown) {
      localSaveWarningShown = true;
      showToast(text("local_save_unavailable"), true);
    }
  },
  onNotice: showNotice,
  onWaveClear: (_wave, bonus, repairedLives) => {
    showToast(`${text("wave_clear")} · ${text("clear_bonus", { amount: bonus })}`);
    if (repairedLives > 0) window.setTimeout(() => showToast(`♥ +${repairedLives} · ${text("boss_repair")}`), 750);
  },
  onTerminal: handleTerminal,
  onHaptic: telegram.haptic,
};

type TowerDefenseRuntime = typeof import("./rendering/TowerDefenseScene.ts");
type GameMountContext = Readonly<{
  parent: HTMLElement;
  campaign: TowerDefenseUiState["campaign"];
  callbacks: TowerDefenseCallbacks;
}>;

const runtimeController = createLazyRuntimeController(
  () => import("./rendering/TowerDefenseScene.ts"),
  (runtime: TowerDefenseRuntime, context: GameMountContext) => runtime.createTowerDefenseGame(
    context.parent,
    context.campaign,
    context.callbacks,
  ),
);

bindInteractions();
const pendingFinishRestored = restorePendingFinish();
showRestoredRunStatus();
if (!pendingFinishRestored) {
  if (elements.introOverlay.hidden) {
    await mountRestoredGame();
  } else {
    elements.introStart.focus();
  }
}

function bindInteractions(): void {
  elements.languageSelects.forEach((select) => {
    select.addEventListener("change", () => setLocale(select.value));
  });
  elements.towerCards.forEach((card) => {
    card.addEventListener("click", () => currentScene()?.setBuildType(card.dataset.tower as TowerType));
  });
  elements.startWaveButton.addEventListener("click", () => currentScene()?.startWave());
  elements.speedButton.addEventListener("click", () => currentScene()?.toggleSpeed());
  elements.gameMenuButton.addEventListener("click", toggleGameMenu);
  elements.gameMenuClose.addEventListener("click", () => closeGameMenu(true));
  elements.gameMenuContinue.addEventListener("click", () => closeGameMenu(true));
  elements.gameMenuOverlay.addEventListener("click", (event) => {
    if (event.target === elements.gameMenuOverlay) closeGameMenu(true);
  });
  elements.gameMenuSpeedButtons.forEach((control) => {
    control.addEventListener("click", () => setGameSpeed(control.dataset.menuSpeed));
  });
  elements.pulseButton.addEventListener("click", () => currentScene()?.useHeroAbility());
  elements.upgradeButton.addEventListener("click", () => currentScene()?.upgradeSelectedTower());
  elements.sellButton.addEventListener("click", () => currentScene()?.sellSelectedTower());
  elements.closeTowerPanel.addEventListener("click", () => currentScene()?.clearSelection());
  elements.heroUpgradeButton.addEventListener("click", () => currentScene()?.upgradeHero());
  elements.heroDetailsButton.addEventListener("click", () => openGameMenu(true));
  elements.closeHeroPanel.addEventListener("click", () => currentScene()?.clearSelection());
  elements.fullscreenButton.addEventListener("click", () => {
    if (telegram.isFullscreen) telegram.exitFullscreen();
    else telegram.requestFullscreen();
  });
  elements.gameMenuSession.addEventListener("click", () => {
    closeGameMenu(false, false);
    openSessionMenu();
  });
  elements.gameMenuRestart.addEventListener("click", showRestartConfirmation);
  elements.gameMenuRestartCancel.addEventListener("click", hideRestartConfirmation);
  elements.gameMenuRestartAccept.addEventListener("click", restartGame);
  elements.gameMenuExit.addEventListener("click", () => {
    if (!telegram.close()) closeGameMenu(true);
  });
  telegram.onFullscreenChange(syncFullscreenUi);
  elements.towerGuideButton.addEventListener("click", () => openTowerGuideFromMenu());
  elements.towerGuideClose.addEventListener("click", closeTowerGuide);
  elements.towerGuideDone.addEventListener("click", closeTowerGuide);
  elements.towerGuideOverlay.addEventListener("click", (event) => {
    if (event.target === elements.towerGuideOverlay) closeTowerGuide();
  });
  elements.levelSelect.addEventListener("change", () => void switchPracticeSession(
    elements.levelSelect.value,
    elements.modeSelect.value,
  ));
  elements.modeSelect.addEventListener("change", () => void switchPracticeSession(
    elements.levelSelect.value,
    elements.modeSelect.value,
  ));
  elements.heroChoiceButton.addEventListener("click", openHeroPicker);
  elements.heroPickerClose.addEventListener("click", () => closeHeroPicker(true));
  elements.heroPickerDone.addEventListener("click", () => closeHeroPicker(true));
  elements.heroOptions.forEach((option) => {
    option.addEventListener("click", () => chooseHero(option.dataset.heroChoice as HeroId));
  });
  elements.introStart.addEventListener("click", () => {
    if (launchError === "miniapp_start_failed" || runtimeLoadFailed) reloadPage();
    else void startGameFromIntro();
  });
  elements.rewardRetry.addEventListener("click", () => {
    if (finishRunReplaced) return;
    finishAuthRefreshAttempted = false;
    void finishReward();
  });
  elements.restartButton.addEventListener("click", restartGame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && latestUi && (latestUi.phase === "wave" || latestUi.phase === "countdown")) {
      currentScene()?.setPaused(true);
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (reward.mode === "server" && !finishSettled && !reloadRequested) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.towerGuideOverlay.hidden) closeTowerGuide();
    else if (!elements.gameMenuRestartConfirm.hidden) hideRestartConfirmation();
    else if (!elements.gameMenuOverlay.hidden) closeGameMenu(true);
    else if (!elements.heroPicker.hidden) closeHeroPicker(true);
  });
}

function currentScene(): TowerDefenseScene | null {
  return runtimeController.getMounted()?.scene ?? null;
}

async function ensureGameMounted(): Promise<boolean> {
  try {
    await runtimeController.ensureMounted({
      parent: elements.gameRoot,
      campaign: initialCampaign,
      callbacks: gameCallbacks,
    });
    gameMounted = true;
    syncHeroChoiceControls();
    return true;
  } catch {
    return false;
  }
}

async function startGameFromIntro(): Promise<void> {
  if (gameStarting || sessionSwitching || launchError) return;
  closeHeroPicker(false);
  gameStarting = true;
  runtimeLoadFailed = false;
  syncIntroAction();
  syncSessionControls();
  const ready = await ensureGameMounted();
  gameStarting = false;
  if (!ready) {
    showRuntimeLoadFailure();
    return;
  }
  runStarted = true;
  const startedCampaign = currentScene()?.getCampaign() ?? initialCampaign;
  if (!saveCampaign(storage, saveKey, startedCampaign) && !localSaveWarningShown) {
    localSaveWarningShown = true;
    showToast(text("local_save_unavailable"), true);
  }
  syncIntroAction();
  syncSessionControls();
  dismissIntro();
}

async function mountRestoredGame(): Promise<void> {
  introReturnsToRun = hasRunProgress(initialCampaign);
  elements.introOverlay.hidden = false;
  gameStarting = true;
  runtimeLoadFailed = false;
  syncIntroAction();
  syncSessionControls();
  const ready = await ensureGameMounted();
  gameStarting = false;
  if (!ready) {
    showRuntimeLoadFailure();
    return;
  }
  runtimeLoadFailed = false;
  elements.introOverlay.hidden = true;
  elements.appShell.inert = false;
  introReturnsToRun = false;
  syncIntroAction();
  syncSessionControls();
}

function showRuntimeLoadFailure(): void {
  gameStarting = false;
  runtimeLoadFailed = true;
  introReturnsToRun = hasRunProgress(initialCampaign);
  elements.appShell.inert = true;
  elements.introOverlay.hidden = false;
  applyLaunchErrorTranslations();
  syncSessionControls();
  elements.introStart.focus();
  showToast(text("game_load_failed"), true);
}

function renderUi(ui: TowerDefenseUiState): void {
  elements.livesValue.textContent = String(ui.campaign.lives);
  elements.goldValue.textContent = String(ui.campaign.gold);
  elements.waveValue.textContent = `${ui.currentWave} / ${ui.finalWave ?? "∞"}`;
  elements.waveProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, ui.waveProgress))})`;
  const combatPhase = ui.phase === "wave" || ui.phase === "countdown";
  elements.gameMenuButton.textContent = combatPhase ? (ui.paused ? "▶" : "Ⅱ") : "☰";
  elements.gameMenuButton.classList.toggle("is-active", ui.paused);
  elements.gameMenuButton.disabled = ui.phase === "gameover" || ui.phase === "victory";
  elements.speedButton.textContent = `×${ui.speed}`;
  elements.speedButton.classList.toggle("is-active", ui.speed === 2);
  elements.phaseBadge.textContent = `${phaseLabel(ui)} · ${text("act", { count: ui.act })}`;
  elements.countdown.hidden = ui.phase !== "countdown" || ui.paused;
  elements.countdown.textContent = String(Math.max(1, ui.countdown));
  const heroAbility = heroAbilityName(ui.hero.id);
  elements.pulseLabel.textContent = heroAbility;
  elements.pulseButton.disabled = ui.phase !== "wave" || !ui.heroAbilityAvailable || ui.enemiesAlive === 0 || ui.paused;
  elements.pulseButton.classList.toggle("is-used", !ui.heroAbilityAvailable);
  elements.pulseButton.classList.toggle("is-eira", ui.hero.id === "eira");
  elements.pulseButton.classList.toggle("is-toren", ui.hero.id === "toren");
  elements.pulseButton.classList.toggle("is-grak", ui.hero.id === "grak");
  elements.pulseButton.setAttribute("aria-label", text(
    ui.heroAbilityAvailable ? "hero_ability_ready" : "hero_ability_used",
    { ability: heroAbility },
  ));
  elements.bossHud.hidden = !ui.boss;
  if (ui.boss) {
    elements.bossIcon.textContent = ui.boss.type === "titan" ? "♜" : "♛";
    elements.bossName.textContent = ui.boss.type === "titan"
      ? text("enemy_titan")
      : text(`boss_act_${ui.boss.tier}` as TranslationKey);
    elements.bossState.textContent = text(ui.boss.enraged ? "boss_enraged" : "boss_state");
    elements.bossHealthFill.style.width = `${Math.round(ui.boss.hpRatio * 100)}%`;
    elements.bossShieldFill.style.width = `${Math.round(ui.boss.shieldRatio * 100)}%`;
    elements.bossShieldFill.parentElement?.toggleAttribute("hidden", ui.boss.shieldRatio <= 0);
  }

  const editing = ui.phase === "setup" && !ui.paused;
  elements.towerCards.forEach((card) => {
    const type = card.dataset.tower as TowerType;
    const selected = ui.selectedBuildType === type;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
    card.disabled = !editing || ui.campaign.gold < TOWER_DEFINITIONS[type].buildCost;
  });

  const selected = getSelectedTowerDetails(ui);
  const heroSelected = ui.selectedHero && !selected;
  elements.buildPanel.hidden = Boolean(selected) || heroSelected;
  elements.towerPanel.hidden = !selected;
  elements.heroPanel.hidden = !heroSelected;
  if (selected) {
    elements.selectedEmblem.className = `tower-emblem ${selected.tower.type}`;
    elements.selectedEmblem.innerHTML = "<i></i>";
    elements.selectedLevel.textContent = `${text("level")} ${selected.tower.level}`;
    elements.selectedName.textContent = towerName(selected.tower.type);
    elements.selectedStats.textContent = `${text("damage")} ${selected.stats.damage} · ${text("range")} ${Math.round(selected.stats.range)}`;
    elements.upgradeButton.textContent = selected.masteryLocked
      ? text("mastery_locked")
      : selected.upgradeCost === null
      ? text("max_level")
      : `${text("upgrade")} · ${selected.upgradeCost} ●`;
    elements.upgradeButton.disabled = !editing || selected.masteryLocked || selected.upgradeCost === null || ui.campaign.gold < selected.upgradeCost;
    elements.sellButton.textContent = `${text("sell")} · ${selected.sellValue} ●`;
    elements.sellButton.disabled = !editing;
  }
  if (heroSelected) {
    const hero = ui.hero;
    const upgradeCost = getHeroUpgradeCost(hero.id, hero.level);
    const upgradeWave = getHeroUpgradeWaveGate(hero.level);
    const upgradeUnlocked = upgradeWave === null || ui.campaign.completedWave >= upgradeWave;
    syncHeroPortrait(elements.selectedHeroEmblem, hero.id);
    elements.selectedHeroRank.textContent = text("hero_rank", { count: hero.level });
    elements.selectedHeroName.textContent = heroName(hero.id);
    elements.selectedHeroRole.textContent = heroRole(hero.id);
    syncHeroAuraStatus(ui);
    elements.heroDetailsButton.setAttribute("aria-label", text("game_menu_hero_details"));
    elements.heroUpgradeButton.textContent = upgradeCost === null
      ? text("hero_max_rank")
      : !upgradeUnlocked && upgradeWave !== null
        ? text("hero_upgrade_wave", { wave: upgradeWave })
        : `${text("upgrade")} · ${upgradeCost} ●`;
    elements.heroUpgradeButton.disabled = !editing
      || upgradeCost === null
      || !upgradeUnlocked
      || ui.campaign.gold < upgradeCost;
  }

  selectedHeroId = ui.hero.id;
  syncHeroChoiceControls();

  const plan = ui.nextWavePlan;
  if (renderedPreviewWave !== plan.wave) {
    renderWavePreview(plan.wave, plan.spawns.map((spawn) => spawn.type));
    renderedPreviewWave = plan.wave;
  }
  elements.threatMeter.textContent = `${"◆".repeat(plan.threat)}${"◇".repeat(5 - plan.threat)}`;
  elements.threatMeter.setAttribute("aria-label", text("threat", { count: plan.threat }));
  elements.startWaveButton.disabled = !editing || (ui.finalWave !== null && ui.campaign.completedWave >= ui.finalWave);
  elements.startWaveButton.classList.toggle("is-boss", plan.hasBoss);
  elements.startWaveButton.textContent = plan.hasBoss ? text("boss_wave") : text("start_wave");
  elements.practiceBadge.hidden = reward.mode === "server";
  syncGameMenuUi(ui);
}

function syncHeroAuraStatus(ui: TowerDefenseUiState): void {
  const aura = getHeroAura(ui.hero.id, ui.hero.level);
  if (!aura) {
    elements.selectedHeroHint.dataset.aura = "locked";
    elements.selectedHeroHint.textContent = text("hero_aura_unlock");
    elements.selectedHeroHint.title = elements.selectedHeroHint.textContent;
    return;
  }

  elements.selectedHeroHint.dataset.aura = aura.kind;
  if (aura.kind === "slow") {
    elements.selectedHeroHint.textContent = text("hero_toren_aura_status", {
      slow: Math.round(aura.strength * 100),
    });
  } else {
    const level = CONTENT_CATALOG.levels[ui.levelId];
    const radiusSquared = aura.radius ** 2;
    const count = ui.campaign.towers.reduce((total, tower) => {
      const point = level?.buildPads[tower.padId];
      if (!point) return total;
      const dx = point.x - ui.hero.x;
      const dy = point.y - ui.hero.y;
      return dx * dx + dy * dy <= radiusSquared ? total + 1 : total;
    }, 0);
    elements.selectedHeroHint.textContent = text(aura.kind === "tower_attack_speed"
      ? "hero_grak_aura_status"
      : "hero_eira_aura_status", {
      count,
      bonus: Math.round(aura.strength * 100),
    });
  }
  elements.selectedHeroHint.title = elements.selectedHeroHint.textContent;
}

function renderWavePreview(_wave: number, types: readonly EnemyType[]): void {
  const counts = new Map<EnemyType, number>();
  for (const type of types) counts.set(type, (counts.get(type) || 0) + 1);
  elements.waveEnemies.replaceChildren(...ENEMY_PREVIEW_ORDER.flatMap((type) => {
    const count = counts.get(type);
    if (!count) return [];
    const chip = document.createElement("span");
    chip.className = "enemy-chip";
    chip.title = enemyName(type);
    chip.setAttribute("aria-label", `${enemyName(type)}: ${count}`);
    const glyph = document.createElement("i");
    glyph.className = `enemy-glyph ${type}`;
    glyph.setAttribute("aria-hidden", "true");
    chip.append(glyph, document.createTextNode(`${count}`));
    return [chip];
  }));
}

function phaseLabel(ui: TowerDefenseUiState): string {
  if (ui.paused) return text("paused");
  if (ui.phase === "setup") return text("preparing");
  if (ui.phase === "countdown") return text("preparing");
  if (ui.phase === "wave") return text("fighting");
  return text(ui.phase === "victory" ? "victory" : "game_over");
}

function showNotice(code: NoticeCode): void {
  if (code === "pulse_used") {
    const ability = heroAbilityName(latestUi?.hero.id ?? selectedHeroId);
    showToast(text("hero_ability_used", { ability }), true);
    return;
  }
  if (code === "hero_ability_unavailable") {
    showToast(text("hero_ability_no_target"), true);
    return;
  }
  const key: TranslationKey = code === "insufficient_gold"
    ? "insufficient_gold"
    : code === "max_level"
      ? "max_level"
      : code === "hero_max_level"
        ? "hero_max_rank"
        : code === "hero_upgrade_locked"
          ? "hero_upgrade_locked"
      : code === "mastery_locked"
        ? "mastery_locked"
        : code === "build_locked"
          ? "build_locked"
          : code === "invalid_hero_anchor"
            ? "select_hero_anchor"
          : "select_pad";
  showToast(text(key), true);
}

function showToast(message: string, isError = false): void {
  if (toastTimer) clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), isError ? 5_200 : 2_800);
}

function handleTerminal(outcome: TerminalOutcome, campaign: TowerDefenseUiState["campaign"]): void {
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  const completedWaves = finalWave === null ? campaign.completedWave : Math.min(finalWave, campaign.completedWave);
  const score = selectedSession.mode.calculateScore(completedWaves);
  const result = captureFinalResult(score, campaign.activeDurationMs);
  terminalResult = result;
  const pendingSaved = reward.mode === "server" && savePendingResult(storage, reward.runId, outcome, result, completedWaves);
  if (reward.mode === "local" || pendingSaved) clearCampaign(storage, saveKey);
  showResult(outcome, result, completedWaves, finalWave);
  finishAuthRefreshAttempted = false;
  finishRunReplaced = false;
  replacementBootstrapCached = false;
  rewardFinisher = createRewardFinisher(reward, captureFinishSubmission(
    result.score,
    result.durationMs,
    outcome === "victory" ? "victory" : "defeat",
    completedWaves,
  ));
  void finishReward();
}

async function finishReward(): Promise<void> {
  if (!rewardFinisher || !terminalResult) return;
  elements.rewardRetry.hidden = true;
  elements.restartButton.hidden = true;
  elements.rewardStatus.className = "reward-status";
  elements.rewardStatus.textContent = text("reward_saving");
  elements.closeHint.textContent = text(reward.mode === "server" ? "finish_pending_hint" : "close_hint");
  const result = await rewardFinisher.finish();
  if (result.mode === "local") {
    finishSettled = true;
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text("practice");
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    return;
  }
  if (!result.ok && result.error === "http_403") {
    if (await refreshFinishAuthorization()) {
      await finishReward();
      return;
    }
    if (finishRunReplaced) {
      finishSettled = true;
      removePendingResult(storage, reward.runId);
      elements.rewardStatus.textContent = text("run_replaced");
      elements.restartButton.hidden = false;
      elements.closeHint.textContent = text("close_hint");
      telegram.setClosingConfirmation(false);
      return;
    }
  }
  if (result.ok) {
    finishSettled = true;
    if (result.profile) applyPlayerProfile(result.profile);
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text(
      result.profileSync === "pending"
        ? "profile_sync_pending"
        : result.duplicate
          ? "reward_duplicate"
          : "reward_saved",
    );
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    if (result.profileSync === "pending") {
      elements.rewardRetry.textContent = text("profile_sync_retry");
      elements.rewardRetry.hidden = false;
      return;
    }
    if (rewardUsedKey) writeFlag(storage, rewardUsedKey);
    if (isMiniAppLaunch) clearMiniAppReward(session);
    clearCampaign(storage, saveKey);
    removePendingResult(storage, reward.runId);
    return;
  }
  if (finishSettled) {
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text("profile_sync_retry_failed");
    elements.rewardRetry.textContent = text("profile_sync_retry");
    elements.rewardRetry.hidden = false;
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    return;
  }
  elements.rewardStatus.classList.add("is-error");
  elements.rewardStatus.textContent = text("reward_failed");
  elements.rewardRetry.hidden = false;
  elements.closeHint.textContent = text("finish_failed_hint");
  telegram.setClosingConfirmation(true);
}

async function refreshFinishAuthorization(): Promise<boolean> {
  if (
    finishAuthRefreshAttempted
    || launchDecision.kind !== "miniapp"
    || reward.mode !== "server"
    || !rewardFinisher
  ) return false;
  finishAuthRefreshAttempted = true;
  const currentRunId = reward.runId;
  const refreshed = await startMiniAppReward(launchDecision.initData, { resumeRunId: currentRunId });
  if (!refreshed.ok) return false;
  const bootstrapCached = replaceMiniAppBootstrap(session, refreshed.bootstrap);
  if (refreshed.reward.runId !== currentRunId) {
    finishRunReplaced = true;
    replacementBootstrapCached = bootstrapCached;
    return false;
  }

  reward = refreshed.reward;
  miniAppBootstrap = refreshed.bootstrap;
  applyPlayerProfile(refreshed.bootstrap.profile);
  const previous = rewardFinisher;
  rewardFinisher = createRewardFinisher(reward, previous.finishMetadata
    ? captureFinishSubmission(
      previous.finalResult.score,
      previous.finalResult.durationMs,
      previous.finishMetadata.outcome,
      previous.finishMetadata.completedWaves,
    )
    : previous.finalResult);
  return true;
}

function showResult(
  outcome: TerminalOutcome,
  result: FinalResult,
  completedWaves: number,
  finalWave: number | null,
): void {
  elements.resultOverlay.hidden = false;
  elements.appShell.inert = true;
  elements.resultCard.classList.toggle("is-victory", outcome === "victory");
  elements.resultCard.classList.toggle("is-defeat", outcome === "gameover");
  elements.resultSigil.textContent = outcome === "victory" ? "✦" : "◆";
  elements.resultTitle.textContent = text(outcome === "victory" ? "victory" : "game_over");
  elements.resultScore.textContent = text(selectedSession.mode.resultSummaryKey, {
    waves: completedWaves,
    total: finalWave ?? "∞",
    score: result.score,
  });
  elements.rewardRetry.textContent = text("reward_retry");
  elements.restartButton.textContent = text("restart");
  elements.closeHint.textContent = text(reward.mode === "server" ? "finish_pending_hint" : "close_hint");
  elements.introOverlay.hidden = true;
}

function restorePendingFinish(): boolean {
  if (launchError) return false;
  if (reward.mode !== "server" || !reward.runId) {
    if (runStarted || hasRunProgress(initialCampaign)) elements.introOverlay.hidden = true;
    return false;
  }
  const pending = pendingAtLaunch || loadPendingResult(storage, reward.runId, MAX_RATING_SCORE, FINAL_WAVE);
  if (!pending) {
    if (runStarted || hasRunProgress(initialCampaign)) elements.introOverlay.hidden = true;
    return false;
  }
  terminalResult = captureFinalResult(pending.score, pending.durationMs);
  finishAuthRefreshAttempted = false;
  finishRunReplaced = false;
  replacementBootstrapCached = false;
  rewardFinisher = createRewardFinisher(reward, captureFinishSubmission(
    terminalResult.score,
    terminalResult.durationMs,
    pending.outcome === "victory" ? "victory" : "defeat",
    pending.waves,
  ));
  showResult(pending.outcome, terminalResult, pending.waves, FINAL_WAVE);
  void finishReward();
  return true;
}

function showRestoredRunStatus(): void {
  if (reward.mode !== "server" || pendingAtLaunch) return;
  if (restoredCheckpoint && hasRunProgress(restoredCheckpoint)) {
    const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
    const nextWave = finalWave === null
      ? restoredCheckpoint.completedWave + 1
      : Math.min(finalWave, restoredCheckpoint.completedWave + 1);
    showToast(text("run_resumed", { wave: nextWave }));
    return;
  }
  if (miniAppBootstrap?.resumed) showToast(text("run_resume_unavailable"), true);
}

function applyPlayerProfile(profile: PlayerProfileSnapshot | null): void {
  if (!profile) return;
  const grakWasUnlocked = isHeroAvailable("grak", playerProfile);
  playerProfile = profile;
  elements.appShell.dataset.profileRevision = String(playerProfile.revision);
  elements.appShell.dataset.unlockedLevels = String(playerProfile.unlockedLevelIds.length);
  syncHeroChoiceControls();
  if (!grakWasUnlocked && isHeroAvailable("grak", playerProfile)) {
    showToast(text("hero_grak_unlocked"), true);
    telegram.haptic("heavy");
  }
}

async function switchPracticeSession(levelId: string, modeId: string): Promise<void> {
  if (reward.mode === "server" || elements.introOverlay.hidden || sessionSwitching || gameStarting) return;
  const next = resolveSessionSelection("local", { levelId, modeId });
  if (
    next.selection.levelId === selectedSession.selection.levelId
    && next.selection.modeId === selectedSession.selection.modeId
  ) return;
  sessionSwitching = true;
  syncSessionControls();
  try {
    selectedSession = next;
    writeSessionSelection(storage, next.selection);
    saveKey = getCampaignSaveKey(null, next.level.id, next.mode.id);
    const saved = loadCampaign(storage, saveKey, next.selection);
    const mayMigrate = next.level.id === CLASSIC_CAMPAIGN_LEVEL_ID && next.mode.id === CAMPAIGN_MODE_ID;
    const restored = saved || (mayMigrate ? migrateLegacyCampaign(storage) : null);
    runStarted = Boolean(restored);
    initialCampaign = restored || createCampaignState({
      level: next.level,
      mode: next.mode,
      heroId: selectedHeroId,
    });
    selectedHeroId = initialCampaign.hero.id;

    latestUi = null;
    renderedPreviewWave = -1;
    const previous = runtimeController.clearMounted();
    if (previous) {
      gameMounted = false;
      previous.game.destroy(true);
      await waitForRendererCleanup();
      elements.gameRoot.replaceChildren();
    }
    introReturnsToRun = hasRunProgress(initialCampaign);
    telegram.haptic("light");
  } finally {
    sessionSwitching = false;
    syncSessionControls();
    syncHeroChoiceControls();
    syncIntroAction();
  }
}

function toggleGameMenu(): void {
  if (latestUi?.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown")) {
    currentScene()?.setPaused(false);
    return;
  }
  openGameMenu(false);
}

function openGameMenu(focusHeroDetails: boolean): void {
  if (
    !elements.gameMenuOverlay.hidden
    || !elements.introOverlay.hidden
    || !elements.resultOverlay.hidden
    || !latestUi
    || latestUi.phase === "gameover"
    || latestUi.phase === "victory"
  ) return;

  menuReturnFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : elements.gameMenuButton;
  const combatPhase = latestUi.phase === "wave" || latestUi.phase === "countdown";
  resumeAfterMenu = combatPhase && !latestUi.paused;
  if (combatPhase && !latestUi.paused) currentScene()?.setPaused(true);
  elements.appShell.inert = true;
  elements.gameMenuOverlay.hidden = false;
  elements.gameMenuButton.setAttribute("aria-expanded", "true");
  hideRestartConfirmation();
  syncGameMenuUi(latestUi);
  (focusHeroDetails ? elements.gameMenuHeroDetails : elements.gameMenuContinue).focus();
  telegram.haptic("light");
}

function closeGameMenu(resumeGame: boolean, restoreFocus = true): void {
  if (elements.gameMenuOverlay.hidden) return;
  elements.gameMenuOverlay.hidden = true;
  elements.appShell.inert = false;
  elements.gameMenuButton.setAttribute("aria-expanded", "false");
  hideRestartConfirmation();
  const shouldResume = resumeGame && resumeAfterMenu;
  resumeAfterMenu = false;
  if (shouldResume && latestUi?.paused) currentScene()?.setPaused(false);
  if (restoreFocus && menuReturnFocus?.isConnected) menuReturnFocus.focus();
  menuReturnFocus = null;
}

function setGameSpeed(rawSpeed: string | undefined): void {
  const speed = rawSpeed === "2" ? 2 : rawSpeed === "1" ? 1 : null;
  if (!speed || !latestUi || latestUi.speed === speed) return;
  currentScene()?.toggleSpeed();
  telegram.haptic("light");
}

function showRestartConfirmation(): void {
  if (reward.mode === "server" && !finishSettled) {
    showToast(text("game_menu_restart_unavailable"), true);
    return;
  }
  elements.gameMenuRestartConfirm.hidden = false;
  elements.gameMenuRestartAccept.focus();
  telegram.haptic("medium");
}

function hideRestartConfirmation(): void {
  elements.gameMenuRestartConfirm.hidden = true;
}

function openTowerGuideFromMenu(): void {
  const resumeAfterClose = resumeAfterMenu;
  closeGameMenu(false, false);
  openTowerGuide(resumeAfterClose, elements.gameMenuButton);
}

function openSessionMenu(): void {
  if (
    reward.mode === "server"
    || launchError
    || !latestUi
    || latestUi.phase !== "setup"
    || !elements.resultOverlay.hidden
    || !elements.introOverlay.hidden
    || sessionSwitching
  ) return;
  introReturnsToRun = true;
  elements.appShell.inert = true;
  elements.introOverlay.hidden = false;
  syncIntroAction();
  syncSessionControls();
  elements.levelSelect.focus();
  telegram.haptic("light");
}

function dismissIntro(): void {
  closeHeroPicker(false);
  elements.introOverlay.hidden = true;
  elements.appShell.inert = false;
  introReturnsToRun = false;
  writeFlag(session, "td-intro-seen-v1");
  telegram.haptic("light");
}

function openTowerGuide(resumeOverride = false, returnFocus: HTMLElement | null = null): void {
  if (!elements.towerGuideOverlay.hidden) return;
  guideReturnFocus = returnFocus
    ?? (document.activeElement instanceof HTMLElement ? document.activeElement : elements.towerGuideButton);
  const running = Boolean(latestUi && !latestUi.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown"));
  resumeAfterGuide = resumeOverride || running;
  if (running) currentScene()?.setPaused(true);
  elements.appShell.inert = true;
  elements.towerGuideOverlay.hidden = false;
  elements.towerGuideButton.setAttribute("aria-expanded", "true");
  elements.towerGuideClose.focus();
  telegram.haptic("light");
}

function closeTowerGuide(): void {
  if (elements.towerGuideOverlay.hidden) return;
  elements.towerGuideOverlay.hidden = true;
  elements.appShell.inert = false;
  elements.towerGuideButton.setAttribute("aria-expanded", "false");
  if (resumeAfterGuide) currentScene()?.setPaused(false);
  resumeAfterGuide = false;
  if (guideReturnFocus?.isConnected) guideReturnFocus.focus();
  guideReturnFocus = null;
}

function restartGame(): void {
  if (reward.mode === "server" && !finishSettled) return;
  clearCampaign(storage, saveKey);
  clearCampaign(storage, LEGACY_SAVE_KEY);
  if (reward.mode === "server") {
    removePendingResult(storage, reward.runId);
    // A replacement bootstrap belongs to the next run and must survive this reload.
    if (isMiniAppLaunch && !replacementBootstrapCached) clearMiniAppReward(session);
  }
  reloadPage();
}

function reloadPage(): void {
  // Preserve the checkpoint/bootstrap while bypassing only our accidental-close prompt.
  reloadRequested = true;
  window.location.reload();
}

function setLocale(value: string): void {
  const selectedLocale = normalizeLocale(value);
  if (!selectedLocale || selectedLocale === locale) return;
  locale = selectedLocale;
  writeStoredLocale(storage, locale);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
  elements.toast.classList.remove("is-visible");
  applyStaticTranslations();
  applyLaunchErrorTranslations();
  renderedPreviewWave = -1;
  if (latestUi) renderUi(latestUi);
  telegram.haptic("light");
}

function syncGameMenuUi(ui: TowerDefenseUiState | null): void {
  if (!ui) return;
  const combatPhase = ui.phase === "wave" || ui.phase === "countdown";
  elements.gameMenuTitle.textContent = text(combatPhase ? "paused" : "game_menu");
  elements.gameMenuContinue.textContent = text("game_menu_continue");
  elements.gameMenuButton.setAttribute("aria-label", text(
    combatPhase ? (ui.paused ? "game_menu_continue" : "pause") : "game_menu",
  ));
  elements.gameMenuButton.title = text("game_menu");
  elements.gameMenuSpeedButtons.forEach((control) => {
    const selected = control.dataset.menuSpeed === String(ui.speed);
    control.classList.toggle("is-active", selected);
    control.setAttribute("aria-pressed", String(selected));
  });
  elements.gameMenuSession.hidden = reward.mode === "server";
  elements.gameMenuSession.disabled = ui.phase !== "setup";
  elements.gameMenuRestart.disabled = reward.mode === "server" && !finishSettled;
  elements.gameMenuRestart.title = elements.gameMenuRestart.disabled
    ? text("game_menu_restart_unavailable")
    : text("game_menu_restart");
  elements.gameMenuExit.hidden = !telegram.canClose;
  renderHeroDetails(elements.gameMenuHeroDetails, ui.hero.id, ui.hero.level);
}

function renderHeroDetails(container: HTMLElement, heroId: HeroId, level: number): void {
  const emblem = container.querySelector<HTMLElement>("[data-hero-detail-emblem]");
  if (emblem) syncHeroPortrait(emblem, heroId);
  const name = container.querySelector<HTMLElement>("[data-hero-detail-name]");
  const role = container.querySelector<HTMLElement>("[data-hero-detail-role]");
  if (name) name.textContent = heroName(heroId);
  if (role) role.textContent = heroRole(heroId);
  setHeroDetailRow(container, "rank", null, text("hero_detail_rank", { count: level }));
  setHeroDetailRow(container, "attack", "hero_detail_attack", `hero_${heroId}_attack_text` as TranslationKey);
  setHeroDetailRow(container, "passive", "hero_detail_passive", `hero_${heroId}_passive_text` as TranslationKey);
  setHeroDetailRow(container, "ability", "hero_detail_ability", `hero_${heroId}_ability_text` as TranslationKey);

  const next = container.querySelector<HTMLElement>("[data-hero-detail-next]");
  if (!next) return;
  const upgradeCost = getHeroUpgradeCost(heroId, level as 1 | 2 | 3);
  next.textContent = upgradeCost === null
    ? text("hero_max_rank")
    : text("hero_detail_next_upgrade", {
      rank: level + 1,
      effect: text(`hero_${heroId}_upgrade_${level + 1}` as TranslationKey),
      cost: upgradeCost,
    });
}

function setHeroDetailRow(
  container: HTMLElement,
  kind: "rank" | "attack" | "passive" | "ability",
  labelKey: TranslationKey | null,
  value: TranslationKey | string,
): void {
  const row = container.querySelector<HTMLElement>(`[data-hero-detail="${kind}"]`);
  if (!row) return;
  const label = row.querySelector<HTMLElement>("[data-hero-detail-label]");
  const output = row.querySelector<HTMLElement>("[data-hero-detail-value]");
  if (label && labelKey) label.textContent = text(labelKey);
  if (output) output.textContent = labelKey ? text(value as TranslationKey) : value;
}

function applyStaticTranslations(): void {
  document.documentElement.lang = locale;
  document.title = text("app_title");
  elements.languageSelects.forEach((select) => {
    select.value = locale;
    select.setAttribute("aria-label", text("language"));
  });
  elements.languageLabels.forEach((label) => {
    label.textContent = text("language");
  });
  elements.appTitle.textContent = text("app_title");
  elements.appSubtitle.textContent = text("app_subtitle");
  elements.hudRegion.setAttribute("aria-label", text("defense_status"));
  elements.gameRoot.setAttribute("aria-label", text("game_field"));
  elements.livesLabel.textContent = text("lives");
  elements.goldLabel.textContent = text("gold");
  elements.waveLabel.textContent = text("wave");
  elements.pulseLabel.textContent = heroAbilityName(selectedHeroId);
  elements.buildEyebrow.textContent = text("arsenal");
  elements.buildHint.textContent = text("build_hint");
  elements.practiceBadge.textContent = text("practice");
  elements.gameMenuEyebrow.textContent = text("app_title");
  elements.gameMenuClose.setAttribute("aria-label", text("close"));
  elements.gameMenuSpeedLabel.textContent = text("speed");
  const menuLanguageLabel = text("game_menu_language");
  const menuLanguage = elements.gameMenuOverlay.querySelector<HTMLElement>(".game-menu-language > span");
  if (menuLanguage) menuLanguage.textContent = menuLanguageLabel;
  elements.gameMenuTowerGuideLabel.textContent = text("game_menu_tower_guide");
  elements.gameMenuSessionLabel.textContent = text("game_menu_session");
  elements.gameMenuRestartLabel.textContent = text("game_menu_restart");
  elements.gameMenuExitLabel.textContent = text("game_menu_exit");
  elements.gameMenuRestartConfirmTitle.textContent = text("game_menu_restart_confirm");
  elements.gameMenuRestartConfirmCopy.textContent = text("game_menu_restart_confirm_copy");
  elements.gameMenuRestartCancel.textContent = text("game_menu_cancel");
  elements.gameMenuRestartAccept.textContent = text("game_menu_restart_accept");
  syncFullscreenUi(telegram.isFullscreen);
  const guideButtonLabel = text("tower_guide_button");
  elements.towerGuideButton.setAttribute("aria-label", guideButtonLabel);
  elements.towerGuideButton.title = guideButtonLabel;
  elements.towerGuideClose.setAttribute("aria-label", text("close"));
  elements.towerGuideEyebrow.textContent = text("guide_eyebrow");
  elements.towerGuideTitle.textContent = text("guide_title");
  elements.towerGuideIntro.textContent = text("guide_intro");
  elements.towerGuideCombo.textContent = text("guide_combo");
  elements.towerGuideDone.textContent = text("guide_done");
  renderTowerGuide();
  elements.rangerName.textContent = text("tower_ranger");
  elements.frostName.textContent = text("tower_frost");
  elements.emberName.textContent = text("tower_ember");
  elements.stormName.textContent = text("tower_storm");
  elements.nextWaveLabel.textContent = text("next_wave");
  elements.introTitle.textContent = text("intro_title");
  elements.introBody.textContent = text("intro_body");
  elements.heroChoiceLabel.textContent = text("hero_choice");
  elements.heroChoiceLock.textContent = text("hero_choice_locked");
  elements.heroPickerEyebrow.textContent = text("hero_picker_eyebrow");
  elements.heroPickerTitle.textContent = text("hero_picker_title");
  elements.heroPickerHint.textContent = text("hero_picker_hint");
  elements.heroPickerDone.textContent = text("hero_picker_done");
  elements.heroEiraName.textContent = heroName("eira");
  elements.heroEiraRole.textContent = heroRole("eira");
  elements.heroEiraAbility.textContent = heroAbilityName("eira");
  elements.heroTorenName.textContent = heroName("toren");
  elements.heroTorenRole.textContent = heroRole("toren");
  elements.heroTorenAbility.textContent = heroAbilityName("toren");
  elements.heroGrakName.textContent = heroName("grak");
  elements.heroGrakRole.textContent = heroRole("grak");
  elements.heroGrakAbility.textContent = heroAbilityName("grak");
  elements.heroGrakUnlock.querySelector("small")!.textContent = text("hero_grak_unlock_requirement");
  elements.heroPickerClose.setAttribute("aria-label", text("close"));
  elements.heroDetailsButton.setAttribute("aria-label", text("game_menu_hero_details"));
  renderHeroDetails(elements.heroPickerDetails, selectedHeroId, 1);
  if (latestUi) syncGameMenuUi(latestUi);
  syncHeroChoiceControls();
  syncIntroAction();
  syncSessionControls();
  elements.introTowers.textContent = text("intro_towers", { count: 4 });
  elements.introBosses.textContent = text("intro_bosses");
  elements.resultEyebrow.textContent = text("result_eyebrow");
  elements.closeTowerPanel.setAttribute("aria-label", text("close"));
  elements.closeHeroPanel.setAttribute("aria-label", text("close"));
  elements.speedButton.setAttribute("aria-label", text("speed"));
  elements.pulseButton.setAttribute("aria-label", text("hero_ability_ready", {
    ability: heroAbilityName(selectedHeroId),
  }));
}

function openHeroPicker(): void {
  if (elements.heroChoiceButton.disabled || elements.introOverlay.hidden) return;
  elements.introCard.classList.add("is-hero-picker-open");
  elements.heroPicker.hidden = false;
  elements.heroChoiceButton.setAttribute("aria-expanded", "true");
  elements.heroOptions.find((option) => option.dataset.heroChoice === selectedHeroId)?.focus();
  telegram.haptic("light");
}

function closeHeroPicker(restoreFocus: boolean): void {
  if (elements.heroPicker.hidden) return;
  elements.heroPicker.hidden = true;
  elements.introCard.classList.remove("is-hero-picker-open");
  elements.heroChoiceButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && !elements.heroChoiceButton.disabled) elements.heroChoiceButton.focus();
}

function chooseHero(value: string): void {
  if (!isHeroId(value) || heroChoiceIsLocked()) return;
  if (!isHeroAvailable(value, playerProfile)) {
    showToast(text("hero_grak_locked"));
    telegram.haptic("medium");
    return;
  }
  selectedHeroId = value;
  initialCampaign = createCampaignState({
    level: selectedSession.level,
    mode: selectedSession.mode,
    heroId: selectedHeroId,
  });
  syncHeroChoiceControls();
  syncIntroAction();
  telegram.haptic("light");
}

function syncHeroChoiceControls(): void {
  const campaign = latestUi?.campaign ?? initialCampaign;
  selectedHeroId = campaign.hero.id;
  const locked = heroChoiceIsLocked();
  const disabled = locked || sessionSwitching || gameStarting || Boolean(launchError);
  elements.heroChoiceButton.disabled = disabled;
  elements.heroChoiceButton.setAttribute("aria-label", `${text("hero_choice")}: ${heroName(selectedHeroId)}`);
  syncHeroPortrait(elements.heroChoiceEmblem, selectedHeroId);
  elements.heroChoiceName.textContent = heroName(selectedHeroId);
  elements.heroChoiceRole.textContent = heroRole(selectedHeroId);
  elements.heroChoiceLock.hidden = !locked;
  elements.heroOptions.forEach((option) => {
    const optionHeroId = option.dataset.heroChoice;
    if (!isHeroId(optionHeroId)) return;
    const selected = optionHeroId === selectedHeroId;
    const unavailable = !isHeroAvailable(optionHeroId, playerProfile);
    option.classList.toggle("is-selected", selected);
    option.classList.toggle("is-locked", unavailable);
    option.setAttribute("aria-checked", String(selected));
    option.setAttribute("aria-disabled", String(disabled || unavailable));
    if (optionHeroId === "grak") {
      if (unavailable) option.setAttribute("aria-describedby", "hero-grak-unlock");
      else option.removeAttribute("aria-describedby");
    }
    option.disabled = disabled || unavailable;
  });
  renderHeroDetails(elements.heroPickerDetails, selectedHeroId, 1);
  if (disabled) closeHeroPicker(false);
}

function heroChoiceIsLocked(): boolean {
  return gameMounted || runStarted || hasRunProgress(latestUi?.campaign ?? initialCampaign);
}

function isHeroAvailable(heroId: HeroId, profile: PlayerProfileSnapshot | null): boolean {
  return isHeroUnlocked(heroId, profile) || (heroId === "grak" && developmentGrakPreview);
}

function syncHeroPortrait(container: HTMLElement, heroId: HeroId): void {
  container.className = `hero-emblem ${heroId}`;
  let image = container.querySelector<HTMLImageElement>("img");
  if (!image) {
    image = document.createElement("img");
    image.alt = "";
    container.replaceChildren(image);
  }
  if (image.dataset.heroPortrait === heroId) return;
  image.src = HERO_PORTRAIT_URLS[heroId];
  image.dataset.heroPortrait = heroId;
}

function syncSessionControls(): void {
  elements.levelSelect.replaceChildren(...Object.values(CONTENT_CATALOG.levels).map((level) => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = text(level.displayNameKey);
    return option;
  }));
  elements.modeSelect.replaceChildren(...Object.values(CONTENT_CATALOG.modes).map((mode) => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = text(mode.displayNameKey);
    return option;
  }));

  elements.levelSelect.value = selectedSession.level.id;
  elements.modeSelect.value = selectedSession.mode.id;
  elements.levelChoiceLabel.textContent = text("session_level");
  elements.modeChoiceLabel.textContent = text("session_mode");
  elements.sessionChoiceHint.textContent = text("session_hint");
  elements.sessionPicker.hidden = selectedSession.locked;
  elements.levelSelect.disabled = selectedSession.locked || sessionSwitching || gameStarting;
  elements.modeSelect.disabled = selectedSession.locked || sessionSwitching || gameStarting;
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  elements.introWaves.textContent = finalWave === null
    ? text("intro_endless")
    : text("intro_waves", { count: finalWave });
  syncHeroChoiceControls();
}

function hasRunProgress(campaign: TowerDefenseUiState["campaign"]): boolean {
  const level = CONTENT_CATALOG.levels[campaign.levelId];
  return campaign.completedWave > 0
    || campaign.towers.length > 0
    || campaign.totalKills > 0
    || campaign.activeDurationMs > 0
    || campaign.hero.level > 1
    || campaign.hero.anchorId !== 0
    || Boolean(level && (campaign.gold !== level.startingGold || campaign.lives !== level.startingLives));
}

function waitForRendererCleanup(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function syncFullscreenUi(isFullscreen: boolean): void {
  const supportsFullscreen = telegram.supportsFullscreen;
  document.documentElement.classList.toggle("is-telegram-fullscreen", isFullscreen);
  elements.fullscreenButton.hidden = !supportsFullscreen;
  elements.fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  const label = text(isFullscreen ? "fullscreen_exit" : "fullscreen_enter");
  elements.fullscreenButton.setAttribute("aria-label", label);
  elements.fullscreenButton.title = label;
  elements.gameMenuFullscreenLabel.textContent = text("game_menu_fullscreen");
}

function applyLaunchErrorTranslations(): void {
  elements.introTitle.textContent = text("intro_title");
  elements.introBody.textContent = text("intro_body");
  if (runtimeLoadFailed) {
    elements.introTitle.textContent = text("launch_error_title");
    elements.introBody.textContent = text("game_load_failed");
  } else if (launchError) {
    elements.introTitle.textContent = text("launch_error_title");
    elements.introBody.textContent = text(
      launchError === "miniapp_start_failed" ? "miniapp_launch_error_body" : "launch_error_body",
    );
  }
  syncIntroAction();
}

function syncIntroAction(): void {
  elements.introStart.setAttribute("aria-busy", String(gameStarting));
  if (launchError === "miniapp_start_failed") {
    elements.introStart.disabled = false;
    elements.introStart.textContent = text("miniapp_launch_retry");
    return;
  }
  if (launchError) {
    elements.introStart.disabled = true;
    elements.introStart.textContent = text("launch_error_action");
    return;
  }
  if (gameStarting) {
    elements.introStart.disabled = true;
    elements.introStart.textContent = text("game_loading");
    return;
  }
  if (runtimeLoadFailed) {
    elements.introStart.disabled = false;
    elements.introStart.textContent = text("game_load_retry");
    return;
  }
  elements.introStart.disabled = sessionSwitching;
  elements.introStart.textContent = text(introReturnsToRun ? "intro_continue" : "intro_start");
}

function renderTowerGuide(): void {
  elements.towerGuideGrid.replaceChildren(...TOWER_GUIDE_ENTRIES.map((entry) => {
    const card = document.createElement("article");
    card.className = `guide-tower ${entry.type}`;

    const header = document.createElement("div");
    header.className = "guide-tower-header";
    const emblem = document.createElement("span");
    emblem.className = `tower-emblem ${entry.type}`;
    emblem.setAttribute("aria-hidden", "true");
    emblem.append(document.createElement("i"));
    const copy = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = towerName(entry.type);
    const description = document.createElement("p");
    description.textContent = text(entry.descriptionKey);
    copy.append(name, description);
    header.append(emblem, copy);

    card.append(
      header,
      guideMatchup("strong", "guide_strong", entry.strongKey),
      guideMatchup("weak", "guide_weak", entry.weakKey),
    );
    return card;
  }));
}

function guideMatchup(kind: "strong" | "weak", labelKey: TranslationKey, valueKey: TranslationKey): HTMLElement {
  const row = document.createElement("p");
  row.className = `guide-matchup is-${kind}`;
  const label = document.createElement("strong");
  label.textContent = `${kind === "strong" ? "✓" : "!"} ${text(labelKey)}:`;
  row.append(label, document.createTextNode(` ${text(valueKey)}`));
  return row;
}

function towerName(type: TowerType): string {
  return text(`tower_${type}` as TranslationKey);
}

function heroName(id: HeroId): string {
  return text(`hero_${id}` as TranslationKey);
}

function heroRole(id: HeroId): string {
  return text(`hero_${id}_role` as TranslationKey);
}

function heroAbilityName(id: HeroId): string {
  return text(`hero_${id}_ability` as TranslationKey);
}

function enemyName(type: EnemyType): string {
  return text(`enemy_${type}` as TranslationKey);
}

function text(key: TranslationKey, params: Record<string, string | number> = {}): string {
  return tr(locale as Locale, key, params);
}

function readFlag(target: StorageLike | null, key: string): boolean {
  if (!target) return false;
  try { return target.getItem(key) === "1"; } catch { return false; }
}

function writeFlag(target: StorageLike | null, key: string): void {
  if (!target) return;
  try { target.setItem(key, "1"); } catch { /* storage is optional */ }
}

function safeStorage(key: "localStorage" | "sessionStorage"): StorageLike | null {
  try { return window[key]; } catch { return null; }
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing tower defense element: ${id}`);
  return element;
}

function button(id: string): HTMLButtonElement {
  const element = byId(id);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected button: ${id}`);
  return element;
}

function select(id: string): HTMLSelectElement {
  const element = byId(id);
  if (!(element instanceof HTMLSelectElement)) throw new Error(`Expected select: ${id}`);
  return element;
}
}
