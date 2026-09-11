# Underworld weapons

Connected locally. Generated with the built-in image_gen tool; not published.

- Reaper Scythe (`reaper-scythe`): melee, existing swing animation.
- Ram Crusher (`ram-crusher`): melee, existing swing animation.
- Obsidian Greatblade (`obsidian-greatblade`): melee, existing swing animation.
- Infernal Fork (`infernal-fork`): melee, existing thrust animation.
- Bone Ballista (`bone-ballista`): ranged, existing shoot animation.
- Cinder Cannon (`cinder-cannon`): ranged, existing shoot animation.

The original six-item sheet is `concepts.png`; its exact prompt is `generation-prompt.txt`. Style reference: `../medieval/concepts.png`; epoch materials: `../../sets/underworld/concepts.png`.

`catalog.json` records source rectangles, cleared hole seeds, grip points, mirrored orientation, fitted sizes, pivots, and atlas owner. Full-resolution transparent extracts are `<weapon-id>-clean.png`. Runtime cutouts are in `assets/weapons` (maximum 384px), with separate 96px icons. Background removal preserves enclosed pale weapon surfaces; Halo Bow is mirrored to match the existing bow grip.

Rebuild poses with `node design/build-set.cjs ash-reaper`. The existing builder packs these weapons into `assets/sets/ash-reaper/weapon-atlas.png`, with row order in the accompanying `atlas.json`. The scene loads this epoch atlas only when one of its weapons is equipped.

Attack interval remains 2 seconds; ranged weapon damage is 80% of melee, rounded to integers. No new projectile, animation, or affix mechanics.

Trial: `http://127.0.0.1:4173/?weapon=reaper-scythe`. Local render evidence: `qa/underworld-weapons-runtime.png`. All 34 atlas cells per weapon are nonempty and unclipped; all weapons were rendered in guard, windup, impact, and alternate-attack poses.

Art direction feedback: the user found this broad batch too uniform. The next batch should use more unusual fantasy constructions and distinct silhouettes, not material/color variations of the same weapon templates.
