import { createMarketState } from './market.ts';
import type { MarketState } from './market.ts';

export interface EconomyState extends MarketState {
  treasuryLevel: number;
  treasuryProgress: number;
  treasuryUpdatedAt: number | null;
  slaves: number;
  captures: number;
  captureKills: number;
  captureCooldown: number;
}

export interface OfflineTreasuryClaim {
  gold: number;
  elapsedSeconds: number;
  capped: boolean;
}

export interface TreasuryUpgradeResult {
  upgraded: boolean;
  gold: number;
}

interface EconomySaveFields {
  treasuryLevel?: unknown;
  treasuryProgress?: unknown;
  treasuryUpdatedAt?: unknown;
  slaves?: unknown;
  captures?: unknown;
  captureKills?: unknown;
  captureCooldown?: unknown;
}

// Captures now supply all new fighters, so both search odds and the wait support recruitment.
export const SLAVE_DROP_CHANCE = .30;
export const CAPTURE_COOLDOWN = 30;
export const CAPTURE_PITY_KILLS = 5;
export const FIRST_CAPTURE_KILLS = 2;
export const STARTER_CAPTURES = 4;
export const STARTER_CAPTURE_CHANCE = .50;
export const STARTER_CAPTURE_PITY_KILLS = 3;
export const TREASURY_UPGRADE_COSTS = Object.freeze([75, 150, 300, 600]);
export const MAX_TREASURY_LEVEL = TREASURY_UPGRADE_COSTS.length + 1;
export const TREASURY_OFFLINE_LIMIT_SECONDS = 4 * 60 * 60;

const positiveInteger = <Fallback extends number | null>(value: unknown, fallback: Fallback): number | Fallback =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 ? value : fallback;
const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const safeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);

export function createEconomy(saved: unknown = {}): EconomyState {
  const source = saved as EconomySaveFields | null | undefined;
  const economy = {
    ...createMarketState(saved),
    treasuryLevel: Math.min(MAX_TREASURY_LEVEL, positiveInteger(source?.treasuryLevel, 1)),
    treasuryProgress: finiteNumber(source?.treasuryProgress) && source.treasuryProgress >= 0
      && source.treasuryProgress < 1 ? source.treasuryProgress : 0,
    treasuryUpdatedAt: positiveInteger(source?.treasuryUpdatedAt, null),
    slaves: safeInteger(source?.slaves) && source.slaves >= 0 ? source.slaves : 0,
    captures: safeInteger(source?.captures) && source.captures >= 0 ? source.captures : 0,
    captureKills: safeInteger(source?.captureKills) && source.captureKills >= 0 ? source.captureKills : 0,
    captureCooldown: finiteNumber(source?.captureCooldown) ? Math.max(0, Math.min(CAPTURE_COOLDOWN, source.captureCooldown)) : 0,
  };
  // Existing campaigns keep every kill and currency; remove the old starter wait.
  if (economy.captures < STARTER_CAPTURES) economy.captureCooldown = 0;
  return economy;
}

export const capturePityKills = (economy: EconomyState): number => economy.captures === 0 ? FIRST_CAPTURE_KILLS
  : economy.captures < STARTER_CAPTURES ? STARTER_CAPTURE_PITY_KILLS : CAPTURE_PITY_KILLS;
export const captureDropChance = (economy: EconomyState): number => economy.captures < STARTER_CAPTURES
  ? STARTER_CAPTURE_CHANCE : SLAVE_DROP_CHANCE;

export const treasuryRate = (economy: EconomyState): number => economy.treasuryLevel;
export const treasuryUpgradeCost = (economy: EconomyState): number | null =>
  TREASURY_UPGRADE_COSTS[economy.treasuryLevel - 1] ?? null;

export function accrueTreasury(economy: EconomyState, elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  // Save fractional gold so closing the game or upgrading never discards earned progress.
  const total = economy.treasuryProgress + elapsedSeconds * treasuryRate(economy) / 60;
  const whole = Math.floor(total + 1e-9);
  economy.treasuryProgress = Math.max(0, total - whole);
  return whole;
}

export function checkpointTreasury(economy: EconomyState, now: number = Date.now()): void {
  if (positiveInteger(now, null) === null) return;
  // A clock rollback must not make an already accounted interval payable again.
  economy.treasuryUpdatedAt = Math.max(positiveInteger(economy.treasuryUpdatedAt, now), now);
}

export function claimOfflineTreasury(economy: EconomyState, now: number = Date.now()): OfflineTreasuryClaim {
  const empty = { gold: 0, elapsedSeconds: 0, capped: false };
  if (positiveInteger(now, null) === null) return empty;
  const previous = positiveInteger(economy.treasuryUpdatedAt, null);
  if (previous === null) {
    // Older saves have no reliable departure time; begin tracking from this visit.
    checkpointTreasury(economy, now);
    return empty;
  }
  const awaySeconds = Math.max(0, (now - previous) / 1000);
  const elapsedSeconds = Math.min(awaySeconds, TREASURY_OFFLINE_LIMIT_SECONDS);
  const gold = accrueTreasury(economy, elapsedSeconds);
  // Consume the complete gap, including time beyond the cap, before the next save.
  checkpointTreasury(economy, now);
  return { gold, elapsedSeconds, capped: awaySeconds > TREASURY_OFFLINE_LIMIT_SECONDS };
}

export function upgradeTreasury(economy: EconomyState, gold: number): TreasuryUpgradeResult {
  const cost = treasuryUpgradeCost(economy);
  if (cost === null || !Number.isFinite(gold) || gold < cost) return { upgraded: false, gold };
  economy.treasuryLevel += 1;
  return { upgraded: true, gold: gold - cost };
}

export function rollSlaveDrop(economy: EconomyState, random: () => number = Math.random): 0 | 1 {
  if (economy.captureCooldown > 0) return 0;
  economy.captureKills += 1;
  const roll = random();
  const guaranteed = economy.captureKills >= capturePityKills(economy);
  if (!guaranteed && (!Number.isFinite(roll) || roll < 0 || roll >= captureDropChance(economy))) return 0;
  economy.slaves += 1;
  economy.captures += 1;
  economy.captureKills = 0;
  economy.captureCooldown = economy.captures < STARTER_CAPTURES ? 0 : CAPTURE_COOLDOWN;
  return 1;
}

export function advanceCaptureClock(economy: EconomyState, elapsedSeconds: number): void {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;
  // Foreground time, not the accelerated combat clock. Hidden/closed time never advances it.
  const remaining = economy.captureCooldown - elapsedSeconds;
  // Floating-point residue must not postpone a capture at the exact cooldown boundary.
  economy.captureCooldown = remaining > 1e-9 ? remaining : 0;
}

export function progressionAfterBattle(waveNumber: number, won: boolean, totalWaves: number): number {
  // Saved progress counts CLEARED waves: losing wave 6 must prepare wave 5, hence 6 - 2.
  return Math.max(0, Math.min(totalWaves, won ? waveNumber : waveNumber - 2));
}
