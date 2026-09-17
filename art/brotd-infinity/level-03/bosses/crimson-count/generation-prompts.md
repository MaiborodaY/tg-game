# Запросы генерации ассетов Багрового графа

Метод: встроенный `imagegen`. Референс обеих генераций — [утверждённый концепт вампира](crimson-count-concept.webp). [Исходный запрос концепта](generation-prompt.md) сохранён отдельно. Исходные PNG ассетов скопированы без изменений; экспорт WebP и превью выполняется через Sharp с уменьшением nearest-neighbor, без программной перерисовки и удаления фона.

## Прозрачный атлас

```text
Use case: stylized-concept.
Asset type: production animation sprite atlas, 16 frames of the approved vampire final boss CRIMSON COUNT for BroTD Infinity level three.
Input image: identity and exact art-style reference. Convert THIS SAME vampire into animation sprites. Remove the graveyard scenery completely.
Output square image with true transparent alpha background, four columns by four rows of distinct full-body sprites. No lines, labels, text, shadows, scenery, UI or particles. Keep every entire figure inside its own invisible equal cell, occupying only the CENTRAL 65 PERCENT of cell width and height, leaving wide clear transparent gaps. Uniform character scale across all sixteen frames. No part of cape, collar, hand, hair or boots may touch another frame or canvas edge. Keep feet near a consistent baseline within each row.

Character invariants: imposing aristocratic vampire with pale lavender-grey angular face, pointed ears, red eyes, two ivory fangs, swept black hair with silver temples and widow's peak; dark plum medieval tunic, broad simple belt, tall pointed dark boots with pale trim, ruby brooch between two metal clasps. Tall wine-red-lined collar and dark navy-black scalloped cloth cape with wine-red inner lining, bat-wing-like CLOTH silhouette, NOT anatomical wings. No weapons, crown, skeleton, armor suit, organ, coffin or staff. Exactly two arms, two hands, two legs. His anatomical RIGHT hand performs the spell; his left hand controls the cape. Front-view right hand appears on the viewer's left. Preserve the approved design in every pose. Strong crisp stepped dark outlines, broad readable pixel clusters and simple 2-3-tone shading matching the reference. Mobile pixel-art readability; no painterly smearing or micro-detail.

Each row has exactly 4 consecutive poses, read left-to-right:
ROW 1, frames 0-3: IDLE-RIGHT. Slightly elevated three-quarter front-right view; subtle cape and shoulder breathing, both boots visible, poised proud predatory stance. Small variation between poses.
ROW 2, frames 4-7: WALK-RIGHT. Same three-quarter right view; four readable slow aristocratic walking poses with alternating feet and cape following the step. Body scale stable, no teleporting or flying.
ROW 3, frames 8-11: CAST-RIGHT. Same view; pose0 ready with right clawed hand forward, pose1 retracts casting hand toward chest for anticipation and leans slightly back, pose2 extends right arm and open clawed hand firmly toward the right to release with slightly brighter RED PALM, pose3 relaxes toward ready. Cape follows torso; no detached magic projectile in this sheet.
ROW 4, frames 12-15: CAST-DOWN, facing viewer frontally from slightly above. Same four phases: ready, draw anatomical right hand back near chest, release by thrusting this hand toward viewer, recover. Casting hand stays on viewer's left. Keep distinctive high collar and ruby visible. Modest crimson light contained inside palm on release, no glow outside the silhouette.

This is only the body atlas; projectile will be a separate file. Do not add floating effects, bat companions, spell rings, ground shadows, motion streaks, extra faces, detached fingers or death scenes. Sixteen unclipped isolated full characters on genuine alpha transparency with GENEROUS GUTTERS.
```

## Исправление отступов атласа

Референс: первая генерация атласа. В финальный набор вошла версия с увеличенными промежутками вокруг фигур, в том числе вытянутой руки при выпуске снаряда.

```text
Use case: precise-object-edit. Production sprite atlas SPACING CORRECTION only.
The attached image is the exact 16-frame Crimson Count vampire atlas to preserve. Keep all sixteen poses and their row/column order, face, hair, clothes, cape silhouette, collar, ruby, hands, boots, crimson palm glow and crisp pixel art rendering exactly as they are. Do not redesign or change any pose.
ONLY repair the packed layout: uniformly REDUCE EVERY ENTIRE SPRITE to about 70% of its current dimensions, then center each in its own perfectly equal invisible cell of a FOUR BY FOUR grid. Maintain one common character scale across ALL frames, including the arm-extended third pose of the third row and the frontal bottom row. Leave a generous fully TRANSPARENT gutter around every complete figure. At least 12% of the cell width on both sides of the WIDEST frame, including the extended casting hand and cape. At least 12% cell height above all hair/collars and below both boots. The current third-row release hand nearly touches the next sprite; this MUST have a wide clear gap. Keep all cape tips and fingers intact, no crop. Full square canvas with real alpha transparency, no background, no checkerboard, no ground shadow, no border or grid marks, no text, no added objects or detached particles. Four rows and four columns, sixteen complete isolated characters. The only intended change is smaller sprites with substantially larger uniform gutters.
```

## Багровый снаряд

```text
Use case: stylized-concept.
Asset type: one small separate projectile texture for the approved Crimson Count vampire final boss, BroTD Infinity.
Reference image: only crimson magic color palette and crisp dark-fantasy pixel art style. Do NOT depict the vampire or any part of him.
Generate ONE compact directional crimson magic bolt centered on a square TRUE TRANSPARENT background. It flies RIGHT: a bright small pale rose diamond/teardrop tip on the right, dense crimson core behind it, two short tapered burgundy flame-like trails extending LEFT. It should read as concentrated sinister vampire magic, not blood spray, not a physical arrow or sword. Chunky stepped pixel silhouette with clear dark wine-red outline, only a few large color clusters. A little semitransparent red edge is allowed, no diffuse bloom. Width around 65% of canvas, height around 30%, generous empty alpha margins on every side. Single connected compact shape, all trails attached to the core, no detached sparkles or dots. Clean readable silhouette when reduced to 32-48 pixels. No text, UI, border, scenery, character, hand, skull, bat, orbiting particles, magic circle, ground shadow or checkerboard. One projectile only, orientation strictly toward RIGHT.
```
