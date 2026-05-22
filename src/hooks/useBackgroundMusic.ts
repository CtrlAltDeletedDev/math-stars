import { useEffect, useRef } from 'react';

// C major pentatonic: C4 E4 G4 A4 C5 A4 G4 E4
const MELODY = [261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63];
const BEAT = 0.55; // seconds per note

export function useBackgroundMusic(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      runningRef.current = false;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      return;
    }

    runningRef.current = true;
    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    ctxRef.current = ctx;

    function scheduleLoop(startAt: number) {
      if (!runningRef.current) return;
      MELODY.forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          const t = startAt + i * BEAT;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.07, t + 0.04);
          gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
          gain.gain.linearRampToValueAtTime(0, t + BEAT - 0.08);
          osc.start(t);
          osc.stop(t + BEAT);
        } catch { /* ignore */ }
      });

      const loopEnd = startAt + MELODY.length * BEAT;
      const msUntilReschedule = Math.max(0, (loopEnd - ctx.currentTime - 0.3) * 1000);
      setTimeout(() => scheduleLoop(loopEnd), msUntilReschedule);
    }

    scheduleLoop(ctx.currentTime + 0.2);

    return () => {
      runningRef.current = false;
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [enabled]);
}
