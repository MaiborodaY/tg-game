export interface FramePacer {
  reset(): void;
  sample(timestamp: number): number | null;
}

interface FrameClock {
  nextFrame: number;
  lastRender: number;
}

export function createFramePacer(fps: number = 30): FramePacer {
  if (!Number.isFinite(fps) || fps <= 0) throw new RangeError('FPS must be positive');
  const interval = 1000 / fps;
  const epsilon = 0.0001;
  // Both timestamps are initialized and reset together; partial clock states cannot occur.
  let clock: FrameClock | null = null;

  return {
    reset() { clock = null; },
    sample(timestamp) {
      if (!Number.isFinite(timestamp)) return null;
      if (clock === null || timestamp < clock.lastRender) {
        clock = { lastRender: timestamp, nextFrame: timestamp + interval };
        return 0;
      }
      if (timestamp + epsilon < clock.nextFrame) return null;
      const elapsed = (timestamp - clock.lastRender) / 1000;
      clock.lastRender = timestamp;
      // Keep the scheduled phase instead of rounding each deadline up to the next RAF.
      // After a stall, render once and skip missed deadlines rather than replaying them.
      clock.nextFrame += (Math.floor((timestamp - clock.nextFrame + epsilon) / interval) + 1) * interval;
      return elapsed;
    },
  };
}
