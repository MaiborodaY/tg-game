import { completeBarracksUpgrade, consumeFirstLancerGuarantee, createBarracks, getBarracksUpgrade, speedUpBarracks, startBarracksUpgrade } from '../../barracks.ts';
import type { BarracksActionResult, BarracksFailureReason, BarracksLevel, BarracksState, BarracksUpgradeStatus } from '../../barracks.ts';
import { createRecruitment } from '../../recruitment.ts';

// Compile-only checks cover both nullable construction clocks and action outcomes.
export function verifyBarracksContracts(saved: unknown): void {
  const barracks: BarracksState = createBarracks(saved, 1_800_000_000_000);
  const recruitment = createRecruitment(saved);
  const result: BarracksActionResult = startBarracksUpgrade(barracks, recruitment, 200);
  const level: BarracksLevel = barracks.level;
  const readyAt: number | null = barracks.upgradeReadyAt;
  const status: BarracksUpgradeStatus = getBarracksUpgrade(barracks, recruitment).status;
  if (result.ok) {
    const reason: null = result.reason;
    void reason;
  } else {
    const reason: BarracksFailureReason = result.reason;
    const cost: 0 = result.cost;
    void [reason, cost];
  }
  // @ts-expect-error Barracks have exactly two supported levels.
  barracks.level = 3;
  // @ts-expect-error A construction timer can be absent.
  const timestamp: number = barracks.upgradeReadyAt;
  // @ts-expect-error Saved data must be normalized before mutation.
  completeBarracksUpgrade(saved);
  // @ts-expect-error Mutation APIs consume numeric clock timestamps.
  completeBarracksUpgrade(barracks, '1800000000000');
  // @ts-expect-error Eligibility needs recruitment state, not a personal fighter level.
  startBarracksUpgrade(barracks, { swordsmanLevel: 100 }, 200);
  // @ts-expect-error Gold must be numeric after loading the save.
  speedUpBarracks(barracks, '100');
  // @ts-expect-error Only allied unit identifiers can consume the guarantee.
  consumeFirstLancerGuarantee(barracks, 'goblin');
  // @ts-expect-error A successful operation cannot also have a failure reason.
  const inconsistent: BarracksActionResult = { ok: true, gold: 0, reason: 'locked', cost: 200 };
  // @ts-expect-error A failed operation never deducts an action cost.
  const chargedFailure: BarracksActionResult = { ok: false, gold: 200, reason: 'locked', cost: 200 };
  void [level, readyAt, status, timestamp, inconsistent, chargedFailure];
}
