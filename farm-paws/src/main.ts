import "./styles.css";
import catGuideUrl from "./assets/cat-guide.webp";
import catGuideSadUrl from "./assets/cat-guide-sad.webp";
import dogGuideUrl from "./assets/dog-guide.webp";
import dogGuideSadUrl from "./assets/dog-guide-sad.webp";
import {
  FarmPawsFinishResult,
  FarmPawsRunSession,
  finishFarmPawsRun,
  startFarmPawsRun
} from "./api";
import {
  GameState,
  defaultPlotEmojis,
  handleCellInput,
  markReadyForInput,
  mockPetXpForScore,
  showDurationForRound,
  startGame,
  startNextRound
} from "./gameState";
import {
  type FarmPawsLang,
  type FarmPawsTextKey,
  initialFarmPawsLang,
  tfp
} from "./i18n";
import { type SnakeController, mountSnakeController } from "./snakeController";
import { loadBestScore, loadSnakeBestScore, saveBestScore } from "./storage";

type AppScreen = "games" | "farm-paws" | "snake";

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  close?: () => void;
};

type ActiveStep = {
  cellIndex: number;
  stepNumber: number;
  totalSteps: number;
} | null;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const appRoot = requireAppRoot();
let activeLang: FarmPawsLang = initialFarmPawsLang();
let appScreen: AppScreen = "games";
let snakeController: SnakeController | null = null;

let state: GameState = {
  phase: "idle",
  round: 1,
  score: 0,
  bestScore: loadBestScore(),
  hp: 3,
  maxHp: 3,
  plotEmojis: defaultPlotEmojis(),
  sequence: [],
  inputIndex: 0,
  lastInputCell: null,
  lastInputStatus: null
};
let activeStep: ActiveStep = null;
let runToken = 0;
let currentRun: FarmPawsRunSession = {
  mode: "local",
  game: "farm_paws",
  runId: null,
  bestScore: state.bestScore,
  error: null,
  petName: null,
  petType: null,
  lang: activeLang
};
let runStartedAt = 0;
let runFinishedAt = 0;
let isStartingRun = false;
let finishPending = false;
let finishResult: FarmPawsFinishResult | null = null;
let finishError: string | null = null;
let startBlockMessage: string | null = null;

initTelegramWebApp();
render();

function initTelegramWebApp(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  try {
    webApp.ready?.();
    webApp.expand?.();
    webApp.setHeaderColor?.("#fff8df");
    webApp.setBackgroundColor?.("#fff8df");
    webApp.disableVerticalSwipes?.();
  } catch {
    // Telegram WebApp methods can vary by client version.
  }
}

function requireAppRoot(): HTMLDivElement {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    throw new Error("App root was not found.");
  }
  return root;
}

function tr(key: FarmPawsTextKey, vars: Record<string, string | number> = {}): string {
  return tfp(activeLang, key, vars);
}

function render(): void {
  snakeController?.destroy();
  snakeController = null;
  document.documentElement.lang = activeLang;
  document.title = appScreen === "games"
    ? tr("games_app_title")
    : tr(appScreen === "snake" ? "snake_title" : "app_title");
  const cardClasses = [
    "game-card",
    appScreen === "games" ? "is-game-picker" : "",
    appScreen === "snake" ? "is-snake" : "",
    appScreen === "farm-paws" && state.phase === "failed" ? "is-failed" : ""
  ].filter(Boolean).join(" ");
  const screenContent = appScreen === "games"
    ? renderGamePicker()
    : appScreen === "snake"
      ? '<div class="snake-mount" data-snake-root></div>'
      : state.phase === "idle"
        ? renderStartScreen()
        : renderGameScreen();

  appRoot.innerHTML = `
    <main class="phone-shell">
      <section class="${cardClasses}">
        ${screenContent}
      </section>
    </main>
  `;

  if (appScreen === "snake") {
    const snakeRoot = appRoot.querySelector<HTMLElement>("[data-snake-root]");
    if (!snakeRoot) throw new Error("Snake root was not found.");
    snakeController = mountSnakeController(snakeRoot, {
      tr,
      onBack: showGamePicker,
      onLanguageChange: (lang) => {
        activeLang = lang;
        document.documentElement.lang = lang;
        document.title = tr("snake_title");
      },
      startBlockedText
    });
    return;
  }

  appRoot.querySelector<HTMLButtonElement>("[data-action='open-farm-paws']")
    ?.addEventListener("click", openFarmPaws);
  appRoot.querySelector<HTMLButtonElement>("[data-action='open-snake']")
    ?.addEventListener("click", openSnake);
  appRoot.querySelector<HTMLButtonElement>("[data-action='games']")
    ?.addEventListener("click", showGamePicker);
  appRoot.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", beginGame);
  appRoot.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", beginGame);
  appRoot.querySelector<HTMLButtonElement>("[data-action='retry-finish']")
    ?.addEventListener("click", () => void finishCurrentRun(runToken));
  appRoot.querySelector<HTMLButtonElement>("[data-action='home']")?.addEventListener("click", exitMiniApp);

  appRoot.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((button) => {
    button.addEventListener("click", () => {
      const cellIndex = Number.parseInt(button.dataset.cell || "-1", 10);
      onCellClick(cellIndex);
    });
  });
}

function renderGamePicker(): string {
  return `
    <div class="game-picker">
      <div class="game-picker-badge" aria-hidden="true">🎮</div>
      <p class="eyebrow">${escapeHtml(tr("games_eyebrow"))}</p>
      <h1>${escapeHtml(tr("games_title"))}</h1>
      <p class="lead">${escapeHtml(tr("games_lead"))}</p>
      <div class="game-choice-list">
        <button class="game-choice-card is-farm" data-action="open-farm-paws" type="button">
          <span class="game-choice-icon" aria-hidden="true">🐾</span>
          <span class="game-choice-copy">
            <strong>${escapeHtml(tr("app_title"))}</strong>
            <small>${escapeHtml(tr("farm_card_description"))}</small>
            <span class="game-choice-meta">${escapeHtml(tr("open_game"))} · ${escapeHtml(tr("best_result", { score: state.bestScore }))}</span>
          </span>
          <span class="game-choice-arrow" aria-hidden="true">›</span>
        </button>
        <button class="game-choice-card is-snake" data-action="open-snake" type="button">
          <span class="game-choice-icon" aria-hidden="true">🐍</span>
          <span class="game-choice-copy">
            <strong>${escapeHtml(tr("snake_title"))}</strong>
            <small>${escapeHtml(tr("snake_description"))}</small>
            <span class="game-choice-meta">${escapeHtml(tr("open_game"))} · ${escapeHtml(tr("best_result", { score: loadSnakeBestScore() }))}</span>
          </span>
          <span class="game-choice-arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  `;
}

function renderStartScreen(): string {
  return `
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">${escapeHtml(tr("start_eyebrow"))}</p>
      <h1>${escapeHtml(tr("app_title"))}</h1>
      <p class="lead">${escapeHtml(tr("start_lead"))}</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({ length: 9 }, (_, index) => `<span class="preview-plot">${previewEmoji(index)}</span>`).join("")}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${isStartingRun ? "disabled" : ""}>${escapeHtml(isStartingRun ? tr("start_busy") : tr("start_play"))}</button>
      ${startBlockMessage ? `<p class="start-warning">${escapeHtml(startBlockMessage)}</p>` : ""}
      <p class="best-note">${escapeHtml(tr("best_result", { score: state.bestScore }))}</p>
      <button class="back-button farm-picker-button" data-action="games" type="button" ${isStartingRun ? "disabled" : ""}>${escapeHtml(tr("back_to_games"))}</button>
    </div>
  `;
}

function renderGameScreen(): string {
  const failed = state.phase === "failed";
  return `
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 ${escapeHtml(tr("app_title"))}</p>
        <h1>${escapeHtml(failed ? tr("run_finished") : tr("round_title", { round: state.round }))}</h1>
      </div>
      <div class="score-pill">
        <span>${state.score}</span>
        <small>${escapeHtml(tr("score_unit"))}</small>
      </div>
    </header>

    <section class="stats-row" aria-label="${escapeHtml(tr("stats_label"))}">
      <span>${escapeHtml(tr("round_label"))}: <strong>${state.round}</strong></span>
      <span>${escapeHtml(tr("record_label"))}: <strong>${state.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="${escapeHtml(tr("lives_label"))}">
      <span>${escapeHtml(currentRun.petName || tr("default_pet"))}</span>
      <strong>${renderHearts()}</strong>
    </section>

    ${failed ? renderResultPanel() : renderPlayPanel()}
  `;
}

function renderPlayPanel(): string {
  return `
    <div class="status-line ${statusClass()}">${escapeHtml(statusText())}</div>
    <div class="farm-grid" aria-label="${escapeHtml(tr("grid_label"))}">
      ${Array.from({ length: 9 }, (_, index) => renderCell(index)).join("")}
    </div>
    <div class="cat-guide-panel" aria-label="${escapeHtml(tr("pet_guide_label"))}">
      <img class="cat-guide-image ${petGuideClassName()}" src="${petGuideImageUrl(false)}" alt="" />
    </div>
  `;
}

function renderResultPanel(): string {
  const shouldRetryFinish = currentRun.mode === "server"
    && finishResult?.mode === "server"
    && !finishResult.ok;
  const primaryAction = shouldRetryFinish ? "retry-finish" : "retry";
  const primaryText = finishPending
    ? tr("reward_saving")
    : tr(shouldRetryFinish ? "retry_save" : "retry_button");
  return `
    <div class="result-panel">
      <img class="result-cat-image ${petTypeClass()}" src="${petGuideImageUrl(true)}" alt="" />
      <h2>${escapeHtml(tr("result_title", { score: state.score }))}</h2>
      <p>${escapeHtml(tr("hearts_ended"))}</p>
      <p>${escapeHtml(tr("best_result", { score: state.bestScore }))}</p>
      <p class="reward-line" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(rewardText())}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="${primaryAction}" ${finishPending ? "disabled" : ""}>${escapeHtml(primaryText)}</button>
        <button class="secondary-button" data-action="home" ${finishPending ? "disabled" : ""}>${escapeHtml(tr("home_button"))}</button>
      </div>
    </div>
  `;
}

function renderCell(index: number): string {
  const isActive = activeStep?.cellIndex === index;
  const isLastCorrect = state.lastInputStatus === "correct" && state.lastInputCell === index;
  const isLastWrong = state.lastInputStatus === "wrong" && state.lastInputCell === index;
  const content = state.plotEmojis[index] || "🌱";
  const className = [
    "plot-button",
    isActive ? "is-active" : "",
    isLastCorrect ? "is-correct" : "",
    isLastWrong ? "is-wrong" : ""
  ].filter(Boolean).join(" ");

  return `
    <button class="${className}" data-cell="${index}" ${state.phase !== "input" ? "disabled" : ""} aria-label="${escapeHtml(tr("plot_label", { number: index + 1 }))}">
      <span class="plot-content">${content}</span>
      ${isActive ? `<span class="plot-pet" aria-hidden="true">🐕</span>` : ""}
    </button>
  `;
}

async function beginGame(): Promise<void> {
  if (appScreen !== "farm-paws" || isStartingRun || finishPending) return;

  runToken += 1;
  const token = runToken;
  const localBestScore = loadBestScore();
  activeStep = null;
  finishPending = false;
  finishResult = null;
  finishError = null;
  startBlockMessage = null;
  runFinishedAt = 0;
  isStartingRun = true;
  state = {
    ...state,
    phase: "idle",
    bestScore: Math.max(state.bestScore, localBestScore)
  };
  render();

  const run = await startFarmPawsRun(localBestScore);
  if (token !== runToken || appScreen !== "farm-paws") return;

  isStartingRun = false;
  activeLang = run.lang;
  if (run.mode === "blocked") {
    currentRun = run;
    startBlockMessage = startBlockedText(run);
    state = {
      ...state,
      phase: "idle",
      bestScore: Math.max(state.bestScore, run.bestScore)
    };
    render();
    showToast(startBlockMessage);
    return;
  }

  currentRun = run;
  runStartedAt = Date.now();
  state = startGame(run.bestScore);
  render();

  if (run.mode === "local" && run.error) {
    showToast(tr("local_run_toast"));
  }

  void playSequence(token);
}

async function playSequence(token: number): Promise<void> {
  const showMs = showDurationForRound(state.round);
  const gapMs = Math.max(110, Math.floor(showMs * 0.28));

  for (const [index, step] of state.sequence.entries()) {
    if (token !== runToken || appScreen !== "farm-paws") return;
    activeStep = {
      cellIndex: step.cellIndex,
      stepNumber: index + 1,
      totalSteps: state.sequence.length
    };
    render();
    await sleep(showMs);
    if (token !== runToken || appScreen !== "farm-paws") return;
    activeStep = {
      cellIndex: -1,
      stepNumber: index + 1,
      totalSteps: state.sequence.length
    };
    render();
    await sleep(gapMs);
  }

  if (token !== runToken || appScreen !== "farm-paws") return;
  state = markReadyForInput(state);
  render();
}

function onCellClick(cellIndex: number): void {
  if (appScreen !== "farm-paws") return;
  const token = runToken;
  const previousBestScore = state.bestScore;
  const result = handleCellInput(state, cellIndex);
  state = result.state;
  activeStep = null;

  if (state.bestScore > previousBestScore) {
    saveBestScore(state.bestScore);
  }

  render();

  if (result.result === "mistake") {
    window.setTimeout(() => {
      if (token !== runToken || state.phase !== "input" || state.lastInputStatus !== "wrong") return;
      state = {
        ...state,
        lastInputCell: null,
        lastInputStatus: null
      };
      render();
    }, 520);
  }

  if (result.result === "failed") {
    runFinishedAt = Date.now();
    void finishCurrentRun(token);
  }

  if (result.result === "roundComplete") {
    window.setTimeout(() => {
      if (token !== runToken) return;
      state = startNextRound(state);
      render();
      void playSequence(token);
    }, 700);
  }
}

async function finishCurrentRun(token: number): Promise<void> {
  if (finishPending || finishResult?.ok) return;

  finishPending = true;
  finishResult = null;
  finishError = null;
  render();

  const result = await finishFarmPawsRun(currentRun, {
    score: state.score,
    round: state.round,
    hpLeft: state.hp,
    durationMs: Math.max(0, (runFinishedAt || Date.now()) - runStartedAt)
  });
  if (token !== runToken || appScreen !== "farm-paws") return;

  finishPending = false;
  finishResult = result;
  finishError = result.ok ? null : result.error || "finish_failed";

  if (typeof result.bestScore === "number" && result.bestScore > state.bestScore) {
    state = {
      ...state,
      bestScore: result.bestScore
    };
    saveBestScore(result.bestScore);
  }

  render();
  if (!result.ok) {
    appRoot.querySelector<HTMLButtonElement>("[data-action='retry-finish']")?.focus();
  }
}

function statusText(): string {
  if (state.phase === "showing") {
    const stepNumber = activeStep?.stepNumber || 1;
    const totalSteps = activeStep?.totalSteps || state.sequence.length;
    return tr("status_watch", { step: stepNumber, total: totalSteps });
  }
  if (state.phase === "success") return tr("status_correct");
  if (state.phase === "failed") return tr("status_error");
  if (state.lastInputStatus === "wrong") return tr("status_minus_heart", { hp: state.hp, maxHp: state.maxHp });
  return tr("status_repeat", {
    step: Math.min(state.inputIndex + 1, state.sequence.length),
    total: state.sequence.length
  });
}

function statusClass(): string {
  if (state.phase === "showing") return "is-watch";
  if (state.phase === "success") return "is-success";
  if (state.phase === "failed") return "is-error";
  if (state.lastInputStatus === "wrong") return "is-error";
  return "is-repeat";
}

function renderHearts(): string {
  return Array.from({ length: state.maxHp }, (_, index) => index < state.hp ? "❤️" : "🤍").join("");
}

function rewardText(): string {
  if (finishPending) return tr("reward_saving");
  if (currentRun.mode === "server" && !finishResult && !finishError) {
    return tr("reward_saving");
  }
  if (finishResult?.mode === "server" && finishResult.ok) {
    if (finishResult.duplicate) return tr("reward_already_saved");
    return tr("reward_ok", { xp: finishResult.xpReward || 0 });
  }
  if (currentRun.mode === "server" && finishError) {
    return tr("reward_not_saved");
  }
  if (currentRun.mode === "local") {
    return tr("reward_local");
  }
  return tr("reward_ok", { xp: mockPetXpForScore(state.score) });
}

function catGuideClass(): string {
  if (state.phase === "showing") return "is-pointing";
  if (state.phase === "success") return "is-happy";
  if (state.lastInputStatus === "wrong") return "is-hurt";
  return "is-waiting";
}

function petGuideClassName(): string {
  return `${catGuideClass()} ${petTypeClass()}`;
}

function petTypeClass(): string {
  return currentRun.petType === "dog" ? "is-dog" : "is-cat";
}

function petGuideImageUrl(forceSad = false): string {
  const isSad = forceSad || state.lastInputStatus === "wrong";
  if (currentRun.petType === "dog") {
    return isSad ? dogGuideSadUrl : dogGuideUrl;
  }
  return isSad ? catGuideSadUrl : catGuideUrl;
}

function showToast(text: string): void {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function exitMiniApp(): void {
  try {
    const close = window.Telegram?.WebApp?.close;
    if (typeof close === "function") {
      close();
      return;
    }
  } catch {
    // Fall through to the dev-mode hint below.
  }

  showToast(tr("close_hint"));
}

function openFarmPaws(): void {
  stopCurrentScreen();
  appScreen = "farm-paws";
  state = {
    ...state,
    phase: "idle",
    bestScore: Math.max(state.bestScore, loadBestScore())
  };
  render();
}

function openSnake(): void {
  stopCurrentScreen();
  appScreen = "snake";
  render();
}

function showGamePicker(): void {
  stopCurrentScreen();
  appScreen = "games";
  render();
}

function stopCurrentScreen(): void {
  runToken += 1;
  activeStep = null;
  isStartingRun = false;
  snakeController?.destroy();
  snakeController = null;
}

function startBlockedText(run: FarmPawsRunSession): string {
  if (run.code === "daily_limit") {
    const limit = typeof run.dailyLimit === "number" ? run.dailyLimit : null;
    const starts = typeof run.dailyStarts === "number" ? run.dailyStarts : limit;
    const attempts = limit ? ` (${Math.min(starts || 0, limit)}/${limit})` : "";
    return tr("blocked_daily_limit", { attempts });
  }
  if (run.code === "no_pet") return tr("blocked_no_pet");
  if (run.code === "pet_dead") return tr("blocked_pet_dead");
  if (run.code === "pet_changed") return tr("blocked_pet_changed");
  if (run.code === "not_enough_energy") return tr("blocked_not_enough_energy");
  if (run.code === "start_unavailable") return tr("blocked_unavailable");
  return tr("blocked_default");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function previewEmoji(index: number): string {
  return defaultPlotEmojis()[index] || "🌱";
}
