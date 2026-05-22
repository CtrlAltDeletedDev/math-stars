export function useSoundEffects() {
  function play(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.25) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      osc.onended = () => ctx.close();
    } catch {
      // AudioContext unavailable (e.g., SSR or restricted browser)
    }
  }

  return {
    playCorrect: () => {
      play(523, 0.15); // C5
      setTimeout(() => play(784, 0.2), 120); // G5
    },
    playWrong: () => play(220, 0.25, 'sawtooth', 0.2),
    playLevelUp: () => {
      [523, 659, 784, 1047].forEach((freq, i) =>
        setTimeout(() => play(freq, 0.2), i * 120),
      );
    },
  };
}
