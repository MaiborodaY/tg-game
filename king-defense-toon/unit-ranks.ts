import { normalizeUnitLevel } from './recruitment.ts';

export type PaletteRank = 1 | 2 | 3 | 4 | 5;

export interface UnitRank {
  readonly level: PaletteRank;
  readonly name: string;
  readonly color: 'Blue' | 'Purple' | 'Red' | 'Yellow' | 'Black';
}

const RANKS: readonly UnitRank[] = Object.freeze([
  Object.freeze({ level: 1, name: 'Recruit', color: 'Blue' }),
  Object.freeze({ level: 2, name: 'Trained', color: 'Purple' }),
  Object.freeze({ level: 3, name: 'Veteran', color: 'Red' }),
  Object.freeze({ level: 4, name: 'Elite', color: 'Yellow' }),
  Object.freeze({ level: 5, name: 'Champion', color: 'Black' }),
]);

export function getUnitRank(level: unknown = 1): UnitRank {
  // `level` on a rank remains the existing palette key, not the fighter's personal level.
  const personalLevel = normalizeUnitLevel(level);
  const index = personalLevel >= 500 ? 4 : personalLevel >= 250 ? 3
    : personalLevel >= 100 ? 2 : personalLevel >= 50 ? 1 : 0;
  return RANKS[index]!;
}
