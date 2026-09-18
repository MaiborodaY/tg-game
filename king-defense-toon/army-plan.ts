import { createProgression, isValidCell } from './progression.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import type { Progression } from './progression.ts';
import type { EconomyState } from './economy.ts';
import type { ArmyUnit } from './unit-merging.ts';

export interface ArmyPlan<Unit extends ArmyUnit = ArmyUnit> {
  units: Unit[];
  nextId: number;
  progression: Progression;
  goldDelta: number;
  slaveDelta: number;
}
export type ArmyPlanCommitResult<Unit extends ArmyUnit = ArmyUnit> =
  | { error: string }
  | { gold: number; units: Unit[]; nextId: number };

export function createArmyPlan<Unit extends ArmyUnit>(units: readonly Unit[], nextId: number, progression: unknown): ArmyPlan<Unit> {
  return { units: units.map(unit => ({ ...unit })), nextId,
    progression: createProgression(progression), goldDelta: 0, slaveDelta: 0 };
}

export function armyPlanWallet(plan: Pick<ArmyPlan, 'goldDelta' | 'slaveDelta'>, gold: number, slaves: number): { gold: number; slaves: number } {
  return { gold: gold + plan.goldDelta, slaves: slaves + plan.slaveDelta };
}

export function commitArmyPlan<Unit extends ArmyUnit>(plan: ArmyPlan<Unit>, gold: number,
  economy: Pick<EconomyState, 'slaves'>, progression: Pick<Progression, 'unlockedCells'>): ArmyPlanCommitResult<Unit> {
  const wallet = armyPlanWallet(plan, gold, economy.slaves);
  if (!plan.units.length) return { error: 'Keep at least one guard in your army.' };
  if (wallet.gold < 0 || wallet.slaves < 0) return { error: 'Not enough resources. Adjust your army.' };
  const cells = new Set<string>();
  const ids = new Set<number>();
  for (const unit of plan.units) {
    const cell = `${unit.col}:${unit.row}`;
    if (!UNIT_TYPE_BY_ID[unit.type] || !isValidCell(cell) || cells.has(cell) || ids.has(unit.id)
      || !plan.progression.unlockedCells.includes(cell) || !Number.isInteger(unit.level) || unit.level < 1 || unit.level > 4) {
      return { error: 'Choose a valid position for every guard.' };
    }
    cells.add(cell); ids.add(unit.id);
  }
  // Commit only edited fields: battles may have earned gold, captures and first-clear rewards meanwhile.
  economy.slaves = wallet.slaves;
  progression.unlockedCells = [...plan.progression.unlockedCells];
  return { gold: wallet.gold, units: plan.units.map(unit => ({ ...unit })), nextId: plan.nextId };
}
