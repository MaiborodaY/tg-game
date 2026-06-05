import {
  DEFAULT_ENEMY_SCALE,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_ENEMY_STAGE_Y,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_STAGE_Y,
  DEFAULT_STAGE_ORIGIN_X,
  DEFAULT_STAGE_ORIGIN_Y,
  POSITION_PIXEL_STEP,
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

export function getStageLayout(current: CombatState, tuning?: ArenaDebugTuning): RuntimeStageLayout {
  const originX = tuning?.originX ?? DEFAULT_STAGE_ORIGIN_X;
  const originY = tuning?.originY ?? DEFAULT_STAGE_ORIGIN_Y;
  const playerStageX = tuning?.playerStageX ?? DEFAULT_PLAYER_STAGE_X;
  const playerStageY = tuning?.playerStageY ?? DEFAULT_PLAYER_STAGE_Y;
  const enemyStageX = tuning?.enemyStageX ?? DEFAULT_ENEMY_STAGE_X;
  const enemyStageY = tuning?.enemyStageY ?? DEFAULT_ENEMY_STAGE_Y;

  return {
    playerX: originX + playerStageX + current.playerPosition * POSITION_PIXEL_STEP,
    playerY: originY + playerStageY,
    enemyX: originX + enemyStageX + (current.enemyPosition - START_DISTANCE) * POSITION_PIXEL_STEP,
    enemyY: originY + enemyStageY,
    playerScale: tuning?.playerScale ?? DEFAULT_PLAYER_SCALE,
    enemyScale: tuning?.enemyScale ?? DEFAULT_ENEMY_SCALE,
  };
}
