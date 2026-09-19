import { campaignSnapshot, createCampaignState, resetCampaignState, restoreCampaignState } from '../../campaign-state.ts';
import type { CampaignState, CampaignSnapshot } from '../../campaign-state.ts';
import { allocateCampaignUnitId } from '../../campaign-roster.ts';

export function checkCampaignStateContracts(raw: unknown, now: number): void {
  const state: CampaignState = createCampaignState(now);
  const restored: CampaignState = restoreCampaignState(raw, now);
  const snapshot: CampaignSnapshot = campaignSnapshot(restored);
  const next: number = allocateCampaignUnitId(state);
  const version: 5 = snapshot.saveSchemaVersion;
  resetCampaignState(state, now);
  // @ts-expect-error Every new campaign needs its explicit clock.
  createCampaignState();
  // @ts-expect-error Saved JSON must pass restoration before becoming campaign state.
  const unchecked: CampaignState = raw;
  // @ts-expect-error No untyped unit IDs may enter the command target space.
  allocateCampaignUnitId({ nextUnitId: '9' });
  // @ts-expect-error A fighter must name a known catalogue entry.
  state.reserve.push({ id: 1, type: 'unknown-unit', level: 1 });
  // @ts-expect-error Receipts are numeric amounts, not browser display strings.
  state.offlineRewards.forgeRefund = '5';
  // @ts-expect-error Snapshots cannot accidentally omit the consumed-ID cursor.
  const incomplete: CampaignSnapshot = { saveSchemaVersion: 4, campaignVersion: snapshot.campaignVersion };
  void [next, version, unchecked, incomplete];
}
