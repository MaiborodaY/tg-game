import type { ArenaDebugTuning } from "./debugTuning";
import type { EquipmentAssetDefinition, EquipmentItemAssetKeys } from "./equipmentAssetRegistry";
import type { HeroItemDefinition } from "./hero";

interface SaveProdDefaultsResponse {
  message?: string;
  updated?: number;
}

export interface PromoteEquipmentItemPayload {
  name: string;
  armorHp: number;
  price: number;
  addToShop: boolean;
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  asset: EquipmentAssetDefinition;
}

const saveProdDefaultsEndpoint = "/__dust-arena/save-prod-defaults";
const saveProdAnimationEndpoint = "/__dust-arena/save-prod-animation";
const promoteEquipmentItemEndpoint = "/__dust-arena/promote-equipment-item";

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

async function readResponse(response: Response): Promise<SaveProdDefaultsResponse> {
  try {
    return (await response.json()) as SaveProdDefaultsResponse;
  } catch {
    return { message: response.statusText };
  }
}
