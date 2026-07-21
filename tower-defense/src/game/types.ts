export type TowerType = "ranger" | "frost" | "ember";
export type DamageKind = "physical" | "frost" | "fire" | "arcane";
export type EnemyType = "raider" | "swift" | "brute" | "warden" | "boss";

export type Point = Readonly<{ x: number; y: number }>;

export type TowerPlacement = Readonly<{
  padId: number;
  type: TowerType;
  level: 1 | 2 | 3;
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
  level: 1 | 2 | 3;
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
}>;

export type WavePlan = Readonly<{
  wave: number;
  spawns: readonly WaveSpawn[];
  clearBonus: number;
  hasBoss: boolean;
}>;

export type CampaignError =
  | "invalid_pad"
  | "pad_occupied"
  | "pad_empty"
  | "insufficient_gold"
  | "max_level"
  | "invalid_wave";

export type CampaignResult = Readonly<{
  state: CampaignState;
  ok: boolean;
  error: CampaignError | null;
  goldDelta: number;
}>;
