# Unit rank colors

Five palettes cover personal levels 1–49 (Blue), 50–99 (Purple), 100–249 (Red),
250–499 (Yellow), and 500+ (Black). Blue uses the existing game sheets.
Purple, Red, Yellow and the Black Monk are unchanged copies from the user's packs:

- Warrior and Archer: `C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords2/Tiny Swords (Update 010)/Factions/Knights/Troops/<Unit>/<Color>/`.
- Monk Idle/Run/Heal: `C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/Units/<Color> Units/Monk/`.
- Purple archer source filename: `Archer_Purlple.png`.

Update 010 has no Black Warrior/Archer. Their Black sheets retain the current Blue
frames, replacing only clothing RGB 64,78,117 / 62,134,152 / 90,179,172 with
67,64,85 / 94,111,134 / 140,150,149 from the native Black unit palette. The older
Black Warrior/Archer frames are deliberately not substituted for the current animations.

All variants retain Blue frame dimensions and alpha maps. Skin, weapons, shadows,
silhouettes, frames and timing are retained. King and enemies are unchanged.
Menu art files are tight first-frame crops. No generated art or runtime recoloring is used.
The source packs are never modified. Run `node king-defense-toon/scripts/prepare-rank-assets.mjs`
from the worktree root to recreate copies, menu crops and the URL manifest.

| Runtime animation file | Source SHA-256 | Output SHA-256 |
| --- | --- | --- |
| swordsman-purple-sheet.png | 779f5fa986fe15736d5b1deec5958a07340644a163ab208714f5a43792fd662d | 779f5fa986fe15736d5b1deec5958a07340644a163ab208714f5a43792fd662d |
| archer-purple-sheet.png | f956a4c6d834b21a74e04a9f0a8d0e432f6e64441836f97cfca498f10854c3f7 | f956a4c6d834b21a74e04a9f0a8d0e432f6e64441836f97cfca498f10854c3f7 |
| healer-purple-sheet.png | ee8b2fc546f93c573f303a17936a651f182556400460b9addb68b3effffd18ec | ee8b2fc546f93c573f303a17936a651f182556400460b9addb68b3effffd18ec |
| healer-purple-walk.png | bb0463538790fe2e00399d79801710cd036be7125dc2554af42ad8081d150ecd | bb0463538790fe2e00399d79801710cd036be7125dc2554af42ad8081d150ecd |
| healer-purple-cast.png | 03eea16ba53098429eeb4ead36dbbf30d641a351bec359325be437ebc7204c69 | 03eea16ba53098429eeb4ead36dbbf30d641a351bec359325be437ebc7204c69 |
| swordsman-red-sheet.png | a1f67ed61134a20df6211e1e9fff1c33e9964512fddf4ccdb3c1673752b9bc14 | a1f67ed61134a20df6211e1e9fff1c33e9964512fddf4ccdb3c1673752b9bc14 |
| archer-red-sheet.png | daa79d0f957dea7355b6ff5c6210e833779bd7ef40c32c1943f03b9aaa12a26d | daa79d0f957dea7355b6ff5c6210e833779bd7ef40c32c1943f03b9aaa12a26d |
| healer-red-sheet.png | 32889de82aeed07f332b1a58ebb20044bb38a5c566ab22c1708d05068a5208c6 | 32889de82aeed07f332b1a58ebb20044bb38a5c566ab22c1708d05068a5208c6 |
| healer-red-walk.png | 34347c0bdd2b932f4999e712d8e557220dec446f93d60a7e2606737bbfebcef0 | 34347c0bdd2b932f4999e712d8e557220dec446f93d60a7e2606737bbfebcef0 |
| healer-red-cast.png | c0a999a0150e2c67f83e559b589c589bccc4ece719d32f2069228a2e76be9c18 | c0a999a0150e2c67f83e559b589c589bccc4ece719d32f2069228a2e76be9c18 |
| swordsman-yellow-sheet.png | 85902914cb921cc7c6eb728eb9c1d34a710ce8e4a66ae8d537e5fcc64ca54e64 | 85902914cb921cc7c6eb728eb9c1d34a710ce8e4a66ae8d537e5fcc64ca54e64 |
| archer-yellow-sheet.png | 104159e53f3ee28903b3b0b91ea31229f101fbe6842a28a0fdd6eaa2e5afcc4f | 104159e53f3ee28903b3b0b91ea31229f101fbe6842a28a0fdd6eaa2e5afcc4f |
| healer-yellow-sheet.png | c822f827bdd90660f4ca0f6eb9f1df58d74c64f8ed27f4adedaf73fc844bc22c | c822f827bdd90660f4ca0f6eb9f1df58d74c64f8ed27f4adedaf73fc844bc22c |
| healer-yellow-walk.png | 69461ac8476965007cf998627eb069f64700db2dc93870a80763e57f99c9f28a | 69461ac8476965007cf998627eb069f64700db2dc93870a80763e57f99c9f28a |
| healer-yellow-cast.png | 04112e05cbeb94d3f885afc61d7605ab8bff85b40d9b9a8a9e82b8778581b3d7 | 04112e05cbeb94d3f885afc61d7605ab8bff85b40d9b9a8a9e82b8778581b3d7 |
| swordsman-black-sheet.png | 593a40da14b136374d55044fd3ba3ac11e621d645be9c75a2a6032741ab24c80 | 360391d34fe7aead9a4cabda73e4007a2eaf44a8bc340e4a73cc923adc6da96e |
| archer-black-sheet.png | 0a2e1efff6d653d32777b99ca01f9018fbf27080f2aff645f0fafde175e8b7ec | 0e4a65e6afc2b3cb0623703403d2bd560100b2fff3775b6a8e52beb6debd44a2 |
| healer-black-sheet.png | c680fde6c1e2dfed9fa80a05b3abb74346acefedc15e52f07299a882b67799dc | c680fde6c1e2dfed9fa80a05b3abb74346acefedc15e52f07299a882b67799dc |
| healer-black-walk.png | 4b75155c0f718233a0865e123b6f81585e80708186e004532fe6266d9cf648b4 | 4b75155c0f718233a0865e123b6f81585e80708186e004532fe6266d9cf648b4 |
| healer-black-cast.png | d49cdb581fc4b79343ff0aa56b90a1a8a01e0f9e372a59e52e7e3dc388e9fd65 | d49cdb581fc4b79343ff0aa56b90a1a8a01e0f9e372a59e52e7e3dc388e9fd65 |
