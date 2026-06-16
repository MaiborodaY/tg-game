import { HERO_ITEM_CATALOG, type HeroItemId } from "./hero";
import { GENERATED_EQUIPMENT_ITEM_RECORDS } from "./generated/equipmentItems.generated";

const SHOP_ICON_ASSET_URLS = import.meta.glob("./assets/shop-icons/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const SHOP_ITEM_ICON_URLS = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, getShopIconAssetUrl(record.asset.key)]),
) as Partial<Record<HeroItemId, string>>;

let shopItemIconPrewarmPromise: Promise<void> | undefined;
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

export function prewarmShopItemIconsForBrowserCache(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  shopItemIconPrewarmPromise ??= Promise.all(
    [...new Set(Object.values(SHOP_ITEM_ICON_URLS).filter((url): url is string => Boolean(url)))].map(prewarmShopIconUrl),
  ).then(() => undefined);

  return shopItemIconPrewarmPromise;
}

function getShopIconAssetUrl(assetKey: string): string | undefined {
  return SHOP_ICON_ASSET_URLS[`./assets/shop-icons/${assetKey}.webp`];
}

function prewarmShopIconUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
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
}
