# Underworld armor

Epoch 9: Ash Reaper, Ember Brute, Obsidian Tyrant.

Generated with the built-in Imagegen tool as part of the user's request to complete the remaining armor epochs. The exact concept prompt is [concept-prompt.txt](concept-prompt.txt). Inputs: ../futuristic/concepts.png for the approved art style, ../../../qa/hero-base-v2-idle.png for the actual hero identity.

The user requested stronger variation within and between epochs. These sets therefore differ in silhouette, material and equipment construction, while retaining the same body, seven slots and existing rig. Weapons remain a separate batch.

Status: all three sets are generated, fitted and connected locally. Not published.


## Production sets

- Ash Reaper: [workshop](http://127.0.0.1:4173/sets.html?set=ash-reaper), [battle preview](http://127.0.0.1:4173/?outfit=ash-reaper), [exact generation prompt](../ash-reaper/generation-prompt.txt), [fit](../ash-reaper/set.json). Original generated source: exec-f795d0fd-6aea-4fca-940c-d307c0972e52.png.
- Ember Brute: [workshop](http://127.0.0.1:4173/sets.html?set=ember-brute), [battle preview](http://127.0.0.1:4173/?outfit=ember-brute), [exact generation prompt](../ember-brute/generation-prompt.txt), [fit](../ember-brute/set.json). Original generated source: exec-87ac1a42-c0da-4ca3-a7be-7c8ff0bc5317.png.
- Obsidian Tyrant: [workshop](http://127.0.0.1:4173/sets.html?set=obsidian-tyrant), [battle preview](http://127.0.0.1:4173/?outfit=obsidian-tyrant), [exact generation prompt](../obsidian-tyrant/generation-prompt.txt), [fit](../obsidian-tyrant/set.json). Original generated source: exec-dbb1bb3a-ce95-4b8f-a840-34d7d0009895.png.

Each set contains 13 complete modular parts in seven armor slots. Each sibling set folder keeps the exact Imagegen prompt, unchanged generated source, concept reference, fitted set.json and build-report.json. The three reference inputs are the current body-parts-template-v2.png, this epoch concept board, and the corrected Field Scout sheet for standalone part boundaries.

The fit preserves each design’s own volume: shoulder, chest, cape, glove, hip and boot sizes differ between sets. Body geometry, anchors and animation timing stay shared. Leggings and complete boots are independent, gloves cover the whole fist, and the cape follows the existing motion. The existing builder produces cleaned parts, seven inventory icons, animation atlases and metadata under assets/sets/<id>/.

Ash Reaper’s enclosed face aperture is cleared with the existing clearPoints field. Ember Brute’s helmet is positioned so that both eyes remain visible.

## Local verification

All 12 new sets passed workshop, fitting, baked-preview, isolated gloves/leggings/boots, walk/swing/thrust and 390x844 battle-preview checks. The preview leaves saved progress unchanged. All build reports contain zero clipped pixels, zero empty part frames and 13 parts. Restored names for all 12 sets and a mixed loadout with ranged combat were checked. All 43 model tests passed. Evidence: ../../../qa/remaining-epochs-browser.json, the per-set screenshots, and ../../../qa/remaining-epochs-overview.png.

The share build contains 402 files (11544618 bytes) and 302 lossless WebP conversions with identical visible pixels. Source sheets and workshop preview atlases are excluded from the share build. The runtime still loads later armor atlases only when equipped or explicitly previewed; this content update does not preload all epochs.

Armor registration covers epoch 9. Forge availability continues to require armor AND that epoch’s own weapons. No weapons were generated in this batch; the existing automatic availability rule will connect this epoch when its weapons are added. No production testing or deployment was performed.
