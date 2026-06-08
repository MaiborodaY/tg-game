export { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";

export const ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY = "arena-bg-back-layer";
export const ARENA_BACKGROUND_BACK_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-back.png", import.meta.url).href;
export const ARENA_BACKGROUND_MID_LAYER_ASSET_KEY = "arena-bg-mid-layer";
export const ARENA_BACKGROUND_MID_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-mid.png", import.meta.url).href;
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY = "arena-bg-ground-layer";
export const ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL = new URL("./assets/arena/layers/arena-ground.png", import.meta.url).href;

export const CITY_BACKGROUND_ASSET_KEY = "city-menu-bg";
export const CITY_BACKGROUND_ASSET_URL = new URL("./assets/menu/main-city.webp", import.meta.url).href;
export const CITY_ARMORY_BACKGROUND_ASSET_KEY = "city-armory-bg";
export const CITY_ARMORY_BACKGROUND_ASSET_URL = new URL("./assets/menu/city-armory.webp", import.meta.url).href;
export const CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY = "city-weapon-shop-bg";
export const CITY_WEAPON_SHOP_BACKGROUND_ASSET_URL = new URL("./assets/menu/city-weapon-shop.webp", import.meta.url).href;
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
export const FIGHTER_HEAD_LIGHT_ASSET_KEY = "head-light-01";
export const FIGHTER_HEAD_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/head/head-light-01.webp", import.meta.url).href;

export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY = "back-upper-arm-light-01";
export const FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY = "back-forearm-light-01";
export const FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_HAND_LIGHT_ASSET_KEY = "back-hand-light-01";
export const FIGHTER_BACK_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/back-hand-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY = "front-upper-arm-light-01";
export const FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-upper-arm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY = "front-forearm-light-01";
export const FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-forearm-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY = "front-hand-light-01";
export const FIGHTER_FRONT_HAND_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/arms/front-hand-light-01.webp", import.meta.url).href;

export const FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY = "back-thigh-light-01";
export const FIGHTER_BACK_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY = "back-shin-light-01";
export const FIGHTER_BACK_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY = "back-foot-light-01";
export const FIGHTER_BACK_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/back-foot-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY = "front-thigh-light-01";
export const FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-thigh-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY = "front-shin-light-01";
export const FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-shin-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY = "front-foot-light-01";
export const FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/body-parts/legs/front-foot-light-01.webp", import.meta.url).href;

export const FIGHTER_WEAPON_SWORD_01_ASSET_KEY = "weapon-sword-01";
export const FIGHTER_WEAPON_SWORD_01_ASSET_URL = new URL("./assets/fighters/weapons/weapon-sword-01.webp", import.meta.url).href;

export const FIGHTER_HELMET_LIGHT_ASSET_KEY = "helmet-light-01";
export const FIGHTER_HELMET_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/helmet/helmet-light-01.webp", import.meta.url).href;

export const FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY = "breastplate-light-01";
export const FIGHTER_BREASTPLATE_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/breastplate/breastplate-light-01.webp", import.meta.url).href;

export const FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY = "back-shoulderguard-light-01";
export const FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/arms/back-shoulderguard-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY = "front-shoulderguard-light-01";
export const FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/arms/front-shoulderguard-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_KEY = "back-gauntlet-light-01";
export const FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/arms/back-gauntlet-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_KEY = "front-gauntlet-light-01";
export const FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/arms/front-gauntlet-light-01.webp", import.meta.url).href;

export const FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY = "back-greave-light-01";
export const FIGHTER_BACK_GREAVE_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/back-greave-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY = "front-greave-light-01";
export const FIGHTER_FRONT_GREAVE_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/front-greave-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY = "back-shinguard-light-01";
export const FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/back-shinguard-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY = "front-shinguard-light-01";
export const FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/front-shinguard-light-01.webp", import.meta.url).href;
export const FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY = "back-boot-light-01";
export const FIGHTER_BACK_BOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/back-boot-light-01.webp", import.meta.url).href;
export const FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY = "front-boot-light-01";
export const FIGHTER_FRONT_BOOT_LIGHT_ASSET_URL = new URL("./assets/fighters/armor/legs/front-boot-light-01.webp", import.meta.url).href;
