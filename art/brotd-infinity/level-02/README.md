# BroTD Infinity - level 2 artwork

This collection lives on `codex/brotd-level-2-assets`, created from local `main` at `ecf58ccc727d3a2c3f878a674f47ef14e6549a72`.

Add further second-level character concepts and approved animation assets here. Keep runtime exports separate from source artwork and document frame order. This branch currently contains artwork only; nothing is connected to gameplay or deployment.

| Unit | Status | Main file |
| --- | --- | --- |
| Skeleton footman | Approved design; 16-frame generated animation sheet | [768px WebP, 139900 bytes](skeleton-footman/skeleton-footman-768-lite.webp) |
| Skeleton archer | Approved design; 16-frame generated animation sheet | [768px WebP, 191040 bytes](skeleton-archer/skeleton-archer-768-lite.webp) |
| Ghoul | Approved third ordinary type; 16-frame generated animation sheet | [768px WebP, 145084 bytes](ghoul/ghoul-768-lite.webp) |

## Footman

Use the compact WebP together with [frame rectangles](skeleton-footman/skeleton-footman-768.frames.json). The JSON names the compact export. Source PNG, lossless WebP and an opaque-background preview are preserved for art review, not required downloads. The sheet has four frames each for idle, walking, side attack and downward attack. See [generation notes](skeleton-footman/README.md) for prompts and limitations; foot anchors and playback still need integration work.

## Archer

The archer shares the ivory skeleton anatomy, brown leather and purple cloth of the footman. A plain shortbow, quiver and short purple hood identify its ranged role. The animation sheet contains four idle poses, four walking poses, four side shots and four downward shots. Local pose 2 releases the arrow. Use the [frame rectangles](skeleton-archer/skeleton-archer-768.frames.json) and see the [generation notes](skeleton-archer/README.md). Stats, foot anchors and playback remain unimplemented.

[Original PNG](concepts/skeleton-archer-v1.png) and [built-in imagegen prompt](concepts/skeleton-archer-v1.prompt.md).

## Ghoul

The approved [ghoul concept](concepts/ghoul-v1.webp) adds a hunched blue-grey body, long clawed arms and purple faction cloth. Its intended role is an agile melee troop. The sheet provides idle, stalking movement, side swipes and downward swipes. Use the [frame rectangles](ghoul/ghoul-768.frames.json) and [generation notes](ghoul/README.md). Stats, foot anchors and playback remain unimplemented.

The ordinary troop lineup is complete at three approved designs: footman, archer and ghoul. Their lightweight WebP sheets total 476024 bytes. The second-level mini-boss and final boss remain future work.

The earlier [skeleton axeman](concepts/skeleton-axeman-v1.webp) was declined because it looked too similar to the footman. Its concept and prompt are retained as unused art history; it is not a fourth troop type.
