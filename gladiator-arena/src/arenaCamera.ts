import { GAME_HEIGHT, GAME_WIDTH } from "./assets";
import { MAX_DISTANCE, START_DISTANCE, type CombatState } from "./combat";

export const PLAYER_BASE_X = 274;
export const ENEMY_BASE_X = 766;
export const POSITION_PIXEL_STEP = 140;
export const ARENA_WORLD_PADDING_X = 280;
export const ARENA_WORLD_LEFT = -ARENA_WORLD_PADDING_X;
export const ARENA_WORLD_WIDTH = GAME_WIDTH + ARENA_WORLD_PADDING_X * 2;
export const CAMERA_PLAYER_SCREEN_X = 292;
export const FAR_CAMERA_ZOOM = 1;
export const CLOSE_CAMERA_ZOOM = 1.24;
export const CAMERA_CENTER_Y = GAME_HEIGHT / 2 + 24;

export interface CameraTarget {
  centerX: number;
  centerY: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export function getPlayerWorldX(current: Pick<CombatState, "playerPosition">): number {
  return PLAYER_BASE_X + current.playerPosition * POSITION_PIXEL_STEP;
}

export function getEnemyWorldX(current: Pick<CombatState, "enemyPosition">): number {
  return ENEMY_BASE_X + (current.enemyPosition - START_DISTANCE) * POSITION_PIXEL_STEP;
}

export function getCameraTarget(current: Pick<CombatState, "distance" | "playerPosition">): CameraTarget {
  const closeness = (MAX_DISTANCE - current.distance) / MAX_DISTANCE;
  const zoom = FAR_CAMERA_ZOOM + closeness * (CLOSE_CAMERA_ZOOM - FAR_CAMERA_ZOOM);
  const playerX = getPlayerWorldX(current);
  const desiredCenterX = playerX + (GAME_WIDTH / 2 - CAMERA_PLAYER_SCREEN_X) / zoom;
  const centerX = clampCameraCenterX(desiredCenterX, zoom);
  const centerY = CAMERA_CENTER_Y;

  return {
    centerX,
    centerY,
    scrollX: centerX - GAME_WIDTH / (2 * zoom),
    scrollY: centerY - GAME_HEIGHT / (2 * zoom),
    zoom,
  };
}

export function clampCameraCenterX(centerX: number, zoom: number): number {
  const halfViewWidth = GAME_WIDTH / zoom / 2;
  const minCenterX = ARENA_WORLD_LEFT + halfViewWidth;
  const maxCenterX = ARENA_WORLD_LEFT + ARENA_WORLD_WIDTH - halfViewWidth;

  return Math.max(minCenterX, Math.min(maxCenterX, centerX));
}
