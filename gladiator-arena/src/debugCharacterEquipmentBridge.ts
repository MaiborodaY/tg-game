import type { EquipmentSlotKey, EquipmentTuning } from "./debugTuning";
import type { HeroItemId } from "./hero";

export interface DebugCharacterEquipmentSelection {
  slotKey: EquipmentSlotKey;
  itemId: HeroItemId | "";
}

export type DebugCharacterEquipmentDelta = Partial<Pick<EquipmentTuning, "x" | "y" | "angle">>;

interface DebugCharacterEquipmentDeltaDetail extends DebugCharacterEquipmentSelection {
  delta: DebugCharacterEquipmentDelta;
}

const equipmentSelectEvent = "dust-arena-debug-character-equipment-select";
const equipmentDeltaEvent = "dust-arena-debug-character-equipment-delta";

export function emitDebugCharacterEquipmentSelect(selection: DebugCharacterEquipmentSelection): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<DebugCharacterEquipmentSelection>(equipmentSelectEvent, { detail: selection }));
}

export function emitDebugCharacterEquipmentDelta(selection: DebugCharacterEquipmentSelection, delta: DebugCharacterEquipmentDelta): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<DebugCharacterEquipmentDeltaDetail>(equipmentDeltaEvent, { detail: { ...selection, delta } }));
}

export function subscribeDebugCharacterEquipmentSelect(listener: (selection: DebugCharacterEquipmentSelection) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event): void => {
    const selection = (event as CustomEvent<DebugCharacterEquipmentSelection>).detail;

    if (selection) {
      listener(selection);
    }
  };

  window.addEventListener(equipmentSelectEvent, handler);

  return () => window.removeEventListener(equipmentSelectEvent, handler);
}

export function subscribeDebugCharacterEquipmentDelta(
  listener: (selection: DebugCharacterEquipmentSelection, delta: DebugCharacterEquipmentDelta) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<DebugCharacterEquipmentDeltaDetail>).detail;

    if (detail) {
      listener({ slotKey: detail.slotKey, itemId: detail.itemId }, detail.delta);
    }
  };

  window.addEventListener(equipmentDeltaEvent, handler);

  return () => window.removeEventListener(equipmentDeltaEvent, handler);
}
