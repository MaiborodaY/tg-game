import { getCardDefinition, getCardStatsForUpgrade } from "./cards";
import { SYNERGY_RULES, SYNERGY_TAG_ORDER, isRoleEligibleForSynergy } from "./synergies";
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
const ACTION_TIME_EPSILON = 1e-9;
const BONE_PACT_SKELETON_STATS = {
  base: { attack: 2, hp: 4 },
  upgraded: { attack: 3, hp: 6 },
} as const;

interface TimelineUnit extends CombatUnit {
  actionScheduleOrigin: number;
  nextActionAt: number;
  bonePactUsed?: boolean;
}

interface PlannedDamage {
  target: TimelineUnit;
  amount: number;
  blocked: boolean;
}

interface PlannedAttack {
  primary: PlannedDamage;
  splash: PlannedDamage[];
  applyFrostHex: boolean;
}

interface PlannedAction {
  actor: TimelineUnit;
  healTarget?: TimelineUnit;
  attack?: PlannedAttack;
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

    const actors = findNextActors(units);
    if (actors.length === 0 || (actions > 0 && actions + actors.length > MAX_COMBAT_ACTIONS)) {
      break;
    }

    const actionTime = Math.min(...actors.map((actor) => actor.nextActionAt));
    // Every intent is planned from one tick snapshot, so lethal ties cannot cancel the other side's action.
    const plannedActions = actors.map((actor) => planAction(actor, units, actionTime));

    actors.forEach((actor) => {
      actor.acted += 1;
      actor.nextActionAt = getScheduledActionTime(actor, actor.acted + 1);
    });

    resolvePlannedActions(plannedActions, units, events, actionTime);
    lastActionTime = Math.max(lastActionTime, actionTime);
    actions += actors.length;
  }

  const survivingPlayerUnits = getLivingUnits(units, "player");
  const survivingEnemyUnits = getLivingUnits(units, "enemy");
  const winner = getWinner(survivingPlayerUnits, survivingEnemyUnits);
  const playerCastleDamage = winner === "enemy" ? survivingEnemyUnits.filter(canDamageCastle).length : 0;
  const enemyCastleDamage = winner === "player" ? survivingPlayerUnits.filter(canDamageCastle).length : 0;
  const hpLoss = playerCastleDamage;

  events.push({ type: "combat_finished", time: lastActionTime, winner, hpLoss, actions });

  return {
    winner,
    hpLoss,
    playerCastleDamage,
    enemyCastleDamage,
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
    actionScheduleOrigin: 0,
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
    for (const tag of SYNERGY_TAG_ORDER) {
      const rule = SYNERGY_RULES[tag];
      const taggedUnits = getLivingUnits(units, owner).filter((unit) => unit.tags.includes(tag));

      if (taggedUnits.length < rule.threshold) {
        continue;
      }

      const affectedUnits = taggedUnits.filter((unit) => isRoleEligibleForSynergy(rule, unit.role));
      if (rule.effect.stat === "attack") {
        affectedUnits.forEach((unit) => {
          unit.attack += rule.effect.value;
        });
        events.push({
          type: "synergy_applied",
          time: 0,
          owner,
          tag,
          unitIds: affectedUnits.map((unit) => unit.instanceId),
          attackBonus: rule.effect.value,
        });
      } else {
        affectedUnits.forEach((unit) => {
          unit.maxHp += rule.effect.value;
          unit.hp += rule.effect.value;
        });
        events.push({
          type: "synergy_applied",
          time: 0,
          owner,
          tag,
          unitIds: affectedUnits.map((unit) => unit.instanceId),
          hpBonus: rule.effect.value,
        });
      }
    }
  }
}

function planAction(actor: TimelineUnit, units: readonly TimelineUnit[], time: number): PlannedAction {
  const healTarget = actor.abilityId === "heal_only" || actor.abilityId === "heal_ally"
    ? selectWeakestWoundedAlly(actor, units)
    : undefined;

  if (actor.abilityId === "heal_only") {
    return { actor, healTarget };
  }

  const target = selectTarget(actor, units);
  if (!target) {
    return { actor, healTarget };
  }

  const damage = calculateDamage(actor);
  const primary = planDamage(target, damage, actor.instanceId, time);
  const splash: PlannedDamage[] = [];

  if (actor.abilityId === "fireball" || actor.abilityId === "pyro_splash") {
    const splashDamage = actor.abilityId === "pyro_splash" ? 2 : 1;
    const adjacentTargets = getLivingUnits(units, getEnemyOwner(actor.owner)).filter(
      (unit) => unit.instanceId !== target.instanceId && getSlotManhattanDistance(unit.slotIndex, target.slotIndex) === 1,
    );

    adjacentTargets.forEach((unit) => {
      splash.push(planDamage(unit, splashDamage, actor.instanceId, time));
    });
  }

  return {
    actor,
    healTarget,
    attack: {
      primary,
      splash,
      applyFrostHex: actor.abilityId === "frost_hex" && actor.acted === 0,
    },
  };
}

function resolvePlannedActions(
  plannedActions: readonly PlannedAction[],
  units: TimelineUnit[],
  events: CombatEvent[],
  time: number,
): void {
  // Healing is the first phase of a simultaneous tick; all attack damage was already fixed by the snapshot.
  plannedActions.forEach((action) => {
    if (action.healTarget) {
      applyPlannedHealing(action.actor, action.healTarget, events, time);
    }
  });

  plannedActions.forEach((action) => {
    if (!action.attack) {
      return;
    }

    const { actor, attack } = action;
    events.push({
      type: "unit_attacked",
      time,
      attackerId: actor.instanceId,
      targetId: attack.primary.target.instanceId,
      abilityId: actor.abilityId,
      damage: attack.primary.amount,
    });
  });

  plannedActions.forEach((action) => {
    if (!action.attack) {
      return;
    }

    const { actor, attack } = action;

    applyPlannedDamage(attack.primary, actor.instanceId, units, events, time);
    attack.splash.forEach((damage) => {
      applyPlannedDamage(damage, actor.instanceId, units, events, time);
    });

    if (attack.applyFrostHex && attack.primary.target.hp > 0) {
      attack.primary.target.attack = Math.max(1, attack.primary.target.attack - 1);
      events.push({
        type: "unit_buffed",
        time,
        unitId: attack.primary.target.instanceId,
        attackDelta: -1,
        source: "frost_hex",
      });
    }
  });
}

function selectTarget(actor: TimelineUnit, units: readonly TimelineUnit[]): TimelineUnit | undefined {
  const enemies = getLivingUnits(units, getEnemyOwner(actor.owner));

  if (enemies.length === 0) {
    return undefined;
  }

  if (actor.abilityId === "backstab" || actor.abilityId === "snipe") {
    return [...enemies].sort((left, right) => left.hp - right.hp || left.slotIndex - right.slotIndex)[0];
  }

  const tauntingBulwarks = enemies.filter(isBulwarkTauntTarget);
  const targetableEnemies = tauntingBulwarks.length > 0
    ? tauntingBulwarks
    : enemies.filter((enemy) => isInNormalAttackRange(actor, enemy, enemies));

  return [...targetableEnemies].sort(
    (left, right) =>
      Math.abs(getSlotColumn(left.slotIndex) - getSlotColumn(actor.slotIndex)) -
        Math.abs(getSlotColumn(right.slotIndex) - getSlotColumn(actor.slotIndex)) ||
      getSlotRow(left.slotIndex) - getSlotRow(right.slotIndex) ||
      left.hp - right.hp ||
      left.slotIndex - right.slotIndex,
  )[0];
}

function isInNormalAttackRange(
  actor: TimelineUnit,
  target: TimelineUnit,
  livingEnemies: readonly TimelineUnit[],
): boolean {
  if (actor.range >= 3 || getSlotRow(target.slotIndex) === 0) {
    return true;
  }

  const livingFrontColumns = new Set(
    livingEnemies
      .filter((enemy) => getSlotRow(enemy.slotIndex) === 0)
      .map((enemy) => getSlotColumn(enemy.slotIndex)),
  );

  if (actor.range === 2) {
    return !livingFrontColumns.has(getSlotColumn(target.slotIndex));
  }

  return livingFrontColumns.size === 0;
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

function planDamage(target: TimelineUnit, amount: number, sourceUnitId: string, time: number): PlannedDamage {
  return {
    target,
    amount,
    blocked: shouldBulwarkBlock(target, amount, sourceUnitId, time),
  };
}

function applyPlannedDamage(
  plannedDamage: PlannedDamage,
  sourceUnitId: string,
  units: TimelineUnit[],
  events: CombatEvent[],
  time: number,
): void {
  const { target } = plannedDamage;

  if (target.hp <= 0) {
    return;
  }

  if (plannedDamage.blocked) {
    events.push({
      type: "unit_blocked",
      time,
      unitId: target.instanceId,
      attackerId: sourceUnitId,
      amount: plannedDamage.amount,
    });
    return;
  }

  const shieldAbsorbed = Math.min(target.shield, plannedDamage.amount);
  target.shield -= shieldAbsorbed;
  const damageAfterShield = plannedDamage.amount - shieldAbsorbed;
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
  const skeletonStats = deadUnit.upgradeLevel > 0
    ? BONE_PACT_SKELETON_STATS.upgraded
    : BONE_PACT_SKELETON_STATS.base;

  const skeleton: TimelineUnit = {
    ...deadUnit,
    instanceId: `${deadUnit.owner}-${deadUnit.slotIndex}-bone_pact_skeleton`,
    name: "Bone Pact Skeleton",
    cardId: "bone_soldier",
    role: "striker",
    tags: ["undead"],
    abilityId: "none",
    upgradeLevel: deadUnit.upgradeLevel,
    attack: skeletonStats.attack,
    maxHp: skeletonStats.hp,
    hp: skeletonStats.hp,
    speed: 4,
    range: 1,
    shield: 0,
    acted: 0,
    actionScheduleOrigin: time + 1 - 100 / 4,
    nextActionAt: time + 1,
    summonedBy: deadUnit.instanceId,
  };

  units.push(skeleton);
  events.push({ type: "unit_spawned", time, unit: skeleton });
}

function selectWeakestWoundedAlly(
  actor: TimelineUnit,
  units: readonly TimelineUnit[],
): TimelineUnit | undefined {
  return getLivingUnits(units, actor.owner)
    .filter((unit) => unit.hp < unit.maxHp)
    .sort((left, right) => left.hp - right.hp || left.slotIndex - right.slotIndex)[0];
}

function applyPlannedHealing(
  actor: TimelineUnit,
  target: TimelineUnit,
  events: CombatEvent[],
  time: number,
): void {
  if (target.hp <= 0) {
    return;
  }

  const amount = Math.min(2, target.maxHp - target.hp);
  if (amount <= 0) {
    return;
  }

  target.hp += amount;

  events.push({ type: "unit_healed", time, unitId: target.instanceId, amount, remainingHp: target.hp, source: actor.instanceId });
}

function addShield(unit: TimelineUnit, amount: number, source: string, events: CombatEvent[], time: number): void {
  unit.shield += amount;
  events.push({ type: "unit_buffed", time, unitId: unit.instanceId, shieldDelta: amount, source });
}

function findNextActors(units: readonly TimelineUnit[]): TimelineUnit[] {
  const eligibleUnits = getLivingUnits(units).filter(canAct);
  const nextActionAt = Math.min(...eligibleUnits.map((unit) => unit.nextActionAt));

  if (!Number.isFinite(nextActionAt)) {
    return [];
  }

  return eligibleUnits
    .filter((unit) => Math.abs(unit.nextActionAt - nextActionAt) <= ACTION_TIME_EPSILON)
    .sort(
      (left, right) =>
        getOwnerSort(left.owner) - getOwnerSort(right.owner) ||
        left.slotIndex - right.slotIndex,
    );
}

function getScheduledActionTime(unit: TimelineUnit, actionNumber: number): number {
  return unit.actionScheduleOrigin + actionNumber * 100 / Math.max(1, unit.speed);
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

  const sourceEntropyId = getOwnerNeutralInstanceId(sourceUnitId);
  const targetEntropyId = getOwnerNeutralInstanceId(target.instanceId);

  return getDeterministicPercent(`${sourceEntropyId}:${targetEntropyId}:${time}:${target.hp}:${target.acted}`) < 50;
}

function getOwnerNeutralInstanceId(instanceId: string): string {
  return instanceId.replace(/^(?:player|enemy)-/, "");
}

function getDeterministicPercent(input: string): number {
  return getDeterministicHash(input) % 100;
}

function getDeterministicHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
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

function getSlotManhattanDistance(leftSlotIndex: number, rightSlotIndex: number): number {
  return Math.abs(getSlotColumn(leftSlotIndex) - getSlotColumn(rightSlotIndex)) +
    Math.abs(getSlotRow(leftSlotIndex) - getSlotRow(rightSlotIndex));
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
