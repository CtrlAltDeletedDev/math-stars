import { UserProgress, CategoryProgress, LevelState } from '@/types';
import { CATEGORIES } from '@/data/categories';

const STORAGE_KEY = 'mathstars_progress_v2';
const CURRENT_VERSION = 2;

// Patch missing fields on a saved/imported progress object so the rest of
// the app can rely on every field existing. Returns null if it's not a
// compatible save at all.
export function normalizeProgress(parsed: UserProgress): UserProgress | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.version !== CURRENT_VERSION) return null;
  // Patch fields added after initial release
  if (!parsed.categories) parsed.categories = {};
  if (!parsed.srsCards) parsed.srsCards = {};
  if (!parsed.earnedBadges) parsed.earnedBadges = [];
  if (!parsed.purchasedItems) parsed.purchasedItems = [];
  if (!parsed.playHistory) parsed.playHistory = [];
  if (!parsed.earnedStickers) parsed.earnedStickers = [];
  if (parsed.musicEnabled === undefined) parsed.musicEnabled = false;
  if (parsed.challengeMode === undefined) parsed.challengeMode = false;
  if (parsed.dailyChallengeStreak === undefined) parsed.dailyChallengeStreak = 0;
  if (!parsed.lastDailyChallengeDate) parsed.lastDailyChallengeDate = '';
  if (!parsed.dailyChallengeHistory) parsed.dailyChallengeHistory = [];
  if (!parsed.dailyQuestionsDate) parsed.dailyQuestionsDate = '';
  if (parsed.dailyQuestionsCount === undefined) parsed.dailyQuestionsCount = 0;
  // Initialize any new categories added since this save was made
  for (const cat of CATEGORIES) {
    if (!parsed.categories[cat.id]) {
      parsed.categories[cat.id] = buildInitialCategoryProgress(cat.id);
    }
  }
  return parsed;
}

export function loadProgress(): UserProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeProgress(JSON.parse(raw) as UserProgress);
  } catch {
    return null;
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function buildInitialLevelState(levelId: string, isFirst: boolean): LevelState {
  return {
    levelId,
    status: isFirst ? 'unlocked' : 'locked',
    bestScore: 0,
    starsEarned: 0,
    totalAttempts: 0,
    lastPlayed: 0,
  };
}

function buildInitialCategoryProgress(categoryId: string): CategoryProgress {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return { categoryId, levels: {}, totalStarsEarned: 0 };

  const levels: Record<string, LevelState> = {};
  category.levels.forEach((level, idx) => {
    levels[level.id] = buildInitialLevelState(level.id, idx === 0);
  });

  return { categoryId, levels, totalStarsEarned: 0 };
}

export function buildInitialProgress(): UserProgress {
  const categories: Record<string, CategoryProgress> = {};
  for (const cat of CATEGORIES) {
    categories[cat.id] = buildInitialCategoryProgress(cat.id);
  }

  return {
    version: CURRENT_VERSION,
    totalStars: 0,
    spendableStars: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    categories,
    srsCards: {},
    characterId: null,
    earnedBadges: [],
    purchasedItems: [],
    activeTheme: 'sky',
    consecutiveCorrect: 0,
    playHistory: [],
    earnedStickers: [],
    musicEnabled: false,
    challengeMode: false,
    dailyChallengeStreak: 0,
    lastDailyChallengeDate: '',
    dailyChallengeHistory: [],
    dailyQuestionsDate: '',
    dailyQuestionsCount: 0,
  };
}
