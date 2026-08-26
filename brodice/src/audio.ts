interface AudioWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

let audioContext: AudioContext | null = null;

export async function playRollSound(host: AudioWindow = globalThis as AudioWindow): Promise<void> {
  const AudioContextConstructor = host.AudioContext ?? host.webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    const context = audioContext ?? new AudioContextConstructor();
    audioContext = context;
    if (context.state === "suspended") await context.resume();
    const startedAt = context.currentTime;
    playClack(context, startedAt, 104, 0.7);
    playClack(context, startedAt + 0.07, 73, 0.52);
    playClack(context, startedAt + 0.15, 128, 0.38);
  } catch {
    // Sound is a progressive enhancement and never affects the roll.
  }
}

function playClack(context: AudioContext, startedAt: number, frequency: number, volume: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * 0.42), startedAt + 0.055);
  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.07), startedAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.07);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + 0.075);
}
