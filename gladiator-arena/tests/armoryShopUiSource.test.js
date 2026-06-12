import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const armoryShopSource = readFileSync(resolve(currentDir, "../src/armoryShopUi.ts"), "utf8");
const weaponShopSource = readFileSync(resolve(currentDir, "../src/weaponShopUi.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const shopItemIconsSource = readFileSync(resolve(currentDir, "../src/shopItemIcons.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("armory shop groups generated back and front equipment into one product", () => {
  assert.equal(armoryShopSource.includes("pairGeneratedArmoryProducts(products)"), true);
  assert.equal(armoryShopSource.includes("PAIRED_ARMORY_SLOT_CONFIGS"), true);
  assert.equal(armoryShopSource.includes('backSlot: "backShoulderguard", frontSlot: "frontShoulderguard"'), true);
  assert.equal(armoryShopSource.includes('backSlot: "backGlove", frontSlot: "frontGlove"'), true);
  assert.equal(armoryShopSource.includes("findArmoryProductPair"), true);
  assert.equal(armoryShopSource.includes("getArmoryProductPairKey"), true);
  assert.equal(armoryShopSource.includes("if (!counterpart)"), true);
  assert.equal(armoryShopSource.includes("price: getPairedArmoryProductPrice(backProduct, frontProduct)"), true);
  assert.equal(armoryShopSource.includes("Math.max(backProduct.price, frontProduct.price)"), true);
  assert.equal(armoryShopSource.includes("price: backProduct.price + frontProduct.price"), false);
  assert.equal(armoryShopSource.includes("itemIds: [backItemId, frontItemId]"), true);
});

test("armory paired product cards prefer front equipment icons", () => {
  assert.equal(shopItemIconsSource.includes("HERO_ITEM_CATALOG"), true);
  assert.equal(shopItemIconsSource.includes("getRepresentativeShopItemIconId(itemIds)"), true);
  assert.equal(shopItemIconsSource.includes('slot?.startsWith("front")'), true);
  assert.equal(shopItemIconsSource.includes("return frontItemId ?? [...itemIds].reverse().find"), true);
});

test("city shops report their bottom menu position for hero centering", () => {
  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("onLayoutChange?: (menuTopY?: number) => void"), true);
    assert.equal(source.includes("window.addEventListener(\"resize\", scheduleLayoutSync);"), true);
    assert.equal(source.includes("window.visualViewport?.addEventListener(\"resize\", scheduleLayoutSync);"), true);
    assert.equal(source.includes("window.visualViewport?.addEventListener(\"scroll\", scheduleLayoutSync);"), true);
    assert.equal(source.includes("new ResizeObserver(scheduleLayoutSync)"), true);
    assert.equal(source.includes("scheduleSettledLayoutSync();"), true);
    assert.equal(source.includes("SHOP_LAYOUT_SETTLE_DELAYS_MS"), true);
    assert.equal(source.includes("clearLayoutSettleTimers();"), true);
    assert.equal(source.includes("const rootRect = root.getBoundingClientRect();"), true);
    assert.equal(source.includes("const menuRect = menu.getBoundingClientRect();"), true);
    assert.equal(source.includes("options.onLayoutChange(Math.max(0, menuRect.top - rootRect.top));"), true);
    assert.equal(source.includes("options.onLayoutChange?.(undefined);"), true);
  });

  assert.equal(mainSource.includes("function syncCityShopLayout(menuTopY?: number): void"), true);
  assert.equal(mainSource.includes("cityScene?.setShopMenuTop(menuTopY);"), true);
  assert.equal(mainSource.match(/onLayoutChange: syncCityShopLayout/g)?.length, 2);
});

test("city shop mode has a screen frame and compact title plaque", () => {
  assert.equal(stylesSource.includes(".armory-shop--city-mode::before"), true);
  assert.equal(stylesSource.includes(".armory-shop--city-mode::after"), true);
  assert.equal(stylesSource.includes('content: "ARMORY";'), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode::after"), true);
  assert.equal(stylesSource.includes('content: "WEAPONSMITH";'), true);
  assert.equal(stylesSource.includes("--shop-frame-side-width: 7px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-top-height: 16px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-bottom-height: 6px;"), true);
  assert.match(stylesSource, /\.armory-shop--city-mode::before\s*\{[\s\S]*var\(--shop-frame-top-height\)[\s\S]*var\(--shop-frame-side-width\)[\s\S]*var\(--shop-frame-bottom-height\)[\s\S]*\}/);
  assert.match(stylesSource, /\.armory-shop--city-mode::after\s*\{[\s\S]*transform: translateX\(-50%\);[\s\S]*\}/);
});

test("city category buttons use icons without visible text labels", () => {
  assert.equal(armoryShopSource.includes("button.setAttribute(\"aria-label\", category.name);"), true);
  assert.equal(weaponShopSource.includes("button.setAttribute(\"aria-label\", category.name);"), true);
  assert.equal(armoryShopSource.includes("createCategoryLabel"), false);
  assert.equal(armoryShopSource.includes("armory-shop__category-label"), false);
  assert.equal(stylesSource.includes("armory-shop__category-label"), false);
  assert.match(stylesSource, /\.armory-shop__category-button\s*\{[\s\S]*place-items: center;[\s\S]*\}/);
});

test("city armory product cards use three columns while weapon shop keeps four", () => {
  assert.equal(stylesSource.includes("--shop-city-product-columns: 3;"), true);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-product-columns: 4;[\s\S]*\}/);
});
