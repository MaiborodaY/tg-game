import { getCardDefinition, getCardStatsForUpgrade } from "./cards";
import {
  PLAYER_STARTING_HP,
  type BoardSlot,
  type CardId,
  type CombatResult,
  type CombatUnit,
  type CombatWinner,
  type Owner,
} from "./types";

const CASTLE_EXCHANGE_START_DELAY = 18;
const CASTLE_ASSAULT_FINISH_DELAY = 12;

export interface BattleTimelineUnit {
  unitId: string;
  owner: Owner;
  cardId: CardId;
  name: string;
  slotIndex: number;
  upgradeLevel: BoardSlot["upgradeLevel"];
  attack: number;
  maxHp: number;
  startHp: number;
  finalHp: number;
  defeated: boolean;
  summonedBy?: string;
}

export interface BattleTimelineCastle {
  owner: Owner;
  maxHp: number;
  startHp: number;
  finalHp: number;
}

type CombatStepEventPayload =
  | { type: "unit_spawn"; unitId: string }
  | { type: "unit_buff"; unitId: string; attackDelta?: number; hpDelta?: number; shieldDelta?: number }
  | { type: "unit_attack"; attackerId: string; targetId: string; damage: number }
  | { type: "unit_block"; unitId: string; attackerId: string; amount: number }
  | { type: "unit_damage"; unitId: string; amount: number; remainingHp: number; shieldAbsorbed: number }
  | { type: "unit_heal"; unitId: string; sourceUnitId: string; amount: number; remainingHp: number }
  | { type: "unit_die"; unitId: string };

export type CombatStepEvent = CombatStepEventPayload & { time: number };

type BattleTimelineEventPayload =
  | { type: "teams_enter" }
  | CombatStepEventPayload
  | { type: "combat_step"; events: CombatStepEvent[] }
  | { type: "castle_assault"; owner: Owner; attackerIds: string[]; damage: number; remainingHp: number }
  | { type: "battle_finished"; winner: CombatWinner; playerCastleHp: number; enemyCastleHp: number };

export type BattleTimelineEvent = BattleTimelineEventPayload & { time: number };

export interface BattleTimeline {
  units: BattleTimelineUnit[];
  castles: BattleTimelineCastle[];
  events: BattleTimelineEvent[];
  winner: CombatWinner;
}

interface CreateBattleTimelineInput {
  playerSlots: readonly BoardSlot[];
  enemySlots: readonly BoardSlot[];
  combat: CombatResult;
  playerCastleHpBefore: number;
  playerCastleHpAfter: number;
  enemyCastleHpBefore: number;
  enemyCastleHpAfter: number;
}

interface MutableTimelineUnit extends BattleTimelineUnit {
  currentHp: number;
}

export function createBattleTimeline(input: CreateBattleTimelineInput): BattleTimeline {
  const units = new Map<string, MutableTimelineUnit>();
  const events: BattleTimelineEvent[] = [{ type: "teams_enter", time: 0 }];
  const playerCastle = createCastle("player", input.playerCastleHpBefore, input.playerCastleHpAfter);
  const enemyCastle = createCastle(
    "enemy",
    input.enemyCastleHpBefore,
    input.enemyCastleHpAfter,
  );

  createUnitsFromSlots("player", input.playerSlots).forEach((unit) => units.set(unit.unitId, unit));
  createUnitsFromSlots("enemy", input.enemySlots).forEach((unit) => units.set(unit.unitId, unit));

  for (const event of input.combat.events) {
    if (event.type === "synergy_applied") {
      event.unitIds.forEach((unitId) => {
        const unit = units.get(unitId);
        if (!unit) {
          return;
        }

        if (event.attackBonus) {
          unit.attack += event.attackBonus;
        }

        if (event.hpBonus) {
          unit.maxHp += event.hpBonus;
          unit.currentHp += event.hpBonus;
        }
      });
      continue;
    }

    if (event.type === "unit_spawned") {
      const spawned = createUnitFromCombatUnit(event.unit);
      units.set(spawned.unitId, spawned);
      events.push({ type: "unit_spawn", time: event.time, unitId: spawned.unitId });
      continue;
    }

    if (event.type === "unit_buffed") {
      const unit = units.get(event.unitId);
      if (unit) {
        unit.attack += event.attackDelta ?? 0;
        unit.maxHp += event.hpDelta ?? 0;
        unit.currentHp += event.hpDelta ?? 0;
      }

      events.push({
        type: "unit_buff",
        time: event.time,
        unitId: event.unitId,
        attackDelta: event.attackDelta,
        hpDelta: event.hpDelta,
        shieldDelta: event.shieldDelta,
      });
      continue;
    }

    if (event.type === "unit_attacked") {
      events.push({
        type: "unit_attack",
        time: event.time,
        attackerId: event.attackerId,
        targetId: event.targetId,
        damage: event.damage,
      });
      continue;
    }

    if (event.type === "unit_damaged") {
      const unit = units.get(event.unitId);
      if (unit) {
        unit.currentHp = event.remainingHp;
      }

      events.push({
        type: "unit_damage",
        time: event.time,
        unitId: event.unitId,
        amount: event.amount,
        remainingHp: event.remainingHp,
        shieldAbsorbed: event.shieldAbsorbed,
      });
      continue;
    }

    if (event.type === "unit_blocked") {
      events.push({
        type: "unit_block",
        time: event.time,
        unitId: event.unitId,
        attackerId: event.attackerId,
        amount: event.amount,
      });
      continue;
    }

    if (event.type === "unit_healed") {
      const unit = units.get(event.unitId);
      if (unit) {
        unit.currentHp = event.remainingHp;
      }

      events.push({
        type: "unit_heal",
        time: event.time,
        unitId: event.unitId,
        sourceUnitId: event.source,
        amount: event.amount,
        remainingHp: event.remainingHp,
      });
      continue;
    }

    if (event.type === "unit_died") {
      const unit = units.get(event.unitId);
      if (unit) {
        unit.currentHp = 0;
      }

      events.push({ type: "unit_die", time: event.time, unitId: event.unitId });
    }
  }

  const castleExchangeStartTime = getCombatEndTime(input.combat) + CASTLE_EXCHANGE_START_DELAY;
  const battleFinishedTime = appendCastleExchange(input.combat.winner, units, events, playerCastle, enemyCastle, castleExchangeStartTime);

  events.push({
    type: "battle_finished",
    time: battleFinishedTime + CASTLE_ASSAULT_FINISH_DELAY,
    winner: input.combat.winner,
    playerCastleHp: playerCastle.finalHp,
    enemyCastleHp: enemyCastle.finalHp,
  });

  return {
    units: [...units.values()].map(finalizeUnit),
    castles: [enemyCastle, playerCastle],
    events: coalesceCombatStepEvents(events),
    winner: input.combat.winner,
  };
}

function createUnitsFromSlots(owner: Owner, slots: readonly BoardSlot[]): MutableTimelineUnit[] {
  return slots.flatMap((slot) => {
    if (!slot.cardId) {
      return [];
    }

    const card = getCardDefinition(slot.cardId);
    const stats = getCardStatsForUpgrade(card, slot.upgradeLevel);

    return [
      {
        unitId: `${owner}-${slot.slotIndex}-${card.id}`,
        owner,
        cardId: card.id,
        name: card.name,
        slotIndex: slot.slotIndex,
        upgradeLevel: slot.upgradeLevel,
        attack: stats.attack,
        maxHp: stats.hp,
        startHp: stats.hp,
        currentHp: stats.hp,
        finalHp: stats.hp,
        defeated: false,
      },
    ];
  });
}

function createUnitFromCombatUnit(unit: CombatUnit): MutableTimelineUnit {
  return {
    unitId: unit.instanceId,
    owner: unit.owner,
    cardId: unit.cardId,
    name: unit.name,
    slotIndex: unit.slotIndex,
    upgradeLevel: unit.upgradeLevel,
    attack: unit.attack,
    maxHp: unit.maxHp,
    startHp: unit.maxHp,
    currentHp: unit.hp,
    finalHp: unit.hp,
    defeated: unit.hp <= 0,
    summonedBy: unit.summonedBy,
  };
}

function createCastle(owner: Owner, startHp: number, finalHp: number): BattleTimelineCastle {
  const maxHp = Math.max(startHp, finalHp, PLAYER_STARTING_HP);

  return {
    owner,
    maxHp,
    startHp,
    finalHp,
  };
}

function appendCastleExchange(
  winner: CombatWinner,
  units: Map<string, MutableTimelineUnit>,
  events: BattleTimelineEvent[],
  playerCastle: BattleTimelineCastle,
  enemyCastle: BattleTimelineCastle,
  startTime: number,
): number {
  if (winner === "draw") {
    return startTime;
  }

  const attackerOwner: Owner = winner;
  const targetOwner: Owner = winner === "player" ? "enemy" : "player";
  const targetCastle = targetOwner === "player" ? playerCastle : enemyCastle;
  const attackers = getLivingUnits(units, attackerOwner).filter(canDamageCastle);

  return applyCastleDamage(attackers, targetOwner, events, targetCastle, startTime);
}

function applyCastleDamage(
  attackers: readonly MutableTimelineUnit[],
  targetOwner: Owner,
  events: BattleTimelineEvent[],
  targetCastle: BattleTimelineCastle,
  startTime: number,
): number {
  if (attackers.length === 0) {
    targetCastle.finalHp = targetCastle.startHp;
    return startTime;
  }

  const damage = Math.min(attackers.length, Math.max(0, targetCastle.startHp));
  const remainingHp = Math.max(0, targetCastle.startHp - damage);

  events.push({
    type: "castle_assault",
    time: startTime,
    owner: targetOwner,
    attackerIds: attackers.map((unit) => unit.unitId),
    damage,
    remainingHp,
  });

  attackers.forEach((unit) => {
    unit.currentHp = 0;
  });

  targetCastle.finalHp = remainingHp;

  return startTime;
}

function getCombatEndTime(combat: CombatResult): number {
  return combat.events.reduce((maxTime, event) => Math.max(maxTime, event.time), 0);
}

function coalesceCombatStepEvents(events: readonly BattleTimelineEvent[]): BattleTimelineEvent[] {
  const coalesced: BattleTimelineEvent[] = [];
  let combatStepEvents: CombatStepEvent[] = [];
  let combatStepTime: number | undefined;

  const flushCombatStep = () => {
    if (combatStepEvents.length === 0 || combatStepTime === undefined) {
      return;
    }

    coalesced.push({
      type: "combat_step",
      time: combatStepTime,
      events: combatStepEvents,
    });
    combatStepEvents = [];
    combatStepTime = undefined;
  };

  events.forEach((event) => {
    if (!isCombatStepEvent(event)) {
      flushCombatStep();
      coalesced.push(event);
      return;
    }

    if (combatStepTime !== event.time) {
      flushCombatStep();
      combatStepTime = event.time;
    }

    combatStepEvents.push(event);
  });

  flushCombatStep();

  return coalesced;
}

function isCombatStepEvent(event: BattleTimelineEvent): event is CombatStepEvent {
  return (
    event.type === "unit_spawn" ||
    event.type === "unit_buff" ||
    event.type === "unit_attack" ||
    event.type === "unit_block" ||
    event.type === "unit_damage" ||
    event.type === "unit_heal" ||
    event.type === "unit_die"
  );
}

function getLivingUnits(units: Map<string, MutableTimelineUnit>, owner: Owner): MutableTimelineUnit[] {
  return [...units.values()]
    .filter((unit) => unit.owner === owner && unit.currentHp > 0)
    .sort((left, right) => left.slotIndex - right.slotIndex || left.unitId.localeCompare(right.unitId));
}

function finalizeUnit(unit: MutableTimelineUnit): BattleTimelineUnit {
  return {
    unitId: unit.unitId,
    owner: unit.owner,
    cardId: unit.cardId,
    name: unit.name,
    slotIndex: unit.slotIndex,
    upgradeLevel: unit.upgradeLevel,
    attack: unit.attack,
    maxHp: unit.maxHp,
    startHp: unit.startHp,
    finalHp: unit.currentHp,
    defeated: unit.currentHp <= 0,
    summonedBy: unit.summonedBy,
  };
}

function canDamageCastle(unit: MutableTimelineUnit): boolean {
  const abilityId = getCardDefinition(unit.cardId).abilityId;

  return abilityId !== "bulwark" && abilityId !== "heal_only";
}
