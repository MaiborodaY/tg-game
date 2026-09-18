export interface MarketState {
  marketLevel: number;
  marketBuilt: boolean;
  marketProgress: number;
  marketUpdatedAt: number | null;
}

export type MarketEconomy = MarketState & { slaves: number };

export interface MarketUpgradeResult {
  upgraded: boolean;
  gold: number;
}

export interface OfflineMarketClaim {
  slaves: number;
  elapsedSeconds: number;
  capped: boolean;
}

// Reading a save field does not validate its contents; the helpers below do that.
interface MarketSaveFields {
  marketLevel?: unknown;
  marketBuilt?: unknown;
  marketProgress?: unknown;
  marketUpdatedAt?: unknown;
}

export const MARKET_UPGRADE_BASE_COST = 100;
export const MARKET_PRODUCTION_SECONDS = 60 * 60;
export const MARKET_OFFLINE_LIMIT_SECONDS = 4 * 60 * 60;

const validTimestamp = (value: unknown): number | null => typeof value === 'number'
  && Number.isSafeInteger(value) && value > 0 ? value : null;
const validProgress = (value: unknown): number => typeof value === 'number'
  && Number.isFinite(value) && value >= 0 && value < 1 ? value : 0;
const validLevel = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 1;

export function createMarketState(saved: unknown = {}): MarketState {
  const source = saved as MarketSaveFields | null | undefined;
  const hasLevel = validLevel(source?.marketLevel);
  const wasProducing = hasLevel || source?.marketBuilt === true;
  // The old paid market already earned two per hour; keep that purchase and its progress.
  const marketLevel = validLevel(source?.marketLevel) ? source.marketLevel : source?.marketBuilt === true ? 2 : 1;
  return {
    marketLevel,
    marketBuilt: true,
    marketProgress: wasProducing ? validProgress(source?.marketProgress) : 0,
    marketUpdatedAt: wasProducing ? validTimestamp(source?.marketUpdatedAt) : null,
  };
}

export const marketRate = (economy: MarketState): number => economy.marketLevel;
export function marketUpgradeCost(economy: MarketState): number | null {
  const cost = economy.marketLevel * MARKET_UPGRADE_BASE_COST;
  return validLevel(economy.marketLevel) && Number.isSafeInteger(cost) ? cost : null;
}

export function upgradeMarket(economy: MarketEconomy, gold: number, now: number = Date.now()): MarketUpgradeResult {
  const cost = marketUpgradeCost(economy);
  if (cost === null || !Number.isSafeInteger(gold) || gold < cost
    || validTimestamp(now) === null) return { upgraded: false, gold };
  // Settle elapsed time at the old rate before upgrading, preserving partial production.
  const next = { ...economy };
  claimOfflineMarket(next, now);
  if (!Number.isSafeInteger(next.slaves) || next.slaves < 0) return { upgraded: false, gold };
  next.marketLevel++;
  Object.assign(economy, next);
  return { upgraded: true, gold: gold - cost };
}

export function accrueMarket(economy: MarketEconomy, elapsedSeconds: number): number {
  if (economy.marketBuilt !== true || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  const total = validProgress(economy.marketProgress) + elapsedSeconds * marketRate(economy) / MARKET_PRODUCTION_SECONDS;
  const slaves = Math.floor(total + 1e-9);
  economy.marketProgress = Math.max(0, total - slaves);
  // Market income does not advance or reset the separate combat-capture guarantee.
  economy.slaves += slaves;
  return slaves;
}

export function checkpointMarket(economy: MarketState, now: number = Date.now()): void {
  if (economy.marketBuilt !== true || validTimestamp(now) === null) return;
  // Keep a future checkpoint after a clock rollback to prevent replaying paid time.
  economy.marketUpdatedAt = Math.max(validTimestamp(economy.marketUpdatedAt) ?? now, now);
}

export function claimOfflineMarket(economy: MarketEconomy, now: number = Date.now()): OfflineMarketClaim {
  const empty = { slaves: 0, elapsedSeconds: 0, capped: false };
  if (economy.marketBuilt !== true || validTimestamp(now) === null) return empty;
  const previous = validTimestamp(economy.marketUpdatedAt);
  if (previous === null) {
    checkpointMarket(economy, now);
    return empty;
  }
  const awaySeconds = Math.max(0, (now - previous) / 1000);
  const elapsedSeconds = Math.min(awaySeconds, MARKET_OFFLINE_LIMIT_SECONDS);
  const slaves = accrueMarket(economy, elapsedSeconds);
  // Consume the whole absence, including the unpaid time beyond the storage limit.
  checkpointMarket(economy, now);
  return { slaves, elapsedSeconds, capped: awaySeconds > MARKET_OFFLINE_LIMIT_SECONDS };
}
