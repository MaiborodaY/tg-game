import type { ArmyUnit, Fighter } from './unit-merging.ts';
import type { Progression } from './progression.ts';
import type { UnitType } from './units.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import { normalizeUnitLevel } from './recruitment.ts';

function savedFields(value: unknown): Record<string, unknown> {
  return Object(value) as Record<string, unknown>;
}

function isUnitType(value: unknown): value is UnitType {
  // Saved IDs must name a catalogue entry, never an inherited Object property.
  return typeof value === 'string' && Object.hasOwn(UNIT_TYPE_BY_ID, value);
}

export function restoreCampaignRoster(savedUnits: unknown, savedReserve: unknown,
  progression: Pick<Progression, 'unlockedCells'>): { units: ArmyUnit[]; reserve: Fighter[] } {
  const occupied = new Set<string>();
  const armyEntries: unknown[] = Array.isArray(savedUnits) ? savedUnits : [];
  const units = armyEntries.map(savedFields).filter((unit): unit is Record<string, unknown> & { type: UnitType; col: number; row: number } => {
    if (!isUnitType(unit.type) || typeof unit.col !== 'number' || typeof unit.row !== 'number'
      || !Number.isInteger(unit.col) || !Number.isInteger(unit.row)
      || unit.col < 0 || unit.col > 4 || unit.row < 0 || unit.row > 2) return false;
    const key = `${unit.col}:${unit.row}`;
    if (occupied.has(key)) return false;
    if (!(progression.unlockedCells as readonly string[]).includes(key)) return false;
    occupied.add(key);
    return true;
  }).map((unit, index) => ({ id: index + 1, type: unit.type, col: unit.col, row: unit.row,
    level: normalizeUnitLevel(unit.level) }));
  const reserveEntries: unknown[] = Array.isArray(savedReserve) ? savedReserve : [];
  const reserve = reserveEntries.map(savedFields)
    .filter((unit): unit is Record<string, unknown> & { type: UnitType } => isUnitType(unit.type))
    .map((unit, index) => ({ id: units.length + index + 1, type: unit.type, level: normalizeUnitLevel(unit.level) }));
  return { units, reserve };
}
