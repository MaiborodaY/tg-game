# Modern armor concepts

Three proposed armor sets: Field Scout, Commando, Heavy Trooper.

Created with the built-in Imagegen tool on 2026-09-11. The exact prompt is in [concept-prompt.txt](concept-prompt.txt); the reference board is [concepts.png](concepts.png).

Generated source: exec-c2aa60b6-41d9-4407-af02-d24184d1d756.png, copied unchanged from the tool output. Original retained in the Codex generated_images folder.

Reference inputs:
- ../gunpowder/concepts.png: approved art style and board composition.
- ../../../qa/hero-base-v2-idle.png: existing hero identity, proportions and pose.

Seven armor slots, separate boots and leggings, full closed gloves, no weapons. Large color blocks and simple shading follow the approved small-sprite style.

## Production integration

Approved concepts are now built as three sets for epoch 5. Each sibling set folder contains `reference.png`, the exact generation/repair prompts, unchanged generated sources, fitted `set.json` and `build-report.json`.

- Field Scout: [workshop](http://127.0.0.1:4173/sets.html?set=field-scout), [battle preview](http://127.0.0.1:4173/?outfit=field-scout), [generation prompt](../field-scout/generation-prompt.txt), [fit](../field-scout/set.json).
- Commando: [workshop](http://127.0.0.1:4173/sets.html?set=commando), [battle preview](http://127.0.0.1:4173/?outfit=commando), [generation prompt](../commando/generation-prompt.txt), [fit](../commando/set.json).
- Heavy Trooper: [workshop](http://127.0.0.1:4173/sets.html?set=heavy-trooper), [battle preview](http://127.0.0.1:4173/?outfit=heavy-trooper), [generation prompt](../heavy-trooper/generation-prompt.txt), [fit](../heavy-trooper/set.json).

Each set has 13 complete parts for seven armor slots: headgear, chest, shoulders, gloves, leggings, boots and cape. Boots and leggings stay separate. Existing body geometry, animation timing, hand anchors and cape motion are reused. Headgear preserves the base hero's hair with `showHair: true`.

Field Scout's first sheet included body-template fragments. `field-scout/source-v1.png` and `generation-prompt-v1.txt` preserve that initial pass; `parts-repair-prompt.txt` produced the final alpha `source.png`. Its `generation-prompt.txt` is the strengthened reusable recipe. Commando and Heavy Trooper used their saved generation prompts directly, with the corrected Field Scout sheet as a third reference for standalone part boundaries.

Runtime outputs live under `assets/sets/<set-id>/`: cleaned part PNGs, seven slot icons, atlas, shooting atlas, workshop preview atlas and metadata. The existing share build encodes lossless WebP; raw generation sheets and workshop-resolution atlases are not shipped.

All six Modern/Futuristic sets passed local workshop, fitting, isolated glove/legging/boot, walk/swing/thrust and 390x844 battle-preview checks. All 43 model tests passed. Build reports contain zero clipped pixels and zero empty part frames. See `../../../qa/modern-futuristic-sets-browser.json` and the per-set screenshots in `../../../qa/`.

Status: connected locally; not published. Forge availability still requires both registered armor and weapons for an epoch. These two epochs enter the pool automatically when their own weapon batch is added. No weapons were generated or borrowed from earlier epochs.
