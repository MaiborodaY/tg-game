import type { TowerLevel } from "../game/types.ts";

export const EMBER_MAGE_TIER_ATLAS_SPEC = Object.freeze({
  textureKey: "tower-ember-mage-tier-atlas",
  textureWidth: 512,
  textureHeight: 128,
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 4,
  displayHeight: 56,
  spriteBottomY: 13,
  maxBytes: 64 * 1_024,
});

export const EMBER_MAGE_TIER_FRAMES = Object.freeze({
  1: 0,
  2: 1,
  3: 2,
  4: 3,
}) satisfies Readonly<Record<TowerLevel, number>>;

export function selectEmberMageTierFrame(level: TowerLevel): number {
  return EMBER_MAGE_TIER_FRAMES[level];
}
