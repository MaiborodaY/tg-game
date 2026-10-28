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

// Every fighter ID remains a safe integer. This exactly representable cursor
// means the final ID was consumed; it may be saved, but never allocated.
export const EXHAUSTED_UNIT_ID = Number.MAX_SAFE_INTEGER + 1;

export function isUnitIdCursor(value: unknown): value is number {
  return typeof value === 'number' && (Number.isSafeInteger(value) && value > 0 || value === EXHAUSTED_UNIT_ID);
}

function isUnitId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function restoreNextUnitId(savedNextUnitId: unknown, savedUnits: unknown, savedReserve: unknown): number {
  let nextUnitId = isUnitIdCursor(savedNextUnitId) ? savedNextUnitId : 1;
  // Even rejected roster entries may name IDs previously used by this campaign.
  // Never recycle those IDs when malformed placement or unit data is removed.
  for (const source of [savedUnits, savedReserve]) {
    if (!Array.isArray(source)) continue;
    for (const value of source as unknown[]) {
      const id = savedFields(value).id;
      if (isUnitId(id)) nextUnitId = Math.max(nextUnitId, id + 1);
    }
  }
  return nextUnitId;
}

export function allocateCampaignUnitId(state: { nextUnitId: number }): number {
  if (!isUnitId(state.nextUnitId)) throw new RangeError('Campaign fighter IDs are exhausted or invalid');
  const id = state.nextUnitId;
  state.nextUnitId += 1;
  return id;
}

export function restoreCampaignRoster(savedUnits: unknown, savedReserve: unknown,
  progression: Pick<Progression, 'unlockedCells'>, savedNextUnitId?: unknown): {
    units: ArmyUnit[]; reserve: Fighter[]; nextUnitId: number;
  } {
  const occupied = new Set<string>();
  const assigned = new Set<number>();
  const cursor = { nextUnitId: restoreNextUnitId(savedNextUnitId, savedUnits, savedReserve) };
  const restoreId = (saved: unknown): number => {
    const id = isUnitId(saved) && !assigned.has(saved) ? saved : allocateCampaignUnitId(cursor);
    assigned.add(id);
    return id;
  };
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
  }).map(unit => ({ id: restoreId(unit.id), type: unit.type, col: unit.col, row: unit.row,
    level: normalizeUnitLevel(unit.level) }));
  const reserveEntries: unknown[] = Array.isArray(savedReserve) ? savedReserve : [];
  const reserve = reserveEntries.map(savedFields)
    .filter((unit): unit is Record<string, unknown> & { type: UnitType } => isUnitType(unit.type))
    .map(unit => ({ id: restoreId(unit.id), type: unit.type, level: normalizeUnitLevel(unit.level) }));
  return { units, reserve, nextUnitId: cursor.nextUnitId };
}
