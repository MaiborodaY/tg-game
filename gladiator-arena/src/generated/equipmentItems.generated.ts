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

export interface GeneratedEquipmentItemRecord {
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  equipmentTuning?: EquipmentTuning;
  asset: EquipmentAssetDefinition;
  armoryProduct?: GeneratedArmoryProduct;
}

export const GENERATED_EQUIPMENT_ITEM_RECORDS: readonly GeneratedEquipmentItemRecord[] = [
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
