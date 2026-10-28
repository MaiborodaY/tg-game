# Short cartoon bow release

**Current state: sound is disabled globally by a feature flag.** The game creates no audio context, fetches no bow sample, performs no audio unlock and plays no sounds, even when an existing saved preference is unmuted. Settings keeps the Sound control disabled with an explanation that sound is currently turned off. The saved mute preference and local clip are retained for possible future use. The king's golden projectile is also silent.

## Archived sound selection and configuration

`bow-short-whoosh-v2.wav` is the exact second-revision option **04, Короткое «фью»**, selected by the user from the local audio preview. Original procedural synthesis, no external recordings or sampled libraries. Source generator: `../../scripts/prepare-bow-sounds.mjs`; audition copy: `../../audio-preview/04-heavy.wav` (historical filename retained). The previous option 03 file is preserved locally but no longer loaded by the game.

Mono PCM16, 44.1 kHz, 0.7 seconds, 61,784 bytes. The earlier enabled configuration used the unchanged WAV and playback rate 1. Master gain was 0.05, matching the user's preferred 5% audition volume. At most four voices were active, and release events closer than 35 ms were combined perceptually by dropping extra voices, without changing gameplay. These settings do not enable playback while the global flag is off.

Before global disabling, `combat.mjs` emitted `bow-shot` when an actual arrow was created, and allied and goblin archers used the sample. Loading was deferred until a player started a wave; Start, Resume or Unmute clicks unlocked browser audio in that version. Unavailable or late-loaded audio did not delay battles or queue stale shots. Muting, pausing, hiding and leaving stopped sound; the mute preference was saved separately from formation. This describes historical behavior, not the current disabled audio path.

Historical validation of the enabled sound covered module syntax, build, focused audio lifecycle checks and published asset verification. No in-battle playthrough was performed, per the user's request; those checks do not validate the current global disable change.
