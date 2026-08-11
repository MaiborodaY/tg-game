import type { UnitRole, UnitTag } from "./types";

export const SYNERGY_THRESHOLD = 2;

export const SYNERGY_TAG_ORDER = [
  "warrior",
  "beast",
  "mage",
  "undead",
  "rogue",
  "guardian",
] as const satisfies readonly UnitTag[];

export interface SynergyEffect {
  stat: "attack" | "hp";
  value: number;
}

export interface SynergyRule {
  threshold: number;
  effect: SynergyEffect;
  eligibleRoles?: readonly UnitRole[];
}

export const SYNERGY_RULES = {
  warrior: { threshold: SYNERGY_THRESHOLD, effect: { stat: "attack", value: 1 } },
  beast: { threshold: SYNERGY_THRESHOLD, effect: { stat: "attack", value: 1 } },
  mage: {
    threshold: SYNERGY_THRESHOLD,
    effect: { stat: "attack", value: 1 },
    eligibleRoles: ["caster", "support"],
  },
  undead: { threshold: SYNERGY_THRESHOLD, effect: { stat: "hp", value: 2 } },
  rogue: { threshold: SYNERGY_THRESHOLD, effect: { stat: "attack", value: 1 } },
  guardian: { threshold: SYNERGY_THRESHOLD, effect: { stat: "hp", value: 2 } },
} as const satisfies Readonly<Record<UnitTag, SynergyRule>>;

export function isRoleEligibleForSynergy(rule: SynergyRule, role: UnitRole): boolean {
  return rule.eligibleRoles?.includes(role) ?? true;
}
