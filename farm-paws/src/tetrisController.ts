import {
  type FarmPawsFinishResult,
  type FarmPawsRunSession,
  finishFarmPawsRun,
  startFarmPawsRun
} from "./api";
import { type FarmPawsLang, type FarmPawsTextKey } from "./i18n";
import { createTetrisAudioController, tetrisAudioForTransition } from "./tetrisAudio";
import { finishTetrisAttempt, startTetrisAttempt } from "./tetrisRunFlow";
import {
  TETRIS_BOARD_HEIGHT,
  TETRIS_BOARD_WIDTH,
  type TetrisPiece,
  type TetrisState,
  type TetrominoType,
  advanceTetris,
  canPlaceTetrisPiece,
  createTetrisInitialState,
  hardDropTetris,
  moveTetris,
  pauseTetrisGame,
  resumeTetrisGame,
  rotateTetris,
  softDropTetris,
  startTetrisGame,
  tetrisLineClearScore,
  tetrisPieceCells,
  tetrisTickDuration
} from "./tetrisState";
import { loadTetrisBestScore, saveTetrisBestScore } from "./storage";

type Translate = (key: FarmPawsTextKey, vars?: Record<string, string | number>) => string;

type TetrisControllerOptions = {
  tr: Translate;
  onBack: () => void;
  onLanguageChange: (lang: FarmPawsLang) => void;
  startBlockedText: (run: FarmPawsRunSession) => string;
};

export type TetrisController = {
  destroy: () => void;
};

type TetrisLayout = "lobby" | "game";
type TetrisAction = "left" | "right" | "rotate" | "down" | "drop";

const REPEATING_ACTIONS = new Set<TetrisAction>(["left", "right", "down"]);
const REPEAT_DELAY_MS = 180;
const REPEAT_INTERVAL_MS = 72;

const PIECE_COLORS: Record<TetrominoType, string> = {
  I: "#79c7ad",
  J: "#6f9bd1",
  L: "#e99061",
  O: "#f7cf72",
  S: "#9bc75d",
  T: "#ad8bd4",
  Z: "#d783a5"
};

const PREVIEW_CELLS: ReadonlyArray<{ x: number; y: number; type: TetrominoType }> = [
  { x: 0, y: 19, type: "J" },
  { x: 1, y: 19, type: "J" },
  { x: 2, y: 19, type: "O" },
  { x: 3, y: 19, type: "O" },
  { x: 4, y: 19, type: "S" },
  { x: 5, y: 19, type: "S" },
  { x: 6, y: 19, type: "T" },
  { x: 7, y: 19, type: "T" },
  { x: 8, y: 19, type: "L" },
  { x: 9, y: 19, type: "L" },
  { x: 0, y: 18, type: "J" },
  { x: 2, y: 18, type: "O" },
  { x: 3, y: 18, type: "O" },
  { x: 5, y: 18, type: "S" },
  { x: 6, y: 18, type: "T" },
  { x: 8, y: 18, type: "L" },
  { x: 9, y: 18, type: "L" },
  { x: 0, y: 17, type: "I" },
  { x: 1, y: 17, type: "I" },
  { x: 2, y: 17, type: "I" },
  { x: 3, y: 17, type: "I" }
];

export function mountTetrisController(
  root: HTMLElement,
  options: TetrisControllerOptions
): TetrisController {
  const { tr } = options;
  const eventController = new AbortController();
  const listenerOptions = { signal: eventController.signal };
  const audio = createTetrisAudioController();
  let state = createTetrisInitialState(loadTetrisBestScore());
  let layout: TetrisLayout = "lobby";
  let tickTimer: number | null = null;
  let repeatTimer: number | null = null;
  let repeatAction: TetrisAction | null = null;
  let destroyed = false;
  let lifecycleToken = 0;
  let currentRun: FarmPawsRunSession | null = null;
  let activeRunDurationMs = 0;
  let activeRunSegmentStartedAt = 0;
  let closingConfirmationEnabled = false;
  let isStartingRun = false;
  let finishPending = false;
  let finishResult: FarmPawsFinishResult | null = null;
  let startBlockMessage: string | null = null;

  root.innerHTML = `
    <div class="tetris-screen" data-tetris-screen data-layout="lobby">
      <section class="tetris-lobby-header">
        <div class="tetris-lobby-toolbar">
          <button class="back-button tetris-lobby-back" data-tetris-action="back" type="button">
            <span data-tetris-back-copy>${escapeHtml(tr("back_to_games"))}</span>
          </button>
          <button class="tetris-hud-button tetris-sound-button" data-tetris-action="sound" type="button"></button>
        </div>
        <div class="tetris-lobby-hero">
          <div class="tetris-lobby-icon" aria-hidden="true">🧱</div>
          <p class="eyebrow" data-tetris-eyebrow>${escapeHtml(tr("games_eyebrow"))}</p>
          <h1 data-tetris-title>${escapeHtml(tr("tetris_title"))}</h1>
          <p class="tetris-lobby-description" data-tetris-description>${escapeHtml(tr("tetris_description"))}</p>
        </div>
      </section>

      <header class="tetris-game-hud" aria-label="${escapeHtml(tr("stats_label"))}">
        <button class="tetris-hud-button tetris-hud-back" data-tetris-action="back" type="button" aria-label="${escapeHtml(tr("back_to_games"))}">←</button>
        <strong class="tetris-hud-title"><span aria-hidden="true">🧱</span> <span data-tetris-title>${escapeHtml(tr("tetris_title"))}</span></strong>
        <div class="tetris-hud-stats">
          <span class="tetris-hud-stat" data-tetris-record-stat aria-label="${escapeHtml(tr("record_label"))}">🏆 <strong data-tetris-best>${state.bestScore}</strong></span>
          <span class="tetris-hud-stat is-score" data-tetris-score-stat aria-label="${escapeHtml(tr("score_label"))}">⭐ <strong data-tetris-score>0</strong></span>
        </div>
        <button class="tetris-hud-button tetris-sound-button" data-tetris-action="sound" type="button"></button>
        <button class="tetris-hud-button tetris-hud-pause" data-tetris-action="pause" type="button" aria-label="${escapeHtml(tr("tetris_pause"))}">⏸</button>
      </header>

      <section class="tetris-meta" aria-label="${escapeHtml(tr("stats_label"))}">
        <span><span data-tetris-record-label>${escapeHtml(tr("record_label"))}</span>: <strong data-tetris-best>${state.bestScore}</strong></span>
        <small data-tetris-run-note>${escapeHtml(tr("tetris_attempt_note"))}</small>
      </section>

      <p class="tetris-status" data-tetris-status aria-live="polite"></p>
      <p class="tetris-run-message" data-tetris-run-message role="status" aria-live="polite" aria-atomic="true"></p>

      <div class="tetris-stage-slot">
        <div class="tetris-stage">
          <div class="tetris-board-wrap">
            <canvas
              class="tetris-board"
              data-tetris-board
              width="200"
              height="400"
              tabindex="0"
              role="img"
              aria-label="${escapeHtml(tr("tetris_board_label"))}"
            ></canvas>
          </div>
          <aside class="tetris-rail">
            <span class="tetris-next-label" data-tetris-next-label>${escapeHtml(tr("tetris_next"))}</span>
            <div class="tetris-next-wrap">
              <canvas class="tetris-next-board" data-tetris-next width="80" height="80" aria-hidden="true"></canvas>
            </div>
            <span class="tetris-rail-stat"><small data-tetris-lines-label>${escapeHtml(tr("tetris_lines"))}</small><strong data-tetris-lines>0</strong></span>
            <span class="tetris-rail-stat"><small data-tetris-level-label>${escapeHtml(tr("tetris_level"))}</small><strong data-tetris-level>1</strong></span>
          </aside>

          <div class="tetris-stage-overlay" data-tetris-overlay role="dialog" aria-modal="true" aria-labelledby="tetris-overlay-title" tabindex="-1" hidden>
            <strong class="tetris-overlay-title" id="tetris-overlay-title" data-tetris-overlay-title></strong>
            <span class="tetris-overlay-score" data-tetris-overlay-score></span>
            <p class="tetris-overlay-message" data-tetris-overlay-message></p>
            <div class="tetris-overlay-actions">
              <button class="primary-button tetris-overlay-primary" data-tetris-action="overlay-primary" type="button"></button>
              <button class="secondary-button tetris-overlay-back" data-tetris-action="overlay-back" type="button"></button>
              <button class="tetris-hud-button tetris-sound-button tetris-overlay-sound" data-tetris-action="sound" type="button"></button>
            </div>
          </div>
        </div>
      </div>

      <p class="tetris-controls-hint" data-tetris-controls-hint>${escapeHtml(tr("tetris_controls_hint"))}</p>
      <div class="tetris-controls" role="group" aria-label="${escapeHtml(tr("tetris_controls_label"))}">
        <button class="tetris-control is-left" data-tetris-control="left" type="button" aria-label="${escapeHtml(tr("tetris_move_left"))}" aria-keyshortcuts="ArrowLeft">◀</button>
        <button class="tetris-control is-right" data-tetris-control="right" type="button" aria-label="${escapeHtml(tr("tetris_move_right"))}" aria-keyshortcuts="ArrowRight">▶</button>
        <button class="tetris-control is-rotate" data-tetris-control="rotate" type="button" aria-label="${escapeHtml(tr("tetris_rotate"))}" aria-keyshortcuts="ArrowUp X">↻</button>
        <button class="tetris-control is-down" data-tetris-control="down" type="button" aria-label="${escapeHtml(tr("tetris_move_down"))}" aria-keyshortcuts="ArrowDown">▼</button>
        <button class="tetris-control is-drop" data-tetris-control="drop" type="button" aria-label="${escapeHtml(tr("tetris_hard_drop"))}" aria-keyshortcuts="Space">⇩</button>
      </div>

      <button class="primary-button tetris-primary-action" data-tetris-action="primary" type="button"></button>
    </div>
  `;

  const screenElement = requireElement<HTMLElement>(root, "[data-tetris-screen]");
  const canvas = requireElement<HTMLCanvasElement>(root, "[data-tetris-board]");
  const nextCanvas = requireElement<HTMLCanvasElement>(root, "[data-tetris-next]");
  const scoreElements = requireElements<HTMLElement>(root, "[data-tetris-score]");
  const bestElements = requireElements<HTMLElement>(root, "[data-tetris-best]");
  const linesElement = requireElement<HTMLElement>(root, "[data-tetris-lines]");
  const levelElement = requireElement<HTMLElement>(root, "[data-tetris-level]");
  const statusElement = requireElement<HTMLElement>(root, "[data-tetris-status]");
  const runNoteElement = requireElement<HTMLElement>(root, "[data-tetris-run-note]");
  const runMessageElement = requireElement<HTMLElement>(root, "[data-tetris-run-message]");
  const primaryButton = requireElement<HTMLButtonElement>(root, "[data-tetris-action='primary']");
  const pauseButton = requireElement<HTMLButtonElement>(root, "[data-tetris-action='pause']");
  const overlayElement = requireElement<HTMLElement>(root, "[data-tetris-overlay]");
  const overlayTitleElement = requireElement<HTMLElement>(root, "[data-tetris-overlay-title]");
  const overlayScoreElement = requireElement<HTMLElement>(root, "[data-tetris-overlay-score]");
  const overlayMessageElement = requireElement<HTMLElement>(root, "[data-tetris-overlay-message]");
  const overlayPrimaryButton = requireElement<HTMLButtonElement>(root, "[data-tetris-action='overlay-primary']");
  const overlayBackButton = requireElement<HTMLButtonElement>(root, "[data-tetris-action='overlay-back']");
  const overlaySoundButton = requireElement<HTMLButtonElement>(root, ".tetris-overlay-sound");
  const backButtons = requireElements<HTMLButtonElement>(root, "[data-tetris-action='back']");
  const soundButtons = requireElements<HTMLButtonElement>(root, "[data-tetris-action='sound']");
  const controlButtons = requireElements<HTMLButtonElement>(root, "[data-tetris-control]");
  const boardResizeObserver = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => drawGame());

  boardResizeObserver?.observe(canvas);
  boardResizeObserver?.observe(nextCanvas);

  backButtons.forEach((button) => button.addEventListener("click", handleBack, listenerOptions));
  soundButtons.forEach((button) => button.addEventListener("click", handleSoundToggle, listenerOptions));
  primaryButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  pauseButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  overlayPrimaryButton.addEventListener("click", handlePrimaryAction, listenerOptions);
  overlayBackButton.addEventListener("click", handleBack, listenerOptions);
  controlButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const action = button.dataset.tetrisControl as TetrisAction | undefined;
      if (!action) return;
      performAction(action);
      if (REPEATING_ACTIONS.has(action)) startActionRepeat(action);
    }, listenerOptions);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      const action = button.dataset.tetrisControl as TetrisAction | undefined;
      if (action) performAction(action);
    }, listenerOptions);
  });
  window.addEventListener("pointerup", stopActionRepeat, listenerOptions);
  window.addEventListener("pointercancel", stopActionRepeat, listenerOptions);
  window.addEventListener("blur", stopActionRepeat, listenerOptions);
  window.addEventListener("keydown", handleKeyDown, listenerOptions);
  window.addEventListener("resize", drawGame, listenerOptions);
  window.addEventListener("pagehide", pauseForBackground, listenerOptions);
  document.addEventListener("visibilitychange", handleVisibilityChange, listenerOptions);

  updateView();

  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      lifecycleToken += 1;
      stopLoop();
      stopActionRepeat();
      audio.destroy();
      boardResizeObserver?.disconnect();
      setTelegramClosingConfirmation(false);
      eventController.abort();
      root.replaceChildren();
    }
  };

  function handleSoundToggle(): void {
    audio.setEnabled(!audio.enabled);
    if (audio.enabled) {
      audio.play("resume");
      if (state.phase === "playing") audio.startMusic(state.level);
    }
    updateSoundButtons();
  }

  function handlePrimaryAction(): void {
    audio.unlock();
    if (isStartingRun || finishPending || hasHardStartBlock()) return;
    if (state.phase === "playing") {
      pauseActiveTiming();
      state = pauseTetrisGame(state);
      stopLoop();
      stopActionRepeat();
      audio.pauseMusic();
      audio.play("pause");
      updateView();
      overlayPrimaryButton.focus({ preventScroll: true });
      return;
    }
    if (state.phase === "paused") {
      state = resumeTetrisGame(state);
      beginActiveTiming();
      audio.play("resume");
      audio.startMusic(state.level);
      updateView();
      scheduleTick();
      canvas.focus({ preventScroll: true });
      return;
    }
    if (
      state.phase === "gameover"
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
    stopActionRepeat();
    audio.stopMusic();
    currentRun = null;
    finishResult = null;
    startBlockMessage = null;
    activeRunDurationMs = 0;
    activeRunSegmentStartedAt = 0;
    setTelegramClosingConfirmation(false);
    isStartingRun = true;
    state = createTetrisInitialState(loadTetrisBestScore());
    updateView();

    const run = await startTetrisAttempt(
      (bestScore) => startFarmPawsRun(bestScore, "tetris"),
      loadTetrisBestScore()
    );
    if (destroyed || token !== lifecycleToken) return;

    options.onLanguageChange(run.lang);
    const localBestScore = loadTetrisBestScore();
    const syncedBestScore = Math.max(localBestScore, run.bestScore);
    if (syncedBestScore > localBestScore) saveTetrisBestScore(syncedBestScore);
    if (run.mode === "blocked") {
      isStartingRun = false;
      layout = "lobby";
      currentRun = run;
      startBlockMessage = options.startBlockedText(run);
      state = createTetrisInitialState(syncedBestScore);
      updateView();
      return;
    }

    currentRun = run;
    layout = "game";
    setTelegramClosingConfirmation(run.mode === "server");
    state = createTetrisInitialState(syncedBestScore);
    updateView();
    overlayElement.focus({ preventScroll: true });
    await wait(650);
    if (destroyed || token !== lifecycleToken) return;

    isStartingRun = false;
    state = startTetrisGame(syncedBestScore);
    if (document.hidden) state = pauseTetrisGame(state);
    if (state.phase === "playing") beginActiveTiming();
    if (state.phase === "playing") {
      audio.play("start");
      audio.startMusic(state.level);
    }
    updateView();
    if (state.phase === "playing") {
      scheduleTick();
      canvas.focus({ preventScroll: true });
    }
  }

  function performAction(action: TetrisAction, rotationDirection: -1 | 1 = 1): void {
    if (state.phase !== "playing") return;
    const previousState = state;
    const previousBestScore = state.bestScore;
    if (action === "left") state = moveTetris(state, -1);
    if (action === "right") state = moveTetris(state, 1);
    if (action === "rotate") state = rotateTetris(state, rotationDirection);
    if (action === "down") state = softDropTetris(state);
    if (action === "drop") state = hardDropTetris(state);
    if (state === previousState) return;

    if (state.bestScore > previousBestScore) saveTetrisBestScore(state.bestScore);
    playTransitionAudio(previousState, state, action);
    updateView();
    if (state.phase === "gameover") {
      stopLoop();
      stopActionRepeat();
      pauseActiveTiming();
      overlayElement.focus({ preventScroll: true });
      void finishCurrentRun();
      return;
    }
    if (action === "down" || action === "drop") scheduleTick();
  }

  function playTransitionAudio(
    previousState: TetrisState,
    nextState: TetrisState,
    action: TetrisAction | null
  ): void {
    const transition = tetrisAudioForTransition(previousState, nextState, action);
    if (!transition) return;
    if (transition.kind === "line-clear") {
      audio.playLineClear(transition.count, transition.levelUp);
      audio.startMusic(nextState.level);
      return;
    }
    if (transition.cue === "game-over") {
      audio.stopMusic();
    }
    audio.play(transition.cue);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Tab" && !overlayElement.hidden) {
      trapOverlayFocus(event);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    const targetButton = event.target instanceof HTMLElement
      ? event.target.closest("button")
      : null;
    const targetIsVisibleButton = Boolean(targetButton?.getClientRects().length);

    if ((key === "p" || event.key === "Escape") && (state.phase === "playing" || state.phase === "paused")) {
      if (event.repeat) return;
      event.preventDefault();
      handlePrimaryAction();
      return;
    }
    if (state.phase !== "playing") return;
    if (event.code === "Space" && targetIsVisibleButton) return;

    let action: TetrisAction | null = null;
    let rotationDirection: -1 | 1 = 1;
    if (event.key === "ArrowLeft") action = "left";
    if (event.key === "ArrowRight") action = "right";
    if (event.key === "ArrowDown") action = "down";
    if (event.key === "ArrowUp" || key === "x") action = "rotate";
    if (key === "z") {
      action = "rotate";
      rotationDirection = -1;
    }
    if (event.code === "Space") action = "drop";
    if (!action || (event.repeat && (action === "rotate" || action === "drop"))) return;

    event.preventDefault();
    performAction(action, rotationDirection);
  }

  function startActionRepeat(action: TetrisAction): void {
    stopActionRepeat();
    repeatAction = action;
    repeatTimer = window.setTimeout(runRepeatedAction, REPEAT_DELAY_MS);
  }

  function runRepeatedAction(): void {
    repeatTimer = null;
    if (!repeatAction || state.phase !== "playing") return;
    performAction(repeatAction);
    if (!repeatAction || state.phase !== "playing") return;
    repeatTimer = window.setTimeout(runRepeatedAction, REPEAT_INTERVAL_MS);
  }

  function stopActionRepeat(): void {
    repeatAction = null;
    if (repeatTimer === null) return;
    window.clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  function trapOverlayFocus(event: KeyboardEvent): void {
    const focusable = [overlayPrimaryButton, overlayBackButton, overlaySoundButton].filter(
      (button) => !button.hidden && !button.disabled
    );
    event.preventDefault();
    if (!focusable.length) {
      overlayElement.focus({ preventScroll: true });
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement as HTMLButtonElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = currentIndex < 0
      ? event.shiftKey ? focusable.length - 1 : 0
      : (currentIndex + direction + focusable.length) % focusable.length;
    focusable[nextIndex].focus({ preventScroll: true });
  }

  function beginActiveTiming(): void {
    if (activeRunSegmentStartedAt > 0) return;
    activeRunSegmentStartedAt = Date.now();
  }

  function pauseActiveTiming(): void {
    if (activeRunSegmentStartedAt <= 0) return;
    activeRunDurationMs += Math.max(0, Date.now() - activeRunSegmentStartedAt);
    activeRunSegmentStartedAt = 0;
  }

  function setTelegramClosingConfirmation(enabled: boolean): void {
    if (closingConfirmationEnabled === enabled) return;
    closingConfirmationEnabled = enabled;
    const webApp = window.Telegram?.WebApp;
    try {
      if (enabled) webApp?.enableClosingConfirmation?.();
      else webApp?.disableClosingConfirmation?.();
    } catch {
      // Closing confirmation is not available in every Telegram client.
    }
  }

  function handleVisibilityChange(): void {
    if (document.hidden) pauseForBackground();
  }

  function pauseForBackground(): void {
    audio.suspend();
    if (state.phase !== "playing") return;
    pauseActiveTiming();
    state = pauseTetrisGame(state);
    stopLoop();
    stopActionRepeat();
    updateView();
  }

  function scheduleTick(): void {
    if (destroyed || state.phase !== "playing") return;
    stopLoop();
    tickTimer = window.setTimeout(runTick, tetrisTickDuration(state.level));
  }

  function runTick(): void {
    tickTimer = null;
    if (destroyed || state.phase !== "playing") return;
    const previousBestScore = state.bestScore;
    const previousState = state;
    state = advanceTetris(state);
    if (state.bestScore > previousBestScore) saveTetrisBestScore(state.bestScore);
    playTransitionAudio(previousState, state, null);
    updateView();
    if (state.phase === "playing") {
      scheduleTick();
      return;
    }
    if (state.phase === "gameover") {
      pauseActiveTiming();
      overlayElement.focus({ preventScroll: true });
      void finishCurrentRun();
    }
  }

  async function finishCurrentRun(): Promise<void> {
    if (!currentRun || finishPending || finishResult?.ok) return;
    const token = lifecycleToken;
    finishPending = true;
    finishResult = null;
    updateView();

    const result = await finishTetrisAttempt(finishFarmPawsRun, currentRun, {
      score: state.score,
      level: state.level,
      startedAt: 0,
      finishedAt: activeRunDurationMs
    });
    if (destroyed || token !== lifecycleToken) return;

    finishPending = false;
    finishResult = result;
    if (result.ok) setTelegramClosingConfirmation(false);
    if (typeof result.bestScore === "number" && result.bestScore > state.bestScore) {
      state = {
        ...state,
        bestScore: result.bestScore
      };
      saveTetrisBestScore(result.bestScore);
    }
    updateView();
    overlayPrimaryButton.focus({ preventScroll: true });
  }

  function handleBack(): void {
    if (isStartingRun || finishPending) return;
    const activeServerRun = currentRun?.mode === "server"
      && (state.phase === "playing" || state.phase === "paused");
    const unsavedServerResult = currentRun?.mode === "server"
      && state.phase === "gameover"
      && Boolean(finishResult && !finishResult.ok);
    if (activeServerRun && !window.confirm(tr("leave_run_confirm"))) return;
    if (unsavedServerResult && !window.confirm(tr("leave_unsaved_confirm"))) return;
    lifecycleToken += 1;
    stopLoop();
    stopActionRepeat();
    audio.stopMusic();
    setTelegramClosingConfirmation(false);
    options.onBack();
  }

  function stopLoop(): void {
    if (tickTimer === null) return;
    window.clearTimeout(tickTimer);
    tickTimer = null;
  }

  function updateView(): void {
    const hardStartBlock = hasHardStartBlock();
    const terminal = state.phase === "gameover";
    const runMessage = tetrisRunMessage({
      startBlockMessage,
      finishPending,
      finishResult,
      tr
    });
    updateStaticTranslations();
    screenElement.dataset.layout = layout;
    screenElement.dataset.phase = isStartingRun ? "starting" : state.phase;
    scoreElements.forEach((element) => {
      element.textContent = String(state.score);
    });
    bestElements.forEach((element) => {
      element.textContent = String(state.bestScore);
    });
    linesElement.textContent = String(state.lines);
    levelElement.textContent = String(state.level);
    statusElement.textContent = hardStartBlock
      ? tr("tetris_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "tetris_get_ready" : "start_busy")
        : tetrisStatusText(state, tr);
    statusElement.dataset.phase = hardStartBlock ? "blocked" : isStartingRun ? "starting" : state.phase;
    runNoteElement.textContent = tetrisRunNote(
      currentRun,
      Boolean(window.Telegram?.WebApp?.initData),
      tr
    );
    runMessageElement.textContent = runMessage;
    runMessageElement.dataset.tone = tetrisRunMessageTone({ startBlockMessage, finishPending, finishResult });
    primaryButton.textContent = hardStartBlock
      ? tr("tetris_unavailable")
      : isStartingRun
        ? tr(currentRun?.mode === "server" ? "tetris_get_ready" : "start_busy")
        : startBlockMessage
          ? tr("retry_start")
          : tetrisPrimaryText(state.phase, finishPending, finishResult, tr);
    primaryButton.disabled = isStartingRun || finishPending || hardStartBlock;
    backButtons.forEach((button) => {
      button.disabled = isStartingRun || finishPending;
    });
    pauseButton.textContent = state.phase === "paused" ? "▶" : "⏸";
    pauseButton.setAttribute("aria-label", tr(state.phase === "paused" ? "tetris_resume" : "tetris_pause"));
    pauseButton.hidden = layout !== "game" || isStartingRun || terminal;
    pauseButton.disabled = state.phase !== "playing" && state.phase !== "paused";

    const overlayVisible = layout === "game"
      && (isStartingRun || state.phase === "paused" || terminal);
    overlayElement.hidden = !overlayVisible;
    overlayElement.dataset.tone = terminal
      ? finishResult?.ok ? "success" : finishResult ? "error" : "pending"
      : state.phase === "paused" ? "paused" : "starting";
    overlayTitleElement.textContent = isStartingRun
      ? tr(currentRun?.mode === "server" ? "tetris_get_ready" : "start_busy")
      : state.phase === "paused"
        ? tr("tetris_paused")
        : tr("tetris_game_over");
    overlayScoreElement.textContent = terminal ? tr("tetris_result_score", { score: state.score }) : "";
    overlayScoreElement.hidden = !terminal;
    overlayMessageElement.textContent = terminal ? runMessage : "";
    overlayMessageElement.hidden = !terminal || !runMessage;

    const showOverlayPrimary = state.phase === "paused" || (terminal && !finishPending);
    overlayPrimaryButton.hidden = !showOverlayPrimary;
    overlayPrimaryButton.disabled = finishPending;
    overlayPrimaryButton.textContent = state.phase === "paused"
      ? tr("tetris_resume")
      : tetrisPrimaryText(state.phase, finishPending, finishResult, tr);
    overlayBackButton.hidden = !terminal || finishPending;
    overlayBackButton.disabled = finishPending;
    overlayBackButton.textContent = tr("back_to_games");
    canvas.setAttribute(
      "aria-label",
      `${tr("tetris_board_label")}. ${tr("score_label")}: ${state.score}. ${tr("tetris_lines")}: ${state.lines}. ${tr("tetris_level")}: ${state.level}. ${tr("record_label")}: ${state.bestScore}.`
    );
    controlButtons.forEach((button) => {
      button.disabled = isStartingRun || state.phase !== "playing";
    });
    drawGame();
  }

  function hasHardStartBlock(): boolean {
    return currentRun?.mode === "blocked" && currentRun.code !== "start_unavailable";
  }

  function updateSoundButtons(): void {
    const actionLabel = tr(audio.enabled ? "tetris_audio_disable" : "tetris_audio_enable");
    soundButtons.forEach((button) => {
      button.textContent = audio.enabled ? "🔊" : "🔇";
      button.setAttribute("aria-label", tr("tetris_audio_label"));
      button.setAttribute("title", actionLabel);
      button.setAttribute("aria-pressed", String(audio.enabled));
    });
  }

  function updateStaticTranslations(): void {
    updateSoundButtons();
    backButtons.forEach((button) => button.setAttribute("aria-label", tr("back_to_games")));
    requireElement<HTMLElement>(root, "[data-tetris-back-copy]").textContent = tr("back_to_games");
    requireElement<HTMLElement>(root, "[data-tetris-eyebrow]").textContent = tr("games_eyebrow");
    requireElements<HTMLElement>(root, "[data-tetris-title]").forEach((element) => {
      element.textContent = tr("tetris_title");
    });
    requireElement<HTMLElement>(root, "[data-tetris-description]").textContent = tr("tetris_description");
    requireElements<HTMLElement>(root, "[data-tetris-record-label]").forEach((element) => {
      element.textContent = tr("record_label");
    });
    requireElement<HTMLElement>(root, "[data-tetris-controls-hint]").textContent = tr("tetris_controls_hint");
    requireElement<HTMLElement>(root, "[data-tetris-next-label]").textContent = tr("tetris_next");
    requireElement<HTMLElement>(root, "[data-tetris-lines-label]").textContent = tr("tetris_lines");
    requireElement<HTMLElement>(root, "[data-tetris-level-label]").textContent = tr("tetris_level");
    requireElement<HTMLElement>(root, "[data-tetris-record-stat]").setAttribute("aria-label", tr("record_label"));
    requireElement<HTMLElement>(root, "[data-tetris-score-stat]").setAttribute("aria-label", tr("score_label"));
    requireElement<HTMLElement>(root, ".tetris-game-hud").setAttribute("aria-label", tr("stats_label"));
    requireElement<HTMLElement>(root, ".tetris-meta").setAttribute("aria-label", tr("stats_label"));
    requireElement<HTMLElement>(root, ".tetris-controls").setAttribute("aria-label", tr("tetris_controls_label"));
    const actionLabels: Record<TetrisAction, FarmPawsTextKey> = {
      left: "tetris_move_left",
      right: "tetris_move_right",
      rotate: "tetris_rotate",
      down: "tetris_move_down",
      drop: "tetris_hard_drop"
    };
    controlButtons.forEach((button) => {
      const action = button.dataset.tetrisControl as TetrisAction | undefined;
      if (action) button.setAttribute("aria-label", tr(actionLabels[action]));
    });
  }

  function drawGame(): void {
    if (destroyed) return;
    drawBoard(canvas, state, layout);
    drawNextPiece(nextCanvas, state.next);
  }
}

function drawBoard(canvas: HTMLCanvasElement, state: TetrisState, layout: TetrisLayout): void {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.round(rect.width || 200));
  const cssHeight = Math.max(1, Math.round(rect.height || 400));
  const density = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  resizeCanvas(canvas, cssWidth, cssHeight, density);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  const cellWidth = cssWidth / TETRIS_BOARD_WIDTH;
  const cellHeight = cssHeight / TETRIS_BOARD_HEIGHT;

  for (let y = 0; y < TETRIS_BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? "#294837" : "#264331";
      context.fillRect(x * cellWidth, y * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
    }
  }

  if (layout === "lobby" && state.phase === "idle") {
    PREVIEW_CELLS.forEach((cell) => drawTetrisCell(context, cell.x, cell.y, cellWidth, cellHeight, cell.type));
  }
  for (let y = 0; y < state.board.length; y += 1) {
    for (let x = 0; x < state.board[y].length; x += 1) {
      const type = state.board[y][x];
      if (type) drawTetrisCell(context, x, y, cellWidth, cellHeight, type);
    }
  }

  if (canPlaceTetrisPiece(state.board, state.active)) {
    if (layout === "game" && (state.phase === "playing" || state.phase === "paused")) {
      const ghost = landingPiece(state);
      tetrisPieceCells(ghost).forEach(({ x, y }) => {
        if (y >= 0) drawTetrisCell(context, x, y, cellWidth, cellHeight, ghost.type, true);
      });
    }
    tetrisPieceCells(state.active).forEach(({ x, y }) => {
      if (y >= 0) drawTetrisCell(context, x, y, cellWidth, cellHeight, state.active.type);
    });
  }
}

function drawNextPiece(canvas: HTMLCanvasElement, type: TetrominoType): void {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.round(rect.width || 80));
  const cssHeight = Math.max(1, Math.round(rect.height || 80));
  const density = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  resizeCanvas(canvas, cssWidth, cssHeight, density);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.fillStyle = "rgba(38, 67, 49, 0.78)";
  context.fillRect(0, 0, cssWidth, cssHeight);

  const basePiece: TetrisPiece = { type, rotation: 0, x: 0, y: 0 };
  const cells = tetrisPieceCells(basePiece);
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cellSize = Math.min(cssWidth, cssHeight) / 4.5;
  const offsetX = (cssWidth - width * cellSize) / 2 - minX * cellSize;
  const offsetY = (cssHeight - height * cellSize) / 2 - minY * cellSize;
  cells.forEach(({ x, y }) => {
    drawTetrisPixel(context, offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize, type);
  });
}

function landingPiece(state: TetrisState): TetrisPiece {
  let piece = state.active;
  while (true) {
    const next = { ...piece, y: piece.y + 1 };
    if (!canPlaceTetrisPiece(state.board, next)) return piece;
    piece = next;
  }
}

function drawTetrisCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  type: TetrominoType,
  ghost = false
): void {
  drawTetrisPixel(
    context,
    x * cellWidth,
    y * cellHeight,
    cellWidth,
    cellHeight,
    type,
    ghost
  );
}

function drawTetrisPixel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  type: TetrominoType,
  ghost = false
): void {
  const inset = Math.max(1, Math.min(width, height) * 0.08);
  context.save();
  if (ghost) {
    context.globalAlpha = 0.32;
    context.strokeStyle = PIECE_COLORS[type];
    context.lineWidth = Math.max(1.5, inset);
    context.strokeRect(x + inset * 1.5, y + inset * 1.5, width - inset * 3, height - inset * 3);
    context.restore();
    return;
  }
  context.fillStyle = PIECE_COLORS[type];
  context.fillRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  context.fillStyle = "rgba(255, 255, 255, 0.3)";
  context.fillRect(x + inset * 1.6, y + inset * 1.6, width - inset * 3.2, Math.max(1.5, inset * 0.8));
  context.fillStyle = "rgba(39, 56, 34, 0.2)";
  context.fillRect(x + inset, y + height - inset * 2.2, width - inset * 2, inset * 1.2);
  context.restore();
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  density: number
): void {
  const pixelWidth = Math.round(cssWidth * density);
  const pixelHeight = Math.round(cssHeight * density);
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
}

function tetrisStatusText(state: TetrisState, tr: Translate): string {
  if (state.phase === "playing" && state.lastClear > 0) {
    return tr("tetris_line_clear", {
      count: state.lastClear,
      points: tetrisLineClearScore(state.lastClear)
    });
  }
  if (state.phase === "playing") return tr("tetris_running");
  if (state.phase === "paused") return tr("tetris_paused");
  if (state.phase === "gameover") return tr("tetris_game_over");
  return tr("tetris_ready");
}

function tetrisPrimaryText(
  phase: TetrisState["phase"],
  finishPending: boolean,
  finishResult: FarmPawsFinishResult | null,
  tr: Translate
): string {
  if (finishPending) return tr("reward_saving");
  if (phase === "gameover" && finishResult?.mode === "server" && !finishResult.ok) {
    return tr("retry_save");
  }
  if (phase === "playing") return tr("tetris_pause");
  if (phase === "paused") return tr("tetris_resume");
  if (phase === "gameover") return tr("tetris_restart");
  return tr("tetris_start");
}

function tetrisRunNote(
  session: FarmPawsRunSession | null,
  hasTelegramInitData: boolean,
  tr: Translate
): string {
  if (session?.mode === "local") return tr("tetris_local_note");
  if (
    session?.mode === "server"
    && typeof session.dailyStarts === "number"
    && typeof session.dailyLimit === "number"
    && session.dailyLimit > 0
  ) {
    return tr("tetris_attempt_used", {
      used: Math.min(session.dailyStarts, session.dailyLimit),
      limit: session.dailyLimit
    });
  }
  return hasTelegramInitData ? tr("tetris_attempt_note") : tr("tetris_local_note");
}

type TetrisRunMessageInput = {
  startBlockMessage: string | null;
  finishPending: boolean;
  finishResult: FarmPawsFinishResult | null;
  tr: Translate;
};

function tetrisRunMessage(input: TetrisRunMessageInput): string {
  if (input.startBlockMessage) return input.startBlockMessage;
  if (input.finishPending) return input.tr("reward_saving");
  if (!input.finishResult) return "";
  if (input.finishResult.mode === "local") return input.tr("reward_local");
  if (!input.finishResult.ok) return input.tr("reward_not_saved");
  if (input.finishResult.duplicate) return input.tr("reward_already_saved");
  return input.tr("reward_ok", { xp: input.finishResult.xpReward || 0 });
}

function tetrisRunMessageTone(
  input: Omit<TetrisRunMessageInput, "tr">
): "neutral" | "pending" | "success" | "error" {
  if (input.startBlockMessage) return "error";
  if (input.finishPending) return "pending";
  if (!input.finishResult) return "neutral";
  if (input.finishResult.mode === "local") return "neutral";
  return input.finishResult.ok ? "success" : "error";
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Tetris element was not found: ${selector}`);
  return element;
}

function requireElements<T extends Element>(root: ParentNode, selector: string): T[] {
  const elements = Array.from(root.querySelectorAll<T>(selector));
  if (!elements.length) throw new Error(`Tetris elements were not found: ${selector}`);
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
