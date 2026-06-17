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

  vm.runInNewContext(outputText, { exports: module.exports, module }, { filename });

  return module.exports;
}

const combat = loadCombatModule();

test("bow fighters can attack at range but cannot lunge", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "medium"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
  assert.equal(combat.canUseAction(state, "lunge"), false);
  assert.equal(combat.canUseAction(state, "switchWeapon"), true);
});

test("bow attack resolves damage and uses shot naming in the log", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.damageBonus = 0;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.player.bowShotsRemaining, combat.BOW_SHOTS_PER_BATTLE - 1);
  assert.match(nextState.log[0].text, /Power Shot/);
});

test("bow attacks stop after five shots until the fighter switches to melee", () => {
  let state = combat.freshState();

  state.player.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  for (let shotIndex = 0; shotIndex < combat.BOW_SHOTS_PER_BATTLE; shotIndex += 1) {
    state = combat.resolvePlayerTurn(state, "light", () => 0.99);
    state.activeTurn = "player";
  }

  assert.equal(state.player.bowShotsRemaining, 0);
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "switchWeapon"), true);

  const switched = combat.resolvePlayerTurn(state, "switchWeapon");

  assert.equal(switched.player.weaponClass, "sword");
  assert.equal(switched.activeTurn, "player");
  assert.equal(combat.canUseAction({ ...switched, activeTurn: "player" }, "lunge"), true);
});

test("fighters can switch between main weapon and equipped bow", () => {
  let state = combat.freshState();

  state.player.weaponClass = "axe";
  state.player.mainWeaponClass = "axe";
  state.player.bowWeaponClass = "bow";
  state.player.bowShotsRemaining = 5;
  state.player.bowMaxShots = 5;
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "switchWeapon"), true);

  state = combat.resolvePlayerTurn(state, "switchWeapon");

  assert.equal(state.player.weaponClass, "bow");
  assert.equal(state.activeTurn, "player");
  assert.equal(combat.canUseAction({ ...state, activeTurn: "player" }, "lunge"), false);

  state = combat.resolvePlayerTurn(state, "switchWeapon");

  assert.equal(state.player.weaponClass, "axe");
  assert.equal(state.activeTurn, "player");
  assert.equal(combat.canUseAction({ ...state, activeTurn: "player" }, "lunge"), true);
});

test("enemy weapon switch resolves as a free action before its real turn action", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.weaponClass = "sword";
  state.enemy.mainWeaponClass = "sword";
  state.enemy.bowWeaponClass = "bow";
  state.enemy.bowShotsRemaining = 5;
  state.enemy.bowMaxShots = 5;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolveEnemyTurn(state, () => 0.7);

  assert.equal(nextState.enemy.weaponClass, "bow");
  assert.equal(nextState.activeTurn, "player");
  assert.equal(nextState.player.hp < combat.MAX_HP, true);
  assert.match(nextState.log[1].text, /Draw Bow/);
});

test("fighters cannot switch from main weapon to an empty bow", () => {
  const state = combat.freshState();

  state.player.weaponClass = "sword";
  state.player.mainWeaponClass = "sword";
  state.player.bowWeaponClass = "bow";
  state.player.bowShotsRemaining = 0;
  state.player.bowMaxShots = 5;

  assert.equal(combat.canUseAction(state, "switchWeapon"), false);
});

test("bow fighters are forced to melee in clinch", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.mainWeaponClass = "axe";
  state.player.bowWeaponClass = "bow";
  state.player.bowShotsRemaining = 5;
  state.player.bowMaxShots = 5;
  state.player.damageBonus = 3;
  state.player.weaponDamageBonus = 20;
  state.distance = 0;
  state.enemyPosition = 0;

  assert.equal(combat.canUseAction(state, "switchWeapon"), false);
  assert.equal(combat.canUseAction(state, "light"), false);

  const nextState = combat.resolvePlayerTurn(state, "light", () => 0.99);

  assert.equal(nextState.player.weaponClass, "axe");
  assert.equal(nextState.player.bowShotsRemaining, 5);
  assert.equal(nextState.enemy.hp, combat.MAX_HP - 5);
});

test("moving into clinch holsters active bows", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.mainWeaponClass = "sword";
  state.player.bowWeaponClass = "bow";
  state.player.bowShotsRemaining = 5;
  state.distance = 0.1;
  state.enemyPosition = 0.1;

  const nextState = combat.resolvePlayerTurn(state, "forward");

  assert.equal(nextState.distance, 0);
  assert.equal(nextState.player.weaponClass, "sword");
});

test("bow attacks ignore melee damage bonuses and use only bow weapon damage", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.damageBonus = 50;
  state.player.meleeDamagePercentBonus = 2;
  state.player.weaponDamageBonus = 5;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 9);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - 5);
});

test("enemy bow fighters also use ranged attack rules", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "light", "enemy"), true);
  assert.equal(combat.canUseAction(state, "heavy", "enemy"), true);
  assert.equal(combat.canUseAction(state, "lunge", "enemy"), false);
});

test("shurikens are consumable ranged throws with guaranteed hit", () => {
  const state = combat.freshState();

  state.player.shurikenCount = 2;
  state.player.shurikenDamage = 2;
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "shuriken"), true);
  assert.equal(combat.canUseAction(state, "light"), false);

  const nextState = combat.resolvePlayerTurn(state, "shuriken", () => 0);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 2);
  assert.equal(nextState.player.shurikenCount, 1);
  assert.equal(nextState.lastPlayerBlocked, false);
  assert.match(nextState.log[0].text, /Throw Shuriken/);
});

test("enemy fighters can throw rolled shuriken consumables", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.shurikenCount = 1;
  state.enemy.shurikenDamage = 2;
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "shuriken", "enemy"), true);

  const nextState = combat.resolveEnemyTurn(state, () => 0.9);

  assert.equal(nextState.player.hp, combat.MAX_HP - 2);
  assert.equal(nextState.enemy.shurikenCount, 0);
  assert.equal(nextState.lastEnemyAction, "shuriken");
  assert.equal(nextState.lastEnemyBlocked, false);
  assert.match(nextState.log[0].text, /Throw Shuriken/);
});
