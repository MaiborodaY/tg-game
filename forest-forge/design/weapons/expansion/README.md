# Weapon expansion: connected locally

Nine new appearances, two melee and one ranged in each existing epoch:

| Epoch | Melee | Ranged |
| --- | --- | --- |
| Prehistoric | Jawbone Crusher, Obsidian Pick | Feather Blowpipe |
| Ancient | Sun Khopesh, Tide Trident | Sun Chakram |
| Medieval | Iron Flail, Warden Key | Frost Crystal Staff |

26 weapons total. All nine enter the ordinary forge pool of their exact epoch.
No new hero animations: existing swing, thrust, bow and crossbow poses are reused.
Blowpipe uses the existing crossbow shot; chakram and staff use the existing bow shot.
Only the flail has extra relative movement: its connected chain and weight pivot
around the handle loop across the existing swing frames, with a small walking sway.
The rig poses, arm layers and one-second attack interval are unchanged.
Ranged weapon damage remains 80%, rounded to integers, with no projectiles.

## Assets

Generated individually with the built-in imagegen tool in reference/edit mode.
Exact prompts: `<id>-prompt.txt`; untouched outputs: `<id>-source.png`.
Reference art was the existing prehistoric/ancient weapon art and Medieval concepts.
Cleaned full-resolution art: `<id>-clean.png`. `crops.json` records crop bounds.
Painted checkerboards on pick, trident, key and staff were removed with a connected
neutral-color mask; the key's enclosed hole was cleared too. Small disconnected
background remnants were removed while preserving the connected weapon shape.
The flail was generated as two separate complete components, not cut from an
assembled silhouette. Its cleaned handle and chain/weight are saved separately.

Runtime assets and 96px icons: `assets/weapons/<id>.png`, `<id>-icon.png`.
The existing `design/build-set.cjs` owns grip pivots, sizes and flail angles.
Rebuild with `node design/build-set.cjs hunter-hides`; no other set rebuild needed.
Hunter Hides stores 24 standalone weapon rows with 34 existing poses per row;
Club and Bone Spear retain their set artwork. No runtime physics was added.

## Verification

- `node --test game.test.mjs`: 36 passing, including forge/equip/restore at
  item levels 1 and 100, epoch identity and shared one-second cadence.
- `node qa/expansion-weapons-render.cjs`: nine weapons in four poses using the
  actual game renderer and corresponding epoch armor; no errors or missing files.
- `qa/expansion-weapon-atlas-check.json`: no empty or clipped weapon frames.
- Local trial: `/?weapon=chain-flail`; selector offers all 26 weapons.
  Switching the nine additions does not write to the player's save.

This batch has not been deployed; the shared Cloudflare build is unchanged.
