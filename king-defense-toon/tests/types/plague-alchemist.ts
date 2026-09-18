import type { Actor, BattleEffect, EffectOf, PoisonStatus } from '../../combat-types.ts';
import { getUnitRange } from '../../combat.ts';
import { getEnemyCombatType } from '../../waves.ts';
import type { EnemyCombatType } from '../../waves.ts';

export function verifyPoisonContracts(actor: Actor, effect: BattleEffect): void {
  const status: PoisonStatus = { remaining: 4, nextTick: 1, damagePerTick: 7 };
  actor.poison = status;
  const role: EnemyCombatType = getEnemyCombatType('plagueAlchemist');
  const range: number = getUnitRange(role);
  if (effect.type === 'poison-bottle') {
    const fullBudget: number = effect.damage;
    const targetId: string = effect.targetId;
    const landed: boolean | undefined = effect.landed;
    void [fullBudget, targetId, landed];
  } else if (effect.type === 'poison-impact') {
    const targetId: string = effect.targetId;
    // @ts-expect-error A splash is visual; only the bottle carries a damage budget.
    effect.damage;
    void targetId;
  }
  // @ts-expect-error Poison requires the cadence and potency as well as lifetime.
  actor.poison = { remaining: 4 };
  // @ts-expect-error A bottle cannot carry a healing payload instead of damage.
  const invalid: EffectOf<'poison-bottle'> = { ...effect, type: 'poison-bottle', targetId: 'ally-1', amount: 8 };
  delete actor.poison;
  void [range, invalid];
}
