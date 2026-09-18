import type { EnemyCombatType, EnemyDefinition, EnemySpawn, EnemySpawnPosition, EnemyType, WaveDefinition } from './wave-types.ts';
import type { UnitType } from './units.ts';
export type { EnemyCombatType, EnemyCount, EnemyDefinition, EnemySpawn, EnemySpawnPosition, EnemyType, WaveDefinition } from './wave-types.ts';

type SpawnStats = Pick<EnemySpawn, 'hp' | 'damage'> & Partial<Pick<EnemySpawn, 'heal' | 'reward' | 'name'>>;
type SpawnSeed<T extends EnemyType = EnemyType> = Omit<EnemySpawnPosition<T>, 'y'> & Partial<SpawnStats> & { y?: number };
type ResolvedSpawnSeed = SpawnSeed & Pick<EnemySpawn, 'hp' | 'damage'>;
interface WaveOptions { stats?: Partial<Record<EnemyType, SpawnStats>>; bossOnly?: boolean }
export type WaveNumberInput = number | string | null | undefined;
type EnemyCatalog = {
  readonly [T in EnemyType]: T extends EnemyCombatType ? Readonly<EnemyDefinition>
    : Readonly<EnemyDefinition> & { readonly combatType: EnemyCombatType };
};

import { openingContinuationSpawns } from './opening-curve.ts';
import { campaignContinuationSpawns } from './campaign-curve.ts';

export const CAMPAIGN_VERSION = 3;
export const WAVES_PER_ROUND = 10;
export const ROUNDS_PER_LEVEL = 20;
export const WAVES_PER_LEVEL = WAVES_PER_ROUND * ROUNDS_PER_LEVEL;
export const LEVEL_DEFINITIONS = Object.freeze([
  Object.freeze({ number: 1, name: 'Whispering Woods' }),
  Object.freeze({ number: 2, name: 'Forgotten Graveyard' }),
]);
export const LEVEL_COUNT = LEVEL_DEFINITIONS.length;
const LEVEL_2_STAT_MULTIPLIER = 3;
const LEVEL_2_GOLD_MULTIPLIER = 2;

export const ENEMY_TYPES: EnemyCatalog = Object.freeze({
  goblin: Object.freeze({ name: 'Torch goblin', hp: 60, damage: 7, reward: 1 }),
  goblinArcher: Object.freeze({ name: 'Goblin archer', hp: 32, damage: 4, reward: 1 }),
  goblinHealer: Object.freeze({ name: 'Goblin healer', hp: 70, damage: 3, heal: 12, reward: 1 }),
  plagueAlchemist: Object.freeze({ name: 'Plague Alchemist', hp: 210, damage: 12, reward: 2 }),
  goblinChief: Object.freeze({ name: 'Goblin chief', hp: 650, damage: 18, reward: 20, isBoss: true }),
  ogre: Object.freeze({ name: 'Ogre brute', hp: 1100, damage: 22, reward: 20, isBoss: true, isFinalBoss: true }),
  boar: Object.freeze({ name: 'Boar', hp: 80, damage: 8, reward: 2 }),
  skeleton: Object.freeze({ name: 'Skeleton', combatType: 'goblin', hp: 60 * LEVEL_2_STAT_MULTIPLIER, damage: 7 * LEVEL_2_STAT_MULTIPLIER, reward: LEVEL_2_GOLD_MULTIPLIER }),
  skeletonArcher: Object.freeze({ name: 'Skeleton archer', combatType: 'goblinArcher', hp: 32 * LEVEL_2_STAT_MULTIPLIER, damage: 4 * LEVEL_2_STAT_MULTIPLIER, reward: LEVEL_2_GOLD_MULTIPLIER }),
  ghoul: Object.freeze({ name: 'Ghoul', combatType: 'boar', hp: 80 * LEVEL_2_STAT_MULTIPLIER, damage: 8 * LEVEL_2_STAT_MULTIPLIER, reward: 2 * LEVEL_2_GOLD_MULTIPLIER }),
  cryptSpider: Object.freeze({ name: 'Crypt Spider', combatType: 'goblinChief', hp: 650 * LEVEL_2_STAT_MULTIPLIER, damage: 18 * LEVEL_2_STAT_MULTIPLIER, reward: 20 * LEVEL_2_GOLD_MULTIPLIER, isBoss: true }),
  cryptKing: Object.freeze({ name: 'Crypt King', combatType: 'ogre', hp: 1100 * LEVEL_2_STAT_MULTIPLIER, damage: 22 * LEVEL_2_STAT_MULTIPLIER, reward: 20 * LEVEL_2_GOLD_MULTIPLIER, isBoss: true, isFinalBoss: true }),
});

export function getEnemyCombatType<T extends EnemyType | UnitType | 'hero' | 'castle'>(type: T): T extends EnemyType ? EnemyCombatType : T;
export function getEnemyCombatType(type: EnemyType | UnitType | 'hero' | 'castle') {
  // Allied IDs have no enemy definition and retain their existing identity fallback.
  return (ENEMY_TYPES as Readonly<Partial<Record<EnemyType | UnitType | 'hero' | 'castle', Readonly<EnemyDefinition>>>>)[type]?.combatType ?? type;
}

// Every spawn must receive HP/damage either directly or from its role's stat override.
function defineWave<T extends EnemyType>(number: number, name: string, description: string,
  spawns: readonly SpawnSeed<T>[], options: { stats: Record<T, SpawnStats>; bossOnly?: boolean }): WaveDefinition;
function defineWave(number: number, name: string, description: string,
  spawns: readonly ResolvedSpawnSeed[], options?: WaveOptions): WaveDefinition;
function defineWave(number: number, name: string, description: string,
  spawns: readonly SpawnSeed[], { stats = {}, bossOnly = false }: WaveOptions = {}): WaveDefinition {
  const levelNumber = Math.floor((number - 1) / WAVES_PER_LEVEL) + 1;
  const roundNumber = Math.floor(((number - 1) % WAVES_PER_LEVEL) / WAVES_PER_ROUND) + 1;
  const waveInRound = (number - 1) % WAVES_PER_ROUND + 1;
  // The overloads guarantee complete stats; a spread from a partial role map loses that proof.
  const resolvedSpawns = spawns.map(spawn => Object.freeze({ y: 92, ...stats[spawn.type], ...spawn }) as Readonly<EnemySpawn>);
  const bossType = resolvedSpawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss)?.type ?? null;
  const counts = new Map<EnemyType, number>();
  for (const spawn of resolvedSpawns) counts.set(spawn.type, (counts.get(spawn.type) ?? 0) + 1);
  return Object.freeze({
    number, levelNumber, roundNumber, waveInRound, levelName: LEVEL_DEFINITIONS[levelNumber - 1].name,
    name, description, bossOnly,
    hasBoss: bossType !== null, bossType, isFinalBossWave: bossType === null ? false : Boolean(ENEMY_TYPES[bossType].isFinalBoss),
    enemies: Object.freeze([...counts].map(([type, count]) => Object.freeze({
      type, name: stats[type]?.name ?? ENEMY_TYPES[type].name, count,
    }))),
    spawns: Object.freeze(resolvedSpawns),
    total: resolvedSpawns.length,
    reward: resolvedSpawns.reduce((sum, spawn) => sum + (spawn.reward ?? ENEMY_TYPES[spawn.type].reward), 0),
  });
}

function squad<T extends EnemyType>(at: number, types: readonly T[], offset = 0): EnemySpawnPosition<T>[] {
  // Center the two ranks separately so larger simultaneous groups fit on a phone.
  const ranks = [types.filter(type => type !== 'goblinArcher'), types.filter(type => type === 'goblinArcher')];
  return ranks.flatMap((rank, row) => rank.map((type, index) => ({
    at, type, x: 195 + offset + (index - (rank.length - 1) / 2) * Math.min(52, 260 / Math.max(1, rank.length - 1)),
    y: row === 1 ? 66 : 92,
  })));
}

const FOREST_WAVE_TEMPLATES = Object.freeze([
  // A recruit swordsman and a starting goblin are close in a duel; later groups grow steadily.
  defineWave(1, 'Goblin scouts', 'Two goblins arrive together, then a third follows.', [
    ...squad(.8, ['goblin', 'goblin']),
    ...squad(6.8, ['goblin']),
  ], { stats: {
    goblin: { hp: 60, damage: 7 },
  } }),
  defineWave(2, 'Broken arrows', 'Two fighters and two archers enter together.', [
    ...squad(.8, ['goblin', 'goblin', 'goblinArcher', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 60, damage: 7 },
    goblinArcher: { hp: 32, damage: 4 },
  } }),
  defineWave(3, 'Forest raiders', 'A squad of three advances, followed by two reinforcements.', [
    ...squad(.8, ['goblin', 'goblin', 'goblinArcher']),
    ...squad(14.8, ['goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 64, damage: 7 },
    goblinArcher: { hp: 36, damage: 4 },
  } }),
  defineWave(4, 'Burning advance', 'Two squads of three bring a boar and ranged support.', [
    ...squad(.8, ['goblin', 'goblin', 'boar']),
    ...squad(14.8, ['goblin', 'goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 70, damage: 8 },
    goblinArcher: { hp: 40, damage: 5 },
    boar: { hp: 80, damage: 8 },
  } }),
  defineWave(5, 'Woodland skirmish', 'Two squads bring three fighters, two archers and a boar.', [
    ...squad(.8, ['goblin', 'goblin', 'goblinArcher']),
    ...squad(14.8, ['goblin', 'boar', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 76, damage: 9 },
    goblinArcher: { hp: 44, damage: 5 },
    boar: { hp: 84, damage: 9 },
  } }),
  defineWave(6, 'Boar trail', 'Two squads of three advance, each with a boar.', [
    ...squad(.8, ['goblin', 'boar', 'goblin']),
    ...squad(14.8, ['boar', 'goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 78, damage: 9 },
    goblinArcher: { hp: 46, damage: 5 },
    boar: { hp: 88, damage: 9 },
  } }),
  defineWave(7, 'Goblin veterans', 'Four veterans advance, followed by a squad of three.', [
    ...squad(.8, ['goblin', 'goblin', 'goblin', 'goblinArcher']),
    ...squad(14.8, ['goblin', 'goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 82, damage: 10 },
    goblinArcher: { hp: 48, damage: 6 },
  } }),
  defineWave(8, 'Iron tusks', 'Two squads of four advance, each with a boar and an archer.', [
    ...squad(.8, ['goblin', 'boar', 'goblin', 'goblinArcher']),
    ...squad(14.8, ['goblin', 'boar', 'goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 88, damage: 10 },
    goblinArcher: { hp: 52, damage: 6 },
    boar: { hp: 96, damage: 10 },
  } }),
  defineWave(9, 'The last horde', 'Three squads of three bring hardened fighters, boars and archers.', [
    ...squad(.8, ['goblin', 'goblin', 'boar'], -12),
    ...squad(14.8, ['goblin', 'goblinArcher', 'goblin'], 12),
    ...squad(28.8, ['goblin', 'goblinArcher', 'boar']),
  ], { stats: {
    goblin: { hp: 94, damage: 11 },
    goblinArcher: { hp: 56, damage: 7 },
    boar: { hp: 104, damage: 10 },
  } }),
  defineWave(10, 'The war chief', 'The chief enters with two goblin fighters and an archer; another fighter and archer follow.', [
    ...squad(.8, ['goblin', 'goblinChief', 'goblin', 'goblinArcher']),
    ...squad(14.8, ['goblin', 'goblinArcher']),
  ], { stats: {
    goblin: { hp: 94, damage: 11 },
    goblinArcher: { hp: 56, damage: 7 },
    goblinChief: { hp: 650, damage: 18 },
  } }),
]);

const REINFORCEMENT_TYPES = Object.freeze(['goblin', 'goblinArcher', 'goblin', 'boar'] as const);
const BOAR_TEMPLATE_HP = Object.freeze([80, 80, 80, 80, 84, 88, 92, 96, 104, 104]);
const BOAR_TEMPLATE_DAMAGE = Object.freeze([8, 8, 8, 8, 9, 9, 10, 10, 10, 10]);

function campaignPressure(roundNumber: number, waveInRound: number) {
  const step = roundNumber === 1 ? 0 : (roundNumber - 2) * 9 + waveInRound;
  return { step, hp: 1 + .01 * step, damage: 1 + .008 * step };
}

function buildLaterForestWave(template: WaveDefinition, roundNumber: number): WaveDefinition {
  const baseline = FOREST_WAVE_TEMPLATES[8];
  const pressure = campaignPressure(roundNumber, template.waveInRound);
  const stats = Object.fromEntries(baseline.spawns.map(spawn => [spawn.type, spawn]));
  const arrivals = [...new Set(baseline.spawns.map(spawn => spawn.at))];
  const cohorts = arrivals.map(at => baseline.spawns.filter(spawn => spawn.at === at).map(spawn => spawn.type));
  // Keep the proven ninth-wave lineup and cadence; vary its order instead of resetting to scouts.
  const spawns = cohorts.flatMap((_, index) => squad(.8 + 14 * index,
    cohorts[(index + template.waveInRound - 1) % cohorts.length]));
  const extraCount = Math.min(9, Math.floor(pressure.step / 12));
  for (let index = 0; index < extraCount; index += 4) {
    const types = Array.from({ length: Math.min(4, extraCount - index) }, (_, offset) =>
      REINFORCEMENT_TYPES[(index + offset) % REINFORCEMENT_TYPES.length]);
    spawns.push(...squad(42.8 + 14 * (index / 4), types));
  }
  return defineWave((roundNumber - 1) * WAVES_PER_ROUND + template.waveInRound,
    `Forest assault ${template.waveInRound}`,
    'Veteran fighters, archers and boars advance in squads. Their strength and reinforcements grow with campaign progress.',
    spawns.map(spawn => ({ ...spawn,
      hp: Math.round(stats[spawn.type].hp * pressure.hp),
      damage: Math.round(stats[spawn.type].damage * pressure.damage),
      reward: ENEMY_TYPES[spawn.type].reward,
    })));
}

function buildForestWave(template: WaveDefinition, roundNumber: number): WaveDefinition {
  if (roundNumber > 1 && !template.hasBoss) return buildLaterForestWave(template, roundNumber);
  const isMainBoss = template.waveInRound === WAVES_PER_ROUND && (roundNumber === 10 || roundNumber === 20);
  const stats = Object.fromEntries(template.spawns.map(spawn => [spawn.type, {
    hp: spawn.hp ?? ENEMY_TYPES[spawn.type].hp,
    damage: spawn.damage ?? ENEMY_TYPES[spawn.type].damage,
  }]));
  // New roles inherit this wave's baseline; later-round boars must not fall back to wave-one stats.
  stats.boar ??= { hp: BOAR_TEMPLATE_HP[template.waveInRound - 1], damage: BOAR_TEMPLATE_DAMAGE[template.waveInRound - 1] };
  const baseSpawns = isMainBoss
    ? [...squad(.8, ['goblin', 'ogre', 'goblin', 'goblinArcher']),
      ...squad(14.8, ['goblin', 'goblinArcher'])]
    : template.spawns;
  const spawns: SpawnSeed[] = [...baseSpawns];
  const extraCount = template.hasBoss
    ? Math.min(4, Math.floor((roundNumber - 1) / 4))
    : Math.floor((roundNumber - 1) / 2);
  const lastArrival = Math.max(...spawns.map(spawn => spawn.at));
  // Reinforcements are separate arrivals so no round exceeds the four-enemy spawn limit.
  for (let index = 0; index < extraCount; index += 4) {
    const types = Array.from({ length: Math.min(4, extraCount - index) }, (_, offset) =>
      REINFORCEMENT_TYPES[(index + offset) % REINFORCEMENT_TYPES.length]);
    spawns.push(...squad(lastArrival + 14 * (index / 4 + 1), types));
  }
  const pressure = campaignPressure(roundNumber, WAVES_PER_ROUND - 1);
  // Boss durability grows faster because ordinary waves gain more bodies each round.
  const bossHpMultiplier = 1 + .08 * (roundNumber - 1);
  const scaledSpawns = spawns.map(spawn => {
    const baseline = stats[spawn.type] ?? ENEMY_TYPES[spawn.type];
    return {
      ...spawn,
      hp: Math.round((spawn.hp ?? baseline.hp) * (ENEMY_TYPES[spawn.type].isBoss ? bossHpMultiplier : pressure.hp)),
      damage: Math.round((spawn.damage ?? baseline.damage) * pressure.damage),
      reward: spawn.reward ?? ENEMY_TYPES[spawn.type].reward,
    };
  });
  if (template.hasBoss) {
    const previousWave = roundNumber === 1 ? FOREST_WAVE_TEMPLATES[8]
      : buildLaterForestWave(FOREST_WAVE_TEMPLATES[8], roundNumber);
    const previousHp = previousWave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
    // Boss templates and the main-boss replacement each contain exactly one commander.
    const boss = scaledSpawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss)!;
    const escortHp = scaledSpawns.filter(spawn => spawn !== boss).reduce((sum, spawn) => sum + spawn.hp, 0);
    // Keep each finale above the preceding wave as ordinary squads gain bodies and strength.
    boss.hp = Math.max(boss.hp, Math.ceil(previousHp * (isMainBoss ? 1.5 : 1.25)) - escortHp);
  }
  const name = isMainBoss ? 'Ogre brute' : template.name;
  const description = isMainBoss
    ? 'The ogre advances with two goblin fighters and an archer; another fighter and archer follow.'
    : template.description;
  return defineWave((roundNumber - 1) * WAVES_PER_ROUND + template.waveInRound, name,
    description + (extraCount ? ' Reinforcements follow in groups of up to four.' : ''), scaledSpawns);
}

const FOREST_WAVES = Object.freeze(Array.from({ length: ROUNDS_PER_LEVEL }, (_, roundIndex) =>
  FOREST_WAVE_TEMPLATES.map(template => buildForestWave(template, roundIndex + 1))).flat());

const GRAVEYARD_ENEMIES: Readonly<Partial<Record<EnemyType, EnemyType>>> = Object.freeze({
  goblin: 'skeleton', goblinArcher: 'skeletonArcher', boar: 'ghoul',
  goblinChief: 'cryptSpider', ogre: 'cryptKing',
});
const GRAVEYARD_WAVE_DETAILS = Object.freeze([
  ['Skeleton scouts', 'Two skeletons arrive together, then a third follows.'],
  ['Splintered arrows', 'Two skeleton fighters and two skeleton archers enter together.'],
  ['Restless raiders', 'A squad of three advances, followed by two reinforcements.'],
  ['Graveyard advance', 'Two squads of three bring a ghoul and ranged support.'],
  ['Graveyard skirmish', 'Two squads bring three skeleton fighters, two skeleton archers and a ghoul.'],
  ['Ghoul trail', 'Two squads of three advance, each with a ghoul.'],
  ['Skeleton veterans', 'Four veterans advance, followed by a squad of three.'],
  ['Restless hunger', 'Two squads of four advance, each with a ghoul and a skeleton archer.'],
  ['The last dead', 'Three squads of three bring hardened skeletons, ghouls and archers.'],
  ['Crypt Spider', 'The crypt spider enters with two skeleton fighters and an archer; another fighter and archer follow.'],
]);

const UNCALIBRATED_WAVES = Object.freeze([
  ...FOREST_WAVES,
  ...FOREST_WAVES.map(wave => {
    const [name, description] = wave.roundNumber > 1 && !wave.hasBoss
      ? [`Graveyard assault ${wave.waveInRound}`, 'Veteran skeletons, archers and ghouls advance in squads. Their strength and reinforcements grow with campaign progress.']
      : wave.isFinalBossWave
      ? ['Crypt King', 'The Crypt King advances with two skeletons and an archer; another fighter and archer follow.']
      : GRAVEYARD_WAVE_DETAILS[wave.waveInRound - 1];
    // Each undead role inherits its counterpart's resolved stats and schedule, including bosses.
    const spawns = wave.spawns.map(spawn => {
      const original = ENEMY_TYPES[spawn.type];
      const type = GRAVEYARD_ENEMIES[spawn.type] ?? spawn.type;
      return {
        ...spawn, type,
        hp: (spawn.hp ?? original.hp) * LEVEL_2_STAT_MULTIPLIER,
        damage: (spawn.damage ?? original.damage) * LEVEL_2_STAT_MULTIPLIER,
        reward: (spawn.reward ?? original.reward) * LEVEL_2_GOLD_MULTIPLIER,
      };
    });
    const baseCount = FOREST_WAVE_TEMPLATES[wave.waveInRound - 1].total;
    return defineWave(WAVES_PER_LEVEL + wave.number, name,
      description + (wave.total > baseCount ? ' Reinforcements follow in groups of up to four.' : ''),
      spawns, { bossOnly: wave.bossOnly });
  }),
]);

// Keep the tested opening intact; both biomes continue from its last HP/damage tier.
function openingWave(wave: WaveDefinition): WaveDefinition {
  const number = wave.number;
  if (number > 30) {
    const spawns = campaignContinuationSpawns(number).map(spawn => ({ ...spawn, reward: ENEMY_TYPES[spawn.type].reward }));
    const boss = spawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss);
    const name = boss ? ENEMY_TYPES[boss.type].name : `${wave.levelNumber === 1 ? 'Forest' : 'Graveyard'} assault ${wave.waveInRound}`;
    return defineWave(number, name, spawns.some(spawn => spawn.type === 'goblinHealer')
      ? boss ? 'The commander enters with a healer and two fighters. Archers and reinforcements follow.'
        : 'A goblin healer joins the opening squad. Reinforcements arrive in groups of up to four.'
      : boss ? 'The commander and its guard advance in groups of up to four.'
        : 'Stronger squads advance. Their strength carries forward from the previous round.', spawns);
  }
  if (number > 10) {
    const spawns = openingContinuationSpawns(number).map(spawn => ({ ...spawn, reward: ENEMY_TYPES[spawn.type].reward }));
    return defineWave(number, number % 10 === 0 ? 'The war chief' : `Forest assault ${wave.waveInRound}`,
      number % 10 === 0 ? 'A stronger chief enters with a guard of fighters and archers.'
        : 'Two squads of four advance. Their strength carries on from the previous encounter.', spawns);
  }
  const changesByWave: Partial<Record<number, Partial<Record<EnemyType, readonly [number, number]>>>> = {
    4: { goblin: [66, 7], goblinArcher: [38, 4], boar: [70, 7] },
    5: { goblin: [70, 8], goblinArcher: [40, 4], boar: [76, 8] },
    6: { goblin: [72, 8], goblinArcher: [42, 5], boar: [84, 8] },
    8: { goblin: [84, 9], goblinArcher: [50, 6], boar: [92, 9] },
    10: { goblinChief: [450, 18] },
  };
  const changes = changesByWave[number];
  if (!changes) return wave;
  const sourceSpawns: readonly SpawnSeed[] = number === 4 ? [
    ...squad(.8, ['goblin', 'goblin', 'boar']),
    ...squad(14.8, ['goblin', 'goblinArcher']),
  ] : wave.spawns;
  const spawns = sourceSpawns
    // The first chief keeps his stats and opening guard; only the late melee escort is removed.
    .filter(spawn => number !== 10 || spawn.at !== 14.8 || spawn.type !== 'goblin')
    .map(spawn => {
    const [hp, damage] = changes[spawn.type] ?? [spawn.hp, spawn.damage];
    // Wave four overrides every spawned role; other waves already have resolved stats.
    return { ...spawn, hp: hp!, damage: damage!, reward: spawn.reward ?? ENEMY_TYPES[spawn.type].reward };
  });
  return defineWave(number, wave.name, number === 4
    ? 'Two fighters and a boar advance, followed by a fighter and an archer.'
    : number === 10 ? 'The chief enters with two goblin fighters and an archer; another archer follows.'
      : wave.description, spawns);
}

function withHeroPressure(wave: WaveDefinition): WaveDefinition {
  const spawns = wave.spawns.map(spawn => {
    return { ...spawn, hp: Math.round(spawn.hp * 1.1),
      // Fractional damage avoids turning a small buff into +25% on a 4-damage archer.
      damage: Math.round(spawn.damage * 105) / 100 };
  });
  // Preserve the campaign's exact HP curve despite rounding each individual enemy.
  const health = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
  spawns[0].hp += Math.round(health * 1.1) - spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
  return defineWave(wave.number, wave.name, wave.description, spawns, { bossOnly: wave.bossOnly });
}

function withLevelTwoPressure(wave: WaveDefinition): WaveDefinition {
  if (wave.levelNumber !== 2) return wave;
  // Apply one modest increase to the existing second-level encounters without
  // changing their role shares, reinforcements or the first level's balance.
  const spawns = wave.spawns.map(spawn => ({ ...spawn,
    hp: Math.round(spawn.hp * 1.15), damage: Math.round(spawn.damage * 115) / 100 }));
  const health = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
  spawns[0].hp += Math.round(health * 1.15) - spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
  return defineWave(wave.number, wave.name, wave.description, spawns, { bossOnly: wave.bossOnly });
}

function withPlagueAlchemist(wave: WaveDefinition): WaveDefinition {
  if (wave.levelNumber !== 2) return wave;
  const archer = wave.spawns.find(spawn => spawn.type === 'skeletonArcher')!;
  const firstArrival = wave.spawns[0].at;
  const opening = wave.spawns.filter(spawn => spawn.at === firstArrival);
  const displaced = opening.length >= 4 ? opening.find(spawn => spawn.type === 'skeletonArcher')! : null;
  // Add one specialist without removing archers or redistributing anybody's stats.
  // Its HP follows the existing encounter curve, including boss waves, so this
  // extra role cannot introduce a new health reset at a round boundary.
  const health = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
  const alchemist: EnemySpawn = { type: 'plagueAlchemist', at: firstArrival, x: 195, y: 66,
    hp: Math.round(health * .06), damage: archer.damage, reward: ENEMY_TYPES.plagueAlchemist.reward };
  const spawns = wave.spawns.map(spawn => spawn === displaced ? { ...spawn, at: firstArrival + .8 } : spawn);
  spawns.push(alchemist);
  spawns.sort((a, b) => a.at - b.at);
  return defineWave(wave.number, wave.name, wave.hasBoss
    ? 'The commander enters with a plague alchemist. Archers and reinforcements follow.'
    : 'A plague alchemist poisons defenders from the opening squad. Reinforcements follow.', spawns,
  { bossOnly: wave.bossOnly });
}

export const WAVE_DEFINITIONS = Object.freeze(UNCALIBRATED_WAVES.map(openingWave).map(withHeroPressure).map(withLevelTwoPressure).map(withPlagueAlchemist));

export function getLevelWaves(levelNumber: WaveNumberInput): WaveDefinition[] {
  return WAVE_DEFINITIONS.filter(wave => wave.levelNumber === Number(levelNumber));
}

export function getRoundWaves(levelNumber: WaveNumberInput, roundNumber: WaveNumberInput): WaveDefinition[] {
  return getLevelWaves(levelNumber).filter(wave => wave.roundNumber === Number(roundNumber));
}

export function getWaveDefinition(number: WaveNumberInput = 1): WaveDefinition {
  const requested = Number.isFinite(Number(number)) ? Math.floor(Number(number)) : 1;
  return WAVE_DEFINITIONS[Math.max(1, Math.min(WAVE_DEFINITIONS.length, requested)) - 1];
}
