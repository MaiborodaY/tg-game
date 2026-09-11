# Medieval weapons: connected locally

All ten approved designs are available in epoch 3: Knight Sword, Falchion,
Bearded Axe, Double Axe, Long Spear, Halberd, Spiked Mace, War Hammer,
Longbow, Crossbow. There are 17 weapons total across the first three epochs.
Medieval first has a forge chance at anvil level 11.

Each new weapon was generated individually with the built-in imagegen tool using
`concepts.png` as its design reference. Exact prompts: `<id>-prompt.txt`.
Original generated images with real alpha: `<id>-source.png`.
Trimmed full-resolution images: `<id>-clean.png`; crop bounds: `crops.json`.
Runtime PNGs are 384px high and slot icons 96px, under `assets/weapons/`.

The existing `design/build-set.cjs` contains the fitted sizes, grip pivots and
rotations. Hunter Hides bakes all 15 standalone sprites into `weapon-atlas.png`;
Club and Bone Spear continue to use their original set layers. New swords alternate
swing and thrust; Long Spear thrusts, axes/mace/hammer/halberd swing. New thrusts
point forward. Ranged weapons retain the shared shot timing; crossbow has six
support/recoil poses appended to every set's shooting atlas, with fitted gloves.

All attack intervals remain one second. Both new ranged weapons have range 0.46
and 80% rolled weapon damage rounded to a whole number. Appearance variants have
no extra stat multiplier. No projectile effects or affixes were introduced.

Rebuild Hunter Hides after weapon fitting. Rebuild all sets after shooting pose
changes. `/?weapon=knight-sword` opens the existing local-only, non-saving weapon
trial; the selector includes all 17 weapons. These changes are local, not deployed.

Validation: `node --test game.test.mjs` (35 passing),
`node qa/medieval-weapons-render.cjs` (10 weapons, 4 poses, actual game renderer).
The real game weapon selector was also checked on 390x844. Every new weapon was
forged at item levels 1 and 100, equipped and round-tripped through save restore;
attack cadence and ranged distance checks pass.
