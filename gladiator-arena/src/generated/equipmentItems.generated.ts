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
    item: {"id":"generated_equipment_breastplate_chainmail_01","name":"Chainmail Breastplate 01","kind":"armor","equipmentSlot":"breastplate","armorHp":4},
    assetKeys: {"breastplateAssetKey":"breastplate-chainmail-01"},
    equipmentTuning: {"x":0,"y":43,"angle":0,"scaleX":1.16,"scaleY":1.55,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-chainmail-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_breastplate_chainmail_01","name":"Chainmail Breastplate 01","price":0,"itemIds":["generated_equipment_breastplate_chainmail_01"],"categoryId":"chest"},
  },
  {
    item: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail front Glove","kind":"armor","equipmentSlot":"frontGlove","armorHp":4},
    assetKeys: {"frontGloveAssetKey":"front-glove-chainmail-03"},
    equipmentTuning: {"x":-3,"y":9,"angle":5,"scaleX":0.75,"scaleY":0.9,"flipX":false,"flipY":false},
    asset: {
      key: "front-glove-chainmail-03",
      url: new URL("../assets/fighters/armor/arms/front-glove-chainmail-03.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-glove-chainmail-03.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-glove-chainmail-03.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-glove-chainmail-03.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail front Glove","price":0,"itemIds":["generated_equipment_front_glove_chainmail_03"],"categoryId":"arms"},
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
    item: {"id":"generated_equipment_helmet_chainmail_01","name":"Chainmail Helmet 01","kind":"armor","equipmentSlot":"helmet","armorHp":4},
    assetKeys: {"helmetAssetKey":"helmet-chainmail-01"},
    equipmentTuning: {"x":-1,"y":47,"angle":0,"scaleX":1.25,"scaleY":1.36,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-chainmail-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-chainmail-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-chainmail-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-chainmail-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-chainmail-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_helmet_chainmail_01","name":"Chainmail Helmet 01","price":0,"itemIds":["generated_equipment_helmet_chainmail_01"],"categoryId":"head"},
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
    item: {"id":"generated_equipment_weapon_axe_01","name":"Axe 01","kind":"weapon","equipmentSlot":"weaponMain","damageBonus":10},
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
  }
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
) as Partial<Record<HeroItemId, EquipmentTuning>>;

export const GENERATED_EQUIPMENT_ASSETS = GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.asset);

export const GENERATED_ARMORY_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.armoryProduct ? [record.armoryProduct] : [],
);

export const GENERATED_WEAPON_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.weaponProduct ? [record.weaponProduct] : [],
);
