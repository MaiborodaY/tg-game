import { DEFAULT_ACTION_BUTTON_SCALE } from "./arenaLayout";
import { syncActionTokenButton, type ActionTokenTuning } from "./actionArc";
import {
  MELEE_RANGE,
  actionOrder,
  actions,
  canUseAction,
  getActionTitle,
  isBowFighter,
  type ActionId,
  type CombatState,
} from "./combat";
import type { ActionButtonOffsetKey, ClassicActionButtonSlotTuning, ClassicActionWheelMode } from "./debugTuning";

type ClassicActionSlotTuning = Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
type TuningProvider = () => ActionTokenTuning & { classicActionButtonSlots?: ClassicActionSlotTuning };
type ClassicWheelMode = "distance" | "clinch" | "bow-distance";

const CLASSIC_WHEEL_TURN_MS = 520;

interface ClassicActionSlot {
  actionId: ActionId;
  x: number;
  y: number;
  rotation: number;
}

interface ClassicButtonLayer {
  element: HTMLDivElement;
  buttons: Map<ActionId, HTMLButtonElement>;
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
  { actionId: "forward", x: -40, y: -52, rotation: -6 },
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
): ClassicActionBarApi | undefined {
  const root = host.querySelector<HTMLElement>("[data-classic-action-bar]");

  if (!root) {
    return undefined;
  }

  const wheel = document.createElement("div");
  const layers = [createClassicButtonLayer(onAction), createClassicButtonLayer(onAction)];
  let activeLayer = layers[0];
  let lastState: CombatState | undefined;
  let wheelRotationAngle = 0;
  let isWheelTurning = false;
  let wheelTurnTimer: number | undefined;

  root.replaceChildren();
  wheel.className = "classic-action-bar__wheel";
  layers.forEach((layer) => wheel.append(layer.element));
  root.append(wheel);

  function sync(state: CombatState): void {
    const tuning = getTuning?.();
    const buttonScale = tuning?.actionButtonScale ?? DEFAULT_ACTION_BUTTON_SCALE;
    const wheelMode = getClassicWheelMode(state);
    const isBattleActive = state.result === "playing";
    const hasPlayerControl = isBattleActive && state.activeTurn === "player";

    if (!activeLayer.mode) {
      activeLayer.mode = wheelMode;
      activeLayer.angle = wheelRotationAngle;
    }

    if (hasPlayerControl && !isWheelTurning && activeLayer.mode !== wheelMode) {
      startWheelTransition(wheelMode);
    }

    const activeWheelMode = activeLayer.mode ?? wheelMode;

    root.dataset.classicWheelMode = activeWheelMode;
    root.classList.toggle("classic-action-bar--distance", activeWheelMode === "distance");
    root.classList.toggle("classic-action-bar--clinch", activeWheelMode === "clinch");
    root.classList.toggle("classic-action-bar--bow-distance", activeWheelMode === "bow-distance");
    root.classList.toggle("classic-action-bar--turning", isWheelTurning);
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
      const slot = visibleSlots.get(actionId);
      const isVisible = shouldShowButtons && Boolean(slot);
      const isDimmed = isVisible && !isInteractiveLayer;
      const projectedSlot = slot ? projectSlotForWheelAngle(slot, layer.angle) : undefined;

      if (!icon) {
        continue;
      }

      button.style.setProperty("--classic-slot-x", `${formatCssNumber(projectedSlot?.x ?? 0)}px`);
      button.style.setProperty("--classic-slot-y", `${formatCssNumber(projectedSlot?.y ?? 18)}px`);
      button.style.setProperty("--classic-slot-rotation", `${formatCssNumber(projectedSlot?.rotation ?? 0)}deg`);
      syncActionTokenButton(button, icon, actionId, tuning, buttonScale);
      button.disabled = !isInteractiveLayer || !isVisible || !canUseAction(state, actionId, "player");
      button.tabIndex = isVisible && isInteractiveLayer ? 0 : -1;
      button.setAttribute("aria-hidden", isVisible ? "false" : "true");
      button.classList.toggle("classic-action-bar__button--visible", isVisible);
      button.classList.toggle("classic-action-bar__button--hidden", !isVisible);
      button.classList.toggle("classic-action-bar__button--dimmed", isDimmed);

      const title = getActionTitle(actionId, state.player);

      button.setAttribute("aria-label", `${title} ${actions[actionId].detail}`);
      button.title = `${title} ${actions[actionId].detail}`;
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
      root.replaceChildren();
    },
  };
}

function getClassicWheelMode(state: CombatState): ClassicWheelMode {
  if (isBowFighter(state.player) && state.distance > MELEE_RANGE) {
    return "bow-distance";
  }

  return state.distance <= MELEE_RANGE ? "clinch" : "distance";
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

  element.className = "classic-action-bar__layer";

  for (const actionId of actionOrder) {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.type = "button";
    button.className = "action-arc__button classic-action-bar__button classic-action-bar__button--hidden";
    button.dataset.action = actionId;
    icon.className = "action-arc__icon";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", () => {
      button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

      if (!button.disabled) {
        onAction(actionId);
      }
    });
    buttons.set(actionId, button);
    element.append(button);
  }

  return {
    element,
    buttons,
    angle: 0,
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
