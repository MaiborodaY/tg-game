# Bow sound auditions

Five original procedurally synthesized sound effects for BroTD Infinity. No external recordings, purchased sample pack or audio-generation service was used. The user selected second-revision option 04, replacing the earlier option 03 choice; the exact WAV was copied to `../assets/audio/bow-short-whoosh-v2.wav` and connected to bow release events at 5% gain. This audition page itself remains separate from combat.

Open `/audio-preview/` on the existing local Vite server. Each card plays one shot or a five-arrow volley; audio starts only after a click. The separate `*-listen.wav` files contain three spaced shots for inline audio players.

| File | Character |
| --- | --- |
| 01-soft.wav | Muted string release and quiet air |
| 02-classic.wav | Revision 2: short dry muted click with minimal tail |
| 03-airy.wav | Revision 2: warm wooden release and a light rustle |
| 04-heavy.wav | Revision 2: brief soft cartoon pitch fall and short flight |
| 05-toon.wav | Short elastic pitch fall for a cartoon feel |

All single shots are 0.7 seconds, 44.1 kHz mono PCM16 WAV, 61,784 bytes each. Peaks remain below full scale and endpoints are faded. Level matching is approximate: peak safety takes priority over short-window RMS. No listening approval is implied; the user chooses the timbre and eventual in-game mix.

The user preferred options 1 and 5; both remain byte-identical. Original options 2, 3 and 4 are preserved under `archive-v1/`; current filenames retain their original identifiers for stable preview wiring. New 2–4 move toward the softer, shorter character of the preferred samples and remove the previous long whistle and low heavy resonance.

Rebuild deterministically from the worktree root:

```powershell
node king-defense-toon/scripts/prepare-bow-sounds.mjs
```

The preview is outside Vite's main build entry and is not deployed with the game. Only the chosen option 04 is included in the game build; the other audition files are retained locally.
