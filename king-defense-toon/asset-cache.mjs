/** Cache only resources retained by a live scene; concurrent scenes share pending loads. */
export function createAssetCache() {
  const entries = new Map();
  const owners = new Map();
  const retained = key => [...owners.values()].some(keys => keys.has(key));
  function prune() {
    for (const [key, entry] of entries) if (entry.settled && !retained(key)) entries.delete(key);
  }
  return {
    retain(owner, keys) { owners.set(owner, new Set(keys)); prune(); },
    release(owner) { owners.delete(owner); prune(); },
    get(key, load) {
      const existing = entries.get(key);
      if (existing) return existing.promise;
      const entry = { settled: false, promise: null };
      entry.promise = Promise.resolve().then(load).then(value => {
        entry.settled = true;
        prune();
        return value;
      }, error => {
        // A failure must not poison subsequent explicit retries.
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
      entries.set(key, entry);
      return entry.promise;
    },
    get size() { return entries.size; },
  };
}

export function loadImage(url, { ImageClass = globalThis.Image, timeoutMs = 8000, attempts = 2 } = {}) {
  async function attempt() {
    return new Promise((resolve, reject) => {
      const image = new ImageClass();
      const finish = (error) => {
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        if (error) { image.src = ''; reject(error); }
        else resolve(image);
      };
      const timer = setTimeout(() => finish(new Error(`Image loading timed out: ${url}`)), timeoutMs);
      image.onload = () => finish();
      image.onerror = () => finish(new Error(`Could not load image: ${url}`));
      image.src = url;
    });
  }
  return (async () => {
    let error;
    for (let index = 0; index < attempts; index += 1) {
      try { return await attempt(); } catch (failure) { error = failure; }
    }
    throw error;
  })();
}
