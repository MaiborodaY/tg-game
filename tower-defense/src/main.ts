import Phaser from "phaser";
import "./styles.css";
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
import { createCampaignState } from "./game/state.ts";
import { MAX_RATING_SCORE } from "./game/scoring.ts";
import type { EnemyType, TowerType, WavePlan } from "./game/types.ts";
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
import {
  createTowerDefenseGame,
  getSelectedTowerDetails,
  type NoticeCode,
  type TerminalOutcome,
  type TowerDefenseCallbacks,
  type TowerDefenseScene,
  type TowerDefenseUiState,
} from "./rendering/TowerDefenseScene.ts";
import { setupTelegramBridge } from "./telegram.ts";
import { TOWER_GUIDE_ENTRIES } from "./towerGuide.ts";

void bootstrap();

async function bootstrap(): Promise<void> {
const legacyLaunch = parseLaunchParams(window.location.href);
const storage = safeStorage("localStorage");
const session = safeStorage("sessionStorage");
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
let cachedPreviewPlan: WavePlan | null = null;
let resumeAfterGuide = false;
let guideReturnFocus: HTMLElement | null = null;
let introReturnsToRun = false;
let sessionSwitching = false;
let localSaveWarningShown = false;
let finishAuthRefreshAttempted = false;
let finishRunReplaced = false;
let replacementBootstrapCached = false;
let playerProfile: PlayerProfileSnapshot | null = miniAppBootstrap?.profile ?? null;

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
  sessionMenuButton: button("session-menu-button"),
  pauseButton: button("pause-button"),
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
  nextWaveLabel: byId("next-wave-label"),
  waveEnemies: byId("wave-enemies"),
  threatMeter: byId("threat-meter"),
  startWaveButton: button("start-wave-button"),
  introOverlay: byId("intro-overlay"),
  introTitle: byId("intro-title"),
  introBody: byId("intro-body"),
  introStart: button("intro-start"),
  sessionPicker: byId("session-picker"),
  levelChoiceLabel: byId("level-choice-label"),
  levelSelect: select("level-select"),
  modeChoiceLabel: byId("mode-choice-label"),
  modeSelect: select("mode-select"),
  sessionChoiceHint: byId("session-choice-hint"),
  introWaves: byId("intro-waves"),
  introTowers: byId("intro-towers"),
  introBosses: byId("intro-bosses"),
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
let mounted = createTowerDefenseGame(elements.gameRoot, initialCampaign, gameCallbacks);
let scene: TowerDefenseScene = mounted.scene;

bindInteractions();
restorePendingFinish();
showRestoredRunStatus();
if (!elements.introOverlay.hidden) elements.introStart.focus();
else if (elements.resultOverlay.hidden) elements.appShell.inert = false;

function bindInteractions(): void {
  elements.languageSelects.forEach((select) => {
    select.addEventListener("change", () => setLocale(select.value));
  });
  elements.towerCards.forEach((card) => {
    card.addEventListener("click", () => scene.setBuildType(card.dataset.tower as TowerType));
  });
  elements.startWaveButton.addEventListener("click", () => scene.startWave());
  elements.pauseButton.addEventListener("click", () => scene.togglePause());
  elements.speedButton.addEventListener("click", () => scene.toggleSpeed());
  elements.pulseButton.addEventListener("click", () => scene.usePulse());
  elements.upgradeButton.addEventListener("click", () => scene.upgradeSelectedTower());
  elements.sellButton.addEventListener("click", () => scene.sellSelectedTower());
  elements.closeTowerPanel.addEventListener("click", () => scene.clearSelection());
  elements.fullscreenButton.addEventListener("click", () => {
    if (telegram.isFullscreen) telegram.exitFullscreen();
    else telegram.requestFullscreen();
  });
  elements.sessionMenuButton.addEventListener("click", openSessionMenu);
  telegram.onFullscreenChange(syncFullscreenUi);
  elements.towerGuideButton.addEventListener("click", openTowerGuide);
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
  elements.introStart.addEventListener("click", () => {
    if (launchError === "miniapp_start_failed") window.location.reload();
    else dismissIntro();
  });
  elements.rewardRetry.addEventListener("click", () => {
    if (finishRunReplaced) return;
    finishAuthRefreshAttempted = false;
    void finishReward();
  });
  elements.restartButton.addEventListener("click", restartGame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && latestUi && (latestUi.phase === "wave" || latestUi.phase === "countdown")) scene.setPaused(true);
  });
  window.addEventListener("beforeunload", (event) => {
    if (reward.mode === "server" && !finishSettled) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.towerGuideOverlay.hidden) closeTowerGuide();
  });
}

function renderUi(ui: TowerDefenseUiState): void {
  elements.livesValue.textContent = String(ui.campaign.lives);
  elements.goldValue.textContent = String(ui.campaign.gold);
  elements.waveValue.textContent = `${ui.currentWave} / ${ui.finalWave ?? "∞"}`;
  elements.waveProgress.style.width = `${Math.round(ui.waveProgress * 100)}%`;
  elements.pauseButton.textContent = ui.paused ? "▶" : "Ⅱ";
  elements.pauseButton.classList.toggle("is-active", ui.paused);
  elements.pauseButton.setAttribute("aria-label", text(ui.paused ? "resume" : "pause"));
  elements.pauseButton.disabled = ui.phase === "gameover" || ui.phase === "victory";
  elements.speedButton.textContent = `×${ui.speed}`;
  elements.speedButton.classList.toggle("is-active", ui.speed === 2);
  elements.phaseBadge.textContent = `${phaseLabel(ui)} · ${text("act", { count: ui.act })}`;
  elements.countdown.hidden = ui.phase !== "countdown" || ui.paused;
  elements.countdown.textContent = String(Math.max(1, ui.countdown));
  elements.pulseButton.disabled = ui.phase !== "wave" || !ui.pulseAvailable || ui.enemiesAlive === 0 || ui.paused;
  elements.pulseButton.classList.toggle("is-used", !ui.pulseAvailable);
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
    card.classList.toggle("is-selected", ui.selectedBuildType === type);
    card.disabled = !editing || ui.campaign.gold < TOWER_DEFINITIONS[type].buildCost;
  });

  const selected = getSelectedTowerDetails(ui);
  elements.buildPanel.hidden = Boolean(selected);
  elements.towerPanel.hidden = !selected;
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

  const previewWave = ui.finalWave === null
    ? ui.campaign.completedWave + 1
    : Math.min(ui.finalWave, ui.campaign.completedWave + 1);
  if (!cachedPreviewPlan || cachedPreviewPlan.wave !== previewWave) cachedPreviewPlan = scene.getCurrentWavePlan();
  const plan = cachedPreviewPlan;
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
  elements.sessionMenuButton.hidden = reward.mode === "server";
  elements.sessionMenuButton.disabled = ui.phase !== "setup";
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
  const key: TranslationKey = code === "insufficient_gold"
    ? "insufficient_gold"
    : code === "max_level"
      ? "max_level"
      : code === "mastery_locked"
        ? "mastery_locked"
      : code === "pulse_used"
        ? "pulse_used"
        : code === "build_locked"
          ? "build_locked"
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

function restorePendingFinish(): void {
  if (launchError) return;
  if (reward.mode !== "server" || !reward.runId) {
    if (initialCampaign.completedWave > 0 || initialCampaign.towers.length > 0) elements.introOverlay.hidden = true;
    return;
  }
  const pending = pendingAtLaunch || loadPendingResult(storage, reward.runId, MAX_RATING_SCORE, FINAL_WAVE);
  if (!pending) {
    if (initialCampaign.completedWave > 0 || readFlag(session, "td-intro-seen-v1")) elements.introOverlay.hidden = true;
    return;
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
  playerProfile = profile;
  elements.appShell.dataset.profileRevision = String(playerProfile.revision);
  elements.appShell.dataset.unlockedLevels = String(playerProfile.unlockedLevelIds.length);
}

async function switchPracticeSession(levelId: string, modeId: string): Promise<void> {
  if (reward.mode === "server" || elements.introOverlay.hidden || sessionSwitching) return;
  const next = resolveSessionSelection("local", { levelId, modeId });
  if (
    next.selection.levelId === selectedSession.selection.levelId
    && next.selection.modeId === selectedSession.selection.modeId
  ) return;

  selectedSession = next;
  sessionSwitching = true;
  writeSessionSelection(storage, next.selection);
  saveKey = getCampaignSaveKey(null, next.level.id, next.mode.id);
  const saved = loadCampaign(storage, saveKey, next.selection);
  const mayMigrate = next.level.id === CLASSIC_CAMPAIGN_LEVEL_ID && next.mode.id === CAMPAIGN_MODE_ID;
  initialCampaign = saved
    || (mayMigrate ? migrateLegacyCampaign(storage) : null)
    || createCampaignState({ level: next.level, mode: next.mode });

  latestUi = null;
  cachedPreviewPlan = null;
  renderedPreviewWave = -1;
  mounted.game.destroy(true);
  syncSessionControls();
  await waitForRendererCleanup();
  elements.gameRoot.replaceChildren();
  mounted = createTowerDefenseGame(elements.gameRoot, initialCampaign, gameCallbacks);
  scene = mounted.scene;
  sessionSwitching = false;
  introReturnsToRun = hasRunProgress(initialCampaign);
  elements.introStart.textContent = text(introReturnsToRun ? "intro_continue" : "intro_start");
  syncSessionControls();
  telegram.haptic("light");
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
  elements.introStart.textContent = text("intro_continue");
  syncSessionControls();
  elements.levelSelect.focus();
  telegram.haptic("light");
}

function dismissIntro(): void {
  elements.introOverlay.hidden = true;
  elements.appShell.inert = false;
  introReturnsToRun = false;
  writeFlag(session, "td-intro-seen-v1");
  telegram.haptic("light");
}

function openTowerGuide(): void {
  if (!elements.towerGuideOverlay.hidden) return;
  guideReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : elements.towerGuideButton;
  resumeAfterGuide = Boolean(latestUi && !latestUi.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown"));
  if (resumeAfterGuide) scene.setPaused(true);
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
  if (resumeAfterGuide) scene.setPaused(false);
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
  elements.pulseLabel.textContent = text("pulse");
  elements.buildEyebrow.textContent = text("arsenal");
  elements.buildHint.textContent = text("build_hint");
  elements.practiceBadge.textContent = text("practice");
  const sessionMenuLabel = text("session_menu");
  elements.sessionMenuButton.setAttribute("aria-label", sessionMenuLabel);
  elements.sessionMenuButton.title = sessionMenuLabel;
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
  elements.introStart.textContent = text(introReturnsToRun ? "intro_continue" : "intro_start");
  syncSessionControls();
  elements.introTowers.textContent = text("intro_towers", { count: 4 });
  elements.introBosses.textContent = text("intro_bosses");
  elements.resultEyebrow.textContent = text("result_eyebrow");
  elements.closeTowerPanel.setAttribute("aria-label", text("close"));
  elements.pauseButton.setAttribute("aria-label", text("pause"));
  elements.speedButton.setAttribute("aria-label", text("speed"));
  elements.pulseButton.setAttribute("aria-label", text("pulse_ready"));
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
  elements.levelSelect.disabled = selectedSession.locked || sessionSwitching;
  elements.modeSelect.disabled = selectedSession.locked || sessionSwitching;
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  elements.introWaves.textContent = finalWave === null
    ? text("intro_endless")
    : text("intro_waves", { count: finalWave });
}

function hasRunProgress(campaign: TowerDefenseUiState["campaign"]): boolean {
  return campaign.completedWave > 0 || campaign.towers.length > 0;
}

function waitForRendererCleanup(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function syncFullscreenUi(isFullscreen: boolean): void {
  const supportsFullscreen = telegram.supportsFullscreen;
  document.documentElement.classList.toggle("is-telegram-fullscreen", isFullscreen);
  elements.buildPanel.classList.toggle("has-fullscreen-control", supportsFullscreen);
  elements.fullscreenButton.hidden = !supportsFullscreen;
  elements.fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  const label = text(isFullscreen ? "fullscreen_exit" : "fullscreen_enter");
  elements.fullscreenButton.setAttribute("aria-label", label);
  elements.fullscreenButton.title = label;
}

function applyLaunchErrorTranslations(): void {
  elements.introStart.disabled = false;
  if (!launchError) return;
  elements.introTitle.textContent = text("launch_error_title");
  if (launchError === "miniapp_start_failed") {
    elements.introBody.textContent = text("miniapp_launch_error_body");
    elements.introStart.textContent = text("miniapp_launch_retry");
    return;
  }
  elements.introBody.textContent = text("launch_error_body");
  elements.introStart.textContent = text("launch_error_action");
  elements.introStart.disabled = true;
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

void Phaser;
}
