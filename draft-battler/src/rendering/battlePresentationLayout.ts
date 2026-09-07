import { getFieldSlotColumn, getFieldSlotRow, getUnitPerspectiveScale, type FieldLayout, type FieldOwner, type FieldPoint } from "../fieldLayout";

export const DRAFT_UNIT_PRESENTATION_SCALE = 0.86;
export const BATTLE_UNIT_PRESENTATION_SCALE = 1;
export const BATTLE_CAMERA_ZOOM = 1.24;
export const BATTLE_CAMERA_CLOSE_ZOOM = 1.36;

export type BattlePresentationPhase = "draft" | "battle";

export interface UnitArtDisplaySize {
  width: number;
  height: number;
}

export interface BattleCameraFrame extends FieldPoint {
  zoom: number;
}

// Includes the complete 96px atlas and the compact vitals strip, not just the torso.
export const BATTLE_UNIT_VISUAL_BOUNDS = { left: -48, right: 48, top: -64, bottom: 45 } as const;

export function getBattleFormationPosition(layout: FieldLayout, owner: FieldOwner, slotIndex: number): FieldPoint {
  const row = getFieldSlotRow(slotIndex);
  const rowGap = 114;
  const rowOffset = row === 0 ? rowGap * 0.5 : rowGap * 1.5;
  const y = layout.centerY + rowOffset * (owner === "player" ? 1 : -1);
  // Presentation-only lane spacing: never alter draft hitboxes or logical combat slots.
  const laneGap = getBattleLaneGap(layout);
  return { x: layout.width / 2 + (getFieldSlotColumn(slotIndex) - 1) * laneGap, y };
}

export function getBattleCameraFrame(layout: FieldLayout): BattleCameraFrame {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const owner of ["player", "enemy"] as const) {
    for (let slot = 0; slot < 6; slot += 1) {
      const point = getBattleFormationPosition(layout, owner, slot);
      const scale = getUnitPresentationScale(layout, point.y, "battle");
      left = Math.min(left, point.x + BATTLE_UNIT_VISUAL_BOUNDS.left * scale);
      right = Math.max(right, point.x + BATTLE_UNIT_VISUAL_BOUNDS.right * scale);
      top = Math.min(top, point.y + BATTLE_UNIT_VISUAL_BOUNDS.top * scale);
      bottom = Math.max(bottom, point.y + BATTLE_UNIT_VISUAL_BOUNDS.bottom * scale);
    }
  }
  // Main battle HUD + controls occupy the first 108px; keep an additional 8px gap.
  const topInset = 116;
  const bottomInset = 54;
  const zoom = Math.min(BATTLE_CAMERA_ZOOM, (layout.width - 24) / (right - left), (layout.height - topInset - bottomInset) / (bottom - top));
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2 - (topInset - bottomInset) / (2 * zoom),
    zoom,
  };
}

export function fitStaticUnitArtSize(
  intrinsicWidth: number,
  intrinsicHeight: number,
  maxWidth: number,
  maxHeight: number,
): UnitArtDisplaySize {
  if (
    !Number.isFinite(intrinsicWidth) ||
    !Number.isFinite(intrinsicHeight) ||
    !Number.isFinite(maxWidth) ||
    !Number.isFinite(maxHeight) ||
    intrinsicWidth <= 0 ||
    intrinsicHeight <= 0 ||
    maxWidth <= 0 ||
    maxHeight <= 0
  ) {
    throw new RangeError("Unit art dimensions must be positive finite numbers.");
  }

  const scale = Math.min(maxWidth / intrinsicWidth, maxHeight / intrinsicHeight);
  return {
    width: intrinsicWidth * scale,
    height: intrinsicHeight * scale,
  };
}

export function getUnitPresentationScale(
  layout: FieldLayout,
  y: number,
  phase: BattlePresentationPhase,
): number {
  const phaseScale = phase === "battle" ? BATTLE_UNIT_PRESENTATION_SCALE : DRAFT_UNIT_PRESENTATION_SCALE;

  const perspective = getUnitPerspectiveScale(layout, y);
  return (phase === "battle" ? Math.min(1.02, getBattleLaneGap(layout) / 100, Math.max(0.82, perspective)) : perspective) * phaseScale;
}

function getBattleLaneGap(layout: FieldLayout): number {
  return Math.min(110, layout.width * 0.27);
}
