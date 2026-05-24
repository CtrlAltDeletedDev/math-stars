import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserProgress, SRSCard, BadgeEarned } from '@/types';
import { loadProgress, saveProgress, buildInitialProgress } from './storage';
import { CATEGORIES, getLevelById } from '@/data/categories';
import { calculateStars, didPassLevel, updateStreak } from '@/engine/scoring';
import { BADGES, BadgeCheckContext } from '@/data/badges';
import { STICKERS } from '@/data/stickers';
import { SHOP_ITEMS } from '@/data/shop';
import { GAME_CONFIG } from '@/constants/gameConfig';

interface ProgressContextValue {
  progress: UserProgress;
  isLoaded: boolean;
  recordLevelComplete: (
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number };
  recordDailyChallengeComplete: (
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; dcStreakBonus: number };
  recordMasterComplete: (
    categoryId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number };
  recordQuestionsAnswered: (count: number) => void;
  selectCharacter: (characterId: string) => void;
  purchaseItem: (itemId: string) => boolean;
  setActiveTheme: (themeId: string) => void;
  toggleMusic: () => void;
  toggleChallengeMode: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(buildInitialProgress());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = loadProgress();
    if (saved) setProgress(saved);
    setIsLoaded(true);
  }, []);

  function debouncedSave(p: UserProgress) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(p), 500);
  }

  function checkNewBadges(prev: UserProgress, next: UserProgress, sessionCorrect: number, sessionTotal: number): BadgeEarned[] {
    const existingIds = new Set(prev.earnedBadges.map((b) => b.badgeId));

    const categoriesCompleted = Object.values(next.categories).filter((cat) =>
      Object.values(cat.levels).every((l) => l.status === 'completed'),
    ).length;

    const totalLevelsCompleted = Object.values(next.categories).reduce(
      (sum, cat) => sum + Object.values(cat.levels).filter((l) => l.status === 'completed').length,
      0,
    );

    const ctx: BadgeCheckContext = {
      totalStars: next.totalStars,
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      consecutiveCorrect: next.consecutiveCorrect,
      categoriesCompleted,
      totalLevelsCompleted,
      sessionCorrect,
      sessionTotal,
      dailyChallengeStreak: next.dailyChallengeStreak,
      dailyChallengesCompleted: next.dailyChallengeHistory?.length,
    };

    return BADGES.filter((b) => !existingIds.has(b.id) && b.check(ctx)).map((b) => ({
      badgeId: b.id,
      earnedAt: Date.now(),
    }));
  }

  function checkNewStickers(prev: UserProgress, next: UserProgress, sessionCorrect: number, sessionTotal: number): string[] {
    const existing = new Set(prev.earnedStickers ?? []);
    const playDays = new Set(next.playHistory ?? []).size;
    const categoriesCompleted = Object.values(next.categories).filter((cat) =>
      Object.values(cat.levels).every((l) => l.status === 'completed'),
    ).length;
    const totalLevelsCompleted = Object.values(next.categories).reduce(
      (sum, cat) => sum + Object.values(cat.levels).filter((l) => l.status === 'completed').length, 0,
    );
    const ctx = {
      totalStars: next.totalStars,
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      consecutiveCorrect: next.consecutiveCorrect,
      categoriesCompleted,
      totalLevelsCompleted,
      sessionCorrect,
      sessionTotal,
      playDays,
    };
    return STICKERS.filter((s) => !existing.has(s.id) && s.check(ctx)).map((s) => s.id);
  }

  function recordLevelComplete(
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number } {
    const level = getLevelById(levelId);
    if (!level) return { newBadges: [], newStickers: [], streakBonus: 0 };

    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    const passed = didPassLevel(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;

    setProgress((prev) => {
      let next = updateStreak(prev);
      const todayStr = new Date().toISOString().split('T')[0];
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = { ...next, spendableStars: next.spendableStars + streakBonus };
        }
      }
      next = { ...next, consecutiveCorrect };

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
          if (nextLevel && (!catProgress.levels[nextLevel.id] || catProgress.levels[nextLevel.id]?.status === 'locked')) {
            catProgress.levels = {
              ...catProgress.levels,
              [nextLevel.id]: {
                ...(catProgress.levels[nextLevel.id] ?? { levelId: nextLevel.id, status: 'locked', bestScore: 0, starsEarned: 0, totalAttempts: 0, lastPlayed: 0 }),
                status: 'unlocked',
                unlockedAt: Date.now(),
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
        spendableStars: next.spendableStars + newStarDelta,
        categories: { ...next.categories, [level.categoryId]: catProgress },
        srsCards: updatedSRS,
      };

      newBadges = checkNewBadges(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) {
        next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      }
      newStickers = checkNewStickers(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) {
        next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };
      }

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus };
  }

  function recordDailyChallengeComplete(
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; dcStreakBonus: number } {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;
    const dcStreakBonus = GAME_CONFIG.dailyChallengeBonus;

    setProgress((prev) => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (prev.lastDailyChallengeDate === todayStr) return prev;

      let next = updateStreak(prev);
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = { ...next, spendableStars: next.spendableStars + streakBonus };
        }
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const dcStreak = prev.lastDailyChallengeDate === yesterdayStr
        ? prev.dailyChallengeStreak + 1
        : 1;

      next = {
        ...next,
        consecutiveCorrect,
        dailyChallengeStreak: dcStreak,
        lastDailyChallengeDate: todayStr,
        dailyChallengeHistory: [...(next.dailyChallengeHistory ?? []), todayStr],
        totalStars: next.totalStars + stars + dcStreakBonus,
        spendableStars: next.spendableStars + stars + dcStreakBonus,
      };

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) updatedSRS[card.questionId] = card;
      next = { ...next, srsCards: updatedSRS };

      newBadges = checkNewBadges(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      newStickers = checkNewStickers(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus, dcStreakBonus };
  }

  function recordMasterComplete(
    categoryId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number } {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;

    setProgress((prev) => {
      let next = updateStreak(prev);
      const todayStr = new Date().toISOString().split('T')[0];
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = { ...next, spendableStars: next.spendableStars + streakBonus };
        }
      }
      next = {
        ...next,
        consecutiveCorrect,
        totalStars: next.totalStars + stars,
        spendableStars: next.spendableStars + stars,
      };

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) updatedSRS[card.questionId] = card;
      next = { ...next, srsCards: updatedSRS };

      newBadges = checkNewBadges(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      newStickers = checkNewStickers(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus };
  }

  function recordQuestionsAnswered(count: number) {
    setProgress((prev) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const wasAtGoal = prev.dailyQuestionsDate === todayStr && prev.dailyQuestionsCount >= GAME_CONFIG.dailyGoalQuestions;
      if (wasAtGoal) return prev;

      const prevCount = prev.dailyQuestionsDate === todayStr ? prev.dailyQuestionsCount : 0;
      const newCount = prevCount + count;
      const crossedGoal = !wasAtGoal && newCount >= GAME_CONFIG.dailyGoalQuestions;

      const next = {
        ...prev,
        dailyQuestionsDate: todayStr,
        dailyQuestionsCount: newCount,
        ...(crossedGoal ? {
          spendableStars: prev.spendableStars + GAME_CONFIG.dailyGoalBonus,
          totalStars: prev.totalStars + GAME_CONFIG.dailyGoalBonus,
        } : {}),
      };
      debouncedSave(next);
      return next;
    });
  }

  function selectCharacter(characterId: string) {
    setProgress((prev) => {
      const next = { ...prev, characterId };
      debouncedSave(next);
      return next;
    });
  }

  function purchaseItem(itemId: string): boolean {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;

    let success = false;
    setProgress((prev) => {
      if (prev.spendableStars < item.cost || prev.purchasedItems.includes(itemId)) return prev;
      const next = {
        ...prev,
        spendableStars: prev.spendableStars - item.cost,
        purchasedItems: [...prev.purchasedItems, itemId],
      };
      debouncedSave(next);
      success = true;
      return next;
    });
    return success;
  }

  function setActiveTheme(themeId: string) {
    setProgress((prev) => {
      const next = { ...prev, activeTheme: themeId };
      debouncedSave(next);
      return next;
    });
  }

  function toggleMusic() {
    setProgress((prev) => {
      const next = { ...prev, musicEnabled: !prev.musicEnabled };
      debouncedSave(next);
      return next;
    });
  }

  function toggleChallengeMode() {
    setProgress((prev) => {
      const next = { ...prev, challengeMode: !prev.challengeMode };
      debouncedSave(next);
      return next;
    });
  }

  return (
    <ProgressContext.Provider value={{ progress, isLoaded, recordLevelComplete, recordDailyChallengeComplete, recordMasterComplete, recordQuestionsAnswered, selectCharacter, purchaseItem, setActiveTheme, toggleMusic, toggleChallengeMode }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
