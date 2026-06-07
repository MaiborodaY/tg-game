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

interface ProfilerStat {
  count: number;
  totalMs: number;
  maxMs: number;
}

interface ProfilerTotals {
  sampleCount: number;
  totalMs: number;
  maxTotalMs: number;
  lastLabel?: string;
  raf1: ProfilerStat;
  raf2: ProfilerStat;
  steps: Map<string, ProfilerStat>;
}

class ArenaProfiler {
  private enabled = false;
  private root?: HTMLElement;
  private toggle?: HTMLButtonElement;
  private reset?: HTMLButtonElement;
  private output?: HTMLElement;
  private current?: ProfilerSample;
  private totals: ProfilerTotals = createProfilerTotals();

  mount(host: HTMLElement): void {
    host.querySelector(".arena-profiler")?.remove();

    const root = document.createElement("section");
    const actions = document.createElement("div");
    const toggle = document.createElement("button");
    const reset = document.createElement("button");
    const output = document.createElement("pre");

    root.className = "arena-profiler";
    root.setAttribute("aria-label", "Arena performance profiler");
    actions.className = "arena-profiler__actions";
    toggle.className = "arena-profiler__toggle";
    toggle.type = "button";
    reset.className = "arena-profiler__reset";
    reset.type = "button";
    reset.textContent = "Reset";
    output.className = "arena-profiler__output";

    toggle.addEventListener("click", () => {
      this.enabled = !this.enabled;
      this.current = undefined;

      if (this.enabled) {
        this.resetTotals();
      }

      this.render();
    });

    reset.addEventListener("click", () => {
      this.resetTotals();
      this.render();
    });

    actions.append(toggle, reset);
    root.append(actions, output);
    host.append(root);

    this.root = root;
    this.toggle = toggle;
    this.reset = reset;
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
    this.current = undefined;
    this.recordSample(sample);
    const totals = this.totals;
    this.render();

    const firstFrameStartedAt = performance.now();

    window.requestAnimationFrame(() => {
      sample.raf1Ms = performance.now() - firstFrameStartedAt;
      addStat(totals.raf1, sample.raf1Ms);
      this.render();

      const secondFrameStartedAt = performance.now();

      window.requestAnimationFrame(() => {
        sample.raf2Ms = performance.now() - secondFrameStartedAt;
        addStat(totals.raf2, sample.raf2Ms);
        this.render();
      });
    });
  }

  private resetTotals(): void {
    this.totals = createProfilerTotals();
  }

  private recordSample(sample: ProfilerSample): void {
    const totalMs = sample.totalMs ?? 0;

    this.totals.sampleCount += 1;
    this.totals.totalMs += totalMs;
    this.totals.maxTotalMs = Math.max(this.totals.maxTotalMs, totalMs);
    this.totals.lastLabel = sample.label;

    sample.steps.forEach((step) => {
      const stat = getStepStat(this.totals.steps, step.label);

      addStat(stat, step.ms);
    });
  }

  private render(): void {
    if (!this.root || !this.toggle || !this.reset || !this.output) {
      return;
    }

    this.root.classList.toggle("arena-profiler--enabled", this.enabled);
    this.toggle.textContent = this.enabled ? "Profiler ON" : "Profiler OFF";
    this.reset.hidden = !this.enabled;

    if (!this.enabled) {
      this.output.textContent = "Enable, then tap an arena action.";
      return;
    }

    if (this.totals.sampleCount <= 0) {
      this.output.textContent = this.current ? `Measuring ${this.current.label}...` : "Waiting for action tap...";
      return;
    }

    this.output.textContent = formatTotals(this.totals);
  }
}

function createProfilerTotals(): ProfilerTotals {
  return {
    sampleCount: 0,
    totalMs: 0,
    maxTotalMs: 0,
    raf1: createStat(),
    raf2: createStat(),
    steps: new Map(),
  };
}

function createStat(): ProfilerStat {
  return {
    count: 0,
    totalMs: 0,
    maxMs: 0,
  };
}

function getStepStat(steps: Map<string, ProfilerStat>, label: string): ProfilerStat {
  const existing = steps.get(label);

  if (existing) {
    return existing;
  }

  const created = createStat();

  steps.set(label, created);

  return created;
}

function addStat(stat: ProfilerStat, ms: number): void {
  stat.count += 1;
  stat.totalMs += ms;
  stat.maxMs = Math.max(stat.maxMs, ms);
}

function formatTotals(totals: ProfilerTotals): string {
  const totalAvg = totals.sampleCount > 0 ? totals.totalMs / totals.sampleCount : 0;
  const topSteps = [...totals.steps.entries()]
    .sort(([, left], [, right]) => right.totalMs - left.totalMs)
    .slice(0, 14)
    .map(([label, stat]) => formatStep(label, stat))
    .join("\n");

  return [
    `TOTAL samples=${totals.sampleCount} last=${totals.lastLabel ?? "-"}`,
    `all avg=${formatMs(totalAvg)} max=${formatMs(totals.maxTotalMs)} sum=${formatMs(totals.totalMs)}`,
    `raf1 ${formatStat(totals.raf1)} | raf2 ${formatStat(totals.raf2)}`,
    "",
    "top steps by sum",
    topSteps || "-",
  ].join("\n");
}

function formatStep(label: string, stat: ProfilerStat): string {
  return `${label.padEnd(24, " ")} ${formatStat(stat)}`;
}

function formatStat(stat: ProfilerStat): string {
  if (stat.count <= 0) {
    return "avg=- max=- sum=- n=0";
  }

  return `avg=${formatMs(stat.totalMs / stat.count)} max=${formatMs(stat.maxMs)} sum=${formatMs(stat.totalMs)} n=${stat.count}`;
}

function formatMs(value: number | undefined): string {
  return typeof value === "number" ? `${value.toFixed(1)}ms` : "-";
}

export const arenaProfiler = new ArenaProfiler();

export function mountArenaProfiler(host: HTMLElement): ArenaProfiler {
  arenaProfiler.mount(host);
  return arenaProfiler;
}
