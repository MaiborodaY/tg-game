import type { EnemySpawn, EnemySpawnPosition } from './wave-types.ts';

type OpeningRole = 'goblin' | 'goblinArcher' | 'boar';
type OpeningEnemy = OpeningRole | 'goblinChief';
type HealthySpawn<T extends OpeningEnemy = OpeningEnemy> = EnemySpawnPosition<T> & { hp: number };

// Preserve the calibrated second and third rounds. campaign-curve.mjs continues
// their final HP/damage tier through the rest of both levels.
const ROUND_HEALTH = [
  [866, 878, 890, 902, 914, 926, 938, 950, 1120, 1250],
  [1265, 1277, 1289, 1301, 1313, 1325, 1337, 1349, 1500, 1680],
];
const ROLE_HEALTH = { goblin: 94, goblinArcher: 56, boar: 104 };

function encounterHealth(number: number): number {
  return ROUND_HEALTH[Math.floor((number - 11) / 10)][(number - 1) % 10];
}

function meleeDamage(number: number): number {
  // Put shared damage thresholds at the closing waves, then carry them forward.
  // A linear rounded formula previously raised every role at waves 21 and 27.
  return number >= 29 ? 14 : number >= 19 ? 12 : 10;
}

function group<T extends OpeningEnemy>(at: number, types: readonly T[]): EnemySpawnPosition<T>[] {
  const ranks = [types.filter(type => type !== 'goblinArcher'), types.filter(type => type === 'goblinArcher')];
  return ranks.flatMap((rank, row) => rank.map((type, index) => ({
    at, type, x: 195 + (index - (rank.length - 1) / 2) * 52, y: row ? 66 : 92,
  })));
}

function allocateHealth<T extends OpeningRole>(spawns: readonly EnemySpawnPosition<T>[], budget: number): HealthySpawn<T>[] {
  const weight = spawns.reduce((sum, spawn) => sum + ROLE_HEALTH[spawn.type], 0);
  const result = spawns.map(spawn => ({ ...spawn, hp: Math.round(budget * ROLE_HEALTH[spawn.type] / weight) }));
  // Keep the integer encounter budget exact after independently rounding each body.
  result[0].hp += budget - result.reduce((sum, spawn) => sum + spawn.hp, 0);
  return result;
}

export function openingContinuationSpawns(number: number): EnemySpawn<OpeningEnemy>[] {
  if (!Number.isInteger(number) || number < 11 || number > 30) throw new RangeError('Expected opening wave 11–30');
  const waveInRound = (number - 1) % 10 + 1;
  const health = encounterHealth(number);
  const damage = meleeDamage(number);
  if (waveInRound !== 10) {
    const spawns = allocateHealth([
      ...group(.8, ['goblin', 'boar', 'goblin', 'goblinArcher']),
      ...group(14.8, ['goblin', 'boar', 'goblin', 'goblinArcher']),
    ], health).map((spawn, index) => ({ ...spawn, damage: Math.round(damage
      * (spawn.type === 'goblinArcher' ? .64 : spawn.type === 'boar' ? .91 : 1))
      // The paladin lets two-healer armies beat wave 21 one level below its chief.
      // Add only one point to that lead fighter and carry it until the next damage tier.
      + (index === 0 ? (number >= 21 && number <= 28 ? 2 : 1) : 0) }));
    // Remove the last melee escort only in 1-2/9, after allocating HP so the
    // remaining fighters keep their stats. This trims about 13.5% of wave HP.
    let removedIndex = -1;
    if (number === 19) {
      for (let index = spawns.length - 1; index >= 0; index--) {
        if (spawns[index].type === 'goblin') { removedIndex = index; break; }
      }
    }
    return spawns.filter((_, index) => index !== removedIndex);
  }

  const bossType = 'goblinChief';
  const bossHealth = Math.round(health * .55);
  const spawns = [
    ...group(.8, ['goblin', bossType, 'goblin', 'goblinArcher']),
    ...group(14.8, ['goblin', 'goblinArcher']),
  ];
  const guards = allocateHealth(spawns.filter((spawn): spawn is EnemySpawnPosition<Exclude<OpeningRole, 'boar'>> => spawn.type !== bossType), health - bossHealth);
  let guardIndex = 0;
  // At 25+ damage, the second chief raised the two-healer win threshold above
  // wave 21. Keep this boundary-specific value instead of rounding a shared ratio.
  return spawns.map(spawn => spawn.type === bossType
    ? { ...spawn, hp: bossHealth, damage: number === 20 ? 24 : 31 }
    : { ...guards[guardIndex++], damage: Math.round(damage * (spawn.type === 'goblinArcher' ? .64 : 1)) });
}
