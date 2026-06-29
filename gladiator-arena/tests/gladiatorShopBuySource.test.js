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
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
const apiWorkerSource = readFileSync(resolve(currentDir, "../../workers/gladiator-api/src/index.ts"), "utf8");

test("gladiator shop buys are routed through the player actor and D1 save", () => {
  assert.equal(apiWorkerSource.includes('url.pathname === "/api/gladiator-shop/buy"'), true);
  assert.equal(apiWorkerSource.includes("async buyShopProduct(input: PlayerActorBuyShopProductInput)"), true);
  assert.equal(apiWorkerSource.includes("return this.enqueue(() => this.buyShopProductNow(input));"), true);
  assert.equal(apiWorkerSource.includes("SELECT hero_json FROM player_saves WHERE telegram_user_id = ?"), true);
  assert.equal(apiWorkerSource.includes("buyAndEquipHeroItems(hero"), true);
  assert.equal(apiWorkerSource.includes("UPDATE player_saves SET"), true);
  assert.equal(apiWorkerSource.includes("revision = revision + 1"), true);
  assert.equal(apiWorkerSource.includes("withValidatedEquipmentSnapshot(savedHero, input.equipment, input.nowIso)"), true);
  assert.equal(apiWorkerSource.includes("isHeroItemOwned(hero, itemId)"), true);
  assert.equal(apiWorkerSource.includes("item.equipmentSlot === slotKey"), true);
  assert.equal(apiWorkerSource.includes('type ShopKind = "armory" | "weapon" | "magic"'), true);
  assert.equal(apiWorkerSource.includes('type ShopAction = "buy" | "upgrade_scroll" | "upgrade_scroll_capacity" | "sharpen_weapon"'), true);
  assert.equal(apiWorkerSource.includes("applyMagicShopAction(hero, input)"), true);
  assert.equal(apiWorkerSource.includes("upgradeHeroScrollCapacity(hero, input.nowIso)"), true);
  assert.equal(apiWorkerSource.includes("upgradeHeroScroll(hero, product.itemIds[0], input.nowIso)"), true);
  assert.equal(apiWorkerSource.includes("player_commands"), false);
});

test("frontend shop buy waits for the server hero before mutating visible hero state", () => {
  assert.equal(saveClientSource.includes('const GLADIATOR_SHOP_BUY_ENDPOINT = "/api/gladiator-shop/buy"'), true);
  assert.equal(saveClientSource.includes("export async function buyGladiatorShopProduct"), true);
  assert.equal(saveClientSource.includes("export async function applyGladiatorShopAction"), true);
  assert.equal(saveClientSource.includes("body: JSON.stringify(actionRequest)"), true);
  assert.equal(mainSource.includes("previousHero.equipment"), true);
  assert.equal(mainSource.includes('handleCloudMagicShopAction("buy", product)'), true);
  assert.equal(mainSource.includes('handleCloudMagicShopAction("upgrade_scroll", product)'), true);
  assert.equal(mainSource.includes('handleCloudMagicShopAction("upgrade_scroll_capacity")'), true);
  assert.match(
    mainSource,
    /setPendingEquipmentShopBuyProduct\(product\);[\s\S]*const serverHero = await buyGladiatorShopProduct\([\s\S]*hero = nextHero;[\s\S]*applyShopEquipmentVisualSync\(hero\.equipment,/,
  );
  assert.equal(mainSource.includes("cityScene?.confirmEquipmentPreview(equipment)"), true);
  assert.equal(arenaSceneSource.includes("confirmEquipmentPreview: (equipment: HeroEquipment) => boolean"), true);
  assert.equal(arenaSceneSource.includes("confirmPlayerEquipmentPreview(equipment: HeroEquipment): boolean"), true);
  assert.doesNotMatch(
    mainSource,
    /setPendingEquipmentShopBuyProduct\(product\);[\s\S]*buyAndEquipHeroItems\(previousHero/,
  );
});

test("equipment shop cards keep the selected buy action in a buying state while the server request is pending", () => {
  for (const source of [armoryShopSource, weaponShopSource]) {
    assert.equal(source.includes("pendingProductId?: string | null"), true);
    assert.equal(source.includes('label: "BUYING"'), true);
    assert.equal(source.includes('return { state: "buying" }'), true);
    assert.equal(source.includes('button.classList.toggle("armory-shop__option--pending", isPending)'), true);
    assert.equal(source.includes('shop.classList.toggle("armory-shop--purchase-pending", Boolean(pendingProductId))'), true);
    assert.equal(source.includes("button.disabled = isPending ||"), true);
    assert.equal(source.includes("button.disabled || (pendingProductId && !isPending)"), true);
    assert.equal(source.includes("removeRenderedProduct(hiddenProducts[0])"), true);
    assert.equal(source.includes("refreshVisibleProductButtons(hero)"), true);
    assert.equal(source.includes("previewProduct = undefined;\r\n          options.onBuy(product);"), false);
    assert.equal(source.includes("previewProduct = undefined;\n          options.onBuy(product);"), false);
  }
});
