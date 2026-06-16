# PNG source archive

This folder stores original PNG source assets that should not be loaded by the game runtime.

Runtime assets live under `src/assets` as optimized `.webp` files, with low-resolution variants under `src/assets-low` when needed.

The `assets/` subtree mirrors the old `src/assets/` layout so each source PNG can be traced back to its optimized runtime asset.

Run `npm run gladiator:optimize-assets` from the repo root after changing PNG sources. The optimizer reads this archive and writes `.webp` files into `src/assets`.
