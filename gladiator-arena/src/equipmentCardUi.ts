import type { ShopItemRarity } from "./shopPresentation";

export type EquipmentCardRarity = ShopItemRarity | "empty";

export type EquipmentCardAction =
  | {
      kind: "price";
      iconUrl: string;
      value: number;
      state?: string;
    }
  | {
      kind: "status";
      label: string;
      state?: string;
    };

export interface EquipmentItemCardContentOptions {
  iconUrl?: string;
  iconFallback?: string;
  name: string;
  rarityLabel: string;
  typeLabel: string;
  statIconUrl: string;
  statLabel: string;
  statValue: number | string;
  diff?: number;
  action?: EquipmentCardAction;
}

export interface EquipmentSlotCardOptions {
  tagName?: "button" | "div";
  classNames?: readonly string[];
  iconClassNames?: readonly string[];
  rarity: EquipmentCardRarity;
  rarityClassName?: string;
  iconUrl?: string;
  fallbackText?: string;
  label: string;
  dataset?: Readonly<Record<string, string | undefined>>;
  count?: number | string;
  countClassName?: string;
}

export function createEquipmentItemCardContent(options: EquipmentItemCardContentOptions): HTMLElement {
  const content = document.createElement("span");
  const iconFrame = document.createElement("span");
  const icon = document.createElement("span");
  const info = document.createElement("span");
  const name = document.createElement("strong");
  const chips = document.createElement("span");
  const rarityChip = document.createElement("span");
  const typeChip = document.createElement("span");
  const statRow = document.createElement("span");

  content.className = "equipment-item-card__content";
  iconFrame.className = "equipment-item-card__icon-frame";
  icon.className = "equipment-item-card__icon";
  info.className = "equipment-item-card__info";
  name.className = "equipment-item-card__name";
  chips.className = "equipment-item-card__chips";
  rarityChip.className = "equipment-item-card__chip equipment-item-card__rarity";
  typeChip.className = "equipment-item-card__chip equipment-item-card__kind";
  statRow.className = "equipment-item-card__stat-row";

  if (options.iconUrl) {
    icon.style.backgroundImage = `url("${options.iconUrl}")`;
  } else {
    icon.textContent = options.iconFallback ?? "?";
  }

  name.textContent = options.name.toUpperCase();
  rarityChip.textContent = options.rarityLabel.toUpperCase();
  typeChip.textContent = options.typeLabel.toUpperCase();
  chips.append(rarityChip, typeChip);
  statRow.append(createEquipmentStatChip(options));
  if (options.diff !== undefined) {
    statRow.append(createEquipmentDiffChip(options.diff));
  }
  if (options.action) {
    statRow.append(createEquipmentActionChip(options.action));
  }
  iconFrame.append(icon);
  info.append(name, chips, statRow);
  content.append(iconFrame, info);

  return content;
}

export function createEquipmentSlotCard(options: EquipmentSlotCardOptions): HTMLElement {
  const slot = document.createElement(options.tagName ?? "button");
  const icon = document.createElement("span");

  slot.className = [
    "equipment-slot-card",
    `equipment-slot-card--${options.rarity}`,
    ...(options.classNames ?? []),
    options.rarityClassName,
  ]
    .filter(Boolean)
    .join(" ");
  slot.setAttribute("aria-label", options.label);
  slot.title = options.label;

  if (slot instanceof HTMLButtonElement) {
    slot.type = "button";
  }

  Object.entries(options.dataset ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      slot.dataset[key] = value;
    }
  });

  icon.className = ["equipment-slot-card__icon", ...(options.iconClassNames ?? [])].filter(Boolean).join(" ");
  if (options.iconUrl) {
    icon.style.backgroundImage = `url("${options.iconUrl}")`;
  } else {
    icon.textContent = options.fallbackText ?? "";
  }
  slot.append(icon);

  if (options.count !== undefined && String(options.count).length > 0) {
    const count = document.createElement("span");

    count.className = ["equipment-slot-card__count", options.countClassName].filter(Boolean).join(" ");
    count.textContent = String(options.count);
    slot.append(count);
  }

  return slot;
}

function createEquipmentStatChip(options: EquipmentItemCardContentOptions): HTMLElement {
  const stat = document.createElement("span");
  const icon = document.createElement("img");
  const value = document.createElement("span");

  stat.className = "equipment-item-card__stat";
  stat.setAttribute("aria-label", `${options.statLabel} ${options.statValue}`);
  icon.className = "equipment-item-card__stat-icon";
  icon.src = options.statIconUrl;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  value.className = "equipment-item-card__stat-value";
  value.textContent = String(options.statValue);
  stat.append(icon, value);

  return stat;
}

function createEquipmentDiffChip(diff: number): HTMLElement {
  const chip = document.createElement("span");

  chip.className = [
    "equipment-item-card__diff",
    diff > 0 ? "equipment-item-card__diff--better" : "",
    diff < 0 ? "equipment-item-card__diff--worse" : "",
    diff === 0 ? "equipment-item-card__diff--equal" : "",
  ]
    .filter(Boolean)
    .join(" ");
  chip.textContent = diff > 0 ? `+${diff}` : String(diff);
  chip.setAttribute("aria-label", diff > 0 ? `Better by ${diff}` : diff < 0 ? `Worse by ${Math.abs(diff)}` : "Same stat");

  return chip;
}

function createEquipmentActionChip(action: EquipmentCardAction): HTMLElement {
  const chip = document.createElement("span");

  chip.className = [
    action.kind === "price" ? "equipment-item-card__price" : "equipment-item-card__status",
    action.state ? `equipment-item-card__action--${action.state}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (action.kind === "price") {
    const icon = document.createElement("img");
    const value = document.createElement("span");

    chip.setAttribute("aria-label", `${action.value} gold`);
    icon.className = "equipment-item-card__price-icon";
    icon.src = action.iconUrl;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    value.className = "equipment-item-card__price-amount";
    value.textContent = String(action.value);
    chip.append(icon, value);
  } else {
    chip.textContent = action.label.toUpperCase();
  }

  return chip;
}
