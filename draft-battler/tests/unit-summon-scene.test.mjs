import assert from "node:assert/strict";
import test from "node:test";
import { CARD_DEFINITIONS, createBattleTimeline, getCardStatsForUpgrade, resolveCombat } from "../src/game/index.ts";
import { SYNERGY_RULES } from "../src/game/synergies.ts";
import { BATTLE_UNIT_ART_GROUND_Y } from "../src/unitArtGrounding.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("real Bone Pact attacks before the old entrance ends and can die while its walk timer is active", () => {
  const playerSlots = board(["grave_binder"]);
  const enemySlots = board(["headless_knight", "boar_rider"]);
  const combat = resolveCombat(playerSlots, enemySlots, 1);
  const spawn = combat.events.find((event) => event.type === "unit_spawned" && event.unit.owner === "player");
  assert.ok(spawn);
  const attack = combat.events.find((event) => event.type === "unit_attacked" && event.attackerId === spawn.unit.instanceId);
  const death = combat.events.find((event) => event.type === "unit_died" && event.unitId === spawn.unit.instanceId);
  assert.equal(attack.time, spawn.time + 1);
  assert.ok(Math.abs((death.time - spawn.time) * 60 + 220 - 420) < 1e-8);
  assert.ok((attack.time - spawn.time) * 60 + 490 < 720, "the first attack overlapped the old 720ms entrance");
  const timeline = createBattleTimeline({
    playerSlots, enemySlots, combat,
    playerCastleHpBefore: 20, playerCastleHpAfter: 20 - combat.playerCastleDamage,
    enemyCastleHpBefore: 20, enemyCastleHpAfter: 20 - combat.enemyCastleDamage,
  });
  const summoned = timeline.units.find((unit) => unit.unitId === spawn.unit.instanceId);
  assert.equal(summoned.cardId, "bone_soldier");
  assert.ok(summoned.summonedBy);
});

test("both summon event paths place either facing immediately without body movement or walk callbacks", async () => {
  for (const owner of ["player", "enemy"]) {
    for (const { path, sprite } of ["step", "event"].flatMap((path) => [true, false].map((sprite) => ({ path, sprite })))) {
      const { scene, createView, tweens, walkTimers, callouts } = setupScene();
      const view = createView({ owner, sprite });
      let finishAppearance;
      scene.playSummonAppearance = () => new Promise((resolve) => { finishAppearance = resolve; });
      const event = { type: "unit_spawn", unitId: view.unit.unitId, time: 20 };
      const spawn = path === "step" ? scene.playCombatStepSpawn(event) : scene.playEvent(event, 0, undefined, { focusCamera: false });
      const position = scene.getClashPosition(owner, view.unit.slotIndex);
      assert.equal(view.container.x, position.x);
      assert.equal(view.container.y, position.y);
      assert.equal(view.container.alpha, 1);
      assert.equal(view.container.visible, true);
      assert.equal(walkTimers.length, 0);
      assert.equal(tweens.length, 0);
      assert.equal(callouts.length, 1, "summon callout appears at spawn, not after the effect");
      scene.setUnitPose(view, "attack");
      finishAppearance();
      await spawn;
      assert.equal(view.currentFrame, sprite ? (owner === "player" ? 8 : 3) : undefined, "appearance completion cannot reset the active attack");
      assert.equal(view.container.x, position.x);
      assert.equal(view.container.y, position.y);
    }
  }
});

test("a summoned skeleton can attack and die during its appearance without sliding or reviving", async () => {
  for (const owner of ["player", "enemy"]) {
    const { scene, createView, tweens, strikes, walkTimers } = setupScene();
    const view = createView({ owner });
    const opponent = createView({ unitId: "opponent", owner: owner === "player" ? "enemy" : "player", summoned: false });
    let finishAppearance;
    scene.playSummonAppearance = () => new Promise((resolve) => { finishAppearance = resolve; });
    const spawn = scene.playCombatStepSpawn({ unitId: view.unit.unitId });
    const attack = scene.playUnitAttack(view.unit.unitId, opponent.unit.unitId, false);
    view.container.y += owner === "player" ? -4 : 4;
    const deathPosition = view.container.y;
    const death = scene.playCombatStepDeath({ unitId: view.unit.unitId });
    await flush();
    assert.equal(tweens[0].stopped, true, "only the active lunge is stopped");
    assert.equal(tweens[1].stopped, false, "the death fade continues");
    assert.equal(strikes.length, 1, "its already planned hit remains visible");
    tweens[0].complete();
    tweens[1].complete();
    finishAppearance();
    await Promise.all([spawn, attack, death]);
    assert.equal(view.currentFrame, owner === "player" ? 9 : 4);
    assert.equal(view.container.y, deathPosition);
    assert.equal(view.container.alpha, 0.34);
    assert.equal(walkTimers.length, 0);
    assert.equal(tweens.length, 2, "there is no stale spawn or attack-return tween");
  }
});

test("real createUnit protects summoned atlases and fallbacks while leaving old regular units unchanged", () => {
  const { scene, createView } = setupScene();
  for (const sprite of [true, false]) {
    const summoned = createView({ unitId: `summoned-${sprite}`, sprite });
    assert.ok(summoned.motionState);
    scene.setUnitPose(summoned, "dead");
    assert.equal(summoned.poseState.accept("idle"), false);
    const regular = createView({ unitId: `regular-${sprite}`, summoned: false, sprite });
    assert.equal(regular.motionState, undefined);
    scene.setUnitPose(regular, "dead");
    assert.equal(regular.poseState.accept("idle"), true);
  }
  const redrawn = createView({ cardId: "grave_raider", unitId: "redrawn", summoned: false });
  assert.ok(redrawn.motionState, "the previous grounded-unit protection remains enabled");
});

test("summon ring animates only its ground effect and never resets the unit's next pose", async () => {
  const { scene, createView, tweens, glows, released } = setupScene();
  const view = createView();
  view.presentationScale = 0.8;
  view.container.depth = 300;
  const spawn = scene.playCombatStepSpawn({ unitId: view.unit.unitId });
  assert.equal(tweens.length, 1);
  assert.equal(tweens[0].config.targets, glows[0]);
  assert.notEqual(tweens[0].config.targets, view.container);
  assert.notEqual(tweens[0].config.targets, view.sprite);
  assert.equal(tweens[0].config.duration, 280);
  assert.equal(glows[0].x, view.container.x);
  assert.equal(glows[0].y, view.container.y + BATTLE_UNIT_ART_GROUND_Y * 0.8);
  assert.equal(glows[0].depth, 299);
  scene.setUnitPose(view, "attack");
  tweens[0].complete();
  await spawn;
  assert.equal(view.currentFrame, 8);
  assert.equal(released.length, 1);
});

test("clear and shutdown settle an active summon ring without stale pool writes or unit changes", async () => {
  for (const cleanup of ["clear", "shutdown"]) {
    for (const justCompleted of [false, true]) {
      const { scene, createView, tweens, released, shutdown } = setupScene();
      const view = createView();
      const spawn = scene.playCombatStepSpawn({ unitId: view.unit.unitId });
      scene.setUnitPose(view, "attack");
      const position = { x: view.container.x, y: view.container.y };
      if (justCompleted) tweens[0].complete();
      if (cleanup === "clear") scene.clearScene();
      else shutdown();
      await spawn;
      assert.ok(tweens[0].stopped || justCompleted);
      assert.equal(released.length, 0, `${cleanup}, completed=${justCompleted}`);
      assert.equal(view.container.x, position.x);
      assert.equal(view.container.y, position.y);
      assert.equal(view.container.alpha, 1);
      assert.equal(view.currentFrame, 8);
      assert.equal(view.motionState.isDisposed(), true);
    }
  }
});

test("ordinary non-summon entrance still walks from home and restores idle after arrival", async () => {
  const { scene, createView, tweens, walkTimers, glows } = setupScene();
  const view = createView({ summoned: false });
  const spawn = scene.playCombatStepSpawn({ unitId: view.unit.unitId });
  assert.equal(view.container.y, scene.getHomePosition(view.unit.owner).y);
  assert.equal(view.container.alpha, 0);
  assert.equal(walkTimers.length, 1);
  assert.equal(tweens[0].config.duration, 720);
  tweens[0].complete();
  await spawn;
  assert.equal(view.container.y, scene.getClashPosition(view.unit.owner, view.unit.slotIndex).y);
  assert.equal(view.container.alpha, 1);
  assert.equal(view.currentFrame, 5);
  assert.equal(walkTimers[0].removed, true);
  assert.equal(glows.length, 0);
});

test("ordinary card cadence is slower than a complete attack even with upgrades and fastest synergy", () => {
  const beastSpeedBonus = SYNERGY_RULES.beast.tiers
    .filter((tier) => tier.effect.kind === "stat" && tier.effect.stat === "speed")
    .reduce((sum, tier) => sum + tier.effect.value, 0);
  for (const card of CARD_DEFINITIONS) {
    for (const upgradeLevel of [0, 1]) {
      const stats = getCardStatsForUpgrade(card, upgradeLevel);
      assert.equal(stats.speed, card.stats.speed, `${card.id} upgrade speed`);
      const speed = stats.speed + (card.tags.includes("beast") ? beastSpeedBonus : 0);
      assert.ok(100 / speed * 30 > 245, `${card.id} can overlap its own 245ms attack; revisit pose ownership`);
    }
  }
});

function setupScene() {
  const scene = new HeadlessBattleScene();
  const tweens = [], walkTimers = [], callouts = [], strikes = [], glows = [], released = [];
  scene.add = {
    container: (x, y) => makeObject(x, y), ellipse: () => makeObject(),
    rectangle: () => makeObject(), text: () => makeObject(),
  };
  scene.getHomePosition = (owner) => ({ x: 8, y: owner === "player" ? 500 : 100 });
  scene.getClashPosition = (owner, slotIndex) => ({ x: 60 + slotIndex * 10, y: owner === "player" ? 350 : 250 });
  scene.updateUnitSpatialStyle = () => {};
  scene.updateUnitHp = () => {};
  scene.updateUnitArmor = () => {};
  scene.emitBattleAbilityCallouts = (events) => callouts.push(events);
  scene.drawStrike = (...args) => strikes.push(args);
  scene.acquireGlow = (x, y, width, height) => { const glow = { ...makeObject(x, y), width, height }; glows.push(glow); return glow; };
  scene.releaseGlow = (glow) => released.push(glow);
  scene.time = {
    addEvent(config) { const timer = { config, removed: false, remove() { this.removed = true; } }; walkTimers.push(timer); return timer; },
    removeAllEvents() {},
  };
  scene.tweens = {
    add(config) {
      const tween = { config, stopped: false, stop() { this.stopped = true; }, complete() {
        if (!this.stopped) for (const key of ["x", "y", "alpha", "angle"]) if (key in config) config.targets[key] = config[key];
        config.onComplete?.();
      } };
      tweens.push(tween);
      return tween;
    },
    killAll() { tweens.forEach((tween) => tween.stop()); },
  };
  scene.children = { list: [] };
  scene.applyBattleSpeed = () => {};
  scene.applyCommand = () => {};
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.create();
  return { scene, tweens, walkTimers, callouts, strikes, glows, released, shutdown: () => shutdown(), createView({ cardId = "bone_soldier", owner = "player", unitId = "summon", summoned = true, sprite = true } = {}) {
    scene.createUnitArt = () => ({ objects: [], sprite: sprite ? makeObject() : undefined });
    scene.createUnit({ unitId, cardId, owner, slotIndex: 1, upgradeLevel: 0, startHp: 4, maxHp: 4, summonedBy: summoned ? "binder" : undefined });
    return scene.unitViews.get(unitId);
  } };
}

function makeObject(x = 0, y = 0) {
  return {
    x, y, alpha: 1, visible: true, flipX: false,
    add() { return this; }, setOrigin() { return this; }, setPadding() { return this; }, setStrokeStyle() { return this; },
    setAlpha(alpha) { this.alpha = alpha; return this; }, setVisible(visible) { this.visible = visible; return this; },
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setFrame(frame) { this.frame = frame; return this; }, setDepth(depth) { this.depth = depth; return this; },
  };
}

function board(cards) {
  return Array.from({ length: 6 }, (_, slotIndex) => ({ slotIndex, cardId: cards[slotIndex] ?? null, upgradeLevel: 0 }));
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}
