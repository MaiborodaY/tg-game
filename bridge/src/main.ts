import "./styles.css";

import { parseBridgeLaunch } from "./launch.ts";
import {
  createBridgeNetworkClient,
  getBridgeNetworkErrorMessage,
  type BridgeRoomConnection,
} from "./network/client.ts";
import {
  createBridgeCommandId,
  type BridgeRoomSession,
  type BridgeRoomSnapshot,
} from "./network/protocol.ts";
import {
  SHEDDING_SUITS,
  applySheddingAction,
  chooseSheddingBotAction,
  createSheddingGame,
  createSheddingViewerSnapshot,
  getSheddingCard,
  getSheddingTurnController,
  otherSheddingSeat,
  type SheddingAction,
  type SheddingCardId,
  type SheddingGameState,
  type SheddingSeat,
  type SheddingSuit,
  type SheddingViewerSnapshot,
} from "./shedding/index.ts";
import { setupTelegramBridge } from "./telegram.ts";
import { activateModalFocusTrap } from "./ui/modal.ts";

type Screen = "home" | "solo" | "pvp";
type ModalKind = "help" | "match" | null;
type NetworkStatus = "idle" | "connecting" | "online" | "offline";

const SUIT_META: Readonly<Record<SheddingSuit, { symbol: string; label: string }>> = Object.freeze({
  clubs: { symbol: "♣", label: "трефы" },
  diamonds: { symbol: "♦", label: "бубны" },
  hearts: { symbol: "♥", label: "червы" },
  spades: { symbol: "♠", label: "пики" },
});

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("Bridge root element is missing.");
const app = appRoot;

const telegram = setupTelegramBridge();
const launch = parseBridgeLaunch(window.location.href, telegram.startParam);
const developmentIdentity = getDevelopmentIdentity();
const network = createBridgeNetworkClient<SheddingViewerSnapshot>({
  initData: () => telegram.initData,
  developmentIdentity,
});

let screen: Screen = "home";
let soloGame: SheddingGameState | null = null;
let roomInput = launch.roomCode ?? "";
let pvpRoom: BridgeRoomSession<SheddingViewerSnapshot> | null = null;
let pvpSnapshot: BridgeRoomSnapshot<SheddingViewerSnapshot> | null = null;
let pvpConnection: BridgeRoomConnection | null = null;
let pvpReconnectTimer: number | null = null;
let reconnectAttempt = 0;
let intentionalSocketClose = false;
let networkStatus: NetworkStatus = "idle";
let busy = false;
let commandPending = false;
let modal: ModalKind = null;
let modalCleanup: (() => void) | null = null;
let selectedCards: SheddingCardId[] = [];
let selectedSuit: SheddingSuit = "hearts";
let botTimer: number | null = null;
let toastTimer: number | null = null;
let toastMessage = "";
let deadlineTicker: number | null = null;
let presentedMatchRevision = -1;

app.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
  if (!target) return;
  void handleAction(target.dataset.action ?? "", target);
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.role === "room-code") {
    roomInput = target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    target.value = roomInput;
    const joinButton = app.querySelector<HTMLButtonElement>("[data-action='join-room']");
    if (joinButton) joinButton.disabled = busy || !network.authenticated || roomInput.length !== 6;
  }
});

app.addEventListener("keydown", (event) => {
  const target = event.target;
  if (event.key === "Enter" && target instanceof HTMLInputElement && target.dataset.role === "room-code" && roomInput.length === 6) {
    event.preventDefault();
    void joinPvpRoom();
  }
});

window.addEventListener("beforeunload", () => {
  clearBotTimer();
  closePvpSocket(true);
  telegram.destroy();
});

render();
void restoreCurrentRoom();
window.addEventListener("load", () => {
  const refreshedLaunch = parseBridgeLaunch(window.location.href, telegram.startParam);
  if (!roomInput && refreshedLaunch.roomCode) {
    roomInput = refreshedLaunch.roomCode;
    render();
  }
  void restoreCurrentRoom();
}, { once: true });

async function handleAction(action: string, target: HTMLElement): Promise<void> {
  if (action === "back-to-games") {
    telegram.haptic("light");
    window.history.back();
    return;
  }
  if (action === "start-solo") {
    startSoloMatch();
    return;
  }
  if (action === "create-room") {
    await createPvpRoom();
    return;
  }
  if (action === "join-room") {
    await joinPvpRoom();
    return;
  }
  if (action === "back-home") {
    await returnHome();
    return;
  }
  if (action === "open-help") {
    modal = "help";
    render();
    return;
  }
  if (action === "open-match") {
    modal = "match";
    render();
    return;
  }
  if (action === "close-modal") {
    modal = null;
    render();
    return;
  }
  if (action === "toggle-card") {
    toggleCard(target.dataset.card ?? "");
    return;
  }
  if (action === "select-suit") {
    selectSuit(target.dataset.suit);
    return;
  }
  if (action === "play-selected") {
    await submitPlay();
    return;
  }
  if (action === "draw-card") {
    await submitSimpleAction({ type: "draw_card" });
    return;
  }
  if (action === "next-round") {
    await submitSimpleAction({ type: "next_round" });
    return;
  }
  if (action === "copy-code") {
    await copyRoomCode();
    return;
  }
  if (action === "share-code") {
    await shareRoomCode();
    return;
  }
  if (action === "leave-room") {
    await leavePvpRoom();
    return;
  }
  if (action === "new-solo") {
    modal = null;
    startSoloMatch();
    return;
  }
  if (action === "new-pvp") {
    modal = null;
    await leavePvpRoom(false);
    await createPvpRoom();
  }
}

function startSoloMatch(): void {
  clearBotTimer();
  soloGame = createSheddingGame({
    seed: createLocalSeed(),
    dealer: Math.random() < 0.5 ? "south" : "west",
    targetScore: 125,
  });
  screen = "solo";
  modal = null;
  presentedMatchRevision = -1;
  resetSelection();
  telegram.setGameInProgress(true);
  telegram.haptic("medium");
  render();
  scheduleSoloBot();
}

async function createPvpRoom(): Promise<void> {
  if (busy) return;
  busy = true;
  render();
  try {
    const room = await network.createRoom();
    await enterPvpRoom(room);
    telegram.haptic("success");
  } catch (error) {
    showToast(getBridgeNetworkErrorMessage(error));
  } finally {
    busy = false;
    render();
  }
}

async function joinPvpRoom(): Promise<void> {
  if (busy) return;
  if (roomInput.length !== 6) {
    showToast("Введите шестизначный код стола.");
    return;
  }
  busy = true;
  render();
  try {
    const room = await network.joinRoom(roomInput);
    await enterPvpRoom(room);
    telegram.haptic("success");
  } catch (error) {
    showToast(getBridgeNetworkErrorMessage(error));
    telegram.haptic("error");
  } finally {
    busy = false;
    render();
  }
}

async function restoreCurrentRoom(): Promise<void> {
  if (!network.authenticated || import.meta.env.DEV || screen !== "home") return;
  try {
    const room = await network.getCurrentRoom();
    if (room) await enterPvpRoom(room);
  } catch {
    // A stale Telegram session must not prevent solo play.
  }
}

async function enterPvpRoom(room: BridgeRoomSession<SheddingViewerSnapshot>): Promise<void> {
  clearBotTimer();
  screen = "pvp";
  pvpRoom = room;
  pvpSnapshot = room.snapshot;
  roomInput = room.roomCode;
  modal = null;
  commandPending = false;
  presentedMatchRevision = -1;
  resetSelection();
  telegram.setGameInProgress(room.snapshot.status !== "finished");
  render();
  await connectPvpSocket();
}

async function connectPvpSocket(): Promise<void> {
  if (!pvpRoom || screen !== "pvp") return;
  closePvpSocket(true);
  networkStatus = "connecting";
  intentionalSocketClose = false;
  render();
  try {
    const connection = await network.connectRoom(pvpRoom, {
      onOpen: () => {
        networkStatus = "online";
        reconnectAttempt = 0;
        render();
      },
      onMessage: (message) => {
        commandPending = false;
        if (message.type === "error") {
          if (message.code !== "stale_revision") showToast(getServerErrorMessage(message.code, message.message));
          render();
          return;
        }
        const previousPhase = pvpSnapshot?.view?.phase;
        pvpSnapshot = message.snapshot;
        if (pvpRoom) pvpRoom = { ...pvpRoom, snapshot: message.snapshot };
        resetSelection();
        telegram.setGameInProgress(message.snapshot.status !== "finished");
        networkStatus = "online";
        presentPhaseChange(previousPhase, message.snapshot.view);
        render();
      },
      onClose: () => {
        pvpConnection = null;
        commandPending = false;
        if (intentionalSocketClose || screen !== "pvp") return;
        networkStatus = "offline";
        render();
        schedulePvpReconnect();
      },
      onError: (error) => {
        networkStatus = "offline";
        commandPending = false;
        showToast(getBridgeNetworkErrorMessage(error));
        render();
      },
    });
    if (screen !== "pvp") {
      connection.close();
      return;
    }
    pvpConnection = connection;
  } catch (error) {
    networkStatus = "offline";
    commandPending = false;
    showToast(getBridgeNetworkErrorMessage(error));
    render();
    schedulePvpReconnect();
  }
}

function schedulePvpReconnect(): void {
  if (pvpReconnectTimer !== null || !pvpRoom || screen !== "pvp") return;
  const delay = Math.min(10_000, 800 * 2 ** Math.min(4, reconnectAttempt));
  reconnectAttempt += 1;
  pvpReconnectTimer = window.setTimeout(() => {
    pvpReconnectTimer = null;
    void connectPvpSocket();
  }, delay);
}

function closePvpSocket(intentional: boolean): void {
  intentionalSocketClose = intentional;
  if (pvpReconnectTimer !== null) {
    window.clearTimeout(pvpReconnectTimer);
    pvpReconnectTimer = null;
  }
  pvpConnection?.close();
  pvpConnection = null;
  commandPending = false;
  if (intentional) networkStatus = "idle";
}

async function leavePvpRoom(goHome = true): Promise<void> {
  const roomCode = pvpRoom?.roomCode;
  closePvpSocket(true);
  pvpRoom = null;
  pvpSnapshot = null;
  if (roomCode) {
    try {
      await network.leaveRoom(roomCode);
    } catch (error) {
      if (goHome) showToast(getBridgeNetworkErrorMessage(error));
    }
  }
  if (goHome) {
    screen = "home";
    telegram.setGameInProgress(false);
    render();
  }
}

async function returnHome(): Promise<void> {
  if (screen === "solo" && soloGame?.phase !== "match_complete") {
    if (!window.confirm("Покинуть незавершённый матч?")) return;
  }
  if (screen === "pvp") {
    if (pvpSnapshot?.status === "playing" && !window.confirm("Покинуть сетевой стол? ИИ продолжит игру за вас.")) return;
    await leavePvpRoom();
    return;
  }
  clearBotTimer();
  soloGame = null;
  screen = "home";
  modal = null;
  telegram.setGameInProgress(false);
  render();
}

function scheduleSoloBot(): void {
  clearBotTimer();
  if (screen !== "solo" || !soloGame || soloGame.phase === "match_complete") {
    if (soloGame?.phase === "match_complete") presentMatchResult(soloGame.revision);
    return;
  }

  const controller = getSheddingTurnController(soloGame);
  if (controller !== "west") return;
  const revision = soloGame.revision;
  const delay = soloGame.phase === "round_complete" ? 1_500 : deterministicBotDelay(revision);
  botTimer = window.setTimeout(() => {
    botTimer = null;
    if (!soloGame || soloGame.revision !== revision || screen !== "solo") return;
    const activeController = getSheddingTurnController(soloGame);
    if (!activeController) return;
    const action = chooseSheddingBotAction(createSheddingViewerSnapshot(soloGame, activeController));
    if (!action) {
      showToast("Крупье задумался и не смог выбрать ход.");
      return;
    }
    const previousPhase = soloGame.phase;
    soloGame = applySheddingAction(soloGame, action);
    resetSelection();
    presentPhaseChange(previousPhase, createSheddingViewerSnapshot(soloGame, "south"));
    render();
    scheduleSoloBot();
  }, delay);
}

function toggleCard(cardId: string): void {
  const view = getCurrentView();
  if (!view || view.phase !== "playing" || view.controller !== view.viewerSeat || commandPending) return;
  let normalized: SheddingCardId;
  try {
    normalized = getSheddingCard(cardId).id;
  } catch {
    return;
  }
  const hand = view.hands[view.viewerSeat] ?? [];
  if (!hand.includes(normalized)) return;

  if (selectedCards.includes(normalized)) {
    const next = selectedCards.filter((candidate) => candidate !== normalized);
    selectedCards = orderSelectionWithLegalLead(next, view.legalCardIds);
    if (next.length > 0 && selectedCards.length === 0) showToast("Оставьте первой карту, которой можно сходить.");
    telegram.haptic("light");
    render();
    return;
  }

  if (selectedCards.length === 0) {
    if (!view.legalCardIds.includes(normalized)) return;
    selectedCards = [normalized];
  } else {
    const selectedRank = getSheddingCard(selectedCards[0]).rank;
    if (getSheddingCard(normalized).rank !== selectedRank) {
      showToast("За один ход можно положить только карты одного достоинства.");
      return;
    }
    selectedCards = orderSelectionWithLegalLead([...selectedCards, normalized], view.legalCardIds);
  }

  if (getSelectedRank() === 11) selectedSuit = choosePreferredSuit(hand, selectedCards);
  telegram.haptic("light");
  render();
}

function selectSuit(value: string | undefined): void {
  if (!SHEDDING_SUITS.includes(value as SheddingSuit) || getSelectedRank() !== 11) return;
  selectedSuit = value as SheddingSuit;
  telegram.haptic("light");
  render();
}

async function submitPlay(): Promise<void> {
  if (selectedCards.length === 0 || commandPending) return;
  const action: SheddingAction = {
    type: "play_cards",
    cardIds: [...selectedCards],
    ...(getSelectedRank() === 11 ? { declaredSuit: selectedSuit } : {}),
  };
  await submitAction(action);
}

async function submitSimpleAction(action: Extract<SheddingAction, { type: "draw_card" | "next_round" }>): Promise<void> {
  if (commandPending) return;
  await submitAction(action);
}

async function submitAction(action: SheddingAction): Promise<void> {
  const view = getCurrentView();
  if (!view || view.controller !== view.viewerSeat) return;
  telegram.haptic("medium");

  if (screen === "solo" && soloGame) {
    try {
      const previousPhase = soloGame.phase;
      soloGame = applySheddingAction(soloGame, action);
      resetSelection();
      presentPhaseChange(previousPhase, createSheddingViewerSnapshot(soloGame, "south"));
      render();
      scheduleSoloBot();
    } catch {
      showToast("Этот ход уже недоступен.");
    }
    return;
  }

  if (screen === "pvp" && pvpSnapshot) {
    const command = action.type === "play_cards"
      ? {
          commandId: createBridgeCommandId(),
          expectedRevision: pvpSnapshot.revision,
          type: "play_cards" as const,
          cardIds: [...action.cardIds],
          ...(action.declaredSuit ? { declaredSuit: action.declaredSuit } : {}),
        }
      : {
          commandId: createBridgeCommandId(),
          expectedRevision: pvpSnapshot.revision,
          type: action.type,
        };
    sendPvpCommand(command);
  }
}

function sendPvpCommand(command: Parameters<BridgeRoomConnection["send"]>[0]): void {
  if (!pvpConnection?.send(command)) {
    showToast("Соединение восстанавливается. Ход не отправлен.");
    schedulePvpReconnect();
    return;
  }
  commandPending = true;
  resetSelection();
  render();
}

function resetSelection(): void {
  selectedCards = [];
  selectedSuit = "hearts";
}

function getCurrentView(): SheddingViewerSnapshot | null {
  if (screen === "solo" && soloGame) return createSheddingViewerSnapshot(soloGame, "south");
  return pvpSnapshot?.view ?? null;
}

function render(): void {
  modalCleanup?.();
  modalCleanup = null;
  app.innerHTML = `${screen === "home" ? renderHome() : renderGameShell()}${renderModal()}${renderToast()}`;
  if (modal) {
    modalCleanup = activateModalFocusTrap(app, () => {
      modal = null;
      render();
    });
  }
  updateDeadlineTicker();
}

function renderHome(): string {
  const pvpAvailable = network.authenticated;
  const returnButton = launch.returnTo
    ? `<button class="home-return-button" type="button" data-action="back-to-games">← Застольные игры</button>`
    : "";
  return `
    <main class="home-screen">
      <header class="home-topbar">
        ${returnButton}
        <button class="icon-button" type="button" data-action="open-help" aria-label="Правила игры">?</button>
      </header>

      <section class="hero-card" aria-labelledby="game-title">
        <div class="hero-card__glow" aria-hidden="true"></div>
        <div class="hero-emblem" aria-hidden="true">
          <span class="hero-emblem__card hero-emblem__card--left">7<span>♥</span></span>
          <span class="hero-emblem__card hero-emblem__card--center">J<span>♠</span></span>
          <span class="hero-emblem__card hero-emblem__card--right">8<span>♦</span></span>
        </div>
        <p class="eyebrow">Таверна «Крысиная нора»</p>
        <h1 id="game-title">Дворовый Бридж</h1>
        <p class="hero-copy">Сбрасывай карты, устраивай серии и первым набери <strong>125 очков</strong>.</p>
        <div class="rule-ribbon" aria-label="Краткие правила">
          <span><b>5</b> карт</span>
          <span><b>36</b> в колоде</span>
          <span><b>2</b> игрока</span>
        </div>
      </section>

      <section class="mode-grid" aria-label="Выбор режима">
        <button class="mode-card mode-card--solo" type="button" data-action="start-solo">
          <span class="mode-card__icon" aria-hidden="true">🐀</span>
          <span class="mode-card__body"><b>Против крупье</b><small>Быстрый матч с умным ИИ</small></span>
          <span class="mode-card__arrow" aria-hidden="true">›</span>
        </button>

        <div class="pvp-card ${pvpAvailable ? "" : "pvp-card--locked"}">
          <div class="pvp-card__heading">
            <span class="mode-card__icon" aria-hidden="true">⚔</span>
            <span><b>Стол на двоих</b><small>${pvpAvailable ? "Позовите друга по коду" : "Откройте игру внутри Telegram"}</small></span>
          </div>
          <button class="primary-button" type="button" data-action="create-room" ${busy || !pvpAvailable ? "disabled" : ""}>
            ${busy ? "Открываем стол…" : "Создать стол"}
          </button>
          <div class="join-row">
            <label class="room-code-field">
              <span class="sr-only">Код стола</span>
              <input data-role="room-code" inputmode="text" autocomplete="off" maxlength="6" value="${escapeHtml(roomInput)}" placeholder="КОД СТОЛА" ${busy || !pvpAvailable ? "disabled" : ""} />
            </label>
            <button class="secondary-button" type="button" data-action="join-room" ${busy || !pvpAvailable || roomInput.length !== 6 ? "disabled" : ""}>Войти</button>
          </div>
        </div>
      </section>

      <button class="rules-link" type="button" data-action="open-help"><span>ⓘ</span> Как играть и что делают карты</button>
      <p class="home-footnote">Это народный вариант Бриджа на сброс карт, а не спортивный контрактный бридж.</p>
    </main>`;
}

function renderGameShell(): string {
  const view = getCurrentView();
  const roomCode = pvpRoom?.roomCode;
  return `
    <main class="game-shell">
      <header class="game-topbar">
        <button class="icon-button icon-button--back" type="button" data-action="back-home" aria-label="Назад">←</button>
        <div class="game-title-block">
          <b>Дворовый Бридж</b>
          <span>${screen === "solo" ? "Против крупье" : roomCode ? `Стол ${escapeHtml(roomCode)}` : "Сетевой стол"}</span>
        </div>
        ${screen === "pvp" ? renderNetworkBadge() : `<span class="mode-badge">ИИ</span>`}
        <button class="icon-button" type="button" data-action="open-help" aria-label="Правила игры">?</button>
      </header>
      ${view ? renderScoreboard(view) : renderWaitingScoreboard()}
      ${view ? renderTable(view) : renderWaitingTable()}
      ${view ? renderControlDock(view) : renderWaitingDock()}
    </main>`;
}

function renderScoreboard(view: SheddingViewerSnapshot): string {
  const viewer = view.viewerSeat;
  const opponent = otherSheddingSeat(viewer);
  const viewerScore = view.scores[viewer];
  const opponentScore = view.scores[opponent];
  return `
    <section class="scoreboard" aria-label="Счёт матча">
      ${renderScorePlayer(opponent, opponentScore, view.targetScore, false, view)}
      <div class="round-medallion"><small>раунд</small><b>${view.round}</b><span>до ${view.targetScore}</span></div>
      ${renderScorePlayer(viewer, viewerScore, view.targetScore, true, view)}
    </section>`;
}

function renderScorePlayer(
  seat: SheddingSeat,
  score: number,
  target: number,
  isViewer: boolean,
  view: SheddingViewerSnapshot,
): string {
  const percent = Math.min(100, Math.round(score / target * 100));
  const isActive = view.controller === seat;
  return `
    <div class="score-player ${isViewer ? "score-player--you" : ""} ${isActive ? "score-player--active" : ""}">
      <div class="score-player__line"><span>${escapeHtml(getPlayerName(seat))}</span><b>${score}</b></div>
      <div class="score-track"><i style="width:${percent}%"></i></div>
    </div>`;
}

function renderWaitingScoreboard(): string {
  return `
    <section class="scoreboard scoreboard--waiting" aria-label="Ожидание соперника">
      <div class="score-player"><div class="score-player__line"><span>Соперник</span><b>—</b></div><div class="score-track"></div></div>
      <div class="round-medallion"><small>матч</small><b>125</b><span>очков</span></div>
      <div class="score-player score-player--you"><div class="score-player__line"><span>${escapeHtml(getPlayerName(pvpRoom?.seat ?? "south"))}</span><b>0</b></div><div class="score-track"></div></div>
    </section>`;
}

function renderTable(view: SheddingViewerSnapshot): string {
  const opponent = otherSheddingSeat(view.viewerSeat);
  const opponentActive = view.controller === opponent;
  const viewerActive = view.controller === view.viewerSeat;
  const opponentCards = view.hands[opponent] ?? [];
  return `
    <section class="card-table ${viewerActive ? "card-table--your-turn" : ""}" aria-label="Карточный стол">
      <div class="table-vignette" aria-hidden="true"></div>
      <div class="opponent-zone ${opponentActive ? "player-zone--active" : ""}">
        <div class="player-plaque">
          <span class="player-avatar" aria-hidden="true">${screen === "solo" ? "🐀" : "♟"}</span>
          <span><b>${escapeHtml(getPlayerName(opponent))}</b><small>${getSeatCaption(opponent, view)}</small></span>
          <em>${view.handCounts[opponent]} ${pluralizeCards(view.handCounts[opponent])}</em>
        </div>
        <div class="opponent-hand" aria-label="У соперника ${view.handCounts[opponent]} ${pluralizeCards(view.handCounts[opponent])}">
          ${view.phase === "match_complete" && opponentCards.length > 0
            ? opponentCards.map((cardId) => renderCard(cardId, { mini: true })).join("")
            : renderCardBacks(view.handCounts[opponent])}
        </div>
      </div>

      <div class="table-center">
        <div class="pile-wrap">
          <button class="card card--back draw-pile" type="button" data-action="draw-card" ${canViewerDraw(view) ? "" : "disabled"} aria-label="Взять карту">
            <span class="card-back-pattern" aria-hidden="true">♣</span>
            <small>${view.drawCount}</small>
          </button>
          <span class="pile-label">колода</span>
        </div>
        <div class="discard-wrap">
          ${renderCard(view.topCard, { table: true })}
          <span class="pile-label">сброс${view.topRankCount > 1 ? ` · серия ${view.topRankCount}/4` : ""}</span>
        </div>
        ${view.declaredSuit ? `<div class="declared-suit ${isRedSuit(view.declaredSuit) ? "declared-suit--red" : ""}"><small>заказана масть</small><b>${SUIT_META[view.declaredSuit].symbol}</b></div>` : ""}
      </div>

      <div class="table-message" aria-live="polite">${renderTableMessage(view)}</div>

      <div class="player-zone ${viewerActive ? "player-zone--active" : ""}">
        <div class="player-plaque player-plaque--you">
          <span class="player-avatar" aria-hidden="true">♛</span>
          <span><b>${escapeHtml(getPlayerName(view.viewerSeat))}</b><small>${getSeatCaption(view.viewerSeat, view)}</small></span>
          <em>${view.handCounts[view.viewerSeat]} ${pluralizeCards(view.handCounts[view.viewerSeat])}</em>
        </div>
        <div class="player-hand" aria-label="Ваши карты">
          ${(view.hands[view.viewerSeat] ?? []).map((cardId) => renderHandCard(cardId, view)).join("")}
        </div>
      </div>
    </section>`;
}

function renderWaitingTable(): string {
  return `
    <section class="card-table card-table--waiting" aria-label="Ожидание соперника">
      <div class="waiting-table-art" aria-hidden="true"><span class="empty-chair">♙</span><span class="waiting-rings"></span></div>
      <div class="waiting-copy"><p class="eyebrow">Стол открыт</p><h2>Ждём второго игрока</h2><p>Отправьте код другу. Матч начнётся автоматически, когда он сядет за стол.</p></div>
    </section>`;
}

function renderControlDock(view: SheddingViewerSnapshot): string {
  if (view.phase === "match_complete") return renderMatchDock(view);
  if (view.phase === "round_complete") return renderRoundDock(view);
  if (view.controller !== view.viewerSeat) {
    return `
      <section class="control-dock control-dock--waiting">
        <span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <div><b>Ход соперника</b><small data-role="deadline">${getDeadlineText() || "Следим за столом…"}</small></div>
      </section>`;
  }

  if (view.legalCardIds.length === 0) {
    const coveringSix = view.mustCoverSix;
    return `
      <section class="control-dock control-dock--action">
        <div class="dock-copy"><b>${coveringSix ? "Шестёрку нужно накрыть" : "Подходящей карты нет"}</b><small>${coveringSix ? "Доберите из колоды до первой подходящей карты." : "Возьмите одну карту — после этого ход перейдёт сопернику."}</small>${renderDeadlineLabel()}</div>
        <button class="primary-button primary-button--draw" type="button" data-action="draw-card" ${commandPending ? "disabled" : ""}>${commandPending ? "Ждём стол…" : coveringSix ? "Добрать карту" : "Взять карту"}</button>
      </section>`;
  }

  const selectedRank = getSelectedRank();
  const effect = selectedRank
    ? getEffectPreview(selectedRank, selectedCards.length)
    : view.mustCoverSix
      ? "Выберите карту, которой можно накрыть шестёрку"
      : "Можно выбрать несколько карт одного достоинства";
  return `
    <section class="control-dock control-dock--action">
      <div class="dock-selection">
        <div class="dock-copy"><b>${selectedCards.length > 0 ? `Выбрано: ${selectedCards.length}` : "Ваш ход"}</b><small>${escapeHtml(effect)}</small>${renderDeadlineLabel()}</div>
        ${selectedRank === 11 ? renderSuitPicker() : ""}
      </div>
      <button class="primary-button primary-button--play" type="button" data-action="play-selected" ${selectedCards.length === 0 || commandPending ? "disabled" : ""}>
        ${commandPending ? "Ждём стол…" : selectedCards.length > 1 ? `Сыграть ${selectedCards.length} карты` : "Сыграть карту"}
      </button>
    </section>`;
}

function renderRoundDock(view: SheddingViewerSnapshot): string {
  const result = view.roundResult;
  if (!result) return `<section class="control-dock"></section>`;
  const viewerWon = result.winner === view.viewerSeat;
  const bonus = result.finish === "four_of_a_kind"
    ? "Бридж: четыре одинаковые, очки ×2"
    : result.finish === "jack_finish"
      ? "Финиш валетом, очки ×2"
      : "Обычный финиш";
  return `
    <section class="control-dock control-dock--round">
      <div class="round-summary-icon" aria-hidden="true">${viewerWon ? "★" : "◇"}</div>
      <div class="dock-copy">
        <b>${viewerWon ? `Раунд ваш: +${result.points}` : `${escapeHtml(getPlayerName(result.winner))} берёт +${result.points}`}</b>
        <small>${bonus}${result.scoreMultiplier === 2 ? ` · ${result.basePoints} × 2` : ""}. Осталось: ${result.loserCards.map(formatCardShort).join(" · ") || "нет карт"}</small>${renderDeadlineLabel()}
      </div>
      ${view.canStartNextRound
        ? `<button class="primary-button" type="button" data-action="next-round" ${commandPending ? "disabled" : ""}>Следующий раунд</button>`
        : `<span class="dock-wait">Ждём следующий раунд…</span>`}
    </section>`;
}

function renderMatchDock(view: SheddingViewerSnapshot): string {
  const won = view.matchWinner === view.viewerSeat;
  return `
    <section class="control-dock control-dock--match">
      <div class="round-summary-icon" aria-hidden="true">${won ? "🏆" : "♜"}</div>
      <div class="dock-copy"><b>${won ? "Вы выиграли матч!" : "Матч завершён"}</b><small>Итоговый счёт: ${view.scores[view.viewerSeat]} : ${view.scores[otherSheddingSeat(view.viewerSeat)]}</small></div>
      <button class="primary-button" type="button" data-action="open-match">Итоги</button>
    </section>`;
}

function renderWaitingDock(): string {
  const code = pvpRoom?.roomCode ?? "";
  return `
    <section class="control-dock control-dock--invite">
      <button class="room-code-display" type="button" data-action="copy-code"><small>код стола</small><b>${escapeHtml(code)}</b></button>
      <div class="invite-actions">
        <button class="secondary-button" type="button" data-action="copy-code">Копировать</button>
        <button class="primary-button" type="button" data-action="share-code">Пригласить</button>
      </div>
      <button class="text-button" type="button" data-action="leave-room">Закрыть стол</button>
    </section>`;
}

function renderSuitPicker(): string {
  return `
    <div class="suit-picker" aria-label="Заказать масть">
      ${SHEDDING_SUITS.map((suit) => `
        <button class="suit-button ${selectedSuit === suit ? "suit-button--selected" : ""} ${isRedSuit(suit) ? "suit-button--red" : ""}" type="button" data-action="select-suit" data-suit="${suit}" aria-label="${SUIT_META[suit].label}">${SUIT_META[suit].symbol}</button>
      `).join("")}
    </div>`;
}

function renderHandCard(cardId: SheddingCardId, view: SheddingViewerSnapshot): string {
  const selected = selectedCards.includes(cardId);
  const selectable = canSelectHandCard(cardId, view);
  return renderCard(cardId, {
    interactive: true,
    selected,
    disabled: !selectable && !selected,
    action: "toggle-card",
  });
}

function renderCard(
  cardId: SheddingCardId,
  options: { interactive?: boolean; selected?: boolean; disabled?: boolean; action?: string; mini?: boolean; table?: boolean } = {},
): string {
  const card = getSheddingCard(cardId);
  const rank = formatRank(card.rank);
  const suit = SUIT_META[card.suit];
  const special = getSpecialMark(card.rank);
  const tag = options.interactive ? "button" : "div";
  const attrs = options.interactive
    ? `type="button" data-action="${options.action ?? ""}" data-card="${card.id}" ${options.disabled ? "disabled" : ""}`
    : "";
  return `
    <${tag} class="card card--face ${isRedSuit(card.suit) ? "card--red" : ""} ${options.selected ? "card--selected" : ""} ${options.mini ? "card--mini" : ""} ${options.table ? "card--table" : ""}" ${attrs} aria-label="${rank} ${suit.label}${special ? `, ${special.label}` : ""}">
      <span class="card-corner"><b>${rank}</b><i>${suit.symbol}</i></span>
      <span class="card-suit">${suit.symbol}</span>
      ${special ? `<span class="card-power">${special.mark}</span>` : ""}
      <span class="card-corner card-corner--bottom"><b>${rank}</b><i>${suit.symbol}</i></span>
    </${tag}>`;
}

function renderCardBacks(count: number): string {
  const visible = Math.min(10, count);
  if (visible === 0) return `<span class="empty-hand">рука пуста</span>`;
  return Array.from({ length: visible }, (_, index) => `
    <span class="card card--back card--opponent" style="--card-index:${index};--card-total:${visible}" aria-hidden="true"><span class="card-back-pattern">♣</span></span>
  `).join("");
}

function renderTableMessage(view: SheddingViewerSnapshot): string {
  if (view.phase === "match_complete") return `<b>Матч завершён</b><span>Первый до ${view.targetScore}</span>`;
  if (view.phase === "round_complete") {
    const finish = view.roundResult?.finish;
    return finish === "four_of_a_kind"
      ? `<b>Бридж!</b><span>Четыре одинаковые — очки удвоены</span>`
      : finish === "jack_finish"
        ? `<b>Финиш валетом</b><span>Очки за раунд удвоены</span>`
        : `<b>Раунд ${view.round} завершён</b><span>Считаем оставшиеся карты</span>`;
  }
  if (view.controller === view.viewerSeat) {
    if (view.mustCoverSix) return `<b>Накройте шестёрку</b><span>${view.legalCardIds.length > 0 ? "Выберите подходящую карту" : "Добирайте до подходящей карты"}</span>`;
    return `<b>Ваш ход</b><span>${view.legalCardIds.length > 0 ? "Выберите карту" : "Нужно взять карту"}</span>`;
  }
  const action = view.lastAction;
  if (action?.type === "play_cards" && action.skippedOpponent && action.seat === view.viewerSeat) {
    return `<b>Снова ваш ход</b><span>Спецкарта пропустила соперника</span>`;
  }
  return `<b>${escapeHtml(getPlayerName(view.controller ?? otherSheddingSeat(view.viewerSeat)))} думает</b><span>${getLastActionText(view)}</span>`;
}

function renderNetworkBadge(): string {
  const labels: Record<NetworkStatus, string> = {
    idle: "Стол",
    connecting: "Связь…",
    online: "Онлайн",
    offline: "Нет связи",
  };
  return `<span class="network-badge network-badge--${networkStatus}"><i></i>${labels[networkStatus]}</span>`;
}

function renderModal(): string {
  if (modal === "help") return renderHelpModal();
  if (modal === "match") return renderMatchModal();
  return "";
}

function renderHelpModal(): string {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal-card rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <button class="modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button>
        <p class="eyebrow">Народные правила</p>
        <h2 id="rules-title">Как играть</h2>
        <p>Колода — 36 карт. Каждый получает по пять, но пятая карта сдающего сразу открывает стол: у него на руке остаётся четыре. Он же ходит первым и может накрыть открытую карту по масти или достоинству.</p>
        <div class="rules-steps">
          <div><b>1</b><span>Кладите карту той же <strong>масти</strong> или того же <strong>достоинства</strong>.</span></div>
          <div><b>2</b><span>За один ход можно сбросить сразу несколько карт одного достоинства.</span></div>
          <div><b>3</b><span>Нет подходящей карты — возьмите одну. Ход перейдёт сопернику.</span></div>
          <div><b>4</b><span>Кто первым опустошил руку, получает очки за карты соперника. Четыре одинаковые карты подряд тоже завершают раунд и удваивают очки.</span></div>
        </div>
        <h3>Карты с характером</h3>
        <div class="power-grid">
          <div><span class="power-card">6</span><b>Накрыть самому</b><small>Положивший шестёрку ходит снова; если нечем — добирает до подходящей карты</small></div>
          <div><span class="power-card">7</span><b>+1 карта</b><small>Соперник берёт одну и ходит</small></div>
          <div><span class="power-card">8</span><b>+2 и пропуск</b><small>За каждую восьмёрку</small></div>
          <div><span class="power-card">A</span><b>Пропуск</b><small>Вы ходите ещё раз</small></div>
          <div class="power-grid__wide"><span class="power-card">J</span><b>Заказ масти и финиш ×2</b><small>Валет кладётся на любую карту; завершение валетом удваивает очки раунда</small></div>
        </div>
        <h3>Очки до 125</h3>
        <p class="score-rules"><span>6–9 — 0</span><span>10, Q, K — 10</span><span>J — по 20 каждый</span><span>A — 15</span></p>
        <p class="rules-note">Победитель раунда прибавляет сумму оставшихся карт соперника. Первый, кто набрал 125 или больше, выигрывает весь матч.</p>
        <button class="primary-button modal-primary" type="button" data-action="close-modal">Понятно, играем</button>
      </section>
    </div>`;
}

function renderMatchModal(): string {
  const view = getCurrentView();
  if (!view?.matchWinner) return "";
  const won = view.matchWinner === view.viewerSeat;
  const opponent = otherSheddingSeat(view.viewerSeat);
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal-card result-modal" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div class="result-crown" aria-hidden="true">${won ? "🏆" : "♜"}</div>
        <p class="eyebrow">Матч до ${view.targetScore}</p>
        <h2 id="result-title">${won ? "Стол ваш!" : `${escapeHtml(getPlayerName(view.matchWinner))} победил`}</h2>
        <p>${won ? "Вы первым набрали нужные очки и забираете победу." : "Реванш — лучший способ вернуть карточный долг."}</p>
        <div class="final-score"><span><small>${escapeHtml(getPlayerName(view.viewerSeat))}</small><b>${view.scores[view.viewerSeat]}</b></span><i>:</i><span><small>${escapeHtml(getPlayerName(opponent))}</small><b>${view.scores[opponent]}</b></span></div>
        <div class="result-actions">
          <button class="secondary-button" type="button" data-action="back-home">В меню</button>
          <button class="primary-button" type="button" data-action="${screen === "solo" ? "new-solo" : "new-pvp"}">Новый матч</button>
        </div>
      </section>
    </div>`;
}

function renderToast(): string {
  return toastMessage ? `<div class="toast" role="status">${escapeHtml(toastMessage)}</div>` : "";
}

function canSelectHandCard(cardId: SheddingCardId, view: SheddingViewerSnapshot): boolean {
  if (view.phase !== "playing" || view.controller !== view.viewerSeat || commandPending) return false;
  if (selectedCards.length === 0) return view.legalCardIds.includes(cardId);
  return getSheddingCard(cardId).rank === getSelectedRank();
}

function canViewerDraw(view: SheddingViewerSnapshot): boolean {
  return view.canDraw && view.legalCardIds.length === 0 && !commandPending;
}

function getSelectedRank(): number | null {
  return selectedCards[0] ? getSheddingCard(selectedCards[0]).rank : null;
}

function orderSelectionWithLegalLead(
  cards: readonly SheddingCardId[],
  legalCardIds: readonly SheddingCardId[],
): SheddingCardId[] {
  const legalLead = cards.find((cardId) => legalCardIds.includes(cardId));
  return legalLead ? [legalLead, ...cards.filter((cardId) => cardId !== legalLead)] : [];
}

function choosePreferredSuit(hand: readonly SheddingCardId[], excluded: readonly SheddingCardId[]): SheddingSuit {
  const counts = Object.fromEntries(SHEDDING_SUITS.map((suit) => [suit, 0])) as Record<SheddingSuit, number>;
  hand.filter((cardId) => !excluded.includes(cardId)).forEach((cardId) => {
    const card = getSheddingCard(cardId);
    if (card.rank !== 11) counts[card.suit] += 1;
  });
  return [...SHEDDING_SUITS].sort((left, right) => counts[right] - counts[left])[0];
}

function getEffectPreview(rank: number, count: number): string {
  if (rank === 6) return "После шестёрки её нужно накрыть самому";
  if (rank === 14) return "Соперник пропустит ход";
  if (rank === 7) return `Соперник возьмёт ${count} ${pluralizeCards(count)} и сможет ходить`;
  if (rank === 8) return `Соперник возьмёт ${count * 2} ${pluralizeCards(count * 2)} и пропустит ход`;
  if (rank === 11) return "Выберите масть следующего хода";
  return count > 1 ? `Сбросить серию из ${count} карт` : "Можно выбрать несколько карт одного достоинства";
}

function getSpecialMark(rank: number): { mark: string; label: string } | null {
  if (rank === 6) return { mark: "↻", label: "накрыть самому" };
  if (rank === 14) return { mark: "↻", label: "пропуск хода" };
  if (rank === 7) return { mark: "+1", label: "добор одной карты" };
  if (rank === 8) return { mark: "+2", label: "добор двух карт и пропуск" };
  if (rank === 11) return { mark: "✦", label: "заказ масти" };
  return null;
}

function getLastActionText(view: SheddingViewerSnapshot): string {
  const action = view.lastAction;
  if (!action) return "Первый ход раунда";
  if (view.mustCoverSix) return "Нужно накрыть шестёрку";
  if (action.type === "draw_card") return action.count > 0 ? `Взято ${action.count} ${pluralizeCards(action.count)}` : "Колода пуста, ход передан";
  if (action.penaltyCards > 0) return `Штраф: +${action.penaltyCards} ${pluralizeCards(action.penaltyCards)}`;
  if (action.declaredSuit) return `Заказаны ${SUIT_META[action.declaredSuit].label}`;
  return `Сыграно ${action.cardIds.length} ${pluralizeCards(action.cardIds.length)}`;
}

function getSeatCaption(seat: SheddingSeat, view: SheddingViewerSnapshot): string {
  const parts: string[] = [];
  if (view.dealer === seat) parts.push("сдаёт");
  if (view.controller === seat) parts.push("ходит");
  if (screen === "pvp" && pvpSnapshot?.bots.includes(seat)) parts.push("автоигра");
  return parts.join(" · ") || (seat === view.viewerSeat ? "ваша рука" : "соперник");
}

function getPlayerName(seat: SheddingSeat): string {
  if (screen === "solo") return seat === "south" ? "Вы" : "Крупье Крыс";
  const player = pvpSnapshot?.players[seat];
  if (!player) return seat === pvpRoom?.seat ? telegram.displayName : "Соперник";
  if (player.kind === "open") return "Свободное место";
  return player.displayName || (seat === pvpRoom?.seat ? telegram.displayName : "Соперник");
}

function presentPhaseChange(previousPhase: string | undefined, view: SheddingViewerSnapshot | undefined): void {
  if (!view || previousPhase === view.phase) return;
  if (view.phase === "round_complete") {
    telegram.haptic(view.roundResult?.winner === view.viewerSeat ? "success" : "medium");
  }
  if (view.phase === "match_complete") presentMatchResult(view.revision);
}

function presentMatchResult(revision: number): void {
  if (presentedMatchRevision === revision) return;
  presentedMatchRevision = revision;
  telegram.setGameInProgress(false);
  telegram.haptic("success");
  window.setTimeout(() => {
    const view = getCurrentView();
    if (view?.phase === "match_complete" && view.revision === revision) {
      modal = "match";
      render();
    }
  }, 550);
}

function getDeadlineText(): string {
  const deadline = pvpSnapshot?.deadlineAt;
  if (!deadline) return "";
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000));
  return `На ход: ${seconds} сек.`;
}

function renderDeadlineLabel(): string {
  return screen === "pvp" && pvpSnapshot?.deadlineAt
    ? `<span class="dock-timer" data-role="deadline">${getDeadlineText()}</span>`
    : "";
}

function refreshDeadlineLabels(): void {
  const text = getDeadlineText() || "Следим за столом…";
  app.querySelectorAll<HTMLElement>("[data-role='deadline']").forEach((element) => {
    element.textContent = text;
  });
}

function updateDeadlineTicker(): void {
  const shouldTick = screen === "pvp" && Boolean(pvpSnapshot?.deadlineAt) && pvpSnapshot?.status === "playing";
  if (shouldTick && deadlineTicker === null) {
    deadlineTicker = window.setInterval(() => {
      if (screen === "pvp" && pvpSnapshot?.deadlineAt) refreshDeadlineLabels();
    }, 1_000);
  } else if (!shouldTick && deadlineTicker !== null) {
    window.clearInterval(deadlineTicker);
    deadlineTicker = null;
  }
  if (shouldTick) refreshDeadlineLabels();
}

async function copyRoomCode(): Promise<void> {
  const code = pvpRoom?.roomCode;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    showToast(`Код ${code} скопирован.`);
    telegram.haptic("success");
  } catch {
    showToast(`Код стола: ${code}`);
  }
}

async function shareRoomCode(): Promise<void> {
  const code = pvpRoom?.roomCode;
  if (!code) return;
  const shareUrl = new URL(window.location.href);
  shareUrl.search = "";
  shareUrl.hash = "";
  shareUrl.searchParams.set("room", code);
  const text = `Садись за мой стол в Дворовом Бридже. Код: ${code}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Дворовый Бридж · Крысиная нора", text, url: shareUrl.toString() });
      return;
    } catch {
      return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    showToast("Приглашение скопировано.");
  } catch {
    showToast(text);
  }
}

function showToast(message: string): void {
  toastMessage = message.slice(0, 180);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastMessage = "";
    toastTimer = null;
    render();
  }, 3_600);
  render();
}

function clearBotTimer(): void {
  if (botTimer !== null) {
    window.clearTimeout(botTimer);
    botTimer = null;
  }
}

function formatCardShort(cardId: SheddingCardId): string {
  const card = getSheddingCard(cardId);
  return `${formatRank(card.rank)}${SUIT_META[card.suit].symbol}`;
}

function formatRank(rank: number): string {
  if (rank === 10) return "10";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  if (rank === 14) return "A";
  return String(rank);
}

function isRedSuit(suit: SheddingSuit): boolean {
  return suit === "diamonds" || suit === "hearts";
}

function pluralizeCards(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "карту";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "карты";
  return "карт";
}

function deterministicBotDelay(revision: number): number {
  return 520 + Math.abs((revision * 73) % 230);
}

function getServerErrorMessage(code: string, fallback: string): string {
  if (code === "illegal_action") return "Этот ход нельзя сделать по правилам.";
  if (code === "not_controller") return "Сейчас ход соперника.";
  if (code === "room_not_playing") return "Стол уже закрыт или матч завершён.";
  return fallback || "Стол не принял действие.";
}

function createLocalSeed(): string {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function getDevelopmentIdentity(): { userId: string; displayName: string } | null {
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return null;
  const explicit = new URLSearchParams(window.location.search).get("dev_user")?.trim();
  const suffix = (explicit || getSessionDevelopmentId()).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player";
  return { userId: `local:${suffix}`, displayName: `Local ${suffix}` };
}

function getSessionDevelopmentId(): string {
  const key = "bridge-development-player-v2";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = Math.random().toString(36).slice(2, 8);
  window.sessionStorage.setItem(key, value);
  return value;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
