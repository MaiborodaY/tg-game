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
const shopPresentationSource = readFileSync(resolve(currentDir, "../src/shopPresentation.ts"), "utf8");
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

test("armory shop sorts products by rarity, armor, price, slot, then name", () => {
  assert.match(
    armoryShopSource,
    /const rarityDifference[\s\S]*if \(rarityDifference !== 0\)[\s\S]*const armorDifference[\s\S]*if \(armorDifference !== 0\)[\s\S]*const priceDifference[\s\S]*if \(priceDifference !== 0\)[\s\S]*const slotDifference[\s\S]*if \(slotDifference !== 0\)[\s\S]*return left\.name\.localeCompare\(right\.name\);/,
  );
});

test("armory paired product cards prefer front equipment icons", () => {
  assert.equal(shopItemIconsSource.includes("HERO_ITEM_CATALOG"), true);
  assert.equal(shopItemIconsSource.includes("getRepresentativeShopItemIconId(itemIds)"), true);
  assert.equal(shopItemIconsSource.includes('slot?.startsWith("front")'), true);
  assert.equal(shopItemIconsSource.includes("return frontItemId ?? [...itemIds].reverse().find"), true);
});

test("shop product display names hide technical variants and rename shoulder guards", () => {
  assert.equal(shopPresentationSource.includes("export function getShopProductDisplayName(productName: string): string"), true);
  assert.equal(shopPresentationSource.includes('.replace(/\\bshoulderguards?\\b/giu, "Shoulders")'), true);
  assert.equal(shopPresentationSource.includes(".replace(/\\s+01\\b/gu, \"\")"), true);
  assert.equal(armoryShopSource.includes('pluralLabel: "Shoulders"'), true);

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("getShopProductDisplayName"), true);
    assert.equal(source.includes("const displayName = getShopProductDisplayName(product.name);"), true);
    assert.equal(source.includes("button.title = displayName;"), true);
    assert.equal(source.includes("createSelectedMeta(displayName"), true);
    assert.equal(source.includes("button.title = product.name;"), false);
  });
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

test("city shop category title is engraved without striped header overlay", () => {
  const cityHeaderBeforeRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__header::before\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityTitleRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__title\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.doesNotMatch(cityHeaderBeforeRule, /repeating-linear-gradient/);
  assert.match(cityTitleRule, /font-family: "Palatino Linotype"/);
  assert.match(cityTitleRule, /font-size: 1\.16rem;/);
  assert.match(cityTitleRule, /letter-spacing: 0\.08em;/);
  assert.match(cityTitleRule, /inset 0 2px 3px rgba\(8, 2, 1, 0\.72\)/);
});

test("city shop meta panel stacks gold and level as readable counters", () => {
  const cityHeaderMetaRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__header-meta\s*\{[\s\S]*?\}/)?.[0] ?? "";

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("armory-shop__gold-icon"), true);
    assert.equal(source.includes("armory-shop__gold-amount"), true);
    assert.equal(source.includes("armory-shop__level-label"), true);
    assert.equal(source.includes("armory-shop__level-value"), true);
    assert.equal(source.includes("goldAmount.textContent = String(hero.gold);"), true);
    assert.equal(source.includes("levelValue.textContent = String(hero.level);"), true);
    assert.equal(source.includes("gold.textContent = `GOLD ${hero.gold}`;"), false);
    assert.equal(source.includes("level.textContent = `LVL ${hero.level}`;"), false);
  });

  assert.match(cityHeaderMetaRule, /grid-template-rows: minmax\(0, 1fr\) 1px minmax\(0, 1fr\);/);
  assert.equal(stylesSource.includes(".armory-shop--city-mode .armory-shop__header-meta::after"), true);
  assert.equal(stylesSource.includes(".armory-shop--city-mode .armory-shop__gold-icon"), true);
  assert.equal(stylesSource.includes(".armory-shop--city-mode .armory-shop__level-value"), true);
});

test("city armory product cards use three columns while weapon shop keeps four", () => {
  assert.equal(stylesSource.includes("--shop-city-product-columns: 3;"), true);
  assert.equal(stylesSource.includes("--shop-city-product-row-height: clamp(104px, 15.8dvh, 124px);"), true);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-product-columns: 4;[\s\S]*\}/);
});

test("shop product cards reuse the profile backdrop texture with deeper rarity color", () => {
  const productRule = stylesSource.match(/\.armory-shop__option--product\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityProductRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__option--product\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.equal(stylesSource.includes('--ui-profile-backdrop-texture: url("./assets/ui/profile/portrait-backdrop-texture.webp");'), true);
  assert.equal(stylesSource.includes("--ui-profile-backdrop-size: 280px 280px;"), true);
  assert.match(stylesSource, /\.city-profile__portrait::before\s*\{[\s\S]*var\(--ui-profile-backdrop-texture\) center \/ cover no-repeat;/);
  assert.match(productRule, /var\(--ui-profile-backdrop-texture\) center \/ var\(--ui-profile-backdrop-size\) repeat/);
  assert.match(productRule, /background-blend-mode: screen, screen, multiply, soft-light, normal;/);
  assert.match(productRule, /var\(--shop-rarity-light, #d4c49c\) 0%, var\(--shop-rarity, #9d8d74\) 56%/);
  assert.match(productRule, /inset 0 -8px 13px rgba\(8, 2, 1, 0\.24\)/);
  assert.match(cityProductRule, /var\(--ui-profile-backdrop-texture\) center \/ var\(--ui-profile-backdrop-size\) repeat/);
  assert.match(cityProductRule, /background-blend-mode: screen, multiply, screen, multiply, screen, screen, multiply, soft-light, normal;/);
  assert.match(cityProductRule, /var\(--shop-rarity-light, #d4c49c\) 0%, var\(--shop-rarity, #9d8d74\) 48%/);
  assert.match(cityProductRule, /inset 0 -6px 10px rgba\(8, 2, 1, 0\.26\)/);
});

test("city shop confirm strip is embedded in the shop header while back floats outside it", () => {
  const cityHeaderRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__header\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const citySelectedRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__selected\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityBackRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__back\s*\{[\s\S]*?\}/)?.[0] ?? "";

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("header.append(title, selected, headerMeta);"), true);
    assert.equal(source.includes("menu.append(tray, categoryRail, back);"), true);
    assert.equal(source.includes("header.append(back, title, selected, headerMeta);"), false);
    assert.equal(source.includes("panel.append(selected);"), false);
    assert.equal(source.includes("menu.append(tray, selected, categoryRail);"), false);
  });

  assert.equal(stylesSource.includes("--shop-city-header-height: 72px;"), true);
  assert.match(cityHeaderRule, /overflow: visible;/);
  assert.match(citySelectedRule, /grid-column: 1;/);
  assert.match(citySelectedRule, /align-self: stretch;/);
  assert.doesNotMatch(citySelectedRule, /position: absolute;/);
  assert.match(cityBackRule, /position: absolute;/);
  assert.match(cityBackRule, /width: 38px;/);
  assert.match(stylesSource, /\.armory-shop__selected-card\s*\{[\s\S]*var\(--ui-panel-wood-texture\)/);
});

test("armory confirm strip uses an armor icon and highlights stat gains", () => {
  const citySelectedCardRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__selected-card\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const citySelectedMetaRule = stylesSource.match(/\.armory-shop__selected-meta\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.equal(armoryShopSource.includes("DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL"), true);
  assert.match(armoryShopSource, /createSelectedMeta\([\s\S]*displayName[\s\S]*"armor"[\s\S]*DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL/);
  assert.equal(armoryShopSource.includes("armory-shop__selected-stat-value--positive"), true);
  assert.match(citySelectedCardRule, /grid-template-columns: 40px minmax\(0, 1fr\) minmax\(58px, auto\);/);
  assert.match(citySelectedMetaRule, /"name name name"/);
  assert.match(citySelectedMetaRule, /"rarity stat price"/);
  assert.equal(stylesSource.includes(".armory-shop__selected-stat-icon"), true);
  assert.equal(stylesSource.includes(".armory-shop__selected-stat-value--positive"), true);
});
