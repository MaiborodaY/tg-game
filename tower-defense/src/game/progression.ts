import { FINAL_WAVE } from "./config.ts";
import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  ENDLESS_MODE_ID,
} from "./content.ts";
import type { PlayerProfileSnapshot } from "./profile.ts";

export const FOREST_GATE_CLEAR_WAVES = FINAL_WAVE;

export function hasClearedForestGateCampaign(profile: PlayerProfileSnapshot | null): boolean {
  return profile?.bestResults.some((result) => (
    result.levelId === CLASSIC_CAMPAIGN_LEVEL_ID
    && result.outcome === "victory"
    && result.completedWaves >= FOREST_GATE_CLEAR_WAVES
  )) ?? false;
}

export function isSessionAvailable(
  levelId: string,
  modeId: string,
  profile: PlayerProfileSnapshot | null,
): boolean {
  if (modeId === CAMPAIGN_MODE_ID) {
    return profile === null || profile.unlockedLevelIds.includes(levelId);
  }
  return modeId === ENDLESS_MODE_ID
    && levelId === CLASSIC_CAMPAIGN_LEVEL_ID
    && hasClearedForestGateCampaign(profile);
}
