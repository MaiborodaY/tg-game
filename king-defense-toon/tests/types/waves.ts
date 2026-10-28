import { ENEMY_TYPES, WAVE_DEFINITIONS, getEnemyCombatType, getLevelWaves, getRoundWaves, getWaveDefinition } from '../../waves.ts';
import type { EnemyCombatType, EnemySpawn, EnemyType, WaveDefinition } from '../../waves.ts';
import { openingContinuationSpawns } from '../../opening-curve.ts';
import { campaignContinuationSpawns, campaignCurve } from '../../campaign-curve.ts';
import type { CampaignCurve } from '../../campaign-curve.ts';

// Compile-only checks guard both the supported inputs and the freeze boundaries.
export function verifyWaveContracts(): void {
  const wave: WaveDefinition = getWaveDefinition('201');
  const fallback: WaveDefinition = getWaveDefinition(null);
  const level: WaveDefinition[] = getLevelWaves('2');
  const round: WaveDefinition[] = getRoundWaves(2, '20');
  const boss: EnemyType | null = wave.bossType;
  const combatRole: EnemyType = getEnemyCombatType('skeleton');
  const forestRole: EnemyCombatType = 'goblinHealer';
  const curve: CampaignCurve = campaignCurve(201);
  const opening: EnemySpawn[] = openingContinuationSpawns(11);
  const later: EnemySpawn[] = campaignContinuationSpawns(201);
  const health: number = wave.spawns[0].hp;
  const healing: number | undefined = wave.spawns[0].heal;

  // Only the final definitions are frozen; builders and filtered arrays stay mutable.
  opening[0].hp += 1;
  later.push({ type: 'skeleton', at: 1, x: 195, y: 92, hp: 100, damage: 10 });
  level.push(wave);

  // @ts-expect-error A new enemy role requires an explicit definition.
  const unknownRole: EnemyType = 'dragon';
  // @ts-expect-error An undead sprite identifier is not a combat behavior identifier.
  const undeadBehavior: EnemyCombatType = 'skeleton';
  // @ts-expect-error The runtime Number coercion does not make arbitrary objects valid API input.
  getWaveDefinition({ wave: 2 });
  // @ts-expect-error Continuation builders reject non-numeric inputs instead of coercing them.
  openingContinuationSpawns('11');
  // @ts-expect-error Campaign curve input must be numeric.
  campaignCurve(null);
  // @ts-expect-error Continuation spawns retain the numeric campaign API.
  campaignContinuationSpawns('201');
  // @ts-expect-error Only named enemy definitions can be looked up.
  getEnemyCombatType('dragon');
  // @ts-expect-error Fully resolved wave spawns require both health and damage.
  const incompleteSpawn: EnemySpawn = { type: 'goblin', at: 1, x: 195, y: 92, hp: 60 };
  // @ts-expect-error The catalog array is frozen.
  WAVE_DEFINITIONS.push(wave);
  // @ts-expect-error Every wave is frozen.
  wave.reward = 1;
  // @ts-expect-error Every final spawn is frozen independently.
  wave.spawns[0].hp = 1;
  // @ts-expect-error Final spawn collections are frozen.
  wave.spawns.push(later[0]);
  // @ts-expect-error Count rows are frozen along with their collection.
  wave.enemies[0].count = 1;
  // @ts-expect-error Enemy definitions are shared and frozen.
  ENEMY_TYPES.goblin.hp = 1;
  // @ts-expect-error An ordinary wave may not have a boss.
  const requiredBoss: EnemyType = wave.bossType;
  void [fallback, round, boss, combatRole, forestRole, curve, health, healing, unknownRole, undeadBehavior, incompleteSpawn, requiredBoss];
}
