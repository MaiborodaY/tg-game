export function createFramePacer(fps = 30) {
  if (!Number.isFinite(fps) || fps <= 0) throw new RangeError('FPS must be positive');
  const interval = 1000 / fps;
  const epsilon = 0.0001;
  let nextFrame = null, lastRender = null;

  return {
    reset() { nextFrame = lastRender = null; },
    sample(timestamp) {
      if (!Number.isFinite(timestamp)) return null;
      if (lastRender === null || timestamp < lastRender) {
        lastRender = timestamp;
        nextFrame = timestamp + interval;
        return 0;
      }
      if (timestamp + epsilon < nextFrame) return null;
      const elapsed = (timestamp - lastRender) / 1000;
      lastRender = timestamp;
      // Keep the scheduled phase instead of rounding each deadline up to the next RAF.
      // After a stall, render once and skip missed deadlines rather than replaying them.
      nextFrame += (Math.floor((timestamp - nextFrame + epsilon) / interval) + 1) * interval;
      return elapsed;
    },
  };
}
