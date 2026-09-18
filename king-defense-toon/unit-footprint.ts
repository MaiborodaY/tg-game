import { FIELD, positionForCell } from './field.ts';
import type { Point } from './field.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import type { UnitType } from './units.ts';
import type { ArmyUnit, Fighter } from './unit-merging.ts';

export interface UnitFootprint { type: UnitType; col: number; row: number }
export interface IdentifiedUnitFootprint extends UnitFootprint { id: number | string }
type Occupant = UnitFootprint & { id?: number | string };

export function getUnitCellWidth(type: UnitType): 1 | 2 {
  return type === 'pantherRider' ? 2 : 1;
}

export function getUnitCells(unit: Readonly<UnitFootprint>): string[] {
  // Keep out-of-bounds cells: clipping an edge rider would incorrectly make it fit.
  return Array.from({ length: getUnitCellWidth(unit.type) }, (_, offset) => `${unit.col + offset}:${unit.row}`);
}

function insideField(col: number, row: number): boolean {
  return Number.isInteger(col) && Number.isInteger(row)
    && col >= 0 && col < FIELD.columns && row >= 0 && row < FIELD.rows;
}

export function getUnitAtCell<T extends UnitFootprint>(units: readonly T[], col: number, row: number): T | undefined {
  if (!insideField(col, row)) return undefined;
  const key = `${col}:${row}`;
  return units.find(unit => getUnitCells(unit).includes(key));
}

export function canPlaceUnit(unit: Readonly<UnitFootprint>, units: readonly Occupant[],
  unlockedCells: readonly string[], ignoredIds: readonly (number | string)[] = []): boolean {
  if (!Object.hasOwn(UNIT_TYPE_BY_ID, unit.type) || !insideField(unit.col, unit.row)
    || !insideField(unit.col + getUnitCellWidth(unit.type) - 1, unit.row)) return false;
  const cells = getUnitCells(unit);
  if (!cells.every(cell => unlockedCells.includes(cell))) return false;
  const ignored = new Set(ignoredIds);
  return units.every(other => (other.id !== undefined && ignored.has(other.id))
    || !getUnitCells(other).some(cell => cells.includes(cell)));
}

export function getUnitPosition(unit: Readonly<UnitFootprint>): Point {
  const position = positionForCell(unit.col, unit.row);
  return { ...position, x: position.x + (getUnitCellWidth(unit.type) - 1) * FIELD.cellWidth / 2 };
}

export function planFormationMove<T extends IdentifiedUnitFootprint>(units: readonly T[], id: T['id'],
  col: number, row: number, unlockedCells: readonly string[]): { ok: boolean; units: T[] } {
  const unchanged = (): { ok: false; units: T[] } => ({ ok: false, units: units.map(unit => ({ ...unit })) });
  if (new Set(units.map(unit => unit.id)).size !== units.length) return unchanged();
  const source = units.find(unit => unit.id === id);
  if (!source) return unchanged();
  const moved = { ...source, col, row };
  if (!canPlaceUnit(moved, [], unlockedCells)) return unchanged();
  const cells = new Set(getUnitCells(moved));
  const blockers = units.filter(unit => unit.id !== id && getUnitCells(unit).some(cell => cells.has(cell)));
  if (blockers.length > 1) return unchanged();
  const blocker = blockers[0];
  const planned = units.map(unit => unit.id === id ? moved
    : unit === blocker ? { ...unit, col: source.col, row: source.row } : { ...unit });
  // A swap must fit both complete footprints, including the rider's second cell.
  if (!planned.every(unit => canPlaceUnit(unit, planned, unlockedCells, [unit.id]))) return unchanged();
  return { ok: true, units: planned };
}

export function reconcileUnitFootprints(units: readonly ArmyUnit[], reserve: readonly Fighter[],
  unlockedCells: readonly string[]): { units: ArmyUnit[]; reserve: Fighter[]; movedCount: number } {
  const kept = new Set<ArmyUnit>();
  const occupied: ArmyUnit[] = [];
  // Existing one-cell fighters retain their anchors before wider riders claim space.
  for (const unit of [...units.filter(unit => getUnitCellWidth(unit.type) === 1),
    ...units.filter(unit => getUnitCellWidth(unit.type) === 2)]) {
    if (!canPlaceUnit(unit, occupied, unlockedCells)) continue;
    kept.add(unit);
    occupied.push(unit);
  }
  const moved = units.filter(unit => !kept.has(unit));
  return {
    units: units.filter(unit => kept.has(unit)).map(unit => ({ ...unit })),
    reserve: [...reserve.map(unit => ({ ...unit })), ...moved.map(({ col: _col, row: _row, ...fighter }) => fighter)],
    movedCount: moved.length,
  };
}
