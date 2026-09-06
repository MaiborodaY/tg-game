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
  assert.deepEqual(
    getBattleAbilityCallout({ type: "unit_buff", time: 50, unitId: "undead", source: "synergy_undead_4", attackDelta: 1 }),
    { unitId: "undead", source: "synergy_undead_4", effect: "attack_up", tone: "buff", amount: 1 },
  );
});

test("undead mastery callouts stay visible within the per-side quota", () => {
  const units = [
    createTimelineUnit("undead-a", "player", "bone_soldier"),
    createTimelineUnit("undead-b", "player", "bone_archer"),
    createTimelineUnit("ally", "player", "spear_recruit"),
  ];
  const plan = createBattleAbilityCalloutPlan(
    [
      { type: "unit_buff", time: 50, unitId: "undead-a", source: "synergy_undead_4", attackDelta: 1 },
      { type: "unit_buff", time: 50, unitId: "undead-b", source: "synergy_undead_4", attackDelta: 1 },
      { type: "unit_buff", time: 50, unitId: "ally", source: "battle_banner", attackDelta: 1 },
      { type: "unit_buff", time: 50, unitId: "ally", source: "shield_wall", shieldDelta: 3 },
    ],
    units,
  );

  assert.deepEqual(
    plan.map(({ source, anchorUnitId }) => ({ source, anchorUnitId })),
    [
      { source: "synergy_undead_4", anchorUnitId: "undead-a" },
      { source: "battle_banner", anchorUnitId: "ally" },
      { source: "shield_wall", anchorUnitId: "ally" },
    ],
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

test("all eight redesigns use explicit trigger events with truthful source and target anchors", () => {
  const expectations = [
    ["poison_bite", "poison", "poison", "target"],
    ["armor_corrosion", "armor_down", "debuff", "target"],
    ["bodyguard", "protect", "armor", "caster"],
    ["phantom_parry", "parry", "armor", "caster"],
    ["piercing_bolt", "pierce", "damage", "target"],
    ["frost_delay", "delay", "debuff", "target"],
    ["moon_chorus", "heal", "heal", "caster"],
    ["threat_sight", "focus", "damage", "target"],
  ];
  for (const [abilityId, effect, tone, anchor] of expectations) {
    assert.deepEqual(getBattleAbilityCallout({
      type: "unit_ability", time: 20, unitId: "caster", targetId: "target", abilityId, amount: 2,
    }), { unitId: anchor, sourceUnitId: "caster", source: abilityId, effect, tone, amount: 2 });
  }
  assert.equal(getBattleAbilityCallout({
    type: "unit_ability", time: 20, unitId: "caster", targetId: "target", abilityId: "none",
  }), undefined);
});

test("poison and counter damage retain visible source labels without guessing from the victim's card", () => {
  for (const [hit, source, tone] of [["poison", "poison_tick", "poison"], ["counter", "counter", "damage"]]) {
    assert.deepEqual(getBattleAbilityCallout({
      type: "unit_damage", time: 40, unitId: "target", amount: 1, remainingHp: 4, shieldAbsorbed: 0,
      source: { kind: "unit", unitId: "caster", hit },
    }), { unitId: "target", sourceUnitId: "caster", source, effect: "damage", tone, amount: 1 });
  }
  assert.equal(getBattleAbilityCallout({
    type: "unit_damage", time: 40, unitId: "target", amount: 0, remainingHp: 5, shieldAbsorbed: 2,
    source: { kind: "unit", unitId: "caster", hit: "corrosion" },
  }), undefined, "Corrosion uses its explicit trigger, not a false HP-damage label");
  assert.equal(getBattleAbilityCallout({
    type: "unit_damage", time: 40, unitId: "target", amount: 0, remainingHp: 5, shieldAbsorbed: 2,
    source: { kind: "unit", unitId: "caster", hit: "counter" },
  })?.source, "counter", "A counter remains identifiable when armor absorbs all of it");
});

test("hostile callouts count against the caster's quota and group healing emits once per caster", () => {
  const units = [
    createTimelineUnit("rat", "player", "plague_rat"),
    createTimelineUnit("moon", "enemy", "moon_priestess"),
    createTimelineUnit("target", "enemy", "bone_soldier"),
    createTimelineUnit("target2", "enemy", "bone_archer"),
  ];
  const plan = createBattleAbilityCalloutPlan([
    { type: "unit_ability", time: 20, unitId: "rat", targetId: "target", abilityId: "poison_bite" },
    { type: "unit_ability", time: 20, unitId: "moon", targetId: "target", abilityId: "moon_chorus", amount: 1 },
    { type: "unit_ability", time: 20, unitId: "moon", targetId: "target2", abilityId: "moon_chorus", amount: 1 },
    { type: "unit_ability", time: 20, unitId: "moon", targetId: "moon", abilityId: "moon_chorus", amount: 1 },
  ], units);
  assert.deepEqual(plan.map(({ source, owner, anchorUnitId }) => ({ source, owner, anchorUnitId })), [
    { source: "poison_bite", owner: "player", anchorUnitId: "target" },
    { source: "moon_chorus", owner: "enemy", anchorUnitId: "moon" },
  ]);
});

test("timeline retains explicit ability triggers and delayed damage attribution at their original combat time", () => {
  const playerSlots = createBoard([[0, "plague_rat"]]);
  const enemySlots = createBoard([[0, "stone_golem"]]);
  const source = { kind: "unit", unitId: "player-0-plague_rat", hit: "poison" };
  const combat = {
    winner: "draw", hpLoss: 0, playerCastleDamage: 0, enemyCastleDamage: 0, actions: 1,
    survivingPlayerUnits: [], survivingEnemyUnits: [],
    events: [
      { type: "ability_triggered", time: 12.5, unitId: source.unitId, targetId: "enemy-0-stone_golem", abilityId: "poison_bite" },
      { type: "unit_damaged", time: 50, unitId: "enemy-0-stone_golem", amount: 1, hpDamage: 1, remainingHp: 15, shieldAbsorbed: 0, source },
    ],
  };
  const timeline = createTimeline(combat, playerSlots, enemySlots);
  const steps = timeline.events.filter((event) => event.type === "combat_step");
  assert.equal(steps.length, 2);
  assert.deepEqual(steps[0].events[0], { ...combat.events[0], type: "unit_ability" });
  assert.deepEqual(steps[1].events[0].source, source);
  assert.equal(steps[1].events[0].time, 50);
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
