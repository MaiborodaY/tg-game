# Tiny Swords map assets

Source: the user's local **Tiny Swords (Update 010)** package by Pixel Frog at
`C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords2/Tiny Swords (Update 010)`.

Author page: https://pixelfrog-assets.itch.io/tiny-swords

All PNG files below are unchanged copies, used as runtime sprites within this prototype.

| Runtime file | Source relative to the supplied package |
| --- | --- |
| ground.png | Terrain/Ground/Tilemap_Flat.png |
| water.png | Terrain/Water/Water.png |
| tree.png | Resources/Trees/Tree.png |
| castle-blue.png | Factions/Knights/Buildings/Castle/Castle_Blue.png |
| rock.png | Deco/06.png |
| bush.png | Deco/09.png |
| mushroom.png | Deco/01.png |

`tiny-map.mjs` draws native 64px ground tiles at half scale on a 390 × 540 logical field.
The sandy approach widens toward the deployment area. The small keep sits rear-left,
outside the king's center lane and the start-wave button; scenery does not cover formation cells.
Static scenery is cached in canvases. A source-atop warm tint on the cached road reduces the
source sand's contrast without changing the original PNG or its pixel edge masks. Six tree
frames and sparse procedural one-pixel water glints provide light ambient movement.
Canvas smoothing is disabled for the map and no generated bitmap or new dependency is used.
