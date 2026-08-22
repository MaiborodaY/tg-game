import assert from "node:assert/strict";
import test from "node:test";

import { CARD_BY_ID } from "../src/game/cards.ts";
import { resolveCombat } from "../src/game/combat.ts";
import {
  SYNERGY_MASTERY_THRESHOLD,
  SYNERGY_RULES,
  SYNERGY_TAG_ORDER,
  SYNERGY_THRESHOLD,
  getActiveSynergyTiers,
  isRoleEligibleForSynergy,
} from "../src/game/synergies.ts";

function createBoard(entries) {
  const cardsBySlot = new Map(entries.map(([slotIndex, cardId, upgradeLevel = 0]) => [
    slotIndex,
    { cardId, upgradeLevel },
  ]));

  return Array.from({ length: 6 }, (_, slotIndex) => ({
    slotIndex,
    cardId: cardsBySlot.get(slotIndex)?.cardId ?? null,
    upgradeLevel: cardsBySlot.get(slotIndex)?.upgradeLevel ?? 0,
  }));
}

function getSynergyEvents(combat, owner, tag) {
  return combat.events.filter(
    (event) => event.type === "synergy_applied" && event.owner === owner && event.tag === tag,
  );
}

test("every synergy keeps its original tier-two effect and exposes one tier-four mastery", () => {
  const expectedTierTwoEffects = {
    warrior: { kind: "stat", stat: "attack", value: 1 },
    beast: { kind: "stat", stat: "attack", value: 1 },
    mage: { kind: "stat", stat: "attack", value: 1 },
    undead: { kind: "stat", stat: "hp", value: 2 },
    rogue: { kind: "stat", stat: "attack", value: 1 },
    guardian: { kind: "stat", stat: "hp", value: 2 },
  };

  assert.equal(SYNERGY_THRESHOLD, 2);
  assert.equal(SYNERGY_MASTERY_THRESHOLD, 4);
  SYNERGY_TAG_ORDER.forEach((tag) => {
    const rule = SYNERGY_RULES[tag];

    assert.deepEqual(rule.tiers.map((tier) => tier.threshold), [2, 4], tag);
    assert.deepEqual(rule.tiers[0].effect, expectedTierTwoEffects[tag], tag);
    assert.deepEqual(getActiveSynergyTiers(rule, 3), [rule.tiers[0]], tag);
    assert.deepEqual(getActiveSynergyTiers(rule, 4), rule.tiers, tag);
  });

  assert.equal(isRoleEligibleForSynergy(SYNERGY_RULES.mage.tiers[0], "caster"), true);
  assert.equal(isRoleEligibleForSynergy(SYNERGY_RULES.mage.tiers[0], "tank"), false);
  assert.equal(isRoleEligibleForSynergy(SYNERGY_RULES.mage.tiers[1], "tank"), true);
});

test("four duplicate dual-tag units activate each tag tier once and stack different effects", () => {
  const board = createBoard([
    [0, "boar_rider"],
    [1, "boar_rider"],
    [2, "boar_rider"],
    [3, "boar_rider"],
  ]);
  const combat = resolveCombat(board, createBoard([]), 1);
  const events = combat.events.filter(
    (event) => event.type === "synergy_applied" && event.owner === "player",
  );

  assert.deepEqual(
    events.map((event) => [event.tag, event.threshold]),
    [["warrior", 2], ["warrior", 4], ["beast", 2], ["beast", 4]],
  );
  combat.survivingPlayerUnits.forEach((unit) => {
    assert.equal(unit.attack, 6);
    assert.equal(unit.speed, 6);
    assert.equal(unit.shield, 1);
  });
});

test("guardian mastery grants one armor to the whole army while tier two HP stays guardian-only", () => {
  const combat = resolveCombat(
    createBoard([
      [0, "iron_guard"],
      [1, "shieldbearer"],
      [2, "stone_golem"],
      [3, "field_cleric"],
      [4, "sneakblade"],
    ]),
    createBoard([]),
    1,
  );
  const guardianEvents = getSynergyEvents(combat, "player", "guardian");
  const hpTier = guardianEvents.find((event) => event.threshold === 2);
  const armorTier = guardianEvents.find((event) => event.threshold === 4);
  const rogue = combat.survivingPlayerUnits.find((unit) => unit.cardId === "sneakblade");

  assert.equal(hpTier?.unitIds.length, 4);
  assert.equal(hpTier?.hpBonus, 2);
  assert.equal(armorTier?.unitIds.length, 5);
  assert.equal(armorTier?.shieldBonus, 1);
  assert.ok(armorTier?.unitIds.includes("player-4-sneakblade"));
  assert.equal(rogue?.maxHp, CARD_BY_ID.sneakblade.stats.hp);
  assert.equal(rogue?.shield, 1);
});

test("beast mastery advances the very first action by exactly one speed", () => {
  const combat = resolveCombat(
    createBoard([
      [0, "wolfhound"],
      [1, "boar_rider"],
      [2, "forest_skirmisher"],
      [3, "bronze_minotaur"],
    ]),
    createBoard([[0, "stone_golem", 1]]),
    1,
  );
  const firstWolfhoundAttack = combat.events.find(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-0-wolfhound",
  );

  assert.ok(firstWolfhoundAttack);
  assert.equal(firstWolfhoundAttack.time, 100 / (CARD_BY_ID.wolfhound.stats.speed + 1));
  assert.equal(getSynergyEvents(combat, "player", "beast")[1]?.speedBonus, 1);
});

test("rogue mastery adds two damage only to each rogue's first attack", () => {
  const combat = resolveCombat(
    createBoard([
      [0, "sneakblade"],
      [1, "longbow_hunter"],
      [2, "bone_archer"],
      [3, "night_warden"],
    ]),
    createBoard([[0, "stone_golem", 1]]),
    1,
  );
  const sneakbladeAttacks = combat.events.filter(
    (event) => event.type === "unit_attacked" && event.attackerId === "player-0-sneakblade",
  );

  assert.ok(sneakbladeAttacks.length >= 2);
  assert.equal(sneakbladeAttacks[0].damage, CARD_BY_ID.sneakblade.stats.attack + 1 + 2 + 1);
  assert.equal(sneakbladeAttacks[1].damage, CARD_BY_ID.sneakblade.stats.attack + 1);
  assert.equal(getSynergyEvents(combat, "player", "rogue")[1]?.firstAttackDamage, 2);
});

test("mage mastery resolves after startup armor and remains neutral when the armies swap sides", () => {
  const mages = createBoard([
    [0, "ember_mage"],
    [1, "frost_acolyte"],
    [2, "pyromancer"],
    [3, "star_seer"],
  ]);
  const guardians = createBoard([
    [0, "iron_guard"],
    [1, "shieldbearer"],
    [2, "stone_golem"],
    [3, "field_cleric"],
  ]);
  const mageFirst = resolveCombat(mages, guardians, 1);
  const guardianFirst = resolveCombat(guardians, mages, 1);
  const openingDamage = mageFirst.events.filter(
    (event) => event.type === "unit_damaged" && event.time === 0 && event.unitId.startsWith("enemy-"),
  );

  assert.equal(openingDamage.length, 4);
  assert.ok(openingDamage.every((event) => event.amount === 0 && event.shieldAbsorbed === 1));
  assert.equal(mageFirst.winner, guardianFirst.winner === "player" ? "enemy" : guardianFirst.winner === "enemy" ? "player" : "draw");
  assert.equal(mageFirst.playerCastleDamage, guardianFirst.enemyCastleDamage);
  assert.equal(mageFirst.enemyCastleDamage, guardianFirst.playerCastleDamage);
  assert.equal(getSynergyEvents(mageFirst, "player", "mage")[1]?.openingDamage, 1);
});

test("opposing mage masteries kill simultaneously from one opening snapshot", () => {
  const cardIds = ["ember_mage", "frost_acolyte", "pyromancer", "star_seer"];
  const originalHp = cardIds.map((cardId) => CARD_BY_ID[cardId].stats.hp);

  try {
    cardIds.forEach((cardId) => {
      CARD_BY_ID[cardId].stats.hp = 1;
    });
    const board = createBoard(cardIds.map((cardId, slotIndex) => [slotIndex, cardId]));
    const combat = resolveCombat(board, board, 1);

    assert.equal(combat.winner, "draw");
    assert.equal(combat.actions, 0);
    assert.equal(combat.events.filter((event) => event.type === "unit_died" && event.time === 0).length, 8);
    assert.equal(combat.survivingPlayerUnits.length, 0);
    assert.equal(combat.survivingEnemyUnits.length, 0);
  } finally {
    cardIds.forEach((cardId, index) => {
      CARD_BY_ID[cardId].stats.hp = originalHp[index];
    });
  }
});

test("undead mastery waits for all same-tick deaths and buffs a late Bone Pact summon once", () => {
  const originalGraveBinderHp = CARD_BY_ID.grave_binder.stats.hp;

  try {
    CARD_BY_ID.grave_binder.stats.hp = 6;
    const combat = resolveCombat(
      createBoard([
        [0, "bone_archer"],
        [1, "grave_binder"],
        [3, "crypt_keeper"],
        [4, "soul_hunter"],
      ]),
      createBoard([
        [0, "headless_knight"],
        [1, "headless_knight"],
      ]),
      1,
    );
    const spawn = combat.events.find(
      (event) => event.type === "unit_spawned" && event.unit.summonedBy === "player-1-grave_binder",
    );
    const masteryBuffs = combat.events.filter(
      (event) => event.type === "unit_buffed" && event.source === "synergy_undead_4",
    );
    const firstDeathTime = combat.events.find(
      (event) => event.type === "unit_died" && event.unitId === "player-0-bone_archer",
    )?.time;

    assert.ok(spawn);
    assert.equal(spawn.unit.attack, 2, "spawn event must remain a pre-buff snapshot");
    assert.ok(masteryBuffs.some((event) => event.unitId === "player-1-bone_pact_skeleton"));
    assert.ok(masteryBuffs.every((event) => event.time === firstDeathTime));
    assert.equal(masteryBuffs.filter((event) => event.unitId === "player-1-bone_pact_skeleton").length, 1);
    assert.ok(masteryBuffs.every((event) => !event.unitId.includes("bone_archer") && !event.unitId.includes("grave_binder")));
  } finally {
    CARD_BY_ID.grave_binder.stats.hp = originalGraveBinderHp;
  }
});
