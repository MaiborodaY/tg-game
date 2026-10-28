import type { Actor, Battle, BattleEffect, BattleEvent, BattleProjectile } from '../../combat-types.ts';
import { addVisualEffect, setBattleVisualEffectLimit } from '../../combat-visuals.ts';

// Compile-only boundaries: renderer data can be discarded, damage-bearing flight cannot.
export function verifyVisualIsolation(battle: Battle, source: Actor, target: Actor,
  cosmetic: BattleEffect, projectile: BattleProjectile, event: BattleEvent): void {
  battle.effects.push(cosmetic);
  battle.projectiles.push(projectile);
  setBattleVisualEffectLimit(battle, 0);
  addVisualEffect(battle, 'hit', target, target, .5, { amount: 7 });
  addVisualEffect(battle, 'hero-heal', source, target, .5,
    { targetId: target.id, amount: 4, shield: 2 });

  // @ts-expect-error Flight carries gameplay and cannot enter the disposable effect queue.
  battle.effects.push(projectile);
  // @ts-expect-error Cosmetic hits cannot enter the damage-resolution queue.
  battle.projectiles.push(cosmetic);
  // @ts-expect-error Cosmetic creation cannot launch a damage-bearing arrow.
  addVisualEffect(battle, 'arrow', source, target, .5, { targetId: target.id, damage: 7 });
  // @ts-expect-error A hit label records presentation amount, not deferred damage.
  addVisualEffect(battle, 'hit', target, target, .5, { damage: 7 });

  if (event.type === 'damage') {
    const targetId: string = event.targetId;
    const amount: number = event.amount;
    void [targetId, amount];
    // @ts-expect-error Gameplay events do not have an expiring animation lifetime.
    event.duration = .5;
  }
  if (event.type === 'heal') {
    const shield: number = event.shield;
    const sourceId: string = event.sourceId;
    void [shield, sourceId];
  }
}
