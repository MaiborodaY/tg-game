import { ROYAL_PENINSULA } from './field.ts';
import type { Battle } from './combat-types.ts';

export const HERO_XP_EFFECT_SECONDS = 1.8;

export function addHeroXpEffect(battle: Battle, gained: number): void {
  if (!Number.isSafeInteger(gained) || gained <= 0) return;
  // One cached label per reward uses the existing visual lifetime; no particles or timers.
  const x = ROYAL_PENINSULA.left + 5, y = ROYAL_PENINSULA.top - 8;
  battle.effects.push({ id: battle.nextEffectId++, type: 'xp', amount: gained, label: `+${gained} XP`,
    x, y, targetX: x, targetY: y, age: 0, duration: HERO_XP_EFFECT_SECONDS,
    side: 'ally', sourceType: 'hero', sourceId: battle.hero.id });
}
