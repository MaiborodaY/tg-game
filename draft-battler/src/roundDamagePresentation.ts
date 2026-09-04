import type { BoardSlot, Owner, SynergyThreshold, UnitTag } from "./game/types";
import type { RoundInsightDamageSourceAmount, RoundInsightUnitRef } from "./roundInsights";

export interface RoundDamageUnitTotal {
  unit: RoundInsightUnitRef;
  amount: number;
}

export interface RoundDamageSynergyTotal {
  tag: UnitTag;
  threshold: SynergyThreshold;
  amount: number;
}

export interface RoundDamagePresentation {
  unitLeaders: RoundDamageUnitTotal[];
  synergies: RoundDamageSynergyTotal[];
}

export function createRoundDamagePresentation(
  owner: Owner,
  slots: readonly BoardSlot[],
  sources: readonly RoundInsightDamageSourceAmount[],
): RoundDamagePresentation {
  const registry = createUnitRegistry(owner, slots, sources);
  const unitTotals = new Map<string, RoundDamageUnitTotal>();
  const synergyTotals = new Map<string, RoundDamageSynergyTotal>();

  sources.forEach((entry) => {
    const amount = entry.hpDamage + entry.armorDamage;
    if (amount <= 0) {
      return;
    }

    if (entry.source.kind === "unit") {
      const creditedId = entry.source.unit.summonedBy ?? entry.source.unit.instanceId;
      const creditedUnit = registry.get(creditedId) ?? entry.source.unit;
      const existing = unitTotals.get(creditedId);
      if (existing) {
        existing.amount += amount;
      } else {
        unitTotals.set(creditedId, { unit: creditedUnit, amount });
      }
      return;
    }

    const key = `${entry.source.tag}:${entry.source.threshold}`;
    const existing = synergyTotals.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      synergyTotals.set(key, {
        tag: entry.source.tag,
        threshold: entry.source.threshold,
        amount,
      });
    }
  });

  const rankedUnits = [...unitTotals.values()].sort(compareUnitDamage);
  const leaderAmount = rankedUnits[0]?.amount;
  return {
    unitLeaders: leaderAmount === undefined
      ? []
      : rankedUnits.filter((entry) => entry.amount === leaderAmount),
    synergies: [...synergyTotals.values()].sort((left, right) =>
      right.amount - left.amount
        || left.tag.localeCompare(right.tag)
        || left.threshold - right.threshold),
  };
}

function createUnitRegistry(
  owner: Owner,
  slots: readonly BoardSlot[],
  sources: readonly RoundInsightDamageSourceAmount[],
): Map<string, RoundInsightUnitRef> {
  const registry = new Map<string, RoundInsightUnitRef>();
  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }
    const unit = {
      instanceId: `${owner}-${slot.slotIndex}-${slot.cardId}`,
      cardId: slot.cardId,
      slotIndex: slot.slotIndex,
      upgradeLevel: slot.upgradeLevel,
    } satisfies RoundInsightUnitRef;
    registry.set(unit.instanceId, unit);
  });
  sources.forEach((entry) => {
    if (entry.source.kind === "unit") {
      registry.set(entry.source.unit.instanceId, entry.source.unit);
    }
  });
  return registry;
}

function compareUnitDamage(left: RoundDamageUnitTotal, right: RoundDamageUnitTotal): number {
  return right.amount - left.amount
    || (left.unit.slotIndex ?? Number.MAX_SAFE_INTEGER) - (right.unit.slotIndex ?? Number.MAX_SAFE_INTEGER)
    || left.unit.instanceId.localeCompare(right.unit.instanceId);
}
