const BEST_SCORE_KEY = "farm-paws-best-score-v1";
const SNAKE_BEST_SCORE_KEY = "farm-paws-snake-best-score-v1";
const TETRIS_BEST_SCORE_KEY = "farm-paws-tetris-best-score-v1";

export function loadBestScore(): number {
  return loadScore(BEST_SCORE_KEY);
}

export function saveBestScore(score: number): void {
  saveScore(BEST_SCORE_KEY, score);
}

export function loadSnakeBestScore(): number {
  return loadScore(SNAKE_BEST_SCORE_KEY);
}

export function saveSnakeBestScore(score: number): void {
  saveScore(SNAKE_BEST_SCORE_KEY, score);
}

export function loadTetrisBestScore(): number {
  return loadScore(TETRIS_BEST_SCORE_KEY);
}

export function saveTetrisBestScore(score: number): void {
  saveScore(TETRIS_BEST_SCORE_KEY, score);
}

function loadScore(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = Number.parseInt(raw || "0", 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

function saveScore(key: string, score: number): void {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(score))));
  } catch {
    // Local storage can be blocked in some browser modes; the prototype still works without persistence.
  }
}
