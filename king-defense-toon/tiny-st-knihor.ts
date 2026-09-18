import type { AnimationActor } from './animation-types.ts';

export const TINY_ST_KNIHOR_LAYOUT = Object.freeze({ columns: 4, rows: 6 });
export const ST_KNIHOR_EFFECT_LAYOUT = Object.freeze({ columns: 4, rows: 4 });

export const ST_KNIHOR_ANIMATIONS = Object.freeze({
  idle: Object.freeze({ row: 0, fps: 3, duration: 4 / 3, loop: true }),
  walk: Object.freeze({ row: 1, fps: 6, duration: 4 / 6, loop: true }),
  attack: Object.freeze({ row: 2, duration: .9, impactFraction: .5, loop: false }),
  cast: Object.freeze({ row: 3, duration: 1.2, impactFraction: .5, loop: false }),
  hit: Object.freeze({ row: 4, duration: .32, loop: false }),
  death: Object.freeze({ row: 5, duration: .8, loop: false }),
});

export const ST_KNIHOR_EFFECT_TIMINGS = Object.freeze({
  heal: Object.freeze({ row: 0, duration: .8 }),
  armor: Object.freeze({ row: 1, duration: 1.2 }),
  hammer: Object.freeze({ row: 2, duration: .6 }),
  impact: Object.freeze({ row: 3, duration: .4 }),
});

export type HeroEffectKind = keyof typeof ST_KNIHOR_EFFECT_TIMINGS;
export type HeroDirection = 'up' | 'down' | 'side';
export interface HeroFacing { direction: HeroDirection; flipX: boolean; }

const finite = (value: number | undefined, fallback = 0): number => Number.isFinite(value) ? value! : fallback;
const animationFor = (action: AnimationActor['action']) => action !== undefined && Object.hasOwn(ST_KNIHOR_ANIMATIONS, action)
  ? ST_KNIHOR_ANIMATIONS[action as keyof typeof ST_KNIHOR_ANIMATIONS] : ST_KNIHOR_ANIMATIONS.idle;
const effectFor = (kind: HeroEffectKind) => Object.hasOwn(ST_KNIHOR_EFFECT_TIMINGS, kind)
  ? ST_KNIHOR_EFFECT_TIMINGS[kind] : ST_KNIHOR_EFFECT_TIMINGS.heal;
const actionDuration = (actor: AnimationActor | null | undefined, animation: { readonly duration: number }): number => Math.max(.01, finite(actor?.actionDuration, animation.duration));

function loopFrame(time: number | undefined, fps: number): number {
  // Reduce time before multiplication so even very large finite clocks stay in the atlas.
  return Math.min(3, Math.floor((Math.max(0, finite(time)) % (4 / fps)) * fps));
}

export function stKnihorDirection(actor?: AnimationActor | null): HeroFacing {
  const x = finite(actor?.facingX);
  const y = finite(actor?.facingY, 1);
  if (Math.abs(y) >= Math.abs(x)) return { direction: y < 0 ? 'up' : 'down', flipX: false };
  return { direction: 'side', flipX: x < 0 };
}

export function stKnihorImpactTime(actor?: AnimationActor | null): number {
  const animation = actor?.action === 'cast' ? ST_KNIHOR_ANIMATIONS.cast : ST_KNIHOR_ANIMATIONS.attack;
  const fraction = Math.max(.01, Math.min(.99, finite(actor?.impactFraction, animation.impactFraction)));
  return actionDuration(actor, animation) * fraction;
}

export function tinyStKnihorFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 23;
  const animation = animationFor(actor?.action);
  const start = animation.row * 4;
  if (animation.loop) return start + loopFrame(actor?.action === 'walk' ? finite(actor.walkTime, time) : time, animation.fps);
  const elapsed = Math.max(0, finite(actor?.actionTime));
  const duration = actionDuration(actor, animation);
  if (actor?.action === 'attack' || actor?.action === 'cast') {
    const impact = stKnihorImpactTime(actor);
    // Pose 2 is the authored contact/release pose; its first tick must match the future action event.
    const pose = elapsed < impact / 2 ? 0 : elapsed < impact ? 1
      : elapsed < impact + (duration - impact) / 2 ? 2 : 3;
    return start + pose;
  }
  return start + Math.min(3, Math.floor(Math.min(1, elapsed / duration) * 4));
}

export function stKnihorEffectFrame(kind: HeroEffectKind = 'heal', elapsed = 0): number {
  const effect = effectFor(kind);
  const progress = Math.max(0, Math.min(1, finite(elapsed) / effect.duration));
  return effect.row * 4 + Math.min(3, Math.floor(progress * 4));
}

export function stKnihorEffectActive(kind: HeroEffectKind = 'heal', elapsed = 0): boolean {
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < effectFor(kind).duration;
}
