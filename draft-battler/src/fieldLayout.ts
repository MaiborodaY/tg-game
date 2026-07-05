export type FieldOwner = "player" | "enemy";

export interface FieldPoint {
  x: number;
  y: number;
}

export interface FieldLayout {
  width: number;
  height: number;
  centerY: number;
  fieldTopY: number;
  fieldBottomY: number;
  fieldTopLeftX: number;
  fieldTopRightX: number;
  fieldBottomLeftX: number;
  fieldBottomRightX: number;
  laneFractions: readonly [number, number, number];
  slotLaneFractions: readonly [number, number, number];
  castleY: Record<FieldOwner, number>;
  homeRowsY: Record<FieldOwner, readonly [number, number]>;
  clashRowsY: Record<FieldOwner, readonly [number, number]>;
  castleApproachY: Record<FieldOwner, number>;
}

export const FIELD_FALLBACK_WIDTH = 390;
export const FIELD_FALLBACK_HEIGHT = 720;
export const DRAFT_CAMERA_ZOOM = 0.86;

const FIELD_TOP_Y = 104;
const FIELD_BOTTOM_INSET = 52;
const FIELD_TOP_LEFT_RATIO = 0.42;
const FIELD_TOP_RIGHT_RATIO = 0.58;
const FIELD_BOTTOM_LEFT_RATIO = -0.2;
const FIELD_BOTTOM_RIGHT_RATIO = 1.2;
const UNIT_PERSPECTIVE_FAR_SCALE = 0.6;
const UNIT_PERSPECTIVE_NEAR_SCALE = 1.16;
const DRAFT_SLOT_PERSPECTIVE_FAR_SCALE = 0.68;
const DRAFT_SLOT_PERSPECTIVE_NEAR_SCALE = 1.18;

export function createFieldLayout(width: number, height: number): FieldLayout {
  const centerY = height / 2;
  const fieldTopY = FIELD_TOP_Y;
  const fieldBottomY = height - FIELD_BOTTOM_INSET;

  return {
    width,
    height,
    centerY,
    fieldTopY,
    fieldBottomY,
    fieldTopLeftX: width * FIELD_TOP_LEFT_RATIO,
    fieldTopRightX: width * FIELD_TOP_RIGHT_RATIO,
    fieldBottomLeftX: width * FIELD_BOTTOM_LEFT_RATIO,
    fieldBottomRightX: width * FIELD_BOTTOM_RIGHT_RATIO,
    laneFractions: [0.12, 0.5, 0.88],
    slotLaneFractions: [0.28, 0.5, 0.72],
    castleY: {
      enemy: 50,
      player: height - 4,
    },
    homeRowsY: {
      enemy: [height * 0.28, height * 0.2],
      player: [height * 0.67, height * 0.78],
    },
    clashRowsY: {
      enemy: [centerY - 68, centerY - 108],
      player: [centerY + 38, centerY + 74],
    },
    castleApproachY: {
      enemy: 106,
      player: height - 78,
    },
  };
}

export function projectDraftPoint(layout: FieldLayout, point: FieldPoint, zoom = DRAFT_CAMERA_ZOOM): FieldPoint {
  return {
    x: (point.x - layout.width / 2) * zoom + layout.width / 2,
    y: (point.y - layout.centerY) * zoom + layout.centerY,
  };
}

export function getFieldRatio(layout: FieldLayout, y: number): number {
  return clamp((y - layout.fieldTopY) / (layout.fieldBottomY - layout.fieldTopY), 0, 1);
}

export function getFieldLeftX(layout: FieldLayout, y: number): number {
  return linear(layout.fieldTopLeftX, layout.fieldBottomLeftX, getFieldRatio(layout, y));
}

export function getFieldRightX(layout: FieldLayout, y: number): number {
  return linear(layout.fieldTopRightX, layout.fieldBottomRightX, getFieldRatio(layout, y));
}

export function getLaneX(layout: FieldLayout, column: number, y: number): number {
  const fraction = layout.laneFractions[column] ?? 0.5;

  return linear(getFieldLeftX(layout, y), getFieldRightX(layout, y), fraction);
}

export function getSlotLaneX(layout: FieldLayout, column: number, y: number): number {
  const fraction = layout.slotLaneFractions[column] ?? 0.5;

  return linear(getFieldLeftX(layout, y), getFieldRightX(layout, y), fraction);
}

export function getUnitPerspectiveScale(layout: FieldLayout, y: number): number {
  return linear(UNIT_PERSPECTIVE_FAR_SCALE, UNIT_PERSPECTIVE_NEAR_SCALE, getFieldRatio(layout, y));
}

export function getDraftSlotPerspectiveScale(layout: FieldLayout, y: number): number {
  return linear(DRAFT_SLOT_PERSPECTIVE_FAR_SCALE, DRAFT_SLOT_PERSPECTIVE_NEAR_SCALE, getFieldRatio(layout, y));
}

export function getFieldSlotColumn(slotIndex: number): number {
  return slotIndex % 3;
}

export function getFieldSlotRow(slotIndex: number): number {
  return slotIndex >= 3 ? 1 : 0;
}

function linear(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
