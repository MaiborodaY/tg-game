import { normalizeUnitLevel } from './recruitment.ts';

export type PaletteRank = 1 | 2 | 3 | 4;

export interface UnitRank {
  readonly level: PaletteRank;
  readonly name: string;
  readonly color: 'Blue' | 'Purple' | 'Red' | 'Yellow';
}

const RANKS: readonly UnitRank[] = Object.freeze([
  Object.freeze({ level: 1, name: 'Recruit', color: 'Blue' }),
  Object.freeze({ level: 2, name: 'Trained', color: 'Purple' }),
  Object.freeze({ level: 3, name: 'Veteran', color: 'Red' }),
  Object.freeze({ level: 4, name: 'Elite', color: 'Yellow' }),
]);

export function getUnitRank(level: unknown = 1): UnitRank {
  // `level` on a rank remains the existing palette key, not the fighter's personal level.
  const index = Math.min(RANKS.length - 1, Math.floor((normalizeUnitLevel(level) - 1) / 25));
  // Normalized personal levels are 1–100, keeping this index inside the four ranks.
  return RANKS[index]!;
}
