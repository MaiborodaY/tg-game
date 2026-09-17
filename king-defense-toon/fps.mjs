export function createFrameRateMeter({ updateIntervalMs = 333, windowMs = 1000 } = {}) {
  let timestamps = [], lastPublished = null;

  function reset() {
    timestamps = [];
    lastPublished = null;
  }

  return {
    reset,
    record(timestamp) {
      if (!Number.isFinite(timestamp)) return null;
      const previous = timestamps.at(-1);
      if (previous !== undefined && timestamp < previous) reset();
      else if (timestamp === previous) return null;
      timestamps.push(timestamp);
      // Keep the interval crossing the window edge, including slow frames instead of hiding stalls.
      while (timestamps.length > 2 && timestamps[1] <= timestamp - windowMs) timestamps.shift();
      if (lastPublished === null) { lastPublished = timestamp; return null; }
      if (timestamp - lastPublished < updateIntervalMs) return null;
      lastPublished = timestamp;
      return Math.round((timestamps.length - 1) * 1000 / (timestamp - timestamps[0]));
    },
  };
}
