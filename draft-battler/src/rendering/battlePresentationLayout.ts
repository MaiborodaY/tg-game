import { getUnitPerspectiveScale, type FieldLayout } from "../fieldLayout";

export const DRAFT_UNIT_PRESENTATION_SCALE = 0.86;
export const BATTLE_UNIT_PRESENTATION_SCALE = 0.96;
export const BATTLE_CAMERA_ZOOM = 1.24;
export const BATTLE_CAMERA_CLOSE_ZOOM = 1.36;

export type BattlePresentationPhase = "draft" | "battle";

export interface UnitArtDisplaySize {
  width: number;
  height: number;
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

  return getUnitPerspectiveScale(layout, y) * phaseScale;
}
