# Tiny Swords red Torch goblin

Original Pixel Frog PNG copied unchanged from the user's collection:

`C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords2/Tiny Swords (Update 010)/Factions/Goblins/Troops/Torch/Red/Torch_Red.png`

Runtime copy: `tiny-swords-torch-red.png` (57,994 bytes). Source and destination SHA256:

`0612B50E25F5B5FE97600693CECA88BE5244A54049CCE9EB5F7A8DED437F00A6`

## Frame mapping

The PNG is 1344 x 960: seven columns by five rows of 192 x 192 cells.

| Row | Animation | Occupied columns |
| --- | --- | --- |
| 0 | Idle | 0-6 |
| 1 | Run | 0-5 |
| 2 | Attack right | 0-5 |
| 3 | Attack down | 0-5 |
| 4 | Attack up | 0-5 |

The last column is empty in rows 1-4. Aseprite tags confirm the sequences and 100 ms frame durations; its three Original frames are omitted from this PNG. `tiny-torch.mjs` uses the PNG rows, not raw Aseprite timeline indices. The fourth attack frame (local index 3) starts the flame sweep and is synchronized to the existing melee damage time. This is a visual timing choice: the source has no hit-event marker.

## Integration

Only ordinary `goblin` actors use this native art. Enemy archers and the chief now use custom matching sprites documented in TINY-GOBLIN-ARCHER.md and TINY-GOBLIN-CHIEF.md. No TNT or Barrel units were added. HP 30, damage 6, five-gold reward, spawn schedules and saved progression are unchanged.

The sprite uses half native scale, nearest-neighbor sampling and full cells so detached flame trails remain visible. Fixed anchor (96, 128) follows the painted shadow, matching the blue units' scale and grounding; the source has no explicit pivot metadata. Leftward targets mirror the sprite. No additional shadow or generic sword-slash effect is drawn over the authored artwork. The sheet has no death animation; dead actors fade out in their resting pose.

Validation: production build and syntax check passed; one-off frame checks covered all attack directions, exact impact timing, all occupied idle/run cells and the death pose. Mobile browser battle at 390 x 844 showed red Torch goblins alongside the blue army and the unchanged enemy specialists. No test suite was added for this changing MVP.
