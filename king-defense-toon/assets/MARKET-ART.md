# Recruitment market artwork v2

- Mode: built-in `image_gen` (one generation; no fallback CLI).
- Runtime: `web/slave-market-v2.webp`, 192 x 180 pixels, 57,432 bytes, lossless WebP with genuine alpha.
- Source: `sources/slave-market-v2.png`, 1254 x 1254 pixels, 1,182,740 bytes. Keep this source out of runtime imports.
- Generated original: `C:/Users/mrmay/.codex/generated_images/01a0b040-b95f-70d1-b56d-fd264543469b/exec-783a51c6-04eb-47be-b952-901e348f4207.png`.
- Style references: existing `web/slave-market.webp` and `tiny-map/castle-blue.png`.
- Optimization: trim transparent margins, nearest-neighbor resize to at most 192 pixels, lossless WebP (Sharp). Transparency and compact doorway silhouette checked visually.

## Final prompt

Use case: stylized-concept.
Asset type: one production pixel-art building sprite for a small mobile tower-defense game, square transparent PNG.
Input images: Image 1 is the existing recruitment market building, STYLE reference only. Image 2 is the allied blue castle, STYLE and PALETTE reference only. Make a NEW improved standalone market sprite coherent with both references.
Subject: friendly medieval recruitment market building, a compact square-ish sturdy stone-and-timber guild stall with a chunky teal-blue tiled roof, small blue-and-cream market awning, and one clearly visible open central archway glowing warm amber. The glowing doorway is the main interaction focus: characters enter here to be trained. A simple hanging gold recruitment medallion above the door, a short blue pennant, and a tiny wooden step complete the silhouette. Strong clear shapes and warm readable contrast.
Style: Tiny Swords-style handcrafted 2D pixel art, same slightly elevated three-quarter front game camera as references, dark pixel outlines, chunky hand-placed pixel clusters, restrained highlights, blue stone and teal blue roofing, tan timber. Readable at 60 pixels wide. Very simple architecture and minimal small details, roughly 64x64-pixel logical sprite enlarged crisply. Width and height approximately equal.
Composition: only ONE isolated building centered, building occupies 88 percent of frame with a small transparent margin. No rectangular UI card, no borders or framing. Footprint compact, not a wide castle. No disconnected objects.
Background: actual transparent alpha, not a painted checkerboard, no ground tile, no scenery, no backdrop or vignette; only a tiny attached pixel shadow beneath the base.
Constraints: no lettering, words or numbers, no characters or crowds, no chains or cages, no realism, no 3D render, no smooth gradients, no antialiased vector illustration. Keep the inviting warm doorway and blue medieval pixel-art style unmistakable.
