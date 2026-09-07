import type { BattleTimelineUnit, CombatStepEvent } from "../game/battleTimeline";
import { formatArmorBadge, formatDamageFeedback } from "./armorPresentation";

export const UNIT_VITALS_WIDTH = 48;
export const UNIT_VITALS_BAR_HEIGHT = 5;

export function getUnitVitals(hp: number, maxHp: number, armor: number) {
  const maximum = safeInteger(maxHp);
  const current = Math.min(maximum, safeInteger(hp));
  const protection = safeInteger(armor);
  return {
    hpLabel: `${current}/${maximum}`,
    armorLabel: formatArmorBadge(protection),
    armor: protection,
    ratio: maximum > 0 ? current / maximum : 0,
    alive: current > 0,
  };
}

export interface UnitCombatFeedback {
  unitId: string;
  label: string;
  tone: "damage" | "heal" | "armor" | "block";
  amount: number;
}

/** One short signed result per recipient; keep damage and healing separate instead of netting them. */
export function createUnitCombatFeedback(
  events: readonly CombatStepEvent[],
  units: readonly Pick<BattleTimelineUnit, "unitId" | "owner">[],
  blockLabel: string,
): readonly UnitCombatFeedback[] {
  const totals = new Map<string, { damage: number; armor: number; heal: number; block: boolean }>();
  for (const event of events) {
    if (event.type !== "unit_damage" && event.type !== "unit_heal" && event.type !== "unit_block") continue;
    const total = totals.get(event.unitId) ?? { damage: 0, armor: 0, heal: 0, block: false };
    if (event.type === "unit_damage") {
      total.damage += safeInteger(event.amount);
      total.armor += safeInteger(event.shieldAbsorbed);
    } else if (event.type === "unit_heal") total.heal += safeInteger(event.amount);
    else total.block = true;
    totals.set(event.unitId, total);
  }
  const candidates: UnitCombatFeedback[] = [];
  for (const [unitId, total] of totals) {
    const hit = total.damage + total.armor > 0 ? formatDamageFeedback(total.damage, total.armor) : "";
    const label = [hit, total.heal > 0 ? `+${total.heal}` : ""].filter(Boolean).join(" · ") || (total.block ? blockLabel : "");
    if (!label) continue;
    candidates.push({ unitId, label, tone: total.damage > 0 ? "damage" : total.heal > 0 ? "heal" : total.armor > 0 ? "armor" : "block", amount: total.damage + total.armor + total.heal });
  }
  const owners = new Map(units.map((unit) => [unit.unitId, unit.owner]));
  // A busy simultaneous step gets two informative labels per side, not a wall of twelve numbers.
  return (["player", "enemy"] as const).flatMap((owner) => candidates
    .filter((item) => owners.get(item.unitId) === owner)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 2));
}

function safeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}
