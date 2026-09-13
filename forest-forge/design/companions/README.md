# Companion animation preview

Open `/design/companions/` on the local Forest Forge server.

Three 1024 × 768 WebP atlases, 4 columns × 3 rows, 256px cells.
Rows: idle, walk, action. Actions: archer shot and druid heal. The turtle uses idle/walk frames and blocks damage; its generated bash row is unused in gameplay.
Pivot: (128, 240). Metadata: `frames.json`. Extracted RGBA PNGs are retained.

`prepare.py` removes the baked neutral checkerboard, retains small enclosed
highlights, extracts all twelve complete connected figures before assigning
slots, and uses one shared scale per character with a fixed horizontal anchor
and a foot baseline. Every exported frame must retain at least 8px clearance
from its borders. Original generated sources are retained.
Run `python design/companions/prepare.py` from `forest-forge` to rebuild.

The druid's staff hand was corrected in the generated source. Clipped druid
idle frame 4 and walk frame 8 reuse intact frames 1 and 6 respectively.
These are four-pose animations, not interpolated full-motion animations;
generated pose/proportion differences may remain. Runtime copies live in assets/companions. Hiring costs 500 coins per companion; one companion is active and selection changes at the next wave.

All three companions share upgrade prices: 1,000 coins for level 1 → 2, then +11% per level, rounded up to ten coins without accumulating intermediate rounding. For current level L < 100, the cost is `ceil(1000 * 1.11^(L-1) / 10) * 10`; runtime rounding excludes floating-point noise at exact multiples of ten. Level 100 cannot be upgraded.
Examples: 50 → 51 costs 166,280; 99 → 100 costs 27,647,250. Total upgrade cost from level 1 to 100 is about 279 million coins per companion. Character stats, hiring prices and saved levels are unchanged.
