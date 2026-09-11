# Raster equipment pipeline

`hunter-hides` and `bone-warrior` are connected as appearance qualities 0 and 1. Each covers eight visible slots. Accessories without a character layer keep their existing icons; new accessory drawings are a separate art pass.

## Fixed contract

- Body and poses: `../hero-base-v2.svg`, `../hero-base-v2-poses.json`.
- 22 shared pose frames; walking 1–8, swing 9–14, thrust 16–21. Contact frames are 12 and 19. Frame 15 remains unused; death rotates the neutral body in the scene.
- Hero canvas: `[450,50,700,700]`, ground anchor `(750,710)`. Game body height is `59 / 1.5` logical pixels.
- Fourteen raster pieces represent eight visible slots. Use `body-parts-template-v2.png` (4x4, last two cells empty): helmet, chest, cape, weapon; rear/front shoulders and closed gloves; rear/front hip wraps and shin guards; rear/front complete ankle boots. `legs` owns hip wraps and shin guards, `boots` owns footwear. Never generate them as one combined piece.
- The pose JSON owns motion. `set.json` owns art crop, size, pivot and attachment. Do not redraw the body or invent separate motion for each set.
- `size` and `target` use the body's source coordinates. `pivot` uses fractions of the trimmed source piece. `rect` is an explicit source-pixel crop overriding the regular grid when generation drifts.

## Produce the next set

1. Approve one dressed concept. Reuse an already approved concept when available.
2. Make `design/sets/<set-id>/` with `reference.png`, `set.json` and the exact `generation-prompt.txt`. Start from the hunter manifest and preserve the part IDs/anchors.
3. Use the built-in image-generation tool with the approved reference, `body-parts-template-v2.png` and the reusable `generation-template.txt`. Generate the **whole parts sheet** in one call, preserving materials, silhouette, lighting and facing direction. No body, no ground shadows, no grid or labels. Require real transparency; plain white is the fallback, never checkerboard. Do not generate each animation frame independently. Bracers and boots must show the exterior as worn at limb height: no oval holes, empty tubes, recessed sockets or interior rims. A fur cuff is a band, not an open ring.
4. Copy the generated sheet into that directory as `source.png`. Keep the original generation unchanged. The first sheet was 1448×1086 despite requesting 1536×1152; the builder reads actual dimensions.
5. Set `background` to `alpha` for true transparency or `white` for the approved white-background cleanup. Adjust explicit crop rectangles if items cross grid boundaries. Do not accept a clipped silhouette. `allowCrop` is only for a documented intentional cut: the hunter vest excludes its extra generated lower skirt because hip panels already own that area.
6. Run from the project root:

   ```powershell
   node design/build-set.cjs hunter-hides
   ```

   Substitute the next set ID. This is an offline build; it does not call a paid API or install a runtime engine.

7. Inspect `qa/<set-id>-poses.png`, every extracted part, the report and the actual-size browser preview. Fit edits go into `set.json`, then rebuild. The script fails on unapproved crop-boundary contact and atlas clipping. These checks do not replace looking at face visibility, cuffs, hip overlap or foot contact.
8. Check bare body, each slot separately, all slots together, walking, attack, and existing-item combinations. Confirm the 39px game body size. Do not replace a set's generated art with a simplified vector tracing.
9. Connect the approved atlas and icons to the game's existing item appearance selection. The first set replaces appearance `quality: 0` for visible items; current epoch/value/mastery rolls and both other appearance choices are unchanged. Later epochs still use the prototype appearance selection until their own art mapping is designed.

## Outputs

`assets/sets/<set-id>/` contains fourteen cleaned PNG parts, eight PNG inventory icons from those same pieces, `atlas.png`, `preview-atlas.png`, and `atlas.json` with rows/slots/anchor metadata. All files are rebuilt from source+manifest+body poses.

- Game atlas: 96px cells, 22 columns, 26 rows, ~20.1 MiB decoded per set. The browser loads this atlas only; no runtime crop, SVG tracing, mesh deformation or image generation.
- Preview atlas: twice the resolution, used only by `sets.html`, not the game.
- `build-report.json` records source dimensions, extracted bounds, edge checks and encoded/decoded size.
- The source sprites contain baked shadows/highlights. They do not require graphical effects or extra lighting on the phone.

## First pass observations

The generator produced usable, stylistically consistent parts, but did not honor exact grid spacing or the requested vest boundary. Twelve crop adjustments and an intentional vest cut were saved explicitly. The hood needed face-hole alignment; cuffs belong beneath the hands. Thus generation can be done in batches, but each new sheet still needs an art/fit review. No claim of fully automatic generation-to-production is made.

The initial cuffs and boot tops also had unwanted hollow openings. Only these four pieces were regenerated with the built-in tool; `limbs-source.png` and `limbs-repair-prompt.txt` preserve that correction. Per-part `source` plus `rect` select repairs without touching the other eight pieces. The original exact prompt is retained for provenance; use the corrected shared template for future generations.

The cuff-only version still read as tiny wristbands on the bare hero. The final gloves are complete closed fists from `gloves-source.png`, generated using `hand-shape-template.png` and `gloves-repair-prompt.txt`. They cover the palm and fingers, and the bare hand layer is skipped when gloves are equipped. The weapon grip remains behind the glove. The current shared prompt includes this requirement; the previous repair sheet remains the source for boots only.

`sets.html?set=hunter-hides` previews the example. Replace the query value to inspect another built set with the same viewer. `scene.mjs` consumes both low-resolution atlases and selects each equipped slot independently. Hunter weapon swings; Bone Spear thrusts; the remaining sword appearance alternates. Merely creating a new set folder does not connect it to loot.

Attack hand rotation is stored in `anchors.handAngles` (degrees relative to the neutral grip). The hand artwork, glove and weapon share the same hand anchor and turn; target offsets rotate with the grip. Keep frame 12 / 19 at the hit moment. Sword attacks alternate swing and thrust; unarmed attacks use thrust.

Cape motion uses each pose's `cape` transform around the set's shoulder attachment (`target` / `pivot`). Walk frames sway in a loop; attack recovery carries the strongest backward swing. Motion is baked into the atlas.

Open hats can set `showHair: true` in `set.json`; the builder keeps the original hero hair in the `head-helmet` row. The game uses that row from the equipped headgear's own atlas, matching the fitting preview. Existing helmets omit this option and keep their original hidden-hair behavior.

## Separate boots and leggings

The initial attempt to split combined shin/boot rasters was rejected. Those masks were removed. Both sets now use complete separately generated parts from `separate-legs-boots-source.png`; exact prompts are alongside each source. Icons for footwear frame the two boots as a compact pair. The shared bare body remains visible beneath shin armor; equipping boots selects the foot-masked body rows. Slots, item values and save keys are unchanged.
