import { BadgeEarned, UserProgress } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { BADGES, BadgeCheckContext } from '@/data/badges';
import { STICKERS } from '@/data/stickers';
import { passedLevel } from './scoring';
import { ladderProgress } from './mastery';

// What she has earned, decided from progress alone so it can be tested.
//
// Badges and stickers used to read only level and category completion. Play —
// the big button on Home, and the path the app steers her down — passes no
// levels, so a child who lived there could level up every topic and never see
// "Level Up!", "Category Champ!" or even the "Play your first game" sticker.
// Each of those now also counts the same progress measured on the ladders.

/**
 * How much of the catalogue she has passed, counted against the CATALOGUE.
 *
 * This used to count `every(l => l.status === 'completed')` over the *saved*
 * levels, so a category whose saved record was missing a level counted as
 * complete — awarding "Category Champ!" for a category she could not finish.
 * Counting against CATEGORIES means a level added later correctly makes the
 * category incomplete again.
 */
export function countCompletion(p: UserProgress): { categoriesCompleted: number; totalLevelsCompleted: number } {
  let categoriesCompleted = 0;
  let totalLevelsCompleted = 0;
  for (const cat of CATEGORIES) {
    const saved = p.categories[cat.id];
    let done = 0;
    for (const level of cat.levels) {
      if (passedLevel(saved?.levels[level.id])) done++;
    }
    totalLevelsCompleted += done;
    if (cat.levels.length > 0 && done === cat.levels.length) categoriesCompleted++;
  }
  return { categoriesCompleted, totalLevelsCompleted };
}

export function rewardContext(
  next: UserProgress,
  sessionCorrect: number,
  sessionTotal: number,
): BadgeCheckContext & { playDays: number } {
  return {
    totalStars: next.totalStars,
    currentStreak: next.currentStreak,
    longestStreak: next.longestStreak,
    consecutiveCorrect: next.consecutiveCorrect,
    ...countCompletion(next),
    ...ladderProgress(next),
    sessionCorrect,
    sessionTotal,
    dailyChallengeStreak: next.dailyChallengeStreak,
    dailyChallengesCompleted: next.dailyChallengeHistory?.length,
    playDays: new Set(next.playHistory ?? []).size,
  };
}

/** Badges `next` has earned that `prev` had not. */
export function newBadgesFor(
  prev: UserProgress,
  next: UserProgress,
  sessionCorrect: number,
  sessionTotal: number,
): BadgeEarned[] {
  const existing = new Set(prev.earnedBadges.map((b) => b.badgeId));
  const ctx = rewardContext(next, sessionCorrect, sessionTotal);
  return BADGES.filter((b) => !existing.has(b.id) && b.check(ctx)).map((b) => ({
    badgeId: b.id,
    earnedAt: Date.now(),
  }));
}

/** Stickers `next` has earned that `prev` had not. */
export function newStickersFor(
  prev: UserProgress,
  next: UserProgress,
  sessionCorrect: number,
  sessionTotal: number,
): string[] {
  const existing = new Set(prev.earnedStickers ?? []);
  const ctx = rewardContext(next, sessionCorrect, sessionTotal);
  return STICKERS.filter((s) => !existing.has(s.id) && s.check(ctx)).map((s) => s.id);
}
