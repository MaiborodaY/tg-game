import type { EnemyType, Point } from "../game/types.ts";
import {
  getPointAtDistance,
  getRouteAngleAtDistance,
  type PathMetrics,
} from "../game/pathing.ts";

export type HeroFrontlineRouteFrame = Readonly<{
  origin: Point;
  angle: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
}>;

export type HeroFrontlineVisualPose = Readonly<{
  x: number;
  y: number;
  rotation: number;
  forwardOffset: number;
  lateralOffset: number;
  progress: number;
}>;

export type HeroFrontlineBypassState = Readonly<{ kind: "overflow"; progress: number }>;

export const HERO_FRONTLINE_VISUAL_BOUNDS = Object.freeze({
  maxContactForward: 46,
  maxContactLateral: 24,
  maxBypassForward: 52,
  maxBypassLateral: 52,
});

const CONTACT_FORWARD_BY_TYPE = Object.freeze({
  raider: 25,
  swift: 24,
  brute: 30,
  warden: 27,
  shade: 26,
  bulwark: 31,
  shaman: 27,
  boss: 42,
  titan: 46,
}) satisfies Readonly<Record<EnemyType, number>>;

const BYPASS_LATERAL_BY_TYPE = Object.freeze({
  raider: 34,
  swift: 32,
  brute: 39,
  warden: 36,
  shade: 35,
  bulwark: 40,
  shaman: 36,
  boss: 48,
  titan: 52,
}) satisfies Readonly<Record<EnemyType, number>>;

const ENEMY_TYPE_SALT = Object.freeze({
  raider: 0x2d,
  swift: 0x43,
  brute: 0x59,
  warden: 0x6d,
  shade: 0x83,
  bulwark: 0x97,
  shaman: 0xad,
  boss: 0xc1,
  titan: 0xd7,
}) satisfies Readonly<Record<EnemyType, number>>;

export function createHeroFrontlineRouteFrame(path: PathMetrics, heroProgress: number): HeroFrontlineRouteFrame {
  const progress = clamp(heroProgress, 0, path.totalLength);
  return createHeroFrontlineRouteFrameAtPoint(
    getPointAtDistance(path, progress),
    getRouteAngleAtDistance(path, progress),
  );
}

export function createHeroFrontlineRouteFrameAtPoint(
  heroPoint: Point,
  routeAngle: number,
): HeroFrontlineRouteFrame {
  const angle = Number.isFinite(routeAngle) ? routeAngle : 0;
  const x = finiteOrZero(heroPoint.x);
  const y = finiteOrZero(heroPoint.y);
  const tangentX = Math.cos(angle);
  const tangentY = Math.sin(angle);
  return Object.freeze({
    origin: Object.freeze({ x, y }),
    angle,
    tangentX,
    tangentY,
    normalX: -tangentY,
    normalY: tangentX,
  });
}

/** Places held enemies on a shallow arc in front of the hero without changing their gameplay position. */
export function getHeroFrontlineContactPose(
  frame: HeroFrontlineRouteFrame,
  enemyType: EnemyType,
  slotIndex: number,
  slotCount: number,
): HeroFrontlineVisualPose {
  const count = Math.max(1, Math.floor(finiteOrZero(slotCount)));
  const index = clamp(Math.floor(finiteOrZero(slotIndex)), 0, count - 1);
  const centeredSlot = count === 1 ? 0 : (index / (count - 1)) * 2 - 1;
  const major = isMajorEnemy(enemyType);
  const spread = major
    ? Math.min(10, Math.max(0, (count - 1) * 5))
    : Math.min(HERO_FRONTLINE_VISUAL_BOUNDS.maxContactLateral, Math.max(0, (count - 1) * 13));
  const lateralOffset = centeredSlot * spread;
  const forwardDistance = Math.min(
    HERO_FRONTLINE_VISUAL_BOUNDS.maxContactForward,
    CONTACT_FORWARD_BY_TYPE[enemyType] + (1 - Math.abs(centeredSlot)) * (major ? 0 : 4),
  );
  return createPose(frame, -forwardDistance, lateralOffset, 0, frame.angle);
}

/**
 * Samples a visual-only detour for enemies that exceed block capacity or walk
 * past a knocked-out hero.
 */
export function getHeroFrontlineBypassPose(
  frame: HeroFrontlineRouteFrame,
  enemyId: number,
  enemyType: EnemyType,
  state: HeroFrontlineBypassState,
): HeroFrontlineVisualPose {
  const progress = clampRatio(state.progress);
  const easedProgress = smoothStep(progress);
  const entryDistance = CONTACT_FORWARD_BY_TYPE[enemyType];
  const exitDistance = isMajorEnemy(enemyType) ? 50 : 34;
  const forwardOffset = clamp(
    -entryDistance + (entryDistance + exitDistance) * easedProgress,
    -HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassForward,
    HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassForward,
  );
  const side = getHeroFrontlineBypassSide(enemyId, enemyType);
  const lateralOffset = side
    * Math.min(HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassLateral, BYPASS_LATERAL_BY_TYPE[enemyType])
    * Math.sin(Math.PI * progress);
  const rotation = frame.angle + side * Math.sin(Math.PI * progress) * (isMajorEnemy(enemyType) ? 0.1 : 0.14);
  return createPose(frame, forwardOffset, lateralOffset, progress, rotation);
}

export function getHeroFrontlineBypassSide(enemyId: number, enemyType: EnemyType): -1 | 1 {
  const safeId = Math.abs(Math.trunc(finiteOrZero(enemyId))) >>> 0;
  const hash = Math.imul(safeId ^ ENEMY_TYPE_SALT[enemyType], 0x45d9f3b) >>> 0;
  return (hash & 1) === 0 ? -1 : 1;
}

function createPose(
  frame: HeroFrontlineRouteFrame,
  forwardOffset: number,
  lateralOffset: number,
  progress: number,
  rotation: number,
): HeroFrontlineVisualPose {
  return Object.freeze({
    x: frame.origin.x + frame.tangentX * forwardOffset + frame.normalX * lateralOffset,
    y: frame.origin.y + frame.tangentY * forwardOffset + frame.normalY * lateralOffset,
    rotation,
    forwardOffset,
    lateralOffset,
    progress,
  });
}

function isMajorEnemy(type: EnemyType): boolean {
  return type === "boss" || type === "titan";
}

function smoothStep(value: number): number {
  const ratio = clampRatio(value);
  return ratio * ratio * (3 - 2 * ratio);
}

function clampRatio(value: number): number {
  return clamp(finiteOrZero(value), 0, 1);
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
