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
  /**
   * The same progress measured on the ladders (see `ladderProgress`). Anything
   * that rewards passing levels also accepts these, so the reward does not
   * depend on which button she pressed to make the progress.
   */
  rungsClimbed: number;
  topicsAtTop: number;
  questionsAnswered: number;
  sessionCorrect: number;
  sessionTotal: number;
  dailyChallengeStreak?: number;
  dailyChallengesCompleted?: number;
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
    description: 'Levelled up for the first time',
    check: (ctx) => ctx.totalLevelsCompleted >= 1 || ctx.rungsClimbed >= 1,
  },
  {
    id: 'five_levels',
    title: 'Level Master',
    emoji: '🎓',
    description: 'Levelled up 5 times',
    check: (ctx) => ctx.totalLevelsCompleted >= 5 || ctx.rungsClimbed >= 5,
  },
  {
    id: 'category_complete',
    title: 'Topic Champ!',
    emoji: '👑',
    description: 'Climbed a topic to the top',
    check: (ctx) => ctx.categoriesCompleted >= 1 || ctx.topicsAtTop >= 1,
  },
  {
    id: 'daily_challenge_first',
    title: 'Challenge Accepted!',
    emoji: '🎯',
    description: 'Completed your first daily challenge',
    check: (ctx) => (ctx.dailyChallengesCompleted ?? 0) >= 1,
  },
  {
    id: 'daily_challenge_7',
    title: 'Challenge Streak!',
    emoji: '🗓️',
    description: 'Completed the daily challenge 7 days in a row',
    check: (ctx) => (ctx.dailyChallengeStreak ?? 0) >= 7,
  },
  {
    id: 'daily_challenge_30',
    title: 'Challenge Champion!',
    emoji: '🏆',
    description: 'Completed the daily challenge 30 days in a row',
    check: (ctx) => (ctx.dailyChallengeStreak ?? 0) >= 30,
  },
];
