import type { EquipmentAssetDefinition, EquipmentItemAssetKeys } from "../equipmentAssetRegistry";
import type { EquipmentTuning } from "../debugTuning";
import type { HeroItemDefinition, HeroItemId } from "../hero";

export interface GeneratedArmoryProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  categoryId: string;
}

export interface GeneratedWeaponProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  categoryId: string;
}

export interface GeneratedEquipmentItemRecord {
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  equipmentTuning?: EquipmentTuning;
  asset: EquipmentAssetDefinition;
  armoryProduct?: GeneratedArmoryProduct;
  weaponProduct?: GeneratedWeaponProduct;
}

export const GENERATED_EQUIPMENT_ITEM_RECORDS: readonly GeneratedEquipmentItemRecord[] = [
  {
    item: {"id":"generated_equipment_helmet_chainmail_01","name":"Chainmail Coif 01","kind":"armor","armorCategory":"chain","equipmentSlot":"helmet","armorHp":4},
    assetKeys: {"helmetAssetKey":"helmet-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-chainmail-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_helmet_chainmail_01","name":"Chainmail Coif 01","price":0,"itemIds":["generated_equipment_helmet_chainmail_01"],"categoryId":"head"},
  },
  {
    item: {"id":"generated_equipment_helmet_cloth_01","name":"Cloth Helmet 01","kind":"armor","armorCategory":"cloth","equipmentSlot":"helmet","armorHp":1},
    assetKeys: {"helmetAssetKey":"helmet-cloth-01"},
    equipmentTuning: {"x":-1,"y":21,"angle":0,"scaleX":1.12,"scaleY":1.12,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-cloth-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_helmet_cloth_01","name":"Cloth Helmet 01","price":0,"itemIds":["generated_equipment_helmet_cloth_01"],"categoryId":"head"},
  },
  {
    item: {"id":"generated_equipment_helmet_cloth_02","name":"Cloth Helmet 02","kind":"armor","armorCategory":"cloth","equipmentSlot":"helmet","armorHp":2},
    assetKeys: {"helmetAssetKey":"helmet-cloth-02"},
    equipmentTuning: {"x":-1,"y":25,"angle":0,"scaleX":1.07,"scaleY":1.13,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-cloth-02",
      url: new URL("../assets/fighters/armor/helmet/helmet-cloth-02.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-cloth-02.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-cloth-02.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-cloth-02.webp",
    },
    armoryProduct: {"id":"generated_equipment_helmet_cloth_02","name":"Cloth Helmet 02","price":0,"itemIds":["generated_equipment_helmet_cloth_02"],"categoryId":"head"},
  },
  {
    item: {"id":"generated_equipment_breastplate_chainmail_01","name":"Chainmail Hauberk 01","kind":"armor","armorCategory":"chain","equipmentSlot":"breastplate","armorHp":4},
    assetKeys: {"breastplateAssetKey":"breastplate-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-chainmail-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_breastplate_chainmail_01","name":"Chainmail Hauberk 01","price":0,"itemIds":["generated_equipment_breastplate_chainmail_01"],"categoryId":"chest"},
  },
  {
    item: {"id":"generated_equipment_back_shoulderguard_chainmail_01","name":"Chainmail Back Shoulderguard 01","kind":"armor","armorCategory":"chain","equipmentSlot":"backShoulderguard","armorHp":4},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-shoulderguard-chainmail-01",
      url: new URL("../assets/fighters/armor/arms/back-shoulderguard-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-shoulderguard-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-shoulderguard-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-shoulderguard-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_shoulderguard_chainmail_01","name":"Chainmail Back Shoulderguard 01","price":0,"itemIds":["generated_equipment_back_shoulderguard_chainmail_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_front_shoulderguard_chainmail_01","name":"Chainmail Front Shoulderguard 01","kind":"armor","armorCategory":"chain","equipmentSlot":"frontShoulderguard","armorHp":4},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-shoulderguard-chainmail-01",
      url: new URL("../assets/fighters/armor/arms/front-shoulderguard-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-shoulderguard-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-shoulderguard-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-shoulderguard-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_shoulderguard_chainmail_01","name":"Chainmail Front Shoulderguard 01","price":0,"itemIds":["generated_equipment_front_shoulderguard_chainmail_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_back_shoulderguard_cloth_01","name":"Cloth Back Shoulderguard 01","kind":"armor","armorCategory":"cloth","equipmentSlot":"backShoulderguard","armorHp":1},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-cloth-01"},
    equipmentTuning: {"x":0,"y":47,"angle":7,"scaleX":1.98,"scaleY":1.23,"flipX":false,"flipY":false},
    asset: {
      key: "back-shoulderguard-cloth-01",
      url: new URL("../assets/fighters/armor/arms/back-shoulderguard-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-shoulderguard-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-shoulderguard-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-shoulderguard-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_shoulderguard_cloth_01","name":"Cloth Back Shoulderguard 01","price":0,"itemIds":["generated_equipment_back_shoulderguard_cloth_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_front_shoulderguard_cloth_01","name":"Cloth Front Shoulderguard 01","kind":"armor","armorCategory":"cloth","equipmentSlot":"frontShoulderguard","armorHp":1},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-cloth-01"},
    equipmentTuning: {"x":0,"y":47,"angle":7,"scaleX":1.98,"scaleY":1.23,"flipX":false,"flipY":false},
    asset: {
      key: "front-shoulderguard-cloth-01",
      url: new URL("../assets/fighters/armor/arms/front-shoulderguard-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-shoulderguard-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-shoulderguard-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-shoulderguard-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_shoulderguard_cloth_01","name":"Cloth Front Shoulderguard 01","price":0,"itemIds":["generated_equipment_front_shoulderguard_cloth_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_back_wrist_chainmail_01","name":"Chainmail Back Wrist 01","kind":"armor","armorCategory":"chain","equipmentSlot":"backWrist","armorHp":4},
    assetKeys: {"backWristAssetKey":"back-wrist-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-wrist-chainmail-01",
      url: new URL("../assets/fighters/armor/arms/back-wrist-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-wrist-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-wrist-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-wrist-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_wrist_chainmail_01","name":"Chainmail Back Wrist 01","price":0,"itemIds":["generated_equipment_back_wrist_chainmail_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_front_wrist_chainmail_01","name":"Chainmail Front Wrist 01","kind":"armor","armorCategory":"chain","equipmentSlot":"frontWrist","armorHp":4},
    assetKeys: {"frontWristAssetKey":"front-wrist-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-wrist-chainmail-01",
      url: new URL("../assets/fighters/armor/arms/front-wrist-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-wrist-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-wrist-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-wrist-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_wrist_chainmail_01","name":"Chainmail Front Wrist 01","price":0,"itemIds":["generated_equipment_front_wrist_chainmail_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_back_glove_cloth_01","name":"Cloth Back Glove 01","kind":"armor","armorCategory":"cloth","equipmentSlot":"backGlove","armorHp":1},
    assetKeys: {"backGloveAssetKey":"back-glove-cloth-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":0.6,"scaleY":0.6,"flipX":false,"flipY":false},
    asset: {
      key: "back-glove-cloth-01",
      url: new URL("../assets/fighters/armor/arms/back-glove-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-glove-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-glove-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-glove-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_glove_cloth_01","name":"Cloth Back Glove 01","price":0,"itemIds":["generated_equipment_back_glove_cloth_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_front_glove_cloth_01","name":"Cloth Front Glove 01","kind":"armor","armorCategory":"cloth","equipmentSlot":"frontGlove","armorHp":1},
    assetKeys: {"frontGloveAssetKey":"front-glove-cloth-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":0.6,"scaleY":0.6,"flipX":false,"flipY":false},
    asset: {
      key: "front-glove-cloth-01",
      url: new URL("../assets/fighters/armor/arms/front-glove-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-glove-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-glove-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-glove-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_glove_cloth_01","name":"Cloth Front Glove 01","price":0,"itemIds":["generated_equipment_front_glove_cloth_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_back_glove_chainmail_03","name":"Chainmail Back Glove 03","kind":"armor","armorCategory":"chain","equipmentSlot":"backGlove","armorHp":4},
    assetKeys: {"backGloveAssetKey":"back-glove-chainmail-03"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-glove-chainmail-03",
      url: new URL("../assets/fighters/armor/arms/back-glove-chainmail-03.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-glove-chainmail-03.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-glove-chainmail-03.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-glove-chainmail-03.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_glove_chainmail_03","name":"Chainmail Back Glove 03","price":0,"itemIds":["generated_equipment_back_glove_chainmail_03"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail Front Glove 03","kind":"armor","armorCategory":"chain","equipmentSlot":"frontGlove","armorHp":4},
    assetKeys: {"frontGloveAssetKey":"front-glove-chainmail-03"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-glove-chainmail-03",
      url: new URL("../assets/fighters/armor/arms/front-glove-chainmail-03.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-glove-chainmail-03.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-glove-chainmail-03.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-glove-chainmail-03.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail Front Glove 03","price":0,"itemIds":["generated_equipment_front_glove_chainmail_03"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_back_greave_chainmail_01","name":"Chainmail Back Greave 01","kind":"armor","armorCategory":"chain","equipmentSlot":"backGreave","armorHp":4},
    assetKeys: {"backGreaveAssetKey":"back-greave-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-greave-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/back-greave-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-greave-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-greave-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-greave-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_greave_chainmail_01","name":"Chainmail Back Greave 01","price":0,"itemIds":["generated_equipment_back_greave_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_greave_chainmail_01","name":"Chainmail Front Greave 01","kind":"armor","armorCategory":"chain","equipmentSlot":"frontGreave","armorHp":4},
    assetKeys: {"frontGreaveAssetKey":"front-greave-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-greave-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/front-greave-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-greave-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-greave-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-greave-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_greave_chainmail_01","name":"Chainmail Front Greave 01","price":0,"itemIds":["generated_equipment_front_greave_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_shinguard_chainmail_01","name":"Chainmail Back Shinguard 01","kind":"armor","armorCategory":"chain","equipmentSlot":"backShinguard","armorHp":4},
    assetKeys: {"backShinguardAssetKey":"back-shinguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-shinguard-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/back-shinguard-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-shinguard-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-shinguard-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-shinguard-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_shinguard_chainmail_01","name":"Chainmail Back Shinguard 01","price":0,"itemIds":["generated_equipment_back_shinguard_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_shinguard_chainmail_01","name":"Chainmail Front Shinguard 01","kind":"armor","armorCategory":"chain","equipmentSlot":"frontShinguard","armorHp":4},
    assetKeys: {"frontShinguardAssetKey":"front-shinguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-shinguard-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/front-shinguard-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-shinguard-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-shinguard-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-shinguard-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_shinguard_chainmail_01","name":"Chainmail Front Shinguard 01","price":0,"itemIds":["generated_equipment_front_shinguard_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_boot_chainmail_01","name":"Chainmail Back Boot 01","kind":"armor","armorCategory":"chain","equipmentSlot":"backBoot","armorHp":4},
    assetKeys: {"backBootAssetKey":"back-boot-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-boot-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/back-boot-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-boot-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-boot-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-boot-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_boot_chainmail_01","name":"Chainmail Back Boot 01","price":0,"itemIds":["generated_equipment_back_boot_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_boot_chainmail_01","name":"Chainmail Front Boot 01","kind":"armor","armorCategory":"chain","equipmentSlot":"frontBoot","armorHp":4},
    assetKeys: {"frontBootAssetKey":"front-boot-chainmail-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-boot-chainmail-01",
      url: new URL("../assets/fighters/armor/legs/front-boot-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-boot-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-boot-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-boot-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_boot_chainmail_01","name":"Chainmail Front Boot 01","price":0,"itemIds":["generated_equipment_front_boot_chainmail_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_weapon_axe_01","name":"Axe 01","kind":"weapon","damageBonus":10,"weaponClass":"axe","equipmentSlot":"weaponMain"},
    assetKeys: {"weaponMainAssetKey":"weapon-axe-01"},
    equipmentTuning: {"x":-9,"y":13,"angle":110,"scaleX":1.25,"scaleY":1.51,"flipX":false,"flipY":false},
    asset: {
      key: "weapon-axe-01",
      url: new URL("../assets/fighters/weapons/weapon-axe-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/weapons/weapon-axe-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/weapons/weapon-axe-01.webp",
      lowSourcePath: "assets-low/fighters/weapons/weapon-axe-01.webp",
    },
    weaponProduct: {"id":"generated_equipment_weapon_axe_01","name":"Axe 01","price":0,"itemIds":["generated_equipment_weapon_axe_01"],"categoryId":"axes"},
  },
  {
    item: {"id":"generated_equipment_weapon_bow_01","name":"Bow 01","kind":"weapon","damageBonus":1,"weaponClass":"bow","equipmentSlot":"weaponMain"},
    assetKeys: {"weaponMainAssetKey":"weapon-bow-01"},
    equipmentTuning: {"x":-73,"y":-3,"angle":90,"scaleX":1.3,"scaleY":1.3,"flipX":false,"flipY":false},
    asset: {
      key: "weapon-bow-01",
      url: new URL("../assets/fighters/weapons/weapon-bow-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/weapons/weapon-bow-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/weapons/weapon-bow-01.webp",
      lowSourcePath: "assets-low/fighters/weapons/weapon-bow-01.webp",
    },
    weaponProduct: {"id":"generated_equipment_weapon_bow_01","name":"Bow 01","price":0,"itemIds":["generated_equipment_weapon_bow_01"],"categoryId":"bows"},
  },
];

export const GENERATED_EQUIPMENT_ITEM_IDS = GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.item.id);

export const GENERATED_EQUIPMENT_ITEM_CATALOG = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.item]),
) as Record<HeroItemId, HeroItemDefinition>;

export const GENERATED_EQUIPMENT_ITEM_ASSET_KEYS = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.assetKeys]),
) as Partial<Record<HeroItemId, EquipmentItemAssetKeys>>;

export const GENERATED_EQUIPMENT_ITEM_TUNING = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) => (record.equipmentTuning ? [[record.item.id, record.equipmentTuning]] : [])),
) as Record<HeroItemId, EquipmentTuning>;

export const GENERATED_EQUIPMENT_ASSETS = GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.asset);

export const GENERATED_ARMORY_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.armoryProduct ? [record.armoryProduct] : [],
);

export const GENERATED_WEAPON_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.weaponProduct ? [record.weaponProduct] : [],
);
