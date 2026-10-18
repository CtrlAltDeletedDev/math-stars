import { useEffect, useCallback } from 'react';
import { Question } from '@/types';

export function useSpeakQuestion() {
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const say = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  }, []);

  const speak = useCallback((question: Question) => say(question.speakText ?? question.prompt), [say]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, say, cancel };
}
