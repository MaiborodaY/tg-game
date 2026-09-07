import assert from "node:assert/strict";
import test from "node:test";
import { createFieldLayout, DRAFT_CAMERA_ZOOM } from "../src/fieldLayout.ts";
import { BATTLE_CAMERA_ZOOM } from "../src/rendering/battlePresentationLayout.ts";
import { getBackdropCoverSize } from "../src/rendering/backdropLayout.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("real backdrop creation pins both menu and match art to the viewport", () => {
  for (const [command, expectedTexture] of [
    [{ type: "draft", backdrop: "menu" }, "environment:battlefield:common-forest:base"],
    [{ type: "draft", backdrop: "game" }, "environment:battlefield:common-forest:diorama"],
    [{ type: "battle" }, "environment:battlefield:common-forest:diorama"],
  ]) {
    const { scene } = setup();
    scene.command = command;
    scene.textures = { exists: () => true };
    scene.add = {
      image(x, y, texture) {
        const image = displayObject();
        Object.assign(image, { x, y, texture, width: 585, height: 1080 });
        return image;
      },
    };
    scene.drawParallaxBackdrop();
    assert.equal(scene.viewportBackdrop.texture, expectedTexture);
    assert.equal(scene.viewportBackdrop.scrollFactorX, 0, "native camera recentering cannot expose a side band");
    assert.equal(scene.viewportBackdrop.scrollFactorY, 0, "native camera recentering cannot expose a bottom band");
    assert.equal(scene.viewportBackdrop.depth, -120);
    assert.deepEqual(geometry(scene.viewportBackdrop), expectedGeometry(390, 720));
  }
});

test("scene keeps the viewport backdrop outside the foreground camera layer", () => {
  const { scene, backdrop } = setup();
  const castle = {}, unit = {};
  const layer = displayObject();
  layer.children = [];
  layer.add = (children) => { layer.children.push(...children); return layer; };
  scene.children = { list: [backdrop, castle, unit] };
  scene.add = { container: () => layer };
  scene.resetPhaserCamera = () => {};
  scene.wrapSceneInPresentationLayer();
  assert.equal(scene.presentationLayer, layer);
  assert.deepEqual(layer.children, [castle, unit]);
  assert.equal(scene.viewportBackdrop, backdrop);

  const before = geometry(backdrop);
  scene.setDraftCamera();
  assert.equal(layer.scaleX, DRAFT_CAMERA_ZOOM);
  assert.equal(layer.scaleY, DRAFT_CAMERA_ZOOM);
  assert.deepEqual(geometry(backdrop), before, "draft zoom cannot shrink the backdrop");

  scene.tweens = {
    killTweensOf() {},
    add(config) {
      assert.equal(config.targets, layer);
      config.targets.setPosition(config.x, config.y).setScale(config.scaleX, config.scaleY);
    },
  };
  scene.focusCameraOnPoint(195, 420, 360, BATTLE_CAMERA_ZOOM);
  scene.focusCameraOnPoint(195, 110, 360, 1.14);
  assert.deepEqual(geometry(backdrop), before, "battle fitting and castle focus transform foreground only");
});

test("backdrop sizing uses current viewport dimensions and natural image ratio", () => {
  const { scene, backdrop } = setup();
  for (const [width, height] of [[320, 568], [430, 932], [844, 390]]) {
    Object.assign(scene.scale, { width, height });
    scene.refreshBackdropSize();
    assert.deepEqual(geometry(backdrop), expectedGeometry(width, height));
    assert.equal(backdrop.width, 585, "previous display sizing must not become the source width");
    assert.equal(backdrop.height, 1080, "previous display sizing must not become the source height");
  }
});

test("draft resize refreshes backdrop before redrawing the same draft command", () => {
  const { scene, backdrop } = setup();
  scene.command = { type: "draft", playerCastleHp: 7, enemyCastleHp: 13, backdrop: "game" };
  const command = scene.command;
  let redraws = 0;
  scene.applyCommand = (input) => {
    redraws += 1;
    assert.equal(input, command);
    assert.deepEqual(geometry(backdrop), expectedGeometry(430, 932));
    scene.layout = createFieldLayout(scene.scale.width, scene.scale.height);
  };
  Object.assign(scene.scale, { width: 430, height: 932 });
  scene.refreshDraftAfterResize();
  assert.equal(redraws, 1);
  scene.refreshDraftAfterResize();
  assert.equal(redraws, 1, "same-size event does not redraw the draft");
});

test("active and completed battle resize updates backdrop without replaying or cancelling combat", () => {
  const { scene, backdrop } = setup();
  const timeline = { id: "unchanged-battle" };
  const activeBattle = { token: 17 };
  scene.command = { type: "battle", timeline };
  scene.activeBattle = activeBattle;
  scene.applyCommand = () => assert.fail("resize must not replay combat");
  scene.cancelActiveBattle = () => assert.fail("resize must not cancel combat");
  const oldLayout = scene.layout;
  const oldToken = scene.playToken;
  for (const [width, height] of [[320, 568], [430, 932]]) {
    Object.assign(scene.scale, { width, height });
    scene.refreshDraftAfterResize();
    assert.deepEqual(geometry(backdrop), expectedGeometry(width, height));
    assert.equal(scene.command.timeline, timeline);
    assert.equal(scene.layout, oldLayout, "logical combat layout is not rebuilt mid-timeline");
    assert.equal(scene.playToken, oldToken);
    assert.equal(scene.activeBattle, activeBattle);
  }
  scene.activeBattle = undefined;
  Object.assign(scene.scale, { width: 844, height: 390 });
  scene.refreshDraftAfterResize();
  assert.deepEqual(geometry(backdrop), expectedGeometry(844, 390));
  assert.equal(scene.command.timeline, timeline);
});

test("hidden zero-sized viewports preserve the last valid backdrop geometry", () => {
  const { scene, backdrop } = setup();
  scene.applyCommand = () => assert.fail("hidden viewport must not redraw");
  const before = geometry(backdrop);
  for (const [width, height] of [[0, 568], [320, 0], [0, 0]]) {
    Object.assign(scene.scale, { width, height });
    scene.refreshDraftAfterResize();
    assert.deepEqual(geometry(backdrop), before);
  }
});

test("clearing the scene destroys and releases both backdrop and foreground", () => {
  const { scene, backdrop } = setup();
  const layer = displayObject();
  scene.presentationLayer = layer;
  scene.children = { list: [backdrop, layer] };
  scene.cancelPresentation = () => {};
  scene.applyBattleSpeed = () => {};
  scene.clearScene();
  assert.equal(backdrop.destroyed, true);
  assert.equal(layer.destroyed, true);
  assert.equal(scene.viewportBackdrop, undefined);
  assert.equal(scene.presentationLayer, undefined);
});

test("shutdown releases the backdrop and removes the viewport resize listener", () => {
  const { scene, backdrop } = setup();
  let shutdown;
  scene.events = { once(_event, callback) { shutdown = callback; } };
  scene.applyCommand = () => {};
  scene.cancelPresentation = () => {};
  scene.create();
  assert.equal(scene.scale.listenerCount("resize"), 1);
  const before = geometry(backdrop);
  shutdown();
  assert.equal(scene.viewportBackdrop, undefined);
  assert.equal(scene.scale.listenerCount("resize"), 0);
  Object.assign(scene.scale, { width: 430, height: 932 });
  scene.scale.emit("resize");
  assert.deepEqual(geometry(backdrop), before);
});

function setup() {
  const scene = new HeadlessBattleScene();
  scene.ready = true;
  scene.layout = createFieldLayout(390, 720);
  const backdrop = displayObject();
  backdrop.width = 585;
  backdrop.height = 1080;
  scene.viewportBackdrop = backdrop;
  scene.refreshBackdropSize();
  return { scene, backdrop };
}

function displayObject() {
  return {
    x: 0, y: 0, scaleX: 1, scaleY: 1, displayWidth: 0, displayHeight: 0,
    setPosition(x, y) { Object.assign(this, { x, y }); return this; },
    setScale(scaleX, scaleY = scaleX) { Object.assign(this, { scaleX, scaleY }); return this; },
    setDisplaySize(displayWidth, displayHeight) { Object.assign(this, { displayWidth, displayHeight }); return this; },
    setDepth(depth) { this.depth = depth; return this; },
    setScrollFactor(scrollFactorX, scrollFactorY = scrollFactorX) { Object.assign(this, { scrollFactorX, scrollFactorY }); return this; },
    destroy() { this.destroyed = true; },
  };
}

function geometry(object) {
  const { x, y, displayWidth, displayHeight, scaleX, scaleY } = object;
  return { x, y, displayWidth, displayHeight, scaleX, scaleY };
}

function expectedGeometry(width, height) {
  const cover = getBackdropCoverSize(width, height, 585, 1080);
  return { x: width / 2, y: height / 2, displayWidth: cover.width, displayHeight: cover.height, scaleX: 1, scaleY: 1 };
}
