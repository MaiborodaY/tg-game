export const MARKET_BUILD_COST = 100;
export const MARKET_PRODUCTION_SECONDS = 30 * 60;
export const MARKET_OFFLINE_LIMIT_SECONDS = 4 * 60 * 60;

const validTimestamp = value => Number.isSafeInteger(value) && value > 0 ? value : null;
const validProgress = value => Number.isFinite(value) && value >= 0 && value < 1 ? value : 0;

export function createMarketState(saved = {}) {
  const marketBuilt = saved?.marketBuilt === true;
  return {
    marketBuilt,
    marketProgress: marketBuilt ? validProgress(saved?.marketProgress) : 0,
    marketUpdatedAt: marketBuilt ? validTimestamp(saved?.marketUpdatedAt) : null,
  };
}

export function buildMarket(economy, gold, now = Date.now()) {
  if (economy.marketBuilt || !Number.isFinite(gold) || gold < MARKET_BUILD_COST
    || validTimestamp(now) === null) return { built: false, gold };
  economy.marketBuilt = true;
  economy.marketProgress = 0;
  // Production starts at purchase, never at the age of the saved campaign.
  economy.marketUpdatedAt = now;
  return { built: true, gold: gold - MARKET_BUILD_COST };
}

export function accrueMarket(economy, elapsedSeconds) {
  if (economy.marketBuilt !== true || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  const total = validProgress(economy.marketProgress) + elapsedSeconds / MARKET_PRODUCTION_SECONDS;
  const slaves = Math.floor(total + 1e-9);
  economy.marketProgress = Math.max(0, total - slaves);
  // Market income does not advance or reset the separate combat-capture guarantee.
  economy.slaves += slaves;
  return slaves;
}

export function checkpointMarket(economy, now = Date.now()) {
  if (economy.marketBuilt !== true || validTimestamp(now) === null) return;
  // Keep a future checkpoint after a clock rollback to prevent replaying paid time.
  economy.marketUpdatedAt = Math.max(validTimestamp(economy.marketUpdatedAt) ?? now, now);
}

export function claimOfflineMarket(economy, now = Date.now()) {
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
