import { createAssetCache, loadImage } from '../../asset-cache.ts';
import type { AssetCache, ImageLoadOptions, LoadableImage } from '../../asset-cache.ts';

class TestImage implements LoadableImage {
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly testImage = true;
}

export function verifyAssetCacheContracts(): void {
  const cache: AssetCache<HTMLImageElement> = createAssetCache<HTMLImageElement>();
  const owner = {};
  cache.retain(owner, ['forest']);
  cache.retain(owner, new Set(['forest']));
  const first: Promise<HTMLImageElement> = cache.get('forest', () => loadImage('/forest.png'));
  const second: Promise<HTMLImageElement> = cache.get('forest', () => new Image());
  cache.release(owner);
  const size: number = cache.size;

  const unknownCache = createAssetCache();
  const untyped: Promise<unknown> = unknownCache.get('resource', () => 'image');
  const keyed = createAssetCache<string, number, symbol>();
  keyed.retain(Symbol('scene'), [1]);
  const customKeys: Promise<string> = keyed.get(1, () => Promise.resolve('image'));

  const image: Promise<HTMLImageElement> = loadImage('/forest.png');
  const settingsOnly: Promise<HTMLImageElement> = loadImage('/forest.png', { attempts: 2, timeoutMs: 8000 });
  const explicitDefault: Promise<HTMLImageElement> = loadImage('/forest.png', { ImageClass: undefined });
  const browserConstructor: Promise<HTMLImageElement> = loadImage('/forest.png', { ImageClass: Image });
  const options: ImageLoadOptions<TestImage> = { ImageClass: TestImage, attempts: 1 };
  const fake: Promise<TestImage> = loadImage('/forest.png', options);

  // @ts-expect-error A cache fixes its value type for every key and every caller.
  cache.get('forest', () => 123);
  // @ts-expect-error Re-reading a key cannot invent a different resource type.
  cache.get<number>('forest', () => 123);
  // @ts-expect-error An untyped cache returns unknown, even if this caller offers an image loader.
  const invented: Promise<HTMLImageElement> = unknownCache.get('resource', () => new Image());
  // @ts-expect-error A second reference cannot widen the cache and insert incompatible resources.
  const widened: AssetCache<unknown> = cache;
  // @ts-expect-error Retained keys use the same key type as lookups.
  cache.retain(owner, [1]);
  // @ts-expect-error Default keys are strings.
  cache.get(1, () => new Image());
  // @ts-expect-error The cache size is read-only.
  cache.size = 0;
  // @ts-expect-error The result from a supplied constructor retains its actual instance type.
  const browserFake: Promise<HTMLImageElement> = loadImage('/forest.png', options);
  // @ts-expect-error Omitting a constructor cannot promise a caller-invented image subtype.
  loadImage<TestImage>('/forest.png');
  // @ts-expect-error A constructor must expose writable image loading handlers and a source.
  loadImage('/forest.png', { ImageClass: class {} });
  // @ts-expect-error A supplied constructor must be callable without arguments.
  loadImage('/forest.png', { ImageClass: class extends TestImage { constructor(_required: string) { super(); } } });
  // @ts-expect-error Timer settings are numeric.
  loadImage('/forest.png', { timeoutMs: '8000' });
  // @ts-expect-error Resources are loaded from string URLs.
  loadImage(new URL('https://example.com/forest.png'));
  void [first, second, size, untyped, customKeys, image, settingsOnly, explicitDefault, browserConstructor, fake, invented, widened, browserFake];
}
