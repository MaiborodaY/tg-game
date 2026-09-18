export type BranchId = 'light' | 'protection' | 'judgement';
export type TalentId = 'heal_unlock' | 'heal_power' | 'heal_haste' | 'heal_shield' | 'second_target' | 'miracle'
  | 'aura_unlock' | 'aura_power' | 'aura_radius' | 'emergency_guard' | 'guardian_ward' | 'bastion'
  | 'hammer_unlock' | 'hammer_power' | 'hammer_haste' | 'hammer_splash' | 'holy_strike' | 'heavenly_hammer';
export type HeroTalents = Record<TalentId, number>;

export interface HeroState {
  xp: number;
  highestWave: number;
  talentVersion: typeof HERO_TALENT_VERSION;
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
  readonly maxRank: 1 | 2 | 3;
  readonly level: 2 | 20;
  readonly description: string;
  readonly row: 0 | 1 | 2 | 3;
  readonly column: 0 | 1 | 2;
  readonly branchRequired: number;
  readonly prerequisites: readonly TalentId[];
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
  healUnlocked: boolean;
  auraUnlocked: boolean;
  hammerUnlocked: boolean;
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
  guardianWardFraction: number;
  guardianWardThreshold: number;
  guardianWardDuration: number;
  guardianWardCooldown: number;
  hammerDamage: number;
  hammerCooldown: number;
  hammerRange: number;
  hammerSplashFraction: number;
  hammerSplashRadius: number;
  holyStrikeFraction: number;
  holyStrikeDuration: number;
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
export const HERO_TALENT_VERSION = 2;
export const HERO_NAME = 'St. Knihor';
export const HERO_BRANCHES: readonly HeroBranchDefinition[] = Object.freeze([
  Object.freeze({ id: 'light', name: 'Light', icon: 'light' }),
  Object.freeze({ id: 'protection', name: 'Protection', icon: 'shield' }),
  Object.freeze({ id: 'judgement', name: 'Judgement', icon: 'hammer' }),
]);

export const HERO_TALENTS: readonly HeroTalentDefinition[] = Object.freeze(([
  { id: 'heal_unlock', branch: 'light', name: 'Healing Light', short: 'Heal', icon: 'light', maxRank: 1, level: 2,
    row: 0, column: 1, branchRequired: 0, prerequisites: [],
    description: 'Unlocks automatic healing for a wounded ally: 4 HP every 8s, scaled with hero level.' },
  { id: 'heal_power', branch: 'light', name: 'Radiant Light', short: 'Power', icon: 'light', maxRank: 3, level: 2,
    row: 1, column: 0, branchRequired: 0, prerequisites: ['heal_unlock'],
    description: 'Healing restores 10% more HP per rank.' },
  { id: 'heal_haste', branch: 'light', name: 'Quick Prayer', short: 'Haste', icon: 'haste', maxRank: 3, level: 2,
    row: 1, column: 2, branchRequired: 0, prerequisites: ['heal_unlock'],
    description: 'Reduces the healing cooldown by 0.75s per rank, from 8s to 5.75s.' },
  { id: 'heal_shield', branch: 'light', name: 'Overflowing Light', short: 'Shield', icon: 'ward', maxRank: 2, level: 2,
    row: 2, column: 0, branchRequired: 5, prerequisites: ['heal_power'],
    description: 'Excess healing grants a shield for 6s, capped at 2 / 4 HP, scaled with hero level.' },
  { id: 'second_target', branch: 'light', name: 'Shared Light', short: 'Shared', icon: 'shared', maxRank: 2, level: 2,
    row: 2, column: 2, branchRequired: 5, prerequisites: ['heal_haste'],
    description: 'Also heals a second wounded ally for 30% / 60% of the main heal.' },
  { id: 'miracle', branch: 'light', name: 'Miracle', short: 'Miracle', icon: 'miracle', maxRank: 1, level: 20, capstone: true,
    row: 3, column: 1, branchRequired: 10, prerequisites: ['heal_shield', 'second_target'],
    description: 'Once per wave, an ally below 30% HP triggers a heal for nearby allies: 15% of each target’s maximum HP within 110 range.' },
  { id: 'aura_unlock', branch: 'protection', name: 'Protective Aura', short: 'Aura', icon: 'shield', maxRank: 1, level: 2,
    row: 0, column: 1, branchRequired: 0, prerequisites: [],
    description: 'Unlocks an aura that reduces incoming damage by 4% for the hero and allies within 80 range.' },
  { id: 'aura_power', branch: 'protection', name: 'Unbroken Armour', short: 'Armour', icon: 'shield', maxRank: 3, level: 2,
    row: 1, column: 0, branchRequired: 0, prerequisites: ['aura_unlock'],
    description: 'The aura reduces incoming damage by an additional 2% per rank.' },
  { id: 'aura_radius', branch: 'protection', name: 'Wider Sanctuary', short: 'Reach', icon: 'radius', maxRank: 3, level: 2,
    row: 1, column: 2, branchRequired: 0, prerequisites: ['aura_unlock'],
    description: 'Increases the aura’s radius by 10 per rank, from its base radius of 80.' },
  { id: 'emergency_guard', branch: 'protection', name: 'Last Stand', short: 'Guard', icon: 'guard', maxRank: 2, level: 2,
    row: 2, column: 0, branchRequired: 5, prerequisites: ['aura_power'],
    description: 'Below 30% HP, the hero gains 15% / 25% damage reduction. Hero only; combined reduction is capped at 40%.' },
  { id: 'guardian_ward', branch: 'protection', name: 'Guardian Ward', short: 'Ward', icon: 'ward', maxRank: 2, level: 2,
    row: 2, column: 2, branchRequired: 5, prerequisites: ['aura_radius'],
    description: 'After taking a hit worth at least 10% of maximum HP, the hero gains an 8% / 12% HP shield for 4s. Cooldown: 12s.' },
  { id: 'bastion', branch: 'protection', name: 'Bastion', short: 'Bastion', icon: 'bastion', maxRank: 1, level: 20, capstone: true,
    row: 3, column: 1, branchRequired: 10, prerequisites: ['emergency_guard', 'guardian_ward'],
    description: 'Every 18s, the aura grants an extra 12% damage reduction for the first 3s.' },
  { id: 'hammer_unlock', branch: 'judgement', name: 'Holy Hammer', short: 'Hammer', icon: 'hammer', maxRank: 1, level: 2,
    row: 0, column: 1, branchRequired: 0, prerequisites: [],
    description: 'Unlocks an automatic hammer throw: 6 damage every 12s, scaled with hero level.' },
  { id: 'hammer_power', branch: 'judgement', name: 'Righteous Might', short: 'Damage', icon: 'hammer', maxRank: 3, level: 2,
    row: 1, column: 0, branchRequired: 0, prerequisites: ['hammer_unlock'],
    description: 'The thrown hammer deals 15% more damage per rank.' },
  { id: 'hammer_haste', branch: 'judgement', name: 'Swift Judgement', short: 'Haste', icon: 'haste', maxRank: 3, level: 2,
    row: 1, column: 2, branchRequired: 0, prerequisites: ['hammer_unlock'],
    description: 'Reduces the thrown hammer’s cooldown by 1s per rank, from 12s to 9s.' },
  { id: 'hammer_splash', branch: 'judgement', name: 'Holy Impact', short: 'Splash', icon: 'splash', maxRank: 2, level: 2,
    row: 2, column: 0, branchRequired: 5, prerequisites: ['hammer_power'],
    description: 'The hammer also deals 25% / 50% of its damage to enemies within 40 of the impact.' },
  { id: 'holy_strike', branch: 'judgement', name: 'Holy Strike', short: 'Strike', icon: 'strike', maxRank: 2, level: 2,
    row: 2, column: 2, branchRequired: 5, prerequisites: ['hammer_haste'],
    description: 'After the hammer hits an enemy, the next ordinary attack within 6s deals 25% / 50% more damage.' },
  { id: 'heavenly_hammer', branch: 'judgement', name: 'Heavenly Hammer', short: 'Heaven', icon: 'heaven', maxRank: 1, level: 20, capstone: true,
    row: 3, column: 1, branchRequired: 10, prerequisites: ['hammer_splash', 'holy_strike'],
    description: 'The thrown hammer stuns every enemy hit for 0.8s, including splash targets.' },
] satisfies readonly HeroTalentDefinition[]).map(talent => Object.freeze({ ...talent, prerequisites: Object.freeze(talent.prerequisites) })));

// The catalogue contains every TalentId exactly once; only these keys enter either record.
const TALENTS_BY_ID = Object.freeze(Object.fromEntries(HERO_TALENTS.map(talent => [talent.id, talent] as const))) as Readonly<Record<TalentId, HeroTalentDefinition>>;
const plainObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value);
const safeCount = (value: unknown): number => isSafeInteger(value) && value >= 0 ? value : 0;
export const heroXpForLevel = (level: number): number => 50 * (Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1))) - 1) ** 2;
const MAX_XP = heroXpForLevel(HERO_MAX_LEVEL);
const levelAt = (xp: number): number => Math.min(HERO_MAX_LEVEL, 1 + Math.floor(Math.sqrt(xp / 50)));
const spentInBranch = (talents: HeroTalents, branch: BranchId): number => HERO_TALENTS.reduce((sum, talent) => sum + (talent.branch === branch ? talents[talent.id] ?? 0 : 0), 0);
const talentGate = (talents: HeroTalents, talent: HeroTalentDefinition, level: number): 'level' | 'prerequisite' | 'branch' | '' => {
  if (level < talent.level) return 'level';
  if (talent.prerequisites.some(id => talents[id] < 1)) return 'prerequisite';
  if (spentInBranch(talents, talent.branch) - talents[talent.id] < talent.branchRequired) return 'branch';
  return '';
};

export function createHero(saved?: unknown): HeroState {
  const source = plainObject(saved) ? saved : {};
  const xp = Math.min(MAX_XP, safeCount(source.xp));
  const level = levelAt(xp);
  const talents = Object.fromEntries(HERO_TALENTS.map(talent => [talent.id, 0] as const)) as HeroTalents;
  // Old allocations belong to the former always-unlocked abilities. Refund them once,
  // preserving progression; only this layout's version can restore learned nodes.
  const savedTalents = source.talentVersion === HERO_TALENT_VERSION && plainObject(source.talents) ? source.talents : {};
  let remaining = level - 1;
  let advanced = true;
  // Replay legal purchases rather than trusting totals: forged siblings cannot fund
  // one another before their row unlocks. Passes also preserve valid sibling-funded
  // builds regardless of object-key order. Every accepted rank consumes one point.
  while (remaining > 0 && advanced) {
    advanced = false;
    for (const talent of HERO_TALENTS) {
      if (!remaining) break;
      const requested = Math.min(talent.maxRank, safeCount(savedTalents[talent.id]));
      if (talents[talent.id] >= requested || talentGate(talents, talent, level)) continue;
      talents[talent.id] += 1;
      remaining -= 1;
      advanced = true;
    }
  }
  return { xp, highestWave: safeCount(source.highestWave), talentVersion: HERO_TALENT_VERSION, talents };
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

export function getHeroStats(hero?: HeroState): HeroStats {
  return calculateHeroStats(createHero(hero));
}

function calculateHeroStats(state: HeroState): HeroStats {
  const level = levelAt(state.xp), ranks = state.talents;
  const scale = (100 + 5 * (level - 1)) / 100;
  const scaled = (base: number): number => Math.round(base * scale * 1e6) / 1e6;
  const healUnlocked = !!ranks.heal_unlock, auraUnlocked = !!ranks.aura_unlock, hammerUnlocked = !!ranks.hammer_unlock;
  const miracle = healUnlocked && !!ranks.miracle;
  const bastion = auraUnlocked && !!ranks.bastion;
  const heavenlyHammer = hammerUnlocked && !!ranks.heavenly_hammer;
  return {
    level, maxHp: scaled(60), damage: scaled(4), attackInterval: 1.2,
    healUnlocked, auraUnlocked, hammerUnlocked,
    healAmount: healUnlocked ? scaled(4 * (1 + .1 * ranks.heal_power)) : 0,
    healCooldown: healUnlocked ? 8 - .75 * ranks.heal_haste : 0, healRange: healUnlocked ? 95 : 0,
    healShield: healUnlocked ? scaled(2 * ranks.heal_shield) : 0, healShieldDuration: healUnlocked ? 6 : 0,
    secondaryHealFraction: healUnlocked ? .3 * ranks.second_target : 0,
    auraReduction: auraUnlocked ? (4 + 2 * ranks.aura_power) / 100 : 0,
    auraRadius: auraUnlocked ? 80 + 10 * ranks.aura_radius : 0,
    emergencyGuardReduction: auraUnlocked ? [0, .15, .25][ranks.emergency_guard] : 0,
    emergencyGuardThreshold: auraUnlocked ? .3 : 0,
    guardianWardFraction: auraUnlocked ? [0, .08, .12][ranks.guardian_ward] : 0,
    guardianWardThreshold: auraUnlocked ? .1 : 0, guardianWardDuration: auraUnlocked ? 4 : 0,
    guardianWardCooldown: auraUnlocked ? 12 : 0,
    hammerDamage: hammerUnlocked ? scaled(6 * (1 + .15 * ranks.hammer_power)) : 0,
    hammerCooldown: hammerUnlocked ? 12 - ranks.hammer_haste : 0,
    hammerRange: hammerUnlocked ? 150 : 0, hammerSplashFraction: hammerUnlocked ? .25 * ranks.hammer_splash : 0,
    hammerSplashRadius: hammerUnlocked ? 40 : 0,
    holyStrikeFraction: hammerUnlocked ? .25 * ranks.holy_strike : 0, holyStrikeDuration: hammerUnlocked ? 6 : 0,
    miracle, miracleHealFraction: miracle ? .15 : 0, miracleRadius: miracle ? 110 : 0, miracleThreshold: miracle ? .3 : 0,
    bastion, bastionReduction: bastion ? .12 : 0, bastionDuration: bastion ? 3 : 0, bastionInterval: bastion ? 18 : 0,
    heavenlyHammer, hammerStunDuration: heavenlyHammer ? .8 : 0,
  };
}

export function getHeroTalentEffect(hero: HeroState, id: TalentId, rank?: number): string {
  const talent = typeof id === 'string' && Object.hasOwn(TALENTS_BY_ID, id) ? TALENTS_BY_ID[id] : null;
  if (!talent) return '';
  const state = createHero(hero);
  const requestedRank = rank === undefined ? state.talents[id] : Math.min(talent.maxRank, safeCount(rank));
  if (!requestedRank) return 'Not learned';
  state.talents[id] = requestedRank;
  // A locked descendant may still preview its future effect, without allocating it.
  const root = HERO_TALENTS.find(node => node.branch === talent.branch && node.row === 0)!;
  state.talents[root.id] = 1;
  const stats = calculateHeroStats(state);
  const number = (value: number): string => String(Math.round(value * 100) / 100);
  const percent = (value: number): string => `${number(value * 100)}%`;
  switch (id) {
    case 'heal_unlock': return `${number(stats.healAmount)} HP / ${number(stats.healCooldown)}s`;
    case 'heal_power': return `${number(stats.healAmount)} HP per heal`;
    case 'heal_haste': return `${number(stats.healCooldown)}s healing cooldown`;
    case 'heal_shield': return `Up to ${number(stats.healShield)} shield HP / ${stats.healShieldDuration}s`;
    case 'second_target': return `${percent(stats.secondaryHealFraction)} heal to a second ally`;
    case 'miracle': return `${percent(stats.miracleHealFraction)} ally HP / once per wave`;
    case 'aura_unlock': return `${percent(stats.auraReduction)} less damage / ${stats.auraRadius} range`;
    case 'aura_power': return `${percent(stats.auraReduction)} less damage in aura`;
    case 'aura_radius': return `${stats.auraRadius} aura range`;
    case 'emergency_guard': return `${percent(stats.emergencyGuardReduction)} less damage below ${percent(stats.emergencyGuardThreshold)} HP`;
    case 'guardian_ward': return `${percent(stats.guardianWardFraction)} HP shield / ${stats.guardianWardDuration}s`;
    case 'bastion': return `Extra ${percent(stats.bastionReduction)} protection / ${stats.bastionDuration}s every ${stats.bastionInterval}s`;
    case 'hammer_unlock': return `${number(stats.hammerDamage)} damage / ${number(stats.hammerCooldown)}s`;
    case 'hammer_power': return `${number(stats.hammerDamage)} hammer damage`;
    case 'hammer_haste': return `${number(stats.hammerCooldown)}s hammer cooldown`;
    case 'hammer_splash': return `${percent(stats.hammerSplashFraction)} splash damage`;
    case 'holy_strike': return `Next attack +${percent(stats.holyStrikeFraction)} / ${stats.holyStrikeDuration}s`;
    case 'heavenly_hammer': return `${number(stats.hammerStunDuration)}s stun on hammer hits`;
  }
}

export function getHeroTalentStatus(hero: HeroState, id: TalentId): HeroTalentStatus {
  const talent = typeof id === 'string' && Object.hasOwn(TALENTS_BY_ID, id) ? TALENTS_BY_ID[id] : null;
  if (!talent) return { available: false, reason: 'unknown', rank: 0 };
  const state = createHero(hero), progress = getHeroProgress(state), rank = state.talents[id];
  let reason: Exclude<TalentBlockReason, 'unknown'> | '' = '';
  const gate = talentGate(state.talents, talent, progress.level);
  if (rank >= talent.maxRank) reason = 'maxed';
  else if (gate) reason = gate;
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
