import assert from "node:assert/strict";
import test from "node:test";
import { CARD_BY_ID } from "../src/game/cards.ts";
import { resolveCombat } from "../src/game/combat.ts";

function board(entries) {
  return Array.from({ length: 6 }, (_, slotIndex) => {
    const entry = entries.find(([slot]) => slot === slotIndex);
    return { slotIndex, cardId: entry?.[1] ?? null, upgradeLevel: entry?.[2] ?? 0 };
  });
}

// Isolate each mechanic from roster tuning and synergy bonuses; always restore the shared definitions.
function scenario(overrides, player, enemy) {
  const originals = Object.entries(overrides).map(([id]) => [id, { ...CARD_BY_ID[id] }]);
  try {
    Object.entries(overrides).forEach(([id, changes]) => {
      Object.assign(CARD_BY_ID[id], { tags: [], ...changes,
        stats: { attack: 1, hp: 100, speed: 5, range: 1, ...changes.stats } });
    });
    return resolveCombat(board(player), board(enemy), 1);
  } finally {
    originals.forEach(([id, original]) => Object.assign(CARD_BY_ID[id], original));
  }
}

function triggers(combat, abilityId) {
  return combat.events.filter((event) => event.type === "ability_triggered" && event.abilityId === abilityId);
}

function damage(combat, hit) {
  return combat.events.filter((event) => event.type === "unit_damaged" && event.source?.hit === hit);
}

test("poison bypasses remaining armor and never ticks on its first application tick", () => {
  const combat = scenario({ plague_rat: {}, stone_golem: {} }, [[0, "plague_rat"]], [[0, "stone_golem"]]);
  const firstApplication = triggers(combat, "poison_bite")[0];
  const firstTick = damage(combat, "poison")[0];
  assert.equal(firstApplication.time, 20);
  assert.equal(firstTick.time, 40);
  assert.equal(firstTick.hpDamage, 1);
  assert.equal(firstTick.shieldAbsorbed, 0);
  const absorbed = damage(combat, "primary").filter((event) => event.unitId === "enemy-0-stone_golem" && event.time <= 40)
    .reduce((sum, event) => sum + event.shieldAbsorbed, 0);
  assert.ok(absorbed < 5, "armor still exists when poison removes HP");
});

test("two rats refresh one poison rather than stacking damage", () => {
  const combat = scenario({ plague_rat: {}, stone_golem: {} },
    [[0, "plague_rat"], [1, "plague_rat"]], [[0, "stone_golem"]]);
  const ticks = damage(combat, "poison");
  assert.ok(ticks.length > 1);
  assert.equal(new Set(ticks.map((event) => event.time)).size, ticks.length);
  assert.ok(ticks.every((event) => event.hpDamage === 1));
});

test("poison remains attributed to the dead rat and expires after two remaining turns", () => {
  const combat = scenario({ plague_rat: { stats: { hp: 2, speed: 10 } },
    shieldbearer: {}, stone_golem: { stats: { attack: 5, speed: 5 } } },
  [[0, "plague_rat"], [5, "shieldbearer"]], [[0, "stone_golem"]]);
  const death = combat.events.find((event) => event.type === "unit_died" && event.unitId === "player-0-plague_rat");
  assert.ok(death);
  const later = damage(combat, "poison").filter((event) => event.time > death.time);
  assert.equal(later.length, 2);
  assert.ok(later.every((event) => event.source.unitId === death.unitId));
});

test("a stationary shieldbearer takes poison on passive turns without gaining attacks", () => {
  const combat = scenario({ plague_rat: {}, shieldbearer: {} }, [[0, "plague_rat"]], [[0, "shieldbearer"]]);
  assert.ok(damage(combat, "poison").length > 0);
  assert.equal(combat.events.some((event) => event.type === "unit_attacked" && event.attackerId === "enemy-0-shieldbearer"), false);
});

test("armor corrosion removes two armor before hit, stops when armor is gone, and never heals", () => {
  const combat = scenario({ battle_alchemist: {}, stone_golem: {} }, [[0, "battle_alchemist"]], [[0, "stone_golem"]]);
  assert.deepEqual(damage(combat, "corrosion").map((event) => event.shieldAbsorbed), [2, 2]);
  assert.ok(damage(combat, "corrosion").every((event) => event.hpDamage === 0 && event.amount === 0));
  const primary = damage(combat, "primary").filter((event) => event.source.unitId === "player-0-battle_alchemist");
  assert.equal(primary[0].shieldAbsorbed, 1);
  assert.equal(primary[1].hpDamage, 1);
  assert.equal(combat.events.some((event) => event.type === "unit_healed"), false);
});

test("bodyguard intercepts only one of two simultaneous direct hits for the ally behind", () => {
  const combat = scenario({ night_warden: { stats: { hp: 200 } }, spear_recruit: { stats: { hp: 50 } },
    longbow_hunter: {} }, [[0, "night_warden"], [3, "spear_recruit"]], [[0, "longbow_hunter"], [1, "longbow_hunter"]]);
  const guards = triggers(combat, "bodyguard");
  assert.equal(guards.length, 1);
  assert.equal(guards[0].unitId, "player-0-night_warden");
  assert.equal(guards[0].targetId, "player-3-spear_recruit");
  const firstAttacks = combat.events.filter((event) => event.type === "unit_attacked" && event.attackerId.startsWith("enemy") && event.time === 20);
  assert.deepEqual(firstAttacks.map((event) => event.targetId), ["player-0-night_warden", "player-3-spear_recruit"]);
});

test("bodyguard does not protect another column, work from rear, or intercept splash", () => {
  for (const [guardSlot, allySlot] of [[0, 4], [3, 0]]) {
    const combat = scenario({ night_warden: { stats: { hp: 200 } }, spear_recruit: { stats: { hp: 50 } }, longbow_hunter: {} },
      [[guardSlot, "night_warden"], [allySlot, "spear_recruit"]], [[0, "longbow_hunter"]]);
    assert.equal(triggers(combat, "bodyguard").length, 0);
  }
  const splash = scenario({ night_warden: {}, spear_recruit: {}, ember_mage: { stats: { range: 3 } } },
    [[0, "night_warden"], [3, "spear_recruit"]], [[0, "ember_mage"]]);
  assert.equal(triggers(splash, "bodyguard").length, 0);
  assert.ok(damage(splash, "splash").some((event) => event.unitId === "player-3-spear_recruit"));
});

test("parry blocks one direct attack and deals a fixed two-damage counter", () => {
  const combat = scenario({ phantom_duelist: {}, spear_recruit: { stats: { attack: 5 } } },
    [[0, "phantom_duelist"]], [[0, "spear_recruit"], [1, "spear_recruit"]]);
  assert.equal(triggers(combat, "phantom_parry").length, 1);
  const counters = damage(combat, "counter");
  assert.equal(counters.length, 1);
  assert.equal(counters[0].hpDamage, 2);
  const firstHits = damage(combat, "primary").filter((event) => event.unitId === "player-0-phantom_duelist" && event.time === 20);
  assert.equal(firstHits.length, 1, "the second simultaneous attacker is not also parried");
  assert.equal(firstHits[0].hpDamage, 5);
});

test("mutual parries are symmetric and counterattacks cannot recurse", () => {
  const combat = scenario({ phantom_duelist: {} }, [[0, "phantom_duelist"]], [[0, "phantom_duelist"]]);
  assert.equal(triggers(combat, "phantom_parry").length, 2);
  assert.equal(damage(combat, "counter").length, 2);
  assert.equal(combat.winner, "draw");
});

test("a counter fixed by the tick snapshot survives lethal splash in that same tick", () => {
  const combat = scenario({ pyromancer: {}, spear_recruit: {}, iron_guard: {}, phantom_duelist: { stats: { hp: 1 } } },
    [[0, "pyromancer"], [1, "spear_recruit"]], [[0, "iron_guard"], [1, "phantom_duelist"]]);
  const death = combat.events.find((event) => event.type === "unit_died" && event.unitId === "enemy-1-phantom_duelist");
  const counter = damage(combat, "counter")[0];
  assert.ok(death);
  assert.ok(counter);
  assert.equal(counter.time, death.time);
  assert.equal(counter.source.unitId, death.unitId);
  assert.equal(counter.hpDamage, 2);
});

test("splash does not consume parry or provoke a counter", () => {
  const combat = scenario({ phantom_duelist: {}, shieldbearer: {}, ember_mage: { stats: { range: 3 } } },
    [[0, "shieldbearer"], [3, "phantom_duelist"]], [[0, "ember_mage"]]);
  assert.ok(damage(combat, "splash").some((event) => event.unitId === "player-3-phantom_duelist"));
  assert.equal(triggers(combat, "phantom_parry").length, 0);
  assert.equal(damage(combat, "counter").length, 0);
});

test("engineer hits only the enemy directly behind the front target for two damage", () => {
  const combat = scenario({ siege_engineer: { stats: { range: 3 } }, spear_recruit: {} },
    [[0, "siege_engineer"]], [[0, "spear_recruit"], [1, "spear_recruit"], [3, "spear_recruit"], [4, "spear_recruit"]]);
  const firstSplash = damage(combat, "splash").filter((event) => event.time === 20);
  assert.deepEqual(firstSplash.map((event) => [event.unitId, event.hpDamage]), [["enemy-3-spear_recruit", 2]]);
  assert.ok(triggers(combat, "piercing_bolt").length > 0);
});

test("engineer does not invent a secondary hit when targeting the rear row", () => {
  const combat = scenario({ siege_engineer: { stats: { range: 3 } }, spear_recruit: {} },
    [[0, "siege_engineer"]], [[3, "spear_recruit"], [4, "spear_recruit"]]);
  assert.equal(damage(combat, "splash").length, 0);
});

test("frost delays one next action by half an interval, never stacks and does not reduce ATK", () => {
  const combat = scenario({ frost_wraith: { stats: { speed: 10, range: 3 } }, spear_recruit: {} },
    [[0, "frost_wraith"], [1, "frost_wraith"]], [[0, "spear_recruit"]]);
  assert.equal(triggers(combat, "frost_delay").length, 1);
  assert.equal(triggers(combat, "frost_delay")[0].amount, 10);
  const attacks = combat.events.filter((event) => event.type === "unit_attacked" && event.attackerId === "enemy-0-spear_recruit");
  assert.deepEqual(attacks.slice(0, 3).map((event) => event.time), [30, 50, 70]);
  assert.ok(attacks.every((event) => event.damage === 1));
});

test("frost allows a tied current action and delays the following one", () => {
  const combat = scenario({ frost_wraith: {}, spear_recruit: {} }, [[0, "frost_wraith"]], [[0, "spear_recruit"]]);
  const attacks = combat.events.filter((event) => event.type === "unit_attacked" && event.attackerId === "enemy-0-spear_recruit");
  assert.deepEqual(attacks.slice(0, 3).map((event) => event.time), [20, 50, 70]);
});

test("parried on-hit effects do not apply; frost retries on its first successful hit", () => {
  for (const cardId of ["frost_wraith", "plague_rat"]) {
    const combat = scenario({ [cardId]: { stats: { speed: 10 } }, phantom_duelist: {} },
      [[0, cardId]], [[0, "phantom_duelist"]]);
    const ability = CARD_BY_ID[cardId].abilityId;
    assert.equal(triggers(combat, ability)[0].time, 20);
  }
});

test("parry also prevents the legacy frost attack debuff and armor corrosion", () => {
  const frost = scenario({ frost_acolyte: { stats: { speed: 10 } }, phantom_duelist: {} },
    [[0, "frost_acolyte"]], [[0, "phantom_duelist"]]);
  assert.equal(frost.events.some((event) => event.type === "unit_buffed" && event.source === "frost_hex"), false);
  const acid = scenario({ battle_alchemist: {}, phantom_duelist: {}, thorn_druid: {} },
    [[0, "battle_alchemist"]], [[0, "phantom_duelist"], [3, "thorn_druid"]]);
  const corrosion = damage(acid, "corrosion");
  assert.equal(corrosion[0].time, 40);
});

test("a newly summoned skeleton does not inherit its summoner's poison or delayed action", () => {
  const combat = scenario({ plague_rat: { stats: { speed: 10 } }, frost_wraith: { stats: { speed: 10 } },
    grave_binder: { stats: { hp: 5 } } },
  [[0, "plague_rat"], [1, "frost_wraith"]], [[0, "grave_binder"]]);
  assert.ok(triggers(combat, "poison_bite").length > 0);
  assert.ok(triggers(combat, "frost_delay").length > 0);
  const spawn = combat.events.find((event) => event.type === "unit_spawned");
  assert.ok(spawn);
  assert.equal(spawn.unit.poison, undefined);
  assert.equal(spawn.unit.frostDelayReceived, false);
  const firstAttack = combat.events.find((event) => event.type === "unit_attacked" && event.attackerId === spawn.unit.instanceId);
  assert.equal(firstAttack.time, spawn.time + 1);
});

test("moon priestess heals at most three wounded allies for one each and still attacks", () => {
  const combat = scenario({ moon_priestess: { stats: { range: 3 } }, spear_recruit: {},
    pyromancer: { stats: { speed: 10, range: 3 } } },
  [[0, "spear_recruit"], [1, "spear_recruit"], [3, "spear_recruit"], [4, "moon_priestess"]],
  [[0, "pyromancer"], [1, "pyromancer"]]);
  const heals = combat.events.filter((event) => event.type === "unit_healed" && event.time === 20);
  assert.equal(heals.length, 3);
  assert.ok(heals.every((event) => event.amount === 1 && event.source === "player-4-moon_priestess"));
  assert.equal(new Set(heals.map((event) => event.unitId)).size, 3);
  assert.ok(combat.events.some((event) => event.type === "unit_attacked" && event.attackerId === "player-4-moon_priestess" && event.time === 20));
});

test("moon chorus skips full HP and may heal the priestess herself", () => {
  const combat = scenario({ moon_priestess: {}, spear_recruit: { stats: { speed: 10 } } },
    [[0, "moon_priestess"]], [[0, "spear_recruit"]]);
  const heals = combat.events.filter((event) => event.type === "unit_healed");
  assert.ok(heals.length > 0);
  assert.ok(heals.every((event) => event.unitId === "player-0-moon_priestess" && event.amount === 1));
  const untouched = scenario({ moon_priestess: {}, shieldbearer: {} }, [[0, "moon_priestess"]], [[0, "shieldbearer"]]);
  assert.equal(untouched.events.some((event) => event.type === "unit_healed"), false);
});

test("seer selects highest current attack even behind taunt, not lowest HP", () => {
  const combat = scenario({ star_seer: { stats: { range: 3, speed: 10 } }, shieldbearer: { stats: { attack: 0 } },
    spear_recruit: { stats: { attack: 7, hp: 150 } }, bone_soldier: { stats: { attack: 2, hp: 5 } } },
  [[0, "star_seer"]], [[0, "shieldbearer"], [3, "spear_recruit"], [4, "bone_soldier"]]);
  const attack = combat.events.find((event) => event.type === "unit_attacked");
  assert.equal(attack.targetId, "enemy-3-spear_recruit");
  assert.equal(triggers(combat, "threat_sight")[0].targetId, attack.targetId);
});

test("new abilities remain deterministic, finite, mirror-symmetric and do not mutate board inputs", () => {
  const lineups = [
    [[0, "night_warden"], [1, "phantom_duelist"], [2, "plague_rat"], [3, "star_seer"], [4, "moon_priestess"], [5, "siege_engineer"]],
    [[0, "battle_alchemist"], [1, "frost_wraith"], [2, "plague_rat"], [3, "phantom_duelist"], [4, "moon_priestess"], [5, "siege_engineer"]],
  ];
  for (const lineup of lineups) {
    const slots = board(lineup);
    const before = JSON.stringify(slots);
    const result = resolveCombat(slots, slots, 10);
    assert.deepEqual(result, resolveCombat(slots, slots, 10));
    assert.equal(result.winner, "draw");
    assert.ok(result.actions <= 80);
    assert.equal(JSON.stringify(slots), before);
    result.events.forEach((event, index) => {
      assert.ok(Number.isFinite(event.time));
      assert.ok(index === 0 || event.time >= result.events[index - 1].time);
    });
  }
});
