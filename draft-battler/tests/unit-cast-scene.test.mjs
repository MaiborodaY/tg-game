import assert from "node:assert/strict";
import test from "node:test";
import { createBattleTimeline, resolveCombat } from "../src/game/index.ts";
import { UnitMotionState } from "../src/rendering/unitMotionState.ts";
import { UnitPoseState } from "../src/rendering/unitPoseState.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("grounded shots keep their windup/recovery timing and emit exactly one strike", async () => {
  const { scene, caster, target, timers, strikes, tweens } = setupScene();
  const cast = scene.playRangedUnitAttack(caster, target, false);
  assert.equal(caster.currentFrame, 8);
  assert.equal(timers[0].duration, 180);
  assert.equal(strikes.length, 0);
  timers[0].fire();
  await flush();
  assert.equal(strikes.length, 1);
  assert.equal(timers[1].duration, 250);
  assert.equal(caster.container.y, 100);
  assert.equal(tweens.length, 0, "authored shot does not jump or move");
  timers[1].fire();
  await cast;
  assert.equal(caster.currentFrame, 5);
});

test("a simultaneous caster death preserves its intended shot but cannot restore idle", async () => {
  const { scene, caster, target, timers, strikes } = setupScene();
  const cast = scene.playRangedUnitAttack(caster, target, false);
  scene.setUnitPose(caster, "dead");
  timers[0].fire();
  await flush();
  assert.equal(strikes.length, 1);
  assert.equal(caster.currentFrame, 9);
  timers[1].fire();
  await cast;
  assert.equal(caster.currentFrame, 9);
});

test("clear and shutdown settle pending cast timers in both phases without stale effects", async () => {
  for (const cleanup of ["clear", "shutdown"]) {
    for (const phase of ["windup", "recovery"]) {
      const { scene, caster, target, timers, strikes, shutdown } = setupScene();
      const cast = scene.playRangedUnitAttack(caster, target, false);
      if (phase === "recovery") { timers[0].fire(); await flush(); }
      const before = strikes.length;
      if (cleanup === "clear") { scene.playToken += 1; scene.clearScene(); }
      else shutdown();
      await cast;
      assert.equal(strikes.length, before, `${cleanup}/${phase}`);
      assert.equal(caster.currentFrame, 8, "cleanup cannot write idle to the old view");
      assert.ok(timers.every((timer) => timer.removed || timer.fired), `${cleanup}/${phase}`);
      assert.equal(scene.activeDelayTimers.size, 0);
    }
  }
});

test("timer completion immediately followed by cleanup cannot leak a shot or recovery timer", async () => {
  const { scene, caster, target, timers, strikes } = setupScene();
  const cast = scene.playRangedUnitAttack(caster, target, false);
  timers[0].fire();
  scene.playToken += 1;
  scene.clearScene();
  await cast;
  assert.equal(strikes.length, 0);
  assert.equal(timers.length, 1);
});

test("pure healing uses the authored cast on both event paths without an offensive slash", async () => {
  for (const path of ["step", "event"]) {
    const { scene, caster, target, timers, strikes, hpWrites } = setupScene("crypt_keeper");
    const event = { type: "unit_heal", unitId: target.unit.unitId, sourceUnitId: caster.unit.unitId, amount: 2, remainingHp: 7, time: 20 };
    const cast = path === "step" ? scene.playCombatStepHealCast(event) : scene.playEvent(event, 0, undefined, { focusCamera: false });
    assert.equal(caster.currentFrame, 8);
    timers[0].fire();
    await flush();
    assert.equal(strikes.length, 0, path);
    timers[1].fire();
    await cast;
    assert.equal(caster.currentFrame, 5);
    if (path === "event") assert.equal(hpWrites.at(-1).hp, 7);
  }
});

test("legacy atlas and static healing keep their existing movement timing without an attack slash", async () => {
  for (const presentation of ["atlas", "static"]) {
    const { scene, caster, target, tweens, strikes } = setupScene("field_cleric", false);
    if (presentation === "static") caster.sprite = undefined;
    const cast = scene.playRangedUnitAttack(caster, target, false, "heal");
    const durations = presentation === "atlas" ? [180, 140, 110] : [180, 180];
    for (let index = 0; index < durations.length; index += 1) {
      assert.equal(tweens[index].config.duration, durations[index]);
      tweens[index].complete();
      await flush();
    }
    await cast;
    assert.equal(strikes.length, 0, presentation);
  }
});

test("a cancelled legacy heal event cannot write old HP or flash a new scene", async () => {
  const { scene, caster, target, hpWrites, flashes } = setupScene("field_cleric", false);
  let finishCast;
  scene.playRangedUnitAttack = () => new Promise((resolve) => { finishCast = resolve; });
  const task = scene.playEvent({ type: "unit_heal", unitId: target.unit.unitId, sourceUnitId: caster.unit.unitId, amount: 2, remainingHp: 7 }, 0, undefined, { focusCamera: false });
  scene.playToken += 1;
  scene.clearScene();
  finishCast();
  await task;
  assert.equal(hpWrites.length, 0);
  assert.equal(flashes.length, 0);
});

test("Moon Priestess heals three real targets without three extra cast poses or missing target feedback", async () => {
  const playerSlots = board(["iron_guard", "spear_recruit", "bone_soldier", null, "moon_priestess"]);
  const enemySlots = board(["wolfhound", "wolfhound", "wolfhound"]);
  const combat = resolveCombat(playerSlots, enemySlots, 1);
  const timeline = createBattleTimeline({
    playerSlots, enemySlots, combat,
    playerCastleHpBefore: 20, playerCastleHpAfter: 20 - combat.playerCastleDamage,
    enemyCastleHpBefore: 20, enemyCastleHpAfter: 20 - combat.enemyCastleDamage,
  });
  const step = timeline.events.find((event) => event.type === "combat_step" && event.time === 20);
  const heals = step.events.filter((event) => event.type === "unit_heal" && event.sourceUnitId === "player-4-moon_priestess");
  assert.equal(heals.length, 3);
  const { scene, flashes, hpWrites } = setupScene("moon_priestess");
  scene.unitViews.clear();
  timeline.units.forEach((unit) => scene.unitViews.set(unit.unitId, makeView(unit.cardId, unit.unitId, unit.owner)));
  scene.delayRaw = async () => {};
  const casts = [];
  scene.playUnitAttack = async (unitId) => { casts.push(unitId); };
  scene.playRangedUnitAttack = async (view) => { casts.push(view.unit.unitId); };
  await scene.playCombatStep(step.events, step.time, 0);
  assert.equal(casts.filter((id) => id === "player-4-moon_priestess").length, 1, "only its existing offensive cast controls the pose");
  const healedTargets = new Set(heals.map((event) => event.unitId));
  const feedbackTargets = new Set(flashes.filter((item) => item.color === 0x79c77a).map((item) => item.container.unitId));
  assert.deepEqual(feedbackTargets, healedTargets);
  assert.ok(heals.every((event) => hpWrites.some((write) => write.unitId === event.unitId && write.hp === event.remainingHp)));
});

test("healing feedback is deduplicated by recipient and shown only for positive heals", async () => {
  const { scene, caster, target, flashes } = setupScene("crypt_keeper");
  scene.delayRaw = async () => {};
  const event = { type: "unit_heal", unitId: target.unit.unitId, sourceUnitId: caster.unit.unitId, amount: 2, remainingHp: 7 };
  await scene.playCombatStepResults([event, { ...event, remainingHp: 9 }], 20, 0);
  assert.equal(flashes.filter((item) => item.color === 0x79c77a).length, 1);
  flashes.length = 0;
  await scene.playCombatStepResults([{ ...event, amount: 0 }], 20, 0);
  assert.equal(flashes.length, 0);
  caster.unit.cardId = "field_cleric";
  await scene.playCombatStepResults([event], 20, 0);
  assert.equal(flashes.length, 1, "the older cleric also receives a clear healing cue");
});

test("a completed healing glow cannot return a destroyed object to the next scene's pool", async () => {
  for (const cleanup of ["none", "clear", "shutdown"]) {
    const { scene, target, tweens, shutdown } = setupScene();
    const glow = { setDepth() { return this; } };
    const released = [];
    scene.acquireGlow = () => glow;
    scene.releaseGlow = (item) => released.push(item);
    const flash = HeadlessBattleScene.prototype.flash.call(scene, target.container, 0x79c77a, 140);
    assert.equal(tweens[0].config.duration, 280);
    tweens[0].complete();
    if (cleanup === "clear") scene.clearScene();
    if (cleanup === "shutdown") shutdown();
    await flash;
    assert.equal(released.length, cleanup === "none" ? 1 : 0, cleanup);
  }
});

function setupScene(cardId = "city_crossbowman", grounded = true) {
  const scene = new HeadlessBattleScene();
  const timers = [], strikes = [], tweens = [], hpWrites = [], flashes = [];
  scene.time = {
    delayedCall(duration, callback) {
      const timer = { duration, removed: false, fired: false, remove() { this.removed = true; }, fire() { if (!this.removed && !this.fired) { this.fired = true; callback(); } } };
      timers.push(timer);
      return timer;
    },
    removeAllEvents() { timers.forEach((timer) => timer.remove()); },
  };
  scene.tweens = {
    add(config) { const tween = { config, stop() {}, complete() { config.onComplete?.(); } }; tweens.push(tween); return tween; },
    killAll() {},
  };
  scene.children = { list: [] };
  scene.updateUnitSpatialStyle = () => {};
  scene.updateUnitHp = (view, hp) => hpWrites.push({ unitId: view.unit.unitId, hp });
  scene.updateUnitArmor = () => {};
  scene.emitBattleAbilityCallouts = () => {};
  scene.drawStrike = (...args) => strikes.push(args);
  scene.floatText = () => {};
  scene.flash = async (container, color) => { flashes.push({ container, color }); };
  scene.applyBattleSpeed = () => {};
  scene.applyCommand = () => {};
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.create();
  const caster = makeView(cardId, "caster", "player", grounded);
  const target = makeView("grave_raider", "target", "enemy");
  scene.unitViews.set("caster", caster);
  scene.unitViews.set("target", target);
  return { scene, caster, target, timers, strikes, tweens, hpWrites, flashes, shutdown: () => shutdown() };
}

function makeView(cardId, unitId, owner, grounded = true) {
  return {
    unit: { cardId, unitId, owner, slotIndex: 0 },
    container: { unitId, x: 0, y: owner === "player" ? 100 : 0, visible: true },
    sprite: { flipX: false, y: -16, setFrame(frame) { this.frame = frame; } },
    facing: owner === "player" ? "north" : "south", poseState: new UnitPoseState(grounded),
    motionState: grounded ? new UnitMotionState() : undefined,
  };
}

function board(cards) {
  return Array.from({ length: 6 }, (_, slotIndex) => ({ slotIndex, cardId: cards[slotIndex] ?? null, upgradeLevel: 0 }));
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}
