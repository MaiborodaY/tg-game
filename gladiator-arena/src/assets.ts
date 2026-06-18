export { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";

export const ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY = "arena-bg-back-layer";
export const ARENA_BACKGROUND_BACK_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-back.webp", import.meta.url).href;
export const ARENA_BACKGROUND_MID_LAYER_ASSET_KEY = "arena-bg-mid-layer";
export const ARENA_BACKGROUND_MID_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-mid.webp", import.meta.url).href;
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY = "arena-bg-ground-layer";
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-ground.webp", import.meta.url).href;

export const DAMAGE_BLOCK_ICON_ASSET_KEY = "damage-block-icon";
export const DAMAGE_BLOCK_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-block.webp", import.meta.url).href;
export const DAMAGE_HIT_ICON_ASSET_KEY = "damage-hit-icon";
export const DAMAGE_HIT_ICON_ASSET_URL = new URL("./assets/ui/damage-icons/damage-hit.webp", import.meta.url).href;
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
export const REST_HEALTH_ICON_ASSET_KEY = "rest-health-icon";
export const REST_HEALTH_ICON_ASSET_URL = new URL("./assets/ui/profile/stat-health.webp", import.meta.url).href;
export const REST_STAMINA_ICON_ASSET_KEY = "rest-stamina-icon";
export const REST_STAMINA_ICON_ASSET_URL = new URL("./assets/ui/profile/stat-stamina.webp", import.meta.url).href;
export const SHOP_BACK_ICON_ASSET_URL = new URL("./assets/ui/shop/back.webp", import.meta.url).href;
export const SHOP_GOLD_COIN_ICON_ASSET_URL = new URL("./assets/ui/shop/gold-coin.webp", import.meta.url).href;
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
export const FIGHTER_TORSO_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/torso/torso-dummy-01.png", import.meta.url).href;
export const FIGHTER_HEAD_LIGHT_ASSET_KEY = "head-light-01";
export const FIGHTER_HEAD_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/head/head-light-01.webp", import.meta.url).href;
export const FIGHTER_HEAD_DUMMY_ASSET_KEY = "head-dummy-01";
export const FIGHTER_HEAD_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/head/head-dummy-01.png", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_KEY = "face-dummy-pupil-left";
export const FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_URL = new URL("./assets/fighters/body-parts/face/pupil-left.png", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_KEY = "face-dummy-pupil-right";
export const FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/face/pupil-right.png", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY = "face-dummy-brow-left";
export const FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_URL = new URL("./assets/fighters/body-parts/face/brow-left-dummy-01.png", import.meta.url).href;
export const FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY = "face-dummy-brow-right";
export const FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/face/brow-right-dummy-01.png", import.meta.url).href;

export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY = "back-upper-arm-light-01";
export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY = "back-upper-arm-dummy-01";
export const FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-upper-arm-dummy-01.png", import.meta.url).href;
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY = "back-forearm-light-01";
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOREARM_DUMMY_ASSET_KEY = "back-forearm-dummy-01";
export const FIGHTER_BACK_FOREARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-forearm-dummy-01.png", import.meta.url).href;
export const FIGHTER_BACK_HAND_LIGHT_ASSET_KEY = "back-hand-light-01";
export const FIGHTER_BACK_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-hand-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_HAND_DUMMY_ASSET_KEY = "back-hand-dummy-01";
export const FIGHTER_BACK_HAND_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-hand-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY = "front-upper-arm-light-01";
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_KEY = "front-upper-arm-dummy-01";
export const FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-upper-arm-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY = "front-forearm-light-01";
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOREARM_DUMMY_ASSET_KEY = "front-forearm-dummy-01";
export const FIGHTER_FRONT_FOREARM_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-forearm-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY = "front-hand-light-01";
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-hand-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY = "front-hand-dummy-01";
export const FIGHTER_FRONT_HAND_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-hand-dummy-01.png", import.meta.url).href;

export const FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY = "back-thigh-light-01";
export const FIGHTER_BACK_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY = "back-thigh-dummy-01";
export const FIGHTER_BACK_THIGH_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-thigh-dummy-01.png", import.meta.url).href;
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY = "back-shin-light-01";
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHIN_DUMMY_ASSET_KEY = "back-shin-dummy-01";
export const FIGHTER_BACK_SHIN_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-shin-dummy-01.png", import.meta.url).href;
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY = "back-foot-light-01";
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-foot-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOOT_DUMMY_ASSET_KEY = "back-foot-dummy-01";
export const FIGHTER_BACK_FOOT_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-foot-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY = "front-thigh-light-01";
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_THIGH_DUMMY_ASSET_KEY = "front-thigh-dummy-01";
export const FIGHTER_FRONT_THIGH_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-thigh-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY = "front-shin-light-01";
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHIN_DUMMY_ASSET_KEY = "front-shin-dummy-01";
export const FIGHTER_FRONT_SHIN_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-shin-dummy-01.png", import.meta.url).href;
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY = "front-foot-light-01";
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-foot-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY = "front-foot-dummy-01";
export const FIGHTER_FRONT_FOOT_DUMMY_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-foot-dummy-01.png", import.meta.url).href;

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
