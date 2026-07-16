import "./styles.css";

import { drawRunnerFrame, type RunnerPetType } from "./runnerCanvas";
import {
  captureRunnerFinalResult,
  createRunnerRewardFinisher,
  loadRunnerBestScore,
  parseRunnerLaunchParams,
  saveRunnerBestScore,
  submitRunnerTelegramScore,
  type RunnerFinalResult,
  type RunnerRewardFinisher,
  type StorageLike,
} from "./runnerReward";
import {
  RUNNER_STEP_MS,
  createRunnerInitialState,
  jumpRunner,
  pauseRunner,
  resizeRunnerWorld,
  resumeRunner,
  startRunner,
  stepRunner,
  type RunnerState,
} from "./runnerState";
import {
  initialRunnerLang,
  normalizeRunnerLang,
  translate,
  type RunnerLang,
  type RunnerTextKey,
  type RunnerTextVariables,
} from "./i18n";

type RewardUiStatus = "local" | "saving" | "saved" | "failed";

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (event: string, callback: () => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
    selectionChanged?: () => void;
  };
};

type RunnerWindow = Window & {
  Telegram?: { WebApp?: TelegramWebApp };
  TelegramGameProxy?: { shareScore?: () => void };
  webkitAudioContext?: typeof AudioContext;
};

type GameDom = {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pauseButton: HTMLButtonElement;
  score: HTMLElement;
  crops: HTMLElement;
  combo: HTMLElement;
  scorePill: HTMLElement;
  cropsPill: HTMLElement;
  comboPill: HTMLElement;
  shield: HTMLElement;
  magnet: HTMLElement;
  message: HTMLElement;
};

const runnerWindow = window as RunnerWindow;
let telegram = runnerWindow.Telegram?.WebApp;
const appRoot = document.querySelector<HTMLElement>("#app");

if (!appRoot) throw new Error("Runner root element was not found");
const app: HTMLElement = appRoot;

const launch = parseRunnerLaunchParams(window.location.href);
const query = new URLSearchParams(window.location.search);
const language = resolveLanguage();
const petType = resolvePetType();
const storage = safeStorage();
const hasBrokenRewardLaunch = hasAnyRewardParam() && launch.reward.mode !== "server";
const rewardRunWasConsumedOnLoad = isCurrentRewardRunConsumed();
const tr = (key: RunnerTextKey, variables: RunnerTextVariables = {}): string =>
  translate(language, key, variables);

let state = createRunnerInitialState();
let bestScore = loadInitialBestScore();
let rewardAttemptAvailable = launch.reward.mode === "server" && !rewardRunWasConsumedOnLoad;
let currentRunHasReward = false;
let currentFinisher: RunnerRewardFinisher | null = null;
let finalResult: RunnerFinalResult | null = null;
let rewardStatus: RewardUiStatus = "local";
let rewardWasDuplicate = false;
let telegramScoreReady = false;
let currentRunToken = 0;
let isNewRecord = false;
let gameDom: GameDom | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let lastFrameAt = 0;
let accumulatorMs = 0;
let closingConfirmationEnabled: boolean | null = null;
let intentionalNavigation = false;
let toastTimer: number | null = null;
let audioContext: AudioContext | null = null;

document.documentElement.lang = language;
document.title = tr("app_title");
configureTelegram();
window.addEventListener("load", refreshTelegramBridge, { once: true });
bindGlobalEvents();
renderPreview();

function resolveLanguage(): RunnerLang {
  const payloadLanguage = launch.payload?.lang ?? launch.payload?.language;
  return normalizeRunnerLang(query.get("lang") || query.get("language") || payloadLanguage || initialRunnerLang());
}

function resolvePetType(): RunnerPetType {
  const candidate = query.get("pet_type")
    || query.get("petType")
    || textValue(launch.payload?.pet_type)
    || textValue(launch.payload?.petType);
  return candidate?.toLowerCase() === "dog" ? "dog" : "cat";
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasAnyRewardParam(): boolean {
  return ["run_id", "token", "finish_url"].some((name) => query.has(name));
}

function currentRewardStorageKey(): string | null {
  return launch.reward.mode === "server" && launch.reward.runId
    ? `runner-reward-run-used-v1:${launch.reward.runId}`
    : null;
}

function isCurrentRewardRunConsumed(): boolean {
  const key = currentRewardStorageKey();
  if (!storage || !key) return false;
  try {
    return storage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markCurrentRewardRunConsumed(): void {
  const key = currentRewardStorageKey();
  if (!storage || !key) return;
  try {
    storage.setItem(key, "1");
  } catch {
    // The backend remains authoritative when storage is unavailable.
  }
}

function safeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadInitialBestScore(): number {
  const current = loadRunnerBestScore(storage);
  if (current > 0 || !storage) return current;

  // Keep the record of returning players from the legacy one-file Runner.
  try {
    const legacy = Number(storage.getItem("bestScore"));
    if (!Number.isFinite(legacy) || legacy <= 0) return current;
    return saveRunnerBestScore(storage, legacy);
  } catch {
    return current;
  }
}

function configureTelegram(): void {
  try {
    telegram?.ready?.();
    telegram?.expand?.();
    telegram?.disableVerticalSwipes?.();
    telegram?.setHeaderColor?.("#fff8df");
    telegram?.setBackgroundColor?.("#d8ebc9");
    telegram?.onEvent?.("viewportChanged", syncTelegramViewport);
  } catch {
    // The standalone browser version must remain playable without Telegram.
  }
  syncTelegramViewport();
}

function refreshTelegramBridge(): void {
  const loadedTelegram = runnerWindow.Telegram?.WebApp;
  if (!loadedTelegram || loadedTelegram === telegram) return;
  telegram = loadedTelegram;
  closingConfirmationEnabled = null;
  configureTelegram();
  syncClosingConfirmation();
}

function syncTelegramViewport(): void {
  const current = finitePositive(telegram?.viewportHeight) || window.innerHeight;
  const stable = finitePositive(telegram?.viewportStableHeight) || current;
  document.documentElement.style.setProperty("--tg-viewport-height", `${Math.round(current)}px`);
  document.documentElement.style.setProperty("--tg-viewport-stable-height", `${Math.round(stable)}px`);
}

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function bindGlobalEvents(): void {
  window.addEventListener("resize", syncTelegramViewport, { passive: true });
  window.addEventListener("beforeunload", (event) => {
    if (intentionalNavigation || !shouldProtectCurrentRun()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("pageshow", () => {
    intentionalNavigation = false;
    syncClosingConfirmation();
    if (state.phase === "running" && gameDom && rafId === null) startAnimationLoop();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden || state.phase !== "running") return;
    state = pauseRunner(state);
    stopAnimationLoop();
    updateGameDom();
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat && ["Enter", "Space", "ArrowUp", "KeyP", "Escape"].includes(event.code)) {
      return;
    }
    if (event.code === "Enter" && event.target instanceof HTMLCanvasElement) {
      event.preventDefault();
      handleJump();
      return;
    }
    if (event.code === "Space" || event.code === "ArrowUp") {
      if (isInteractiveTarget(event.target)) return;
      if (state.phase === "running") {
        event.preventDefault();
        handleJump();
      }
      return;
    }
    if (event.code === "KeyP" || event.code === "Escape") {
      if (state.phase === "running" || state.phase === "paused") {
        event.preventDefault();
        togglePause();
      }
    }
  });
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLButtonElement
    || target instanceof HTMLAnchorElement
    || target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement;
}

function renderPreview(): void {
  tearDownGameView();
  state = createRunnerInitialState(state.world.width, state.world.height);
  currentFinisher = null;
  finalResult = null;
  currentRunHasReward = false;
  rewardStatus = "local";
  rewardWasDuplicate = false;
  telegramScoreReady = false;
  syncClosingConfirmation();

  app.innerHTML = `
    <main class="runner-shell">
      <section class="runner-card" aria-labelledby="runner-preview-title">
        <div class="runner-preview">
          <button class="back-button" type="button" data-action="games" aria-label="${escapeHtml(tr("a11y_back_to_games"))}">
            ${escapeHtml(tr("back_to_games"))}
          </button>
          <span class="preview-badge">🐾 ${escapeHtml(tr("app_eyebrow"))}</span>
          <div class="preview-scene" aria-hidden="true">
            <span class="preview-pet ${petType === "dog" ? "is-dog" : ""}"></span>
            <span class="preview-crops">● ● ●</span>
            <span class="preview-crate"></span>
          </div>
          <h1 id="runner-preview-title">${escapeHtml(tr("preview_heading"))}</h1>
          <p>${escapeHtml(tr("preview_body"))}</p>
          <div class="preview-rules" aria-label="${escapeHtml(tr("controls_heading"))}">
            <div class="preview-rule"><span aria-hidden="true">☝️</span><strong>${escapeHtml(tr("control_single_tap"))}</strong></div>
            <div class="preview-rule"><span aria-hidden="true">✌️</span><strong>${escapeHtml(tr("control_double_tap"))}</strong></div>
          </div>
          ${hasBrokenRewardLaunch ? `<p class="reward-line is-error">${escapeHtml(tr("reward_launch_invalid"))}</p>` : ""}
          ${rewardRunWasConsumedOnLoad && !hasBrokenRewardLaunch ? `<p class="reward-line">${escapeHtml(tr("practice_note"))}</p>` : ""}
          <button class="primary-button" type="button" data-action="start" ${hasBrokenRewardLaunch ? "disabled" : ""}>
            ${escapeHtml(tr("start_run"))}
          </button>
          <div class="preview-best">${escapeHtml(tr("preview_best", { score: bestScore }))}</div>
        </div>
      </section>
    </main>`;

  app.querySelector<HTMLButtonElement>("[data-action='games']")?.addEventListener("click", navigateToGames);
  app.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", startNewRun);
}

function startNewRun(): void {
  if (hasBrokenRewardLaunch) return;
  ensureAudio();
  currentRunToken += 1;
  currentRunHasReward = rewardAttemptAvailable;
  if (currentRunHasReward) {
    rewardAttemptAvailable = false;
    markCurrentRewardRunConsumed();
  }
  currentFinisher = null;
  finalResult = null;
  rewardStatus = currentRunHasReward ? "saving" : "local";
  rewardWasDuplicate = false;
  telegramScoreReady = false;
  isNewRecord = false;
  state = startRunner(createRunnerInitialState(state.world.width, state.world.height));
  renderGame();
  syncClosingConfirmation();
}

function renderGame(): void {
  tearDownGameView();
  app.innerHTML = `
    <main class="runner-shell">
      <section class="runner-card is-playing" aria-label="${escapeHtml(tr("app_title"))}">
        <header class="game-topbar">
          <button class="icon-button" type="button" data-action="games" aria-label="${escapeHtml(tr("a11y_back_to_games"))}">←</button>
          <div class="game-title">
            <strong>🐾 ${escapeHtml(tr("app_title"))}</strong>
            <small>${escapeHtml(tr("preview_best", { score: bestScore }))}</small>
          </div>
          <button class="icon-button" type="button" data-action="pause" aria-label="${escapeHtml(tr("a11y_pause"))}" disabled>⏸</button>
        </header>
        <div class="runner-stage">
          <canvas tabindex="0" role="button" aria-label="${escapeHtml(`${tr("a11y_jump")}. ${tr("a11y_game")}`)}"></canvas>
          <div class="runner-hud">
            <div class="hud-pill" data-hud="score"><small>${escapeHtml(tr("hud_score"))}</small><strong>0</strong></div>
            <div class="hud-pill" data-hud="crops"><small>${escapeHtml(tr("hud_crops"))}</small><strong>0</strong></div>
            <div class="hud-pill" data-hud="combo"><small>${escapeHtml(tr("hud_combo"))}</small><strong>×0</strong></div>
          </div>
          <div class="powerup-strip" aria-label="${escapeHtml(tr("a11y_powerups"))}">
            <span class="powerup-chip" data-powerup="shield">🛡️ ${escapeHtml(tr("powerup_shield"))}</span>
            <span class="powerup-chip" data-powerup="magnet">🧲 ${escapeHtml(tr("powerup_magnet"))}</span>
          </div>
          <div class="stage-message is-visible" role="status" aria-live="assertive">3</div>
        </div>
        <div class="tap-hint">${escapeHtml(tr("tap_hint"))}</div>
      </section>
    </main>`;

  const stage = requiredElement<HTMLElement>(".runner-stage");
  const canvas = requiredElement<HTMLCanvasElement>("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available");

  gameDom = {
    stage,
    canvas,
    context,
    pauseButton: requiredElement<HTMLButtonElement>("[data-action='pause']"),
    score: requiredElement<HTMLElement>("[data-hud='score'] strong"),
    crops: requiredElement<HTMLElement>("[data-hud='crops'] strong"),
    combo: requiredElement<HTMLElement>("[data-hud='combo'] strong"),
    scorePill: requiredElement<HTMLElement>("[data-hud='score']"),
    cropsPill: requiredElement<HTMLElement>("[data-hud='crops']"),
    comboPill: requiredElement<HTMLElement>("[data-hud='combo']"),
    shield: requiredElement<HTMLElement>("[data-powerup='shield']"),
    magnet: requiredElement<HTMLElement>("[data-powerup='magnet']"),
    message: requiredElement<HTMLElement>(".stage-message"),
  };

  requiredElement<HTMLButtonElement>("[data-action='games']").addEventListener("click", navigateToGames);
  gameDom.pauseButton.addEventListener("click", togglePause);
  canvas.addEventListener("pointerdown", () => {
    if (state.phase === "paused") togglePause();
    else handleJump();
  }, { passive: true });

  resizeObserver = new ResizeObserver(syncCanvasSize);
  resizeObserver.observe(stage);
  requestAnimationFrame(() => {
    syncCanvasSize();
    canvas.focus({ preventScroll: true });
    startAnimationLoop();
  });
}

function requiredElement<T extends Element>(selector: string): T {
  const element = app.querySelector<T>(selector);
  if (!element) throw new Error(`Runner element was not found: ${selector}`);
  return element;
}

function syncCanvasSize(): void {
  if (!gameDom) return;
  const rect = gameDom.canvas.getBoundingClientRect();
  const visibleWidth = Math.max(1, Math.round(rect.width));
  const visibleHeight = Math.max(1, Math.round(rect.height));
  const viewScale = Math.min(1, visibleWidth / 240, visibleHeight / 320);
  const worldWidth = Math.max(240, Math.round(visibleWidth / viewScale));
  const worldHeight = Math.max(320, Math.round(visibleHeight / viewScale));
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const pixelWidth = Math.round(visibleWidth * dpr);
  const pixelHeight = Math.round(visibleHeight * dpr);

  if (gameDom.canvas.width !== pixelWidth || gameDom.canvas.height !== pixelHeight) {
    gameDom.canvas.width = pixelWidth;
    gameDom.canvas.height = pixelHeight;
  }
  gameDom.context.setTransform(dpr * viewScale, 0, 0, dpr * viewScale, 0, 0);
  state = resizeRunnerWorld(state, worldWidth, worldHeight);
  drawRunnerFrame(gameDom.context, state, petType);
}

function startAnimationLoop(): void {
  stopAnimationLoop();
  lastFrameAt = performance.now();
  accumulatorMs = 0;
  rafId = requestAnimationFrame(runFrame);
}

function stopAnimationLoop(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function runFrame(timestamp: number): void {
  rafId = null;
  if (!gameDom || (state.phase !== "countdown" && state.phase !== "running")) return;

  const frameDelta = Math.min(250, Math.max(0, timestamp - lastFrameAt));
  lastFrameAt = timestamp;
  accumulatorMs += frameDelta;
  const before = state;
  let steps = 0;

  while (accumulatorMs >= RUNNER_STEP_MS && steps < 15) {
    state = stepRunner(state);
    accumulatorMs -= RUNNER_STEP_MS;
    steps += 1;
    if (state.phase === "gameover") break;
  }
  if (steps >= 15) accumulatorMs = 0;

  emitGameEffects(before, state);
  drawRunnerFrame(gameDom.context, state, petType);
  updateGameDom();

  if (state.phase === "gameover") {
    handleGameOver();
    return;
  }
  rafId = requestAnimationFrame(runFrame);
}

function emitGameEffects(before: RunnerState, after: RunnerState): void {
  if (after.crops > before.crops) {
    playTone(860, 0.08, "sine");
    hapticSelection();
  }
  if (before.player.shieldRemainingMs <= 0 && after.player.shieldRemainingMs > 0) {
    playTone(520, 0.14, "sine");
    hapticImpact("light");
  }
  if (before.player.magnetRemainingMs <= 0 && after.player.magnetRemainingMs > 0) {
    playTone(660, 0.14, "triangle");
    hapticImpact("light");
  }
  if (before.player.shieldRemainingMs > 0 && after.player.shieldRemainingMs <= 0
    && after.player.invulnerableRemainingMs > 0) {
    playTone(150, 0.16, "square");
    hapticImpact("heavy");
  }
  if (after.phase === "gameover" && before.phase !== "gameover") {
    playTone(105, 0.22, "triangle");
    hapticNotification("error");
  }
}

function updateGameDom(): void {
  if (!gameDom) return;
  const score = Math.floor(state.score);
  gameDom.score.textContent = String(score);
  gameDom.crops.textContent = String(state.crops);
  gameDom.combo.textContent = `×${state.combo}`;
  gameDom.scorePill.setAttribute("aria-label", tr("a11y_score", { score }));
  gameDom.cropsPill.setAttribute("aria-label", tr("a11y_crops", { crops: state.crops }));
  gameDom.comboPill.setAttribute("aria-label", tr("a11y_combo", { combo: state.combo }));

  updatePowerup(gameDom.shield, state.player.shieldRemainingMs, tr("powerup_shield"), tr("a11y_shield_active"));
  updatePowerup(gameDom.magnet, state.player.magnetRemainingMs, tr("powerup_magnet"), tr("a11y_magnet_active"));

  gameDom.pauseButton.textContent = state.phase === "paused" ? "▶" : "⏸";
  gameDom.pauseButton.disabled = state.phase === "countdown";
  gameDom.pauseButton.setAttribute(
    "aria-label",
    state.phase === "paused" ? tr("a11y_resume") : tr("a11y_pause"),
  );

  gameDom.message.classList.toggle("is-visible", shouldShowStageMessage());
  gameDom.message.classList.toggle("is-paused", state.phase === "paused");
  const message = stageMessage();
  if (gameDom.message.textContent !== message) gameDom.message.textContent = message;
}

function updatePowerup(element: HTMLElement, remainingMs: number, label: string, ariaLabel: string): void {
  const visible = remainingMs > 0;
  const seconds = Math.ceil(remainingMs / 1000);
  element.classList.toggle("is-visible", visible);
  element.textContent = `${element.dataset.powerup === "shield" ? "🛡️" : "🧲"} ${label} ${seconds}${language === "en" ? "s" : "с"}`;
  element.setAttribute("aria-label", visible ? `${ariaLabel}: ${seconds}` : "");
}

function shouldShowStageMessage(): boolean {
  return state.phase === "countdown" || state.phase === "paused" || (state.phase === "running" && state.activeMs < 550);
}

function stageMessage(): string {
  if (state.phase === "paused") return tr("resume");
  if (state.phase === "countdown") return String(Math.max(1, Math.ceil(state.countdownRemainingMs / 1000)));
  if (state.phase === "running" && state.activeMs < 550) return tr("countdown_go");
  return "";
}

function handleJump(): void {
  ensureAudio();
  const before = state;
  state = jumpRunner(state);
  if (state !== before) {
    playTone(state.player.jumpsUsed === 1 ? 280 : 390, 0.055, "triangle");
    hapticImpact("light");
  }
}

function togglePause(): void {
  if (state.phase === "running") {
    state = pauseRunner(state);
    stopAnimationLoop();
    updateGameDom();
    syncClosingConfirmation();
    return;
  }
  if (state.phase !== "paused") return;
  state = resumeRunner(state);
  updateGameDom();
  startAnimationLoop();
  syncClosingConfirmation();
}

function handleGameOver(): void {
  stopAnimationLoop();
  const token = currentRunToken;
  finalResult = captureRunnerFinalResult(Math.floor(state.score), state.activeMs);
  const oldBest = bestScore;
  bestScore = saveRunnerBestScore(storage, finalResult.score);
  isNewRecord = finalResult.score > oldBest;
  currentFinisher = createRunnerRewardFinisher(
    currentRunHasReward ? launch.reward : { mode: "local", runId: null, token: null, finishUrl: null },
    finalResult,
  );
  rewardStatus = currentRunHasReward ? "saving" : "local";
  rewardWasDuplicate = false;
  telegramScoreReady = false;
  renderResult("result");

  void submitRunnerTelegramScore(launch.payload, finalResult).then((result) => {
    if (!result.ok && !result.skipped) console.warn("Runner Telegram score was not updated:", result.error);
    if (token !== currentRunToken || state.phase !== "gameover") return;
    telegramScoreReady = result.ok && !result.skipped;
    if (telegramScoreReady) enableShareAction();
  });

  if (currentRunHasReward) void finishReward(token);
  else syncClosingConfirmation();
}

async function finishReward(token: number): Promise<void> {
  if (!currentFinisher || !currentRunHasReward) return;
  if (rewardStatus !== "saving") {
    rewardStatus = "saving";
    renderResult("reward");
  }
  syncClosingConfirmation();
  const result = await currentFinisher.finish();
  if (token !== currentRunToken || !finalResult) return;
  rewardWasDuplicate = result.duplicate;
  rewardStatus = result.ok ? "saved" : "failed";
  renderResult("reward");
  syncClosingConfirmation();
  if (result.ok) hapticNotification("success");
}

function renderResult(focusTarget: "result" | "reward" | null = null): void {
  if (!finalResult) return;
  tearDownGameView();
  const score = finalResult.score;
  const time = formatDuration(finalResult.durationMs);
  const serverAttemptHandled = launch.reward.mode === "server" && !rewardAttemptAvailable;
  const replayLabel = serverAttemptHandled ? tr("practice_replay") : tr("replay");
  const rewardClass = rewardStatus === "failed" ? "reward-line is-error" : "reward-line";
  const resultBadge = isNewRecord ? tr("new_record", { score }) : tr("game_over");
  const shareAvailable = telegramScoreReady
    && typeof runnerWindow.TelegramGameProxy?.shareScore === "function";
  const actions = resultActions(replayLabel, shareAvailable);

  app.innerHTML = `
    <main class="runner-shell">
      <section class="runner-card" tabindex="-1" aria-labelledby="runner-result-title" aria-label="${escapeHtml(tr("a11y_results"))}">
        <div class="runner-result">
          <span class="result-badge">${escapeHtml(resultBadge)}</span>
          <h1 id="runner-result-title">${escapeHtml(tr("result_heading"))}</h1>
          <div class="result-score"><strong>${score}</strong><small>${escapeHtml(tr("hud_score"))}</small></div>
          <div class="result-grid">
            <div class="result-stat"><strong>${escapeHtml(time)}</strong><small>${escapeHtml(tr("result_time_label"))}</small></div>
            <div class="result-stat"><strong>${state.crops}</strong><small>${escapeHtml(tr("result_crops_label"))}</small></div>
            <div class="result-stat"><strong>×${state.bestCombo}</strong><small>${escapeHtml(tr("result_combo_label"))}</small></div>
          </div>
          <p>${escapeHtml(tr("result_summary", { score, time, crops: state.crops, combo: state.bestCombo }))}</p>
          <p class="${rewardClass}" tabindex="-1" role="status" aria-live="polite">${escapeHtml(rewardStatusText())}</p>
          ${rewardStatus === "saved" && serverAttemptHandled ? `<p class="preview-best">${escapeHtml(tr("practice_note"))}</p>` : ""}
          <div class="result-actions">${actions}</div>
        </div>
      </section>
    </main>`;

  app.querySelector<HTMLButtonElement>("[data-action='retry-save']")?.addEventListener("click", () => {
    void finishReward(currentRunToken);
  });
  app.querySelector<HTMLButtonElement>("[data-action='replay']")?.addEventListener("click", startNewRun);
  app.querySelector<HTMLButtonElement>("[data-action='share']")?.addEventListener("click", shareScore);
  app.querySelector<HTMLButtonElement>("[data-action='games']")?.addEventListener("click", navigateToGames);
  if (focusTarget) {
    requestAnimationFrame(() => {
      const selector = focusTarget === "reward" ? ".reward-line" : ".runner-card";
      app.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
    });
  }
}

function resultActions(replayLabel: string, shareAvailable: boolean): string {
  if (rewardStatus === "saving") {
    return `
      <button class="primary-button" type="button" disabled>${escapeHtml(tr("reward_saving"))}</button>
      <button class="secondary-button" type="button" disabled>${escapeHtml(tr("back_to_games"))}</button>`;
  }
  if (rewardStatus === "failed") {
    return `
      <button class="primary-button" type="button" data-action="retry-save">${escapeHtml(tr("reward_retry"))}</button>
      <button class="secondary-button" type="button" data-action="games">${escapeHtml(tr("back_to_games"))}</button>`;
  }

  return `
    <button class="primary-button" type="button" data-action="replay">${escapeHtml(replayLabel)}</button>
    ${shareAvailable ? `<button class="secondary-button" type="button" data-action="share">${escapeHtml(tr("share_score"))}</button>` : ""}
    <button class="secondary-button" type="button" data-action="games">${escapeHtml(tr("back_to_games"))}</button>`;
}

function rewardStatusText(): string {
  if (rewardStatus === "saving") return tr("reward_saving");
  if (rewardStatus === "saved") return rewardWasDuplicate ? tr("reward_already_saved") : tr("reward_saved");
  if (rewardStatus === "failed") return tr("reward_failed");
  return tr("reward_local");
}

function enableShareAction(): void {
  if (rewardStatus === "saving" || rewardStatus === "failed") return;
  if (typeof runnerWindow.TelegramGameProxy?.shareScore !== "function") return;
  const actions = app.querySelector<HTMLElement>(".result-actions");
  const gamesButton = actions?.querySelector<HTMLButtonElement>("[data-action='games']");
  if (!actions || actions.querySelector("[data-action='share']")) return;
  const shareButton = document.createElement("button");
  shareButton.className = "secondary-button";
  shareButton.type = "button";
  shareButton.dataset.action = "share";
  shareButton.textContent = tr("share_score");
  shareButton.addEventListener("click", shareScore);
  actions.insertBefore(shareButton, gamesButton || null);
}

function navigateToGames(): void {
  if (shouldProtectCurrentRun() && !window.confirm(tr("leave_confirm"))) return;
  intentionalNavigation = true;
  disableClosingConfirmation();
  try {
    window.location.assign(resolveGamesUrl());
  } catch {
    intentionalNavigation = false;
    syncClosingConfirmation();
  }
}

function resolveGamesUrl(): string {
  const requested = query.get("hub_url");
  if (requested) {
    try {
      const target = new URL(requested, window.location.href);
      if (target.origin === window.location.origin && ["http:", "https:"].includes(target.protocol)) {
        return target.toString();
      }
    } catch {
      // Fall back to the known same-origin games hub.
    }
  }
  return new URL("/farm-paws/", window.location.origin).toString();
}

function shouldProtectCurrentRun(): boolean {
  const active = state.phase === "countdown" || state.phase === "running" || state.phase === "paused";
  const unsavedReward = currentRunHasReward && (rewardStatus === "saving" || rewardStatus === "failed");
  return active || unsavedReward;
}

function syncClosingConfirmation(): void {
  const desired = shouldProtectCurrentRun();
  if (desired === closingConfirmationEnabled) return;
  try {
    if (desired) telegram?.enableClosingConfirmation?.();
    else telegram?.disableClosingConfirmation?.();
    closingConfirmationEnabled = desired;
  } catch {
    closingConfirmationEnabled = desired;
  }
}

function disableClosingConfirmation(): void {
  if (closingConfirmationEnabled === false) return;
  try {
    telegram?.disableClosingConfirmation?.();
  } catch {
    // Ignore Telegram bridge errors during navigation.
  }
  closingConfirmationEnabled = false;
}

function shareScore(): void {
  try {
    runnerWindow.TelegramGameProxy?.shareScore?.();
    hapticSelection();
  } catch {
    showToast(tr("share_score"));
  }
}

function tearDownGameView(): void {
  stopAnimationLoop();
  resizeObserver?.disconnect();
  resizeObserver = null;
  gameDom = null;
}

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, durationMs) / 1000;
  const formatted = new Intl.NumberFormat(language === "uk" ? "uk-UA" : language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(seconds);
  return `${formatted} ${language === "en" ? "s" : "с"}`;
}

function ensureAudio(): void {
  if (audioContext) {
    if (audioContext.state === "suspended") void audioContext.resume();
    return;
  }
  try {
    const Context = window.AudioContext || runnerWindow.webkitAudioContext;
    if (Context) audioContext = new Context();
  } catch {
    audioContext = null;
  }
}

function playTone(frequency: number, durationSeconds: number, type: OscillatorType): void {
  if (!audioContext) return;
  try {
    const start = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + durationSeconds + 0.02);
  } catch {
    // Audio feedback is optional.
  }
}

function hapticImpact(style: "light" | "medium" | "heavy"): void {
  try {
    telegram?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    // Haptics are optional outside Telegram.
  }
}

function hapticSelection(): void {
  try {
    telegram?.HapticFeedback?.selectionChanged?.();
  } catch {
    // Haptics are optional outside Telegram.
  }
}

function hapticNotification(type: "error" | "success" | "warning"): void {
  try {
    telegram?.HapticFeedback?.notificationOccurred?.(type);
  } catch {
    // Haptics are optional outside Telegram.
  }
}

function showToast(message: string): void {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 2200);
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
