import { useEffect, useCallback } from 'react';
import { Question } from '@/types';

export function useSpeakQuestion() {
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const speak = useCallback((question: Question) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = question.speakText ?? question.prompt;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}
