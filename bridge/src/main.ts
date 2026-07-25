import "./styles.css";

import { chooseAiCall, chooseBotAction, highCardPoints } from "./ai/index.ts";
import {
  BID_LEVELS,
  SEATS,
  STRAINS,
  applyCall,
  createGame,
  createViewerSnapshot,
  getTurnController,
  partnershipOf,
  playCard,
  type BidLevel,
  type BridgeGameState,
  type BridgeResult,
  type Call,
  type CardId,
  type Seat,
  type Strain,
  type ViewerSnapshot,
} from "./game/index.ts";
import { parseBridgeLaunch } from "./launch.ts";
import {
  createBridgeNetworkClient,
  getBridgeNetworkErrorMessage,
  type BridgeRoomConnection,
} from "./network/client.ts";
import {
  createBridgeCommandId,
  type BridgeRoomPlayerSummary,
  type BridgeRoomSession,
  type BridgeRoomSnapshot,
} from "./network/protocol.ts";
import { setupTelegramBridge } from "./telegram.ts";
import {
  SEAT_LABELS,
  STRAIN_LABELS,
  SUIT_SYMBOLS,
  callKey,
  callsEqual,
  deterministicBotDelay,
  escapeHtml,
  formatCall,
  formatCard,
  formatContract,
  formatResultTitle,
  formatSignedScore,
  formatVulnerability,
  getSeatsByPosition,
  groupCardsBySuit,
  isRedStrain,
} from "./ui/format.ts";
import { activateModalFocusTrap } from "./ui/modal.ts";

type Screen = "home" | "solo" | "pvp";
type ModalKind = "help" | "auction" | "result" | null;
type NetworkStatus = "idle" | "connecting" | "online" | "offline";

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("Bridge root element is missing.");
const app: HTMLElement = appRoot;

const telegram = setupTelegramBridge();
const launch = parseBridgeLaunch(window.location.href, telegram.startParam);
const developmentIdentity = getDevelopmentIdentity();
const network = createBridgeNetworkClient<ViewerSnapshot>({
  initData: () => telegram.initData,
  developmentIdentity,
});

let screen: Screen = "home";
let soloGame: BridgeGameState | null = null;
let soloBoardNumber = randomBoardNumber();
let soloFastForward = false;
let roomInput = launch.roomCode ?? "";
let pvpRoom: BridgeRoomSession<ViewerSnapshot> | null = null;
let pvpSnapshot: BridgeRoomSnapshot<ViewerSnapshot> | null = null;
let pvpConnection: BridgeRoomConnection | null = null;
let pvpReconnectTimer: number | null = null;
let reconnectAttempt = 0;
let intentionalSocketClose = false;
let networkStatus: NetworkStatus = "idle";
let busy = false;
let modal: ModalKind = null;
let modalCleanup: (() => void) | null = null;
let selectedLevel: BidLevel = 1;
let selectedStrain: Strain = "clubs";
let selectedCall: Call | null = null;
let selectedCard: CardId | null = null;
let botTimer: number | null = null;
let toastTimer: number | null = null;
let toastMessage = "";
let deadlineTicker: number | null = null;

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
    startSoloBoard();
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
  if (action === "open-auction") {
    modal = "auction";
    render();
    return;
  }
  if (action === "open-result") {
    modal = "result";
    render();
    return;
  }
  if (action === "close-modal") {
    modal = null;
    render();
    return;
  }
  if (action === "select-level") {
    selectBidLevel(Number(target.dataset.level));
    return;
  }
  if (action === "select-strain") {
    selectBidStrain(target.dataset.strain);
    return;
  }
  if (action === "select-call") {
    selectSpecialCall(target.dataset.call);
    return;
  }
  if (action === "confirm-call") {
    await submitSelectedCall();
    return;
  }
  if (action === "select-card") {
    selectCard(target.dataset.card ?? "");
    return;
  }
  if (action === "clear-card") {
    selectedCard = null;
    render();
    return;
  }
  if (action === "confirm-card") {
    await submitSelectedCard();
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
    startSoloBoard(soloBoardNumber + 1);
    return;
  }
  if (action === "new-pvp") {
    modal = null;
    await leavePvpRoom(false);
    await createPvpRoom();
    return;
  }
  if (action === "fast-forward") {
    soloFastForward = true;
    clearBotTimer();
    scheduleSoloBots();
    render();
  }
}

function startSoloBoard(boardNumber = soloBoardNumber): void {
  clearBotTimer();
  soloBoardNumber = ((Math.max(1, boardNumber) - 1) % 16) + 1;
  soloGame = createGame({
    seed: createLocalSeed(),
    boardNumber: soloBoardNumber,
  });
  screen = "solo";
  soloFastForward = false;
  modal = null;
  resetSelection();
  telegram.setGameInProgress(true);
  telegram.haptic("medium");
  render();
  scheduleSoloBots();
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
  if (!network.authenticated || import.meta.env.DEV) return;
  try {
    const room = await network.getCurrentRoom();
    if (room) await enterPvpRoom(room);
  } catch {
    // A stale Telegram session must not prevent local solo play.
  }
}

async function enterPvpRoom(room: BridgeRoomSession<ViewerSnapshot>): Promise<void> {
  clearBotTimer();
  screen = "pvp";
  pvpRoom = room;
  pvpSnapshot = room.snapshot;
  roomInput = room.roomCode;
  modal = null;
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
        if (message.type === "error") {
          if (message.code !== "stale_revision") showToast(message.message);
          return;
        }
        pvpSnapshot = message.snapshot;
        if (pvpRoom) pvpRoom = { ...pvpRoom, snapshot: message.snapshot };
        resetSelection();
        telegram.setGameInProgress(message.snapshot.status !== "finished");
        networkStatus = "online";
        render();
        if (message.snapshot.status === "finished") {
          telegram.haptic("success");
          window.setTimeout(() => {
            if (screen === "pvp" && pvpSnapshot?.status === "finished") {
              modal = "result";
              render();
            }
          }, 500);
        }
      },
      onClose: () => {
        pvpConnection = null;
        if (intentionalSocketClose || screen !== "pvp") return;
        networkStatus = "offline";
        render();
        schedulePvpReconnect();
      },
      onError: (error) => {
        networkStatus = "offline";
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
  if (screen === "solo" && soloGame?.phase !== "complete") {
    if (!window.confirm("Покинуть незавершённую сдачу?")) return;
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

function scheduleSoloBots(): void {
  clearBotTimer();
  if (screen !== "solo" || !soloGame || soloGame.phase === "complete") {
    if (soloGame?.phase === "complete") {
      window.setTimeout(() => {
        if (screen === "solo" && soloGame?.phase === "complete") {
          modal = "result";
          render();
        }
      }, 450);
    }
    return;
  }

  const controller = getTurnController(soloGame);
  if (controller === "south") return;
  const revision = soloGame.revision;
  const delay = soloFastForward ? 35 : deterministicBotDelay(revision);
  botTimer = window.setTimeout(() => {
    botTimer = null;
    if (!soloGame || soloGame.revision !== revision || screen !== "solo") return;
    const activeController = getTurnController(soloGame);
    if (!activeController) return;
    const action = chooseBotAction(createViewerSnapshot(soloGame, activeController));
    if (!action) {
      showToast("ИИ не смог выбрать легальное действие.");
      return;
    }
    soloGame = action.type === "call"
      ? applyCall(soloGame, action.call)
      : playCard(soloGame, action.cardId);
    resetSelection();
    render();
    scheduleSoloBots();
  }, delay);
}

function selectBidLevel(value: number): void {
  if (!BID_LEVELS.includes(value as BidLevel)) return;
  selectedLevel = value as BidLevel;
  selectCurrentBidIfLegal();
}

function selectBidStrain(value: string | undefined): void {
  if (!STRAINS.includes(value as Strain)) return;
  selectedStrain = value as Strain;
  selectCurrentBidIfLegal();
}

function selectCurrentBidIfLegal(): void {
  const view = getCurrentView();
  if (!view) return;
  const desired: Call = { type: "bid", level: selectedLevel, strain: selectedStrain };
  selectedCall = view.legalCalls.find((call) => callsEqual(call, desired)) ?? null;
  telegram.haptic("light");
  render();
}

function selectSpecialCall(type: string | undefined): void {
  const view = getCurrentView();
  if (!view || (type !== "pass" && type !== "double" && type !== "redouble")) return;
  selectedCall = view.legalCalls.find((call) => call.type === type) ?? null;
  telegram.haptic("light");
  render();
}

async function submitSelectedCall(): Promise<void> {
  if (!selectedCall || busy) return;
  const call = selectedCall;
  selectedCall = null;
  telegram.haptic("medium");
  if (screen === "solo" && soloGame) {
    try {
      soloGame = applyCall(soloGame, call);
      resetSelection();
      render();
      scheduleSoloBots();
    } catch {
      showToast("Эта заявка уже недоступна.");
    }
    return;
  }
  if (screen === "pvp" && pvpSnapshot) {
    sendPvpCommand({
      commandId: createBridgeCommandId(),
      expectedRevision: pvpSnapshot.revision,
      type: "call",
      call,
    });
  }
}

function selectCard(cardId: CardId): void {
  const view = getCurrentView();
  if (!view?.legalCardIds.includes(cardId)) return;
  selectedCard = selectedCard === cardId ? null : cardId;
  telegram.haptic("light");
  render();
}

async function submitSelectedCard(): Promise<void> {
  if (!selectedCard || busy) return;
  const cardId = selectedCard;
  selectedCard = null;
  telegram.haptic("medium");
  if (screen === "solo" && soloGame) {
    try {
      soloGame = playCard(soloGame, cardId);
      resetSelection();
      render();
      scheduleSoloBots();
    } catch {
      showToast("Эту карту сейчас нельзя сыграть.");
    }
    return;
  }
  if (screen === "pvp" && pvpSnapshot) {
    sendPvpCommand({
      commandId: createBridgeCommandId(),
      expectedRevision: pvpSnapshot.revision,
      type: "play_card",
      cardId,
    });
  }
}

function sendPvpCommand(command: Parameters<BridgeRoomConnection["send"]>[0]): void {
  if (!pvpConnection?.send(command)) {
    showToast("Соединение восстанавливается. Ход не отправлен.");
    schedulePvpReconnect();
  }
  render();
}

function resetSelection(): void {
  selectedCall = null;
  selectedCard = null;
  const view = getCurrentView();
  const firstBid = view?.legalCalls.find((call): call is Extract<Call, { type: "bid" }> => call.type === "bid");
  if (firstBid) {
    selectedLevel = firstBid.level;
    selectedStrain = firstBid.strain;
  }
}

function getCurrentView(): ViewerSnapshot | null {
  if (screen === "solo" && soloGame) return createViewerSnapshot(soloGame, "south");
  return pvpSnapshot?.view ?? null;
}

function render(): void {
  modalCleanup?.();
  modalCleanup = null;
  updateDeadlineTicker();
  app.innerHTML = screen === "home" ? renderHome() : renderGameShell();
  if (modal) {
    modalCleanup = activateModalFocusTrap(app, () => {
      modal = null;
      render();
    });
  }
}

function renderHome(): string {
  return `
    <main class="bridge-app home-screen">
      <div class="home-content">
        <div class="home-toolbar">
          ${launch.returnTo === "tower-defense" ? `
            <button class="home-return-button" type="button" data-action="back-to-games">
              <span aria-hidden="true">‹</span> К выбору игр
            </button>
          ` : ""}
          <button class="round-button" type="button" data-action="open-help" aria-label="Правила бриджа">?</button>
        </div>
        <header class="brand-card">
          <div class="brand-emblem" aria-hidden="true">
            <div class="brand-emblem__cards">
              <span class="brand-emblem__card"></span>
              <span class="brand-emblem__card"></span>
              <span class="brand-emblem__suit">♣</span>
            </div>
          </div>
          <p class="brand-kicker">Таверна · Крысиная нора</p>
          <h1 class="brand-title">Бридж</h1>
          <p class="brand-subtitle">Классическая карточная игра на четыре места. Торгуйтесь, назначайте контракт и берите взятки.</p>
        </header>
        <section class="mode-grid" aria-label="Режимы игры">
          <button class="mode-card mode-card--primary" type="button" data-action="start-solo">
            <span class="mode-card__icon" aria-hidden="true">♠</span>
            <span class="mode-card__copy">
              <span class="mode-card__title">Против компьютера</span>
              <span class="mode-card__description">Полная сдача · ИИ клубного новичка</span>
            </span>
            <span class="mode-card__arrow" aria-hidden="true">›</span>
          </button>
          <button class="mode-card" type="button" data-action="create-room" ${busy ? "disabled" : ""}>
            <span class="mode-card__icon" aria-hidden="true">♦</span>
            <span class="mode-card__copy">
              <span class="mode-card__title">${busy ? "Создаём стол…" : "Создать приватный стол"}</span>
              <span class="mode-card__description">Вы и соперник · у каждого ИИ-партнёр</span>
            </span>
            <span class="mode-card__arrow" aria-hidden="true">›</span>
          </button>
        </section>
        <div class="join-panel">
          <label class="sr-only" for="room-code">Код приватного стола</label>
          <input
            id="room-code"
            class="room-input"
            data-role="room-code"
            inputmode="text"
            autocomplete="off"
            maxlength="6"
            placeholder="Код стола"
            value="${escapeHtml(roomInput)}"
          />
          <button class="primary-button" type="button" data-action="join-room" ${busy ? "disabled" : ""}>Войти</button>
        </div>
        <p class="brand-subtitle" style="margin:0 auto;text-align:center">
          Solo работает в обычном браузере. Сетевой режим использует вход Telegram.
        </p>
      </div>
      ${renderToast()}
      ${modal === "help" ? renderHelpModal() : ""}
    </main>
  `;
}

function renderGameShell(): string {
  const view = getCurrentView();
  const viewerSeat = view?.viewerSeat ?? pvpRoom?.seat ?? "south";
  const waiting = screen === "pvp" && (!view || pvpSnapshot?.status === "waiting");
  const topPrimary = waiting
    ? `Стол ${escapeHtml(pvpRoom?.roomCode ?? "—")}`
    : view
      ? formatContract(view.contract)
      : "Бридж";
  const topSecondary = waiting
    ? "Ожидаем соперника"
    : view
      ? `Сдача ${view.boardNumber} · ${formatVulnerability(view.vulnerability)}`
      : "Приватная игра";

  return `
    <main class="bridge-app game-shell">
      <header class="game-topbar">
        <button class="round-button" type="button" data-action="back-home" aria-label="На главную">‹</button>
        <div class="game-summary">
          <span class="game-summary__primary">${escapeHtml(topPrimary)}</span>
          <span class="game-summary__secondary">${escapeHtml(topSecondary)}</span>
        </div>
        <button class="round-button" type="button" data-action="${view ? "open-auction" : "open-help"}" aria-label="${view ? "История торговли" : "Правила"}">${view ? "☷" : "?"}</button>
      </header>
      <section class="table-stage" aria-label="Карточный стол">
        ${waiting ? renderWaitingTable(viewerSeat) : view ? renderTable(view) : renderWaitingTable(viewerSeat)}
      </section>
      <section class="control-dock" aria-live="polite">
        ${waiting ? renderRoomWaitingDock() : view ? renderControlDock(view) : renderRoomWaitingDock()}
      </section>
      ${networkStatus === "offline" && screen === "pvp" ? `<div class="network-banner">Связь потеряна — переподключаемся к столу…</div>` : ""}
      ${renderToast()}
      ${modal === "help" ? renderHelpModal() : ""}
      ${modal === "auction" && view ? renderAuctionModal(view) : ""}
      ${modal === "result" && view?.result ? renderResultModal(view) : ""}
    </main>
  `;
}

function renderWaitingTable(viewerSeat: Seat): string {
  const players = getPlayerSummaries(viewerSeat);
  const positions = getSeatsByPosition(viewerSeat);
  return `
    <div class="felt-table">
      <div class="felt-watermark" aria-hidden="true">♣</div>
      ${(["top", "left", "right", "bottom"] as const).map((position) => (
        renderSeat(positions[position], position, null, players[positions[position]], 13)
      )).join("")}
      <div class="trick-center" aria-hidden="true"></div>
      <div class="table-status">Код стола уже можно отправить сопернику</div>
    </div>
  `;
}

function renderTable(view: ViewerSnapshot): string {
  const positions = getSeatsByPosition(view.viewerSeat);
  const players = getPlayerSummaries(view.viewerSeat);
  const activeHandSeat = getDisplayedHandSeat(view);
  const hand = view.hands[activeHandSeat] ?? [];
  const legalCards = new Set(view.legalCardIds);
  const tableStatus = getTableStatus(view);
  return `
    <div class="felt-table">
      <div class="felt-watermark" aria-hidden="true">♣</div>
      ${(["top", "left", "right", "bottom"] as const).map((position) => {
        const seat = positions[position];
        return renderSeat(seat, position, view, players[seat], view.handCounts[seat]);
      }).join("")}
      <div class="table-status">${escapeHtml(tableStatus)}</div>
      ${renderTrick(view)}
      ${renderDummy(view)}
      <div class="hand-zone">
        <div class="player-hand" style="--hand-count:${Math.max(1, hand.length)}">
          ${hand.map((cardId, index) => renderHandCard(
            cardId,
            index,
            hand.length,
            legalCards.has(cardId),
            selectedCard === cardId,
          )).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderSeat(
  seat: Seat,
  position: "top" | "left" | "right" | "bottom",
  view: ViewerSnapshot | null,
  player: BridgeRoomPlayerSummary,
  cardCount: number,
): string {
  const active = view?.currentSeat === seat;
  const initials = player.displayName.trim().slice(0, 1).toUpperCase() || SEAT_LABELS[seat].slice(0, 1);
  const botBadge = player.kind === "bot" ? `<span class="seat__bot" aria-label="Компьютер">AI</span>` : "";
  const meta = `${SEAT_LABELS[seat]} · ${cardCount} карт`;
  return `
    <div class="seat seat--${position}${active ? " seat--active" : ""}${!player.connected ? " seat--offline" : ""}">
      <span class="seat__avatar">${escapeHtml(initials)}${botBadge}</span>
      <span class="seat__copy">
        <span class="seat__name">${escapeHtml(player.displayName)}</span>
        <span class="seat__meta">${escapeHtml(meta)}</span>
      </span>
    </div>
  `;
}

function renderTrick(view: ViewerSnapshot): string {
  const positions = getSeatsByPosition(view.viewerSeat);
  const positionBySeat = Object.fromEntries(
    Object.entries(positions).map(([position, seat]) => [seat, position]),
  ) as Record<Seat, "top" | "left" | "right" | "bottom">;
  return `
    <div class="trick-center" aria-label="Текущая взятка">
      ${(view.currentTrick?.plays ?? []).map((play) => `
        <div class="trick-card trick-card--${positionBySeat[play.seat]}">
          ${renderCardFace(play.cardId)}
        </div>
      `).join("")}
    </div>
  `;
}

function renderDummy(view: ViewerSnapshot): string {
  const dummy = view.contract?.dummy;
  if (!dummy || !view.openingLeadPlayed || !view.hands[dummy] || view.phase === "complete") return "";
  const groups = groupCardsBySuit(view.hands[dummy] ?? []);
  return `
    <div class="dummy-layout" aria-label="Открытая рука dummy">
      ${(["spades", "hearts", "diamonds", "clubs"] as const).map((suit) => `
        <div class="dummy-suit">
          <span class="dummy-suit__symbol${suit === "hearts" || suit === "diamonds" ? " dummy-suit__symbol--red" : ""}">${SUIT_SYMBOLS[suit]}</span>
          <span class="dummy-suit__ranks">${escapeHtml(groups[suit].join(" ") || "—")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderHandCard(
  cardId: CardId,
  index: number,
  count: number,
  legal: boolean,
  selected: boolean,
): string {
  const rotation = (index - (count - 1) / 2) * Math.min(1.25, 13 / Math.max(1, count));
  const zIndex = index + 1;
  return `
    <button
      class="hand-card${legal ? " hand-card--legal" : ""}${selected ? " hand-card--selected" : ""}"
      type="button"
      data-action="select-card"
      data-card="${escapeHtml(cardId)}"
      style="--card-rotation:${rotation.toFixed(2)}deg;z-index:${zIndex}"
      ${legal ? "" : "disabled"}
      aria-pressed="${selected}"
      aria-label="${escapeHtml(formatCard(cardId).spoken)}"
    >${renderCardFace(cardId)}</button>
  `;
}

function renderCardFace(cardId: CardId): string {
  const card = formatCard(cardId);
  return `
    <span class="card-face${card.red ? " card-face--red" : ""}">
      <span class="card-corner">${escapeHtml(card.rank)}<span>${card.suit}</span></span>
      <span class="card-center-suit">${card.suit}</span>
    </span>
  `;
}

function renderControlDock(view: ViewerSnapshot): string {
  if (view.phase === "complete") {
    return `
      <div class="dock-header">
        <div class="dock-title">
          <span class="dock-title__primary">${escapeHtml(view.result ? formatResultTitle(view.result) : "Сдача завершена")}</span>
          <span class="dock-title__secondary">Официальный счёт одной сдачи</span>
        </div>
      </div>
      <div class="result-controls">
        <button class="primary-button" type="button" data-action="open-result">Посмотреть результат</button>
      </div>
    `;
  }

  if (view.controller !== view.viewerSeat) {
    return renderWaitingForTurn(view);
  }

  return view.phase === "auction" ? renderAuctionControls(view) : renderPlayControls(view);
}

function renderAuctionControls(view: ViewerSnapshot): string {
  const recommendation = screen === "solo" ? chooseAiCall(view) : null;
  const legalKeys = new Set(view.legalCalls.map(callKey));
  const selectedLabel = selectedCall ? formatCall(selectedCall) : "Выберите заявку";
  return `
    <div class="dock-header">
      <div class="dock-title">
        <span class="dock-title__primary">Ваш ход в торговле</span>
        <span class="dock-title__secondary">HCP: ${highCardPoints(view.hands[view.viewerSeat] ?? [])} · выбрано: ${escapeHtml(selectedLabel)}</span>
      </div>
      ${recommendation ? `<span class="recommendation">Совет: ${escapeHtml(formatCall(recommendation))}</span>` : ""}
    </div>
    <div class="auction-controls">
      <div class="level-row">
        ${BID_LEVELS.map((level) => {
          const hasLegal = STRAINS.some((strain) => legalKeys.has(callKey({ type: "bid", level, strain })));
          return `<button class="call-button${selectedLevel === level ? " call-button--selected" : ""}" type="button" data-action="select-level" data-level="${level}" ${hasLegal ? "" : "disabled"}>${level}</button>`;
        }).join("")}
      </div>
      <div class="strain-row">
        ${STRAINS.map((strain) => {
          const legal = legalKeys.has(callKey({ type: "bid", level: selectedLevel, strain }));
          return `<button class="call-button call-button--strain${isRedStrain(strain) ? " call-button--red" : ""}${selectedStrain === strain ? " call-button--selected" : ""}" type="button" data-action="select-strain" data-strain="${strain}" ${legal ? "" : "disabled"}>${STRAIN_LABELS[strain]}</button>`;
        }).join("")}
      </div>
      <div class="special-call-row">
        ${renderSpecialCallButton("pass", "Пас", legalKeys)}
        ${renderSpecialCallButton("double", "X", legalKeys)}
        ${renderSpecialCallButton("redouble", "XX", legalKeys)}
        <button class="call-button call-button--confirm" type="button" data-action="confirm-call" ${selectedCall ? "" : "disabled"}>Заявить</button>
      </div>
    </div>
  `;
}

function renderSpecialCallButton(type: "pass" | "double" | "redouble", label: string, legalKeys: Set<string>): string {
  const legal = legalKeys.has(type);
  return `<button class="call-button${selectedCall?.type === type ? " call-button--selected" : ""}" type="button" data-action="select-call" data-call="${type}" ${legal ? "" : "disabled"}>${label}</button>`;
}

function renderPlayControls(view: ViewerSnapshot): string {
  const playingDummy = view.currentSeat === view.contract?.dummy;
  const handSeat = getDisplayedHandSeat(view);
  const title = playingDummy
    ? `Вы разыгрываете dummy (${SEAT_LABELS[handSeat]})`
    : "Выберите карту";
  return `
    <div class="dock-header">
      <div class="dock-title">
        <span class="dock-title__primary">${escapeHtml(title)}</span>
        <span class="dock-title__secondary">Сначала коснитесь карты, затем подтвердите ход</span>
      </div>
    </div>
    <div class="play-controls">
      <div class="play-actions">
        <button class="secondary-button" type="button" data-action="clear-card" ${selectedCard ? "" : "disabled"}>Снять выбор</button>
        <button class="primary-button" type="button" data-action="confirm-card" ${selectedCard ? "" : "disabled"}>Сыграть</button>
      </div>
    </div>
  `;
}

function renderWaitingForTurn(view: ViewerSnapshot): string {
  const humanIsDummy = view.contract?.dummy === view.viewerSeat && view.phase === "play";
  const controller = view.controller;
  const label = humanIsDummy
    ? "Вы dummy — партнёр разыгрывает контракт"
    : controller
      ? `Ход: ${SEAT_LABELS[controller]}`
      : "Ожидаем следующий ход";
  const player = controller ? getPlayerSummaries(view.viewerSeat)[controller] : null;
  return `
    <div class="dock-header">
      <div class="dock-title">
        <span class="dock-title__primary">${escapeHtml(label)}</span>
        <span class="dock-title__secondary">${player?.kind === "bot" ? "ИИ клубного новичка думает…" : "Ожидаем решение соперника…"}</span>
      </div>
    </div>
    <div class="waiting-controls">
      <span class="waiting-spinner" aria-hidden="true"></span>
      ${screen === "solo" && humanIsDummy && !soloFastForward
        ? `<button class="secondary-button" type="button" data-action="fast-forward">Быстро доиграть</button>`
        : `<p class="waiting-copy">${escapeHtml(getDeadlineText())}</p>`}
    </div>
  `;
}

function renderRoomWaitingDock(): string {
  const code = pvpRoom?.roomCode ?? roomInput;
  return `
    <div class="dock-header">
      <div class="dock-title">
        <span class="dock-title__primary">Приватный стол создан</span>
        <span class="dock-title__secondary">${networkStatus === "online" ? "Подключение активно" : "Подключаемся к комнате…"}</span>
      </div>
    </div>
    <div class="waiting-controls">
      <strong class="room-code-large">${escapeHtml(code || "------")}</strong>
      <div class="play-actions">
        <button class="secondary-button" type="button" data-action="copy-code">Копировать</button>
        <button class="primary-button" type="button" data-action="share-code">Пригласить</button>
      </div>
      <button class="danger-button" type="button" data-action="leave-room">Закрыть стол</button>
    </div>
  `;
}

function renderHelpModal(): string {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button class="round-button modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button>
        <p class="modal-kicker">Краткие правила</p>
        <h2 class="modal-title" id="help-title">Как играть в бридж</h2>
        <div class="modal-copy">
          <p>За столом четыре места и две пары: Север—Юг против Восток—Запад. В дуэли у каждого человека есть ИИ-партнёр.</p>
          <h3>1. Торговля</h3>
          <p>Заявка обещает взять указанное число взяток сверх шести. Например, 4♥ означает контракт на 10 взяток с червами как козырем. БК — игра без козыря.</p>
          <ul>
            <li>Следующая заявка должна быть выше предыдущей: ♣, ♦, ♥, ♠, БК.</li>
            <li>Пас пропускает ход. Три паса после заявки завершают торговлю.</li>
            <li>Контра X и реконтра XX увеличивают риск и счёт.</li>
          </ul>
          <h3>2. Розыгрыш</h3>
          <p>Первый игрок масти задаёт её для взятки. Если такая масть у вас есть, нужно сыграть именно её. Старший козырь побеждает; без козыря берёт старшая карта начальной масти.</p>
          <h3>3. Declarer и dummy</h3>
          <p>Declarer разыгрывает контракт и управляет открытой рукой партнёра — dummy. Если вы сами стали dummy, по классическим правилам решения принимает партнёр.</p>
          <h3>Этот прототип</h3>
          <p>Правила сдачи и duplicate scoring полноценные. ИИ играет на уровне клубного новичка; рейтинга и наград World of Life пока нет.</p>
        </div>
        <button class="primary-button" type="button" data-action="close-modal">Понятно</button>
      </article>
    </div>
  `;
}

function renderAuctionModal(view: ViewerSnapshot): string {
  const rows: string[] = [];
  const startIndex = SEATS.indexOf(view.dealer);
  const leadingEmpty = startIndex;
  const cells: Array<{ seat: Seat; call: Call } | null> = [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...view.auction.map((entry) => ({ seat: entry.seat, call: entry.call })),
  ];
  while (cells.length % 4 !== 0) cells.push(null);
  for (let index = 0; index < cells.length; index += 4) {
    rows.push(cells.slice(index, index + 4).map((cell) => {
      if (!cell) return `<span class="auction-sheet__cell">—</span>`;
      const red = cell.call.type === "bid" && isRedStrain(cell.call.strain);
      return `<span class="auction-sheet__cell${red ? " auction-sheet__cell--red" : ""}">${escapeHtml(formatCall(cell.call))}</span>`;
    }).join(""));
  }
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="auction-title">
        <button class="round-button modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button>
        <p class="modal-kicker">Сдача ${view.boardNumber}</p>
        <h2 class="modal-title" id="auction-title">История торговли</h2>
        <div class="auction-sheet">
          ${SEATS.map((seat) => `<span class="auction-sheet__cell auction-sheet__cell--heading">${SEAT_LABELS[seat].slice(0, 1)}</span>`).join("")}
          ${rows.join("")}
        </div>
        <div class="modal-copy">
          <p><strong>${escapeHtml(formatContract(view.contract))}</strong></p>
          <p>${escapeHtml(formatVulnerability(view.vulnerability))}</p>
        </div>
        <button class="primary-button" type="button" data-action="close-modal">Вернуться к столу</button>
      </article>
    </div>
  `;
}

function renderResultModal(view: ViewerSnapshot): string {
  const result = view.result as BridgeResult;
  const viewerSide = partnershipOf(view.viewerSeat);
  const scoreNS = result.scoreNS;
  const viewerScore = viewerSide === "ns" ? scoreNS : -scoreNS;
  const outcome = viewerScore > 0 ? "Победа вашей пары" : viewerScore < 0 ? "Поражение вашей пары" : "Ничья";
  const breakdown = result.type === "contract" ? result.breakdown : null;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <button class="round-button modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button>
        <p class="modal-kicker">${escapeHtml(formatResultTitle(result))}</p>
        <h2 class="modal-title" id="result-title">${escapeHtml(outcome)}</h2>
        <div class="result-score">
          <strong class="result-score__value">${escapeHtml(formatSignedScore(viewerScore))}</strong>
          <span class="result-score__label">очков вашей пары за сдачу</span>
        </div>
        ${breakdown ? `
          <div class="score-breakdown">
            ${scoreRow("Контрактные очки", breakdown.contractPoints)}
            ${scoreRow("Лишние взятки", breakdown.overtrickPoints)}
            ${scoreRow("Бонус game / partscore", breakdown.gameOrPartscoreBonus)}
            ${scoreRow("Бонус slam", breakdown.slamBonus)}
            ${scoreRow("Контра / реконтра", breakdown.insultBonus)}
            ${breakdown.undertrickPenalty ? scoreRow("Штраф за недобор", -breakdown.undertrickPenalty) : ""}
          </div>
        ` : `<div class="modal-copy"><p>Все четыре игрока спасовали. Счёт сдачи — 0.</p></div>`}
        <div class="modal-actions">
          <button class="secondary-button" type="button" data-action="back-home">На главную</button>
          <button class="primary-button" type="button" data-action="${screen === "solo" ? "new-solo" : "new-pvp"}">${screen === "solo" ? "Ещё сдача" : "Новый стол"}</button>
        </div>
      </article>
    </div>
  `;
}

function scoreRow(label: string, value: number): string {
  return `<div class="score-breakdown__row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatSignedScore(value))}</strong></div>`;
}

function renderToast(): string {
  return toastMessage ? `<div class="toast" role="status">${escapeHtml(toastMessage)}</div>` : "";
}

function getPlayerSummaries(viewerSeat: Seat): Record<Seat, BridgeRoomPlayerSummary> {
  if (screen === "pvp" && pvpSnapshot) return pvpSnapshot.players;
  return {
    north: { kind: "bot", displayName: "Марта · ИИ", connected: true, left: false },
    east: { kind: "bot", displayName: "Грегор · ИИ", connected: true, left: false },
    south: {
      kind: viewerSeat === "south" ? "human" : "bot",
      displayName: viewerSeat === "south" ? telegram.displayName : "Игрок",
      connected: true,
      left: false,
    },
    west: { kind: "bot", displayName: "Руди · ИИ", connected: true, left: false },
  };
}

function getDisplayedHandSeat(view: ViewerSnapshot): Seat {
  return view.controller === view.viewerSeat && view.currentSeat && view.currentSeat !== view.viewerSeat
    ? view.currentSeat
    : view.viewerSeat;
}

function getTableStatus(view: ViewerSnapshot): string {
  if (view.phase === "auction") {
    return view.currentSeat ? `Торговля · ход: ${SEAT_LABELS[view.currentSeat]}` : "Торговля завершена";
  }
  if (view.phase === "complete") return "Сдача завершена";
  const trick = Math.min(13, view.completedTricks.length + 1);
  return `Взятка ${trick}/13 · С—Ю ${view.tricksWon.ns} : ${view.tricksWon.ew} В—З`;
}

function getDeadlineText(): string {
  if (screen !== "pvp" || !pvpSnapshot?.deadlineAt) return "Ход продолжится автоматически.";
  const remaining = Math.max(0, Math.ceil((pvpSnapshot.deadlineAt - Date.now()) / 1_000));
  return `До автоматического хода: ${remaining} сек.`;
}

function updateDeadlineTicker(): void {
  const shouldTick = screen === "pvp"
    && Boolean(pvpSnapshot?.deadlineAt)
    && pvpSnapshot?.status === "playing";
  if (shouldTick && deadlineTicker === null) {
    deadlineTicker = window.setInterval(() => {
      if (screen === "pvp" && pvpSnapshot?.deadlineAt) render();
    }, 1_000);
  } else if (!shouldTick && deadlineTicker !== null) {
    window.clearInterval(deadlineTicker);
    deadlineTicker = null;
  }
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
  const text = `Присоединяйся к моему столу в Bridge. Код: ${code}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Bridge · Крысиная нора", text, url: shareUrl.toString() });
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

function randomBoardNumber(): number {
  if (typeof crypto?.getRandomValues === "function") {
    const value = crypto.getRandomValues(new Uint8Array(1))[0];
    return (value % 16) + 1;
  }
  return Math.floor(Math.random() * 16) + 1;
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
  const key = "bridge-development-player-v1";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = Math.random().toString(36).slice(2, 8);
  window.sessionStorage.setItem(key, value);
  return value;
}
