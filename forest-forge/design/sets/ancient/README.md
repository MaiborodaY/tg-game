# Ancient equipment batch

Three workshop-ready sets: Bronze Warrior, Temple Guard, Legionary. Epoch 2.
Each contains 13 generated raster parts across seven visible equipment slots.
Weapons are intentionally absent and deferred to a separate batch.
The game now selects these armor visuals for epoch-2 equipment by quality 0/1/2. Forge probabilities and item stats are unchanged; the current forge still rolls qualities 0/1. Weapons retain the existing visuals until their separate batch.

## Sources and assembly

- Approved simplified direction: `concepts-simple.png`.
- Actual hero-part input: `body-parts-no-weapons.png` (derived from the existing body template with the weapon guide omitted).
- Each set directory retains its cropped `reference.png`, exact `generation-prompt.txt`, `source.png`, placement `set.json`, and `build-report.json`.
- Bronze Warrior additionally retains the initial source and targeted correction prompt. The corrected sheet closes boot collars and removes the skin-colored patch inside the helmet.
- Boots and shin guards are independently generated complete parts. They are not slices of a single boot-and-leg image.
- Existing `design/build-set.cjs` removes connected white backgrounds, fits parts to shared anchors, bakes the 22 poses, and builds icons. The absent weapon atlas row remains transparent; no weapon icon or control is emitted.

Rebuild from the project root with `node design/build-set.cjs <set-id>`.

## Verification

All three builds report zero clipped pixels and no part touching its extraction boundary.
Isolated mobile browser checks covered all seven controls, walking and both attack sequences, independent boots/legs/gloves, no horizontal overflow, and no page or HTTP errors.
Evidence: `qa/ancient-sets-browser.json`, each set's `qa/*-browser.png`, `qa/*-poses.png`, and individual-slot screenshots.

Preview: `/sets.html?set=bronze-warrior`, `/sets.html?set=temple-guard`, `/sets.html?set=legionary`.

## Manual fitting

Use **Fit mode** in the workshop (or add `&fit=1`). It renders the cleaned individual rasters against the same pose anchors used by the offline builder. Drag a part to move it, drag a corner to resize around its attachment, or use the numeric fields and rotation slider. The list selects rear/front pieces separately. Arrow keys on the canvas move one rig unit; Shift moves ten. Undo and Reset part are available. Animation controls below the canvas preview the fit in every pose.

Drafts are stored per set under `forest-forge-fit-<set-id>` in browser localStorage, separate from game saves. Leaving Fit keeps the current fit visible. **Compare original** shows the last saved build. **Apply to game** posts positions, sizes and rotations to the local `design/serve.py` preview server, which builds into a temporary directory using the existing builder, checks clipping/empty parts, then replaces that set's assets and manifest. Open game tabs on the same origin refresh their loaded atlas and icons through the native storage event. **Export fit** remains an optional JSON backup. The optional `rotation` field is in degrees around the item pivot after its animated attachment transform.

Fitting verification: `node qa/fit-check.cjs` against the existing preview server. This uses an isolated browser context and checks dragging, corner resize, Undo, keyboard changes, rotation, export, reload persistence, animated hand editing, and mobile layout. A separate touch-drag check and a rebuild from the exported test manifest also passed. Test rebuild output is kept only in `qa/fit-rebuild/`.


Apply verification: `node qa/apply-check.cjs` covers a real fit write/rebuild, an isolated game with Ancient equipment, live atlas refresh, persistence, failed-build preservation, and mobile layout. It restores the test placement afterward.
