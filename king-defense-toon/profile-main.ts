import { createScene } from './scene.ts';
import { createCombatProfiler, collectProfilerCounters } from './combat-profiler.ts';
import { createProfilerPanel } from './profiler-panel.ts';
import { COMBAT_STRESS_SCENARIOS, createCombatStressBattle } from './combat-stress.ts';
import { createFramePacer } from './frame-pacer.ts';
import { battleFrameDelta } from './battle-speed.ts';
import { updateBattle } from './combat.ts';
import { setBattleVisualEffectLimit } from './combat-visuals.ts';
import type { Battle } from './combat-types.ts';
import type { Scene } from './scene-types.ts';

const selector = document.querySelector<HTMLSelectElement>('#profile-scenario')!;
const speedInput = document.querySelector<HTMLSelectElement>('#profile-speed')!;
const visualInput = document.querySelector<HTMLSelectElement>('#profile-visuals')!;
const secondsInput = document.querySelector<HTMLInputElement>('#profile-seconds')!;
const startButton = document.querySelector<HTMLButtonElement>('#profile-start')!;
const stopButton = document.querySelector<HTMLButtonElement>('#profile-stop')!;
const status = document.querySelector<HTMLElement>('#profile-status')!;
const description = document.querySelector<HTMLElement>('#profile-description')!;
const canvas = document.querySelector<HTMLCanvasElement>('#profile-battle')!;
const profiler = createCombatProfiler({ enabled: true, targetFps: 30 });
let runContext: Readonly<Record<string, string | number | boolean>> = Object.freeze({ mode: 'stress-lab', status: 'not-started' });
const panel = createProfilerPanel(profiler, { context: () => runContext });
const pacer = createFramePacer(30);
const DURATION_EPSILON_SECONDS = 1e-8;
let scene: Scene | null = null, battle: Battle | null = null;
let running = false, loading = false, destroyed = false, frameId = 0, generation = 0;
let speed = 1, duration = 30;

for (const scenario of COMBAT_STRESS_SCENARIOS) {
  const option = document.createElement('option');
  option.value = scenario.id; option.textContent = scenario.label; selector.append(option);
}
function describe() { description.textContent = COMBAT_STRESS_SCENARIOS.find(s => s.id === selector.value)?.description ?? ''; }
selector.addEventListener('change', describe); describe();
function controls() {
  startButton.disabled = destroyed || !scene || running || loading;
  stopButton.disabled = !running && !loading;
  for (const input of [selector, speedInput, visualInput, secondsInput]) input.disabled = running || loading;
}
function stop(reason: string) {
  generation++;
  running = loading = false;
  cancelAnimationFrame(frameId); frameId = 0;
  pacer.reset(); profiler.suspend(); controls();
  status.textContent = reason;
  canvas.dataset.running = 'false';
}
function draw() {
  if (!battle) return;
  scene?.render({ battle, units: [], time: battle.elapsed, levelNumber: battle.wave.levelNumber });
}
function frame(timestamp: number) {
  frameId = 0;
  if (!running || !battle || destroyed || document.hidden) return;
  const delta = pacer.sample(timestamp);
  if (delta === null) { frameId = requestAnimationFrame(frame); return; }
  profiler.beginFrame(timestamp);
  const active = battle;
  try {
    // Already accumulated fractions also consume the requested duration. Subtract
    // them before the last update so FPS and speed cannot add a final extra tick.
    const remaining = Math.max(0, duration - active.elapsed - active.stepRemainder);
    const step = Math.min(battleFrameDelta(delta, speed), remaining);
    profiler.measure('simulation', () => updateBattle(active, step));
    profiler.measure('render', draw);
    profiler.measure('ui', () => {
      status.textContent = `${active.phase} · ${active.elapsed.toFixed(1)} / ${duration}s · ${active.kills}/${active.total} defeated`;
      canvas.dataset.phase = active.phase;
      canvas.dataset.elapsed = active.elapsed.toFixed(3);
    });
  } finally {
    profiler.endFrame(collectProfilerCounters(active, speed));
    panel.update(timestamp);
  }
  // Fixed-step addition can end a few rounding bits below a whole-second limit.
  if (active.phase !== 'running' || active.elapsed >= duration - DURATION_EPSILON_SECONDS) stop(status.textContent ?? 'Complete');
  else frameId = requestAnimationFrame(frame);
}
async function start() {
  if (!scene || running || loading || destroyed) return;
  const seconds = Number(secondsInput.value);
  if (!Number.isInteger(seconds) || seconds < 5 || seconds > 60) {
    status.textContent = 'Choose 5–60 whole battle seconds.'; return;
  }
  const scenario = COMBAT_STRESS_SCENARIOS.find(s => s.id === selector.value);
  if (!scenario) return;
  const token = ++generation;
  loading = true; controls();
  try {
    const nextBattle = createCombatStressBattle(scenario.id);
    const nextSpeed = Number(speedInput.value);
    setBattleVisualEffectLimit(nextBattle, Number(visualInput.value));
    status.textContent = 'Preparing scenario assets…';
    const ready = await scene.prepare({ battle: nextBattle, units: [], levelNumber: nextBattle.wave.levelNumber });
    if (destroyed || token !== generation) return;
    if (!ready) { stop('Asset loading failed. Press Run to retry.'); return; }
    // Samples and their detached label switch together only after successful
    // preparation. Editing controls or canceling a load keeps the previous report.
    profiler.reset();
    runContext = Object.freeze({ mode: 'stress-lab', scenario: scenario.id,
      speed: nextSpeed, duration: seconds, visualEffectLimit: nextBattle.visualEffectLimit });
    battle = nextBattle; speed = nextSpeed; duration = seconds;
    pacer.reset();
    loading = false; running = true; controls();
    canvas.dataset.running = 'true';
    frameId = requestAnimationFrame(frame);
  } catch (error) {
    if (token === generation && !destroyed) stop(`Scenario failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
startButton.addEventListener('click', () => { void start(); });
stopButton.addEventListener('click', () => stop('Stopped. Press Run for a fresh scenario.'));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Paused while hidden. Press Run to restart.'); });
window.addEventListener('pagehide', event => {
  stop('Stopped while away. Press Run to restart.');
  if (!event.persisted) { destroyed = true; scene?.destroy(); panel.destroy(); }
});
try {
  const loaded = await createScene(canvas, { placementGrid: false });
  if (destroyed) loaded.destroy();
  else { scene = loaded; controls(); status.textContent = 'Ready. Choose a scenario and press Run.'; }
} catch (error) { status.textContent = `Unable to load scene: ${error instanceof Error ? error.message : String(error)}`; }
