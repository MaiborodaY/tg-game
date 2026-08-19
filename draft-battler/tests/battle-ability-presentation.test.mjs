import assert from "node:assert/strict";
import test from "node:test";

import { createBattleTimeline } from "../src/game/battleTimeline.ts";
import { resolveCombat } from "../src/game/combat.ts";
import {
  createBattleAbilityCalloutPlan,
  getBattleAbilityCallout,
} from "../src/rendering/battleAbilityPresentation.ts";

test("battle ability callouts map attack buffs and debuffs without player-facing copy", () => {
  assert.deepEqual(
    getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "ally", source: "battle_banner", attackDelta: 1 }),
    { unitId: "ally", source: "battle_banner", effect: "attack_up", tone: "buff", amount: 1 },
  );
  assert.deepEqual(
    getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "hunter", source: "pack_hunter", attackDelta: 1 }),
    { unitId: "hunter", source: "pack_hunter", effect: "attack_up", tone: "buff", amount: 1 },
  );
  assert.deepEqual(
    getBattleAbilityCallout({ type: "unit_buff", time: 25, unitId: "target", source: "frost_hex", attackDelta: -1 }),
    { unitId: "target", source: "frost_hex", effect: "attack_down", tone: "debuff", amount: 1 },
  );
});

test("battle ability callouts distinguish every existing armor source", () => {
  for (const [source, amount] of [
    ["thorn_guard", 1],
    ["shield_wall", 3],
    ["stone_skin", 5],
    ["riposte", 2],
  ]) {
    assert.deepEqual(
      getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "armored", source, shieldDelta: amount }),
      { unitId: "armored", source, effect: "armor_up", tone: "armor", amount },
    );
  }
});

test("battle timeline preserves buff sources for the presentation mapper", () => {
  const playerSlots = createBoard([[0, "banner_knight"], [1, "spear_recruit"]]);
  const enemySlots = createBoard([[0, "stone_golem"]]);
  const combat = resolveCombat(
    playerSlots,
    enemySlots,
    1,
  );
  const timeline = createTimeline(combat, playerSlots, enemySlots);
  const buff = timeline.events
    .filter((event) => event.type === "combat_step")
    .flatMap((event) => event.events)
    .find((event) => event.type === "unit_buff" && event.source === "battle_banner");

  assert.ok(buff);
  assert.deepEqual(getBattleAbilityCallout(buff, timeline.units), {
    unitId: "player-1-spear_recruit",
    source: "battle_banner",
    effect: "attack_up",
    tone: "buff",
    amount: 1,
  });
});

test("a Bone Pact spawn is recognized from its summoner while unrelated spawns stay silent", () => {
  const playerSlots = createBoard([[0, "boar_rider"], [1, "boar_rider"]]);
  const enemySlots = createBoard([[0, "grave_binder"]]);
  const combat = resolveCombat(playerSlots, enemySlots, 1);
  const timeline = createTimeline(combat, playerSlots, enemySlots);
  const spawn = timeline.events
    .filter((event) => event.type === "combat_step")
    .flatMap((event) => event.events)
    .find((event) => event.type === "unit_spawn");

  assert.ok(spawn);
  assert.deepEqual(getBattleAbilityCallout(spawn, timeline.units), {
    unitId: "enemy-0-bone_pact_skeleton",
    source: "bone_pact",
    effect: "summon",
    tone: "summon",
  });
  assert.equal(getBattleAbilityCallout(spawn), undefined);
});

test("unknown or inconsistent sources fail safe without a callout", () => {
  assert.equal(
    getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "ally", source: "future_ability", attackDelta: 5 }),
    undefined,
  );
  assert.equal(
    getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "ally", source: "battle_banner", attackDelta: -1 }),
    undefined,
  );
  assert.equal(
    getBattleAbilityCallout({ type: "unit_buff", time: 0, unitId: "ally", source: "thorn_guard", attackDelta: 1 }),
    undefined,
  );
  assert.equal(
    getBattleAbilityCallout({ type: "unit_attack", time: 10, attackerId: "ally", targetId: "enemy", damage: 3 }),
    undefined,
  );
});

test("callout plan anchors every stacked banner and thorn source", () => {
  const units = [
    createTimelineUnit("banner-a", "player", "banner_knight"),
    createTimelineUnit("banner-b", "player", "banner_knight"),
    createTimelineUnit("thorn-a", "player", "thorn_druid"),
    createTimelineUnit("thorn-b", "player", "thorn_druid"),
    createTimelineUnit("ally", "player", "spear_recruit"),
  ];
  const plan = createBattleAbilityCalloutPlan(
    [
      { type: "unit_buff", time: 0, unitId: "ally", source: "battle_banner", attackDelta: 1 },
      { type: "unit_buff", time: 0, unitId: "ally", source: "thorn_guard", shieldDelta: 1 },
    ],
    units,
    6,
  );

  assert.deepEqual(
    plan.map(({ source, anchorUnitId, amount }) => ({ source, anchorUnitId, amount })),
    [
      { source: "battle_banner", anchorUnitId: "banner-a", amount: 1 },
      { source: "thorn_guard", anchorUnitId: "thorn-a", amount: 1 },
      { source: "battle_banner", anchorUnitId: "banner-b", amount: 1 },
      { source: "thorn_guard", anchorUnitId: "thorn-b", amount: 1 },
    ],
  );
});

test("callout plan is side-fair and prioritizes distinct named mechanics over passive armor", () => {
  const units = [
    createTimelineUnit("player-guard", "player", "iron_guard"),
    createTimelineUnit("player-golem", "player", "stone_golem"),
    createTimelineUnit("player-duelist", "player", "duelist"),
    createTimelineUnit("player-banner", "player", "banner_knight"),
    createTimelineUnit("player-thorn", "player", "thorn_druid"),
    createTimelineUnit("player-wolf", "player", "wolfhound"),
    createTimelineUnit("enemy-guard", "enemy", "iron_guard"),
    createTimelineUnit("enemy-banner", "enemy", "banner_knight"),
    createTimelineUnit("enemy-wolf", "enemy", "wolfhound"),
  ];
  const events = [
    { type: "unit_buff", time: 0, unitId: "player-guard", source: "shield_wall", shieldDelta: 3 },
    { type: "unit_buff", time: 0, unitId: "player-golem", source: "stone_skin", shieldDelta: 5 },
    { type: "unit_buff", time: 0, unitId: "player-duelist", source: "riposte", shieldDelta: 2 },
    { type: "unit_buff", time: 0, unitId: "player-wolf", source: "battle_banner", attackDelta: 1 },
    { type: "unit_buff", time: 0, unitId: "player-wolf", source: "thorn_guard", shieldDelta: 1 },
    { type: "unit_buff", time: 0, unitId: "player-wolf", source: "pack_hunter", attackDelta: 1 },
    { type: "unit_buff", time: 0, unitId: "enemy-guard", source: "shield_wall", shieldDelta: 3 },
    { type: "unit_buff", time: 0, unitId: "enemy-wolf", source: "battle_banner", attackDelta: 1 },
    { type: "unit_buff", time: 0, unitId: "enemy-wolf", source: "pack_hunter", attackDelta: 1 },
  ];
  const plan = createBattleAbilityCalloutPlan(events, units);

  assert.deepEqual(
    plan.filter((item) => item.owner === "player").map((item) => item.source),
    ["pack_hunter", "battle_banner", "thorn_guard"],
  );
  assert.deepEqual(
    plan.filter((item) => item.owner === "enemy").map((item) => item.source),
    ["pack_hunter", "battle_banner", "shield_wall"],
  );
});

function createTimeline(combat, playerSlots, enemySlots) {
  return createBattleTimeline({
    playerSlots,
    enemySlots,
    combat,
    playerCastleHpBefore: 20,
    playerCastleHpAfter: 20 - combat.playerCastleDamage,
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: 20 - combat.enemyCastleDamage,
  });
}

function createBoard(entries) {
  return normalizeBoard(entries);
}

function normalizeBoard(entries) {
  const bySlot = new Map(entries.map(([slotIndex, cardId, upgradeLevel = 0]) => [slotIndex, { cardId, upgradeLevel }]));

  return Array.from({ length: 6 }, (_, slotIndex) => ({
    slotIndex,
    cardId: bySlot.get(slotIndex)?.cardId ?? null,
    upgradeLevel: bySlot.get(slotIndex)?.upgradeLevel ?? 0,
  }));
}

function createTimelineUnit(unitId, owner, cardId) {
  return {
    unitId,
    owner,
    cardId,
    name: cardId,
    slotIndex: 0,
    upgradeLevel: 0,
    attack: 1,
    maxHp: 1,
    startHp: 1,
    finalHp: 1,
    defeated: false,
  };
}
