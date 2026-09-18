import { UNIT_TYPES, UNIT_TYPE_BY_ID } from './units.ts';
import type { UnitType } from './units.ts';
import type { ElfRecruitId, RecruitmentPool } from './recruitment-pools.ts';

export interface RecruitmentState {
  version: 2;
  received: Record<UnitType, number>;
  legacyTrainingCredit: Record<UnitType, number>;
  lastType: UnitType | null;
}

export interface RecruitChance {
  readonly type: UnitType;
  readonly chance: number;
}

export interface RecruitProgress {
  type: UnitType;
  level: number;
  received: number;
  progress: number;
  needed: number;
}

export interface RecruitResult extends RecruitProgress {
  leveledUp: boolean;
}

export interface RecruitOptions {
  lancerUnlocked?: boolean;
  guaranteedLancer?: boolean;
  pool?: RecruitmentPool;
  elvesUnlocked?: boolean;
  barracksLevel?: number;
}

export interface ElfRecruitUnlock {
  requirementsMet: boolean;
  available: boolean;
  requiredRecruitType: UnitType | null;
  requiredRecruitLevel: number | null;
  requiredBarracksLevel: number;
}

export interface UnitStats {
  level: number;
  hp: number;
  damage: number;
  heal: number;
}

// These are readable save fields, not a claim that parsed JSON is a valid state.
interface RecruitmentSaveFields {
  version?: unknown;
  received?: Partial<Record<UnitType, unknown>> | null;
  legacyTrainingCredit?: Partial<Record<UnitType, unknown>> | null;
  lastType?: unknown;
}

export const RECRUIT_COST = 1;
// Training governs newly received fighters; Connect can raise personal levels beyond it.
export const RECRUIT_LEVEL_CAP = 100;
export const RECRUIT_LEVEL_STEP = 5;
export const UNIT_LEVEL_STAT_BONUS = .05;
const LEGACY_RECRUITS_PER_LEVEL = 3;
export const RECRUIT_CHANCES: readonly RecruitChance[] = Object.freeze([
  Object.freeze({ type: 'swordsman', chance: .6 }),
  Object.freeze({ type: 'archer', chance: .25 }),
  Object.freeze({ type: 'healer', chance: .15 }),
]);
const UNLOCKED_RECRUIT_CHANCES: readonly RecruitChance[] = Object.freeze([
  Object.freeze({ type: 'swordsman', chance: .25 }),
  Object.freeze({ type: 'archer', chance: .25 }),
  Object.freeze({ type: 'healer', chance: .25 }),
  Object.freeze({ type: 'lancer', chance: .25 }),
]);
const STARTER_ELF_RECRUIT_CHANCES: readonly RecruitChance[] = Object.freeze([
  Object.freeze({ type: 'pantherRider', chance: 1 }),
]);
const ELF_UNLOCK_REQUIREMENTS = Object.freeze({
  pantherRider: { requiredRecruitType: null, requiredRecruitLevel: null, requiredBarracksLevel: 3, implemented: true },
  elfArcher: { requiredRecruitType: 'pantherRider', requiredRecruitLevel: 3, requiredBarracksLevel: 3, implemented: true },
  elfHealer: { requiredRecruitType: 'elfArcher', requiredRecruitLevel: 3, requiredBarracksLevel: 3, implemented: true },
  unicorn: { requiredRecruitType: 'pantherRider', requiredRecruitLevel: 5, requiredBarracksLevel: 4, implemented: true },
} satisfies Record<ElfRecruitId, {
  requiredRecruitType: UnitType | null;
  requiredRecruitLevel: number | null;
  requiredBarracksLevel: number;
  implemented: boolean;
}>);

export function getRecruitChances(lancerUnlocked: boolean = false, pool: RecruitmentPool = 'humans',
  recruitment?: RecruitmentState, barracksLevel: number = 3): readonly RecruitChance[] {
  if (pool === 'elves') {
    if (barracksLevel !== 3 && barracksLevel !== 4) throw new RangeError('Elven recruitment requires Barracks III');
    if (!recruitment) return STARTER_ELF_RECRUIT_CHANCES;
    const unlocked = (['pantherRider', 'elfArcher', 'elfHealer', 'unicorn'] as const)
      .filter(type => getElfRecruitUnlock(recruitment, type, barracksLevel).available);
    return Object.freeze(unlocked.map(type => Object.freeze({ type, chance: 1 / unlocked.length })));
  }
  if (pool !== 'humans') throw new RangeError('Unknown recruitment pool');
  return lancerUnlocked ? UNLOCKED_RECRUIT_CHANCES : RECRUIT_CHANCES;
}

const isUnitType = (type: unknown): type is UnitType => typeof type === 'string'
  && Object.hasOwn(UNIT_TYPE_BY_ID, type);
const isReceivedCount = (count: unknown): count is number => typeof count === 'number'
  && Number.isSafeInteger(count) && count >= 0;

export function createRecruitment(saved?: unknown): RecruitmentState {
  const source = saved as RecruitmentSaveFields | null | undefined;
  // Progress records cover all playable units; pool odds must not determine saved fields.
  const received = Object.fromEntries(UNIT_TYPES.map(({ id: type }) => [
    type, isReceivedCount(source?.received?.[type]) ? source.received[type] : 0,
  ])) as Record<UnitType, number>;
  return {
    version: 2,
    received,
    // One-time training credit preserves earned recruitment levels without inventing received fighters.
    legacyTrainingCredit: Object.fromEntries(UNIT_TYPES.map(({ id: type }) => [
      type, source?.version === 1 && RECRUIT_CHANCES.some(entry => entry.type === type) ? migrateLegacyTraining(received[type])
        : source?.version === 2 && isReceivedCount(source?.legacyTrainingCredit?.[type])
          ? source.legacyTrainingCredit[type] : 0,
    ])) as Record<UnitType, number>,
    lastType: isUnitType(source?.lastType) ? source.lastType : null,
  };
}

function recruitsAtLevel(level: number): number {
  return RECRUIT_LEVEL_STEP * level * (level - 1) / 2;
}

function migrateLegacyTraining(received: number): number {
  const level = Math.min(RECRUIT_LEVEL_CAP, 1 + Math.floor(received / LEGACY_RECRUITS_PER_LEVEL));
  const progress = level === RECRUIT_LEVEL_CAP ? 0
    : Math.floor(received % LEGACY_RECRUITS_PER_LEVEL * RECRUIT_LEVEL_STEP * level / LEGACY_RECRUITS_PER_LEVEL);
  return Math.max(0, recruitsAtLevel(level) + progress - received);
}

export function normalizeUnitLevel(value: unknown = 1): number {
  const level = typeof value === 'number' || typeof value === 'string' ? Number(value) : 1;
  return Number.isFinite(level) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(level))) : 1;
}

function assertRecruitment(recruitment: unknown): asserts recruitment is RecruitmentState {
  const state = recruitment as RecruitmentSaveFields | null | undefined;
  if (!state || state.version !== 2 || !state.received || !state.legacyTrainingCredit
    || !UNIT_TYPES.every(({ id: type }) => isReceivedCount(state.received![type])
      && isReceivedCount(state.legacyTrainingCredit![type]))
    || (state.lastType !== null && !isUnitType(state.lastType))) {
    throw new TypeError('Invalid recruitment state');
  }
}

export function getRecruitProgress(recruitment: RecruitmentState, type: UnitType): RecruitProgress {
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

export function getRecruitLevel(recruitment: RecruitmentState, type: UnitType): number {
  return getRecruitProgress(recruitment, type).level;
}

export function getElfRecruitUnlock(recruitment: RecruitmentState, id: ElfRecruitId, barracksLevel: number): ElfRecruitUnlock {
  assertRecruitment(recruitment);
  if (!Object.hasOwn(ELF_UNLOCK_REQUIREMENTS, id)) throw new RangeError('Unknown elf recruit');
  const { requiredRecruitType, requiredRecruitLevel, requiredBarracksLevel, implemented } = ELF_UNLOCK_REQUIREMENTS[id];
  // Only receipt-based training counts. Owned fighters and Connect levels never enter this gate.
  const requirementsMet = (barracksLevel === 3 || barracksLevel === 4) && barracksLevel >= requiredBarracksLevel
    && (requiredRecruitType === null || getRecruitLevel(recruitment, requiredRecruitType) >= requiredRecruitLevel!);
  return { requirementsMet, available: requirementsMet && implemented,
    requiredRecruitType, requiredRecruitLevel, requiredBarracksLevel };
}

export function getUnitStats(type: UnitType, value: unknown = 1): UnitStats {
  if (!isUnitType(type)) throw new RangeError('Unknown unit type');
  const definition = UNIT_TYPE_BY_ID[type];
  const level = normalizeUnitLevel(value);
  // Add a share of level-one stats, never compound the previous level's rounded value.
  const multiplier = 1 + (level - 1) * UNIT_LEVEL_STAT_BONUS;
  // Only the numeric representation saturates; ordinary levels retain the same growth curve.
  const scaled = (base: number): number => Math.min(Number.MAX_SAFE_INTEGER, Math.round(base * multiplier));
  return {
    level,
    hp: scaled(definition.hp),
    damage: scaled(definition.damage),
    heal: scaled(definition.heal ?? 0),
  };
}

export function receiveRecruit(recruitment: RecruitmentState, random: () => number = Math.random,
  options: RecruitOptions | null = {}): RecruitResult {
  assertRecruitment(recruitment);
  if (typeof random !== 'function') throw new TypeError('Recruit random must be a function');
  const pool = options?.pool ?? 'humans';
  if (pool !== 'humans' && pool !== 'elves') throw new RangeError('Unknown recruitment pool');
  if (pool === 'elves' && options?.elvesUnlocked !== true) throw new RangeError('Elven recruitment requires Barracks III');
  const lancerUnlocked = options?.lancerUnlocked === true;
  let type: UnitType | null = pool === 'humans' && lancerUnlocked && options?.guaranteedLancer === true ? 'lancer' : null;
  if (!type) {
    const roll = random();
    if (typeof roll !== 'number' || !Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new RangeError('Recruit random must return a number from zero up to one');
    }
    const chances = getRecruitChances(lancerUnlocked, pool, recruitment, options?.barracksLevel ?? 3);
    let threshold = 0;
    // Each pool totals one, so every validated roll selects an entry.
    type = chances.find(entry => {
      threshold += entry.chance;
      return roll < threshold;
    })!.type;
  }
  const previousLevel = getRecruitLevel(recruitment, type);
  // Keep totals usable after very long saves without exceeding integer precision.
  recruitment.received[type] = Math.min(Number.MAX_SAFE_INTEGER, recruitment.received[type] + 1);
  recruitment.lastType = type;
  const progress = getRecruitProgress(recruitment, type);
  return { ...progress, leveledUp: progress.level > previousLevel };
}
