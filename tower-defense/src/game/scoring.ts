import { FINAL_WAVE } from "./config.ts";

const ACT_SIZE = 8;

export const MAX_RATING_SCORE = calculateRatingScore(FINAL_WAVE);

export function calculateRatingScore(completedWaves: unknown): number {
  const waves = normalizeCompletedWaves(completedWaves);
  const firstAct = Math.min(waves, ACT_SIZE);
  const secondAct = Math.min(Math.max(0, waves - ACT_SIZE), ACT_SIZE);
  const thirdAct = Math.max(0, waves - ACT_SIZE * 2);
  return firstAct * 2 + secondAct * 3 + thirdAct * 4;
}

function normalizeCompletedWaves(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(FINAL_WAVE, Math.max(0, Math.floor(parsed)));
}
