import type { ArenaDebugTuning, EquipmentTuning } from "./debugTuning";
import type { EquipmentAssetDefinition, EquipmentItemAssetKeys } from "./equipmentAssetRegistry";
import type { ArenaBossDefinition, HeroItemDefinition, HeroItemRarity } from "./hero";

interface SaveProdDefaultsResponse {
  message?: string;
  updated?: number;
}

export interface PromoteEquipmentItemPayload {
  name: string;
  armorHp: number;
  damageBonus: number;
  price: number;
  addToShop: boolean;
  availability: {
    shop: boolean;
    enemyPool: boolean;
    bossUnique: boolean;
  };
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  asset: EquipmentAssetDefinition;
  equipmentTuning: EquipmentTuning;
}

export interface UpdateGeneratedShopItemPayload {
  itemIds: string[];
  rarity: HeroItemRarity;
  stat: number;
  price: number;
}

export interface UpdateGeneratedBossItemPayload {
  itemIds: string[];
  stat: number;
}

export interface RenameEquipmentSetAssetEntry {
  sourcePath: string;
  targetPrefix: string;
}

export interface RenameEquipmentSetAssetsPayload {
  setName: string;
  variant: string;
  entries: RenameEquipmentSetAssetEntry[];
}

const saveProdDefaultsEndpoint = "/__dust-arena/save-prod-defaults";
const saveProdAnimationEndpoint = "/__dust-arena/save-prod-animation";
const promoteEquipmentItemEndpoint = "/__dust-arena/promote-equipment-item";
const updateGeneratedShopItemEndpoint = "/__dust-arena/update-generated-shop-item";
const updateGeneratedBossItemEndpoint = "/__dust-arena/update-generated-boss-item";
const removeEquipmentItemEndpoint = "/__dust-arena/remove-equipment-item";
const renameEquipmentSetAssetsEndpoint = "/__dust-arena/rename-equipment-set-assets";
const saveArenaBossEndpoint = "/__dust-arena/save-arena-boss";

export async function saveProdDefaults(tuning: ArenaDebugTuning): Promise<string> {
  const response = await fetch(saveProdDefaultsEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tuning),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? "Could not save prod defaults. Is the Vite dev server running?");
  }

  return payload.message ?? `Saved ${payload.updated ?? 0} prod defaults.`;
}

export async function saveProdAnimation(tuning: ArenaDebugTuning): Promise<string> {
  const response = await fetch(saveProdAnimationEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tuning),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? "Could not save prod animation. Is the Vite dev server running?");
  }

  return payload.message ?? "Saved animation to prod.";
}

export async function savePromotedEquipmentItem(payload: PromoteEquipmentItemPayload): Promise<string> {
  const response = await fetch(promoteEquipmentItemEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not promote equipment item. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Promoted equipment item.";
}

export async function removePromotedEquipmentItem(itemId: string): Promise<string> {
  const response = await fetch(removeEquipmentItemEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ itemId }),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not remove equipment item. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Removed equipment item.";
}

export async function saveGeneratedShopItem(payload: UpdateGeneratedShopItemPayload): Promise<string> {
  const response = await fetch(updateGeneratedShopItemEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not update generated shop item. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Updated generated shop item.";
}

export async function saveGeneratedBossItem(payload: UpdateGeneratedBossItemPayload): Promise<string> {
  const response = await fetch(updateGeneratedBossItemEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not update generated boss item. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Updated generated boss item.";
}

export async function renameEquipmentSetAssets(payload: RenameEquipmentSetAssetsPayload): Promise<string> {
  const response = await fetch(renameEquipmentSetAssetsEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not rename equipment set assets. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Renamed equipment set assets.";
}

export async function saveArenaBoss(payload: ArenaBossDefinition): Promise<string> {
  const response = await fetch(saveArenaBossEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responsePayload.message ?? "Could not save arena boss. Is the Vite dev server running?");
  }

  return responsePayload.message ?? "Saved arena boss.";
}

async function readResponse(response: Response): Promise<SaveProdDefaultsResponse> {
  try {
    return (await response.json()) as SaveProdDefaultsResponse;
  } catch {
    return { message: response.statusText };
  }
}
