import { GENERATED_EQUIPMENT_ITEM_ASSET_KEYS } from "./generated/equipmentItems.generated";
import type { HeroEquipmentSlotKey, HeroItemDefinition, HeroItemId } from "./hero";

export interface EquipmentItemAssetKeys {
  weaponMainAssetKey?: string;
  helmetAssetKey?: string;
  breastplateAssetKey?: string;
  backShoulderguardAssetKey?: string;
  frontShoulderguardAssetKey?: string;
  backWristAssetKey?: string;
  frontWristAssetKey?: string;
  backGloveAssetKey?: string;
  frontGloveAssetKey?: string;
  backGreaveAssetKey?: string;
  frontGreaveAssetKey?: string;
  backShinguardAssetKey?: string;
  frontShinguardAssetKey?: string;
  backBootAssetKey?: string;
  frontBootAssetKey?: string;
}

export interface EquipmentAssetDefinition {
  key: string;
  url: string;
  lowUrl?: string;
  sourcePath: string;
  lowSourcePath?: string;
}

export interface AutoEquipmentItemRecord {
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  asset: EquipmentAssetDefinition;
}

interface EquipmentAssetSlotConfig {
  prefix: string;
  slot: HeroEquipmentSlotKey;
  assetKey: keyof EquipmentItemAssetKeys;
  label: string;
  kind: HeroItemDefinition["kind"];
}

const armorWebpAssetUrls = import.meta.glob("./assets/fighters/armor/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const armorPngAssetUrls = import.meta.glob("./assets/fighters/armor/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const lowArmorAssetUrls = import.meta.glob("./assets-low/fighters/armor/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const weaponWebpAssetUrls = import.meta.glob("./assets/fighters/weapons/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const weaponPngAssetUrls = import.meta.glob("./assets/fighters/weapons/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const lowWeaponAssetUrls = import.meta.glob("./assets-low/fighters/weapons/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const lowEquipmentAssetUrls = { ...lowArmorAssetUrls, ...lowWeaponAssetUrls };

const equipmentAssetSlotConfigs: EquipmentAssetSlotConfig[] = [
  { prefix: "weapon-", slot: "weaponMain", assetKey: "weaponMainAssetKey", label: "Weapon", kind: "weapon" },
  { prefix: "back-shoulderguard-", slot: "backShoulderguard", assetKey: "backShoulderguardAssetKey", label: "Back Shoulderguard", kind: "armor" },
  { prefix: "front-shoulderguard-", slot: "frontShoulderguard", assetKey: "frontShoulderguardAssetKey", label: "Front Shoulderguard", kind: "armor" },
  { prefix: "back-wrist-", slot: "backWrist", assetKey: "backWristAssetKey", label: "Back Wrist", kind: "armor" },
  { prefix: "front-wrist-", slot: "frontWrist", assetKey: "frontWristAssetKey", label: "Front Wrist", kind: "armor" },
  { prefix: "back-glove-", slot: "backGlove", assetKey: "backGloveAssetKey", label: "Back Glove", kind: "armor" },
  { prefix: "front-glove-", slot: "frontGlove", assetKey: "frontGloveAssetKey", label: "Front Glove", kind: "armor" },
  { prefix: "back-shinguard-", slot: "backShinguard", assetKey: "backShinguardAssetKey", label: "Back Shinguard", kind: "armor" },
  { prefix: "front-shinguard-", slot: "frontShinguard", assetKey: "frontShinguardAssetKey", label: "Front Shinguard", kind: "armor" },
  { prefix: "back-greave-", slot: "backGreave", assetKey: "backGreaveAssetKey", label: "Back Greave", kind: "armor" },
  { prefix: "front-greave-", slot: "frontGreave", assetKey: "frontGreaveAssetKey", label: "Front Greave", kind: "armor" },
  { prefix: "back-boot-", slot: "backBoot", assetKey: "backBootAssetKey", label: "Back Boot", kind: "armor" },
  { prefix: "front-boot-", slot: "frontBoot", assetKey: "frontBootAssetKey", label: "Front Boot", kind: "armor" },
  { prefix: "breastplate-", slot: "breastplate", assetKey: "breastplateAssetKey", label: "Breastplate", kind: "armor" },
  { prefix: "helmet-", slot: "helmet", assetKey: "helmetAssetKey", label: "Helmet", kind: "armor" },
];

const generatedEquipmentAssetKeys = new Set(
  Object.values(GENERATED_EQUIPMENT_ITEM_ASSET_KEYS).flatMap((assetKeys) =>
    assetKeys ? Object.values(assetKeys).filter((assetKey): assetKey is string => typeof assetKey === "string") : [],
  ),
);

const registeredEquipmentAssetKeys = generatedEquipmentAssetKeys;

export const AUTO_EQUIPMENT_ITEM_RECORDS = createAutoEquipmentAssetEntries()
  .flatMap(([assetPath, url]) => createAutoEquipmentItemRecord(assetPath, url))
  .sort((left, right) => left.item.name.localeCompare(right.item.name)) as AutoEquipmentItemRecord[];

export const AUTO_EQUIPMENT_ITEM_IDS = AUTO_EQUIPMENT_ITEM_RECORDS.map((record) => record.item.id);

export const AUTO_EQUIPMENT_ITEM_CATALOG = Object.fromEntries(AUTO_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.item])) as Record<
  HeroItemId,
  HeroItemDefinition
>;

export const AUTO_EQUIPMENT_ITEM_ASSET_KEYS = Object.fromEntries(AUTO_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.assetKeys])) as Partial<
  Record<HeroItemId, EquipmentItemAssetKeys>
>;

export const AUTO_EQUIPMENT_ASSETS = AUTO_EQUIPMENT_ITEM_RECORDS.map((record) => record.asset);

function createAutoEquipmentItemRecord(assetPath: string, url: string): AutoEquipmentItemRecord[] {
  const assetKey = getAssetKey(assetPath);

  if (!assetKey || registeredEquipmentAssetKeys.has(assetKey)) {
    return [];
  }

  const slotConfig = equipmentAssetSlotConfigs.find((config) => assetKey.startsWith(config.prefix));

  if (!slotConfig) {
    return [];
  }

  const suffix = assetKey.slice(slotConfig.prefix.length);
  const material = suffix.split("-")[0] ?? "armor";
  const itemId = `auto_equipment_${toIdentifier(assetKey)}`;
  const lowAssetPath = assetPath.replace("./assets/", "./assets-low/").replace(/\.(?:png|webp)$/i, ".webp");
  const lowUrl = lowEquipmentAssetUrls[lowAssetPath];
  const asset: EquipmentAssetDefinition = {
    key: assetKey,
    url,
    ...(lowUrl ? { lowUrl } : {}),
    sourcePath: toSourcePath(assetPath),
    ...(lowUrl ? { lowSourcePath: toSourcePath(lowAssetPath) } : {}),
  };
  const item = createAutoItemDefinition(itemId, slotConfig, suffix, material);

  return [
    {
      item,
      assetKeys: { [slotConfig.assetKey]: assetKey },
      asset,
    },
  ];
}

function createAutoItemDefinition(itemId: string, slotConfig: EquipmentAssetSlotConfig, suffix: string, material: string): HeroItemDefinition {
  if (slotConfig.kind === "weapon") {
    return {
      id: itemId,
      name: formatWeaponName(suffix),
      kind: "weapon",
      weaponClass: getWeaponClassFromText(suffix),
      equipmentSlot: slotConfig.slot,
      damageBonus: 1,
    };
  }

  return {
    id: itemId,
    name: formatEquipmentName(slotConfig.label, suffix),
    kind: "armor",
    ...(getArmorCategory(material) ? { armorCategory: getArmorCategory(material) } : {}),
    equipmentSlot: slotConfig.slot,
    armorHp: 0,
  };
}

function createAutoEquipmentAssetEntries(): [string, string][] {
  const entriesByAssetKey = new Map<string, [string, string]>();

  Object.entries({ ...armorWebpAssetUrls, ...weaponWebpAssetUrls }).forEach(([assetPath, url]) => {
    const assetKey = getAssetKey(assetPath);

    if (assetKey) {
      entriesByAssetKey.set(assetKey, [assetPath, url]);
    }
  });

  Object.entries({ ...armorPngAssetUrls, ...weaponPngAssetUrls }).forEach(([assetPath, url]) => {
    const assetKey = getAssetKey(assetPath);

    if (assetKey && !entriesByAssetKey.has(assetKey)) {
      entriesByAssetKey.set(assetKey, [assetPath, url]);
    }
  });

  return [...entriesByAssetKey.values()];
}

function getAssetKey(assetPath: string): string | undefined {
  return assetPath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "");
}

function toSourcePath(assetPath: string): string {
  return assetPath.replace(/^\.\//, "");
}

function toIdentifier(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function formatEquipmentName(slotLabel: string, suffix: string): string {
  const parts = suffix.split("-").filter(Boolean);
  const material = parts[0] ? formatNamePart(parts[0]) : "Armor";
  const variant = parts.slice(1).map(formatNamePart).join(" ");

  return `${material} ${slotLabel}${variant ? ` ${variant}` : ""} (Auto)`;
}

function formatWeaponName(suffix: string): string {
  const name = suffix
    .split("-")
    .filter(Boolean)
    .map(formatNamePart)
    .join(" ");

  return `${name || "Weapon"} (Auto)`;
}

function getWeaponClassFromText(value: string): HeroItemDefinition["weaponClass"] {
  const text = value.toLowerCase();

  if (text.includes("bow")) {
    return "bow";
  }

  if (text.includes("shuriken")) {
    return "shuriken";
  }

  if (text.includes("axe")) {
    return "axe";
  }

  if (text.includes("mace")) {
    return "mace";
  }

  if (text.includes("spear")) {
    return "spear";
  }

  return "sword";
}

function formatNamePart(part: string): string {
  const displayPart = part === "light" ? "leather" : part;

  return displayPart ? `${displayPart[0]?.toUpperCase() ?? ""}${displayPart.slice(1)}` : "";
}

function getArmorCategory(material: string): HeroItemDefinition["armorCategory"] | undefined {
  if (material === "light") {
    return "leather";
  }

  return material === "leather" || material === "cloth" || material === "chain" || material === "plate" ? material : undefined;
}
