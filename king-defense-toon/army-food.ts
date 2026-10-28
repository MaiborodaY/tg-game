import { getForgedUnitStats } from './forge.ts';
import type { ForgeState, ForgeUpgradeId, ForgedUnitStats } from './forge.ts';
import type { Battle } from './combat-types.ts';
import type { UnitType } from './units.ts';

export type FoodBonuses = Readonly<Record<ForgeUpgradeId, number>>;
export const NO_FOOD: FoodBonuses = Object.freeze({ health: 0, attack: 0, attackSpeed: 0 });
const boosted = (value: number, percent: number): number => Math.min(Number.MAX_SAFE_INTEGER, value * (1 + percent / 100));

export function getArmyUnitStats(type: UnitType, level: unknown, forge: Readonly<ForgeState>, food: FoodBonuses): ForgedUnitStats {
  const stats = getForgedUnitStats(type, level, forge);
  return { ...stats, hp: boosted(stats.hp, food.health), damage: boosted(stats.damage, food.attack),
    heal: boosted(stats.heal, food.attack), attackSpeed: boosted(stats.attackSpeed, food.attackSpeed) };
}

/** Temporary food is the only live modifier; permanent upgrades retain their battle snapshot. */
export function applyBattleFood(battle: Battle, food: FoodBonuses): boolean {
  const previous = battle.food;
  if ((!previous && !food.health && !food.attack && !food.attackSpeed)
    || (previous && previous.bonuses.health === food.health && previous.bonuses.attack === food.attack
      && previous.bonuses.attackSpeed === food.attackSpeed)) return false;
  const bases = previous?.bases ?? battle.allies.map(unit => ({ id: unit.id, hp: unit.maxHp,
    damage: unit.damage, baseDamage: unit.baseDamage, heal: unit.heal, attackSpeed: unit.attackSpeed }));
  for (const unit of battle.allies) {
    const base = bases.find(entry => entry.id === unit.id);
    if (!base) continue;
    // Keep injuries proportional: cooking cannot heal, revive or reset a cast/cooldown.
    const maxHp = boosted(base.hp, food.health);
    if (unit.maxHp !== maxHp) {
      const fraction = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
      unit.maxHp = maxHp;
      unit.hp = maxHp * fraction;
    }
    unit.damage = boosted(base.damage, food.attack);
    unit.baseDamage = boosted(base.baseDamage, food.attack);
    unit.heal = boosted(base.heal, food.attack);
    unit.attackSpeed = boosted(base.attackSpeed, food.attackSpeed);
  }
  battle.food = { bonuses: { ...food }, bases };
  return true;
}
