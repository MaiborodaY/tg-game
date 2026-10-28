import type { AnimationActor } from './animation-types.ts';
import { authoredUnitFrame } from './authored-unit-animation.ts';

const poses = { action: 'heal', duration: 0.8, walkFps: 8 } as const;
export function elfHealerFrame(actor: AnimationActor | null | undefined, time = 0): number {
  return authoredUnitFrame(actor, time, poses);
}
