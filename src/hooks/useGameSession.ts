import { useState, useRef } from 'react';
import { Question, SRSCard } from '@/types';
import { Level } from '@/types';
import { buildSession } from '@/engine/sessionBuilder';
import { updateSRSCard, createNewSRSCard } from '@/engine/srs';

interface SessionState {
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  streak: number;
  hotStreak: number;
  results: { questionId: string; correct: boolean }[];
  srsUpdates: SRSCard[];
  isComplete: boolean;
}

export function useGameSession(levelOrQuestions: Level | Question[], srsCards: Record<string, SRSCard>, characterName = 'You') {
  const questions = useRef<Question[]>(
    Array.isArray(levelOrQuestions)
      ? levelOrQuestions
      : buildSession(levelOrQuestions as Level, srsCards, characterName),
  );

  const [state, setState] = useState<SessionState>({
    questions: questions.current,
    currentIndex: 0,
    correctCount: 0,
    streak: 0,
    hotStreak: 0,
    results: [],
    srsUpdates: [],
    isComplete: false,
  });

  const currentQuestion = state.questions[state.currentIndex];

  function recordAnswer(selectedChoice: string): boolean {
    const question = currentQuestion;
    if (!question) return false;

    const correct = selectedChoice === question.correctAnswer;

    const existingCard = srsCards[question.id] ?? createNewSRSCard(question.id);
    const updatedCard = updateSRSCard(existingCard, correct);

    setState((prev) => {
      const newCorrectCount = prev.correctCount + (correct ? 1 : 0);
      const newStreak = correct ? prev.streak + 1 : 0;
      const newHotStreak = correct ? prev.hotStreak + 1 : 0;
      const isLast = prev.currentIndex >= prev.questions.length - 1;

      return {
        ...prev,
        correctCount: newCorrectCount,
        streak: newStreak,
        hotStreak: newHotStreak,
        results: [...prev.results, { questionId: question.id, correct }],
        srsUpdates: [...prev.srsUpdates, updatedCard],
        isComplete: isLast,
      };
    });

    return correct;
  }

  function advance() {
    setState((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  }

  return {
    currentQuestion,
    currentIndex: state.currentIndex,
    totalQuestions: state.questions.length,
    correctCount: state.correctCount,
    streak: state.streak,
    hotStreak: state.hotStreak,
    isComplete: state.isComplete,
    srsUpdates: state.srsUpdates,
    recordAnswer,
    advance,
  };
}
