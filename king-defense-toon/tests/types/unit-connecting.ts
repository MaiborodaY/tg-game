import { getConnectResult } from '../../unit-merging.ts';
import type { ArmyUnit, ConnectFailureReason, ConnectOptions, ConnectResult, Fighter, MergeSource } from '../../unit-merging.ts';

export function verifyConnectContracts(units: readonly ArmyUnit[], reserve: readonly Fighter[],
  recipient: MergeSource, donors: readonly MergeSource[]): void {
  const options: ConnectOptions = { minArmyUnits: 1 };
  const result: ConnectResult = getConnectResult(units, reserve, recipient, donors, options);
  if (result.ok) {
    const army: ArmyUnit[] = result.units;
    const stored: Fighter[] = result.reserve;
    const level: number = result.recipient.level;
    const consumed: readonly Fighter[] = result.consumed;
    const added: number = result.addedLevels;
    void [army, stored, level, consumed, added];
  } else {
    const reason: ConnectFailureReason = result.reason;
    // @ts-expect-error A rejected transaction exposes the original readonly roster.
    result.units.push(units[0]!);
    void reason;
  }
  const custom = getConnectResult([{ ...units[0]!, level: 1 as const, nickname: 'Guard' }],
    [{ ...reserve[0]!, level: 2 as const, badge: 'Reserve' }], recipient, donors);
  if (custom.ok) {
    const nickname: string = custom.units[0]!.nickname;
    const badge: string = custom.reserve[0]!.badge;
    // @ts-expect-error Recipient level can change in either collection.
    const oldArmyLevel: 1 = custom.units[0]!.level;
    // @ts-expect-error Reserve recipients also gain a numeric sum, not their literal former level.
    const oldReserveLevel: 2 = custom.reserve[0]!.level;
    void [nickname, badge, oldArmyLevel, oldReserveLevel];
  }
  // @ts-expect-error Connect uses explicit army or reserve locations.
  getConnectResult(units, reserve, { location: 'inventory', id: 1 }, donors);
  // @ts-expect-error Donors are a collection of located IDs, not plain numeric IDs.
  getConnectResult(units, reserve, recipient, [1]);
  // @ts-expect-error The army minimum is numeric.
  getConnectResult(units, reserve, recipient, donors, { minArmyUnits: '1' });
}
