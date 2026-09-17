# Native Tiny Swords Lancer

Source pack: Pixel Frog, `C:/Unity/Unity Projects/Bro TD/Assets/Sprites/Tiny Swords/Units/<Color> Units/Lancer/`.
Original assets are never modified. Four palettes cover personal levels 1–25, 26–50, 51–75, 76–100.

The runtime atlas contains 12 Idle, 6 Run, then three frames each of Right, DownRight, Down, UpRight and Up Attack. Defence frames are not shipped. Left angles mirror the matching right angle. Each native 320px frame is tightly cropped without resizing and placed into a 168×160 cell in a 6×6 atlas (1008×960px). Crops retain every visible pixel. The last three cells are empty.

The build verifies matching silhouettes and ground-shadow anchors across all palettes and compares every visible RGBA pixel after lossless WebP encoding. Ground origins follow the native shadow centre/bottom, preventing the body's differing directional padding from moving its feet. The body height is 68 native pixels rendered at 46 game pixels. Battle views retain the whole spear. Menu portraits and the static formation idle crop at native y=124 so the tall upright tip does not cross another row or force the body to half size; they retain the helmet, body, lower shaft and shadow.

Recreate: `node king-defense-toon/scripts/prepare-lancer-art.mjs`.

| Palette | Atlas bytes | Portrait bytes | Atlas SHA-256 | Portrait SHA-256 |
| --- | ---: | ---: | --- | --- |
| Blue | 19002 | 682 | d23b0dee62fff5cd94a0542086a960766777e5ba03d0166b36ceeb5860355b5e | 1906fc422e89d00bc2ccd4fc4528cb93f7449d0ede8699d494f3d4939e6ebcd8 |
| Purple | 19002 | 684 | 213d1cfea62e845063352683fa4f937626b9d7d0b3331b0b4d1e4a50509d4a85 | efffcd052b2052fa8472974224a4373425acca1000932db201c75b9b30554ca3 |
| Red | 19002 | 678 | 67f74a067d676194497f35ec32efb201636ba3c4cd92db751b1cdfe248c42b49 | 0fa748b084a143fedca475a9db30d5b073ae2719d341a388fdb0dd8ff7e09ba2 |
| Yellow | 19000 | 682 | f296b00025446ca02391f5213eda016565a82070d55a531e9bd13a9fe6cc0dbf | 005cbc3e6d20db866e257786429462adb0e3f7992e15732c7fadf55ee23d80d1 |

Total runtime art: **78732 bytes**.

| Source | PNG bytes | SHA-256 |
| --- | ---: | --- |
| Blue/Lancer_Idle.png | 13286 | f873fb90f3d1d83cb970fda0c141125ae30dd49742240f578907f739dd951739 |
| Blue/Lancer_Run.png | 11232 | 3ac7f617f06499e55d456c1943f2727e1c39e24a4121b4f66f4510988d450a41 |
| Blue/Lancer_Right_Attack.png | 4798 | b19bd5c1fcfbd89e033ebca9acf8d27d1f2e06f20e8365c95faf52787f5f2dda |
| Blue/Lancer_DownRight_Attack.png | 6729 | ce18ae6d641082ada1db14e1d67bdeee24f35300fb97ac27ece6aa6c19a857ca |
| Blue/Lancer_Down_Attack.png | 6091 | b5353565d1dbf65d1d10a1225fa3f78ab4c7201ab04bf5b2cdf19b217a86001b |
| Blue/Lancer_UpRight_Attack.png | 5941 | fbc1bdb4724703cfd7deb4bee24d9637e40f15e8be6c4bdaa435972c8a504f7f |
| Blue/Lancer_Up_Attack.png | 5219 | 2f6d3e10a5e629d897aabc0954440a9848aed08b64f16aa1a80d42ee16df6f07 |
| Purple/Lancer_Idle.png | 13247 | be7b35fe6d5482bdc9e91474f935acf813957f074cda68147e7ead7910d7be97 |
| Purple/Lancer_Run.png | 11182 | f5b9ebefc63837adab772d011ccad538d20033984709ec3894b738699811862a |
| Purple/Lancer_Right_Attack.png | 4780 | c04b80e99c089c4fcb8476e7db950a7e377d91e3213fc438f32f2103c83d9d46 |
| Purple/Lancer_DownRight_Attack.png | 6735 | 90675f106c1f0e04dcfe40f286a29c9009b1ae05e6ca3e1ea201ce18eff8e111 |
| Purple/Lancer_Down_Attack.png | 6053 | 1155402b75613ddc63642079b0266b1313630b48e754ac5bd7eeb20449d6237f |
| Purple/Lancer_UpRight_Attack.png | 5919 | d5b94b5dce04bf5e4a3c2f3a8405584b6788df954e3863d0b96cc7c6ba31f43b |
| Purple/Lancer_Up_Attack.png | 5194 | 3b90475979cd5680f91763c4e507a5124ce78cc3562684023f849667b9fec8ba |
| Red/Lancer_Idle.png | 13271 | 876c0677400b5a25dd583a2fd2b6d88e7c1b0e33c777999152c2b50f10189e26 |
| Red/Lancer_Run.png | 11187 | 029655f919593197bb3f4ab1c541cb2809614f86350dc47bfbc58abdade99655 |
| Red/Lancer_Right_Attack.png | 4759 | e85228865ea3031249e2679ed146761e4f9f55531204ea7707b61d760de04deb |
| Red/Lancer_DownRight_Attack.png | 6729 | 6dfdef30459f86ac2b79e5b489fa5f40e54006735933c8755ab17a12a4345021 |
| Red/Lancer_Down_Attack.png | 6124 | e817cba7ef8871da0e5147728b172e8353d3b9526a2d7d82b78d7fc6c1b302e0 |
| Red/Lancer_UpRight_Attack.png | 5916 | cc97736c716f5e796c50cc133d3f3c06e1f3fdaa0f3a778cffa992ac962c7250 |
| Red/Lancer_Up_Attack.png | 5185 | 6a0d5e086ea2218fcc53c86874b2d54e7465feef6f0f976a0377ba0b5954efa4 |
| Yellow/Lancer_Idle.png | 13325 | 2e393388a6c9f7b5ed30f5e5be7e65a89c5950cc7494a14c39157d567099367a |
| Yellow/Lancer_Run.png | 11241 | 0d2812a189bf059003e520686b7ba57371bf9be844fcc3ab24c6a4a9e27b9247 |
| Yellow/Lancer_Right_Attack.png | 4804 | 3df553f94884cf03844bf70ddfc91999850c12ba6785e2ae5753ee31b0ad4f81 |
| Yellow/Lancer_DownRight_Attack.png | 6800 | d3cc5c23a91e811f91e037003c9526c3738ac30217cf90590956d5b3bddf0c78 |
| Yellow/Lancer_Down_Attack.png | 6116 | c11ad4325c3ec3e1bc96c7b1fe8af070c1fb4939e5c796798fdccff231b31e8a |
| Yellow/Lancer_UpRight_Attack.png | 5906 | 95b1259e47cccd388f79bf34b176366a27e851af5e4cfc95c18fa5b0d2620bb4 |
| Yellow/Lancer_Up_Attack.png | 5173 | ad73e4a9563c409db72d4a022ec8f3040fc0e3097befd073b62616ca5873cbc6 |
