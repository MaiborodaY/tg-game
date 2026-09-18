export type EnemyCombatType = 'goblin' | 'goblinArcher' | 'goblinHealer' | 'goblinChief' | 'ogre' | 'boar';
export type EnemyType = EnemyCombatType | 'skeleton' | 'skeletonArcher' | 'ghoul' | 'cryptSpider' | 'cryptKing';

export interface EnemyDefinition {
  name: string;
  hp: number;
  damage: number;
  reward: number;
  heal?: number;
  combatType?: EnemyCombatType;
  isBoss?: boolean;
  isFinalBoss?: boolean;
}

export interface EnemySpawnPosition<T extends EnemyType = EnemyType> {
  type: T;
  at: number;
  x: number;
  y: number;
}

// Curve builders return mutable spawns; defineWave freezes their final copies.
export interface EnemySpawn<T extends EnemyType = EnemyType> extends EnemySpawnPosition<T> {
  hp: number;
  damage: number;
  reward?: number;
  heal?: number;
  name?: string;
}

export interface EnemyCount {
  readonly type: EnemyType;
  readonly name: string;
  readonly count: number;
}

export interface WaveDefinition {
  readonly number: number;
  readonly levelNumber: number;
  readonly roundNumber: number;
  readonly waveInRound: number;
  readonly levelName: string;
  readonly name: string;
  readonly description: string;
  readonly bossOnly: boolean;
  readonly hasBoss: boolean;
  readonly bossType: EnemyType | null;
  readonly isFinalBossWave: boolean;
  readonly enemies: readonly EnemyCount[];
  readonly spawns: readonly Readonly<EnemySpawn>[];
  readonly total: number;
  readonly reward: number;
}

export interface CampaignCurve {
  level: 1 | 2;
  round: number;
  wave: number;
  globalRound: number;
  meleeDamage: number;
  enemyCount: number;
  health: number;
  hasHealer: boolean;
  mainBoss: boolean;
}
