import { ARENA_WORLD_HEIGHT, ARENA_WORLD_TOP, GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
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
}

type CameraState = Pick<CombatState, "distance" | "playerPosition" | "enemyPosition">;

const CLOSE_ZOOM = 2.75;
const FIGHTER_FEET_SCREEN_Y = 560;
const CLOSE_LOW_ANGLE_FEET_SHIFT_Y = 92;

export function getPlayerWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).playerX;
}

export function getEnemyWorldX(current: Pick<CombatState, "playerPosition" | "enemyPosition">, tuning?: ArenaDebugTuning): number {
  return getStageLayout(current, tuning).enemyX;
}

export function getCameraTarget(current: CameraState, tuning?: ArenaDebugTuning, viewport?: Partial<CameraViewport>): CameraTarget {
  const fighterLayout = getStageLayout(current, tuning);
  const cameraViewport = getCameraViewport(viewport);
  const closeness = clamp((START_DISTANCE - current.distance) / START_DISTANCE, 0, 1);
  const zoom = 1 + closeness * (CLOSE_ZOOM - 1);
  const centerX = (fighterLayout.playerX + fighterLayout.enemyX) / 2;
  const fighterFeetY = (fighterLayout.playerY + fighterLayout.enemyY) / 2;
  const lowAngleAmount = easeInOut(closeness);
  const fighterFeetTargetY = FIGHTER_FEET_SCREEN_Y + CLOSE_LOW_ANGLE_FEET_SHIFT_Y * lowAngleAmount;
  const fighterFeetScreenY = clamp(fighterFeetTargetY, cameraViewport.height * 0.58, cameraViewport.height - 112);
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
  return {
    width: getPositiveNumber(viewport?.width, GAME_WIDTH),
    height: getPositiveNumber(viewport?.height, GAME_HEIGHT),
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function clampCameraScrollY(scrollY: number, zoom: number, viewportHeight: number): number {
  const maxScrollY = ARENA_WORLD_TOP + ARENA_WORLD_HEIGHT - viewportHeight / zoom;

  return clamp(scrollY, ARENA_WORLD_TOP, Math.max(ARENA_WORLD_TOP, maxScrollY));
}
