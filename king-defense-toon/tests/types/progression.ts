import { claimFirstClear, createProgression, getArmyCapacity, getCellAvailability, isValidCell,
  migrateCampaignSave, nextCellCost, STARTING_CELLS, unlockCell } from '../../progression.ts';
import type { CellKey, Progression } from '../../progression.ts';
import { reconcileArmyCapacity } from '../../army-capacity-migration.ts';

// Compile-only checks keep untrusted save fields separate from validated state.
export function verifyProgressionContracts(saved: unknown): void {
  const progression: Progression = createProgression(saved);
  const cost: number | null = nextCellCost(progression);
  const capacity: 9 | 10 | 11 = getArmyCapacity(3);
  const gated = getCellAvailability(progression, '0:0', 2);
  getCellAvailability({ unlockedCells: STARTING_CELLS }, '0:0', 2);
  nextCellCost({ unlockedCells: STARTING_CELLS }, 2);
  const requirement: 2 | 3 | null = gated.requiredBarracksLevel;
  const migratedArmy = reconcileArmyCapacity(progression, { units: [], reserve: [] }, 3);
  const removed: CellKey[] = migratedArmy.removedCells;
  const migrated = migrateCampaignSave(saved);
  if (isValidCell(saved)) {
    const cell: CellKey = saved;
    unlockCell(progression, 100, cell);
  }
  // @ts-expect-error A migrated record has not validated the player's gold.
  const gold: number = migrated?.gold;
  // @ts-expect-error Exhausting available cells returns null, not a numeric cost.
  const price: number = nextCellCost(progression);
  // @ts-expect-error A saved claim must be normalized before joining runtime state.
  progression.firstClears.push('10');
  // @ts-expect-error Cell coordinates are restricted to the actual formation grid.
  progression.unlockedCells.push('5:0');
  // @ts-expect-error Gold passed by gameplay must be numeric.
  unlockCell(progression, '100', '1:0');
  // @ts-expect-error Gameplay must pass a numeric barracks level.
  unlockCell(progression, 100, '1:0', '3');
  // @ts-expect-error The migration takes a restored roster, not raw saved units.
  reconcileArmyCapacity(progression, { units: saved, reserve: [] });
  // @ts-expect-error Reward APIs consume numeric wave indices.
  claimFirstClear(progression, '10');
  // @ts-expect-error Starting formation is shared immutable configuration.
  STARTING_CELLS.push('0:0');
  void [cost, gold, price, capacity, requirement, removed];
}
