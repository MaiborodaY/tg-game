export type BranchId = 'light' | 'protection' | 'judgement';
export type TalentId = 'heal_power' | 'heal_shield' | 'second_target' | 'miracle'
  | 'aura_power' | 'aura_radius' | 'emergency_guard' | 'bastion'
  | 'hammer_power' | 'hammer_haste' | 'hammer_splash' | 'heavenly_hammer';
export type HeroTalents = Record<TalentId, number>;

export interface HeroState {
  xp: number;
  highestWave: number;
  talents: HeroTalents;
}

export interface HeroBranchDefinition {
  readonly id: BranchId;
  readonly name: string;
  readonly icon: string;
}

export interface HeroTalentDefinition {
  readonly id: TalentId;
  readonly branch: BranchId;
  readonly name: string;
  readonly short: string;
  readonly icon: string;
  readonly maxRank: 1 | 3;
  readonly level: 2 | 5 | 10 | 20;
  readonly description: string;
  readonly prerequisite?: TalentId;
  readonly capstone?: boolean;
}

export interface HeroProgress {
  level: number;
  xp: number;
  currentXp: number;
  neededXp: number;
  ratio: number;
  earnedPoints: number;
  spentPoints: number;
  availablePoints: number;
  maxLevel: boolean;
}

export interface HeroStats {
  level: number;
  maxHp: number;
  damage: number;
  attackInterval: number;
  healAmount: number;
  healCooldown: number;
  healRange: number;
  healShield: number;
  healShieldDuration: number;
  secondaryHealFraction: number;
  auraReduction: number;
  auraRadius: number;
  emergencyGuardReduction: number;
  emergencyGuardThreshold: number;
  hammerDamage: number;
  hammerCooldown: number;
  hammerRange: number;
  hammerSplashFraction: number;
  hammerSplashRadius: number;
  miracle: boolean;
  miracleHealFraction: number;
  miracleRadius: number;
  miracleThreshold: number;
  bastion: boolean;
  bastionReduction: number;
  bastionDuration: number;
  bastionInterval: number;
  heavenlyHammer: boolean;
  hammerStunDuration: number;
}

export interface HeroOutcome {
  waveNumber: number;
  kills: number;
  total: number;
  won: boolean;
}

export interface HeroXpResult {
  gained: number;
  level: number;
  previousLevel: number;
  leveledUp: boolean;
}

export type TalentBlockReason = 'unknown' | 'maxed' | 'level' | 'prerequisite' | 'capstone' | 'branch' | 'points';
export type HeroTalentStatus =
  | { available: false; reason: 'unknown'; rank: 0 }
  | { available: boolean; reason: Exclude<TalentBlockReason, 'unknown'> | ''; rank: number; branchPoints: number };
export type SpendHeroTalentResult =
  | { spent: false; reason: TalentBlockReason | 'invalid'; rank: number }
  | { spent: true; reason: ''; rank: number };
export interface ResetHeroTalentsResult {
  reset: boolean;
  refunded: number;
}

export const HERO_MAX_LEVEL = 20;
export const HERO_NAME = 'St. Knihor';
export const HERO_BRANCHES: readonly HeroBranchDefinition[] = Object.freeze([
  Object.freeze({ id: 'light', name: 'Light', icon: 'light' }),
  Object.freeze({ id: 'protection', name: 'Protection', icon: 'shield' }),
  Object.freeze({ id: 'judgement', name: 'Judgement', icon: 'hammer' }),
]);

export const HERO_TALENTS: readonly HeroTalentDefinition[] = Object.freeze(([
  { id: 'heal_power', branch: 'light', name: 'Healing Light', short: 'Healing', icon: 'light', maxRank: 3, level: 2,
    description: 'Healing restores 30% more HP per rank.' },
  { id: 'heal_shield', branch: 'light', name: 'Overflowing Light', short: 'Shield', icon: 'ward', maxRank: 3, level: 5, prerequisite: 'heal_power',
    description: 'Excess healing grants a shield for 6s, capped at 2 / 4 / 6 HP, scaled with hero level.' },
  { id: 'second_target', branch: 'light', name: 'Shared Light', short: 'Shared', icon: 'shared', maxRank: 3, level: 10, prerequisite: 'heal_shield',
    description: 'Also heals a second wounded ally for 25% / 50% / 75% of the main heal.' },
  { id: 'miracle', branch: 'light', name: 'Miracle', short: 'Miracle', icon: 'miracle', maxRank: 1, level: 20, capstone: true,
    description: 'Once per wave, an ally below 30% HP triggers a heal for nearby allies: 15% of each target’s maximum HP within 110 range.' },
  { id: 'aura_power', branch: 'protection', name: 'Protective Aura', short: 'Armour', icon: 'shield', maxRank: 3, level: 2,
    description: 'The aura reduces incoming damage by an additional 3% per rank.' },
  { id: 'aura_radius', branch: 'protection', name: 'Wider Sanctuary', short: 'Reach', icon: 'radius', maxRank: 3, level: 5, prerequisite: 'aura_power',
    description: 'Increases the aura’s radius by 10 per rank, from its base radius of 80.' },
  { id: 'emergency_guard', branch: 'protection', name: 'Last Stand', short: 'Guard', icon: 'guard', maxRank: 3, level: 10, prerequisite: 'aura_radius',
    description: 'Below 30% HP, the hero gains 20% / 30% / 40% damage reduction. Hero only; combined reduction is capped at 40%.' },
  { id: 'bastion', branch: 'protection', name: 'Bastion', short: 'Bastion', icon: 'bastion', maxRank: 1, level: 20, capstone: true,
    description: 'Every 18s, the aura grants an extra 12% damage reduction for the first 3s.' },
  { id: 'hammer_power', branch: 'judgement', name: 'Holy Hammer', short: 'Damage', icon: 'hammer', maxRank: 3, level: 2,
    description: 'The thrown hammer deals 25% more damage per rank.' },
  { id: 'hammer_haste', branch: 'judgement', name: 'Swift Judgement', short: 'Haste', icon: 'haste', maxRank: 3, level: 5, prerequisite: 'hammer_power',
    description: 'Reduces the thrown hammer’s cooldown by 1s per rank, from 12s to 9s.' },
  { id: 'hammer_splash', branch: 'judgement', name: 'Holy Impact', short: 'Splash', icon: 'splash', maxRank: 3, level: 10, prerequisite: 'hammer_haste',
    description: 'The hammer also deals 25% / 50% / 75% of its damage to enemies within 40 of the impact.' },
  { id: 'heavenly_hammer', branch: 'judgement', name: 'Heavenly Hammer', short: 'Heaven', icon: 'heaven', maxRank: 1, level: 20, capstone: true,
    description: 'The thrown hammer stuns every enemy hit for 0.8s, including splash targets.' },
] satisfies readonly HeroTalentDefinition[]).map(talent => Object.freeze(talent)));

// The catalogue contains every TalentId exactly once; only these keys enter either record.
const TALENTS_BY_ID = Object.freeze(Object.fromEntries(HERO_TALENTS.map(talent => [talent.id, talent] as const))) as Readonly<Record<TalentId, HeroTalentDefinition>>;
const plainObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value);
const safeCount = (value: unknown): number => isSafeInteger(value) && value >= 0 ? value : 0;
export const heroXpForLevel = (level: number): number => 50 * (Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1))) - 1) ** 2;
const MAX_XP = heroXpForLevel(HERO_MAX_LEVEL);
const levelAt = (xp: number): number => Math.min(HERO_MAX_LEVEL, 1 + Math.floor(Math.sqrt(xp / 50)));
const spentInBranch = (talents: HeroTalents, branch: BranchId): number => HERO_TALENTS.reduce((sum, talent) => sum + (talent.branch === branch ? talents[talent.id] ?? 0 : 0), 0);

export function createHero(saved?: unknown): HeroState {
  const source = plainObject(saved) ? saved : {};
  const xp = Math.min(MAX_XP, safeCount(source.xp));
  const level = levelAt(xp);
  const talents = Object.fromEntries(HERO_TALENTS.map(talent => [talent.id, 0] as const)) as HeroTalents;
  const savedTalents = plainObject(source.talents) ? source.talents : {};
  let remaining = level - 1;
  let capstoneTaken = false;
  // Validate prerequisites before dependents; invalid saves cannot create free ranks or two capstones.
  for (const talent of [...HERO_TALENTS.filter(node => !node.capstone), ...HERO_TALENTS.filter(node => node.capstone)]) {
    if (level < talent.level || (talent.prerequisite && talents[talent.prerequisite] < 1)) continue;
    if (talent.capstone && (capstoneTaken || spentInBranch(talents, talent.branch) < 6)) continue;
    const rank = Math.min(talent.maxRank, safeCount(savedTalents[talent.id]), remaining);
    talents[talent.id] = rank;
    remaining -= rank;
    if (talent.capstone && rank) capstoneTaken = true;
  }
  return { xp, highestWave: safeCount(source.highestWave), talents };
}

export function getHeroProgress(hero: HeroState): HeroProgress {
  const state = createHero(hero);
  const level = levelAt(state.xp);
  const floor = heroXpForLevel(level);
  const maxLevel = level === HERO_MAX_LEVEL;
  const neededXp = maxLevel ? 0 : heroXpForLevel(level + 1) - floor;
  const currentXp = maxLevel ? 0 : state.xp - floor;
  const spentPoints = Object.values(state.talents).reduce((sum, rank) => sum + rank, 0);
  return { level, xp: state.xp, currentXp, neededXp, ratio: maxLevel ? 1 : currentXp / neededXp,
    earnedPoints: level - 1, spentPoints, availablePoints: level - 1 - spentPoints, maxLevel };
}

export function getHeroStats(hero: HeroState): HeroStats {
  const state = createHero(hero), level = levelAt(state.xp), ranks = state.talents;
  const scale = (100 + 5 * (level - 1)) / 100;
  const scaled = (base: number): number => Math.round(base * scale * 1e6) / 1e6;
  return {
    level, maxHp: scaled(60), damage: scaled(4), attackInterval: 1.2,
    healAmount: scaled(2 * (1 + .3 * ranks.heal_power)), healCooldown: 8, healRange: 95,
    healShield: scaled(2 * ranks.heal_shield), healShieldDuration: 6, secondaryHealFraction: .25 * ranks.second_target,
    auraReduction: (2 + 3 * ranks.aura_power) / 100, auraRadius: 80 + 10 * ranks.aura_radius,
    emergencyGuardReduction: [0, .2, .3, .4][ranks.emergency_guard], emergencyGuardThreshold: .3,
    hammerDamage: scaled(4 * (1 + .25 * ranks.hammer_power)), hammerCooldown: Math.max(8, 12 - ranks.hammer_haste),
    hammerRange: 150, hammerSplashFraction: .25 * ranks.hammer_splash, hammerSplashRadius: 40,
    miracle: !!ranks.miracle, miracleHealFraction: .15, miracleRadius: 110, miracleThreshold: .3,
    bastion: !!ranks.bastion, bastionReduction: .12, bastionDuration: 3, bastionInterval: 18,
    heavenlyHammer: !!ranks.heavenly_hammer, hammerStunDuration: ranks.heavenly_hammer ? .8 : 0,
  };
}

export function getHeroTalentStatus(hero: HeroState, id: TalentId): HeroTalentStatus {
  const talent = typeof id === 'string' && Object.hasOwn(TALENTS_BY_ID, id) ? TALENTS_BY_ID[id] : null;
  if (!talent) return { available: false, reason: 'unknown', rank: 0 };
  const state = createHero(hero), progress = getHeroProgress(state), rank = state.talents[id];
  let reason: Exclude<TalentBlockReason, 'unknown'> | '' = '';
  if (rank >= talent.maxRank) reason = 'maxed';
  else if (progress.level < talent.level) reason = 'level';
  else if (talent.prerequisite && state.talents[talent.prerequisite] < 1) reason = 'prerequisite';
  else if (talent.capstone && HERO_TALENTS.some(node => node.capstone && state.talents[node.id])) reason = 'capstone';
  else if (talent.capstone && spentInBranch(state.talents, talent.branch) < 6) reason = 'branch';
  else if (progress.availablePoints < 1) reason = 'points';
  return { available: !reason, reason, rank, branchPoints: spentInBranch(state.talents, talent.branch) };
}

export function spendHeroTalent(hero: HeroState, id: TalentId): SpendHeroTalentResult {
  const status = getHeroTalentStatus(hero, id);
  if (!plainObject(hero) || !status.available) return { spent: false, reason: status.reason || 'invalid', rank: status.rank };
  const state = createHero(hero);
  state.talents[id] += 1;
  Object.assign(hero, state);
  return { spent: true, reason: '', rank: state.talents[id] };
}

export function resetHeroTalents(hero: HeroState): ResetHeroTalentsResult {
  if (!plainObject(hero)) return { reset: false, refunded: 0 };
  const state = createHero(hero), refunded = Object.values(state.talents).reduce((sum, rank) => sum + rank, 0);
  // createHero rebuilds the record from the catalogue, discarding unknown saved keys.
  for (const id of Object.keys(state.talents) as TalentId[]) state.talents[id] = 0;
  Object.assign(hero, state);
  return { reset: refunded > 0, refunded };
}

export function awardHeroXp(hero: HeroState, outcome?: HeroOutcome): HeroXpResult;
export function awardHeroXp(hero: HeroState, outcome: unknown = {}): HeroXpResult {
  const state = createHero(hero), previousLevel = levelAt(state.xp);
  const noReward = { gained: 0, level: previousLevel, previousLevel, leveledUp: false };
  if (!plainObject(hero) || !plainObject(outcome)) return noReward;
  const { waveNumber, kills, total, won } = outcome;
  if (!isSafeInteger(waveNumber) || waveNumber < 1 || !isSafeInteger(total) || total < 1
    || !isSafeInteger(kills) || kills < 0 || typeof won !== 'boolean') return noReward;
  const fraction = Math.min(total, kills) / total;
  if (!won && fraction === 0) return noReward;
  const firstClear = won && waveNumber > state.highestWave;
  // First clears reach level 20 around wave 200. Replays and real defeat progress remain useful.
  const base = 10 + waveNumber * .5;
  const reward = Math.max(1, Math.round(won ? base * (1 + .5 * fraction) * (firstClear ? 1 : .25) : base * .25 * fraction));
  const gained = Math.min(MAX_XP - state.xp, reward);
  state.xp += gained;
  if (won) state.highestWave = Math.max(state.highestWave, waveNumber);
  Object.assign(hero, state);
  const level = levelAt(state.xp);
  return { gained, level, previousLevel, leveledUp: level > previousLevel };
}
