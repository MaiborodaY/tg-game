# Trial weapons

Open `/?weapon=mobius-blade`. The selector now switches all 130 weapons in a fresh, non-saving battle. Every epoch has 10 melee and 3 ranged weapons. Exit returns to the player's save. The workshop also links to this trial. All ten epochs have their own weapon pool. All weapon types share the current 2-second attack interval. The latest 61 additions, exact generation prompts and verified fitting previews are indexed in [epoch-completion-v1/README.md](epoch-completion-v1/README.md).

Club and Spear reuse the Hunter Hides / Bone Warrior weapon artwork and animations. Slingshot (epoch 1) and Short Bow (epoch 2) are in the forge pool; armor appearances remain independent. All weapons use the shared 1-second attack cycle. Ranged items have 80% of the corresponding melee item's rolled weapon damage, rounded to the nearest whole number (minimum 1). Base hero and accessory damage are unchanged. No projectile simulation or new affixes.

Slingshot range is 0.40 and Bow range is 0.46 of the battle width. The hero stops to attack; melee enemies keep approaching. Shooting works at close range too and never makes the hero retreat.

Both new PNGs were made with the built-in imagegen tool, using the existing club as a style reference. Exact prompts are `slingshot-prompt.txt` and `short-bow-prompt.txt`. Unmodified generated files are `slingshot-source.png` and `short-bow-source.png`. Both have genuine alpha. Transparent padding was trimmed; shipping images were resized to 384px height, and icons to 96px including padding. Shipping files are under `../../assets/weapons/`.

The shared pose file `../hero-base-v2-poses.json` now has six `rangedPoses`. These affect arms, hands and attached gloves only; existing walk/melee frames are unchanged. `../build-set.cjs` bakes these six rows into `shoot-atlas.png` for each set. Hunter Hides also bakes `weapon-atlas.png` for the five standalone weapon sprites; its metadata records their row order. The game lazily loads these small extra strips when the corresponding gear is used. All use the same set bounds/anchors as its main atlas, including custom fits.

Rebuild with `node design/build-set.cjs <set-id>`. After changing the shared shooting pose, rebuild all six sets. After changing ranged weapon sprites or placement, rebuild Hunter Hides. Apply in the fitting editor also rebuilds the shooting layers, so fitted gloves follow the same attachments.


## Ancient batch: connected

Gladius, Bronze Axe and Battle Spear are prepared as images and 96px icons under assets/weapons. All three are attached to the hero and available in the forge pool in epoch 2. Gladius alternates swing and thrust; Bronze Axe swings; Battle Spear thrusts. All share the 1-second attack interval and ordinary melee damage. Old owned weapons retain their identity and values.

Generated with the built-in imagegen tool using the existing Club and Bone Spear as style references. Exact prompts are gladius-prompt.txt, bronze-axe-prompt.txt and battle-spear-prompt.txt. Unmodified source images use the -source.png suffix; cleaned full-resolution images use -clean.png. The sword has genuine generated alpha. The axe and spear had a painted grey checkerboard; their connected neutral background was removed programmatically, preserving the dark outline and bronze colors. Shipping images are 384px high. ancient-preview.png shows the cleaned artwork and 35px silhouettes.


Equipment is bound to an exact epoch. Weapon pools use equality, not a minimum epoch. Armor uses the corresponding ARMOR_SETS entry and epoch-specific names. AVAILABLE_EPOCHS is derived from epochs with both armor sets and weapon entries; FORGE_CHANCES normalizes the original anvil chances over that content. When none of the original chances target completed content, the highest completed epoch receives 100%. Future epochs enter automatically when both catalogs are populated. The UI shows these effective chances. Existing mislabelled epoch-2 weapons are mapped to the corresponding Ancient type on restore without changing value, sale, item level, or epoch.

## Medieval batch: connected locally

Ten additional weapons complete epoch 3, which now participates in forging from anvil level 11. Full asset and animation notes: `medieval/README.md`. The weapon trial now lists 17 weapons. Shooting strips contain 12 columns: six bow/slingshot frames followed by six crossbow frames. Rebuild all nine set manifests after editing these poses.


## Weapon expansion: connected locally

Nine more weapons (two melee and one ranged per existing epoch) bring the catalog to 26. Only the flail adds relative chain movement; all hero animations and attack timing remain unchanged. Sources, exact prompts, fitting and checks: `expansion/README.md`. All 36 model tests pass. Trial: `/?weapon=chain-flail`. Public deployment is unchanged.

## Epochs 4–10: 43 more weapons, connected locally

Seven six-item generation sheets add four melee and two ranged weapons per epoch. The user's extra handheld ship cannon gives Gunpowder seven new weapons. Existing 26 weapons are retained, for 69 total. Exact built-in generation prompts, original sheets and fits are in each directory:

- [Gunpowder](gunpowder/README.md), atlas owner Musketeer.
- [Modern](modern/README.md), atlas owner Field Scout.
- [Futuristic](futuristic/README.md), atlas owner Neon Runner.
- [Space](space/README.md), atlas owner Lunar Scout.
- [Interdimensional](interdimensional/README.md), atlas owner Rift Nomad.
- [Underworld](underworld/README.md), atlas owner Ash Reaper.
- [Divine](divine/README.md), atlas owner Dawn Herald.

All 44 model tests pass, including forge/equip/reload at item levels 1 and 100 and common 2-second cadence. Local browser renders cover all 43 weapons in four combat poses; all 1,462 weapon atlas cells are visible and unclipped. Each preview loads only its own weapon atlas. Evidence: `qa/later-epoch-weapons-runtime.json`, `qa/later-epoch-weapon-atlases.json` and `qa/later-epoch-weapon-icons.png`.

This first broad batch is integrated but the user judged its art too uniform. The next batch must follow [the stronger fantasy direction](fantasy-brief.md), with one sheet reviewed before scaling up. These next-batch images have not been generated. No publication or production testing was performed for this update.
