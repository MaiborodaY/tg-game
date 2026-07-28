import assert from "node:assert/strict";
import test from "node:test";

import { createLazyRuntimeController } from "../src/game/lazyRuntime.ts";

test("runtime preload and concurrent mounts share one import and one factory call", async () => {
  let importCalls = 0;
  let mountCalls = 0;
  let resolveImport;
  const imported = new Promise((resolve) => {
    resolveImport = resolve;
  });
  const controller = createLazyRuntimeController(
    () => {
      importCalls += 1;
      return imported;
    },
    (runtime, context) => {
      mountCalls += 1;
      return Object.freeze({ runtime, context });
    },
  );

  const preload = controller.preload();
  const first = controller.ensureMounted("first");
  const second = controller.ensureMounted("second");
  assert.equal(first, second);
  assert.equal(importCalls, 1);
  assert.equal(mountCalls, 0);

  resolveImport(Object.freeze({ id: "runtime" }));
  await preload;
  const mounted = await first;
  assert.equal(await second, mounted);
  assert.equal(mounted.context, "first");
  assert.equal(mountCalls, 1);
  assert.equal(controller.getMounted(), mounted);

  assert.equal(controller.clearMounted(), mounted);
  const remounted = await controller.ensureMounted("replacement");
  assert.equal(importCalls, 1, "a successful runtime import stays cached");
  assert.equal(mountCalls, 2);
  assert.equal(remounted.context, "replacement");
});

test("failed runtime imports and mount factories remain retryable", async () => {
  let importCalls = 0;
  let mountCalls = 0;
  let failMount = true;
  const controller = createLazyRuntimeController(
    async () => {
      importCalls += 1;
      if (importCalls === 1) throw new Error("chunk unavailable");
      return Object.freeze({ id: "runtime" });
    },
    (runtime, context) => {
      mountCalls += 1;
      if (failMount) {
        failMount = false;
        throw new Error("renderer unavailable");
      }
      return Object.freeze({ runtime, context });
    },
  );

  await assert.rejects(controller.ensureMounted("first"), /chunk unavailable/);
  assert.equal(controller.getMounted(), null);
  assert.equal(mountCalls, 0);

  await assert.rejects(controller.ensureMounted("second"), /renderer unavailable/);
  assert.equal(importCalls, 2);
  assert.equal(controller.getMounted(), null);

  const mounted = await controller.ensureMounted("third");
  assert.equal(importCalls, 2, "mount failure does not discard a loaded runtime");
  assert.equal(mountCalls, 2);
  assert.equal(mounted.context, "third");
});

test("concurrent import failure resets one shared attempt for preload and mount retries", async () => {
  let importCalls = 0;
  let rejectImport;
  const failedImport = new Promise((_resolve, reject) => {
    rejectImport = reject;
  });
  const controller = createLazyRuntimeController(
    () => {
      importCalls += 1;
      return importCalls === 1 ? failedImport : Promise.resolve(Object.freeze({ id: "runtime" }));
    },
    (runtime, context) => Object.freeze({ runtime, context }),
  );

  const preload = controller.preload();
  const firstMount = controller.ensureMounted("first");
  const secondMount = controller.ensureMounted("second");
  assert.equal(firstMount, secondMount);
  assert.equal(importCalls, 1);

  rejectImport(new Error("shared chunk failure"));
  await assert.rejects(preload, /shared chunk failure/);
  await assert.rejects(firstMount, /shared chunk failure/);
  await assert.rejects(secondMount, /shared chunk failure/);

  const mounted = await controller.ensureMounted("retry");
  assert.equal(importCalls, 2);
  assert.equal(mounted.context, "retry");
});
