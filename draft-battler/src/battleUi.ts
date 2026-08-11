import { MAX_RUN_ROUNDS, type CombatWinner, type RoundRecord } from "./game/types";

export type BattlePlaybackSpeed = 1 | 2;

export interface BattleUiStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface GameHudSnapshot {
  playerHp: number;
  enemyHp: number;
  round: number;
  maxRounds: number;
}

export interface RoundSummarySnapshot {
  winner: CombatWinner;
  playerHpAfter: number;
  enemyHpAfter: number;
  playerHpLoss: number;
  enemyHpLoss: number;
  actions: number;
}

export const BATTLE_PLAYBACK_SPEED_STORAGE_KEY = "draft-battler:battle-speed:v1";

export function loadBattlePlaybackSpeed(storage: BattleUiStorage | undefined): BattlePlaybackSpeed {
  try {
    return storage?.getItem(BATTLE_PLAYBACK_SPEED_STORAGE_KEY) === "2" ? 2 : 1;
  } catch {
    return 1;
  }
}

export function saveBattlePlaybackSpeed(
  storage: BattleUiStorage | undefined,
  speed: BattlePlaybackSpeed,
): boolean {
  try {
    storage?.setItem(BATTLE_PLAYBACK_SPEED_STORAGE_KEY, String(speed));
    return storage !== undefined;
  } catch {
    return false;
  }
}

export function createGameHudSnapshot(
  playerHp: number,
  enemyHp: number,
  round: number,
): GameHudSnapshot {
  return {
    playerHp: Math.max(0, Math.trunc(playerHp)),
    enemyHp: Math.max(0, Math.trunc(enemyHp)),
    round: Math.min(MAX_RUN_ROUNDS, Math.max(1, Math.trunc(round))),
    maxRounds: MAX_RUN_ROUNDS,
  };
}

export function createRoundSummarySnapshot(record: RoundRecord): RoundSummarySnapshot {
  return {
    winner: record.combatResult.winner,
    playerHpAfter: record.playerHpAfter,
    enemyHpAfter: record.enemyHpAfter,
    playerHpLoss: Math.max(0, record.playerHpBefore - record.playerHpAfter),
    enemyHpLoss: Math.max(0, record.enemyHpBefore - record.enemyHpAfter),
    actions: record.combatResult.actions,
  };
}
