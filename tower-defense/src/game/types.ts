export type TowerType = "ranger" | "frost" | "ember" | "storm";
export type TowerLevel = 1 | 2 | 3 | 4;
export type HeroId = "eira" | "toren" | "grak";
export type HeroLevel = 1 | 2 | 3;
export type DamageKind = "physical" | "frost" | "fire" | "arcane";
export type EnemyType = "raider" | "swift" | "brute" | "warden" | "shade" | "bulwark" | "shaman" | "boss" | "titan";
export type EnemyVariant = "standard" | "snow-runner" | "icebound";
export type CampaignAct = 1 | 2 | 3;
export type NorthernStormSectorId = "upper" | "middle" | "lower";

export type Point = Readonly<{ x: number; y: number }>;

export type LevelProgression = Readonly<{
  heroUpgradeWaves: readonly [number, number];
  masteryWave: number;
  awakeningWave: number;
  actSize: number;
}>;

export type TowerPlacement = Readonly<{
  padId: number;
  type: TowerType;
  level: TowerLevel;
}>;

export type HeroState = Readonly<{
  id: HeroId;
  level: HeroLevel;
  anchorId: number;
}>;

export type RunState = Readonly<{
  version: 5;
  contentVersion: number;
  levelId: string;
  modeId: string;
  gold: number;
  lives: number;
  completedWave: number;
  totalKills: number;
  activeDurationMs: number;
  hero: HeroState;
  towers: readonly TowerPlacement[];
}>;

// Kept as a compatibility name while application code migrates to RunState.
export type CampaignState = RunState;

export type TowerStats = Readonly<{
  type: TowerType;
  level: TowerLevel;
  damageKind: DamageKind;
  damage: number;
  range: number;
  fireRateMs: number;
  projectileSpeed: number;
  splashRadius: number;
  slowFactor: number;
  slowDurationMs: number;
  burnDamagePerSecond: number;
  burnDurationMs: number;
  chainTargets: number;
  chainRange: number;
  bossDamageMultiplier: number;
}>;

export type EnemyDefinition = Readonly<{
  type: EnemyType;
  baseHp: number;
  speed: number;
  reward: number;
  leakDamage: number;
  size: number;
  physicalResistance: number;
  magicResistance: number;
  shieldRatio: number;
  controlResistance: number;
  healingRadius: number;
  healingRatio: number;
}>;

export type WaveSpawn = Readonly<{
  id: number;
  type: EnemyType;
  /** Optional for legacy Forest Gate plans; authored Northern Pass waves always set it. */
  variant?: EnemyVariant;
  atMs: number;
  maxHp: number;
  speed: number;
  reward: number;
  leakDamage: number;
  physicalResistance: number;
  magicResistance: number;
  shieldRatio: number;
  /** Additional breakable armour, expressed as a fraction of max HP. */
  frostArmorRatio?: number;
  controlResistance: number;
  healingRadius: number;
  healingRatio: number;
  elite: boolean;
  bossTier: CampaignAct;
  summonThresholds: readonly number[];
  summonCount: number;
}>;

export type NorthernStormPlan = Readonly<{
  sectorIds: readonly NorthernStormSectorId[];
  runnerSpeedBonus: number;
  iceboundControlResistanceBonus: number;
}>;

export type WavePlan = Readonly<{
  wave: number;
  spawns: readonly WaveSpawn[];
  clearBonus: number;
  hasBoss: boolean;
  act: CampaignAct;
  threat: 1 | 2 | 3 | 4 | 5;
  /** Present only on Northern Pass waves governed by the storm-front mechanic. */
  northernStorm?: NorthernStormPlan;
}>;

export type CampaignError =
  | "invalid_pad"
  | "invalid_hero_anchor"
  | "pad_occupied"
  | "pad_empty"
  | "insufficient_gold"
  | "max_level"
  | "hero_max_level"
  | "hero_upgrade_locked"
  | "mastery_locked"
  | "invalid_wave";

export type CampaignResult = Readonly<{
  state: CampaignState;
  ok: boolean;
  error: CampaignError | null;
  goldDelta: number;
}>;
