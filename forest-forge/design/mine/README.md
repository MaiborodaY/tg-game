# Mine — first playable version

Approved cave perspective and miner from the mining mockup. Cave and two miner poses were generated separately with the built-in image generator. Source PNGs live here; published assets are lossless WebP in assets/mine. The cave is static. The selected fur-vest miner uses two aligned generated layers: miner-body.webp and miner-arms.webp. CSS rotates the arm/tool assembly about the shoulder and adds a small body lean over a 2.4-second cycle; impact chips share its contact timing. There is no mining canvas render loop. The normal combat hero remains unchanged. The original generated ready/hit poses are retained as source history and are not shipped. Source layers were produced with the built-in image generator using the original miner as reference: preserve original full canvas/position/style, body without arms/tool, and arms/hands/tool isolated at their original positions. The generator painted a gray checkerboard instead of alpha even after correction; border-connected neutral background pixels were normalized to alpha during asset preparation (no resizing), preserving enclosed metal and dark outlines. Iron/crystal inclusions appear at levels 4/6.

Economy is provisional: 1 ore/minute, four-hour unclaimed cap, shared coins. Stone/coal/iron/crystal sell for 1/5/15/40. Ten mine levels; all probabilities, ore upgrade costs and durations are in MINE_LEVELS in game.mjs. The first upgrade costs 30 stone and takes 5 minutes. Pending ore must be collected before spending. Upgrades keep mining at the current probabilities until their deadline.

Only the selected scene runs. Main battle/auto-forge simulation pauses in the mine. Mining outside its screen is timestamp-only and costs no animation loop. Inventory, timestamps and upgrades use the existing game snapshot, including cloud saves. Existing heroes receive an empty level-one mine without losing progress.

Resource/pickaxe icons are small native SVGs. No weapons or hero combat assets were changed.

## Independent scenery layers

`assets/mine/cave-background.webp` is the empty cave; `assets/mine/deposit-stone.webp` is the deposit with alpha. Both keep the original 1402 × 1122 canvas and share object-fit/object-position, preserving placement across viewport sizes. Replace either image independently via #mine-background / #mine-deposit; do not bake ore into future cave plates. Original combined cave is source history, not shipped. Miner placement was adjusted toward the front coal inclusion (left 16%, bottom 19%).

Built-in image-generator prompts: background — remove the complete right foreground ore deposit, reconstruct cave/floor, preserve camera/palette/left props and original canvas. Deposit — extract only the same right ore formation at the exact original size/position, surrounding it with solid #ff00ff. Chroma key is normalized to alpha in the production WebP; no canvas crop or resize. Source PNGs: cave-background-source.png and deposit-stone-source.png.
