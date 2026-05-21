export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (ctx: BadgeCheckContext) => boolean;
}

export interface BadgeCheckContext {
  totalStars: number;
  currentStreak: number;
  longestStreak: number;
  consecutiveCorrect: number;
  categoriesCompleted: number;
  totalLevelsCompleted: number;
  sessionCorrect: number;
  sessionTotal: number;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_star',
    title: 'First Star!',
    emoji: '⭐',
    description: 'Earned your very first star',
    check: (ctx) => ctx.totalStars >= 1,
  },
  {
    id: 'ten_stars',
    title: 'Star Collector',
    emoji: '🌟',
    description: 'Earned 10 stars total',
    check: (ctx) => ctx.totalStars >= 10,
  },
  {
    id: 'fifty_stars',
    title: 'Star Champion',
    emoji: '💫',
    description: 'Earned 50 stars total',
    check: (ctx) => ctx.totalStars >= 50,
  },
  {
    id: 'hundred_stars',
    title: 'Star Legend',
    emoji: '🏆',
    description: 'Earned 100 stars total',
    check: (ctx) => ctx.totalStars >= 100,
  },
  {
    id: 'perfect_session',
    title: 'Perfect!',
    emoji: '✨',
    description: 'Got every question right in a session',
    check: (ctx) => ctx.sessionTotal >= 5 && ctx.sessionCorrect === ctx.sessionTotal,
  },
  {
    id: 'streak_3',
    title: 'On a Roll!',
    emoji: '🔥',
    description: 'Played 3 days in a row',
    check: (ctx) => ctx.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Super Streak!',
    emoji: '🌈',
    description: 'Played 7 days in a row',
    check: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: 'correct_5',
    title: 'Hot Streak!',
    emoji: '⚡',
    description: '5 correct answers in a row',
    check: (ctx) => ctx.consecutiveCorrect >= 5,
  },
  {
    id: 'correct_10',
    title: 'On Fire!',
    emoji: '🚀',
    description: '10 correct answers in a row',
    check: (ctx) => ctx.consecutiveCorrect >= 10,
  },
  {
    id: 'first_level',
    title: 'Level Up!',
    emoji: '🎉',
    description: 'Completed your first level',
    check: (ctx) => ctx.totalLevelsCompleted >= 1,
  },
  {
    id: 'five_levels',
    title: 'Level Master',
    emoji: '🎓',
    description: 'Completed 5 levels',
    check: (ctx) => ctx.totalLevelsCompleted >= 5,
  },
  {
    id: 'category_complete',
    title: 'Category Champ!',
    emoji: '👑',
    description: 'Completed all levels in a category',
    check: (ctx) => ctx.categoriesCompleted >= 1,
  },
];
