export const TINY_LANCER_LAYOUT = Object.freeze({ columns: 6, rows: 6 });

function loopFrame(time, count) {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time : 0) * 10) % count;
}

export function tinyLancerFrame(actor, time = 0) {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 12 + loopFrame(actor.walkTime, 6);
  if (actor?.action !== 'attack') return loopFrame(time, 12);
  const angle = Math.atan2(actor.facingY ?? -1, Math.abs(actor.facingX ?? 0));
  const direction = Math.round(angle / (Math.PI / 4));
  const start = ({ '-2': 30, '-1': 27, 0: 18, 1: 21, 2: 24 })[direction];
  const progress = Math.max(0, Math.min(1, (actor.actionTime ?? 0) / Math.max(.01, actor.actionDuration ?? .6)));
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  // These native strips contain hold, thrust and recovery: thrust starts on the engine's damage tick.
  const pose = progress < impact ? 0 : progress < impact + (1 - impact) * .45 ? 1 : 2;
  return start + pose;
}
