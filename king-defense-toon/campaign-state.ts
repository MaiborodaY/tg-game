import { createBarracks, STARTING_SLAVES } from './barracks.ts';
import type { BarracksState } from './barracks.ts';
import { createCapitol } from './capitol.ts';
import type { CapitolState } from './capitol.ts';
import { createEconomy, checkpointTreasury } from './economy.ts';
import type { EconomyState } from './economy.ts';
import { checkpointMarket } from './market.ts';
import { createFarm } from './farm.ts';
import type { FarmState } from './farm.ts';
import { createKitchen } from './kitchen.ts';
import type { KitchenState } from './kitchen.ts';
import { createForge, restoreForge } from './forge.ts';
import type { ForgeState } from './forge.ts';
import { createHero } from './hero.ts';
import type { HeroState } from './hero.ts';
import { createProgression, STARTING_GOLD } from './progression.ts';
import type { Progression } from './progression.ts';
import { createRecruitment } from './recruitment.ts';
import type { RecruitmentState } from './recruitment.ts';
import { normalizeRecruitmentPool } from './recruitment-pools.ts';
import type { RecruitmentPool } from './recruitment-pools.ts';
import type { ArmyUnit, Fighter } from './unit-merging.ts';
import { restoreCampaignRoster, restoreNextUnitId } from './campaign-roster.ts';
import { reconcileArmyCapacity } from './army-capacity-migration.ts';
import { reconcileUnitFootprints } from './unit-footprint.ts';
import { decodeCampaignSave, SAVE_SCHEMA_VERSION } from './campaign-save.ts';
import { CAMPAIGN_VERSION, WAVE_DEFINITIONS } from './waves.ts';
import { restoreOnboardingCompleted } from './onboarding.ts';
import type { DungeonClearId } from './dungeons.ts';

export const AUTO_WAVES_DEFAULT_VERSION = 1;

export interface CampaignOfflineRewards {
  gold: number;
  slaves: number;
  slotRefund: number;
  returnedFighters: number;
  closedCells: number;
  forgeRefund: number;
}

export interface CampaignState {
  gold: number;
  nextUnitId: number;
  units: ArmyUnit[];
  reserve: Fighter[];
  recruitment: RecruitmentState;
  recruitmentPool: RecruitmentPool;
  barracks: BarracksState;
  forge: ForgeState;
  farm: FarmState;
  kitchen: KitchenState;
  capitol: CapitolState;
  hero: HeroState;
  starterSupplyGranted: boolean;
  marketHintCompleted: boolean;
  onboardingCompleted: boolean;
  clearedWaves: number;
  dungeonClears: DungeonClearId[];
  economy: EconomyState;
  progression: Progression;
  autoWaves: boolean;
  offlineRewards: CampaignOfflineRewards;
}

export interface CampaignSnapshot extends CampaignState {
  saveSchemaVersion: typeof SAVE_SCHEMA_VERSION;
  campaignVersion: typeof CAMPAIGN_VERSION;
  autoWavesDefaultVersion: typeof AUTO_WAVES_DEFAULT_VERSION;
}

function assertClock(now: number): void {
  if (!Number.isSafeInteger(now) || now <= 0) throw new RangeError('Invalid campaign clock');
}

function savedPositiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function addReceipt(value: unknown, refund: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, savedPositiveInteger(value) + refund);
}

export function createCampaignState(now: number): CampaignState {
  assertClock(now);
  const economy = createEconomy();
  economy.slaves = STARTING_SLAVES;
  checkpointTreasury(economy, now);
  checkpointMarket(economy, now);
  return {
    gold: STARTING_GOLD, nextUnitId: 1, units: [], reserve: [],
    recruitment: createRecruitment(), recruitmentPool: 'humans', barracks: createBarracks(undefined, now),
    forge: createForge(), farm: createFarm(undefined, now), kitchen: createKitchen(), capitol: createCapitol(), hero: createHero(),
    starterSupplyGranted: true, marketHintCompleted: false, onboardingCompleted: false, clearedWaves: 0,
    economy, progression: createProgression(), dungeonClears: [], autoWaves: true,
    offlineRewards: { gold: 0, slaves: 0, slotRefund: 0, returnedFighters: 0, closedCells: 0, forgeRefund: 0 },
  };
}

export function resetCampaignState(state: Readonly<CampaignState>, now: number): CampaignState {
  const fresh = createCampaignState(now);
  // Resetting progress must not make previously consumed command targets valid
  // again. Player preferences and acknowledged hints also survive the reset.
  fresh.nextUnitId = restoreNextUnitId(state.nextUnitId, state.units, state.reserve);
  fresh.autoWaves = state.autoWaves;
  fresh.marketHintCompleted = state.marketHintCompleted;
  return fresh;
}

export function restoreCampaignState(value: unknown, now: number): CampaignState {
  assertClock(now);
  const saved = decodeCampaignSave(value);
  const recruitment = createRecruitment(saved.recruitment);
  const barracks = createBarracks(saved.barracks, now);
  const forgeMigration = restoreForge(saved.forge);
  const progression = createProgression(saved.progression);
  const restored = restoreCampaignRoster(saved.units, saved.reserve, progression, saved.nextUnitId);
  // Close obsolete purchased cells before reconciling wider fighter footprints;
  // every displaced fighter keeps the same ID when moved into the reserve.
  const capacityMigration = reconcileArmyCapacity(progression, restored, barracks.level);
  const footprintMigration = reconcileUnitFootprints(capacityMigration.units, capacityMigration.reserve, progression.unlockedCells);
  const economy = createEconomy(saved.economy);
  if (saved.starterSupplyGranted !== true && !footprintMigration.units.length
    && !footprintMigration.reserve.length && economy.slaves === 0) economy.slaves = STARTING_SLAVES;
  // Existing checkpoints must remain untouched until the offline-income command
  // consumes the absence; legacy saves without timestamps start tracking now.
  if (economy.treasuryUpdatedAt === null) checkpointTreasury(economy, now);
  if (economy.marketUpdatedAt === null) checkpointMarket(economy, now);
  const rewards = Object(saved.offlineRewards) as Record<string, unknown>;
  return {
    gold: Math.min(Number.MAX_SAFE_INTEGER, Math.floor(saved.gold) + capacityMigration.refund + forgeMigration.refund),
    nextUnitId: restored.nextUnitId, units: footprintMigration.units, reserve: footprintMigration.reserve,
    recruitment, recruitmentPool: normalizeRecruitmentPool(saved.recruitmentPool, barracks.level), barracks,
    forge: forgeMigration.forge, farm: createFarm(saved.farm, now), kitchen: createKitchen(saved.kitchen, now), capitol: createCapitol(saved.capitol), hero: createHero(saved.hero),
    starterSupplyGranted: true,
    marketHintCompleted: saved.marketHintCompleted === true || Object.values(recruitment.received).some(count => count > 0),
    onboardingCompleted: restoreOnboardingCompleted(saved),
    clearedWaves: Math.max(0, Math.min(WAVE_DEFINITIONS.length, Math.floor(Number(saved.clearedWaves) || 0))),
    economy, progression, dungeonClears: saved.dungeonClears,
    autoWaves: saved.autoWavesDefaultVersion === AUTO_WAVES_DEFAULT_VERSION ? saved.autoWaves !== false : true,
    offlineRewards: {
      gold: savedPositiveInteger(rewards.gold), slaves: savedPositiveInteger(rewards.slaves),
      slotRefund: addReceipt(rewards.slotRefund, capacityMigration.refund),
      returnedFighters: addReceipt(rewards.returnedFighters, capacityMigration.movedCount + footprintMigration.movedCount),
      closedCells: addReceipt(rewards.closedCells, capacityMigration.removedCells.length),
      forgeRefund: addReceipt(rewards.forgeRefund, forgeMigration.refund),
    },
  };
}

export function campaignSnapshot(state: Readonly<CampaignState>): CampaignSnapshot {
  // Own every nested value: callers may queue this payload while gameplay keeps
  // changing, without changing either the pending save or the live campaign.
  return structuredClone({
    saveSchemaVersion: SAVE_SCHEMA_VERSION, campaignVersion: CAMPAIGN_VERSION,
    gold: state.gold, nextUnitId: state.nextUnitId, units: state.units, reserve: state.reserve,
    recruitment: state.recruitment, recruitmentPool: state.recruitmentPool, barracks: state.barracks,
    forge: state.forge, farm: state.farm, kitchen: state.kitchen, capitol: state.capitol, hero: state.hero,
    starterSupplyGranted: state.starterSupplyGranted, marketHintCompleted: state.marketHintCompleted,
    onboardingCompleted: state.onboardingCompleted,
    clearedWaves: state.clearedWaves, economy: state.economy, progression: state.progression,
    dungeonClears: state.dungeonClears,
    autoWaves: state.autoWaves, autoWavesDefaultVersion: AUTO_WAVES_DEFAULT_VERSION,
    offlineRewards: state.offlineRewards,
  });
}
