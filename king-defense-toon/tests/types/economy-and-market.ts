import { accrueTreasury, advanceCaptureClock, claimOfflineTreasury, createEconomy, progressionAfterBattle,
  rollSlaveDrop, TREASURY_UPGRADE_COSTS, upgradeTreasury } from '../../economy.ts';
import type { EconomyState, OfflineTreasuryClaim, TreasuryUpgradeResult } from '../../economy.ts';
import { accrueMarket, upgradeMarket, checkpointMarket, claimOfflineMarket, createMarketState } from '../../market.ts';
import type { MarketState, MarketEconomy, MarketUpgradeResult, OfflineMarketClaim } from '../../market.ts';

// Compile-only contracts supplement the runtime guards for saves and JavaScript callers.
export function verifyEconomyAndMarketContracts(saved: unknown): void {
  const economy: EconomyState = createEconomy(saved);
  const market: MarketState = createMarketState(saved);
  const minimalProducer: MarketEconomy = { ...market, slaves: 0 };
  const upgraded: MarketUpgradeResult = upgradeMarket(minimalProducer, 100, 1000);
  checkpointMarket(market, 2000);
  const slaves: number = accrueMarket(minimalProducer, 1800);
  const marketClaim: OfflineMarketClaim = claimOfflineMarket(economy, 10000);
  const treasuryClaim: OfflineTreasuryClaim = claimOfflineTreasury(economy, 10000);
  const upgrade: TreasuryUpgradeResult = upgradeTreasury(economy, 75);
  const capture: 0 | 1 = rollSlaveDrop(economy, () => .25);
  const timestamp: number | null = economy.treasuryUpdatedAt;
  void [upgraded, slaves, marketClaim, treasuryClaim, upgrade, capture, timestamp];

  // @ts-expect-error Production needs a slave balance in addition to market state.
  accrueMarket(market, 1800);
  // @ts-expect-error Plain market state does not contain treasury or capture state.
  const incomplete: EconomyState = market;
  // @ts-expect-error Runtime balances cannot contain saved text.
  economy.slaves = '5';
  // @ts-expect-error Purchase flags are booleans, not numeric markers.
  market.marketBuilt = 1;
  // @ts-expect-error Old saves can have no trustworthy departure timestamp.
  const departure: number = economy.treasuryUpdatedAt;
  // @ts-expect-error Treasury duration is numeric foreground time.
  accrueTreasury(economy, '60');
  // @ts-expect-error Offline claims require a numeric wall-clock timestamp.
  claimOfflineMarket(minimalProducer, '10000');
  // @ts-expect-error Market purchases require a numeric balance.
  upgradeMarket(minimalProducer, '100');
  // @ts-expect-error Market upgrades settle the old production rate into a slave balance.
  upgradeMarket(market, 100);
  // @ts-expect-error Capture rolls return numbers.
  rollSlaveDrop(economy, () => '0.25');
  // @ts-expect-error Capture cooldown advances by a numeric duration.
  advanceCaptureClock(economy, false);
  // @ts-expect-error Battle outcomes use booleans rather than display labels.
  progressionAfterBattle(6, 'won', 400);
  // @ts-expect-error Shared upgrade prices remain immutable.
  TREASURY_UPGRADE_COSTS[0] = 1;
  void [incomplete, departure];
}
