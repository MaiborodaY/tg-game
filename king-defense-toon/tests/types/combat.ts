import { createBattle, getUnitRange, updateBattle } from '../../combat.ts';
import type { Actor, Battle, BattleEffect, BattleEffectBase, BattleEvent, EffectOf, FormationUnit, HeroActor } from '../../combat-types.ts';
import { createHero } from '../../hero.ts';
import { getEnemyCombatType } from '../../waves.ts';
import type { EnemyCombatType } from '../../waves.ts';

// Compile-only consumers must distinguish events, effects and the hero's extra state.
export function verifyCombatContracts(saved: unknown, actor: Actor, effect: BattleEffect): void {
  const formation: readonly FormationUnit[] = [{ id: 1, type: 'lancer', col: 2, row: 0, level: 10 }];
  const battle: Battle = createBattle(formation, '201', createHero(saved));
  const fresh: Battle = createBattle();
  const events: BattleEvent[] = updateBattle(battle, 1 / 60);
  const enemyRole: EnemyCombatType = getEnemyCombatType('skeleton');
  const allyRole: 'archer' = getEnemyCombatType('archer');
  const castleRole: 'castle' = getEnemyCombatType('castle');
  const heroRole: 'hero' = getEnemyCombatType('hero');
  const range: number = getUnitRange('lancer');
  for (const event of events) {
    if (event.type === 'gold') {
      const amount: number = event.amount;
      const position: [number, number] = [event.x, event.y];
      void [amount, position];
    } else {
      const source: string = event.sourceId;
      // @ts-expect-error Bow-shot events carry no currency amount.
      const amount: number = event.amount;
      void [source, amount];
    }
  }
  if (actor.type === 'hero') {
    const hero: HeroActor = actor;
    const pending = hero.pendingAbility;
    if (pending) {
      const targets: string[] = pending.targetIds;
      void targets;
    }
    // @ts-expect-error Battle hero stats are a frozen independent snapshot.
    hero.stats.hammerDamage = 999;
  } else {
    // @ts-expect-error Ordinary actors do not have hero ability queues.
    actor.pendingAbility;
  }
  if (effect.type === 'arrow' || effect.type === 'hero-hammer') {
    const damage: number = effect.damage;
    const target: string = effect.targetId;
    void [damage, target];
  } else if (effect.type === 'hero-heal') {
    const shield: number = effect.shield;
    void shield;
  }
  const base: BattleEffectBase = { id: 1, x: 0, y: 0, targetX: 1, targetY: 1,
    age: 0, duration: .5, side: 'ally', sourceType: 'archer', sourceId: 'ally-1' };
  const arrow: EffectOf<'arrow'> = { ...base, type: 'arrow', targetId: 'goblin-1', damage: 8 };
  battle.effects.push(arrow);
  battle.hero.hp -= 1; // Live combat state remains mutable.

  // @ts-expect-error Formation units must be allied recruit types.
  createBattle([{ id: 1, type: 'goblin', col: 2, row: 0 }]);
  // @ts-expect-error A raw saved hero must be normalized before typed gameplay use.
  createBattle(formation, 1, saved);
  // @ts-expect-error Frame time is numeric even though JS callers retain runtime guards.
  updateBattle(battle, '0.016');
  // @ts-expect-error Combat range lookup only accepts known actor identifiers.
  getUnitRange('dragon');
  // @ts-expect-error Battle phases form a closed result protocol.
  battle.phase = 'paused';
  // @ts-expect-error Actor actions must be supported by the simulation.
  battle.hero.action = 'casting';
  // @ts-expect-error An ordinary actor cannot stand in for a fully initialized hero.
  const incompleteHero: HeroActor = { ...battle.allies[0], type: 'hero' };
  // @ts-expect-error Cast queues are nullable between abilities.
  battle.hero.pendingAbility.targetIds;
  // @ts-expect-error Only the hero has hero-specific stats.
  battle.allies[0].stats;
  // @ts-expect-error Gold events require an amount and a world position.
  const incompleteGold: BattleEvent = { type: 'gold', amount: 7 };
  // @ts-expect-error Bow-shot events identify the source.
  const incompleteShot: BattleEvent = { type: 'bow-shot' };
  // @ts-expect-error An in-flight arrow requires damage, not just a target.
  const incompleteArrow: BattleEffect = { ...base, type: 'arrow', targetId: 'goblin-1' };
  // @ts-expect-error Hero-hammer explicitly starts with a landed flag.
  const incompleteHammer: EffectOf<'hero-hammer'> = { ...base, type: 'hero-hammer', targetId: 'goblin-1', damage: 4 };
  // @ts-expect-error Healing is not a damage payload.
  const invalidHeal: BattleEffect = { ...base, type: 'heal', damage: 4 };
  // @ts-expect-error Selecting several effect kinds must keep each payload tied to its own kind.
  const mixedPayload: EffectOf<'gold' | 'arrow'> = { ...base, type: 'arrow', amount: 7 };
  // @ts-expect-error Shared wave data is immutable even while a battle progresses.
  battle.wave.spawns[0].hp = 1;
  void [fresh, enemyRole, allyRole, castleRole, heroRole, range, incompleteHero, incompleteGold,
    incompleteShot, incompleteArrow, incompleteHammer, invalidHeal, mixedPayload];
}
