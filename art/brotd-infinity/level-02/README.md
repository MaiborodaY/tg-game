# BroTD Infinity - level 2 artwork

This collection lives on `codex/brotd-level-2-assets`, created from local `main` at `ecf58ccc727d3a2c3f878a674f47ef14e6549a72`.

Add further second-level character concepts and approved animation assets here. Keep runtime exports separate from source artwork and document frame order. This branch currently contains artwork only; nothing is connected to gameplay or deployment.

| Unit | Status | Main file |
| --- | --- | --- |
| Skeleton footman | Approved design; 16-frame generated animation sheet | [768px WebP, 139900 bytes](skeleton-footman/skeleton-footman-768-lite.webp) |
| Skeleton archer | New ranged-unit concept awaiting visual approval | [768px concept WebP, 91474 bytes](concepts/skeleton-archer-v1.webp) |

## Footman

Use the compact WebP together with [frame rectangles](skeleton-footman/skeleton-footman-768.frames.json). The JSON names the compact export. Source PNG, lossless WebP and an opaque-background preview are preserved for art review, not required downloads. The sheet has four frames each for idle, walking, side attack and downward attack. See [generation notes](skeleton-footman/README.md) for prompts and limitations; foot anchors and playback still need integration work.

## Archer

The archer shares the ivory skeleton anatomy, brown leather and purple cloth of the footman. A plain shortbow, quiver and short purple hood identify its ranged role. It is an ordinary second-level enemy concept, without defined stats or animation assets.

[Original PNG](concepts/skeleton-archer-v1.png) and [built-in imagegen prompt](concepts/skeleton-archer-v1.prompt.md).
