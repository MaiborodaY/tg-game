const ARMOR_ICON = "🛡";

// Combat keeps legacy shield field names for snapshot and PvP compatibility;
// the player-facing mechanic is presented as armor.
export function applyArmorDelta(currentArmor: number, delta: number): number {
  return Math.max(0, Math.trunc(currentArmor + delta));
}

export function formatArmorBadge(armor: number): string {
  return armor > 0 ? `${ARMOR_ICON} ${Math.trunc(armor)}` : "";
}

export function formatDamageFeedback(damage: number, armorAbsorbed: number): string {
  const damagePart = damage > 0 ? `-${Math.trunc(damage)}` : "";
  const armorPart = armorAbsorbed > 0 ? `${ARMOR_ICON}-${Math.trunc(armorAbsorbed)}` : "";

  return [damagePart, armorPart].filter(Boolean).join("  ") || "0";
}
