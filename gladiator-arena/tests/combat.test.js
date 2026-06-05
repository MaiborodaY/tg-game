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

test("melee attacks only work in clinch", () => {
  const state = combat.freshState();

  state.distance = 1;
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "heavy"), false);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
});

test("lunge is available at any open distance", () => {
  const state = combat.freshState();

  state.distance = 3;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = 2;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = 1;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "lunge"), false);
});

test("lunge closes one step and only hits when it reaches clinch", () => {
  const farState = combat.freshState();
  farState.distance = 3;

  const missed = combat.resolvePlayerTurn(farState, "lunge");

  assert.equal(missed.distance, 2);
  assert.equal(missed.enemy.hp, combat.MAX_HP);
  assert.equal(missed.lastPlayerDamage, 0);

  const nearState = combat.freshState();
  nearState.distance = 1;

  const hit = combat.resolvePlayerTurn(nearState, "lunge");

  assert.equal(hit.distance, combat.MELEE_RANGE);
  assert.equal(hit.enemy.hp, combat.MAX_HP - combat.actions.lunge.damage);
  assert.equal(hit.lastPlayerDamage, combat.actions.lunge.damage);
});

test("enemy cannot damage the player from far away", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.distance = 3;

  assert.equal(combat.canUseAction(state, "lunge", "enemy"), true);
  assert.equal(combat.canUseAction(state, "light", "enemy"), false);
  assert.equal(combat.canUseAction(state, "heavy", "enemy"), false);

  const nextState = combat.resolveEnemyTurn(state);

  assert.equal(nextState.player.hp, state.player.hp);
  assert.equal(nextState.lastEnemyDamage, 0);
});

