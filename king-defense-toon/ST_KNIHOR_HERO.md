# St. Knihor — first hero

The paladin is a separate defender, not a purchased army slot. He begins beside the formation, follows the army into battle, and uses abilities automatically. When he falls, the battle continues; the 100-HP castle is the defended objective. It cannot attack or receive healing. Both recover before the next wave.

## Starting power and growth

| Stat / ability | Level 1 |
| --- | --- |
| Health | 60 HP |
| Basic attack | 4 damage, 1.2-second base interval |
| Healing | 2 HP every 8 seconds, wounded hero or ally within 95 |
| Protective aura | 2% damage reduction within 80, including the hero |
| Holy hammer | 4 damage every 12 seconds, range 150, prioritizes ranged enemies |

The shared combat pace still applies. Skills serialize their short casts; their cooldowns are independent. There is no baseline stun or area damage. The hero follows the frontline instead of racing ahead of melee allies.

Each level adds 5% of level-one HP, basic damage, healing and hammer damage. This is linear: level 20 has 117 HP and 7.8 basic damage before talents. Level-one swordsmen have 60 HP and 6 attack. The hero's additional strength comes primarily from support talents, not gold purchases.

## Experience and talents

Level cap: 20. Each level from 2 gives one point: 19 points total. Total XP for level L is `50 × (L − 1)²`. XP is awarded once when a wave finishes, according to the whole army's result; hero last hits are not required.

For wave W, base XP is `10 + 0.5 × W`. A first victory gives base XP multiplied by `1 + 0.5 × killed fraction`. Repeated victories give 25% of that amount. A defeat gives `base XP × 25% × killed fraction`, or zero without kills. All nonzero rewards are then multiplied by **0.85** before rounding to whole XP, with at least one for a nonzero contribution. This reduces future XP gain by 15%; saved XP, level thresholds and learned talents stay unchanged. With every enemy killed in consecutive first victories, level 20 is now reached on global wave **219**, previously 200. This is a deterministic pacing estimate, not a real-time playtest.

Three branches each contain three three-rank talents and one final talent:

| Branch | Regular talents | Level-20 choice |
| --- | --- | --- |
| Light | +30% healing per rank; excess-heal shield up to 2/4/6 scaled HP for 6s; second target for 25/50/75% | Miracle: once per wave, an ally below 30% HP triggers a nearby 15%-max-HP heal |
| Protection | +3 percentage points aura reduction per rank; +10 aura radius per rank; hero-only low-health protection of 20/30/40% | Bastion: extra 12 percentage points aura protection for 3s, every 18s, including the start of battle |
| Judgement | +25% hammer damage per rank; hammer cooldown 11/10/9s; 25/50/75% splash within 40 | Heavenly Hammer: 0.8s stun on hammer hits, including splash |

Regular rows unlock at levels 2/5/10 and require one rank in the preceding node. A final talent requires level 20 and six points in its branch. Only one final talent can be chosen. Combined damage reduction is capped at 40%; shields expire and refresh rather than stacking without limit.

The portrait beside Buildings opens the compact talent tree. Talent changes during a battle apply to the next wave; the active battle owns an immutable stat snapshot. A free reset is available between waves. No gold is spent on hero progression.

## Persistence and verification

The existing campaign save gains a sanitized `hero` field containing XP, highest completed wave and talent ranks. Old saves receive a level-one hero without resetting army, reserves, gold, buildings, or campaign progression. Combat positions, health, cooldowns and effects are transient and never saved.

The runtime art adds 410.65 KiB across five WebP files. There are no new particle systems or additional permanent skill buttons. The previous king atlas is no longer loaded by the scene.

```powershell
node --experimental-strip-types --test king-defense-toon/tests/hero.test.mjs king-defense-toon/tests/hero-combat.test.mjs
$env:PLAYWRIGHT_MODULE = 'C:\Users\mrmay\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
node king-defense-toon/tests/hero.browser.mjs
```

The tests cover XP limits and repeat rewards, talent prerequisites and budgets, save normalization, skill impact validation, death/revival, objective immunity to healing, finite effects, ×3 update steps, mobile layout, save/reload, and next-wave talent snapshots. Browser checks use isolated saves. They do not establish frame-rate performance on a physical phone or replace a full campaign balance playtest.

Introducing the hero changed the opening's army thresholds. A narrow correction gives the leading goblin 14 rather than 13 damage on waves 21–28, removing the observed post-chief dip for the fixed eight-fighter/two-healer scenario. Enemy HP, counts, rewards and arrival times are unchanged. Tests also check zero- and one-healer formations across the boundary. These scenarios hold the hero at level one with no talents to isolate his baseline contribution. The existing difficulty jump from wave 18 to 19 predates the hero and remains a known balance limitation; later talent builds need player testing.
