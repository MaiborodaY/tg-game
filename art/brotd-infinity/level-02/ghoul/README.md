# Ghoul - animation artwork v1

Generated with the built-in imagegen tool from the approved [ghoul concept](../concepts/ghoul-v1.png). The ghoul is the selected third and final ordinary enemy type for level two, replacing the declined axeman proposal. Artwork only; no gameplay, balance or deployment changes.

## Files

- ghoul-source.png: original transparent 1254 x 1254 PNG, 1165104 bytes.
- ghoul-768-lite.webp: 768 x 768, quality 90, 145084 bytes. Main lightweight export.
- ghoul-768.webp: 768 x 768, lossless encoding after nearest-neighbor reduction, 346288 bytes.
- ghoul-768.frames.json: explicit crop rectangles for 16 poses, shared by both WebP exports; names the lightweight export.
- ghoul-768-lite-preview.png: opaque green-background inspection preview, not a transparent runtime asset.

The approved concept is also preserved as PNG and as [768px WebP](../concepts/ghoul-v1.webp), 196524 bytes.

## Frame order

| Frames (zero-based) | Action | Poses |
| --- | --- | --- |
| 0-3 | Idle right | Four breathing variations |
| 4-7 | Walk right | Four low stalking steps with alternating contacts |
| 8-11 | Attack right | Crouch, windup, claw impact, recover |
| 12-15 | Attack down | Crouch, windup, claw impact, recover |

Impact is local pose 2, atlas frames 10 and 14. The side attack uses the left arm on the bare shoulder; its windup was corrected to match the impact. The frontal attack uses the right arm on the cloth shoulder. Both are intentional distinct direction sequences in the final sheet. No weapon, detached attack effect or death sequence is included.

Use the supplied rectangles rather than assuming equal quarter-grid cells: the side swipe extends beyond its nominal column. Feet anchors and playback timing require measurement and integration; none is wired into the game. The proposed role is an agile claw-attacking melee troop, without selected stats.

## Validation

Source analysis identified sixteen separate large connected character components. Each exported crop contains its figure and has clear margins at an alpha threshold of 20/255. Both WebP files retain the resized alpha channel exactly; the lossless export retains all resized visible colors exactly. The lightweight image was inspected on opaque green, including the side windup and impact. No gameplay testing or balancing is implied.

## Built-in imagegen prompts

### Initial atlas

Use case: identity-preserve.
Transform this APPROVED GRAVE GHOUL concept into ONE transparent animation sprite atlas for BroTD Infinity, a simple 2D mobile pixel-art game. Preserve the exact accepted creature: cold slate-blue-grey skin with lighter highlights, big blunt fleshy head with small amber eyes, uneven ivory teeth and charcoal swept-back scruffy hair, small rounded ears, hunched back, short deeply bent legs, long heavy forearms and large clawed hands, long ivory claws, dusty purple torn waistcloth and torn purple strip over one shoulder, brown rope belt. Same anatomy, coloring and ordinary troop scale in every frame. Exactly two arms, two hands, two legs, two feet. No skull head, no exposed bones, no weapon, no armor or new accessories.
Remove ALL forest, ground and cast shadows. REAL transparent alpha0 around and between character parts, no painted checkerboard, no matte. Crisp chunky dark navy PIXEL outlines, flat two-to-three-tone shading and restrained palette; silhouette readable at 45-55 logical pixels. No soft painterly surface, no 3D, no glow or fine noisy texture.
ONE square atlas of EXACTLY FOUR equal columns and FOUR equal rows =16 isolated complete poses. Generous completely transparent gutters on every side. Within each cell: body center x50percent, feet baseline y77percent, hunched head-to-foot body height ONLY48percent of cell height; full claws and reaching arms must remain within x10..90percent and y10..90percent. Make the characters small enough inside cells to guarantee room for outstretched attack arms. Same character scale and camera in every pose, never enlarge attack rows. Preserve entire fingers, claws, hair and feet, no cropping and nothing ever crosses a cell boundary.
ROW1 FOUR IDLE RIGHT poses, hunched three-quarter view facing screen RIGHT. Low stalking posture, one hand near ground, other reaching slightly forward, tiny breathing only, feet planted. Cloth and hair remain stable.
ROW2 FOUR LOW RUN/WALK RIGHT poses, visibly alternating legs and arms like a fast stalking ghoul: frame1 left foot reaches forward/right foot trails, frame2 passing crouch, frame3 right foot reaches forward/left foot trails, frame4 opposite passing crouch. The large hands counter-swing subtly. Keep body close to ground and almost constant head height, no hopping, floating or identical repeated steps.
ROW3 FOUR CLAW ATTACK RIGHT poses: frame1 anticipatory crouch with attacking right arm drawing backward, frame2 clear raised/back claw windup, frame3 IMPACT with that arm and claws extended toward screen RIGHT and torso lunging forward, frame4 recoil/recovery arm bending back toward idle. Left arm balances and stays attached and visible. Feet remain grounded. The attack is a physical close-range swipe, no detached slash artwork, no effects or extra claws.
ROW4 FOUR CLAW ATTACK DOWN poses, body/face toward viewer and claws striking toward image BOTTOM: frame1 crouch and pull claw back, frame2 raised claw windup, frame3 IMPACT with the same hand thrust/swiped down-forward toward viewer and torso forward, frame4 recoil. Foreshortening in mild elevated game camera, full hand and claw tips visible within own cell. The fronts of face and shoulders must differ clearly from side-attack row.
Intentional distinct poses, especially walk contacts and claw impact versus windup. True clean transparent PNG. No text, labels, grid lines, UI, contact shadows, motion trails, spare props, bonus frames, scene or background.

### Spacing and side-attack correction

Use case: precise-object-edit.
Correct this existing transparent 4x4 ghoul animation sheet. Keep exact accepted ghoul identity, purple fabric, blue-grey skin, navy outlines, body anatomy, sixteen-pose order, all idle/walk and front-facing poses. Two precise fixes:
1) Make ALL SIXTEEN figures uniformly 65percent OF THEIR CURRENT drawn size within their cells, keeping consistent physical body scale among all sixteen. Same reduction for all, including outstretched hands. Place each body centered horizontally within its own equal cell, feet baseline near local y77percent. Every complete figure including every claw must have wide clean transparent margins on all four sides. The third row, third column's extended arm MUST remain inside its cell with generous transparent space before the fourth-column figure. No silhouettes can touch or cross adjacent cells. Same square sheet and exact FOUR equal columns by FOUR equal rows, without visible lines.
2) Fix ONLY third row third column's side IMPACT arm anatomy. In third row second column the ghoul raises his anatomical RIGHT arm (viewer-left shoulder in this three-quarter pose). In the IMPACT pose immediately after it, THAT SAME RIGHT ARM must sweep ACROSS IN FRONT OF HIS CHEST and extend toward screen RIGHT, ending in the outstretched attacking claws. His anatomical LEFT arm stays lower as balance, bent near his body. Do not swap which arm attacks. Keep exactly two arms and two hands, no duplicate arms. Clear visible continuous shoulder-to-elbow-to-wrist anatomy. Strong grounded forward lunge.
Otherwise preserve character design and all other poses. Clean actual transparent PNG alpha0 outside the intentional character silhouettes. No background, cast shadow, labels, text, grid, bonus frames, new accessories, particles or detached slash effects. Crisp chunky pixel-art outlines.

### Final windup correction

Use case: precise-object-edit.
Change ONLY the single sprite at ROW THREE, COLUMN TWO of this 4-by-4 ghoul atlas (the raised-claw side windup pose). All other fifteen sprites must remain unchanged in design, pose, scale, position, colors and alpha; keep the overall layout exactly.
The current windup raises the arm on the VIEWER'S LEFT, attached to the PURPLE shoulder strip. That is the wrong arm for the next impact pose. Correct THIS ONE windup pose so the OTHER arm, on the VIEWER'S RIGHT, is raised in a high backward windup above and to the RIGHT of the ghoul's head. This is the anatomical LEFT arm, emerging from the bare shoulder WITHOUT the purple strip. Its clawed hand must be visibly raised near the upper RIGHT of the cell, ready to swipe toward RIGHT as the already existing impact sprite in row3column3 does.
The purple-strip shoulder arm on the VIEWER'S LEFT must be LOWERED, bent forward/down at waist level as a balancing hand, NOT raised. Exactly two complete arms and two hands, no extra limb. Keep same ghoul crouch, grounded feet, hunched head, size and placement. This is just changing which arm is raised in that one pose, to match the next impact frame.
Do not redraw the impact or any other pose. Preserve clean transparent background and wide gutters, all claws entirely inside their cell. No annotations or text or background or effects. Same pixel art and crisp dark navy outlines.
