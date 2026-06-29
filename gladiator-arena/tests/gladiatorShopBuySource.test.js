import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const saveClientSource = readFileSync(resolve(currentDir, "../src/gladiatorSaveClient.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const armoryShopSource = readFileSync(resolve(currentDir, "../src/armoryShopUi.ts"), "utf8");
const weaponShopSource = readFileSync(resolve(currentDir, "../src/weaponShopUi.ts"), "utf8");
const apiWorkerSource = readFileSync(resolve(currentDir, "../../workers/gladiator-api/src/index.ts"), "utf8");

test("gladiator shop buys are routed through the player actor and D1 save", () => {
  assert.equal(apiWorkerSource.includes('url.pathname === "/api/gladiator-shop/buy"'), true);
  assert.equal(apiWorkerSource.includes("async buyShopProduct(input: PlayerActorBuyShopProductInput)"), true);
  assert.equal(apiWorkerSource.includes("return this.enqueue(() => this.buyShopProductNow(input));"), true);
  assert.equal(apiWorkerSource.includes("SELECT hero_json FROM player_saves WHERE telegram_user_id = ?"), true);
  assert.equal(apiWorkerSource.includes("buyAndEquipHeroItems(hero"), true);
  assert.equal(apiWorkerSource.includes("UPDATE player_saves SET"), true);
  assert.equal(apiWorkerSource.includes("revision = revision + 1"), true);
  assert.equal(apiWorkerSource.includes("player_commands"), false);
});

test("frontend shop buy waits for the server hero before mutating visible hero state", () => {
  assert.equal(saveClientSource.includes('const GLADIATOR_SHOP_BUY_ENDPOINT = "/api/gladiator-shop/buy"'), true);
  assert.equal(saveClientSource.includes("export async function buyGladiatorShopProduct"), true);
  assert.match(
    mainSource,
    /setPendingEquipmentShopBuyProduct\(product\);[\s\S]*const serverHero = await buyGladiatorShopProduct\([\s\S]*hero = nextHero;/,
  );
  assert.doesNotMatch(
    mainSource,
    /setPendingEquipmentShopBuyProduct\(product\);[\s\S]*buyAndEquipHeroItems\(previousHero/,
  );
});

test("equipment shop cards show a per-product buying state while the server request is pending", () => {
  for (const source of [armoryShopSource, weaponShopSource]) {
    assert.equal(source.includes("pendingProductId?: string | null"), true);
    assert.equal(source.includes('label: "BUYING"'), true);
    assert.equal(source.includes('button.classList.toggle("armory-shop__option--pending", isPending)'), true);
    assert.equal(source.includes('button.disabled = isPending ||'), true);
  }
});
