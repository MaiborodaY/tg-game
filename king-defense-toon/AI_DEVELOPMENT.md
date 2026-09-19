# BroTD Infinity: development rules for AI agents

Read this file before editing the game. `AGENTS.md` is the entry point for future
tasks; it also defines the publication workflow. Read `UNIT_INTEGRATION.md` for
unit work and `BOMBARDIER_INTEGRATION.md` when changing that boss. The staged
architecture and its limitations are documented in `SERVER_PREPARATION.md`.

## Scope and current architecture

- Implement only work the user authorized. An analysis/question is not an order
  to change code. Assess proposals independently; explain concrete problems and
  tradeoffs instead of automatically agreeing. Report unresolved failures.
- Runtime code is strict TypeScript, built with Vite and rendered with Canvas 2D.
  Keep direct `.ts` imports and the existing shared rules. Do not add a game
  engine, framework, workers, pooling or spatial indexes without a demonstrated
  need and an authorized scope. Do not suppress type errors with `any` or ignore
  directives to make a merge pass.
- Verify the checkout, branch, HEAD, working tree and applicable instructions at
  the start. The monorepo has other games and concurrent worktrees. Preserve
  unrelated dirty files; use the task's isolated checkout for integration.
- Before publishing, fetch the current `origin/main` and integrate its commits.
  Resolve behavioral conflicts as well as conflict markers. New unit definitions
  must reach campaign commands, save restoration, footprints, UI, combat,
  renderer, assets and tests. Do not replace a whole file with one merge side
  merely to make conflicts disappear. Never force-push over concurrent work.

## Visual style and mobile UI

- BroTD Infinity uses the compact 2D pixel-art vocabulary of the current Tiny
  Swords units. Inspect actual runtime artwork before drawing a new unit, boss,
  portrait, icon or menu; an attractive fantasy illustration alone is not a match.
  Primary references: `assets/tiny-swords-warrior-blue.png`,
  `assets/web/swordsman-art.png` and `assets/tiny-swords-torch-red.png`.
- Use short, stylized proportions, readable silhouettes, large coherent pixel
  clusters, dark blue/coloured contours and two or three broad flat shades per
  material. Keep cream highlights, muted blue/teal, olive green, burgundy cloth
  and restrained gold consistent with the relevant existing faction/character.
  Avoid realistic anatomy, glossy 3D, soft painted shading, bloom, fine engraving,
  dense stone/skin texture, noise and detailed paintings with a pixel filter.
- For icons, also inspect `assets/hero-talents/talents.webp` and its approved
  direction in `art/hero-talents/PROMPT.md`: simple symbols, subdued backgrounds,
  sparse detail, legible at 44–48 CSS pixels. For dungeon covers, retain more
  composition than an icon but use the same simplified shapes and quiet scenery;
  the character should read first at the actual mobile thumbnail size.
- Dungeon covers use the simpler pixel-art variant of the Goblin Cave menu,
  restored at the user's request on 2026-09-19. The earlier detailed-illustration
  exception is superseded. Use `art/dungeons/game-style-menu-reference.png` and
  `assets/dungeons/goblin-cave-covers.webp` for the Chief, Bombardier and mounted
  King; preserve their identities and the existing menu layout and controls.
- Preserve established character identity, clothing, weapons, mount and palette.
  Use `assets/web/goblin-chief.webp` and `assets/goblin-bombardier/body.webp` for
  those live bosses. A style correction is not permission to redesign a boss or
  alter an approved menu's layout. Keep approved framing/text and adjust only the
  requested visual treatment. Older asset prompts (including 3D/toy experiments)
  and design archives do not override the current runtime references.
- Match the existing parchment/olive interface, carved pixel borders and muted
  teal controls (`assets/tiny-ui/`, `style.css` and a current game screenshot).
  Use compact controls and readable text with usable touch areas. Unit management
  starts with small unit icons and reveals details on tap; keep the battlefield
  prominent. A deliberately full-screen section may cover it, but its buttons
  and typography should still suit a phone rather than a desktop poster.
- Readable, concise minimalism is the user's explicit UI direction. Remove
  repeated titles, explanations, inactive placeholders and excess spacing before
  making text or touch targets smaller. Prefer one shared quantity/action control
  for a selected item when repeating it on every row adds clutter. Keep feedback
  near the action and explain secondary details on demand.
- Put a new feature beside its peers in the existing navigation. Do not add an
  unrelated shortcut to a title/close bar simply because space remains there.
  Preserve the scope of a requested redesign; it does not authorize changing all
  surrounding screens.
- Reuse the Forge's health, attack/healing and attack-speed symbols and existing
  resource icons. Replace redundant words with familiar icons, but retain short
  labels or accessible help where the meaning could be ambiguous. Icon-only
  controls need accessible names; selection and availability cannot rely on
  color alone.
  `stat-icons.ts` shares a heart, sword and sword-with-swing-trails between Forge
  and Kitchen. The clock is reserved for durations, never attack speed.
- For small, bounded menus, aim to show the primary choices and action without
  vertical scrolling at 320 x 568 and common phone sizes. Check the real layout,
  including safe areas and long values; do not claim a generated mockup proves
  fit. Keep readable text and approximately 44px touch targets. If content truly
  needs scrolling, keep the primary action reachable instead of compressing it
  into unusable controls.
- When the user asks for a mockup first, show selection, action feedback, active
  and empty/locked states before runtime changes. Reflect actual mechanics:
  instant actions do not acquire invented wait timers. An approved mockup is a
  visual contract for density, navigation and artwork; do not quietly replace
  illustrated food or other approved art with primitive placeholder shapes.
- New small raster icons use a shared, appropriately sized compressed asset
  (normally WebP). Check appearance at the actual 32-48px display size, record
  dimensions and byte size, and keep large source art out of the runtime bundle.
  Reuse/cache the asset; do not add an icon library or animation loop for it.
- Judge art beside current units and menus at intended display size, not only
  enlarged. Use shared compressed assets/cache for implementation; new source
  art and mockups are not automatically runtime assets. Mark unapproved concepts
  as drafts and keep existing production art until replacement is authorized.

## Campaign commands and identities

- `campaign-state.ts` owns campaign creation, restoration, reset and snapshots.
  `main.ts` coordinates UI, browser lifecycle, storage and the active battle.
  Keep durable gameplay mutations in `campaign-commands.ts` and battle reward
  settlement in `campaign-rewards.ts`; UI callbacks request those operations.
- Commands validate before committing changes. A rejected operation must leave
  the campaign unchanged. Cost and benefit form one operation: recruitment,
  upgrades, Connect, farm upgrades/harvest and talent spending must not partially apply.
- Pass time and randomness explicitly into commands. Domain code must not reach
  into DOM, localStorage or Telegram. Reuse existing price, unlock and balance
  helpers rather than duplicating rules in the UI.
- Use persisted, monotonically allocated unit IDs from `campaign-roster.ts`.
  Never derive identity from array position or renumber on reload, sale or Connect.
  IDs are campaign-local. Respect shared footprint helpers for every two-cell unit;
  use capabilities such as `isHealingUnit`, not special cases for one old unit.
- A running battle owns its initial army/building/hero snapshots. Campaign edits
  apply to the next battle. Temporary Kitchen food is the explicit exception:
  `army-food.ts` applies/withdraws food against the battle's original forged stats,
  preserving injury ratios, deaths and ongoing attack phases. Never recalculate
  an active battle from the campaign's newly upgraded Forge. Preserve first-clear and one-time reward protections;
  re-rendering/retrying must not award gold, captures or XP twice.
- Army details show matching Connect donors from Barracks directly, without
  Army/Barracks source tabs. Select all only selects matching reserve fighters;
  deployed Army fighters cannot be consumed through this card. Confirming
  consumes the whole validated selection once. The separate reserve-recipient
  Connect screen retains its Army/Barracks source tabs.
  The small Barracks Connect button instead selects a donor for an Army target.
- Recruit feedback stays in the existing Market-to-Barracks animation with a
  compact level label; do not repeat it in a toast. Other short notices use the
  battlefield's right water gutter below FPS, clear of Start and the Army controls.
- Human recruitment follows the Elven unlock pattern: Swordsman initially, Archer
  at Swordsman recruitment level 3, Healer at Archer recruitment level 3, and
  Lancer with completed Barracks II. Available types split the random pool equally;
  the existing first-Lancer guarantee still applies. Personal Connect levels do
  not unlock recruitment roles. Legacy training credit and existing fighters stay.
- `mercenaries-ui.ts` owns the Mercenaries menu: one Human/Elven dropdown beside
  the gold balance, compact portrait rows, shared equal odds for unlocked types,
  and a separate upgrade view. Each row shows its recruitment level and an earned /
  required counter toward the next level, without a progress bar. Locked rows
  show prerequisites; capped rows show Max level. Keep help in the header.
  Display the first-Lancer guarantee instead of ordinary odds while it is pending.
  Mercenaries I-IV is the UI name for the existing `barracks.level` progression;
  reserve storage remains Barracks. Costs, timestamps, unlocks and save fields are
  unchanged. Starting/skipping an upgrade still uses campaign commands. Main-menu
  summaries omit price/duration; details show current requirements and running or
  maximum-level states. Extra army capacity permits buying a tile, not a free tile.
- Mount this menu lazily and reuse its portraits, buttons and unchanged row markup.
  Only the existing economy tick updates an open upgrade countdown; no menu RAF,
  interval, animated background, icon library or additional image assets are needed.

## Saves and lifecycle

- `save-storage.ts` and `save-session.ts` own browser storage access, schema checks,
  conflict detection and the exclusive writer lock. Do not bypass their recovery
  gate with direct localStorage writes in gameplay/UI code.
- Current saves use schema 4 and persist `nextUnitId` and `kitchen`. When changing the format,
  define an explicit migration and its compatibility behavior. Keep the original
  bytes before replacement, preserve prior migration backups, reject unsupported
  newer versions, and never overwrite malformed data with a fresh empty campaign.
- Save failures and ownership conflicts must remain visible and recoverable.
  Preserve the pending state where supported; retrying a save must not rerun the
  purchase/reward command. Keep multi-tab, quota, pagehide and return checks.
- The additive `onboardingCompleted` flag belongs to campaign state and snapshots.
  New/reset campaigns start false; saves without it are treated as completed so
  existing players are not forced through onboarding. An unfinished fresh save
  resumes Market / placement / Start guidance from its current roster and supply.
- Supported Web Locks and a secure context are required by the current save
  design. Do not silently introduce a localStorage lock approximation. Physical
  Telegram client compatibility remains separate from desktop browser tests.
- Farm schema 3 migrates manual plots to automatic production (farm version 2).
  Farm levels 1/2/3 unlock carrot/potato/pumpkin, with per-crop bed caps 10/20/30
  and upgrade costs 500/1500 gold. Production is 1 crop per 5/15/30 real minutes.
  Collect all ripe crops into separate uncapped inventory; preserve fractional
  growth below the cap, discard overflow time at a full bed. An upgrade retains
  produce but cannot backfill newly purchased capacity. Newly unlocked crops
  start at upgrade time. Legacy saves start at level 1, keep all inventory and
  carrot progress (at most one ripe carrot at migration); compensate each valid
  old potato/pumpkin planting with one stored vegetable, once. Preserve original
  save bytes before schema migration; older clients must reject schema 3.
- Crops and passive production use timestamps, not animation frames. Preserve
  offline caps, consumed checkpoints and already-paid receipt acknowledgement.
  A changed browser origin requires an explicit save-transfer plan.
- Market income is active from campaign creation: level 1 earns 1 slave/hour.
  Each upgrade adds 1/hour and costs current level × 100 gold. Its additive
  `marketLevel` save field is normalized by `createMarketState`: legacy paid
  markets become level 2, retaining their 2/hour rate, fraction and checkpoint;
  legacy unbuilt markets become level 1 starting at restoration, with no backpay.
  Keep `marketBuilt: true` in snapshots for the old field's compatibility. New
  readers prefer a valid explicit level. Upgrades settle elapsed production at
  the old rate and preserve the fractional output; offline storage stays 4 hours.

## Kitchen and temporary army food

- Schema 4 adds paid food timers and cooking progress. Older saves gain an empty
  level-1 kitchen while retaining farm inventory; original bytes are backed up
  before replacement. Malformed kitchen data must enter recovery, not silently
  erase consumed ingredients or progress. Kitchen reset follows campaign reset.
- `kitchen.ts` owns recipes, progression, duration and bounded food queues;
  `cookCampaignMeals` atomically spends collected farm stock, awards cooking XP
  and activates the entire batch. UI quantity controls never mutate campaign state.
- Each portion costs one crop. Carrot dishes grant +1%; Farm level 2 unlocks potato
  dishes at +2%. The three stats reuse Forge names: Health, Attack / Healing,
  Attack speed. Hero, castle and enemies receive no bonus; healing benefits from
  both attack and speed as in the Forge. Pumpkin recipes are not implemented.
- Level 1 gives 10 minutes per portion; each level adds 30 seconds, never strength.
  Advancing from level L costs 10 × L² additional portions. Persist only the total
  portions, derive level/progress. A batch equals separate cooks: each portion uses
  the level before that cook, then grants one XP. No arbitrary level cap.
- Same-recipe time adds, percentages do not stack. Each stat has at most two
  chronological segments: remaining stronger potato time first, then carrot time.
  Cooking stronger food preserves weaker time; cheap carrots cannot extend +2%.
  Display both the active bonus and queued weaker time. Validate stock, count,
  clock and safe-integer duration/XP bounds before any mutation.
- Food uses absolute real time, including offline absence, independent of battle
  speed. `main.ts` synchronizes both retained campaign and dungeon battles before
  simulation and on refresh/resume. Scene rendering remains read-only. Already
  launched projectiles and ongoing action timings are not rewritten by food.
- Kitchen is a normal Buildings tab next to Farm, in the shared two-row tab list.
  It mounts on first selection and hides the irrelevant gold/slave wallet. Three
  compact recipe selectors share one quantity input and Cook action. Quantity
  starts at 1, supports direct numeric entry and −/+/Max, previews cost/duration,
  and resets after cooking or changing a recipe/ingredient. Active and queued
  food stays in the corresponding stat row even when switching ingredients;
  distinguish recipe strength from an active stronger/weaker bonus.
- The `?` guide explains stats, instant effects, added time, offline expiry and
  the 10 × level² progression. It overlays the Kitchen body, makes its controls
  inert, and restores focus on close; Escape dismisses help before Buildings.
  Empty stock offers a direct Farm link. Cooking feedback uses the existing UI
  refresh cadence; no new interval, animation loop or fake cooking delay.
- Reuse nodes on timer updates to retain focus. Recovery/offline receipt gates
  cover every cooking action and save retry. Closing Buildings returns focus to
  its visible game button. At 320 x 568 and 390 x 700 the normal, active, queued
  and empty states must fit without vertical scrolling and retain 44px controls.
- Six food pictures share `assets/kitchen/dishes.webp`: 288 x 192, 96px per cell,
  17,976 bytes (17.6 KiB), displayed at 44px. Source PNGs stay outside the runtime;
  `scripts/prepare-kitchen-art.mjs` enforces a 20 KiB budget. See `art/kitchen/PROMPT.md`.

## Combat, effects and drawing

- `combat.ts` advances the existing persistent fixed-step simulation. Keep its
  step remainder and ordering. Gameplay must not depend on rendered FPS, cosmetic
  retention or how often the UI refreshes. Test affected outcomes across FPS and
  battle speeds when timing changes.
- `Battle.projectiles` contains objects that can deliver gameplay effects;
  `Battle.effects` contains disposable visual feedback. Use independent IDs.
  Projectile arrival, damage, healing, poison, shield and stun belong to combat,
  never to scene drawing or visual-effect expiry.
- Use `combat-visuals.ts` for cosmetic creation/limits. Zero, saturated or cleared
  cosmetic storage must preserve authoritative state and ordered battle events.
  Observe real damage/healing through events, not visible numbers or flashes.
- Hero XP feedback is one cosmetic label above the castle after successful wave
  reward settlement. It uses the shared visual budget and lifetime, adds no new
  asset or timer, and never grants XP itself. Zero XP creates no label.
- Preserve each unit's actual rules. For example, the current rider glaive hits
  one target, and the Bombardier explosion is visual with no area damage. Artwork
  is not evidence that a new mechanic was approved. Document rule changes.
- `scene.ts` reads gameplay state and renders it; it must not mutate combat.
  Keep shared asset caching, rank-aware loading, authored frame/anchor data and
  disposal. Do not create/load images on each cast or start a loop per actor.
- Preparation includes the upcoming wave's resources. Keep ready resource-plan
  changes synchronous; changing/removing keys alone must not report `loading`.
  `scene.preload` retains one upcoming plan alongside the visible scene, shares
  pending requests, and never changes scene state or reports speculative errors
  as foreground failures. Replace/release that owner instead of retaining the
  whole campaign. Required loads still block combat and expose retryable errors.
- Image loading must not suspend level music. Its gates are application activity,
  save/session safety, level and the player's audio settings. Recovery blocks
  input/combat immediately; only its loading presentation waits 180 ms. Errors
  appear immediately. Keep focus/inert restoration independent of dialog visibility
  and cancel the presentation timer during navigation/destruction.
- Hidden application handling stops the shared frame loop. The opaque Dungeons
  screen is separate from ordinary overlays: `screen-controller.ts` owns screen
  visibility/inert state, and both scenes use `setDrawingEnabled(false)`. The
  internal draw guard covers RAF, resize, font and asset callbacks. Retain scene
  caches, skip hidden HUD/formation rendering, and refresh state before drawing
  on return. `hidden`/`inert` alone do not stop JavaScript work.
- Dungeons browsing keeps the existing battle, rewards, auto-waves and passive
  production running at the existing cadence; battle SFX stay silent behind it.
  Do not stop the shared RAF or create a second campaign to open this screen.
  Ordinary translucent menus retain their existing drawing behavior. Recovery
  and offline receipts remain above Dungeons, preserving focus and inert state.

## Dungeons catalogue and runs

- `dungeons.ts` owns three Goblin Cave levels, unlocked after all ten waves of
  rounds 1-5 / 1-10 / 1-15. Use historical first clears as well as current cleared
  progress so retreat and campaign replay do not relock levels. No new save field
  is needed for browsing. Rewards and Enter are on each card, without a separate
  details page. Closed levels show their unlock requirement and disabled Enter.
- `dungeons-ui.ts` owns catalogue/rules. Cave I awards 150 gold + 3 slaves on
  every completed run, with unlimited daily entries. Cave II/III rewards (300 + 5
  and 500 + 8) remain labelled future rewards for their unimplemented full runs.
- `dungeon-run.ts` owns a separate formation and combat snapshot. Each guard
  group has one goblin, archer, healer and boar, all arriving together. Stats reference
  the campaign just after the level's unlock milestone; campaign balance is unchanged.
  Dungeon combat does not settle campaign wave progress, kill rewards, captures or XP.
  Leaving/reloading discards the run, not the saved army.
  Cave I has three waves: two groups of four guards, three groups, then a solo
  `goblinChief`. Groups arrive at 0.8, 12.8 and (wave 2 only) 24.8 combat seconds.
  Guard HP, damage and healing are 15% above the previous dungeon baseline;
  the chief has 30% more HP/damage than the unlock milestone's boss. Other tiers retain their
  opening-wave previews; their full runs and reward collection remain future work.
  The run owns an explicit preparation/combat/wave-cleared/complete/defeat stage
  and wave index. `finishDungeonWave` records a result once. `prepareNextDungeonWave`
  returns survivors home without starting combat; a separate `startDungeonBattle`
  begins that prepared wave. Reject invalid/double transitions; retain living actor
  instances, HP, hero/castle snapshots and spent
  one-use abilities. Fallen allies are removed from combat, not from the campaign.
  A dead hero stays dead. Reposition survivors and discard old paths/targets and
  enemy/projectile/effect state between waves; never recreate a healed army.
  Exit is hidden and rejected during combat. Between cleared waves a native modal
  confirms loss of progress; before first Start or after run completion/defeat,
  exit is direct. Keep the Start hit target stationary in the pressed CSS state.
- `dungeon-battle` is a screen state, not a second application/RAF. The same two
  scene instances render the cave, local Army formation and Hero menu. City menus,
  recruitment, Connect and cell buying are unavailable here. Moves use the shared
  footprint/swap validator and do not change the main formation. Hero talents still
  use campaign commands; already-running battles keep their original snapshots.
- Main combat and auto-wave countdown pause during the cave screen and resume
  when it closes; catalogue browsing continues them as before. Economy retains its
  existing timestamp lifecycle. Recovery, offline receipts and Telegram suspension
  cover both modes. The cave map has its own cache key shared by both canvases;
  use authored bounds (-56, -445, 502, 890), never stretch it into the lower field.
- Cave I carries HP and casualties between all three waves; healing during combat
  works normally. Run progress and its reward receipt are session-only, like battle
  receipts. `applyDungeonRunReward` in `campaign-rewards.ts` grants canonical full-run
  rewards once, validates both balances before mutation, and leaves other campaign
  state untouched. Main saves immediately after settlement; storage recovery blocks
  result actions until the save succeeds. Retrying a write never re-grants rewards.
  The finished view shows spoils or defeat, plus Dungeons / Run again. Re-entry is
  a fresh run with a new receipt. No daily cap or persistent dungeon progress is added.
- Only a visible cave asset plan requests `map:goblin-cave`; URL imports do not
  eagerly fetch its image. Enemy sheets follow the current wave and shared cache.
- Static WebP cover art uses one three-column atlas, loaded on first browsing;
  the small cave icon is shared with navigation. No animated menu backgrounds,
  separate canvas loop, external image requests or per-refresh image creation.
- The cave soundtrack (`Action 2`, compressed MP3) is selected only inside
  `dungeon-battle`, not in the catalogue. `music.ts` switches the existing single
  streaming player, preserving campaign/cave playback positions and shared mute,
  gain and activity gates. Do not preload the cave track or decode a full WAV.
  Export settings and source provenance are in `assets/audio/AMBIENT.md`.

## Verification and performance

- Cover new behavior and failure paths with meaningful tests; add comments where
  intent, ordering or invariants are not obvious. Do not add tests that merely
  duplicate implementation details. Preserve existing assertions during merges.
- Run focused checks while developing; before release run `npm.cmd run brotd:check`
  (strict types, Node tests and production build) and relevant browser suites.
  Batch related unit changes into one final verification. Repeat only after new
  changes/failures justify it. Deferred checks must be completed before release.
- For persistence/command changes, cover literal legacy saves, stable identities,
  rejected operations, duplicate settlement and reloads. For projectile changes,
  cover zero cosmetics, caster/target death, battle end and read-only rendering.
- Browser tests use disposable contexts, loopback servers with available ports
  and cleanup in `finally`. Never alter a player's real save. Close games,
  browser contexts and test servers afterward; preserve unrelated running servers.
- The optional `?profile=1` panel and isolated `profile.html` lab measure CPU work,
  not GPU completion. Ordinary play does not collect these profile samples.
  Keep bounded samples, explicit scenario metadata and save isolation.
- Use the following command from the repo root for repeatable simulation checks:

  ```powershell
  node --experimental-strip-types king-defense-toon/scripts/profile-combat.mjs --scenario all --seconds 30
  ```

  Add representative new abilities to coverage; label synthetic workloads clearly.
  Desktop timings do not prove Telegram Android/iOS performance. Measure real
  devices and identify a specific bottleneck before adding complex optimizations.

## Server boundary and publication

- This code is currently a local client. Save locks, typed commands, battle
  receipts and diagnostic checksums are not anti-cheat or server authority.
  Future purchases/competitive results require server authentication, validated
  commands, trusted balances/results and durable duplicate-request protection.
  Uploading an arbitrary client snapshot to D1 does not provide that protection.
- Follow `AGENTS.md` and `TELEGRAM.md`: an authorized "commit and push" also
  publishes the exact committed build to the existing `bro-infinity` Pages alias.
  Commit source and `public/king-defense-toon` together after building. Deploy
  from this game directory without rebuilding or including unrelated functions.
- Preserve the existing URL/origin. Verify remote SHA, non-force publication and
  deployment/alias identity. Do not invent Telegram links. User tests production
  gameplay personally; local browser checks do not authorize production play.
- Report the actual commit, checks, publication result and remaining limitations.
  Keep historical measurements/releases labelled by version instead of presenting
  them as evidence for an untested new build.
