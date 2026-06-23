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
import {
  MAX_STAMINA,
  canFighterSwitchWeapon,
  getFighterFireballDamage,
  getFighterPoisonDamage,
  getFighterSpellbookScrollCount,
  getFighterShurikenCount,
  isBowFighter,
  isFighterInClinchRange,
  isRangedFighter,
  type ActionId,
  type CombatState,
} from "./combat";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];

interface ActionArcViewport {
  width: number;
  height: number;
  safeBottom?: number;
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

const DISTANCE_SLOTS: ActionArcSlot[] = [
  { actionId: "forward" },
  { actionId: "back" },
  { actionId: "lunge" },
  { actionId: "switchWeapon" },
  { actionId: "shuriken" },
  { actionId: "scroll" },
  { actionId: "utility" },
];

const BOW_DISTANCE_SLOTS: ActionArcSlot[] = [
  { actionId: "back" },
  { actionId: "heavy" },
  { actionId: "medium" },
  { actionId: "light" },
  { actionId: "switchWeapon" },
  { actionId: "shuriken" },
  { actionId: "scroll" },
  { actionId: "utility" },
];

const CLINCH_SLOTS: ActionArcSlot[] = [
  { actionId: "back" },
  { actionId: "heavy" },
  { actionId: "medium" },
  { actionId: "light" },
  { actionId: "shuriken" },
  { actionId: "scroll" },
  { actionId: "utility" },
];

const ACTION_LABELS: Record<ActionId, { label: string; detail: string }> = {
  forward: { label: "FWD", detail: "Step" },
  back: { label: "BACK", detail: "Back" },
  lunge: { label: "LUNGE", detail: "Dash" },
  light: { label: "LOW", detail: "1 dmg" },
  medium: { label: "MED", detail: "2 dmg" },
  heavy: { label: "STRONG", detail: "4 dmg" },
  switchWeapon: { label: "SWAP", detail: "Weapon" },
  shuriken: { label: "STAR", detail: "Throw" },
  scroll: { label: "SPELL", detail: "Book" },
  fireball: { label: "FIRE", detail: "45 dmg" },
  ward: { label: "WARD", detail: "Absorb" },
  preciseStrike: { label: "TRUE", detail: "Strike" },
  doubleStrike: { label: "2X", detail: "Strike" },
  poison: { label: "TOXIN", detail: "2 turns" },
  taunt: { label: "TAUNT", detail: "Crowd" },
  rest: { label: "REST", detail: "Breath" },
};

const BOW_ACTION_LABELS: Partial<Record<ActionId, { label: string; detail: string }>> = {
  light: { label: "SHOT", detail: "Quick" },
  medium: { label: "AIM", detail: "Aimed" },
  heavy: { label: "POWER", detail: "Shot" },
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
    case "switchWeapon":
      return -7;
    case "shuriken":
      return 21;
    case "scroll":
      return 58;
    case "fireball":
      return 72;
    case "ward":
      return 86;
    case "preciseStrike":
      return 100;
    case "doubleStrike":
      return 114;
    case "poison":
      return 128;
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
  const minX = buttonEdge;
  const maxX = actionViewport.width - buttonEdge;
  const minY = ACTION_ARC_MIN_Y;
  const safeBottom = getFiniteNumber(actionViewport.safeBottom, actionViewport.height);
  const maxY = Math.max(minY, Math.min(actionViewport.height - (GAME_HEIGHT - ACTION_ARC_MAX_Y), safeBottom - buttonEdge));
  const slots = state.activeTurn === "player" && state.result === "playing" ? getActionArcSlots(state) : [];
  const playerButtons = getRawActionArcButtons(
    slots,
    state,
    tuning,
    centerX,
    centerY,
    radius,
    actionArcRotation,
    actionButtonScale,
  );
  const useSharedCenter = touchesSide(playerButtons, minX, maxX, minY, maxY);
  const enemyX = getFiniteNumber(fighterLayout.enemyX, fighterLayout.playerX);
  const enemyY = getFiniteNumber(fighterLayout.enemyY, fighterLayout.playerY);
  const sharedWorldCenterX = (fighterLayout.playerX + enemyX) / 2 + ACTION_ARC_CENTER_OFFSET_X * scale;
  const sharedWorldCenterY = (fighterLayout.playerY + enemyY) / 2 + ACTION_ARC_CENTER_OFFSET_Y * scale;
  const sharedScreenCenter = projectWorldToScreen(sharedWorldCenterX, sharedWorldCenterY, camera);
  const layoutCenterX = useSharedCenter ? sharedScreenCenter.x + (tuning?.actionArcOffsetX ?? 0) : centerX;
  const layoutCenterY = useSharedCenter ? sharedScreenCenter.y + (tuning?.actionArcOffsetY ?? 0) : centerY;
  const buttons = useSharedCenter
    ? getRawActionArcButtons(slots, state, tuning, layoutCenterX, layoutCenterY, radius, actionArcRotation, actionButtonScale)
    : playerButtons;
  const groupShiftX = getGroupShift(
    buttons.map((button) => button.rawX),
    minX,
    maxX,
  );
  const groupShiftY = getGroupShift(
    buttons.map((button) => button.rawY),
    minY,
    maxY,
  );

  return {
    centerX: clamp(layoutCenterX + groupShiftX, minX, maxX),
    centerY: clamp(layoutCenterY + groupShiftY, minY, maxY),
    buttons: buttons.map(({ rawX, rawY, ...button }) => ({
      ...button,
      x: clamp(rawX + groupShiftX, minX, maxX),
      y: clamp(rawY + groupShiftY, minY, maxY),
    })),
  };
}

function getActionArcSlots(state: CombatState): ActionArcSlot[] {
  const isPlayerInClinch = isFighterInClinchRange(state, "player");
  const slots = !isPlayerInClinch && isRangedFighter(state.player) ? BOW_DISTANCE_SLOTS : isPlayerInClinch ? CLINCH_SLOTS : DISTANCE_SLOTS;

  return slots.filter((slot) => slot.actionId === "utility" || shouldShowActionArcSlot(state, slot.actionId));
}

function shouldShowActionArcSlot(state: CombatState, actionId: ActionId): boolean {
  if (actionId === "switchWeapon") {
    return canFighterSwitchWeapon(state.player);
  }

  if (actionId === "shuriken") {
    return getFighterShurikenCount(state.player) > 0;
  }

  if (actionId === "scroll") {
    return getFighterSpellbookScrollCount(state.player) > 0;
  }

  return true;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRawActionArcButtons(
  slots: ActionArcSlot[],
  state: CombatState,
  tuning: StageLayoutTuning | undefined,
  centerX: number,
  centerY: number,
  radius: number,
  actionArcRotation: number,
  actionButtonScale: number,
): RawActionArcButton[] {
  return slots.map((slot) => {
    const actionId = getSlotActionId(slot, state);
    const angle = getActionAngle(actionId, tuning) + actionArcRotation;
    const radians = (angle * Math.PI) / 180;
    const label = getActionLabel(actionId, state);
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
}

function getActionLabel(actionId: ActionId, state: CombatState): { label: string; detail: string } {
  if (actionId === "switchWeapon") {
    return isBowFighter(state.player) ? { label: "MELEE", detail: "Main" } : { label: "BOW", detail: "Range" };
  }

  if (actionId === "fireball") {
    return { label: "FIRE", detail: `${getFighterFireballDamage(state.player)} dmg` };
  }

  if (actionId === "poison") {
    return { label: "TOXIN", detail: `${getFighterPoisonDamage(state.player)}x2` };
  }

  if (isRangedFighter(state.player) && !isFighterInClinchRange(state, "player")) {
    return BOW_ACTION_LABELS[actionId] ?? ACTION_LABELS[actionId];
  }

  return ACTION_LABELS[actionId];
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

function touchesSide(buttons: RawActionArcButton[], minX: number, maxX: number, minY: number, maxY: number): boolean {
  return buttons.some((button) => button.rawX <= minX || button.rawX >= maxX || button.rawY <= minY || button.rawY >= maxY);
}

function getActionArcViewport(viewport?: Partial<ActionArcViewport>): ActionArcViewport {
  const height = getPositiveNumber(viewport?.height, GAME_HEIGHT);

  return {
    width: getPositiveNumber(viewport?.width, GAME_WIDTH),
    height,
    safeBottom: getFiniteNumber(viewport?.safeBottom, height),
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function getFiniteNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
