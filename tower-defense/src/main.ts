import Phaser from "phaser";
import "./styles.css";
import { ENEMY_DEFINITIONS, ENEMY_PREVIEW_ORDER, FINAL_WAVE, TOWER_DEFINITIONS } from "./game/config.ts";
import {
  clearCampaign,
  getCampaignSaveKey,
  LEGACY_SAVE_KEY,
  loadCampaign,
  migrateLegacyCampaign,
  saveCampaign,
  type StorageLike,
} from "./game/save.ts";
import { createCampaignState } from "./game/state.ts";
import type { EnemyType, TowerType, WavePlan } from "./game/types.ts";
import { createWavePlan } from "./game/waves.ts";
import { detectLocale, tr, type Locale, type TranslationKey } from "./i18n.ts";
import { loadPendingResult, removePendingResult, savePendingResult } from "./pendingResult.ts";
import {
  captureFinalResult,
  createRewardFinisher,
  parseLaunchParams,
  type FinalResult,
  type RewardFinisher,
  type RewardLaunch,
} from "./reward.ts";
import {
  createTowerDefenseGame,
  getSelectedTowerDetails,
  type NoticeCode,
  type TerminalOutcome,
  type TowerDefenseScene,
  type TowerDefenseUiState,
} from "./rendering/TowerDefenseScene.ts";
import { setupTelegramBridge } from "./telegram.ts";

const launch = parseLaunchParams(window.location.href);
const locale = detectLocale(launch.payload?.lang, launch.payload?.language);
const storage = safeStorage("localStorage");
const session = safeStorage("sessionStorage");
const rewardUsedKey = launch.reward.runId ? `td-reward-used-v1:${launch.reward.runId}` : null;
const rewardAlreadyUsed = rewardUsedKey ? readFlag(storage, rewardUsedKey) : false;
const reward: RewardLaunch = rewardAlreadyUsed
  ? Object.freeze({ mode: "local", runId: null, token: null, finishUrl: null })
  : launch.reward;
const saveKey = getCampaignSaveKey(reward.mode === "server" ? reward.runId : null);
const savedCampaign = loadCampaign(storage, saveKey);
const migrated = reward.mode === "local" && !savedCampaign ? migrateLegacyCampaign(storage) : null;
const pendingAtLaunch = reward.mode === "server" && reward.runId
  ? loadPendingResult(storage, reward.runId, FINAL_WAVE)
  : null;
const initialCampaign = pendingAtLaunch
  ? createCampaignState()
  : savedCampaign || migrated || createCampaignState();
const telegram = setupTelegramBridge();

let latestUi: TowerDefenseUiState | null = null;
let scene: TowerDefenseScene;
let rewardFinisher: RewardFinisher | null = null;
let finishSettled = reward.mode === "local";
let terminalResult: FinalResult | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let renderedPreviewWave = -1;
let cachedPreviewPlan: WavePlan | null = null;

const elements = {
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
};

applyStaticTranslations();
if (launch.rewardError) {
  elements.introTitle.textContent = text("launch_error_title");
  elements.introBody.textContent = text("launch_error_body");
  elements.introStart.textContent = text("launch_error_action");
  elements.introStart.disabled = true;
}
telegram.setClosingConfirmation(reward.mode === "server" && !finishSettled);

const mounted = createTowerDefenseGame(elements.gameRoot, initialCampaign, {
  onUiChange: (ui) => {
    latestUi = ui;
    renderUi(ui);
  },
  onPersist: (campaign) => {
    saveCampaign(storage, saveKey, campaign);
  },
  onNotice: showNotice,
  onWaveClear: (_wave, bonus, repairedLives) => {
    showToast(`${text("wave_clear")} · ${text("clear_bonus", { amount: bonus })}`);
    if (repairedLives > 0) window.setTimeout(() => showToast(`♥ +${repairedLives} · ${text("boss_repair")}`), 750);
  },
  onTerminal: handleTerminal,
  onHaptic: telegram.haptic,
});
scene = mounted.scene;

bindInteractions();
restorePendingFinish();

function bindInteractions(): void {
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
  elements.introStart.addEventListener("click", dismissIntro);
  elements.rewardRetry.addEventListener("click", () => void finishReward());
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
}

function renderUi(ui: TowerDefenseUiState): void {
  elements.livesValue.textContent = String(ui.campaign.lives);
  elements.goldValue.textContent = String(ui.campaign.gold);
  elements.waveValue.textContent = `${Math.min(FINAL_WAVE, ui.currentWave)} / ${FINAL_WAVE}`;
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

  const previewWave = Math.min(FINAL_WAVE, ui.campaign.completedWave + 1);
  if (!cachedPreviewPlan || cachedPreviewPlan.wave !== previewWave) cachedPreviewPlan = createWavePlan(previewWave);
  const plan = cachedPreviewPlan;
  if (renderedPreviewWave !== plan.wave) {
    renderWavePreview(plan.wave, plan.spawns.map((spawn) => spawn.type));
    renderedPreviewWave = plan.wave;
  }
  elements.threatMeter.textContent = `${"◆".repeat(plan.threat)}${"◇".repeat(5 - plan.threat)}`;
  elements.threatMeter.setAttribute("aria-label", text("threat", { count: plan.threat }));
  elements.startWaveButton.disabled = !editing || ui.campaign.completedWave >= FINAL_WAVE;
  elements.startWaveButton.classList.toggle("is-boss", plan.hasBoss);
  elements.startWaveButton.textContent = plan.hasBoss ? text("boss_wave") : text("start_wave");
  elements.practiceBadge.hidden = reward.mode === "server";
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
    const glyph = document.createElement("i");
    glyph.className = `enemy-glyph ${type}`;
    glyph.textContent = ENEMY_DEFINITIONS[type].glyph;
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
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2_200);
}

function handleTerminal(outcome: TerminalOutcome, campaign: TowerDefenseUiState["campaign"]): void {
  const result = captureFinalResult(Math.min(FINAL_WAVE, campaign.completedWave), campaign.activeDurationMs);
  terminalResult = result;
  const pendingSaved = reward.mode === "server" && savePendingResult(storage, reward.runId, outcome, result);
  if (reward.mode === "local" || pendingSaved) clearCampaign(storage, saveKey);
  showResult(outcome, result);
  rewardFinisher = createRewardFinisher(reward, result);
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
  if (result.ok) {
    finishSettled = true;
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text(result.duplicate ? "reward_duplicate" : "reward_saved");
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    if (rewardUsedKey) writeFlag(storage, rewardUsedKey);
    clearCampaign(storage, saveKey);
    removePendingResult(storage, reward.runId);
    return;
  }
  elements.rewardStatus.classList.add("is-error");
  elements.rewardStatus.textContent = text("reward_failed");
  elements.rewardRetry.hidden = false;
  elements.closeHint.textContent = text("finish_failed_hint");
  telegram.setClosingConfirmation(true);
}

function showResult(outcome: TerminalOutcome, result: FinalResult): void {
  elements.resultOverlay.hidden = false;
  elements.resultCard.classList.toggle("is-victory", outcome === "victory");
  elements.resultCard.classList.toggle("is-defeat", outcome === "gameover");
  elements.resultSigil.textContent = outcome === "victory" ? "✦" : "◆";
  elements.resultTitle.textContent = text(outcome === "victory" ? "victory" : "game_over");
  elements.resultScore.textContent = text("result_waves", { count: result.score });
  elements.rewardRetry.textContent = text("reward_retry");
  elements.restartButton.textContent = text("restart");
  elements.closeHint.textContent = text(reward.mode === "server" ? "finish_pending_hint" : "close_hint");
  elements.introOverlay.hidden = true;
}

function restorePendingFinish(): void {
  if (launch.rewardError) return;
  if (reward.mode !== "server" || !reward.runId) {
    if (initialCampaign.completedWave > 0 || readFlag(session, "td-intro-seen-v1")) elements.introOverlay.hidden = true;
    return;
  }
  const pending = pendingAtLaunch || loadPendingResult(storage, reward.runId, FINAL_WAVE);
  if (!pending) {
    if (initialCampaign.completedWave > 0 || readFlag(session, "td-intro-seen-v1")) elements.introOverlay.hidden = true;
    return;
  }
  terminalResult = captureFinalResult(pending.score, pending.durationMs);
  rewardFinisher = createRewardFinisher(reward, terminalResult);
  showResult(pending.outcome, terminalResult);
  void finishReward();
}

function dismissIntro(): void {
  elements.introOverlay.hidden = true;
  writeFlag(session, "td-intro-seen-v1");
  telegram.haptic("light");
}

function restartGame(): void {
  if (reward.mode === "server" && !finishSettled) return;
  clearCampaign(storage, getCampaignSaveKey(null));
  clearCampaign(storage, LEGACY_SAVE_KEY);
  window.location.reload();
}

function applyStaticTranslations(): void {
  document.documentElement.lang = locale;
  document.title = text("app_title");
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
  elements.rangerName.textContent = text("tower_ranger");
  elements.frostName.textContent = text("tower_frost");
  elements.emberName.textContent = text("tower_ember");
  elements.stormName.textContent = text("tower_storm");
  elements.nextWaveLabel.textContent = text("next_wave");
  elements.introTitle.textContent = text("intro_title");
  elements.introBody.textContent = text("intro_body");
  elements.introStart.textContent = text("intro_start");
  elements.introWaves.textContent = text("intro_waves", { count: FINAL_WAVE });
  elements.introTowers.textContent = text("intro_towers", { count: 4 });
  elements.introBosses.textContent = text("intro_bosses");
  elements.resultEyebrow.textContent = text("result_eyebrow");
  elements.closeTowerPanel.setAttribute("aria-label", text("close"));
  elements.pauseButton.setAttribute("aria-label", text("pause"));
  elements.speedButton.setAttribute("aria-label", text("speed"));
  elements.pulseButton.setAttribute("aria-label", text("pulse_ready"));
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

void Phaser;
