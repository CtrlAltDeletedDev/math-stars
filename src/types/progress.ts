import { GradeLevel } from '@/data/grades';

export interface SRSCard {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  nextDueDate: number;
  repetitions: number;
  lastSeen: number;
}

/**
 * What happened on one level. Note what is NOT here: nothing about whether she
 * is *allowed* to play it.
 *
 * `status` used to live here as locked/unlocked/completed. It was a second copy
 * of information `bestScore` already carries, the two could disagree, and its
 * absence meant "locked" — so any level added to an existing category rendered
 * as a padlock forever. Availability is now read from the catalogue alone;
 * whether she has passed is derived with `passedLevel()` in engine/scoring.ts.
 *
 * These records are sparse: an entry exists only for a level she has attempted.
 */
export interface LevelState {
  levelId: string;
  bestScore: number;
  starsEarned: number;
  totalAttempts: number;
  lastPlayed: number;
}

export interface CategoryProgress {
  categoryId: string;
  levels: Record<string, LevelState>;
  totalStarsEarned: number;
}

/** Where the child currently stands on one skill ladder. */
export interface SkillState {
  skillId: string;
  /** Index into the skill's rungs. */
  rung: number;
  /** Sliding window of recent results at this rung; cleared on every move. */
  recent: boolean[];
  attempts: number;
  correct: number;
  /**
   * How many times the sliding window said "promote" and the grade ceiling said
   * no. Two or more means she has outgrown the band — the Parent screen uses it
   * to suggest moving her up a year.
   */
  ceilingHits?: number;
}

export interface BadgeEarned {
  badgeId: string;
  earnedAt: number;
}

export interface UserProgress {
  version: number;
  totalStars: number;
  spendableStars: number;
  currentStreak: number;
  lastPlayedDate: string;
  longestStreak: number;
  categories: Record<string, CategoryProgress>;
  srsCards: Record<string, SRSCard>;
  characterId: string | null;
  earnedBadges: BadgeEarned[];
  purchasedItems: string[];
  activeTheme: string;
  consecutiveCorrect: number;
  playHistory: string[];
  earnedStickers: string[];
  musicEnabled: boolean;
  challengeMode: boolean;
  slowMode: boolean;
  autoReadEnabled: boolean;
  dailyChallengeStreak: number;
  lastDailyChallengeDate: string;
  dailyChallengeHistory: string[];
  dailyQuestionsDate: string;
  dailyQuestionsCount: number;
  /** Adaptive practice: one entry per skill she has actually met. */
  skills: Record<string, SkillState>;
  practiceQuestionsAnswered: number;
  /**
   * Focus Mode: skill ids endless practice should stick to, chosen by a parent.
   * Empty means "whatever the tiers have unlocked", which is the normal case.
   */
  practiceFocus: string[];
  /** Set once by a parent; null until the grade screen has been through. */
  gradeLevel: GradeLevel | null;
}
