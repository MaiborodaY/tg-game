import { mkdir, writeFile } from 'node:fs/promises';

const sampleRate = 44100;
const output = new URL('../audio-preview/', import.meta.url);
await mkdir(output, { recursive: true });

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 2147483648 - 1;
  };
}

function lowpass(cutoff) {
  const coefficient = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
  let state = 0;
  return value => (state += coefficient * (value - state));
}

function envelope(time, attack, decay) {
  return time < 0 ? 0 : (1 - Math.exp(-time / attack)) * Math.exp(-time / decay);
}

// A noise-excited delay line produces a short string release, with no recorded sources.
function stringRelease(frequency, duration, seed, damp) {
  const noise = random(seed);
  const delay = new Float64Array(Math.round(sampleRate / frequency));
  for (let i = 0; i < delay.length; i++) delay[i] = noise();
  const result = new Float64Array(Math.ceil(duration * sampleRate));
  let cursor = 0;
  for (let i = 0; i < result.length; i++) {
    const next = (cursor + 1) % delay.length;
    const value = delay[cursor];
    delay[cursor] = (value + delay[next]) * .5 * damp;
    cursor = next;
    result[i] = value;
  }
  return result;
}

const variants = [
  { id: '01-soft', title: 'Мягкая тетива', seed: 1701, string: 226, damp: .969, twang: .65,
    wood: 190, woodMix: .28, snap: .21, snapCutoff: 2700, air: .18, airDecay: .065, airDelay: .016, decay: .095 },
  { id: '02-classic', title: 'Сухой щелчок', seed: 2812, string: 284, damp: .948, twang: .40,
    wood: 270, woodMix: .16, woodDecay: .012, snap: .18, snapCutoff: 2200, air: .17, airDecay: .039, airDelay: .011, decay: .060 },
  { id: '03-airy', title: 'Деревянная тетива', seed: 3813, string: 198, damp: .959, twang: .46,
    wood: 225, woodMix: .24, woodDecay: .019, snap: .15, snapCutoff: 2350, air: .25, airDecay: .060, airDelay: .018, decay: .080 },
  { id: '04-heavy', title: 'Короткое «фью»', seed: 4814, string: 340, damp: .951, twang: .31,
    wood: 285, woodMix: .13, woodDecay: .015, snap: .12, snapCutoff: 2900, air: .31, airDecay: .065, airDelay: .014, decay: .068,
    rubber: .20, rubberBase: 245, rubberSweep: 460, rubberFall: .021, rubberDecay: .033 },
  { id: '05-toon', title: 'Мультяшный щелчок', seed: 5715, string: 392, damp: .956, twang: .48,
    wood: 300, woodMix: .20, snap: .19, snapCutoff: 4200, air: .23, airDecay: .075, airDelay: .014, decay: .09, rubber: .18 },
];

function synthesize(config) {
  const duration = .7;
  const samples = new Float64Array(Math.ceil(duration * sampleRate));
  const noise = random(config.seed);
  const string = stringRelease(config.string, duration, config.seed + 81, config.damp);
  const softenString = lowpass(4600);
  const softenSnap = lowpass(config.snapCutoff);
  const airLow = lowpass(7200);
  const airBass = lowpass(1100);
  const removeDc = lowpass(35);
  let phase = 0;
  let whistlePhase = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate - .012;
    if (t < 0) continue;
    const n = noise();
    const pluck = softenString(string[i - Math.round(.012 * sampleRate)])
      * envelope(t, .0015, config.decay) * config.twang;
    const snap = softenSnap(n) * envelope(t, .00035, .006) * config.snap;
    const wood = (Math.sin(2 * Math.PI * config.wood * t)
      + .28 * Math.sin(2 * Math.PI * config.wood * 2.73 * t))
      * envelope(t, .0009, config.woodDecay ?? .023) * config.woodMix;
    const bandNoise = airLow(n) - airBass(n);
    const airTime = t - config.airDelay;
    const air = bandNoise * envelope(airTime, .015, config.airDecay) * config.air;
    phase += 2 * Math.PI * ((config.rubberBase ?? 190) + (config.rubberSweep ?? 620) * Math.exp(-t / (config.rubberFall ?? .033))) / sampleRate;
    const rubber = Math.sin(phase) * envelope(t, .002, config.rubberDecay ?? .047) * (config.rubber ?? 0);
    whistlePhase += 2 * Math.PI * (1550 + 1100 * Math.exp(-t / .10)) / sampleRate;
    const whistle = Math.sin(whistlePhase) * envelope(t - .035, .022, .08) * (config.whistle ?? 0);
    const value = pluck + snap + wood + air + rubber + whistle;
    samples[i] = value - removeDc(value);
  }
  // Gentle ends prevent clicks, and equal short-window RMS makes choices easier to compare.
  for (let i = 0; i < samples.length; i++) {
    const remaining = (samples.length - 1 - i) / sampleRate;
    samples[i] *= Math.min(1, remaining / .035);
  }
  const rms = Math.sqrt(samples.slice(0, .28 * sampleRate).reduce((sum, value) => sum + value * value, 0) / (.28 * sampleRate));
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const gain = Math.min(.63 / peak, .085 / rms);
  return Float64Array.from(samples, value => value * gain);
}

function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36);
  data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return data;
}

const report = [];
for (const variant of variants) {
  const samples = synthesize(variant);
  if (samples.some(value => !Number.isFinite(value))) throw new Error(`${variant.id}: invalid audio`);
  await writeFile(new URL(`${variant.id}.wav`, output), wav(samples));
  const preview = new Float64Array(Math.ceil(3.8 * sampleRate));
  for (const start of [.15, 1.35, 2.55]) {
    const offset = Math.round(start * sampleRate);
    for (let i = 0; i < samples.length; i++) preview[offset + i] += samples[i];
  }
  await writeFile(new URL(`${variant.id}-listen.wav`, output), wav(preview));
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  report.push({ id: variant.id, title: variant.title, duration: samples.length / sampleRate,
    peakDb: Number((20 * Math.log10(peak)).toFixed(1)), bytes: wav(samples).length });
}
await writeFile(new URL('manifest.json', output), JSON.stringify({ sampleRate, channels: 1, source: 'Original procedural synthesis; no recordings or external samples.', variants: report }, null, 2) + '\n');
console.table(report);
