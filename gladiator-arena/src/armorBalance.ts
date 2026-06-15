import type { HeroEquipmentSlotKey, HeroItemRarity } from "./hero";

export const ARMOR_BALANCE_SLOTS = ["breastplate", "helmet", "shoulders", "greaves", "shinguards", "gloves", "boots", "wrists"] as const;

export type ArmorBalanceSlot = (typeof ARMOR_BALANCE_SLOTS)[number];
export type ArmorShopSetRarity = Exclude<HeroItemRarity, "unique">;
export type ArmorShopSetGrade = "low" | "high";
export type ArmorBalanceValues = Record<ArmorBalanceSlot, number>;
export type ArmorBalanceSet = Record<ArmorBalanceSlot, number>;
export type ArmorBalancePriceSet = Record<ArmorBalanceSlot, number>;
export type ArmorBalanceRounding = "floor" | "round" | "ceil";

export interface ArmorBalanceOptions {
  minimumArmorPerSlot?: number;
  minimumArmorBySlot?: Partial<Record<ArmorBalanceSlot, number>>;
  rounding?: ArmorBalanceRounding;
}

export interface ArmorPriceBalanceOptions {
  minimumPricePerSlot?: number;
}

export const ARMOR_SLOT_WEIGHTS: Readonly<Record<ArmorBalanceSlot, number>> = {
  breastplate: 30,
  helmet: 20,
  shoulders: 11,
  greaves: 11,
  shinguards: 11,
  gloves: 5,
  boots: 6,
  wrists: 6,
};

export const ARMOR_PRICE_SLOT_WEIGHTS: Readonly<Record<ArmorBalanceSlot, number>> = ARMOR_SLOT_WEIGHTS;
export const ARMOR_SHOP_PRICE_PER_BREASTPLATE_ARMOR = 10;

export const ARMOR_SHOP_BREASTPLATE_ARMOR: Readonly<Record<ArmorShopSetRarity, Readonly<Record<ArmorShopSetGrade, number>>>> = {
  common: {
    low: 3,
    high: 5,
  },
  uncommon: {
    low: 8,
    high: 11,
  },
  rare: {
    low: 15,
    high: 20,
  },
  epic: {
    low: 25,
    high: 30,
  },
  legendary: {
    low: 38,
    high: 48,
  },
  mythical: {
    low: 60,
    high: 75,
  },
};

export const ARMOR_BALANCE_PRIMARY_EQUIPMENT_SLOTS: Readonly<Record<ArmorBalanceSlot, HeroEquipmentSlotKey>> = {
  breastplate: "breastplate",
  helmet: "helmet",
  shoulders: "backShoulderguard",
  greaves: "backGreave",
  shinguards: "backShinguard",
  gloves: "backGlove",
  boots: "backBoot",
  wrists: "backWrist",
};

export const ARMOR_BALANCE_MIRROR_EQUIPMENT_SLOTS: Readonly<Partial<Record<ArmorBalanceSlot, HeroEquipmentSlotKey>>> = {
  shoulders: "frontShoulderguard",
  greaves: "frontGreave",
  shinguards: "frontShinguard",
  gloves: "frontGlove",
  boots: "frontBoot",
  wrists: "frontWrist",
};

const BREASTPLATE_ARMOR_WEIGHT = ARMOR_SLOT_WEIGHTS.breastplate;

export function getArmorShopSetBreastplateArmor(rarity: ArmorShopSetRarity, grade: ArmorShopSetGrade): number {
  return ARMOR_SHOP_BREASTPLATE_ARMOR[rarity][grade];
}

export function getArmorShopSetTotalPrice(rarity: ArmorShopSetRarity, grade: ArmorShopSetGrade): number {
  return getArmorSetTotalPriceFromBreastplateArmor(getArmorShopSetBreastplateArmor(rarity, grade));
}

export function getArmorSetTotalPriceFromBreastplateArmor(breastplateArmor: number): number {
  return sanitizeBalanceValue(breastplateArmor) * ARMOR_SHOP_PRICE_PER_BREASTPLATE_ARMOR;
}

export function deriveArmorSetPricesFromBreastplateArmor(breastplateArmor: number, options: ArmorPriceBalanceOptions = {}): ArmorBalancePriceSet {
  return deriveArmorSetPricesFromTotalPrice(getArmorSetTotalPriceFromBreastplateArmor(breastplateArmor), options);
}

export function deriveArmorSetPricesFromTotalPrice(totalPrice: number, options: ArmorPriceBalanceOptions = {}): ArmorBalancePriceSet {
  return distributeBalanceValueByWeights(sanitizeBalanceValue(totalPrice), ARMOR_PRICE_SLOT_WEIGHTS, sanitizeBalanceValue(options.minimumPricePerSlot ?? 1));
}

export function deriveArmorSetFromBreastplateArmor(breastplateArmor: number, options: ArmorBalanceOptions = {}): ArmorBalanceSet {
  const breastplate = sanitizeBalanceValue(breastplateArmor);
  const armorSet = createEmptyBalanceSet();

  if (breastplate <= 0) {
    return armorSet;
  }

  armorSet.breastplate = breastplate;

  ARMOR_BALANCE_SLOTS.forEach((slot) => {
    if (slot === "breastplate") {
      return;
    }

    armorSet[slot] = getArmorSlotArmorFromBreastplateArmor(slot, breastplate, options);
  });

  return armorSet;
}

export function getArmorSlotArmorFromBreastplateArmor(slot: ArmorBalanceSlot, breastplateArmor: number, options: ArmorBalanceOptions = {}): number {
  const breastplate = sanitizeBalanceValue(breastplateArmor);

  if (breastplate <= 0) {
    return 0;
  }

  if (slot === "breastplate") {
    return breastplate;
  }

  const minimumArmor = getMinimumArmorForSlot(slot, options);
  const armor = roundArmorValue((breastplate * ARMOR_SLOT_WEIGHTS[slot]) / BREASTPLATE_ARMOR_WEIGHT, options.rounding ?? "round");

  return Math.max(minimumArmor, armor);
}

export function getArmorSetTotal(armorSet: ArmorBalanceSet): number {
  return ARMOR_BALANCE_SLOTS.reduce((total, slot) => total + armorSet[slot], 0);
}

export function getArmorPriceSetTotal(priceSet: ArmorBalancePriceSet): number {
  return ARMOR_BALANCE_SLOTS.reduce((total, slot) => total + priceSet[slot], 0);
}

function getMinimumArmorForSlot(slot: ArmorBalanceSlot, options: ArmorBalanceOptions): number {
  return sanitizeBalanceValue(options.minimumArmorBySlot?.[slot] ?? options.minimumArmorPerSlot ?? 1);
}

function createEmptyBalanceSet(): ArmorBalanceValues {
  return {
    breastplate: 0,
    helmet: 0,
    shoulders: 0,
    greaves: 0,
    shinguards: 0,
    gloves: 0,
    boots: 0,
    wrists: 0,
  };
}

function distributeBalanceValueByWeights(
  totalValue: number,
  weights: Readonly<Record<ArmorBalanceSlot, number>>,
  minimumValuePerSlot: number,
): ArmorBalanceValues {
  const values = createEmptyBalanceSet();

  if (totalValue <= 0) {
    return values;
  }

  const weightTotal = ARMOR_BALANCE_SLOTS.reduce((total, slot) => total + weights[slot], 0);
  const entries = ARMOR_BALANCE_SLOTS.map((slot, index) => {
    const rawValue = (totalValue * weights[slot]) / weightTotal;

    return {
      slot,
      index,
      rawValue,
      remainder: rawValue - Math.floor(rawValue),
      value: Math.floor(rawValue),
    };
  });
  const minimumTotal = minimumValuePerSlot * entries.length;

  if (minimumValuePerSlot > 0 && totalValue >= minimumTotal) {
    entries.forEach((entry) => {
      entry.value = Math.max(minimumValuePerSlot, entry.value);
    });
  }

  let assignedValue = entries.reduce((total, entry) => total + entry.value, 0);

  if (assignedValue < totalValue) {
    const entriesByRemainder = [...entries].sort((left, right) => right.remainder - left.remainder || left.index - right.index);
    let entryIndex = 0;

    while (assignedValue < totalValue) {
      entriesByRemainder[entryIndex % entriesByRemainder.length]!.value += 1;
      entryIndex += 1;
      assignedValue += 1;
    }
  }

  if (assignedValue > totalValue) {
    const minimumValue = totalValue >= minimumTotal ? minimumValuePerSlot : 0;
    const entriesByRemainder = [...entries].sort((left, right) => left.remainder - right.remainder || right.index - left.index);

    while (assignedValue > totalValue) {
      const entry = entriesByRemainder.find((candidate) => candidate.value > minimumValue);

      if (!entry) {
        break;
      }

      entry.value -= 1;
      assignedValue -= 1;
    }
  }

  entries.forEach((entry) => {
    values[entry.slot] = entry.value;
  });

  return values;
}

function roundArmorValue(value: number, rounding: ArmorBalanceRounding): number {
  if (rounding === "floor") {
    return Math.floor(value);
  }

  if (rounding === "round") {
    return Math.round(value);
  }

  return Math.ceil(value);
}

function sanitizeBalanceValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
