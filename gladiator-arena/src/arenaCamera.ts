import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  CAMERA_CENTER_Y,
  CAMERA_PLAYER_SCREEN_X,
  CLOSE_CAMERA_ZOOM,
  ENEMY_BASE_X,
  FAR_CAMERA_ZOOM,
  GAME_HEIGHT,
  GAME_WIDTH,
  OVERVIEW_DISTANCE,
  OVERVIEW_MAX_ZOOM,
  OVERVIEW_MIN_ZOOM,
  POSITION_PIXEL_STEP,
  PLAYER_BASE_X,
  START_ENEMY_SCREEN_X,
  START_PLAYER_SCREEN_X,
} from "./arenaLayout";
import { MAX_DISTANCE, START_DISTANCE, type CombatState } from "./combat";

export {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  CAMERA_PLAYER_SCREEN_X,
  CLOSE_CAMERA_ZOOM,
  FAR_CAMERA_ZOOM,
  OVERVIEW_DISTANCE,
  OVERVIEW_MAX_ZOOM,
  OVERVIEW_MIN_ZOOM,
  POSITION_PIXEL_STEP,
  START_ENEMY_SCREEN_X,
  START_PLAYER_SCREEN_X,
} from "./arenaLayout";

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

export function getCameraTarget(current: Pick<CombatState, "distance" | "playerPosition" | "enemyPosition">): CameraTarget {
  if (current.distance >= OVERVIEW_DISTANCE) {
    return getOverviewCameraTarget(current);
  }

  const closeness = (MAX_DISTANCE - current.distance) / MAX_DISTANCE;
  const zoom = FAR_CAMERA_ZOOM + closeness * (CLOSE_CAMERA_ZOOM - FAR_CAMERA_ZOOM);
  const playerX = getPlayerWorldX(current);
  const desiredCenterX = playerX + (GAME_WIDTH / 2 - CAMERA_PLAYER_SCREEN_X) / zoom;
  const centerX = clampCameraCenterX(desiredCenterX, zoom);
  const centerY = CAMERA_CENTER_Y;

  return toCameraTarget(centerX, centerY, zoom);
}

function getOverviewCameraTarget(current: Pick<CombatState, "playerPosition" | "enemyPosition">): CameraTarget {
  const playerX = getPlayerWorldX(current);
  const enemyX = getEnemyWorldX(current);
  const span = Math.abs(enemyX - playerX);
  const desiredScreenSpan = START_ENEMY_SCREEN_X - START_PLAYER_SCREEN_X;
  const zoom = clamp(desiredScreenSpan / span, OVERVIEW_MIN_ZOOM, OVERVIEW_MAX_ZOOM);
  const desiredCenterX = playerX + (GAME_WIDTH / 2 - START_PLAYER_SCREEN_X) / zoom;
  const centerX = clampCameraCenterX(desiredCenterX, zoom);
  const centerY = CAMERA_CENTER_Y;

  return toCameraTarget(centerX, centerY, zoom);
}

function toCameraTarget(centerX: number, centerY: number, zoom: number): CameraTarget {
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

  return clamp(centerX, minCenterX, maxCenterX);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
