# Атлас алхимика

Встроенный imagegen. Референс: [утверждённый концепт](plague-alchemist-concept.webp). Технический экспорт и превью выполнены через Sharp.

```text
Use case: stylized-concept. Production game sprite atlas: genuine transparent RGBA, exactly 16 complete sprites in a 4 by 4 grid.
Reference image is the EXACT approved Plague Alchemist to animate: squat undead bottle thrower, huge ivory hooked-beak mask, round green lenses, purple hood, brown apron, short boots, skeletal fingers, ONE big green poison flask strapped to his back, and ONE spare bottle at his belt. Preserve his identity, compact proportions, limited pixel palette and large dark stepped outlines. This is an ordinary small enemy, not a realistic person. Sparse pixel clusters, 2-3 shades, no extra costume detail.
Match the reference throwing hand: bottle hand on VIEWER-RIGHT, opposite hand on VIEWER-LEFT gripping his chest harness. Keep the same arms in every frame. Backpack remains behind his VIEWER-LEFT shoulder; never swap it to the other side. Keep the big backpack flask and one belt bottle intact even when the throwing hand is empty. One character with two arms per frame.

Place each complete sprite within the central 72 percent of its equal cell, including backpack cork, mask beak, hands and bottle. Generous empty alpha margins on all four sides. All figures at identical scale, enough room for wind-ups and extended hands. Same boot ground line within each row. No clipping or overlap into neighboring cells. No grid lines or labels.

ROW 1: IDLE RIGHT, four subtle poses in elevated three-quarter view facing right. Small breathing and slight bottle slosh. Bottle held up beside head in viewer-right hand, other hand low on harness. No detached particles.
ROW 2: WALK RIGHT, four distinct walking foot placements, same right-facing three-quarter angle; short alternating boot steps and restrained bob. Bottle stays in viewer-right hand, other on harness; backpack moves with torso.
ROW 3: THROW RIGHT, four phases in same right-facing view. Column1 READY with handheld bottle beside head. Column2 WIND-UP by lifting the SAME viewer-right bottle hand slightly upward and backward on the SAME side of the head; never swing across the face or over the opposite shoulder. Column3 RELEASE: same viewer-right forearm extends toward right, OPEN EMPTY hand; the thrown bottle is absent. Opposite hand stays on chest harness. Column4 FOLLOW-THROUGH: same EMPTY viewer-right hand lowers slightly, other hand still gripping harness. Backpack flask and belt spare remain. No flying bottle, trail or splash anywhere in columns3 or4.
ROW 4: THROW DOWN, four corresponding phases facing mostly toward the viewer, elevated front game view. Viewer-right hand holds bottle in columns1 and2, then is OPEN AND EMPTY in columns3 and4. Other hand remains low on viewer-left chest harness. Keep mask with two lenses and one hooked beak, not a skull with extra noses. Backpack visible behind viewer-left shoulder throughout.

Exactly16 poses. The only bottle to disappear on release is the one in the throwing hand; backpack flask and belt bottle remain. Separate projectile and poison splash will be supplied as other assets. No ground shadow, scenery, smoke, loose bubbles, text, cross/healing icons, UI or extra objects. Actual alpha transparency, not a painted black or checkerboard background.
```
