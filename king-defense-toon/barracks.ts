import { getRecruitLevel } from './recruitment.ts';

import type { RecruitmentState } from './recruitment.ts';
import type { UnitType } from './units.ts';

export type BarracksLevel = 1 | 2;
export interface BarracksState {
  level: BarracksLevel;
  upgradeStartedAt: number | null;
  upgradeReadyAt: number | null;
  firstLancerPending: boolean;
}
export type BarracksUpgradeStatus = 'locked' | 'available' | 'upgrading' | 'ready' | 'complete';
export interface BarracksUpgrade {
  level: BarracksLevel;
  status: BarracksUpgradeStatus;
  recruitLevel: number;
  requiredRecruitLevel: number;
  cost: number;
  durationMs: number;
  remainingMs: number;
  speedUpCost: number;
  canStart: boolean;
  lancerUnlocked: boolean;
}
export type BarracksFailureReason = 'invalid-time' | 'max-level' | 'upgrading' | 'locked' | 'insufficient-gold' | 'not-upgrading';
export type BarracksActionResult =
  | { ok: true; gold: number; reason: null; cost: number }
  | { ok: false; gold: number; reason: BarracksFailureReason; cost: 0 };

// These fields are still untrusted: only the guards below establish valid values.
interface BarracksSaveFields {
  level?: unknown;
  upgradeStartedAt?: unknown;
  upgradeReadyAt?: unknown;
  firstLancerPending?: unknown;
}
interface BarracksTimer {
  upgradeStartedAt: number;
  upgradeReadyAt: number;
}

export const STARTING_SLAVES = 3;
export const SELL_PRICE = 1;
export const BARRACKS_MAX_LEVEL = 2;
export const BARRACKS_REQUIRED_SWORDSMAN_LEVEL = 5;
export const BARRACKS_UPGRADE_COST = 200;
export const BARRACKS_UPGRADE_DURATION_MS = 60 * 60 * 1000;
export const BARRACKS_SPEED_UP_MAX_COST = 100;

const validTime = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const validStart = (value: unknown): value is number => validTime(value) && value <= Number.MAX_SAFE_INTEGER - BARRACKS_UPGRADE_DURATION_MS;
const validTimer = (barracks: BarracksSaveFields): barracks is BarracksSaveFields & BarracksTimer => validStart(barracks.upgradeStartedAt)
  && barracks.upgradeReadyAt === barracks.upgradeStartedAt + BARRACKS_UPGRADE_DURATION_MS;
const validGold = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function createBarracks(saved: unknown = {}, now: number = Date.now()): BarracksState {
  const source = saved as BarracksSaveFields | null | undefined;
  const level = source?.level === BARRACKS_MAX_LEVEL ? BARRACKS_MAX_LEVEL : 1;
  const upgrading = level === 1 && source != null && validTimer(source);
  const barracks: BarracksState = {
    level,
    upgradeStartedAt: upgrading ? source.upgradeStartedAt : null,
    upgradeReadyAt: upgrading ? source.upgradeReadyAt : null,
    firstLancerPending: level === BARRACKS_MAX_LEVEL && source?.firstLancerPending === true,
  };
  // Absolute timestamps let construction finish while the app is closed or backgrounded.
  completeBarracksUpgrade(barracks, now);
  return barracks;
}

function assertBarracks(value: unknown): asserts value is BarracksState {
  const barracks = value as BarracksSaveFields | null | undefined;
  if (!barracks || (barracks.level !== 1 && barracks.level !== BARRACKS_MAX_LEVEL)
    || typeof barracks.firstLancerPending !== 'boolean'
    || !(barracks.upgradeStartedAt === null && barracks.upgradeReadyAt === null || barracks.level === 1 && validTimer(barracks))
    || barracks.level === 1 && barracks.firstLancerPending) {
    throw new TypeError('Invalid barracks state');
  }
}

function finishUpgrade(barracks: BarracksState): void {
  barracks.level = BARRACKS_MAX_LEVEL;
  barracks.upgradeStartedAt = null;
  barracks.upgradeReadyAt = null;
  barracks.firstLancerPending = true;
}

export function completeBarracksUpgrade(barracks: BarracksState, now: number = Date.now()): boolean {
  assertBarracks(barracks);
  if (barracks.level !== 1 || barracks.upgradeReadyAt === null
    || !validTime(now) || now < barracks.upgradeReadyAt) return false;
  finishUpgrade(barracks);
  return true;
}

export function getBarracksUpgrade(barracks: BarracksState, recruitment: RecruitmentState, now: number = Date.now()): BarracksUpgrade {
  assertBarracks(barracks);
  const recruitLevel = getRecruitLevel(recruitment, 'swordsman');
  const upgrading = barracks.upgradeReadyAt !== null;
  // The assertion guarantees a complete timer pair whenever the ready timestamp exists.
  // A rolled-back clock may delay completion, but can never raise the skip price above 100.
  const remainingMs = upgrading ? Math.max(0, Math.min(BARRACKS_UPGRADE_DURATION_MS,
    barracks.upgradeReadyAt! - (validTime(now) ? now : barracks.upgradeStartedAt!))) : 0;
  const lancerUnlocked = barracks.level === BARRACKS_MAX_LEVEL;
  const eligible = recruitLevel >= BARRACKS_REQUIRED_SWORDSMAN_LEVEL;
  const status = lancerUnlocked ? 'complete' : upgrading ? remainingMs === 0 ? 'ready' : 'upgrading'
    : eligible ? 'available' : 'locked';
  return {
    level: barracks.level, status, recruitLevel,
    requiredRecruitLevel: BARRACKS_REQUIRED_SWORDSMAN_LEVEL,
    cost: BARRACKS_UPGRADE_COST,
    durationMs: BARRACKS_UPGRADE_DURATION_MS,
    remainingMs,
    speedUpCost: Math.ceil(BARRACKS_SPEED_UP_MAX_COST * remainingMs / BARRACKS_UPGRADE_DURATION_MS),
    canStart: status === 'available', lancerUnlocked,
  };
}

export function startBarracksUpgrade(barracks: BarracksState, recruitment: RecruitmentState, gold: number, now: number = Date.now()): BarracksActionResult {
  assertBarracks(barracks);
  const fail = (reason: BarracksFailureReason): BarracksActionResult => ({ ok: false, gold, reason, cost: 0 });
  if (!validStart(now)) return fail('invalid-time');
  completeBarracksUpgrade(barracks, now);
  if (barracks.level === BARRACKS_MAX_LEVEL) return fail('max-level');
  if (barracks.upgradeReadyAt !== null) return fail('upgrading');
  if (getRecruitLevel(recruitment, 'swordsman') < BARRACKS_REQUIRED_SWORDSMAN_LEVEL) return fail('locked');
  if (!validGold(gold) || gold < BARRACKS_UPGRADE_COST) return fail('insufficient-gold');
  barracks.upgradeStartedAt = now;
  barracks.upgradeReadyAt = now + BARRACKS_UPGRADE_DURATION_MS;
  return { ok: true, gold: gold - BARRACKS_UPGRADE_COST, reason: null, cost: BARRACKS_UPGRADE_COST };
}

export function speedUpBarracks(barracks: BarracksState, gold: number, now: number = Date.now()): BarracksActionResult {
  assertBarracks(barracks);
  const fail = (reason: BarracksFailureReason): BarracksActionResult => ({ ok: false, gold, reason, cost: 0 });
  if (!validTime(now)) return fail('invalid-time');
  if (completeBarracksUpgrade(barracks, now)) return { ok: true, gold, reason: null, cost: 0 };
  if (barracks.level === BARRACKS_MAX_LEVEL) return fail('max-level');
  if (barracks.upgradeReadyAt === null) return fail('not-upgrading');
  const remainingMs = Math.min(BARRACKS_UPGRADE_DURATION_MS, barracks.upgradeReadyAt - now);
  const cost = Math.ceil(BARRACKS_SPEED_UP_MAX_COST * remainingMs / BARRACKS_UPGRADE_DURATION_MS);
  if (!validGold(gold) || gold < cost) return fail('insufficient-gold');
  finishUpgrade(barracks);
  return { ok: true, gold: gold - cost, reason: null, cost };
}

export function consumeFirstLancerGuarantee(barracks: BarracksState, recruitedType: UnitType): boolean {
  assertBarracks(barracks);
  if (barracks.level !== BARRACKS_MAX_LEVEL || !barracks.firstLancerPending || recruitedType !== 'lancer') return false;
  barracks.firstLancerPending = false;
  return true;
}
