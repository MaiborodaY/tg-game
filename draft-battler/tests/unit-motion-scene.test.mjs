import assert from "node:assert/strict";
import test from "node:test";
import { createBattleTimeline, resolveCombat } from "../src/game/index.ts";
import { UnitMotionState } from "../src/rendering/unitMotionState.ts";
import { UnitPoseState } from "../src/rendering/unitPoseState.ts";
import { HeadlessBattleScene as Scene, sceneSource } from "./headless-battle-scene.mjs";

test("both real death paths freeze a melee corpse, preserve its simultaneous strike, and leave its fade running", async () => {
  for (const deathPath of ["step", "event"]) {
    const { scene, view, tweens, strikes } = setupScene();
    const attack = scene.playUnitAttack(view.unit.unitId, "enemy", false);
    view.container.x = 8;
    view.container.y = 75;
    const death = deathPath === "step"
      ? scene.playCombatStepDeath({ type: "unit_die", unitId: view.unit.unitId })
      : scene.playEvent({ type: "unit_die", unitId: view.unit.unitId }, 0);
    await flush();
    assert.equal(tweens[0].stopped, true, deathPath);
    assert.equal(tweens[1].stopped, false, "death fade is not locomotion");
    assert.equal(view.currentFrame, 9);
    assert.equal(strikes.length, 1, "a simultaneous lethal attack must still land");
    assert.equal(tweens.length, 2, "no return tween after death");
    assert.equal(view.container.x, 8);
    assert.equal(view.container.y, 75);
    tweens[0].complete();
    tweens[1].complete();
    await Promise.all([attack, death]);
    assert.equal(view.container.y, 75);
    assert.equal(view.currentFrame, 9);
    assert.equal(view.container.alpha, 0.34);
  }
});

test("death during the return leg stops the corpse at that exact position", async () => {
  const { scene, view, tweens, strikes } = setupScene();
  const attack = scene.playUnitAttack(view.unit.unitId, "enemy", false);
  tweens[0].complete();
  await flush();
  assert.equal(tweens.length, 2);
  view.container.y = 88;
  const death = scene.playCombatStepDeath({ unitId: view.unit.unitId });
  await flush();
  assert.equal(tweens[1].stopped, true);
  tweens[1].complete();
  tweens[2].complete();
  await Promise.all([attack, death]);
  assert.equal(view.container.y, 88);
  assert.equal(strikes.length, 1);
  assert.equal(view.currentFrame, 9);
});

test("movement, both spawn paths, and blocking stop on death without suppressing the fade", async () => {
  for (const action of ["move", "spawn-step", "spawn-event", "block"]) {
    const { scene, view, tweens, walkTimers } = setupScene();
    const task = action === "move" ? scene.moveUnitTo(view, { x: 30, y: 30 }, 520)
      : action === "spawn-step" ? scene.playCombatStepSpawn({ unitId: view.unit.unitId })
        : action === "spawn-event" ? scene.playEvent({ type: "unit_spawn", unitId: view.unit.unitId }, 0, undefined, { focusCamera: false })
          : scene.playUnitBlock(view.unit.unitId, "enemy", false);
    view.container.y = 67;
    const death = scene.playCombatStepDeath({ unitId: view.unit.unitId });
    await flush();
    assert.equal(tweens[0].stopped, true, action);
    assert.equal(tweens[1].stopped, false, action);
    tweens[0].complete();
    tweens[1].complete();
    await Promise.all([task, death]);
    assert.equal(view.container.y, 67, action);
    assert.equal(view.currentFrame, 9, action);
    assert.ok(walkTimers.every((timer) => timer.removed), action);
  }
});

test("skip/replacement cleanup and shutdown settle locomotion and prevent stale effects", async () => {
  for (const cleanup of ["clear", "shutdown"]) {
    const { scene, view, tweens, strikes, shutdown } = setupScene();
    const attack = scene.playUnitAttack(view.unit.unitId, "enemy", false);
    if (cleanup === "clear") scene.clearScene();
    else shutdown();
    await attack;
    assert.equal(view.motionState.isDisposed(), true, cleanup);
    assert.equal(tweens[0].stopped, true, cleanup);
    assert.equal(strikes.length, 0, cleanup);
    assert.equal(tweens.length, 1, cleanup);
    scene.setUnitPose(view, "idle");
    assert.equal(view.currentFrame, 8, "disposed callback cannot change its frame");
  }
});

test("legacy atlas units and static fallbacks retain their prior tween lifecycle", async () => {
  for (const legacyKind of ["atlas", "static"]) {
    const { scene, view, tweens } = setupScene(false);
    if (legacyKind === "static") view.sprite = undefined;
    const attack = scene.playUnitAttack(view.unit.unitId, "enemy", false);
    const death = scene.playCombatStepDeath({ unitId: view.unit.unitId });
    assert.equal(tweens[0].stopped, false);
    tweens[0].complete();
    await flush();
    assert.equal(tweens.length, 3, "legacy return motion is unchanged");
    tweens[1].complete();
    tweens[2].complete();
    await Promise.all([attack, death]);
    assert.equal(view.container.y, 100);
  }
  assert.match(sceneSource, /motionState: protectAnimation \? new UnitMotionState\(\) : undefined/);
});

test("cleanup between death cancellation and its microtask suppresses the stale simultaneous strike", async () => {
  const { scene, view, tweens, strikes } = setupScene();
  const attack = scene.playUnitAttack(view.unit.unitId, "enemy", false);
  const death = scene.playCombatStepDeath({ unitId: view.unit.unitId });
  scene.clearScene();
  await attack;
  assert.equal(strikes.length, 0);
  assert.equal(tweens.length, 2);
  tweens[1].complete();
  await death;
});

test("real grave-raider mirror combat produces the simultaneous lethal step behind the regression", () => {
  const board = () => Array.from({ length: 6 }, (_, slotIndex) => ({ slotIndex, cardId: slotIndex === 0 ? "grave_raider" : null, upgradeLevel: 0 }));
  const playerSlots = board(), enemySlots = board();
  const combat = resolveCombat(playerSlots, enemySlots, 1);
  const timeline = createBattleTimeline({
    playerSlots, enemySlots, combat,
    playerCastleHpBefore: 20, playerCastleHpAfter: 20 - combat.playerCastleDamage,
    enemyCastleHpBefore: 20, enemyCastleHpAfter: 20 - combat.enemyCastleDamage,
  });
  const lethal = timeline.events.find((event) => event.type === "combat_step" && event.events.filter((item) => item.type === "unit_die").length === 2);
  assert.ok(lethal);
  assert.equal(lethal.events.filter((event) => event.type === "unit_attack").length, 2);
});

function setupScene(grounded = true) {
  const scene = new Scene();
  const tweens = [], strikes = [], walkTimers = [];
  scene.tweens = {
    add(config) {
      const tween = {
        config, stopped: false,
        stop() { this.stopped = true; },
        complete() {
          if (!this.stopped) {
            for (const key of ["x", "y", "alpha", "angle"]) if (key in config) config.targets[key] = config[key];
            config.onUpdate?.();
          }
          // A late completion must not resurrect a cancelled motion's continuation.
          config.onComplete();
        },
      };
      tweens.push(tween);
      return tween;
    },
    killAll() { tweens.forEach((tween) => tween.stop()); },
  };
  scene.time = {
    addEvent(config) { const timer = { config, removed: false, remove() { this.removed = true; } }; walkTimers.push(timer); return timer; },
    removeAllEvents() {},
  };
  scene.children = { list: [] };
  scene.updateUnitSpatialStyle = () => {};
  scene.updateUnitHp = () => {};
  scene.updateUnitArmor = () => {};
  scene.emitBattleAbilityCallouts = () => {};
  scene.drawStrike = (...args) => strikes.push(args);
  scene.floatText = () => {};
  scene.flash = async () => {};
  scene.getHomePosition = () => ({ x: 0, y: 100 });
  scene.getClashPosition = () => ({ x: 0, y: 40 });
  scene.applyBattleSpeed = () => {};
  scene.applyCommand = () => {};
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.create();
  const view = {
    unit: { unitId: "player", cardId: "grave_raider", owner: "player", slotIndex: 0 },
    container: {
      x: 0, y: 100, alpha: 1, visible: true,
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setAlpha(alpha) { this.alpha = alpha; return this; },
      setVisible(visible) { this.visible = visible; return this; },
    },
    sprite: { flipX: false, setFrame(frame) { this.frame = frame; } },
    facing: "north", poseState: new UnitPoseState(grounded),
    motionState: grounded ? new UnitMotionState() : undefined,
  };
  scene.unitViews.set("player", view);
  scene.unitViews.set("enemy", { unit: { cardId: "grave_raider", owner: "enemy" }, container: { x: 0, y: 0 } });
  return { scene, view, tweens, strikes, walkTimers, shutdown: () => shutdown() };
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}
