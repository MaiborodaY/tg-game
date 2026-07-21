import { ENEMY_DEFINITIONS } from "./config.ts";
import type { EnemyType, WavePlan, WaveSpawn } from "./types.ts";

export function createWavePlan(waveValue: number): WavePlan {
  const wave = Math.max(1, Math.floor(Number(waveValue) || 1));
  const hasBoss = wave === 4 || wave === 8 || wave === 12;
  const rng = seededRandom(wave * 9_973 + 17);
  const types = createComposition(wave);
  const healthMultiplier = Math.pow(1.1, wave - 1);
  const interval = Math.max(430, 820 - wave * 17);
  let atMs = 0;
  const spawns: WaveSpawn[] = types.map((type, index) => {
    const definition = ENEMY_DEFINITIONS[type];
    const eliteMultiplier = type === "boss" ? 1 + Math.floor(wave / 4) * 0.22 : 1;
    const spawn = Object.freeze({
      id: wave * 10_000 + index,
      type,
      atMs: Math.round(atMs),
      maxHp: Math.round(definition.baseHp * healthMultiplier * eliteMultiplier),
      speed: definition.speed * Math.min(1.28, 1 + (wave - 1) * 0.008),
      reward: definition.reward + Math.floor(wave / 4),
      leakDamage: definition.leakDamage,
      physicalResistance: definition.physicalResistance,
      magicResistance: definition.magicResistance,
    });
    atMs += interval * (0.88 + rng() * 0.24);
    return spawn;
  });

  return Object.freeze({
    wave,
    spawns: Object.freeze(spawns),
    clearBonus: 20 + wave * 4 + (hasBoss ? 24 : 0),
    hasBoss,
  });
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
  };
  const selected = compositions[Math.min(12, wave)] || compositions[12];
  return selected.flatMap(([type, count]) => Array.from({ length: count }, () => type));
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
