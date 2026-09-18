import { BATTLE_SPEEDS, battleFrameDelta, nextBattleSpeed } from '../../battle-speed.ts';
import type { BattleSpeed } from '../../battle-speed.ts';
import { createFrameRateMeter } from '../../fps.ts';
import type { FrameRateMeter } from '../../fps.ts';
import { createFramePacer } from '../../frame-pacer.ts';
import type { FramePacer } from '../../frame-pacer.ts';
import { FIELD, HERO_START, ROYAL_ROUTE, WALKABLE_AREAS, positionForCell } from '../../field.ts';
import type { Point } from '../../field.ts';

// Compile-only API checks: expect-error also fails when a contract becomes too permissive.
export function verifyTimingAndFieldContracts(): void {
  const speed: BattleSpeed = nextBattleSpeed(99);
  const delta: number = battleFrameDelta(1 / 60, speed);
  const pacer: FramePacer = createFramePacer(30);
  const meter: FrameRateMeter = createFrameRateMeter({ updateIntervalMs: 333, windowMs: 1000 });
  const frame: number | null = pacer.sample(1000);
  const reading: number | null = meter.record(1000);
  const point: Point = positionForCell(2, 1);
  void [delta, frame, reading, point];

  // @ts-expect-error Speeds returned to UI must remain one of the supported choices.
  const unsupported: BattleSpeed = 4;
  // @ts-expect-error Callers must supply numeric elapsed time, not saved text.
  battleFrameDelta('0.016', 1);
  // @ts-expect-error Clock input is a numeric RAF timestamp.
  pacer.sample('1000');
  // @ts-expect-error A skipped frame must be handled before consuming elapsed time.
  const elapsed: number = pacer.sample(1000);
  // @ts-expect-error A meter can have insufficient samples and return null.
  const fps: number = meter.record(1000);
  // @ts-expect-error Meter settings use numeric durations.
  createFrameRateMeter({ windowMs: '1000' });
  // @ts-expect-error Cell coordinates must be numbers.
  positionForCell('2', 1);
  // @ts-expect-error The speed choices are an immutable shared definition.
  BATTLE_SPEEDS.push(4);
  // @ts-expect-error Geometry definitions cannot be changed by their consumers.
  FIELD.columns = 6;
  // @ts-expect-error The shared hero entry point is immutable.
  HERO_START.x = 99;
  // @ts-expect-error The royal route and each of its points are immutable.
  ROYAL_ROUTE[0].x = 99;
  // @ts-expect-error The walkable-area collection is immutable.
  WALKABLE_AREAS.push({ left: 0, top: 0, right: 1, bottom: 1 });
  void [unsupported, elapsed, fps];
}
