import { createBattle } from './combat.ts';
import type { Actor, Battle, FormationUnit } from './combat-types.ts';
import { createHero, heroXpForLevel } from './hero.ts';
import type { UnitType } from './units.ts';
import { ENEMY_TYPES } from './waves.ts';
import type { EnemySpawn, EnemyType, WaveDefinition } from './waves.ts';

export type CombatStressScenarioId = 'opening' | 'late-roster' | 'mixed-skills';
export interface CombatStressScenario {
  readonly id: CombatStressScenarioId;
  readonly label: string;
  readonly kind: 'campaign-fixture' | 'synthetic-stress';
  readonly description: string;
  readonly waveNumber: number;
  readonly formation: readonly Readonly<FormationUnit>[];
}

export const COMBAT_STRESS_STEP_SECONDS = 1 / 60;
export const COMBAT_STRESS_DEFAULT_SECONDS = 30;
export const COMBAT_STRESS_MAX_SECONDS = 60;

function roster(rows: readonly (readonly UnitType[])[], level: number): readonly Readonly<FormationUnit>[] {
  return Object.freeze(rows.flatMap((row, rowIndex) => row.map((type, col) => Object.freeze({
    id: rowIndex * 5 + col + 1, type, level, row: rowIndex, col,
  }))));
}

const denseRows: readonly (readonly UnitType[])[] = [
  ['swordsman', 'lancer', 'swordsman', 'lancer', 'swordsman'],
  ['archer', 'healer', 'healer', 'healer', 'archer'],
  ['elfArcher', 'archer', 'elfArcher', 'archer', 'elfArcher'],
];

// These fixed lineups are workload fixtures, never recommendations for campaign balance.
export const COMBAT_STRESS_SCENARIOS: readonly CombatStressScenario[] = Object.freeze([
  Object.freeze({ id: 'opening', label: 'Opening wave', kind: 'campaign-fixture', waveNumber: 1,
    description: 'Catalogue wave 1, three level-1 recruits in the initial column and an unskilled hero.',
    formation: Object.freeze([
      Object.freeze({ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }),
      Object.freeze({ id: 2, type: 'healer', level: 1, col: 2, row: 1 }),
      Object.freeze({ id: 3, type: 'archer', level: 1, col: 2, row: 2 }),
    ] satisfies FormationUnit[]),
  } as const),
  Object.freeze({ id: 'late-roster', label: 'Expanded army', kind: 'campaign-fixture', waveNumber: 39,
    description: 'Catalogue wave 39, fifteen level-8 fighters, a level-20 mixed-skill hero and upgraded buildings.',
    formation: roster(denseRows, 8),
  } as const),
  Object.freeze({ id: 'mixed-skills', label: 'Synthetic mixed skills', kind: 'synthetic-stress', waveNumber: 39,
    description: 'Synthetic 36-enemy workload with poison, ranged attacks and healers against fifteen level-4 fighters. Not a normal campaign wave or balance claim.',
    formation: roster(denseRows, 4),
  } as const),
]);

export function getCombatStressScenario(id: unknown): CombatStressScenario | undefined {
  return COMBAT_STRESS_SCENARIOS.find(scenario => scenario.id === id);
}

function mixedHero() {
  // Nineteen legal points: the complete hammer branch, six healing points and aura.
  return createHero({ xp: heroXpForLevel(20), talentVersion: 2, talents: {
    heal_unlock: 1, heal_power: 3, heal_haste: 1, heal_shield: 1, aura_unlock: 1,
    hammer_unlock: 1, hammer_power: 3, hammer_haste: 3, hammer_splash: 2,
    holy_strike: 2, heavenly_hammer: 1,
  } });
}

function copyWave(wave: WaveDefinition): WaveDefinition {
  return Object.freeze({ ...wave,
    spawns: Object.freeze(wave.spawns.map(spawn => Object.freeze({ ...spawn }))),
    enemies: Object.freeze(wave.enemies.map(enemy => Object.freeze({ ...enemy }))),
  });
}

function syntheticWave(base: WaveDefinition): WaveDefinition {
  const group: readonly EnemyType[] = ['goblin', 'goblinArcher', 'plagueAlchemist',
    'goblinHealer', 'boar', 'goblin', 'goblinArcher', 'plagueAlchemist', 'goblin'];
  const spawns: Readonly<EnemySpawn>[] = Array.from({ length: 36 }, (_, index) => {
    const type = group[index % group.length];
    const support = type === 'goblinHealer';
    const ranged = type === 'goblinArcher' || type === 'plagueAlchemist';
    return Object.freeze({ type, at: Math.floor(index / group.length) * 3,
      x: 55 + (index % 6) * 55, y: support ? 175 : ranged ? 200 : 230,
      hp: support ? 450 : 350, damage: type === 'plagueAlchemist' ? 16 : ranged ? 3 : 5,
      reward: ENEMY_TYPES[type].reward, ...(support ? { heal: 12 } : {}),
    });
  });
  const counts = new Map<EnemyType, number>();
  for (const spawn of spawns) counts.set(spawn.type, (counts.get(spawn.type) ?? 0) + 1);
  return Object.freeze({ ...base, name: 'Synthetic mixed skills',
    description: 'Stress fixture only: custom positions, arrival times, health and damage.',
    hasBoss: false, bossType: null, bossOnly: false, isFinalBossWave: false,
    spawns: Object.freeze(spawns), total: spawns.length,
    reward: spawns.reduce((total, spawn) => total + (spawn.reward ?? 0), 0),
    enemies: Object.freeze([...counts].map(([type, count]) => Object.freeze({
      type, name: ENEMY_TYPES[type].name, count,
    }))),
  });
}

export function createCombatStressBattle(id: CombatStressScenarioId): Battle {
  const scenario = getCombatStressScenario(id);
  if (!scenario) throw new RangeError(`Unknown combat stress scenario: ${String(id)}`);
  const expanded = id !== 'opening';
  const battle = createBattle(scenario.formation, scenario.waveNumber, expanded ? mixedHero() : undefined,
    expanded ? { health: 15, attack: 15, attackSpeed: 15 } : undefined,
    expanded ? { health: 10, tower: 3 } : undefined);
  // Keep even immutable wave objects private to this run; catalogue data is never edited.
  battle.wave = id === 'mixed-skills' ? syntheticWave(battle.wave) : copyWave(battle.wave);
  battle.total = battle.wave.total;
  battle.nextSpawn = battle.wave.spawns[0].at;
  battle.enrageAt = Math.max(75, battle.wave.spawns.at(-1)!.at + 45);
  return battle;
}

function snapshotActor(actor: Actor) {
  const { hitTime, deathTime, ...state } = actor;
  return state;
}

export function combatStressSnapshot(battle: Battle) {
  const { effects, nextEffectId, visualEffectLimit, stepRemainder, king, allies, enemies, hero, castle,
    ...state } = battle;
  // A detached full gameplay snapshot permits exact equality checks. The display clocks,
  // disposable cosmetics and fractional frame accumulator do not affect this fixed-step run.
  return structuredClone({ ...state, allies: allies.map(snapshotActor), enemies: enemies.map(snapshotActor),
    hero: snapshotActor(hero), castle: snapshotActor(castle) });
}

export function combatStressFingerprint(battle: Battle): string {
  // Diagnostic FNV-1a only, never a security token or substitute for exact comparison.
  const snapshot = JSON.stringify(combatStressSnapshot(battle));
  let hash = 0x811c9dc5;
  for (let index = 0; index < snapshot.length; index++) {
    hash = Math.imul(hash ^ snapshot.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
