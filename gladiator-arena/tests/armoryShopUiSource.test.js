import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const armoryShopSource = readFileSync(resolve(currentDir, "../src/armoryShopUi.ts"), "utf8");
const weaponShopSource = readFileSync(resolve(currentDir, "../src/weaponShopUi.ts"), "utf8");
const assetsSource = readFileSync(resolve(currentDir, "../src/assets.ts"), "utf8");
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

  assert.equal(armoryShopSource.includes("getArmoryProductActionState(hero, product)"), true);
  assert.equal(armoryShopSource.includes('armory-shop__option--sealed'), true);
  assert.equal(armoryShopSource.includes('ribbon.textContent = "SEALED";'), true);
  assert.equal(armoryShopSource.includes('button.disabled = actionState === "sealed";'), true);
  assert.equal(armoryShopSource.includes('actionState === "buy" || actionState === "no-gold"'), true);
  assert.equal(armoryShopSource.includes("isShopProductSealed(hero, product.itemIds, product.rarity)"), true);

  assert.equal(mainSource.includes("isSealedArmoryPurchase"), true);
  assert.equal(mainSource.includes("!areHeroItemsOwned(hero, product.itemIds)"), true);
  assert.equal(mainSource.includes("isShopProductSealed(hero, product.itemIds, product.rarity)"), true);
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
  assert.equal(weaponShopSource.includes('id: "maces"'), true);
  assert.equal(weaponShopSource.includes('name: "Maces"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("maces")'), true);
  assert.equal(weaponShopSource.includes('id: "spears"'), true);
  assert.equal(weaponShopSource.includes('name: "Spears"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("spears")'), true);
  assert.equal(weaponShopSource.includes('id: "shurikens"'), true);
  assert.equal(weaponShopSource.includes('name: "Shurikens"'), true);
  assert.equal(weaponShopSource.includes('products: getGeneratedWeaponProducts("shurikens")'), true);
  assert.equal(weaponShopSource.includes('range: "ranged"'), true);
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

test("city shops keep product cards wide around their side rails", () => {
  assert.equal(stylesSource.includes("--shop-city-product-columns: 3;"), true);
  assert.equal(stylesSource.includes("--shop-city-product-row-height: clamp(104px, 15.8dvh, 124px);"), true);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode\s*\{[\s\S]*--shop-city-product-columns: 3;[\s\S]*\}/);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode \.armory-shop__menu\s*\{[\s\S]*var\(--shop-city-rail-width\) minmax\(0, 1fr\) var\(--shop-city-rail-width\);[\s\S]*\}/);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode \.armory-shop__category-rail--ranged\s*\{[\s\S]*order: 1;[\s\S]*\}/);
  assert.match(stylesSource, /\.weapon-shop\.armory-shop--city-mode \.armory-shop__category-rail--melee\s*\{[\s\S]*order: 3;[\s\S]*\}/);
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
    /button\.addEventListener\("click", \(\) => \{\s*options\.onBuy\(product\);\s*render\(\);\s*\}\);/,
  );
  assert.equal(previewBuyButtonSource.includes("previewProduct = undefined"), false);
});

test("weapon shop locked products are dimmed and show centered stat requirement ribbons", () => {
  assert.equal(shopPresentationSource.includes("export function getShopProductRequirementBadge"), true);
  assert.equal(weaponShopSource.includes('button.classList.toggle("armory-shop__option--locked", actionState === "locked");'), true);
  assert.equal(weaponShopSource.includes('button.classList.toggle("armory-shop__option--sealed", actionState === "locked");'), true);
  assert.equal(weaponShopSource.includes('button.disabled = actionState === "locked";'), true);
  assert.match(weaponShopSource, /if \(actionState === "locked" && requirementBadge\) \{[\s\S]*button\.append\(createRequirementRibbon\(requirementBadge\)\);[\s\S]*\}/);
  assert.match(weaponShopSource, /if \(actionState === "buy" \|\| actionState === "no-gold"\) \{[\s\S]*createProductStats\("damage", DAMAGE_HIT_ICON_ASSET_URL, damage, product\.price\)/);
  assert.equal(weaponShopSource.includes('icon.className = `armory-shop__requirement-icon armory-shop__requirement-icon--${requirement.attribute}`;'), true);
  assert.equal(weaponShopSource.includes("amount.textContent = String(requirement.required);"), true);
  assert.equal(weaponShopSource.includes('actionState === "buy" || actionState === "no-gold" || actionState === "locked"'), false);
  assert.equal(weaponShopSource.includes("priceNode.textContent = requirementLabel;"), false);
  assert.equal(weaponShopSource.includes('ribbon.className = "armory-shop__sealed-ribbon armory-shop__requirement-ribbon";'), true);
  assert.equal(stylesSource.includes(".armory-shop__requirement-ribbon"), true);
  assert.equal(stylesSource.includes(".armory-shop__requirement-icon--agility"), true);
  assert.equal(stylesSource.includes('background-image: url("./assets/ui/profile/attribute-agility.webp");'), true);
});

test("weapon shop shows bow capacity upgrade only for the bows category", () => {
  assert.equal(weaponShopSource.includes('const BOW_CATEGORY_ID = "bows";'), true);
  assert.equal(weaponShopSource.includes("ARROW_ICON_ASSET_URL"), true);
  assert.equal(weaponShopSource.includes("onBowCapacityUpgrade?: () => void"), true);
  assert.match(weaponShopSource, /selectedCategory\.id === BOW_CATEGORY_ID && isBowCategoryAvailable\(hero, selectedCategory\)[\s\S]*bowUpgrade\.hidden = !isVisible;/);
  assert.match(weaponShopSource, /function isBowCategoryAvailable\(hero: HeroState, category: WeaponCategory\): boolean \{[\s\S]*getShopProductActionState\(hero, product\.itemIds, product\.price\) !== "locked"/);
  assert.match(weaponShopSource, /getHeroBowShotCapacity\(hero\)[\s\S]*HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX[\s\S]*HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE/);
  assert.equal(weaponShopSource.includes('name.textContent = "Arrows";'), true);
  assert.match(weaponShopSource, /button\.addEventListener\("click", \(\) => \{[\s\S]*options\.onBowCapacityUpgrade\?\.\(\);[\s\S]*render\(\);[\s\S]*\}\);/);
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
  const citySelectedRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__selected\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const cityBackRule = stylesSource.match(/\.armory-shop--city-mode \.armory-shop__back\s*\{[\s\S]*?\}/)?.[0] ?? "";

  [armoryShopSource, weaponShopSource].forEach((source) => {
    assert.equal(source.includes("header.append(title, selected, headerMeta);"), true);
    assert.equal(source.includes("header.append(back, title, selected, headerMeta);"), false);
    assert.equal(source.includes("panel.append(selected);"), false);
    assert.equal(source.includes("panel.append(back);"), true);
    assert.equal(source.includes("menu.append(tray, selected, categoryRail);"), false);
  });
  assert.equal(armoryShopSource.includes("menu.append(tray, categoryRail);"), true);
  assert.equal(armoryShopSource.includes("menu.append(tray, categoryRail, back);"), false);
  assert.equal(weaponShopSource.includes("menu.append(rangedCategoryRail, tray, meleeCategoryRail);"), true);
  assert.equal(weaponShopSource.includes("menu.append(rangedCategoryRail, tray, meleeCategoryRail, back);"), false);

  assert.equal(stylesSource.includes("--shop-city-header-height: 72px;"), true);
  assert.match(cityHeaderRule, /overflow: visible;/);
  assert.match(citySelectedRule, /grid-column: 1;/);
  assert.match(citySelectedRule, /align-self: stretch;/);
  assert.doesNotMatch(citySelectedRule, /position: absolute;/);
  assert.match(cityBackRule, /position: absolute;/);
  assert.match(cityBackRule, /top: calc\(var\(--shop-frame-top-height\) \+ 10px\);/);
  assert.match(cityBackRule, /left: calc\(var\(--shop-frame-side-width\) \+ 10px\);/);
  assert.match(cityBackRule, /width: 52px;/);
  assert.match(cityBackRule, /height: 52px;/);
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
  assert.match(armoryShopSource, /button\.addEventListener\("click", \(\) => previewArmoryProduct\(product\)\);/);
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

test("city shops lazily prewarm visible equipment products", () => {
  assert.equal(armoryShopSource.includes("onPrewarmProducts?: (products: readonly ArmoryProduct[]) => void"), true);
  assert.equal(weaponShopSource.includes("onPrewarmProducts?: (products: readonly WeaponProduct[]) => void"), true);
  assert.equal(armoryShopSource.includes("SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 6"), true);
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
