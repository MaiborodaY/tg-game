import { createBattleAudio } from '../../audio.ts';
import type { BattleAudio } from '../../audio.ts';

export function verifyBattleAudioContracts(): void {
  const audio: BattleAudio = createBattleAudio();
  const state: readonly boolean[] = [audio.enabled, audio.muted, audio.supported];
  const unlocked: Promise<boolean> = audio.unlock();
  const played: boolean = audio.playBowShot();
  audio.setActive(true);
  audio.setMuted(false);
  audio.stop();
  audio.destroy();

  // @ts-expect-error The public enabled flag is read-only; migration must not enable dormant SFX.
  audio.enabled = true;
  // @ts-expect-error Muting goes through the controller's preference/lifecycle handling.
  audio.muted = true;
  // @ts-expect-error Capability detection is read-only.
  audio.supported = true;
  // @ts-expect-error Typed callers supply a boolean, not a saved storage value.
  audio.setMuted('1');
  // @ts-expect-error Typed activity is a boolean, not a numeric flag.
  audio.setActive(1);
  // @ts-expect-error Unlock is asynchronous and may fail.
  const synchronousUnlock: boolean = audio.unlock();
  // @ts-expect-error A shot can be dropped; playback is not guaranteed.
  const alwaysPlayed: true = audio.playBowShot();
  // @ts-expect-error Audio graph ownership is private to the controller.
  audio.context.resume();
  void [state, unlocked, played, synchronousUnlock, alwaysPlayed];
}
