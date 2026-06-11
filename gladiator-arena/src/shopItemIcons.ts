import {
  FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_HELMET_LIGHT_ASSET_KEY,
  FIGHTER_PAPER_DOLL_ASSETS,
  FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
} from "./assets";
import {
  CLOTH_BREASTPLATE_ID,
  STARTER_BACK_BOOT_ID,
  STARTER_BACK_WRIST_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_BREASTPLATE_ID,
  STARTER_FRONT_BOOT_ID,
  STARTER_FRONT_WRIST_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_HELMET_ID,
  TRAINING_WEAPON_ID,
  type HeroItemId,
} from "./hero";
import { GENERATED_EQUIPMENT_ITEM_RECORDS } from "./generated/equipmentItems.generated";

const SHOP_ICON_ASSET_URLS = import.meta.glob("./assets/shop-icons/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const PAPER_DOLL_ICON_FALLBACK_URLS = Object.fromEntries(
  FIGHTER_PAPER_DOLL_ASSETS.map((asset) => [asset.key, asset.lowUrl ?? asset.url]),
) as Record<string, string>;

const SHOP_ITEM_ICON_URLS: Partial<Record<HeroItemId, string>> = {
  [TRAINING_WEAPON_ID]: getPaperDollShopIconUrl(FIGHTER_WEAPON_SWORD_01_ASSET_KEY),
  [STARTER_HELMET_ID]: getPaperDollShopIconUrl(FIGHTER_HELMET_LIGHT_ASSET_KEY),
  [STARTER_BREASTPLATE_ID]: getPaperDollShopIconUrl(FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY),
  [CLOTH_BREASTPLATE_ID]: getPaperDollShopIconUrl(FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY),
  [STARTER_BACK_SHOULDERGUARD_ID]: getPaperDollShopIconUrl(FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY),
  [STARTER_FRONT_SHOULDERGUARD_ID]: getPaperDollShopIconUrl(FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY),
  [STARTER_BACK_WRIST_ID]: getPaperDollShopIconUrl(FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY),
  [STARTER_FRONT_WRIST_ID]: getPaperDollShopIconUrl(FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY),
  [STARTER_BACK_GREAVE_ID]: getPaperDollShopIconUrl(FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY),
  [STARTER_FRONT_GREAVE_ID]: getPaperDollShopIconUrl(FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY),
  [STARTER_BACK_SHINGUARD_ID]: getPaperDollShopIconUrl(FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY),
  [STARTER_FRONT_SHINGUARD_ID]: getPaperDollShopIconUrl(FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY),
  [STARTER_BACK_BOOT_ID]: getPaperDollShopIconUrl(FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY),
  [STARTER_FRONT_BOOT_ID]: getPaperDollShopIconUrl(FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY),
  ...Object.fromEntries(
    GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, getShopIconAssetUrl(record.asset.key, record.asset.lowUrl ?? record.asset.url)]),
  ),
};

let shopItemIconPrewarmPromise: Promise<void> | undefined;
const shopItemIconPrewarmImages = new Set<HTMLImageElement>();

export function getShopProductIconUrl(itemIds: HeroItemId[]): string | undefined {
  const representativeItemId = [...itemIds].reverse().find((itemId) => SHOP_ITEM_ICON_URLS[itemId]);

  return representativeItemId ? SHOP_ITEM_ICON_URLS[representativeItemId] : undefined;
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

function getPaperDollShopIconUrl(assetKey: string): string {
  return getShopIconAssetUrl(assetKey, PAPER_DOLL_ICON_FALLBACK_URLS[assetKey] ?? "");
}

function getShopIconAssetUrl(assetKey: string, fallbackUrl: string): string {
  return SHOP_ICON_ASSET_URLS[`./assets/shop-icons/${assetKey}.webp`] ?? fallbackUrl;
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
