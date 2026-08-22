import type { SynergyThreshold, UnitRole, UnitTag } from "./types";

export const SYNERGY_THRESHOLD = 2;
export const SYNERGY_MASTERY_THRESHOLD = 4;

export const SYNERGY_TAG_ORDER = [
  "warrior",
  "beast",
  "mage",
  "undead",
  "rogue",
  "guardian",
] as const satisfies readonly UnitTag[];

export type SynergyEffect =
  | { kind: "stat"; stat: "attack" | "hp" | "speed" | "armor"; value: number }
  | { kind: "opening_damage"; value: number }
  | { kind: "first_undead_death_attack"; value: number }
  | { kind: "first_attack_damage"; value: number };

export interface SynergyTier {
  threshold: SynergyThreshold;
  effect: SynergyEffect;
  eligibleRoles?: readonly UnitRole[];
}

export interface SynergyRule {
  tiers: readonly [SynergyTier, SynergyTier];
}

export const SYNERGY_RULES = {
  warrior: {
    tiers: [
      { threshold: SYNERGY_THRESHOLD, effect: { kind: "stat", stat: "attack", value: 1 } },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "stat", stat: "armor", value: 1 } },
    ],
  },
  beast: {
    tiers: [
      { threshold: SYNERGY_THRESHOLD, effect: { kind: "stat", stat: "attack", value: 1 } },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "stat", stat: "speed", value: 1 } },
    ],
  },
  mage: {
    tiers: [
      {
        threshold: SYNERGY_THRESHOLD,
        effect: { kind: "stat", stat: "attack", value: 1 },
        eligibleRoles: ["caster", "support"],
      },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "opening_damage", value: 1 } },
    ],
  },
  undead: {
    tiers: [
      { threshold: SYNERGY_THRESHOLD, effect: { kind: "stat", stat: "hp", value: 2 } },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "first_undead_death_attack", value: 1 } },
    ],
  },
  rogue: {
    tiers: [
      { threshold: SYNERGY_THRESHOLD, effect: { kind: "stat", stat: "attack", value: 1 } },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "first_attack_damage", value: 2 } },
    ],
  },
  guardian: {
    tiers: [
      { threshold: SYNERGY_THRESHOLD, effect: { kind: "stat", stat: "hp", value: 2 } },
      { threshold: SYNERGY_MASTERY_THRESHOLD, effect: { kind: "stat", stat: "armor", value: 1 } },
    ],
  },
} as const satisfies Readonly<Record<UnitTag, SynergyRule>>;

export function getActiveSynergyTiers(rule: SynergyRule, count: number): readonly SynergyTier[] {
  return rule.tiers.filter((tier) => count >= tier.threshold);
}

export function getSynergyEffectScore(effect: SynergyEffect): number {
  if (effect.kind === "stat") {
    if (effect.stat === "hp") {
      return effect.value * 2.5;
    }

    if (effect.stat === "attack") {
      return effect.value * 5;
    }

    return effect.value * 10;
  }

  if (effect.kind === "first_attack_damage") {
    return effect.value * 5;
  }

  return effect.value * 10;
}

export function isRoleEligibleForSynergy(tier: SynergyTier, role: UnitRole): boolean {
  return tier.eligibleRoles?.includes(role) ?? true;
}
