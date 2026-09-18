import { UNIT_TYPES, UNIT_TYPE_BY_ID } from '../../units.ts';
import type { UnitDefinition, UnitType } from '../../units.ts';
import { createRecruitment, getRecruitChances, getRecruitProgress, getUnitStats, normalizeUnitLevel, receiveRecruit } from '../../recruitment.ts';
import type { RecruitmentState, RecruitProgress, RecruitResult, UnitStats } from '../../recruitment.ts';
import { getUnitRank } from '../../unit-ranks.ts';
import type { PaletteRank, UnitRank } from '../../unit-ranks.ts';

// Compile-only API checks; runtime validation still protects saves and JavaScript callers.
export function verifyUnitsAndRecruitmentContracts(saved: unknown): void {
  const recruitment: RecruitmentState = createRecruitment(saved);
  const progress: RecruitProgress = getRecruitProgress(recruitment, 'lancer');
  const result: RecruitResult = receiveRecruit(recruitment, () => .9, { lancerUnlocked: true });
  const type: UnitType = result.type;
  const stats: UnitStats = getUnitStats(type, saved);
  const definition: UnitDefinition = UNIT_TYPE_BY_ID[type];
  const healing: number | undefined = definition.heal;
  const rank: UnitRank = getUnitRank(saved);
  const palette: PaletteRank = rank.level;
  const normalized: number = normalizeUnitLevel(saved);
  void [progress, stats, healing, palette, normalized];

  // @ts-expect-error Only the four allied recruit types belong to the catalogue.
  const unknownType: UnitType = 'goblin';
  // @ts-expect-error The keyed catalogue has no unknown unit definition.
  UNIT_TYPE_BY_ID.king;
  // @ts-expect-error Catalogue entries stay immutable for every consumer.
  definition.hp = 999;
  // @ts-expect-error The catalogue array cannot be extended at runtime.
  UNIT_TYPES.push(definition);
  // @ts-expect-error A recruit record contains all four classes, including lancer.
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
  // @ts-expect-error Unlock settings are boolean, not saved text.
  receiveRecruit(recruitment, Math.random, { lancerUnlocked: 'true' });
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
