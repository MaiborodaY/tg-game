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

const UNIT_ASSETS: Partial<Record<CardId, UnitAsset>> = {
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
