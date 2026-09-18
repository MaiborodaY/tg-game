import { getRecruitLevel } from './recruitment.mjs';

export const STARTING_SLAVES = 3;
export const SELL_PRICE = 1;
export const BARRACKS_MAX_LEVEL = 2;
export const BARRACKS_REQUIRED_SWORDSMAN_LEVEL = 5;
export const BARRACKS_UPGRADE_COST = 200;
export const BARRACKS_UPGRADE_DURATION_MS = 60 * 60 * 1000;
export const BARRACKS_SPEED_UP_MAX_COST = 100;

const validTime = value => Number.isSafeInteger(value) && value > 0;
const validStart = value => validTime(value) && value <= Number.MAX_SAFE_INTEGER - BARRACKS_UPGRADE_DURATION_MS;
const validTimer = barracks => validStart(barracks.upgradeStartedAt)
  && barracks.upgradeReadyAt === barracks.upgradeStartedAt + BARRACKS_UPGRADE_DURATION_MS;
const validGold = value => Number.isFinite(value) && value >= 0;

export function createBarracks(saved = {}, now = Date.now()) {
  const level = saved?.level === BARRACKS_MAX_LEVEL ? BARRACKS_MAX_LEVEL : 1;
  const upgrading = level === 1 && saved != null && validTimer(saved);
  const barracks = {
    level,
    upgradeStartedAt: upgrading ? saved.upgradeStartedAt : null,
    upgradeReadyAt: upgrading ? saved.upgradeReadyAt : null,
    firstLancerPending: level === BARRACKS_MAX_LEVEL && saved?.firstLancerPending === true,
  };
  // Absolute timestamps let construction finish while the app is closed or backgrounded.
  completeBarracksUpgrade(barracks, now);
  return barracks;
}

function assertBarracks(barracks) {
  if (!barracks || ![1, BARRACKS_MAX_LEVEL].includes(barracks.level)
    || typeof barracks.firstLancerPending !== 'boolean'
    || !(barracks.upgradeStartedAt === null && barracks.upgradeReadyAt === null || barracks.level === 1 && validTimer(barracks))
    || barracks.level === 1 && barracks.firstLancerPending) {
    throw new TypeError('Invalid barracks state');
  }
}

function finishUpgrade(barracks) {
  barracks.level = BARRACKS_MAX_LEVEL;
  barracks.upgradeStartedAt = null;
  barracks.upgradeReadyAt = null;
  barracks.firstLancerPending = true;
}

export function completeBarracksUpgrade(barracks, now = Date.now()) {
  assertBarracks(barracks);
  if (barracks.level !== 1 || barracks.upgradeReadyAt === null
    || !validTime(now) || now < barracks.upgradeReadyAt) return false;
  finishUpgrade(barracks);
  return true;
}

export function getBarracksUpgrade(barracks, recruitment, now = Date.now()) {
  assertBarracks(barracks);
  const recruitLevel = getRecruitLevel(recruitment, 'swordsman');
  const upgrading = barracks.upgradeReadyAt !== null;
  // A rolled-back clock may delay completion, but can never raise the skip price above 100.
  const remainingMs = upgrading ? Math.max(0, Math.min(BARRACKS_UPGRADE_DURATION_MS,
    barracks.upgradeReadyAt - (validTime(now) ? now : barracks.upgradeStartedAt))) : 0;
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

export function startBarracksUpgrade(barracks, recruitment, gold, now = Date.now()) {
  assertBarracks(barracks);
  const fail = reason => ({ ok: false, gold, reason, cost: 0 });
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

export function speedUpBarracks(barracks, gold, now = Date.now()) {
  assertBarracks(barracks);
  const fail = reason => ({ ok: false, gold, reason, cost: 0 });
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

export function consumeFirstLancerGuarantee(barracks, recruitedType) {
  assertBarracks(barracks);
  if (barracks.level !== BARRACKS_MAX_LEVEL || !barracks.firstLancerPending || recruitedType !== 'lancer') return false;
  barracks.firstLancerPending = false;
  return true;
}
