import { getUnitPerspectiveScale, type FieldLayout } from "../fieldLayout";

export const DRAFT_UNIT_PRESENTATION_SCALE = 0.86;
export const BATTLE_UNIT_PRESENTATION_SCALE = 0.96;
export const BATTLE_CAMERA_ZOOM = 1.24;
export const BATTLE_CAMERA_CLOSE_ZOOM = 1.36;

export type BattlePresentationPhase = "draft" | "battle";

export function getUnitPresentationScale(
  layout: FieldLayout,
  y: number,
  phase: BattlePresentationPhase,
): number {
  const phaseScale = phase === "battle" ? BATTLE_UNIT_PRESENTATION_SCALE : DRAFT_UNIT_PRESENTATION_SCALE;

  return getUnitPerspectiveScale(layout, y) * phaseScale;
}
