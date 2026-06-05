import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  CAMERA_CENTER_Y,
  CAMERA_PLAYER_SCREEN_X,
  CLOSE_CAMERA_ZOOM,
  FAR_CAMERA_ZOOM,
  GAME_HEIGHT,
  GAME_WIDTH,
  OVERVIEW_DISTANCE,
  OVERVIEW_MAX_ZOOM,
  OVERVIEW_MIN_ZOOM,
  START_ENEMY_SCREEN_X,
  START_PLAYER_SCREEN_X,
} from "./arenaLayout";
import { MAX_DISTANCE, type CombatState } from "./combat";
import type { ArenaDebugTuning } from "./debugTuning";
import { getStageLayout } from "./stageLayout";

export {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  CAMERA_PLAYER_SCREEN_X,
  CLOSE_CAMERA_ZOOM,
  FAR_CAMERA_ZOOM,
  OVERVIEW_DISTANCE,
  OVERVIEW_MAX_ZOOM,
  OVERVIEW_MIN_ZOOM,
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

export interface ScreenPoint {
  x: number;
  y: number;
}

type CameraState = Pick<CombatState, "distance" | "playerPosition" | "enemyPosition">;

export function getPlayerWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).playerX;
}

export function getEnemyWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).enemyX;
}

export function getCameraTarget(current: CameraState, tuning?: ArenaDebugTuning): CameraTarget {
  if (current.distance >= OVERVIEW_DISTANCE) {
    return getOverviewCameraTarget(current, tuning);
  }

  const fighterLayout = getStageLayout(current, tuning);
  const closeness = clamp((MAX_DISTANCE - current.distance) / MAX_DISTANCE, 0, 1);
  const zoom = FAR_CAMERA_ZOOM + closeness * (CLOSE_CAMERA_ZOOM - FAR_CAMERA_ZOOM);
  const enemyInfluence = 0.3 - closeness * 0.12;
  const desiredCenterX = fighterLayout.playerX + (fighterLayout.enemyX - fighterLayout.playerX) * enemyInfluence + (GAME_WIDTH / 2 - CAMERA_PLAYER_SCREEN_X) / zoom;

  return toCameraTarget(desiredCenterX, CAMERA_CENTER_Y, zoom);
}

export function projectWorldToScreen(x: number, y: number, target: CameraTarget): ScreenPoint {
  return {
    x: (x - target.scrollX) * target.zoom,
    y: (y - target.scrollY) * target.zoom,
  };
}

function getOverviewCameraTarget(current: CameraState, tuning?: ArenaDebugTuning): CameraTarget {
  const fighterLayout = getStageLayout(current, tuning);
  const span = Math.max(1, Math.abs(fighterLayout.enemyX - fighterLayout.playerX));
  const desiredScreenSpan = START_ENEMY_SCREEN_X - START_PLAYER_SCREEN_X;
  const zoom = clamp(desiredScreenSpan / span, OVERVIEW_MIN_ZOOM, OVERVIEW_MAX_ZOOM);
  const desiredCenterX = (fighterLayout.playerX + fighterLayout.enemyX) / 2;

  return toCameraTarget(desiredCenterX, CAMERA_CENTER_Y, zoom);
}

function toCameraTarget(centerX: number, centerY: number, zoom: number): CameraTarget {
  const scrollX = clampCameraScrollX(centerX - GAME_WIDTH / (2 * zoom), zoom);
  const scrollY = clampCameraScrollY(centerY - GAME_HEIGHT / (2 * zoom), zoom);

  return {
    centerX: scrollX + GAME_WIDTH / (2 * zoom),
    centerY: scrollY + GAME_HEIGHT / (2 * zoom),
    scrollX,
    scrollY,
    zoom,
  };
}

export function clampCameraCenterX(centerX: number, zoom: number): number {
  const scrollX = clampCameraScrollX(centerX - GAME_WIDTH / (2 * zoom), zoom);

  return scrollX + GAME_WIDTH / (2 * zoom);
}

export function clampCameraScrollX(scrollX: number, zoom: number): number {
  const maxScrollX = ARENA_WORLD_LEFT + ARENA_WORLD_WIDTH - GAME_WIDTH / zoom;

  return clamp(scrollX, ARENA_WORLD_LEFT, Math.max(ARENA_WORLD_LEFT, maxScrollX));
}

export function clampCameraScrollY(scrollY: number, zoom: number): number {
  const maxScrollY = GAME_HEIGHT - GAME_HEIGHT / zoom;

  return clamp(scrollY, 0, Math.max(0, maxScrollY));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}