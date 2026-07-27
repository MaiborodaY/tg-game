import type { EnemyType } from "../game/types.ts";

export type EnemyVisualProfile = Readonly<{
  shadowWidth: number;
  shadowHeight: number;
  statusRadius: number;
  healthBarWidth: number;
  healthBarY: number;
  stepPhase: number;
  bob: number;
  stride: number;
  limbSwing: number;
  idleRate: number;
  breath: number;
  float: boolean;
}>;

export type EnemyMotionPose = {
  bodyY: number;
  bodyRotation: number;
  bodyScaleX: number;
  bodyScaleY: number;
  leftFootLift: number;
  rightFootLift: number;
  limbSwing: number;
  clothSway: number;
  glowAlpha: number;
  glowScale: number;
  auraAlpha: number;
  auraScale: number;
};

export const ENEMY_VISUAL_PROFILES = Object.freeze({
  raider: profile(30, 11, 19, 32, -29, 0.32, 1.2, 2.1, 0.24, 0.0048, 0.018, false),
  swift: profile(28, 10, 18, 30, -29, 0.42, 1.4, 2.5, 0.34, 0.0058, 0.02, false),
  brute: profile(38, 14, 22, 36, -31, 0.23, 0.8, 1.5, 0.15, 0.0038, 0.014, false),
  warden: profile(32, 12, 20, 34, -31, 0.27, 1, 1.7, 0.18, 0.0042, 0.016, false),
  shade: profile(31, 11, 20, 34, -31, 0.2, 2.2, 0, 0.16, 0.0036, 0.022, true),
  bulwark: profile(40, 14, 23, 38, -32, 0.2, 0.65, 1.2, 0.12, 0.0034, 0.012, false),
  shaman: profile(33, 12, 20, 34, -32, 0.26, 0.95, 1.6, 0.18, 0.0041, 0.018, false),
  boss: profile(54, 18, 30, 58, -47, 0.17, 0.7, 1, 0.11, 0.0031, 0.02, false),
  titan: profile(58, 20, 32, 62, -49, 0.14, 0.55, 0.8, 0.09, 0.0027, 0.016, false),
} satisfies Readonly<Record<EnemyType, EnemyVisualProfile>>);

export function createEnemyMotionPose(): EnemyMotionPose {
  return {
    bodyY: 0,
    bodyRotation: 0,
    bodyScaleX: 1,
    bodyScaleY: 1,
    leftFootLift: 0,
    rightFootLift: 0,
    limbSwing: 0,
    clothSway: 0,
    glowAlpha: 1,
    glowScale: 1,
    auraAlpha: 0,
    auraScale: 1,
  };
}

export function sampleEnemyMotion(
  type: EnemyType,
  elapsedMs: number,
  progress: number,
  instanceSeed: number,
  moving: boolean,
  enraged: boolean,
  out: EnemyMotionPose,
): EnemyMotionPose {
  const visual = ENEMY_VISUAL_PROFILES[type];
  const safeTime = finiteOrZero(elapsedMs);
  const safeProgress = finiteOrZero(progress);
  const safeSeed = finiteOrZero(instanceSeed);
  const idlePhase = safeTime * visual.idleRate + safeSeed * 0.71;
  const stepPhase = safeProgress * visual.stepPhase + safeSeed * 1.13;
  const stepWave = moving ? Math.sin(stepPhase) : 0;
  const idleWave = Math.sin(idlePhase);
  const rageWave = enraged ? Math.sin(safeTime * 0.011 + safeSeed) : 0;
  const breath = idleWave * visual.breath + rageWave * 0.035;

  out.bodyY = visual.float
    ? -1.4 + idleWave * visual.bob
    : (moving ? -Math.abs(Math.sin(stepPhase)) * visual.bob : idleWave * visual.bob * 0.18);
  out.bodyRotation = stepWave * visual.limbSwing * 0.08 + idleWave * visual.limbSwing * 0.025;
  out.bodyScaleX = 1 + breath;
  out.bodyScaleY = 1 - breath * 0.62;
  out.leftFootLift = moving ? Math.max(0, stepWave) * visual.stride : 0;
  out.rightFootLift = moving ? Math.max(0, -stepWave) * visual.stride : 0;
  out.limbSwing = moving ? stepWave * visual.limbSwing : idleWave * visual.limbSwing * 0.12;
  out.clothSway = Math.sin(idlePhase * 0.74 + safeSeed * 0.37) * (visual.float ? 0.14 : 0.08);
  out.glowAlpha = 0.68 + (idleWave + 1) * 0.14;
  out.glowScale = 0.94 + (idleWave + 1) * 0.06 + (enraged ? 0.05 : 0);
  out.auraAlpha = 0.42 + (idleWave + 1) * 0.12;
  out.auraScale = 0.98 + (idleWave + 1) * 0.07 + (enraged ? 0.06 : 0);
  return out;
}

function profile(
  shadowWidth: number,
  shadowHeight: number,
  statusRadius: number,
  healthBarWidth: number,
  healthBarY: number,
  stepPhase: number,
  bob: number,
  stride: number,
  limbSwing: number,
  idleRate: number,
  breath: number,
  float: boolean,
): EnemyVisualProfile {
  return Object.freeze({
    shadowWidth,
    shadowHeight,
    statusRadius,
    healthBarWidth,
    healthBarY,
    stepPhase,
    bob,
    stride,
    limbSwing,
    idleRate,
    breath,
    float,
  });
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
