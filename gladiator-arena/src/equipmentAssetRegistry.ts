import {
  FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_HELMET_LIGHT_ASSET_KEY,
} from "./assets";
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

interface ArmorAssetSlotConfig {
  prefix: string;
  slot: Exclude<HeroEquipmentSlotKey, "weaponMain">;
  assetKey: keyof EquipmentItemAssetKeys;
  label: string;
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

const armorAssetSlotConfigs: ArmorAssetSlotConfig[] = [
  { prefix: "back-shoulderguard-", slot: "backShoulderguard", assetKey: "backShoulderguardAssetKey", label: "Back Shoulderguard" },
  { prefix: "front-shoulderguard-", slot: "frontShoulderguard", assetKey: "frontShoulderguardAssetKey", label: "Front Shoulderguard" },
  { prefix: "back-wrist-", slot: "backWrist", assetKey: "backWristAssetKey", label: "Back Wrist" },
  { prefix: "front-wrist-", slot: "frontWrist", assetKey: "frontWristAssetKey", label: "Front Wrist" },
  { prefix: "back-glove-", slot: "backGlove", assetKey: "backGloveAssetKey", label: "Back Glove" },
  { prefix: "front-glove-", slot: "frontGlove", assetKey: "frontGloveAssetKey", label: "Front Glove" },
  { prefix: "back-shinguard-", slot: "backShinguard", assetKey: "backShinguardAssetKey", label: "Back Shinguard" },
  { prefix: "front-shinguard-", slot: "frontShinguard", assetKey: "frontShinguardAssetKey", label: "Front Shinguard" },
  { prefix: "back-greave-", slot: "backGreave", assetKey: "backGreaveAssetKey", label: "Back Greave" },
  { prefix: "front-greave-", slot: "frontGreave", assetKey: "frontGreaveAssetKey", label: "Front Greave" },
  { prefix: "back-boot-", slot: "backBoot", assetKey: "backBootAssetKey", label: "Back Boot" },
  { prefix: "front-boot-", slot: "frontBoot", assetKey: "frontBootAssetKey", label: "Front Boot" },
  { prefix: "breastplate-", slot: "breastplate", assetKey: "breastplateAssetKey", label: "Breastplate" },
  { prefix: "helmet-", slot: "helmet", assetKey: "helmetAssetKey", label: "Helmet" },
];

const manualEquipmentAssetKeys = new Set([
  FIGHTER_HELMET_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
]);

const generatedEquipmentAssetKeys = new Set(
  Object.values(GENERATED_EQUIPMENT_ITEM_ASSET_KEYS).flatMap((assetKeys) =>
    assetKeys ? Object.values(assetKeys).filter((assetKey): assetKey is string => typeof assetKey === "string") : [],
  ),
);

const registeredEquipmentAssetKeys = new Set([...manualEquipmentAssetKeys, ...generatedEquipmentAssetKeys]);

export const AUTO_EQUIPMENT_ITEM_RECORDS = createAutoArmorAssetEntries()
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

  const slotConfig = armorAssetSlotConfigs.find((config) => assetKey.startsWith(config.prefix));

  if (!slotConfig) {
    return [];
  }

  const suffix = assetKey.slice(slotConfig.prefix.length);
  const material = suffix.split("-")[0] ?? "armor";
  const itemId = `auto_equipment_${toIdentifier(assetKey)}`;
  const lowAssetPath = assetPath.replace("./assets/", "./assets-low/").replace(/\.(?:png|webp)$/i, ".webp");
  const lowUrl = lowArmorAssetUrls[lowAssetPath];
  const asset: EquipmentAssetDefinition = {
    key: assetKey,
    url,
    ...(lowUrl ? { lowUrl } : {}),
    sourcePath: toSourcePath(assetPath),
    ...(lowUrl ? { lowSourcePath: toSourcePath(lowAssetPath) } : {}),
  };
  const item: HeroItemDefinition = {
    id: itemId,
    name: formatEquipmentName(slotConfig.label, suffix),
    kind: "armor",
    ...(getArmorCategory(material) ? { armorCategory: getArmorCategory(material) } : {}),
    equipmentSlot: slotConfig.slot,
    armorHp: 0,
  };

  return [
    {
      item,
      assetKeys: { [slotConfig.assetKey]: assetKey },
      asset,
    },
  ];
}

function createAutoArmorAssetEntries(): [string, string][] {
  const entriesByAssetKey = new Map<string, [string, string]>();

  Object.entries(armorWebpAssetUrls).forEach(([assetPath, url]) => {
    const assetKey = getAssetKey(assetPath);

    if (assetKey) {
      entriesByAssetKey.set(assetKey, [assetPath, url]);
    }
  });

  Object.entries(armorPngAssetUrls).forEach(([assetPath, url]) => {
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
