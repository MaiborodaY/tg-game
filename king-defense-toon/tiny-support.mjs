export const TINY_ARCHER_LAYOUT = Object.freeze({ columns: 8, rows: 7 });

function loopFrame(time, count = 6) {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time : 0) * 10) % count;
}

function actionProgress(actor) {
  return Math.max(0, Math.min(1, (actor.actionTime ?? 0) / Math.max(.01, actor.actionDuration ?? .8)));
}

export function tinyArcherFrame(actor, time = 0) {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 8 + loopFrame(actor.walkTime);
  if (actor?.action !== 'shoot') return loopFrame(time);
  // Each firing angle occupies a full row; idle/run have two empty cells at the right.
  const angle = Math.atan2(actor.facingY ?? -1, Math.abs(actor.facingX ?? 0));
  const row = 4 + Math.round(angle / (Math.PI / 4));
  const progress = actionProgress(actor);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  const pose = progress < impact
    ? Math.min(5, Math.floor(progress / impact * 6))
    : 6 + Math.min(1, Math.floor((progress - impact) / (1 - impact) * 2));
  return row * 8 + pose;
}

export function tinyMonkIdleFrame(actor, time = 0) {
  return actor?.action === 'dead' ? 0 : loopFrame(time);
}

export function tinyMonkRunFrame(actor) {
  return loopFrame(actor?.walkTime, 4);
}

export function tinyMonkHealFrame(actor) {
  const progress = actionProgress(actor);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  // Frame 5 is the fully raised blessing. Recovery keeps the authored particles and closing pose.
  return progress < impact ? Math.min(4, Math.floor(progress / impact * 5))
    : 5 + Math.min(5, Math.floor((progress - impact) / (1 - impact) * 6));
}
