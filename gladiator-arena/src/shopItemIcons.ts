import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_ITEM_CATALOG,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_WARD_SCROLL_ITEM_ID,
  type HeroItemId,
} from "./hero";
import { GENERATED_EQUIPMENT_ITEM_RECORDS } from "./generated/equipmentItems.generated";

const SHOP_ICON_ASSET_URLS = import.meta.glob("./assets/shop-icons/*.{png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const SCROLL_SHOP_ICON_ASSET_KEYS: Partial<Record<HeroItemId, string>> = {
  [HERO_CRACK_ARMOR_SCROLL_ITEM_ID]: "scroll-crack-armor-01",
  [HERO_FIREBALL_SCROLL_ITEM_ID]: "scroll-fireball-01",
  [HERO_WARD_SCROLL_ITEM_ID]: "scroll-ward-01",
  [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID]: "scroll-precise-strike-01",
  [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID]: "scroll-double-strike-01",
  [HERO_POISON_SCROLL_ITEM_ID]: "scroll-poison-01",
};

const SHOP_ITEM_ICON_URLS = {
  ...Object.fromEntries(GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, getShopIconAssetUrl(record.asset.key)])),
  ...Object.fromEntries(
    Object.entries(SCROLL_SHOP_ICON_ASSET_KEYS).map(([itemId, assetKey]) => [
      itemId,
      assetKey ? getShopIconAssetUrl(assetKey) : undefined,
    ]),
  ),
} as Partial<Record<HeroItemId, string>>;

const shopItemIconPrewarmPromises = new Map<string, Promise<void>>();
const shopItemIconPrewarmImages = new Set<HTMLImageElement>();

export function getShopProductIconUrl(itemIds: readonly HeroItemId[]): string | undefined {
  const representativeItemId = getRepresentativeShopItemIconId(itemIds);

  return representativeItemId ? SHOP_ITEM_ICON_URLS[representativeItemId] : undefined;
}

function getRepresentativeShopItemIconId(itemIds: readonly HeroItemId[]): HeroItemId | undefined {
  const frontItemId = itemIds.find((itemId) => {
    const slot = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

    return slot?.startsWith("front") && SHOP_ITEM_ICON_URLS[itemId];
  });

  return frontItemId ?? [...itemIds].reverse().find((itemId) => SHOP_ITEM_ICON_URLS[itemId]);
}

export function prewarmShopProductIcons(itemIdGroups: readonly (readonly HeroItemId[])[]): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const urls = itemIdGroups.map(getShopProductIconUrl).filter((url): url is string => Boolean(url));

  return Promise.all([...new Set(urls)].map(prewarmShopIconUrl)).then(() => undefined);
}

function getShopIconAssetUrl(assetKey: string): string | undefined {
  return SHOP_ICON_ASSET_URLS[`./assets/shop-icons/${assetKey}.webp`] ?? SHOP_ICON_ASSET_URLS[`./assets/shop-icons/${assetKey}.png`];
}

function prewarmShopIconUrl(url: string): Promise<void> {
  const existingPromise = shopItemIconPrewarmPromises.get(url);

  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve) => {
    const image = new Image();
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }

      done = true;
      shopItemIconPrewarmImages.delete(image);
      resolve();
    };

    shopItemIconPrewarmImages.add(image);
    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => {
      if (typeof image.decode !== "function") {
        finish();
        return;
      }

      void image.decode().then(finish, finish);
    };
    image.onerror = finish;
    image.src = url;
  });

  shopItemIconPrewarmPromises.set(url, promise);

  return promise;
}
