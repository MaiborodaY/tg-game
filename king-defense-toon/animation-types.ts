import type { ActorAction } from './combat-types.ts';

/** Rendering also has authored cast, hit and death poses outside the combat action state. */
export type AnimationAction = ActorAction | 'cast' | 'hit' | 'death';

/** Minimal pose input shared by battle actors, formation previews and portrait animation. */
export interface AnimationActor {
  action?: AnimationAction;
  actionTime?: number;
  actionDuration?: number;
  impactFraction?: number;
  walkTime?: number;
  hitTime?: number;
  deathTime?: number;
  facingX?: number;
  facingY?: number;
  attackCount?: number;
}

export type FrameFunction = (actor: AnimationActor | null | undefined, time?: number) => number;
export type AnimationFrameSequence = readonly [number, ...number[]];

export interface AllyAnimationFrames {
  idle?: number;
  walk?: AnimationFrameSequence;
  anticipation?: AnimationFrameSequence;
  impact?: number;
  recovery?: AnimationFrameSequence;
}

export type AllyAnimationActor = AnimationActor & Required<Pick<AnimationActor,
  'action' | 'actionTime' | 'actionDuration' | 'hitTime' | 'deathTime'>>;
