import type { AnimationActor } from './animation-types.ts';
import { authoredUnitFrame } from './authored-unit-animation.ts';

const poses = { action: 'shoot', duration: 0.65, walkFps: 6 } as const;
export function pantherRiderFrame(actor: AnimationActor | null | undefined, time = 0): number {
  return authoredUnitFrame(actor, time, poses);
}
