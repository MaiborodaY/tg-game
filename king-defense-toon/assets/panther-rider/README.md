# Panther rider runtime art

Source: approved glaive-v2 512px character and 128px projectile under art/brotd-infinity/allies/elves/panther-rider/glaive-v2. Original artwork is unchanged.

Four character rows: idle, walk, side throw, down throw. Each has four poses; the empty hand at pose 2 releases the separate spinning glaive. West mirrors the side row and launch anchor. Death uses the shared static fade. Individual source rectangles, foot anchors and hand anchors come directly from the manifests.

Body reference: 110 source pixels at 54.05 world units, preserving the two-cell footprint and previously approved 15% enlargement. Formation stays still. Cloth palettes follow levels 50 / 100 / 250 / 500; skin, mount, eyes, weapon and alpha are preserved. Existing 96px portraits already use this same model.

The projectile loads only for a Rider in battle and reuses the ordinary single-target projectile lifecycle. The current attack has no ricochet; the source showcase does not define game balance.

Regenerate: node king-defense-toon/scripts/prepare-panther-rider-art.mjs

| Palette | Atlas bytes | Portrait bytes | Changed cloth pixels |
| --- | ---: | ---: | ---: |
| green | 91760 | 8388 | 0 |
| purple | 239480 | 8604 | 6000 |
| red | 237536 | 8374 | 6000 |
| gold | 239504 | 8504 | 6000 |
| black | 235430 | 8270 | 6000 |
