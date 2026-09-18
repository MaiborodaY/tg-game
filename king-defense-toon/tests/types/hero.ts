import { HERO_BRANCHES, HERO_TALENTS, createHero, getHeroProgress, getHeroStats, getHeroTalentStatus,
  heroXpForLevel, spendHeroTalent, resetHeroTalents, awardHeroXp } from '../../hero.ts';
import type { BranchId, TalentId, HeroState, HeroStats, HeroProgress, HeroOutcome, HeroXpResult,
  HeroTalentStatus, SpendHeroTalentResult, ResetHeroTalentsResult } from '../../hero.ts';

// Raw saves enter through createHero; gameplay callers work with a complete state.
export function verifyHeroContracts(saved: unknown): void {
  const hero: HeroState = createHero(saved);
  const branch: BranchId = HERO_BRANCHES[0].id;
  const talent: TalentId = HERO_TALENTS[0].id;
  const progress: HeroProgress = getHeroProgress(hero);
  const stats: HeroStats = getHeroStats(hero);
  const status: HeroTalentStatus = getHeroTalentStatus(hero, talent);
  const spend: SpendHeroTalentResult = spendHeroTalent(hero, talent);
  const reset: ResetHeroTalentsResult = resetHeroTalents(hero);
  const outcome: HeroOutcome = { waveNumber: 1, kills: 3, total: 3, won: true };
  const reward: HeroXpResult = awardHeroXp(hero, outcome);
  const emptyReward: HeroXpResult = awardHeroXp(hero);
  const xp: number = heroXpForLevel(20);
  hero.xp += reward.gained;
  hero.talents.heal_power = 1;
  stats.maxHp += 1; // Combat receives a mutable, independent snapshot.
  if (status.reason !== 'unknown') {
    const branchPoints: number = status.branchPoints;
    void branchPoints;
  }
  if (spend.spent) {
    const successReason: '' = spend.reason;
    void successReason;
  }

  // @ts-expect-error A saved value is not validated gameplay state.
  getHeroStats(saved);
  // @ts-expect-error A partial save must be passed through createHero first.
  getHeroProgress({ xp: 50 });
  // @ts-expect-error Mutating APIs require a complete hero state.
  resetHeroTalents({ talents: {} });
  // @ts-expect-error Branch identifiers are a closed set.
  const invalidBranch: BranchId = 'fire';
  // @ts-expect-error Talent identifiers are a closed set.
  const invalidTalent: TalentId = 'healing_power';
  // @ts-expect-error Talent lookup cannot silently accept misspelled IDs.
  getHeroTalentStatus(hero, 'healing_power');
  // @ts-expect-error An arbitrary UI string must be validated before spending a point.
  spendHeroTalent(hero, String(talent));
  // @ts-expect-error Level thresholds accept numeric input, with runtime guards for JS callers.
  heroXpForLevel('20');
  // @ts-expect-error Supplied outcomes must contain every field required for rewards.
  awardHeroXp(hero, { waveNumber: 1, kills: 1, total: 1 });
  // @ts-expect-error Victory flags are booleans rather than truthy saved text.
  awardHeroXp(hero, { ...outcome, won: 'yes' });
  // @ts-expect-error Raw outcomes must be validated before use in typed gameplay code.
  awardHeroXp(hero, saved);
  // @ts-expect-error An unknown talent does not have branch points.
  const branchPoints: number = status.branchPoints;
  // @ts-expect-error The shared branch collection is frozen.
  HERO_BRANCHES.push(HERO_BRANCHES[0]);
  // @ts-expect-error Each branch definition is frozen.
  HERO_BRANCHES[0].name = 'Changed';
  // @ts-expect-error The talent collection is frozen.
  HERO_TALENTS.pop();
  // @ts-expect-error Each talent definition is frozen.
  HERO_TALENTS[0].maxRank = 1;
  // @ts-expect-error State cannot acquire unknown talent fields through typed callers.
  hero.talents.unknown = 1;
  void [branch, progress, reset, emptyReward, xp, invalidBranch, invalidTalent, branchPoints];
}
