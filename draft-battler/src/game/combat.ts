import { getCardDefinition, getCardStatsForUpgrade } from "./cards";
import {
  type BoardSlot,
  type CardDefinition,
  type CombatEvent,
  type CombatResult,
  type CombatUnit,
  type Owner,
  type UnitTag,
} from "./types";

const MAX_COMBAT_ACTIONS = 80;

interface TimelineUnit extends CombatUnit {
  nextActionAt: number;
  bonePactUsed?: boolean;
}

export function resolveCombat(playerSlots: readonly BoardSlot[], enemySlots: readonly BoardSlot[], _round: number): CombatResult {
  const events: CombatEvent[] = [];
  const units = [
    ...createCombatUnits("player", playerSlots),
    ...createCombatUnits("enemy", enemySlots),
  ];

  events.push({
    type: "combat_started",
    time: 0,
    playerUnits: units.filter((unit) => unit.owner === "player").map((unit) => unit.instanceId),
    enemyUnits: units.filter((unit) => unit.owner === "enemy").map((unit) => unit.instanceId),
  });

  applyStartOfCombatEffects(units, events);

  let actions = 0;
  let lastActionTime = 0;
  while (actions < MAX_COMBAT_ACTIONS && hasLivingUnits(units, "player") && hasLivingUnits(units, "enemy")) {
    if (!hasDamageCapableUnits(units, "player") && !hasDamageCapableUnits(units, "enemy")) {
      break;
    }

    const actor = findNextActor(units);
    if (!actor) {
      break;
    }

    const actionTime = actor.nextActionAt;
    takeAction(actor, units, events, actionTime);
    actor.acted += 1;
    actor.nextActionAt += getActionDelay(actor);
    lastActionTime = Math.max(lastActionTime, actionTime);
    actions += 1;
  }

  const survivingPlayerUnits = getLivingUnits(units, "player");
  const survivingEnemyUnits = getLivingUnits(units, "enemy");
  const winner = getWinner(survivingPlayerUnits, survivingEnemyUnits);
  const hpLoss = winner === "enemy" ? survivingEnemyUnits.filter(canDamageCastle).length : 0;

  events.push({ type: "combat_finished", time: lastActionTime, winner, hpLoss, actions });

  return {
    winner,
    hpLoss,
    actions,
    events,
    survivingPlayerUnits,
    survivingEnemyUnits,
  };
}

function createCombatUnits(owner: Owner, slots: readonly BoardSlot[]): TimelineUnit[] {
  return slots.flatMap((slot) => {
    if (!slot.cardId) {
      return [];
    }

    const card = getCardDefinition(slot.cardId);
    const unit = createUnitFromCard(owner, card, slot);

    return [unit];
  });
}

function createUnitFromCard(owner: Owner, card: CardDefinition, slot: BoardSlot, summonedBy?: string): TimelineUnit {
  const stats = getCardStatsForUpgrade(card, slot.upgradeLevel);

  return {
    instanceId: `${owner}-${slot.slotIndex}-${card.id}${summonedBy ? "-summon" : ""}`,
    owner,
    cardId: card.id,
    name: card.name,
    role: card.role,
    tags: [...card.tags],
    abilityId: card.abilityId,
    slotIndex: slot.slotIndex,
    upgradeLevel: slot.upgradeLevel,
    attack: stats.attack,
    maxHp: stats.hp,
    hp: stats.hp,
    speed: stats.speed,
    range: stats.range,
    shield: 0,
    acted: 0,
    nextActionAt: 100 / stats.speed,
    summonedBy,
  };
}

function applyStartOfCombatEffects(units: TimelineUnit[], events: CombatEvent[]): void {
  applyTagSynergies(units, events);

  for (const unit of units) {
    if (unit.hp <= 0) {
      continue;
    }

    if (unit.abilityId === "shield_wall") {
      addShield(unit, 3, "shield_wall", events, 0);
    }

    if (unit.abilityId === "stone_skin") {
      addShield(unit, 5, "stone_skin", events, 0);
    }

    if (unit.abilityId === "riposte") {
      addShield(unit, 2, "riposte", events, 0);
    }

    if (unit.abilityId === "battle_banner") {
      for (const ally of getLivingUnits(units, unit.owner)) {
        if (ally.instanceId === unit.instanceId) {
          continue;
        }

        ally.attack += 1;
        events.push({ type: "unit_buffed", time: 0, unitId: ally.instanceId, attackDelta: 1, source: "battle_banner" });
      }
    }

    if (unit.abilityId === "thorn_guard") {
      for (const ally of getLivingUnits(units, unit.owner)) {
        addShield(ally, 1, "thorn_guard", events, 0);
      }
    }

    if (unit.abilityId === "pack_hunter" && countLivingTaggedAllies(units, unit.owner, "beast") >= 2) {
      unit.attack += 1;
      events.push({ type: "unit_buffed", time: 0, unitId: unit.instanceId, attackDelta: 1, source: "pack_hunter" });
    }
  }
}

function applyTagSynergies(units: TimelineUnit[], events: CombatEvent[]): void {
  for (const owner of ["player", "enemy"] as const) {
    for (const tag of ["warrior", "beast", "mage", "undead", "rogue", "guardian"] as const) {
      const taggedUnits = getLivingUnits(units, owner).filter((unit) => unit.tags.includes(tag));

      if (taggedUnits.length < 2) {
        continue;
      }

      if (tag === "warrior" || tag === "beast") {
        taggedUnits.forEach((unit) => {
          unit.attack += 1;
        });
        events.push({ type: "synergy_applied", time: 0, owner, tag, unitIds: taggedUnits.map((unit) => unit.instanceId), attackBonus: 1 });
      }

      if (tag === "guardian" || tag === "undead") {
        taggedUnits.forEach((unit) => {
          unit.maxHp += 2;
          unit.hp += 2;
        });
        events.push({ type: "synergy_applied", time: 0, owner, tag, unitIds: taggedUnits.map((unit) => unit.instanceId), hpBonus: 2 });
      }

      if (tag === "mage") {
        taggedUnits.forEach((unit) => {
          if (unit.role === "caster" || unit.role === "support") {
            unit.attack += 1;
          }
        });
        events.push({ type: "synergy_applied", time: 0, owner, tag, unitIds: taggedUnits.map((unit) => unit.instanceId), attackBonus: 1 });
      }
    }
  }
}

function takeAction(actor: TimelineUnit, units: TimelineUnit[], events: CombatEvent[], time: number): void {
  if (actor.hp <= 0) {
    return;
  }

  if (!canAct(actor)) {
    return;
  }

  if (actor.abilityId === "heal_only") {
    healWeakestAlly(actor, units, events, time);
    return;
  }

  if (actor.abilityId === "heal_ally") {
    healWeakestAlly(actor, units, events, time);
  }

  const target = selectTarget(actor, units);
  if (!target) {
    return;
  }

  const damage = calculateDamage(actor);
  events.push({
    type: "unit_attacked",
    time,
    attackerId: actor.instanceId,
    targetId: target.instanceId,
    abilityId: actor.abilityId,
    damage,
  });

  dealDamage(target, damage, actor.instanceId, units, events, time);

  if (actor.abilityId === "fireball" || actor.abilityId === "pyro_splash") {
    const splashDamage = actor.abilityId === "pyro_splash" ? 2 : 1;
    const adjacentTargets = getLivingUnits(units, getEnemyOwner(actor.owner)).filter(
      (unit) => unit.instanceId !== target.instanceId && Math.abs(getSlotColumn(unit.slotIndex) - getSlotColumn(target.slotIndex)) <= 1,
    );

    adjacentTargets.forEach((unit) => {
      dealDamage(unit, splashDamage, actor.instanceId, units, events, time);
    });
  }

  if (actor.abilityId === "frost_hex" && actor.acted === 0 && target.hp > 0) {
    target.attack = Math.max(1, target.attack - 1);
    events.push({ type: "unit_buffed", time, unitId: target.instanceId, attackDelta: -1, source: "frost_hex" });
  }
}

function selectTarget(actor: TimelineUnit, units: readonly TimelineUnit[]): TimelineUnit | undefined {
  const enemies = getLivingUnits(units, getEnemyOwner(actor.owner));

  if (enemies.length === 0) {
    return undefined;
  }

  if (actor.abilityId === "backstab" || actor.abilityId === "snipe") {
    return [...enemies].sort((left, right) => left.hp - right.hp || left.slotIndex - right.slotIndex)[0];
  }

  return [...enemies].sort(
    (left, right) =>
      Number(isBulwarkTauntTarget(right)) - Number(isBulwarkTauntTarget(left)) ||
      getSlotRow(left.slotIndex) - getSlotRow(right.slotIndex) ||
      Math.abs(getSlotColumn(left.slotIndex) - getSlotColumn(actor.slotIndex)) -
        Math.abs(getSlotColumn(right.slotIndex) - getSlotColumn(actor.slotIndex)) ||
      left.hp - right.hp ||
      left.slotIndex - right.slotIndex,
  )[0];
}

function calculateDamage(actor: TimelineUnit): number {
  let damage = actor.attack;

  if (actor.abilityId === "charge" && actor.acted === 0) {
    damage += 2;
  }

  if (actor.abilityId === "backstab" && actor.acted === 0) {
    damage += 1;
  }

  return Math.max(1, damage);
}

function dealDamage(
  target: TimelineUnit,
  amount: number,
  sourceUnitId: string,
  units: TimelineUnit[],
  events: CombatEvent[],
  time: number,
): void {
  if (shouldBulwarkBlock(target, amount, sourceUnitId, time)) {
    events.push({
      type: "unit_blocked",
      time,
      unitId: target.instanceId,
      attackerId: sourceUnitId,
      amount,
    });
    return;
  }

  const shieldAbsorbed = Math.min(target.shield, amount);
  target.shield -= shieldAbsorbed;
  const damageAfterShield = amount - shieldAbsorbed;
  target.hp = Math.max(0, target.hp - damageAfterShield);

  events.push({
    type: "unit_damaged",
    time,
    unitId: target.instanceId,
    amount: damageAfterShield,
    remainingHp: target.hp,
    shieldAbsorbed,
  });

  if (target.hp <= 0) {
    events.push({ type: "unit_died", time, unitId: target.instanceId, killerId: sourceUnitId });
    maybeSummonSkeleton(target, units, events, time);
  }
}

function maybeSummonSkeleton(deadUnit: TimelineUnit, units: TimelineUnit[], events: CombatEvent[], time: number): void {
  if (deadUnit.abilityId !== "bone_pact" || deadUnit.bonePactUsed || deadUnit.summonedBy) {
    return;
  }

  deadUnit.bonePactUsed = true;

  const skeleton: TimelineUnit = {
    ...deadUnit,
    instanceId: `${deadUnit.owner}-${deadUnit.slotIndex}-bone_pact_skeleton`,
    name: "Bone Pact Skeleton",
    cardId: "bone_soldier",
    role: "striker",
    tags: ["undead"],
    abilityId: "none",
    upgradeLevel: 0,
    attack: 2,
    maxHp: 4,
    hp: 4,
    speed: 4,
    range: 1,
    shield: 0,
    acted: 0,
    nextActionAt: deadUnit.nextActionAt + 1,
    summonedBy: deadUnit.instanceId,
  };

  units.push(skeleton);
  events.push({ type: "unit_spawned", time, unit: skeleton });
}

function healWeakestAlly(actor: TimelineUnit, units: TimelineUnit[], events: CombatEvent[], time: number): void {
  const woundedAllies = getLivingUnits(units, actor.owner)
    .filter((unit) => unit.hp < unit.maxHp)
    .sort((left, right) => left.hp - right.hp || left.slotIndex - right.slotIndex);

  const target = woundedAllies[0];
  if (!target) {
    return;
  }

  const amount = Math.min(2, target.maxHp - target.hp);
  target.hp += amount;

  events.push({ type: "unit_healed", time, unitId: target.instanceId, amount, remainingHp: target.hp, source: actor.instanceId });
}

function addShield(unit: TimelineUnit, amount: number, source: string, events: CombatEvent[], time: number): void {
  unit.shield += amount;
  events.push({ type: "unit_buffed", time, unitId: unit.instanceId, shieldDelta: amount, source });
}

function findNextActor(units: readonly TimelineUnit[]): TimelineUnit | undefined {
  return getLivingUnits(units)
    .filter(canAct)
    .sort(
      (left, right) =>
        left.nextActionAt - right.nextActionAt ||
        getOwnerSort(left.owner) - getOwnerSort(right.owner) ||
        left.slotIndex - right.slotIndex,
    )[0];
}

function getActionDelay(unit: TimelineUnit): number {
  return 100 / Math.max(1, unit.speed);
}

function getLivingUnits(units: readonly TimelineUnit[], owner?: Owner): TimelineUnit[] {
  return units.filter((unit) => unit.hp > 0 && (!owner || unit.owner === owner));
}

function hasLivingUnits(units: readonly TimelineUnit[], owner: Owner): boolean {
  return getLivingUnits(units, owner).length > 0;
}

function hasDamageCapableUnits(units: readonly TimelineUnit[], owner: Owner): boolean {
  return getLivingUnits(units, owner).some(canDealDamage);
}

function canAct(unit: TimelineUnit): boolean {
  return unit.abilityId !== "bulwark";
}

function canDealDamage(unit: TimelineUnit): boolean {
  return canAct(unit) && unit.abilityId !== "heal_only";
}

function canDamageCastle(unit: TimelineUnit): boolean {
  return canDealDamage(unit);
}

function isBulwarkTauntTarget(unit: TimelineUnit): boolean {
  return unit.abilityId === "bulwark" && getSlotRow(unit.slotIndex) === 0;
}

function shouldBulwarkBlock(target: TimelineUnit, amount: number, sourceUnitId: string, time: number): boolean {
  if (target.abilityId !== "bulwark" || amount <= 0) {
    return false;
  }

  return getDeterministicPercent(`${sourceUnitId}:${target.instanceId}:${time}:${target.hp}:${target.acted}`) < 50;
}

function getDeterministicPercent(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 100;
}

function countLivingTaggedAllies(units: readonly TimelineUnit[], owner: Owner, tag: UnitTag): number {
  return getLivingUnits(units, owner).filter((unit) => unit.tags.includes(tag)).length;
}

function getEnemyOwner(owner: Owner): Owner {
  return owner === "player" ? "enemy" : "player";
}

function getOwnerSort(owner: Owner): number {
  return owner === "player" ? 0 : 1;
}

function getSlotColumn(slotIndex: number): number {
  return slotIndex % 3;
}

function getSlotRow(slotIndex: number): number {
  return slotIndex < 3 ? 0 : 1;
}

function getWinner(playerUnits: readonly TimelineUnit[], enemyUnits: readonly TimelineUnit[]): CombatResult["winner"] {
  if (playerUnits.length > 0 && enemyUnits.length === 0) {
    return "player";
  }

  if (enemyUnits.length > 0 && playerUnits.length === 0) {
    return "enemy";
  }

  return "draw";
}
