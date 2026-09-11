# Gunpowder weapons

Connected locally. Generated with the built-in image_gen tool; not published.

- Officer Sabre (`officer-sabre`): melee, existing combo animation.
- Boarding Axe (`boarding-axe`): melee, existing swing animation.
- Powder Maul (`powder-maul`): melee, existing swing animation.
- Banner Pike (`banner-pike`): melee, existing thrust animation.
- Flintlock Pistol (`flintlock-pistol`): ranged, existing shoot animation.
- Brass Blunderbuss (`blunderbuss`): ranged, existing shoot animation.
- Handheld Deck Cannon (`deck-cannon`): ranged, existing shoot animation.

The original six-item sheet is `concepts.png`; its exact prompt is `generation-prompt.txt`. Style reference: `../medieval/concepts.png`; epoch materials: `../../sets/gunpowder/concepts.png`.

The extra handheld ship cannon has its own unchanged `deck-cannon-source.png` and exact `deck-cannon-prompt.txt`. It uses the existing horizontal shooting pose.

Deck Cannon now adds a stronger visual recoil to that pose: the hands and torso kick backward, the muzzle rises, and the weapon settles back into aim. The kick peaks 60 ms after contact and returns over 320 ms within the shared two-second cycle. It uses the existing pose transforms, with no additional sprite or atlas. Reduced motion keeps the original pose. Local screenshot comparison: `qa/cannon-recoil-check.json` and `qa/cannon-recoil-after.png`; other guns and the settled pose remain unchanged.

`catalog.json` records source rectangles, cleared hole seeds, grip points, mirrored orientation, fitted sizes, pivots, and atlas owner. Full-resolution transparent extracts are `<weapon-id>-clean.png`. Runtime cutouts are in `assets/weapons` (maximum 384px), with separate 96px icons. Background removal preserves enclosed pale weapon surfaces; Halo Bow is mirrored to match the existing bow grip.

Rebuild poses with `node design/build-set.cjs musketeer`. The existing builder packs these weapons into `assets/sets/musketeer/weapon-atlas.png`, with row order in the accompanying `atlas.json`. The scene loads this epoch atlas only when one of its weapons is equipped.

Attack interval remains 2 seconds; ranged weapon damage is 80% of melee, rounded to integers. No new projectile, animation, or affix mechanics.

Trial: `http://127.0.0.1:4173/?weapon=officer-sabre`. Local render evidence: `qa/gunpowder-weapons-runtime.png`. All 34 atlas cells per weapon are nonempty and unclipped; all weapons were rendered in guard, windup, impact, and alternate-attack poses.

Art direction feedback: the user found this broad batch too uniform. The next batch should use more unusual fantasy constructions and distinct silhouettes, not material/color variations of the same weapon templates.
