import {
  CLASSIC_CAMPAIGN_LEVEL_ID,
  NORTHERN_PASS_LEVEL,
  NORTHERN_PASS_LEVEL_ID,
} from "./content.ts";
import {
  FOREST_GATE_CLEAR_WAVES,
  hasClearedForestGateCampaign,
  hasClearedLevelCampaign,
} from "./progression.ts";
import type { PlayerProfileSnapshot } from "./profile.ts";
import type { HeroId } from "./types.ts";

export const GRAK_UNLOCK_LEVEL_ID = CLASSIC_CAMPAIGN_LEVEL_ID;
export const GRAK_UNLOCK_COMPLETED_WAVES = FOREST_GATE_CLEAR_WAVES;
export const MORNA_UNLOCK_LEVEL_ID = NORTHERN_PASS_LEVEL_ID;
export const MORNA_UNLOCK_COMPLETED_WAVES = NORTHERN_PASS_LEVEL.waves.finalWave;

export function isHeroUnlocked(heroId: HeroId, profile: PlayerProfileSnapshot | null): boolean {
  if (heroId === "grak") return hasClearedForestGateCampaign(profile);
  if (heroId === "morna") return hasClearedLevelCampaign(profile, MORNA_UNLOCK_LEVEL_ID);
  return true;
}
