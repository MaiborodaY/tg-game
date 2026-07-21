export type TowerType = "ranger" | "frost" | "ember" | "storm";
export type TowerLevel = 1 | 2 | 3 | 4;
export type DamageKind = "physical" | "frost" | "fire" | "arcane";
export type EnemyType = "raider" | "swift" | "brute" | "warden" | "shade" | "bulwark" | "shaman" | "boss" | "titan";
export type CampaignAct = 1 | 2 | 3;

export type Point = Readonly<{ x: number; y: number }>;

export type TowerPlacement = Readonly<{
  padId: number;
  type: TowerType;
  level: TowerLevel;
}>;

export type CampaignState = Readonly<{
  version: 3;
  gold: number;
  lives: number;
  completedWave: number;
  totalKills: number;
  activeDurationMs: number;
  towers: readonly TowerPlacement[];
}>;

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
  glyph: string;
}>;

export type WaveSpawn = Readonly<{
  id: number;
  type: EnemyType;
  atMs: number;
  maxHp: number;
  speed: number;
  reward: number;
  leakDamage: number;
  physicalResistance: number;
  magicResistance: number;
  shieldRatio: number;
  controlResistance: number;
  healingRadius: number;
  healingRatio: number;
  elite: boolean;
  bossTier: CampaignAct;
  summonThresholds: readonly number[];
  summonCount: number;
}>;

export type WavePlan = Readonly<{
  wave: number;
  spawns: readonly WaveSpawn[];
  clearBonus: number;
  hasBoss: boolean;
  act: CampaignAct;
  threat: 1 | 2 | 3 | 4 | 5;
}>;

export type CampaignError =
  | "invalid_pad"
  | "pad_occupied"
  | "pad_empty"
  | "insufficient_gold"
  | "max_level"
  | "mastery_locked"
  | "invalid_wave";

export type CampaignResult = Readonly<{
  state: CampaignState;
  ok: boolean;
  error: CampaignError | null;
  goldDelta: number;
}>;
