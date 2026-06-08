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

export const ACTION_ARC_BUTTON_EDGE = 38;
export const ACTION_ARC_MIN_Y = 126;
export const ACTION_ARC_MAX_Y = GAME_HEIGHT - 132;

const ACTION_ARC_CENTER_OFFSET_X = 0;
const ACTION_ARC_CENTER_OFFSET_Y = -70;

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
  const maxX = actionViewport.width - buttonEdge;
  const maxY = actionViewport.height - (GAME_HEIGHT - ACTION_ARC_MAX_Y);
  const slots = state.activeTurn === "player" && state.result === "playing" ? (state.distance <= MELEE_RANGE ? CLINCH_SLOTS : DISTANCE_SLOTS) : [];

  return {
    centerX: clamp(centerX, buttonEdge, maxX),
    centerY: clamp(centerY, ACTION_ARC_MIN_Y, maxY),
    buttons: slots.map((slot) => {
      const actionId = getSlotActionId(slot, state);
      const angle = getActionAngle(actionId, tuning) + actionArcRotation;
      const radians = (angle * Math.PI) / 180;
      const label = ACTION_LABELS[actionId];
      const offset = tuning?.actionButtonOffsets?.[actionId] ?? { x: 0, y: 0 };

      return {
        actionId,
        label: label.label,
        detail: label.detail,
        x: clamp(centerX + Math.cos(radians) * radius + offset.x, buttonEdge, maxX),
        y: clamp(centerY + Math.sin(radians) * radius + offset.y, ACTION_ARC_MIN_Y, maxY),
        scale: actionButtonScale,
        angle,
      };
    }),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
