import { CLASSIC_CAMPAIGN_LEVEL_ID } from "./content.ts";
import { FOREST_GATE_CLEAR_WAVES, hasClearedForestGateCampaign } from "./progression.ts";
import type { PlayerProfileSnapshot } from "./profile.ts";
import type { HeroId } from "./types.ts";

export const GRAK_UNLOCK_LEVEL_ID = CLASSIC_CAMPAIGN_LEVEL_ID;
export const GRAK_UNLOCK_COMPLETED_WAVES = FOREST_GATE_CLEAR_WAVES;

export function isHeroUnlocked(heroId: HeroId, profile: PlayerProfileSnapshot | null): boolean {
  if (heroId !== "grak") return true;
  return hasClearedForestGateCampaign(profile);
}
