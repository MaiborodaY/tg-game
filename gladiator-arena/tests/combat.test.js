import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadCombatModule() {
  const filename = fileURLToPath(new URL("../src/combat.ts", import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  const module = { exports: {} };

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
    },
    { filename },
  );

  return module.exports;
}

const combat = loadCombatModule();

function setConsistentDistance(state, distance) {
  state.distance = distance;
  state.enemyPosition = combat.START_DISTANCE;
  state.playerPosition = combat.START_DISTANCE - distance;
}

function getPlainPlayerHitResults(state) {
  return JSON.parse(JSON.stringify(state.lastPlayerHitResults.map(({ damage, blocked }) => ({ damage, blocked }))));
}

test("melee attacks only work in clinch", () => {
  const state = combat.freshState();

  state.distance = 0.5;
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "heavy"), false);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
});

test("clinch range bonus starts clinch slightly outside physical contact", () => {
  const state = combat.freshState();

  state.player.clinchRangeBonus = 0.3;
  state.distance = 0.3;

  assert.equal(combat.isFighterInClinchRange(state, "player"), true);
  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
  assert.equal(combat.canUseAction(state, "forward"), false);
  assert.equal(combat.canUseAction(state, "lunge"), false);
  assert.equal(combat.distanceLabel(state.distance, combat.getFighterClinchRange(state.player)), "Clinch");

  state.distance = 0.4;

  assert.equal(combat.isFighterInClinchRange(state, "player"), false);
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "forward"), true);
  assert.equal(combat.canUseAction(state, "lunge"), true);
});

test("clinch attacks scale melee weapon damage by attack tier", () => {
  assert.equal(combat.actions.light.meleeDamageMultiplier, 1);
  assert.equal(combat.actions.medium.meleeDamageMultiplier, 1.5);
  assert.equal(combat.actions.heavy.meleeDamageMultiplier, 2);
  assert.equal(combat.MELEE_ACTION_FLAT_DAMAGE_BONUS.light, 0);
  assert.equal(combat.MELEE_ACTION_FLAT_DAMAGE_BONUS.medium, 1);
  assert.equal(combat.MELEE_ACTION_FLAT_DAMAGE_BONUS.heavy, 2);
  assert.ok(combat.actions.light.cost < combat.actions.medium.cost);
  assert.ok(combat.actions.medium.cost < combat.actions.heavy.cost);
});

test("starter melee attack tiers stay distinct", () => {
  function resolveStarterAttack(actionId) {
    const state = combat.freshState();

    setConsistentDistance(state, combat.MELEE_RANGE);
    state.player.damageBonus = 0;
    state.player.meleeDamagePercentBonus = 0;

    return combat.resolvePlayerTurn(state, actionId, () => 0.99).lastPlayerDamage;
  }

  assert.equal(resolveStarterAttack("light"), 1);
  assert.equal(resolveStarterAttack("medium"), 3);
  assert.equal(resolveStarterAttack("heavy"), 4);
});

test("melee attack damage scales weapon damage by tier and strength with ceiling", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.damageBonus = 4;
  state.player.meleeDamagePercentBonus = 0.25;

  const nextState = combat.resolvePlayerTurn(state, "medium", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 9);
  assert.equal(nextState.lastPlayerDamage, 9);
});

test("attack stamina costs stay tied to action type", () => {
  const fighter = {
    ...combat.freshState().player,
    damageBonus: 50,
  };

  assert.equal(combat.getActionStaminaCost("light", fighter), 2);
  assert.equal(combat.getActionStaminaCost("medium", fighter), 3);
  assert.equal(combat.getActionStaminaCost("heavy", fighter), 5);
  assert.equal(combat.getActionStaminaCost("lunge", fighter), 2);
});

test("attacks define base block chances", () => {
  assert.equal(combat.actions.lunge.blockChance, 0.5);
  assert.equal(combat.actions.light.blockChance, 0.25);
  assert.equal(combat.actions.medium.blockChance, 0.5);
  assert.equal(combat.actions.heavy.blockChance, 0.75);
});

test("swords improve hit chances while axes trade accuracy for strength scaling", () => {
  const swordFighter = {
    ...combat.freshState().player,
    weaponClass: "sword",
  };
  const axeFighter = {
    ...combat.freshState().player,
    weaponClass: "axe",
  };

  assert.equal(combat.getActionBlockChance(combat.actions.light, swordFighter), 0.1);
  assert.equal(combat.getActionBlockChance(combat.actions.medium, swordFighter), 0.3);
  assert.equal(combat.getActionBlockChance(combat.actions.heavy, swordFighter), 0.5);
  assert.equal(combat.getActionBlockChance(combat.actions.light, axeFighter), 0.4);
  assert.equal(combat.getActionBlockChance(combat.actions.medium, axeFighter), 0.65);
  assert.equal(combat.getActionBlockChance(combat.actions.heavy, axeFighter), 0.9);
});

test("axes use heavier weapon damage tiers and double strength melee damage scaling", () => {
  function resolveAxeAttack(actionId) {
    const state = combat.freshState();

    setConsistentDistance(state, combat.MELEE_RANGE);
    state.player.weaponClass = "axe";
    state.player.damageBonus = 4;
    state.player.meleeDamagePercentBonus = 0.25;

    return combat.resolvePlayerTurn(state, actionId, () => 0.99);
  }

  assert.equal(resolveAxeAttack("light").lastPlayerDamage, 9);
  assert.equal(resolveAxeAttack("medium").lastPlayerDamage, 13);
  assert.equal(resolveAxeAttack("heavy").lastPlayerDamage, 20);
});

test("spears extend active melee reach", () => {
  const state = combat.freshState();

  state.player.weaponClass = "spear";
  state.distance = combat.SPEAR_CLINCH_RANGE_BONUS;

  assert.equal(combat.getFighterClinchRange(state.player), combat.SPEAR_CLINCH_RANGE_BONUS);
  assert.equal(combat.isFighterInClinchRange(state, "player"), true);
  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "lunge"), false);
  assert.equal(combat.canUseAction(state, "forward"), false);

  state.player.weaponClass = "bow";

  assert.equal(combat.getFighterClinchRange(state.player), combat.MELEE_RANGE);
});

test("spears improve lunge movement hit chance and damage", () => {
  const spearFighter = {
    ...combat.freshState().player,
    weaponClass: "spear",
  };

  assert.equal(combat.getActionMove("lunge", spearFighter), -(combat.DEFAULT_LUNGE_MOVE_DISTANCE + combat.SPEAR_LUNGE_MOVE_BONUS));
  assert.equal(combat.getActionStaminaCost("lunge", spearFighter), 3);
  assert.equal(combat.getActionBlockChance(combat.actions.lunge, spearFighter), combat.actions.lunge.blockChance - combat.SPEAR_LUNGE_BLOCK_CHANCE_REDUCTION);
  assert.equal(combat.getActionBlockChance(combat.actions.light, spearFighter), combat.actions.light.blockChance);

  const state = combat.freshState();
  state.player.weaponClass = "spear";
  state.player.damageBonus = 3;
  state.player.spearLungeDamagePercentBonus = 0.25;
  setConsistentDistance(state, combat.SPEAR_CLINCH_RANGE_BONUS + combat.DEFAULT_LUNGE_MOVE_DISTANCE + combat.SPEAR_LUNGE_MOVE_BONUS);

  const nextState = combat.resolvePlayerTurn(state, "lunge", () => 0.99);
  const expectedDamage = Math.ceil(
    state.player.damageBonus * combat.SPEAR_LUNGE_DAMAGE_MULTIPLIER * (1 + state.player.spearLungeDamagePercentBonus),
  );

  assert.equal(nextState.distance, combat.SPEAR_CLINCH_RANGE_BONUS);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - expectedDamage);
  assert.equal(nextState.lastPlayerDamage, expectedDamage);
});

test("spear lunge stops at spear contact range instead of pushing into full clinch", () => {
  const state = combat.freshState();

  state.player.weaponClass = "spear";
  state.player.damageBonus = 2;
  setConsistentDistance(state, combat.SPEAR_CLINCH_RANGE_BONUS + 0.1);

  const nextState = combat.resolvePlayerTurn(state, "lunge", () => 0.99);
  const expectedDamage = state.player.damageBonus * combat.SPEAR_LUNGE_DAMAGE_MULTIPLIER;

  assert.equal(nextState.distance, combat.SPEAR_CLINCH_RANGE_BONUS);
  assert.equal(nextState.playerPosition < nextState.enemyPosition, true);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - expectedDamage);
  assert.equal(nextState.lastPlayerDamage, expectedDamage);
});

test("low stamina can be spent down to exhaustion", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.stamina = 1;

  assert.equal(combat.canUseAction(state, "heavy"), true);

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.player.stamina, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.lastPlayerDamage, 4);
});

test("exhausted player can only rest", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.stamina = 0;

  assert.equal(combat.isPlayerExhausted(state), true);
  assert.equal(combat.canUseAction(state, "rest"), true);
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "heavy"), false);
  assert.equal(combat.canUseAction(state, "back"), false);
  assert.equal(combat.canUseAction(state, "switchWeapon"), false);
});

test("scroll cracks one random armor slot without damaging hp", () => {
  const state = combat.freshState();

  state.distance = combat.MAX_DISTANCE;
  state.player.scrollCount = 1;
  state.player.scrollItemId = "scroll_crack_armor_01";
  state.enemy.armor = 13;
  state.enemy.maxArmor = 13;
  state.enemy.armorSlots = [
    { slotKey: "helmet", itemId: "helmet_01", label: "Helmet", armorHp: 5 },
    { slotKey: "breastplate", itemId: "breastplate_01", label: "Breastplate", armorHp: 8 },
  ];
  state.enemy.equipment = {
    helmet: "helmet_01",
    breastplate: "breastplate_01",
  };

  assert.equal(combat.canUseAction(state, "scroll"), true);

  const nextState = combat.resolvePlayerTurn(state, "scroll", () => 0.99);

  assert.equal(nextState.player.scrollCount, 0);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - combat.actions.scroll.cost);
  assert.equal(nextState.enemy.hp, combat.MAX_HP);
  assert.equal(nextState.enemy.armor, 5);
  assert.equal(nextState.enemy.armorSlots[0].armorHp, 5);
  assert.equal(nextState.enemy.armorSlots[1].armorHp, 0);
  assert.equal(nextState.enemy.equipment.helmet, "helmet_01");
  assert.equal(nextState.enemy.equipment.breastplate, null);
  assert.equal(nextState.lastPlayerRemovedArmorSlots.length, 1);
  assert.equal(nextState.lastPlayerRemovedArmorSlots[0].slotKey, "breastplate");
  assert.equal(nextState.lastPlayerRemovedArmorSlots[0].itemId, "breastplate_01");
  assert.equal(nextState.lastPlayerRemovedArmorSlots[0].label, "Breastplate");
  assert.equal(nextState.lastPlayerRemovedArmorSlots[0].armorHp, 8);
  assert.equal(nextState.lastPlayerAction, "scroll");
  assert.equal(nextState.lastPlayerDamage, 8);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 8);
  assert.equal(nextState.activeTurn, "enemy");
  assert.equal(nextState.log[0].text.includes("cracked Grumbus's armor for 8"), true);
});

test("scroll removes both sides of a paired armor item when one side is rolled", () => {
  const state = combat.freshState();

  state.distance = combat.MAX_DISTANCE;
  state.player.scrollCount = 1;
  state.player.scrollItemId = "scroll_crack_armor_01";
  state.enemy.armor = 5;
  state.enemy.maxArmor = 5;
  state.enemy.armorSlots = [{ slotKey: "backBoot", itemId: "back_boot_01", label: "Back Boot", armorHp: 5 }];
  state.enemy.equipment = {
    backBoot: "back_boot_01",
    frontBoot: "front_boot_01",
  };

  const nextState = combat.resolvePlayerTurn(state, "scroll", () => 0);

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.armorSlots[0].armorHp, 0);
  assert.equal(nextState.enemy.equipment.backBoot, null);
  assert.equal(nextState.enemy.equipment.frontBoot, null);
  assert.equal(nextState.lastPlayerRemovedArmorSlots.length, 2);
  assert.equal(nextState.lastPlayerRemovedArmorSlots[0].slotKey, "backBoot");
  assert.equal(nextState.lastPlayerRemovedArmorSlots[1].slotKey, "frontBoot");
  assert.equal(nextState.lastPlayerDamage, 5);
  assert.equal(nextState.enemy.hp, combat.MAX_HP);
});

test("ward scroll arms a one-hit damage absorb", () => {
  const state = combat.freshState();

  state.player.wardScrollCount = 1;
  state.player.wardScrollItemId = "scroll_ward_01";

  assert.equal(combat.canUseAction(state, "ward"), true);

  const nextState = combat.resolvePlayerTurn(state, "ward");

  assert.equal(nextState.player.wardScrollCount, 0);
  assert.equal(nextState.player.wardHits, 1);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - combat.actions.ward.cost);
  assert.equal(nextState.lastPlayerAction, "ward");
  assert.equal(nextState.lastPlayerDamage, 0);
  assert.equal(nextState.activeTurn, "enemy");
  assert.equal(nextState.log[0].text.includes("next hit will be absorbed"), true);

  assert.equal(combat.canUseAction({ ...nextState, activeTurn: "player" }, "ward"), false);
});

test("scroll actions do not spend stamina", () => {
  assert.equal(combat.getActionStaminaCost("scroll"), 0);
  assert.equal(combat.getActionStaminaCost("fireball"), 0);
  assert.equal(combat.getActionStaminaCost("ward"), 0);
  assert.equal(combat.getActionStaminaCost("preciseStrike"), 0);
  assert.equal(combat.getActionStaminaCost("doubleStrike"), 0);
  assert.equal(combat.getActionStaminaCost("poison"), 0);
});

test("precise strike scroll arms a guaranteed next strike without ending the turn", () => {
  const state = combat.freshState();

  state.distance = combat.MELEE_RANGE;
  state.player.preciseStrikeScrollCount = 1;
  state.player.preciseStrikeScrollItemId = "scroll_precise_strike_01";
  state.player.damageBonus = 4;

  assert.equal(combat.canUseAction(state, "preciseStrike"), true);

  const armed = combat.resolvePlayerTurn(state, "preciseStrike", () => 0);

  assert.equal(armed.activeTurn, "player");
  assert.equal(armed.player.preciseStrikeScrollCount, 0);
  assert.equal(armed.player.preciseStrikeHits, 1);
  assert.equal(armed.player.stamina, combat.MAX_STAMINA - combat.actions.preciseStrike.cost);
  assert.equal(armed.lastPlayerAction, "preciseStrike");
  assert.equal(combat.getActionBlockChanceForState(armed, "medium", "player"), 0);

  const hit = combat.resolvePlayerTurn(armed, "medium", () => 0);

  assert.equal(hit.activeTurn, "enemy");
  assert.equal(hit.lastPlayerBlocked, false);
  assert.equal(hit.lastPlayerDamage > 0, true);
  assert.equal(hit.player.preciseStrikeHits, 0);
});

test("double strike scroll repeats the next strike without ending the scroll turn", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.doubleStrikeScrollCount = 1;
  state.player.doubleStrikeScrollItemId = "scroll_double_strike_01";
  state.player.damageBonus = 2;
  state.enemy.hp = combat.MAX_HP;
  state.enemy.armor = 0;

  assert.equal(combat.canUseAction(state, "doubleStrike"), true);

  const armed = combat.resolvePlayerTurn(state, "doubleStrike", () => 0);

  assert.equal(armed.activeTurn, "player");
  assert.equal(armed.player.doubleStrikeScrollCount, 0);
  assert.equal(armed.player.doubleStrikeHits, 1);
  assert.equal(armed.player.stamina, combat.MAX_STAMINA);
  assert.equal(armed.lastPlayerAction, "doubleStrike");

  const hit = combat.resolvePlayerTurn(armed, "medium", () => 0.99);

  assert.equal(hit.activeTurn, "enemy");
  assert.equal(hit.lastPlayerBlocked, false);
  assert.equal(hit.lastPlayerDoubleStrikeRepeat, true);
  assert.equal(hit.lastPlayerDamage, 8);
  assert.deepEqual(getPlainPlayerHitResults(hit), [
    { damage: 4, blocked: false },
    { damage: 4, blocked: false },
  ]);
  assert.equal(hit.enemy.hp, combat.MAX_HP - 8);
  assert.equal(hit.player.doubleStrikeHits, 0);
  assert.equal(hit.player.stamina, combat.MAX_STAMINA - combat.actions.medium.cost);
});

test("double strike keeps separate hit results when one repeat is blocked", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.doubleStrikeHits = 1;
  state.player.damageBonus = 2;
  state.enemy.hp = combat.MAX_HP;
  state.enemy.armor = 0;

  const randomValues = [0, 0.99];
  const hit = combat.resolvePlayerTurn(state, "medium", () => randomValues.shift() ?? 0.99);

  assert.equal(hit.activeTurn, "enemy");
  assert.equal(hit.lastPlayerBlocked, true);
  assert.equal(hit.lastPlayerDoubleStrikeRepeat, true);
  assert.equal(hit.lastPlayerDamage, 4);
  assert.deepEqual(getPlainPlayerHitResults(hit), [
    { damage: 0, blocked: true },
    { damage: 4, blocked: false },
  ]);
  assert.equal(hit.enemy.hp, combat.MAX_HP - 4);
  assert.equal(hit.player.doubleStrikeHits, 0);
});

test("double strike does not repeat when the first strike ends the battle", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.doubleStrikeHits = 1;
  state.player.damageBonus = 2;
  state.enemy.hp = 2;
  state.enemy.armor = 0;

  const hit = combat.resolvePlayerTurn(state, "medium", () => 0.99);

  assert.equal(hit.result, "win");
  assert.equal(hit.lastPlayerDoubleStrikeRepeat, false);
  assert.equal(hit.lastPlayerDamage, 4);
  assert.deepEqual(getPlainPlayerHitResults(hit), [{ damage: 4, blocked: false }]);
  assert.equal(hit.enemy.hp, 0);
  assert.equal(hit.player.doubleStrikeHits, 0);
});

test("poison scroll stacks duration and passes the turn", () => {
  const state = combat.freshState();

  state.player.poisonScrollCount = 1;
  state.player.poisonScrollItemId = "scroll_poison_01";
  state.enemy.poisonTurns = 2;

  assert.equal(combat.canUseAction(state, "poison"), true);

  const poisoned = combat.resolvePlayerTurn(state, "poison", () => 0);

  assert.equal(poisoned.activeTurn, "enemy");
  assert.equal(poisoned.player.poisonScrollCount, 0);
  assert.equal(poisoned.player.stamina, combat.MAX_STAMINA);
  assert.equal(poisoned.enemy.poisonTurns, 4);
  assert.equal(poisoned.enemy.hp, combat.MAX_HP);
  assert.equal(poisoned.lastPlayerAction, "poison");
  assert.equal(poisoned.lastPlayerPoisonDamage, 0);
});

test("poison ticks at enemy turn start and ignores ward armor and block", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.hp = combat.MAX_HP;
  state.enemy.armor = 9;
  state.enemy.maxArmor = 9;
  state.enemy.wardHits = 1;
  state.enemy.poisonTurns = 2;
  state.enemy.stamina = combat.MAX_STAMINA;
  setConsistentDistance(state, 3);

  const ticked = combat.resolveEnemyTurn(state, () => 0);

  assert.equal(ticked.result, "playing");
  assert.equal(ticked.activeTurn, "player");
  assert.equal(ticked.enemy.hp, combat.MAX_HP - combat.POISON_SCROLL_DAMAGE);
  assert.equal(ticked.enemy.armor, 9);
  assert.equal(ticked.enemy.wardHits, 1);
  assert.equal(ticked.enemy.poisonTurns, 1);
  assert.equal(ticked.lastPlayerPoisonDamage, combat.POISON_SCROLL_DAMAGE);
  assert.notEqual(ticked.lastEnemyAction, "rest");
});

test("poison lethal tick wins before the enemy can act", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.hp = combat.POISON_SCROLL_DAMAGE;
  state.enemy.wardHits = 1;
  state.enemy.poisonTurns = 2;
  state.enemy.stamina = combat.MAX_STAMINA;

  const ticked = combat.resolveEnemyTurn(state, () => 0);

  assert.equal(ticked.result, "win");
  assert.equal(ticked.enemy.hp, 0);
  assert.equal(ticked.enemy.wardHits, 1);
  assert.equal(ticked.enemy.poisonTurns, 1);
  assert.equal(ticked.lastPlayerPoisonDamage, combat.POISON_SCROLL_DAMAGE);
  assert.equal(ticked.lastEnemyAction, undefined);
});

test("active ward absorbs exactly one incoming damaging hit", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.enemy.hp = combat.MAX_HP;
  state.enemy.armor = 0;
  state.enemy.wardHits = 1;

  const absorbed = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(absorbed.enemy.hp, combat.MAX_HP);
  assert.equal(absorbed.enemy.wardHits, 0);
  assert.equal(absorbed.lastPlayerDamage, 0);
  assert.equal(absorbed.lastPlayerWardAbsorbed, true);
  assert.equal(absorbed.log[0].text.includes("ward absorbed it"), true);

  const followUp = {
    ...absorbed,
    activeTurn: "player",
  };
  const damaged = combat.resolvePlayerTurn(followUp, "heavy", () => 0.99);

  assert.equal(damaged.enemy.hp, combat.MAX_HP - combat.actions.heavy.damage);
  assert.equal(damaged.enemy.wardHits, 0);
  assert.equal(damaged.lastPlayerDamage, combat.actions.heavy.damage);
  assert.equal(damaged.lastPlayerWardAbsorbed, false);
});

test("fireball scroll deals fixed direct damage and spends one scroll", () => {
  const state = combat.freshState();

  state.player.fireballScrollCount = 1;
  state.player.fireballScrollItemId = "scroll_fireball_01";
  state.player.damageBonus = 99;
  state.player.meleeDamagePercentBonus = 1;
  state.enemy.hp = combat.MAX_HP;
  state.enemy.armor = 20;
  state.enemy.maxArmor = 20;

  assert.equal(combat.canUseAction(state, "fireball"), true);

  const nextState = combat.resolvePlayerTurn(state, "fireball", () => 0);

  assert.equal(nextState.player.fireballScrollCount, 0);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - combat.actions.fireball.cost);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - combat.FIREBALL_SCROLL_DAMAGE);
  assert.equal(nextState.enemy.armor, 20);
  assert.equal(nextState.lastPlayerAction, "fireball");
  assert.equal(nextState.lastPlayerDamage, combat.FIREBALL_SCROLL_DAMAGE);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 0);
  assert.equal(nextState.lastPlayerBlocked, false);
  assert.equal(nextState.activeTurn, "enemy");
  assert.equal(nextState.log[0].text.includes(`hit Grumbus for ${combat.FIREBALL_SCROLL_DAMAGE}`), true);
});

test("active ward absorbs fireball damage", () => {
  const state = combat.freshState();

  state.player.fireballScrollCount = 1;
  state.player.fireballScrollItemId = "scroll_fireball_01";
  state.enemy.hp = combat.MAX_HP;
  state.enemy.wardHits = 1;

  const nextState = combat.resolvePlayerTurn(state, "fireball", () => 0);

  assert.equal(nextState.player.fireballScrollCount, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP);
  assert.equal(nextState.enemy.wardHits, 0);
  assert.equal(nextState.lastPlayerDamage, 0);
  assert.equal(nextState.lastPlayerWardAbsorbed, true);
  assert.equal(nextState.log[0].text.includes("ward absorbed it"), true);
});

test("rest restores stamina and heals one hp without incoming penalty", () => {
  const state = combat.freshState();

  state.player.hp = 6;
  state.player.stamina = 0;

  assert.equal(combat.getActionStaminaRestore("rest", state.player), 5);
  assert.equal(combat.getActionHeal("rest", state.player), 1);

  const nextState = combat.resolvePlayerTurn(state, "rest");

  assert.equal(nextState.player.stamina, 5);
  assert.equal(nextState.player.hp, 7);
  assert.equal(nextState.playerIncomingBonus, 0);
});

test("rest makes the resting fighter easier to hit for the next enemy action", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);

  const rested = combat.resolvePlayerTurn(state, "rest");
  const baseEnemyHeavyBlockChance = combat.getActionBlockChance(combat.actions.heavy, rested.enemy, rested.player);

  assert.equal(rested.playerRestBlockChancePenalty, combat.REST_BLOCK_CHANCE_PENALTY);
  assert.equal(
    combat.getActionBlockChanceForState(rested, "heavy", "enemy"),
    baseEnemyHeavyBlockChance - combat.REST_BLOCK_CHANCE_PENALTY,
  );
  assert.equal(combat.isActionHitChanceRestBoosted(rested, "heavy", "enemy"), true);
  assert.equal(combat.isActionHitChanceRestBoosted(rested, "rest", "enemy"), false);
});

test("rest hit chance penalty is consumed by the next incoming attack", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.stamina = 0;
  setConsistentDistance(state, combat.MELEE_RANGE);

  const rested = combat.resolveEnemyTurn(state, () => 0);
  const nextState = combat.resolvePlayerTurn(rested, "heavy", () => 0.4);

  assert.equal(rested.enemyRestBlockChancePenalty, combat.REST_BLOCK_CHANCE_PENALTY);
  assert.equal(combat.isActionHitChanceRestBoosted(rested, "heavy", "player"), true);
  assert.equal(nextState.lastPlayerBlocked, false);
  assert.equal(nextState.enemyRestBlockChancePenalty, 0);
  assert.equal(combat.isActionHitChanceRestBoosted(nextState, "heavy", "player"), false);
  assert.equal(nextState.lastPlayerDamage > 0, true);
});

test("rest hit chance penalty survives non-turn scroll buffs", () => {
  for (const actionId of ["preciseStrike", "doubleStrike"]) {
    const state = combat.freshState();

    state.activeTurn = "enemy";
    state.enemy.stamina = 0;
    state.player[`${actionId}ScrollCount`] = 1;
    setConsistentDistance(state, combat.MELEE_RANGE);

    const rested = combat.resolveEnemyTurn(state, () => 0);
    const buffed = combat.resolvePlayerTurn(rested, actionId, () => 0);
    const hitRolls = [0.4, 0.99];
    const hit = combat.resolvePlayerTurn(buffed, "medium", () => hitRolls.shift() ?? 0.99);

    assert.equal(rested.enemyRestBlockChancePenalty, combat.REST_BLOCK_CHANCE_PENALTY);
    assert.equal(buffed.activeTurn, "player");
    assert.equal(buffed.enemyRestBlockChancePenalty, combat.REST_BLOCK_CHANCE_PENALTY);
    assert.equal(combat.isActionHitChanceRestBoosted(buffed, "medium", "player"), actionId !== "preciseStrike");
    assert.equal(hit.enemyRestBlockChancePenalty, 0);
    assert.equal(hit.lastPlayerBlocked, false);
  }
});

test("enemy auto rests at zero stamina instead of acting", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.stamina = 0;
  setConsistentDistance(state, combat.MELEE_RANGE);

  const nextState = combat.resolveEnemyTurn(state, () => 0);

  assert.equal(nextState.enemy.stamina, combat.getActionStaminaRestore("rest", state.enemy));
  assert.equal(nextState.player.hp, state.player.hp);
  assert.equal(nextState.lastEnemyDamage, 0);
});

test("enemy does not taunt while in clinch", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  setConsistentDistance(state, combat.MELEE_RANGE);

  const nextState = combat.resolveEnemyTurn(state, () => 0.78);

  assert.notEqual(nextState.lastEnemyAction, "taunt");
  assert.equal(nextState.enemyIncomingBonus, 0);
});

test("rest restore bonuses increase stamina and hp recovery", () => {
  const state = combat.freshState();

  state.player.hp = 6;
  state.player.maxHp = 20;
  state.player.stamina = 0;
  state.player.maxStamina = 20;
  state.player.restHpRestoreBonus = 3;
  state.player.restStaminaRestoreBonus = 4;

  assert.equal(combat.getActionStaminaRestore("rest", state.player), 9);
  assert.equal(combat.getActionHeal("rest", state.player), 4);

  const nextState = combat.resolvePlayerTurn(state, "rest");

  assert.equal(nextState.player.stamina, 9);
  assert.equal(nextState.player.hp, 10);
  assert.equal(nextState.log.some((entry) => entry.text.includes("recovered 4 HP")), true);
});

test("movement actions use default distance steps", () => {
  assert.equal(combat.actions.forward.move, -combat.DEFAULT_FORWARD_MOVE_DISTANCE);
  assert.equal(combat.actions.back.move, combat.DEFAULT_BACK_MOVE_DISTANCE);
  assert.equal(combat.actions.lunge.move, -combat.DEFAULT_LUNGE_MOVE_DISTANCE);
  assert.equal(combat.MOVE_DISTANCE_PER_STAMINA, 0.2);
  assert.equal(combat.getActionStaminaCost("forward"), 1);
  assert.equal(combat.getActionStaminaCost("back"), 1);
  assert.equal(combat.getActionStaminaCost("lunge"), 2);
});

test("fighter movement distance bonus adds to forward back and lunge movement", () => {
  const fighter = {
    ...combat.freshState().player,
    movementDistanceBonus: 0.2,
  };
  const state = combat.freshState();

  assert.equal(combat.getActionMove("forward", fighter), -0.4);
  assert.equal(combat.getActionMove("back", fighter), 0.3);
  assert.equal(combat.getActionMove("lunge", fighter), -0.5);
  assert.equal(combat.getActionStaminaCost("forward", fighter), 2);
  assert.equal(combat.getActionStaminaCost("back", fighter), 2);
  assert.equal(combat.getActionStaminaCost("lunge", fighter), 3);

  setConsistentDistance(state, 3);
  state.player.movementDistanceBonus = 0.2;

  const nextState = combat.resolvePlayerTurn(state, "forward");

  assert.equal(nextState.distance, 2.6);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - 2);
});

test("lunge is available at any open distance", () => {
  const state = combat.freshState();

  state.distance = 3;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = 2;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = 0.5;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "lunge"), false);
});

test("lunge closes half a step and only hits when it reaches clinch", () => {
  const farState = combat.freshState();
  setConsistentDistance(farState, 3);

  const missed = combat.resolvePlayerTurn(farState, "lunge");

  assert.equal(missed.distance, 3 - combat.DEFAULT_LUNGE_MOVE_DISTANCE);
  assert.equal(missed.player.stamina, combat.MAX_STAMINA - combat.getActionStaminaCost("lunge", farState.player));
  assert.equal(missed.enemy.hp, combat.MAX_HP);
  assert.equal(missed.lastPlayerDamage, 0);

  const nearState = combat.freshState();
  setConsistentDistance(nearState, combat.DEFAULT_LUNGE_MOVE_DISTANCE);

  const hit = combat.resolvePlayerTurn(nearState, "lunge", () => 0.99);

  assert.equal(hit.distance, combat.MELEE_RANGE);
  assert.equal(hit.playerPosition, hit.enemyPosition);
  assert.equal(hit.enemy.hp, combat.MAX_HP - combat.actions.lunge.damage);
  assert.equal(hit.lastPlayerDamage, combat.actions.lunge.damage);
});

test("lunge hits when it reaches expanded clinch range", () => {
  const state = combat.freshState();
  state.player.clinchRangeBonus = 0.3;
  setConsistentDistance(state, 0.6);

  const nextState = combat.resolvePlayerTurn(state, "lunge", () => 0.99);

  assert.equal(nextState.distance, 0.3);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - combat.actions.lunge.damage);
  assert.equal(nextState.lastPlayerDamage, combat.actions.lunge.damage);
});

test("lunge cannot move a fighter past the opponent", () => {
  const playerState = combat.freshState();
  setConsistentDistance(playerState, 0.5);

  const afterPlayerLunge = combat.resolvePlayerTurn(playerState, "lunge");

  assert.ok(afterPlayerLunge.playerPosition <= afterPlayerLunge.enemyPosition);

  const enemyState = combat.freshState();
  setConsistentDistance(enemyState, 0.5);
  enemyState.activeTurn = "enemy";

  const afterEnemyLunge = combat.resolveEnemyTurn(enemyState);

  assert.ok(afterEnemyLunge.playerPosition <= afterEnemyLunge.enemyPosition);
});

test("damage depletes armor before health", () => {
  const state = combat.freshState();
  setConsistentDistance(state, combat.MELEE_RANGE);
  state.enemy.armor = 2;
  state.enemy.maxArmor = 2;

  const nextState = combat.resolvePlayerTurn(state, "light", () => 0.99);

  assert.equal(nextState.enemy.armor, 1);
  assert.equal(nextState.enemy.hp, combat.MAX_HP);
  assert.equal(nextState.lastPlayerDamage, combat.actions.light.damage);
  assert.equal(nextState.lastPlayerArmorAbsorbed, combat.actions.light.damage);
  assert.equal(nextState.lastPlayerArmorBroken, false);
});

test("damage records armor break events", () => {
  const state = combat.freshState();
  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.damageBonus = 2;
  state.enemy.armor = 2;
  state.enemy.maxArmor = 2;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.lastPlayerDamage, 6);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 2);
  assert.equal(nextState.lastPlayerArmorBroken, true);
});

test("maces deal bonus damage through armor with hp overflow", () => {
  const state = combat.freshState();
  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.weaponClass = "mace";
  state.player.damageBonus = 4;
  state.enemy.armor = 2;
  state.enemy.maxArmor = 2;

  const nextState = combat.resolvePlayerTurn(state, "light", () => 0.99);

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.lastPlayerDamage, 6);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 2);
  assert.equal(nextState.lastPlayerArmorBroken, true);
});

test("maces do not gain armor damage bonus against unarmored targets", () => {
  const state = combat.freshState();
  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.weaponClass = "mace";
  state.player.damageBonus = 4;

  const nextState = combat.resolvePlayerTurn(state, "light", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.lastPlayerDamage, 4);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 0);
});

test("blocked attacks deal no damage", () => {
  const state = combat.freshState();
  setConsistentDistance(state, combat.MELEE_RANGE);

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0);

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP);
  assert.equal(nextState.lastPlayerDamage, 0);
  assert.equal(nextState.lastPlayerBlocked, true);
});

test("enemy cannot damage the player from far away", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  setConsistentDistance(state, 3);

  assert.equal(combat.canUseAction(state, "lunge", "enemy"), true);
  assert.equal(combat.canUseAction(state, "light", "enemy"), false);
  assert.equal(combat.canUseAction(state, "heavy", "enemy"), false);

  const nextState = combat.resolveEnemyTurn(state);

  assert.equal(nextState.player.hp, state.player.hp);
  assert.equal(nextState.lastEnemyDamage, 0);
});
