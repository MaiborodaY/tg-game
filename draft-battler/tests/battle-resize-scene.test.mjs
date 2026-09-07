import assert from "node:assert/strict";
import test from "node:test";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("draft resize redraws the current presentation with new dimensions and unchanged castle HP/backdrop", () => {
  const { scene, draws, castles } = setup();
  scene.showDraft({ playerCastleHp: 7, enemyCastleHp: 13, backdrop: "game" });
  const before = draws.length;
  resize(scene, 320, 568);
  assert.equal(draws.length, before + 1);
  assert.deepEqual(draws.at(-1), { width: 320, height: 568, backdrop: "game" });
  assert.deepEqual(castles.slice(-2), [{ owner: "enemy", hp: 13 }, { owner: "player", hp: 7 }]);
  resize(scene, 430, 932);
  assert.deepEqual(draws.at(-1), { width: 430, height: 932, backdrop: "game" });
  const count = draws.length;
  resize(scene, 430, 932);
  resize(scene, 0, 0);
  assert.equal(draws.length, count, "duplicate and hidden viewport events do not redraw");
});

test("resize never restarts an active or just-finished battle, and the next draft adopts the new size", () => {
  const { scene, draws } = setup();
  scene.command = { type: "battle", timeline: { id: "same-timeline" } };
  scene.activeBattle = { token: 12 };
  const before = draws.length;
  const token = scene.playToken;
  resize(scene, 320, 568);
  assert.equal(draws.length, before);
  assert.equal(scene.playToken, token);
  assert.equal(scene.activeBattle.token, 12);
  scene.activeBattle = undefined;
  resize(scene, 430, 932);
  assert.equal(draws.length, before, "a finished battle must not be replayed");
  scene.showDraft({ playerCastleHp: 6, enemyCastleHp: 13, backdrop: "game" });
  assert.deepEqual(draws.at(-1), { width: 430, height: 932, backdrop: "game" });
});

test("shutdown removes the resize listener and cannot redraw destroyed presentation", () => {
  const { scene, draws, shutdown } = setup();
  assert.equal(scene.scale.listenerCount("resize"), 1);
  shutdown();
  assert.equal(scene.scale.listenerCount("resize"), 0);
  const count = draws.length;
  resize(scene, 320, 568);
  assert.equal(draws.length, count);
});

function setup() {
  const scene = new HeadlessBattleScene();
  const draws = [], castles = [];
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.clearScene = () => {};
  scene.cancelPresentation = () => {};
  scene.wrapSceneInPresentationLayer = () => {};
  scene.setDraftCamera = () => {};
  scene.drawField = () => draws.push({ width: scene.layout.width, height: scene.layout.height, backdrop: scene.command.backdrop });
  scene.createCastle = (castle) => castles.push({ owner: castle.owner, hp: castle.startHp });
  scene.create();
  return { scene, draws, castles, shutdown: () => shutdown() };
}

function resize(scene, width, height) {
  Object.assign(scene.scale, { width, height });
  scene.scale.emit("resize");
}
