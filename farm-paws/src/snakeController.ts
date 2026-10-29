import {
  type FarmPawsFinishResult,
  type FarmPawsRunSession,
  finishFarmPawsRun,
  startFarmPawsRun
} from "./api";
import { type FarmPawsLang, type FarmPawsTextKey } from "./i18n";
import {
  SNAKE_BOARD_SIZE,
  SNAKE_MAPS,
  type SnakeDirection,
  type SnakeMapId,
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

type SnakeLayout = "lobby" | "game";

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
  let selectedMapId: SnakeMapId = "garden";
  let state = createSnakeInitialState(loadSnakeBestScore(selectedMapId), Math.random, "right", selectedMapId);
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
  let layout: SnakeLayout = "lobby";

  root.innerHTML = `
    <div class="snake-screen" data-snake-screen data-layout="lobby">
      <section class="snake-lobby-header">
        <button class="back-button snake-lobby-back" data-snake-action="back" type="button">
          <span data-snake-back-copy>${escapeHtml(tr("back_to_games"))}</span>
        </button>
        <div class="snake-lobby-hero">
          <div class="snake-lobby-icon" aria-hidden="true">🐍</div>
          <p class="eyebrow" data-snake-eyebrow>${escapeHtml(tr("games_eyebrow"))}</p>
          <h1 data-snake-title>${escapeHtml(tr("snake_title"))}</h1>
          <p class="snake-lobby-description" data-snake-description>${escapeHtml(tr("snake_description"))}</p>
        </div>
      </section>

      <section class="snake-map-picker" aria-label="${escapeHtml(tr("snake_map_label"))}">
        <strong data-snake-map-label>${escapeHtml(tr("snake_map_label"))}</strong>
        <div class="snake-map-options">
          ${(["garden", "courtyard", "warehouse"] as const).map(mapId => `
            <button type="button" class="snake-map-option" data-snake-map="${mapId}" aria-pressed="${mapId === selectedMapId}">${escapeHtml(tr(`snake_map_${mapId}`))}</button>
          `).join("")}
        </div>
        <p data-snake-map-hint></p>
      </section>

      <details class="snake-controls-hint">
        <summary data-snake-rules-title>${escapeHtml(tr("snake_rules_title"))}</summary>
        <p data-snake-rules>${escapeHtml(tr("snake_rules"))}</p>
        <p data-snake-routes-rules>${escapeHtml(tr("snake_routes_rules"))}</p>
      </details>

      <header class="snake-game-hud" aria-label="${escapeHtml(tr("stats_label"))}">
        <button class="snake-hud-button snake-hud-back" data-snake-action="back" type="button" aria-label="${escapeHtml(tr("back_to_games"))}">←</button>
        <strong class="snake-hud-title"><span data-snake-hud-name><span aria-hidden="true">🐍</span> <span data-snake-title>${escapeHtml(tr("snake_title"))}</span></span><small data-snake-bonuses style="white-space: pre-line" hidden></small></strong>
        <div class="snake-hud-stats">
          <span class="snake-hud-stat" data-snake-record-stat aria-label="${escapeHtml(tr("record_label"))}">🏆 <strong data-snake-best>${state.bestScore}</strong></span>
          <span class="snake-hud-stat is-score" data-snake-score-stat aria-label="${escapeHtml(tr("score_label"))}">🍎 <strong data-snake-score>0</strong></span>
        </div>
        <button class="snake-hud-button snake-hud-pause" data-snake-action="pause" type="button" aria-label="${escapeHtml(tr("snake_pause"))}">⏸</button>
        <div class="snake-route-hud"><span data-snake-field></span><strong data-snake-combo></strong></div>
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
        <div class="snake-board-overlay" data-snake-overlay hidden>
          <strong class="snake-overlay-title" data-snake-overlay-title></strong>
          <span class="snake-overlay-score" data-snake-overlay-score></span>
          <p class="snake-overlay-message" data-snake-overlay-message></p>
          <div class="snake-overlay-actions">
            <button class="primary-button snake-overlay-primary" data-snake-action="overlay-primary" type="button"></button>
            <button class="secondary-button snake-overlay-back" data-snake-action="overlay-back" type="button"></button>
          </div>
        </div>
      </div>

      <p class="snake-controls-hint" data-snake-controls-hint>${escapeHtml(tr("snake_controls_hint"))}</p>
      <div class="snake-controls" role="group" aria-label="${escapeHtml(tr("snake_controls_label"))}">
        <button class="snake-control is-up" data-snake-direction="up" type="button" aria-label="${escapeHtml(tr("move_up"))}">▲</button>
        <button class="snake-control is-left" data-snake-direction="left" type="button" aria-label="${escapeHtml(tr("move_left"))}">◀</button>
        <button class="snake-control is-down" data-snake-direction="down" type="button" aria-label="${escapeHtml(tr("move_down"))}">▼</button>
        <button class="snake-control is-right" data-snake-direction="right" type="button" aria-label="${escapeHtml(tr("move_right"))}">▶</button>
      </div>

      <button class="primary-button snake-primary-action" data-snake-action="primary" type="button"></button>
    </div>
  `;

  const screenElement = requireElement<HTMLElement>(root, "[data-snake-screen]");
  const canvas = requireElement<HTMLCanvasElement>(root, "[data-snake-board]");
  const scoreElements = requireElements<HTMLElement>(root, "[data-snake-score]");
  const bestElements = requireElements<HTMLElement>(root, "[data-snake-best]");
  const statusElement = requireElement<HTMLElement>(root, "[data-snake-status]");
  const hudNameElement = requireElement<HTMLElement>(root, "[data-snake-hud-name]");
  const bonusesElement = requireElement<HTMLElement>(root, "[data-snake-bonuses]");
  const runNoteElement = requireElement<HTMLElement>(root, "[data-snake-run-note]");
  const runMessageElement = requireElement<HTMLElement>(root, "[data-snake-run-message]");
  const primaryButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='primary']");
  const pauseButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='pause']");
  const overlayElement = requireElement<HTMLElement>(root, "[data-snake-overlay]");
  const overlayTitleElement = requireElement<HTMLElement>(root, "[data-snake-overlay-title]");
  const overlayScoreElement = requireElement<HTMLElement>(root, "[data-snake-overlay-score]");
  const overlayMessageElement = requireElement<HTMLElement>(root, "[data-snake-overlay-message]");
  const overlayPrimaryButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='overlay-primary']");
  const overlayBackButton = requireElement<HTMLButtonElement>(root, "[data-snake-action='overlay-back']");
  const backButtons = requireElements<HTMLButtonElement>(root, "[data-snake-action='back']");
  const directionButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-snake-direction]"));
  const mapButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-snake-map]"));

  mapButtons.forEach(button => button.addEventListener("click", () => {
    if (layout !== "lobby" || isStartingRun || finishPending) return;
    selectedMapId = button.dataset.snakeMap as SnakeMapId;
    state = createSnakeInitialState(loadSnakeBestScore(selectedMapId), Math.random, "right", selectedMapId);
    updateView();
  }, listenerOptions));

  backButtons.forEach((button) => button.addEventListener("click", handleBack, listenerOptions));
  primaryButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  pauseButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  overlayPrimaryButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  overlayBackButton.addEventListener("click", handleBack, listenerOptions);
  directionButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const direction = button.dataset.snakeDirection as SnakeDirection | undefined;
      if (direction) handleDirection(direction);
    }, listenerOptions);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
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
    if (layout === "game" && currentRun && state.phase === "idle") {
      handleDirection("right");
      return;
    }
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

  async function startNewGame(): Promise<void> {
    if (isStartingRun || finishPending || hasHardStartBlock()) return;
    lifecycleToken += 1;
    const token = lifecycleToken;
    stopLoop();
    currentRun = null;
    finishResult = null;
    startBlockMessage = null;
    runFinishedAt = 0;
    isStartingRun = true;
    state = createSnakeInitialState(loadSnakeBestScore(selectedMapId), Math.random, "right", selectedMapId);
    updateView();

    const run = await startSnakeAttempt(
      (bestScore) => startFarmPawsRun(bestScore, "snake", selectedMapId),
      loadSnakeBestScore(selectedMapId)
    );
    if (destroyed || token !== lifecycleToken) return;

    options.onLanguageChange(run.lang);
    // A retry may return the field of an earlier start whose response was lost.
    selectedMapId = run.mapId ?? selectedMapId;
    const localBestScore = loadSnakeBestScore(selectedMapId);
    const syncedBestScore = Math.max(localBestScore, run.bestScore);
    if (syncedBestScore > localBestScore) saveSnakeBestScore(syncedBestScore, selectedMapId);
    if (run.mode === "blocked") {
      isStartingRun = false;
      layout = "lobby";
      currentRun = run;
      startBlockMessage = options.startBlockedText(run);
      state = createSnakeInitialState(syncedBestScore, Math.random, "right", selectedMapId);
      updateView();
      return;
    }

    currentRun = run;
    layout = "game";
    state = createSnakeInitialState(syncedBestScore, Math.random, "right", selectedMapId);
    isStartingRun = false;
    updateView();
  }

  function handleDirection(direction: SnakeDirection): void {
    if (layout === "game" && currentRun && !isStartingRun && state.phase === "idle") {
      runStartedAt = Date.now();
      state = startSnakeGame(state.bestScore, Math.random, direction, selectedMapId);
      updateView();
      scheduleTick();
      return;
    }
    if (state.phase !== "playing") return;
    state = queueSnakeDirection(state, direction);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTIONS[key];
    if (direction) {
      event.preventDefault();
      handleDirection(direction);
      return;
    }
    if (event.code === "Space") {
      if (event.repeat || (state.phase !== "playing" && state.phase !== "paused")) return;
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
    if (state.phase !== "playing" && state.phase !== "idle") return;
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
    if (state.bestScore > previousBestScore) saveSnakeBestScore(state.bestScore, selectedMapId);
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
    if (typeof result.dailyStarts === "number" && currentRun) {
      currentRun = { ...currentRun, dailyStarts: result.dailyStarts };
    }
    if (typeof result.bestScore === "number" && result.bestScore > state.bestScore) {
      state = {
        ...state,
        bestScore: result.bestScore
      };
      saveSnakeBestScore(result.bestScore, selectedMapId);
    }
    updateView();
    if (!result.ok) overlayPrimaryButton.focus();
  }

  function handleBack(): void {
    if (isStartingRun || finishPending) return;
    const activeServerRun = currentRun?.mode === "server"
      && (state.phase === "playing" || state.phase === "paused" || state.phase === "idle");
    const unsavedServerResult = currentRun?.mode === "server"
      && (state.phase === "gameover" || state.phase === "won")
      && Boolean(finishResult && !finishResult.ok);
    if (activeServerRun && !window.confirm(tr("leave_run_confirm"))) return;
    if (unsavedServerResult && !window.confirm(tr("leave_unsaved_confirm"))) return;
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
    const terminal = state.phase === "gameover" || state.phase === "won";
    const runMessage = snakeRunMessage({
      startBlockMessage,
      finishPending,
      finishResult,
      tr
    });
    updateStaticTranslations();
    screenElement.dataset.layout = layout;
    screenElement.dataset.phase = isStartingRun ? "starting" : state.phase;
    screenElement.dataset.map = selectedMapId;
    requireElement<HTMLElement>(root, "[data-snake-field]").textContent = tr(`snake_map_${selectedMapId}`);
    requireElement<HTMLElement>(root, "[data-snake-combo]").textContent = state.lastAppleColor
      ? tr("snake_combo_next", {
        progress: (state.alternatingApples - 1) % 3 + 1,
        apple: state.lastAppleColor === "red" ? "🍏" : "🍎"
      })
      : tr("snake_combo_start");
    mapButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.snakeMap === selectedMapId));
      button.disabled = isStartingRun || finishPending;
    });
    scoreElements.forEach((element) => {
      element.textContent = String(state.score);
    });
    bestElements.forEach((element) => {
      element.textContent = String(state.bestScore);
    });
    const bonusTimers = [
      state.goldFood ? tr("snake_gold_timer", { seconds: Math.ceil(state.goldFood.remainingMs / 1000) }) : "",
      state.scissors ? tr("snake_scissors_timer", { seconds: Math.ceil(state.scissors.remainingMs / 1000) }) : ""
    ].filter(Boolean).join("\n");
    bonusesElement.textContent = bonusTimers;
    bonusesElement.hidden = !bonusTimers;
    hudNameElement.hidden = Boolean(bonusTimers);
    statusElement.textContent = hardStartBlock
      ? tr("snake_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "snake_get_ready" : "start_busy")
        : layout === "game" && state.phase === "idle"
          ? tr("snake_first_move")
          : snakeStatusText(state.phase, tr);
    statusElement.dataset.phase = hardStartBlock ? "blocked" : isStartingRun ? "starting" : state.phase;
    runNoteElement.textContent = snakeRunNote(
      currentRun,
      Boolean(window.Telegram?.WebApp?.initData),
      tr
    );
    runMessageElement.textContent = runMessage;
    runMessageElement.dataset.tone = snakeRunMessageTone({ startBlockMessage, finishPending, finishResult });
    primaryButton.textContent = hardStartBlock
      ? tr("snake_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "snake_get_ready" : "start_busy")
        : startBlockMessage
          ? tr("retry_start")
          : snakePrimaryText(state.phase, finishPending, finishResult, tr);
    primaryButton.disabled = isStartingRun || finishPending || hardStartBlock;
    backButtons.forEach((button) => {
      button.disabled = isStartingRun || finishPending;
    });
    pauseButton.textContent = state.phase === "paused" ? "▶" : "⏸";
    pauseButton.setAttribute("aria-label", tr(state.phase === "paused" ? "snake_resume" : "snake_pause"));
    pauseButton.hidden = layout !== "game" || isStartingRun || terminal || state.phase === "idle";
    pauseButton.disabled = state.phase !== "playing" && state.phase !== "paused";

    const overlayVisible = layout === "game"
      && (isStartingRun || state.phase === "paused" || terminal);
    overlayElement.hidden = !overlayVisible;
    overlayElement.dataset.tone = terminal
      ? finishResult?.ok ? "success" : finishResult ? "error" : "pending"
      : state.phase === "paused" ? "paused" : "starting";
    overlayTitleElement.textContent = isStartingRun
      ? tr(currentRun?.mode === "server" ? "snake_get_ready" : "start_busy")
      : state.phase === "paused"
        ? tr("snake_paused")
        : tr(state.phase === "won" ? "snake_won" : "snake_game_over");
    overlayScoreElement.textContent = terminal ? tr("snake_result_score", { score: state.score }) : "";
    overlayScoreElement.hidden = !terminal;
    overlayMessageElement.textContent = terminal ? runMessage : "";
    overlayMessageElement.hidden = !terminal || !runMessage;

    const showOverlayPrimary = state.phase === "paused" || (terminal && !finishPending);
    overlayPrimaryButton.hidden = !showOverlayPrimary;
    overlayPrimaryButton.disabled = finishPending;
    overlayPrimaryButton.textContent = state.phase === "paused"
      ? tr("snake_resume")
      : snakePrimaryText(state.phase, finishPending, finishResult, tr);
    overlayBackButton.hidden = !terminal || finishPending;
    overlayBackButton.disabled = finishPending;
    overlayBackButton.textContent = tr("back_to_games");
    canvas.setAttribute(
      "aria-label",
      `${tr("snake_board_label")}. ${tr("score_label")}: ${state.score}. ${tr("record_label")}: ${state.bestScore}.`
    );
    directionButtons.forEach((button) => {
      button.disabled = isStartingRun || layout !== "game" || (state.phase !== "playing" && state.phase !== "idle");
    });
    drawBoard();
  }

  function hasHardStartBlock(): boolean {
    return currentRun?.mode === "blocked" && currentRun.code !== "start_unavailable";
  }

  function updateStaticTranslations(): void {
    backButtons.forEach((button) => button.setAttribute("aria-label", tr("back_to_games")));
    requireElement<HTMLElement>(root, "[data-snake-back-copy]").textContent = tr("back_to_games");
    requireElement<HTMLElement>(root, "[data-snake-eyebrow]").textContent = tr("games_eyebrow");
    requireElements<HTMLElement>(root, "[data-snake-title]").forEach((element) => {
      element.textContent = tr("snake_title");
    });
    requireElement<HTMLElement>(root, "[data-snake-description]").textContent = tr("snake_description");
    requireElement<HTMLElement>(root, "[data-snake-rules-title]").textContent = tr("snake_rules_title");
    requireElement<HTMLElement>(root, "[data-snake-rules]").textContent = tr("snake_rules");
    requireElement<HTMLElement>(root, "[data-snake-routes-rules]").textContent = tr("snake_routes_rules");
    requireElement<HTMLElement>(root, "[data-snake-map-label]").textContent = tr("snake_map_label");
    requireElement<HTMLElement>(root, "[data-snake-map-hint]").textContent = tr(`snake_map_${selectedMapId}_hint`);
    requireElement<HTMLElement>(root, ".snake-map-picker").setAttribute("aria-label", tr("snake_map_label"));
    mapButtons.forEach(button => {
      button.textContent = tr(`snake_map_${button.dataset.snakeMap as SnakeMapId}`);
    });
    requireElements<HTMLElement>(root, "[data-snake-record-label]").forEach((element) => {
      element.textContent = tr("snake_map_record");
    });
    requireElement<HTMLElement>(root, "[data-snake-controls-hint]").textContent = tr("snake_controls_hint");
    requireElement<HTMLElement>(root, "[data-snake-record-stat]").setAttribute("aria-label", tr("snake_map_record"));
    requireElement<HTMLElement>(root, "[data-snake-score-stat]").setAttribute("aria-label", tr("score_label"));
    requireElement<HTMLElement>(root, ".snake-game-hud").setAttribute("aria-label", tr("stats_label"));
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

    const map = SNAKE_MAPS[state.mapId];
    const tiles = state.mapId === "warehouse" ? ["#555b51", "#4e544b"]
      : state.mapId === "courtyard" ? ["#60724d", "#586b45"] : ["#315c38", "#2b5232"];
    for (let y = 0; y < SNAKE_BOARD_SIZE; y += 1) {
      for (let x = 0; x < SNAKE_BOARD_SIZE; x += 1) {
        context.fillStyle = tiles[(x + y) % 2];
        context.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }

    map.obstacles.forEach(point => drawObstacle(context, point.x, point.y, cellSize, state.mapId === "courtyard"));
    map.portals.forEach((point, index) => drawBurrow(context, point.x, point.y, cellSize, index));
    if (state.food) drawFood(context, state.food.x, state.food.y, cellSize);
    if (state.greenFood) drawFood(context, state.greenFood.x, state.greenFood.y, cellSize, "green");
    if (state.goldFood) drawFood(context, state.goldFood.x, state.goldFood.y, cellSize, "gold");
    if (state.scissors) {
      context.fillStyle = "#ffffff";
      context.font = `bold ${cellSize * 0.85}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("✂", (state.scissors.x + 0.5) * cellSize, (state.scissors.y + 0.5) * cellSize);
    }
    for (let index = state.snake.length - 1; index >= 0; index -= 1) {
      drawSnakeCell(context, state.snake[index].x, state.snake[index].y, cellSize, index === 0);
    }
    drawSnakeEyes(context, state, cellSize);
  }
}

function drawBurrow(context: CanvasRenderingContext2D, x: number, y: number, cellSize: number, index: number): void {
  const centerX = (x + 0.5) * cellSize;
  const centerY = (y + 0.55) * cellSize;
  context.fillStyle = "#18251e";
  context.strokeStyle = index === 0 ? "#c99dff" : "#73e5d1";
  context.lineWidth = Math.max(2, cellSize * 0.12);
  context.beginPath();
  context.ellipse(centerX, centerY, cellSize * 0.36, cellSize * 0.28, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = `bold ${cellSize * 0.4}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(index === 0 ? "A" : "B", centerX, centerY);
}

function drawObstacle(context: CanvasRenderingContext2D, x: number, y: number, size: number, flower: boolean): void {
  context.fillStyle = flower ? "#5a3e2e" : "#a17a48";
  roundedRect(context, x * size + 1, y * size + 1, size - 2, size - 2, size * 0.1);
  context.fill();
  if (flower) {
    context.fillStyle = "#86a958";
    context.beginPath();
    context.ellipse((x + 0.5) * size, (y + 0.6) * size, size * 0.28, size * 0.14, -0.4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = (x + y) % 2 ? "#f1aaac" : "#f4d27a";
    context.beginPath();
    context.arc((x + 0.5) * size, (y + 0.4) * size, size * 0.18, 0, Math.PI * 2);
    context.fill();
  } else {
    context.strokeStyle = "#674b2f";
    context.lineWidth = Math.max(1, size * 0.08);
    context.strokeRect((x + 0.15) * size, (y + 0.15) * size, size * 0.7, size * 0.7);
    context.beginPath();
    context.moveTo((x + 0.2) * size, (y + 0.2) * size);
    context.lineTo((x + 0.8) * size, (y + 0.8) * size);
    context.stroke();
  }
}

function drawFood(context: CanvasRenderingContext2D, x: number, y: number, cellSize: number, kind: "red" | "green" | "gold" = "red"): void {
  const centerX = (x + 0.5) * cellSize;
  const centerY = (y + 0.54) * cellSize;
  context.fillStyle = kind === "gold" ? "#ffd33d" : kind === "green" ? "#a5df53" : "#ed5b4f";
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.3, 0, Math.PI * 2);
  context.fill();
  if (kind === "green") {
    context.strokeStyle = "#e7ffc4";
    context.lineWidth = Math.max(1, cellSize * 0.07);
    context.beginPath();
    context.arc(centerX, centerY, cellSize * 0.18, -0.9, 0.9);
    context.stroke();
  }
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
    if (input.finishResult.refunded) return input.tr("zero_attempt_refunded");
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

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Snake element was not found: ${selector}`);
  return element;
}

function requireElements<T extends Element>(root: ParentNode, selector: string): T[] {
  const elements = Array.from(root.querySelectorAll<T>(selector));
  if (!elements.length) throw new Error(`Snake elements were not found: ${selector}`);
  return elements;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
