import { createForge, forgeUpgradeCost, getForgedUnitStats, upgradeForge } from '../../forge.ts';
import type { ForgeState, ForgeUpgrade, ForgedUnitStats } from '../../forge.ts';
import { createBattle } from '../../combat.ts';

export function verifyForgeContracts(saved: unknown): void {
  const forge: ForgeState = createForge(saved);
  const upgrade: ForgeUpgrade = 'rangedAttack';
  const price: number | null = forgeUpgradeCost(forge, upgrade);
  const stats: ForgedUnitStats = getForgedUnitStats('archer', 20, forge);
  const result: { upgraded: boolean; gold: number } = upgradeForge(forge, upgrade, 50);
  createBattle([], 1, undefined, Object.freeze(forge));
  // @ts-expect-error Only the five known upgrades may be purchased.
  upgradeForge(forge, 'hero', 50);
  // @ts-expect-error Currency in a purchase must be numeric.
  upgradeForge(forge, 'health', '50');
  // @ts-expect-error Hero and enemy stats cannot receive Forge bonuses.
  getForgedUnitStats('goblin', 1, forge);
  // @ts-expect-error Normalized Forge state has all five tracks.
  const incomplete: ForgeState = { health: 1 };
  void [price, stats, result, incomplete];
}
