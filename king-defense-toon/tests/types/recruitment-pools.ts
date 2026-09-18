import { ELF_RECRUITS, canRecruitFromPool, isRecruitmentPoolUnlocked, normalizeRecruitmentPool } from '../../recruitment-pools.ts';
import type { RecruitmentPool } from '../../recruitment-pools.ts';
import type { UnitType } from '../../units.ts';

export function verifyRecruitmentPoolContracts(saved: unknown): void {
  const pool: RecruitmentPool = normalizeRecruitmentPool(saved, 3);
  const selectable: boolean = isRecruitmentPoolUnlocked(pool, 3);
  const recruitable: boolean = canRecruitFromPool(pool, 3);
  // @ts-expect-error A pool selection is not a deployable battle unit type.
  const fighter: UnitType = pool;
  // @ts-expect-error The full elf preview catalogue also contains unimplemented types.
  const elf: UnitType = ELF_RECRUITS[0]!.id;
  const rider: UnitType = 'pantherRider';
  const playable: boolean = ELF_RECRUITS[0]!.playable;
  // @ts-expect-error Only supported recruitment pools can be selected.
  isRecruitmentPoolUnlocked('undead', 3);
  // @ts-expect-error The preview catalogue is immutable.
  ELF_RECRUITS[0]!.locked = true;
  void [selectable, recruitable, fighter, elf, rider, playable];
}
