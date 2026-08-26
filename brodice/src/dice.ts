export const MIN_DICE = 1;
export const MAX_DICE = 100;
export const DEFAULT_DICE_COUNT = 5;
export const DEFAULT_TARGET: RollTarget = 5;

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;
export type RollTarget = 2 | 3 | 4 | 5 | 6;
export type FaceCounts = readonly [number, number, number, number, number, number];
export type RandomByteFiller = (bytes: Uint8Array<ArrayBuffer>) => void;

const LARGEST_UNBIASED_BYTE = 252;
const MAX_RANDOM_ROUNDS = 1_024;

export function normalizeDiceCount(value: unknown, fallback = DEFAULT_DICE_COUNT): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return normalizeDiceCount(fallback, DEFAULT_DICE_COUNT);
  return Math.min(MAX_DICE, Math.max(MIN_DICE, Math.trunc(numeric)));
}

export function isRollTarget(value: unknown): value is RollTarget {
  return value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

export function isDieFace(value: unknown): value is DieFace {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 6;
}

export function rollDice(
  amount: number,
  fillRandomBytes: RandomByteFiller = fillSecureRandomBytes,
): readonly DieFace[] {
  const diceCount = normalizeDiceCount(amount);
  const faces: DieFace[] = [];
  let rounds = 0;

  while (faces.length < diceCount) {
    if (rounds >= MAX_RANDOM_ROUNDS) {
      throw new Error("The random source did not yield usable bytes.");
    }
    rounds += 1;

    const remaining = diceCount - faces.length;
    const bytes = new Uint8Array(Math.max(16, Math.min(256, remaining * 2)));
    fillRandomBytes(bytes);

    for (const byte of bytes) {
      // 252 is divisible by six; rejecting 252-255 avoids modulo bias.
      if (byte >= LARGEST_UNBIASED_BYTE) continue;
      faces.push(((byte % 6) + 1) as DieFace);
      if (faces.length === diceCount) break;
    }
  }

  return Object.freeze(faces);
}

export function countFaces(faces: readonly DieFace[]): FaceCounts {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const face of faces) counts[face - 1] += 1;
  return Object.freeze(counts) as FaceCounts;
}

export function countSuccesses(faces: readonly DieFace[], target: RollTarget): number {
  return faces.reduce((successes, face) => successes + (face >= target ? 1 : 0), 0);
}

export function formatTarget(target: RollTarget): string {
  return target === 6 ? "6 only" : `${target}+`;
}

function fillSecureRandomBytes(bytes: Uint8Array<ArrayBuffer>): void {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random generation is unavailable in this browser.");
  }
  globalThis.crypto.getRandomValues(bytes);
}
