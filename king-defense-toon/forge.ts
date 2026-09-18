import { getUnitStats } from './recruitment.ts';
import type { UnitStats } from './recruitment.ts';
import type { UnitType } from './units.ts';

export type ForgeUpgradeId = 'health' | 'attack' | 'attackSpeed' | 'rangedAttack' | 'rangedAttackSpeed';
export type ForgeUpgrade = ForgeUpgradeId;
export type ForgeState = Record<ForgeUpgradeId, number>;
export interface ForgeUpgradeDefinition {
  readonly id: ForgeUpgradeId;
  readonly name: string;
  readonly description: string;
  readonly scope: 'all' | 'ranged';
}
export interface ForgeUpgradeResult { upgraded: boolean; gold: number }
export interface ForgedUnitStats extends UnitStats { attackSpeed: number }

export const FORGE_MAX_RANK = 100;
export const FORGE_UPGRADES: readonly ForgeUpgradeDefinition[] = Object.freeze([
  Object.freeze({ id: 'health', name: 'Health', description: '+1% HP for all army units.', scope: 'all' }),
  Object.freeze({ id: 'attack', name: 'Attack / Healing', description: '+1% attack and healing for all army units.', scope: 'all' }),
  Object.freeze({ id: 'attackSpeed', name: 'Attack speed', description: '+1% attack and healing speed for all army units.', scope: 'all' }),
  Object.freeze({ id: 'rangedAttack', name: 'Ranged attack', description: '+1% archer attack. Adds to the general attack bonus.', scope: 'ranged' }),
  Object.freeze({ id: 'rangedAttackSpeed', name: 'Ranged speed', description: '+1% archer attack speed. Adds to the general speed bonus.', scope: 'ranged' }),
]);

const validRank = (value: unknown): value is number => typeof value === 'number'
  && Number.isInteger(value) && value >= 0 && value <= FORGE_MAX_RANK;
const validForge = (value: unknown): value is Readonly<ForgeState> => value !== null
  && typeof value === 'object' && !Array.isArray(value)
  && FORGE_UPGRADES.every(({ id }) => validRank((value as Partial<ForgeState>)[id]));

export function createForge(saved?: unknown): ForgeState {
  const source = saved !== null && typeof saved === 'object' && !Array.isArray(saved)
    ? saved as Partial<Record<ForgeUpgradeId, unknown>> : {};
  return Object.fromEntries(FORGE_UPGRADES.map(({ id }) => [id, validRank(source[id]) ? source[id] : 0])) as ForgeState;
}

export function forgeUpgradeCost(forge: Readonly<ForgeState>, id: ForgeUpgradeId): number | null {
  const definition = FORGE_UPGRADES.find(upgrade => upgrade.id === id);
  if (!definition || !validForge(forge) || forge[id] >= FORGE_MAX_RANK) return null;
  return definition.scope === 'ranged' ? 25 + 15 * forge[id] : 50 + 25 * forge[id];
}

export function upgradeForge(forge: ForgeState, id: ForgeUpgradeId, gold: number): ForgeUpgradeResult {
  const cost = forgeUpgradeCost(forge, id);
  if (cost === null || !Number.isSafeInteger(gold) || gold < cost) return { upgraded: false, gold };
  forge[id] += 1;
  return { upgraded: true, gold: gold - cost };
}

export function getForgedUnitStats(type: UnitType, level: unknown = 1, forge?: Readonly<ForgeState>): ForgedUnitStats {
  const stats = getUnitStats(type, level);
  const ranks = createForge(forge);
  const ranged = type === 'archer';
  const power = 1 + (ranks.attack + (ranged ? ranks.rangedAttack : 0)) / 100;
  // Keep fractional gains: rounding 6 damage + 1% back to 6 would erase a purchase.
  const scale = (value: number, multiplier: number): number => Math.min(Number.MAX_SAFE_INTEGER, value * multiplier);
  return {
    ...stats,
    hp: scale(stats.hp, 1 + ranks.health / 100),
    damage: scale(stats.damage, power),
    heal: scale(stats.heal, power),
    attackSpeed: 1 + (ranks.attackSpeed + (ranged ? ranks.rangedAttackSpeed : 0)) / 100,
  };
}
