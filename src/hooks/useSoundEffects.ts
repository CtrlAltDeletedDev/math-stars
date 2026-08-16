// One AudioContext for the whole app.
//
// This used to construct a fresh AudioContext per beep — playLevelUp() made four
// — and only closed it if `onended` happened to fire. Browsers cap how many a
// page may hold (Safari most tightly), so after a long session the sounds just
// stopped. A single lazily-created context, resumed on the first gesture, is
// also what mobile autoplay policies expect.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    // Browsers start the context suspended until a user gesture; every sound
    // here is triggered by a tap, so this is the right moment to resume.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function play(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.25, delay = 0) {
  const audio = getContext();
  if (!audio) return;
  try {
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
    // Nodes are disposable; the context is not. Let them go, keep the context.
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {
    // Audio unavailable — silence is an acceptable outcome.
  }
}

export function useSoundEffects() {
  return {
    playCorrect: () => {
      play(523, 0.15); // C5
      play(784, 0.2, 'sine', 0.25, 0.12); // G5, scheduled rather than setTimeout
    },
    playWrong: () => play(220, 0.25, 'sawtooth', 0.2),
    playLevelUp: () => {
      [523, 659, 784, 1047].forEach((freq, i) => play(freq, 0.2, 'sine', 0.25, i * 0.12));
    },
  };
}
