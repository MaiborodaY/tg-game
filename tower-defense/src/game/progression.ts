import { FINAL_WAVE } from "./config.ts";
import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  ENDLESS_MODE_ID,
  getLevelDefinition,
} from "./content.ts";
import type { PlayerProfileSnapshot } from "./profile.ts";

export const FOREST_GATE_CLEAR_WAVES = FINAL_WAVE;

export function hasClearedLevelCampaign(
  profile: PlayerProfileSnapshot | null,
  levelId: string,
): boolean {
  const level = getLevelDefinition(levelId);
  if (!level) return false;
  return profile?.bestResults.some((result) => (
    result.levelId === levelId
    && result.outcome === "victory"
    && result.completedWaves >= level.waves.finalWave
  )) ?? false;
}

export function hasClearedForestGateCampaign(profile: PlayerProfileSnapshot | null): boolean {
  return hasClearedLevelCampaign(profile, CLASSIC_CAMPAIGN_LEVEL_ID);
}

export function isSessionAvailable(
  levelId: string,
  modeId: string,
  profile: PlayerProfileSnapshot | null,
): boolean {
  if (modeId === CAMPAIGN_MODE_ID) {
    return profile === null || profile.unlockedLevelIds.includes(levelId);
  }
  return modeId === ENDLESS_MODE_ID && hasClearedLevelCampaign(profile, levelId);
}
