import { FINAL_WAVE } from "./config.ts";
import { CLASSIC_CAMPAIGN_LEVEL_ID } from "./content.ts";
import type { PlayerProfileSnapshot } from "./profile.ts";
import type { HeroId } from "./types.ts";

export const GRAK_UNLOCK_LEVEL_ID = CLASSIC_CAMPAIGN_LEVEL_ID;
export const GRAK_UNLOCK_COMPLETED_WAVES = FINAL_WAVE;

export function isHeroUnlocked(heroId: HeroId, profile: PlayerProfileSnapshot | null): boolean {
  if (heroId !== "grak") return true;
  return profile?.bestResults.some((result) => (
    result.levelId === GRAK_UNLOCK_LEVEL_ID
    && result.outcome === "victory"
    && result.completedWaves >= GRAK_UNLOCK_COMPLETED_WAVES
  )) ?? false;
}
