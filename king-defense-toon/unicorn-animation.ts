import type { AnimationActor } from './animation-types.ts';
import { authoredUnitFrame } from './authored-unit-animation.ts';

const poses = { action: 'attack', duration: .8, walkFps: 6 } as const;
export function unicornFrame(actor: AnimationActor | null | undefined, time = 0): number {
  return authoredUnitFrame(actor, time, poses);
}
