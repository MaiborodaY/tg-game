# BroBattler MVP release checklist

The public MVP includes Solo and invite-code PvP. PvP uses server-authoritative drafting,
private player snapshots, reconnect grace, room expiry, and strict protocol validation.

## Automated gate

- `npm run draft-battler:test`
- `npm run draft-battler:pvp:test`
- `npm run draft-battler:lint`
- `npm run draft-battler:typecheck`
- `npm run draft-battler:pvp:typecheck`
- `npm run draft-battler:audit-assets`
- `npm run draft-battler:build`
- `git diff --check`

The build command must finish with the `Verified Draft Battler build` message.
The current workflow builds and deploys every matching push to `main`. Run the full gate above
before pushing; GitHub repeats the frontend typecheck/build and PvP Worker typecheck before deploy.

## Mobile and Telegram smoke

### Strong-bot weekly ranking rollout

- The schema is owned by World of Life: `migrations/0266_create_brobattler_solo_runs.sql`
  on branch `codex/brobattler-strong-bot-ranking`. Apply only this reviewed migration
  to the existing `wol` D1 database before deploying this Worker/client; do not apply
  unrelated pending migrations. Existing PvP data and rewards are untouched.
- The existing `WOL_DB`, `BOT_TOKEN`, origin allowlist and PvP release flag also serve
  `POST /api/solo/start`, `/api/solo/finish`, and `/api/solo/leaderboard`.
- New strong-bot runs started in Telegram with a WoL profile receive a server seed.
  Finish submits at most 15 draft choices (24 KiB request cap), not claimed HP or wins.
  The Worker reuses snapshot validation and deterministic strong-bot combat to settle
  one result. Weekly sorting and UTC boundaries match PvP; the two tables never mix.
- Only newly registered runs count. Standard bots, daily challenges, history/same-layout
  replays and browser practice do not. A failed ranked start offers explicit unranked practice.
- Finishes are queued in local storage and retried on reopen, connection recovery,
  ranking open, or manual retry. The week is assigned on first server acceptance,
  so an offline finish delivered after Monday belongs to the new week. Clearing app
  storage before delivery loses the unsent result. Incompatible ruleset updates reject
  unsettled old runs; bump the shared solo ruleset on any incompatible gameplay change.
- Replay validation checks legal play, not human play: it does not prevent automation
  or searching over the disclosed seed. No economy rewards are granted by this ranking.
- Manually verify a new strong-bot finish, a duplicate/reloaded finish, both leaderboard
  tabs, and an offline/reconnected delivery. Browser checks are intentionally user-run.

### Existing game smoke

Record the commit SHA, then run this checklist locally before push and repeat the critical path
against the deployed URL after the automatic deployment.

1. Open from a cold start on an Android viewport around 360 px wide.
2. Open from a cold start on an iPhone viewport around 390 px wide.
3. Confirm that both Solo and Online entry points are available.
4. Start Solo and place the first card without external instructions.
5. Verify card drag placement and the tap-select/tap-slot fallback.
6. Verify invalid placement leaves the board unchanged.
7. Start a battle and confirm it always reaches the result controls.
8. Repeat through round 15 or until either keep reaches zero HP.
9. Confirm the terminal screen reports the duel result, rounds, and both remaining HP values.
10. Start another run, then return to the menu and confirm clean state.
11. Open the build with `?draftRendererFail=1`, start a battle, and confirm the static
    fallback still allows progress.
12. Confirm there are no uncaught errors, missing runtime assets, blocked buttons, or horizontal scrolling.

13. Launch the deployed URL from the configured Telegram bot entry point.
14. Verify Telegram safe areas and stable viewport in portrait mode.
15. Open a card/modal and confirm Telegram Back closes the top layer first.
16. During an unfinished run, confirm Telegram Back offers to abandon the run and closing the
    Mini App asks for confirmation. On the main menu, neither warning should appear.
17. Verify background/foreground transition and touch controls in the Telegram WebView.

18. Open Online in two isolated browser or Telegram sessions.
19. Create a room, join by code, and confirm each player sees only their own draft offers.
20. Confirm both players must lock before battle and both must continue before the next round.
21. Disconnect one session, reconnect within the grace period, and confirm the same seat and state return.
22. Finish or forfeit a match, then confirm rematch requires both players.

## Rollback record

Before push, record the release commit and the last-known-good Cloudflare deployment.
If the automatic deployment is bad, revert the release commit (or restore the last-known-good
source), rerun the gate, and push the rollback commit to `main`.
After rollback, verify `/health`, the home page, one runtime asset, and one complete solo round.
