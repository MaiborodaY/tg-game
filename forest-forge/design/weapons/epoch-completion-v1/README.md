# Epoch completion — 130 connected weapons

Connected locally: every one of the ten epochs now contains **10 melee and 3 ranged** weapons (130 total). This adds 61 to the previous 69; Medieval already met the target and retains its original 13.

58 new weapons were generated with the built-in Imagegen tool in nine era-specific sheets. The three previously accepted Prehistoric concepts (Flint Axe, Bone Cudgel, Hide Sling) were reused from [their original sheet](../prehistoric-common-v1/concepts.png). Earlier rejected common-expansion sheets and premium fantasy studies are not included.

The direction is imaginative ordinary equipment with era-specific materials, different working constructions, visible grips, bold silhouettes, and few large shaded planes. Illustrations are saved unchanged as `<era>/concepts.png`. Each exact final prompt and its reference paths are recorded beside the source sheet and in [catalog.json](catalog.json).

| Era | Added | Original artwork | Generation prompt | Runtime preview |
| --- | ---: | --- | --- | --- |
| Prehistoric | 7 | [Sheet](prehistoric/concepts.png) | [Exact prompt](prehistoric/generation-prompt.txt) | [On hero](prehistoric/runtime.png) |
| Ancient | 6 | [Sheet](ancient/concepts.png) | [Exact prompt](ancient/generation-prompt.txt) | [On hero](ancient/runtime.png) |
| Gunpowder | 6 | [Sheet](gunpowder/concepts.png) | [Exact prompt](gunpowder/generation-prompt.txt) | [On hero](gunpowder/runtime.png) |
| Modern | 7 | [Sheet](modern/concepts.png) | [Exact prompt](modern/generation-prompt.txt) | [On hero](modern/runtime.png) |
| Futuristic | 7 | [Sheet](futuristic/concepts.png) | [Exact prompt](futuristic/generation-prompt.txt) | [On hero](futuristic/runtime.png) |
| Space | 7 | [Sheet](space/concepts.png) | [Exact prompt](space/generation-prompt.txt) | [On hero](space/runtime.png) |
| Interdimensional | 7 | [Sheet](interdimensional/concepts.png) | [Exact prompt](interdimensional/generation-prompt.txt) | [On hero](interdimensional/runtime.png) |
| Underworld | 7 | [Sheet](underworld/concepts.png) | [Exact prompt](underworld/generation-prompt.txt) | [On hero](underworld/runtime.png) |
| Divine | 7 | [Sheet](divine/concepts.png) | [Exact prompt](divine/generation-prompt.txt) | [On hero](divine/runtime.png) |

The [icon overview](icons-preview.png) contains all 61 additions. [additions.json](additions.json) records the connected IDs, kinds, atlas owners, source rectangles, fitted sizes and grip pivots. [fits.json](fits.json) stores the original chosen fitting values (height, or negative width; pivot X; pivot Y; rotation). [extraction.json](extraction.json) records source provenance and cutout bounds.

Source sheets contained painted neutral checkerboards. The established connected-background extraction was used with explicit seeds for enclosed background openings; opaque ivory and steel surfaces were preserved. Clean full-resolution cutouts are `<era>/<id>-clean.png`; the three reused cutouts are under `prehistoric-reuse/`. Shipping cutouts live in `assets/weapons/<id>.png` (at most 384px per side), and icons in `assets/weapons/<id>-icon.png` (96px with 8px padding).

The existing `design/build-set.cjs` reads the corresponding era catalogs. New Prehistoric rows use Bone Warrior's atlas and Ancient rows use Bronze Warrior's atlas; the existing later-era owners are retained. This uses the existing per-set weapon-atlas mechanism. All weapons keep the existing swing, thrust, combo, bow or horizontal shooting poses. The shared attack interval stays 2 seconds; ranged weapon damage stays 80%, rounded to integers.

## Verification

- All 44 existing model tests pass: [model-tests.txt](model-tests.txt).
- Exact 13 / 10 / 3 counts in all ten epochs and all 61 additions forged, equipped and restored: [catalog-check.json](catalog-check.json).
- Nine rebuilt weapon atlases, 104 rows including their existing weapons, 3,536 cells: no empty or clipped cells. [atlas-check.json](atlas-check.json).
- Every addition rendered with its own era armor in walk, windup, impact and alternate attack states: [runtime-check.json](runtime-check.json). All nine runtime sheets were inspected.
- The mobile-size trial offers all 130 weapons and preserves the save: [mobile-trial.png](mobile-trial.png).

Try [Obsidian Sawblade](http://127.0.0.1:4173/?weapon=obsidian-sawblade) or [Mobius Blade](http://127.0.0.1:4173/?weapon=mobius-blade); use the existing weapon selector to switch. The additions also participate in ordinary forging.

No deployment or production testing was performed for this batch.
