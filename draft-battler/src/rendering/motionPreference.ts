export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export interface MotionPreferenceSource {
  matchMedia: (query: string) => { matches: boolean };
}

export function prefersReducedBattleMotion(source: MotionPreferenceSource | undefined): boolean {
  try {
    return source?.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches === true;
  } catch {
    return false;
  }
}
