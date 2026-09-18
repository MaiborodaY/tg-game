# BroTD Infinity: staged preparation for server-backed progression

Branch: `codex/brotd-server-prep`. Started from `main` at `691ab9d`, then updated
to `1312dac` (elven archer / Barracks IV) before completing stage 1.
This work keeps TypeScript, Vite and Canvas 2D. Each stage is reviewed separately.
Purchases and competitive features are planned, so future server endpoints must
validate commands and own valuable balances/results; uploading a client snapshot
to D1 is not sufficient authority.

## Stages

1. **Local save protection — implemented here.** Version the save format, keep
   original migration bytes, enforce one writer, detect external changes, and
   recover safely after storage/lifecycle failures.
2. **Campaign commands — next.** Extract typed campaign state and explicit
   operations from `main.ts`, preserve stable unit IDs, return domain results,
   and test invariants for spending, recruitment, movement, merging and rewards.
   Keep browser/DOM/storage dependencies outside the command layer. This creates
   a useful future API boundary without pretending local commands are trusted.
3. **Combat and visual effects.** Separate damaging projectiles, statuses and
   combat events from decorative effects. Cosmetic limits must not drop damage,
   healing, control effects or rewards. Preserve fixed-step/cross-FPS outcomes.
4. **Profiling and budgets.** Add an opt-in lightweight profiler for simulation,
   rendering and UI, plus entity/effect counters and repeatable stress scenarios.
   Set device budgets from actual Telegram Android/iOS measurements. Introduce
   pooling/spatial indexing/workers only when measurements justify them.

## Stage 1 contract

- `saveSchemaVersion = 1` is independent of campaign wave numbering. Unversioned
  and schema-0 saves migrate through the existing gameplay restorers. A newer
  schema or campaign version blocks play/write/reset until a compatible client
  loads it. Malformed explicit schema versions use corrupt-save recovery.
- Before the first replacement of a legacy save, its exact bytes are saved to
  `brotd-infinity:campaign:v2:backup:before-schema-1`. The backup is retained and
  never replaced automatically. Failure to store it leaves the campaign intact
  and exposes Retry. This is a migration rollback copy, not a rotating backup or
  a player-facing restore UI. Future schema targets need their own backup key.
- The browser holds an exclusive Web Lock named
  `brotd-save:brotd-infinity:campaign:v2` throughout its writable session. A second
  window cannot load into a writable game; it can retry after the owner closes.
  Ordinary visibility/Telegram pauses retain ownership and the in-memory battle.
- Navigation flushes while still owning the lock, then releases it. A cached
  page reacquires ownership and compares stored bytes before resuming or claiming
  offline income. A changed save requires reload, never a stale snapshot write.
- Each campaign write checks the last-read/written bytes. Relevant `storage`
  events, including `clear()`, freeze a conflicting session. Reset confirmations
  cannot bypass changed/unsupported saves, lost ownership, or an unread slot.
- Unexpected failure during gameplay restoration also closes the write gate;
  partial defaults cannot replace the original save. A quota failure keeps the
  pending in-memory progress and allows retry without replaying its reward.

## Boundaries and acceptance

Web Locks require a supported browser and secure context (localhost is supported
for development). If unavailable or denied, the game pauses with a browser-update
message. There is no unsafe localStorage lease fallback. Test target Telegram
clients before publishing this branch.

Only cooperating clients obey the lock. An already-open older build or manual
storage edit can still write; byte checks detect a conflict but localStorage has
no atomic compare-and-swap against those writers. This is neither anti-cheat nor
cross-device coordination. A new repository/origin also has separate localStorage;
the later move must explicitly handle save transfer rather than assume continuity.

Existing unit IDs are reconstructed on reload. Stage 1 tests preserve unit order,
personal levels, position, counts and unique IDs; durable IDs belong to stage 2.
No server, D1 migration, payment handling, or publication is part of this stage.

Validation commands:

```powershell
npm.cmd run brotd:check
# PLAYWRIGHT_MODULE may point to an installed Playwright entry file.
node --experimental-strip-types king-defense-toon/tests/save-protection.browser.mjs
node --experimental-strip-types king-defense-toon/tests/storage-recovery.browser.mjs
```

The browser suites use disposable contexts and close their browser/server in
`finally`. They cover real shared-origin locks/storage events and literal legacy
saves. Persisted pagehide/pageshow checks are synthetic lifecycle tests, not proof
of native BFCache eligibility or physical Telegram/WebView acceptance.

Stage validation after updating to `1312dac`: strict typecheck and production
build passed; 550 Node tests, 12 save-protection browser scenarios, and 9 legacy/recovery browser
scenarios passed. The latter includes a real first-wave victory and checks that
reloading cannot award its first-clear reward twice.
