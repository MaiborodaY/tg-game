import {
  ARENA_WORLD_HEIGHT,
  ARENA_WORLD_TOP,
  DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y,
  DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO,
  DEFAULT_CAMERA_FEET_SCREEN_Y,
  DEFAULT_FIGHTER_HUD_GAP,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "./arenaLayout";
import { START_DISTANCE, type CombatState } from "./combat";
import type { ArenaDebugTuning } from "./debugTuning";
import { getStageLayout } from "./stageLayout";

export interface CameraTarget {
  centerX: number;
  centerY: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
  closeness: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface CameraViewport {
  width: number;
  height: number;
  safeBottom?: number;
}

type CameraState = Pick<CombatState, "distance" | "playerPosition" | "enemyPosition"> & Partial<Pick<CombatState, "helper" | "helperPosition">>;

const CLOSE_ZOOM = 2.75;
export function getPlayerWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).playerX;
}

export function getEnemyWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).enemyX;
}

export function getCameraTarget(current: CameraState, tuning?: ArenaDebugTuning, viewport?: Partial<CameraViewport>): CameraTarget {
  const cameraState = getCameraStateForTargeting(current);
  const fighterLayout = getStageLayout(cameraState, tuning);
  const cameraViewport = getCameraViewport(viewport);
  const closeness = clamp((START_DISTANCE - cameraState.distance) / START_DISTANCE, 0, 1);
  const zoom = 1 + closeness * (CLOSE_ZOOM - 1);
  const centerX = (fighterLayout.playerX + fighterLayout.enemyX) / 2;
  const fighterFeetY = (fighterLayout.playerY + fighterLayout.enemyY) / 2;
  const lowAngleAmount = easeInOut(closeness);
  const fighterFeetBaseScreenY = getFiniteNumber(tuning?.cameraFeetScreenY, DEFAULT_CAMERA_FEET_SCREEN_Y);
  const closeFeetShiftY = getFiniteNumber(tuning?.cameraCloseFeetShiftY, DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y);
  const fighterFeetTargetY = fighterFeetBaseScreenY + closeFeetShiftY * lowAngleAmount;
  const fighterHudGap = getFiniteNumber(tuning?.fighterHudGap, DEFAULT_FIGHTER_HUD_GAP);
  const zoomAwareSafeBottom = getFiniteNumber(cameraViewport.safeBottom, cameraViewport.height) - fighterHudGap * zoom;
  const fighterFeetMaxY = Math.min(cameraViewport.height - 112, zoomAwareSafeBottom);
  const fighterFeetMinRatio = clamp(getFiniteNumber(tuning?.cameraFeetMinScreenRatio, DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO), 0.35, 0.75);
  const fighterFeetMinY = Math.min(cameraViewport.height * fighterFeetMinRatio, fighterFeetMaxY);
  const fighterFeetScreenY = clamp(fighterFeetTargetY, fighterFeetMinY, fighterFeetMaxY);
  const centerY = fighterFeetY - (fighterFeetScreenY - cameraViewport.height / 2) / zoom;
  const scrollX = centerX - cameraViewport.width / (2 * zoom);
  const scrollY = clampCameraScrollY(centerY - cameraViewport.height / (2 * zoom), zoom, cameraViewport.height);

  return {
    centerX,
    centerY: scrollY + cameraViewport.height / (2 * zoom),
    scrollX,
    scrollY,
    zoom,
    closeness,
    viewportWidth: cameraViewport.width,
    viewportHeight: cameraViewport.height,
  };
}

function getCameraStateForTargeting(current: CameraState): CameraState {
  if (!current.helper) {
    return current;
  }

  const helperPosition = current.helperPosition ?? current.playerPosition;
  const farthestAlliedPosition = Math.min(current.playerPosition, helperPosition);
  const distance = clamp(current.enemyPosition - farthestAlliedPosition, 0, START_DISTANCE);

  return {
    ...current,
    distance,
    playerPosition: farthestAlliedPosition,
    helperPosition,
  };
}

export function projectWorldToScreen(x: number, y: number, target: CameraTarget): ScreenPoint {
  return {
    x: (x - target.scrollX) * target.zoom,
    y: (y - target.scrollY) * target.zoom,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function getCameraViewport(viewport?: Partial<CameraViewport>): CameraViewport {
  const height = getPositiveNumber(viewport?.height, GAME_HEIGHT);

  return {
    width: getPositiveNumber(viewport?.width, GAME_WIDTH),
    height,
    safeBottom: getPositiveNumber(viewport?.safeBottom, height),
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function getFiniteNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampCameraScrollY(scrollY: number, zoom: number, viewportHeight: number): number {
  const maxScrollY = ARENA_WORLD_TOP + ARENA_WORLD_HEIGHT - viewportHeight / zoom;

  return clamp(scrollY, ARENA_WORLD_TOP, Math.max(ARENA_WORLD_TOP, maxScrollY));
}
