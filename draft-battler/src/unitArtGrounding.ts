import type { CardId } from "./game";

export const UNIT_ART_ALPHA_THRESHOLD = 12;
export const DRAFT_UNIT_ART_GROUND_Y = 107;
export const BATTLE_UNIT_ART_GROUND_Y = 25;

export interface UnitArtBounds {
  sourceWidth: number;
  sourceHeight: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GroundedUnitArtPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Measured from these five unit.webp files at alpha > 12. Tests detect artwork drift.
// Keep this opt-in so the older units retain their established framing and animations.
const GROUNDED_UNIT_ART: Partial<Record<CardId, UnitArtBounds>> = {
  plague_rat: { sourceWidth: 384, sourceHeight: 384, left: 11, top: 115, width: 362, height: 254 },
  battle_alchemist: { sourceWidth: 384, sourceHeight: 576, left: 58, top: 34, width: 269, height: 520 },
  night_warden: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 81, width: 362, height: 473 },
  siege_engineer: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 113, width: 362, height: 441 },
  moon_priestess: { sourceWidth: 384, sourceHeight: 576, left: 36, top: 34, width: 312, height: 520 },
};

export function getGroundedUnitArtBounds(cardId: CardId): Readonly<UnitArtBounds> | undefined {
  return GROUNDED_UNIT_ART[cardId];
}

export function getGroundedUnitArtPlacement(
  cardId: CardId,
  maxWidth: number,
  maxHeight: number,
  groundY: number,
): GroundedUnitArtPlacement | undefined {
  const bounds = getGroundedUnitArtBounds(cardId);
  if (!bounds) {
    return undefined;
  }
  if (!Number.isFinite(maxWidth) || !Number.isFinite(maxHeight) || !Number.isFinite(groundY) || maxWidth <= 0 || maxHeight <= 0) {
    throw new RangeError("Grounded unit art requires positive finite dimensions and a finite baseline.");
  }

  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height);
  return {
    x: -(bounds.left + bounds.width / 2) * scale,
    y: groundY - (bounds.top + bounds.height) * scale,
    width: bounds.sourceWidth * scale,
    height: bounds.sourceHeight * scale,
  };
}

export function getGroundedRangedAttackTiming(cardId: CardId, hasAtlas: boolean): { windupMs: number; recoveryMs: number } | undefined {
  return getGroundedUnitArtBounds(cardId)
    ? { windupMs: 90, recoveryMs: hasAtlas ? 125 : 90 }
    : undefined;
}

export function hasGroundedProjectilePose(cardId: CardId): boolean {
  return cardId === "battle_alchemist" || cardId === "siege_engineer" || cardId === "moon_priestess";
}
