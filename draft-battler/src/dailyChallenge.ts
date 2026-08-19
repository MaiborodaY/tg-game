const UTC_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const DAILY_CHALLENGE_SEED_NAMESPACE = "bro-battler:daily:v1";

export type RunSource = "standard" | "daily";
export type DailyChallengeDateInput = Date | number;
export type DailyChallengeClock = () => DailyChallengeDateInput;

export interface DailyChallengeIdentity {
  source: "daily";
  dateKey: string;
  seed: string;
}

export function getUtcDateKey(input: DailyChallengeDateInput): string {
  const timestamp = readTimestamp(input);
  const dateKey = new Date(timestamp).toISOString().slice(0, 10);

  if (!UTC_DATE_KEY_PATTERN.test(dateKey)) {
    throw new RangeError("Daily challenge dates must use a four-digit UTC year.");
  }

  return dateKey;
}

export function createDailyChallenge(input: DailyChallengeDateInput): DailyChallengeIdentity {
  const dateKey = getUtcDateKey(input);

  return {
    source: "daily",
    dateKey,
    seed: createOpaqueSeed(dateKey),
  };
}

export function createTodayDailyChallenge(clock: DailyChallengeClock = Date.now): DailyChallengeIdentity {
  return createDailyChallenge(clock());
}

function readTimestamp(input: DailyChallengeDateInput): number {
  if (!(input instanceof Date) && typeof input !== "number") {
    throw new TypeError("Daily challenge date must be a Date or a timestamp.");
  }

  const timestamp = input instanceof Date ? input.getTime() : input;
  if (!Number.isFinite(timestamp)) {
    throw new RangeError("Daily challenge date must be valid.");
  }

  return timestamp;
}

function createOpaqueSeed(dateKey: string): string {
  const material = `${DAILY_CHALLENGE_SEED_NAMESPACE}:${dateKey}`;
  const first = stableHash(`${material}:a`).toString(16).padStart(8, "0");
  const second = stableHash(`${material}:b`).toString(16).padStart(8, "0");

  return `${DAILY_CHALLENGE_SEED_NAMESPACE}:${first}${second}`;
}

// This algorithm is part of the v1 identity contract; bump the namespace before changing it.
function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
