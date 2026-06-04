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

test("lunge is only available one step outside clinch", () => {
  const state = combat.freshState();

  state.distance = 3;
  assert.equal(combat.canUseAction(state, "lunge"), false);

  state.distance = 2;
  assert.equal(combat.canUseAction(state, "lunge"), false);

  state.distance = 1;
  assert.equal(combat.canUseAction(state, "lunge"), true);

  state.distance = combat.MELEE_RANGE;
  assert.equal(combat.canUseAction(state, "lunge"), false);
});

test("enemy cannot damage the player from far away", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.distance = 3;

  assert.equal(combat.canUseAction(state, "lunge", "enemy"), false);
  assert.equal(combat.canUseAction(state, "light", "enemy"), false);
  assert.equal(combat.canUseAction(state, "heavy", "enemy"), false);

  const nextState = combat.resolveEnemyTurn(state);

  assert.equal(nextState.player.hp, state.player.hp);
  assert.equal(nextState.lastEnemyDamage, 0);
});

test("lunge closes the last gap and hits", () => {
  const state = combat.freshState();

  state.distance = 1;

  const nextState = combat.resolvePlayerTurn(state, "lunge");

  assert.equal(nextState.distance, combat.MELEE_RANGE);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - combat.actions.lunge.damage);
  assert.equal(nextState.lastPlayerDamage, combat.actions.lunge.damage);
});
