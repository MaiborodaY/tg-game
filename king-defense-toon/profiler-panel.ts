import type { CombatProfiler, ProfilerSnapshot } from './combat-profiler.ts';
import './profiler.css';

declare global {
  interface Window {
    brotdProfiler?: { snapshot(): ProfilerSnapshot; reset(): void };
  }
}

export interface ProfilerPanel { update(timestamp: number): void; destroy(): void }
export interface ProfilerPanelOptions { context?: () => Readonly<Record<string, string | number | boolean>> }

// This diagnostic UI is created only by an explicit profiling URL. It never
// reads campaign data, changes combat settings or writes browser storage.
export function createProfilerPanel(profiler: CombatProfiler, options: ProfilerPanelOptions = {}): ProfilerPanel {
  const panel = document.createElement('details');
  panel.id = 'combat-profiler';
  panel.className = 'combat-profiler';
  panel.innerHTML = `<summary>Profiler <span data-profiler-fps>— FPS</span></summary>
    <div class="profiler-body"><p>CPU work, milliseconds. Sections are per call; GPU time is not measured.</p>
    <table><thead><tr><th>Metric</th><th>Mean</th><th>p95</th><th>Max</th></tr></thead><tbody></tbody></table>
    <p data-profiler-budget></p><p data-profiler-counts></p>
    <div class="profiler-actions"><button type="button" data-profiler-reset>Reset</button><button type="button" data-profiler-export>Export JSON</button></div>
    <p>Rolling samples. The FPS target is a reference, not a device guarantee.</p></div>`;
  document.body.append(panel);
  const fps = panel.querySelector<HTMLElement>('[data-profiler-fps]')!;
  const body = panel.querySelector('tbody')!;
  const budget = panel.querySelector<HTMLElement>('[data-profiler-budget]')!;
  const counters = panel.querySelector<HTMLElement>('[data-profiler-counts]')!;
  const resetButton = panel.querySelector<HTMLButtonElement>('[data-profiler-reset]')!;
  const exportButton = panel.querySelector<HTMLButtonElement>('[data-profiler-export]')!;
  const labels = { interval: 'Frame interval', work: 'Frame work', simulation: 'Simulation', render: 'Canvas', ui: 'UI' } as const;
  let lastUpdate = -Infinity, destroyed = false;
  const api = Object.freeze({ snapshot: () => profiler.snapshot(), reset });
  window.brotdProfiler = api;

  function reset() { profiler.reset(); lastUpdate = -Infinity; update(performance.now()); }
  function update(timestamp: number) {
    if (destroyed || timestamp - lastUpdate < 500) return;
    lastUpdate = timestamp;
    const sample = profiler.snapshot();
    fps.textContent = sample.metrics.interval.mean > 0 ? `${Math.round(1000 / sample.metrics.interval.mean)} FPS` : '— FPS';
    body.innerHTML = Object.entries(labels).map(([key, label]) => {
      const metric = sample.metrics[key as keyof typeof labels];
      return `<tr><th>${label}</th><td>${metric.mean.toFixed(2)}</td><td>${metric.p95.toFixed(2)}</td><td>${metric.max.toFixed(2)}</td></tr>`;
    }).join('');
    budget.textContent = `Target ${sample.targetFps} FPS · ${sample.frameBudgetMs.toFixed(1)} ms. Work overruns ${sample.budgetOverruns}/${sample.metrics.work.count}; slow intervals ${sample.slowIntervals}/${sample.metrics.interval.count}.`;
    const c = sample.counters;
    counters.textContent = c ? `Wave ${c.wave} · ×${c.speed} · retained allies/enemies ${c.allies}/${c.enemies} · projectiles ${c.projectiles} · cosmetics ${c.effects} · poisoned ${c.poisoned}` : 'No frame samples yet.';
  }
  function exportReport() {
    const report = { kind: 'brotd-browser-profile', recordedAt: new Date().toISOString(),
      build: document.querySelector<HTMLMetaElement>('meta[name="brotd-build"]')?.content ?? 'development',
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      userAgent: navigator.userAgent, note: 'CPU submission timings; not GPU timings or physical device acceptance.',
      context: options.context?.() ?? { mode: 'campaign' }, sample: profiler.snapshot() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'brotd-profile.json'; link.click();
    // Allow the download task to consume the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  resetButton.addEventListener('click', reset);
  exportButton.addEventListener('click', exportReport);
  update(0);
  return { update, destroy() {
    destroyed = true;
    resetButton.removeEventListener('click', reset);
    exportButton.removeEventListener('click', exportReport);
    panel.remove();
    if (window.brotdProfiler === api) delete window.brotdProfiler;
  } };
}
