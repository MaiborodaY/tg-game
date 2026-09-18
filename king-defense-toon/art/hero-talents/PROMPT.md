# Simplified hero talent icons

Generated with the built-in `image_gen` tool from the user's approved six-icon
style study, with the original Tiny Swords warrior as the supporting game-style
reference. Source: `exec-7cddc042-04e5-48a6-9d03-03353717691a.png`.
Approved study: `exec-f627b8d9-fb53-43ce-88c7-20af1b611355.png`.
Original unit reference: `assets/tiny-swords-warrior-blue.png`.

The prior revision removed glow but retained too much object detail. This version
redraws the symbols with large pixel shapes, simple silhouettes and a few broad
shading planes. Quiet amber, teal and burgundy backgrounds distinguish the three
branches. Avoid realistic hands, individual feather strands, metal engraving,
scattered debris, fine rays and bright bloom. Judge every icon at 44–48 CSS pixels,
not only in an enlarged source image.

## Runtime contract and export

`talent-art.ts` continues to map the same 18 talent IDs to a six-column, three-row
atlas. No talent data, save IDs, menu dimensions or gameplay rules change.

| Row | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Light | Healing hand | Sun | Winged clock | Shield with drop | Two stars | Group with healing drop |
| Protection | Cross shield | Breastplate | Guardian under arch | Heart shield | Helmet in shield | Castle turret |
| Judgement | Thrown hammer | Heavy hammer | Clock and hammer | Hammer impact ring | Sword | Stunned helmet |

Run `node king-defense-toon/scripts/prepare-talent-art.mjs` from the worktree root.
The game loads only `assets/hero-talents/talents.webp`: 768 × 384, 128px per cell,
WebP quality 84, **53,652 bytes (52.4 KiB)**. This is below the enforced 64 KiB
download budget. It is 11,748 bytes larger than the previous plain-background
revision (41,904 bytes), and 50.2% smaller than the original glowing atlas
(107,796 bytes). The 18 icons still share one image request and the same decoded
dimensions; no runtime filters, extra textures or animations are needed.
The source PNG is for future edits and is not included in the game's download.
Previous artwork is retained in Git history.

## Final generation prompt

Use case: stylized-concept.
Asset type: ONE production sprite atlas of 18 illustrated fantasy talent icons for a mobile game.
Input image 1: the user's APPROVED six-icon style study. This is the main reference: match its chunky pixel shapes, large subject scale, simple cream/blue/gold materials, coloured subdued backgrounds and sparse internal detail. Reuse its hand-with-drop, blue shield, chunky hammer, winged clock, hooded guardian and stunned helmet designs where specified below.
Input image 2: our original Tiny Swords warrior sprite sheet. Supporting game-style reference only; keep the same compact fantasy abstraction and large solid shaded planes. Do not copy its sheet layout or make character animation frames.

Output layout is CRITICAL: exactly SIX columns by THREE rows, 18 equal square edge-to-edge cells, overall 2:1 aspect ratio, preferably 1536x768. Every cell fully filled with its own coloured background. No margins, gaps, separators, borders, frames, numbers, letters, labels, headings, extra cells or text. No single symbol crosses a cell boundary. Each symbol occupies about 75% of its own cell, centred with 8% safety inset except cropped sleeves.

Rendering: the same simplified native 48x48-pixel design vocabulary as the approved study. Clear stepped pixels, large coherent colour clusters, two or three solid shades per material, thin dark coloured outlines, cream edge highlights. Deliberately low detail, immediately identifiable at 44–48 screen pixels. No realistic fingers, carved metals, many feather strands, microscopic texture, elaborate gemstones, detailed anatomy or dither. Simplify the design itself. Do not return detailed paintings with a pixel filter.

Each row uses a coherent quiet background: row 1 muted amber/ochre, row 2 desaturated deep teal/blue, row 3 dark muted burgundy/red-brown. As in the approved study, each cell may have ONE broad slightly lighter curved or angular background shape. Keep backgrounds present and colourful but darker and lower contrast than the symbol. No white hotspots, bloom, neon, radial starbursts, scattered sparks or luminous debris. Small localized gold accents only.

EXACT subjects, left to right in each row:
ROW 1, LIGHT:
1 Healing Light: the approved simple open cartoon hand in a cream-and-blue sleeve with ONE small golden teardrop hovering over its palm.
2 Radiant Light: a stout golden sun disc with a simple cream centre and four short broad rays, no face, no white glow.
3 Quick Prayer: the approved brass pocket watch, ivory face with two thick hands and NO numerals, two wings made of only three stepped shapes each.
4 Overflowing Light: broad cream-and-gold shield carrying ONE blue healing drop, clearly a shield, simple surface.
5 Shared Light: TWO solid gold four-point stars side by side, one slightly smaller, short wide arms with no glow or extra specks.
6 Miracle: THREE very simple blue hooded heads/shoulders, central figure a little taller, ONE gold healing drop above the group. No faces or robes detail.
ROW 2, PROTECTION:
1 Protective Aura: the approved stout blue shield with broad cream rim and ONE gold cross, one quiet blue arc behind it.
2 Unbroken Armour: a broad blue steel breastplate with two large cream shoulder plates and simple brass collar; no person, chainmail or rivets.
3 Wider Sanctuary: the approved hooded guardian bust under ONE broad pale-blue protective arch, no face or fine rings.
4 Last Stand: a chunky blue shield with ONE large cream/gold heart emblem, plainly different from the cross shield.
5 Guardian Ward: a simple closed cream knight helmet enclosed by ONE blue shield-shaped outline; plain dark visor, no crest or ornamental lines.
6 Bastion: a stout cream castle turret with THREE broad crenellations and ONE dark-blue gate; broad silhouette, no brickwork.
ROW 3, JUDGEMENT:
1 Holy Hammer: the approved chunky cream-steel hammer with brass caps and brown handle, angled diagonally, one short broad ochre swing stroke.
2 Righteous Might: a heavier hammer seen nearly upright, oversized blunt gold-capped head facing front, one tiny cream impact wedge below; no rocks.
3 Swift Judgement: a SIMPLE large brass clock face with two dark hands, with a short simplified hammer diagonally behind it; no numerals, no wings.
4 Holy Impact: a downward hammer meeting ONE wide flattened gold impact ring; no individual pebbles, shards, fire or dust.
5 Holy Strike: one broad upright cream sword with stout gold crossguard, blue lower grip, and ONE short gold swoosh behind its blade. No engravings.
6 Heavenly Hammer: the approved simple cream knight helmet with blue plume, dark visor, ONE small gold four-point stun star beside the upper corner.

Consistency: all eighteen feel drawn by one artist, exactly like the approved study. Preserve chunky expressive silhouettes, modest backgrounds and few internal planes. No extra detail for final-tier talents. Readability at small size is more important than ornament. Output only the finished 6x3 atlas.
