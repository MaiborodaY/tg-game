export type LazyRuntimeController<Runtime, Context, Mounted> = Readonly<{
  preload(): Promise<Runtime>;
  ensureMounted(context: Context): Promise<Mounted>;
  getMounted(): Mounted | null;
  clearMounted(): Mounted | null;
}>;

export function createLazyRuntimeController<Runtime, Context, Mounted>(
  importRuntime: () => Promise<Runtime>,
  mountRuntime: (runtime: Runtime, context: Context) => Mounted,
): LazyRuntimeController<Runtime, Context, Mounted> {
  let runtimePromise: Promise<Runtime> | null = null;
  let mountPromise: Promise<Mounted> | null = null;
  let mounted: Mounted | null = null;

  function preload(): Promise<Runtime> {
    if (runtimePromise) return runtimePromise;
    const guarded = importRuntime().catch((error: unknown) => {
      if (runtimePromise === guarded) runtimePromise = null;
      throw error;
    });
    runtimePromise = guarded;
    return guarded;
  }

  function ensureMounted(context: Context): Promise<Mounted> {
    if (mounted) return Promise.resolve(mounted);
    if (mountPromise) return mountPromise;

    const guarded = preload()
      .then((runtime) => {
        if (!mounted) mounted = mountRuntime(runtime, context);
        return mounted;
      })
      .finally(() => {
        if (mountPromise === guarded) mountPromise = null;
      });
    mountPromise = guarded;
    return guarded;
  }

  function clearMounted(): Mounted | null {
    const previous = mounted;
    mounted = null;
    return previous;
  }

  return Object.freeze({
    preload,
    ensureMounted,
    getMounted: () => mounted,
    clearMounted,
  });
}
