import { createArmyPlan, commitArmyPlan } from '../../army-plan.ts';
import { getMergeResult } from '../../unit-merging.ts';
import type { ArmyUnit, Fighter, MergeSource } from '../../unit-merging.ts';
import { createHeroUI } from '../../hero-ui.ts';
import type { HeroUI, HeroUIChange } from '../../hero-ui.ts';
import { createHero } from '../../hero.ts';
import { createProgression } from '../../progression.ts';

export function verifyArmyContracts(panel: HTMLElement, button: HTMLButtonElement): void {
  const units: readonly ArmyUnit[] = [{ id: 1, type: 'swordsman', level: 2, col: 2, row: 0 }];
  const reserve: readonly Fighter[] = [{ id: 2, type: 'swordsman', level: 3 }];
  const source: MergeSource = { location: 'reserve', id: 2 };
  const result = getMergeResult(units, reserve, source, 1);
  if (result.ok) {
    const army: ArmyUnit[] = result.units;
    const level: number = result.target.level;
    const row: number = result.target.row;
    void [army, level, row];
  } else {
    // @ts-expect-error Failed merges have no merged target.
    result.target;
    // @ts-expect-error A failure can retain readonly caller-owned arrays.
    result.units.push(units[0]);
  }
  const literal = getMergeResult([{ ...units[0], level: 1 as const, nickname: 'First' }], reserve, source, 1);
  if (literal.ok) {
    const nickname: string = literal.target.nickname;
    // @ts-expect-error The merged level is recomputed, not the input literal level.
    const unchanged: 1 = literal.target.level;
    void [nickname, unchanged];
  }
  getMergeResult(units, reserve, null, undefined);
  // @ts-expect-error Reserve fighters still require a normalized numeric level.
  getMergeResult(units, [{ id: 2, type: 'archer', level: '3' }], source, 1);
  // @ts-expect-error Identifiers used by merging are normalized positive numbers.
  getMergeResult(units, reserve, { location: 'army', id: '1' }, 2);
  // @ts-expect-error Only army/reserve are valid merge origins.
  getMergeResult(units, reserve, { location: 'inventory', id: 1 }, 2);
  // @ts-expect-error A target id is not a serialized string.
  getMergeResult(units, reserve, source, '1');
  const progression = createProgression();
  const plan = createArmyPlan(units, 3, progression);
  const committed = commitArmyPlan(plan, 100, { slaves: 2 }, progression);
  if ('error' in committed) {
    const message: string = committed.error;
    // @ts-expect-error Failed plans do not carry a committed wallet.
    committed.gold;
    void message;
  } else {
    const army: ArmyUnit[] = committed.units;
    void army;
  }
  // @ts-expect-error Army plans require grid positions, not reserve-only fighters.
  createArmyPlan(reserve, 3, progression);
  const ui: HeroUI = createHeroUI({ panel, button, getHero: () => createHero(), getBattle: () => ({ phase: 'running' }),
    onLearn: () => null, onReset: () => null,
    onChange(change) {
      if (change.type === 'talent') {
        const spent: true = change.spent;
        // @ts-expect-error Talent changes do not contain reset refunds.
        change.refunded;
        void spent;
      } else {
        const refunded: number = change.refunded;
        // @ts-expect-error A reset is not bound to one talent id.
        change.id;
        void refunded;
      }
    } });
  ui.render(); ui.destroy();
  // @ts-expect-error Hero UI requires normalized hero state.
  createHeroUI({ panel, button, getHero: () => ({ xp: 0 }), onLearn: () => null, onReset: () => null });
  // @ts-expect-error Battle phase is closed to running/victory/defeat.
  createHeroUI({ panel, button, getHero: () => createHero(), getBattle: () => ({ phase: 'paused' }), onLearn: () => null, onReset: () => null });
  // @ts-expect-error The view cannot own mutations; application handlers are required.
  createHeroUI({ panel, button, getHero: () => createHero() });
  // @ts-expect-error A talent notification is emitted only after successful spending.
  const rejected: HeroUIChange = { type: 'talent', id: 'heal_power', spent: false, reason: 'points', rank: 0 };
  void rejected;
}
