import {
  DEFAULT_ENEMY_SCALE,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_ENEMY_STAGE_Y,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_STAGE_Y,
  DEFAULT_STAGE_ORIGIN_X,
  DEFAULT_STAGE_ORIGIN_Y,
} from "./arenaLayout";
import { START_DISTANCE, type CombatState } from "./combat";
import type { ArenaDebugTuning } from "./debugTuning";

export interface RuntimeStageLayout {
  playerX: number;
  playerY: number;
  enemyX: number;
  enemyY: number;
  playerScale: number;
  enemyScale: number;
}

export const CLINCH_VISUAL_GAP = 44;

export function getStageLayout(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): RuntimeStageLayout {
  const originX = tuning?.originX ?? DEFAULT_STAGE_ORIGIN_X;
  const originY = tuning?.originY ?? DEFAULT_STAGE_ORIGIN_Y;
  const playerStageX = tuning?.playerStageX ?? DEFAULT_PLAYER_STAGE_X;
  const playerStageY = tuning?.playerStageY ?? DEFAULT_PLAYER_STAGE_Y;
  const enemyStageX = tuning?.enemyStageX ?? DEFAULT_ENEMY_STAGE_X;
  const enemyStageY = tuning?.enemyStageY ?? DEFAULT_ENEMY_STAGE_Y;
  const playerBaseX = originX + playerStageX;
  const enemyBaseX = originX + enemyStageX;
  const positionStep = getPositionStep(playerBaseX, enemyBaseX);
  const playerX = playerBaseX + current.playerPosition * positionStep;
  const enemyX = enemyBaseX + (current.enemyPosition - START_DISTANCE) * positionStep;

  return {
    playerX,
    playerY: originY + playerStageY,
    enemyX,
    enemyY: originY + enemyStageY,
    playerScale: tuning?.playerScale ?? DEFAULT_PLAYER_SCALE,
    enemyScale: tuning?.enemyScale ?? DEFAULT_ENEMY_SCALE,
  };
}

function getPositionStep(playerBaseX: number, enemyBaseX: number): number {
  const playableGap = Math.max(0, enemyBaseX - playerBaseX - CLINCH_VISUAL_GAP);

  return playableGap / START_DISTANCE;
}
