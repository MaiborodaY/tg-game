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


test("clinch attacks have weak medium and strong damage tiers", () => {
  assert.equal(combat.actions.light.damage, 3);
  assert.equal(combat.actions.medium.damage, 5);
  assert.equal(combat.actions.heavy.damage, 7);
  assert.ok(combat.actions.light.cost < combat.actions.medium.cost);
  assert.ok(combat.actions.medium.cost < combat.actions.heavy.cost);
});
test("movement actions use half-distance steps", () => {
  assert.equal(combat.actions.forward.move, -0.5);
  assert.equal(combat.actions.back.move, 0.5);
  assert.equal(combat.actions.lunge.move, -0.5);
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

  assert.equal(missed.distance, 2.5);
  assert.equal(missed.enemy.hp, combat.MAX_HP);
  assert.equal(missed.lastPlayerDamage, 0);

  const nearState = combat.freshState();
  setConsistentDistance(nearState, 0.5);

  const hit = combat.resolvePlayerTurn(nearState, "lunge");

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

  const nextState = combat.resolvePlayerTurn(state, "light");

  assert.equal(nextState.enemy.armor, 0);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 1);
  assert.equal(nextState.lastPlayerDamage, combat.actions.light.damage);
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
