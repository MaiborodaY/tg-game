import { UNIT_TYPES, UNIT_TYPE_BY_ID } from '../../units.ts';
import type { UnitDefinition, UnitType } from '../../units.ts';
import { createRecruitment, getElfRecruitUnlock, getRecruitChances, getRecruitProgress, getUnitStats, normalizeUnitLevel, receiveRecruit } from '../../recruitment.ts';
import type { RecruitUnlock, RecruitmentState, RecruitProgress, RecruitResult, UnitStats } from '../../recruitment.ts';
import { getUnitRank } from '../../unit-ranks.ts';
import type { PaletteRank, UnitRank } from '../../unit-ranks.ts';

// Compile-only API checks; runtime validation still protects saves and JavaScript callers.
export function verifyUnitsAndRecruitmentContracts(saved: unknown): void {
  const recruitment: RecruitmentState = createRecruitment(saved);
  const progress: RecruitProgress = getRecruitProgress(recruitment, 'lancer');
  const result: RecruitResult = receiveRecruit(recruitment, () => .9);
  const rider: RecruitResult = receiveRecruit(recruitment, () => .9, { pool: 'elves', elvesUnlocked: true });
  const riderProgress: RecruitProgress = getRecruitProgress(recruitment, 'pantherRider');
  const elfProgress: RecruitProgress = getRecruitProgress(recruitment, 'elfArcher');
  const elfStats: UnitStats = getUnitStats('elfArcher', 50);
  const unlock: RecruitUnlock = getElfRecruitUnlock(recruitment, 'elfArcher', 3);
  const requirement: UnitType | null = getElfRecruitUnlock(recruitment, 'unicorn', 4).requiredRecruitType;
  getRecruitChances('elves', recruitment);
  const type: UnitType = result.type;
  const stats: UnitStats = getUnitStats(type, saved);
  const definition: UnitDefinition = UNIT_TYPE_BY_ID[type];
  const healing: number | undefined = definition.heal;
  const rank: UnitRank = getUnitRank(saved);
  const palette: PaletteRank = rank.level;
  const normalized: number = normalizeUnitLevel(saved);
  void [progress, stats, healing, palette, normalized, rider, riderProgress, elfProgress, elfStats, unlock, requirement];

  // @ts-expect-error Only playable allied recruit types belong to the catalogue.
  const unknownType: UnitType = 'goblin';
  // @ts-expect-error The keyed catalogue has no unknown unit definition.
  UNIT_TYPE_BY_ID.king;
  // @ts-expect-error Catalogue entries stay immutable for every consumer.
  definition.hp = 999;
  // @ts-expect-error The catalogue array cannot be extended at runtime.
  UNIT_TYPES.push(definition);
  // @ts-expect-error A recruit record contains every playable class, including both elves.
  const missingClass: RecruitmentState['received'] = { swordsman: 0, archer: 0, healer: 0 };
  // @ts-expect-error Runtime state counts are numbers even though save input is unknown.
  recruitment.received.lancer = '5';
  // @ts-expect-error Normalized recruitment state always has version two.
  recruitment.version = 1;
  // @ts-expect-error Progress is addressed by an allied unit type.
  getRecruitProgress(recruitment, 'castle');
  // @ts-expect-error Stats cannot be requested for an unknown unit type.
  getUnitStats('unknown');
  // @ts-expect-error Random providers must return a number.
  receiveRecruit(recruitment, () => '0.5');
  // @ts-expect-error Callers cannot bypass the total through the removed building flag.
  receiveRecruit(recruitment, Math.random, { lancerUnlocked: true });
  // @ts-expect-error Elven unlock is an exact boolean, not a saved building level.
  receiveRecruit(recruitment, Math.random, { pool: 'elves', elvesUnlocked: 3 });
  // @ts-expect-error Only supported recruitment pools have chance tables.
  getRecruitChances('dwarves');
  // @ts-expect-error Unlock requirements use elf recruit identifiers, not arbitrary allies.
  getElfRecruitUnlock(recruitment, 'archer', 3);
  // @ts-expect-error Chance calculation takes normalized training, not an unlock boolean.
  getRecruitChances('elves', true);
  // @ts-expect-error Chance tables are shared immutable definitions.
  getRecruitChances()[0]!.chance = 1;
  // @ts-expect-error Healing is optional on catalogue definitions.
  const requiredHealing: number = definition.heal;
  // @ts-expect-error There are exactly five palette keys.
  const unknownPalette: PaletteRank = 6;
  // @ts-expect-error Rank records are immutable shared values.
  rank.level = 2;
  void [unknownType, missingClass, requiredHealing, unknownPalette];
}
