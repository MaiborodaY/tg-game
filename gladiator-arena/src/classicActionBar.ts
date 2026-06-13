import { DEFAULT_ACTION_BUTTON_SCALE } from "./arenaLayout";
import { getActionHitChanceLabel, pressActionTokenButton, syncActionTokenButton, type ActionTokenTuning } from "./actionArc";
import {
  actionOrder,
  actions,
  canUseAction,
  distanceBand,
  getFighterClinchRange,
  getActionTitle,
  isFighterInClinchRange,
  isBowFighter,
  type ActionId,
  type CombatState,
} from "./combat";
import type { ActionButtonOffsetKey, ClassicActionButtonSlotTuning, ClassicActionWheelMode } from "./debugTuning";

type ClassicActionSlotTuning = Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
type TuningProvider = () => ActionTokenTuning & { classicActionButtonSlots?: ClassicActionSlotTuning };
type ClassicWheelMode = "distance" | "clinch" | "bow-distance";
type ClassicWheelRangeMode = "far" | "near" | "melee" | "clinch" | "bow";

interface ClassicActionBarOptions {
  getPreviewWheelMode?: () => ClassicActionWheelMode | undefined;
}

const CLASSIC_WHEEL_TURN_MS = 520;
const CLASSIC_WHEEL_BASE_DIAMETER = 420;
const CLASSIC_WHEEL_SCREEN_PADDING_X = 12;
const CLASSIC_CHANCE_BADGE_SCREEN_OFFSET_Y = -40;
const CLASSIC_WHEEL_RANGE_MODES: ClassicWheelRangeMode[] = ["far", "near", "melee", "clinch", "bow"];

interface ClassicActionSlot {
  actionId: ActionId;
  x: number;
  y: number;
  rotation: number;
}

interface ClassicButtonLayer {
  element: HTMLDivElement;
  buttons: Map<ActionId, HTMLButtonElement>;
  chanceBadges: Map<ActionId, HTMLSpanElement>;
  mode?: ClassicWheelMode;
  angle: number;
}

const CLASSIC_DISTANCE_SLOTS: ClassicActionSlot[] = [
  { actionId: "forward", x: -44, y: -104, rotation: -10 },
  { actionId: "lunge", x: 44, y: -104, rotation: 10 },
  { actionId: "back", x: -88, y: -38, rotation: -12 },
  { actionId: "taunt", x: 0, y: -54, rotation: 0 },
  { actionId: "rest", x: 88, y: -38, rotation: 12 },
];

const CLASSIC_CLINCH_SLOTS: ClassicActionSlot[] = [
  { actionId: "light", x: -76, y: -112, rotation: -14 },
  { actionId: "medium", x: 0, y: -128, rotation: 0 },
  { actionId: "heavy", x: 76, y: -112, rotation: 14 },
  { actionId: "back", x: -90, y: -38, rotation: -12 },
  { actionId: "taunt", x: 0, y: -50, rotation: 0 },
  { actionId: "rest", x: 90, y: -38, rotation: 12 },
];

const CLASSIC_BOW_DISTANCE_SLOTS: ClassicActionSlot[] = [
  { actionId: "light", x: -78, y: -116, rotation: -14 },
  { actionId: "medium", x: 0, y: -132, rotation: 0 },
  { actionId: "heavy", x: 78, y: -116, rotation: 14 },
  { actionId: "back", x: -118, y: -36, rotation: -14 },
  { actionId: "taunt", x: 40, y: -52, rotation: 6 },
  { actionId: "rest", x: 118, y: -36, rotation: 14 },
];

const classicWheelModeTuningKey: Record<ClassicWheelMode, ClassicActionWheelMode> = {
  distance: "distance",
  clinch: "clinch",
  "bow-distance": "bowDistance",
};

export interface ClassicActionBarApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountClassicActionBar(
  host: HTMLElement,
  onAction: (actionId: ActionId) => void,
  getTuning?: TuningProvider,
  options: ClassicActionBarOptions = {},
): ClassicActionBarApi | undefined {
  const root = host.querySelector<HTMLElement>("[data-classic-action-bar]");

  if (!root) {
    return undefined;
  }
  const actionBarRoot = root;

  const wheel = document.createElement("div");
  const wheelShadow = document.createElement("div");
  const layers = [createClassicButtonLayer(onAction), createClassicButtonLayer(onAction)];
  let activeLayer = layers[0];
  let lastState: CombatState | undefined;
  let wheelRotationAngle = 0;
  let isWheelTurning = false;
  let wheelTurnTimer: number | undefined;
  const syncWheelFitScale = () => syncClassicWheelFitScale(actionBarRoot);

  actionBarRoot.replaceChildren();
  wheelShadow.className = "classic-action-bar__wheel-shadow";
  wheel.className = "classic-action-bar__wheel";
  layers.forEach((layer) => wheel.append(layer.element));
  actionBarRoot.append(wheelShadow, wheel);
  syncWheelFitScale();
  window.addEventListener("resize", syncWheelFitScale);

  function sync(state: CombatState): void {
    const tuning = getTuning?.();
    const buttonScale = tuning?.actionButtonScale ?? DEFAULT_ACTION_BUTTON_SCALE;
    const previewWheelMode = options.getPreviewWheelMode?.();
    const wheelMode = getClassicWheelMode(state, previewWheelMode);
    const isBattleActive = state.result === "playing";
    const hasPlayerControl = isBattleActive && state.activeTurn === "player";

    syncWheelFitScale();

    if (!activeLayer.mode) {
      activeLayer.mode = wheelMode;
      activeLayer.angle = wheelRotationAngle;
    }

    if (hasPlayerControl && !isWheelTurning && activeLayer.mode !== wheelMode) {
      startWheelTransition(wheelMode);
    }

    const activeWheelMode = activeLayer.mode ?? wheelMode;
    const activeWheelRangeMode = getClassicWheelRangeMode(state, wheelMode, previewWheelMode);

    actionBarRoot.dataset.classicWheelMode = activeWheelMode;
    actionBarRoot.dataset.classicWheelRange = activeWheelRangeMode;
    actionBarRoot.classList.toggle("classic-action-bar--distance", activeWheelMode === "distance");
    actionBarRoot.classList.toggle("classic-action-bar--clinch", activeWheelMode === "clinch");
    actionBarRoot.classList.toggle("classic-action-bar--bow-distance", activeWheelMode === "bow-distance");
    CLASSIC_WHEEL_RANGE_MODES.forEach((mode) => {
      actionBarRoot.classList.toggle(`classic-action-bar--range-${mode}`, activeWheelRangeMode === mode);
    });
    actionBarRoot.classList.toggle("classic-action-bar--turning", isWheelTurning);
    wheel.style.setProperty("--classic-wheel-angle", `${wheelRotationAngle}deg`);

    layers.forEach((layer) => {
      renderButtonLayer(
        layer,
        state,
        tuning,
        buttonScale,
        isBattleActive,
        layer === activeLayer && hasPlayerControl && !isWheelTurning,
      );
    });
  }

  function renderButtonLayer(
    layer: ClassicButtonLayer,
    state: CombatState,
    tuning: ReturnType<TuningProvider> | undefined,
    buttonScale: number,
    shouldShowButtons: boolean,
    isInteractiveLayer: boolean,
  ): void {
    const visibleSlots = new Map(
      layer.mode ? getClassicActionSlots(layer.mode, tuning?.classicActionButtonSlots).map((slot) => [slot.actionId, slot]) : [],
    );

    layer.element.classList.toggle("classic-action-bar__layer--active", Boolean(layer.mode));

    for (const [actionId, button] of layer.buttons) {
      const icon = button.querySelector<HTMLElement>(".action-arc__icon");
      const chanceBadge = layer.chanceBadges.get(actionId);
      const slot = visibleSlots.get(actionId);
      const isVisible = shouldShowButtons && Boolean(slot);
      const isDimmed = isVisible && !isInteractiveLayer;
      const projectedSlot = slot ? projectSlotForWheelAngle(slot, layer.angle) : undefined;

      if (!icon || !chanceBadge) {
        continue;
      }

      button.style.setProperty("--classic-slot-x", `${formatCssNumber(projectedSlot?.x ?? 0)}px`);
      button.style.setProperty("--classic-slot-y", `${formatCssNumber(projectedSlot?.y ?? 18)}px`);
      button.style.setProperty("--classic-slot-rotation", `${formatCssNumber(projectedSlot?.rotation ?? 0)}deg`);
      syncActionTokenButton(button, icon, actionId, tuning, buttonScale);
      const hitChanceLabel = syncClassicActionChanceBadge(chanceBadge, actionId, state, projectedSlot, isVisible, wheelRotationAngle);
      button.disabled = !isInteractiveLayer || !isVisible || !canUseAction(state, actionId, "player");
      button.tabIndex = isVisible && isInteractiveLayer ? 0 : -1;
      button.setAttribute("aria-hidden", isVisible ? "false" : "true");
      button.classList.toggle("classic-action-bar__button--visible", isVisible);
      button.classList.toggle("classic-action-bar__button--hidden", !isVisible);
      button.classList.toggle("classic-action-bar__button--dimmed", isDimmed);
      chanceBadge.classList.toggle("classic-action-bar__chance--dimmed", isDimmed);

      const title = getActionTitle(actionId, state.player);

      button.setAttribute("aria-label", `${title} ${actions[actionId].detail}${hitChanceLabel ? ` hit ${hitChanceLabel}` : ""}`);
      button.title = `${title} ${actions[actionId].detail}${hitChanceLabel ? ` hit ${hitChanceLabel}` : ""}`;
    }
  }

  function startWheelTransition(nextWheelMode: ClassicWheelMode): void {
    const outgoingLayer = activeLayer;
    const incomingLayer = getStandbyLayer();
    const nextWheelAngle = wheelRotationAngle + 180;

    incomingLayer.mode = nextWheelMode;
    incomingLayer.angle = nextWheelAngle;
    activeLayer = incomingLayer;
    wheelRotationAngle = nextWheelAngle;
    beginWheelTurn();

    if (wheelTurnTimer !== undefined) {
      window.clearTimeout(wheelTurnTimer);
    }

    wheelTurnTimer = window.setTimeout(() => {
      wheelTurnTimer = undefined;
      isWheelTurning = false;
      outgoingLayer.mode = undefined;

      if (lastState) {
        sync(lastState);
      }
    }, CLASSIC_WHEEL_TURN_MS);
  }

  function beginWheelTurn(): void {
    isWheelTurning = true;
  }

  function getStandbyLayer(): ClassicButtonLayer {
    return layers.find((layer) => layer !== activeLayer) ?? layers[0];
  }

  function syncFromDebugTuning(): void {
    if (lastState) {
      sync(lastState);
    }
  }

  const syncWithState = (state: CombatState): void => {
    lastState = state;
    sync(state);
  };

  if (getTuning) {
    window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning);
  }

  return {
    sync: syncWithState,
    destroy() {
      if (wheelTurnTimer !== undefined) {
        window.clearTimeout(wheelTurnTimer);
      }

      window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning);
      window.removeEventListener("resize", syncWheelFitScale);
      actionBarRoot.replaceChildren();
    },
  };
}

function syncClassicWheelFitScale(root: HTMLElement): void {
  const hostWidth = getClassicWheelHostWidth(root);
  const fitScale = clamp((hostWidth - CLASSIC_WHEEL_SCREEN_PADDING_X) / CLASSIC_WHEEL_BASE_DIAMETER, 0.1, 1);

  root.style.setProperty("--classic-wheel-fit-scale", formatCssNumber(fitScale));
}

function getClassicWheelHostWidth(root: HTMLElement): number {
  const battleScreen = root.closest<HTMLElement>(".battle-screen");
  const width = battleScreen?.getBoundingClientRect().width ?? (typeof window === "undefined" ? CLASSIC_WHEEL_BASE_DIAMETER : window.innerWidth);

  return typeof width === "number" && Number.isFinite(width) && width > 0 ? width : CLASSIC_WHEEL_BASE_DIAMETER;
}

function getClassicWheelMode(state: CombatState, previewWheelMode?: ClassicActionWheelMode): ClassicWheelMode {
  const forcedWheelMode = getClassicWheelModeFromTuningMode(previewWheelMode);

  if (forcedWheelMode) {
    return forcedWheelMode;
  }

  const isPlayerInClinch = isFighterInClinchRange(state, "player");

  if (isBowFighter(state.player) && !isPlayerInClinch) {
    return "bow-distance";
  }

  return isPlayerInClinch ? "clinch" : "distance";
}

function getClassicWheelModeFromTuningMode(mode?: ClassicActionWheelMode): ClassicWheelMode | undefined {
  if (mode === "bowDistance") {
    return "bow-distance";
  }

  return mode;
}

function getClassicWheelRangeMode(
  state: CombatState,
  wheelMode: ClassicWheelMode,
  previewWheelMode?: ClassicActionWheelMode,
): ClassicWheelRangeMode {
  const forcedRangeMode = getClassicWheelRangeModeFromTuningMode(previewWheelMode);

  if (forcedRangeMode) {
    return forcedRangeMode;
  }

  if (wheelMode === "bow-distance") {
    return "bow";
  }

  const band = distanceBand(state.distance, getFighterClinchRange(state.player));

  return band === "very-far" ? "far" : band;
}

function getClassicWheelRangeModeFromTuningMode(mode?: ClassicActionWheelMode): ClassicWheelRangeMode | undefined {
  if (mode === "bowDistance") {
    return "bow";
  }

  if (mode === "clinch") {
    return "clinch";
  }

  if (mode === "distance") {
    return "far";
  }

  return undefined;
}

function getClassicActionSlots(wheelMode: ClassicWheelMode, slotsTuning?: ClassicActionSlotTuning): ClassicActionSlot[] {
  const modeSlots = slotsTuning?.[classicWheelModeTuningKey[wheelMode]];
  const slots = getDefaultClassicActionSlots(wheelMode);

  if (!modeSlots) {
    return slots;
  }

  return slots.map((slot) => ({ ...slot, ...(modeSlots[slot.actionId] ?? {}) }));
}

function getDefaultClassicActionSlots(wheelMode: ClassicWheelMode): ClassicActionSlot[] {
  if (wheelMode === "bow-distance") {
    return CLASSIC_BOW_DISTANCE_SLOTS;
  }

  return wheelMode === "clinch" ? CLASSIC_CLINCH_SLOTS : CLASSIC_DISTANCE_SLOTS;
}

function createClassicButtonLayer(onAction: (actionId: ActionId) => void): ClassicButtonLayer {
  const element = document.createElement("div");
  const buttons = new Map<ActionId, HTMLButtonElement>();
  const chanceBadges = new Map<ActionId, HTMLSpanElement>();

  element.className = "classic-action-bar__layer";

  for (const actionId of actionOrder) {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const chanceBadge = document.createElement("span");

    button.type = "button";
    button.className = "action-arc__button classic-action-bar__button classic-action-bar__button--hidden";
    button.dataset.action = actionId;
    icon.className = "action-arc__icon";
    icon.setAttribute("aria-hidden", "true");
    chanceBadge.className = "action-arc__chance classic-action-bar__chance";
    chanceBadge.hidden = true;
    chanceBadge.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", () => {
      button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

      if (!button.disabled) {
        pressActionTokenButton(button);
        onAction(actionId);
      }
    });
    buttons.set(actionId, button);
    chanceBadges.set(actionId, chanceBadge);
    element.append(button);
    element.append(chanceBadge);
  }

  return {
    element,
    buttons,
    chanceBadges,
    angle: 0,
  };
}

function syncClassicActionChanceBadge(
  badge: HTMLSpanElement,
  actionId: ActionId,
  state: CombatState,
  slot: ClassicActionSlot | undefined,
  isVisible: boolean,
  wheelRotationAngle: number,
): string | undefined {
  const label = getActionHitChanceLabel(actionId, state);

  if (!label || !slot || !isVisible) {
    badge.hidden = true;
    badge.textContent = "";
    return undefined;
  }

  badge.hidden = false;
  badge.textContent = label;
  const screenOffset = projectPointForWheelAngle(0, CLASSIC_CHANCE_BADGE_SCREEN_OFFSET_Y, wheelRotationAngle);

  badge.style.setProperty("--classic-chance-x", `${formatCssNumber(slot.x + screenOffset.x)}px`);
  badge.style.setProperty("--classic-chance-y", `${formatCssNumber(slot.y + screenOffset.y)}px`);
  badge.style.setProperty("--classic-chance-counter-rotation", `${formatCssNumber(-wheelRotationAngle)}deg`);
  return label;
}

function projectPointForWheelAngle(x: number, y: number, wheelAngle: number): { x: number; y: number } {
  const radians = (-wheelAngle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function projectSlotForWheelAngle(slot: ClassicActionSlot, wheelAngle: number): ClassicActionSlot {
  const radians = (-wheelAngle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    ...slot,
    x: slot.x * cos - slot.y * sin,
    y: slot.x * sin + slot.y * cos,
    rotation: slot.rotation - wheelAngle,
  };
}

function formatCssNumber(value: number): string {
  return `${Math.round(value * 1000) / 1000}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
