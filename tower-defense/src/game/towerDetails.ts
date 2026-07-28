import {
  MASTERY_UNLOCK_WAVE,
  MAX_TOWER_LEVEL,
  TOWER_DEFINITIONS,
  getTowerStats,
  getTowerTotalInvestment,
} from "./config.ts";
import { getTower } from "./state.ts";
import type { CampaignState, TowerPlacement, TowerStats } from "./types.ts";

export type TowerSelectionState = Readonly<{
  campaign: CampaignState;
  selectedPadId: number | null;
}>;

export function getSelectedTowerDetails(state: TowerSelectionState): Readonly<{
  tower: TowerPlacement;
  stats: TowerStats;
  upgradeCost: number | null;
  sellValue: number;
  masteryLocked: boolean;
}> | null {
  if (state.selectedPadId === null) return null;
  const tower = getTower(state.campaign, state.selectedPadId);
  if (!tower) return null;
  return Object.freeze({
    tower,
    stats: getTowerStats(tower.type, tower.level),
    upgradeCost: tower.level < MAX_TOWER_LEVEL
      ? TOWER_DEFINITIONS[tower.type].upgradeCosts[tower.level - 1]
      : null,
    sellValue: Math.floor(getTowerTotalInvestment(tower.type, tower.level) * 0.65),
    masteryLocked: tower.level === 3 && state.campaign.completedWave < MASTERY_UNLOCK_WAVE,
  });
}
