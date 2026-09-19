import { WAVES_PER_ROUND } from './waves.ts';

export interface DungeonReward { readonly gold: number; readonly slaves: number }

export interface DungeonLevel {
  readonly id: 'goblin-cave-1' | 'goblin-cave-2' | 'goblin-cave-3';
  readonly tier: 1 | 2 | 3;
  readonly numeral: 'I' | 'II' | 'III';
  readonly boss: string;
  /** A null boss keeps an unfinished tier in opening-preview mode. */
  readonly runBoss: 'goblinChief' | 'goblinBombardier' | null;
  readonly unlockRound: number;
  readonly completionReward: DungeonReward;
}

// Completed tiers share the same run flow; Cave III still previews its opening.
export const GOBLIN_CAVE_LEVELS: readonly DungeonLevel[] = Object.freeze([
  { id: 'goblin-cave-1', tier: 1, numeral: 'I', boss: 'Goblin Chief', runBoss: 'goblinChief', unlockRound: 5,
    completionReward: { gold: 150, slaves: 3 } },
  { id: 'goblin-cave-2', tier: 2, numeral: 'II', boss: 'Bombardier', runBoss: 'goblinBombardier', unlockRound: 10,
    completionReward: { gold: 300, slaves: 5 } },
  { id: 'goblin-cave-3', tier: 3, numeral: 'III', boss: 'Goblin King', runBoss: null, unlockRound: 15,
    completionReward: { gold: 500, slaves: 8 } },
]);

export interface DungeonProgress {
  readonly clearedWaves: number;
  readonly firstClears: readonly number[];
}

export function isDungeonLevelUnlocked(level: DungeonLevel, progress: DungeonProgress): boolean {
  const milestone = level.unlockRound * WAVES_PER_ROUND;
  // The high-water clear survives defeat/retreat and campaign replay. clearedWaves
  // also supports older saves that predate individual first-clear receipts.
  return progress.clearedWaves >= milestone || progress.firstClears.some(wave => wave >= milestone);
}

export function getDungeonLevel(id: string): DungeonLevel | undefined {
  return GOBLIN_CAVE_LEVELS.find(level => level.id === id);
}

export type DungeonClearId = DungeonLevel['id'];

/** Reject damaged receipts instead of silently restoring eligibility for a full reward. */
export function restoreDungeonClears(value: unknown): DungeonClearId[] {
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !getDungeonLevel(id)?.runBoss)
    || new Set(value).size !== value.length) throw new Error('Invalid saved dungeon clears');
  return [...value] as DungeonClearId[];
}

export function getDungeonReward(level: DungeonLevel, clears: readonly DungeonClearId[]): DungeonReward {
  const divisor = clears.includes(level.id) ? 3 : 1;
  // Both resources are indivisible; repeat prizes round down to whole units.
  return { gold: Math.floor(level.completionReward.gold / divisor),
    slaves: Math.floor(level.completionReward.slaves / divisor) };
}
