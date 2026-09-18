import type { Actor } from '../../combat-types.ts';
import type { AnimationActor, FrameFunction, AllyAnimationFrames } from '../../animation-types.ts';
import { allyAnimationFrame, allyDeathOpacity, ALLY_ATLAS_LAYOUT } from '../../ally-animation.ts';
import { tinyWarriorFrame } from '../../tiny-warrior.ts';
import { tinyLancerFrame } from '../../tiny-lancer.ts';
import { tinyTorchFrame } from '../../tiny-torch.ts';
import { tinyGoblinArcherFrame } from '../../tiny-goblin-archer.ts';
import { tinyGoblinChiefFrame } from '../../tiny-goblin-chief.ts';
import { tinyGoblinHealerFrame, goblinHealPulseFrame } from '../../tiny-goblin-healer.ts';
import { tinyBoarFrame } from '../../tiny-boar.ts';
import { tinyArcherFrame, tinyMonkIdleFrame, tinyMonkRunFrame, tinyMonkHealFrame } from '../../tiny-support.ts';
import { tinyKingFrame } from '../../tiny-king.ts';
import { tinyStKnihorFrame, stKnihorDirection, stKnihorEffectFrame, stKnihorEffectActive,
  ST_KNIHOR_ANIMATIONS, ST_KNIHOR_EFFECT_TIMINGS } from '../../tiny-st-knihor.ts';
import type { HeroDirection, HeroEffectKind } from '../../tiny-st-knihor.ts';

export function verifyAnimationContracts(actor: Actor): void {
  const pose: AnimationActor = actor;
  const helpers: FrameFunction[] = [tinyWarriorFrame, tinyLancerFrame, tinyTorchFrame, tinyGoblinArcherFrame,
    tinyGoblinChiefFrame, tinyGoblinHealerFrame, tinyBoarFrame, tinyArcherFrame, tinyMonkIdleFrame,
    tinyMonkRunFrame, tinyKingFrame, tinyStKnihorFrame];
  for (const helper of helpers) {
    const live: number = helper(actor, 1);
    const preview: number = helper(null);
    const idle: number = helper(undefined);
    const partial: number = helper({ action: 'walk', walkTime: .3 });
    void [live, preview, idle, partial];
  }
  const frames: AllyAnimationFrames = { idle: 0, walk: [1, 2], anticipation: [5, 6], impact: 7, recovery: [8, 9] };
  const ally: number | undefined = allyAnimationFrame(actor, frames);
  const empty: number = allyAnimationFrame(null);
  const opacity: number = allyDeathOpacity(actor);
  const heal: number = tinyMonkHealFrame({ action: 'heal' });
  const cast: number = tinyStKnihorFrame({ ...actor, action: 'cast' });
  const direction: HeroDirection = stKnihorDirection({ facingX: 1 }).direction;
  const effect: HeroEffectKind = 'hammer';
  const effectFrame: number = stKnihorEffectFrame(effect, .3);
  const active: boolean = stKnihorEffectActive(effect, .3);
  const pulse: number = goblinHealPulseFrame(.5);

  // @ts-expect-error Combat and authored render actions form a closed set.
  tinyWarriorFrame({ action: 'walking' });
  // @ts-expect-error Elapsed clocks are numeric, even though JS callers retain runtime fallbacks.
  tinyWarriorFrame(actor, '1');
  // @ts-expect-error Minimal preview poses still require numeric fields when present.
  tinyLancerFrame({ walkTime: '1' });
  // @ts-expect-error Monk healing reads its actor directly and cannot represent an absent unit.
  tinyMonkHealFrame(null);
  // @ts-expect-error A nullable callback cannot directly use the non-null healing helper.
  const nullableHeal: FrameFunction = tinyMonkHealFrame;
  // @ts-expect-error Legacy ally animation reads its action timers directly.
  allyAnimationFrame({ action: 'attack' });
  // @ts-expect-error A legacy frame can be absent for an invalid numeric clock.
  const definiteAllyFrame: number = allyAnimationFrame(actor);
  // @ts-expect-error Death opacity requires a numeric death timer.
  allyDeathOpacity({ action: 'dead' });
  // @ts-expect-error A frame strip cannot be empty.
  allyAnimationFrame(actor, { walk: [] });
  // @ts-expect-error Hero effect kinds are a closed atlas contract.
  stKnihorEffectFrame('fire');
  // @ts-expect-error Hero TTL checks use the same effect kinds as frame selection.
  stKnihorEffectActive('healing');
  // @ts-expect-error Hero facing has three authored directions.
  const invalidDirection: HeroDirection = 'left';
  // @ts-expect-error Shared layouts remain frozen.
  ALLY_ATLAS_LAYOUT.columns = 8;
  // @ts-expect-error Hero animation entries are frozen too.
  ST_KNIHOR_ANIMATIONS.attack.duration = 2;
  // @ts-expect-error Effect timing entries are immutable.
  ST_KNIHOR_EFFECT_TIMINGS.heal.row = 1;
  void [pose, ally, empty, opacity, heal, cast, direction, effectFrame, active, pulse, nullableHeal, invalidDirection, definiteAllyFrame];
}
