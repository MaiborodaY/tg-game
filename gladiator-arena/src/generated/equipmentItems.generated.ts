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
    item: {"id":"cloth_breastplate_01","name":"Cloth Breastplate 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"breastplate","armorHp":1},
    assetKeys: {"breastplateAssetKey":"breastplate-cloth-01"},
    equipmentTuning: {"x":0,"y":47,"angle":0,"scaleX":1.26,"scaleY":1.53,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-cloth-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-cloth-01.webp",
    },
    armoryProduct: {"id":"cloth_breastplate_01","name":"Cloth Breastplate 01","price":0,"itemIds":["cloth_breastplate_01"],"categoryId":"body"},
  },
  {
    item: {"id":"generated_equipment_back_boot_chainmail_01","name":"Chainmail Back Boot 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backBoot","armorHp":8},
    assetKeys: {"backBootAssetKey":"back-boot-chainmail-01"},
    equipmentTuning: {"x":-2,"y":3,"angle":0,"scaleX":0.83,"scaleY":0.8,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_boot_cloth_01","name":"Cloth Back Boot 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backBoot","armorHp":1},
    assetKeys: {"backBootAssetKey":"back-boot-cloth-01"},
    equipmentTuning: {"x":2,"y":-4,"angle":0,"scaleX":0.93,"scaleY":1.05,"flipX":false,"flipY":false},
    asset: {
      key: "back-boot-cloth-01",
      url: new URL("../assets/fighters/armor/legs/back-boot-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-boot-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-boot-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-boot-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_boot_cloth_01","name":"Cloth Back Boot 01","price":10,"itemIds":["generated_equipment_back_boot_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_glove_chainmail_03","name":"Chainmail Back Glove 03","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backGlove","armorHp":8},
    assetKeys: {"backGloveAssetKey":"back-glove-chainmail-03"},
    equipmentTuning: {"x":0,"y":16,"angle":0,"scaleX":1.45,"scaleY":1.5,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_glove_cloth_01","name":"Cloth Back Glove 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backGlove","armorHp":2},
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
    item: {"id":"generated_equipment_back_glove_druid_01","name":"Druid Back Glove 01","kind":"armor","rarity":"mythical","equipmentSlot":"backGlove","armorHp":50},
    assetKeys: {"backGloveAssetKey":"back-glove-druid-01"},
    equipmentTuning: {"x":0,"y":14,"angle":0,"scaleX":1.16,"scaleY":1.27,"flipX":false,"flipY":false},
    asset: {
      key: "back-glove-druid-01",
      url: new URL("../assets/fighters/armor/arms/back-glove-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-glove-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-glove-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-glove-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_glove_druid_01","name":"Druid Back Glove 01","price":0,"itemIds":["generated_equipment_back_glove_druid_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_back_glove_leather_03","name":"Leather Back Glove 03","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backGlove","armorHp":2},
    assetKeys: {"backGloveAssetKey":"back-glove-leather-03"},
    equipmentTuning: {"x":0,"y":14,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-glove-leather-03",
      url: new URL("../assets/fighters/armor/arms/back-glove-leather-03.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-glove-leather-03.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-glove-leather-03.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-glove-leather-03.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_glove_leather_03","name":"Leather Back Glove 03","price":25,"itemIds":["generated_equipment_back_glove_leather_03"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_back_greave_chainmail_01","name":"Chainmail Back Greave 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backGreave","armorHp":8},
    assetKeys: {"backGreaveAssetKey":"back-greave-chainmail-01"},
    equipmentTuning: {"x":0,"y":13,"angle":-7,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_greave_cloth_01","name":"Cloth Back Greave 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backGreave","armorHp":1},
    assetKeys: {"backGreaveAssetKey":"back-greave-cloth-01"},
    equipmentTuning: {"x":-5,"y":15.781065088757398,"angle":-15,"scaleX":1.85,"scaleY":1.18,"flipX":false,"flipY":false},
    asset: {
      key: "back-greave-cloth-01",
      url: new URL("../assets/fighters/armor/legs/back-greave-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-greave-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-greave-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-greave-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_greave_cloth_01","name":"Cloth Back Greave 01","price":10,"itemIds":["generated_equipment_back_greave_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_greave_leather_01","name":"Leather Back Greave 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backGreave","armorHp":2},
    assetKeys: {"backGreaveAssetKey":"back-greave-leather-01"},
    equipmentTuning: {"x":0,"y":11,"angle":-1,"scaleX":1.65,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-greave-leather-01",
      url: new URL("../assets/fighters/armor/legs/back-greave-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-greave-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-greave-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-greave-leather-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_greave_leather_01","name":"Leather Back Greave 01","price":25,"itemIds":["generated_equipment_back_greave_leather_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_shinguard_chainmail_01","name":"Chainmail Back Shinguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backShinguard","armorHp":8},
    assetKeys: {"backShinguardAssetKey":"back-shinguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":9,"angle":-2,"scaleX":1.13,"scaleY":1,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_shinguard_cloth_01","name":"Cloth Back Shinguard 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backShinguard","armorHp":1},
    assetKeys: {"backShinguardAssetKey":"back-shinguard-cloth-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1.35,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-shinguard-cloth-01",
      url: new URL("../assets/fighters/armor/legs/back-shinguard-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-shinguard-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-shinguard-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-shinguard-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_shinguard_cloth_01","name":"Cloth Back Shinguard 01","price":10,"itemIds":["generated_equipment_back_shinguard_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_back_shoulderguard_chainmail_01","name":"Chainmail Back Shoulderguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backShoulderguard","armorHp":8},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":1.5,"scaleY":1.4,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_shoulderguard_cloth_01","name":"Cloth Back Shoulderguard 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backShoulderguard","armorHp":2},
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
    item: {"id":"generated_equipment_back_shoulderguard_druid_01","name":"Druid Back Shoulderguard 01","kind":"armor","rarity":"mythical","equipmentSlot":"backShoulderguard","armorHp":50},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-druid-01"},
    equipmentTuning: {"x":25,"y":7,"angle":47,"scaleX":2.75,"scaleY":1.8,"flipX":true,"flipY":false},
    asset: {
      key: "back-shoulderguard-druid-01",
      url: new URL("../assets/fighters/armor/arms/back-shoulderguard-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-shoulderguard-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-shoulderguard-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-shoulderguard-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_shoulderguard_druid_01","name":"Druid Back Shoulderguard 01","price":0,"itemIds":["generated_equipment_back_shoulderguard_druid_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_back_wrist_chainmail_01","name":"Chainmail Back Wrist 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backWrist","armorHp":8},
    assetKeys: {"backWristAssetKey":"back-wrist-chainmail-01"},
    equipmentTuning: {"x":0,"y":16,"angle":2,"scaleX":1.5,"scaleY":1.1,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_back_wrist_cloth_01","name":"Cloth Back Wrist 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"backWrist","armorHp":2},
    assetKeys: {"backWristAssetKey":"back-wrist-cloth-01"},
    equipmentTuning: {"x":-1.2507815116668395,"y":21.40828402366864,"angle":4,"scaleX":1.77,"scaleY":1.18,"flipX":false,"flipY":false},
    asset: {
      key: "back-wrist-cloth-01",
      url: new URL("../assets/fighters/armor/arms/back-wrist-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-wrist-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-wrist-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-wrist-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_back_wrist_cloth_01","name":"Cloth Back Wrist 01","price":5,"itemIds":["generated_equipment_back_wrist_cloth_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_breastplate_chainmail_01","name":"Chainmail Hauberk 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"breastplate","armorHp":4},
    assetKeys: {"breastplateAssetKey":"breastplate-chainmail-01"},
    equipmentTuning: {"x":0,"y":82,"angle":0,"scaleX":1.68,"scaleY":1.76,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_breastplate_druid_01","name":"Druid Breastplate 01","kind":"armor","rarity":"mythical","equipmentSlot":"breastplate","armorHp":50},
    assetKeys: {"breastplateAssetKey":"breastplate-druid-01"},
    equipmentTuning: {"x":0,"y":54,"angle":0,"scaleX":1.12,"scaleY":1.55,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-druid-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_breastplate_druid_01","name":"Druid Breastplate 01","price":2000,"itemIds":["generated_equipment_breastplate_druid_01"],"categoryId":"chest"},
  },
  {
    item: {"id":"generated_equipment_front_boot_chainmail_01","name":"Chainmail Front Boot 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontBoot","armorHp":0},
    assetKeys: {"frontBootAssetKey":"front-boot-chainmail-01"},
    equipmentTuning: {"x":25,"y":2,"angle":0,"scaleX":0.83,"scaleY":0.8,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_boot_cloth_01","name":"Cloth Front Boot 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontBoot","armorHp":0},
    assetKeys: {"frontBootAssetKey":"front-boot-cloth-01"},
    equipmentTuning: {"x":4,"y":-4,"angle":0,"scaleX":0.93,"scaleY":1.05,"flipX":false,"flipY":false},
    asset: {
      key: "front-boot-cloth-01",
      url: new URL("../assets/fighters/armor/legs/front-boot-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-boot-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-boot-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-boot-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_boot_cloth_01","name":"Cloth Front Boot 01","price":10,"itemIds":["generated_equipment_front_boot_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail Front Glove 03","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontGlove","armorHp":0},
    assetKeys: {"frontGloveAssetKey":"front-glove-chainmail-03"},
    equipmentTuning: {"x":0,"y":13,"angle":7,"scaleX":1.45,"scaleY":1.5,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_glove_cloth_01","name":"Cloth Front Glove 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontGlove","armorHp":0},
    assetKeys: {"frontGloveAssetKey":"front-glove-cloth-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":0.6,"scaleY":0.6,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_glove_druid_01","name":"Druid Front Glove 01","kind":"armor","rarity":"mythical","equipmentSlot":"frontGlove","armorHp":0},
    assetKeys: {"frontGloveAssetKey":"front-glove-druid-01"},
    equipmentTuning: {"x":0,"y":14,"angle":0,"scaleX":1.16,"scaleY":1.27,"flipX":false,"flipY":false},
    asset: {
      key: "front-glove-druid-01",
      url: new URL("../assets/fighters/armor/arms/front-glove-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-glove-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-glove-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-glove-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_glove_druid_01","name":"Druid Front Glove 01","price":0,"itemIds":["generated_equipment_front_glove_druid_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_front_glove_leather_03","name":"Leather Front Glove 03","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontGlove","armorHp":0},
    assetKeys: {"frontGloveAssetKey":"front-glove-leather-03"},
    equipmentTuning: {"x":0,"y":14,"angle":0,"scaleX":1,"scaleY":1,"flipX":true,"flipY":false},
    asset: {
      key: "front-glove-leather-03",
      url: new URL("../assets/fighters/armor/arms/front-glove-leather-03.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-glove-leather-03.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-glove-leather-03.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-glove-leather-03.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_glove_leather_03","name":"Leather Front Glove 03","price":25,"itemIds":["generated_equipment_front_glove_leather_03"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_front_greave_chainmail_01","name":"Chainmail Front Greave 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontGreave","armorHp":0},
    assetKeys: {"frontGreaveAssetKey":"front-greave-chainmail-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_front_greave_cloth_01","name":"Cloth Front Greave 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontGreave","armorHp":0},
    assetKeys: {"frontGreaveAssetKey":"front-greave-cloth-01"},
    equipmentTuning: {"x":-6,"y":13,"angle":-15,"scaleX":1.87,"scaleY":1.18,"flipX":true,"flipY":false},
    asset: {
      key: "front-greave-cloth-01",
      url: new URL("../assets/fighters/armor/legs/front-greave-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-greave-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-greave-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-greave-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_greave_cloth_01","name":"Cloth Front Greave 01","price":10,"itemIds":["generated_equipment_front_greave_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_greave_leather_01","name":"Leather Front Greave 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontGreave","armorHp":0},
    assetKeys: {"frontGreaveAssetKey":"front-greave-leather-01"},
    equipmentTuning: {"x":2,"y":10,"angle":1,"scaleX":1.65,"scaleY":1,"flipX":true,"flipY":false},
    asset: {
      key: "front-greave-leather-01",
      url: new URL("../assets/fighters/armor/legs/front-greave-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-greave-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-greave-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-greave-leather-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_greave_leather_01","name":"Leather Front Greave 01","price":25,"itemIds":["generated_equipment_front_greave_leather_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_shinguard_chainmail_01","name":"Chainmail Front Shinguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontShinguard","armorHp":0},
    assetKeys: {"frontShinguardAssetKey":"front-shinguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":9,"angle":0,"scaleX":1.13,"scaleY":0.96,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_shinguard_cloth_01","name":"Cloth Front Shinguard 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontShinguard","armorHp":0},
    assetKeys: {"frontShinguardAssetKey":"front-shinguard-cloth-01"},
    equipmentTuning: {"x":0,"y":0,"angle":0,"scaleX":1.35,"scaleY":1,"flipX":true,"flipY":false},
    asset: {
      key: "front-shinguard-cloth-01",
      url: new URL("../assets/fighters/armor/legs/front-shinguard-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-shinguard-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-shinguard-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-shinguard-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_shinguard_cloth_01","name":"Cloth Front Shinguard 01","price":10,"itemIds":["generated_equipment_front_shinguard_cloth_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"generated_equipment_front_shoulderguard_chainmail_01","name":"Chainmail Front Shoulderguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontShoulderguard","armorHp":0},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-chainmail-01"},
    equipmentTuning: {"x":0,"y":13,"angle":0,"scaleX":1.5,"scaleY":1.4,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_shoulderguard_cloth_01","name":"Cloth Front Shoulderguard 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontShoulderguard","armorHp":0},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-cloth-01"},
    equipmentTuning: {"x":0,"y":47,"angle":7,"scaleX":1.98,"scaleY":1.23,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_shoulderguard_druid_01","name":"Druid Front Shoulderguard 01","kind":"armor","rarity":"mythical","equipmentSlot":"frontShoulderguard","armorHp":0},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-druid-01"},
    equipmentTuning: {"x":25,"y":7,"angle":47,"scaleX":2.75,"scaleY":1.8,"flipX":false,"flipY":false},
    asset: {
      key: "front-shoulderguard-druid-01",
      url: new URL("../assets/fighters/armor/arms/front-shoulderguard-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-shoulderguard-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-shoulderguard-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-shoulderguard-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_shoulderguard_druid_01","name":"Druid Front Shoulderguard 01","price":0,"itemIds":["generated_equipment_front_shoulderguard_druid_01"],"categoryId":"shoulders"},
  },
  {
    item: {"id":"generated_equipment_front_wrist_chainmail_01","name":"Chainmail Front Wrist 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontWrist","armorHp":0},
    assetKeys: {"frontWristAssetKey":"front-wrist-chainmail-01"},
    equipmentTuning: {"x":0,"y":19,"angle":0,"scaleX":1.5,"scaleY":1.1,"flipX":true,"flipY":false},
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
    item: {"id":"generated_equipment_front_wrist_cloth_01","name":"Cloth Front Wrist 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontWrist","armorHp":0},
    assetKeys: {"frontWristAssetKey":"front-wrist-cloth-01"},
    equipmentTuning: {"x":-1.2507815116668395,"y":21.40828402366864,"angle":4,"scaleX":1.77,"scaleY":1.18,"flipX":true,"flipY":false},
    asset: {
      key: "front-wrist-cloth-01",
      url: new URL("../assets/fighters/armor/arms/front-wrist-cloth-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-wrist-cloth-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-wrist-cloth-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-wrist-cloth-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_front_wrist_cloth_01","name":"Cloth Front Wrist 01","price":5,"itemIds":["generated_equipment_front_wrist_cloth_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"generated_equipment_helmet_chainmail_01","name":"Chainmail Coif 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"helmet","armorHp":4},
    assetKeys: {"helmetAssetKey":"helmet-chainmail-01"},
    equipmentTuning: {"x":-0.7501116445238396,"y":53.2189349112426,"angle":0,"scaleX":1.19,"scaleY":1.32,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_helmet_cloth_01","name":"Cloth Helmet 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"helmet","armorHp":1},
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
    item: {"id":"generated_equipment_helmet_cloth_02","name":"Cloth Helmet 02","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"helmet","armorHp":2},
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
    item: {"id":"generated_equipment_helmet_druid_01","name":"Druid Helmet 01","kind":"armor","rarity":"mythical","equipmentSlot":"helmet","armorHp":50},
    assetKeys: {"helmetAssetKey":"helmet-druid-01"},
    equipmentTuning: {"x":0,"y":57,"angle":0,"scaleX":1.51,"scaleY":1.74,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-druid-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-druid-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-druid-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-druid-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-druid-01.webp",
    },
    armoryProduct: {"id":"generated_equipment_helmet_druid_01","name":"Druid Helmet 01","price":0,"itemIds":["generated_equipment_helmet_druid_01"],"categoryId":"head"},
  },
  {
    item: {"id":"generated_equipment_weapon_axe_01","name":"Axe 01","kind":"weapon","rarity":"epic","equipmentSlot":"weaponMain","damageBonus":10,"weaponClass":"axe"},
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
    item: {"id":"generated_equipment_weapon_bow_01","name":"Bow 01","kind":"weapon","rarity":"common","equipmentSlot":"weaponMain","damageBonus":1,"weaponClass":"bow"},
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
  {
    item: {"id":"leather_back_boot_01","name":"Leather Back Boot 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backBoot","armorHp":2},
    assetKeys: {"backBootAssetKey":"back-boot-leather-01"},
    equipmentTuning: {"x":1,"y":-1,"angle":0,"scaleX":0.93,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-boot-leather-01",
      url: new URL("../assets/fighters/armor/legs/back-boot-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-boot-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-boot-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-boot-leather-01.webp",
    },
    armoryProduct: {"id":"leather_back_boot_01","name":"Leather Back Boot 01","price":0,"itemIds":["leather_back_boot_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_back_shinguard_01","name":"Leather Back Shinguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backShinguard","armorHp":2},
    assetKeys: {"backShinguardAssetKey":"back-shinguard-leather-01"},
    equipmentTuning: {"x":-1.500223289047633,"y":-7,"angle":0,"scaleX":1.7,"scaleY":1.1,"flipX":true,"flipY":false},
    asset: {
      key: "back-shinguard-leather-01",
      url: new URL("../assets/fighters/armor/legs/back-shinguard-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-shinguard-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-shinguard-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-shinguard-leather-01.webp",
    },
    armoryProduct: {"id":"leather_back_shinguard_01","name":"Leather Back Shinguard 01","price":0,"itemIds":["leather_back_shinguard_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_back_shoulderguard_01","name":"Leather Back Shoulderguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backShoulderguard","armorHp":2},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-leather-01"},
    equipmentTuning: {"x":0,"y":16,"angle":-2,"scaleX":1.8,"scaleY":1.45,"flipX":false,"flipY":false},
    asset: {
      key: "back-shoulderguard-leather-01",
      url: new URL("../assets/fighters/armor/arms/back-shoulderguard-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-shoulderguard-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-shoulderguard-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-shoulderguard-leather-01.webp",
    },
    armoryProduct: {"id":"leather_back_shoulderguard_01","name":"Leather Back Shoulderguard 01","price":0,"itemIds":["leather_back_shoulderguard_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_back_wrist_01","name":"Leather Back Wrist 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backWrist","armorHp":2},
    assetKeys: {"backWristAssetKey":"back-wrist-leather-01"},
    equipmentTuning: {"x":0,"y":13,"angle":-1,"scaleX":1.55,"scaleY":1.4,"flipX":true,"flipY":false},
    asset: {
      key: "back-wrist-leather-01",
      url: new URL("../assets/fighters/armor/arms/back-wrist-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-wrist-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-wrist-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-wrist-leather-01.webp",
    },
    armoryProduct: {"id":"leather_back_wrist_01","name":"Leather Back Wrist 01","price":0,"itemIds":["leather_back_wrist_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_breastplate_01","name":"Leather Breastplate 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"breastplate","armorHp":1},
    assetKeys: {"breastplateAssetKey":"breastplate-leather-01"},
    equipmentTuning: {"x":0,"y":44,"angle":0,"scaleX":1.28,"scaleY":1.45,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-leather-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-leather-01.webp",
    },
    armoryProduct: {"id":"leather_breastplate_01","name":"Leather Breastplate 01","price":0,"itemIds":["leather_breastplate_01"],"categoryId":"body"},
  },
  {
    item: {"id":"leather_front_boot_01","name":"Leather Front Boot 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontBoot","armorHp":0},
    assetKeys: {"frontBootAssetKey":"front-boot-leather-01"},
    equipmentTuning: {"x":28,"y":-1,"angle":0,"scaleX":0.93,"scaleY":1,"flipX":true,"flipY":false},
    asset: {
      key: "front-boot-leather-01",
      url: new URL("../assets/fighters/armor/legs/front-boot-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-boot-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-boot-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-boot-leather-01.webp",
    },
    armoryProduct: {"id":"leather_front_boot_01","name":"Leather Front Boot 01","price":0,"itemIds":["leather_front_boot_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_front_shinguard_01","name":"Leather Front Shinguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontShinguard","armorHp":0},
    assetKeys: {"frontShinguardAssetKey":"front-shinguard-leather-01"},
    equipmentTuning: {"x":-1,"y":-7,"angle":0,"scaleX":1.7,"scaleY":1.1,"flipX":false,"flipY":false},
    asset: {
      key: "front-shinguard-leather-01",
      url: new URL("../assets/fighters/armor/legs/front-shinguard-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-shinguard-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-shinguard-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-shinguard-leather-01.webp",
    },
    armoryProduct: {"id":"leather_front_shinguard_01","name":"Leather Front Shinguard 01","price":0,"itemIds":["leather_front_shinguard_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_front_shoulderguard_01","name":"Leather Front Shoulderguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontShoulderguard","armorHp":0},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-leather-01"},
    equipmentTuning: {"x":0,"y":16,"angle":0,"scaleX":1.8,"scaleY":1.45,"flipX":true,"flipY":false},
    asset: {
      key: "front-shoulderguard-leather-01",
      url: new URL("../assets/fighters/armor/arms/front-shoulderguard-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-shoulderguard-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-shoulderguard-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-shoulderguard-leather-01.webp",
    },
    armoryProduct: {"id":"leather_front_shoulderguard_01","name":"Leather Front Shoulderguard 01","price":0,"itemIds":["leather_front_shoulderguard_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_front_wrist_01","name":"Leather Front Wrist 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontWrist","armorHp":0},
    assetKeys: {"frontWristAssetKey":"front-wrist-leather-01"},
    equipmentTuning: {"x":0,"y":8,"angle":0,"scaleX":1.55,"scaleY":1.43,"flipX":false,"flipY":false},
    asset: {
      key: "front-wrist-leather-01",
      url: new URL("../assets/fighters/armor/arms/front-wrist-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-wrist-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-wrist-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-wrist-leather-01.webp",
    },
    armoryProduct: {"id":"leather_front_wrist_01","name":"Leather Front Wrist 01","price":0,"itemIds":["leather_front_wrist_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_helmet_01","name":"Leather Helmet 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"helmet","armorHp":1},
    assetKeys: {"helmetAssetKey":"helmet-leather-01"},
    equipmentTuning: {"x":-1,"y":16,"angle":0,"scaleX":1.16,"scaleY":1.13,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-leather-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-leather-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-leather-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-leather-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-leather-01.webp",
    },
    armoryProduct: {"id":"leather_helmet_01","name":"Leather Helmet 01","price":0,"itemIds":["leather_helmet_01"],"categoryId":"head"},
  },
  {
    item: {"id":"weapon_sword_01","name":"Sword 01","kind":"weapon","rarity":"common","equipmentSlot":"weaponMain","damageBonus":1,"weaponClass":"sword"},
    assetKeys: {"weaponMainAssetKey":"weapon-sword-01"},
    equipmentTuning: {"x":3,"y":35,"angle":55,"scaleX":0.5,"scaleY":0.5,"flipX":false,"flipY":false},
    asset: {
      key: "weapon-sword-01",
      url: new URL("../assets/fighters/weapons/weapon-sword-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/weapons/weapon-sword-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/weapons/weapon-sword-01.webp",
      lowSourcePath: "assets-low/fighters/weapons/weapon-sword-01.webp",
    },
    weaponProduct: {"id":"weapon_sword_01","name":"Sword 01","price":0,"itemIds":["weapon_sword_01"],"categoryId":"swords"},
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
