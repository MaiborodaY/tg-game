import type { CampaignCurve, EnemyCombatType, EnemySpawn, EnemySpawnPosition, EnemyType } from './wave-types.ts';
export type { CampaignCurve } from './wave-types.ts';

type CampaignEnemy = Exclude<EnemyCombatType, 'plagueAlchemist' | 'goblinBombardier'>;
type CampaignRole = Exclude<CampaignEnemy, 'goblinChief' | 'ogre'>;
type HealthySpawn = EnemySpawnPosition<CampaignEnemy> & { hp: number };

// Continue the 1-3 endpoint without compounding growth against the personal-level cap.
// The last opening round gained 430 HP: +15, seven +12 steps, +151, then +180.
const ROUND_HP_GAIN = 430;
const OPENING_FINAL_HP = 1680;
const WAVE_HP_STEPS = Object.freeze([15, 27, 39, 51, 63, 75, 87, 99, 250, 430]);
const ROLE_HEALTH = Object.freeze({ goblin: 94, goblinArcher: 56, boar: 104, goblinHealer: 70 });
const EXTRA_ROLES = Object.freeze(['goblin', 'goblinArcher', 'boar', 'goblin'] as const);
const UNDEAD_ROLES: Readonly<Record<Exclude<CampaignEnemy, 'goblinHealer'>, EnemyType>> = Object.freeze({ goblin: 'skeleton', goblinArcher: 'skeletonArcher', boar: 'ghoul', goblinChief: 'cryptSpider', ogre: 'cryptKing' });

export function campaignCurve(number: number): CampaignCurve {
  if (!Number.isInteger(number) || number < 31 || number > 400) throw new RangeError('Expected campaign wave 31–400');
  const globalRound = Math.ceil(number / 10);
  const level = number <= 200 ? 1 : 2;
  const round = (globalRound - 1) % 20 + 1;
  const wave = (number - 1) % 10 + 1;
  const completedPeaks = globalRound - (wave < 9 ? 1 : 0);
  // Carry ninth-wave damage forward; taper growth as armies approach personal Lv.100.
  const meleeDamage = 14 + 2 * Math.max(0, Math.min(10, completedPeaks) - 3)
    + Math.max(0, Math.min(20, completedPeaks) - 10)
    + Math.floor(Math.max(0, completedPeaks - 20) / 2);
  const enemyCount = 8 + [6, 9, 13, 17, 21, 26, 31, 36].filter(unlock => globalRound >= unlock).length;
  return {
    level, round, wave, globalRound, meleeDamage, enemyCount,
    health: OPENING_FINAL_HP + (globalRound - 4) * ROUND_HP_GAIN + WAVE_HP_STEPS[wave - 1],
    hasHealer: level === 1 && round >= 6,
    mainBoss: wave === 10 && (round === 10 || round === 20),
  };
}

function group(at: number, types: readonly CampaignEnemy[]): EnemySpawnPosition<CampaignEnemy>[] {
  const ranged = (type: CampaignEnemy) => type === 'goblinArcher' || type === 'goblinHealer';
  const ranks = [types.filter(type => !ranged(type)), types.filter(ranged)];
  return ranks.flatMap((rank, row) => rank.map((type, index) => ({
    at, type, x: 195 + (index - (rank.length - 1) / 2) * 52, y: row ? 66 : 92,
  })));
}

function allocateHealth(spawns: readonly EnemySpawnPosition<CampaignRole>[], budget: number): HealthySpawn[] {
  const weight = spawns.reduce((sum, spawn) => sum + ROLE_HEALTH[spawn.type], 0);
  const result = spawns.map(spawn => ({ ...spawn, hp: Math.round(budget * ROLE_HEALTH[spawn.type] / weight) }));
  result[0].hp += budget - result.reduce((sum, spawn) => sum + spawn.hp, 0);
  return result;
}

export function campaignContinuationSpawns(number: number): EnemySpawn[] {
  const curve = campaignCurve(number);
  const bossType = curve.mainBoss ? 'ogre' : 'goblinChief';
  const types: CampaignEnemy[] = curve.wave === 10
    ? ['goblin', bossType, 'goblin', 'goblinArcher', 'goblin', 'goblinArcher']
    : ['goblin', 'boar', 'goblin', 'goblinArcher', 'goblin', 'boar', 'goblin', 'goblinArcher'];
  const count = curve.wave === 10 ? 6 + Math.floor((curve.enemyCount - 8) / 2) : curve.enemyCount;
  let extraIndex = 0;
  while (types.length < count) types.push(EXTRA_ROLES[extraIndex++ % EXTRA_ROLES.length]);
  // Add support to the opening group without removing an archer. Grouping afterwards
  // keeps every arrival at four or fewer and brings the healer alongside each boss.
  if (curve.hasHealer) types.splice(3, 0, 'goblinHealer');
  const spawns: EnemySpawnPosition<CampaignEnemy>[] = [];
  for (let index = 0; index < types.length; index += 4) {
    spawns.push(...group(.8 + 14 * (index / 4), types.slice(index, index + 4)));
  }
  let resolved: HealthySpawn[];
  if (curve.wave === 10) {
    const bossHp = Math.round(curve.health * (curve.mainBoss ? .65 : .55));
    const guards = allocateHealth(spawns.filter((spawn): spawn is EnemySpawnPosition<CampaignRole> => spawn.type !== bossType), curve.health - bossHp);
    let guardIndex = 0;
    resolved = spawns.map(spawn => spawn.type === bossType
      ? { ...spawn, hp: bossHp } : guards[guardIndex++]);
  // The non-boss lineup and EXTRA_ROLES only contain weighted ordinary roles.
  } else resolved = allocateHealth(spawns as EnemySpawnPosition<CampaignRole>[], curve.health);
  return resolved.map((spawn, index) => {
    const isBoss = spawn.type === bossType;
    const healer = spawn.type === 'goblinHealer';
    const ratio = spawn.type === 'goblinArcher' ? .64 : spawn.type === 'boar' ? .91 : healer ? .2 : 1;
    return {
      ...spawn,
      // hasHealer is false in level 2, so every undead spawn has a mapped counterpart.
      type: curve.level === 2 ? UNDEAD_ROLES[spawn.type as Exclude<CampaignEnemy, 'goblinHealer'>]
        // Replace only the late forest mini-boss; keep its curve, escort and arrival intact.
        : curve.round > 10 && curve.round < 20 && spawn.type === 'goblinChief' ? 'goblinBombardier' : spawn.type,
      damage: isBoss ? Math.round(curve.meleeDamage * (curve.mainBoss ? 2.5 : 31 / 14))
        : Math.max(healer ? 3 : 1, Math.round(curve.meleeDamage * ratio)) + (curve.wave !== 10 && index === 0 ? 1 : 0),
      ...(healer ? { heal: Math.round(number <= 100
        ? 10 + (number - 30) * 25 / 71 : curve.meleeDamage * 1.25) } : {}),
    };
  });
}
