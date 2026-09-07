import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as fieldLayout from "../src/fieldLayout.ts";
import { BOARD_SLOT_COUNT } from "../src/game/index.ts";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const sourceFile = ts.createSourceFile("main.ts", mainSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
const functionNames = new Set([
  "getPlayerFieldSlotPosition", "createCurrentFieldLayout", "updateFieldSlotPosition",
  "refreshFieldSlotPositions", "observeFieldSlotLayout",
]);
const functions = sourceFile.statements
  .filter((statement) => ts.isFunctionDeclaration(statement) && functionNames.has(statement.name?.text))
  .map((statement) => statement.getText(sourceFile));
assert.equal(functions.length, functionNames.size);
const compiled = ts.transpileModule(`${functions.join("\n")}\nthis.track = observeFieldSlotLayout;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

test("resizing the live stage updates existing slot hitboxes without rebuilding selection or focus", () => {
  const fixture = createFixture();
  const cleanup = fixture.track();
  assert.equal(fixture.observers.length, 1);
  assert.equal(fixture.observers[0].observed, fixture.stage);
  const initialBottom = fixture.slots[0].properties.get("--slot-y");
  const sameSlots = [...fixture.slots];
  fixture.setSize(320, 568);
  fixture.observers[0].notify();

  assert.notEqual(fixture.slots[0].properties.get("--slot-y"), initialBottom);
  assert.deepEqual(fixture.slots, sameSlots, "All existing nodes and event handlers must survive");
  assert.equal(fixture.slots[0].focused, true);
  assert.equal(fixture.slots[0].selected, true);
  assertProjectedSlots(fixture, 320, 568);
  cleanup();
});

test("resize tracking is independent of asynchronous Phaser mount and reads current dimensions on resume", () => {
  const fixture = createFixture({ width: 0, height: 0 });
  const cleanup = fixture.track();
  assertProjectedSlots(fixture, fieldLayout.FIELD_FALLBACK_WIDTH, fieldLayout.FIELD_FALLBACK_HEIGHT);
  // No renderer exists in this fixture: CSS layout can settle before its import.
  fixture.setSize(390, 844);
  fixture.observers[0].notify();
  assertProjectedSlots(fixture, 390, 844);

  fixture.window.dispatchEvent(new globalThis.Event("pagehide"));
  assert.equal(fixture.observers[0].disconnected, true);
  fixture.setSize(320, 568);
  fixture.window.dispatchEvent(new globalThis.Event("pageshow"));
  assert.equal(fixture.observers.length, 2);
  assertProjectedSlots(fixture, 320, 568);
  cleanup();
});

test("HMR cleanup disconnects observers and removes lifecycle and fallback resize listeners", () => {
  const fixture = createFixture();
  const cleanup = fixture.track();
  const initialBottom = fixture.slots[0].properties.get("--slot-y");
  cleanup();
  cleanup();
  assert.equal(fixture.observers[0].disconnected, true);
  fixture.setSize(320, 568);
  fixture.window.dispatchEvent(new globalThis.Event("resize"));
  fixture.window.dispatchEvent(new globalThis.Event("pageshow"));
  assert.equal(fixture.observers.length, 1);
  assert.equal(fixture.slots[0].properties.get("--slot-y"), initialBottom);
  assert.match(mainSource, /render\(\);\s*const stopFieldSlotResizeTracking = observeFieldSlotLayout\(\);/);
  assert.match(mainSource, /import\.meta\.hot\?\.dispose\(stopFieldSlotResizeTracking\)/);
  assert.match(mainSource, /function createFieldSlot\([\s\S]*?updateFieldSlotPosition\(slot, slotIndex\)/);
});

test("window resize remains a safe fallback without ResizeObserver and invalid slot indices are ignored", () => {
  const fixture = createFixture({ resizeObserver: false });
  for (const invalidIndex of ["NaN", "-1", "6", "1.2"]) {
    fixture.slots.push(createSlot(invalidIndex));
  }
  const cleanup = fixture.track();
  fixture.setSize(320, 568);
  fixture.window.dispatchEvent(new globalThis.Event("resize"));
  assertProjectedSlots(fixture, 320, 568);
  assert.equal(fixture.observers.length, 0);
  for (const invalidSlot of fixture.slots.slice(BOARD_SLOT_COUNT)) assert.equal(invalidSlot.properties.size, 0);
  cleanup();
});

function createFixture({ width = 390, height = 844, resizeObserver = true } = {}) {
  let dimensions = { width, height };
  const slots = Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => createSlot(String(index)));
  slots[0].focused = true;
  slots[0].selected = true;
  const stage = {
    getBoundingClientRect: () => dimensions,
    querySelectorAll: (selector) => {
      assert.equal(selector, ".field-slot[data-field-slot-index]");
      return slots;
    },
  };
  const observers = [];
  class FakeResizeObserver {
    constructor(notify) {
      this.notify = notify;
      observers.push(this);
    }
    observe(element) { this.observed = element; }
    disconnect() { this.disconnected = true; }
  }
  const fakeWindow = new globalThis.EventTarget();
  const context = {
    ...fieldLayout,
    BOARD_SLOT_COUNT,
    stageElement: stage,
    window: fakeWindow,
    ResizeObserver: resizeObserver ? FakeResizeObserver : undefined,
    render: () => assert.fail("Resize must not rebuild the interface"),
  };
  vm.runInNewContext(compiled, context, { filename: "field-slot-resize.headless.js" });
  return { slots, stage, observers, window: fakeWindow, track: context.track, setSize: (nextWidth, nextHeight) => {
    dimensions = { width: nextWidth, height: nextHeight };
  } };
}

function createSlot(index) {
  const properties = new Map();
  return {
    dataset: { fieldSlotIndex: index },
    properties,
    style: { setProperty: (name, value) => properties.set(name, value) },
  };
}

function assertProjectedSlots(fixture, width, height) {
  const layout = fieldLayout.createFieldLayout(width, height);
  fixture.slots.slice(0, BOARD_SLOT_COUNT).forEach((slot, index) => {
    const row = fieldLayout.getFieldSlotRow(index);
    const y = layout.homeRowsY.player[row];
    const x = fieldLayout.getSlotLaneX(layout, fieldLayout.getFieldSlotColumn(index), y);
    const projected = fieldLayout.projectDraftPoint(layout, { x, y });
    assert.equal(slot.properties.get("--slot-x"), `${(projected.x / width) * 100}%`);
    assert.equal(slot.properties.get("--slot-y"), `${height - projected.y}px`);
    assert.equal(slot.properties.get("--slot-scale"), `${fieldLayout.DRAFT_CAMERA_ZOOM * fieldLayout.getDraftSlotPerspectiveScale(layout, y)}`);
    assert.equal(slot.properties.get("--slot-depth"), String(row + 1));
    assert.equal(slot.properties.size, 4, "Only geometry variables may change during resize");
  });
}
