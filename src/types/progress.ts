export interface SRSCard {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  nextDueDate: number;
  repetitions: number;
  lastSeen: number;
}

export type LevelStatus = 'locked' | 'unlocked' | 'completed';

export interface LevelState {
  levelId: string;
  status: LevelStatus;
  bestScore: number;
  starsEarned: number;
  totalAttempts: number;
  lastPlayed: number;
  unlockedAt?: number;
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
}
