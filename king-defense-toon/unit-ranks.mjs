import { normalizeUnitLevel } from './recruitment.mjs';

const RANKS = Object.freeze([
  Object.freeze({ level: 1, name: 'Recruit', color: 'Blue' }),
  Object.freeze({ level: 2, name: 'Trained', color: 'Purple' }),
  Object.freeze({ level: 3, name: 'Veteran', color: 'Red' }),
  Object.freeze({ level: 4, name: 'Elite', color: 'Yellow' }),
]);

export function getUnitRank(level = 1) {
  // `level` on a rank remains the existing palette key, not the fighter's personal level.
  const index = Math.min(RANKS.length - 1, Math.floor((normalizeUnitLevel(level) - 1) / 25));
  return RANKS[index];
}
