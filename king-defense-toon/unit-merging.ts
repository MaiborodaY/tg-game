import { UNIT_TYPE_BY_ID } from './units.ts';
import type { UnitType } from './units.ts';

export interface Fighter {
  id: number;
  type: UnitType;
  level: number;
}
export interface ArmyUnit extends Fighter {
  col: number;
  row: number;
}
export interface MergeSource {
  location: 'army' | 'reserve';
  id: number;
}
export type MergeFailureReason = 'invalid-state' | 'invalid-source' | 'source-missing' | 'target-missing'
  | 'same-unit' | 'different-type' | 'level-overflow';
// A merge preserves custom roster fields, but its new level cannot retain a literal input type.
export type MergedFighter<Unit extends Fighter> = Omit<Unit, 'level'> & { level: number };
export type MergeResult<Army extends Fighter = ArmyUnit, Reserve extends Fighter = Fighter> =
  | { ok: false; reason: MergeFailureReason; units: readonly Army[]; reserve: readonly Reserve[] }
  | { ok: true; reason: null; units: MergedFighter<Army>[]; reserve: Reserve[]; source: Army | Reserve; target: MergedFighter<Army> };
export interface ConnectOptions { minArmyUnits?: number }
export type ConnectFailureReason = 'invalid-state' | 'invalid-options' | 'invalid-recipient' | 'recipient-missing'
  | 'invalid-donors' | 'no-donors' | 'invalid-donor' | 'donor-missing' | 'duplicate-donor'
  | 'same-unit' | 'different-type' | 'level-overflow' | 'army-minimum';
export type ConnectResult<Army extends Fighter = ArmyUnit, Reserve extends Fighter = Fighter> =
  | { ok: false; reason: ConnectFailureReason; units: readonly Army[]; reserve: readonly Reserve[] }
  | { ok: true; reason: null; units: MergedFighter<Army>[]; reserve: MergedFighter<Reserve>[];
    recipient: MergedFighter<Army> | MergedFighter<Reserve>; consumed: (Army | Reserve)[]; addedLevels: number };

const isId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const isFighter = (fighter: Fighter) => fighter && typeof fighter === 'object'
  && isId(fighter.id) && typeof fighter.type === 'string'
  && Object.hasOwn(UNIT_TYPE_BY_ID, fighter.type)
  && Number.isSafeInteger(fighter.level) && fighter.level >= 1;

export function getMergeResult<Army extends Fighter, Reserve extends Fighter>(
  units: readonly Army[], reserve: readonly Reserve[], source: MergeSource | null | undefined, targetId: number | null | undefined,
): MergeResult<Army, Reserve> {
  const fail = (reason: MergeFailureReason): MergeResult<Army, Reserve> => ({ ok: false, reason, units, reserve });
  if (!Array.isArray(units) || !Array.isArray(reserve)) return fail('invalid-state');
  const fighters = [...units, ...reserve];
  if (!fighters.every(isFighter) || new Set(fighters.map(fighter => fighter.id)).size !== fighters.length) {
    return fail('invalid-state');
  }
  if (!source || !['army', 'reserve'].includes(source.location) || !isId(source.id)) {
    return fail('invalid-source');
  }
  const sourceFighter = (source.location === 'army' ? units : reserve).find(fighter => fighter.id === source.id);
  if (!sourceFighter) return fail('source-missing');
  if (!isId(targetId)) return fail('target-missing');
  const target = units.find(fighter => fighter.id === targetId);
  if (!target) return fail('target-missing');
  if (sourceFighter.id === target.id) return fail('same-unit');
  if (sourceFighter.type !== target.type) return fail('different-type');
  // Reject overflow instead of consuming a fighter while silently discarding earned levels.
  if (sourceFighter.level > Number.MAX_SAFE_INTEGER - target.level) return fail('level-overflow');
  const level = sourceFighter.level + target.level;

  const mergedTarget = { ...target, level };
  return {
    ok: true,
    reason: null,
    units: units.filter(fighter => source.location !== 'army' || fighter.id !== sourceFighter.id)
      .map(fighter => fighter.id === target.id ? mergedTarget : { ...fighter }),
    reserve: reserve.filter(fighter => source.location !== 'reserve' || fighter.id !== sourceFighter.id)
      .map(fighter => ({ ...fighter })),
    source: sourceFighter,
    target: mergedTarget,
  };
}

function isMergeSource(value: unknown): value is MergeSource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const source = value as Partial<MergeSource>;
  return (source.location === 'army' || source.location === 'reserve') && isId(source.id);
}

export function getConnectResult<Army extends Fighter, Reserve extends Fighter>(
  units: readonly Army[], reserve: readonly Reserve[], recipient: MergeSource | null | undefined,
  donors: readonly MergeSource[], options?: ConnectOptions,
): ConnectResult<Army, Reserve> {
  const fail = (reason: ConnectFailureReason): ConnectResult<Army, Reserve> => ({ ok: false, reason, units, reserve });
  if (!Array.isArray(units) || !Array.isArray(reserve)) return fail('invalid-state');
  const fighters = [...units, ...reserve];
  if (!fighters.every(fighter => !Array.isArray(fighter) && isFighter(fighter))
    || new Set(fighters.map(fighter => fighter.id)).size !== fighters.length) {
    return fail('invalid-state');
  }
  if (options !== undefined && (!options || typeof options !== 'object' || Array.isArray(options))) {
    return fail('invalid-options');
  }
  const minArmyUnits = options?.minArmyUnits === undefined ? 0 : options.minArmyUnits;
  if (!Number.isSafeInteger(minArmyUnits) || minArmyUnits < 0) return fail('invalid-options');
  if (!isMergeSource(recipient)) return fail('invalid-recipient');
  const target = (recipient.location === 'army' ? units : reserve).find(fighter => fighter.id === recipient.id);
  if (!target) return fail('recipient-missing');
  if (!Array.isArray(donors)) return fail('invalid-donors');
  if (donors.length === 0) return fail('no-donors');

  let level = target.level, armyDonors = 0;
  const donorIds = new Set<number>();
  const consumed: (Army | Reserve)[] = [];
  for (const source of donors) {
    if (!isMergeSource(source)) return fail('invalid-donor');
    if (source.id === target.id) return fail('same-unit');
    if (donorIds.has(source.id)) return fail('duplicate-donor');
    const donor = (source.location === 'army' ? units : reserve).find(fighter => fighter.id === source.id);
    if (!donor) return fail('donor-missing');
    if (donor.type !== target.type) return fail('different-type');
    if (donor.level > Number.MAX_SAFE_INTEGER - level) return fail('level-overflow');
    level += donor.level;
    armyDonors += Number(source.location === 'army');
    donorIds.add(donor.id);
    consumed.push({ ...donor });
  }
  if (units.length - armyDonors < minArmyUnits) return fail('army-minimum');

  // Validate the entire batch before making output copies. Its recipient stays in
  // the same collection and formation cells; removing donors never shifts allies.
  const connectedUnits = units.filter(fighter => !donorIds.has(fighter.id))
    .map(fighter => ({ ...fighter, level: fighter.id === target.id ? level : fighter.level }));
  const connectedReserve = reserve.filter(fighter => !donorIds.has(fighter.id))
    .map(fighter => ({ ...fighter, level: fighter.id === target.id ? level : fighter.level }));
  const connectedRecipient = (recipient.location === 'army' ? connectedUnits : connectedReserve)
    .find(fighter => fighter.id === target.id)!;
  return { ok: true, reason: null, units: connectedUnits, reserve: connectedReserve,
    recipient: connectedRecipient, consumed, addedLevels: level - target.level };
}
