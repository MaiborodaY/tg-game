import assert from "node:assert/strict";
import test from "node:test";

import { CARD_DEFINITIONS, createBattleTimeline, resolveCombat } from "../src/game/index.ts";

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

test("Duelist armor absorbs exactly two damage before HP", () => {
  const combat = resolveCombat(
    createBoard([[0, "duelist"]]),
    createBoard([[0, "iron_guard"]]),
    1,
  );
  const armorGain = combat.events.find(
    (event) => event.type === "unit_buffed" && event.unitId === "player-0-duelist",
  );
  const hits = combat.events.filter(
    (event) => event.type === "unit_damaged" && event.unitId === "player-0-duelist",
  );

  assert.ok(armorGain);
  assert.equal(armorGain.type, "unit_buffed");
  assert.equal(armorGain.shieldDelta, 2);
  assert.deepEqual(
    hits.slice(0, 2).map(({ amount, remainingHp, shieldAbsorbed }) => ({ amount, remainingHp, shieldAbsorbed })),
    [
      { amount: 0, remainingHp: 8, shieldAbsorbed: 2 },
      { amount: 2, remainingHp: 6, shieldAbsorbed: 0 },
    ],
  );
});

test("equal-time actors resolve simultaneously, including mutual lethal attacks", () => {
  const board = createBoard([[0, "sneakblade"]]);
  const first = resolveCombat(board, board, 1);
  const repeated = resolveCombat(board, board, 1);
  const finalAttacks = first.events.filter(
    (event) => event.type === "unit_attacked" && event.time === 200 / 7,
  );

  assert.deepEqual(first, repeated);
  assert.equal(first.winner, "draw");
  assert.equal(first.actions, 4);
  assert.deepEqual(finalAttacks.map((event) => event.attackerId), [
    "player-0-sneakblade",
    "enemy-0-sneakblade",
  ]);
});

test("every single-card mirror is side-neutral", () => {
  CARD_DEFINITIONS.forEach((card) => {
    const board = createBoard([[0, card.id]]);
    const combat = resolveCombat(board, board, 1);

    assert.equal(combat.winner, "draw", card.id);
    assert.equal(combat.playerCastleDamage, 0, card.id);
    assert.equal(combat.enemyCastleDamage, 0, card.id);
  });
});

test("mixed speeds share one simultaneous tick at their mathematical convergence", () => {
  const combat = resolveCombat(
    createBoard([[0, "banner_knight"], [1, "longbow_hunter"]]),
    createBoard([[0, "shieldbearer", 1]]),
    1,
  );
  const attacksAtConvergence = combat.events
    .filter((event) => event.type === "unit_attacked" && event.time === 100)
    .map((event) => event.attackerId);

  assert.deepEqual(attacksAtConvergence, [
    "player-0-banner_knight",
    "player-1-longbow_hunter",
  ]);
});

test("normal range one must clear the enemy front row before attacking the back row", () => {
  const combat = resolveCombat(
    createBoard([[4, "boar_rider"]]),
    createBoard([[0, "ember_mage"], [4, "field_cleric"]]),
    1,
  );
  const attacks = combat.events.filter(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-4-boar_rider",
  );

  assert.equal(attacks[0]?.targetId, "enemy-0-ember_mage");
  assert.equal(attacks[1]?.targetId, "enemy-4-field_cleric");
});

test("normal range two can attack an exposed paired back slot but not a protected one", () => {
  const exposed = resolveCombat(
    createBoard([[4, "spear_recruit"]]),
    createBoard([[0, "iron_guard"], [4, "field_cleric"]]),
    1,
  );
  const protectedBack = resolveCombat(
    createBoard([[4, "spear_recruit"]]),
    createBoard([[0, "iron_guard"], [1, "bone_soldier"], [4, "field_cleric"]]),
    1,
  );
  const exposedAttack = exposed.events.find(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-4-spear_recruit",
  );
  const protectedAttack = protectedBack.events.find(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-4-spear_recruit",
  );

  assert.ok(exposedAttack);
  assert.ok(protectedAttack);
  assert.equal(exposedAttack.targetId, "enemy-4-field_cleric");
  assert.equal(protectedAttack.targetId, "enemy-1-bone_soldier");
});

test("normal range three can reach the back row while snipe remains weakest-anywhere", () => {
  const normal = resolveCombat(
    createBoard([[4, "ember_mage"]]),
    createBoard([[0, "field_cleric"], [4, "stone_golem"]]),
    1,
  );
  const snipe = resolveCombat(
    createBoard([[4, "longbow_hunter"]]),
    createBoard([[0, "stone_golem"], [5, "field_cleric"]]),
    1,
  );
  const normalAttack = normal.events.find(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-4-ember_mage",
  );
  const snipeAttack = snipe.events.find(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-4-longbow_hunter",
  );

  assert.ok(normalAttack);
  assert.ok(snipeAttack);
  assert.equal(normalAttack.targetId, "enemy-4-stone_golem");
  assert.equal(snipeAttack.targetId, "enemy-5-field_cleric");
});

test("front-row bulwark taunts normal attacks but not backstab or snipe", () => {
  for (const [attackerCardId, ignoresTaunt] of [
    ["ember_mage", false],
    ["sneakblade", true],
    ["longbow_hunter", true],
  ]) {
    const combat = resolveCombat(
      createBoard([[4, attackerCardId]]),
      createBoard([[0, "shieldbearer"], [4, "field_cleric"]]),
      1,
    );
    const attack = combat.events.find(
      (event) => event.type === "unit_attacked" && event.attackerId === `player-4-${attackerCardId}`,
    );

    assert.ok(attack);
    assert.equal(attack.targetId, ignoresTaunt ? "enemy-4-field_cleric" : "enemy-0-shieldbearer");
  }
});

test("mirrored bulwarks make the same block decision regardless of owner prefixes", () => {
  const board = createBoard([[0, "spear_recruit"], [1, "shieldbearer"]]);
  const combat = resolveCombat(board, board, 1);
  const firstAttackTime = combat.events.find((event) => event.type === "unit_attacked")?.time;
  const attackersAtFirstTick = combat.events
    .filter((event) => event.type === "unit_attacked" && event.time === firstAttackTime)
    .map((event) => event.attackerId);
  const blockedAttackers = new Set(
    combat.events
      .filter((event) => event.type === "unit_blocked" && event.time === firstAttackTime)
      .map((event) => event.attackerId),
  );

  assert.deepEqual(attackersAtFirstTick, ["player-0-spear_recruit", "enemy-0-spear_recruit"]);
  assert.equal(
    blockedAttackers.has("player-0-spear_recruit"),
    blockedAttackers.has("enemy-0-spear_recruit"),
  );
});

test("multiple same-tick lethal intents produce one death and one Bone Pact summon", () => {
  const combat = resolveCombat(
    createBoard([[0, "boar_rider"], [1, "boar_rider"]]),
    createBoard([[0, "grave_binder"]]),
    1,
  );
  const graveBinderDeaths = combat.events.filter(
    (event) => event.type === "unit_died" && event.unitId === "enemy-0-grave_binder",
  );
  const graveBinderSummons = combat.events.filter(
    (event) => event.type === "unit_spawned" && event.unit.summonedBy === "enemy-0-grave_binder",
  );

  assert.equal(graveBinderDeaths.length, 1);
  assert.equal(graveBinderSummons.length, 1);
});

test("an upgraded Grave Binder summons a stronger skeleton", () => {
  const attackers = createBoard([[0, "boar_rider"], [1, "boar_rider"]]);
  const cases = [
    { upgradeLevel: 0, attack: 2, hp: 4 },
    { upgradeLevel: 1, attack: 3, hp: 6 },
  ];

  cases.forEach(({ upgradeLevel, attack, hp }) => {
    const combat = resolveCombat(
      attackers,
      createBoard([[0, "grave_binder", upgradeLevel]]),
      1,
    );
    const spawn = combat.events.find(
      (event) => event.type === "unit_spawned" && event.unit.summonedBy === "enemy-0-grave_binder",
    );

    assert.ok(spawn);
    assert.equal(spawn.unit.upgradeLevel, upgradeLevel);
    assert.equal(spawn.unit.attack, attack);
    assert.equal(spawn.unit.maxHp, hp);
  });
});

test("a late Bone Pact summon keeps a monotonic cadence from its spawn time", () => {
  const combat = resolveCombat(
    createBoard([[0, "iron_guard"]]),
    createBoard([[0, "grave_binder"]]),
    1,
  );
  const spawn = combat.events.find(
    (event) => event.type === "unit_spawned" && event.unit.summonedBy === "enemy-0-grave_binder",
  );
  const skeletonAttackTimes = combat.events
    .filter((event) => event.type === "unit_attacked" && event.attackerId === "enemy-0-bone_pact_skeleton")
    .map((event) => event.time);

  assert.ok(spawn);
  assert.deepEqual(skeletonAttackTimes.slice(0, 2), [spawn.time + 1, spawn.time + 26]);
  combat.events.forEach((event, index) => {
    if (index > 0) {
      assert.ok(event.time >= combat.events[index - 1].time);
    }
  });
});

test("healing resolves before damage within a simultaneous tick", () => {
  const combat = resolveCombat(
    createBoard([[0, "iron_guard"], [4, "field_cleric"]]),
    createBoard([[0, "wolfhound"]]),
    1,
  );
  const healEventIndex = combat.events.findIndex(
    (event) => event.type === "unit_healed" && event.time === 25 && event.unitId === "player-0-iron_guard",
  );
  const damageEventIndex = combat.events.findIndex(
    (event) => event.type === "unit_damaged" && event.time === 25 && event.unitId === "player-0-iron_guard",
  );
  const damageEvent = combat.events[damageEventIndex];

  assert.ok(healEventIndex >= 0);
  assert.ok(damageEventIndex > healEventIndex);
  assert.ok(damageEvent);
  assert.equal(damageEvent.type, "unit_damaged");
  assert.equal(damageEvent.remainingHp, 12);
});

test("the action cap stops before a simultaneous group instead of resolving half a tie", () => {
  const board = createBoard([[0, "stone_golem"], [1, "stone_golem"], [2, "stone_golem"]]);
  const combat = resolveCombat(board, board, 2);
  const attackEvents = combat.events.filter((event) => event.type === "unit_attacked");
  const lastAttackTime = Math.max(...attackEvents.map((event) => event.time));
  const finalTickAttackers = attackEvents
    .filter((event) => event.time === lastAttackTime)
    .map((event) => event.attackerId);

  assert.equal(combat.winner, "draw");
  assert.equal(combat.actions, 78);
  assert.deepEqual(finalTickAttackers, [
    "player-0-stone_golem",
    "player-1-stone_golem",
    "player-2-stone_golem",
    "enemy-0-stone_golem",
    "enemy-1-stone_golem",
    "enemy-2-stone_golem",
  ]);
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
  const assault = timeline.events.find((event) => event.type === "castle_assault");
  assert.ok(assault);
  assert.equal(assault.owner, "enemy");
  assert.equal(assault.damage, combat.enemyCastleDamage);
  assert.equal(assault.remainingHp, enemyHpAfter);
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
  const assault = timeline.events.find((event) => event.type === "castle_assault");
  assert.ok(assault);
  assert.equal(assault.owner, "player");
  assert.equal(assault.damage, combat.playerCastleDamage);
  assert.equal(assault.remainingHp, playerHpAfter);
});

test("battle timeline groups one or six survivors into a count-independent castle assault", () => {
  const createWonCombat = (enemyCastleDamage) => ({
    winner: "player",
    hpLoss: 0,
    playerCastleDamage: 0,
    enemyCastleDamage,
    actions: 0,
    events: [
      { type: "combat_started", time: 0, playerUnits: [], enemyUnits: [] },
      { type: "combat_finished", time: 10, winner: "player", hpLoss: 0, actions: 0 },
    ],
    survivingPlayerUnits: [],
    survivingEnemyUnits: [],
  });
  const onePlayer = createBoard([[0, "spear_recruit"]]);
  const sixPlayers = createBoard(Array.from({ length: 6 }, (_, slotIndex) => [slotIndex, "spear_recruit"]));
  const emptyEnemy = createBoard([]);
  const one = createBattleTimeline({
    playerSlots: onePlayer,
    enemySlots: emptyEnemy,
    combat: createWonCombat(1),
    playerCastleHpBefore: 20,
    playerCastleHpAfter: 20,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 19,
  });
  const six = createBattleTimeline({
    playerSlots: sixPlayers,
    enemySlots: emptyEnemy,
    combat: createWonCombat(6),
    playerCastleHpBefore: 20,
    playerCastleHpAfter: 20,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 14,
  });
  const oneAssault = one.events.find((event) => event.type === "castle_assault");
  const sixAssault = six.events.find((event) => event.type === "castle_assault");

  assert.ok(oneAssault);
  assert.ok(sixAssault);
  assert.deepEqual(oneAssault.attackerIds, ["player-0-spear_recruit"]);
  assert.deepEqual(
    sixAssault.attackerIds,
    Array.from({ length: 6 }, (_, slotIndex) => `player-${slotIndex}-spear_recruit`),
  );
  assert.equal(oneAssault.damage, 1);
  assert.equal(sixAssault.damage, 6);
  assert.equal(oneAssault.time, sixAssault.time);
  assert.equal(one.events.at(-1).time, six.events.at(-1).time);
});

test("battle timeline excludes non-damaging survivors from the castle assault", () => {
  const player = createBoard([
    [0, "shieldbearer"],
    [1, "field_cleric"],
    [2, "spear_recruit"],
  ]);
  const combat = {
    winner: "player",
    hpLoss: 0,
    playerCastleDamage: 0,
    enemyCastleDamage: 1,
    actions: 0,
    events: [
      { type: "combat_started", time: 0, playerUnits: [], enemyUnits: [] },
      { type: "combat_finished", time: 10, winner: "player", hpLoss: 0, actions: 0 },
    ],
    survivingPlayerUnits: [],
    survivingEnemyUnits: [],
  };
  const timeline = createBattleTimeline({
    playerSlots: player,
    enemySlots: createBoard([]),
    combat,
    playerCastleHpBefore: 20,
    playerCastleHpAfter: 20,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 19,
  });
  const assault = timeline.events.find((event) => event.type === "castle_assault");

  assert.ok(assault);
  assert.deepEqual(assault.attackerIds, ["player-2-spear_recruit"]);
  assert.equal(timeline.units.find((unit) => unit.unitId === "player-0-shieldbearer")?.defeated, false);
  assert.equal(timeline.units.find((unit) => unit.unitId === "player-1-field_cleric")?.defeated, false);
  assert.equal(timeline.units.find((unit) => unit.unitId === "player-2-spear_recruit")?.defeated, true);
});

test("battle timeline clamps an enemy castle assault to the player's remaining HP", () => {
  const enemy = createBoard(Array.from({ length: 6 }, (_, slotIndex) => [slotIndex, "spear_recruit"]));
  const combat = {
    winner: "enemy",
    hpLoss: 6,
    playerCastleDamage: 6,
    enemyCastleDamage: 0,
    actions: 0,
    events: [
      { type: "combat_started", time: 0, playerUnits: [], enemyUnits: [] },
      { type: "combat_finished", time: 10, winner: "enemy", hpLoss: 6, actions: 0 },
    ],
    survivingPlayerUnits: [],
    survivingEnemyUnits: [],
  };
  const timeline = createBattleTimeline({
    playerSlots: createBoard([]),
    enemySlots: enemy,
    combat,
    playerCastleHpBefore: 2,
    playerCastleHpAfter: 0,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 20,
  });
  const assault = timeline.events.find((event) => event.type === "castle_assault");

  assert.ok(assault);
  assert.equal(assault.owner, "player");
  assert.equal(assault.attackerIds.length, 6);
  assert.equal(assault.damage, 2);
  assert.equal(assault.remainingHp, 0);
  assert.ok(
    timeline.units
      .filter((unit) => unit.owner === "enemy")
      .every((unit) => unit.defeated),
  );
});

test("battle timeline does not create a castle assault for a draw", () => {
  const board = createBoard([[0, "spear_recruit"]]);
  const combat = resolveCombat(board, board, 1);
  const timeline = createBattleTimeline({
    playerSlots: board,
    enemySlots: board,
    combat,
    playerCastleHpBefore: 20,
    playerCastleHpAfter: 20,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 20,
  });

  assert.equal(combat.winner, "draw");
  assert.equal(timeline.events.some((event) => event.type === "castle_assault"), false);
});
