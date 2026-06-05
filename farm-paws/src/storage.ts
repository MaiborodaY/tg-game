const BEST_SCORE_KEY = "farm-paws-best-score-v1";

export function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number.parseInt(raw || "0", 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    // Local storage can be blocked in some browser modes; the prototype still works without persistence.
  }
}
