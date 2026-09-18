import { UNIT_TYPE_BY_ID } from './units.mjs';

export const RECRUIT_COST = 1;
export const RECRUIT_LEVEL_CAP = 100;
export const RECRUIT_LEVEL_STEP = 5;
export const UNIT_LEVEL_STAT_BONUS = .05;
const LEGACY_RECRUITS_PER_LEVEL = 3;
export const RECRUIT_CHANCES = Object.freeze([
  Object.freeze({ type: 'swordsman', chance: .6 }),
  Object.freeze({ type: 'archer', chance: .25 }),
  Object.freeze({ type: 'healer', chance: .15 }),
]);
const UNLOCKED_RECRUIT_CHANCES = Object.freeze([
  Object.freeze({ type: 'swordsman', chance: .25 }),
  Object.freeze({ type: 'archer', chance: .25 }),
  Object.freeze({ type: 'healer', chance: .25 }),
  Object.freeze({ type: 'lancer', chance: .25 }),
]);

export const getRecruitChances = (lancerUnlocked = false) => lancerUnlocked
  ? UNLOCKED_RECRUIT_CHANCES : RECRUIT_CHANCES;

const isUnitType = type => typeof type === 'string'
  && Object.hasOwn(UNIT_TYPE_BY_ID, type);
const isReceivedCount = count => Number.isSafeInteger(count) && count >= 0;

export function createRecruitment(saved) {
  const received = Object.fromEntries(UNLOCKED_RECRUIT_CHANCES.map(({ type }) => [
    type, isReceivedCount(saved?.received?.[type]) ? saved.received[type] : 0,
  ]));
  return {
    version: 2,
    received,
    // One-time training credit preserves earned recruitment levels without inventing received fighters.
    legacyTrainingCredit: Object.fromEntries(UNLOCKED_RECRUIT_CHANCES.map(({ type }) => [
      type, saved?.version === 1 && type !== 'lancer' ? migrateLegacyTraining(received[type])
        : saved?.version === 2 && isReceivedCount(saved?.legacyTrainingCredit?.[type])
          ? saved.legacyTrainingCredit[type] : 0,
    ])),
    lastType: isUnitType(saved?.lastType) ? saved.lastType : null,
  };
}

function recruitsAtLevel(level) {
  return RECRUIT_LEVEL_STEP * level * (level - 1) / 2;
}

function migrateLegacyTraining(received) {
  const level = Math.min(RECRUIT_LEVEL_CAP, 1 + Math.floor(received / LEGACY_RECRUITS_PER_LEVEL));
  const progress = level === RECRUIT_LEVEL_CAP ? 0
    : Math.floor(received % LEGACY_RECRUITS_PER_LEVEL * RECRUIT_LEVEL_STEP * level / LEGACY_RECRUITS_PER_LEVEL);
  return Math.max(0, recruitsAtLevel(level) + progress - received);
}

export function normalizeUnitLevel(value = 1) {
  const level = typeof value === 'number' || typeof value === 'string' ? Number(value) : 1;
  return Number.isFinite(level) ? Math.max(1, Math.min(RECRUIT_LEVEL_CAP, Math.floor(level))) : 1;
}

function assertRecruitment(recruitment) {
  if (!recruitment || recruitment.version !== 2 || !recruitment.received || !recruitment.legacyTrainingCredit
    || !UNLOCKED_RECRUIT_CHANCES.every(({ type }) => isReceivedCount(recruitment.received[type])
      && isReceivedCount(recruitment.legacyTrainingCredit[type]))
    || (recruitment.lastType !== null && !isUnitType(recruitment.lastType))) {
    throw new TypeError('Invalid recruitment state');
  }
}

export function getRecruitProgress(recruitment, type) {
  assertRecruitment(recruitment);
  if (!isUnitType(type)) throw new RangeError('Unknown recruit type');
  const received = recruitment.received[type];
  const training = Math.min(Number.MAX_SAFE_INTEGER, received + recruitment.legacyTrainingCredit[type]);
  let level = 1;
  while (level < RECRUIT_LEVEL_CAP && training >= recruitsAtLevel(level + 1)) level += 1;
  return {
    type, level, received,
    progress: level === RECRUIT_LEVEL_CAP ? 0 : training - recruitsAtLevel(level),
    needed: RECRUIT_LEVEL_STEP * level,
  };
}

export function getRecruitLevel(recruitment, type) {
  return getRecruitProgress(recruitment, type).level;
}

export function getUnitStats(type, value = 1) {
  if (!isUnitType(type)) throw new RangeError('Unknown unit type');
  const definition = UNIT_TYPE_BY_ID[type];
  const level = normalizeUnitLevel(value);
  // Add a share of level-one stats, never compound the previous level's rounded value.
  const multiplier = 1 + (level - 1) * UNIT_LEVEL_STAT_BONUS;
  return {
    level,
    hp: Math.round(definition.hp * multiplier),
    damage: Math.round(definition.damage * multiplier),
    heal: Math.round((definition.heal ?? 0) * multiplier),
  };
}

export function receiveRecruit(recruitment, random = Math.random, options = {}) {
  assertRecruitment(recruitment);
  if (typeof random !== 'function') throw new TypeError('Recruit random must be a function');
  const lancerUnlocked = options?.lancerUnlocked === true;
  let type = lancerUnlocked && options?.guaranteedLancer === true ? 'lancer' : null;
  if (!type) {
    const roll = random();
    if (typeof roll !== 'number' || !Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new RangeError('Recruit random must return a number from zero up to one');
    }
    const chances = getRecruitChances(lancerUnlocked);
    let threshold = 0;
    type = chances.find(entry => {
      threshold += entry.chance;
      return roll < threshold;
    }).type;
  }
  const previousLevel = getRecruitLevel(recruitment, type);
  // Keep totals usable after very long saves without exceeding integer precision.
  recruitment.received[type] = Math.min(Number.MAX_SAFE_INTEGER, recruitment.received[type] + 1);
  recruitment.lastType = type;
  const progress = getRecruitProgress(recruitment, type);
  return { ...progress, leveledUp: progress.level > previousLevel };
}
