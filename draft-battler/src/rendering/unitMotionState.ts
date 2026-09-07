export type UnitMotionResult = "completed" | "dead" | "disposed";

/** Owns only locomotion, so cancelling a corpse's movement cannot cancel its death fade. */
export class UnitMotionState {
  private state: "alive" | "dead" | "disposed" = "alive";
  private readonly pending = new Set<(result: UnitMotionResult) => void>();

  isDisposed(): boolean {
    return this.state === "disposed";
  }

  run(start: (complete: () => void) => (() => void)): Promise<UnitMotionResult> {
    if (this.state !== "alive") {
      return Promise.resolve(this.state);
    }

    return new Promise((resolve, reject) => {
      let stop: (() => void) | undefined;
      let settled: UnitMotionResult | undefined;
      const settle = (result: UnitMotionResult) => {
        if (settled) return;
        settled = result;
        this.pending.delete(settle);
        // Settle before stopping: some tween implementations invoke callbacks from stop().
        resolve(result);
        if (result !== "completed") stop?.();
      };
      this.pending.add(settle);
      try {
        stop = start(() => settle("completed"));
        if (settled && settled !== "completed") stop();
      } catch (error) {
        this.pending.delete(settle);
        reject(error);
      }
    });
  }

  die(): void {
    if (this.state !== "alive") return;
    this.state = "dead";
    this.cancelPending("dead");
  }

  dispose(): void {
    this.state = "disposed";
    this.cancelPending("disposed");
  }

  private cancelPending(result: UnitMotionResult): void {
    [...this.pending].forEach((cancel) => cancel(result));
  }
}
