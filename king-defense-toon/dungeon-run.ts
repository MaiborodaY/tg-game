import { createBattleForWave } from './combat.ts';
import type { Battle } from './combat-types.ts';
import { isDungeonLevelUnlocked } from './dungeons.ts';
import type { DungeonLevel, DungeonProgress } from './dungeons.ts';
import type { ArmyUnit } from './unit-merging.ts';
import type { HeroState } from './hero.ts';
import type { ForgeState } from './forge.ts';
import { ENEMY_TYPES, getWaveDefinition, WAVES_PER_ROUND } from './waves.ts';
import type { EnemyType, WaveDefinition } from './waves.ts';
import { getUnitAtCell, planFormationMove } from './unit-footprint.ts';

export interface DungeonRun {
  readonly level: DungeonLevel;
  readonly wave: WaveDefinition;
  readonly unlockedCells: readonly string[];
  units: ArmyUnit[];
  selectedId: number | null;
  battle: Battle | null;
}

/** One opening encounter for the MVP; full-run bosses/reward settlement come later. */
export function getDungeonOpeningWave(level: DungeonLevel): WaveDefinition {
  const reference = getWaveDefinition(level.unlockRound * WAVES_PER_ROUND + 1);
  const melee = reference.spawns.find(spawn => spawn.type === 'goblin');
  const positions: readonly { type: EnemyType; x: number; y: number }[] = [
    { type: 'goblinHealer', x: 185, y: 64 },
    { type: 'goblin', x: 145, y: 105 },
    { type: 'boar', x: 225, y: 105 },
    { type: 'goblinArcher', x: 265, y: 64 },
  ];
  const spawns = positions.map(position => {
    const base = ENEMY_TYPES[position.type];
    const role = reference.spawns.find(spawn => spawn.type === position.type);
    return Object.freeze({ ...position, at: .8,
      hp: role?.hp ?? Math.round(base.hp * (melee ? melee.hp / ENEMY_TYPES.goblin.hp : 1)),
      damage: role?.damage ?? Math.round(base.damage * (melee ? melee.damage / ENEMY_TYPES.goblin.damage : 1)),
      heal: role?.heal ?? base.heal ?? 0, reward: 0 });
  });
  return Object.freeze({ number: 1, levelNumber: 1, roundNumber: level.unlockRound + 1, waveInRound: 1,
    levelName: 'Goblin Cave', name: 'Cave entrance', description: 'Defeat the four cave guards.',
    bossOnly: false, hasBoss: false, bossType: null, isFinalBossWave: false,
    enemies: Object.freeze(positions.map(({ type }) => Object.freeze({ type, name: ENEMY_TYPES[type].name, count: 1 }))),
    spawns: Object.freeze(spawns), total: spawns.length, reward: 0 });
}

export function createDungeonRun(level: DungeonLevel, progress: DungeonProgress,
  units: readonly ArmyUnit[], unlockedCells: readonly string[]): DungeonRun | null {
  if (!isDungeonLevelUnlocked(level, progress)) return null;
  // Formation, damage and casualties are local to the run, never the campaign/save.
  return { level, wave: getDungeonOpeningWave(level), units: units.map(unit => ({ ...unit })),
    unlockedCells: [...unlockedCells], selectedId: null, battle: null };
}

export function startDungeonBattle(run: DungeonRun, hero: HeroState, forge: Readonly<ForgeState>): boolean {
  if (run.battle || !run.units.length) return false;
  run.selectedId = null;
  run.battle = createBattleForWave(run.units, run.wave, hero, forge);
  return true;
}

export function selectDungeonCell(run: DungeonRun, col: number, row: number): boolean {
  if (run.battle) return false;
  const target = getUnitAtCell(run.units, col, row);
  if (run.selectedId !== null && target?.id !== run.selectedId) {
    const plan = planFormationMove(run.units, run.selectedId, target?.col ?? col, target?.row ?? row, run.unlockedCells);
    if (!plan.ok) return false;
    run.units = plan.units;
    run.selectedId = null;
  } else run.selectedId = run.selectedId === target?.id ? null : target?.id ?? null;
  return true;
}
