# Запросы генерации

Метод: встроенный `imagegen`. Исходные PNG сохранены без изменений. Экспорт WebP и превью выполнен через Sharp; уменьшение nearest-neighbor, без программной перерисовки.

## Первый запрос атласа

Референс: [утверждённый концепт](cursed-knight-concept.png). Первый результат потребовал увеличения прозрачных отступов между рядами; он не используется как итоговый атлас.

```text
Use case: stylized-concept / production sprite animation.
Asset type: ONE genuinely transparent RGBA animation atlas, exactly 16 full-body sprites arranged in a 4-column by 4-row grid, for the ordinary melee enemy CURSED KNIGHT in BroTD Infinity.
Reference image 1: the approved Cursed Knight concept. Use its exact character identity and crisp chunky pixel-art style. Remove the entire courtyard, flags, roses, wall and ground shadow.

Character invariants in ALL 16 poses: compact stocky possessed EMPTY suit of charcoal-blue plate armor, cool silver worn edges, closed pointed angular helmet with small crimson eyes in dark visor, no flesh or exposed skeleton, broad pauldrons, segmented metal gauntlets and boots, dim red glimmer in a few armor gaps, burgundy cloth chest panel with ONE simple dull-silver bat clasp and short ragged burgundy waist tabard. No cape or shield, no crown or horns. One heavy straight BROAD TWO-HANDED SWORD with worn silver blade, central ridge, two small chips near blade tip, plain steel crossguard, long brown grip and compact pommel. Its size and design must remain consistent.

Anatomy/weapon: exactly two arms, two metal hands and two legs in every pose. Both gauntleted hands grip the SAME sword hilt throughout, the right hand directly below the crossguard and left hand lower toward pommel. Clear physical connection from each shoulder to its own elbow, forearm and gauntlet; avoid fused hands or an extra limb. ONE straight continuous blade firmly attached to crossguard and hilt, no detached blade, no changing sword into spear/axe. Do not swap grips between frames.

Camera/style: same slightly elevated three-quarter 2D game camera as approved concept; first three rows face SCREEN RIGHT, fourth row front-facing SCREEN DOWN. Simplified controlled pixel clusters, stepped dark-navy outlines, readable broad 2-3-tone shading, no realistic metal or smooth painting. Same body proportions, same helmet and armor in all frames. Sword steel stays light enough to read. No weapon motion trails or ghost duplicate blades.

Layout is critical: square canvas, exactly 4 equal columns and 4 equal rows. Each pose centered within its OWN equal square cell with a WIDE transparent gutter on all four sides. The COMPLETE posed silhouette, including sword tip at its widest/highest extent, must fit within the central 70 percent of that cell's width and height. Use the SAME body scale across all frames, determined by the most extended attack pose, never enlarge idle bodies. Every boot, helmet and sword tip comfortably inside its own cell. No overlaps, no cropped weapons, no touching cell boundaries. No visible grid. Consistent ground baseline within each row except small natural movement.

Row1, frames0-3: IDLE RIGHT. Four subtly different breathing/guard poses, knees slightly bent, both hands holding sword diagonally upward in front toward screen right. Small rise/settle of torso, wrists and blade.
Row2, frames4-7: WALK RIGHT. Four distinct chronological steps, both hands keep sword close in a slightly lower forward guard. Right foot forward/left behind, then passing step, then left foot forward/right behind, then opposite passing step. Boots visibly alternate; cloth and shoulders shift slightly.
Row3, frames8-11: HEAVY SWORD STRIKE RIGHT. Four sequential phases: low ready crouch; clear wind-up raising sword ABOVE the helmet with both hands; IMPACT phase strong diagonal down-forward slash toward screen RIGHT with complete blade low ahead of body; recoil/return to guard. Keep both hands on grip in every phase, plausible elbows, no one-handed strike. Full sword always visible with ample margin.
Row4, frames12-15: HEAVY SWORD STRIKE DOWN. Same four phases facing front/screen DOWN: ready, overhead wind-up, IMPACT cutting diagonally down in front toward viewer, recovery. Sword remains offset to one side enough that torso and both boots are readable. Same connected two-handed grip, complete sword tip inside cell.

True alpha transparency across the entire negative space, including gaps between limbs and sword. No opaque background, no painted checkerboard, no colored floor, no cast ground shadow, no particles, no slash effect, no labels, text, title, panels or watermark. Exactly one 4x4 transparent PNG atlas with 16 complete sprites and generous outer padding.
```

## Увеличение отступов — итоговый атлас

Референс: первый сгенерированный атлас. Итоговый результат этого запроса сохранён в `cursed-knight-source.png`.

```text
Use case: precise-object-edit / sprite atlas spacing correction.
Reference image 1 is a completed transparent 4x4 atlas of the Cursed Knight. Keep all SIXTEEN existing character poses, their order, exact armor design and colors, helmet, burgundy cloth, two-handed sword grip, views and animation choreography.
ONLY improve the layout: shrink EVERY complete sprite by the same uniform factor of 0.72, then center it in its own equal square cell on the same 4-column x4-row square canvas. Keep consistent body scale across all16 poses. Increase transparent space surrounding all silhouettes. Each whole sprite, including sword tip and boots, needs a clear large margin INSIDE its cell. Absolutely no character or sword touches a cell border; there must be an unmistakable transparent gap between every row and column.
Particularly important: row3 feet and the overhead sword of row4 column2 currently almost touch. Separate them with a wide empty horizontal strip. Row2 column4 sword tip must also be far from the outer canvas edge.
Keep every sword complete and connected to its hilt. Both gauntleted hands stay on the same sword grip in all poses, no extra arms, no broken or detached weapons. Maintain the same sixteen existing poses: row1 idle right, row2 walk right, row3 sword strike right, row4 sword strike toward camera. Keep character identity unchanged. Do NOT add poses, omit any pose, change weapons or introduce effects.
True alpha transparency everywhere outside the character silhouettes, no opaque background, no painted checkerboard, no ground shadow. Preserve crisp stepped pixel-art outlines and color clusters, never blur. No labels or grid lines. Exactly one square transparent PNG, four rows, four columns, much wider gutters than input.
```

## Утверждённый концепт

Референсы: [гуль второго уровня](../../../level-02/concepts/ghoul-v1.webp) — стиль; [Багровый граф](../../bosses/crimson-count/crimson-count-concept.webp) — тема и палитра.

```text
Use case: stylized-concept.
Asset type: ONE full-body preview illustration of an ORDINARY MELEE ENEMY for level three of BroTD Infinity, for design approval. Not an animation atlas.
Reference image 1 (the ghoul) establishes character illustration style: compact chunky fantasy-game proportions, large readable hands, crisp stepped dark-navy outlines, 2-3-tone pixel clusters, full-body square composition, slightly elevated three-quarter camera. Replace its design completely. Reference image 2 (the vampire count) establishes the level-three faction's dark metal, plum and wine-red palette ONLY: do not reproduce its face, cape, collar or boss silhouette.

New troop: THE CURSED MAN-AT-ARMS, an empty suit of armor animated by the vampire's bound undead spirit. A sturdy compact ordinary infantryman, approximately 3 heads tall, human-sized, balanced stocky proportions. Closed battered iron helmet with simple angular brow and narrow visor, two small concentrated crimson lights within the dark visor. NO skull face, flesh, skeleton bones or human skin. A few small armor joints reveal black emptiness with a dim restrained crimson glimmer: the suit itself is possessed. Broad readable charcoal-blue steel breastplate and pauldrons with worn cool silver edges, articulated metal gauntlets, large armored boots, short torn burgundy waist tabard. One simple dull-silver bat-shaped clasp at chest to tie him to the vampire. No crown, horns, huge wings, oversize shoulders, long royal cape, trophy collection or boss ornaments.

Weapon and pose: one heavy straight broad TWO-HANDED SWORD, with simple long grip and solid steel crossguard, worn silver blade with two small chips, no glowing blade or flames. BOTH gauntleted hands visibly grasp the SAME sword grip, with left hand lower on grip and right hand just below crossguard. The sword is held ready diagonally across the body, blade extending toward upper viewer RIGHT, tip fully inside frame with generous margin. Strong grounded bent-knee stance, both boots visible, torso in three-quarter view facing screen RIGHT, ready for a weighty close-range slash. Exactly one character, two arms, two hands, two legs, one coherent sword. Clear weapon connection and intelligible anatomy. Keep the ordinary troop silhouette simple and reproducible in small mobile animation.

Background: a SMALL SECTION of the vampire castle's abandoned courtyard. Medium-light cracked blue-grey paving beneath feet, side iron fence and low gothic stone parapet, one faded burgundy banner and sparse withered dark red roses near the outer frame; modest cool side lighting, small subdued crimson lantern far behind. The background is secondary and quiet, a location vignette rather than a whole map, no cemetery soil or forest green grass. No vampire, other units, floating spirits, bats, mist covering boots or particle effects.
Crisp controlled pixel art matching the references, charming stylized dark fantasy, never realistic adult anatomy or realistic metal rendering. Square illustration, complete character occupies about 70 percent of frame height with comfortable margins around helmet, sword tip and feet. Soft contact shadow. No UI, text, title, labels, watermarks, multiple views, comparison panels or sprite grid.
```
