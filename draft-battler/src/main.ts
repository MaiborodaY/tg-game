import "./styles.css";
import type { BattlefieldController } from "./rendering/phaserBattleScene";
import {
  BOARD_SLOT_COUNT,
  canRerollDraftCards,
  cloneBoardSlots,
  createBattleTimeline,
  createDraftOptions,
  createEmptyBoardSlots,
  getBoardCapacityForRound,
  getCardDefinition,
  getCardStatsForUpgrade,
  chooseDraftCards,
  createRun,
  rerollDraftCards,
  resolveRound,
  isCardAllowedInSlot,
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type CardDefinition,
  type CardId,
  type BattleTimeline,
  type CombatEvent,
  type CombatResult,
  type CombatUnit,
  type CombatWinner,
  type DraftOption,
  type Owner,
  type RoundRecord,
  type RunState,
} from "./game";
import {
  DRAFT_CAMERA_ZOOM,
  FIELD_FALLBACK_HEIGHT,
  FIELD_FALLBACK_WIDTH,
  createFieldLayout,
  getDraftSlotPerspectiveScale,
  getFieldSlotColumn,
  getFieldSlotRow,
  getSlotLaneX,
  projectDraftPoint,
  type FieldLayout,
} from "./fieldLayout";
import {
  getAbilityIconPath,
  getCardArchetypeIconPath,
  type CardArchetype,
} from "./cardAssetContract";
import { getUnitAsset, getUnitCardAssetPath } from "./unitAssets";

type ScreenMode = "menu" | "draft" | "battle" | "finished";
type PlayMode = "solo" | "online";
type CardRarity = "common" | "uncommon" | "rare";
type PvpConnectionStatus = "idle" | "connecting" | "connected" | "error";
type PvpPlayerRole = "host" | "guest";
type PvpPeerRole = PvpPlayerRole | "spectator";
type BattlefieldCommand =
  | { type: "draft"; key: string; playerCastleHp: number }
  | { type: "battle"; key: string; timeline: BattleTimeline };

interface CardDisplayMeta {
  archetype: CardArchetype;
  archetypeIconPath: string;
  archetypeLabel: string;
  rarity: CardRarity;
  rarityLabel: string;
}

interface UiState {
  run: RunState;
  mode: ScreenMode;
  playMode: PlayMode;
  draftBoardSlots: BoardSlot[];
  cardPickedThisRound: boolean;
  selectedDraftCardId?: CardId;
  selectedCardInfoId?: CardId;
  battleFinished: boolean;
  battlePresentationNotice?: string;
  logsOpen: boolean;
  selectedLogRound?: number;
  lastRound: number;
  lastBattleTimeline?: BattleTimeline;
  pvp: PvpState;
}

interface PvpState {
  panelOpen: boolean;
  status: PvpConnectionStatus;
  roomId: string;
  roomInput: string;
  peerId?: string;
  role?: PvpPeerRole;
  connectedPeers: number;
  players: PvpPlayerSlot[];
  match?: PvpMatchSnapshot;
  error?: string;
}

interface PvpRoomSnapshot {
  roomId: string;
  status: "waiting" | "ready";
  connectedPeers: number;
  players: PvpPlayerSlot[];
  match?: PvpMatchSnapshot;
  serverNow: number;
}

type PvpMatchPhase = "draft" | "battle";

interface PvpMatchSnapshot {
  matchId: string;
  seed: string;
  round: number;
  phase: PvpMatchPhase;
  hostHp: number;
  guestHp: number;
  submissions: PvpSubmissionSnapshot[];
  combat?: PvpCombatSnapshot;
  updatedAt: number;
}

interface PvpSubmissionSnapshot {
  role: PvpPlayerRole;
  submitted: boolean;
  submittedAt: number | null;
}

interface PvpCombatSnapshot {
  round: number;
  hostSlots: BoardSlot[];
  guestSlots: BoardSlot[];
  combat: CombatResult;
  hostHpBefore: number;
  hostHpAfter: number;
  guestHpBefore: number;
  guestHpAfter: number;
}

interface PvpPlayerSlot {
  role: PvpPlayerRole;
  peerId: string | null;
  connected: boolean;
  ready: boolean;
  joinedAt: number | null;
}

interface PvpServerMessage {
  type?: string;
  roomId?: string;
  peerId?: string;
  role?: PvpPeerRole;
  connectedPeers?: number;
  payload?: unknown;
  serverNow?: number;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing app root.");
}

const appRoot = app;

let uiState: UiState = createInitialUiState();
let shellElement: HTMLElement | undefined;
let stageElement: HTMLElement | undefined;
let sceneHostElement: HTMLElement | undefined;
let scenePhaserHostElement: HTMLElement | undefined;
let battlefieldController: BattlefieldController | undefined;
let battlefieldMountRequested = false;
let latestBattlefieldCommand: BattlefieldCommand | undefined;
let appliedBattlefieldCommandKey: string | undefined;
let battlefieldPresentationDisabled = false;
const POINTER_DRAG_START_DISTANCE = 8;
const FIELD_SLOT_HIT_PADDING = 12;
const FIELD_SLOT_TOUCH_HIT_PADDING = 30;
const DRAG_GHOST_FOOT_HIT_INSET = 12;
const BATTLE_PRESENTATION_WATCHDOG_MS = 60_000;
const FORCE_RENDERER_FAILURE = new URLSearchParams(window.location.search).get("draftRendererFail") === "1";
const PVP_UI_ENABLED: boolean = false;
const PVP_WORKER_ORIGIN = "https://draft-battler-pvp.mr-maybik.workers.dev";
const PVP_ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,47}$/;
const PVP_ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PVP_ROOM_CODE_LENGTH = 6;

interface ActivePointerDrag {
  cleanup: () => void;
}

interface ClientPoint {
  clientX: number;
  clientY: number;
}

interface FieldSlotPosition {
  xPercent: number;
  yFromBottom: number;
  scale: number;
  depth: number;
}

interface FieldSlotHitTarget {
  slotIndex: number;
  element: HTMLElement;
  left: number;
  top: number;
  right: number;
  bottom: number;
  hitLeft: number;
  hitTop: number;
  hitRight: number;
  hitBottom: number;
}

interface FieldSlotDropTargetState {
  slotIndex?: number;
  isValid: boolean;
  element?: HTMLElement;
}

let activePointerDrag: ActivePointerDrag | undefined;
let activeFieldSlotDropTarget: FieldSlotDropTargetState = { isValid: true };
let suppressNextCardClick = false;
let pvpSocket: WebSocket | undefined;
let pvpSocketCloseExpected = false;
let battlePresentationWatchdog: number | undefined;
let battlePresentationWatchdogKey: string | undefined;

render();
window.addEventListener("beforeunload", () => closePvpSocket());

function createInitialUiState(seed = createSeed(), playMode: PlayMode = "solo", mode: ScreenMode = "menu"): UiState {
  const run = createRun(seed);

  return {
    run,
    mode,
    playMode,
    draftBoardSlots: cloneBoardSlots(run.boardSlots),
    cardPickedThisRound: false,
    battleFinished: false,
    logsOpen: false,
    lastRound: 1,
    pvp: createInitialPvpState(),
  };
}

function createInitialPvpState(panelOpen = false): PvpState {
  return {
    panelOpen,
    status: "idle",
    roomId: "",
    roomInput: "",
    connectedPeers: 0,
    players: createEmptyPvpPlayerSlots(),
  };
}

function createEmptyPvpPlayerSlots(): PvpPlayerSlot[] {
  return [
    { role: "host", peerId: null, connected: false, ready: false, joinedAt: null },
    { role: "guest", peerId: null, connected: false, ready: false, joinedAt: null },
  ];
}

function render(): void {
  const stage = getStageElement();
  stage.className = `stage stage--${uiState.mode}`;
  stage.replaceChildren(getSceneCanvasHost());

  if (uiState.mode === "menu") {
    stage.append(createMainMenuOverlay());
  } else if (uiState.mode === "draft") {
    stage.append(createDraftHud(), createDraftOverlay());
  } else {
    stage.append(createBattleOverlay());
  }

  if (uiState.mode !== "menu") {
    stage.append(createLogsOverlay());
  }

  syncBattlefield();
}

function getShellElement(): HTMLElement {
  if (!shellElement) {
    shellElement = document.createElement("main");
    shellElement.className = "app-shell";
    appRoot.replaceChildren(shellElement);
  }

  return shellElement;
}

function getStageElement(): HTMLElement {
  if (!stageElement) {
    stageElement = document.createElement("section");
    getShellElement().append(stageElement);
  }

  return stageElement;
}

function createMetric(label: string, value: string): HTMLElement {
  const metric = document.createElement("div");
  const metricKey = label.toLowerCase();
  metric.className = `metric metric--${metricKey}`;

  const icon = document.createElement("span");
  icon.className = "metric__icon";
  icon.setAttribute("aria-hidden", "true");

  const labelEl = document.createElement("span");
  labelEl.className = "metric__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("strong");
  valueEl.className = "metric__value";
  valueEl.textContent = value;

  metric.append(icon, labelEl, valueEl);

  return metric;
}

function createDraftHud(): HTMLElement {
  const hud = document.createElement("div");
  hud.className = "draft-hud";
  hud.append(
    createMetric("HP", String(uiState.run.playerHp)),
    createMetric("Round", String(uiState.run.round)),
    createMetric("Seed", uiState.run.seed.slice(-6)),
  );

  return hud;
}

function createMainMenuOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "main-menu-overlay";

  const panel = document.createElement("section");
  panel.className = "main-menu";

  const title = document.createElement("h1");
  title.className = "main-menu__title";
  title.textContent = "Draft Battler";

  const subtitle = document.createElement("p");
  subtitle.className = "main-menu__subtitle";
  subtitle.textContent = "Соберите отряд и пройдите 10 раундов.";

  const actions = document.createElement("div");
  actions.className = "main-menu__actions";

  const soloButton = document.createElement("button");
  soloButton.className = "main-menu__button main-menu__button--primary";
  soloButton.type = "button";
  soloButton.textContent = "Начать забег";
  soloButton.addEventListener("click", startSoloRun);

  actions.append(soloButton);
  if (PVP_UI_ENABLED) {
    const onlineButton = document.createElement("button");
    onlineButton.className = "main-menu__button";
    onlineButton.type = "button";
    onlineButton.textContent = "Онлайн";
    onlineButton.addEventListener("click", startOnlineLobby);
    actions.append(onlineButton);
  }

  panel.append(title, subtitle, actions);
  overlay.append(panel);

  return overlay;
}

function startSoloRun(): void {
  activePointerDrag?.cleanup();
  clearBattlePresentationWatchdog();
  closePvpSocket();
  uiState = createInitialUiState(createSeed(), "solo", "draft");
  render();
}

function returnToMainMenu(): void {
  activePointerDrag?.cleanup();
  clearBattlePresentationWatchdog();
  closePvpSocket();
  uiState = createInitialUiState();
  render();
}

function startOnlineLobby(): void {
  activePointerDrag?.cleanup();
  closePvpSocket();
  uiState = {
    ...createInitialUiState(createSeed(), "online", "draft"),
    pvp: createInitialPvpState(true),
  };
  render();
}

function createDraftOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "draft-overlay";
  const isWaitingForOnlineMatch = uiState.playMode === "online" && !uiState.pvp.match;
  const selectedDraftCardId = getSelectedDraftCardId();

  if (!isWaitingForOnlineMatch) {
    overlay.append(createFieldSlotsLayer(), createFieldActionBar());

    if (selectedDraftCardId && !uiState.cardPickedThisRound) {
      overlay.append(createTapPlacementPanel(selectedDraftCardId));
    }
  }

  if (uiState.pvp.panelOpen || isWaitingForOnlineMatch) {
    overlay.append(createPvpPanel());
  }

  if (!isWaitingForOnlineMatch && !uiState.cardPickedThisRound && !selectedDraftCardId) {
    overlay.append(createDraftPanel());
  }

  if (uiState.selectedCardInfoId) {
    overlay.append(createCardInfoPanel(uiState.selectedCardInfoId));
  }

  return overlay;
}

function createBattleOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "battle-overlay";

  if (uiState.battleFinished) {
    overlay.append(uiState.mode === "finished" && uiState.playMode === "solo" ? createSoloTerminalResult() : createBattleActionPanel());
  }

  return overlay;
}

function createBattleActionPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "battle-action-panel";

  if (uiState.battlePresentationNotice) {
    panel.append(createBattlePresentationNotice(uiState.battlePresentationNotice));
  }

  panel.append(createActionBar());

  return panel;
}

function createBattlePresentationNotice(message: string): HTMLElement {
  const notice = document.createElement("p");
  notice.className = "battle-presentation-notice";
  notice.textContent = message;

  return notice;
}

function createSoloTerminalResult(): HTMLElement {
  const completedRounds = uiState.run.roundHistory.length;
  const victory = uiState.run.playerHp > 0 && completedRounds >= MAX_RUN_ROUNDS;
  const panel = document.createElement("section");
  panel.className = `terminal-result terminal-result--${victory ? "victory" : "defeat"}`;

  const eyebrow = document.createElement("span");
  eyebrow.className = "terminal-result__eyebrow";
  eyebrow.textContent = "Забег завершён";

  const title = document.createElement("h1");
  title.className = "terminal-result__title";
  title.textContent = victory ? "Победа!" : "Поражение";

  const detail = document.createElement("p");
  detail.className = "terminal-result__detail";
  detail.textContent = victory
    ? `Вы выдержали все ${MAX_RUN_ROUNDS} раундов.`
    : `Крепость пала на раунде ${Math.max(1, completedRounds)}.`;

  const metrics = document.createElement("div");
  metrics.className = "terminal-result__metrics";
  metrics.append(
    createTerminalMetric("Раунды", `${completedRounds}/${MAX_RUN_ROUNDS}`),
    createTerminalMetric("HP", String(uiState.run.playerHp)),
  );

  const actions = document.createElement("div");
  actions.className = "terminal-result__actions";

  const restartButton = document.createElement("button");
  restartButton.className = "primary-button";
  restartButton.type = "button";
  restartButton.textContent = "Ещё раз";
  restartButton.addEventListener("click", startSoloRun);

  const menuButton = document.createElement("button");
  menuButton.className = "terminal-result__secondary-button";
  menuButton.type = "button";
  menuButton.textContent = "В меню";
  menuButton.addEventListener("click", returnToMainMenu);

  actions.append(restartButton, menuButton);
  panel.append(eyebrow, title, detail, metrics);

  if (uiState.battlePresentationNotice) {
    panel.append(createBattlePresentationNotice(uiState.battlePresentationNotice));
  }

  panel.append(actions);

  return panel;
}

function createTerminalMetric(label: string, value: string): HTMLElement {
  const metric = document.createElement("div");
  metric.className = "terminal-result__metric";

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = value;

  metric.append(labelElement, valueElement);

  return metric;
}

function createLogsOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "logs-overlay";

  const visibleLogs = getVisibleRoundLogs();
  if (visibleLogs.length === 0) {
    return overlay;
  }

  if (uiState.logsOpen) {
    overlay.append(createLogsPanel(visibleLogs));
  }

  const button = document.createElement("button");
  button.className = uiState.logsOpen ? "logs-button logs-button--active" : "logs-button";
  button.type = "button";
  button.textContent = "Logs";
  button.addEventListener("click", () => {
    const nextOpen = !uiState.logsOpen;
    const selectedLog = getSelectedRoundLog(visibleLogs);

    uiState = {
      ...uiState,
      logsOpen: nextOpen,
      selectedLogRound: nextOpen ? selectedLog?.round : uiState.selectedLogRound,
    };
    render();
  });

  overlay.append(button);

  return overlay;
}

function createLogsPanel(logs: readonly RoundRecord[]): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "logs-panel";

  const header = document.createElement("div");
  header.className = "logs-panel__header";

  const title = document.createElement("h2");
  title.textContent = "Logs";

  const closeButton = document.createElement("button");
  closeButton.className = "logs-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "x";
  closeButton.setAttribute("aria-label", "Close logs");
  closeButton.addEventListener("click", () => {
    uiState = {
      ...uiState,
      logsOpen: false,
    };
    render();
  });

  header.append(title, closeButton);

  const tabs = document.createElement("div");
  tabs.className = "logs-round-tabs";

  logs.forEach((log) => {
    const roundButton = document.createElement("button");
    roundButton.className =
      log.round === getSelectedRoundLog(logs)?.round
        ? "logs-round-button logs-round-button--selected"
        : "logs-round-button";
    roundButton.type = "button";
    roundButton.textContent = `Round ${log.round}`;
    roundButton.addEventListener("click", () => {
      uiState = {
        ...uiState,
        selectedLogRound: log.round,
      };
      render();
    });

    tabs.append(roundButton);
  });

  const body = document.createElement("div");
  body.className = "logs-panel__body";

  const selectedLog = getSelectedRoundLog(logs);
  if (selectedLog) {
    body.append(createRoundLogReport(selectedLog));
  }

  panel.append(header, tabs, body);

  return panel;
}

function createRoundLogReport(log: RoundRecord): HTMLElement {
  const report = document.createElement("div");
  report.className = "report report--log";

  const title = document.createElement("h2");
  title.textContent = `Round ${log.round}`;

  report.append(title, createBattleSummary(log), createMatchupList(log.playerSlots, log.enemySlots));

  return report;
}

function getVisibleRoundLogs(): RoundRecord[] {
  return uiState.run.roundHistory.filter((log) => {
    if (uiState.mode !== "battle" && uiState.mode !== "finished") {
      return true;
    }

    return log.round !== uiState.lastRound || uiState.battleFinished;
  });
}

function getSelectedRoundLog(logs: readonly RoundRecord[]): RoundRecord | undefined {
  const selected = logs.find((log) => log.round === uiState.selectedLogRound);

  return selected ?? logs[logs.length - 1];
}

function createDraftPanel(): HTMLElement {
  const draftPanel = document.createElement("section");
  draftPanel.className = "draft-panel";
  draftPanel.append(createDraftHeader());

  if (uiState.run.round === 1 && getFilledSlotCount() === 0) {
    draftPanel.append(createDraftOnboarding());
  }

  draftPanel.append(createDraftGrid());

  return draftPanel;
}

function createDraftOnboarding(): HTMLElement {
  const hint = document.createElement("p");
  hint.className = "draft-onboarding";
  hint.textContent = "Коснитесь карты и позиции на поле — или перетащите карту.";

  return hint;
}

function createDraftHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("h1");
  title.textContent = "Выберите одну карту";

  const caption = document.createElement("span");
  caption.className = "panel-caption";
  caption.textContent = `Места ${getFilledSlotCount()}/${getBoardCapacity()}`;

  header.append(title, caption);

  return header;
}

function createDraftGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "draft-grid";

  getCurrentDraftOptions().forEach((option) => {
    grid.append(createDraftCard(option));
  });
  grid.append(createRerollButton());

  return grid;
}

function createDraftCard(option: DraftOption): HTMLButtonElement {
  const card = getCardDefinition(option.cardId);
  const meta = getCardDisplayMeta(card);
  const placeable = canPlaceDraftCard(option.cardId);
  const button = document.createElement("button");
  const cardClasses = ["unit-card", `unit-card--${meta.archetype}`, `unit-card--${meta.rarity}`];
  if (uiState.selectedDraftCardId === option.cardId) {
    cardClasses.push("unit-card--selected");
  }
  if (uiState.selectedCardInfoId === option.cardId) {
    cardClasses.push("unit-card--inspected");
  }

  button.className = cardClasses.join(" ");
  button.type = "button";
  button.disabled = uiState.mode !== "draft" || !placeable;
  button.draggable = false;
  button.title = card.summary;
  button.dataset.cardId = option.cardId;
  button.setAttribute("aria-pressed", String(uiState.selectedDraftCardId === option.cardId));

  button.append(
    createCardFrame(),
    createCardArchetypeBadge(meta),
    createCardBody(card, meta),
  );

  button.addEventListener("click", () => handleDraftCardClick(option.cardId));
  button.addEventListener("pointerdown", (event) => startPointerDraftDrag(option.cardId, event));

  return button;
}

function createCardFrame(): HTMLElement {
  const frame = document.createElement("span");
  frame.className = "unit-card__frame";
  frame.setAttribute("aria-hidden", "true");

  return frame;
}

function createCardInfoPanel(cardId: CardId): HTMLElement {
  const card = getCardDefinition(cardId);
  const meta = getCardDisplayMeta(card);
  const panel = document.createElement("aside");
  panel.className = `card-info-panel unit-card--${meta.archetype} unit-card--${meta.rarity}`;

  const closeButton = document.createElement("button");
  closeButton.className = "card-info-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "x";
  closeButton.setAttribute("aria-label", "Close card info");
  closeButton.addEventListener("click", closeCardInfo);

  const title = document.createElement("strong");
  title.className = "card-info-panel__title";
  title.textContent = card.name;

  const type = createCardMetaRow(meta);
  type.classList.add("card-info-panel__type");

  const stats = createCardStats(card);
  stats.classList.add("card-info-panel__stats");

  const tags = document.createElement("div");
  tags.className = "card-info-panel__tags";
  card.tags.forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.textContent = tag;
    tags.append(tagEl);
  });

  const summary = document.createElement("p");
  summary.className = "card-info-panel__summary";
  summary.textContent = card.summary;

  panel.append(closeButton, title, type, createCardArt(card, meta), stats, tags, summary);

  return panel;
}

function createRerollButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "reroll-button";
  button.type = "button";
  button.disabled = !canRerollDraftCards(uiState.run);
  button.textContent = button.disabled ? "Обновлено" : "Обновить";
  button.addEventListener("click", rerollCurrentDraftCards);

  return button;
}

function createTapPlacementPanel(cardId: CardId): HTMLElement {
  const card = getCardDefinition(cardId);
  const upgradeSlot = getUpgradeableBoardSlot(cardId);
  const panel = document.createElement("section");
  panel.className = "tap-placement-panel";

  const copy = document.createElement("div");
  copy.className = "tap-placement-panel__copy";

  const title = document.createElement("strong");
  title.textContent = `Выбран: ${card.name}`;

  const hint = document.createElement("span");
  hint.textContent = upgradeSlot
    ? "Коснитесь поля — существующий боец улучшится."
    : "Коснитесь подходящей позиции на поле.";
  copy.append(title, hint);

  const actions = document.createElement("div");
  actions.className = "tap-placement-panel__actions";

  const infoButton = document.createElement("button");
  infoButton.type = "button";
  infoButton.textContent = "О карте";
  infoButton.addEventListener("click", () => openCardInfo(cardId));

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Отмена";
  cancelButton.addEventListener("click", cancelDraftCardSelection);

  actions.append(infoButton, cancelButton);
  panel.append(copy, actions);

  return panel;
}

function createPvpPanel(): HTMLElement {
  const panel = document.createElement("section");
  panel.className = `pvp-panel pvp-panel--${uiState.pvp.status}`;

  const header = document.createElement("div");
  header.className = "pvp-panel__header";

  const title = document.createElement("h2");
  title.textContent = "PvP Room";

  const status = document.createElement("span");
  status.className = `pvp-status pvp-status--${uiState.pvp.status}`;
  status.textContent = getPvpStatusLabel();

  const closeButton = document.createElement("button");
  closeButton.className = "pvp-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "x";
  closeButton.setAttribute("aria-label", "Close PvP room");
  closeButton.addEventListener("click", () => setPvpPanelOpen(false));

  header.append(title, status, closeButton);
  panel.append(header);

  if (uiState.pvp.status === "connected") {
    panel.append(createPvpConnectedView());
  } else if (uiState.pvp.status === "connecting") {
    panel.append(createPvpConnectingView());
  } else {
    panel.append(createPvpJoinView());
  }

  return panel;
}

function createPvpJoinView(): HTMLElement {
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  if (uiState.pvp.error) {
    const error = document.createElement("p");
    error.className = "pvp-panel__error";
    error.textContent = uiState.pvp.error;
    body.append(error);
  }

  const controls = document.createElement("div");
  controls.className = "pvp-room-controls";

  const input = document.createElement("input");
  input.className = "pvp-room-input";
  input.type = "text";
  input.inputMode = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = 48;
  input.placeholder = "Room code";
  input.value = uiState.pvp.roomInput;
  input.addEventListener("input", () => {
    uiState = {
      ...uiState,
      pvp: {
        ...uiState.pvp,
        roomInput: input.value,
        error: undefined,
      },
    };
  });

  const joinButton = document.createElement("button");
  joinButton.className = "pvp-panel__button";
  joinButton.type = "button";
  joinButton.textContent = "Join";
  joinButton.addEventListener("click", () => connectPvpRoom(input.value));

  const createButton = document.createElement("button");
  createButton.className = "pvp-panel__button pvp-panel__button--primary";
  createButton.type = "button";
  createButton.textContent = "Create";
  createButton.addEventListener("click", () => connectPvpRoom(createPvpRoomCode()));

  controls.append(input, joinButton, createButton);
  body.append(controls);

  return body;
}

function createPvpConnectingView(): HTMLElement {
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  const room = document.createElement("div");
  room.className = "pvp-room-summary";
  room.append(createPvpRoomCodeElement(uiState.pvp.roomId), createPvpPeerCount());

  const leaveButton = document.createElement("button");
  leaveButton.className = "pvp-panel__button";
  leaveButton.type = "button";
  leaveButton.textContent = "Cancel";
  leaveButton.addEventListener("click", disconnectPvpRoom);

  body.append(room, leaveButton);

  return body;
}

function createPvpConnectedView(): HTMLElement {
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  const room = document.createElement("div");
  room.className = "pvp-room-summary";
  room.append(createPvpRoomCodeElement(uiState.pvp.roomId), createPvpPeerCount());

  const players = document.createElement("div");
  players.className = "pvp-player-slots";
  uiState.pvp.players.forEach((player) => {
    players.append(createPvpPlayerSlot(player));
  });

  const actions = document.createElement("div");
  actions.className = "pvp-panel__actions";

  const readyButton = document.createElement("button");
  readyButton.className = getCurrentPvpPlayer()?.ready
    ? "pvp-panel__button pvp-panel__button--ready"
    : "pvp-panel__button pvp-panel__button--primary";
  readyButton.type = "button";
  readyButton.disabled = uiState.pvp.role === "spectator";
  readyButton.textContent = getCurrentPvpPlayer()?.ready ? "Ready" : "Set Ready";
  readyButton.addEventListener("click", () => setPvpReady(!(getCurrentPvpPlayer()?.ready ?? false)));

  const leaveButton = document.createElement("button");
  leaveButton.className = "pvp-panel__button";
  leaveButton.type = "button";
  leaveButton.textContent = "Leave";
  leaveButton.addEventListener("click", disconnectPvpRoom);

  actions.append(readyButton, leaveButton);
  body.append(room, players, actions);

  return body;
}

function createPvpRoomCodeElement(roomId: string): HTMLElement {
  const code = document.createElement("strong");
  code.className = "pvp-room-code";
  code.textContent = roomId ? roomId.toUpperCase() : "------";

  return code;
}

function createPvpPeerCount(): HTMLElement {
  const count = document.createElement("span");
  count.className = "pvp-peer-count";
  count.textContent = `${uiState.pvp.connectedPeers}/2`;

  return count;
}

function createPvpPlayerSlot(player: PvpPlayerSlot): HTMLElement {
  const slot = document.createElement("div");
  slot.className = player.connected ? "pvp-player-slot pvp-player-slot--connected" : "pvp-player-slot";

  const role = document.createElement("span");
  role.className = "pvp-player-slot__role";
  role.textContent = player.role;

  const state = document.createElement("strong");
  state.className = "pvp-player-slot__state";
  state.textContent = player.connected ? (player.ready ? "Ready" : "Joined") : "Open";

  slot.append(role, state);

  return slot;
}

function createCardName(card: CardDefinition): HTMLElement {
  const name = document.createElement("strong");
  name.className = "unit-card__name";
  name.textContent = card.name;

  return name;
}

function createCardBody(card: CardDefinition, meta: CardDisplayMeta): HTMLElement {
  const body = document.createElement("div");
  body.className = "unit-card__body";

  const footer = document.createElement("div");
  footer.className = "unit-card__footer";
  footer.append(createCardStats(card), createCardAbility(card));

  body.append(
    createCardArt(card, meta),
    createCardHeader(card, meta),
    footer,
  );

  return body;
}

function createCardArchetypeBadge(meta: CardDisplayMeta): HTMLElement {
  const badge = document.createElement("div");
  badge.className = `unit-card__archetype unit-card__archetype--${meta.archetype}`;
  badge.title = meta.archetypeLabel;
  badge.setAttribute("aria-label", meta.archetypeLabel);

  const icon = document.createElement("img");
  icon.className = "unit-card__archetype-icon";
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  icon.src = meta.archetypeIconPath;

  badge.append(icon);

  return badge;
}

function createCardHeader(card: CardDefinition, meta: CardDisplayMeta): HTMLElement {
  const header = document.createElement("div");
  header.className = "unit-card__header";

  header.append(createCardName(card), createCardRarity(meta));

  return header;
}

function createCardRarity(meta: CardDisplayMeta): HTMLElement {
  const rarity = document.createElement("span");
  rarity.className = `unit-card__rarity unit-card__rarity--${meta.rarity}`;
  rarity.textContent = meta.rarityLabel;

  return rarity;
}

function createCardMetaRow(meta: CardDisplayMeta): HTMLElement {
  const row = document.createElement("div");
  row.className = "unit-card__meta-row";

  const archetype = document.createElement("span");
  archetype.className = `unit-card__meta-pill unit-card__meta-pill--${meta.archetype}`;
  archetype.textContent = meta.archetypeLabel;

  const rarity = createCardRarity(meta);

  row.append(archetype, rarity);

  return row;
}

function createCardArt(card: CardDefinition, meta: CardDisplayMeta): HTMLElement {
  const art = document.createElement("div");
  art.className = `unit-card__art unit-card__art--${meta.archetype} unit-card__art--${meta.rarity}`;

  const assetPath = getUnitCardAssetPath(card.id) ?? getUnitAssetPath(card.id);
  if (assetPath) {
    const sprite = document.createElement("img");
    sprite.className = "unit-card__sprite";
    sprite.alt = card.name;
    sprite.decoding = "async";
    sprite.src = assetPath;
    art.append(sprite);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "unit-card__image-placeholder";
    placeholder.textContent = createCardInitials(card.name);
    art.append(placeholder);
  }

  return art;
}

function createDraftUnitDragGhost(cardId: CardId): HTMLElement {
  const card = getCardDefinition(cardId);
  const assetPath = getUnitAssetPath(card.id);
  const ghost = document.createElement("div");
  ghost.className = assetPath ? "draft-unit-drag-ghost draft-unit-drag-ghost--sprite" : "draft-unit-drag-ghost";
  ghost.setAttribute("aria-hidden", "true");

  if (assetPath) {
    const sprite = document.createElement("img");
    sprite.className = "draft-unit-drag-ghost__sprite";
    sprite.alt = "";
    sprite.decoding = "async";
    sprite.draggable = false;
    sprite.src = assetPath;
    ghost.append(sprite);
  } else {
    const avatar = document.createElement("span");
    avatar.className = `draft-unit-drag-ghost__avatar field-unit__avatar field-unit__avatar--${card.role}`;
    avatar.textContent = createCardInitials(card.name);
    ghost.append(avatar);
  }

  return ghost;
}

function getUnitAssetPath(cardId: CardId): string | undefined {
  return getUnitAsset(cardId)?.path;
}

function createCardInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createCardStats(card: CardDefinition): HTMLElement {
  const stats = document.createElement("div");
  stats.className = "unit-card__stats";

  stats.append(
    createStat("ATK", card.stats.attack),
    createStat("HP", card.stats.hp),
    createStat("SPD", card.stats.speed),
  );

  return stats;
}

function createCardAbility(card: CardDefinition): HTMLElement {
  const ability = document.createElement("p");
  ability.className = "unit-card__ability";

  const icon = document.createElement("img");
  icon.className = "unit-card__ability-icon";
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  icon.src = getAbilityIconPath(card.abilityId);
  ability.append(icon);

  const text = document.createElement("span");
  text.className = "unit-card__ability-text";
  text.textContent = card.cardText ?? card.summary;
  ability.append(text);

  return ability;
}

function createStat(label: string, value: number): HTMLElement {
  const stat = document.createElement("span");
  stat.className = "unit-card__stat";

  const labelEl = document.createElement("span");
  labelEl.className = "unit-card__stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("strong");
  valueEl.className = "unit-card__stat-value";
  valueEl.textContent = String(value);

  stat.append(labelEl, valueEl);

  return stat;
}

function getCardDisplayMeta(card: CardDefinition): CardDisplayMeta {
  const archetype = getCardArchetype(card);
  const rarity = getCardRarity(card);

  return {
    archetype,
    archetypeIconPath: getCardArchetypeIconPath(archetype),
    archetypeLabel: getCardArchetypeLabel(archetype),
    rarity,
    rarityLabel: getCardRarityLabel(rarity),
  };
}

function getCardArchetype(card: CardDefinition): CardArchetype {
  if (card.role === "tank") {
    return "tank";
  }

  if (card.role === "support") {
    return "support";
  }

  return "damage";
}

function getCardRarity(card: CardDefinition): CardRarity {
  if (card.tier === 1) {
    return "common";
  }

  if (card.tier === 2) {
    return "uncommon";
  }

  return "rare";
}

function getCardArchetypeLabel(archetype: CardArchetype): string {
  if (archetype === "tank") {
    return "Tank";
  }

  if (archetype === "support") {
    return "Support";
  }

  return "Damage";
}

function getCardRarityLabel(rarity: CardRarity): string {
  if (rarity === "uncommon") {
    return "Uncommon";
  }

  if (rarity === "rare") {
    return "Rare";
  }

  return "Common";
}

function createFieldSlotsLayer(): HTMLElement {
  const slots = document.createElement("div");
  slots.className = "field-slots";

  for (let slotIndex = 0; slotIndex < BOARD_SLOT_COUNT; slotIndex += 1) {
    slots.append(createFieldSlot(slotIndex));
  }

  return slots;
}

function getPlayerFieldSlotPosition(slotIndex: number): FieldSlotPosition {
  const layout = createCurrentFieldLayout();
  const row = getFieldSlotRow(slotIndex);
  const column = getFieldSlotColumn(slotIndex);
  const y = layout.homeRowsY.player[row] ?? layout.homeRowsY.player[0];
  const x = getSlotLaneX(layout, column, y);
  const screen = projectDraftPoint(layout, { x, y });
  const scale = DRAFT_CAMERA_ZOOM * getDraftSlotPerspectiveScale(layout, y);

  return {
    xPercent: (screen.x / layout.width) * 100,
    yFromBottom: layout.height - screen.y,
    scale,
    depth: row + 1,
  };
}

function createCurrentFieldLayout(): FieldLayout {
  const rect = stageElement?.getBoundingClientRect();
  const width = rect?.width && rect.width > 0 ? rect.width : FIELD_FALLBACK_WIDTH;
  const height = rect?.height && rect.height > 0 ? rect.height : FIELD_FALLBACK_HEIGHT;

  return createFieldLayout(width, height);
}

function createFieldActionBar(): HTMLElement {
  const actionBar = document.createElement("div");
  actionBar.className = "field-action-bar";
  actionBar.append(createActionBar());

  return actionBar;
}

function createFieldSlot(slotIndex: number): HTMLButtonElement {
  const slotState = getDraftBoardSlot(slotIndex);
  const cardId = slotState?.cardId ?? null;
  const card = cardId ? getCardDefinition(cardId) : undefined;
  const selectedDraftCardId = getSelectedDraftCardId();
  const upgradeSlot = selectedDraftCardId ? getUpgradeableBoardSlot(selectedDraftCardId) : undefined;
  const slot = document.createElement("button");
  const classes = ["field-slot"];
  if (card) {
    classes.push("field-slot--filled");
    classes.push(`field-slot--${getCardArchetype(card)}`);
  }
  if (slotState?.upgradeLevel) {
    classes.push("field-slot--upgraded");
  }
  if (selectedDraftCardId) {
    classes.push(canApplyDraftCardAtSlot(selectedDraftCardId, slotIndex) ? "field-slot--tap-target" : "field-slot--tap-invalid");
  }
  if (upgradeSlot?.slotIndex === slotIndex) {
    classes.push("field-slot--tap-upgrade");
  }
  slot.className = classes.join(" ");
  slot.type = "button";
  slot.disabled = false;
  slot.dataset.fieldSlotIndex = String(slotIndex);
  const slotPosition = getPlayerFieldSlotPosition(slotIndex);
  slot.style.setProperty("--slot-x", `${slotPosition.xPercent}%`);
  slot.style.setProperty("--slot-y", `${slotPosition.yFromBottom}px`);
  slot.style.setProperty("--slot-scale", `${slotPosition.scale}`);
  slot.style.setProperty("--slot-depth", `${slotPosition.depth}`);

  if (selectedDraftCardId) {
    const selectedCard = getCardDefinition(selectedDraftCardId);
    slot.title = upgradeSlot
      ? `Улучшить ${selectedCard.name}`
      : canApplyDraftCardAtSlot(selectedDraftCardId, slotIndex)
        ? `Поставить ${selectedCard.name} на позицию ${slotIndex + 1}`
        : `${selectedCard.name} нельзя поставить на позицию ${slotIndex + 1}`;
    slot.setAttribute("aria-label", slot.title);
  } else if (card) {
    slot.title = slotState?.upgradeLevel ? `${card.name} upgraded` : `${card.name}`;
    slot.setAttribute("aria-label", slot.title);
  } else {
    slot.title = `Empty slot ${slotIndex + 1}`;
    slot.setAttribute("aria-label", slot.title);
  }

  slot.addEventListener("click", () => handleFieldSlotClick(slotIndex, card?.id));

  if (card) {
    const unit = createFieldSlotUnit(card, slotState ?? createEmptyDraftBoardSlot(slotIndex));
    slot.append(unit);
    if (!selectedDraftCardId) {
      slot.addEventListener("pointerdown", (event) => startPointerFieldUnitDrag(slotIndex, unit, event));
    }
  }

  return slot;
}

function createFieldSlotUnit(card: CardDefinition, slot: BoardSlot): HTMLElement {
  const assetPath = getUnitAssetPath(card.id);
  const unit = document.createElement("div");
  unit.className = assetPath ? "field-unit field-unit--sprite" : "field-unit";
  unit.title = slot.upgradeLevel ? `${card.name} upgraded` : card.name;

  let marker: HTMLElement;
  if (assetPath) {
    const sprite = document.createElement("img");
    sprite.className = "field-unit__sprite";
    sprite.alt = card.name;
    sprite.decoding = "async";
    sprite.draggable = false;
    sprite.src = assetPath;
    marker = sprite;
  } else {
    marker = document.createElement("span");
    marker.className = `field-unit__avatar field-unit__avatar--${card.role}`;
    marker.textContent = createCardInitials(card.name);
  }

  unit.append(marker);
  if (slot.upgradeLevel) {
    const upgradeBadge = document.createElement("small");
    upgradeBadge.className = "field-unit__upgrade";
    upgradeBadge.textContent = "*";
    unit.append(upgradeBadge);
  }

  return unit;
}

function createActionBar(): HTMLElement {
  const actions = document.createElement("div");
  const actionClasses = ["action-bar"];
  if (uiState.mode === "draft") {
    actionClasses.push("action-bar--draft");
  }
  if (uiState.playMode === "online") {
    actionClasses.push("action-bar--online");
  }
  actions.className = actionClasses.join(" ");

  if (uiState.mode === "draft") {
    const fightButton = document.createElement("button");
    fightButton.className = "primary-button";
    fightButton.type = "button";
    fightButton.disabled = !canFightRound();
    fightButton.textContent = getDraftActionLabel();
    fightButton.addEventListener("click", fightRound);
    actions.append(fightButton);
  } else if (uiState.mode === "battle") {
    const nextButton = document.createElement("button");
    nextButton.className = "primary-button";
    nextButton.type = "button";
    nextButton.textContent = getBattleActionLabel();
    nextButton.addEventListener("click", goToNextRound);
    actions.append(nextButton);
  } else {
    const newRunButton = document.createElement("button");
    newRunButton.className = "primary-button";
    newRunButton.type = "button";
    newRunButton.textContent = "В меню";
    newRunButton.addEventListener("click", returnToMainMenu);
    actions.append(newRunButton);
  }

  return actions;
}

function getDraftActionLabel(): string {
  if (uiState.playMode !== "online") {
    return "В бой";
  }

  if (isCurrentPvpPlayerSubmitted()) {
    return "Waiting";
  }

  return "Lock";
}

function getBattleActionLabel(): string {
  return isPvpMatchFinished() ? "В меню" : "Следующий раунд";
}

function goToNextRound(): void {
  if (uiState.playMode === "online") {
    if (isPvpMatchFinished()) {
      returnToMainMenu();
      return;
    }

    sendPvpNextRound();
    return;
  }

  uiState = {
    ...uiState,
    mode: "draft",
    draftBoardSlots: cloneBoardSlots(uiState.run.boardSlots),
    cardPickedThisRound: false,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
  };
  render();
}

function getSceneCanvasHost(): HTMLElement {
  if (!sceneHostElement) {
    sceneHostElement = document.createElement("div");
    sceneHostElement.className = "scene-canvas-host";
    sceneHostElement.append(getScenePhaserHost());
  }

  return sceneHostElement;
}

function getScenePhaserHost(): HTMLElement {
  if (!scenePhaserHostElement) {
    scenePhaserHostElement = document.createElement("div");
    scenePhaserHostElement.className = "scene-phaser-host";
    scenePhaserHostElement.append(createSceneCanvasMessage("Loading scene..."));
  }

  return scenePhaserHostElement;
}

function createSceneCanvasMessage(message: string): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.className = "scene-canvas-message";
  messageEl.textContent = message;

  return messageEl;
}

function syncBattlefield(): void {
  const command = createBattlefieldCommand();
  latestBattlefieldCommand = command;

  if (!command) {
    clearBattlePresentationWatchdog();
    return;
  }

  if (command.type === "battle" && !uiState.battleFinished) {
    ensureBattlePresentationWatchdog(command.key);
  } else {
    clearBattlePresentationWatchdog();
  }

  if (FORCE_RENDERER_FAILURE || battlefieldPresentationDisabled) {
    showBattlefieldFallback("Анимация боя отключена для проверки. Результат рассчитан, можно продолжить.");
    return;
  }

  if (battlefieldController) {
    applyBattlefieldCommand(command);
    return;
  }

  mountBattlefield();
}

function createBattlefieldCommand(): BattlefieldCommand | undefined {
  if (uiState.mode === "menu" || uiState.mode === "draft") {
    return {
      type: "draft",
      key: `draft:${uiState.run.seed}:${uiState.run.round}:${uiState.run.playerHp}`,
      playerCastleHp: uiState.run.playerHp,
    };
  }

  if (!uiState.lastBattleTimeline) {
    return undefined;
  }

  return {
    type: "battle",
    key: `battle:${uiState.run.seed}:${uiState.lastRound}:${uiState.lastBattleTimeline.events.length}:${uiState.lastBattleTimeline.winner}`,
    timeline: uiState.lastBattleTimeline,
  };
}

function mountBattlefield(): void {
  if (battlefieldMountRequested) {
    return;
  }

  battlefieldMountRequested = true;

  requestAnimationFrame(() => {
    const phaserHost = getScenePhaserHost();
    if (!phaserHost.isConnected) {
      battlefieldMountRequested = false;
      return;
    }

    void import("./rendering/phaserBattleScene")
      .then(({ mountBattlefield }) => {
        battlefieldMountRequested = false;

        if (!phaserHost.isConnected) {
          return;
        }

        battlefieldController = mountBattlefield(phaserHost);

        if (latestBattlefieldCommand) {
          applyBattlefieldCommand(latestBattlefieldCommand);
        }
      })
      .catch((error: unknown) => {
        battlefieldMountRequested = false;
        console.error("Failed to mount Phaser battlefield", error);
        showBattlefieldFallback("Анимация боя недоступна. Результат рассчитан, можно продолжить.");
      });
  });
}

function applyBattlefieldCommand(command: BattlefieldCommand): void {
  if (appliedBattlefieldCommandKey === command.key) {
    return;
  }

  appliedBattlefieldCommandKey = command.key;

  try {
    if (command.type === "draft") {
      battlefieldController?.showDraft({ playerCastleHp: command.playerCastleHp });
      return;
    }

    battlefieldController?.playBattle({
      timeline: command.timeline,
      onFinished: handleBattlefieldFinished,
      onError: handleBattlefieldError,
    });
  } catch (error: unknown) {
    console.error("Failed to apply Phaser battlefield command", error);
    showBattlefieldFallback("Анимация боя прервалась. Результат рассчитан, можно продолжить.");
  }
}

function handleBattlefieldFinished(): void {
  completeBattlePresentation();
}

function handleBattlefieldError(error: unknown): void {
  console.error("Phaser battle presentation failed", error);
  showBattlefieldFallback("Анимация боя прервалась. Результат рассчитан, можно продолжить.");
}

function completeBattlePresentation(notice?: string): void {
  if (uiState.mode !== "battle" && uiState.mode !== "finished") {
    return;
  }

  if (uiState.battleFinished) {
    return;
  }

  clearBattlePresentationWatchdog();

  uiState = {
    ...uiState,
    battleFinished: true,
    battlePresentationNotice: notice,
    selectedLogRound: uiState.lastRound,
  };
  render();
}

function showBattlefieldFallback(message: string): void {
  battlefieldPresentationDisabled = true;
  if (battlefieldController) {
    try {
      battlefieldController.destroy();
    } catch (error: unknown) {
      console.error("Failed to destroy Phaser battlefield after a presentation error", error);
    }
  }

  battlefieldController = undefined;
  battlefieldMountRequested = false;
  appliedBattlefieldCommandKey = undefined;

  const phaserHost = getScenePhaserHost();
  if (phaserHost.isConnected) {
    const placeholder = latestBattlefieldCommand?.type === "battle"
      ? "Результат боя готов."
      : "Поле боя недоступно. Драфт продолжает работать.";
    phaserHost.replaceChildren(createSceneCanvasMessage(placeholder));
  }

  if (latestBattlefieldCommand?.type === "battle" && !uiState.battleFinished) {
    queueMicrotask(() => completeBattlePresentation(message));
  }
}

function ensureBattlePresentationWatchdog(commandKey: string): void {
  if (battlePresentationWatchdogKey === commandKey && battlePresentationWatchdog !== undefined) {
    return;
  }

  clearBattlePresentationWatchdog();
  battlePresentationWatchdogKey = commandKey;
  battlePresentationWatchdog = window.setTimeout(() => {
    if (latestBattlefieldCommand?.type !== "battle" || latestBattlefieldCommand.key !== commandKey) {
      return;
    }

    completeBattlePresentation("Анимация заняла слишком много времени. Результат рассчитан, можно продолжить.");
  }, BATTLE_PRESENTATION_WATCHDOG_MS);
}

function clearBattlePresentationWatchdog(): void {
  if (battlePresentationWatchdog !== undefined) {
    window.clearTimeout(battlePresentationWatchdog);
  }

  battlePresentationWatchdog = undefined;
  battlePresentationWatchdogKey = undefined;
}

function createBattleSummary(log: RoundRecord): HTMLElement {
  const combat = log.combatResult;
  const summary = document.createElement("div");
  summary.className = `battle-summary battle-summary--${combat.winner}`;

  const winner = document.createElement("strong");
  winner.textContent = combat.winner === "player" ? "Victory" : combat.winner === "enemy" ? "Defeat" : "Draw";

  const detail = document.createElement("span");
  detail.textContent = getBattleSummaryDetail(log);

  summary.append(winner, detail, createEventPills(combat));

  return summary;
}

function getBattleSummaryDetail(log: RoundRecord): string {
  const playerHpLoss = Math.max(0, log.playerHpBefore - log.playerHpAfter);
  if (typeof log.enemyHpBefore === "number" && typeof log.enemyHpAfter === "number") {
    const enemyHpLoss = Math.max(0, log.enemyHpBefore - log.enemyHpAfter);

    return `Your HP -${playerHpLoss} | Enemy HP -${enemyHpLoss} | ${log.combatResult.actions} actions`;
  }

  return `HP loss ${log.combatResult.hpLoss} | ${log.combatResult.actions} actions`;
}

function createEventPills(combat: CombatResult): HTMLElement {
  const pills = document.createElement("div");
  pills.className = "event-pills";

  const counts = countEvents(combat);
  Object.entries(counts).forEach(([type, count]) => {
    const pill = document.createElement("span");
    pill.textContent = `${type.replace("unit_", "")} ${count}`;
    pills.append(pill);
  });

  return pills;
}

function createMatchupList(playerSlots: readonly BoardSlot[], enemySlots: readonly BoardSlot[]): HTMLElement {
  const matchup = document.createElement("div");
  matchup.className = "matchup";

  const player = document.createElement("div");
  player.className = "matchup__side";
  player.append(createMatchupTitle("You"), createCompactCards(playerSlots));

  const enemy = document.createElement("div");
  enemy.className = "matchup__side";
  enemy.append(createMatchupTitle("Bot"), createCompactCards(enemySlots));

  matchup.append(player, enemy);

  return matchup;
}

function createMatchupTitle(title: string): HTMLElement {
  const titleEl = document.createElement("h3");
  titleEl.textContent = title;

  return titleEl;
}

function createCompactCards(slots: readonly BoardSlot[]): HTMLElement {
  const list = document.createElement("div");
  list.className = "compact-cards";

  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }

    const card = getCardDefinition(slot.cardId);
    const stats = getCardStatsForUpgrade(card, slot.upgradeLevel);
    const item = document.createElement("div");
    item.className = "compact-card";
    item.textContent = `${card.name}${slot.upgradeLevel ? " ★" : ""} ${stats.attack}/${stats.hp}`;
    list.append(item);
  });

  return list;
}

function getBoardCapacity(): number {
  return getBoardCapacityForRound(uiState.run.round);
}

function getFilledSlotCount(slots = uiState.draftBoardSlots): number {
  return slots.filter((slot) => slot.cardId !== null).length;
}

function getDraftBoardSlot(slotIndex: number): BoardSlot | undefined {
  return uiState.draftBoardSlots.find((slot) => slot.slotIndex === slotIndex);
}

function getSelectedDraftCardId(): CardId | undefined {
  const cardId = uiState.selectedDraftCardId;

  return cardId && getCurrentDraftOption(cardId) ? cardId : undefined;
}

function getUpgradeableBoardSlot(cardId: CardId, slots = uiState.draftBoardSlots): BoardSlot | undefined {
  return slots.find((slot) => slot.cardId === cardId && slot.upgradeLevel === 0);
}

function createEmptyDraftBoardSlot(slotIndex: number): BoardSlot {
  return { slotIndex, cardId: null, upgradeLevel: 0 };
}

function canFightRound(): boolean {
  if (uiState.mode !== "draft" || getFilledSlotCount() === 0 || getSelectedDraftCardId()) {
    return false;
  }

  if (uiState.playMode !== "online") {
    return true;
  }

  return uiState.pvp.status === "connected" &&
    uiState.pvp.match?.phase === "draft" &&
    uiState.pvp.role !== "spectator" &&
    !isCurrentPvpPlayerSubmitted();
}

function getCurrentDraftOption(cardId: CardId): DraftOption | undefined {
  return getCurrentDraftOptions().find((option) => option.cardId === cardId);
}

function applyDraftCardToSlot(
  slots: readonly BoardSlot[],
  cardId: CardId,
  slotIndex: number,
): BoardSlot[] | undefined {
  if (!canDropIntoSlot(slotIndex)) {
    return undefined;
  }

  const nextSlots = cloneBoardSlots(slots);
  const upgradeSlot = getUpgradeableBoardSlot(cardId, nextSlots);
  if (upgradeSlot) {
    upgradeSlot.upgradeLevel = 1;
    return nextSlots;
  }

  if (!canDropCardIntoSlot(cardId, slotIndex)) {
    return undefined;
  }

  const targetSlot = nextSlots.find((slot) => slot.slotIndex === slotIndex);
  if (!targetSlot) {
    return undefined;
  }

  targetSlot.cardId = cardId;
  targetSlot.upgradeLevel = 0;

  return nextSlots;
}

function getCurrentDraftOptions(): DraftOption[] {
  if (uiState.cardPickedThisRound) {
    return [];
  }

  return uiState.run.draftOptions;
}

function canPlaceDraftCard(cardId: CardId): boolean {
  if (uiState.mode !== "draft" || uiState.cardPickedThisRound) {
    return false;
  }

  return getCurrentDraftOptions().some((option) => option.cardId === cardId);
}

function placeDraftCardInSlot(cardId: CardId, slotIndex: number): void {
  if (uiState.mode !== "draft") {
    return;
  }

  const draftOption = getCurrentDraftOption(cardId);
  if (!draftOption || !canApplyDraftCardAtSlot(cardId, slotIndex)) {
    return;
  }

  const draftBoardSlots = applyDraftCardToSlot(uiState.draftBoardSlots, cardId, slotIndex);
  if (!draftBoardSlots) {
    return;
  }

  uiState = {
    ...uiState,
    draftBoardSlots,
    cardPickedThisRound: true,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
  };
  render();
}

function handleDraftCardClick(cardId: CardId): void {
  if (suppressNextCardClick) {
    suppressNextCardClick = false;
    return;
  }

  if (!canPlaceDraftCard(cardId)) {
    return;
  }

  uiState = {
    ...uiState,
    selectedDraftCardId: cardId,
    selectedCardInfoId: undefined,
  };
  render();
}

function handleFieldSlotClick(slotIndex: number, cardId?: CardId): void {
  if (suppressNextCardClick) {
    suppressNextCardClick = false;
    return;
  }

  const selectedDraftCardId = getSelectedDraftCardId();
  if (selectedDraftCardId) {
    if (canApplyDraftCardAtSlot(selectedDraftCardId, slotIndex)) {
      placeDraftCardInSlot(selectedDraftCardId, slotIndex);
    }
    return;
  }

  if (cardId) {
    openCardInfo(cardId);
  }
}

function cancelDraftCardSelection(): void {
  uiState = {
    ...uiState,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
  };
  render();
}

function openCardInfo(cardId: CardId): void {
  if (!getCurrentDraftOption(cardId) && !hasBoardCard(cardId)) {
    return;
  }

  uiState = {
    ...uiState,
    selectedCardInfoId: cardId,
  };
  render();
}

function closeCardInfo(): void {
  uiState = {
    ...uiState,
    selectedCardInfoId: undefined,
  };
  render();
}

function hasBoardCard(cardId: CardId): boolean {
  return uiState.draftBoardSlots.some((slot) => slot.cardId === cardId);
}

function rerollCurrentDraftCards(): void {
  if (uiState.mode !== "draft" || uiState.cardPickedThisRound || !canRerollDraftCards(uiState.run)) {
    return;
  }

  uiState = {
    ...uiState,
    run: rerollDraftCards(uiState.run),
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
  };
  render();
}

function getPointerDragGhostTransform(clientX: number, clientY: number, isTouchDrag: boolean): string {
  const anchorTransform = isTouchDrag ? "translate(-50%, 0)" : "translate(-50%, -50%)";
  return `translate(${clientX}px, ${clientY}px) ${anchorTransform}`;
}

function getPointerDragDropPoint(
  clientX: number,
  clientY: number,
  isTouchDrag: boolean,
  touchFootOffsetY = 0,
): ClientPoint {
  if (!isTouchDrag) {
    return { clientX, clientY };
  }

  return {
    clientX,
    clientY: clientY + touchFootOffsetY,
  };
}

function startPointerDraftDrag(cardId: CardId, event: PointerEvent): void {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (!canPlaceDraftCard(cardId)) {
    return;
  }

  activePointerDrag?.cleanup();
  const startX = event.clientX;
  const startY = event.clientY;
  const isTouchDrag = event.pointerType === "touch";
  let dragging = false;
  let ghost: HTMLElement | undefined;
  let slotHitTargets: FieldSlotHitTarget[] = [];
  let touchFootOffsetY = 0;

  const moveGhost = (clientX: number, clientY: number): void => {
    ghost?.style.setProperty("transform", getPointerDragGhostTransform(clientX, clientY, isTouchDrag));
  };

  const startDragging = (clientX: number, clientY: number): void => {
    if (dragging) {
      return;
    }

    dragging = true;
    suppressNextCardClick = true;
    ghost = createDraftUnitDragGhost(cardId);
    document.body.append(ghost);
    touchFootOffsetY = getTouchDragFootOffsetY(ghost, isTouchDrag);
    setDraftDragging(true);
    slotHitTargets = createFieldSlotHitTargets(isTouchDrag);
    moveGhost(clientX, clientY);
  };

  let handleMove = (_moveEvent: PointerEvent): void => undefined;
  let handleUp = (_upEvent: PointerEvent): void => undefined;
  let handleCancel = (_cancelEvent: PointerEvent): void => undefined;

  const cleanup = (): void => {
    document.removeEventListener("pointermove", handleMove);
    document.removeEventListener("pointerup", handleUp);
    document.removeEventListener("pointercancel", handleCancel);
    if (dragging) {
      window.setTimeout(() => {
        suppressNextCardClick = false;
      }, 150);
    }
    setDraftDragging(false);
    setFieldSlotDropTarget(undefined);
    slotHitTargets = [];
    ghost?.remove();
    activePointerDrag = undefined;
  };

  handleMove = (moveEvent: PointerEvent): void => {
    if (moveEvent.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
    if (!dragging && distance < POINTER_DRAG_START_DISTANCE) {
      return;
    }

    moveEvent.preventDefault();
    startDragging(moveEvent.clientX, moveEvent.clientY);
    moveGhost(moveEvent.clientX, moveEvent.clientY);
    const dropPoint = getPointerDragDropPoint(moveEvent.clientX, moveEvent.clientY, isTouchDrag, touchFootOffsetY);
    const slotIndex = getFieldSlotIndexAtPoint(dropPoint.clientX, dropPoint.clientY, slotHitTargets);
    setFieldSlotDropTarget(slotIndex, canApplyDraftCardAtSlot(cardId, slotIndex), slotHitTargets);
  };

  handleUp = (upEvent: PointerEvent): void => {
    if (upEvent.pointerId !== event.pointerId) {
      return;
    }

    if (!dragging) {
      cleanup();
      return;
    }

    upEvent.preventDefault();
    moveGhost(upEvent.clientX, upEvent.clientY);
    const dropPoint = getPointerDragDropPoint(upEvent.clientX, upEvent.clientY, isTouchDrag, touchFootOffsetY);
    const slotIndex = getFieldSlotIndexAtPoint(dropPoint.clientX, dropPoint.clientY, slotHitTargets);
    cleanup();

    if (slotIndex !== undefined) {
      placeDraftCardInSlot(cardId, slotIndex);
    }
  };

  handleCancel = (cancelEvent: PointerEvent): void => {
    if (cancelEvent.pointerId === event.pointerId) {
      cleanup();
    }
  };

  activePointerDrag = { cleanup };
  document.addEventListener("pointermove", handleMove, { passive: false });
  document.addEventListener("pointerup", handleUp, { passive: false });
  document.addEventListener("pointercancel", handleCancel);
}

function moveBoardSlotUnit(fromSlotIndex: number, toSlotIndex: number): void {
  if (uiState.mode !== "draft" || fromSlotIndex === toSlotIndex || !canDropIntoSlot(toSlotIndex)) {
    return;
  }

  const sourceSlot = getDraftBoardSlot(fromSlotIndex);
  if (!sourceSlot?.cardId) {
    return;
  }

  const draftBoardSlots = cloneBoardSlots(uiState.draftBoardSlots);
  const source = draftBoardSlots.find((slot) => slot.slotIndex === fromSlotIndex);
  const target = draftBoardSlots.find((slot) => slot.slotIndex === toSlotIndex);
  if (!source || !target || !source.cardId) {
    return;
  }

  if (!canSwapBoardSlots(source, target)) {
    return;
  }

  const sourceCardId = source.cardId;
  const sourceUpgradeLevel = source.upgradeLevel;
  source.cardId = target.cardId;
  source.upgradeLevel = target.cardId ? target.upgradeLevel : 0;
  target.cardId = sourceCardId;
  target.upgradeLevel = sourceUpgradeLevel;

  uiState = {
    ...uiState,
    draftBoardSlots,
    selectedCardInfoId: undefined,
  };
  render();
}

function startPointerFieldUnitDrag(fromSlotIndex: number, source: HTMLElement, event: PointerEvent): void {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (uiState.mode !== "draft" || !getDraftBoardSlot(fromSlotIndex)?.cardId) {
    return;
  }

  activePointerDrag?.cleanup();
  const startX = event.clientX;
  const startY = event.clientY;
  const isTouchDrag = event.pointerType === "touch";
  let dragging = false;
  let ghost: HTMLElement | undefined;
  let slotHitTargets: FieldSlotHitTarget[] = [];
  let touchFootOffsetY = 0;

  const moveGhost = (clientX: number, clientY: number): void => {
    ghost?.style.setProperty("transform", getPointerDragGhostTransform(clientX, clientY, isTouchDrag));
  };

  const startDragging = (clientX: number, clientY: number): void => {
    if (dragging) {
      return;
    }

    dragging = true;
    suppressNextCardClick = true;
    ghost = source.cloneNode(true) as HTMLElement;
    ghost.classList.add("field-unit--drag-ghost");
    document.body.append(ghost);
    touchFootOffsetY = getTouchDragFootOffsetY(ghost, isTouchDrag);
    setDraftDragging(true);
    slotHitTargets = createFieldSlotHitTargets(isTouchDrag);
    moveGhost(clientX, clientY);
  };

  let handleMove = (_moveEvent: PointerEvent): void => undefined;
  let handleUp = (_upEvent: PointerEvent): void => undefined;
  let handleCancel = (_cancelEvent: PointerEvent): void => undefined;

  const cleanup = (): void => {
    document.removeEventListener("pointermove", handleMove);
    document.removeEventListener("pointerup", handleUp);
    document.removeEventListener("pointercancel", handleCancel);
    if (dragging) {
      window.setTimeout(() => {
        suppressNextCardClick = false;
      }, 150);
    }
    setDraftDragging(false);
    setFieldSlotDropTarget(undefined);
    slotHitTargets = [];
    ghost?.remove();
    activePointerDrag = undefined;
  };

  handleMove = (moveEvent: PointerEvent): void => {
    if (moveEvent.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
    if (!dragging && distance < POINTER_DRAG_START_DISTANCE) {
      return;
    }

    moveEvent.preventDefault();
    startDragging(moveEvent.clientX, moveEvent.clientY);
    moveGhost(moveEvent.clientX, moveEvent.clientY);
    const dropPoint = getPointerDragDropPoint(moveEvent.clientX, moveEvent.clientY, isTouchDrag, touchFootOffsetY);
    const slotIndex = getFieldSlotIndexAtPoint(dropPoint.clientX, dropPoint.clientY, slotHitTargets);
    setFieldSlotDropTarget(slotIndex, canMoveBoardSlotUnit(fromSlotIndex, slotIndex), slotHitTargets);
  };

  handleUp = (upEvent: PointerEvent): void => {
    if (upEvent.pointerId !== event.pointerId) {
      return;
    }

    if (!dragging) {
      cleanup();
      return;
    }

    upEvent.preventDefault();
    moveGhost(upEvent.clientX, upEvent.clientY);
    const dropPoint = getPointerDragDropPoint(upEvent.clientX, upEvent.clientY, isTouchDrag, touchFootOffsetY);
    const slotIndex = getFieldSlotIndexAtPoint(dropPoint.clientX, dropPoint.clientY, slotHitTargets);
    cleanup();

    if (slotIndex !== undefined) {
      moveBoardSlotUnit(fromSlotIndex, slotIndex);
    }
  };

  handleCancel = (cancelEvent: PointerEvent): void => {
    if (cancelEvent.pointerId === event.pointerId) {
      cleanup();
    }
  };

  activePointerDrag = { cleanup };
  document.addEventListener("pointermove", handleMove, { passive: false });
  document.addEventListener("pointerup", handleUp, { passive: false });
  document.addEventListener("pointercancel", handleCancel);
}

function getTouchDragFootOffsetY(ghost: HTMLElement, isTouchDrag: boolean): number {
  if (!isTouchDrag) {
    return 0;
  }

  return Math.max(0, ghost.getBoundingClientRect().height - DRAG_GHOST_FOOT_HIT_INSET);
}

function createFieldSlotHitTargets(isTouchDrag = false): FieldSlotHitTarget[] {
  const hitPadding = isTouchDrag ? FIELD_SLOT_TOUCH_HIT_PADDING : FIELD_SLOT_HIT_PADDING;
  const targets: FieldSlotHitTarget[] = [];

  document.querySelectorAll<HTMLElement>("[data-field-slot-index]").forEach((fieldSlot) => {
    const slotIndex = Number(fieldSlot.dataset.fieldSlotIndex);
    if (!canDropIntoSlot(slotIndex)) {
      return;
    }

    const rect = fieldSlot.getBoundingClientRect();
    targets.push({
      slotIndex,
      element: fieldSlot,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      hitLeft: rect.left - hitPadding,
      hitTop: rect.top - hitPadding,
      hitRight: rect.right + hitPadding,
      hitBottom: rect.bottom + hitPadding,
    });
  });

  return targets;
}

function getFieldSlotIndexAtPoint(
  clientX: number,
  clientY: number,
  targets: readonly FieldSlotHitTarget[],
): number | undefined {
  const exactTarget = targets.find((target) => isPointInsideFieldSlotHitTarget(clientX, clientY, target, false));
  if (exactTarget) {
    return exactTarget.slotIndex;
  }

  return targets.find((target) => isPointInsideFieldSlotHitTarget(clientX, clientY, target, true))?.slotIndex;
}

function isPointInsideFieldSlotHitTarget(
  clientX: number,
  clientY: number,
  target: FieldSlotHitTarget,
  useHitPadding: boolean,
): boolean {
  const left = useHitPadding ? target.hitLeft : target.left;
  const top = useHitPadding ? target.hitTop : target.top;
  const right = useHitPadding ? target.hitRight : target.right;
  const bottom = useHitPadding ? target.hitBottom : target.bottom;

  return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
}

function canDropIntoSlot(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < BOARD_SLOT_COUNT;
}

function canDropCardIntoSlot(cardId: CardId, slotIndex: number | undefined): boolean {
  return slotIndex !== undefined && canDropIntoSlot(slotIndex) && isCardAllowedInSlot(cardId, slotIndex);
}

function canApplyDraftCardAtSlot(cardId: CardId, slotIndex: number | undefined): boolean {
  if (slotIndex === undefined || !canDropIntoSlot(slotIndex)) {
    return false;
  }

  return Boolean(getUpgradeableBoardSlot(cardId)) || canDropCardIntoSlot(cardId, slotIndex);
}

function canMoveBoardSlotUnit(fromSlotIndex: number, toSlotIndex: number | undefined): boolean {
  if (toSlotIndex === undefined || fromSlotIndex === toSlotIndex || !canDropIntoSlot(toSlotIndex)) {
    return false;
  }

  const source = getDraftBoardSlot(fromSlotIndex);
  if (!source?.cardId) {
    return false;
  }

  const target = getDraftBoardSlot(toSlotIndex) ?? createEmptyDraftBoardSlot(toSlotIndex);

  return canSwapBoardSlots(source, target);
}

function canSwapBoardSlots(source: BoardSlot, target: BoardSlot): boolean {
  if (!source.cardId || !isCardAllowedInSlot(source.cardId, target.slotIndex)) {
    return false;
  }

  return !target.cardId || isCardAllowedInSlot(target.cardId, source.slotIndex);
}

function setFieldSlotDropTarget(
  slotIndex: number | undefined,
  isValid = true,
  targets: readonly FieldSlotHitTarget[] = [],
): void {
  const nextSlotIndex = slotIndex !== undefined && canDropIntoSlot(slotIndex) ? slotIndex : undefined;
  const nextIsValid = nextSlotIndex === undefined ? true : isValid;
  if (activeFieldSlotDropTarget.slotIndex === nextSlotIndex && activeFieldSlotDropTarget.isValid === nextIsValid) {
    return;
  }

  activeFieldSlotDropTarget.element?.classList.remove("field-slot--drop-target", "field-slot--drop-invalid");
  activeFieldSlotDropTarget = { isValid: true };

  if (nextSlotIndex === undefined) {
    return;
  }

  const element =
    targets.find((target) => target.slotIndex === nextSlotIndex)?.element ??
    document.querySelector<HTMLElement>(`[data-field-slot-index="${nextSlotIndex}"]`) ??
    undefined;

  if (!element) {
    return;
  }

  element.classList.add(nextIsValid ? "field-slot--drop-target" : "field-slot--drop-invalid");
  activeFieldSlotDropTarget = { slotIndex: nextSlotIndex, isValid: nextIsValid, element };
}

function setDraftDragging(isDragging: boolean): void {
  stageElement?.classList.toggle("stage--draft-dragging", isDragging);
}

function fightRound(): void {
  if (!canFightRound()) {
    return;
  }

  if (uiState.playMode === "online") {
    submitPvpBoard();
    return;
  }

  if (!uiState.cardPickedThisRound && !window.confirm("You can still pick one card this round. Fight anyway?")) {
    return;
  }

  const playedRound = uiState.run.round;
  const combatReadyRun = chooseDraftCards(uiState.run, uiState.draftBoardSlots);
  const nextRun = resolveRound(combatReadyRun);
  const lastRoundRecord = getLastRoundRecord(nextRun);
  const lastBattleTimeline = lastRoundRecord
    ? createBattleTimeline({
        playerSlots: lastRoundRecord.playerSlots,
        enemySlots: lastRoundRecord.enemySlots,
        combat: lastRoundRecord.combatResult,
        playerCastleHpBefore: lastRoundRecord.playerHpBefore,
        playerCastleHpAfter: lastRoundRecord.playerHpAfter,
      })
    : undefined;

  uiState = {
    ...uiState,
    run: nextRun,
    mode: nextRun.status === "finished" ? "finished" : "battle",
    draftBoardSlots: cloneBoardSlots(nextRun.boardSlots),
    cardPickedThisRound: false,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: playedRound,
    lastBattleTimeline,
  };
  render();
}

function getLastRoundRecord(run: RunState): RoundRecord | undefined {
  return run.roundHistory[run.roundHistory.length - 1];
}

function countEvents(combat: CombatResult): Record<string, number> {
  const counts: Record<string, number> = {};

  combat.events.forEach((event) => {
    if (
      !["unit_attacked", "unit_blocked", "unit_damaged", "unit_healed", "unit_died", "synergy_applied"].includes(
        event.type,
      )
    ) {
      return;
    }

    counts[event.type] = (counts[event.type] ?? 0) + 1;
  });

  return counts;
}

function setPvpPanelOpen(panelOpen: boolean): void {
  uiState = {
    ...uiState,
    pvp: {
      ...uiState.pvp,
      panelOpen,
    },
  };
  render();
}

function updatePvpState(pvp: Partial<PvpState>): void {
  uiState = {
    ...uiState,
    pvp: {
      ...uiState.pvp,
      ...pvp,
    },
  };
  render();
}

function connectPvpRoom(rawRoomId: string): void {
  const roomId = normalizePvpRoomId(rawRoomId);
  if (!roomId) {
    updatePvpState({
      panelOpen: true,
      status: "error",
      error: "Use 3-48 letters or numbers.",
    });
    return;
  }

  closePvpSocket();
  updatePvpState({
    panelOpen: true,
    status: "connecting",
    roomId,
    roomInput: roomId.toUpperCase(),
    peerId: undefined,
    role: undefined,
    connectedPeers: 0,
    players: createEmptyPvpPlayerSlots(),
    match: undefined,
    error: undefined,
  });

  const socket = new WebSocket(getPvpSocketUrl(roomId));
  pvpSocket = socket;
  pvpSocketCloseExpected = false;

  socket.addEventListener("message", handlePvpSocketMessage);
  socket.addEventListener("open", () => {
    if (pvpSocket === socket) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  });
  socket.addEventListener("close", () => {
    if (pvpSocket !== socket) {
      return;
    }

    pvpSocket = undefined;
    if (pvpSocketCloseExpected) {
      pvpSocketCloseExpected = false;
      return;
    }

    updatePvpState({
      status: "error",
      connectedPeers: 0,
      players: createEmptyPvpPlayerSlots(),
      error: "Connection closed.",
    });
  });
  socket.addEventListener("error", () => {
    if (pvpSocket === socket) {
      updatePvpState({
        status: "error",
        error: "Could not connect.",
      });
    }
  });
}

function disconnectPvpRoom(): void {
  closePvpSocket();
  updatePvpState(createInitialPvpState(true));
}

function closePvpSocket(): void {
  if (!pvpSocket) {
    return;
  }

  pvpSocketCloseExpected = true;
  pvpSocket.close(1000, "client_disconnect");
  pvpSocket = undefined;
}

function setPvpReady(ready: boolean): void {
  if (!pvpSocket || pvpSocket.readyState !== WebSocket.OPEN || uiState.pvp.role === "spectator") {
    return;
  }

  pvpSocket.send(JSON.stringify({ type: "set_ready", payload: { ready } }));
}

function submitPvpBoard(): void {
  const match = uiState.pvp.match;
  if (
    !match ||
    match.phase !== "draft" ||
    !pvpSocket ||
    pvpSocket.readyState !== WebSocket.OPEN ||
    uiState.pvp.role === "spectator"
  ) {
    return;
  }

  pvpSocket.send(
    JSON.stringify({
      type: "submit_board",
      payload: {
        matchId: match.matchId,
        round: match.round,
        boardSlots: cloneBoardSlots(uiState.draftBoardSlots),
      },
    }),
  );

  uiState = {
    ...uiState,
    cardPickedThisRound: true,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    pvp: {
      ...uiState.pvp,
      match: markPvpSubmission(match, uiState.pvp.role),
    },
  };
  render();
}

function sendPvpNextRound(): void {
  const match = uiState.pvp.match;
  if (!match || !pvpSocket || pvpSocket.readyState !== WebSocket.OPEN || uiState.pvp.role === "spectator") {
    return;
  }

  pvpSocket.send(
    JSON.stringify({
      type: "next_round",
      payload: {
        matchId: match.matchId,
        round: match.round,
      },
    }),
  );
}

function markPvpSubmission(match: PvpMatchSnapshot, role: PvpPeerRole | undefined): PvpMatchSnapshot {
  if (!isPvpPlayerRole(role)) {
    return match;
  }

  return {
    ...match,
    submissions: mergePvpSubmissions(match.submissions, {
      role,
      submitted: true,
      submittedAt: Date.now(),
    }),
  };
}

function mergePvpSubmissions(
  submissions: readonly PvpSubmissionSnapshot[],
  nextSubmission: PvpSubmissionSnapshot,
): PvpSubmissionSnapshot[] {
  const nextSubmissions = createEmptyPvpSubmissionSnapshots().map(
    (emptySubmission) => submissions.find((submission) => submission.role === emptySubmission.role) ?? emptySubmission,
  );
  const index = nextSubmissions.findIndex((submission) => submission.role === nextSubmission.role);
  if (index >= 0) {
    nextSubmissions[index] = nextSubmission;
  }

  return nextSubmissions;
}

function handlePvpSocketMessage(event: MessageEvent): void {
  if (typeof event.data !== "string") {
    return;
  }

  let message: PvpServerMessage;
  try {
    message = JSON.parse(event.data) as PvpServerMessage;
  } catch {
    updatePvpState({ status: "error", error: "Bad server message." });
    return;
  }

  if (message.type === "error") {
    updatePvpState({ status: "error", error: "Room error." });
    return;
  }

  const snapshot = readPvpRoomSnapshot(message.payload);
  const nextState: Partial<PvpState> = {};
  const isIdentityMessage = message.type === "connected" || message.type === "pong";

  if (isIdentityMessage && typeof message.peerId === "string") {
    nextState.peerId = message.peerId;
  }

  if (isIdentityMessage && isPvpPeerRole(message.role)) {
    nextState.role = message.role;
  }

  if (snapshot) {
    nextState.status = "connected";
    nextState.roomId = snapshot.roomId;
    nextState.roomInput = snapshot.roomId.toUpperCase();
    nextState.connectedPeers = snapshot.connectedPeers;
    nextState.players = snapshot.players;
    nextState.match = snapshot.match;
    nextState.error = undefined;
  } else if (message.type === "pong" && uiState.pvp.status === "connecting") {
    nextState.status = "connected";
    nextState.error = undefined;
  }

  if (Object.keys(nextState).length > 0) {
    applyPvpServerState(nextState, snapshot);
  }
}

function applyPvpServerState(pvpPatch: Partial<PvpState>, snapshot?: PvpRoomSnapshot): void {
  let nextUiState: UiState = {
    ...uiState,
    pvp: {
      ...uiState.pvp,
      ...pvpPatch,
    },
  };

  if (snapshot?.match && nextUiState.playMode === "online") {
    nextUiState = applyPvpMatchSnapshot(nextUiState, snapshot.match);
  }

  uiState = nextUiState;
  render();
}

function applyPvpMatchSnapshot(state: UiState, match: PvpMatchSnapshot): UiState {
  if (match.phase === "battle" && match.combat) {
    return applyPvpBattleSnapshot(state, match);
  }

  return applyPvpDraftSnapshot(state, match);
}

function applyPvpDraftSnapshot(state: UiState, match: PvpMatchSnapshot): UiState {
  const previousMatch = uiState.pvp.match;
  const isNewDraft =
    !previousMatch ||
    previousMatch.matchId !== match.matchId ||
    previousMatch.round !== match.round ||
    previousMatch.phase !== "draft";
  const currentPlayerSubmitted = isPvpPlayerSubmitted(match, state.pvp.role);
  const boardSlots = isNewDraft ? getPvpDraftBoardSlotsForRound(state, match) : state.draftBoardSlots;
  const run = createPvpDraftRun(state, match, boardSlots);

  return {
    ...state,
    run,
    mode: "draft",
    draftBoardSlots: cloneBoardSlots(boardSlots),
    cardPickedThisRound: currentPlayerSubmitted,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: match.round,
    lastBattleTimeline: undefined,
    pvp: {
      ...state.pvp,
      match,
      panelOpen: false,
    },
  };
}

function applyPvpBattleSnapshot(state: UiState, match: PvpMatchSnapshot): UiState {
  if (!match.combat) {
    return state;
  }

  const previousMatch = uiState.pvp.match;
  if (state.mode === "battle" && previousMatch?.matchId === match.matchId && previousMatch.round === match.round) {
    return {
      ...state,
      pvp: {
        ...state.pvp,
        match,
      },
    };
  }

  const perspective = createPvpBattlePerspective(match.combat, state.pvp.role);
  const lastBattleTimeline = createBattleTimeline({
    playerSlots: perspective.playerSlots,
    enemySlots: perspective.enemySlots,
    combat: perspective.combat,
    playerCastleHpBefore: perspective.playerCastleHpBefore,
    playerCastleHpAfter: perspective.playerCastleHpAfter,
    enemyCastleHpBefore: perspective.enemyCastleHpBefore,
    enemyCastleHpAfter: perspective.enemyCastleHpAfter,
  });
  const roundRecord = createPvpRoundRecord(state, match, perspective);
  const nextRun = {
    ...state.run,
    seed: match.seed,
    round: match.round,
    playerHp: perspective.playerCastleHpAfter,
    status: "draft" as const,
    boardSlots: cloneBoardSlots(perspective.playerSlots),
    enemyBoardSlots: cloneBoardSlots(perspective.enemySlots),
    roundHistory: mergePvpRoundRecord(state.run.roundHistory, roundRecord),
  };

  return {
    ...state,
    run: nextRun,
    mode: "battle",
    draftBoardSlots: cloneBoardSlots(perspective.playerSlots),
    cardPickedThisRound: false,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: match.round,
    lastBattleTimeline,
    pvp: {
      ...state.pvp,
      match,
      panelOpen: false,
    },
  };
}

interface PvpBattlePerspective {
  playerSlots: BoardSlot[];
  enemySlots: BoardSlot[];
  combat: CombatResult;
  playerCastleHpBefore: number;
  playerCastleHpAfter: number;
  enemyCastleHpBefore: number;
  enemyCastleHpAfter: number;
}

function createPvpDraftRun(state: UiState, match: PvpMatchSnapshot, boardSlots: readonly BoardSlot[]): RunState {
  const sameMatchRound = state.run.seed === match.seed && state.run.round === match.round;
  const draftRerollCount = sameMatchRound ? state.run.draftRerollCount : 0;

  return {
    ...createRun(match.seed),
    round: match.round,
    playerHp: getPvpPlayerHp(match, state.pvp.role),
    status: "draft",
    draftOptions: createDraftOptions(match.seed, match.round, draftRerollCount),
    draftRerollCount,
    boardSlots: cloneBoardSlots(boardSlots),
    enemyBoardSlots: createEmptyBoardSlots(),
    roundHistory: state.run.seed === match.seed ? state.run.roundHistory : [],
  };
}

function getPvpPlayerHp(match: PvpMatchSnapshot, role: PvpPeerRole | undefined): number {
  if (role === "guest") {
    return match.guestHp;
  }

  return match.hostHp;
}

function isPvpMatchFinished(): boolean {
  const match = uiState.pvp.match;
  if (uiState.playMode !== "online" || !match) {
    return false;
  }

  return match.hostHp <= 0 || match.guestHp <= 0;
}

function getPvpDraftBoardSlotsForRound(state: UiState, match: PvpMatchSnapshot): BoardSlot[] {
  if (state.run.seed !== match.seed) {
    return createEmptyBoardSlots();
  }

  return cloneBoardSlots(state.run.boardSlots);
}

function createPvpBattlePerspective(
  combatSnapshot: PvpCombatSnapshot,
  role: PvpPeerRole | undefined,
): PvpBattlePerspective {
  if (role === "guest") {
    const hpLoss = Math.max(0, combatSnapshot.guestHpBefore - combatSnapshot.guestHpAfter);

    return {
      playerSlots: cloneBoardSlots(combatSnapshot.guestSlots),
      enemySlots: cloneBoardSlots(combatSnapshot.hostSlots),
      combat: mirrorCombatResult(combatSnapshot.combat, hpLoss),
      playerCastleHpBefore: combatSnapshot.guestHpBefore,
      playerCastleHpAfter: combatSnapshot.guestHpAfter,
      enemyCastleHpBefore: combatSnapshot.hostHpBefore,
      enemyCastleHpAfter: combatSnapshot.hostHpAfter,
    };
  }

  return {
    playerSlots: cloneBoardSlots(combatSnapshot.hostSlots),
    enemySlots: cloneBoardSlots(combatSnapshot.guestSlots),
    combat: combatSnapshot.combat,
    playerCastleHpBefore: combatSnapshot.hostHpBefore,
    playerCastleHpAfter: combatSnapshot.hostHpAfter,
    enemyCastleHpBefore: combatSnapshot.guestHpBefore,
    enemyCastleHpAfter: combatSnapshot.guestHpAfter,
  };
}

function createPvpRoundRecord(
  state: UiState,
  match: PvpMatchSnapshot,
  perspective: PvpBattlePerspective,
): RoundRecord {
  return {
    round: match.round,
    playerHpBefore: perspective.playerCastleHpBefore,
    playerHpAfter: perspective.playerCastleHpAfter,
    enemyHpBefore: perspective.enemyCastleHpBefore,
    enemyHpAfter: perspective.enemyCastleHpAfter,
    draftOptions: state.run.draftOptions.map((option) => ({ ...option })),
    draftRerollCount: state.run.draftRerollCount,
    playerSlots: cloneBoardSlots(perspective.playerSlots),
    enemySlots: cloneBoardSlots(perspective.enemySlots),
    combatResult: perspective.combat,
  };
}

function mergePvpRoundRecord(roundHistory: readonly RoundRecord[], record: RoundRecord): RoundRecord[] {
  return [...roundHistory.filter((roundRecord) => roundRecord.round !== record.round), record];
}

function mirrorCombatResult(combat: CombatResult, hpLoss: number): CombatResult {
  return {
    winner: mirrorCombatWinner(combat.winner),
    hpLoss,
    actions: combat.actions,
    events: combat.events.map((event) => mirrorCombatEvent(event, hpLoss)),
    survivingPlayerUnits: combat.survivingEnemyUnits.map(mirrorCombatUnit),
    survivingEnemyUnits: combat.survivingPlayerUnits.map(mirrorCombatUnit),
  };
}

function mirrorCombatEvent(event: CombatEvent, hpLoss: number): CombatEvent {
  if (event.type === "combat_started") {
    return {
      ...event,
      playerUnits: event.enemyUnits.map(mirrorUnitId),
      enemyUnits: event.playerUnits.map(mirrorUnitId),
    };
  }

  if (event.type === "synergy_applied") {
    return {
      ...event,
      owner: mirrorOwner(event.owner),
      unitIds: event.unitIds.map(mirrorUnitId),
    };
  }

  if (event.type === "unit_spawned") {
    return {
      ...event,
      unit: mirrorCombatUnit(event.unit),
    };
  }

  if (event.type === "unit_buffed") {
    return {
      ...event,
      unitId: mirrorUnitId(event.unitId),
      source: mirrorUnitSource(event.source),
    };
  }

  if (event.type === "unit_attacked") {
    return {
      ...event,
      attackerId: mirrorUnitId(event.attackerId),
      targetId: mirrorUnitId(event.targetId),
    };
  }

  if (event.type === "unit_blocked") {
    return {
      ...event,
      unitId: mirrorUnitId(event.unitId),
      attackerId: mirrorUnitId(event.attackerId),
    };
  }

  if (event.type === "unit_damaged") {
    return {
      ...event,
      unitId: mirrorUnitId(event.unitId),
    };
  }

  if (event.type === "unit_healed") {
    return {
      ...event,
      unitId: mirrorUnitId(event.unitId),
      source: mirrorUnitSource(event.source),
    };
  }

  if (event.type === "unit_died") {
    return {
      ...event,
      unitId: mirrorUnitId(event.unitId),
      killerId: event.killerId ? mirrorUnitId(event.killerId) : undefined,
    };
  }

  return {
    ...event,
    winner: mirrorCombatWinner(event.winner),
    hpLoss,
  };
}

function mirrorCombatUnit(unit: CombatUnit): CombatUnit {
  return {
    ...unit,
    owner: mirrorOwner(unit.owner),
    instanceId: mirrorUnitId(unit.instanceId),
    summonedBy: unit.summonedBy ? mirrorUnitId(unit.summonedBy) : undefined,
  };
}

function mirrorOwner(owner: Owner): Owner {
  return owner === "player" ? "enemy" : "player";
}

function mirrorCombatWinner(winner: CombatWinner): CombatWinner {
  if (winner === "player") {
    return "enemy";
  }

  if (winner === "enemy") {
    return "player";
  }

  return "draw";
}

function mirrorUnitId(unitId: string): string {
  if (unitId.startsWith("player-")) {
    return `enemy-${unitId.slice("player-".length)}`;
  }

  if (unitId.startsWith("enemy-")) {
    return `player-${unitId.slice("enemy-".length)}`;
  }

  return unitId;
}

function mirrorUnitSource(source: string): string {
  return source.startsWith("player-") || source.startsWith("enemy-") ? mirrorUnitId(source) : source;
}

function getPvpSocketUrl(roomId: string): string {
  return `${PVP_WORKER_ORIGIN.replace(/^http/, "ws")}/api/pvp/rooms/${roomId}/socket`;
}

function normalizePvpRoomId(roomId: string): string | undefined {
  const normalized = roomId.trim().toLowerCase();
  return PVP_ROOM_ID_PATTERN.test(normalized) ? normalized : undefined;
}

function createPvpRoomCode(): string {
  const bytes = new Uint8Array(PVP_ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  return [...bytes]
    .map((byte) => PVP_ROOM_CODE_ALPHABET[byte % PVP_ROOM_CODE_ALPHABET.length])
    .join("")
    .toLowerCase();
}

function readPvpRoomSnapshot(payload: unknown): PvpRoomSnapshot | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const snapshot = payload as Partial<PvpRoomSnapshot>;
  if (
    typeof snapshot.roomId !== "string" ||
    typeof snapshot.connectedPeers !== "number" ||
    !Array.isArray(snapshot.players)
  ) {
    return undefined;
  }

  const players = snapshot.players.map(readPvpPlayerSlot).filter((player): player is PvpPlayerSlot => Boolean(player));

  return {
    roomId: snapshot.roomId,
    status: snapshot.status === "ready" ? "ready" : "waiting",
    connectedPeers: snapshot.connectedPeers,
    players: mergePvpPlayerSlots(players),
    match: readPvpMatchSnapshot(snapshot.match),
    serverNow: typeof snapshot.serverNow === "number" ? snapshot.serverNow : Date.now(),
  };
}

function readPvpMatchSnapshot(match: unknown): PvpMatchSnapshot | undefined {
  if (!match || typeof match !== "object") {
    return undefined;
  }

  const snapshot = match as Partial<PvpMatchSnapshot>;
  if (
    typeof snapshot.matchId !== "string" ||
    typeof snapshot.seed !== "string" ||
    typeof snapshot.round !== "number" ||
    !isPvpMatchPhase(snapshot.phase)
  ) {
    return undefined;
  }

  const combat = readPvpCombatSnapshot(snapshot.combat);
  if (snapshot.phase === "battle" && !combat) {
    return undefined;
  }

  return {
    matchId: snapshot.matchId,
    seed: snapshot.seed,
    round: snapshot.round,
    phase: snapshot.phase,
    hostHp: readPvpHp(snapshot.hostHp),
    guestHp: readPvpHp(snapshot.guestHp),
    submissions: readPvpSubmissionSnapshots(snapshot.submissions),
    combat,
    updatedAt: typeof snapshot.updatedAt === "number" ? snapshot.updatedAt : Date.now(),
  };
}

function readPvpHp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(PLAYER_STARTING_HP, value))
    : PLAYER_STARTING_HP;
}

function readPvpSubmissionSnapshots(value: unknown): PvpSubmissionSnapshot[] {
  if (!Array.isArray(value)) {
    return createEmptyPvpSubmissionSnapshots();
  }

  const submissions = value
    .map(readPvpSubmissionSnapshot)
    .filter((submission): submission is PvpSubmissionSnapshot => Boolean(submission));

  return mergePvpSubmissionSlots(submissions);
}

function readPvpSubmissionSnapshot(value: unknown): PvpSubmissionSnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const submission = value as Partial<PvpSubmissionSnapshot>;
  if (!isPvpPlayerRole(submission.role)) {
    return undefined;
  }

  return {
    role: submission.role,
    submitted: submission.submitted === true,
    submittedAt: typeof submission.submittedAt === "number" ? submission.submittedAt : null,
  };
}

function readPvpCombatSnapshot(value: unknown): PvpCombatSnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const combat = value as Partial<PvpCombatSnapshot>;
  if (
    typeof combat.round !== "number" ||
    !Array.isArray(combat.hostSlots) ||
    !Array.isArray(combat.guestSlots) ||
    !combat.combat
  ) {
    return undefined;
  }

  return {
    round: combat.round,
    hostSlots: cloneBoardSlots(combat.hostSlots),
    guestSlots: cloneBoardSlots(combat.guestSlots),
    combat: combat.combat,
    hostHpBefore: typeof combat.hostHpBefore === "number" ? combat.hostHpBefore : PLAYER_STARTING_HP,
    hostHpAfter: typeof combat.hostHpAfter === "number" ? combat.hostHpAfter : PLAYER_STARTING_HP,
    guestHpBefore: typeof combat.guestHpBefore === "number" ? combat.guestHpBefore : PLAYER_STARTING_HP,
    guestHpAfter: typeof combat.guestHpAfter === "number" ? combat.guestHpAfter : PLAYER_STARTING_HP,
  };
}

function readPvpPlayerSlot(player: unknown): PvpPlayerSlot | undefined {
  if (!player || typeof player !== "object") {
    return undefined;
  }

  const slot = player as Partial<PvpPlayerSlot>;
  if (!isPvpPlayerRole(slot.role)) {
    return undefined;
  }

  return {
    role: slot.role,
    peerId: typeof slot.peerId === "string" ? slot.peerId : null,
    connected: slot.connected === true,
    ready: slot.ready === true,
    joinedAt: typeof slot.joinedAt === "number" ? slot.joinedAt : null,
  };
}

function mergePvpPlayerSlots(players: PvpPlayerSlot[]): PvpPlayerSlot[] {
  return createEmptyPvpPlayerSlots().map((emptySlot) => players.find((player) => player.role === emptySlot.role) ?? emptySlot);
}

function createEmptyPvpSubmissionSnapshots(): PvpSubmissionSnapshot[] {
  return [
    { role: "host", submitted: false, submittedAt: null },
    { role: "guest", submitted: false, submittedAt: null },
  ];
}

function mergePvpSubmissionSlots(submissions: PvpSubmissionSnapshot[]): PvpSubmissionSnapshot[] {
  return createEmptyPvpSubmissionSnapshots().map(
    (emptySubmission) => submissions.find((submission) => submission.role === emptySubmission.role) ?? emptySubmission,
  );
}

function isPvpPlayerRole(role: unknown): role is PvpPlayerRole {
  return role === "host" || role === "guest";
}

function isPvpPeerRole(role: unknown): role is PvpPeerRole {
  return isPvpPlayerRole(role) || role === "spectator";
}

function isPvpMatchPhase(phase: unknown): phase is PvpMatchPhase {
  return phase === "draft" || phase === "battle";
}

function getCurrentPvpPlayer(): PvpPlayerSlot | undefined {
  if (!uiState.pvp.peerId) {
    return undefined;
  }

  return uiState.pvp.players.find((player) => player.peerId === uiState.pvp.peerId);
}

function isCurrentPvpPlayerSubmitted(): boolean {
  return isPvpPlayerSubmitted(uiState.pvp.match, uiState.pvp.role);
}

function isPvpPlayerSubmitted(match: PvpMatchSnapshot | undefined, role: PvpPeerRole | undefined): boolean {
  return isPvpPlayerRole(role) && match?.submissions.some((submission) => submission.role === role && submission.submitted) === true;
}

function getPvpStatusLabel(): string {
  if (uiState.pvp.status === "connecting") {
    return "Connecting";
  }

  if (uiState.pvp.status === "connected") {
    return uiState.pvp.role === "spectator" ? "Spectator" : "Online";
  }

  if (uiState.pvp.status === "error") {
    return "Offline";
  }

  return "Idle";
}

function createSeed(): string {
  return `local-${Date.now().toString(36).slice(-6)}`;
}
