import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const armoryShopSource = readFileSync(resolve(currentDir, "../src/armoryShopUi.ts"), "utf8");

test("armory shop groups generated back and front equipment into one product", () => {
  assert.equal(armoryShopSource.includes("pairGeneratedArmoryProducts(products)"), true);
  assert.equal(armoryShopSource.includes("PAIRED_ARMORY_SLOT_CONFIGS"), true);
  assert.equal(armoryShopSource.includes('backSlot: "backShoulderguard", frontSlot: "frontShoulderguard"'), true);
  assert.equal(armoryShopSource.includes('backSlot: "backGlove", frontSlot: "frontGlove"'), true);
  assert.equal(armoryShopSource.includes("findArmoryProductPair"), true);
  assert.equal(armoryShopSource.includes("getArmoryProductPairKey"), true);
  assert.equal(armoryShopSource.includes("if (pairConfig && !counterpart)"), true);
  assert.equal(armoryShopSource.includes("price: backProduct.price + frontProduct.price"), true);
  assert.equal(armoryShopSource.includes("itemIds: [backItemId, frontItemId]"), true);
});
