# Skeleton archer - animation artwork v1

Generated with the built-in imagegen tool from the approved [archer concept](../concepts/skeleton-archer-v1.png). Artwork only; gameplay, balance and deployment are unchanged.

## Files

- skeleton-archer-source.png: original transparent 1254 x 1254 PNG, 1250835 bytes.
- skeleton-archer-768-lite.webp: 768 x 768, quality 90, 191040 bytes. Main lightweight export.
- skeleton-archer-768.webp: 768 x 768, lossless encoding after nearest-neighbor reduction, 412152 bytes.
- skeleton-archer-768.frames.json: 16 complete frame rectangles for either WebP. It names the lightweight file. Use these rectangles rather than a strict equal grid: a fully drawn side arrow reaches its nominal cell boundary.
- skeleton-archer-768-lite-preview.png: opaque green-background inspection preview, not a transparent runtime asset.

## Frame order

| Frames (zero-based) | Action | Poses |
| --- | --- | --- |
| 0-3 | Idle right | Four idle variations |
| 4-7 | Walk right | Four alternating step poses |
| 8-11 | Shoot right | Nock, full draw, release, recover |
| 12-15 | Shoot down | Nock, full draw, release, recover |

Release is local pose 2 in both shooting rows (atlas frames 10 and 14). The arrow is no longer nocked in release and recovery. No detached projectile or death sequence is included. Left-facing playback can mirror the side row if the consuming renderer uses that convention. Feet anchors, playback timing and combat integration remain separate work.

## Validation

All sixteen frame regions contain visible character artwork and have clear margins at an alpha threshold of 20/255. Both WebP files preserve the resized alpha channel exactly; the lossless file also preserves all resized visible colors exactly. The lightweight image was inspected composited over opaque green to check transparency, bow pose readability and full silhouettes. No gameplay test or balance claim is made.

## Built-in imagegen prompt

Use case: identity-preserve. Transform the supplied APPROVED skeleton archer concept into a transparent animation atlas for a small 2D mobile game character.
Preserve exact identity: large angular ivory skull, dark navy eye sockets, simple rib cage and short sturdy bare bone legs, ragged dusty PURPLE short hood with full skull face visible, matching purple waistcloth, brown diagonal leather strap and small plain brown quiver with three ivory arrow fletchings. Ordinary weak skeleton archer. ONE simple curved wooden bow always in ANATOMICAL LEFT HAND; RIGHT hand draws string. No sword, shield, armor, magical effect or detached arrows.
Use clean Tiny Swords-compatible chunky PIXEL ART, limited colors, dark navy crisp stepped outlines, simple flat 2-3tone shading. Simplify to the readable detail of a 50-pixel game enemy, no painted textures or soft airbrush.
Remove the entire background and ground. Output ONE square PNG atlas with REAL transparent alpha. EXACTLY FOUR equally spaced columns and FOUR equally spaced rows. Sixteen complete poses. Wide empty transparent gutters. In each cell the skull-to-feet body should be only FIFTY percent of cell height, feet near local 78percent height, body centered at local50percent width. Every bit of bow, arrow, fingers and quiver must fit safely between local10percent and90percent in both dimensions. No figure ever crosses a cell boundary. Same skull/body size in ALL sixteen frames. Small sprites with generous empty margins are intentional.
ROW1: FOUR subtle IDLE frames facing screen RIGHT and slightly viewer; bow lowered in left hand, right hand relaxed near quiver, both feet planted.
ROW2: FOUR WALK RIGHT frames, bow carried low: frame1 left foot forward and right foot back; frame2 passing step; frame3 right foot forward and left foot back; frame4 opposite passing step. Truly alternate legs, no hopping and no identical copied legs. Same bow hand and quiver side in all frames.
ROW3: FOUR SHOOT RIGHT frames: 1 raise bow/nock one arrow, 2 fully draw with right hand at cheek and bow extended RIGHT in left hand, arrow points right, 3 RELEASE, bowstring sprung straight/relaxed, right hand follows back and NO ARROW remains on the bow, 4 recover lowering bow with NO ARROW. Bow, string, arrow and hands must make physical sense. Only frames1and2 show a nocked arrow. No flying projectile drawn outside the character.
ROW4: FOUR SHOOT DOWN frames facing viewer toward BOTTOM of image: 1 raise/nock, 2 full draw, 3 RELEASE with no arrow on bow, 4 lower/recover with no arrow. Bow/arrow aim toward viewer and bottom, using mild top-down foreshortening, not a repeat of sideways aim. Retain anatomical left/right hands. All weapon parts clearly separated from adjacent cells.
One consistent mildly elevated game camera, keep feet grounded and body proportions stable. No shadows. No environment. No glow. No labels, grid lines, text, UI, checkerboard, colored background, spare weapons or bonus frames. Transparent alpha0 outside intentional character silhouettes and inside empty gaps; crisp opaque pixel contours.
