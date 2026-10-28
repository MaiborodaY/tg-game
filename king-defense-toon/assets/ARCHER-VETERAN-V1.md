# Veteran archer v1

Date: 2026-09-16. Status: integrated in the local prototype for user review. Only the archer's appearance/rendering changed; combat stats, saved formations, other guard artwork and campaign remain unchanged.

## Approved model and generation

User-selected reference: [Veteran Bowman](../design-archive/archer-concepts-v1/03-veteran-bowman.png). Stocky older human, bald crown and ginger horseshoe hair, large ginger moustache, red quilted vest, rolled cream sleeves, blue scarf/trousers, broad brown leather accessories and steel-banded wooden bow.

All images were produced with the built-in image_gen tool using the approved image as a reference. No CLI/API fallback. Generated PNGs are copied unchanged; the renderer removes their flat magenta background.

- Main atlas: [archer-veteran-v1.png](archer-veteran-v1.png), 1448×1086 RGB, 4×3 cells of 362px. Source: C:/Users/mrmay/.codex/generated_images/01a0a042-20a3-70b1-8f12-d5a1c5bfb3a1/exec-16cf4636-c932-4e49-921a-ebc150241288.png
- Walking atlas: [archer-veteran-walk-v1.png](archer-veteran-walk-v1.png), 1254×1254 RGB, 2×2 cells of 627px. Source: C:/Users/mrmay/.codex/generated_images/01a0a042-20a3-70b1-8f12-d5a1c5bfb3a1/exec-1d67bbd0-e2d0-4633-b51e-84d35b4c263e.png
- Rejected initial output: C:/Users/mrmay/.codex/generated_images/01a0a042-20a3-70b1-8f12-d5a1c5bfb3a1/exec-dc8743f6-2b5b-43b3-b9f5-661e922617b7.png. Checkerboard was opaque RGB, not alpha. Not used by the prototype.
- The earlier blue-uniform archer assets are preserved.

## Runtime mapping and registration

Main atlas frame0 supplies both recruitment and selected-unit art; frame1 supplies rear idle. Shot: preparation6 → draw7 → release8 at the engine impact time → recovery9 → idle1. Hurt10, death11. The repeated-leg frames2–5 in this atlas are superseded by the separate walking sheet.

The generator reversed the view of frames1/9/10/11; rendering mirrors these around their body anchor to match the shooting direction. The archer then turns as a complete character toward targets to the left; the arrow origin follows the same side. This avoids alternating bow/quiver sides when switching between idle and shooting.

Main body scale is fixed at 49/(324/362 × cellHeight). Measured baselines: [350,349,354,354,351,344,348,351,340,332,336,322]/362. Torso centers: [180,197,171,176,182,189,175,189,188,200,182,174]/362. Crop scanning has32px top padding for raised bows. Death frame11 uses the complete source rectangle x1056,y862,width380,height185 to include the bow extending into empty space beside the cell.

Walking uses four genuinely alternating leg poses from the second sheet, in order0→1→2→3 at8fps, with fixed body scale49/(539/627 × cellHeight). Baselines [596,591,565,563]/627; torso centers [323,290,316,290]/627. These anchors preserve body height through the cycle; rearward feet have some vertical screen displacement from the elevated camera. The walk silhouette including arms/bow is slightly wider than idle, so further polish should keep the chosen stocky model and inspect transitions on the actual phone-sized map.

## Verification

Production Vite build passed. One-off animation mapping checks cover the archer's idle/draw/release/death and preserve old idle/walk defaults for the other guards. No test suite added. At390×844, manual browser checks observed the Veteran's matching recruitment portrait and field idle, advancing in the four-pose walk, and a bow shot facing toward the enemies. Checks used a separate localhost origin; user save on127.0.0.1 was preserved.

## Exact built-in prompts

### Initial reference-assisted atlas (rejected: baked checkerboard; retained outside project only)

```text
Use case: identity-preserve. Asset type: production sprite atlas for a Canvas2D portrait mobile strategy game.
REFERENCE IMAGE ROLE: the attached VETERAN BOWMAN concept sheet is the APPROVED CHARACTER MODEL. Preserve exactly this male human veteran's identity, chunky stocky body proportions and outfit across every frame. This task is animation of this SAME model, not a redesign.
Create ONE transparent PNG sprite atlas, exactly four columns by three rows, twelve equal square cells, 1536x1152 canvas if possible. No text, captions, labels, separators, scenery, tiles, ground, cast shadow, particles or detached arrows. Genuine transparent background, clean opaque character edges without matte contamination.
Character invariants: short broad barrel chest and belly; short powerful legs; disproportionately big hands and forearms; big rounded human head with BALD crown, reddish-brown horseshoe hair at sides/back, VERY LARGE curled orange-brown moustache, bushy orange brows, big round nose, clean chin NO beard. Friendly stubborn expression. RED quilted padded sleeveless jerkin over rolled-up cream shirt sleeves, BLUE short broad triangular scarf/cape covering shoulders and upper back, broad brown leather waist belt, blue trousers and large chunky folded brown leather boots. Brown leather bracers. Full leather quiver with blue-fletched arrows crosses upper back. Long thick natural WOOD BOW reinforced with simple steel bands, clearly taller than the shoulder, carried permanently in anatomical LEFT hand, string drawn with anatomical RIGHT hand. No hood, helmet, steel shoulder armor, slender waist, long thin legs or youthful face. Match the reference polished toy-like stylized 3D render, clean broad materials and soft lighting; approximately THREE HEADS tall, NOT realistic adult anatomy.
STRICT REGISTRATION: each cell384x384. Same character body scale in all cells: standing head-to-soles270px; soles baseline330px; pelvis/root centeredx192. Bow AND every limb contained in cell with20px clear margins; never touch neighboring cell. Walking body only tiny verticalbob, grounded alternating feet. Wide bulky torso must not shrink between frames. Keep quiver/scarf/boots exactly same dimensions. Allow the fallen frame to be naturally shorter but use same scale.
CAMERA: frame0 is a FRONT three-quarter portrait/idle looking toward upper-right side of viewer; full body included. All frames1–11 use the SAME orthographic slightly elevated REAR three-quarter camera, facing AWAY toward upper RIGHT, with broad BACK dominant and tiny profile nose/moustache edge visible. Never mirror/reverse camera between animation frames. Use the reference's rear view as model truth.
ROW MAJOR EXACT FRAME CONTENTS:
row1col1 frame0: FRONT full-body standing idle, friendly stern face and large moustache clearly visible, bow in LEFT hand. This one is the menu portrait.
row1col2 frame1: REAR standing idle carrying lowered bow in left hand, feet planted.
row1col3 frame2: walk CONTACT A, left boot forward grounded, right boot back with heel lifted, arms/bow move naturally slightly.
row1col4 frame3: walk PASS A, planted left boot supports body, right knee bent and moving forward, feet don't overlap as one leg.
row2col1 frame4: walk CONTACT B, right boot forward grounded, left boot back heel lifted, opposite of frame2.
row2col2 frame5: walk PASS B, planted right boot supports body, left knee bent coming forward, opposite of frame3.
row2col3 frame6: prepare SHOT, raise bow toward upper-right target, right hand brings arrow to string.
row2col4 frame7: FULL DRAW, left bow arm extended upper-right, right elbow pulled far BACK to cheek, visibly curved bow under tension, nocked arrow attached to string points at target.
row3col1 frame8: RELEASE, left arm still holds bow forward, right fingers open near cheek, right elbow relaxes, string moves forward, arrow has LEFT bow (do not draw detached arrow).
row3col2 frame9: recovery, bow lowering back toward rear idle, free hand lowers.
row3col3 frame10: hurt, small readable shoulders-and-knees recoil, both hands remain attached naturally, same bow hand, upright enough to recover.
row3col4 frame11: defeated lying on side on same baseline330, bow rests beside LEFT hand within cell.
Output only this single uniformly spaced atlas. Priority1: exact reference identity and stocky proportions; priority2: visible grounded walk and genuine drawn-bow/release poses; priority3: cell containment, consistent scale/lighting/handedness.
```

### Final main atlas: archer-veteran-v1.png

```text
Use case: identity-preserve. Edit the supplied12frameVETERAN sprite atlas (IMAGE1 is edit target). IMAGE2 is approved character design reference. KEEP EXACTLY the stocky bald red-haired mustachioed human veteran identity, very wide chest/waist, short thick legs, huge hands, red quilted sleeveless jerkin, rolled cream sleeves, blue scarf on upper back, blue trousers, brown boots/bracers, quiver with blue arrows, same wood longbow reinforced with steel bands. Do not redesign or slim him.
Fix only these production defects and output correctedatlas:
1. BACKGROUND must be perfectly FLAT SOLID MAGENTA RGB255,0,255, NO checkerboard, NO shadows, NO transparency simulation. Allempty space must be puremagenta. Charactersremainopaque withcleanedges; nofloor/text/grids.
2. Allframes1–11 face consistently diagonally AWAY TOUPPERRIGHT, exactly like existingframe7 in image1. Frame0 alonefrontviewformenu. The rearidleframe1 andreturnframe9 andhurtframe10 currentlyfaceopposite: correctthem to SAME upper-rightdirectionasdraw/releaseframes. Keepbow in SAME hand/samesideofthebodythroughout everyrearframe and maintainquiverposition. Rearcamshowscharacter'sback andright-sidefaceprofile. Neverchangesidesmidanimation.
3. WALK frames2/3/4/5 must be genuinealternating walk: frame2 LEFTbootforward, RIGHTbootbehind; frame3 LEFTfootplanted, RIGHTkneeswingsforward withbootlifted; frame4 RIGHTbootforward, LEFTbootbehind (obviouslyoppositeframe2); frame5 RIGHTfootplanted, LEFTkneeswingsforward withbootlifted. Do NOT repeat a liftedleftfoot inall4frames. Separatebootsclearlyso2legscanberead. Naturalordinarywalkingnotjumping. Characterfacesupperrightthroughoutsteps.
4. Equalcells4columns3rows, exactly1536x1152 total ifpossible. Everycell384x384. Ensure20pxemptymarginsaroundEVERYfigure/bowincludingbigdrawn/releasedbow. NO characterorweaponcrossesanycelledge. Bodyhead-to-soleheight260pxinallstandingposes, solesbaseline332px. Pelviscenterx192. Fixedbonesanduniformbody scaleeverypose; don'tstretchneck/legswhenattacking. Fullbowalwaysfitsaboveheadwith20pxmargin.
Frameorder: 0frontidle,1rearidle,2walkleftcontact,3walkleftsupport/rightpass,4walkrightcontact,5walkrightsupport/leftpass,6raisebow+attacharrow,7FULLDRAWwitharrowonstring/righthandbackbycheek,8RELEASEwithopenfingers/stringreturned/noarrow(no flyingprojectile),9lowerbowrearidle,10hurtbendingkneeswithoutchangingfacing,11deadonhissidewithbownearsamehandinsidecell.
Maintainmodeltopqualitysculptedtoy3D fantasy render andexactmodelidentityfromreference. Friendlystubbornlargegingermoustache, no beard, noredkeyincharacterart. No othersubjects. Entireoutputis a spriteatlas, NOT aconceptposter.
```

### Final alternating walk atlas: archer-veteran-walk-v1.png

```text
Create a WALK CYCLE sprite sheet of the EXACT stocky veteran archer in the supplied approved character reference. ONE image, a 2 by 2 grid, exactly FOUR poses, no other figures. Flat solid magenta #FF00FF background. No text, ground, shadow or drawn grid.
Model must be IDENTICAL in every pose: very stocky older human man, bald crown with ginger horseshoe hair, big ginger moustache, red quilted vest, short rolled cream shirt sleeves, wide blue scarf across upper back, broad brown belt, blue trousers, thick brown boots and bracers, huge hands, thick wood bow with silver bands, leather quiver with blue feathers. Stylized sculpted chunky Clash Royale-like game character. Same head size and broad waist as reference. NO slender man, NO long legs.
Camera in ALL FOUR poses: rear three-quarter, looking AWAY toward the UPPER RIGHT. Show the SAME back and right-side face profile. The BOW stays on the RIGHT SIDE OF THE IMAGE and the QUIVER stays on the LEFT SIDE OF HIS BACK in every cell. Never mirror the body or shift bow hand. Ordinary relaxed walk, not running, jumping or hopping.
Make the alternating legs visibly DIFFERENT:
TOP LEFT: the boot on the LEFT SIDE OF THE IMAGE is back toward viewer and its heel lifts; the boot on the RIGHT SIDE OF IMAGE is farther forward, planted.
TOP RIGHT: the LEFT-SIDE boot swings forward under the body, knee bent; RIGHT-SIDE boot remains planted. Show two distinct separated boots.
BOTTOM LEFT: OPPOSITE of top-left: LEFT-SIDE boot is now forward away from viewer and PLANTED; RIGHT-SIDE boot extends back toward viewer, heel raised. We must see the SOLE of the RIGHT-SIDE boot here, not the left.
BOTTOM RIGHT: RIGHT-SIDE boot swings forward under body with knee bent; LEFT-SIDE boot stays planted. The lifted leg is the OPPOSITE of top-right.
The two bottom-row poses MUST clearly advance the OTHER leg. Keep torso, head, shoulder and bow direction stable. Do NOT repeat a backward LEFT boot in all four poses. Do NOT rotate or mirror the entire character to fake a step.
Each cell512x512. Same fixed body head-to-sole320px tall, top of bald heady100, groundcontacty420, pelvisx256. Bow contained betweeny70 and430. Leave at least60px margin on every cell side. All four figures EXACTLY SAME SCALE and proportion, leg articulation only plus gentle opposite arm sway. Character fully contained inside each cell. Strong opaque clean edges against pure magenta. This is a small consistent four-frame animation, not four different characters.
```
