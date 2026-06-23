import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const armoryShopSource = readFileSync(resolve(currentDir, "../src/armoryShopUi.ts"), "utf8");
const weaponShopSource = readFileSync(resolve(currentDir, "../src/weaponShopUi.ts"), "utf8");
const magicShopSource = readFileSync(resolve(currentDir, "../src/magicShopUi.ts"), "utf8");
const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const shopItemIconsSource = readFileSync(resolve(currentDir, "../src/shopItemIcons.ts"), "utf8");
const shopPresentationSource = readFileSync(resolve(currentDir, "../src/shopPresentation.ts"), "utf8");
const uiLayoutTuningSource = readFileSync(resolve(currentDir, "../src/uiLayoutTuning.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

function getFunctionSource(source, functionName) {
  const signature = `function ${functionName}`;
  const start = source.indexOf(signature);

  assert.notEqual(start, -1);

  const bodyStart = source.indexOf("{", start);
  let depth = 0;

  assert.notEqual(bodyStart, -1);

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`Could not find end of ${functionName}`);
}

function assertInOrder(source, ...needles) {
  let offset = 0;

  needles.forEach((needle) => {
    const index = source.indexOf(needle, offset);

    assert.notEqual(index, -1, `Expected to find ${needle}`);
    offset = index + needle.length;
  });
}

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

test("armory shop sorts products by rarity, equipment set, slot, armor, price, then name", () => {
  assert.match(
    armoryShopSource,
    /const rarityDifference[\s\S]*if \(rarityDifference !== 0\)[\s\S]*const setDifference[\s\S]*if \(setDifference !== 0\)[\s\S]*const slotDifference[\s\S]*if \(slotDifference !== 0\)[\s\S]*const armorDifference[\s\S]*if \(armorDifference !== 0\)[\s\S]*const priceDifference[\s\S]*if \(priceDifference !== 0\)[\s\S]*return left\.name\.localeCompare\(right\.name\);/,
  );
  assert.equal(armoryShopSource.includes("getArmoryProductSetOrder"), true);
  assert.equal(armoryShopSource.includes("equipmentSet?.rank"), true);
  assert.equal(armoryShopSource.includes("shield: 5"), true);
  assert.equal(armoryShopSource.includes('products: getGeneratedArmoryProductsForSlots(["shield"])'), true);
  assert.equal(armoryShopSource.includes('{ id: "shield", name: "Shield", shortLabel: "SHIELD" }'), true);
  assert.equal(armoryShopSource.includes('shield: "shield"'), true);
  assert.equal(armoryShopSource.includes('shield: "arms"'), false);
});

test("armory shop renders the catalog as a flat sorted grid", () => {
  assert.equal(armoryShopSource.includes("interface ArmoryProductSetRow"), false);
  assert.equal(armoryShopSource.includes("getArmoryProductSetRows"), false);
  assert.equal(armoryShopSource.includes("shouldRenderArmoryProductSetRows"), false);
  assert.equal(armoryShopSource.includes('content.classList.toggle("armory-shop__content--set-rows"'), false);
  assert.equal(armoryShopSource.includes('element.className = "armory-shop__set-row";'), false);
  assert.equal(armoryShopSource.includes("--armory-shop-set-row-columns"), false);
  assert.equal(armoryShopSource.includes("createTrackedProductButton(product, hero)"), true);
  assert.equal(stylesSource.includes(".armory-shop__content--set-rows"), false);
  assert.equal(stylesSource.includes(".armory-shop__set-row"), false);
});

test("armory shop header exposes set and parts filters in one catalog toolbar", () => {
  const cityArmoryHeaderRule = stylesSource.match(/\.armory-shop--city-mode:not\(\.weapon-shop\) \.armory-shop__header\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityArmoryTitleRule =
    stylesSource.match(
      /\.armory-shop--city-mode:not\(\.weapon-shop\) \.armory-shop__title(?:,\s*\.weapon-shop\.armory-shop--city-mode \.armory-shop__title)?\s*\{[\s\S]*?\}/,
    )?.[0] ?? "";

  assert.equal(armoryShopSource.includes("getArmoryEquipmentSetOptions"), true);
  assert.equal(armoryShopSource.includes("getSortedArmoryCatalogProducts"), true);
  assert.equal(armoryShopSource.includes("filterArmoryProductsByEquipmentSet(sortedProducts, selectedEquipmentSetId)"), true);
  assert.equal(armoryShopSource.includes("filterArmoryProductsByParts(setFilteredProducts, selectedPartFilterIds)"), true);
  assert.equal(armoryShopSource.includes("selectedEquipmentSetId = setFilter.value || undefined;"), true);
  assert.equal(armoryShopSource.includes("selectedPartFilterIds = getDefaultArmoryPartFilterIds();"), true);
  assert.equal(armoryShopSource.includes("if (partIds.size === 0)"), true);
  assert.equal(armoryShopSource.includes("return new Set();"), true);
  assert.equal(armoryShopSource.includes("selectedPartFilterIds.delete(part.id);"), true);
  assert.equal(armoryShopSource.includes("selectedPartFilterIds.size > 1"), false);
  assert.equal(armoryShopSource.includes("selectedPartFilterIds.size === 0 || selectedPartFilterIds.size === ARMORY_PART_FILTERS.length"), true);
  assert.equal(armoryShopSource.includes("getAvailableArmoryEquipmentSetOptions(hero, allEquipmentSetOptions)"), true);
  assert.equal(armoryShopSource.includes("isArmoryEquipmentSetOptionAvailable(hero, option)"), true);
  assert.equal(armoryShopSource.includes("!isShopProductSealed(hero, product.itemIds, product.rarity)"), true);
  assert.equal(armoryShopSource.includes("renderEquipmentSetFilterOptions(availableEquipmentSetOptions)"), true);
  assert.equal(armoryShopSource.includes("updateEquipmentSetFilterRarity(selectedEquipmentSetOption?.rarity)"), true);
  assert.equal(armoryShopSource.includes('option.textContent = setOption?.info.name ?? "All sets";'), true);
  assert.equal(armoryShopSource.includes("armory-shop__set-filter--rarity-${rarity}"), true);
  assert.equal(armoryShopSource.includes("armory-shop__set-filter-option--rarity-${setOption.rarity}"), true);
  assert.equal(armoryShopSource.includes("header.append(title, setFilter, partsFilter, filterPlaceholder, selected, headerMeta);"), true);
  assert.equal(armoryShopSource.includes("filterPlaceholder.disabled = true;"), true);
  assert.equal(armoryShopSource.includes('input.type = "checkbox";'), true);
  assert.equal(stylesSource.includes(".armory-shop__set-filter"), true);
  assert.equal(stylesSource.includes(".armory-shop__set-filter--rarity-rare"), true);
  assert.equal(stylesSource.includes(".armory-shop__set-filter-option--rarity-rare"), true);
  assert.equal(stylesSource.includes(".armory-shop__parts-filter"), true);
  assert.match(stylesSource, /\.armory-shop--city-mode:not\(\.weapon-shop\) \.armory-shop__parts-panel\s*\{[\s\S]*top: auto;[\s\S]*bottom: calc\(100% \+ 5px\);[\s\S]*\}/);
  assert.equal(stylesSource.includes(".armory-shop__toolbar-button"), true);
  assert.equal(stylesSource.includes(".armory-shop--city-mode:not(.weapon-shop) .armory-shop__menu"), true);
  assert.match(cityArmoryHeaderRule, /grid-template-columns: minmax\(0, 1fr\) minmax\(82px, 0\.78fr\) 31px minmax\(58px, auto\);/);
  assert.match(cityArmoryTitleRule, /display: none;/);
});

test("weapon shop sorts products by rarity, damage, price, then name", () => {
  const rarityOrderIndex = weaponShopSource.indexOf("const WEAPON_RARITY_SORT_ORDER");
  const categoriesIndex = weaponShopSource.indexOf("const WEAPON_CATEGORIES");

  assert.equal(weaponShopSource.includes(".sort(compareWeaponProducts);"), true);
  assert.equal(rarityOrderIndex >= 0, true);
  assert.equal(categoriesIndex >= 0, true);
  assert.equal(rarityOrderIndex < categoriesIndex, true);
  assert.match(
    weaponShopSource,
    /const rarityDifference[\s\S]*if \(rarityDifference !== 0\)[\s\S]*const damageDifference[\s\S]*if \(damageDifference !== 0\)[\s\S]*const priceDifference[\s\S]*if \(priceDifference !== 0\)[\s\S]*return left\.name\.localeCompare\(right\.name\);/,
  );
});

test("armory paired product cards prefer front equipment icons", () => {
  assert.equal(shopItemIconsSource.includes("HERO_ITEM_CATALOG"), true);
  assert.equal(shopItemIconsSource.includes("getRepresentativeShopItemIconId(itemIds)"), true);
  assert.equal(shopItemIconsSource.includes('slot?.startsWith("front")'), true);
  assert.equal(shopItemIconsSource.includes("return frontItemId ?? [...itemIds].reverse().find"), true);
});

test("magic shop exposes scroll icons as compressed runtime webp assets", () => {
  assert.equal(magicShopSource.includes("HERO_POISON_SCROLL_ITEM_ID"), true);
  assert.equal(magicShopSource.includes('id: "poison_scroll"'), true);
  assert.equal(magicShopSource.includes("Poisons the enemy for 2 turns"), true);
  assert.equal(shopItemIconsSource.includes("HERO_POISON_SCROLL_ITEM_ID"), true);
  assert.equal(shopItemIconsSource.includes('"scroll-poison-01"'), true);

  [
    "scroll-crack-armor-01",
    "scroll-double-strike-01",
    "scroll-fireball-01",
    "scroll-poison-01",
    "scroll-precise-strike-01",
    "scroll-ward-01",
  ].forEach((assetKey) => {
    assert.equal(existsSync(resolve(currentDir, `../src/assets/shop-icons/${assetKey}.webp`)), true);
    assert.equal(existsSync(resolve(currentDir, `../src/assets/shop-icons/${assetKey}.png`)), false);
  });

  [
    "magic-shop-title-frame",
    "magic-shop-selected-card-frame",
  ].forEach((assetKey) => {
    assert.equal(existsSync(resolve(currentDir, `../src/assets/ui/magic-shop/${assetKey}.webp`)), true);
    assert.equal(existsSync(resolve(currentDir, `../art-source/png/assets/ui/magic-shop/${assetKey}.png`)), true);
  });
});

test("magic shop starts from a home menu and keeps scroll preview plus weapon enchantment modes", () => {
  assert.equal(magicShopSource.includes('type MagicShopMode = "home" | "scrolls" | "weaponEnchantment";'), true);
  assert.equal(magicShopSource.includes('let mode: MagicShopMode = "home";'), true);
  assert.equal(magicShopSource.includes("let selectedProductId = MAGIC_PRODUCTS[0]?.id ?? \"\";"), true);
  assert.equal(magicShopSource.includes('preview.className = "magic-shop__preview";'), true);
  assert.equal(magicShopSource.includes('home.className = "magic-shop__home";'), true);
  assert.equal(magicShopSource.includes('label: "Scrolls"'), true);
  assert.equal(magicShopSource.includes('label: "Weapon Enchantment"'), true);
  assert.equal(magicShopSource.includes('productList.className = "magic-shop__list";'), true);
  assert.equal(magicShopSource.includes('wallet.className = "magic-shop__wallet";'), true);
  assert.equal(magicShopSource.includes("CITY_MAGIC_SHOP_BACKGROUND_ASSET_URL"), true);
  assert.equal(magicShopSource.includes("MAGIC_SHOP_TITLE_FRAME_ASSET_URL"), true);
  assert.equal(magicShopSource.includes("MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL"), true);
  assert.equal(magicShopSource.includes("applyUiLayoutTuning"), true);
  assert.equal(magicShopSource.includes('shop.style.setProperty("--magic-shop-background-image"'), true);
  assert.equal(magicShopSource.includes('shop.style.setProperty("--magic-shop-title-frame-image"'), true);
  assert.equal(magicShopSource.includes('shop.style.setProperty("--magic-shop-selected-card-frame-image"'), true);
  assert.equal(magicShopSource.includes('displayName: "Armor Crack"'), true);
  assert.equal(magicShopSource.includes('displayName: "True Strike"'), true);
  assert.equal(magicShopSource.includes('displayName: "Double Hit"'), true);
  assert.equal(magicShopSource.includes("listEffect"), false);
  assert.equal(magicShopSource.includes('effect.className = "magic-shop__list-effect";'), false);
  assert.equal(magicShopSource.includes("text.append(name, effect);"), false);
  assert.equal(magicShopSource.includes("text.append(name);"), true);
  assert.equal(magicShopSource.includes("wallet.append(scrollCapacity, gold);"), true);
  assert.equal(magicShopSource.includes("content.append(home, productList, wallet);"), true);
  assert.equal(magicShopSource.includes("content.append(productList, wallet);"), false);
  assert.equal(magicShopSource.includes("panel.append(preview, menu, back);"), true);
  assert.equal(magicShopSource.includes("content.append(preview, productList, wallet);"), false);
  assert.equal(magicShopSource.includes('root.classList.add("city-menu--magic-shop-open");'), true);
  assert.equal(magicShopSource.includes('root.classList.remove("city-menu--magic-shop-open");'), true);
  assert.equal(magicShopSource.includes('scrollCapacity.className = "magic-shop__scroll-capacity";'), true);
  assert.equal(magicShopSource.includes("Math.min(getHeroScrollQuantity(hero), HERO_SCROLL_MAX_QUANTITY)"), true);
  assert.equal(magicShopSource.includes("setTextContentIfChanged(scrollCapacityAmount, `${scrollCount}/${HERO_SCROLL_MAX_QUANTITY}`);"), true);
  assert.equal(magicShopSource.includes('scrollCapacity.hidden = mode !== "scrolls";'), true);
  assert.equal(magicShopSource.includes("const previewElements = createMagicProductPreview();"), true);
  assert.equal(magicShopSource.includes("const productListItems = MAGIC_PRODUCTS.map((product) => [product.id, createMagicProductListItem(product)] as const);"), true);
  assert.equal(magicShopSource.includes("preview.append(previewElements.card);"), true);
  assert.equal(magicShopSource.includes("productList.append(...productListItems.map(([, elements]) => elements.item));"), true);
  assert.equal(magicShopSource.includes("preview.replaceChildren"), false);
  assert.equal(magicShopSource.includes("productList.replaceChildren"), false);
  assert.equal(magicShopSource.includes("armory-shop__product-consumable-badges"), false);
  assert.equal(magicShopSource.includes("quantityBadge.textContent"), false);
  assert.equal(magicShopSource.includes('title.className = "magic-shop__preview-title";'), true);
  assert.equal(magicShopSource.includes("title.append(name, rarityNode);"), true);
  assert.equal(magicShopSource.includes("body.append(name, rarityNode, effect);"), false);
  assert.equal(magicShopSource.includes("card.append(title, icon, effect, footer);"), true);
  assert.equal(magicShopSource.includes("function refreshHeroState(hero: HeroState): void"), true);
  assert.equal(magicShopSource.includes("function refreshSelectedProduct(hero: HeroState): void"), true);
  assert.equal(magicShopSource.includes("function refreshWeaponEnchantment(hero: HeroState): void"), true);
  assert.equal(magicShopSource.includes("function refreshProductList(hero: HeroState): void"), true);
  assert.equal(magicShopSource.includes("function selectMagicProduct(productId: string): void"), true);
  assert.equal(magicShopSource.includes("function createMagicShopHomeAction"), true);
  assert.equal(magicShopSource.includes("options.onEnchantWeapon();"), true);
  assert.equal(magicShopSource.includes("HERO_WATER_WEAPON_ENCHANT_PRICE"), true);
  assert.equal(magicShopSource.includes("getActiveEnchantableHeroWeaponItemId(hero)"), true);
  assert.equal(magicShopSource.includes("canEnchantHeroActiveWeaponWithWater(hero)"), true);
  assert.equal(mainSource.includes("onEnchantWeapon: handleMagicWeaponEnchant"), true);
  assert.equal(mainSource.includes("enchantHeroActiveWeaponWithWater(hero)"), true);
  assert.equal(mainSource.includes("setPlayerWeaponEnchantments(hero.weaponEnchantments)"), true);

  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode::after\s*\{[\s\S]*content: "MAGIC SHOP";[\s\S]*\}/);
  assert.equal(assetsSource.includes('MAGIC_SHOP_TITLE_FRAME_ASSET_URL = new URL("./assets/ui/magic-shop/magic-shop-title-frame.webp", import.meta.url).href'), true);
  assert.equal(assetsSource.includes('MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL = new URL("./assets/ui/magic-shop/magic-shop-selected-card-frame.webp", import.meta.url).href'), true);
  assert.equal(magicShopSource.includes('price.className = "magic-shop__preview-price"'), false);
  assert.equal(magicShopSource.includes("footer.append(price, buyButton)"), false);
  assert.equal(magicShopSource.includes("footer.append(buyButton)"), true);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode::after\s*\{[\s\S]*var\(--magic-shop-title-frame-image\)[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode::before\s*\{[\s\S]*content: none;[\s\S]*\}/);
  assert.equal(stylesSource.includes(".magic-shop__preview-card"), true);
  assert.match(stylesSource, /\.magic-shop__preview-card::before\s*\{[\s\S]*var\(--magic-shop-selected-card-frame-image\)[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop__preview-card::after\s*\{[\s\S]*content: none;[\s\S]*\}/);
  assert.equal(stylesSource.includes(".magic-shop__list-item"), true);
  assert.equal(stylesSource.includes(".magic-shop__list-effect"), false);
  assert.equal(stylesSource.includes(".magic-shop__list-item--selected::before"), true);
  assert.match(stylesSource, /\.magic-shop__list\s*\{[\s\S]*gap: 0;[\s\S]*align-self: end;[\s\S]*border: 1px solid rgba\(255, 211, 132, 0\.3\);/);
  assert.match(stylesSource, /\.magic-shop__list\s*\{[\s\S]*max-height: calc\(var\(--magic-shop-list-row-height\) \* var\(--magic-shop-list-visible-items\) \+ 16px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-list-visible-items: var\(--ui-magic-shop-list-visible-rows, 5\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-list-width: min\(var\(--ui-magic-shop-list-width, 390px\), calc\(100% - 54px\)\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-text-offset-x: var\(--ui-magic-shop-title-text-offset-x, 0px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-text-offset-y: var\(--ui-magic-shop-title-text-offset-y, 0px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-text-font-size: var\(--ui-magic-shop-title-text-font-size, 16px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-preview-gap: var\(--ui-magic-shop-title-preview-gap, 10px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-top: calc\(var\(--magic-shop-title-actual-top\) \+ var\(--magic-shop-title-height\) \+ var\(--magic-shop-title-preview-gap\)\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-width: min\(var\(--ui-magic-shop-preview-width, 244px\), calc\(100% - 42px\)\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-title-offset-y: var\(--ui-magic-shop-preview-title-offset-y, 0px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-effect-offset-y: var\(--ui-magic-shop-preview-effect-offset-y, 0px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-effect-line-height: var\(--ui-magic-shop-preview-effect-line-height, 1\.15\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-button-scale: var\(--ui-magic-shop-button-scale, 1\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__panel::after\s*\{[\s\S]*content: none;[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop__list-item\s*\{[\s\S]*border: 0;[\s\S]*box-shadow: none;/);
  assert.match(stylesSource, /\.magic-shop__list-icon\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;/);
  assert.match(stylesSource, /\.magic-shop__list-name\s*\{[\s\S]*font-size: clamp\(0\.75rem, 2\.7vw, 0\.86rem\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__tray\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-products-height: clamp\(248px, var\(--ui-magic-shop-compact-products-height, 266px\), 296px\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-actual-top: var\(--magic-shop-title-top\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-title-preview-gap: var\(--ui-magic-shop-compact-title-preview-gap, 19px\);/);
  assert.match(stylesSource, /body\.debug-mode-ui \.magic-shop\.armory-shop--city-mode\[data-ui-layout-viewport="compact"\]\s*\{[\s\S]*--shop-city-products-height: clamp\(248px, var\(--ui-magic-shop-compact-products-height, 266px\), 296px\);/);
  assert.match(stylesSource, /body\.debug-mode-ui \.magic-shop\.armory-shop--city-mode\[data-ui-layout-viewport="compact"\]\s*\{[\s\S]*--magic-shop-title-text-font-size: var\(--ui-magic-shop-compact-title-text-font-size, 14\.5px\);/);
  assert.match(stylesSource, /body\.debug-mode-ui \.magic-shop\.armory-shop--city-mode\[data-ui-layout-viewport="compact"\]::after\s*\{[\s\S]*top: var\(--magic-shop-title-top\);[\s\S]*right: calc\(var\(--shop-frame-side-width\) \+ 50px\);[\s\S]*left: calc\(var\(--shop-frame-side-width\) \+ 50px\);/);
  assert.match(stylesSource, /body\.debug-mode-ui \.magic-shop\.armory-shop--city-mode\[data-ui-layout-viewport="compact"\] \.magic-shop__preview\s*\{[\s\S]*right: 14px;[\s\S]*left: 14px;/);
  assert.match(stylesSource, /body\.debug-mode-ui \.magic-shop\.armory-shop--city-mode\[data-ui-layout-viewport="compact"\] \.magic-shop__list-item\s*\{[\s\S]*grid-template-columns: 34px minmax\(0, 1fr\) minmax\(calc\(var\(--magic-shop-list-price-min-width\) \* var\(--magic-shop-button-scale\)\), auto\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode::after\s*\{[\s\S]*top: var\(--magic-shop-title-top\);[\s\S]*right: calc\(var\(--shop-frame-side-width\) \+ 50px\);[\s\S]*left: calc\(var\(--shop-frame-side-width\) \+ 50px\);[\s\S]*min-width: 0;[\s\S]*transform: none;/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-list-row-height: var\(--ui-magic-shop-compact-list-row-height, 38px\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--magic-shop-preview-width: min\(var\(--ui-magic-shop-compact-preview-width, 210px\), calc\(100% - 36px\)\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop__preview-card\s*\{[\s\S]*width: var\(--magic-shop-preview-width\);/);
  assert.match(stylesSource, /@media \(max-width: 460px\), \(max-height: 760px\)\s*\{[\s\S]*\.magic-shop__list-item\s*\{[\s\S]*min-height: 38px;/);
  assert.equal(stylesSource.includes(".magic-shop__wallet"), true);
  assert.equal(stylesSource.includes(".magic-shop__scroll-capacity"), true);
  assert.match(stylesSource, /\.city-menu--magic-shop-open \.city-menu__hero\s*\{[\s\S]*opacity: 0;[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-header-height: 0px;[\s\S]*--shop-city-products-height: clamp\(280px, var\(--ui-magic-shop-products-height, 306px\), 338px\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__panel::before\s*\{[\s\S]*inset: 0;[\s\S]*var\(--magic-shop-background-image\);[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__tray\s*\{[\s\S]*grid-template-rows: var\(--shop-city-products-height\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__header\s*\{[\s\S]*display: none;[\s\S]*\}/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode::after\s*\{[\s\S]*padding:\s*[\s\S]*max\(0px, calc\(var\(--magic-shop-title-padding-top\) \+ var\(--magic-shop-title-text-offset-y\)\)\)[\s\S]*max\(0px, calc\(var\(--magic-shop-title-padding-right\) - var\(--magic-shop-title-text-offset-x\)\)\)[\s\S]*max\(0px, calc\(var\(--magic-shop-title-padding-bottom\) - var\(--magic-shop-title-text-offset-y\)\)\)[\s\S]*max\(0px, calc\(var\(--magic-shop-title-padding-left\) \+ var\(--magic-shop-title-text-offset-x\)\)\);[\s\S]*font-size: var\(--magic-shop-title-text-font-size\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.magic-shop__preview\s*\{[\s\S]*position: absolute;[\s\S]*bottom: calc\(var\(--shop-city-tray-height\)/);
  assert.match(stylesSource, /\.magic-shop__preview-card\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*grid-template-areas:[\s\S]*"title"[\s\S]*"icon"[\s\S]*"effect"[\s\S]*"action";[\s\S]*justify-items: center;/);
  assert.match(stylesSource, /\.magic-shop__preview-title\s*\{[\s\S]*grid-area: title;[\s\S]*gap: var\(--magic-shop-preview-title-gap\);[\s\S]*transform: translateY\(var\(--magic-shop-preview-title-offset-y\)\);/);
  assert.match(stylesSource, /\.magic-shop__preview-icon\s*\{[\s\S]*grid-area: icon;/);
  assert.match(stylesSource, /\.magic-shop__preview-name\s*\{[\s\S]*font-size: var\(--magic-shop-preview-name-font-size\);/);
  assert.match(stylesSource, /\.magic-shop__preview-rarity\s*\{[\s\S]*font-size: var\(--magic-shop-preview-rarity-font-size\);/);
  assert.match(stylesSource, /\.magic-shop__preview-effect\s*\{[\s\S]*grid-area: effect;[\s\S]*align-self: end;[\s\S]*max-width: var\(--magic-shop-preview-effect-width\);[\s\S]*font-size: var\(--magic-shop-preview-effect-font-size\);[\s\S]*line-height: var\(--magic-shop-preview-effect-line-height\);[\s\S]*transform: translateY\(var\(--magic-shop-preview-effect-offset-y\)\);/);
  assert.match(stylesSource, /\.magic-shop__preview-footer\s*\{[\s\S]*grid-area: action;/);
  assert.match(stylesSource, /\.magic-shop__buy\s*\{[\s\S]*min-height: calc\(var\(--magic-shop-buy-height\) \* var\(--magic-shop-button-scale\)\);/);
  assert.match(stylesSource, /\.armory-shop__selected-buy\s*\{[\s\S]*--shop-selected-buy-press-y: 0px;[\s\S]*transform: translateY\(var\(--shop-selected-buy-press-y\)\);/);
  assert.match(stylesSource, /\.armory-shop__selected-buy:active:not\(:disabled\)\s*\{[\s\S]*--shop-selected-buy-press-y: 1px;[\s\S]*box-shadow:/);
  assert.match(stylesSource, /\.magic-shop__buy\s*\{[\s\S]*calc\(var\(--magic-shop-buy-offset-y\) \* var\(--magic-shop-button-scale\) \+ var\(--shop-selected-buy-press-y, 0px\)\)/);
  assert.match(stylesSource, /\.magic-shop__list-price\s*\{[\s\S]*font-size: calc\(var\(--magic-shop-list-price-font-size\) \* var\(--magic-shop-button-scale\)\);/);
  assert.match(stylesSource, /\.magic-shop\.armory-shop--city-mode \.armory-shop__content--products\s*\{[\s\S]*grid-template-rows: minmax\(0, 1fr\) auto;/);
  assert.equal(uiLayoutTuningSource.includes('UI_LAYOUT_TUNING_STORAGE_KEY = "dust-arena-ui-layout-tuning"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "magicShop"'), true);
  assert.equal(uiLayoutTuningSource.includes('rootSelector: ".magic-shop.armory-shop--city-mode"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "preview"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "list"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "previewTitle"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "previewEffect"'), true);
  assert.equal(uiLayoutTuningSource.includes('id: "previewText"'), false);
  assert.equal(uiLayoutTuningSource.includes('id: "buttons"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("textX", "Text X"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("textY", "Text Y"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("textSize", "Text size"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("titleGap", "Gap under title"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("offsetY", "Title Y"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("offsetY", "Effect Y"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("nameFont", "Name font"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("effectLineHeight", "Effect line"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("scale", "All scale"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("buyOffsetX", "Buy X"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("buyOffsetY", "Buy Y"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("previewPriceWidth", "Preview price W"'), false);
  assert.equal(uiLayoutTuningSource.includes('createControl("buyHeight", "Buy H"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("listCoinSize", "List coin"'), true);
  assert.equal(uiLayoutTuningSource.includes('createControl("height", "Height", 22, 52'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.preview.width.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.preview.titleGap.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.title.textX.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.title.textY.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.title.textSize.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.previewTitle.offsetY.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.previewTitle.nameFont.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.previewEffect.offsetY.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.previewEffect.effectLineHeight.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.previewText.offsetY.compact"'), false);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.scale.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.buyHeight.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.buyOffsetX.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.buyOffsetY.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.previewPriceWidth.compact"'), false);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.buttons.listCoinSize.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.wallet.height.compact"'), true);
  assert.equal(uiLayoutTuningSource.includes('"magicShop.preview.top.compact"'), false);
  assert.equal(uiLayoutTuningSource.includes("target.style.setProperty(control.cssVars[viewport]"), true);
  assert.equal(uiLayoutTuningSource.includes("target.style.setProperty("), true);
  assert.equal(uiLayoutTuningSource.includes("control.runtimeCssVar"), true);
  assert.equal(uiLayoutTuningSource.includes("target.style.removeProperty(control.runtimeCssVar)"), true);
  assert.equal(uiLayoutTuningSource.includes("document.body.classList.contains(\"debug-mode-ui\")"), false);
});

test("shop product display names hide technical variants and rename shoulder guards", () => {
  assert.equal(shopPresentationSource.includes("export function getShopProductDisplayName(productName: string): string"), true);
  assert.equal(shopPresentationSource.includes('.replace(/\\bshoulderguards?\\b/giu, "Shoulders")'), true);
  assert.equal(shopPresentationSource.includes(".replace(/\\s+01\\b/gu, \"\")"), true);
  assert.equal(armoryShopSource.includes('pluralLabel: "Shoulders"'), true);

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("getShopProductDisplayName"), true);
    assert.equal(source.includes("const displayName = getShopProductDisplayName(product.name);"), true);
    assert.equal(source.includes("button.title = displayName;") || source.includes(": displayName;"), true);
    assert.equal(source.includes("button.title = product.name;"), false);
  });

  assert.equal(armoryShopSource.includes("meta.name.textContent = productName;"), true);
  assert.equal(weaponShopSource.includes("createSelectedMeta(displayName"), true);
});

test("armory shop seals boss-locked rarity tiers before purchase", () => {
  assert.equal(shopPresentationSource.includes("const shopRarityUnlockBossTier"), true);
  assert.equal(shopPresentationSource.includes("uncommon: 1"), true);
  assert.equal(shopPresentationSource.includes("rare: 2"), true);
  assert.equal(shopPresentationSource.includes("getArenaBossesForTier(unlockBossTier)"), true);
  assert.equal(shopPresentationSource.includes("hero.defeatedArenaBossIds ?? []"), true);
  assert.equal(shopPresentationSource.includes("hasHeroUnlockedShopRarity(hero, rarity)"), true);

  assert.equal(armoryShopSource.includes("getArmoryProductCardState(hero, product)"), true);
  assert.equal(armoryShopSource.includes('armory-shop__option--sealed'), true);
  assert.equal(armoryShopSource.includes('ribbon.textContent = "SEALED";'), true);
  assert.equal(armoryShopSource.includes('button.disabled = cardState === "sealed" || cardState === "locked";'), true);
  assert.equal(armoryShopSource.includes('return isShopProductSealed(hero, product.itemIds, product.rarity) ? "sealed" : "buy";'), true);
  assert.equal(armoryShopSource.includes("isShopProductSealed(hero, product.itemIds, product.rarity)"), true);

  assert.equal(mainSource.includes("isSealedEquipmentPurchase"), true);
  assert.equal(mainSource.includes("function isEquipmentShopProduct(product: CityShopProduct): product is ArmoryProduct | WeaponProduct"), true);
  assert.equal(mainSource.includes("!areHeroItemsOwned(hero, product.itemIds)"), true);
  assert.equal(mainSource.includes("isShopProductSealed(hero, product.itemIds, product.rarity)"), true);
});

test("armory shop locked products are dimmed and show level requirement ribbons", () => {
  assert.equal(shopPresentationSource.includes("export function getShopProductRequirementBadge"), true);
  assert.equal(armoryShopSource.includes("getShopProductRequirementBadge"), true);
  assert.equal(armoryShopSource.includes("getShopProductRequirementDescription"), true);
  assert.equal(armoryShopSource.includes('button.classList.toggle("armory-shop__option--locked", cardState === "locked");'), true);
  assert.equal(
    armoryShopSource.includes('button.classList.toggle("armory-shop__option--sealed", cardState === "sealed" || cardState === "locked");'),
    true,
  );
  assert.equal(armoryShopSource.includes('button.disabled = cardState === "sealed" || cardState === "locked";'), true);
  assert.match(armoryShopSource, /if \(cardState === "locked" && requirementBadge\) \{[\s\S]*button\.append\(createRequirementRibbon\(requirementBadge\)\);[\s\S]*\}/);
  assert.equal(armoryShopSource.includes('const requirementKey = requirement.kind === "level" ? "level" : requirement.attribute;'), true);
  assert.equal(armoryShopSource.includes('icon.className = `armory-shop__requirement-icon armory-shop__requirement-icon--${requirementKey}`;'), true);
  assert.equal(armoryShopSource.includes('icon.textContent = requirement.kind === "level" ? "LVL" : "";'), true);
  assert.equal(armoryShopSource.includes("amount.textContent = String(requirement.required);"), true);
  assert.equal(armoryShopSource.includes('actionState === "equipped" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked"'), true);
});

test("city shops report their bottom menu position for hero centering", () => {
  [armoryShopSource, weaponShopSource, magicShopSource].forEach((source) => {
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
  assert.equal(mainSource.match(/onLayoutChange: syncCityShopLayout/g)?.length, 3);
});

test("city armory and weapon shops omit the screen frame and keep compact title plaques", () => {
  assert.equal(stylesSource.includes(".armory-shop--city-mode::before"), true);
  assert.equal(stylesSource.includes(".armory-shop--city-mode::after"), true);
  assert.equal(stylesSource.includes('content: "ARMORY";'), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode::after"), true);
  assert.equal(stylesSource.includes('content: "WEAPONSMITH";'), true);
  assert.equal(stylesSource.includes("--shop-frame-side-width: 7px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-top-height: 16px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-bottom-height: 6px;"), true);
  assert.match(stylesSource, /\.armory-shop--city-mode:not\(\.magic-shop\)\s*\{[\s\S]*--shop-frame-side-width: 0px;[\s\S]*--shop-frame-top-height: 0px;[\s\S]*--shop-frame-bottom-height: 0px;[\s\S]*\}/);
  assert.equal(stylesSource.includes("--shop-frame-side-width: 0px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-top-height: 0px;"), true);
  assert.equal(stylesSource.includes("--shop-frame-bottom-height: 0px;"), true);
  assert.match(stylesSource, /\.armory-shop--city-mode:not\(\.magic-shop\)::before\s*\{[\s\S]*content: none;[\s\S]*\}/);
  assert.match(stylesSource, /\.armory-shop--city-mode::after\s*\{[\s\S]*transform: translateX\(-50%\);[\s\S]*\}/);
});

test("weapon shop uses upward custom rarity and checkbox weapon type filters", () => {
  assert.equal(armoryShopSource.includes("createCategoryButton"), false);
  assert.equal(armoryShopSource.includes("armory-shop__category-button"), false);
  assert.equal(weaponShopSource.includes('const rarityFilter = document.createElement("details");'), true);
  assert.equal(weaponShopSource.includes('rarityFilter.className = "armory-shop__parts-filter weapon-shop__rarity-filter";'), true);
  assert.equal(weaponShopSource.includes('const typeFilter = document.createElement("details");'), true);
  assert.equal(weaponShopSource.includes('typeFilter.className = "armory-shop__parts-filter weapon-shop__type-filter";'), true);
  assert.equal(weaponShopSource.includes('rarityFilter.setAttribute("aria-label", "Weapon rarity");'), true);
  assert.equal(weaponShopSource.includes('typeFilter.setAttribute("aria-label", "Weapon types");'), true);
  assert.equal(weaponShopSource.includes("selectedWeaponTypeIds = getDefaultWeaponTypeFilterIds();"), true);
  assert.equal(weaponShopSource.includes("const selectedCategories = getSelectedWeaponCategories(selectedWeaponTypeIds);"), true);
  assert.equal(weaponShopSource.includes("const typeFilteredProducts = getWeaponProductsForCategories(selectedCategories);"), true);
  assert.equal(weaponShopSource.includes("filterWeaponProductsByRarity(typeFilteredProducts, selectedRarity)"), true);
  assert.equal(weaponShopSource.includes("renderRarityFilterOptions(availableRarities);"), true);
  assert.equal(weaponShopSource.includes("rarityFilterPanel.replaceChildren(createRarityFilterOption(), ...availableRarities.map(createRarityFilterOption));"), true);
  assert.equal(weaponShopSource.includes("rarityFilter.open = false;"), true);
  assert.equal(weaponShopSource.includes("rarityFilterInputs.set(optionId, input);"), true);
  assert.equal(weaponShopSource.includes("updateWeaponTypeFilterControls();"), true);
  assert.equal(weaponShopSource.includes("typeFilterPanel.append(createWeaponTypeFilterOption());"), true);
  assert.equal(weaponShopSource.includes("WEAPON_CATEGORIES.forEach((category) => typeFilterPanel.append(createWeaponTypeFilterOption(category)));"), true);
  assert.equal(weaponShopSource.includes('input.type = "checkbox";'), true);
  assert.equal(weaponShopSource.includes('text.textContent = category?.name ?? "All weapons";'), true);
  assert.equal(weaponShopSource.includes("typeFilterInputs.set(optionId, input);"), true);
  assert.equal(weaponShopSource.includes("getWeaponTypeFilterSummaryText"), true);
  assert.equal(weaponShopSource.includes('id: "maces"'), true);
  assert.equal(weaponShopSource.includes('name: "Maces"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("maces")'), true);
  assert.equal(weaponShopSource.includes('id: "spears"'), true);
  assert.equal(weaponShopSource.includes('name: "Spears"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("spears")'), true);
  assert.equal(weaponShopSource.includes('id: "shurikens"'), true);
  assert.equal(weaponShopSource.includes('name: "Shurikens"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("shurikens")'), true);
  assert.equal(weaponShopSource.includes('range: "ranged"'), false);
  assert.equal(weaponShopSource.includes("createCategoryButton"), false);
  assert.equal(weaponShopSource.includes("armory-shop__category-button"), false);
  assert.equal(weaponShopSource.includes("typeFilter.value"), false);
  assert.equal(weaponShopSource.includes("typeFilter.append(...WEAPON_CATEGORIES.map(createWeaponTypeFilterOption));"), false);
  assert.equal(weaponShopSource.includes("rarityFilter.value"), false);
  assert.equal(armoryShopSource.includes("createCategoryLabel"), false);
  assert.equal(armoryShopSource.includes("armory-shop__category-label"), false);
  assert.equal(stylesSource.includes("armory-shop__category-label"), false);
  assert.equal(stylesSource.includes(".weapon-shop:not(.armory-shop--city-mode) .armory-shop__header"), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode .weapon-shop__rarity-summary"), true);
  assert.equal(stylesSource.includes(".weapon-shop .weapon-shop__rarity-panel"), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode .weapon-shop__type-summary"), true);
  assert.equal(stylesSource.includes(".weapon-shop .weapon-shop__type-panel"), true);
  assert.match(stylesSource, /\.weapon-shop \.weapon-shop__rarity-panel,[\s\S]*?\.weapon-shop \.weapon-shop__type-panel\s*\{[\s\S]*top: auto;[\s\S]*bottom: calc\(100% \+ 5px\);[\s\S]*z-index: 40;[\s\S]*\}/);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode.armory-shop--has-selection .weapon-shop__rarity-filter"), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode.armory-shop--has-selection .weapon-shop__type-filter"), true);
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

test("city armory uses eight product columns while weapon shop keeps four", () => {
  assert.equal(stylesSource.includes("--shop-city-product-columns: 8;"), true);
  assert.equal(stylesSource.includes("--shop-city-product-row-height: clamp(104px, 15.8dvh, 124px);"), true);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-product-columns: 4;[\s\S]*\}/);
  assert.equal(stylesSource.includes(".armory-shop--city-mode:not(.weapon-shop) .armory-shop__option--product"), true);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode \.armory-shop__menu\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\}/);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode .armory-shop__category-rail--ranged"), false);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode .armory-shop__category-rail--melee"), false);
});

test("weapon shop product cards use the damage icon instead of a DM label", () => {
  assert.equal(weaponShopSource.includes('getShopProductDisplayStat(hero, product.itemIds, "damage")'), true);
  assert.equal(weaponShopSource.includes('createProductStats("damage", DAMAGE_HIT_ICON_ASSET_URL, damage, product.price)'), true);
  assert.equal(weaponShopSource.includes('createProductStats("DM"'), false);
  assert.match(weaponShopSource, /statIcon\.className = "armory-shop__product-stat-icon";[\s\S]*statIcon\.src = statIconUrl;[\s\S]*statValue\.textContent = String\(stat\);/);
});

test("weapon shop consumable cards show owned cap badge", () => {
  assert.equal(weaponShopSource.includes("areHeroItemsConsumable"), true);
  assert.equal(weaponShopSource.includes("getHeroItemQuantity"), true);
  assert.equal(weaponShopSource.includes("getHeroConsumableMaxQuantity"), true);
  assert.equal(weaponShopSource.includes("const consumableInfo = getConsumableCardInfo(hero, product.itemIds);"), true);
  assert.equal(weaponShopSource.includes('button.classList.toggle("armory-shop__option--consumable", Boolean(consumableInfo));'), true);
  assert.match(weaponShopSource, /if \(consumableInfo\) \{[\s\S]*button\.append\(createConsumableCardBadges\(consumableInfo\)\);[\s\S]*\}/);
  assert.equal(weaponShopSource.includes("armory-shop__product-consumable-unit"), false);
  assert.equal(weaponShopSource.includes("armory-shop__product-consumable-prefix"), false);
  assert.equal(weaponShopSource.includes("armory-shop__product-consumable-amount"), false);
  assert.equal(weaponShopSource.includes("quantity.textContent = `${info.quantity}/${info.maxQuantity}`;"), true);
  assert.equal(stylesSource.includes(".armory-shop__product-consumable-badges"), true);
  assert.equal(stylesSource.includes(".armory-shop__product-consumable-quantity"), true);
});

test("weapon shop consumable confirm strip shows unit purchase and flat damage", () => {
  assert.equal(weaponShopSource.includes("const isConsumable = areHeroItemsConsumable(product.itemIds);"), true);
  assert.equal(weaponShopSource.includes('getEquippedShopProductDisplayStat(hero, product.itemIds, "damage")'), true);
  assert.equal(weaponShopSource.includes("compareStat: !isConsumable"), true);
  assert.equal(weaponShopSource.includes('unitLabel: isConsumable ? "x1" : undefined'), true);
  assert.equal(weaponShopSource.includes("createPreviewBuyButton(product, hero)"), true);
  assert.equal(weaponShopSource.includes('button.textContent = actionState === "buy" ? "Buy" : getShopProductActionLabel(actionState, product.price);'), true);
  assert.equal(weaponShopSource.includes("Buy x1"), false);
  assert.equal(weaponShopSource.includes('unitNode.className = "armory-shop__selected-unit";'), true);
  assert.equal(weaponShopSource.includes("const comparesStat = options.compareStat ?? true;"), true);
  assert.equal(weaponShopSource.includes("if (comparesStat && currentStat !== stat)"), true);
  assert.equal(stylesSource.includes(".armory-shop__selected-unit"), true);
  assert.equal(stylesSource.includes(".armory-shop__selected-buy--unit"), false);
});

test("weapon shop purchase keeps the selected product preview open", () => {
  const start = weaponShopSource.indexOf("function createPreviewBuyButton");
  const end = weaponShopSource.indexOf("function createBowCapacityUpgrade", start);
  const previewBuyButtonSource = weaponShopSource.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(
    previewBuyButtonSource,
    /button\.addEventListener\("click", \(\) => \{\s*options\.onBuy\(product\);\s*\}\);/,
  );
  assert.equal(previewBuyButtonSource.includes("previewProduct = undefined"), false);
  assert.equal(previewBuyButtonSource.includes("render();"), false);
  assert.equal(weaponShopSource.includes("function refreshSelectedProduct"), true);
});

test("weapon shop locked and sealed products are dimmed with matching armory ribbons", () => {
  assert.equal(shopPresentationSource.includes("export function getShopProductRequirementBadge"), true);
  assert.equal(weaponShopSource.includes("isShopProductSealed"), true);
  assert.equal(weaponShopSource.includes('button.classList.toggle("armory-shop__option--locked", cardState === "locked");'), true);
  assert.equal(
    weaponShopSource.includes('button.classList.toggle("armory-shop__option--sealed", cardState === "sealed" || cardState === "locked");'),
    true,
  );
  assert.equal(weaponShopSource.includes('button.disabled = cardState === "sealed" || cardState === "locked";'), true);
  assert.match(weaponShopSource, /if \(cardState === "sealed"\) \{[\s\S]*button\.append\(createSealedRibbon\(\)\);[\s\S]*\}/);
  assert.match(weaponShopSource, /if \(cardState === "locked" && requirementBadge\) \{[\s\S]*button\.append\(createRequirementRibbon\(requirementBadge\)\);[\s\S]*\}/);
  assert.match(weaponShopSource, /if \(cardState === "buy"\) \{[\s\S]*createProductStats\("damage", DAMAGE_HIT_ICON_ASSET_URL, damage, product\.price\)/);
  assert.equal(weaponShopSource.includes('return isShopProductSealed(hero, product.itemIds, product.rarity) ? "sealed" : "buy";'), true);
  assert.equal(weaponShopSource.includes("function getWeaponProductActionState"), true);
  assert.equal(weaponShopSource.includes('const requirementKey = requirement.kind === "level" ? "level" : requirement.attribute;'), true);
  assert.equal(weaponShopSource.includes('icon.className = `armory-shop__requirement-icon armory-shop__requirement-icon--${requirementKey}`;'), true);
  assert.equal(weaponShopSource.includes('icon.textContent = requirement.kind === "level" ? "LVL" : "";'), true);
  assert.equal(weaponShopSource.includes("amount.textContent = String(requirement.required);"), true);
  assert.equal(weaponShopSource.includes('actionState === "buy" || actionState === "no-gold" || actionState === "locked"'), false);
  assert.equal(weaponShopSource.includes("priceNode.textContent = requirementLabel;"), false);
  assert.equal(weaponShopSource.includes('ribbon.className = "armory-shop__sealed-ribbon armory-shop__requirement-ribbon";'), true);
  assert.equal(stylesSource.includes(".armory-shop__requirement-ribbon"), true);
  assert.equal(stylesSource.includes(".armory-shop__requirement-icon--agility"), true);
  assert.equal(stylesSource.includes(".armory-shop__requirement-icon--level"), true);
  assert.equal(stylesSource.includes('background-image: url("./assets/ui/profile/attribute-agility.webp");'), true);
});

test("weapon shop shows bow capacity upgrade only for the bows category", () => {
  assert.equal(weaponShopSource.includes('const BOW_CATEGORY_ID = "bows";'), true);
  assert.equal(weaponShopSource.includes("ARROW_ICON_ASSET_URL"), true);
  assert.equal(weaponShopSource.includes("onBowCapacityUpgrade?: () => void"), true);
  assert.equal(weaponShopSource.includes("const selectedTypeId = getSingleSelectedWeaponTypeId();"), true);
  assert.equal(weaponShopSource.includes("selectedTypeId === BOW_CATEGORY_ID"), true);
  assert.match(weaponShopSource, /bowCategory && isBowCategoryAvailable\(hero, bowCategory\)[\s\S]*bowUpgrade\.hidden = !isVisible;/);
  assert.match(weaponShopSource, /function isBowCategoryAvailable\(hero: HeroState, category: WeaponCategory\): boolean \{[\s\S]*getWeaponProductCardState\(hero, product\) !== "locked"/);
  assert.equal(weaponShopSource.includes("refreshBowCapacityUpgrade(hero);"), true);
  assert.match(weaponShopSource, /getHeroBowShotCapacity\(hero\)[\s\S]*HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX[\s\S]*HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE/);
  assert.equal(weaponShopSource.includes('name.textContent = "Arrows";'), true);
  assert.match(weaponShopSource, /button\.addEventListener\("click", \(\) => \{\s*options\.onBowCapacityUpgrade\?\.\(\);\s*\}\);/);
  assert.equal(mainSource.includes("function handleBowCapacityUpgrade(): void"), true);
  assert.equal(mainSource.includes("upgradeHeroBowShotCapacity(hero)"), true);
  assert.equal(mainSource.includes("onBowCapacityUpgrade: handleBowCapacityUpgrade"), true);
  assert.equal(stylesSource.includes(".weapon-shop.armory-shop--city-mode .weapon-shop__bow-upgrade"), true);
  assert.equal(stylesSource.includes(".weapon-shop__bow-upgrade-card"), true);
});

test("shop product cards keep lightweight rarity gradients without the profile backdrop texture", () => {
  const productRule = stylesSource.match(/\.armory-shop__option--product\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityProductRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__option--product\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const productBeforeRule = stylesSource.match(/\.armory-shop__option--product::before\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.equal(stylesSource.includes('--ui-profile-backdrop-texture: url("./assets/ui/profile/portrait-backdrop-texture.webp");'), true);
  assert.equal(stylesSource.includes("--ui-profile-backdrop-size: 280px 280px;"), true);
  assert.match(stylesSource, /\.city-profile__portrait::before\s*\{[\s\S]*var\(--ui-profile-backdrop-texture\) center \/ cover no-repeat;/);
  assert.doesNotMatch(productRule, /var\(--ui-profile-backdrop-texture\)/);
  assert.doesNotMatch(productRule, /background-blend-mode/);
  assert.match(productRule, /var\(--shop-rarity-light, #d4c49c\) 0%, var\(--shop-rarity, #9d8d74\) 58%/);
  assert.match(productRule, /inset 0 -6px 0 rgba\(53, 24, 13, 0\.16\)/);
  assert.doesNotMatch(cityProductRule, /var\(--ui-profile-backdrop-texture\)/);
  assert.doesNotMatch(cityProductRule, /background-blend-mode/);
  assert.match(cityProductRule, /var\(--shop-rarity-light, #d4c49c\) 0%, var\(--shop-rarity, #9d8d74\) 48%/);
  assert.doesNotMatch(cityProductRule, /radial-gradient/);
  assert.doesNotMatch(cityProductRule, /repeating-linear-gradient/);
  assert.doesNotMatch(cityProductRule, /inset 0 -4px 0 rgba\(8, 2, 1, 0\.24\)/);
  assert.match(cityProductRule, /inset 0 0 0 1px rgba\(255, 246, 210, 0\.16\)/);
  assert.match(productBeforeRule, /content: none;/);
});

test("sealed armory cards show a centered ribbon and dark item silhouette", () => {
  assert.equal(stylesSource.includes(".armory-shop__sealed-ribbon"), true);
  assert.equal(stylesSource.includes(".armory-shop__option--sealed .armory-shop__product-icon"), true);
  assert.equal(stylesSource.includes("brightness(0.24)"), true);
  assert.equal(stylesSource.includes('transform: translate(-50%, -50%) rotate(-5deg);'), true);
  assert.equal(stylesSource.includes(".armory-shop__option--product.armory-shop__option--sealed:disabled"), true);
});

test("city shop confirm strip is embedded in the shop header while back floats outside it", () => {
  const cityHeaderRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__header\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const armorySelectionHeaderRule = stylesSource.match(
    /\.armory-shop--city-mode:not\(\.weapon-shop\)\.armory-shop--has-selection \.armory-shop__header\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
  const armorySelectionHeaderMetaRule = stylesSource.match(
    /\.armory-shop--city-mode:not\(\.weapon-shop\)\.armory-shop--has-selection \.armory-shop__header-meta(?:,\s*\.weapon-shop\.armory-shop--city-mode\.armory-shop--has-selection \.armory-shop__header-meta)?\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
  const armorySelectionHiddenControlsRule = stylesSource.match(
    /\.armory-shop--city-mode:not\(\.weapon-shop\)\.armory-shop--has-selection \.armory-shop__set-filter,[\s\S]*?\{\s*[\s\S]*?\}/,
  )?.[0] ?? "";
  const armorySelectionSelectedCardRule = stylesSource.match(
    /\.armory-shop--city-mode:not\(\.weapon-shop\)\.armory-shop--has-selection \.armory-shop__selected-card(?:,\s*\.weapon-shop\.armory-shop--city-mode\.armory-shop--has-selection \.armory-shop__selected-card)?\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
  const citySelectedRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__selected\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityBackRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__back\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityEquipmentBackRule = stylesSource.match(/\.armory-shop--city-mode:not\(\.magic-shop\) \.armory-shop__back\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.equal(armoryShopSource.includes("header.append(title, setFilter, partsFilter, filterPlaceholder, selected, headerMeta);"), true);
  assert.equal(weaponShopSource.includes("header.append(title, rarityFilter, typeFilter, selected, headerMeta);"), true);

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("header.append(back, title, selected, headerMeta);"), false);
    assert.equal(source.includes("panel.append(selected);"), false);
    assert.equal(source.includes("panel.append(back);"), true);
    assert.equal(source.includes("menu.append(tray, selected, categoryRail);"), false);
  });
  assert.equal(armoryShopSource.includes("menu.append(tray);"), true);
  assert.equal(armoryShopSource.includes("menu.append(tray, categoryRail);"), false);
  assert.equal(armoryShopSource.includes("menu.append(tray, categoryRail, back);"), false);
  assert.equal(weaponShopSource.includes("menu.append(tray);"), true);
  assert.equal(weaponShopSource.includes("menu.append(rangedCategoryRail, tray, meleeCategoryRail);"), false);
  assert.equal(weaponShopSource.includes("menu.append(rangedCategoryRail, tray, meleeCategoryRail, back);"), false);

  assert.equal(stylesSource.includes("--shop-city-header-height: 72px;"), true);
  assert.match(cityHeaderRule, /overflow: visible;/);
  assert.match(armorySelectionHeaderRule, /grid-template-columns: minmax\(0, 1fr\) clamp\(66px, 17vw, 78px\);/);
  assert.match(armorySelectionHeaderMetaRule, /grid-column: 2;/);
  assert.match(armorySelectionHeaderMetaRule, /grid-row: 1;/);
  assert.match(armorySelectionHiddenControlsRule, /display: none;/);
  assert.match(armorySelectionSelectedCardRule, /grid-template-columns: 44px minmax\(0, 1fr\) minmax\(62px, auto\);/);
  assert.match(citySelectedRule, /grid-column: 1;/);
  assert.match(citySelectedRule, /align-self: stretch;/);
  assert.doesNotMatch(citySelectedRule, /position: absolute;/);
  assert.match(cityBackRule, /position: absolute;/);
  assert.match(cityBackRule, /top: calc\(var\(--shop-frame-top-height\) \+ 10px\);/);
  assert.match(cityBackRule, /left: calc\(var\(--shop-frame-side-width\) \+ 10px\);/);
  assert.match(cityBackRule, /width: 52px;/);
  assert.match(cityBackRule, /height: 52px;/);
  assert.match(cityEquipmentBackRule, /top: auto;/);
  assert.match(cityEquipmentBackRule, /right: calc\(var\(--shop-frame-side-width\) \+ var\(--shop-city-panel-pad-x\) \+ 8px\);/);
  assert.match(cityEquipmentBackRule, /bottom: calc\(var\(--shop-city-tray-height\) \+ var\(--shop-city-menu-pad-bottom\) \+ 12px\);/);
  assert.match(cityEquipmentBackRule, /left: auto;/);
  assert.doesNotMatch(stylesSource.match(/\.armory-shop__selected-card\s*\{[\s\S]*?\}/)?.[0] ?? "", /var\(--ui-panel-wood-texture\)/);
  assert.match(stylesSource.match(/\.armory-shop__selected-card::before\s*\{[\s\S]*?\}/)?.[0] ?? "", /content: none;/);
});

test("city shop back buttons use the shop back icon asset", () => {
  assert.equal(assetsSource.includes('SHOP_BACK_ICON_ASSET_URL = new URL("./assets/ui/shop/back.webp", import.meta.url).href'), true);
  assert.equal(stylesSource.includes(".armory-shop__back-icon"), true);

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("SHOP_BACK_ICON_ASSET_URL"), true);
    assert.equal(source.includes('backIcon.className = "armory-shop__back-icon";'), true);
    assert.equal(source.includes("backIcon.src = SHOP_BACK_ICON_ASSET_URL;"), true);
    assert.equal(source.includes("back.append(backIcon);"), true);
    assert.equal(source.includes('back.textContent = "<";'), false);
  });
});

test("armory confirm strip omits the extra armor icon and updates preview without grid rerender", () => {
  const citySelectedCardRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__selected-card\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const citySelectedMetaRule = stylesSource.match(/\.armory-shop__selected-meta\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.equal(armoryShopSource.includes("DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL"), false);
  assert.equal(armoryShopSource.includes("function renderPreviewSelection"), true);
  assert.equal(armoryShopSource.includes("function previewArmoryProduct"), true);
  assert.match(armoryShopSource, /button\.addEventListener\("click", \(\) => \{[\s\S]*if \(button\.disabled\) \{[\s\S]*return;[\s\S]*previewArmoryProduct\(product\);[\s\S]*\}\);/);
  assert.match(armoryShopSource, /function previewArmoryProduct\(product: ArmoryProduct\)[\s\S]*if \(previewProduct\?\.id === product\.id\)[\s\S]*clearVisibleProductPrewarm\(\);[\s\S]*options\.onPreview\?\.\(product\);[\s\S]*renderPreviewSelection\(previousProductId\);/);
  assert.equal(armoryShopSource.includes("shopPreviewProfiler"), false);
  assert.equal(armoryShopSource.includes("profileArmoryPreviewClick"), false);
  assert.equal(armoryShopSource.includes("ArmoryPreviewRenderMode"), false);
  assert.equal(stylesSource.includes(".armory-frame-profiler"), false);
  assert.equal(stylesSource.includes(".armory-preview-profiler"), false);
  assert.match(armoryShopSource, /function renderPreviewSelection[\s\S]*renderSelectedProduct\(hero\);[\s\S]*updateProductButtonSelection\(previousProductId\);/);
  assert.match(armoryShopSource, /function updateSelectedMeta[\s\S]*meta\.name\.textContent = productName;[\s\S]*meta\.priceAmount\.textContent = String\(price\);/);
  assert.equal(armoryShopSource.includes("armory-shop__selected-stat-value--positive"), true);
  assert.match(citySelectedCardRule, /grid-template-columns: clamp\(38px, 10vw, 44px\) minmax\(0, 1fr\) clamp\(50px, 13vw, 62px\);/);
  assert.match(citySelectedMetaRule, /grid-template-columns: minmax\(0, auto\) minmax\(0, auto\) minmax\(0, 1fr\);/);
  assert.match(citySelectedMetaRule, /"name name name"/);
  assert.match(citySelectedMetaRule, /"rarity stat price"/);
  assert.equal(stylesSource.includes(".armory-shop__selected-stat-value--positive"), true);
});

test("shop purchases refresh the hero portrait for every non-consumable equipment change", () => {
  assert.match(mainSource, /if \(!areHeroItemsConsumable\(product\.itemIds\)\) \{\s*heroPortraitPreview\?\.setEquipment\(hero\.equipment\);\s*\}/);
  assert.equal(mainSource.includes("HERO_PORTRAIT_REFRESH_SLOTS"), false);
  assert.equal(mainSource.includes("function shouldRefreshHeroPortrait"), false);
});

test("shop purchases sync only the active shop state after hero changes", () => {
  const start = mainSource.indexOf("function handleShopBuy");
  const end = mainSource.indexOf("function handleBowCapacityUpgrade", start);
  const handleShopBuySource = mainSource.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.equal(armoryShopSource.includes("syncHeroState: (options?: ArmoryShopHeroSyncOptions) => void"), true);
  assert.equal(weaponShopSource.includes("syncHeroState: (options?: WeaponShopHeroSyncOptions) => void"), true);
  assert.equal(magicShopSource.includes("syncHeroState: () => void"), true);
  assert.equal(armoryShopSource.includes("function syncHeroState(syncOptions: ArmoryShopHeroSyncOptions = {}): void"), true);
  assert.equal(weaponShopSource.includes("function syncHeroState(syncOptions: WeaponShopHeroSyncOptions = {}): void"), true);
  assert.equal(magicShopSource.includes("function syncHeroState(): void"), true);
  assert.equal(handleShopBuySource.includes("const previousHero = hero;"), true);
  assert.equal(handleShopBuySource.includes("syncShopHeroStateForProduct(product, previousHero);"), true);
  assert.equal(handleShopBuySource.includes("armoryShop?.render();"), false);
  assert.equal(handleShopBuySource.includes("weaponShop?.render();"), false);
  assert.equal(handleShopBuySource.includes("magicShop?.render();"), false);
  assert.match(mainSource, /function syncShopHeroStateForProduct\(product: CityShopProduct, previousHero: HeroState\): void[\s\S]*if \(isMagicShopProduct\(product\)\) \{[\s\S]*magicShop\?\.syncHeroState\(\);[\s\S]*armoryShop\?\.syncHeroState\(\{ product, previousHero \}\);[\s\S]*weaponShop\?\.syncHeroState\(\{ product, previousHero \}\);/);
  assert.equal(armoryShopSource.includes("function refreshRenderedProductButtons"), false);
  assert.equal(weaponShopSource.includes("function refreshRenderedProductButtons"), false);
  assert.match(armoryShopSource, /function syncHeroState\(syncOptions: ArmoryShopHeroSyncOptions = \{\}\): void \{\s*if \(shop\.hidden\) \{[\s\S]*return;[\s\S]*refreshChangedProductButtons\(hero, syncOptions\);[\s\S]*renderSelectedProduct\(hero\);/);
  assert.match(weaponShopSource, /function syncHeroState\(syncOptions: WeaponShopHeroSyncOptions = \{\}\): void \{\s*if \(shop\.hidden\) \{[\s\S]*return;[\s\S]*refreshSelectedProduct\(hero\);[\s\S]*refreshChangedProductButtons\(hero, syncOptions\);/);
  assert.match(getFunctionSource(magicShopSource, "syncHeroState"), /refreshHeroState\(options\.getHero\(\)\);/);
  assert.equal(getFunctionSource(magicShopSource, "syncHeroState").includes("render();"), false);
  assert.equal(magicShopSource.includes("preview.replaceChildren"), false);
  assert.equal(magicShopSource.includes("productList.replaceChildren"), false);
  assert.equal(armoryShopSource.includes("function normalizeProductButtonActionState"), false);
  assert.equal(weaponShopSource.includes("function normalizeProductButtonActionState"), false);
  assert.match(armoryShopSource, /if \(productButtonVisualStates\.get\(product\.id\) === nextVisualState\) \{\s*return;\s*\}/);
  assert.match(weaponShopSource, /if \(productButtonVisualStates\.get\(product\.id\) === nextVisualState\) \{\s*return;\s*\}/);
});

test("shop product card sync replaces only cards with changed visual state", () => {
  [armoryShopSource, weaponShopSource].forEach((source) => {
    const refreshSource = getFunctionSource(source, "refreshChangedProductButtons");

    assertInOrder(
      refreshSource,
      "const productIds = getProductButtonRefreshIds(syncOptions.product, syncOptions.previousHero);",
      "if (productIds)",
      "productIds.forEach((productId) => refreshProductButton(productId, hero));",
      "return;",
      "renderedProducts.forEach((product) => refreshProductButton(product.id, hero));",
    );
    assert.equal(refreshSource.includes("renderedProducts.forEach((product) => {"), false);
  });
  [armoryShopSource, weaponShopSource].forEach((source) => {
    const refreshSource = getFunctionSource(source, "refreshProductButton");

    assertInOrder(
      refreshSource,
      "const nextVisualState = getProductButtonVisualState(hero, product);",
      "if (productButtonVisualStates.get(product.id) === nextVisualState)",
      "return;",
      "const nextButton = createProductButton(product, hero, previewProduct?.id === product.id);",
      "currentButton.replaceWith(nextButton);",
      "productButtons.set(product.id, nextButton);",
      "productButtonVisualStates.set(product.id, nextVisualState);",
    );
    assert.equal(refreshSource.includes("currentButton.replaceWith(nextButton);"), true);
    assert.equal(refreshSource.indexOf("productButtonVisualStates.get(product.id)"), refreshSource.lastIndexOf("productButtonVisualStates.get(product.id)"));
  });
  assert.match(armoryShopSource, /productButtonVisualStates\.set\(product\.id, getProductButtonVisualState\(hero, product\)\);/);
  assert.match(weaponShopSource, /productButtonVisualStates\.set\(product\.id, getProductButtonVisualState\(hero, product\)\);/);
  assert.match(armoryShopSource, /previousHero\.equipment\[slotKey\]/);
  assert.match(weaponShopSource, /previousHero\.equipment\[slotKey\]/);
});

test("shop product cards leave gold checks to the confirm strip", () => {
  [armoryShopSource, weaponShopSource].forEach((source) => {
    const productButtonSource = getFunctionSource(source, "createProductButton");
    const visualStateSource = getFunctionSource(source, "getProductButtonVisualState");

    assert.equal(productButtonSource.includes("no-gold"), false);
    assert.equal(productButtonSource.includes("getShopProductActionState(hero, product.itemIds, product.price)"), false);
    assert.equal(visualStateSource.includes("hero.gold"), false);
  });
  assert.match(armoryShopSource, /const cardState = getArmoryProductCardState\(hero, product\);/);
  assert.match(weaponShopSource, /const cardState = getWeaponProductCardState\(hero, product\);/);
  assert.match(armoryShopSource, /function updateSelectedProductStrip[\s\S]*const actionState = getArmoryProductActionState\(hero, product\);[\s\S]*actionState === "equipped" \|\| actionState === "no-gold"/);
  assert.match(
    weaponShopSource,
    /function createPreviewBuyButton[\s\S]*const actionState = getShopProductActionState\(hero, product\.itemIds, product\.price\);[\s\S]*actionState === "equipped" \|\| actionState === "no-gold"/,
  );
});

test("city shops lazily prewarm visible equipment products", () => {
  assert.equal(armoryShopSource.includes("onPrewarmProducts?: (products: readonly ArmoryProduct[]) => void"), true);
  assert.equal(weaponShopSource.includes("onPrewarmProducts?: (products: readonly WeaponProduct[]) => void"), true);
  assert.equal(armoryShopSource.includes("SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 8"), true);
  assert.equal(weaponShopSource.includes("SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 6"), true);
  assert.equal(armoryShopSource.includes("SHOP_PREWARM_AFTER_SCROLL_DELAY_MS = 140"), true);
  assert.equal(weaponShopSource.includes("SHOP_PREWARM_AFTER_SCROLL_DELAY_MS = 140"), true);
  assert.equal(armoryShopSource.includes("function getVisibleProductPrewarmCandidates(): ArmoryProduct[]"), true);
  assert.equal(weaponShopSource.includes("function getVisibleProductPrewarmCandidates(): WeaponProduct[]"), true);
  assert.equal(armoryShopSource.includes("content.getBoundingClientRect()"), true);
  assert.equal(weaponShopSource.includes("content.getBoundingClientRect()"), true);
  assert.equal(armoryShopSource.includes("!button || button.disabled"), true);
  assert.equal(weaponShopSource.includes("!button || button.disabled"), true);
  assert.equal(mainSource.includes("function handleShopProductPrewarm(products: readonly (ArmoryProduct | WeaponProduct)[]): void"), true);
  assert.equal(mainSource.includes("!areHeroItemsConsumable(product.itemIds)"), true);
  assert.equal(mainSource.includes("product.itemIds.length > 1"), false);
  assert.equal(mainSource.includes("!isShopProductSealed(hero, product.itemIds, product.rarity)"), true);
  assert.equal(mainSource.includes("cityScene?.prewarmEquipmentItem(itemId);"), true);
  assert.equal(mainSource.includes("onPrewarmProducts: handleShopProductPrewarm"), true);
});
