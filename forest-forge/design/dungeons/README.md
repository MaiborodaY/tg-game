# Dungeons and Rustback

Local preview: `/?dungeons=1&debug=1`. This creates a temporary full Medieval
level-1 outfit and nine cleared floors in each dungeon. The starter level-1 green preview now needs upgrades for floor 10. Three victories unlock
the mount. Preview progress is not saved. Normal play unlocks the hub after the
campaign boss of 1–1 (highest level 2).

## Rules

- Sunken Treasury, Cursed Forge, Crystal Depths: 20 tiers of ten stages each,
  displayed as 1–1 through 20–10. Saved progress still uses floors 1–200.
- Two rewarded victories per dungeon per UTC day. Loss, timeout, leaving and
  reloading spend no victory. A reloaded unfinished expedition ends; the saved
  campaign fight is retained. Already credited rewards are not paid again.
- A run uses the hero's equipment, workshop bonuses, equipped mount and selected
  companion. It starts at full health, lasts at most 90 seconds, and pauses the
  campaign and forging. Switching gear during the run is disabled.
- The next floor unlocks on victory. Cleared floors can be repeated; first and
  repeat victories on the same floor award the same resources.
- Each dungeon awards only its own resource: Treasury gives coins, Forge gives
  hammers, Depths gives ore. The main reward amounts retain the original values.
  Ore uses the mine's unlocked tier (60%) and preceding tier
  (40%), or only stone at mine level 1. Higher mine levels improve the amount.
- Every five cleared floors: Treasury adds 1% enemy coins; Forge adds 0.25
  percentage points to normal enemy hammer chance; Depths adds 1% mine output.
  Mine fractions accumulate, so a small bonus does not disappear on rounding.
- Clearing floor 10 in all three unlocks Rustback. Claiming equips him. Riding
  grants 20% damage and 20% health; dismounting preserves the health fraction.
  Earliest unlock: the fifth daily allowance, if all needed fights are won.

Every expedition returns to the dungeon hub through a short fade. Victories
show the earned amounts in the center, then use the idle reward burst and
curved flight to the existing coin and hammer positions behind the hub. Ore
flies to the existing mine navigation icon. No extra balances are added to the hub. The battle
operation still credits resources immediately; the animation never awards them.
There is no result dialog. Defeat or timeout shows only a brief label; leaving
or reloading an unfinished run simply returns to the hub. Reduced motion keeps
the amounts visible but skips the screen fade and flying particles.

## Difficulty

Boss health is doubled from the initial implementation; the 90-second limit
stays the same. Early damage was separately strengthened: the ten opening
stages deal 3, 4, 6, 8, 12, 18, 26, 36, 50 and 62 damage per normal hit.
Previously stage 1 dealt only 1 damage, which a level-one druid could mostly
erase. Floors 1–10 use a short explicit curve. After 10, strength grows smoothly from
220 to 22 billion across the remaining 190 floors. The exact source is
`dungeonBoss` in `game.mjs`; all 200 rows and reference simulations are recorded
in `balance-check.json`. No equipment color is required to enter or win.

Every 50 floors the boss's special move speeds up:

| Floors | Treasury shield | Furnace smash | Crystal fury |
| --- | --- | --- | --- |
| 1–50 | Every 12s, lasts 3s | Every 10s, ×2.6 damage | +25% damage every 20s |
| 51–100 | Every 11s, lasts 3.25s | Every 9.5s, ×2.8 | Every 18s |
| 101–150 | Every 10s, lasts 3.5s | Every 9s, ×3 | Every 16s |
| 151–200 | Every 9s, lasts 3.75s | Every 8.5s, ×3.2 | Every 14s |

The shield reduces incoming damage by 65%. The furnace visibly charges for two
seconds without attacking before one strong hit. A turtle in front intercepts
that hit through the existing tank logic. Fury lasts for the rest of that run.

Reference wins, without companions or affixes:

| Equipment | Floor | Treasury | Forge | Depths |
| --- | --- | --- | --- | --- |
| Prehistoric slingshot, 9 damage / 65 HP | 1 | 24.7s | 22.7s | 22.7s |
| Full Ancient, item level 1 | 10 | Defeat | Defeat | Defeat |
| Full Medieval, item level 1 | 10 | Defeat | Defeat | Defeat |
| Full Medieval, item level 5 | 10 | 81.6s | 65.6s | 65.6s |
| Full Divine level 100, workshop slots 100, mount | 200 | 75.6s | 55.6s | 55.6s |

The 65-HP starter finishes with 8 / 10 / 9 HP in those three fights. With a
level-one druid, the remaining health is 30 / 30 / 29 HP, so regeneration helps
without removing the threat. These are deterministic combat checks, not observed player progression times.
Actual time to unlock equipment and finish floors depends on forging, mining,
upgrades and companion choices. Economy tuning can change the constants without
changing the saved floor progress.

## Art and rendering

Generated with the built-in image generator. Source prompts requested thick dark
outlines, chunky silhouettes, limited cel shading, transparent backgrounds and
no text. Bosses face left: a treasure toad, furnace golem and crystal crab. The
mount prompt requested a four-frame, right-facing rust-orange saddle dinosaur
with turquoise plates, no rider, fixed body size and moving legs. The three-row
banner prompt requested a sunken treasury, cursed forge and crystal cavern,
with clear space for UI titles and buttons.

The source images and normalized animation frames are retained locally as design
inputs; only the prepared runtime WebP assets are included in the release.
`prepare.py` packs 256px boss icons, a 1024×256 mount strip, the banners and
three 2560×320 boss animation strips. Each boss has four walking poses, a windup,
contact, follow-through and recovery. The prompts preserve the approved boss's
body size, left-facing silhouette and eight separate full-body poses. Flat
magenta was keyed out before the sprite-strip normalizer; final frames have
real transparency. A shared scale per strip preserves pose proportions, with
foot registration and room for extended limbs. The crab uses a (192,304)
anchor; the other bosses use (160,304). The toad's walking registration uses
its chest as a torso landmark, so extending a leg does not shift its whole body.
`animation-build.json` records the packing bounds.

Only the active boss animation strip is decoded (about 110–140 KiB transferred,
3.1 MiB of decoded pixels). The mount strip loads on first ride. Attack contact
starts when the existing combat code applies the hit, including a turtle
interception; furnace charging holds the windup. Reduced motion disables the
walking loop while retaining meaningful combat poses. Dungeon backgrounds are
composed once into a two-screen-wide cached canvas, cropped by the hero camera
during the approach. They do not wrap or follow the companion. The mount uses
four frames. The hero keeps the existing torso, gear and
weapon rendering while the legs are hidden and the torso is raised onto the saddle.

## Local verification

- `npm test`: 124 tests, including thirteen dungeon and ten alchemy tests.
- `npm run test:cloud`: six existing local API tests; no schema migration.
- `npm run build`: the shipping manifest includes all eleven dungeon assets.
- `animation-browser-check.json`: local Chromium and WebKit checks for all eight
  boss poses, hero-following scenery, damage/contact timing, constant draw size,
  furnace windup and loading only the current boss atlas. In-game screenshots
  and individual captured battle poses are retained alongside the report.
- `design/dungeons/verify.cjs`: local Chromium/WebKit checks using the bundled
  Playwright runtime. Verifies the hub, all three fights, claim, mounted fight,
  save/reload, interrupted battle, the 1–10 → 2–1 transition and 360×640 navigation.
  Mounts appear as compact rows in the Tier rewards dialog: artwork, name, two
  stat bonuses and a short unlock condition. Ready rewards replace the lock with
  Claim; owned mounts offer Ride or Dismount in the same position. The header
  button shows a dot until an available reward is claimed. A qualifying victory
  returns to the hub without opening another modal. No mount panel remains on the hub.
  The centered 80px dungeon banners retain their 18px gaps and bottom exit.
  The rewards dialog is also checked at 320px width in WebKit.
  Screenshots are design
  evidence and are excluded from the shipping manifest.
- Reward return checks also verify the existing flight endpoints, no added hub
  counters, all three resource credits exactly once and
  remove the old result-dialog expectations. `reward-transition-check.json`
  records WebKit timeout, leave, reduced motion, reload during the fade and the
  unchanged idle-reward flight; the defeat return was checked separately.

- `design/dungeons/verify-detail.cjs`: stage browsing, Sweep Last, exact payouts,
  the shared daily allowance, reward flights, reload and narrow layouts.
- `design/dungeons/verify-vfx.cjs`: cached boss effects, actual hit timing,
  turtle interception, reduced motion and entry/exit cleanup in Chromium and
  WebKit. Entry uses the same 200ms fade to black and 220ms reveal as returning
  to the hub; combat remains paused until the reveal finishes.

These are local checks with isolated browser saves, not production gameplay tests.
