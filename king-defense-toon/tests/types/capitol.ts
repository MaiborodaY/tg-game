import { createCapitol, capitolUpgradeCost, upgradeCapitol, getCapitolStats } from '../../capitol.ts';
import type { CapitolState, CapitolUpgradeId, CapitolUpgradeResult, CapitolStats } from '../../capitol.ts';

export function verifyCapitolContracts(saved: unknown): void {
  const capitol: CapitolState = createCapitol(saved);
  const upgrade: CapitolUpgradeId = 'tower';
  const price: number | null = capitolUpgradeCost(Object.freeze({ ...capitol }), upgrade);
  const result: CapitolUpgradeResult = upgradeCapitol(capitol, upgrade, 100);
  const stats: CapitolStats = getCapitolStats(Object.freeze({ ...capitol }));
  const defaults: CapitolStats = getCapitolStats();
  // @ts-expect-error Only castle health and defensive tower are Capitol tracks.
  upgradeCapitol(capitol, 'attackSpeed', 100);
  // @ts-expect-error Currency must be numeric before a purchase.
  upgradeCapitol(capitol, upgrade, '100');
  // @ts-expect-error Saved unknown input must be normalized before use.
  capitolUpgradeCost(saved, upgrade);
  // @ts-expect-error A normalized Capitol includes both independent ranks.
  const incomplete: CapitolState = { health: 1 };
  // @ts-expect-error Tower rank is numeric, not a built/unbuilt boolean.
  capitol.tower = true;
  // @ts-expect-error Battle stats do not expose progression ranks as health upgrades.
  stats.health = 1;
  void [price, result, stats, defaults, incomplete];
}
