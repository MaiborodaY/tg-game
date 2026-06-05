import "./styles.css";
import catGuideUrl from "./assets/cat-guide.png";
import catGuideSadUrl from "./assets/cat-guide-sad.png";
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

type ActiveStep = {
  cellIndex: number;
  stepNumber: number;
  totalSteps: number;
} | null;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

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

render();

function render(): void {
  app.innerHTML = `
    <main class="phone-shell">
      <section class="game-card ${state.phase === "failed" ? "is-failed" : ""}">
        ${state.phase === "idle" ? renderStartScreen() : renderGameScreen()}
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", beginGame);
  app.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", beginGame);
  app.querySelector<HTMLButtonElement>("[data-action='farm']")?.addEventListener("click", () => {
    showToast("Ферма будет подключена позже.");
  });

  app.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((button) => {
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
      <p class="eyebrow">Локальный прототип</p>
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
      <button class="primary-button" data-action="start">▶️ Играть</button>
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
      <span>Жизни</span>
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
    <div class="cat-guide-panel" aria-label="Котик помогает запомнить маршрут">
      <img class="cat-guide-image ${catGuideClass()}" src="${catGuideImageUrl()}" alt="" />
    </div>
  `;
}

function renderResultPanel(): string {
  const xp = mockPetXpForScore(state.score);
  return `
    <div class="result-panel">
      <img class="result-cat-image" src="${catGuideSadUrl}" alt="" />
      <h2>Урожай спасён: ${state.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${state.bestScore}</strong></p>
      <p class="reward-line">Питомец получил +${xp} XP</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="farm">🌾 На ферму</button>
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

function beginGame(): void {
  runToken += 1;
  activeStep = null;
  state = startGame(loadBestScore());
  render();
  void playSequence(runToken);
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
    activeStep = null;
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

  if (result.result === "roundComplete") {
    window.setTimeout(() => {
      if (token !== runToken) return;
      state = startNextRound(state);
      render();
      void playSequence(token);
    }, 700);
  }
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

function catGuideClass(): string {
  if (state.phase === "showing") return "is-pointing";
  if (state.phase === "success") return "is-happy";
  if (state.lastInputStatus === "wrong") return "is-hurt";
  return "is-waiting";
}

function catGuideImageUrl(): string {
  return state.lastInputStatus === "wrong" ? catGuideSadUrl : catGuideUrl;
}

function showToast(text: string): void {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function previewEmoji(index: number): string {
  return defaultPlotEmojis()[index] || "🌱";
}
