# Regular-unit integration

Use one shared gameplay path and explicit data for differences between units.

- Register base HP, damage/healing and UI identity in `units.ts`; combat range,
  movement, cooldown, duration and impact fraction belong to `BASE_RULES`.
- Reuse personal-level growth, Forge snapshots, receipt-based recruitment,
  roster restoration, same-type Connect and footprint placement. Missing save
  counters initialize at zero; do not transfer human training to new elves.
- Use the existing melee, projectile or healing action. Projectile damage lands
  once on arrival; changing projectile artwork does not introduce extra hits.
  Support heals living wounded allies/heroes, never dead units or the castle.
- Approved sixteen-pose elf sheets use `authoredUnitFrame`: idle, walk, side and
  down action. Pose 2 is synchronized to the combat impact/release fraction.
  Keep exact manifest rectangles and foot/hand anchors; mirror anchors together
  with western poses. Formation is static and death uses the shared fade.
- Keep portrait and battle models consistent. Generate clothing palette assets
  offline; preserve skin, weapons, mount and alpha. Load only displayed ranks and
  required effects through `getSceneAssetPlan`, with no per-cast image creation.
- Prepare changes and focused regression coverage for the whole requested batch,
  then run one final `brotd:check` and relevant browser scenarios for all changed
  units together. Include existing units, unlock boundaries, save/Connect,
  real action timing, crowded support movement and FPS/speed consistency where
  affected. Rerun only when a failure or further code change requires it.
- User checks Telegram gameplay personally. Follow the release workflow only
  when publication is requested; local validation does not imply publication.
