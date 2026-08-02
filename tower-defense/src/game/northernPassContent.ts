import { ENEMY_DEFINITIONS } from "./config.ts";
import type {
  CampaignAct,
  EnemyType,
  EnemyVariant,
  LevelProgression,
  NorthernAvalancheZoneId,
  NorthernPassWavePlan,
  NorthernRouteVariantId,
  Point,
  WavePlan,
  WaveSpawn,
} from "./types.ts";
import { NORTHERN_AVALANCHE_ZONES } from "./northernPassMechanics.ts";

export const NORTHERN_PASS_FINAL_WAVE = 24;

export const NORTHERN_PASS_PROGRESSION: LevelProgression = Object.freeze({
  heroUpgradeWaves: Object.freeze([4, 12]) as readonly [number, number],
  masteryWave: 14,
  awakeningWave: 20,
  actSize: 8,
});

// A diagonal three-turn ascent keeps the familiar S readability while making
// the pass visually and tactically distinct from Forest Gate's square lanes.
export const NORTHERN_PASS_RIDGE_ROUTE: readonly Point[] = freezePoints([
  { x: -24, y: 54 },
  { x: 68, y: 54 },
  { x: 118, y: 104 },
  { x: 320, y: 104 },
  { x: 354, y: 144 },
  { x: 314, y: 188 },
  { x: 92, y: 188 },
  { x: 50, y: 234 },
  { x: 92, y: 280 },
  { x: 310, y: 280 },
  { x: 350, y: 326 },
  { x: 310, y: 372 },
  { x: 118, y: 372 },
  { x: 78, y: 418 },
  { x: 122, y: 462 },
  { x: 190, y: 462 },
  { x: 190, y: 530 },
]);

export const NORTHERN_PASS_RAVINE_ROUTE: readonly Point[] = freezePoints([
  { x: -24, y: 54 }, { x: 68, y: 54 }, { x: 118, y: 104 },
  { x: 320, y: 104 }, { x: 354, y: 144 }, { x: 314, y: 188 },
  // Act II moves both switchbacks into the inner ravine corridors. Existing
  // central pads stay useful while the road visibly stops hugging the cliffs.
  { x: 104, y: 188 }, { x: 104, y: 280 }, { x: 310, y: 280 },
  { x: 310, y: 372 }, { x: 118, y: 372 }, { x: 78, y: 418 },
  { x: 122, y: 462 }, { x: 190, y: 462 },
  { x: 190, y: 530 },
]);

export const NORTHERN_PASS_SUMMIT_ROUTE: readonly Point[] = freezePoints([
  { x: -24, y: 54 }, { x: 68, y: 54 }, { x: 118, y: 104 },
  // Act III opens a dangerous eastern chute and removes one whole shelf. The
  // summit cut still crosses the authored ice bridge before its western drop.
  { x: 320, y: 104 }, { x: 354, y: 144 }, { x: 314, y: 188 },
  { x: 314, y: 280 }, { x: 82, y: 280 }, { x: 82, y: 372 },
  { x: 118, y: 372 }, { x: 78, y: 418 },
  { x: 122, y: 462 }, { x: 190, y: 462 },
  { x: 190, y: 530 },
]);

export const NORTHERN_PASS_ROUTE = NORTHERN_PASS_RIDGE_ROUTE;

export const NORTHERN_PASS_ROUTE_VARIANTS: Readonly<Record<NorthernRouteVariantId, readonly Point[]>> = Object.freeze({
  ridge: NORTHERN_PASS_RIDGE_ROUTE,
  ravine: NORTHERN_PASS_RAVINE_ROUTE,
  summit: NORTHERN_PASS_SUMMIT_ROUTE,
});

export const NORTHERN_PASS_BUILD_PADS: readonly Point[] = freezePoints([
  { x: 30, y: 125 },
  { x: 168, y: 54 },
  { x: 258, y: 54 },
  { x: 352, y: 74 },
  { x: 160, y: 146 },
  { x: 248, y: 146 },
  { x: 42, y: 334 },
  { x: 164, y: 234 },
  { x: 252, y: 234 },
  { x: 356, y: 236 },
  { x: 134, y: 326 },
  { x: 238, y: 326 },
  { x: 270, y: 430 },
]);

export const NORTHERN_PASS_HERO_ANCHORS: readonly Point[] = freezePoints([
  { x: 18, y: 264 },
  { x: 376, y: 360 },
  { x: 284, y: 510 },
]);

type NorthernWaveGroup = Readonly<{
  type: EnemyType;
  count: number;
  variant?: EnemyVariant;
  frostArmorRatio?: number;
  hpScale?: number;
  speedScale?: number;
  eliteEvery?: number;
  gapAfterMs?: number;
  healingRadius?: number;
  healingRatio?: number;
  summonThresholds?: readonly number[];
  summonCount?: number;
}>;

type NorthernWaveBlueprint = Readonly<{
  healthScale: number;
  rewardScale: number;
  intervalMs: number;
  clearBonus: number;
  threat: 1 | 2 | 3 | 4 | 5;
  groups: readonly NorthernWaveGroup[];
  mixedFormation: boolean;
}>;

const NORTHERN_DANGER_ZONE_SCHEDULE: readonly NorthernAvalancheZoneId[] = Object.freeze([
  "upper", "upper", "middle", "lower", "upper", "middle", "lower", "middle",
  "upper", "middle", "lower", "upper", "middle", "lower", "upper", "middle",
  "lower", "upper", "middle", "lower", "upper", "middle", "lower", "middle",
]);

const standard = (type: EnemyType, count: number, options: Omit<NorthernWaveGroup, "type" | "count"> = {}): NorthernWaveGroup => (
  Object.freeze({ type, count, variant: "standard", frostArmorRatio: 0, ...options })
);

const runner = (type: EnemyType, count: number, options: Omit<NorthernWaveGroup, "type" | "count" | "variant"> = {}): NorthernWaveGroup => (
  Object.freeze({ type, count, variant: "snow-runner", frostArmorRatio: 0, speedScale: 1.08, ...options })
);

const icebound = (type: EnemyType, count: number, frostArmorRatio: number, options: Omit<NorthernWaveGroup, "type" | "count" | "variant" | "frostArmorRatio"> = {}): NorthernWaveGroup => (
  Object.freeze({ type, count, variant: "icebound", frostArmorRatio, speedScale: 0.94, ...options })
);

const NORTHERN_PASS_WAVES: readonly NorthernWaveBlueprint[] = Object.freeze([
  wave(1.00, 1.00, 760, 24, 1, [standard("raider", 8)]),
  wave(1.08, 0.95, 700, 27, 1, [standard("raider", 6), runner("swift", 5)]),
  wave(1.18, 0.92, 680, 30, 1, [standard("raider", 8), icebound("brute", 3, 0.18)]),
  wave(1.32, 0.90, 630, 34, 2, [runner("swift", 8), standard("raider", 7)], true),
  wave(1.48, 0.86, 600, 38, 2, [standard("raider", 8), runner("swift", 6), icebound("warden", 4, 0.24)], true),
  wave(1.68, 0.82, 570, 42, 2, [standard("raider", 8), icebound("brute", 5, 0.26), standard("shaman", 1)], true),
  wave(1.90, 0.78, 540, 46, 3, [runner("swift", 10), icebound("warden", 5, 0.3), standard("raider", 8)], true),
  wave(2.15, 0.75, 520, 70, 3, [
    runner("swift", 3, { gapAfterMs: 0 }), icebound("brute", 3, 0.32, { gapAfterMs: 0 }),
    icebound("boss", 1, 0.44, { hpScale: 1.05, gapAfterMs: 0 }),
    standard("raider", 6, { gapAfterMs: 0 }), runner("swift", 5, { gapAfterMs: 0 }),
    standard("shaman", 1, { gapAfterMs: 0 }),
  ]),

  wave(2.20, 0.72, 500, 50, 3, [standard("raider", 8), runner("swift", 8), icebound("brute", 5, 0.3)], true),
  wave(2.45, 0.69, 480, 54, 3, [runner("swift", 10), icebound("warden", 6, 0.34), standard("raider", 7)], true),
  wave(2.70, 0.66, 460, 58, 3, [icebound("bulwark", 3, 0.38), standard("shaman", 2), runner("swift", 10), standard("raider", 8)], true),
  wave(3.00, 0.63, 440, 62, 4, [runner("swift", 12), runner("shade", 6), icebound("warden", 6, 0.38), standard("raider", 6)], true),
  wave(3.30, 0.60, 420, 66, 4, [runner("shade", 10), icebound("brute", 8, 0.38), icebound("warden", 5, 0.42), standard("shaman", 2), standard("raider", 7)], true),
  wave(3.65, 0.58, 405, 70, 4, [runner("swift", 12), icebound("bulwark", 5, 0.46), icebound("warden", 6, 0.42), standard("shaman", 2), standard("raider", 8)], true),
  wave(4.00, 0.56, 390, 75, 4, [runner("shade", 12, { eliteEvery: 8 }), icebound("brute", 8, 0.4), icebound("warden", 7, 0.46), icebound("bulwark", 4, 0.5), standard("shaman", 2), standard("raider", 4)], true),
  wave(4.40, 0.54, 380, 110, 5, [
    runner("swift", 4, { gapAfterMs: 0 }), icebound("bulwark", 4, 0.5, { gapAfterMs: 0 }),
    icebound("boss", 1, 0.58, { hpScale: 1.12, healingRadius: 118, healingRatio: 0.04, gapAfterMs: 0 }),
    standard("raider", 6, { gapAfterMs: 0 }), runner("shade", 7, { gapAfterMs: 0 }),
    icebound("warden", 5, 0.46, { gapAfterMs: 0 }), standard("shaman", 2, { gapAfterMs: 0 }),
  ]),

  wave(4.45, 0.52, 370, 82, 4, [runner("swift", 12), runner("shade", 10), icebound("brute", 7, 0.42), icebound("warden", 6, 0.46)], true),
  wave(4.75, 0.50, 360, 88, 4, [icebound("bulwark", 6, 0.54), icebound("warden", 8, 0.48), standard("shaman", 3), runner("swift", 12), standard("raider", 8)], true),
  wave(5.00, 0.48, 350, 94, 5, [runner("shade", 12, { eliteEvery: 8 }), runner("swift", 10), icebound("brute", 8, 0.44), icebound("bulwark", 5, 0.54), standard("shaman", 3)], true),
  wave(5.25, 0.46, 340, 100, 5, [standard("raider", 8), runner("swift", 12), icebound("warden", 7, 0.5), icebound("bulwark", 6, 0.56), standard("shaman", 3)], true),
  wave(5.55, 0.44, 330, 106, 5, [runner("swift", 14, { eliteEvery: 8 }), runner("shade", 10), icebound("brute", 8, 0.46), icebound("warden", 6, 0.5), standard("shaman", 3)], true),
  wave(5.85, 0.42, 320, 112, 5, [standard("raider", 8), runner("shade", 12, { eliteEvery: 7 }), icebound("warden", 8, 0.52), icebound("bulwark", 7, 0.58), standard("shaman", 4), runner("swift", 5)], true),
  wave(6.15, 0.40, 310, 120, 5, [runner("swift", 14, { eliteEvery: 7 }), runner("shade", 12, { eliteEvery: 7 }), icebound("brute", 8, 0.48), icebound("bulwark", 6, 0.58), standard("shaman", 4)], true),
  wave(6.60, 0.38, 300, 180, 5, [
    runner("swift", 5, { eliteEvery: 5, gapAfterMs: 0 }), icebound("bulwark", 5, 0.6, { gapAfterMs: 0 }),
    icebound("titan", 1, 0.68, { hpScale: 0.6, summonThresholds: [0.72, 0.42], summonCount: 3, gapAfterMs: 0 }),
    runner("shade", 10, { eliteEvery: 7, gapAfterMs: 0 }), icebound("warden", 8, 0.54, { gapAfterMs: 0 }),
    standard("shaman", 4, { gapAfterMs: 0 }), standard("raider", 7, { gapAfterMs: 0 }),
  ]),
]);

export function createNorthernPassWave(waveValue: number): WavePlan {
  return createAuthoredNorthernWave(waveValue);
}

function createAuthoredNorthernWave(waveValue: number): WavePlan {
  if (!Number.isInteger(waveValue) || waveValue < 1 || waveValue > NORTHERN_PASS_FINAL_WAVE) {
    throw new RangeError(`Wave must be an integer between 1 and ${NORTHERN_PASS_FINAL_WAVE}.`);
  }
  const blueprint = NORTHERN_PASS_WAVES[waveValue - 1];
  const act = Math.ceil(waveValue / NORTHERN_PASS_PROGRESSION.actSize) as CampaignAct;
  const v3HealthPressure = ([1, 1.28, 1.45] as const)[act - 1];
  const v3IceboundFrostArmorFloor = ([0.18, 0.42, 0.58] as const)[act - 1];
  const spawns: WaveSpawn[] = [];
  let atMs = 0;

  for (const slot of createFormationSlots(blueprint)) {
    const { group, groupIndex } = slot;
    const definition = ENEMY_DEFINITIONS[group.type];
    const elite = Boolean(group.eliteEvery && (groupIndex + 1) % group.eliteEvery === 0);
    const variant = group.variant ?? "standard";
    const variantSpeed = variant === "snow-runner" ? 1.08 : variant === "icebound" ? 0.94 : 1;
    const variantControl = variant === "snow-runner" ? 0.12 : variant === "icebound" ? 0.08 : 0;
    const variantPhysical = variant === "icebound" ? 0.04 : 0;
    const spawnIndex = spawns.length;
    spawns.push(Object.freeze({
      id: waveValue * 10_000 + spawnIndex,
      type: group.type,
      variant,
      atMs: Math.round(atMs),
      maxHp: Math.max(1, Math.round(
        definition.baseHp
        * blueprint.healthScale
        * v3HealthPressure
        * (group.hpScale ?? 1)
        * (elite ? 1.35 : 1),
      )),
      speed: definition.speed * (group.speedScale ?? variantSpeed) * Math.min(1.18, 1 + (waveValue - 1) * 0.006),
      reward: Math.max(0, Math.ceil(definition.reward * blueprint.rewardScale) + (elite ? 3 : 0)),
      leakDamage: definition.leakDamage + (elite ? 1 : 0),
      physicalResistance: Math.min(0.72, definition.physicalResistance + variantPhysical + (elite ? 0.05 : 0)),
      magicResistance: Math.min(0.72, definition.magicResistance + (elite ? 0.05 : 0)),
      shieldRatio: Math.min(0.55, definition.shieldRatio + (elite ? 0.08 : 0)),
      frostArmorRatio: Math.min(
        0.8,
        (variant === "icebound"
          ? Math.max(v3IceboundFrostArmorFloor, group.frostArmorRatio ?? 0)
          : group.frostArmorRatio ?? 0)
        + (elite && variant === "icebound" ? 0.06 : 0),
      ),
      controlResistance: Math.min(0.9, definition.controlResistance + variantControl + (elite ? 0.08 : 0)),
      healingRadius: group.healingRadius ?? definition.healingRadius,
      healingRatio: group.healingRatio ?? definition.healingRatio,
      elite,
      bossTier: act,
      summonThresholds: Object.freeze([...(group.summonThresholds ?? [])]),
      summonCount: group.summonCount ?? 0,
    }));
    atMs += blueprint.intervalMs;
    if (slot.endsSequentialGroup) {
      atMs += group.gapAfterMs ?? Math.round(blueprint.intervalMs * 0.45);
    }
  }

  const frozenSpawns = Object.freeze(spawns);
  const basePlan = {
    wave: waveValue,
    spawns: frozenSpawns,
    clearBonus: blueprint.clearBonus,
    hasBoss: frozenSpawns.some((spawn) => spawn.type === "boss" || spawn.type === "titan"),
    act,
    threat: blueprint.threat,
  } as const;
  return Object.freeze({
    ...basePlan,
    northernPass: createNorthernPassMechanicPlan(waveValue, act, basePlan.hasBoss),
  });
}

export function createNorthernPassMechanicPlan(
  waveValue: number,
  actValue?: CampaignAct,
  bossWave?: boolean,
): NorthernPassWavePlan {
  if (!Number.isInteger(waveValue) || waveValue < 1 || waveValue > NORTHERN_PASS_FINAL_WAVE) {
    throw new RangeError(`Wave must be an integer between 1 and ${NORTHERN_PASS_FINAL_WAVE}.`);
  }
  const act = actValue ?? Math.ceil(waveValue / NORTHERN_PASS_PROGRESSION.actSize) as CampaignAct;
  const routeVariantId = (["ridge", "ravine", "summit"] as const)[act - 1];
  const hasBoss = bossWave ?? (waveValue === 8 || waveValue === 16 || waveValue === 24);
  return Object.freeze({
    routeVariantId,
    routePoints: NORTHERN_PASS_ROUTE_VARIANTS[routeVariantId],
    avalancheCharges: hasBoss ? 2 : 1,
    zones: NORTHERN_AVALANCHE_ZONES,
    dangerZoneId: NORTHERN_DANGER_ZONE_SCHEDULE[waveValue - 1],
  });
}

function wave(
  healthScale: number,
  rewardScale: number,
  intervalMs: number,
  clearBonus: number,
  threat: 1 | 2 | 3 | 4 | 5,
  groups: readonly NorthernWaveGroup[],
  mixedFormation = false,
): NorthernWaveBlueprint {
  return Object.freeze({ healthScale, rewardScale, intervalMs, clearBonus, threat, groups: Object.freeze([...groups]), mixedFormation });
}

type FormationSlot = Readonly<{
  group: NorthernWaveGroup;
  groupIndex: number;
  endsSequentialGroup: boolean;
}>;

function createFormationSlots(blueprint: NorthernWaveBlueprint): readonly FormationSlot[] {
  const slots: FormationSlot[] = [];
  if (!blueprint.mixedFormation) {
    for (const group of blueprint.groups) {
      for (let groupIndex = 0; groupIndex < group.count; groupIndex += 1) {
        slots.push(Object.freeze({ group, groupIndex, endsSequentialGroup: groupIndex === group.count - 1 }));
      }
    }
    return slots;
  }

  const counts = blueprint.groups.map(() => 0);
  let remaining = blueprint.groups.reduce((total, group) => total + group.count, 0);
  while (remaining > 0) {
    blueprint.groups.forEach((group, index) => {
      if (counts[index] >= group.count) return;
      slots.push(Object.freeze({ group, groupIndex: counts[index], endsSequentialGroup: false }));
      counts[index] += 1;
      remaining -= 1;
    });
  }
  return slots;
}

function freezePoints(points: readonly Point[]): readonly Point[] {
  return Object.freeze(points.map((point) => Object.freeze({ x: point.x, y: point.y })));
}
