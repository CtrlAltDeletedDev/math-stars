import { UserProgress } from '@/types';
import { GAME_CONFIG } from '@/constants/gameConfig';

export function calculateStars(correctFraction: number): 0 | 1 | 2 | 3 {
  if (correctFraction >= GAME_CONFIG.starsForThree) return 3;
  if (correctFraction >= GAME_CONFIG.starsForTwo) return 2;
  if (correctFraction >= GAME_CONFIG.starsForOne) return 1;
  return 0;
}

export function didPassLevel(correctFraction: number): boolean {
  return correctFraction >= GAME_CONFIG.passThreshold;
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = todayString();
  const last = progress.lastPlayedDate;

  if (last === today) return progress;

  const yesterday = yesterdayString();
  const newStreak = last === yesterday ? progress.currentStreak + 1 : 1;

  return {
    ...progress,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
    lastPlayedDate: today,
  };
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
