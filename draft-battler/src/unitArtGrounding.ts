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

// Measured from the redrawn unit.webp files at alpha > 12. Tests detect artwork drift.
// Keep this opt-in so the older units retain their established framing and animations.
const GROUNDED_UNIT_ART: Partial<Record<CardId, UnitArtBounds>> = {
  plague_rat: { sourceWidth: 384, sourceHeight: 384, left: 11, top: 115, width: 362, height: 254 },
  battle_alchemist: { sourceWidth: 384, sourceHeight: 576, left: 58, top: 34, width: 269, height: 520 },
  night_warden: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 81, width: 362, height: 473 },
  siege_engineer: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 113, width: 362, height: 441 },
  moon_priestess: { sourceWidth: 384, sourceHeight: 576, left: 36, top: 34, width: 312, height: 520 },
  phantom_duelist: { sourceWidth: 384, sourceHeight: 576, left: 32, top: 35, width: 320, height: 518 },
  frost_wraith: { sourceWidth: 384, sourceHeight: 576, left: 51, top: 35, width: 282, height: 518 },
  star_seer: { sourceWidth: 384, sourceHeight: 576, left: 61, top: 35, width: 262, height: 519 },
  bronze_minotaur: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 93, width: 362, height: 461 },
  harpy_scout: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 38, width: 362, height: 516 },
  bone_archer: { sourceWidth: 384, sourceHeight: 576, left: 65, top: 34, width: 255, height: 520 },
  rune_warden: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 110, width: 362, height: 444 },
  marsh_stalker: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 185, width: 362, height: 369 },
  ironhide_bear: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 196, width: 362, height: 358 },
  grave_bellringer: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 37, width: 362, height: 517 },
  forest_skirmisher: { sourceWidth: 384, sourceHeight: 576, left: 64, top: 35, width: 256, height: 519 },
  crypt_keeper: { sourceWidth: 384, sourceHeight: 576, left: 61, top: 35, width: 262, height: 518 },
  city_crossbowman: { sourceWidth: 384, sourceHeight: 576, left: 33, top: 35, width: 318, height: 519 },
  smoke_trickster: { sourceWidth: 384, sourceHeight: 576, left: 39, top: 35, width: 306, height: 519 },
  war_mastiff: { sourceWidth: 384, sourceHeight: 576, left: 12, top: 182, width: 361, height: 372 },
  grave_raider: { sourceWidth: 384, sourceHeight: 576, left: 11, top: 44, width: 362, height: 510 },
  soul_hunter: { sourceWidth: 384, sourceHeight: 576, left: 43, top: 35, width: 298, height: 519 },
  headless_knight: { sourceWidth: 384, sourceHeight: 576, left: 30, top: 35, width: 325, height: 519 },
  war_chaplain: { sourceWidth: 384, sourceHeight: 576, left: 39, top: 34, width: 307, height: 520 },
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
  return cardId === "battle_alchemist" || cardId === "siege_engineer" || cardId === "moon_priestess"
    || cardId === "frost_wraith" || cardId === "star_seer" || cardId === "harpy_scout"
    || cardId === "bone_archer" || cardId === "rune_warden" || cardId === "marsh_stalker" || cardId === "grave_bellringer"
    || cardId === "forest_skirmisher" || cardId === "city_crossbowman" || cardId === "smoke_trickster" || cardId === "soul_hunter";
}
