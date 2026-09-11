# Forest Forge

Plain JavaScript, Canvas 2D and HTML/CSS. This folder contains the game, editable
art, set manifests and the existing fitting workshop.

## Launch

- Telegram: https://t.me/reallifesame_bot/broforge
- Browser demo: https://forest-forge.mr-maybik.workers.dev/
- From the repository root: `npm ci`, then `npm --prefix forest-forge start`.
- The local workshop is at http://127.0.0.1:4173/sets.html.

The older `C:/WoL/forest-forge-prototype` folder was left intact because another
asset task was working there during the import. This repository folder is the
source used by automatic publishing; changes to the old folder need to be copied
and reviewed here before pushing.

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

Telegram 8.0+ requests fullscreen at launch. The forest extends beneath Telegram's
native controls; the HUD respects both device and content safe-area insets. Older
or unsupported clients keep the expanded window. Reopen the Mini App after an update.

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

The hero attacks every two seconds. Ordinary enemies have a 20% hammer drop
chance; bosses always pay five times their biome hammer roll. Idle income is one
hammer and one coin per minute, capped at four hours. New heroes have five
hammers and no equipment.

An epoch enters forging automatically only once it has both armor sets and
weapons. Armor for later epochs can already be inspected in the local workshop.
Generation prompts and fitting manifests live under `design/sets`; the balance
sources live in `balance.mjs` and `design/`.
