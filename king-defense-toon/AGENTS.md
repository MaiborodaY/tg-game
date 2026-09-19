# BroTD Infinity release workflow

- Before changing this game, read `AI_DEVELOPMENT.md` and follow its architecture,
  persistence, combat, testing and integration rules. Keep it current when those
  contracts change; distinguish implemented behavior from planned work.
- For artwork, icons and menu mockups, follow its **Visual style and mobile UI**
  section and inspect the current in-game reference assets before generating art.
  Use readable, concise minimalism, existing navigation and shared stat icons.
  If a mockup is requested first, get that design reviewed before runtime edits.

- Regular-unit additions follow `UNIT_INTEGRATION.md`: shared gameplay and
  animation rules, with final verification batched across the requested units.

- For this game, the user's request "commit and push" also authorizes publishing
  the same changes to the Telegram game's existing URL. Do not stop after Git push.
- Until the game moves to its own repository, push approved changes to `main` and
  separately deploy the built game to Cloudflare Pages project `tg-game`, branch
  `bro-infinity`, at `https://bro-infinity.tg-game-23f.pages.dev/`.
- The automatic `main` deployment updates a different site. Do not change the bot
  URL or overwrite that site's root with the standalone game.
- Run relevant local checks, build before committing, commit the source and
  `../public/king-defense-toon` artifacts, then deploy those exact artifacts without
  rebuilding. The profile's embedded version must match the published build.
- Run the Pages command from this directory so unrelated root `functions/` are
  excluded. The command and stable destination are documented in `TELEGRAM.md`.
- Confirm the remote Git SHA and deployment result/alias. The user tests the
  published game personally; do not run a production gameplay/browser check.
- Preserve unrelated work in other games/checkouts. If push or deployment fails,
  report which step completed and which remains unfinished.
