import assert from "node:assert/strict";
import test from "node:test";

import { createBattleTimeline, resolveCombat } from "../src/game/index.ts";

function createBoard(entries) {
  const cardsBySlot = new Map(entries.map(([slotIndex, cardId, upgradeLevel = 0]) => [slotIndex, { cardId, upgradeLevel }]));

  return Array.from({ length: 6 }, (_, slotIndex) => ({
    slotIndex,
    cardId: cardsBySlot.get(slotIndex)?.cardId ?? null,
    upgradeLevel: cardsBySlot.get(slotIndex)?.upgradeLevel ?? 0,
  }));
}

test("combat is deterministic, finite, and produces ordered events", () => {
  const player = createBoard([[0, "iron_guard"], [1, "spear_recruit"], [4, "ember_mage"]]);
  const enemy = createBoard([[0, "bone_soldier"], [2, "wolfhound"], [5, "field_cleric"]]);
  const first = resolveCombat(player, enemy, 4);
  const second = resolveCombat(player, enemy, 4);

  assert.deepEqual(first, second);
  assert.ok(first.actions >= 0 && first.actions <= 80);
  assert.ok(["player", "enemy", "draw"].includes(first.winner));
  assert.equal(first.hpLoss, first.playerCastleDamage);
  assert.ok(first.playerCastleDamage >= 0);
  assert.ok(first.enemyCastleDamage >= 0);
  first.events.forEach((event, index) => {
    assert.ok(Number.isFinite(event.time));
    if (index > 0) {
      assert.ok(event.time >= first.events[index - 1].time);
    }
  });
  assert.equal(first.events[0].type, "combat_started");
  assert.equal(first.events.at(-1).type, "combat_finished");
});

test("only the combat winner's damage-capable survivors damage the opposing castle", () => {
  const playerWin = resolveCombat(
    createBoard([[0, "boar_rider"], [1, "spear_recruit"]]),
    createBoard([[0, "field_cleric"]]),
    2,
  );
  assert.equal(playerWin.winner, "player");
  assert.equal(playerWin.playerCastleDamage, 0);
  assert.equal(
    playerWin.enemyCastleDamage,
    playerWin.survivingPlayerUnits.filter((unit) => unit.abilityId !== "bulwark" && unit.abilityId !== "heal_only").length,
  );

  const enemyWin = resolveCombat(
    createBoard([[0, "field_cleric"]]),
    createBoard([[0, "boar_rider"], [1, "spear_recruit"]]),
    2,
  );
  assert.equal(enemyWin.winner, "enemy");
  assert.equal(enemyWin.enemyCastleDamage, 0);
  assert.equal(enemyWin.playerCastleDamage, enemyWin.hpLoss);
  assert.equal(
    enemyWin.playerCastleDamage,
    enemyWin.survivingEnemyUnits.filter((unit) => unit.abilityId !== "bulwark" && unit.abilityId !== "heal_only").length,
  );

  const draw = resolveCombat(createBoard([[0, "field_cleric"]]), createBoard([[0, "field_cleric"]]), 2);
  assert.equal(draw.winner, "draw");
  assert.equal(draw.playerCastleDamage, 0);
  assert.equal(draw.enemyCastleDamage, 0);
});

test("two rogues receive the real +1 attack synergy", () => {
  const player = createBoard([[0, "sneakblade"], [1, "longbow_hunter"]]);
  const enemy = createBoard([[0, "field_cleric"]]);
  const result = resolveCombat(player, enemy, 2);
  const synergy = result.events.find((event) => event.type === "synergy_applied" && event.owner === "player" && event.tag === "rogue");

  assert.ok(synergy);
  assert.equal(synergy.attackBonus, 1);
  assert.deepEqual(synergy.unitIds, ["player-0-sneakblade", "player-1-longbow_hunter"]);
  assert.equal(result.survivingPlayerUnits.find((unit) => unit.cardId === "sneakblade")?.attack, 5);
  assert.equal(result.survivingPlayerUnits.find((unit) => unit.cardId === "longbow_hunter")?.attack, 4);
});

for (const [cardId, splashDamage] of [["ember_mage", 1], ["pyromancer", 2]]) {
  test(`${cardId} splash damages only Manhattan-adjacent slots around the target`, () => {
    const player = createBoard([[1, cardId]]);
    const enemy = createBoard(Array.from({ length: 6 }, (_, slotIndex) => [slotIndex, "stone_golem"]));
    const result = resolveCombat(player, enemy, 7);
    const attack = result.events.find(
      (event) => event.type === "unit_attacked" && event.attackerId === `player-1-${cardId}`,
    );

    assert.ok(attack);
    assert.equal(attack.targetId, "enemy-1-stone_golem");

    const damagedAtFirstAttack = result.events
      .filter((event) => event.type === "unit_damaged" && event.time === attack.time);

    assert.deepEqual(damagedAtFirstAttack.map((event) => event.unitId).sort(), [
      "enemy-0-stone_golem",
      "enemy-1-stone_golem",
      "enemy-2-stone_golem",
      "enemy-4-stone_golem",
    ]);
    damagedAtFirstAttack
      .filter((event) => event.unitId !== attack.targetId)
      .forEach((event) => assert.equal(event.shieldAbsorbed, splashDamage));
  });
}

test("battle timeline preserves the combat outcome and terminal castle state", () => {
  const player = createBoard([[0, "boar_rider"], [1, "spear_recruit"]]);
  const enemy = createBoard([[0, "bone_soldier"]]);
  const combat = resolveCombat(player, enemy, 3);
  const playerHpBefore = 20;
  const enemyHpBefore = 20;
  const playerHpAfter = playerHpBefore - combat.playerCastleDamage;
  const enemyHpAfter = enemyHpBefore - combat.enemyCastleDamage;
  const timeline = createBattleTimeline({
    playerSlots: player,
    enemySlots: enemy,
    combat,
    playerCastleHpBefore: playerHpBefore,
    playerCastleHpAfter: playerHpAfter,
    enemyCastleHpBefore: enemyHpBefore,
    enemyCastleHpAfter: enemyHpAfter,
  });

  assert.equal(timeline.winner, combat.winner);
  assert.equal(timeline.events[0].type, "teams_enter");
  const finished = timeline.events.at(-1);
  assert.equal(finished.type, "battle_finished");
  assert.equal(finished.winner, combat.winner);
  assert.equal(finished.playerCastleHp, playerHpAfter);
  assert.equal(finished.enemyCastleHp, enemyHpAfter);
  assert.equal(
    timeline.events.filter((event) => event.type === "castle_hit" && event.owner === "player").length,
    combat.playerCastleDamage,
  );
  assert.equal(
    timeline.events.filter((event) => event.type === "castle_hit" && event.owner === "enemy").length,
    combat.enemyCastleDamage,
  );
  timeline.events.forEach((event, index) => {
    if (index > 0) {
      assert.ok(event.time >= timeline.events[index - 1].time);
    }
  });
});

test("battle timeline applies an enemy victory to the player castle", () => {
  const player = createBoard([[0, "field_cleric"]]);
  const enemy = createBoard([[0, "boar_rider"], [1, "spear_recruit"]]);
  const combat = resolveCombat(player, enemy, 3);
  const playerHpBefore = 12;
  const enemyHpBefore = 9;
  const playerHpAfter = playerHpBefore - combat.playerCastleDamage;
  const enemyHpAfter = enemyHpBefore - combat.enemyCastleDamage;

  assert.equal(combat.winner, "enemy");
  const timeline = createBattleTimeline({
    playerSlots: player,
    enemySlots: enemy,
    combat,
    playerCastleHpBefore: playerHpBefore,
    playerCastleHpAfter: playerHpAfter,
    enemyCastleHpBefore: enemyHpBefore,
    enemyCastleHpAfter: enemyHpAfter,
  });
  const finished = timeline.events.at(-1);

  assert.equal(finished.type, "battle_finished");
  assert.equal(finished.playerCastleHp, playerHpAfter);
  assert.equal(finished.enemyCastleHp, enemyHpAfter);
  assert.equal(
    timeline.events.filter((event) => event.type === "castle_hit" && event.owner === "player").length,
    combat.playerCastleDamage,
  );
  assert.equal(
    timeline.events.filter((event) => event.type === "castle_hit" && event.owner === "enemy").length,
    0,
  );
});
