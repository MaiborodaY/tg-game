import "./styles.css";
import type { BattleAbilityCalloutLabels, BattlefieldController } from "./rendering/phaserBattleScene";
import { prefersReducedBattleMotion } from "./rendering/motionPreference";
import {
  BOARD_SLOT_COUNT,
  canRerollDraftCards,
  cloneBoardSlots,
  createBattleTimeline,
  createEmptyBoardSlots,
  getBoardCapacityForRound,
  getCardDefinition,
  getCardStatsForUpgrade,
  chooseDraftCards,
  createRun,
  rerollDraftCards,
  resolveCombat,
  resolveRound,
  isCardAllowedInSlot,
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type BotDifficulty,
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
  type UnitStats,
} from "./game";
import {
  getBoardSynergyProgress,
  getBoardUnitInspection,
  getDraftOptionBoardStatus,
  getDraftOptionSynergyPresentation,
  type BoardUnitInspection,
  type DraftOptionBoardStatus,
  type DraftTagSynergyForecast,
} from "./draftPresentation";
import {
  createGameHudSnapshot,
  createRoundSummarySnapshot,
  loadBattlePlaybackSpeed,
  saveBattlePlaybackSpeed,
} from "./battleUi";
import {
  createCompendiumPresentation,
  type CompendiumCardPresentation,
} from "./compendiumPresentation";
import { createRoundInsights } from "./roundInsights";
import { createTodayDailyChallenge, type RunSource } from "./dailyChallenge";
import {
  SOLO_RUN_HISTORY_LIMIT,
  flushQueuedSoloRunSummaries,
  loadSoloRunHistory,
  queueSoloRunSummary,
  recordSoloRunSummary,
  type RunHistoryStorageLike,
  type SoloRunSummary,
} from "./runHistory";
import { shareResult } from "./resultSharing";
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
  findNearestSlotHitTarget,
  resolveFieldSlotIndexForClick,
  type SlotHitTargetGeometry,
} from "./fieldHitTesting";
import {
  getAbilityIconPath,
  getCardArchetypeIconPath,
  type CardArchetype,
} from "./cardAssetContract";
import { getUnitAsset, getUnitCardAssetPath } from "./unitAssets";
import {
  SUPPORTED_LOCALES,
  formatMessage,
  getArchetypeLabel,
  getCombatEventLabel,
  getLocalizedCard,
  getRarityLabel,
  getTagLabel,
  getUiCopy,
  hasSeenHowTo,
  markHowToSeen,
  readStoredLocale,
  resolveInitialLocale,
  saveLocale,
  type KeyValueStorage,
  type LocalizedCombatEvent,
  type SupportedLocale,
  type UiCopy,
} from "./i18n";
import {
  clearSoloRunSnapshot,
  completeSoloRunSession,
  createSoloRunSession,
  loadSoloRunSnapshot,
  saveSoloRunSnapshot,
  SOLO_RUN_RULESET_VERSION,
  type SoloRunCheckpoint,
  type SoloRunSession,
  type SoloRunSnapshot,
  type SoloRunStorage,
} from "./soloPersistence";
import { isSamePresentedPvpBattle } from "./pvpPresentation";
import {
  applyDraftPlacement,
  classifyDraftPlacement,
  type DraftPlacementClassification,
} from "./game/placement";
import { setupTelegramMiniApp } from "./telegram";
import {
  PvpRequestError,
  clearPvpSession,
  createPvpRoom,
  createPvpSocketUrl,
  joinPvpRoom,
  loadPvpSession,
  normalizePvpApiOrigin,
  normalizePvpRoomId,
  reconnectPvpRoom,
  savePvpSession,
  type PvpBootstrapResponse,
  type PvpSeat,
  type PvpSessionCredentials,
  type PvpSessionStorage,
} from "./pvpSession";

type ScreenMode = "menu" | "draft" | "battle" | "finished";
type PlayMode = "solo" | "online";
type CardRarity = "common" | "uncommon" | "rare";
type PvpConnectionStatus = "idle" | "connecting" | "connected" | "error";
type PvpPlayerRole = PvpSeat;
type BattlefieldCommand =
  | { type: "draft"; key: string; playerCastleHp: number; enemyCastleHp: number }
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
  selectedCardInfoSlotIndex?: number;
  selectedEnemyCardInfoSlotIndex?: number;
  battleFinished: boolean;
  battlePresentationNotice?: string;
  logsOpen: boolean;
  selectedLogRound?: number;
  lastRound: number;
  lastBattleTimeline?: BattleTimeline;
  presentedCastleHp?: Record<Owner, number>;
  soloSession?: SoloRunSession;
  pvp: PvpState;
}

interface SoloRunStartRequest {
  seed: string;
  botDifficulty: BotDifficulty;
  source: RunSource;
  dailyDateKey: string | null;
}

interface PvpState {
  panelOpen: boolean;
  status: PvpConnectionStatus;
  roomId: string;
  roomInput: string;
  role?: PvpPlayerRole;
  connectedPeers: number;
  players: PvpPlayerSlot[];
  match?: PvpMatchSnapshot;
  error?: string;
}

interface PvpRoomSnapshot {
  roomId: string;
  status: "waiting" | "ready" | "playing" | "finished";
  connectedPeers: number;
  players: PvpPlayerSlot[];
  match?: PvpMatchSnapshot;
  serverNow: number;
}

type PvpMatchPhase = "draft" | "battle" | "finished";

interface PvpMatchSnapshot {
  matchId: string;
  round: number;
  phase: PvpMatchPhase;
  hostHp: number;
  guestHp: number;
  submissions: PvpSubmissionSnapshot[];
  combat?: PvpCombatSnapshot;
  self: PvpSelfMatchSnapshot;
  opponent: PvpOpponentMatchSnapshot;
  outcome?: PvpMatchOutcome;
  updatedAt: number;
}

interface PvpSelfMatchSnapshot {
  role: PvpPlayerRole;
  boardSlots: BoardSlot[];
  draftOptions: DraftOption[];
  draftRerollCount: number;
  pendingBoardSlots?: BoardSlot[];
  pickedCardId?: CardId;
  locked: boolean;
  nextRoundReady: boolean;
  rematchReady: boolean;
}

interface PvpOpponentMatchSnapshot {
  role: PvpPlayerRole;
  locked: boolean;
  nextRoundReady: boolean;
  rematchReady: boolean;
  boardSlots?: BoardSlot[];
}

interface PvpMatchOutcome {
  winner: PvpPlayerRole | "draw";
  reason: "castle" | "round_limit" | "forfeit" | "disconnect" | "expired";
  finishedAt: number;
  forfeitedRole?: PvpPlayerRole;
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
  claimed: boolean;
  connected: boolean;
  ready: boolean;
}

interface PvpServerMessage {
  type?: string;
  roomId?: string;
  seat?: PvpPlayerRole;
  snapshot?: unknown;
  code?: string;
  message?: string;
}

type PvpClientIntent =
  | { type: "ping" | "leave" }
  | { type: "set_ready"; ready: boolean }
  | { type: "pick"; matchId: string; round: number; cardId: CardId; targetSlotIndex: number; allowReplacement: boolean }
  | { type: "move"; matchId: string; round: number; sourceSlotIndex: number; targetSlotIndex: number }
  | { type: "reroll" | "lock" | "next_ready"; matchId: string; round: number }
  | { type: "forfeit" | "rematch"; matchId: string; round: number };

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing app root.");
}

const appRoot = app;
const telegram = setupTelegramMiniApp();

const preferenceStorage = getPreferenceStorage();
const soloRunStorage = getSoloRunStorage();
const runHistoryStorage = getRunHistoryStorage();
const pvpSessionStorage = getPvpSessionStorage();
const restoredSoloRun = loadSoloRunSnapshot(soloRunStorage);
let soloPersistenceFailureReported = false;
let soloHistoryFailureReported = false;
let activeLocale = resolveInitialLocale(
  readStoredLocale(preferenceStorage),
  telegram.languageCode ?? navigator.language,
);
let howToOpen = !hasSeenHowTo(preferenceStorage);
let compendiumOpen = false;
let runHistoryOpen = false;
flushQueuedSoloRunSummaries(runHistoryStorage);
let soloRunHistory = loadSoloRunHistory(runHistoryStorage);
let battlePlaybackSpeed = loadBattlePlaybackSpeed(preferenceStorage);
document.documentElement.lang = activeLocale;

let uiState: UiState = restoredSoloRun ? createRestoredSoloUiState(restoredSoloRun) : createInitialUiState();
let shellElement: HTMLElement | undefined;
let stageElement: HTMLElement | undefined;
let stageUiElement: HTMLElement | undefined;
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
const FIELD_SLOT_BASE_CENTER_FROM_BOTTOM_RATIO = 31 / 108;
const BATTLE_PRESENTATION_WATCHDOG_MS = 60_000;
const FORCE_RENDERER_FAILURE = new URLSearchParams(window.location.search).get("draftRendererFail") === "1";
const PVP_UI_ENABLED = import.meta.env.VITE_DRAFT_BATTLER_PVP_ENABLED === "true";
const PVP_API_ORIGIN = normalizePvpApiOrigin(import.meta.env.VITE_DRAFT_BATTLER_PVP_ORIGIN);
const PVP_RULESET_VERSION = "draft-battler-pvp-v3";

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
  rect: SlotHitTargetGeometry["rect"];
  hitRect: SlotHitTargetGeometry["hitRect"];
  anchor: SlotHitTargetGeometry["anchor"];
}

interface FieldSlotDropTargetState {
  slotIndex?: number;
  kind?: DraftPlacementClassification["kind"];
  element?: HTMLElement;
}

interface PendingDraftReplacement {
  cardId: CardId;
  slotIndex: number;
}

let activePointerDrag: ActivePointerDrag | undefined;
let activeFieldSlotDropTarget: FieldSlotDropTargetState = {};
let pendingDraftReplacement: PendingDraftReplacement | undefined;
let keyboardMoveSourceSlotIndex: number | undefined;
let draftChoicesCollapsed = false;
let pendingFocusKey: string | undefined;
let suppressNextCardClick = false;
let pvpSocket: WebSocket | undefined;
let pvpSocketCloseExpected = false;
let activePvpSession = loadPvpSession(pvpSessionStorage);
let pvpAutomaticReconnectUsed = false;
let battlePresentationWatchdog: number | undefined;
let battlePresentationWatchdogKey: string | undefined;

if (restoredSoloRun?.checkpoint === "finished") {
  ensureFinishedSoloRunRecorded();
}

render();
telegram.ready();
window.addEventListener("beforeunload", () => {
  closePvpSocket();
  telegram.destroy();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTopOverlay();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && uiState.mode === "menu") {
    render();
  }
});

function closeTopOverlay(): boolean {
  if (pendingDraftReplacement) {
    cancelDraftReplacement();
    return true;
  }
  if (keyboardMoveSourceSlotIndex !== undefined) {
    cancelKeyboardBoardMove();
    return true;
  }
  if (isCardInfoOpen()) {
    closeCardInfo();
    return true;
  }
  if (uiState.logsOpen) {
    uiState = { ...uiState, logsOpen: false };
    render();
    return true;
  }
  if (howToOpen && uiState.mode === "menu") {
    closeHowToPlay();
    return true;
  }
  if (compendiumOpen && uiState.mode === "menu") {
    closeCompendium();
    return true;
  }
  if (runHistoryOpen && uiState.mode === "menu") {
    closeRunHistory();
    return true;
  }
  if (uiState.playMode === "online") {
    requestLeavePvpRoom();
    return true;
  }
  return false;
}

function handleTelegramBack(): void {
  if (closeTopOverlay()) return;
  if (uiState.mode === "finished") {
    returnToMainMenu();
  } else if (uiState.mode !== "menu") {
    requestAbandonSoloRun();
  }
}

function createInitialUiState(
  seed = createSeed(),
  playMode: PlayMode = "solo",
  mode: ScreenMode = "menu",
  botDifficulty: BotDifficulty = "standard",
  soloSession?: SoloRunSession,
): UiState {
  const run = createRun(seed, botDifficulty);

  return {
    run,
    mode,
    playMode,
    draftBoardSlots: cloneBoardSlots(run.boardSlots),
    cardPickedThisRound: false,
    battleFinished: false,
    logsOpen: false,
    lastRound: 1,
    soloSession,
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
    { role: "host", claimed: false, connected: false, ready: false },
    { role: "guest", claimed: false, connected: false, ready: false },
  ];
}

function render(): void {
  syncTelegramMiniApp();
  const stage = getStageElement();
  const stageUi = getStageUiElement();
  const activeFocusKey = document.activeElement instanceof HTMLElement
    ? document.activeElement.dataset.focusKey
    : undefined;
  const focusKey = pendingFocusKey ?? activeFocusKey;
  pendingFocusKey = undefined;
  stage.className = `stage stage--${uiState.mode}`;
  stageUi.replaceChildren();

  if (uiState.mode === "menu") {
    stageUi.append(createMainMenuOverlay());
  } else if (uiState.mode === "draft") {
    stageUi.append(createGameHud(), createDraftOverlay());
  } else {
    stageUi.append(createGameHud(), createBattleOverlay());
  }

  if (uiState.mode !== "menu") {
    const logsOverlay = createLogsOverlay();
    if (logsOverlay) {
      stageUi.append(logsOverlay);
    }
    stageUi.append(createGameLiveRegion());
  }

  if (uiState.mode === "draft" && isCardInfoOpen()) {
    const draftOverlay = stageUi.querySelector<HTMLElement>(".draft-overlay");
    const cardInfoPanel = draftOverlay?.querySelector<HTMLElement>(".card-info-panel");
    stageUi.querySelector<HTMLElement>(".draft-hud")?.setAttribute("inert", "");
    stageUi.querySelector<HTMLElement>(".logs-overlay")?.setAttribute("inert", "");
    [...(draftOverlay?.children ?? [])].forEach((child) => {
      if (child !== cardInfoPanel) {
        child.setAttribute("inert", "");
      }
    });
  }

  if (uiState.mode === "menu" && howToOpen) {
    stageUi.querySelector<HTMLElement>(".main-menu-overlay")?.setAttribute("inert", "");
    stageUi.append(createHowToPlayOverlay());
  } else if (uiState.mode === "menu" && compendiumOpen) {
    stageUi.querySelector<HTMLElement>(".main-menu-overlay")?.setAttribute("inert", "");
    stageUi.append(createCompendiumOverlay());
  } else if (uiState.mode === "menu" && runHistoryOpen) {
    stageUi.querySelector<HTMLElement>(".main-menu-overlay")?.setAttribute("inert", "");
    stageUi.append(createRunHistoryOverlay());
  }

  if (uiState.mode === "draft" && pendingDraftReplacement) {
    const replacementOverlay = createDraftReplacementOverlay(pendingDraftReplacement);
    if (replacementOverlay) {
      stageUi.querySelector<HTMLElement>(".draft-hud")?.setAttribute("inert", "");
      stageUi.querySelector<HTMLElement>(".draft-overlay")?.setAttribute("inert", "");
      stageUi.querySelector<HTMLElement>(".logs-overlay")?.setAttribute("inert", "");
      stageUi.append(replacementOverlay);
    }
  }

  syncBattlefield();
  restoreFocusAfterRender(focusKey);
}

function syncTelegramMiniApp(): void {
  const gameInProgress = uiState.mode !== "menu" && uiState.run.status !== "finished";
  telegram.setGameInProgress(gameInProgress);
  telegram.setBackHandler(
    uiState.mode !== "menu" || howToOpen || compendiumOpen || runHistoryOpen
      ? handleTelegramBack
      : undefined,
  );
}

function setFocusKey(element: HTMLElement, focusKey: string): void {
  element.dataset.focusKey = focusKey;
}

function requestFocusAfterRender(focusKey: string): void {
  pendingFocusKey = focusKey;
}

function restoreFocusAfterRender(focusKey: string | undefined): void {
  if (!focusKey) {
    return;
  }

  queueMicrotask(() => {
    const target = document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`);
    if (target?.isConnected) {
      target.focus();
    }
  });
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
    stageElement.append(getSceneCanvasHost(), getStageUiElement());
    getShellElement().append(stageElement);
  }

  return stageElement;
}

function getStageUiElement(): HTMLElement {
  if (!stageUiElement) {
    stageUiElement = document.createElement("div");
    stageUiElement.className = "stage-ui";
  }

  return stageUiElement;
}

function createMetric(
  label: string,
  value: string,
  metricKey: "player-hp" | "round" | "enemy-hp",
): HTMLElement {
  const metric = document.createElement("div");
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
  valueEl.dataset.hudMetric = metricKey;

  metric.append(icon, labelEl, valueEl);

  return metric;
}

function createGameHud(): HTMLElement {
  const copy = getCopy();
  const shownHp = uiState.presentedCastleHp ?? {
    player: uiState.run.playerHp,
    enemy: uiState.run.enemyHp,
  };
  const shownRound = uiState.mode === "draft" ? uiState.run.round : uiState.lastRound;
  const snapshot = createGameHudSnapshot(shownHp.player, shownHp.enemy, shownRound);
  const hud = document.createElement("div");
  hud.className = "draft-hud";

  const metrics = document.createElement("div");
  metrics.className = "draft-hud__metrics";
  const enemyMetricLabel = uiState.playMode === "solo"
    ? `${copy.bot} · ${getBotDifficultyLabel(uiState.run.botDifficulty)}`
    : copy.enemyHp;
  metrics.append(
    createMetric(copy.yourHp, String(snapshot.playerHp), "player-hp"),
    createMetric(copy.round, `${snapshot.round}/${snapshot.maxRounds}`, "round"),
    createMetric(enemyMetricLabel, String(snapshot.enemyHp), "enemy-hp"),
  );
  hud.append(metrics);

  if (uiState.mode === "draft") {
    const synergies = createDraftSynergies();
    const logsButton = createLogsButton();
    if (synergies || logsButton) {
      const utilityRow = document.createElement("div");
      utilityRow.className = "draft-hud__utility-row";
      if (synergies) {
        utilityRow.append(synergies);
      }
      if (logsButton) {
        utilityRow.append(logsButton);
      }
      hud.append(utilityRow);
    }
  } else {
    const logsButton = createLogsButton();
    if (logsButton) {
      const utilityRow = document.createElement("div");
      utilityRow.className = "draft-hud__utility-row";
      utilityRow.append(logsButton);
      hud.append(utilityRow);
    }
  }

  return hud;
}

function createDraftSynergies(): HTMLElement | undefined {
  const copy = getCopy();
  const progress = getBoardSynergyProgress(uiState.draftBoardSlots);
  if (progress.length === 0) {
    return undefined;
  }

  const strip = document.createElement("div");
  strip.className = "synergy-strip";
  strip.setAttribute("role", "list");
  strip.setAttribute("aria-label", copy.synergies);
  strip.tabIndex = 0;

  progress.forEach((synergy) => {
    const tag = getTagLabel(activeLocale, synergy.tag);
    const stat = synergy.effect.stat === "attack" ? copy.attack : copy.hp;
    const effect = `+${synergy.effect.value} ${stat}`;
    const remaining = Math.max(0, synergy.threshold - synergy.count);
    const accessibleLabel = formatMessage(
      synergy.active ? copy.synergyActive : copy.synergyProgress,
      {
        tag,
        count: synergy.count,
        threshold: synergy.threshold,
        remaining,
        effect,
      },
    );
    const chip = document.createElement("span");
    chip.className = synergy.active ? "synergy-chip synergy-chip--active" : "synergy-chip";
    chip.setAttribute("role", "listitem");
    chip.setAttribute("aria-label", accessibleLabel);
    chip.title = accessibleLabel;

    const status = document.createElement("span");
    status.className = "synergy-chip__status";
    status.textContent = synergy.active ? "✓" : "·";
    status.setAttribute("aria-hidden", "true");

    const label = document.createElement("strong");
    label.textContent = tag;

    const count = document.createElement("span");
    count.className = "synergy-chip__count";
    count.textContent = `${synergy.count}/${synergy.threshold}`;

    const effectLabel = document.createElement("span");
    effectLabel.className = "synergy-chip__effect";
    effectLabel.textContent = effect;

    chip.append(status, label, count, effectLabel);
    strip.append(chip);
  });

  return strip;
}

function createMainMenuOverlay(): HTMLElement {
  const copy = getCopy();
  const overlay = document.createElement("div");
  overlay.className = "main-menu-overlay";

  const panel = document.createElement("section");
  panel.className = "main-menu";

  const title = document.createElement("h1");
  title.className = "main-menu__title";
  title.textContent = "Draft Battler";

  const subtitle = document.createElement("p");
  subtitle.className = "main-menu__subtitle";
  subtitle.textContent = copy.menuSubtitle;

  const languageSelector = createLanguageSelector();

  const actions = document.createElement("div");
  actions.className = "main-menu__actions";

  const difficultyLabel = document.createElement("span");
  difficultyLabel.className = "main-menu__difficulty-label";
  difficultyLabel.id = "bot-difficulty-label";
  difficultyLabel.textContent = copy.botDifficulty;

  const duelButtons = document.createElement("div");
  duelButtons.className = "main-menu__duel-buttons";
  duelButtons.setAttribute("role", "group");
  duelButtons.setAttribute("aria-labelledby", difficultyLabel.id);
  duelButtons.append(
    createBotDifficultyButton("standard"),
    createBotDifficultyButton("strong"),
  );

  const howToButton = document.createElement("button");
  howToButton.className = "main-menu__button";
  howToButton.type = "button";
  howToButton.textContent = copy.howToPlay;
  howToButton.addEventListener("click", openHowToPlay);

  const compendiumButton = document.createElement("button");
  compendiumButton.className = "main-menu__button";
  compendiumButton.type = "button";
  compendiumButton.textContent = copy.compendium;
  setFocusKey(compendiumButton, "compendium-open");
  compendiumButton.addEventListener("click", openCompendium);

  const referenceActions = document.createElement("div");
  referenceActions.className = "main-menu__reference-actions";
  referenceActions.append(howToButton, compendiumButton);

  const retentionActions = document.createElement("div");
  retentionActions.className = "main-menu__retention-actions";
  retentionActions.append(createDailyChallengeCard(), createRunHistoryButton());

  actions.append(difficultyLabel, duelButtons, retentionActions, referenceActions);
  if (PVP_UI_ENABLED) {
    const onlineButton = document.createElement("button");
    onlineButton.className = "main-menu__button";
    onlineButton.type = "button";
    onlineButton.textContent = copy.onlineMode;
    onlineButton.addEventListener("click", startOnlineLobby);
    actions.append(onlineButton);
  }

  panel.append(title, subtitle, languageSelector, actions);
  overlay.append(panel);

  return overlay;
}

function createDailyChallengeCard(): HTMLElement {
  const copy = getCopy();
  const card = document.createElement("section");
  card.className = "daily-challenge-card";

  const body = document.createElement("div");
  body.className = "daily-challenge-card__copy";
  const title = document.createElement("strong");
  title.className = "daily-challenge-card__title";
  title.textContent = copy.dailyChallengeTitle;
  const hint = document.createElement("span");
  hint.className = "daily-challenge-card__hint";
  hint.textContent = copy.dailyChallengeHint;
  body.append(title, hint);

  const playButton = document.createElement("button");
  playButton.className = "daily-challenge-card__button";
  playButton.type = "button";
  playButton.textContent = copy.dailyChallengePlay;
  setFocusKey(playButton, "daily-challenge-play");
  playButton.addEventListener("click", startDailyChallenge);

  card.append(body, playButton);
  return card;
}

function createRunHistoryButton(): HTMLButtonElement {
  const copy = getCopy();
  const button = document.createElement("button");
  button.className = "main-menu__history-button";
  button.type = "button";
  button.textContent = formatMessage(copy.runHistoryButton, {
    count: soloRunHistory.length,
    limit: SOLO_RUN_HISTORY_LIMIT,
  });
  setFocusKey(button, "run-history-open");
  button.addEventListener("click", openRunHistory);
  return button;
}

function createBotDifficultyButton(botDifficulty: BotDifficulty): HTMLButtonElement {
  const copy = getCopy();
  const button = document.createElement("button");
  button.className = botDifficulty === "strong"
    ? "main-menu__button main-menu__difficulty-button main-menu__difficulty-button--strong"
    : "main-menu__button main-menu__button--primary main-menu__difficulty-button";
  button.type = "button";
  button.dataset.botDifficulty = botDifficulty;

  const label = document.createElement("strong");
  label.textContent = getBotDifficultyLabel(botDifficulty);
  const hint = document.createElement("span");
  hint.textContent = botDifficulty === "strong"
    ? copy.botDifficultyStrongHint
    : copy.botDifficultyStandardHint;
  button.append(label, hint);
  button.addEventListener("click", () => startNewSoloRun(botDifficulty));
  return button;
}

function getBotDifficultyLabel(botDifficulty: BotDifficulty): string {
  const copy = getCopy();
  return botDifficulty === "strong" ? copy.botDifficultyStrong : copy.botDifficultyStandard;
}

function createLanguageSelector(): HTMLElement {
  const copy = getCopy();
  const selector = document.createElement("div");
  selector.className = "language-selector";
  selector.setAttribute("role", "group");
  selector.setAttribute("aria-label", copy.language);

  SUPPORTED_LOCALES.forEach((locale) => {
    const button = document.createElement("button");
    button.className = locale === activeLocale ? "language-selector__button language-selector__button--active" : "language-selector__button";
    button.type = "button";
    button.lang = locale;
    button.textContent = locale.toUpperCase();
    button.title = getUiCopy(locale).localeName;
    button.setAttribute("aria-label", getUiCopy(locale).localeName);
    button.setAttribute("aria-pressed", String(locale === activeLocale));
    button.addEventListener("click", () => selectLocale(locale));
    selector.append(button);
  });

  return selector;
}

function createHowToPlayOverlay(): HTMLElement {
  const copy = getCopy();
  const overlay = document.createElement("div");
  overlay.className = "how-to-overlay";

  const panel = document.createElement("section");
  panel.className = "how-to-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "draft-battler-how-to-title");

  const header = document.createElement("div");
  header.className = "how-to-panel__header";

  const title = document.createElement("h2");
  title.id = "draft-battler-how-to-title";
  title.textContent = copy.howToTitle;
  header.append(title, createLanguageSelector());

  const intro = document.createElement("p");
  intro.className = "how-to-panel__intro";
  intro.textContent = copy.howToIntro;

  const steps = document.createElement("ol");
  steps.className = "how-to-panel__steps";
  steps.append(
    createHowToStep(copy.howToDraftTitle, copy.howToDraftBody),
    createHowToStep(copy.howToPlaceTitle, copy.howToPlaceBody),
    createHowToStep(copy.howToUpgradeTitle, copy.howToUpgradeBody),
    createHowToStep(copy.howToWinTitle, copy.howToWinBody),
  );

  const notice = document.createElement("p");
  notice.className = "how-to-panel__notice";
  notice.textContent = copy.howToSessionNotice;

  const closeButton = document.createElement("button");
  closeButton.className = "primary-button how-to-panel__close";
  closeButton.type = "button";
  closeButton.textContent = copy.gotIt;
  closeButton.addEventListener("click", closeHowToPlay);

  panel.append(header, intro, steps, notice, closeButton);
  overlay.append(panel);
  queueMicrotask(() => {
    if (closeButton.isConnected) {
      closeButton.focus();
    }
  });

  return overlay;
}

function createHowToStep(title: string, body: string): HTMLLIElement {
  const step = document.createElement("li");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const detail = document.createElement("span");
  detail.textContent = body;
  step.append(heading, detail);

  return step;
}

function createCompendiumOverlay(): HTMLElement {
  const copy = getCopy();
  const presentation = createCompendiumPresentation();
  const overlay = document.createElement("div");
  overlay.className = "compendium-overlay";

  const panel = document.createElement("section");
  panel.className = "compendium-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "draft-battler-compendium-title");

  const header = document.createElement("div");
  header.className = "compendium-panel__header";

  const heading = document.createElement("div");
  const title = document.createElement("h2");
  title.id = "draft-battler-compendium-title";
  title.textContent = copy.compendiumTitle;
  const intro = document.createElement("p");
  intro.textContent = copy.compendiumIntro;
  heading.append(title, intro);

  const closeButton = document.createElement("button");
  closeButton.className = "compendium-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.closeCompendium);
  setFocusKey(closeButton, "compendium-close");
  closeButton.addEventListener("click", closeCompendium);
  header.append(heading, closeButton);

  const content = document.createElement("div");
  content.className = "compendium-panel__content";
  content.tabIndex = 0;
  content.setAttribute("aria-label", copy.compendiumTitle);

  const cardSection = document.createElement("section");
  cardSection.className = "compendium-section";
  const cardTitle = document.createElement("h3");
  cardTitle.textContent = copy.compendiumCards;
  const upgradeNote = document.createElement("p");
  upgradeNote.className = "compendium-section__note";
  upgradeNote.textContent = copy.compendiumUpgradeNote;
  const cardList = document.createElement("div");
  cardList.className = "compendium-card-list";
  presentation.cards.forEach((entry) => cardList.append(createCompendiumCard(entry)));
  cardSection.append(cardTitle, upgradeNote, cardList);

  const synergySection = document.createElement("section");
  synergySection.className = "compendium-section";
  const synergyTitle = document.createElement("h3");
  synergyTitle.textContent = copy.compendiumSynergies;
  const synergyList = document.createElement("div");
  synergyList.className = "compendium-synergy-list";
  presentation.synergies.forEach((synergy) => {
    const item = document.createElement("article");
    item.className = "compendium-synergy";
    const name = document.createElement("strong");
    name.textContent = getTagLabel(activeLocale, synergy.tag);
    const stat = synergy.effect.stat === "attack" ? copy.attack : copy.hp;
    const rule = document.createElement("span");
    rule.textContent = formatMessage(copy.compendiumSynergyRule, {
      threshold: synergy.threshold,
      value: synergy.effect.value,
      stat,
    });
    const cards = document.createElement("p");
    cards.textContent = formatMessage(copy.compendiumSynergyCards, {
      cards: synergy.relevantCardIds
        .map((cardId) => getLocalizedCard(activeLocale, getCardDefinition(cardId)).name)
        .join(", "),
    });
    item.append(name, rule, cards);
    synergyList.append(item);
  });
  synergySection.append(synergyTitle, synergyList);

  content.append(cardSection, synergySection);
  panel.append(header, content);
  overlay.append(panel);

  queueMicrotask(() => {
    if (closeButton.isConnected) {
      closeButton.focus();
    }
  });

  return overlay;
}

function createCompendiumCard(entry: CompendiumCardPresentation): HTMLElement {
  const copy = getCopy();
  const card = getCardDefinition(entry.id);
  const localized = getLocalizedCard(activeLocale, card);
  const meta = getCardDisplayMeta(card);
  const item = document.createElement("article");
  item.className = `compendium-card unit-card--${meta.archetype} unit-card--${meta.rarity}`;

  const art = createCardArt(card, meta);
  art.classList.add("compendium-card__art");

  const body = document.createElement("div");
  body.className = "compendium-card__body";
  const title = document.createElement("h4");
  title.textContent = localized.name;
  const metaLine = document.createElement("div");
  metaLine.className = "compendium-card__meta";
  const tier = document.createElement("span");
  tier.textContent = formatMessage(copy.compendiumTier, { tier: card.tier });
  const rarity = document.createElement("span");
  rarity.textContent = meta.rarityLabel;
  const archetype = document.createElement("span");
  archetype.textContent = meta.archetypeLabel;
  metaLine.append(tier, rarity, archetype);

  const tags = document.createElement("div");
  tags.className = "compendium-card__tags";
  card.tags.forEach((tag) => {
    const tagLabel = document.createElement("span");
    tagLabel.textContent = getTagLabel(activeLocale, tag);
    tags.append(tagLabel);
  });

  const stats = document.createElement("div");
  stats.className = "compendium-card__stats";
  stats.append(
    createCompendiumStat(copy.attack, entry.baseStats.attack, entry.upgradedStats.attack),
    createCompendiumStat(copy.hp, entry.baseStats.hp, entry.upgradedStats.hp),
    createCompendiumStat(copy.speed, entry.baseStats.speed, entry.upgradedStats.speed),
    createCompendiumStat(copy.range, entry.baseStats.range, entry.upgradedStats.range),
  );

  const description = document.createElement("p");
  description.className = "compendium-card__description";
  description.textContent = localized.summary;
  body.append(title, metaLine, tags, stats, description);
  item.append(art, body);
  return item;
}

function createCompendiumStat(label: string, baseValue: number, upgradedValue: number): HTMLElement {
  const stat = document.createElement("span");
  const labelElement = document.createElement("small");
  labelElement.textContent = label;
  const value = document.createElement("strong");
  value.textContent = baseValue === upgradedValue ? String(baseValue) : `${baseValue}→${upgradedValue}`;
  stat.append(labelElement, value);
  return stat;
}

function openHowToPlay(): void {
  compendiumOpen = false;
  runHistoryOpen = false;
  howToOpen = true;
  render();
}

function closeHowToPlay(): void {
  howToOpen = false;
  markHowToSeen(preferenceStorage);
  render();
  queueMicrotask(() => {
    document.querySelector<HTMLButtonElement>(".main-menu__button--primary")?.focus();
  });
}

function openCompendium(): void {
  howToOpen = false;
  runHistoryOpen = false;
  compendiumOpen = true;
  render();
}

function closeCompendium(): void {
  compendiumOpen = false;
  requestFocusAfterRender("compendium-open");
  render();
}

function createRunHistoryOverlay(): HTMLElement {
  const copy = getCopy();
  const overlay = document.createElement("div");
  overlay.className = "run-history-overlay";

  const panel = document.createElement("section");
  panel.className = "run-history-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "draft-battler-run-history-title");
  panel.addEventListener("keydown", (event) => trapModalFocus(panel, event));

  const header = document.createElement("div");
  header.className = "run-history-panel__header";
  const heading = document.createElement("div");
  const title = document.createElement("h2");
  title.id = "draft-battler-run-history-title";
  title.textContent = copy.runHistoryTitle;
  const intro = document.createElement("p");
  intro.textContent = formatMessage(copy.runHistoryIntro, { limit: SOLO_RUN_HISTORY_LIMIT });
  heading.append(title, intro);

  const closeButton = document.createElement("button");
  closeButton.className = "run-history-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.closeRunHistory);
  closeButton.addEventListener("click", closeRunHistory);
  header.append(heading, closeButton);

  const content = document.createElement("div");
  content.className = "run-history-panel__content";
  content.tabIndex = 0;
  if (soloRunHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "run-history-panel__empty";
    empty.textContent = copy.runHistoryEmpty;
    content.append(empty);
  } else {
    const list = document.createElement("div");
    list.className = "run-history-list";
    list.setAttribute("role", "list");
    soloRunHistory.forEach((summary) => list.append(createRunHistoryEntry(summary)));
    content.append(list);
  }

  panel.append(header, content);
  overlay.append(panel);
  queueMicrotask(() => {
    if (closeButton.isConnected) {
      closeButton.focus();
    }
  });
  return overlay;
}

function createRunHistoryEntry(summary: SoloRunSummary): HTMLElement {
  const copy = getCopy();
  const kind = summary.outcome === "player" ? "victory" : summary.outcome === "enemy" ? "defeat" : "draw";
  const entry = document.createElement("article");
  entry.className = "run-history-entry";
  entry.setAttribute("role", "listitem");

  const topLine = document.createElement("div");
  topLine.className = "run-history-entry__topline";
  const outcome = document.createElement("strong");
  outcome.className = `run-history-entry__outcome run-history-entry__outcome--${kind}`;
  outcome.textContent = summary.outcome === "player" ? copy.victory : summary.outcome === "enemy" ? copy.defeat : copy.draw;
  const date = document.createElement("time");
  date.dateTime = new Date(summary.completedAt).toISOString();
  date.textContent = formatRunHistoryDate(summary.completedAt);
  topLine.append(outcome, date);

  const meta = document.createElement("p");
  meta.className = "run-history-entry__meta";
  const source = summary.source === "daily" ? copy.runSourceDaily : copy.runSourceStandard;
  const sourceDetail = summary.dailyDateKey ? `${source} · ${summary.dailyDateKey}` : source;
  meta.textContent = `${sourceDetail} · ${getBotDifficultyLabel(summary.botDifficulty)}`;

  const score = document.createElement("p");
  score.className = "run-history-entry__score";
  score.textContent = `${copy.rounds}: ${summary.round}/${MAX_RUN_ROUNDS} · HP: ${summary.playerHp}:${summary.enemyHp}`;

  const replayButton = document.createElement("button");
  replayButton.className = "run-history-entry__replay";
  replayButton.type = "button";
  replayButton.textContent = summary.rulesetVersion === SOLO_RUN_RULESET_VERSION
    ? copy.runHistoryReplay
    : copy.runHistoryReplayCurrentRules;
  replayButton.setAttribute(
    "aria-label",
    `${replayButton.textContent}: ${outcome.textContent}, ${date.textContent}, ${getBotDifficultyLabel(summary.botDifficulty)}, ${score.textContent}`,
  );
  replayButton.addEventListener("click", () => replaySoloRun(summary));

  entry.append(topLine, meta, score, replayButton);
  return entry;
}

function formatRunHistoryDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(activeLocale, { dateStyle: "medium" }).format(timestamp);
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

function trapModalFocus(panel: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = [...panel.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
  if (focusable.length === 0) {
    event.preventDefault();
    panel.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function openRunHistory(): void {
  howToOpen = false;
  compendiumOpen = false;
  flushQueuedSoloRunSummaries(runHistoryStorage);
  soloRunHistory = loadSoloRunHistory(runHistoryStorage);
  runHistoryOpen = true;
  render();
}

function closeRunHistory(): void {
  runHistoryOpen = false;
  requestFocusAfterRender("run-history-open");
  render();
}

function selectLocale(locale: SupportedLocale): void {
  activeLocale = locale;
  document.documentElement.lang = locale;
  saveLocale(preferenceStorage, locale);
  render();
}

function startNewSoloRun(botDifficulty: BotDifficulty): void {
  startSoloRun({
    seed: createSeed(),
    botDifficulty,
    source: "standard",
    dailyDateKey: null,
  });
}

function startDailyChallenge(): void {
  const challenge = createTodayDailyChallenge();
  startSoloRun({
    seed: challenge.seed,
    botDifficulty: "strong",
    source: challenge.source,
    dailyDateKey: challenge.dateKey,
  });
}

function replaySoloRun(summary: SoloRunSummary): void {
  startSoloRun({
    seed: summary.seed,
    botDifficulty: summary.botDifficulty,
    source: summary.source,
    dailyDateKey: summary.dailyDateKey,
  });
}

function startSoloRun(request: SoloRunStartRequest): void {
  if (!confirmFinishedSoloRunDiscard()) {
    return;
  }

  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  draftChoicesCollapsed = false;
  clearBattlePresentationWatchdog();
  closePvpSocket();
  clearPersistedSoloRun();
  runHistoryOpen = false;
  uiState = createInitialUiState(
    request.seed,
    "solo",
    "draft",
    request.botDifficulty,
    createSoloRunSession({
      source: request.source,
      dailyDateKey: request.dailyDateKey,
    }),
  );
  persistSoloRun();
  render();
}

function returnToMainMenu(): void {
  if (!confirmFinishedSoloRunDiscard()) {
    return;
  }

  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  draftChoicesCollapsed = false;
  clearBattlePresentationWatchdog();
  closePvpSocket();
  clearPersistedSoloRun();
  runHistoryOpen = false;
  uiState = createInitialUiState();
  render();
}

function startOnlineLobby(): void {
  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  draftChoicesCollapsed = false;
  closePvpSocket();
  pvpAutomaticReconnectUsed = false;
  uiState = {
    ...createInitialUiState(createSeed(), "online", "draft"),
    pvp: createInitialPvpState(true),
  };
  render();
  if (activePvpSession) {
    void reconnectSavedPvpSession();
  }
}

function createDraftOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  const overlayClasses = ["draft-overlay"];
  if (isCardInfoOpen()) {
    overlayClasses.push("draft-overlay--card-info-open");
  }
  if (getVisibleRoundLogs().length > 0) {
    overlayClasses.push("draft-overlay--has-logs");
  }
  overlay.className = overlayClasses.join(" ");
  const isWaitingForOnlineMatch = uiState.playMode === "online" && !uiState.pvp.match;
  const selectedDraftCardId = getSelectedDraftCardId();

  if (!isWaitingForOnlineMatch) {
    overlay.append(createFieldSlotsLayer());

    if (selectedDraftCardId && !uiState.cardPickedThisRound) {
      overlay.append(createTapPlacementPanel(selectedDraftCardId));
    } else if (keyboardMoveSourceSlotIndex !== undefined) {
      overlay.append(createKeyboardMovePanel(keyboardMoveSourceSlotIndex));
    } else {
      overlay.append(createFieldActionBar());
    }
  }

  if (uiState.pvp.panelOpen || isWaitingForOnlineMatch) {
    overlay.append(createPvpPanel());
  }

  if (
    !isWaitingForOnlineMatch &&
    !uiState.cardPickedThisRound &&
    !selectedDraftCardId &&
    keyboardMoveSourceSlotIndex === undefined
  ) {
    overlay.append(createDraftPanel());
  }

  const inspectedBoardUnit = getSelectedBoardUnitInspection();
  const inspectedEnemyUnit = getSelectedEnemyUnitInspection();
  if (inspectedBoardUnit) {
    overlay.append(createCardInfoPanel(inspectedBoardUnit.cardId, inspectedBoardUnit));
  } else if (inspectedEnemyUnit) {
    overlay.append(createCardInfoPanel(inspectedEnemyUnit.cardId, inspectedEnemyUnit, "enemy"));
  } else if (uiState.selectedCardInfoId) {
    overlay.append(createCardInfoPanel(uiState.selectedCardInfoId));
  }

  return overlay;
}

function createBattleOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "battle-overlay";

  if (uiState.battleFinished) {
    overlay.append(
      uiState.mode === "finished"
        ? (uiState.playMode === "solo" ? createSoloTerminalResult() : createPvpTerminalResult())
        : createBattleActionPanel(),
    );
  } else {
    overlay.append(createBattlePlaybackControls());
  }

  if (uiState.playMode === "online" && uiState.pvp.panelOpen) {
    overlay.append(createPvpPanel());
  }

  return overlay;
}

function createBattleActionPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "battle-action-panel";

  const lastRound = getLastRoundRecord(uiState.run);
  if (lastRound) {
    panel.append(createRoundResultSummary(lastRound));
  }

  if (uiState.battlePresentationNotice) {
    panel.append(createBattlePresentationNotice(uiState.battlePresentationNotice));
  }

  panel.append(createActionBar());

  return panel;
}

function createBattlePlaybackControls(): HTMLElement {
  const copy = getCopy();
  const controls = document.createElement("div");
  controls.className = "battle-playback-controls";

  const speedButton = document.createElement("button");
  speedButton.className = "battle-playback-controls__speed";
  speedButton.type = "button";
  speedButton.textContent = `×${battlePlaybackSpeed}`;
  speedButton.title = copy.battleSpeed;
  speedButton.setAttribute("aria-label", `${copy.battleSpeed}: ×${battlePlaybackSpeed}`);
  speedButton.setAttribute("aria-pressed", String(battlePlaybackSpeed === 2));
  setFocusKey(speedButton, "battle-speed");
  speedButton.addEventListener("click", toggleBattlePlaybackSpeed);

  const skipButton = document.createElement("button");
  skipButton.className = "battle-playback-controls__skip";
  skipButton.type = "button";
  skipButton.textContent = copy.skipBattle;
  setFocusKey(skipButton, "battle-skip");
  skipButton.addEventListener("click", skipBattlePresentation);

  controls.append(speedButton, skipButton);
  if (uiState.playMode === "solo") {
    controls.append(createAbandonRunButton("battle-playback-controls__abandon"));
  } else {
    const exitButton = createPvpExitButton();
    exitButton.classList.add("battle-playback-controls__abandon");
    controls.append(exitButton);
  }
  return controls;
}

function toggleBattlePlaybackSpeed(): void {
  battlePlaybackSpeed = battlePlaybackSpeed === 1 ? 2 : 1;
  saveBattlePlaybackSpeed(preferenceStorage, battlePlaybackSpeed);
  battlefieldController?.setBattleSpeed(battlePlaybackSpeed);
  requestFocusAfterRender("battle-speed");
  render();
}

function skipBattlePresentation(): void {
  requestFocusAfterRender(uiState.mode === "finished" ? "terminal-result" : "next-round");
  if (!battlefieldController?.skipBattle()) {
    completeBattlePresentation();
  }
}

function createAbandonRunButton(className: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = getCopy().abandonRun;
  setFocusKey(button, "abandon-run");
  button.addEventListener("click", requestAbandonSoloRun);
  return button;
}

function requestAbandonSoloRun(): void {
  if (uiState.playMode !== "solo" || uiState.mode === "menu") {
    return;
  }

  if (!window.confirm(getCopy().abandonRunConfirm)) {
    return;
  }

  returnToMainMenu();
}

function createRoundResultSummary(record: RoundRecord): HTMLElement {
  const copy = getCopy();
  const snapshot = createRoundSummarySnapshot(record);
  const summary = document.createElement("section");
  summary.className = `round-result-summary round-result-summary--${snapshot.winner}`;
  summary.setAttribute("role", "status");
  summary.setAttribute("aria-live", "polite");
  summary.setAttribute("aria-atomic", "true");

  const title = document.createElement("strong");
  title.textContent = getRoundWinnerLabel(snapshot.winner);
  const detail = document.createElement("span");
  detail.textContent = formatMessage(copy.roundResultDetail, {
    yourHp: copy.yourHp,
    playerHp: snapshot.playerHpAfter,
    playerLoss: snapshot.playerHpLoss,
    enemyHp: copy.enemyHp,
    enemyHpValue: snapshot.enemyHpAfter,
    enemyLoss: snapshot.enemyHpLoss,
  });
  summary.append(title, detail, createRoundInsightsSummary(record));
  return summary;
}

function createRoundInsightsSummary(record: RoundRecord): HTMLElement {
  const copy = getCopy();
  const insights = createRoundInsights(record);
  const section = document.createElement("div");
  section.className = "round-result-insights";

  const title = document.createElement("span");
  title.className = "round-result-insights__title";
  title.textContent = copy.roundInsightsTitle;

  const metrics = document.createElement("div");
  metrics.className = "round-result-insights__grid";
  const rows = [
    formatRoundInsight(copy.roundInsightCastleDamage, insights.castles.enemy.damageTaken, insights.castles.player.damageTaken),
    formatRoundInsight(copy.roundInsightSurvivors, insights.sides.player.survivors.length, insights.sides.enemy.survivors.length),
  ];
  const optionalRows = [
    {
      total: insights.sides.player.healing.amount + insights.sides.enemy.healing.amount,
      label: formatRoundInsight(copy.roundInsightHealing, insights.sides.player.healing.amount, insights.sides.enemy.healing.amount),
    },
    {
      total: insights.sides.player.blocking.amount + insights.sides.enemy.blocking.amount,
      label: formatRoundInsight(copy.roundInsightBlocking, insights.sides.player.blocking.amount, insights.sides.enemy.blocking.amount),
    },
    {
      total: insights.sides.player.summons.length + insights.sides.enemy.summons.length,
      label: formatRoundInsight(copy.roundInsightSummons, insights.sides.player.summons.length, insights.sides.enemy.summons.length),
    },
    {
      total: insights.sides.player.synergies.length + insights.sides.enemy.synergies.length,
      label: formatRoundInsight(copy.roundInsightSynergies, insights.sides.player.synergies.length, insights.sides.enemy.synergies.length),
    },
  ]
    .filter((row) => row.total > 0)
    .slice(0, 2)
    .map((row) => row.label);

  [...rows, ...optionalRows].forEach((label) => {
    const metric = document.createElement("span");
    metric.textContent = label;
    metrics.append(metric);
  });
  section.append(title, metrics);
  return section;
}

function formatRoundInsight(template: string, player: number, enemy: number): string {
  return formatMessage(template, { player, enemy });
}

function getRoundWinnerLabel(winner: CombatWinner): string {
  const copy = getCopy();
  return winner === "player" ? copy.roundVictory : winner === "enemy" ? copy.roundDefeat : copy.roundDraw;
}

function createGameLiveRegion(): HTMLElement {
  const liveRegion = document.createElement("p");
  liveRegion.className = "game-live-status";
  liveRegion.dataset.gameLiveStatus = "true";
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");

  if ((uiState.mode === "battle" || uiState.mode === "finished") && !uiState.battleFinished) {
    liveRegion.textContent = formatMessage(getCopy().battleInProgress, {
      round: uiState.lastRound,
      maxRounds: MAX_RUN_ROUNDS,
    });
  } else if (uiState.battleFinished) {
    const record = getLastRoundRecord(uiState.run);
    if (record) {
      liveRegion.textContent = `${getRoundWinnerLabel(record.combatResult.winner)}. ${getBattleSummaryDetail(record)}`;
    }
  }

  return liveRegion;
}

function createBattlePresentationNotice(message: string): HTMLElement {
  const notice = document.createElement("p");
  notice.className = "battle-presentation-notice";
  notice.textContent = message;

  return notice;
}

function createSoloTerminalResult(): HTMLElement {
  const copy = getCopy();
  const completedRounds = uiState.run.roundHistory.length;
  const session = uiState.soloSession;
  const outcome = uiState.run.outcome;
  if (!outcome || !session?.completedAt) {
    throw new Error("Finished solo run is missing terminal metadata.");
  }
  const resultKind = outcome === "player" ? "victory" : outcome === "enemy" ? "defeat" : "draw";
  const panel = document.createElement("section");
  panel.className = `terminal-result terminal-result--${resultKind}`;
  panel.tabIndex = -1;
  setFocusKey(panel, "terminal-result");

  const eyebrow = document.createElement("span");
  eyebrow.className = "terminal-result__eyebrow";
  const sourceLabel = session.source === "daily" ? copy.runSourceDaily : copy.runSourceStandard;
  eyebrow.textContent = `${copy.runFinished} · ${sourceLabel} · ${getBotDifficultyLabel(uiState.run.botDifficulty)}`;

  const title = document.createElement("h1");
  title.className = "terminal-result__title";
  title.textContent = outcome === "player" ? copy.victory : outcome === "enemy" ? copy.defeat : copy.draw;

  const detail = document.createElement("p");
  detail.className = "terminal-result__detail";
  const detailTemplate = outcome === "player" ? copy.victoryDetail : outcome === "enemy" ? copy.defeatDetail : copy.drawDetail;
  detail.textContent = formatMessage(detailTemplate, {
    round: Math.max(1, completedRounds),
    playerHp: uiState.run.playerHp,
    enemyHp: uiState.run.enemyHp,
  });

  const metrics = document.createElement("div");
  metrics.className = "terminal-result__metrics";
  metrics.append(
    createTerminalMetric(copy.rounds, `${completedRounds}/${MAX_RUN_ROUNDS}`),
    createTerminalMetric(copy.yourHp, String(uiState.run.playerHp)),
    createTerminalMetric(copy.enemyHp, String(uiState.run.enemyHp)),
  );

  const actions = document.createElement("div");
  actions.className = "terminal-result__actions";

  const newLayoutButton = document.createElement("button");
  newLayoutButton.className = session.source === "daily" ? "terminal-result__secondary-button" : "primary-button";
  newLayoutButton.type = "button";
  newLayoutButton.textContent = copy.newLayout;
  setFocusKey(newLayoutButton, "restart-run");
  const replayDifficulty = uiState.run.botDifficulty;
  newLayoutButton.addEventListener("click", () => startNewSoloRun(replayDifficulty));

  const sameLayoutButton = document.createElement("button");
  sameLayoutButton.className = session.source === "daily" ? "primary-button" : "terminal-result__secondary-button";
  sameLayoutButton.type = "button";
  sameLayoutButton.textContent = copy.sameLayout;
  const replayRequest: SoloRunStartRequest = {
    seed: uiState.run.seed,
    botDifficulty: uiState.run.botDifficulty,
    source: session.source,
    dailyDateKey: session.dailyDateKey,
  };
  sameLayoutButton.addEventListener("click", () => startSoloRun(replayRequest));

  const shareButton = document.createElement("button");
  shareButton.className = "terminal-result__secondary-button";
  shareButton.type = "button";
  shareButton.textContent = copy.shareResult;

  const shareStatus = document.createElement("p");
  shareStatus.className = "terminal-result__share-status";
  shareStatus.setAttribute("aria-live", "polite");
  shareButton.addEventListener("click", () => {
    void shareSoloRunResult(shareButton, shareStatus);
  });

  const menuButton = document.createElement("button");
  menuButton.className = "terminal-result__secondary-button";
  menuButton.type = "button";
  menuButton.textContent = copy.menu;
  setFocusKey(menuButton, "return-menu");
  menuButton.addEventListener("click", returnToMainMenu);

  if (session.source === "daily") {
    actions.append(sameLayoutButton, newLayoutButton, shareButton, menuButton);
  } else {
    actions.append(newLayoutButton, sameLayoutButton, shareButton, menuButton);
  }
  panel.append(eyebrow, title, detail, metrics);

  if (uiState.battlePresentationNotice) {
    panel.append(createBattlePresentationNotice(uiState.battlePresentationNotice));
  }

  panel.append(actions, shareStatus);

  return panel;
}

async function shareSoloRunResult(
  button: HTMLButtonElement,
  status: HTMLElement,
): Promise<void> {
  const copy = getCopy();
  const outcome = uiState.run.outcome;
  if (uiState.playMode !== "solo" || !outcome || uiState.run.status !== "finished") {
    return;
  }

  const resultLabel = outcome === "player" ? copy.victory : outcome === "enemy" ? copy.defeat : copy.draw;
  const text = formatMessage(copy.shareResultText, {
    outcome: resultLabel,
    difficulty: getBotDifficultyLabel(uiState.run.botDifficulty),
    round: uiState.run.roundHistory.length,
    maxRounds: MAX_RUN_ROUNDS,
    playerHp: uiState.run.playerHp,
    enemyHp: uiState.run.enemyHp,
  });

  const restoreButtonFocus = button.matches(":focus");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  status.textContent = "";
  status.className = "terminal-result__share-status";
  try {
    const result = await shareResult(
      { title: "Bro Battler", text, url: window.location.href },
      {
        telegramShare: (sharedText, sharedUrl) => telegram.share(sharedText, sharedUrl),
        nativeShare: typeof navigator.share === "function"
          ? (data) => navigator.share(data)
          : undefined,
        writeClipboard: navigator.clipboard?.writeText
          ? (value) => navigator.clipboard.writeText(value)
          : undefined,
      },
    );
    if (result.kind === "clipboard") {
      status.classList.add("terminal-result__share-status--success");
      status.textContent = copy.shareCopied;
    } else if (result.kind === "failed") {
      status.classList.add("terminal-result__share-status--error");
      status.textContent = copy.shareFailed;
    }
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (restoreButtonFocus) {
        button.focus({ preventScroll: true });
      }
    }
  }
}

function createPvpTerminalResult(): HTMLElement {
  const copy = getCopy();
  const match = uiState.pvp.match;
  if (!match?.outcome) {
    return createBattleActionPanel();
  }

  const outcome = match.outcome.winner === "draw"
    ? "draw"
    : match.outcome.winner === match.self.role
      ? "player"
      : "enemy";
  const resultKind = outcome === "player" ? "victory" : outcome === "enemy" ? "defeat" : "draw";
  const panel = document.createElement("section");
  panel.className = `terminal-result terminal-result--${resultKind}`;
  panel.tabIndex = -1;
  setFocusKey(panel, "terminal-result");

  const eyebrow = document.createElement("span");
  eyebrow.className = "terminal-result__eyebrow";
  eyebrow.textContent = `${copy.runFinished} · ${copy.onlineMode}`;

  const title = document.createElement("h1");
  title.className = "terminal-result__title";
  title.textContent = outcome === "player" ? copy.victory : outcome === "enemy" ? copy.defeat : copy.draw;

  const detail = document.createElement("p");
  detail.className = "terminal-result__detail";
  const detailTemplate = outcome === "player" ? copy.victoryDetail : outcome === "enemy" ? copy.defeatDetail : copy.drawDetail;
  detail.textContent = formatMessage(detailTemplate, {
    round: match.round,
    playerHp: uiState.run.playerHp,
    enemyHp: uiState.run.enemyHp,
  });

  const metrics = document.createElement("div");
  metrics.className = "terminal-result__metrics";
  metrics.append(
    createTerminalMetric(copy.rounds, `${match.round}/${MAX_RUN_ROUNDS}`),
    createTerminalMetric(copy.yourHp, String(uiState.run.playerHp)),
    createTerminalMetric(copy.enemyHp, String(uiState.run.enemyHp)),
  );

  const actions = document.createElement("div");
  actions.className = "terminal-result__actions";
  const rematchButton = document.createElement("button");
  rematchButton.className = "primary-button";
  rematchButton.type = "button";
  rematchButton.disabled = match.self.rematchReady;
  rematchButton.textContent = match.self.rematchReady ? copy.pvpWaitingForRematch : copy.pvpRematch;
  rematchButton.addEventListener("click", sendPvpRematch);
  const leaveButton = document.createElement("button");
  leaveButton.className = "terminal-result__secondary-button";
  leaveButton.type = "button";
  leaveButton.textContent = copy.pvpLeaveRoom;
  leaveButton.addEventListener("click", requestLeavePvpRoom);
  actions.append(rematchButton, leaveButton);
  panel.append(eyebrow, title, detail, metrics, actions);
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

function canShowLogsInCurrentMode(): boolean {
  return uiState.mode === "draft" || uiState.battleFinished;
}

function createLogsButton(): HTMLButtonElement | undefined {
  if (!canShowLogsInCurrentMode()) {
    return undefined;
  }

  const visibleLogs = getVisibleRoundLogs();
  if (visibleLogs.length === 0) {
    return undefined;
  }

  const copy = getCopy();
  const button = document.createElement("button");
  button.className = uiState.logsOpen ? "logs-button logs-button--active" : "logs-button";
  button.type = "button";
  button.textContent = copy.logs;
  button.setAttribute("aria-expanded", String(uiState.logsOpen));
  button.setAttribute("aria-controls", "logs-panel");
  setFocusKey(button, "logs-toggle");
  button.addEventListener("click", () => {
    const nextOpen = !uiState.logsOpen;
    const selectedLog = getSelectedRoundLog(visibleLogs);

    uiState = {
      ...uiState,
      logsOpen: nextOpen,
      selectedLogRound: nextOpen ? selectedLog?.round : uiState.selectedLogRound,
    };
    requestFocusAfterRender("logs-toggle");
    render();
  });

  return button;
}

function createLogsOverlay(): HTMLElement | undefined {
  if (!canShowLogsInCurrentMode()) {
    return undefined;
  }

  const visibleLogs = getVisibleRoundLogs();
  if (!uiState.logsOpen || visibleLogs.length === 0) {
    return undefined;
  }

  const overlay = document.createElement("div");
  overlay.className = "logs-overlay";
  overlay.append(createLogsPanel(visibleLogs));
  return overlay;
}

function createLogsPanel(logs: readonly RoundRecord[]): HTMLElement {
  const copy = getCopy();
  const panel = document.createElement("section");
  panel.className = "logs-panel";
  panel.id = "logs-panel";

  const header = document.createElement("div");
  header.className = "logs-panel__header";

  const title = document.createElement("h2");
  title.textContent = copy.logs;

  const closeButton = document.createElement("button");
  closeButton.className = "logs-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.closeLogs);
  closeButton.addEventListener("click", () => {
    uiState = {
      ...uiState,
      logsOpen: false,
    };
    requestFocusAfterRender("logs-toggle");
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
    roundButton.textContent = formatMessage(copy.roundNumber, { round: log.round });
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
  const copy = getCopy();
  const report = document.createElement("div");
  report.className = "report report--log";

  const title = document.createElement("h2");
  title.textContent = formatMessage(copy.roundNumber, { round: log.round });

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
  draftPanel.className = draftChoicesCollapsed ? "draft-panel draft-panel--collapsed" : "draft-panel";
  draftPanel.append(createDraftHeader());

  if (!draftChoicesCollapsed && uiState.run.round === 1 && getFilledSlotCount() === 0) {
    draftPanel.append(createDraftOnboarding());
  }

  const grid = createDraftGrid();
  grid.hidden = draftChoicesCollapsed;
  draftPanel.append(grid);

  return draftPanel;
}

function createDraftOnboarding(): HTMLElement {
  const hint = document.createElement("p");
  hint.className = "draft-onboarding";
  hint.textContent = getCopy().onboarding;

  return hint;
}

function createDraftHeader(): HTMLElement {
  const copy = getCopy();
  const header = document.createElement("div");
  header.className = "panel-header panel-header--draft";

  const title = document.createElement("h1");
  title.textContent = copy.chooseCard;

  const caption = document.createElement("span");
  caption.className = "panel-caption";
  caption.textContent = formatMessage(copy.slots, {
    filled: getFilledSlotCount(),
    capacity: getBoardCapacity(),
  });

  const actions = document.createElement("div");
  actions.className = "draft-header-actions";
  actions.append(caption, createRerollButton(), createDraftChoicesToggle());

  header.append(title, actions);

  return header;
}

function createDraftGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "draft-grid draft-grid--triple";
  grid.id = "draft-options-grid";
  grid.setAttribute("aria-label", getCopy().chooseCard);

  getCurrentDraftOptions().forEach((option) => {
    grid.append(createDraftCard(option));
  });

  return grid;
}

function createDraftCard(option: DraftOption): HTMLButtonElement {
  const card = getCardDefinition(option.cardId);
  const localizedCard = getLocalizedCard(activeLocale, card);
  const meta = getCardDisplayMeta(card);
  const placeable = canPlaceDraftCard(option.cardId);
  const boardStatus = getDraftOptionBoardStatus(option.cardId, uiState.draftBoardSlots);
  const button = document.createElement("button");
  const cardClasses = ["unit-card", `unit-card--${meta.archetype}`, `unit-card--${meta.rarity}`];
  if (uiState.selectedDraftCardId === option.cardId) {
    cardClasses.push("unit-card--selected");
  }
  if (uiState.selectedCardInfoSlotIndex === undefined && uiState.selectedCardInfoId === option.cardId) {
    cardClasses.push("unit-card--inspected");
  }

  button.className = cardClasses.join(" ");
  button.type = "button";
  button.disabled = uiState.mode !== "draft" || !placeable;
  button.draggable = false;
  button.title = localizedCard.summary;
  button.dataset.cardId = option.cardId;
  setFocusKey(button, `draft-card-${option.cardId}`);
  button.setAttribute("aria-pressed", String(uiState.selectedDraftCardId === option.cardId));

  button.append(createCardFrame(), createCardArchetypeBadge(meta), createCardBody(card, meta, option));
  if (boardStatus) {
    button.append(createDraftCardBoardStatus(boardStatus, localizedCard.name));
  }
  button.append(createCardDragHandle());

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

function createCardDragHandle(): HTMLElement {
  const handle = document.createElement("span");
  handle.className = "unit-card__drag-handle";
  handle.textContent = "⠿";
  handle.setAttribute("aria-hidden", "true");

  return handle;
}

function createCardInfoPanel(
  cardId: CardId,
  boardUnit?: BoardUnitInspection,
  owner: "player" | "enemy" = "player",
): HTMLElement {
  const copy = getCopy();
  const card = getCardDefinition(cardId);
  const localizedCard = getLocalizedCard(activeLocale, card);
  const meta = getCardDisplayMeta(card);
  const panel = document.createElement("aside");
  panel.className = `card-info-panel unit-card--${meta.archetype} unit-card--${meta.rarity}`;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "draft-card-info-title");

  const closeButton = document.createElement("button");
  closeButton.className = "card-info-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.closeCardInfo);
  setFocusKey(closeButton, "card-info-close");
  closeButton.addEventListener("click", closeCardInfo);

  const title = document.createElement("strong");
  title.className = "card-info-panel__title";
  title.id = "draft-card-info-title";
  title.textContent = `${localizedCard.name}${boardUnit?.upgradeLevel ? " ★" : ""}`;

  const context = boardUnit ? createBoardUnitContext(boardUnit, owner) : undefined;

  const type = createCardMetaRow(meta);
  type.classList.add("card-info-panel__type");

  const stats = createCardStats(card, boardUnit?.upgradeLevel ?? 0);
  stats.classList.add("card-info-panel__stats");

  const art = createCardArt(card, meta);
  art.classList.add("card-info-panel__art");

  const tags = document.createElement("div");
  tags.className = "card-info-panel__tags";
  card.tags.forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.textContent = getTagLabel(activeLocale, tag);
    tags.append(tagEl);
  });

  const summary = document.createElement("p");
  summary.className = "card-info-panel__summary";
  summary.textContent = localizedCard.summary;

  panel.append(closeButton, title);
  if (context) {
    panel.append(context);
  }
  panel.append(type, art, stats, tags, summary);

  if (boardUnit && owner === "player" && uiState.mode === "draft" && !isPvpBoardEditingLocked()) {
    const moveButton = document.createElement("button");
    moveButton.className = "card-info-panel__move";
    moveButton.type = "button";
    moveButton.textContent = copy.moveUnit;
    setFocusKey(moveButton, "card-info-move");
    moveButton.addEventListener("click", () => startKeyboardBoardMove(boardUnit.slotIndex));
    panel.append(moveButton);
  }

  return panel;
}

function createBoardUnitContext(boardUnit: BoardUnitInspection, owner: "player" | "enemy"): HTMLElement {
  const copy = getCopy();
  const context = document.createElement("span");
  context.className = boardUnit.upgradeLevel
    ? "card-info-panel__context card-info-panel__context--upgraded"
    : "card-info-panel__context";
  const position = getFieldPositionLabel(boardUnit.slotIndex);
  context.textContent = [
    owner === "enemy" ? copy.enemyArmy : undefined,
    position,
    boardUnit.upgradeLevel ? copy.upgradedStats : undefined,
  ].filter(Boolean).join(" · ");

  return context;
}

function createRerollButton(): HTMLButtonElement {
  const copy = getCopy();
  const button = document.createElement("button");
  button.className = "reroll-button reroll-button--header";
  button.type = "button";
  button.disabled = !canRerollDraftCards(uiState.run) || isPvpBoardEditingLocked();
  const label = button.disabled ? copy.rerollUsed : copy.reroll;
  const counterLabel = formatMessage(copy.rerollCounter, {
    remaining: button.disabled ? 0 : 1,
  });
  button.textContent = counterLabel;
  button.title = label;
  button.setAttribute("aria-label", `${label}. ${counterLabel}`);
  setFocusKey(button, "reroll");
  button.addEventListener("click", rerollCurrentDraftCards);

  return button;
}

function createDraftCardBoardStatus(status: DraftOptionBoardStatus, cardName: string): HTMLElement {
  const marker = document.createElement("span");
  marker.className = `unit-card__board-status unit-card__board-status--${status}`;
  marker.textContent = status === "upgrade"
    ? `↑ ${getCopy().draftUpgradeAvailable}`
    : `${getCopy().draftAlreadyOnField} ★`;
  marker.setAttribute(
    "aria-label",
    formatMessage(
      status === "upgrade"
        ? getCopy().draftUpgradeAvailableDescription
        : getCopy().draftAlreadyOnFieldDescription,
      { card: cardName },
    ),
  );
  return marker;
}

function createDraftChoicesToggle(): HTMLButtonElement {
  const copy = getCopy();
  const button = document.createElement("button");
  const label = draftChoicesCollapsed ? copy.expandDraftChoices : copy.collapseDraftChoices;
  button.className = "draft-choices-toggle";
  button.type = "button";
  button.textContent = draftChoicesCollapsed ? "▾" : "▴";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", String(!draftChoicesCollapsed));
  button.setAttribute("aria-controls", "draft-options-grid");
  setFocusKey(button, "draft-choices-toggle");
  button.addEventListener("click", toggleDraftChoices);
  return button;
}

function toggleDraftChoices(): void {
  draftChoicesCollapsed = !draftChoicesCollapsed;
  requestFocusAfterRender("draft-choices-toggle");
  render();
}

function createTapPlacementPanel(cardId: CardId): HTMLElement {
  const copy = getCopy();
  const card = getCardDefinition(cardId);
  const localizedCard = getLocalizedCard(activeLocale, card);
  const placementKinds = getDraftPlacementClassifications(cardId).map((placement) => placement.kind);
  const panel = document.createElement("section");
  panel.className = "placement-context-dock placement-context-dock--selection";

  const copyContainer = document.createElement("div");
  copyContainer.className = "placement-context-dock__copy";
  copyContainer.setAttribute("role", "status");
  copyContainer.setAttribute("aria-live", "polite");
  copyContainer.setAttribute("aria-atomic", "true");

  const title = document.createElement("strong");
  title.textContent = formatMessage(copy.selectedCard, { card: localizedCard.name });

  const hint = document.createElement("span");
  hint.textContent = placementKinds.includes("upgrade")
    ? copy.upgradeHint
    : placementKinds.includes("place")
      ? copy.placeHint
      : placementKinds.includes("replace")
        ? copy.replacementHint
        : copy.makeRoomHint;
  copyContainer.append(title, hint);

  const actions = document.createElement("div");
  actions.className = "placement-context-dock__actions";

  const infoButton = document.createElement("button");
  infoButton.className = "placement-context-dock__info";
  infoButton.type = "button";
  infoButton.textContent = "i";
  infoButton.title = copy.cardInfo;
  infoButton.setAttribute("aria-label", copy.cardInfo);
  setFocusKey(infoButton, "selected-card-info");
  infoButton.addEventListener("click", () => openCardInfo(cardId));

  const cancelButton = document.createElement("button");
  cancelButton.className = "placement-context-dock__cancel";
  cancelButton.type = "button";
  cancelButton.textContent = copy.cancelSelection;
  setFocusKey(cancelButton, "selected-card-cancel");
  cancelButton.addEventListener("click", cancelDraftCardSelection);

  actions.append(infoButton, cancelButton);
  panel.append(copyContainer, actions);

  return panel;
}

function createKeyboardMovePanel(sourceSlotIndex: number): HTMLElement {
  const copy = getCopy();
  const source = getDraftBoardSlot(sourceSlotIndex);
  const panel = document.createElement("section");
  panel.className = "placement-context-dock placement-context-dock--move";

  const copyContainer = document.createElement("div");
  copyContainer.className = "placement-context-dock__copy";
  copyContainer.setAttribute("role", "status");
  copyContainer.setAttribute("aria-live", "polite");
  copyContainer.setAttribute("aria-atomic", "true");
  const title = document.createElement("strong");
  const cardName = source?.cardId
    ? getLocalizedCard(activeLocale, getCardDefinition(source.cardId)).name
    : "";
  title.textContent = formatMessage(copy.moveUnitHint, { card: cardName });
  const hint = document.createElement("span");
  hint.textContent = copy.chooseMoveTarget;
  copyContainer.append(title, hint);

  const cancelButton = document.createElement("button");
  cancelButton.className = "placement-context-dock__cancel";
  cancelButton.type = "button";
  cancelButton.textContent = copy.cancelMove;
  setFocusKey(cancelButton, "move-cancel");
  cancelButton.addEventListener("click", cancelKeyboardBoardMove);

  panel.append(copyContainer, cancelButton);
  return panel;
}

function createDraftReplacementOverlay(pending: PendingDraftReplacement): HTMLElement | undefined {
  const placement = classifyDraftPlacement(uiState.draftBoardSlots, pending.cardId, pending.slotIndex);
  if (placement.kind !== "replace") {
    pendingDraftReplacement = undefined;
    return undefined;
  }

  const copy = getCopy();
  const nextCard = getLocalizedCard(activeLocale, getCardDefinition(placement.cardId));
  const replacedCard = getLocalizedCard(activeLocale, getCardDefinition(placement.replacedCardId));
  const replacedName = placement.replacedUpgradeLevel ? `${replacedCard.name} ★` : replacedCard.name;
  const overlay = document.createElement("div");
  overlay.className = "draft-replacement-overlay";

  const panel = document.createElement("section");
  panel.className = "draft-replacement-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "draft-replacement-title");
  panel.setAttribute("aria-describedby", "draft-replacement-body");

  const title = document.createElement("h2");
  title.id = "draft-replacement-title";
  title.textContent = copy.replacementTitle;

  const body = document.createElement("p");
  body.id = "draft-replacement-body";
  body.textContent = formatMessage(copy.replacementBody, {
    old: replacedName,
    card: nextCard.name,
  });

  const matchup = document.createElement("div");
  matchup.className = "draft-replacement-panel__matchup";
  matchup.append(
    createDraftReplacementName(replacedName, "old"),
    createDraftReplacementArrow(),
    createDraftReplacementName(nextCard.name, "new"),
  );

  const actions = document.createElement("div");
  actions.className = "draft-replacement-panel__actions";

  const cancelButton = document.createElement("button");
  cancelButton.className = "draft-replacement-panel__cancel";
  cancelButton.type = "button";
  cancelButton.textContent = copy.cancel;
  cancelButton.addEventListener("click", cancelDraftReplacement);

  const confirmButton = document.createElement("button");
  confirmButton.className = "draft-replacement-panel__confirm";
  confirmButton.type = "button";
  confirmButton.textContent = copy.confirmReplacement;
  confirmButton.addEventListener("click", confirmDraftReplacement);

  actions.append(cancelButton, confirmButton);
  panel.append(title, body, matchup, actions);
  overlay.append(panel);
  queueMicrotask(() => {
    if (cancelButton.isConnected) {
      cancelButton.focus();
    }
  });

  return overlay;
}

function createDraftReplacementName(name: string, variant: "old" | "new"): HTMLElement {
  const label = document.createElement("strong");
  label.className = `draft-replacement-panel__unit draft-replacement-panel__unit--${variant}`;
  label.textContent = name;
  return label;
}

function createDraftReplacementArrow(): HTMLElement {
  const arrow = document.createElement("span");
  arrow.className = "draft-replacement-panel__arrow";
  arrow.textContent = "→";
  arrow.setAttribute("aria-hidden", "true");
  return arrow;
}

function createPvpPanel(): HTMLElement {
  const copy = getCopy();
  const panel = document.createElement("section");
  panel.className = `pvp-panel pvp-panel--${uiState.pvp.status}`;

  const header = document.createElement("div");
  header.className = "pvp-panel__header";

  const title = document.createElement("h2");
  title.textContent = copy.pvpLobbyTitle;

  const status = document.createElement("span");
  status.className = `pvp-status pvp-status--${uiState.pvp.status}`;
  status.textContent = getPvpStatusLabel();

  const closeButton = document.createElement("button");
  closeButton.className = "pvp-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.pvpCloseLobby);
  closeButton.addEventListener("click", requestLeavePvpRoom);

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
  const copy = getCopy();
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  if (uiState.pvp.error) {
    const error = document.createElement("p");
    error.className = "pvp-panel__error";
    error.textContent = uiState.pvp.error;
    body.append(error);
  }

  const intro = document.createElement("p");
  intro.className = "pvp-panel__intro";
  intro.textContent = copy.pvpLobbySubtitle;
  body.append(intro);

  const controls = document.createElement("div");
  controls.className = "pvp-room-controls";

  const input = document.createElement("input");
  input.className = "pvp-room-input";
  input.type = "text";
  input.inputMode = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = 8;
  input.placeholder = copy.pvpRoomCodePlaceholder;
  input.setAttribute("aria-label", copy.pvpRoomCode);
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
  joinButton.textContent = copy.pvpJoinRoom;
  joinButton.addEventListener("click", () => void joinPvpRoomFromInput(input.value));

  const createButton = document.createElement("button");
  createButton.className = "pvp-panel__button pvp-panel__button--primary";
  createButton.type = "button";
  createButton.textContent = copy.pvpCreateRoom;
  createButton.addEventListener("click", () => void createNewPvpRoom());

  controls.append(input, joinButton, createButton);
  if (activePvpSession) {
    const reconnectButton = document.createElement("button");
    reconnectButton.className = "pvp-panel__button";
    reconnectButton.type = "button";
    reconnectButton.textContent = copy.pvpReconnect;
    reconnectButton.addEventListener("click", () => void reconnectSavedPvpSession());
    controls.append(reconnectButton);
  }
  body.append(controls);

  return body;
}

function createPvpConnectingView(): HTMLElement {
  const copy = getCopy();
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  const room = document.createElement("div");
  room.className = "pvp-room-summary";
  room.append(createPvpRoomCodeElement(uiState.pvp.roomId), createPvpPeerCount());

  const notice = document.createElement("p");
  notice.className = "pvp-connection-banner";
  notice.textContent = copy.pvpReconnecting;

  const leaveButton = document.createElement("button");
  leaveButton.className = "pvp-panel__button";
  leaveButton.type = "button";
  leaveButton.textContent = copy.cancel;
  leaveButton.addEventListener("click", requestLeavePvpRoom);

  body.append(room, notice, leaveButton);

  return body;
}

function createPvpConnectedView(): HTMLElement {
  const copy = getCopy();
  const body = document.createElement("div");
  body.className = "pvp-panel__body";

  if (uiState.pvp.error) {
    const error = document.createElement("p");
    error.className = "pvp-connection-banner pvp-connection-banner--error";
    error.textContent = uiState.pvp.error;
    body.append(error);
  }

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
  readyButton.textContent = getCurrentPvpPlayer()?.ready ? copy.pvpCancelReady : copy.pvpReady;
  readyButton.addEventListener("click", () => setPvpReady(!(getCurrentPvpPlayer()?.ready ?? false)));

  const leaveButton = document.createElement("button");
  leaveButton.className = "pvp-panel__button pvp-panel__button--danger";
  leaveButton.type = "button";
  const canForfeit = Boolean(uiState.pvp.match) && !isPvpMatchFinished();
  leaveButton.textContent = canForfeit ? copy.pvpForfeit : copy.pvpLeaveRoom;
  leaveButton.addEventListener("click", canForfeit ? requestPvpForfeit : requestLeavePvpRoom);

  actions.append(readyButton, leaveButton);
  body.append(room, players, actions);

  return body;
}

function createPvpRoomCodeElement(roomId: string): HTMLElement {
  const copy = getCopy();
  const row = document.createElement("div");
  row.className = "pvp-room-code-row";

  const label = document.createElement("span");
  label.className = "pvp-room-code-label";
  label.textContent = copy.pvpRoomCode;

  const code = document.createElement("strong");
  code.className = "pvp-room-code";
  code.textContent = roomId ? roomId.toUpperCase() : "------";

  const copyButton = document.createElement("button");
  copyButton.className = "pvp-copy-button";
  copyButton.type = "button";
  copyButton.disabled = !roomId;
  copyButton.textContent = copy.pvpCopyCode;
  copyButton.addEventListener("click", () => void copyPvpRoomCode(roomId, copyButton));

  row.append(label, code, copyButton);
  return row;
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
  role.textContent = player.role === uiState.pvp.role ? getCopy().pvpPlayer : getCopy().pvpOpponent;

  const state = document.createElement("strong");
  state.className = "pvp-player-slot__state";
  state.textContent = player.connected
    ? (player.ready ? getCopy().pvpSlotReady : getCopy().pvpSlotJoined)
    : getCopy().pvpSlotOpen;

  slot.append(role, state);

  return slot;
}

function createCardName(card: CardDefinition): HTMLElement {
  const name = document.createElement("strong");
  name.className = "unit-card__name";
  name.textContent = getLocalizedCard(activeLocale, card).name;

  return name;
}

function createCardBody(card: CardDefinition, meta: CardDisplayMeta, option?: DraftOption): HTMLElement {
  const body = document.createElement("div");
  body.className = "unit-card__body";

  const footer = document.createElement("div");
  footer.className = "unit-card__footer";
  footer.append(createCardStats(card), createCardAbility(card));

  body.append(
    createCardArt(card, meta),
    createCardHeader(card, meta),
    createCardTagRow(card),
    footer,
  );

  if (option) {
    const synergyForecast = createCardSynergyForecast(option);
    if (synergyForecast) {
      body.append(synergyForecast);
    }
  }

  return body;
}

function createCardTagRow(card: CardDefinition): HTMLElement {
  const row = document.createElement("div");
  row.className = "unit-card__tag-row";
  card.tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.textContent = getTagLabel(activeLocale, tag);
    row.append(tagElement);
  });
  return row;
}

function createCardSynergyForecast(option: DraftOption): HTMLElement | undefined {
  const presentation = getDraftOptionSynergyPresentation(option, uiState.draftBoardSlots);
  if (presentation.placements.length === 0) {
    return undefined;
  }

  const activation = findFirstSynergyActivation(presentation.placements.flatMap((placement) => placement.synergies));
  if (!activation) {
    return undefined;
  }

  const activationIsGuaranteed = presentation.placements.every((placement) =>
    placement.synergies.some((synergy) => synergy.tag === activation.tag && synergy.activatesThreshold),
  );
  const label = document.createElement("span");
  label.className = activationIsGuaranteed
    ? "unit-card__synergy-forecast unit-card__synergy-forecast--guaranteed"
    : "unit-card__synergy-forecast";
  label.textContent = formatMessage(
    activationIsGuaranteed ? getCopy().synergyWillActivate : getCopy().synergyMayActivate,
    {
      tag: getTagLabel(activeLocale, activation.tag),
      before: activation.beforeCount,
      after: activation.afterCount,
    },
  );
  return label;
}

function findFirstSynergyActivation(
  synergies: readonly DraftTagSynergyForecast[],
): DraftTagSynergyForecast | undefined {
  return synergies.find((synergy) => synergy.activatesThreshold);
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
  const localizedName = getLocalizedCard(activeLocale, card).name;
  const art = document.createElement("div");
  art.className = `unit-card__art unit-card__art--${meta.archetype} unit-card__art--${meta.rarity}`;

  const assetPath = getUnitCardAssetPath(card.id) ?? getUnitAssetPath(card.id);
  if (assetPath) {
    const sprite = document.createElement("img");
    sprite.className = "unit-card__sprite";
    sprite.alt = localizedName;
    sprite.decoding = "async";
    sprite.src = assetPath;
    art.append(sprite);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "unit-card__image-placeholder";
    placeholder.textContent = createCardInitials(localizedName);
    art.append(placeholder);
  }

  return art;
}

function createDraftUnitDragGhost(cardId: CardId): HTMLElement {
  const card = getCardDefinition(cardId);
  const localizedName = getLocalizedCard(activeLocale, card).name;
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
    avatar.textContent = createCardInitials(localizedName);
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

function createCardStats(card: CardDefinition, upgradeLevel: BoardSlot["upgradeLevel"] = 0): HTMLElement {
  const copy = getCopy();
  const cardStats: UnitStats = getCardStatsForUpgrade(card, upgradeLevel);
  const stats = document.createElement("div");
  stats.className = "unit-card__stats";

  stats.append(
    createStat(copy.attack, cardStats.attack),
    createStat(copy.hp, cardStats.hp),
    createStat(copy.speed, cardStats.speed),
    createStat(copy.range, cardStats.range),
  );

  return stats;
}

function createCardAbility(card: CardDefinition): HTMLElement {
  const localizedCard = getLocalizedCard(activeLocale, card);
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
  text.textContent = localizedCard.text;
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
    archetypeLabel: getArchetypeLabel(activeLocale, archetype),
    rarity,
    rarityLabel: getRarityLabel(activeLocale, rarity),
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
  const copy = getCopy();
  const slotState = getDraftBoardSlot(slotIndex);
  const cardId = slotState?.cardId ?? null;
  const card = cardId ? getCardDefinition(cardId) : undefined;
  const selectedDraftCardId = getSelectedDraftCardId();
  const placement = selectedDraftCardId
    ? classifyDraftPlacement(uiState.draftBoardSlots, selectedDraftCardId, slotIndex)
    : undefined;
  const isKeyboardMoveSource = keyboardMoveSourceSlotIndex === slotIndex;
  const isKeyboardMoveTarget = keyboardMoveSourceSlotIndex !== undefined &&
    canMoveBoardSlotUnit(keyboardMoveSourceSlotIndex, slotIndex);
  const isKeyboardMoveSwapTarget = isKeyboardMoveTarget && Boolean(card);
  const slot = document.createElement("button");
  const classes = ["field-slot"];
  if (card) {
    classes.push("field-slot--filled");
    classes.push(`field-slot--${getCardArchetype(card)}`);
  }
  if (slotState?.upgradeLevel) {
    classes.push("field-slot--upgraded");
  }
  if (uiState.selectedCardInfoSlotIndex === slotIndex) {
    classes.push("field-slot--inspected");
  }
  if (placement) {
    classes.push(placement.kind === "invalid" ? "field-slot--tap-invalid" : `field-slot--tap-${placement.kind}`);
  }
  if (isKeyboardMoveSource) {
    classes.push("field-slot--move-source");
  } else if (keyboardMoveSourceSlotIndex !== undefined) {
    classes.push(isKeyboardMoveTarget ? "field-slot--move-target" : "field-slot--move-invalid");
    if (isKeyboardMoveSwapTarget) {
      classes.push("field-slot--move-swap");
    }
  }
  slot.className = classes.join(" ");
  slot.type = "button";
  slot.disabled = false;
  if (keyboardMoveSourceSlotIndex !== undefined && !isKeyboardMoveSource && !isKeyboardMoveTarget) {
    slot.tabIndex = -1;
    slot.setAttribute("aria-disabled", "true");
  }
  slot.dataset.fieldSlotIndex = String(slotIndex);
  setFocusKey(slot, `field-slot-${slotIndex}`);
  slot.setAttribute("aria-pressed", String(uiState.selectedCardInfoSlotIndex === slotIndex));
  const slotPosition = getPlayerFieldSlotPosition(slotIndex);
  slot.style.setProperty("--slot-x", `${slotPosition.xPercent}%`);
  slot.style.setProperty("--slot-y", `${slotPosition.yFromBottom}px`);
  slot.style.setProperty("--slot-scale", `${slotPosition.scale}`);
  slot.style.setProperty("--slot-depth", `${slotPosition.depth}`);

  const positionLabel = getFieldPositionLabel(slotIndex);
  if (selectedDraftCardId) {
    const selectedCard = getCardDefinition(selectedDraftCardId);
    const selectedName = getLocalizedCard(activeLocale, selectedCard).name;
    slot.title = placement?.kind === "upgrade"
      ? formatMessage(copy.upgradeCard, { card: selectedName })
      : placement?.kind === "place"
        ? formatMessage(copy.placeCard, { card: selectedName, slot: slotIndex + 1 })
        : placement?.kind === "replace"
          ? formatMessage(copy.replaceCard, {
            old: getLocalizedCard(activeLocale, getCardDefinition(placement.replacedCardId)).name,
            card: selectedName,
            slot: slotIndex + 1,
          })
          : formatMessage(copy.invalidPlacement, { card: selectedName, slot: slotIndex + 1 });
    slot.setAttribute("aria-label", `${slot.title}. ${positionLabel}`);
  } else if (keyboardMoveSourceSlotIndex !== undefined) {
    const localizedName = card
      ? getLocalizedCard(activeLocale, card).name
      : formatMessage(copy.emptySlot, { slot: slotIndex + 1 });
    slot.title = isKeyboardMoveSource
      ? formatMessage(copy.moveUnitHint, { card: localizedName })
      : `${copy.chooseMoveTarget}: ${positionLabel}`;
    slot.setAttribute("aria-label", `${slot.title}. ${localizedName}`);
  } else if (card) {
    const localizedName = getLocalizedCard(activeLocale, card).name;
    slot.title = slotState?.upgradeLevel ? formatMessage(copy.upgradedCard, { card: localizedName }) : localizedName;
    slot.setAttribute("aria-label", `${slot.title}. ${positionLabel}`);
  } else {
    slot.title = formatMessage(copy.emptySlot, { slot: slotIndex + 1 });
    slot.setAttribute("aria-label", `${slot.title}. ${positionLabel}`);
  }

  slot.addEventListener("click", (event) => {
    handleFieldSlotClick(getFieldSlotIndexForClick(event, slotIndex));
  });

  if (card) {
    const unit = createFieldSlotUnit(card, slotState ?? createEmptyDraftBoardSlot(slotIndex));
    slot.append(unit);
    if (!selectedDraftCardId && keyboardMoveSourceSlotIndex === undefined) {
      slot.addEventListener("pointerdown", (event) => startPointerFieldUnitDrag(slotIndex, unit, event));
    }
  }

  if (placement && placement.kind !== "invalid") {
    slot.append(createFieldSlotTargetLabel(placement.kind));
  } else if (isKeyboardMoveTarget) {
    slot.append(createKeyboardMoveTargetLabel(isKeyboardMoveSwapTarget));
  }

  return slot;
}

function createKeyboardMoveTargetLabel(isSwap: boolean): HTMLElement {
  const label = document.createElement("span");
  label.className = isSwap
    ? "field-slot__target-label field-slot__target-label--move field-slot__target-label--move-swap"
    : "field-slot__target-label field-slot__target-label--move";
  label.textContent = getCopy().moveUnit;
  label.setAttribute("aria-hidden", "true");
  return label;
}

function getFieldPositionLabel(slotIndex: number): string {
  const copy = getCopy();
  const row = getFieldSlotRow(slotIndex) === 0 ? copy.frontRow : copy.backRow;
  const columns = [copy.leftColumn, copy.centerColumn, copy.rightColumn] as const;
  const column = columns[getFieldSlotColumn(slotIndex)] ?? copy.centerColumn;

  return formatMessage(copy.fieldPosition, { row, column });
}

function createFieldSlotTargetLabel(kind: Exclude<DraftPlacementClassification["kind"], "invalid">): HTMLElement {
  const copy = getCopy();
  const label = document.createElement("span");
  label.className = `field-slot__target-label field-slot__target-label--${kind}`;
  label.textContent = kind === "upgrade"
    ? copy.upgradeTarget
    : kind === "replace"
      ? copy.replaceTarget
      : copy.placeTarget;
  label.setAttribute("aria-hidden", "true");
  return label;
}

function createFieldSlotUnit(card: CardDefinition, slot: BoardSlot): HTMLElement {
  const copy = getCopy();
  const localizedName = getLocalizedCard(activeLocale, card).name;
  const assetPath = getUnitAssetPath(card.id);
  const unit = document.createElement("div");
  unit.className = assetPath ? "field-unit field-unit--sprite" : "field-unit";
  unit.title = slot.upgradeLevel ? formatMessage(copy.upgradedCard, { card: localizedName }) : localizedName;

  let marker: HTMLElement;
  if (assetPath) {
    const sprite = document.createElement("img");
    sprite.className = "field-unit__sprite";
    sprite.alt = localizedName;
    sprite.decoding = "async";
    sprite.draggable = false;
    sprite.src = assetPath;
    marker = sprite;
  } else {
    marker = document.createElement("span");
    marker.className = `field-unit__avatar field-unit__avatar--${card.role}`;
    marker.textContent = createCardInitials(localizedName);
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
    setFocusKey(fightButton, "fight");
    fightButton.addEventListener("click", fightRound);
    actions.append(fightButton);
  } else if (uiState.mode === "battle") {
    const nextButton = document.createElement("button");
    nextButton.className = "primary-button";
    nextButton.type = "button";
    nextButton.disabled = uiState.playMode === "online" && Boolean(
      isPvpMatchFinished() ? uiState.pvp.match?.self.rematchReady : uiState.pvp.match?.self.nextRoundReady,
    );
    nextButton.textContent = getBattleActionLabel();
    setFocusKey(nextButton, "next-round");
    nextButton.addEventListener("click", goToNextRound);
    actions.append(nextButton);
  } else {
    const newRunButton = document.createElement("button");
    newRunButton.className = "primary-button";
    newRunButton.type = "button";
    if (uiState.playMode === "online") {
      newRunButton.disabled = uiState.pvp.match?.self.rematchReady === true;
      newRunButton.textContent = getBattleActionLabel();
      setFocusKey(newRunButton, "pvp-rematch");
      newRunButton.addEventListener("click", sendPvpRematch);
    } else {
      newRunButton.textContent = getCopy().menu;
      setFocusKey(newRunButton, "return-menu");
      newRunButton.addEventListener("click", returnToMainMenu);
    }
    actions.append(newRunButton);
  }

  if (uiState.playMode === "solo" && uiState.mode !== "finished") {
    actions.classList.add("action-bar--with-abandon");
    actions.append(createAbandonRunButton("action-bar__abandon"));
  } else if (uiState.playMode === "online") {
    actions.classList.add("action-bar--with-abandon");
    actions.append(createPvpExitButton());
  }

  return actions;
}

function createPvpExitButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "action-bar__abandon pvp-panel__button--danger";
  button.type = "button";
  const canForfeit = Boolean(uiState.pvp.match) && !isPvpMatchFinished();
  button.textContent = canForfeit ? getCopy().pvpForfeit : getCopy().pvpLeaveRoom;
  button.addEventListener("click", canForfeit ? requestPvpForfeit : requestLeavePvpRoom);
  return button;
}

function getDraftActionLabel(): string {
  if (uiState.playMode !== "online") {
    return uiState.cardPickedThisRound ? getCopy().fight : getCopy().skipPickAndFight;
  }

  if (isCurrentPvpPlayerSubmitted()) {
    return getCopy().pvpWaitingForOpponent;
  }

  return getCopy().fight;
}

function getBattleActionLabel(): string {
  if (uiState.playMode !== "online") {
    return getCopy().nextRound;
  }

  if (isPvpMatchFinished()) {
    return uiState.pvp.match?.self.rematchReady ? getCopy().pvpWaitingForRematch : getCopy().pvpRematch;
  }

  return uiState.pvp.match?.self.nextRoundReady
    ? getCopy().pvpWaitingForNextRound
    : getCopy().pvpReadyForNextRound;
}

function goToNextRound(): void {
  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  draftChoicesCollapsed = false;
  if (uiState.playMode === "online") {
    if (isPvpMatchFinished()) {
      sendPvpRematch();
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
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    presentedCastleHp: undefined,
    logsOpen: false,
  };
  persistSoloRun();
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
    scenePhaserHostElement.append(createSceneCanvasMessage(getCopy().sceneLoading));
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
    showBattlefieldFallback(getCopy().rendererForced);
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
      key: `draft:${uiState.run.seed}:${uiState.run.round}:${uiState.run.playerHp}:${uiState.run.enemyHp}`,
      playerCastleHp: uiState.run.playerHp,
      enemyCastleHp: uiState.run.enemyHp,
    };
  }

  if (!uiState.lastBattleTimeline) {
    return undefined;
  }

  return {
    type: "battle",
    key: `battle:${uiState.run.seed}:${uiState.lastRound}:${uiState.lastBattleTimeline.events.length}:${uiState.lastBattleTimeline.winner}`,
    timeline: localizeBattleTimeline(uiState.lastBattleTimeline),
  };
}

function createRestoredSoloUiState(snapshot: SoloRunSnapshot): UiState {
  const mode: ScreenMode = snapshot.checkpoint === "finished"
    ? "finished"
    : snapshot.checkpoint === "battle_result"
      ? "battle"
      : "draft";
  const lastRoundRecord = snapshot.checkpoint === "draft" ? undefined : getLastRoundRecord(snapshot.run);

  return {
    ...createInitialUiState(snapshot.run.seed, "solo", mode, snapshot.run.botDifficulty, snapshot.session),
    run: snapshot.run,
    mode,
    draftBoardSlots: cloneBoardSlots(snapshot.draftBoardSlots),
    cardPickedThisRound: snapshot.cardPickedThisRound,
    battleFinished: snapshot.checkpoint !== "draft",
    selectedLogRound: lastRoundRecord?.round,
    lastRound: snapshot.lastRound,
    lastBattleTimeline: createTimelineForRoundRecord(lastRoundRecord),
    soloSession: snapshot.session,
  };
}

function localizeBattleTimeline(timeline: BattleTimeline): BattleTimeline {
  return {
    ...timeline,
    units: timeline.units.map((unit) => ({
      ...unit,
      name: getLocalizedCard(activeLocale, getCardDefinition(unit.cardId)).name,
    })),
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
        showBattlefieldFallback(getCopy().rendererUnavailable);
      });
  });
}

function applyBattlefieldCommand(command: BattlefieldCommand): void {
  if (appliedBattlefieldCommandKey === command.key) {
    return;
  }

  appliedBattlefieldCommandKey = command.key;

  try {
    battlefieldController?.setBattleSpeed(battlePlaybackSpeed);
    if (command.type === "draft") {
      battlefieldController?.showDraft({
        playerCastleHp: command.playerCastleHp,
        enemyCastleHp: command.enemyCastleHp,
      });
      return;
    }

    battlefieldController?.playBattle({
      timeline: command.timeline,
      onFinished: handleBattlefieldFinished,
      onError: handleBattlefieldError,
      onCastleHpChanged: handleBattleCastleHpChanged,
      blockLabel: getCopy().blockFeedback,
      abilityCalloutLabels: createBattleAbilityCalloutLabels(),
      reducedMotion: prefersReducedBattleMotion(window),
    });
  } catch (error: unknown) {
    console.error("Failed to apply Phaser battlefield command", error);
    showBattlefieldFallback(getCopy().rendererInterrupted);
  }
}

function createBattleAbilityCalloutLabels(): BattleAbilityCalloutLabels {
  const copy = getCopy();
  return {
    battle_banner: copy.battleCalloutBanner,
    thorn_guard: copy.battleCalloutThorns,
    pack_hunter: copy.battleCalloutPack,
    frost_hex: copy.battleCalloutFrost,
    shield_wall: copy.battleCalloutArmor,
    stone_skin: copy.battleCalloutArmor,
    riposte: copy.battleCalloutArmor,
    bone_pact: copy.battleCalloutBonePact,
  };
}

function handleBattleCastleHpChanged(owner: Owner, hp: number): void {
  if (uiState.mode !== "battle" && uiState.mode !== "finished") {
    return;
  }

  const previous = uiState.presentedCastleHp ?? {
    player: getTimelineCastleHp(uiState.lastBattleTimeline, "player", "start") ?? uiState.run.playerHp,
    enemy: getTimelineCastleHp(uiState.lastBattleTimeline, "enemy", "start") ?? uiState.run.enemyHp,
  };
  const nextHp = Math.max(0, Math.trunc(hp));
  uiState = {
    ...uiState,
    presentedCastleHp: {
      ...previous,
      [owner]: nextHp,
    },
  };

  const metricKey = owner === "player" ? "player-hp" : "enemy-hp";
  const metric = document.querySelector<HTMLElement>(`[data-hud-metric="${metricKey}"]`);
  if (metric) {
    metric.textContent = String(nextHp);
  }

  const liveRegion = document.querySelector<HTMLElement>("[data-game-live-status]");
  if (liveRegion) {
    liveRegion.textContent = `${owner === "player" ? getCopy().yourHp : getCopy().enemyHp}: ${nextHp}`;
  }
}

function handleBattlefieldFinished(): void {
  completeBattlePresentation();
}

function handleBattlefieldError(error: unknown): void {
  console.error("Phaser battle presentation failed", error);
  showBattlefieldFallback(getCopy().rendererInterrupted);
}

function completeBattlePresentation(notice?: string): void {
  if (uiState.mode !== "battle" && uiState.mode !== "finished") {
    return;
  }

  if (uiState.battleFinished) {
    return;
  }

  clearBattlePresentationWatchdog();
  const finalHp = {
    player: getTimelineCastleHp(uiState.lastBattleTimeline, "player", "final") ?? uiState.run.playerHp,
    enemy: getTimelineCastleHp(uiState.lastBattleTimeline, "enemy", "final") ?? uiState.run.enemyHp,
  };
  requestFocusAfterRender(uiState.mode === "finished" ? "terminal-result" : "next-round");

  uiState = {
    ...uiState,
    battleFinished: true,
    battlePresentationNotice: notice,
    selectedLogRound: uiState.lastRound,
    presentedCastleHp: finalHp,
  };
  render();
}

function getTimelineCastleHp(
  timeline: BattleTimeline | undefined,
  owner: Owner,
  phase: "start" | "final",
): number | undefined {
  const castle = timeline?.castles.find((candidate) => candidate.owner === owner);
  return phase === "start" ? castle?.startHp : castle?.finalHp;
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
      ? getCopy().battleResultReady
      : getCopy().battlefieldUnavailable;
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

    completeBattlePresentation(getCopy().rendererTimeout);
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
  const copy = getCopy();
  const combat = log.combatResult;
  const summary = document.createElement("div");
  summary.className = `battle-summary battle-summary--${combat.winner}`;

  const winner = document.createElement("strong");
  winner.textContent = combat.winner === "player"
    ? copy.roundVictory
    : combat.winner === "enemy"
      ? copy.roundDefeat
      : copy.roundDraw;

  const detail = document.createElement("span");
  detail.textContent = getBattleSummaryDetail(log);

  summary.append(winner, detail, createEventPills(combat));

  return summary;
}

function getBattleSummaryDetail(log: RoundRecord): string {
  const copy = getCopy();
  const playerHpLoss = Math.max(0, log.playerHpBefore - log.playerHpAfter);
  if (typeof log.enemyHpBefore === "number" && typeof log.enemyHpAfter === "number") {
    const enemyHpLoss = Math.max(0, log.enemyHpBefore - log.enemyHpAfter);

    return `${copy.yourHp} -${playerHpLoss} | ${copy.enemyHp} -${enemyHpLoss} | ${log.combatResult.actions} ${copy.actions}`;
  }

  return `${copy.hpLoss} ${log.combatResult.hpLoss} | ${log.combatResult.actions} ${copy.actions}`;
}

function createEventPills(combat: CombatResult): HTMLElement {
  const pills = document.createElement("div");
  pills.className = "event-pills";

  const counts = countEvents(combat);
  Object.entries(counts).forEach(([type, count]) => {
    const pill = document.createElement("span");
    pill.textContent = `${getCombatEventLabel(activeLocale, type as LocalizedCombatEvent)} ${count}`;
    pills.append(pill);
  });

  return pills;
}

function createMatchupList(playerSlots: readonly BoardSlot[], enemySlots: readonly BoardSlot[]): HTMLElement {
  const copy = getCopy();
  const matchup = document.createElement("div");
  matchup.className = "matchup";

  const player = document.createElement("div");
  player.className = "matchup__side";
  player.append(createMatchupTitle(copy.you), createCompactCards(playerSlots));

  const enemy = document.createElement("div");
  enemy.className = "matchup__side";
  const enemyTitle = uiState.playMode === "solo"
    ? `${copy.bot} · ${getBotDifficultyLabel(uiState.run.botDifficulty)}`
    : copy.bot;
  enemy.append(createMatchupTitle(enemyTitle), createCompactCards(enemySlots));

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
    const localizedCard = getLocalizedCard(activeLocale, card);
    const stats = getCardStatsForUpgrade(card, slot.upgradeLevel);
    const item = document.createElement("div");
    item.className = "compact-card";
    item.textContent = `${localizedCard.name}${slot.upgradeLevel ? " ★" : ""} ${stats.attack}/${stats.hp}`;
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

function createEmptyDraftBoardSlot(slotIndex: number): BoardSlot {
  return { slotIndex, cardId: null, upgradeLevel: 0 };
}

function canFightRound(): boolean {
  if (
    uiState.mode !== "draft" ||
    getFilledSlotCount() === 0 ||
    getSelectedDraftCardId() ||
    keyboardMoveSourceSlotIndex !== undefined
  ) {
    return false;
  }

  if (uiState.playMode !== "online") {
    return true;
  }

  return uiState.pvp.status === "connected" &&
    uiState.pvp.match?.phase === "draft" &&
    !isCurrentPvpPlayerSubmitted();
}

function getCurrentDraftOption(cardId: CardId): DraftOption | undefined {
  return getCurrentDraftOptions().find((option) => option.cardId === cardId);
}

function getCurrentDraftOptions(): DraftOption[] {
  if (uiState.cardPickedThisRound) {
    return [];
  }

  return uiState.run.draftOptions;
}

function isPvpBoardEditingLocked(): boolean {
  return uiState.playMode === "online" && uiState.pvp.match?.self.locked === true;
}

function canPlaceDraftCard(cardId: CardId): boolean {
  if (uiState.mode !== "draft" || uiState.cardPickedThisRound || isPvpBoardEditingLocked()) {
    return false;
  }

  return getCurrentDraftOptions().some((option) => option.cardId === cardId);
}

function getDraftPlacementClassifications(cardId: CardId): DraftPlacementClassification[] {
  return uiState.draftBoardSlots.map((slot) => classifyDraftPlacement(uiState.draftBoardSlots, cardId, slot.slotIndex));
}

function requestDraftPlacement(cardId: CardId, slotIndex: number): void {
  if (uiState.mode !== "draft" || isPvpBoardEditingLocked()) {
    return;
  }

  const draftOption = getCurrentDraftOption(cardId);
  if (!draftOption) {
    return;
  }

  const placement = classifyDraftPlacement(uiState.draftBoardSlots, cardId, slotIndex);
  if (placement.kind === "replace") {
    pendingDraftReplacement = { cardId, slotIndex };
    render();
    return;
  }

  applyDraftCardInSlot(cardId, slotIndex, false);
}

function applyDraftCardInSlot(cardId: CardId, slotIndex: number, allowReplacement: boolean): void {
  if (uiState.mode !== "draft" || isPvpBoardEditingLocked() || !getCurrentDraftOption(cardId)) {
    if (allowReplacement) {
      pendingDraftReplacement = undefined;
      render();
    }
    return;
  }

  const result = applyDraftPlacement(uiState.draftBoardSlots, cardId, slotIndex, { allowReplacement });
  if (!result.applied) {
    if (allowReplacement) {
      pendingDraftReplacement = undefined;
      render();
    }
    return;
  }

  if (uiState.playMode === "online") {
    const context = getPvpMatchIntentContext();
    if (!context) {
      return;
    }
    sendPvpIntent({
      type: "pick",
      ...context,
      cardId,
      targetSlotIndex: slotIndex,
      allowReplacement,
    });
    pendingDraftReplacement = undefined;
    keyboardMoveSourceSlotIndex = undefined;
    return;
  }

  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  requestFocusAfterRender("fight");
  uiState = {
    ...uiState,
    draftBoardSlots: result.boardSlots,
    cardPickedThisRound: true,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  persistSoloRun();
  render();
}

function confirmDraftReplacement(): void {
  const pending = pendingDraftReplacement;
  if (!pending) {
    return;
  }

  applyDraftCardInSlot(pending.cardId, pending.slotIndex, true);
}

function cancelDraftReplacement(): void {
  const pending = pendingDraftReplacement;
  if (!pending) {
    return;
  }

  pendingDraftReplacement = undefined;
  render();
  queueMicrotask(() => {
    document.querySelector<HTMLElement>(`[data-field-slot-index="${pending.slotIndex}"]`)?.focus();
  });
}

function handleDraftCardClick(cardId: CardId): void {
  if (suppressNextCardClick) {
    suppressNextCardClick = false;
    return;
  }

  if (!canPlaceDraftCard(cardId)) {
    return;
  }

  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  const firstValidTarget = getDraftPlacementClassifications(cardId).find((placement) => placement.kind !== "invalid");
  if (firstValidTarget) {
    requestFocusAfterRender(`field-slot-${firstValidTarget.targetSlotIndex}`);
  }
  uiState = {
    ...uiState,
    selectedDraftCardId: cardId,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  render();
}

function handleFieldSlotClick(slotIndex: number): void {
  if (suppressNextCardClick) {
    suppressNextCardClick = false;
    return;
  }

  if (keyboardMoveSourceSlotIndex !== undefined) {
    if (slotIndex === keyboardMoveSourceSlotIndex) {
      cancelKeyboardBoardMove();
    } else {
      moveBoardSlotUnit(keyboardMoveSourceSlotIndex, slotIndex);
    }
    return;
  }

  const selectedDraftCardId = getSelectedDraftCardId();
  if (selectedDraftCardId) {
    requestDraftPlacement(selectedDraftCardId, slotIndex);
    return;
  }

  openBoardCardInfo(slotIndex);
}

function cancelDraftCardSelection(): void {
  const selectedDraftCardId = getSelectedDraftCardId();
  pendingDraftReplacement = undefined;
  uiState = {
    ...uiState,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  if (selectedDraftCardId) {
    requestFocusAfterRender(`draft-card-${selectedDraftCardId}`);
  }
  render();
}

function openCardInfo(cardId: CardId): void {
  if (!getCurrentDraftOption(cardId)) {
    return;
  }

  uiState = {
    ...uiState,
    selectedCardInfoId: cardId,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
    logsOpen: false,
  };
  requestFocusAfterRender("card-info-close");
  render();
}

function openBoardCardInfo(slotIndex: number): void {
  if (!getBoardUnitInspection(uiState.draftBoardSlots, slotIndex)) {
    return;
  }

  uiState = {
    ...uiState,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: slotIndex,
    selectedEnemyCardInfoSlotIndex: undefined,
    logsOpen: false,
  };
  requestFocusAfterRender("card-info-close");
  render();
}

function getSelectedBoardUnitInspection(): BoardUnitInspection | undefined {
  if (uiState.selectedCardInfoSlotIndex === undefined) {
    return undefined;
  }

  return getBoardUnitInspection(uiState.draftBoardSlots, uiState.selectedCardInfoSlotIndex);
}

function getSelectedEnemyUnitInspection(): BoardUnitInspection | undefined {
  if (uiState.selectedEnemyCardInfoSlotIndex === undefined) {
    return undefined;
  }

  return getBoardUnitInspection(uiState.run.enemyBoardSlots, uiState.selectedEnemyCardInfoSlotIndex);
}

function closeCardInfo(): void {
  const boardSlotIndex = uiState.selectedCardInfoSlotIndex;
  const enemySlotIndex = uiState.selectedEnemyCardInfoSlotIndex;
  const draftCardId = uiState.selectedCardInfoId;
  uiState = {
    ...uiState,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  if (boardSlotIndex !== undefined) {
    requestFocusAfterRender(`field-slot-${boardSlotIndex}`);
  } else if (enemySlotIndex !== undefined) {
    requestFocusAfterRender(`enemy-army-slot-${enemySlotIndex}`);
  } else if (draftCardId) {
    requestFocusAfterRender(
      getSelectedDraftCardId() === draftCardId ? "selected-card-info" : `draft-card-${draftCardId}`,
    );
  }
  render();
}

function isCardInfoOpen(): boolean {
  return Boolean(
    uiState.selectedCardInfoId ||
    uiState.selectedCardInfoSlotIndex !== undefined ||
    uiState.selectedEnemyCardInfoSlotIndex !== undefined
  );
}

function startKeyboardBoardMove(sourceSlotIndex: number): void {
  if (uiState.mode !== "draft" || isPvpBoardEditingLocked() || !getDraftBoardSlot(sourceSlotIndex)?.cardId) {
    return;
  }

  const firstTarget = uiState.draftBoardSlots.find((slot) => canMoveBoardSlotUnit(sourceSlotIndex, slot.slotIndex));
  keyboardMoveSourceSlotIndex = sourceSlotIndex;
  pendingDraftReplacement = undefined;
  uiState = {
    ...uiState,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  requestFocusAfterRender(firstTarget ? `field-slot-${firstTarget.slotIndex}` : `field-slot-${sourceSlotIndex}`);
  render();
}

function cancelKeyboardBoardMove(): void {
  const sourceSlotIndex = keyboardMoveSourceSlotIndex;
  if (sourceSlotIndex === undefined) {
    return;
  }

  keyboardMoveSourceSlotIndex = undefined;
  requestFocusAfterRender(`field-slot-${sourceSlotIndex}`);
  render();
}

function rerollCurrentDraftCards(): void {
  if (uiState.mode !== "draft" || uiState.cardPickedThisRound || isPvpBoardEditingLocked() || !canRerollDraftCards(uiState.run)) {
    return;
  }

  pendingDraftReplacement = undefined;
  if (uiState.playMode === "online") {
    const context = getPvpMatchIntentContext();
    if (context) {
      sendPvpIntent({ type: "reroll", ...context });
    }
    return;
  }

  uiState = {
    ...uiState,
    run: rerollDraftCards(uiState.run),
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  persistSoloRun();
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
    const placementKind = slotIndex === undefined
      ? undefined
      : classifyDraftPlacement(uiState.draftBoardSlots, cardId, slotIndex).kind;
    setFieldSlotDropTarget(slotIndex, placementKind, slotHitTargets);
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
      requestDraftPlacement(cardId, slotIndex);
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
  if (uiState.mode !== "draft" || isPvpBoardEditingLocked() || fromSlotIndex === toSlotIndex || !canDropIntoSlot(toSlotIndex)) {
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


  if (uiState.playMode === "online") {
    const context = getPvpMatchIntentContext();
    if (!context) {
      return;
    }
    sendPvpIntent({
      type: "move",
      ...context,
      sourceSlotIndex: fromSlotIndex,
      targetSlotIndex: toSlotIndex,
    });
    keyboardMoveSourceSlotIndex = undefined;
    return;
  }

  const sourceCardId = source.cardId;
  const sourceUpgradeLevel = source.upgradeLevel;
  source.cardId = target.cardId;
  source.upgradeLevel = target.cardId ? target.upgradeLevel : 0;
  target.cardId = sourceCardId;
  target.upgradeLevel = sourceUpgradeLevel;

  keyboardMoveSourceSlotIndex = undefined;
  requestFocusAfterRender(`field-slot-${toSlotIndex}`);
  uiState = {
    ...uiState,
    draftBoardSlots,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
  };
  persistSoloRun();
  render();
}

function startPointerFieldUnitDrag(fromSlotIndex: number, source: HTMLElement, event: PointerEvent): void {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (uiState.mode !== "draft" || isPvpBoardEditingLocked() || !getDraftBoardSlot(fromSlotIndex)?.cardId) {
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
    const moveKind = slotIndex === undefined
      ? undefined
      : canMoveBoardSlotUnit(fromSlotIndex, slotIndex)
        ? "place"
        : "invalid";
    setFieldSlotDropTarget(slotIndex, moveKind, slotHitTargets);
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
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      },
      hitRect: {
        left: rect.left - hitPadding,
        top: rect.top - hitPadding,
        right: rect.right + hitPadding,
        bottom: rect.bottom + hitPadding,
      },
      anchor: {
        x: (rect.left + rect.right) / 2,
        y: rect.bottom - rect.height * FIELD_SLOT_BASE_CENTER_FROM_BOTTOM_RATIO,
      },
    });
  });

  return targets;
}

function getFieldSlotIndexAtPoint(
  clientX: number,
  clientY: number,
  targets: readonly FieldSlotHitTarget[],
): number | undefined {
  return findNearestSlotHitTarget({ x: clientX, y: clientY }, targets)?.slotIndex;
}

function getFieldSlotIndexForClick(event: MouseEvent, fallbackSlotIndex: number): number {
  return resolveFieldSlotIndexForClick(
    event,
    fallbackSlotIndex,
    createFieldSlotHitTargets(false),
  );
}

function canDropIntoSlot(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < BOARD_SLOT_COUNT;
}

function canMoveBoardSlotUnit(fromSlotIndex: number, toSlotIndex: number | undefined): boolean {
  if (isPvpBoardEditingLocked() || toSlotIndex === undefined || fromSlotIndex === toSlotIndex || !canDropIntoSlot(toSlotIndex)) {
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
  kind?: DraftPlacementClassification["kind"],
  targets: readonly FieldSlotHitTarget[] = [],
): void {
  const nextSlotIndex = slotIndex !== undefined && canDropIntoSlot(slotIndex) ? slotIndex : undefined;
  const nextKind = nextSlotIndex === undefined ? undefined : (kind ?? "invalid");
  if (activeFieldSlotDropTarget.slotIndex === nextSlotIndex && activeFieldSlotDropTarget.kind === nextKind) {
    return;
  }

  activeFieldSlotDropTarget.element?.classList.remove(
    "field-slot--drop-place",
    "field-slot--drop-upgrade",
    "field-slot--drop-replace",
    "field-slot--drop-invalid",
  );
  activeFieldSlotDropTarget.element?.querySelector(":scope > .field-slot__drop-label")?.remove();
  activeFieldSlotDropTarget = {};

  if (nextSlotIndex === undefined || nextKind === undefined) {
    return;
  }

  const element =
    targets.find((target) => target.slotIndex === nextSlotIndex)?.element ??
    document.querySelector<HTMLElement>(`[data-field-slot-index="${nextSlotIndex}"]`) ??
    undefined;

  if (!element) {
    return;
  }

  element.classList.add(`field-slot--drop-${nextKind}`);
  if (nextKind !== "invalid") {
    const label = createFieldSlotTargetLabel(nextKind);
    label.classList.add("field-slot__drop-label");
    element.append(label);
  }
  activeFieldSlotDropTarget = { slotIndex: nextSlotIndex, kind: nextKind, element };
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

  if (!uiState.cardPickedThisRound && !window.confirm(getCopy().skipPickConfirm)) {
    return;
  }

  pendingDraftReplacement = undefined;
  keyboardMoveSourceSlotIndex = undefined;
  const playedRound = uiState.run.round;
  const combatReadyRun = chooseDraftCards(uiState.run, uiState.draftBoardSlots);
  const nextRun = resolveRound(combatReadyRun);
  const lastRoundRecord = getLastRoundRecord(nextRun);
  const lastBattleTimeline = createTimelineForRoundRecord(lastRoundRecord);
  const presentedCastleHp = {
    player: getTimelineCastleHp(lastBattleTimeline, "player", "start") ?? combatReadyRun.playerHp,
    enemy: getTimelineCastleHp(lastBattleTimeline, "enemy", "start") ?? combatReadyRun.enemyHp,
  };
  const currentSoloSession = requireSoloRunSession();
  const soloSession = nextRun.status === "finished"
    ? completeSoloRunSession(currentSoloSession, Math.max(Date.now(), currentSoloSession.startedAt))
    : currentSoloSession;

  uiState = {
    ...uiState,
    run: nextRun,
    mode: nextRun.status === "finished" ? "finished" : "battle",
    draftBoardSlots: cloneBoardSlots(nextRun.boardSlots),
    cardPickedThisRound: false,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: playedRound,
    lastBattleTimeline,
    presentedCastleHp,
    soloSession,
  };
  persistSoloRun();
  if (nextRun.status === "finished") {
    ensureFinishedSoloRunRecorded();
  }
  render();
}

function getLastRoundRecord(run: RunState): RoundRecord | undefined {
  return run.roundHistory[run.roundHistory.length - 1];
}

function createTimelineForRoundRecord(record: RoundRecord | undefined): BattleTimeline | undefined {
  if (!record) {
    return undefined;
  }

  return createBattleTimeline({
    playerSlots: record.playerSlots,
    enemySlots: record.enemySlots,
    combat: record.combatResult,
    playerCastleHpBefore: record.playerHpBefore,
    playerCastleHpAfter: record.playerHpAfter,
    enemyCastleHpBefore: record.enemyHpBefore,
    enemyCastleHpAfter: record.enemyHpAfter,
  });
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

async function createNewPvpRoom(): Promise<void> {
  pvpAutomaticReconnectUsed = false;
  updatePvpState({ panelOpen: true, status: "connecting", error: undefined });
  try {
    await acceptPvpBootstrap(await createPvpRoom(PVP_API_ORIGIN));
  } catch (error) {
    handlePvpRequestError(error);
  }
}

async function joinPvpRoomFromInput(rawRoomId: string): Promise<void> {
  const roomId = normalizePvpRoomId(rawRoomId);
  if (!roomId) {
    updatePvpState({ panelOpen: true, status: "error", error: getCopy().pvpErrorInvalidCode });
    return;
  }

  pvpAutomaticReconnectUsed = false;

  updatePvpState({
    panelOpen: true,
    status: "connecting",
    roomId,
    roomInput: roomId.toUpperCase(),
    error: undefined,
  });
  try {
    await acceptPvpBootstrap(await joinPvpRoom(PVP_API_ORIGIN, roomId));
  } catch (error) {
    handlePvpRequestError(error);
  }
}

async function reconnectSavedPvpSession(automatic = false): Promise<void> {
  const session = loadPvpSession(pvpSessionStorage);
  if (!session) {
    return;
  }
  if (!automatic) {
    pvpAutomaticReconnectUsed = false;
  }

  updatePvpState({
    panelOpen: true,
    status: "connecting",
    roomId: session.roomId,
    roomInput: session.roomId.toUpperCase(),
    role: session.seat,
    error: undefined,
  });
  try {
    await acceptPvpBootstrap(await reconnectPvpRoom(PVP_API_ORIGIN, session));
  } catch (error) {
    if (error instanceof PvpRequestError && ["invalid_token", "room_not_found"].includes(error.code)) {
      activePvpSession = undefined;
      clearPvpSession(pvpSessionStorage);
    }
    handlePvpRequestError(error, true);
  }
}

async function acceptPvpBootstrap(bootstrap: PvpBootstrapResponse): Promise<void> {
  if (hasUnsupportedPvpRuleset(bootstrap.snapshot)) {
    throw new PvpRequestError("stale_match", 200);
  }
  const snapshot = readPvpRoomSnapshot(bootstrap.snapshot);
  if (!snapshot) {
    throw new PvpRequestError("bad_response", 200);
  }
  const session: PvpSessionCredentials = {
    version: 1,
    roomId: bootstrap.roomId,
    seat: bootstrap.seat,
    seatToken: bootstrap.seatToken,
  };
  activePvpSession = session;
  savePvpSession(pvpSessionStorage, session);
  applyPvpServerState({
    panelOpen: true,
    status: "connecting",
    roomId: session.roomId,
    roomInput: session.roomId.toUpperCase(),
    role: session.seat,
    error: undefined,
  }, snapshot);
  connectPvpSocket(session, bootstrap.socketTicket);
}

function handlePvpRequestError(error: unknown, reconnecting = false): void {
  const code = error instanceof PvpRequestError ? error.code : "internal_error";
  updatePvpState({
    panelOpen: true,
    status: "error",
    error: reconnecting && code === "connection_failed" ? getCopy().pvpErrorReconnectFailed : getPvpErrorCopy(code),
  });
}

function getPvpErrorCopy(code: string | undefined): string {
  const copy = getCopy();
  const messages: Record<string, string> = {
    bad_request: copy.pvpErrorBadRequest,
    bad_response: copy.pvpErrorBadMessage,
    invalid_room_code: copy.pvpErrorInvalidCode,
    room_not_found: copy.pvpErrorRoomNotFound,
    room_full: copy.pvpErrorRoomFull,
    invalid_token: copy.pvpErrorInvalidToken,
    stale_match: copy.pvpErrorStaleMatch,
    action_rejected: copy.pvpErrorActionRejected,
    rate_limited: copy.pvpErrorRateLimited,
    message_too_large: copy.pvpErrorBadRequest,
    pvp_disabled: copy.pvpErrorDisabled,
    origin_forbidden: copy.pvpErrorOriginForbidden,
    connection_failed: copy.pvpErrorConnectionFailed,
    internal_error: copy.pvpErrorInternal,
  };
  return messages[code ?? ""] ?? copy.pvpErrorRoom;
}

function connectPvpSocket(session: PvpSessionCredentials, socketTicket: string): void {
  closePvpSocket();
  const socket = new WebSocket(createPvpSocketUrl(session.roomId, socketTicket, PVP_API_ORIGIN, window.location.origin));
  pvpSocket = socket;
  pvpSocketCloseExpected = false;

  socket.addEventListener("message", handlePvpSocketMessage);
  socket.addEventListener("open", () => {
    if (pvpSocket === socket) {
      sendPvpIntent({ type: "ping" });
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

    const shouldReconnect = Boolean(activePvpSession) && !pvpAutomaticReconnectUsed;
    updatePvpState({
      panelOpen: true,
      status: shouldReconnect ? "connecting" : "error",
      connectedPeers: 0,
      players: createEmptyPvpPlayerSlots(),
      error: getCopy().pvpErrorConnectionClosed,
    });
    if (shouldReconnect) {
      pvpAutomaticReconnectUsed = true;
      void reconnectSavedPvpSession(true);
    }
  });
  socket.addEventListener("error", () => {
    if (pvpSocket === socket) {
      updatePvpState({ error: getCopy().pvpErrorConnectionFailed });
    }
  });
}

function disconnectPvpRoom(clearSession = false): void {
  closePvpSocket();
  if (clearSession) {
    activePvpSession = undefined;
    clearPvpSession(pvpSessionStorage);
  }
  updatePvpState(createInitialPvpState(true));
}

function requestLeavePvpRoom(): void {
  const copy = getCopy();
  if (uiState.pvp.match && !isPvpMatchFinished() && !window.confirm(copy.pvpLeaveRoomConfirm)) {
    return;
  }

  sendPvpIntent({ type: "leave" });
  disconnectPvpRoom(true);
  returnToMainMenu();
}

function requestPvpForfeit(): void {
  const match = uiState.pvp.match;
  if (!match || !window.confirm(getCopy().pvpForfeitConfirm)) {
    return;
  }

  sendPvpIntent({ type: "forfeit", matchId: match.matchId, round: match.round });
}

async function copyPvpRoomCode(roomId: string, button: HTMLButtonElement): Promise<void> {
  if (!roomId) {
    return;
  }

  try {
    await navigator.clipboard.writeText(roomId.toUpperCase());
    button.textContent = getCopy().pvpCodeCopied;
  } catch {
    updatePvpState({ error: getCopy().pvpErrorCopyFailed });
  }
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
  sendPvpIntent({ type: "set_ready", ready });
}

function submitPvpBoard(): void {
  const match = uiState.pvp.match;
  if (
    !match ||
    match.phase !== "draft" ||
    !pvpSocket ||
    pvpSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  sendPvpIntent({ type: "lock", matchId: match.matchId, round: match.round });
}

function sendPvpNextRound(): void {
  const match = uiState.pvp.match;
  if (!match) {
    return;
  }

  sendPvpIntent({ type: "next_ready", matchId: match.matchId, round: match.round });
}

function sendPvpRematch(): void {
  const match = uiState.pvp.match;
  if (match) {
    sendPvpIntent({ type: "rematch", matchId: match.matchId, round: match.round });
  }
}

function getPvpMatchIntentContext(): { matchId: string; round: number } | undefined {
  const match = uiState.pvp.match;
  return match ? { matchId: match.matchId, round: match.round } : undefined;
}

function sendPvpIntent(intent: PvpClientIntent): boolean {
  if (!pvpSocket || pvpSocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  pvpSocket.send(JSON.stringify(intent));
  return true;
}

function handlePvpSocketMessage(event: MessageEvent): void {
  if (typeof event.data !== "string") {
    return;
  }

  let message: PvpServerMessage;
  try {
    message = JSON.parse(event.data) as PvpServerMessage;
  } catch {
    updatePvpState({ status: "error", error: getCopy().pvpErrorBadMessage });
    return;
  }

  if (message.type === "error") {
    updatePvpState({ error: getPvpErrorCopy(message.code) });
    return;
  }

  if (hasUnsupportedPvpRuleset(message.snapshot)) {
    closePvpSocket();
    updatePvpState({ panelOpen: true, status: "error", error: getCopy().pvpErrorStaleMatch });
    return;
  }

  const snapshot = readPvpRoomSnapshot(message.snapshot);
  const nextState: Partial<PvpState> = {};
  if ((message.type === "connected" || message.type === "snapshot") && isPvpPlayerRole(message.seat)) {
    nextState.role = message.seat;
  }

  if (snapshot) {
    nextState.status = "connected";
    nextState.roomId = snapshot.roomId;
    nextState.roomInput = snapshot.roomId.toUpperCase();
    nextState.connectedPeers = snapshot.connectedPeers;
    nextState.players = snapshot.players;
    nextState.match = snapshot.match;
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
  if (match.phase === "finished") {
    return applyPvpFinishedSnapshot(state, match);
  }

  if (match.phase === "battle" && match.combat) {
    return applyPvpBattleSnapshot(state, match);
  }

  return applyPvpDraftSnapshot(state, match);
}

function applyPvpDraftSnapshot(state: UiState, match: PvpMatchSnapshot): UiState {
  if (match.self.locked) {
    activePointerDrag?.cleanup();
    pendingDraftReplacement = undefined;
    keyboardMoveSourceSlotIndex = undefined;
  }
  const boardSlots = cloneBoardSlots(match.self.pendingBoardSlots ?? match.self.boardSlots);
  const run = createPvpDraftRun(state, match, boardSlots);

  return {
    ...state,
    run,
    mode: "draft",
    draftBoardSlots: cloneBoardSlots(boardSlots),
    cardPickedThisRound: Boolean(match.self.pickedCardId),
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    presentedCastleHp: undefined,
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

  // `state` already contains the incoming server patch; `uiState` is the last rendered snapshot.
  const previousMatch = uiState.pvp.match;
  if (isSamePresentedPvpBattle(state.mode, previousMatch, match)) {
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
    seed: state.run.seed,
    round: match.round,
    playerHp: perspective.playerCastleHpAfter,
    enemyHp: perspective.enemyCastleHpAfter,
    outcome: null,
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
    selectedCardInfoSlotIndex: undefined,
    selectedEnemyCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: match.round,
    lastBattleTimeline,
    presentedCastleHp: {
      player: perspective.playerCastleHpBefore,
      enemy: perspective.enemyCastleHpBefore,
    },
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
  const localSeed = `pvp:${match.matchId}:${match.self.role}`;
  return {
    ...createRun(localSeed),
    round: match.round,
    playerHp: getPvpPlayerHp(match, state.pvp.role),
    enemyHp: getPvpEnemyHp(match, state.pvp.role),
    outcome: null,
    status: "draft",
    draftOptions: match.self.draftOptions.map((option) => ({ ...option })),
    draftRerollCount: match.self.draftRerollCount,
    boardSlots: cloneBoardSlots(boardSlots),
    enemyBoardSlots: match.opponent.boardSlots ? cloneBoardSlots(match.opponent.boardSlots) : createEmptyBoardSlots(),
    roundHistory: state.run.seed === localSeed ? state.run.roundHistory : [],
  };
}

function getPvpPlayerHp(match: PvpMatchSnapshot, role: PvpPlayerRole | undefined): number {
  if (role === "guest") {
    return match.guestHp;
  }

  return match.hostHp;
}

function getPvpEnemyHp(match: PvpMatchSnapshot, role: PvpPlayerRole | undefined): number {
  if (role === "guest") {
    return match.hostHp;
  }

  return match.guestHp;
}

function isPvpMatchFinished(): boolean {
  const match = uiState.pvp.match;
  if (uiState.playMode !== "online" || !match) {
    return false;
  }

  return match.phase === "finished" || Boolean(match.outcome);
}

function createPvpBattlePerspective(
  combatSnapshot: PvpCombatSnapshot,
  role: PvpPlayerRole | undefined,
): PvpBattlePerspective {
  if (role === "guest") {
    const playerCastleDamage = Math.max(0, combatSnapshot.guestHpBefore - combatSnapshot.guestHpAfter);
    const enemyCastleDamage = Math.max(0, combatSnapshot.hostHpBefore - combatSnapshot.hostHpAfter);

    return {
      playerSlots: cloneBoardSlots(combatSnapshot.guestSlots),
      enemySlots: cloneBoardSlots(combatSnapshot.hostSlots),
      combat: mirrorCombatResult(combatSnapshot.combat, playerCastleDamage, enemyCastleDamage),
      playerCastleHpBefore: combatSnapshot.guestHpBefore,
      playerCastleHpAfter: combatSnapshot.guestHpAfter,
      enemyCastleHpBefore: combatSnapshot.hostHpBefore,
      enemyCastleHpAfter: combatSnapshot.hostHpAfter,
    };
  }

  const playerCastleDamage = Math.max(0, combatSnapshot.hostHpBefore - combatSnapshot.hostHpAfter);
  const enemyCastleDamage = Math.max(0, combatSnapshot.guestHpBefore - combatSnapshot.guestHpAfter);

  return {
    playerSlots: cloneBoardSlots(combatSnapshot.hostSlots),
    enemySlots: cloneBoardSlots(combatSnapshot.guestSlots),
    combat: normalizeCombatCastleDamage(combatSnapshot.combat, playerCastleDamage, enemyCastleDamage),
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

function normalizeCombatCastleDamage(
  combat: CombatResult,
  playerCastleDamage: number,
  enemyCastleDamage: number,
): CombatResult {
  return {
    ...combat,
    hpLoss: playerCastleDamage,
    playerCastleDamage,
    enemyCastleDamage,
    events: combat.events.map((event) =>
      event.type === "combat_finished" ? { ...event, hpLoss: playerCastleDamage } : event,
    ),
  };
}

function applyPvpFinishedSnapshot(state: UiState, match: PvpMatchSnapshot): UiState {
  const nextState = match.combat ? applyPvpBattleSnapshot(state, match) : state;
  if (!match.outcome) {
    throw new Error("Finished PvP match is missing a terminal outcome.");
  }
  const outcome: CombatWinner = match.outcome.winner === "draw"
    ? "draw"
    : match.outcome.winner === match.self.role
      ? "player"
      : "enemy";
  return {
    ...nextState,
    run: {
      ...nextState.run,
      round: match.round,
      playerHp: getPvpPlayerHp(match, match.self.role),
      enemyHp: getPvpEnemyHp(match, match.self.role),
      outcome,
      status: "finished",
    },
    mode: "finished",
    battleFinished: match.combat ? nextState.battleFinished : true,
    pvp: { ...nextState.pvp, match, panelOpen: false },
  };
}

function mirrorCombatResult(
  combat: CombatResult,
  playerCastleDamage: number,
  enemyCastleDamage: number,
): CombatResult {
  return {
    winner: mirrorCombatWinner(combat.winner),
    hpLoss: playerCastleDamage,
    playerCastleDamage,
    enemyCastleDamage,
    actions: combat.actions,
    events: combat.events.map((event) => mirrorCombatEvent(event, playerCastleDamage)),
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

function readPvpRoomSnapshot(payload: unknown): PvpRoomSnapshot | undefined {
  if (
    !isPvpRecord(payload) ||
    payload.rulesetVersion !== PVP_RULESET_VERSION ||
    typeof payload.roomId !== "string" ||
    !normalizePvpRoomId(payload.roomId)
  ) {
    return undefined;
  }

  if (!isPvpRoomStatus(payload.status) || !Array.isArray(payload.seats)) {
    return undefined;
  }

  const players = payload.seats
    .map(readPvpPlayerSlot)
    .filter((player): player is PvpPlayerSlot => Boolean(player));
  if (players.length !== 2 || new Set(players.map((player) => player.role)).size !== 2) {
    return undefined;
  }

  const match = payload.match === undefined ? undefined : readPvpMatchSnapshot(payload.match);
  if (payload.match !== undefined && !match) {
    return undefined;
  }

  return {
    roomId: payload.roomId,
    status: payload.status,
    connectedPeers: players.filter((player) => player.connected).length,
    players: mergePvpPlayerSlots(players),
    match,
    serverNow: readPvpTimestamp(payload.serverNow) ?? Date.now(),
  };
}

function hasUnsupportedPvpRuleset(payload: unknown): boolean {
  if (!isPvpRecord(payload)) {
    return false;
  }
  if (payload.rulesetVersion !== PVP_RULESET_VERSION) {
    return true;
  }
  return isPvpRecord(payload.match) &&
    payload.match.rulesetVersion !== PVP_RULESET_VERSION;
}

function readPvpMatchSnapshot(match: unknown): PvpMatchSnapshot | undefined {
  if (!isPvpRecord(match)) {
    return undefined;
  }

  if (
    match.rulesetVersion !== PVP_RULESET_VERSION ||
    typeof match.matchId !== "string" ||
    !isPvpRound(match.round) ||
    !isPvpMatchPhase(match.phase)
  ) {
    return undefined;
  }

  const self = readPvpSelfMatchSnapshot(match.self);
  const opponent = readPvpOpponentMatchSnapshot(match.opponent);
  if (!self || !opponent || self.role === opponent.role) {
    return undefined;
  }

  const combat = readPvpCombatSnapshot(match.combat);
  if ((match.phase === "battle" || (match.phase === "finished" && match.combat !== undefined)) && !combat) {
    return undefined;
  }

  const outcome = match.outcome === undefined ? undefined : readPvpMatchOutcome(match.outcome);
  if (match.phase === "finished" && !outcome) {
    return undefined;
  }
  const hostHp = readPvpHp(match.hostHp);
  const guestHp = readPvpHp(match.guestHp);
  if (hostHp === undefined || guestHp === undefined) {
    return undefined;
  }

  return {
    matchId: match.matchId,
    round: match.round,
    phase: match.phase,
    hostHp,
    guestHp,
    submissions: [self, opponent].map((player) => ({
      role: player.role,
      submitted: player.locked,
      submittedAt: null,
    })),
    self,
    opponent,
    combat,
    outcome,
    updatedAt: readPvpTimestamp(match.serverNow) ?? Date.now(),
  };
}

function readPvpHp(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= PLAYER_STARTING_HP
    ? value
    : undefined;
}

function readPvpSelfMatchSnapshot(value: unknown): PvpSelfMatchSnapshot | undefined {
  if (!isPvpRecord(value) || !isPvpPlayerRole(value.role)) {
    return undefined;
  }

  const boardSlots = readPvpBoardSlots(value.boardSlots);
  const draftOptions = readPvpDraftOptions(value.draftOptions);
  const pendingBoardSlots = value.pendingBoardSlots === undefined ? undefined : readPvpBoardSlots(value.pendingBoardSlots);
  const pickedCardId = value.pickedCardId === undefined ? undefined : readPvpCardId(value.pickedCardId);
  if (!boardSlots || !draftOptions || (value.pendingBoardSlots !== undefined && !pendingBoardSlots) ||
      (value.pickedCardId !== undefined && !pickedCardId)) {
    return undefined;
  }

  return {
    role: value.role,
    boardSlots,
    draftOptions,
    draftRerollCount: Number.isInteger(value.draftRerollCount) && Number(value.draftRerollCount) >= 0
      ? Number(value.draftRerollCount)
      : 0,
    pendingBoardSlots,
    pickedCardId,
    locked: value.locked === true,
    nextRoundReady: value.nextRoundReady === true,
    rematchReady: value.rematchReady === true,
  };
}

function readPvpOpponentMatchSnapshot(value: unknown): PvpOpponentMatchSnapshot | undefined {
  if (!isPvpRecord(value) || !isPvpPlayerRole(value.role)) {
    return undefined;
  }

  const boardSlots = value.boardSlots === undefined ? undefined : readPvpBoardSlots(value.boardSlots);
  if (value.boardSlots !== undefined && !boardSlots) {
    return undefined;
  }

  return {
    role: value.role,
    locked: value.locked === true,
    nextRoundReady: value.nextRoundReady === true,
    rematchReady: value.rematchReady === true,
    boardSlots,
  };
}

function readPvpBoardSlots(value: unknown): BoardSlot[] | undefined {
  if (!Array.isArray(value) || value.length !== BOARD_SLOT_COUNT) {
    return undefined;
  }

  const slots: BoardSlot[] = [];
  for (const rawSlot of value) {
    if (!isPvpRecord(rawSlot) || !Number.isInteger(rawSlot.slotIndex) ||
        Number(rawSlot.slotIndex) < 0 || Number(rawSlot.slotIndex) >= BOARD_SLOT_COUNT ||
        (rawSlot.upgradeLevel !== 0 && rawSlot.upgradeLevel !== 1)) {
      return undefined;
    }
    let cardId: CardId | null = null;
    if (rawSlot.cardId !== null) {
      const parsedCardId = readPvpCardId(rawSlot.cardId);
      if (!parsedCardId) {
        return undefined;
      }
      cardId = parsedCardId;
    }
    slots.push({ slotIndex: Number(rawSlot.slotIndex), cardId, upgradeLevel: rawSlot.upgradeLevel });
  }

  return new Set(slots.map((slot) => slot.slotIndex)).size === BOARD_SLOT_COUNT
    ? slots.sort((left, right) => left.slotIndex - right.slotIndex)
    : undefined;
}

function readPvpDraftOptions(value: unknown): DraftOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const options: DraftOption[] = [];
  for (const rawOption of value) {
    if (!isPvpRecord(rawOption) || typeof rawOption.optionId !== "string") {
      return undefined;
    }
    const cardId = readPvpCardId(rawOption.cardId);
    if (!cardId) {
      return undefined;
    }
    options.push({ optionId: rawOption.optionId, cardId });
  }
  return options;
}

function readPvpCardId(value: unknown): CardId | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return getCardDefinition(value as CardId)?.id;
}

function readPvpMatchOutcome(value: unknown): PvpMatchOutcome | undefined {
  if (!isPvpRecord(value) ||
      (value.winner !== "host" && value.winner !== "guest" && value.winner !== "draw") ||
      !["castle", "round_limit", "forfeit", "disconnect", "expired"].includes(String(value.reason)) ||
      !readPvpTimestamp(value.finishedAt)) {
    return undefined;
  }

  const forfeitedRole = value.forfeitedRole === undefined ? undefined : value.forfeitedRole;
  if (forfeitedRole !== undefined && !isPvpPlayerRole(forfeitedRole)) {
    return undefined;
  }

  return {
    winner: value.winner,
    reason: value.reason as PvpMatchOutcome["reason"],
    finishedAt: Number(value.finishedAt),
    forfeitedRole,
  };
}

function readPvpCombatSnapshot(value: unknown): PvpCombatSnapshot | undefined {
  if (!isPvpRecord(value)) {
    return undefined;
  }

  const hostSlots = readPvpBoardSlots(value.hostSlots);
  const guestSlots = readPvpBoardSlots(value.guestSlots);
  const hostHpBefore = readPvpHp(value.hostHpBefore);
  const hostHpAfter = readPvpHp(value.hostHpAfter);
  const guestHpBefore = readPvpHp(value.guestHpBefore);
  const guestHpAfter = readPvpHp(value.guestHpAfter);
  if (!isPvpRound(value.round) || !hostSlots || !guestSlots || !isPvpRecord(value.combat) ||
      hostHpBefore === undefined || hostHpAfter === undefined || guestHpBefore === undefined || guestHpAfter === undefined) {
    return undefined;
  }

  const combat = resolveCombat(hostSlots, guestSlots, value.round);
  const serverWinner = value.combat.winner;
  const serverActions = value.combat.actions;
  if (
    serverWinner !== combat.winner ||
    serverActions !== combat.actions ||
    (value.combat.playerCastleDamage !== undefined && value.combat.playerCastleDamage !== combat.playerCastleDamage) ||
    (value.combat.enemyCastleDamage !== undefined && value.combat.enemyCastleDamage !== combat.enemyCastleDamage) ||
    hostHpAfter !== Math.max(0, hostHpBefore - combat.playerCastleDamage) ||
    guestHpAfter !== Math.max(0, guestHpBefore - combat.enemyCastleDamage)
  ) {
    return undefined;
  }

  return {
    round: value.round,
    hostSlots,
    guestSlots,
    combat,
    hostHpBefore,
    hostHpAfter,
    guestHpBefore,
    guestHpAfter,
  };
}

function readPvpPlayerSlot(player: unknown): PvpPlayerSlot | undefined {
  if (!isPvpRecord(player) || !isPvpPlayerRole(player.role)) {
    return undefined;
  }

  return {
    role: player.role,
    claimed: player.claimed === true,
    connected: player.connected === true,
    ready: player.ready === true,
  };
}

function mergePvpPlayerSlots(players: PvpPlayerSlot[]): PvpPlayerSlot[] {
  return createEmptyPvpPlayerSlots().map((emptySlot) => players.find((player) => player.role === emptySlot.role) ?? emptySlot);
}

function isPvpPlayerRole(role: unknown): role is PvpPlayerRole {
  return role === "host" || role === "guest";
}

function isPvpMatchPhase(phase: unknown): phase is PvpMatchPhase {
  return phase === "draft" || phase === "battle" || phase === "finished";
}

function getCurrentPvpPlayer(): PvpPlayerSlot | undefined {
  return uiState.pvp.players.find((player) => player.role === uiState.pvp.role);
}

function isCurrentPvpPlayerSubmitted(): boolean {
  return uiState.pvp.match?.self.locked === true;
}

function getPvpStatusLabel(): string {
  const copy = getCopy();
  if (uiState.pvp.status === "connecting") {
    return copy.pvpStatusConnecting;
  }

  if (uiState.pvp.status === "connected") {
    return copy.pvpStatusConnected;
  }

  if (uiState.pvp.status === "error") {
    return copy.pvpStatusError;
  }

  return copy.pvpStatusIdle;
}

function isPvpRoomStatus(value: unknown): value is PvpRoomSnapshot["status"] {
  return value === "waiting" || value === "ready" || value === "playing" || value === "finished";
}

function isPvpRound(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_RUN_ROUNDS;
}

function readPvpTimestamp(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function isPvpRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getCopy(): UiCopy {
  return getUiCopy(activeLocale);
}

function getPreferenceStorage(): KeyValueStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSoloRunStorage(): SoloRunStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getRunHistoryStorage(): RunHistoryStorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getPvpSessionStorage(): PvpSessionStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function persistSoloRun(): void {
  if (uiState.playMode !== "solo" || uiState.mode === "menu") {
    return;
  }

  const checkpoint: SoloRunCheckpoint = uiState.run.status === "finished"
    ? "finished"
    : uiState.mode === "battle"
      ? "battle_result"
      : "draft";
  const session = uiState.soloSession;
  if (!session) {
    reportSoloPersistenceFailure("save");
    return;
  }

  const saved = saveSoloRunSnapshot(soloRunStorage, {
    session,
    checkpoint,
    run: uiState.run,
    draftBoardSlots: uiState.draftBoardSlots,
    cardPickedThisRound: uiState.cardPickedThisRound,
    lastRound: uiState.lastRound,
  });

  if (!saved) {
    reportSoloPersistenceFailure("save");
  }
}

function requireSoloRunSession(): SoloRunSession {
  if (uiState.playMode !== "solo" || !uiState.soloSession) {
    throw new Error("Active solo run is missing session metadata.");
  }
  return uiState.soloSession;
}

function ensureFinishedSoloRunRecorded(): boolean {
  if (
    uiState.playMode !== "solo"
    || uiState.run.status !== "finished"
    || !uiState.run.outcome
    || !uiState.soloSession?.completedAt
  ) {
    return true;
  }

  const summary: SoloRunSummary = {
    id: uiState.soloSession.runId,
    seed: uiState.run.seed,
    botDifficulty: uiState.run.botDifficulty,
    outcome: uiState.run.outcome,
    round: uiState.run.roundHistory.length,
    playerHp: uiState.run.playerHp,
    enemyHp: uiState.run.enemyHp,
    completedAt: uiState.soloSession.completedAt,
    source: uiState.soloSession.source,
    dailyDateKey: uiState.soloSession.dailyDateKey,
    rulesetVersion: uiState.soloSession.rulesetVersion,
  };
  if (recordSoloRunSummary(runHistoryStorage, summary)) {
    soloRunHistory = loadSoloRunHistory(runHistoryStorage);
    return true;
  }
  if (queueSoloRunSummary(runHistoryStorage, summary)) {
    return true;
  }

  if (!soloHistoryFailureReported) {
    soloHistoryFailureReported = true;
    console.warn("Unable to record the completed solo run in local history.");
  }
  return false;
}

function showSoloHistorySaveFailure(): void {
  uiState = {
    ...uiState,
    battlePresentationNotice: getCopy().runHistorySaveFailed,
  };
  render();
}

function confirmFinishedSoloRunDiscard(): boolean {
  if (ensureFinishedSoloRunRecorded()) {
    return true;
  }
  if (window.confirm(getCopy().runHistoryDiscardConfirm)) {
    return true;
  }

  showSoloHistorySaveFailure();
  return false;
}

function clearPersistedSoloRun(): void {
  if (!clearSoloRunSnapshot(soloRunStorage)) {
    reportSoloPersistenceFailure("clear");
  }
}

function reportSoloPersistenceFailure(action: "save" | "clear"): void {
  if (soloPersistenceFailureReported) {
    return;
  }

  soloPersistenceFailureReported = true;
  console.warn(`Unable to ${action} the local solo run. Progress may not survive a reload.`);
}

function createSeed(): string {
  return `local-${Date.now().toString(36).slice(-6)}`;
}
