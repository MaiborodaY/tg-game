import { getRecruitLevel } from './recruitment.ts';

import type { RecruitmentState } from './recruitment.ts';
import type { UnitType } from './units.ts';

export type BarracksLevel = 1 | 2 | 3;
export type BarracksUpgradeTarget = 2 | 3;
export interface BarracksState {
  level: BarracksLevel;
  upgradeStartedAt: number | null;
  upgradeReadyAt: number | null;
  firstLancerPending: boolean;
}
export type BarracksUpgradeStatus = 'locked' | 'available' | 'upgrading' | 'ready' | 'complete';
export interface BarracksUpgrade {
  level: BarracksLevel;
  targetLevel: BarracksUpgradeTarget | null;
  status: BarracksUpgradeStatus;
  recruitLevel: number;
  requiredRecruitType: UnitType;
  requiredRecruitLevel: number;
  cost: number;
  durationMs: number;
  remainingMs: number;
  speedUpCost: number;
  speedUpMaxCost: number;
  canStart: boolean;
  lancerUnlocked: boolean;
}
export interface BarracksUpgradeDefinition {
  readonly targetLevel: BarracksUpgradeTarget;
  readonly requiredRecruitType: UnitType;
  readonly requiredRecruitLevel: number;
  readonly cost: number;
  readonly durationMs: number;
  readonly speedUpMaxCost: number;
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
export const BARRACKS_MAX_LEVEL = 3;
export const BARRACKS_REQUIRED_SWORDSMAN_LEVEL = 5;
export const BARRACKS_UPGRADE_COST = 200;
export const BARRACKS_UPGRADE_DURATION_MS = 60 * 60 * 1000;
export const BARRACKS_SPEED_UP_MAX_COST = 100;
export const BARRACKS_UPGRADES: Readonly<Record<BarracksUpgradeTarget, BarracksUpgradeDefinition>> = Object.freeze({
  2: Object.freeze({ targetLevel: 2, requiredRecruitType: 'swordsman', requiredRecruitLevel: BARRACKS_REQUIRED_SWORDSMAN_LEVEL,
    cost: BARRACKS_UPGRADE_COST, durationMs: BARRACKS_UPGRADE_DURATION_MS, speedUpMaxCost: BARRACKS_SPEED_UP_MAX_COST }),
  3: Object.freeze({ targetLevel: 3, requiredRecruitType: 'lancer', requiredRecruitLevel: 5,
    cost: 2000, durationMs: 3 * 60 * 60 * 1000, speedUpMaxCost: 300 }),
});

export function getBarracksUpgradeDefinition(level: BarracksLevel): BarracksUpgradeDefinition | null {
  return level === 1 ? BARRACKS_UPGRADES[2] : level === 2 ? BARRACKS_UPGRADES[3] : null;
}

const validTime = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const validStart = (value: unknown, durationMs: number): value is number => validTime(value) && value <= Number.MAX_SAFE_INTEGER - durationMs;
function validTimer(barracks: BarracksSaveFields): barracks is BarracksSaveFields & BarracksTimer {
  const definition = barracks.level === 1 || barracks.level === 2 ? getBarracksUpgradeDefinition(barracks.level) : null;
  return definition !== null && validStart(barracks.upgradeStartedAt, definition.durationMs)
    && barracks.upgradeReadyAt === barracks.upgradeStartedAt + definition.durationMs;
}
const validGold = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function createBarracks(saved: unknown = {}, now: number = Date.now()): BarracksState {
  const source = saved as BarracksSaveFields | null | undefined;
  const level = source?.level === 2 || source?.level === 3 ? source.level : 1;
  const upgrading = source != null && validTimer(source);
  const barracks: BarracksState = {
    level,
    upgradeStartedAt: upgrading ? source.upgradeStartedAt : null,
    upgradeReadyAt: upgrading ? source.upgradeReadyAt : null,
    firstLancerPending: level >= 2 && source?.firstLancerPending === true,
  };
  // Absolute timestamps let construction finish while the app is closed or backgrounded.
  completeBarracksUpgrade(barracks, now);
  return barracks;
}

function assertBarracks(value: unknown): asserts value is BarracksState {
  const barracks = value as BarracksSaveFields | null | undefined;
  if (!barracks || (barracks.level !== 1 && barracks.level !== 2 && barracks.level !== 3)
    || typeof barracks.firstLancerPending !== 'boolean'
    || !(barracks.upgradeStartedAt === null && barracks.upgradeReadyAt === null || validTimer(barracks))
    || barracks.level === 1 && barracks.firstLancerPending) {
    throw new TypeError('Invalid barracks state');
  }
}

function finishUpgrade(barracks: BarracksState): void {
  const definition = getBarracksUpgradeDefinition(barracks.level);
  if (!definition) return;
  barracks.level = definition.targetLevel;
  barracks.upgradeStartedAt = null;
  barracks.upgradeReadyAt = null;
  // Only the first upgrade grants a Lancer; later upgrades preserve its consumption.
  if (barracks.level === 2) barracks.firstLancerPending = true;
}

export function completeBarracksUpgrade(barracks: BarracksState, now: number = Date.now()): boolean {
  assertBarracks(barracks);
  if (barracks.upgradeReadyAt === null
    || !validTime(now) || now < barracks.upgradeReadyAt) return false;
  finishUpgrade(barracks);
  return true;
}

export function getBarracksUpgrade(barracks: BarracksState, recruitment: RecruitmentState, now: number = Date.now()): BarracksUpgrade {
  assertBarracks(barracks);
  const definition = getBarracksUpgradeDefinition(barracks.level);
  const requiredRecruitType = definition?.requiredRecruitType ?? 'lancer';
  const recruitLevel = getRecruitLevel(recruitment, requiredRecruitType);
  const upgrading = barracks.upgradeReadyAt !== null;
  // The assertion guarantees a complete timer pair whenever the ready timestamp exists.
  // Clock rollback can delay construction, but cannot exceed this upgrade's full skip price.
  const remainingMs = upgrading ? Math.max(0, Math.min(definition!.durationMs,
    barracks.upgradeReadyAt! - (validTime(now) ? now : barracks.upgradeStartedAt!))) : 0;
  const lancerUnlocked = barracks.level >= 2;
  const eligible = definition !== null && recruitLevel >= definition.requiredRecruitLevel;
  const status = !definition ? 'complete' : upgrading ? remainingMs === 0 ? 'ready' : 'upgrading'
    : eligible ? 'available' : 'locked';
  return {
    level: barracks.level, targetLevel: definition?.targetLevel ?? null, status, recruitLevel, requiredRecruitType,
    requiredRecruitLevel: definition?.requiredRecruitLevel ?? 0,
    cost: definition?.cost ?? 0,
    durationMs: definition?.durationMs ?? 0,
    remainingMs,
    speedUpCost: definition ? Math.ceil(definition.speedUpMaxCost * remainingMs / definition.durationMs) : 0,
    speedUpMaxCost: definition?.speedUpMaxCost ?? 0,
    canStart: status === 'available', lancerUnlocked,
  };
}

export function startBarracksUpgrade(barracks: BarracksState, recruitment: RecruitmentState, gold: number, now: number = Date.now()): BarracksActionResult {
  assertBarracks(barracks);
  const fail = (reason: BarracksFailureReason): BarracksActionResult => ({ ok: false, gold, reason, cost: 0 });
  if (!validTime(now)) return fail('invalid-time');
  if (barracks.upgradeReadyAt !== null) {
    // A stale start tap may finish construction, but must never buy the next tier.
    completeBarracksUpgrade(barracks, now);
    return fail('upgrading');
  }
  const definition = getBarracksUpgradeDefinition(barracks.level);
  if (!definition) return fail('max-level');
  if (!validStart(now, definition.durationMs)) return fail('invalid-time');
  if (getRecruitLevel(recruitment, definition.requiredRecruitType) < definition.requiredRecruitLevel) return fail('locked');
  if (!validGold(gold) || gold < definition.cost) return fail('insufficient-gold');
  barracks.upgradeStartedAt = now;
  barracks.upgradeReadyAt = now + definition.durationMs;
  return { ok: true, gold: gold - definition.cost, reason: null, cost: definition.cost };
}

export function speedUpBarracks(barracks: BarracksState, gold: number, now: number = Date.now()): BarracksActionResult {
  assertBarracks(barracks);
  const fail = (reason: BarracksFailureReason): BarracksActionResult => ({ ok: false, gold, reason, cost: 0 });
  if (!validTime(now)) return fail('invalid-time');
  if (completeBarracksUpgrade(barracks, now)) return { ok: true, gold, reason: null, cost: 0 };
  if (barracks.level === BARRACKS_MAX_LEVEL) return fail('max-level');
  if (barracks.upgradeReadyAt === null) return fail('not-upgrading');
  const definition = getBarracksUpgradeDefinition(barracks.level)!;
  const remainingMs = Math.min(definition.durationMs, barracks.upgradeReadyAt - now);
  const cost = Math.ceil(definition.speedUpMaxCost * remainingMs / definition.durationMs);
  if (!validGold(gold) || gold < cost) return fail('insufficient-gold');
  finishUpgrade(barracks);
  return { ok: true, gold: gold - cost, reason: null, cost };
}

export function consumeFirstLancerGuarantee(barracks: BarracksState, recruitedType: UnitType): boolean {
  assertBarracks(barracks);
  if (barracks.level < 2 || !barracks.firstLancerPending || recruitedType !== 'lancer') return false;
  barracks.firstLancerPending = false;
  return true;
}
