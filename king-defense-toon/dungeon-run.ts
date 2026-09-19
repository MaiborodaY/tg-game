import { createBattleForWave } from './combat.ts';
import type { ActorBase, Battle } from './combat-types.ts';
import { isDungeonLevelUnlocked } from './dungeons.ts';
import type { DungeonLevel, DungeonProgress, DungeonReward } from './dungeons.ts';
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
  stage: 'preparation' | 'combat' | 'wave-cleared' | 'complete' | 'defeat';
  waveIndex: number;
  reward: DungeonReward | null;
}

/** Cave tuning is applied to copies; campaign waves keep their existing balance. */
export function getDungeonOpeningWave(level: DungeonLevel): WaveDefinition {
  const reference = getWaveDefinition(level.unlockRound * WAVES_PER_ROUND + 1);
  const melee = reference.spawns.find(spawn => spawn.type === 'goblin');
  const positions: readonly { type: EnemyType; x: number; y: number }[] = [
    { type: 'goblinHealer', x: 185, y: 64 },
    { type: 'goblin', x: 145, y: 105 },
    { type: 'boar', x: 225, y: 105 },
    { type: 'goblinArcher', x: 265, y: 64 },
  ];
  const strength = level.tier === 1 ? 1.15 : 1;
  const spawns = positions.map(position => {
    const base = ENEMY_TYPES[position.type];
    const role = reference.spawns.find(spawn => spawn.type === position.type);
    return Object.freeze({ ...position, at: .8,
      hp: Math.round((role?.hp ?? Math.round(base.hp * (melee ? melee.hp / ENEMY_TYPES.goblin.hp : 1))) * strength),
      damage: (role?.damage ?? Math.round(base.damage * (melee ? melee.damage / ENEMY_TYPES.goblin.damage : 1))) * strength,
      heal: (role?.heal ?? base.heal ?? 0) * strength, reward: 0 });
  });
  return Object.freeze({ number: 1, levelNumber: 1, roundNumber: level.unlockRound + 1, waveInRound: 1,
    levelName: 'Goblin Cave', name: 'Cave entrance', description: 'Defeat the four cave guards.',
    bossOnly: false, hasBoss: false, bossType: null, isFinalBossWave: false,
    enemies: Object.freeze(positions.map(({ type }) => Object.freeze({ type, name: ENEMY_TYPES[type].name, count: 1 }))),
    spawns: Object.freeze(spawns), total: spawns.length, reward: 0 });
}

function withGuardGroups(wave: WaveDefinition, groups: number): WaveDefinition {
  return Object.freeze({ ...wave, total: wave.total * groups,
    description: `${groups} groups of four guards, 12 seconds apart.`,
    enemies: Object.freeze(wave.enemies.map(enemy => Object.freeze({ ...enemy, count: groups }))),
    spawns: Object.freeze(Array.from({ length: groups }, (_, group) => wave.spawns.map(spawn =>
      Object.freeze({ ...spawn, at: spawn.at + group * 12 }))).flat()) });
}

export function getDungeonWaves(level: DungeonLevel): readonly WaveDefinition[] {
  const opening = getDungeonOpeningWave(level);
  // Only Cave I's full run is implemented; the other tiers keep their opening preview.
  if (level.tier !== 1) return Object.freeze([opening]);
  const boss = getWaveDefinition(level.unlockRound * WAVES_PER_ROUND).spawns.find(spawn => spawn.type === 'goblinChief')!;
  return Object.freeze([withGuardGroups(opening, 2),
    withGuardGroups({ ...opening, number: 2, waveInRound: 2, name: 'Cave reinforcements' }, 3),
    Object.freeze({ ...opening, number: 3, waveInRound: 3, name: 'Goblin Chief',
      description: 'Defeat the chief to clear the cave.', bossOnly: true, hasBoss: true,
      bossType: 'goblinChief' as const, isFinalBossWave: true, total: 1,
      enemies: Object.freeze([{ type: 'goblinChief' as const, name: ENEMY_TYPES.goblinChief.name, count: 1 }]),
      spawns: Object.freeze([Object.freeze({ ...boss, hp: Math.round(boss.hp * 1.3), damage: boss.damage * 1.3,
        at: .8, x: 205, y: 85, reward: 0 })]) }),
  ]);
}

export function getNextDungeonWave(run: DungeonRun): WaveDefinition | null {
  if (run.stage === 'preparation') return run.wave;
  return run.stage === 'wave-cleared' ? run.waves[run.waveIndex + 1] ?? null : null;
}

export function getDungeonExitState(run: DungeonRun): 'blocked' | 'confirm' | 'leave' {
  if (run.stage === 'combat') return 'blocked';
  return run.stage === 'wave-cleared' || run.stage === 'preparation' && run.waveIndex > 0 ? 'confirm' : 'leave';
}

export function createDungeonRun(level: DungeonLevel, progress: DungeonProgress,
  units: readonly ArmyUnit[], unlockedCells: readonly string[]): DungeonRun | null {
  if (!isDungeonLevelUnlocked(level, progress)) return null;
  // Formation, damage and casualties are local to the run, never the campaign/save.
  const waves = getDungeonWaves(level);
  return { level, waves, get wave() { return waves[this.waveIndex]; }, units: units.map(unit => ({ ...unit })),
    unlockedCells: [...unlockedCells], selectedId: null, battle: null, stage: 'preparation', waveIndex: 0, reward: null };
}

export function startDungeonBattle(run: DungeonRun, hero: HeroState, forge: Readonly<ForgeState>): boolean {
  const next = getNextDungeonWave(run);
  if (run.stage !== 'preparation' || !next || !run.units.length) return false;
  run.selectedId = null;
  if (!run.battle) {
    run.battle = createBattleForWave(run.units, next, hero, forge);
  } else {
    run.battle.phase = 'running';
  }
  run.stage = 'combat';
  return true;
}

/** A result is recorded once, before UI actions or reward settlement can advance it. */
export function finishDungeonWave(run: DungeonRun): boolean {
  const battle = run.battle;
  if (run.stage !== 'combat' || !battle || battle.phase === 'running') return false;
  if (battle.phase === 'defeat') run.stage = 'defeat';
  else {
    if (battle.kills !== battle.total || battle.waveNumber !== run.wave.number) return false;
    run.stage = run.waveIndex === run.waves.length - 1 ? 'complete' : 'wave-cleared';
  }
  return true;
}

export function prepareNextDungeonWave(run: DungeonRun): boolean {
  const next = getNextDungeonWave(run);
  if (run.stage !== 'wave-cleared' || !run.battle || !next) return false;
  // Keep the same actors and stat snapshots. A new wave must not resurrect,
  // refill HP, reapply upgrades or replenish once-per-run hero abilities.
  const battle = run.battle;
  battle.allies = battle.allies.filter(ally => ally.hp > 0);
  for (const actor of [...battle.allies, battle.hero, battle.castle]) resetApproach(actor);
  battle.hero.pendingAbility = null;
  // Keep combat stopped until the separate Start action. Preparation cannot heal
  // or tick cooldowns just because a render frame runs with this same snapshot.
  Object.assign(battle, { phase: 'victory', wave: next, waveNumber: next.number,
    elapsed: 0, stepRemainder: 0, enemies: [], total: next.total, spawned: 0, kills: 0, reward: 0,
    nextSpawn: next.spawns[0].at, enraged: false, enrageAt: Math.max(75, next.spawns.at(-1)!.at + 45),
    effects: [], projectiles: [] } satisfies Partial<Battle>);
  run.waveIndex += 1;
  run.stage = 'preparation';
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
