import { ENEMY_DEFINITIONS } from "./config.ts";
import type {
  CampaignAct,
  EnemyType,
  EnemyVariant,
  LevelProgression,
  NorthernStormPlan,
  NorthernStormSectorId,
  Point,
  WavePlan,
  WaveSpawn,
} from "./types.ts";

export const NORTHERN_PASS_FINAL_WAVE = 18;

export const NORTHERN_PASS_PROGRESSION: LevelProgression = Object.freeze({
  heroUpgradeWaves: Object.freeze([3, 9]) as readonly [number, number],
  masteryWave: 9,
  awakeningWave: 14,
  actSize: 6,
});

// A diagonal three-turn ascent keeps the familiar S readability while making
// the pass visually and tactically distinct from Forest Gate's square lanes.
export const NORTHERN_PASS_ROUTE: readonly Point[] = freezePoints([
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
  { x: 24, y: 258 },
  { x: 366, y: 350 },
  { x: 284, y: 510 },
]);

export const NORTHERN_PASS_SIGNAL_FIRES: readonly Point[] = freezePoints([
  { x: 26, y: 218 },
  { x: 364, y: 382 },
  { x: 230, y: 492 },
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

const NORTHERN_STORM_SCHEDULE: readonly (readonly NorthernStormSectorId[])[] = Object.freeze([
  sectors("upper"), sectors("middle"), sectors("lower"),
  sectors("upper"), sectors("middle"), sectors("lower"),
  sectors("upper", "middle"), sectors("middle", "lower"), sectors("upper", "lower"),
  sectors("middle", "lower"), sectors("upper", "middle"), sectors("upper", "lower"),
  sectors("middle", "lower"), sectors("upper", "lower"), sectors("upper", "middle"),
  sectors("middle", "lower"), sectors("upper", "lower"), sectors("upper", "middle", "lower"),
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
  wave(1.00, 1.00, 760, 30, 1, [standard("raider", 8)]),
  wave(1.08, 1.00, 720, 34, 1, [standard("raider", 7), runner("swift", 5)]),
  wave(1.18, 1.00, 700, 38, 1, [standard("raider", 8), icebound("brute", 2, 0.18)]),
  wave(1.30, 1.00, 660, 44, 2, [runner("swift", 9), standard("raider", 6)], true),
  wave(1.45, 0.96, 640, 50, 2, [standard("raider", 8), runner("swift", 6), icebound("warden", 3, 0.24)], true),
  wave(1.70, 0.94, 620, 78, 2, [standard("raider", 8), icebound("boss", 1, 0.42, { hpScale: 1.08 }), runner("swift", 5)], true),

  wave(1.82, 0.81, 530, 53, 3, [standard("raider", 9), runner("swift", 8), icebound("brute", 4, 0.24)], true),
  wave(2.02, 0.79, 515, 58, 3, [runner("swift", 10), icebound("warden", 5, 0.3)], true),
  wave(2.24, 0.77, 505, 63, 3, [standard("raider", 10), runner("swift", 8), icebound("bulwark", 2, 0.36)], true),
  wave(2.48, 0.76, 485, 70, 3, [runner("swift", 9), icebound("brute", 5, 0.28), standard("shaman", 2)], true),
  wave(2.76, 0.74, 470, 77, 4, [standard("raider", 9), runner("shade", 8), icebound("warden", 5, 0.34)], true),
  wave(3.12, 0.72, 460, 104, 4, [icebound("bulwark", 4, 0.42), icebound("boss", 1, 0.52, { hpScale: 1.16, healingRadius: 118, healingRatio: 0.04 }), standard("shaman", 2)], true),

  wave(3.38, 0.65, 400, 87, 4, [standard("raider", 10), runner("shade", 10, { eliteEvery: 7 }), icebound("warden", 6, 0.38)], true),
  wave(3.72, 0.63, 385, 94, 4, [runner("swift", 13, { eliteEvery: 8 }), icebound("bulwark", 5, 0.46), standard("shaman", 3)], true),
  wave(4.08, 0.61, 375, 100, 5, [runner("shade", 10, { eliteEvery: 6 }), icebound("brute", 8, 0.36), icebound("warden", 7, 0.42)], true),
  wave(4.48, 0.60, 360, 107, 5, [standard("raider", 9), runner("swift", 14, { eliteEvery: 7 }), icebound("bulwark", 6, 0.5), standard("shaman", 3)], true),
  wave(4.92, 0.58, 350, 116, 5, [runner("shade", 14, { eliteEvery: 6 }), icebound("warden", 8, 0.46), icebound("bulwark", 6, 0.54), standard("shaman", 4)], true),
  wave(5.45, 0.56, 345, 162, 5, [runner("swift", 10, { eliteEvery: 5 }), icebound("titan", 1, 0.68, { hpScale: 1.22, summonThresholds: [0.72, 0.42], summonCount: 3 }), icebound("bulwark", 6, 0.56), standard("shaman", 3), runner("shade", 10, { eliteEvery: 5 })], true),
]);

export function createNorthernPassWave(waveValue: number): WavePlan {
  if (!Number.isInteger(waveValue) || waveValue < 1 || waveValue > NORTHERN_PASS_FINAL_WAVE) {
    throw new RangeError(`Wave must be an integer between 1 and ${NORTHERN_PASS_FINAL_WAVE}.`);
  }
  const blueprint = NORTHERN_PASS_WAVES[waveValue - 1];
  const act = Math.ceil(waveValue / NORTHERN_PASS_PROGRESSION.actSize) as CampaignAct;
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
      maxHp: Math.max(1, Math.round(definition.baseHp * blueprint.healthScale * (group.hpScale ?? 1) * (elite ? 1.35 : 1))),
      speed: definition.speed * (group.speedScale ?? variantSpeed) * Math.min(1.18, 1 + (waveValue - 1) * 0.006),
      reward: Math.max(0, Math.ceil(definition.reward * blueprint.rewardScale) + (elite ? 3 : 0)),
      leakDamage: definition.leakDamage + (elite ? 1 : 0),
      physicalResistance: Math.min(0.72, definition.physicalResistance + variantPhysical + (elite ? 0.05 : 0)),
      magicResistance: Math.min(0.72, definition.magicResistance + (elite ? 0.05 : 0)),
      shieldRatio: Math.min(0.55, definition.shieldRatio + (elite ? 0.08 : 0)),
      frostArmorRatio: Math.min(0.8, (group.frostArmorRatio ?? 0) + (elite && variant === "icebound" ? 0.06 : 0)),
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
  return Object.freeze({
    wave: waveValue,
    spawns: frozenSpawns,
    clearBonus: blueprint.clearBonus,
    hasBoss: frozenSpawns.some((spawn) => spawn.type === "boss" || spawn.type === "titan"),
    act,
    threat: blueprint.threat,
    northernStorm: createNorthernPassStormPlan(waveValue),
  });
}

export function createNorthernPassStormPlan(waveValue: number): NorthernStormPlan {
  if (!Number.isInteger(waveValue) || waveValue < 1 || waveValue > NORTHERN_PASS_FINAL_WAVE) {
    throw new RangeError(`Wave must be an integer between 1 and ${NORTHERN_PASS_FINAL_WAVE}.`);
  }
  const act = Math.ceil(waveValue / NORTHERN_PASS_PROGRESSION.actSize) as CampaignAct;
  return Object.freeze({
    sectorIds: NORTHERN_STORM_SCHEDULE[waveValue - 1],
    runnerSpeedBonus: ([0.15, 0.2, 0.25] as const)[act - 1],
    iceboundControlResistanceBonus: 0.2,
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

function sectors(...ids: NorthernStormSectorId[]): readonly NorthernStormSectorId[] {
  return Object.freeze(ids);
}

function freezePoints(points: readonly Point[]): readonly Point[] {
  return Object.freeze(points.map((point) => Object.freeze({ x: point.x, y: point.y })));
}
