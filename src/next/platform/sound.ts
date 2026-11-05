// Small sounds. One AudioContext, resumed from a tap (see useSoundEffects for
// why). A soft "tok" for right, a low hum for try again -- no buzzer -- and a
// rising run when they move up a stone.

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0) {
  const a = context();
  if (!a) return;
  try {
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  } catch { /* silence is fine */ }
}

export const sound = {
  unlock: () => { context(); },
  key: () => tone(660, 0.05, 'triangle', 0.08),
  right: () => { tone(784, 0.12, 'triangle', 0.2); tone(1047, 0.18, 'triangle', 0.16, 0.08); },
  tryAgain: () => tone(294, 0.22, 'sine', 0.14),
  stoneUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.1)),
};
