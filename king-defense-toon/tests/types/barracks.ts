import { BARRACKS_UPGRADES, completeBarracksUpgrade, consumeFirstLancerGuarantee, createBarracks, getBarracksUpgrade, getBarracksUpgradeDefinition, speedUpBarracks, startBarracksUpgrade } from '../../barracks.ts';
import type { BarracksActionResult, BarracksFailureReason, BarracksLevel, BarracksState, BarracksUpgradeStatus, BarracksUpgradeTarget } from '../../barracks.ts';
import type { UnitType } from '../../units.ts';
import { createRecruitment } from '../../recruitment.ts';

// Compile-only checks cover both nullable construction clocks and action outcomes.
export function verifyBarracksContracts(saved: unknown): void {
  const barracks: BarracksState = createBarracks(saved, 1_800_000_000_000);
  const recruitment = createRecruitment(saved);
  const result: BarracksActionResult = startBarracksUpgrade(barracks, recruitment, 200);
  const level: BarracksLevel = barracks.level;
  const readyAt: number | null = barracks.upgradeReadyAt;
  const status: BarracksUpgradeStatus = getBarracksUpgrade(barracks, recruitment).status;
  const targetLevel: BarracksUpgradeTarget | null = getBarracksUpgrade(barracks, recruitment).targetLevel;
  const requiredRecruitTypes: readonly UnitType[] = getBarracksUpgrade(barracks, recruitment).requiredRecruitTypes;
  const duration: number | undefined = getBarracksUpgradeDefinition(level)?.durationMs;
  if (result.ok) {
    const reason: null = result.reason;
    void reason;
  } else {
    const reason: BarracksFailureReason = result.reason;
    const cost: 0 = result.cost;
    void [reason, cost];
  }
  barracks.level = 4;
  // @ts-expect-error Barracks have exactly four supported levels.
  barracks.level = 5;
  // @ts-expect-error Shared transition settings must not be mutated.
  BARRACKS_UPGRADES[3].cost = 1;
  // @ts-expect-error Requirement participants must not change between status and purchase.
  BARRACKS_UPGRADES[3].requiredRecruitTypes.push('elfArcher');
  // @ts-expect-error Maximum level has no next upgrade.
  const requiredTarget: BarracksUpgradeTarget = getBarracksUpgrade(barracks, recruitment).targetLevel;
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
  void [level, readyAt, status, targetLevel, requiredRecruitTypes, duration, requiredTarget, timestamp, inconsistent, chargedFailure];
}
