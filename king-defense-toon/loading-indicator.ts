/** Delay only presentation. The caller must block unsafe actions immediately. */
export function createLoadingIndicator(onElapsed: () => void, delayMs = 180) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let visible = false, destroyed = false;

  function cancelTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  return {
    update(blocked: boolean, immediate = false): boolean {
      if (destroyed) return false;
      if (!blocked) {
        cancelTimer(); visible = false;
      } else if (immediate) {
        cancelTimer(); visible = true;
      } else if (!visible && timer === undefined) {
        timer = setTimeout(() => {
          timer = undefined;
          visible = true;
          onElapsed();
        }, delayMs);
      }
      return visible;
    },
    destroy() { destroyed = true; cancelTimer(); visible = false; },
  };
}
