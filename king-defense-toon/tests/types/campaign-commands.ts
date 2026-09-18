import { createCampaignState } from '../../campaign-state.ts';
import { recruitFighter, deployReserveFighter, purchaseForgeUpgrade, plantCampaignCrop,
  learnCampaignHeroTalent, resetCampaignHeroTalents, selectRecruitmentPool, connectCampaignFighters } from '../../campaign-commands.ts';
import { createBattleRewardReceipt, applyCampaignBattleResult, applyBattleKillRewards } from '../../campaign-rewards.ts';

const state = createCampaignState(1);
const recruited = recruitFighter(state, { now: 1, random: () => 0 });
if (recruited.ok) {
  const id: number = recruited.fighter.id;
  deployReserveFighter(state, id, '2:0');
} else {
  const reason: string = recruited.reason;
  void reason;
  // @ts-expect-error Failed recruitment has no owned fighter.
  recruited.fighter;
}
// @ts-expect-error Commands require an explicit clock and random source.
recruitFighter(state, { now: 1 });
// @ts-expect-error Unit references retain numeric identity.
deployReserveFighter(state, '1', '2:0');
// @ts-expect-error Removed forge track cannot be bought.
purchaseForgeUpgrade(state, 'rangedAttack');
// @ts-expect-error Crop IDs are not arbitrary strings.
plantCampaignCrop(state, 'cabbage', 1);
// @ts-expect-error Talent IDs are not arbitrary strings.
learnCampaignHeroTalent(state, 'unlimited_damage');
// @ts-expect-error Reset must supply live battle context.
resetCampaignHeroTalents(state);
// @ts-expect-error Planned faction is not a current recruitment pool.
selectRecruitmentPool(state, 'orcs');
// @ts-expect-error Batch connect must supply minimum army context.
connectCampaignFighters(state, { location: 'army', id: 1 }, []);
// @ts-expect-error An empty object is not explicit minimum-army context.
connectCampaignFighters(state, { location: 'army', id: 1 }, [], {});
const receipt = createBattleRewardReceipt(1);
applyBattleKillRewards(state, receipt, { kills: 0, totalGold: 0 }, () => 0);
// @ts-expect-error Reward replay requires cumulative gold, not a frame delta.
applyBattleKillRewards(state, receipt, { kills: 1, gold: 1 }, () => 0);
// @ts-expect-error Outcome must include explicit victory/defeat.
applyCampaignBattleResult(state, receipt, { waveNumber: 1, kills: 1, total: 1 });
