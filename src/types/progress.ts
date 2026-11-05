import { GradeLevel } from '@/data/grades';
import { ErrorTag } from './question';

export interface SRSCard {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  nextDueDate: number;
  repetitions: number;
  lastSeen: number;
}

/**
 * What happened on one level. Note what is NOT here: nothing about whether they
 * are *allowed* to play it.
 *
 * `status` used to live here as locked/unlocked/completed. It was a second copy
 * of information `bestScore` already carries, the two could disagree, and its
 * absence meant "locked" — so any level added to an existing category rendered
 * as a padlock forever. Availability is now read from the catalogue alone;
 * whether they have passed is derived with `passedLevel()` in engine/scoring.ts.
 *
 * These records are sparse: an entry exists only for a level they have attempted.
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
   * How long their recent right answers at this rung took, in milliseconds.
   *
   * The ladder only ever knew right from wrong, but for facts "right after
   * counting on their fingers for twelve seconds" and "just knows it" are
   * different places to be. Same rules as `recent`: only answers from the rung
   * they are standing on, cleared on every move. Misses are left out — how long a
   * wrong answer took says nothing about fluency. Nothing moves them on this
   * yet; it is recorded so that something can.
   */
  times?: number[];
  /**
   * How many times this topic has moved them down. Zero means it is still
   * placing them, and the fast lane applies (see skillLadder.ts). Absent on a
   * save from before it was counted, which keeps the ordinary rule.
   */
  demotions?: number;
  /**
   * How many times the sliding window said "promote" and the grade ceiling said
   * no. Two or more means they have outgrown the band — the Parent screen uses it
   * to suggest moving them up a year.
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
  /** Adaptive practice: one entry per skill they have actually met. */
  skills: Record<string, SkillState>;
  practiceQuestionsAnswered: number;
  /**
   * Focus Mode: skill ids endless practice should stick to, chosen by a parent.
   * Empty means "whatever the tiers have unlocked", which is the normal case.
   */
  practiceFocus: string[];
  /** Set once by a parent; null until the grade screen has been through. */
  gradeLevel: GradeLevel | null;
  /**
   * How often each kind of mistake has been made, per skill.
   *
   * Counts, not events. A log of every wrong answer would be the obvious shape
   * and the wrong one: localStorage has a hard quota, `maxSRSCards` exists
   * because generated questions already push thousands of entries into it, and
   * nothing a parent wants to read needs more than the totals. Seventeen skills
   * by eight tags is a few kilobytes at worst, against roughly 500 KB for the
   * card map.
   */
  errorPatterns: Record<string, Partial<Record<ErrorTag, number>>>;
  /**
   * Lessons they have played to the end: lesson id -> local date (todayString).
   * Only ever used to suggest a lesson they haven't seen and to show a tick; a
   * lesson is never locked behind another, and nothing is scored in one.
   */
  lessonsDone: Record<string, string>;
}
