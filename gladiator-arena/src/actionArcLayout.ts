import { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
import { MELEE_RANGE, type ActionId, type CombatState } from "./combat";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];

interface ActionArcSlot {
  actionId: ActionId;
  angle: number;
}

export interface ActionArcButtonLayout {
  actionId: ActionId;
  label: string;
  detail: string;
  x: number;
  y: number;
}

export interface ActionArcLayout {
  centerX: number;
  centerY: number;
  buttons: ActionArcButtonLayout[];
}

export const ACTION_ARC_BUTTON_EDGE = 38;
export const ACTION_ARC_MIN_Y = 126;
export const ACTION_ARC_MAX_Y = GAME_HEIGHT - 132;

const ACTION_ARC_RADIUS = 62;
const ACTION_ARC_CENTER_OFFSET_X = 4;
const ACTION_ARC_CENTER_OFFSET_Y = -120;

const DISTANCE_SLOTS: ActionArcSlot[] = [
  { actionId: "forward", angle: -108 },
  { actionId: "back", angle: -166 },
  { actionId: "lunge", angle: -34 },
  { actionId: "rest", angle: 106 },
];

const CLINCH_SLOTS: ActionArcSlot[] = [
  { actionId: "back", angle: -166 },
  { actionId: "heavy", angle: -108 },
  { actionId: "light", angle: -34 },
  { actionId: "taunt", angle: 28 },
  { actionId: "rest", angle: 112 },
];

const ACTION_LABELS: Record<ActionId, { label: string; detail: string }> = {
  forward: { label: "FWD", detail: "Step" },
  back: { label: "BACK", detail: "Back" },
  lunge: { label: "LUNGE", detail: "Dash" },
  light: { label: "SLASH", detail: "Quick" },
  heavy: { label: "BONK", detail: "Heavy" },
  block: { label: "BLOCK", detail: "Guard" },
  taunt: { label: "TAUNT", detail: "Crowd" },
  rest: { label: "REST", detail: "Breath" },
};

export function getActionArcLayout(state: CombatState, tuning?: StageLayoutTuning): ActionArcLayout {
  const fighterLayout = getStageLayout(state, tuning);
  const scale = Math.max(0.7, Math.min(1.35, fighterLayout.playerScale));
  const centerX = fighterLayout.playerX + ACTION_ARC_CENTER_OFFSET_X * scale;
  const centerY = fighterLayout.playerY + ACTION_ARC_CENTER_OFFSET_Y * scale;
  const radius = ACTION_ARC_RADIUS * scale;
  const slots = state.distance <= MELEE_RANGE ? CLINCH_SLOTS : DISTANCE_SLOTS;

  return {
    centerX: clamp(centerX, ACTION_ARC_BUTTON_EDGE, GAME_WIDTH - ACTION_ARC_BUTTON_EDGE),
    centerY: clamp(centerY, ACTION_ARC_MIN_Y, ACTION_ARC_MAX_Y),
    buttons: slots.map((slot) => {
      const radians = (slot.angle * Math.PI) / 180;
      const label = ACTION_LABELS[slot.actionId];

      return {
        actionId: slot.actionId,
        label: label.label,
        detail: label.detail,
        x: clamp(centerX + Math.cos(radians) * radius, ACTION_ARC_BUTTON_EDGE, GAME_WIDTH - ACTION_ARC_BUTTON_EDGE),
        y: clamp(centerY + Math.sin(radians) * radius, ACTION_ARC_MIN_Y, ACTION_ARC_MAX_Y),
      };
    }),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}