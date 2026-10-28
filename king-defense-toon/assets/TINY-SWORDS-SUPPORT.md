# Tiny Swords blue archer and monk

Both allies use unchanged Pixel Frog PNGs from the user's local collection, with native idle and movement animation in the field and matching idle portraits in the menu. Existing combat stats, targeting, healing rules and saves are unchanged. Earlier generated character images remain archived in assets but are no longer loaded for these two allies.

## Archer

Source: `C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords2/Tiny Swords (Update 010)/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png`.

Runtime copy: `tiny-swords-archer-blue.png`, 1536 x 1344, eight columns by seven rows of 192 x 192 cells. Idle uses row 0 and run uses row 1, six frames each; their last two cells are empty and must not be sampled. Rows 2-6 contain eight firing frames for up, diagonal up, horizontal, diagonal down and down. Horizontal mirroring covers leftward targets. The bow release (local frame 6) is aligned to the engine's actual projectile release.

## Healer

The blue Monk is from the adjacent Tiny Swords Free Pack. It has separate idle, four-frame run and eleven-frame healing strips. Its fully raised blessing (local frame 5) is aligned to the healing impact; the remaining authored frames provide recovery. It only heals wounded allies and does not attack. Exact sources, dimensions and hashes: [tiny-monk/SOURCES.md](tiny-monk/SOURCES.md).

## Rendering and verification

`tiny-support.mjs` selects frames; `scene.mjs` retains full cells, native shadows and a common fixed anchor at (96, 128). All three Tiny Swords allies render at half the source scale with nearest-neighbor sampling. Health bars and projectile origins account for the compact bodies. Menu portraits use the same source art.

Checked production build and module syntax; one-off assertions covered all five aiming rows, empty-cell avoidance, projectile-release frames and monk run/heal frame bounds. A 390 x 844 browser battle showed the new archer shooting and monk healing alongside the blue warrior. Browser checks used localhost to preserve the user's 127.0.0.1 formation and progress.
