# BroTD Infinity - level 2 artwork

This collection lives on `codex/brotd-level-2-assets`, created from local `main` at `ecf58ccc727d3a2c3f878a674f47ef14e6549a72`.

Add further second-level character concepts and approved animation assets here. Keep runtime exports separate from source artwork and document frame order. This branch currently contains artwork only; nothing is connected to gameplay or deployment.

| Unit | Status | Main file |
| --- | --- | --- |
| Skeleton footman | Approved design; 16-frame generated animation sheet | [768px WebP, 139900 bytes](skeleton-footman/skeleton-footman-768-lite.webp) |
| Skeleton archer | Approved design; 16-frame generated animation sheet | [768px WebP, 191040 bytes](skeleton-archer/skeleton-archer-768-lite.webp) |
| Skeleton axeman | Proposed third ordinary type; concept awaiting approval | [768px concept WebP, 191690 bytes](concepts/skeleton-axeman-v1.webp) |

## Footman

Use the compact WebP together with [frame rectangles](skeleton-footman/skeleton-footman-768.frames.json). The JSON names the compact export. Source PNG, lossless WebP and an opaque-background preview are preserved for art review, not required downloads. The sheet has four frames each for idle, walking, side attack and downward attack. See [generation notes](skeleton-footman/README.md) for prompts and limitations; foot anchors and playback still need integration work.

## Archer

The archer shares the ivory skeleton anatomy, brown leather and purple cloth of the footman. A plain shortbow, quiver and short purple hood identify its ranged role. The animation sheet contains four idle poses, four walking poses, four side shots and four downward shots. Local pose 2 releases the arrow. Use the [frame rectangles](skeleton-archer/skeleton-archer-768.frames.json) and see the [generation notes](skeleton-archer/README.md). Stats, foot anchors and playback remain unimplemented.

[Original PNG](concepts/skeleton-archer-v1.png) and [built-in imagegen prompt](concepts/skeleton-archer-v1.prompt.md).

## Third ordinary troop proposal

The [skeleton axeman concept](concepts/skeleton-axeman-v1.webp) adds a two-handed axe, plain open iron helmet and a small shoulder plate. Its proposed role is a slower, harder-hitting melee troop. This design and its mechanics are still proposals; no animation sheet or stats have been created. See the [source and generation notes](concepts/skeleton-axeman-v1.prompt.md).

The ordinary troop lineup is intended to stop at three types: footman, archer and the proposed axeman. The second-level mini-boss and final boss are future work.
