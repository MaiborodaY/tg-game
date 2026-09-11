# Divine armor

Epoch 10: Dawn Herald, Storm Seraph, Sun Sovereign.

Generated with the built-in Imagegen tool as part of the user's request to complete the remaining armor epochs. The exact concept prompt is [concept-prompt.txt](concept-prompt.txt). Inputs: ../futuristic/concepts.png for the approved art style, ../../../qa/hero-base-v2-idle.png for the actual hero identity.

The user requested stronger variation within and between epochs. These sets therefore differ in silhouette, material and equipment construction, while retaining the same body, seven slots and existing rig. Weapons remain a separate batch.

Status: all three sets are generated, fitted and connected locally. Not published.


## Production sets

- Dawn Herald: [workshop](http://127.0.0.1:4173/sets.html?set=dawn-herald), [battle preview](http://127.0.0.1:4173/?outfit=dawn-herald), [exact generation prompt](../dawn-herald/generation-prompt.txt), [fit](../dawn-herald/set.json). Original generated source: exec-f9ba1086-f036-464d-8976-ce175c24c059.png.
- Storm Seraph: [workshop](http://127.0.0.1:4173/sets.html?set=storm-seraph), [battle preview](http://127.0.0.1:4173/?outfit=storm-seraph), [exact generation prompt](../storm-seraph/generation-prompt.txt), [fit](../storm-seraph/set.json). Original generated source: exec-b661e50d-501b-4846-9eeb-e13f6c42975c.png.
- Sun Sovereign: [workshop](http://127.0.0.1:4173/sets.html?set=sun-sovereign), [battle preview](http://127.0.0.1:4173/?outfit=sun-sovereign), [exact generation prompt](../sun-sovereign/generation-prompt.txt), [fit](../sun-sovereign/set.json). Original generated source: exec-e1e04a8f-de94-465e-a625-687d67da260b.png.

Each set contains 13 complete modular parts in seven armor slots. Each sibling set folder keeps the exact Imagegen prompt, unchanged generated source, concept reference, fitted set.json and build-report.json. The three reference inputs are the current body-parts-template-v2.png, this epoch concept board, and the corrected Field Scout sheet for standalone part boundaries.

The fit preserves each design’s own volume: shoulder, chest, cape, glove, hip and boot sizes differ between sets. Body geometry, anchors and animation timing stay shared. Leggings and complete boots are independent, gloves cover the whole fist, and the cape follows the existing motion. The existing builder produces cleaned parts, seven inventory icons, animation atlases and metadata under assets/sets/<id>/.

A targeted three-piece Imagegen repair removes the attached shoulders from Dawn Herald’s chest and closes Storm Seraph’s boot cuffs. The exact repair prompt is parts-repair-prompt.txt; the unchanged replacement sheet is parts-repair-source.png. Those parts use the existing per-part source field. The original sheets are preserved.

## Local verification

All 12 new sets passed workshop, fitting, baked-preview, isolated gloves/leggings/boots, walk/swing/thrust and 390x844 battle-preview checks. The preview leaves saved progress unchanged. All build reports contain zero clipped pixels, zero empty part frames and 13 parts. Restored names for all 12 sets and a mixed loadout with ranged combat were checked. All 43 model tests passed. Evidence: ../../../qa/remaining-epochs-browser.json, the per-set screenshots, and ../../../qa/remaining-epochs-overview.png.

The share build contains 402 files (11544618 bytes) and 302 lossless WebP conversions with identical visible pixels. Source sheets and workshop preview atlases are excluded from the share build. The runtime still loads later armor atlases only when equipped or explicitly previewed; this content update does not preload all epochs.

Armor registration covers epoch 10. Forge availability continues to require armor AND that epoch’s own weapons. No weapons were generated in this batch; the existing automatic availability rule will connect this epoch when its weapons are added. No production testing or deployment was performed.
