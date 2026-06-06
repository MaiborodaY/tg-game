import "./styles.css";
import catGuideUrl from "./assets/cat-guide.png";
import catGuideSadUrl from "./assets/cat-guide-sad.png";
import dogGuideUrl from "./assets/dog-guide.png";
import dogGuideSadUrl from "./assets/dog-guide-sad.png";
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
import { loadBestScore, saveBestScore } from "./storage";

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
  runId: null,
  bestScore: state.bestScore,
  error: null,
  petName: null,
  petType: null
};
let runStartedAt = 0;
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

function render(): void {
  appRoot.innerHTML = `
    <main class="phone-shell">
      <section class="game-card ${state.phase === "failed" ? "is-failed" : ""}">
        ${state.phase === "idle" ? renderStartScreen() : renderGameScreen()}
      </section>
    </main>
  `;

  appRoot.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", beginGame);
  appRoot.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", beginGame);
  appRoot.querySelector<HTMLButtonElement>("[data-action='home']")?.addEventListener("click", exitMiniApp);

  appRoot.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((button) => {
    button.addEventListener("click", () => {
      const cellIndex = Number.parseInt(button.dataset.cell || "-1", 10);
      onCellClick(cellIndex);
    });
  });
}

function renderStartScreen(): string {
  return `
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Прогулка питомца</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({ length: 9 }, (_, index) => `<span class="preview-plot">${previewEmoji(index)}</span>`).join("")}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${isStartingRun ? "disabled" : ""}>${isStartingRun ? "⏳ Стартуем" : "▶️ Играть"}</button>
      ${startBlockMessage ? `<p class="start-warning">${escapeHtml(startBlockMessage)}</p>` : ""}
      <p class="best-note">Лучший результат: <strong>${state.bestScore}</strong></p>
    </div>
  `;
}

function renderGameScreen(): string {
  const failed = state.phase === "failed";
  return `
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 Фермерские лапки</p>
        <h1>${failed ? "Забег окончен" : `Раунд ${state.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${state.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${state.round}</strong></span>
      <span>Рекорд: <strong>${state.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>${escapeHtml(currentRun.petName || "Питомец")}</span>
      <strong>${renderHearts()}</strong>
    </section>

    ${failed ? renderResultPanel() : renderPlayPanel()}
  `;
}

function renderPlayPanel(): string {
  return `
    <div class="status-line ${statusClass()}">${statusText()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({ length: 9 }, (_, index) => renderCell(index)).join("")}
    </div>
    <div class="cat-guide-panel" aria-label="Питомец помогает запомнить маршрут">
      <img class="cat-guide-image ${petGuideClassName()}" src="${petGuideImageUrl(false)}" alt="" />
    </div>
  `;
}

function renderResultPanel(): string {
  return `
    <div class="result-panel">
      <img class="result-cat-image ${petTypeClass()}" src="${petGuideImageUrl(true)}" alt="" />
      <h2>Урожай спасён: ${state.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${state.bestScore}</strong></p>
      <p class="reward-line">${rewardText()}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="home">🏠 В дом</button>
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
    <button class="${className}" data-cell="${index}" ${state.phase !== "input" ? "disabled" : ""} aria-label="Грядка ${index + 1}">
      <span class="plot-content">${content}</span>
      ${isActive ? `<span class="plot-pet" aria-hidden="true">🐕</span>` : ""}
    </button>
  `;
}

async function beginGame(): Promise<void> {
  if (isStartingRun) return;

  runToken += 1;
  const token = runToken;
  const localBestScore = loadBestScore();
  activeStep = null;
  finishPending = false;
  finishResult = null;
  finishError = null;
  startBlockMessage = null;
  isStartingRun = true;
  state = {
    ...state,
    phase: "idle",
    bestScore: Math.max(state.bestScore, localBestScore)
  };
  render();

  const run = await startFarmPawsRun(localBestScore);
  if (token !== runToken) return;

  isStartingRun = false;
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
    showToast("Игра запущена локально. Награда не начислится.");
  }

  void playSequence(token);
}

async function playSequence(token: number): Promise<void> {
  const showMs = showDurationForRound(state.round);
  const gapMs = Math.max(110, Math.floor(showMs * 0.28));

  for (const [index, step] of state.sequence.entries()) {
    if (token !== runToken) return;
    activeStep = {
      cellIndex: step.cellIndex,
      stepNumber: index + 1,
      totalSteps: state.sequence.length
    };
    render();
    await sleep(showMs);
    if (token !== runToken) return;
    activeStep = {
      cellIndex: -1,
      stepNumber: index + 1,
      totalSteps: state.sequence.length
    };
    render();
    await sleep(gapMs);
  }

  if (token !== runToken) return;
  state = markReadyForInput(state);
  render();
}

function onCellClick(cellIndex: number): void {
  const token = runToken;
  const result = handleCellInput(state, cellIndex);
  state = result.state;
  activeStep = null;

  if (state.bestScore >= state.score) {
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
  if (finishPending || finishResult) return;

  finishPending = true;
  finishError = null;
  render();

  const result = await finishFarmPawsRun(currentRun, {
    score: state.score,
    round: state.round,
    hpLeft: state.hp,
    durationMs: Math.max(0, Date.now() - runStartedAt)
  });
  if (token !== runToken) return;

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
}

function statusText(): string {
  if (state.phase === "showing") {
    const stepNumber = activeStep?.stepNumber || 1;
    const totalSteps = activeStep?.totalSteps || state.sequence.length;
    return `Смотри ${stepNumber}/${totalSteps}`;
  }
  if (state.phase === "success") return "Верно";
  if (state.phase === "failed") return "Ошибка";
  if (state.lastInputStatus === "wrong") return `Минус сердце ${state.hp}/${state.maxHp}`;
  return `Повтори ${Math.min(state.inputIndex + 1, state.sequence.length)}/${state.sequence.length}`;
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
  if (finishPending) return "Сохраняем результат...";
  if (currentRun.mode === "server" && !finishResult && !finishError) {
    return "Сохраняем результат...";
  }
  if (finishResult?.mode === "server" && finishResult.ok) {
    return `Питомец получил +${finishResult.xpReward || 0} XP`;
  }
  if (currentRun.mode === "server" && finishError) {
    return "Результат не сохранён, награда не начислена";
  }
  if (currentRun.mode === "local") {
    return "Локальный режим: награда не начисляется";
  }
  return `Питомец получил +${mockPetXpForScore(state.score)} XP`;
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

  showToast("Закрой мини-игру, чтобы вернуться домой.");
}

function startBlockedText(run: FarmPawsRunSession): string {
  if (run.code === "daily_limit") {
    const limit = typeof run.dailyLimit === "number" ? run.dailyLimit : null;
    const starts = typeof run.dailyStarts === "number" ? run.dailyStarts : limit;
    const attempts = limit ? ` (${Math.min(starts || 0, limit)}/${limit})` : "";
    return `Лимит прогулок на сегодня исчерпан${attempts}. Новые попытки будут в 00:00 UTC.`;
  }
  if (run.code === "no_pet") return "Сначала нужен питомец. Открой меню питомца в боте.";
  if (run.code === "pet_dead") return "Питомец не может гулять. Открой меню питомца в боте.";
  if (run.code === "pet_changed") return "Питомец изменился. Закрой мини-игру и открой прогулку заново из бота.";
  if (run.code === "not_enough_energy") return "Не хватает энергии для прогулки.";
  return "Сейчас прогулку начать нельзя. Открой меню питомца и попробуй позже.";
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
