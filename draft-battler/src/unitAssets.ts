import type { CardId } from "./game";

export interface UnitAsset {
  key: string;
  path: string;
  cardPath: string;
  spriteSheet?: {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
  };
}

const UNIT_SPRITE_FRAME_SIZE = 128;

const UNIT_ASSETS: Record<CardId, UnitAsset> = {
  iron_guard: {
    key: "unit:iron_guard",
    path: new URL("./assets/units/iron_guard/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/iron_guard/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:iron_guard:poses",
      path: new URL("./assets/units/iron_guard/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  shieldbearer: {
    key: "unit:shieldbearer",
    path: new URL("./assets/units/shieldbearer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/shieldbearer/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:shieldbearer:poses",
      path: new URL("./assets/units/shieldbearer/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  boar_rider: {
    key: "unit:boar_rider",
    path: new URL("./assets/units/boar_rider/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/boar_rider/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:boar_rider:poses",
      path: new URL("./assets/units/boar_rider/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  sneakblade: {
    key: "unit:sneakblade",
    path: new URL("./assets/units/sneakblade/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/sneakblade/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:sneakblade:poses",
      path: new URL("./assets/units/sneakblade/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  spear_recruit: {
    key: "unit:spear_recruit",
    path: new URL("./assets/units/spear_recruit/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/spear_recruit/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:spear_recruit:poses",
      path: new URL("./assets/units/spear_recruit/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  longbow_hunter: {
    key: "unit:longbow_hunter",
    path: new URL("./assets/units/longbow_hunter/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/longbow_hunter/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:longbow_hunter:poses",
      path: new URL("./assets/units/longbow_hunter/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  ember_mage: {
    key: "unit:ember_mage",
    path: new URL("./assets/units/ember_mage/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/ember_mage/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:ember_mage:poses",
      path: new URL("./assets/units/ember_mage/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  frost_acolyte: {
    key: "unit:frost_acolyte",
    path: new URL("./assets/units/frost_acolyte/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/frost_acolyte/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:frost_acolyte:poses",
      path: new URL("./assets/units/frost_acolyte/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  grave_binder: {
    key: "unit:grave_binder",
    path: new URL("./assets/units/grave_binder/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/grave_binder/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:grave_binder:poses",
      path: new URL("./assets/units/grave_binder/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  duelist: {
    key: "unit:duelist",
    path: new URL("./assets/units/duelist/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/duelist/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:duelist:poses",
      path: new URL("./assets/units/duelist/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  bone_soldier: {
    key: "unit:bone_soldier",
    path: new URL("./assets/units/bone_soldier/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/bone_soldier/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:bone_soldier:poses",
      path: new URL("./assets/units/bone_soldier/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  witch_doctor: {
    key: "unit:witch_doctor",
    path: new URL("./assets/units/witch_doctor/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/witch_doctor/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:witch_doctor:poses",
      path: new URL("./assets/units/witch_doctor/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  field_cleric: {
    key: "unit:field_cleric",
    path: new URL("./assets/units/field_cleric/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/field_cleric/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:field_cleric:poses",
      path: new URL("./assets/units/field_cleric/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  wolfhound: {
    key: "unit:wolfhound",
    path: new URL("./assets/units/wolfhound/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/wolfhound/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:wolfhound:poses",
      path: new URL("./assets/units/wolfhound/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  thorn_druid: {
    key: "unit:thorn_druid",
    path: new URL("./assets/units/thorn_druid/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/thorn_druid/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:thorn_druid:poses",
      path: new URL("./assets/units/thorn_druid/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  stone_golem: {
    key: "unit:stone_golem",
    path: new URL("./assets/units/stone_golem/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/stone_golem/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:stone_golem:poses",
      path: new URL("./assets/units/stone_golem/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  pyromancer: {
    key: "unit:pyromancer",
    path: new URL("./assets/units/pyromancer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/pyromancer/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:pyromancer:poses",
      path: new URL("./assets/units/pyromancer/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  banner_knight: {
    key: "unit:banner_knight",
    path: new URL("./assets/units/banner_knight/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/banner_knight/card.webp", import.meta.url).href,
    spriteSheet: {
      key: "unit:banner_knight:poses",
      path: new URL("./assets/units/banner_knight/sprite-sheet.webp", import.meta.url).href,
      frameWidth: UNIT_SPRITE_FRAME_SIZE,
      frameHeight: UNIT_SPRITE_FRAME_SIZE,
    },
  },
  bone_archer: {
    key: "unit:bone_archer",
    path: new URL("./assets/units/bone_archer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/bone_archer/card.webp", import.meta.url).href,
  },
  plague_rat: {
    key: "unit:plague_rat",
    path: new URL("./assets/units/plague_rat/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/plague_rat/card.webp", import.meta.url).href,
  },
  rune_warden: {
    key: "unit:rune_warden",
    path: new URL("./assets/units/rune_warden/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/rune_warden/card.webp", import.meta.url).href,
  },
  forest_skirmisher: {
    key: "unit:forest_skirmisher",
    path: new URL("./assets/units/forest_skirmisher/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/forest_skirmisher/card.webp", import.meta.url).href,
  },
  marsh_stalker: {
    key: "unit:marsh_stalker",
    path: new URL("./assets/units/marsh_stalker/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/marsh_stalker/card.webp", import.meta.url).href,
  },
  crypt_keeper: {
    key: "unit:crypt_keeper",
    path: new URL("./assets/units/crypt_keeper/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/crypt_keeper/card.webp", import.meta.url).href,
  },
  battle_alchemist: {
    key: "unit:battle_alchemist",
    path: new URL("./assets/units/battle_alchemist/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/battle_alchemist/card.webp", import.meta.url).href,
  },
  night_warden: {
    key: "unit:night_warden",
    path: new URL("./assets/units/night_warden/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/night_warden/card.webp", import.meta.url).href,
  },
  grave_raider: {
    key: "unit:grave_raider",
    path: new URL("./assets/units/grave_raider/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/grave_raider/card.webp", import.meta.url).href,
  },
  frost_wraith: {
    key: "unit:frost_wraith",
    path: new URL("./assets/units/frost_wraith/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/frost_wraith/card.webp", import.meta.url).href,
  },
  ironhide_bear: {
    key: "unit:ironhide_bear",
    path: new URL("./assets/units/ironhide_bear/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/ironhide_bear/card.webp", import.meta.url).href,
  },
  soul_hunter: {
    key: "unit:soul_hunter",
    path: new URL("./assets/units/soul_hunter/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/soul_hunter/card.webp", import.meta.url).href,
  },
  city_crossbowman: {
    key: "unit:city_crossbowman",
    path: new URL("./assets/units/city_crossbowman/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/city_crossbowman/card.webp", import.meta.url).href,
  },
  harpy_scout: {
    key: "unit:harpy_scout",
    path: new URL("./assets/units/harpy_scout/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/harpy_scout/card.webp", import.meta.url).href,
  },
  smoke_trickster: {
    key: "unit:smoke_trickster",
    path: new URL("./assets/units/smoke_trickster/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/smoke_trickster/card.webp", import.meta.url).href,
  },
  war_mastiff: {
    key: "unit:war_mastiff",
    path: new URL("./assets/units/war_mastiff/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/war_mastiff/card.webp", import.meta.url).href,
  },
  grave_bellringer: {
    key: "unit:grave_bellringer",
    path: new URL("./assets/units/grave_bellringer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/grave_bellringer/card.webp", import.meta.url).href,
  },
  moon_priestess: {
    key: "unit:moon_priestess",
    path: new URL("./assets/units/moon_priestess/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/moon_priestess/card.webp", import.meta.url).href,
  },
  phantom_duelist: {
    key: "unit:phantom_duelist",
    path: new URL("./assets/units/phantom_duelist/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/phantom_duelist/card.webp", import.meta.url).href,
  },
  siege_engineer: {
    key: "unit:siege_engineer",
    path: new URL("./assets/units/siege_engineer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/siege_engineer/card.webp", import.meta.url).href,
  },
  bronze_minotaur: {
    key: "unit:bronze_minotaur",
    path: new URL("./assets/units/bronze_minotaur/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/bronze_minotaur/card.webp", import.meta.url).href,
  },
  headless_knight: {
    key: "unit:headless_knight",
    path: new URL("./assets/units/headless_knight/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/headless_knight/card.webp", import.meta.url).href,
  },
  star_seer: {
    key: "unit:star_seer",
    path: new URL("./assets/units/star_seer/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/star_seer/card.webp", import.meta.url).href,
  },
  war_chaplain: {
    key: "unit:war_chaplain",
    path: new URL("./assets/units/war_chaplain/unit.webp", import.meta.url).href,
    cardPath: new URL("./assets/units/war_chaplain/card.webp", import.meta.url).href,
  },
};

export function getUnitAsset(cardId: CardId): UnitAsset | undefined {
  return UNIT_ASSETS[cardId];
}

export function getUnitCardAssetPath(cardId: CardId): string | undefined {
  return getUnitAsset(cardId)?.cardPath;
}

export function getUnitAssets(): UnitAsset[] {
  return Object.values(UNIT_ASSETS).filter((asset): asset is UnitAsset => Boolean(asset));
}
