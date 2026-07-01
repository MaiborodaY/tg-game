export { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
import { SCROLL_CAST_PROP_ASSET_KEYS, type ScrollCastPropAssetKey } from "./scrollCastPropAssets";

export {
  DEFAULT_SCROLL_CAST_PROP_ASSET_KEY,
  SCROLL_CAST_PROP_ASSET_KEYS,
  type ScrollCastPropAssetKey,
} from "./scrollCastPropAssets";

export const ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY = "arena-bg-back-layer";
export const ARENA_BACKGROUND_BACK_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-back.webp", import.meta.url).href;
export const ARENA_BACKGROUND_MID_LAYER_ASSET_KEY = "arena-bg-mid-layer";
export const ARENA_BACKGROUND_MID_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-mid.webp", import.meta.url).href;
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY = "arena-bg-ground-layer";
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-ground.webp", import.meta.url).href;
export const ARENA_TIER_2_BACKGROUND_BACK_LAYER_ASSET_KEY = "arena-tier-2-bg-back-layer";
export const ARENA_TIER_2_BACKGROUND_BACK_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-tier-2-back.webp", import.meta.url).href;
export const ARENA_TIER_2_BACKGROUND_GROUND_LAYER_ASSET_KEY = "arena-tier-2-bg-ground-layer";
export const ARENA_TIER_2_BACKGROUND_GROUND_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-tier-2-ground.webp", import.meta.url).href;
export const ARENA_TIER_2_BACKGROUND_FRONT_LAYER_ASSET_KEY = "arena-tier-2-bg-front-layer";
export const ARENA_TIER_2_BACKGROUND_FRONT_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-tier-2-front-trees.webp", import.meta.url).href;
export const ARENA_TIER_2_BACKGROUND_AMBIENT_LAYER_ASSET_KEY = "arena-tier-2-bg-ambient-layer";
export const ARENA_TIER_2_BACKGROUND_AMBIENT_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-tier-2-ambient-particles.webp", import.meta.url).href;
export const SHOP_CATEGORY_SCROLL_ICON_ASSET_URL = new URL("./assets/ui/city-buttons/city-magic-shop-icon.webp", import.meta.url).href;
export const ENERGY_BOOSTER_ICON_ASSET_URL = new URL("./assets/ui/profile/energy-booster.webp", import.meta.url).href;
export const ENERGY_PACK_ICON_ASSET_URL = new URL("./assets/ui/profile/energy-pack.webp", import.meta.url).href;

export const ARENA_BACKGROUND_LAYER_ORDER = ["back", "mid", "ground", "front", "ambient"] as const;
export type ArenaBackgroundLayerRole = (typeof ARENA_BACKGROUND_LAYER_ORDER)[number];
export type ArenaBackgroundLayerAssetKey = string;
export const DEFAULT_ARENA_BACKGROUND_VARIANT_ID = "default";
export type ArenaBackgroundVariantId = string;

export interface ArenaBackgroundLayerAsset {
  tierId: number;
  variantId: ArenaBackgroundVariantId;
  layer: ArenaBackgroundLayerAssetKey;
  role: ArenaBackgroundLayerRole;
  order: number;
  key: string;
  url: string;
  shadeWithCamera?: boolean;
}

export interface ArenaMenuBackgroundAsset {
  tierId: number;
  variantId: ArenaBackgroundVariantId;
  url: string;
}

const arenaBackgroundLayerAssetModules = import.meta.glob("./assets/arena/layers/arena*.{png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const arenaMenuBackgroundAssetModules = import.meta.glob("./assets/ui/arena-menu-backgrounds/tier-*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const ARENA_BACKGROUND_LAYER_ASSETS: readonly ArenaBackgroundLayerAsset[] = Object.entries(arenaBackgroundLayerAssetModules)
  .map(([path, url]) => createArenaBackgroundLayerAsset(path, url))
  .filter((asset): asset is ArenaBackgroundLayerAsset => !!asset)
  .sort((a, b) => (
    a.tierId - b.tierId ||
    compareArenaBackgroundVariantIds(a.variantId, b.variantId) ||
    a.order - b.order ||
    a.layer.localeCompare(b.layer)
  ));

export const ARENA_MENU_BACKGROUND_ASSETS: readonly ArenaMenuBackgroundAsset[] = Object.entries(arenaMenuBackgroundAssetModules)
  .map(([path, url]) => createArenaMenuBackgroundAsset(path, url))
  .filter((asset): asset is ArenaMenuBackgroundAsset => !!asset)
  .sort((a, b) => (
    a.tierId - b.tierId ||
    compareArenaBackgroundVariantIds(a.variantId, b.variantId)
  ));

export function getArenaBackgroundVariantIdsForTier(tierId: number): ArenaBackgroundVariantId[] {
  const variantIds = getExactArenaBackgroundVariantIdsForTier(tierId);

  return variantIds.length > 0 ? variantIds : tierId === 1 ? [DEFAULT_ARENA_BACKGROUND_VARIANT_ID] : getArenaBackgroundVariantIdsForTier(1);
}

export function pickArenaBackgroundVariantIdForTier(tierId: number, random = Math.random): ArenaBackgroundVariantId {
  const variantIds = getArenaBackgroundVariantIdsForTier(tierId);

  return variantIds[Math.floor(clampRandom(random()) * variantIds.length)] ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID;
}

export function getArenaBackgroundLayerAssetKeysForTier(tierId: number, variantId?: ArenaBackgroundVariantId): ArenaBackgroundLayerAssetKey[] {
  const resolvedVariantId = resolveArenaBackgroundVariantIdForTier(tierId, variantId);
  const tierLayers = ARENA_BACKGROUND_LAYER_ASSETS
    .filter((asset) => asset.tierId === tierId && asset.variantId === resolvedVariantId)
    .map((asset) => asset.layer);

  return tierLayers.length > 0 ? tierLayers : tierId === 1 ? [] : getArenaBackgroundLayerAssetKeysForTier(1);
}

export function getArenaMenuBackgroundAssetUrlForTier(tierId: number, variantId?: ArenaBackgroundVariantId): string | undefined {
  const variantIds = getArenaBackgroundVariantIdsForTier(tierId);
  const resolvedVariantId = variantId && variantIds.includes(variantId) ? variantId : variantIds[0] ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID;
  const exactAsset = ARENA_MENU_BACKGROUND_ASSETS.find((asset) => asset.tierId === tierId && asset.variantId === resolvedVariantId);

  if (exactAsset) {
    return exactAsset.url;
  }

  if (resolvedVariantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID) {
    const defaultAsset = ARENA_MENU_BACKGROUND_ASSETS.find((asset) => asset.tierId === tierId && asset.variantId === DEFAULT_ARENA_BACKGROUND_VARIANT_ID);

    if (defaultAsset) {
      return defaultAsset.url;
    }
  }

  return tierId === 1 ? undefined : getArenaMenuBackgroundAssetUrlForTier(1);
}

function createArenaBackgroundLayerAsset(path: string, url: string): ArenaBackgroundLayerAsset | undefined {
  const tierVariantMatch = /\/arena-tier-(\d+)-((?:variant|scene)-\d+)-([a-z0-9-]+)\.(?:png|webp)$/u.exec(path);

  if (tierVariantMatch) {
    return createArenaBackgroundLayerAssetConfig({
      tierId: Number(tierVariantMatch[1]),
      variantId: tierVariantMatch[2],
      layerToken: tierVariantMatch[3],
      url,
    });
  }

  const tierMatch = /\/arena-tier-(\d+)-([a-z0-9-]+)\.(?:png|webp)$/u.exec(path);

  if (tierMatch) {
    return createArenaBackgroundLayerAssetConfig({
      tierId: Number(tierMatch[1]),
      variantId: DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
      layerToken: tierMatch[2],
      url,
    });
  }

  const baseVariantMatch = /\/arena-((?:variant|scene)-\d+)-([a-z0-9-]+)\.(?:png|webp)$/u.exec(path);

  if (baseVariantMatch) {
    return createArenaBackgroundLayerAssetConfig({
      tierId: 1,
      variantId: baseVariantMatch[1],
      layerToken: baseVariantMatch[2],
      url,
    });
  }

  const baseMatch = /\/arena-([a-z0-9-]+)\.(?:png|webp)$/u.exec(path);

  if (baseMatch) {
    return createArenaBackgroundLayerAssetConfig({
      tierId: 1,
      variantId: DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
      layerToken: baseMatch[1],
      url,
    });
  }

  return undefined;
}

function createArenaMenuBackgroundAsset(path: string, url: string): ArenaMenuBackgroundAsset | undefined {
  const match = /\/tier-(\d+)(?:-((?:variant|scene)-\d+))?\.webp$/u.exec(path);

  if (!match) {
    return undefined;
  }

  const tierId = Number(match[1]);

  if (!Number.isInteger(tierId) || tierId < 1) {
    return undefined;
  }

  return {
    tierId,
    variantId: match[2] ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
    url,
  };
}

function createArenaBackgroundLayerAssetConfig({
  tierId,
  variantId,
  layerToken,
  url,
}: {
  tierId: number;
  variantId: ArenaBackgroundVariantId;
  layerToken: string;
  url: string;
}): ArenaBackgroundLayerAsset | undefined {
  const layer = parseArenaBackgroundLayerToken(layerToken);

  if (!Number.isInteger(tierId) || tierId < 1 || !layer) {
    return undefined;
  }

  const keyPrefix = variantId === DEFAULT_ARENA_BACKGROUND_VARIANT_ID ? `arena-tier-${tierId}` : `arena-tier-${tierId}-${variantId}`;

  return {
    tierId,
    variantId,
    layer: layer.id,
    role: layer.role,
    order: layer.order,
    key: `${keyPrefix}-bg-${layer.id}-layer`,
    url,
    shadeWithCamera: layer.role === "mid",
  };
}

function parseArenaBackgroundLayerToken(token: string): { id: ArenaBackgroundLayerAssetKey; role: ArenaBackgroundLayerRole; order: number } | undefined {
  const normalized = normalizeArenaBackgroundLayerToken(token);

  if (!normalized) {
    return undefined;
  }

  const order = ARENA_BACKGROUND_LAYER_ORDER.indexOf(normalized.role) * 100 + normalized.instance;

  return {
    id: normalized.instance <= 1 ? normalized.role : `${normalized.role}-${normalized.instance}`,
    role: normalized.role,
    order,
  };
}

function normalizeArenaBackgroundLayerToken(token: string): { role: ArenaBackgroundLayerRole; instance: number } | undefined {
  const instanceMatch = /^(.*?)-([2-9]\d*)$/u.exec(token);
  const baseToken = instanceMatch ? instanceMatch[1] : token;
  const instance = instanceMatch ? Number(instanceMatch[2]) : 1;

  if (!Number.isInteger(instance) || instance < 1) {
    return undefined;
  }

  if (baseToken === "front-trees" || baseToken === "front-tree" || baseToken === "trees") {
    return { role: "front", instance };
  }

  if (baseToken === "ambient-particles" || baseToken === "particles") {
    return { role: "ambient", instance };
  }

  return ARENA_BACKGROUND_LAYER_ORDER.includes(baseToken as ArenaBackgroundLayerRole)
    ? { role: baseToken as ArenaBackgroundLayerRole, instance }
    : undefined;
}

function getExactArenaBackgroundVariantIdsForTier(tierId: number): ArenaBackgroundVariantId[] {
  return [...new Set(
    ARENA_BACKGROUND_LAYER_ASSETS
      .filter((asset) => asset.tierId === tierId)
      .map((asset) => asset.variantId),
  )].sort(compareArenaBackgroundVariantIds);
}

function resolveArenaBackgroundVariantIdForTier(tierId: number, variantId?: ArenaBackgroundVariantId): ArenaBackgroundVariantId {
  const variantIds = getArenaBackgroundVariantIdsForTier(tierId);

  return variantId && variantIds.includes(variantId) ? variantId : variantIds[0] ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID;
}

function compareArenaBackgroundVariantIds(left: ArenaBackgroundVariantId, right: ArenaBackgroundVariantId): number {
  if (left === right) {
    return 0;
  }

  if (left === DEFAULT_ARENA_BACKGROUND_VARIANT_ID) {
    return -1;
  }

  if (right === DEFAULT_ARENA_BACKGROUND_VARIANT_ID) {
    return 1;
  }

  return left.localeCompare(right);
}

function clampRandom(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 0.999999999)) : 0;
}

export const DAMAGE_BLOCK_ICON_ASSET_KEY = "damage-block-icon";
export const DAMAGE_BLOCK_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-block.webp", import.meta.url).href;
export const DAMAGE_HIT_ICON_ASSET_KEY = "damage-hit-icon";
export const DAMAGE_HIT_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-hit.webp", import.meta.url).href;
export const MAGIC_DAMAGE_ICON_ASSET_KEY = "magic-damage-icon";
export const MAGIC_DAMAGE_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-magic.webp", import.meta.url).href;
export const DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY = "damage-armor-absorb-icon";
export const DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-armor-absorb.webp", import.meta.url).href;
export const DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY = "damage-armor-break-icon";
export const DAMAGE_ARMOR_BREAK_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-armor-break.webp", import.meta.url).href;
export const REST_ZZZ_ICON_ASSET_KEY = "rest-zzz-icon";
export const REST_ZZZ_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/rest.webp", import.meta.url).href;
export const ARROW_ICON_ASSET_KEY = "arrow-icon";
export const ARROW_ICON_ASSET_URL = new URL("./assets/ui/action-icons/arrow.webp", import.meta.url).href;
export const SHURIKEN_PROJECTILE_ASSET_KEY = "shuriken-projectile";
export const SHURIKEN_PROJECTILE_ASSET_URL = new URL("./assets/ui/projectiles/shuriken.webp", import.meta.url).href;
export const FIREBALL_PROJECTILE_ASSET_KEY = "fireball-projectile";
export const FIREBALL_PROJECTILE_ASSET_URL = new URL("./assets/ui/projectiles/fireball.webp", import.meta.url).href;
export const WARD_SHIELD_EFFECT_ASSET_KEY = "ward-shield-effect";
export const WARD_SHIELD_EFFECT_ASSET_URL = new URL("./assets/ui/effects/ward.webp", import.meta.url).href;
export const REST_HEALTH_ICON_ASSET_KEY = "rest-health-icon";
export const REST_HEALTH_ICON_ASSET_URL = new URL("./assets/ui/profile/stat-health.webp", import.meta.url).href;
export const REST_STAMINA_ICON_ASSET_KEY = "rest-stamina-icon";
export const REST_STAMINA_ICON_ASSET_URL = new URL("./assets/ui/profile/stat-stamina.webp", import.meta.url).href;
export const DAILY_ARENA_ENERGY_ICON_ASSET_URL = new URL("./assets/ui/profile/daily-energy.webp", import.meta.url).href;
export const SCROLL_CAST_PROP_ASSETS: readonly { key: ScrollCastPropAssetKey; url: string }[] = [
  { key: "scroll-crack-armor-01", url: new URL("./assets/shop-icons/scroll-crack-armor-01.webp", import.meta.url).href },
  { key: "scroll-fireball-01", url: new URL("./assets/shop-icons/scroll-fireball-01.webp", import.meta.url).href },
  { key: "scroll-ward-01", url: new URL("./assets/shop-icons/scroll-ward-01.webp", import.meta.url).href },
  { key: "scroll-precise-strike-01", url: new URL("./assets/shop-icons/scroll-precise-strike-01.webp", import.meta.url).href },
  { key: "scroll-double-strike-01", url: new URL("./assets/shop-icons/scroll-double-strike-01.webp", import.meta.url).href },
  { key: "scroll-poison-01", url: new URL("./assets/shop-icons/scroll-poison-01.webp", import.meta.url).href },
];
export const SHOP_BACK_ICON_ASSET_URL = new URL("./assets/ui/shop/back.webp", import.meta.url).href;
export const SHOP_GOLD_COIN_ICON_ASSET_URL = new URL("./assets/ui/shop/gold-coin.webp", import.meta.url).href;
export const SHOP_XP_ICON_ASSET_URL = new URL("./assets/ui/shop/xp-icon.webp", import.meta.url).href;
export const SHOP_UPGRADE_ARROW_ICON_ASSET_URL = new URL("./assets/ui/shop/upgrade-arrow.webp", import.meta.url).href;
export const SHOP_CATEGORY_HEAD_ICON_ASSET_URL = new URL("./assets/ui/shop/category-head.webp", import.meta.url).href;
export const SHOP_CATEGORY_BODY_ICON_ASSET_URL = new URL("./assets/ui/shop/category-body.webp", import.meta.url).href;
export const SHOP_CATEGORY_ARMS_ICON_ASSET_URL = new URL("./assets/ui/shop/category-arms.webp", import.meta.url).href;
export const SHOP_CATEGORY_LEGS_ICON_ASSET_URL = new URL("./assets/ui/shop/category-legs.webp", import.meta.url).href;
export const SHOP_CATEGORY_SWORD_ICON_ASSET_URL = new URL("./assets/ui/shop/category-sword.webp", import.meta.url).href;
export const SHOP_CATEGORY_AXE_ICON_ASSET_URL = new URL("./assets/ui/shop/category-axe.webp", import.meta.url).href;
export const SHOP_CATEGORY_MACE_ICON_ASSET_URL = new URL("./assets/ui/shop/category-mace.webp", import.meta.url).href;
export const SHOP_CATEGORY_SPEAR_ICON_ASSET_URL = new URL("./assets/ui/shop/category-spear.webp", import.meta.url).href;
export const SHOP_CATEGORY_BOW_ICON_ASSET_URL = new URL("./assets/ui/shop/category-bow.webp", import.meta.url).href;
export const SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL = new URL("./assets/ui/shop/category-shuriken.webp", import.meta.url).href;

export const CITY_BACKGROUND_ASSET_KEY = "city-menu-bg";
export const CITY_BACKGROUND_ASSET_URL = new URL("./assets/menu/main-city.webp", import.meta.url).href;
export const CITY_DAY_BACKGROUND_ASSET_KEY = "city-menu-bg-day";
export const CITY_DAY_BACKGROUND_ASSET_URL = new URL("./assets/menu/main-city-day.webp", import.meta.url).href;
export const CITY_SHOP_BACKGROUND_ASSET_KEY = "city-shop-bg";
export const CITY_SHOP_BACKGROUND_ASSET_URL = new URL("./assets/menu/city-shop.webp", import.meta.url).href;
export const CITY_MAGIC_SHOP_BACKGROUND_ASSET_KEY = "city-magic-shop-bg";
export const CITY_MAGIC_SHOP_BACKGROUND_ASSET_URL = new URL("./assets/menu/magic-shop.webp", import.meta.url).href;
export const MAGIC_SHOP_TITLE_FRAME_ASSET_URL = new URL("./assets/ui/magic-shop/magic-shop-title-frame.webp", import.meta.url).href;
export const MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL = new URL("./assets/ui/magic-shop/magic-shop-selected-card-frame.webp", import.meta.url).href;
export const MAGIC_SHOP_SCROLL_CAPACITY_UPGRADE_ICON_URL = new URL("./assets/ui/magic-shop/scroll-capacity-upgrade.webp", import.meta.url).href;
export const CITY_ARMORY_BACKGROUND_ASSET_KEY = CITY_SHOP_BACKGROUND_ASSET_KEY;
export const CITY_ARMORY_BACKGROUND_ASSET_URL = CITY_SHOP_BACKGROUND_ASSET_URL;
export const CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY = CITY_SHOP_BACKGROUND_ASSET_KEY;
export const CITY_WEAPON_SHOP_BACKGROUND_ASSET_URL = CITY_SHOP_BACKGROUND_ASSET_URL;
export const CITY_CLOUD_ASSETS = [
  { key: "city-cloud-01", url: new URL("./assets/clouds/cloud-01.webp", import.meta.url).href },
  { key: "city-cloud-02", url: new URL("./assets/clouds/cloud-02.webp", import.meta.url).href },
  { key: "city-cloud-03", url: new URL("./assets/clouds/cloud-03.webp", import.meta.url).href },
  { key: "city-cloud-04", url: new URL("./assets/clouds/cloud-04.webp", import.meta.url).href },
] as const;

export const PLAYER_BODY_ASSET_KEY = "body-light-01";
export const PLAYER_BODY_ASSET_URL = new URL("./assets/fighters/bodies/body-light-01.webp", import.meta.url).href;
export const PLAYER_AVATAR_DISPLAY_HEIGHT = 116;
export const PLAYER_AVATAR_FEET_Y_OFFSET = 132;

export const FIGHTER_TORSO_LIGHT_ASSET_KEY = "torso-light-01";
export const FIGHTER_TORSO_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/torso/torso-light-01.webp", import.meta.url).href;
export const FIGHTER_TORSO_DUMMY_ASSET_KEY = "torso-dummy-01";
export const FIGHTER_TORSO_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/torso/torso-dummy-01.webp", import.meta.url).href;
export const FIGHTER_HEAD_LIGHT_ASSET_KEY = "head-light-01";
export const FIGHTER_HEAD_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/head/head-light-01.webp", import.meta.url).href;
export const FIGHTER_HEAD_DUMMY_ASSET_KEY = "head-dummy-01";
export const FIGHTER_HEAD_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/head/head-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_KEY = "face-dummy-pupil-left";
export const FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_URL = new URL("./assets/fighters/body-parts/face/pupil-left.webp", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_KEY = "face-dummy-pupil-right";
export const FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/face/pupil-right.webp", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY = "face-dummy-brow-left";
export const FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_URL = new URL("./assets/fighters/body-parts/face/brow-left-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY = "face-dummy-brow-right";
export const FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/face/brow-right-dummy-01.webp", import.meta.url).href;

export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY = "back-upper-arm-light-01";
export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY = "back-upper-arm-dummy-01";
export const FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-upper-arm-dummy-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY = "back-forearm-light-01";
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOREARM_DUMMY_ASSET_KEY = "back-forearm-dummy-01";
export const FIGHTER_BACK_FOREARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-forearm-dummy-01.webp", import.meta.url).href;
export const FIGHTER_BACK_HAND_LIGHT_ASSET_KEY = "back-hand-light-01";
export const FIGHTER_BACK_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-hand-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_HAND_DUMMY_ASSET_KEY = "back-hand-dummy-01";
export const FIGHTER_BACK_HAND_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-hand-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY = "front-upper-arm-light-01";
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_KEY = "front-upper-arm-dummy-01";
export const FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-upper-arm-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY = "front-forearm-light-01";
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOREARM_DUMMY_ASSET_KEY = "front-forearm-dummy-01";
export const FIGHTER_FRONT_FOREARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-forearm-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY = "front-hand-light-01";
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-hand-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY = "front-hand-dummy-01";
export const FIGHTER_FRONT_HAND_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-hand-dummy-01.webp", import.meta.url).href;

export const FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY = "back-thigh-light-01";
export const FIGHTER_BACK_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY = "back-thigh-dummy-01";
export const FIGHTER_BACK_THIGH_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-thigh-dummy-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY = "back-shin-light-01";
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHIN_DUMMY_ASSET_KEY = "back-shin-dummy-01";
export const FIGHTER_BACK_SHIN_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-shin-dummy-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY = "back-foot-light-01";
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-foot-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOOT_DUMMY_ASSET_KEY = "back-foot-dummy-01";
export const FIGHTER_BACK_FOOT_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-foot-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY = "front-thigh-light-01";
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_THIGH_DUMMY_ASSET_KEY = "front-thigh-dummy-01";
export const FIGHTER_FRONT_THIGH_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-thigh-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY = "front-shin-light-01";
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHIN_DUMMY_ASSET_KEY = "front-shin-dummy-01";
export const FIGHTER_FRONT_SHIN_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-shin-dummy-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY = "front-foot-light-01";
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-foot-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY = "front-foot-dummy-01";
export const FIGHTER_FRONT_FOOT_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-foot-dummy-01.webp", import.meta.url).href;

export const FIGHTER_WEAPON_SWORD_01_ASSET_KEY = "weapon-sword-01";
export const FIGHTER_WEAPON_SWORD_01_ASSET_URL = new URL("./assets/fighters/weapons/weapon-sword-01.webp", import.meta.url).href;

export const FIGHTER_HELMET_LEATHER_ASSET_KEY = "helmet-leather-01";
export const FIGHTER_HELMET_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/helmet/helmet-leather-01.webp", import.meta.url).href;

export const FIGHTER_BREASTPLATE_LEATHER_ASSET_KEY = "breastplate-leather-01";
export const FIGHTER_BREASTPLATE_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/breastplate/breastplate-leather-01.webp", import.meta.url).href;
export const FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY = "breastplate-cloth-01";
export const FIGHTER_BREASTPLATE_CLOTH_ASSET_URL = new URL("./assets/fighters/armor/breastplate/breastplate-cloth-01.webp", import.meta.url).href;

export const FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_KEY = "back-shoulderguard-leather-01";
export const FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/arms/back-shoulderguard-leather-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_KEY = "front-shoulderguard-leather-01";
export const FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/arms/front-shoulderguard-leather-01.webp", import.meta.url).href;
export const FIGHTER_BACK_WRIST_LEATHER_ASSET_KEY = "back-wrist-leather-01";
export const FIGHTER_BACK_WRIST_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/arms/back-wrist-leather-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_WRIST_LEATHER_ASSET_KEY = "front-wrist-leather-01";
export const FIGHTER_FRONT_WRIST_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/arms/front-wrist-leather-01.webp", import.meta.url).href;

export const FIGHTER_BACK_GREAVE_LEATHER_ASSET_KEY = "back-greave-leather-01";
export const FIGHTER_BACK_GREAVE_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/back-greave-leather-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_GREAVE_LEATHER_ASSET_KEY = "front-greave-leather-01";
export const FIGHTER_FRONT_GREAVE_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/front-greave-leather-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_KEY = "back-shinguard-leather-01";
export const FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/back-shinguard-leather-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_KEY = "front-shinguard-leather-01";
export const FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/front-shinguard-leather-01.webp", import.meta.url).href;
export const FIGHTER_BACK_BOOT_LEATHER_ASSET_KEY = "back-boot-leather-01";
export const FIGHTER_BACK_BOOT_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/back-boot-leather-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_BOOT_LEATHER_ASSET_KEY = "front-boot-leather-01";
export const FIGHTER_FRONT_BOOT_LEATHER_ASSET_URL = new URL("./assets/fighters/armor/legs/front-boot-leather-01.webp", import.meta.url).href;

export const FIGHTER_LOW_RES_ASSET_KEY_SUFFIX = "-low";
export const FIGHTER_PAPER_DOLL_ASSETS = [
  {
    key: FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/back-upper-arm-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/back-forearm-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_FOREARM_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_FOREARM_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_FOREARM_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_HAND_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/back-hand-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_HAND_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_HAND_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_HAND_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_THIGH_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/back-thigh-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_THIGH_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_THIGH_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_SHIN_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/back-shin-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_SHIN_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_SHIN_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_SHIN_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
    url: FIGHTER_BACK_FOOT_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/back-foot-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_FOOT_DUMMY_ASSET_KEY,
    url: FIGHTER_BACK_FOOT_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_BACK_FOOT_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/front-upper-arm-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/front-forearm-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_FOREARM_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_FOREARM_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_FOREARM_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_HAND_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/arms/front-hand-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_HAND_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_HAND_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/front-thigh-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_THIGH_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_THIGH_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_THIGH_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/front-shin-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_SHIN_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_SHIN_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_SHIN_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
    url: FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/legs/front-foot-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY,
    url: FIGHTER_FRONT_FOOT_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_FRONT_FOOT_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_HEAD_LIGHT_ASSET_KEY,
    url: FIGHTER_HEAD_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/head/head-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_HEAD_DUMMY_ASSET_KEY,
    url: FIGHTER_HEAD_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_HEAD_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_KEY,
    url: FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_URL,
    lowUrl: FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_URL,
  },
  {
    key: FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_KEY,
    url: FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_URL,
    lowUrl: FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_URL,
  },
  {
    key: FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY,
    url: FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_URL,
    lowUrl: FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_URL,
  },
  {
    key: FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY,
    url: FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_URL,
    lowUrl: FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_URL,
  },
  {
    key: FIGHTER_TORSO_LIGHT_ASSET_KEY,
    url: FIGHTER_TORSO_LIGHT_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/body-parts/torso/torso-light-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_TORSO_DUMMY_ASSET_KEY,
    url: FIGHTER_TORSO_DUMMY_ASSET_URL,
    lowUrl: FIGHTER_TORSO_DUMMY_ASSET_URL,
  },
  {
    key: FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
    url: FIGHTER_WEAPON_SWORD_01_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/weapons/weapon-sword-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_HELMET_LEATHER_ASSET_KEY,
    url: FIGHTER_HELMET_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/helmet/helmet-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BREASTPLATE_LEATHER_ASSET_KEY,
    url: FIGHTER_BREASTPLATE_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/breastplate/breastplate-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY,
    url: FIGHTER_BREASTPLATE_CLOTH_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/breastplate/breastplate-cloth-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_KEY,
    url: FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/arms/back-shoulderguard-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_KEY,
    url: FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/arms/front-shoulderguard-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_WRIST_LEATHER_ASSET_KEY,
    url: FIGHTER_BACK_WRIST_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/arms/back-wrist-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_WRIST_LEATHER_ASSET_KEY,
    url: FIGHTER_FRONT_WRIST_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/arms/front-wrist-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_GREAVE_LEATHER_ASSET_KEY,
    url: FIGHTER_BACK_GREAVE_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/back-greave-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_GREAVE_LEATHER_ASSET_KEY,
    url: FIGHTER_FRONT_GREAVE_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/front-greave-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_KEY,
    url: FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/back-shinguard-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_KEY,
    url: FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/front-shinguard-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_BACK_BOOT_LEATHER_ASSET_KEY,
    url: FIGHTER_BACK_BOOT_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/back-boot-leather-01.webp", import.meta.url).href,
  },
  {
    key: FIGHTER_FRONT_BOOT_LEATHER_ASSET_KEY,
    url: FIGHTER_FRONT_BOOT_LEATHER_ASSET_URL,
    lowUrl: new URL("./assets-low/fighters/armor/legs/front-boot-leather-01.webp", import.meta.url).href,
  },
] as const;

export function getFighterTextureKey(assetKey: string, lowRes: boolean): string {
  return lowRes ? `${assetKey}${FIGHTER_LOW_RES_ASSET_KEY_SUFFIX}` : assetKey;
}
