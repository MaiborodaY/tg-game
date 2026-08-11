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
  type UnitStats,
} from "./game";
import {
  getBoardSynergyProgress,
  getBoardUnitInspection,
  type BoardUnitInspection,
} from "./draftPresentation";
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
import { findNearestSlotHitTarget, type SlotHitTargetGeometry } from "./fieldHitTesting";
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
  loadSoloRunSnapshot,
  saveSoloRunSnapshot,
  type SoloRunCheckpoint,
  type SoloRunSnapshot,
  type SoloRunStorage,
} from "./soloPersistence";
import {
  applyDraftPlacement,
  classifyDraftPlacement,
  type DraftPlacementClassification,
} from "./game/placement";

type ScreenMode = "menu" | "draft" | "battle" | "finished";
type PlayMode = "solo" | "online";
type CardRarity = "common" | "uncommon" | "rare";
type PvpConnectionStatus = "idle" | "connecting" | "connected" | "error";
type PvpPlayerRole = "host" | "guest";
type PvpPeerRole = PvpPlayerRole | "spectator";
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

const preferenceStorage = getPreferenceStorage();
const soloRunStorage = getSoloRunStorage();
const restoredSoloRun = loadSoloRunSnapshot(soloRunStorage);
let soloPersistenceFailureReported = false;
let activeLocale = resolveInitialLocale(readStoredLocale(preferenceStorage), navigator.language);
let howToOpen = !hasSeenHowTo(preferenceStorage);
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
let suppressNextCardClick = false;
let pvpSocket: WebSocket | undefined;
let pvpSocketCloseExpected = false;
let battlePresentationWatchdog: number | undefined;
let battlePresentationWatchdogKey: string | undefined;

render();
window.addEventListener("beforeunload", () => closePvpSocket());
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && pendingDraftReplacement) {
    cancelDraftReplacement();
  } else if (event.key === "Escape" && howToOpen && uiState.mode === "menu") {
    closeHowToPlay();
  }
});

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
  const stageUi = getStageUiElement();
  stage.className = `stage stage--${uiState.mode}`;
  stageUi.replaceChildren();

  if (uiState.mode === "menu") {
    stageUi.append(createMainMenuOverlay());
  } else if (uiState.mode === "draft") {
    stageUi.append(createDraftHud(), createDraftOverlay());
  } else {
    stageUi.append(createBattleOverlay());
  }

  if (uiState.mode !== "menu") {
    stageUi.append(createLogsOverlay());
  }

  if (uiState.mode === "menu" && howToOpen) {
    stageUi.querySelector<HTMLElement>(".main-menu-overlay")?.setAttribute("inert", "");
    stageUi.append(createHowToPlayOverlay());
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

function createMetric(label: string, value: string, metricKey: "hp" | "round" | "seed"): HTMLElement {
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

  metric.append(icon, labelEl, valueEl);

  return metric;
}

function createDraftHud(): HTMLElement {
  const copy = getCopy();
  const hud = document.createElement("div");
  hud.className = "draft-hud";

  const metrics = document.createElement("div");
  metrics.className = "draft-hud__metrics";
  metrics.append(
    createMetric(copy.hp, String(uiState.run.playerHp), "hp"),
    createMetric(copy.round, String(uiState.run.round), "round"),
    createMetric(copy.seed, uiState.run.seed.slice(-6), "seed"),
  );
  hud.append(metrics);

  const synergies = createDraftSynergies();
  if (synergies) {
    hud.append(synergies);
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

  const soloButton = document.createElement("button");
  soloButton.className = "main-menu__button main-menu__button--primary";
  soloButton.type = "button";
  soloButton.textContent = copy.startRun;
  soloButton.addEventListener("click", startSoloRun);

  const howToButton = document.createElement("button");
  howToButton.className = "main-menu__button";
  howToButton.type = "button";
  howToButton.textContent = copy.howToPlay;
  howToButton.addEventListener("click", openHowToPlay);

  actions.append(soloButton, howToButton);
  if (PVP_UI_ENABLED) {
    const onlineButton = document.createElement("button");
    onlineButton.className = "main-menu__button";
    onlineButton.type = "button";
    onlineButton.textContent = "Онлайн";
    onlineButton.addEventListener("click", startOnlineLobby);
    actions.append(onlineButton);
  }

  panel.append(title, subtitle, languageSelector, actions);
  overlay.append(panel);

  return overlay;
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

function openHowToPlay(): void {
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

function selectLocale(locale: SupportedLocale): void {
  activeLocale = locale;
  document.documentElement.lang = locale;
  saveLocale(preferenceStorage, locale);
  render();
}

function startSoloRun(): void {
  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
  clearBattlePresentationWatchdog();
  closePvpSocket();
  clearPersistedSoloRun();
  uiState = createInitialUiState(createSeed(), "solo", "draft");
  persistSoloRun();
  render();
}

function returnToMainMenu(): void {
  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
  clearBattlePresentationWatchdog();
  closePvpSocket();
  clearPersistedSoloRun();
  uiState = createInitialUiState();
  render();
}

function startOnlineLobby(): void {
  activePointerDrag?.cleanup();
  pendingDraftReplacement = undefined;
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
      const hasVisibleSynergies = getBoardSynergyProgress(uiState.draftBoardSlots).length > 0;
      overlay.append(createTapPlacementPanel(selectedDraftCardId, hasVisibleSynergies));
    }
  }

  if (uiState.pvp.panelOpen || isWaitingForOnlineMatch) {
    overlay.append(createPvpPanel());
  }

  if (!isWaitingForOnlineMatch && !uiState.cardPickedThisRound && !selectedDraftCardId) {
    overlay.append(createDraftPanel());
  }

  const inspectedBoardUnit = getSelectedBoardUnitInspection();
  if (inspectedBoardUnit) {
    overlay.append(createCardInfoPanel(inspectedBoardUnit.cardId, inspectedBoardUnit));
  } else if (uiState.selectedCardInfoId) {
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
  const copy = getCopy();
  const completedRounds = uiState.run.roundHistory.length;
  const outcome = uiState.run.outcome;
  if (!outcome) {
    throw new Error("Finished solo run is missing a terminal outcome.");
  }
  const resultKind = outcome === "player" ? "victory" : outcome === "enemy" ? "defeat" : "draw";
  const panel = document.createElement("section");
  panel.className = `terminal-result terminal-result--${resultKind}`;

  const eyebrow = document.createElement("span");
  eyebrow.className = "terminal-result__eyebrow";
  eyebrow.textContent = copy.runFinished;

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

  const restartButton = document.createElement("button");
  restartButton.className = "primary-button";
  restartButton.type = "button";
  restartButton.textContent = copy.again;
  restartButton.addEventListener("click", startSoloRun);

  const menuButton = document.createElement("button");
  menuButton.className = "terminal-result__secondary-button";
  menuButton.type = "button";
  menuButton.textContent = copy.menu;
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
  const copy = getCopy();
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
  button.textContent = copy.logs;
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
  const copy = getCopy();
  const panel = document.createElement("section");
  panel.className = "logs-panel";

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
  hint.textContent = getCopy().onboarding;

  return hint;
}

function createDraftHeader(): HTMLElement {
  const copy = getCopy();
  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("h1");
  title.textContent = copy.chooseCard;

  const caption = document.createElement("span");
  caption.className = "panel-caption";
  caption.textContent = formatMessage(copy.slots, {
    filled: getFilledSlotCount(),
    capacity: getBoardCapacity(),
  });

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
  const localizedCard = getLocalizedCard(activeLocale, card);
  const meta = getCardDisplayMeta(card);
  const placeable = canPlaceDraftCard(option.cardId);
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

function createCardInfoPanel(cardId: CardId, boardUnit?: BoardUnitInspection): HTMLElement {
  const copy = getCopy();
  const card = getCardDefinition(cardId);
  const localizedCard = getLocalizedCard(activeLocale, card);
  const meta = getCardDisplayMeta(card);
  const panel = document.createElement("aside");
  panel.className = `card-info-panel unit-card--${meta.archetype} unit-card--${meta.rarity}`;
  panel.setAttribute("aria-labelledby", "draft-card-info-title");

  const closeButton = document.createElement("button");
  closeButton.className = "card-info-panel__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", copy.closeCardInfo);
  closeButton.addEventListener("click", closeCardInfo);

  const title = document.createElement("strong");
  title.className = "card-info-panel__title";
  title.id = "draft-card-info-title";
  title.textContent = `${localizedCard.name}${boardUnit?.upgradeLevel ? " ★" : ""}`;

  const context = boardUnit ? createBoardUnitContext(boardUnit) : undefined;

  const type = createCardMetaRow(meta);
  type.classList.add("card-info-panel__type");

  const stats = createCardStats(card, boardUnit?.upgradeLevel ?? 0);
  stats.classList.add("card-info-panel__stats");

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
  panel.append(type, createCardArt(card, meta), stats, tags, summary);

  return panel;
}

function createBoardUnitContext(boardUnit: BoardUnitInspection): HTMLElement {
  const copy = getCopy();
  const context = document.createElement("span");
  context.className = boardUnit.upgradeLevel
    ? "card-info-panel__context card-info-panel__context--upgraded"
    : "card-info-panel__context";
  const position = formatMessage(copy.boardPosition, { slot: boardUnit.slotIndex + 1 });
  context.textContent = boardUnit.upgradeLevel ? `${position} · ${copy.upgradedStats}` : position;

  return context;
}

function createRerollButton(): HTMLButtonElement {
  const copy = getCopy();
  const button = document.createElement("button");
  button.className = "reroll-button";
  button.type = "button";
  button.disabled = !canRerollDraftCards(uiState.run);
  button.textContent = button.disabled ? copy.rerollUsed : copy.reroll;
  button.addEventListener("click", rerollCurrentDraftCards);

  return button;
}

function createTapPlacementPanel(cardId: CardId, hasVisibleSynergies: boolean): HTMLElement {
  const copy = getCopy();
  const card = getCardDefinition(cardId);
  const localizedCard = getLocalizedCard(activeLocale, card);
  const placementKinds = getDraftPlacementClassifications(cardId).map((placement) => placement.kind);
  const panel = document.createElement("section");
  panel.className = hasVisibleSynergies
    ? "tap-placement-panel tap-placement-panel--below-synergies"
    : "tap-placement-panel";

  const copyContainer = document.createElement("div");
  copyContainer.className = "tap-placement-panel__copy";

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
  actions.className = "tap-placement-panel__actions";

  const infoButton = document.createElement("button");
  infoButton.type = "button";
  infoButton.textContent = copy.cardInfo;
  infoButton.addEventListener("click", () => openCardInfo(cardId));

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = copy.cancel;
  cancelButton.addEventListener("click", cancelDraftCardSelection);

  actions.append(infoButton, cancelButton);
  panel.append(copyContainer, actions);

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
  name.textContent = getLocalizedCard(activeLocale, card).name;

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
  slot.className = classes.join(" ");
  slot.type = "button";
  slot.disabled = false;
  slot.dataset.fieldSlotIndex = String(slotIndex);
  slot.setAttribute("aria-pressed", String(uiState.selectedCardInfoSlotIndex === slotIndex));
  const slotPosition = getPlayerFieldSlotPosition(slotIndex);
  slot.style.setProperty("--slot-x", `${slotPosition.xPercent}%`);
  slot.style.setProperty("--slot-y", `${slotPosition.yFromBottom}px`);
  slot.style.setProperty("--slot-scale", `${slotPosition.scale}`);
  slot.style.setProperty("--slot-depth", `${slotPosition.depth}`);

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
    slot.setAttribute("aria-label", slot.title);
  } else if (card) {
    const localizedName = getLocalizedCard(activeLocale, card).name;
    slot.title = slotState?.upgradeLevel ? formatMessage(copy.upgradedCard, { card: localizedName }) : localizedName;
    slot.setAttribute("aria-label", slot.title);
  } else {
    slot.title = formatMessage(copy.emptySlot, { slot: slotIndex + 1 });
    slot.setAttribute("aria-label", slot.title);
  }

  slot.addEventListener("click", (event) => {
    const resolvedSlotIndex = getSelectedDraftCardId()
      ? getFieldSlotIndexForClick(event, slotIndex)
      : slotIndex;
    handleFieldSlotClick(resolvedSlotIndex);
  });

  if (card) {
    const unit = createFieldSlotUnit(card, slotState ?? createEmptyDraftBoardSlot(slotIndex));
    slot.append(unit);
    if (!selectedDraftCardId) {
      slot.addEventListener("pointerdown", (event) => startPointerFieldUnitDrag(slotIndex, unit, event));
    }
  }

  if (placement && placement.kind !== "invalid") {
    slot.append(createFieldSlotTargetLabel(placement.kind));
  }

  return slot;
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
    newRunButton.textContent = getCopy().menu;
    newRunButton.addEventListener("click", returnToMainMenu);
    actions.append(newRunButton);
  }

  return actions;
}

function getDraftActionLabel(): string {
  if (uiState.playMode !== "online") {
    return getCopy().fight;
  }

  if (isCurrentPvpPlayerSubmitted()) {
    return "Waiting";
  }

  return "Lock";
}

function getBattleActionLabel(): string {
  return isPvpMatchFinished() ? getCopy().menu : getCopy().nextRound;
}

function goToNextRound(): void {
  pendingDraftReplacement = undefined;
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
    selectedCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
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
    ...createInitialUiState(snapshot.run.seed, "solo", mode),
    run: snapshot.run,
    mode,
    draftBoardSlots: cloneBoardSlots(snapshot.draftBoardSlots),
    cardPickedThisRound: snapshot.cardPickedThisRound,
    battleFinished: snapshot.checkpoint !== "draft",
    selectedLogRound: lastRoundRecord?.round,
    lastRound: snapshot.lastRound,
    lastBattleTimeline: createTimelineForRoundRecord(lastRoundRecord),
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
      resultLabels: {
        player: getCopy().roundVictory,
        enemy: getCopy().roundDefeat,
        draw: getCopy().roundDraw,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to apply Phaser battlefield command", error);
    showBattlefieldFallback(getCopy().rendererInterrupted);
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
  enemy.append(createMatchupTitle(copy.bot), createCompactCards(enemySlots));

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

function getDraftPlacementClassifications(cardId: CardId): DraftPlacementClassification[] {
  return uiState.draftBoardSlots.map((slot) => classifyDraftPlacement(uiState.draftBoardSlots, cardId, slot.slotIndex));
}

function requestDraftPlacement(cardId: CardId, slotIndex: number): void {
  if (uiState.mode !== "draft") {
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
  if (uiState.mode !== "draft" || !getCurrentDraftOption(cardId)) {
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

  pendingDraftReplacement = undefined;
  uiState = {
    ...uiState,
    draftBoardSlots: result.boardSlots,
    cardPickedThisRound: true,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
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
  uiState = {
    ...uiState,
    selectedDraftCardId: cardId,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
  };
  render();
}

function handleFieldSlotClick(slotIndex: number): void {
  if (suppressNextCardClick) {
    suppressNextCardClick = false;
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
  pendingDraftReplacement = undefined;
  uiState = {
    ...uiState,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
  };
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
  };
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
  };
  render();
}

function getSelectedBoardUnitInspection(): BoardUnitInspection | undefined {
  if (uiState.selectedCardInfoSlotIndex === undefined) {
    return undefined;
  }

  return getBoardUnitInspection(uiState.draftBoardSlots, uiState.selectedCardInfoSlotIndex);
}

function closeCardInfo(): void {
  uiState = {
    ...uiState,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
  };
  render();
}

function rerollCurrentDraftCards(): void {
  if (uiState.mode !== "draft" || uiState.cardPickedThisRound || !canRerollDraftCards(uiState.run)) {
    return;
  }

  pendingDraftReplacement = undefined;
  uiState = {
    ...uiState,
    run: rerollDraftCards(uiState.run),
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
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
    selectedCardInfoSlotIndex: undefined,
  };
  persistSoloRun();
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
  if (event.detail === 0 && event.clientX === 0 && event.clientY === 0) {
    return fallbackSlotIndex;
  }

  return getFieldSlotIndexAtPoint(
    event.clientX,
    event.clientY,
    createFieldSlotHitTargets(false),
  ) ?? fallbackSlotIndex;
}

function canDropIntoSlot(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < BOARD_SLOT_COUNT;
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
  const playedRound = uiState.run.round;
  const combatReadyRun = chooseDraftCards(uiState.run, uiState.draftBoardSlots);
  const nextRun = resolveRound(combatReadyRun);
  const lastRoundRecord = getLastRoundRecord(nextRun);
  const lastBattleTimeline = createTimelineForRoundRecord(lastRoundRecord);

  uiState = {
    ...uiState,
    run: nextRun,
    mode: nextRun.status === "finished" ? "finished" : "battle",
    draftBoardSlots: cloneBoardSlots(nextRun.boardSlots),
    cardPickedThisRound: false,
    selectedDraftCardId: undefined,
    selectedCardInfoId: undefined,
    selectedCardInfoSlotIndex: undefined,
    battleFinished: false,
    battlePresentationNotice: undefined,
    logsOpen: false,
    lastRound: playedRound,
    lastBattleTimeline,
  };
  persistSoloRun();
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
    selectedCardInfoSlotIndex: undefined,
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
    selectedCardInfoSlotIndex: undefined,
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
    enemyHp: getPvpEnemyHp(match, state.pvp.role),
    outcome: null,
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

function getPvpEnemyHp(match: PvpMatchSnapshot, role: PvpPeerRole | undefined): number {
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

function persistSoloRun(): void {
  if (uiState.playMode !== "solo" || uiState.mode === "menu") {
    return;
  }

  const checkpoint: SoloRunCheckpoint = uiState.run.status === "finished"
    ? "finished"
    : uiState.mode === "battle"
      ? "battle_result"
      : "draft";

  const saved = saveSoloRunSnapshot(soloRunStorage, {
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
