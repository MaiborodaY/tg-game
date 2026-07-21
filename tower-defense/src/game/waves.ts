import { ENEMY_DEFINITIONS, FINAL_WAVE } from "./config.ts";
import type { CampaignAct, EnemyType, WavePlan, WaveSpawn } from "./types.ts";

export const BOSS_WAVES = Object.freeze([4, 8, 12, 16, 20, 24] as const);

export function createWavePlan(waveValue: number): WavePlan {
  const wave = Math.min(FINAL_WAVE, Math.max(1, Math.floor(Number(waveValue) || 1)));
  const hasBoss = isBossWave(wave);
  const rng = seededRandom(wave * 9_973 + 17);
  const types = shuffleComposition(createComposition(wave), rng);
  const healthMultiplier = getWaveHealthMultiplier(wave);
  const interval = wave <= 12 ? Math.max(430, 820 - wave * 17) : Math.max(420, 760 - wave * 14);
  let atMs = 0;

  const spawns: WaveSpawn[] = types.map((type, index) => {
    const definition = ENEMY_DEFINITIONS[type];
    const boss = type === "boss" || type === "titan";
    const elite = wave >= 13 && !boss && (index + wave) % 7 === 0;
    const bossMultiplier = boss ? 1 + Math.floor(wave / 4) * 0.18 : 1;
    const eliteMultiplier = elite ? 1.42 : 1;
    const lateResistance = wave > 12 ? Math.min(0.08, (wave - 12) * 0.006) : 0;
    const spawn = Object.freeze({
      id: wave * 10_000 + index,
      type,
      atMs: Math.round(atMs),
      maxHp: Math.round(definition.baseHp * healthMultiplier * bossMultiplier * eliteMultiplier),
      speed: definition.speed * Math.min(1.4, 1 + (wave - 1) * 0.01) * (elite ? 1.06 : 1),
      reward: lateReward(type, definition.reward, wave, elite),
      leakDamage: definition.leakDamage + (elite ? 1 : 0),
      physicalResistance: Math.min(0.72, definition.physicalResistance + lateResistance + (elite ? 0.06 : 0)),
      magicResistance: Math.min(0.72, definition.magicResistance + lateResistance + (elite ? 0.06 : 0)),
      shieldRatio: Math.min(0.55, definition.shieldRatio + (elite ? 0.12 : 0)),
      controlResistance: Math.min(0.85, definition.controlResistance + (elite ? 0.12 : 0)),
      healingRadius: definition.healingRadius,
      healingRatio: definition.healingRatio,
      elite,
      bossTier: getWaveAct(wave),
      summonThresholds: Object.freeze(type === "titan" ? titanThresholds(wave) : []),
      summonCount: type === "titan" ? (wave >= 24 ? 4 : 3) : 0,
    });
    atMs += interval * (0.88 + rng() * 0.24);
    if (wave > 12 && (index + 1) % 8 === 0) atMs += 600;
    return spawn;
  });

  return Object.freeze({
    wave,
    spawns: Object.freeze(spawns),
    clearBonus: wave <= 12 ? 20 + wave * 4 + (hasBoss ? 24 : 0) : 90 + (wave - 13) * 4 + (hasBoss ? 30 : 0),
    hasBoss,
    act: getWaveAct(wave),
    threat: Math.min(5, Math.ceil(wave / 5)) as 1 | 2 | 3 | 4 | 5,
  });
}

export function getWaveHealthMultiplier(waveValue: number): number {
  const wave = Math.min(FINAL_WAVE, Math.max(1, Math.floor(Number(waveValue) || 1)));
  return wave <= 12
    ? Math.pow(1.1, wave - 1)
    : Math.pow(1.1, 11) * Math.pow(1.145, wave - 12);
}

export function getWaveAct(waveValue: number): CampaignAct {
  const wave = Math.min(FINAL_WAVE, Math.max(1, Math.floor(Number(waveValue) || 1)));
  return Math.min(3, Math.ceil(wave / 8)) as CampaignAct;
}

export function isBossWave(wave: number): boolean {
  return BOSS_WAVES.includes(wave as (typeof BOSS_WAVES)[number]);
}

export function getBossRepair(wave: number): number {
  if (!isBossWave(wave) || wave >= FINAL_WAVE) return 0;
  return wave < 16 ? 2 : 1;
}

function createComposition(wave: number): EnemyType[] {
  const compositions: Record<number, readonly [EnemyType, number][]> = {
    1: [["raider", 8]],
    2: [["raider", 10]],
    3: [["raider", 8], ["swift", 6]],
    4: [["raider", 6], ["boss", 1]],
    5: [["raider", 8], ["swift", 8], ["brute", 2]],
    6: [["swift", 12], ["brute", 4]],
    7: [["raider", 10], ["swift", 10], ["brute", 4]],
    8: [["swift", 8], ["brute", 4], ["boss", 1]],
    9: [["swift", 12], ["brute", 5], ["warden", 3]],
    10: [["raider", 10], ["swift", 12], ["brute", 6], ["warden", 3]],
    11: [["swift", 16], ["brute", 8], ["warden", 5]],
    12: [["swift", 8], ["brute", 8], ["warden", 6], ["boss", 1]],
    13: [["raider", 12], ["swift", 12], ["brute", 6], ["warden", 4], ["shade", 4]],
    14: [["swift", 16], ["brute", 8], ["warden", 5], ["shade", 8]],
    15: [["raider", 12], ["brute", 8], ["warden", 6], ["bulwark", 3], ["shaman", 2]],
    16: [["swift", 12], ["brute", 8], ["bulwark", 4], ["shaman", 2], ["titan", 1]],
    17: [["swift", 16], ["shade", 12], ["brute", 8], ["warden", 6]],
    18: [["raider", 12], ["swift", 12], ["brute", 10], ["warden", 6], ["bulwark", 5], ["shaman", 2]],
    19: [["swift", 18], ["shade", 12], ["brute", 8], ["bulwark", 6], ["shaman", 3]],
    20: [["raider", 10], ["warden", 8], ["bulwark", 6], ["shaman", 3], ["shade", 8], ["titan", 1]],
    21: [["swift", 14], ["shade", 14], ["brute", 9], ["warden", 7], ["bulwark", 5], ["shaman", 3]],
    22: [["raider", 14], ["swift", 14], ["brute", 10], ["warden", 7], ["bulwark", 7], ["shaman", 4]],
    23: [["swift", 16], ["shade", 14], ["brute", 10], ["warden", 8], ["bulwark", 8], ["shaman", 4]],
    24: [["shade", 10], ["brute", 10], ["warden", 8], ["bulwark", 8], ["shaman", 4], ["titan", 1]],
  };
  return compositions[wave].flatMap(([type, count]) => Array.from({ length: count }, () => type));
}

function shuffleComposition(types: readonly EnemyType[], rng: () => number): EnemyType[] {
  const bosses = types.filter((type) => type === "boss" || type === "titan");
  const regular = types.filter((type) => type !== "boss" && type !== "titan");
  for (let index = regular.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [regular[index], regular[swapIndex]] = [regular[swapIndex], regular[index]];
  }
  return [...regular, ...bosses];
}

function lateReward(type: EnemyType, baseReward: number, wave: number, elite: boolean): number {
  if (wave <= 12) return baseReward + Math.floor(wave / 4);
  const bossBonus = type === "boss" || type === "titan" ? Math.ceil(baseReward * 0.35) : 0;
  return Math.ceil((baseReward + 3) * 0.5) + bossBonus + (elite ? 4 : 0);
}

function titanThresholds(wave: number): number[] {
  if (wave >= 24) return [0.75, 0.5, 0.25];
  if (wave >= 20) return [0.66, 0.33];
  return [0.5];
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}
