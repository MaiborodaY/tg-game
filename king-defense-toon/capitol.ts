export type CapitolUpgradeId = 'health' | 'tower';
export interface CapitolState {
  health: number;
  /** Zero means unbuilt; one is the purchased tower before damage upgrades. */
  tower: number;
}
export interface CapitolUpgradeResult { upgraded: boolean; gold: number }
export interface CapitolStats {
  hp: number;
  damage: number;
  interval: number;
  range: number;
  towerLevel: number;
}

const UPGRADE_IDS = ['health', 'tower'] as const;
const validRank = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;
const fields = (value: unknown): Record<string, unknown> => value !== null
  && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const own = (value: Record<string, unknown>, key: string): unknown => Object.hasOwn(value, key) ? value[key] : undefined;
const validCapitol = (value: unknown): value is Readonly<CapitolState> => {
  const source = fields(value);
  return UPGRADE_IDS.every(id => validRank(own(source, id)));
};

export function createCapitol(saved?: unknown): CapitolState {
  const source = fields(saved);
  const health = own(source, 'health'), tower = own(source, 'tower');
  return { health: validRank(health) ? health : 0, tower: validRank(tower) ? tower : 0 };
}

export function capitolUpgradeCost(capitol: Readonly<CapitolState>, id: CapitolUpgradeId): number | null {
  if (!UPGRADE_IDS.includes(id) || !validCapitol(capitol)) return null;
  const rank = capitol[id];
  if (!Number.isSafeInteger(rank + 1)) return null;
  const price = id === 'tower' && rank === 0 ? 100 : 50 + 25 * (id === 'tower' ? rank - 1 : rank);
  // There is no gameplay rank cap; only reject prices outside exact integer currency.
  return Number.isSafeInteger(price) && price > 0 ? price : null;
}

export function upgradeCapitol(capitol: CapitolState, id: CapitolUpgradeId, gold: number): CapitolUpgradeResult {
  const cost = capitolUpgradeCost(capitol, id);
  if (cost === null || !Number.isSafeInteger(gold) || gold < cost) return { upgraded: false, gold };
  capitol[id] += 1;
  return { upgraded: true, gold: gold - cost };
}

export function getCapitolStats(capitol?: Readonly<CapitolState>): CapitolStats {
  const ranks = createCapitol(capitol);
  // Saved high ranks remain valid, while combat never receives unsafe-sized stats.
  return {
    hp: Math.min(Number.MAX_SAFE_INTEGER, 100 + 20 * ranks.health),
    damage: ranks.tower === 0 ? 0 : Math.min(Number.MAX_SAFE_INTEGER, 10 + 2 * (ranks.tower - 1)),
    interval: 2,
    range: 144,
    towerLevel: ranks.tower,
  };
}
