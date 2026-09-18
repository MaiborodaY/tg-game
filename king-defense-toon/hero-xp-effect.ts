import { ROYAL_PENINSULA } from './field.ts';
import type { Battle } from './combat-types.ts';
import { addVisualEffect } from './combat-visuals.ts';

export const HERO_XP_EFFECT_SECONDS = 1.8;

export function addHeroXpEffect(battle: Battle, gained: number): void {
  if (!Number.isSafeInteger(gained) || gained <= 0) return;
  // One cached label per reward uses the existing visual lifetime; no particles or timers.
  const x = ROYAL_PENINSULA.left + 5, y = ROYAL_PENINSULA.top - 8;
  addVisualEffect(battle, 'xp', { id: battle.hero.id, type: 'hero', side: 'ally', x, y: y + 27 },
    { x, y: y + 27 }, HERO_XP_EFFECT_SECONDS, { amount: gained, label: `+${gained} XP` });
}
