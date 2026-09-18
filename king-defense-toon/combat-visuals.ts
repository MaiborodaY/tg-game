import type { Actor, Battle, BattleEffect, BattleEffectPayloads, BattleEffectType } from './combat-types.ts';

// A memory guard for cosmetic bursts, not a measured device performance budget.
// Gameplay projectiles, events and statuses must never share this limit.
export const DEFAULT_VISUAL_EFFECT_LIMIT = 256;
type VisualState = Pick<Battle, 'effects' | 'nextEffectId' | 'visualEffectLimit'>;
type VisualSource = Readonly<Pick<Actor, 'id' | 'type' | 'side' | 'x' | 'y'>>;
type VisualTarget = Readonly<Pick<Actor, 'x' | 'y'>>;

export function setBattleVisualEffectLimit(battle: VisualState, limit: number): void {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Invalid visual effect limit');
  battle.visualEffectLimit = limit;
  if (battle.effects.length > limit) battle.effects.length = limit;
}

export function addVisualEffect<T extends Exclude<BattleEffectType, 'slash'>>(battle: VisualState, type: T,
  source: VisualSource, target: VisualTarget, duration: number, extras: BattleEffectPayloads[T]): void;
export function addVisualEffect(battle: VisualState, type: 'slash', source: VisualSource, target: VisualTarget,
  duration: number, extras?: BattleEffectPayloads['slash']): void;
export function addVisualEffect(battle: VisualState, type: BattleEffectType, source: VisualSource,
  target: VisualTarget, duration: number, extras: BattleEffectPayloads[BattleEffectType] = {}): void {
  if (battle.effects.length >= battle.visualEffectLimit) return;
  battle.effects.push({
    id: battle.nextEffectId++, type, x: source.x, y: source.y - 27,
    targetX: target.x, targetY: target.y - 27, age: 0, duration,
    // Overloads associate each cosmetic kind with its payload at the call site.
    side: source.side, sourceType: source.type, sourceId: source.id, ...extras,
  } as BattleEffect);
}

export function ageVisualEffects(battle: VisualState, dt: number): void {
  // Compact in place: no per-tick snapshot/filter allocation for disposable visuals.
  let kept = 0;
  for (const effect of battle.effects) {
    effect.age += dt;
    if (effect.age < effect.duration) battle.effects[kept++] = effect;
  }
  battle.effects.length = kept;
}
