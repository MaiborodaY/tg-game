# Pet minigames

Farm Paws, Snake and Tetris share `/api/farm-paws/start` and
`/api/farm-paws/finish` and the bot's daily attempt limit.

## Fair retry package (2026-10-28)

- Snake enters the board after a confirmed start, then waits for a direction key,
  button or swipe. There is no automatic movement before the first input.
- An uncertain start keeps its `requestId` UUID in memory for that game. A retry
  sends the same ID so the server can return the same run without consuming another
  daily attempt. A confirmed response clears the pending UUID.
- A successful finish may return `refunded: true` and `dailyStarts`. All three result
  screens show the translated returned-attempt message and update the counter.
  The backend allows one zero-score refund per UTC start day, with no XP, items,
  achievement/quest progress or rating entry. Later zero scores use ordinary rules.
- This requires the matching bot package. Its storage is the existing
  `farm_paws_runs` table; there are no new fields or migrations. Old completed runs
  are unchanged. Training and nonzero-score refunds are outside this package.

Focused checks from the repository root:

```sh
node --experimental-strip-types --test farm-paws/tests/api.test.mjs farm-paws/tests/snakeState.test.mjs
node node_modules/typescript/bin/tsc --noEmit --project farm-paws/tsconfig.json
node node_modules/vite/bin/vite.js build farm-paws --base=./ --outDir ../public/farm-paws --emptyOutDir
```

API tests keep their Vite cache under the checkout's `.tmp/`, allowing isolated
worktrees to share installed dependencies without rewriting another checkout's cache.
Local headless Chrome verified waiting, a safe left start, swipe start, refund text
and the refreshed counter. This does not establish native Telegram phone behavior.
