interface AudioWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

let audioContext: AudioContext | null = null;

const SILENCE = 0.0001;
const MASTER_VOLUME = 0.12;

const ROLL_TAPS = [
  { offset: 0, duration: 0.042, cutoff: 980, volume: 0.3 },
  { offset: 0.047, duration: 0.035, cutoff: 760, volume: 0.19 },
  { offset: 0.092, duration: 0.044, cutoff: 1_140, volume: 0.24 },
  { offset: 0.148, duration: 0.036, cutoff: 880, volume: 0.15 },
  { offset: 0.205, duration: 0.032, cutoff: 680, volume: 0.1 },
] as const;

export async function playRollSound(host: AudioWindow = globalThis as AudioWindow): Promise<void> {
  const AudioContextConstructor = host.AudioContext ?? host.webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    const context = audioContext ?? new AudioContextConstructor();
    audioContext = context;
    if (context.state === "suspended") await context.resume();
    const startedAt = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(SILENCE, startedAt);
    master.gain.linearRampToValueAtTime(MASTER_VOLUME, startedAt + 0.008);
    master.gain.exponentialRampToValueAtTime(SILENCE, startedAt + 0.28);
    master.connect(context.destination);

    for (const tap of ROLL_TAPS) {
      playSoftTap(context, master, startedAt + tap.offset, tap.duration, tap.cutoff, tap.volume);
    }
  } catch {
    // Sound is a progressive enhancement and never affects the roll.
  }
}

function playSoftTap(
  context: AudioContext,
  destination: AudioNode,
  startedAt: number,
  duration: number,
  cutoff: number,
  volume: number,
): void {
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, duration, Math.round(startedAt * context.sampleRate) ^ cutoff);
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, startedAt);
  filter.Q.setValueAtTime(0.7, startedAt);
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENCE, startedAt);
  gain.gain.linearRampToValueAtTime(volume, startedAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(SILENCE, startedAt + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(startedAt);
  source.stop(startedAt + duration + 0.005);
}

function createNoiseBuffer(context: AudioContext, duration: number, seed: number): AudioBuffer {
  const frameCount = Math.max(1, Math.round(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let noiseState = (seed ^ frameCount) >>> 0;
  if (noiseState === 0) noiseState = 0x6d2b79f5;

  for (let index = 0; index < frameCount; index += 1) {
    noiseState ^= noiseState << 13;
    noiseState ^= noiseState >>> 17;
    noiseState ^= noiseState << 5;
    const progress = index / frameCount;
    const noise = ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
    samples[index] = noise * (1 - progress) ** 2;
  }

  return buffer;
}
