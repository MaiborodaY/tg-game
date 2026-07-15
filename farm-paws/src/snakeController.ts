import {
  type FarmPawsFinishResult,
  type FarmPawsRunSession,
  finishFarmPawsRun,
  startFarmPawsRun
} from "./api";
import { type FarmPawsLang, type FarmPawsTextKey } from "./i18n";
import {
  SNAKE_BOARD_SIZE,
  type SnakeDirection,
  type SnakePhase,
  type SnakeState,
  advanceSnake,
  createSnakeInitialState,
  pauseSnakeGame,
  queueSnakeDirection,
  resumeSnakeGame,
  snakeTickDuration,
  startSnakeGame
} from "./snakeState";
import { finishSnakeAttempt, startSnakeAttempt } from "./snakeRunFlow";
import { loadSnakeBestScore, saveSnakeBestScore } from "./storage";

type Translate = (key: FarmPawsTextKey, vars?: Record<string, string | number>) => string;

type SnakeControllerOptions = {
  tr: Translate;
  onBack: () => void;
  onLanguageChange: (lang: FarmPawsLang) => void;
  startBlockedText: (run: FarmPawsRunSession) => string;
};

export type SnakeController = {
  destroy: () => void;
};

type PointerStart = {
  id: number;
  x: number;
  y: number;
} | null;

const KEY_DIRECTIONS: Record<string, SnakeDirection | undefined> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right"
};

export function mountSnakeController(
  root: HTMLElement,
  options: SnakeControllerOptions
): SnakeController {
  const { tr } = options;
  const eventController = new AbortController();
  const listenerOptions = { signal: eventController.signal };
  let state = createSnakeInitialState(loadSnakeBestScore());
  let tickTimer: number | null = null;
  let pointerStart: PointerStart = null;
  let destroyed = false;
  let lifecycleToken = 0;
  let currentRun: FarmPawsRunSession | null = null;
  let runStartedAt = 0;
  let runFinishedAt = 0;
  let isStartingRun = false;
  let finishPending = false;
  let finishResult: FarmPawsFinishResult | null = null;
  let startBlockMessage: string | null = null;

  root.innerHTML = `
    <div class="snake-screen">
      <header class="snake-header">
        <div>
          <button class="back-button" data-snake-action="back" type="button">${escapeHtml(tr("back_to_games"))}</button>
          <p class="eyebrow" data-snake-eyebrow>🐍 ${escapeHtml(tr("games_eyebrow"))}</p>
          <h1 data-snake-title>${escapeHtml(tr("snake_title"))}</h1>
        </div>
        <div class="score-pill snake-score-pill" aria-label="${escapeHtml(tr("score_label"))}">
          <span data-snake-score>0</span>
          <small data-snake-score-label>${escapeHtml(tr("score_label"))}</small>
        </div>
      </header>

      <section class="snake-meta" aria-label="${escapeHtml(tr("stats_label"))}">
        <span><span data-snake-record-label>${escapeHtml(tr("record_label"))}</span>: <strong data-snake-best>${state.bestScore}</strong></span>
        <small data-snake-run-note>${escapeHtml(tr("snake_attempt_note"))}</small>
      </section>

      <p class="snake-status" data-snake-status aria-live="polite"></p>

      <p class="snake-run-message" data-snake-run-message role="status" aria-live="polite" aria-atomic="true"></p>

      <div class="snake-board-wrap">
        <canvas
          class="snake-board"
          data-snake-board
          width="320"
          height="320"
          role="img"
          aria-label="${escapeHtml(tr("snake_board_label"))}"
        ></canvas>
      </div>

      <div class="snake-controls" role="group" aria-label="${escapeHtml(tr("snake_controls_label"))}">
        <button class="snake-control is-up" data-snake-direction="up" type="button" aria-label="${escapeHtml(tr("move_up"))}">▲</button>
        <button class="snake-control is-left" data-snake-direction="left" type="button" aria-label="${escapeHtml(tr("move_left"))}">◀</button>
        <button class="snake-control is-down" data-snake-direction="down" type="button" aria-label="${escapeHtml(tr("move_down"))}">▼</button>
        <button class="snake-control is-right" data-snake-direction="right" type="button" aria-label="${escapeHtml(tr("move_right"))}">▶</button>
      </div>

      <button class="primary-button snake-primary-action" data-snake-action="primary" type="button"></button>
    </div>
  `;

  const canvas = requireElement<HTMLCanvasElement>(root, "[data-snake-board]");
  const scoreElement = requireElement<HTMLElement>(root, "[data-snake-score]");
  const bestElement = requireElement<HTMLElement>(root, "[data-snake-best]");
  const statusElement = requireElement<HTMLElement>(root, "[data-snake-status]");
  const runNoteElement = requireElement<HTMLElement>(root, "[data-snake-run-note]");
  const runMessageElement = requireElement<HTMLElement>(root, "[data-snake-run-message]");
  const primaryButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='primary']");
  const backButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='back']");
  const directionButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-snake-direction]"));

  backButton.addEventListener("click", handleBack, listenerOptions);
  primaryButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.snakeDirection as SnakeDirection | undefined;
      if (direction) handleDirection(direction);
    }, listenerOptions);
  });
  window.addEventListener("keydown", handleKeyDown, listenerOptions);
  window.addEventListener("resize", drawBoard, listenerOptions);
  window.addEventListener("pointerup", handlePointerUp, listenerOptions);
  window.addEventListener("pointercancel", clearPointer, listenerOptions);
  document.addEventListener("visibilitychange", handleVisibilityChange, listenerOptions);
  canvas.addEventListener("pointerdown", handlePointerDown, listenerOptions);

  updateView();

  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      lifecycleToken += 1;
      stopLoop();
      eventController.abort();
      root.replaceChildren();
    }
  };

  function handlePrimaryAction(): void {
    if (isStartingRun || finishPending || hasHardStartBlock()) return;
    if (state.phase === "playing") {
      state = pauseSnakeGame(state);
      stopLoop();
      updateView();
      return;
    }
    if (state.phase === "paused") {
      state = resumeSnakeGame(state);
      updateView();
      scheduleTick();
      return;
    }
    if (
      (state.phase === "gameover" || state.phase === "won")
      && finishResult?.mode === "server"
      && !finishResult.ok
    ) {
      void finishCurrentRun();
      return;
    }
    void startNewGame();
  }

  async function startNewGame(initialDirection?: SnakeDirection): Promise<void> {
    if (isStartingRun || finishPending || hasHardStartBlock()) return;
    lifecycleToken += 1;
    const token = lifecycleToken;
    stopLoop();
    currentRun = null;
    finishResult = null;
    startBlockMessage = null;
    runFinishedAt = 0;
    isStartingRun = true;
    state = createSnakeInitialState(loadSnakeBestScore());
    updateView();

    const run = await startSnakeAttempt(
      (bestScore) => startFarmPawsRun(bestScore, "snake"),
      loadSnakeBestScore()
    );
    if (destroyed || token !== lifecycleToken) return;

    options.onLanguageChange(run.lang);
    if (run.mode === "blocked") {
      isStartingRun = false;
      currentRun = run;
      startBlockMessage = options.startBlockedText(run);
      updateView();
      return;
    }

    currentRun = run;
    state = createSnakeInitialState(loadSnakeBestScore());
    updateView();
    await wait(650);
    if (destroyed || token !== lifecycleToken) return;

    isStartingRun = false;
    runStartedAt = Date.now();
    state = startSnakeGame(loadSnakeBestScore());
    if (initialDirection) state = queueSnakeDirection(state, initialDirection);
    updateView();
    scheduleTick();
  }

  function handleDirection(direction: SnakeDirection): void {
    if (state.phase !== "playing") return;
    state = queueSnakeDirection(state, direction);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTIONS[key];
    if (direction) {
      event.preventDefault();
      handleDirection(direction);
      return;
    }
    if (event.code === "Space") {
      if (event.target instanceof HTMLElement && event.target.closest("button")) return;
      event.preventDefault();
      handlePrimaryAction();
    }
  }

  function handleVisibilityChange(): void {
    if (!document.hidden || state.phase !== "playing") return;
    state = pauseSnakeGame(state);
    stopLoop();
    updateView();
  }

  function handlePointerDown(event: PointerEvent): void {
    if (state.phase !== "playing") return;
    pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      handleDirection(deltaX > 0 ? "right" : "left");
      return;
    }
    handleDirection(deltaY > 0 ? "down" : "up");
  }

  function clearPointer(): void {
    pointerStart = null;
  }

  function scheduleTick(): void {
    if (destroyed || state.phase !== "playing") return;
    stopLoop();
    tickTimer = window.setTimeout(runTick, snakeTickDuration(state.score));
  }

  function runTick(): void {
    tickTimer = null;
    if (destroyed || state.phase !== "playing") return;

    const previousBestScore = state.bestScore;
    state = advanceSnake(state);
    if (state.bestScore > previousBestScore) saveSnakeBestScore(state.bestScore);
    updateView();
    if (state.phase === "playing") {
      scheduleTick();
      return;
    }
    if (state.phase === "gameover" || state.phase === "won") {
      runFinishedAt = Date.now();
      void finishCurrentRun();
    }
  }

  async function finishCurrentRun(): Promise<void> {
    if (!currentRun || finishPending || finishResult?.ok) return;
    const token = lifecycleToken;
    finishPending = true;
    finishResult = null;
    updateView();

    const result = await finishSnakeAttempt(finishFarmPawsRun, currentRun, {
      score: state.score,
      startedAt: runStartedAt,
      finishedAt: runFinishedAt || Date.now()
    });
    if (destroyed || token !== lifecycleToken) return;

    finishPending = false;
    finishResult = result;
    updateView();
    if (!result.ok) primaryButton.focus();
  }

  function handleBack(): void {
    if (isStartingRun || finishPending) return;
    const activeServerRun = currentRun?.mode === "server"
      && (state.phase === "playing" || state.phase === "paused");
    if (activeServerRun && !window.confirm(tr("snake_leave_confirm"))) return;
    lifecycleToken += 1;
    stopLoop();
    options.onBack();
  }

  function stopLoop(): void {
    if (tickTimer === null) return;
    window.clearTimeout(tickTimer);
    tickTimer = null;
  }

  function updateView(): void {
    const hardStartBlock = hasHardStartBlock();
    updateStaticTranslations();
    scoreElement.textContent = String(state.score);
    bestElement.textContent = String(state.bestScore);
    statusElement.textContent = hardStartBlock
      ? tr("snake_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "snake_get_ready" : "start_busy")
        : snakeStatusText(state.phase, tr);
    statusElement.dataset.phase = hardStartBlock ? "blocked" : isStartingRun ? "starting" : state.phase;
    runNoteElement.textContent = snakeRunNote(
      currentRun,
      Boolean(window.Telegram?.WebApp?.initData),
      tr
    );
    runMessageElement.textContent = snakeRunMessage({
      startBlockMessage,
      finishPending,
      finishResult,
      tr
    });
    runMessageElement.dataset.tone = snakeRunMessageTone({ startBlockMessage, finishPending, finishResult });
    primaryButton.textContent = hardStartBlock
      ? tr("snake_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "snake_get_ready" : "start_busy")
        : startBlockMessage
          ? tr("retry_start")
          : snakePrimaryText(state.phase, finishPending, finishResult, tr);
    primaryButton.disabled = isStartingRun || finishPending || hardStartBlock;
    backButton.disabled = isStartingRun || finishPending;
    canvas.setAttribute(
      "aria-label",
      `${tr("snake_board_label")}. ${tr("score_label")}: ${state.score}. ${tr("record_label")}: ${state.bestScore}.`
    );
    directionButtons.forEach((button) => {
      button.disabled = isStartingRun || state.phase !== "playing";
    });
    drawBoard();
  }

  function hasHardStartBlock(): boolean {
    return currentRun?.mode === "blocked" && currentRun.code !== "start_unavailable";
  }

  function updateStaticTranslations(): void {
    backButton.textContent = tr("back_to_games");
    requireElement<HTMLElement>(root, "[data-snake-eyebrow]").textContent = `🐍 ${tr("games_eyebrow")}`;
    requireElement<HTMLElement>(root, "[data-snake-title]").textContent = tr("snake_title");
    requireElement<HTMLElement>(root, "[data-snake-score-label]").textContent = tr("score_label");
    requireElement<HTMLElement>(root, "[data-snake-record-label]").textContent = tr("record_label");
    requireElement<HTMLElement>(root, ".snake-score-pill").setAttribute("aria-label", tr("score_label"));
    requireElement<HTMLElement>(root, ".snake-meta").setAttribute("aria-label", tr("stats_label"));
    requireElement<HTMLElement>(root, ".snake-controls").setAttribute("aria-label", tr("snake_controls_label"));
    directionButtons.forEach((button) => {
      const direction = button.dataset.snakeDirection as SnakeDirection | undefined;
      if (direction) button.setAttribute("aria-label", tr(directionLabel(direction)));
    });
  }

  function drawBoard(): void {
    if (destroyed) return;
    const cssSize = Math.max(1, Math.round(canvas.getBoundingClientRect().width || 320));
    const density = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const pixelSize = Math.round(cssSize * density);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, cssSize, cssSize);
    const cellSize = cssSize / SNAKE_BOARD_SIZE;

    for (let y = 0; y < SNAKE_BOARD_SIZE; y += 1) {
      for (let x = 0; x < SNAKE_BOARD_SIZE; x += 1) {
        context.fillStyle = (x + y) % 2 === 0 ? "#315c38" : "#2b5232";
        context.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }

    if (state.food) drawFood(context, state.food.x, state.food.y, cellSize);
    for (let index = state.snake.length - 1; index >= 0; index -= 1) {
      drawSnakeCell(context, state.snake[index].x, state.snake[index].y, cellSize, index === 0);
    }
    drawSnakeEyes(context, state, cellSize);
  }
}

function drawFood(context: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
  const centerX = (x + 0.5) * cellSize;
  const centerY = (y + 0.54) * cellSize;
  context.fillStyle = "#ed5b4f";
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffd6c5";
  context.beginPath();
  context.arc(centerX - cellSize * 0.1, centerY - cellSize * 0.1, cellSize * 0.065, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#683c24";
  context.lineWidth = Math.max(1.5, cellSize * 0.08);
  context.beginPath();
  context.moveTo(centerX, centerY - cellSize * 0.25);
  context.lineTo(centerX + cellSize * 0.05, centerY - cellSize * 0.42);
  context.stroke();
  context.fillStyle = "#80bd55";
  context.beginPath();
  context.ellipse(
    centerX + cellSize * 0.15,
    centerY - cellSize * 0.36,
    cellSize * 0.13,
    cellSize * 0.07,
    -0.45,
    0,
    Math.PI * 2
  );
  context.fill();
}

function drawSnakeCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  isHead: boolean
): void {
  const inset = Math.max(1, cellSize * 0.07);
  const left = x * cellSize + inset;
  const top = y * cellSize + inset;
  const size = cellSize - inset * 2;
  context.fillStyle = isHead ? "#f4cf57" : "#b8d957";
  roundedRect(context, left, top, size, size, cellSize * 0.24);
  context.fill();
}

function drawSnakeEyes(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  cellSize: number
): void {
  const head = state.snake[0];
  if (!head) return;
  const centerX = (head.x + 0.5) * cellSize;
  const centerY = (head.y + 0.5) * cellSize;
  const forward = directionVector(state.direction);
  const side = { x: -forward.y, y: forward.x };
  const forwardOffset = cellSize * 0.17;
  const sideOffset = cellSize * 0.17;
  const eyeRadius = Math.max(1.3, cellSize * 0.075);

  context.fillStyle = "#263322";
  for (const sideSign of [-1, 1]) {
    context.beginPath();
    context.arc(
      centerX + forward.x * forwardOffset + side.x * sideOffset * sideSign,
      centerY + forward.y * forwardOffset + side.y * sideOffset * sideSign,
      eyeRadius,
      0,
      Math.PI * 2
    );
    context.fill();
  }
}

function directionVector(direction: SnakeDirection): { x: number; y: number } {
  if (direction === "up") return { x: 0, y: -1 };
  if (direction === "down") return { x: 0, y: 1 };
  if (direction === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function snakeStatusText(phase: SnakePhase, tr: Translate): string {
  if (phase === "playing") return tr("snake_running");
  if (phase === "paused") return tr("snake_paused");
  if (phase === "gameover") return tr("snake_game_over");
  if (phase === "won") return tr("snake_won");
  return tr("snake_ready");
}

function snakePrimaryText(
  phase: SnakePhase,
  finishPending: boolean,
  finishResult: FarmPawsFinishResult | null,
  tr: Translate
): string {
  if (finishPending) return tr("reward_saving");
  if (
    (phase === "gameover" || phase === "won")
    && finishResult?.mode === "server"
    && !finishResult.ok
  ) {
    return tr("retry_save");
  }
  if (phase === "playing") return tr("snake_pause");
  if (phase === "paused") return tr("snake_resume");
  if (phase === "gameover" || phase === "won") return tr("snake_restart");
  return tr("snake_start");
}

function snakeRunNote(
  session: FarmPawsRunSession | null,
  hasTelegramInitData: boolean,
  tr: Translate
): string {
  if (session?.mode === "local") return tr("snake_local_note");
  if (
    session?.mode === "server"
    && typeof session.dailyStarts === "number"
    && typeof session.dailyLimit === "number"
    && session.dailyLimit > 0
  ) {
    return tr("snake_attempt_used", {
      used: Math.min(session.dailyStarts, session.dailyLimit),
      limit: session.dailyLimit
    });
  }
  return hasTelegramInitData ? tr("snake_attempt_note") : tr("snake_local_note");
}

type SnakeRunMessageInput = {
  startBlockMessage: string | null;
  finishPending: boolean;
  finishResult: FarmPawsFinishResult | null;
  tr: Translate;
};

function snakeRunMessage(input: SnakeRunMessageInput): string {
  if (input.startBlockMessage) return input.startBlockMessage;
  if (input.finishPending) return input.tr("reward_saving");
  if (input.finishResult?.mode === "server" && input.finishResult.ok) {
    if (input.finishResult.duplicate) return input.tr("reward_already_saved");
    return input.tr("reward_ok", { xp: input.finishResult.xpReward || 0 });
  }
  if (input.finishResult?.mode === "server") return input.tr("reward_not_saved");
  if (input.finishResult?.mode === "local") return input.tr("reward_local");
  return "";
}

function snakeRunMessageTone(
  input: Omit<SnakeRunMessageInput, "tr">
): "" | "error" | "pending" | "success" | "local" {
  if (input.startBlockMessage) return "error";
  if (input.finishPending) return "pending";
  if (input.finishResult?.mode === "server") return input.finishResult.ok ? "success" : "error";
  if (input.finishResult?.mode === "local") return "local";
  return "";
}

function directionLabel(direction: SnakeDirection): FarmPawsTextKey {
  if (direction === "up") return "move_up";
  if (direction === "down") return "move_down";
  if (direction === "left") return "move_left";
  return "move_right";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Snake element was not found: ${selector}`);
  return element;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
