import type {
  BoardSlot,
  CardId,
  CombatEvent,
  CombatUnit,
  CombatWinner,
  Owner,
  RoundRecord,
  SynergyThreshold,
  UnitTag,
} from "./game/types";

type SynergyAppliedCombatEvent = Extract<CombatEvent, { type: "synergy_applied" }>;

export interface RoundInsightUnitRef {
  instanceId: string;
  cardId?: CardId;
  slotIndex?: number;
  upgradeLevel?: BoardSlot["upgradeLevel"];
  summonedBy?: string;
}

export interface RoundInsightUnitAmount {
  unit: RoundInsightUnitRef;
  amount: number;
  eventCount: number;
}

export interface RoundInsightActivity {
  amount: number;
  eventCount: number;
  byUnit: RoundInsightUnitAmount[];
}

export type RoundInsightDamageSource =
  | { kind: "unit"; unit: RoundInsightUnitRef }
  | { kind: "synergy"; owner: Owner; tag: UnitTag; threshold: SynergyThreshold };

export interface RoundInsightDamageSourceAmount {
  source: RoundInsightDamageSource;
  /** Actual health removed, excluding overkill. */
  hpDamage: number;
  /** Armor consumed by the same source. Full Bulwark blocks are excluded. */
  armorDamage: number;
  eventCount: number;
}

export interface RoundInsightDamage {
  /** Actual health removed by this side, excluding overkill. */
  hpDamage: number;
  /** Enemy armor consumed by this side. */
  armorDamage: number;
  eventCount: number;
  /** Primary and splash hits aggregate under the same unit; summons retain their own unit source. */
  bySource: RoundInsightDamageSourceAmount[];
}

export interface RoundInsightSynergy {
  tag: UnitTag;
  threshold: SynergyAppliedCombatEvent["threshold"];
  effectKind: SynergyAppliedCombatEvent["effectKind"];
  value: number;
  affectedUnitIds: string[];
  attackBonus?: number;
  hpBonus?: number;
  speedBonus?: number;
  shieldBonus?: number;
  openingDamage?: number;
  firstAttackDamage?: number;
}

export interface RoundInsightSide {
  survivors: RoundInsightUnitRef[];
  damageDealt: RoundInsightDamage;
  healing: RoundInsightActivity;
  blocking: RoundInsightActivity;
  summons: RoundInsightUnitRef[];
  deaths: RoundInsightUnitRef[];
  synergies: RoundInsightSynergy[];
}

export interface RoundInsights {
  round: number;
  winner: CombatWinner;
  actions: number;
  castles: Record<Owner, {
    hpBefore: number;
    hpAfter: number;
    damageTaken: number;
  }>;
  sides: Record<Owner, RoundInsightSide>;
}

interface RegisteredUnit extends RoundInsightUnitRef {
  owner: Owner;
}

export function createRoundInsights(record: RoundRecord): RoundInsights {
  const registry = createUnitRegistry(record);
  const sides: Record<Owner, RoundInsightSide> = {
    player: createEmptySide(),
    enemy: createEmptySide(),
  };
  const healingBySide: Record<Owner, Map<string, RoundInsightUnitAmount>> = {
    player: new Map(),
    enemy: new Map(),
  };
  const blockingBySide: Record<Owner, Map<string, RoundInsightUnitAmount>> = {
    player: new Map(),
    enemy: new Map(),
  };
  const damageBySide: Record<Owner, Map<string, RoundInsightDamageSourceAmount>> = {
    player: new Map(),
    enemy: new Map(),
  };

  sides.player.survivors = record.combatResult.survivingPlayerUnits.map(toUnitRef);
  sides.enemy.survivors = record.combatResult.survivingEnemyUnits.map(toUnitRef);

  for (const event of record.combatResult.events) {
    if (event.type === "synergy_applied") {
      const synergy: RoundInsightSynergy = {
        tag: event.tag,
        threshold: event.threshold,
        effectKind: event.effectKind,
        value: event.value,
        affectedUnitIds: [...event.unitIds],
      };
      if (event.attackBonus !== undefined) {
        synergy.attackBonus = event.attackBonus;
      }
      if (event.hpBonus !== undefined) {
        synergy.hpBonus = event.hpBonus;
      }
      if (event.speedBonus !== undefined) {
        synergy.speedBonus = event.speedBonus;
      }
      if (event.shieldBonus !== undefined) {
        synergy.shieldBonus = event.shieldBonus;
      }
      if (event.openingDamage !== undefined) {
        synergy.openingDamage = event.openingDamage;
      }
      if (event.firstAttackDamage !== undefined) {
        synergy.firstAttackDamage = event.firstAttackDamage;
      }
      sides[event.owner].synergies.push(synergy);
      continue;
    }

    if (event.type === "unit_healed") {
      const owner = getRegisteredOwner(event.source, registry) ?? getRegisteredOwner(event.unitId, registry);
      if (owner) {
        addUnitAmount(healingBySide[owner], getUnitRef(event.source, registry), event.amount);
      }
      continue;
    }

    if (event.type === "unit_blocked") {
      const owner = getRegisteredOwner(event.unitId, registry);
      if (owner) {
        addUnitAmount(blockingBySide[owner], getUnitRef(event.unitId, registry), event.amount);
      }
      continue;
    }

    if (event.type === "unit_damaged") {
      const targetOwner = getRegisteredOwner(event.unitId, registry);
      if (targetOwner && event.shieldAbsorbed > 0) {
        addUnitAmount(blockingBySide[targetOwner], getUnitRef(event.unitId, registry), event.shieldAbsorbed);
      }

      if (event.source && event.hpDamage !== undefined) {
        const sourceOwner = event.source.kind === "unit"
          ? getRegisteredOwner(event.source.unitId, registry)
          : event.source.owner;
        if (sourceOwner) {
          addDamageSource(
            damageBySide[sourceOwner],
            toDamageSource(event.source, registry),
            event.hpDamage,
            event.shieldAbsorbed,
          );
        }
      }
      continue;
    }

    if (event.type === "unit_spawned") {
      sides[event.unit.owner].summons.push(toUnitRef(event.unit));
      continue;
    }

    if (event.type === "unit_died") {
      const owner = getRegisteredOwner(event.unitId, registry);
      if (owner) {
        sides[owner].deaths.push(getUnitRef(event.unitId, registry));
      }
    }
  }

  for (const owner of ["player", "enemy"] as const) {
    sides[owner].damageDealt = finalizeDamage(damageBySide[owner]);
    sides[owner].healing = finalizeActivity(healingBySide[owner]);
    sides[owner].blocking = finalizeActivity(blockingBySide[owner]);
  }

  return {
    round: record.round,
    winner: record.combatResult.winner,
    actions: record.combatResult.actions,
    castles: {
      player: createCastleInsight(record.playerHpBefore, record.playerHpAfter),
      enemy: createCastleInsight(record.enemyHpBefore, record.enemyHpAfter),
    },
    sides,
  };
}

function createEmptySide(): RoundInsightSide {
  return {
    survivors: [],
    damageDealt: createEmptyDamage(),
    healing: createEmptyActivity(),
    blocking: createEmptyActivity(),
    summons: [],
    deaths: [],
    synergies: [],
  };
}

function createEmptyActivity(): RoundInsightActivity {
  return { amount: 0, eventCount: 0, byUnit: [] };
}

function createEmptyDamage(): RoundInsightDamage {
  return { hpDamage: 0, armorDamage: 0, eventCount: 0, bySource: [] };
}

function createCastleInsight(hpBefore: number, hpAfter: number): RoundInsights["castles"][Owner] {
  return {
    hpBefore,
    hpAfter,
    damageTaken: Math.max(0, hpBefore - hpAfter),
  };
}

function createUnitRegistry(record: RoundRecord): Map<string, RegisteredUnit> {
  const registry = new Map<string, RegisteredUnit>();
  registerBoard(registry, "player", record.playerSlots);
  registerBoard(registry, "enemy", record.enemySlots);

  for (const unit of [...record.combatResult.survivingPlayerUnits, ...record.combatResult.survivingEnemyUnits]) {
    registry.set(unit.instanceId, { owner: unit.owner, ...toUnitRef(unit) });
  }

  for (const event of record.combatResult.events) {
    if (event.type === "unit_spawned") {
      registry.set(event.unit.instanceId, { owner: event.unit.owner, ...toUnitRef(event.unit) });
    }
  }

  return registry;
}

function registerBoard(registry: Map<string, RegisteredUnit>, owner: Owner, slots: readonly BoardSlot[]): void {
  for (const slot of slots) {
    if (!slot.cardId) {
      continue;
    }

    const instanceId = `${owner}-${slot.slotIndex}-${slot.cardId}`;
    registry.set(instanceId, {
      instanceId,
      owner,
      cardId: slot.cardId,
      slotIndex: slot.slotIndex,
      upgradeLevel: slot.upgradeLevel,
    });
  }
}

function toUnitRef(unit: CombatUnit): RoundInsightUnitRef {
  const ref: RoundInsightUnitRef = {
    instanceId: unit.instanceId,
    cardId: unit.cardId,
    slotIndex: unit.slotIndex,
    upgradeLevel: unit.upgradeLevel,
  };
  if (unit.summonedBy) {
    ref.summonedBy = unit.summonedBy;
  }

  return ref;
}

function getUnitRef(instanceId: string, registry: ReadonlyMap<string, RegisteredUnit>): RoundInsightUnitRef {
  const unit = registry.get(instanceId);
  if (!unit) {
    return { instanceId };
  }

  const { owner: _owner, ...ref } = unit;
  return ref;
}

function getRegisteredOwner(instanceId: string, registry: ReadonlyMap<string, RegisteredUnit>): Owner | undefined {
  return registry.get(instanceId)?.owner;
}

function toDamageSource(
  source: NonNullable<Extract<CombatEvent, { type: "unit_damaged" }>["source"]>,
  registry: ReadonlyMap<string, RegisteredUnit>,
): RoundInsightDamageSource {
  if (source.kind === "unit") {
    return { kind: "unit", unit: getUnitRef(source.unitId, registry) };
  }

  return {
    kind: "synergy",
    owner: source.owner,
    tag: source.tag,
    threshold: source.threshold,
  };
}

function addDamageSource(
  amounts: Map<string, RoundInsightDamageSourceAmount>,
  source: RoundInsightDamageSource,
  hpDamage: number,
  armorDamage: number,
): void {
  const key = source.kind === "unit"
    ? `unit:${source.unit.instanceId}`
    : `synergy:${source.owner}:${source.tag}:${source.threshold}`;
  const existing = amounts.get(key);
  if (existing) {
    existing.hpDamage += hpDamage;
    existing.armorDamage += armorDamage;
    existing.eventCount += 1;
    return;
  }

  amounts.set(key, { source, hpDamage, armorDamage, eventCount: 1 });
}

function addUnitAmount(
  amounts: Map<string, RoundInsightUnitAmount>,
  unit: RoundInsightUnitRef,
  amount: number,
): void {
  const existing = amounts.get(unit.instanceId);
  if (existing) {
    existing.amount += amount;
    existing.eventCount += 1;
    return;
  }

  amounts.set(unit.instanceId, { unit, amount, eventCount: 1 });
}

function finalizeActivity(amounts: ReadonlyMap<string, RoundInsightUnitAmount>): RoundInsightActivity {
  const byUnit = [...amounts.values()];
  return {
    amount: byUnit.reduce((total, entry) => total + entry.amount, 0),
    eventCount: byUnit.reduce((total, entry) => total + entry.eventCount, 0),
    byUnit,
  };
}

function finalizeDamage(amounts: ReadonlyMap<string, RoundInsightDamageSourceAmount>): RoundInsightDamage {
  const bySource = [...amounts.values()];
  return {
    hpDamage: bySource.reduce((total, entry) => total + entry.hpDamage, 0),
    armorDamage: bySource.reduce((total, entry) => total + entry.armorDamage, 0),
    eventCount: bySource.reduce((total, entry) => total + entry.eventCount, 0),
    bySource,
  };
}
