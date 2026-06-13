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

test("melee attacks only work in clinch", () => {
  const state = combat.freshState();

  state.distance = 0.5;
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "heavy"), false);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
});

test("attack reach bonus lets melee attacks start slightly outside clinch", () => {
  const state = combat.freshState();

  state.player.attackReachBonus = 0.3;
  state.distance = 0.3;

  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);

  state.distance = 0.4;

  assert.equal(combat.canUseAction(state, "light"), false);
});

test("clinch attacks have weak medium and strong damage tiers", () => {
  assert.equal(combat.actions.light.damage, 1);
  assert.equal(combat.actions.medium.damage, 2);
  assert.equal(combat.actions.heavy.damage, 4);
  assert.ok(combat.actions.light.cost < combat.actions.medium.cost);
  assert.ok(combat.actions.medium.cost < combat.actions.heavy.cost);
});

test("attacks define base block chances", () => {
  assert.equal(combat.actions.lunge.blockChance, 0.5);
  assert.equal(combat.actions.light.blockChance, 0.25);
  assert.equal(combat.actions.medium.blockChance, 0.5);
  assert.equal(combat.actions.heavy.blockChance, 0.75);
});

test("stamina does not block attacks", () => {
  const state = combat.freshState();

  setConsistentDistance(state, combat.MELEE_RANGE);
  state.player.stamina = 1;

  assert.equal(combat.canUseAction(state, "heavy"), true);

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.player.stamina, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - combat.actions.heavy.damage);
  assert.equal(nextState.lastPlayerDamage, combat.actions.heavy.damage);
});

test("rest restores stamina and heals one hp without incoming penalty", () => {
  const state = combat.freshState();

  state.player.hp = 6;
  state.player.stamina = 0;

  const nextState = combat.resolvePlayerTurn(state, "rest");

  assert.equal(nextState.player.stamina, 5);
  assert.equal(nextState.player.hp, 7);
  assert.equal(nextState.playerIncomingBonus, 0);
});

test("movement actions use default distance steps", () => {
  assert.equal(combat.actions.forward.move, -combat.DEFAULT_FORWARD_MOVE_DISTANCE);
  assert.equal(combat.actions.back.move, combat.DEFAULT_BACK_MOVE_DISTANCE);
  assert.equal(combat.actions.lunge.move, -combat.DEFAULT_LUNGE_MOVE_DISTANCE);
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

  setConsistentDistance(state, 3);
  state.player.movementDistanceBonus = 0.2;

  const nextState = combat.resolvePlayerTurn(state, "forward");

  assert.equal(nextState.distance, 2.6);
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
  state.enemy.armor = 2;
  state.enemy.maxArmor = 2;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 2);
  assert.equal(nextState.lastPlayerDamage, combat.actions.heavy.damage);
  assert.equal(nextState.lastPlayerArmorAbsorbed, 2);
  assert.equal(nextState.lastPlayerArmorBroken, true);
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
