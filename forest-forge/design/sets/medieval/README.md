# Medieval armor

Approved epoch 3 costumes, generated 2026-09-11 with the built-in image generator.

- Iron Knight: cool silver armor, blue cloth and cape.
- Forest Ranger: green hood and cape, warm leather armor.
- Royal Guard: silver armor with a gold crown band, crimson cloth and cape.

`concepts.png` is the approved costume reference. Exact prompt: `concept-prompt.txt`.
References: `../ancient/concepts-simple.png` and `../../../qa/hero-base-v2-idle.png`.

Each set has its own sibling directory with the exact `generation-prompt.txt`,
original `source.png`, background-cleaned `clean.png`, fitted `set.json`, and
`build-report.json`. Production pieces were generated against the actual hero-body
parts template, not cut out of the concept image. Neutral connected background
pixels (including the face opening) were removed before the existing atlas build.

All three sets have 13 separate pieces and 7 armor slot icons. Leggings and complete
boots are separate; gloves are closed. Helmets and hood were individually fitted
so both eyes remain visible. Existing hero rig, attacks, ranged poses, and cape
motion are preserved. Build reports show no clipped pixels or empty frames.

Open `/sets.html?set=iron-knight`, `forest-ranger`, or `royal-guard` to inspect and
adjust. `Test in game` previews the whole set without changing player equipment.
Armor and ten weapons are registered as epoch 3. Medieval forging is now enabled
locally through the existing availability rule, first appearing at anvil level 11.

Build: `node design/build-set.cjs <set-id>`.
