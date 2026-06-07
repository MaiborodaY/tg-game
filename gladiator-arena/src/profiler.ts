interface ProfilerStep {
  label: string;
  ms: number;
}

interface ProfilerSample {
  label: string;
  startedAt: number;
  steps: ProfilerStep[];
  totalMs?: number;
  raf1Ms?: number;
  raf2Ms?: number;
}

class ArenaProfiler {
  private enabled = false;
  private root?: HTMLElement;
  private toggle?: HTMLButtonElement;
  private output?: HTMLElement;
  private current?: ProfilerSample;
  private last?: ProfilerSample;

  mount(host: HTMLElement): void {
    host.querySelector(".arena-profiler")?.remove();

    const root = document.createElement("section");
    const toggle = document.createElement("button");
    const output = document.createElement("pre");

    root.className = "arena-profiler";
    root.setAttribute("aria-label", "Arena performance profiler");
    toggle.className = "arena-profiler__toggle";
    toggle.type = "button";
    output.className = "arena-profiler__output";

    toggle.addEventListener("click", () => {
      this.enabled = !this.enabled;
      this.current = undefined;
      this.render();
    });

    root.append(toggle, output);
    host.append(root);

    this.root = root;
    this.toggle = toggle;
    this.output = output;
    this.render();
  }

  start(label: string): void {
    if (!this.enabled) {
      return;
    }

    this.current = {
      label,
      startedAt: performance.now(),
      steps: [],
    };
    this.render();
  }

  measure<T>(label: string, callback: () => T): T {
    if (!this.enabled || !this.current) {
      return callback();
    }

    const startedAt = performance.now();

    try {
      return callback();
    } finally {
      this.current.steps.push({ label, ms: performance.now() - startedAt });
    }
  }

  end(label?: string): void {
    if (!this.enabled || !this.current) {
      return;
    }

    const sample = this.current;

    if (label) {
      sample.label = label;
    }

    sample.totalMs = performance.now() - sample.startedAt;
    this.last = sample;
    this.current = undefined;
    this.render();

    const firstFrameStartedAt = performance.now();

    window.requestAnimationFrame(() => {
      sample.raf1Ms = performance.now() - firstFrameStartedAt;
      this.render();

      const secondFrameStartedAt = performance.now();

      window.requestAnimationFrame(() => {
        sample.raf2Ms = performance.now() - secondFrameStartedAt;
        this.render();
      });
    });
  }

  private render(): void {
    if (!this.root || !this.toggle || !this.output) {
      return;
    }

    this.root.classList.toggle("arena-profiler--enabled", this.enabled);
    this.toggle.textContent = this.enabled ? "Profiler ON" : "Profiler OFF";

    if (!this.enabled) {
      this.output.textContent = "Enable, then tap an arena action.";
      return;
    }

    const sample = this.current ?? this.last;

    if (!sample) {
      this.output.textContent = "Waiting for action tap...";
      return;
    }

    const total = formatMs(sample.totalMs);
    const raf1 = formatMs(sample.raf1Ms);
    const raf2 = formatMs(sample.raf2Ms);
    const steps = sample.steps.map((step) => `${step.label.padEnd(24, " ")} ${formatMs(step.ms)}`).join("\n");

    this.output.textContent = [`${sample.label}`, `total ${total} | raf1 ${raf1} | raf2 ${raf2}`, steps].filter(Boolean).join("\n");
  }
}

function formatMs(value: number | undefined): string {
  return typeof value === "number" ? `${value.toFixed(1)}ms` : "-";
}

export const arenaProfiler = new ArenaProfiler();

export function mountArenaProfiler(host: HTMLElement): ArenaProfiler {
  arenaProfiler.mount(host);
  return arenaProfiler;
}
