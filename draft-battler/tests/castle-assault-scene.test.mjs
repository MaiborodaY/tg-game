import assert from "node:assert/strict";
import test from "node:test";
import { createFieldLayout } from "../src/fieldLayout.ts";
import { getUnitPresentationScale } from "../src/rendering/battlePresentationLayout.ts";
import { BattlePlaybackCompletion } from "../src/rendering/battlePlayback.ts";
import { UnitMotionState } from "../src/rendering/unitMotionState.ts";
import { UnitPoseState } from "../src/rendering/unitPoseState.ts";
import { BATTLE_UNIT_ART_GROUND_Y } from "../src/unitArtGrounding.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("natural castle assault emits each hit once and completes the battle exactly once", async () => {
  const fixture = setupScene();
  const { scene, activeBattle, event, calls } = fixture;
  const assault = scene.playCastleAssault(event, 0, activeBattle);
  await drain(fixture);
  await assault;
  assert.deepEqual(calls, ["hp:enemy:19", "hp:enemy:18"]);
  for (const view of scene.unitViews.values()) {
    assert.equal(view.hp, view.unit.finalHp);
    assert.equal(view.container.visible, view.unit.finalHp > 0);
  }
  const finish = scene.playEvent({ type: "battle_finished", time: 1 }, 0, activeBattle);
  await drain(fixture);
  await finish;
  assert.deepEqual(calls, ["hp:enemy:19", "hp:enemy:18", "finished"]);
  assert.equal(scene.skipBattle(), false);
  assert.equal(activeBattle.completion.finish(), false);
});

test("skip during approach, delayed hit, return, or sacrifice preserves the final scene and settles playback", async () => {
  for (const legacy of [false, true]) {
    for (const phase of ["approach", "delayed-hit", "return", "fade"]) {
      const fixture = setupScene({ legacy });
      const { scene, activeBattle, event, calls, tasks, staleWrites } = fixture;
      const assault = scene.playCastleAssault(event, 0, activeBattle);
      await advanceToPhase(fixture, phase);
      const previousCallCount = calls.length;
      assert.equal(scene.skipBattle(), true, `${phase}, legacy=${legacy}`);
      assert.deepEqual(calls.slice(previousCallCount), ["hp:player:20", "hp:enemy:18", "finished"]);
      assert.equal(scene.skipBattle(), false);
      await assault;
      // Even a callback already queued by the old renderer must not alter the final board.
      tasks.forEach((task) => task.finish(true));
      await flush();
      assert.equal(calls.length, previousCallCount + 3);
      assert.equal(calls.filter((call) => call === "finished").length, 1);
      assert.equal(fixture.castleHp.get("player"), 20);
      assert.equal(fixture.castleHp.get("enemy"), 18);
      assert.ok([...scene.unitViews.values()].every((view) => view.hp === view.unit.finalHp && view.container.visible === (view.unit.finalHp > 0)));
      assert.equal(scene.unitViews.get("healer").hp, 7, "the surviving healer is not sacrificed or hidden");
      assert.deepEqual(staleWrites, [], `${phase}, legacy=${legacy}`);
      assert.ok(tasks.every((task) => task.completed || task.stopped || task.removed));
      await scene.playEvent({ type: "battle_finished", time: 1 }, 0, activeBattle);
      assert.equal(calls.filter((call) => call === "finished").length, 1);
    }
  }
});

test("replacing the scene during a delayed castle hit cannot write old HP or animate destroyed units", async () => {
  const fixture = setupScene({ legacy: true });
  const { scene, activeBattle, event, calls, tasks, staleWrites } = fixture;
  const assault = scene.playCastleAssault(event, 0, activeBattle);
  await advanceToPhase(fixture, "delayed-hit");
  scene.cancelActiveBattle();
  scene.playToken += 1;
  scene.clearScene();
  await assault;
  tasks.forEach((task) => task.finish(true));
  await flush();
  assert.deepEqual(calls, []);
  assert.deepEqual(staleWrites, []);
  assert.equal(scene.unitViews.size, 0);
});

test("an HP callback that synchronously skips the assault cannot schedule a return or finish twice", async () => {
  const fixture = setupScene({ legacy: true });
  const { scene, activeBattle, event, calls, staleWrites } = fixture;
  activeBattle.completion = new BattlePlaybackCompletion({
    onCastleHpChanged(owner, hp) {
      calls.push(`hp:${owner}:${hp}`);
      if (owner === "enemy" && hp === 19) assert.equal(scene.skipBattle(), true);
    },
    onFinished: () => calls.push("finished"),
  });
  const assault = scene.playCastleAssault(event, 0, activeBattle);
  await drain(fixture);
  await assault;
  assert.deepEqual(calls, ["hp:enemy:19", "hp:player:20", "hp:enemy:18", "finished"]);
  assert.deepEqual(staleWrites, []);
  assert.equal(scene.skipBattle(), false);
});

test("sacrifice shrinks relative to the current projected size at either castle", async () => {
  for (const size of [[320, 568], [390, 720], [390, 844], [768, 1024]]) {
    const layout = createFieldLayout(...size);
    for (const targetOwner of ["enemy", "player"]) {
      for (const row of [0, 1]) {
        const fixture = setupScene({ size });
        const view = fixture.scene.unitViews.values().next().value;
        const y = layout.castleApproachY[targetOwner] + row * (targetOwner === "enemy" ? 22 : -22);
        const projected = getUnitPresentationScale(layout, y, "battle");
        view.container.setPosition(100, y).setScale(projected);
        view.presentationScale = projected;
        const sacrifice = fixture.scene.playUnitSacrifice(view, 110);
        const tween = fixture.tasks.at(-1);
        const endX = tween.config.scaleX ?? tween.config.scale;
        const endY = tween.config.scaleY ?? tween.config.scale;
        assert.ok(Math.abs(endX - projected * 0.76) < 1e-9, `${size}/${targetOwner}/${row}: horizontal scale`);
        assert.ok(Math.abs(endY - projected * 0.76) < 1e-9, `${size}/${targetOwner}/${row}: vertical scale`);
        assert.ok(endX < projected && endY < projected, "a distant corpse must not grow while fading");
        assert.ok(Math.abs(tween.config.y + BATTLE_UNIT_ART_GROUND_Y * endY - (y + BATTLE_UNIT_ART_GROUND_Y * projected)) < 1e-9, "the feet stay at the same projected ground contact while shrinking");
        tween.finish();
        await sacrifice;
        assert.equal(view.container.visible, false);
      }
    }
  }
});

function setupScene({ legacy = false, size = [390, 720] } = {}) {
  const scene = new HeadlessBattleScene();
  const tasks = [], calls = [], staleWrites = [], castleHp = new Map();
  scene.command = { type: "battle" };
  scene.scale = { width: size[0], height: size[1] };
  scene.layout = createFieldLayout(...size);
  scene.children = { list: [] };
  scene.tweens = {
    add(config) {
      const task = { kind: "tween", config, completed: false, stopped: false,
        stop() { this.stopped = true; },
        finish(force = false) {
          if (this.completed && !force) return;
          if (!this.stopped && !this.completed) {
            for (const key of ["x", "y", "alpha", "angle", "scaleX", "scaleY"]) if (key in config) config.targets[key] = config[key];
            if ("scale" in config) { config.targets.scaleX = config.scale; config.targets.scaleY = config.scale; }
            config.onUpdate?.();
          }
          if (!this.stopped || force) { this.completed = true; config.onComplete?.(); }
        },
      };
      tasks.push(task);
      return task;
    },
    killAll() { tasks.filter((task) => task.kind === "tween").forEach((task) => task.stop()); },
  };
  scene.time = {
    now: 0,
    addEvent() { return { remove() {} }; },
    delayedCall(duration, callback) {
      const task = { kind: "timer", duration, completed: false, removed: false,
        remove() { this.removed = true; },
        finish(force = false) { if (!this.completed && (!this.removed || force)) { this.completed = true; callback(); } },
      };
      tasks.push(task);
      return task;
    },
    removeAllEvents() { tasks.filter((task) => task.kind === "timer").forEach((task) => task.remove()); },
  };
  scene.applyBattleSpeed = () => {};
  scene.applyCommand = () => {};
  scene.events = { once() {} };
  scene.create();
  scene.focusCameraForCastleApproach = () => {};
  scene.focusCameraOnPoint = () => {};
  scene.setPresentationCamera = () => {};
  scene.wrapSceneInPresentationLayer = () => {};
  scene.drawField = () => {};
  scene.flash = async () => {};
  scene.floatText = () => {};
  scene.updateUnitHp = (view, hp) => { if (view.container.destroyed) staleWrites.push("hp"); view.hp = hp; };
  scene.updateUnitArmor = (view) => { if (view.container.destroyed) staleWrites.push("armor"); };
  scene.updateCastleHp = (owner, hp) => castleHp.set(owner, hp);
  scene.createCastle = (castle) => {
    const container = makeContainer(180, castle.owner === "enemy" ? 60 : 650, staleWrites);
    scene.children.list.push(container);
    scene.castleViews.set(castle.owner, { castle, container });
    castleHp.set(castle.owner, castle.startHp);
  };
  scene.createUnit = (unit) => {
    const container = makeContainer(120 + unit.slotIndex * 70, 380, staleWrites);
    scene.children.list.push(container);
    const view = { unit, container, hp: unit.startHp, sprite: { flipX: false, setFrame() {} },
      facing: unit.owner === "player" ? "north" : "south", poseState: new UnitPoseState(!legacy),
      motionState: legacy ? undefined : new UnitMotionState(),
    };
    scene.unitViews.set(unit.unitId, view);
    scene.updateUnitSpatialStyle(view, true);
  };
  const timeline = {
    winner: "player", events: [],
    castles: [
      { owner: "enemy", maxHp: 20, startHp: 20, finalHp: 18 },
      { owner: "player", maxHp: 20, startHp: 20, finalHp: 20 },
    ],
    units: [...[0, 1].map((slotIndex) => ({ unitId: `player-${slotIndex}`, owner: "player", slotIndex,
      cardId: legacy ? "spear_recruit" : "grave_raider", name: "fighter", upgradeLevel: 0,
      attack: 3, maxHp: 10, startHp: 10, finalHp: 0, defeated: true,
    })), { unitId: "healer", owner: "player", slotIndex: 4, cardId: "crypt_keeper", name: "healer", upgradeLevel: 0,
      attack: 2, maxHp: 10, startHp: 7, finalHp: 7, defeated: false,
    }],
  };
  timeline.castles.forEach((castle) => scene.createCastle(castle));
  timeline.units.forEach((unit) => scene.createUnit(unit));
  const completion = new BattlePlaybackCompletion({
    onCastleHpChanged: (owner, hp) => calls.push(`hp:${owner}:${hp}`), onFinished: () => calls.push("finished"),
  });
  const activeBattle = { token: 0, timeline, completion };
  scene.activeBattle = activeBattle;
  const event = { type: "castle_assault", time: 1, owner: "enemy", attackerIds: ["player-0", "player-1"], damage: 2, remainingHp: 18 };
  return { scene, tasks, calls, staleWrites, castleHp, activeBattle, event };
}

function makeContainer(x, y, staleWrites) {
  const container = { x, y, alpha: 1, visible: true, scaleX: 1, scaleY: 1, depth: 0, destroyed: false };
  const write = (name, mutation) => (...args) => {
    if (container.destroyed) staleWrites.push(name);
    mutation(...args);
    return container;
  };
  container.setPosition = write("position", (nextX, nextY) => { container.x = nextX; container.y = nextY; });
  container.setScale = write("scale", (scale) => { container.scaleX = scale; container.scaleY = scale; });
  container.setDepth = write("depth", (depth) => { container.depth = depth; });
  container.setAlpha = write("alpha", (alpha) => { container.alpha = alpha; });
  container.setAngle = write("angle", (angle) => { container.angle = angle; });
  container.setVisible = write("visible", (visible) => { container.visible = visible; });
  container.destroy = () => { container.destroyed = true; };
  return container;
}

async function advanceToPhase(fixture, phase) {
  await flush();
  if (phase === "approach") return;
  fixture.tasks.filter((task) => task.kind === "tween" && task.config.duration === 600).forEach((task) => task.finish());
  await flush();
  if (phase === "delayed-hit") return;
  fixture.tasks.find((task) => task.kind === "timer" && !task.completed).finish();
  await flush();
  fixture.tasks.find((task) => task.kind === "tween" && !task.completed && task.config.duration === 140).finish();
  await flush();
  if (phase === "return") return;
  await drain(fixture, () => fixture.tasks.some((task) => task.kind === "tween" && !task.completed && task.config.alpha === 0));
}

async function drain(fixture, until = () => false) {
  for (let index = 0; index < 100; index += 1) {
    await flush();
    if (until()) return;
    const task = fixture.tasks.find((item) => !item.completed && !item.stopped && !item.removed);
    if (!task) return;
    task.finish();
  }
  assert.fail("scene tasks did not drain");
}

async function flush() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}
