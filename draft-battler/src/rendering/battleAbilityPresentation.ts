import { getCardDefinition } from "../game/cards";
import type { BattleTimelineUnit, CombatStepEvent } from "../game/battleTimeline";
import type { Owner } from "../game/types";

export type BattleAbilityCalloutSource =
  | "battle_banner"
  | "thorn_guard"
  | "pack_hunter"
  | "frost_hex"
  | "shield_wall"
  | "stone_skin"
  | "riposte"
  | "synergy_undead_4"
  | "bone_pact";

export type BattleAbilityCalloutEffect = "attack_up" | "armor_up" | "attack_down" | "summon";
export type BattleAbilityCalloutTone = "buff" | "armor" | "debuff" | "summon";

export interface BattleAbilityCallout {
  unitId: string;
  source: BattleAbilityCalloutSource;
  effect: BattleAbilityCalloutEffect;
  tone: BattleAbilityCalloutTone;
  amount?: number;
}

export interface BattleAbilityCalloutPlanItem extends BattleAbilityCallout {
  anchorUnitId: string;
  owner: Owner;
}

const CALLOUT_SOURCE_PRIORITY: Readonly<Record<BattleAbilityCalloutSource, number>> = {
  frost_hex: 0,
  synergy_undead_4: 1,
  bone_pact: 2,
  pack_hunter: 3,
  battle_banner: 4,
  thorn_guard: 5,
  shield_wall: 6,
  stone_skin: 7,
  riposte: 8,
};

export const BATTLE_ABILITY_CALLOUT_LIMIT_PER_OWNER = 3;

/** Converts rule events into locale-independent presentation data; unsupported sources stay silent. */
export function getBattleAbilityCallout(
  event: CombatStepEvent,
  units: readonly BattleTimelineUnit[] = [],
): BattleAbilityCallout | undefined {
  if (event.type === "unit_spawn") {
    return getSpawnCallout(event.unitId, units);
  }

  if (event.type !== "unit_buff") {
    return undefined;
  }

  if (
    event.source === "battle_banner" ||
    event.source === "pack_hunter" ||
    event.source === "synergy_undead_4"
  ) {
    return createDeltaCallout(event.unitId, event.source, "attack_up", "buff", event.attackDelta, "positive");
  }

  if (event.source === "frost_hex") {
    return createDeltaCallout(event.unitId, event.source, "attack_down", "debuff", event.attackDelta, "negative");
  }

  if (
    event.source === "thorn_guard" ||
    event.source === "shield_wall" ||
    event.source === "stone_skin" ||
    event.source === "riposte"
  ) {
    return createDeltaCallout(event.unitId, event.source, "armor_up", "armor", event.shieldDelta, "positive");
  }

  return undefined;
}

/** Builds a bounded, side-fair callout list after dedupe so passive armor cannot hide named mechanics. */
export function createBattleAbilityCalloutPlan(
  events: readonly CombatStepEvent[],
  units: readonly BattleTimelineUnit[],
  limitPerOwner = BATTLE_ABILITY_CALLOUT_LIMIT_PER_OWNER,
): readonly BattleAbilityCalloutPlanItem[] {
  if (limitPerOwner <= 0) {
    return [];
  }

  const unitsById = new Map(units.map((unit) => [unit.unitId, unit]));
  const candidates: Array<BattleAbilityCalloutPlanItem & { order: number }> = [];
  const candidatesByKey = new Map<string, BattleAbilityCalloutPlanItem & { order: number }>();

  for (const event of events) {
    const callout = getBattleAbilityCallout(event, units);
    if (!callout) {
      continue;
    }

    const targetUnit = unitsById.get(callout.unitId);
    if (!targetUnit) {
      continue;
    }

    const anchorUnitIds = getBattleAbilityCalloutAnchorUnitIds(callout, units, targetUnit.owner);
    const owner = callout.source === "frost_hex" ? getOpposingOwner(targetUnit.owner) : targetUnit.owner;

    for (const anchorUnitId of anchorUnitIds) {
      const key = `${callout.source}:${anchorUnitId}`;
      const existing = candidatesByKey.get(key);
      if (existing) {
        if (!isGroupSource(callout.source) && callout.amount !== undefined) {
          existing.amount = (existing.amount ?? 0) + callout.amount;
        }
        continue;
      }

      const candidate = { ...callout, anchorUnitId, owner, order: candidates.length };
      candidates.push(candidate);
      candidatesByKey.set(key, candidate);
    }
  }

  return (["player", "enemy"] as const).flatMap((owner) =>
    selectOwnerCallouts(
      candidates.filter((candidate) => candidate.owner === owner),
      limitPerOwner,
    ).map(({ order: _order, ...candidate }) => candidate),
  );
}

function getBattleAbilityCalloutAnchorUnitIds(
  callout: BattleAbilityCallout,
  units: readonly BattleTimelineUnit[],
  targetOwner: Owner,
): readonly string[] {
  if (!isGroupSource(callout.source)) {
    return [callout.unitId];
  }

  const sourceUnitIds = units
    .filter((unit) => unit.owner === targetOwner && getCardDefinition(unit.cardId).abilityId === callout.source)
    .map((unit) => unit.unitId);
  return sourceUnitIds.length > 0 ? sourceUnitIds : [callout.unitId];
}

function selectOwnerCallouts<T extends BattleAbilityCalloutPlanItem & { order: number }>(
  candidates: readonly T[],
  limit: number,
): readonly T[] {
  const sorted = [...candidates].sort(
    (left, right) => CALLOUT_SOURCE_PRIORITY[left.source] - CALLOUT_SOURCE_PRIORITY[right.source] || left.order - right.order,
  );
  const firstBySource: T[] = [];
  const duplicates: T[] = [];
  const seenSources = new Set<BattleAbilityCalloutSource>();

  for (const candidate of sorted) {
    if (seenSources.has(candidate.source)) {
      duplicates.push(candidate);
    } else {
      seenSources.add(candidate.source);
      firstBySource.push(candidate);
    }
  }

  return [...firstBySource, ...duplicates].slice(0, limit);
}

function isGroupSource(source: BattleAbilityCalloutSource): boolean {
  return source === "battle_banner" || source === "thorn_guard";
}

function getOpposingOwner(owner: Owner): Owner {
  return owner === "player" ? "enemy" : "player";
}

function createDeltaCallout(
  unitId: string,
  source: Exclude<BattleAbilityCalloutSource, "bone_pact">,
  effect: Exclude<BattleAbilityCalloutEffect, "summon">,
  tone: Exclude<BattleAbilityCalloutTone, "summon">,
  delta: number | undefined,
  expectedSign: "positive" | "negative",
): BattleAbilityCallout | undefined {
  if (delta === undefined || delta === 0 || (expectedSign === "positive" ? delta < 0 : delta > 0)) {
    return undefined;
  }

  return {
    unitId,
    source,
    effect,
    tone,
    amount: Math.abs(delta),
  };
}

function getSpawnCallout(
  unitId: string,
  units: readonly BattleTimelineUnit[],
): BattleAbilityCallout | undefined {
  const spawnedUnit = units.find((unit) => unit.unitId === unitId);
  if (!spawnedUnit?.summonedBy) {
    return undefined;
  }

  const summoner = units.find((unit) => unit.unitId === spawnedUnit.summonedBy);
  if (!summoner || getCardDefinition(summoner.cardId).abilityId !== "bone_pact") {
    return undefined;
  }

  return {
    unitId,
    source: "bone_pact",
    effect: "summon",
    tone: "summon",
  };
}
