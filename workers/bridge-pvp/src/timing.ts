export const HUMAN_ACTION_DURATION_MS = 35_000;

export function resolveHumanTurnDeadline(
  now: number,
  previousDeadline: number | undefined,
  preserveExisting: boolean,
): number {
  if (preserveExisting && typeof previousDeadline === "number") {
    return previousDeadline;
  }
  return now + HUMAN_ACTION_DURATION_MS;
}
