import type { CampaignState } from './campaign-state.ts';
import { allocateCampaignUnitId } from './campaign-roster.ts';
import { RECRUIT_COST, receiveRecruit } from './recruitment.ts';
import { canRecruitFromPool, isRecruitmentPoolUnlocked } from './recruitment-pools.ts';
import type { RecruitmentPool } from './recruitment-pools.ts';
import { SELL_PRICE, completeBarracksUpgrade, consumeFirstLancerGuarantee, startBarracksUpgrade, speedUpBarracks } from './barracks.ts';
import { getMergeResult, getConnectResult } from './unit-merging.ts';
import type { MergeSource } from './unit-merging.ts';
import { canPlaceUnit, getUnitAtCell, planFormationMove } from './unit-footprint.ts';
import { isValidCell, unlockCell } from './progression.ts';
import { upgradeForge } from './forge.ts';
import type { ForgeUpgradeId } from './forge.ts';
import { upgradeCapitol } from './capitol.ts';
import type { CapitolUpgradeId } from './capitol.ts';
import { upgradeTreasury, accrueTreasury, checkpointTreasury, claimOfflineTreasury, advanceCaptureClock } from './economy.ts';
import { buildMarket, accrueMarket, checkpointMarket, claimOfflineMarket } from './market.ts';
import { plantCrop, harvestCrop } from './farm.ts';
import type { CropId } from './farm.ts';
import { spendHeroTalent, resetHeroTalents } from './hero.ts';
import type { TalentId } from './hero.ts';
import { WAVE_DEFINITIONS } from './waves.ts';

const fail = <Reason extends string>(reason: Reason): { ok: false; reason: Reason } => ({ ok: false, reason });
const validId = (id: unknown): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
const validAmount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const validTime = (now: unknown): now is number => validId(now);
const safeSum = (left: number, right: number): boolean => validAmount(left) && validAmount(right)
  && left <= Number.MAX_SAFE_INTEGER - right;
const validOptions = (options: unknown): boolean => options !== null && typeof options === 'object' && !Array.isArray(options);
export interface FormationCommandContext { minArmyUnits: number }

// Commands own durable mutations. UI state and live combat actors never enter them.
// Work on the affected records first so even a late rejection preserves the campaign.
export function recruitFighter(state: CampaignState, options: { now: number; random: () => number }) {
  if (!validOptions(options)) return fail('invalid-options');
  const { now, random } = options;
  if (!validTime(now)) return fail('invalid-time');
  if (typeof random !== 'function') return fail('invalid-random');
  if (!validAmount(state.economy.slaves) || state.economy.slaves < RECRUIT_COST) return fail('insufficient-slaves');
  if (!validId(state.nextUnitId)) return fail('ids-exhausted');
  const barracks = { ...state.barracks };
  completeBarracksUpgrade(barracks, now);
  if (!canRecruitFromPool(state.recruitmentPool, barracks.level)) return fail('pool-locked');
  const recruitment = { ...state.recruitment, received: { ...state.recruitment.received },
    legacyTrainingCredit: { ...state.recruitment.legacyTrainingCredit } };
  let result;
  try {
    result = receiveRecruit(recruitment, random, { pool: state.recruitmentPool,
      elvesUnlocked: isRecruitmentPoolUnlocked('elves', barracks.level), barracksLevel: barracks.level,
      lancerUnlocked: barracks.level >= 2,
      guaranteedLancer: state.recruitmentPool === 'humans' && barracks.firstLancerPending });
  } catch { return fail('invalid-random'); }
  consumeFirstLancerGuarantee(barracks, result.type);
  const fighter = { id: allocateCampaignUnitId(state), type: result.type, level: result.level };
  state.recruitment = recruitment;
  state.barracks = barracks;
  state.marketHintCompleted = true;
  state.economy.slaves -= RECRUIT_COST;
  state.reserve.push(fighter);
  return { ok: true as const, fighter, ...result };
}

export function selectRecruitmentPool(state: CampaignState, pool: RecruitmentPool) {
  if (pool !== 'humans' && pool !== 'elves') return fail('invalid-pool');
  if (!isRecruitmentPoolUnlocked(pool, state.barracks.level)) return fail('pool-locked');
  state.recruitmentPool = pool;
  return { ok: true as const, pool };
}

export function sellReserveFighters(state: CampaignState, ids: ReadonlySet<number>) {
  if (!(ids instanceof Set) || !ids.size || ![...ids].every(validId)) return fail('invalid-ids');
  const sold = state.reserve.filter(fighter => ids.has(fighter.id));
  if (sold.length !== ids.size) return fail('fighter-missing');
  if (state.units.length + state.reserve.length - sold.length < 1) return fail('last-fighter');
  const gold = sold.length * SELL_PRICE;
  if (!safeSum(state.gold, gold)) return fail('gold-overflow');
  state.reserve = state.reserve.filter(fighter => !ids.has(fighter.id));
  state.gold += gold;
  return { ok: true as const, sold, gold };
}

export function deployReserveFighter(state: CampaignState, id: number, key: string) {
  if (!validId(id)) return fail('invalid-id');
  if (!isValidCell(key) || !state.progression.unlockedCells.includes(key)) return fail('locked-cell');
  const index = state.reserve.findIndex(fighter => fighter.id === id);
  if (index < 0) return fail('fighter-missing');
  const [clickedCol, clickedRow] = key.split(':').map(Number);
  const occupied = getUnitAtCell(state.units, clickedCol, clickedRow);
  const col = occupied?.col ?? clickedCol, row = occupied?.row ?? clickedRow;
  const fighter = { ...state.reserve[index], col, row };
  if (!canPlaceUnit(fighter, state.units, state.progression.unlockedCells, occupied ? [occupied.id] : [])) return fail('no-room');
  const reserve = state.reserve.filter(unit => unit.id !== id);
  if (occupied) reserve.splice(index, 0, { id: occupied.id, type: occupied.type, level: occupied.level });
  state.reserve = reserve;
  state.units = [...state.units.filter(unit => unit.id !== occupied?.id), fighter];
  return { ok: true as const, fighter, replaced: occupied ?? null };
}

export function moveFormationFighter(state: CampaignState, id: number, col: number, row: number) {
  if (!validId(id)) return fail('invalid-id');
  const occupant = getUnitAtCell(state.units, col, row);
  const destination = occupant && occupant.id !== id ? occupant : { col, row };
  const result = planFormationMove(state.units, id, destination.col, destination.row, state.progression.unlockedCells);
  if (!result.ok) return fail('no-room');
  state.units = result.units;
  return { ok: true as const };
}

export function withdrawFormationFighter(state: CampaignState, id: number, options: FormationCommandContext) {
  if (!validId(id)) return fail('invalid-id');
  if (!validOptions(options)) return fail('invalid-options');
  const { minArmyUnits } = options;
  if (!validAmount(minArmyUnits)) return fail('invalid-options');
  const fighter = state.units.find(unit => unit.id === id);
  if (!fighter) return fail('fighter-missing');
  if (state.units.length - 1 < minArmyUnits) return fail('army-minimum');
  state.reserve.push({ id: fighter.id, type: fighter.type, level: fighter.level });
  state.units = state.units.filter(unit => unit.id !== id);
  return { ok: true as const, fighter };
}

export function mergeCampaignFighters(state: CampaignState, source: MergeSource | null | undefined, targetId: number | null | undefined) {
  const result = getMergeResult(state.units, state.reserve, source, targetId);
  if (result.ok) { state.units = result.units; state.reserve = result.reserve; }
  return result;
}

export function connectCampaignFighters(state: CampaignState, recipient: MergeSource, donors: readonly MergeSource[], options: FormationCommandContext) {
  if (!validOptions(options) || !validAmount(options.minArmyUnits)) return fail('invalid-options');
  const result = getConnectResult(state.units, state.reserve, recipient, donors, options);
  if (result.ok) { state.units = result.units; state.reserve = result.reserve; }
  return result;
}

export function purchaseCampaignCell(state: CampaignState, key: string) {
  if (!validAmount(state.gold)) return fail('invalid-gold');
  const progression = { ...state.progression, unlockedCells: [...state.progression.unlockedCells] };
  const result = unlockCell(progression, state.gold, key, state.barracks.level);
  if (!result.unlocked) return fail('unavailable');
  const cost = state.gold - result.gold;
  state.gold = result.gold; state.progression = progression;
  return { ok: true as const, cost };
}

export function purchaseForgeUpgrade(state: CampaignState, upgrade: ForgeUpgradeId) {
  if (!validAmount(state.gold)) return fail('invalid-gold');
  const forge = { ...state.forge }, result = upgradeForge(forge, upgrade, state.gold);
  if (!result.upgraded) return fail('unavailable');
  const cost = state.gold - result.gold;
  state.gold = result.gold; state.forge = forge;
  return { ok: true as const, cost };
}

export function purchaseCapitolUpgrade(state: CampaignState, upgrade: CapitolUpgradeId) {
  const capitol = { ...state.capitol }, result = upgradeCapitol(capitol, upgrade, state.gold);
  if (!result.upgraded) return fail('unavailable');
  const cost = state.gold - result.gold;
  state.gold = result.gold; state.capitol = capitol;
  return { ok: true as const, cost };
}

export function purchaseTreasuryUpgrade(state: CampaignState) {
  if (!validAmount(state.gold)) return fail('invalid-gold');
  const economy = { ...state.economy }, result = upgradeTreasury(economy, state.gold);
  if (!result.upgraded) return fail('unavailable');
  const cost = state.gold - result.gold;
  state.gold = result.gold; state.economy = economy;
  return { ok: true as const, cost };
}

export function purchaseMarket(state: CampaignState, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  if (!validAmount(state.gold)) return fail('invalid-gold');
  const economy = { ...state.economy }, result = buildMarket(economy, state.gold, now);
  if (!result.built) return fail('unavailable');
  const cost = state.gold - result.gold;
  state.gold = result.gold; state.economy = economy;
  return { ok: true as const, cost };
}

export function startCampaignBarracksUpgrade(state: CampaignState, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  const barracks = { ...state.barracks }, result = startBarracksUpgrade(barracks, state.recruitment, state.gold, now);
  if (!result.ok) return fail(result.reason);
  state.gold = result.gold; state.barracks = barracks;
  return { ok: true as const, cost: result.cost };
}

export function finishCampaignBarracksUpgrade(state: CampaignState, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  const barracks = { ...state.barracks }, result = speedUpBarracks(barracks, state.gold, now);
  if (!result.ok) return fail(result.reason);
  state.gold = result.gold; state.barracks = barracks;
  return { ok: true as const, cost: result.cost };
}

export function completeCampaignBarracksUpgrade(state: CampaignState, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  return { ok: true as const, completed: completeBarracksUpgrade(state.barracks, now) };
}

export function plantCampaignCrop(state: CampaignState, crop: CropId, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  const farm = { plots: { ...state.farm.plots }, stock: { ...state.farm.stock } };
  if (!plantCrop(farm, crop, now)) return fail('unavailable');
  state.farm = farm;
  return { ok: true as const };
}

export function harvestCampaignCrop(state: CampaignState, crop: CropId, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  const farm = { plots: { ...state.farm.plots }, stock: { ...state.farm.stock } }, result = harvestCrop(farm, crop, now);
  if (!result.harvested) return fail('unavailable');
  state.farm = farm;
  return { ok: true as const, amount: result.amount };
}

export function learnCampaignHeroTalent(state: CampaignState, talent: TalentId) {
  const hero = { ...state.hero, talents: { ...state.hero.talents } }, result = spendHeroTalent(hero, talent);
  if (!result.spent) return fail(result.reason);
  state.hero = hero;
  return { ok: true as const, rank: result.rank };
}

export function resetCampaignHeroTalents(state: CampaignState, options: { battleRunning: boolean }) {
  if (!validOptions(options)) return fail('invalid-options');
  const { battleRunning } = options;
  if (typeof battleRunning !== 'boolean') return fail('invalid-options');
  if (battleRunning) return fail('battle-running');
  const hero = { ...state.hero, talents: { ...state.hero.talents } }, result = resetHeroTalents(hero);
  if (!result.reset) return fail('no-talents');
  state.hero = hero;
  return { ok: true as const, refunded: result.refunded };
}

export function accrueCampaignEconomy(state: CampaignState, options: { elapsedSeconds: number; now: number }) {
  if (!validOptions(options)) return fail('invalid-options');
  const { elapsedSeconds, now } = options;
  if (!validTime(now) || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return fail('invalid-time');
  const economy = { ...state.economy }, barracks = { ...state.barracks };
  const gold = accrueTreasury(economy, elapsedSeconds), slaves = accrueMarket(economy, elapsedSeconds);
  if (!safeSum(state.gold, gold) || !validAmount(economy.slaves)) return fail('resource-overflow');
  const barracksFinished = completeBarracksUpgrade(barracks, now);
  checkpointTreasury(economy, now); checkpointMarket(economy, now);
  advanceCaptureClock(economy, elapsedSeconds);
  state.gold += gold; state.economy = economy; state.barracks = barracks;
  return { ok: true as const, gold, slaves, barracksFinished };
}

export function claimCampaignOfflineIncome(state: CampaignState, now: number) {
  if (!validTime(now)) return fail('invalid-time');
  const economy = { ...state.economy }, barracks = { ...state.barracks };
  const gold = claimOfflineTreasury(economy, now).gold, slaves = claimOfflineMarket(economy, now).slaves;
  if (!safeSum(state.gold, gold) || !validAmount(economy.slaves)
    || !safeSum(state.offlineRewards.gold, gold) || !safeSum(state.offlineRewards.slaves, slaves)) return fail('resource-overflow');
  const barracksFinished = completeBarracksUpgrade(barracks, now);
  state.gold += gold; state.economy = economy; state.barracks = barracks;
  state.offlineRewards.gold += gold; state.offlineRewards.slaves += slaves;
  return { ok: true as const, gold, slaves, barracksFinished };
}

export function acknowledgeOfflineRewards(state: CampaignState) {
  const rewards = { ...state.offlineRewards };
  state.offlineRewards = { gold: 0, slaves: 0, slotRefund: 0, returnedFighters: 0, closedCells: 0, forgeRefund: 0 };
  return { ok: true as const, rewards };
}

export function setCampaignAutoWaves(state: CampaignState, enabled: boolean) {
  if (typeof enabled !== 'boolean') return fail('invalid-option');
  state.autoWaves = enabled;
  return { ok: true as const };
}

export function resetCampaignCycle(state: CampaignState) {
  if (state.clearedWaves !== WAVE_DEFINITIONS.length) return fail('incomplete-campaign');
  state.clearedWaves = 0;
  return { ok: true as const };
}
