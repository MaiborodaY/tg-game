import type { BattleTimeline, CombatWinner, Owner } from "../game";

export type BattlePlaybackSpeed = 1 | 2;

export interface BattlePlaybackCallbacks {
  onFinished?: () => void;
  onCastleHpChanged?: (owner: Owner, hp: number) => void;
}

export interface FinalBattlePresentation {
  winner: CombatWinner;
  castles: Record<Owner, number>;
  units: ReadonlyMap<string, { hp: number; visible: boolean }>;
}

type CompletionState = "active" | "claimed" | "completed" | "cancelled";

/** Keeps presentation callbacks safe when natural completion and skip race each other. */
export class BattlePlaybackCompletion {
  private state: CompletionState = "active";
  private readonly callbacks: BattlePlaybackCallbacks;

  constructor(callbacks: BattlePlaybackCallbacks) {
    this.callbacks = callbacks;
  }

  isActive(): boolean {
    return this.state === "active";
  }

  emitCastleHp(owner: Owner, hp: number): void {
    if (this.state === "active" || this.state === "claimed") {
      this.callbacks.onCastleHpChanged?.(owner, hp);
    }
  }

  claim(): boolean {
    if (this.state !== "active") {
      return false;
    }

    this.state = "claimed";
    return true;
  }

  finishClaimed(): void {
    if (this.state !== "claimed") {
      return;
    }

    this.state = "completed";
    this.callbacks.onFinished?.();
  }

  finish(): boolean {
    if (!this.claim()) {
      return false;
    }

    this.finishClaimed();
    return true;
  }

  cancel(): void {
    if (this.state === "active") {
      this.state = "cancelled";
    }
  }
}

/** Tracks timeline time independently from wall-clock time across live speed changes. */
export class BattlePlaybackClock {
  private elapsedMs = 0;
  private lastWallClockMs = 0;
  private running = false;
  private speed: BattlePlaybackSpeed;

  constructor(speed: BattlePlaybackSpeed) {
    this.speed = speed;
  }

  start(wallClockMs: number): void {
    this.elapsedMs = 0;
    this.lastWallClockMs = wallClockMs;
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  setSpeed(speed: BattlePlaybackSpeed, wallClockMs: number): void {
    this.sync(wallClockMs);
    this.speed = speed;
  }

  getDelayUntil(targetElapsedMs: number, wallClockMs: number): number {
    this.sync(wallClockMs);
    return Math.max(0, targetElapsedMs - this.elapsedMs);
  }

  private sync(wallClockMs: number): void {
    if (!this.running) {
      return;
    }

    const wallClockDelta = Math.max(0, wallClockMs - this.lastWallClockMs);
    this.elapsedMs += wallClockDelta * this.speed;
    this.lastWallClockMs = wallClockMs;
  }
}

export function getFinalBattlePresentation(timeline: BattleTimeline): FinalBattlePresentation {
  const playerCastle = timeline.castles.find((castle) => castle.owner === "player");
  const enemyCastle = timeline.castles.find((castle) => castle.owner === "enemy");

  if (!playerCastle || !enemyCastle) {
    throw new Error("Battle timeline must contain both castles");
  }

  return {
    winner: timeline.winner,
    castles: {
      player: playerCastle.finalHp,
      enemy: enemyCastle.finalHp,
    },
    units: new Map(
      timeline.units.map((unit) => [
        unit.unitId,
        {
          hp: Math.max(0, unit.finalHp),
          visible: unit.finalHp > 0,
        },
      ]),
    ),
  };
}

export function completeSkippedBattle(
  completion: BattlePlaybackCompletion,
  timeline: BattleTimeline,
  applyFinalPresentation: (presentation: FinalBattlePresentation) => void,
): boolean {
  if (!completion.isActive()) {
    return false;
  }

  const presentation = getFinalBattlePresentation(timeline);
  if (!completion.claim()) {
    return false;
  }

  try {
    applyFinalPresentation(presentation);
    completion.emitCastleHp("player", presentation.castles.player);
    completion.emitCastleHp("enemy", presentation.castles.enemy);
  } finally {
    completion.finishClaimed();
  }

  return true;
}
