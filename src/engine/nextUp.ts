import { UserProgress, Level } from '@/types';
import { CATEGORIES } from '@/data/categories';

// What to play next.
//
// Eleven equally-weighted category tiles is a wall of doors, not a path. This
// picks the single most sensible thing for her to do right now so the home
// screen can lead with one button:
//
//   1. a level she has started but not passed — finish what you began
//   2. the newest level she has unlocked but never tried
//   3. the first unlocked level of the category she has made least progress in
//
// Returns null only when every level in the app is completed.

export interface NextUp {
  level: Level;
  categoryId: string;
  categoryTitle: string;
  categoryEmoji: string;
  bgColor: string;
  /** Why this one — used for the subtitle. */
  reason: 'continue' | 'new' | 'fresh';
}

export function findNextUp(progress: UserProgress): NextUp | null {
  const wrap = (level: Level, reason: NextUp['reason']): NextUp => {
    const cat = CATEGORIES.find((c) => c.id === level.categoryId)!;
    return {
      level,
      categoryId: cat.id,
      categoryTitle: cat.title,
      categoryEmoji: cat.emoji,
      bgColor: cat.bgColor,
      reason,
    };
  };

  let started: { level: Level; lastPlayed: number } | null = null;
  let newest: { level: Level; unlockedAt: number } | null = null;
  let fallback: { level: Level; done: number } | null = null;

  for (const cat of CATEGORIES) {
    const catProg = progress.categories?.[cat.id];
    if (!catProg) continue;
    const done = Object.values(catProg.levels).filter((l) => l.status === 'completed').length;

    for (const level of cat.levels) {
      const state = catProg.levels[level.id];
      if (!state || state.status === 'locked') continue;

      if (state.status !== 'completed' && state.totalAttempts > 0) {
        if (!started || state.lastPlayed > started.lastPlayed) {
          started = { level, lastPlayed: state.lastPlayed };
        }
      }
      if (state.status === 'unlocked' && state.totalAttempts === 0) {
        const at = state.unlockedAt ?? 0;
        if (!newest || at > newest.unlockedAt) newest = { level, unlockedAt: at };
        if (!fallback || done < fallback.done) fallback = { level, done };
      }
    }
  }

  if (started) return wrap(started.level, 'continue');
  if (newest) return wrap(newest.level, 'new');
  if (fallback) return wrap(fallback.level, 'fresh');
  return null;
}
