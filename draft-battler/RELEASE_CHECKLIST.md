# Draft Battler MVP release checklist

The first public MVP is solo-only. PvP must remain disabled until its authentication,
authoritative draft, reconnect, room lifecycle, and protocol tests are implemented.

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
Pushes to `main` validate and upload a release-candidate artifact, but do not deploy it.

## Release-candidate mobile smoke

Download the `draft-battler-client-<commit>` artifact produced for the candidate commit
and record both its commit SHA and workflow run ID. Run this checklist against that
artifact, not the Vite development server.

1. Open from a cold start on an Android viewport around 360 px wide.
2. Open from a cold start on an iPhone viewport around 390 px wide.
3. Confirm that only the Solo entry point is available.
4. Start Solo and place the first card without external instructions.
5. Verify card drag placement and the tap-select/tap-slot fallback.
6. Verify invalid placement leaves the board unchanged.
7. Start a battle and confirm it always reaches the result controls.
8. Repeat through round 10 or until player HP reaches zero.
9. Confirm the terminal screen reports the full-run result, rounds, and remaining HP.
10. Start another run, then return to the menu and confirm clean state.
11. Open the build with `?draftRendererFail=1`, start a battle, and confirm the static
    fallback still allows progress.
12. Confirm there are no uncaught errors, missing runtime assets, blocked buttons, or horizontal scrolling.

If Telegram WebView is the launch surface, repeat the full run there and verify the header,
safe areas, background/foreground transition, and touch controls.

## Rollback record

Before deployment, record the release commit and the last-known-good Cloudflare deployment.
Manually dispatch `Deploy Draft Battler App Worker` with the exact full candidate commit SHA
and candidate workflow run ID only after the smoke checklist passes. The workflow requires a
successful `main` push run and deploys its immutable artifact instead of rebuilding the client.
After deployment, the workflow verifies the live health and fail-closed PvP room routes.
After rollback, verify `/health`, the home page, one runtime asset, and one complete solo round.
