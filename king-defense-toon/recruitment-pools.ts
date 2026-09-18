export type RecruitmentPool = 'humans' | 'elves';
export type ElfRecruitId = 'pantherRider' | 'elfArcher' | 'elfHealer' | 'unicorn';

export interface ElfRecruitPreview {
  readonly id: ElfRecruitId;
  readonly name: string;
  readonly role: string;
  readonly locked: boolean;
  readonly playable: boolean;
}

// Planned elves remain visible without entering the live recruitment odds or battle catalogue.
export const ELF_RECRUITS: readonly ElfRecruitPreview[] = Object.freeze([
  Object.freeze({ id: 'pantherRider', name: 'Panther Rider', role: 'Melee', locked: false, playable: true }),
  Object.freeze({ id: 'elfArcher', name: 'Elven Archer', role: 'Ranged', locked: false, playable: false }),
  Object.freeze({ id: 'elfHealer', name: 'Elven Healer', role: 'Healing', locked: false, playable: false }),
  Object.freeze({ id: 'unicorn', name: 'Unicorn', role: 'Special', locked: true, playable: false }),
]);

export function isRecruitmentPoolUnlocked(pool: RecruitmentPool, barracksLevel: number): boolean {
  if (pool === 'humans') return barracksLevel === 1 || barracksLevel === 2 || barracksLevel === 3;
  return pool === 'elves' && barracksLevel === 3;
}

export function normalizeRecruitmentPool(saved: unknown, barracksLevel: number): RecruitmentPool {
  return saved === 'elves' && isRecruitmentPoolUnlocked('elves', barracksLevel) ? 'elves' : 'humans';
}

export function canRecruitFromPool(pool: RecruitmentPool, barracksLevel: number): boolean {
  return isRecruitmentPoolUnlocked(pool, barracksLevel);
}

export function getRecruitmentPoolName(pool: RecruitmentPool): string {
  return pool === 'elves' ? 'Elven recruits' : 'Human recruits';
}
