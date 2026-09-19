export interface AssetCache<Value = unknown, Key = string, Owner = object> {
  retain(owner: Owner, keys: Iterable<Key>): void;
  release(owner: Owner): void;
  get: (key: Key, load: () => Value | PromiseLike<Value>) => Promise<Value>;
  peek(key: Key): { value: Value } | undefined;
  readonly size: number;
}

interface CacheEntry<Value> {
  settled: boolean;
  promise: Promise<Value>;
  ready?: { value: Value };
}

/** Cache only resources retained by a live scene; concurrent scenes share pending loads. */
export function createAssetCache<Value = unknown, Key = string, Owner = object>(): AssetCache<Value, Key, Owner> {
  const entries = new Map<Key, CacheEntry<Value>>();
  const owners = new Map<Owner, Set<Key>>();
  const retained = (key: Key) => [...owners.values()].some(keys => keys.has(key));
  function prune(): void {
    for (const [key, entry] of entries) if (entry.settled && !retained(key)) entries.delete(key);
  }
  return {
    retain(owner, keys) { owners.set(owner, new Set(keys)); prune(); },
    release(owner) { owners.delete(owner); prune(); },
    peek(key) { return entries.get(key)?.ready; },
    get(key, load) {
      const existing = entries.get(key);
      if (existing) return existing.promise;
      const entry: CacheEntry<Value> = {
        settled: false,
        promise: Promise.resolve().then(load).then(value => {
          entry.settled = true;
          entry.ready = { value };
          prune();
          return value;
        }, error => {
          // A failure must not poison subsequent explicit retries.
          if (entries.get(key) === entry) entries.delete(key);
          throw error;
        }),
      };
      entries.set(key, entry);
      return entry.promise;
    },
    get size() { return entries.size; },
  };
}

/** Only the image properties used by loading; test doubles can implement this small surface. */
export type LoadableImage = Pick<HTMLImageElement, 'src' | 'onload' | 'onerror'>;

export interface ImageLoadSettings {
  timeoutMs?: number;
  attempts?: number;
}

export interface ImageLoadOptions<ImageType extends LoadableImage> extends ImageLoadSettings {
  ImageClass: new () => ImageType;
}

export function loadImage<ImageType extends LoadableImage>(url: string, options: ImageLoadOptions<ImageType>): Promise<ImageType>;
export function loadImage(url: string, options?: ImageLoadSettings & { ImageClass?: undefined }): Promise<HTMLImageElement>;
export function loadImage(url: string, { ImageClass = globalThis.Image, timeoutMs = 8000, attempts = 2 }:
  ImageLoadSettings & { ImageClass?: new () => LoadableImage } = {}): Promise<LoadableImage> {
  async function attempt(): Promise<LoadableImage> {
    return new Promise((resolve, reject) => {
      const image = new ImageClass();
      const finish = (error?: Error) => {
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
    let error: unknown;
    for (let index = 0; index < attempts; index += 1) {
      try { return await attempt(); } catch (failure) { error = failure; }
    }
    throw error;
  })();
}
