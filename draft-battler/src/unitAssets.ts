import type { CardId } from "./game";

export interface UnitAsset {
  key: string;
  path: string;
  spriteSheet?: {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
  };
}

const UNIT_ASSETS: Partial<Record<CardId, UnitAsset>> = {
  iron_guard: {
    key: "unit:iron_guard",
    path: "assets/units/iron_guard/unit.png",
    spriteSheet: {
      key: "unit:iron_guard:poses",
      path: "assets/units/iron_guard/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  shieldbearer: {
    key: "unit:shieldbearer",
    path: "assets/units/shieldbearer/unit.png",
    spriteSheet: {
      key: "unit:shieldbearer:poses",
      path: "assets/units/shieldbearer/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  boar_rider: {
    key: "unit:boar_rider",
    path: "assets/units/boar_rider/unit.png",
    spriteSheet: {
      key: "unit:boar_rider:poses",
      path: "assets/units/boar_rider/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  sneakblade: {
    key: "unit:sneakblade",
    path: "assets/units/sneakblade/unit.png",
    spriteSheet: {
      key: "unit:sneakblade:poses",
      path: "assets/units/sneakblade/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  spear_recruit: {
    key: "unit:spear_recruit",
    path: "assets/units/spear_recruit/unit.png",
    spriteSheet: {
      key: "unit:spear_recruit:poses",
      path: "assets/units/spear_recruit/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  longbow_hunter: {
    key: "unit:longbow_hunter",
    path: "assets/units/longbow_hunter/unit.png",
    spriteSheet: {
      key: "unit:longbow_hunter:poses",
      path: "assets/units/longbow_hunter/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  ember_mage: {
    key: "unit:ember_mage",
    path: "assets/units/ember_mage/unit.png",
    spriteSheet: {
      key: "unit:ember_mage:poses",
      path: "assets/units/ember_mage/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  grave_binder: {
    key: "unit:grave_binder",
    path: "assets/units/grave_binder/unit.png",
    spriteSheet: {
      key: "unit:grave_binder:poses",
      path: "assets/units/grave_binder/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  duelist: {
    key: "unit:duelist",
    path: "assets/units/duelist/unit.png",
    spriteSheet: {
      key: "unit:duelist:poses",
      path: "assets/units/duelist/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  bone_soldier: {
    key: "unit:bone_soldier",
    path: "assets/units/bone_soldier/unit.png",
    spriteSheet: {
      key: "unit:bone_soldier:poses",
      path: "assets/units/bone_soldier/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  field_cleric: {
    key: "unit:field_cleric",
    path: "assets/units/field_cleric/unit.png",
    spriteSheet: {
      key: "unit:field_cleric:poses",
      path: "assets/units/field_cleric/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
  wolfhound: {
    key: "unit:wolfhound",
    path: "assets/units/wolfhound/unit.png",
    spriteSheet: {
      key: "unit:wolfhound:poses",
      path: "assets/units/wolfhound/sprite-sheet.png",
      frameWidth: 256,
      frameHeight: 256,
    },
  },
};

export function getUnitAsset(cardId: CardId): UnitAsset | undefined {
  return UNIT_ASSETS[cardId];
}

export function getUnitCardAssetPath(cardId: CardId): string | undefined {
  return getUnitAsset(cardId)?.path.replace(/\/unit\.png$/, "/card.png");
}

export function getUnitAssets(): UnitAsset[] {
  return Object.values(UNIT_ASSETS).filter((asset): asset is UnitAsset => Boolean(asset));
}
