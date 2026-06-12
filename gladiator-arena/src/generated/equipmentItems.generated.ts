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
    item: {"id":"generated_equipment_back_glove_chainmail_03","name":"Chainmail Back Glove 03","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backGlove","armorHp":8},
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
    item: {"id":"generated_equipment_back_shinguard_chainmail_01","name":"Chainmail Back Shinguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backShinguard","armorHp":8},
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
    item: {"id":"generated_equipment_back_shoulderguard_chainmail_01","name":"Chainmail Back Shoulderguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backShoulderguard","armorHp":8},
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
    item: {"id":"generated_equipment_back_wrist_chainmail_01","name":"Chainmail Back Wrist 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"backWrist","armorHp":8},
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
    item: {"id":"generated_equipment_front_boot_chainmail_01","name":"Chainmail Front Boot 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontBoot","armorHp":0},
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
    item: {"id":"generated_equipment_front_glove_chainmail_03","name":"Chainmail Front Glove 03","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontGlove","armorHp":0},
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
    item: {"id":"generated_equipment_front_glove_cloth_01","name":"Cloth Front Glove 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontGlove","armorHp":0},
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
    item: {"id":"generated_equipment_front_glove_leather_03","name":"Leather Front Glove 03","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontGlove","armorHp":2},
    assetKeys: {"frontGloveAssetKey":"front-glove-leather-03"},
    equipmentTuning: {"x":0,"y":14,"angle":0,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
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
    item: {"id":"generated_equipment_front_shinguard_chainmail_01","name":"Chainmail Front Shinguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontShinguard","armorHp":0},
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
    item: {"id":"generated_equipment_front_shoulderguard_chainmail_01","name":"Chainmail Front Shoulderguard 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontShoulderguard","armorHp":0},
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
    item: {"id":"generated_equipment_front_shoulderguard_cloth_01","name":"Cloth Front Shoulderguard 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontShoulderguard","armorHp":0},
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
    item: {"id":"generated_equipment_front_wrist_chainmail_01","name":"Chainmail Front Wrist 01","kind":"armor","rarity":"rare","armorCategory":"chain","equipmentSlot":"frontWrist","armorHp":0},
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
    item: {"id":"generated_equipment_front_wrist_cloth_01","name":"Cloth Front Wrist 01","kind":"armor","rarity":"common","armorCategory":"cloth","equipmentSlot":"frontWrist","armorHp":0},
    assetKeys: {"frontWristAssetKey":"front-wrist-cloth-01"},
    equipmentTuning: {"x":-1.2507815116668395,"y":21.40828402366864,"angle":4,"scaleX":1.77,"scaleY":1.18,"flipX":false,"flipY":false},
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
    assetKeys: {"backBootAssetKey":"back-boot-light-01"},
    equipmentTuning: {"x":1,"y":-1,"angle":0,"scaleX":0.93,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-boot-light-01",
      url: new URL("../assets/fighters/armor/legs/back-boot-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-boot-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-boot-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-boot-light-01.webp",
    },
    armoryProduct: {"id":"leather_back_boot_01","name":"Leather Back Boot 01","price":0,"itemIds":["leather_back_boot_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_back_greave_01","name":"Leather Back Greave 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backGreave","armorHp":2},
    assetKeys: {"backGreaveAssetKey":"back-greave-light-01"},
    equipmentTuning: {"x":-3,"y":0,"angle":-8,"scaleX":1.6,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-greave-light-01",
      url: new URL("../assets/fighters/armor/legs/back-greave-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-greave-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-greave-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-greave-light-01.webp",
    },
    armoryProduct: {"id":"leather_back_greave_01","name":"Leather Back Greave 01","price":0,"itemIds":["leather_back_greave_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_back_shinguard_01","name":"Leather Back Shinguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backShinguard","armorHp":2},
    assetKeys: {"backShinguardAssetKey":"back-shinguard-light-01"},
    equipmentTuning: {"x":-3,"y":-3,"angle":4,"scaleX":1.5,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-shinguard-light-01",
      url: new URL("../assets/fighters/armor/legs/back-shinguard-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/back-shinguard-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/back-shinguard-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/back-shinguard-light-01.webp",
    },
    armoryProduct: {"id":"leather_back_shinguard_01","name":"Leather Back Shinguard 01","price":0,"itemIds":["leather_back_shinguard_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_back_shoulderguard_01","name":"Leather Back Shoulderguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backShoulderguard","armorHp":2},
    assetKeys: {"backShoulderguardAssetKey":"back-shoulderguard-light-01"},
    equipmentTuning: {"x":6,"y":1,"angle":9,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "back-shoulderguard-light-01",
      url: new URL("../assets/fighters/armor/arms/back-shoulderguard-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-shoulderguard-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-shoulderguard-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-shoulderguard-light-01.webp",
    },
    armoryProduct: {"id":"leather_back_shoulderguard_01","name":"Leather Back Shoulderguard 01","price":0,"itemIds":["leather_back_shoulderguard_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_back_wrist_01","name":"Leather Back Wrist 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"backWrist","armorHp":2},
    assetKeys: {"backWristAssetKey":"back-wrist-light-01"},
    equipmentTuning: {"x":0,"y":-3,"angle":-4,"scaleX":1.26,"scaleY":1.1,"flipX":true,"flipY":false},
    asset: {
      key: "back-wrist-light-01",
      url: new URL("../assets/fighters/armor/arms/back-wrist-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/back-wrist-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/back-wrist-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/back-wrist-light-01.webp",
    },
    armoryProduct: {"id":"leather_back_wrist_01","name":"Leather Back Wrist 01","price":0,"itemIds":["leather_back_wrist_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_breastplate_01","name":"Leather Breastplate 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"breastplate","armorHp":1},
    assetKeys: {"breastplateAssetKey":"breastplate-light-01"},
    equipmentTuning: {"x":0,"y":30,"angle":0,"scaleX":1.04,"scaleY":1.31,"flipX":false,"flipY":false},
    asset: {
      key: "breastplate-light-01",
      url: new URL("../assets/fighters/armor/breastplate/breastplate-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/breastplate/breastplate-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/breastplate/breastplate-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/breastplate/breastplate-light-01.webp",
    },
    armoryProduct: {"id":"leather_breastplate_01","name":"Leather Breastplate 01","price":0,"itemIds":["leather_breastplate_01"],"categoryId":"body"},
  },
  {
    item: {"id":"leather_front_boot_01","name":"Leather Front Boot 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontBoot","armorHp":0},
    assetKeys: {"frontBootAssetKey":"front-boot-light-01"},
    equipmentTuning: {"x":1,"y":0,"angle":0,"scaleX":0.88,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-boot-light-01",
      url: new URL("../assets/fighters/armor/legs/front-boot-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-boot-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-boot-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-boot-light-01.webp",
    },
    armoryProduct: {"id":"leather_front_boot_01","name":"Leather Front Boot 01","price":0,"itemIds":["leather_front_boot_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_front_greave_01","name":"Leather Front Greave 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontGreave","armorHp":0},
    assetKeys: {"frontGreaveAssetKey":"front-greave-light-01"},
    equipmentTuning: {"x":-6,"y":3,"angle":-11,"scaleX":1.6,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-greave-light-01",
      url: new URL("../assets/fighters/armor/legs/front-greave-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-greave-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-greave-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-greave-light-01.webp",
    },
    armoryProduct: {"id":"leather_front_greave_01","name":"Leather Front Greave 01","price":0,"itemIds":["leather_front_greave_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_front_shinguard_01","name":"Leather Front Shinguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontShinguard","armorHp":0},
    assetKeys: {"frontShinguardAssetKey":"front-shinguard-light-01"},
    equipmentTuning: {"x":-6,"y":-3,"angle":0,"scaleX":1.5,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-shinguard-light-01",
      url: new URL("../assets/fighters/armor/legs/front-shinguard-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/legs/front-shinguard-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/legs/front-shinguard-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/legs/front-shinguard-light-01.webp",
    },
    armoryProduct: {"id":"leather_front_shinguard_01","name":"Leather Front Shinguard 01","price":0,"itemIds":["leather_front_shinguard_01"],"categoryId":"legs"},
  },
  {
    item: {"id":"leather_front_shoulderguard_01","name":"Leather Front Shoulderguard 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontShoulderguard","armorHp":0},
    assetKeys: {"frontShoulderguardAssetKey":"front-shoulderguard-light-01"},
    equipmentTuning: {"x":8,"y":-3,"angle":13,"scaleX":1,"scaleY":1,"flipX":false,"flipY":false},
    asset: {
      key: "front-shoulderguard-light-01",
      url: new URL("../assets/fighters/armor/arms/front-shoulderguard-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-shoulderguard-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-shoulderguard-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-shoulderguard-light-01.webp",
    },
    armoryProduct: {"id":"leather_front_shoulderguard_01","name":"Leather Front Shoulderguard 01","price":0,"itemIds":["leather_front_shoulderguard_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_front_wrist_01","name":"Leather Front Wrist 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"frontWrist","armorHp":0},
    assetKeys: {"frontWristAssetKey":"front-wrist-light-01"},
    equipmentTuning: {"x":0,"y":-3,"angle":14,"scaleX":1.5,"scaleY":1.1,"flipX":true,"flipY":false},
    asset: {
      key: "front-wrist-light-01",
      url: new URL("../assets/fighters/armor/arms/front-wrist-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/arms/front-wrist-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/arms/front-wrist-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/arms/front-wrist-light-01.webp",
    },
    armoryProduct: {"id":"leather_front_wrist_01","name":"Leather Front Wrist 01","price":0,"itemIds":["leather_front_wrist_01"],"categoryId":"arms"},
  },
  {
    item: {"id":"leather_helmet_01","name":"Leather Helmet 01","kind":"armor","rarity":"uncommon","armorCategory":"leather","equipmentSlot":"helmet","armorHp":1},
    assetKeys: {"helmetAssetKey":"helmet-light-01"},
    equipmentTuning: {"x":-1,"y":6,"angle":0,"scaleX":0.77,"scaleY":0.94,"flipX":false,"flipY":false},
    asset: {
      key: "helmet-light-01",
      url: new URL("../assets/fighters/armor/helmet/helmet-light-01.webp", import.meta.url).href,
      lowUrl: new URL("../assets-low/fighters/armor/helmet/helmet-light-01.webp", import.meta.url).href,
      sourcePath: "assets/fighters/armor/helmet/helmet-light-01.webp",
      lowSourcePath: "assets-low/fighters/armor/helmet/helmet-light-01.webp",
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
