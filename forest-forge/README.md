# Forest Forge

Plain JavaScript, Canvas 2D and HTML/CSS. This folder contains the game, editable
art, set manifests and the existing fitting workshop.

## Launch

- Telegram: https://t.me/reallifesame_bot/broforge
- Browser demo: https://forest-forge.mr-maybik.workers.dev/
- From the repository root: `npm ci`, then `npm --prefix forest-forge start`.
- The local workshop is at http://127.0.0.1:4173/sets.html.

The full prototype from `C:/WoL/forest-forge-prototype` has been merged into this
folder, including the later armor epochs, weapons and animated item backgrounds.
This repository folder is the source used by automatic publishing. The original
prototype remains a separate local copy; future changes belong here.

## Build and publish

From the repository root:

```
npm --prefix forest-forge test
npm --prefix forest-forge run test:cloud
npm --prefix forest-forge run build
```

The build reads `design/build-inputs.json`, discovers set atlases and weapon icons,
and writes only runtime files to `dist`. PNG sources remain editable; published
images use lossless WebP with a visible-pixel comparison. No prior QA output or
machine-specific dependency path is needed. Editors and source concepts are not
part of the public bundle.

Pushing relevant changes to `main` triggers `.github/workflows/deploy-forest-forge.yml`:
install, local tests, build, deploy. It uses the existing `CLOUDFLARE_API_TOKEN`
repository secret. The Worker config is `workers/forest-forge/wrangler.jsonc`.
Production gameplay testing is performed by the owner, not by the workflow.

## Telegram saves

The bot owns a named Mini App `broforge`; its main app and existing WoL game are
unchanged. Telegram signs the launch data; the Worker checks it using its
`BOT_TOKEN` secret and the existing Bro Battler authentication implementation.
No WoL registration or character is required.

Mobile Telegram 8.0+ (iOS and Android) requests fullscreen at launch. Desktop and
web clients open in a window, exiting any fullscreen state restored by Telegram.
In fullscreen, the forest extends beneath Telegram's native controls; the HUD
respects both device and content safe-area insets. Older or unsupported clients
keep their current view. Reopen the Mini App after an update.

`GET /api/save` loads the authenticated Telegram player's snapshot, creating a
clean hero if none exists. `PUT /api/save` saves one snapshot with its expected
revision. A stale tab receives 409 and must load the newer save. Invalid or
expired Telegram authentication receives 401. Browser demo localStorage is never
imported into Telegram. Cloud load errors pause startup instead of creating a
replacement hero. Cloud saves are sent at most once per ten seconds during play,
and also when hiding/closing; abrupt termination can lose the last unsent interval.
A network failure pauses play and offers Retry.

D1 database: `forest_forge_saves`, binding `SAVES`, table `player_saves`.
Schema is in `workers/forest-forge/migrations/0001_saves.sql` and is applied via the
Cloudflare account tools before publishing an API that needs it. Do not commit
real bot tokens or local `.dev.vars` files.

This is a PvE client snapshot save, not server validation of combat or economy.
Browser visitors retain their existing local demo progress.

## Current gameplay and art

The route contains ten biomes, twenty levels each, with ten waves per level.
The HUD advances from 1–20 to 2–1. Every biome has its own scenery, melee/ranged
enemies, healer and final ruler; normal level bosses use larger commanders.
Scenery changes only at biome boundaries, behind the existing upper-scene fade.
The original combat balance and saved global level remain in use.

Locally, `/?biome=1` through `/?biome=10` opens a disposable preview; add
`&boss=1` for its final boss. The selector lets you view the entire route without
changing your saved hero. Source art, route and preparation instructions are in
`design/biomes/README.md`. Biome atlases load on demand and ship as lossless WebP.

The hero attacks every two seconds. Ordinary enemies have a 20% hammer drop
chance; bosses always pay five times their biome hammer roll. Idle income is one
hammer and one coin per minute, capped at four hours. New heroes have five
hammers and no equipment.

All ten epochs have their own armor and weapons in the forge pool. There are
130 weapons: ten melee and three ranged in each epoch. Ranged weapons retain
80% damage and the same two-second attack interval. Weapon atlases load on demand;
the handheld deck cannon has stronger recoil, and the chakram keeps its return.

Futuristic through Divine share animated background patterns across the epoch
list, Auto filters and item cards. Only the pattern layer moves; reduced motion
keeps it static. The compact forge dialog and Telegram safe areas are preserved.

Generation prompts, source art and fitting manifests live under `design/sets`
and `design/weapons`. The latest weapon additions are indexed in
`design/weapons/epoch-completion-v1/README.md`. Temporary build copies and logs
stay outside Git. The balance sources live in `balance.mjs` and `design/`.
