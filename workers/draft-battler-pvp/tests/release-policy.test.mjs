import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getEnabledPvpBinding, isPvpEnabled } from "../src/releasePolicy.ts";

test("PvP stays disabled unless the flag is the exact string true", () => {
  const disabledEnvironments = [
    {},
    { PVP_ENABLED: "false" },
    { PVP_ENABLED: "TRUE" },
    { PVP_ENABLED: " true " },
    { PVP_ENABLED: "unexpected" },
    { PVP_ENABLED: true },
    { PVP_ENABLED: 1 },
  ];

  disabledEnvironments.forEach((env) => assert.equal(isPvpEnabled(env), false));
  assert.equal(isPvpEnabled({ PVP_ENABLED: "true" }), true);
});

test("disabled PvP does not read the Durable Object binding", () => {
  for (const PVP_ENABLED of [undefined, "false", "unexpected"]) {
    let bindingReads = 0;
    const env = PVP_ENABLED === undefined ? {} : { PVP_ENABLED };
    Object.defineProperty(env, "DRAFT_PVP_ROOM", {
      get() {
        bindingReads += 1;
        throw new Error("Disabled policy must not read DRAFT_PVP_ROOM.");
      },
    });

    assert.equal(getEnabledPvpBinding(env), undefined);
    assert.equal(bindingReads, 0);
  }
});

test("enabled PvP returns the Durable Object binding", () => {
  const binding = { name: "test-binding" };
  let bindingReads = 0;
  const env = { PVP_ENABLED: "true" };
  Object.defineProperty(env, "DRAFT_PVP_ROOM", {
    get() {
      bindingReads += 1;
      return binding;
    },
  });

  assert.equal(getEnabledPvpBinding(env), binding);
  assert.equal(bindingReads, 1);
});

test("the production release config explicitly enables PvP for the public MVP", async () => {
  const configText = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const config = JSON.parse(configText);

  assert.equal(config.vars?.PVP_ENABLED, "true");
  assert.equal(config.vars?.ENVIRONMENT, "production");
  assert.deepEqual(config.secrets?.required, ["BOT_TOKEN"]);
  assert.equal(
    config.vars?.PVP_ALLOWED_ORIGINS,
    "https://draft-battler-pvp.mr-maybik.workers.dev",
  );

  const productionEnvironment = await readFile(
    new URL("../../../draft-battler/.env.production", import.meta.url),
    "utf8",
  );
  assert.match(productionEnvironment, /^VITE_DRAFT_BATTLER_PVP_ENABLED=true\s*$/m);
});
