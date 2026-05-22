import { useCallback, useRef } from 'react';

interface SpeechResult { transcript: string }
type OnResult = (r: SpeechResult) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechAPI = any;

export function useSpeechRecognition() {
  const recRef = useRef<SpeechAPI>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: OnResult, onEnd?: () => void) => {
    if (!isSupported) return;
    stop();
    const SR: SpeechAPI =
      (window as SpeechAPI).SpeechRecognition ||
      (window as SpeechAPI).webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 3;
    rec.onresult = (e: SpeechAPI) => {
      const transcript: string = e.results[0][0].transcript;
      onResult({ transcript: transcript.toLowerCase().trim() });
    };
    rec.onend = () => { recRef.current = null; if (onEnd) onEnd(); };
    rec.onerror = () => { recRef.current = null; if (onEnd) onEnd(); };
    rec.start();
  }, [isSupported]); // eslint-disable-line

  const stop = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); recRef.current = null; }
  }, []);

  const isListening = () => recRef.current !== null;

  return { isSupported, start, stop, isListening };
}
