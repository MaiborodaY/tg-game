import type { AnimationActor } from './animation-types.ts';
import { tinyGoblinChiefFrame } from './tiny-goblin-chief.ts';

// Both authored atlases use four idle/run/side/down poses, with impact at pose 2.
// There is no upward strike or death strip: side attacks and the existing fade apply.
export function pantherRiderFrame(actor: AnimationActor | null | undefined, time = 0): number {
  return tinyGoblinChiefFrame(actor, time);
}
