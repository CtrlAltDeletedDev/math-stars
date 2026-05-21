import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserProgress, SRSCard } from '@/types';
import { loadProgress, saveProgress, buildInitialProgress } from './storage';
import { CATEGORIES, getLevelById } from '@/data/categories';
import { calculateStars, didPassLevel, updateStreak } from '@/engine/scoring';

interface ProgressContextValue {
  progress: UserProgress;
  isLoaded: boolean;
  recordLevelComplete: (
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
  ) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(buildInitialProgress());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProgress().then((saved) => {
      if (saved) setProgress(saved);
      setIsLoaded(true);
    });
  }, []);

  function debouncedSave(p: UserProgress) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(p), 500);
  }

  function recordLevelComplete(
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
  ) {
    const level = getLevelById(levelId);
    if (!level) return;

    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    const passed = didPassLevel(score);

    setProgress((prev) => {
      let next = updateStreak(prev);

      const catProgress = { ...next.categories[level.categoryId] };
      const prevLevel = catProgress.levels[levelId] ?? {
        levelId,
        status: 'unlocked' as const,
        bestScore: 0,
        starsEarned: 0,
        totalAttempts: 0,
        lastPlayed: 0,
      };

      const newStarDelta = Math.max(0, stars - prevLevel.starsEarned);

      catProgress.levels = {
        ...catProgress.levels,
        [levelId]: {
          ...prevLevel,
          status: passed ? 'completed' : prevLevel.status,
          bestScore: Math.max(prevLevel.bestScore, score),
          starsEarned: Math.max(prevLevel.starsEarned, stars),
          totalAttempts: prevLevel.totalAttempts + 1,
          lastPlayed: Date.now(),
        },
      };

      if (passed) {
        const category = CATEGORIES.find((c) => c.id === level.categoryId);
        if (category) {
          const levelIndex = category.levels.findIndex((l) => l.id === levelId);
          const nextLevel = category.levels[levelIndex + 1];
          if (nextLevel && catProgress.levels[nextLevel.id]?.status === 'locked') {
            catProgress.levels = {
              ...catProgress.levels,
              [nextLevel.id]: {
                ...catProgress.levels[nextLevel.id],
                status: 'unlocked',
              },
            };
          }
        }
      }

      catProgress.totalStarsEarned = (catProgress.totalStarsEarned ?? 0) + newStarDelta;

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) {
        updatedSRS[card.questionId] = card;
      }

      next = {
        ...next,
        totalStars: next.totalStars + newStarDelta,
        categories: {
          ...next.categories,
          [level.categoryId]: catProgress,
        },
        srsCards: updatedSRS,
      };

      debouncedSave(next);
      return next;
    });
  }

  return (
    <ProgressContext.Provider value={{ progress, isLoaded, recordLevelComplete }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
