import {
  DEFAULT_ACTION_ARC_RADIUS,
  DEFAULT_ACTION_ARC_ROTATION,
  DEFAULT_ACTION_BACK_ANGLE,
  DEFAULT_ACTION_BUTTON_SCALE,
  DEFAULT_ACTION_FORWARD_ANGLE,
  DEFAULT_ACTION_HEAVY_ANGLE,
  DEFAULT_ACTION_LIGHT_ANGLE,
  DEFAULT_ACTION_LUNGE_ANGLE,
  DEFAULT_ACTION_MEDIUM_ANGLE,
  DEFAULT_ACTION_REST_ANGLE,
  DEFAULT_ACTION_TAUNT_ANGLE,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "./arenaLayout";
import { getCameraTarget, projectWorldToScreen } from "./arenaCamera";
import { MAX_STAMINA, MELEE_RANGE, type ActionId, type CombatState } from "./combat";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];

interface ActionArcViewport {
  width: number;
  height: number;
}

interface ActionArcSlot {
  actionId: ActionId | "utility";
}

export interface ActionArcButtonLayout {
  actionId: ActionId;
  label: string;
  detail: string;
  x: number;
  y: number;
  scale: number;
  angle: number;
}

export interface ActionArcLayout {
  centerX: number;
  centerY: number;
  buttons: ActionArcButtonLayout[];
}

interface RawActionArcButton extends ActionArcButtonLayout {
  rawX: number;
  rawY: number;
}

export const ACTION_ARC_BUTTON_EDGE = 38;
export const ACTION_ARC_MIN_Y = 126;
export const ACTION_ARC_MAX_Y = GAME_HEIGHT - 132;

const ACTION_ARC_CENTER_OFFSET_X = 0;
const ACTION_ARC_CENTER_OFFSET_Y = -70;
const ACTION_ARC_SCREEN_PADDING = 12;

const DISTANCE_SLOTS: ActionArcSlot[] = [
  { actionId: "forward" },
  { actionId: "back" },
  { actionId: "lunge" },
  { actionId: "utility" },
];

const CLINCH_SLOTS: ActionArcSlot[] = [
  { actionId: "back" },
  { actionId: "heavy" },
  { actionId: "medium" },
  { actionId: "light" },
  { actionId: "utility" },
];

const ACTION_LABELS: Record<ActionId, { label: string; detail: string }> = {
  forward: { label: "FWD", detail: "Step" },
  back: { label: "BACK", detail: "Back" },
  lunge: { label: "LUNGE", detail: "Dash" },
  light: { label: "LOW", detail: "1 dmg" },
  medium: { label: "MED", detail: "2 dmg" },
  heavy: { label: "STRONG", detail: "4 dmg" },
  taunt: { label: "TAUNT", detail: "Crowd" },
  rest: { label: "REST", detail: "Breath" },
};

function getSlotActionId(slot: ActionArcSlot, state: CombatState): ActionId {
  if (slot.actionId !== "utility") {
    return slot.actionId;
  }

  return state.player.stamina < (state.player.maxStamina ?? MAX_STAMINA) / 2 ? "rest" : "taunt";
}

function getActionAngle(actionId: ActionId, tuning?: StageLayoutTuning): number {
  switch (actionId) {
    case "forward":
      return tuning?.actionForwardArcAngle ?? DEFAULT_ACTION_FORWARD_ANGLE;
    case "back":
      return tuning?.actionBackArcAngle ?? DEFAULT_ACTION_BACK_ANGLE;
    case "lunge":
      return tuning?.actionLungeArcAngle ?? DEFAULT_ACTION_LUNGE_ANGLE;
    case "light":
      return tuning?.actionLightArcAngle ?? DEFAULT_ACTION_LIGHT_ANGLE;
    case "medium":
      return tuning?.actionMediumArcAngle ?? DEFAULT_ACTION_MEDIUM_ANGLE;
    case "heavy":
      return tuning?.actionHeavyArcAngle ?? DEFAULT_ACTION_HEAVY_ANGLE;
    case "taunt":
      return tuning?.actionTauntArcAngle ?? DEFAULT_ACTION_TAUNT_ANGLE;
    case "rest":
      return tuning?.actionRestArcAngle ?? DEFAULT_ACTION_REST_ANGLE;
  }
}

export function getActionArcLayout(state: CombatState, tuning?: StageLayoutTuning, viewport?: Partial<ActionArcViewport>): ActionArcLayout {
  const actionViewport = getActionArcViewport(viewport);
  const fighterLayout = getStageLayout(state, tuning);
  const camera = getCameraTarget(state, tuning, actionViewport);
  const scale = Math.max(0.7, Math.min(1.35, fighterLayout.playerScale));
  const actionArcRotation = tuning?.actionArcRotation ?? DEFAULT_ACTION_ARC_ROTATION;
  const actionArcRadius = tuning?.actionArcRadius ?? DEFAULT_ACTION_ARC_RADIUS;
  const actionButtonScale = tuning?.actionButtonScale ?? DEFAULT_ACTION_BUTTON_SCALE;
  const worldCenterX = fighterLayout.playerX + ACTION_ARC_CENTER_OFFSET_X * scale;
  const worldCenterY = fighterLayout.playerY + ACTION_ARC_CENTER_OFFSET_Y * scale;
  const screenCenter = projectWorldToScreen(worldCenterX, worldCenterY, camera);
  const centerX = screenCenter.x + (tuning?.actionArcOffsetX ?? 0);
  const centerY = screenCenter.y + (tuning?.actionArcOffsetY ?? 0);
  const radius = actionArcRadius * scale;
  const buttonEdge = ACTION_ARC_BUTTON_EDGE * actionButtonScale;
  const minX = buttonEdge + ACTION_ARC_SCREEN_PADDING;
  const maxX = actionViewport.width - buttonEdge - ACTION_ARC_SCREEN_PADDING;
  const minY = ACTION_ARC_MIN_Y + ACTION_ARC_SCREEN_PADDING;
  const maxY = actionViewport.height - (GAME_HEIGHT - ACTION_ARC_MAX_Y) - ACTION_ARC_SCREEN_PADDING;
  const slots = state.activeTurn === "player" && state.result === "playing" ? (state.distance <= MELEE_RANGE ? CLINCH_SLOTS : DISTANCE_SLOTS) : [];
  const rawButtons: RawActionArcButton[] = slots.map((slot) => {
    const actionId = getSlotActionId(slot, state);
    const angle = getActionAngle(actionId, tuning) + actionArcRotation;
    const radians = (angle * Math.PI) / 180;
    const label = ACTION_LABELS[actionId];
    const offset = tuning?.actionButtonOffsets?.[actionId] ?? { x: 0, y: 0 };
    const rawX = centerX + Math.cos(radians) * radius + offset.x;
    const rawY = centerY + Math.sin(radians) * radius + offset.y;

    return {
      actionId,
      label: label.label,
      detail: label.detail,
      rawX,
      rawY,
      x: rawX,
      y: rawY,
      scale: actionButtonScale,
      angle,
    };
  });
  const groupShiftX = getGroupShift(
    rawButtons.map((button) => button.rawX),
    minX,
    maxX,
  );
  const groupShiftY = getGroupShift(
    rawButtons.map((button) => button.rawY),
    minY,
    maxY,
  );

  return {
    centerX: clamp(centerX + groupShiftX, minX, maxX),
    centerY: clamp(centerY + groupShiftY, minY, maxY),
    buttons: rawButtons.map(({ rawX, rawY, ...button }) => ({
      ...button,
      x: clamp(rawX + groupShiftX, minX, maxX),
      y: clamp(rawY + groupShiftY, minY, maxY),
    })),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getGroupShift(values: number[], minBound: number, maxBound: number): number {
  if (values.length === 0) {
    return 0;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueSpan = maxValue - minValue;
  const boundSpan = maxBound - minBound;

  if (valueSpan > boundSpan) {
    return (minBound + maxBound) / 2 - (minValue + maxValue) / 2;
  }

  if (minValue < minBound) {
    return minBound - minValue;
  }

  if (maxValue > maxBound) {
    return maxBound - maxValue;
  }

  return 0;
}

function getActionArcViewport(viewport?: Partial<ActionArcViewport>): ActionArcViewport {
  return {
    width: getPositiveNumber(viewport?.width, GAME_WIDTH),
    height: getPositiveNumber(viewport?.height, GAME_HEIGHT),
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
