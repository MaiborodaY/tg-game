# Futuristic armor concepts

Three proposed armor sets: Neon Runner, Exo Trooper, Reactor Guard.

Created with the built-in Imagegen tool on 2026-09-11. The exact prompt is in [concept-prompt.txt](concept-prompt.txt); the reference board is [concepts.png](concepts.png).

Generated source: exec-76c53759-c6cc-430a-b74d-a39b08c61b16.png, copied unchanged from the tool output. Original retained in the Codex generated_images folder.

Reference inputs:
- ../gunpowder/concepts.png: approved art style and board composition.
- ../../../qa/hero-base-v2-idle.png: existing hero identity, proportions and pose.

Seven armor slots, separate boots and leggings, full closed gloves, no weapons. Large color blocks and simple shading follow the approved small-sprite style.

## Production integration

Approved concepts are now built as three sets for epoch 6. Each sibling set folder contains `reference.png`, the exact generation/repair prompts, unchanged generated sources, fitted `set.json` and `build-report.json`.

- Neon Runner: [workshop](http://127.0.0.1:4173/sets.html?set=neon-runner), [battle preview](http://127.0.0.1:4173/?outfit=neon-runner), [generation prompt](../neon-runner/generation-prompt.txt), [fit](../neon-runner/set.json).
- Exo Trooper: [workshop](http://127.0.0.1:4173/sets.html?set=exo-trooper), [battle preview](http://127.0.0.1:4173/?outfit=exo-trooper), [generation prompt](../exo-trooper/generation-prompt.txt), [fit](../exo-trooper/set.json).
- Reactor Guard: [workshop](http://127.0.0.1:4173/sets.html?set=reactor-guard), [battle preview](http://127.0.0.1:4173/?outfit=reactor-guard), [generation prompt](../reactor-guard/generation-prompt.txt), [fit](../reactor-guard/set.json).

Each set has 13 complete parts for seven armor slots: headgear, chest, shoulders, gloves, leggings, boots and cape. Boots and leggings stay separate. Existing body geometry, animation timing, hand anchors and cape motion are reused. Headgear preserves the base hero's hair with `showHair: true`.

All three generation prompts use the corrected Field Scout sheet as a third reference for complete standalone silhouettes. Exo Trooper's original `source-v1.png` had a painted checkerboard; `background-repair-prompt.txt` produced its final white-background `source.png`. Exo Trooper and Reactor Guard headgear then received one targeted repair: `helmet-repair-source.png` and `helmet-repair-prompt.txt` in this epoch directory remove the dangling far-side black strips. Their helmet parts reference the corresponding half of that shared source through the existing per-part `source` field.

Runtime outputs live under `assets/sets/<set-id>/`: cleaned part PNGs, seven slot icons, atlas, shooting atlas, workshop preview atlas and metadata. The existing share build encodes lossless WebP; raw generation sheets and workshop-resolution atlases are not shipped.

All six Modern/Futuristic sets passed local workshop, fitting, isolated glove/legging/boot, walk/swing/thrust and 390x844 battle-preview checks. All 43 model tests passed. Build reports contain zero clipped pixels and zero empty part frames. See `../../../qa/modern-futuristic-sets-browser.json` and the per-set screenshots in `../../../qa/`.

Status: connected locally; not published. Forge availability still requires both registered armor and weapons for an epoch. These two epochs enter the pool automatically when their own weapon batch is added. No weapons were generated or borrowed from earlier epochs.
