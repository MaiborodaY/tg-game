# Kitchen food icons

Built-in image_gen, source `exec-79828449-a08d-41ae-bdd4-820c7ad8ebff.png`.
The approved compact Kitchen mockup (`exec-dcc0b070-f559-4daa-aa4c-f4f1bff0cfe3.png`)
was the reference for the soup, roasted carrots and carrot juice silhouettes.

## Generation prompt

Production game asset: a transparent sprite atlas, exactly three equal columns
by two equal rows, aspect ratio 3:2. Six centered dishes, 12% transparent safety
margin per cell. No text, borders, UI, tile backgrounds or painted checkerboard.
Compact pixel food at 40-48 CSS pixels: coherent stepped shapes, dark blue/olive
contours, two or three flat shades per material, cream highlights. No 3D, glow,
noisy shading or abstract placeholder rectangles.

Top row: dark blue-gray bowl of orange carrot soup with green garnish; pale plate
with two roasted carrots and green tops; short glass of carrot juice with a leaf.
Bottom row: matching bowl of creamy potato soup; plate with split baked potato;
plate with three overlapping golden potato pancakes. Nothing crosses a cell.

## Runtime export

Run `node king-defense-toon/scripts/prepare-kitchen-art.mjs` from the worktree
root. Only `assets/kitchen/dishes.webp` is loaded by the game: 288 x 192, six 96px
cells, displayed at 44px. WebP quality 84, alpha quality 100; a 20 KiB maximum is
enforced. Actual byte count and source/output hashes are in `provenance.json`.
The large source PNG is retained for edits and is not imported by the game.
The Kitchen mounts on first selection; refreshes reuse the same atlas and nodes.
