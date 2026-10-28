import { CELL_UNLOCK_COSTS, STARTING_CELLS, createProgression, getArmyCapacity, isValidCell } from './progression.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import type { CellKey, Progression } from './progression.ts';
import type { ArmyUnit, Fighter } from './unit-merging.ts';

export interface CampaignRoster {
  units: ArmyUnit[];
  reserve: Fighter[];
}

export interface ArmyCapacityMigration extends CampaignRoster {
  removedCells: CellKey[];
  refund: number;
  movedCount: number;
}

function assertNormalizedState(progression: Progression, roster: CampaignRoster): void {
  const normalized = createProgression(progression);
  if (!progression || !Array.isArray(progression.unlockedCells)
    || progression.unlockedCells.length !== normalized.unlockedCells.length
    || progression.unlockedCells.some((key, index) => key !== normalized.unlockedCells[index])
    || !roster || !Array.isArray(roster.units) || !Array.isArray(roster.reserve)) {
    throw new TypeError('Restore progression and roster before reconciling army capacity');
  }
  const fighters = [...roster.units, ...roster.reserve];
  if (fighters.some(fighter => !fighter || !Number.isSafeInteger(fighter.id) || fighter.id <= 0
    || typeof fighter.type !== 'string' || !Object.hasOwn(UNIT_TYPE_BY_ID, fighter.type)
    || !Number.isSafeInteger(fighter.level) || fighter.level < 1)
    || new Set(fighters.map(fighter => fighter.id)).size !== fighters.length) {
    throw new TypeError('Army capacity migration requires normalized fighters with unique IDs');
  }
  const occupied = new Set<string>();
  for (const unit of roster.units) {
    if (!Number.isInteger(unit.col) || !Number.isInteger(unit.row)) throw new TypeError('Invalid deployed fighter position');
    const key = `${unit.col}:${unit.row}`;
    if (!isValidCell(key) || !progression.unlockedCells.includes(key) || occupied.has(key)) {
      throw new TypeError('Invalid deployed fighter position');
    }
    occupied.add(key);
  }
}

// Restore against the old cells first so fighters in cells being closed still exist.
// The returned roster and updated progression must be persisted together with the refund.
export function reconcileArmyCapacity(progression: Progression, roster: CampaignRoster, barracksLevel: number = 1): ArmyCapacityMigration {
  assertNormalizedState(progression, roster);
  const capacity = getArmyCapacity(barracksLevel);
  const centralQuota = Math.min(9, capacity);
  const sideQuota = capacity - centralQuota;
  let retainedCentral = 0;
  let retainedSides = 0;
  // Normalization puts the three starter cells first; retain the earliest later
  // purchases independently in each area, including the tier-I central limit.
  const removedCells = progression.unlockedCells.filter(key => key[0] === '0' || key[0] === '4'
    ? retainedSides++ >= sideQuota : retainedCentral++ >= centralQuota);
  const removed = new Set<string>(removedCells);
  const retainedCells = progression.unlockedCells.filter(key => !removed.has(key));
  const moved = roster.units.filter(unit => removed.has(`${unit.col}:${unit.row}`));
  // Prices belong to the number of purchased cells, with no saved per-cell ledger.
  // Refund the cumulative difference so the retained cells keep the same net cost
  // as a fresh army, and a later repurchase follows the unchanged price ladder.
  const refund = CELL_UNLOCK_COSTS.slice(retainedCells.length - STARTING_CELLS.length,
    progression.unlockedCells.length - STARTING_CELLS.length).reduce((sum, cost) => sum + cost, 0);
  const result: ArmyCapacityMigration = {
    units: roster.units.filter(unit => !removed.has(`${unit.col}:${unit.row}`)),
    reserve: [...roster.reserve, ...moved.map(({ id, type, level }) => ({ id, type, level }))],
    removedCells, refund, movedCount: moved.length,
  };
  // Removing the cells is the migration marker: subsequent loads cannot refund twice.
  if (removedCells.length > 0) progression.unlockedCells = retainedCells;
  return result;
}
