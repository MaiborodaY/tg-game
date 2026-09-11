# Gunpowder armor

Approved epoch 4 costumes and production parts generated with the built-in Imagegen tool on 2026-09-11.

- Musketeer: broad navy cavalier hat, ivory feather and sash, cobalt cloth and cape, leather shoulders and gloves.
- Corsair: charcoal tricorn with one bold skull emblem, burgundy coat and cape, ivory shirt, leather shoulders and gloves.
- Grenadier: dark teal shako with brass plate and orange plume, dark steel armor, ochre cloth and cape.

`concepts.png` preserves the generated reference. The exact prompt is in `concept-prompt.txt`. Inputs: `../medieval/concepts.png` for the approved art style and `../../../qa/hero-base-v2-idle.png` for the existing hero's body and face.

Each sibling set directory (`musketeer`, `corsair`, `grenadier`) contains the approved `reference.png`, exact `generation-prompt.txt`, unchanged generated `source.png`, fitted `set.json` and `build-report.json`. Each parts sheet was generated against the actual `body-parts-template-v2.png` and the approved concept, with 13 separate pieces for seven armor slots. The generator returned a white background; the existing builder removes connected white while retaining enclosed light cloth and feather colors.

Boots and leggings are separate, gloves are complete closed fists, and hats contain no face or hair. `showHair: true` preserves the existing hero's hair beneath these hats. The renderer takes the equipped headgear's body-head row so the workshop and battle use the same appearance. The existing rig and motion are unchanged.

All three sets are registered in `ARMOR_SETS[3]`, with local workshop navigation and appearance-only battle previews:

- `/sets.html?set=musketeer`
- `/sets.html?set=corsair`
- `/sets.html?set=grenadier`

Fit mode, Apply to game and Test in game use the existing workflow. Rebuild a set with `node design/build-set.cjs <set-id>`. Runtime outputs in `assets/sets/<set-id>/` include the atlas, shooting atlas and seven slot icons. `npm run build` includes lossless WebP versions in `dist/`.

Checks: all three build reports have 13 parts, zero clipped pixels and zero empty part frames. `qa/gunpowder-sets-browser.json` records local workshop, fitting, separate gloves/leggings/boots, battle previews and unchanged player saves. Visual pose sheets and workshop screenshots are in `qa/`. All 43 model tests pass.

Status: connected locally, not published. Gunpowder forging remains unavailable until its separate weapon batch is registered; the existing availability rule then enables epoch 4 automatically. Weapons were not generated or borrowed from earlier epochs.
