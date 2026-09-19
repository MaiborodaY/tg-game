import { createBattleForWave } from './combat.ts';
import type { ActorBase, Battle } from './combat-types.ts';
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
  readonly waves: readonly WaveDefinition[];
  readonly unlockedCells: readonly string[];
  units: ArmyUnit[];
  selectedId: number | null;
  battle: Battle | null;
}

/** Opening guards use existing campaign stats without changing campaign balance. */
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

export function getDungeonWaves(level: DungeonLevel): readonly WaveDefinition[] {
  const opening = getDungeonOpeningWave(level);
  // Only Cave I's full run is implemented; the other tiers keep their opening preview.
  if (level.tier !== 1) return Object.freeze([opening]);
  const boss = getWaveDefinition(level.unlockRound * WAVES_PER_ROUND).spawns.find(spawn => spawn.type === 'goblinChief')!;
  return Object.freeze([opening,
    Object.freeze({ ...opening, number: 2, waveInRound: 2, name: 'Cave reinforcements' }),
    Object.freeze({ ...opening, number: 3, waveInRound: 3, name: 'Goblin Chief',
      description: 'Defeat the chief to clear the cave.', bossOnly: true, hasBoss: true,
      bossType: 'goblinChief' as const, isFinalBossWave: true, total: 1,
      enemies: Object.freeze([{ type: 'goblinChief' as const, name: ENEMY_TYPES.goblinChief.name, count: 1 }]),
      spawns: Object.freeze([Object.freeze({ ...boss, at: .8, x: 205, y: 85, reward: 0 })]) }),
  ]);
}

export function getNextDungeonWave(run: DungeonRun): WaveDefinition | null {
  if (!run.battle) return run.waves[0];
  return run.battle.phase === 'victory' ? run.waves[run.battle.waveNumber] ?? null : null;
}

export function getDungeonExitState(run: DungeonRun): 'blocked' | 'confirm' | 'leave' {
  if (run.battle?.phase === 'running') return 'blocked';
  return run.battle?.phase === 'victory' && getNextDungeonWave(run) ? 'confirm' : 'leave';
}

export function createDungeonRun(level: DungeonLevel, progress: DungeonProgress,
  units: readonly ArmyUnit[], unlockedCells: readonly string[]): DungeonRun | null {
  if (!isDungeonLevelUnlocked(level, progress)) return null;
  // Formation, damage and casualties are local to the run, never the campaign/save.
  const waves = getDungeonWaves(level);
  return { level, waves, get wave() { return this.battle?.wave ?? waves[0]; }, units: units.map(unit => ({ ...unit })),
    unlockedCells: [...unlockedCells], selectedId: null, battle: null };
}

export function startDungeonBattle(run: DungeonRun, hero: HeroState, forge: Readonly<ForgeState>): boolean {
  const next = getNextDungeonWave(run);
  if (!next || !run.units.length) return false;
  run.selectedId = null;
  if (!run.battle) {
    run.battle = createBattleForWave(run.units, next, hero, forge);
    return true;
  }
  // Keep the same actors and stat snapshots. A new wave must not resurrect,
  // refill HP, reapply upgrades or replenish once-per-run hero abilities.
  const battle = run.battle;
  battle.allies = battle.allies.filter(ally => ally.hp > 0);
  for (const actor of [...battle.allies, battle.hero, battle.castle]) resetApproach(actor);
  battle.hero.pendingAbility = null;
  Object.assign(battle, { phase: 'running', wave: next, waveNumber: next.number,
    elapsed: 0, stepRemainder: 0, enemies: [], total: next.total, spawned: 0, kills: 0, reward: 0,
    nextSpawn: next.spawns[0].at, enraged: false, enrageAt: Math.max(75, next.spawns.at(-1)!.at + 45),
    effects: [], projectiles: [] } satisfies Partial<Battle>);
  return true;
}

function resetApproach(actor: ActorBase): void {
  actor.x = actor.homeX; actor.y = actor.homeY;
  actor.targetX = actor.x; actor.targetY = actor.y;
  actor.action = actor.hp > 0 ? 'idle' : 'dead';
  actor.actionTime = 0; actor.actionDuration = 0;
  actor.targetId = null; actor.focusId = null; actor.followId = null;
  actor.following = false; actor.closingRange = false; actor.approach = null;
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
