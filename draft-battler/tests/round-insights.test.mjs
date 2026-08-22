import assert from "node:assert/strict";
import test from "node:test";

import { createRoundInsights } from "../src/roundInsights.ts";

function createUnit({
  instanceId,
  owner,
  cardId,
  slotIndex,
  abilityId = "none",
  summonedBy,
}) {
  return {
    instanceId,
    owner,
    cardId,
    name: cardId,
    role: "striker",
    tags: [],
    abilityId,
    slotIndex,
    upgradeLevel: 0,
    attack: 2,
    maxHp: 4,
    hp: 4,
    speed: 4,
    range: 1,
    shield: 0,
    acted: 1,
    summonedBy,
  };
}

test("round insights expose only attributable combat facts in a localization-neutral model", () => {
  const playerGuard = createUnit({
    instanceId: "player-0-iron_guard",
    owner: "player",
    cardId: "iron_guard",
    slotIndex: 0,
    abilityId: "shield_wall",
  });
  const playerCleric = createUnit({
    instanceId: "player-3-field_cleric",
    owner: "player",
    cardId: "field_cleric",
    slotIndex: 3,
    abilityId: "heal_only",
  });
  const enemySkeleton = createUnit({
    instanceId: "enemy-4-bone_pact_skeleton",
    owner: "enemy",
    cardId: "bone_soldier",
    slotIndex: 4,
    summonedBy: "enemy-4-grave_binder",
  });

  const insights = createRoundInsights({
    round: 8,
    playerHpBefore: 7,
    playerHpAfter: 5,
    enemyHpBefore: 1,
    enemyHpAfter: 0,
    draftOptions: [],
    draftRerollCount: 0,
    playerSlots: [
      { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 0 },
      { slotIndex: 3, cardId: "field_cleric", upgradeLevel: 0 },
    ],
    enemySlots: [
      { slotIndex: 1, cardId: "shieldbearer", upgradeLevel: 0 },
      { slotIndex: 4, cardId: "grave_binder", upgradeLevel: 0 },
    ],
    combatResult: {
      winner: "player",
      hpLoss: 2,
      playerCastleDamage: 2,
      enemyCastleDamage: 3,
      actions: 9,
      events: [
        { type: "combat_started", time: 0, playerUnits: [playerGuard.instanceId, playerCleric.instanceId], enemyUnits: [] },
        {
          type: "synergy_applied",
          time: 0,
          owner: "player",
          tag: "guardian",
          threshold: 2,
          effectKind: "stat",
          value: 2,
          unitIds: [playerGuard.instanceId, playerCleric.instanceId],
          hpBonus: 2,
        },
        {
          type: "synergy_applied",
          time: 0,
          owner: "player",
          tag: "guardian",
          threshold: 4,
          effectKind: "stat",
          value: 1,
          unitIds: [playerGuard.instanceId, playerCleric.instanceId],
          shieldBonus: 1,
        },
        { type: "unit_healed", time: 4, unitId: playerGuard.instanceId, amount: 2, remainingHp: 7, source: playerCleric.instanceId },
        { type: "unit_healed", time: 8, unitId: playerGuard.instanceId, amount: 1, remainingHp: 8, source: playerCleric.instanceId },
        { type: "unit_blocked", time: 5, unitId: "enemy-1-shieldbearer", attackerId: playerGuard.instanceId, amount: 3 },
        { type: "unit_spawned", time: 6, unit: enemySkeleton },
        { type: "unit_damaged", time: 7, unitId: playerGuard.instanceId, amount: 2, remainingHp: 5, shieldAbsorbed: 2 },
        { type: "unit_died", time: 9, unitId: "enemy-4-grave_binder", killerId: playerGuard.instanceId },
        { type: "unit_died", time: 10, unitId: enemySkeleton.instanceId, killerId: playerGuard.instanceId },
        { type: "combat_finished", time: 10, winner: "player", hpLoss: 2, actions: 9 },
      ],
      survivingPlayerUnits: [playerGuard, playerCleric],
      survivingEnemyUnits: [],
    },
  });

  assert.deepEqual(insights.castles, {
    player: { hpBefore: 7, hpAfter: 5, damageTaken: 2 },
    enemy: { hpBefore: 1, hpAfter: 0, damageTaken: 1 },
  });
  assert.equal(insights.sides.player.survivors.length, 2);
  assert.deepEqual(insights.sides.player.healing, {
    amount: 3,
    eventCount: 2,
    byUnit: [{
      unit: {
        instanceId: playerCleric.instanceId,
        cardId: "field_cleric",
        slotIndex: 3,
        upgradeLevel: 0,
      },
      amount: 3,
      eventCount: 2,
    }],
  });
  assert.deepEqual(insights.sides.enemy.blocking, {
    amount: 3,
    eventCount: 1,
    byUnit: [{
      unit: {
        instanceId: "enemy-1-shieldbearer",
        cardId: "shieldbearer",
        slotIndex: 1,
        upgradeLevel: 0,
      },
      amount: 3,
      eventCount: 1,
    }],
  });
  assert.deepEqual(insights.sides.player.blocking, {
    amount: 2,
    eventCount: 1,
    byUnit: [{
      unit: {
        instanceId: playerGuard.instanceId,
        cardId: "iron_guard",
        slotIndex: 0,
        upgradeLevel: 0,
      },
      amount: 2,
      eventCount: 1,
    }],
  });
  assert.deepEqual(insights.sides.enemy.summons, [{
    instanceId: enemySkeleton.instanceId,
    cardId: "bone_soldier",
    slotIndex: 4,
    upgradeLevel: 0,
    summonedBy: "enemy-4-grave_binder",
  }]);
  assert.deepEqual(insights.sides.enemy.deaths.map((unit) => unit.cardId), ["grave_binder", "bone_soldier"]);
  assert.deepEqual(insights.sides.player.synergies, [{
    tag: "guardian",
    threshold: 2,
    effectKind: "stat",
    value: 2,
    affectedUnitIds: [playerGuard.instanceId, playerCleric.instanceId],
    hpBonus: 2,
  }, {
    tag: "guardian",
    threshold: 4,
    effectKind: "stat",
    value: 1,
    affectedUnitIds: [playerGuard.instanceId, playerCleric.instanceId],
    shieldBonus: 1,
  }]);

  assert.equal("damage" in insights.sides.player, false);
  assert.equal("mvp" in insights, false);
});

test("round insights remain empty and stable when a round has no optional activity", () => {
  const insights = createRoundInsights({
    round: 1,
    playerHpBefore: 20,
    playerHpAfter: 20,
    enemyHpBefore: 20,
    enemyHpAfter: 20,
    draftOptions: [],
    draftRerollCount: 0,
    playerSlots: [],
    enemySlots: [],
    combatResult: {
      winner: "draw",
      hpLoss: 0,
      playerCastleDamage: 0,
      enemyCastleDamage: 0,
      actions: 0,
      events: [],
      survivingPlayerUnits: [],
      survivingEnemyUnits: [],
    },
  });

  assert.deepEqual(insights.sides.player, {
    survivors: [],
    healing: { amount: 0, eventCount: 0, byUnit: [] },
    blocking: { amount: 0, eventCount: 0, byUnit: [] },
    summons: [],
    deaths: [],
    synergies: [],
  });
  assert.deepEqual(insights.sides.enemy, insights.sides.player);
});
