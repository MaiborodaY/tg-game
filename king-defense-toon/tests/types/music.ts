import { createLevelMusic } from '../../music.ts';
import type { LevelMusic, LevelMusicOptions } from '../../music.ts';

export function musicContracts(): void {
  const options: LevelMusicOptions = { onStateChange: () => undefined };
  const music: LevelMusic = createLevelMusic(options);
  const muted: boolean = music.muted;
  const volume: number = music.volume;
  const supported: boolean = music.supported;
  const unlocked: Promise<boolean> = music.unlock();
  music.setMuted(true);
  music.setActive(false);
  music.setLevel(2);
  music.setScene('goblin-cave');
  music.setScene('campaign');
  music.setVolume(.25);
  music.destroy();

  // @ts-expect-error The settings callback is callable and receives no invented state payload.
  createLevelMusic({ onStateChange: (state: { muted: boolean }) => state.muted });
  // @ts-expect-error Musical mute state is boolean at internal call sites.
  music.setMuted('1');
  // @ts-expect-error Activity comes from application visibility, not a truthy string.
  music.setActive('visible');
  // @ts-expect-error Levels are numeric; string values intentionally do not select a track.
  music.setLevel('1');
  // @ts-expect-error Volume changes must be numeric before reaching the controller.
  music.setVolume('0.25');
  // @ts-expect-error Only configured soundtracks can be selected.
  music.setScene('unknown');
  // @ts-expect-error The lifecycle owns mute state; callers use the setter.
  music.muted = false;
  // @ts-expect-error The lifecycle owns the normalized volume.
  music.volume = .5;
  // @ts-expect-error Capability is measured from the audio environment.
  music.supported = true;
  // @ts-expect-error Browser playback authorization is asynchronous.
  const immediate: boolean = music.unlock();
  // @ts-expect-error The public controller does not expose mutable audio graph nodes.
  music.context.close();
  void [muted, volume, supported, unlocked, immediate];
}
