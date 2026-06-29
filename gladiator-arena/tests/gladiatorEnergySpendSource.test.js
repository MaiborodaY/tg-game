import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const saveClientSource = readFileSync(resolve(currentDir, "../src/gladiatorSaveClient.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const spendEndpointSource = readFileSync(resolve(currentDir, "../../functions/api/gladiator-energy/spend.ts"), "utf8");
const apiWorkerSource = readFileSync(resolve(currentDir, "../../workers/gladiator-api/src/index.ts"), "utf8");

test("cloud arena energy spend accepts variable amounts", () => {
  assert.equal(saveClientSource.includes("spendGladiatorArenaEnergy(hero: HeroState, amount = 1)"), true);
  assert.equal(saveClientSource.includes('getGladiatorApiUrl(GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT)'), true);
  assert.equal(saveClientSource.includes('JSON.stringify({ requestId: createGladiatorCommandRequestId("arena-energy"), hero, amount })'), true);
  assert.equal(spendEndpointSource.includes("amount?: unknown"), true);
  assert.equal(spendEndpointSource.includes("getArenaEnergySpendAmount(requestBody.amount)"), true);
  assert.equal(spendEndpointSource.includes("current = current - ?"), true);
  assert.equal(spendEndpointSource.includes("AND current >= ?"), true);
  assert.equal(spendEndpointSource.includes(".bind(amount, HERO_ARENA_ENERGY_MAX"), true);
});

test("gladiator API worker skips command receipts for arena energy and returns updated energy", () => {
  assert.equal(apiWorkerSource.includes("RETURNING current, max, day_key"), true);
  assert.equal(apiWorkerSource.includes("player_commands"), false);
  assert.equal(apiWorkerSource.includes("readPlayerCommand"), false);
  assert.equal(apiWorkerSource.includes("finishPlayerCommand"), false);
  assert.equal(apiWorkerSource.includes("missing_request_id"), false);
  assert.equal(apiWorkerSource.includes("db.batch"), false);
  assert.equal(apiWorkerSource.includes("readPlayerSaveHero"), false);
  assert.equal(apiWorkerSource.includes(".run();\n  const arenaEnergy = (await readPlayerDailyArenaEnergy"), false);
});

test("manual arena start paints the spending state before the energy request", () => {
  assert.match(
    mainSource,
    /arenaEnergySpendPending = true;\s*syncCityArenaBotControls\(\);\s*await nextAnimationFrame\(\);[\s\S]*spendGladiatorArenaEnergy\(hero, energyCost\)/,
  );
});
